// === CORE BEGIN ===
// The Sultan's Suitors — math core (single source of truth, DOM-free).
//
// THE SECRETARY PROBLEM. n suitors arrive in a uniformly-random order. You observe only the
// RELATIVE rank of each arrival against those already seen ("is this the best so far?"), and
// must irrevocably accept or reject on arrival — no recall. The classic LOOK-THEN-LEAP policy
// with cutoff k: reject (LOOK at) the first k arrivals unconditionally, then accept the first
// arrival thereafter that is the best-so-far; if none appears, you are stuck with the last.
//
// CLOSED FORM — the win probability (probability of crowning the GLOBALLY best suitor):
//     P(win | k, n) = (k/n) · Σ_{i=k+1..n} 1/(i−1)             for 1 ≤ k ≤ n−1
//     P(win | 0, n) = 1/n        (no look = pure luck = catastrophic)
// This is MAXIMISED at k ≈ n/e, with limiting value 1/e ≈ 0.3679 as n→∞. The twin ENUMERATES
// all n! orderings for small n and checks the simulated/closed-form/enumerated values agree.
//
// Everything below is pure: a seedable RNG, a permutation sampler, the policy executor, the
// closed form, the brute-force enumerator, and the argmax-over-k. No DOM, no globals.
//
// This module is the SOLE math authority. It is inlined byte-identical into index.html between
// the CORE BEGIN / CORE END sentinels and tested by core.test.mjs — page & test can never drift.
// LANDMINE NOTE: no `import.meta` may appear in this region (forge inlines it into a non-module
// <script>, where `import.meta` is a syntax error). The Node test below keys off process.argv.

// ── seedable RNG (mulberry32) ──
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── a uniformly-random permutation of [0..n) via Fisher–Yates ──
// We model the court as a permutation `arrival` where arrival[position] = the TRUE quality rank
// of the suitor in that seat. Rank n−1 is the GLOBALLY best (higher = better). The relative-only
// constraint is honoured by the executor: it only ever asks "is arrival[i] > max of earlier?".
function randomPermutation(n, rng){
  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = i;        // ranks 0..n-1, n-1 == best
  for (let i = n - 1; i > 0; i--){
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// ── run the look-then-leap policy on ONE seated court ──
// Returns the full trace so the page can replay it AND a verdict can explain it.
//   arrival : the permutation (arrival[i] = true rank of seat i)
//   k       : look-length (0..n-1)
// Result:
//   chosenSeat   : the seat index we married (always valid; n-1 if forced to the last)
//   forced       : true if we never found a best-so-far in the pick phase and took the last
//   bestSeat     : the seat that actually held the globally-best suitor (rank n-1)
//   won          : chosenSeat === bestSeat  (did we crown the true best?)
//   bestSoFar    : boolean[] — was seat i the best of seats 0..i at arrival? (the relative verdict)
//   thresholdRank: the best TRUE rank seen during the look phase (what pick must beat); -1 if k=0
function runPolicy(arrival, k){
  const n = arrival.length;
  const bestSoFar = new Array(n);
  let runningMax = -1;
  for (let i = 0; i < n; i++){
    bestSoFar[i] = arrival[i] > runningMax;     // RELATIVE verdict: better than all earlier?
    if (arrival[i] > runningMax) runningMax = arrival[i];
  }
  // threshold = best seen in the look phase (seats 0..k-1)
  let thresholdRank = -1;
  for (let i = 0; i < k; i++) if (arrival[i] > thresholdRank) thresholdRank = arrival[i];
  // pick phase: first seat (>= k) that beats the look-phase best
  let chosenSeat = -1, forced = false;
  for (let i = k; i < n; i++){
    if (arrival[i] > thresholdRank){ chosenSeat = i; break; }
  }
  if (chosenSeat === -1){ chosenSeat = n - 1; forced = true; }   // no candidate ⇒ stuck with last
  // the globally-best seat
  let bestSeat = 0; for (let i = 1; i < n; i++) if (arrival[i] > arrival[bestSeat]) bestSeat = i;
  return {
    chosenSeat, forced, bestSeat,
    won: chosenSeat === bestSeat,
    bestSoFar, thresholdRank, k, n
  };
}

// ── the CLOSED FORM: P(win | k, n) ──
function pWinClosed(k, n){
  if (k < 0 || k >= n) { if (k === 0) return 1 / n; return 0; }
  if (k === 0) return 1 / n;
  let s = 0;
  for (let i = k + 1; i <= n; i++) s += 1 / (i - 1);
  return (k / n) * s;
}

// ── argmax over k of the closed form, for a given n ──
function optimalK(n){
  let bestK = 0, bestP = pWinClosed(0, n);
  for (let k = 1; k < n; k++){
    const p = pWinClosed(k, n);
    if (p > bestP){ bestP = p; bestK = k; }
  }
  return { k: bestK, p: bestP };
}

// ── BRUTE FORCE: enumerate ALL n! orderings, count wins for cutoff k (exact, no sampling) ──
// Used by the twin to certify pWinClosed against ground truth. Heap's algorithm walks every
// permutation with a single swap between visits, so this is exact and allocation-light.
function enumerateWins(n, k){
  const perm = new Array(n); for (let i = 0; i < n; i++) perm[i] = i;
  let wins = 0, total = 0;
  const c = new Array(n).fill(0);
  const tally = () => { total++; if (runPolicy(perm, k).won) wins++; };
  tally();
  let i = 0;
  while (i < n){
    if (c[i] < i){
      const j = (i % 2 === 0) ? 0 : c[i];
      const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
      tally();
      c[i]++; i = 0;
    } else { c[i] = 0; i++; }
  }
  return { wins, total, p: wins / total };
}

// ── MONTE CARLO estimate of P(win | k, n) over `trials` random courts ──
function simulateWins(n, k, trials, rng){
  let wins = 0;
  for (let t = 0; t < trials; t++){
    if (runPolicy(randomPermutation(n, rng), k).won) wins++;
  }
  return wins / trials;
}
// === CORE END ===

export {
  mulberry32, randomPermutation, runPolicy,
  pWinClosed, optimalK, enumerateWins, simulateWins
};

// ── Node main-guard (NOT inlined into the page — sits OUTSIDE the CORE sentinels). ──
// Keyed off process.argv[1] (never import.meta), so it is a no-op when imported by the twin and
// a one-line summary when run directly: `node core.mjs`.
if (typeof process !== 'undefined' && process.argv && process.argv[1] &&
    /core\.mjs$/.test(process.argv[1])) {
  const n = 20, opt = optimalK(n);
  console.log(`The Sultan's Suitors core · n=${n} · optimal look k=${opt.k} ` +
    `(≈ n/e=${(n / Math.E).toFixed(2)}) · P(win)=${opt.p.toFixed(4)} → 1/e=${(1 / Math.E).toFixed(4)}`);
}
