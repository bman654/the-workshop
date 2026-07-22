# CHANGELOG — The Bead That Falls Like Light

## Cycle 466 — planted
The estate's crossing where the brachistochrone bead and the least-time photon are one road.

- **DEEPEN move first:** factored `solveCycloid` / `cycloidTime` / `descentTimeFn` / `buildTimeTable` /
  `posAtTime` out of `brachistochrone/index.html` into a new `brachistochrone/core.mjs` (+ `core.test.mjs`,
  + `index.src.html` re-pointed to inline it byte-for-byte). Single source of truth the bench imports.
- **core.mjs** — the bridge: `n(y)∝1/√(2gy)`, the shared `sin θ/v` invariant, the drawn monotone-Hermite
  ramp family, and the three-runner clock. Imports both parents byte-untouched.
- **The game** — draw a ramp from A to B; a live green→red chip reads `var(sin θ/v)` as you drag; fire the
  start-gun and three runners release on one clock; the gold bead and teal photon dead-heat; a photo-finish
  scoreboard + sector splits show where you bled ms; a gap-to-light counter and a dead-heat latch + chime
  (audio gated on the fire gesture + shared mute; reduced-motion honored).
- **Proof + payoff** — `runSelfTest` (page pill === Node twin, 22 checks): invariant in BOTH shipped cores
  (machine-ε), same road (perp <1e-2, same time), load-bearing neg-control (straight ramp shatters the
  invariant AND is strictly slower), payoff-liveness (dead heat enacted; the real photon road drives the
  chip green), determinism, byte-twin parity, core-disjointness.
- **Wiring** — workbench card; manifest CROSS roster (14→15); sky Pilot's 3rd star (myth "falls into the
  law" made literal); kin-nav both ways from The Brachistochrone and The Photon's Errand; `ws:seen` crumb.
- Config: `XB=2.2, YB=1.4` (θB=π, coasts flat into B), `M=64`, `maxSweeps=1000`, latch 2%, 5 interior knots.
