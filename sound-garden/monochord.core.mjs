// ============================================================================
//  THE MONOCHORD CORE — the sole authority for the claim "an ideal tensioned
//  string's overtones are an EXACTLY EVEN harmonic ladder: fₙ/f₁ === n, and
//  halving the length doubles the fundamental." Pure, dependency-free, DOM-free,
//  ZERO imports. This is the ONE place the string law lives.
//
//  THE LAW.  An ideal (flexible, lossless) string of length L, tension T, and
//  linear density μ vibrates with mode frequencies
//        fₙ = n · c / (2·L),    where the wave speed  c = √(T/μ).
//  So the partials are integer multiples of f₁ = c/(2L): a PERFECTLY EVEN ladder
//  (fₙ/f₁ = n), and halving L doubles every fₙ. This is the string-domain twin of
//  the Cavern's n² ladder — here it is n¹, dead even.
//
//  THE NEGATIVE CONTROL (load-bearing).  A REAL string is slightly STIFF: it
//  resists bending, which adds a restoring term that grows with mode number.
//  The standard inharmonicity model is
//        fₙ = n · f₁ · √(1 + B·n²),    B = the inharmonicity coefficient ≥ 0.
//  With B>0 the partials go strictly SHARP of n·f₁ (and increasingly so) — so the
//  even-ladder assertion fₙ/f₁ === n FAILS. The control proves the test has teeth:
//  harmonicity is a property of the TENSION-ONLY (B=0) model, not of arithmetic.
//
//  SINGLE-SOURCE DISCIPLINE.  The Monochord bench (sound-garden/monochord.html)
//  inlines a BYTE-TWIN of the slice between the sentinels below; its Node twin
//  (monochord.test.mjs) re-extracts that slice and asserts it is char-for-char
//  this module, runs THIS runSelfTest (so the in-page pill and the twin cannot
//  disagree), and an anti-circularity grep confirms `function fIdeal(` is defined
//  in exactly ONE .mjs — here. The anchor (SEMI_ANCHOR=-15 → 110 Hz = A2) is
//  cross-checked against pitch-core.mjs in the twin, so the anchor stays the ET-
//  grid value (not a re-typed magic number) WITHOUT this module importing anything.
// ============================================================================

// ===== MONOCHORD CORE (inlined byte-twin) BEGIN =====
// The anchor: the string's reference fundamental is A2 = 110 Hz, which is the
// equal-temperament grid value at SEMI_ANCHOR = -15 semitones from middle C.
// (Cross-checked against pitch-core.mjs's semiToFreq/noteName in the Node twin —
// THIS module re-types neither the pitch law nor the note name; it carries only
// the resulting Hz, and the twin proves that Hz is exactly the grid value.)
const SEMI_ANCHOR = -15;          // semitones from middle C → A2
const ANCHOR_HZ = 110;            // A2, the reference fundamental in Hz
const L_REF = 0.65;               // the reference speaking length, in metres

// Reference tension/density chosen so the wave speed is EXACT and the anchor lands
// bit-exact: c = √(T/μ) = √(20449/1) = 143 (a perfect square), and with L_REF=0.65
//   f₁ = 1·143/(2·0.65) = 143/1.3 = 110.000…  (=== 110 to the bit; see the order
//   of operations in fIdeal — the division is performed LAST so 143/1.3 is exact).
const T_REF = 20449;              // reference tension (143²) — keeps c integer-exact
const MU_REF = 1;                 // reference linear density

// The wave speed on the string: c = √(T/μ). The ONE place the speed law lives.
function waveSpeed(T, mu){ return Math.sqrt(T / mu); }
// the anchor's wave speed (the reference c). Equals 143 by construction.
function anchorSpeed(){ return waveSpeed(T_REF, MU_REF); }

// THE IDEAL STRING LAW — fₙ = n·c/(2L), c=√(T/μ). The division by (2L) is LAST so
// the integer multiples stay bit-exact (fₙ/f₁ === n to 0 ULP) and halving L doubles
// f₁ exactly. This is the SOLE definition of fIdeal in the codebase.
function fIdeal(n, L, T, mu){ return n * waveSpeed(T, mu) / (2 * L); }
// the ideal harmonic ratio fₙ/f₁ — dead even: exactly n.
function harmonicRatio(n){ return n; }

// THE STIFF-STRING (negative-control) LAW — a real string resists bending, adding
// inharmonicity: fₙ = n·f₁·√(1 + B·n²). With B>0 partials go strictly SHARP.
//   B = the inharmonicity coefficient (0 = ideal). B_REF is a realistic small value.
const B_REF = 0.0008;             // a realistic small inharmonicity (e.g. a thick string)
function fStiff(n, L, T, mu, B){
  const b = (B == null) ? B_REF : B;
  return fIdeal(n, L, T, mu) * Math.sqrt(1 + b * n * n);
}
// the stiff partial's ratio to the stiff FUNDAMENTAL (n=1). For B>0 this is > n and
// increases with n — the even ladder bends sharp. For B=0 it collapses to exactly n.
function stiffRatio(n, B){
  const b = (B == null) ? B_REF : B;
  return (n * Math.sqrt(1 + b * n * n)) / Math.sqrt(1 + b * 1 * 1);
}

// ── NODE-FORCING (touch a node to force a pure overtone) ──────────────────────
// Touch the string at the fraction p∈(0,1) of its length and you DAMP every mode
// whose shape does NOT have a node there; the surviving modes are exactly those
// n for which p is an integer multiple of 1/n (i.e. n·p is an integer) — those
// modes have a node at p and ring on. The lowest surviving mode is the forced
// overtone you HEAR (and SEE as that many bellies).
//   survivingModes(a,b)  — touch at the rational node a/b (in lowest terms b>a≥1);
//     the modes with a node there are the multiples of b: {b, 2b, 3b, …}.
//   forcedHarmonic(a,b)  — the LOWEST surviving mode = b (touching a/b forces Hb).
// The FORBIDDEN case is built in: touching the exact MIDPOINT 1/2 forces H2 and can
// NEVER force H1 (the fundamental has its only node-free belly at the centre — it
// is killed, not forced). forcedHarmonic(1,2) === 2, and 1 ∉ survivingModes(1,2).
function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ [a, b] = [b, a % b]; } return a; }
function survivingModes(a, b, cap){
  const c = cap == null ? 8 : cap;
  const g = gcd(a, b); const aa = a / g, bb = b / g;   // reduce a/b to lowest terms
  const out = [];
  for(let m = 1; m <= c; m++){ const n = m * bb; if(n <= c && (n * aa) % bb === 0) out.push(n); }
  return out;
}
function forcedHarmonic(a, b){ const s = survivingModes(a, b); return s.length ? s[0] : null; }

// ── runSelfTest() — the SOLE ORACLE. Shape: { ok, pass, total, lines:[{name,ok,
// detail}] }. The in-page pill (window.__monochordSelfTest) and the Node twin both
// call THIS, so they cannot disagree. The even-ladder is asserted on the PURE IDEAL
// ratios ONLY (never the voiced/aliased/timbre-weighted subset — that would be a
// lying self-test). Every detail carries LIVE numbers.
function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail='') => lines.push({ name, ok: !!ok, detail });
  const EPS = 1e-9;
  const L = L_REF, TEN = T_REF, MU = MU_REF;
  const f1 = fIdeal(1, L, TEN, MU);

  // LEG A — the EVEN LADDER: fₙ/f₁ === n to < 1e-9 for n = 1..8 (ideal ratios only).
  {
    let ok = true, worst = 0;
    for(let n = 1; n <= 8; n++){
      const r = fIdeal(n, L, TEN, MU) / f1;
      const d = Math.abs(r - n);
      if(d > worst) worst = d;
      if(d >= EPS || r !== harmonicRatio(n)) ok = false;   // ratio AND the ladder fn agree
    }
    T('LEG A — even ladder: fₙ/f₁ === n to <1e-9 for n=1..8 (the ideal string\'s overtones are a perfectly even harmonic series)',
      ok, ok ? `worst |fₙ/f₁ − n| = ${worst.toExponential(2)} over n=1..8 (f₁ = ${f1} Hz)`
             : `ladder broke (worst ${worst.toExponential(2)})`);
  }
  // LEG B — HALVING L DOUBLES f₁, bit-exact (Δ = 0). Pitch is geometry.
  {
    const f1h = fIdeal(1, L / 2, TEN, MU);
    const ok = f1h === 2 * f1;
    T('LEG B — halving the speaking length doubles the fundamental BIT-EXACT: f₁(L/2) === 2·f₁(L) (Δ=0) — pitch is the bridge\'s geometry',
      ok, ok ? `f₁(L)=${f1} Hz · f₁(L/2)=${f1h} Hz === 2·f₁ (Δ=0)`
             : `f₁(L/2)=${f1h} ≠ 2·${f1}`);
  }
  // LEG C — the ANCHOR: f₁ at the reference length is EXACTLY 110 Hz (A2).
  {
    const ok = f1 === ANCHOR_HZ;
    T('LEG C — anchor: f₁ at L_REF is EXACTLY 110 Hz (A2) — the reference fundamental is the equal-temperament grid value (cross-checked vs pitch-core in the Node twin)',
      ok, ok ? `f₁(L_REF=${L_REF}) = ${f1} Hz === ANCHOR_HZ (${ANCHOR_HZ}, A2 = semi ${SEMI_ANCHOR})`
             : `f₁ = ${f1} ≠ ${ANCHOR_HZ}`);
  }
  // LEG D — NEGATIVE CONTROL (load-bearing): a STIFF string is strictly SHARP and
  //   monotone-in-n, so the LEG-A assertion fₙ/f₁ === n would FAIL for it. The test
  //   DISCRIMINATES (it is not vacuously green): only the B=0 model is even.
  {
    let strictlySharp = true, monotone = true, prev = -Infinity, wouldFailA = false, maxDev = 0;
    for(let n = 1; n <= 8; n++){
      const r = stiffRatio(n);
      if(n > 1 && !(r > n + EPS)) strictlySharp = false;        // strictly sharp of n
      if(!(r > prev)) monotone = false; prev = r;               // ratio rises with n
      const dev = Math.abs(r - n); if(dev > maxDev) maxDev = dev;
      if(n > 1 && dev >= EPS) wouldFailA = true;                // LEG-A would reject it
    }
    const collapses = stiffRatio(3, 0) === 3;                   // B=0 → exactly even
    const ok = strictlySharp && monotone && wouldFailA && collapses;
    T('LEG D — negative control (stiff string): partials go STRICTLY SHARP & monotone-in-n (fₙ/f₁ > n), so LEG-A FAILS for it — harmonicity is the tension-only model, not arithmetic',
      ok, ok ? `B=${B_REF}: ratio(8)=${stiffRatio(8).toFixed(4)} (>8), strictly sharp & monotone, max dev ${maxDev.toFixed(4)} — LEG-A would reject; B=0 collapses to exactly even`
             : `strictSharp=${strictlySharp} mono=${monotone} wouldFailA=${wouldFailA} collapses=${collapses}`);
  }
  // LEG E — NODE-FORCING table + the FORBIDDEN midpoint: touching a/b forces Hb,
  //   and touching the exact midpoint 1/2 forces H2 — it CANNOT force H1 (the
  //   fundamental is damped there, never voiced). UX and proof tell one story.
  {
    const table = [[1,2,2],[1,3,3],[2,3,3],[1,4,4],[3,4,4],[2,5,5]];   // [a,b → forced n]
    let ok = true, detail = [];
    for(const [a,b,want] of table){
      const got = forcedHarmonic(a,b);
      if(got !== want) ok = false;
      detail.push(`${a}/${b}→H${got}`);
    }
    const mid = survivingModes(1,2);
    const forbids1 = !mid.includes(1) && forcedHarmonic(1,2) === 2;     // midpoint cannot force H1
    if(!forbids1) ok = false;
    T('LEG E — node-forcing + forbidden midpoint: touching a/b forces the overtone Hb, and the exact midpoint 1/2 forces H2 — it CANNOT force H1 (the fundamental is killed there, never faked)',
      ok, ok ? `${detail.join(' ')} · midpoint survivors {${mid.join(',')}} exclude H1 ✓`
             : `forcing table or forbidden-midpoint broke (${detail.join(' ')}; mid {${mid.join(',')}})`);
  }
  // LEG F — HONEST BREAKDOWN: the even-ladder claim is CAPPED at n ≤ 8. Beyond the
  //   modelled range a real string drifts (stiffness compounds); we REPORT that and
  //   do not over-claim. (For the ideal model fₙ/f₁ stays exactly n at any n; the
  //   cap is an honesty bound on what the bench voices + draws, not a math failure.)
  {
    const claimCap = 8;
    const idealStillEvenAt16 = fIdeal(16, L, TEN, MU) / f1;            // ideal: still exactly 16
    const stiffDriftAt16 = Math.abs(stiffRatio(16) - 16);             // a real string would drift this much
    const ok = Math.abs(idealStillEvenAt16 - 16) < EPS && stiffDriftAt16 > 0.05;
    T('LEG F — honest breakdown: the bench CAPS its even-ladder claim at n≤8; a real (stiff) string visibly drifts past that (reported, not hidden) — the ideal model is exact, the claim is bounded',
      ok, ok ? `ideal stays exact (ratio(16)=${idealStillEvenAt16}); a stiff string would drift +${stiffDriftAt16.toFixed(3)} at n=16 — claim capped at n≤${claimCap}`
             : `idealAt16=${idealStillEvenAt16} stiffDrift16=${stiffDriftAt16}`);
  }

  let pass = 0; for(const l of lines) if(l.ok) pass++;
  return { ok: pass === lines.length, pass, total: lines.length, lines };
}
// ===== MONOCHORD CORE END =====

export {
  fIdeal, harmonicRatio, fStiff, stiffRatio, waveSpeed, survivingModes,
  forcedHarmonic, anchorSpeed, runSelfTest,
  SEMI_ANCHOR, ANCHOR_HZ, L_REF, T_REF, MU_REF, B_REF,
};
