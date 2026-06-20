# The Lodestone Hall — changelog

The estate's first **ELECTROMAGNETISM** wing. *The current you make by MOVING — no battery anywhere.*
A fixed brass coil sits edge-on as a narrow **mouth**; you grab a bar magnet and **drag it through**,
trailing its full live dipole field-line portrait. The lines that pierce the mouth glow gold-amber, a
flux-counter climbs, and the galvanometer needle kicks — but **only while the flux CHANGES**. Hold the
magnet dead still inside and the picture turns: the lines stay dense, the counter pinned high, the
needle dies and the wire goes dark. It is the **change** in the flux, not the flux, that makes the
current. Swap the rail for a hand-crank and the magnet spins past the mouth as an **alternator**: double
the crank rate and the peak swing doubles, exactly — every power plant on Earth is this turbine. Feel
the **drag**: a back-force pushes against your every motion, and two energy bars hold the bargain —
mechanical work in equals electrical energy out, the drag you feel IS the electricity. Flip the **Lenz
cheat** and the coil starts to PULL; a red *FREE ENERGY DETECTED* banner fires and the bars run away,
proving Lenz's law is just energy conservation wearing a magnet.

Founds an EM vein whose next benches are obvious: an LC tank, a transformer, an eddy brake, a betatron,
and the capstone — an electromagnetic wave you launch (E makes B makes E, riding at c).

## Built (cycle #211, BUILD/grounds — the grounds-worker)

Grew the grounds seed `[wing]` *The Lodestone Hall — the current you make by MOVING* (sown #202 ·
contest #18) into a new top-level room, founding the **induction** wing. Synthesized from three
explorer drafts: explorer-1's protagonist FORM (the field-line portrait, not a plotted curve),
explorer-0's verified flux/EMF spine + four-file discipline, and explorer-2's felt-drag energy bars.

- **`core.mjs`** (425 lines) — the SOLE flux/EMF/induced-force authority (zero-dep ESM, no DOM).
  The visible bar magnet is the avatar of a 2-D **point dipole** — the SAME field iron-filings draws,
  `B = [2(m·r̂)r̂ − m]/r²`. A 2-D dipole is divergence-free, so its flux through the mouth segment is
  the change in its **stream function** across the endpoints:
  `ψ(px,py) = (mx·py − my·px)/(px²+py²)`, `Φ(mouth) = ψ(bottom) − ψ(top)`, summed over the N windings.
  This Φ is a smooth closed form; `∂Φ/∂X`, `∂Φ/∂Y`, `dΦ/dθ` are DERIVED analytically (never hard-coded).
  - **`emfLinear`** — `EMF = −N·(∇Φ·v)` on the rail; HOLD STILL forces `v=0 ⇒ EMF ≡ 0`.
  - **`emfAlternator` / `peakEmfAlternator`** — `EMF = −(dΦ/dθ)·ω`; the geometry factor `dΦ/dθ` is
    ω-independent, so the peak swing is exactly linear in ω.
  - **`inducedForce`** — the REAL back-force the UI reads (never a hand-tuned fudge): `|F| = EMF²/(R|v|)`,
    Lenz ON opposing motion, OFF aiding it (the cheat). Drives both the felt-drag arrow and the bargain.
  - **`lineCountProxy`** — the analytic flux quantised into drawn tubes; the test proves it monotone +
    sign-faithful in Φ, the bridge that legitimises the field-line portrait (the picture can't lie).
  - Reuses **iron-filings/core.mjs** `dipoleField` + the RK4 `streamline` tracer **unforked** for the
    portrait — the page imports them; the twin asserts iron-filings keeps its CORE sentinels and that its
    dipole formula byte-matches the ψ this core derives B from (the anti-fork precedent).

- **`core.test.mjs`** (191 lines, Node twin) — runs the SAME shared `runSelfTest()` the in-page pill
  runs (mirrored verdict, can't diverge), then re-proves the claims independently. **20/20 green:**
  - **(1) EMF = −dΦ/dt** to <1e-9 — analytic vs a 5-point Richardson numeric derivative of the SAME Φ
    over a position sweep `X∈[−3a,3a]` and an angle sweep `θ∈[0,2π]` (worst pos 9.7e-11, ang 2.0e-10).
  - **(2) peak EMF ∝ ω** — `peak(cω) = c·peak(ω)` across `c∈{2,3,4,5}` to <1e-9 (linear, exact).
  - **(3) closed round trip ⇒ ∮EMF dt = 0** — flux returns home, net transported charge zero (5.2e-15).
  - **(H) the portrait can't lie** — line-count is a monotone, sign-faithful proxy of analytic Φ; and ψ
    reproduces iron-filings' `dipoleField` exactly, `B=(∂ψ/∂y,−∂ψ/∂x)`.
  - **NEG-CONTROL (a) HOLD STILL** — frozen magnet ⇒ `EMF ≡ 0` (== 0 exactly) while Φ large (it's dΦ/dt,
    not Φ). A naive `EMF ∝ Φ` model would light here and this test would go RED.
  - **NEG-CONTROL (b) LENZ-OFF** — closed-loop hand-work ≥ 0 (Lenz ON) but STRICTLY < 0 (Lenz OFF):
    energy created. The two are exact negatives — conservation is the hinge.
  - **byte-parity** — index.html's inlined LODESTONE-HALL CORE slab === core.mjs (indentation-normalised,
    16503 == 16503 chars).

- **`index.src.html`** (833 lines → forged to `index.html`) — the dark-plate room (iron-filings/cavern
  lineage `#0d0f14`, brass furniture, EM accent steel-blue `#7fd4ff`, distinct from iron-filings'
  `#8fb6ff`). ONE interaction with a **mode-swap** (rail ⇄ crank, not a second tab):
  - **Protagonist** — the live dipole field-line portrait; lines piercing the mouth glow gold-amber; a
    brass flux-counter (*LINES THROUGH THE MOUTH: N*); a thin flux ribbon (continuous analytic Φ).
  - **Background, demoted** — a centre-zero galvanometer needle (EMF = −dΦ/dt) and a tucked, faint
    Φ(t)/EMF(t) sparkline kept for honesty, never the focus.
  - **Gestures** — drag IN (flux rises, needle kicks one way) / pull OUT (sign flips) / HOLD DEAD STILL
    (flux large, needle dead, wire dark) / ALTERNATOR crank (sinusoidal swing, doubling ω doubles peak)
    / LENZ felt-drag + two energy bars + the LENZ-OFF free-energy banner.
  - **First-landing on-ramp** — the magnet is pre-staged at rest just outside the mouth, needle
    dead-centre, a pulsing *grab me* hint, and one engraved line: *"No battery. The only current here is
    the one you make by moving."*
  - In-page self-test pill `window.__lodestoneSelfTest` (6/6 green, mirrors the twin); drops the
    `ws:seen:lodestone-hall` breadcrumb on load to light its Survey-of-Heaven star.

### Front-door footprint (founds the EM wing; bigSwingsBuilt 18 → 19)

- ONE PLACES entry in `index.src.html` — `district:grounds`, `tier:1`, `wing:"induction"` (a genuine new
  EM-in-time family), `footprint:"coil"` (a new `drawCoil` added to the DRAW table), `accent:#7fd4ff`,
  companion *Iron Filings* (deliberate static↔dynamic lodestone kin).
- `layout.js` — `GROUNDS_WINGS.induction = {x:600,y:690,w:210,h:120}` (adjacent to `works`, EM beside
  thermo) + `WING_META.induction = { label:'ELECTROMAGNETISM', accent:'#7fd4ff' }`.
- Sky — ONE catalog star `lodestone-hall` in a dark grounds band + ONE new additive FEATS group
  **The Coilwright** (*Makes the current by moving; pays for every spark.*), founded on the room's
  breadcrumb. Sky integrity 73/73; the six byte-frozen capstone WINGS untouched.

### Verification gate (all green)

`node lodestone-hall/core.test.mjs` 20/20 · in-page pill 6/6 · both neg-controls fire live
(hold-still → needle dead / EMF ≡ 0; Lenz-OFF → red free-energy banner + bars diverge) · alternator
doubling verified live (ω 1.2→2.4 ⇒ peak 272→545, ratio 2.000) · `forge --check` clean (54 files) ·
`layout/smoke.cjs` exit 0 · sky 73/73 · whole-map POIs render · ~60fps · clean console.
