// ============================================================================
//  THE WIND CHIMES — the CHIME CORE: the sole authority for this leaf's motion
//  and its voice. Pure, dependency-free (DOM-free). This is a DELIGHT-FIRST leaf:
//  it makes NO math claim and carries no in-page proof pill. The ONE correctness
//  CONSTRAINT (not a theorem) is the TUNING — every tube's fundamental is a degree
//  of A-major-pentatonic, single-sourced from ../pitch-core.mjs, so any chord the
//  wind happens to strike is consonant by construction and cannot sound wrong.
//
//    • ONE DRIVEN DAMPED PENDULUM. The clapper puck and the wind-sail below it are
//      ONE body hanging on a cord of length L. The breeze pushes the sail:
//          θ'' = −(g/L)·sin θ − c·θ' + a_wind(t)
//          a_wind(t) = WIND_K · breeze · turbulence(t)
//      `turbulence` is smooth band-limited noise — a sum of detuned sines at
//      sub-hertz rates (one of them near the pendulum's own 0.77 Hz, so a real
//      breeze RESONANTLY pumps the swing the way air actually does) — which is
//      why gusts feel like air and not like a slider. `c` is REAL damping: with
//      the wind off, an undriven swing loses energy monotonically and dies to rest.
//
//      WHY THE WIND FORCE IS ZERO-MEAN (and θ is measured against the RACK): the
//      tubes, the top disc and the clapper all hang from the SAME hook. A steady
//      wind leans the WHOLE assembly together, which moves no tube relative to any
//      clapper and rings nothing. What actually rings a chime is the FLUCTUATING
//      part of the air — the buffeting. So the steady push carries no term here (it
//      would only park the clapper against one side of the rack and silence the
//      other half), and `breeze` scales the size of the gusting instead. This is
//      both the truer physics and the reason a strong wind sweeps the WHOLE rack
//      rather than pinning the clapper to its downwind edge.
//
//      Integrated semi-implicit (symplectic) Euler with SUB substeps, and the
//      clapper is bounded by the RACK'S EDGE it hangs inside — so no wind, however
//      hard, can send it over the top into a spin (LEG 6 holds that line).
//
//    • THE TUBES ARE A GEOMETRY, NOT A RULE. Five tubes hang at FIXED contact
//      angles φ_i spread around dead centre, NESTED: the highest tube sits nearest
//      the middle and each lower tube sits further out (|φ| grows as pitch falls),
//      on alternating sides so the rack hangs balanced. A strike on tube i fires
//      when the swinging clapper CROSSES φ_i with |θ'| > V_MIN, with a per-tube
//      REFRACTORY window so one pass rings a tube ONCE (no buzz), and the tube
//      takes a little of the swing's energy away with it (STRIKE_LOSS).
//      That geometry IS the wind→notes mapping, and there is no rule to learn:
//        · a SOFT breeze only reaches the inner tubes → a few bright tinkles;
//        · a GUST sweeps the clapper across the whole rack → the full pentatonic run.
//      The lowest note is the one the wind has to work hardest to reach.
//
//    • THE VOICE IS A STRUCK FREE-FREE TUBE, not a bell. Each strike is an additive
//      stack on the INHARMONIC free-free ratios [1, 2.756, 5.404, 8.933], each
//      partial with its own env(t) = (1 − e^(−t/τ_atk))·e^(−t/τ_dec,n): a ~6 ms
//      attack to a peak just after onset, then an exponential tail — a genuine
//      RISE-then-DECAY, with the higher modes dying first (struck metal) and the
//      longer/lower tubes ringing longer. Harder strikes are BRIGHTER (the upper
//      partials scale with impact velocity), so the wind's force is audible as
//      timbre and not just as loudness. A soft master limiter means a five-tube
//      gust cluster never clips. Because a free-free tube has NO sub-octave hum
//      partial and its overtones are spread far wider than a bell's, this voice is
//      audibly DISTINCT from the Sound Garden's Carillon — thinner, airier,
//      shorter-tailed. (verify.sh measures exactly that, against a carillon render.)
//
//    • WIND IS LIGHT. `strikeEnvelope` is the SAME function the ear hears and the
//      eye sees: the page drives each struck tube's glow + shiver from this very
//      envelope, so you literally SEE the ring decay. The room is a complete,
//      playable, luminous sculpture with the sound OFF.
//
//  This CHIME CORE is single-sourced here; the page (index.html, forged from
//  index.src.html) inlines a BYTE-TWIN of the slice between the sentinels below,
//  char-for-char. The Node twin (core.test.mjs) re-extracts that slice, asserts
//  char-for-char parity, and drives the SAME createChime()/gust() the page's live
//  animation drives — so the room the eye+ear play and the room the twin proves
//  cannot drift.
//
//  Note on the byte-twin's shape: the CHIME CORE block is IMPORT-FREE — it receives
//  the pitch law (`semiToFreqFn`) as a PARAMETER wherever it needs a frequency. That
//  lets the page inline the slice without forcing a script load order, and keeps the
//  single-source discipline honest: the equal-temperament anchor is IMPORTED from
//  ../pitch-core.mjs, never re-typed here.
//
//  The leaf lives one level deep (the-wind-chimes → sound-garden → repo root), so
//  the Node twin's repoRoot is ../.. .
// ============================================================================

import { semiToFreq, noteName } from '../pitch-core.mjs';   // the pitch anchor — never re-typed

// ===== CHIME CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: the pendulum, the strike model, the tone, the offline renders and
// runChimeSelfTest take only plain numbers and a passed-in pitch function — so the
// page can inline this block verbatim regardless of script load order.

// ── THE TUNING (the one correctness CONSTRAINT) ──────────────────────────────
// The five degrees of A-MAJOR-PENTATONIC — A3 B3 C#4 E4 F#4 — as SEMITONE OFFSETS
// from middle C. This is the estate's own key (the air's prose names it), and it is
// the reason the room cannot sound wrong: every subset of a pentatonic scale is
// consonant, so whatever chord the wind happens to strike is musical by construction.
// The offsets are the only thing typed here; the FREQUENCY comes from the imported
// pitch law (semiToFreqFn), never from a re-typed Hz literal.
//   C4 = 0 ⇒ A3 = −3, B3 = −1, C#4 = +1, E4 = +4, F#4 = +6.
const PENT_SEMIS = [-3, -1, 1, 4, 6];        // low → high (A3 B3 C#4 E4 F#4)

// the tube fundamentals, lowest first. `semiToFreqFn` is ../pitch-core.mjs's
// semiToFreq — passed in so this block stays import-free and the anchor stays single.
function tubeFreqs(semiToFreqFn){ return PENT_SEMIS.map(semiToFreqFn); }

// ── THE RACK'S GEOMETRY (the wind→notes mapping, as a shape) ─────────────────
// Contact angles φ_i in RADIANS, index-aligned with PENT_SEMIS (so index 0 is the
// LOWEST tube). |φ| falls as pitch rises — the highest tube hangs nearest dead
// centre, the lowest hangs furthest out — and the signs alternate so the rack hangs
// balanced and each swing direction rings a different (still consonant) subset.
// These five numbers ARE the rule "a breeze tinkles the high tubes, a gust plays
// them all": nothing else in the code knows about soft-vs-strong wind.
const TUBE_ANGLES = [0.50, -0.40, 0.29, -0.185, 0.085];   // A3 … F#4, radians

// the tube LENGTHS, as a fraction of the longest. A free-free tube's fundamental
// goes as 1/L², so L ∝ 1/√f — the eye reads the pitch order off the lengths, and
// the drawing is not a lie about the physics.
function tubeLengths(freqs){
  const fLo = Math.min.apply(null, freqs);
  return freqs.map(f => Math.sqrt(fLo / f));
}

// ── THE PENDULUM (the ONE body: clapper puck + wind-sail) ────────────────────
const G        = 9.81;      // gravity (m/s²)
const L_CORD   = 0.42;      // cord length (m) ⇒ ω₀ = √(g/L) ≈ 4.83 rad/s ≈ 0.77 Hz
const DAMP_C   = 0.30;      // real linear damping (1/s) — undriven swings die to rest
const WIND_K   = 26.0;      // sail coupling: breeze 1.0 gusts the clapper across the rack
const SUBSTEPS = 8;         // integrator substeps per stepped frame (stability)
const GUST_KICK  = 2.2;     // rad/s of swing an impulse gust(1) imparts
const SURGE_TAU  = 1.6;     // s — how fast a gust's breeze surge decays away
const OMEGA0 = Math.sqrt(G / L_CORD);        // the pendulum's natural rate (rad/s)

// THE RACK'S EDGE — the clapper hangs INSIDE the ring of tubes and cannot swing out
// past it: at the limit it meets the outermost tube and rebounds. This is a real
// physical bound, and it is also what keeps the room sane in a storm. A driven
// pendulum with no bound eventually goes OVER THE TOP and rotates (the #1 hazard
// here — a spinning clapper is not a chime and rings almost nothing, because every
// tube falls inside its refractory). THETA_MAX sits just outside the lowest tube's
// contact angle, so the swing can always reach every tube but never escape the rack.
const THETA_MAX = 0.62;     // rad — the rack's edge (outermost tube sits at 0.50)
const BOUNCE    = 0.55;     // how much swing survives a rebound off the rack's edge

// ── THE STRIKE (a crossing, not a schedule) ──────────────────────────────────
const V_MIN      = 0.25;    // rad/s — below this a crossing is a graze, not a strike
const V_REF      = 3.00;    // rad/s — the impact speed that reads as a full-force hit
const REFRACTORY = 0.11;    // s — one pass rings a tube once (no buzz)
const STRIKE_LOSS = 0.045;  // the swing energy a tube carries off as sound

// ── THE VOICE (a struck free-free tube) ──────────────────────────────────────
// The inharmonic partial ratios of an ideal FREE-FREE bar/tube. These are what make
// it a chime and not a bell: no sub-octave hum, and overtones spread far wider than
// a bell's (1.19/1.5/2.0). The ONE place these live as code.
const TUBE_RATIOS = [1, 2.756, 5.404, 8.933];
const TUBE_AMPS   = [1.0, 0.42, 0.18, 0.09];   // base weight per partial
const TAU_ATK     = 0.006;   // s — the ~6 ms strike attack (rise), shared by all partials
const TAU_REF     = 3.8;     // s — the fundamental's tail on the LOWEST tube
const DECAY_FALL  = 1.8;     // higher modes decay faster: τ_n = τ_0 / DECAY_FALL^n
const BRIGHT_FLOOR = 0.30;   // a feather-light strike keeps this much of its top end
const LIMIT       = 0.85;    // the soft master limiter's ceiling (overlaps never clip)
const DEFAULT_SR  = 44100;

// the fundamental's decay time for a tube of frequency f: lower (longer) tubes ring
// longer, in honest proportion to their pitch. Anchored on the lowest tube.
function tubeTau(f, fLo){ return TAU_REF * (fLo / f); }

// THE ENVELOPE — the ONE curve the ear and the eye both obey. A fast rise to a peak
// just after onset, then an exponential tail:
//     env(t) = (1 − e^(−t/τ_atk)) · e^(−t/τ_dec)
// It is exactly 0 at t=0, climbs to ≈1 within a few tens of ms, and decays away. The
// page drives a struck tube's GLOW and SHIVER from this same function, so what you
// SEE is what you HEAR.
function env(t, tauAtk, tauDec){
  if (t < 0) return 0;
  return (1 - Math.exp(-t / tauAtk)) * Math.exp(-t / tauDec);
}

// the per-partial decay time for partial index n on a tube whose fundamental decays
// in tau0 — struck metal loses its top end first.
function partialTau(tau0, n){ return tau0 / Math.pow(DECAY_FALL, n); }

// the per-partial amplitude for an impact velocity vel ∈ [0,1]. The fundamental
// scales with vel; every partial ABOVE it scales with vel again per rung, so a hard
// strike is BRIGHTER and not merely louder — the wind's force is audible as timbre.
function partialAmp(n, vel){
  const v = Math.max(0, Math.min(1, vel));
  return TUBE_AMPS[n] * v * Math.pow(BRIGHT_FLOOR + (1 - BRIGHT_FLOOR) * v, n);
}

// THE STRUCK-TUBE VOICE, as a continuous function of time — the sum the ear hears:
//   y(t) = Σ_n amp_n(vel) · env(t; τ_atk, τ_n) · sin(2π · f0 · ratio_n · t)
// One law; renderStrike below just samples it, and strikeEnvelope is its visible face.
function tubeSample(t, f0, vel, tau0){
  if (t < 0) return 0;
  let s = 0;
  for (let n = 0; n < TUBE_RATIOS.length; n++){
    const a = partialAmp(n, vel);
    if (a === 0) continue;
    s += a * env(t, TAU_ATK, partialTau(tau0, n)) * Math.sin(2 * Math.PI * f0 * TUBE_RATIOS[n] * t);
  }
  return s;
}

// THE VISIBLE FACE of the same voice: the strike's overall loudness envelope at
// age t, normalised to ≈1 at its peak. The page uses THIS for a struck tube's glow
// and shiver, so the light and the sound share one curve (and a muted / air-off /
// can't-listen visitor still SEES the ring decay).
function strikeEnvelope(t, vel, tau0){
  return Math.max(0, Math.min(1, vel)) * env(t, TAU_ATK, tau0);
}

// ── THE OFFLINE RENDERS (what verify.sh measures and what the page PLAYS) ────
// The page plays each strike by rendering it with renderStrike and handing the very
// same samples to an AudioBuffer — so the live sound, the offline WAV, and the model
// the twin proves are one thing, not three.

// one strike, rendered to a buffer.
function renderStrike(f0, vel, seconds, sr, tau0){
  sr = sr || DEFAULT_SR;
  const N = Math.max(1, Math.floor(seconds * sr));
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) out[i] = tubeSample(i / sr, f0, vel, tau0);
  return out;
}

// THE SOFT MASTER LIMITER — a smooth tanh knee at LIMIT. Below the knee it is very
// nearly linear (so a lone tinkle is untouched); above it, it bends rather than
// clips, so a five-tube gust cluster can never reach full scale.
function limit(x){ return LIMIT * Math.tanh(x / LIMIT); }

// a LIST of strikes ({tube, t, vel}) mixed into one buffer at their own times, then
// passed through the limiter. This is the room's actual output.
function renderStrikes(strikes, seconds, sr, freqs){
  sr = sr || DEFAULT_SR;
  const N = Math.max(1, Math.floor(seconds * sr));
  const out = new Float64Array(N);
  const fLo = Math.min.apply(null, freqs);
  for (const s of strikes){
    const f0 = freqs[s.tube];
    const tau0 = tubeTau(f0, fLo);
    const i0 = Math.floor(s.t * sr);
    if (i0 >= N) continue;
    for (let i = Math.max(0, i0); i < N; i++){
      const age = (i - i0) / sr;
      if (age > tau0 * 6 + 0.05) break;          // past audibility; stop early
      out[i] += tubeSample(age, f0, s.vel, tau0);
    }
  }
  for (let i = 0; i < N; i++) out[i] = limit(out[i]);
  return out;
}

// ── ANALYSIS HELPERS (shared by the self-test, the page, and verify.sh) ──────

function rms(buf, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, (e ?? buf.length) | 0);
  if (e <= s) return 0;
  let acc = 0; for (let i = s; i < e; i++) acc += buf[i] * buf[i];
  return Math.sqrt(acc / (e - s));
}

function peak(buf, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, (e ?? buf.length) | 0);
  let p = 0; for (let i = s; i < e; i++){ const a = buf[i] < 0 ? -buf[i] : buf[i]; if (a > p) p = a; }
  return p;
}

// the MEASURED loudness envelope of a rendered buffer: block RMS over `winMs`
// windows. This is how the rise-then-decay payoff is asserted on the actual AUDIO
// (not merely on the analytic env), and it is what "you can see the ring decay" means.
function rmsEnvelope(buf, sr, winMs = 30){
  const w = Math.max(1, Math.floor(sr * winMs / 1000));
  const out = [];
  for (let i = 0; i + w <= buf.length; i += w) out.push(rms(buf, i, i + w));
  return out;
}

// ── THE LIVE ROOM (the SAME simulation the page animates and the twin drives) ──
// createChime() returns the room's state plus its real entry points. The headless
// twin drives gust()/step() directly — never a synthetic canvas pointer event — so
// what the twin proves is the live path, not a stand-in for it.
function createChime(opts){
  opts = opts || {};
  const freqs  = opts.freqs;                       // REQUIRED: from tubeFreqs(semiToFreq)
  const angles = opts.angles || TUBE_ANGLES;
  const fLo    = Math.min.apply(null, freqs);
  const taus   = freqs.map(f => tubeTau(f, fLo));
  const seed   = opts.seed ?? 1;

  // the turbulence: a sum of detuned sines at sub-hertz rates. One component sits
  // near the pendulum's own 0.77 Hz so a real breeze RESONANTLY pumps the swing —
  // that is why gusts feel like air. Deterministic in `seed`, so a render repeats.
  const TURB_F = [0.11, 0.27, 0.53, 0.79, 1.31];
  const TURB_A = [0.38, 0.30, 0.20, 0.26, 0.12];
  const phases = TURB_F.map((_, i) => (Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % (2 * Math.PI));
  let turbNorm = 0; for (const a of TURB_A) turbNorm += a;
  function turbulence(t){
    let s = 0;
    for (let i = 0; i < TURB_F.length; i++) s += TURB_A[i] * Math.sin(2 * Math.PI * TURB_F[i] * t + phases[i]);
    return s / turbNorm;                            // ≈ [-1, 1]
  }

  const st = {
    th: 0, om: 0,            // the clapper's angle (rad) and angular velocity (rad/s)
    t: 0,                    // the room's own clock (s)
    breeze: 0,               // the steady wind level (air floor + manual), 0..~1.2
    surge: 0,                // a decaying gust surge added on top of `breeze`
    last: angles.map(() => -1e9),   // per-tube last-strike time (the refractory)
    strikes: [],             // every strike this room has rung: {tube, t, vel}
  };

  // the wind acting on the sail right now. ZERO-MEAN by construction (see the header):
  // the steady push leans the whole rack and rings nothing, so `breeze` scales the
  // size of the GUSTING, which is what actually swings the clapper against its tubes.
  function windNow(t){
    const b = Math.max(0, st.breeze + st.surge);
    return WIND_K * b * turbulence(t);
  }

  // ONE substep of the driven damped pendulum, semi-implicit (v first, then x), with
  // the tube-crossing strike test done on the SAME substep so a fast swing cannot
  // tunnel straight through a tube between frames.
  function substep(h, fired){
    const thPrev = st.th;
    const acc = -(G / L_CORD) * Math.sin(st.th) - DAMP_C * st.om + windNow(st.t);
    st.om += acc * h;                                // semi-implicit: velocity first …
    st.th += st.om * h;                              // … then angle, with the new velocity
    st.t  += h;
    st.surge *= Math.exp(-h / SURGE_TAU);            // the gust dies away
    // a strike is a CROSSING of a tube's fixed contact angle, with real speed, once.
    for (let i = 0; i < angles.length; i++){
      const a = angles[i];
      const crossed = (thPrev - a) * (st.th - a) <= 0 && thPrev !== st.th;
      if (!crossed) continue;
      if (Math.abs(st.om) < V_MIN) continue;                       // a graze, not a strike
      if (st.t - st.last[i] < REFRACTORY) continue;                // one pass, one ring
      st.last[i] = st.t;
      const vel = Math.max(0, Math.min(1, Math.abs(st.om) / V_REF));
      const hit = { tube: i, t: st.t, vel };
      st.strikes.push(hit); fired.push(hit);
      st.om *= (1 - STRIKE_LOSS);                                  // the tube takes its due
    }
    // THE RACK'S EDGE: the clapper cannot swing out of its own ring of tubes. It
    // meets the edge and rebounds, losing energy — so no wind, however hard, can
    // send it over the top into a spin.
    if (st.th > THETA_MAX){ st.th = THETA_MAX; if (st.om > 0) st.om = -st.om * BOUNCE; }
    else if (st.th < -THETA_MAX){ st.th = -THETA_MAX; if (st.om < 0) st.om = -st.om * BOUNCE; }
  }

  return {
    st, freqs, angles, taus,
    // advance the room by `dt` seconds; returns the strikes that fired in that span.
    step(dt){
      const fired = [];
      const d = Math.max(0, Math.min(0.1, dt));      // clamp a long tab-switch gap
      const h = d / SUBSTEPS;
      for (let s = 0; s < SUBSTEPS; s++) substep(h, fired);
      return fired;
    },
    // THE REAL ENTRY FN the twin drives: a gust of the wind. It kicks the sail
    // (an impulse on the swing) AND raises the breeze for a moment, exactly as a
    // real gust does — this is what the page's WindField calls, and what the
    // payoff-liveness twin calls. Never a synthetic pointer event.
    gust(strength){
      const s = Math.max(0, strength);
      st.om += GUST_KICK * s * (st.om >= 0 ? 1 : -1);   // push the way it is already going
      st.surge += 0.55 * s;
    },
    // the steady wind level — the air's floor plus the manual breeze slider.
    setBreeze(b){ st.breeze = Math.max(0, b); },
    // DIRECT PLAY: flick the clapper itself (a real pointer velocity → angular velocity).
    flickClapper(omega){ st.om += omega; },
    // DIRECT PLAY: flick ONE tube to ring just it, in dead calm.
    strikeTube(i, vel){
      if (i < 0 || i >= angles.length) return null;
      const v = Math.max(0.02, Math.min(1, vel));
      const hit = { tube: i, t: st.t, vel: v };
      st.last[i] = st.t; st.strikes.push(hit);
      return hit;
    },
    // the swing's mechanical energy (per unit mass·L²) — the free-decay witness.
    energy(){ return 0.5 * st.om * st.om + (G / L_CORD) * (1 - Math.cos(st.th)); },
    // render everything this room has rung so far, as one buffer.
    render(seconds, sr){ return renderStrikes(st.strikes, seconds, sr, freqs); },
  };
}

// ── runChimeSelfTest(semiToFreqFn, sr) — the SOLE ORACLE. This is a delight-first
// leaf, so this is NOT a theorem: it is the PAYOFF-LIVENESS oracle. It asserts that
// the room's payoff actually FIRES on the real path, and that the one correctness
// constraint (the tuning) holds. Same shape as the sibling leaves:
// { pass, total, lines:[{name, ok, detail}] }. The Node twin calls THIS.
//   1 THE WIND MOVES IT   — from rest, the REAL gust() swings the clapper.
//   2 A STRIKE FIRES      — that swing emits a strike with a tube index and vel > 0.
//   3 RISE THEN DECAY     — the struck tube's MEASURED envelope climbs to a peak
//                           just after onset and then decays away (the payoff).
//   4 IN TUNE             — every tube fundamental is a degree of A-pentatonic,
//                           from the imported pitch law (the one constraint).
//   5 WELL-FORMEDNESS     — dead calm is digital silence · an undriven swing decays
//                           monotonically to rest · a five-tube cluster never clips.
function runChimeSelfTest(semiToFreqFn, sr = DEFAULT_SR){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const freqs = tubeFreqs(semiToFreqFn);

  // LEG 1 — THE WIND MOVES IT: a room at dead rest, given a real gust() and then
  //   stepped, swings. The clapper's angular amplitude has to climb well clear of a
  //   floor — "the wind moved it" is measured, not assumed.
  {
    const c = createChime({ freqs, seed: 3 });
    const rest = Math.abs(c.st.th);
    c.gust(1.0);
    let amp = 0;
    for (let i = 0; i < 240; i++){ c.step(1 / 60); amp = Math.max(amp, Math.abs(c.st.th)); }
    const ok = rest === 0 && amp > 0.20;
    T('LEG 1 — the wind moves it: a room at dead rest (θ = 0), given the REAL gust() and stepped for 4 s, swings the clapper to a real amplitude — the payoff\'s first link, driven through the room\'s own entry fn (never a synthetic pointer event)',
      ok, `at rest θ = ${rest} → peak |θ| = ${amp.toFixed(3)} rad (> 0.20 floor)`);
  }

  // LEG 2 — A STRIKE FIRES: that same gust must actually RING something — a strike
  //   with a real tube index and a nonzero impact velocity. This is the payoff.
  {
    const c = createChime({ freqs, seed: 3 });
    c.gust(1.0);
    for (let i = 0; i < 240; i++) c.step(1 / 60);
    const hits = c.st.strikes;
    const idxOk = hits.every(h => h.tube >= 0 && h.tube < freqs.length);
    const velOk = hits.every(h => h.vel > 0) && hits.length > 0;
    const tubesRung = new Set(hits.map(h => h.tube)).size;
    const ok = hits.length > 0 && idxOk && velOk;
    T('LEG 2 — a strike FIRES: the gusted swing emits real strike events, each carrying a valid tube index and an impact velocity > 0 — the wind rings the chimes (the payoff, asserted on the live path)',
      ok, `${hits.length} strikes on ${tubesRung} distinct tubes · all indices valid: ${idxOk} · all vel > 0: ${velOk} · first: tube ${hits.length ? hits[0].tube : '—'} vel ${hits.length ? hits[0].vel.toFixed(3) : '—'}`);
  }

  // LEG 3 — RISE THEN DECAY (the literal gain-up-then-down payoff): render a single
  //   strike and measure its loudness envelope from the AUDIO. It must be silent at
  //   the instant of onset, climb to a peak just AFTER onset (not at t=0 — that is
  //   what makes it a struck tube and not a switch), and then fall away, ending far
  //   below its peak with no rise back. Both the design's literal check
  //   (env(τ_atk) > env(0), env(late) < env(τ_atk)) and the measured-envelope scan.
  {
    const fLo = Math.min.apply(null, freqs);
    const f0 = freqs[0], tau0 = tubeTau(f0, fLo);
    // (a) the analytic curve, exactly as the design words it
    const e0 = env(0, TAU_ATK, tau0);
    const eAtk = env(TAU_ATK, TAU_ATK, tau0);
    const eLate = env(2.5, TAU_ATK, tau0);
    const analytic = e0 === 0 && eAtk > e0 && eLate < eAtk;
    // (b) the MEASURED envelope of the rendered audio. Rendered over THREE decay
    //   time-constants of this tube (not a fixed clock), so "it died away" is judged
    //   against the tail the tube actually has rather than an arbitrary window.
    const buf = renderStrike(f0, 0.9, tau0 * 3, sr, tau0);
    const envl = rmsEnvelope(buf, sr, 30);
    let pi = 0; for (let i = 1; i < envl.length; i++) if (envl[i] > envl[pi]) pi = i;
    const rose = pi > 0;                              // the peak is NOT at the onset
    const early = pi * 30 <= 150;                     // and it arrives within ~150 ms
    // after the peak the envelope only falls (a labeled 5% band absorbs the mild
    // beating between four inharmonic partials)
    let mono = true;
    for (let i = pi + 1; i < envl.length; i++) if (envl[i] > envl[i - 1] * 1.05) mono = false;
    const died = envl[envl.length - 1] < envl[pi] * 0.10;
    const ok = analytic && rose && early && mono && died;
    T('LEG 3 — the strike RISES then DECAYS: the rendered strike is silent at onset, climbs to a peak just after it (~40 ms, never at t=0), then falls monotonically to a whisper — measured off the AUDIO, not merely off the formula. This one curve drives the glow too, so the eye sees the ring decay',
      ok, `env(0) = ${e0} · env(τ_atk) = ${eAtk.toFixed(3)} · env(2.5 s) = ${eLate.toFixed(3)} (analytic rise-then-decay: ${analytic}) · measured peak at ${(pi * 30)} ms (rose: ${rose}, early: ${early}), post-peak non-increasing to a 5% band: ${mono}, ends at ${(envl[envl.length - 1] / envl[pi] * 100).toFixed(1)}% of peak`);
  }

  // LEG 4 — IN TUNE BY CONSTRUCTION (the ONE correctness constraint): every tube's
  //   fundamental is a degree of A-major-pentatonic, computed from the IMPORTED
  //   pitch law — never a re-typed Hz literal. Because every subset of a pentatonic
  //   scale is consonant, no chord the wind can strike is able to sound wrong.
  {
    const want = PENT_SEMIS.map(semiToFreqFn);
    let worst = 0;
    for (let i = 0; i < freqs.length; i++) worst = Math.max(worst, Math.abs(freqs[i] - want[i]));
    const rising = freqs.every((f, i) => i === 0 || f > freqs[i - 1]);
    // the pentatonic's shape, in semitones: A→B→C#→E→F# is 2,2,3,2 (no semitone step,
    // which is exactly why no two of its degrees can clash).
    const steps = PENT_SEMIS.slice(1).map((s, i) => s - PENT_SEMIS[i]);
    const noHalfSteps = steps.every(s => s >= 2);
    const ok = worst === 0 && rising && noHalfSteps && freqs.length === 5;
    T('LEG 4 — in tune by construction (the one correctness constraint): all five tube fundamentals are degrees of A-major-pentatonic computed from the IMPORTED pitch law (bit-identical, no re-typed Hz), rising in order, with no half-step anywhere in the set — so every chord the wind can strike is consonant and the room cannot sound wrong',
      ok, `${freqs.map((f, i) => PENT_SEMIS[i] + ':' + f.toFixed(2) + 'Hz').join(' · ')} · worst Δ vs the pitch law ${worst} · rising ${rising} · steps [${steps.join(',')}] semitones, none < 2: ${noHalfSteps}`);
  }

  // LEG 5 — WELL-FORMEDNESS, three ways.
  //   (a) DEAD CALM IS SILENCE: breeze 0 from rest → no strikes at all, and the
  //       offline render is digital silence. The room is silent until something
  //       moves it — nothing hums on its own.
  //   (b) THE UNDRIVEN SWING DIES: set swinging with the wind OFF, its mechanical
  //       energy decreases monotonically to rest. `c` is real damping, not decoration.
  //   (c) NO CLIP: a five-tube gust cluster, all struck hard at once, stays under
  //       full scale — the soft limiter means an overlap can never clip.
  {
    const calm = createChime({ freqs, seed: 5 });
    calm.setBreeze(0);
    for (let i = 0; i < 600; i++) calm.step(1 / 60);              // 10 s of dead calm
    const calmBuf = calm.render(2.0, sr);
    const calmRms = rms(calmBuf, 0, calmBuf.length);
    const silent = calm.st.strikes.length === 0 && calmRms === 0;

    const free = createChime({ freqs, seed: 5 });
    free.setBreeze(0); free.flickClapper(1.6);                    // swung, then left alone
    const e0free = free.energy();
    let e = e0free, monoDecay = true, worstRise = 0;
    for (let i = 0; i < 1800; i++){                                // 30 s, undriven
      free.step(1 / 60);
      const e2 = free.energy();
      if (e2 > e){ monoDecay = false; worstRise = Math.max(worstRise, e2 - e); }
      e = e2;
    }
    // "came to rest" is stated RELATIVE to the energy it started with: after 30 s of
    // undriven swinging it must retain under a thousandth of it.
    const cameToRest = e < e0free * 1e-3;

    const cluster = [0, 1, 2, 3, 4].map(i => ({ tube: i, t: 0.0, vel: 1.0 }));
    const cbuf = renderStrikes(cluster, 4.0, sr, freqs);
    const cpk = peak(cbuf, 0, cbuf.length);
    let atFullScale = 0; for (let i = 0; i < cbuf.length; i++) if (Math.abs(cbuf[i]) >= 0.999) atFullScale++;
    const noClip = cpk < 0.999 && atFullScale === 0;

    const ok = silent && monoDecay && cameToRest && noClip;
    T('LEG 5 — well-formed three ways: dead calm rings NOTHING and renders digital silence (the room never hums on its own) · an undriven swing loses energy monotonically and comes to rest (the damping is real) · and five tubes struck at full force at the same instant peak below full scale (the soft limiter means an overlap can never clip)',
      ok, `calm: ${calm.st.strikes.length} strikes, rms ${calmRms} · free swing over 30 s: monotone decay ${monoDecay}${monoDecay ? '' : ' (worst rise ' + worstRise.toExponential(2) + ')'}, energy ${e0free.toExponential(2)} → ${e.toExponential(2)} (${(e / e0free * 100).toExponential(1)}% of start, at rest: ${cameToRest}) · 5-tube cluster peak ${cpk.toFixed(4)} (< 0.999), full-scale samples ${atFullScale}`);
  }

  // LEG 6 — BOUNDED IN ANY WIND (the build hazard, checked). A driven pendulum with
  //   no bound eventually goes OVER THE TOP and rotates — and a spinning clapper is
  //   not a chime: it rings almost nothing, because every tube falls inside its own
  //   refractory window. So at FOUR TIMES the strongest wind the room can be asked
  //   for, the clapper must stay finite, stay inside its rack (|θ| ≤ THETA_MAX), and
  //   still ring every tube. The rack's edge is what makes a storm loud, not broken.
  {
    const c = createChime({ freqs, seed: 11 });
    c.setBreeze(4.0);                                  // 4× the UI's maximum
    let finite = true, worst = 0;
    for (let i = 0; i < 3600; i++){
      c.step(1 / 60);
      if (!Number.isFinite(c.st.th) || !Number.isFinite(c.st.om)){ finite = false; break; }
      worst = Math.max(worst, Math.abs(c.st.th));
    }
    const inRack = worst <= THETA_MAX + 1e-9;
    const rung = new Set(c.st.strikes.map(h => h.tube)).size;
    const ok = finite && inRack && rung === freqs.length;
    T('LEG 6 — bounded in any wind (the hazard, checked): driven at FOUR TIMES the strongest breeze the room offers, for a minute, the clapper stays finite and stays inside its own rack (|θ| ≤ the rack edge) instead of going over the top into a spin — and it still rings all five tubes. A storm is loud here, never broken',
      ok, `breeze 4.0 for 60 s → finite ${finite}, peak |θ| ${worst.toFixed(4)} rad ≤ rack edge ${THETA_MAX} (${inRack}), ${c.st.strikes.length} strikes across ${rung}/${freqs.length} tubes`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== CHIME CORE END =====

export {
  PENT_SEMIS, TUBE_ANGLES, TUBE_RATIOS, TUBE_AMPS,
  G, L_CORD, DAMP_C, WIND_K, SUBSTEPS, GUST_KICK, SURGE_TAU, OMEGA0,
  V_MIN, V_REF, REFRACTORY, STRIKE_LOSS, THETA_MAX, BOUNCE,
  TAU_ATK, TAU_REF, DECAY_FALL, BRIGHT_FLOOR, LIMIT, DEFAULT_SR,
  tubeFreqs, tubeLengths, tubeTau, env, partialTau, partialAmp,
  tubeSample, strikeEnvelope, renderStrike, limit, renderStrikes,
  rms, peak, rmsEnvelope, createChime, runChimeSelfTest,
  semiToFreq, noteName,
};
