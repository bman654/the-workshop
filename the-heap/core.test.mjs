#!/usr/bin/env node
// ============================================================================
//  The Heap That Knows Its Own Angle — Node twin of the in-page self-test.
//
//  HONESTY MANIFESTO. The bulk relaxation is a DETERMINISTIC fixed-point
//  iteration on a single-valued height field — there is NO randomness in the
//  proof, so the proved angle is exact: every claim is a tolerance BAND on a
//  RELAXED angle, never a pinned avalanche count. The headline is the REPOSE
//  INVARIANT: however you build the heap (shape, pour amount, tilt history) the
//  free surface relaxes to θ_r = atan(μ) — a fixed point independent of the path
//  there. The flux gain sets cascade SPEED only; a no-overshoot cap makes the
//  converged angle gain- and order-independent (the slope-limit cousin of the
//  sandpile's abelian property). The only RNG in the whole piece drives cosmetic
//  rolling-grain sprites and never touches the proof.
//
//  This twin imports core.mjs (the SOLE authority), runs the SAME
//  runHeapSelfTest the page pill runs, then adds deeper Node-only legs (a φ-sweep
//  "the tray spins, the sand keeps its angle", a finer μ ladder, an order/gain
//  panel, a long mass-conservation drive, and the single-source grep). Parity
//  between the page's inlined core and core.mjs is the forge's job (`forge
//  --check`), so there is no manual byte-twin slice here.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================

import {
  makeHeap, setPyramid, setBlock, setLumps, setFlatBed, pourAt, totalMass,
  thetaWorld, slips, faceAngle, maxFreeAngle, relax, relaxStep,
  thetaRFromMu, runHeapSelfTest,
  ANGLE_TOL, FLAT_TOL, MAX_SWEEPS, D2R, R2D,
} from './core.mjs';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail){
  if (cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); console.log('  \x1b[31m✗\x1b[0m ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('\n  The Heap That Knows Its Own Angle — core.test.mjs\n  ' + '─'.repeat(64));

// ── Layer 1: the SAME battery the page pill renders (single source of truth). ──
console.log('\n  layer 1 · the in-page self-test battery (verbatim):');
const battery = runHeapSelfTest();
for (const line of battery.lines) ok(line.name, line.ok, line.detail);
ok(`battery reports ${battery.pass}/${battery.total} green (≥8 legs)`,
   battery.fails.length === 0 && battery.total >= 8, `${battery.pass}/${battery.total}`);

// ── Layer 2: deeper Node-only cross-checks ──
console.log('\n  layer 2 · node-only deep cross-checks:');

// (A) THE HEADLINE, MADE LITERAL — "the tray spins, the sand keeps its angle":
//     sweep φ across the whole tilt range; build an over-steep pyramid at each and
//     relax. The settled free-face WORLD angle = θ_r for EVERY tilt (variance ≈ 0).
{
  // a compact heap on a wide tray, moderate tilts: a clean repose face exists at
  // every tilt (extreme tilt legitimately piles against the downhill wall — that is
  // the documented closed-wall scope, not a free face, so the headline is read here).
  const thetaR = thetaRFromMu(0.7);   // ≈ 35°
  const faces = [];
  let worst = 0, allConv = true;
  for (let phd = -30; phd <= 30; phd += 5){
    const st = makeHeap({ thetaR, phi: phd * D2R });
    setPyramid(st, { peak: 10, slope: 1.6, base: 0 });   // over-steep, compact, on bare floor
    const r = relax(st); if (!r.converged) allConv = false;
    const f = faceAngle(st);
    faces.push(f); worst = Math.max(worst, Math.abs(f - thetaR));
  }
  const mean = faces.reduce((a, b) => a + b, 0) / faces.length;
  const variance = faces.reduce((a, b) => a + (b - mean) * (b - mean), 0) / faces.length;
  ok('the tray spins, the sand keeps its angle: face = θ_r at every φ∈[−30,30]°',
     allConv && worst < ANGLE_TOL && variance < 1e-6,
     `worst |face−θ_r|=${(worst * R2D).toFixed(3)}°, var=${variance.toExponential(2)} rad² over ${faces.length} tilts`);
}

// (B) NEEDLE = atan(μ) on a FINE μ ladder {0.1 … 3.0}: face = atan(μ) to tol and
//     strictly increasing — the friction identity read straight off the heap.
{
  const mus = [0.10, 0.18, 0.27, 0.36, 0.50, 0.70, 0.95, 1.30, 1.80, 2.40, 3.00];
  const faces = [];
  let worst = 0, mono = true;
  for (const mu of mus){
    const thetaR = thetaRFromMu(mu);
    const st = makeHeap({ thetaR });
    setPyramid(st, { peak: 24, slope: Math.max(1.4, 2.2 * mu + 0.5), base: 2 });
    relax(st);
    const f = faceAngle(st);
    faces.push(f); worst = Math.max(worst, Math.abs(f - thetaR));
  }
  for (let i = 1; i < faces.length; i++) if (!(faces[i] > faces[i - 1])) mono = false;
  ok('fine μ ladder {0.1…3.0}: face = atan(μ) to tol, strictly increasing',
     worst < ANGLE_TOL && mono, `worst=${(worst * R2D).toFixed(3)}°, faces=[${faces.map(x => (x * R2D).toFixed(1)).join(',')}]°`);
}

// (C) ORDER / GAIN INDEPENDENCE (the abelian cousin): the SAME initial heap relaxed
//     under four (gain × sweep-seed) settings lands on the same face within tol.
{
  const thetaR = thetaRFromMu(0.6);
  const base = makeHeap({ thetaR }); setLumps(base, { seed: 4242, amp: 20, bumps: 6 });
  const settings = [{ gain: 1.35, s: 0 }, { gain: 0.5, s: 0 }, { gain: 1.0, s: 1 }, { gain: 0.25, s: 7 }];
  const faces = [];
  for (const cfg of settings){
    const st = makeHeap({ thetaR }); st.z.set(base.z); st.gain = cfg.gain; st._sweep = cfg.s;
    relax(st); faces.push(faceAngle(st));
  }
  let spread = 0;
  for (let i = 1; i < faces.length; i++) spread = Math.max(spread, Math.abs(faces[i] - faces[0]));
  ok('order/gain independence: same heap, four relaxation settings ⇒ same face within tol',
     spread < ANGLE_TOL, `face spread = ${(spread * R2D).toFixed(4)}° across gains {1.35,0.5,1.0,0.25}`);
}

// (D) MASS CONSERVATION over a long, varied drive: build, pour, tilt, re-relax many
//     times; Σz is conserved to machine epsilon throughout (the walls are closed).
{
  const thetaR = thetaRFromMu(0.8);
  const st = makeHeap({ thetaR });
  setLumps(st, { seed: 11, amp: 14, bumps: 5 });
  const m0 = totalMass(st);
  let worstDrift = 0;
  for (let round = 0; round < 12; round++){
    st.phi = ((round % 5) - 2) * 14 * D2R;          // wobble the tilt
    relax(st);
    worstDrift = Math.max(worstDrift, Math.abs(totalMass(st) - m0));
  }
  ok('mass conservation: Σz held to machine ε through 12 tilt/relax rounds (closed walls)',
     worstDrift < 1e-6, `worst |ΔΣz| = ${worstDrift.toExponential(2)} of Σz=${m0.toFixed(1)}`);
}

// (E) SLIP-PREDICATE TRUTH TABLE across φ: for several tilts, a straight surface of
//     world angle β has slips()==(|β|>θ_r) for every β on a fine grid (the boolean
//     is the Coulomb law, exact). 0 mismatches.
{
  const thetaR = thetaRFromMu(0.6);    // ≈ 31°
  let mism = 0, checks = 0;
  for (const phd of [-40, -10, 0, 25, 55]){
    const phi = phd * D2R;
    for (let bd = -85; bd <= 85; bd += 1){
      const beta = bd * D2R;
      const st = makeHeap({ thetaR, phi });
      const slope = -Math.tan(beta - phi);
      for (let i = 0; i < st.ncol; i++) st.z[i] = 200 + slope * i * st.dx;
      const mid = Math.floor((st.ncol - 1) / 2);
      const predicted = Math.abs(beta) > thetaR + 2e-3;   // clearly outside the dβ ambiguity band
      const clearlyIn = Math.abs(beta) < thetaR - 2e-3;
      if (predicted && !slips(st, mid)) { mism++; }
      if (clearlyIn && slips(st, mid)) { mism++; }
      checks++;
    }
  }
  ok('slip-predicate truth table across φ: |θ_world|>θ_r matches slips() (0 mismatches)',
     mism === 0, `${checks} (β,φ) checks, ${mism} mismatches`);
}

// (F) AVALANCHE-ON-μ, both directions, swept: at a fixed tilt, settle at μ1 then step
//     μ DOWN (must shed, re-settle lower) and UP (must shed nothing) across a panel.
{
  const phi = 22 * D2R;
  let downAllFire = true, upAllQuiet = true, worstLand = 0;
  for (const mu1 of [0.7, 1.0, 1.4]){
    const st = makeHeap({ thetaR: thetaRFromMu(mu1), phi });
    setPyramid(st, { peak: 12, slope: 2.0, base: 0 });   // compact: the spread fits the tray at every step
    relax(st);
    const before = faceAngle(st);
    // step up
    const stUp = makeHeap({ thetaR: thetaRFromMu(mu1 * 1.6), phi }); stUp.z.set(st.z); stUp._sweep = st._sweep;
    const up = relax(stUp);
    if (up.moved > 1e-6) upAllQuiet = false;
    // step down
    const stDn = makeHeap({ thetaR: thetaRFromMu(mu1 * 0.5), phi }); stDn.z.set(st.z); stDn._sweep = st._sweep;
    const dn = relax(stDn);
    if (dn.moved < 1e-3) downAllFire = false;
    worstLand = Math.max(worstLand, Math.abs(faceAngle(stDn) - thetaRFromMu(mu1 * 0.5)));
    void before;
  }
  ok('avalanche-on-μ panel: lowering friction always sheds & re-settles at atan(μ); raising never sheds',
     downAllFire && upAllQuiet && worstLand < ANGLE_TOL,
     `down-fires=${downAllFire}, up-quiet=${upAllQuiet}, worst landing |face−atan(μ)|=${(worstLand * R2D).toFixed(3)}°`);
}

// (G) SINGLE-SOURCE GREP — the world-frame facet-angle kernel literal (θ_world's
//     definition) must be LIVE .js/.mjs/.cjs in EXACTLY one file: the-heap/core.mjs.
//     We ASSEMBLE the needle from parts so this test file is not itself a hit, then
//     walk the repo (skipping .git / node_modules / assets).
{
  const needle = ['Math.atan2(st.z[i]', ' - st.z[i + 1], st.dx)', ' + st.phi'].join('');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '..');
  const SKIP = new Set(['.git', 'node_modules', 'assets']);
  const hits = [];
  const walk = (dir) => {
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents){
      if (e.isDirectory()){ if (!SKIP.has(e.name)) walk(path.join(dir, e.name)); continue; }
      if (!/\.[cm]?js$/.test(e.name)) continue;
      const p = path.join(dir, e.name);
      let txt; try { txt = fs.readFileSync(p, 'utf8'); } catch { continue; }
      if (txt.includes(needle)) hits.push(path.relative(repoRoot, p));
    }
  };
  walk(repoRoot);
  const onlyCore = hits.length === 1 && hits[0] === path.join('the-heap', 'core.mjs');
  ok('single-source: the θ_world facet-angle kernel literal is live in EXACTLY the-heap/core.mjs',
     onlyCore, `hits = [${hits.join(', ')}]`);
}

console.log('\n  ' + '─'.repeat(64));
if (fail === 0){
  console.log(`  \x1b[32mALL GREEN — ${pass}/${pass} checks pass (both layers).\x1b[0m`);
  console.log('  the heap settles at θ_r = atan(μ) — proven as a fixed point, independent of how it was built.\n');
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAILED — ${pass} pass, ${fail} fail.\x1b[0m`);
  for (const f of fails) console.log('    · ' + f);
  console.log('');
  process.exit(1);
}
