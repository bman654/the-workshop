# The Ten-Fold Glass — changelog

## cycle #451 — the twin: THE HOUR-GLASS (the same wheel, but it turns TIME)

**What it is.** A LIVING twin of the Glass, gathered as a nested exhibit at
`ten-fold/hour-glass/index.html` — the same knurled brass drum and zoom-to-descend
engine, but its number `d` picks which **tempo** is real instead of which size fills
the frame. ~33 honest-log decades of DURATION hang on the wheel: a light-wave crest
at 10⁻¹⁵ s → a fly's wingbeat → a camera flash → a heartbeat at 10⁰ → a day's turn →
a season → a life at 10⁹ → all of writing → the ice advancing → a mountain rising →
the whole of life at 10¹⁷, then blank paper above (the honest "nothing drawn here"
terminal). Where the Glass is space-STILL ink, this is **time-ALIVE**: each drawn
span actually TICKS at its scaled tempo, and nesting is temporal — ten cycles of the
child tile one frame of the parent and recede to a flicker, exactly as a plate shrinks
to a smudge on the space axis. Claim-free **pure delight**; what it owes and proves is
**liveness**, not a theorem.

**DEEPEN, not a new front door.** Same engine (`glass.mjs`, UNFORKED, shared with the
Glass under a kept byte-parity test), same room shell, two glasses on one bench in the
Observatory Rise's `vantages` wing — space & time. No second front-door footprint, no
new sky star. Presented off the Glass's chrome via the `sib-glass` first-class idiom
(the twin link `the hour-glass →` on the Glass, `THE HOUR-GLASS →` reciprocated).

### Built this cycle

* **A shared-core refactor of `glass.mjs`** so ONE `makeAxis` factory builds BOTH
  worlds — `SPACE` (metres, the Glass) and `TIME` (seconds, the Hour-Glass) — from a
  single geometry with two ladders. The byte-parity slab is inlined into BOTH forged
  pages between sentinels; `forge --check --all` confirms they agree.
* **`ten-fold/hour-glass/spans.js`** — all **21 drawn spans hand-authored as bespoke,
  clean-loop vignettes** at the day/ice/cosmos bar (no `_default` fallbacks remain).
  Each follows the contract: unit-space draw, seamless phase-loop, `grain()+smudge()+
  fuse()` finish, and a `drawComb()` reduced-motion still-branch. The vignettes span
  the fast pole (a blue sinusoid with a travelling gaussian light-packet · glossy
  atoms breathing on a spring · a myelinated axon firing a violet action-potential · a
  flashbulb that blooms then decays over a seamless taper past an always-present standby
  lamp · a fly's wing sweeping through motion-blur ghosts) through deep time (glyph-rows
  scrolling up a parchment · a night skyline kindling at dusk with a construction crane ·
  a snow-capped alpine peak rising over an OPAQUE twilight sky, then eroding · an ocean
  globe whose two continents part over a warm mid-ocean ridge · a teeming field of
  fronds, medusae and coiling shells each on its own life-phase).
* **`ten-fold/hour-glass/hour-glass.test.mjs`** — the Node liveness twin, **45/45 green**,
  running the SAME `runTimeTest()` the in-page `?selftest` chip runs (driving the REAL
  detent entry function, never a synthetic canvas event), plus the seconds-ladder shape,
  the exact readout over a full down-and-back (no drift, 10⁻¹⁵ s bottom back to 10¹⁸ s),
  the shared-`makeAxis` assertions, and the **byte-parity** check (30064 == 30064 chars).

### The liveness twin (headless-drivable, drives the REAL control)

`runTimeTest()` proves the EXPERIENCE FIRES: every span TICKS, the tiling is exactly ten
child-cycles per parent frame, the gazed span is always watchable, the fast pole is honest
(the persistence glow falls with `e`, pinned to `1−1/e` at the fusion period, and the
animate→steady seam is continuous), and reduced motion is a real second design (phase never
auto-advances · one press == one beat · ten child sub-beats · momentum hard-zeroed at the
source). In-page `?selftest` → **✓ liveness 18/18**.

### Verified (fresh-eyes review, cycle #451)

Served on `:8829` and driven in a real browser (torn down by exact PID): Node twin
**45/45** with byte-parity, in-page `?selftest` **18/18**, `forge --check --all` all
**180 current**, manifest `--check` OK (**446 pieces, unclaimed 0**). Drove the REAL
control (`window.hourGlassPress`) across the ladder — the heartbeat landing, the camera
flash (burst-caught mid-bloom: glints firing + standby lamp lit), the reworked mountain
(crisp peak, opaque sky), the whole-of-life field (fronds/medusae/shells teeming), and
the wave of light (sinusoid with a travelling packet) — all render at the bar with a
clean console at ~60 fps. Mobile overflow **0 px** at 320 / 390 / 460. The sibling
Ten-Fold Glass repainted clean with its reciprocal twin link. No bugs found; no red-letter
day (a nested exhibit / DEEPEN is not a *first*).

## cycle #441 — the room stands; the art is out to the foundry

**What it is.** A new front-door room at `ten-fold/index.html`: one knurled brass
coarse-focus wheel, and forty-one decades of the world hung on it. Twenty-five
hand-inked plates from the nucleus (10⁻¹⁵ m) to the whole of it (10²⁶ m) all live
on ONE continuous exponential axis, each drawn at `VIEW · 10^(e−d)` about a single
pinned world point. Nesting is a **consequence of the geometry**, never a
per-pair cross-fade: the plate you are standing on shrinks continuously into a
smudge inside its parent, which was drawn at its true size the whole time.

**Deliberately claim-free.** No theorem, no neg-control, no accuracy pill. What
it owes and what it proves is **liveness** — see below.

### Built this cycle

* `glass.mjs` — the DOM-free core (LADDER · LEGEND · the outward-accumulated
  anchor chain · the monotone invertible finger warp · the velocity-dependent
  pawl · presence · `renderPlan` · `stepDetent` · `sanitizeD` · `runSelfTest`).
  Forge-inlined byte-for-byte into the page between sentinels.
* `glass.test.mjs` — the Node twin. 46 checks, all green: the shared liveness
  suite, the ladder's shape, the fix-point chain, the detent driven for real, the
  reading, presence + the plan, the pawl's settle/coast/elastic-end behaviour,
  the warp, restore, and **byte-parity** of the inlined slab.
* `plates.js` — all 25 plates, forged in-house, each in two layers: the drawing,
  and a **scale-free field texture in octaves** (only the octave currently
  landing in a legible pixel band is drawn, so a plate magnified a thousandfold
  stays a picture instead of a wash). Every plate is composed AROUND its anchor
  and draws a plausible smudge there for its child to resolve out of.
* `rig.js` — the brass rig extracted as `RigArt.drum(g, w, h, d, opts)`: the
  knurl whose phase IS the decade, a detent groove machined at every ten-fold,
  and the leaf-spring pawl that lifts on a crest and drops into a groove.
* `index.src.html` / `index.html` — the room. The wind (partial clear → a true
  radial zoom-streak, because the axis is a pure scale about one point), the
  shared log-space mote field (identical at every decade, tinted by the band's
  weather), the engraved rule carrying a legend at EVERY detent whether or not a
  plate is drawn there, the reading that never rounds away its decimals, the
  detent click, the elastic ends, the phone rig (horizontal drum, rule beneath,
  an UPRIGHT cursor pill), and a real reduced-motion second design.
* `art-specs/` — the foundry batch: `preview.html` + `render-take.sh` (a three-
  panel bench that renders any candidate at its own decade, arriving as a speck,
  and **blown up 300×**), plus twelve briefs.

### The liveness twin (headless-drivable, drives the REAL control)

`runSelfTest()` runs identically in Node and behind the page's `?selftest` chip:

* **(a)** from the top of the ladder, detent impulses ALONE visit every plate
  index on the way down and again on the way back — none unreachable, none skipped;
* **(b)** the decade readout after N detents is exactly the start decade minus N;
* **(c)** at every 0.1 of the whole travel the plan draws ≥2 plates, and the drawn
  child/parent size ratio equals 10^(Δe) to <3e-16 over 1485 pairs;
* **(d)** a stored decade (absent, corrupt, out of range) restores to a sane one;
* **(e)** under reduced motion momentum is hard-zeroed **at the source**;
* **(f)** the finger warp is monotone and invertible (a re-grab never snaps);
* **(g)** *(page only)* pressing the room's real control moves the real room.

### Verified

Served on :8931 and driven in a real browser: 9/9 in-page green at 1440×900 and
at 390×844, 61 fps at the hand, zero console errors or warnings, the front-door
map renders with door PASSABLE 12/12, `forge --check --all` clean (174 files),
manifest `--check` OK, estate 40/40, sky 89/89.

### Placement

**DEEPEN**, not found. The room joins the Observatory Rise's existing `vantages`
wing beside *Cor Caeli* and *In the Round* — the estate's wing of "where you
stand changes what the world is", asked here along the SCALE axis instead of the
angular one, and physically the same object as its neighbour: a brass instrument
you turn in your hands for its own sake. It is not its own place because one room
about scale, with a named sibling already in the estate's hand, gathers better
than it stands alone — and no grand name goes over one dot. Its star lights the
existing **celestial** figure (Firmament · Orrery · the Glass).

### The forged art landed — wired + verified (cycle #441, wiring pass)

The art foundry forged all twelve requested assets and the synth installed each at
its live call site; this pass verified the wiring end-to-end and re-forged the page:

* **10 plates re-forged** into `plates.js` (`hand · fern · cell · atom · street ·
  city · earth · sunfamily · galaxy · whole`) — each a real drawing over a
  scale-free field texture, composed around its anchor. The hand is now a weighted,
  lamplit hand whose skin resolves into ridges and pores under blow-up (no longer a
  line drawing); the orrery carries a limb-darkened granulated photosphere; the
  galaxy resolves into separable stars threaded with winding dust lanes. The other
  15 plates are the estate's original ink, unchanged.
* **`rig.js` → machined brass.** `RigArt.drum` now reads as worn, knurled metal —
  discrete crest/flank/root ridges, reflections that walk the flanks (no emissive
  glow), umber detent grooves, a readable pawl pose — not the old gradient bands.
* **`sfx.js` → the detent snick.** `Gate.sfx['tenfold-detent']` is a struck-brass
  pawl seating in a groove (peak −9.5 dBFS, A♯3, inharmonic partials to a clean
  tail), forge-included into the page and fired by `click()` on every odd ridge.

**Wiring self-test (served :8942, real browser + CDP).** 25 `PlateArt` keys present,
no placeholders / no `st_prof` / no stray test-hook globals; `node --check` clean on
all three modules; `forge --check --all` 174 current (page re-forged with the real
art); manifest `--check` OK; twin `glass.test.mjs` 46/46 with byte-parity; in-page
`?selftest` 9/9. Real art looked at across the ladder (hand, vein, orrery, the
honest "no plate is drawn here" gap at 10⁹·⁵, nucleus, chloroplast). Sound payoff
rendered offline from the live builder — peak 0.247, rms 0.012, 8273 non-zero
samples (it fires). Phone 390×844: horizontal drum, upright pill, no overflow.
**Reduced motion confirmed in-browser** via CDP `setEmulatedMedia` (the prior pass
could not flip it): `matchMedia` true, exact one-decade-per-press stepping, velocity
held at 0, nesting preserved, opaque clear (no trail). The room is complete.
