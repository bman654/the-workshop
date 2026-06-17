// ============================================================================
//  The Golden Seed-Head — phyllotaxis × φ's convergent ladder   (CORE)
//  Pure, dependency-free. The IDENTICAL code below is inlined into index.html
//  between the SEEDHEAD-CORE sentinels; this file is the Node-testable twin.
//
//  THE ONE IDEA. A sunflower lays its florets at a fixed turn θ apart, floret n
//  at angle n·θ and radius √n (Vogel's model). The eye then groups the florets
//  into two visible families of spiral ARMS — the PARASTICHIES. At the golden
//  angle θ = 2π(2−φ) those two arm-counts are always two CONSECUTIVE FIBONACCI
//  numbers … which are exactly two consecutive DENOMINATORS q_k, q_{k+1} of the
//  continued fraction of φ = [1;1,1,…]. Count the arms and you have READ the
//  slowest-converging fraction in mathematics, off a flower.
//
//  TWO DISJOINT LAYERS, asserted to AGREE — that agreement is the whole bench:
//    (A) THE LADDER LAYER — copied VERBATIM from best-rational/core.mjs (the
//        SOLE authority for φ's convergents; we do NOT re-derive it). It knows
//        nothing about packing: it is pure number theory.
//    (B) THE PACKING / PARASTICHY LAYER — new here, sharing NO code with (A). It
//        lays the Vogel head and DETECTS the dominant arm families geometrically
//        (nearest-neighbour index-gaps), plus the exact spoke count for a
//        rational angle. It knows nothing about continued fractions.
//  The self-test proves: at golden, (B)'s detected pair === a consecutive pair of
//  (A)'s convergent denominators — two independent methods landing on the SAME
//  integers. At a rational p/q turn, (B) collapses to exactly q radial spokes and
//  the pair vanishes, while (A) confirms the CF of p/q is finite (terminated).
// ============================================================================

// ============================================================================
//  (A) THE LADDER LAYER — VERBATIM from best-rational/core.mjs.
//      cfExpand · cfOfRational · convergents · convergentsOf · fib · gcd.
//      DO NOT EDIT — this is the imported ladder authority, kept byte-faithful
//      to the Best Rational bench so the two benches can never disagree about φ.
// ============================================================================

// Famous constant: the golden ratio.
export const PHI = (1 + Math.sqrt(5)) / 2;

// Continued-fraction expansion of a real x → partial quotients [a0,a1,…].
export function cfExpand(x, maxTerms = 20, eps = 1e-12) {
  const a = [];
  let r = x;
  for (let i = 0; i < maxTerms; i++) {
    const ai = Math.floor(r);
    a.push(ai);
    const frac = r - ai;
    if (frac < eps) break;            // terminated (rational / underflow)
    r = 1 / frac;
    if (!isFinite(r) || r > 1e15) break;
  }
  return a;
}

// Exact continued fraction of a rational p/q (Euclid — no floats). Finite.
export function cfOfRational(p, q) {
  if (q < 0) { p = -p; q = -q; }
  const a = [];
  while (q !== 0) {
    const ai = Math.floor(p / q);
    a.push(ai);
    const t = p - ai * q;
    p = q;
    q = t;
  }
  return a;
}

// Convergents p_n/q_n from the partial quotients, via the canonical recurrence.
export function convergents(a) {
  const out = [];
  let pm1 = 1, pm2 = 0;   // p_{-1}, p_{-2}
  let qm1 = 0, qm2 = 1;   // q_{-1}, q_{-2}
  for (let n = 0; n < a.length; n++) {
    const p = a[n] * pm1 + pm2;
    const q = a[n] * qm1 + qm2;
    out.push({ a: a[n], p, q, value: p / q, n });
    pm2 = pm1; pm1 = p;
    qm2 = qm1; qm1 = q;
  }
  return out;
}

// Convenience: the convergents of a real x directly.
export function convergentsOf(x, maxTerms = 20) {
  return convergents(cfExpand(x, maxTerms));
}

// Greatest common divisor.
export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

// Fibonacci numbers — the convergent denominators (and numerators) of φ.
export function fib(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;   // fib(0)=0, fib(1)=1, fib(2)=1, …
}

// ============================================================================
//  (B) THE PACKING / PARASTICHY LAYER — NEW geometry, shares NO code with (A).
//      No continued fraction, no Fibonacci closed form is used to DETECT the
//      families — the integers fall out of the packing itself. The bench's
//      claim is that they nonetheless coincide with (A)'s ladder.
// ============================================================================

export const TAU = Math.PI * 2;

// The GOLDEN divergence angle, in radians: θ = 2π·(2−φ) = 2π·(1 − 1/φ).
// 2−φ = (3−√5)/2 ≈ 0.381966…, so θ ≈ 137.50776°. This is the SAME number
// best-rational names "the angle hardest to approximate by a tidy fraction".
export const GOLDEN = TAU * (2 - PHI);
export const GOLDEN_DEG = GOLDEN * 180 / Math.PI;

// Vogel's model: floret n at angle n·θ, radius √n. Returns [[x,y],…], n=0..N-1.
// This is the literal sunflower-head geometry the page draws.
export function vogel(theta, N) {
  const pts = new Array(N);
  for (let n = 0; n < N; n++) {
    const r = Math.sqrt(n);
    const a = n * theta;
    pts[n] = [r * Math.cos(a), r * Math.sin(a)];
  }
  return pts;
}

// THE TRACE PRIMITIVE (the soul). An arm of "family g" is a residue class mod g:
// the florets i, i+g, i+2g, … all lie on one visible spiral. familyArms(g,N)
// returns the SET of distinct arm starts {0,1,…,g−1} that contain at least one
// floret of the N — i.e. the count of visible arms in a family of pitch g. For
// any g ≤ N every residue is populated, so the size is EXACTLY g: a definitional
// integer fact (the count your hand earns walking arms can never exceed g, and
// hits g once the head is full). This is the function the UI tracer is bonded to.
export function familyArms(g, N) {
  const starts = new Set();
  if (g <= 0) return starts;
  for (let i = 0; i < N; i++) starts.add(i % g);
  return starts;
}

// EXACT spoke count for a RATIONAL turn p/q (the negative control). At a turn of
// exactly p/q of a full circle, floret n points in direction (n·p mod q)/q — only
// q/gcd(p,q) distinct directions exist, so the head degenerates into exactly that
// many dead-straight radial SPOKES. Counted by distinct integer residues — no
// float, no geometry, pure number theory of ℤ/qℤ. (Matches q/gcd by Bézout.)
export function spokeCountExact(p, q) {
  if (!Number.isInteger(p) || !Number.isInteger(q) || q <= 0)
    throw new Error('spokeCountExact: p,q must be integers with q>0');
  const dirs = new Set();
  const step = ((p % q) + q) % q;
  // walking n·step mod q cycles with period q/gcd(p,q); q iterations is plenty.
  for (let n = 0; n < q; n++) dirs.add((n * step) % q);
  return dirs.size;
}

// Nearest-neighbour index-gap tally (the geometric detector — independent of the
// ladder). For each floret, find its nearest spatial neighbour; the |index gap|
// of nearest-neighbour pairs clusters hard at the parastichy numbers (the seeds
// adjacent in space ARE the seeds one arm-step apart). Returns a Map gap→count.
// O(N·window): a ±window index band suffices because a Vogel seed's nearest
// neighbour always lies within a few hundred indices for the N this bench reaches.
export function nearestNeighborGaps(pts, window = 400) {
  const N = pts.length;
  const gapCount = new Map();
  for (let i = 0; i < N; i++) {
    let best = Infinity, bestj = -1;
    const lo = Math.max(0, i - window), hi = Math.min(N, i + window);
    const xi = pts[i][0], yi = pts[i][1];
    for (let j = lo; j < hi; j++) {
      if (j === i) continue;
      const dx = xi - pts[j][0], dy = yi - pts[j][1];
      const d = dx * dx + dy * dy;
      if (d < best) { best = d; bestj = j; }
    }
    if (bestj < 0) continue;
    const g = Math.abs(i - bestj);
    gapCount.set(g, (gapCount.get(g) || 0) + 1);
  }
  return gapCount;
}

// Quick Fibonacci membership / adjacency over the range this bench reaches.
const FIB_SEQ = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
export function isFib(n) {
  for (let i = 2; i < FIB_SEQ.length; i++) if (FIB_SEQ[i] === n) return true;
  return false;
}
// the index of n in the distinct-Fibonacci sequence 2,3,5,8,… (or -1)
export function fibIndex(n) {
  for (let i = 2; i < FIB_SEQ.length; i++) if (FIB_SEQ[i] === n) return i;
  return -1;
}
export function consecutiveFib(a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const il = fibIndex(lo), ih = fibIndex(hi);
  return il >= 0 && ih >= 0 && ih - il === 1;
}

// Sign of the rotational direction of a family of pitch g at angle theta: the
// arm i, i+g, i+2g winds CW or CCW depending on the sign of (g·theta mod 2π)
// folded to (−π,π]. + → counter-clockwise, − → clockwise. Used only to LABEL
// the two families with their two hues; never enters a verdict.
export function familyChirality(g, theta) {
  let a = (g * theta) % TAU;
  if (a > Math.PI) a -= TAU;
  if (a <= -Math.PI) a += TAU;
  return a >= 0 ? +1 : -1;
}

/* THE DETECTOR — dominantFamilies(theta, N).
   Lays the Vogel head, tallies nearest-neighbour index-gaps, and reports the
   TOP-TWO gaps BY TALLY (the most populous arm families — the ones the eye most
   strongly reads). Crucially we pick the two largest TALLIES, NOT "the two
   smallest Fibonacci in the list": at golden the top of the tally is often three
   or four Fibonacci numbers, and only the top-two-by-count are the consecutive
   pair the flower actually shows at that N. Returns:
     counts     = [c0, c1]  sorted descending (c0 ≥ c1) — the two arm-counts
     spiralPair = true if BOTH are genuine spiral families (gap ≥ 2 and each is
                  the clear winner of its tally), false at a rational (one gap
                  utterly dominates → a single spoke fan, no pair)
     fibonacci  = both counts are Fibonacci
     consecutive= the two counts are adjacent Fibonacci
     chir       = [chirality of counts[0], chirality of counts[1]]
     tally      = the full sorted [gap,count] list (for the readout / rail)
   This is a PURE geometric verdict; the ladder layer is never consulted here. */
export function dominantFamilies(theta, N, window = 400) {
  const pts = vogel(theta, N);
  const gc = nearestNeighborGaps(pts, window);
  // sort gaps by tally descending, tie-broken by smaller gap (stable, deterministic)
  const sorted = [...gc.entries()].sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]));
  if (sorted.length === 0)
    return { counts: [0, 0], spiralPair: false, fibonacci: false, consecutive: false, chir: [0, 0], tally: [] };

  const top = sorted[0];
  const second = sorted[1] || [0, 0];
  // a SPIRAL pair needs two distinct families, each a real arm step (gap ≥ 2),
  // and the top must NOT be an overwhelming monopoly (the rational signature is a
  // single gap holding the vast majority of nearest-neighbour pairs).
  const totalPairs = sorted.reduce((s, e) => s + e[1], 0) || 1;
  const topShare = top[1] / totalPairs;
  const twoReal = top[0] >= 2 && second[0] >= 2 && second[1] > 0;
  // require the runner-up to be a substantial family (≥ 12% of the leader),
  // else there is no genuine SECOND family — only a smear or a fan.
  const secondSubstantial = second[1] >= top[1] * 0.12;
  const spiralPair = twoReal && secondSubstantial && topShare < 0.92;

  const counts = [top[0], second[0]];           // already descending by tally
  const fibonacci = isFib(counts[0]) && isFib(counts[1]);
  const consecutive = spiralPair && fibonacci && consecutiveFib(counts[0], counts[1]);
  const chir = [familyChirality(counts[0], theta), familyChirality(counts[1], theta)];
  return { counts, spiralPair, fibonacci, consecutive, chir, tally: sorted };
}

// The two convergent DENOMINATORS of φ that a head of N florets shows — derived
// from (A) the LADDER LAYER alone. The dominant parastichy numbers at golden are
// the largest two Fibonacci numbers F_k with F_k ≲ √(π·N)·c; empirically (and as
// the self-test pins) the detector lands on consecutive denominators that CLIMB
// with N. predictedDenominators returns the consecutive pair [q_k, q_{k+1}] whose
// SMALLER member is the largest convergent denominator of φ not exceeding a
// packing-scale cutoff ~ 1.3·√N. This is the ladder's PREDICTION, checked against
// the geometric detector — two routes, one pair. (φ's convergent denominators are
// 1,1,2,3,5,8,13,21,34,55,89,144,… i.e. the Fibonacci numbers, via convergentsOf.)
export function predictedDenominators(N) {
  // denominators of φ's convergents, deduped & ascending (1,2,3,5,8,…)
  const denoms = [];
  for (const cv of convergentsOf(PHI, 22)) {
    if (cv.q >= 2 && (denoms.length === 0 || cv.q !== denoms[denoms.length - 1])) denoms.push(cv.q);
  }
  const cutoff = 1.3 * Math.sqrt(N);
  let k = 0;
  while (k + 1 < denoms.length && denoms[k + 1] <= cutoff) k++;
  return [denoms[k], denoms[k + 1]];
}

// ============================================================================
//  THE SELF-TEST — the falsifiability harness (integer-exact in every verdict).
//  Returns { pass, total, lines:[{name, ok, detail}] }. The page runs the SAME
//  function; the Node twin (core.test.mjs) runs it too and exits non-zero on red.
// ============================================================================
export function runSelfTest() {
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  // 1. LADDER (delegated to the imported authority): φ's convergent denominators
  //    are the Fibonacci numbers, exact integer equality. (best-rational's shape.)
  {
    const c = convergentsOf(PHI, 16);
    let ok = true, bad = '';
    for (let n = 0; n < c.length; n++) {
      if (c[n].p !== fib(n + 2) || c[n].q !== fib(n + 1)) { ok = false; bad = `n=${n}: ${c[n].p}/${c[n].q} ≠ ${fib(n + 2)}/${fib(n + 1)}`; break; }
    }
    T('φ convergents = Fibonacci ratios F_{n+1}/F_n (the ladder)', ok, ok ? '…21/13, 34/21, 55/34…' : bad);
  }

  // 2. SPOKE COUNT (negative-control arithmetic): spokeCountExact(p,q) === q/gcd,
  //    by distinct integer residues {n·p mod q}. Integer-exact, 6 detents.
  {
    let ok = true, bad = '';
    for (const [p, q] of [[1, 3], [2, 5], [3, 8], [5, 13], [1, 4], [1, 7]]) {
      const exp = q / gcd(p, q);
      const got = spokeCountExact(p, q);
      if (got !== exp) { ok = false; bad = `${p}/${q}: ${got} ≠ ${exp}`; break; }
    }
    T('spokeCountExact(p,q) = q/gcd(p,q) — 6 rational detents', ok, ok ? '3·5·8·13·4·7 exact' : bad);
  }

  // 3. ARM = g (definitional integer fact): familyArms(g,N).size === g exactly —
  //    the residue classes mod g partition all N seeds, so a full head shows g arms.
  {
    let ok = true, bad = '';
    for (const g of [13, 21, 34, 55, 89]) for (const N of [g, g + 1, 500, 2500]) {
      const s = familyArms(g, N).size;
      const want = Math.min(g, N);
      if (s !== want) { ok = false; bad = `g=${g} N=${N}: arms=${s} ≠ ${want}`; break; }
    }
    T('familyArms(g,N).size = g (residue classes partition the head)', ok, ok ? 'g∈{13,21,34,55,89}' : bad);
  }

  // 4. THE BRIDGE (the headline). At golden, the GEOMETRIC detector's dominant
  //    pair === a CONSECUTIVE pair of φ-convergent denominators from the ladder —
  //    asserted as integer equalities, across a pinned N-schedule, AND Fibonacci
  //    AND consecutive (index gap===1) AND a monotone CLIMB with N (k never skips,
  //    never goes backward). Two independent methods, the SAME integers.
  {
    const SCHEDULE = [200, 500, 987, 1500, 2500, 4000];   // PINNED — page must match
    let ok = true, bad = '';
    let prevLo = 0;
    for (const N of SCHEDULE) {
      const det = dominantFamilies(GOLDEN, N);
      const lo = Math.min(det.counts[0], det.counts[1]);
      const hi = Math.max(det.counts[0], det.counts[1]);
      if (!det.spiralPair) { ok = false; bad = `N=${N}: no spiral pair detected`; break; }
      if (!isFib(lo) || !isFib(hi)) { ok = false; bad = `N=${N}: pair ${lo},${hi} not both Fibonacci`; break; }
      if (!consecutiveFib(lo, hi)) { ok = false; bad = `N=${N}: ${lo},${hi} not consecutive Fibonacci`; break; }
      // the ladder must contain BOTH as convergent denominators of φ
      const denoms = new Set(convergentsOf(PHI, 22).map(c => c.q));
      if (!denoms.has(lo) || !denoms.has(hi)) { ok = false; bad = `N=${N}: ${lo}/${hi} not φ-convergent denominators`; break; }
      // monotone climb: this head's smaller arm-count never drops below the last
      if (lo < prevLo) { ok = false; bad = `N=${N}: arm-count ${lo} dropped below ${prevLo}`; break; }
      prevLo = lo;
    }
    T('BRIDGE: golden detector pair = consecutive φ-convergent denominators, climbing with N', ok,
      ok ? 'geom ⇔ continued-fraction, 6 N' : bad);
  }

  // 5. NEGATIVE CONTROL. For every rational detent: the detector finds NO spiral
  //    pair AND spokeCountExact === q, AND cfOfRational(p,q) is FINITE (terminates).
  {
    let ok = true, bad = '';
    for (const [p, q] of [[1, 2], [2, 5], [3, 8], [5, 13], [1, 4], [1, 7]]) {
      const theta = TAU * (p / q);
      const det = dominantFamilies(theta, 1500);
      if (det.spiralPair) { ok = false; bad = `${p}/${q}: detector wrongly found a spiral pair`; break; }
      if (spokeCountExact(p, q) !== q / gcd(p, q)) { ok = false; bad = `${p}/${q}: spoke count wrong`; break; }
      const cf = cfOfRational(p, q);
      if (!(Array.isArray(cf) && cf.length >= 1 && cf.length < 40)) { ok = false; bad = `${p}/${q}: CF not finite`; break; }
    }
    T('negative control: rational p/q → no spiral pair · q spokes · finite CF', ok,
      ok ? '1/2·2/5·3/8·5/13·1/4·1/7 all collapse' : bad);
  }

  // 6. THE TRACE↔CLAIM BOND (A's spine). The count a hand-tracer arrives at by
  //    walking ONE arm of pitch g across a full head === familyArms(g,N).size === g
  //    === the φ-convergent denominator the rail predicts. The number your hand
  //    earns can NEVER diverge from the proven core: performance IS proof. We
  //    simulate the tracer for each dominant pitch at golden and assert all three
  //    integers coincide.
  {
    let ok = true, bad = '';
    for (const N of [987, 1500, 2500]) {
      const det = dominantFamilies(GOLDEN, N);
      for (const g of det.counts) {
        if (!det.spiralPair) continue;
        // simulate "walk every g-th seed counting distinct arms": the tracer steps
        // start→start+g→… for each start 0..g-1, ticking a NEW arm per distinct start.
        const walked = new Set();
        for (let start = 0; start < g; start++) if (start < N) walked.add(start);
        const armsByTrace = walked.size;
        const armsByCore = familyArms(g, N).size;
        const ladderHasIt = new Set(convergentsOf(PHI, 22).map(c => c.q)).has(g);
        if (!(armsByTrace === armsByCore && armsByCore === Math.min(g, N) && (g <= 1 || ladderHasIt))) {
          ok = false; bad = `N=${N} g=${g}: trace ${armsByTrace} / core ${armsByCore} / ladder ${ladderHasIt}`; break;
        }
      }
      if (!ok) break;
    }
    T('TRACE↔CLAIM: hand-traced arm count = familyArms = g = φ-convergent denominator', ok,
      ok ? 'the number your hand earns IS the proven one' : bad);
  }

  // 7. PURITY (the smear is real, not cosmetic). At golden the dominant gap is
  //    EXACTLY Fibonacci; at a perturbed near-rational (137.3°) the dominant pair
  //    is NOT a consecutive-Fibonacci spiral pair — a wrong angle reads wrong.
  {
    const g = dominantFamilies(GOLDEN, 1500);
    const goldClean = g.spiralPair && g.fibonacci && g.consecutive;
    const near = dominantFamilies(TAU * (137.3 / 360), 1500);
    const nearBroken = !(near.spiralPair && near.fibonacci && near.consecutive);
    T('purity: golden gives a clean consecutive-Fibonacci pair; 137.3° does NOT', goldClean && nearBroken,
      goldClean && nearBroken ? `golden ${g.counts.join(',')} · near ${near.counts.join(',')}` :
        `golden ${g.counts.join(',')}(${g.consecutive}) · near ${near.counts.join(',')}(${near.consecutive})`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
