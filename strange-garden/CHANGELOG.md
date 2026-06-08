# Strange Garden — Changelog & Status

A gallery of *living* generative systems. Each "specimen" is a self-contained interactive
HTML file in `pieces/`. The `index.html` is the gallery that ties them together.

> **Resume protocol:** read this top section, then continue from "Next up". Commit + append
> here after every piece.

## Status

- **Done (wave 1 — all browser-verified PASS, clean consoles):**
  - particle-life.html ✅ (flagship, by me)
  - physarum.html ✅ (~50fps @120k agents, 4 palettes) — gorgeous ember vein-network
  - reaction-diffusion.html ✅ (55fps, Coral/Mitosis/Spots presets, mouse-paint)
  - boids.html ✅ (60fps, predator-flee) — *functionally good but thumbnail weak (blowout/sparse)*
  - index.html gallery + pieces.js manifest (blurbs/accents from deputy reports) ✅
- **Next up (wave 2 — browser free now):**
  - 🔧 boids visual polish: reduce additive-glow blowout, fuller/even flock, better thumbnail
  - strange-attractors.html (Clifford/De Jong, millions of glowing points)
  - flow-field.html (perlin/curl-noise particle flow)
  - lenia.html (continuous CA / smooth life)
  - dla.html (diffusion-limited aggregation, coral/lightning)
  - later: phyllotaxis, mandelbrot/julia explorer, n-body gravity, cyclic-CA spirals

> Orchestration note: limit concurrent agent-browser deputies (they each drive a real
> Chrome). After each deputy reports, update pieces.js blurb/accent + commit.

## House style (see SPEC.md for the full template)

Dark "natural-history catalogue of strange life" aesthetic. Art is full-bleed canvas;
minimal floating control panel; each piece self-contained (no external deps, no build step).

## Log

### 2026-06-07
- Scaffolding: git init, folders, README head-pointer, this changelog, heartbeat cron (5 min).
