/* ============================================================================
 *  THE ORB WEAVER  ·  strings.mjs  —  the web as a network of stretched strings,
 *  the transverse wave that runs on it, and the eight numbers she gets.
 *
 *  Zero-dependency, DOM-free ESM. NO BACKTICK anywhere in this file, comments
 *  included (LANDMINES.md: it is re-included inside a String.raw).
 *
 *  THE MODEL, in one paragraph
 *  --------------------------
 *  Every thread is a string under tension T with linear density mu. Out-of-plane
 *  displacement z obeys mu z_tt = T z_ss, whose signal speed is c = sqrt(T/mu).
 *  Discretise each thread into nodes: node mass is the silk on its half-segments,
 *  and each segment is a transverse spring of stiffness k = T/h. At a JUNCTION
 *  the nodes are shared, so the force balance sum(T dz/ds) = 0 and the continuity
 *  of z are both automatic -- nothing about junctions is typed in. Waves reflect
 *  and split at junctions because the impedances sqrt(T mu) differ, and that is
 *  the whole of it.
 *
 *  THE NUMBERS, and where they come from
 *  -------------------------------------
 *    dragline (radii, frame)   3.3 um of a 1300 kg/m3 protein  ->  mu = 1.11e-8 kg/m
 *    radius tension            2.0e-4 N   ->  c = 134 m/s
 *    frame tension             1.6e-3 N -- it carries every radius that pulls on
                              it, so it is the stiffest, fastest silk in the web
                              ->  c = 250 m/s
 *    capture thread            a 1.5 um flagelliform core PLUS the glue:
 *                              9 um droplets every 250 um is 1.2e-8 kg/m of water,
 *                              five times the core, so mu = 1.5e-8 kg/m
 *    capture tension           3.0e-6 N -- it is built SLACK -> c = 14 m/s
 *
 *  So the radii are nearly TEN TIMES faster than the spiral they carry. The
 *  glue you can see beaded on the sticky spiral is most of its mass, and most of
 *  why it is slow. That contrast is not decoration: it is the thing this room is
 *  about.
 *
 *  WHAT IS CLAIMED
 *  ---------------
 *  She sits at the hub with eight feet on eight radii. A fly lands somewhere on
 *  the sticky spiral. Claim: THE ARRIVAL TIMES ALONE PLACE IT -- no amplitude, no
 *  eyes. The room measures how well, and how much timing jitter it survives, and
 *  then breaks it two ways on purpose.
 *
 *  HOW THE TABLE IS BUILT -- reciprocity, which is also what she does
 *  ------------------------------------------------------------------
 *  To invert arrival times you need to know, for every point on the web, when a
 *  disturbance there would reach each foot. That is 1800 simulations. It is also
 *  8: the system is linear and symmetric, so the time from p to leg i is EXACTLY
 *  the time from leg i to p. Tap once with each foot, record when the front
 *  reaches everywhere, and you have the whole table. Spiders do tug their own
 *  webs. calibrate() is eight taps.
 * ========================================================================== */

import { stationXY, dist } from './weave.mjs';

/* DAMPING is AIR DRAG -- a force against each length of thread's own velocity,
   f = -alpha * (mass of that length) * v. For a three-micron fibre the drag per
   unit mass is enormous, and it is the dominant loss in a real web; the glue
   droplets are bluff bodies and cost far more still. alpha is in 1/s and a mode
   decays as exp(-alpha t / 2), so alpha = 60 is a thirty-millisecond ring.

   WHY NOT the tidier Rayleigh stiffness-proportional dashpot (f = beta k dv):
   it sets the damping ratio PROPORTIONAL TO FREQUENCY, so whatever value makes
   the audible band right leaves the top of the LATTICE band (20 kHz of modes
   that are discretisation, not silk) overdamped -- and an overdamped explicit
   lattice makes the measured arrival time a function of the TIMESTEP. It moved
   the front by 44 us between dt/2 and dt, which is the same size as the whole
   effect this room measures. Velocity drag does not do that: it is diagonal,
   it inverts exactly, and it is frequency-flat. */
export const SILK = {
  /*         kg/m         N        1/s   */
  radius:  { mu: 1.110e-8, T: 2.00e-4, alpha:   60 },
  frame:   { mu: 2.550e-8, T: 1.60e-3, alpha:   60 },
  hub:     { mu: 1.110e-8, T: 2.00e-4, alpha:   60 },
  capture: { mu: 1.500e-8, T: 3.00e-6, alpha: 1200 },
};
export const BARE_FLAGELLIFORM_MU = 2.30e-9;   /* the core with the glue washed off */
export const KINDS = ['radius', 'frame', 'hub', 'capture'];
export const speedOf = s => Math.sqrt(s.T / s.mu);

/* ── a tiny binary heap, for Dijkstra ──────────────────────────────────────── */
class Heap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, val) {
    const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= k[i]) break;
      [k[p], k[i]] = [k[i], k[p]]; [v[p], v[i]] = [v[i], v[p]]; i = p; }
  }
  pop() {
    const k = this.k, v = this.v, top = v[0], tk = k[0];
    const lk = k.pop(), lv = v.pop();
    if (k.length) { k[0] = lk; v[0] = lv; let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < k.length && k[l] < k[m]) m = l;
        if (r < k.length && k[r] < k[m]) m = r;
        if (m === i) break;
        [k[m], k[i]] = [k[i], k[m]]; [v[m], v[i]] = [v[i], v[m]]; i = m; } }
    return { key: tk, val: top };
  }
}

/* ============================================================================
 *  ASSEMBLE  —  the finished web as nodes and springs.
 * ========================================================================== */
export function assemble(web, opts = {}) {
  const h = opts.h || 0.0050;                       /* target segment length, m */
  const silk = {
    radius:  Object.assign({}, SILK.radius),
    frame:   Object.assign({}, SILK.frame),
    hub:     Object.assign({}, SILK.hub),
    capture: Object.assign({}, SILK.capture),
  };
  if (opts.glue === false) silk.capture.mu = BARE_FLAGELLIFORM_MU;
  if (opts.spiral === 'taut') silk.capture.T = silk.capture.mu * Math.pow(speedOf(silk.radius), 2);
  if (opts.spiralSpeed) silk.capture.T = silk.capture.mu * opts.spiralSpeed * opts.spiralSpeed;

  const H = web.H, radii = web.radii, N = web.G.nRadii;
  /* which spirals are on the web yet -- so the room can weigh a radius before
     and after she hangs the sticky spiral on it */
  const inc = Object.assign({ hub: true, aux: false, capture: true }, opts.include || {});

  /* --- node table, welded on exact coordinates ---------------------------- */
  const X = [], Y = [], KIND = [], FIXED = [];
  const map = new Map();
  const key = (x, y) => Math.round(x * 1e8) + ',' + Math.round(y * 1e8);
  function node(x, y, kind, fixed) {
    const s = key(x, y); const got = map.get(s);
    if (got !== undefined) {
      /* a junction takes the stiffer kind's identity, for colouring only */
      if (kind === 'radius' || kind === 'frame') KIND[got] = kind;
      if (fixed) FIXED[got] = 1;
      return got;
    }
    const i = X.length; X.push(x); Y.push(y); KIND.push(kind); FIXED.push(fixed ? 1 : 0);
    map.set(s, i); return i;
  }

  /* springs */
  const SI = [], SJ = [], SK = [], SKIND = [], SLEN = [];
  function spring(i, j, kind) {
    if (i === j) return;
    const L = Math.hypot(X[j] - X[i], Y[j] - Y[i]);
    if (L < 1e-9) return;
    SI.push(i); SJ.push(j); SK.push(silk[kind].T / L); SKIND.push(kind); SLEN.push(L);
  }
  /* a straight run between two points, subdivided to <= h */
  function run(ax, ay, bx, by, kind, ia, ib) {
    const L = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(L / h));
    let prev = ia !== undefined ? ia : node(ax, ay, kind, false);
    for (let s = 1; s <= n; s++) {
      const f = s / n;
      const cur = (s === n && ib !== undefined) ? ib
        : node(ax + (bx - ax) * f, ay + (by - ay) * f, kind, false);
      spring(prev, cur, kind); prev = cur;
    }
    return prev;
  }

  /* --- 1. the radii: every attachment is a node, plus filler -------------- */
  /* the stations on each radius, by radial distance */
  const stations = Array.from({ length: N }, () => []);
  if (inc.hub) for (const st of web.hubSp) stations[st.k].push({ r: st.r, kind: 'hub' });
  if (inc.aux) for (const st of web.auxSp) stations[st.k].push({ r: st.r, kind: 'aux' });
  if (inc.capture) for (const st of web.capSp) stations[st.k].push({ r: st.r, kind: 'capture' });
  const hubNodeIdx = node(H[0], H[1], 'radius', false);
  const radNodes = [];         /* radNodes[k] = [{r, i}] ordered outward */
  const stationNode = new Map();   /* "k:r" -> node index */
  for (let k = 0; k < N; k++) {
    const R = radii[k];
    const list = stations[k].slice().sort((a, b) => a.r - b.r);
    /* dedupe */
    const uniq = [];
    for (const s of list) if (!uniq.length || s.r - uniq[uniq.length - 1].r > 1e-9) uniq.push(s);
    const chain = [{ r: 0, i: hubNodeIdx }];
    let prev = hubNodeIdx, prevR = 0;
    const place = (r) => {
      const x = H[0] + R.ux * r, y = H[1] + R.uy * r;
      const i = node(x, y, 'radius', false);
      /* fill the gap from prevR to r with intermediate nodes if it is long */
      const gap = r - prevR;
      const nseg = Math.max(1, Math.ceil(gap / h));
      let p = prev;
      for (let s = 1; s <= nseg; s++) {
        const rr = prevR + gap * (s / nseg);
        const q = (s === nseg) ? i : node(H[0] + R.ux * rr, H[1] + R.uy * rr, 'radius', false);
        spring(p, q, 'radius'); chain.push({ r: rr, i: q }); p = q;
      }
      prev = i; prevR = r; return i;
    };
    for (const s of uniq) { const i = place(s.r); stationNode.set(k + ':' + s.r.toFixed(9), i); }
    /* out to the frame */
    const tipI = place(R.L);
    R.tipNode = tipI;
    radNodes.push(chain);
  }

  /* --- 2. the frame: the anchors are the only fixed points ---------------- */
  const poly = web.poly;
  for (let e = 0; e < poly.length; e++) {
    const p = poly[e], q = poly[(e + 1) % poly.length];
    const ex = q[0] - p[0], ey = q[1] - p[1], eL = Math.hypot(ex, ey);
    /* every radius tip that lies on this edge, by parameter */
    const on = [];
    for (const R of radii) {
      const t = ((R.tip[0] - p[0]) * ex + (R.tip[1] - p[1]) * ey) / (eL * eL);
      if (t < -1e-9 || t > 1 + 1e-9) continue;
      const px = p[0] + ex * t, py = p[1] + ey * t;
      if (Math.hypot(px - R.tip[0], py - R.tip[1]) < 1e-9) on.push({ t, i: R.tipNode });
    }
    on.sort((a, b) => a.t - b.t);
    let prev = node(p[0], p[1], 'frame', true), prevT = 0;
    for (const o of on) {
      run(p[0] + ex * prevT, p[1] + ey * prevT, p[0] + ex * o.t, p[1] + ey * o.t, 'frame', prev, o.i);
      prev = o.i; prevT = o.t;
    }
    const endI = node(q[0], q[1], 'frame', true);
    run(p[0] + ex * prevT, p[1] + ey * prevT, q[0], q[1], 'frame', prev, endI);
  }

  /* --- 3. the two surviving spirals as chords between radius stations ----- */
  const captureChords = [];
  const chordOf = (sp, kind, collect) => {
    for (let j = 0; j + 1 < sp.length; j++) {
      const a = sp[j], b = sp[j + 1];
      const ia = stationNode.get(a.k + ':' + a.r.toFixed(9));
      const ib = stationNode.get(b.k + ':' + b.r.toFixed(9));
      if (ia === undefined || ib === undefined) continue;
      const pa = stationXY(a, radii, H), pb = stationXY(b, radii, H);
      run(pa[0], pa[1], pb[0], pb[1], kind, ia, ib);
      if (collect) captureChords.push({ j, ia, ib });
    }
  };
  if (inc.hub) chordOf(web.hubSp, 'hub', false);
  if (inc.aux) chordOf(web.auxSp, 'radius', false);   /* the scaffold is plain dragline */
  if (inc.capture) chordOf(web.capSp, 'capture', true);

  /* --- 4. masses, and the drag on them ------------------------------------ */
  const n = X.length, m = SI.length;
  const mass = new Float64Array(n), dDiag = new Float64Array(n);
  for (let s = 0; s < m; s++) {
    const dm = silk[SKIND[s]].mu * SLEN[s] * 0.5, dc = silk[SKIND[s]].alpha * dm;
    mass[SI[s]] += dm; mass[SJ[s]] += dm;
    dDiag[SI[s]] += dc; dDiag[SJ[s]] += dc;
  }
  for (let i = 0; i < n; i++) if (mass[i] <= 0) mass[i] = 1e-14;

  /* --- 5. the timestep the lattice will stand --------------------------- */
  /* TWO limits, and the damping one is the easy one to forget: an explicit
     dashpot is unstable once dt exceeds about 2 m / sum(c). Leave it out and a
     stiffer variant of the same web silently fills with NaN -- no error, and
     every downstream number comes back as a blank instead of a wrong answer. */
  const kSum = new Float64Array(n);
  for (let s = 0; s < m; s++) { kSum[SI[s]] += SK[s]; kSum[SJ[s]] += SK[s]; }
  let wmax = 0;
  for (let i = 0; i < n; i++) {
    if (FIXED[i]) continue;
    wmax = Math.max(wmax, Math.sqrt(2 * kSum[i] / mass[i]));
  }
  /* drag is diagonal and is inverted exactly in step(), so it puts no bound on
     the timestep at all -- only the stiffest node does. */
  const dtMax = 2 / wmax;

  /* --- 6. her eight feet, and the candidate impact sites ------------------ */
  const legRadii = opts.legRadii || Array.from({ length: 8 }, (_, i) => Math.round(i * N / 8) % N);
  const legR = opts.legR === undefined ? web.G.hubR1 : opts.legR;
  const legs = legRadii.map((k, idx) => {
    const chain = radNodes[k];
    let best = chain[0], bd = Infinity;
    /* if the feet are gathered onto ONE radius they must not all be the same
       node, so each takes its own rung outward from the coil */
    const want = opts.gathered ? legR + idx * (web.G.freeR - legR) / 8 + idx * 0.004 : legR;
    for (const c of chain) { const d = Math.abs(c.r - want); if (d < bd) { bd = d; best = c; } }
    return best.i;
  });

  /* candidate sites: every node that is ON the capture spiral (a fly does not
     land on a radius; it lands on the glue) */
  const candSet = new Set();
  for (let s = 0; s < m; s++) if (SKIND[s] === 'capture') { candSet.add(SI[s]); candSet.add(SJ[s]); }
  const cands = Int32Array.from([...candSet].filter(i => KIND[i] !== 'frame'));

  return {
    web, h, silk, n, m,
    x: Float64Array.from(X), y: Float64Array.from(Y),
    kind: KIND, fixed: Uint8Array.from(FIXED), include: inc, dDiag,
    si: Int32Array.from(SI), sj: Int32Array.from(SJ), sk: Float64Array.from(SK),
    sLen: Float64Array.from(SLEN), sKind: SKIND,
    mass, dtMax, hubNode: hubNodeIdx, legs, cands, radNodes,
    captureChords,
    speeds: { radius: speedOf(silk.radius), frame: speedOf(silk.frame),
              hub: speedOf(silk.hub), capture: speedOf(silk.capture) },
  };
}

/* ============================================================================
 *  THE SOLVER  —  semi-implicit (symplectic) Euler on the lumped lattice.
 * ========================================================================== */
export function newState(NET) {
  return { z: new Float64Array(NET.n), v: new Float64Array(NET.n), t: 0, f: new Float64Array(NET.n) };
}

/* one step. drive(t) may return {node, F} or null. */
export function step(NET, S, dt, driveNode, driveF) {
  const { si, sj, sk, mass, fixed, dDiag, n, m } = NET;
  const z = S.z, v = S.v, f = S.f;
  f.fill(0);
  for (let s = 0; s < m; s++) {
    const i = si[s], j = sj[s], q = sk[s] * (z[j] - z[i]);
    f[i] += q; f[j] -= q;
  }
  if (driveNode >= 0) f[driveNode] += driveF;
  for (let i = 0; i < n; i++) {
    if (fixed[i]) { v[i] = 0; z[i] = 0; continue; }
    const im = dt / mass[i];
    v[i] = (v[i] + im * f[i]) / (1 + im * dDiag[i]);   /* drag, exactly inverted */
    z[i] += v[i] * dt;
  }
  S.t += dt;
}

/* A tap: a half-sine of total impulse J over tau seconds. */
export function tapForce(t, tau, J) {
  if (t < 0 || t > tau) return 0;
  return (J * Math.PI / (2 * tau)) * Math.sin(Math.PI * t / tau);
}

/* ============================================================================
 *  FIRST ARRIVAL.  Run a tap at 'src' and record, for every node, the first
 *  time |z| crosses a threshold. The threshold is a fixed fraction of the
 *  LARGEST displacement that node ever reaches in the window, so it does not
 *  care how big the tap was or how far away the node is.
 * ========================================================================== */
export function frontTimes(NET, src, opt = {}) {
  const dt = opt.dt || NET.dtMax * 0.40;
  const T = opt.window || 0.010;
  const steps = Math.ceil(T / dt);
  const tau = opt.tau || 2.0e-4;
  const J = opt.J || 1e-9;
  const frac = opt.frac === undefined ? 0.02 : opt.frac;
  const S = newState(NET);
  const n = NET.n;
  const peak = new Float64Array(n);
  /* pass 1: peaks */
  for (let s = 0; s < steps; s++) {
    step(NET, S, dt, src, tapForce(S.t, tau, J));
    const z = S.z;
    for (let i = 0; i < n; i++) { const a = z[i] < 0 ? -z[i] : z[i]; if (a > peak[i]) peak[i] = a; }
  }
  /* pass 2: first crossing of frac * peak, LINEARLY INTERPOLATED inside the
     step it happens in. Without that the whole table is quantised to dt, and
     since the interesting spreads are only a few dt wide the quantisation would
     itself manufacture ties -- which reads exactly like a degenerate geometry. */
  const S2 = newState(NET);
  const out = new Float64Array(n).fill(Infinity);
  const prev = new Float64Array(n);
  let left = n;
  for (let s = 0; s < steps && left > 0; s++) {
    const t0 = S2.t;
    step(NET, S2, dt, src, tapForce(S2.t, tau, J));
    const z = S2.z;
    for (let i = 0; i < n; i++) {
      const a = z[i] < 0 ? -z[i] : z[i];
      if (out[i] === Infinity) {
        const thr = frac * peak[i];
        if (peak[i] > 0 && a >= thr) {
          const b = prev[i];
          const f = a > b ? (thr - b) / (a - b) : 1;
          out[i] = t0 + dt * Math.min(1, Math.max(0, f));
          left--;
        }
      }
      prev[i] = a;
    }
  }
  return { t: out, peak, dt, steps };
}

/* the whole table, by RECIPROCITY: eight taps, one per foot. */
export function calibrate(NET, opt = {}) {
  const rows = [];
  for (const L of NET.legs) rows.push(frontTimes(NET, L, opt).t);
  return rows;                                   /* rows[i][node] */
}

/* ============================================================================
 *  THE INVERSION.  Times of arrival, minus their own mean (the moment of the
 *  landing is not known), matched against the table the same way.
 * ========================================================================== */
export function localize(NET, table, times, candidates) {
  const cands = candidates || NET.cands;
  const K = times.length;
  let tm = 0, kk = 0;
  for (let i = 0; i < K; i++) if (isFinite(times[i])) { tm += times[i]; kk++; }
  tm /= Math.max(1, kk);
  let best = -1, bestE = Infinity, second = Infinity;
  for (let c = 0; c < cands.length; c++) {
    const p = cands[c];
    let mu = 0, cnt = 0;
    for (let i = 0; i < K; i++) { const T = table[i][p]; if (isFinite(T)) { mu += T; cnt++; } }
    if (cnt < 3) continue;
    mu /= cnt;
    let e = 0;
    for (let i = 0; i < K; i++) {
      const T = table[i][p]; if (!isFinite(T) || !isFinite(times[i])) continue;
      const d = (times[i] - tm) - (T - mu); e += d * d;
    }
    if (e < bestE) { second = bestE; bestE = e; best = p; }
    else if (e < second) second = e;
  }
  return { node: best, x: NET.x[best], y: NET.y[best], resid: Math.sqrt(bestE / K), margin: second / (bestE + 1e-30) };
}

/* ── the geodesic model: the time the front WOULD take if every thread simply
   passed a signal at its own sqrt(T/mu). Not used by the inversion -- it is a
   second opinion the room prints beside the measured front. ────────────────── */
export function geodesicTimes(NET, src) {
  const n = NET.n, m = NET.m;
  const head = new Int32Array(n).fill(-1), next = new Int32Array(2 * m), to = new Int32Array(2 * m),
        wt = new Float64Array(2 * m);
  let e = 0;
  const add = (a, b, w) => { to[e] = b; wt[e] = w; next[e] = head[a]; head[a] = e; e++; };
  for (let s = 0; s < m; s++) {
    const w = NET.sLen[s] / NET.speeds[NET.sKind[s]];
    add(NET.si[s], NET.sj[s], w); add(NET.sj[s], NET.si[s], w);
  }
  const D = new Float64Array(n).fill(Infinity);
  const done = new Uint8Array(n);
  const H = new Heap(); D[src] = 0; H.push(0, src);
  while (H.size) {
    const { key, val } = H.pop();
    if (done[val]) continue; done[val] = 1;
    for (let p = head[val]; p !== -1; p = next[p]) {
      const nd = key + wt[p];
      if (nd < D[to[p]]) { D[to[p]] = nd; H.push(nd, to[p]); }
    }
  }
  return D;
}

/* ============================================================================
 *  A PLUCK.  Displace one radius at its middle, let go, and listen at the hub.
 *  Returns the hub signal, so the page can play it and audio-lens can look at
 *  what note it is.
 * ========================================================================== */
export function pluck(NET, radiusK, opt = {}) {
  const dt = opt.dt || NET.dtMax * 0.40;
  const dur = opt.dur || 0.35;
  const steps = Math.ceil(dur / dt);
  const chain = NET.radNodes[radiusK];
  const L = chain[chain.length - 1].r;
  /* pull it into a triangle about a point 1/3 of the way out, then release --
     the way a finger does */
  const at = opt.at === undefined ? 0.42 : opt.at;
  const S = newState(NET);
  const amp = opt.amp || 3e-3;
  for (const c of chain) {
    const f = c.r / L;
    S.z[c.i] = amp * (f < at ? f / at : (1 - f) / (1 - at));
  }
  const listen = opt.listen === undefined ? NET.legs[0] : opt.listen;
  const out = new Float64Array(steps);
  for (let s = 0; s < steps; s++) { step(NET, S, dt, -1, 0); out[s] = S.z[listen]; }
  return { sig: out, dt, rate: 1 / dt, L, freeF: NET.speeds.radius / (2 * L) };
}

/* dominant frequency of a signal, by a plain Goertzel sweep (no FFT needed and
   no dependency); returns the peak and the whole curve. */
export function dominantHz(sig, rate, lo = 40, hi = 1600, nBins = 900) {
  let bestF = 0, bestP = -1;
  const curve = new Float64Array(nBins);
  const Nl = sig.length;
  for (let b = 0; b < nBins; b++) {
    const f = lo * Math.pow(hi / lo, b / (nBins - 1));
    const w = 2 * Math.PI * f / rate, cw = Math.cos(w), coeff = 2 * cw;
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < Nl; i++) { s0 = sig[i] + coeff * s1 - s2; s2 = s1; s1 = s0; }
    const p = s1 * s1 + s2 * s2 - coeff * s1 * s2;
    curve[b] = p;
    if (p > bestP) { bestP = p; bestF = f; }
  }
  return { hz: bestF, power: bestP, curve, lo, hi, nBins };
}

/* ============================================================================
 *  THE MEASUREMENT the room is for: how well eight feet place a fly, and how
 *  much timing jitter that survives.
 * ========================================================================== */
export function localizationError(NET, table, opt = {}) {
  const sites = opt.sites || defaultSites(NET, 140);
  const jitter = opt.jitter === undefined ? 30e-6 : opt.jitter;
  const draws = opt.draws || 12;
  const cands = opt.cands || NET.cands;
  const rnd = opt.rnd || mulberry(12345);
  const errs = [], bearings = [], ranges = [];
  const hx = NET.x[NET.hubNode], hy = NET.y[NET.hubNode];
  for (const p of sites) {
    /* the exact times FROM this site, by reciprocity = the table read down a column */
    const t0 = NET.legs.map((_, i) => table[i][p]);
    if (t0.some(v => !isFinite(v))) continue;
    for (let d = 0; d < draws; d++) {
      const t = t0.map(v => v + gauss(rnd) * jitter);
      const g = localize(NET, table, t, cands);
      const dx = NET.x[g.node] - NET.x[p], dy = NET.y[g.node] - NET.y[p];
      errs.push(Math.hypot(dx, dy));
      const aT = Math.atan2(NET.y[p] - hy, NET.x[p] - hx);
      const aG = Math.atan2(NET.y[g.node] - hy, NET.x[g.node] - hx);
      let da = aG - aT; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      bearings.push(Math.abs(da));
      ranges.push(Math.abs(Math.hypot(NET.x[g.node] - hx, NET.y[g.node] - hy)
        - Math.hypot(NET.x[p] - hx, NET.y[p] - hy)));
    }
  }
  errs.sort((a, b) => a - b); bearings.sort((a, b) => a - b); ranges.sort((a, b) => a - b);
  const med = a => a.length ? a[a.length >> 1] : NaN;
  const p90 = a => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * 0.9))] : NaN;
  return {
    n: errs.length, jitter,
    medianErr: med(errs), p90Err: p90(errs),
    medianBearing: med(bearings), medianRange: med(ranges),
  };
}

/* a spread of impact sites over the sticky area */
export function defaultSites(NET, want) {
  const c = NET.cands, out = [];
  const stride = Math.max(1, Math.floor(c.length / want));
  for (let i = 0; i < c.length; i += stride) out.push(c[i]);
  return out;
}

/* the grid the search can possibly resolve: median nearest-neighbour spacing
   among the candidates. An error at this floor is an error of zero. */
export function candidateFloor(NET, cands) {
  const c = cands || NET.cands;
  const d = [];
  for (let a = 0; a < c.length; a += Math.max(1, Math.floor(c.length / 200))) {
    let best = Infinity;
    for (let b = 0; b < c.length; b++) {
      if (b === a) continue;
      const dd = Math.hypot(NET.x[c[b]] - NET.x[c[a]], NET.y[c[b]] - NET.y[c[a]]);
      if (dd < best) best = dd;
    }
    d.push(best);
  }
  d.sort((p, q) => p - q);
  return d[d.length >> 1];
}

/* ============================================================================
 *  A BARE STRING, in the same solver.  Nothing hangs off it, nothing branches:
 *  the answer is known in closed form (c = sqrt(T/mu), f_n = n c / 2L), so this
 *  is where the discretisation is CALIBRATED before the web is asked anything.
 * ========================================================================== */
export function bareString(L, mat, h, opt = {}) {
  const n = Math.max(3, Math.round(L / h) + 1);
  const seg = L / (n - 1);
  const X = new Float64Array(n), Y = new Float64Array(n);
  for (let i = 0; i < n; i++) X[i] = i * seg;
  const m = n - 1;
  const si = new Int32Array(m), sj = new Int32Array(m);
  const sk = new Float64Array(m), sLen = new Float64Array(m);
  const sKind = new Array(m).fill('radius');
  const silk = { radius: mat, frame: mat, hub: mat, capture: mat };
  const alpha = opt.alpha === undefined ? mat.alpha : opt.alpha;
  const mass = new Float64Array(n), dDiag = new Float64Array(n);
  for (let s = 0; s < m; s++) {
    si[s] = s; sj[s] = s + 1; sLen[s] = seg; sk[s] = mat.T / seg;
    const dm = mat.mu * seg * 0.5;
    mass[s] += dm; mass[s + 1] += dm; dDiag[s] += alpha * dm; dDiag[s + 1] += alpha * dm;
  }
  const fixed = new Uint8Array(n); fixed[0] = 1; fixed[n - 1] = 1;
  const kSum = new Float64Array(n);
  for (let s = 0; s < m; s++) { kSum[si[s]] += sk[s]; kSum[sj[s]] += sk[s]; }
  let wmax = 0;
  for (let i = 1; i < n - 1; i++) wmax = Math.max(wmax, Math.sqrt(2 * kSum[i] / mass[i]));
  return {
    n, m, x: X, y: Y, si, sj, sk, sLen, sKind, mass, fixed, silk, dDiag,
    kind: new Array(n).fill('radius'), dtMax: 2 / wmax, hubNode: 0,
    legs: [1], cands: Int32Array.from([1]), radNodes: [[]],
    speeds: { radius: speedOf(mat), frame: speedOf(mat), hub: speedOf(mat), capture: speedOf(mat) },
    L, seg, cTrue: speedOf(mat), f1: speedOf(mat) / (2 * L),
  };
}

/* pluck a bare string into a triangle and listen a quarter of the way along */
export function pluckBare(BS, opt = {}) {
  const dt = opt.dt || BS.dtMax * 0.40;
  const dur = opt.dur || 0.25;
  const steps = Math.ceil(dur / dt);
  const S = newState(BS);
  const at = opt.at === undefined ? 0.5 : opt.at;
  for (let i = 0; i < BS.n; i++) {
    const f = i / (BS.n - 1);
    S.z[i] = (opt.amp || 1e-3) * (f < at ? f / at : (1 - f) / (1 - at));
  }
  const listen = opt.listen === undefined ? Math.round(BS.n * 0.25) : opt.listen;
  const out = new Float64Array(steps);
  for (let s = 0; s < steps; s++) { step(BS, S, dt, -1, 0); out[s] = S.z[listen]; }
  return { sig: out, dt, rate: 1 / dt };
}

/* ── scraps ────────────────────────────────────────────────────────────────── */
export function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gauss(rnd) {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
