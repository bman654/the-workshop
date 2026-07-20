// The Sluice-Gate — Node-twin core. The Drover's THIRD star, kin to The Shepherd (hold the stick) and
// The Standing Stones (set it down). Here the flock is neither steered nor pressed by fixed repellers —
// it is SWEPT. Two sliding sluice paddles are MOVING WALLS; drag one down its groove and its flat edge
// shoves the herd ahead of it, through a staggered opening and on down the channel. Time two sweeps and
// the whole flock threads an S-chicane into a concave fold cove. There is NO current and NO repeller:
// the paddle SWEEP is the sole motive force. A meditative, endlessly-replayable herding toy.
//
// SOLE AUTHORITY — RIDDEN UNFORKED. The flock LAW lives in The Shepherd and is inlined BYTE-IDENTICAL
// between the CORE BEGIN / CORE END sentinels below. This file adds NOTHING to that law. A moving paddle
// is simply a re-supplied fence rect handed to step() every frame — the core's native order (MAX_SPEED
// clamp → hard-floor separation projection → fence/bounds projection → one-way valve) carries the whole
// mechanic with zero changes. core.test.mjs asserts this slab === the-standing-stones/core.mjs's slab
// (which itself === The Shepherd's), so there is ONE law, not three copies that can drift. Above CORE END
// sits this room's OWN layer — the paddle schedule, the channel geometry, the deterministic forward sim,
// and the self-test — between the SLUICE BEGIN / SLUICE END sentinels, ALSO byte-twinned into index.html.
// The watched flock IS the tested flock.
//
// CLAIMS (the quiet correctness layer — but the TOY is the point; this is a delight piece with a payoff,
// and the payoff, that the herd actually folds, is what the twin proves fires):
//   EXACT — CLAIM 1: min pairwise sheep-separation stays > 0 at EVERY step under ANY gate MOTION (a real
//           strengthening of the parent's STATIC-fence case — the positional hard-floor projection is
//           agnostic to WHY a sheep moved, so a moving fence is "just another reason"; probed under
//           adversarial capped slams, not assumed). A per-step paddle-speed cap (PADDLE_CAP << CONTACT)
//           forbids a fence edge outrunning the barrier.
//           CLAIM 2: WIN latches EXACTLY iff every sheep is inside the CONCAVE fold cove (the core's
//           concave-safe pointInPolygon + allInFold + the one-way valve; no timer race), replayed
//           BYTE-IDENTICAL from a fixed seed + a recorded input trace.
//           CLAIM 3 (neg-control): the gates FROZEN OPEN provably FAIL the funnel — with no sweep, the
//           chicane never forms and nothing drives the flock into the offset cove; the SAME seed with the
//           canned correct sweeps DOES reach allInFold. The motion is load-bearing.
//   MODELED — the flock dynamics (Reynolds boids: separation / alignment / cohesion + a tiny wander). A
//           believable HERDING MODEL, not a measurement of how real sheep move. Single-sourced to The
//           Shepherd's core.mjs.
//
// run:  node core.test.mjs

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

// fleeAccum(xi, yi, sources) → the SUMMED flee acceleration on a sheep at (xi,yi) from every
//   fixed repeller in `sources` (each {x,y}), plus the fear readout. Each source contributes the
//   SAME capped inverse-square repulsion the single shepherd always did:
//       mag = K_FLEE/(d²+1), clamped to FLEE_CAP, then ×taper where taper = 1 − d/FLEE_RANGE,
//   zero beyond FLEE_RANGE. The forces ADD; the fear (fmax) is the nearest source's taper (the max,
//   since taper falls with distance). This is the ONE generalization that turns The Shepherd's one
//   dog into The Standing Stones' K stones — with exactly one source it is byte-identical to the
//   original inline flee (same `d = √d² || 1e-6`, same cap-before-taper order, same fear = taper).
function fleeAccum(xi, yi, sources){
  const D = DEFAULTS;
  let ax = 0, ay = 0, fmax = 0;
  for (let s = 0; s < sources.length; s++){
    const src = sources[s];
    const rx = xi - src.x, ry = yi - src.y;
    const d2 = rx * rx + ry * ry;
    const d = Math.sqrt(d2) || 1e-6;
    if (d < D.FLEE_RANGE){
      let mag = D.K_FLEE / (d2 + 1);            // inverse-square (+1 softens the singularity)
      if (mag > D.FLEE_CAP) mag = D.FLEE_CAP;   // CAP: a close repeller presses, never flings
      const taper = 1 - d / D.FLEE_RANGE;       // smooth edge of influence (0 at FLEE_RANGE)
      mag *= taper;
      ax += rx / d * mag; ay += ry / d * mag;
      if (taper > fmax) fmax = taper;           // fear tracks the NEAREST source's proximity
    }
  }
  return { ax, ay, fmax };
}

// step(state, H, params, rng) → advance the flock ONE deterministic frame IN PLACE.
//   params: {
//     shepherd: {x,y} | null,   // ONE repeller (the dog) — the point the flock flees (the engine
//                               //   sees only a point; the dog's spring lives in stepDog)
//     stones:   [{x,y},…]|null, // OR K fixed repellers (The Standing Stones). Prefer stones[];
//                               //   else the single shepherd is wrapped as a one-element list.
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
  // FLEE SOURCES: the flock flees any number of fixed repellers. The Shepherd drives ONE
  // (the dog, p.shepherd); a place-then-release puzzle (The Standing Stones) sets K fixed
  // stones (p.stones). Prefer the explicit stones[]; otherwise wrap the single shepherd point
  // as a one-element list. With exactly one source the accumulation below is BYTE-IDENTICAL to
  // the original single-source flee (same capped inverse-square, same taper, same fear) — so the
  // Shepherd's law is untouched and its byte-parity twin still holds.
  let sources = p.stones || null;
  if (!sources && p.shepherd) sources = [p.shepherd];
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

    // FLEE the repellers: inverse-square, CAPPED, zero beyond FLEE_RANGE, ACCUMULATED over every
    // source (one shepherd, or K fixed stones). fleeAccum returns the summed force + the fear
    // readout (the NEAREST source's taper). With one source this is byte-identical to the original
    // single-source flee. The flock's law does not change with the number of repellers — each one
    // contributes the SAME pressure; they simply add.
    let f = 0;
    if (sources){
      const fa = fleeAccum(xi, yi, sources);
      accx += fa.ax; accy += fa.ay;
      // FEAR (the colour readout) tracks PROXIMITY to the nearest source, not the summed force: a
      // sheep close to a repeller reads panicked even as the flee pushes it away. 0 at the rim → 1
      // at contact. (= max taper over the sources, since taper falls with distance.)
      f = fa.fmax;
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

// === SLUICE BEGIN ===
// ── THE ROOM LAYER — the channel geometry, the sliding paddles, the deterministic forward sim, and the
//    self-test. Sits ABOVE the flock law (which it never touches). Byte-twinned into index.html between
//    these sentinels. A paddle is a MOVING FENCE: each step the sim hands step() the paddles' current
//    rects as p.fences, and the unforked core does the rest. ─────────────────────────────────────────

const W = 600;                                   // the world is a fixed 600×600 square (engine is pixel-blind)
function rect(x0, y0, x1, y1){ return { x0, y0, x1, y1 }; }

// Channel furniture. The channel runs top→bottom between two fixed side walls; sheep spawn at the HEAD
// (top) and are swept toward a fold COVE at the foot. GAP is the paddle-opening width; TH the paddle
// half-thickness. A paddle spans the channel EXCEPT for its opening (against one wall) — sweeping it down
// escorts the herd through that opening. Two paddles with OPPOSITE openings make an S-chicane.
const CHAN = { GAP: 100, TH: 9 };
const LWALL = rect(0, 0, 60, 600), RWALL = rect(540, 0, 600, 600);   // fixed channel walls (x<60, x>540)
// A fixed baffle used by The Funnel: it caps the lower-right so a flock cannot drift STRAIGHT down into
// the offset cove — the cove sits lower-LEFT and is reachable only by an active left-steering sweep.
const BAFFLE = rect(250, 470, 540, 498);

// PADDLE_CAP — the hard guard behind CLAIM 1. A paddle's rect edge may advance at most this many world
// units per step. It is << CONTACT (= 2·RADIUS = 12), exactly as MAX_SPEED is for a sheep: a fence edge
// can never leap a full body-width in one step, so no sheep is tunnelled past the hard-floor projection.
// The sim clamps every requested paddle move to this, so the LIVE spring-driven drag and the canned twin
// obey the identical bound. Canned schedule slopes are all well under it (≈0.6 u/step), so it is
// transparent for a normal run and bites only on an adversarial slam.
const PADDLE_CAP = 4.0;

// paddleRect(cfg, y) → the AABB for a paddle whose carriage is at height y. cfg.gap: 'R' → the solid slab
// runs from the LEFT wall and the opening is on the RIGHT (x in [540-GAP, 540]); 'L' → solid from the
// RIGHT wall, opening on the LEFT (x in [60, 60+GAP]). The staggered pair (upper opens right, lower opens
// left) is the S-chicane: down the right side, then down the left, into the cove.
function paddleRect(cfg, y){
  return cfg.gap === 'R'
    ? rect(60, y - CHAN.TH, 540 - CHAN.GAP, y + CHAN.TH)
    : rect(60 + CHAN.GAP, y - CHAN.TH, 540, y + CHAN.TH);
}

// scheduleY(frames, t) → the canned carriage height at step t, piecewise-linear over keyframes
// [{t,y},…] (held flat before the first and after the last). The "canned correct sweep" a level ships —
// what Reveal replays, what the twin drives, and what the neg-control freezes. All slopes are < PADDLE_CAP.
function scheduleY(frames, t){
  if (t <= frames[0].t) return frames[0].y;
  for (let i = 1; i < frames.length; i++){
    if (t <= frames[i].t){
      const a = frames[i - 1], b = frames[i];
      return a.y + (b.y - a.y) * ((t - a.t) / (b.t - a.t));
    }
  }
  return frames[frames.length - 1].y;
}

// The fold coves — CONCAVE polygons (a central notch dips inward) so CLAIM 2 exercises the concave-safe
// ray-cast, not a lazy rectangle. COVE_C sits centred at the foot; COVE_L is offset lower-LEFT (The
// Funnel), reachable only by a left-steering sweep past the BAFFLE.
const COVE_C = [110, 470, 250, 470, 300, 506, 350, 470, 490, 470, 490, 575, 110, 575];
const COVE_L = [70, 466, 168, 466, 205, 502, 242, 466, 250, 466, 250, 575, 70, 575];

// LEVELS — a tight ladder of chicane variations. Each: a seed + flock count, the fixed walls, the fold
// cove, the paddle set (each with its opening side, its rest height, and its canned winning schedule),
// and a generous step budget. These are FROZEN — verified winnable at the canned step-counts the
// self-test prints, with the funnel's gates-frozen-open provably LOSING (the sweep is load-bearing).
const SCATTER = [105, 78, 495, 205];             // the shared HEAD-of-channel spawn rect
const LEVELS = [
  { // L1 — THE SILL. One paddle, one opening. Drag it down and the whole scatter is swept through the
    //    right-hand sill into the cove. The single-sweep primer: feel the flat edge push the herd.
    name: 'The Sill',
    sub: 'One paddle. Drag it down — its flat edge sweeps the whole flock through the sill into the cove.',
    seed: 4, n: 22, maxSteps: 1100, walls: [LWALL, RWALL], cove: COVE_C,
    paddles: [
      { gap: 'R', rest: 105, frames: [{ t: 0, y: 105 }, { t: 40, y: 105 }, { t: 300, y: 255 }, { t: 1100, y: 255 }] },
    ],
  },
  { // L2 — THE CHICANE. Two paddles, opposite openings. Sweep the upper (opens right) to drop the herd
    //    down the right side, then TIME the lower (opens left) to escort them down the left into the cove.
    name: 'The Chicane',
    sub: 'Two paddles, opposite openings. Sweep one, then time the other — thread the S into the cove.',
    seed: 16, n: 24, maxSteps: 1350, walls: [LWALL, RWALL], cove: COVE_C,
    paddles: [
      { gap: 'R', rest: 105, frames: [{ t: 0, y: 105 }, { t: 30, y: 105 }, { t: 270, y: 250 }, { t: 1350, y: 250 }] },
      { gap: 'L', rest: 300, frames: [{ t: 0, y: 300 }, { t: 360, y: 300 }, { t: 580, y: 432 }, { t: 1350, y: 432 }] },
    ],
  },
  { // L3 — THE FUNNEL. The cove is offset lower-LEFT behind a baffle; a straight drop misses it entirely.
    //    Only a timed two-paddle sweep that steers the herd LEFT reaches the fold — the neg-control target:
    //    freeze the gates open and nothing folds (verified below), because the MOTION is what folds them.
    name: 'The Funnel',
    sub: 'The cove is offset behind a baffle — a straight drop misses it. Steer the herd left, on the beat.',
    seed: 48, n: 24, maxSteps: 1350, walls: [LWALL, RWALL, BAFFLE], cove: COVE_L,
    paddles: [
      { gap: 'R', rest: 105, frames: [{ t: 0, y: 105 }, { t: 30, y: 105 }, { t: 270, y: 250 }, { t: 1350, y: 250 }] },
      { gap: 'L', rest: 300, frames: [{ t: 0, y: 300 }, { t: 360, y: 300 }, { t: 580, y: 432 }, { t: 1350, y: 432 }] },
    ],
  },
];

// makeSluice(level) → a fresh deterministic sim for a level. PURE: no wall-clock, no RAF. The page replays
// this SAME function frame-by-frame for the live toy (feeding it the player's dragged paddle heights), and
// the Node twin drives it headless with a canned or frozen schedule — same bytes either way. paddleY holds
// each paddle's current (already-capped) carriage height; the cap is enforced in sluiceStep.
function makeSluice(level, initialY){
  const rng = mulberry32(level.seed);
  const flock = makeFlock({ n: level.n, rng, x0: SCATTER[0], y0: SCATTER[1], x1: SCATTER[2], y1: SCATTER[3] });
  const H = makeHash(DEFAULTS.PERCEPT);
  return {
    rng, flock, H, level,
    // current carriage heights — start at rest, OR at a supplied static position (the neg-control freezes
    // the gates OPEN from t=0, with no opening sweep, so the flock meets a purely STATIC open channel).
    paddleY: initialY ? initialY.slice() : level.paddles.map(p => p.rest),
    step: 0, won: false, minSep: Infinity,
  };
}

// sluiceStep(sim, wantY) → advance ONE deterministic frame. wantY is the array of REQUESTED carriage
// heights (from the canned schedule, or the player's spring-tracked drag). Each is clamped to PADDLE_CAP
// per step — the fence edge can never outrun the barrier — then the capped paddles become MOVING FENCES
// handed to the unforked core alongside the level's fixed walls. Returns sim (for chaining).
function sluiceStep(sim, wantY){
  const L = sim.level;
  const fences = L.walls.slice();
  for (let i = 0; i < L.paddles.length; i++){
    const prev = sim.paddleY[i];
    let y = wantY[i];
    const dy = y - prev;
    if (dy > PADDLE_CAP) y = prev + PADDLE_CAP;
    else if (dy < -PADDLE_CAP) y = prev - PADDLE_CAP;
    sim.paddleY[i] = y;
    fences.push(paddleRect(L.paddles[i], y));
  }
  step(sim.flock, sim.H, {
    bounds: { x0: 0, y0: 0, x1: W, y1: W }, fences, fold: L.cove, separation: true,
  }, sim.rng);
  sim.step++;
  const ms = minPairSep(sim.flock);
  if (ms < sim.minSep) sim.minSep = ms;
  if (!sim.won && allInFold(sim.flock, L.cove)) sim.won = true;   // WIN latches; the one-way valve keeps it
  return sim;
}

// cannedY(level, t) → the requested carriage heights at step t from every paddle's canned schedule.
function cannedY(level, t){ return level.paddles.map(p => scheduleY(p.frames, t)); }
// frozenY(level, where) → constant heights for the neg-control: 'top' = every paddle at rest; 'open' =
// every paddle held at its swept-open final height (the S-path standing wide open, but never MOVING).
function frozenY(level, where){
  return level.paddles.map(p => where === 'open' ? p.frames[p.frames.length - 1].y : p.rest);
}

// driveToEnd(level, driver, maxSteps) → run a fresh sim forward up to maxSteps (stopping the instant it
// wins), driver(t) → requested paddle heights. Returns { won, steps, minSep, everZero, fp }. fp = an
// FNV-1a hash of the final sheep positions — a byte-true fingerprint for the determinism proof.
function driveToEnd(level, driver, maxSteps, initialY){
  const sim = makeSluice(level, initialY);
  let everZero = false;
  for (let t = 0; t < maxSteps && !sim.won; t++){
    sluiceStep(sim, driver(t));
    if (!(minPairSep(sim.flock) > 0)) everZero = true;
  }
  return { won: sim.won, steps: sim.step, minSep: sim.minSep, everZero, fp: fingerprint(sim.flock) };
}
function fingerprint(flock){
  // FNV-1a over the raw float bytes of every sheep position — byte-true identity.
  const buf = new ArrayBuffer(8); const dv = new DataView(buf);
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < flock.n; i++){
    dv.setFloat64(0, flock.px[i]); for (let b = 0; b < 8; b++){ h ^= dv.getUint8(b); h = Math.imul(h, 0x01000193); }
    dv.setFloat64(0, flock.py[i]); for (let b = 0; b < 8; b++){ h ^= dv.getUint8(b); h = Math.imul(h, 0x01000193); }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// adversarialMinSep(seed, driver, steps) → CLAIM 1 probe. A dense clump under a SCRIPTED paddle schedule
// (driver(t, prevY) → requested carriage height for ONE gap-'R' paddle), asserting the hard floor holds
// even when a paddle is SLAMMED at the capped max speed straight into the pack. Returns { worst, everZero }.
function adversarialMinSep(seed, driver, steps){
  const rng = mulberry32(seed);
  const fl = makeFlock({ n: 28, rng, x0: 150, y0: 120, x1: 450, y1: 260 });   // a tight pack
  const H = makeHash(DEFAULTS.PERCEPT);
  let worst = Infinity, everZero = false, y = 90;
  const cfg = { gap: 'R' };
  for (let t = 0; t < steps; t++){
    let want = driver(t);
    const dy = want - y;                              // the SAME PADDLE_CAP the sim enforces
    if (dy > PADDLE_CAP) want = y + PADDLE_CAP; else if (dy < -PADDLE_CAP) want = y - PADDLE_CAP;
    y = want;
    step(fl, H, { bounds: { x0: 0, y0: 0, x1: W, y1: W },
      fences: [LWALL, RWALL, paddleRect(cfg, y)], separation: true }, rng);
    const ms = minPairSep(fl);
    if (ms < worst) worst = ms;
    if (!(ms > 0)) everZero = true;
  }
  return { worst, everZero };
}

// selfTest() → proves the claims and drives the in-page pill. Pure (no DOM). Returns
//   { ok, checks:[{key,name,ok,val}], winSteps }.
function selfTest(){
  const checks = [];

  // (1) DETERMINISM — the canned winning schedule replays byte-true (fp, won, steps), twice; and a losing
  //     run (funnel frozen open) reproduces byte-true too (you debug a run, you never re-roll the dice).
  {
    const drv = (L) => (t) => cannedY(L, t);
    const a = driveToEnd(LEVELS[2], drv(LEVELS[2]), LEVELS[2].maxSteps);
    const b = driveToEnd(LEVELS[2], drv(LEVELS[2]), LEVELS[2].maxSteps);
    const froze = () => driveToEnd(LEVELS[2], (t) => frozenY(LEVELS[2], 'open'), LEVELS[2].maxSteps, frozenY(LEVELS[2], 'open'));
    const f1 = froze(), f2 = froze();
    const ok = a.fp === b.fp && a.won === b.won && a.steps === b.steps
      && f1.fp === f2.fp && f1.won === false;
    checks.push({ key: 'det', name: 'determinism (win + loss replay byte-true)', ok, val: 'fp ' + a.fp });
  }

  // (2) CLAIM 1 — minPairSep > 0 at EVERY step, under gate MOTION. Assert on every level's canned run AND
  //     under two adversarial capped slams (straight slam into the pack; a sustained oscillating press).
  {
    let worst = Infinity, everZero = false;
    for (const L of LEVELS){
      const r = driveToEnd(L, (t) => cannedY(L, t), L.maxSteps);
      if (r.everZero) everZero = true;
      if (r.minSep < worst) worst = r.minSep;
    }
    const s1 = adversarialMinSep(37, (t) => (t < 5 ? 90 : 260), 900);              // straight slam
    const s2 = adversarialMinSep(37, (t) => 170 + 80 * Math.sin(t * 0.15), 900);    // oscillating press
    if (s1.everZero || s2.everZero) everZero = true;
    const advWorst = Math.min(s1.worst, s2.worst);
    const ok = !everZero && worst > 0 && advWorst > 0;
    checks.push({ key: 'sep', name: 'minPairSep>0 every step, under gate motion (incl. adversarial slam)',
      ok, val: 'worst ' + advWorst.toFixed(2) });
  }

  // (3) CLAIM 2 — WIN ≡ allInFold on the CONCAVE cove: notch-is-out, on-edge-is-in, no false/missed win;
  //     and the live coupling — a winning run's verdict === allInFold on the final flock.
  {
    const c = COVE_C;
    let ok = true;
    ok = ok && pointInPolygon(200, 520, c) === true;       // inside a solid lobe (left of the notch)
    ok = ok && pointInPolygon(300, 540, c) === true;       // below the notch tip (y>506) ⇒ inside
    ok = ok && pointInPolygon(300, 490, c) === false;      // in the concave NOTCH (above the tip) ⇒ OUTSIDE
    ok = ok && pointInPolygon(490, 520, c) === true;       // on the right wall (on-edge ⇒ inside)
    ok = ok && pointInPolygon(300, 460, c) === false;      // above the cove rim ⇒ outside
    ok = ok && pointInPolygon(95, 520, c) === false;       // left of the cove ⇒ outside
    ok = ok && allInFold({ n: 2, px: [200, 400], py: [520, 520] }, c) === true;    // no missed win
    ok = ok && allInFold({ n: 2, px: [200, 300], py: [520, 460] }, c) === false;   // one above ⇒ no false win
    const r = driveToEnd(LEVELS[1], (t) => cannedY(LEVELS[1], t), LEVELS[1].maxSteps);
    const sim = makeSluice(LEVELS[1]);
    for (let t = 0; t < LEVELS[1].maxSteps && !sim.won; t++) sluiceStep(sim, cannedY(LEVELS[1], t));
    ok = ok && sim.won === allInFold(sim.flock, LEVELS[1].cove);
    checks.push({ key: 'win', name: 'WIN ≡ allInFold on the concave cove (no timer race)', ok, val: 'exact' });
  }

  // (4) CLAIM 3 — NEG-CONTROL: the funnel with gates FROZEN OPEN never folds all N; the SAME seed with the
  //     canned sweep DOES. The motion is load-bearing.
  {
    const F = LEVELS[2];
    const open = driveToEnd(F, (t) => frozenY(F, 'open'), F.maxSteps, frozenY(F, 'open'));
    const top = driveToEnd(F, (t) => frozenY(F, 'top'), F.maxSteps);
    const swept = driveToEnd(F, (t) => cannedY(F, t), F.maxSteps);
    const ok = open.won === false && top.won === false && swept.won === true;
    checks.push({ key: 'neg', name: 'funnel: gates frozen open FAIL; the timed sweep WINS', ok,
      val: ok ? 'motion load-bearing' : ('open=' + open.won + ' swept=' + swept.won) });
  }

  // levels-winnable: every canned schedule actually WINS at the level's own n.
  const winSteps = [];
  let allWin = true;
  for (const L of LEVELS){
    const r = driveToEnd(L, (t) => cannedY(L, t), L.maxSteps);
    allWin = allWin && r.won; winSteps.push(r.won ? r.steps : 'X');
  }

  const ok = checks.every(c => c.ok) && allWin;
  return { ok, checks, winSteps, allWin };
}
// === SLUICE END ===

export {
  // the flock law (re-exported from the inlined Shepherd/Standing-Stones slab — one authority)
  mulberry32, makeFlock, makeHash, step, fleeAccum,
  minPairSep, pointInPolygon, allInFold, countInFold, DEFAULTS,
  // the room layer
  W, rect, CHAN, LWALL, RWALL, BAFFLE, PADDLE_CAP, paddleRect, scheduleY,
  COVE_C, COVE_L, LEVELS, SCATTER,
  makeSluice, sluiceStep, cannedY, frozenY, driveToEnd, fingerprint, adversarialMinSep, selfTest,
};
