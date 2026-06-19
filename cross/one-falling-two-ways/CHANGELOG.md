# One Falling, Two Ways — CHANGELOG

A garden **cross** of **The Drop Tower** × **The Water-Clock**: a free-falling cabin's
brake-entry speed and a tank's Torricelli jet speed are the SAME law **v = √(2gh)**,
ridden onto ONE gold √-groove by a single shared height dial.

## #152 — bloomed (2026-06-18)

Built `cross/one-falling-two-ways/` (the seventh garden cross), catalogued on the
workbench beside its six siblings; no new front-door/map footprint.

### The pieces
- **`core.mjs`** — pure ES module. Imports the two foreign cores LIVE
  (`drop-tower/core.mjs`, `hours/water-clock/core.mjs`, both two `../` hops) above a
  byte-twin `// === CORE … ===` slab the page inlines char-for-char. Two g-bearing
  recovery adapters, each in disjoint sub-sentinels:
  - `dtEntryV(h)` = the cabin's `verdict.vBrakeEntry` from the drop-tower's own
    integrator (= √(2·g_DT·h), g_DT = 9.81).
  - `wcJetV(h)` = the Torricelli jet recovered from the water-clock's outflow ODE
    `dh/dt = −(a/A)·v` ⟹ `v = −dh/dt·A/a` (= √(2·g_WC·h), g_WC = 9.80665;
    AREA-INDEPENDENT — shaped bore === cylinder to 4.4e-16).
  - Shared surface: `vSqrt`, `warpForGroove` (the exact g_DT/g_WC head-warp),
    `grooveReadout`, `rawJet`/`rawGap` (the teeth), `rideRatio`, and the two
    neg-control readouts `coastEntryV` (flat) + `metronomeSurfaceSpeed` (= WC.C).
- **`core.test.mjs`** — the Node twin, 7 legs / 29 checks, `process.exit(0)` on green.
- **`index.html`** — one brass instrument: ROW 1 two butted bays (a drop-tower shaft +
  a water tank sharing the head fraction), ROW 2 the gold √-groove with two riders that
  overlap into one gold marker, ROW 3 the shared head dial + two brass-switch
  neg-controls + a `▷ release`. In-page self-test pill === the Node twin.

### What it proves (self-test, machine-ε)
1. **Anti-circularity** — both adapters reproduce their core's OWN √ law (<1e-12); the
   jet is area-independent.
2. **Headline** — over (0, H_MAX] the cabin entry speed and the WARPED-head jet agree
   to **4.4e-16**; both === the gold groove √(2·g_GROOVE·h); one rideRatio √(2·g_GROOVE).
3. **Teeth (the warp is load-bearing)** — the un-warped relative gap is bounded below
   (≥1e-4 at h≥0.05) AND === the EXACT identity **1 − √(g_WC/g_DT) = 1.7076e-4**,
   h-independent (<1e-7). Remove the warp and the gap caps there, never ε.
4. **Neg-control A (coast)** — a cable-held cabin coasts flat ⟹ rideRatio spreads
   **2.449×** ⟹ fails the √-collapse (real free-fall ratio constant <1e-12).
5. **Neg-control B (metronome bore)** — the even-ticking bore drops the surface at the
   flat WC.C ⟹ rideRatio varies ⟹ fails the √-collapse (a true jet's ratio is constant).
6. **Byte-twin parity + disjointness** — page CORE === core.mjs CORE char-for-char; the
   two adapter blocks name no foreign fn of each other.

### Honest scope
The two benches were measured at slightly different g (9.81 vs 9.80665). The shared
groove is held at the cabin's g and the tank's head is warped by the exact g_DT/g_WC so
the laws coincide; the un-warped 1.7076e-4 gap is disclosed (it IS the teeth proof), not
hidden. Idealized: point masses, no drag, an inviscid jet, an instantaneous release.

### Wiring
- Workbench card added in the "reciprocal crosses" group (glyph 🜄).
- Bidirectional ↔ teasers from `drop-tower/index.html` and `hours/water-clock/index.html`
  (correct ../ depths); cross back-links to both parents in topbar crumbs + footer.
