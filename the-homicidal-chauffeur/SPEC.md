# The Homicidal Chauffeur — the estate's continuous pursuit

Isaacs' 1965 differential pursuit game, played. A fast brass automaton car (the **pursuer**,
`vp=2·ve`) hunts a slow pedestrian (the **evader**, you). The car is twice your speed — a straight
flee is always run down — but it can only turn at a bounded rate (minimum radius `R`). Your *only*
tool is that turning constraint: lead it, let it commit, then jink across its nose so it must swing
out in a wide arc of radius `R`, and slip through that overshoot to the far gate.

**A Warren DEEPENING, not a new front-door footprint.** Reachable through the Warren's reciprocal
`.cousin` card (discrete *where you stand* ↔ continuous *when you jink*). No `index.src.html` POI,
no Survey-of-Heaven star, no gate re-forge — M stays 31. The `ws:seen:the-homicidal-chauffeur`
breadcrumb is inert (nothing reads it by id).

## The three-layer stack on ONE verified core (meshing-wheels idiom)

- **`core.mjs`** — the single kinematic authority between the `=== CHAUFFEUR-CORE BEGIN/END ===`
  sentinels (inlined byte-for-byte into the page; exports live outside). `advance(s,κ,ds)` exact
  constant-curvature arc · `follow` · `dubinsWords`/`dubins` (six closed-form words) · `pursuerStep`
  (curvature-clamped pure pursuit, `|dh|≤ds/R`) · `flee` · `makeJink` (stateful optimal evader) ·
  **`stepPair(p,e,evaderVel,sc)`** — the ONE shared substep (pursuerStep → advance evader → capture
  `sep≤ell`) that BOTH the played RAF loop and the scripted `sim()` call · `runSelfTest()` →
  `{checks,passed,total,ok}` (the four headline Dubins claims, <~100ms). `R` is the single lever:
  it appears only in Dubins `κ=±1/R` and the pursuer clamp.
- **`index.html`** — inlines the CHAUFFEUR-CORE region byte-faithfully, paints the `#selftest` pill
  (4/4), and runs the free-play game over the same core: drag-to-steer (pointer→world; evader walks
  toward the cursor at `ve`), an omniscient pursuer handicapped ONLY by `R` (fair — a loss is "I
  jinked wrong"), WIN = reach the teal far gate, LOSE = capture. A 3-round arc (I·The Tell R=5.6
  ghosts on · II·The Charge R=5.0/ℓ=0.18 the verified base · III·The Wound Spring R=4.4 needle gate),
  the constraint-GHOST (the two min-radius turn circles, default on), a "Disarm the constraint (R→0)"
  toggle that makes the win evaporate live (playable claim [4]), heat-tail + commit/nearMiss feel
  signals, and a compact WebAudio layer (engine drone rising with commit, overshoot whoosh, capture
  thud, win chime; gated on first gesture, `ws:pref:muted`-aware). All art procedural canvas, brass
  escapement-plate scene; ZERO foraged assets.
- **`core.test.mjs`** — the Node twin (`verify.sh` wraps it): the four-claim oracle + heavy sweeps
  ([1] 3000-config Dubins, [1b] independent Newton-shooting oracle 320 configs, [ODE] RK4 of the raw
  unicycle ODE → exact arc, [2]/[3]/[4] deterministic pursuit sims) + **byte-parity** (the CHAUFFEUR-
  CORE region inlined in `index.html` is byte-identical to `core.mjs`). ALL SIX claims green in Node,
  four on the pill.

## Verified (cycle 347)

`./verify.sh` → ALL GREEN (incl. byte-parity 11510 bytes). In-browser: pill 4/4, ~61fps, clean
console; a straight run is caught at 5.62s, a jink-then-dash reaches the gate (won at 12.6s),
disarm (R→0) makes the same jink caught at 2.84s. `forge --check` clean (no `.src.html` for this
room). Reciprocal Warren links live both ways.

## Natural next

A **third** pursuit piece would earn the family its own dedicated landing (the Hall/Cavern mold);
until then the Warren and the Chauffeur gather by reciprocal link (see `warren/SPEC.md`).
