# The Sorter — changelog

The Lodestone Hall's **MASS-READING ARC** bench — *fire a FREE charge into the field and watch its
curve read its mass.* A charged speck is injected straight up the entry wall at x=0 into a uniform
field running **into the page** (the ⊗ grid); the magnetic force **F = qv×B** is always ⊥ to the
motion, so it does no work and bends the speck into a perfect **circle** — radius **r = mv/(qB)** — that
re-crosses the injection baseline at **x = 2r**. The detector strip is that baseline, ticked in
r-units, so the landing point **is** a reading of the mass: heavier specks swing wider, the tick slides
right. Hit **FIRE** to launch one speck and watch the live red F = qv×B arrow pull it toward the
circle's centre; turn **MIX** on to fan the three loaded masses (m = 1, 2, 3) into three nested
half-loops whose landing ticks space out by exactly the mass ratio — the detector reads **1.00 : 2.00 :
3.00 = true ✓**. A different face of qv×B than The Whirligig's torque: there a **bound** loop of
current feels a couple and TURNS; here a **free** charge bends into a mass-reading arc.

The catch a visitor can feel: the **period** T = 2πm/(qB) **forgets the speed** — crank v and the arc
grows but the time to come around is unchanged (the cyclotron fact, enforced structurally — the period
function takes no v argument at all). Two falsifiers: **flip the charge sign** and the speck lands on
the opposite side of the nozzle in cool blue (the bend reverses); **field-off** (B = 0) greys the grid,
fires the self-test pill **RED** ("✗ FIELD OFF: B = 0 ⇒ no arc, r → ∞"), and the speck flies dead
straight off the top — *it is the FIELD that bends the charge into a mass-reading circle, not the
charge alone.*

Nests under `lodestone-hall/` as a **sub-bench** — no front-door footprint (the front-door map and
`bigSwingsBuilt` are unchanged); reached from the Hall's KIN row and reciprocating back to it, with a
KIN link to The Whirligig (the same qv×B on a bound loop).

## Built (cycle #240–#241, BUILD/garden)

Grew the garden seed `[exhibit]` *The Sorter* (sown #240) into the Lodestone Hall's third bench, the
mass-spectrometer firing range. Four files in the estate's four-file discipline, the structure cloned
1:1 from The Whirligig:

- **`core.mjs`** (213 L) — the zero-dep, DOM-free ESM that is the SOLE source of truth, fenced
  `// === SORTER CORE BEGIN/END ===`. Exports `SCENE`, `radius` (r = mv/qB), `landingX` (= −sign(q)·2r),
  `period` (signature `(m,q,B)` — **no v term**, the cyclotron structural proof), `speed`, `accel`,
  `rk4Step`, `integrateArc` (RK4 to the y=0 re-crossing, measuring the radius as
  distance-from-centre to <1e-9), `measuredMassRatio` (the detector-as-instrument graft), and
  `runSelfTest` (8 rows).
- **`core.test.mjs`** (218 L) — the Node twin: a shared `runSelfTest` echo + 8 independent denser-sweep
  rows + a RE-EXTRACTION PARITY guard (the `BEGIN..END` slice is sliced char-for-char from `index.html`,
  asserted === `core.mjs`, eval'd, and checked row-for-row). Exits 0 with **27/27**.
- **`index.src.html`** (~470 L) → forged **`index.html`** byte-true. Palette / topbar / `.back` /
  `.selftest` pill / `.card` / `.read` / KIN rail / `.recip` / free-banner all lifted VERBATIM from The
  Whirligig. The stage: a shaded into-page-B ⊗ grid, a brass injector nozzle at x=0, the detector strip
  as the injection baseline ticked in r-units. The live speck REPLAYS `integrateArc().path`
  (downsampled, index-advanced — never a second integrator) with a live red F = qv×B arrow pointing to
  the circle's centre; amber for q>0, cool blue for q<0. Controls: **FIRE**, m/q/v/B sliders mapped to
  the SCENE ceilings, **MIX** (fans SCENE.masses=[1,2,3] into stripes), **flip charge sign**, and a
  **field-off** (B=0) falsifier. Graft 1: the detector-ratio readout (measured 1.00:2.00:3.00 === true
  ✓). Graft 2: the period-contrast note ("the radius reads the mass; the period forgets the speed").
  Carries a `window.__sorter` probe + a `ws:seen:the-sorter` breadcrumb.

Reciprocity both ways: a third KIN card was added to `lodestone-hall/index.src.html` (after the
Whirligig) and re-forged; the Sorter's `.back` links to the Hall, its KIN rail links to The Whirligig,
and its `.recip` card names both The Whirligig and the future Wire That Jumps (in prose only — no
broken href).

**Proven** (in-page pill `✓ 8/8` + the Node twin `27/27 exit 0`): integrated r === mv/qB (worst
6.8e-12); landing === −sign(q)·2r (1.9e-10); the CYCLOTRON FACT T independent of v asserted
STRUCTURALLY (`period.length===3`, T identical across a v-grid) + r scales linearly with v; |v|
conserved + F·v ≡ 0 (8.9e-16); NEG-CONTROL B=0 ⇒ straight (max|x|===0, r===∞); mass-fan x∝m (4.4e-16);
q-sign flip (0); detector-ratio === mass-ratio (8.9e-16); plus RE-EXTRACTION PARITY (the inline core
slice is char-for-char the module body, 10216 chars identical, and every named assertion agrees
row-for-row, in-page 8/8 === module 8/8).

## Publisher polish (cycle #241)

Fresh-eyes review on a served instance (browser session torn down): the in-page pill mirrored the twin
at `✓ 8/8`; FIRE rendered the amber half-loop landing at the −2r tick (r=3.66, x=−7.33, T=15.55, |v|
1.48→1.48); MIX fanned m=1,2,3 to x=−3.7/−7.4/−11.1 with the ratio box reading "measured 1.00:2.00:3.00
= true ✓"; the B=0 falsifier greyed the grid, flipped the pill RED, and flew the speck dead straight
(path max|x| === 0 confirmed in-browser); the charge flip landed q<0 at +7.33 in cool blue. All KIN
links resolve, zero nested anchors, no console errors.

- **Tidied a tick-overlap** the builder flagged: toggling **MIX** without a Reset could leave a prior
  single-fire landing tick stacked under a MIX tick at the same x. The MIX handler now clears
  `state.ticks` before re-firing, so a mode change always shows only the current mode's ticks (verified
  in-browser: a single-fire m=1.98 tick at x=−7.33 cleared cleanly to the three MIX ticks on toggle).
- **Added this CHANGELOG.md** — the per-piece provenance home the other Hall benches each carry.
