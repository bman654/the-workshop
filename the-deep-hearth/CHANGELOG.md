# The Deep Hearth — CHANGELOG

A grounds wing: ONE side-on geological survey plate, read sky → core. Its live bench tunes a
volcanic conduit until the gas volume fraction reaches ¾ and the coherent lava ooze UNZIPS into
an explosive jet (the Sparks-1978 fragmentation criterion).

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
