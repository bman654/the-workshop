/* ═══════════════════════════════════════════════════════════════════════════
   wythoff.js — game-def: Wythoff's game (the Queen's Long Walk). Pure DATA +
   tiny pure fns. One engine, many games (see tools/game/adversary.js). Dual-use:
   attaches GAME_wythoff global AND exports via the module guard (forge strips the
   guard when inlining). NO new move-authority — fed to the SAME Adversary.solve /
   perfectPlayer the Nim bench uses.

   RULES (normal play): a lone queen on a board slides toward the home corner (0,0)
   along three rays only — LEFT, DOWN, and DIAGONALLY-down-left. The state is the
   queen's two distances from home, {a,b} = (columns, rows). Each ray is a heap move:
     • LEFT      = remove ≥1 from a            (one heap)
     • DOWN      = remove ≥1 from b            (the other heap)
     • DIAGONAL  = remove an EQUAL amount ≥1 from BOTH a and b
   The player who lands the queen HOME ({0,0}) wins; equivalently, the mover facing
   {0,0} has no move and LOSES (normal play). This is exactly Wythoff Nim.

   LITERATURE (the claim the self-test proves): the LOSING "cold" squares — the
   P-positions you are forced to hand the opponent — are EXACTLY the golden-ratio
   Beatty pairs (⌊nφ⌋, ⌊nφ²⌋), φ=(1+√5)/2, for n=0,1,2,…  (Wythoff, 1907). Two
   irrational-slope rails climbing the board; the gap between the rails of pair n is
   exactly n (⌊nφ²⌋−⌊nφ⌋ = n). Drop the diagonal ray → plain 2-heap Nim, whose cold
   squares collapse to the XOR=0 anti-diagonal (a===b) and the golden ratio VANISHES.

   State: { a:int, b:int }. Side-to-move is implicit (Wythoff is impartial — the
   same moves are available to whoever is to move — so the value is fully determined
   by {a,b}; "turn" is not part of the key). The two distances are interchangeable
   (a left-ray on a is mirror to a down-ray on b), so the key sorts {a,b}.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* The shipped opening square — a vivid hero. (6,10) is a COLD square (Beatty
     pair n=4: ⌊4φ⌋=6, ⌊4φ²⌋=10), so the FIRST mover is the one staring at a cold
     square → the first mover LOSES under perfect play (a P-position root). That is
     deliberate: the page lets YOU move first from a WARM square so winning is the
     hero verb; this def's shipped root simply certifies the value at a known cold
     square so the literatureValue is a stable, theory-anchored LOSS. */
  var START = { a: 6, b: 10 };

  /* φ and the Beatty rails — the derived "cold-square" predicate the battery proves
     the SOLVED table agrees with. Integer-exact via Math.floor of the irrationals. */
  var PHI = (1 + Math.sqrt(5)) / 2;     // 1.6180339887…
  var PHI2 = PHI * PHI;                  // φ² = φ+1 = 2.6180339887…

  /* isBeattyPair(a,b): is the (unordered) square {a,b} a golden Beatty pair
     (⌊nφ⌋,⌊nφ²⌋) for some n≥0?  We invert: the SMALLER coordinate is ⌊nφ⌋, so
     n = round(min/φ); rebuild the pair and compare. Robust for the table range. */
  function isBeattyPair(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    if (lo === 0) return hi === 0;        // only n=0 gives a 0 coordinate: (0,0)
    var n = Math.round(lo / PHI);         // candidate index from the lower rail
    // n could be off by one near the irrational boundary; check n-1, n, n+1.
    for (var d = -1; d <= 1; d++) {
      var k = n + d;
      if (k < 1) continue;
      if (Math.floor(k * PHI) === lo && Math.floor(k * PHI2) === hi) return true;
    }
    return false;
  }

  /* nimSum2(a,b): the 2-heap XOR — the Nim balance used ONLY by the neg-control
     (it is the cold-square predicate when the diagonal ray is removed). */
  function nimSum2(a, b) { return (a ^ b); }

  var GAME_wythoff = {
    id: 'wythoff',
    title: "The Queen's Long Walk",
    blurb: 'Slide the queen left, down, or diagonally toward home; land home to win.',
    players: ['X', 'O'],
    boardKind: 'queen',
    nodeBudget: 4000, // canonical a<=b<=10 -> ~66 states; START (6,10) reaches few

    initState: function () { return { a: START.a, b: START.b }; },

    // The queen's three rays, expressed as heap moves on {a,b}.
    //   kind 'a'    : LEFT      — remove `take` from a
    //   kind 'b'    : DOWN      — remove `take` from b
    //   kind 'diag' : DIAGONAL  — remove `take` from BOTH a and b
    legalMoves: function (s) {
      var moves = [], t;
      for (t = 1; t <= s.a; t++) moves.push({ kind: 'a', take: t });
      for (t = 1; t <= s.b; t++) moves.push({ kind: 'b', take: t });
      if (!s.noDiag) {
        var m = Math.min(s.a, s.b);
        for (t = 1; t <= m; t++) moves.push({ kind: 'diag', take: t });
      }
      return moves;
    },

    apply: function (s, m) {
      var a = s.a, b = s.b;
      if (m.kind === 'a') a -= m.take;
      else if (m.kind === 'b') b -= m.take;
      else { a -= m.take; b -= m.take; }
      return { a: a, b: b, noDiag: s.noDiag };
    },

    // Terminal when the queen is HOME (0,0): the player to move has no ray to
    // slide → they lose (the previous player landed home and won). Normal play.
    terminal: function (s) {
      if (s.a === 0 && s.b === 0) return { over: true, value: 'LOSS' };
      return { over: false };
    },

    // Canonical, symmetry-reduced: the two distances are interchangeable → sort.
    // (A left-ray on a mirrors a down-ray on b; the diagonal ray is symmetric.)
    key: function (s) {
      var lo = Math.min(s.a, s.b), hi = Math.max(s.a, s.b);
      return lo + ',' + hi;
    },

    // Symmetry image: swap the two distances (reflect across the main diagonal).
    symmetries: function (s) { return [{ a: s.b, b: s.a, noDiag: s.noDiag }]; },

    sideToMove: function (s) { return 'to move'; },

    moveLabel: function (s, m) {
      if (m.kind === 'a') return 'left −' + m.take;
      if (m.kind === 'b') return 'down −' + m.take;
      return 'diag −' + m.take;
    },

    render: function (s) {
      return '  queen at (a=' + s.a + ', b=' + s.b + ')' +
             (isBeattyPair(s.a, s.b) ? '  [COLD · Beatty pair]' : '  [warm]');
    },

    // For the shipped START (6,10) — a Beatty pair → the mover (first player) LOSES.
    literatureValue: 'LOSS',

    // ── THE WYTHOFF THEOREM over the FULL reachable table up to board size 40 ──
    //    Across every canonical position {a,b} with a≤b≤40, the SOLVED value is a
    //    LOSS (P-position) IFF {a,b} is a golden-ratio Beatty pair (⌊nφ⌋,⌊nφ²⌋),
    //    never a DRAW; AND perfectPlayer from every WARM (non-cold) square always
    //    slides to the NEXT cold cell (its chosen child is a Beatty pair). The
    //    NEG-CONTROL (drop the diagonal ray = 2-heap Nim) asserts the divergence:
    //    cold squares collapse to a===b (XOR=0) and the Beatty overlay mis-predicts.
    literatureBattery: function (solve, V) {
      var SIZE = 40;
      var fails = [];

      // (i) Solve ONE table that reaches the whole a≤b≤SIZE quadrant: root (SIZE,SIZE).
      var wDef = makeWythoff(SIZE, SIZE, false);
      var wSol = solve(wDef);
      if (!wSol.ok) return { ok: false, detail: 'Wythoff solve failed: ' + wSol.error };

      var coldCount = 0, drawCount = 0, mism = 0, checked = 0, perfectMiss = 0;
      wSol.table.forEach(function (node, key) {
        var parts = key.split(','), a = +parts[0], b = +parts[1];
        if (b > SIZE) return;          // stay inside the proven quadrant
        checked++;
        var isLoss = node.value === V.LOSS;
        var cold = isBeattyPair(a, b);
        if (node.value === V.DRAW) drawCount++;
        if (isLoss !== cold) { mism++; if (fails.length < 6) fails.push('(' + a + ',' + b + ') LOSS=' + isLoss + ' beatty=' + cold); }
        if (isLoss) coldCount++;
      });
      if (drawCount) fails.push(drawCount + ' DRAW nodes (Wythoff has none)');

      // (ii) perfectPlayer from every WARM (WIN) node lands on the NEXT cold cell:
      //      its chosen child is a Beatty pair (a P-position for the opponent).
      var byKey = enumStates(wDef);
      byKey.forEach(function (st, key) {
        var parts = key.split(','), b = +parts[1];
        if (b > SIZE) return;
        var node = wSol.table.get(key);
        if (!node || node.terminal || node.value !== V.WIN) return;
        var moves = wDef.legalMoves(st);
        var mv = perfectPlayerLocal(st, moves, wDef, wSol, V);
        var child = wDef.apply(st, mv);
        if (!isBeattyPair(child.a, child.b)) {
          perfectMiss++;
          if (fails.length < 8) fails.push('perfect from (' + st.a + ',' + st.b + ') -> (' + child.a + ',' + child.b + ') not cold');
        }
      });

      // (iii) NEG-CONTROL: drop the diagonal ray (plain 2-heap Nim). Cold squares
      //       must collapse to the XOR=0 anti-diagonal (a===b here), and the
      //       golden Beatty overlay must MIS-PREDICT (diverge) on ≥1 square.
      var nDef = makeWythoff(SIZE, SIZE, true /* noDiag */);
      var nSol = solve(nDef);
      if (!nSol.ok) return { ok: false, detail: 'Nim neg-control solve failed: ' + nSol.error };
      var nimMism = 0, beattyDiverge = 0, nimColdOffDiag = 0;
      nSol.table.forEach(function (node, key) {
        var parts = key.split(','), a = +parts[0], b = +parts[1];
        if (b > SIZE) return;
        var isLoss = node.value === V.LOSS;
        var xorZero = nimSum2(a, b) === 0;     // canonical a<=b so xor0 ⟺ a===b
        if (isLoss !== xorZero) nimMism++;
        if (isLoss && a !== b) nimColdOffDiag++;
        if (isBeattyPair(a, b) !== isLoss) beattyDiverge++;  // overlay mis-predicts
      });
      if (nimMism) fails.push('neg-control: ' + nimMism + ' Nim cold != (XOR=0)');
      if (nimColdOffDiag) fails.push('neg-control: ' + nimColdOffDiag + ' Nim cold off the diagonal');
      if (beattyDiverge === 0) fails.push('neg-control: Beatty overlay did NOT diverge (golden ratio should vanish)');

      return {
        ok: fails.length === 0,
        detail: fails.length
          ? fails.join('; ')
          : (checked + ' Wythoff nodes: cold ⟺ Beatty (' + coldCount + ' cold, 0 draws) · perfect always lands cold · ' +
             'neg-control: ' + beattyDiverge + ' Beatty mis-predictions, all Nim cold on the diagonal')
      };
    }
  };

  // ── helpers shared by the battery (kept inside the IIFE so the inline is clean) ──

  // Build a Wythoff def whose root reaches the whole a≤b≤max quadrant. The root
  // is (rootA,rootB); with the diagonal ray every smaller square is reachable, so
  // (max,max) enumerates the full canonical table.  noDiag → the Nim neg-control.
  function makeWythoff(rootA, rootB, noDiag) {
    var d = {};
    for (var k in GAME_wythoff) d[k] = GAME_wythoff[k];
    d.id = (noDiag ? 'wythoff-nim:' : 'wythoff:') + rootA + 'x' + rootB;
    d.initState = function () { return { a: rootA, b: rootB, noDiag: !!noDiag }; };
    d.nodeBudget = 200000;
    return d;
  }
  GAME_wythoff.makeWythoff = makeWythoff;

  // Re-enumerate one representative state per canonical key (BFS) — the battery
  // needs live states (not just keys) to rank perfectPlayer's live moves.
  function enumStates(def) {
    var byKey = new Map();
    var root = def.initState();
    var q = [root]; byKey.set(def.key(root), root);
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
  GAME_wythoff.enumStates = enumStates;

  // A local perfect ranker over LIVE moves (mirrors Adversary.perfectPlayer's
  // ranking; used by the battery so it does not depend on engine-internal exports
  // beyond solve()). Picks the child that is a LOSS for the opponent, fastest.
  function perfectPlayerLocal(state, legalMoves, def, sol, V) {
    var best = null, bestRank = null;
    for (var i = 0; i < legalMoves.length; i++) {
      var child = def.apply(state, legalMoves[i]);
      var c = sol.table.get(def.key(child));
      var rank = c ? rankOf(c, V) : [3, 0];
      if (best === null || better(rank, bestRank, V)) { best = legalMoves[i]; bestRank = rank; }
    }
    return best;
  }
  function rankOf(c, V) {
    if (c.value === V.LOSS) return [0, c.dist];
    if (c.value === V.DRAW) return [1, 0];
    return [2, (c.dist === Infinity ? 1e9 : c.dist)];
  }
  function better(a, b, V) {
    if (a[0] !== b[0]) return a[0] < b[0];
    if (a[0] === 2) return a[1] > b[1];
    return a[1] < b[1];
  }

  // expose the cold-square predicate + φ for the page (the GLOW reads these).
  GAME_wythoff.isBeattyPair = isBeattyPair;
  GAME_wythoff.nimSum2 = nimSum2;
  GAME_wythoff.PHI = PHI;
  GAME_wythoff.PHI2 = PHI2;

  if (root) root.GAME_wythoff = GAME_wythoff;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_wythoff; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
