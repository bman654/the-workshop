/* ═══════════════════════════════════════════════════════════════════════════
   ttt333.js — game-def: 3×3 Tic-Tac-Toe. Pure DATA + tiny pure fns.

   RULES: X and O alternate marking empty cells (X first); first to get three in a
   row (row / column / diagonal) wins; a full board with no line is a DRAW.

   LITERATURE (the claim the self-test proves): with perfect play, 3×3 Tic-Tac-Toe
   is a DRAW. (Neither player can force a win.)

   State: { board:[9] of 0|'X'|'O', turn:0|1 }. turn indexes players[]. The side
   to move IS part of the state. ~5,478 reachable positions; symmetry-reduced by
   the dihedral group of the square (8 symmetries) in key().
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  // The 8 winning lines (indices into a row-major 3×3 board).
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   // cols
    [0, 4, 8], [2, 4, 6]               // diagonals
  ];

  // Dihedral-4 symmetries of the 3×3 grid as index permutations (where each
  // output cell pulls from). identity, rot90, rot180, rot270, 2 flips, 2 diagonals.
  var SYMS = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8],       // identity
    [6, 3, 0, 7, 4, 1, 8, 5, 2],       // rotate 90° CW
    [8, 7, 6, 5, 4, 3, 2, 1, 0],       // rotate 180°
    [2, 5, 8, 1, 4, 7, 0, 3, 6],       // rotate 270° CW
    [2, 1, 0, 5, 4, 3, 8, 7, 6],       // flip horizontal
    [6, 7, 8, 3, 4, 5, 0, 1, 2],       // flip vertical
    [0, 3, 6, 1, 4, 7, 2, 5, 8],       // transpose (main diag)
    [8, 5, 2, 7, 4, 1, 6, 3, 0]        // anti-transpose
  ];

  function winnerOf(board) {
    for (var i = 0; i < LINES.length; i++) {
      var a = board[LINES[i][0]], b = board[LINES[i][1]], c = board[LINES[i][2]];
      if (a !== 0 && a === b && b === c) return a;
    }
    return null;
  }

  var GAME_ttt333 = {
    id: 'ttt333',
    title: 'Tic-Tac-Toe',
    blurb: 'Three in a row wins. Solved: perfect play is always a draw.',
    players: ['X', 'O'],
    boardKind: 'grid',
    cols: 3, rows: 3,
    nodeBudget: 6000, // ~5478 reachable; canon (dihedral) far fewer (~765)

    initState: function () { return { board: [0, 0, 0, 0, 0, 0, 0, 0, 0], turn: 0 }; },

    legalMoves: function (s) {
      if (winnerOf(s.board)) return [];
      var moves = [];
      for (var i = 0; i < 9; i++) if (s.board[i] === 0) moves.push({ cell: i });
      return moves;
    },

    apply: function (s, m) {
      var board = s.board.slice();
      board[m.cell] = GAME_ttt333.players[s.turn];
      return { board: board, turn: s.turn ^ 1 };
    },

    // From the side-to-move POV: if a line already exists, the player who JUST
    // moved made it → the side to move LOSES. Full board, no line → DRAW.
    terminal: function (s) {
      var w = winnerOf(s.board);
      if (w) return { over: true, value: 'LOSS' }; // opponent (just moved) made the line
      var full = true;
      for (var i = 0; i < 9; i++) if (s.board[i] === 0) { full = false; break; }
      if (full) return { over: true, value: 'DRAW' };
      return { over: false };
    },

    // Canonical key: minimal string over the 8 dihedral symmetries, plus turn.
    key: function (s) {
      var best = null;
      for (var t = 0; t < SYMS.length; t++) {
        var str = '';
        var perm = SYMS[t];
        for (var i = 0; i < 9; i++) {
          var v = s.board[perm[i]];
          str += (v === 0 ? '.' : v);
        }
        if (best === null || str < best) best = str;
      }
      return best + '|' + s.turn;
    },

    symmetries: function (s) {
      // a couple of non-identity images: rot90 and flip-horizontal
      var out = [];
      var picks = [1, 4]; // indices into SYMS
      for (var p = 0; p < picks.length; p++) {
        var perm = SYMS[picks[p]];
        var b = new Array(9);
        for (var i = 0; i < 9; i++) b[i] = s.board[perm[i]];
        out.push({ board: b, turn: s.turn });
      }
      return out;
    },

    sideToMove: function (s) { return GAME_ttt333.players[s.turn]; },

    moveLabel: function (s, m) {
      var r = Math.floor(m.cell / 3) + 1, c = (m.cell % 3) + 1;
      return 'r' + r + 'c' + c;
    },

    render: function (s) {
      var rows = [];
      for (var r = 0; r < 3; r++) {
        var cells = [];
        for (var c = 0; c < 3; c++) { var v = s.board[r * 3 + c]; cells.push(v === 0 ? '.' : v); }
        rows.push('  ' + cells.join(' '));
      }
      return rows.join('\n');
    },

    literatureValue: 'DRAW'
  };

  if (root) root.GAME_ttt333 = GAME_ttt333;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_ttt333; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
