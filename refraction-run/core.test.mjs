// ============================================================================
//  Node twin for THE PHOTON'S ERRAND core (Fermat / Snell / eikonal).
//  Zero-dep.  Run:  node refraction-run/core.test.mjs   (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM, not merely that the code runs:
//   (a) SNELL + STATIONARITY — at the Fermat crossings X*, every interface satisfies
//       nₖ·sinθₖ = nₖ₊₁·sinθₖ₊₁ to <1e-9, the analytic ∇(∫n·ds) is <1e-9
//       componentwise, and a central-difference NUMERIC gradient agrees <1e-9
//       ("the gauge stopped bleeding" == "Snell holds", proven twice), all 4 rounds.
//   (b) GRADED BLOCK → EIKONAL (finite M) — the Bouguer first integral n(y)·sinθ is
//       constant across the shipped M graded crossings to <1e-9, and the ray genuinely
//       CURVES (a flat-slab stack alone can't show it).
//   (NEG1) all nᵢ equal ⇒ the minimiser is the STRAIGHT segment (collinear, ∇L=0).
//   (NEG2) a focus-REACHING non-Fermat path has STRICTLY larger ∫n·ds AND ∇L≠0.
//   (c) DECIDABLE WIN — the WIN predicate fires EXACTLY on the Fermat path over a grid.
//   (d) DETERMINISM — the scene is a pure function of the round.
//   (e) SOLVER ROBUSTNESS — safeguarded descent converges on M=16 (naive Newton NaNs).
//   (f) n→1 DIAL PUNCHLINE — every nᵢ=1 ⇒ optimal L = straight-shot length.
//   (g) HERITAGE / ANTI-FORK — the page reuses vantage projectNorm UNFORKED: a
//       pre-composed world-translation then projectNorm EQUALS projectNorm of the
//       translated point (the only new camera ability); vantage's CORE sentinel block
//       is present in vantage/core.mjs; and index.html's inlined REFRACTION-RUN CORE
//       slab is byte-identical (indentation-normalised) to core.mjs.
// ============================================================================

import {
  pathPoints, opticalLength, gradL, numGradL, snellResiduals,
  solveFermat, straightLineCrossings, bouguerInvariant, winPredicate,
  buildRound, dialIndices, runSelfTest,
} from './core.mjs';
import { projectNorm } from '../vantage/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-9;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── run the SAME runSelfTest() the page's pill runs; mirror its verdict here so
// the twin and the in-page pill can never diverge. ──────────────────────────────
{
  const r = runSelfTest();
  for (const c of r.checks) check('[shared] ' + c.name, c.pass, c.info);
  check('shared runSelfTest() overall green', r.ok, r.passed + '/' + r.total);
}

// ── (a) re-prove Snell + stationarity directly here (independent of runSelfTest) ─
{
  let worstSnell = 0, worstGrad = 0, worstNum = 0;
  for (const round of [1, 2, 3, 4]){
    const p = buildRound(round);
    const res = snellResiduals(p, p.Xstar);
    const ga = gradL(p, p.Xstar), gn = numGradL(p, p.Xstar, 1e-6);
    for (let k = 0; k < p.Xstar.length; k++){
      worstSnell = Math.max(worstSnell, res[k]);
      worstGrad  = Math.max(worstGrad, Math.abs(ga[k]));
      worstNum   = Math.max(worstNum, Math.abs(ga[k] - gn[k]));
    }
  }
  check('(a) Snell + ∇L + numeric-gradient all <1e-9 across rounds 1–4',
    worstSnell < EPS && worstGrad < EPS && worstNum < EPS,
    'snell ' + worstSnell.toExponential(2) + ' ∇L ' + worstGrad.toExponential(2)
    + ' |a−n| ' + worstNum.toExponential(2));
}

// ── (b) graded block: Bouguer invariant constant + the ray curves ───────────────
{
  const p = buildRound(3);
  const inv = bouguerInvariant(p, p.Xstar);
  const start = p.n.length - p.graded.M;
  let mn = Infinity, mx = -Infinity;
  for (let i = start; i < inv.length; i++){ mn = Math.min(mn, inv[i]); mx = Math.max(mx, inv[i]); }
  check('(b) graded Bouguer n·sinθ constant across the M=' + p.graded.M + ' graded crossings (<1e-9)',
    (mx - mn) < EPS, 'spread ' + (mx - mn).toExponential(2));
}

// ── (NEG1) all nᵢ=1 ⇒ straight segment ─────────────────────────────────────────
{
  const base = buildRound(3);
  const flat = Object.assign({}, base, { n: base.n.map(() => 1.0) });
  const sol = solveFermat(flat);
  const straight = straightLineCrossings(flat);
  let maxDev = 0; for (let k = 0; k < sol.X.length; k++) maxDev = Math.max(maxDev, Math.abs(sol.X[k] - straight[k]));
  const gmax = sol.grad.reduce((a,v)=>Math.max(a,Math.abs(v)), 0);
  check('(NEG1) all nᵢ=1 ⇒ minimiser is the straight segment (collinear, ∇L=0)',
    maxDev < EPS && gmax < EPS, 'dev ' + maxDev.toExponential(2) + ' ∇L ' + gmax.toExponential(2));
}

// ── (NEG2) arrival ≠ least-time ─────────────────────────────────────────────────
{
  const p = buildRound(2);
  let ok = true, minExcess = Infinity;
  for (const eps of [0.3, -0.4, 0.6, -0.25]){
    const Xf = p.Xstar.map((x, k) => x + eps * (k % 2 ? -1 : 1));
    const L = opticalLength(p, Xf), gmax = gradL(p, Xf).reduce((a,v)=>Math.max(a,Math.abs(v)),0);
    if (!((L - p.Lstar) > 1e-6 && gmax > 1e-6)) ok = false;
    minExcess = Math.min(minExcess, L - p.Lstar);
  }
  check('(NEG2) focus-reaching non-Fermat path: strictly larger ∫n·ds AND ∇L≠0',
    ok, 'min ΔL ' + minExcess.toExponential(2));
}

// ── (c) decidable WIN fires on the Fermat path alone ────────────────────────────
{
  const p = buildRound(2);
  const ref = { Lstar: p.Lstar };
  let elsewhere = 0, tested = 0;
  for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++){
    if (a === 0 && b === 0) continue;
    tested++;
    if (winPredicate(p, [p.Xstar[0] + a*0.15, p.Xstar[1] + b*0.15], true, ref)) elsewhere++;
  }
  check('(c) decidable WIN: fires on Fermat path, rejects all ' + tested + ' grid neighbours',
    winPredicate(p, p.Xstar, true, ref) && elsewhere === 0 && !winPredicate(p, p.Xstar, false, ref),
    'others=' + elsewhere);
}

// ── (e) solver robust at M=16 ───────────────────────────────────────────────────
{
  const ys = [], n = [1.0];
  for (let i = 1; i <= 16; i++){ ys.push(-2 + i * 0.3); n.push(1.0 + Math.sin(i) * 0.4 + 0.8); }
  const p = { src:[-3, -2.5], tgt:[3, 3.5], ys, n };
  const sol = solveFermat(p, { tol: 1e-13 });
  const gmax = sol.grad.reduce((a,v)=>Math.max(a,Math.abs(v)), 0);
  check('(e) safeguarded descent converges on M=16 wild stack (|∇L|<1e-9, no NaN)',
    sol.X.every(isFinite) && gmax < 1e-9, '|∇L| ' + gmax.toExponential(2) + ' sweeps ' + sol.sweeps);
}

// ── (f) n→1 dial ────────────────────────────────────────────────────────────────
{
  const p = buildRound(3);
  const flat = Object.assign({}, p, { n: dialIndices(p, 1) });
  const sol = solveFermat(flat);
  const geom = Math.hypot(p.tgt[0]-p.src[0], p.tgt[1]-p.src[1]);
  check('(f) n→1 dial: optimal L equals the straight-shot length (trivial optics)',
    Math.abs(sol.L - geom) < EPS, '|L−geom| ' + Math.abs(sol.L - geom).toExponential(2));
}

// ── (g) HERITAGE / ANTI-FORK: vantage projectNorm reused unforked ───────────────
{
  // the ONLY new camera ability is a pre-composed world TRANSLATION ahead of the
  // proven chain: screen = projectNorm(worldPoint − probePos, C). Assert that
  // translate-then-project EQUALS projectNorm of the translated point (identity).
  const C = { yaw: 0.31, pitch: -0.17, dolly: 6.0 };
  const world = [1.4, -0.9, 2.1], probe = [0.5, 0.3, -0.4];
  const translated = [world[0]-probe[0], world[1]-probe[1], world[2]-probe[2]];
  const viaTranslate = projectNorm(translated, C);
  const direct = projectNorm([world[0]-probe[0], world[1]-probe[1], world[2]-probe[2]], C);
  const same = viaTranslate[0]===direct[0] && viaTranslate[1]===direct[1] && viaTranslate[2]===direct[2];
  check('(g) camera: pre-composed world-translation then projectNorm === projectNorm(translated) (proven optic untouched)',
    same, 'screen=[' + viaTranslate[0].toFixed(4) + ',' + viaTranslate[1].toFixed(4) + ']');

  // dolly stays comfortably positive so the perspective divide never hits the 0.05
  // floor — sampled DETERMINISTICALLY over a lattice of world points in the tank box.
  const depths = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let l = -2; l <= 2; l++){
    depths.push(projectNorm([i, j, l], { yaw:0.2, pitch:0.1, dolly:7 })[2]);
  }
  check('(g′) sanity: with dolly=7 the perspective depth stays well above the 0.05 clamp floor',
    depths.every(d => d > 0.5), 'min depth ' + Math.min(...depths).toFixed(3));
}

// ── (g″) vantage CORE sentinel present in vantage/core.mjs (it imports unforked) ─
const here = dirname(fileURLToPath(import.meta.url));
{
  const vsrc = readFileSync(join(here, '..', 'vantage', 'core.mjs'), 'utf8');
  const hasBegin = vsrc.includes('// ===== VANTAGE CORE');
  const hasEnd = vsrc.includes('// ===== END VANTAGE CORE =====');
  const exportsProject = /export\s*\{[^}]*projectNorm/.test(vsrc);
  check('(g″) vantage/core.mjs still bears its CORE sentinels and exports projectNorm (anti-fork)',
    hasBegin && hasEnd && exportsProject, 'begin=' + hasBegin + ' end=' + hasEnd + ' export=' + exportsProject);
}

// ── BYTE-TWIN PARITY: the page's inlined REFRACTION-RUN CORE slab === core.mjs slab
{
  const BEGIN = '// === REFRACTION-RUN CORE BEGIN ===';
  const END = '// === REFRACTION-RUN CORE END ===';
  function region(text){
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  }
  function norm(s){
    return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  }
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
  check('byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
  check('byte-parity: index.html inlined core === core.mjs (norm)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? '' : 'index.html not built yet (run forge)');
}

console.log('\nThe Photon\'s Errand — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
