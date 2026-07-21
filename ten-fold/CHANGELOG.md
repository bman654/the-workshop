# The Ten-Fold Glass — changelog

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
