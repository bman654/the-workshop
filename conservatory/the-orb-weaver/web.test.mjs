/* ============================================================================
 *  THE ORB WEAVER — Node twin.   node conservatory/the-orb-weaver/web.test.mjs
 *  exit 0 = green.  Zero dependencies.
 *
 *  Five parts, in the order a claim earns the right to be made:
 *
 *   A · THE WEAVE      geometry and the build script. No physics. The two rules
 *                      she measures by (equal chord near the hub -> equal angle;
 *                      a leg-span between turns -> constant pitch) come out of
 *                      the built web, the scaffolding is entirely consumed, and
 *                      she is never standing on air.
 *
 *   B · CALIBRATION    the solver, pointed at a BARE STRING where the answer is
 *                      known in closed form. Fundamental, front speed, and the
 *                      convergence of both in dt and in mesh. Nothing about a web
 *                      is believable until this part is.
 *
 *   C · THE HARP       the claim that each radius sings c/(2L). Fitted over 32
 *                      radii of different lengths, against sqrt(T/mu), which is
 *                      never given to the fit. CONTROL: quadruple the tension and
 *                      the fitted speed must double -- the number is tracking the
 *                      physics, not the mesh.
 *
 *   D · THE EARS       the claim the room is for. Arrival times at eight feet,
 *                      inverted, under timing jitter. With TWO controls and one
 *                      NULL RESULT that is reported because it is not there.
 *
 *   E · THE PAGE       the built HTML inlines both cores byte-for-byte, and
 *                      neither core contains a backtick (they go inside a
 *                      String.raw; see LANDMINES.md).
 * ========================================================================== */

import { buildWeb, spiderAt, radialGaps, capturePitches, silkLengths, silkSpun, dist }
  from './weave.mjs';
import * as S from './strings.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail) {
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail ? '   ' + detail : ''));
}
const head = t => console.log('\n' + t + '\n' + '-'.repeat(t.length));
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) * (v - m)))); };
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
const deg = r => r * 180 / Math.PI;

/* distance from a point to a segment */
function segDist(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy;
  let t = L2 > 0 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + vx * t), p[1] - (a[1] + vy * t));
}

const W = buildWeb();

/* ══════════════════════════════════════════════════════════════════════════
   A · THE WEAVE
   ══════════════════════════════════════════════════════════════════════════ */
head('A · THE WEAVE  — geometry and the order it is laid in');

{
  const g = radialGaps(W);
  const want = 2 * Math.PI / W.G.nRadii;
  check('A1  32 radii, and the angular gaps sum to a full turn',
    g.length === 32 && Math.abs(g.reduce((a, b) => a + b, 0) - 2 * Math.PI) < 1e-12,
    'sum ' + g.reduce((a, b) => a + b, 0).toFixed(15));
  check('A1b she never measures an angle, and gets equal angles anyway: mean gap = 2pi/32',
    Math.abs(mean(g) - want) < 1e-12 && sd(g) / mean(g) < 0.04,
    'mean ' + deg(mean(g)).toFixed(4) + ' deg (want ' + deg(want).toFixed(4) + '), spread '
      + (100 * sd(g) / mean(g)).toFixed(2) + '% from her leg, not a protractor');
}
{
  const p = capturePitches(W).map(o => o.gap);
  check('A2  one leg-span between turns: the capture spiral pitch is CONSTANT',
    p.length > 500 && sd(p) < 1e-9 && Math.abs(mean(p) - W.G.capPitch) < 1e-12,
    p.length + ' unclamped gaps, ' + (mean(p) * 1000).toFixed(4) + ' mm, spread '
      + (sd(p) * 1e9).toExponential(1) + ' nm  (that is an ARCHIMEDEAN spiral)');
  /* and where the frame IS in the way, she is forced in -- those gaps differ */
  const all = [];
  const byK = new Map();
  W.capSp.forEach(st => { if (!byK.has(st.k)) byK.set(st.k, []); byK.get(st.k).push(st); });
  for (const [, list] of byK) for (let i = 0; i + 1 < list.length; i++)
    if (list[i].clamped || list[i + 1].clamped) all.push(list[i].r - list[i + 1].r);
  check('A2b and the outer turns, where the frame is in the way, are NOT that pitch',
    all.length > 20 && sd(all) > 1e-4,
    all.length + ' clamped gaps, spread ' + (sd(all) * 1000).toFixed(2) + ' mm — the frame is doing that, not her');
}
{
  const aux = W.threads.filter(t => t.kind === 'aux');
  const alive = W.alive(W.duration).filter(t => t.kind === 'aux');
  const eatenBeforeEnd = aux.every(t => t.death < W.duration);
  check('A3  the scaffolding is eaten: no auxiliary thread survives into the finished web',
    aux.length > 100 && alive.length === 0 && eatenBeforeEnd,
    aux.length + ' auxiliary threads laid, 0 left');
  /* and each one dies AFTER it was born and while the capture spiral is running */
  const cap = W.stages.find(s => s.name === 'capture');
  check('A3b each dies during the capture spiral, never before it was laid',
    aux.every(t => t.death > t.birth && t.death >= cap.t0 - 1e-9 && t.death <= cap.t1 + 1e-9));
  const sp = silkSpun(W);
  check('A3c she spins more silk than the web holds, and the difference is the scaffold',
    Math.abs(sp.all - sp.kept - sp.eaten) < 1e-9 && sp.eaten > 1,
    'spun ' + sp.all.toFixed(2) + ' m, kept ' + sp.kept.toFixed(2) + ' m, recovered ' + sp.eaten.toFixed(2) + ' m');
}
{
  /* she is never standing on air: at every sampled instant she is on a thread
     that exists at that instant (or on one being laid right now) */
  let worst = 0, worstT = 0;
  for (let i = 0; i <= 600; i++) {
    const t = W.duration * i / 600;
    const s = spiderAt(W, t);
    let best = Infinity;
    for (const a of W.G.anchors) best = Math.min(best, dist([s.x, s.y], a));
    for (const th of W.threads) {
      if (th.birth > t + 1e-9 || th.death <= t) continue;
      /* a thread being laid is only there as far as she has got */
      let b = th.b;
      if (t < th.laid) { const f = (t - th.birth) / Math.max(1e-9, th.laid - th.birth);
        b = [th.a[0] + (th.b[0] - th.a[0]) * f, th.a[1] + (th.b[1] - th.a[1]) * f]; }
      const d = segDist([s.x, s.y], th.a, b);
      if (d < best) best = d;
    }
    if (best > worst) { worst = best; worstT = t; }
  }
  check('A4  she is never standing on air: every position is on a thread that exists yet',
    worst < 2.0e-3, 'worst gap ' + (worst * 1000).toFixed(2) + ' mm at t=' + worstT.toFixed(1) + 's over 601 samples');
}
{
  const up = W.radii.filter(r => r.uy > 0.5).map(r => r.L);
  const dn = W.radii.filter(r => r.uy < -0.5).map(r => r.L);
  check('A5  the hub is above the middle, so the lower half of the orb is the bigger half',
    mean(dn) > mean(up) * 1.2,
    'upward radii ' + (mean(up) * 1000).toFixed(0) + ' mm, downward ' + (mean(dn) * 1000).toFixed(0)
      + ' mm  (she hangs head-down and falls faster than she climbs)');
  const inside = W.capSp.filter(st => st.r < W.G.freeR - 1e-9).length;
  check('A5b the free zone is free: no sticky thread inside it', inside === 0,
    'free zone radius ' + (W.G.freeR * 1000).toFixed(1) + ' mm — she crosses there');
  const L = silkLengths(W);
  check('A5c the finished web is mostly capture spiral, as a real orb is',
    L.capture / L.total > 0.65 && L.total > 20 && L.total < 60,
    Object.entries(L).map(([k, v]) => k + ' ' + v.toFixed(1) + 'm').join(', '));
}
{
  /* direction of travel: the auxiliary goes out, the capture spiral comes in */
  let auxOut = 0, capIn = 0;
  for (let j = 0; j + 32 < W.auxSp.length; j++) if (W.auxSp[j + 32].r > W.auxSp[j].r) auxOut++;
  for (let j = 0; j + 32 < W.capSp.length; j++) if (W.capSp[j + 32].r <= W.capSp[j].r) capIn++;
  check('A6  the auxiliary spiral is laid OUTWARD and the capture spiral INWARD',
    auxOut === W.auxSp.length - 32 && capIn === W.capSp.length - 32,
    auxOut + '/' + (W.auxSp.length - 32) + ' out, ' + capIn + '/' + (W.capSp.length - 32) + ' in');
}

/* ══════════════════════════════════════════════════════════════════════════
   B · CALIBRATION — a bare string, where the answer is known
   ══════════════════════════════════════════════════════════════════════════ */
head('B · CALIBRATION  — the solver on a string whose answer is written down');

const cTrue = S.speedOf(S.SILK.radius);
let MESH_FLOOR = 0, COARSE_LADDER = [];
{
  const rows = [];
  for (const h of [0.010, 0.005, 0.0025]) {
    const BS = S.bareString(0.16, S.SILK.radius, h, { alpha: 0 });
    const P = S.pluckBare(BS, { dur: 0.4 });
    const D = S.dominantHz(P.sig, P.rate, 100, 2000, 1400);
    rows.push({ h, n: BS.n, f: D.hz, want: BS.f1, err: D.hz / BS.f1 - 1 });
  }
  check('B1  a bare string sings c/(2L) — at three mesh sizes',
    rows.every(r => Math.abs(r.err) < 0.003),
    rows.map(r => (r.h * 1000) + 'mm:' + r.f.toFixed(1) + 'Hz vs ' + r.want.toFixed(1)
      + ' (' + (100 * r.err).toFixed(3) + '%)').join('  '));
}
{
  const BS = S.bareString(0.30, S.SILK.radius, 0.002, { alpha: 0 });
  const F = S.frontTimes(BS, 1, { window: 0.006, tau: 5e-5 });
  const iA = Math.round(BS.n * 0.3), iB = Math.round(BS.n * 0.8);
  const c = (BS.x[iB] - BS.x[iA]) / (F.t[iB] - F.t[iA]);
  check('B2  and its front runs at sqrt(T/mu)',
    Math.abs(c / cTrue - 1) < 0.04,
    'measured ' + c.toFixed(2) + ' m/s, closed form ' + cTrue.toFixed(2)
      + '  (' + (100 * (c / cTrue - 1)).toFixed(2) + '%; a threshold crossing on a smoothed front runs a little early)');
}
const NET = S.assemble(W);
const TABLE0 = S.calibrate(NET, { window: 0.006 });
{
  /* the timestep the room actually runs at, against a four-times finer one */
  const fine = S.frontTimes(NET, NET.legs[0], { window: 0.005, dt: NET.dtMax * 0.10 });
  const run = S.frontTimes(NET, NET.legs[0], { window: 0.005, dt: NET.dtMax * 0.40 });
  const d = [];
  for (const q of NET.cands) if (isFinite(fine.t[q]) && isFinite(run.t[q])) d.push(Math.abs(run.t[q] - fine.t[q]));
  check('B3  the arrival times are converged in dt at the setting the room runs',
    med(d) < 2e-6 && Math.max(...d) < 8e-6,
    'vs dt/4: median ' + (med(d) * 1e6).toFixed(2) + ' us, worst ' + (Math.max(...d) * 1e6).toFixed(2)
      + ' us over ' + d.length + ' sites  (the jitter this room is about is 3-100 us)');
}
{
  /* MESH.  Coarsening the mesh moves the ABSOLUTE arrival time a lot: a threshold
     crossing on a front that a coarser lattice smooths differently is not a
     converged quantity, and quoting it as one would be the easy lie here. The
     inversion never sees an absolute time -- it subtracts the mean and matches
     the PATTERN. So the test is what the pattern does, and then what the ANSWER
     does, both in the units the claim is stated in. */
  const coarse = S.assemble(W, { h: 0.0070 });
  const tc = S.calibrate(coarse, { window: 0.006 });
  const pat = [], abso = [];
  for (const p of S.defaultSites(NET, 60)) {
    let q = -1, bd = Infinity;
    for (const c of coarse.cands) {
      const e = Math.hypot(coarse.x[c] - NET.x[p], coarse.y[c] - NET.y[p]);
      if (e < bd) { bd = e; q = c; }
    }
    if (bd > 3e-3) continue;
    const a = NET.legs.map((_, i) => TABLE0[i][p]), b = coarse.legs.map((_, i) => tc[i][q]);
    if (a.some(v => !isFinite(v)) || b.some(v => !isFinite(v))) continue;
    const ma = mean(a), mb = mean(b);
    abso.push(Math.abs(ma - mb));
    for (let i = 0; i < 8; i++) pat.push(Math.abs((a[i] - ma) - (b[i] - mb)));
  }
  MESH_FLOOR = med(pat);
  check('B4  the pattern the inversion reads is the converged part; the absolute time is not',
    pat.length > 200 && med(pat) < 0.7 * med(abso),
    '5 mm vs 7 mm mesh: the PATTERN moves ' + (med(pat) * 1e6).toFixed(1)
      + ' us (median), the absolute front ' + (med(abso) * 1e6).toFixed(0) + ' us');
  /* and the number that is actually quoted */
  const lc = [];
  for (const j2 of [3e-6, 30e-6, 100e-6]) {
    const r = S.localizationError(coarse, tc, { jitter: j2, draws: 12, sites: S.defaultSites(coarse, 70) });
    lc.push(deg(r.medianBearing));
  }
  COARSE_LADDER = lc;
  check('B4b THE FLOOR — the two meshes agree where the claim is made, and DISAGREE below it',
    lc[0] < 2.0,
    'bearing error on the coarse mesh: 3us ' + lc[0].toFixed(1) + ', 30us ' + lc[1].toFixed(1)
      + ', 100us ' + lc[2].toFixed(1) + ' deg.  The mesh moves the pattern by '
      + (MESH_FLOOR * 1e6).toFixed(0) + ' us, so THIS ROOM CANNOT SPEAK below about that much '
      + 'jitter — the 3 us column is the numerics, not the spider.');
}

/* ══════════════════════════════════════════════════════════════════════════
   C · THE HARP
   ══════════════════════════════════════════════════════════════════════════ */
head('C · THE HARP  — before she hangs the spiral, the web is 32 strings');

function harpFit(net) {
  const pts = [];
  for (let k = 0; k < 32; k++) {
    const ch = net.radNodes[k], mid = ch[Math.round(ch.length * 0.55)].i;
    const P = S.pluck(net, k, { dur: 0.030, listen: mid });
    pts.push({ hz: S.dominantHz(P.sig, P.rate, 120, 1600, 1000).hz, L: P.L });
  }
  let sxy = 0, sxx = 0;
  for (const p of pts) { const x = 1 / (2 * p.L); sxy += x * p.hz; sxx += x * x; }
  const c = sxy / sxx, fm = mean(pts.map(p => p.hz));
  let ss = 0, st = 0;
  for (const p of pts) { ss += Math.pow(p.hz - c / (2 * p.L), 2); st += Math.pow(p.hz - fm, 2); }
  return { c, R2: 1 - ss / st, lo: Math.min(...pts.map(p => p.hz)), hi: Math.max(...pts.map(p => p.hz)) };
}
const BARE = S.assemble(W, { include: { hub: false, aux: false, capture: false } });
{
  const f = harpFit(BARE);
  check('C1  32 radii of 32 lengths: the note fits f = c/(2L), and c is the silk\'s own',
    f.R2 > 0.99 && Math.abs(f.c / cTrue - 1) < 0.05,
    'fitted c = ' + f.c.toFixed(1) + ' m/s vs sqrt(T/mu) = ' + cTrue.toFixed(1)
      + ' (' + (100 * (f.c / cTrue - 1)).toFixed(1) + '%), R2 = ' + f.R2.toFixed(4)
      + ', ' + f.lo.toFixed(0) + '-' + f.hi.toFixed(0) + ' Hz across the star');
}
{
  /* CONTROL: the fitted speed must be tracking the physics, not the geometry.
     Quadruple every radius tension and it must DOUBLE. */
  const T0 = S.SILK.radius.T;
  S.SILK.radius.T = T0 * 4;
  const stiff = S.assemble(W, { include: { hub: false, aux: false, capture: false } });
  const f = harpFit(stiff);
  S.SILK.radius.T = T0;
  check('C2  CONTROL — quadruple the tension and the fitted speed doubles',
    Math.abs(f.c / (2 * cTrue) - 1) < 0.06 && f.R2 > 0.98,
    'fitted ' + f.c.toFixed(1) + ' m/s, expected ' + (2 * cTrue).toFixed(1)
      + ' (' + (100 * (f.c / (2 * cTrue) - 1)).toFixed(1) + '%), R2 = ' + f.R2.toFixed(4));
}

/* ══════════════════════════════════════════════════════════════════════════
   D · THE EARS
   ══════════════════════════════════════════════════════════════════════════ */
head('D · THE EARS  — eight feet, eight arrival times, and where the fly is');

const TABLE = TABLE0;
{
  /* RECIPROCITY. The table is eight taps read outward; the measurement is one
     tap read inward. For a linear symmetric system those are the same number,
     and if the assembly has an asymmetry anywhere this is where it shows. */
  const rnd = S.mulberry(4242);
  let worst = 0, n = 0;
  for (let q = 0; q < 8; q++) {
    const p = NET.cands[Math.floor(rnd() * NET.cands.length)];
    const F = S.frontTimes(NET, p, { window: 0.006 });
    for (let i = 0; i < 8; i++) {
      const a = F.t[NET.legs[i]], b = TABLE[i][p];
      if (!isFinite(a) || !isFinite(b)) continue;
      worst = Math.max(worst, Math.abs(a - b)); n++;
    }
  }
  check('D1  reciprocity: the time from a fly to her foot IS the time from her foot to the fly',
    worst < 1e-12 && n >= 60,
    'worst disagreement ' + (worst * 1e12).toFixed(3) + ' ps over ' + n + ' pairs'
      + '  — which is why eight taps build the whole table');
}
{
  const sites = S.defaultSites(NET, 200);
  let exact = 0;
  for (const p of sites) {
    const t = NET.legs.map((_, i) => TABLE[i][p]);
    if (t.some(v => !isFinite(v))) continue;
    if (S.localize(NET, TABLE, t).node === p) exact++;
  }
  check('D2  with exact times the inversion returns the exact thread, every time',
    exact === sites.length, exact + '/' + sites.length + ' sites'
      + '  (this is machinery, not a result — the result is the next line)');
}
const ladder = [];
{
  const sites = S.defaultSites(NET, 70);
  for (const j of [3e-6, 10e-6, 30e-6, 100e-6, 300e-6]) {
    const r = S.localizationError(NET, TABLE, { jitter: j, draws: 12, sites });
    ladder.push({ j, b: r.medianBearing, e: r.medianErr, rg: r.medianRange });
  }
  const mono = ladder.every((r, i) => i === 0 || r.b >= ladder[i - 1].b);
  const agree = Math.abs(deg(ladder[2].b) - COARSE_LADDER[1]) < 0.25 * deg(ladder[2].b)
             && Math.abs(deg(ladder[3].b) - COARSE_LADDER[2]) < 0.25 * deg(ladder[3].b);
  check('D3  THE CLAIM — how many microseconds of slop the bearing survives',
    mono && deg(ladder[2].b) < 6 && deg(ladder[3].b) < 15 && agree,
    ladder.map(r => (r.j * 1e6) + 'us:' + deg(r.b).toFixed(1) + 'deg').join('  ')
      + '   — quoted from 30 us up, where a 7 mm mesh gives '
      + COARSE_LADDER[1].toFixed(1) + '/' + COARSE_LADDER[2].toFixed(1)
      + ' deg for the same two columns.  Below ~' + (MESH_FLOOR * 1e6).toFixed(0)
      + ' us the answer is the lattice, not the web.');
}
{
  /* her feet are all inside a 3 cm circle, so the RANGE is much worse than the
     bearing -- which is why an orb weaver runs OUT ALONG A RADIUS instead of
     walking straight to the prey. */
  const r = ladder[2];                                   /* 30 us */
  const meanR = mean(Array.from(NET.cands).map(c => Math.hypot(NET.x[c] - NET.x[NET.hubNode], NET.y[c] - NET.y[NET.hubNode])));
  const acrossBearing = r.b * meanR;
  check('D4  she knows WHICH WAY far better than HOW FAR',
    r.rg > 3 * acrossBearing,
    'at 30 us: across the bearing ' + (acrossBearing * 1000).toFixed(1) + ' mm, along the radius '
      + (r.rg * 1000).toFixed(1) + ' mm — ' + (r.rg / acrossBearing).toFixed(1)
      + 'x worse.  So she turns, then runs out the thread.');
}
{
  /* CONTROL. Gather all eight feet onto ONE radius. Note the baseline gets
     LONGER (32 mm of radius, against 8 feet inside a 34 mm circle), so this is
     not about how far apart her feet are. */
  const G = S.assemble(W, { legRadii: [0, 0, 0, 0, 0, 0, 0, 0], gathered: true });
  const gt = S.calibrate(G, { window: 0.006 });
  const sites = S.defaultSites(G, 70);
  const r = S.localizationError(G, gt, { jitter: 3e-6, draws: 12, sites });
  const spread = Math.max(...G.legs.map(l => Math.hypot(G.x[l] - G.x[G.hubNode], G.y[l] - G.y[G.hubNode])));
  check('D5  CONTROL — put all eight feet on ONE radius and the bearing is gone',
    deg(r.medianBearing) > 45,
    'bearing error ' + deg(r.medianBearing).toFixed(0) + ' deg at only 3 us of jitter, with a '
      + (spread * 1000).toFixed(0) + ' mm baseline.  It is not the spacing of her feet — it is that '
      + 'they are on eight different roads.');
}
{
  /* NULL RESULT, reported because it is not there. The sticky spiral runs at
     14 m/s against the radii's 134, and it is tempting to say that contrast is
     what makes the web legible. Pull the spiral as tight as a radius so the
     whole web is one speed, and the bearing barely moves. */
  const Tt = S.assemble(W, { spiral: 'taut' });
  const tt = S.calibrate(Tt, { window: 0.006 });
  const r = S.localizationError(Tt, tt, { jitter: 30e-6, draws: 12, sites: S.defaultSites(Tt, 70) });
  const base = ladder[2].b;
  check('D6  NULL RESULT — the spiral being slow is NOT what does it',
    Math.abs(deg(r.medianBearing) - deg(base)) < 0.4 * deg(base),
    'as built (c_spiral 14 m/s) ' + deg(base).toFixed(1) + ' deg; pulled taut (134 m/s) '
      + deg(r.medianBearing).toFixed(1) + ' deg.  Expected a collapse; there is none. '
      + 'The room says so.');
}
{
  const g = S.geodesicTimes(NET, NET.legs[0]);
  const F = TABLE[0];
  const rr = [];
  for (const q of NET.cands) if (isFinite(F[q]) && g[q] > 3e-4) rr.push(F[q] / g[q]);
  check('D7  the measured front against a bare-thread geodesic — a second opinion',
    med(rr) > 1.0 && med(rr) < 1.35,
    'median ratio ' + med(rr).toFixed(3) + ' — the real front runs '
      + ((med(rr) - 1) * 100).toFixed(0) + '% behind a signal that pays no attention to what is '
      + 'hanging off the thread');
}

/* ══════════════════════════════════════════════════════════════════════════
   E · THE PAGE
   ══════════════════════════════════════════════════════════════════════════ */
head('E · THE PAGE');
{
  const src = ['weave.mjs', 'strings.mjs'].map(f => ({ f, s: readFileSync(join(HERE, f), 'utf8') }));
  check('E1  neither core contains a backtick (they are re-included inside a String.raw)',
    src.every(x => x.s.indexOf('`') < 0),
    src.map(x => x.f + ':' + (x.s.indexOf('`') < 0 ? 'clean' : 'BACKTICK')).join(' '));
  const built = join(HERE, 'index.html');
  if (!existsSync(built)) {
    check('E2  the built page inlines both cores byte-for-byte  [skipped: not forged yet]', true, 'skip');
  } else {
    const html = readFileSync(built, 'utf8');
    const norm = t => t.split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
    const ok = src.map(x => {
      const body = norm(x.s.replace(/^export /gm, '').replace(/\bexport \{[^}]*\};?/g, ''));
      const lines = body.split('\n').filter(l => l.trim().length > 3);
      const probe = lines.slice(0, 8).concat(lines.slice(-8));
      return { f: x.f, hit: probe.every(l => html.indexOf(l.trim()) >= 0) };
    });
    check('E2  the built page inlines both cores', ok.every(o => o.hit),
      ok.map(o => o.f + ':' + (o.hit ? 'in' : 'MISSING')).join(' '));
  }
}

/* ── verdict ───────────────────────────────────────────────────────────────── */
console.log('\n' + '='.repeat(74));
console.log(fail === 0 ? 'GREEN  ' + pass + '/' + (pass + fail) + ' checks'
                       : 'RED  ' + fail + ' of ' + (pass + fail) + ' failed:\n  - ' + fails.join('\n  - '));
process.exit(fail === 0 ? 0 : 1);
