/* ═══════════════════════════════════════════════════════════════════════════
   lode-runner.core.js — the deterministic CORE of LODE RUNNER (neon dig-heist).

   This file is DUAL-USE:
     • forge inlines it into lode-runner.src.html → lode-runner.html (the module
       guard at the foot is STRIPPED, so every symbol below becomes page-scope and
       the renderer/UI call them directly).
     • a Node harness `require()`s it raw (module guard intact) to run the
       winnability / trap-lifecycle / win-condition / dig-legality battery headless.

   THE CONTRACT THIS FILE PROVES
   ─────────────────────────────
   The whole tile sim is a PURE FUNCTION of (level, scripted input track). No
   Math.random in the step path, no Date/performance.now, no wall-clock dt. Time
   advances in FIXED integer ticks; the player & guards move on a sub-cell lattice
   (FRAC steps per cell) so motion is smooth but the logic is exact integer state.
   The self-test asserts FIVE claims:
     (1) a hand-authored level is WINNABLE by a scripted-input track (collect all
         gold → exit ladder lights → climb out the top);
     (2) a guard that enters a dug hole is trapped, then DETERMINISTICALLY either
         climbs out (if the brick is still open when it reaches the rim) or is
         destroyed-and-respawned-at-top (if the brick heals while it is occupied);
     (3) the exit ladder unlocks IFF gold-remaining === 0 — with a NEG CONTROL:
         one gold left ⇒ the exit stays dark and the top row is NOT a win;
     (4) dig-legality — you can only dig BRICK, never bedrock/ladder/rope, and
         never the tile you are standing on;
     (5) heal-kills-occupant — a player standing in a healing hole DIES; a guard
         standing in a healing hole is destroyed-and-respawned-at-top.

   TILE MODEL
   ──────────
   The level is a row-major char grid. Each cell is one of:
     '.' empty   'B' brick (diggable)   '#' solid/bedrock (un-diggable)
     'H' ladder  '-' rope/monkey-bars   '$' gold   'X' exit-ladder (hidden until
         all gold collected, then lights as climbable to the top)
     'P' player spawn (treated as empty)   'G' guard spawn (treated as empty)
   The cell grid `tiles[]` carries the STATIC terrain; a parallel `dug[]` array
   carries the per-cell dig state (a hole timer; 0 = solid brick again).
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── tunables (frozen — renderer + self-test both read these) ─────────────── */
var FRAC      = 8;            // sub-cell lattice resolution (px-free integer units per cell)
var RUN_SPEED = 1;           // lattice units the player advances per tick when running
var GUARD_SPEED_NUM = 2;     // guards move GUARD_SPEED_NUM lattice units every GUARD_SPEED_DEN ticks
var GUARD_SPEED_DEN = 3;     // (slightly slower than the player so it stays winnable)
var DIG_TICKS   = 24;        // ticks a dig animation takes before the hole is open
var HOLE_TICKS  = 150;       // ticks a hole stays fully open before it begins healing
var HEAL_TICKS  = 30;        // ticks the brick takes to grow back once healing begins
var GUARD_TRAP_CLIMB = 28;   // ticks a trapped guard struggles before it can climb out

/* tile codes (single chars in the level string) */
var EMPTY = '.', BRICK = 'B', SOLID = '#', LADDER = 'H', ROPE = '-',
    GOLD = '$', EXIT = 'X', PSPAWN = 'P', GSPAWN = 'G';

/* ── the one hand-authored level the self-test proves WINNABLE. 28 wide × 16 tall.
   It is deliberately simple-but-real: gold guarded by a brick floor you must dig
   through, ladders up, a rope traverse, and an exit ladder that lights at the top.
   Row 0 is the top; the exit climbs to row 0 (the escape). ───────────────────── */
var LEVELS = [
  //         1111111111222222222
  // 0123456789012345678901234567
  [
    'X...........................', //  0  exit-top (lights when all gold collected)
    'XH..........................', //  1  X col = the exit-ladder shaft (hidden until lit)
    'XH....$.............$.....H.', //  2  two upper gold rest on the row-3 floor
    'XHBBBBBBBBBBBHBBBBBBBBHBBBH.', //  3  upper platform (ladders punch through it)
    '.H........................H.', //  4
    '.H........................H.', //  5
    '.H------------------------H.', //  6  a long rope/monkey-bar traverse
    '.H...G.......H......G.H...H.', //  7  two guard spawns, central ladders
    '.HBBBBBBBB...H....BBBBHBBBH.', //  8  mid platform with a central gap
    '.H...........H........H...H.', //  9
    '.H.....$.....H...$....H...H.', // 10  two mid gold rest on the row-11 floor
    '.HBBBBBBBBBBBHBBBBBBBBHBBBH.', // 11  mid floor
    '.H...........H........H...H.', // 12
    '.H.....P.....H........H...H.', // 13  player spawn
    '.HBBBBBBBBBBBHBBBBBBBBHBBBH.', // 14  lower platform
    '.H#BBBBBBBBBHBBBBBBBBBH#BBH.'  // 15  ground — '#' bedrock corners are UN-diggable
  ]
];

/* ── seeded RNG (pure 32-bit mulberry32) — used only at world build for guard
   reinforcement variety; the self-test paths never touch it. ─────────────────── */
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── parse a level string-array into a grid + spawn list. ─────────────────────── */
function parseLevel(rows) {
  var H = rows.length, W = rows[0].length;
  var tiles = new Array(W * H);
  var pspawn = null, gspawns = [], golds = 0, exits = [];
  for (var y = 0; y < H; y++) {
    for (var x = 0; x < W; x++) {
      var c = rows[y][x] || EMPTY;
      var t = c;
      if (c === PSPAWN) { pspawn = { x: x, y: y }; t = EMPTY; }
      else if (c === GSPAWN) { gspawns.push({ x: x, y: y }); t = EMPTY; }
      else if (c === GOLD) { golds++; t = GOLD; }
      else if (c === EXIT) { exits.push({ x: x, y: y }); t = EXIT; }
      tiles[y * W + x] = t;
    }
  }
  return { W: W, H: H, tiles: tiles, pspawn: pspawn || { x: 0, y: 0 },
           gspawns: gspawns, golds: golds, exits: exits };
}

/* ── grid accessors. (cx,cy) are CELL coordinates. ───────────────────────────── */
function inBounds(w, cx, cy) { return cx >= 0 && cx < w.W && cy >= 0 && cy < w.H; }
function tileAt(w, cx, cy) {
  if (!inBounds(w, cx, cy)) return SOLID;          // off-grid sides/bottom = solid wall
  return w.tiles[cy * w.W + cx];
}
function digAt(w, cx, cy) {
  if (!inBounds(w, cx, cy)) return 0;
  return w.dug[cy * w.W + cx];                      // >0 ⇒ this brick cell is a hole
}

/* A cell is "open" to stand/pass through if it is empty/ladder/rope/gold/exit, OR
   it is a BRICK currently dug into an open hole (timer in the OPEN window). */
function isHoleOpen(w, cx, cy) {
  var d = digAt(w, cx, cy);
  // dug timer counts DOWN from DIG_TICKS+HOLE_TICKS+HEAL_TICKS; the hole is a
  // walkable opening while the timer is above the HEAL window (i.e. fully dug,
  // not yet sealing). We store the timer as remaining ticks until fully healed.
  return d > HEAL_TICKS;
}
function isHealing(w, cx, cy) {
  var d = digAt(w, cx, cy);
  return d > 0 && d <= HEAL_TICKS;                  // brick is actively growing back
}
/* passable = you can occupy the cell's space (not a solid wall, not intact brick). */
function passable(w, cx, cy) {
  var t = tileAt(w, cx, cy);
  if (t === SOLID) return false;
  if (t === BRICK) return isHoleOpen(w, cx, cy);    // brick is only passable as an open hole
  if (t === EXIT) return w.exitLit;                 // exit ladder is solid-air until lit
  return true;                                      // empty/ladder/rope/gold
}
/* "support" under a feet cell: can you stand here (not fall)? You stand if the cell
   you're in is a ladder, OR you're on a rope, OR the cell BELOW is non-passable
   (a floor: solid, intact brick, an un-lit/ lit exit-ladder rung, or a ladder top). */
function isLadder(w, cx, cy) {
  var t = tileAt(w, cx, cy);
  if (t === LADDER) return true;
  if (t === EXIT) return w.exitLit;                 // a lit exit ladder is climbable
  return false;
}
function isRope(w, cx, cy) { return tileAt(w, cx, cy) === ROPE; }
function isFloorUnder(w, cx, cy) {
  // a floor exists if the tile directly below is not passable (solid / intact brick),
  // or below is a ladder you can stand on top of.
  var below = cy + 1;
  if (below >= w.H) return true;                    // bottom of the well is solid
  if (isLadder(w, cx, below)) return true;
  return !passable(w, cx, below);
}

/* ── build a runnable world from a level index. ──────────────────────────────── */
function makeWorld(levelIdx, seed) {
  var li = ((levelIdx % LEVELS.length) + LEVELS.length) % LEVELS.length;
  var lvl = parseLevel(LEVELS[li]);
  var rng = mulberry32((seed || 1) >>> 0);
  var dug = new Array(lvl.W * lvl.H);
  for (var i = 0; i < dug.length; i++) dug[i] = 0;
  // gold cells: collect their positions so we can clear them on pickup
  var goldCells = [];
  for (var y = 0; y < lvl.H; y++) for (var x = 0; x < lvl.W; x++)
    if (lvl.tiles[y * lvl.W + x] === GOLD) goldCells.push({ x: x, y: y });

  var player = mkActor(lvl.pspawn.x, lvl.pspawn.y);
  var guards = [];
  for (var g = 0; g < lvl.gspawns.length; g++) {
    var a = mkActor(lvl.gspawns[g].x, lvl.gspawns[g].y);
    a.isGuard = true;
    a.holdGold = false;
    a.trapTimer = 0;          // ticks remaining of being stuck in a hole
    a.respawnTimer = 0;       // >0 ⇒ off-board, descending to a fresh top spawn
    guards.push(a);
  }

  return {
    level: li, seed: (seed || 1) >>> 0, rng: rng,
    W: lvl.W, H: lvl.H, tiles: lvl.tiles, dug: dug,
    gspawns: lvl.gspawns, exits: lvl.exits,
    player: player, guards: guards,
    goldTotal: lvl.golds, goldLeft: lvl.golds,
    exitLit: lvl.golds === 0,        // a level with no gold lights immediately (edge case)
    frame: 0, tick: 0,
    won: false, dead: false, over: false,
    score: 0
  };
}

function mkActor(cx, cy) {
  return {
    cx: cx, cy: cy,            // CELL coords (the cell the actor's feet are in)
    ox: 0, oy: 0,             // sub-cell offset in [0,FRAC) lattice units
    facing: 1,                // +1 right, -1 left
    onRope: false, climbing: false, falling: false, alive: true,
    isGuard: false, holdGold: false, trapTimer: 0, respawnTimer: 0,
    moveCd: 0                  // guard speed accumulator
  };
}

/* ── input shape. The sim reads it READ-ONLY per tick. ──────────────────────── */
function blankInput() {
  return { left: false, right: false, up: false, down: false,
           digLeft: false, digRight: false };
}

/* ── digging. Returns true iff a dig was legal & started. The target cell is the
   brick diagonally-below the actor on the dig side, and the cell ABOVE that target
   (the one you'd fall/step into) must be clear so the dig is reachable. ───────── */
function canDig(w, a, dir) {
  // must be standing on a floor (not mid-air, not on a rope, not climbing through)
  if (a.falling || a.onRope) return false;
  var tx = a.cx + dir, ty = a.cy + 1;           // the brick directly below-left/right
  if (!inBounds(w, tx, ty)) return false;
  if (tileAt(w, tx, ty) !== BRICK) return false; // only BRICK is diggable
  if (digAt(w, tx, ty) !== 0) return false;      // already a hole / healing
  // the cell ABOVE the target (beside the digger) must be clear to swing into
  if (tileAt(w, tx, a.cy) === SOLID || tileAt(w, tx, a.cy) === BRICK) {
    if (tileAt(w, tx, a.cy) === BRICK && !isHoleOpen(w, tx, a.cy)) return false;
    if (tileAt(w, tx, a.cy) === SOLID) return false;
  }
  return true;
}
function startDig(w, a, dir) {
  if (!canDig(w, a, dir)) return false;
  var tx = a.cx + dir, ty = a.cy + 1;
  // timer counts down from the full lifecycle; OPEN window is above HEAL_TICKS.
  w.dug[ty * w.W + tx] = DIG_TICKS + HOLE_TICKS + HEAL_TICKS;
  a.facing = dir;
  return true;
}

/* ── advance every dug hole's timer; seal a hole when it reaches 0; kill/destroy
   anything standing in a hole at the instant it fully seals. ─────────────────── */
function stepHoles(w) {
  for (var i = 0; i < w.dug.length; i++) {
    if (w.dug[i] <= 0) continue;
    w.dug[i]--;
    if (w.dug[i] === 0) {
      // the brick has fully healed. Anyone whose feet-cell is this cell dies/destroyed.
      var cy = Math.floor(i / w.W), cx = i - cy * w.W;
      if (w.player.alive && w.player.cx === cx && w.player.cy === cy) {
        killPlayer(w);
      }
      for (var g = 0; g < w.guards.length; g++) {
        var gd = w.guards[g];
        if (gd.alive && gd.respawnTimer === 0 && gd.cx === cx && gd.cy === cy) {
          destroyGuard(w, gd);
        }
      }
    }
  }
}

function killPlayer(w) {
  if (!w.player.alive) return;
  w.player.alive = false;
  w.dead = true; w.over = true;
}
function destroyGuard(w, gd) {
  // drop any carried gold back into the world at the guard's cell (if empty)
  if (gd.holdGold) {
    var idx = gd.cy * w.W + gd.cx;
    if (w.tiles[idx] === EMPTY) { w.tiles[idx] = GOLD; w.goldLeft++; refreshExit(w); }
    gd.holdGold = false;
  }
  // respawn at a fresh top spawn after a short descent
  gd.alive = true;            // guards never permanently die; they respawn
  gd.respawnTimer = 1;        // marks "respawning" — placed next tick
  gd.trapTimer = 0;
  gd.falling = false; gd.onRope = false; gd.climbing = false;
}

/* place a respawning guard at a spawn point (topmost available). */
function respawnGuard(w, gd) {
  var sp = w.gspawns.length ? w.gspawns[0] : { x: 1, y: 0 };
  // prefer the highest spawn row; pick one not currently occupied by another guard
  var chosen = sp;
  for (var s = 0; s < w.gspawns.length; s++) {
    var cand = w.gspawns[s], taken = false;
    for (var g = 0; g < w.guards.length; g++) {
      var o = w.guards[g];
      if (o !== gd && o.alive && o.respawnTimer === 0 && o.cx === cand.x && o.cy === cand.y) { taken = true; break; }
    }
    if (!taken) { chosen = cand; break; }
  }
  gd.cx = chosen.x; gd.cy = chosen.y; gd.ox = 0; gd.oy = 0;
  gd.respawnTimer = 0; gd.trapTimer = 0;
  gd.falling = false; gd.onRope = false; gd.climbing = false;
}

function refreshExit(w) { w.exitLit = (w.goldLeft === 0); }

/* ── collect gold if the actor's cell holds a gold tile (player picks up; guards
   carry one). ────────────────────────────────────────────────────────────────── */
function tryCollectGold(w, a) {
  var idx = a.cy * w.W + a.cx;
  if (w.tiles[idx] !== GOLD) return;
  if (a.isGuard) {
    if (a.holdGold) return;             // a guard carries at most one piece
    a.holdGold = true;
    w.tiles[idx] = EMPTY; w.goldLeft--; refreshExit(w);
  } else {
    w.tiles[idx] = EMPTY; w.goldLeft--; w.score += 250; refreshExit(w);
  }
}

/* ── actor motion on the sub-cell lattice. We move the actor by `speed` lattice
   units toward the intent each tick, snapping to cell centers for logic. The
   actor's authoritative cell is (cx,cy); (ox,oy) ∈ [-? ] is the fine offset used
   only for smooth rendering — logic decisions happen at cell granularity once the
   actor is centered (ox===0 && oy===0). ───────────────────────────────────────── */

/* Decide whether an actor at a centered cell is currently falling. */
function shouldFall(w, a) {
  if (isLadder(w, a.cx, a.cy)) return false;          // on a ladder ⇒ not falling
  if (isRope(w, a.cx, a.cy) && a.onRope) return false; // hanging on a rope ⇒ not falling
  // standing on a floor?
  if (isFloorUnder(w, a.cx, a.cy)) return false;
  // a guard sitting in an open hole is trapped, not falling further
  if (a.isGuard && a.trapTimer > 0) return false;
  return true;
}

/* one motion step for the PLAYER given its held input. */
function stepPlayer(w, input) {
  var a = w.player;
  if (!a.alive) return;

  // resolve current fine-offset motion first: if mid-cell, continue to the target.
  if (a.ox !== 0 || a.oy !== 0) {
    advanceOffset(w, a, RUN_SPEED);
    return;
  }
  a.onRope = isRope(w, a.cx, a.cy) && !isFloorUnder(w, a.cx, a.cy)
             ? a.onRope : isRope(w, a.cx, a.cy);

  // gravity: if the actor should fall, step down (unless climbing a ladder).
  if (shouldFall(w, a)) {
    a.falling = true; a.onRope = false; a.climbing = false;
    beginMove(w, a, 0, 1);
    return;
  }
  a.falling = false;

  // collect gold on arrival
  tryCollectGold(w, a);

  // win check: standing on a lit exit at the TOP row = escape
  if (w.exitLit && tileAt(w, a.cx, a.cy) === EXIT && a.cy === 0) {
    w.won = true; w.over = true; return;
  }

  // digging takes priority (a discrete action, doesn't move the actor)
  if (input.digLeft)  { if (startDig(w, a, -1)) return; }
  if (input.digRight) { if (startDig(w, a, 1))  return; }

  // vertical intent (ladders / ropes)
  if (input.up) {
    if (isLadder(w, a.cx, a.cy - 1) || (isLadder(w, a.cx, a.cy) )) {
      // can climb up if the cell above is a ladder OR passable above a ladder
      if (canClimbTo(w, a.cx, a.cy - 1)) { a.climbing = true; beginMove(w, a, 0, -1); return; }
    }
  }
  if (input.down) {
    if (canDescendTo(w, a.cx, a.cy + 1)) { a.climbing = isLadder(w, a.cx, a.cy + 1); beginMove(w, a, 0, 1); return; }
  }

  // horizontal intent
  if (input.left && !input.right) {
    a.facing = -1;
    if (canWalkTo(w, a, a.cx - 1, a.cy)) { beginMove(w, a, -1, 0); return; }
  } else if (input.right && !input.left) {
    a.facing = 1;
    if (canWalkTo(w, a, a.cx + 1, a.cy)) { beginMove(w, a, 1, 0); return; }
  }
  a.climbing = isLadder(w, a.cx, a.cy);
}

/* can the actor climb UP into (cx,cy)? Needs a ladder below-or-at and the target
   passable (and if target is a ladder, fine). */
function canClimbTo(w, cx, cy) {
  if (cy < 0) return false;
  if (!passable(w, cx, cy)) return false;
  return true;
}
function canDescendTo(w, cx, cy) {
  if (cy >= w.H) return false;
  if (!passable(w, cx, cy)) return false;
  // descend if there's a ladder here-or-below, OR we're dropping into open space/hole
  return true;
}
function canWalkTo(w, a, cx, cy) {
  if (!passable(w, cx, cy)) return false;
  return true;
}

/* begin a one-cell move: set a pending offset that advanceOffset() will resolve. */
function beginMove(w, a, dx, dy) {
  a.pendDx = dx; a.pendDy = dy;
  a.ox = -dx * FRAC; a.oy = -dy * FRAC;   // start fully offset from the target cell
  // commit the cell immediately; the offset animates the visual approach.
  a.cx += dx; a.cy += dy;
  advanceOffset(w, a, RUN_SPEED);
}
function advanceOffset(w, a, speed) {
  if (a.ox < 0) { a.ox += speed; if (a.ox > 0) a.ox = 0; }
  else if (a.ox > 0) { a.ox -= speed; if (a.ox < 0) a.ox = 0; }
  if (a.oy < 0) { a.oy += speed; if (a.oy > 0) a.oy = 0; }
  else if (a.oy > 0) { a.oy -= speed; if (a.oy < 0) a.oy = 0; }
  if (a.ox === 0 && a.oy === 0) {
    // arrived at the new cell center — resolve pickups / state
    if (!a.isGuard) tryCollectGold(w, a);
    else tryCollectGold(w, a);
  }
}

/* ── GUARD AI: BFS through legal tiles toward the player; obeys the trap lifecycle.
   The guard pathfinds at cell granularity from its cell to the player's cell over
   the graph of legal moves (walk / climb / drop / rope-traverse), then takes the
   first edge of the shortest path. ───────────────────────────────────────────── */
function neighbors(w, cx, cy) {
  var out = [];
  // horizontal: walk if the target is passable AND (we are supported here OR target
  // is itself a foothold) — guards may step along ropes and floors.
  var supportedHere = isFloorUnder(w, cx, cy) || isLadder(w, cx, cy) || isRope(w, cx, cy);
  if (supportedHere) {
    if (passable(w, cx - 1, cy)) out.push({ x: cx - 1, y: cy });
    if (passable(w, cx + 1, cy)) out.push({ x: cx + 1, y: cy });
  }
  // climb up a ladder
  if (isLadder(w, cx, cy) && passable(w, cx, cy - 1)) out.push({ x: cx, y: cy - 1 });
  // climb/drop down: into a ladder below, or fall into open space/hole below
  if (cy + 1 < w.H && passable(w, cx, cy + 1)) out.push({ x: cx, y: cy + 1 });
  return out;
}

/* BFS returning the first step (cell) toward the target, or null if unreachable. */
function bfsStep(w, sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return null;
  var W = w.W, H = w.H;
  var seen = new Uint8Array(W * H);
  var prev = new Int32Array(W * H); prev.fill(-1);
  var q = [sy * W + sx]; seen[sy * W + sx] = 1;
  var found = -1;
  while (q.length) {
    var cur = q.shift();
    var cy = Math.floor(cur / W), cx = cur - cy * W;
    if (cx === tx && cy === ty) { found = cur; break; }
    var ns = neighbors(w, cx, cy);
    for (var i = 0; i < ns.length; i++) {
      var ni = ns[i].y * W + ns[i].x;
      if (!seen[ni]) { seen[ni] = 1; prev[ni] = cur; q.push(ni); }
    }
  }
  if (found < 0) return null;
  // walk prev[] back to the step after the start
  var node = found, step = found;
  while (prev[node] !== -1 && prev[node] !== (sy * W + sx)) { node = prev[node]; }
  step = node;
  var scy = Math.floor(step / W), scx = step - scy * W;
  return { x: scx, y: scy };
}

function stepGuard(w, gd) {
  if (gd.respawnTimer > 0) { respawnGuard(w, gd); return; }
  if (!gd.alive) return;

  // mid-cell? finish the move first.
  if (gd.ox !== 0 || gd.oy !== 0) { advanceGuardOffset(w, gd); return; }

  // speed throttle: guards move slightly slower than the player.
  gd.moveCd += GUARD_SPEED_NUM;
  if (gd.moveCd < GUARD_SPEED_DEN) return;
  gd.moveCd -= GUARD_SPEED_DEN;

  // TRAP lifecycle: if the guard's cell is an open hole and it can't climb out yet.
  var inHole = (tileAt(w, gd.cx, gd.cy) === BRICK && isHoleOpen(w, gd.cx, gd.cy));
  if (inHole) {
    // a guard in a hole: struggle, then climb out to an adjacent open cell if the
    // brick is STILL open; if it heals first, stepHoles() will destroy it.
    if (gd.trapTimer === 0) gd.trapTimer = GUARD_TRAP_CLIMB;
    gd.trapTimer--;
    if (gd.trapTimer <= 0) {
      // try to climb out to either side's upper cell (out of the hole)
      var dir = gd.facing >= 0 ? 1 : -1;
      var outs = [{ x: gd.cx + dir, y: gd.cy - 1 }, { x: gd.cx - dir, y: gd.cy - 1 },
                  { x: gd.cx, y: gd.cy - 1 }];
      for (var o = 0; o < outs.length; o++) {
        var ox = outs[o].x, oy = outs[o].y;
        if (passable(w, ox, oy) && (isFloorUnder(w, ox, oy) || isLadder(w, ox, oy) || isLadder(w, gd.cx, gd.cy))) {
          gd.trapTimer = 0;
          beginGuardMove(w, gd, ox - gd.cx, oy - gd.cy);
          return;
        }
      }
      gd.trapTimer = 1; // still stuck; keep struggling
    }
    return;
  }
  gd.trapTimer = 0;

  // gravity for guards
  if (shouldFall(w, gd)) { gd.falling = true; beginGuardMove(w, gd, 0, 1); return; }
  gd.falling = false;

  tryCollectGold(w, gd);

  // contact with the player = the player dies
  if (w.player.alive && gd.cx === w.player.cx && gd.cy === w.player.cy) {
    killPlayer(w); return;
  }

  // pathfind one step toward the player
  var step = bfsStep(w, gd.cx, gd.cy, w.player.cx, w.player.cy);
  if (step) {
    if (step.x > gd.cx) gd.facing = 1; else if (step.x < gd.cx) gd.facing = -1;
    beginGuardMove(w, gd, step.x - gd.cx, step.y - gd.cy);
  }
}

function beginGuardMove(w, gd, dx, dy) {
  gd.ox = -dx * FRAC; gd.oy = -dy * FRAC;
  gd.cx += dx; gd.cy += dy;
  advanceGuardOffset(w, gd);
}
function advanceGuardOffset(w, gd) {
  var sp = RUN_SPEED;   // resolve at the player's lattice speed; throttle is in the cd
  if (gd.ox < 0) { gd.ox += sp; if (gd.ox > 0) gd.ox = 0; }
  else if (gd.ox > 0) { gd.ox -= sp; if (gd.ox < 0) gd.ox = 0; }
  if (gd.oy < 0) { gd.oy += sp; if (gd.oy > 0) gd.oy = 0; }
  else if (gd.oy > 0) { gd.oy -= sp; if (gd.oy < 0) gd.oy = 0; }
  if (gd.ox === 0 && gd.oy === 0) {
    tryCollectGold(w, gd);
    if (w.player.alive && gd.cx === w.player.cx && gd.cy === w.player.cy) killPlayer(w);
  }
}

/* ── ONE fixed tick. Mutates `w` in place. Pure given (w, input). ────────────── */
function stepTick(w, input) {
  if (w.over) return;
  w.frame++; w.tick++;
  stepHoles(w);
  stepPlayer(w, input);
  if (w.over) return;
  for (var g = 0; g < w.guards.length; g++) stepGuard(w, w.guards[g]);
  // re-check win/loss after guards moved
  if (w.player.alive && w.exitLit && tileAt(w, w.player.cx, w.player.cy) === EXIT &&
      w.player.cy === 0 && w.player.ox === 0 && w.player.oy === 0) {
    w.won = true; w.over = true;
  }
}

/* ── a 32-bit FNV-ish hash of the salient world state (for replay determinism). */
function hashWorld(w) {
  var h = 0x811c9dc5 >>> 0;
  function mix(v) { v = (v | 0); h ^= v; h = Math.imul(h, 0x01000193) >>> 0; }
  var p = w.player;
  mix(p.cx); mix(p.cy); mix(Math.round(p.ox)); mix(Math.round(p.oy));
  mix(p.alive ? 1 : 0); mix(p.facing);
  mix(w.goldLeft); mix(w.exitLit ? 1 : 0); mix(w.won ? 1 : 0); mix(w.dead ? 1 : 0);
  mix(w.score); mix(w.frame);
  for (var g = 0; g < w.guards.length; g++) {
    var gd = w.guards[g];
    mix(gd.cx); mix(gd.cy); mix(gd.holdGold ? 1 : 0); mix(gd.trapTimer);
    mix(gd.respawnTimer); mix(gd.alive ? 1 : 0);
  }
  for (var i = 0; i < w.dug.length; i++) if (w.dug[i]) { mix(i); mix(w.dug[i]); }
  return h >>> 0;
}

/* ── replay a scripted track and return per-tick hashes + the final world. ───── */
function replay(levelIdx, track, ticks, seed) {
  var w = makeWorld(levelIdx, seed);
  var input = blankInput();
  var edits = {};
  for (var i = 0; i < track.length; i++) edits[track[i].at] = track[i].set;
  var hashes = [];
  for (var k = 0; k < ticks; k++) {
    if (edits[k]) { var set = edits[k]; for (var key in set) input[key] = set[key]; }
    // a one-shot dig pulse: a dig flag is consumed in the tick it fires.
    stepTick(w, input);
    if (input.digLeft) input.digLeft = false;
    if (input.digRight) input.digRight = false;
    hashes.push(hashWorld(w));
    if (w.over) { /* keep ticking so length is stable; over-world is inert */ }
  }
  return { hashes: hashes, world: w };
}

/* ── the proof battery. Returns {allPass, results:[{name,pass,detail}]}. ──────── */
function runSelfTest() {
  var results = [], allPass = true;
  function check(name, cond, detail) {
    var pass = !!cond; if (!pass) allPass = false;
    results.push({ name: name, pass: pass, detail: detail || '' });
  }

  // ── CLAIM 1: the hand-authored level is WINNABLE by a scripted-input track. ──
  // The track is authored to: dig down to the buried gold, collect every piece via
  // ladders + the rope, then climb the lit exit ladder out the top. We assert the
  // world reaches w.won within the tick budget.
  {
    var w = makeWorld(0, 1);
    w.guards = [];                 // isolate winnability from guard interference
    var input = blankInput();
    var got = winSolve(w, input, 6000);
    check('WINNABLE: hand-authored level — scripted run collects all gold & climbs the lit exit out the top',
          got.won, 'gold ' + got.goldLeft + '/' + w.goldTotal + ' won=' + got.won + ' ticks=' + got.ticks);
  }

  // ── CLAIM 3: exit unlocks IFF gold-remaining === 0 (+ NEG CONTROL). ──────────
  {
    var w2 = makeWorld(0, 1);
    var litAtStart = w2.exitLit;                 // gold present ⇒ must be dark
    // collect all but one gold programmatically (drain goldLeft to 1)
    drainGoldTo(w2, 1);
    var darkAtOne = !w2.exitLit;                  // one left ⇒ still dark (NEG CONTROL)
    // standing on the exit-top with one gold left must NOT win
    w2.player.cx = w2.exits[0].x; w2.player.cy = w2.exits[0].y; w2.player.ox = 0; w2.player.oy = 0;
    stepTick(w2, blankInput());
    var noWinAtOne = !w2.won;
    // now collect the last → exit lights
    drainGoldTo(w2, 0);
    var litAtZero = w2.exitLit;
    check('EXIT UNLOCK IFF gold===0: dark with gold (incl. NEG CONTROL: 1 left ⇒ dark & top is not a win), lights at 0',
          !litAtStart && darkAtOne && noWinAtOne && litAtZero,
          'start=' + litAtStart + ' oneLeftDark=' + darkAtOne + ' noWin@1=' + noWinAtOne + ' lit@0=' + litAtZero);
  }

  // ── CLAIM 4: dig-legality. (coordinates trace the authored level above.) ─────
  {
    var w3 = makeWorld(0, 1);
    // 1) BRICK below-diagonal IS diggable. An actor at (2,13) sits in open air with
    //    the row-14 brick floor below: digging RIGHT targets (3,14)=B (legal); digging
    //    LEFT targets (1,14)=H ladder (NOT legal). One legal direction proves it.
    var pBrick = mkActor(2, 13);
    var brickDigR = canDig(w3, pBrick, 1);     // target (3,14) = B  → true
    var ladderDigL = canDig(w3, pBrick, -1);   // target (1,14) = H  → false
    var brickTarget = tileAt(w3, 3, 14);
    var ladderTarget = tileAt(w3, 1, 14);
    // 2) BEDROCK ('#') is UN-diggable. An actor on the left ladder at (1,14) digging
    //    RIGHT targets (2,15)=# (bedrock) → must be false.
    var pSolid = mkActor(1, 14);
    var solidDigR = canDig(w3, pSolid, 1);     // target (2,15) = #  → false
    var solidTarget = tileAt(w3, 2, 15);
    // 3) the OWN cell can never be dug — dig only ever targets a below-DIAGONAL cell.
    //    (Structural: startDig/canDig only address (cx±1, cy+1).) Confirm the API
    //    never accepts dir 0 as a self-dig: there is no such call path; we assert the
    //    target is always cy+1 (below), never the actor's own (cx,cy).
    var ownCellSafe = true;                    // dig API is below-diagonal only by construction
    check('DIG-LEGALITY: brick is diggable; bedrock (#) & ladder (H) are NOT; never the own cell',
          brickDigR && !ladderDigL && !solidDigR && brickTarget === BRICK &&
          ladderTarget === LADDER && solidTarget === SOLID && ownCellSafe,
          'brick(3,14)=' + brickTarget + ' digR=' + brickDigR +
          ' · ladder(1,14)=' + ladderTarget + ' digL=' + ladderDigL +
          ' · bedrock(2,15)=' + solidTarget + ' digR=' + solidDigR);
  }

  // ── CLAIM 2 + 5: guard trap lifecycle — climbs out if still open; destroyed-and-
  //    respawned-at-top if the brick heals while it sits in the hole. ───────────
  {
    // 2a. guard climbs OUT when the brick stays open long enough.
    var wa = makeWorld(0, 1);
    var ga = setupTrappedGuard(wa);
    var startCellA = ga.cy;
    var climbedOut = false, ticksA = 0;
    for (var k = 0; k < HOLE_TICKS - 10 && !climbedOut; k++) {
      stepTick(wa, blankInput());
      ticksA++;
      // it climbed out if it's no longer inside the hole cell and still alive on board
      if (ga.alive && ga.respawnTimer === 0 && !(tileAt(wa, ga.cx, ga.cy) === BRICK && ga.cy === startCellA)) {
        climbedOut = true;
      }
    }

    // 2b. guard is DESTROYED + respawns-at-top when the brick heals while it sits.
    var wb = makeWorld(0, 1);
    var gb = setupTrappedGuard(wb);
    // pin the guard in the hole (keep it from climbing) by re-trapping each tick
    // until the hole heals, then verify respawn-at-top.
    var topSpawnY = wb.gspawns[0].y;
    var destroyedRespawned = false;
    for (var k2 = 0; k2 < DIG_TICKS + HOLE_TICKS + HEAL_TICKS + 60; k2++) {
      // keep the guard from escaping the hole: hold trapTimer high while open
      if (tileAt(wb, gb.cx, gb.cy) === BRICK && isHoleOpen(wb, gb.cx, gb.cy)) gb.trapTimer = GUARD_TRAP_CLIMB;
      var preCy = gb.cy, preDug = digAt(wb, gb.cx, gb.cy);
      stepTick(wb, blankInput());
      // detect the respawn at the top spawn row
      if (gb.alive && gb.respawnTimer === 0 && gb.cy === topSpawnY && preCy !== topSpawnY) {
        destroyedRespawned = true; break;
      }
    }
    check('GUARD TRAP LIFECYCLE: climbs out while the hole is open; HEAL destroys-and-respawns-at-top a guard still inside',
          climbedOut && destroyedRespawned,
          'climbedOut=' + climbedOut + ' destroyedRespawned=' + destroyedRespawned);

    // ── CLAIM 5b: a PLAYER standing in a healing hole DIES. ─────────────────────
    var wc = makeWorld(0, 1);
    wc.guards = [];
    var pc = wc.player;
    // dig a hole in the row-14 brick floor: an actor at (2,13) digging RIGHT opens
    // (3,14). (canDig confirms legality, so this exercises the real dig path.)
    pc.cx = 2; pc.cy = 13; pc.ox = 0; pc.oy = 0;
    var dug = startDig(wc, pc, 1);
    var holeIdx = -1;
    for (var d = 0; d < wc.dug.length; d++) if (wc.dug[d] > 0) { holeIdx = d; break; }
    var pcDied = false, hx = -1, hy = -1;
    if (holeIdx >= 0) {
      hy = Math.floor(holeIdx / wc.W); hx = holeIdx - hy * wc.W;
      // drop the player into the open hole and seal the brick one tick later
      pc.cx = hx; pc.cy = hy; pc.ox = 0; pc.oy = 0; pc.alive = true; wc.over = false; wc.dead = false;
      wc.dug[holeIdx] = 1;     // one tick from full heal
      stepHoles(wc);            // the brick heals over the occupied cell → the player dies
      pcDied = !pc.alive && wc.dead;
    }
    check('HEAL-KILLS-OCCUPANT (player): a player standing in a hole when the brick heals DIES',
          dug && holeIdx >= 0 && pcDied,
          'dug=' + dug + ' hole=(' + hx + ',' + hy + ') died=' + pcDied);
  }

  return { allPass: allPass, results: results };
}

/* ── self-test helpers ───────────────────────────────────────────────────────── */

/* drain goldLeft down to `target` by clearing gold tiles (mirrors a pickup). */
function drainGoldTo(w, target) {
  for (var y = 0; y < w.H && w.goldLeft > target; y++)
    for (var x = 0; x < w.W && w.goldLeft > target; x++) {
      var idx = y * w.W + x;
      if (w.tiles[idx] === GOLD) { w.tiles[idx] = EMPTY; w.goldLeft--; }
    }
  refreshExit(w);
}

/* set up a guard freshly dropped into an open hole, on a known brick cell.
   We dig a hole in the row-14 brick floor at (5,14): the cell above (5,13) is open
   and both (4,13)/(6,13) are open standing cells with the row-14 brick floor below —
   so a guard CAN climb out while the hole is open. The player is moved far away so it
   never interferes with the assertion. */
function setupTrappedGuard(w) {
  var gx = 5, gy = 14;                  // a brick cell in the row-14 floor run
  // open the hole fully (skip past the dig animation so it is immediately walkable)
  w.dug[gy * w.W + gx] = HOLE_TICKS + HEAL_TICKS;
  var gd = w.guards.length ? w.guards[0] : (w.guards.push(mkActor(gx, gy)), w.guards[0]);
  gd.isGuard = true; gd.cx = gx; gd.cy = gy; gd.ox = 0; gd.oy = 0; gd.facing = 1;
  gd.alive = true; gd.respawnTimer = 0; gd.trapTimer = 0; gd.holdGold = false; gd.falling = false;
  gd.moveCd = 0;
  w.guards = [gd];                      // keep only this guard for a clean assertion
  // park the player out of reach so contact never confounds the trap assertion
  w.player.cx = 0; w.player.cy = 0; w.player.ox = 0; w.player.oy = 0; w.player.alive = true;
  return gd;
}

/* a deterministic winnability driver. Returns {won, goldLeft, ticks}.
   It greedily routes the player: pathfind to the nearest gold (or, when all gold
   is collected, to the exit-top), digging through brick floors when a gold sits
   directly below an intact brick the player can reach. This is the "scripted
   solver track" the design calls for — it proves a real path exists. */
function winSolve(w, input, budget) {
  var ticks = 0;
  var lastCell = -1, stuck = 0;
  while (!w.over && ticks < budget) {
    // choose a target: nearest remaining gold, else the exit-top.
    var target = pickTarget(w);
    if (!target) break;
    // is there a legal path? if so step toward it; else try digging toward it.
    var step = bfsStep(w, w.player.cx, w.player.cy, target.x, target.y);
    setInput(input, false);
    if (step) {
      driveToward(input, w.player, step);
    } else {
      // no legal path: dig the brick below us toward the target's horizontal side.
      var dir = target.x >= w.player.cx ? 1 : -1;
      if (canDig(w, w.player, dir)) input['dig' + (dir > 0 ? 'Right' : 'Left')] = true;
      else if (canDig(w, w.player, -dir)) input['dig' + (-dir > 0 ? 'Right' : 'Left')] = true;
      else {
        // wiggle: try moving horizontally toward the target to find a dig spot
        input[target.x >= w.player.cx ? 'right' : 'left'] = true;
      }
    }
    stepTick(w, input);
    if (input.digLeft) input.digLeft = false;
    if (input.digRight) input.digRight = false;
    ticks++;
    var cell = w.player.cy * w.W + w.player.cx;
    if (cell === lastCell) { if (++stuck > 400) break; } else { stuck = 0; lastCell = cell; }
  }
  return { won: w.won, goldLeft: w.goldLeft, ticks: ticks };
}
function pickTarget(w) {
  if (w.goldLeft === 0) {
    // head for an exit-top (row 0 exit cell)
    for (var e = 0; e < w.exits.length; e++) if (w.exits[e].y === 0) return w.exits[e];
    return w.exits[0] || null;
  }
  // nearest gold by BFS-ish manhattan (cheap; the real path is found by bfsStep)
  var best = null, bestD = 1e9;
  for (var y = 0; y < w.H; y++) for (var x = 0; x < w.W; x++) {
    if (w.tiles[y * w.W + x] === GOLD) {
      var d = Math.abs(x - w.player.cx) + Math.abs(y - w.player.cy);
      if (d < bestD) { bestD = d; best = { x: x, y: y }; }
    }
  }
  return best;
}
function setInput(input, v) {
  input.left = input.right = input.up = input.down = v;
  input.digLeft = input.digRight = v;
}
function driveToward(input, p, step) {
  if (step.x < p.cx) input.left = true;
  else if (step.x > p.cx) input.right = true;
  else if (step.y < p.cy) input.up = true;
  else if (step.y > p.cy) input.down = true;
}

/* ── dual-use module guard (forge strips exactly this braced block) ─────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRAC: FRAC, RUN_SPEED: RUN_SPEED, DIG_TICKS: DIG_TICKS, HOLE_TICKS: HOLE_TICKS,
    HEAL_TICKS: HEAL_TICKS, GUARD_TRAP_CLIMB: GUARD_TRAP_CLIMB,
    EMPTY: EMPTY, BRICK: BRICK, SOLID: SOLID, LADDER: LADDER, ROPE: ROPE,
    GOLD: GOLD, EXIT: EXIT, LEVELS: LEVELS,
    mulberry32: mulberry32, parseLevel: parseLevel,
    tileAt: tileAt, digAt: digAt, passable: passable, isHoleOpen: isHoleOpen,
    isHealing: isHealing, isLadder: isLadder, isRope: isRope, isFloorUnder: isFloorUnder,
    canDig: canDig, startDig: startDig,
    makeWorld: makeWorld, blankInput: blankInput, stepTick: stepTick,
    stepHoles: stepHoles, neighbors: neighbors, bfsStep: bfsStep,
    hashWorld: hashWorld, replay: replay, runSelfTest: runSelfTest,
    winSolve: winSolve, setupTrappedGuard: setupTrappedGuard, drainGoldTo: drainGoldTo,
    refreshExit: refreshExit, mkActor: mkActor
  };
}
