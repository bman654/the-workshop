// === CORE BEGIN ===
// The Measuring Bench — math core (single source of truth).
// The Euclidean algorithm enacted as anthyphairesis: lay the short rod against the long,
// cut off its length as many times as it fits (the quotient), and the leftover stub becomes
// the new short rod. Repeat until a rod divides its partner exactly — that final rod IS the
// gcd. This module is the SOLE authority for the trace, the continued-fraction expansion,
// the extended (Bézout) coefficients read off the SAME trace, and par() — the fewest cuts a
// perfect player makes. It is inlined byte-identical into index.html between the
// CORE BEGIN / CORE END sentinels and tested by core.test.mjs — page & test can never drift.

// Deterministic PRNG (mulberry32) so a seed reproduces the same random pair everywhere.
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// gcdTrace(a, b) → the full anthyphairesis record.
// Requires a >= 1, b >= 1 (positive integers). Each step records the subtractive division
//   long = q · short + rem,  0 <= rem < short
// where q ("quotient") is HOW MANY times the short rod was cut from the long. The leftover
// `rem` becomes the next short rod; the loop ends when rem === 0, and the `short` of that
// final step is the gcd (the last nonzero rod). Returns:
//   { a, b, steps:[{long, short, q, rem}], gcd, quotients:[q...] }
// The quotients list is the continued-fraction expansion of a/b (when a >= b).
function gcdTrace(a, b){
  a = a | 0; b = b | 0;
  if (a < 1 || b < 1) throw new Error('gcdTrace requires positive integers');
  const steps = [];
  let long = a, short = b;
  // Normalize so the first long >= short without losing a real first quotient: if a < b the
  // first step is just q=0, long=a, rem=a, which correctly swaps the rods (CF leads with a 0).
  while (short !== 0){
    const q = Math.floor(long / short);
    const rem = long - q * short;
    steps.push({ long, short, q, rem });
    long = short; short = rem;
  }
  // `long` now holds the last nonzero rod = gcd; the final step had short===gcd, rem===0.
  const gcd = long;
  const quotients = steps.map(s => s.q);
  return { a, b, steps, gcd, quotients };
}

// cfExpand(a, b) → the continued-fraction terms [a0; a1, a2, ...] of a/b, AND a reconstruction
// of a/b from those terms as an exact fraction {num, den}. The terms are exactly the quotients
// of the trace. Reconstruction folds the terms forward via the standard convergent recurrence.
function cfExpand(a, b){
  const { quotients } = gcdTrace(a, b);
  // reconstruct the rational from the CF terms, exactly, with integer arithmetic.
  // Use the standard convergent recurrence: h_{-1}=1,h_{-2}=0; k_{-1}=0,k_{-2}=1.
  let hm1 = 1, hm2 = 0, km1 = 0, km2 = 1;
  for (const ai of quotients){
    const h = ai * hm1 + hm2;
    const k = ai * km1 + km2;
    hm2 = hm1; hm1 = h;
    km2 = km1; km1 = k;
  }
  return { terms: quotients.slice(), num: hm1, den: km1 };
}

// extendedFromTrace(a, b) → Bézout coefficients {g, x, y} with a*x + b*y === g === gcd(a,b),
// computed by walking the SAME quotient sequence the rods produced. This is the extended
// Euclidean algorithm expressed as a fold over the trace's quotients: it cannot disagree with
// the rods because it reads the rods' own cut counts.
function extendedFromTrace(a, b){
  const { quotients, gcd } = gcdTrace(a, b);
  // Iterative back-substitution via the convergent recurrence on coefficients.
  // Track (old_x, x) and (old_y, y); each step applies q from the trace.
  let oldR = a, r = b;
  let oldX = 1, x = 0;
  let oldY = 0, y = 1;
  for (const q of quotients){
    if (r === 0) break;            // the final step (rem 0) carries no coefficient update
    [oldR, r] = [r, oldR - q * r];
    [oldX, x] = [x, oldX - q * x];
    [oldY, y] = [y, oldY - q * y];
  }
  // oldR === gcd; (oldX, oldY) are the Bézout coefficients.
  return { g: gcd, x: oldX, y: oldY };
}

// gcdRef(a, b) — an INDEPENDENT plain-division gcd, used only as a second oracle the trace must
// agree with. Agreement is meaningful precisely because the two routines are independent: the
// trace builds gcd subtractively from the rods; gcdRef builds it by the modulo recurrence.
function gcdRef(a, b){
  a = Math.abs(a | 0); b = Math.abs(b | 0);
  while (b){ [a, b] = [b, a % b]; }
  return a;
}

// par(a, b) — the FEWEST distinct cut-on-overlap moves a perfect player makes to reach the gcd:
// one move per anthyphairesis step (each step promotes the rods once), i.e. the number of trace
// steps. The score awards ★★★ when the player's move count equals par. (This is the "promotion"
// count, NOT the sum of quotients, which counts single short-length subtractions.)
function par(a, b){
  return gcdTrace(a, b).steps.length;
}
// === CORE END ===

export { mulberry32, gcdTrace, cfExpand, extendedFromTrace, gcdRef, par };
