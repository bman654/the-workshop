/* ============================================================================
   core.test.mjs — the Node twin of Le Chatelier's Vise's in-page self-test.

   Run:  node alchemy/equilibrium/core.test.mjs

   Proves, for the float+tolerance equilibrium core the page inlines byte-identical,
   the claims the bench makes — every claim asserted to the PUBLIC tolerance
   TOL_SETTLE (the register is honest: ξ* is a transcendental root, so this is a
   tolerance proof, not a fake-exact one):
     (1) Q ≡ K after EVERY settle, over a (V,T) grid for each non-control reaction.
     (2) ξ* lands in the feasible box: every settled mole > 0.
     (3) THE SQUEEZE shifts toward fewer molecules: halve V on Haber → Q≡K again,
         the product band strictly rose, and sign(Δξ)·sign(−Δn_gas) > 0 generally.
     (4) THE NEGATIVE CONTROL ★: HI (Δn=0), halve AND double V → |Δξ| < TOL and the
         product is unmoved. The shift is real physics, not cosmetics.
     (5) van't Hoff sign: heat lowers K for an exothermic reaction and re-settling
         hot yields strictly less product — PLUS an endothermic tooth (flip ΔH>0 in
         a local copy → the heat direction REVERSES), so the sign has bite.
     (6) MONOTONICITY: Q(ξ) strictly increases across a sampled feasible grid — the
         reason bisection is unconditional.
     (7) FIXED-POINT teeth: Q(ξ*+δ) > K and Q(ξ*−δ) < K.
     (8) IDEMPOTENT re-settle: re-settling an already-settled mixture moves δξ ≈ 0.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   Exits non-zero on any failure so CI / a human sees RED.
   ============================================================================ */

import {
  R_GAS, TOL_SETTLE, nuOf, Keq, feasibleRange, reactionQuotient, settle, reSettle, toNum, LIBRARY
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
const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;

// a generic loaded mixture for a reaction: reactants in at 2× coef, products at 0
function loadOf(rx){ return rx.coef.map((c, j) => j < rx.split ? c * 2 : 0); }

console.log('\n— LE CHATELIER\'S VISE · core.test.mjs —\n');

// ── (1) Q ≡ K AFTER EVERY SETTLE, over a (V,T) grid for each non-control reaction ──
console.log('Q ≡ K after every settle, over a (V,T) grid:');
for(const rx of LIBRARY){
  const n0 = loadOf(rx);
  let worst = 0;
  for(const V of [0.5, 1, 2, 4]){
    for(const T of [rx.Tref * 0.85, rx.Tref, rx.Tref * 1.15]){
      const s = reSettle(rx, n0, V, T);
      if(!s.clamped) worst = Math.max(worst, Math.abs(s.Q - s.K) / Math.max(1, s.K));
    }
  }
  ok(rx.id.padEnd(6) + ' |Q−K|/max(1,K) ≤ TOL_SETTLE over the grid', worst <= TOL_SETTLE, 'worst=' + worst.toExponential(3));
}

// ── (2) ξ* in the feasible box: every settled mole > 0 ──
console.log('\nξ* lands in the feasible box — every settled mole > 0:');
for(const rx of LIBRARY){
  const n0 = loadOf(rx);
  const s = reSettle(rx, n0, 2, rx.Tref);
  ok(rx.id.padEnd(6) + ' every settled mole > 0', s.moles.every(m => m > 0), s.moles.map(m => m.toFixed(4)).join(', '));
}

// ── (3) THE SQUEEZE: halve V → Q≡K again, product rose, sign(Δξ)·sign(−Δn_gas)>0 ──
console.log('\nthe squeeze — halve V shifts toward fewer molecules:');
{
  const haber = LIBRARY.find(r => r.id === 'haber');
  const n0 = loadOf(haber);
  const before = reSettle(haber, n0, 2, haber.Tref);
  const after  = reSettle(haber, n0, 1, haber.Tref);     // HALVE V
  ok('haber  squeeze: Q ≡ K again after the squeeze', Math.abs(after.Q - after.K) / Math.max(1, after.K) <= TOL_SETTLE);
  ok('haber  squeeze: NH₃ strictly rose (the product band swells)', after.moles[2] > before.moles[2] + TOL_SETTLE,
     before.moles[2].toFixed(4) + ' → ' + after.moles[2].toFixed(4));
  ok('haber  squeeze: both reactant bands shrank', after.moles[0] < before.moles[0] && after.moles[1] < before.moles[1]);
}
for(const rx of LIBRARY){
  const dn = nuOf(rx).reduce((a, x) => a + x, 0);
  if(dn === 0) continue;
  const n0 = loadOf(rx);
  const before = reSettle(rx, n0, 2, rx.Tref);
  const after  = reSettle(rx, n0, 1, rx.Tref);
  const dXi = after.xi - before.xi;
  ok(rx.id.padEnd(6) + ' sign(Δξ)·sign(−Δn_gas) > 0 (shift toward fewer molecules)',
     sgn(dXi) * sgn(-before.dnGas) > 0, 'Δξ=' + dXi.toExponential(3) + ' Δn=' + before.dnGas);
}

// ── (4) THE NEGATIVE CONTROL ★: HI (Δn=0) — halve AND double V → no shift ──
console.log('\nthe negative control ★ — Δn_gas = 0 means a squeeze does NOTHING:');
{
  const hi = LIBRARY.find(r => r.negativeControl);
  const n0 = loadOf(hi);
  const base = reSettle(hi, n0, 2, hi.Tref);
  ok('hi     Δn_gas = 0 (derived from nuOf, not hardcoded)', base.dnGas === 0, 'dnGas=' + base.dnGas);
  for(const V of [1, 4]){                                  // HALVE and DOUBLE
    const s = reSettle(hi, n0, V, hi.Tref);
    ok('hi     V=' + V + ': |Δξ| < TOL (the bands hold)', Math.abs(s.xi - base.xi) < TOL_SETTLE,
       'Δξ=' + (s.xi - base.xi).toExponential(3));
    ok('hi     V=' + V + ': |ΔHI| < TOL (the product is unmoved)', Math.abs(s.moles[2] - base.moles[2]) < TOL_SETTLE,
       'ΔHI=' + (s.moles[2] - base.moles[2]).toExponential(3));
  }
}

// ── (5) van't Hoff: heat lowers K (exo) + less product hot; PLUS an endothermic tooth ──
console.log('\nvan\'t Hoff — heat lowers K for exo, less product hot; the endothermic tooth reverses:');
{
  const haber = LIBRARY.find(r => r.id === 'haber');
  ok('haber  heat lowers K (exothermic: Keq(1.2·Tref) < Keq(Tref))', Keq(haber, haber.Tref * 1.2) < Keq(haber, haber.Tref),
     Keq(haber, haber.Tref * 1.2).toExponential(3) + ' < ' + Keq(haber, haber.Tref).toExponential(3));
  const n0 = loadOf(haber);
  const cold = reSettle(haber, n0, 2, haber.Tref);
  const hot  = reSettle(haber, n0, 2, haber.Tref * 1.2);
  ok('haber  re-settling HOT yields strictly less product (exo backs off)', hot.moles[2] < cold.moles[2] - TOL_SETTLE,
     'cold ' + cold.moles[2].toFixed(4) + ' hot ' + hot.moles[2].toFixed(4));
  // the endothermic TOOTH: flip ΔH>0 in a local copy → the heat direction REVERSES
  const endo = { ...haber, dH: -haber.dH };               // now endothermic
  const ecold = reSettle(endo, n0, 2, endo.Tref);
  const ehot  = reSettle(endo, n0, 2, endo.Tref * 1.2);
  ok('endo★  flip ΔH>0 → heat RAISES K', Keq(endo, endo.Tref * 1.2) > Keq(endo, endo.Tref));
  ok('endo★  flip ΔH>0 → re-settling hot yields MORE product (direction reverses)', ehot.moles[2] > ecold.moles[2] + TOL_SETTLE,
     'cold ' + ecold.moles[2].toFixed(4) + ' hot ' + ehot.moles[2].toFixed(4));
}

// ── (6) MONOTONICITY: Q(ξ) strictly increases across a sampled feasible grid ──
console.log('\nmonotonicity — Q(ξ) strictly increases across the feasible window (why bisection is unconditional):');
for(const rx of LIBRARY){
  const n0 = loadOf(rx), nu = nuOf(rx);
  const [lo, hi] = feasibleRange(n0, nu);
  let mono = true, prev = -Infinity;
  for(let k = 1; k < 200; k++){
    const xi = lo + (hi - lo) * k / 200;
    const q = reactionQuotient(n0, nu, xi, 2);
    if(q <= prev){ mono = false; break; }
    prev = q;
  }
  ok(rx.id.padEnd(6) + ' Q strictly increasing across [' + lo.toFixed(3) + ', ' + hi.toFixed(3) + ']', mono);
}

// ── (7) FIXED-POINT teeth: Q(ξ*+δ) > K and Q(ξ*−δ) < K ──
console.log('\nfixed-point teeth — Q(ξ*±δ) straddles K:');
for(const rx of LIBRARY){
  const n0 = loadOf(rx), nu = nuOf(rx), K = Keq(rx, rx.Tref);
  const [lo, hi] = feasibleRange(n0, nu);
  const s = settle(n0, nu, 2, K);
  const d = 1e-4 * (hi - lo);
  const up = reactionQuotient(n0, nu, s.xi + d, 2), dn = reactionQuotient(n0, nu, s.xi - d, 2);
  ok(rx.id.padEnd(6) + ' Q(ξ*+δ) > K and Q(ξ*−δ) < K', up > K && dn < K, 'up=' + up.toExponential(3) + ' K=' + K.toExponential(3) + ' dn=' + dn.toExponential(3));
}

// ── (8) IDEMPOTENT re-settle: re-settling an already-settled mixture moves δξ ≈ 0 ──
console.log('\nidempotent re-settle — re-settling a settled state barely moves:');
for(const rx of LIBRARY){
  const n0 = loadOf(rx);
  const once = reSettle(rx, n0, 2, rx.Tref);
  const twice = reSettle(rx, once.moles, 2, rx.Tref);     // feed the settled moles back in
  ok(rx.id.padEnd(6) + ' |δξ| on re-settle < TOL_SETTLE', Math.abs(twice.xi) < TOL_SETTLE, '|δξ|=' + Math.abs(twice.xi).toExponential(3));
}

// ── (9) RE-EXTRACTION PARITY (page inline core === core.mjs, byte-for-byte) ──
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== EQUILIBRIUM-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END EQUILIBRIUM-CORE =====';
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
