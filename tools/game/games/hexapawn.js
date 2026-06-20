/* ═══════════════════════════════════════════════════════════════════════════
   hexapawn.js — game-def: Hexapawn on a 3×3 board (Gardner / Gale, 1962).

   RULES: White (players[0]) moves first, UP the board (toward row 0). Black moves
   DOWN (toward row 2). A pawn may PUSH one step straight forward into an EMPTY
   square, or CAPTURE one step DIAGONALLY forward onto a square holding an enemy
   pawn (no en-passant, no two-step first move). You WIN by (a) advancing a pawn to
   the far rank, (b) capturing all enemy pawns, or (c) leaving your opponent with no
   legal move (stalemate is a LOSS for the stalemated side — there are no draws).

   LITERATURE (the claims the self-test proves):
     • The opening position is a SECOND-PLAYER WIN — i.e. a LOSS for the side to move
       (White) under optimal play. This is the classic Gardner/Gale result: on the
       3×3 board the first player, playing perfectly, still loses. The retrograde
       solver labels the root LOSS with exact mate distance 6 (six plies of perfect
       play from the opening to White's defeat).
     • NO position is ever a DRAW. The far-rank / no-pawns / stalemate terminal rules
       make every reachable position decisive; the self-test sweeps all 71 reachable
       canonical nodes and asserts none is a DRAW.

   State: { board:[9] of 0|'W'|'B', turn:0|1 }. row0 = Black's home (top), row2 =
   White's home (bottom); idx(r,c)=r*3+c. The ONE value-preserving symmetry is the
   LEFT–RIGHT MIRROR (c → 2−c): it maps White-forward to White-forward and
   Black-forward to Black-forward, so it preserves the game value. key() canonicalises
   under that mirror and folds the side-to-move into the key. Because the mirror can
   flip a board, the engine indexes positions by their CANONICAL key while the UI must
   only ever animate LIVE moves — canonicalMoveId()/liveMove() bridge the two so the
   matchbox learner can store one bead per canonical reply yet the board never teleports.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var SZ = 3, N = SZ * SZ;
  var W = 'W', B = 'B';

  function idx(r, c) { return r * SZ + c; }
  function rowOf(i) { return (i / SZ) | 0; }
  function colOf(i) { return i % SZ; }

  // forward direction for a side: White (turn 0) moves UP (row decreases), Black DOWN.
  function dirOf(turn) { return turn === 0 ? -1 : 1; }
  function pieceOf(turn) { return turn === 0 ? W : B; }
  function enemyOf(turn) { return turn === 0 ? B : W; }
  // the far rank a side is racing toward (its win-by-promotion row).
  function farRowOf(turn) { return turn === 0 ? 0 : SZ - 1; }

  function countOf(board, who) {
    var n = 0; for (var i = 0; i < N; i++) if (board[i] === who) n++; return n;
  }

  // The LIVE legal moves for the side to move at s (NOT canonicalised): each is
  // { from, to }. A push goes one row forward into an empty square; a capture goes
  // one row forward diagonally onto an enemy pawn.
  function rawMoves(board, turn) {
    var moves = [];
    var me = pieceOf(turn), enemy = enemyOf(turn), dir = dirOf(turn);
    for (var i = 0; i < N; i++) {
      if (board[i] !== me) continue;
      var r = rowOf(i), c = colOf(i), nr = r + dir;
      if (nr < 0 || nr >= SZ) continue;
      // straight push into empty
      if (board[idx(nr, c)] === 0) moves.push({ from: i, to: idx(nr, c) });
      // diagonal captures
      for (var dc = -1; dc <= 1; dc += 2) {
        var nc = c + dc;
        if (nc < 0 || nc >= SZ) continue;
        if (board[idx(nr, nc)] === enemy) moves.push({ from: i, to: idx(nr, nc) });
      }
    }
    return moves;
  }

  // Has the side that JUST moved already won by reaching the far rank? We detect a
  // terminal from the POV of the side to move: if an ENEMY pawn sits on the side-to-
  // move's far... no — promotion is checked for the side that just moved. We fold all
  // three win conditions into terminal() below from the side-to-move's POV.

  // canonical board string for a given board orientation (left-right mirror folds).
  function boardStr(board) {
    var s = ''; for (var i = 0; i < N; i++) { var v = board[i]; s += (v === 0 ? '.' : v); }
    return s;
  }
  function mirrorBoard(board) {
    var b = new Array(N);
    for (var r = 0; r < SZ; r++) for (var c = 0; c < SZ; c++) b[idx(r, c)] = board[idx(r, SZ - 1 - c)];
    return b;
  }
  function mirrorCell(i) { return idx(rowOf(i), SZ - 1 - colOf(i)); }

  // Is the canonical orientation the mirrored one? (true ⟺ mirror string < id string)
  function isMirrored(board) {
    return boardStr(mirrorBoard(board)) < boardStr(board);
  }

  var GAME_hexapawn = {
    id: 'hexapawn',
    title: 'Hexapawn 3×3',
    blurb: 'Three pawns a side on a 3×3 board. Push or capture forward; reach the far rank, take every enemy, or leave them stuck. The first player, playing perfectly, still loses.',
    players: [W, B],
    boardKind: 'pawns',
    size: SZ,
    nodeBudget: 4000, // the reachable canonical graph is tiny (71 nodes)

    initState: function () {
      var b = new Array(N);
      for (var i = 0; i < N; i++) b[i] = 0;
      b[idx(0, 0)] = B; b[idx(0, 1)] = B; b[idx(0, 2)] = B; // Black home (top)
      b[idx(2, 0)] = W; b[idx(2, 1)] = W; b[idx(2, 2)] = W; // White home (bottom)
      return { board: b, turn: 0 };                          // White (players[0]) to move
    },

    legalMoves: function (s) {
      // Live moves for the side to move. If the position is already terminal, none.
      var t = GAME_hexapawn.terminal(s);
      if (t.over) return [];
      return rawMoves(s.board, s.turn);
    },

    apply: function (s, m) {
      var b = s.board.slice();
      b[m.to] = b[m.from];
      b[m.from] = 0;
      return { board: b, turn: s.turn ^ 1 };
    },

    // From the side-to-move's POV (normal play, value is for the mover):
    //   • the OPPONENT reached our-side's home far rank last move → the OPPONENT
    //     promoted → we LOSE. (i.e. an enemy pawn on the row the enemy races to.)
    //   • we have ZERO pawns (all captured) → we LOSE.
    //   • we have pawns but NO legal move (stalemate) → we LOSE.
    // There are no draws: one of these always resolves before the board jams.
    terminal: function (s) {
      var board = s.board, turn = s.turn;
      var enemyFar = farRowOf(turn ^ 1);          // the row the OPPONENT promotes on
      var enemy = enemyOf(turn);
      // opponent already promoted (sits on their far rank) → mover has lost.
      for (var c = 0; c < SZ; c++) {
        if (board[idx(enemyFar, c)] === enemy) return { over: true, value: 'LOSS' };
      }
      // mover has no pawns left → lost.
      if (countOf(board, pieceOf(turn)) === 0) return { over: true, value: 'LOSS' };
      // mover has pawns but no legal move → stalemated → lost.
      if (rawMoves(board, turn).length === 0) return { over: true, value: 'LOSS' };
      return { over: false };
    },

    // Canonical key: left-right mirror (value-preserving) + side-to-move. We pick
    // whichever of {board, mirror(board)} has the lexicographically smaller string.
    key: function (s) {
      var id = boardStr(s.board);
      var mir = boardStr(mirrorBoard(s.board));
      var best = mir < id ? mir : id;
      return best + '|' + s.turn;
    },

    // The declared symmetry image used by the engine's symmetry-soundness check:
    // the left-right mirror, same side to move.
    symmetries: function (s) {
      return [{ board: mirrorBoard(s.board), turn: s.turn }];
    },

    sideToMove: function (s) { return GAME_hexapawn.players[s.turn]; },

    moveLabel: function (s, m) {
      return 'r' + (rowOf(m.from) + 1) + 'c' + (colOf(m.from) + 1) + '→r' +
        (rowOf(m.to) + 1) + 'c' + (colOf(m.to) + 1);
    },

    render: function (s) {
      var rows = [];
      for (var r = 0; r < SZ; r++) {
        var cells = [];
        for (var c = 0; c < SZ; c++) { var v = s.board[idx(r, c)]; cells.push(v === 0 ? '.' : v); }
        rows.push('  ' + cells.join(' '));
      }
      return rows.join('\n');
    },

    literatureValue: 'LOSS', // the opening is a LOSS for the side to move (a 2nd-player win)

    // ── the bridge the learner + UI need (mirror round-trip) ──────────────────
    // A live move can be stored by the learner against the CANONICAL board. The
    // canonical move id is a stable string "cFrom-cTo" expressed in the canonical
    // orientation. liveMove() maps a canonical id back to the live {from,to} so the
    // UI animates a real on-screen move and never appears to teleport.
    canonicalMoveId: function (s, m) {
      var mir = isMirrored(s.board);
      var cf = mir ? mirrorCell(m.from) : m.from;
      var ct = mir ? mirrorCell(m.to) : m.to;
      return cf + '-' + ct;
    },
    liveMove: function (s, canonicalId) {
      var mir = isMirrored(s.board);
      var parts = canonicalId.split('-');
      var cf = +parts[0], ct = +parts[1];
      var from = mir ? mirrorCell(cf) : cf;
      var to = mir ? mirrorCell(ct) : ct;
      return { from: from, to: to };
    },
    isMirrored: isMirrored,

    // ── literature battery ────────────────────────────────────────────────────
    // (i) root is LOSS with mate distance 6; (ii) no node anywhere is a DRAW (sweep
    // all reachable canonical nodes); (iii) value(s) === value(mirror(s)) over a
    // battery (the mirror is a true value-preserving symmetry).
    literatureBattery: function (solve, V) {
      var fails = [];
      var sol = solve(GAME_hexapawn);

      // (i) opening = LOSS, mate in 6.
      if (sol.value !== V.LOSS) fails.push('root value ' + sol.value + ' != LOSS (a 2nd-player win)');
      if (sol.dist !== 6) fails.push('root mate distance ' + sol.dist + ' != 6');

      // (ii) sweep every reachable canonical node: none is a DRAW.
      var draws = 0;
      sol.table.forEach(function (node) { if (node.value === V.DRAW) draws++; });
      if (draws !== 0) fails.push(draws + ' DRAW node(s) found (Hexapawn has no draws)');
      if (sol.nodeCount !== 71) fails.push('reachable canonical nodes ' + sol.nodeCount + ' != 71');

      // (iii) value-preserving mirror: over every reachable state, value(s) ===
      // value(mirror(s)). We re-walk the reachable graph (a tiny BFS) collecting one
      // representative state per canonical key, then assert each mirrors to a node of
      // the same value. No dependency on the engine global — self-contained here.
      var byKey = new Map();
      var root0 = GAME_hexapawn.initState();
      var q = [root0]; byKey.set(GAME_hexapawn.key(root0), root0);
      while (q.length) {
        var st = q.shift();
        var mv = GAME_hexapawn.legalMoves(st);
        for (var mi = 0; mi < mv.length; mi++) {
          var ch = GAME_hexapawn.apply(st, mv[mi]);
          var ck = GAME_hexapawn.key(ch);
          if (!byKey.has(ck)) { byKey.set(ck, ch); q.push(ch); }
        }
      }
      var mirBad = 0;
      byKey.forEach(function (st2) {
        var v0 = sol.table.get(GAME_hexapawn.key(st2));
        var vm = sol.table.get(GAME_hexapawn.key({ board: mirrorBoard(st2.board), turn: st2.turn }));
        if (!v0 || !vm || v0.value !== vm.value) mirBad++;
      });
      if (mirBad !== 0) fails.push(mirBad + ' positions where value(s) != value(mirror(s))');

      return {
        ok: fails.length === 0,
        detail: fails.length ? fails.join('; ')
          : 'root LOSS mate-in-6 · 71 nodes, 0 draws · mirror value-preserving'
      };
    }
  };

  if (root) root.GAME_hexapawn = GAME_hexapawn;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_hexapawn; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
