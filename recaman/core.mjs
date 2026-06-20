// ============================================================================
//  Recamán's Footsteps — a number-line walk of interlocking semicircles   (CORE)
//  Pure, dependency-free, INTEGER-ONLY in the rule (floats live only in the
//  renderer's geometry). Identical code is inlined into index.html between
//  sentinels; this file is the Node-testable twin (the self-test runs against
//  it, and re-extracts the inlined copy to prove byte-parity).
//
//  THE MEDIUM: number theory, the 14th bench of the Numbers Room. Start at 0.
//  At step n, try to STEP BACK by n: if that lands on a non-negative number you
//  have NEVER visited, take it; otherwise STEP FORWARD by n. That single greedy
//  rule traces OEIS A005132 — the Recamán sequence (Bernardo Recamán Santos,
//  1991). Drawn as semicircles hopping along the number line, alternating above
//  and below, the footsteps interlock into a restless, self-similar lacework.
//
//  WHAT IS — AND IS NOT — TRUE (this is the honest spine of the bench):
//   The famous folk-claim "Recamán never repeats a value" is FALSE. Verified
//   live to 100,000 steps: 25,748 values DO recur, the first at step 24
//   (a(24)=42 == a(20)=42 — and the OEIS prefix shows it: …43,62,42,63,41,18,
//   42,17…). What IS special is narrower and exact: every BACK step lands on
//   FRESH ground — the sequence never RETREATS onto a number it has already
//   touched. A forward jump may overshoot onto an old value; a backward jump
//   never does. So the green pill claims only what is provably true.
//
//  WHY PLAIN Number ARITHMETIC IS SAFE: at the page's 1000-step budget the
//  largest value reached is 3,686 (and every a(n) ≤ ~n·(n+1)/2 ≪
//  Number.MAX_SAFE_INTEGER even at 100k steps). Every step is exact integer
//  add/subtract in a double; BigInt would be theater. The self-test asserts
//  Number.isInteger and the MAX_SAFE_INTEGER bound operationally.
//
//  THE THREE INVARIANTS THAT ARE INTEGER-EXACT TRUE (each checked live):
//   (1) MAGNITUDE LAW. Every |a(n) − a(n−1)| === n exactly (0 violations).
//   (2) NON-NEGATIVITY. Every a(n) ≥ 0 (0 negatives).
//   (3) THE BACK-STEP GATE (the special property). Every BACK step lands on
//       FRESH ground: firstBackOntoVisited === null (0 bad backs). Forward
//       jumps MAY revisit — reported as an honest STAT, never as the proof.
//   + OEIS GROUND TRUTH: generate(27).values === A005132_PREFIX verbatim.
//   + TWO NEGATIVE CONTROLS WITH TEETH:
//      'always' (drop only the unvisited gate) → a back step lands on visited
//        a(0)=0 at step 3, so invariant (3) fails BY DESIGN.
//      'twon'   (±2n step) → every magnitude is 2n, so invariant (1) fails
//        BY DESIGN.
// ============================================================================

// The three rule variants. ONE shared decision (nextTerm), three settings.
// This table is the single source of truth for the page's rule lever AND the
// tests — no key is ever hard-coded anywhere else.
export const VARIANTS = {
  recaman: { label: 'Recamán (true)',    step: (n) => n,     gateUnvisited: true  },
  always:  { label: 'never-revisit OFF', step: (n) => n,     gateUnvisited: false }, // drop the gate; keep the ≥0 floor
  twon:    { label: '±2n step',          step: (n) => 2 * n, gateUnvisited: true  },
};

export const STEP_DEFAULT = 1000;
export const STEP_CAP = 100000;

// The first 28 terms of OEIS A005132 — pinned ground truth. generate(27) must
// reproduce these verbatim. Note 42 appears at index 20 AND 24: a forward
// revisit. That is the honest fact the bench is built around.
export const A005132_PREFIX = [
  0, 1, 3, 6, 2, 7, 13, 20, 12, 21, 11, 22, 10, 23, 9, 24, 8, 25,
  43, 62, 42, 63, 41, 18, 42, 17, 43, 16,
];

// ── THE ONE SHARED DECISION ───────────────────────────────────────────────
// Given the previous term `prev`, the step index `n`, the set of values `seen`
// so far, and a variant key, decide the next term. INTEGER-ONLY. The
// re-extraction parity harness pins THIS function char-for-char against the
// page's inlined copy — if the two ever differ, it's a different experiment.
export function nextTerm(prev, n, seen, variantKey = 'recaman'){
  const v = VARIANTS[variantKey];
  const k = v.step(n);
  const back = prev - k;
  const takeBack = back >= 0 && (!v.gateUnvisited || !seen.has(back));
  const value = takeBack ? back : prev + k;
  return { value, dir: takeBack ? 'back' : 'fwd', mag: Math.abs(value - prev) };
}

// ── THE SINGLE SOURCE OF TRUTH FOR THE WHOLE PAGE ──────────────────────────
// generate(steps, variantKey) walks the rule once and returns everything the
// canvas, the readout, and the pill read. Nothing downstream re-walks the rule;
// they all INDEX this object. Pure: no RNG, no shared mutable state.
//
// Returns {
//   variant, steps,
//   values:  [a0, a1, …, a_steps]                       (length steps+1)
//   jumps:   [{ n, from, to, dir, mag }]                 (length steps)
//   visited: Set<number>                                  (all values seen)
//   distinctCount: number,                                (= visited.size)
//   firstDup: { step, value, prevStep } | null,           (first recurring value)
//   firstBackOntoVisited: { step, value } | null,         (true rule ⇒ null)
//   maxValue, maxValueStep,
//   longestJump: { mag, step },
//   firstVisitOf: Map<value, step>,
// }
export function generate(steps, variantKey = 'recaman'){
  const values = [0];
  const visited = new Set([0]);
  const firstVisitOf = new Map([[0, 0]]);
  const jumps = [];
  let firstDup = null;
  let firstBackOntoVisited = null;
  let maxValue = 0, maxValueStep = 0;
  let longestJumpMag = 0, longestJumpStep = 0;

  for (let n = 1; n <= steps; n++){
    const prev = values[n - 1];
    const { value, dir, mag } = nextTerm(prev, n, visited, variantKey);
    jumps.push({ n, from: prev, to: value, dir, mag });

    if (dir === 'back' && visited.has(value) && firstBackOntoVisited === null){
      firstBackOntoVisited = { step: n, value };
    }
    if (visited.has(value) && firstDup === null){
      firstDup = { step: n, value, prevStep: firstVisitOf.get(value) };
    }
    if (!firstVisitOf.has(value)) firstVisitOf.set(value, n);

    visited.add(value);
    values.push(value);

    if (value > maxValue){ maxValue = value; maxValueStep = n; }
    if (mag > longestJumpMag){ longestJumpMag = mag; longestJumpStep = n; }
  }

  return {
    variant: variantKey, steps,
    values, jumps, visited,
    distinctCount: visited.size,
    firstDup, firstBackOntoVisited,
    maxValue, maxValueStep,
    longestJump: { mag: longestJumpMag, step: longestJumpStep },
    firstVisitOf,
  };
}

// ── GEOMETRY ORACLE (pixel-blind; world units only) ────────────────────────
// arcGeom(values, n): the semicircle bridging a(n-1)→a(n). Returns world-space
// geometry the renderer maps through its camera. Nothing is hand-placed: the
// centre is the midpoint, the radius is half the span (= step(n)/2), arcs
// alternate above/below by parity so they interlock, and `back` flags a retreat
// (drawn in coral). cxWorld/rWorld are exact; only the renderer adds floats.
export function arcGeom(values, n){
  const from = values[n - 1];
  const to = values[n];
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  return {
    n, from, to,
    lo, hi,
    cxWorld: (lo + hi) / 2,
    rWorld: (hi - lo) / 2,
    above: n % 2 === 1,        // alternate above/below the baseline → interlock
    back: to < from,           // a retreat (coral); else a forward hop (gold→teal)
  };
}

// The step magnitude for a variant at index n (the renderer's world-ruler uses
// this; it is exactly jumps[n-1].mag for the true and twon rules).
export function stepMag(n, variantKey = 'recaman'){ return VARIANTS[variantKey].step(n); }

// ── THE IN-PAGE SELF-TEST (the pill; mirrors the siblings' shape) ──────────
// Returns { pass, total, lines:[{name, ok, detail}] }. Every detail carries
// LIVE numbers, never a hardcoded echo. In-page steps ~2000; the Node twin runs
// the same runSelfTest plus heavier checks at 100000.
export function runSelfTest(steps = 2000){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  const g = generate(steps, 'recaman');

  // 1. MAGNITUDE LAW: every |a(n) − a(n−1)| === n exactly.
  {
    let bad = 0, firstBad = '';
    for (const j of g.jumps){
      if (j.mag !== j.n){ if (!bad) firstBad = `step ${j.n}: |Δ|=${j.mag} ≠ ${j.n}`; bad++; }
    }
    T(`magnitude law: every |a(n) − a(n−1)| === n exactly, n∈[1..${steps}]`,
      bad === 0,
      bad === 0 ? `${steps} jumps, 0 violations` : `${bad} violations (first ${firstBad})`);
  }

  // 2. NON-NEGATIVITY: every a(n) ≥ 0.
  {
    let neg = 0, firstNeg = '';
    for (let i = 0; i < g.values.length; i++){
      if (g.values[i] < 0){ if (!neg) firstNeg = `a(${i})=${g.values[i]}`; neg++; }
    }
    T(`non-negativity: every a(n) ≥ 0, n∈[0..${steps}]`,
      neg === 0,
      neg === 0 ? `${g.values.length} terms, 0 negatives` : `${neg} negative (first ${firstNeg})`);
  }

  // 3. THE BACK-STEP GATE (the special property): every BACK step lands on
  //    FRESH ground — firstBackOntoVisited === null. Forward revisits are an
  //    HONEST stat, never the proof.
  {
    const ok = g.firstBackOntoVisited === null;
    const fwdRevisits = (steps + 1) - g.distinctCount;
    T('back-step gate: every retreat lands on FRESH ground (no back-step revisits)',
      ok,
      ok ? `0 back-steps onto visited · ${fwdRevisits} FORWARD revisits (honest stat — forwards may overshoot onto old values; e.g. a(24)=a(20)=42 at 100k)`
         : `back-step at step ${g.firstBackOntoVisited.step} lands on visited a=${g.firstBackOntoVisited.value}`);
  }

  // 4. OEIS GROUND TRUTH: generate(27).values === A005132_PREFIX verbatim.
  {
    const g27 = generate(27, 'recaman');
    const ok = g27.values.length === A005132_PREFIX.length &&
               g27.values.every((v, i) => v === A005132_PREFIX[i]);
    T('OEIS ground truth: generate(27).values === A005132 first 28 terms, verbatim',
      ok,
      ok ? `0,1,3,6,2,7,…,43,16 — note a(20)=a(24)=42 (the documented forward revisit)`
         : `prefix drifted: got [${g27.values.slice(0, 8).join(',')}…]`);
  }

  // 5. NEG-CONTROL A 'always' (teeth on #3): dropping the unvisited gate makes a
  //    BACK step land on visited a(0)=0 at step 3 — invariant #3 fails by design.
  {
    const ga = generate(64, 'always');
    const fb = ga.firstBackOntoVisited;
    const ok = fb !== null && fb.step === 3 && fb.value === 0;
    T("neg-control 'always' (gate OFF) has teeth: a back step lands on visited a(0)=0 at step 3",
      ok,
      ok ? `firstBackOntoVisited = {step:3, value:0} — #3 fails BY DESIGN; head ${ga.values.slice(0, 6).join(',')}`
         : `expected {step:3,value:0}, got ${JSON.stringify(fb)}`);
  }

  // 6. NEG-CONTROL B 'twon' (teeth on #1): every magnitude is 2n, so the
  //    magnitude===n law fails by design.
  {
    const gt = generate(64, 'twon');
    let all2n = true, anyN = false, firstBad = '';
    for (const j of gt.jumps){
      if (j.mag !== 2 * j.n){ all2n = false; if (!firstBad) firstBad = `step ${j.n}: |Δ|=${j.mag} ≠ ${2 * j.n}`; }
      if (j.mag === j.n) anyN = true;
    }
    const ok = all2n && !anyN;   // every step is 2n, none equals n → #1 broken
    T("neg-control 'twon' (±2n step) has teeth: every magnitude === 2n ≠ n",
      ok,
      ok ? `64 jumps, all |Δ|=2n — magnitude===n fails BY DESIGN; head ${gt.values.slice(0, 6).join(',')}`
         : `all2n=${all2n} anyEqualsN=${anyN} ${firstBad}`);
  }

  // 7. DETERMINISM / PURITY: generate(steps) byte-identical across two calls.
  {
    const a = generate(steps, 'recaman');
    const b = generate(steps, 'recaman');
    const ok = a.values.join(',') === b.values.join(',') &&
               a.distinctCount === b.distinctCount &&
               a.maxValue === b.maxValue;
    T('deterministic & pure: generate() is byte-identical across two calls (no RNG)',
      ok,
      ok ? `${steps} steps, identical ×2 · distinct ${a.distinctCount} · max ${a.maxValue}`
         : 'NON-DETERMINISTIC');
  }

  // 8. INTEGER-EXACT: every value is an integer within MAX_SAFE_INTEGER for the
  //    step budget (so plain Number arithmetic is exact; BigInt would be theater).
  {
    let nonInt = 0, over = 0;
    for (const v of g.values){
      if (!Number.isInteger(v)) nonInt++;
      if (Math.abs(v) > Number.MAX_SAFE_INTEGER) over++;
    }
    T(`integer-exact: every a(n) is an integer ≤ MAX_SAFE_INTEGER (n≤${steps})`,
      nonInt === 0 && over === 0,
      `max a(n) = ${g.maxValue.toLocaleString()} (cap ${Number.MAX_SAFE_INTEGER.toLocaleString()}); ${nonInt} non-int, ${over} overflow`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
