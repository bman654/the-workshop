// ============================================================================
//  The Extent — every order of the bells, rung once                    (CORE)
//  Pure, dependency-free, Node-importable. Identical code is inlined into
//  index.html between sentinels; this file is the Node-testable twin (the
//  falsifiability harness runs against it, and re-extracts the inlined copy to
//  prove byte-parity — the cardioid/collatz pattern).
//
//  THE MEDIUM: the permutation group Sₙ, made audible. A "row" is the n bells
//  in some order; a "change" rings every order exactly once and returns home.
//  Change-ringers call a tour of all n! orders an EXTENT. The central, almost-
//  unbelievable claim — proven here, not asserted — is that you can visit ALL
//  n! orderings of n objects in a single sequence where EACH step swaps just ONE
//  ADJACENT pair, and the last row returns to the first by one more adjacent
//  swap. That is a Hamiltonian cycle on the permutohedron (the Cayley graph of
//  Sₙ under adjacent transpositions). We ship PLAIN HUNT, which CLOSES the loop.
//
//  WHY n=7 IS MAGIC: 7! = 5040. A full peal of Grandsire/Plain Bob on 7 bells
//  rings all 5040 changes — about three hours of ringing with no order repeated.
//  The self-test PROVES this exhaustively for n=3..7 (5040 rows at n=7).
//
//  ★ ANTI-CIRCULARITY (the "two strangers who must agree"): the WALKER that
//  generates the rows (sjtRows / plain hunt) and the RANKER that addresses them
//  (lehmerRank, a factorial-base / Lehmer-code ranking) share NO code. They are
//  built from different ideas — one a mechanical hunting rule, the other a
//  counting-in-mixed-radix address. The bijection claim is that these two
//  strangers agree: the walker visits each of the n! Lehmer addresses exactly
//  once. If they shared code the agreement would be rigged; they don't, so it
//  is a real proof.
//
//  WHY PLAIN Number ARITHMETIC IS SAFE: every rank is in [0, n!) and the largest
//  n we ever exhaustively walk is 7 (7! = 5040). 8! = 40320 is also exact in a
//  double. n! ≪ Number.MAX_SAFE_INTEGER for every n we touch; all arithmetic is
//  on small integers and exact.
//
//  THE FOUR FALSIFIABLE CLAIMS runSelfTest checks (for n=3..7):
//   (1) BIJECTION: { lehmerRank(row) : row in sjtRows(n) } == exactly {0..n!−1}
//       — every rank hit once, none missing, none twice. The independent ranker
//       is the oracle. ★ANTI-CIRCULARITY: ranker shares no code with the walker.
//   (2) ADJACENCY: every consecutive pair differs by exactly ONE adjacent
//       transposition (adjSwapBetween non-null for all n!−1 consecutive pairs).
//   (3) NEGATIVE CONTROL WITH TEETH: naiveRows(n, n!, seed) — a from-scratch
//       reimplementation of the carillon's mutate() — FAILS the bijection (its
//       rank multiset has repeats and/or misses). The proof BITES.
//   (4) DETERMINISM: sjtRows(n) twice is byte-identical; naiveRows(n,c,seed)
//       twice is byte-identical.
//   (cycle) CLOSURE: adjSwapBetween(lastRow, firstRow) is non-null — plain hunt
//       returns home by one adjacent swap (we ship the CYCLE, honestly).
//
//  PITCH / ORIENTATION CONTRACT: array-index 0 = bell 1 = TREBLE = HIGHEST pitch
//  = leftmost grid column = topmost rope-sight line. sjtRows(n) returns rows of
//  bell IDs 0..n−1; bell 0 is the treble. The page's buildLadder maps index 0
//  to the highest pitch so rounds [0,1,…,n−1] plays a descending peal.
// ============================================================================

// ── THE WALKER — PLAIN HUNT on n bells. ──────────────────────────────────────
// Plain hunt is the simplest change-ringing "method": on each change, the bells
// in positions (0,1),(2,3),(4,5)… swap on even changes, and (1,2),(3,4)… swap on
// odd changes — except the two bells at the ends "hunt" (stay, then turn around).
// Equivalently: alternate two fixed perfect-matchings of adjacent positions. For
// n=2 this gives the trivial 2-row extent; for n≥2 plain hunt on n bells rings
// 2n changes then repeats — that is NOT a full extent for n>2. To get the FULL
// extent we use the classic recursive PLAIN-HUNT-on-Sₙ construction (the
// "Steinhaus–Johnson–Trotter by plain hunting" / zig-zag insertion): take the
// extent on n−1 bells, and weave the nth (highest) bell back and forth through
// each row. Each weave step is one adjacent transposition; threading the new bell
// in and out between rows is also one adjacent transposition; and the whole tour
// CLOSES (the last row returns to the first by a single adjacent swap). This is
// the well-known minimal-change ordering of all permutations.
//
// We build it iteratively (no shared code with the ranker): start from the single
// 1-bell row [0]; to go from the (k)-bell extent to the (k+1)-bell extent, insert
// bell k (the new highest ID) into every position of every existing row, sweeping
// the insertion position DOWN through one row and UP through the next (the zig-
// zag). Adjacent rows produced this way differ by exactly one adjacent swap, and
// the cycle closes.
export function sjtRows(n){
  if (n < 1) return [];
  let rows = [[0]];                       // the 1-bell extent: a single row
  for (let k = 1; k < n; k++){
    const next = [];
    let downward = true;                  // sweep insertion position down, then up
    for (const r of rows){
      const len = r.length;               // = k (positions 0..k, k+1 slots)
      if (downward){
        for (let p = len; p >= 0; p--){    // insert k at position p, p from len→0
          const nr = r.slice(); nr.splice(p, 0, k); next.push(nr);
        }
      } else {
        for (let p = 0; p <= len; p++){    // …and up, 0→len, for the next row
          const nr = r.slice(); nr.splice(p, 0, k); next.push(nr);
        }
      }
      downward = !downward;               // alternate sweep direction (the zig-zag)
    }
    rows = next;
  }
  return rows;
}

// ── THE RANKER — independent factorial-base / Lehmer-code address. ───────────
// The Lehmer code of a permutation: for each position i, count how many later
// elements are smaller than row[i]; that digit is in [0, n−1−i]. Read those n
// digits in the factorial number system (radix (n−1)!,(n−2)!,…,1!,0!) to get a
// unique integer in [0, n!). This is a DIFFERENT idea from plain hunting — it
// counts inversions-to-the-right and mixes radices; it never weaves or sweeps.
// It is the "stranger" the walker must agree with. Shares NO code with sjtRows.
export function lehmerRank(row){
  const n = row.length;
  let rank = 0;
  // factorial table (n−1)! … 0!
  let fact = 1;
  const f = new Array(n);
  for (let i = 0; i < n; i++){ f[i] = fact; fact *= (i + 1); }   // f[i] = i!
  for (let i = 0; i < n; i++){
    let smaller = 0;
    for (let j = i + 1; j < n; j++) if (row[j] < row[i]) smaller++;
    rank += smaller * f[n - 1 - i];       // digit · (n−1−i)!
  }
  return rank;
}

// ── inversions(row): the number of out-of-order pairs (i<j with row[i]>row[j]).
// Independent of the ranker's accumulation — a plain double loop. Parity of this
// flips by exactly 1 on every adjacent transposition (the math behind "one swap
// = one step"). Exposed for readouts and as a cross-check on adjacency.
export function inversions(row){
  const n = row.length;
  let inv = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (row[i] > row[j]) inv++;
  return inv;
}

// ── adjSwapBetween(rowA, rowB) → {pos}|null. ─────────────────────────────────
// If rowB is rowA with exactly one ADJACENT pair (at positions pos, pos+1)
// swapped — and identical everywhere else — return {pos}; otherwise null.
// Display/render glue (the swap annotation, the readouts, the closure check);
// it is NOT used to construct the tour, so it doesn't violate anti-circularity.
export function adjSwapBetween(rowA, rowB){
  if (!rowA || !rowB || rowA.length !== rowB.length) return null;
  const n = rowA.length;
  const diff = [];
  for (let i = 0; i < n; i++) if (rowA[i] !== rowB[i]) diff.push(i);
  if (diff.length !== 2) return null;
  const [a, b] = diff;
  if (b - a !== 1) return null;                       // must be adjacent
  if (rowA[a] === rowB[b] && rowA[b] === rowB[a]) return { pos: a };  // a true swap
  return null;
}

// ── mulberry32 seeded PRNG — lifted BY VALUE from the carillon (carillon.html:186).
// The naive negative control drives its random swaps from this exact RNG so the
// control is a faithful from-scratch reimplementation of the carillon's mutate().
export function makeRng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── THE NEGATIVE CONTROL — naiveRows(n, count, seed). ────────────────────────
// A FROM-SCRATCH pure reimplementation of the carillon's mutate(): start from
// the identity row [0..n−1] and, each round, apply `1 + floor(motion*3 + rng()*1.5)`
// adjacent swaps plus an occasional "bob" (a wider i,i+2 swap when rng < 0.18 +
// 0.2*motion). It produces VALID rows (each a permutation) but makes NO attempt
// to be exhaustive or non-repeating — exactly the musician's drift. Asked to
// produce n! rows it WILL repeat orders and miss orders (it fails the bijection).
// motion is fixed at 0.5 (the carillon's default Motion slider) so the control is
// deterministic in (n, count, seed). The whole point: every seed fails.
export function naiveRows(n, count, seed){
  const motion = 0.5;
  const rng = makeRng(seed);
  const row = [];
  for (let i = 0; i < n; i++) row.push(i);            // identity start
  const out = [row.slice()];
  while (out.length < count){
    // mutate() — lifted by value from carillon.html createScheduler.mutate()
    let swaps = 1 + Math.floor(motion * 3 + rng() * 1.5);   // 1..~5 swaps
    for (let s = 0; s < swaps; s++){
      const i = Math.floor(rng() * (n - 1));
      const t = row[i]; row[i] = row[i + 1]; row[i + 1] = t; // adjacent swap
    }
    if (rng() < 0.18 + 0.2 * motion && n >= 3){             // occasional "bob"
      const i = Math.floor(rng() * (n - 2));
      const t = row[i]; row[i] = row[i + 2]; row[i + 2] = t;
    }
    out.push(row.slice());
  }
  return out;
}

// ── factorial helper (small n only; exact in a double for n ≤ 18). ───────────
export function factorial(n){ let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }

// ── rowsEqual — deep equality of two row sequences (determinism check). ──────
export function rowsEqual(A, B){
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++){
    if (A[i].length !== B[i].length) return false;
    for (let j = 0; j < A[i].length; j++) if (A[i][j] !== B[i][j]) return false;
  }
  return true;
}

// ── THE SOLE AUTHORITATIVE ORACLE — runSelfTest(n). ──────────────────────────
// Runs all four falsifiable claims (plus closure) for the given n. Returns
// { pass, total, lines:[{name, ok, detail}], stats:{isCycle:true, nFact:n!} }.
// The in-page pill and the Node twin both call THIS — one verdict, no second
// opinion (coupling #5). Every detail carries LIVE numbers, never a hardcoded echo.
export function runSelfTest(n = 5){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const nFact = factorial(n);
  const rows = sjtRows(n);

  // 1. BIJECTION — the walker visits each Lehmer address exactly once.
  {
    const seen = new Uint8Array(nFact);
    let dupes = 0, outOfRange = 0, firstDupe = -1;
    for (const r of rows){
      const rk = lehmerRank(r);
      if (rk < 0 || rk >= nFact){ outOfRange++; continue; }
      if (seen[rk]){ dupes++; if (firstDupe < 0) firstDupe = rk; }
      seen[rk] = 1;
    }
    let missing = 0;
    for (let i = 0; i < nFact; i++) if (!seen[i]) missing++;
    const ok = rows.length === nFact && dupes === 0 && missing === 0 && outOfRange === 0;
    T(`bijection onto Sₙ: every Lehmer rank in {0..${nFact}−1} hit exactly once (independent ranker, ★no shared code)`,
      ok,
      ok ? `${rows.length} rows = ${nFact}!; all ranks present, 0 repeats, 0 missing` :
        `rows=${rows.length} · dupes=${dupes}${firstDupe >= 0 ? ` (first @${firstDupe})` : ''} · missing=${missing} · oob=${outOfRange}`);
  }

  // 2. ADJACENCY — every consecutive pair is one adjacent transposition.
  {
    let bad = 0, firstBad = -1, parityOk = true;
    for (let i = 0; i + 1 < rows.length; i++){
      const sw = adjSwapBetween(rows[i], rows[i + 1]);
      if (!sw){ bad++; if (firstBad < 0) firstBad = i; continue; }
      // cross-check: one adjacent swap flips inversion-parity by exactly 1
      if (((inversions(rows[i]) ^ inversions(rows[i + 1])) & 1) !== 1) parityOk = false;
    }
    const ok = bad === 0 && parityOk && rows.length === nFact;
    T(`adjacency: every consecutive pair differs by exactly ONE adjacent transposition (inversion-parity flips each step)`,
      ok,
      ok ? `${rows.length - 1} consecutive pairs, all single adjacent swaps; parity alternates` :
        `${bad} non-adjacent step${bad === 1 ? '' : 's'}${firstBad >= 0 ? ` (first @row ${firstBad})` : ''} · parityOk=${parityOk}`);
  }

  // 3. NEGATIVE CONTROL WITH TEETH — the carillon's drift FAILS the bijection.
  {
    const seed = 1733;                       // the carillon's own default seed
    const nr = naiveRows(n, nFact, seed);
    const seen = new Uint8Array(nFact);
    let dupes = 0, firstDupeRow = -1;
    for (let i = 0; i < nr.length; i++){
      const rk = lehmerRank(nr[i]);
      if (seen[rk]){ dupes++; if (firstDupeRow < 0) firstDupeRow = i; }
      seen[rk] = 1;
    }
    let distinct = 0;
    for (let i = 0; i < nFact; i++) if (seen[i]) distinct++;
    const missed = nFact - distinct;
    // the control BITES iff it is NOT a bijection: it must repeat AND/OR miss.
    const ok = (dupes > 0 || missed > 0) && nr.length === nFact;
    T(`negative control BITES: the carillon's drift (naiveRows, ${nFact} rows, seed ${seed}) is NOT a bijection — it repeats and/or misses`,
      ok,
      ok ? `first repeat at row ${firstDupeRow} of ${nFact}; ${distinct} distinct orders, ${missed} of ${nFact}! never reached` :
        `naive produced a bijection?! dupes=${dupes} missed=${missed} (the proof did NOT bite)`);
  }

  // 4. DETERMINISM — both generators are byte-identical across two calls.
  {
    const s1 = sjtRows(n), s2 = sjtRows(n);
    const n1 = naiveRows(n, Math.min(nFact, 240), 1733), n2 = naiveRows(n, Math.min(nFact, 240), 1733);
    const ok = rowsEqual(s1, s2) && rowsEqual(n1, n2);
    T(`determinism: sjtRows(${n}) byte-identical ×2; naiveRows(${n},·,seed) byte-identical ×2`,
      ok, ok ? `both generators reproducible (pure functions)` : `NON-DETERMINISTIC`);
  }

  // cycle. CLOSURE — plain hunt returns home by one adjacent swap (we ship the cycle).
  {
    const sw = adjSwapBetween(rows[rows.length - 1], rows[0]);
    const ok = !!sw;
    T(`closure: last row → first by one adjacent swap (plain hunt CLOSES — the extent is an honest cycle)`,
      ok, ok ? `row ${nFact - 1} → row 0 swaps positions ${sw.pos}↔${sw.pos + 1}` : `last row does NOT return to first by one swap`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines, stats: { isCycle: true, nFact } };
}
