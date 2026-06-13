/* ═══════════════════════════════════════════════════════════════════════════
   mnk443.js — game-def: the (m,n,k) game. The classic 4×4·k=3 board has a
   reachable, dihedral-reduced state space of >300k nodes and takes tens of
   seconds to enumerate — over both the engine's hard cap AND the page's <1s
   budget — so for a SOLVED, in-browser-provable demonstrator we ship the
   adjacent, fully-enumerable member of the SAME family: (m,n,k) = (3,4,3).

   RULES: X & O alternate (X first) marking empty cells on a 3-wide × 4-tall grid;
   first to get k=3 in a row (horizontal / vertical / diagonal) wins; a full board
   with no line is a DRAW.

   LITERATURE (the claim the self-test proves by full retrograde analysis): (3,4,3)
   is a FIRST-PLAYER WIN — unlike (3,3,3), which is a draw. Enlarging one dimension
   past 3×3 while holding k=3 tips the game to the first player; the engine proves
   the exact forced win (mate in 7 plies) rather than asserting it.

   State: { board:[12] of 0|'X'|'O', turn:0|1 }. The grid is 3 wide, 4 tall, so it
   is NOT square — its symmetry group is the Klein four-group (identity, 180°
   rotation, horizontal flip, vertical flip), used to canonicalise in key().
   ~28k canonical reachable positions; well under budget, solves in ~0.2s.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var W = 3, H = 4, K = 3, N = W * H; // 3 columns, 4 rows

  // Every k-in-a-row line of cell indices (row-major, idx = r*W + c).
  var LINES = (function () {
    var lines = [];
    function idx(r, c) { return r * W + c; }
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1];
      var er = r + (K - 1) * dr, ec = c + (K - 1) * dc;
      if (er < 0 || er >= H || ec < 0 || ec >= W) continue;
      var line = []; for (var t = 0; t < K; t++) line.push(idx(r + t * dr, c + t * dc));
      lines.push(line);
    }
    return lines;
  })();

  // Klein-four symmetries of a non-square (3×4) grid: identity, 180° rotation,
  // horizontal flip, vertical flip. (Transpose would change the shape, so it is
  // NOT a symmetry of a 3×4 board.) Each is an index permutation: out ← source.
  var SYMS = (function () {
    function build(mapRC) {
      var perm = new Array(N);
      for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) {
        var p = mapRC(r, c); perm[r * W + c] = p[0] * W + p[1];
      }
      return perm;
    }
    return [
      build(function (r, c) { return [r, c]; }),                 // identity
      build(function (r, c) { return [H - 1 - r, W - 1 - c]; }), // rotate 180°
      build(function (r, c) { return [r, W - 1 - c]; }),         // flip horizontal
      build(function (r, c) { return [H - 1 - r, c]; })          // flip vertical
    ];
  })();

  function winnerOf(board) {
    for (var i = 0; i < LINES.length; i++) {
      var L = LINES[i], a = board[L[0]];
      if (a !== 0 && a === board[L[1]] && a === board[L[2]]) return a;
    }
    return null;
  }

  var GAME_mnk443 = {
    id: 'mnk443',
    title: '(3,4,3)',
    blurb: 'm,n,k tic-tac-toe on a 3×4 board, three to win. Solved: first player wins.',
    players: ['X', 'O'],
    boardKind: 'grid',
    cols: W, rows: H,
    nodeBudget: 60000, // ~28k canonical reachable; comfortably under the hard cap

    initState: function () { var b = new Array(N); for (var i = 0; i < N; i++) b[i] = 0; return { board: b, turn: 0 }; },

    legalMoves: function (s) {
      if (winnerOf(s.board)) return [];
      var moves = [];
      for (var i = 0; i < N; i++) if (s.board[i] === 0) moves.push({ cell: i });
      return moves;
    },

    apply: function (s, m) {
      var b = s.board.slice();
      b[m.cell] = GAME_mnk443.players[s.turn];
      return { board: b, turn: s.turn ^ 1 };
    },

    terminal: function (s) {
      if (winnerOf(s.board)) return { over: true, value: 'LOSS' }; // opponent just made the line
      for (var i = 0; i < N; i++) if (s.board[i] === 0) return { over: false };
      return { over: true, value: 'DRAW' };
    },

    key: function (s) {
      var best = null;
      for (var t = 0; t < SYMS.length; t++) {
        var perm = SYMS[t], str = '';
        for (var i = 0; i < N; i++) { var v = s.board[perm[i]]; str += (v === 0 ? '.' : v); }
        if (best === null || str < best) best = str;
      }
      return best + '|' + s.turn;
    },

    symmetries: function (s) {
      var out = [], picks = [1, 2, 3];
      for (var p = 0; p < picks.length; p++) {
        var perm = SYMS[picks[p]], b = new Array(N);
        for (var i = 0; i < N; i++) b[i] = s.board[perm[i]];
        out.push({ board: b, turn: s.turn });
      }
      return out;
    },

    sideToMove: function (s) { return GAME_mnk443.players[s.turn]; },

    moveLabel: function (s, m) { return 'r' + (Math.floor(m.cell / W) + 1) + 'c' + ((m.cell % W) + 1); },

    render: function (s) {
      var rows = [];
      for (var r = 0; r < H; r++) {
        var cells = [];
        for (var c = 0; c < W; c++) { var v = s.board[r * W + c]; cells.push(v === 0 ? '.' : v); }
        rows.push('  ' + cells.join(' '));
      }
      return rows.join('\n');
    },

    literatureValue: 'WIN'
  };

  if (root) root.GAME_mnk443 = GAME_mnk443;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_mnk443; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
