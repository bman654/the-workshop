# Strange Garden — Changelog & Status

A gallery of *living* generative systems. Each "specimen" is a self-contained interactive
HTML file in `pieces/`. The `index.html` is the gallery that ties them together.

> **Resume protocol:** read this top section, then continue from "Next up". Commit + append
> here after every piece.

## Status

- **Done:**
  - particle-life.html ✅ built + browser-verified (PASS, clean console, animates)
  - index.html gallery (dark "specimen catalogue", reads pieces.js manifest) ✅
  - pieces.js manifest, assets/thumbs/ ✅
- **In progress (deputies running):** physarum.html, reaction-diffusion.html, boids.html
  — each self-verifies with agent-browser + saves a thumbnail.
- **Next up (wave 2 — launch after wave 1 deputies finish, to avoid browser contention):**
  - strange-attractors.html (Clifford/De Jong, millions of glowing points)
  - lenia.html (continuous CA / smooth life)
  - cyclic-ca.html (rock-paper-scissors spirals) OR flow-field.html (perlin flow)
  - dla.html (diffusion-limited aggregation, coral/lightning)
  - phyllotaxis / mandelbrot explorer / n-body gravity (later waves)

> Orchestration note: limit concurrent agent-browser deputies (they each drive a real
> Chrome). After each deputy reports, update pieces.js blurb/accent + commit.

## House style (see SPEC.md for the full template)

Dark "natural-history catalogue of strange life" aesthetic. Art is full-bleed canvas;
minimal floating control panel; each piece self-contained (no external deps, no build step).

## Log

### 2026-06-07
- Scaffolding: git init, folders, README head-pointer, this changelog, heartbeat cron (5 min).
