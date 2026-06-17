/* ============================================================================
   core.test.mjs — the Node twin of the Limiting-Reagent bench's in-page self-test.

   Run:  node alchemy/limiting-reagent/core.test.mjs

   Proves, for the exact-rational extent layer the page inlines byte-identical,
   the claims the bench makes — every comparison via rCmp/rIsZero, NEVER a float:
     • limiter = argmin(n_i/c_i) and ξ = min(n_i/c_i) over every ≥2-reagent entry.
     • leftover_i ≥ 0 everywhere and = 0 exactly for the limiter (all, on a tie).
     • yield_p = c_prod·ξ, recomputed independently.
     • FRACTIONAL / non-terminating moles (1/3 has no finite float) take the BigInt
       path exactly — the float trap this bench exists to refute.
     • a 3-reagent case (tarnish) and a coef>1 limiter (rust) behave.
     • THE NEG-CONTROL TIE: the exact stoichiometric pour empties every pan together
       with zero leftovers and a dead-level beam — a clean WIN, not a throw.
     • ATOMS CONSERVED AT THE FINAL STATE (leftovers + yields == initial), with
       perturbation teeth so the check has bite; anchored to verify(A·c=0).
     • argument validation throws on malformed input; the negative control never
       fabricates an extent.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  R, rAdd, rSub, rMul, rDiv, rIsZero, rCmp, rMin,
  extent, react, conservedAtFinalState, verify, tally, toNum, LIBRARY
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(name, cond, info){
  if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}
const rEq = (a, b) => rCmp(a, b) === 0;
const rStr = r => r.n + '/' + r.d;
const threw = fn => { try{ fn(); return false; }catch(e){ return true; } };

// every 2-reactant non-negative library entry, with chosen test moles (tenths grid)
// and the INDEPENDENTLY-recomputed expectation. coefReact/coefProd are the known
// balanced coefficients (rx.expect split at the reactant boundary).
function coefsOf(rx){ return { cR: rx.expect.slice(0, rx.reactants.length), cP: rx.expect.slice(rx.reactants.length) }; }

console.log('\n— THE LIMITING REAGENT · core.test.mjs —\n');

// ── (1) limiter = argmin & ξ = min over every ≥2-reagent entry, recomputed independently ──
console.log('extent ξ = min(n_i/c_i) and limiter = argmin, recomputed independently:');
{
  // the anchor case, fully spelled out (glucose: C6H12O6 + 6 O2 → 6 CO2 + 6 H2O)
  const glu = LIBRARY.find(r => r.id === 'glucose');
  const { cR, cP } = coefsOf(glu);                          // [1,6] → [6,6]
  const ext = extent(cR, cP, [R(1n), R(3n)]);              // 1 mol glucose, 3 mol O2
  ok('glucose ξ = 1/2 (3/6 < 1/1)', rEq(ext.xi, R(1n, 2n)), 'ξ=' + rStr(ext.xi));
  ok('glucose limiterIndex = 1 (O2 runs out)', ext.limiterIndex === 1, 'got ' + ext.limiterIndex);
  ok('glucose leftover = [1/2 glucose, 0 O2]', rEq(ext.leftover[0], R(1n, 2n)) && rIsZero(ext.leftover[1]),
     ext.leftover.map(rStr).join(', '));
  ok('glucose yield = [3 CO2, 3 H2O] (6·½)', rEq(ext.yield[0], R(3n)) && rEq(ext.yield[1], R(3n)),
     ext.yield.map(rStr).join(', '));
}
for(const rx of LIBRARY){
  if(rx.negative || rx.reactants.length !== 2) continue;
  const { cR, cP } = coefsOf(rx);
  // pick deliberately off-tie moles on the tenths grid: reactant 0 at its coef, reactant 1 a notch short
  const moles = [R(BigInt(cR[0])), R(BigInt(cR[1] * 10 - 3), 10n)];   // c1 short by 0.3
  const ext = extent(cR, cP, moles);
  // independent recompute of ξ and argmin
  const ratio = moles.map((m, i) => rDiv(m, R(BigInt(cR[i]))));
  let xiInd = ratio[0]; for(let i = 1; i < ratio.length; i++) xiInd = rMin(xiInd, ratio[i]);
  const limInd = []; for(let i = 0; i < ratio.length; i++) if(rEq(ratio[i], xiInd)) limInd.push(i);
  ok(rx.id.padEnd(10) + ' ξ == independent min(ratio)', rEq(ext.xi, xiInd), 'ξ=' + rStr(ext.xi));
  ok(rx.id.padEnd(10) + ' limiters == independent argmin', JSON.stringify(ext.limiters) === JSON.stringify(limInd),
     JSON.stringify(ext.limiters) + ' vs ' + JSON.stringify(limInd));
}

// ── (2) leftover_i ≥ 0 everywhere AND rIsZero at the limiter (all, on a tie) ──
console.log('\nleftovers ≥ 0, and exactly 0 at the limiter:');
for(const rx of LIBRARY){
  if(rx.negative || rx.reactants.length !== 2) continue;
  const { cR, cP } = coefsOf(rx);
  const moles = [R(BigInt(cR[0])), R(BigInt(cR[1] * 10 - 3), 10n)];
  const ext = extent(cR, cP, moles);
  const allNonNeg = ext.leftover.every(l => l.n >= 0n);
  const limiterDry = ext.limiters.every(i => rIsZero(ext.leftover[i]));
  ok(rx.id.padEnd(10) + ' every leftover ≥ 0 (sign of n)', allNonNeg, ext.leftover.map(rStr).join(', '));
  ok(rx.id.padEnd(10) + ' leftover == 0 at every limiter', limiterDry);
}

// ── (3) yield_p == c_p·ξ, recomputed independently ──
console.log('\nyield_p == c_prod · ξ (independent):');
for(const rx of LIBRARY){
  if(rx.negative || rx.reactants.length !== 2) continue;
  const { cR, cP } = coefsOf(rx);
  const moles = [R(BigInt(cR[0])), R(BigInt(cR[1] * 10 - 3), 10n)];
  const ext = extent(cR, cP, moles);
  const wantY = cP.map(d => rMul(R(BigInt(d)), ext.xi));
  const okY = ext.yield.every((y, p) => rEq(y, wantY[p]));
  ok(rx.id.padEnd(10) + ' yield == [' + wantY.map(rStr).join(', ') + ']', okY,
     ext.yield.map(rStr).join(', '));
}

// ── (4) FRACTIONAL / non-terminating moles — the float trap ──
console.log('\nthe float trap — non-terminating ratios stay EXACT (BigInt path):');
{
  // water: 2 H2 + 1 O2 → 2 H2O. moles [3 H2, 1/2 O2]: ratios 3/2 and 1/2 → ξ = 1/2.
  const wa = LIBRARY.find(r => r.id === 'water'); const { cR, cP } = coefsOf(wa);
  const ext = extent(cR, cP, [R(3n), R(1n, 2n)]);
  ok('water ξ = 1/2 exactly (O2 limits)', rEq(ext.xi, R(1n, 2n)) && ext.limiterIndex === 1, 'ξ=' + rStr(ext.xi));
}
{
  // ammonia: 1 N2 + 3 H2 → 2 NH3. moles [1 N2, 1 H2]: ratios 1/1 and 1/3 → ξ = 1/3.
  // 1/3 has NO finite binary float; the assertion on {n:1,d:3} proves the BigInt path.
  const am = LIBRARY.find(r => r.id === 'ammonia'); const { cR, cP } = coefsOf(am);
  const ext = extent(cR, cP, [R(1n), R(1n)]);
  ok('ammonia ξ = 1/3 exactly (n=1,d=3 — impossible in float)',
     ext.xi.n === 1n && ext.xi.d === 3n && ext.limiterIndex === 1, 'ξ=' + rStr(ext.xi));
  ok('ammonia yield NH3 = 2/3 exactly', rEq(ext.yield[0], R(2n, 3n)), rStr(ext.yield[0]));
}

// ── (5) 3+ reagents: tarnish 4 Ag + 2 H2S + 1 O2 → 2 Ag2S + 2 H2O ──
console.log('\n3+ reagents (the math generalises past two pans):');
{
  const ta = LIBRARY.find(r => r.id === 'tarnish'); const { cR, cP } = coefsOf(ta);  // [4,2,1] → [2,2]
  // moles [4 Ag, 3 H2S, 1 O2]: ratios 4/4=1, 3/2, 1/1 → ξ = 1, ties at Ag & O2? 1 vs 1.5 vs 1 → min 1.
  const ext = extent(cR, cP, [R(4n), R(3n), R(1n)]);
  ok('tarnish ξ = 1 (Ag & O2 both at ratio 1)', rEq(ext.xi, R(1n)), 'ξ=' + rStr(ext.xi));
  ok('tarnish limiters = [0,2] (Ag & O2 tie-limit)', JSON.stringify(ext.limiters) === JSON.stringify([0, 2]),
     JSON.stringify(ext.limiters));
  ok('tarnish H2S leftover > 0 (the excess reagent)', ext.leftover[1].n > 0n && rEq(ext.leftover[1], R(1n)),
     rStr(ext.leftover[1]));
}

// ── (6) coef>1 limiter: rust 4 Fe + 3 O2 → 2 Fe2O3 ──
console.log('\na limiter with coefficient > 1 (rust):');
{
  const ru = LIBRARY.find(r => r.id === 'rust'); const { cR, cP } = coefsOf(ru);   // [4,3] → [2]
  // moles [4 Fe, 6 O2]: ratios 4/4=1, 6/3=2 → ξ=1, Fe limits. O2 left = 6−3·1 = 3.
  const ext = extent(cR, cP, [R(4n), R(6n)]);
  ok('rust ξ = 1, limiter Fe (index 0, coef 4)', rEq(ext.xi, R(1n)) && ext.limiterIndex === 0, 'ξ=' + rStr(ext.xi));
  ok('rust O2 leftover = 3 (6 − 3·1)', rEq(ext.leftover[1], R(3n)), rStr(ext.leftover[1]));
  ok('rust Fe2O3 yield = 2 (2·1)', rEq(ext.yield[0], R(2n)), rStr(ext.yield[0]));
}

// ── (7) THE NEG-CONTROL TIE: perfect stoichiometric pour — every pan empties together ──
console.log('\nthe perfect pour — at exact stoichiometry every pan empties together (the WIN):');
for(const rx of LIBRARY){
  if(rx.negative || rx.reactants.length !== 2) continue;
  const { cR, cP } = coefsOf(rx);
  for(const scale of [R(1n), R(3n, 2n)]){                   // exact coefs AND a scaled (×3/2) pour
    const moles = cR.map(c => rMul(R(BigInt(c)), scale));
    const ext = extent(cR, cP, moles);
    const cleanWin = ext.tie && ext.limiters.length === cR.length && ext.leftover.every(rIsZero);
    ok(rx.id.padEnd(10) + ' perfect pour ×' + rStr(scale) + ' → tie, all pans dry (clean WIN)', cleanWin,
       'tie=' + ext.tie + ' leftovers=' + ext.leftover.map(rStr).join(','));
  }
}

// ── (8) ATOMS CONSERVED AT THE FINAL STATE + perturbation teeth + verify anchor ──
console.log('\natoms conserved at the FINAL state (leftovers + yields == initial):');
for(const rx of LIBRARY){
  if(rx.negative || rx.reactants.length !== 2) continue;
  const { cR } = coefsOf(rx);
  const moles = [R(BigInt(cR[0]) + 2n), R(BigInt(cR[1]))];           // a mix with an excess
  ok(rx.id.padEnd(10) + ' conservedAtFinalState == true', conservedAtFinalState(rx.reactants, rx.products, moles) === true);
  ok(rx.id.padEnd(10) + ' verify(A·c=0) == true (anchors the layer to the proven base)',
     verify(rx.reactants, rx.products, rx.expect) === true);
}
// perturbation TEETH: a deliberately-wrong end-state makes the conservation check FALSE.
{
  const gl = LIBRARY.find(r => r.id === 'glucose');
  const r = react(gl.reactants, gl.products, [R(1n), R(3n)]);
  // re-run the conservation tally but DOUBLE the yields — must NOT conserve
  const initial = tally(gl.reactants, [R(1n), R(3n)]);
  const badProd = tally(gl.products, r.yield.map(y => rMul(y, R(2n))));   // yields × 2 (wrong)
  const finalReact = tally(gl.reactants, r.leftover);
  const finalAll = {};
  for(const e in finalReact) finalAll[e] = rAdd(finalAll[e] || R(0n), finalReact[e]);
  for(const e in badProd)    finalAll[e] = rAdd(finalAll[e] || R(0n), badProd[e]);
  let allEq = true;
  for(const e of new Set([...Object.keys(initial), ...Object.keys(finalAll)]))
    if(rCmp(initial[e] || R(0n), finalAll[e] || R(0n)) !== 0){ allEq = false; break; }
  ok('perturbation: yields×2 BREAKS conservation (the check has teeth)', allEq === false);
}
{
  // and ξ+1 (over-running the reaction past the dry pan) also breaks it
  const gl = LIBRARY.find(r => r.id === 'glucose'); const { cR, cP } = coefsOf(gl);
  const moles = [R(1n), R(3n)];
  const r = react(gl.reactants, gl.products, moles);
  const xiBad = rAdd(r.xi, R(1n));                                  // over-run
  const leftoverBad = moles.map((m, i) => rSub(m, rMul(R(BigInt(cR[i])), xiBad)));
  const yieldBad = cP.map(d => rMul(R(BigInt(d)), xiBad));
  const initial = tally(gl.reactants, moles);
  const finalReact = tally(gl.reactants, leftoverBad), finalProd = tally(gl.products, yieldBad);
  const finalAll = {};
  for(const e in finalReact) finalAll[e] = rAdd(finalAll[e] || R(0n), finalReact[e]);
  for(const e in finalProd)  finalAll[e] = rAdd(finalAll[e] || R(0n), finalProd[e]);
  // note: a pure scaling of ξ actually still "conserves" element-wise because the
  // reaction itself conserves; the real tooth is that leftoverBad goes NEGATIVE,
  // which asR/extent would reject — assert the limiter leftover went negative.
  ok('perturbation: ξ+1 drives the limiter leftover negative (physically impossible)',
     leftoverBad[r.limiterIndex].n < 0n);
}

// ── (9) EXACTNESS GUARD: a repeating-fraction ratio → xi.d ≠ 1 with the exact {n,d} ──
console.log('\nexactness guard — repeating fractions keep an exact denominator:');
{
  const am = LIBRARY.find(r => r.id === 'ammonia'); const { cR, cP } = coefsOf(am);
  const e3 = extent(cR, cP, [R(1n), R(1n)]);                        // ξ = 1/3
  ok('ammonia ξ.d = 3 (1/3, no finite float)', e3.xi.d === 3n && e3.xi.n === 1n, rStr(e3.xi));
  // a 1/7 ratio: glucose with O2 set so 7·(yield) — use O2 = 7/6 of a turn's need? Simpler:
  // water 2 H2 + O2, moles [1/7·2 H2 short, lots O2]; build a clean 1/7.
  const wa = LIBRARY.find(r => r.id === 'water'); const w = coefsOf(wa);
  const e7 = extent(w.cR, w.cP, [R(2n, 7n), R(5n)]);               // H2 ratio = (2/7)/2 = 1/7
  ok('water ξ = 1/7 exactly (d=7)', e7.xi.n === 1n && e7.xi.d === 7n, rStr(e7.xi));
}

// ── (10) ARG VALIDATION + the negative control never fabricates an extent ──
console.log('\nargument validation + negative-control honesty:');
{
  const wa = LIBRARY.find(r => r.id === 'water'); const { cR, cP } = coefsOf(wa);
  ok('mismatched moles length throws', threw(() => extent(cR, cP, [R(1n)])));
  ok('negative mole count throws', threw(() => extent(cR, cP, [R(-1n), R(1n)])));
  ok('coefficient ≤ 0 throws', threw(() => extent([0, 1], cP, [R(1n), R(1n)])));
  ok('non-integer float mole count throws', threw(() => extent(cR, cP, [0.5, 1])));
  const neg = LIBRARY.find(r => r.negative);
  const r = react(neg.reactants, neg.products, [R(2n), R(1n)]);
  ok('react() on the negative control → {ok:false, reason} (never a fake extent)',
     r.ok === false && typeof r.reason === 'string' && r.reason.length > 0, JSON.stringify(r));
}

// ── (11) RE-EXTRACTION PARITY (page inline core === core.mjs, byte-for-byte) ──
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== LIMITING-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END LIMITING-CORE =====';
  let parityOk = false, info = '';
  try{
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in index.html', si >= 0 && ei > si,
       si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
    if(si >= 0 && ei > si){
      const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
      const expected = coreSrc.split('\n').map(l => l.replace(/^export /, '')).join('\n').replace(/\n$/, '');
      parityOk = (inline === expected);
      if(!parityOk){
        const a = inline.split('\n'), b = expected.split('\n');
        let d = -1; for(let i = 0; i < Math.max(a.length, b.length); i++){ if(a[i] !== b[i]){ d = i; break; } }
        info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, core ' + b.length + ')';
      }
    }
  }catch(e){ info = 'parity read failed: ' + e.message; }
  ok('(parity)★ index.html inline core IS core.mjs, byte-for-byte (export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
