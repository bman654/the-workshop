/* ════════════════════════════════════════════════════════════════════════════
   worker.js — THE SAND SEA · the desert, off the main thread.

   The forge inlines sand.mjs above this file, so every symbol of the core is in
   scope here (and `export ` is stripped on the way in).  The page never touches
   the solver; it gets height and flux snapshots and hands the buffers back.

   Messages IN                              Messages OUT
     init   {NX,NY,DX,seed,fill,rough}        ready  {NX,NY,DX,SLAB}
     run    {sweeps}                          frame  {h,q,stats}
     wind   {rose, episode}                   bench  {kind, progress|result}
     shadow {on}
     seed   {fill, seed}
     tag    {x, y}                            (tags come back inside `stats`)
     untag  {}
     bench  {kind:'race'|'gate'}
     recycle{h,q}
   ════════════════════════════════════════════════════════════════════════════ */

let st = null;
let regime = null;
let tags = [];
let pool = [];
let fluxWindow = 3;          // sweeps of flux behind the drifting haze
let running = false;
let sweepsPerTick = 1;

function getBuf(n) {
  for (let i = 0; i < pool.length; i++) if (pool[i].length === n) return pool.splice(i, 1)[0];
  return new Float32Array(n);
}

/* ── the tagged dunes ────────────────────────────────────────────────────
   A tag follows the crest it was dropped on: each frame it looks in a small
   window for the highest cell and steps there.  It records where it has been,
   so the room can draw a dune's whole history behind it. */
function stepTags() {
  if (!st) return;
  const { h, NX, NY } = st;
  for (const t of tags) {
    let bx = t.x, by = t.y, bh = -1;
    const R = 6;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      let x = t.x + dx, y = t.y + dy;
      x -= Math.floor(x / NX) * NX; y -= Math.floor(y / NY) * NY;
      const v = h[y * NX + x];
      if (v > bh) { bh = v; bx = x; by = y; }
    }
    // the displacement, unwrapped on the torus
    let ddx = bx - t.x, ddy = by - t.y;
    if (ddx > NX / 2) ddx -= NX; if (ddx < -NX / 2) ddx += NX;
    if (ddy > NY / 2) ddy -= NY; if (ddy < -NY / 2) ddy += NY;
    t.x = bx; t.y = by;
    t.ux += ddx; t.uy += ddy;                 // unwrapped, for the trail
    t.H = bh * st.SLAB;
    t.hist.push(t.ux, t.uy, st.sweeps);
    if (t.hist.length > 3 * 900) t.hist.splice(0, 3 * 120);

    /* speed, from a window long enough to be a measurement and short enough to
       still be about this dune */
    const need = 12;                          // sweeps
    let i = t.hist.length - 3;
    while (i >= 3 && st.sweeps - t.hist[i - 1] < need) i -= 3;
    if (i >= 0 && st.sweeps - t.hist[i + 2] > 1e-9) {
      const dxs = (t.ux - t.hist[i]) * st.DX, dys = (t.uy - t.hist[i + 1]) * st.DX;
      const dt = st.sweeps - t.hist[i + 2];
      t.c = (dxs * st.wx + dys * st.wy) / dt;
      // exponential smoothing: a crest hops cell to cell and is noisy raw
      t.cs = t.cs == null ? t.c : t.cs * 0.9 + t.c * 0.1;
    }
  }
}

function snapshot() {
  const n = st.N;
  const hb = getBuf(n), qb = getBuf(n);
  const { h, flux, SLAB } = st;
  for (let k = 0; k < n; k++) hb[k] = h[k] * SLAB;
  // normalise the flux by its own upper reach so the haze reads the same at
  // every wind; a fixed scale would blow out or vanish as the field changes
  let mx = 0;
  for (let k = 0; k < n; k++) if (flux[k] > mx) mx = flux[k];
  const inv = mx > 0 ? 1 / mx : 0;
  for (let k = 0; k < n; k++) qb[k] = flux[k] * inv;
  return { hb, qb };
}

function stats(withOrient) {
  const o = {
    sweeps: st.sweeps,
    years: st.sweeps * YEARS_PER_SWEEP,
    roughness: roughness(st),
    relief: relief(st),
    bare: bareFraction(st),
    windDeg: st.windDeg,
    shadow: st.useShadow,
    tags: tags.map(t => ({
      id: t.id, x: t.x, y: t.y, H: t.H, c: t.cs == null ? null : t.cs,
      born: t.born, ux: t.ux, uy: t.uy,
      trail: t.hist
    }))
  };
  if (withOrient) {
    const cr = crestOrientation(st);
    o.crestDeg = cr.deg; o.anisotropy = cr.anisotropy;
    if (regime) o.predDeg = gbnPrediction(regime.rose).deg;
  }
  return o;
}

/* ════════════════════════════════════════════════════════════════════════════
   THE BENCH — the two measurements the room makes on its own face.
   Both run on small strips beside the desert, with the same core.
   ════════════════════════════════════════════════════════════════════════════ */

function benchRidge(H0, opts) {
  const s = makeField(Object.assign({ NX: 128, NY: 32, seed: 5, hop: 3 }, opts || {}));
  const W = Math.round(H0 * 1.4);
  for (let y = 0; y < s.NY; y++) for (let x = 0; x < s.NX; x++) {
    const d = Math.abs(x - 30);
    if (d < W) s.h[y * s.NX + x] = Math.max(0, Math.round(H0 * (1 - d / W)));
  }
  relaxAll(s);
  return s;
}
function benchCentroid(s) {
  let sc = 0, ss = 0;
  for (let y = 0; y < s.NY; y++) for (let x = 0; x < s.NX; x++) {
    const v = s.h[y * s.NX + x], a = 2 * Math.PI * x / s.NX;
    sc += v * Math.cos(a); ss += v * Math.sin(a);
  }
  let cx = (Math.atan2(ss, sc) / (2 * Math.PI)) * s.NX;
  return cx < 0 ? cx + s.NX : cx;
}
function benchPeak(s) { let hi = 0; for (const v of s.h) if (v > hi) hi = v; return hi * s.SLAB; }

/* THE RACE — six ridges, six sizes, one wind.  Reports each one's height,
   speed, and the product, and the fit of c against 1/H through the origin. */
function runRace(post) {
  const sizes = [8, 12, 16, 22, 28, 36];
  const spin = 300, win = 100, chunk = 10;
  const out = [];
  const lanes = [];
  for (let i = 0; i < sizes.length; i++) {
    const s = benchRidge(sizes[i]);
    lanes.push({ s, H0: sizes[i] });
  }
  let done = 0, total = sizes.length * (spin + win);
  for (const L of lanes) {
    while (L.s.sweeps < spin) {
      sweep(L.s, chunk); done += chunk;
      post({ kind: 'race', progress: done / total });
    }
    L.x0 = benchCentroid(L.s); L.s0 = L.s.sweeps; L.H1 = benchPeak(L.s);
    L.acc = new Float64Array(L.s.NX); L.n = 0;
    resetFlux(L.s);
    while (L.s.sweeps - L.s0 < win) {
      sweep(L.s, 4); done += 4;
      const p = columnProfile(L.s);
      for (let x = 0; x < L.s.NX; x++) L.acc[x] += p[x];
      L.n++;
      post({ kind: 'race', progress: Math.min(1, done / total) });
    }
    let d = benchCentroid(L.s) - L.x0;
    if (d < -L.s.NX / 2) d += L.s.NX; if (d > L.s.NX / 2) d -= L.s.NX;
    const c = d * L.s.DX / (L.s.sweeps - L.s0);
    const H = 0.5 * (L.H1 + benchPeak(L.s));
    for (let x = 0; x < L.s.NX; x++) L.acc[x] /= L.n;
    out.push({ H, c, cH: c * H, profile: Array.from(L.acc), DX: L.s.DX });
  }
  const f = fitCH(out);
  return { rows: out, q: f.q, r2: f.r2, spread: f.spread, yearsPerSweep: YEARS_PER_SWEEP };
}

/* THE GATE — one spun-up ridge; c*h(x) laid over q(x) - q0. */
function runGate(post, H0) {
  const s = benchRidge(H0 == null ? 22 : H0);
  const spin = 400, win = 120;
  while (s.sweeps < spin) {
    sweep(s, 10);
    post({ kind: 'gate', progress: 0.7 * s.sweeps / spin });
  }
  const x0 = benchCentroid(s), s0 = s.sweeps, H1 = benchPeak(s);
  resetFlux(s);
  const acc = new Float64Array(s.NX); let n = 0;
  while (s.sweeps - s0 < win) {
    sweep(s, 4);
    const p = columnProfile(s);
    for (let x = 0; x < s.NX; x++) acc[x] += p[x];
    n++;
    post({ kind: 'gate', progress: 0.7 + 0.3 * (s.sweeps - s0) / win });
  }
  for (let x = 0; x < s.NX; x++) acc[x] /= n;
  let d = benchCentroid(s) - x0;
  if (d < -s.NX / 2) d += s.NX; if (d > s.NX / 2) d -= s.NX;
  const c = d * s.DX / (s.sweeps - s0), H = 0.5 * (H1 + benchPeak(s));

  const q = gateFlux(s);
  const idx = Array.from(acc.keys()).sort((i, j) => acc[i] - acc[j]);
  const take = idx.slice(0, Math.round(s.NX * 0.15));
  const q0 = take.reduce((a, i) => a + q[i], 0) / take.length;
  const lhs = [], rhs = [];
  let num = 0, den = 0, ss = 0, tt = 0, mean = 0, peak = 0;
  for (let x = 0; x < s.NX; x++) mean += c * acc[x];
  mean /= s.NX;
  for (let x = 0; x < s.NX; x++) {
    const L = c * acc[x], R = q[x] - q0;
    lhs.push(L); rhs.push(R);
    num += L * R; den += R * R; ss += (L - R) * (L - R); tt += (L - mean) * (L - mean);
    peak = Math.max(peak, Math.abs(L));
  }
  /* roll the profile so the dune sits in the middle of the picture */
  let cIdx = 0, best = -1;
  for (let x = 0; x < s.NX; x++) if (acc[x] > best) { best = acc[x]; cIdx = x; }
  const roll = a => { const o = []; for (let k = 0; k < a.length; k++) o.push(a[(cIdx - (s.NX >> 1) + k + s.NX * 2) % s.NX]); return o; };
  return {
    c, H, q0, DX: s.DX,
    lhs: roll(lhs), rhs: roll(rhs), profile: roll(Array.from(acc)),
    slope: num / den, r2: 1 - ss / tt, rms: Math.sqrt(ss / s.NX) / peak
  };
}

/* ════════════════════════════════════════════════════════════════════════════ */

let sinceOrient = 99, sinceFlux = 0;

function tick() {
  if (!st || !running) return;
  const t0 = Date.now();
  regimeAdvance(st, regime, sweepsPerTick);
  sinceFlux += sweepsPerTick;
  stepTags();
  const { hb, qb } = snapshot();
  sinceOrient++;
  const withOrient = sinceOrient > 12;
  if (withOrient) sinceOrient = 0;
  const s = stats(withOrient);
  s.ms = Date.now() - t0;
  postMessage({ type: 'frame', h: hb, q: qb, stats: s }, [hb.buffer, qb.buffer]);
  if (sinceFlux > fluxWindow) { st.flux.fill(0); sinceFlux = 0; }
}

self.onmessage = e => {
  const m = e.data;
  if (m.type === 'init') {
    st = makeField({ NX: m.NX, NY: m.NY, DX: m.DX, seed: m.seed, fill: m.fill, rough: m.rough });
    regime = makeRegime([{ deg: 0, weight: 1 }], 6);
    tags = [];
    postMessage({ type: 'ready', NX: st.NX, NY: st.NY, DX: st.DX, SLAB: st.SLAB, yps: YEARS_PER_SWEEP });
    running = true;
    tick();
  } else if (m.type === 'run') {
    running = m.on !== false;
    if (m.sweeps != null) sweepsPerTick = m.sweeps;
  } else if (m.type === 'more') {
    tick();
  } else if (m.type === 'wind') {
    regime = makeRegime(m.rose, m.episode == null ? 6 : m.episode);
    if (m.rose.length === 1) setWind(st, m.rose[0].deg);
  } else if (m.type === 'shadow') {
    st.useShadow = !!m.on;
    st.maskAt = -1e9;
  } else if (m.type === 'seed') {
    const keep = st.useShadow;
    st = makeField({ NX: st.NX, NY: st.NY, DX: st.DX, seed: m.seed, fill: m.fill, rough: 2 });
    st.useShadow = keep;
    tags = [];
    if (regime && regime.rose.length === 1) setWind(st, regime.rose[0].deg);
  } else if (m.type === 'tag') {
    if (tags.length >= 4) tags.shift();
    let bx = m.x, by = m.y, bh = -1;
    for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
      let x = m.x + dx, y = m.y + dy;
      x -= Math.floor(x / st.NX) * st.NX; y -= Math.floor(y / st.NY) * st.NY;
      const v = st.h[y * st.NX + x];
      if (v > bh) { bh = v; bx = x; by = y; }
    }
    tags.push({ id: Math.random().toString(36).slice(2, 7), x: bx, y: by, ux: bx, uy: by,
                H: bh * st.SLAB, c: null, cs: null, born: st.sweeps, hist: [bx, by, st.sweeps] });
  } else if (m.type === 'untag') {
    tags = [];
  } else if (m.type === 'recycle') {
    if (m.h) pool.push(m.h);
    if (m.q) pool.push(m.q);
    if (pool.length > 6) pool.length = 6;
  } else if (m.type === 'bench') {
    const post = p => postMessage({ type: 'bench', kind: p.kind, progress: p.progress });
    let last = 0;
    const throttled = p => { const n = Date.now(); if (n - last > 90) { last = n; post(p); } };
    if (m.kind === 'race') {
      postMessage({ type: 'bench', kind: 'race', result: runRace(throttled) });
    } else {
      postMessage({ type: 'bench', kind: 'gate', result: runGate(throttled, m.H0) });
    }
  }
};
