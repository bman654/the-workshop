#!/usr/bin/env node
// ============================================================================
//  The Rolling Room — Node twin of the in-page self-test (byte-disjoint).
//
//  TWO DISJOINT AUTHORITIES. (A) the analytic dispersion-relation PROOF module
//  pins Ra_c = 27π⁴/4 and k_c = π/√2 to < 1e-9, proves the band of unstable
//  wavenumbers, and proves the NEG-CONTROL (Ra<0 decays for ALL k). (B) the 2-D
//  ψ–ω SOLVER is the honest visible field: its measured growth rate hugs the
//  proof's growthRate (sign + magnitude), and it is exactly replayable per seed.
//  The proof NEVER runs the solver and the solver NEVER reads the proof.
//
//  This twin imports core.mjs (the SOLE authority) and runs the SAME
//  runRollingRoomSelfTest the page pill runs, then adds deeper Node-only legs
//  (a second analytic derivation of the critical point, a finer neg-control
//  ladder, a second-seed solver determinism family, a longer neg-control SOLVER
//  decay, the single-source grep, and a soft perf smoke). Parity between the
//  page's inlined core and core.mjs is the FORGE's job (`forge --check`), so there
//  is no manual byte-twin slice here. process.exit(pass === total ? 0 : 1).
// ============================================================================

import {
  PI, RA_C, KC, DELTAT_C, RA_PER_DEG,
  aSq, raMarginal, raCritical, kCritical,
  growthRate, sigmaSign, findMarginalMinimum, unstableBand, maxGrowthRate,
  makeCell, step, thetaRMS, velocityAt, seedEigenmode,
  runRollingRoomSelfTest,
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

console.log('\n  The Rolling Room — core.test.mjs\n  ' + '─'.repeat(62));

// ── Layer 1: the SAME battery the page pill renders (single source of truth). ──
console.log('\n  layer 1 · the in-page self-test battery (verbatim):');
const battery = runRollingRoomSelfTest();
for (const line of battery.lines) ok(line.name, line.ok, line.detail);
ok(`battery reports ${battery.pass}/${battery.total} green (≥8 legs)`,
   battery.fails.length === 0 && battery.total >= 8, `${battery.pass}/${battery.total}`);

// ── Layer 2: deeper Node-only cross-checks ──
console.log('\n  layer 2 · node-only deep cross-checks:');

// (A) SECOND, INDEPENDENT derivation of the critical point. The minimum of
//     (u+π²)³/u over u=k² is where d/du = (u+π²)²(2u−π²)/u² = 0 ⇒ u = π²/2 ⇒
//     k_c = π/√2, Ra_c = (3π²/2)³/(π²/2) = 27π⁴/4. Compute that closed form here
//     (a different algebraic route than findMarginalMinimum) and pin to < 1e-12.
{
  const uc = PI * PI / 2;
  const kFromU = Math.sqrt(uc);
  const RaFromU = (uc + PI * PI) ** 3 / uc;
  const okK  = Math.abs(kFromU - KC) < 1e-12;
  const okRa = Math.abs(RaFromU - RA_C) < 1e-9 && Math.abs(RA_C - 657.5113644795163) < 1e-9;
  ok('analytic 2nd route: u=π²/2 ⇒ k_c=π/√2, Ra_c=27π⁴/4 (independent of the golden search)',
     okK && okRa, `k_c=${kFromU.toFixed(12)}, Ra_c=${RaFromU.toFixed(10)}`);
}

// (B) UNSTABLE-BAND edges are TRUE roots: Ra_marginal(kLow)=Ra_marginal(kHigh)=Ra to
//     < 1e-9, the band strictly brackets k_c, and it WIDENS monotonically with Ra.
{
  let ok1 = true, widths = [], prevW = 0, monoWiden = true, detail = '';
  for (const Ra of [700, 800, 1000, 1500, 1972]){
    const b = unstableBand(Ra);
    const e1 = Math.abs(raMarginal(b.kLow) - Ra), e2 = Math.abs(raMarginal(b.kHigh) - Ra);
    if (!(e1 < 1e-9 && e2 < 1e-9 && b.kLow < KC && KC < b.kHigh)) ok1 = false;
    const w = b.kHigh - b.kLow; widths.push(w.toFixed(3));
    if (Ra > 700 && !(w > prevW)) monoWiden = false; prevW = w;
  }
  ok('unstable band: edges are exact roots, bracket k_c, and widen monotonically with Ra',
     ok1 && monoWiden, `widths(Ra=700..1972) = [${widths.join(', ')}]`);
}

// (C) FINER NEG-CONTROL ladder — sigmaSign=−1 ∀k and Re(growthRate)<0 ∀k across a
//     deep ladder of negative Ra and a fine k-grid (the heat-from-above proof, hard).
{
  let allOK = true, worst = -Infinity, where = '';
  for (const Ra of [-0.1, -1, -10, -100, -1000, -1e4, -1e6, -1e8, -1e10]){
    for (let i = 0; i <= 1500; i++){
      const k = 0.02 + (15 - 0.02) * i / 1500;
      if (sigmaSign(Ra, k) !== -1) allOK = false;
      const g = growthRate(Ra, k, { Pr: 1 });
      if (g >= 0) allOK = false;
      if (g > worst){ worst = g; where = `Ra=${Ra},k=${k.toFixed(2)}`; }
    }
  }
  ok('finer neg-control ladder: Ra∈[−0.1 … −1e10], 1500-pt k-grid — sigmaSign=−1, Re(σ)<0 ∀k',
     allOK, `worst Re(σ) = ${worst.toExponential(3)} < 0 (${where})`);
}

// (D) Pr-INDEPENDENCE of onset: the marginal curve (σ=0 locus) is independent of Pr.
//     For a panel of Pr, sigmaSign matches sign(Ra−Ra_marginal) AND σ=0 within fp at
//     onset — only the GROWTH MAGNITUDE depends on Pr, never the threshold.
{
  let ok1 = true, detail = '';
  for (const Pr of [0.1, 0.7, 1, 7, 100]){
    const sig0 = growthRate(RA_C, KC, { Pr });
    if (Math.abs(sig0) > 1e-7) ok1 = false;
    // above onset grows, below decays, for this Pr:
    if (!(growthRate(1.5 * RA_C, KC, { Pr }) > 0)) ok1 = false;
    if (!(growthRate(0.5 * RA_C, KC, { Pr }) < 0)) ok1 = false;
    detail += `Pr=${Pr}:σ₀=${sig0.toExponential(1)} `;
  }
  ok('Pr-independence of onset: σ=0 at (Ra_c,k_c) for every Pr; only the rate scales with Pr',
     ok1, detail.trim());
}

// (E) SOLVER DETERMINISM, second-seed family: independent seeds replay byte-identically
//     and two different seeds diverge (the field is a deterministic function of its seed).
{
  const opt = { nx: 40, nz: 17, Lx: 2 * Math.SQRT2, Pr: 1, Ra: 2 * RA_C, eps: 0.05 };
  const run = (seed) => {
    const s = makeCell({ ...opt, seed });
    const t = [];
    for (let n = 0; n < 80; n++){ step(s, 2e-4, 10); if (n % 16 === 0) t.push(thetaRMS(s).toExponential(14)); }
    return t.join(',');
  };
  const a = run(2024), b = run(2024), c = run(2025), d = run(99);
  ok('solver determinism (2nd-seed family): seed replays byte-identical; distinct seeds diverge',
     a === b && a !== c && a !== d && c !== d, a === b ? 'replays exact; 2024≠2025≠99' : 'replay differed!');
}

// (F) SOLVER NEG-CONTROL, long decay: a strongly heat-from-above cell (Ra = −Ra_c)
//     seeded with a full eps comb DIES — thetaRMS and the peak speed both fall toward
//     zero. A dropped blob would never wind. The proof, made watchable and watched.
{
  const s = makeCell({ nx: 64, nz: 33, Lx: 4 * Math.SQRT2, Pr: 1, Ra: -RA_C, seed: 3, eps: 0.05 });
  const r0 = thetaRMS(s);
  for (let n = 0; n < 2500; n++) step(s, 2e-4, 12);
  const r1 = thetaRMS(s);
  let maxSpd = 0;
  for (let j = 1; j < s.nz - 1; j++) for (let i = 0; i < s.nx; i++){
    const [u, w] = velocityAt(s, i * s.Lx / s.nx, j / (s.nz - 1)); maxSpd = Math.max(maxSpd, Math.hypot(u, w));
  }
  ok('solver neg-control: heated-from-above cell (Ra=−Ra_c) decays to still — no winding',
     r1 < r0 * 0.05 && maxSpd < 0.05, `rms ${r0.toFixed(3)}→${r1.toExponential(2)}, peak speed ${maxSpd.toExponential(2)}`);
}

// (G) SOLVER SIGN-AGREEMENT at a SECOND supercriticality (1.5·Ra_c): the measured
//     growth rate hugs the proof's growthRate (a second point on the dispersion curve).
{
  const Ra = 1.5 * RA_C;
  const s = makeCell({ nx: 48, nz: 33, Lx: 2 * Math.SQRT2, Pr: 1, Ra, seed: 7, eps: 0, noiseFloor: 0 });
  seedEigenmode(s, KC, 1e-4, 1);
  const r0 = thetaRMS(s);
  const NM = 140, dt = 2e-4;
  for (let n = 0; n < NM; n++) step(s, dt, 18);
  const r1 = thetaRMS(s);
  const sigMeas = Math.log(r1 / r0) / (NM * dt);
  const pred = growthRate(Ra, KC, { Pr: 1 });
  const rel = Math.abs(sigMeas - pred) / Math.abs(pred);
  ok('solver sign-agreement @1.5·Ra_c: measured σ hugs growthRate (a 2nd dispersion point)',
     sigMeas > 0 && rel < 0.2, `σ_meas=${sigMeas.toFixed(3)} vs σ=${pred.toFixed(3)} (|Δ|/σ=${(rel*100).toFixed(1)}%)`);
}

// (H) THE DIAL MAPPING is exact + single-sourced: ΔT=20 ⇒ Ra_c, ΔT=60 ⇒ 3× supercrit,
//     ΔT<0 ⇒ Ra<0 (heat from above). RA_PER_DEG = Ra_c/20 to < 1e-12.
{
  const okMap = Math.abs(RA_PER_DEG - RA_C / 20) < 1e-12 && DELTAT_C === 20
    && Math.abs(20 * RA_PER_DEG - RA_C) < 1e-9
    && Math.abs(60 * RA_PER_DEG - 3 * RA_C) < 1e-9
    && (-20 * RA_PER_DEG) < 0;
  ok('dial mapping exact: ΔT=20→Ra_c, ΔT=60→3·Ra_c, ΔT<0→Ra<0 (RA_PER_DEG=Ra_c/20)',
     okMap, `RA_PER_DEG=${RA_PER_DEG.toFixed(6)}, ΔT60→Ra=${(60*RA_PER_DEG).toFixed(1)}`);
}

// (I) SINGLE-SOURCE GREP — the dispersion-relation literal (k*k+PI*PI)**3/(k*k) must
//     be LIVE in EXACTLY one .mjs/.js file: the-rolling-room/core.mjs. We ASSEMBLE the
//     search needle from parts so this test file is not itself a hit; the forge-inlined
//     copy lives only in index.html (not scanned — .html is excluded). Walk the repo.
{
  const needle = ['(k*k + PI', '*PI)**3 / (', 'k*k)'].join('');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, '..');
  const SKIP = new Set(['.git', 'node_modules', 'assets', 'scratchpad']);
  const hits = [];
  const walk = (dir) => {
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents){
      if (e.isDirectory()){ if (!SKIP.has(e.name)) walk(path.join(dir, e.name)); continue; }
      if (!/\.[cm]?js$/.test(e.name)) continue;       // live JS/MJS only (.html excluded)
      const p = path.join(dir, e.name);
      let txt; try { txt = fs.readFileSync(p, 'utf8'); } catch { continue; }
      if (txt.includes(needle)) hits.push(path.relative(repoRoot, p));
    }
  };
  walk(repoRoot);
  const onlyCore = hits.length === 1 && hits[0] === path.join('the-rolling-room', 'core.mjs');
  ok('single-source: the dispersion literal is live in EXACTLY the-rolling-room/core.mjs',
     onlyCore, `hits = [${hits.join(', ')}]`);
}

// (J) SOFT PERF SMOKE — time one display frame (96×33, 75 substeps, 12 SOR sweeps) of a
//     blooming cell. REPORT only; this does NOT gate CI (machine-dependent). The browser
//     adds render cost on top, so the real fps is measured fresh-eyes in-page.
{
  const s = makeCell({ nx: 96, nz: 33, Lx: 4 * Math.SQRT2, Pr: 1, Ra: 2 * RA_C, seed: 1, eps: 0.05 });
  for (let n = 0; n < 75 * 10; n++) step(s, 2e-4, 12);   // warm into the bloom
  const t0 = Date.now();
  for (let n = 0; n < 75; n++) step(s, 2e-4, 12);
  const ms = Date.now() - t0;
  console.log(`  \x1b[36mℹ\x1b[0m perf smoke (report-only): one 96×33 frame ≈ ${ms}ms (solver only) → ~${(1000/ms).toFixed(0)}fps headroom`);
}

console.log('\n  ' + '─'.repeat(62));
if (fail === 0){
  console.log(`  \x1b[32mALL GREEN — ${pass}/${pass} checks pass (both layers).\x1b[0m`);
  console.log('  Ra_c = 27π⁴/4 pinned exact; the watched rolls are the honest ψ–ω field.\n');
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAILED — ${pass} pass, ${fail} fail.\x1b[0m`);
  for (const f of fails) console.log('    · ' + f);
  console.log('');
  process.exit(1);
}
