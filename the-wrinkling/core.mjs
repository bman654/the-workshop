// === CORE BEGIN ===
// The Wrinkling — differential-growth core (single source of truth).
//
// ONE closed thread that keeps growing where it has no room. A single rule produces every
// organic edge — leaf-curl, brain-fold, brain-coral, the frill of a kelp blade:
//
//     grow (insert length)  +  can't overlap (repulsion)  +  bounded room  ⇒  WRINKLE.
//
// The thread is a closed polygon of N nodes held in a struct-of-arrays. Each step:
//   1. rebuildHash   — bucket every node into a uniform grid (cellSize = R), so the O(N) force
//                      pass and the O(N) invariant check both query only nearby cells.
//   2. forces        — the differential-growth triad on every node:
//        REPULSION   over hash-neighbours within R (linear falloff), skip self + the two
//                    chain-adjacent (they are held by attraction, not pushed apart);
//        ATTRACTION  = pull toward the midpoint of the two chain neighbours (discrete Laplacian
//                    smoothing — keeps the thread taut and locally even);
//        BROWNIAN    = a tiny seeded jitter to break circular symmetry so folds actually form.
//   3. integrate     — OVER-DAMPED (no velocity): x += clamp(force·DT, MAX_STEP). MAX_STEP = a
//                      fraction of R is the explosion guard — a node can never leap far enough in
//                      one step to tunnel a non-adjacent segment, which is what keeps the polygon
//                      simple. clamp/obstacle-project after.
//   4. insertion     — split any edge longer than SPLIT_LEN by inserting a midpoint, until N==cap.
//                      After cap, STOP inserting but keep relaxing forever (it breathes, never
//                      freezes, never janks).
//
// THE DIAL CONTRACT. The engine's truth is the split length, set by ONE field on params:
//     SPLIT_LEN = lerp(2.4·R, 1.1·R, crowding),  crowding ∈ [0,1].
// Lower SPLIT_LEN ⇒ denser spacing ⇒ more length packed into the same fixed room ⇒ tighter folds.
// The engine never sees the slider's exponential drama curve — that lives in the controls layer;
// the engine speaks only `crowding`. crowding is clamped to maxCrowding (the invariant-safe ceiling).
//
// THE OBSTACLE. Each obstacle is a soft circular repeller folded into the SAME per-node relax pass
// as just another radial-out force term (params.obstacles + params.obK), so a sheet draping past a
// dropped stone emerges for free. obK is clamped to an invariant-safe bound.
//
// THE INVARIANT (the one honest self-test — this is generative art, it makes no math claim, so
// there is no proof pill; there is a live conscience). A simple closed polygon STAYS SIMPLE: no two
// non-adjacent segments ever cross. isSimple/firstIntersection bucket EDGES into the same uniform
// hash and test only segment pairs sharing a nearby cell. This is SOUND, not a heuristic: R bounds
// the fold curvature per step and node spacing ≈ R, so any crossing pair lies within a few cells of
// each other — a 5×5 neighbourhood is a safe envelope. The Node twin re-checks it against a brute
// O(N²) reference and a deliberately self-crossing control, so the acceleration has no blind spots.
//
// This module is inlined BYTE-IDENTICAL into index.html between the CORE BEGIN / CORE END sentinels
// (the sandpile / elementary-garden / cutting-gears idiom) and tested by core.test.mjs — the watched
// sim IS the tested sim, they can never drift.

// Deterministic PRNG (mulberry32) so a seed reproduces the same organism and the same jitter.
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Defaults are RATIOS to R (resolution-independent). The renderer picks an actual R from canvas
// size; everything else scales off it, so the look is identical at 600px or 1400px.
const DEFAULTS = {
  R: 9,              // interaction radius (px @ ~900px stage); the hash cell size; the spacing target
  K_REP: 0.62,       // repulsion gain — must out-push the spring so the curve inflates & grows
  K_ATTR: 0.34,      // edge rest-length spring gain (holds spacing; does NOT collapse the loop)
  K_LAP: 0.06,       // a light Laplacian smoothing on top of the spring (softens kinks)
  REST_FRAC: 0.55,   // rest spacing as a fraction of SPLIT_LEN (edges sit below the split threshold)
  K_JIT: 0.012,      // brownian jitter gain (× R)
  DT: 1.0,           // integration step
  MAX_STEP_FRAC: 0.35, // per-step displacement clamp as a fraction of R (the explosion guard)
  cap: 4000,         // hard node ceiling (renderer may down-tune on slow devices)
  startRadius: 60,   // seed ring radius (px)
  seedNodes: 120,    // seed ring node count
  // crowding maps to SPLIT_LEN ∈ [SPLIT_HI·R, SPLIT_LO·R]; the invariant-safe crowding ceiling
  SPLIT_HI: 2.4,     // SPLIT_LEN at crowding=0 (slack near-circle)
  SPLIT_LO: 1.1,     // SPLIT_LEN at crowding=1 (jammed brain-coral)
  GROWTH_LO: 0.004,  // growth pressure (new nodes per node per step) at crowding=0 (slack)
  GROWTH_HI: 0.030,  // growth pressure at crowding=1 (fast growth ⇒ tight folds in the fixed room)
  GROWTH_MAX: 6,     // hard cap on new nodes per step (steady, never explosive — relaxation keeps pace)
  GROWTH_DENS_CEIL: 8, // a node is inserted only where local density ≤ this (room to grow; no overlap)
  maxCrowding: 1.0,  // controls clamp crowding to this (1.1·R spacing stays simple under the guard)
  obKmax: 0.9,       // invariant-safe ceiling on obstacle gain
  obRdefault: 28,    // default obstacle radius (px)
};

// makeState(opts) → a fresh closed loop seeded as a ring. Struct-of-arrays: px/py are the live
// positions; age is per-node birth-glow (seconds since insertion, for colour-by-age in the skin);
// n is the live count, cap the ceiling. `simple` is the live invariant flag (the conscience).
function makeState(opts){
  const o = Object.assign({}, DEFAULTS, opts || {});
  const cap = o.cap | 0;
  const cx = o.cx, cy = o.cy;               // ring centre (px) — renderer supplies the stage centre
  const rad = o.startRadius;
  const m = o.seedNodes | 0;
  const st = {
    n: 0, cap,
    px: new Float32Array(cap),
    py: new Float32Array(cap),
    age: new Float32Array(cap),             // seconds since this node was inserted (birth glow)
    R: o.R,
    simple: true,                           // the live invariant flag
    capped: false,
  };
  for (let i = 0; i < m && i < cap; i++){
    const a = (i / m) * Math.PI * 2;
    st.px[st.n] = cx + Math.cos(a) * rad;
    st.py[st.n] = cy + Math.sin(a) * rad;
    st.age[st.n] = 99;                       // seed nodes start fully "aged" (no birth glow)
    st.n++;
  }
  return st;
}

// hashCell(R) → the recommended uniform-hash cell size: the LARGEST possible node spacing
// (SPLIT_HI·R, the slack-circle split length). Sizing the cell to the max spacing means a 3×3 query
// always catches every repulsion neighbour and a 5×5 query every potentially-crossing edge — so the
// spatial acceleration is SOUND across the whole crowding range, not a per-frame-tuned heuristic.
function hashCell(R){ return DEFAULTS.SPLIT_HI * R; }

// makeHash(cellSize) → a uniform spatial hash. cellSize should be hashCell(R) — it then serves all
// three roles: repulsion query, insertion locality, and the invariant edge-bucketing. Open hashing
// into Maps keyed by a mixed (cx,cy) integer hash.
function makeHash(cellSize){
  return { cell: cellSize, map: new Map() };
}
function _key(cx, cy){ return cx * 73856093 ^ cy * 19349663; }

// rebuildHash(H, st) → bucket every live NODE index by its cell. Cleared and refilled each step.
function rebuildHash(H, st){
  H.map.clear();
  const inv = 1 / H.cell;
  for (let i = 0; i < st.n; i++){
    const cx = Math.floor(st.px[i] * inv);
    const cy = Math.floor(st.py[i] * inv);
    const k = _key(cx, cy);
    let b = H.map.get(k);
    if (!b){ b = []; H.map.set(k, b); }
    b.push(i);
  }
}

// _splitLen(R, crowding) → the engine's truth: how long an edge may get before it must split.
function _splitLen(R, crowding){
  const c = crowding < 0 ? 0 : (crowding > 1 ? 1 : crowding);
  return (DEFAULTS.SPLIT_HI + (DEFAULTS.SPLIT_LO - DEFAULTS.SPLIT_HI) * c) * R;
}

// step(state, H, params, rng) → mutate the loop one frame IN PLACE; returns nothing (read state +
// geometry()/stats afterwards). params carries:
//   { crowding, jitter, paused, obstacles:[{x,y,r}], obK, dt (sim seconds for age), projectOut? }
// projectOut(x,y) is an optional per-node hook (e.g. clamp into the stage rect); obstacles drape
// via the same relax pass. The function:
//   rebuildHash → per-node forces+integrate (over-damped, clamped) → obstacle/clamp project →
//   insertion → set state.simple via isSimple.
function step(state, H, params, rng){
  const p = params || {};
  if (p.paused) return;
  const R = state.R;
  const krep = DEFAULTS.K_REP, kattr = DEFAULTS.K_ATTR, klap = DEFAULTS.K_LAP;
  const kjit = (p.jitter == null ? DEFAULTS.K_JIT : p.jitter) * R;
  const dt = DEFAULTS.DT;
  const maxStep = DEFAULTS.MAX_STEP_FRAC * R;
  const n = state.n;
  const px = state.px, py = state.py;
  const obs = p.obstacles || [];
  const obK = Math.min(DEFAULTS.obKmax, p.obK == null ? 0 : p.obK);
  // the spring rest length: spacing target sits a comfortable fraction below SPLIT_LEN so that
  // repulsion has to STRETCH an edge past SPLIT_LEN to trigger a split (growth). Tied to crowding
  // through the same SPLIT_LEN contract, so a tighter dial means denser resting spacing.
  const splitLenForRest = _splitLen(R, p.crowding == null ? 0.5 : p.crowding);
  const restLen = splitLenForRest * DEFAULTS.REST_FRAC;
  // the repulsion radius = the spacing target (max edge length). Two strands closer than one edge
  // length will repel before they can cross. The hash cell must be ≥ this (so a 3×3 query is sound);
  // makeHash is sized to SPLIT_HI·R (the largest possible spacing) by the recommended hashCell().
  const Rrep = splitLenForRest;

  rebuildHash(H, state);
  const inv = 1 / H.cell;

  // accumulate forces into scratch arrays, then integrate (so the pass reads a consistent frame)
  const fx = step._fx && step._fx.length >= n ? step._fx : (step._fx = new Float32Array(state.cap));
  const fy = step._fy && step._fy.length >= n ? step._fy : (step._fy = new Float32Array(state.cap));

  for (let i = 0; i < n; i++){
    let ax = 0, ay = 0;
    const xi = px[i], yi = py[i];
    const prev = (i - 1 + n) % n, next = (i + 1) % n;

    // --- REPULSION over hash-neighbours within Rrep (skip self + the two chain-adjacent) ---
    // Rrep is the spacing target, NOT the fixed R: at low crowding the nodes sit further apart, and
    // a fixed-R repulsion would let two folded strands pass within the gap WITHOUT feeling each other
    // (the loop self-crosses). Tying the repulsion radius to the spacing guarantees adjacent strands
    // always repel BEFORE they can cross — this, with the MAX_STEP guard, is what keeps it simple.
    const ci = Math.floor(xi * inv), cj = Math.floor(yi * inv);
    for (let dx = -1; dx <= 1; dx++){
      for (let dy = -1; dy <= 1; dy++){
        const b = H.map.get(_key(ci + dx, cj + dy));
        if (!b) continue;
        for (let q = 0; q < b.length; q++){
          const j = b[q];
          if (j === i || j === prev || j === next) continue;
          const rx = xi - px[j], ry = yi - py[j];
          const d2 = rx * rx + ry * ry;
          if (d2 >= Rrep * Rrep || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const w = (Rrep - d) / Rrep;       // linear falloff [0,1]
          const s = krep * w / d;
          ax += rx * s; ay += ry * s;
        }
      }
    }

    // --- ATTRACTION: a rest-length spring along EACH of the two chain edges, plus a light
    //     Laplacian smoothing term. The spring holds spacing near restLen WITHOUT collapsing the
    //     loop (a pure midpoint-Laplacian is curve-shortening flow and would just shrink the curve
    //     to a point) — an edge SHORTER than restLen pushes its endpoints apart; LONGER pulls them
    //     together. Repulsion then inflates the curve, stretching edges past SPLIT_LEN ⇒ insertion
    //     ⇒ more length in the same fixed room ⇒ folds. This is the differential-growth engine. ---
    {
      // edge to prev
      let ex = px[prev] - xi, ey = py[prev] - yi;
      let ed = Math.sqrt(ex * ex + ey * ey) || 1e-6;
      let sp = (ed - restLen) / ed * kattr;     // >0 pull toward neighbour, <0 push away
      ax += ex * sp; ay += ey * sp;
      // edge to next
      ex = px[next] - xi; ey = py[next] - yi;
      ed = Math.sqrt(ex * ex + ey * ey) || 1e-6;
      sp = (ed - restLen) / ed * kattr;
      ax += ex * sp; ay += ey * sp;
      // a gentle Laplacian smoothing on top (evens the spacing, softens kinks) — small gain
      const mx = (px[prev] + px[next]) * 0.5, my = (py[prev] + py[next]) * 0.5;
      ax += (mx - xi) * klap;
      ay += (my - yi) * klap;
    }

    // --- BROWNIAN jitter (seeded) to break circular symmetry ---
    ax += (rng() - 0.5) * kjit;
    ay += (rng() - 0.5) * kjit;

    // --- OBSTACLE repellers folded into the same relax pass ---
    for (let o = 0; o < obs.length; o++){
      const ob = obs[o];
      const rx = xi - ob.x, ry = yi - ob.y;
      const d = Math.sqrt(rx * rx + ry * ry);
      const rr = ob.r;
      if (d < rr && d > 1e-6){
        const t = (1 - d / rr);
        const s = obK * t * t / d;          // (1-d/r)^2 radial-out, normalized by distance
        ax += rx * s * R; ay += ry * s * R;
      }
    }

    fx[i] = ax; fy[i] = ay;
  }

  // --- OVER-DAMPED integration with the per-step MAX_STEP clamp (the explosion guard) ---
  for (let i = 0; i < n; i++){
    let dx = fx[i] * dt, dy = fy[i] * dt;
    const m = Math.sqrt(dx * dx + dy * dy);
    if (m > maxStep){ const s = maxStep / m; dx *= s; dy *= s; }
    let nx = px[i] + dx, ny = py[i] + dy;
    if (p.projectOut){ const pr = p.projectOut(nx, ny); nx = pr[0]; ny = pr[1]; }
    px[i] = nx; py[i] = ny;
    state.age[i] += (p.dt == null ? 1 / 60 : p.dt);
  }

  // --- INSERTION (the growth driver). Two mechanisms, both stop at cap, both keep relaxing after:
  //   (1) the GEOMETRIC GUARD — split any edge longer than SPLIT_LEN, so no gap ever opens (the
  //       contract). On its own this is SELF-LIMITING: once repulsion balances the spring the loop
  //       reaches a static equilibrium and never folds.
  //   (2) the GROWTH PRESSURE — inject a small budget of NEW length every step by splitting edges
  //       chosen with a curvature-aware preference (favour the long, gently-curved stretches; spare
  //       the already-tight ridges). This is the actual differential-growth driver: the injected
  //       length has nowhere to go in the FIXED room but to buckle, so the curve WRINKLES. The
  //       budget per step scales with crowding (the dial) — a denser dial grows faster ⇒ tighter
  //       folds. It is the growth pressure outrunning the room, made literal.
  const splitLen = _splitLen(R, p.crowding == null ? 0.5 : p.crowding);
  const splitLen2 = splitLen * splitLen;
  if (state.n < state.cap){
    // (1) geometric guard: split every over-long edge
    let i = 0;
    while (i < state.n && state.n < state.cap){
      const j = (i + 1) % state.n;
      const ex = px[j] - px[i], ey = py[j] - py[i];
      if (ex * ex + ey * ey > splitLen2){
        _insertAfter(state, i);
        i += 2;                              // skip the freshly-inserted node
      } else {
        i++;
      }
    }
    // (2) growth pressure: a small budget of length-weighted, DENSITY-GATED splits. Two safety rules
    //     keep the invariant intact while still folding the curve:
    //       • the per-step budget is proportional to n but HARD-CAPPED (GROWTH_MAX), so growth is
    //         steady, never explosive — relaxation always keeps pace with insertion (no transient
    //         self-crossing during a growth burst);
    //       • a node is inserted on an edge ONLY if the edge's midpoint has ROOM (local hash density
    //         below a ceiling). Where the curve is already packed, no length is injected — so growth
    //         can never shove two strands through each other. This density gate is the invariant's
    //         partner: the curve grows where it CAN, buckles where it MUST, and never overlaps.
    //     growthRate (and thus the fold tightness) scales with the crowding dial.
    const cr = p.crowding == null ? 0.5 : p.crowding;
    const growthRate = DEFAULTS.GROWTH_LO + (DEFAULTS.GROWTH_HI - DEFAULTS.GROWTH_LO) * cr;
    let budget = Math.min(DEFAULTS.GROWTH_MAX, state.n * growthRate);
    const densCeil = DEFAULTS.GROWTH_DENS_CEIL;
    while (budget > 0 && state.n < state.cap){
      const take = budget >= 1 ? 1 : (rng() < budget ? 1 : 0);
      budget -= 1;
      if (!take) break;
      // pick the longest of a few sampled edges whose MIDPOINT still has room to grow.
      let chosen = -1, bestLen = -1;
      for (let t = 0; t < 6; t++){
        const e = (rng() * state.n) | 0;
        const j = (e + 1) % state.n;
        const ex = px[j] - px[e], ey = py[j] - py[e];
        const el2 = ex * ex + ey * ey;
        if (el2 <= bestLen) continue;
        // density at the edge midpoint via the hash (room to grow?)
        const mx = (px[e] + px[j]) * 0.5, my = (py[e] + py[j]) * 0.5;
        const mi = Math.floor(mx * inv), mj = Math.floor(my * inv);
        let cnt = 0;
        for (let dx = -1; dx <= 1 && cnt <= densCeil; dx++){
          for (let dy = -1; dy <= 1 && cnt <= densCeil; dy++){
            const b = H.map.get(_key(mi + dx, mj + dy));
            if (!b) continue;
            for (let q = 0; q < b.length; q++){
              const jj = b[q];
              const rx = mx - px[jj], ry = my - py[jj];
              if (rx * rx + ry * ry < Rrep * Rrep){ cnt++; if (cnt > densCeil) break; }
            }
          }
        }
        if (cnt <= densCeil){ bestLen = el2; chosen = e; }
      }
      if (chosen >= 0) _insertAfter(state, chosen);
    }
  }
  state.capped = state.n >= state.cap;

  // --- the live conscience: is the polygon still simple? ---
  state.simple = isSimple(state, H);
}

// _insertAfter(st, i) → insert a new node at the midpoint of edge (i, i+1), shifting the tail.
// Struct-of-arrays insert: O(n) shift, but insertions are rare per step so amortized cheap.
function _insertAfter(st, i){
  if (st.n >= st.cap) return;
  const j = (i + 1) % st.n;
  const mx = (st.px[i] + st.px[j]) * 0.5;
  const my = (st.py[i] + st.py[j]) * 0.5;
  // shift everything after i one slot right
  for (let k = st.n; k > i + 1; k--){
    st.px[k] = st.px[k - 1];
    st.py[k] = st.py[k - 1];
    st.age[k] = st.age[k - 1];
  }
  st.px[i + 1] = mx; st.py[i + 1] = my; st.age[i + 1] = 0;  // newborn: age 0 ⇒ glows
  st.n++;
}

// ── THE INVARIANT (simple closed polygon stays simple) ────────────────────────────────────────
// segInt(a,b,c,d) → do segments AB and CD properly cross? Orientation/straddle test, no division.
function _orient(ax, ay, bx, by, cx, cy){
  return (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
}
function segInt(ax, ay, bx, by, cx, cy, dx, dy){
  const o1 = _orient(ax, ay, bx, by, cx, cy);
  const o2 = _orient(ax, ay, bx, by, dx, dy);
  const o3 = _orient(cx, cy, dx, dy, ax, ay);
  const o4 = _orient(cx, cy, dx, dy, bx, by);
  // proper crossing: each segment straddles the other's line
  if (((o1 > 0) !== (o2 > 0)) && ((o3 > 0) !== (o4 > 0))) return true;
  return false;
}

// firstIntersection(state, H) → the first crossing non-adjacent edge pair {a,b} found, or null.
// Buckets EDGES (by the cell of their midpoint, with a 5×5 neighbourhood) into a hash so only nearby
// pairs are tested — sound because R bounds the per-step fold and spacing ≈ R. Falls back to building
// its own edge hash when H is absent (the Node twin can call it standalone).
function firstIntersection(state, H){
  const n = state.n;
  if (n < 4) return null;
  const px = state.px, py = state.py;
  const cell = (H && H.cell) || state.R;
  const inv = 1 / cell;
  // bucket edges by midpoint cell
  const emap = new Map();
  for (let i = 0; i < n; i++){
    const j = (i + 1) % n;
    const mx = (px[i] + px[j]) * 0.5, my = (py[i] + py[j]) * 0.5;
    const k = _key(Math.floor(mx * inv), Math.floor(my * inv));
    let b = emap.get(k);
    if (!b){ b = []; emap.set(k, b); }
    b.push(i);                                // edge i goes from node i to node i+1
  }
  // for each edge, test against edges in its 5×5 cell neighbourhood
  for (let i = 0; i < n; i++){
    const j = (i + 1) % n;
    const ax = px[i], ay = py[i], bx = px[j], by = py[j];
    const cmx = (ax + bx) * 0.5, cmy = (ay + by) * 0.5;
    const ci = Math.floor(cmx * inv), cj = Math.floor(cmy * inv);
    for (let dx = -2; dx <= 2; dx++){
      for (let dy = -2; dy <= 2; dy++){
        const b = emap.get(_key(ci + dx, cj + dy));
        if (!b) continue;
        for (let q = 0; q < b.length; q++){
          const e = b[q];
          if (e <= i) continue;              // unordered pairs once
          // skip adjacent edges (they legitimately share an endpoint)
          if (e === j) continue;
          if ((e + 1) % n === i) continue;
          const ex = px[e], ey = py[e];
          const f = (e + 1) % n;
          const fx2 = px[f], fy2 = py[f];
          if (segInt(ax, ay, bx, by, ex, ey, fx2, fy2)) return { a: i, b: e };
        }
      }
    }
  }
  return null;
}

// isSimple(state, H) → true iff no two non-adjacent edges cross.
function isSimple(state, H){
  return firstIntersection(state, H) === null;
}

// arcLength(state) → total perimeter of the closed loop (the quantity that outruns the room).
function arcLength(state){
  const n = state.n, px = state.px, py = state.py;
  let L = 0;
  for (let i = 0; i < n; i++){
    const j = (i + 1) % n;
    const dx = px[j] - px[i], dy = py[j] - py[i];
    L += Math.sqrt(dx * dx + dy * dy);
  }
  return L;
}

// geometry(state, H) → an ordered array of { x, y, kappa, density } per live node PLUS it leaves the
// per-node arrays the renderer needs. kappa = signed turning angle at the vertex (high |kappa| = a
// ridge → the skin lights it); density = normalized count of hash-neighbours within R (crowded zones
// look engorged). Computed in ONE cheap pass reusing the hash, so the renderer never recomputes.
function geometry(state, H){
  const n = state.n, px = state.px, py = state.py;
  const out = new Array(n);
  const R = state.R;
  const haveHash = H && H.map && H.map.size;
  const inv = haveHash ? 1 / H.cell : 0;
  // a comfortable normalizer: how many neighbours a dense ring (~spacing R) packs in radius R
  const DENS_NORM = 6;
  for (let i = 0; i < n; i++){
    const prev = (i - 1 + n) % n, next = (i + 1) % n;
    // kappa: signed turn from edge (prev→i) to edge (i→next)
    const ux = px[i] - px[prev], uy = py[i] - py[prev];
    const vx = px[next] - px[i], vy = py[next] - py[i];
    const cross = ux * vy - uy * vx;
    const dot = ux * vx + uy * vy;
    const kappa = Math.atan2(cross, dot);     // signed ∈ (−π, π]
    // density: neighbours within R via the hash (fallback: brute over a window)
    let cnt = 0;
    if (haveHash){
      const ci = Math.floor(px[i] * inv), cj = Math.floor(py[i] * inv);
      for (let dx = -1; dx <= 1; dx++){
        for (let dy = -1; dy <= 1; dy++){
          const b = H.map.get(_key(ci + dx, cj + dy));
          if (!b) continue;
          for (let q = 0; q < b.length; q++){
            const jj = b[q];
            if (jj === i) continue;
            const rx = px[i] - px[jj], ry = py[i] - py[jj];
            if (rx * rx + ry * ry < R * R) cnt++;
          }
        }
      }
    }
    const density = cnt / DENS_NORM;
    out[i] = { x: px[i], y: py[i], kappa, density, age: state.age[i] };
  }
  return out;
}

// stats(state, room) → the quiet readout's numbers. `room` is { perimeter } — the FIXED bounding-box
// perimeter of the stage the curve outgrows (supplied by the renderer; constant). Reports arcLength,
// that fixed perimeter, the ratio, node count/cap, capped flag, and the live simple flag.
function stats(state, room){
  const L = arcLength(state);
  const perim = (room && room.perimeter) || 0;
  return {
    arcLength: L,
    perimeter: perim,
    ratio: perim ? L / perim : 0,
    nodeCount: state.n,
    nodeCap: state.cap,
    capped: state.capped,
    simple: state.simple,
  };
}

// maxCrowding() → the invariant-safe crowding ceiling the controls clamp to.
function maxCrowding(){ return DEFAULTS.maxCrowding; }
// === CORE END ===

export {
  mulberry32, makeState, makeHash, hashCell, rebuildHash, step,
  isSimple, firstIntersection, segInt,
  geometry, arcLength, stats, maxCrowding,
  _splitLen, _insertAfter, _orient,
  DEFAULTS,
};
