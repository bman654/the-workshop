# The Benford Mill — changelog

## The one idea
Pour grains that are flat in ONE decade (uniform 1..10). Turn a crank: every pass MULTIPLIES
every grain by a random factor. The leading digits do NOT stay flat — they fall into Benford's
law, P(d) = log₁₀(1 + 1/d). The nine bins fill into the descending gold staircase (a 1 leads
~30.1% of the time, a 9 only ~4.6%), and a grabbable log-wheel shows WHY: a grain's mantissa
frac(log₁₀ x) smears uniformly around a circular log scale, and the arc each digit subtends on
that wheel IS its Benford height. The staircase is the wheel's shadow.

Benford is **dropped, not asserted** — you mill real grains and read a χ² goodness-of-fit verdict,
the same register as Buffon's π and the Galton board's bell.

## The honest spine (what is exact, what is a statistic)
- **EXACT (claimed PROVEN):** the closed form P(d)=log₁₀(1+1/d) sums to 1 to the bit (it telescopes
  to log₁₀(10)=1), and P(d) equals the width of digit d's mantissa interval log₁₀(d+1)−log₁₀(d) to
  machine epsilon (max error 4.16e-17). The wheel wedge and the bin gold-tick are BOTH drawn from
  `band(d)` — one oracle — so the two views can never silently disagree (self-test checks 1–3).
- **A STATISTIC (claimed FIT, never "proven"):** the milled bins do not *reject* Benford within χ².
  At the pinned gate seed χ²=1.15 ≪ 15.51 (α=.05). The Node honesty leg proves the mean χ² stays
  ≈ df=8 across budgets {300,1500,6000,20000} — it does NOT shrink to a fake zero. More grains do
  not make Benford "more exact"; the fit stays an honest fit.
- **The negative controls bite:** flip MULTIPLY→ADD (same factor stream, only the operator changes)
  and additive milling shoves every grain into 80–90, piling onto digit 8 — χ²≈17,900 ≫ critical,
  Benford REJECTED (min χ² over 40 seeds = 17,872, digit-8 pileup 40/40). A second control, a tight
  U(1,2) un-milled source, leads with 1 almost always (χ²≈3,483). Multiplicativity is the cause.

## Architecture — the buffon 4-file pattern
- `core.mjs` — the SOLE pure engine (RNG, the exact math spine, the mill, χ² machinery lifted from
  the Galton board, `run()` the one adapter, `runSelfTest()` the one oracle). Wrapped in the
  `// ===== BENFORD-MILL CORE … =====` sentinels.
- `index.html` — flat, self-contained, authored directly. The core body is inlined byte-identical
  between the same sentinels. One fixed three-quarter brass tableau: hopper → mill+hand-crank →
  nine glass bins (the gold staircase) → the grabbable log-wheel. The renderer is a thin state
  machine: one crank mutates `state.grains` once, then bins/wheel/pill/readout all RE-READ it.
- `core.test.mjs` — the Node twin: the 8 self-test checks + a deeper-budget honesty leg + a hard
  negative-control leg + the sentinel-to-sentinel byte-parity slice. `node benford-mill/core.test.mjs`
  exits 0 = GREEN (12 checks).

## Kin
- **The Slipstick** (primary) — its C/D scale IS this log-wheel: a length proportional to frac(log₁₀ v).
- **Two Ways to π** (prose) — a constant falling out of a process, not asserted.
