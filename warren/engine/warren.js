/* ═══════════════════════════════════════════════════════════════════════════
   WARREN — the estate's SECOND game engine. A DIFFERENT VERB than Lantern:
   in Lantern you carry-a-thing / set-a-flag; in Warren, WHERE YOU STAND on a
   discrete grid is the whole game. You move on tiles in a strict turn economy —
   you act, THEN the monster steps once by its fixed deterministic rule — and a
   FLOOR is PURE DATA: a future maker ships a floor by writing only data, never
   engine code.

   This is the CANONICAL engine source, mirroring adventure/engine/lantern.js:
   it is BOTH Node-requireable (a DOM-free pure core + solver, exported via
   module.exports — used headless to PROVE a floor survivable before it ships)
   AND inline-able into a shipped page (the export guard is stripped per
   ADVENTURE.SPEC §5; the page adds its own renderer).

   Three layers, in order:
     1. PURE MODEL  — initState / cloneState / legalActions / apply / isWin /
                      stateKey. No DOM, no time, no RNG. Serialisable & deterministic.
                      The monster is a pure function patrolAt(floor, phase).
     2. SOLVER      — BFS over canonical (x, y, phase mod period) keys: SURVIVABLE
                      + SHORTEST survivable path, a determinism spot-check, totality,
                      the load-bearing NEGATIVE-CONTROL discrimination, AND the
                      no-softlock REVERSE-REACHABILITY check (every reachable live
                      state can still reach the exit) grafted from Explorer 2.
                      solverPlayer(floor, fromState) solves from a LIVE state, not
                      a fresh reset — so the in-page hint / "let the solver walk it"
                      continue from wherever the player is standing.
   (3. RENDERER lives in the shipped page, not here — this file stays DOM-free.)
   ═══════════════════════════════════════════════════════════════════════════ */

const WARREN_VERSION = '1.0';

/* ───────────────────────────────────────────────────────────────────────────
   1. THE PURE MODEL

   A FLOOR is pure data (see warren/floors/*.json + the schema comment there):
     { id, name, w, h, grid:[strings], start:[x,y], exit:[x,y],
       hazards:[[x,y]...]        — tiles lethal ONLY while a patrol stands on them
       patrol:{ path:[[x,y]...], start:phaseIndex, mode:'pingpong'|'loop' }
       meta?:{ accent, caption }  — optional renderer theming (ignored by the core) }
   grid chars:  '#'=wall  '.'=floor  (start/exit/hazard are overlaid from coords)

   STATE = { x, y, phase, turns }.
     phase is the monster's index along its derived FULL CYCLE (see patrolCycle).
     Because the monster NEVER reacts to the player, its position is a pure
     function of phase — the whole monster "AI" is one lookup. That is what keeps
     the game tree finite & small: |states| <= floorTiles * cycleLength.

   stateKey MUST include phase (mod the patrol period); turns is excluded (it
   affects nothing about reachability). IF a future floor adds a step-budget /
   timer / stateful tile, the key MUST grow to include it too, or BFS will dedupe
   two genuinely-different worlds as one. (See warren/SPEC.md, future benches.)
   ─────────────────────────────────────────────────────────────────────────── */

// Expand an authored patrol path into the FULL deterministic cycle of positions.
//   pingpong:  A B C  ->  A B C B   (bounce; period 2*(n-1))
//   loop:      A B C  ->  A B C     (wrap; period n)
function patrolCycle(patrol) {
  const p = patrol && patrol.path;
  if (!p || p.length === 0) return [];
  if (p.length === 1) return [p[0].slice()];
  if (patrol.mode === 'loop') return p.map(c => c.slice());
  // pingpong (default): forward then back, excluding the repeated endpoints
  const fwd = p.map(c => c.slice());
  const back = p.slice(1, -1).reverse().map(c => c.slice());
  return fwd.concat(back);
}

function patrolAt(floor, phase) {
  const cyc = floor._cycle || (floor._cycle = patrolCycle(floor.patrol));
  if (cyc.length === 0) return null;
  return cyc[((phase % cyc.length) + cyc.length) % cyc.length];
}
function patrolPeriod(floor) {
  const cyc = floor._cycle || (floor._cycle = patrolCycle(floor.patrol));
  return cyc.length;
}

function isWall(floor, x, y) {
  if (x < 0 || y < 0 || x >= floor.w || y >= floor.h) return true;
  return floor.grid[y][x] === '#';
}
function isHazard(floor, x, y) {
  const set = floor._hazSet || (floor._hazSet = new Set((floor.hazards || []).map(c => c[0] + ',' + c[1])));
  return set.has(x + ',' + y);
}

function initState(floor) {
  return { x: floor.start[0], y: floor.start[1], phase: (floor.patrol.start | 0), turns: 0 };
}
function cloneState(s) { return { x: s.x, y: s.y, phase: s.phase, turns: s.turns }; }

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// legalActions: a move is legal if its destination tile is in-bounds & not a wall.
// 'wait' is ALWAYS legal — stillness is a first-class move (the Warren's verb).
// TOTALITY: this never returns empty for an in-bounds, non-walled cell, because
// 'wait' is unconditionally present.
function legalActions(floor, s) {
  const acts = ['wait'];
  for (const d in DIRS) {
    const nx = s.x + DIRS[d][0], ny = s.y + DIRS[d][1];
    if (!isWall(floor, nx, ny)) acts.push(d);
  }
  return acts;
}

// CAUGHT: you die if, AFTER the monster steps, you SHARE a HAZARD tile with it.
// Outside the hazard corridor the patrol is scenery — you may stand beside it
// safely; the danger is the guarded corridor only. We also forbid the SWAP — you
// and the monster trading places across one hazard edge in a single turn — so you
// can't tunnel through it. Checked on the post-step positions plus the swap test
// against the pre-step positions.
function caught(floor, beforePat, s, prevX, prevY, afterPat) {
  if (!afterPat) return false;
  // co-occupation on a hazard tile
  if (s.x === afterPat[0] && s.y === afterPat[1] && isHazard(floor, s.x, s.y)) return true;
  // swap across a hazard edge
  if (beforePat && prevX != null &&
      s.x === beforePat[0] && s.y === beforePat[1] &&
      prevX === afterPat[0] && prevY === afterPat[1] &&
      (isHazard(floor, s.x, s.y) || isHazard(floor, prevX, prevY))) return true;
  return false;
}

// apply: resolve ONE turn. PLAYER acts first, THEN the monster steps once.
// Returns { state, dead }. PURE — never mutates the input.
function apply(floor, s, action) {
  const beforePat = patrolAt(floor, s.phase);
  const ns = cloneState(s);
  const prevX = s.x, prevY = s.y;
  if (action !== 'wait') {
    const d = DIRS[action];
    if (d) {
      const nx = ns.x + d[0], ny = ns.y + d[1];
      if (!isWall(floor, nx, ny)) { ns.x = nx; ns.y = ny; }
    }
  }
  ns.phase = s.phase + 1;            // monster steps exactly once, deterministically
  ns.turns = s.turns + 1;
  const afterPat = patrolAt(floor, ns.phase);
  const dead = caught(floor, beforePat, ns, prevX, prevY, afterPat);
  return { state: ns, dead };
}

function isWin(floor, s) { return s.x === floor.exit[0] && s.y === floor.exit[1]; }

// Canonical dedupe key: (x, y, phase mod period). turns is EXCLUDED.
function stateKey(floor, s) {
  const per = patrolPeriod(floor) || 1;
  return s.x + ',' + s.y + ',' + (((s.phase % per) + per) % per);
}

// Prepare a floor's derived caches (cycle + hazard set). Idempotent; safe to call
// on a JSON-parsed floor before solving or rendering.
function prepFloor(floor) {
  floor._cycle = patrolCycle(floor.patrol);
  floor._hazSet = new Set((floor.hazards || []).map(c => c[0] + ',' + c[1]));
  return floor;
}

/* ───────────────────────────────────────────────────────────────────────────
   2. THE SOLVER

   solveFrom(floor, fromState): BFS over canonical keys from `fromState`, never
   expanding a state reached by a CAUGHT transition (a death is a leaf). Returns:
     { survivable, path, statesExplored, period, deterministicOK, totalityOK,
       softlock, errors }
   survivable  — a step/wait interleaving from `fromState` reaches the exit alive.
   path        — the SHORTEST such interleaving (list of actions); [] if none.
   softlock    — true iff a reachable LIVE (non-caught) state can no longer reach
                 the exit (reverse-reachability; grafted from Explorer 2). A shipped
                 floor must be softlock-free: every place you can legally get to must
                 still be winnable, so the only way to lose is a death you walked into.

   The NEGATIVE CONTROL relies on survivable===false being REACHABLE for a floor
   whose patrol tiles the only crossing: no step/wait timing escapes it → false →
   the floor is REJECTED, never shipped. That the solver can say NO is the proof it
   isn't rubber-stamping YES.
   ─────────────────────────────────────────────────────────────────────────── */
function solveFrom(floor, fromState) {
  const errors = [];
  prepFloor(floor);

  // static sanity
  if (isWall(floor, floor.start[0], floor.start[1])) errors.push('start is a wall');
  if (isWall(floor, floor.exit[0], floor.exit[1])) errors.push('exit is a wall');
  if (patrolPeriod(floor) === 0) errors.push('patrol has no path');

  const start = cloneState(fromState);
  const startKey = stateKey(floor, start);
  const queue = [start];
  const seen = new Map();   // key -> state
  const prev = new Map();   // key -> { fromKey, action }
  seen.set(startKey, start);
  prev.set(startKey, null);

  let winKey = null;
  let deterministicOK = true, determChecked = false;
  let totalityOK = true;

  while (queue.length) {
    const s = queue.shift();
    const sKey = stateKey(floor, s);
    if (isWin(floor, s)) { winKey = winKey || sKey; continue; } // first found = shortest; don't expand a win

    const acts = legalActions(floor, s);
    if (acts.length === 0) totalityOK = false;  // must never empty (wait guarantees >= 1)

    for (const a of acts) {
      const r1 = apply(floor, s, a);
      // determinism spot-check: same state + action twice -> identical key
      if (!determChecked) {
        const r2 = apply(floor, s, a);
        if (stateKey(floor, r2.state) !== stateKey(floor, r1.state)) deterministicOK = false;
        determChecked = true;
      }
      if (r1.dead) continue;                 // never expand a death — it's a leaf
      const k1 = stateKey(floor, r1.state);
      if (!seen.has(k1)) {
        seen.set(k1, r1.state);
        prev.set(k1, { fromKey: sKey, action: a });
        queue.push(r1.state);
      }
    }
  }

  const survivable = winKey != null;
  let path = [];
  if (survivable) {
    let k = winKey;
    while (prev.get(k)) { const st = prev.get(k); path.push(st.action); k = st.fromKey; }
    path.reverse();
  }

  // ── No-softlock (REVERSE reachability) — grafted from Explorer 2's discipline.
  //    Every reachable LIVE state must still be able to reach a win along
  //    caught-free edges. Caught states are excluded (a death you walk into is a
  //    legitimate loss, not a softlock). Only meaningful when survivable.
  let softlock = false;
  if (survivable) {
    // forward live-edge adjacency over the states BFS already discovered
    const fwd = new Map();
    for (const [k, st] of seen) {
      const outs = [];
      for (const a of legalActions(floor, st)) {
        const r = apply(floor, st, a);
        if (r.dead) continue;                // death edge — not a survivable transition
        outs.push(stateKey(floor, r.state));
      }
      fwd.set(k, outs);
    }
    // reverse it, then flood backward from every win
    const rev = new Map();
    for (const [k, outs] of fwd) {
      if (!rev.has(k)) rev.set(k, []);
      for (const o of outs) { if (!rev.has(o)) rev.set(o, []); rev.get(o).push(k); }
    }
    const canWin = new Set();
    const stack = [];
    for (const [k, st] of seen) { if (isWin(floor, st)) { canWin.add(k); stack.push(k); } }
    while (stack.length) {
      const k = stack.pop();
      for (const p of (rev.get(k) || [])) { if (!canWin.has(p)) { canWin.add(p); stack.push(p); } }
    }
    const stranded = [];
    for (const k of seen.keys()) { if (!canWin.has(k)) stranded.push(k); }
    if (stranded.length) {
      softlock = true;
      errors.push('Softlock: ' + stranded.length + ' reachable live state(s) cannot reach the exit. e.g. ' + stranded[0]);
    }
  }

  return {
    survivable, path,
    statesExplored: seen.size,
    period: patrolPeriod(floor),
    deterministicOK, totalityOK, softlock,
    errors,
  };
}

// solve(floor): the canonical solve from the floor's START state (the ship-gate).
function solve(floor) { return solveFrom(floor, initState(prepFloor(floor))); }

// solverPlayer(floor, fromState): the shortest survivable action list from a LIVE
// state — used by the in-page hint and "let the solver walk it" so they continue
// from where the player is standing, not from a fresh reset. Returns [] if the
// live state is already lost (no caught-free path remains).
function solverPlayer(floor, fromState) {
  const r = solveFrom(prepFloor(floor), fromState);
  return r.survivable ? r.path : [];
}

/* ───────────────────────────────────────────────────────────────────────────
   Built-in floors (resolved at require/inline time). A shipped page replaces
   THE_CROSSING / THE_PINCER with its inlined floor data; the Node twin imports
   them from the data files. Kept here as a convenience so the engine is testable
   standalone, but the canonical floor data lives in warren/floors/*.json.
   ─────────────────────────────────────────────────────────────────────────── */

/* Node-requireable export (the whole block is stripped when inlined per
   ADVENTURE.SPEC §5). */
const WARREN = {
  WARREN_VERSION,
  patrolCycle, patrolAt, patrolPeriod, isWall, isHazard, prepFloor,
  initState, cloneState, legalActions, apply, isWin, stateKey,
  solve, solveFrom, solverPlayer,
  DIRS,
};
if (typeof module !== 'undefined' && module.exports) { module.exports = WARREN; }
