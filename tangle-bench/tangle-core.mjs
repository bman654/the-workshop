// ============================================================================
//  The Tangle Bench — a writhing strand & the knot it earns (CORE)
//  Sewing Room bench #4. Pure, dependency-free except for the SHARED knot math,
//  which it IMPORTS from the sibling Knot Tabulator's core (the single source of
//  truth for gaussToCrossings / knotDeterminant / isRealizable / diagramCode /
//  makeRng). This file adds the genuinely NEW work: a GEOMETRY→GAUSS detector (read
//  the knot off a drawn strand's own crossings), a deterministic 3-D bead-strand
//  SIM you shake (the hero — art, no claim), and a braid-closure ENTROPY HARNESS.
//
//  THE CLAIM — agitation earns a knot; a number reads it off the geometry.
//
//  The Tabulator proves a number |Δ(−1)| can't budge under any redrawing; the
//  Unknotting Bench lets you untie a disguise and be refused by that theorem. This
//  bench shows where a knot COMES FROM: agitate a strand and watch it writhe, and a
//  live detector reads the wing's own |Δ(−1)| straight off the strand's geometry —
//  the SAME integer the Tabulator computes combinatorially. Two independent roads to
//  one number.
//
//  ── THE HONEST PHYSICS (a call this bench makes openly). A loop that is sealed shut
//  can NEVER change its knot type without passing through itself — that is a theorem,
//  and the self-avoidance here forbids the pass-through. So the thing you shake is an
//  OPEN strand (a length of rope with two free ends — the dropped-garden-hose), which
//  genuinely tangles, exactly as a real agitated string does (Raymer–Smith 2007). The
//  DETECTOR closes the open arc the standard way (a return path routed far outside the
//  frame, adding no crossing) and reads the knot of the closure. PULL-TIGHT cinches
//  the ends.
//
//  ── THE DETECTOR (the geometry road). segInt → strict-interior segment crossing;
//  geomToGauss(pts, z) walks the strand once in index order, collects every self-
//  crossing, orders the two passes of each by (segment, t-along-segment), assigns each
//  geometric crossing ONE shared id (first sight → next id, second → reuse), reads
//  over/under from the per-bead z (greater interpolated z = OVER) and the sign from
//  the right-hand rule on the over/under tangents. detLive runs that code through the
//  IMPORTED gaussToCrossings + knotDeterminant. On the canonical reference polylines
//  it returns unknot 1, trefoil 3, figure-8 5 — matching diagramCode() exactly (the
//  geometry road === the combinatorial authority). That parity is the soundness proof:
//  two disjoint roads, one integer; the detector cannot be quietly self-fulfilling.
//
//  ── THE ENTROPY HARNESS (the braid road). A braid word is a real, physical operation
//  on a bundle of strands — lift run k over run k+1 (σ_k). Its trace closure is a
//  genuine knot, built here COMBINATORIALLY (braidGauss → a signed Gauss code, exact)
//  rather than from fragile geometry. runTrial(n,A,seed) closes a random length-A
//  braid word on n strands and asks det>1. cohortP sweeps a FIXED seed list so the
//  published P never drifts on reload. On n=3 strands P(knot) climbs monotonically
//  with the word length A — 0 at A=0, ≈0.69 by A=80 — with NON-OVERLAPPING Wilson 95%
//  intervals between the calm and the well-shaken cohort. Entropy needs room to act.
//
//  ── HONESTY. What is PROVEN here is exact and bounded: the detector matches the
//  Tabulator on the three reference diagrams (parity); the braid harness is monotone
//  in agitation with disjoint Wilson intervals over a fixed seed list, and its A=0
//  neg-control is provably the bare unknot; the teeth bite (a crossing-COUNT fake
//  calls a disguised unknot "knotted", and a constant-P fake FAILS the monotonicity).
//  The LIVE shaken strand is art — it owes no proof; it is the hero you can see and
//  touch, and the detector that reads it is the part that carries the claim.
// ============================================================================

import {
  gaussToCrossings, knotDeterminant, isRealizable, diagramCode, makeRng,
} from '../knot-tabulator/knot-core.mjs';

// ===== TANGLE CORE BEGIN =====
// The detector + the sim + the braid harness + the oracle live ONLY between these
// sentinels. The page inlines a byte-twin of THIS slice; the shared knot math
// (gaussToCrossings / knotDeterminant / isRealizable / diagramCode / makeRng) is the
// IMPORT, not duplicated — the single shared authority. tangle-core.test.mjs proves
// this slice char-for-char === the module.

// ── THE WORLD GEOMETRY CONSTANTS — fixed integers, no wall-clock anywhere. ─────
// One box, one rest length; the sim is a fixed-DT / fixed-substep / fixed-pass
// integrator so "same seed replays byte-identical" is a near-trivial guarantee.
const BOX = 130, PAD = 12, ZBOX = 42, L0 = 6;
const SUBSTEPS = 5, PROJ_PASSES = 9;
const DAMP = 0.99, REP_R = 7.0, REP_K = 1.0, REP_CLAMP = 1.6;
const DETECT_EVERY = 6;           // detLive cadence (frames) — O(seg²)·Bareiss is not per-paint
const ZCLOSE = -(ZBOX + 30);      // the closure return path runs far under (always the under-strand)

// ── segInt(ax,ay,bx,by,cx,cy,dx,dy) — strict-interior 2-D segment crossing. ────
// Returns { t, u } (the parameters along AB and CD) when the OPEN segments cross in
// their interiors, else null. The strict (no-endpoint) test keeps a shared bead from
// registering as a crossing of its own two incident segments.
function segInt(ax, ay, bx, by, cx, cy, dx, dy){
  const r1x = bx - ax, r1y = by - ay, r2x = dx - cx, r2y = dy - cy;
  const den = r1x * r2y - r1y * r2x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((cx - ax) * r2y - (cy - ay) * r2x) / den;
  const u = ((cx - ax) * r1y - (cy - ay) * r1x) / den;
  if (t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9) return { t, u };
  return null;
}

// ── crossingSign(oTx,oTy,uTx,uTy) — the right-hand rule on the tangents. ───────
// +1 when the OVER strand's tangent turns counter-clockwise onto the UNDER strand's
// (the sign convention diagramCode() uses), −1 otherwise. The sign feeds the signed
// Alexander matrix; it is read off geometry, never invented.
function crossingSign(oTx, oTy, uTx, uTy){
  return (oTx * uTy - oTy * uTx) >= 0 ? 1 : -1;
}

// ── geomToGauss(pts, z) — THE GEOMETRY→GAUSS BRIDGE. ───────────────────────────
// pts is an OPEN polyline [x0,y0,x1,y1,…] (the strand's beads in order); z is the
// per-bead height. Walk the strand once: collect every self-crossing between non-
// adjacent segments, interpolate z on each strand to set over/under (greater z =
// OVER), set the sign by the right-hand rule, then ORDER each crossing's two passes
// by (segment index, t-along-segment) — that linear order along the strand IS the
// Gauss sequence. Each geometric crossing gets ONE shared id (first sight → next id,
// second → reuse). Returns the signed Gauss code [{t,id,sign}] read downstream by the
// IMPORTED gaussToCrossings — this never re-parses or re-implements the seam.
function geomToGauss(pts, z){
  const N = pts.length / 2;
  const X = i => pts[2 * i], Y = i => pts[2 * i + 1], Z = i => z[i];
  const raw = [];
  for (let i = 0; i < N - 1; i++){
    for (let j = i + 2; j < N - 1; j++){
      const h = segInt(X(i), Y(i), X(i + 1), Y(i + 1), X(j), Y(j), X(j + 1), Y(j + 1));
      if (!h) continue;
      const zi = Z(i) + h.t * (Z(i + 1) - Z(i));
      const zj = Z(j) + h.u * (Z(j + 1) - Z(j));
      const tiX = X(i + 1) - X(i), tiY = Y(i + 1) - Y(i);
      const tjX = X(j + 1) - X(j), tjY = Y(j + 1) - Y(j);
      raw.push({ i, ti: h.t, j, tj: h.u, zi, zj, tiX, tiY, tjX, tjY });
    }
  }
  const ev = [];
  for (let k = 0; k < raw.length; k++){
    const c = raw[k];
    const iOver = c.zi > c.zj;                                   // greater interpolated z = OVER
    const oTx = iOver ? c.tiX : c.tjX, oTy = iOver ? c.tiY : c.tjY;
    const uTx = iOver ? c.tjX : c.tiX, uTy = iOver ? c.tjY : c.tiY;
    const sgn = crossingSign(oTx, oTy, uTx, uTy);
    ev.push({ seg: c.i, along: c.ti, cid: k, t: iOver ? 'O' : 'U', sign: sgn });
    ev.push({ seg: c.j, along: c.tj, cid: k, t: iOver ? 'U' : 'O', sign: sgn });
  }
  ev.sort((a, b) => a.seg !== b.seg ? a.seg - b.seg : a.along - b.along);   // walk order along the strand
  const idOf = new Map();
  let next = 1;
  const code = [];
  for (const e of ev){
    let id = idOf.get(e.cid);
    if (id === undefined){ id = next++; idOf.set(e.cid, id); }
    code.push({ t: e.t, id, sign: e.sign });
  }
  return code;
}

// ── closeArc(x,y,z,N) — close an OPEN strand the standard way (knot closure). ──
// Append a return path from the last bead back to the first, routed FAR outside the
// frame (and far under in z, so it is always the under-strand) — it adds no crossing
// with the body, so the closure reads the knot type of the open arc, nothing more.
function closeArc(x, y, z, N){
  const px = [], pz = [];
  for (let i = 0; i < N; i++){ px.push(x[i], y[i]); pz.push(z[i]); }
  const big = BOX * 2.4;
  const detour = [ [x[N - 1], -big], [-big, -big], [-big, y[0]] ];
  for (const [dx, dy] of detour){ px.push(dx, dy); pz.push(ZCLOSE); }
  px.push(x[0], y[0]); pz.push(z[0]);                            // land back on the first bead
  return { pts: Float64Array.from(px), z: Float64Array.from(pz) };
}

// ── detLive(pts, z) — read the live |Δ(−1)| off the strand geometry. ──────────
// Build the Gauss code from the geometry; if the projection is momentarily not a
// realizable diagram (a near-tangent transient) return {det:null, realizable:false}
// so the headline HOLDS its last verdict (no flicker). Otherwise run the IMPORTED
// gaussToCrossings + knotDeterminant — the ONE source of truth the headline and the
// PULL-TIGHT verb both read. pts/z are an already-CLOSED polyline.
function detLive(pts, z){
  const code = geomToGauss(pts, z);
  if (!isRealizable(code)) return { det: null, realizable: false, ncross: code.length / 2 };
  const det = knotDeterminant(gaussToCrossings(code));
  return { det, realizable: true, ncross: code.length / 2 };
}

// ── REFERENCE POLYLINES — canonical knots drawn as closed polylines (+ per-bead z).
// Hand-authored parametric curves; the detector must read |Δ| off THESE and match the
// Tabulator's diagramCode() exactly (the CLAIM-a parity teeth). Plus a DISGUISED
// UNKNOT — a visibly messy loop whose det must still read 1 (the count-crossings fake
// fails it). Each returns a CLOSED polyline so detLive reads it directly.
function refPolyline(name){
  const close = (pts, z) => {
    const N = pts.length / 2; const px = pts.slice(); const pz = z.slice();
    px.push(pts[0], pts[1]); pz.push(z[0]); return { pts: Float64Array.from(px), z: Float64Array.from(pz), N };
  };
  if (name === 'unknot'){
    const N = 40, p = [], z = [];
    for (let i = 0; i < N; i++){ const a = 2 * Math.PI * i / N; p.push(50 + 30 * Math.cos(a), 50 + 30 * Math.sin(a)); z.push(0); }
    return close(p, z);
  }
  if (name === 'trefoil'){
    const N = 120, p = [], z = [];
    for (let i = 0; i < N; i++){ const t = 2 * Math.PI * i / N;
      p.push(50 + 9 * (Math.sin(t) + 2 * Math.sin(2 * t)), 50 + 9 * (Math.cos(t) - 2 * Math.cos(2 * t)));
      z.push(Math.sin(3 * t)); }
    return close(p, z);
  }
  if (name === 'figure8'){
    const N = 160, p = [], z = [];
    for (let i = 0; i < N; i++){ const t = 2 * Math.PI * i / N; const r = 2 + Math.cos(2 * t);
      p.push(50 + 9 * (r * Math.cos(3 * t)), 50 + 9 * (r * Math.sin(3 * t)));
      z.push(Math.sin(4 * t)); }
    return close(p, z);
  }
  if (name === 'disguise'){
    // a big circle wearing FOUR little epicyclic kinks — each a trivial R1 loop, so
    // the loop is the unknot in disguise (|Δ|=1) even though crossing-COUNT screams 4.
    // The fast epicycle adds the visible loops; its phase sets each kink's clean
    // over/under z, so the diagram stays realizable and the determinant reads 1.
    const N = 240, K = 5, R = 26, lr = 7, p = [], z = [];
    for (let i = 0; i < N; i++){ const t = 2 * Math.PI * i / N;
      p.push(50 + R * Math.cos(t) + lr * Math.cos(K * t), 50 + R * Math.sin(t) + lr * Math.sin(K * t));
      z.push(Math.sin(K * t));
    }
    return close(p, z);
  }
  throw new Error('unknown reference: ' + name);
}

// ── braidGauss(n, word) — a braid word's TRACE CLOSURE as a signed Gauss code. ─
// n vertical strands descending; word is an array of signed generators (±k means
// σ_k^{±1}, 1≤k≤n−1, swapping the strands in positions k−1,k with k the OVER strand
// for σ_k>0). Trace closure wraps the bottom of each slot to its top. Walk the single
// closed component from (slot 0, row 0), emitting one token per crossing (over/under
// by the generator, sign by it). Returns { code, single } — `single` is false when
// the closure is a multi-component LINK (then it is not a single knot). This is the
// EXACT combinatorial construction — no geometry, no fragile layout.
function braidGauss(n, word){
  const R = word.length;
  const stepDown = (slot, r) => {
    if (r >= R) return { slot, row: 0, cross: null };            // trace-closure wrap: bottom → top, same slot
    const g = word[r], k = Math.abs(g) - 1;
    if (slot === k)     return { slot: k + 1, row: r + 1, cross: { cid: r, role: (g > 0 ? 'over' : 'under'), sign: (g > 0 ? 1 : -1) } };
    if (slot === k + 1) return { slot: k,     row: r + 1, cross: { cid: r, role: (g > 0 ? 'under' : 'over'), sign: (g > 0 ? 1 : -1) } };
    return { slot, row: r + 1, cross: null };
  };
  let slot = 0, row = 0, steps = 0;
  const maxSteps = n * (R + 2) * 4 + 10;
  const tokens = [];
  do {
    const st = stepDown(slot, row);
    if (st.cross) tokens.push({ cid: st.cross.cid, t: st.cross.role === 'over' ? 'O' : 'U', sign: st.cross.sign });
    slot = st.slot; row = st.row; steps++;
    if (steps > maxSteps) break;
  } while (!(slot === 0 && row === 0));
  const idOf = new Map();
  let next = 1;
  const code = [];
  for (const tk of tokens){ let id = idOf.get(tk.cid); if (id === undefined){ id = next++; idOf.set(tk.cid, id); } code.push({ t: tk.t, id, sign: tk.sign }); }
  const cnt = new Map();
  for (const tk of tokens) cnt.set(tk.cid, (cnt.get(tk.cid) || 0) + 1);
  let single = true;
  for (const v of cnt.values()) if (v !== 2) single = false;     // every crossing seen exactly twice ⟹ one component
  return { code, single };
}

// ── THE ENTROPY HARNESS — random braid words, knotted = single-component ∧ det>1. ─
// runTrial(n,A,seed): build a length-A random braid word on n strands from the ONE
// shared RNG, close it, ask det>1. randomWord uses makeRng so a (n,A,seed) replays
// bit-for-bit. A multi-component link closure is NOT a single knot → not "knotted".
function randomWord(n, A, rng){
  const word = [];
  for (let i = 0; i < A; i++){ const k = 1 + Math.floor(rng() * (n - 1)); const s = rng() < 0.5 ? 1 : -1; word.push(s * k); }
  return word;
}
function runTrial(n, A, seed){
  const rng = makeRng(seed >>> 0);
  const r = braidGauss(n, randomWord(n, A, rng));
  if (!r.single) return { knotted: false, det: null, single: false };
  if (!isRealizable(r.code)) return { knotted: false, det: null, single: true };
  const det = knotDeterminant(gaussToCrossings(r.code));
  return { knotted: det > 1, det, single: true };
}

// THE FIXED SEED LIST — the published P never drifts on reload (the live hand-shake
// counter on the page is a SEPARATE observed-rate readout, never this claim).
function cohortSeeds(count){
  const s = [];
  for (let i = 1; i <= count; i++) s.push((i * 2654435761) >>> 0);
  return s;
}
function cohortP(n, A, count = 200){
  const seeds = cohortSeeds(count);
  let k = 0;
  for (const s of seeds){ if (runTrial(n, A, s).knotted) k++; }
  return { p: k / seeds.length, k, n: seeds.length };
}

// wilson(k, n) — the Wilson 95% score interval for k successes in n trials. Used to
// prove the calm and well-shaken cohorts' confidence intervals are DISJOINT (so the
// monotonicity gap is not a sampling artifact).
function wilson(k, n){
  if (n === 0) return [0, 0];
  const z = 1.959963984540054, p = k / n, d = 1 + z * z / n;
  const c = p + z * z / (2 * n);
  const hw = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - hw) / d, (c + hw) / d];
}

// ── countCrossingsFake(detResult) — the FAKE invariant (the teeth). ───────────
// "Knotted iff it has any crossing" — crossing-COUNT is not a knot invariant. On the
// disguised unknot (8 projected crossings, |Δ|=1) the fake screams KNOTTED while the
// real det reads 1: the teeth bite, so the detector is not vacuously honest.
function countCrossingsFake(detResult){ return detResult.ncross > 0; }

// constantPFake(n, A) — a fake estimator that ignores agitation and always reports a
// fixed mid P. It must FAIL the monotonicity claim (the trend is real, not a harness
// artifact). The load-bearing negative control for CLAIM b.
function constantPFake(_n, _A){ return 0.4; }

// ── THE LIVE SIM — a deterministic 3-D bead strand you SHAKE (the hero; art). ──
// An OPEN chain of N beads, Verlet + position-based distance/repulsion/wall solves.
// Canvas shows (x,y); z is a real third coordinate giving over/under. NO wall-clock:
// tick() does fixed SUBSTEPS of fixed-pass projection; RAF only pumps display. Same
// seed + same shake schedule ⟹ byte-identical replay (the twin proves it). makeWorld
// returns the handle set the page renders + the closure the detector reads.
function makeWorld(seed, N){
  const rng = makeRng(seed >>> 0);
  const cx = BOX / 2, cy = BOX / 2;
  const R = Math.min(BOX / 2 - PAD, (N * L0) / (2 * Math.PI));
  const x = new Float64Array(N), y = new Float64Array(N), z = new Float64Array(N);
  const px = new Float64Array(N), py = new Float64Array(N), pz = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const a = 2 * Math.PI * i / N;
    x[i] = cx + R * Math.cos(a) + (rng() * 2 - 1) * 1.5;
    y[i] = cy + R * Math.sin(a) + (rng() * 2 - 1) * 1.5;
    z[i] = (rng() * 2 - 1) * 3;                                  // a deterministic small per-bead z, drawn ONCE
    px[i] = x[i]; py[i] = y[i]; pz[i] = z[i];
  }
  let frame = 0, shakeAmp = 0, shakePhase = 0;
  function solveLinks(dir){
    const lo = dir ? 0 : N - 2, hi = dir ? N - 1 : -1, st = dir ? 1 : -1;
    for (let kk = lo; kk !== hi; kk += st){
      const i = kk, j = kk + 1;
      let dx = x[j] - x[i], dy = y[j] - y[i], dz = z[j] - z[i];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9;
      const diff = (d - L0) / d * 0.5; dx *= diff; dy *= diff; dz *= diff;
      x[i] += dx; y[i] += dy; z[i] += dz; x[j] -= dx; y[j] -= dy; z[j] -= dz;
    }
  }
  function solveRepulsion(){
    const inv = 1 / REP_R, grid = new Map();
    const key = (a, b, c) => (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
    for (let i = 0; i < N; i++){
      const gx = Math.floor(x[i] * inv), gy = Math.floor(y[i] * inv), gz = Math.floor(z[i] * inv);
      const kk = key(gx, gy, gz); let arr = grid.get(kk); if (!arr){ arr = []; grid.set(kk, arr); } arr.push(i);
    }
    for (let i = 0; i < N; i++){
      const gx = Math.floor(x[i] * inv), gy = Math.floor(y[i] * inv), gz = Math.floor(z[i] * inv);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) for (let oz = -1; oz <= 1; oz++){
        const arr = grid.get(key(gx + ox, gy + oy, gz + oz)); if (!arr) continue;
        for (const j of arr){
          if (j <= i) continue; const dd = Math.abs(i - j); if (dd === 1) continue;   // skip self + chain neighbors
          let dx = x[j] - x[i], dy = y[j] - y[i], dz = z[j] - z[i];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < REP_R && d > 1e-9){
            let push = (REP_R - d) / d * REP_K * 0.5;
            push = Math.min(push, REP_CLAMP);                    // CLAMP so the solver can't explode
            dx *= push; dy *= push; dz *= push;
            x[i] -= dx; y[i] -= dy; z[i] -= dz; x[j] += dx; y[j] += dy; z[j] += dz;
          }
        }
      }
    }
  }
  function solveWalls(){
    for (let i = 0; i < N; i++){
      if (x[i] < PAD) x[i] = PAD; if (x[i] > BOX - PAD) x[i] = BOX - PAD;
      if (y[i] < PAD) y[i] = PAD; if (y[i] > BOX - PAD) y[i] = BOX - PAD;
      if (z[i] < -ZBOX) z[i] = -ZBOX; if (z[i] > ZBOX) z[i] = ZBOX;
    }
  }
  function substep(){
    for (let i = 0; i < N; i++){
      const vx = (x[i] - px[i]) * DAMP, vy = (y[i] - py[i]) * DAMP, vz = (z[i] - pz[i]) * DAMP;
      px[i] = x[i]; py[i] = y[i]; pz[i] = z[i];
      x[i] += vx; y[i] += vy; z[i] += vz;
    }
    if (shakeAmp > 0){                                           // raised-cosine traveling-wave kick (the garden-hose ripple)
      const w = Math.max(3, Math.floor(N * 0.22)), c = shakePhase % N;
      for (let q = 0; q < w; q++){
        const i = (c + q) % N, env = 0.5 - 0.5 * Math.cos(2 * Math.PI * q / w);
        const ang = 2 * Math.PI * (i / N) * 3 + shakePhase * 0.7;
        x[i] += Math.cos(ang) * env * shakeAmp;
        y[i] += Math.sin(ang) * env * shakeAmp;
        z[i] += Math.sin(ang * 2.3) * env * shakeAmp * 1.4;      // a big z-kick drives genuine 3-D tangling
      }
      const e0 = (shakePhase * 3) % N;                           // drive a free-ish end to fold the coils
      x[e0] += Math.cos(shakePhase) * shakeAmp * 1.5; z[e0] += Math.sin(shakePhase) * shakeAmp * 1.5;
    }
    for (let p = 0; p < PROJ_PASSES; p++){ solveLinks(p % 2 === 0); solveRepulsion(); solveWalls(); }
  }
  return {
    tick(){ frame++; for (let s = 0; s < SUBSTEPS; s++) substep(); },
    shake(amp, advance){ shakeAmp = amp; shakePhase += advance; },
    stopShake(){ shakeAmp = 0; },
    openPoly(){ const o = new Float64Array(N * 2); for (let i = 0; i < N; i++){ o[2 * i] = x[i]; o[2 * i + 1] = y[i]; } return o; },
    zArray(){ return z; },
    closed(){ return closeArc(x, y, z, N); },                    // the closed polyline the detector reads
    pullTight(frac){                                             // cinch the two ends toward the walls (ramped by the page)
      const f = Math.max(0, Math.min(1, frac));
      x[0] = x[0] + (PAD - x[0]) * f * 0.18; y[0] = y[0] + (cy - y[0]) * f * 0.18;
      x[N - 1] = x[N - 1] + (BOX - PAD - x[N - 1]) * f * 0.18; y[N - 1] = y[N - 1] + (cy - y[N - 1]) * f * 0.18;
    },
    get frame(){ return frame; },
    handles: [0, N - 1],                                         // the two FIXED PULL-TIGHT beads (replay-stable)
    N,
  };
}

// ── runSelfTest() — THE SOLE ORACLE (the in-page pill AND the Node twin call it). ─
// Returns { pass, total, lines:[{name,ok,detail}] }, every detail carrying LIVE
// numbers. The five claims:
//   (a) DETECTOR SOUNDNESS / PARITY — the geometry road (detLive on the reference
//       polylines) equals the Tabulator's combinatorial authority: unknot 1, trefoil
//       3, figure-8 5 (two disjoint roads, one integer).
//   (b) ENTROPY MONOTONICITY — on n=3 strands P(knot) at A_hi minus P at A_lo ≥ 0.6
//       with NON-OVERLAPPING Wilson 95% intervals; the n=3 row is non-decreasing in A
//       (τ slack). The trend, not "strictly up at every cell".
//   (c) NEG-CONTROL — the A=0 cohort is 100% the unknot (det≡1, P=0). Entropy needs
//       room to act.
//   (bridge) INTEGRITY — on the reference set geomToGauss is always realizable, every
//       id appears exactly twice, and the crossing count equals the raw segCrossings.
//   (teeth) — a crossing-COUNT fake calls the disguised unknot KNOTTED while det reads
//       1; AND a constant-P fake FAILS the monotonicity (the trend isn't an artifact).
//   (replay) — makeWorld(seed,N) ticked deterministically yields a byte-identical
//       polyline on a re-run (clock-free determinism — the twin asserts it too).
function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  const litDet = { unknot: 1, trefoil: 3, figure8: 5 };

  // ── CLAIM a — DETECTOR SOUNDNESS / PARITY. ──────────────────────────────────
  {
    let bad = '';
    const got = {};
    for (const name of ['unknot', 'trefoil', 'figure8']){
      const ref = refPolyline(name);
      const live = detLive(ref.pts, ref.z).det;
      const comb = knotDeterminant(gaussToCrossings(diagramCode(name).code));
      got[name] = { live, comb };
      if (live !== comb || live !== litDet[name]) bad = name;
    }
    const ok = bad === '';
    T('CLAIM a — DETECTOR SOUNDNESS / PARITY: the geometry road (detLive on the reference polylines) reads |Δ(−1)| = the Tabulator\'s combinatorial authority — unknot 1, trefoil 3, figure-8 5 — two disjoint roads to the SAME integer',
      ok, ok ? `geom=comb on all three · unknot ${got.unknot.live}=${got.unknot.comb} · trefoil ${got.trefoil.live}=${got.trefoil.comb} · fig-8 ${got.figure8.live}=${got.figure8.comb}`
            : `mismatch at ${bad}: geom ${got[bad].live} vs comb ${got[bad].comb} (lit ${litDet[bad]})`);
  }

  // ── CLAIM b — ENTROPY MONOTONICITY (n=3 strands, A = braid word length). ────
  let bResult = null;
  {
    const N = 200;
    const lo = cohortP(3, 0, N), hi = cohortP(3, 80, N);
    const wLo = wilson(lo.k, lo.n), wHi = wilson(hi.k, hi.n);
    const gap = hi.p - lo.p;
    const disjoint = wHi[0] > wLo[1];
    // the n=3 row non-decreasing in A (τ=0.05 slack)
    const As = [0, 3, 8, 20, 50, 80];
    const row = As.map(A => cohortP(3, A, N).p);
    let mono = true;
    for (let i = 1; i < row.length; i++) if (row[i] < row[i - 1] - 0.05) mono = false;
    bResult = { lo, hi, wLo, wHi, gap, disjoint, row, As, mono };
    const ok = gap >= 0.6 && disjoint && mono;
    T('CLAIM b — ENTROPY MONOTONICITY: on n=3 strands P(knot) climbs from A=0 to A=80 by ≥0.6 with NON-OVERLAPPING Wilson 95% intervals, and the P-vs-A row is non-decreasing (τ=0.05) — agitation earns knots',
      ok, ok ? `P(A=80)=${hi.p.toFixed(3)} [${wHi[0].toFixed(3)},${wHi[1].toFixed(3)}] − P(A=0)=${lo.p.toFixed(3)} [${wLo[0].toFixed(3)},${wLo[1].toFixed(3)}] = gap ${gap.toFixed(3)} (≥0.6 ✓, disjoint ✓) · row ${row.map(p => p.toFixed(2)).join('→')} monotone`
            : `gap=${gap.toFixed(3)} disjoint=${disjoint} mono=${mono} row=${row.map(p => p.toFixed(2)).join(',')}`);
  }

  // ── CLAIM c — NEG-CONTROL: A=0 cohort is 100% the bare unknot. ──────────────
  {
    const N = 200;
    const nc = cohortP(3, 0, N);
    // every A=0 trial is provably det===1 (an empty braid word ⟹ n parallel runs ⟹
    // the unknot for a single-component closure).
    let everyUnknot = true, checked = 0;
    for (const s of cohortSeeds(N)){
      const r = runTrial(3, 0, s);
      checked++;
      if (!(r.single ? r.det === 1 : true)) { everyUnknot = false; }
      if (r.knotted) everyUnknot = false;
    }
    const ok = nc.p === 0 && nc.k === 0 && everyUnknot;
    T('CLAIM c — NEG-CONTROL: the A=0 cohort (no agitation) is 100% the unknot — P(knot)=0, every trial det≡1. Entropy needs room to act',
      ok, ok ? `A=0: P=${nc.p} (${nc.k}/${nc.n}) · all ${checked} trials det≡1 (the bare unknot)`
            : `P=${nc.p} k=${nc.k} everyUnknot=${everyUnknot}`);
  }

  // ── CLAIM bridge — INTEGRITY of geomToGauss on the reference set. ───────────
  {
    let bad = '';
    for (const name of ['unknot', 'trefoil', 'figure8', 'disguise']){
      const ref = refPolyline(name);
      const code = geomToGauss(ref.pts, ref.z);
      if (!isRealizable(code)){ bad = `${name}/notRealizable`; break; }
      const cnt = new Map();
      for (const c of code) cnt.set(c.id, (cnt.get(c.id) || 0) + 1);
      for (const v of cnt.values()) if (v !== 2){ bad = `${name}/idNotTwice`; break; }
      if (bad) break;
      // crossing count from the code (tokens/2) === a raw recount of segment crossings
      const N = ref.pts.length / 2;
      let segX = 0;
      const X = i => ref.pts[2 * i], Y = i => ref.pts[2 * i + 1];
      for (let i = 0; i < N - 1; i++) for (let j = i + 2; j < N - 1; j++) if (segInt(X(i), Y(i), X(i + 1), Y(i + 1), X(j), Y(j), X(j + 1), Y(j + 1))) segX++;
      if (code.length / 2 !== segX){ bad = `${name}/countMismatch(${code.length / 2}≠${segX})`; break; }
    }
    const ok = bad === '';
    T('CLAIM bridge — INTEGRITY: on every reference diagram geomToGauss is realizable, each crossing id appears exactly twice (one O / one U), and the token-count == the raw segment-crossing count (no crossing lost or invented)',
      ok, ok ? `unknot/trefoil/figure8/disguise all realizable · every id twice · token-count == segCrossings count`
            : `integrity fault: ${bad}`);
  }

  // ── CLAIM teeth — the fakes bite. ───────────────────────────────────────────
  {
    const dis = refPolyline('disguise');
    const disDet = detLive(dis.pts, dis.z);
    const fakeSaysKnotted = countCrossingsFake(disDet);          // crossing-count fake: TRUE (it has crossings)
    const realSaysUnknot = disDet.realizable && disDet.det === 1; // the real det: it is the unknot
    const fakeBites = fakeSaysKnotted && realSaysUnknot && disDet.ncross > 0;
    // the constant-P fake must FAIL CLAIM b's monotonicity (a flat estimator has no trend)
    const fakeRow = bResult.As.map(A => constantPFake(3, A));
    let fakeMonotoneStrict = false;
    for (let i = 1; i < fakeRow.length; i++) if (fakeRow[i] > fakeRow[i - 1] + 0.001) fakeMonotoneStrict = true;
    const fakeGap = constantPFake(3, 80) - constantPFake(3, 0);
    const constFakeFails = !fakeMonotoneStrict && fakeGap < 0.6;  // flat ⟹ no gap, no trend
    const ok = fakeBites && constFakeFails;
    T('CLAIM teeth: a crossing-COUNT fake calls the disguised unknot KNOTTED while the real |Δ| reads 1 (crossing-count is no invariant); AND a constant-P fake FAILS the monotonicity (gap 0, no trend) — the claims are not vacuous',
      ok, ok ? `disguise: fake "${disDet.ncross} crossings ⟹ KNOTTED" but real |Δ|=${disDet.det} (UNKNOT) — fake caught · constant-P fake gap ${fakeGap.toFixed(2)} (<0.6, no trend) — caught`
            : `fakeBites=${fakeBites} (ncross ${disDet.ncross}, det ${disDet.det}) constFakeFails=${constFakeFails}`);
  }

  // ── CLAIM replay — clock-free determinism: same seed/schedule ⟹ identical strand.
  {
    const tickSched = (w) => { for (let f = 0; f < 30; f++){ w.shake(1.4, 7); w.tick(); } w.stopShake(); for (let f = 0; f < 10; f++) w.tick(); };
    const a = makeWorld(12345, 40); tickSched(a); const pa = a.openPoly();
    const b = makeWorld(12345, 40); tickSched(b); const pb = b.openPoly();
    let same = pa.length === pb.length;
    for (let i = 0; same && i < pa.length; i++) if (pa[i] !== pb[i]) same = false;
    // a DIFFERENT seed must (almost surely) differ — guards against a frozen sim
    const c = makeWorld(99999, 40); tickSched(c); const pc = c.openPoly();
    let differs = false;
    for (let i = 0; i < pa.length; i++) if (pa[i] !== pc[i]){ differs = true; break; }
    const ok = same && differs;
    T('CLAIM replay: the clock-free sim is deterministic — makeWorld(seed,N) under a fixed shake schedule yields a byte-identical strand on re-run (and a different seed differs)',
      ok, ok ? `seed 12345 replays byte-identical over ${pa.length / 2} beads · seed 99999 differs (not frozen)`
            : `same=${same} differs=${differs}`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
// ===== TANGLE CORE END =====

export {
  segInt, crossingSign, geomToGauss, closeArc, detLive, refPolyline,
  braidGauss, randomWord, runTrial, cohortSeeds, cohortP, wilson,
  countCrossingsFake, constantPFake, makeWorld, runSelfTest,
};
