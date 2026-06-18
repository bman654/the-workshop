// === CORE BEGIN ===
// The Warehouse — Sokoban math core (single source of truth).
// A push-only crate puzzle: walk the porter, shove crates onto every goal. A
// crate can ONLY be pushed, never pulled — so a crate shoved into a corner is
// welded there forever, and a room can become genuinely UNWINNABLE while every
// move you made was legal. This module is the SOLE authority for:
//   • the breadth-first SOLVER over (player-reachable-region, sorted crate-set)
//     that proves a board winnable in N pushes — or PROVES it unwinnable (the
//     search exhausts the reachable state-space with no goal-cover), and
//   • the CONSERVATIVE static deadlock detector (corner + cluster/wall-line
//     freeze), which is SOUND: every state it flags as frozen is truly dead.
// It is inlined byte-identical into warehouse.html between the CORE BEGIN /
// CORE END sentinels, and tested by warehouse.core.test.mjs — page & test can't
// drift. All boards are hand-authored, so there is no RNG and no generator.

// ── board parse ───────────────────────────────────────────────────────────
// A board is an array of equal-length strings. Legend (Sokoban-standard):
//   '#' wall · ' ' floor · '.' goal-floor · '@' player · '$' crate
//   '*' crate-on-goal · '+' player-on-goal · 'G' alias for goal-floor
// Cells are indexed y*W+x. Returns the STATIC immutable structure plus the
// start placement: { W,H,walls:Uint8Array, goals:Set<int>, start:{player,crates:int[]} }.
// walls/goals never change during play; only player + crate positions move.
function parseBoard(rows) {
  const H = rows.length;
  const W = Math.max(...rows.map(r => r.length));
  const walls = new Uint8Array(W * H);
  const goals = new Set();
  let player = -1;
  const crates = [];
  for (let y = 0; y < H; y++) {
    const row = rows[y];
    for (let x = 0; x < W; x++) {
      const ch = x < row.length ? row[x] : ' ';
      const i = y * W + x;
      switch (ch) {
        case '#': walls[i] = 1; break;
        case '.': case 'G': goals.add(i); break;
        case '@': player = i; break;
        case '+': player = i; goals.add(i); break;
        case '$': crates.push(i); break;
        case '*': crates.push(i); goals.add(i); break;
        case ' ': break;
        default: break;
      }
    }
  }
  crates.sort((a, b) => a - b);
  return { W, H, walls, goals, start: { player, crates } };
}

// neighbour cell in direction d (0=up,1=down,2=left,3=right); -1 if off-grid.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function nbr(b, cell, d) {
  const x = cell % b.W, y = (cell / b.W) | 0;
  const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
  if (nx < 0 || ny < 0 || nx >= b.W || ny >= b.H) return -1;
  return ny * b.W + nx;
}
const isWall = (b, cell) => cell < 0 || b.walls[cell] === 1;

// ── reachable region ────────────────────────────────────────────────────────
// The set of cells the porter can stand on starting from `player`, walking over
// free floor only (walls AND crates block). BFS. Returns a Set<int>.
function region(b, player, crates) {
  const blocked = new Set(crates);
  const seen = new Set();
  if (isWall(b, player) || blocked.has(player)) return seen;
  const q = [player]; seen.add(player);
  while (q.length) {
    const cur = q.shift();
    for (let d = 0; d < 4; d++) {
      const n = nbr(b, cur, d);
      if (n < 0 || isWall(b, n) || blocked.has(n) || seen.has(n)) continue;
      seen.add(n); q.push(n);
    }
  }
  return seen;
}

// Canonical key for a search state: the player is NORMALIZED to the minimum cell
// of its reachable region (so every player position in the same region collapses
// to one equivalence class), joined with the sorted crate-set.
function ckey(reg, crates) {
  let mn = Infinity;
  for (const c of reg) if (c < mn) mn = c;
  return mn + '|' + crates.join(',');
}

// ── push-only successor generator ───────────────────────────────────────────
// For each crate × direction d: the porter must stand on the OPPOSITE cell
// (crate-d) — which must be floor AND inside the current region — and the
// destination (crate+d) must be in-bounds floor AND unoccupied by another crate.
// On a legal push the crate moves +d and the porter lands on the crate's OLD
// cell. There is NEVER a pull edge — that asymmetry IS the soul of the puzzle.
// Returns [{ crateIdx, dir, crates:newSortedCrates, player:oldCrateCell }, ...].
function pushSucc(b, reg, crates) {
  const occupied = new Set(crates);
  const succ = [];
  for (let k = 0; k < crates.length; k++) {
    const c = crates[k];
    for (let d = 0; d < 4; d++) {
      const behind = nbr(b, c, d ^ 1);     // d^1 flips up<->down, left<->right
      const ahead = nbr(b, c, d);
      if (behind < 0 || isWall(b, behind) || occupied.has(behind) || !reg.has(behind)) continue;
      if (ahead < 0 || isWall(b, ahead) || occupied.has(ahead)) continue;
      const next = crates.slice();
      next[k] = ahead;
      next.sort((a, z) => a - z);
      succ.push({ crateIdx: k, dir: d, crates: next, player: c });
    }
  }
  return succ;
}

// every goal covered by a crate?
function won(b, crates) {
  if (crates.length < b.goals.size) return false;
  for (const g of b.goals) if (!crates.includes(g)) return false;
  return true;
}

// ── conservative static deadlock detector ───────────────────────────────────
// Returns { dead:bool, frozenCrates:[cellIdx] }. A non-goal crate frozen on BOTH
// axes is dead. A crate is frozen on an axis if a wall sits on EITHER side of
// that axis, OR the neighbour on that axis is itself a crate that is frozen on
// the PERPENDICULAR axis (cluster / wall-line). Mutual recursion is memoized;
// a cycle resolves to "not yet proven frozen" (conservative — never over-claims).
// CRITICAL: a crate sitting ON a goal is never flagged — a goal in a corner is
// SOLVED, not dead. If ANY non-goal crate is frozen on both axes the room is dead.
function deadInfo(b, crates) {
  const crateSet = new Set(crates);
  // memo[cell] per axis: undefined=unknown, 'computing'=on stack, true/false=result
  const memoH = new Map(), memoV = new Map();

  // is the crate at `cell` frozen on the given axis? axis 0 = vertical (up/down),
  // axis 1 = horizontal (left/right). dirs for that axis:
  function frozenOnAxis(cell, axis) {
    const memo = axis === 0 ? memoV : memoH;
    const m = memo.get(cell);
    if (m === 'computing') return false;      // cycle ⇒ not proven frozen
    if (m !== undefined) return m;
    memo.set(cell, 'computing');
    const dA = axis === 0 ? 0 : 2;            // up / left
    const dB = axis === 0 ? 1 : 3;            // down / right
    const nA = nbr(b, cell, dA), nB = nbr(b, cell, dB);
    // wall on either side of this axis ⇒ frozen on this axis
    let frozen = isWall(b, nA) || isWall(b, nB);
    // else: if a neighbour on this axis is a crate frozen on the PERPENDICULAR
    // axis, this crate can't move along this axis either.
    if (!frozen) {
      const perp = axis ^ 1;
      if (crateSet.has(nA) && frozenOnAxis(nA, perp)) frozen = true;
      else if (crateSet.has(nB) && frozenOnAxis(nB, perp)) frozen = true;
    }
    memo.set(cell, frozen);
    return frozen;
  }

  const frozenCrates = [];
  for (const c of crates) {
    if (b.goals.has(c)) continue;             // a crate on a goal is never dead
    if (frozenOnAxis(c, 0) && frozenOnAxis(c, 1)) frozenCrates.push(c);
  }
  return { dead: frozenCrates.length > 0, frozenCrates };
}
function isDeadlocked(b, crates) { return deadInfo(b, crates).dead; }

// ── the BFS solver ───────────────────────────────────────────────────────────
// Breadth-first over canonical push-states. Returns { len, expanded, exhausted }:
//   len = the shortest PUSH count to cover all goals (NOT keystrokes), or -1 if
//   the reachable push-state space drains with no goal-cover (the unwinnability
//   PROOF). useDeadlock only PRUNES dead branches — it can never change `len` on
//   a winnable board because the detector is SOUND (flagged ⊆ truly-dead). The
//   BFS also records a predecessor chain (used by showPath).
function solve(b, useDeadlock = true) {
  const start = b.start;
  if (won(b, start.crates)) return { len: 0, expanded: 0, exhausted: false, parent: new Map(), goalKey: null };
  const reg0 = region(b, start.player, start.crates);
  const k0 = ckey(reg0, start.crates);
  const dist = new Map([[k0, 0]]);
  const parent = new Map([[k0, null]]);   // key -> { prevKey, crateIdx, dir }
  const stateOf = new Map([[k0, { player: start.player, crates: start.crates }]]);
  const q = [k0];
  let expanded = 0, head = 0;
  while (head < q.length) {
    const key = q[head++];
    expanded++;
    const st = stateOf.get(key);
    const reg = region(b, st.player, st.crates);
    for (const mv of pushSucc(b, reg, st.crates)) {
      if (useDeadlock && isDeadlocked(b, mv.crates)) continue;
      const nreg = region(b, mv.player, mv.crates);
      const nk = ckey(nreg, mv.crates);
      if (dist.has(nk)) continue;
      dist.set(nk, dist.get(key) + 1);
      parent.set(nk, { prevKey: key, crateIdx: mv.crateIdx, dir: mv.dir, player: mv.player, crates: mv.crates });
      stateOf.set(nk, { player: mv.player, crates: mv.crates });
      if (won(b, mv.crates)) {
        return { len: dist.get(nk), expanded, exhausted: false, parent, goalKey: nk, stateOf };
      }
      q.push(nk);
    }
  }
  return { len: -1, expanded, exhausted: true, parent, goalKey: null, stateOf };
}

// ── live-play step (the page's SOLE authority for a keypress) ────────────────
// Walk the porter one cell in dir d from `state`={player,crates}. If a crate is
// directly ahead and the cell BEYOND it is free floor, push the crate (porter
// follows). If a wall or an immovable crate blocks the porter, moved:false.
// Returns { moved, pushed, crateIdx, next:{player,crates} }.
function step(state, dir, b) {
  const ahead = nbr(b, state.player, dir);
  if (ahead < 0 || isWall(b, ahead)) {
    return { moved: false, pushed: false, crateIdx: -1, next: state };
  }
  const ci = state.crates.indexOf(ahead);
  if (ci === -1) {
    // free floor ahead — just walk
    return { moved: true, pushed: false, crateIdx: -1, next: { player: ahead, crates: state.crates } };
  }
  // a crate is ahead — can it be pushed?
  const beyond = nbr(b, ahead, dir);
  if (beyond < 0 || isWall(b, beyond) || state.crates.includes(beyond)) {
    return { moved: false, pushed: false, crateIdx: -1, next: state };  // blocked
  }
  const crates = state.crates.slice();
  crates[ci] = beyond;
  crates.sort((a, z) => a - z);
  return { moved: true, pushed: true, crateIdx: ci, next: { player: ahead, crates } };
}

// ── show-me path ─────────────────────────────────────────────────────────────
// Derive an optimal solution as a list of porter STEP directions (walks + pushes)
// from solve()'s BFS predecessor chain. Between two consecutive push-states we
// BFS a walk path through the region to bring the porter to the push's launch
// cell, then emit the push direction itself. Returns [dir,...] of single-cell
// porter moves, or [] if the board is unwinnable.
function showPath(b) {
  const res = solve(b, true);
  if (res.exhausted || res.goalKey == null) return [];
  // reconstruct the push sequence (each: launch cell = behind, dir, then porter
  // ends on the crate's old cell).
  const pushes = [];
  let key = res.goalKey;
  while (key && res.parent.get(key)) {
    const p = res.parent.get(key);
    pushes.push(p);
    key = p.prevKey;
  }
  pushes.reverse();
  // walk the porter from start, expanding each push into walk-steps + the shove.
  const steps = [];
  let player = b.start.player;
  let crates = b.start.crates.slice();
  for (const p of pushes) {
    // the crate that gets pushed in dir p.dir: its OLD cell is one step before
    // p.player along p.dir... actually p.player IS the crate's old cell (porter
    // lands there). The launch cell (where the porter must stand to push) is the
    // cell BEHIND the crate = one step opposite p.dir from p.player.
    const oldCrate = p.player;                    // crate's pre-push cell
    const launch = nbr(b, oldCrate, p.dir ^ 1);   // porter must stand here
    const walk = bfsWalk(b, player, launch, crates);
    if (walk == null) return [];                  // shouldn't happen on a solved chain
    for (const d of walk) steps.push(d);
    steps.push(p.dir);                            // the shove
    // apply the push to local state
    const ci = crates.indexOf(oldCrate);
    crates[ci] = nbr(b, oldCrate, p.dir);
    crates.sort((a, z) => a - z);
    player = oldCrate;
  }
  return steps;
}
// BFS a walk path (list of step dirs) for the porter from `from` to `to` over
// free floor (crates block). Returns [dir,...] or null if unreachable.
function bfsWalk(b, from, to, crates) {
  if (from === to) return [];
  const blocked = new Set(crates);
  const prev = new Map([[from, null]]);
  const q = [from]; let head = 0;
  while (head < q.length) {
    const cur = q[head++];
    for (let d = 0; d < 4; d++) {
      const n = nbr(b, cur, d);
      if (n < 0 || isWall(b, n) || blocked.has(n) || prev.has(n)) continue;
      prev.set(n, { cell: cur, dir: d });
      if (n === to) {
        const path = [];
        let c = n;
        while (prev.get(c)) { path.push(prev.get(c).dir); c = prev.get(c).cell; }
        return path.reverse();
      }
      q.push(n);
    }
  }
  return null;
}

// ── authored boards (all BFS-verified) ───────────────────────────────────────
const L1 = { name: 'The Single Crate', rows: ['#######', '#     #', '# @$ .#', '#     #', '#######'] };       // 2 pushes
const L2 = { name: 'Two Pads', rows: ['########', '#  .   #', '# $$ . #', '#  @   #', '########'] };           // 4 pushes
const L3 = { name: 'Around the Corner', rows: ['#######', '#.    #', '#.$ $ #', '#   @ #', '#######'] };       // 5 pushes
const NEG1 = { name: 'Frozen Corner', rows: ['#######', '#$    #', '#  @  #', '#    .#', '#######'] };          // unwinnable: crate starts frozen in corner
const NEG2 = { name: 'Sealed Pad', rows: ['#######', '#     #', '# ### #', '# #.# #', '# ### #', '#@ $  #', '#######'] }; // unwinnable by global BFS, no local freeze

const LEVELS = [L1, L2, L3, NEG2];
const POS_BOARD = L1.rows;
const POS_PUSHES = 2;
const NEG_BOARD = NEG1.rows;
// === CORE END ===

export { parseBoard, region, pushSucc, solve, isDeadlocked, deadInfo, step, showPath, won, LEVELS, POS_BOARD, POS_PUSHES, NEG_BOARD };
