/* ============================================================================
   A MESSAGE, CAST TO THE TIDE · drift.mjs — the honest consequence (PURE)

   No screen, no store, no clock of its own — every function takes `now` as an
   argument. This is the one place the voyage's arithmetic lives, so the Node
   twin can prove the payoff FIRES (a cast persists, the clock advances, a
   weathered bottle comes home) without a canvas, and the page cannot drift
   from it.

   THE ONE CLAIM the twin proves is not a theorem — it is LIVENESS + honesty:
     • launch energy → drift time is MONOTONIC (a harder heave = a longer voyage);
     • weathering is DETERMINISTIC (same elapsed → same barnacles / stain / stamp);
     • a bottle is DUE exactly when elapsed ≥ its own driftMs;
     • a restored session RESUMES the same voyage (seed/castAt preserved).
   ============================================================================ */

// launch-energy → drift-time, geometric so the feel spans minutes→days.
// A gentle lob (range≈0) is a quick reply; a mighty heave (range≈1) a long voyage.
export const DRIFT_MIN_MS = 3 * 60 * 1000;            // ~3 minutes  — a gentle lob
export const DRIFT_MAX_MS = 3 * 24 * 60 * 60 * 1000;  // ~3 days     — a mighty heave
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

// plan(throw) → { driftMs }. throw carries a normalized splashdown range r∈[0,1].
// driftMs = tMin·(tMax/tMin)^r — strictly increasing in r (the monotonic law).
export function plan(t) {
  const r = clamp01(t && typeof t.range === 'number' ? t.range : 0);
  const driftMs = Math.round(DRIFT_MIN_MS * Math.pow(DRIFT_MAX_MS / DRIFT_MIN_MS, r));
  return { driftMs };
}

// a legible, honest window label for the cork tag ("~7 min" / "~3 hours" / "~2 days").
export function driftLabel(driftMs) {
  if (driftMs >= DAY_MS) {
    const d = Math.round(driftMs / DAY_MS);
    return "~" + d + (d === 1 ? " day" : " days");
  }
  if (driftMs >= HOUR_MS) {
    const h = Math.round(driftMs / HOUR_MS);
    return "~" + h + (h === 1 ? " hour" : " hours");
  }
  const m = Math.max(1, Math.round(driftMs / MIN_MS));
  return "~" + m + (m === 1 ? " min" : " min");
}

// a tiny deterministic hash: (elapsed-bucket, seed) → [0,1). Pure — no RNG state.
function hash01(a, b) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const MAX_BARNACLES = 14;
const WEATHER_FULL_MS = DRIFT_MAX_MS;   // ~3 days at sea reads as fully weathered

// weather(bottle, now) → the deterministic weathering for how long it has been out.
// Every field is a pure function of elapsed (+ the bottle's own seed for placement
// jitter that never changes the COUNTS). Same elapsed → byte-identical weathering.
export function weather(bottle, now) {
  const castAt = bottle && bottle.castAt || 0;
  const driftMs = bottle && bottle.driftMs || DRIFT_MIN_MS;
  const seed = (bottle && bottle.seed | 0) || 1;
  const elapsed = Math.max(0, now - castAt);
  // amount ∈ [0,1]: weathering scales with ABSOLUTE time at sea, so a quick lob comes
  // home nearly pristine and a days-long voyage comes home encrusted. ~3 days = full.
  const amount = clamp01(elapsed / WEATHER_FULL_MS);
  // barnacles: an integer count rising with amount, jittered by seed but DETERMINISTIC.
  const barnacleCount = Math.min(
    MAX_BARNACLES,
    Math.floor(amount * MAX_BARNACLES + hash01(seed, 7) * 0.999)
  );
  // ink fade + paper foxing + sea-glass frosting, all in [0,1], monotone in amount.
  const faded = clamp01(amount * 0.9);          // how far the ink has bled toward the sea
  const frosting = clamp01(amount * amount);    // sea-glass frosting (later than fade)
  const tideStain = clamp01(0.15 + amount * 0.85); // paper foxing / tide-stain coverage
  const algae = clamp01((amount - 0.35) / 0.65); // algae-green creeps in past a third out
  // the stamped wax seal — whole days adrift (0 for a same-session lob; N for a voyage).
  const stampedDays = Math.floor(elapsed / DAY_MS);
  return {
    elapsed, amount, barnacleCount, faded, frosting, tideStain, algae, stampedDays,
    stamp: adriftStamp(elapsed)
  };
}

// the human wax-seal legend, adaptive across minutes → days.
export function adriftStamp(elapsed) {
  if (elapsed >= DAY_MS) {
    const d = Math.floor(elapsed / DAY_MS);
    return "adrift " + d + (d === 1 ? " day" : " days");
  }
  if (elapsed >= HOUR_MS) {
    const h = Math.floor(elapsed / HOUR_MS);
    return "adrift " + h + (h === 1 ? " hour" : " hours");
  }
  const m = Math.floor(elapsed / MIN_MS);
  return "adrift " + m + (m === 1 ? " minute" : " minutes");
}

// dueBottles(fleet, now) → the in-flight bottles whose voyage has completed,
// earliest-arrival first. A bottle is due exactly when elapsed ≥ its own driftMs.
export function dueBottles(fleet, now) {
  const out = [];
  const f = fleet || [];
  for (let i = 0; i < f.length; i++) {
    const b = f[i];
    if (!b) continue;
    if ((now - (b.castAt || 0)) >= (b.driftMs || DRIFT_MIN_MS)) out.push(b);
  }
  out.sort((a, b) => (a.castAt + a.driftMs) - (b.castAt + b.driftMs));
  return out;
}

// resolveReturn(store, now, pick) → the ONE bottle already riding the swell in.
// Reads the fleet from the store, finds the earliest-due bottle, removes it from
// the in-flight fleet, and decides what it CARRIES: your own words come home
// (carries:'own'), or the sea sends another voice (carries:'sea' → a no-repeat
// corpus line via the injected `pick`). Returns null on an empty tide.
//   store: { get(), set(state) } over { v, fleet, ashore, corpusUsed }
//   pick : (usedIndices) => { index, text }   (injected — keeps drift pure)
export function resolveReturn(store, now, pick) {
  const state = store.get();
  const due = dueBottles(state.fleet, now);
  if (due.length === 0) return null;
  const bottle = due[0];
  // pull it out of the fleet (matched by its immutable seed+castAt identity)
  state.fleet = state.fleet.filter(
    b => !(b.seed === bottle.seed && b.castAt === bottle.castAt)
  );
  const w = weather(bottle, now);
  let text, source, corpusIndex = null;
  if (bottle.carries === 'sea' && typeof pick === 'function') {
    const p = pick(state.corpusUsed || []);
    text = p.text; source = 'sea'; corpusIndex = p.index;
    state.corpusUsed = (state.corpusUsed || []).slice();
    if (p.reset) state.corpusUsed = [];
    if (state.corpusUsed.indexOf(p.index) < 0) state.corpusUsed.push(p.index);
  } else {
    text = bottle.text; source = 'own';
  }
  const arrival = {
    text, source, corpusIndex,
    castAt: bottle.castAt, driftMs: bottle.driftMs, seed: bottle.seed,
    arrivedAt: now, weather: w
  };
  state.ashore = (state.ashore || []).slice();
  state.ashore.push(arrival);
  store.set(state);
  return arrival;
}

// a graceful EMPTY-TIDE report — what the scene shows before any bottle is due.
export function tideStatus(store, now) {
  const state = store.get();
  const fleet = state.fleet || [];
  const due = dueBottles(fleet, now);
  return {
    empty: fleet.length === 0 && due.length === 0,
    inFlight: fleet.length,
    due: due.length,
    // the soonest a bottle will come home, or null if the tide is empty
    nextDueAt: fleet.length
      ? Math.min(...fleet.map(b => (b.castAt || 0) + (b.driftMs || DRIFT_MIN_MS)))
      : null
  };
}
