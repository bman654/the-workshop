# Arcade — Changelog & Status

Single-file neon-vector browser games. `index.html` is the cabinet rack (reads `games.js`).
Each game is self-contained, zero-dependency, browser-play-tested. Reference style: `games/asteroids.html`.

> **Resume:** read this, then continue from "Next up". Commit after each game.

## Status

- **Done (browser play-tested PASS, 60fps, clean consoles) — 18 cabinets:**
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
  - qubit.html ✅ — Q*bert-lineage **isometric cube-hopper**: a 7-row, 28-cube pyramid in 2:1 iso projection; a squash-and-stretch neon orb hops the four diagonals (↑/W up-right, →/D down-right, ↓/S down-left, ←/A up-left) between adjacent cube tops, **flipping each face's colour** toward the level's target — clear the whole pyramid to advance. Difficulty deepens by level: L1 one flip to target, L2+ two-step intermediate colour, L3+ **reversible** faces (re-stepping reverts). Core danger is **falling off the edge** (force-fatal, even through respawn i-frames). Enemy roster: **red balls** bounce down from the top, a purple **Coily** hatches from an egg and chases via shortest-path hop, and **floating discs** on both side edges rescue you to the apex (and luring snake-Coily off the edge after he's hatched = +500). 3 lives + respawn + extra life at 12k, full juice (hop arc, cube-flip flash, particle bursts, screen-shake, neon glow, completion progress bar), per-level palette rotation, muted-by-default Web Audio SFX (M toggle). Ships a **headless 6-check self-test** that calls the real pure coordinate core: (1) hop **invertibility** round-trip over all in-bounds cubes; (2) **edge detection** (fatal IFF out of bounds; apex has exactly 2 legal hops); (3) **iso projection** — 28 distinct positions, consistent 2:1 spacing, key labels match on-screen motion; (4) **level-complete** logic (all faces at target ⇔ complete; L2 needs exactly 2 flips); (5) **Coily chase** step always a legal hop; (6) **reversible** flip on L3+. Logs PASS per check, shows a green ✓ chip (never shipped red). Verified in a real browser (agent-browser, served origin): 6/6 self-test PASS + green chip, **0 console errors/warnings**, hopping + cube-flips + scoring (0→130) + red-ball spawn + disc pulse + edge-fall death all exercised live, `ws:best:qubit` written. `ws:best:qubit` = best level reached
  - vanguard.html ✅ — Galaga-lineage **formation shooter** with the signature **capture-beam / dual-fighter** twist (which the rack's Starfighter shmup deliberately lacks): each wave the enemies **fly in** along swooping bezier entry paths and settle into a 5×8 **formation grid** that gently breathes side-to-side (tiers — grunts / escorts / boss), then **peel off to dive-bomb** the player along curved attack arcs and loop back. Blaster moves ←/→ (or A/D) along the bottom, fires Space with a **≤2-bullets-on-screen cap** (classic Galaga feel). **The twist:** a formed **boss** dives and fires a widening **tractor beam**; if it catches your fighter you're **captured** (lose a life, ship is carried up inverted above the boss); fly a fresh ship and **shoot that captor** to **free the captive** — it docks alongside you into a **DUAL FIGHTER** (two ships, double muzzles, +1500 RESCUE). A bomb/collision in dual mode **sunders** it back to single (no life lost); being captured while dual reverts to single and costs a life. Waves escalate (faster, more divers), with a bonus/challenging-stage flavor every 4th wave. 3 lives, full juice (entry/dive trails, capture beam, rescue fanfare burst, screen-shake, score floaters), per-wave palette rotation, muted-by-default Web Audio (M toggle). Ships a **headless 15-check self-test** calling the real pure core — the **capture→rescue→dual state machine** (capture decrements lives + holds ship; shooting the captor → dual; shooting a non-captor or mismatched boss → plain kill; dual sunder; capture-of-dual), **dual firepower** (1 vs 2 distinct muzzles ±16), **formation slot bijection** (40 slots), **deterministic bounded sway**, **entry/dive path** endpoints (off-screen→slot; slot→plunges past the player band→exits below), **bullet cap**, and **collision/scoring** (boss = 2 hits, grunt = 1, score by value, wave-clear flips only on the last kill). Logs PASS per check, green ✓ chip (never shipped red); the same test bodies re-run under Node = 15/15. Verified in a real browser (agent-browser, served origin, named session): **15/15 self-test PASS + green chip**, **0 console errors/warnings/page-errors**, fps 60. Played live — fire/move killed enemies (score 0→3460, formation 40→19), took diver/bomb hits down to 1 life, advanced wave 1→2 (formation re-formed at 40); the **capture→rescue→dual** exercised end-to-end in one tick (captured: lives 3→2, captured=true; shoot captor → isDual=true, playerAlive=true, capture cleared). `ws:best:vanguard` = best **score** (raise-only). Accent `#37d6ff` (electric blue — distinct from Starfighter's magenta).
  - digdug.html ✅ — Dig Dug-lineage **grid tunneler**, the rack's first **excavation + inflate-to-pop + gravity-rock** game (mechanically distinct from Chomp's maze-munching). The player digs through a 15×13 dirt grid (arrows/WASD; tap or hold) — moving into dirt **excavates** it into open tunnel, and you can only walk dug tunnel. Two enemy types: round **Pookas** and dragon **Fygars** (breathe a straight-line **flame** down their row). Both chase via **BFS through the tunnels**; when walled off with no tunnel path they flip to drifting **eyes/ghost** state and **phase straight through dirt** toward you, re-materialising on reaching open tunnel. Two weapons: the **air-hose** — face an enemy in-line (range 3) and PUMP (Space) to inflate it a stage per pump (1→2→3→4); the 4th pump **POPS** it for depth-tiered points, and releasing lets it deflate. And **rocks** — dig the dirt out from under one and it **wobbles (~0.7s) then falls**, crushing every enemy in its column (and the player!); a **crush out-scores a pump** at the same depth, and dropping **2 rocks** in a level is a +2500 bonus. Score scales with **how deep** you kill (depth bands), fygar > pooka. 3 lives + extra at 20k, level advance when all enemies cleared (deeper levels = more/faster enemies), full juice (dig puffs, pump strain, pop bursts, falling-rock shake, flame, score floaters), per-level amber palette rotation, muted-by-default Web Audio (M toggle). Ships a **headless 17-check self-test** calling the real pure core — `digTile`/`reachableOpen` (digging opens only the dug tile; can't walk unbroken dirt; tunnel reachable), `pumpEnemy`/`deflateEnemy` (exactly +1 stage/pump, POP at 4, deflate floors at 0, dead-enemy no-op), `levelCleared` (iff zero live), `rockShouldFall` (unsupported iff the cell below is dug; floor is support), `rockFallCrush` (hand-built column → asserts the exact crushed set incl. the player, stops at dirt), `depthTier`/`pumpScore`/`crushScore` (monotone-with-depth, crush>pump, fygar>pooka), `enemyChaseStep` tunnel (steps the dug path, never enters dirt; holds when no path) + ghost (drifts through dirt closing the larger gap first), and **determinism** (same seed ⇒ identical enemy+rock layout). Logs PASS per check, green ✓ chip (never shipped red); same bodies re-run under Node = 17/17. Verified in a real browser (agent-browser, served origin, named session): **17/17 self-test PASS + green chip**, **0 console errors/warnings/page-errors**, fps 60. Played live — tap/hold dig tunneled the grid; **pump-inflated a pooka through its stages and POPPED it** (score 0→1400); **undermined a rock that wobbled, fell, and crushed an enemy** in its column (score→2100, rocksDropped 1); took a hit (lives 3→2) and respawned at the surface; ran out of lives → clean **GAME OVER** overlay; **cleared a level and advanced 1→2** (fresh deeper layout); a **walled-off enemy flipped to ghost** and phased through dirt; `ws:best:digdug` raised in localStorage (raise-only, by **score**). Accent `#ffa83d` (warm amber/earth — distinct from siblings).
- **Nav:** every game has a click-only `← arcade` back-link (NO key binding — games use keys).
- **Gallery:** index.html (neon "cabinet rack"), games.js manifest (18), README ✅

## Next up
- Optional more cabinets: Flappy/one-button, a procedural mini-roguelike, a rhythm game.
- 9 cabinets — a well-rounded rack (shooter / paddle / snake / falling-block / shmup / puzzle /
  defense / vs-CPU / physics-landing). Responsive `auto-fill` grid: adding more needs no rebalance.

## Log
- 2026-06-12 — Added **Dig Dug** (neon grid tunneler → **18** cabinets): the rack's first
  **excavation + inflate-to-pop + gravity-rock** game — mechanically distinct from Chomp's
  maze-munching. Built on a pure, testable core: a `Uint8Array` dirt/open **grid** with
  `digTile`/`reachableOpen`/`canWalk` (you can only walk dug tunnel; moving into dirt excavates
  it), an **air-pump** state machine (`pumpEnemy` +1 stage per pump, POP at stage 4;
  `deflateEnemy` on release, floors at 0), **rock gravity** (`rockShouldFall` = unsupported iff
  the cell below is dug; `rockFallCrush` travels the column through open cells, crushes every
  entity it passes incl. the player, stops at dirt/floor), **depth-tiered scoring**
  (`depthTier`/`pumpScore`/`crushScore` — deeper kills worth more, a crush out-scores a pump at
  the same depth, fygar > pooka), an **enemy chase** (`enemyChaseStep` BFS through tunnel; a
  ghost mode that drifts straight through dirt toward the player when no tunnel path exists),
  `levelCleared`, and a **seeded** `buildLevel` (deterministic enemy + rock layout). Pookas
  (round) chase; Fygars (dragons) also breathe a straight-line flame down their row. The
  headless **17-check self-test** asserts these against hand-built expected values (the
  rock-crush check asserts the exact crushed set for a known column; determinism asserts
  same-seed ⇒ identical layout). Green ✓ chip, re-run under Node = **17/17** == browser chip.
  Browser-verified (agent-browser, named session `digdug-qa`, served origin): 17/17 + green chip,
  **0 console errors/warnings/page-errors**, fps 60; played through dig/tunnel, pump-inflate→POP
  (score 0→1400), undermine→rock-wobble→fall→**crush** (→2100), hit/lose-a-life→respawn, all
  lives lost→clean GAME OVER, clear→advance level 1→2, and a walled-off enemy flipping to
  **ghost/eyes** and phasing through dirt. Wired: `games.js` (→18), thumb
  `assets/thumbs/digdug.png` (real in-game capture, **1440×900**), front-door tag **17→18 games**
  + "Dig Dug" appended to the blurb list (front door otherwise untouched — still the curated 9
  cards). 1474 lines, single self-contained vanilla file, **zero deps/network**, muted-by-default
  (M toggle). One playability fix during QA: a quick arrow **tap** now digs one cell immediately
  on keydown (the continuous-hold path alone missed taps whose keyup landed before the next
  frame). `ws:best:digdug` = best **score** (raise-only). Accent `#ffa83d`.
- 2026-06-12 — Added **Vanguard** (neon Galaga-lineage formation shooter → **17** cabinets): the rack
  gains the genre's defining **capture-beam / dual-fighter** mechanic that Starfighter (a free-fire shmup)
  deliberately omits. Built on a pure, testable core — the whole capture/dual status is one object
  `{mode:'single'|'dual', lives, captured, captorId, dead}` and three pure transitions: `capturePlayer`
  (seize the ship, `lives--`, hold by a boss; a dual reverts to single), `shootBoss` (returns `'rescued'`
  → `mode='dual'` only when the shot boss IS the captor; else a plain `'killed'`), and a bomb-hit sunder
  (`'sundered'` back to single, no life lost). `fireEmitters` returns `[0]` for single and `[-16,+16]` for
  dual (double muzzles). Formation is a 5×8 grid with a deterministic bounded sway; enemies enter on bezier
  paths (off-screen→slot) and dive on curved paths (slot→past the player band→off-bottom). Player bullets
  capped at 2 aloft. The headless 15-check self-test calls these real functions (capture/rescue/dual state
  machine + mismatch cases, dual firepower, slot bijection, sway determinism, path endpoints, bullet cap,
  collision/scoring with boss=2-hits); green ✓ chip, re-run under Node = 15/15. Browser-verified
  (agent-browser, named session, served origin): 15/15 + green chip, 0 console errors, fps 60, played
  through kill/score/lose-life/wave-advance and the full capture→rescue→dual. `ws:best:vanguard` = best
  score (raise-only). Accent `#37d6ff`. Single self-contained file, 1386 lines, 0 deps/network.
- 2026-06-12 — Added **Qubit** (neon isometric cube-hopper → **16** cabinets): the rack's first
  **Q*bert-lineage isometric hopper** — a genre it lacked. Built on a pure, testable coordinate core:
  the 28-cube pyramid is modelled as axial `(r,i)` grid coords (row `r` 0..6, position `i` 0..r); the
  four diagonal hops are deterministic deltas — up-left `(r-1,i-1)`, up-right `(r-1,i)`, down-left
  `(r+1,i)`, down-right `(r+1,i+1)` — a consistent lattice (down-left∘up-right = identity, etc.). The
  orb hops between adjacent cube tops, flipping each face toward the level target; clear the pyramid to
  advance (L1 one-flip, L2+ two-step, L3+ reversible). Danger = **falling off the edge** (a hop is fatal
  IFF the result is out of bounds), plus **red bouncing balls**, a **purple Coily** that hatches and
  chases by shortest-path hop, and **rescue discs** on both edges (ride to apex; lure Coily off the edge
  for +500). 3 lives + extra at 12k, full juice, per-level palette, muted-by-default SFX. A **headless
  6-check self-test** calls the real core (invertibility round-trip / edge detection / iso projection
  distinctness + label↔motion / level-complete logic / Coily legal-hop / reversible flip), logs PASS per
  check, shows a green ✓ chip — never ships red. Browser-verified (agent-browser, served origin): 6/6
  PASS + chip, **0 console errors/warnings**, hopping/flips/scoring (0→130)/red-ball/disc/edge-death all
  live, `ws:best:qubit` written. Wired: `games.js` (→16), thumb `assets/thumbs/qubit.png` (1440×900),
  front-door tag **15→16 games** + "Qubit" appended to the blurb list (front door otherwise untouched —
  still the curated 9 cards). 1382 lines, single self-contained vanilla file, zero deps/network. No
  Undercroft secret added — breadcrumb left for future use. `ws:best:qubit` = best level reached.
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
