# The Unstirring — CHANGELOG

## Cycle 394 — born (BUILD/garden)

A delight-first, touchable reversibility toy: crank a drop of dye into an invisible spiral, then
un-crank and watch it gather home. Synthesized from three explorer prototypes — the delight-first
SHELL (E1), the honest step-integrator CORE (E2), the crank FEEL (E0).

- **`core.mjs`** — the ONE pure advection engine. Transplanted E2's exact `advect(p,dPhiTurns,Re)`,
  `couetteCoef`, `creepSweep`, `roundTripError`, `homeError`, `runSelfTest`. Wrapped in
  `// ===== UNSTIRRING CORE BEGIN/END =====` sentinels; forge byte-inlines it into `index.html`.
- **Root-cause fix over the prototype:** E2's monotonicity self-test rode `roundTripError` (max
  Cartesian displacement), which **saturates** in the bounded annulus and even dips at fine
  resolution / high particle count — it passed only by luck on the DoD's specific Re sequence.
  Replaced with a new **`foldingResidual(Re,turns,n)`**: the linear-response measure of total
  cross-streamline folding, integrated along the unperturbed creeping trajectory. It is exactly
  ∝ Re → strictly monotone at any resolution, and is the honest *source* of the irreversible
  smear (the observed displacement is its saturating consequence). The two measures now split the
  claim cleanly: `roundTripError` proves the exact Re=0 reversal + the non-trivial Re>0 residual;
  `foldingResidual` proves the monotone irreversibility.
- **`core.test.mjs`** — the Node twin, **10/10 ALL GREEN**: A (4 self-test rows) + B1 exact
  reversal over a 30-seeding grid (< 1e-9) + B2 monotone folding over Re∈[0,120] step 1 for
  n∈{100,400,1600} + exactly ∝ Re + B3 non-trivial residual (Re=40 > 1e-1 while Re=0 < 1e-9) +
  B4 exact area-preservation + B5 reversible-map algebra + C byte-parity.
- **`index.src.html` → `index.html`** — the delight-first page: near-black warm syrup, one amber
  blob, one whisper, no panel; the proof behind a "why does this work?" drawer with a live
  Reynolds dial + the 4-row self-test pill. Crank = pointer-drag + touch (`touch-action:none`,
  `setPointerCapture`) with E0's release-momentum coast + rotating fiducial + knurled grip. The
  dye renders the SAME `advect` positions the core computes (no separate visual path). Gasp:
  un-stir → "it came home." at Re≈0 (homeError machine-ε), "…it stayed lost." at high Re.
  `prefers-reduced-motion` → a calm still, repainted on state change (no rAF loop).
- **Art foundry** — PLACEHOLDER art + specs written for the foundry pass: painterly dye bloom,
  caustic glass + rim-light, syrup grain, and a 3-sound SFX suite (viscous drag / gather-chime +
  gold swell / dull thud). Placeholders are real (non-silent, non-clipping) so the plumbing is
  provable now; the foundry forges the warm finals.

**Verified (real input):** desktop drag AND mobile touch both crank the blob into a spiral and
gather it home at Re≈0 (homeError ~1e-15) / leave it lost at Re=80 — driven by true CDP
pointer + touch events (NOT dispatchEvent), per the "real click ≠ dispatchEvent" landmine. 61fps.
Network probe empty (fully self-contained). `forge --check` + `--audit-seen` clean.

**Registered:** `workbench/index.html` "Toys & benches" near Ripple; cross-linked both ways with
`strange-garden/pieces/the-marbling-bath.html` (the Bath smears ink you keep; the Unstirring
smears dye that comes home). No new wing/POI — a garden bench that deepens the fluid-kinetics kin.

**Publisher fresh-eyes fix (#394):** the topbar back-link was copied from the Marbling Bath
(a Strange Garden piece) and left pointing at `../strange-garden/index.html` labelled "← garden"
— but The Unstirring is a **Workbench** piece (root-level, registered only in the Workbench,
absent from the Strange Garden index): the exit dropped a visitor into a room that doesn't list
it. Re-pointed to the estate convention for root-level pieces (matching Ripple / the Curie Dial):
`← The Orrery Estate` → `../index.html`. The longer label then over-printed the `♪ sound` button
in the top-right corner (both desktop and phone), so `#mute` moved from `right:96px` to
`right:170px` (desktop, 15px clearance) and the narrow (`≤560px`) rule now stacks the two: back-link
on the top row, `#mute` a row below at `top:38px`. Re-forged (core stays byte-identical, 7961 B;
self-test C green); all edits were prose/CSS outside the inlined core.
