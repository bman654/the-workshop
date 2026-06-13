/* ═══════════════════════════════════════════════════════════════════════════
   patience.js — the Workshop's Patience engine (the one source of truth).

   A reusable solitaire/patience core, Lantern-shaped:
     • ONE DOM-free pure core + headless solver (this file) — Node-requireable,
       used to PROVE a deal winnable BEFORE it ships, AND inlined into the page
       so play & proof can never drift (same code, two targets).
     • The solitaire variant is modelled as a STATE + pure rule functions
       (initialDeal / legalMoves / applyMove / isWin / key) — plain serialisable
       objects, no DOM, no clock, no Math.random.
     • PLAYERS as functions over the recorded winning line (hint / autoSolve) —
       exactly the Lantern (state, legalMoves, world) → move idiom.

   This file is a dual-use IIFE: in a browser it attaches a global `Patience`;
   under Node it exports via the module guard at the bottom (which forge strips
   when inlining, so the shipped page carries clean source). DOM-free.

   ── THE CRUX ──────────────────────────────────────────────────────────────
   The dealer ships ONLY deals the solver has already BEATEN.

     dealWinnable(seed) rejection-samples: deal a board from a seed, run the
     headless solver; if it finds a winning line within budget, KEEP the deal
     (and cache the line for hints / auto-solve); else advance the seed and
     retry. So the claim "every deal you are handed is winnable" is TRUE BY
     CONSTRUCTION — and the self-test PROVES it by replaying each shipped deal's
     recorded line move-by-move to a win.

   The variant is a compact FreeCell (a reduced 28-card deck): FreeCell is the
   famously-winnable, well-understood, tractable solitaire; shrinking the deck
   keeps the reachable graph small enough that the solver wins essentially every
   deal in a few thousand nodes, so the rejection-sampling dealer is FAST and
   RELIABLE in the browser. See patience/SPEC.md §0.

   solve() is a deterministic best-first DFS over canonical state KEYS with a
   transposition table, cycle avoidance, FreeCell move-ordering heuristics, and a
   node budget. It returns a winning move sequence or "not found within budget".
   The page's green chip and `node patience.test.cjs` call the SAME core, so a
   green chip in the page is the same proof as the command line.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var PATIENCE_VERSION = '1.0';

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

  /* ═══════════════════════════════════════════════════════════════════════════
     THE VARIANT — compact FreeCell as DATA + pure rules.

       deck:   4 suits × RANKS ranks  (default RANKS=7 → A..7 → 28 cards)
       FREE:   number of free cells (default 3)
       COLS:   number of tableau columns (default 6)

     A CARD is an integer 0..deckSize-1:  suit = card % 4 ,  rank = (card/4|0)+1
       suit 0,1 = red (♦ ♥) ;  suit 2,3 = black (♣ ♠)   (colour = suit < 2)

     STATE (plain, serialisable):
       { free: [card|null × FREE],          // the free cells (sorted-canonical in key)
         found: [rank × 4],                 // foundation top rank per suit (0 = empty)
         cols: [ [card,...] × COLS ] }       // tableau columns, index 0 = bottom

     A MOVE is { from, to, card } where from/to are location tokens:
       'fN'  free cell N           'cN'  column N            'F'  the foundations
     `card` is the moved card (single-card moves only — supermoves are expanded
     into single steps so soundness is checkable card-by-card).
     ═══════════════════════════════════════════════════════════════════════════ */

  var SUITS = ['♦', '♥', '♣', '♠'];

  function makeVariant(opts) {
    opts = opts || {};
    var ranks = opts.ranks != null ? opts.ranks : 7;
    var free = opts.free != null ? opts.free : 3;
    var cols = opts.cols != null ? opts.cols : 6;
    var deckSize = ranks * 4;
    return { ranks: ranks, free: free, cols: cols, deckSize: deckSize, suits: 4 };
  }

  /* card helpers */
  function suitOf(card) { return card & 3; }
  function rankOf(card) { return (card >> 2) + 1; }          // 1..ranks
  function colourOf(card) { return suitOf(card) < 2 ? 0 : 1; } // 0=red, 1=black
  function makeCard(suit, rank) { return ((rank - 1) << 2) | suit; }
  function cardLabel(card) {
    if (card == null) return '·';
    var r = rankOf(card), s = SUITS[suitOf(card)];
    var rl = r === 1 ? 'A' : (r === 11 ? 'J' : (r === 12 ? 'Q' : (r === 13 ? 'K' : String(r))));
    return rl + s;
  }

  /* ── initialDeal(variant, seed): a deterministic Fisher–Yates shuffle, then a
     left-to-right round-robin deal across the columns. Pure: depends only on
     (variant, seed). ───────────────────────────────────────────────────────── */
  function initialDeal(variant, seed) {
    var v = variant;
    var rng = mulberry32((seed >>> 0) || 1);
    var deck = [];
    for (var i = 0; i < v.deckSize; i++) deck.push(i);
    // Fisher–Yates with the seeded PRNG
    for (var j = deck.length - 1; j > 0; j--) {
      var k = Math.floor(rng() * (j + 1));
      var tmp = deck[j]; deck[j] = deck[k]; deck[k] = tmp;
    }
    var cols = [];
    for (var c = 0; c < v.cols; c++) cols.push([]);
    for (var d = 0; d < deck.length; d++) cols[d % v.cols].push(deck[d]);
    var freeArr = [];
    for (var f = 0; f < v.free; f++) freeArr.push(null);
    var found = [0, 0, 0, 0];
    return { free: freeArr, found: found, cols: cols };
  }

  /* ── cloneState: deep copy of the plain state. ─────────────────────────────── */
  function cloneState(s) {
    var cols = new Array(s.cols.length);
    for (var i = 0; i < s.cols.length; i++) cols[i] = s.cols[i].slice();
    return { free: s.free.slice(), found: s.found.slice(), cols: cols };
  }

  /* ── key(variant, state): a canonical hash string for the transposition table.
     The free cells are order-INDEPENDENT (a card in cell 0 vs cell 1 is the same
     game), and EMPTY columns are interchangeable, so we canonicalise: sort the
     free cells, and sort the columns by their content. This collapses symmetric
     states and shrinks the search dramatically. ─────────────────────────────── */
  function key(variant, s) {
    var fr = s.free.slice().sort(function (a, b) {
      return (a == null ? -1 : a) - (b == null ? -1 : b);
    });
    var colStrs = new Array(s.cols.length);
    for (var i = 0; i < s.cols.length; i++) colStrs[i] = s.cols[i].join(',');
    colStrs.sort();
    return s.found.join('.') + '|' + fr.join(',') + '|' + colStrs.join(';');
  }

  /* ── isWin(variant, state): all foundations built up to the top rank. ───────── */
  function isWin(variant, s) {
    for (var i = 0; i < 4; i++) if (s.found[i] !== variant.ranks) return false;
    return true;
  }

  /* tableau stacking rule: `card` may sit on `onto` iff alternating colour and
     onto.rank === card.rank + 1. */
  function canStack(card, onto) {
    return colourOf(card) !== colourOf(onto) && rankOf(onto) === rankOf(card) + 1;
  }
  /* foundation rule: `card` may go up iff its suit's top is exactly rank-1. */
  function canFound(s, card) {
    return s.found[suitOf(card)] === rankOf(card) - 1;
  }

  /* ── legalMoves(variant, state): every single-card move currently legal.
     Sources: each free cell, the top of each column. Targets: foundations,
     other columns (onto a valid card OR an empty column), and free cells.
     We DO NOT pre-expand supermoves here — multi-card sequence moves are a UI
     convenience the page layers on top by replaying single steps; the solver and
     the proof only ever reason about these atomic, individually-legal moves. ─── */
  function legalMoves(variant, s) {
    var moves = [];
    var v = variant;
    var firstEmptyFree = -1;
    for (var f = 0; f < v.free; f++) if (s.free[f] == null) { firstEmptyFree = f; break; }
    var firstEmptyCol = -1;
    for (var ec = 0; ec < v.cols; ec++) if (s.cols[ec].length === 0) { firstEmptyCol = ec; break; }

    // sources: free cells (occupied) + column tops (non-empty)
    var sources = [];
    for (var fi = 0; fi < v.free; fi++) {
      if (s.free[fi] != null) sources.push({ tok: 'f' + fi, card: s.free[fi], fromCol: -1 });
    }
    for (var ci = 0; ci < v.cols; ci++) {
      var col = s.cols[ci];
      if (col.length) sources.push({ tok: 'c' + ci, card: col[col.length - 1], fromCol: ci });
    }

    for (var si = 0; si < sources.length; si++) {
      var src = sources[si], card = src.card;
      // → foundation
      if (canFound(s, card)) moves.push({ from: src.tok, to: 'F', card: card });
      // → a column
      for (var tc = 0; tc < v.cols; tc++) {
        if (src.fromCol === tc) continue;            // same column = no-op
        var dcol = s.cols[tc];
        if (dcol.length === 0) {
          // only the FIRST empty column is a distinct target (the rest are symmetric)
          if (tc === firstEmptyCol) moves.push({ from: src.tok, to: 'c' + tc, card: card });
        } else if (canStack(card, dcol[dcol.length - 1])) {
          moves.push({ from: src.tok, to: 'c' + tc, card: card });
        }
      }
      // → a free cell (only from a column; cell→cell is a pointless shuffle).
      // Only the FIRST empty free cell is a distinct target (cells are symmetric).
      if (src.fromCol !== -1 && firstEmptyFree !== -1) {
        moves.push({ from: src.tok, to: 'f' + firstEmptyFree, card: card });
      }
    }
    return moves;
  }

  /* parse a location token → { kind:'free'|'col'|'found', idx } */
  function parseTok(tok) {
    if (tok === 'F') return { kind: 'found' };
    if (tok.charAt(0) === 'f') return { kind: 'free', idx: +tok.slice(1) };
    return { kind: 'col', idx: +tok.slice(1) };
  }

  /* lift the moving card OFF its source, returning [card, newState-in-place].
     Mutates `s` (caller passes a fresh clone). Returns the lifted card or null
     if the move's `from`/`card` does not match the live top (illegal). */
  function liftFrom(s, mv) {
    var p = parseTok(mv.from);
    if (p.kind === 'free') {
      if (s.free[p.idx] !== mv.card) return null;
      s.free[p.idx] = null;
      return mv.card;
    }
    // column
    var col = s.cols[p.idx];
    if (!col.length || col[col.length - 1] !== mv.card) return null;
    col.pop();
    return mv.card;
  }

  /* ── applyMove(variant, state, move): a NEW immutable state with the move done.
     Validates the move against the live state; throws on an illegal move so no
     illegal state can ever be reached through applyMove. ─────────────────────── */
  function applyMove(variant, s, mv) {
    var ns = cloneState(s);
    var card = liftFrom(ns, mv);
    if (card == null) throw new Error('illegal move (source mismatch): ' + JSON.stringify(mv));
    var t = parseTok(mv.to);
    if (t.kind === 'found') {
      if (!canFound(ns, card)) throw new Error('illegal foundation move: ' + cardLabel(card));
      ns.found[suitOf(card)] = rankOf(card);
    } else if (t.kind === 'free') {
      if (ns.free[t.idx] != null) throw new Error('illegal free-cell move (occupied)');
      ns.free[t.idx] = card;
    } else { // col
      var dcol = ns.cols[t.idx];
      if (dcol.length && !canStack(card, dcol[dcol.length - 1])) {
        throw new Error('illegal tableau move: ' + cardLabel(card) + ' onto ' + cardLabel(dcol[dcol.length - 1]));
      }
      dcol.push(card);
    }
    return ns;
  }

  /* count cards in a state (conservation invariant helper) */
  function cardCount(s) {
    var n = 0;
    for (var i = 0; i < s.free.length; i++) if (s.free[i] != null) n++;
    for (var j = 0; j < s.found.length; j++) n += s.found[j];
    for (var c = 0; c < s.cols.length; c++) n += s.cols[c].length;
    return n;
  }
  /* the multiset of all cards present (for duplicate/loss detection) */
  function allCards(s) {
    var out = [];
    for (var i = 0; i < s.free.length; i++) if (s.free[i] != null) out.push(s.free[i]);
    for (var su = 0; su < 4; su++) for (var r = 1; r <= s.found[su]; r++) out.push(makeCard(su, r));
    for (var c = 0; c < s.cols.length; c++) for (var k = 0; k < s.cols[c].length; k++) out.push(s.cols[c][k]);
    return out;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THE SOLVER — deterministic best-first DFS over canonical keys.

     • Transposition table (visited Set of key(state)) — never revisit a state.
     • Auto-play of forced foundation moves ("safe automoves") before branching:
       a card is SAFELY auto-foundationed when both opposite-colour cards one rank
       lower are already up (so it can never be needed to host a tableau move).
       This collapses huge swaths of the tree and is a standard FreeCell solver
       technique; it is SOUND (an auto-moved card was provably never needed).
     • Move ordering (best-first): foundation moves, then tableau→tableau that
       reveal/relocate usefully, then moves to free cells, then to empty columns —
       cheapest-first so a winning line is usually found shallow.
     • A node BUDGET (default 200k expansions) caps the search; over budget →
       "not found".
     Returns { solved, line:[move...], nodes }. The recorded `line` is the exact
     sequence of ATOMIC moves whose replay reaches isWin. ─────────────────────── */

  var DEFAULT_BUDGET = 200000;

  /* safe-automove test: can `card` go to foundation AND never be needed below?
     FreeCell safe rule: auto-up a card of rank r, colour X iff BOTH foundations
     of the OPPOSITE colour are already at rank ≥ r-1 (so no opposite-colour card
     of rank r-1 still needs a home on this card), AND its own colour's other
     foundation is at ≥ r-2. Aces & twos are always safe. */
  function isSafeAutomove(variant, s, card) {
    if (!canFound(s, card)) return false;
    var r = rankOf(card);
    if (r <= 2) return true;
    var col = colourOf(card);
    // the two opposite-colour suits
    var opp = col === 0 ? [2, 3] : [0, 1];
    var same = col === 0 ? [0, 1] : [2, 3];
    var sameOther = same[0] === suitOf(card) ? same[1] : same[0];
    if (s.found[opp[0]] < r - 1) return false;
    if (s.found[opp[1]] < r - 1) return false;
    if (s.found[sameOther] < r - 2) return false;
    return true;
  }

  /* apply all currently-safe automoves repeatedly; returns { state, moves } */
  function autoFoundation(variant, s) {
    var moves = [];
    var cur = s;
    var changed = true;
    while (changed) {
      changed = false;
      // free cells
      for (var f = 0; f < variant.free; f++) {
        var fc = cur.free[f];
        if (fc != null && isSafeAutomove(variant, cur, fc)) {
          var mvF = { from: 'f' + f, to: 'F', card: fc };
          cur = applyMove(variant, cur, mvF); moves.push(mvF); changed = true;
        }
      }
      // column tops
      for (var c = 0; c < variant.cols.length; c++) {
        var col = cur.cols[c];
        if (col.length) {
          var top = col[col.length - 1];
          if (isSafeAutomove(variant, cur, top)) {
            var mvC = { from: 'c' + c, to: 'F', card: top };
            cur = applyMove(variant, cur, mvC); moves.push(mvC); changed = true;
          }
        }
      }
    }
    return { state: cur, moves: moves };
  }

  /* ── heuristic h(state): an estimate of "distance to the win", used to steer the
     best-first search toward goal-directed (hence SHORT, watchable) lines. It is
     only a guide, never relied on for soundness — the recorded line is always
     replay-verified. Lower = closer to the win.
       • every card not yet on a foundation must still be played (≈ that many moves);
       • an occupied free cell is a card that must still be unloaded (+1 each);
       • a low card buried under higher cards in a column is expensive to free
         (+1 per card that sits on top of a foundation-ready-ish low card). ── */
  function heuristic(variant, s) {
    var onFound = 0;
    for (var i = 0; i < 4; i++) onFound += s.found[i];
    var h = (variant.deckSize - onFound) * 2;   // cards still to home (weighted)
    for (var f = 0; f < s.free.length; f++) if (s.free[f] != null) h += 1;
    // buried-card penalty: a card blocks its foundation if a lower same-suit card
    // sits above it in the same column (it must be dug out).
    for (var c = 0; c < s.cols.length; c++) {
      var col = s.cols[c];
      for (var a = 0; a < col.length; a++) {
        for (var b = a + 1; b < col.length; b++) {
          if (suitOf(col[a]) === suitOf(col[b]) && rankOf(col[a]) > rankOf(col[b])) { h += 1; break; }
        }
      }
    }
    return h;
  }

  /* a tiny binary min-heap keyed by node.f (deterministic; ties broken by a
     monotonically-increasing insertion sequence so ordering never depends on the
     environment). */
  function Heap() { this.a = []; }
  Heap.prototype.push = function (node) {
    var a = this.a; a.push(node); var i = a.length - 1;
    while (i > 0) {
      var p = (i - 1) >> 1;
      if (a[p].f < a[i].f || (a[p].f === a[i].f && a[p].seq <= a[i].seq)) break;
      var t = a[p]; a[p] = a[i]; a[i] = t; i = p;
    }
  };
  Heap.prototype.pop = function () {
    var a = this.a; if (!a.length) return null;
    var top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; var i = 0, n = a.length;
      while (true) {
        var l = 2 * i + 1, r = l + 1, m = i;
        if (l < n && (a[l].f < a[m].f || (a[l].f === a[m].f && a[l].seq < a[m].seq))) m = l;
        if (r < n && (a[r].f < a[m].f || (a[r].f === a[m].f && a[r].seq < a[m].seq))) m = r;
        if (m === i) break;
        var t = a[i]; a[i] = a[m]; a[m] = t; i = m;
      }
    }
    return top;
  };
  Heap.prototype.size = function () { return this.a.length; };

  /* solve(variant, state, opts) → { solved, line, nodes, reason }

     A deterministic BEST-FIRST (weighted-A*) search over canonical state keys:
       f = g + W·h ,  g = moves so far,  h = heuristic above,  W = 3 (goal-greedy
       so we find a short line fast). A transposition table (visited key set) gives
       cycle avoidance + dedup; a node BUDGET caps the work. We auto-foundation the
       forced "safe" moves on entry to every node (a sound pruning). The returned
       `line` is the exact atomic-move sequence whose replay reaches isWin; it is
       short enough to "watch it solve itself". No Math.random, no wall-clock. ── */
  var SEARCH_W = 3;
  function solve(variant, startState, opts) {
    opts = opts || {};
    var budget = opts.budget != null ? opts.budget : DEFAULT_BUDGET;
    var visited = {};            // transposition table: key → best g seen
    var nodes = 0;
    var seq = 0;

    var startAuto = autoFoundation(variant, cloneState(startState));
    var rootState = startAuto.state;
    var rootPath = startAuto.moves.slice();
    if (isWin(variant, rootState)) return { solved: true, line: rootPath, nodes: 0, reason: 'trivial' };

    var heap = new Heap();
    var rk = key(variant, rootState);
    visited[rk] = 0;
    heap.push({ state: rootState, path: rootPath, g: 0, f: SEARCH_W * heuristic(variant, rootState), seq: seq++ });

    while (heap.size()) {
      if (nodes > budget) return { solved: false, line: null, nodes: nodes, reason: 'budget' };
      var cur = heap.pop();
      if (isWin(variant, cur.state)) return { solved: true, line: cur.path, nodes: nodes, reason: 'solved' };
      var moves = legalMoves(variant, cur.state);
      for (var mi = 0; mi < moves.length; mi++) {
        var mv = moves[mi];
        nodes++;
        var afterMove = applyMove(variant, cur.state, mv);
        var auto = autoFoundation(variant, afterMove);
        var child = auto.state;
        var k = key(variant, child);
        var g2 = cur.g + 1 + auto.moves.length;
        if (visited[k] != null && visited[k] <= g2) continue;
        visited[k] = g2;
        var childPath = cur.path.concat([mv], auto.moves);
        heap.push({ state: child, path: childPath, g: g2, f: g2 + SEARCH_W * heuristic(variant, child), seq: seq++ });
      }
    }
    return { solved: false, line: null, nodes: nodes, reason: 'exhausted' };
  }

  /* ── shortenLine: a SOUND post-process that removes wandering from a found line
     so "watch it solve itself" is watchable. DFS finds *a* win, not a short one;
     this splices out any loop — whenever a state KEY recurs along the replay, the
     moves between the two visits are pure detour and are dropped. The result is
     still a legal move-by-move line from the same deal to the same win (we only
     ever keep a contiguous subsequence between distinct states), so it cannot
     break the soundness or winnability proof. Idempotent; runs to a fixpoint. ── */
  function shortenLine(variant, startState, line) {
    var cur = line;
    for (var pass = 0; pass < 6; pass++) {
      var s = cloneState(startState);
      var firstSeen = {};                 // key → index along the path (states BEFORE move i)
      var spliced = null;
      firstSeen[key(variant, s)] = 0;
      for (var i = 0; i < cur.length; i++) {
        s = applyMove(variant, s, cur[i]);
        var k = key(variant, s);
        if (firstSeen[k] != null) {
          // state after move i == state we were in before move firstSeen[k]:
          // drop moves [firstSeen[k] .. i] (inclusive) — that whole span was a loop.
          spliced = cur.slice(0, firstSeen[k]).concat(cur.slice(i + 1));
          break;
        }
        firstSeen[k] = i + 1;
      }
      if (!spliced) break;                 // no loop found → fixpoint
      cur = spliced;
    }
    return cur;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THE WINNABLE DEALER — rejection sampling.

     dealWinnable(variant, seed, opts) advances the seed until the solver beats a
     deal within budget, then returns the KEPT deal with its proven solution
     cached. So every board this hands out is one the solver has already won. ─── */
  function dealWinnable(variant, seed, opts) {
    opts = opts || {};
    var maxTries = opts.maxTries != null ? opts.maxTries : 200;
    var budget = opts.budget != null ? opts.budget : DEFAULT_BUDGET;
    var s = (seed >>> 0) || 1;
    for (var tries = 0; tries < maxTries; tries++) {
      var deal = initialDeal(variant, s);
      var res = solve(variant, deal, { budget: budget });
      if (res.solved) {
        return {
          seed: s, deal: deal, solution: res.line,
          nodes: res.nodes, tries: tries + 1, variant: variant
        };
      }
      s = (s + 1) >>> 0; if (s === 0) s = 1;
    }
    return null; // (should never happen for the default compact variant)
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PLAYERS — Lantern (state, legalMoves, recordedLine) → move.

     A "player" drives hint() / autoSolve(): given the live state and the deal's
     recorded winning line, it returns the next move ON that line that is legal
     from the current state. Because the recorded line is a sequence of atomic
     legal moves, replaying it from the deal reproduces the win exactly. ─────── */

  /* linePlayer(line): returns a function(state, moves) → the next unplayed move
     on `line` whose source/target are currently legal, or null if the line has
     diverged from the player's actual state (UI then asks for a re-sync). It
     matches positionally by walking `line`, skipping moves already reflected in
     the state. The simplest robust contract: track an index. */
  function linePlayer(line) {
    var idx = 0;
    return function (variant, s) {
      // Walk forward over the recorded line. The canonical replay-from-deal path
      // marches idx straight through; we ALSO tolerate a re-sync after Undo by
      // verifying the move is legal from the live state before returning it.
      if (idx >= line.length) return null;
      var mv = line[idx];
      var legal = legalMoves(variant, s);
      for (var i = 0; i < legal.length; i++) {
        if (legal[i].from === mv.from && legal[i].to === mv.to && legal[i].card === mv.card) {
          idx++;            // consume this move; the caller applies it next
          return mv;
        }
      }
      // not legal from here (state diverged from the recorded line) → stop
      return null;
    };
  }

  /* hint(variant, state, line): the single next move on the recorded line that is
     legal right now, or null. (Stateless convenience over the line.) */
  function hint(variant, s, line) {
    for (var i = 0; i < line.length; i++) {
      var mv = line[i];
      var legal = legalMoves(variant, s);
      for (var j = 0; j < legal.length; j++) {
        var lm = legal[j];
        if (lm.from === mv.from && lm.to === mv.to && lm.card === mv.card) {
          // is this move "useful"? Only return the FIRST line-move that is both
          // legal AND not yet done. The simplest sound hint: the first recorded
          // move that is legal from the current state.
          return mv;
        }
      }
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THE SELF-TEST — the SAME core the page's green chip runs.

     Proves the five load-bearing properties (see SPEC §0):
       (1) SOLVER SOUNDNESS — every returned line replays move-by-move (each ∈
           legalMoves of its state) and reaches isWin.
       (2) WINNABILITY GUARANTEE — a battery of dealer outputs are ALL solved AND
           their recorded solutions replay to a win (the headline claim).
       (3) DETERMINISM — seed → identical deal → identical solution across runs.
       (4) MOVE-GENERATOR CORRECTNESS — generated moves obey the variant rules;
           no illegal state is reachable via applyMove from a legal move.
       (5) CONSERVATION — every reachable state has exactly deckSize cards, no
           duplicates, no losses, across long random legal play.
     ═══════════════════════════════════════════════════════════════════════════ */

  /* replay a line from a deal, asserting each move is legal at its state; returns
     { ok, won, badAt } */
  function replayLine(variant, deal, line) {
    var s = cloneState(deal);
    for (var i = 0; i < line.length; i++) {
      var mv = line[i];
      var legal = legalMoves(variant, s);
      var found = false;
      for (var j = 0; j < legal.length; j++) {
        var lm = legal[j];
        if (lm.from === mv.from && lm.to === mv.to && lm.card === mv.card) { found = true; break; }
      }
      if (!found) return { ok: false, won: false, badAt: i };
      s = applyMove(variant, s, mv);
    }
    return { ok: true, won: isWin(variant, s), badAt: -1 };
  }

  /* deep-equal two plain states (for determinism check) */
  function statesEqual(a, b) {
    if (a.free.length !== b.free.length) return false;
    for (var i = 0; i < a.free.length; i++) if (a.free[i] !== b.free[i]) return false;
    for (var j = 0; j < 4; j++) if (a.found[j] !== b.found[j]) return false;
    if (a.cols.length !== b.cols.length) return false;
    for (var c = 0; c < a.cols.length; c++) {
      if (a.cols[c].length !== b.cols[c].length) return false;
      for (var k = 0; k < a.cols[c].length; k++) if (a.cols[c][k] !== b.cols[c][k]) return false;
    }
    return true;
  }
  function linesEqual(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i].from !== b[i].from || a[i].to !== b[i].to || a[i].card !== b[i].card) return false;
    }
    return true;
  }

  /* conservation check on a single state */
  function conservationOK(variant, s) {
    if (cardCount(s) !== variant.deckSize) return false;
    var cards = allCards(s);
    if (cards.length !== variant.deckSize) return false;
    var seen = {};
    for (var i = 0; i < cards.length; i++) {
      if (seen[cards[i]]) return false;       // duplicate
      seen[cards[i]] = true;
    }
    for (var c = 0; c < variant.deckSize; c++) if (!seen[c]) return false; // a loss
    return true;
  }

  /* runSelfTest(opts) → { checks:[{name,pass,detail}], pass, total }.
     Default: the compact variant, a battery of N dealer seeds. */
  function runSelfTest(opts) {
    opts = opts || {};
    var variant = opts.variant || makeVariant();
    var battery = opts.battery != null ? opts.battery : 40;
    var budget = opts.budget != null ? opts.budget : DEFAULT_BUDGET;
    var checks = [];

    // ── deal the whole battery via the winnable dealer (the shipped deals) ──
    var deals = [];
    var dealOK = true, hardest = 0, hardestNodes = 0, totalNodes = 0;
    for (var b = 0; b < battery; b++) {
      var d = dealWinnable(variant, 1000 + b * 7919, { budget: budget, maxTries: 200 });
      if (!d) { dealOK = false; break; }
      deals.push(d);
      totalNodes += d.nodes;
      if (d.nodes > hardestNodes) { hardestNodes = d.nodes; hardest = d.seed; }
    }
    checks.push({
      name: 'dealer: every battery seed yields a winnable deal',
      pass: dealOK && deals.length === battery,
      detail: dealOK ? (battery + ' deals, avg ' + Math.round(totalNodes / battery) + ' nodes, hardest ' + hardestNodes + ' nodes (seed ' + hardest + ')') : 'dealer failed to find a winnable deal within maxTries'
    });

    // ── (1) SOLVER SOUNDNESS + (2) WINNABILITY: every shipped deal's recorded
    //    line replays move-by-move (each move legal) and reaches a win. ──
    var soundOK = true, winOK = true, badInfo = '';
    for (var i = 0; i < deals.length; i++) {
      var rep = replayLine(variant, deals[i].deal, deals[i].solution);
      if (!rep.ok) { soundOK = false; badInfo = 'seed ' + deals[i].seed + ' illegal at move ' + rep.badAt; break; }
      if (!rep.won) { winOK = false; badInfo = 'seed ' + deals[i].seed + ' line did not reach a win'; break; }
    }
    checks.push({
      name: 'solver soundness: every recorded line is a legal move-by-move sequence',
      pass: soundOK,
      detail: soundOK ? 'all ' + deals.length + ' lines legal at every step' : badInfo
    });
    checks.push({
      name: 'winnability guarantee: every shipped deal replays to a WIN',
      pass: winOK && soundOK,
      detail: (winOK && soundOK) ? 'all ' + deals.length + ' deals provably winnable (replayed to isWin)' : badInfo
    });

    // ── (3) DETERMINISM: seed → identical deal → identical solution, twice ──
    var detOK = true, detInfo = '';
    for (var s2 = 0; s2 < Math.min(deals.length, 12); s2++) {
      var seed = deals[s2].seed;
      var dealA = initialDeal(variant, seed), dealB = initialDeal(variant, seed);
      if (!statesEqual(dealA, dealB)) { detOK = false; detInfo = 'deal differs for seed ' + seed; break; }
      var solA = solve(variant, dealA, { budget: budget });
      var solB = solve(variant, dealB, { budget: budget });
      if (!solA.solved || !solB.solved || !linesEqual(solA.line, solB.line)) {
        detOK = false; detInfo = 'solution differs for seed ' + seed; break;
      }
    }
    checks.push({
      name: 'determinism: seed → identical deal → identical solution (twice)',
      pass: detOK,
      detail: detOK ? 'deal & solution byte-stable across two runs' : detInfo
    });

    // ── (4) MOVE-GENERATOR CORRECTNESS: every generated move obeys the rules,
    //    and applyMove from a legal move never produces an illegal state. ──
    var genOK = true, genInfo = '';
    var rng = mulberry32(424242);
    var st = deals.length ? cloneState(deals[0].deal) : initialDeal(variant, 1);
    for (var step = 0; step < 4000 && genOK; step++) {
      var lm2 = legalMoves(variant, st);
      // validate each generated move against the rule predicates
      for (var m = 0; m < lm2.length; m++) {
        var mv = lm2[m];
        var t = parseTok(mv.to);
        var srcOK = true;
        if (mv.from.charAt(0) === 'f') srcOK = (st.free[+mv.from.slice(1)] === mv.card);
        else if (mv.from.charAt(0) === 'c') { var cc = st.cols[+mv.from.slice(1)]; srcOK = cc.length && cc[cc.length - 1] === mv.card; }
        if (!srcOK) { genOK = false; genInfo = 'move source mismatch'; break; }
        if (t.kind === 'found' && !canFound(st, mv.card)) { genOK = false; genInfo = 'bad foundation move generated'; break; }
        if (t.kind === 'col') {
          var dc = st.cols[t.idx];
          if (dc.length && !canStack(mv.card, dc[dc.length - 1])) { genOK = false; genInfo = 'bad tableau move generated'; break; }
        }
        if (t.kind === 'free' && st.free[t.idx] != null) { genOK = false; genInfo = 'move to occupied free cell'; break; }
      }
      if (!genOK || lm2.length === 0) break;
      // take a random legal move and confirm applyMove yields a conserved state
      var pick = lm2[Math.floor(rng() * lm2.length)];
      st = applyMove(variant, st, pick);  // throws if it would create an illegal state
      if (!conservationOK(variant, st)) { genOK = false; genInfo = 'conservation broke after a legal move'; break; }
    }
    checks.push({
      name: 'move-generator correctness: every legal move obeys the rules; applyMove stays legal',
      pass: genOK,
      detail: genOK ? 'validated thousands of generated moves & resulting states' : genInfo
    });

    // ── (5) CONSERVATION across long random legal play from several deals ──
    var consOK = true, consInfo = '';
    for (var di = 0; di < Math.min(deals.length, 8) && consOK; di++) {
      var cs = cloneState(deals[di].deal);
      if (!conservationOK(variant, cs)) { consOK = false; consInfo = 'fresh deal not conserved'; break; }
      var rng2 = mulberry32(7 + di * 101);
      for (var p = 0; p < 1500; p++) {
        var lm3 = legalMoves(variant, cs);
        if (!lm3.length) break;
        cs = applyMove(variant, cs, lm3[Math.floor(rng2() * lm3.length)]);
        if (!conservationOK(variant, cs)) { consOK = false; consInfo = 'conservation broke at deal ' + di + ' step ' + p; break; }
      }
    }
    checks.push({
      name: 'conservation: every state has exactly ' + variant.deckSize + ' cards, no dupes, no losses',
      pass: consOK,
      detail: consOK ? 'deck size held across long random legal play' : consInfo
    });

    var pass = 0;
    for (var ci = 0; ci < checks.length; ci++) if (checks[ci].pass) pass++;
    return { checks: checks, pass: pass, total: checks.length, deals: deals, variant: variant };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     THE PUBLIC API (stable surface the page + the test lean on).
     ═══════════════════════════════════════════════════════════════════════════ */
  var Patience = {
    VERSION: PATIENCE_VERSION,
    SUITS: SUITS,
    // variant + pure model
    makeVariant: makeVariant,
    initialDeal: initialDeal,
    legalMoves: legalMoves,
    applyMove: applyMove,
    isWin: isWin,
    key: key,
    cloneState: cloneState,
    // card helpers
    suitOf: suitOf, rankOf: rankOf, colourOf: colourOf, makeCard: makeCard, cardLabel: cardLabel,
    canStack: canStack, canFound: canFound,
    cardCount: cardCount, allCards: allCards,
    // solver + dealer
    solve: solve,
    shortenLine: shortenLine,
    dealWinnable: dealWinnable,
    autoFoundation: autoFoundation,
    isSafeAutomove: isSafeAutomove,
    DEFAULT_BUDGET: DEFAULT_BUDGET,
    // players
    linePlayer: linePlayer,
    hint: hint,
    // proof
    runSelfTest: runSelfTest,
    replayLine: replayLine,
    conservationOK: conservationOK,
    // prng
    mulberry32: mulberry32
  };

  // browser global
  if (root) root.Patience = Patience;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Patience; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
