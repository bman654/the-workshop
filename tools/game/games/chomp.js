/* ═══════════════════════════════════════════════════════════════════════════
   chomp.js — game-def: Chomp (the poisoned chocolate bar). Pure DATA + tiny pure
   fns in the EXACT adversary.js contract (same shape as nim.js). One engine, many
   games (see tools/game/adversary.js). Dual-use: attaches GAME_chomp global AND
   exports via the module guard (forge strips the guard when inlining).

   RULES: a W×H bar of chocolate squares. On your turn you "bite" a square —
   eating it AND every square up-and-to-the-right of it (the whole rectangle from
   that square to the top-right corner). The TOP-LEFT square is POISON ☠. Force
   your opponent to eat the poison and you WIN. (Equivalently: whoever is forced
   to take the last, poison square loses — normal play with one forbidden cell.)

   LITERATURE (the claim the self-test proves): by Gale's STRATEGY-STEALING
   argument the FIRST player WINS every board EXCEPT the 1×1 (which is poison
   alone, an immediate loss for the mover). The argument is famously
   NON-CONSTRUCTIVE: it proves a winning first move EXISTS without ever naming
   one. Suppose the corner bite (top-right square only) were a loss for the
   first player — then the second player has a winning reply R; but the first
   player could have OPENED with R (every position after R is reachable on move
   one), stealing the win. So the first player wins — yet the proof hands you no
   move. We ship that exact gap: solve() KNOWS the value, but the corner lever
   it leans on is often NOT itself a winning move (verified below).

   State: { cols:[h0,h1,...], W, H } — cols[c] = squares STANDING in column c,
   counted up from the bottom row. The full W×H bar is cols=[H,H,…] (W entries).
   A bite at (col,row) drops every column c≥col to height ≤ row, so every
   reachable position is a weakly-decreasing "staircase" order-ideal. The poison
   square is (col 0, row 0) — the bottom-left of this coordinate system (drawn at
   the TOP-LEFT classic-Chomp corner by the page's vertical flip). W & H are
   carried in state so key() can fold the transpose symmetry of a SQUARE bar.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var W0 = 6, H0 = 4; // the shipped bench's board: a 4-row × 6-column bar (209 canonical nodes)

  // transpose(cols): the order-ideal reflected across the main diagonal. cols[c]
  // is the height of column c (cols[0] is the tallest, since it's an order-ideal),
  // so the transpose has width = cols[0]; its new column r (0-indexed) has height
  // = #columns whose height > r. A square bar is its own poset-mirror, so a
  // profile and its transpose are the SAME position.
  function transpose(cols) {
    var maxh = cols[0] || 0, t = [];
    for (var r = 0; r < maxh; r++) {
      var cnt = 0;
      for (var c = 0; c < cols.length; c++) if (cols[c] > r) cnt++;
      t.push(cnt);
    }
    return t;
  }

  var GAME_chomp = {
    id: 'chomp',
    title: 'Chomp',
    blurb: 'Bite a square and everything up-and-right of it; force your opponent onto the poison corner.',
    players: ['X', 'O'],
    boardKind: 'grid',
    // 4×6 = 209 canonical nodes (transpose-folded); 2000 leaves head-room for the
    // battery's larger swept boards (6×5 = 461) and sits far under HARD_CAP.
    nodeBudget: 2000,

    initState: function () {
      var cols = [];
      for (var c = 0; c < W0; c++) cols.push(H0);
      return { cols: cols, W: W0, H: H0 };
    },

    // Every STANDING square (col,row) with row<cols[col] is a legal bite EXCEPT
    // the poison (0,0). Poison is never a voluntary move — that keeps the fully
    // empty board out of the graph, so the SOLE LOSS terminal is "only poison
    // remains" = the mover is forced onto the skull. (A page handing the player a
    // 1×1 bar lets them tap the skull as the forced losing move; the def itself
    // never offers it.)
    legalMoves: function (s) {
      var moves = [];
      for (var c = 0; c < s.cols.length; c++) {
        for (var r = 0; r < s.cols[c]; r++) {
          if (c === 0 && r === 0) continue; // never voluntarily eat the poison
          moves.push({ col: c, row: r });
        }
      }
      return moves;
    },

    // Bite (col,row): for every column c≥col, drop its height to min(cols[c], row).
    apply: function (s, m) {
      var cols = s.cols.slice();
      for (var c = m.col; c < cols.length; c++) if (cols[c] > m.row) cols[c] = m.row;
      return { cols: cols, W: s.W, H: s.H };
    },

    // Terminal ⟺ only the poison square remains (cols[0]===1, all others 0): the
    // mover is forced to eat poison → LOSS (from the side-to-move POV). This is
    // the only terminal — Chomp is loopfree (every bite strictly shrinks the bar),
    // so there are no draws.
    terminal: function (s) {
      if (s.cols[0] === 1) {
        var only = true;
        for (var c = 1; c < s.cols.length; c++) if (s.cols[c] !== 0) { only = false; break; }
        if (only) return { over: true, value: 'LOSS' };
      }
      return { over: false };
    },

    // Canonical key. For a SQUARE bar (W===H) a profile and its transpose are the
    // SAME position, so return the lexicographically-smaller of the two — folding
    // the transpose symmetry (e.g. 4×4 halves to ~its symmetric core). Non-square
    // bars carry no such fold and return the plain profile.
    key: function (s) {
      var a = s.cols.join('.');
      if (s.W !== s.H) return a;
      var t = transpose(s.cols).join('.');
      return a < t ? a : t;
    },

    // Symmetry image for the engine's symmetry-soundness check: on a square bar the
    // transpose is the one declared non-identity symmetry; non-square bars have none.
    symmetries: function (s) {
      if (s.W !== s.H) return [];
      return [{ cols: transpose(s.cols), W: s.W, H: s.H }];
    },

    sideToMove: function (s) { return 'to move'; },

    moveLabel: function (s, m) { return 'bite (' + (m.col + 1) + ',' + (m.row + 1) + ')'; },

    render: function (s) {
      var rows = [];
      for (var r = s.H - 1; r >= 0; r--) {
        var line = '  ';
        for (var c = 0; c < s.cols.length; c++) {
          line += (s.cols[c] > r) ? ((c === 0 && r === 0) ? '☠' : '▓') : '·';
        }
        rows.push(line);
      }
      return rows.join('\n');
    },

    literatureValue: 'WIN', // the shipped 4×6 bar (any non-1×1 board) is a first-player WIN

    /* The CHOMP THEOREM + the STRATEGY-STEAL WITNESS over a battery of boards.
       Asserts ALL of:
         (a) P1=WIN on every non-1×1 board across a shape sweep; 1×1 ⇒ LOSS (lone exception);
         (b) the strategy-steal witness — solve() KNOWS the board is a WIN, yet the
             corner-bite lever is NOT itself a winning move on boards 3×3/3×4/4×4/
             4×6/5×5 (its child is a WIN for the opponent). Existence ≠ construction;
         (c) NEG-CONTROL 1×1 ⇒ LOSS with zero winning bites;
         (d) NEG-CONTROL 1×N ≡ one-heap Nim: WIN iff N>1, unique winning bite reduces
             to poison-only;
         (e) node-count under HARD_CAP. */
    literatureBattery: function (solve, V) {
      var fails = [];

      // ── (a) shape sweep: every non-1×1 board is a P1 WIN; 1×1 is the lone LOSS ──
      var sweep = [];
      for (var W = 1; W <= 6; W++) for (var H = 1; H <= 6; H++) if (W * H <= 30) sweep.push([W, H]);
      var maxNodes = 0;
      var solved = {}; // cache one sol per board for the witness check
      for (var i = 0; i < sweep.length; i++) {
        var w = sweep[i][0], h = sweep[i][1];
        var def = makeChomp(w, h);
        var sol = solve(def);
        solved[w + 'x' + h] = { sol: sol, def: def };
        if (!sol.ok) { fails.push(w + '×' + h + ' solve FAILED: ' + sol.error); continue; }
        if (sol.nodeCount > maxNodes) maxNodes = sol.nodeCount;
        var want = (w === 1 && h === 1) ? V.LOSS : V.WIN;
        if (sol.value !== want) fails.push(w + '×' + h + ' want ' + want + ' got ' + sol.value);
      }

      // ── (b) strategy-steal witness: every non-1×1 board HAS a winning bite
      //        (existence), yet on the named boards the CORNER bite is NOT it
      //        (its child is a WIN for the opponent) — the proof's lever is not
      //        the construction. ──
      var stealBoards = ['3x3', '3x4', '4x4', '4x6', '5x5'];
      for (var s = 0; s < sweep.length; s++) {
        var W2 = sweep[s][0], H2 = sweep[s][1];
        if (W2 === 1 && H2 === 1) continue;
        var rec = solved[W2 + 'x' + H2];
        var root = rec.def.initState();
        var wins = winningBites(rec.def, rec.sol, root);
        if (!wins.length) fails.push(W2 + '×' + H2 + ' has NO winning bite (existence broken)');
      }
      for (var b = 0; b < stealBoards.length; b++) {
        var rb = solved[stealBoards[b]];
        var rootB = rb.def.initState();
        var corner = { col: rb.def.initState().cols.length - 1, row: rb.def.initState().cols[0] - 1 };
        var childKey = rb.def.key(rb.def.apply(rootB, corner));
        var childNode = rb.sol.table.get(childKey);
        // the bar itself is a WIN, but the corner CHILD is a WIN for the opponent
        // (= the corner bite is NOT a winning move): existence ≠ the corner lever.
        if (rb.sol.value !== V.WIN) fails.push(stealBoards[b] + ' steal: board not WIN?!');
        if (!childNode || childNode.value !== V.WIN) {
          fails.push(stealBoards[b] + ' steal: corner child is ' + (childNode ? childNode.value : '∅') + ', expected WIN (corner should NOT be a winning move)');
        }
        var winsB = winningBites(rb.def, rb.sol, rootB);
        var cornerIsWin = winsB.some(function (m) { return m.col === corner.col && m.row === corner.row; });
        if (cornerIsWin) fails.push(stealBoards[b] + ' steal: corner bite WAS a winning move (witness broken)');
      }

      // ── (c) NEG-CONTROL 1×1: the lone P1-LOSS, zero winning bites ──
      var d11 = makeChomp(1, 1), s11 = solve(d11);
      if (s11.value !== V.LOSS) fails.push('1×1 neg-control: value ' + s11.value + ' ≠ LOSS');
      if (winningBites(d11, s11, d11.initState()).length !== 0) fails.push('1×1 neg-control: a winning bite exists?!');

      // ── (d) NEG-CONTROL 1×N ≡ one-heap Nim: WIN iff N>1; unique winning bite
      //        reduces to poison-only. A 1×N bar = N columns of height 1 = one Nim
      //        heap of size N; the unique winning move "takes the heap to the
      //        P-position" = bite column 1 (index 1), row 0 → leaves [1,0,…]. ──
      for (var N = 1; N <= 6; N++) {
        var dN = makeChomp(N, 1), sN = solve(dN);
        var wantN = (N > 1) ? V.WIN : V.LOSS;
        if (sN.value !== wantN) fails.push('1×' + N + ' Nim-equiv: value ' + sN.value + ' want ' + wantN);
        if (N > 1) {
          var winsN = winningBites(dN, sN, dN.initState());
          var unique = winsN.length === 1 && winsN[0].col === 1 && winsN[0].row === 0;
          if (!unique) fails.push('1×' + N + ' Nim-equiv: ' + winsN.length + ' winning bite(s), not the lone down-to-poison move');
        }
      }

      // ── (e) node-count under HARD_CAP ──
      if (maxNodes <= 0 || maxNodes >= 300000) fails.push('node-count out of range: ' + maxNodes);

      return {
        ok: fails.length === 0,
        detail: fails.length ? fails.join('; ')
          : (sweep.length + ' boards: every non-1×1 a P1 WIN, 1×1 the lone LOSS · strategy-steal witness on ' +
             stealBoards.join('/') + ' (corner child WINS for the opponent — proof names a winner, never a move) · 1×N≡one-heap-Nim · max ' + maxNodes + ' nodes')
      };
    }
  };

  // ALL winning bites for the side to move at s: the LIVE legal moves whose child
  // is a LOSS for the opponent. This is the SEARCH-found list — never a formula.
  // Ranking LIVE moves (not canonical nodes) keeps it correct under the transpose
  // fold: a move read off a canonical representative could apply to the wrong cell
  // of a mirrored live board.
  function winningBites(def, sol, s) {
    var out = [], moves = def.legalMoves(s);
    for (var i = 0; i < moves.length; i++) {
      var c = sol.table.get(def.key(def.apply(s, moves[i])));
      if (c && c.value === 'LOSS') out.push(moves[i]);
    }
    return out;
  }

  // Helper: build a Chomp def for an arbitrary W×H board (mirrors nim.js makeNim),
  // so the battery and the page self-test solve any board via the SAME Adversary.solve().
  function makeChomp(W, H) {
    var d = {};
    for (var k in GAME_chomp) d[k] = GAME_chomp[k];
    d.id = 'chomp:' + W + 'x' + H;
    d.title = 'Chomp ' + W + '×' + H;
    d.initState = function () {
      var cols = [];
      for (var c = 0; c < W; c++) cols.push(H);
      return { cols: cols, W: W, H: H };
    };
    d.literatureValue = (W === 1 && H === 1) ? 'LOSS' : 'WIN';
    d.nodeBudget = 2000;
    return d;
  }
  GAME_chomp.makeChomp = makeChomp;      // exposed for the battery, page, + tests
  GAME_chomp.winningBites = winningBites; // exposed so the page lists search-found bites
  GAME_chomp.transpose = transpose;       // exposed for the page's symmetry-aware drawing

  if (root) root.GAME_chomp = GAME_chomp;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_chomp; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
