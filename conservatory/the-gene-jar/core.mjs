// ============================================================================
//  THE CONSERVATORY · THE GENE JAR  —  core math (the single source of truth).
//
//  THE ONE IDEA.  Pour two colours of bead into a jar — a fraction p of GOLD (the
//  A allele) and q=1−p of SLATE (the a allele) — then let the pool mate at RANDOM
//  for one generation.  Pair the beads independently and the three genotype counts
//  settle on the Hardy–Weinberg proportions
//
//        AA : Aa : aa   =   p²  :  2pq  :  q²            (Hardy 1908, Weinberg 1908)
//
//  and Σ = p² + 2pq + q² = (p+q)² = 1 EXACTLY, for ANY p.  The astonishing part is
//  the MEMORYLESSNESS: the allele fraction of the NEXT generation,
//
//        p′ = AA + ½·Aa = p² + ½·2pq = p(p+q) = p,
//
//  is p UNCHANGED.  One crank of random mating reaches equilibrium and STAYS there
//  forever — the pool forgets every generation yet keeps its shape.  p is a TRUE
//  fixed point of the mating operator, reached in ONE step (mate∘mate === mate):
//  the current that will not drift.
//
//  THE NEG-CONTROL (the lie, given a real chance to look true) — ASSORTATIVE MATING,
//  "like mates with like".  Force perfect positive assortment: every Aa heterozygote
//  pairs with its own kind, so a quarter of each Aa's offspring become AA and a
//  quarter become aa each round (the textbook one-round assortment map):
//
//        AA′ = AA + ¼·Aa ,  Aa′ = ½·Aa ,  aa′ = aa + ¼·Aa.
//
//  Crank it repeatedly and the heterozygotes DRAIN geometrically (Aa → ½·Aa each
//  round, → 0); the homozygotes swell.  Yet p′ = AA′ + ½·Aa′ = AA + ¼Aa + ¼Aa = p
//  is STILL unchanged — assortment moves COUNTS, never the allele fraction.  So the
//  "p invariant" lamp STAYS GREEN while the "Σ=1 / HW identity" lamp goes RED: the
//  genotype counts no longer equal p²:2pq:q² (hwIdentity breaks).  It is the random
//  PAIRING, not the counts, that holds the jar still — proven by breaking exactly
//  that pairing and watching only the identity fail.
//
//  THE SCOOP (honest sampling — never a proof).  scoop() draws N beads as N seeded
//  allele-pairs from one xorshift32 stream (the house generator, byte-identical to
//  the pinhole-race / demon / brownian benches) and tallies the three genotypes.
//  The counts land within ±KSIG·√N of N·{p²,2pq,q²}; we MEASURE that band and never
//  call a finite sample a proof.  The EXACT claims are the closed forms; the scoop
//  is asked only to fall inside its stated counting-error band.
//
//  Everything here is pure: no DOM, no network.  The landing's planter-light AND the
//  bench BOTH import this file so they can never drift apart.
// ============================================================================

// ===== GENE-JAR CORE (byte-identical to core.mjs) =====
// KSIG — the SINGLE source of truth for the √N sampling band, shared by scoop(), the
// self-test, and the page's tolerance ribbon (pinhole-race / demon / brownian precedent).
const KSIG = 3;

// ── the allele algebra (the closed forms) ──────────────────────────────────
//  q(p): the recessive (slate) allele fraction, q = 1 − p.
function q(p) { return 1 - p; }

//  hardyWeinberg(p): the equilibrium genotype proportions {AA:p², Aa:2pq, aa:q²}.
//  Σ = p² + 2pq + q² = (p+q)² = 1 EXACTLY for any p (falsifier 1).
function hardyWeinberg(p) {
  const Q = 1 - p;
  return { AA: p * p, Aa: 2 * p * Q, aa: Q * Q };
}

//  alleleFraction(g): read the GOLD (A) allele fraction back out of a genotype mix,
//  p = AA + ½·Aa.  Each AA carries two A's, each Aa carries one — so the A-fraction
//  is AA + ½·Aa.  This is the operator whose fixed point IS p.
function alleleFraction(g) { return g.AA + 0.5 * g.Aa; }

//  mate(g): one generation of RANDOM mating — re-pair the pool from its current
//  allele fraction.  mate(g) = hardyWeinberg(alleleFraction(g)).  Because
//  alleleFraction(hardyWeinberg(p)) = p(p+q) = p, mate∘mate === mate (falsifier 2):
//  equilibrium is reached in ONE step and held forever.
function mate(g) { return hardyWeinberg(alleleFraction(g)); }

//  assortativeRound(g): ONE round of perfect positive assortative mating ("like mates
//  with like").  A quarter of each Aa becomes AA and a quarter becomes aa; Aa halves.
//  p is conserved (¼+¼ of Aa split symmetrically) but the HW identity breaks —
//  the neg-control (falsifier 5).  Crank repeatedly ⇒ Aa drains geometrically to 0.
function assortativeRound(g) {
  return { AA: g.AA + 0.25 * g.Aa, Aa: 0.5 * g.Aa, aa: g.aa + 0.25 * g.Aa };
}

// ── the seedable xorshift32 PRNG — BYTE-IDENTICAL to pinhole-race / demon / brownian.
//  s = (0x2545F491 ^ (seed>>>0)) >>> 0; then xorshift; returns [0,1).
function makeRng(seed = 1) {
  let s = (0x2545F491 ^ (seed >>> 0)) >>> 0;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ============================================================================
//  THE SCOOP — draw N beads as N seeded ALLELE-PAIRS from ONE xorshift32 stream and
//  tally the three genotypes.  Each genotype is two independent Bernoulli(p) allele
//  draws (random union of gametes): A with prob p, a with prob q.  The counts
//  converge to N·{p²,2pq,q²} with the COMPUTED √N counting band; under assortative
//  mating each Aa is folded by assortativeRound BEFORE the tally so the live jar can
//  drain the heterozygotes.  Returns the counts, the predicted proportions, the band,
//  AND `pairsToDraw` — the ordered first ~64 seeded pairs (so facet 0's bead
//  animation can dramatize the SAME seeded draw the counts come from: one RNG).
//
//  Determinism: identical args ⇒ byte-identical counts, pairsToDraw, allele fraction.
// ============================================================================
function scoop({ p = 0.6, N = 1200, seed = 1, assortative = false } = {}) {
  const rng = makeRng(seed);
  const counts = { AA: 0, Aa: 0, aa: 0 };
  const pairsToDraw = [];
  const NPAIRS = 64;                                  // the first pairs the UI dramatizes
  for (let i = 0; i < N; i++) {
    const a0 = rng() < p ? 'A' : 'a';                 // first gamete
    const a1 = rng() < p ? 'A' : 'a';                 // second gamete
    const geno = (a0 === 'A' && a1 === 'A') ? 'AA'
               : (a0 === 'a' && a1 === 'a') ? 'aa' : 'Aa';
    counts[geno]++;
    if (i < NPAIRS) pairsToDraw.push({ a0, a1, geno });
  }
  // under assortment, fold the SAMPLED heterozygotes once (¼ → AA, ¼ → aa, ½ stay Aa)
  // so the live jar drains as the math says.  Integer-honest: split Aa by rounding.
  if (assortative && counts.Aa > 0) {
    const toAA = Math.round(counts.Aa * 0.25);
    const toaa = Math.round(counts.Aa * 0.25);
    counts.AA += toAA; counts.aa += toaa; counts.Aa -= (toAA + toaa);
  }
  const total = counts.AA + counts.Aa + counts.aa;
  const Q = 1 - p;
  const pred = assortative
    ? null                                            // no single closed proportion under repeated assortment
    : { AA: p * p, Aa: 2 * p * Q, aa: Q * Q };
  // the √N counting band on each genotype count: σ_k = √(N·π_k·(1−π_k)).
  const band = {};
  if (pred) for (const k of ['AA', 'Aa', 'aa']) band[k] = Math.sqrt(N * pred[k] * (1 - pred[k]));
  const sampledFraction = total > 0 ? (counts.AA + 0.5 * counts.Aa) / total : p;
  return { counts, total, p, pred, band, pairsToDraw, sampledFraction, N, seed, assortative };
}

// ============================================================================
//  THE ONE LEDGER — compute(state).  EVERY UI facet reads THIS one object: the jar's
//  gold/slate split, the three towers' heights, the two green lamps, and the neg-
//  control caption.  Applies `assortativeRounds` rounds of assortativeRound to the
//  random-mating equilibrium hardyWeinberg(p); rounds≥1 means the knife-switch is
//  engaged (multi-crank monotone Aa-drain).  They cannot drift because there is
//  nothing to drift between (pinhole-race / replicator precedent).
//
//  state:  p (gold-allele fraction), assortativeRounds (0 = honest random mating).
// ============================================================================
function compute({ p = 0.6, assortativeRounds = 0 } = {}) {
  const hw = hardyWeinberg(p);                         // the random-mating equilibrium
  let g = { AA: hw.AA, Aa: hw.Aa, aa: hw.aa };
  for (let r = 0; r < assortativeRounds; r++) g = assortativeRound(g);
  const pPrime = alleleFraction(g);                    // the next-gen allele fraction
  const sigma = g.AA + g.Aa + g.aa;                    // Σ — should be 1 to the bit
  // p invariant: the EXACT infinite-pool p′ equals p (never the finite scoop sample).
  const pInvariant = Math.abs(pPrime - p) < 1e-9;
  const sigmaOne = Math.abs(sigma - 1) < 1e-12;
  // HW identity: do the live counts STILL equal p²:2pq:q²?  True under random mating,
  // FALSE after any assortative round (the heterozygotes have been drained).
  const hwIdentity = Math.abs(g.AA - hw.AA) < 1e-12 &&
                     Math.abs(g.Aa - hw.Aa) < 1e-12 &&
                     Math.abs(g.aa - hw.aa) < 1e-12;
  return { p, pPrime, sigma, g, hw, pInvariant, sigmaOne, hwIdentity, assortativeRounds };
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier).  Shared
//  verbatim between the Node twin and the in-page pill.  KSIG is identical
//  everywhere.  Returns { pass, total, checks, detail } (the convention this wing's
//  landing reads); each check is { name, pass, info }.
//
//  In-page defaults: a modest N for the scoop fit (tens of ms).  The Node twin cranks
//  N so the band bites harder.  Thresholds (KSIG) are identical — only the band
//  shrinks with more samples.
// ============================================================================
function runSelfTest(opts = {}) {
  const N = opts.N || 50000;
  const checks = [];
  const detail = {};
  const ok = (name, cond, info) => checks.push({ name, pass: !!cond, info: info || '' });

  // a dense grid of p over the open interval (avoid the trivial 0/1 corners for the
  // sampling fit, include them for the exact identities).
  const GRID = [];
  for (let i = 0; i <= 40; i++) GRID.push(i / 40);
  const OPEN = GRID.filter((p) => p > 0.02 && p < 0.98);

  // (1)★ SIGMA — p² + 2pq + q² === 1 to the BIT, for any p across the dense grid.
  {
    let worst = 0, where = '';
    for (const p of GRID) {
      const g = hardyWeinberg(p);
      const s = g.AA + g.Aa + g.aa;
      const e = Math.abs(s - 1);
      if (e > worst) { worst = e; where = 'p=' + p; }
    }
    detail.sigmaErr = worst;
    ok('(1)★ Σ=1 to the bit: p²+2pq+q²===1 over the dense p grid (@' + where + ')',
       worst < 1e-12, 'max|Σ−1| = ' + worst.toExponential(2) + ' over ' + GRID.length + ' p values');
  }

  // (2)★ p INVARIANT & ONE-STEP FIXED POINT — p′=alleleFraction(hardyWeinberg(p))===p
  //      to <1e-9; AND mate∘mate === mate from ANY simplex start (equilibrium in ONE
  //      step).  The pool forgets every generation yet keeps p.
  {
    let worstP = 0, worstFix = 0;
    for (const p of GRID) {
      const pp = alleleFraction(hardyWeinberg(p));
      worstP = Math.max(worstP, Math.abs(pp - p));
    }
    // mate∘mate === mate from arbitrary (non-equilibrium) simplex starts:
    const STARTS = [
      { AA: 1, Aa: 0, aa: 0 }, { AA: 0, Aa: 1, aa: 0 }, { AA: 0, Aa: 0, aa: 1 },
      { AA: 0.2, Aa: 0.5, aa: 0.3 }, { AA: 0.7, Aa: 0.1, aa: 0.2 }, { AA: 1 / 3, Aa: 1 / 3, aa: 1 / 3 },
    ];
    for (const g0 of STARTS) {
      const g1 = mate(g0);
      const g2 = mate(g1);
      worstFix = Math.max(worstFix, Math.abs(g2.AA - g1.AA), Math.abs(g2.Aa - g1.Aa), Math.abs(g2.aa - g1.aa));
    }
    detail.pInvariantErr = worstP; detail.fixedPointErr = worstFix;
    ok('(2)★ p invariant & ONE-step fixed point: p′===p (<1e-9) and mate∘mate===mate from any start',
       worstP < 1e-9 && worstFix < 1e-12,
       'max|p′−p|=' + worstP.toExponential(2) + '  ·  max|mate∘mate−mate|=' + worstFix.toExponential(2));
  }

  // (3)★ FIT (sampling, NEVER a proof) — the seeded scoop's three counts land within
  //      ±KSIG·band of N·{p²,2pq,q²}, where band=√(N·π(1−π)).  Swept over p AND seeds.
  {
    let allIn = true, worst = '', maxDevSig = 0;
    for (const p of [0.2, 0.35, 0.5, 0.7, 0.85]) {
      for (const seed of [1, 7, 19]) {
        const r = scoop({ p, N, seed });
        for (const k of ['AA', 'Aa', 'aa']) {
          const expected = N * r.pred[k];
          const dev = Math.abs(r.counts[k] - expected);
          const sig = r.band[k] > 0 ? dev / r.band[k] : 0;
          if (sig > maxDevSig) maxDevSig = sig;
          if (dev > KSIG * r.band[k]) { allIn = false; worst = 'p=' + p + ' seed=' + seed + ' ' + k + ': ' + sig.toFixed(2) + 'σ'; }
        }
      }
    }
    detail.maxDevSig = maxDevSig;
    ok('(3)★ FIT (sampling, never a proof): seeded scoop counts → N·{p²,2pq,q²} within ±' + KSIG + '·√N band',
       allIn, allIn ? 'N=' + N + ': all counts inside the band; worst ' + maxDevSig.toFixed(2) + 'σ (KSIG=' + KSIG + ')' : worst);
  }

  // (4)★ ALLELE CONSERVED IN-SAMPLE — the seeded scoop's own allele fraction
  //      (AA+½Aa)/total tracks p within ±KSIG·√(p(1−p)/(2N)) (the gamete-count band):
  //      random union of gametes conserves the allele fraction up to sampling noise.
  {
    let allIn = true, worst = '', maxDevSig = 0;
    for (const p of [0.2, 0.35, 0.5, 0.7, 0.85]) {
      for (const seed of [2, 11, 23]) {
        const r = scoop({ p, N, seed });
        const dev = Math.abs(r.sampledFraction - p);
        const sd = Math.sqrt(p * (1 - p) / (2 * r.total)); // sd of an allele fraction over 2N gametes
        const sig = sd > 0 ? dev / sd : 0;
        if (sig > maxDevSig) maxDevSig = sig;
        if (dev > KSIG * sd) { allIn = false; worst = 'p=' + p + ' seed=' + seed + ': ' + sig.toFixed(2) + 'σ'; }
      }
    }
    detail.alleleMaxDevSig = maxDevSig;
    ok('(4)★ allele conserved in-sample: scoop (AA+½Aa)/N → p within ±' + KSIG + '·√(p(1−p)/2N)',
       allIn, allIn ? 'worst ' + maxDevSig.toFixed(2) + 'σ over p×seed grid' : worst);
  }

  // (5)★ NEG-CONTROL — assortative mating DRAINS Aa to exactly ½·Aa each round while
  //      p and Σ HOLD and the HW identity BREAKS.  Pin the magnitude (½ per round),
  //      not just "the lamp went red".
  {
    let allBroken = true, worst = '';
    for (const p of [0.2, 0.4, 0.5, 0.7]) {
      const hw = hardyWeinberg(p);
      const c0 = compute({ p, assortativeRounds: 0 });
      const c1 = compute({ p, assortativeRounds: 1 });
      const c3 = compute({ p, assortativeRounds: 3 });
      const halves = Math.abs(c1.g.Aa - 0.5 * hw.Aa) < 1e-12;           // Aa → ½·Aa in one round
      const drains = Math.abs(c3.g.Aa - hw.Aa / 8) < 1e-12;            // → Aa/8 after three
      const pHolds = c1.pInvariant && c3.pInvariant;                    // p unchanged
      const sigHolds = c1.sigmaOne && c3.sigmaOne;                      // Σ=1 still
      const identityBreaks = c0.hwIdentity && !c1.hwIdentity && !c3.hwIdentity; // RED only under assortment
      if (!(halves && drains && pHolds && sigHolds && identityBreaks)) {
        allBroken = false;
        worst = 'p=' + p + ': halves=' + halves + ' drains=' + drains + ' pHolds=' + pHolds + ' sig=' + sigHolds + ' idBreaks=' + identityBreaks;
      }
    }
    ok('(5)★ NEG-CONTROL: assortative drains Aa→½·Aa each round; p & Σ HOLD; HW identity goes RED',
       allBroken, allBroken ? 'Aa halves per round (→Aa/8 over 3); p invariant & Σ=1 hold; hwIdentity false only under assortment' : worst);
  }

  // (6) DETERMINISM — identical scoop args ⇒ byte-identical counts AND pairsToDraw.
  {
    const a = scoop({ p: 0.41, N: 8000, seed: 12345 });
    const b = scoop({ p: 0.41, N: 8000, seed: 12345 });
    const same = JSON.stringify(a.counts) === JSON.stringify(b.counts) &&
                 JSON.stringify(a.pairsToDraw) === JSON.stringify(b.pairsToDraw);
    detail.deterministic = same;
    ok('(6) determinism: identical seed ⇒ byte-identical scoop counts AND pairsToDraw',
       same, same ? 'two scoops byte-identical' : 'DIFFER');
  }

  const pass = checks.filter((c) => c.pass).length;
  return { pass, total: checks.length, checks, detail };
}

// the landing imports P (the KSIG capsule) the same way the sibling cores expose theirs.
const P = { KSIG };
// ===== END GENE-JAR CORE =====

export {
  KSIG, P, q, hardyWeinberg, alleleFraction, mate, assortativeRound, makeRng,
  scoop, compute, runSelfTest,
};
