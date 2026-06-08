# Arcade — Changelog & Status

Single-file neon-vector browser games. `index.html` is the cabinet rack (reads `games.js`).
Each game is self-contained, zero-dependency, browser-play-tested. Reference style: `games/asteroids.html`.

> **Resume:** read this, then continue from "Next up". Commit after each game.

## Status

- **Done (browser play-tested PASS, 60fps, clean consoles):**
  - asteroids.html ✅ — inertia/thrust/wrap, splitting rocks, saucer, hyperspace, full juice
    (particles, screen shake, hit-stop, parallax starfield, localStorage high score)
- **In progress (deputies):** snake.html, breakout.html
- **Gallery:** index.html (neon "cabinet rack"), games.js manifest, README ✅

## Next up
- Integrate snake + breakout; add prev/next nav between games (port the garden's `#sg-nav`
  idea → an `#arc-nav` snippet reading games.js); verify the rack renders all cabinets.
- More cabinet ideas: Tetris, Pong (vs AI), a twin-stick/space shooter, Missile Command,
  2048, Flappy/one-button, a procedural mini-roguelike, Pac-Man-lite.

## Log
- 2026-06-08 — Started Arcade. Built juicy Asteroids (subagent, play-tested). Scaffolded
  rack gallery (index.html + games.js + README). Snake + Breakout dispatched.
