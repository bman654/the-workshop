/* ============================================================================
   A MESSAGE, CAST TO THE TIDE · liveness.test.mjs — the PAYOFF-LIVENESS TWIN

   This is not a theorem test (the piece makes no math claim). It proves the
   PAYOFF FIRES on the REAL path — the same drift/store/corpus code the page
   runs — with an INJECTED clock and an INJECTED storage backend, never a
   synthetic canvas event. A dead payoff (a bottle that never comes home, a
   voyage lost on reload) fails here loudly.

   Run:  node night-shore/liveness.test.mjs
   ============================================================================ */

import {
  plan, weather, dueBottles, resolveReturn, tideStatus,
  driftLabel, DRIFT_MIN_MS, DRIFT_MAX_MS
} from './drift.mjs';
import { makeStore, normalize, STORE_KEY, STORE_V } from './store.mjs';
import { pickCorpus, DRIFT_POOL, CORPUS_SIZE } from './corpus.mjs';

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } }
function eq(a, b, msg) { ok(Object.is(a, b) || a === b, msg + '  (got ' + a + ', want ' + b + ')'); }

// a fake localStorage backend (drives the REAL store path; no browser needed)
function fakeBackend() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}
// a deterministic corpus picker seeded per call (so 'sea' returns are reproducible)
function seededPick(seed) {
  let s = seed >>> 0;
  const rng = () => { s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) >>> 0; return (s >>> 8) / 16777216; };
  return used => pickCorpus(used, rng);
}
function mkBottle(o) {
  const range = o.range;
  const { driftMs } = plan({ range });
  return { text: o.text, castAt: o.castAt, driftMs, seed: o.seed, carries: o.carries || 'own', range };
}

// ── DoD (1): a cast PERSISTS + timestamps the bottle ─────────────────────────
(function castPersists() {
  const back = fakeBackend();
  const store = makeStore(back);
  const now = 1_000_000;
  const b = mkBottle({ text: 'find me by the low light', castAt: now, seed: 424242, range: 0.2, carries: 'own' });
  store.cast(b);
  // read the RAW persisted blob straight from the backend — proves it hit storage
  const raw = back.getItem(STORE_KEY);
  ok(!!raw, '(1) a cast wrote a blob to storage');
  const blob = JSON.parse(raw);
  eq(blob.v, STORE_V, '(1) blob carries the store version');
  eq(blob.fleet.length, 1, '(1) one bottle in flight');
  const p = blob.fleet[0];
  eq(p.text, 'find me by the low light', '(1) text persisted');
  eq(p.castAt, now, '(1) castAt timestamped');
  ok(p.driftMs > 0, '(1) driftMs planned + persisted');
  eq(p.seed, 424242, '(1) seed persisted (voyage identity)');
})();

// ── DoD (2): advancing the clock LANDS a return whose weathering matches ──────
(function returnMatchesWeather() {
  const back = fakeBackend();
  const store = makeStore(back);
  const castAt = 5_000_000;
  const b = mkBottle({ text: 'the tide will decide', castAt, seed: 99, range: 0.95, carries: 'own' });
  store.cast(b);
  const driftMs = b.driftMs;
  // before arrival: NOT due, empty-ish tide (see check 4 too)
  ok(dueBottles(store.get().fleet, castAt + driftMs - 1).length === 0, '(2) not due one ms early');
  // advance the fake clock to exactly driftMs → the voyage completes
  const now = castAt + driftMs;
  const arrival = resolveReturn(store, now, seededPick(7));
  ok(arrival !== null, '(2) a bottle came home when the clock reached driftMs');
  ok(arrival.text && arrival.text.length > 0, '(2) the returned bottle carries non-empty words');
  // weathering on the arrival == the deterministic weather() for that elapsed
  const w = weather(b, now);
  eq(arrival.weather.barnacleCount, w.barnacleCount, '(2) barnacleCount matches deterministic weather');
  eq(arrival.weather.tideStain, w.tideStain, '(2) tideStain matches deterministic weather');
  eq(arrival.weather.stampedDays, w.stampedDays, '(2) "adrift N days" stamp matches elapsed');
  eq(arrival.weather.stamp, w.stamp, '(2) wax-seal legend matches elapsed');
  // a ~3-day voyage should read as visibly weathered + days-adrift
  ok(w.stampedDays >= 2, '(2) a mighty heave reads as multiple days adrift');
  ok(w.barnacleCount >= 8, '(2) a long voyage grew barnacles');
  // and it left the in-flight fleet + joined the ashore shelf
  eq(store.get().fleet.length, 0, '(2) the returned bottle left the fleet');
  eq(store.get().ashore.length, 1, '(2) it joined the washed-ashore shelf');
})();

// ── DoD (2b): a 'sea' bottle returns a REAL corpus line ──────────────────────
(function seaReturnsCorpus() {
  const back = fakeBackend();
  const store = makeStore(back);
  const castAt = 2_000_000;
  const b = mkBottle({ text: 'my own words', castAt, seed: 3, range: 0.4, carries: 'sea' });
  store.cast(b);
  const arrival = resolveReturn(store, castAt + b.driftMs, seededPick(11));
  eq(arrival.source, 'sea', '(2b) a sea-carrying bottle returns a stranger line');
  ok(DRIFT_POOL.indexOf(arrival.text) >= 0, '(2b) the returned line is a REAL corpus fragment');
  ok(arrival.text !== 'my own words', '(2b) the sea sent another voice, not the cast text');
  ok(store.get().corpusUsed.indexOf(arrival.corpusIndex) >= 0, '(2b) the received line was ledgered');
})();

// ── DoD (3): RESTORE — a re-hydrated store RESUMES the same voyage mid-drift ──
(function restoreResumes() {
  const back = fakeBackend();
  const store1 = makeStore(back);
  const castAt = 8_000_000;
  const b = mkBottle({ text: 'still out there', castAt, seed: 777, range: 0.6, carries: 'own' });
  store1.cast(b);
  const driftMs = b.driftMs;
  // "close the tab" mid-drift, re-open from the SAME persisted backend
  const midNow = castAt + Math.floor(driftMs / 2);
  const store2 = makeStore(back);           // fresh store, same storage
  const s2 = store2.get();
  eq(s2.fleet.length, 1, '(3) the voyage survived the reload');
  const r = s2.fleet[0];
  eq(r.seed, 777, '(3) same seed — no bottle teleported');
  eq(r.castAt, castAt, '(3) same castAt — the voyage resumes, not restarts');
  eq(r.driftMs, driftMs, '(3) same driftMs — the ETA is unchanged');
  ok(dueBottles(s2.fleet, midNow).length === 0, '(3) mid-drift it is correctly still at sea');
  // and it still lands at the ORIGINAL eta, not a reload-reset one
  ok(dueBottles(s2.fleet, castAt + driftMs).length === 1, '(3) it lands at the original eta');
})();

// ── DoD (4): EMPTY-TIDE — a graceful state BEFORE any bottle is due ───────────
(function emptyTide() {
  const back = fakeBackend();
  const store = makeStore(back);
  // truly empty fleet
  let st = tideStatus(store, 0);
  ok(st.empty, '(4) an empty fleet reports an empty tide');
  eq(st.due, 0, '(4) nothing due on an empty tide');
  ok(resolveReturn(store, 999, seededPick(1)) === null, '(4) resolveReturn is null on empty tide');
  // a cast that has NOT yet arrived → not empty, but nothing due
  const castAt = 100;
  const b = mkBottle({ text: 'just left', castAt, seed: 5, range: 0.9, carries: 'own' });
  store.cast(b);
  st = tideStatus(store, castAt + 10);
  ok(!st.empty, '(4) a bottle in flight is not an empty tide');
  eq(st.inFlight, 1, '(4) one bottle in flight');
  eq(st.due, 0, '(4) nothing due before the eta');
  ok(st.nextDueAt === castAt + b.driftMs, '(4) reports the soonest homecoming');
  ok(resolveReturn(store, castAt + 10, seededPick(1)) === null, '(4) no return before the eta');
})();

// ── PLUS: driftMs is MONOTONIC in range across synthetic throws ──────────────
(function monotonicDrift() {
  let prev = -1, mono = true;
  for (let i = 0; i <= 20; i++) {
    const d = plan({ range: i / 20 }).driftMs;
    if (d < prev) mono = false;
    prev = d;
  }
  ok(mono, 'monotonic: a harder heave never shortens the voyage');
  ok(plan({ range: 0 }).driftMs === Math.round(DRIFT_MIN_MS), 'a gentle lob is the min drift');
  ok(plan({ range: 1 }).driftMs === Math.round(DRIFT_MAX_MS), 'a mighty heave is the max drift');
  ok(driftLabel(plan({ range: 0 }).driftMs).indexOf('min') >= 0, 'the min lob tags in minutes');
  ok(driftLabel(plan({ range: 1 }).driftMs).indexOf('day') >= 0, 'the max heave tags in days');
})();

// ── PLUS: weather() is DETERMINISTIC (same elapsed → same weathering) ─────────
(function weatherDeterministic() {
  const b = { text: 'x', castAt: 0, driftMs: DRIFT_MAX_MS, seed: 12321 };
  const w1 = weather(b, DRIFT_MAX_MS);
  const w2 = weather(b, DRIFT_MAX_MS);
  eq(w1.barnacleCount, w2.barnacleCount, 'weather deterministic: barnacles');
  eq(w1.tideStain, w2.tideStain, 'weather deterministic: tide-stain');
  eq(w1.amount, w2.amount, 'weather deterministic: amount');
  // monotone: more elapsed never LESS weathered
  const early = weather(b, DRIFT_MAX_MS / 4);
  ok(early.amount <= w1.amount, 'weather monotone: later is not less weathered');
  ok(early.barnacleCount <= w1.barnacleCount, 'weather monotone: barnacles grow');
})();

// ── PLUS: corpus no-repeat until exhausted, then resets ──────────────────────
(function corpusNoRepeat() {
  const pick = seededPick(2024);
  const used = [];
  const seen = new Set();
  let sawReset = false;
  for (let i = 0; i < CORPUS_SIZE; i++) {
    const p = pick(used);
    ok(!seen.has(p.index), 'corpus no-repeat: index ' + p.index + ' not seen before exhaustion');
    seen.add(p.index); used.push(p.index);
  }
  eq(seen.size, CORPUS_SIZE, 'corpus: every line came ashore before any repeat');
  // one more draw → the pool has reset (received treated empty)
  const after = pick(used);
  sawReset = after.reset === true;
  ok(sawReset, 'corpus: the pool resets once exhausted');
})();

// ── PLUS: Store round-trips, INCLUDING the in-memory fallback path ────────────
(function storeRoundTrips() {
  // (a) normal backend round-trip
  const back = fakeBackend();
  const s = makeStore(back);
  s.set({ fleet: [{ text: 'a', castAt: 1, driftMs: 2, seed: 3, carries: 'own', range: 0.1 }], corpusUsed: [4, 5] });
  const got = makeStore(back).get();
  eq(got.fleet.length, 1, 'store round-trip: fleet survived');
  eq(got.corpusUsed.join(','), '4,5', 'store round-trip: corpusUsed survived');
  ok(!s.onMemory(), 'store: a working backend does not use memory');
  // (b) a THROWING backend (quota / private mode) → in-memory fallback, still round-trips
  const bad = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceeded'); } };
  const sm = makeStore(bad);
  sm.cast({ text: 'kept in memory', castAt: 9, driftMs: 10, seed: 11, carries: 'own', range: 0.2 });
  ok(sm.onMemory(), 'store: a throwing backend falls back to memory');
  const m = sm.get();
  eq(m.fleet.length, 1, 'store fallback: the bottle is still there this session');
  eq(m.fleet[0].text, 'kept in memory', 'store fallback: round-trips in memory');
  // (c) a garbage blob normalizes to a fresh state (never throws)
  const gb = { getItem: () => '}{ not json', setItem() {} };
  eq(makeStore(gb).get().fleet.length, 0, 'store: a corrupt blob normalizes to empty, no throw');
  eq(normalize(null).v, STORE_V, 'normalize: a null blob yields a fresh versioned state');
})();

// ── report ───────────────────────────────────────────────────────────────────
const total = pass + fail;
if (fail === 0) console.log('PASS  night-shore liveness twin — ' + pass + '/' + total + ' checks green');
else console.error('FAIL  night-shore liveness twin — ' + fail + ' of ' + total + ' checks failed');
process.exit(fail === 0 ? 0 : 1);
