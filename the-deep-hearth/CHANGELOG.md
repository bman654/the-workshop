# The Deep Hearth — CHANGELOG

A grounds wing: ONE side-on geological survey plate, read sky → core. Its live bench tunes a
volcanic conduit until the gas volume fraction reaches ¾ and the coherent lava ooze UNZIPS into
an explosive jet (the Sparks-1978 fragmentation criterion).

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
