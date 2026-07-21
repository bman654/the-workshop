# The Deep Hearth — CHANGELOG

A grounds wing: ONE side-on geological survey plate, read sky → core. Its live bench tunes a
volcanic conduit until the gas volume fraction reaches ¾ and the coherent lava ooze UNZIPS into
an explosive jet (the Sparks-1978 fragmentation criterion).

## #427 — The Settling Melt, the wing's 3rd live hall (BUILD/garden, planter)

A DEEPEN of the wing — the third hall, inside the chamber bulb the Melting Floor opens onto (no new
front-door slug, no map change). Upstairs you MAKE the melt; here you watch it come apart, and carry the
record out in your hand. Set a cooling history and POUR: six phases crystallize in strict liquidus order,
every crystal SETTLES and packs into strata, and when the body stills you drive a brass drill down and lift
a slender banded core onto a rack. Throw the floor lever to STILL — crystals stay entrained, nothing is ever
separated — and the same history comes up **blank**. The pair standing side by side is the whole argument.

- **`settling-melt/core.mjs`** — the SOLE crystal-settling authority (DOM-free ESM, ~250 lines, sentinel-fenced
  `// === SETTLING-MELT CORE BEGIN/END ===`). Bowen-order crystallization over a cooling window; a lever-rule
  solid fraction cross-checked against an INDEPENDENT step-marched melt ledger; the D=0 stranger enriched by
  exactly 1/F; per-band mean enrichment in closed form `log1p(d/(1−Sb))/d` (written with `log1p`, not
  `log((1−Sa)/(1−Sb))` — the ratio form throws away eleven digits on a hair-thin band); and trapped
  interstitial melt `fmin(rate, depth)` so the headline ×1/F is genuinely the visitor's (×8 quenched-shallow →
  ×71 patient-deep) rather than pinned. `runCoreTests()` → **40/40**.
- **MUTATION HARNESS (shipped)** — `simulate`/`pullCore`/`runCoreTests` take a mutation name that plants ONE
  bug (`order` · `mass` · `enrich` · `still` · `bandE`), and the Node twin asserts each planted bug actually
  TRIPS the check it targets. A test that cannot fail is not a test; now that is proved in the tree, not
  claimed in a comment.
- **`settling-melt/core.test.mjs`** — the headless twin. Shared `runCoreTests()` + the mutation harness + a
  24×24 history grid (order over all 15 pairs, mass closure <1e-9, enrichment ≡ 1/F) + an ANALYTIC IDENTITY
  giving a THIRD independent route to the enrichment (the mass-weighted mean band enrichment telescopes to
  `ln(1/fmin)/(1−fmin)`, from fmin alone) + closed-form vs Simpson quadrature over 2455 bands + a 441-history
  STILL neg-control + the payoff shape + byte-twin parity + the single-source grep. **63/63 green** via
  `./verify.sh`.
- **`settling-melt/index.src.html` → `index.html`** — the bench (~900 src lines). The chamber cutaway sits on
  the wing's shared `section.mjs` backdrop (`'melt'` camera, imported UNFORKED — section.mjs is byte-unchanged)
  with the shared depth ribbon. Crystals nucleate and fall with convective drift in six per-species HABITS
  (olivine equant · pyroxene stubby prism · amphibole needle · biotite platy · feldspar lath · quartz blocky);
  the pile packs as interlocking lumpy rubble slabs painted top-down; the residual melt walks ember → straw →
  a strange violet-white as the stranger concentrates. TWO readouts up the core: the mineral ladder (hue) and
  a violet ENRICHMENT STRIPE (slate at ×1 → violet-white at the core's max) — a STILL core kills **both**.
  An engraved LIQUIDUS RAIL on the chamber wall is an ambient readout, not a control: the falling temperature
  mark descends on its own and each of the six notches IGNITES with a ring pulse and a shake as it is crossed.
  The drill has THREE real paths — a pointer-capture DRAG, a PRESS, and keyboard ↓/Enter. Two-shelf rack of 10
  with a visible retirement rule; a tap-to-read core inspector; a dormant ember glow and a live invitation in
  the banked chamber. Honesty framing is a prominent panel on the page, not a footnote.
- **PAYOFF-LIVENESS TWIN** — `window.__settlingMelt.liveness()` drives the piece's OWN entries (`pourNow`,
  the same `step()` rAF drives, `driveDrill`) and asserts the payoff FIRES: a core created, tagged and RACKED,
  the swept one banded with a real gradient, the still one blank — never a synthetic canvas pointer event, so
  it runs identically headless. It sandboxes itself (the rack is snapshotted and restored). Second chip,
  green on load: **10/10 payoff fires**.
- **`the-deep-hearth/index.html`** — the landing now reads "three live benches": a new `a.bench` dock, a LIVE
  `engraveNiche` + `descend('melt', …)` inside the chamber bulb, and the structural pill at **10/10**.
  `verify.sh` gained the new twin.
- Browser-verified on a served origin at 1400×1000 and 430×900: both chips green, console clean, **60.1 fps**
  while cooling, and the payoff observed firing on all three drill paths (a TRUE input-level CDP drag, the
  press button, and ↓ keys) — swept banded core and still blank core standing side by side on the rack.
- **Publisher (fresh-eyes) fix — the ghosted stratum label.** `section.mjs` bakes its engraved stratum names
  into the plate's right margin flush to `W−12`. In this hall the rack panel stands exactly there, and it was
  filled at `rgba(14,10,7,0.90)` — so "CHAMBER WALL" bled through the 10% at the bottom of the rack and, where
  the panel's right edge fell 4 px short of the label's end, read as clipped type ("CHAMBER WAL"). The sibling
  Melting Floor renders that same label cleanly in open plate, which is what made it legible as a defect rather
  than as texture. Fixed **locally**, without touching the shared byte-locked `section.mjs`: the rack fill is now
  opaque (`#0e0a07` — the panel is meant to stand *forward* of the plate, not veil it) and its right margin is
  12, not 16, so the panel reaches the label instead of stopping just inside it. Both layouts (wide + narrow).

## #401 — The Melting Floor, the wing's 2nd live bench (BUILD/garden, planter)

A DEEPEN of the wing (no new front-door slug — the wing already registers in `tools/layout/layout.js`).
The whole piece is ONE gesture: grab the engraved country-rock lid and LIFT IT OFF THE ROCK — you add no
heat, you take weight off, the confining pressure falls, the solidus slides down through the fixed
geotherm, and a pool of incandescent partial melt blooms upward out of the chamber to meet the lid in
your hand. Decompression melting, made touchable.

- **`melting-floor/core.mjs`** — the SOLE decompression-melting authority (DOM-free ESM, ~290 lines,
  sentinel-fenced `// === MELTING-FLOOR CORE BEGIN/END ===`; INDEPENDENT of the conduit core — works in
  depth-metres directly so the single-source grep stays clean). Lever-rule melt fraction
  `F = clamp01((T_g − T_s)/ΔT_sl)`, a linear crossing-depth solve, a provable interior `dF/dL = A·G_rock/ΔT_sl`,
  a refractory neg-control, and a roof-aware `pressureAt(z, L)`. `runCoreTests()` → **11/11**.
- **`melting-floor/core.test.mjs`** — the headless Node twin. Shared `runCoreTests()` + a fine 50×50×1000
  lever-rule sweep (rendered march F === closed `meltFraction()` to <1e-9), a 60×60 crossing-vs-bisection
  cross-check, the gesture end-to-end (seated SOLID → full lift MELTS, crossing sweeps 1050 m), monotone-in-lift,
  a dense refractory neg-control, byte-twin parity, and the single-source grep. **23/23 green** via `./verify.sh`.
- **`melting-floor/index.src.html` → `index.html`** — the lid-lift bench (~790 src lines). The melt pool is
  painted INTO the rock (`opacity = F`, a crystal-mush stipple thinning to zero as F→1, rising schlieren);
  the draggable hatched lid + knurled brass handle + spring/ghost-rest + decompression halo; the engraved
  solidus⟂geotherm side-gauge; the shared depth ribbon fed the lid-aware `P(z, L)`. Real `setPointerCapture`
  pointer drag, ↑/↓/Home keys, a Seat button, a secondary water dial, and a refractory toggle with a felt
  hard stop. Physics pill **11/11**. `core.mjs` forge-inlined byte-for-byte (page 17355 chars === module 17355).
- **`section.mjs`** — grew a third `'melt'` camera arm (cy 2230, H/1200 window framing ~1630–2830 m); the
  conduit + establishing arms are left byte-identical (the conduit twin still 20/20, no regression).
- **`index.html` (landing)** — flipped the Melting-Floor `.coming` card to a live `a.bench`; the structural
  pill grew a melting-floor dock check (**8/8**); `engraveNiche('MELTING FLOOR')` now renders a LIVE glowing
  descend-dock, `descend()` generalized to tween to the conduit OR the melt; the footer + "two live benches"
  heading updated. Two `.coming` niches remain (Slow Creep · Shadow Zone).
- **`verify.sh`** — now also runs `melting-floor/core.test.mjs`.

Verified fresh-eyes (publisher, served :8793 torn down by PID, agent-browser session `pub401` closed):
bench pill **11/11**, landing pill **8/8**, conduit sibling **10/10** (no regression); the gesture drives live
(keyboard lift: SOLID→MELTING crossing 2119 m/46%/ΔP −18 MPa→REFRACTORY); the melt pool BLOOMS — incandescent
pixels 91k at a full lift, dropping to ember-only (~3k) when seated and staying dark (~0.7k, below seated) under
the refractory neg-control at a FULL lift; `verify.sh` 23/23 + conduit 20/20; `forge --check --all` all current;
all cross-links 200; mobile 390px no horizontal overflow; zero console errors. *(Environment note: agent-browser's
`mouse down` did not deliver a `pointerdown` in this headless tab — same class of automation limitation the builder
flagged for screenshots/rAF; the source correctly wires `pointerdown`+`setPointerCapture`, and the keyboard drive
exercises the same `Ltarget`→`frame()` render path, so the physics is fully confirmed in-environment.)*

## #349 — wing opened (BUILD/grounds, grounds-worker)

The wing's first two pages + its shared spine + its front-door footprint.

- **`conduit/core.mjs`** — the SOLE physics authority (DOM-free ESM, ~290 lines). The fragmentation
  predicate: viscosity (silica) sets the bubble–melt coupling χ(S); the volatile budget (gas) exsolves
  via Henry's law C_s = s·√P as pressure falls; the retained gas expands (ideal gas) so the gas VOLUME
  fraction φ = n·v_g/(n·v_g+(1−n)·v_m) climbs toward the vent; EXPLOSIVE iff φ_max ≥ ¾; the
  fragmentation height z_f solves φ(z_f)=¾. The predicate is monotone in BOTH dials by construction
  (χ depends on S only, the surplus on w only — the water-weakening of viscosity is kept OUT of the
  predicate, in `etaFeltLog`, used only to animate bubble/ooze speed).
- **`conduit/core.test.mjs`** — the headless Node twin. Runs the shared `runCoreTests()` + heavier
  sweeps: rendered column MARCH === closed-form predicate over a 60×60 dial grid (ZERO disagreements);
  φ monotone ↑ toward the vent; boundary monotone in both dials with a non-increasing threshold curve
  w*(S); on the boundary φ_max=¾ exactly and z_f at the vent lip; neg-controls (gas→0 fragments nothing
  across all silica; basalt at MAX gas stays effusive); χ(S) + type-viscosity monotone; byte-twin
  parity (the inlined CORE slab === core.mjs); single-source grep. **20/20 green** via `./verify.sh`.
- **`section.mjs`** — the SHARED geological survey-plate renderer + depth-ribbon component, imported by
  BOTH pages (this shared spine is the structural proof the landing + bench are ONE room). WORLD geology
  (sky → ash → conduit → magma chamber → mantle → ember core), cameras (establish / conduit), a baked
  static plate, and the byte-identical depth ribbon with a you-are-here window.
- **`index.html`** — THE STANDING SECTION (landing): the establishing cutaway (lightly live — melt
  glimmer, drifting bubbles, chamber + ember-core pulse), the glowing live-conduit dock (click → dolly
  tween → descend), 3 named-dark sibling niches at true depths (Melting Floor · Slow Creep · Shadow
  Zone), a bridge to The Foundry, structural pill **7/7**, drops `ws:seen:the-deep-hearth`.
- **`conduit/index.src.html` → `index.html`** — THE SAME VENT, TWO TEMPERS (bench): dollied into the
  conduit, an incandescent molten column with a φ-driven bubble field, two engraved brass wellhead dials
  (SILICA log-viscosity with named rock-zone arcs + detents · DISSOLVED GAS), the luminous FRAGMENTATION
  PLANE sliding at z_f (read DIRECTLY from `predict()`), RELEASE THE VENT (decompression march),
  a minimal engraved verdict strip, physics pill **10/10**. `core.mjs` forge-inlined byte-for-byte.
  Arrives at `?from=establish` and tweens in, continuing the landing's dolly.
- **Front-door registration:** `GROUNDS_WINGS['the-deep-hearth']` (a disjoint lot in the lower
  west-central park) + `WING_META` (accent #e24a2a) in `tools/layout/layout.js`; a new tier-1 POI in
  `index.src.html`'s PLACES. Verified disjoint via `smoke.cjs`; `door-mirror.cjs` regenerated for the
  84-POI plate (the new POI re-anneals the label solve — the known #340/#343 landmine), `door.test.cjs`
  exit 0, live door pill GREEN 17/17.

Verified: `forge --check --all` all current · `smoke.cjs` exit 0 · `door.test.cjs` exit 0 · `./verify.sh`
green · both pills green in-browser · descend tween landing→bench works · all five cross-links 200 ·
mobile 390px no horizontal overflow · zero console errors.
