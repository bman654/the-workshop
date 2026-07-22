/* ============================================================================
   A MESSAGE, CAST TO THE TIDE · store.mjs — the fleet, kept (PURE-ish)

   A versioned localStorage store for the in-flight fleet, the washed-ashore
   shelf, and the received-corpus set. It degrades gracefully: if localStorage
   is unavailable (private mode) or throws (quota), it falls back to an in-memory
   object so the scene still runs for the session — a bottle is never lost to a
   thrown setItem. The Node twin injects a fake backend to prove both the
   round-trip AND the in-memory fallback path without a browser.

   Blob shape at ws:night-shore  →  { v:1, fleet:[…], ashore:[…], corpusUsed:[…] }
     fleet   : [{ text, castAt, driftMs, seed, carries, range }]  — in flight
     ashore  : [{ text, source, corpusIndex, castAt, driftMs, seed, arrivedAt, weather }]
     corpusUsed : [int]   — corpus indices already received (no-repeat ledger)
   ============================================================================ */

export const STORE_KEY = 'ws:night-shore';
export const STORE_V = 1;

function freshState() {
  return { v: STORE_V, fleet: [], ashore: [], corpusUsed: [] };
}

// migrate/repair any parsed blob into the current shape (never throw on a bad blob).
export function normalize(o) {
  const s = freshState();
  if (o && typeof o === 'object') {
    if (Array.isArray(o.fleet)) s.fleet = o.fleet.filter(b => b && typeof b.text === 'string');
    if (Array.isArray(o.ashore)) s.ashore = o.ashore.filter(a => a && typeof a.text === 'string');
    if (Array.isArray(o.corpusUsed)) s.corpusUsed = o.corpusUsed.filter(i => Number.isFinite(i));
  }
  return s;
}

// makeStore(backend?) — backend is any { getItem, setItem } (localStorage-shaped).
// Omit it and the store tries the ambient localStorage, falling back to memory.
// Pass an explicit backend (or a null/throwing one) to drive the fallback in tests.
export function makeStore(backend) {
  let mem = null;            // the in-memory fallback blob (string), lazily used
  let usingMem = false;

  function ls() {
    if (backend !== undefined) return backend;         // explicit (may be null)
    try { return (typeof localStorage !== 'undefined') ? localStorage : null; }
    catch (e) { return null; }
  }

  function rawGet() {
    if (usingMem) return mem;
    const b = ls();
    if (!b) { usingMem = true; return mem; }
    try { return b.getItem(STORE_KEY); }
    catch (e) { usingMem = true; return mem; }
  }

  function rawSet(str) {
    const b = usingMem ? null : ls();
    if (b) {
      try { b.setItem(STORE_KEY, str); return; }
      catch (e) { usingMem = true; }   // quota / private-mode → fall to memory
    }
    usingMem = true; mem = str;
  }

  function get() {
    const raw = rawGet();
    if (!raw) return freshState();
    try { return normalize(JSON.parse(raw)); }
    catch (e) { return freshState(); }
  }

  function set(state) {
    const s = normalize(state);
    s.v = STORE_V;
    try { rawSet(JSON.stringify(s)); } catch (e) { /* nothing more we can do */ }
    return s;
  }

  return {
    get, set,
    // append one freshly-cast bottle to the in-flight fleet, persist, return state.
    cast(bottle) {
      const s = get();
      s.fleet.push(bottle);
      set(s);
      return s;
    },
    // is the store currently running from the in-memory fallback?
    onMemory() { return usingMem; },
    key: STORE_KEY
  };
}
