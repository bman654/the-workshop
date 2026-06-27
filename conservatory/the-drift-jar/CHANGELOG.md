# The Drift Jar — CHANGELOG

*The Conservatory's ninth living-systems bench, and the third of the jar trilogy
(Gene / Selection / Drift). A FINITE pool of M = 2N single-colour beads — gold and slate
— that nothing selects and nothing mutates: every generation each bead just COPIES a
random parent. RUN it and the colours wander by pure copying-luck until one is gone
forever. A finite pool always drifts and always ends monochrome — yet the fraction of
jars that fix gold is exactly the starting fraction p. Its sibling the Gene Jar (an
infinite pool) never drifts; the Drift Jar is the limit that jar never leaves — take
N → ∞ and the drift switches off. A SOLE-authority `core.mjs` is byte-twinned into the
page (a sentinel-fenced inline slice, char-for-char the export-stripped module body).*

## v1 — first build (2026-06-27, Opus 4.8 · BUILD/garden cycle #345)

**What it is.** Two views of ONE experiment, on one shared N (individuals) + start-p:

- **Panel 1 — the living jar.** A brass-ringed bell jar of M = 2N beads in fixed cells.
  Each generation plays as a three-phase beat — **LIFT** (parents rise to a translucent
  pool) → **DRAW** (copy-threads link each child to the parent it copied; parents copied
  ≥2× pulse bright, those copied 0× fade to ash — the dying lineage) → **SETTLE**. RUN it
  and the gold fraction x = k/M wanders until the jar goes **monochrome and quiet**, with
  a hairline "fixed GOLD/SLATE at generation T". **Click any bead** to *follow its
  lineage* — every cell descended from one founding copy — and watch that one ancestor
  conquer the jar or vanish (each founder has a 1/M chance to be the last one standing).
- **Panel 2 — the jar wall.** J glass vessels (12–240) run the same drift at once, each
  gold-filled to k/M; the instant a jar hits a pole it **seals** (gold cap glow / dark
  slate seal). A **pile-up tally** splits the *sealed* jars gold|slate with a hard tick at
  p₀ — as nFixed → J the gold share homes onto **p₀** — and a bold **ensemble mean x = p₀**
  read-out stays pinned as the wall fans apart. A thin **heterozygosity drain** empties
  each generation, its live fill the measured mean H, its ghost-tick the exact
  2p₀q₀(1−1/2N)ᵗ. A **N → ∞ toggle** freezes every jar mixed at p₀ forever (never seals,
  drain never empties) — drift shown to be a purely finite-N effect; in finite mode it is
  the literal Gene Jar next door.

```
M = 2N                                  the jar holds 2N gene-copies (a diploid pool of N)
next gold count ~ Binomial(M, k/M)      one Wright–Fisher generation (parent-pick resample)
u_i = i/M = p₀                          fixation prob = initial frequency (dense-matrix absorption)
E[x_t] = p₀                             the ensemble mean never drifts (a martingale)
H_t = 2p₀q₀·(1 − 1/2N)ᵗ                 heterozygosity drains by decayFactor = 1 − 1/2N per gen
```

**The locked convention (shared with the siblings).** A jar = N DIPLOID individuals =
M = 2N gene-copy beads, each a SINGLE colour (gold #d8b15a / slate #7f93a8) — this is what
makes the copy-lottery and monochrome-fixation legible. The user's knob is N; the jar
holds 2N beads; the rail shows both. Integer-honest start: k₀ = round(2N·p), and the TRUE
target is p₀ = k₀/M (NOT the raw slider) — every reference line (pile-up tick, fixation
claim, ensemble-mean line) uses p₀. House xorshift32 `makeRng` byte-identical to the
siblings; per-jar substream `(baseSeed ^ (0x9E3779B1·(j+1))) >>> 0`, j = 0 reserved for the
focus jar.

**Architecture.** `core.mjs` (~21 KB) is the lone authority: the byte-identical house
xorshift32 `makeRng`; the closed forms `copies`/`decayFactor`/`heterozygosity`/
`fixationProb`; the EXACT dense **(2N+1)-state Wright–Fisher matrix** proof layer
(`transitionRow` via log-choose+exp — full support, the DENSE chain, NOT the tridiagonal
Moran cousin — `buildMatrix`, `absorptionProbs` by dense Gauss with partial pivot,
`evolveDistribution` by t mat-vecs); and the LIVING-JAR primitives the UI animates
(`makeJar`/`stepJar`/`runJar`/`runEnsemble` — honest seeded sampling that carries founder
lineage, NEVER a proof). `index.src.html` → `forge` → `index.html` (gene-jar forge
pattern: a `<!-- forge:include ../../tools/ws/ws.js -->` + the breadcrumb OUTSIDE the core
sentinels, the slab hand-pasted between them byte-identical to `core.mjs`). `core.test.mjs`
(~9 KB) is the Node twin.

**Proven** (in-page pill 7/7 + the Node twin 20/20 ALL GREEN): exact Markov absorption
u_i === i/M to <1e-12 over N∈{4,8,12,16,20,30} (fixation prob = initial p, on the correct
dense matrix); the martingale (matrix-evolved mean === p₀); heterozygosity decay
(matrix H === 2p₀q₀(1−1/2N)ᵗ and H₀ === 2p₀q₀); the N → ∞ neg-control (decayFactor → 1
monotonically and H → 2pq, swept to a million — drift switches off, never fixes); the
ENSEMBLE WITNESS (gold-fixation fraction → p₀ within ±3·√(p₀q₀/jars), sampling never a
proof); byte-identical determinism; absorbing/conservation (every finite jar reaches
monochrome, M = 2N conserved each gen). The Node twin adds INDEPENDENT re-derivations not
through the matrix (the martingale by direct binomial algebra on a second PMF code path,
the coalescent recursion H_{t+1}=(1−1/M)H_t hand-iterated, the absorption fixed point
u=T·u row-by-row), **the family seam** (the Gene Jar's Hardy–Weinberg Aa === 2pq ===
the Drift Jar's H₀, and the Gene Jar IS the Drift Jar's N → ∞ limit), and the **page core
=== module core byte-twin** parity (the inline slice is char-for-char the export-stripped
`core.mjs` body, 17196 chars).

**Registered.** `conservatory/index.html` gained a ninth `.bed` card (the third jar) with
a live `#beddrift` planter-light preview driven by the same imported `core.mjs` (the
wing's preview-can't-drift-from-the-bench contract), a one-line **three-jar triangle**
framing ("does a gene pool DRIFT?"), the `driftSelfTest` landing-pill assert, and the
extended structural self-test (nine beds, the Drift bench link present + bare-relative).
Reciprocal cross-links: the Gene Jar ("a FINITE pool that DOES drift — the limit this jar
never leaves") and the Selection Jar ("drift with NO predator at all"). This is a DEEPEN,
not a detach: no new front-door POI, no new sky star, M (bigSwingsBuilt) stays 31, the
door pill stays green.

Import `conservatory/the-drift-jar/core.mjs` for any genetic-drift / Wright–Fisher /
fixation-probability / heterozygosity-decay / finite-population-sampling claim — and as
the proven finite-N companion to the Gene Jar's infinite-pool Hardy–Weinberg.
