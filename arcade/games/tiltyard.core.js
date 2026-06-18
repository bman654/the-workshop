"use strict";
/* ═══════════════════════════════════════════════════════════════════════════
   tiltyard.core.js — the deterministic CORE for THE TILTYARD
   (a neon tilt-the-board momentum marble maze; Marble-Madness kin — the rack's
    first ball-and-momentum cabinet).

   This file is dual-use: the forge inlines it into tiltyard.html (the module
   guard at the foot is stripped, so genMaze / makeGame / stepTick / runSelfTest /…
   become page globals) and tiltyard.test.cjs require()s it RAW to run the
   identical battery, so the in-page chip and the Node twin assert byte-for-byte
   the same claims.

   THE GAME (the THING you tilt/roll/play, not a graph)
   ────────────────────────────────────────────────────
   A neon board holds a PERFECT MAZE — a randomized-DFS spanning tree, so there is
   EXACTLY ONE path from start (top-left) to goal (bottom-right). A glass marble
   rests at the start. You do NOT move the marble: you TILT the whole tray (arrows
   set a target pitch), gravity rolls the marble along the slope, and momentum
   carries it — over-tilt and it OVERSHOOTS the goal or sails into a pit. WIN by
   SETTLING the marble in the goal (you must brake early enough to stop there)
   before an integer tick clock runs out; LOSE by falling through a pit or timing
   out. Clear a board to advance to a bigger, pit-denser one.

   THE CONTRACT THIS FILE PROVES (the in-page chip === the Node twin):
   ───────────────────────────────────────────────────────────────────
   A · THE MAZE IS PERFECT — genMaze(seed,w,h) emits a graph with EXACTLY V−1
       carved openings, CONNECTED (a BFS from start reaches every cell), and
       ACYCLIC (union-find finds no cycle) ⇒ exactly one simple path between any
       two cells. Proven from the canonical `edges` list, re-derived independently
       of the generator's bookkeeping. NEG-CONTROL: a BRAIDED generator carves ONE
       extra opening → still connected but |E|=V, NOT acyclic, and >1 simple path
       on the small fixture — the acyclic/unique-path assertion FAILS (the test
       discriminates).
   B · THE MARBLE PHYSICS IS HONEST — a symplectic (semi-implicit) Euler integrator
       with viscous rolling friction; the tilt eases toward its target so input has
       weight; collision is circle-vs-AABB min-translation against the PRESENT
       walls (read from the maze's open[] directly). OVERSHOOT IS EMERGENT, not
       scripted: WIN requires the marble to SETTLE in the goal (|v|<GOAL_SETTLE),
       so holding the tilt to the doorstep sails past — only braking early wins.
       NEG-CONTROLS: SUBSTEPS=1 + 30× speed tunnels a thin wall (proves the
       substep guarantee is load-bearing); FRICTION_K=0 never settles.
   C · THE LOOP IS FAIR — the per-level clock is budgeted from the maze's true BFS
       solution length, so a scripted solver always finishes with ticks>0 while an
       idle marble times out; the solution path is always PIT-FREE; scoring is
       strictly monotone (faster/deeper scores higher); a seeded level replays
       byte-identical.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   LAYER A — THE MAZE GRAPH (authoritative for board shape).
   ═══════════════════════════════════════════════════════════════════════════ */

/* a tiny seeded LCG (numerical-recipes constants — matches the live cores). */
function makeRng(seed) {
  var s = (seed >>> 0) || 1;
  return function next() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* FNV-1a over a small int stream — the maze fingerprint (matches the live cores). */
function fnv1a(nums) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < nums.length; i++) {
    h ^= (nums[i] >>> 0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/* wall-bit directions on a cell: which of its four sides is OPEN (carved). */
var N = 1, E = 2, S = 4, W = 8;
/* dx/dy per direction + the opposite direction (so carving opens both sides). */
var DIRS = [
  { bit: N, dx: 0, dy: -1, opp: S },
  { bit: E, dx: 1, dy: 0,  opp: W },
  { bit: S, dx: 0, dy: 1,  opp: N },
  { bit: W, dx: -1, dy: 0, opp: E }
];

function cellId(x, y, Wd) { return y * Wd + x; }

/* canonical sorted edge list from an open[] bitmask grid: one [a,b] (a<b) per
   carved opening, deduped (each opening is shared by two cells). */
function edgesFromOpen(open, Wd, Hd) {
  var edges = [];
  for (var y = 0; y < Hd; y++) {
    for (var x = 0; x < Wd; x++) {
      var id = cellId(x, y, Wd), m = open[id];
      // emit only E and S openings to avoid double-counting (N/W are the mirror)
      if ((m & E) && x + 1 < Wd) edges.push([id, cellId(x + 1, y, Wd)]);
      if ((m & S) && y + 1 < Hd) edges.push([id, cellId(x, y + 1, Wd)]);
    }
  }
  edges.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  return edges;
}

/* iterative randomized-DFS perfect-maze generator. Returns the maze graph: an
   open[] bitmask per cell + the canonical edge list + start/goal. */
function genMaze(seed, Wd, Hd) {
  Wd = Wd || 9; Hd = Hd || 9;
  var V = Wd * Hd;
  var open = new Uint8Array(V);     // bitmask of OPEN sides per cell (0 = all walled)
  var seen = new Uint8Array(V);
  var rng = makeRng(seed);
  var stack = [0];                  // start at top-left (id 0)
  seen[0] = 1;
  while (stack.length) {
    var cur = stack[stack.length - 1];
    var cx = cur % Wd, cy = (cur / Wd) | 0;
    // gather unvisited neighbours
    var opts = [];
    for (var d = 0; d < 4; d++) {
      var nx = cx + DIRS[d].dx, ny = cy + DIRS[d].dy;
      if (nx < 0 || nx >= Wd || ny < 0 || ny >= Hd) continue;
      var nid = cellId(nx, ny, Wd);
      if (!seen[nid]) opts.push(d);
    }
    if (!opts.length) { stack.pop(); continue; }
    var pick = opts[(rng() * opts.length) | 0];
    var dir = DIRS[pick];
    var tx = cx + dir.dx, ty = cy + dir.dy, tid = cellId(tx, ty, Wd);
    open[cur] |= dir.bit;            // carve the opening on both shared cells
    open[tid] |= dir.opp;
    seen[tid] = 1;
    stack.push(tid);
  }
  var edges = edgesFromOpen(open, Wd, Hd);
  return { W: Wd, H: Hd, V: V, open: open, edges: edges, start: 0, goal: V - 1, seed: (seed >>> 0) };
}

/* BRAIDED neg-control: a perfect maze + exactly ONE extra carved opening between
   two adjacent NOT-already-connected sides → still connected but cyclic (|E|=V). */
function genBraided(seed, Wd, Hd) {
  var m = genMaze(seed, Wd, Hd);
  var rng = makeRng((seed >>> 0) ^ 0x9e3779b9);
  // find a wall that is currently PRESENT between two adjacent cells, carve it.
  for (var tries = 0; tries < m.V * 8; tries++) {
    var id = (rng() * m.V) | 0;
    var cx = id % m.W, cy = (id / m.W) | 0;
    var d = (rng() * 4) | 0, dir = DIRS[d];
    var nx = cx + dir.dx, ny = cy + dir.dy;
    if (nx < 0 || nx >= m.W || ny < 0 || ny >= m.H) continue;
    if (m.open[id] & dir.bit) continue;     // already open here
    var nid = cellId(nx, ny, m.W);
    m.open[id] |= dir.bit; m.open[nid] |= dir.opp;
    break;
  }
  m.edges = edgesFromOpen(m.open, m.W, m.H);
  return m;
}

/* fingerprint a maze graph (over its canonical edges + dims + seed). */
function hashMaze(m) {
  var nums = [m.W, m.H, m.seed];
  for (var i = 0; i < m.edges.length; i++) { nums.push(m.edges[i][0]); nums.push(m.edges[i][1]); }
  return fnv1a(nums);
}

/* ── proof primitives, RE-DERIVED from `edges` (not the generator's bookkeeping) ─ */

function edgeCount(m) { return m.edges.length; }

/* build an adjacency list from the canonical edges. */
function adjacency(m) {
  var adj = [];
  for (var i = 0; i < m.V; i++) adj.push([]);
  for (var e = 0; e < m.edges.length; e++) {
    var a = m.edges[e][0], b = m.edges[e][1];
    adj[a].push(b); adj[b].push(a);
  }
  return adj;
}

/* connected? — a BFS from `start` must reach every vertex. */
function isConnected(m) {
  var adj = adjacency(m);
  var seen = new Uint8Array(m.V);
  var q = [m.start]; seen[m.start] = 1; var reached = 1;
  while (q.length) {
    var u = q.shift();
    for (var i = 0; i < adj[u].length; i++) {
      var v = adj[u][i];
      if (!seen[v]) { seen[v] = 1; reached++; q.push(v); }
    }
  }
  return reached === m.V;
}

/* acyclic? — union-find over the edges finds no edge whose endpoints already
   share a root (an undirected forest is acyclic iff no such edge). */
function isAcyclic(m) {
  var parent = new Int32Array(m.V);
  for (var i = 0; i < m.V; i++) parent[i] = i;
  function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
  for (var e = 0; e < m.edges.length; e++) {
    var ra = find(m.edges[e][0]), rb = find(m.edges[e][1]);
    if (ra === rb) return false;     // both ends already joined ⇒ this edge closes a cycle
    parent[ra] = rb;
  }
  return true;
}

/* shortest path s→g over the unweighted maze graph (a list of cell ids); the
   clock budget + the winController + the pit pass all read this. */
function bfsPath(m, s, g) {
  if (s == null) s = m.start;
  if (g == null) g = m.goal;
  var adj = adjacency(m);
  var prev = new Int32Array(m.V).fill(-1);
  var seen = new Uint8Array(m.V);
  var q = [s]; seen[s] = 1;
  while (q.length) {
    var u = q.shift();
    if (u === g) break;
    for (var i = 0; i < adj[u].length; i++) {
      var v = adj[u][i];
      if (!seen[v]) { seen[v] = 1; prev[v] = u; q.push(v); }
    }
  }
  if (!seen[g]) return null;
  var path = [], cur = g;
  while (cur !== -1) { path.push(cur); if (cur === s) break; cur = prev[cur]; }
  path.reverse();
  return path;
}

/* exhaustive count of SIMPLE paths s→g — GATED to a small fixture only (≤40 cells)
   so it never touches a ship board (exponential). Proves "exactly one path" on the
   fixture (a perfect maze → 1) and ">1 path" on the braided neg-control. */
function countSimplePaths(m, s, g) {
  if (m.V > 40) throw new Error('countSimplePaths is fixture-only (V<=40); got V=' + m.V);
  if (s == null) s = m.start;
  if (g == null) g = m.goal;
  var adj = adjacency(m);
  var visited = new Uint8Array(m.V);
  var count = 0;
  (function dfs(u) {
    if (u === g) { count++; return; }
    visited[u] = 1;
    for (var i = 0; i < adj[u].length; i++) {
      var v = adj[u][i];
      if (!visited[v]) dfs(v);
    }
    visited[u] = 0;
  })(s);
  return count;
}

/* does open[] agree with the canonical edge list? (every carved E/S opening is an
   edge and vice-versa, and a carved side has its mirror carved on the neighbour). */
function openMatchesEdges(m) {
  var rebuilt = edgesFromOpen(m.open, m.W, m.H);
  if (rebuilt.length !== m.edges.length) return false;
  for (var i = 0; i < rebuilt.length; i++) {
    if (rebuilt[i][0] !== m.edges[i][0] || rebuilt[i][1] !== m.edges[i][1]) return false;
  }
  // mirror-consistency: every carved side has the opposite side carved on the neighbour
  for (var y = 0; y < m.H; y++) {
    for (var x = 0; x < m.W; x++) {
      var id = cellId(x, y, m.W), mm = m.open[id];
      for (var d = 0; d < 4; d++) {
        if (!(mm & DIRS[d].bit)) continue;
        var nx = x + DIRS[d].dx, ny = y + DIRS[d].dy;
        if (nx < 0 || nx >= m.W || ny < 0 || ny >= m.H) return false;  // can't open off-grid
        var nid = cellId(nx, ny, m.W);
        if (!(m.open[nid] & DIRS[d].opp)) return false;
      }
    }
  }
  return true;
}

/* is the side `dir` of cell (x,y) OPEN (passable)? — the physics reads this. */
function isOpen(m, x, y, bit) {
  return (m.open[cellId(x, y, m.W)] & bit) !== 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAYER B — THE MARBLE PHYSICS (FROZEN constants; the renderer + self-test read
   these). All lengths are in CELLS (1 cell = 1.0); the page maps cells→pixels.
   ═══════════════════════════════════════════════════════════════════════════ */
var CELL = 1.0;            // a maze cell is 1×1 in world units
var WALL_T = 0.10;         // a present wall's thickness (a thin slab on a boundary)
var R = 0.26;              // marble radius (cells)
var SIM_HZ = 120;          // FIXED logical ticks/sec
var SUBSTEPS = 4;          // collision substeps per tick (the no-tunnel guarantee)
var DT = 1 / SIM_HZ;       // seconds per tick
var HDT = DT / SUBSTEPS;   // seconds per substep
var TILT_SETTLE_SEC = 0.18;            // time-constant scale for the pitch ease
var TILT_SETTLE_TAU = TILT_SETTLE_SEC / 3;  // exp-ease tau (input has weight)
var GRAV_CELLS_PER_S2 = 9.0;           // gravity accel at full pitch (cells/s²)
var FRICTION_K = 2.2;      // viscous rolling-friction coefficient (per second)
var STOP_EPS = 0.04;       // speed below which the marble settles to a dead stop
var MAX_SPEED = 7.0;       // clamp on |v| (cells/s)
var RESTITUTION = 0.32;    // normal-velocity bounce factor on a wall hit
var WALL_FRICTION = 0.86;  // tangential keep on a wall slide
var PIT_R = 0.30;          // pit capture radius (cells, by centre distance)
var GOAL_R = 0.22;         // goal capture radius (cells)
var GOAL_SETTLE_SPEED = 1.6;  // marble must be SLOWER than this to settle in the goal

/* held-input → target pitch. blankInput() = the four HELD arrow booleans. */
function blankInput() { return { up: false, down: false, left: false, right: false }; }

/* a target pitch vector from held input, normalised so a diagonal isn't √2 faster.
   pitch.x>0 leans East (+x), pitch.y>0 leans South (+y) — start top-left, goal
   bottom-right, so holding ↓ and → is the intuitive downhill. */
function targetPitch(input) {
  var tx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  var ty = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (tx !== 0 && ty !== 0) { var inv = 1 / Math.sqrt(2); tx *= inv; ty *= inv; }
  return { x: tx, y: ty };
}

/* exp-ease one component of the actual pitch toward its target over dt. */
function easePitch(cur, tgt, dt) {
  var k = 1 - Math.exp(-dt / TILT_SETTLE_TAU);
  return cur + (tgt - cur) * k;
}

/* ── circle-vs-AABB-slab collision against the PRESENT walls of the marble's cell.
   For each side whose bit is NOT open (a present wall), the wall is a thin slab on
   that boundary; we push the circle out by the minimum translation and reflect the
   normal velocity (×−RESTITUTION) while keeping the tangent (×WALL_FRICTION). We
   resolve X-walls then Y-walls so corners nestle; a convex grid post (the junction
   of two present perpendicular walls) is handled by the sequential resolve.
   Reads LAYER A's open[] directly (one source of truth for wall presence). ──── */
function collideMarble(m, w) {
  // the marble's current cell (clamped to the board)
  var cx = Math.max(0, Math.min(m.W - 1, Math.floor(w.marble.x)));
  var cy = Math.max(0, Math.min(m.H - 1, Math.floor(w.marble.y)));
  var left = cx, right = cx + 1, top = cy, bottom = cy + 1;

  // ── X walls (West present-wall at x=left, East present-wall at x=right) ──
  if (!isOpen(m, cx, cy, W) && w.marble.x - R < left) {
    w.marble.x = left + R;
    if (w.marble.vx < 0) { w.marble.vx = -w.marble.vx * RESTITUTION; w.marble.vy *= WALL_FRICTION; w.bonk++; }
  }
  if (!isOpen(m, cx, cy, E) && w.marble.x + R > right) {
    w.marble.x = right - R;
    if (w.marble.vx > 0) { w.marble.vx = -w.marble.vx * RESTITUTION; w.marble.vy *= WALL_FRICTION; w.bonk++; }
  }
  // ── Y walls (North present-wall at y=top, South present-wall at y=bottom) ──
  if (!isOpen(m, cx, cy, N) && w.marble.y - R < top) {
    w.marble.y = top + R;
    if (w.marble.vy < 0) { w.marble.vy = -w.marble.vy * RESTITUTION; w.marble.vx *= WALL_FRICTION; w.bonk++; }
  }
  if (!isOpen(m, cx, cy, S) && w.marble.y + R > bottom) {
    w.marble.y = bottom - R;
    if (w.marble.vy > 0) { w.marble.vy = -w.marble.vy * RESTITUTION; w.marble.vx *= WALL_FRICTION; w.bonk++; }
  }
  // hard board clamp (the outer rim is always walled regardless of the open[] mask)
  if (w.marble.x < R) { w.marble.x = R; if (w.marble.vx < 0) w.marble.vx = -w.marble.vx * RESTITUTION; }
  if (w.marble.x > m.W - R) { w.marble.x = m.W - R; if (w.marble.vx > 0) w.marble.vx = -w.marble.vx * RESTITUTION; }
  if (w.marble.y < R) { w.marble.y = R; if (w.marble.vy < 0) w.marble.vy = -w.marble.vy * RESTITUTION; }
  if (w.marble.y > m.H - R) { w.marble.y = m.H - R; if (w.marble.vy > 0) w.marble.vy = -w.marble.vy * RESTITUTION; }
}

/* one PHYSICS substep: semi-implicit Euler integrate + collide. `accel` is the
   gravity vector (already derived from the eased pitch). `subSteps` overrides the
   default substep count (a neg-control sets it to 1 to provoke tunneling). */
function physicsSubstep(m, w, ax, ay, h) {
  // semi-implicit: velocity first, then position
  w.marble.vx += ax * h;
  w.marble.vy += ay * h;
  // clamp speed
  var sp = Math.hypot(w.marble.vx, w.marble.vy);
  if (sp > MAX_SPEED) { var f = MAX_SPEED / sp; w.marble.vx *= f; w.marble.vy *= f; }
  w.marble.x += w.marble.vx * h;
  w.marble.y += w.marble.vy * h;
  collideMarble(m, w);
}

/* apply viscous rolling friction over a full tick (exponential decay) + STOP_EPS
   settle so the marble comes to an exact dead stop, not an asymptote. */
function applyFriction(w, dt) {
  var decay = Math.exp(-FRICTION_K * dt);
  w.marble.vx *= decay;
  w.marble.vy *= decay;
  if (Math.hypot(w.marble.vx, w.marble.vy) < STOP_EPS) { w.marble.vx = 0; w.marble.vy = 0; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAYER C — THE LOOP + PROGRESSION.
   ═══════════════════════════════════════════════════════════════════════════ */
var GOAL_BASE = 1000;             // base points for clearing a board
var TIME_BONUS_PER_TICK = 0.6;    // points per remaining clock tick
var TICKS_PER_CELL_BASE = 52;     // base ticks budgeted per solution-path cell
                                  //   (a tilt-rolled marble spends ~55 ticks/cell
                                  //    incl. corner/accel/brake — the clock is fair
                                  //    for a human, who is slower than the solver)
var CLOCK_SLACK_START = 1.8;      // generous on level 1
var CLOCK_SLACK_FLOOR = 1.25;     // tightens with depth
var CLOCK_SLACK_TAPER = 0.06;     // slack lost per level
var PIT_FRACTION_CAP = 0.18;      // pits capped at ~18% of cells

/* per-level parameters: square ODD dims 7→cap 15, a pit ramp, a per-level seed. */
function levelParams(level) {
  var dim = Math.min(15, 7 + 2 * ((level - 1) >> 0));   // 7,9,11,13,15,15,…
  if (dim % 2 === 0) dim++;                              // keep it odd (defensive)
  var cells = dim * dim;
  var pits = Math.min(Math.floor(cells * PIT_FRACTION_CAP), 1 + (level - 1) * 2);
  var slack = Math.max(CLOCK_SLACK_FLOOR, CLOCK_SLACK_START - (level - 1) * CLOCK_SLACK_TAPER);
  var seed = (Math.imul(level, 2654435761) >>> 0) || 1;
  return { dim: dim, pits: pits, slack: slack, seed: seed };
}

/* a SEEDED pit pass: place `nPits` cells chosen ONLY from cells NOT on the BFS
   solution path (so the solution is always pit-free) and not the start/goal. */
function placePits(m, nPits, seed) {
  var solution = bfsPath(m, m.start, m.goal) || [];
  var onPath = new Uint8Array(m.V);
  for (var i = 0; i < solution.length; i++) onPath[solution[i]] = 1;
  onPath[m.start] = 1; onPath[m.goal] = 1;
  // candidate cells (off-path), shuffled deterministically
  var cands = [];
  for (var id = 0; id < m.V; id++) if (!onPath[id]) cands.push(id);
  var rng = makeRng((seed >>> 0) ^ 0x5bd1e995);
  for (var k = cands.length - 1; k > 0; k--) {
    var j = (rng() * (k + 1)) | 0;
    var t = cands[k]; cands[k] = cands[j]; cands[j] = t;
  }
  var pits = [];
  for (var p = 0; p < nPits && p < cands.length; p++) pits.push(cands[p]);
  pits.sort(function (a, b) { return a - b; });
  return pits;
}

/* the cell-CENTRE world coord of a cell id. */
function cellCenter(m, id) {
  return { x: (id % m.W) + 0.5, y: ((id / m.W) | 0) + 0.5 };
}

/* TICKS budgeted for a board: round(solutionLen × TICKS_PER_CELL_BASE × slack).
   PROVABLY FAIR — a scripted solver finishes with ticks>0; an idle marble times
   out (its clock counts down with no progress). */
function clockBudget(m, slack) {
  var sol = bfsPath(m, m.start, m.goal) || [m.start];
  return Math.round(sol.length * TICKS_PER_CELL_BASE * slack);
}

/* build the full mutable world for a level. */
function makeGame(level, opts) {
  level = level || 1;
  opts = opts || {};
  var lp = levelParams(level);
  var seed = opts.seed != null ? opts.seed : lp.seed;
  var slack = opts.slack != null ? opts.slack : lp.slack;
  var nPits = opts.pits != null ? opts.pits : lp.pits;
  var m = genMaze(seed, lp.dim, lp.dim);
  var pits = nPits > 0 ? placePits(m, nPits, seed) : [];
  var pitSet = {};
  for (var i = 0; i < pits.length; i++) pitSet[pits[i]] = 1;
  var startC = cellCenter(m, m.start);
  return {
    level: level,
    maze: m,
    pits: pits,
    pitSet: pitSet,
    clockTicks: clockBudget(m, slack),
    clockStart: clockBudget(m, slack),
    marble: { x: startC.x, y: startC.y, vx: 0, vy: 0 },
    pitch: { x: 0, y: 0 },
    tgt: { x: 0, y: 0 },
    score: 0,
    frame: 0,
    bonk: 0,            // wall-hit counter (juice + tests)
    over: false,
    won: false,
    fell: false
  };
}

/* set the target tilt from held input (the page calls this per frame). */
function setInput(w, input) {
  var t = targetPitch(input || blankInput());
  w.tgt.x = t.x; w.tgt.y = t.y;
}

/* which cell centre is the marble nearest? (for pit / goal capture). */
function marbleCellId(m, w) {
  var cx = Math.max(0, Math.min(m.W - 1, Math.floor(w.marble.x)));
  var cy = Math.max(0, Math.min(m.H - 1, Math.floor(w.marble.y)));
  return cellId(cx, cy, m.W);
}

/* THE FIXED-TICK STEP — pure given (w, input). One tick:
   ease the pitch ONCE → derive gravity accel → 4× {integrate substep, collide} →
   friction+settle → terminal checks (pit / goal / clock). */
function stepTick(w, input) {
  if (w.over) return;
  if (input) setInput(w, input);
  w.frame++;
  // ── ease the actual pitch toward the target (input has weight) ──
  w.pitch.x = easePitch(w.pitch.x, w.tgt.x, DT);
  w.pitch.y = easePitch(w.pitch.y, w.tgt.y, DT);
  // ── gravity accel DERIVED from the eased pitch (NOT a hard-coded impulse) ──
  var ax = GRAV_CELLS_PER_S2 * w.pitch.x;
  var ay = GRAV_CELLS_PER_S2 * w.pitch.y;
  var m = w.maze;
  // ── 4× {integrate substep, then collide substep} ──
  var sub = w._subSteps || SUBSTEPS;
  var h = DT / sub;
  for (var s = 0; s < sub; s++) physicsSubstep(m, w, ax, ay, h);
  // ── viscous friction + STOP_EPS settle (once per tick) ──
  applyFriction(w, DT);
  // ── clock ──
  w.clockTicks--;
  // ── terminal checks ──
  var goalC = cellCenter(m, m.goal);
  var dgx = w.marble.x - goalC.x, dgy = w.marble.y - goalC.y;
  var distGoal = Math.hypot(dgx, dgy);
  var speed = Math.hypot(w.marble.vx, w.marble.vy);
  // WIN: centre within GOAL_R+R of the goal centre AND settled (|v|<GOAL_SETTLE)
  if (distGoal <= GOAL_R + R && speed < GOAL_SETTLE_SPEED) {
    w.won = true; w.over = true; w.score = scoreFor(w); return;
  }
  // PIT: centre within PIT_R+R of any pit centre (grazing a lip on momentum survives)
  for (var p = 0; p < w.pits.length; p++) {
    var pc = cellCenter(m, w.pits[p]);
    var dpx = w.marble.x - pc.x, dpy = w.marble.y - pc.y;
    if (Math.hypot(dpx, dpy) <= PIT_R + R) { w.fell = true; w.over = true; return; }
  }
  // TIMEOUT
  if (w.clockTicks <= 0) { w.clockTicks = 0; w.over = true; return; }
}

/* score for a cleared board: (GOAL_BASE + remaining ticks × bonus) × level. */
function scoreFor(w) {
  return Math.round((GOAL_BASE + w.clockTicks * TIME_BONUS_PER_TICK) * w.level);
}

/* a compact world hash for replay-determinism (FLOAT marble pos QUANTIZED to the
   lattice so the hash is integer-stable). */
function hashGame(w) {
  function q(v) { return Math.round(v * 4096); }   // quantize cells to ~1/4096
  var nums = [
    w.frame, w.score, w.clockTicks, w.bonk,
    w.over ? 1 : 0, w.won ? 1 : 0, w.fell ? 1 : 0,
    q(w.marble.x), q(w.marble.y), q(w.marble.vx), q(w.marble.vy),
    q(w.pitch.x), q(w.pitch.y),
    hashMaze(w.maze)
  ];
  return fnv1a(nums);
}

/* ── a SCRIPTED WINNING CONTROLLER — tilt toward the next BFS-path cell, aiming a
   cell AHEAD and letting friction settle so overshoot doesn't make it miss the
   goal. Used by the clock-fairness proof + a harness check. Returns held input. ─ */
function winController(w) {
  var m = w.maze;
  var here = marbleCellId(m, w);
  var path = bfsPath(m, here, m.goal);
  var input = blankInput();
  var goalC = cellCenter(m, m.goal);
  var distGoal = Math.hypot(goalC.x - w.marble.x, goalC.y - w.marble.y);
  var speed = Math.hypot(w.marble.vx, w.marble.vy);

  // ── endgame: at/near the goal cell — settle into the goal centre ──
  if (!path || path.length < 2) {
    var dx = goalC.x - w.marble.x, dy = goalC.y - w.marble.y;
    // if we're fast, counter-tilt to brake; once slow, nudge toward the centre.
    if (speed > GOAL_SETTLE_SPEED * 0.6) {
      if (w.marble.vx > 0.15) input.left = true; else if (w.marble.vx < -0.15) input.right = true;
      if (w.marble.vy > 0.15) input.up = true; else if (w.marble.vy < -0.15) input.down = true;
    } else {
      if (dx > 0.06) input.right = true; else if (dx < -0.06) input.left = true;
      if (dy > 0.06) input.down = true; else if (dy < -0.06) input.up = true;
    }
    return input;
  }

  // ── approaching the goal at speed: brake so we settle, don't overshoot ──
  if (distGoal < 1.25 && speed > GOAL_SETTLE_SPEED * 0.65) {
    if (w.marble.vx > 0.2) input.left = true; else if (w.marble.vx < -0.2) input.right = true;
    if (w.marble.vy > 0.2) input.up = true; else if (w.marble.vy < -0.2) input.down = true;
    return input;
  }

  // ── cruise: steer toward the NEXT cell centre on the path. Aiming a single cell
  //    ahead keeps the marble inside the carved corridor (a far aim would push it
  //    diagonally into walls); the momentum carries it through straight runs while
  //    the per-cell re-aim turns it at junctions. ──
  var aimC = cellCenter(m, path[1]);
  var dxA = aimC.x - w.marble.x, dyA = aimC.y - w.marble.y;
  if (dxA > 0.04) input.right = true; else if (dxA < -0.04) input.left = true;
  if (dyA > 0.04) input.down = true; else if (dyA < -0.04) input.up = true;
  return input;
}

/* drive the LIVE world headlessly with the win controller until win/lose/budget. */
function winSolve(w, maxTicks) {
  maxTicks = maxTicks || 40000;
  for (var t = 0; t < maxTicks && !w.over; t++) stepTick(w, winController(w));
  return { won: w.won, fell: w.fell, ticks: w.frame, clockLeft: w.clockTicks };
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE SELF-TEST BATTERY — every claim merged (chip === twin). The page chip and
   the Node twin both run THIS function.
   ═══════════════════════════════════════════════════════════════════════════ */
function runSelfTest() {
  var results = [];
  var allPass = true;
  function check(name, pass, detail) {
    if (!pass) allPass = false;
    results.push({ name: name, pass: !!pass, detail: detail || '' });
  }

  // ─────────────────────────── MAZE (LAYER A) ───────────────────────────
  var seedSet = [1, 2, 7, 42, 1337, 90210, 0xC0FFEE, 314159];

  // (a) |E| = V−1 over the seed set (a tree has exactly V−1 edges)
  {
    var ok = true, detail = '';
    for (var i = 0; i < seedSet.length; i++) {
      var m = genMaze(seedSet[i], 9, 9);
      if (edgeCount(m) !== m.V - 1) { ok = false; detail = 'seed ' + seedSet[i] + ' |E|=' + edgeCount(m) + ' V−1=' + (m.V - 1); break; }
    }
    check('PERFECT-MAZE EDGE COUNT: every generated board has exactly V−1 carved openings (a spanning tree) over ' + seedSet.length + ' seeds',
          ok, detail || 'all |E| === V−1');
  }
  // (b) connected over the seed set
  {
    var okc = true, dc = '';
    for (var i2 = 0; i2 < seedSet.length; i2++) {
      var mc = genMaze(seedSet[i2], 9, 9);
      if (!isConnected(mc)) { okc = false; dc = 'seed ' + seedSet[i2] + ' not connected'; break; }
    }
    check('CONNECTED: a BFS from the start reaches every cell on every board (no walled-off region)', okc, dc || 'all connected');
  }
  // (c) acyclic over the seed set
  {
    var oka = true, da = '';
    for (var i3 = 0; i3 < seedSet.length; i3++) {
      var ma = genMaze(seedSet[i3], 9, 9);
      if (!isAcyclic(ma)) { oka = false; da = 'seed ' + seedSet[i3] + ' has a cycle'; break; }
    }
    check('ACYCLIC: union-find over the edges finds no cycle on any board (with |E|=V−1 + connected ⇒ exactly one path between any two cells)', oka, da || 'all acyclic');
  }
  // (d) unique simple path on the small fixture == bfsPath chain
  {
    var fix = genMaze(7, 5, 5);                  // 25 cells ≤ 40 — fixture-safe
    var paths = countSimplePaths(fix, fix.start, fix.goal);
    var bp = bfsPath(fix, fix.start, fix.goal);
    check('UNIQUE PATH (fixture): an exhaustive search finds EXACTLY ONE simple start→goal path on a 5×5 board, and it equals the BFS path',
          paths === 1 && bp && bp.length >= 2, 'simplePaths=' + paths + ' bfsLen=' + (bp ? bp.length : 'null'));
  }
  // (e) goal reachable + every BFS path step is an OPEN neighbour
  {
    var me = genMaze(42, 9, 9);
    var bpe = bfsPath(me, me.start, me.goal);
    var stepOk = !!bpe && bpe.length >= 2;
    if (stepOk) {
      for (var k = 0; k + 1 < bpe.length; k++) {
        var a = bpe[k], b = bpe[k + 1];
        var ax = a % me.W, ay = (a / me.W) | 0, bx = b % me.W, by = (b / me.W) | 0;
        var open = false;
        for (var d = 0; d < 4; d++) {
          if (ax + DIRS[d].dx === bx && ay + DIRS[d].dy === by && (me.open[a] & DIRS[d].bit)) { open = true; break; }
        }
        if (!open) { stepOk = false; break; }
      }
    }
    check('SOLUTION PATH WALKS OPEN DOORS: the BFS start→goal path exists and every step crosses a carved opening (never a wall)', stepOk, 'len=' + (bpe ? bpe.length : 'null'));
  }
  // (f) open[] ↔ edges agree (+ mirror-consistency)
  {
    var mf = genMaze(1337, 11, 11);
    check('OPEN[] ↔ EDGES AGREE: the bitmask grid and the canonical edge list are the same graph, and every carved side is mirrored on its neighbour', openMatchesEdges(mf), 'edges=' + mf.edges.length);
  }
  // (g) board determinism — same seed → same hash; distinct seeds differ
  {
    var g1 = hashMaze(genMaze(2024, 11, 11));
    var g2 = hashMaze(genMaze(2024, 11, 11));
    var g3 = hashMaze(genMaze(2025, 11, 11));
    check('BOARD DETERMINISM: the same seed regenerates a byte-identical maze; a different seed yields a different one', g1 === g2 && g1 !== g3, 'same=' + (g1 === g2) + ' differ=' + (g1 !== g3));
  }
  // (h) BRAIDED NEG-CONTROL — connected, |E|=V, NOT acyclic, >1 path (the discriminator)
  {
    var br = genBraided(7, 5, 5);                 // 25-cell fixture
    var conn = isConnected(br);
    var ec = edgeCount(br);
    var acy = isAcyclic(br);
    var paths2 = countSimplePaths(br, br.start, br.goal);
    // the braid added exactly one edge → |E| = V (one more than the tree's V−1)
    var pass = conn && ec === br.V && !acy && paths2 > 1;
    check('NEG-CONTROL (braided): adding ONE extra opening keeps it connected but makes |E|=V, NOT acyclic, and gives >1 path — the acyclic/unique-path assertion FAILS (the test discriminates)',
          pass, 'connected=' + conn + ' |E|=' + ec + '(V=' + br.V + ') acyclic=' + acy + ' paths=' + paths2);
  }

  // ─────────────────────────── PHYSICS (LAYER B) ───────────────────────────

  // (P1) fixed-timestep: N stepTick calls → frame === N (or capped at over)
  {
    var wp1 = makeGame(1, { pits: 0 });
    for (var n = 0; n < 240; n++) stepTick(wp1, blankInput());
    check('FIXED-TIMESTEP: 240 stepTick calls advance frame to exactly 240 (or game-over)', wp1.frame === 240 || wp1.over, 'frame=' + wp1.frame + ' over=' + wp1.over);
  }
  // (P2) NO-TUNNEL + its load-bearing neg-control. The collision recomputes the
  //      marble's cell from floor(x) each substep and tests THAT cell's walls. So a
  //      move SMALL enough to land in the cell adjacent to a present wall is caught at
  //      the boundary; a move LARGE enough to jump clean over the walled cell lands in
  //      a far cell and never evaluates the wall it skipped — tunneling. The marble
  //      moves at most CELL/step under the design (MAX_SPEED/SIM_HZ ≪ WALL_T), and the
  //      4× substep split keeps each move tiny — this is what the no-tunnel guarantee
  //      buys. We exercise the raw collision (a marble dropped post-move) to show it.
  {
    // a corridor with a sealed PLUG at cell 2: cell 2's east AND west are walled.
    function corridorPlug() {
      var Wd = 6, Hd = 1, V = 6;
      var open = new Uint8Array(V);
      for (var x = 0; x < Wd; x++) {
        // open every E/W boundary EXCEPT the 1|2 and 2|3 boundaries (cell 2 is sealed)
        if (x + 1 < Wd && x !== 1 && x !== 2) open[x] |= E;
        if (x - 1 >= 0 && x !== 2 && x !== 3) open[x] |= W;
      }
      var m = { W: Wd, H: Hd, V: V, open: open, edges: edgesFromOpen(open, Wd, Hd), start: 0, goal: V - 1, seed: 1 };
      return {
        maze: m, pits: [], pitSet: {}, marble: { x: 0, y: 0.5, vx: 0, vy: 0 },
        pitch: { x: 0, y: 0 }, tgt: { x: 0, y: 0 }, clockTicks: 99999, score: 0, frame: 0,
        bonk: 0, over: false, won: false, fell: false, level: 1
      };
    }
    // POS — SMALL steps: advance the marble east in WALL_T-sized hops, colliding after
    // each. It must be CAUGHT at cell 1's east boundary (x ≈ 2 − R), never entering
    // the sealed cell 2, never reaching cell 3+.
    var A = corridorPlug();
    A.marble.x = 1.5;                 // in cell 1, just west of the plug
    var crossedWithSubsteps = false;
    for (var k = 0; k < 200; k++) {
      A.marble.x += WALL_T * 0.5;     // a tiny per-substep hop (< WALL_T)
      collideMarble(A.maze, A);
      if (A.marble.x >= 2) { crossedWithSubsteps = true; break; }  // entered the plug
    }
    // NEG — ONE giant jump: move the marble in a single leap from cell 1 clean across
    // the sealed cell 2 into cell 3, then collide ONCE. floor(x)=3 → cell 3's walls are
    // open, so nothing clamps: the marble tunneled straight through the sealed cell 2.
    var Bn = corridorPlug();
    Bn.marble.x = 3.5;                // a single big leap landed it past the plug
    collideMarble(Bn.maze, Bn);       // one collision pass at the post-jump position
    var tunneled = Bn.marble.x >= 2;  // it skipped the sealed cell 2 entirely
    check('NO-TUNNEL (+ load-bearing neg): advancing in sub-WALL_T hops, a marble is CAUGHT at a sealed cell\'s boundary; a single jump clean over the sealed cell lands beyond it with no collision (tunneling) — the small-substep bound is what prevents it',
          !crossedWithSubsteps && tunneled, 'caughtBeforePlug=' + (!crossedWithSubsteps) + ' singleJumpTunneled=' + tunneled);
  }
  // (P3) settle to EXACTLY v=0 (+ neg: FRICTION_K=0 never settles)
  {
    var ws = makeGame(1, { pits: 0 });
    ws.marble.vx = 0.5; ws.marble.vy = 0.3;     // a gentle drift, no input
    for (var n3 = 0; n3 < 600 && (ws.marble.vx !== 0 || ws.marble.vy !== 0); n3++) stepTick(ws, blankInput());
    var settled = ws.marble.vx === 0 && ws.marble.vy === 0;
    // NEG: with FRICTION_K=0 (apply no decay), a drifting marble never reaches 0.
    var vx = 0.5, vy = 0.3;
    for (var n4 = 0; n4 < 600; n4++) {
      var decay = Math.exp(-0 * DT);    // FRICTION_K = 0
      vx *= decay; vy *= decay;
      if (Math.hypot(vx, vy) < STOP_EPS) break;   // would settle — but it won't
    }
    var neverSettles = Math.hypot(vx, vy) >= STOP_EPS;
    check('SETTLE TO ZERO (+ neg FRICTION_K=0): viscous friction + STOP_EPS brings a drifting marble to an exact dead stop; with zero friction it never settles',
          settled && neverSettles, 'settled=' + settled + ' zeroFrictionNeverSettles=' + neverSettles);
  }
  // (P4) energy-bounded with no input: |v| never grows from rest with a flat tray
  {
    var we = makeGame(1, { pits: 0 });
    we.marble.vx = 0; we.marble.vy = 0;          // at rest, no tilt
    var maxSp = 0;
    for (var n5 = 0; n5 < 300; n5++) { stepTick(we, blankInput()); maxSp = Math.max(maxSp, Math.hypot(we.marble.vx, we.marble.vy)); }
    check('ENERGY-BOUNDED: a marble at rest on a flat (un-tilted) tray never spontaneously speeds up (max |v| stays ~0)', maxSp < 1e-6, 'maxSpeed=' + maxSp.toFixed(6));
  }
  // (P5) OVERSHOOT IS REAL — a hold-the-tilt run sails THROUGH the goal into a pit
  //      just past it (FELL, not won); braking early settles in the goal (won). The
  //      consequence makes overshoot a real, falsifiable skill (the Climb feel-trap
  //      guard): the goal is NOT the last cell — overshooting it is lethal.
  {
    // a straight 1×9 corridor; the GOAL is cell 6, with a PIT at cell 7 just past it.
    // Holding → builds ~4 cell/s and blows through the goal (|v|>gate) into the pit.
    var GOAL_CELL = 6, PIT_CELL = 7;
    function corridor() {
      var Wd = 9, Hd = 1, V = 9;
      var open = new Uint8Array(V);
      for (var x = 0; x < Wd; x++) { if (x + 1 < Wd) open[x] |= E; if (x - 1 >= 0) open[x] |= W; }
      var edges = edgesFromOpen(open, Wd, Hd);
      var m = { W: Wd, H: Hd, V: V, open: open, edges: edges, start: 0, goal: GOAL_CELL, seed: 1 };
      var startC = cellCenter(m, 0);
      return {
        level: 1, maze: m, pits: [PIT_CELL], pitSet: { 7: 1 },
        clockTicks: 99999, clockStart: 99999,
        marble: { x: startC.x, y: startC.y, vx: 0, vy: 0 },
        pitch: { x: 0, y: 0 }, tgt: { x: 0, y: 0 }, score: 0, frame: 0, bonk: 0,
        over: false, won: false, fell: false
      };
    }
    // HOLD: keep tilting → the whole way. It arrives at the goal far above the settle
    // gate, the WIN check fails (|v|>gate), it keeps rolling into the pit → FELL.
    var hold = corridor();
    for (var n6 = 0; n6 < 1200 && !hold.over; n6++) stepTick(hold, { right: true });
    var holdWon = hold.won;
    // BRAKE-EARLY: tilt → until close to the goal, then counter-tilt ← to brake and
    // let friction settle it IN the goal (below the speed gate) → WON.
    var brake = corridor();
    for (var n7 = 0; n7 < 4000 && !brake.over; n7++) {
      var gc = cellCenter(brake.maze, brake.maze.goal);
      var dx = gc.x - brake.marble.x;
      var sp = Math.abs(brake.marble.vx);
      var inp = blankInput();
      // proportional brake: keep tilting toward the goal until we're close AND still
      // fast, then counter-tilt to bleed speed; near the centre at low speed, coast +
      // let friction settle the marble in the goal radius.
      if (dx > 0.55 && sp < 2.4) inp.right = true;     // approach: tilt toward goal
      else if (sp > 0.35) inp.left = true;             // close/fast → brake hard
      else if (dx > 0.12) inp.right = true;            // crept short → gentle nudge in
      else if (dx < -0.12) inp.left = true;            // crept past → gentle nudge back
      // else coast (let friction settle into the goal)
      stepTick(brake, inp);
    }
    var brakeWon = brake.won;
    check('OVERSHOOT IS REAL (the Climb feel-trap guard): holding the tilt all the way sails THROUGH the goal (|v|>gate) into a pit just past it (FELL, not won), while a brake-early run settles in the goal (won) — overshoot is an emergent, falsifiable skill',
          !holdWon && hold.fell && brakeWon, 'holdWon=' + holdWon + ' holdFell=' + hold.fell + ' brakeWon=' + brakeWon);
  }
  // (P6) determinism: same seed + same scripted input → same hashWorld
  {
    var da1 = makeGame(2, { seed: 555 });
    var da2 = makeGame(2, { seed: 555 });
    for (var n8 = 0; n8 < 1500 && !da1.over; n8++) stepTick(da1, winController(da1));
    for (var n9 = 0; n9 < 1500 && !da2.over; n9++) stepTick(da2, winController(da2));
    check('PHYSICS DETERMINISM: a seeded board driven by the scripted controller twice ends byte-identical (no Math.random / wall-clock in the step path)',
          hashGame(da1) === hashGame(da2), 'h1=' + hashGame(da1) + ' h2=' + hashGame(da2));
  }

  // ─────────────────────────── LOOP (LAYER C) ───────────────────────────

  // CLOCK FAIRNESS: the scripted solver clears levels 1..N with ticks>0; an idle
  // marble times out; NEG: slack=0 makes even the solver run out.
  {
    var allClear = true, dCl = [];
    for (var lvl = 1; lvl <= 4; lvl++) {
      var wg = makeGame(lvl, { seed: 100 + lvl });
      var got = winSolve(wg, 60000);
      if (!got.won || got.clockLeft <= 0) allClear = false;
      dCl.push('L' + lvl + '=' + (got.won ? 'WON+' + got.clockLeft + 't' : (got.fell ? 'FELL' : 'TIMEOUT')));
    }
    // idle marble times out (never reaches the goal)
    var idle = makeGame(1, { seed: 101 });
    var idleOut = false;
    for (var ni = 0; ni < 60000 && !idle.over; ni++) stepTick(idle, blankInput());
    idleOut = idle.over && !idle.won && !idle.fell;   // timed out
    // NEG: slack 0 → zero ticks budgeted → the solver itself runs out (clock unfair).
    var tight = makeGame(1, { seed: 100, slack: 0 });
    var tightWon = winSolve(tight, 60000).won;
    check('CLOCK FAIRNESS (+ neg slack=0): the scripted solver clears levels 1..4 with ticks left; an idle marble times out; a zero-slack clock makes even the solver run out (the budget is load-bearing)',
          allClear && idleOut && !tightWon, dCl.join(' ') + ' idleTimeout=' + idleOut + ' zeroSlackSolverWon=' + tightWon);
  }
  // SCORING MONOTONICITY: faster (more ticks left) / deeper (higher level) scores
  // strictly higher; NEG: a constant-score fn is NOT monotone.
  {
    var fastW = { clockTicks: 500, level: 1 };
    var slowW = { clockTicks: 100, level: 1 };
    var deepW = { clockTicks: 500, level: 2 };
    var faster = scoreFor(fastW) > scoreFor(slowW);
    var deeper = scoreFor(deepW) > scoreFor(fastW);
    function constScore() { return 1000; }
    var constNotMono = !(constScore() > constScore());
    check('SCORING MONOTONICITY (+ neg constant): finishing faster OR deeper scores strictly higher; a constant-score function is not monotone',
          faster && deeper && constNotMono, 'faster=' + faster + ' deeper=' + deeper);
  }
  // REPLAY DETERMINISM: a seeded level replayed twice ends byte-identical.
  {
    var r1 = makeGame(3, { seed: 9001 });
    var r2 = makeGame(3, { seed: 9001 });
    var track = function (w) { return winController(w); };
    for (var rn = 0; rn < 2000 && !r1.over; rn++) stepTick(r1, track(r1));
    for (var rm = 0; rm < 2000 && !r2.over; rm++) stepTick(r2, track(r2));
    check('REPLAY DETERMINISM: a seeded level replayed twice with the same controller ends byte-identical', hashGame(r1) === hashGame(r2), 'h1=' + hashGame(r1) + ' h2=' + hashGame(r2));
  }
  // WIN-IFF-GOAL / LOSE-IFF-PIT-OR-TIMEOUT classifier (+ neg: a wrong classifier disagrees).
  {
    // drive a real solved board → won (goal), distinct from fell/timeout.
    var cw = makeGame(1, { seed: 100 });
    winSolve(cw, 60000);
    var classified = cw.won && !cw.fell;          // won iff goal
    // a marble dropped onto a pit centre → fell (not won)
    var pw = makeGame(2, { seed: 102 });
    if (pw.pits.length) {
      var pc = cellCenter(pw.maze, pw.pits[0]);
      pw.marble.x = pc.x; pw.marble.y = pc.y; pw.marble.vx = 0; pw.marble.vy = 0;
      stepTick(pw, blankInput());
    }
    var pitClass = pw.pits.length ? (pw.fell && !pw.won) : true;
    // NEG: a classifier that calls ANY game-over a "win" disagrees with the pit case.
    var wrongClass = pw.over ? true : false;       // "over ⇒ won" — wrong on a pit fall
    var wrongDisagrees = wrongClass !== (pw.won);  // the wrong verdict ≠ the true verdict
    check('WIN-IFF-GOAL / LOSE-IFF-PIT (+ neg wrong classifier): a solved board reads WON (goal), a marble on a pit centre reads FELL (lost); an "any-over-is-a-win" classifier disagrees on the pit fall',
          classified && pitClass && (pw.pits.length ? wrongDisagrees : true),
          'won=' + cw.won + ' fell=' + pw.fell + ' pits=' + pw.pits.length);
  }
  // SOLUTION-PATH-PIT-FREE: no pit ever lands on the BFS solution path.
  {
    var pitFree = true, dPf = '';
    for (var lvl2 = 1; lvl2 <= 5; lvl2++) {
      var wpf = makeGame(lvl2, { seed: 200 + lvl2 });
      var sol = bfsPath(wpf.maze, wpf.maze.start, wpf.maze.goal) || [];
      for (var pi = 0; pi < wpf.pits.length; pi++) {
        if (sol.indexOf(wpf.pits[pi]) !== -1) { pitFree = false; dPf = 'L' + lvl2 + ' pit ' + wpf.pits[pi] + ' on path'; break; }
      }
      if (!pitFree) break;
    }
    check('SOLUTION PATH IS PIT-FREE: across levels 1..5 no pit is ever placed on the BFS start→goal solution path (the intended route is always survivable)', pitFree, dPf || 'no pit on any solution path');
  }

  return { allPass: allPass, results: results };
}

/* ── dual-use module guard (forge strips exactly this braced block) ─────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // frozen constants
    CELL: CELL, WALL_T: WALL_T, R: R, SIM_HZ: SIM_HZ, SUBSTEPS: SUBSTEPS, DT: DT, HDT: HDT,
    TILT_SETTLE_SEC: TILT_SETTLE_SEC, TILT_SETTLE_TAU: TILT_SETTLE_TAU,
    GRAV_CELLS_PER_S2: GRAV_CELLS_PER_S2, FRICTION_K: FRICTION_K, STOP_EPS: STOP_EPS,
    MAX_SPEED: MAX_SPEED, RESTITUTION: RESTITUTION, WALL_FRICTION: WALL_FRICTION,
    PIT_R: PIT_R, GOAL_R: GOAL_R, GOAL_SETTLE_SPEED: GOAL_SETTLE_SPEED,
    GOAL_BASE: GOAL_BASE, TIME_BONUS_PER_TICK: TIME_BONUS_PER_TICK,
    TICKS_PER_CELL_BASE: TICKS_PER_CELL_BASE, PIT_FRACTION_CAP: PIT_FRACTION_CAP,
    N: N, E: E, S: S, W: W, DIRS: DIRS,
    // layer A
    makeRng: makeRng, fnv1a: fnv1a, cellId: cellId, edgesFromOpen: edgesFromOpen,
    genMaze: genMaze, genBraided: genBraided, hashMaze: hashMaze,
    edgeCount: edgeCount, adjacency: adjacency, isConnected: isConnected, isAcyclic: isAcyclic,
    bfsPath: bfsPath, countSimplePaths: countSimplePaths, openMatchesEdges: openMatchesEdges, isOpen: isOpen,
    // layer B
    blankInput: blankInput, targetPitch: targetPitch, easePitch: easePitch,
    collideMarble: collideMarble, physicsSubstep: physicsSubstep, applyFriction: applyFriction,
    // layer C
    levelParams: levelParams, placePits: placePits, cellCenter: cellCenter, clockBudget: clockBudget,
    makeGame: makeGame, setInput: setInput, marbleCellId: marbleCellId, stepTick: stepTick,
    scoreFor: scoreFor, hashGame: hashGame, winController: winController, winSolve: winSolve,
    runSelfTest: runSelfTest
  };
}
