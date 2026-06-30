// The Eddy Brake — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() (identical to the in-page pill), proves the five
//   rows independently over a dense σ-sweep, RE-EXTRACTS the inlined brake core from
//   index.html and proves the page core === the module core (byte-twin), asserts the
//   brake's Lenz SIGN CONVENTION AGREES with the imported Hall authority's Lenz-ON/OFF
//   ledger (the SAME conservation hinge), and asserts the Hall parent stays a byte-
//   untouched oracle. Exits 0 only when every assertion holds.
import * as Hall from '../core.mjs';        // the PARENT Lenz authority, BYTE-UNTOUCHED
import * as Core from './core.mjs';         // the eddy-brake authority
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Lodestone Hall · The Eddy Brake — Node cross-check\n');
const S = Core.SCENE;
const EPS = 1e-9;

// ── §0. the shared self-test (identical to the in-page pill) ─────────────────
console.log('— §0 shared runSelfTest() (the SAME assertions the in-page pill runs) —');
const moduleRes = Core.runSelfTest();
for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);

// ── §ROW 1: AT TERMINAL VELOCITY DRAG === GRAVITY over a dense INDEPENDENT sweep ─
console.log('\n— §ROW1: at v_term, b·v_term === m·g  (the brake balances gravity), dense σ-sweep —');
{
  let worst = 0, where = '';
  for (let i = 1; i <= 1000; i++){
    const sigma = i/1000;                                  // σ ∈ (0,1]
    const b = Core.damping(sigma, +1);
    const vt = Core.vTerminal(sigma);
    const d = Math.abs(b*vt - S.m*S.g);                    // exactly 0
    if (d > worst){ worst = d; where = `σ=${sigma.toFixed(3)}`; }
  }
  ok('(balance)★ b·v_term === m·g to <1e-9 over the dense σ-sweep (drag balances gravity)',
     worst < EPS, `worst |b·v_term − mg| ${worst.toExponential(2)} @ ${where}`);
}

// ── §ROW 2: v_term ∝ 1/σ EXACTLY (v_term·σ constant) over a dense sweep ────────
console.log('\n— §ROW2: v_term ∝ 1/σ exactly — v_term(σ)·σ === m·g/k for every σ>0 —');
{
  const ref = S.m*S.g/S.k;
  let worst = 0, where = '';
  for (let i = 1; i <= 1000; i++){
    const sigma = i/1000;
    const prod = Core.vTerminal(sigma) * sigma;            // = m·g/k, constant
    const d = Math.abs(prod - ref);
    if (d > worst){ worst = d; where = `σ=${sigma.toFixed(3)}`; }
  }
  // and the inverse-proportion is genuine: halving σ DOUBLES v_term (not vacuously flat)
  const spread = Core.vTerminal(0.1) / Core.vTerminal(1.0);
  ok('(inv-σ)★ v_term·σ === m·g/k to <1e-9 across the sweep (v_term ∝ 1/σ, not approximately)',
     worst < EPS, `worst |v_term·σ − mg/k| ${worst.toExponential(2)} @ ${where}`);
  ok('(inv-σ)★ the proportion is REAL: v_term(0.1σ) === 10·v_term(σ) (a vacuous-flat pass FAILS)',
     Math.abs(spread - 10) < 1e-9, `v_term(0.1)/v_term(1.0) = ${spread.toFixed(6)} (expected 10)`);
}

// ── §ROW 3: ENERGY BALANCE m·g·h === ΔKE + Q over the descent, dense σ-sweep ────
console.log('\n— §ROW3: energy conserved — peDrop === ΔKE + Joule-heat Q over the descent, dense σ —');
{
  let worst = 0, where = '', maxQ = 0;
  // a denser/larger N than the pill, across many σ including the σ=0 free-fall case
  for (const sigma of [0, 0.05, 0.1, 0.28, 0.5, 0.61, 0.8, 1.0]){
    const r = Core.integrateDescent(sigma, 3.5, 40000, +1);
    const d = Math.abs(r.balance);
    maxQ = Math.max(maxQ, r.Q);
    if (d > worst){ worst = d; where = `σ=${sigma}`; }
  }
  ok('(energy)★ |peDrop − (ΔKE + Q)| < 1e-9 over the descent across the σ-sweep (PE → KE + heat)',
     worst < EPS, `worst residual ${worst.toExponential(2)} @ ${where}`);
  // the claim is not vacuous: real heat is dissipated at the conducting stops
  ok('(energy)★ the dissipation is REAL: max Joule-heat Q > 0 at the conducting stops (not a 0=0 pass)',
     maxQ > 1.0, `max Q over the sweep ${maxQ.toExponential(2)}`);
}

// ── §ROW 4: THE LENZ HINGE — ON conserves (Q≥0), OFF creates energy (Q<0) ──────
console.log('\n— §ROW4: the Lenz hinge — ON ⇒ Q≥0 & balance closed; OFF ⇒ Q<0 & ΔKE>mgh (free energy) —');
{
  const hinge = Core.checkLenzHinge();
  ok('(hinge)★ Lenz ON ⇒ Joule-heat Q ≥ 0 AND peDrop === ΔKE + Q (real dissipation, conserved)',
     hinge.onConserves, `Q_on ${hinge.on.Q.toExponential(2)}, balance ${hinge.on.balance.toExponential(2)}`);
  ok('(hinge)★ Lenz OFF ⇒ Q < 0 AND ΔKE > peDrop (energy created from nowhere — the free-energy alarm)',
     hinge.offCreates, `Q_off ${hinge.off.Q.toExponential(2)}, ΔKE−peDrop ${(hinge.off.ke - hinge.off.peDrop).toExponential(2)}`);
  // the OFF heat is exactly the NEGATIVE of an equal-magnitude ON heat at matched state?
  // No — OFF runs away (different trajectory). But the SIGN of Q flips with the Lenz sign
  // at MATCHED speed, which is the bit-level hinge:
  let signFlipWorst = 0;
  for (let i = 1; i <= 50; i++){
    const v = i*0.1, sigma = 0.7;
    const qOn  = Core.damping(sigma, +1) * v * v;   // heat power, Lenz ON  (≥0)
    const qOff = Core.damping(sigma, -1) * v * v;   // heat power, Lenz OFF (≤0)
    signFlipWorst = Math.max(signFlipWorst, Math.abs(qOn + qOff));   // exact negatives
  }
  ok('(hinge)★ the heat-power sign flips EXACTLY with the Lenz sign: b·v²|on === −(b·v²|off) to the bit',
     signFlipWorst < EPS, `worst |p_on + p_off| ${signFlipWorst.toExponential(2)} (the sign IS the hinge)`);
}

// ── §ROW 5: NEG-CONTROL — the PLASTIC tube (σ=0): free-fall, no heat, divergence ─
console.log('\n— §ROW5: NEG-CONTROL — plastic (σ=0) ⇒ drag≡0, Q≡0, v===g·t, v_term→∞ (the conductor brakes) —');
{
  const c = Core.checkPlasticFreeFall();
  ok('(neg-control)★ σ=0 ⇒ drag ≡ 0 EXACTLY at every speed (no eddy current, no brake)',
     c.dragWorst === 0, `max|drag| @ σ=0 ${c.dragWorst}`);
  ok('(neg-control)★ σ=0 ⇒ Joule-heat Q ≡ 0 EXACTLY (zero eddy rings — nothing to dissipate)',
     c.heat === 0, `Q @ σ=0 ${c.heat}`);
  ok('(neg-control)★ σ=0 ⇒ v(t) === g·t (pure free-fall, identical to the plain iron slug), <1e-9',
     c.vDefect < EPS, `|v(T) − g·T| ${c.vDefect.toExponential(2)}`);
  ok('(neg-control)★ v_term DIVERGES as σ→0 (Infinity at σ=0; no terminal velocity at all)',
     c.diverges && c.grow, `v_term(0)=∞ (${c.diverges}), v_term blows up as σ→0 (${c.grow})`);
  // and the in-pill neg-control row must itself be GREEN (asserting the falsifier holds)
  const negRow = moduleRes.checks.find(x => /NEG-CONTROL/.test(x.name));
  ok('(neg-control)★ the in-pill NEG-CONTROL row passes (asserting free-fall at σ=0) — the page flips it RED when SHOWN',
     !!negRow && negRow.pass, negRow ? negRow.info : 'row missing');
}

// ── §LENZ AUTHORITY — our brake's sign convention AGREES with the imported Hall ──
console.log('\n— §LENZ AUTHORITY: the brake reuses the Hall\'s Lenz-ON/OFF ledger — the SAME conservation hinge —');
{
  // The Hall's closedLoopHandWork is the wing's authority on the Lenz sign:
  //   Lenz ON ⇒ hand-work ∮ ≥ 0 (dissipation); Lenz OFF ⇒ ∮ < 0 (energy created).
  const hw = Hall.closedLoopHandWork(Hall.SCENE.m0, Hall.SCENE.phi, Hall.COIL, Hall.SCENE.N, Hall.SCENE.R);
  ok('(authority)★ the Hall authority: Lenz ON ∮hand-work ≥ 0 vs Lenz OFF ∮ < 0 (the parent\'s ledger holds)',
     hw.on >= 0 && hw.off < 0 && Math.abs(hw.on + hw.off) < 1e-9,
     `Hall ON ∮ ${hw.on.toExponential(2)}, OFF ∮ ${hw.off.toExponential(2)}`);
  // OUR brake's dissipation sign must AGREE with the Hall's hand-work sign, and BOTH
  // flip together under the Lenz-OFF cheat. Same convention, not a fork.
  const hinge = Core.checkLenzHinge();
  const agreeOn  = Math.sign(hinge.on.Q)  === Math.sign(hw.on);    // both ≥0 with Lenz ON
  const agreeOff = Math.sign(hinge.off.Q) === Math.sign(hw.off);   // both <0 with Lenz OFF
  ok('(authority)★ the brake\'s Joule-heat sign AGREES with the Hall hand-work sign — ON both ≥0, OFF both <0',
     agreeOn && agreeOff,
     `brake Q_on ${hinge.on.Q.toExponential(2)} / Hall ∮on ${hw.on.toExponential(2)} ; brake Q_off ${hinge.off.Q.toExponential(2)} / Hall ∮off ${hw.off.toExponential(2)}`);
}

// ── §BYTE-TWIN PARITY — re-extract the brake slice from index.html, char-identical
//    to core.mjs's slice, then EVAL it and confirm its self-test agrees ──────────
console.log('\n— §BYTE-TWIN PARITY: page brake core === module core (byte-twin) —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { ok('index.html present (forge built it)', false, 'MISSING — run: node tools/forge/forge.mjs lodestone-hall/the-eddy-brake/index.src.html'); }

  if (html){
    const B = '// === EDDY-BRAKE CORE BEGIN ===', E = '// === EDDY-BRAKE CORE END ===';
    const i = html.indexOf(B), j = html.indexOf(E);
    ok('inline brake sentinels present in index.html', i >= 0 && j > i,
       i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS — has forge built index.html?');

    if (i >= 0 && j > i){
      const pageSlice = html.slice(i, j + E.length);
      const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
      const mi = mod.indexOf(B), mj = mod.indexOf(E);
      const modSlice = mod.slice(mi, mj + E.length);

      ok('(0-teeth)★ inline brake slice (BEGIN..END) is char-for-char the module body',
         pageSlice === modSlice,
         pageSlice === modSlice ? `identical bytes (${modSlice.length} chars)`
         : `DRIFT: page ${pageSlice.length} vs module ${modSlice.length} chars`);

      ok('the inline slice contains no forge directive / ws.js leakage',
         !/forge:include/.test(pageSlice) && !/\bWS\./.test(pageSlice),
         'core slice is pure — no include leaked into the byte-twin');

      // EVAL the slice (export-stripped) — the brake core is self-contained (it does
      // NOT reference the parent), so it evaluates standalone like the wire-that-jumps.
      let pageRes = null, evalErr = null;
      try {
        const body = pageSlice.replace(/^\s*"use strict";\s*$/m, '');
        const factory = new Function(body +
          '\n;return { SCENE, damping, dragForce, vTerminal, accel, integrateDescent, runSelfTest };');
        const Page = factory();
        pageRes = Page.runSelfTest();
        const sameForm =
          Page.vTerminal(0.61) === Core.vTerminal(0.61) &&
          Page.damping(0.7, +1) === Core.damping(0.7, +1) &&
          Page.dragForce(2.3, 0.5, +1) === Core.dragForce(2.3, 0.5, +1) &&
          Page.SCENE.g === Core.SCENE.g && Page.SCENE.k === Core.SCENE.k && Page.SCENE.m === Core.SCENE.m;
        ok('(parity)★ page core formulas === module core formulas (vTerminal / damping / dragForce / SCENE identical)',
           sameForm, sameForm ? 'every shared formula returns the identical value' : 'a formula drifted');
      } catch (e) { evalErr = e; }

      ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
      if (pageRes){
        ok('(parity)★ inline core pass-count == module pass-count',
           pageRes.passed === moduleRes.passed && pageRes.total === moduleRes.total,
           `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleRes.passed}/${moduleRes.total}`);
        let agree = pageRes.checks.length === moduleRes.checks.length;
        for (let k = 0; agree && k < pageRes.checks.length; k++){
          if (pageRes.checks[k].pass !== moduleRes.checks[k].pass) agree = false;
          if (pageRes.checks[k].name !== moduleRes.checks[k].name) agree = false;
        }
        ok('(parity)★ every named assertion agrees row-for-row (page vs module)', agree,
           agree ? `all ${pageRes.checks.length} checks identical` : 'a check disagreed');
      }
    }
  }
}

// ── §PARENT INTEGRITY — the Hall parent stays a byte-untouched oracle ──────────
console.log('\n— §PARENT INTEGRITY: the Hall parent slab is inlined byte-true & its self-test still passes —');
{
  ok('(parent)★ Hall.closedLoopHandWork && Hall.SCENE resolve (the parent Lenz authority is importable)',
     !!Hall.SCENE && typeof Hall.closedLoopHandWork === 'function',
     'parent oracle symbols present');

  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); } catch {}
  if (html){
    const parentSrc = readFileSync(join(__dir, '..', 'core.mjs'), 'utf8');
    const LB = '// === LODESTONE-HALL CORE BEGIN ===', LE = '// === LODESTONE-HALL CORE END ===';
    const pi = html.indexOf(LB), pj = html.indexOf(LE);
    const mi = parentSrc.indexOf(LB), mj = parentSrc.indexOf(LE);
    const pageParent = pi >= 0 ? html.slice(pi, pj + LE.length) : '';
    const modParent  = parentSrc.slice(mi, mj + LE.length);
    ok('(parent)★ the Hall slab inlined into index.html is char-identical to ../core.mjs (same authority, not a fork)',
       pageParent === modParent && pageParent.length > 0,
       pageParent === modParent ? `identical bytes (${modParent.length} chars)` : `DRIFT: page ${pageParent.length} vs module ${modParent.length}`);
  }

  const hallRes = Hall.runSelfTest();
  ok('(parent)★ the parent Lodestone Hall self-test still passes (oracle untouched)',
     hallRes.ok, `${hallRes.passed}/${hallRes.total}`);
}

// ── §tally ────────────────────────────────────────────────────────────────────
console.log(`\n${pass}/${total} checks passed.`);
if (pass !== total){ console.error('FAIL — an Eddy-Brake assertion did not hold.'); process.exit(1); }
console.log('All Eddy-Brake cross-checks green. v_term ∝ 1/σ; energy is conserved; the Lenz sign is the hinge; the page core === the module core; the Hall parent stays byte-untouched.');
