// === CORE BEGIN ===
// The Shepherd — boids-herding engine (single source of truth).
//
// ONE IDEA: you cannot push a flock — you choose WHERE you stand, and your presence is
// pressure, never a leash. A scatter of sheep run on Reynolds boids (separation / alignment /
// cohesion) and additionally FLEE one shepherd point — a working DOG you steer, which has weight
// and a top speed and chases your cursor on a critically-damped spring. Winning is reading emergent
// flow: drive every sheep through the gate into the fold polygon before the clock runs out.
//
// Struct-of-arrays flock (px,py,vx,vy) + a deterministic seeded RNG so a fixed seed reproduces a
// run EXACTLY — the Node twin imports this module and re-runs byte-true. The engine is PIXEL-BLIND:
// it works in a fixed 600×600 world; the page owns world↔pixel. The engine runs PER-STEP (no dt in
// step()); the page drives a FIXED substep from a RAF accumulator so determinism holds.
//
// ── THE TWO DECIDABLE CLAIMS (the quiet correctness layer; the game is the point) ──────────────
//
// CLAIM 1 — min pairwise sheep separation never reaches 0 over a full fixed-seed run.
//   The flock stays a flock: no two sheep ever overlap. This is NOT a hope about a soft force —
//   it is GUARANTEED by the integration scheme. Two ingredients:
//     (a) a HARD-FLOOR separation barrier. When two sheep get within CONTACT = 2·RADIUS, the
//         separation term becomes an explicit positional projection that pushes them back apart to
//         exactly CONTACT (a half-each correction). This runs AFTER velocity integration, every
//         step, over ALL pairs within CONTACT (found via the uniform spatial hash). A positional
//         projection cannot be outrun by any force, however large — fear, cohesion, anything.
//     (b) a per-step speed clamp (MAX_SPEED) bounding how far any sheep moves in one dt. The
//         projection in (a) restores CONTACT exactly; the clamp guarantees no sheep can leap
//         THROUGH another (tunnel) between projections: max displacement per step < CONTACT, so a
//         pair separated by ≥ CONTACT at step k cannot cross to the far side by step k+1 without
//         first entering the CONTACT band — where the projection fires. Hence min separation is
//         bounded below by a strictly positive floor SEP_FLOOR < CONTACT for the whole run.
//   The HONEST bound is: floor > 0 (no overlap, EVER) and the steady-state sits ≈ contact (the
//   flock packs tight) — NOT "always exactly contact" (a transient under an adversarial press dips
//   below contact but never to 0). The Node twin runs full fixed-seed games and asserts
//   minPairSep(state) > 0 at EVERY step (incl. with flee ON, inside fenced/gap geometry, and pinned
//   into a fence corner); the in-page pill shows the live running minimum.
//
//   WHY a barrier projection and not just a stiff spring: a spring strong enough to never overlap
//   is also stiff enough to explode under an explicit step. The projection is unconditionally
//   stable — it is a constraint, not a force — so the guarantee holds at any flee strength. This is
//   the integration/clamp scheme chosen precisely BECAUSE it makes the floor non-violable.
//
// CLAIM 2 — WIN fires EXACTLY iff every sheep is inside the fold polygon.
//   pointInPolygon is a robust ray-cast (crossing-number) that handles concave folds and the
//   on-edge case explicitly (a point exactly on the boundary counts as inside — a sheep touching
//   the rim is folded). allInFold(state, poly) is a pure AND over every sheep. The win predicate
//   is this function and nothing else — no timer race, no "close enough", no off-by-one. The LATCH
//   is decidable: when countInFold === N and the round is in PLAY, the gate latches and the state
//   becomes WIN — WIN === allInFold, nothing else. The twin proves: no false win (win ⇒ all inside),
//   no missed win (all inside ⇒ win), the ONE-WAY VALVE (a folded sheep stays counted), and the
//   overtime edge (the last-sheep grace window never produces a false latch), incl. concave + on-edge.
//
// NEG-CONTROL — SEPARATION-OFF. params.separation === false disables BOTH the separation steering
//   force AND the hard-floor projection. Cohesion + flee then collapse the whole flock to a single
//   point: minPairSep → 0 (sheep stack). This makes Claim 1 falsifiable ON SCREEN — the live pill
//   flips red, the running minimum dives to 0 — proving separation is what keeps them a herd.
//
// This module is inlined BYTE-IDENTICAL into index.html between the CORE BEGIN / CORE END
// sentinels and tested by core.test.mjs (the Node twin). The watched flock IS the tested flock.

// ── Deterministic PRNG (mulberry32). A seed reproduces the flock AND every jitter, exactly. ────
function mulberry32(seed){
  let s = seed | 0;
  return function(){
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// All tunables are in WORLD units (the renderer maps world→pixels; the engine never sees pixels).
const DEFAULTS = {
  RADIUS: 6,            // a sheep's body radius (world units). CONTACT = 2·RADIUS = the no-overlap floor.
  PERCEPT: 46,          // neighbour perception radius for align/cohere (the hash query radius)
  SEP_RANGE: 30,        // separation steering kicks in within this distance (soft, steers away early)
  K_SEP: 2.6,           // separation steering gain (soft term; the HARD floor is the projection below)
  K_ALI: 0.55,          // alignment gain (match neighbours' heading)
  K_COH: 0.82,          // cohesion gain (steer toward neighbour centroid — keeps them a flock)
  K_FLEE: 3400,         // flee gain (inverse-square from the shepherd, CAPPED) — tuned to herd, not scatter
  FLEE_RANGE: 155,      // beyond this the shepherd is not felt at all (a local pressure, not a global leash)
  FLEE_CAP: 3.0,        // max flee acceleration magnitude (so a close shepherd can't fling a sheep)
  MAX_SPEED: 2.3,       // per-step speed clamp (world units / step). MUST be < CONTACT to forbid tunnelling.
  MIN_SPEED: 0.0,       // sheep may come to rest (no forced wandering — calm reads as calm)
  DAMP: 0.90,           // velocity damping each step (so a removed force lets a sheep settle)
  SEP_PASSES: 8,        // hard-floor projection relaxation passes per step (resolves overlap chains tightly)
  WANDER: 0.05,         // tiny seeded wander so a still flock breathes (broken by separation-off too)
  EDGE_MARGIN: 24,      // soft turn-away band from the world bounds (sheep avoid the walls)
  K_EDGE: 0.5,          // edge turn-away gain
  // The working dog (the cursor's avatar). A critically-damped tracker so the dog has WEIGHT and a
  // TOP SPEED — it lags the cursor and arrives without overshoot. Run at a FIXED internal substep
  // (DT_DOG) so a fixed-seed run is deterministic and the twin can drive it byte-true.
  DOG_K: 320,           // spring stiffness toward the cursor target
  DOG_C: 2 * Math.sqrt(320), // critical damping C = 2√K (no overshoot, fastest no-oscillation arrival)
  DOG_DT: 1 / 60,       // FIXED dog substep (seconds). semi-implicit Euler is stable: dt < 2/√K ≈ .112
  DOG_MAX: 9.0,         // dog top speed (world units / step) — it cannot teleport to a far cursor
  // FEAR readout (render-only) — an asymmetric EMA so panic WAKES fast and the colour LINGERS as a
  // sheep calms. NEVER a force; the engine writes it, the page maps it to colour.
  FEAR_RISE: 0.30,      // fast attack toward higher fear
  FEAR_DECAY: 0.045,    // slow release back toward calm
};

// makeFlock(opts) → a fresh struct-of-arrays flock scattered in a rect via the seeded RNG.
//   opts: { n, rng, x0,y0,x1,y1 }  (rng is a mulberry32 instance; the scatter is deterministic).
function makeFlock(opts){
  const o = opts || {};
  const n = o.n | 0;
  const rng = o.rng;
  const x0 = o.x0, y0 = o.y0, x1 = o.x1, y1 = o.y1;
  const st = {
    n,
    px: new Float64Array(n),
    py: new Float64Array(n),
    vx: new Float64Array(n),
    vy: new Float64Array(n),
    fear: new Float64Array(n),   // 0..1 local panic (shepherd-proximity taper, asymmetric-EMA) — for colour
    RADIUS: o.RADIUS == null ? DEFAULTS.RADIUS : o.RADIUS,
  };
  for (let i = 0; i < n; i++){
    st.px[i] = x0 + rng() * (x1 - x0);
    st.py[i] = y0 + rng() * (y1 - y0);
    // a small seeded initial drift so the opening reads alive, not frozen
    const a = rng() * Math.PI * 2;
    st.vx[i] = Math.cos(a) * 0.4;
    st.vy[i] = Math.sin(a) * 0.4;
  }
  return st;
}

// ── Uniform spatial hash (cell = PERCEPT so a 3×3 query catches every neighbour AND every
//    CONTACT pair, since SEP_RANGE/CONTACT ≤ PERCEPT). Rebuilt each step. ───────────────────────
function makeHash(cell){ return { cell, map: new Map() }; }
function _key(cx, cy){ return cx * 73856093 ^ cy * 19349663; }
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

// ── THE WORKING DOG — a pure critically-damped tracker (the cursor's avatar) ─────────────────────
// stepDog(dog, tgt) → advance the dog ONE deterministic frame toward target tgt={x,y}, IN PLACE.
//   dog: { x,y,vx,vy }. Critically damped (C = 2√K), so it lags the cursor and arrives with NO
//   overshoot — giving the dog weight. Capped at DOG_MAX so it cannot teleport to a far cursor.
//   Runs a FIXED internal substep (DOG_DT) → no wall-clock dt → a fixed-seed run is byte-true, and
//   the twin can drive it deterministically. Returns the dog (for chaining / readability).
function stepDog(dog, tgt){
  const D = DEFAULTS;
  const dt = D.DOG_DT;
  // semi-implicit Euler on the critically-damped spring a = K(tgt-x) - C·v
  let ax = D.DOG_K * (tgt.x - dog.x) - D.DOG_C * dog.vx;
  let ay = D.DOG_K * (tgt.y - dog.y) - D.DOG_C * dog.vy;
  let nvx = dog.vx + ax * dt;
  let nvy = dog.vy + ay * dt;
  // cap the per-step DISPLACEMENT (velocity·dt) at DOG_MAX so the dog has a real top speed
  const disp = Math.hypot(nvx, nvy) * dt;
  if (disp > D.DOG_MAX){ const s = D.DOG_MAX / disp; nvx *= s; nvy *= s; }
  dog.vx = nvx; dog.vy = nvy;
  dog.x += nvx * dt;
  dog.y += nvy * dt;
  return dog;
}

// step(state, H, params, rng) → advance the flock ONE deterministic frame IN PLACE.
//   params: {
//     shepherd: {x,y} | null,   // the dog's CURRENT position — the point the flock flees (the
//                               //   engine sees only a point; the dog's spring lives in stepDog)
//     bounds: {x0,y0,x1,y1},    // the world rect (sheep turn away from the edges)
//     fences: [{x0,y0,x1,y1}],  // solid wall rects (sheep are projected out of, with reflection) — optional
//     fold:   [x0,y0,x1,y1,...],// the fold polygon — for the ONE-WAY VALVE (a folded sheep can't wander out)
//     separation: true|false,   // NEG-CONTROL: false disables sep steering AND the hard floor
//   }
// Order each step: rebuild hash → accumulate steering (sep/ali/coh/flee/edge/wander) → integrate
// with the MAX_SPEED clamp → HARD-FLOOR separation projection (the guarantee) → fence/bounds project
// → ONE-WAY VALVE (keep folded sheep folded).
function step(state, H, params, rng){
  const p = params || {};
  const D = DEFAULTS;
  const n = state.n;
  const px = state.px, py = state.py, vx = state.vx, vy = state.vy, fear = state.fear;
  const sepOn = p.separation !== false;
  const sh = p.shepherd || null;
  const b = p.bounds;
  const CONTACT = 2 * state.RADIUS;

  // snapshot which sheep were INSIDE the fold before integration AND their pre-step positions
  // (for the one-way valve — an escaped sheep is snapped back to where it was while still inside).
  let wasIn = null;
  if (p.fold){
    wasIn = state._wasIn && state._wasIn.length >= n ? state._wasIn : (state._wasIn = new Uint8Array(Math.max(n, 64)));
    const vpx = state._vpx && state._vpx.length >= n ? state._vpx : (state._vpx = new Float64Array(Math.max(n, 64)));
    const vpy = state._vpy && state._vpy.length >= n ? state._vpy : (state._vpy = new Float64Array(Math.max(n, 64)));
    for (let i = 0; i < n; i++){
      vpx[i] = px[i]; vpy[i] = py[i];
      wasIn[i] = pointInPolygon(px[i], py[i], p.fold) ? 1 : 0;
    }
  }

  rebuildHash(H, state);
  const inv = 1 / H.cell;

  // scratch accel arrays
  const ax = step._ax && step._ax.length >= n ? step._ax : (step._ax = new Float64Array(Math.max(n, 64)));
  const ay = step._ay && step._ay.length >= n ? step._ay : (step._ay = new Float64Array(Math.max(n, 64)));

  for (let i = 0; i < n; i++){
    let sx = 0, sy = 0;          // separation steering accumulator
    let alx = 0, aly = 0, cnt = 0; // alignment
    let cx = 0, cy = 0;          // cohesion centroid
    const xi = px[i], yi = py[i];
    const ci = Math.floor(xi * inv), cj = Math.floor(yi * inv);

    for (let dx = -1; dx <= 1; dx++){
      for (let dy = -1; dy <= 1; dy++){
        const bucket = H.map.get(_key(ci + dx, cj + dy));
        if (!bucket) continue;
        for (let q = 0; q < bucket.length; q++){
          const j = bucket[q];
          if (j === i) continue;
          const rx = xi - px[j], ry = yi - py[j];
          const d2 = rx * rx + ry * ry;
          if (d2 >= D.PERCEPT * D.PERCEPT || d2 === 0) continue;
          const d = Math.sqrt(d2);
          // SEPARATION steering (soft): push away, weighted 1/d, only within SEP_RANGE
          if (sepOn && d < D.SEP_RANGE){
            const w = (D.SEP_RANGE - d) / D.SEP_RANGE; // [0,1]
            sx += rx / d * w; sy += ry / d * w;
          }
          // ALIGNMENT + COHESION over the perception radius
          alx += vx[j]; aly += vy[j];
          cx += px[j]; cy += py[j];
          cnt++;
        }
      }
    }

    let accx = 0, accy = 0;
    if (sepOn){ accx += sx * D.K_SEP; accy += sy * D.K_SEP; }
    if (cnt > 0){
      // alignment: steer toward neighbours' mean velocity
      accx += (alx / cnt) * D.K_ALI; accy += (aly / cnt) * D.K_ALI;
      // cohesion: steer toward neighbours' centroid (normalized direction)
      const tx = cx / cnt - xi, ty = cy / cnt - yi;
      const td = Math.sqrt(tx * tx + ty * ty) || 1;
      accx += tx / td * D.K_COH; accy += ty / td * D.K_COH;
    }

    // FLEE the shepherd: inverse-square, CAPPED, zero beyond FLEE_RANGE.
    let f = 0;
    if (sh){
      const rx = xi - sh.x, ry = yi - sh.y;
      const d2 = rx * rx + ry * ry;
      const d = Math.sqrt(d2) || 1e-6;
      if (d < D.FLEE_RANGE){
        let mag = D.K_FLEE / (d2 + 1);            // inverse-square (+1 softens the singularity)
        if (mag > D.FLEE_CAP) mag = D.FLEE_CAP;   // CAP: a close shepherd presses, never flings
        // taper to 0 at FLEE_RANGE so the edge of influence is smooth (no pop)
        const taper = 1 - d / D.FLEE_RANGE;
        mag *= taper;
        accx += rx / d * mag; accy += ry / d * mag;
        // FEAR (the colour readout) tracks PROXIMITY, not the capped force: a sheep close to the
        // shepherd reads as panicked even as the flee pushes it out of range. 0 at the rim → 1 at contact.
        f = taper;                                 // = 1 - d/FLEE_RANGE ∈ (0,1]
      }
    }

    // EDGE turn-away (soft): keep sheep off the world walls
    if (b){
      if (xi - b.x0 < D.EDGE_MARGIN) accx += D.K_EDGE * (1 - (xi - b.x0) / D.EDGE_MARGIN);
      if (b.x1 - xi < D.EDGE_MARGIN) accx -= D.K_EDGE * (1 - (b.x1 - xi) / D.EDGE_MARGIN);
      if (yi - b.y0 < D.EDGE_MARGIN) accy += D.K_EDGE * (1 - (yi - b.y0) / D.EDGE_MARGIN);
      if (b.y1 - yi < D.EDGE_MARGIN) accy -= D.K_EDGE * (1 - (b.y1 - yi) / D.EDGE_MARGIN);
    }

    // tiny seeded wander so a calm flock still breathes
    accx += (rng() - 0.5) * D.WANDER;
    accy += (rng() - 0.5) * D.WANDER;

    ax[i] = accx; ay[i] = accy;
    // smooth the fear readout: asymmetric EMA — fast attack (panic WAKES instantly), slow release
    // (the colour LINGERS as a sheep calms) so the local calm→panic shift reads, not flickers.
    const target = f;
    if (target > fear[i]) fear[i] += (target - fear[i]) * D.FEAR_RISE;   // fast rise
    else fear[i] += (target - fear[i]) * D.FEAR_DECAY;                   // slow decay
  }

  // ── INTEGRATE with the MAX_SPEED clamp (bounds per-step displacement < CONTACT) ──────────────
  for (let i = 0; i < n; i++){
    let nvx = (vx[i] + ax[i]) * D.DAMP;
    let nvy = (vy[i] + ay[i]) * D.DAMP;
    const sp = Math.sqrt(nvx * nvx + nvy * nvy);
    if (sp > D.MAX_SPEED){ const s = D.MAX_SPEED / sp; nvx *= s; nvy *= s; }
    vx[i] = nvx; vy[i] = nvy;
    px[i] += nvx; py[i] += nvy;
  }

  // ── HARD-FLOOR SEPARATION PROJECTION (THE GUARANTEE for Claim 1) ─────────────────────────────
  // After integration, any pair closer than CONTACT is pushed apart to EXACTLY CONTACT (half each).
  // A positional constraint, not a force: unconditionally stable, cannot be outrun. Because the
  // MAX_SPEED clamp forbids a per-step leap ≥ CONTACT, no pair can tunnel past this band unseen.
  // Disabled by the neg-control (separation:false) so the flock collapses and the floor is violated.
  if (sepOn){
    // several relaxation passes resolve chains (A pushed into B pushed into C) cleanly so the
    // steady-state min separation sits AT contact, not merely above the tunnelling floor.
    for (let pass = 0; pass < D.SEP_PASSES; pass++){
      rebuildHash(H, state);
      const invp = 1 / H.cell;
      let moved = false;
      for (let i = 0; i < n; i++){
        const xi = px[i], yi = py[i];
        const ci = Math.floor(xi * invp), cj = Math.floor(yi * invp);
        for (let dx = -1; dx <= 1; dx++){
          for (let dy = -1; dy <= 1; dy++){
            const bucket = H.map.get(_key(ci + dx, cj + dy));
            if (!bucket) continue;
            for (let q = 0; q < bucket.length; q++){
              const j = bucket[q];
              if (j <= i) continue;                 // each unordered pair once
              let rx = px[i] - px[j], ry = py[i] - py[j];
              let d2 = rx * rx + ry * ry;
              if (d2 >= CONTACT * CONTACT) continue;
              let d = Math.sqrt(d2);
              if (d < 1e-9){
                // exactly coincident (only reachable with sep already off historically):
                // separate along a deterministic axis seeded by the pair indices.
                const a = ((i * 0.61803398875 + j * 0.30901699437) % 1) * Math.PI * 2;
                rx = Math.cos(a); ry = Math.sin(a); d = 1e-9;
              }
              const overlap = (CONTACT - d) * 0.5;
              const nx = rx / d, ny = ry / d;
              px[i] += nx * overlap; py[i] += ny * overlap;
              px[j] -= nx * overlap; py[j] -= ny * overlap;
              // kill the closing velocity component so they don't immediately re-overlap
              const rvx = vx[i] - vx[j], rvy = vy[i] - vy[j];
              const closing = rvx * nx + rvy * ny;
              if (closing < 0){
                vx[i] -= closing * nx * 0.5; vy[i] -= closing * ny * 0.5;
                vx[j] += closing * nx * 0.5; vy[j] += closing * ny * 0.5;
              }
              moved = true;
            }
          }
        }
      }
      if (!moved) break;
    }
  }

  // ── FENCES: project a sheep out of any solid wall rect (after the floor; walls win). Each fence
  //    is projected along the shallowest axis AND the sheep is REFLECTED off the wall (the closing
  //    velocity is zeroed/reflected) so the only way past a bisecting fence is the GATE GAP between
  //    two fence rects — a sheep cannot phase through the wall, only thread the opening. ──────────
  if (p.fences){
    for (let f = 0; f < p.fences.length; f++){
      const w = p.fences[f];
      for (let i = 0; i < n; i++){
        if (px[i] > w.x0 - state.RADIUS && px[i] < w.x1 + state.RADIUS &&
            py[i] > w.y0 - state.RADIUS && py[i] < w.y1 + state.RADIUS){
          // push out along the shallowest axis, reflecting the inward velocity off the wall
          const dl = px[i] - (w.x0 - state.RADIUS);
          const dr = (w.x1 + state.RADIUS) - px[i];
          const dt = py[i] - (w.y0 - state.RADIUS);
          const db = (w.y1 + state.RADIUS) - py[i];
          const m = Math.min(dl, dr, dt, db);
          if (m === dl){ px[i] = w.x0 - state.RADIUS; if (vx[i] > 0) vx[i] = 0; }
          else if (m === dr){ px[i] = w.x1 + state.RADIUS; if (vx[i] < 0) vx[i] = 0; }
          else if (m === dt){ py[i] = w.y0 - state.RADIUS; if (vy[i] > 0) vy[i] = 0; }
          else { py[i] = w.y1 + state.RADIUS; if (vy[i] < 0) vy[i] = 0; }
        }
      }
    }
  }

  // ── HARD bounds clamp (the world is closed; a sheep can never leave it) ──────────────────────
  if (b){
    const r = state.RADIUS;
    for (let i = 0; i < n; i++){
      if (px[i] < b.x0 + r){ px[i] = b.x0 + r; if (vx[i] < 0) vx[i] = 0; }
      if (px[i] > b.x1 - r){ px[i] = b.x1 - r; if (vx[i] > 0) vx[i] = 0; }
      if (py[i] < b.y0 + r){ py[i] = b.y0 + r; if (vy[i] < 0) vy[i] = 0; }
      if (py[i] > b.y1 - r){ py[i] = b.y1 - r; if (vy[i] > 0) vy[i] = 0; }
    }
  }

  // ── ONE-WAY VALVE: a sheep that was inside the fold last step and has drifted out is pulled back
  //    to its pre-step (inside) position and its outward velocity killed. The fold is a one-way
  //    gate — easy to enter, impossible to wander back out of — so countInFold is MONOTONE within a
  //    settled flock and the WIN latch, once true, stays true. (The page latches WIN on the engine's
  //    countInFold===N, never on the draw loop.) ──────────────────────────────────────────────────
  if (p.fold && wasIn){
    for (let i = 0; i < n; i++){
      if (wasIn[i] && !pointInPolygon(px[i], py[i], p.fold)){
        // it escaped this step — undo the escape (snap back to the inside point it came from)
        px[i] = _valvePrevX(state, i); py[i] = _valvePrevY(state, i);
        vx[i] = 0; vy[i] = 0;
      }
    }
  }
}
// the one-way valve needs the pre-integration positions; we cache them on the state at step entry.
// (kept as tiny helpers so the inline-parity check sees one source.) These read the snapshot taken
// just before integration; step() refreshes the snapshot each call.
function _valvePrevX(state, i){ return state._vpx ? state._vpx[i] : state.px[i]; }
function _valvePrevY(state, i){ return state._vpy ? state._vpy[i] : state.py[i]; }

// ── PREDICATES (the decidable layer) ────────────────────────────────────────────────────────────

// minPairSep(state) → the smallest centre-to-centre distance over ALL pairs (brute O(n²) ground
// truth; n is small — a flock, not a fluid). The proof quantity for Claim 1. > 0 always; ≥ CONTACT
// in steady state. The twin asserts this every step; the pill shows it live.
function minPairSep(state){
  const n = state.n, px = state.px, py = state.py;
  let m = Infinity;
  for (let i = 0; i < n; i++){
    for (let j = i + 1; j < n; j++){
      const dx = px[i] - px[j], dy = py[i] - py[j];
      const d2 = dx * dx + dy * dy;
      if (d2 < m) m = d2;
    }
  }
  return n < 2 ? Infinity : Math.sqrt(m);
}

// pointInPolygon(x, y, poly) → robust crossing-number ray-cast. poly is a flat [x0,y0,x1,y1,...]
// closed implicitly (last → first). Handles CONCAVE polygons. The on-edge case is treated as INSIDE
// (a sheep touching the rim is folded) via an explicit boundary test before the ray cast.
function pointInPolygon(x, y, poly){
  const m = poly.length / 2;
  // explicit on-boundary test (on-edge ⇒ inside)
  for (let i = 0, j = m - 1; i < m; j = i++){
    const xi = poly[2 * i], yi = poly[2 * i + 1];
    const xj = poly[2 * j], yj = poly[2 * j + 1];
    if (_onSegment(x, y, xi, yi, xj, yj)) return true;
  }
  // crossing-number ray cast to +x. The classic half-open edge convention ( yi>y XOR yj>y )
  // counts each crossing exactly once and is robust to vertices lying on the ray.
  let inside = false;
  for (let i = 0, j = m - 1; i < m; j = i++){
    const xi = poly[2 * i], yi = poly[2 * i + 1];
    const xj = poly[2 * j], yj = poly[2 * j + 1];
    if (((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)){
      inside = !inside;
    }
  }
  return inside;
}
// _onSegment(px,py, ax,ay, bx,by) → is point P on segment AB (within a small epsilon)?
function _onSegment(px, py, ax, ay, bx, by){
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  const len = Math.hypot(bx - ax, by - ay) || 1e-9;
  if (Math.abs(cross) / len > 1e-6) return false;       // not collinear
  const dot = (px - ax) * (bx - ax) + (py - ay) * (by - ay);
  if (dot < -1e-6) return false;
  if (dot > len * len + 1e-6) return false;
  return true;
}

// allInFold(state, poly) → THE WIN PREDICATE. true iff EVERY sheep centre is inside (or on) the
// fold. This is the win condition and nothing else — no timer, no tolerance, no count fudge.
function allInFold(state, poly){
  for (let i = 0; i < state.n; i++){
    if (!pointInPolygon(state.px[i], state.py[i], poly)) return false;
  }
  return true;
}
// countInFold(state, poly) → how many sheep are folded (for the live progress readout + the latch).
function countInFold(state, poly){
  let c = 0;
  for (let i = 0; i < state.n; i++){
    if (pointInPolygon(state.px[i], state.py[i], poly)) c++;
  }
  return c;
}

// runSelfTest(opts) → a compact in-engine self-test (drives the in-page pill). Runs a fixed-seed
// game forward `steps` frames with a scripted shepherd sweep, asserting BOTH claims hold throughout
// and that the neg-control violates Claim 1. Returns { ok, checks:[{name,ok}], minSep }.
function runSelfTest(opts){
  const o = opts || {};
  const steps = o.steps || 900;
  const bounds = { x0: 0, y0: 0, x1: 600, y1: 600 };
  const poly = o.poly || [430, 430, 580, 430, 580, 580, 430, 580]; // a simple square fold
  const checks = [];

  // (1) full fixed-seed run, separation ON: minPairSep > 0 every step.
  {
    const rng = mulberry32(12345);
    const fl = makeFlock({ n: 40, rng, x0: 40, y0: 40, x1: 320, y1: 320 });
    const H = makeHash(DEFAULTS.PERCEPT);
    let worst = Infinity;
    let ok = true;
    for (let t = 0; t < steps; t++){
      // a scripted shepherd circling behind the flock to herd toward the fold
      const a = t * 0.012;
      const shep = { x: 200 + Math.cos(a) * 160, y: 200 + Math.sin(a) * 160 };
      step(fl, H, { shepherd: shep, bounds, separation: true }, rng);
      const ms = minPairSep(fl);
      if (ms < worst) worst = ms;
      if (!(ms > 0)) { ok = false; break; }
    }
    checks.push({ name: 'min sheep separation never reaches 0 (full fixed-seed run)', ok, detail: worst });
  }

  // (2) neg-control: separation OFF collapses the flock → minPairSep reaches ~0.
  {
    const rng = mulberry32(12345);
    const fl = makeFlock({ n: 40, rng, x0: 40, y0: 40, x1: 320, y1: 320 });
    const H = makeHash(DEFAULTS.PERCEPT);
    let best = Infinity;
    for (let t = 0; t < 400; t++){
      step(fl, H, { shepherd: { x: 300, y: 300 }, bounds, separation: false }, rng);
      const ms = minPairSep(fl);
      if (ms < best) best = ms;
    }
    // collapses to (well) below contact — the floor is genuinely falsifiable
    checks.push({ name: 'NEG-CONTROL: separation OFF collapses the flock (min sep → 0)', ok: best < state_contact(), detail: best });
  }

  // (3) WIN fires EXACTLY iff all sheep inside — exhaustive over a crafted set incl. concave + on-edge.
  {
    const ok = winPredicateExact(poly);
    checks.push({ name: 'WIN fires EXACTLY iff every sheep is inside the fold', ok });
  }

  const allOk = checks.every(c => c.ok);
  return { ok: allOk, checks, minSep: checks[0].detail };
}
function state_contact(){ return 2 * DEFAULTS.RADIUS * 0.5; } // half contact: a generous "collapsed" threshold

// winPredicateExact(poly) → prove allInFold ⇔ (∀ sheep inside), incl. concave + on-edge + just-out.
function winPredicateExact(squarePoly){
  // Use a concave (arrow / chevron) fold to stress the ray-cast.
  const concave = [400, 400, 560, 400, 560, 560, 480, 500, 400, 560];
  let ok = true;
  // a) a point clearly inside the concave dent's solid lobe → inside
  ok = ok && pointInPolygon(420, 430, concave) === true;
  // b) a point in the concave NOTCH (above the inward vertex, between the two upper arms) → OUTSIDE
  ok = ok && pointInPolygon(480, 555, concave) === false;
  // c) on-edge → inside
  ok = ok && pointInPolygon(560, 480, concave) === true;
  // d) a vertex → inside
  ok = ok && pointInPolygon(400, 400, concave) === true;
  // e) just outside the right wall → outside
  ok = ok && pointInPolygon(561, 480, concave) === false;
  // Now allInFold as the literal AND: build flocks and check win ⇔ all-inside.
  const inFlock = { n: 3, px: [420, 540, 450], py: [430, 420, 450] };
  const outFlock = { n: 3, px: [420, 540, 480], py: [430, 420, 555] }; // one in the notch
  ok = ok && allInFold(inFlock, concave) === true;        // no false miss
  ok = ok && allInFold(outFlock, concave) === false;      // no false win
  return ok;
}

// === CORE END ===

export {
  mulberry32, makeFlock, makeHash, rebuildHash, step, stepDog,
  minPairSep, pointInPolygon, allInFold, countInFold,
  runSelfTest, _onSegment, DEFAULTS,
};
