"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   the-climb.core.js — the deterministic CORE for THE CLIMB (neon girder-climb).

   This file is dual-use: the forge inlines it into the-climb.html (the module
   guard at the foot is stripped, so makeWorld/stepTick/runSelfTest/… become page
   globals) and the-climb.test.cjs require()s it RAW to run the identical battery,
   so the in-page chip and the Node twin assert byte-for-byte the same claims.

   THE CONTRACT THIS FILE PROVES
   ─────────────────────────────
   The whole climb is a PURE FUNCTION of (level, scripted input track). No
   Math.random / Date / performance.now in the step path; time advances in FIXED
   integer ticks; the figure + barrels live on a sub-cell lattice (FRAC integer
   units per cell) so motion is smooth but the logic is exact integer state.

   THE FIVE CLAIMS (the in-page chip === the Node twin):
     (1) WINNABLE: a hand-authored board is reachable to the top platform by a
         scripted-input track (the BFS solver drives the figure up and wins).
     (2) BARREL FOLLOWS THE RAMP: a barrel rolls along its girder in the slant
         direction and only DROPS at a junction-gap (a 'h' DROP cell).
         NEG CONTROL: a barrel on a girder with NO gap never drops.
     (3) JUMP-CLEARANCE (a DOUBLE negative control): a WELL-TIMED jump clears a
         barrel (hop, score, survive). NEG-A: never jumping → a grounded overlap
         collides. NEG-B: a TOO-LATE jump (fired the tick the barrel is already
         on you) still collides. Together these prove IFF — only a well-timed
         jump saves you, not "any jump".
     (4) WIN IFF TOP: the level completes IFF the figure stands on the top
         platform. NEG CONTROL: standing one row below is NOT a win.
     (5) REPLAY DETERMINISM: same level + scripted track → byte-identical per-tick
         hash sequence, twice, and unchanged across a busy-wait (seed purity).

   COLLISION MODEL (grafted from explorer A — sub-cell box, clearance-before-kill)
   ──────────────────────────────────────────────────────────────────────────────
   The figure has a single absolute lattice X (px) + Y (py, feet). A jump is one
   FIXED arc (vy starts at JUMP_VY, +GRAV per tick). Collision is a sub-cell box
   test, swept along the barrel's path so a fast barrel cannot TUNNEL through the
   figure between ticks. Clearance is evaluated BEFORE the kill: while airborne
   with the feet above the barrel body top you HOP it (score once; that barrel is
   "behind" you and can never hit you again on the same arc). Only a grounded /
   mistimed box overlap kills.

   BOARD MODEL (row-major char grid; row 0 is the TOP)
   ───────────────────────────────────────────────────
     '.' empty air         '=' girder (a standable floor segment)
     'H' ladder (climbable; the figure climbs it, a barrel rolls across it)
     'h' ladder + DROP junction (a barrel reaching this cell tumbles down)
     '#' solid wall edge   'T' thrower (rolls barrels; treated as girder under it)
     'P' figure spawn (treated as girder)
     'W' WIN platform / goal (the top platform; treated as girder + goal)
   Per-row `slopes` give each girder's barrel roll direction (+1 right, -1 left),
   the classic DK zig-zag.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── lattice tunables (FROZEN — renderer + self-test both read these) ────────── */
var FRAC      = 16;     // sub-cell lattice resolution (integer units per cell, each axis)
var RUN_SPEED = 3;      // lattice units the figure walks per tick along a girder
var CLIMB_SPEED = 3;    // lattice units the figure climbs per tick on a ladder
var GRAV      = 1;      // lattice units/tick added to vy each airborne tick
var JUMP_VY   = -11;    // initial upward lattice velocity of a jump (the FIXED arc)
var BARREL_SPEED = 2;   // lattice units a barrel rolls along its girder per tick
var BARREL_FALL  = 3;   // lattice units a barrel falls per tick while dropping at a gap
var HOP_SCORE   = 100;  // points for clearing a barrel with a well-timed jump

/* the figure's lethal body box + the barrel's (shorter) lethal box, in lattice
   units. The figure is a full cell tall (feet at py, head a cell up); the barrel
   is a short roller (~0.6 cell). These define the box collision graft from A. */
var BODY_W   = FRAC;            // figure body width
var BODY_H   = FRAC;            // figure body height (one cell)
var BARREL_W = FRAC;            // barrel width
var BARREL_H = (FRAC * 6) >> 3; // barrel lethal height (~0.6 cell — it's a roller)

/* tile codes (single chars in the level rows) */
var EMPTY='.', GIRDER='=', LADDER='H', DROP='h', SOLID='#',
    THROWER='T', PSPAWN='P', GOAL='W';

/* ── the two hand-authored boards (15 wide × 13 tall; row 0 is the top).
   Classic DK zig-zag: a thrower sits top-left by the goal; girders slant in
   alternating directions; ladders link them; some ladders are 'h' DROP junctions
   where a rolling barrel tumbles to the girder below. Both share one winnable
   spine; level 2 adds more drop junctions so the floors run hotter. ──────────── */
var LEVELS = [
  { // LEVEL 1 — gentle: a clean zig-zag staircase. One DROP per girder so barrels
    //   tumble between rows. The spawn girder is SPARSE (level-1 fairness tuning).
    rows: [
      '.T.............',  //  0  thrower (sits on the goal girder below it)
      '=W==========H==',  //  1  TOP girder + GOAL (x=1); ladder col x=12
      '............H..',  //  2  ladder x=12 connects r3 → r1
      '=h==========H==',  //  3  girder ←; DROP at x=1; ladder col x=12
      '..H...........',  //  4  ladder x=2 connects r5 → r3
      '==H========h===',  //  5  girder →; ladder col x=2; DROP at x=11
      '............H..',  //  6  ladder x=12 connects r7 → r5
      '=h==========H==',  //  7  girder ←; DROP at x=1; ladder col x=12
      '..H...........',  //  8  ladder x=2 connects r9 → r7
      '==H========h===',  //  9  girder →; ladder col x=2; DROP at x=11
      '............H..',  // 10  ladder x=12 connects r11 → r9
      'P===========H==',  // 11  start girder (spawn x=0); ladder col x=12
      '###############'   // 12  floor edge
    ],
    slopes: [0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0]
  },
  { // LEVEL 2 — faster & denser: SAME staircase spine (still winnable) but MORE
    //   drop junctions, so barrels split into more streams. The game also raises
    //   barrelSpeed + spawn rate via the level tune.
    rows: [
      '.T.............',  //  0
      '=W====h=====H==',  //  1  DROP at x=6
      '............H..',  //  2
      '=h====h=====H==',  //  3  DROPs at x=1,6
      '..H...........',  //  4
      '==H===h====h===',  //  5  DROPs at x=6,11
      '............H..',  //  6
      '=h====h=====H==',  //  7  DROPs at x=1,6
      '..H...........',  //  8
      '==H===h====h===',  //  9  DROPs at x=6,11
      '............H..',  // 10
      'P===========H==',  // 11
      '###############'   // 12
    ],
    slopes: [0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0]
  }
];

/* ── parse a board into a grid + spawn / goal / thrower coords. ──────────────── */
function parseLevel(def) {
  var rows = def.rows, H = rows.length, W = rows[0].length;
  var tiles = new Array(W * H);
  var pspawn = null, goal = null, thrower = null;
  for (var y = 0; y < H; y++) {
    for (var x = 0; x < W; x++) {
      var c = rows[y][x] || EMPTY;
      var t = c;
      if (c === PSPAWN) { pspawn = { x: x, y: y }; t = GIRDER; }
      else if (c === GOAL) { goal = { x: x, y: y }; t = GOAL; }
      else if (c === THROWER) { thrower = { x: x, y: y }; t = GIRDER; }
      tiles[y * W + x] = t;
    }
  }
  return { W: W, H: H, tiles: tiles,
           pspawn: pspawn || { x: 0, y: H - 2 },
           goal: goal || { x: 1, y: 0 },
           thrower: thrower || { x: 0, y: 0 },
           slopes: def.slopes };
}

/* ── grid accessors. (cx,cy) are CELL coordinates. ──────────────────────────── */
function inBounds(w, cx, cy) { return cx >= 0 && cx < w.W && cy >= 0 && cy < w.H; }
function tileAt(w, cx, cy) {
  if (!inBounds(w, cx, cy)) return SOLID;
  return w.tiles[cy * w.W + cx];
}
function isGirderTile(t) { return t === GIRDER || t === GOAL; }   // goal stands like a girder
/* a cell the FIGURE can climb. Only a real ladder 'H' is climbable; a DROP 'h'
   is a barrel-only trap — the figure treats it as ordinary girder underfoot. */
function isClimbable(t) { return t === LADDER; }
function isLadder(w, cx, cy) { return isClimbable(tileAt(w, cx, cy)); }
/* a standable floor segment for the figure (girder, goal, ladder, or a DROP). */
function isFigureFloorTile(t) { return isGirderTile(t) || t === LADDER || t === DROP; }
/* a surface a barrel rolls across without falling (girder, goal, ladder, drop). */
function isBarrelSurfaceTile(t) { return isGirderTile(t) || t === LADDER || t === DROP; }

/* Is a figure occupying cell (cx,cy) SUPPORTED (standing, not falling)? Girders
   are thin beams occupying their OWN cell — the figure stands AT the girder's
   cell — so a girder/goal/ladder/drop cell is itself support; or the cell directly
   below is a girder/goal/solid. */
function isFloorBelow(w, cx, cy) {
  if (isFigureFloorTile(tileAt(w, cx, cy))) return true;
  var below = cy + 1;
  if (below >= w.H) return true;
  var t = tileAt(w, cx, below);
  if (isGirderTile(t)) return true;
  if (t === SOLID) return true;
  return false;
}
/* a barrel standing at (cx,cy) is supported if its own cell is a barrel-surface
   or the cell below it is a girder/solid floor. */
function barrelFloorBelow(w, cx, cy) {
  if (isBarrelSurfaceTile(tileAt(w, cx, cy))) return true;
  var below = cy + 1;
  if (below >= w.H) return true;
  var t = tileAt(w, cx, below);
  return isGirderTile(t) || t === SOLID;
}
/* the figure is on the goal (the top platform's destination cell). */
function onGoal(w, p) {
  return tileAt(w, p.cx, p.cy) === GOAL || (p.cx === w.goal.x && p.cy === w.goal.y);
}
/* a cell the figure may occupy (not a wall). */
function passableCell(w, cx, cy) {
  if (!inBounds(w, cx, cy)) return false;
  return tileAt(w, cx, cy) !== SOLID;
}

/* ── build a runnable world from a level index. ─────────────────────────────── */
function makeWorld(levelIdx, opts) {
  opts = opts || {};
  var li = ((levelIdx % LEVELS.length) + LEVELS.length) % LEVELS.length;
  var lvl = parseLevel(LEVELS[li]);
  return {
    level: li, W: lvl.W, H: lvl.H, tiles: lvl.tiles, slopes: lvl.slopes,
    goal: lvl.goal, thrower: lvl.thrower,
    player: mkPlayer(lvl.pspawn.x, lvl.pspawn.y),
    barrels: [], nextBarrelId: 0,
    barrelSpeed: opts.barrelSpeed || BARREL_SPEED,
    spawnEvery: opts.spawnEvery || 96,        // ticks between thrower barrels
    spawnEnabled: opts.spawnEnabled !== false,
    frame: 0, tick: 0,
    won: false, dead: false, over: false,
    score: 0, hops: 0,
    bonus: opts.bonus || 5000
  };
}

/* the figure. Single source of truth for position is absolute lattice px/py
   (feet). cx/cy mirror the cell the feet are in (kept in sync each tick). */
function mkPlayer(cx, cy) {
  return {
    cx: cx, cy: cy,
    px: cx * FRAC,        // absolute lattice X
    py: cy * FRAC,        // absolute lattice Y of the feet
    vy: 0,                // vertical lattice velocity (jump/gravity)
    facing: 1,
    onLadder: false, onGround: true, jumping: false, alive: true
  };
}

/* a barrel: absolute lattice center-bottom (px,py) on a girder row (cy); rolls in
   `dir`; drops at DROP junctions; falls through gaps. id is spawn order (stable
   identity for hashing — nothing random). */
function mkBarrel(id, cx, cy, dir) {
  return {
    id: id, cx: cx, cy: cy,
    px: cx * FRAC, py: cy * FRAC,    // feet on the girder surface row
    dir: dir, falling: false, fallTarget: 0,
    alive: true, hopped: false
  };
}

function blankInput() {
  return { left: false, right: false, up: false, down: false, jump: false };
}

/* ── absolute-lattice → cell helpers. ───────────────────────────────────────── */
function cellOfX(px) { return Math.floor((px + (FRAC >> 1)) / FRAC); }  // nearest column
function cellOfY(py) { return Math.floor((py + (FRAC >> 1)) / FRAC); }  // nearest row
function sign(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
function clampN(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

/* ── the thrower spawns a barrel onto its girder, rolling in that row's slope. ── */
function spawnBarrel(w) {
  var tx = w.thrower.x, ty = w.thrower.y + 1;   // onto the goal girder below the thrower
  var dir = w.slopes[ty] || 1;
  var b = mkBarrel(w.nextBarrelId++, tx, ty, dir);
  w.barrels.push(b);
  return b;
}

/* ── advance one barrel one tick.
     • FALLING: descend BARREL_FALL/tick; on reaching the girder below, land and
       adopt the new row's slope; if it lands on the floor edge, retire.
     • else ROLL along the row's slope at barrelSpeed; on crossing a cell boundary
       decide roll-on / drop / bounce / gap-fall.
   Mutates the barrel; keeps cx/cy + px/py in sync. ─────────────────────────── */
function stepBarrel(w, b) {
  if (!b.alive) return;
  if (b.falling) {
    b.py += w.barrelSpeed > BARREL_FALL ? w.barrelSpeed : BARREL_FALL;
    if (b.py >= b.fallTarget) {
      b.py = b.fallTarget; b.falling = false;
      b.cy = cellOfY(b.py);
      b.px = b.cx * FRAC;
      b.dir = w.slopes[b.cy] || b.dir;          // adopt the new row's slope
      if (b.cy >= w.H - 1) b.alive = false;     // rolled onto the floor edge → retire
    }
    return;
  }
  // rolling along the girder
  b.px += w.barrelSpeed * b.dir;
  var ncx = cellOfX(b.px);
  if (ncx !== b.cx) {
    b.cx = ncx;
    onBarrelEnterCell(w, b);
  }
  if (!b.falling) b.py = b.cy * FRAC;
}
/* a barrel just centered on a new cell: decide roll-on / drop / bounce / gap-fall.
     • SOLID / off-board → bounce (reverse, step back on-board).
     • DROP junction ('h') → tumble down to the next girder below.
     • GIRDER / GOAL / plain LADDER → keep rolling.
     • EMPTY with no floor under it → fall through the gap.
   A plain ladder NEVER drops a barrel (only an 'h' DROP does) — the exact NEG
   CONTROL claim 2 asserts. */
function onBarrelEnterCell(w, b) {
  var t = tileAt(w, b.cx, b.cy);
  if (t === SOLID || !inBounds(w, b.cx, b.cy)) {       // wall edge → bounce
    b.cx -= sign(b.dir); b.px = b.cx * FRAC; b.dir = -b.dir; return;
  }
  if (t === DROP) { beginBarrelFall(w, b); return; }   // junction drop
  if (isBarrelSurfaceTile(t)) return;                  // roll on along the run
  if (!barrelFloorBelow(w, b.cx, b.cy)) beginBarrelFall(w, b);  // gap → fall
}
function beginBarrelFall(w, b) {
  var below = nextBarrelSurfaceBelow(w, b.cx, b.cy);
  if (below < 0) { b.alive = false; return; }
  b.falling = true; b.fallTarget = below * FRAC; b.px = b.cx * FRAC;
}
/* the next girder/floor row strictly below (cy) at column cx, or -1 if none. */
function nextBarrelSurfaceBelow(w, cx, cy) {
  for (var y = cy + 1; y < w.H; y++) {
    var t = tileAt(w, cx, y);
    if (isGirderTile(t) || t === SOLID) return y;
    if (t === DROP) return y;          // can land on a girder-with-drop too
  }
  return w.H - 1;                       // floor edge
}

/* ── figure motion (grafts A's fixed-arc jump + absolute lattice; keeps C's
   ladder grammar + win-on-goal). Pure given the held input. ──────────────────── */
function stepPlayer(w, input) {
  var a = w.player;
  if (!a.alive) return;
  a.cx = cellOfX(a.px);

  // ── airborne: the fixed jump arc OR a fall. Integer kinematics (A's model). ──
  if (!a.onGround) {
    a.vy += GRAV;
    a.py += a.vy;
    // horizontal control persists in the air (drift), bounded to passable cells
    if (input.left && !input.right)  { a.facing = -1; tryDrift(w, a, -RUN_SPEED); }
    if (input.right && !input.left)  { a.facing = 1;  tryDrift(w, a,  RUN_SPEED); }
    // landing: descending and the feet reach/penetrate a floor row.
    if (a.vy >= 0) {
      var fc = cellOfX(a.px);
      var landRow = Math.floor(a.py / FRAC);
      var startRow = a.cy;
      for (var ry = startRow; ry <= landRow + 1 && ry < w.H; ry++) {
        if (ry < 0) continue;
        if ((isFigureFloorTile(tileAt(w, fc, ry)) || tileAt(w, fc, ry) === SOLID) && a.py >= ry * FRAC) {
          a.cy = ry; a.py = ry * FRAC; a.vy = 0;
          a.onGround = true; a.jumping = false; a.onLadder = false;
          a.px = a.cx * FRAC;       // snap x to the cell so motion stays on lattice
          break;
        }
      }
    }
    a.cx = cellOfX(a.px);
    return;
  }

  // ── grounded. WIN check first (the goal is self-supporting). ──
  a.cy = clampN(a.cy, 0, w.H - 1);
  a.px = a.cx * FRAC;               // grounded motion is cell-quantized horizontally
  if (onGoal(w, a)) { w.won = true; w.over = true; return; }

  a.onLadder = isLadder(w, a.cx, a.cy);

  // gravity: if not on a ladder and no floor below, start falling.
  if (!a.onLadder && !isFloorBelow(w, a.cx, a.cy)) {
    a.onGround = false; a.vy = 0; return;
  }

  // JUMP — a discrete fixed-arc impulse, only from a grounded girder (not a ladder).
  if (input.jump && !a.onLadder && isFloorBelow(w, a.cx, a.cy)) {
    a.vy = JUMP_VY; a.onGround = false; a.jumping = true; a.onLadder = false;
    return;
  }

  // climb a ladder (up / down)
  if (input.up && (isLadder(w, a.cx, a.cy - 1) || isLadder(w, a.cx, a.cy))) {
    if (passableCell(w, a.cx, a.cy - 1) && a.cy - 1 >= 0) {
      a.cy -= 1; a.py = a.cy * FRAC; a.onLadder = true; return;
    }
  }
  if (input.down && isLadder(w, a.cx, a.cy + 1)) {
    if (a.cy + 1 < w.H) { a.cy += 1; a.py = a.cy * FRAC; a.onLadder = true; return; }
  }

  // run horizontally along the girder
  if (input.left && !input.right) {
    a.facing = -1;
    if (canStep(w, a.cx - 1, a.cy)) { a.cx -= 1; a.px = a.cx * FRAC; }
  } else if (input.right && !input.left) {
    a.facing = 1;
    if (canStep(w, a.cx + 1, a.cy)) { a.cx += 1; a.px = a.cx * FRAC; }
  }
  // after walking, re-check support: if the new cell hangs over a gap, fall.
  if (!isLadder(w, a.cx, a.cy) && !isFloorBelow(w, a.cx, a.cy)) {
    a.onGround = false; a.vy = 0;
  } else {
    a.py = a.cy * FRAC;
  }
}
/* a horizontal step is legal if the target is passable AND standable (floor below
   or a ladder, or open air over a gap — gravity then pulls you down). */
function canStep(w, cx, cy) {
  if (!passableCell(w, cx, cy)) return false;
  return true;   // gravity resolves a step into open air the following resolution
}
/* mid-air horizontal drift, bounded so you never drift INTO a wall. */
function tryDrift(w, a, dx) {
  var nx = a.px + dx;
  var nc = cellOfX(nx);
  if (passableCell(w, nc, a.cy) || nc === a.cx) {
    a.px = nx;
    if (a.px < 0) a.px = 0;
    var maxX = (w.W - 1) * FRAC;
    if (a.px > maxX) a.px = maxX;
  }
}

/* ── COLLISION (grafted from A — sub-cell box, SWEPT, clearance-before-kill).
   For each live barrel we test the figure's body box against the barrel's body
   box SWEPT from its pre-step position to its post-step position, so a fast
   barrel cannot tunnel through the figure between ticks. Clearance is evaluated
   FIRST: while airborne with the feet above the barrel body top it is a HOP
   (score once; mark hopped so it can't re-score or re-kill on the same arc).
   Only a non-clearing box overlap kills. ──────────────────────────────────── */
function figureBox(px, py) {
  return { x0: px - (BODY_W >> 1), x1: px + (BODY_W >> 1), y0: py - BODY_H, y1: py };
}
function barrelBox(px, py) {
  return { x0: px - (BARREL_W >> 1), x1: px + (BARREL_W >> 1), y0: py - BARREL_H, y1: py };
}
function boxesOverlap(A, B) { return A.x0 < B.x1 && A.x1 > B.x0 && A.y0 < B.y1 && A.y1 > B.y0; }

/* horizontal-overlap test of two boxes (x ranges only) — used for the HOP, which
   fires when the barrel passes UNDER the airborne figure even if the body has
   cleared the barrel entirely (no vertical box overlap on a clean high jump). */
function boxesOverlapX(A, B) { return A.x0 < B.x1 && A.x1 > B.x0; }

function resolveCollisions(w) {
  var a = w.player; if (!a.alive) return;
  var fb = figureBox(a.px, a.py);
  for (var i = 0; i < w.barrels.length; i++) {
    var b = w.barrels[i];
    if (!b.alive || b.hopped) continue;
    // SWEEP: sample the barrel box along its movement this tick so a fast roller
    // can't skip over (tunnel through) the figure between ticks. Step in
    // half-body-width increments along the barrel's pre→post path.
    var sx = b.prevPx === undefined ? b.px : b.prevPx;
    var sy = b.prevPy === undefined ? b.py : b.prevPy;
    var dx = b.px - sx, dy = b.py - sy;
    var dist = Math.abs(dx) + Math.abs(dy);
    var steps = Math.max(1, Math.ceil(dist / (BARREL_W >> 1)));
    var hitThis = false, clearedThis = false;
    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var bpx = Math.round(sx + dx * t), bpy = Math.round(sy + dy * t);
      var bb = barrelBox(bpx, bpy);
      // HOP: the barrel is horizontally under the figure AND the figure is
      // airborne with its feet at/above the barrel body top → a clean clearance.
      // (Evaluated BEFORE the kill so a well-timed jump is always safe; this
      // catches a high arc that never vertically overlaps the barrel box.)
      if (boxesOverlapX(fb, bb) && !a.onGround && a.py <= bb.y0) { clearedThis = true; continue; }
      // KILL: a full box overlap that is NOT a clearance (grounded, or a jump too
      // low / too late so the body still intersects the barrel).
      if (boxesOverlap(fb, bb)) { hitThis = true; break; }
    }
    if (hitThis) { killPlayer(w); return; }
    if (clearedThis) { b.hopped = true; w.score += HOP_SCORE; w.hops++; }
  }
}
function killPlayer(w) {
  if (!w.player.alive) return;
  w.player.alive = false; w.dead = true; w.over = true;
}

/* ── ONE fixed tick. Mutates `w` in place. Pure given (w, input). ───────────── */
function stepTick(w, input) {
  if (w.over) return;
  w.frame++; w.tick++;
  if (w.spawnEnabled && w.tick % w.spawnEvery === 0) spawnBarrel(w);
  if (w.tick % 12 === 0 && w.bonus > 0) w.bonus -= 100;   // soft bonus countdown
  stepPlayer(w, input);
  if (w.over) return;
  // record each barrel's pre-step position so the sweep has a start point.
  for (var i = 0; i < w.barrels.length; i++) { var b = w.barrels[i]; b.prevPx = b.px; b.prevPy = b.py; }
  for (var j = 0; j < w.barrels.length; j++) stepBarrel(w, w.barrels[j]);
  resolveCollisions(w);
  if (w.over) return;
  // retire dead barrels.
  var live = [];
  for (var k = 0; k < w.barrels.length; k++) if (w.barrels[k].alive) live.push(w.barrels[k]);
  w.barrels = live;
  // win re-check (in case a jump landed on the goal).
  if (w.player.alive && w.player.onGround && onGoal(w, w.player)) { w.won = true; w.over = true; }
}

/* ── 32-bit FNV-ish hash of the salient world state (replay determinism). ────── */
function hashWorld(w) {
  var h = 0x811c9dc5 >>> 0;
  function mix(v) { v = (v | 0); h ^= v; h = Math.imul(h, 0x01000193) >>> 0; }
  var p = w.player;
  mix(p.px); mix(p.py); mix(p.cx); mix(p.cy); mix(Math.round(p.vy));
  mix(p.onGround ? 1 : 0); mix(p.jumping ? 1 : 0); mix(p.facing); mix(p.alive ? 1 : 0);
  mix(w.score); mix(w.hops); mix(w.won ? 1 : 0); mix(w.dead ? 1 : 0); mix(w.frame); mix(w.bonus);
  for (var i = 0; i < w.barrels.length; i++) {
    var b = w.barrels[i];
    mix(b.id); mix(b.px); mix(b.py); mix(b.cx); mix(b.cy);
    mix(b.dir); mix(b.falling ? 1 : 0); mix(b.hopped ? 1 : 0);
  }
  return h >>> 0;
}

/* ── replay a scripted track → per-tick hashes + final world. ───────────────── */
function replay(levelIdx, track, ticks, opts) {
  var w = makeWorld(levelIdx, opts);
  var input = blankInput();
  var edits = {};
  for (var i = 0; i < track.length; i++) edits[track[i].at] = track[i].set;
  var hashes = [];
  for (var k = 0; k < ticks; k++) {
    if (edits[k]) { var set = edits[k]; for (var key in set) input[key] = set[key]; }
    stepTick(w, input);
    if (input.jump) input.jump = false;   // jump is a one-shot pulse
    hashes.push(hashWorld(w));
  }
  return { hashes: hashes, world: w };
}

/* ── WINNABILITY proof: BFS the figure's move graph from spawn to the goal,
   driving the live sim along the path and asserting it actually WINS. From a
   centered grounded cell the figure may step left/right along a girder, climb up
   into a ladder, or descend into a ladder. ──────────────────────────────────── */
function climbNeighbors(w, cx, cy) {
  var out = [];
  var groundedHere = isFloorBelow(w, cx, cy) || isLadder(w, cx, cy);
  if (groundedHere) {
    if (passableCell(w, cx - 1, cy) && (isFloorBelow(w, cx - 1, cy) || isLadder(w, cx - 1, cy)))
      out.push({ x: cx - 1, y: cy });
    if (passableCell(w, cx + 1, cy) && (isFloorBelow(w, cx + 1, cy) || isLadder(w, cx + 1, cy)))
      out.push({ x: cx + 1, y: cy });
  }
  if ((isLadder(w, cx, cy) || isLadder(w, cx, cy - 1)) && passableCell(w, cx, cy - 1) && cy - 1 >= 0)
    out.push({ x: cx, y: cy - 1 });
  if (cy + 1 < w.H && isLadder(w, cx, cy + 1) && passableCell(w, cx, cy + 1))
    out.push({ x: cx, y: cy + 1 });
  return out;
}
function climbBfsStep(w, sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return null;
  var W = w.W, H = w.H, N = W * H;
  var seen = new Uint8Array(N), prev = new Int32Array(N); prev.fill(-1);
  var q = [sy * W + sx]; seen[sy * W + sx] = 1; var found = -1;
  while (q.length) {
    var cur = q.shift(), cy = Math.floor(cur / W), cx = cur - cy * W;
    if (cx === tx && cy === ty) { found = cur; break; }
    var ns = climbNeighbors(w, cx, cy);
    for (var i = 0; i < ns.length; i++) {
      var ni = ns[i].y * W + ns[i].x;
      if (!seen[ni]) { seen[ni] = 1; prev[ni] = cur; q.push(ni); }
    }
  }
  if (found < 0) return null;
  var node = found;
  while (prev[node] !== -1 && prev[node] !== (sy * W + sx)) node = prev[node];
  var ny = Math.floor(node / W), nx = node - ny * W;
  return { x: nx, y: ny };
}
function winSolve(w, input, budget) {
  var ticks = 0, stuck = 0, lastKey = -1;
  while (!w.over && ticks < budget) {
    var p = w.player;
    setInput(input, false);
    if (p.onGround) {
      var step = climbBfsStep(w, p.cx, p.cy, w.goal.x, w.goal.y);
      if (step) {
        if (step.y < p.cy) input.up = true;
        else if (step.y > p.cy) input.down = true;
        else if (step.x < p.cx) input.left = true;
        else if (step.x > p.cx) input.right = true;
      } else break;   // no path — the claim fails honestly
    }
    stepTick(w, input);
    if (input.jump) input.jump = false;
    ticks++;
    var key = p.cy * w.W + p.cx;
    if (key === lastKey) { if (++stuck > 400) break; } else { stuck = 0; lastKey = key; }
  }
  return { won: w.won, ticks: ticks, cell: [w.player.cx, w.player.cy] };
}
function setInput(input, v) { input.left = input.right = input.up = input.down = input.jump = v; }

/* ═══════════════════════════════ self-test ════════════════════════════════ */
function runSelfTest() {
  var results = [], allPass = true;
  function check(name, cond, detail) {
    var pass = !!cond; if (!pass) allPass = false;
    results.push({ name: name, pass: pass, detail: detail || '' });
  }

  // ── CLAIM 1: WINNABLE by a scripted-input track (barrels silenced to isolate
  //    reachability — the path EXISTS and the solver drives the figure to win). ──
  {
    var w = makeWorld(0, { spawnEnabled: false });
    var input = blankInput();
    var got = winSolve(w, input, 6000);
    check('WINNABLE: hand-authored board — scripted run climbs the ladders to the top platform',
          got.won, 'won=' + got.won + ' end=' + got.cell + ' ticks=' + got.ticks);
  }

  // ── CLAIM 2: barrel FOLLOWS the ramp & DROPS only at a junction-gap.
  //    NEG CONTROL: a barrel on a no-gap girder never drops. ────────────────────
  {
    // 2a POSITIVE: row 5 slopes +1 with a DROP 'h' at x=11. Start a barrel left of
    //    it; confirm it rolls first, then transitions to falling AT the DROP cell.
    var wa = makeWorld(0, { spawnEnabled: false });
    var ba = mkBarrel(0, 3, 5, 1); wa.barrels = [ba];
    var rolledFirst = false, droppedAtJunction = false, dropX = -1;
    for (var k = 0; k < 600 && ba.alive; k++) {
      var preFalling = ba.falling;
      ba.prevPx = ba.px; ba.prevPy = ba.py;
      stepBarrel(wa, ba);
      if (!preFalling && !ba.falling && ba.cy === 5) rolledFirst = true;
      if (!preFalling && ba.falling) { droppedAtJunction = true; dropX = ba.cx; break; }
    }
    var droppedAtDrop = droppedAtJunction && tileAt(wa, dropX, 5) === DROP;

    // 2b NEG CONTROL: a clean girder row (every 'h' replaced by '='), walled both
    //    ends — the barrel rolls/bounces forever but NEVER falls.
    var wb = makeWorld(0, { spawnEnabled: false });
    for (var x = 0; x < wb.W; x++) {
      var idx = 9 * wb.W + x;
      if (wb.tiles[idx] === DROP) wb.tiles[idx] = GIRDER;
    }
    var bb = mkBarrel(0, 6, 9, 1); wb.barrels = [bb];
    var neverDropped = true;
    for (var k2 = 0; k2 < 800; k2++) {
      bb.prevPx = bb.px; bb.prevPy = bb.py;
      stepBarrel(wb, bb);
      if (bb.falling) { neverDropped = false; break; }
    }

    check('BARREL FOLLOWS RAMP: rolls then DROPS only at a junction (NEG CONTROL: a no-gap girder never drops)',
          rolledFirst && droppedAtDrop && neverDropped,
          'rolled=' + rolledFirst + ' droppedAt(' + dropX + ',5)=' + droppedAtDrop + ' negNeverDropped=' + neverDropped);
  }

  // ── CLAIM 3: JUMP-CLEARANCE with a DOUBLE negative control. A WELL-TIMED jump
  //    clears a barrel; NEG-A never-jump collides; NEG-B a TOO-LATE jump collides.
  //    Together: a jump saves you IFF it is well-timed. ──────────────────────────
  {
    // a reusable scenario: figure grounded at (8,11); a barrel rolling toward it.
    function scenario() {
      var ww = makeWorld(0, { spawnEnabled: false });
      var p = ww.player; p.cx = 8; p.cy = 11; p.px = 8 * FRAC; p.py = 11 * FRAC;
      p.onGround = true; p.alive = true; p.vy = 0;
      var bk = mkBarrel(0, 4, 11, 1); ww.barrels = [bk];   // 4 cells left, rolling right
      return ww;
    }
    // 3a POSITIVE: jump when the barrel is ~2 cells away (the timing window).
    var wc = scenario();
    var input3 = blankInput();
    var hopped = false, posDied = false;
    for (var k3 = 0; k3 < 120 && !wc.over; k3++) {
      var dist = Math.abs(wc.player.px - (wc.barrels[0] ? wc.barrels[0].px : 1e9));
      input3.jump = (wc.player.onGround && dist <= 2 * FRAC && dist > FRAC);
      stepTick(wc, input3);
      if (input3.jump) input3.jump = false;
      if (wc.hops > 0) hopped = true;
    }
    posDied = wc.dead;
    var posCleared = hopped && !posDied;

    // 3b NEG-A: never jump → the grounded overlap collides.
    var wd = scenario();
    var negA = false;
    for (var k4 = 0; k4 < 120 && !wd.over; k4++) stepTick(wd, blankInput());
    negA = wd.dead;

    // 3c NEG-B: a TOO-LATE jump — fire jump only once the barrel is already AT the
    //    figure (dist <= barrel width). The impulse can't lift the body in time, so
    //    the overlap still kills. This is the half that proves IFF (not "any jump").
    var we = scenario();
    var input3b = blankInput();
    var negB = false;
    for (var k5 = 0; k5 < 120 && !we.over; k5++) {
      var dB = Math.abs(we.player.px - (we.barrels[0] ? we.barrels[0].px : 1e9));
      input3b.jump = (we.player.onGround && dB <= (BARREL_W >> 1));
      stepTick(we, input3b);
      if (input3b.jump) input3b.jump = false;
    }
    negB = we.dead;

    check('JUMP-CLEARANCE (IFF): a well-timed jump clears (POS); NEG-A never-jump collides; NEG-B a too-late jump collides',
          posCleared && negA && negB,
          'posCleared=' + posCleared + ' negA(never)=' + negA + ' negB(tooLate)=' + negB);
  }

  // ── CLAIM 4: WIN IFF the figure stands on the top platform. NEG: one row below. ──
  {
    var wf = makeWorld(0, { spawnEnabled: false });
    // NEG CONTROL: one row below the goal, on the goal girder → not a win.
    wf.player.cx = wf.goal.x; wf.player.cy = wf.goal.y + 1;
    wf.player.px = wf.goal.x * FRAC; wf.player.py = (wf.goal.y + 1) * FRAC;
    wf.player.onGround = true; wf.player.jumping = false;
    stepTick(wf, blankInput());
    var noWinBelow = !wf.won;
    // POSITIVE: ON the goal cell → next tick wins.
    var wg = makeWorld(0, { spawnEnabled: false });
    wg.player.cx = wg.goal.x; wg.player.cy = wg.goal.y;
    wg.player.px = wg.goal.x * FRAC; wg.player.py = wg.goal.y * FRAC;
    wg.player.onGround = true;
    stepTick(wg, blankInput());
    var winOnTop = wg.won;
    check('WIN IFF TOP: standing on the top platform wins; NEG CONTROL: one row below is NOT a win',
          winOnTop && noWinBelow, 'winOnTop=' + winOnTop + ' noWinOneBelow=' + noWinBelow);
  }

  // ── CLAIM 5: REPLAY DETERMINISM — identical per-tick hashes twice + unchanged
  //    across a busy-wait (no wall-clock in the step path). ─────────────────────
  {
    var track = [
      { at: 0,   set: { right: true } },
      { at: 24,  set: { right: false, up: true } },
      { at: 70,  set: { up: false, jump: true } },
      { at: 90,  set: { left: true } },
      { at: 150, set: { left: false, up: true } }
    ];
    var ra = replay(0, track, 700);
    var rb = replay(0, track, 700);
    var same = ra.hashes.length === rb.hashes.length, firstDiff = -1;
    for (var i = 0; same && i < ra.hashes.length; i++)
      if (ra.hashes[i] !== rb.hashes[i]) { same = false; firstDiff = i; }
    var spin = Date.now(); while (Date.now() - spin < 20) { /* burn wall-clock */ }
    var rc = replay(0, track, 700);
    var sameAfterWait = rc.hashes[rc.hashes.length - 1] === ra.hashes[ra.hashes.length - 1];
    check('REPLAY DETERMINISM: identical per-tick hash twice + unchanged across a busy-wait (seed purity)',
          same && sameAfterWait,
          same ? ('final 0x' + ra.hashes[ra.hashes.length - 1].toString(16) + ' waitOk=' + sameAfterWait)
               : ('diverged at tick ' + firstDiff));
  }

  return { allPass: allPass, results: results };
}

/* ── dual-use module guard (forge strips exactly this braced block) ─────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRAC: FRAC, RUN_SPEED: RUN_SPEED, CLIMB_SPEED: CLIMB_SPEED, GRAV: GRAV,
    JUMP_VY: JUMP_VY, BARREL_SPEED: BARREL_SPEED, BARREL_FALL: BARREL_FALL,
    HOP_SCORE: HOP_SCORE, BODY_W: BODY_W, BODY_H: BODY_H, BARREL_W: BARREL_W, BARREL_H: BARREL_H,
    EMPTY: EMPTY, GIRDER: GIRDER, LADDER: LADDER, DROP: DROP, SOLID: SOLID,
    THROWER: THROWER, PSPAWN: PSPAWN, GOAL: GOAL, LEVELS: LEVELS,
    parseLevel: parseLevel, tileAt: tileAt, isLadder: isLadder, isFloorBelow: isFloorBelow,
    onGoal: onGoal, passableCell: passableCell, cellOfX: cellOfX, cellOfY: cellOfY,
    makeWorld: makeWorld, mkPlayer: mkPlayer, mkBarrel: mkBarrel, blankInput: blankInput,
    spawnBarrel: spawnBarrel, stepBarrel: stepBarrel, stepPlayer: stepPlayer, stepTick: stepTick,
    resolveCollisions: resolveCollisions, hashWorld: hashWorld, replay: replay,
    winSolve: winSolve, runSelfTest: runSelfTest
  };
}
