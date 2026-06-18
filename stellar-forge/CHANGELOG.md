# The Stellar Forge — changelog

## Cycle 141 — wing opened (big swing, grounds)

**THE STELLAR FORGE** — the Observatory's Stellar wing. Where a dying star is *weighed*, not
just watched: two ordered gates decide three fates, and the body answers in light.

### Flagship — `scales/` · The Scales of a Star's Death
- One DOM-free `<canvas>`. A luminous in-body star you collapse by dragging a single brass
  **collar** beneath it (core remnant mass 0.5 → 3.0 M☉; arrow keys nudge, shift = coarse).
  Two engraved gate ticks: Chandrasekhar (≈1.44) and TOV (≈2.2–2.3).
- The body IS the readout (form expresses content — no axis, no external scale):
  - **White dwarf** (M < 1.44): a limb-darkened sphere, colour temperature driven by mass
    (ember → blue-white as you push toward the gate), a slow breathing pulse + cooling corona.
  - **Neutron star** (1.44 ≤ M < 2.2): one-shot implode to ~12% radius (cubic-in) with a
    core-bounce shock ring, then a persistent spin-up with two opposed pulsar beams + oblateness
    wobble. Crossing back below 1.44 plays in reverse (re-inflates) — the boundary is reversible.
  - **Black hole** (M ≥ 2.2): the event horizon irises shut over the light; the surviving rim
    redshifts (blue-white → amber → deep red → gone) into a thin Einstein ring; persistent black
    disk + a cheap fake-lensed ring of background starfield. Chamber vignette dims ~15%.
- **Degeneracy ladder** gauge (grafted legibility, kept cheap): a two-segment vertical readout —
  electron (lower) / neutron (upper). The active segment fills accent; crossing each gate the
  bearing segment visibly FAILS (snapped red seam) and the load shifts up. Passive, driven by
  `classify(M)` — no claim rests on its animation; it makes visible WHY there are exactly two limits.

### The math crux — `scales/core.mjs` + `scales/core.test.mjs`
- DOM-free, zero-dep ESM. `M_CH = 1.44`, `M_TOV = 2.2`, `classify(M)` (throws RangeError on a
  non-physical mass). The claim is the STRUCTURE — two ordered gates ⇒ three ordered fates —
  not a knife-edge mass (TOV is EOS-dependent; engraved "≈2.2–2.3").
- Inlined byte-for-byte into `scales/index.html` between the STELLAR-SCALES CORE sentinels;
  the Node twin byte-parity-checks the page copy against `core.mjs`.
- Node twin (26 checks green): Chandrasekhar flip (1.43→dwarf, 1.45→ns), TOV flip (2.1→ns,
  2.4→bh), monotone fate ladder, ordered gates + boundary direction, domain guards, and an
  `alwaysNeutron` negative control that provably FAILS both flip pairs.

### The wing
- Landing `index.html` (self-contained, observatory aesthetic, accent #9db4ff): the flagship card
  + a "next growth" card for **The Fusion Ladder** (the iron-peak bench, sown for next growth).
- Registered: one PLACES entry in the front-door `index.src.html`
  (`district:"observatory", tier:2, wing:"stellar", footprint:"tower"`); `WING_META.stellar` added
  in `tools/layout/layout.js`. Re-forged; breadcrumbs `ws:seen:stellar-forge` (landing) +
  `ws:seen:stellar-scales` (flagship) drop on visit.

### Verified
- `node scales/core.test.mjs` → 26/26 green, byte-parity IDENTICAL.
- `node tools/forge/forge.mjs --check --all` → all current; `--audit-seen` → all breadcrumbs drop.
- `tools/layout/smoke.cjs` → all layout checks pass; map composes with the Stellar Forge room in
  the observatory district.
- agent-browser (uniquely-named session, ?v=N cache-bust): self-test pill green 5/5, 61 fps, clean
  console; white-dwarf / neutron-star / black-hole all read clearly, degeneracy-ladder failures
  legible, reverse transition (bh → wd) returns rScale=1 / iris=0.
