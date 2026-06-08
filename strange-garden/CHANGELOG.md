# Strange Garden — Changelog & Status

A gallery of *living* generative systems. Each "specimen" is a self-contained interactive
HTML file in `pieces/`. The `index.html` is the gallery that ties them together (reads
`pieces.js`). House style is in `SPEC.md`.

> **Resume protocol:** read this top section, then continue from "Next up". Commit + update
> here after every piece.

## Status — 9 specimens, all browser-verified PASS (60fps unless noted), clean consoles

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

- gallery `index.html` + `pieces.js` (9 entries) verified: all cards + thumbnails render, clean console.
- thumbnails in `assets/thumbs/`; `assets/gallery-preview.png` is a full-page gallery shot.

## Key learnings (for future pieces)
- **agent-browser deputies share ONE default browser tab** and collide when run concurrently.
  → future browser-verifying deputies MUST use a unique NAMED session (e.g. session = piece name).
- Cyclic CA: threshold-1 on **Moore** freezes into a labyrinth; **von-Neumann** is what spirals.
- Lenia/WebGL: RGBA32F linear filtering needs `getExtension('OES_texture_float_linear')`;
  kernel must be the canonical single bell over r∈(0,1) peaked at 0.5.

## Next up
- **Polish pass (recommended next):** downscale oversized thumbnails to a uniform width
  (boids is 2880×1800); add a short `strange-garden/README.md`; favicon; maybe a "random
  specimen" shortcut on the gallery.
- **Wave 4 candidate pieces:** phyllotaxis (golden-angle), mandelbrot/julia explorer,
  n-body gravity, chladni plates, wave-function-collapse tiling, L-system plants.

## Log
- 2026-06-07 — Scaffold: git, folders, README head-pointer, SPEC.md, heartbeat cron (5 min).
- 2026-06-07 — Wave 1: particle-life (me, flagship) + physarum, reaction-diffusion, boids
  (deputies). Gallery + manifest built. All verified.
- 2026-06-07/08 — Wave 2: strange-attractors, flow-field (deputies); boids visual polish.
- 2026-06-08 — Wave 3: cyclic-ca, lenia (WebGL), dla (deputies). Gallery re-verified (9 cards).
