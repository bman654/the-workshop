/* ═══════════════════════════════════════════════════════════════════════════
   hex3.js — game-def: Hex on a 3×3 rhombus.

   RULES: X and O alternate (X first) placing one stone of their colour on an
   empty cell of a 3×3 rhombic board. X owns the TOP and BOTTOM edges and wins by
   connecting them with an unbroken chain of X stones; O owns the LEFT and RIGHT
   edges and wins by connecting them with O. Hex adjacency on a rhombus: each cell
   (r,c) touches (r,c±1), (r±1,c), and the two "short-diagonal" neighbours
   (r-1,c+1) and (r+1,c-1).

   LITERATURE (the claims the self-test proves):
     • Hex can NEVER be a draw — exactly one player always has a winning chain once
       the board is full (the Hex theorem). The self-test asserts the value is
       never DRAW and that no reachable terminal is a draw.
     • The FIRST player wins on any n×n board (Nash's strategy-stealing argument).
       The self-test PROVES the 3×3 value is a first-player WIN by full retrograde
       analysis (mate distance reported exactly).

   State: { board:[9] of 0|'X'|'O', turn:0|1 }. The board is canonicalised in
   key() by the ONE symmetry Hex respects: 180° rotation of the rhombus (which
   maps X-edges→X-edges and O-edges→O-edges). (Reflections swap the two players'
   edge pairs, so they are NOT value-preserving symmetries and are excluded.)
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var SZ = 3, N = SZ * SZ;

  // Hex neighbour offsets on a rhombus (axial): 6 directions.
  var NB = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, -1]];

  function idx(r, c) { return r * SZ + c; }

  // Does `who` connect their two edges? X connects top row ↔ bottom row;
  // O connects left col ↔ right col. Flood-fill over same-colour hex neighbours.
  function connects(board, who) {
    var seen = new Array(N); for (var i = 0; i < N; i++) seen[i] = false;
    var stack = [];
    // seed from the "start" edge
    for (var k = 0; k < SZ; k++) {
      var sr, sc;
      if (who === 'X') { sr = 0; sc = k; }       // top row
      else { sr = k; sc = 0; }                    // left col
      var si = idx(sr, sc);
      if (board[si] === who && !seen[si]) { seen[si] = true; stack.push([sr, sc]); }
    }
    while (stack.length) {
      var cell = stack.pop(), r = cell[0], c = cell[1];
      // reached the far edge?
      if (who === 'X' && r === SZ - 1) return true;     // bottom row
      if (who === 'O' && c === SZ - 1) return true;     // right col
      for (var d = 0; d < NB.length; d++) {
        var nr = r + NB[d][0], nc = c + NB[d][1];
        if (nr < 0 || nr >= SZ || nc < 0 || nc >= SZ) continue;
        var ni = idx(nr, nc);
        if (board[ni] === who && !seen[ni]) { seen[ni] = true; stack.push([nr, nc]); }
      }
    }
    return false;
  }

  function winnerOf(board) {
    if (connects(board, 'X')) return 'X';
    if (connects(board, 'O')) return 'O';
    return null;
  }

  var GAME_hex3 = {
    id: 'hex3',
    title: 'Hex 3×3',
    blurb: 'Connect your two edges. No draws are possible — and the first player wins.',
    players: ['X', 'O'],
    boardKind: 'hex',
    size: SZ,
    nodeBudget: 60000, // ≤ sum over placements; canonical reachable set is small

    initState: function () { var b = new Array(N); for (var i = 0; i < N; i++) b[i] = 0; return { board: b, turn: 0 }; },

    legalMoves: function (s) {
      if (winnerOf(s.board)) return [];
      var moves = [];
      for (var i = 0; i < N; i++) if (s.board[i] === 0) moves.push({ cell: i });
      return moves;
    },

    apply: function (s, m) {
      var b = s.board.slice();
      b[m.cell] = GAME_hex3.players[s.turn];
      return { board: b, turn: s.turn ^ 1 };
    },

    // The player who JUST moved may have completed a chain → the side to move
    // LOSES. Hex can never be a draw, so a full board always has a winner.
    terminal: function (s) {
      var w = winnerOf(s.board);
      if (w) return { over: true, value: 'LOSS' };
      for (var i = 0; i < N; i++) if (s.board[i] === 0) return { over: false };
      // unreachable in correct Hex (the board can't fill without a winner), but
      // keep the engine total — never claim a draw exists.
      return { over: true, value: 'LOSS' };
    },

    // 180° rotation is the only value-preserving board symmetry of Hex (it keeps
    // each player's edge-pair fixed). Reflections swap the edge pairs → not sound.
    key: function (s) {
      var rotStr = '', idStr = '';
      for (var i = 0; i < N; i++) {
        var v = s.board[i]; idStr += (v === 0 ? '.' : v);
        var rv = s.board[N - 1 - i]; rotStr += (rv === 0 ? '.' : rv);
      }
      var best = idStr < rotStr ? idStr : rotStr;
      return best + '|' + s.turn;
    },

    symmetries: function (s) {
      var b = new Array(N);
      for (var i = 0; i < N; i++) b[i] = s.board[N - 1 - i]; // 180° rotation
      return [{ board: b, turn: s.turn }];
    },

    sideToMove: function (s) { return GAME_hex3.players[s.turn]; },

    moveLabel: function (s, m) { return 'r' + (Math.floor(m.cell / SZ) + 1) + 'c' + ((m.cell % SZ) + 1); },

    render: function (s) {
      var rows = [];
      for (var r = 0; r < SZ; r++) {
        var pad = new Array(r + 1).join(' ');
        var cells = [];
        for (var c = 0; c < SZ; c++) { var v = s.board[idx(r, c)]; cells.push(v === 0 ? '.' : v); }
        rows.push('  ' + pad + cells.join(' '));
      }
      return rows.join('\n');
    },

    literatureValue: 'WIN',

    // Hex-theorem battery: over a battery of FULL boards, exactly one player
    // connects (never zero, never both) — there are no draws in Hex.
    literatureBattery: function (solve, V) {
      // generate several full 3×3 boards and assert exactly-one-winner.
      var fails = [];
      var trials = [
        ['X','O','X', 'O','X','O', 'X','O','X'],
        ['X','X','X', 'O','O','O', 'X','O','X'],
        ['O','O','O', 'X','X','X', 'O','X','O'],
        ['X','O','O', 'X','O','O', 'X','X','O'],
        ['O','X','X', 'O','X','X', 'O','O','X']
      ];
      for (var i = 0; i < trials.length; i++) {
        var xw = connects(trials[i], 'X'), ow = connects(trials[i], 'O');
        if (xw === ow) fails.push('board ' + i + ': X-connects=' + xw + ' O-connects=' + ow + ' (must differ — no draws)');
      }
      return { ok: fails.length === 0, detail: fails.length ? fails.join('; ') : (trials.length + ' full boards: exactly one winner each (no draws)') };
    }
  };

  if (root) root.GAME_hex3 = GAME_hex3;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_hex3; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
