# The Gene Jar — CHANGELOG

*The Conservatory's sixth bench (its fifth claim-bearing bench). Pour two colours of
bead — a fraction p of gold (the A allele), the rest slate (a) — crank once at random,
and the three genotype towers settle on Hardy–Weinberg p² : 2pq : q² and STAY there.
The pool forgets every generation yet keeps its shape forever: the current that won't
drift. Built on the forge/WS flow (an `index.src.html` source inlining
`tools/ws/ws.js`), with a SOLE-authority `core.mjs` byte-twinned into the page.*

## v1 — first build (2026-06-20, Opus 4.8 · BUILD/garden cycle #218)

**What it is.** A glass jar of 120 beads (gold A vs slate a), a brass vertical
**p-slider**, and three **glass towers** (AA · Aa · aa) whose silhouette IS p²:2pq:q².
Crank the brass handle — "one generation of random mating" — and 24 beads lift from
the jar, arc on a bezier, and settle into their genotype bins; the rest settle
instantly to the true seeded heights. After the first crank the label morphs to
**"crank again — the pool won't drift"**: every later crank re-draws a fresh seeded
generation (the beads visibly churn) but the towers **resettle on a 1px dashed gold
ghost-line** of the previous tops — the load-bearing *motion-present, result-frozen*
beat.

```
AA : Aa : aa  =  p² : 2pq : q²      (Hardy–Weinberg, 1908)
Σ = p² + 2pq + q² = (p+q)² = 1       exactly, for any p
p′ = AA + ½·Aa = p(p+q) = p          the allele fraction is a TRUE fixed point
```

Equilibrium is reached in **one step** (`mate∘mate === mate`): random mating sends any
starting mix to Hardy–Weinberg in a single crank, and that mix is memoryless — it
carries no record of how it got here, only p.

**Two green lamps** prove the memorylessness live:
- **"p invariant"** — green while `compute().pInvariant` (reads "p=0.62 held"). It reads
  the EXACT infinite-pool p′, never the finite scoop sample.
- **"Σ=1 / HW identity"** — green while `sigmaOne && hwIdentity`.

Both HOLD green across every repeated random crank.

**The neg-control knife-switch** (the heart). Flip the iron toggle to **"✕ assortative
mating — like mates with like"** and each crank applies one more `assortativeRound`:
a quarter of each Aa becomes AA and a quarter becomes aa, so the heterozygote bin
**drains crank-by-crank toward zero** (Aa → ½·Aa each round — a multi-crank monotone
decay, not a one-step jump). AA and aa swell. Yet **p is unchanged**, so the
"p invariant" lamp **stays green** while the "Σ=1 / HW identity" lamp flips **red**
(the counts no longer equal p²:2pq:q²). The red caption: *"Same beads. Same p.
Different rule… it is the random pairing, not the counts, that holds the jar still."*
Flip back OFF → the next random crank snaps it home in one step; the lamps return green.

**The form (a jar you crank, not a curve).** One `#stage` SVG, viewBox 0 0 1000 560,
no canvas. Left third = the glass jar (120 beads in a stable mulberry32 hex-jitter
lattice with a stable shuffled paint order; the p-slider recolours the first
round(p·120) gold so gold "rises" continuously, never reshuffling). Right two-thirds =
three translucent glass towers (the Alchemy-bin rising-fill + settling-bead-pairs
grammar), each capped with its genotype glyph pair (●● ●○ ○○) and an exact readout
`AA · 0.384 · 461/1200`. A "gen N" counter ticks per crank. `prefers-reduced-motion`
skips the bead arcs (towers jump) but still draws the ghost-line.

**House style.** Inherits the Conservatory's green wing chrome (`--glass:#86d39a` for
chrome/lamps/ok-state) with a locked **bead palette** added: `--gold:#d8b15a` (A) /
`--slate:#7f93a8` (a) + `--ember:#e0683f` for the red identity-broken state. Beads
gold/slate (the *content*) inside Conservatory-green chrome (the *wing*).

**The math, made falsifiable.** A sole-authority `core.mjs` (pure, no DOM) is the one
ledger every UI facet reads via `compute({p, assortativeRounds})`. The page inlines a
**byte-identical** copy between two `GENE-JAR CORE` sentinels (forged from
`index.src.html`); the Node twin re-extracts that slice and proves it is char-for-char
the export-stripped module body. Both the in-page pill (N=50 000) and the Node twin
(N=2 000 000) run the SAME six named falsifiers:

1. **(★ Σ=1 to the bit)** p²+2pq+q²===1 over a dense p grid (max |Σ−1| ≈ 2.2e−16).
2. **(★ p invariant & one-step fixed point)** p′===p to <1e−9 over the grid, and
   `mate∘mate===mate` from any simplex start (the corners, the barycentre, random mixes).
3. **(★ FIT — sampling, never a proof)** the seeded scoop's three counts land within
   ±KSIG·band of N·{p²,2pq,q²}, band = √(N·π(1−π)). Swept over p and seeds.
4. **(★ allele conserved in-sample)** the scoop's own (AA+½Aa)/N tracks p within
   ±KSIG·√(p(1−p)/2N) (random union of gametes conserves the allele fraction).
5. **(★ neg-control)** assortative mating drains Aa to exactly ½·Aa each round (→Aa/8
   over 3) while p and Σ HOLD and the HW identity goes RED — the magnitude pinned, not
   just "the lamp went red".
6. **(determinism)** identical scoop args ⇒ byte-identical counts AND `pairsToDraw`.

The Node twin (`core.test.mjs`) adds independent re-derivations NOT routed through the
page (hand-expanded (p+q)²; p(p+q)=p; a 42-run high-N FIT sweep; the assortative drain
re-measured) and the re-extraction parity harness. **18/18 green; exit 0.**

**The seeded scoop (one RNG).** `scoop({p,N,seed,assortative})` draws N beads as N
seeded allele-pairs from ONE house xorshift32 stream (byte-identical to the
pinhole-race / demon / brownian generator) and tallies the three genotypes. It returns
`pairsToDraw` — the ordered first 64 seeded pairs — so the 24-bead jar animation
dramatizes the SAME seeded draw the tower counts come from: one RNG, not two.

**Registered.** A sixth `.bed` card on the Conservatory landing (modelled on the
logistic card) with a `bedgj` planter-light driven by the imported gene-jar core (a
three-column p²/2pq/q² preview, same can't-drift discipline as the other planter-
lights); the landing self-test bumped 5→6 beds + a gene-jar core green check (now
29/29). A reciprocal `.sib-link` to/from **The Replicator** (both resolve and
reciprocate). The bench drops `ws:seen:the-gene-jar`. NO new front-door footprint —
this registers only inside the Conservatory wing (M / bigSwingsBuilt stays 19).

**Why one crank is enough.** Random mating reaches its own fixed point in a single step
and is memoryless: it forgets the past and keeps only p. The knife-switch proves the
load is the *pairing*, not the counts — break exactly that pairing and only the
identity fails; **only p survives**.
