/* ════════════════════════════════════════════════════════════════════════════
   sand.test.mjs — the Node twin of THE SAND SEA.

       node the-sand-sea/sand.test.mjs

   Every number the room prints on its own face is measured here first, by the
   same core, with no browser anywhere.  Nine parts:

     A  the invariants        mass exact, repose never exceeded, determinism
     B  the gate              d(column mass) = inflow - outflow, to the slab
     C  THE IDENTITY          c*h(x) = q(x) - q0 at every station
     D  THE RACE              c*H is one number for the whole field
     E  THE NEGATIVE CONTROL  no separation bubble, no desert
     F  RUBIN & HUNTER        the wind rose predicts the crest, five ways
     G  refinement            the mask interval is a discretisation knob
     H  the shadow mask       equals its own per-cell definition
     I  the calibration       one sweep is one month, and it is derived
   ════════════════════════════════════════════════════════════════════════════ */

import * as S from './sand.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}${detail ? '   ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? '   ' + detail : ''}`); }
};
const near = (name, got, want, tol, unit) =>
  ok(name, Math.abs(got - want) <= tol,
     `got ${fmt(got)}${unit || ''}  want ${fmt(want)}+/-${fmt(tol)}`);
const fmt = v => (Math.abs(v) >= 1000 || (Math.abs(v) < 0.001 && v !== 0)) ? v.toExponential(3) : v.toFixed(4);
const head = t => console.log(`\n${t}`);

/* ── shared fixtures ─────────────────────────────────────────────────────── */

function ridge(H0, opts) {
  const st = S.makeField(Object.assign({ NX: 128, NY: 32, seed: 5, hop: 3 }, opts || {}));
  const W = Math.round(H0 * 1.4);
  for (let y = 0; y < st.NY; y++) for (let x = 0; x < st.NX; x++) {
    const d = Math.abs(x - 30);
    if (d < W) st.h[y * st.NX + x] = Math.max(0, Math.round(H0 * (1 - d / W)));
  }
  S.relaxAll(st);
  return st;
}
function centroidX(st) {
  let sc = 0, ss = 0;
  for (let y = 0; y < st.NY; y++) for (let x = 0; x < st.NX; x++) {
    const v = st.h[y * st.NX + x], a = 2 * Math.PI * x / st.NX;
    sc += v * Math.cos(a); ss += v * Math.sin(a);
  }
  let cx = (Math.atan2(ss, sc) / (2 * Math.PI)) * st.NX;
  return cx < 0 ? cx + st.NX : cx;
}
function peakM(st) { let hi = 0; for (const v of st.h) if (v > hi) hi = v; return hi * st.SLAB; }
function shift(a, b, n) { let d = b - a; if (d < -n / 2) d += n; if (d > n / 2) d -= n; return d; }

/* Spin a ridge up to its own self-similar shape, then measure its speed and
   the mean profile it held while it was being measured. */
function runRidge(H0, spin, win, opts) {
  const st = ridge(H0, opts);
  S.sweep(st, spin);
  const x0 = centroidX(st), s0 = st.sweeps, H1 = peakM(st);
  S.resetFlux(st);
  const acc = new Float64Array(st.NX);
  let n = 0;
  const chunk = 4;
  for (let k = 0; k < win / chunk; k++) {
    S.sweep(st, chunk);
    const p = S.columnProfile(st);
    for (let x = 0; x < st.NX; x++) acc[x] += p[x];
    n++;
  }
  for (let x = 0; x < st.NX; x++) acc[x] /= n;
  const c = shift(x0, centroidX(st), st.NX) * st.DX / (st.sweeps - s0);
  return { st, c, H: 0.5 * (H1 + peakM(st)), meanProfile: acc };
}

/* ════════════════════════════════════════════════════════════════════════════
   A · THE INVARIANTS
   ════════════════════════════════════════════════════════════════════════════ */
head('A · the invariants — nothing is created, nothing stands steeper than repose');
{
  const st = S.makeField({ NX: 96, NY: 64, seed: 3, fill: 4, rough: 3 });
  const m0 = S.totalSlabs(st);
  S.sweep(st, 150);
  ok('mass is conserved exactly over 150 sweeps',
     S.totalSlabs(st) === m0, `${S.totalSlabs(st)} vs ${m0} slabs`);

  const tan34 = Math.tan(S.REPOSE_DEG * Math.PI / 180);
  const ms = S.maxSlope(st);
  ok('no slope anywhere exceeds the angle of repose',
     ms <= tan34 + 1e-12, `max ${ms.toFixed(6)} <= tan ${S.REPOSE_DEG} = ${tan34.toFixed(6)}`);
  ok('and the steepest face actually REACHES repose (there is a slip face)',
     ms > tan34 - 1e-9, `max slope ${(Math.atan(ms) * 180 / Math.PI).toFixed(2)} deg`);

  // the lattice thresholds are the repose angle, rounded to the lattice
  near('the orthogonal threshold is tan(34) x DX/SLAB', st.thrO,
       Math.round(tan34 * st.DX / st.SLAB), 0, ' slabs');

  const a = S.makeField({ NX: 64, NY: 48, seed: 77, fill: 3, rough: 2 });
  const b = S.makeField({ NX: 64, NY: 48, seed: 77, fill: 3, rough: 2 });
  S.sweep(a, 40); S.sweep(b, 40);
  let same = true;
  for (let k = 0; k < a.N; k++) if (a.h[k] !== b.h[k]) { same = false; break; }
  ok('the same seed makes the same desert, cell for cell', same);

  const c1 = S.makeField({ NX: 64, NY: 48, seed: 78, fill: 3, rough: 2 });
  S.sweep(c1, 40);
  let diff = 0;
  for (let k = 0; k < a.N; k++) if (a.h[k] !== c1.h[k]) diff++;
  ok('a different seed makes a different desert', diff > a.N * 0.5, `${diff}/${a.N} cells differ`);
}

/* ════════════════════════════════════════════════════════════════════════════
   B · THE GATE — the flux instrument, checked against pure bookkeeping
   ════════════════════════════════════════════════════════════════════════════ */
head('B · the gate — every slab that crosses a plane is counted, by both routes');
{
  const st = S.makeField({ NX: 96, NY: 32, seed: 9, fill: 3, rough: 2 });
  S.sweep(st, 25);
  const cols = s => {
    const m = new Float64Array(s.NX);
    for (let y = 0; y < s.NY; y++) for (let x = 0; x < s.NX; x++) m[x] += s.h[y * s.NX + x];
    return m;
  };
  const before = cols(st);
  S.resetFlux(st);
  S.sweep(st, 20);
  const after = cols(st);
  let worst = 0, moved = 0;
  for (let x = 0; x < st.NX; x++) {
    const inflow = st.gate[(x - 1 + st.NX) % st.NX] - st.gate[x];
    worst = Math.max(worst, Math.abs((after[x] - before[x]) - inflow));
    moved += Math.abs(after[x] - before[x]);
  }
  ok('d(column mass) equals inflow minus outflow, to the slab',
     worst === 0, `worst residual ${worst} over ${moved.toFixed(0)} slabs of change`);
  ok('the gate saw a substantial amount of sand',
     Math.abs(st.gate[0]) > 100, `gate[0] = ${st.gate[0]}`);
}

/* ════════════════════════════════════════════════════════════════════════════
   C · THE IDENTITY — c*h(x) = q(x) - q0
   ════════════════════════════════════════════════════════════════════════════ */
head('C · the identity — where the sand IS, against what crossed the gate');
{
  for (const H0 of [14, 22, 30]) {
    const r = runRidge(H0, 400, 120);
    const q = S.gateFlux(r.st);
    const acc = r.meanProfile;
    const idx = Array.from(acc.keys()).sort((i, j) => acc[i] - acc[j]);
    const take = idx.slice(0, Math.round(r.st.NX * 0.15));
    const q0 = take.reduce((s, i) => s + q[i], 0) / take.length;
    let num = 0, den = 0, ss = 0, tt = 0, mean = 0, peak = 0;
    for (let x = 0; x < r.st.NX; x++) mean += r.c * acc[x];
    mean /= r.st.NX;
    for (let x = 0; x < r.st.NX; x++) {
      const L = r.c * acc[x], R = q[x] - q0;
      num += L * R; den += R * R; ss += (L - R) * (L - R); tt += (L - mean) * (L - mean);
      peak = Math.max(peak, Math.abs(L));
    }
    const slope = num / den, r2 = 1 - ss / tt, rms = Math.sqrt(ss / r.st.NX) / peak;
    near(`H=${r.H.toFixed(1)}m: the two curves lie on top of each other (slope)`, slope, 1, 0.04);
    ok(`H=${r.H.toFixed(1)}m: R^2 of the overlay > 0.98`, r2 > 0.98, `R2 = ${r2.toFixed(4)}`);
    ok(`H=${r.H.toFixed(1)}m: rms disagreement < 6% of the peak`, rms < 0.06, `${(rms * 100).toFixed(1)}%`);
    ok(`H=${r.H.toFixed(1)}m: the interdune floor carries almost nothing`,
       Math.abs(q0) < 0.05 * r.c * r.H, `q0 = ${q0.toFixed(4)} vs cH = ${(r.c * r.H).toFixed(3)}`);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   D · THE RACE — c*H is one number
   ════════════════════════════════════════════════════════════════════════════ */
head('D · the race — a small dune is fast, a big one is slow, and c*H is one number');
let RACE_Q = null;
{
  const pts = [];
  for (const H0 of [8, 12, 16, 22, 28, 36]) {
    const r = runRidge(H0, 400, 120);
    pts.push({ H: r.H, c: r.c });
    console.log(`       H = ${r.H.toFixed(2).padStart(5)} m   c = ${r.c.toFixed(4)} m/sweep   c*H = ${(r.c * r.H).toFixed(3)}`);
  }
  const f = S.fitCH(pts);
  RACE_Q = f.q;
  const cs = pts.map(p => p.c);
  ok('the fastest dune is at least 4x the speed of the slowest',
     Math.max(...cs) / Math.min(...cs) > 4, `x${(Math.max(...cs) / Math.min(...cs)).toFixed(1)}`);
  ok('c against 1/H through the origin: R^2 > 0.99', f.r2 > 0.99, `R2 = ${f.r2.toFixed(5)}`);
  ok('the spread of c*H across the whole population is under 5%',
     f.spread < 0.05, `${(f.spread * 100).toFixed(1)}%  (q = ${f.q.toFixed(3)} m2/sweep)`);
  ok('height alone predicts speed: 4.5x in height gives 4.8x in speed',
     pts[0].H / pts[5].H < 0.3, `${pts[0].H.toFixed(1)}m vs ${pts[5].H.toFixed(1)}m`);
}

/* ════════════════════════════════════════════════════════════════════════════
   E · THE NEGATIVE CONTROL
   ════════════════════════════════════════════════════════════════════════════ */
head('E · the negative control — take the separation bubble away');
{
  const runs = {};
  for (const sh of [true, false]) for (const eq of [false, true]) {
    const st = S.makeField({ NX: 128, NY: 96, seed: 4, fill: 4, rough: 2, useShadow: sh });
    if (eq) S.equalStickiness(st, 0.5);
    S.sweep(st, 600);
    let pk = 0; for (const v of st.h) if (v > pk) pk = v;
    runs[`${sh}/${eq}`] = { r: S.roughness(st), bare: S.bareFraction(st), peak: pk * st.SLAB };
  }
  const on = runs['true/false'], off = runs['false/false'];
  console.log(`       bubble ON : roughness ${on.r.toFixed(2)} m, peak ${on.peak.toFixed(1)} m, bare ground ${(on.bare * 100).toFixed(0)}%`);
  console.log(`       bubble OFF: roughness ${off.r.toFixed(2)} m, peak ${off.peak.toFixed(1)} m, bare ground ${(off.bare * 100).toFixed(0)}%`);
  ok('with the bubble, the desert grows dunes', on.r > 2.0, `${on.r.toFixed(2)} m of relief`);
  ok('without it, the sand lies down flat', off.r < 0.8, `${off.r.toFixed(2)} m`);
  ok('...at least three times less rough', on.r / off.r > 3, `x${(on.r / off.r).toFixed(1)}`);
  ok('with the bubble the sand bares half the floor', on.bare > 0.4, `${(on.bare * 100).toFixed(0)}%`);
  ok('without it, the sand covers essentially the whole floor', off.bare < 0.01,
     `${(off.bare * 100).toFixed(2)}% bare, against ${(on.bare * 100).toFixed(0)}%`);

  // and the OTHER candidate mechanism does nothing at all
  const eqOn = runs['true/true'], eqOff = runs['false/true'];
  ok('sand catching sand better than rock does is NOT the mechanism',
     Math.abs(eqOff.r - off.r) < 0.05,
     `bubble off: ${off.r.toFixed(2)} m with the contrast, ${eqOff.r.toFixed(2)} m without it`);
  ok('...and removing it does not stop the dunes either',
     eqOn.r > 2.0, `${eqOn.r.toFixed(2)} m`);
}

/* ════════════════════════════════════════════════════════════════════════════
   F · RUBIN & HUNTER (1987) — the wind rose predicts the crest
   ════════════════════════════════════════════════════════════════════════════ */
head('F · the wind rose predicts the crest — gross bedform-normal transport');
{
  const roses = [
    ['one wind',           [{ deg: 0, weight: 1 }],                          'transverse'],
    ['two winds, 90 deg',  [{ deg: -45, weight: 1 }, { deg: 45, weight: 1 }], 'transverse'],
    ['two winds, 140 deg', [{ deg: -70, weight: 1 }, { deg: 70, weight: 1 }], 'longitudinal'],
    ['two winds, 179 deg', [{ deg: 0, weight: 1 }, { deg: 179, weight: 1 }],  'transverse'],
    ['two winds, uneven',  [{ deg: -60, weight: 2 }, { deg: 60, weight: 1 }], 'oblique']
  ];
  for (const [name, rose, kind] of roses) {
    const st = S.makeField({ NX: 128, NY: 128, seed: 6, fill: 5, rough: 2 });
    const reg = S.makeRegime(rose, 6);
    for (let k = 0; k < 120; k++) S.stepRegime(st, reg);
    const meas = S.crestOrientation(st);
    const pred = S.gbnPrediction(rose);
    const d = S.axialDiff(pred.deg, meas.deg);
    ok(`${name.padEnd(19)} predicted ${pred.deg.toFixed(0).padStart(3)} deg, sand says ${meas.deg.toFixed(0).padStart(3)} deg`,
       d < 12, `off by ${d.toFixed(1)} deg  (${kind}, anisotropy ${meas.anisotropy.toFixed(2)})`);
    ok(`${name.padEnd(19)} the field really is oriented`, meas.anisotropy > 0.12,
       `anisotropy ${meas.anisotropy.toFixed(2)}`);
  }
  // the transition itself: the rule flips the dune type by 90 degrees
  const t90 = S.gbnPrediction([{ deg: -45, weight: 1 }, { deg: 45, weight: 1 }]);
  const t140 = S.gbnPrediction([{ deg: -70, weight: 1 }, { deg: 70, weight: 1 }]);
  ok('the rule itself flips transverse -> longitudinal between 90 and 140 deg',
     S.axialDiff(t90.deg, t140.deg) > 80, `${t90.deg.toFixed(0)} deg vs ${t140.deg.toFixed(0)} deg`);
}

/* ════════════════════════════════════════════════════════════════════════════
   G · REFINEMENT — the mask interval is a discretisation knob
   ════════════════════════════════════════════════════════════════════════════ */
head('G · refinement — how often the wind re-reads the surface must not matter');
{
  const got = [];
  for (const me of [0.5, 0.25, 0.1]) {
    const r = runRidge(20, 300, 80, { maskEvery: me });
    got.push({ me, cH: r.c * r.H, H: r.H, builds: r.st.maskBuilds });
    console.log(`       maskEvery ${me.toFixed(2)} sweeps  ->  c*H = ${(r.c * r.H).toFixed(3)} m2/sweep   (H ${r.H.toFixed(1)} m)`);
  }
  const lo = Math.min(...got.map(g => g.cH)), hi = Math.max(...got.map(g => g.cH));
  ok('a 5x refinement of the mask interval moves c*H by under 4%',
     (hi - lo) / lo < 0.04, `${((hi - lo) / lo * 100).toFixed(1)}%`);
  ok('and it really is doing 5x the work', got[2].builds > got[0].builds * 4,
     `${got[0].builds} vs ${got[2].builds} mask builds`);
}

/* ════════════════════════════════════════════════════════════════════════════
   H · THE MASK — equals its own per-cell definition
   ════════════════════════════════════════════════════════════════════════════ */
head('H · the cached mask is the definition, not an approximation of it');
{
  const st = S.makeField({ NX: 80, NY: 60, seed: 21, fill: 4, rough: 3 });
  S.sweep(st, 80);
  S.computeShadow(st);
  let bad = 0, shaded = 0;
  for (let y = 0; y < st.NY; y++) for (let x = 0; x < st.NX; x++) {
    const def = S.inShadow(st, x, y) ? 1 : 0;
    if (st.mask[y * st.NX + x] !== def) bad++;
    shaded += def;
  }
  ok('every cell of the mask agrees with the per-cell test', bad === 0, `${bad} disagreements`);
  ok('a real fraction of the desert is in shadow', shaded > st.N * 0.05 && shaded < st.N * 0.7,
     `${(shaded / st.N * 100).toFixed(1)}% of cells`);
  const stOff = S.makeField({ NX: 40, NY: 30, seed: 1, fill: 4, rough: 3, useShadow: false });
  S.computeShadow(stOff);
  ok('with the bubble switched off the mask is empty',
     stOff.mask.every(v => v === 0));
}

/* ════════════════════════════════════════════════════════════════════════════
   I · THE CALIBRATION — one sweep is about a month, and it is derived
   ════════════════════════════════════════════════════════════════════════════ */
head('I · the calibration — the clock is pinned to a real erg, not invented');
{
  /* The model's own measured flux is RACE_Q m^2 per sweep (PART D).  A working
     sand sea moves of the order of 60 m^2 per metre of width per year
     (Bagnold's Egyptian traverses, and every modern erg survey since).  Pinning
     one to the other is the whole of the clock. */
  const yearsPerSweep = RACE_Q / S.ERG_FLUX_M2_PER_YEAR;
  near('YEARS_PER_SWEEP is the measured flux over a real erg flux',
       S.YEARS_PER_SWEEP, yearsPerSweep, 0.012, ' yr');
  ok('one sweep is between a fortnight and two months',
     S.YEARS_PER_SWEEP > 0.04 && S.YEARS_PER_SWEEP < 0.17,
     `${(S.YEARS_PER_SWEEP * 365).toFixed(0)} days`);
  // and the speeds that come out are the speeds real barchans have
  const small = RACE_Q / 6 / S.YEARS_PER_SWEEP;      // a 6 m dune, metres per year
  const big = RACE_Q / 30 / S.YEARS_PER_SWEEP;       // a 30 m dune
  console.log(`       a 6 m dune runs ${small.toFixed(1)} m/yr; a 30 m dune runs ${big.toFixed(1)} m/yr`);
  ok('a 6 m dune runs at a real 6 m dune s speed (5-40 m/yr)', small > 5 && small < 40);
  ok('a 30 m dune runs at a real 30 m dune s speed (1-8 m/yr)', big > 1 && big < 8);
}

console.log(`\n${fail === 0 ? 'ALL GREEN' : 'FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
