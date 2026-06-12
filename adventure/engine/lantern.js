/* ═══════════════════════════════════════════════════════════════════════════
   LANTERN — a tiny engine for hand-made interactive adventures.

   This file is the CANONICAL engine source. It is BOTH:
     • Node-requireable — a pure, DOM-free core + solver, exported via module.exports
       (used headless to PROVE a world winnable & softlock-free before it ships).
     • Self-initializing in a browser — if a `document` exists, it attaches the
       point-and-click UI on DOMContentLoaded. (A shipped tale inlines this file
       with the `module.exports` guard stripped; see ADVENTURE.SPEC.md §5.)

   The contract is ADVENTURE.SPEC.md. The world-file (worlds/<id>.js) is pure data;
   this engine interprets exactly the DSL in §2, and the solver verifies §3.

   Three layers, in order:
     1. PURE MODEL  — initState / legalActions / apply / isWin / stateKey.
                      No DOM, no time, no RNG. Fully serialisable. Deterministic.
     2. SOLVER + PLAYERS — BFS over canonical state keys: winnable + shortest path,
                      reachable map + static validation, no-softlock (reverse
                      reachability), determinism spot-check, totality. Players are
                      just functions (solver / seeded-random / an llm stub).
     3. RENDERER    — the dark, lantern-lit chrome (scene art registry, prose,
                      exits, inventory, context action bar). Browser-only.
   ═══════════════════════════════════════════════════════════════════════════ */

const LANTERN_VERSION = '1.0';

/* ───────────────────────────────────────────────────────────────────────────
   1. THE PURE MODEL
   State = { room, place:{thingId→loc}, flags:Set, firstSeen:Set, moves }.
   `place` maps a thing id to its current location: a roomId | 'inv' | '_gone'.
   `flags` is the set of set flags. `firstSeen` tracks first-visited rooms (so
   desc [first,repeat] picks the right line) PLUS private once-keys (prefixed
   'once:' / 'onceEnter:') so `once` handlers are idempotent and serialisable.
   ─────────────────────────────────────────────────────────────────────────── */

function initState(world) {
  const place = {};
  for (const id in world.things) {
    place[id] = world.things[id].at; // a roomId | 'inv' | '_gone'
  }
  return {
    room: world.start,
    place,
    flags: new Set(),
    firstSeen: new Set(), // becomes non-empty as soon as we describe the start room
    moves: 0,
  };
}

/* Deep, value-only clone of a state (no shared Sets/objects). */
function cloneState(s) {
  return {
    room: s.room,
    place: Object.assign({}, s.place),
    flags: new Set(s.flags),
    firstSeen: new Set(s.firstSeen),
    moves: s.moves,
  };
}

/* Canonical dedupe key (ADVENTURE.SPEC.md §3): room | sorted(place entries that
   differ from default) | sorted(flags). `firstSeen` and `moves` are deliberately
   EXCLUDED — they affect only prose/animation, never reachability — so BFS dedupes
   on the genuine world-state and the space stays bounded for a hand-sized world.
   (once-keys live in firstSeen and so are also excluded; a `once` handler only
   ever runs effects on its first success, so its post-state is captured by the
   flags/place it set — no semantic divergence is lost.) */
function stateKey(world, state) {
  const def = stateKey._defaults || (stateKey._defaults = new WeakMap());
  let d = def.get(world);
  if (!d) {
    d = {};
    for (const id in world.things) d[id] = world.things[id].at;
    def.set(world, d);
  }
  const placeParts = [];
  for (const id in state.place) {
    if (state.place[id] !== d[id]) placeParts.push(id + '@' + state.place[id]);
  }
  placeParts.sort();
  const flags = Array.from(state.flags).sort();
  return state.room + '|' + placeParts.join(',') + '|' + flags.join(',');
}

/* ── Guard evaluation (§2.3). All clauses AND together; array values mean "all". */
function asList(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }

function guardHolds(world, state, guard) {
  if (!guard) return true;
  for (const id of asList(guard.has)) {
    if (state.place[id] !== 'inv') return false;
  }
  for (const id of asList(guard.lacks)) {
    if (state.place[id] === 'inv') return false;
  }
  for (const f of asList(guard.flag)) {
    if (!state.flags.has(f)) return false;
  }
  for (const f of asList(guard.noflag)) {
    if (state.flags.has(f)) return false;
  }
  if (guard.at != null && state.room !== guard.at) return false;
  if (guard.thingAt != null) {
    const [thing, loc] = guard.thingAt;
    if (state.place[thing] !== loc) return false;
  }
  return true;
}

/* The set of guard-clause keys and effect keys the engine implements — used by
   the totality check (§3.5) so a world can never lean on a DSL feature we no-op. */
const GUARD_CLAUSES = new Set(['has', 'lacks', 'flag', 'noflag', 'at', 'thingAt']);
const EFFECT_KEYS = new Set(['take', 'drop', 'move', 'gone', 'flag', 'unflag', 'goto', 'win']);

/* ── Effect application (§2.4), in order, mutating a (cloned) state. */
function applyEffects(world, state, effects) {
  for (const eff of asList(effects)) {
    if ('take' in eff) state.place[eff.take] = 'inv';
    else if ('drop' in eff) state.place[eff.drop] = state.room;
    else if ('move' in eff) state.place[eff.move[0]] = eff.move[1];
    else if ('gone' in eff) state.place[eff.gone] = '_gone';
    else if ('flag' in eff) state.flags.add(eff.flag);
    else if ('unflag' in eff) state.flags.delete(eff.unflag);
    else if ('goto' in eff) state.room = eff.goto;
    else if ('win' in eff) state.flags.add(world.win.flag);
    // unknown effects are caught statically by the totality check, never here.
  }
}

/* Normalize a verb/useOn handler: a bare string is pure narration (look-style). */
function asHandler(h) {
  return (typeof h === 'string') ? { say: h } : (h || {});
}

/* Default `where` for a verb (§2.2): take→room, everything else→either. */
function verbWhere(verbName, handler) {
  if (handler.where) return handler.where;
  return verbName === 'take' ? 'room' : 'either';
}

/* Is a thing currently "in scope" for the player — i.e. in the current room or
   carried? (Scenery in the room and carried items both count.) */
function thingInScope(state, id) {
  const loc = state.place[id];
  return loc === state.room || loc === 'inv';
}

/* ── legalActions (§4 / §3): the list of action objects currently OFFERED.
   Each action is one of:
     { kind:'exit',  dir, to }                         — a movement
     { kind:'verb',  thing, verb }                     — a thing-verb
     { kind:'useOn', thing, target }                   — Use ‹thing› on ‹target›
     { kind:'look',  thing }                           — the implicit look (canonical)
   We offer an action when it is *available to choose*, honoring `where`,
   portability, presence-in-scope. We do NOT pre-evaluate a handler's `if` here —
   a guarded verb is still offered (the player may click it and be told `else`).
   This matches the UI: barred exits and not-yet-satisfiable verbs stay visible.
   Two exceptions, so the action space stays the genuine decision space:
     • exits are emitted with their open/blocked status so the solver only
       *traverses* open ones but the UI can still show barred ones.
     • a `once`-exhausted handler is still offered (it just narrates `then`). */
function legalActions(world, state) {
  const actions = [];
  const room = world.rooms[state.room];

  // Exits — always emitted (open or barred); `open` says whether travel works now.
  if (room && room.exits) {
    for (const dir in room.exits) {
      const ex = room.exits[dir];
      const open = guardHolds(world, state, ex.if);
      actions.push({ kind: 'exit', dir, to: ex.to, open, blocked: ex.blocked });
    }
  }

  // Things in scope: their verbs (honoring where + portability) + implicit look.
  for (const id in world.things) {
    if (!thingInScope(state, id)) continue;
    const thing = world.things[id];
    const carried = state.place[id] === 'inv';
    const verbs = thing.verbs || {};

    // implicit look on every thing (a default is supplied at apply-time)
    let hasLook = false;

    for (const vName in verbs) {
      const handler = asHandler(verbs[vName]);
      const w = verbWhere(vName, handler);
      // portability gate: a non-portable thing can't be acted on while "in inventory"
      // (it never is), and a `where:'inv'` verb only offers when carried, etc.
      if (w === 'inv' && !carried) continue;
      if (w === 'room' && carried) continue;
      // `take` only makes sense on a portable thing sitting in the room.
      if (vName === 'take' && (!isPortable(thing) || carried)) continue;
      if (vName === 'look') { hasLook = true; }
      actions.push({ kind: vName === 'look' ? 'look' : 'verb', thing: id, verb: vName });
    }
    if (!hasLook) actions.push({ kind: 'look', thing: id, verb: 'look' });
  }

  // useOn: "Use ‹thing› on ‹target›" — thing carried, target in scope.
  for (const id in world.things) {
    const thing = world.things[id];
    if (!thing.useOn) continue;
    if (state.place[id] !== 'inv') continue; // the tool must be in hand
    for (const target in thing.useOn) {
      if (!thingInScope(state, target)) continue;
      actions.push({ kind: 'useOn', thing: id, target });
    }
  }

  return actions;
}

function isPortable(thing) {
  if (thing.portable) return true;
  // a `take` verb implies portability (§2.2)
  return !!(thing.verbs && thing.verbs.take);
}

/* Look up the handler an action refers to (verb / look / useOn). Returns the
   normalized handler object, or a default look handler. */
function handlerFor(world, action) {
  if (action.kind === 'exit') return null;
  const thing = world.things[action.thing];
  if (action.kind === 'useOn') {
    return asHandler(thing.useOn[action.target]);
  }
  const verbs = thing.verbs || {};
  if (action.verb in verbs) return asHandler(verbs[action.verb]);
  if (action.verb === 'look') return { say: 'Nothing more to see.' };
  return {};
}

/* A stable private once-key for a handler, so `once` is idempotent + serialisable. */
function onceKeyFor(action) {
  if (action.kind === 'useOn') return 'once:useOn:' + action.thing + ':' + action.target;
  return 'once:verb:' + action.thing + ':' + action.verb;
}

/* ── apply (§2): evaluate the action against the state. PURE: returns a fresh
   {state, text}. On a guard PASS it applies effects in order and returns `say`;
   on FAIL it returns `else` and an UNCHANGED state. Handles once/then. */
function apply(world, state, action) {
  // EXIT: travel if open; else narrate the blocked line, state unchanged.
  if (action.kind === 'exit') {
    const room = world.rooms[state.room];
    const ex = room.exits[action.dir];
    if (guardHolds(world, state, ex.if)) {
      const ns = cloneState(state);
      ns.room = ex.to;
      ns.moves += 1;
      const enterText = runOnEnter(world, ns); // may append an onEnter say
      const firstVisit = !ns.firstSeen.has(ns.to);
      ns.firstSeen.add(ex.to);
      return { state: ns, text: enterText || '' , moved: true };
    }
    return { state, text: ex.blocked || 'That way is barred.', moved: false, blocked: true };
  }

  const handler = handlerFor(world, action);

  // LOOK (and any pure-narration handler with no guard/do): just narrate.
  if (action.kind === 'look' && !handler.if && !handler.do) {
    return { state, text: pickSay(handler), moved: false };
  }

  // Guard check.
  if (!guardHolds(world, state, handler.if)) {
    return { state, text: handler.else || pickSay(handler) || '', moved: false, failed: true };
  }

  // Guard passed. Handle `once`: only apply effects the first successful time.
  const ns = cloneState(state);
  if (handler.once) {
    const ok = onceKeyFor(action);
    if (ns.firstSeen.has(ok)) {
      // already fired once — apply nothing, narrate `then` (or `say`).
      return { state, text: handler.then || pickSay(handler) || '', moved: false };
    }
    ns.firstSeen.add(ok);
  }

  applyEffects(world, ns, handler.do);
  ns.moves += 1;
  return { state: ns, text: pickSay(handler) || '', moved: true };
}

function pickSay(handler) {
  return handler.say != null ? handler.say : '';
}

/* onEnter (§2.1): fires when the player enters a room (after movement). Returns
   the say text (or '') and may mutate ns (effects). Honors `if` and `once`. */
function runOnEnter(world, ns) {
  const room = world.rooms[ns.room];
  if (!room || !room.onEnter) return '';
  const oe = room.onEnter;
  if (!guardHolds(world, ns, oe.if)) return '';
  if (oe.once) {
    const ok = 'onceEnter:' + ns.room;
    if (ns.firstSeen.has(ok)) return '';
    ns.firstSeen.add(ok);
  }
  if (oe.do) applyEffects(world, ns, oe.do);
  return oe.say || '';
}

function isWin(world, state) {
  return state.flags.has(world.win.flag);
}

/* ───────────────────────────────────────────────────────────────────────────
   2. THE SOLVER + PLAYERS (the verifiable crux, ADVENTURE.SPEC.md §3)
   ─────────────────────────────────────────────────────────────────────────── */

/* Enumerate the *effective* actions for BFS: the moves that can actually change
   the world (open exits + verbs/useOns whose guard passes). Pure-narration looks
   and barred exits are skipped — they never alter state, so they'd only bloat the
   search without adding reachable states. (The UI still offers them; the solver
   need not walk them.) */
function effectiveActions(world, state) {
  const out = [];
  for (const a of legalActions(world, state)) {
    if (a.kind === 'exit') {
      if (a.open) out.push(a);
      continue;
    }
    if (a.kind === 'look') continue; // pure narration, never changes state
    const handler = handlerFor(world, a);
    // a verb/useOn with no effects is pure narration too — skip for search.
    const couldChange = !!(handler.do && asList(handler.do).length) || hasWinEffect(handler);
    if (!couldChange) continue;
    out.push(a);
  }
  return out;
}

function hasWinEffect(handler) {
  return asList(handler.do).some(e => 'win' in e || 'goto' in e || 'take' in e ||
    'drop' in e || 'move' in e || 'gone' in e || 'flag' in e || 'unflag' in e);
}

/* solve(world): the single source of truth for the self-test AND the auto-player.
   Returns { winnable, path, reachableRooms, orphans, softlock, deterministicOK, errors }. */
function solve(world) {
  const errors = [];

  // ── Static validation (§3.2 + §3.5): ids reference real rooms/things/flags;
  //    every DSL feature used is one we implement.
  staticValidate(world, errors);

  // ── BFS over canonical keys (§3.1): winnable + shortest path + reachable set.
  const start = initState(world);
  const startKey = stateKey(world, start);
  const queue = [start];
  const seen = new Map();            // key → state
  const prev = new Map();            // key → { fromKey, action }
  seen.set(startKey, start);
  prev.set(startKey, null);

  let winKey = null;
  const reachableRooms = new Set([start.room]);
  let deterministicOK = true;
  let determChecked = false;

  while (queue.length) {
    const s = queue.shift();
    const sKey = stateKey(world, s);

    if (isWin(world, s)) { winKey = winKey || sKey; /* shortest: first found in BFS */ }

    const acts = effectiveActions(world, s);
    for (const a of acts) {
      const r1 = apply(world, s, a);
      const k1 = stateKey(world, r1.state);

      // Determinism spot-check (§3.4): apply the SAME action to the SAME state
      // twice → identical key. Do it once (cheap, representative).
      if (!determChecked) {
        const r2 = apply(world, s, a);
        if (stateKey(world, r2.state) !== k1) deterministicOK = false;
        determChecked = true;
      }

      reachableRooms.add(r1.state.room);
      if (!seen.has(k1)) {
        seen.set(k1, r1.state);
        prev.set(k1, { fromKey: sKey, action: a });
        queue.push(r1.state);
      }
    }
  }

  const winnable = winKey != null;

  // Shortest path: walk prev[] back from the win.
  let path = [];
  if (winnable) {
    let k = winKey;
    while (prev.get(k)) {
      const step = prev.get(k);
      path.push(step.action);
      k = step.fromKey;
    }
    path.reverse();
  }

  // ── Reachable-room validation (§3.2): every declared room reachable from start.
  const orphans = [];
  for (const roomId in world.rooms) {
    if (!reachableRooms.has(roomId)) orphans.push(roomId);
  }
  if (orphans.length) {
    errors.push('Unreachable room(s): ' + orphans.join(', '));
  }

  // ── No-softlock (§3.3): reverse-reachability. Compute the set of states from
  //    which the win is reachable; assert EVERY reachable state is in it.
  //    Honors world.allowSoftlock (opt-out → weaker check, see spec).
  let softlock = false;
  if (winnable) {
    // Build forward adjacency over the seen states.
    const fwd = new Map(); // key → [keys]
    for (const [k, st] of seen) {
      const outs = [];
      for (const a of effectiveActions(world, st)) {
        outs.push(stateKey(world, apply(world, st, a).state));
      }
      fwd.set(k, outs);
    }
    // Reverse edges, then BFS back from every winning state.
    const rev = new Map();
    for (const [k, outs] of fwd) {
      if (!rev.has(k)) rev.set(k, []);
      for (const o of outs) {
        if (!rev.has(o)) rev.set(o, []);
        rev.get(o).push(k);
      }
    }
    const canWin = new Set();
    const stack = [];
    for (const [k, st] of seen) {
      if (isWin(world, st)) { canWin.add(k); stack.push(k); }
    }
    while (stack.length) {
      const k = stack.pop();
      for (const p of (rev.get(k) || [])) {
        if (!canWin.has(p)) { canWin.add(p); stack.push(p); }
      }
    }
    // every reachable state must be able to reach a win
    const stranded = [];
    for (const k of seen.keys()) {
      if (!canWin.has(k)) stranded.push(k);
    }
    if (stranded.length) {
      softlock = true;
      if (!world.allowSoftlock) {
        errors.push('Softlock: ' + stranded.length + ' reachable state(s) cannot reach the win. e.g. ' + stranded[0]);
      }
    }
  } else {
    errors.push('World is not winnable: BFS found no state with the win flag "' + (world.win && world.win.flag) + '".');
  }

  return {
    winnable,
    path,
    reachableRooms: Array.from(reachableRooms).sort(),
    orphans,
    softlock,
    deterministicOK,
    errors,
    stateCount: seen.size,
  };
}

/* Static validation: collect errors, never throw (§3.2/§3.5). */
function staticValidate(world, errors) {
  const roomIds = new Set(Object.keys(world.rooms || {}));
  const thingIds = new Set(Object.keys(world.things || {}));
  const isLoc = (l) => l === 'inv' || l === '_gone' || roomIds.has(l);

  if (!world.start || !roomIds.has(world.start)) {
    errors.push('start "' + world.start + '" is not a real room.');
  }
  if (!world.win || !world.win.flag) {
    errors.push('world.win.flag is missing.');
  }

  // Collect the set of flag ids the world ever SETS (so guards on flags that are
  // never set are flagged as dead — a common authoring typo).
  const setFlags = new Set();
  if (world.win && world.win.flag) setFlags.add(world.win.flag);
  const noteEffects = (effs) => {
    for (const e of asList(effs)) {
      const k = Object.keys(e)[0];
      if (!EFFECT_KEYS.has(k)) {
        errors.push('Unknown effect "' + k + '" (engine implements: ' + Array.from(EFFECT_KEYS).join(', ') + ').');
      }
      if ('flag' in e) setFlags.add(e.flag);
      if ('win' in e && world.win) setFlags.add(world.win.flag);
      // referenced thing ids in effects
      for (const key of ['take', 'drop', 'gone', 'unflag']) {
        if (key in e && (key === 'take' || key === 'drop' || key === 'gone')) {
          if (!thingIds.has(e[key])) errors.push('Effect ' + key + ' references unknown thing "' + e[key] + '".');
        }
      }
      if ('move' in e) {
        if (!thingIds.has(e.move[0])) errors.push('Effect move references unknown thing "' + e.move[0] + '".');
        if (!isLoc(e.move[1])) errors.push('Effect move target "' + e.move[1] + '" is not a real room/inv/_gone.');
      }
      if ('goto' in e && !roomIds.has(e.goto)) errors.push('Effect goto "' + e.goto + '" is not a real room.');
    }
  };
  const noteGuard = (g, ctx) => {
    if (!g) return;
    for (const k in g) {
      if (!GUARD_CLAUSES.has(k)) {
        errors.push('Unknown guard clause "' + k + '" in ' + ctx + ' (engine implements: ' + Array.from(GUARD_CLAUSES).join(', ') + ').');
      }
    }
    for (const id of asList(g.has).concat(asList(g.lacks))) {
      if (!thingIds.has(id)) errors.push('Guard has/lacks references unknown thing "' + id + '" in ' + ctx + '.');
    }
    if (g.at != null && !roomIds.has(g.at)) errors.push('Guard at "' + g.at + '" is not a real room in ' + ctx + '.');
    if (g.thingAt != null) {
      if (!thingIds.has(g.thingAt[0])) errors.push('Guard thingAt references unknown thing "' + g.thingAt[0] + '" in ' + ctx + '.');
      if (!isLoc(g.thingAt[1])) errors.push('Guard thingAt location "' + g.thingAt[1] + '" is not a real room/inv/_gone in ' + ctx + '.');
    }
    // guard flags noted after the SET pass below (need full setFlags first)
  };

  const guardFlagChecks = []; // deferred until setFlags is complete

  // Rooms: exits.
  for (const roomId in world.rooms) {
    const room = world.rooms[roomId];
    if (room.exits) {
      for (const dir in room.exits) {
        const ex = room.exits[dir];
        if (!ex.to || !roomIds.has(ex.to)) {
          errors.push('Exit "' + dir + '" in room "' + roomId + '" → "' + ex.to + '" is not a real room.');
        }
        noteGuard(ex.if, 'exit ' + roomId + '.' + dir);
        guardFlagChecks.push([ex.if, 'exit ' + roomId + '.' + dir]);
      }
    }
    if (room.onEnter) {
      noteGuard(room.onEnter.if, 'onEnter ' + roomId);
      guardFlagChecks.push([room.onEnter.if, 'onEnter ' + roomId]);
      noteEffects(room.onEnter.do);
    }
  }

  // Things: at, verbs, useOn.
  for (const id in world.things) {
    const thing = world.things[id];
    if (!isLoc(thing.at)) {
      errors.push('Thing "' + id + '" at "' + thing.at + '" is not a real room/inv/_gone.');
    }
    const scan = (h, ctx) => {
      const handler = asHandler(h);
      noteGuard(handler.if, ctx);
      guardFlagChecks.push([handler.if, ctx]);
      noteEffects(handler.do);
    };
    for (const v in (thing.verbs || {})) scan(thing.verbs[v], 'verb ' + id + '.' + v);
    for (const t in (thing.useOn || {})) {
      if (!thingIds.has(t)) errors.push('useOn target "' + t + '" on thing "' + id + '" is not a real thing.');
      scan(thing.useOn[t], 'useOn ' + id + '→' + t);
    }
  }

  // Deferred: guard flag/noflag references that name a flag the world never sets.
  for (const [g, ctx] of guardFlagChecks) {
    if (!g) continue;
    for (const f of asList(g.flag).concat(asList(g.noflag))) {
      if (!setFlags.has(f)) {
        errors.push('Guard references flag "' + f + '" in ' + ctx + ' that is never set by any effect (likely a typo or a dead gate).');
      }
    }
  }
}

/* ── PLAYERS (§4): a player is just (state, legalActions, world) → action. ── */

/* solverPlayer — replays the solved BFS shortest path. Stateful via a closure
   index, matched against the live legalActions list each step. Drives "Let it play". */
function solverPlayer(world) {
  const sol = solve(world);
  let i = 0;
  const fn = function (state, actions /*, world */) {
    if (i >= sol.path.length) return null;
    const want = sol.path[i++];
    // Return the matching OFFERED action (identity by kind + ids). If the live
    // state has drifted from the solved path (e.g. the player is driving from a
    // restored mid-game state), the wanted action may not be offered — return
    // null rather than a stale action, so the caller stops cleanly instead of
    // applying an illegal move. (letItPlay resets to a fresh start to avoid this.)
    return actions.find(a => sameAction(a, want)) || null;
  };
  fn.path = sol.path;
  fn.reset = () => { i = 0; };
  return fn;
}

function sameAction(a, b) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'exit') return a.dir === b.dir;
  if (a.kind === 'useOn') return a.thing === b.thing && a.target === b.target;
  return a.thing === b.thing && a.verb === b.verb;
}

/* randomPlayer — a seeded legal-move wanderer (fuzzing / "drunk ghost"). Takes a
   PRNG function seedFn() → [0,1). NO Math.random in core (determinism, §4). */
function randomPlayer(seedFn) {
  return function (state, actions /*, world */) {
    if (!actions.length) return null;
    // prefer actions that can change the world; fall back to anything offered
    const meaty = actions.filter(a => a.kind === 'exit' ? a.open : a.kind !== 'look');
    const pool = meaty.length ? meaty : actions;
    return pool[Math.floor(seedFn() * pool.length)];
  };
}

/* describeForAgent — a compact plain-text state digest for a future llmPlayer.
   Room name + desc-cue, what's here, inventory, and the NUMBERED legal actions.
   Kept stable: it's the public surface the bot foundation leans on (§4). */
function describeForAgent(world, state) {
  const room = world.rooms[state.room];
  const lines = [];
  lines.push('ROOM: ' + (room ? room.name : state.room) + ' [' + state.room + ']');

  const here = [];
  const inv = [];
  for (const id in state.place) {
    if (state.place[id] === state.room) here.push(world.things[id].name + ' [' + id + ']');
    else if (state.place[id] === 'inv') inv.push(world.things[id].name + ' [' + id + ']');
  }
  lines.push('HERE: ' + (here.length ? here.join(', ') : '(nothing of note)'));
  lines.push('CARRYING: ' + (inv.length ? inv.join(', ') : '(empty-handed)'));
  if (state.flags.size) lines.push('FLAGS: ' + Array.from(state.flags).sort().join(', '));

  const acts = legalActions(world, state);
  lines.push('ACTIONS:');
  acts.forEach((a, n) => {
    lines.push('  ' + (n + 1) + '. ' + actionLabel(world, a));
  });
  return lines.join('\n');
}

/* A human/agent-readable label for an action (also used by the UI + the player log). */
function actionLabel(world, a) {
  if (a.kind === 'exit') {
    return (a.open ? 'Go ' : 'Go (barred) ') + a.dir + ' → ' + a.to;
  }
  const tName = world.things[a.thing] ? world.things[a.thing].name : a.thing;
  if (a.kind === 'useOn') {
    const gName = world.things[a.target] ? world.things[a.target].name : a.target;
    return 'Use ' + tName + ' on ' + gName;
  }
  const verb = a.verb.charAt(0).toUpperCase() + a.verb.slice(1);
  return verb + ' ' + tName;
}

/* llmPlayer — DOCUMENTED STUB (not wired). Same signature as the other players.
   A future agent wires a real model here: hand it describeForAgent(world,state)
   + the legal actions, parse back a choice, return the matching action. Throws
   if called so a half-wiring fails loudly instead of silently no-opping. */
function llmPlayer(/* { chooseAction } = {} */) {
  return function (/* state, actions, world */) {
    // Wiring sketch (intentionally not executed):
    //   const prompt = describeForAgent(world, state);
    //   const reply  = await chooseAction(prompt, actions);   // your model call
    //   const n      = parseInt(reply, 10);                   // "pick action N"
    //   return actions[n - 1];
    throw new Error('llmPlayer is a documented stub — not wired. ' +
      'See ADVENTURE.SPEC.md §4: implement chooseAction(state, legalActions, world) ' +
      'using describeForAgent() and return one of the offered actions.');
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   THE SELF-TEST HARNESS (§3) — identical results in Node and the browser.
   runSelfTest(world) → { pass, total, checks:[{name,pass,detail}], path }.
   The green chip shows "Lantern verified — N/N ✓ · solved in K".
   ─────────────────────────────────────────────────────────────────────────── */
function runSelfTest(world) {
  const checks = [];
  const sol = solve(world);

  // 1. Winnable + shortest path.
  checks.push({
    name: 'winnable',
    pass: sol.winnable,
    detail: sol.winnable ? ('shortest path = ' + sol.path.length + ' moves') : 'no winning state found',
  });

  // 2. Reachable map + static validation (no orphan rooms, no bad ids).
  const staticErrs = sol.errors.filter(e => !/^Softlock/.test(e) && !/not winnable/.test(e));
  checks.push({
    name: 'reachable + valid ids',
    pass: sol.orphans.length === 0 && staticErrs.length === 0,
    detail: (sol.orphans.length === 0 && staticErrs.length === 0)
      ? (sol.reachableRooms.length + ' rooms reachable, all ids resolve')
      : (sol.orphans.length ? ('orphans: ' + sol.orphans.join(', ') + '; ') : '') + staticErrs.join(' | '),
  });

  // 3. No softlock (honoring allowSoftlock).
  const softOK = world.allowSoftlock ? true : !sol.softlock;
  checks.push({
    name: 'no softlock',
    pass: softOK,
    detail: world.allowSoftlock ? 'allowSoftlock=true (opt-out)' :
      (sol.softlock ? 'a reachable state cannot reach the win' : 'every reachable state can still reach the win'),
  });

  // 4. Determinism.
  checks.push({
    name: 'deterministic',
    pass: sol.deterministicOK,
    detail: sol.deterministicOK ? 'apply is pure (same state+action → same key)' : 'apply diverged on repeat',
  });

  // 5. Effects are total (no DSL the engine doesn't honour).
  const dslErrs = sol.errors.filter(e => /^Unknown (effect|guard)/.test(e));
  checks.push({
    name: 'effects total',
    pass: dslErrs.length === 0,
    detail: dslErrs.length === 0 ? 'world uses only implemented DSL' : dslErrs.join(' | '),
  });

  const pass = checks.filter(c => c.pass).length;
  return { pass, total: checks.length, checks, path: sol.path, solution: sol };
}

/* ───────────────────────────────────────────────────────────────────────────
   THE SCENE-ART REGISTRY (§5) — each room's `art` key → a small procedural SVG
   scene (restrained: a few evocative shapes in the accent + greys, NOT literal
   illustration). Scenes respond to state where cheap (a room's lamp glows once
   its flag is lit). Unknown / `_neutral` key → a calm neutral panel with the room
   name. A function returns an SVG string given { accent, lit, roomName }.
   Browser-only consumers; pure string builders, safe to require in Node too.
   ─────────────────────────────────────────────────────────────────────────── */
const SCENE_ART = {
  _neutral(o) {
    return svg(`
      <rect width="100%" height="100%" fill="none"/>
      <circle cx="200" cy="118" r="46" fill="none" stroke="${grey(0.18)}" stroke-width="1.5"/>
      <circle cx="200" cy="118" r="78" fill="none" stroke="${grey(0.10)}" stroke-width="1"/>
      <text x="200" y="210" text-anchor="middle" fill="${grey(0.5)}"
        font-family="Georgia,serif" font-size="15" font-style="italic">${esc(o.roomName)}</text>
    `);
  },

  lodge(o) {
    const g = o.lit ? 0.95 : 0.5; // hearth brighter once lantern-lit / dawn
    return svg(`
      <rect x="40" y="150" width="320" height="70" fill="${grey(0.06)}"/>
      <!-- hearth -->
      <rect x="150" y="120" width="100" height="100" rx="3" fill="${grey(0.10)}" stroke="${grey(0.2)}"/>
      <rect x="166" y="150" width="68" height="70" fill="${grey(0.04)}"/>
      <ellipse cx="200" cy="206" rx="30" ry="${o.lit?22:10}" fill="${o.accent}" opacity="${o.lit?0.55:0.32}"/>
      <ellipse cx="200" cy="208" rx="14" ry="${o.lit?12:6}" fill="${o.accent}" opacity="${g}"/>
      <!-- mantel beam -->
      <rect x="138" y="112" width="124" height="9" fill="${grey(0.16)}"/>
      <!-- nail + coat hint -->
      <line x1="300" y1="120" x2="300" y2="175" stroke="${grey(0.18)}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="200" cy="206" r="${o.lit?64:30}" fill="${o.accent}" opacity="${o.lit?0.10:0.05}"/>
    `);
  },

  shed(o) {
    return svg(`
      <!-- tool wall: a few hanging shapes in greys, one iron bar in accent-ish steel -->
      <line x1="60" y1="70" x2="340" y2="70" stroke="${grey(0.16)}" stroke-width="2"/>
      <line x1="110" y1="70" x2="110" y2="150" stroke="${grey(0.22)}" stroke-width="3"/>
      <path d="M110 150 q-14 0 -14 -16" fill="none" stroke="${grey(0.22)}" stroke-width="3"/>
      <line x1="170" y1="70" x2="170" y2="138" stroke="${grey(0.2)}" stroke-width="6"/>
      <rect x="158" y="60" width="24" height="14" rx="2" fill="${grey(0.22)}"/>
      <!-- the pry-bar, leaning in the corner -->
      <line x1="300" y1="92" x2="328" y2="226" stroke="${o.accent}" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
      <path d="M298 92 l-12 -8" stroke="${o.accent}" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
      <rect x="40" y="222" width="320" height="6" fill="${grey(0.12)}"/>
    `);
  },

  cellar(o) {
    const g = o.lit ? 0.7 : 0.32;
    return svg(`
      <rect x="40" y="40" width="320" height="190" fill="${grey(0.03)}"/>
      <!-- stone courses -->
      ${stoneCourses()}
      <!-- shelf + oil tin -->
      <rect x="120" y="120" width="160" height="7" fill="${grey(0.18)}"/>
      <rect x="180" y="86" width="40" height="34" rx="3" fill="${o.accent}" opacity="${g}"/>
      <rect x="192" y="76" width="16" height="12" rx="2" fill="${o.accent}" opacity="${g}"/>
      <!-- ladder shaft of light from above -->
      <polygon points="300,40 340,40 326,150 312,150" fill="${o.accent}" opacity="0.06"/>
    `);
  },

  lane(o) {
    return lampScene(o, { post: 250, glow: 'lit-lane', label: 'lane' });
  },
  square(o) {
    return lampScene(o, { post: 230, glow: 'lit-square', label: 'square', tall: true });
  },
  hill(o) {
    // the beacon on the bare hill; below, two small fires (lane + square) if lit
    const beaconLit = o.lit;
    return svg(`
      <path d="M0 230 Q200 150 400 230 L400 240 L0 240 Z" fill="${grey(0.06)}"/>
      <!-- the beacon -->
      <line x1="200" y1="86" x2="200" y2="180" stroke="${grey(0.22)}" stroke-width="6"/>
      <rect x="184" y="58" width="32" height="34" rx="4" fill="${grey(0.12)}" stroke="${grey(0.24)}"/>
      <ellipse cx="200" cy="74" rx="${beaconLit?16:7}" ry="${beaconLit?18:8}" fill="${o.accent}" opacity="${beaconLit?0.95:0.4}"/>
      <circle cx="200" cy="74" r="${beaconLit?70:20}" fill="${o.accent}" opacity="${beaconLit?0.12:0.05}"/>
      <!-- the town below: two small warm fires -->
      <circle cx="120" cy="220" r="4" fill="${o.accent}" opacity="${o.flags && o.flags.has('lit-lane')?0.8:0.12}"/>
      <circle cx="270" cy="216" r="5" fill="${o.accent}" opacity="${o.flags && o.flags.has('lit-square')?0.8:0.12}"/>
    `);
  },
};

/* a street-lamp scene shared by lane + square; lit when its glow-flag is set. */
function lampScene(o, cfg) {
  const lit = o.flags ? o.flags.has(cfg.glow) : o.lit;
  const top = cfg.tall ? 64 : 86;
  const flameY = top - 4;
  return svg(`
    <rect x="0" y="214" width="400" height="26" fill="${grey(0.05)}"/>
    ${cobbles(lit, o.accent)}
    <!-- the post -->
    <line x1="200" y1="${flameY+18}" x2="200" y2="206" stroke="${grey(0.24)}" stroke-width="6"/>
    <rect x="184" y="${top-14}" width="32" height="30" rx="4" fill="${grey(0.12)}" stroke="${grey(0.24)}"/>
    <ellipse cx="200" cy="${flameY}" rx="${lit?13:6}" ry="${lit?15:7}" fill="${o.accent}" opacity="${lit?0.95:0.38}"/>
    <circle cx="200" cy="${flameY}" r="${lit?66:18}" fill="${o.accent}" opacity="${lit?0.12:0.05}"/>
  `);
}

function cobbles(lit, accent) {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 42, op = lit ? 0.10 + (i === 4 ? 0.14 : 0) : 0.05;
    s += `<ellipse cx="${x}" cy="226" rx="16" ry="6" fill="${accent}" opacity="${op}"/>`;
  }
  return s;
}
function stoneCourses() {
  let s = '';
  for (let y = 60; y < 220; y += 30) s += `<line x1="40" y1="${y}" x2="360" y2="${y}" stroke="${grey(0.07)}" stroke-width="1"/>`;
  return s;
}

function svg(inner) {
  return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}
function grey(a) { return `rgba(200,205,215,${a})`; }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

/* Pick the art renderer for a room's state; returns an SVG string. */
function renderScene(world, state) {
  const room = world.rooms[state.room];
  const key = (room && room.art) || '_neutral';
  const fn = SCENE_ART[key] || SCENE_ART._neutral;
  // "lit" cue: a room is considered lit when the player carries a lit lantern,
  // or the win flag is set, or (for lamp rooms) the room's own lamp flag is set.
  const lanternLit = state.flags.has('lantern-lit') && state.place['lantern'] === 'inv';
  const lit = lanternLit || isWin(world, state);
  return (fn || SCENE_ART._neutral)({
    accent: (world.meta && world.meta.accent) || '#f3b94d',
    lit,
    roomName: room ? room.name : state.room,
    flags: state.flags,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE PUBLIC API (stable surface every tale + future player leans on).
   ═══════════════════════════════════════════════════════════════════════════ */
const LANTERN = {
  LANTERN_VERSION,
  // pure model
  initState, legalActions, apply, isWin, stateKey, cloneState,
  guardHolds, applyEffects,
  // solver + players
  solve, runSelfTest,
  solverPlayer, randomPlayer, describeForAgent, llmPlayer,
  actionLabel, sameAction, effectiveActions,
  // art
  SCENE_ART, renderScene,
};

/* Dual-use: Node export for headless solving; a browser uses the globals + UI below. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LANTERN;
}

/* ───────────────────────────────────────────────────────────────────────────
   3. THE RENDERER (browser-only) — attaches the point-and-click chrome on
   DOMContentLoaded IF a document exists AND a WORLD global is present. A shipped
   tale provides WORLD (inlined) and the host elements; this wires them.
   See ADVENTURE.SPEC.md §5. Pure-DOM; honors prefers-reduced-motion.
   ─────────────────────────────────────────────────────────────────────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof WORLD === 'undefined' || !document.getElementById('lantern-root')) return;
    try { LanternUI.mount(WORLD); }
    catch (e) { console.error('[Lantern] mount failed', e); }
  });
}

/* The UI controller. Defined unconditionally (cheap) but only mounted in-browser. */
const LanternUI = (function () {
  const RM = (typeof window !== 'undefined' && window.matchMedia)
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  let WORLD = null, S = null, lastEvent = '', selected = null, useMode = null, playing = false, won = false;

  function $(id) { return document.getElementById(id); }

  function mount(world) {
    WORLD = world;
    document.documentElement.style.setProperty('--accent', (world.meta && world.meta.accent) || '#f3b94d');
    // breadcrumb: seen
    crumb(() => { const k = 'ws:seen:' + world.meta.id; if (!localStorage.getItem(k)) localStorage.setItem(k, String(Date.now())); });

    // self-test → chip (run first; never ships red)
    const st = LANTERN.runSelfTest(world);
    paintChip(st);

    // title card wiring
    const begin = $('beginBtn');
    if (begin) begin.addEventListener('click', () => { hide($('titleCard')); restoreOrStart(); });
    fillTitleCard(world);

    // controls
    const play = $('playBtn'); if (play) play.addEventListener('click', letItPlay);
    const over = $('startOverBtn'); if (over) over.addEventListener('click', startOver);

    // if a save exists we still show the title card; "Begin" restores it.
  }

  function fillTitleCard(world) {
    setText('tcTitle', world.meta.title);
    setText('tcByline', world.meta.byline || '');
    setText('tcIntro', world.meta.intro || '');
  }

  function restoreOrStart() {
    let restored = null;
    crumb(() => {
      const raw = localStorage.getItem('ws:save:' + WORLD.meta.id);
      if (raw) restored = deserialize(JSON.parse(raw));
    });
    S = restored || LANTERN.initState(WORLD);
    S.firstSeen.add(WORLD.start); // mark start visited so its first-desc shows once
    won = LANTERN.isWin(WORLD, S);
    render();
  }

  function startOver() {
    crumb(() => localStorage.removeItem('ws:save:' + WORLD.meta.id));
    playing = false; won = false; selected = null; useMode = null; lastEvent = '';
    S = LANTERN.initState(WORLD); S.firstSeen.add(WORLD.start);
    render();
  }

  /* ── render the whole frame from S ── */
  function render() {
    if (!S) return;
    const room = WORLD.rooms[S.room];

    // scene
    const scene = $('scene');
    if (scene) scene.innerHTML = LANTERN.renderScene(WORLD, S);

    // prose: room desc honoring [first,repeat] + latest event line
    const firstVisit = countFirst();
    setText('roomName', room.name);
    const desc = Array.isArray(room.desc)
      ? (firstVisit ? room.desc[0] : (room.desc[1] != null ? room.desc[1] : room.desc[0]))
      : room.desc;
    const prose = $('prose');
    if (prose) {
      prose.innerHTML = '<p class="desc">' + para(desc) + '</p>' +
        (lastEvent ? '<p class="event">' + para(lastEvent) + '</p>' : '');
    }

    renderExits(room);
    renderInventory();
    renderActionBar();

    // win?
    if (LANTERN.isWin(WORLD, S) && !won) onWin();
    save();
  }

  // first-visit bookkeeping: we track visited rooms in S.firstSeen; the renderer
  // asks "is this the first time we're DESCRIBING this room?" The model marks the
  // room seen on entry (apply), so by render time it's already in firstSeen; we
  // keep a parallel 'described' set to flip first→repeat correctly.
  const described = new Set();
  function countFirst() {
    if (described.has(S.room)) return false;
    described.add(S.room);
    return true;
  }

  function renderExits(room) {
    const row = $('exits'); if (!row) return;
    row.innerHTML = '';
    const acts = LANTERN.legalActions(WORLD, S).filter(a => a.kind === 'exit');
    if (!acts.length) { row.innerHTML = '<span class="muted">— no way on from here —</span>'; return; }
    for (const a of acts) {
      const b = document.createElement('button');
      b.className = 'exit' + (a.open ? '' : ' barred');
      b.innerHTML = '<span class="dir">' + esc(a.dir) + '</span>';
      b.title = a.open ? ('to ' + (WORLD.rooms[a.to] ? WORLD.rooms[a.to].name : a.to)) : (a.blocked || 'barred');
      b.setAttribute('aria-label', (a.open ? 'Go ' : 'Barred: ') + a.dir);
      b.addEventListener('click', () => {
        if (a.open) { fire(a); }
        else { event(a.blocked || 'That way is barred.'); renderOnly(); }
      });
      row.appendChild(b);
    }
  }

  function renderInventory() {
    const tray = $('inv'); if (!tray) return;
    tray.innerHTML = '';
    const ids = Object.keys(S.place).filter(id => S.place[id] === 'inv');
    if (!ids.length) { tray.innerHTML = '<span class="muted">empty-handed</span>'; return; }
    for (const id of ids) {
      const chip = document.createElement('button');
      chip.className = 'item' + (selected === id ? ' sel' : '') + (useMode && useMode.thing === id ? ' using' : '');
      chip.textContent = WORLD.things[id].name;
      chip.addEventListener('click', () => selectThing(id));
      tray.appendChild(chip);
    }
  }

  /* the context action bar: click a thing → its verbs appear; supports Use-on. */
  function renderActionBar() {
    const bar = $('actions'); if (!bar) return;
    bar.innerHTML = '';

    if (useMode) {
      // choose a target for "Use ‹thing› on …"
      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = 'Use ' + WORLD.things[useMode.thing].name + ' on…';
      bar.appendChild(hint);
      const targets = useTargets(useMode.thing);
      for (const t of targets) {
        const b = mkVerbBtn(WORLD.things[t].name, () => {
          const a = { kind: 'useOn', thing: useMode.thing, target: t };
          useMode = null; selected = null; fire(a);
        });
        bar.appendChild(b);
      }
      bar.appendChild(mkVerbBtn('cancel', () => { useMode = null; renderOnly(); }, 'ghost'));
      return;
    }

    if (!selected) {
      bar.innerHTML = '<span class="hint">Tap a thing — here or in hand — to act on it.</span>';
      // surface the things present as quick taps
      const present = thingsHere();
      for (const id of present) {
        bar.appendChild(mkVerbBtn(WORLD.things[id].name, () => selectThing(id), 'thingtap'));
      }
      return;
    }

    // a thing is selected → show its applicable verbs as buttons
    const id = selected;
    const label = document.createElement('span');
    label.className = 'hint';
    label.textContent = WORLD.things[id].name + ':';
    bar.appendChild(label);

    const verbs = applicableVerbs(id);
    for (const v of verbs) {
      bar.appendChild(mkVerbBtn(cap(v), () => fire({ kind: v === 'look' ? 'look' : 'verb', thing: id, verb: v })));
    }
    // Use ‹thing› on … (only if carried + has useOn targets in scope)
    if (S.place[id] === 'inv' && useTargets(id).length) {
      bar.appendChild(mkVerbBtn('Use on…', () => { useMode = { thing: id }; renderOnly(); }, 'use'));
    }
    bar.appendChild(mkVerbBtn('done', () => { selected = null; renderOnly(); }, 'ghost'));
  }

  function applicableVerbs(id) {
    // the verbs offered for this thing right now (from legalActions), look last
    const acts = LANTERN.legalActions(WORLD, S)
      .filter(a => (a.kind === 'verb' || a.kind === 'look') && a.thing === id);
    const verbs = acts.map(a => a.verb).filter(v => v !== 'look');
    verbs.push('look');
    // de-dup preserving order
    return verbs.filter((v, i) => verbs.indexOf(v) === i);
  }

  function useTargets(thingId) {
    const thing = WORLD.things[thingId];
    if (!thing.useOn) return [];
    return Object.keys(thing.useOn).filter(t => {
      const loc = S.place[t];
      return loc === S.room || loc === 'inv';
    });
  }

  function thingsHere() {
    return Object.keys(S.place).filter(id => S.place[id] === S.room);
  }

  function selectThing(id) { selected = id; useMode = null; renderOnly(); }

  function mkVerbBtn(text, fn, cls) {
    const b = document.createElement('button');
    b.className = 'verb' + (cls ? ' ' + cls : '');
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }

  /* fire an action through the pure core, narrate, re-render. */
  function fire(action) {
    const res = LANTERN.apply(WORLD, S, action);
    S = res.state;
    if (res.text) lastEvent = res.text;
    selected = null; useMode = null;
    render();
  }

  function event(text) { lastEvent = text; }
  function renderOnly() { renderExits(WORLD.rooms[S.room]); renderInventory(); renderActionBar(); updateProseEvent(); }
  function updateProseEvent() {
    const prose = $('prose'); if (!prose) return;
    const room = WORLD.rooms[S.room];
    const desc = Array.isArray(room.desc) ? (described.has(S.room) ? (room.desc[1] || room.desc[0]) : room.desc[0]) : room.desc;
    prose.innerHTML = '<p class="desc">' + para(desc) + '</p>' + (lastEvent ? '<p class="event">' + para(lastEvent) + '</p>' : '');
  }

  function onWin() {
    won = true;
    crumb(() => { localStorage.setItem('ws:flag:' + WORLD.meta.id + '-won', '1'); });
    const card = $('winCard');
    if (card) {
      setText('winTitle', (WORLD.win && WORLD.win.title) || 'The End');
      setText('winText', (WORLD.win && WORLD.win.text) || '');
      show(card);
    }
  }

  /* ── "▶ Let it play": run solverPlayer to the win, move by move, gently. ── */
  function letItPlay() {
    if (playing) return;
    // The solver path is absolute (from initState). Reset the live state to a
    // fresh start so the replay always aligns — otherwise a restored mid-game
    // state would desync the player. (Does not clear the save until a move runs.)
    won = false; selected = null; useMode = null; lastEvent = '';
    described.clear();
    S = LANTERN.initState(WORLD); S.firstSeen.add(WORLD.start);
    render();
    playing = true;
    const player = LANTERN.solverPlayer(WORLD);
    const delay = RM.matches ? 0 : 1100;
    function step() {
      if (!playing) return;
      const acts = LANTERN.legalActions(WORLD, S);
      const a = player(S, acts, WORLD);
      if (!a) { playing = false; return; }
      fire(a);
      if (LANTERN.isWin(WORLD, S)) { playing = false; return; }
      if (RM.matches) step(); else setTimeout(step, delay);
    }
    if (RM.matches) {
      // snap: run to the end immediately
      let guard = 0;
      while (playing && guard++ < 500) {
        const acts = LANTERN.legalActions(WORLD, S);
        const a = player(S, acts, WORLD);
        if (!a) break;
        fire(a);
        if (LANTERN.isWin(WORLD, S)) break;
      }
      playing = false;
    } else {
      setTimeout(step, 600);
    }
  }

  /* ── chip ── */
  function paintChip(st) {
    const chip = $('selftest'); if (!chip) return;
    const txt = $('stText');
    chip.classList.remove('ok', 'bad');
    if (st.pass === st.total) {
      chip.classList.add('ok');
      if (txt) txt.textContent = 'Lantern verified — ' + st.pass + '/' + st.total + ' ✓ · solved in ' + st.path.length;
    } else {
      chip.classList.add('bad');
      if (txt) txt.textContent = 'self-test ' + st.pass + '/' + st.total + ' — see console';
      console.error('[Lantern] self-test FAILED', st.checks.filter(c => !c.pass));
    }
    st.checks.forEach(c => {
      if (c.pass) console.log('[Lantern] ✓ ' + c.name + ' — ' + c.detail);
      else console.error('[Lantern] ✗ ' + c.name + ' — ' + c.detail);
    });
  }

  /* ── save / restore (ws:save:<id>) ── */
  function save() {
    crumb(() => localStorage.setItem('ws:save:' + WORLD.meta.id, JSON.stringify(serialize(S))));
  }
  function serialize(s) {
    return { room: s.room, place: s.place, flags: Array.from(s.flags), firstSeen: Array.from(s.firstSeen), moves: s.moves };
  }
  function deserialize(o) {
    return { room: o.room, place: o.place || {}, flags: new Set(o.flags || []), firstSeen: new Set(o.firstSeen || []), moves: o.moves || 0 };
  }

  /* ── helpers ── */
  function crumb(fn) { try { fn(); } catch (e) { /* storage off — never a blocker */ } }
  function setText(id, t) { const el = $(id); if (el) el.textContent = t; }
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function para(s) {
    return esc(String(s)).replace(/\n/g, '<br>');
  }

  return { mount };
})();
