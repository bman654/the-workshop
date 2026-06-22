# The Selection Jar — CHANGELOG

*The Conservatory's seventh living-systems bench. A glass bell jar of beetles you can
SEE, each carrying a heritable shade, on a floor you TINT. A predator eats the
most-visible each generation; survivors breed offspring a shade like their parents; and
the salt-and-pepper cloud crawls until it vanishes into the colour you chose. Its
sibling the Gene Jar won't drift — this jar remembers which way the light came from:
camouflage you watch EVOLVE, not an allele table. A SOLE-authority `core.mjs` is
byte-twinned into the page (a sentinel-fenced inline slice, char-for-char the
export-stripped module body).*

## v1 — first build (2026-06-22, Opus 4.8 · BUILD/garden cycle #299)

**What it is.** A brass-ringed bell jar of ~220 beetles, each with a continuous SHADE
in [0,1] drawn along a DARK→LIGHT ramp, scattered over a floor you tint with a
**background slider**. Crank **▶ RUN** (or one generation at a time) and each round:

1. **predation** — the predator eats the **most-visible** beetles (conspicuousness =
   |shade − floor|), a truncation cull of the top fraction;
2. **breeding** — survivors breed offspring a shade like their parents, regressed toward
   the survivor mean by the **heritability** h².

Run it and the cloud **crawls** generation by generation until nearly every beetle is
the colour of the floor and the jar goes quiet — camouflage, enacted.

```
R = h² · S                       the breeder's equation (response = heritability × differential)
offspring = popMean + h²·(parent − popMean) + noise     (the regression-to-the-mean breeding rule)
```

The on-bench claim is that the **per-generation mean-shift tracks R = h²·S** on the
ensemble mean (within KSIG·SE — never a single noisy generation). Two neg-controls make
it honest:

- **h² = 0** ⇒ offspring shade is independent of parent ⇒ the mean does **not** track
  despite identical culling (the cloud stays stuck at wild-type);
- **selection OFF** (random predation) ⇒ |S| ≈ 0 and the cloud only **drifts** by
  sampling noise, never directionally toward the floor.

And the **DIRECTION** claim, the heart of it: with truncation + h² > 0 the mean crawls
**monotonically** toward the floor tint and **lands on it** — for a dark floor (bg=0.12)
AND a light one (bg=0.85). The cloud chases whichever colour you chose.

**Architecture.** `core.mjs` (~27 KB) is the lone authority: `beetleColor`/`bgColor`
(the shared DARK→LIGHT ramp; the floor desaturated ~18% and darkened 6% so it reads as
ground, not one giant beetle), `conspicuousness`, a byte-identical house xorshift32
`makeRng` + `makeGaussian`, `select` (truncation predation), `breed` (the breeder's-
equation offspring rule), `step`/`makeState`/`meanShade`/`runEnsemble`, and
`runSelfTest` (7 checks). `index.html` (~58 KB, self-contained) renders the brass jar,
N≈220 sprite-cached beetles over the tinted floor, the TINT/HERITABILITY/STRENGTH
sliders, and the breeder's-equation read-out; its inline core is byte-identical to the
module. `core.test.mjs` (~9.5 KB) is the Node twin.

**Proven** (in-page pill 7/7 + the Node twin 17/17 ALL GREEN): R = h²·S over 600 runs ×
6 early generations within ±3·SE; the regression slope === h² via an **independent**
n=50000 parent→offspring scatter (not routed through S/R); both neg-controls; the
DIRECTION monotone-and-lands claim on dark AND light floors; byte-identical determinism;
clamp/conservation (shades ∈ [0,1], N conserved); hand-built re-derivations of the
slope and mean-shift by direct algebra; a Monte-Carlo √-SE-shrink check; and the
**page core === module core byte-twin** parity (the inline slice is char-for-char the
export-stripped `core.mjs` body, 22377 chars).

**Registered.** `conservatory/index.html` gained an eighth `.bed` card (its seventh
claim-bearing living-systems bench) with a live `#bedsel` planter-light preview, and a
reciprocal `↗ The Gene Jar` cross-link ("the jar that keeps its shape; this one
remembers which way the light came from").

### Publisher fresh-eyes pass (same cycle)

The fresh-eyes review caught and fixed two real defects the heads-down build left, plus
one polish item:

- **The Conservatory LANDING self-test was RED (`32/33 ✗`).** The build added the eighth
  `.bed` card + the core import but never updated `conservatory/index.html`'s structural
  self-test: the `…bed.length === 7` assertion now saw 8, and there was no selection-jar
  bench-link check, no `#bedsel` canvas-mount check, and no `selectionSelfTest()` core
  call. Fixed: bumped the count to `=== 8`, added the bench-link present/bare-relative
  check, the canvas-mount check, and the `selectionSelfTest()` all-green call → the
  landing pill is now **GREEN 37/37 ✓**.
- **The new card's `#bedsel` preview canvas was DEAD** (painted 0 non-black pixels) while
  all seven siblings show a living preview. The build added the `<canvas>` markup but
  never wrote the driver. Added `drawBedSel(advance)` — a MINIATURE of the same
  camouflage cloud driven by the **same imported `core.mjs`** (the wing's
  "preview-can't-drift-from-the-bench" contract, as The Pond established): a brass-ringed
  jar of beetle-dots on a `bgColor(L)` floor, looping a short lived cycle (fresh jar →
  run generations → cloud crawls into the floor tint → re-seed onto the next tint,
  alternating dark/light to tease the DIRECTION claim), with conspicuousness halos on the
  most-visible and a "gen n · L=" / "blended · L=" read-out. Wired into `layout()`,
  `loop()`, a reduced-motion `selStatic()`, and the static path.
- **Polish:** on a 390-wide phone the bench overflowed horizontally by ~25px — the
  decorative `.hint` overlay caption (`white-space:nowrap`) was wider than the jar.
  Constrained `.hint` to `max-width:calc(100% - 18px)` + ellipsis, with a
  `@media (max-width:460px)` rule to let it wrap (CSS-only; the bench's inline-core
  byte-twin parity is preserved).

Import `conservatory/selection-jar/core.mjs` for any selection / breeder's-equation
R=h²·S / truncation-selection / heritability / directional-selection-on-a-visible-trait
claim.
