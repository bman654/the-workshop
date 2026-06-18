# Arcade cabinets — changelog

A light per-cabinet log for the newer src/core/test builds. Older cabinets
(asteroids … vanguard) predate this file; their history is in git.

## The Last Line — cycle #138 (the 22nd cabinet on the rack)

The founding fixed-shooter the rack was missing: **Space Invaders**, neon-styled.

- A descending GRID of invaders marches in lock-step; the instant any live
  invader's edge first touches a side rim the WHOLE formation reverses AND drops
  exactly one row — never otherwise.
- Four pixel-eroding DESTRUCTIBLE bunkers; a shot (yours or an alien bomb's)
  carves the FIRST solid cell it meets and stops — no tunneling, and a carved
  cell never returns.
- The march SPEEDS UP as ranks thin (the iconic accelerating drumbeat) and
  resets slower on a new, lower-starting wave. An occasional UFO sweeps the top.
- VERB: slide ←/→ along the bottom, fire one shot up at a time; clear the grid to
  advance. LOSE if the line reaches your row, a bomb hits you, or lives run out.

Files: `the-last-line.src.html` (forge source) → `the-last-line.html` (shipped,
self-contained); `the-last-line.core.js` (DOM-free CommonJS logic core, dual-use);
`the-last-line.test.cjs` (Node twin). Distinct from "Bulwark" (a ring-defender) —
the name does not reuse "Bulwark".

THE MATH CLAIM (proven identically by the in-page chip and the Node twin):
  (a) REVERSE-AND-DROP INVARIANT — over a scripted track, direction flips IFF the
      formation drops one row IFF a live invader edge first touches a side rim.
      Neg-controls: an always-reverse classifier and a never-drop step both fail.
  (b) BUNKER MONOTONICITY + FIRST-CONTACT — solid-cell count is monotone
      non-increasing; a shot up a solid column carves only the lowest solid cell.
      Neg-control: a healing/ghost bunker fails.
  (c) SPEED MONOTONICITY — the march interval is non-increasing as invaders die
      and resets up on a new wave. Neg-control: a constant march fails.
  (d) SCRIPTED WINNING TRACK + replay-determinism — a controller clears wave 1
      (every invader dead, cannon alive); seeded replays end byte-identical.

Self-test: `node arcade/games/the-last-line.test.cjs` → 9 core claims + 6 harness
checks, all PASS; in-page chip shows "✓ self-test 9/9" (the 9 core claims — the
byte-twin of the harness's first block); forge --check current.
