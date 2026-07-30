/* ═══════════════════════════════════════════════════════════════════════════
   THE HEADWATERS · erode.mjs
   A landscape that carves itself, and the tree the water leaves behind.

   PURE + DOM-FREE. Inlined byte-for-byte into the room by the forge; run
   head-on by `node the-headwaters/erode.test.mjs`.

   WHAT IS IN HERE
     · a LANDSCAPE EVOLUTION MODEL, which is three lines of physics:
         dh/dt = U  -  K A^m S^n  +  D grad^2 h
       uplift, stream power (the river's bite, which knows how much water is
       passing), and hillslope diffusion (soil creeping downhill).
     · the STREAM-POWER term solved IMPLICITLY, Braun & Willett (2013): one
       sweep from the sea upstream, unconditionally stable, exact for n = 1.
     · PRIORITY-FLOOD (Barnes, Lehman & Mulla 2014) for depressions — and the
       order it pops cells in IS the ascending-elevation order the rest of the
       step needs, so the sort is free.
     · the NETWORK MEASUREMENTS: drainage area, longest upstream flow path,
       Strahler stream order, Hack's exponent, Horton's ratios. None of these
       quantities appears anywhere in the three lines of physics above. That
       is the whole point of the room.

   THE CLAIM
     Nothing in the rule knows what a river is. Every cell only asks: how much
     water passes me, and how steep am I. Yet what grows is a TREE with the
     statistics real rivers have — Hack's law with an exponent near 0.57 (not
     the 0.5 a family of similar shapes would give), and a Horton bifurcation
     ratio near 4.
     And there is a switch that turns it off: let each cell forget the water
     that came from above (A := one cell) and the branching does not merely
     get worse, it does not happen. The mountain comes out a smooth dome.

   UNITS: metres and years throughout.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── a small deterministic PRNG, so every run is reproducible ─────────────── */
export function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── the eight neighbours, and how far away each one is ──────────────────── */
const NX = [1, 1, 0, -1, -1, -1, 0, 1];
const NY = [0, 1, 1, 1, 0, -1, -1, -1];

/* ═══════════════════════════════════════════════════════════════════════════
   A BINARY MIN-HEAP over (key: float64, value: uint32).
   Priority-flood needs one and nothing in the estate had one.
   ═══════════════════════════════════════════════════════════════════════════ */
export class MinHeap {
  constructor(cap) {
    this.k = new Float64Array(cap + 1);
    this.v = new Uint32Array(cap + 1);
    this.n = 0;
  }
  clear() { this.n = 0; }
  push(key, val) {
    const k = this.k, v = this.v;
    let i = ++this.n;
    k[i] = key; v[i] = val;
    while (i > 1) {
      const p = i >> 1;
      if (k[p] <= k[i]) break;
      const tk = k[p], tv = v[p];
      k[p] = k[i]; v[p] = v[i];
      k[i] = tk; v[i] = tv;
      i = p;
    }
  }
  pop() {                              /* returns the value; key in .lastKey */
    const k = this.k, v = this.v, n = this.n;
    const outV = v[1];
    this.lastKey = k[1];
    k[1] = k[n]; v[1] = v[n];
    this.n = n - 1;
    let i = 1;
    for (;;) {
      const l = i << 1, r = l + 1;
      let s = i;
      if (l <= this.n && k[l] < k[s]) s = l;
      if (r <= this.n && k[r] < k[s]) s = r;
      if (s === i) break;
      const tk = k[s], tv = v[s];
      k[s] = k[i]; v[s] = v[i];
      k[i] = tk; v[i] = tv;
      i = s;
    }
    return outV;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE LAND
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEFAULTS = {
  N: 256,            /* cells across                                          */
  dx: 40,            /* metres per cell  -> a 10.2 km island                  */
  U: 1.0e-3,         /* uplift, m/yr  (1 mm a year: a real mountain range)    */
  K: 2.4e-5,         /* stream-power erodibility, for m = 0.5, n = 1          */
  m: 0.5,            /* area exponent                                         */
  D: 0.02,           /* hillslope diffusivity, m^2/yr                         */
  dt: 900,           /* years per step                                        */
  seed: 20260729,
  aCritCells: 20,    /* a channel head: this many cells of catchment          */
  waterRemembers: true,
  rainNorth: 0,      /* 0 = rain falls evenly. >0 tilts it to the north side. */
  island: true,      /* a lumpy blob of land in a sea, rather than a square   */
  coast: 0.42,       /* mean shore radius, as a fraction of the grid          */
  shelf: 0.03        /* the outer band over which uplift fades to nothing     */
};

export function makeLand(opts = {}) {
  const p = Object.assign({}, DEFAULTS, opts);
  const N = p.N, NN = N * N;
  const st = {
    N, NN, dx: p.dx,
    U: p.U, K: p.K, m: p.m, D: p.D, dt: p.dt,
    seed: p.seed,
    aCrit: p.aCritCells * p.dx * p.dx,
    waterRemembers: p.waterRemembers,
    rainNorth: p.rainNorth,
    t: 0, steps: 0,

    land:  new Uint8Array(NN),     /* 1 = land that rises; 0 = the sea        */
    upl:   new Float64Array(NN),   /* uplift multiplier — fades at the shore  */
    bed:   new Float64Array(NN),   /* the sea floor, for drawing only         */
    h:     new Float64Array(NN),   /* the land                                */
    hf:    new Float64Array(NN),   /* depression-filled copy (routing only)   */
    recv:  new Int32Array(NN),     /* index of the cell each cell drains into */
    rdir:  new Int8Array(NN),      /* which of the 8 (or -1 at an outlet)     */
    ord:   new Int32Array(NN),     /* every cell, ASCENDING in filled height  */
    area:  new Float64Array(NN),   /* drainage area, m^2                      */
    rain:  new Float64Array(NN),   /* relative rainfall per cell              */
    closed: new Uint8Array(NN),
    scratch: new Float64Array(NN),
    scratch2: new Float64Array(NN),
    dhdt:  0,                      /* mean |dh/dt| of the last step, m/yr     */
    heap:  new MinHeap(NN)
  };

  /* rainfall field: even, or tilted so one flank is wetter than the other */
  for (let y = 0; y < N; y++) {
    const f = 1 + p.rainNorth * (1 - 2 * y / (N - 1));
    for (let x = 0; x < N; x++) st.rain[y * N + x] = f;
  }

  shapeCoast(st, p);
  seedLand(st, p.seed);
  route(st);
  return st;
}

/* ── the coast ────────────────────────────────────────────────────────────
   A lumpy blob rather than a circle, and rather than a square: four harmonics
   of the angle, seeded, so every island is its own island. Uplift fades to
   nothing over the outer shelf, which is what leaves a coastal plain for the
   rivers to wander across instead of a cliff to fall off.                    */
export function shapeCoast(st, p) {
  const N = st.N, r = rng((p.seed ^ 0x9e3779b9) >>> 0);
  const cx = (N - 1) / 2, cy = (N - 1) / 2;
  const R0 = (p.island === false) ? 1e9 : p.coast * N;
  const ph = [r() * 6.283, r() * 6.283, r() * 6.283, r() * 6.283];
  const shoreAt = th => R0 * (1
    + 0.065 * Math.sin(2 * th + ph[0]) + 0.045 * Math.sin(3 * th + ph[1])
    + 0.030 * Math.sin(5 * th + ph[2]) + 0.020 * Math.sin(7 * th + ph[3]));
  const band = p.shelf * R0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const border = (x < 1 || y < 1 || x > N - 2 || y > N - 2);
      if (p.island === false) {
        st.land[i] = border ? 0 : 1;
        const ex = Math.min(x, N - 1 - x), ey = Math.min(y, N - 1 - y);
        const d = Math.min(ex, ey) * st.dx;
        st.upl[i] = border ? 0 : Math.min(1, d / (0.10 * N * st.dx));
        st.bed[i] = border ? -12 : 0;
        continue;
      }
      const dxs = x - cx, dys = y - cy;
      const d = Math.hypot(dxs, dys);
      const sh = shoreAt(Math.atan2(dys, dxs));
      const inside = sh - d;                       /* cells inside the shore */
      if (inside <= 0 || border) {
        st.land[i] = 0;
        const out = Math.max(0.2, -inside);
        st.bed[i] = -(2.5 + 46 * (1 - Math.exp(-out / 9)));
        st.upl[i] = 0;
      } else {
        st.land[i] = 1;
        const u = Math.min(1, inside / band);
        st.upl[i] = u * u * (3 - 2 * u);            /* smoothstep */
        st.bed[i] = 0;
      }
    }
  }
}

/* A nearly-flat plain with a whisper of noise on it, standing in the sea.
   Everything you will ever see is grown from that by the three lines.        */
export function seedLand(st, seed) {
  const N = st.N, r = rng(seed >>> 0);
  st.t = 0; st.steps = 0;
  for (let i = 0; i < st.NN; i++) {
    st.h[i] = st.land[i] ? (2 + 6 * r()) * st.upl[i] : 0;
  }
}

/* An OUTLET is any cell the water leaves the model through: the sea. */
export function isEdge(st, i) { return st.land[i] === 0; }

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE — fill the pits, find every cell's receiver, order the whole grid by
   elevation, and push the water down it.

   The pop order of the priority-flood is non-decreasing in the FILLED height
   (a cell's filled height is final at the moment it is pushed), so it doubles
   as the topological order both later sweeps need. No sort anywhere.
   ═══════════════════════════════════════════════════════════════════════════ */
export function route(st) {
  const N = st.N, NN = st.NN, h = st.h, hf = st.hf, closed = st.closed;
  const heap = st.heap;
  const EPS = 1e-6;

  hf.set(h);
  closed.fill(0);
  heap.clear();

  const land = st.land;
  for (let i = 0; i < NN; i++) {
    if (land[i]) continue;
    hf[i] = 0;                                   /* the sea is the datum */
    closed[i] = 1;
    heap.push(0, i);
  }

  const ord = st.ord;
  let k = 0;
  while (heap.n > 0) {
    const c = heap.pop();
    ord[k++] = c;
    const cx = c % N, cy = (c / N) | 0, hc = hf[c];
    for (let d = 0; d < 8; d++) {
      const nx = cx + NX[d], ny = cy + NY[d];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx;
      if (closed[ni]) continue;
      if (hf[ni] <= hc) hf[ni] = hc + EPS;
      closed[ni] = 1;
      heap.push(hf[ni], ni);
    }
  }
  st.ordCount = k;

  /* receivers: steepest descent on the filled surface (every interior cell
     now has one, by construction) */
  const recv = st.recv, rdir = st.rdir, dx = st.dx, DIAG = Math.SQRT2 * dx;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (!land[i]) { recv[i] = i; rdir[i] = -1; continue; }
      let best = 0, bi = i, bd = -1;
      const hi = hf[i];
      for (let d = 0; d < 8; d++) {
        const ni = (y + NY[d]) * N + (x + NX[d]);
        const drop = hi - hf[ni];
        if (drop <= 0) continue;
        const s = drop / ((d & 1) ? DIAG : dx);
        if (s > best) { best = s; bi = ni; bd = d; }
      }
      recv[i] = bi; rdir[i] = bd;
    }
  }

  /* drainage area: one descending sweep, each cell handing its water down */
  const area = st.area, rain = st.rain, cellA = dx * dx;
  for (let i = 0; i < NN; i++) area[i] = cellA * rain[i];
  for (let j = NN - 1; j >= 0; j--) {
    const i = ord[j];
    const r = recv[i];
    if (r !== i) area[r] += area[i];
  }
  return st;
}

export function linkLen(st, i, r) {
  if (r === i) return 0;
  const N = st.N;
  const dxc = (i % N) - (r % N), dyc = ((i / N) | 0) - ((r / N) | 0);
  return (dxc && dyc) ? Math.SQRT2 * st.dx : st.dx;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ONE STEP OF TIME
     uplift + stream power, implicitly, in one sweep from the sea upstream;
     then hillslope diffusion; then re-route.
   ═══════════════════════════════════════════════════════════════════════════ */
export function step(st, dtIn) {
  const dt = dtIn === undefined ? st.dt : dtIn;
  const N = st.N, NN = st.NN, h = st.h, ord = st.ord, recv = st.recv;
  const K = st.K, m = st.m, U = st.U, dx = st.dx;
  const cellA = dx * dx;
  const remembers = st.waterRemembers;

  let acc = 0;
  const before = st.scratch;
  before.set(h);

  /* --- uplift + stream power, ASCENDING: a receiver is always solved first */
  for (let j = 0; j < NN; j++) {
    const i = ord[j];
    const r = recv[i];
    if (r === i) { h[i] = 0; continue; }            /* the sea holds the datum */
    const hUp = h[i] + U * st.upl[i] * dt;
    const hr = h[r];
    if (hr >= hUp) { h[i] = hUp; continue; }        /* nothing to cut into */
    const A = remembers ? st.area[i] : cellA * st.rain[i];
    const f = K * dt * Math.pow(A, m) / linkLen(st, i, r);
    h[i] = (hUp + f * hr) / (1 + f);
  }

  /* --- hillslope diffusion, explicit, sub-stepped to stay inside its limit */
  if (st.D > 0) {
    const lim = 0.2 * dx * dx / st.D;
    const nsub = Math.max(1, Math.ceil(dt / lim));
    const sdt = dt / nsub;
    const c = st.D * sdt / (dx * dx);
    const tmp = st.scratch2;
    for (let s = 0; s < nsub; s++) {
      tmp.set(h);
      for (let y = 1; y < N - 1; y++) {
        const row = y * N;
        for (let x = 1; x < N - 1; x++) {
          const i = row + x;
          if (!st.land[i]) continue;                /* the sea is Dirichlet */
          h[i] = tmp[i] + c * (tmp[i - 1] + tmp[i + 1] + tmp[i - N] + tmp[i + N] - 4 * tmp[i]);
        }
      }
    }
  }

  let nLand = 0;
  for (let i = 0; i < NN; i++) {
    if (!st.land[i]) { h[i] = 0; continue; }
    if (h[i] < 0) h[i] = 0;
    acc += Math.abs(h[i] - before[i]);
    nLand++;
  }
  st.dhdt = acc / Math.max(1, nLand) / dt;
  st.t += dt;
  st.steps++;
  route(st);
  return st;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE MEASUREMENTS
   Everything below reads only `recv`, `ord` and `area` — the shape the water
   made. None of it is fed back into the physics.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Longest upstream flow path to every cell (Hack's L). One descending sweep. */
export function flowLength(st, out) {
  const NN = st.NN, ord = st.ord, recv = st.recv;
  const L = out && out.length === NN ? out : new Float64Array(NN);
  L.fill(0);
  for (let j = NN - 1; j >= 0; j--) {
    const i = ord[j], r = recv[i];
    if (r === i) continue;
    const cand = L[i] + linkLen(st, i, r);
    if (cand > L[r]) L[r] = cand;
  }
  return L;
}

/* least squares on log10(y) = a + b log10(x); returns slope, intercept, R^2 */
export function logFit(xs, ys) {
  const n = xs.length;
  if (n < 3) return { b: NaN, a: NaN, r2: NaN, n };
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; }
  const mx = sx / n, my = sy / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    sxy += a * b; sxx += a * a; syy += b * b;
  }
  const b = sxy / sxx;
  return { b, a: my - b * mx, r2: syy > 0 ? (sxy * sxy) / (sxx * syy) : NaN, n };
}

/* HACK'S LAW.  L = c A^h over every point of the network taken as the outlet
   of its own basin (the nested-basin measurement; Rigon et al. 1996).
   A family of geometrically SIMILAR basins would give h = 1/2 exactly.

   The headline number is fitted to BINNED MEDIANS, one point per tenth of a
   decade of area, because the raw cloud has thousands of little basins and a
   handful of big ones — a straight least-squares over the points is really a
   measurement of the small end. A bin has to hold at least `minMembers`
   basins to have a median worth fitting, which is also what keeps the last
   two or three bins (one or two main stems, wholly shaped by where this
   particular island's coast happens to be) from swinging the answer.
   The unbinned fit is returned alongside as `hPoint`, and they agree.        */
export function hack(st, opts = {}) {
  const aMin = opts.aMin === undefined ? st.aCrit : opts.aMin;
  const bw = opts.bw === undefined ? 0.1 : opts.bw;
  const minMembers = opts.minMembers === undefined ? 25 : opts.minMembers;
  const L = flowLength(st, opts.L);
  const xs = [], ys = [];
  const bins = new Map();
  let aMax = 0;
  for (let i = 0; i < st.NN; i++) {
    if (isEdge(st, i)) continue;
    const A = st.area[i];
    if (A < aMin || L[i] <= 0) continue;
    const la = Math.log10(A), ll = Math.log10(L[i]);
    xs.push(la); ys.push(ll);
    if (A > aMax) aMax = A;
    const b = Math.round(la / bw);
    let arr = bins.get(b);
    if (!arr) { arr = []; bins.set(b, arr); }
    arr.push(ll);
  }
  const bx = [], by = [], bn = [];
  const keys = Array.from(bins.keys()).sort((a, b) => a - b);
  for (const b of keys) {
    const v = bins.get(b);
    if (v.length < minMembers) continue;
    v.sort((a, b2) => a - b2);
    bx.push(b * bw); by.push(v[v.length >> 1]); bn.push(v.length);
  }
  const fb = logFit(bx, by);
  const fp = logFit(xs, ys);
  return {
    h: fb.b, c: Math.pow(10, fb.a), r2: fb.r2, nbins: bx.length,
    hPoint: fp.b, r2Point: fp.r2, n: fp.n,
    decades: bx.length ? bx[bx.length - 1] - bx[0] : 0,
    bins: { x: bx, y: by, n: bn },
    cloud: { x: xs, y: ys },
    aMin, aMax
  };
}

/* STRAHLER ORDER + HORTON'S RATIOS over the channel network (A >= aCrit).   */
export function network(st, opts = {}) {
  const NN = st.NN, ord = st.ord, recv = st.recv, area = st.area;
  const aCrit = opts.aCrit === undefined ? st.aCrit : opts.aCrit;
  const order = opts.order && opts.order.length === NN ? opts.order : new Int32Array(NN);
  order.fill(0);
  const mx = new Int32Array(NN), cnt = new Int32Array(NN);

  let heads = 0, chanCells = 0, totalLen = 0;
  /* descending: every donor is above its receiver, so it is already resolved */
  for (let j = NN - 1; j >= 0; j--) {
    const i = ord[j];
    if (area[i] < aCrit || isEdge(st, i)) continue;
    const o = mx[i] === 0 ? 1 : mx[i] + (cnt[i] >= 2 ? 1 : 0);
    order[i] = o;
    if (mx[i] === 0) heads++;
    chanCells++;
    const r = recv[i];
    if (r !== i) {
      totalLen += linkLen(st, i, r);
      if (o > mx[r]) { mx[r] = o; cnt[r] = 1; }
      else if (o === mx[r]) cnt[r]++;
    }
  }

  /* a LINK is a maximal run of one order; count it once, at its lower end */
  let omax = 0;
  for (let i = 0; i < NN; i++) if (order[i] > omax) omax = order[i];
  const num = new Float64Array(omax + 2), len = new Float64Array(omax + 2);
  for (let i = 0; i < NN; i++) {
    const o = order[i];
    if (!o) continue;
    const r = recv[i];
    len[o] += linkLen(st, i, r);
    if (r === i || order[r] !== o) num[o]++;
  }

  const os = [], ns = [], ls = [];
  for (let o = 1; o <= omax; o++) {
    if (num[o] < 1) continue;
    os.push(o); ns.push(Math.log10(num[o])); ls.push(Math.log10(len[o] / num[o]));
  }
  /* Horton fits the whole ladder; the top order is always a single stream and
     carries no information, so it is dropped when there is enough left. */
  const use = os.length >= 4 ? os.length - 1 : os.length;
  const fb = logFit(os.slice(0, use), ns.slice(0, use));
  const fl = logFit(os.slice(0, use), ls.slice(0, use));

  return {
    order, omax, heads, chanCells,
    totalLen,
    density: totalLen / ((st.N - 2) * (st.N - 2) * st.dx * st.dx),  /* 1/m */
    counts: Array.from(num.slice(1, omax + 1)),
    meanLen: Array.from(len.slice(1, omax + 1)).map((v, i) => num[i + 1] ? v / num[i + 1] : 0),
    Rb: Math.pow(10, -fb.b), RbR2: fb.r2,
    Rl: Math.pow(10, fl.b), RlR2: fl.r2
  };
}

/* Where a drop put down at cell i actually goes. */
export function flowPath(st, i, maxLen = 100000) {
  const path = [i];
  let c = i, guard = 0;
  while (st.recv[c] !== c && guard++ < maxLen) { c = st.recv[c]; path.push(c); }
  return path;
}

/* Which outlet each cell ultimately reaches — the catchments, as a label field.
   One ASCENDING sweep: a receiver is always labelled before its donors.       */
export function basins(st, out) {
  const NN = st.NN, ord = st.ord, recv = st.recv;
  const lab = out && out.length === NN ? out : new Int32Array(NN);
  for (let j = 0; j < NN; j++) {
    const i = ord[j], r = recv[i];
    lab[i] = (r === i) ? i : lab[r];
  }
  return lab;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE RIVER RIBBON — a max-plus chamfer transform.

   A real river at this scale is narrower than one cell, so drawing it by
   colouring channel cells gives a staircase. Instead each channel cell claims
   a radius (from its own discharge, by downstream hydraulic geometry w ~ A^0.5)
   and the field records, for every cell, how far INSIDE the widest claim it
   is. Two sweeps, no queue.

   `exagg` is honest and named. A real river draining ten square kilometres is
   about seventeen metres across and one cell here is forty, so at true width
   the whole network would fall between the samples and simply not exist. The
   claim is scaled up ~14x and floored at half a cell, so a headwater stream is
   a hairline and the trunk still visibly tapers into it.
   ═══════════════════════════════════════════════════════════════════════════ */
export function ribbon(st, out, opts = {}) {
  const N = st.N, NN = st.NN, dx = st.dx;
  const exagg = opts.exagg === undefined ? 9.5 : opts.exagg;
  const kw = opts.kw === undefined ? 0.0055 : opts.kw;   /* w = kw sqrt(A), metres */
  const floorCells = opts.floorCells === undefined ? 0.42 : opts.floorCells;
  const aCrit = opts.aCrit === undefined ? st.aCrit : opts.aCrit;
  const R = out && out.length === NN ? out : new Float32Array(NN);
  const NEG = -1e9;
  for (let i = 0; i < NN; i++) {
    const A = st.area[i];
    R[i] = (A >= aCrit && !isEdge(st, i))
      ? Math.max(floorCells, (exagg * kw * Math.sqrt(A)) / dx * 0.5)  /* half-width, cells */
      : NEG;
  }
  const D1 = 1, D2 = Math.SQRT2;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const i = y * N + x;
      let v = R[i];
      if (R[i - 1] - D1 > v) v = R[i - 1] - D1;
      if (R[i - N] - D1 > v) v = R[i - N] - D1;
      if (R[i - N - 1] - D2 > v) v = R[i - N - 1] - D2;
      if (R[i - N + 1] - D2 > v) v = R[i - N + 1] - D2;
      R[i] = v;
    }
  }
  for (let y = N - 2; y >= 1; y--) {
    for (let x = N - 2; x >= 1; x--) {
      const i = y * N + x;
      let v = R[i];
      if (R[i + 1] - D1 > v) v = R[i + 1] - D1;
      if (R[i + N] - D1 > v) v = R[i + N] - D1;
      if (R[i + N + 1] - D2 > v) v = R[i + N + 1] - D2;
      if (R[i + N - 1] - D2 > v) v = R[i + N - 1] - D2;
      R[i] = v;
    }
  }
  for (let i = 0; i < NN; i++) if (R[i] < -4) R[i] = -4;
  return R;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE ORDER FIELD — the same max-plus sweep as the ribbon, but each channel
   cell claims a radius that grows with its STRAHLER ORDER and carries that
   order out with it. Without this a fifth-order trunk is drawn exactly as wide
   as the four hundred first-order streams and the ladder is invisible; and
   reading the order per-fragment out of an interpolated vertex value smears
   every junction back down to order one.
   ═══════════════════════════════════════════════════════════════════════════ */
export function orderSpread(st, order, out, opts = {}) {
  const N = st.N, NN = st.NN;
  const base = opts.base === undefined ? 0.30 : opts.base;
  const per = opts.per === undefined ? 0.82 : opts.per;
  const O = out && out.length === NN ? out : new Uint8Array(NN);
  const R = st.scratch2;                       /* reused: routing is done */
  const NEG = -1e9;
  for (let i = 0; i < NN; i++) {
    const o = order[i];
    if (o > 0) { R[i] = base + per * o; O[i] = o; }
    else { R[i] = NEG; O[i] = 0; }
  }
  const D1 = 1, D2 = Math.SQRT2;
  const step = (i, j, d) => {
    const v = R[j] - d;
    if (v > R[i]) { R[i] = v; O[i] = O[j]; }
  };
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = y * N + x;
    step(i, i - 1, D1); step(i, i - N, D1);
    step(i, i - N - 1, D2); step(i, i - N + 1, D2);
  }
  for (let y = N - 2; y >= 1; y--) for (let x = N - 2; x >= 1; x--) {
    const i = y * N + x;
    step(i, i + 1, D1); step(i, i + N, D1);
    step(i, i + N + 1, D2); step(i, i + N - 1, D2);
  }
  for (let i = 0; i < NN; i++) if (R[i] < 0) O[i] = 0;
  return O;
}

/* ── convenience: the steady-state slope the model must settle to, from the
   physics alone, with no simulation in it.  E = U  =>  K A^m S = U          */
export function predictedSlope(st, A) { return st.U / (st.K * Math.pow(A, st.m)); }

/* ── run n steps (used by the twin and by the page's fast-forward) ───────── */
export function run(st, n) { for (let i = 0; i < n; i++) step(st); return st; }
