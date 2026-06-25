# The Aquarium — CHANGELOG

A new top-level GROUNDS room (a glasshouse in the Gardens, water beside the
living-systems Conservatory): an ambient, edge-to-edge lit tank of the deep you set
running and leave breathing.

## Cycle #317 — founded (BUILD / grounds, a big swing)

The first build of the room, synthesized from three explorer prototypes into one
coherent tank.

### The spine (the ambient register — the headline)
- Full-window edge-to-edge canvas with a brass-edged CSS rim; indigo+brass deep-water
  palette (room accent `#5b73c4`); the house topbar (← the workshop · brand · fps chip).
- A true DEPTH GRADIENT: sunlit teal → blue twilight → near-lightless floor. Slow raking
  CAUSTICS in `screen` blend confined to the lit upper column. A cold chemosynthetic
  VENT glowing teal at the floor with rising mineral smoke, a chimney silhouette, and
  coral/tubeworm fronds; the glow breathes and scales gently with the basal stock.
- A SOFT-BOID school: per-fish wander + per-species depth-keeping spring toward its light
  band + cheap stride-sampled separation + feed-attraction. A `boil` scalar drives
  speed/tail-beat/glow on feed/startle, then decays to drift. No hard Vicsek alignment —
  a loose, calm school. The depth-keeping spring was TIGHTENED (0.05 → 0.075 + band-half
  pad) so the layers read crisp.
- Light fails with depth (every fish dims as it sinks); self-lit species (lanternfish,
  copepods, vent shrimp) carry their own glow so they stay visible — the chemosynthesis
  idea made visible, not captioned. Swim-shape vocabulary: dart / drift / graze.
- A NAMED population CEILING (CAP = 240), enforced by the reconcile's proportional
  ceiling-trim, with a live `n/240` load meter. A bloom can never exceed it.
- Reduced-motion freezes the sim but keeps the painted scene.

### The three acts
1. **SET** — per-species rail steppers (a keeper multiplier on each species' live stock),
   depth-banded, respecting the cap.
2. **FEED** — tap the glass: pellets sink + decay, the swarm boils up, nibbles, resettles.
3. **TUG** — pull the apex out (a button OR drag a lancetfish up out the waterline) and
   watch the trophic cascade ripple down; "let it back in" restores it. A brief clock
   speed-up + a "the column is answering…" toast during the transient.

### The verified trophic core (the quiet crux — tucked away, beauty leads)
- `core.mjs`: a DOM-free discrete-time Lotka–Volterra food web, 4 levels
  (apex lancetfish → lanternfish → copepods → basal vent shrimp on the vent's logistic
  chemosynthesis). PARAM `{dt:0.05, rBasal:1.2, K:80, a:[0.035,0.02,0.02],
  e:[0.7,0.7,0.5], m:[0.05,0.05,0.08]}`. The intact web settles to a stable coexistence
  fixed point ≈ [19, 2, 51, 12].
- The VISIBLE swarm densities are read LIVE from the core (boid count per species ∝
  standing-stock), so the picture and the proof can never drift. The cascade is shown
  ENTIRELY as swarm density changing in the water — never a plotted curve.
- `core.test.mjs` (the Node twin, `node the-aquarium/core.test.mjs` exits 0): proves the
  cascade reaches ≥2 levels (lanternfish 2.0→33.5 bloom · copepods 51.0→3.6 thin) and
  TWO honest neg-controls, plus byte-parity of the frozen PARAM and determinism. An
  in-page green pill runs the SAME `runTrophicSelfTest()`.
- **Strengthened neg-control (the cycle's required crux fix):** the old isolated-5th-node
  control was structurally trivial (an un-run node changing nothing proves nothing). It is
  replaced with a GENUINELY CONNECTED, NON-CASCADING node — removing the copepods (fully
  wired into the web) DOES perturb the dynamics, yet lanternfish FALLS instead of blooming,
  proving the bloom is specific to pulling the APEX. The discriminating contrast (same
  species, opposite sign depending on which node you pull) is asserted directly.

### Sound (a procedural STUB, gated, one shared mute)
- A soft filtered-noise water bed + slow LFO swell + a sine plink on feed, behind the
  first-click gate ("tap the glass to begin", which also scatters first food and arms
  audio unless the estate is muted). One shared estate mute via `ws:pref:muted`.
  DynamicsCompressor limiter so it never clips.
- `window.__renderOffline(seconds) → WAV` kept for Audio Lens. Verified this cycle:
  not silent (silenceRatio 0.014), not clipping (peak −11.8 dBFS), a dark low-passed bed
  (centroid 171 Hz) — calm, leave-it-running.

### In-house art (all non-stub assets forged in-house — never foraged)
- Placeholder procedural art THIS cycle (vector fish in the dart/drift/graze vocabulary,
  sine-sheet caustics, hand-tuned vent gradient + smoke + fronds, the sound stub), each
  wired to a per-asset SPEC in `art-specs/` so the art foundry forges the high-fidelity
  versions in a follow-up:
  - `art-specs/fish-lancetfish.md`, `fish-lanternfish.md`, `fish-copepods.md`,
    `fish-ventshrimp.md` — per-species silhouette + swim-cycle (visual-exhibit).
  - `art-specs/caustics.md` — the raking-sunlight caustic light field (visual-exhibit).
  - `art-specs/vent-coral.md` — the hydrothermal vent + coral floor (visual-exhibit).
  - `art-specs/SOUND.SPEC.md` — the water bed + bubble + swish builders (`Aqua.sfx.*`).
  - `art-specs/preview-harness.sh` + `preview-page.html` — the foundry render harness
    that draws a candidate asset in the real tank context and screenshots `preview.png`.

### Registration + verification
- A new front-door footprint: a PLACES card in `index.src.html`
  (`grounds`/`glasshouses`/`glasshouse`, accent `#5b73c4`, no nested anchor) and a gate
  POI in `the-gate/the-gate.src.html`. Front door + gate re-forged.
- Verified fresh-eyes (served on :8717, torn down by exact PID; agent-browser session
  `aqua317` named + closed): 0 console errors on load + set/feed/tug; desktop + mobile
  (390×844, no h-scroll) sweep; all outbound cross-links 200; `forge --check --all .`
  clean (100 files); `node core.test.mjs` 15/15 green; in-page pill green; front door
  renders with no map error; gate POI honesty chip green (15/15 ✓) in ?dev.
