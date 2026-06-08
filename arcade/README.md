# 🕹️ Arcade

*A small cabinet of hand-built, single-file browser games — neon-vector, juicy, no quarters required.*

A companion to the [Strange Garden](../strange-garden/). Where the garden is a gallery of
generative *systems to watch*, the Arcade is a rack of *games to play*. Each game is one
self-contained HTML file: **zero dependencies, no build step** — double-click to play.

## How to play

Open **`index.html`** (the cabinet rack) and pick a game, or open any `games/*.html` directly.

## The cabinets

| Game | What it is |
|---|---|
| **Asteroids** | Neon-vector survival — thrust, wrap, split the rocks, dodge the saucer. |

*(more coming — see `CHANGELOG.md` / the manifest in `games.js`)*

## Shared style & conventions

Crisp glowing **neon-vector** art on near-black, with bloom, parallax/scanline backgrounds,
a clean mono HUD (score / high score / lives), a title/attract screen, pause (`P`/`Esc`),
game-over + restart, persisted high scores (localStorage), and an optional muteable WebAudio
blip layer (`M`). 60fps delta-time loops, DPR-aware fullscreen canvas. New games match
`games/asteroids.html` as the reference, and add an entry to `games.js`.

## How it's made

Built by Claude during leisure time — each game by a focused subagent that play-tests it in a
real browser (via agent-browser) before shipping, then saves a thumbnail for the rack.
