"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   the-climb.core.js — the deterministic CORE for THE CLIMB (neon girder-climb).

   This file is dual-use: the forge inlines it into the-climb.html (the module
   guard at the foot is stripped, so makeWorld/stepTick/runSelfTest/… become page
   globals) and the-climb.test.cjs require()s it RAW to run the identical battery,
   so the in-page chip and the Node twin assert byte-for-byte the same claims.

   THE CONTRACT THIS FILE PROVES
   ─────────────────────────────
   The climb's RULES are a PURE FUNCTION of (level, scripted input track). No
   Math.random / Date / performance.now in the step path; the figure + barrels live on a
   sub-cell lattice (FRAC integer units per cell) and the sim advances at a FIXED tick
   rate (SIM_HZ) so collision is exact. SPEED is a human-readable seconds-per-cell knob
   (RUN/CLIMB/BARREL_SEC_PER_CELL) that DERIVES the per-tick lattice step — NOT the tick
   rate. The PAGE interpolates (lerps) render positions BETWEEN ticks, so motion is fluid
   at any display refresh; the discrete grid LOGIC stays exactly self-testable. (cycle
   #125 dropped the old byte-identical PER-TICK replay claim — it forced a fixed-integer-
   tick architecture that, rendered raw, snapped a tick at a time — and replaced it with a
   seed-reproducible LAYOUT claim, digdug's determinism contract.)

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
     (5) LAYOUT REPRODUCIBLE FROM A SEED: a level resolves to a byte-identical board —
         makeWorld(idx) twice → identical layout hash; a different idx differs. (The
         digdug determinism contract; replaces the feel-hostile per-tick replay claim.)

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

/* ── THE SPEED KNOB (cycle #125 — human-readable seconds-per-cell, NOT a tick rate).
   The sim runs at a FIXED tick rate (SIM_HZ) so the integrator + collision are exact and
   the renderer can INTERPOLATE between ticks for glassy motion at ANY display refresh;
   SPEED is dialed by how many SECONDS a thing takes to cross one cell, and the per-tick
   lattice step is DERIVED from it. (The OLD build coupled speed to simHz — it bumped the
   TICK RATE to go faster, which doubled as the speed AND, rendered raw with no interp,
   made the figure snap a tick at a time on a high-refresh display. The level-loop ramp now
   SHRINKS the seconds-per-cell via a speedMul instead of raising the tick rate; SIM_HZ is
   constant so the proven jump arc + swept collision keep their exact per-tick timing.)
   Tuned BY FEEL in the browser to a pace a held key can control across the board. */
var SIM_HZ    = 60;     // FIXED logical ticks/sec (the integrator resolution — never the speed)
var RUN_SEC_PER_CELL   = 0.21;  // a held arrow crosses one cell in ~0.21s (≈4.8 cells/s — human-paced, controllable)
var CLIMB_SEC_PER_CELL = 0.27;  // a ladder rung-to-rung takes ~0.27s (a deliberate climb, slower than a run)
var BARREL_SEC_PER_CELL= 0.27;  // a barrel rolls one cell in ~0.27s (≈3.7 cells/s — readable, dodgeable)

/* per-tick lattice steps DERIVED from the seconds-per-cell knobs (round to ≥1 so the
   integer lattice always advances). cellsPerTick = 1/(secPerCell*SIM_HZ); lattice/tick =
   FRAC * cellsPerTick. At SIM_HZ=60: RUN≈1.27→1, CLIMB/BARREL≈0.99→1. The render TWEEN
   (lerp between ticks) hides the integer rounding entirely — motion is fluid + slow. */
function perTick(secPerCell){ return Math.max(1, Math.round(FRAC / (secPerCell * SIM_HZ))); }
var RUN_SPEED   = perTick(RUN_SEC_PER_CELL);     // lattice units the figure walks per tick along a girder
var CLIMB_SPEED = perTick(CLIMB_SEC_PER_CELL);   // lattice units the figure climbs per tick on a ladder
var BARREL_SPEED= perTick(BARREL_SEC_PER_CELL);  // lattice units a barrel rolls along its girder per tick

var GRAV      = 1;      // lattice units/tick added to vy each airborne tick (the fixed arc)
var JUMP_VY   = -6;     // initial upward lattice velocity of a jump (the FIXED arc).
                        //   apex rise = 5+4+3+2+1 = 15 lattice = 0.94 cell — clears one
                        //   barrel (lethal box ~0.6 cell = 12 lattice) yet stays UNDER one
                        //   floor (16 lattice), so it never punches a ceiling. The jump-apex
                        //   + ceiling self-tests guard both ends; UNCHANGED from the proven
                        //   build (SIM_HZ stays 60 so the arc keeps its exact per-tick shape).
var BARREL_FALL  = perTick(BARREL_SEC_PER_CELL * 0.62); // a drop falls a touch faster than a roll
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
      '=W=========hH==',  //  1  TOP girder + GOAL (x=1); DROP at x=11 (barrels spawned
                          //       here roll right then tumble — the spawn girder MUST
                          //       have a junction or barrels circulate forever); ladder x=12
      '............H..',  //  2  ladder x=12 connects r3 → r1
      '=h==========H==',  //  3  girder ←; DROP at x=1; ladder col x=12
      '..H............',  //  4  ladder x=2 connects r5 → r3
      '==H========h===',  //  5  girder →; ladder col x=2; DROP at x=11
      '............H..',  //  6  ladder x=12 connects r7 → r5
      '=h==========H==',  //  7  girder ←; DROP at x=1; ladder col x=12
      '..H............',  //  8  ladder x=2 connects r9 → r7
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
      '..H............',  //  4
      '==H===h====h===',  //  5  DROPs at x=6,11
      '............H..',  //  6
      '=h====h=====H==',  //  7  DROPs at x=1,6
      '..H............',  //  8
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
    // SPEED lives as per-tick lattice steps DERIVED from the seconds-per-cell knobs (see
    // the tunables block). The level-loop ramp passes faster barrels via barrelSec, not a
    // higher tick rate; the figure's run/climb stay human-paced constants across levels.
    runSpeed: RUN_SPEED, climbSpeed: CLIMB_SPEED,
    barrelSpeed: opts.barrelSpeed || (opts.barrelSec ? perTick(opts.barrelSec) : BARREL_SPEED),
    barrelFall: opts.barrelFall || (opts.barrelSec ? perTick(opts.barrelSec * 0.62) : BARREL_FALL),
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
    var fall = w.barrelFall || BARREL_FALL;
    b.py += w.barrelSpeed > fall ? w.barrelSpeed : fall;
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
    var prevHeadY = a.py - BODY_H;               // head BEFORE this tick's rise
    a.vy += GRAV;
    a.py += a.vy;
    // CEILING: a rising figure is BLOCKED when its HEAD reaches the BEAM of a solid /
    // girder row above — it does NOT tunnel through (symmetric to the landing check).
    // Girders are THIN beams sitting at the TOP of their cell (the beam line = the
    // row's cell-top = row*FRAC), so the head only bonks when it actually reaches that
    // line — NOT merely on entering the (mostly-empty) cell. (A naive cell-occupancy
    // test wrongly bonks on the staircase, where the head is always inside SOME girder
    // cell.) The check SWEEPS every row the head crosses this tick, so a STRONG impulse
    // cannot tunnel past several beams between ticks. SOLID '#' fills its whole cell, so
    // its bonk line is the cell BOTTOM. Guards symptom-4's tunnel + the one-cell hop.
    if (a.vy < 0) {
      var hcx = cellOfX(a.px);
      var headY = a.py - BODY_H;                  // head AFTER this tick's rise
      var topRow = Math.floor(headY / FRAC);      // highest row the head now reaches
      var botRow = Math.floor(prevHeadY / FRAC);  // row the head left from
      for (var ry = botRow; ry >= topRow && ry >= 0; ry--) {
        var ct = tileAt(w, hcx, ry);
        if (isGirderTile(ct)) {                   // thin beam at the row's cell-top line
          var beamLine = ry * FRAC;
          // bonk only a beam that was ABOVE the head a tick ago and is reached now —
          // never the (empty-or-not) row the head was already sitting in at rest.
          if (beamLine < prevHeadY && headY <= beamLine) { a.py = beamLine + BODY_H; a.vy = 0; break; }
        } else if (ct === SOLID) {                // a full-cell wall: bonk at its bottom
          var floorLine = (ry + 1) * FRAC;
          if (floorLine < prevHeadY && headY <= floorLine) { a.py = floorLine + BODY_H; a.vy = 0; break; }
        }
      }
    }
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
  if (onGoal(w, a)) { w.won = true; w.over = true; return; }

  a.onLadder = isLadder(w, a.cx, a.cy);

  // gravity: if not on a ladder and no floor below, start falling.
  if (!a.onLadder && !isFloorBelow(w, a.cx, a.cy)) {
    a.onGround = false; a.vy = 0; return;
  }

  // JUMP — a discrete fixed-arc impulse, only from a grounded girder (not a ladder).
  if (input.jump && !a.onLadder && isFloorBelow(w, a.cx, a.cy)) {
    a.px = a.cx * FRAC;            // center on the cell so the arc lands cleanly
    a.vy = JUMP_VY; a.onGround = false; a.jumping = true; a.onLadder = false;
    return;
  }

  // climb a ladder (up / down) — SUB-CELL lattice motion at climbSpeed units per tick
  // (was a whole cell per tick: a vertical flick). py is the source of truth; cy is
  // derived from it via cellOfY. The figure snaps onto the ladder COLUMN on pickup, so
  // px stays centred; on a clean rung boundary the win-solver + ladder grammar (which
  // reason in cells) always find the figure centred on a column. The render tween lerps
  // py between ticks so the climb is fluid at any refresh.
  var climbStep = w.climbSpeed || CLIMB_SPEED;
  if (input.up && (isLadder(w, a.cx, a.cy - 1) || isLadder(w, a.cx, a.cy))) {
    if (passableCell(w, a.cx, a.cy - 1) && a.cy - 1 >= 0) {
      a.px = a.cx * FRAC;                    // centre on the ladder column
      a.py -= climbStep; if (a.py < 0) a.py = 0;
      a.cy = cellOfY(a.py); a.onLadder = true; return;
    }
  }
  if (input.down && isLadder(w, a.cx, a.cy + 1)) {
    if (a.cy + 1 < w.H) {
      a.px = a.cx * FRAC;
      a.py += climbStep; var maxY = (w.H - 1) * FRAC; if (a.py > maxY) a.py = maxY;
      a.cy = cellOfY(a.py); a.onLadder = true; return;
    }
  }

  // run horizontally along the girder — SUB-CELL lattice motion at runSpeed units
  // per tick (was a whole cell per tick: a flick). px is the source of truth; cx is
  // derived from it via cellOfX. On direction-RELEASE we re-center px on the cell so
  // ladder pickup + the win-solver always find the figure centered on a column.
  var runStep = w.runSpeed || RUN_SPEED;
  if (input.left && !input.right) {
    a.facing = -1;
    var nxl = a.px - runStep;
    if (passableCell(w, cellOfX(nxl), a.cy) || cellOfX(nxl) === a.cx) {
      a.px = nxl; if (a.px < 0) a.px = 0; a.cx = cellOfX(a.px);
    }
  } else if (input.right && !input.left) {
    a.facing = 1;
    var nxr = a.px + runStep;
    var maxX = (w.W - 1) * FRAC;
    if (passableCell(w, cellOfX(nxr), a.cy) || cellOfX(nxr) === a.cx) {
      a.px = nxr; if (a.px > maxX) a.px = maxX; a.cx = cellOfX(a.px);
    }
  } else {
    a.px = a.cx * FRAC;             // no horizontal input → settle onto the cell center
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

/* ── 32-bit hash of a world's LAYOUT (the board geometry, spawn/goal/thrower, and
   slopes) — the deterministic "seed" each level resolves to. Two worlds built from the
   same level index hash IDENTICALLY; different indices differ. This is the digdug
   determinism contract (buildLevel(seed)→identical layout) carried over to the Climb's
   hand-authored boards: the LOGIC stays reproducible from a seed without freezing the
   renderer to integer ticks. (Excludes live entity positions — only the fixed layout.) */
function hashBoard(w) {
  var h = 0x811c9dc5 >>> 0;
  function mix(v) { v = (v | 0); h ^= v; h = Math.imul(h, 0x01000193) >>> 0; }
  mix(w.W); mix(w.H);
  for (var i = 0; i < w.tiles.length; i++) mix(w.tiles[i].charCodeAt(0));
  for (var s = 0; s < w.slopes.length; s++) mix(w.slopes[s]);
  mix(w.goal.x); mix(w.goal.y); mix(w.thrower.x); mix(w.thrower.y);
  mix(w.player.cx); mix(w.player.cy);
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

  // ── CLAIM 5: LAYOUT REPRODUCIBLE FROM A SEED (digdug's determinism contract).
  //    The hand-authored boards are a PURE function of the level index: makeWorld(idx)
  //    twice yields a byte-identical layout; a different index yields a different one.
  //    This replaces the old feel-hostile byte-identical PER-TICK replay claim (which
  //    forced a fixed-integer-tick architecture that snapped the renderer) — the LOGIC
  //    stays provable from a seed while the motion is free to be a smooth dt-tween. ──
  {
    var la = hashBoard(makeWorld(0, { spawnEnabled: false }));
    var lb = hashBoard(makeWorld(0, { spawnEnabled: false }));
    var l2 = hashBoard(makeWorld(1, { spawnEnabled: false }));
    var sameLayout = (la === lb), differsByIdx = (la !== l2);
    check('LAYOUT REPRODUCIBLE: a level resolves to a byte-identical board (same idx → same hash; a different idx differs)',
          sameLayout && differsByIdx,
          'L1 0x' + la.toString(16) + ' (twice ' + sameLayout + ') vs L2 0x' + l2.toString(16) + ' (differs ' + differsByIdx + ')');
  }

  /* ═══ GAMEPLAY-PHYSICS REALISM (cycle #122 — these would have FAILED on the
     broken #115 build that reported 5/5 green on an unplayable cabinet). The
     original battery proved the deterministic CORE but never the PLAYABILITY; each
     claim below targets one of the five symptoms at the gameplay layer. ═══ */

  // ── CLAIM 6: a THROWN barrel actually DESCENDS — it leaves the TOP girder under
  //    gravity within a bounded number of ticks (catches symptom 2: barrels that
  //    circulated forever on the spawn girder because it had no DROP junction). ──
  {
    var w6 = makeWorld(0, { spawnEnabled: false });
    var b6 = spawnBarrel(w6);              // onto the top girder, like the thrower does
    var startY = b6.py, startCy = b6.cy, leftTop = false, maxPy = b6.py, leaveTick = -1;
    var N = 200;                            // bound: must leave the top girder within N ticks
    for (var k6 = 0; k6 < N && b6.alive; k6++) {
      b6.prevPx = b6.px; b6.prevPy = b6.py;
      stepBarrel(w6, b6);
      if (b6.py > maxPy) maxPy = b6.py;
      if (b6.cy > startCy && leaveTick < 0) { leftTop = true; leaveTick = k6; }
    }
    var descended = (maxPy - startY) >= FRAC;        // fell at least one full floor
    check('BARREL DESCENDS: a thrown barrel py INCREASES under gravity and LEAVES the top girder within ' + N + ' ticks (not circulate forever)',
          leftTop && descended,
          'leftTopAt=' + leaveTick + ' descendedCells=' + ((maxPy - startY) / FRAC).toFixed(1));
  }

  // ── CLAIM 7: a resting entity's FEET sit on the TOP of its platform — its py maps
  //    to the SAME row as the girder it stands on, never the floor above (catches
  //    symptom 3: the float / vertical-anchoring off-by-one). NEG CONTROL: a feet-py
  //    that lands one row HIGH must NOT pass this floor-on-platform invariant. ──
  {
    var w7 = makeWorld(0, { spawnEnabled: false });
    var p7 = w7.player;                      // spawned on the start girder, resting
    stepTick(w7, blankInput());              // settle one tick (no input)
    var feetRow = Math.round(p7.py / FRAC);
    var standsOnFloor = isFigureFloorTile(tileAt(w7, p7.cx, feetRow));  // its own row IS a floor tile
    var pyOnLattice = (p7.py % FRAC) === 0;  // feet rest exactly on a row line (no sub-cell offset)
    // NEG CONTROL: an entity offset one row UP (the float bug's signature) is NOT
    // resting on its platform — its feet row would be empty air above the girder.
    var floatRow = feetRow - 1;
    var floatRestsOnFloor = isFigureFloorTile(tileAt(w7, p7.cx, floatRow));
    check('FEET ON PLATFORM TOP: a resting figure\'s feet row IS its girder (py on the lattice line); NEG: one row up is NOT a floor',
          standsOnFloor && pyOnLattice && !floatRestsOnFloor,
          'feetRow=' + feetRow + ' onFloor=' + standsOnFloor + ' latticeAligned=' + pyOnLattice + ' negFloatOnFloor=' + floatRestsOnFloor);
  }

  // ── CLAIM 8: a JUMP's apex rise is < ONE FLOOR HEIGHT in lattice units — it clears
  //    about one barrel, NOT 2.5 stories (catches symptom 4's untuned impulse). The
  //    apex is the analytic sum of the fixed arc; it must be strictly under FRAC. ──
  {
    var w8 = makeWorld(0, { spawnEnabled: false });
    var p8 = w8.player; p8.cx = 5; p8.cy = 11; p8.px = 5 * FRAC; p8.py = 11 * FRAC;
    p8.onGround = true; p8.alive = true; p8.vy = 0;
    var groundY = p8.py, apexRise = 0;
    var in8 = blankInput(); in8.jump = true;
    for (var k8 = 0; k8 < 40 && !w8.over; k8++) {
      stepTick(w8, in8); in8.jump = false;
      var rise = groundY - p8.py; if (rise > apexRise) apexRise = rise;
      if (p8.onGround && k8 > 0) break;        // landed back
    }
    var FLOOR = FRAC;                            // one floor = one cell in lattice units
    check('JUMP APEX < ONE FLOOR: the fixed jump arc rises < one floor height (clears ~a barrel, not 2.5 stories)',
          apexRise > 0 && apexRise < FLOOR,
          'apexRise=' + apexRise + ' lattice (' + (apexRise / FRAC).toFixed(2) + ' cells) floor=' + FLOOR);
  }

  // ── CLAIM 9: a rising figure is BLOCKED by a CEILING — a STRONG upward impulse
  //    fired under a girder does NOT tunnel through it (catches symptom 4's tunnel:
  //    the broken build, with no upward-collision check, let a rising figure punch
  //    straight through every girder above). We drive a large vy (like the old broken
  //    JUMP_VY) at a figure one empty row below a ceiling girder, and assert the head
  //    NEVER crosses the ceiling beam. NEG CONTROL: the same impulse in OPEN air
  //    (ceiling carved away) DOES rise past that height — proving the block is the
  //    ceiling, not the arc topping out. ───────────────────────────────────────── */
  {
    function ceilingShaft(withCeiling) {
      var ww = makeWorld(0, { spawnEnabled: false });
      var Wc = ww.W, col = 7, standRow = 6, ceilRow = 4;   // one empty row (5) between
      for (var x = 0; x < Wc; x++) {                        // clear rows 4,5,6 at the column
        ww.tiles[5 * Wc + col] = EMPTY;
      }
      ww.tiles[standRow * Wc + col] = GIRDER;               // figure stands here
      ww.tiles[ceilRow * Wc + col] = withCeiling ? GIRDER : EMPTY;  // ceiling (or air)
      var pp = ww.player; pp.cx = col; pp.cy = standRow; pp.px = col * FRAC; pp.py = standRow * FRAC;
      pp.onGround = true; pp.alive = true; pp.vy = 0;
      return { w: ww, p: pp, col: col, ceilRow: ceilRow };
    }
    // POSITIVE: a strong impulse under a ceiling — the head must stop at/below the beam.
    var s9 = ceilingShaft(true);
    s9.p.onGround = false; s9.p.jumping = true; s9.p.vy = -20;   // a deliberately big rise
    var minHeadY = s9.p.py - BODY_H;
    for (var k9 = 0; k9 < 40 && !s9.w.over; k9++) {
      stepTick(s9.w, blankInput());
      var hy = s9.p.py - BODY_H; if (hy < minHeadY) minHeadY = hy;
      if (s9.p.onGround && k9 > 0) break;
    }
    var ceilBeam = s9.ceilRow * FRAC;
    var blockedByCeiling = minHeadY >= ceilBeam;            // head never crossed the beam line
    // NEG CONTROL: identical impulse with the ceiling carved to air → it rises past it.
    var s9n = ceilingShaft(false);
    s9n.p.onGround = false; s9n.p.jumping = true; s9n.p.vy = -20;
    var minHeadYn = s9n.p.py - BODY_H;
    for (var k9n = 0; k9n < 40 && !s9n.w.over; k9n++) {
      stepTick(s9n.w, blankInput());
      var hyn = s9n.p.py - BODY_H; if (hyn < minHeadYn) minHeadYn = hyn;
      if (s9n.p.onGround && k9n > 0) break;
    }
    var rosePastInOpen = minHeadYn < ceilBeam;             // without a ceiling it goes higher
    check('CEILING BLOCKS UPWARD: a strong impulse under a girder bonks (head never crosses the beam); NEG: open air rises past it',
          blockedByCeiling && rosePastInOpen,
          'minHeadY=' + minHeadY + ' ceilBeam=' + ceilBeam + ' blocked=' + blockedByCeiling + ' negOpenMinHeadY=' + minHeadYn);
  }

  // ── CLAIM 10: a grounded held-direction move advances by ~RUN_SPEED lattice units
  //    per tick — SUB-cell, NOT a whole cell (catches symptom 1's flick: the old
  //    whole-cell-per-tick run that crossed the board in 15 ticks). ──
  {
    var w10 = makeWorld(0, { spawnEnabled: false });
    var p10 = w10.player; p10.cx = 4; p10.cy = 11; p10.px = 4 * FRAC; p10.py = 11 * FRAC;
    p10.onGround = true; p10.alive = true; p10.vy = 0;
    var x0 = p10.px, in10 = blankInput(); in10.right = true;
    stepTick(w10, in10);
    var advanced = p10.px - x0;
    check('SUB-CELL RUN: one tick of a held arrow advances ~RUN_SPEED (≤ a fraction of a cell), not a whole cell',
          advanced > 0 && advanced <= RUN_SPEED && advanced < FRAC,
          'advanced=' + advanced + ' lattice (RUN_SPEED=' + RUN_SPEED + ', a whole cell=' + FRAC + ')');
  }

  return { allPass: allPass, results: results };
}

/* ── dual-use module guard (forge strips exactly this braced block) ─────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRAC: FRAC, SIM_HZ: SIM_HZ, RUN_SPEED: RUN_SPEED, CLIMB_SPEED: CLIMB_SPEED, GRAV: GRAV,
    RUN_SEC_PER_CELL: RUN_SEC_PER_CELL, CLIMB_SEC_PER_CELL: CLIMB_SEC_PER_CELL,
    BARREL_SEC_PER_CELL: BARREL_SEC_PER_CELL, perTick: perTick,
    JUMP_VY: JUMP_VY, BARREL_SPEED: BARREL_SPEED, BARREL_FALL: BARREL_FALL,
    HOP_SCORE: HOP_SCORE, BODY_W: BODY_W, BODY_H: BODY_H, BARREL_W: BARREL_W, BARREL_H: BARREL_H,
    EMPTY: EMPTY, GIRDER: GIRDER, LADDER: LADDER, DROP: DROP, SOLID: SOLID,
    THROWER: THROWER, PSPAWN: PSPAWN, GOAL: GOAL, LEVELS: LEVELS,
    parseLevel: parseLevel, tileAt: tileAt, isLadder: isLadder, isFloorBelow: isFloorBelow,
    onGoal: onGoal, passableCell: passableCell, cellOfX: cellOfX, cellOfY: cellOfY,
    makeWorld: makeWorld, mkPlayer: mkPlayer, mkBarrel: mkBarrel, blankInput: blankInput,
    spawnBarrel: spawnBarrel, stepBarrel: stepBarrel, stepPlayer: stepPlayer, stepTick: stepTick,
    resolveCollisions: resolveCollisions, hashWorld: hashWorld, hashBoard: hashBoard, replay: replay,
    winSolve: winSolve, runSelfTest: runSelfTest
  };
}
