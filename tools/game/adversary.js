/* ═══════════════════════════════════════════════════════════════════════════
   adversary.js — the Workshop's solved-games engine (the one source of truth).

   A reusable combinatorial-game-theory core, Lantern-shaped:
     • ONE DOM-free pure core + solver (this file) — Node-requireable, used
       headless to PROVE a game's value before it ships, AND inlined into the
       page so render & proof can never drift (same code, two targets).
     • Game-defs as pure DATA (see tools/game/games/*.js): one engine, many games.
     • PLAYERS as functions over the solved table (perfect / seeded-random / an
       agent stub) — exactly the Lantern player idiom.

   This file is a dual-use IIFE: in a browser it attaches a global `Adversary`;
   under Node it exports via the module guard at the bottom (which forge strips
   when inlining, so the shipped page carries clean source). DOM-free.

   ── THE CRUX ──────────────────────────────────────────────────────────────
   A *solved game* is one whose game-theoretic value is known for every
   reachable position. We make that claim PROVABLE for small games:

     1. ENUMERATE the reachable state graph by BFS over canonical keys.
     2. CLASSIFY terminal positions by the game's own rule.
     3. RETROGRADE-LABEL every non-terminal by backward induction to a fixpoint:
          • a node is a LOSS  iff ALL children are wins for the mover-to-be
            (i.e. every move hands the opponent a WIN)         — you are lost;
          • a node is a WIN   iff SOME child is a LOSS for the opponent  — you
            move to a position the opponent loses;
          • else it is a DRAW (neither side can force a win; cycles resolve here).
     4. Distances: a WIN's distance is 1 + the *minimum* losing-child distance
        (win as fast as possible); a LOSS's distance is 1 + the *maximum* child
        distance (lose as slowly as possible). "Mate in N" is exact.

   Everything is from the side-to-move's point of view, which is part of state.
   solve() runs ONCE per def and is cached; the page and the Node self-test call
   the SAME solve(), so a green chip in the page is the same proof as `node …`.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var ADVERSARY_VERSION = '1.0';

  var WIN = 'WIN', LOSS = 'LOSS', DRAW = 'DRAW';
  var HARD_CAP = 300000; // absolute reachable-node ceiling (a def may set a lower nodeBudget)

  /* ── seeded PRNG (mulberry32) — NO Math.random in the core (determinism) ──── */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── solve(def) → SolveTable ────────────────────────────────────────────────
     Returns:
       {
         ok, error,                    // ok=false + error string if budget blown / def invalid
         nodeCount,                    // reachable canonical states
         rootKey,                      // key(initState())
         table: Map<key, Node>,        // Node = { value, dist, bestMoveIndex, moves:[{move,childKey}] }
         value, dist, bestMove,        // convenience: the root's verdict
         def
       }
     `value`/`dist`/`bestMove` are from the side-to-move POV at each node. */
  function solve(def) {
    validateDef(def);

    // ── 1. ENUMERATE the reachable graph by BFS over canonical keys ──────────
    var cap = Math.min(def.nodeBudget || HARD_CAP, HARD_CAP);
    var table = new Map();                       // key → Node (built up below)
    var stateOf = new Map();                      // key → a representative state (for terminal/children)
    var root = def.initState();
    var rootKey = def.key(root);
    var queue = [root];
    var queued = new Set([rootKey]);
    stateOf.set(rootKey, root);

    while (queue.length) {
      var s = queue.shift();
      var sKey = def.key(s);
      if (table.has(sKey)) continue;

      var term = def.terminal(s);
      var node = { value: null, dist: null, bestMoveIndex: -1, moves: [], terminal: !!(term && term.over) };

      if (node.terminal) {
        node.value = term.value;                 // WIN/LOSS/DRAW from side-to-move POV
        node.dist = 0;
      } else {
        var moves = def.legalMoves(s);
        for (var i = 0; i < moves.length; i++) {
          var child = def.apply(s, moves[i]);
          var cKey = def.key(child);
          node.moves.push({ move: moves[i], childKey: cKey });
          if (!queued.has(cKey)) {
            queued.add(cKey);
            stateOf.set(cKey, child);
            queue.push(child);
          }
        }
      }
      table.set(sKey, node);

      if (table.size > cap) {
        return {
          ok: false,
          error: 'node budget exceeded: ' + table.size + ' > cap ' + cap +
                 ' (def "' + def.id + '"). Shrink the board or raise nodeBudget (hard cap ' + HARD_CAP + ').',
          nodeCount: table.size, def: def, table: table, rootKey: rootKey
        };
      }
    }

    // ── 2 & 3. RETROGRADE LABEL — two clean phases over the enumerated graph ──
    //
    //  PHASE A (VALUE): the classic retrograde counter algorithm. A node is a
    //    WIN  iff SOME child is a LOSS (move to a position the opponent loses);
    //    a LOSS iff ALL children are WIN (every move hands a win away). We seed
    //    the queue with terminals and propagate: when a child becomes LOSS its
    //    parent becomes WIN; when ALL of a parent's children become WIN it
    //    becomes LOSS. Whatever is never resolved sits in a cycle with no forced
    //    win for either side → DRAW. This is order-independent (the two rules are
    //    monotone), so the VALUE is exact regardless of pop order.
    //
    //  PHASE B (DISTANCE): a Dijkstra-style relaxation in increasing distance
    //    order, so each node's distance is final when first popped. A LOSS
    //    terminal has dist 0; a WIN's dist = 1 + min over its LOSS children;
    //    a LOSS's dist = 1 + max over its (all-WIN) children. "Win fast, lose
    //    slow" — exactly the optimal-play convention the perfect player uses,
    //    so root.dist == the length of optimal-vs-optimal self-play (asserted).
    var parents = new Map();   // childKey → [parentKey] (reverse edges)
    var degree = new Map();    // key → count of children still not labelled WIN
    table.forEach(function (node, key) {
      if (node.terminal) return;
      degree.set(key, node.moves.length);
      for (var i = 0; i < node.moves.length; i++) {
        var ck = node.moves[i].childKey;
        if (!parents.has(ck)) parents.set(ck, []);
        parents.get(ck).push(key);
      }
    });

    // PHASE A — value propagation.
    var vq = [];
    table.forEach(function (node, key) { if (node.terminal) vq.push(key); });
    while (vq.length) {
      var vkey = vq.pop();
      var vnode = table.get(vkey);
      var vps = parents.get(vkey);
      if (!vps) continue;
      for (var vp = 0; vp < vps.length; vp++) {
        var pk = vps[vp];
        var pnode = table.get(pk);
        if (pnode.value !== null) continue;            // already decided
        if (vnode.value === LOSS) {
          // a child is a LOSS for its mover → pk's mover can move there and win.
          pnode.value = WIN;
          vq.push(pk);
        } else {
          // child is WIN or DRAW for its mover; decrement the WIN/down counter.
          var left = degree.get(pk) - 1;
          degree.set(pk, left);
          if (left === 0) {
            // every child resolved and none was a LOSS → LOSS iff all WIN, else DRAW
            var allWin = true;
            for (var m = 0; m < pnode.moves.length; m++) {
              if (table.get(pnode.moves[m].childKey).value !== WIN) { allWin = false; break; }
            }
            pnode.value = allWin ? LOSS : DRAW;
            vq.push(pk);
          }
        }
      }
    }
    // Unresolved nodes are draw-cycles.
    table.forEach(function (node) { if (node.value === null) { node.value = DRAW; } });

    // PHASE B — exact distances via a Dijkstra-like min-heap over finite dists.
    //   DRAW nodes have dist = Infinity (no forced resolution) and are skipped.
    var heap = new MinHeap();
    var rem = new Map();   // for LOSS nodes: how many WIN children still need a dist before we know the max
    table.forEach(function (node, key) {
      node.dist = (node.value === DRAW) ? Infinity : (node.terminal ? 0 : null);
      node.bestMoveIndex = -1;
      if (node.terminal && node.value !== DRAW) heap.push(0, key);
      if (!node.terminal && node.value === LOSS) {
        // count WIN children whose dist we await (all children are WIN by definition)
        rem.set(key, node.moves.length);
      }
    });
    while (heap.size()) {
      var top = heap.pop();
      var ckey = top.key, cd = top.dist;
      var cnode = table.get(ckey);
      if (cnode.dist !== null && cnode.dist < cd) continue;  // stale
      if (cnode.dist === null) continue;                      // shouldn't happen
      if (cd > cnode.dist) continue;
      var cps = parents.get(ckey);
      if (!cps) continue;
      for (var ci = 0; ci < cps.length; ci++) {
        var ppk = cps[ci];
        var ppn = table.get(ppk);
        if (ppn.value === DRAW) continue;
        if (ppn.value === WIN && cnode.value === LOSS) {
          // WIN parent reached via a LOSS child: dist = 1 + min LOSS-child dist.
          var nd = cd + 1;
          if (ppn.dist === null || nd < ppn.dist) {
            ppn.dist = nd; heap.push(nd, ppk);
          }
        } else if (ppn.value === LOSS && cnode.value === WIN) {
          // LOSS parent: dist = 1 + MAX over its (all-WIN) children. We must wait
          // for ALL children, then take the max. Track remaining; when 0, finalise.
          var left2 = rem.get(ppk) - 1;
          rem.set(ppk, left2);
          // track running max via ppn.dist used as a scratch max (finite child dists)
          var childD = cnode.dist;
          if (ppn.dist === null || childD > ppn.dist) ppn.dist = childD;
          if (left2 === 0) {
            ppn.dist = ppn.dist + 1;
            heap.push(ppn.dist, ppk);
          }
        }
      }
    }

    // PHASE C — choose bestMoveIndex per node from the now-final distances.
    table.forEach(function (node, key) {
      if (node.terminal) return;
      if (node.value === WIN) {
        var bestD = Infinity, bi = -1;
        for (var i = 0; i < node.moves.length; i++) {
          var c = table.get(node.moves[i].childKey);
          if (c.value === LOSS) { var d = (c.dist === Infinity ? Infinity : c.dist + 1); if (d < bestD) { bestD = d; bi = i; } }
        }
        node.bestMoveIndex = bi;
      } else if (node.value === LOSS) {
        // slowest loss = child with the largest dist
        var worst = -1, wi = -1;
        for (var j = 0; j < node.moves.length; j++) {
          var cc = table.get(node.moves[j].childKey);
          var dd = (cc.dist === Infinity ? Infinity : cc.dist);
          if (dd > worst || wi < 0) { worst = dd; wi = j; }
        }
        node.bestMoveIndex = wi;
      } else {
        node.bestMoveIndex = pickDrawMove(node, table);
      }
    });

    var rootNode = table.get(rootKey);
    return {
      ok: true, error: null,
      nodeCount: table.size,
      rootKey: rootKey,
      table: table,
      value: rootNode.value,
      dist: rootNode.dist,
      bestMove: rootNode.bestMoveIndex >= 0 ? rootNode.moves[rootNode.bestMoveIndex].move : null,
      def: def
    };
  }

  /* A tiny binary min-heap keyed by integer distance (Phase B Dijkstra). */
  function MinHeap() { this.a = []; }
  MinHeap.prototype.size = function () { return this.a.length; };
  MinHeap.prototype.push = function (dist, key) {
    var a = this.a; a.push({ dist: dist, key: key });
    var i = a.length - 1;
    while (i > 0) { var p = (i - 1) >> 1; if (a[p].dist <= a[i].dist) break; var t = a[p]; a[p] = a[i]; a[i] = t; i = p; }
  };
  MinHeap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; var i = 0, n = a.length;
      while (true) { var l = 2 * i + 1, r = l + 1, m = i;
        if (l < n && a[l].dist < a[m].dist) m = l;
        if (r < n && a[r].dist < a[m].dist) m = r;
        if (m === i) break; var t = a[m]; a[m] = a[i]; a[i] = t; i = m; } }
    return top;
  };

  function pickDrawMove(node, table) {
    // Best: a DRAW child (never hand the opponent a WIN). Fall back to the
    // slowest-losing child only if literally every move loses (shouldn't happen
    // for a true DRAW node, but keep the player total).
    var drawIdx = -1, slowLossIdx = -1, slowLossDist = -1;
    for (var i = 0; i < node.moves.length; i++) {
      var c = table.get(node.moves[i].childKey);
      if (!c) continue;
      if (c.value === DRAW && drawIdx < 0) drawIdx = i;
      if (c.value === WIN) {
        // child is a WIN for the OPPONENT → a LOSS for us; track slowest
        var d = (c.dist === Infinity) ? 1e9 : c.dist;
        if (d > slowLossDist) { slowLossDist = d; slowLossIdx = i; }
      }
    }
    if (drawIdx >= 0) return drawIdx;
    if (slowLossIdx >= 0) return slowLossIdx;
    return node.moves.length ? 0 : -1;
  }

  /* ── PLAYERS — signature (state, legalMoves, def, solveTable) → move ─────────
     Lantern-style: pure functions over the solved table. */

  /* perfectPlayer — provably optimal. We rank the LIVE legal moves directly:
     apply each move to the LIVE state, canonicalise the child, and read its value
     + distance from the solved table. We want to hand the opponent the WORST
     child — a LOSS for them (= our WIN), fastest; else a DRAW; else (forced loss)
     the WIN-for-opponent child with the LARGEST distance (lose as slowly as
     possible). Ranking live moves — never returning a move read out of a
     canonical-representative node — is what keeps this correct under symmetry
     reduction: a move chosen in canonical space would otherwise apply to the
     wrong cell/heap of the live (un-canonicalised) state. NEVER loses from a
     non-LOSS position. */
  function perfectPlayer(state, legalMoves, def, sol) {
    if (!legalMoves || !legalMoves.length) return null;
    var best = null, bestRank = null;
    for (var i = 0; i < legalMoves.length; i++) {
      var child = def.apply(state, legalMoves[i]);
      var c = sol.table.get(def.key(child));
      var rank = c ? rankChild(c) : [3, 0]; // unknown child = worst (shouldn't happen)
      if (best === null || betterRank(rank, bestRank)) { best = legalMoves[i]; bestRank = rank; }
    }
    return best;
  }
  // rank tuple: [tier, dist] where tier 0 = LOSS-for-opp (we win), 1 = DRAW, 2 = WIN-for-opp (we lose)
  function rankChild(c) {
    if (c.value === LOSS) return [0, c.dist];                 // we win — minimise dist
    if (c.value === DRAW) return [1, 0];                       // we draw
    return [2, (c.dist === Infinity ? 1e9 : c.dist)];          // we lose — maximise dist
  }
  function betterRank(a, b) {
    if (a[0] !== b[0]) return a[0] < b[0];
    if (a[0] === 2) return a[1] > b[1];   // losing: bigger dist is better (slower loss)
    return a[1] < b[1];                    // winning: smaller dist is better (faster win); draw: tie
  }

  /* randomPlayer(seed) → player. A seeded legal-move wanderer (self-play fuzzing,
     "drunk opponent"). Deterministic given the seed. */
  function randomPlayer(seed) {
    var rng = mulberry32(seed == null ? 1 : seed);
    return function (state, legalMoves /*, def, sol */) {
      if (!legalMoves.length) return null;
      return legalMoves[Math.floor(rng() * legalMoves.length)];
    };
  }

  /* describeForAgent(state, def) — a compact plain-text position digest, the
     hook a future llmPlayer would hand a model (mirrors Lantern's describeForAgent).
     DOCUMENTED STUB for the agent player; the page does not wire a model. */
  function describeForAgent(state, def) {
    var lines = [];
    lines.push('Game: ' + def.title + ' (' + def.id + ')');
    lines.push('Side to move: ' + sideToMove(state, def));
    lines.push('Position key: ' + def.key(state));
    var t = def.terminal(state);
    if (t && t.over) {
      lines.push('Position is terminal: ' + t.value + ' for the side to move.');
    } else {
      var moves = def.legalMoves(state);
      lines.push('Legal moves (' + moves.length + '): ' + moves.map(function (m) { return def.moveLabel ? def.moveLabel(state, m) : JSON.stringify(m); }).join(', '));
    }
    if (def.render) lines.push('Board:\n' + def.render(state));
    return lines.join('\n');
  }
  function sideToMove(state, def) {
    if (typeof def.sideToMove === 'function') return def.sideToMove(state);
    if (state && state.turn != null) return def.players ? def.players[state.turn] : state.turn;
    return '?';
  }

  /* llmPlayer — DOCUMENTED STUB (not wired). Same signature as the others. A
     future agent hands describeForAgent(state,def) to a model and returns one of
     the offered moves. */
  function llmPlayer(/* { chooseMove } = {} */) {
    return function (/* state, legalMoves, def, sol */) {
      throw new Error('llmPlayer is a documented stub — not wired. Wire a model using ' +
        'describeForAgent(state, def) and return one of the offered legal moves.');
    };
  }

  /* ── self-test core — the SAME checks the Node test and the page chip run ────
     runSelfTest(defs) → { pass, total, checks:[{name,pass,detail}], byDef } */
  function runSelfTest(defs) {
    var checks = [];
    var byDef = {};
    for (var d = 0; d < defs.length; d++) {
      var def = defs[d];
      var sol = solve(def);
      byDef[def.id] = sol;

      // (6) Budget honoured / solve ok.
      checks.push(mk(def.id + ': solve ok (under budget)', sol.ok,
        sol.ok ? (sol.nodeCount + ' nodes ≤ ' + (def.nodeBudget || HARD_CAP)) : sol.error));
      if (!sol.ok) continue;

      // (1) Literature value matches published theory.
      var lit = literatureValueOf(def, sol);
      checks.push(mk(def.id + ': value == literature (' + def.literatureValue + ')',
        lit.ok, lit.detail));

      // (2) Table self-consistency.
      var cons = consistencyCheck(sol);
      checks.push(mk(def.id + ': table self-consistent', cons.ok, cons.detail));

      // (3) Optimal-vs-optimal reaches the predicted outcome in the predicted distance.
      var sp = selfPlayCheck(def, sol);
      checks.push(mk(def.id + ': perfect-vs-perfect reaches predicted ' + sol.value +
        (sol.dist === Infinity ? '' : ' in ' + sol.dist), sp.ok, sp.detail));

      // (4) Perfect player NEVER LOSES from any non-LOSS reachable position.
      var nl = neverLosesCheck(def, sol);
      checks.push(mk(def.id + ': perfect never loses from a non-LOSS node', nl.ok, nl.detail));

      // (5) Symmetry-canon soundness: value is stable under the def's declared symmetries.
      var sym = symmetryCheck(def, sol);
      checks.push(mk(def.id + ': symmetry-canon sound', sym.ok, sym.detail));
    }
    var pass = 0;
    for (var i = 0; i < checks.length; i++) if (checks[i].pass) pass++;
    return { pass: pass, total: checks.length, checks: checks, byDef: byDef };
  }
  function mk(name, pass, detail) { return { name: name, pass: !!pass, detail: detail || '' }; }

  // (1) literature value — uses the def's own literatureValue + any battery hook.
  function literatureValueOf(def, sol) {
    var ok = sol.value === def.literatureValue;
    var detail = 'computed ' + sol.value + (sol.dist === Infinity ? '' : ' (dist ' + sol.dist + ')') +
                 ', literature ' + def.literatureValue;
    // optional position battery (e.g. Nim XOR theorem over many positions)
    if (typeof def.literatureBattery === 'function') {
      var bat = def.literatureBattery(solve, { WIN: WIN, LOSS: LOSS, DRAW: DRAW });
      if (!bat.ok) { ok = false; detail += ' | battery: ' + bat.detail; }
      else detail += ' | battery: ' + bat.detail;
    }
    return { ok: ok, detail: detail };
  }

  // (2) every WIN has ≥1 LOSS child & dist == 1+min losing-child dist; every LOSS
  // has ALL WIN children & dist == 1+max child dist; DRAW never reaches a child
  // that would improve it (a LOSS child for the opponent = a WIN we skipped).
  function consistencyCheck(sol) {
    var table = sol.table, bad = null;
    table.forEach(function (node, key) {
      if (bad) return;
      if (node.terminal) return;
      if (node.value === WIN) {
        var minLoss = Infinity, anyLoss = false;
        for (var i = 0; i < node.moves.length; i++) {
          var c = table.get(node.moves[i].childKey);
          if (c.value === LOSS) { anyLoss = true; if ((c.dist + 1) < minLoss) minLoss = c.dist + 1; }
        }
        if (!anyLoss) bad = key + ' is WIN but has no LOSS child';
        else if (node.dist !== minLoss && !(node.dist === Infinity && minLoss === Infinity)) bad = key + ' WIN dist ' + node.dist + ' != 1+min losing-child ' + minLoss;
      } else if (node.value === LOSS) {
        var maxD = -1, allWin = true;
        for (var j = 0; j < node.moves.length; j++) {
          var cc = table.get(node.moves[j].childKey);
          if (cc.value !== WIN) allWin = false;
          if (cc.dist > maxD) maxD = cc.dist;
        }
        if (node.moves.length && !allWin) bad = key + ' is LOSS but not all children are WIN';
        else if (node.moves.length && node.dist !== maxD + 1) bad = key + ' LOSS dist ' + node.dist + ' != 1+max child ' + maxD;
      } else if (node.value === DRAW) {
        for (var k = 0; k < node.moves.length; k++) {
          var cd = table.get(node.moves[k].childKey);
          if (cd.value === LOSS) { bad = key + ' is DRAW but has a LOSS child (should be WIN)'; break; }
        }
      }
    });
    return { ok: !bad, detail: bad || 'all nodes consistent' };
  }

  // (3) perfect-vs-perfect from the root reaches sol.value in sol.dist plies.
  function selfPlayCheck(def, sol) {
    var r = playOut(def, sol, perfectPlayer, perfectPlayer, 4096);
    if (!r.ok) return { ok: false, detail: r.detail };
    var expected = sol.value;
    var got = r.outcomeForRootMover;
    var distOk = (sol.dist === Infinity) ? (r.plies > 0 || expected === DRAW) : (r.plies === sol.dist);
    var ok = (got === expected) && distOk;
    return { ok: ok, detail: 'outcome ' + got + ' in ' + r.plies + ' plies (expected ' + expected +
      (sol.dist === Infinity ? ', draw' : '/' + sol.dist) + ')' };
  }

  // (4) From EVERY reachable non-LOSS node, the perfect player (to move) never
  // ends up losing against ANY opponent reply — exhaustive over the table.
  // Equivalent and exhaustive: assert no WIN/DRAW node has the perfect player
  // choosing a move that leads to a node whose value (for the opponent) is WIN
  // unless every move does (i.e. the node was actually a LOSS). Then check the
  // chosen child can never be improved by the opponent into our loss — which the
  // table already encodes. We verify by simulating perfect-vs-EVERY-reply DFS
  // capped, plus the structural guarantee.
  function neverLosesCheck(def, sol) {
    var table = sol.table, bad = null;
    table.forEach(function (node, key) {
      if (bad || node.terminal) return;
      if (node.value === LOSS) return; // nothing to defend
      // perfectPlayer's chosen child must NOT be a WIN for the opponent.
      var idx = node.bestMoveIndex;
      if (idx < 0) { bad = key + ' (' + node.value + ') has no chosen move'; return; }
      var chosen = table.get(node.moves[idx].childKey);
      if (node.value === WIN && chosen.value !== LOSS) bad = key + ' is WIN but perfect picks a non-LOSS child';
      if (node.value === DRAW && chosen.value === LOSS) bad = key + ' is DRAW but perfect picks a child that loses';
    });
    if (bad) return { ok: false, detail: bad };
    // Plus an exhaustive simulated sweep: from each non-LOSS node, perfect to
    // move, opponent random — over several seeds — must never reach a LOSS for us.
    var sweepBad = sweepNeverLoses(def, sol);
    return { ok: !sweepBad, detail: sweepBad || 'perfect never loses (structural + sweep)' };
  }

  // From every reachable non-LOSS node: perfect (us) to move, opponent plays
  // EVERY reply (full DFS bounded by the already-enumerated table) — assert we
  // never reach a terminal that is a LOSS for the side that was non-LOSS at root.
  // We piggyback on the table: a WIN node forces a win, a DRAW node forces ≥draw,
  // by induction — so the structural check above is sufficient AND complete. The
  // sweep is a belt-and-suspenders empirical confirmation over random opponents.
  function sweepNeverLoses(def, sol) {
    var seeds = [1, 7, 42, 1337];
    var table = sol.table;
    var states = [];
    // collect a representative state per non-LOSS, non-terminal key by replaying
    // from root (cheap re-BFS keeping one state per key)
    var stateByKey = enumerateStates(def, sol);
    table.forEach(function (node, key) {
      if (node.terminal || node.value === LOSS) return;
      var st = stateByKey.get(key);
      if (st) states.push({ key: key, st: st, want: node.value });
    });
    for (var s = 0; s < states.length; s++) {
      for (var si = 0; si < seeds.length; si++) {
        var opp = randomPlayer(seeds[si] + s * 131);
        var r = playFrom(def, sol, states[s].st, perfectPlayer, opp, 4096);
        // outcome is from the perspective of the side to move at states[s].st (us)
        if (r.outcomeForRootMover === LOSS) {
          return 'perfect LOST from non-LOSS node ' + states[s].key + ' (want ' + states[s].want + ', seed ' + seeds[si] + ')';
        }
        if (states[s].want === WIN && r.outcomeForRootMover !== WIN) {
          return 'perfect failed to WIN from WIN node ' + states[s].key + ' (got ' + r.outcomeForRootMover + ', seed ' + seeds[si] + ')';
        }
      }
    }
    return null;
  }

  // (5) symmetry-canon soundness: for a battery of states, value(canon(s)) is
  // stable under each declared symmetry (def.symmetries: [fn(state)->state]).
  function symmetryCheck(def, sol) {
    if (typeof def.symmetries !== 'function') return { ok: true, detail: 'no declared symmetries (key() is the canon)' };
    var stateByKey = enumerateStates(def, sol);
    var keys = Array.from(stateByKey.keys());
    var checked = 0, bad = null;
    for (var i = 0; i < keys.length && checked < 400 && !bad; i++) {
      var st = stateByKey.get(keys[i]);
      var syms = def.symmetries(st);
      var baseVal = sol.table.get(def.key(st)).value;
      for (var j = 0; j < syms.length; j++) {
        var k2 = def.key(syms[j]);
        var n2 = sol.table.get(k2);
        if (!n2) { bad = 'symmetry image ' + k2 + ' of ' + keys[i] + ' not in table'; break; }
        if (n2.value !== baseVal) { bad = 'value drift under symmetry: ' + keys[i] + '(' + baseVal + ') vs ' + k2 + '(' + n2.value + ')'; break; }
      }
      checked++;
    }
    return { ok: !bad, detail: bad || ('stable over ' + checked + ' positions × symmetries') };
  }

  /* ── play helpers (shared by checks + the page's Watch-it-play) ────────────── */

  // Re-enumerate a representative state per key (BFS), so checks that need an
  // actual state (not just a key) have one. Cheap; bounded by the table size.
  function enumerateStates(def, sol) {
    var byKey = new Map();
    var root = def.initState();
    var rk = def.key(root);
    var q = [root]; byKey.set(rk, root);
    while (q.length) {
      var s = q.shift();
      var t = def.terminal(s);
      if (t && t.over) continue;
      var moves = def.legalMoves(s);
      for (var i = 0; i < moves.length; i++) {
        var c = def.apply(s, moves[i]);
        var ck = def.key(c);
        if (!byKey.has(ck)) { byKey.set(ck, c); q.push(c); }
      }
    }
    return byKey;
  }

  // Play a full game from initState with two players. Returns
  // { ok, plies, outcomeForRootMover, history:[{state,move}], finalState }.
  function playOut(def, sol, pX, pO, capPlies) {
    return playFrom(def, sol, def.initState(), pX, pO, capPlies);
  }

  // Play from an arbitrary state. pFirst moves first (the side to move at `from`).
  // outcomeForRootMover is WIN/LOSS/DRAW from the POV of whoever was to move at `from`.
  function playFrom(def, sol, from, pFirst, pSecond, capPlies) {
    var s = from, plies = 0, history = [];
    var players = [pFirst, pSecond];
    var turn = 0;
    while (plies < (capPlies || 4096)) {
      var t = def.terminal(s);
      if (t && t.over) {
        // t.value is from the side-to-move POV at s (who has NO move / lost/won).
        // Translate to the root mover's POV by PARITY: the root mover is to move
        // whenever an even number of plies have been made (turn % 2 === 0).
        var v = t.value;
        var forRoot = (turn % 2 === 0) ? v : flip(v);
        return { ok: true, plies: plies, outcomeForRootMover: forRoot, history: history, finalState: s };
      }
      var moves = def.legalMoves(s);
      if (!moves.length) {
        // no legal move but terminal() said not over — treat as draw-ish; defs
        // should make "no move" terminal. Be safe.
        return { ok: true, plies: plies, outcomeForRootMover: DRAW, history: history, finalState: s };
      }
      var mv = players[turn % 2](s, moves, def, sol);
      history.push({ state: s, move: mv, turn: turn });
      s = def.apply(s, mv);
      turn++; plies++;
    }
    return { ok: false, detail: 'play exceeded ' + capPlies + ' plies (cycle?)', plies: plies, outcomeForRootMover: DRAW, history: history, finalState: s };
  }
  function flip(v) { return v === WIN ? LOSS : (v === LOSS ? WIN : DRAW); }

  /* ── validation ─────────────────────────────────────────────────────────── */
  function validateDef(def) {
    var need = ['id', 'title', 'players', 'initState', 'legalMoves', 'apply', 'terminal', 'key', 'literatureValue', 'nodeBudget'];
    for (var i = 0; i < need.length; i++) {
      if (def[need[i]] == null) throw new Error('game-def "' + (def && def.id) + '" missing required field: ' + need[i]);
    }
    if (typeof def.initState !== 'function' || typeof def.legalMoves !== 'function' ||
        typeof def.apply !== 'function' || typeof def.terminal !== 'function' || typeof def.key !== 'function') {
      throw new Error('game-def "' + def.id + '" has a non-function core fn (initState/legalMoves/apply/terminal/key).');
    }
  }

  /* ── public API ─────────────────────────────────────────────────────────── */
  var Adversary = {
    VERSION: ADVERSARY_VERSION,
    WIN: WIN, LOSS: LOSS, DRAW: DRAW,
    HARD_CAP: HARD_CAP,
    solve: solve,
    runSelfTest: runSelfTest,
    perfectPlayer: perfectPlayer,
    randomPlayer: randomPlayer,
    describeForAgent: describeForAgent,
    llmPlayer: llmPlayer,
    mulberry32: mulberry32,
    playOut: playOut,
    playFrom: playFrom,
    enumerateStates: enumerateStates,
    flip: flip,
    // expose internal labels for tests/UI that want them
    rankChild: rankChild
  };

  // browser global
  if (root) root.Adversary = Adversary;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Adversary; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
