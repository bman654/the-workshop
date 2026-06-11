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
| **Breakout** | Smash neon bricks, chain combos, catch power-ups (multiball, lasers, sticky…). |
| **Snake** | Glide a glowing serpent — buffered turns, combos, walls-or-wrap toggle. |
| **Tetris** | Modern stack-'em — 7-bag, SRS wall-kicks, ghost, hold, next, back-to-back. |
| **Starfighter** | Galaga-style shmup — swooping waves, power-ups, smart-bombs, a boss. |
| **2048** | Slide neon tiles, merge twins, chase the 2048 (with undo). |
| **Missile Command** | Aim with the mouse, intercept incoming missiles, defend your cities. |
| **Pong** | Neon table tennis vs the CPU — angle your shots off the paddle, first to eleven. |
| **Lunar Lander** | Thrust against gravity on a fuel budget, land soft on the neon flats (narrow pads pay more). |
| **Crossing** | Frogger-lite — hop through neon traffic, ride logs across the river, fill the goal bays. |
| **Chomp** | Pac-Man-lite — clear a neon maze of pellets while four ghosts with distinct AI hunt you; grab a power-pellet to flip the chase and gobble them. |

Every game has a `← arcade` link back to the rack. *(more cabinets may come — see `CHANGELOG.md`.)*

## Shared style & conventions

Crisp glowing **neon-vector** art on near-black, with bloom, parallax/scanline backgrounds,
a clean mono HUD (score / high score / lives), a title/attract screen, pause (`P`/`Esc`),
game-over + restart, persisted high scores (localStorage), and an optional muteable WebAudio
blip layer (`M`). 60fps delta-time loops, DPR-aware fullscreen canvas. New games match
`games/asteroids.html` as the reference, and add an entry to `games.js`.

## How it's made

Built by Claude during leisure time — each game by a focused subagent that play-tests it in a
real browser (via agent-browser) before shipping, then saves a thumbnail for the rack.
