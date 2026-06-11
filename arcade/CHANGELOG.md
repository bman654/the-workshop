# Arcade — Changelog & Status

Single-file neon-vector browser games. `index.html` is the cabinet rack (reads `games.js`).
Each game is self-contained, zero-dependency, browser-play-tested. Reference style: `games/asteroids.html`.

> **Resume:** read this, then continue from "Next up". Commit after each game.

## Status

- **Done (browser play-tested PASS, 60fps, clean consoles) — 10 cabinets:**
  - asteroids.html ✅ — inertia/thrust/wrap, splitting rocks, saucer, hyperspace, full juice
  - breakout.html ✅ — 6 power-ups, combos, multiball, swept collision, procedural levels
  - snake.html ✅ — smooth gliding ribbon, buffered turns, combos, walls/wrap toggle
  - tetris.html ✅ — 7-bag, SRS+wall-kicks, ghost, hold, next, B2B/combo, level gravity
  - starfighter.html ✅ — Galaga-style waves, divers/turrets, WARLORD boss, power-ups, bombs
  - 2048.html ✅ — slide/merge/spawn, win+gameover, undo, value-bloom tiles, big-merge shake
  - missile-command.html ✅ — mouse-aim defense, MIRV/smart-bombs, chain blasts, wave bonus
  - pong.html ✅ — vs CPU, paddle-angle physics, beatable predictive AI, first to 11, full juice
  - lunar-lander.html ✅ — thrust/gravity flight, fuel, procedural terrain + multiplier pads, soft-land/crash, levels
  - crossing.html ✅ — Frogger-lite: neon traffic + log/turtle river-riding, goal bays, levels, lives, full juice
- **Nav:** every game has a click-only `← arcade` back-link (NO key binding — games use keys).
- **Gallery:** index.html (neon "cabinet rack"), games.js manifest (10), README ✅

## Next up
- Optional more cabinets: Flappy/one-button, a procedural mini-roguelike, Pac-Man-lite,
  a twin-stick shooter, Frogger-lite, a rhythm game.
- 9 cabinets — a well-rounded rack (shooter / paddle / snake / falling-block / shmup / puzzle /
  defense / vs-CPU / physics-landing). Responsive `auto-fill` grid: adding more needs no rebalance.

## Log
- 2026-06-11 — Added **Crossing** (Frogger-lite → **10** cabinets): lanes of neon traffic + a river
  of logs/turtles you ride, goal bays, escalating levels, lives, full juice. Single-file, 60fps (after
  a background-canvas perf pass that moved static art + glow off the hot path), 0 console errors,
  silent by default; play-tested by a self-verifying subagent.
- 2026-06-10 — Added two cabinets (→ **9**): **Pong** (vs CPU — paddle-angle physics, beatable
  predictive AI, first to 11) and **Lunar Lander** (thrust/gravity flight, fuel budget, procedural
  terrain + multiplier landing pads, soft-land-vs-crash, escalating levels). Both single-file
  neon-vector, ~60fps, 0 console errors, silent by default; play-tested by self-verifying subagents.
- 2026-06-08 — Started Arcade. Built juicy Asteroids (subagent, play-tested). Scaffolded
  rack gallery (index.html + games.js + README). Snake + Breakout dispatched.
