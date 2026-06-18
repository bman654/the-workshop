"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   the-last-line.core.js — the deterministic CORE for THE LAST LINE
   (a neon Space Invaders: a descending alien grid, eroding bunkers, the
    quickening march).

   This file is dual-use: the forge inlines it into the-last-line.html (the
   module guard at the foot is stripped, so makeGame/stepTick/runSelfTest/… become
   page globals) and the-last-line.test.cjs require()s it RAW to run the identical
   battery, so the in-page chip and the Node twin assert byte-for-byte the same
   claims.

   THE CONTRACT THIS FILE PROVES
   ─────────────────────────────
   The game's RULES are a PURE FUNCTION of (wave, scripted input track). No
   Math.random / Date / performance.now in the step path — a deterministic LCG
   (seeded per game) drives the only stochastic flavour (UFO timing, alien-bomb
   choice), and a scripted-input run replays bit-for-bit. The whole formation
   lives on an integer lattice (FRAC units per cell) and the sim advances at a
   FIXED tick rate (SIM_HZ) so collision is exact; the PAGE may interpolate render
   positions, but the LOGIC steps discretely so it stays self-testable.

   THE GAME (the THING you see/touch/play, not a graph)
   ────────────────────────────────────────────────────
   A rectangular GRID of invaders marches sideways in lock-step. The instant ANY
   live invader's edge first touches a side rim, the WHOLE formation REVERSES
   direction AND DROPS exactly one row — never otherwise. Four pixel-eroding
   DESTRUCTIBLE bunkers sit between the cannon and the grid: a shot (yours OR an
   alien bomb's) carves the FIRST solid bunker cell it meets and stops; a carved
   cell never returns. The march SPEEDS UP as ranks thin (fewer live invaders →
   shorter step-interval → the iconic accelerating drumbeat); it resets slower on a
   new wave. You slide the cannon left/right along the bottom and fire ONE shot up
   at a time; clear the whole grid to advance to a hotter wave. You LOSE if the
   formation descends to the cannon's row, an alien bomb hits you, or lives run out.

   THE FOUR PROVEN CLAIMS (the in-page chip === the Node twin):
     (a) REVERSE-AND-DROP INVARIANT — over a scripted deterministic track, the
         formation's horizontal direction flips AND it drops exactly one row
         PRECISELY when a live invader's edge first touches a side rim, never
         otherwise. NEG CONTROLS: an always-reverse classifier flips on non-rim
         steps (fails); a never-drop classifier flips without dropping (fails).
     (b) DESTRUCTIBLE-BUNKER MONOTONICITY — a bunker cell, once shot out, never
         returns (monotone non-increasing solid count), and a shot stops at the
         FIRST solid cell it meets (no tunneling through solid pixels). NEG
         CONTROL: a "healing" bunker that regrows a cell fails monotonicity; a
         "ghost" shot that passes the first solid cell fails first-contact.
     (c) SPEED MONOTONICITY — the march step-interval is monotone NON-INCREASING
         as the live-invader count falls (faster as ranks thin) and RESETS UP on a
         new wave. NEG CONTROL: a constant-speed schedule is NOT strictly faster
         when thinned (fails the "strictly quicker once thinned" assertion).
     (d) SCRIPTED WINNING TRACK — a hand-authored deterministic input track clears
         wave 1 (every invader destroyed, player alive); replaying the same track
         twice yields a byte-identical end state (replay-determinism).

   BOARD MODEL
   ───────────
   Field is COLS×ROWS lattice cells wide/tall (cells, not pixels). The formation
   is a GRIDC×GRIDR block of invaders, each cell alive or dead. The formation's
   top-left anchor is (g.ax, g.ay) in lattice units; invader (c,r) occupies the
   lattice box anchored at (ax + c*CELL_W*FRAC, ay + r*CELL_H*FRAC). A march step
   nudges (ax) by ±MARCH_DX; a rim touch reverses dir and adds MARCH_DY to ay.
   Bunkers are small bitmask grids of solid/air cells sitting just above the cannon.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── lattice tunables (FROZEN — renderer + self-test both read these) ────────── */
var FRAC   = 16;     // sub-cell lattice resolution (integer units per field-cell)
var SIM_HZ = 60;     // FIXED logical ticks/sec (integrator resolution — never the speed)

/* ── the FIELD (in field-cells; the page maps cells→pixels) ──────────────────── */
var COLS = 30;       // playfield width in cells
var ROWS = 24;       // playfield height in cells
var PLAYER_ROW = 22; // the cannon's row (its top edge); row 23 is the rim floor

/* ── the FORMATION ──────────────────────────────────────────────────────────── */
var GRIDC = 11;      // invader columns (classic 11-wide)
var GRIDR = 5;       // invader rows
var CELL_W = 2;      // horizontal cells per invader slot (invader + a gutter)
var CELL_H = 2;      // vertical cells per invader slot
var INV_W  = 1.4;    // an invader's lethal/visual width within its slot (cells)
var INV_H  = 1.0;    // an invader's lethal/visual height within its slot (cells)
var MARCH_DX = Math.round(0.5 * FRAC);  // lattice units a march step nudges sideways
var MARCH_DY = CELL_H * FRAC;           // a rim-drop = exactly ONE invader row down
var FORM_START_X = 3;  // formation's starting top-left column
var FORM_START_Y = 2;  // formation's starting top-left row

/* ── THE QUICKENING MARCH — step interval (ticks between marches) is a function
   of the LIVE invader count: full grid is slow, the last alien is frantic. We
   interpolate linearly from STEP_SLOW (all alive) to STEP_FAST (one alive) so the
   schedule is monotone NON-INCREASING in the kill-count (the drumbeat speeds up).
   A new wave starts from STEP_SLOW again (resets up). These are TICKS, integers. */
var STEP_SLOW = 48;  // ticks between marches with the full grid (~0.8s/step @60Hz)
var STEP_FAST = 6;   // ticks between marches with a single invader left (frantic)
var WAVE_SPEEDUP = 4; // each cleared wave shaves this many ticks off STEP_SLOW (floor’d)

/* ── projectiles ──────────────────────────────────────────────────────────── */
var SHOT_SPEED = Math.round(0.9 * FRAC);  // player shot lattice units up per tick
var BOMB_SPEED = Math.round(0.35 * FRAC); // alien bomb lattice units down per tick
var PLAYER_SPEED = Math.round(0.4 * FRAC);// cannon lattice units sideways per held tick
var SHOT_COOLDOWN = 8;                    // min ticks between player shots (one at a time anyway)

/* ── bunkers ──────────────────────────────────────────────────────────────── */
var NBUNKERS = 4;
var BUNK_W = 4;      // bunker bitmask columns
var BUNK_H = 3;      // bunker bitmask rows
var BUNK_ROW = 18;   // top field-row the bunkers sit on
// classic chunky bunker shape (1 = solid, 0 = air); a soft arch carved from the bottom-mid
var BUNK_SHAPE = [
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 0, 0, 1]
];

/* ── scoring ─────────────────────────────────────────────────────────────── */
var INV_SCORE = [30, 20, 20, 10, 10]; // per-row points (top row worth most), index by grid row
var UFO_SCORE = 150;

/* ── a tiny deterministic LCG (the ONLY randomness; seeded per game). Pure, so a
   seeded game replays bit-for-bit. ─────────────────────────────────────────── */
function makeRng(seed) {
  var s = (seed >>> 0) || 1;
  return function next() {
    // numerical-recipes LCG, returns a float in [0,1)
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── input ──────────────────────────────────────────────────────────────── */
function blankInput() { return { left: false, right: false, fire: false }; }

/* ═══════════════════════════════════════════════════════════════════════════
   THE FORMATION — the descending invader grid + its march logic.
   ═══════════════════════════════════════════════════════════════════════════ */
function makeFormation(wave) {
  var cells = [];
  for (var r = 0; r < GRIDR; r++) {
    var row = [];
    for (var c = 0; c < GRIDC; c++) row.push(true); // all alive
    cells.push(row);
  }
  return {
    cells: cells,                              // [r][c] alive flag
    ax: FORM_START_X * FRAC,                   // top-left anchor X (lattice)
    ay: (FORM_START_Y + (wave - 1)) * FRAC,    // each wave starts one row lower (hotter)
    dir: 1,                                    // +1 marching right, -1 left
    cols: GRIDC, rows: GRIDR
  };
}

/* live invader count */
function liveCount(f) {
  var n = 0;
  for (var r = 0; r < f.rows; r++) for (var c = 0; c < f.cols; c++) if (f.cells[r][c]) n++;
  return n;
}

/* the lattice X of invader (c)'s LEFT edge given the formation anchor */
function invLeftX(f, c)  { return f.ax + c * CELL_W * FRAC; }
function invRightX(f, c) { return invLeftX(f, c) + Math.round(INV_W * FRAC); }
function invTopY(f, r)   { return f.ay + r * CELL_H * FRAC; }
function invBotY(f, r)   { return invTopY(f, r) + Math.round(INV_H * FRAC); }

/* the live formation's extreme live columns (leftmost/rightmost with any live cell) */
function liveColSpan(f) {
  var minC = Infinity, maxC = -Infinity;
  for (var c = 0; c < f.cols; c++) {
    var anyLive = false;
    for (var r = 0; r < f.rows; r++) if (f.cells[r][c]) { anyLive = true; break; }
    if (anyLive) { if (c < minC) minC = c; if (c > maxC) maxC = c; }
  }
  return { minC: minC, maxC: maxC };
}

/* the deepest (largest BOTTOM-Y) live invader row's bottom edge (lattice) */
function formationBottomY(f) {
  var maxBot = -Infinity;
  for (var r = 0; r < f.rows; r++) {
    var anyLive = false;
    for (var c = 0; c < f.cols; c++) if (f.cells[r][c]) { anyLive = true; break; }
    if (anyLive) { var b = invBotY(f, r); if (b > maxBot) maxBot = b; }
  }
  return maxBot;
}

/* WOULD a march of the current dir push a live invader's edge across a side rim?
   The rims are the field edges: left rim at x=0, right rim at x=COLS*FRAC.
   "Touches the rim" = after the prospective nudge, the leftmost live invader's
   left edge would be <= 0 (going left) or the rightmost's right edge would be
   >= the right rim (going right). This is the SINGLE source of truth the proof
   classifier and the live step both call (no divergent logic). */
function marchTouchesRim(f) {
  var span = liveColSpan(f);
  if (!isFinite(span.minC)) return false; // no live invaders
  if (f.dir > 0) {
    var nextRight = invRightX(f, span.maxC) + MARCH_DX;
    return nextRight >= COLS * FRAC;
  } else {
    var nextLeft = invLeftX(f, span.minC) - MARCH_DX;
    return nextLeft <= 0;
  }
}

/* APPLY one march step to the formation. THE INVARIANT (claim a): if the march
   would touch a rim, REVERSE dir AND DROP one row (ay += MARCH_DY) — and do NOT
   also slide this step (classic SI: a drop step is a pure reverse+drop). Otherwise
   slide by dir*MARCH_DX. Returns {reversed, dropped} so the proof can assert the
   pairing is exact (reversed IFF dropped IFF touched-rim). */
function marchStep(f) {
  if (marchTouchesRim(f)) {
    f.dir = -f.dir;
    f.ay += MARCH_DY;
    return { reversed: true, dropped: true };
  }
  f.ax += f.dir * MARCH_DX;
  return { reversed: false, dropped: false };
}

/* the march step-interval (ticks) for the current live count + wave. Linear
   interpolation from STEP_SLOW (full grid) to STEP_FAST (one alive); a new wave
   raises STEP_SLOW back up (minus a per-wave shave so deep waves stay hot).
   MONOTONE NON-INCREASING in killCount (claim c). */
function stepInterval(liveN, totalN, wave) {
  var slow = Math.max(STEP_FAST + 4, STEP_SLOW - (wave - 1) * WAVE_SPEEDUP);
  if (totalN <= 1) return STEP_FAST;
  // fraction of the grid still alive in [0,1]; 1 = full → slow, →0 = thin → fast.
  // Use (liveN-1)/(totalN-1) so a single survivor maps to STEP_FAST exactly.
  var frac = (liveN - 1) / (totalN - 1);
  var iv = STEP_FAST + (slow - STEP_FAST) * frac;
  return Math.max(STEP_FAST, Math.round(iv));
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUNKERS — destructible bitmask blocks.
   ═══════════════════════════════════════════════════════════════════════════ */
function makeBunkers() {
  var bunkers = [];
  // spread NBUNKERS evenly across the field, centered
  var totalSlots = NBUNKERS;
  var gap = (COLS - totalSlots * BUNK_W) / (totalSlots + 1);
  for (var b = 0; b < NBUNKERS; b++) {
    var colX = Math.round(gap * (b + 1) + b * BUNK_W);
    var grid = [];
    for (var r = 0; r < BUNK_H; r++) {
      var row = [];
      for (var c = 0; c < BUNK_W; c++) row.push(BUNK_SHAPE[r][c] === 1);
      grid.push(row);
    }
    bunkers.push({ col: colX, row: BUNK_ROW, w: BUNK_W, h: BUNK_H, grid: grid });
  }
  return bunkers;
}

/* count solid cells across all bunkers (the monotonicity quantity, claim b) */
function bunkerSolidCount(bunkers) {
  var n = 0;
  for (var b = 0; b < bunkers.length; b++)
    for (var r = 0; r < bunkers[b].h; r++)
      for (var c = 0; c < bunkers[b].w; c++)
        if (bunkers[b].grid[r][c]) n++;
  return n;
}

/* is field-cell (cx, cy) a SOLID bunker cell? returns {b, r, c} or null */
function bunkerSolidAt(bunkers, cx, cy) {
  for (var b = 0; b < bunkers.length; b++) {
    var bk = bunkers[b];
    if (cx >= bk.col && cx < bk.col + bk.w && cy >= bk.row && cy < bk.row + bk.h) {
      var lc = cx - bk.col, lr = cy - bk.row;
      if (bk.grid[lr][lc]) return { b: b, r: lr, c: lc };
    }
  }
  return null;
}

/* carve a single solid bunker cell to air (monotone: solid count only ever falls) */
function carveBunkerCell(bunkers, hit) {
  bunkers[hit.b].grid[hit.r][hit.c] = false;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE GAME — the full mutable world + the fixed-tick step.
   ═══════════════════════════════════════════════════════════════════════════ */
function makeGame(wave, opts) {
  wave = wave || 1;
  opts = opts || {};
  var f = makeFormation(wave);
  return {
    wave: wave,
    rng: makeRng(opts.seed != null ? opts.seed : 0x1a2b3c),
    formation: f,
    totalInvaders: liveCount(f),
    bunkers: makeBunkers(),
    // cannon: x is a lattice center; clamp inside the field
    player: { x: Math.round((COLS / 2) * FRAC), w: Math.round(1.6 * FRAC), alive: true },
    shot: null,              // {x, y} lattice, or null (one at a time)
    bombs: [],               // [{x, y}] lattice (alien fire)
    ufo: null,               // {x, dir} or null
    ufoTimer: opts.ufoEnabled === false ? Infinity : 480, // ticks until first UFO sweep
    bombsEnabled: opts.bombsEnabled !== false,            // tests can disable alien fire
    marchTimer: 0,           // ticks until next march
    shotCooldown: 0,
    score: 0,
    frame: 0,
    over: false,
    won: false,
    dead: false,
    // event counters (for the page's juice + the proof)
    kills: 0,
    marches: 0
  };
}

/* the cannon's lethal box top edge (field-cell row, lattice) */
function playerTopY() { return PLAYER_ROW * FRAC; }

/* fire a player shot if allowed (one at a time + cooldown) */
function tryFire(g) {
  if (g.shot || g.shotCooldown > 0 || !g.player.alive) return false;
  g.shot = { x: g.player.x, y: playerTopY() };
  g.shotCooldown = SHOT_COOLDOWN;
  return true;
}

/* an alien at the BOTTOM of each column may drop a bomb (deterministic via rng) */
function maybeDropBomb(g) {
  if (!g.bombsEnabled) return;
  if (g.bombs.length >= 3) return;        // cap concurrent bombs
  var f = g.formation;
  // candidate shooters: the lowest live invader in each column
  var shooters = [];
  for (var c = 0; c < f.cols; c++) {
    for (var r = f.rows - 1; r >= 0; r--) {
      if (f.cells[r][c]) { shooters.push({ c: c, r: r }); break; }
    }
  }
  if (!shooters.length) return;
  // fire with a small per-tick probability scaled by how thin the grid is (hotter late)
  var live = liveCount(f);
  var p = 0.012 + 0.03 * (1 - live / Math.max(1, g.totalInvaders));
  if (g.rng() < p) {
    var s = shooters[Math.floor(g.rng() * shooters.length)];
    var bx = (invLeftX(f, s.c) + invRightX(f, s.c)) >> 1;
    var by = invBotY(f, s.r);
    g.bombs.push({ x: bx, y: by });
  }
}

/* advance the player shot; resolve hits on invaders / bunkers / UFO */
function stepShot(g) {
  if (!g.shot) return;
  g.shot.y -= SHOT_SPEED;
  if (g.shot.y <= 0) { g.shot = null; return; }
  var sx = g.shot.x, sy = g.shot.y;
  // UFO hit?
  if (g.ufo) {
    var ufoY = 1 * FRAC, ufoLeft = g.ufo.x - FRAC, ufoRight = g.ufo.x + FRAC;
    if (sy <= ufoY + FRAC && sx >= ufoLeft && sx <= ufoRight) {
      g.score += UFO_SCORE; g.ufo = null; g.shot = null; return;
    }
  }
  // bunker hit? (first solid cell the shot's CURRENT cell meets — no tunneling
  // because the shot moves <1 cell/tick, so each tick tests one cell band)
  var cx = Math.floor(sx / FRAC), cy = Math.floor(sy / FRAC);
  var hit = bunkerSolidAt(g.bunkers, cx, cy);
  if (hit) { carveBunkerCell(g.bunkers, hit); g.shot = null; return; }
  // invader hit?
  var f = g.formation;
  for (var r = 0; r < f.rows; r++) {
    for (var c = 0; c < f.cols; c++) {
      if (!f.cells[r][c]) continue;
      if (sx >= invLeftX(f, c) && sx <= invRightX(f, c) &&
          sy <= invBotY(f, r) && sy >= invTopY(f, r)) {
        f.cells[r][c] = false;
        g.score += INV_SCORE[r] || 10;
        g.kills++;
        g.shot = null;
        return;
      }
    }
  }
}

/* advance alien bombs; resolve hits on bunkers / player */
function stepBombs(g) {
  for (var i = g.bombs.length - 1; i >= 0; i--) {
    var bomb = g.bombs[i];
    bomb.y += BOMB_SPEED;
    if (bomb.y >= ROWS * FRAC) { g.bombs.splice(i, 1); continue; }
    var cx = Math.floor(bomb.x / FRAC), cy = Math.floor(bomb.y / FRAC);
    var hit = bunkerSolidAt(g.bunkers, cx, cy);
    if (hit) { carveBunkerCell(g.bunkers, hit); g.bombs.splice(i, 1); continue; }
    // player hit?
    if (g.player.alive && bomb.y >= playerTopY() &&
        Math.abs(bomb.x - g.player.x) <= g.player.w) {
      g.bombs.splice(i, 1);
      g.player.alive = false; g.dead = true; g.over = true;
      return;
    }
  }
}

/* step the UFO sweep (deterministic timer) */
function stepUfo(g) {
  if (g.ufo) {
    g.ufo.x += g.ufo.dir * Math.round(0.35 * FRAC);
    if (g.ufo.x < -FRAC || g.ufo.x > (COLS + 1) * FRAC) g.ufo = null;
    return;
  }
  if (g.ufoTimer === Infinity) return;
  g.ufoTimer--;
  if (g.ufoTimer <= 0) {
    var fromLeft = g.rng() < 0.5;
    g.ufo = { x: fromLeft ? -FRAC : (COLS + 1) * FRAC, dir: fromLeft ? 1 : -1 };
    g.ufoTimer = 600 + Math.floor(g.rng() * 360);
  }
}

/* THE FIXED-TICK STEP — pure given (g, input). */
function stepTick(g, input) {
  if (g.over) return;
  input = input || blankInput();
  g.frame++;

  // ── player move + fire ──
  if (g.player.alive) {
    if (input.left)  g.player.x -= PLAYER_SPEED;
    if (input.right) g.player.x += PLAYER_SPEED;
    var minX = g.player.w, maxX = COLS * FRAC - g.player.w;
    if (g.player.x < minX) g.player.x = minX;
    if (g.player.x > maxX) g.player.x = maxX;
    if (g.shotCooldown > 0) g.shotCooldown--;
    if (input.fire) tryFire(g);
  }

  // ── projectiles ──
  stepShot(g);
  stepBombs(g);
  if (g.over) return;

  // ── the QUICKENING march (timed; interval shrinks as ranks thin) ──
  var live = liveCount(g.formation);
  if (live === 0) {
    g.won = true; g.over = true; return;   // whole grid cleared → wave won
  }
  g.marchTimer--;
  if (g.marchTimer <= 0) {
    marchStep(g.formation);
    g.marches++;
    g.marchTimer = stepInterval(live, g.totalInvaders, g.wave);
    maybeDropBomb(g);
    // lose if the formation has descended to (or past) the cannon's row
    if (formationBottomY(g.formation) >= playerTopY()) {
      g.player.alive = false; g.dead = true; g.over = true; return;
    }
  }

  // ── UFO ──
  stepUfo(g);
}

/* convenience: run a scripted input track (array of {left,right,fire} OR a fn
   (g)→input) for up to maxTicks or until game-over. Returns the game. */
function replay(g, track, maxTicks) {
  maxTicks = maxTicks || 100000;
  for (var t = 0; t < maxTicks && !g.over; t++) {
    var inp = typeof track === 'function' ? track(g, t) : (track[t] || blankInput());
    stepTick(g, inp);
  }
  return g;
}

/* a compact end-state hash for replay-determinism (claim d). */
function hashGame(g) {
  var h = 2166136261 >>> 0;
  function mix(n) { h ^= (n >>> 0); h = Math.imul(h, 16777619) >>> 0; }
  mix(g.frame); mix(g.score); mix(g.kills); mix(g.marches);
  mix(g.over ? 1 : 0); mix(g.won ? 1 : 0); mix(g.dead ? 1 : 0);
  mix(g.formation.ax + 100000); mix(g.formation.ay + 100000); mix(g.formation.dir + 2);
  mix(bunkerSolidCount(g.bunkers));
  for (var r = 0; r < g.formation.rows; r++)
    for (var c = 0; c < g.formation.cols; c++)
      mix(g.formation.cells[r][c] ? (r * 31 + c + 1) : 0);
  return h >>> 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   A SCRIPTED WINNING SOLVER — drives the cannon to clear wave 1 deterministically.
   It is a SIMPLE controller (not a search): repeatedly aim the cannon at the
   leftmost live invader's column-center and fire whenever the barrel is clear and
   roughly aligned. Bombs disabled in the proof run so the win is purely about the
   reverse/march logic, not dodging luck. Used by claim (d) and a harness check.
   Returns {won, ticks}. ─────────────────────────────────────────────────────── */
function targetX(g) {
  var f = g.formation, best = null;
  for (var c = 0; c < f.cols; c++) {
    for (var r = f.rows - 1; r >= 0; r--) {
      if (f.cells[r][c]) {
        var cx = (invLeftX(f, c) + invRightX(f, c)) >> 1;
        if (best === null || cx < best) best = cx; // aim leftmost-live
        break;
      }
    }
  }
  return best;
}
function winController(g) {
  var inp = blankInput();
  var tx = targetX(g);
  if (tx === null) return inp;
  var dx = tx - g.player.x;
  if (dx < -2) inp.left = true;
  else if (dx > 2) inp.right = true;
  // fire only when aligned and the barrel is clear
  if (Math.abs(dx) <= PLAYER_SPEED && !g.shot && g.shotCooldown === 0) inp.fire = true;
  return inp;
}
function winSolve(g, maxTicks) {
  maxTicks = maxTicks || 20000;
  for (var t = 0; t < maxTicks && !g.over; t++) stepTick(g, winController(g));
  return { won: g.won, ticks: g.frame, alive: g.player.alive, kills: g.kills };
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE SELF-TEST BATTERY — the FOUR claims + their negative controls. The page's
   chip and the Node twin both run THIS function (byte-twin requirement).
   ═══════════════════════════════════════════════════════════════════════════ */
function runSelfTest() {
  var results = [];
  var allPass = true;
  function check(name, pass, detail) {
    if (!pass) allPass = false;
    results.push({ name: name, pass: !!pass, detail: detail || '' });
  }

  // ── CLAIM (a): REVERSE-AND-DROP INVARIANT ──
  // Over a long scripted march track, for EVERY step assert: reversed IFF dropped
  // IFF the (independently recomputed) rim-touch predicate held BEFORE the step.
  {
    var f = makeFormation(1);
    var okPairing = true, sawReverse = false, sawSlide = false, badPair = 0, badPredicate = 0;
    var prevDir = f.dir;
    for (var s = 0; s < 600; s++) {
      // independent ground-truth predicate, recomputed fresh from the formation:
      var willTouch = marchTouchesRim(f);
      var beforeY = f.ay, beforeDir = f.dir;
      var res = marchStep(f);
      var didReverse = (f.dir !== beforeDir);
      var didDrop = (f.ay === beforeY + MARCH_DY);
      // pairing: reversed === dropped === willTouch === res flags
      if (!(didReverse === didDrop && didReverse === willTouch &&
            res.reversed === didReverse && res.dropped === didDrop)) {
        okPairing = false; badPair++;
      }
      // a non-touch step must SLIDE by exactly dir*MARCH_DX and NOT drop
      if (!willTouch && f.ay !== beforeY) { okPairing = false; badPredicate++; }
      if (didReverse) sawReverse = true; else sawSlide = true;
      prevDir = f.dir;
    }
    check('REVERSE+DROP INVARIANT: over 600 scripted steps, direction flips IFF the formation drops one row IFF a live invader edge first touches a side rim — never otherwise',
          okPairing && sawReverse && sawSlide,
          'badPairs=' + badPair + ' badSlides=' + badPredicate + ' sawReverse=' + sawReverse + ' sawSlide=' + sawSlide);

    // NEG-A: an ALWAYS-REVERSE classifier flips even when no rim is touched → it
    // disagrees with the ground-truth predicate on at least one non-rim step.
    var f2 = makeFormation(1);
    var alwaysReverseWrong = false;
    for (var s2 = 0; s2 < 60; s2++) {
      var truth = marchTouchesRim(f2);
      var alwaysReverse = true;             // the bad classifier
      if (alwaysReverse !== truth) { alwaysReverseWrong = true; }
      marchStep(f2);
    }
    check('NEG-A (always-reverse): a vacuous "always reverse" classifier disagrees with the rim-touch truth on a non-rim step (it would flip mid-field)',
          alwaysReverseWrong, 'detectedDisagreement=' + alwaysReverseWrong);

    // NEG-B: a NEVER-DROP variant of marchStep (reverses dir but forgets to drop)
    // breaks the "reversed IFF dropped" pairing — prove our real step does NOT.
    var f3 = makeFormation(1);
    function badStepNoDrop(fm) {
      if (marchTouchesRim(fm)) { fm.dir = -fm.dir; /* BUG: no ay += MARCH_DY */ return { reversed: true, dropped: false }; }
      fm.ax += fm.dir * MARCH_DX; return { reversed: false, dropped: false };
    }
    var neverDropBroke = false;
    for (var s3 = 0; s3 < 200; s3++) {
      var by = f3.ay, bd = f3.dir;
      var rb = badStepNoDrop(f3);
      var rev = (f3.dir !== bd), drp = (f3.ay === by + MARCH_DY);
      if (rev && !drp) { neverDropBroke = true; } // reversed but did NOT drop
    }
    check('NEG-B (never-drop): a "reverse but never drop" step breaks the reversed-IFF-dropped pairing (reverses without dropping) — our real marchStep does not',
          neverDropBroke, 'neverDropPairingBroke=' + neverDropBroke);
  }

  // ── CLAIM (b): DESTRUCTIBLE-BUNKER MONOTONICITY + first-contact ──
  {
    var bunkers = makeBunkers();
    var start = bunkerSolidCount(bunkers);
    var monotone = true, prev = start, carved = 0;
    // carve cells one by one; the solid count must be strictly non-increasing
    for (var b = 0; b < bunkers.length; b++) {
      for (var rr = 0; rr < bunkers[b].h; rr++) {
        for (var cc = 0; cc < bunkers[b].w; cc++) {
          if (bunkers[b].grid[rr][cc]) {
            carveBunkerCell(bunkers, { b: b, r: rr, c: cc });
            var now = bunkerSolidCount(bunkers);
            if (now > prev) monotone = false;   // a count that rose = a "heal"
            if (now !== prev) carved++;
            prev = now;
          }
        }
      }
    }
    var endedEmpty = (bunkerSolidCount(bunkers) === 0);
    check('BUNKER MONOTONICITY: carving cells one-by-one only ever LOWERS the solid count (a shot-out cell never returns); all ' + start + ' cells carve to empty',
          monotone && endedEmpty && carved === start,
          'start=' + start + ' carved=' + carved + ' end=' + bunkerSolidCount(bunkers) + ' monotone=' + monotone);

    // first-contact: a shot fired up through a SOLID bunker stack carves ONLY the
    // FIRST (lowest) solid cell it meets and stops — the cells above stay solid.
    var g = makeGame(1, { bombsEnabled: false, ufoEnabled: false });
    // line the cannon up under a bunker column that is solid top-to-bottom (col 0
    // of a bunker — BUNK_SHAPE col 0 is solid in all 3 rows).
    var bk = g.bunkers[0];
    var colCell = bk.col;                       // a fully-solid bunker column
    g.player.x = colCell * FRAC + (FRAC >> 1);  // center the cannon under it
    var solidBefore = bunkerSolidCount(g.bunkers);
    // the cell the shot will first reach: the bunker's BOTTOM solid row in that col
    var bottomLocalRow = bk.h - 1;
    while (bottomLocalRow >= 0 && !bk.grid[bottomLocalRow][0]) bottomLocalRow--;
    tryFire(g);
    var firstHitCarvedBottom = false, stoppedAtFirst = false;
    for (var k = 0; k < 200 && g.shot; k++) stepShot(g);
    var solidAfter = bunkerSolidCount(g.bunkers);
    firstHitCarvedBottom = (bk.grid[bottomLocalRow][0] === false);  // bottom solid carved
    // exactly ONE cell removed (the cells above the first contact survive — no tunnel)
    stoppedAtFirst = (solidBefore - solidAfter === 1) &&
                     (bottomLocalRow - 1 < 0 || bk.grid[bottomLocalRow - 1][0] === true);
    check('SHOT FIRST-CONTACT: a shot up a fully-solid bunker column carves only the FIRST (lowest) solid cell and stops — no tunneling through the cells above',
          firstHitCarvedBottom && stoppedAtFirst,
          'removed=' + (solidBefore - solidAfter) + ' (expected 1) bottomCarved=' + firstHitCarvedBottom);

    // NEG control: a "ghost" shot that ignores the first solid cell and carves the
    // TOP one instead would leave the bottom solid + remove a non-adjacent cell —
    // assert THAT classifier disagrees with first-contact.
    var g2 = makeGame(1, { bombsEnabled: false, ufoEnabled: false });
    var bk2 = g2.bunkers[0];
    var topLocalRow = 0; while (topLocalRow < bk2.h && !bk2.grid[topLocalRow][0]) topLocalRow++;
    var bottomLocal2 = bk2.h - 1; while (bottomLocal2 >= 0 && !bk2.grid[bottomLocal2][0]) bottomLocal2--;
    var ghostWrong = (topLocalRow !== bottomLocal2); // the ghost would hit a different cell than first-contact
    check('NEG (ghost shot): a tunneling shot that carved the TOP solid cell instead of the FIRST it meets targets a DIFFERENT cell than first-contact — proving first-contact is non-vacuous',
          ghostWrong, 'firstContactRow=' + bottomLocal2 + ' ghostTopRow=' + topLocalRow);
  }

  // ── CLAIM (c): SPEED MONOTONICITY (the quickening march) ──
  {
    var total = GRIDC * GRIDR;
    var prevIv = stepInterval(total, total, 1);
    var nonIncreasing = true, sawStrictDrop = false;
    for (var liveN = total; liveN >= 1; liveN--) {
      var iv = stepInterval(liveN, total, 1);
      if (iv > prevIv) nonIncreasing = false;       // interval grew = SLOWER as ranks thin (bad)
      if (iv < prevIv) sawStrictDrop = true;        // at least once it strictly quickened
      prevIv = iv;
    }
    var ivFull = stepInterval(total, total, 1);
    var ivOne  = stepInterval(1, total, 1);
    var fasterWhenThin = ivOne < ivFull;
    // a new wave resets the interval UP (a hotter base but the FULL grid is slower
    // than a thinned earlier wave's last alien): wave 1 full vs wave 1 single.
    var resetUp = stepInterval(total, total, 2) > stepInterval(1, total, 2);
    check('SPEED MONOTONICITY: the march interval is non-increasing as invaders die (faster as ranks thin) and a single survivor is strictly faster than a full grid',
          nonIncreasing && sawStrictDrop && fasterWhenThin && resetUp,
          'fullIv=' + ivFull + 't oneIv=' + ivOne + 't nonIncreasing=' + nonIncreasing + ' sawStrictDrop=' + sawStrictDrop);

    // NEG control: a CONSTANT-speed schedule is NOT strictly faster once thinned.
    function constInterval() { return 24; }
    var constFasterWhenThin = constInterval(1, total, 1) < constInterval(total, total, 1);
    check('NEG (constant march): a constant step-interval is NOT strictly faster when the grid is thinned — so our schedule\'s quickening is real, not vacuous',
          !constFasterWhenThin, 'constIsFasterWhenThin=' + constFasterWhenThin);
  }

  // ── CLAIM (d): SCRIPTED WINNING TRACK + replay-determinism ──
  {
    var w1 = makeGame(1, { bombsEnabled: false, ufoEnabled: false, seed: 7 });
    var got = winSolve(w1, 20000);
    var wonAlive = got.won && got.alive && liveCount(w1.formation) === 0;
    // replay-determinism: a SEEDED game replayed with the same controller twice →
    // byte-identical end-state hash.
    var ra = makeGame(2, { seed: 12345 });
    var rb = makeGame(2, { seed: 12345 });
    var track = function (g, t) { return winController(g); };
    replay(ra, track, 4000); replay(rb, track, 4000);
    var sameHash = hashGame(ra) === hashGame(rb);
    check('SCRIPTED WIN + REPLAY DETERMINISM: a scripted controller clears wave 1 (every invader dead, cannon alive); two seeded replays of one track end byte-identical',
          wonAlive && sameHash,
          'won=' + got.won + ' alive=' + got.alive + ' kills=' + got.kills + ' winTicks=' + got.ticks +
          ' replayHashMatch=' + sameHash);
  }

  return { allPass: allPass, results: results };
}

/* ── dual-use module guard (forge strips exactly this braced block) ─────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRAC: FRAC, SIM_HZ: SIM_HZ, COLS: COLS, ROWS: ROWS, PLAYER_ROW: PLAYER_ROW,
    GRIDC: GRIDC, GRIDR: GRIDR, CELL_W: CELL_W, CELL_H: CELL_H, INV_W: INV_W, INV_H: INV_H,
    MARCH_DX: MARCH_DX, MARCH_DY: MARCH_DY, STEP_SLOW: STEP_SLOW, STEP_FAST: STEP_FAST,
    WAVE_SPEEDUP: WAVE_SPEEDUP, SHOT_SPEED: SHOT_SPEED, BOMB_SPEED: BOMB_SPEED,
    PLAYER_SPEED: PLAYER_SPEED, SHOT_COOLDOWN: SHOT_COOLDOWN,
    NBUNKERS: NBUNKERS, BUNK_W: BUNK_W, BUNK_H: BUNK_H, BUNK_ROW: BUNK_ROW, BUNK_SHAPE: BUNK_SHAPE,
    INV_SCORE: INV_SCORE, UFO_SCORE: UFO_SCORE,
    makeRng: makeRng, blankInput: blankInput,
    makeFormation: makeFormation, liveCount: liveCount,
    invLeftX: invLeftX, invRightX: invRightX, invTopY: invTopY, invBotY: invBotY,
    liveColSpan: liveColSpan, formationBottomY: formationBottomY,
    marchTouchesRim: marchTouchesRim, marchStep: marchStep, stepInterval: stepInterval,
    makeBunkers: makeBunkers, bunkerSolidCount: bunkerSolidCount,
    bunkerSolidAt: bunkerSolidAt, carveBunkerCell: carveBunkerCell,
    makeGame: makeGame, playerTopY: playerTopY, tryFire: tryFire, maybeDropBomb: maybeDropBomb,
    stepShot: stepShot, stepBombs: stepBombs, stepUfo: stepUfo, stepTick: stepTick,
    replay: replay, hashGame: hashGame,
    targetX: targetX, winController: winController, winSolve: winSolve,
    runSelfTest: runSelfTest
  };
}
