# Buffon's Needles — CHANGELOG

## #79 — planted (the long game you FEEL)

A self-contained wing where **π is DROPPED, not computed** — you read it off the heap.

A full-screen planked wooden FLOOR (warm-brown alternating planks, dark vertical seams spaced `t`
apart) is the hero. Flick anywhere = one needle; HOLD = a local burst; the ⛆ RAIN toggle + rate
slider auto-rains. Each matchstick lands at a random center with **uniform-random orientation**,
settles, and FLASHES GREEN if its body crosses a seam (or stays GREY if it lands clean). The
estimate `π ≈ 2·L·N / (t·crossings)` assembles in a bottom-left card with digit-lit feedback
(digits that already agree with true π are lit, the rest dim) plus the physical tally
(N tossed · C crossed). A quiet 1/√N tolerance **corridor** rides top-right — the running π
rattling inside a narrowing trumpet against a dashed true-π line — a glance, never the star.

### The negative control (the show)
A **bias the throw** toggle fixes every needle ⟂ to the planks. The floor clears, a rigid vertical
palisade builds, and the estimate marches to **2.0** (the corridor draws the 2.0 attractor it flees
to) — proving uniform orientation is load-bearing; the randomness IS the proof.

### Controls
- **needle L / gap t** slider, range 0.2–1.0 (clamped `L ≤ t` so the short-needle law `2L/(π·t)`
  holds — no long-needle regime without the correction). Changing the ratio re-defines crossings
  for the whole pile, so it **auto-clears the run** (accumulated counts under a different L would
  make the rail jump dishonestly). The bias toggle auto-clears too.
- **rain rate** slider · ⛆ rain toggle · clear.

### The proof (sole-authority core, byte-twinned)
- `core.mjs` holds the predicate `crosses(d,θ,L) = d ≤ (L/2)|sin θ|` — THE law. The canvas colours
  each needle by it AND the proof counts by it (one oracle, no second copy).
- The FULL commented core body is inlined **byte-identical** into `index.html` between the
  `BUFFON CORE` sentinels.
- `core.test.mjs` imports the module, runs the 4 self-test checks, adds a least-squares 1/√N slope
  check over 3 decades, AND byte-parity-checks the inlined copy in `index.html` against the module
  body. Exit 0 GREEN.
- The in-page self-test PILL runs the SAME `runSelfTest()` on load and shows **✓ 4/4 proven**.

### Self-test (Node twin — all GREEN, exit 0)
1. big-N estimate inside a 4σ Monte-Carlo band of `2L/(π·t)`.
2. error shrinks ~1/√N across 2 decades (ratio ≈ 10), plus a least-squares slope ≈ −0.5 over 3 decades.
3. the FIXED-ANGLE negative control biases the estimate to 2.0, far from π (uniform orientation
   load-bearing).
4. the crossing oracle's empirical rate matches the closed form `2L/(π·t)`.
5. byte-parity: the core inlined in `index.html` === `core.mjs` (anti-drift).

### Performance — the baked offscreen layer
The pile is the long game you *feel*, so it must keep accumulating without an fps cliff. The floor
plus every **settled** needle composite once into an offscreen canvas and blit in a single
`drawImage`; only the handful of still-animating needles draw live, and a needle bakes the instant
it comes to rest. This retires the old ~2,600-needle visual cap — settled needles are now cheap
pixels, so the heap can grow indefinitely while holding **61fps at N≈9,600** (the original
per-frame redraw of all needles collapsed to ~6fps past ~2,600). A `clear`, an L-change, or a
bias-toggle wipes the baked layer back to a bare floor.

### Polish
- Dialed back the green glow/blur and brightened the grey needles + the wood so the floor reads
  roughly half-and-half (it had over-read green).
- Mobile single column (floor → controls → readout); fixed the title/floor-hint overlap at the top
  of the narrow column.
- **(#80 publisher fresh-eyes)** Fixed a desktop-only slider-value overflow: the range inputs in
  the fixed-268px control panel had the flex default `min-width:auto`, so they couldn't shrink and
  pushed the `0.80` / `90` value labels ~43px past the panel edge (9px past the viewport). Added
  `min-width:0` to `#panel input[type=range]` — the labels now sit flush inside the panel at every
  width. Mobile (`width:auto` panel) was never affected.

### Files
- `index.html` — the wing (self-contained, vanilla, no deps, no network).
- `core.mjs` — the sole-authority logic core (exported for the twin).
- `core.test.mjs` — the Node twin (4 checks + slope + byte-parity).
- `CHANGELOG.md` — this file.

Grew from explorer C's prototype + grafts from sibling B (live L/t slider + heap-as-readout voice)
under A's scope-lock (L ≤ t).
