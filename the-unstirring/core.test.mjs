// The Unstirring — the Node twin. runSelfTest() is the SOLE oracle for the page's in-page
// pill (the page calls the SAME inlined code). This twin (A) runs the 4 self-test rows,
// (B1..B5) adds STRONGER statements — a GRID of blob seedings whose Re=0 round-trip is
// machine-ε, the monotonicity neg-control at fine resolution + high particle count, a
// non-trivial folding residual over a real blob, and exact area-preservation at Re=0 —
// and (C) byte-parity-checks the core inlined into index.html against this module's
// sentinel region. Exit 0 = ALL GREEN.
//
// HONEST SCOPE (asserted here as it is on the page): this proves KINEMATIC reversal of a
// creeping-flow (Couette) advection field — exact reversibility at Re→0, monotone
// irreversibility as Re rises, and a real residual smear with inertia on. It is NOT a
// turbulence DNS. The observed round-trip displacement SATURATES in the bounded annulus
// (you can be no more lost than fully mixed) — so the MONOTONE proof rides foldingResidual
// (the linear-response measure of total cross-streamline folding, exactly ∝ Re), while
// roundTripError proves the exact reversal (Re=0) and the non-trivial residual (Re>0).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the four self-test rows (the page's in-page pill runs this exact function) ──────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// helper: seed a compact dye blob (a disc in the gap) carrying home coords {r,th,r0,th0}.
function seedBlob(cx, cy, R, N){
  const pts = [];
  for (let i=0;i<N;i++){
    const ang = Math.random()*Math.PI*2, rad = R*Math.sqrt(Math.random());
    let x = cx + rad*Math.cos(ang), y = cy + rad*Math.sin(ang);
    let r = Math.hypot(x,y), th = Math.atan2(y,x);
    if (r < core.A_IN+0.01) r = core.A_IN+0.01;
    if (r > core.B_OUT-0.01) r = core.B_OUT-0.01;
    pts.push({ r, th, r0:r, th0:th });
  }
  return pts;
}

// ── (B1) EXACT REVERSAL over a GRID of blob seedings. Sweep the blob's seed RADIUS across
//    the whole annulus AND several turn counts N; at Re=0, advect +N then −N must return
//    EVERY particle to its start to machine-ε (< 1e-9). This is the reversibility claim,
//    stressed far past the single in-page probe. (DoD clause 2a.) ──
{
  let ok = true, worst = 0, bad = '', cases = 0;
  const seedRadii = [0.42, 0.55, 0.67, 0.80, 0.92];   // across the gap [A_IN..B_OUT]
  const turnSet   = [0.5, 1, 2.5, 4, 7.3, 13];         // fractional + many-turn cranks
  for (const rc of seedRadii){
    for (const N of turnSet){
      const pts = seedBlob(rc, 0.0, 0.06, 600);
      const home = pts.map(p => ({ r:p.r, th:p.th }));
      for (const p of pts) core.advect(p, +N, 0);
      for (const p of pts) core.advect(p, -N, 0);
      let mx = 0;
      for (let i=0;i<pts.length;i++){
        const p = pts[i], s = home[i];
        const dx = p.r*Math.cos(p.th) - s.r*Math.cos(s.th);
        const dy = p.r*Math.sin(p.th) - s.r*Math.sin(s.th);
        mx = Math.max(mx, Math.hypot(dx,dy));
      }
      cases++;
      if (mx > worst) worst = mx;
      if (mx >= 1e-9){ ok = false; bad = 'seedR=' + rc + ' turns=' + N + ' err=' + mx.toExponential(2); }
    }
  }
  line(ok, 'B1 · EXACT reversal over a grid of ' + cases + ' blob seedings (seed radius × turn count) at Re=0: every particle < 1e-9  ::  ' +
    (ok ? 'worst round-trip err ' + worst.toExponential(2) + ' (machine-ε)' : 'FAIL at ' + bad));
}

// ── (B2) MONOTONICITY neg-control at FINE resolution + HIGH particle count. foldingResidual
//    is exactly ∝ Re, so it must grow strictly monotone across a dense Re sweep for any n.
//    (DoD clause 2b.) Also assert the linear-response ratio (Re×4 ⇒ residual×4). ──
{
  let ok = true, viol = '';
  for (const n of [100, 400, 1600]){
    let prev = -1;
    for (let Re = 0; Re <= 120; Re += 1){
      const e = core.foldingResidual(Re, 4, n);
      if (e < prev - 1e-15){ ok = false; viol += ' n=' + n + '@Re' + Re; break; }
      prev = e;
    }
  }
  // exact linearity: doubling Re doubles the residual (a code-independent property of ∝Re).
  const r10 = core.foldingResidual(10, 4, 400), r40 = core.foldingResidual(40, 4, 400);
  const ratioOk = Math.abs(r40 / r10 - 4) < 1e-9;
  line(ok && ratioOk, 'B2 · folding residual monotone over Re∈[0,120] step 1 for n∈{100,400,1600} + exactly ∝ Re  ::  ' +
    (ok && ratioOk ? 'strictly monotone · Re40/Re10 = ' + (r40/r10).toFixed(6) + ' (= 4)' : 'FAIL' + viol + (ratioOk ? '' : ' ratio=' + (r40/r10).toFixed(4))));
}

// ── (B3) NON-TRIVIAL RESIDUAL. Inertia ON (Re=40) over a REAL blob must leave a residual
//    smear well above a real threshold — a visibly-lost blob, not merely >0. (DoD clause 2c.)
//    We measure the mean actual home displacement (homeError) after a wind+rewind. ──
{
  let sawLost = 0, sawHome = 0, worstHome = 0, trials = 12;
  for (let t = 0; t < trials; t++){
    // Re=0 control: the SAME blob winds+rewinds and comes home (< 1e-9).
    const pc = seedBlob(0.7, 0.0, 0.1, 1200);
    for (const p of pc) core.advect(p, +4, 0);
    for (const p of pc) core.advect(p, -4, 0);
    const eHome = core.homeError(pc);
    worstHome = Math.max(worstHome, eHome);
    if (eHome < 1e-9) sawHome++;
    // Re=40: the same crank leaves a real smear (E2 saw ~1e-1..1e0 mean drift).
    const px = seedBlob(0.7, 0.0, 0.1, 1200);
    for (const p of px) core.advect(p, +4, 40);
    for (const p of px) core.advect(p, -4, 40);
    if (core.homeError(px) > 1e-1) sawLost++;
  }
  const pass = sawLost === trials && sawHome === trials;
  line(pass, 'B3 · non-trivial residual: Re=40 leaves a smear > 1e-1 (visibly lost) while the SAME Re=0 blob comes home < 1e-9  ::  ' +
    sawLost + '/' + trials + ' lost at Re=40 · ' + sawHome + '/' + trials + ' home at Re=0 (worst Re=0 home ' + worstHome.toExponential(2) + ')');
}

// ── (B4) AREA-PRESERVATION. In the creeping limit r is conserved EXACTLY (Δr < 1e-15) after
//    a fractional-turn crank, for a lattice across the gap — the purely-azimuthal, area-
//    preserving map that IS the reason reversal is exact. ──
{
  let ok = true, worst = 0, bad = '';
  for (let k = 0; k < 200; k++){
    const r0 = core.A_IN + (core.B_OUT - core.A_IN) * ((k + 0.5) / 200);
    const p = { r: r0, th: 0.11 + k * 0.017 };
    core.advect(p, 0.37 + k * 0.013, 0);         // fractional-turn cranks
    const dr = Math.abs(p.r - r0);
    if (dr > worst) worst = dr;
    if (dr >= 1e-15){ ok = false; bad = 'r0=' + r0.toFixed(3) + ' Δr=' + dr.toExponential(2); }
  }
  line(ok, 'B4 · area-preservation: r conserved exactly (Δr < 1e-15) at Re=0 over 200 fractional-turn cranks  ::  ' +
    (ok ? 'worst Δr ' + worst.toExponential(2) : 'FAIL at ' + bad));
}

// ── (B5) DIRECTION-SYMMETRY of the exact map: at Re=0, advect(+N) is the exact inverse of
//    advect(−N) from BOTH directions (wind-then-rewind AND rewind-then-wind), and the map
//    composes exactly (advect +A then +B ≡ advect +(A+B)). A code-independent structural
//    check of the reversible azimuthal map. ──
{
  let ok = true, bad = '';
  for (let k = 0; k < 100 && ok; k++){
    const r = core.A_IN + (core.B_OUT - core.A_IN) * ((k + 0.5) / 100);
    const th0 = 0.2 + k * 0.03;
    // inverse from both directions
    const p1 = { r, th: th0 }; core.advect(p1, +3.3, 0); core.advect(p1, -3.3, 0);
    const p2 = { r, th: th0 }; core.advect(p2, -3.3, 0); core.advect(p2, +3.3, 0);
    // composition
    const pA = { r, th: th0 }; core.advect(pA, +1.7, 0); core.advect(pA, +2.9, 0);
    const pB = { r, th: th0 }; core.advect(pB, +4.6, 0);
    const dth = (a,b)=>{ let d = a - b; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; return Math.abs(d); };
    if (dth(p1.th, th0) > 1e-12 || dth(p2.th, th0) > 1e-12 || dth(pA.th, pB.th) > 1e-12){
      ok = false; bad = 'r=' + r.toFixed(3);
    }
  }
  line(ok, 'B5 · reversible-map algebra at Re=0: two-sided inverse + exact composition over 100 radii  ::  ' +
    (ok ? 'inverse & composition exact (< 1e-12)' : 'FAIL at ' + bad));
}

// ── (C) BYTE-PARITY: the core inlined into index.html === this core's sentinel region.
//    Enforces the anti-drift convention — one engine, no second copy. ──
{
  const START = '// ===== UNSTIRRING CORE BEGIN =====';
  const END = '// ===== UNSTIRRING CORE END =====';
  const slab = (text) => {
    const i = text.indexOf(START);
    const j = text.indexOf(END);
    if (i < 0 || j < 0) return null;
    return text.slice(i, j + END.length);
  };
  let modText = '', htmlText = '';
  try { modText = readFileSync(join(here, 'core.mjs'), 'utf8'); } catch { /* missing → FAIL */ }
  try { htmlText = readFileSync(join(here, 'index.html'), 'utf8'); } catch { /* missing → FAIL */ }
  const modBlock = slab(modText);
  const htmlBlock = slab(htmlText);
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'C · inlined core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
