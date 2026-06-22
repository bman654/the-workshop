// The Counting-Out Ring — the logic core (the Josephus problem).
//
// This file is the SINGLE SOURCE OF TRUTH for the math. The page inlines the
// SAME functions verbatim (see index.html's <script> "// ── core (inlined from core.mjs) ──").
// Both the Node twin (core.test.mjs) and the in-page self-test pill call runSelfTest().
//
// THE OBJECT: N chairs in a ring, 1..N. Starting at chair 1, count out by k:
// every k-th still-live chair is eliminated, the count resuming from the next
// live chair. One chair survives. We ask WHICH, and prove the answer three ways
// that must all agree.
//
// INDEXING DISCIPLINE (one canonical seam): the whole UI is 1-indexed (seats
// 1..N). The recurrence J is 0-indexed; the survivor seat = J + 1.

// ── (A) the recurrence — the truth oracle ──
// J(1) = 0; J(i) = (J(i-1) + k) mod i, for i = 2..N.  Returns the 0-indexed
// survivor position; survivor seat (1-indexed) = J + 1.
export function josephusJ(n, k) {
  let j = 0;                         // J(1) = 0
  for (let i = 2; i <= n; i++) j = (j + k) % i;
  return j;
}
// 1-indexed survivor seat from the recurrence.
export function survivorRecurrence(n, k) {
  return josephusJ(n, k) + 1;
}

// ── (B) the live ring simulation — what you WATCH ──
// An independent brute-force: an actual circular array spliced every k-th live
// chair. Returns the full elimination order (1-indexed seat numbers, in the
// order they ASH) with the survivor as the LAST element. The page animates
// exactly THIS array, so the on-screen cull cannot drift from the recurrence.
//
// idx walks the live array; step k-1 forward (the current chair counts as 1),
// wrapping with mod, splice the chair OUT, and if idx === len after splicing
// wrap to 0 (the canonical fence-post-safe seam).
export function eliminationOrder(n, k) {
  const live = [];
  for (let s = 1; s <= n; s++) live.push(s);
  const out = [];
  let idx = 0;
  while (live.length > 1) {
    idx = (idx + k - 1) % live.length;
    out.push(live[idx]);             // this chair ashes
    live.splice(idx, 1);
    if (idx === live.length) idx = 0; // wrapped past the end → resume at front
  }
  out.push(live[0]);                 // the survivor, last
  return out;
}
// 1-indexed survivor seat from the live simulation (= last of the order).
export function survivorSim(n, k) {
  const order = eliminationOrder(n, k);
  return order[order.length - 1];
}

// ── (C) the k=2 closed form — the binary crown ──
// For k=2, write N = 2^m + L with 0 <= L < 2^m. Survivor = 2L + 1.
// Equivalently: take N's binary word and LEFT-ROTATE by one bit (move the
// leading 1 to the least-significant end). That rotated value === 2L+1 === the
// survivor seat directly (e.g. 41=101001 → 010011 = 19).
export function decompose2mL(n) {
  let m = 0;
  while ((1 << (m + 1)) <= n) m++;   // largest m with 2^m <= n
  const L = n - (1 << m);
  return { m, L, pow: 1 << m };
}
export function survivorClosedForm2(n) {
  const { L } = decompose2mL(n);
  return 2 * L + 1;
}
// The binary word of N, MSB first, as an array of 0/1 (length m+1).
export function bitsOf(n) {
  if (n <= 0) return [0];
  const bits = [];
  let v = n;
  while (v > 0) { bits.unshift(v & 1); v >>= 1; }
  return bits;
}
// Left-rotate-by-1 of N's (m+1)-bit word: the leading 1 detaches and lands at
// the right end. Returns the integer value of the rotated word. For k=2 this
// equals the SURVIVOR seat directly (2L+1): e.g. 41=101001 → 010011 = 19.
export function rotateLeft1(n) {
  const bits = bitsOf(n);            // MSB first; bits[0] === 1 for n >= 1
  if (bits.length === 1) return bits[0]; // n=1 → "1" rotates to "1" → 1
  const rotated = bits.slice(1).concat(bits[0]);
  let v = 0;
  for (const b of rotated) v = (v << 1) | b;
  return v;
}

// ── neg-control helpers (defend the headline) ──
// "Next live seat clockwise" of the survivor at game start: the survivor's
// immediate clockwise neighbour (seat survivor+1, wrapping N→1).
export function clockwiseAfter(seat, n) {
  return seat === n ? 1 : seat + 1;
}
// The step (1-indexed position in the elimination order) at which a given seat
// ashes. Returns n if it is the survivor (never ashes mid-sweep). The survivor
// is the last popped, so we treat "death-step" as its index+1 in the order; the
// survivor's death-step is defined as n (it outlasts everyone).
export function deathStep(seat, n, k) {
  const order = eliminationOrder(n, k);
  const i = order.indexOf(seat);
  // order has length n: indices 0..n-2 are eliminations, n-1 is the survivor.
  return i + 1;                      // 1-indexed; survivor → n
}
// The fence-post SLIP: a common off-by-one writes (J(i-1)+k) mod (i+1) instead
// of mod i. This is WRONG. We expose it so the self-test can show it mis-calls.
export function josephusSlipped(n, k) {
  let j = 0;
  for (let i = 2; i <= n; i++) j = (j + k) % (i + 1);
  return j + 1;                      // 1-indexed slipped "survivor"
}
// The naive binary mis-reading: "survivor = N's bits unchanged" (i.e. N itself).
// Only correct when N is a power of two; the rotation does real work otherwise.
export function naiveBinaryUnchanged(n) {
  return n;
}

// ── the self-test (the same battery the page runs) ──
// Returns { pass, total, fails, lines:[{name, ok, detail}] }.
export function runSelfTest() {
  const lines = [];
  const ck = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // (1) RECURRENCE === LIVE SWEEP for every N=1..200, k=2..6 (the headline).
  {
    let ok = true, firstFail = '';
    for (let k = 2; k <= 6 && ok; k++) {
      for (let n = 1; n <= 200; n++) {
        const rec = survivorRecurrence(n, k);
        const sim = survivorSim(n, k);
        if (rec !== sim) { ok = false; firstFail = `N=${n},k=${k}: recurrence ${rec} ≠ sim ${sim}`; break; }
        if (rec < 1 || rec > n) { ok = false; firstFail = `N=${n},k=${k}: survivor ${rec} out of 1..N`; break; }
      }
    }
    ck('recurrence J(N,k)+1 === live ring sim, all N=1..200, k=2..6', ok, firstFail || 'all 995 cases agree');
  }

  // (2) THE ANIMATED ORDER replays the truth: last element popped === survivor,
  //     for a spread of (N,k). (The page animates eliminationOrder() literally.)
  {
    const probes = [[41,2],[5,2],[7,3],[100,4],[200,6],[1,2],[2,5],[13,2],[64,2],[63,2]];
    let ok = true, firstFail = '';
    for (const [n, k] of probes) {
      const order = eliminationOrder(n, k);
      if (order.length !== n) { ok = false; firstFail = `N=${n},k=${k}: order length ${order.length} ≠ N`; break; }
      // every seat appears exactly once
      const seen = new Set(order);
      if (seen.size !== n) { ok = false; firstFail = `N=${n},k=${k}: order not a permutation`; break; }
      if (order[order.length - 1] !== survivorRecurrence(n, k)) {
        ok = false; firstFail = `N=${n},k=${k}: animated survivor ${order[order.length-1]} ≠ recurrence`; break;
      }
    }
    ck('animated elimination order is a permutation; last popped === recurrence survivor', ok, firstFail || '10 probes agree');
  }

  // (3) k=2 CLOSED FORM === recurrence for all N=1..200; AND the binary
  //     left-rotate-by-1 of N's word === survivor (= 2L+1) directly.
  {
    let ok = true, firstFail = '';
    for (let n = 1; n <= 200; n++) {
      const cf = survivorClosedForm2(n);
      const rec = survivorRecurrence(n, 2);
      if (cf !== rec) { ok = false; firstFail = `N=${n}: 2L+1=${cf} ≠ recurrence ${rec}`; break; }
      const rot = rotateLeft1(n);
      if (rot !== rec) { ok = false; firstFail = `N=${n}: rotate=${rot} ≠ survivor=${rec}`; break; }
    }
    ck('k=2: survivor=2L+1 === recurrence; binary left-rotate-1 of N === survivor (N=1..200)', ok, firstFail || 'all 200 agree');
  }

  // (4) NAMED EXAMPLE: J(41,2)+1 === 19 and rotate(101001)=010011=19.
  {
    const s = survivorRecurrence(41, 2);
    const rot = rotateLeft1(41);                // = survivor directly
    const bits = bitsOf(41).join('');           // "101001"
    const rotBits = bitsOf(41).slice(1).concat(bitsOf(41)[0]).join(''); // "010011"
    ck('named example: survivor(41,2)=19 and 101001 →rotate→ 010011 = 19',
       s === 19 && rot === 19 && bits === '101001' && rotBits === '010011',
       `survivor=${s}, rotate=${rot}, ${bits}→${rotBits}`);
  }

  // (5) NEG-CONTROL A — claiming J+1 (the clockwise neighbour of the true
  //     survivor) LOSES: it is eliminated before the end (death-step < N-1... in
  //     fact strictly before the survivor) for a sample of (N,k).
  {
    const probes = [[41,2],[10,2],[13,3],[17,2],[23,5],[7,2]];
    let ok = true, firstFail = '';
    for (const [n, k] of probes) {
      const surv = survivorRecurrence(n, k);
      const claim = clockwiseAfter(surv, n);    // J+1's clockwise neighbour
      if (claim === surv) { ok = false; firstFail = `N=${n},k=${k}: neighbour === survivor (n too small)`; break; }
      const ds = deathStep(claim, n, k);
      // it must ash strictly before the survivor (death-step <= n-1), i.e. it loses
      if (!(ds <= n - 1)) { ok = false; firstFail = `N=${n},k=${k}: neighbour death-step ${ds} not < survivor`; break; }
    }
    ck('neg-control A: the survivor’s clockwise neighbour is eliminated before the end (loses)', ok, firstFail || '6 probes lose');
  }

  // (6) NEG-CONTROL B — the fence-post slip mis-calls: slipped(N=5,k=2) === 5
  //     where the truth is seat 3.
  {
    const truth = survivorRecurrence(5, 2);     // === 3
    const slip = josephusSlipped(5, 2);         // === 5 (wrong)
    ck('neg-control B: fence-post slip mis-calls N=5,k=2 as 5 (truth is 3)',
       truth === 3 && slip === 5 && slip !== truth, `truth=${truth}, slipped=${slip}`);
  }

  // (7) BINARY-VIEW NEG-CONTROL: the naive "survivor = N's bits unchanged"
  //     reading is wrong unless N is a power of two. unchanged(41)=41 ≠ 19.
  {
    const naive = naiveBinaryUnchanged(41);     // 41
    const truth = survivorRecurrence(41, 2);    // 19
    // and confirm it IS right for a power of two (N=32 → survivor 1? no: 2^5,L=0 → survivor 1)
    // For N a power of two, L=0, survivor=1, and rotate(N)=0, naive=N. So naive
    // is NOT generally the survivor even at powers of two; the precise claim is:
    // naive(N) === survivor only when N === survivor, which never holds for N>1.
    ck('binary neg-control: naive "bits unchanged" (41→41) ≠ true survivor (19) — rotation does real work',
       naive === 41 && truth === 19 && naive !== truth, `naive=${naive}, truth=${truth}`);
  }

  // STRUCTURAL: survivor always in 1..N; N=1 → seat 1.
  {
    let ok = true, firstFail = '';
    for (let k = 2; k <= 6 && ok; k++) {
      for (let n = 1; n <= 200; n++) {
        const s = survivorRecurrence(n, k);
        if (s < 1 || s > n) { ok = false; firstFail = `N=${n},k=${k}: survivor ${s} out of range`; break; }
      }
    }
    const one = survivorRecurrence(1, 2) === 1 && survivorRecurrence(1, 6) === 1;
    ck('structural: survivor ∈ 1..N for all probed (N,k); N=1 → seat 1', ok && one, firstFail || 'in range; N=1→1');
  }

  const pass = lines.filter(l => l.ok).length;
  const total = lines.length;
  const fails = lines.filter(l => !l.ok).map(l => l.name + (l.detail ? ' — ' + l.detail : ''));
  return { pass, total, fails, lines };
}
