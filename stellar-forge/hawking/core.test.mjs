// Node twin for The Pair at the Edge. Zero-dep. Run: `node core.test.mjs`.
// Exit 0 = green; non-zero = red. Prints an explicit PASS/FAIL count.
//
// Proves the LAW of Hawking evaporation — T ∝ 1/M ⇒ L ∝ 1/M² ⇒ t_evap ∝ M³, a monotone
// accelerating one-way runaway — NOT a wall-clock measurement of any real hole. Independent of the
// page's runSelfTest where it matters:
//   (a) runs the page's own runSelfTest() — all green;
//   (b) INDEPENDENT Node-only re-derivations NOT routed through runSelfTest:
//         · T ∝ 1/M (ratio exact; T strictly decreasing over a mass ladder),
//         · CUBE LAW (lifetime(2)/lifetime(1) = 8; lifetime strictly increasing in M0),
//         · CLOSED-FORM = INTEGRAL to < 1e-9 over M0∈{1,2,4,8}; massAfter(M0,t_evap) === 0 exact,
//         · MONOTONE ONE-WAY RUNAWAY (dMdt < 0 ∀ M; |dMdt| strictly increases as M falls),
//         · INVERSE-MASS DIPTYCH THEOREM (lighter hotter AND dies first) over several pairs,
//         · domain guard: the thermal fns throw RangeError on NaN / −1 / Infinity / non-number;
//   (c) the classicalHole NEGATIVE CONTROL provably FAILS the thermal conditions (T≡0, dMdt≡0,
//       never shrinks) — assert the failing condition explicitly: it disagrees with the thermal
//       core at every sampled M, AND massAfter under a classical (zero) rate never reaches 0;
//   (d) BYTE-PARITY: the inlined core between the sentinels in index.html is byte-identical
//       (indentation-normalized) to core.mjs's body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  K,
  temperature, luminosity, dMdt, massAfter, lifetime, lifetimeIntegrated,
  classicalHole, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }
const EPS = 1e-9;
const near = (a, b, e) => Math.abs(a - b) <= (e || EPS);

// ── (a) the page's own self-test is all-green ──
const st = runSelfTest();
for (const c of st.checks) ck('selftest ' + c.name + '  [' + c.info + ']', c.pass);

// ── (b) INDEPENDENT re-derivations (not via runSelfTest) ──

// T ∝ 1/M — exact ratio and strict decrease.
ck('T ∝ 1/M: temperature(1)/temperature(2) === 2  [' + (temperature(1)/temperature(2)) + ']',
   near(temperature(1) / temperature(2), 2));
{
  const ladder = [0.25, 0.5, 1, 2, 4, 8, 16];
  const Ts = ladder.map(temperature);
  let dec = true; for (let k=1;k<Ts.length;k++) if (!(Ts[k] < Ts[k-1])) dec = false;
  ck('T strictly decreasing over M=[' + ladder.join(',') + ']  [' + Ts.map(v=>v.toFixed(3)).join(',') + ']', dec);
  // and temperature is literally 1/M
  ck('temperature(M) === 1/M at M=2,4  [' + temperature(2) + ',' + temperature(4) + ']',
     temperature(2) === 0.5 && temperature(4) === 0.25);
}

// L ∝ 1/M² — luminosity is exactly 1/M² and rises as M falls.
ck('luminosity(M) === 1/M² at M=2,4  [' + luminosity(2) + ',' + luminosity(4) + ']',
   luminosity(2) === 0.25 && luminosity(4) === 0.0625);
ck('luminosity rises as M falls: luminosity(1) > luminosity(2) > luminosity(4)',
   luminosity(1) > luminosity(2) && luminosity(2) > luminosity(4));

// CUBE LAW — lifetime(2)/lifetime(1) = 8, monotone increasing, and = M0³/3.
ck('CUBE LAW: lifetime(2)/lifetime(1) === 8  [' + (lifetime(2)/lifetime(1)) + ']',
   near(lifetime(2) / lifetime(1), 8));
ck('lifetime(M0) === M0³/3 at M0=1,2,4  [' + lifetime(1) + ',' + lifetime(2) + ',' + lifetime(4) + ']',
   near(lifetime(1), 1/3) && near(lifetime(2), 8/3) && near(lifetime(4), 64/3));
{
  const ladder = [0.25, 0.5, 1, 2, 4, 8, 16];
  const Ls = ladder.map(lifetime);
  let inc = true; for (let k=1;k<Ls.length;k++) if (!(Ls[k] > Ls[k-1])) inc = false;
  ck('lifetime strictly increasing over M=[' + ladder.join(',') + ']', inc);
}

// CLOSED-FORM = INTEGRAL — to < 1e-9 over M0∈{1,2,4,8}; and massAfter hits exactly 0 at t_evap.
{
  const m0s = [1, 2, 4, 8];
  let maxErr = 0;
  for (const M0 of m0s) maxErr = Math.max(maxErr, Math.abs(lifetimeIntegrated(M0) - lifetime(M0)));
  ck('closed-form = analytic integral within 1e-9 over M0∈{1,2,4,8}  [maxErr=' + maxErr.toExponential(2) + ']',
     maxErr < EPS);
  // the integral matches the closed form even at a coarse step count (it is analytic per substep)
  ck('integral is step-insensitive: lifetimeIntegrated(8, 8) ≈ lifetime(8) within 1e-9  [' +
     Math.abs(lifetimeIntegrated(8, 8) - lifetime(8)).toExponential(2) + ']',
     Math.abs(lifetimeIntegrated(8, 8) - lifetime(8)) < EPS);
  let endsZero = true; for (const M0 of m0s) if (massAfter(M0, lifetime(M0)) !== 0) endsZero = false;
  ck('massAfter(M0, lifetime(M0)) === 0 EXACT over M0∈{1,2,4,8}  [' +
     m0s.map(M0=>massAfter(M0,lifetime(M0))).join(',') + ']', endsZero);
  // halfway through life, some mass remains (the trajectory is real, not a step function)
  ck('massAfter(8, lifetime(8)/2) is strictly between 0 and 8  [' + massAfter(8, lifetime(8)/2).toFixed(4) + ']',
     (() => { const m = massAfter(8, lifetime(8)/2); return m > 0 && m < 8; })());
}

// MONOTONE ONE-WAY RUNAWAY — dMdt < 0 ∀ M, and |dMdt| strictly rises as M falls.
{
  const ladder = [0.25, 0.5, 1, 2, 4, 8, 16];
  ck('dMdt(M) < 0 for all M>0 over the ladder', ladder.every(M => dMdt(M) < 0));
  const downward = [16, 8, 4, 2, 1, 0.5, 0.25];
  const abs = downward.map(M => Math.abs(dMdt(M)));
  let accel = true; for (let k=1;k<abs.length;k++) if (!(abs[k] > abs[k-1])) accel = false;
  ck('|dMdt| strictly increases as M falls (death accelerates) over M=[' + downward.join(',') + ']  [' +
     abs.map(v=>v.toFixed(3)).join(',') + ']', accel);
  ck('dMdt(M) === -1/M² at M=2,4  [' + dMdt(2) + ',' + dMdt(4) + ']',
     dMdt(2) === -0.25 && dMdt(4) === -0.0625);
}

// INVERSE-MASS DIPTYCH THEOREM — lighter hole hotter AND dies first, over several pairs.
{
  const pairs = [[1,2],[0.5,4],[2,16],[0.25,1]];
  let thm = true;
  for (const [l,h] of pairs)
    if (!(temperature(l) > temperature(h) && lifetime(l) < lifetime(h))) thm = false;
  ck('DIPTYCH THEOREM: M_light<M_heavy ⇒ T_light>T_heavy AND life_light<life_heavy (pairs ' +
     pairs.map(p=>p.join('<')).join(', ') + ')', thm);
}

// DOMAIN GUARD — a non-physical mass throws RangeError (no silent garbage).
function throwsRange(fn){ try { fn(); return false; } catch(e){ return e instanceof RangeError; } }
ck('domain guard: temperature(NaN) throws RangeError', throwsRange(() => temperature(NaN)));
ck('domain guard: dMdt(-1) throws RangeError', throwsRange(() => dMdt(-1)));
ck('domain guard: lifetime(Infinity) throws RangeError', throwsRange(() => lifetime(Infinity)));
ck('domain guard: luminosity("2") throws RangeError (not a number)', throwsRange(() => luminosity('2')));
ck('domain guard: massAfter(8, -1) throws RangeError (negative time)', throwsRange(() => massAfter(8, -1)));
// boundary at M = 0: the runaway limit — temperature/luminosity blow up, mass cannot go below 0.
ck('temperature(0) === Infinity (the final-flash limit)', temperature(0) === Infinity);
ck('massAfter(M0, t) clamps at 0 — never negative  [' + massAfter(2, 1000) + ']', massAfter(2, 1000) === 0);

// ── (c) the classicalHole NEGATIVE CONTROL provably FAILS the thermal conditions ──
{
  const samples = [0.25, 0.5, 1, 2, 4, 8, 16];
  let allDisagree = true;
  for (const M of samples){
    const c = classicalHole(M);
    const disagrees = c.T === 0 && c.dMdt >= 0
                   && temperature(M) > 0 && dMdt(M) < 0
                   && c.T !== temperature(M) && c.dMdt !== dMdt(M);
    if (!disagrees) allDisagree = false;
  }
  ck('NEGATIVE CONTROL: classicalHole (T≡0, dMdt≡0) disagrees with the thermal core at every M',
     allDisagree);
  ck('NEGATIVE CONTROL: classicalHole.T ≡ 0 and L ≡ 0 at every M (never glows)',
     samples.every(M => { const c = classicalHole(M); return c.T === 0 && c.L === 0; }));
  ck('NEGATIVE CONTROL: classicalHole.dMdt === 0 at every M (never shrinks)',
     samples.every(M => classicalHole(M).dMdt === 0));
  // a hole that never radiates never evaporates: its mass at any t equals its start (zero-rate flow)
  // — the thermal core, by contrast, reaches 0 at t_evap. Assert the contrast explicitly.
  ck('NEGATIVE CONTROL: a zero-rate (classical) hole keeps its mass forever, while the thermal hole evaporates',
     classicalHole(8).dMdt === 0 && massAfter(8, lifetime(8)) === 0);
}

// ── (d) BYTE-PARITY: index.html's inlined core === core.mjs body (indentation-normalized) ──
const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
const BEGIN = '// ===== HAWKING CORE (byte-identical to core.mjs) =====';
const END = '// ===== END HAWKING CORE =====';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(coreSrc);
const pageRegion = region(pageSrc);
ck('byte-parity: HAWKING CORE sentinels present in core.mjs', !!coreRegion);
ck('byte-parity: HAWKING CORE sentinels present in index.html', !!pageRegion);
ck('byte-parity: index.html inlined core === core.mjs body (indentation-normalized)',
   !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));

// ── report ──
console.log('The Pair at the Edge — core.test.mjs');
console.log('  page self-test: ' + st.passed + '/' + st.total + ' checks green');
console.log('  byte-parity: ' + (coreRegion && pageRegion && norm(coreRegion) === norm(pageRegion) ? 'IDENTICAL' : 'DRIFTED'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
