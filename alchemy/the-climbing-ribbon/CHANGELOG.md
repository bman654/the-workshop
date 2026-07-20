# The Climbing Ribbon — CHANGELOG

A lidded glass developing jar you peer INTO — the Alchemy Lab's ninth bench, and the
paper-half of a **separation pair** with the Fractionating Column (the Column sorts by
how readily a molecule *leaves* — its boiling point; the Ribbon by how tightly it
*stays* — its affinity for the paper). Blend 2–4 apothecary pigments into one **muddy**
ink, dab it on a paper ribbon just above a pool of solvent, and press **Develop**: the
wet front creeps up the paper (Washburn √t, visibly decelerating) and the mud **parts**
into a rising ladder of coloured bands — solvent-loving pigments ride high near the
front, paper-clinging ones lag low. A self-rescaling brass ruler reads each band's
**Rf** off `band ÷ front`, and the same tick lands whether the strip is short or long.

Slide the solvent's polarity to the marked **notch** (the paper's own polarity) and
every band snaps to **Rf = 0.5** — the ladder collapses to one line, nothing separates
(the paper alone does no work). Slide **across** the notch and the whole ladder
**inverts** — the leader becomes the trailer — proof it is the stationary-and-mobile
*pair* that separates, never either phase alone.

## The shape

- **`core.mjs`** — the SOLE separation authority. `retention(pigPol,mobilePol,statPol)`
  is the regular-solution partition factor `k = exp(BETA·[(p−m)² − (p−s)²])`
  (like-dissolves-like; the square form is pinned because it is *linear* in pigPol, so
  it guarantees a strict, total order-reversal). `rf(...) = 1/(1+k) ∈ (0,1)` is the
  closed form the ruler ticks read. Two INDEPENDENT front laws — `washburn` (v=D/2H,
  the decelerating capillary rise) and `linear` (v=c) — graft in to kill circularity.
  `makeRun`/`develop` integrate the COUPLED front + band ODEs by RK4 (never the closed
  form): `dH/dt = v(H)`, `dB_i/dt = rf_i·v(H)`. Because rf_i is a constant multiplier
  on the same stage velocities, `B_i === rf_i·(H−H0)` emerges EXACTLY — the render
  animates this walk and re-derives nothing.
- **`core.test.mjs`** — the Node twin. Proves the CRUX (`band ÷ front` invariant across
  ≥3 stop-times × ≥3 strip lengths × BOTH front laws to <1e-9 — non-definitional, the
  invariance emerges from independent RK4 walks), NEG-CONTROL A (phases identical ⇒
  every Rf === 0.5 bit-exact ⇒ co-migration), NEG-CONTROL B (a shipped pigment pair +
  two shipped solvents straddling the paper polarity whose Rf order reverses — plus the
  total reversal of every pair), the PAYOFF (default blend resolves into ≥2 separated
  bands), HONESTY (Rf dimensionless in (0,1), compared to no handbook value; band
  width is a render flourish that never enters the Rf), and the LIVENESS probe (the
  front climbs & decelerates, a separating solvent parts the blend, the notch
  co-migrates it). Ends with a byte-identical re-extraction parity check against the
  page's inline core.
- **`index.html`** (built by forge from `index.src.html`) — the developing jar: layered
  glass with edge highlight + sheen, a stopper, condensation fog on the inner lid
  (feTurbulence), a caustic on the base, a concave solvent meniscus, and a subtle
  parallax across three depth planes as the pointer moves. The core is inlined
  byte-identical between `RIBBON-CORE` sentinels with an in-page re-extraction parity
  check + a green self-test badge. The ruler's ticks are the SAME `rf()` the badge
  attests — the bench can never show a ladder its own math disowns.

## The honest register

The only claims are **invariance** (`band ÷ front` does not depend on the run) and the
**two neg-controls** — all exact. Rf is never compared to a handbook value. Pigment and
solvent names (Lampblack, Verdigris, Naphtha, Aqua…) are estate-invented tones whose
only physics is a model polarity parameter. Band broadening (a Gaussian width that grows
with distance climbed) is a rendered flourish only: Rf lives on the band centroid.

## Gates at ship

In-page self-test **13/13 ✓**; Node twin **23/23 GREEN**; the wing landing attests
**9 benches · 122/122 ✓** (ribbonProof wired into `benchMathProof`); `forge --check`
all current; manifest unclaimed 0 (auto-enrolled under alchemy, 427 pieces); no
horizontal overflow desktop or 390px mobile; console clean; payoff observed firing on
the live Develop path (front climbs, three bands part with min gap 0.21; the notch
co-migrates them to a single line).
