# Strange Garden — Changelog & Status

A gallery of *living* generative systems. Each "specimen" is a self-contained interactive
HTML file in `pieces/`. The `index.html` is the gallery that ties them together (reads
`pieces.js`). House style is in `SPEC.md`.

> **Resume protocol:** read this top section, then continue from "Next up". Commit + update
> here after every piece.

## Status — 22 specimens, all browser-verified PASS (60fps unless noted), clean consoles

| # | file | system | notes |
|---|------|--------|-------|
| 1 | particle-life.html | Particle Life | flagship; asymmetric attraction matrix → cells/chasers |
| 2 | physarum.html | Physarum | ~50fps @120k agents; 4 palettes; ember vein-network |
| 3 | reaction-diffusion.html | Gray-Scott | Coral/Mitosis/Spots presets; mouse-paint |
| 4 | boids.html | Boids | predator-flee; two-pass render (no white blowout) |
| 5 | flow-field.html | Flow Field | self-contained 3D simplex noise; silky streamlines |
| 6 | strange-attractors.html | Clifford/De Jong | density accum + auto-morph; Lyapunov quality scorer |
| 7 | cyclic-ca.html | Cyclic Automaton | RPS spirals; Moore/vonNeumann toggle; canonical presets |
| 8 | lenia.html | Lenia | **WebGL2** orbium; amoebae glide→collide→bloom→reseed |
| 9 | dla.html | Aggregation | DLA fractal; N-fold snowflake symmetry; auto-reseed palettes |
| 10 | phyllotaxis.html | Phyllotaxis | Vogel golden-angle; breathing divergence reorganizes spiral families |
| 11 | n-body.html | N-Body | attractor-mode galaxies; Disc/Two-galaxy/cloud/3-sun; gravity-well mouse |
| 12 | julia.html | Julia | WebGL animated Julia; c drifts the 0.7885 ring; drag to sculpt c live |
| 13 | l-system.html | L-System | stochastic L-systems; 6 species; grow→sway→fade→reseed; seasons |
| 14 | chladni.html | Chladni | sand migrates to nodal lines; (m,n) morph; 16 presets |
| 15 | ripple-tank.html | Ripple Tank | 2D wave eq; 2-source interference; double-slit diffraction; click-to-ripple |
| 16 | truchet.html | Truchet | multi-scale Truchet tiles; 4 styles; flowing dash-current animation |
| 17 | mandelbrot.html | Mandelbrot | WebGL deep-zoom to ~5e5×; 8 famous targets; auto-iterations |
| 18 | double-pendulum.html | Double Pendulum | RK4 array; converge→diverge→reseed chaos fan |
| 19 | wfc.html | Wave Function Collapse | full propagating WFC; 3 tilesets; animated crystallization |
| 20 | lorenz.html | Lorenz | RK4 3D butterfly; 4 diverging trajectories; rotating camera |
| 21 | falling-sand.html | Falling Sand | interactive powder CA; 11 materials; paint sand/water/fire/oil/acid/plant |
| 22 | magnetic-pendulum.html | Magnetic Pendulum | WebGL basins-of-attraction fractal; rotating; drag magnets |

- gallery `index.html` + `pieces.js` (9 entries) verified: all cards + thumbnails render, clean console.
- thumbnails in `assets/thumbs/`; `assets/gallery-preview.png` is a full-page gallery shot.

## Key learnings (for future pieces)
- **agent-browser deputies share ONE default browser tab** and collide when run concurrently.
  → future browser-verifying deputies MUST use a unique NAMED session (e.g. session = piece name).
- Cyclic CA: threshold-1 on **Moore** freezes into a labyrinth; **von-Neumann** is what spirals.
- Lenia/WebGL: RGBA32F linear filtering needs `getExtension('OES_texture_float_linear')`;
  kernel must be the canonical single bell over r∈(0,1) peaked at 0.5.

## Next up
- Polish DONE: garden README, "wander in" random button + digit nav, thumbnails normalized
  to ≤1440w, gallery re-verified.
- **Wave 7 candidate pieces:** wave-function-collapse tiling, Voronoi/Delaunay growth,
  terrain erosion, falling-sand sandbox, Belousov-Zhabotinsky, magnetic-pendulum fractal
  basins, Lorenz/strange-attractor 3D, Lissajous, Penrose/quasicrystal tiling.
- Possible: a favicon; per-piece prev/next nav; an "about" page; sort/filter on the gallery.
- Note: ripple-tank thumbnail shows the control panel (others hide it) — minor, could recapture.

## Log
- 2026-06-07 — Scaffold: git, folders, README head-pointer, SPEC.md, heartbeat cron (5 min).
- 2026-06-07 — Wave 1: particle-life (me, flagship) + physarum, reaction-diffusion, boids
  (deputies). Gallery + manifest built. All verified.
- 2026-06-07/08 — Wave 2: strange-attractors, flow-field (deputies); boids visual polish.
- 2026-06-08 — Wave 3: cyclic-ca, lenia (WebGL), dla (deputies). Gallery re-verified (9 cards).
- 2026-06-08 — Polish: garden README, "wander in" + digit nav, thumbnail normalization.
- 2026-06-08 — Wave 4: phyllotaxis, n-body, julia (WebGL) — deputies used unique NAMED
  browser sessions (no tab contention; ~6min each vs 14-42min in wave 3). 12 specimens total.
- 2026-06-08 — Wave 5: l-system (6 species), chladni (cymatics), ripple-tank (wave eq +
  double-slit). Named sessions; deputies returned manifests, orchestrator registered them.
  15 specimens total.
- 2026-06-08 — Wave 6: truchet (multi-scale tiling), mandelbrot (WebGL deep-zoom),
  double-pendulum (RK4 chaos array). 18 specimens total.
- 2026-06-08 — Wave 7: wfc (full propagating Wave Function Collapse), lorenz (3D butterfly).
  20 specimens — v1 complete. Final gallery verified PASS; preview shared with Brandon.
- 2026-06-08 — Wave 8: falling-sand (interactive 11-material powder toy), magnetic-pendulum
  (WebGL basin fractal). **22 specimens.**
