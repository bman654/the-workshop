# Arcade — Changelog & Status

Single-file neon-vector browser games. `index.html` is the cabinet rack (reads `games.js`).
Each game is self-contained, zero-dependency, browser-play-tested. Reference style: `games/asteroids.html`.

> **Resume:** read this, then continue from "Next up". Commit after each game.

## Status

- **Done (browser play-tested PASS, 60fps, clean consoles) — 15 cabinets:**
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
  - gyre.html ✅ — Tempest-lineage tube shooter: a neon well viewed end-on, N radial lanes converging to a vanishing point; blaster rides the near rim (←/→ or A/D, mouse-rotate optional), fires down its lane (Space), Superzapper screen-clear (Z/Shift). 3 distinct archetypes (magenta **Flipper** flips lane-to-lane while climbing; green **Spiker** lays a shootable spike trail down its lane; orange **Fuseball** rides a lane boundary, surges erratically, **splits into two flippers** on death). Enemies that reach the rim **crawl around it toward the player** (faithful Tempest threat). 6 cycling well shapes (circle / square / star / open line / plus / V) with a per-level neon palette shift and the iconic **zoom-down-the-tube** dive transition between levels. Lives + per-level zapper recharge, full juice (rim flash on fire, explosions, screen-shake, dive fountain), `ws:best:gyre` = best level reached
  - tessera.html ✅ — Qix-lineage **area-claiming**: a grid playfield (80×56 cells) with a bright cabinet border; the marker walks the border + already-claimed edges (arrows/WASD), draws **stix** out into the dark, and on returning to a frontier **closes a polygon** that flood-fills the side **not** containing the Qix (translucent neon, hue per claim). A writhing **Qix** ribbon (lissajous wander, confined to unclaimed cells) kills you if it crosses your live stix; a **Sparx** star patrols the frontier and kills on contact (+1 sparx every 2 levels, +1 Qix at L4/L8); a **fuse** burns up your stix at a constant rate if you stop drawing. **Hold Shift = slow draw** (worth ~2×). Win at **75% claimed** → next sector (faster Qix, more threats). Lives + respawn i-frames, full juice (claim flash/thunk, screen-shake on death, fuse sparks, confetti on clear). Geometry verified correct: claim % = claimed cells / total (exact), the Qix is never enclosed in claimed territory, the player only travels border/claimed edges. `ws:best:tessera` = best level reached
  - centipede.html ✅ — Centipede-genre **serpentine descent + segment-split**: a 30×32 cell garden, blaster confined to the bottom 6-row band (arrows/WASD or mouse-move + click-to-fire; Space fires, ≤2 bolts on screen). The centipede is a linked head+body chain that marches horizontally; on a **wall or mushroom ahead** it **drops one row and reverses** (classic serpentine), flipping vertical direction at the bottom so it never stalls or vanishes. A bolt through a **body** segment **splits the chain into two independent centipedes** (each re-derives a valid head; the back piece turns to flee the gap) and plants a mushroom at the cut; a **head** shot promotes the adjacent segment with direction preserved. Mushrooms take **4 hits** (damage shown), block/redirect the chain. Secondary enemies: a **spider** bounces through the band eating mushrooms (touch = death; 300/600/900 by range when shot), a **flea** drops vertically re-seeding the band when mushrooms run low (2 hits), and an optional **scorpion** poisons mushrooms (poisoned stalk = straight dive). Waves escalate (faster steps), 3 lives + extra life at 12k, full juice (hit sparks, segment-pop bursts, screen-shake on death). Ships with a **headless logic self-test** (split / serpentine / head-shot / mushroom-HP) that logs PASS per check and shows a green ✓ chip; the pure core (`centipedeStep`/`splitCentipede`/mushroom model) is testable. Verified in a real browser (agent-browser): all 4 self-test checks PASS + green chip, **0 console errors/warnings**, the split seen live (5-seg → two chains heading opposite ways + planted mushroom), head-shot, wall-serpentine drop, mushroom clearing, flea planting, spider shot, player death → −1 life → respawn, wave clear → advance to wave 2, and `ws:best:centipede` raised 0→2 in localStorage on a served origin. `ws:best:centipede` = best wave reached
- **Nav:** every game has a click-only `← arcade` back-link (NO key binding — games use keys).
- **Gallery:** index.html (neon "cabinet rack"), games.js manifest (15), README ✅

## Next up
- Optional more cabinets: Flappy/one-button, a procedural mini-roguelike, a rhythm game.
- 9 cabinets — a well-rounded rack (shooter / paddle / snake / falling-block / shmup / puzzle /
  defense / vs-CPU / physics-landing). Responsive `auto-fill` grid: adding more needs no rebalance.

## Log
- 2026-06-12 — Added **Centipede** (neon serpentine descent → **15** cabinets): the arcade classic,
  the rack's first **field-shooter with a splitting enemy**. Built on a pure, testable core — a
  `centipedeStep` (the serpentine rule: head tries to advance horizontally; a **wall or mushroom
  ahead** drops it one row and reverses, with a vertical-direction flip at field edges so it never
  vanishes or stalls; a poisoned stalk forces a straight dive), a `splitCentipede` (body hit →
  **two independent chains**, each with a valid re-derived head and a sensible heading, plus a
  mushroom planted at the cut; head hit → adjacent segment promoted, direction preserved), and a
  4-HP mushroom model. Around that: a bottom-band blaster (arrows/WASD or mouse + click-to-fire,
  ≤2 bolts), a **spider** (bounces, eats mushrooms, range-scaled 300/600/900), a **flea**
  (re-seeds the band when sparse, 2 hits), and an optional **scorpion** (poisons mushrooms).
  Waves escalate, 3 lives + extra at 12k, full juice. A **headless self-test** runs the 4
  correctness checks on load (split / serpentine / head-shot / mushroom-HP), logs PASS per check,
  and shows a green **✓ self-test** chip (red if any fails — never shipped red). Self-verified by
  the build deputy in a real browser (agent-browser, served origin): **4/4 self-test PASS** + green
  chip, **0 console errors/warnings**, the split observed live (a 5-seg chain shot at body[2] became
  two len-2 centipedes marching opposite directions with a mushroom at the gap, then one hit the
  wall and did the serpentine drop), head-shot, mushroom clearing, flea planting, spider shot,
  player death → **−1 life** → respawn, **wave clear → advance to wave 2**, and **`ws:best:centipede`
  raised 0 → 2** in localStorage (raise-only). ~48–53fps in headless Chrome (the env caps a bare rAF
  loop at ~53/s — render is lightweight, 60fps on a real display). Single self-contained file
  (~1200 lines, vanilla, zero deps/network), RELATIVE `← arcade` back-link verified, **silent by
  default** (M toggles). Thumb captured mid-play at 1440×900 (full garden, centipede chain + spider).
  No bugs survived to ship; the only logic rework during the build was simplifying the drop branch's
  vertical-bounds handling (the original had tangled TOPROW conditionals) into a clean edge-flip.
- 2026-06-11 — Added **Tessera** (neon area-claiming → **14** cabinets): the iconic Qix genre, the
  rack's first **area-claiming** game. Built on a correct grid model (80×56 cells; the marker walks
  the *vertex lattice* along the border + claimed edges; drawing out into empty cells lays a **stix**;
  closing back onto a frontier triggers a **flood-fill seeded from every Qix** so the region *without*
  the Qix is claimed — the geometrically-correct rule). The Qix is a lissajous-wandering multi-segment
  ribbon confined to empty cells (segment-vs-stix intersection = death); a **Sparx** patrols the
  walkable frontier with a toward-player gradient (contact = death); a constant-rate **fuse** punishes
  stopping mid-draw; **hold Shift = slow draw** (~2× score). Win at 75% claimed → harder sector
  (faster Qix, +sparx every 2 levels, +Qix at L4/L8). Self-verified by a self-verifying build deputy
  in a real browser (agent-browser): claiming raises **% = claimedCells/total exactly** (verified a
  10×10 box → +130 cells = 100 interior + ~30 line, pct matched the HUD to the decimal); the Qix was
  **never** found inside claimed territory across many claims (`_qixInClaimed()` stayed false); all
  three deaths confirmed deterministically (fuse kills ~2.4s after a stop; a Qix segment laid across
  the live stix killed within one frame; a Sparx walked the frontier 30→37→40 and killed the
  stationary player); reaching 75% flipped to **SECTOR CLEAR** and ENTER advanced to a fresh level;
  `ws:best:tessera` raised **1 → 2** in localStorage on the level-up (raise-only, verified). Sustained
  **60fps** over 30s of autopiloted play with the particle pool draining to 0 between bursts (no leak),
  **0 console entries** (errors/warnings) the whole session; **silent by default** (M toggles; HUD reads
  "M · sound off" on load). Two early bugs found & fixed during verification: the player and the Sparx
  both spawned on the *outer* border row (fully solid → frozen) — moved both to the inner frontier
  (row 1); and the fuse burn-rate was divided by stix length (long lines were near-immune) — made it a
  constant fraction/sec. Single self-contained file, RELATIVE `← arcade` back-link, retina-crisp.
  Thumb captured mid-play at 1440×900 (71% claimed, the Qix loose in the unclaimed pocket).
- 2026-06-11 — Added **Gyre** (neon tube shooter → **13** cabinets): the genre that *defined*
  neon-vector arcades — a Tempest-lineage well/tube shooter, the rack's first. A tube viewed
  end-on: **N radial lanes** form a rim near the player and converge to a vanishing point deep in
  the center (quadratic depth→radius perspective). The **blaster rides the near rim** (←/→ or A/D —
  tap to step a lane, hold to walk; mouse-rotate is an optional bonus) and **fires down its current
  lane** (Space); a **Superzapper** screen-clear (Z/Shift) with per-level recharging charges.
  **Three distinct enemy archetypes**, each a different silhouette + neon color and behavior:
  a magenta **Flipper** (bowtie — flips between adjacent lanes as it climbs), a green **Spiker**
  (diamond drill — lays a spike trail up its lane that the player must shoot away or die touching at
  the rim), and an orange **Fuseball** (pulsing orb — rides a lane *boundary*, surges erratically,
  and **splits into two flippers** on death). Enemies that reach the rim don't pile up harmlessly —
  they **crawl around the rim toward the player's lane** (the faithful Tempest threat), so they're
  always reachable and always dangerous. **Wells are cleared** by destroying every enemy + shaving
  every spike, which triggers the iconic **"zoom down the tube"** dive transition (well rushes
  outward, particle fountain) into the next level — which presents a **different well geometry**,
  cycling through **6 distinct shapes**: closed **circle**, **square**, **star** (alternating
  points/valleys), open **line** (a bowed arc — an *open* well), **plus/cross**, and open **V** —
  with the **neon palette shifting per level** (cyan → magenta → violet → amber → green → ice) and
  enemy speed/mix ramping. Lives + respawn, clean HUD (score / lives as ▲ pips / level / best /
  zapper dots), full juice: rim flash on fire, particle explosions (bigger for fuseballs),
  screen-shake + flash on death/superzapper, deep-tube parallax. Single self-contained file, no
  deps/network, **audio default-MUTED** (toggle **M**), relative `← arcade` back-link.
  **Self-verified in a real browser** (agent-browser, session `gyre-build`, served origin): title→
  ENTER/Space start; the blaster steps lane-to-lane around the rim (verified lane 8→6→5 on real
  ArrowLeft/Right keypresses, mouse-rotate snaps to nearest lane); Space fires bullets that travel
  down the current lane and destroy enemies on it (score climbed 0→50→100 as flippers died);
  enemies spawn deep and climb; the **Superzapper cleared all 12 enemies + consumed a charge**;
  an enemy reaching the rim on the player's lane **killed the player** (lives 3→2→respawn), and a
  rim-crawling flipper spawned far away **walked around to the player's lane and killed it** (the
  hunt works); a full well-clear played the **dive transition** and advanced **level 1→2 with the
  well changing circle→square** and `cleared`→1; **`ws:best:gyre` raised to "2" in localStorage**
  (verified read-back over the served origin). All **6 well shapes** render at **60fps**; **P**
  pauses/resumes; **GAME OVER → ENTER restarts** (back to level 1, 3 lives). Sustained **60fps over
  a 30s** firing/spawning stress with no jank or particle leak; **0 console errors/warnings** the
  whole session. Thumb = a clean circular-well action frame (1280×800, ~666KB) at
  `arcade/assets/thumbs/gyre.png`. Front-door Arcade card bumped **12→13 games** (still one card),
  manifest + README count updated.
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
