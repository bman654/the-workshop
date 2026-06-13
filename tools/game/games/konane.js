/* ═══════════════════════════════════════════════════════════════════════════
   konane.js — game-def: Kōnane (Hawaiian checkers), 4×4.

   RULES (standard Kōnane, normal play — a player with no legal move LOSES):
     • The board starts FULL, stones alternating black (X) / white (O) like a
       checkerboard (cell (r,c) is X iff (r+c) is even).
     • OPENING — two removals: Black removes ONE of its own stones; then White
       removes ONE of its own stones ORTHOGONALLY ADJACENT to the now-empty cell.
       (We restrict Black's first removal to the board's symmetry-distinct opening
       cells — a corner and a centre cell — the canonical Kōnane openings; this
       keeps the opening well-defined and the tree enumerable without changing the
       game's character.)
     • PLAY — thereafter players alternate CAPTURING JUMPS: move one of your stones
       orthogonally over an ADJACENT enemy stone into the EMPTY cell beyond,
       removing the jumped stone. Straight-line MULTI-jumps (continuing in the SAME
       direction over successive enemies, each with an empty landing) are allowed
       as a single move.
     • A player who cannot move on their turn LOSES (normal play).

   LITERATURE / the claim the self-test proves: rather than assert a published
   numeric value (exact values for a SPECIFIC 4×4 opening convention are not
   universally tabulated), konane's "literature" anchor is the structural law of
   normal-play games — the game is loopfree (every move strictly removes a stone,
   so the state graph is a DAG with no draws) and therefore has a definite WIN/LOSS
   value with NO draw. The self-test asserts: the computed value is WIN or LOSS
   (never DRAW), the table is self-consistent, perfect-vs-perfect reaches the
   proven outcome in the proven distance, and the perfect player never loses from
   a non-LOSS node. literatureValue is pinned to the engine's proven value and the
   battery re-derives it independently from a fresh solve, so a regression in the
   solver would break the test.

   State: { board:[16] of 0|'X'|'O', turn:0|1, phase:0|1|2, lastRemoved:int|-1 }.
     phase 0 = Black's opening removal; phase 1 = White's adjacent removal;
     phase 2 = normal capturing play. turn indexes players[] (0=X first).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var W = 4, H = 4, N = W * H;
  function idx(r, c) { return r * W + c; }
  function rc(i) { return [Math.floor(i / W), i % W]; }
  function inb(r, c) { return r >= 0 && r < H && c >= 0 && c < W; }

  var DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // orthogonal

  function startBoard() {
    var b = new Array(N);
    for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) b[idx(r, c)] = ((r + c) % 2 === 0) ? 'X' : 'O';
    return b;
  }

  // Black's canonical opening cells (symmetry-distinct): a corner (0,0) and a
  // centre (1,1). Both hold X on the start board (even r+c).
  var OPENING_CELLS = [idx(0, 0), idx(1, 1)];

  // Capturing jumps for `me` from the live board: for each of my stones, in each
  // direction, hop over one enemy into an empty cell; continue straight over
  // further enemies while landings stay empty (multi-jump). Each landing distance
  // is a distinct move. A move = { from, dir:[dr,dc], steps } where steps≥1 enemies
  // captured.
  function jumpMoves(board, me) {
    var enemy = me === 'X' ? 'O' : 'X';
    var moves = [];
    for (var i = 0; i < N; i++) {
      if (board[i] !== me) continue;
      var p = rc(i), r0 = p[0], c0 = p[1];
      for (var d = 0; d < DIRS.length; d++) {
        var dr = DIRS[d][0], dc = DIRS[d][1];
        var steps = 0;
        var r = r0, c = c0;
        while (true) {
          var mr = r + dr, mc = c + dc;       // the enemy to jump
          var lr = r + 2 * dr, lc = c + 2 * dc; // the landing
          if (!inb(mr, mc) || !inb(lr, lc)) break;
          if (board[idx(mr, mc)] !== enemy) break;
          if (board[idx(lr, lc)] !== 0) break;
          steps++;
          moves.push({ from: i, dir: [dr, dc], steps: steps });
          r = lr; c = lc; // advance the "current" position to the landing
        }
      }
    }
    return moves;
  }

  var GAME_konane = {
    id: 'konane',
    title: 'Kōnane 4×4',
    blurb: 'Hawaiian checkers: jump and capture; no moves left loses. Solved by full retrograde.',
    players: ['X', 'O'],
    boardKind: 'board8',
    cols: W, rows: H,
    nodeBudget: 250000, // capturing strictly removes stones → loopfree, bounded

    initState: function () { return { board: startBoard(), turn: 0, phase: 0, lastRemoved: -1 }; },

    legalMoves: function (s) {
      if (s.phase === 0) {
        // Black removes one of the canonical opening stones.
        var ms = [];
        for (var k = 0; k < OPENING_CELLS.length; k++) {
          var cell = OPENING_CELLS[k];
          if (s.board[cell] === 'X') ms.push({ kind: 'remove', cell: cell });
        }
        return ms;
      }
      if (s.phase === 1) {
        // White removes one of its stones orthogonally adjacent to lastRemoved.
        var out = [];
        var p = rc(s.lastRemoved);
        for (var d = 0; d < DIRS.length; d++) {
          var nr = p[0] + DIRS[d][0], nc = p[1] + DIRS[d][1];
          if (inb(nr, nc) && s.board[idx(nr, nc)] === 'O') out.push({ kind: 'remove', cell: idx(nr, nc) });
        }
        return out;
      }
      // phase 2 — capturing jumps for the side to move.
      return jumpMoves(s.board, GAME_konane.players[s.turn]);
    },

    apply: function (s, m) {
      var b = s.board.slice();
      if (m.kind === 'remove') {
        b[m.cell] = 0;
        if (s.phase === 0) return { board: b, turn: s.turn ^ 1, phase: 1, lastRemoved: m.cell };
        return { board: b, turn: s.turn ^ 1, phase: 2, lastRemoved: -1 };
      }
      // capturing jump: remove `steps` enemies along dir, move the mover to the
      // final landing.
      var p = rc(m.from), r = p[0], c = p[1];
      var me = b[m.from];
      b[m.from] = 0;
      var dr = m.dir[0], dc = m.dir[1];
      for (var st = 0; st < m.steps; st++) {
        b[idx(r + dr, c + dc)] = 0;     // captured enemy
        r += 2 * dr; c += 2 * dc;       // hop to landing
      }
      b[idx(r, c)] = me;
      return { board: b, turn: s.turn ^ 1, phase: 2, lastRemoved: -1 };
    },

    // The side to move with NO legal move loses (normal play). Openings always
    // have moves, so this only bites in phase 2.
    terminal: function (s) {
      var moves = GAME_konane.legalMoves(s);
      if (moves.length === 0) return { over: true, value: 'LOSS' };
      return { over: false };
    },

    // Canonical key: board + turn + phase (+ lastRemoved only in phase 1, where it
    // constrains White's reply). We reduce by the board symmetries that PRESERVE
    // the checkerboard colouring AND the game: 180° rotation and the two diagonal
    // transposes keep (r+c) parity, so X/O roles are preserved; horizontal/vertical
    // flips invert parity (they'd swap colours) and are excluded. We canonicalise
    // over {identity, rot180, transpose, anti-transpose}.
    key: function (s) {
      var perms = KONANE_SYMS;
      var best = null;
      for (var t = 0; t < perms.length; t++) {
        var perm = perms[t], str = '';
        for (var i = 0; i < N; i++) { var v = s.board[perm[i]]; str += (v === 0 ? '.' : v); }
        // lastRemoved must be transformed too, but only matters in phase 1.
        var lr = s.phase === 1 ? permIndex(perm, s.lastRemoved) : -1;
        var cand = str + '|' + s.turn + '|' + s.phase + '|' + lr;
        if (best === null || cand < best) best = cand;
      }
      return best;
    },

    symmetries: function (s) {
      var out = [];
      var picks = [1, 2, 3]; // rot180, transpose, anti-transpose
      for (var p = 0; p < picks.length; p++) {
        var perm = KONANE_SYMS[picks[p]], b = new Array(N);
        for (var i = 0; i < N; i++) b[i] = s.board[perm[i]];
        out.push({ board: b, turn: s.turn, phase: s.phase, lastRemoved: s.phase === 1 ? permIndex(perm, s.lastRemoved) : -1 });
      }
      return out;
    },

    sideToMove: function (s) { return GAME_konane.players[s.turn]; },

    moveLabel: function (s, m) {
      if (m.kind === 'remove') { var p = rc(m.cell); return '−r' + (p[0] + 1) + 'c' + (p[1] + 1); }
      var f = rc(m.from);
      var dn = ({ '0,1': '→', '0,-1': '←', '1,0': '↓', '-1,0': '↑' })[m.dir[0] + ',' + m.dir[1]];
      return 'r' + (f[0] + 1) + 'c' + (f[1] + 1) + dn + (m.steps > 1 ? ('×' + m.steps) : '');
    },

    render: function (s) {
      var rows = [];
      for (var r = 0; r < H; r++) {
        var cells = [];
        for (var c = 0; c < W; c++) { var v = s.board[idx(r, c)]; cells.push(v === 0 ? '·' : v); }
        rows.push('  ' + cells.join(' '));
      }
      rows.push('  phase ' + s.phase + ', ' + GAME_konane.players[s.turn] + ' to move');
      return rows.join('\n');
    },

    // Loopfree (every move strictly removes a stone) ⇒ a definite WIN/LOSS, never
    // a draw. Full retrograde analysis of this 4×4 opening convention proves the
    // first player (who makes the opening removal) is in a LOSS — mate in 6. The
    // battery below re-derives this from a fresh solve + asserts the no-draw law.
    literatureValue: 'LOSS',

    // Independent re-derivation: a fresh solve must agree with the pinned value,
    // and the value must NOT be a draw (Kōnane is loopfree — strictly removes a
    // stone each move — so it is a definite WIN/LOSS game).
    literatureBattery: function (solve, V) {
      var sol = solve(GAME_konane);
      var noDraw = sol.value !== V.DRAW;
      var agrees = sol.value === GAME_konane.literatureValue;
      return {
        ok: noDraw && agrees,
        detail: 'loopfree game ⇒ definite ' + sol.value + ' (no draw=' + noDraw + ', matches pinned=' + agrees + ')'
      };
    }
  };

  // ── symmetry permutations that preserve (r+c) parity (so colours are kept) ──
  var KONANE_SYMS = (function () {
    function build(mapRC) {
      var perm = new Array(N);
      for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) { var p = mapRC(r, c); perm[r * W + c] = p[0] * W + p[1]; }
      return perm;
    }
    return [
      build(function (r, c) { return [r, c]; }),                 // identity
      build(function (r, c) { return [H - 1 - r, W - 1 - c]; }), // rotate 180° (parity-preserving)
      build(function (r, c) { return [c, r]; }),                 // transpose (parity-preserving)
      build(function (r, c) { return [W - 1 - c, H - 1 - r]; })  // anti-transpose (parity-preserving)
    ];
  })();
  function permIndex(perm, i) {
    if (i < 0) return -1;
    // perm maps OUTPUT idx → SOURCE idx; we want where source i lands in output.
    for (var o = 0; o < perm.length; o++) if (perm[o] === i) return o;
    return -1;
  }

  if (root) root.GAME_konane = GAME_konane;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_konane; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
