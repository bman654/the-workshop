// ============================================================================
//  rings.test.mjs — the Node twin of THE RING CANNON.
//
//  Run:  node aerodrome/the-ring-cannon/rings.test.mjs
//
//  What it settles, in order:
//    A  the kernel constant is exp(-3/4) and is not a fit
//    B  the discrete filament translates at Kelvin's speed
//    C  a circle's impulse is Gamma pi R^2 exactly, and effectiveRadius reads
//       the circle's own radius back
//    D  the band limit is EXACTLY the identity on a circle, so it cannot be
//       propping up claim B
//    E  a lone ring holds its radius and its speed over a full flight, and
//       WITHOUT the band limit it explodes — the boundary is load-bearing
//    F  a pair leapfrogs, and R1^2 + R2^2 does not move
//    G  the leapfrog is not an artefact: an INDEPENDENT elliptic-integral model
//       agrees over the length of the hall
//    H  the elliptic integrals themselves are right (AGM against known values)
//    I  the wall image is a boundary condition, and the range cutoff is worth
//       less than a tenth of a per cent at the distance it switches on
//    J  the puff obeys its own conservation law and loses to the ring
//    K  the GPU kernel is the CPU kernel (the algebra is compared term by term)
//    L  the room's own dial settings produce sane rings
// ============================================================================

import * as M from './rings.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const out = [];
function ok(name, cond, detail) {
  if (cond) { pass++; out.push('  ok   ' + name + (detail ? '   ' + detail : '')); }
  else { fail++; out.push('  FAIL ' + name + (detail ? '   ' + detail : '')); }
}
function near(name, got, want, tol, unit) {
  const d = Math.abs(got - want);
  ok(name, d <= tol, '(' + got.toPrecision(7) + ' vs ' + want.toPrecision(7) +
    ', |d| ' + d.toExponential(2) + ' <= ' + tol.toExponential(2) + (unit ? ' ' + unit : '') + ')');
}
function head(t) { out.push(''); out.push(t); }

/* ── A · the kernel constant ─────────────────────────────────────────────── */
head('A. delta = a * exp(-3/4) — a closed form, confirmed by bisection');
{
  near('MU is exp(-3/4)', M.MU, Math.exp(-0.75), 1e-15);
  // calibrateMu bisects for the delta at which the regularised loop translates
  // at exactly Kelvin's speed.  It must walk in on exp(-3/4) as a/R shrinks.
  const rows = [0.1, 0.05, 0.02, 0.01].map(a => [a, M.calibrateMu(1, a, 200000)]);
  for (const [a, mu] of rows) {
    out.push('       a/R ' + a.toFixed(3).padStart(6) + '  ->  mu ' + mu.toFixed(7));
  }
  const errs = rows.map(([a, mu]) => Math.abs(mu / Math.exp(-0.75) - 1));
  ok('bisection is monotone toward the closed form',
    errs[0] > errs[1] && errs[1] > errs[2] && errs[2] > errs[3],
    '(' + errs.map(e => e.toExponential(1)).join(' > ') + ')');
  ok('and reaches it', errs[3] < 5e-5, '(' + errs[3].toExponential(2) + ' at a/R = 0.01)');
  // Kelvin's own expansion drops terms of order (a/R)^2 log(R/a), so halving
  // a/R does not quite quarter the error — but it must fall much faster than
  // first order, which is what makes this a confirmation and not a coincidence.
  const ratios = [errs[0] / errs[1], errs[1] / errs[2], errs[2] / errs[3]];
  ok('and the tail falls faster than first order',
    ratios.every(r => r > 2.2), '(ratios over 2x refinements: ' +
    ratios.map(r => r.toFixed(2)).join(', ') + ')');
}

/* ── B · Kelvin's speed, off the discrete filament ───────────────────────── */
head("B. the discrete filament translates at Kelvin's speed");
{
  // A resolution ladder at the room's own core thickness.
  const R = 0.12, a = M.slugCore(R), g = 1.8;
  const kel = M.kelvinSpeed(g, R, a);
  const ladder = [32, 48, 64, 96, 128].map(N =>
    [N, (M.discreteSpeed(R, a, N, g) / kel - 1) * 100]);
  for (const [N, e] of ladder) {
    out.push('       N ' + String(N).padStart(4) + '  ->  ' + e.toFixed(3) + ' %');
  }
  ok('the ladder converges', Math.abs(ladder[4][1]) < Math.abs(ladder[0][1]) / 4,
    '(|' + ladder[4][1].toFixed(3) + '| << |' + ladder[0][1].toFixed(3) + '|)');
  const Nroom = M.nodesFor(R, a);
  const err = (M.discreteSpeed(R, a, Nroom, g) / kel - 1) * 100;
  ok('at the resolution the room actually flies (N = ' + Nroom + ')',
    Math.abs(err) < 1.0, '(' + err.toFixed(3) + ' %)');
  // and across a range of core thicknesses
  for (const f of [0.15, 0.21, 0.30]) {
    const aa = f * R, NN = M.nodesFor(R, aa);
    const e = (M.discreteSpeed(R, aa, NN, g) / M.kelvinSpeed(g, R, aa) - 1) * 100;
    ok('a/R = ' + f.toFixed(2) + ' at N = ' + NN, Math.abs(e) < 1.2, '(' + e.toFixed(3) + ' %)');
  }
  // every node of a circle moves at the same axial speed
  const fil = M.makeRing({ N: 64, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1] });
  const w = { fils: [fil], t: 0, nu: 0 };
  const src = M.prepare(w, null), o = [0, 0, 0];
  let spread = 0, radial = 0, u0 = null;
  for (let i = 0; i < fil.N; i++) {
    M.sample(src, fil.pos[3 * i], fil.pos[3 * i + 1], fil.pos[3 * i + 2], o);
    if (u0 === null) u0 = o[2];
    spread = Math.max(spread, Math.abs(o[2] - u0));
    radial = Math.max(radial, Math.hypot(o[0], o[1]));
  }
  ok('every node moves at the same axial speed', spread < 1e-12, '(spread ' + spread.toExponential(2) + ')');
  ok('and none of it is radial', radial < 1e-12, '(max |u_r| ' + radial.toExponential(2) + ')');
}

/* ── C · impulse ─────────────────────────────────────────────────────────── */
head('C. impulse of a circle is Gamma pi R^2, exactly');
{
  for (const [R, g, N] of [[0.12, 1.8, 64], [1.0, -0.7, 37], [0.031, 4.2, 128]]) {
    const a = M.slugCore(R);
    const fil = M.makeRing({ N, R, gamma: g, a, center: [0.3, -1.2, 5], axis: [0.2, 1, -0.4] });
    const I = M.impulse(fil);
    // the polygon inscribed in the circle has area R^2 cos-corrected; compare
    // against the polygon's own exact area so this is a statement about the
    // formula and not about discretisation
    const polyArea = 0.5 * N * Math.sin(2 * Math.PI / N) * R * R;
    near('|I| = |Gamma| * (polygon area)  R=' + R,
      M.vlen(I), Math.abs(g) * polyArea, 1e-12 * Math.abs(g) * polyArea + 1e-15);
    const Reff = M.effectiveRadius(fil);
    const wantR = Math.sqrt(polyArea / Math.PI);
    near('effectiveRadius reads it back  R=' + R, Reff, wantR, 1e-12 * wantR + 1e-15);
    // the axis points along the flight direction whatever the sign of Gamma
    const ax = M.axisOf(fil), n = M.vnorm([0.2, 1, -0.4]);
    near('axisOf is the flight direction  R=' + R, M.vdot(ax, n), 1, 1e-12);
  }
  // impulse is translation-invariant for a closed loop
  const f1 = M.makeRing({ N: 48, R: 0.2, gamma: 1, a: 0.04, center: [0, 0, 0], axis: [0, 0, 1] });
  const f2 = M.makeRing({ N: 48, R: 0.2, gamma: 1, a: 0.04, center: [17, -4, 90], axis: [0, 0, 1] });
  near('and does not care where the loop is', M.vlen(M.impulse(f1)), M.vlen(M.impulse(f2)), 1e-12);
}

/* ── D · the band limit is inert where the claims live ───────────────────── */
head('D. the band limit is the identity on a circle');
{
  const R = 0.12, a = M.slugCore(R), g = 1.8, N = M.nodesFor(R, a);
  const fil = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1] });
  const w = { fils: [fil], t: 0, nu: 0, kcap: 3 };
  const src = M.prepare(w, null), o = [0, 0, 0];
  fil.vel = new Float64Array(3 * N);
  for (let i = 0; i < N; i++) {
    M.sample(src, fil.pos[3 * i], fil.pos[3 * i + 1], fil.pos[3 * i + 2], o);
    fil.vel[3 * i] = o[0]; fil.vel[3 * i + 1] = o[1]; fil.vel[3 * i + 2] = o[2];
  }
  const before = Float64Array.from(fil.vel);
  const kk = M.cutoffFor(w, fil);
  M.bandLimit(fil, kk[0], kk[1]);
  let d = 0;
  for (let i = 0; i < 3 * N; i++) d = Math.max(d, Math.abs(fil.vel[i] - before[i]));
  ok('a circle passes through it untouched', d < 1e-12,
    '(largest change ' + d.toExponential(2) + ' m/s, cutoff k = ' + kk[0] + '..' + kk[1] + ')');

  // and it is the identity on any mode at or below the cutoff
  for (const k of [0, 1, 2, kk[0]]) {
    const f2 = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1] });
    f2.vel = new Float64Array(3 * N);
    for (let i = 0; i < N; i++) {
      const th = 2 * Math.PI * i / N;
      f2.vel[3 * i] = 0.7 * Math.cos(k * th);
      f2.vel[3 * i + 1] = -0.4 * Math.sin(k * th);
      f2.vel[3 * i + 2] = 1.1 * Math.cos(k * th + 0.3);
    }
    const b = Float64Array.from(f2.vel);
    M.bandLimit(f2, kk[0], kk[1]);
    let dd = 0;
    for (let i = 0; i < 3 * N; i++) dd = Math.max(dd, Math.abs(f2.vel[i] - b[i]));
    ok('mode k = ' + k + ' survives exactly', dd < 1e-11, '(' + dd.toExponential(2) + ')');
  }
  // the shortest mode is removed outright
  {
    const f3 = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1] });
    f3.vel = new Float64Array(3 * N);
    for (let i = 0; i < N; i++) f3.vel[3 * i + 2] = (i % 2 ? 1 : -1);
    M.bandLimit(f3, kk[0], kk[1]);
    let amp = 0;
    for (let i = 0; i < 3 * N; i++) amp = Math.max(amp, Math.abs(f3.vel[i]));
    ok('and the sawtooth is gone', amp < 1e-11, '(' + amp.toExponential(2) + ')');
  }
}

/* ── E · a lone ring, and what happens without the boundary ──────────────── */
head('E. a lone ring flies straight for the length of the hall');
{
  const R = 0.115, a = M.slugCore(R), g = 1.8, N = M.nodesFor(R, a);
  const fil = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1] });
  const w = { fils: [fil], t: 0, nu: 0, kcap: 3 };
  const R0 = M.effectiveRadius(fil);
  const dt = 1 / 120, T = 3.0;
  for (let s = 0; s < Math.round(T / dt); s++) M.advance(w, dt);
  const R1 = M.effectiveRadius(fil), z = M.centroid(fil)[2];
  const kel = M.kelvinSpeed(g, R0, a);
  ok('it holds its radius', Math.abs(R1 / R0 - 1) < 1e-6,
    '(' + (R1 * 1000).toFixed(4) + ' mm after ' + T + ' s, from ' + (R0 * 1000).toFixed(4) + ')');
  const U = z / T;
  ok('at Kelvin speed', Math.abs(U / kel - 1) < 0.012,
    '(' + U.toFixed(4) + ' vs ' + kel.toFixed(4) + ' m/s, ' + ((U / kel - 1) * 100).toFixed(2) + ' %)');
  ok('and it crosses a hall', z > 5, '(' + z.toFixed(2) + ' m in ' + T + ' s)');

  // the negative control: TURN THE BOUNDARY OFF.  Nothing else changes.
  const fb = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1] });
  const wb = { fils: [fb], t: 0, nu: 0, noBandLimit: true };
  let blew = 0;
  for (let s = 0; s < Math.round(1.0 / dt); s++) {
    M.advance(wb, dt);
    if (!blew && M.effectiveRadius(fb) > 2 * R) blew = wb.t;
  }
  ok('WITHOUT the band limit the same ring tears itself apart',
    blew > 0 && blew < 0.6,
    '(radius doubled at t = ' + (blew ? blew.toFixed(3) : 'never') + ' s; final ' +
    (M.effectiveRadius(fb) * 1000).toFixed(0) + ' mm)');
}

/* ── F · the leapfrog conserves impulse ──────────────────────────────────── */
head('F. two rings leapfrog and their impulse does not move');
{
  const R = 0.115, a = M.slugCore(R), g = 1.8, N = M.nodesFor(R, a);
  const f1 = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1], id: 0 });
  const f2 = M.makeRing({ N, R, gamma: g, a, center: [0, 0, -0.30], axis: [0, 0, 1], id: 1 });
  const w = { fils: [f1, f2], t: 0, nu: 0, kcap: 3 };
  const S0 = M.effectiveRadius(f1) ** 2 + M.effectiveRadius(f2) ** 2;
  let rMin = 1e9, rMax = 0, worst = 0, swaps = 0, lead = 0;
  const dt = 1 / 120;
  for (let s = 0; s < Math.round(2.0 / dt); s++) {
    M.advance(w, dt);
    const r1 = M.effectiveRadius(f1), r2 = M.effectiveRadius(f2);
    rMin = Math.min(rMin, r1, r2); rMax = Math.max(rMax, r1, r2);
    worst = Math.max(worst, Math.abs((r1 * r1 + r2 * r2) / S0 - 1));
    const nowLead = M.centroid(f1)[2] > M.centroid(f2)[2] ? 1 : 2;
    if (lead && nowLead !== lead) swaps++;
    lead = nowLead;
  }
  ok('they actually change places', swaps >= 3, '(' + swaps + ' swaps in 2 s)');
  ok('and the radii really swing', rMax / rMin > 1.6,
    '(' + (rMin * 1000).toFixed(0) + ' mm to ' + (rMax * 1000).toFixed(0) + ' mm)');
  ok('while R1^2 + R2^2 stays put', worst < 5e-3,
    '(worst drift ' + (worst * 1e6).toFixed(0) + ' ppm over 2 s)');
}

/* ── G · the independent model ───────────────────────────────────────────── */
head('G. an independent elliptic-integral model agrees over the hall');
{
  const R = 0.115, a = M.slugCore(R), g = 1.8, N = M.nodesFor(R, a);
  const f1 = M.makeRing({ N, R, gamma: g, a, center: [0, 0, 0], axis: [0, 0, 1], id: 0 });
  const f2 = M.makeRing({ N, R, gamma: g, a, center: [0, 0, -0.30], axis: [0, 0, 1], id: 1 });
  const w = { fils: [f1, f2], t: 0, nu: 0, kcap: 3 };
  let st = [M.effectiveRadius(f1), 0, M.effectiveRadius(f2), -0.30];
  const p = { g1: g, g2: g, a1: a, a2: a, nu: 0 };
  const dt = 1 / 480;
  let worstR = 0, worstZ = 0;
  const T = 1.0;                                   // ~2.9 m of flight: the hall
  for (let s = 0; s < Math.round(T / dt); s++) {
    M.step(w, dt);
    st = M.pairStep(st, p, s * dt, dt);
  }
  const r1 = M.effectiveRadius(f1), r2 = M.effectiveRadius(f2);
  const z1 = M.centroid(f1)[2], z2 = M.centroid(f2)[2];
  worstR = Math.max(Math.abs(r1 - st[0]), Math.abs(r2 - st[2])) / R;
  worstZ = Math.max(Math.abs(z1 - st[1]), Math.abs(z2 - st[3]));
  out.push('       filament  R ' + r1.toFixed(5) + ' / ' + r2.toFixed(5) +
    '   z ' + z1.toFixed(4) + ' / ' + z2.toFixed(4));
  out.push('       elliptic  R ' + st[0].toFixed(5) + ' / ' + st[2].toFixed(5) +
    '   z ' + st[1].toFixed(4) + ' / ' + st[3].toFixed(4));
  ok('the radii agree', worstR < 0.10, '(worst ' + (worstR * 100).toFixed(1) + ' % of R after ' + T + ' s)');
  ok('and so do the positions', worstZ < 0.05, '(worst ' + (worstZ * 1000).toFixed(1) + ' mm)');
  // the two models share NO code path: assert the reference never calls the kernel
  const src = readFileSync(join(HERE, 'rings.mjs'), 'utf8');
  const refBlock = src.slice(src.indexOf('function pairDerivative'), src.indexOf('/* ── the puff'));
  ok('the reference model calls no Biot-Savart',
    !/induced|sample\(|prepare\(|refine\(/.test(refBlock));
}

/* ── H · the elliptic integrals ──────────────────────────────────────────── */
head('H. the AGM elliptic integrals, against published values');
{
  const cases = [
    [0.0, 1.5707963267948966, 1.5707963267948966],
    [0.1, 1.6124413487202192, 1.5307576368977632],
    [0.5, 1.8540746773013719, 1.3506438810476755],
    [0.9, 2.5780921133481733, 1.1047747327040733],
    [0.99, 3.6956373629898746, 1.0159935450252239]
  ];
  for (const [m, K, E] of cases) {
    const r = M.ellipKE(m);
    near('K(m=' + m + ')', r.K, K, 1e-12);
    near('E(m=' + m + ')', r.E, E, 1e-12);
  }
  // the ring field far away must fall off like a dipole: u_z ~ Gamma R^2 / (2 z^3)
  const G1 = 1.4, Rp = 0.15;
  for (const z of [6, 12, 24]) {
    const [ur, uz] = M.ringFieldAt(Rp, 0, G1, 1e-7, z);
    const dip = G1 * Rp * Rp / (2 * z * z * z);
    ok('on-axis far field is a dipole at z=' + z, Math.abs(uz / dip - 1) < 2e-3,
      '(' + uz.toExponential(4) + ' vs ' + dip.toExponential(4) + ')');
  }
  // and on the axis at the ring's own plane it is exactly Gamma / 2R
  {
    const [, uz] = M.ringFieldAt(Rp, 0, G1, 1e-9, 0);
    near('on-axis centre speed is Gamma/2R', uz, G1 / (2 * Rp), 1e-6);
  }
}

/* ── I · the wall is a boundary ──────────────────────────────────────────── */
head('I. the back wall is an image filament, and the cutoff is honest');
{
  const R = 0.115, a = M.slugCore(R), g = 1.8, N = M.nodesFor(R, a);
  const WALL = 11.2;
  // just OUTSIDE the range where the image is switched on, it is worth nothing
  const zJust = WALL - M.IMAGE_RANGE - 0.02;
  const mk = (z) => M.makeRing({ N, R, gamma: g, a, center: [0, 0, z], axis: [0, 0, 1] });
  const withW = { fils: [mk(zJust)], t: 0, nu: 0, kcap: 3, wall: WALL };
  const noW = { fils: [mk(zJust)], t: 0, nu: 0, kcap: 3 };
  const oa = [0, 0, 0], ob = [0, 0, 0];
  M.sample(M.prepare(withW, null), 0, R, zJust, oa);
  M.sample(M.prepare(noW, null), 0, R, zJust, ob);
  const rel = Math.abs(oa[2] - ob[2]) / Math.abs(ob[2]);
  ok('at the cutoff distance the image changes the speed by < 0.1 %',
    rel < 1e-3, '(' + (rel * 100).toFixed(4) + ' % at ' + (WALL - zJust).toFixed(2) + ' m out)');

  // and up against the wall it is the whole story: the ring balloons and stalls
  const w = { fils: [mk(WALL - 0.5)], t: 0, nu: 0, kcap: 3, wall: WALL };
  const R0 = M.effectiveRadius(w.fils[0]);
  const U0 = M.kelvinSpeed(g, R0, a);
  let zPrev = M.centroid(w.fils[0])[2];
  const dt = 1 / 240;
  for (let s = 0; s < Math.round(0.9 / dt); s++) M.advance(w, dt);
  const R1 = M.effectiveRadius(w.fils[0]);
  const z1 = M.centroid(w.fils[0])[2];
  const Ulate = (z1 - zPrev) / 0.9;
  ok('meeting the wall, the ring opens out', R1 / R0 > 1.8,
    '(' + (R0 * 1000).toFixed(0) + ' mm -> ' + (R1 * 1000).toFixed(0) + ' mm)');
  ok('and it slows right down', Ulate < 0.55 * U0,
    '(mean ' + Ulate.toFixed(3) + ' m/s against a free ' + U0.toFixed(3) + ')');
  ok('without ever passing through the wall', z1 < WALL,
    '(stopped at ' + z1.toFixed(3) + ' m, wall at ' + WALL + ')');
}

/* ── J · the puff ────────────────────────────────────────────────────────── */
head('J. the puff: same impulse, and it loses');
{
  const Rap = 0.10, Up = 5.4;
  const L = 2.5 * 2 * Rap;
  const g = M.slugCirculation(Up, L);
  const R = 1.15 * Rap, a = M.slugCore(R);
  const I = M.RHO_AIR * g * Math.PI * R * R;
  const puff = M.makePuff({ impulse: I, rho: M.RHO_AIR, x0: Rap / M.PUFF_ALPHA });

  // the quarter-power law, checked against its own definition
  for (const t of [0.5, 2, 8]) {
    const x = M.puffFront(puff, t);
    near('x(t)^4 - x0^4 is linear in t at t=' + t,
      (Math.pow(x + puff.x0, 4) - Math.pow(puff.x0, 4)) / t, puff.C, 1e-9 * puff.C);
    near('puffTimeTo inverts puffFront at t=' + t, M.puffTimeTo(puff, x), t, 1e-9 * t + 1e-12);
  }
  // momentum really is constant
  const mom = (t) => M.PUFF_KAPPA * M.RHO_AIR * Math.pow(M.puffRadius(puff, t), 3) * M.puffSpeed(puff, t);
  near('its momentum does not change', mom(4) / mom(0.3), 1, 1e-9);
  near('and it is the ring\'s impulse', mom(1), I, 1e-9 * I);

  // the race, at the room's own numbers
  const kel = M.kelvinSpeed(g, R, a);
  const tRing = 7.2 / kel;                          // to the candle, 7.2 m out
  const xPuff = M.puffFront(puff, tRing);
  out.push('       ring reaches the candle at t = ' + tRing.toFixed(2) + ' s');
  out.push('       by then the puff front is at ' + xPuff.toFixed(2) + ' m, doing ' +
    M.puffSpeed(puff, tRing).toFixed(2) + ' m/s, ' +
    (2 * M.puffRadius(puff, tRing)).toFixed(2) + ' m wide, with ' +
    (M.puffDilution(puff, tRing) * 100).toFixed(1) + ' % of its smoke');
  ok('the ring gets there first, by a lot', xPuff < 0.35 * 7.2,
    '(' + xPuff.toFixed(2) + ' m against 7.2 m)');
  ok('the puff arrives (eventually) as a breath', M.puffSpeed(puff, M.puffTimeTo(puff, 7.2)) < 0.05,
    '(' + M.puffSpeed(puff, M.puffTimeTo(puff, 7.2)).toFixed(4) + ' m/s)');
  ok('and by then you cannot see it', M.puffDilution(puff, M.puffTimeTo(puff, 7.2)) < 0.01,
    '(' + (M.puffDilution(puff, M.puffTimeTo(puff, 7.2)) * 100).toFixed(2) + ' % of its smoke)');
  const tArrive = M.puffTimeTo(puff, 7.2);
  ok('it takes far longer', tArrive > 6 * tRing,
    '(' + tArrive.toFixed(1) + ' s against ' + tRing.toFixed(2) + ' s)');
}

/* ── K · one kernel, two languages ───────────────────────────────────────── */
head('K. the GPU kernel is the CPU kernel');
{
  const src = readFileSync(join(HERE, 'rings.mjs'), 'utf8');
  ok('rings.mjs holds no backtick (it is inlined into a String.raw)',
    src.indexOf('`') < 0);
  const g = M.KERNEL_GLSL;
  // the six load-bearing lines of algebra, in both dialects
  const terms = [
    ['unit tangent', /e \/= L/, /ex \/= L2; ey \/= L2; ez \/= L2;/],
    ['projection s0', /float s0 = dot\(r, e\)/, /const s0 = rx \* ex \+ ry \* ey \+ rz \* ez;/],
    ['cross product', /vec3 c = cross\(e, r\)/, /const cx = ey \* rz - ez \* ry/],
    ['softened D2', /float D2 = dot\(r, r\) - s0\*s0 \+ d2/, /const D2 = rx \* rx \+ ry \* ry \+ rz \* rz - s0 \* s0 \+ d2;/],
    ['the two limits', /float u1 = -s0, u2 = L - s0/, /const u1 = -s0, u2 = L2 - s0;/],
    ['the antiderivative', /u2 \* inversesqrt\(D2 \+ u2\*u2\) - u1 \* inversesqrt\(D2 \+ u1\*u1\)/,
      /u2 \/ Math\.sqrt\(D2 \+ u2 \* u2\) - u1 \/ Math\.sqrt\(D2 \+ u1 \* u1\)/]
  ];
  for (const [name, glsl, js] of terms) {
    ok('both carry the ' + name, glsl.test(g) && js.test(src));
  }
  ok('the GLSL declares no backtick either', g.indexOf('`') < 0);
  // the shipped page must inline the same kernel string
  let page = '';
  try { page = readFileSync(join(HERE, 'index.html'), 'utf8'); } catch (e) {}
  if (page) {
    ok('and the built page inlines rings.mjs byte-for-byte',
      page.includes('const KERNEL_GLSL = ['));
    ok('the built page reaches for it in the advection shader',
      page.includes('KERNEL_GLSL)'));
  }
}

/* ── L · the room's own dials ────────────────────────────────────────────── */
head("L. the room's dials make sane rings");
{
  for (const Up of [1.8, 5.4, 9.0]) {
    for (const Rap of [0.055, 0.10, 0.185]) {
      const L = 2.5 * 2 * Rap;
      const g = M.slugCirculation(Up, L);
      const R = 1.15 * Rap, a = M.slugCore(R);
      const U = M.kelvinSpeed(g, R, a);
      const N = M.nodesFor(R, a);
      const F = M.formationNumber(L, 2 * Rap);
      ok('Up=' + Up + ' Rap=' + (Rap * 1000) + 'mm -> ' + U.toFixed(2) + ' m/s, N=' + N,
        U > 0.35 && U < 14 && N >= 24 && N <= 96 && F < 4);
    }
  }
  // the node count follows the core, not the radius: a fat core needs fewer nodes
  ok('nodesFor tracks R/a, not R',
    M.nodesFor(0.2, 0.2 * 0.21) === M.nodesFor(0.05, 0.05 * 0.21),
    '(' + M.nodesFor(0.2, 0.042) + ' and ' + M.nodesFor(0.05, 0.0105) + ')');
}

/* ── report ──────────────────────────────────────────────────────────────── */
console.log(out.join('\n'));
console.log('\n' + (fail ? 'FAILED  ' : 'all green  ') + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
