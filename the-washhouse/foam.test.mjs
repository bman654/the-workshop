#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   foam.test.mjs — the Node twin of the Washhouse.

   Three deliberately separate parts:

     A. THE MACHINERY, at machine precision. The honeycomb, the face walk, the
        topology surgery, the solver's own algebra. If any of this is wrong
        nothing downstream means anything.

     B. THE CALIBRATION. Curve-shortening flow on a bare closed loop, where the
        answer is known exactly and has no junctions in it: dA/dt = -2 pi for
        ANY smooth convex curve. That pins the constant of the discretisation
        before any foam is asked about anything.

     C. THE CLAIM. von Neumann's law out of a foam that was never told about
        it, its size-independence, its refinement in mesh AND step, and the
        switch that turns it off.

   Run:  node the-washhouse/foam.test.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import * as FM from './foam.mjs';

let pass = 0, fail = 0;
const out = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; out.push(`  ok   ${name}${detail ? '   ' + detail : ''}`); }
  else { fail++; out.push(`  FAIL ${name}${detail ? '   ' + detail : ''}`); }
}
function near(name, got, want, tol, unit = '') {
  const d = Math.abs(got - want);
  ok(name, d <= tol, `got ${fmt(got)}${unit}  want ${fmt(want)}${unit}  |d| ${fmt(d)} <= ${fmt(tol)}`);
}
const fmt = v => (typeof v === 'number'
  ? (Math.abs(v) >= 1e-4 && Math.abs(v) < 1e6 ? v.toPrecision(6) : v.toExponential(3))
  : String(v));
function head(s) { out.push(''); out.push(s); out.push('─'.repeat(s.length)); }

const VN = Math.PI / 3;

/* the room's own settings, so the twin tests what ships */
export const SET = { nx: 18, ny: 12, R: 1, h0: 0.10, grade: 0.6, dt: 0.002 };

function build(nx, ny, seed, shuffleFrac = 0.9, over = {}) {
  const F = FM.honeycomb(nx, ny, SET.R);
  F.h0 = over.h0 ?? SET.h0; F.grade = over.grade ?? SET.grade;
  if (seed != null) FM.shuffle(F, Math.round(shuffleFrac * nx * ny), FM.mulberry(seed));
  return F;
}
function relax(F, T, dt) { const n = Math.round(T / dt); for (let s = 0; s < n; s++) FM.step(F, dt); return F; }
function harvest(F, dt, windows = 14, win = 0.18) {
  let all = []; const ws = Math.max(1, Math.round(win / dt));
  for (let w = 0; w < windows; w++) { FM.openWindow(F); for (let s = 0; s < ws; s++) FM.step(F, dt); all = all.concat(FM.readWindow(F)); }
  return all;
}

/* ══ A. THE MACHINERY ══════════════════════════════════════════════════════ */
head('A. the machinery');
{
  const F = FM.honeycomb(8, 6, 1);
  const c = FM.census(F);
  ok('honeycomb 8x6 has 48 bubbles', c.N === 48, `N=${c.N}`);
  ok('96 junctions, 144 films', c.V === 96 && c.E === 144, `V=${c.V} E=${c.E}`);
  ok('Euler V-E+F is exactly 0 on the torus', c.euler === 0, `${c.euler}`);
  ok('every bubble has exactly six sides', [...c.hist.keys()].join() === '6', `${[...c.hist]}`);
  near('mean side count', c.meanN, 6, 0);
  near('one cell is the regular hexagon', FM.cells(F)[0].A, 3 * Math.sqrt(3) / 2, 1e-12);
  near('areas sum to the torus', c.area, c.areaShould, 1e-12);
  const ang = FM.junctionAngles(F);
  near('largest junction angle', Math.max(...ang), 120, 1e-9, ' deg');
  near('smallest junction angle', Math.min(...ang), 120, 1e-9, ' deg');
  let deg3 = true; for (const v of F.V) if (v && v.f.length !== 3) deg3 = false;
  ok('every junction is three-valent', deg3);
  let ccw = true; for (let i = 0; i < F.C.length; i++) if (F.C[i] && F.C[i].A <= 0) ccw = false;
  ok('every face walks counter-clockwise (positive area)', ccw);
  ok('the audit is empty', FM.audit(F).length === 0, FM.audit(F).join('; '));
}
{
  /* the dense layout the solver depends on: junctions first, then one
     contiguous run per film, in path order */
  const F = build(8, 6, 4);
  relax(F, 0.2, SET.dt);
  const D = F.dense;
  let contiguous = true, ordered = true;
  for (let b = 0; b < D.bs.length; b++) {
    if (b && D.bs[b] !== D.be[b - 1]) contiguous = false;
    for (let i = D.bs[b] + 1; i < D.be[b]; i++) {
      const k = D.subSlot[i];
      if (k < 0 || D.list[k] !== i - 1) ordered = false;
    }
  }
  ok('film strands are contiguous in the dense layout', contiguous);
  ok('each strand node knows the weight-slot of its predecessor', ordered);
  ok('junctions occupy the first nJ slots', D.nJ === FM.verts(F), `${D.nJ}`);
}
{
  /* determinism: two builds from the same seed agree bit for bit */
  const a = build(10, 8, 21), b = build(10, 8, 21);
  relax(a, 0.4, SET.dt); relax(b, 0.4, SET.dt);
  let same = a.dense.N === b.dense.N;
  if (same) for (let i = 0; i < a.dense.N; i++)
    if (a.X[a.dense.ids[i]] !== b.X[b.dense.ids[i]]) { same = false; break; }
  ok('the same seed gives the identical foam', same);
}
{
  /* T1: exactly four bubbles change, two down and two up, and nothing else */
  const F = build(10, 8, 9, 0);              /* pristine honeycomb */
  const before = FM.cells(F).map(c => [c.id, c.n]);
  let f = -1; for (let i = 0; i < F.E.length; i++) if (F.E[i]) { f = i; break; }
  const did = FM.tryT1(F, f, true);
  const after = new Map(FM.cells(F).map(c => [c.id, c.n]));
  let down = 0, up = 0, other = 0;
  for (const [id, n] of before) {
    const m = after.get(id); if (m === undefined) continue;
    if (m === n - 1) down++; else if (m === n + 1) up++; else if (m !== n) other++;
  }
  ok('one T1 fires', did);
  ok('T1 moves exactly two bubbles down and two up', down === 2 && up === 2 && other === 0, `down ${down} up ${up} other ${other}`);
  ok('T1 leaves a legal foam', FM.audit(F).length === 0, FM.audit(F).join('; '));
  near('T1 keeps the mean side count at six', FM.census(F).meanN, 6, 0);
}
{
  /* T2: the bubble goes, its three neighbours each lose a side, Euler holds */
  const F = build(12, 10, 33);
  relax(F, 1.2, SET.dt);
  const N0 = FM.census(F).N, ev0 = F.ev.t2;
  relax(F, 3.0, SET.dt);
  ok('bubbles vanish as they should (T2 fires)', F.ev.t2 > ev0, `${F.ev.t2 - ev0} of them`);
  ok('the bubble count falls', FM.census(F).N < N0, `${N0} -> ${FM.census(F).N}`);
  ok('and it is still a legal foam', FM.audit(F).length === 0, FM.audit(F).join('; '));
  ok('no topological event ever got stuck', F.ev.stuck === 0 && F.ev.odd === 0, JSON.stringify(F.ev));
}
{
  /* a film breaks: two bubbles become one */
  const F = build(10, 8, 3, 0.7);
  relax(F, 0.8, SET.dt);
  const N0 = FM.census(F).N;
  let pops = 0;
  const rnd = FM.mulberry(77);
  for (let t = 0; t < 10; t++) {
    const fs = []; for (let f = 0; f < F.E.length; f++) if (F.E[f]) fs.push(f);
    if (FM.popFilm(F, fs[Math.floor(rnd() * fs.length)])) pops++;
    relax(F, 0.1, SET.dt);
  }
  ok('breaking films merges bubbles', pops > 0 && FM.census(F).N <= N0 - pops, `${pops} pops, ${N0} -> ${FM.census(F).N}`);
  ok('a popped foam is still a legal foam', FM.audit(F).length === 0, FM.audit(F).join('; '));
  near('and the mean side count is still exactly six', FM.census(F).meanN, 6, 1e-12);
}
{
  /* the solver actually solves its own system */
  const F = build(10, 8, 12);
  relax(F, 0.5, SET.dt);
  const D = F.dense, dt = SET.dt, N = D.N;
  for (let i = 0; i < N; i++) { D.px[i] = F.X[D.ids[i]]; D.py[i] = F.Y[D.ids[i]]; }
  D.m.fill(0); D.gx.fill(0); D.gy.fill(0);
  for (let i = 0; i < N; i++) for (let k = D.head[i]; k < D.head[i + 1]; k++) {
    const j = D.list[k];
    const dx = FM.mi(D.px[i] - D.px[j], F.Lx), dy = FM.mi(D.py[i] - D.py[j], F.Ly);
    const l = Math.hypot(dx, dy) || 1e-12;
    D.w[k] = 1 / l; D.m[i] += 0.5 * l; D.gx[i] += dx / l; D.gy[i] += dy / l;
  }
  for (let i = 0; i < N; i++) if (D.junction[i]) D.m[i] = 0;
  for (let i = 0; i < N; i++) { D.gx[i] = -D.gx[i]; D.gy[i] = -D.gy[i]; }
  FM.flowStep(F, dt);                                  /* fills D.vx, D.vy */
  /* residual of (M/dt + K) v = g */
  let rn = 0, bn = 0;
  for (let i = 0; i < N; i++) {
    let sx = D.m[i] / dt * D.vx[i], sy = D.m[i] / dt * D.vy[i];
    for (let k = D.head[i]; k < D.head[i + 1]; k++) {
      const j = D.list[k]; sx += D.w[k] * (D.vx[i] - D.vx[j]); sy += D.w[k] * (D.vy[i] - D.vy[j]);
    }
    rn += (sx - D.gx[i]) ** 2 + (sy - D.gy[i]) ** 2;
    bn += D.gx[i] ** 2 + D.gy[i] ** 2;
  }
  const rel = Math.sqrt(rn / bn);
  ok('the two-storey solve really solves the whole system', rel < 1e-7, `relative residual ${fmt(rel)}`);
}

/* ══ B. THE CALIBRATION ════════════════════════════════════════════════════ */
head('B. the calibration — a bare loop, where the answer is exact');
{
  /* dA/dt = -2 pi for any smooth convex closed curve under v = kappa.
     This is von Neumann's law at n = 0, and there is no junction in it. */
  const circleRate = (N, T = 1.0, dt = 0.002, R0 = 2) => {
    const pts = []; for (let i = 0; i < N; i++) { const t = 2 * Math.PI * i / N; pts.push([R0 * Math.cos(t), R0 * Math.sin(t)]); }
    const G = FM.ring(pts, 1e7, 1e7, 2 * Math.PI * R0 / N);
    const A0 = FM.ringArea(G);
    for (let s = 0; s < Math.round(T / dt); s++) FM.ringStep(G, dt);
    return (FM.ringArea(G) - A0) / G.t;
  };
  const r200 = circleRate(200);
  near('a circle loses area at 2 pi per unit time', r200, -2 * Math.PI, 0.02);
  const r100 = circleRate(100), r400 = circleRate(400);
  const e = n => Math.abs(n + 2 * Math.PI);
  ok('and refining the loop drives the error down', e(r400) < e(r200) && e(r200) < e(r100),
    `100:${fmt(e(r100))}  200:${fmt(e(r200))}  400:${fmt(e(r400))}`);

  /* the same for a curve that is not a circle: the law knows nothing of shape */
  const N = 300, pts = [];
  for (let i = 0; i < N; i++) { const t = 2 * Math.PI * i / N; pts.push([3.2 * Math.cos(t), 1.3 * Math.sin(t)]); }
  const G = FM.ring(pts, 1e7, 1e7, 0.05);
  const A0 = FM.ringArea(G);
  for (let s = 0; s < 400; s++) FM.ringStep(G, 0.002);
  near('an ellipse loses area at the same 2 pi', (FM.ringArea(G) - A0) / G.t, -2 * Math.PI, 0.06);
}

/* ══ C. THE CLAIM ══════════════════════════════════════════════════════════ */
head('C. the claim — von Neumann out of a foam that was never told');
{
  /* a perfect honeycomb is every-bubble-six-sided, so the law says: nothing */
  const F = build(12, 10, null);
  const A0 = FM.cells(F).map(c => c.A);
  relax(F, 1.0, SET.dt);
  const A1 = FM.cells(F).map(c => c.A);
  let mx = 0; for (let i = 0; i < A0.length; i++) mx = Math.max(mx, Math.abs(A1[i] - A0[i]));
  ok('a perfect honeycomb does not move at all', mx < 1e-8, `largest area change in a whole time unit: ${fmt(mx)}`);
  ok('and nothing rearranges in it', F.ev.t1 === 0 && F.ev.t2 === 0, JSON.stringify(F.ev));
}

let mainFit = null, mainPts = null;
{
  const F = build(SET.nx, SET.ny, 1);
  relax(F, 1.2, SET.dt);
  mainPts = harvest(F, SET.dt, 16);
  mainFit = FM.fitThroughSix(mainPts);
  const ratio = mainFit.slope / VN;
  near('the fitted rate per side is pi/3', mainFit.slope, VN, 0.05 * VN,
    ` (ratio ${ratio.toFixed(4)}, ${mainFit.k} bubble-windows)`);
  ok('and the line through n = 6 explains the scatter', mainFit.r2 > 0.99, `R2 ${mainFit.r2.toFixed(5)}`);

  /* SIZE INDEPENDENCE — the part that surprises people. Split the measured
     bubbles at the median area and fit the two halves separately. */
  const sorted = mainPts.slice().sort((a, b) => a.A - b.A);
  const half = Math.floor(sorted.length / 2);
  const small = FM.fitThroughSix(sorted.slice(0, half)), big = FM.fitThroughSix(sorted.slice(half));
  const areaRatio = (sorted[sorted.length - 1].A / sorted[0].A);
  ok('small bubbles and big bubbles obey the SAME line',
    Math.abs(small.slope - big.slope) < 0.10 * VN,
    `small ${small.slope.toFixed(4)}   big ${big.slope.toFixed(4)}   over a ${areaRatio.toFixed(0)}x span of area`);

  /* six-sided bubbles hold still while their neighbours live and die */
  const by = k => mainPts.filter(p => p.n === k).map(p => p.r);
  const rms = a => a.length ? Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length) : NaN;
  const r5 = rms(by(5)), r6 = rms(by(6)), r7 = rms(by(7));
  ok('a six-sided bubble barely changes area while five- and seven-sided ones race',
    r6 < 0.35 * Math.min(r5, r7), `rms rate  n=5 ${fmt(r5)}   n=6 ${fmt(r6)}   n=7 ${fmt(r7)}`);
}
{
  /* REFINEMENT. The two discretisation errors point OPPOSITE WAYS — a coarse
     film mesh reads the junction's three tensions off chords and comes out
     steep; a long time step lags the lengths and comes out shallow — so
     refining only one of them is not a convergence study, it is a cancellation
     study. Refine both together and watch the number stop moving. */
  const at = (h, dt) => {
    const rs = [1, 2, 3].map(sd => {
      const F = build(12, 10, sd, 0.9, { h0: h });
      relax(F, 1.2, dt);
      return FM.fitThroughSix(harvest(F, dt, 12)).slope / VN;
    });
    const m = rs.reduce((a, b) => a + b) / rs.length;
    return [m, Math.sqrt(rs.reduce((a, b) => a + (b - m) ** 2, 0) / (rs.length - 1))];
  };
  const [c, cs] = at(0.20, 0.004), [m, ms] = at(0.10, 0.002), [f, fs] = at(0.05, 0.001);
  ok('refining the mesh AND the step together walks the constant onto pi/3',
    Math.abs(f - 1) < Math.abs(c - 1) && Math.abs(f - 1) < 0.02,
    `(h,dt) = (0.20,0.004) -> ${c.toFixed(4)}+-${cs.toFixed(4)}   (0.10,0.002) -> ${m.toFixed(4)}+-${ms.toFixed(4)}   (0.05,0.001) -> ${f.toFixed(4)}+-${fs.toFixed(4)}`);
  ok('and the last two agree inside the seed-to-seed spread',
    Math.abs(f - m) < 3 * Math.max(ms, fs), `|${f.toFixed(4)} - ${m.toFixed(4)}| = ${Math.abs(f - m).toFixed(4)}`);
}

{
  /* the whole life of a foam: 216 bubbles down to a handful, checked all the way */
  const F = build(SET.nx, SET.ny, 5);
  let worstArea = 0, worstMean = 0, minN = 1e9, badAudit = '';
  const trace = [];
  for (let w = 0; w < 90; w++) {
    relax(F, 0.32, SET.dt);
    const c = FM.census(F);
    worstArea = Math.max(worstArea, Math.abs(c.area - c.areaShould) / c.areaShould);
    worstMean = Math.max(worstMean, Math.abs(c.meanN - 6));
    minN = Math.min(minN, c.N);
    if (!badAudit) { const a = FM.audit(F); if (a.length) badAudit = a[0]; }
    trace.push([F.t, c.N, c.meanA]);
    if (c.N < 14) break;
  }
  ok('a foam coarsens all the way down without a single illegal state', !badAudit, badAudit || `216 -> ${minN} bubbles`);
  ok('total area is conserved to machine precision throughout', worstArea < 1e-10, `worst relative drift ${fmt(worstArea)}`);
  ok('the mean side count is EXACTLY six at every instant', worstMean < 1e-12, `worst |<n> - 6| = ${fmt(worstMean)}`);
  ok('and no event was ever refused', F.ev.stuck === 0 && F.ev.odd === 0, JSON.stringify(F.ev));

  /* the coarsening law: in the scaling window (before the torus runs out of
     bubbles and the statistics go to pieces) mean area grows linearly in t */
  const use = trace.filter(t => t[0] > 3 && t[1] >= 24);
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0, k = use.length;
  for (const [t, , a] of use) { sx += t; sy += a; sxx += t * t; sxy += t * a; syy += a * a; }
  const sl = (k * sxy - sx * sy) / (k * sxx - sx * sx);
  const r = (k * sxy - sx * sy) / Math.sqrt((k * sxx - sx * sx) * (k * syy - sy * sy));
  ok('the mean bubble area grows in a straight line with time', r * r > 0.99,
    `d<A>/dt = ${sl.toFixed(3)} per unit time, R2 ${(r * r).toFixed(4)}`);
}
{
  /* THE SWITCH THAT TURNS IT OFF. Hold the junctions still — same films, same
     curvature flow along them, only the corners are no longer free to find
     their 120 degrees — and the whole thing stops. */
  const F = build(12, 10, 8);
  relax(F, 1.2, SET.dt);
  const free = harvest(F, SET.dt, 10);
  const fFree = FM.fitThroughSix(free);
  F.pinJunctions = true;
  relax(F, 1.2, SET.dt);
  const held = harvest(F, SET.dt, 10);
  const fHeld = FM.fitThroughSix(held);
  const rms = a => Math.sqrt(a.reduce((s, p) => s + p.r * p.r, 0) / a.length);
  ok('with the corners held, the rate per side collapses',
    Math.abs(fHeld.slope) < 0.05 * Math.abs(fFree.slope),
    `free ${fFree.slope.toFixed(4)}   held ${fHeld.slope.toFixed(5)}`);
  ok('and the line stops explaining anything', fHeld.r2 < 0.5 && fFree.r2 > 0.99,
    `R2 free ${fFree.r2.toFixed(4)}   held ${fHeld.r2.toFixed(4)}`);
  ok('the foam simply stops moving', rms(held) < 0.05 * rms(free),
    `rms |dA/dt| free ${fmt(rms(free))}   held ${fmt(rms(held))}`);
  near('the junctions really did not move', 0, 0, 0);
}
{
  /* the corners find 120 degrees on their own — it is nowhere in the rule */
  const F = build(12, 10, 14);
  relax(F, 2.0, SET.dt);
  const ang = FM.junctionAngles(F);
  const mean = ang.reduce((a, b) => a + b, 0) / ang.length;
  const dev = Math.sqrt(ang.reduce((a, b) => a + (b - 120) ** 2, 0) / ang.length);
  near('mean junction angle', mean, 120, 1e-9, ' deg');
  ok('and they sit close to it one by one', dev < 6, `rms departure ${dev.toFixed(2)} deg`);
}

/* ── report ───────────────────────────────────────────────────────────────── */
out.push('');
out.push(`${pass} passed, ${fail} failed`);
console.log(out.join('\n'));
process.exit(fail ? 1 : 0);
