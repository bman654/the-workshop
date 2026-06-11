# Arcade — Changelog & Status

Single-file neon-vector browser games. `index.html` is the cabinet rack (reads `games.js`).
Each game is self-contained, zero-dependency, browser-play-tested. Reference style: `games/asteroids.html`.

> **Resume:** read this, then continue from "Next up". Commit after each game.

## Status

- **Done (browser play-tested PASS, 60fps, clean consoles) — 12 cabinets:**
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
  - chomp.html ✅ — Pac-Man-lite: hand-authored 28×31 symmetric maze (fully connected, 4 power-pellets, wrap tunnel), grid-locked muncher with queued turns, 4 ghosts with faithful distinct AI (Blinky direct / Pinky 4-ahead ambush / Inky doubled-flank vector off Blinky / Clyde shy-within-8), scatter↔chase cycling, frightened+eyes+revive, escalating combo, levels, lives, full juice
  - swarm.html ✅ — twin-stick survivor: WASD/arrows move + mouse-aim auto-fire (keyboard fallback fires the way you move), 3 distinct homing archetypes (red chaser / orange brute / cyan zig-zag splitter), endless escalating waves, XP gems w/ magnet pickup → level-up upgrade chooser (8 upgrades, pick 3), health pips + i-frames, full juice (muzzle/hit/death bursts, shake, flash), `ws:best:swarm` = wave reached
- **Nav:** every game has a click-only `← arcade` back-link (NO key binding — games use keys).
- **Gallery:** index.html (neon "cabinet rack"), games.js manifest (12), README ✅

## Next up
- Optional more cabinets: Flappy/one-button, a procedural mini-roguelike, a rhythm game.
- 9 cabinets — a well-rounded rack (shooter / paddle / snake / falling-block / shmup / puzzle /
  defense / vs-CPU / physics-landing). Responsive `auto-fill` grid: adding more needs no rebalance.

## Log
- 2026-06-11 — Added **Swarm** (twin-stick survivor → **12** cabinets): a fast, readable
  Vampire-Survivors/Geometry-Wars hybrid. Player ship moves on WASD/arrows; aim is mouse with
  **auto-fire toward the cursor**, plus a keyboard-only fallback that fires the way you move
  (so it's playable without a mouse — the title hint line says so). Three visually distinct,
  homing enemy archetypes: **red triangle chasers** (fast/weak), **orange hexagon brutes**
  (slow/tanky, with an HP bar + heavier acceleration), and **cyan square zig-zags** (erratic
  perpendicular-oscillation approach that **splits into two weak chasers** on death). Spawn rate
  and archetype variety ramp by wave (brutes unlock wave 3, zig-zags wave 2; later waves spawn
  clusters); waves advance every 18s and scale enemy HP. Kills drop **XP gems** that **magnet**
  toward the player and fill an XP bar; on level-up the action pauses for a **3-card upgrade
  chooser** (pick via click or keys **1/2/3**) drawn from 8 upgrades — rapid fire, +damage, move
  speed, multishot (spread), pierce, magnet range, +max-health, bullet speed. Health is **5 pips**
  with **1.1s i-frames** after a hit; contact damages, 0 HP → game over with a stats card (score,
  wave reached, survival time, level). Full juice: muzzle sparks, hit flashes, death bursts,
  gem-pop pops, engine trail, screen-shake + screen-flash on big hits, an aim reticle. Single
  self-contained file, neon-vector on a faint grid, **silent by default** (audio gated behind
  **M**, default OFF). Self-verified in a real browser (agent-browser, headless): title→start,
  ship moves/fires, enemies spawn + home, bullets kill with juice, gems drop + collect → XP →
  level-up chooser → upgrade applies + resumes, contact damage reduces health (i-frames confirmed:
  one hit per contact), 0 HP → game over → ENTER restarts; pause/resume via P; a circular-kite
  bot survived past the 18s boundary to **wave 2**, which raised **`ws:best:swarm` to "2"** in
  localStorage (verified). Sustained **60fps** in normal play (dipped to ~40 only under an
  artificial 38-enemy stress spawn), **0 console errors/warnings** across the whole session.
  Thumb captured mid-action (1280×720). `← arcade` back-link → `../index.html`.
- 2026-06-11 — Added **Chomp** (Pac-Man-lite → **11** cabinets): a neon maze-muncher on a
  hand-authored 28×31 tile map (validated programmatically: 28-wide, left/right symmetric, every
  one of 278 pellets reachable, exactly 4 power-pellets, both tunnel mouths wrap). Grid-locked
  movement model (entities lock to integer tiles and decide turns exactly at centers — this
  replaced an early proximity-epsilon scheme that dead-locked entities by snapping them back to
  the same center each frame). Self-verified by a subagent in a real browser (agent-browser):
  title→start, WASD/arrow steering + pellet scoring, scatter↔chase cycling (held scatter ~7s then
  flipped), power-pellet→frightened (all ghosts blue + reverse + slow + edible), eating frightened
  ghosts gives escalating 200→400→… combo, eaten ghost→eyes→returns to house→revives, ghost contact
  costs a life, game-over+restart, and full pellet-clear→level-advance (level 1→2, maze rebuilt).
  **The four ghosts were confirmed mathematically distinct** by reading each ghost's computed
  chase-target tile via a debug hook at several muncher positions/headings: Blinky targets the
  muncher's exact tile (direct), Pinky targets 4 tiles ahead of the muncher's facing (ambush),
  Inky uses the classic doubled vector from Blinky through the tile two ahead of the muncher
  (flank), and Clyde direct-chases when farther than 8 tiles but flees to his scatter corner when
  closer (shy) — all verified against the expected arithmetic. Sustained 60fps, JS heap stable
  ~10MB, 0 console errors/warnings throughout; silent by default. Single self-contained file, no
  network refs, retina-crisp.
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
