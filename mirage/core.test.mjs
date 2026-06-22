// The Mirage — Node twin. Three layers:
//   (a) run the page's runSelfTest() — every check must be green;
//   (b) INDEPENDENT re-derivations at params the page never uses (checks 3, 4, 7 re-proved on
//       fresh fixtures the page can't cheat — the closed-form linear oracle, the critical-angle
//       pos/neg pair, the puddle-edge turning condition);
//   (c) BYTE-PARITY: the slice between the MIRAGE CORE sentinels in core.mjs and in index.html,
//       indentation-normalized, must be IDENTICAL — so the painting can't drift from this test.
// Exit 0 = all green. Run:  node mirage/core.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  nOf, gradOf, nMinRoad, invariant, marchRay,
  turningPoint, criticalAngle, classifyProfile, puddleHorizon, witness, runSelfTest,
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  [' + info + ']' : '')); }
  else { fail++; console.log('  ✗ ' + name + (info ? '  [' + info + ']' : '')); }
};

console.log('\nThe Mirage — Node twin\n');

// ── (a) the page's own self-test, run here ──────────────────────────────────
console.log('(a) core runSelfTest() — the same checks the in-page pill reports:');
{
  const st = runSelfTest();
  for (const c of st.checks) ok(c.name, c.pass, c.info);
  ok('runSelfTest summary all green', st.ok, st.passed + '/' + st.total);
}

// ── (b) INDEPENDENT re-derivations at FRESH params the page never uses ───────
console.log('\n(b) independent re-derivations (fresh params, methods not in the page path):');

// A reproducible PRNG so the fresh fixtures are deterministic.
function makeRng(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const rng = makeRng(0x1A6E3);

// (b1) CLOSED-FORM LINEAR ORACLE on a fresh grid (Explorer B's strongest check, re-proved). For
// n(y)=a·y+b the turning height is EXACTLY y* = (n(eyeY)·cosθ0 − b)/a — a ground-truth the
// marcher cannot fake. We re-derive it on 40 random linear fixtures the page never boots.
{
  let worst = 0, allTurned = true, n = 0;
  for (let i = 0; i < 60 && n < 40; i++){
    const a = 1e-3 + rng() * 4e-3;             // positive slope (index rises with height)
    const b = 1.0;
    const eyeY = 1.0 + rng() * 1.6;
    const theta0 = 0.03 + rng() * 0.05;        // a depression that may turn above the road
    const p = { profile: 'linear', a, b, eyeY, theta0, step: 0.08 };
    const xi = invariant(eyeY, theta0, p);     // n(eyeY)·cos(theta0)
    const yAnalytic = (xi - b) / a;            // closed-form turn height
    // Only keep fixtures whose turn falls strictly inside the integration domain [0, eyeY],
    // i.e. the ray DOES turn above the road before reaching it. (yAnalytic<0 ⇒ hits the tar.)
    if (!(yAnalytic > 0.02 && yAnalytic < eyeY - 0.02)) continue;
    n++;
    const r = marchRay(theta0, p);
    if (!r.turned || r.yStar == null){ allTurned = false; continue; }
    worst = Math.max(worst, Math.abs(r.yStar - yAnalytic));
  }
  ok('b1 · linear closed-form y*=(n₀cosθ₀−b)/a on ' + n + ' fresh turning fixtures (<1e-7)',
     allTurned && n >= 20 && worst < 1e-7, 'maxΔ=' + worst.toExponential(2) + ' turned=' + allTurned + ' n=' + n);
}

// (b2) EIKONAL INVARIANT on a fresh exponential fan — ξ=n(y)·cos(θ) conserved to <1e-6.
{
  let worst = 0;
  for (let i = 0; i < 30; i++){
    const p = {
      profile: 'inferior', dndyScale: 2e-3 + rng() * 1.6e-2, n0: 1.0,
      H: 1.2 + rng() * 2.5, eyeY: 1.1 + rng() * 1.2, theta0: 0.004, step: 0.2,
    };
    const tc = criticalAngle(p);
    const r = marchRay((tc != null ? tc * 0.997 : 0.004), p);
    for (const q of r.pts) worst = Math.max(worst, Math.abs(q.xi - r.xi0) / Math.abs(r.xi0));
  }
  ok('b2 · eikonal invariant ξ=n·cosθ conserved on a fresh 30-fan (<1e-6)', worst < 1e-6,
     'maxDrift=' + worst.toExponential(2));
}

// (b3) CRITICAL-ANGLE POS/NEG PAIR re-proved on fresh fixtures: shallower-than-θc turns,
// steeper-than-θc reaches the road. (Explorer B's clean physical pair.)
{
  let pairOk = true, n = 0;
  for (let i = 0; i < 24; i++){
    const p = {
      profile: 'inferior', dndyScale: 3e-3 + rng() * 1.4e-2, n0: 1.0,
      H: 1.4 + rng() * 2.2, eyeY: 1.2 + rng() * 1.0, theta0: 0.004, step: 0.2,
    };
    const tc = criticalAngle(p);
    if (tc == null || tc <= 0){ continue; }
    n++;
    const shallow = turningPoint(tc * 0.93, p);
    const steep = turningPoint(tc * 1.12, p);
    if (!(shallow.found === true && steep.found === false)) pairOk = false;
  }
  ok('b3 · θc pos/neg pair on ' + n + ' fresh fixtures: shallower turns, steeper hits the road',
     pairOk && n >= 4, 'pair=' + pairOk + ' n=' + n);
}

// (b4) PUDDLE EDGE = TURNING CONDITION at fresh params: the printed distance equals an
// independent re-march at half the step to <1e-6 relative. One number, two uses.
{
  let worst = 0, allNum = true, n = 0;
  for (let i = 0; i < 20; i++){
    const p = {
      profile: 'inferior', dndyScale: 4e-3 + rng() * 1.4e-2, n0: 1.0,
      H: 1.6 + rng() * 2.0, eyeY: 1.3 + rng() * 0.9, theta0: 0.004, step: 0.3,
    };
    const edge = puddleHorizon(p);
    const tc = criticalAngle(p);
    if (edge == null || tc == null){ continue; }
    n++;
    const fine = marchRay(tc * 0.999, Object.assign({}, p, { step: p.step * 0.5 }));
    if (!fine.turned || fine.xStar == null){ allNum = false; continue; }
    worst = Math.max(worst, Math.abs(edge - fine.xStar) / Math.max(1, Math.abs(edge)));
  }
  ok('b4 · puddle edge === independent re-march on ' + n + ' fresh sets (<1e-6 rel)',
     allNum && n >= 4 && worst < 1e-6, 'maxRel=' + worst.toExponential(2) + ' n=' + n);
}

// (b5) NEG-CONTROL re-proved: a fresh non-symmetric angle fan at dndyScale=0 stays perfectly
// straight, never turns, classifies 'none', and prints no puddle.
{
  const flat = { profile: 'inferior', dndyScale: 0, n0: 1.0, H: 1.7, eyeY: 1.45, theta0: 0.004, step: 0.2 };
  let maxCurv = 0, anyTurn = false;
  for (const th of [0.0006, 0.0017, 0.0041, 0.0069, 0.0102, 0.0151]){
    const r = marchRay(th, flat);
    for (const q of r.pts) maxCurv = Math.max(maxCurv, Math.abs(q.theta - th));
    if (turningPoint(th, flat).found) anyTurn = true;
  }
  ok('b5 · neg-control (dndyScale=0): straight rays, no turn, classify="none", puddle=null',
     maxCurv < 1e-12 && !anyTurn && classifyProfile(flat) === 'none' && puddleHorizon(flat) === null,
     'maxΔθ=' + maxCurv.toExponential(2) + ' anyTurn=' + anyTurn);
}

// (b6) SIGN CLASSIFIER re-proved: inferior bends the grazing ray UP (turns above the road),
// superior bends it DOWN (descends, never turns above the eye) — from dn/dy sign alone.
{
  let ok6 = true;
  for (let i = 0; i < 12; i++){
    const base = {
      dndyScale: 4e-3 + rng() * 1.0e-2, n0: 1.0, H: 1.6 + rng() * 1.6,
      eyeY: 1.3 + rng() * 0.8, theta0: 0.004, step: 0.2,
    };
    const inf = Object.assign({}, base, { profile: 'inferior' });
    const sup = Object.assign({}, base, { profile: 'superior' });
    if (classifyProfile(inf) !== 'inferior' || classifyProfile(sup) !== 'superior') ok6 = false;
    if (!(gradOf(0.1, inf) > 0 && gradOf(0.1, sup) < 0)) ok6 = false;
    // inferior: a grazing ray turns above the road; superior: it does not (it bends toward the road).
    const tc = criticalAngle(inf);
    if (tc != null && tc > 0){ if (!marchRay(tc * 0.99, inf).turned) ok6 = false; }
    if (puddleHorizon(sup) !== null) ok6 = false;
  }
  ok('b6 · sign classifier on fresh pairs: inferior turns up & puddles, superior bends down & does not',
     ok6, 'pairs=' + ok6);
}

// ── (c) BYTE-PARITY between core.mjs and index.html ─────────────────────────
console.log('\n(c) byte-parity: the CORE slice in index.html must match core.mjs exactly:');
{
  const START = '// ===== MIRAGE CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END MIRAGE CORE =====';
  const slice = (txt) => {
    const i = txt.indexOf(START), j = txt.indexOf(END);
    if (i < 0 || j < 0) return null;
    return txt.slice(i, j + END.length);
  };
  const normalize = (s) => s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  const coreTxt = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  const pageTxt = readFileSync(join(HERE, 'index.html'), 'utf8');
  const a = slice(coreTxt), b = slice(pageTxt);
  if (a == null || b == null){
    ok('c · core sentinels present in both files', false, 'core=' + (a != null) + ' page=' + (b != null));
  } else {
    const same = normalize(a) === normalize(b);
    console.log('  ' + (same ? 'IDENTICAL' : 'DRIFTED'));
    ok('c · index.html CORE slice === core.mjs CORE slice (indentation-normalized)', same);
  }
}

// ── summary ─────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? 'PASS' : 'FAIL') + ' — ' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail === 0 ? 0 : 1);
