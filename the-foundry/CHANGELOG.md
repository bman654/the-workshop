# The Foundry — CHANGELOG

The estate's casting house: potential fields decided by their boundary. A pinned
mold (Dirichlet rim) is poured full of molten chaos, then RELEASED to cool and
forget the pour, relaxing to the one harmonic field its boundary allows; a bead
then rides −∇T to a cold gate.

## cycle 305 — founded (BUILD / grounds, big swing #28)

The wing opened with its landing bench, **The Casting Floor · "The Pour That Cools."**

- `the-foundry/index.html` — the wing hub (engine-room/cavern landing mold): hero,
  the live casting-floor bay, three named-dark benches (the Wave Front, the
  Streamline Cast, the Charge Mold), bridges to Soap Film + The Lodestone Hall, a
  structural self-test pill (7/7), and the `ws:seen:the-foundry` breadcrumb.
- `casting-floor/core.mjs` — the SOLE field/residual/bead authority (DOM-free ESM,
  runs in node + browser), written GENERIC (a scalar field on a masked grid with
  Dirichlet fixed values + an optional Poisson source ρ) so the dark benches import
  it unforked. Red-black SOR with ω = 2/(1+sin π/N) derived from the actual N;
  `residualInf` (the honest mean-value defect); `descendGradient` (bilinear −∇T walk
  to a Dirichlet gate); closed-form oracles (linear ramp, one-hot-edge Fourier-sine).
  Inlined byte-for-byte into index.html between the CASTING-FLOOR CORE sentinels.
- `casting-floor/core.test.mjs` — the Node twin, 18/18 GREEN: CRUX-1 mean-value
  everywhere, CRUX-2 linear-ramp to 1e-6 (anti-circular), CRUX-3 Fourier-sine Σ,
  NEG-A Poisson break === ¼ρ, NEG-B early-stop beaches the bead, ω beats Gauss–
  Seidel, the bead always terminates on a Dirichlet gate (the maximum principle),
  red-black order-independence, ω>2 divergence, forget-the-pour uniqueness, plus
  byte-twin parity + a single-source grep.
- `casting-floor/index.html` (forged) — the touchable FORM: a sand-cast mold on a
  dark casting floor, the field drawn via a precomputed 256-entry incandescence LUT
  (single ImageData blit/frame). Four beats: CLAMP the rim (preset BCs) → POUR the
  mess → RELEASE the plug (it cools, the ghost fades, the pyrometer drives ‖∇²T‖∞→0,
  a SET stamp lands) → DROP a bead (it rides −∇T to the cold gate; drop several to
  hand-draw the streamline portrait). Neg-controls in hand: drop-early (wrong gate +
  ghost of the honest path), the Poisson riser (the loupe reddens, defect === ¼ρ),
  and the ω-dial past 2 (live checkerboard blow-up).

Registration: a new grounds footprint `casting-floor` (district grounds, tier 1,
wing `foundry`, footprint `crucible`) in index.src.html PLACES; a new `drawCrucible`
footprint glyph (a mold + ladle); a footer cross-link added on Soap Film. Advanced
bigSwingsBuilt 27 → 28.

Incidental repair: added the missing `drawRoundabout` footprint drawer — The Phantom
Jam's `footprint:"roundabout"` had no drawer, which threw `DRAW[r.footprint] is not a
function` mid-render and silently aborted the front-door POI render at that room
(everything after it — Electromagnetism, Drawing Engines, the new Foundry — never
drew). With the drawer registered the full plate renders again (72 POIs).
