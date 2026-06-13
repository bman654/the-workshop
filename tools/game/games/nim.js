/* ═══════════════════════════════════════════════════════════════════════════
   nim.js — game-def: Nim (capped heaps). Pure DATA + tiny pure fns. One engine,
   many games (see tools/game/adversary.js). Dual-use: attaches GAME_nim global
   AND exports via the module guard (forge strips the guard when inlining).

   RULES (normal play): heaps of counters; on your turn remove ≥1 from ONE heap;
   the player who takes the LAST counter WINS. (Misère is a different game; we
   ship normal play — the Sprague-Grundy / XOR theorem applies.)

   LITERATURE (the claim the self-test proves): the position is a first-player
   WIN iff the bitwise XOR ("nim-sum") of the heap sizes is non-zero; a P-position
   (previous-player win = LOSS for the mover) iff the nim-sum is zero.

   State: { heaps:[int,...] }. Side-to-move is implicit (Nim is impartial — the
   same moves are available to whoever is to move — so the value is fully
   determined by the heaps; "turn" is not part of the key).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var HEAPS = [3, 4, 5]; // a classic Nim position (nim-sum 3^4^5 = 2 ≠ 0 → first-player WIN)

  function nimSum(heaps) { var x = 0; for (var i = 0; i < heaps.length; i++) x ^= heaps[i]; return x; }

  var GAME_nim = {
    id: 'nim',
    title: 'Nim',
    blurb: 'Take any number from one heap; take the last counter to win.',
    players: ['X', 'O'],
    boardKind: 'heaps',
    nodeBudget: 2000, // (3+1)(4+1)(5+1)=120 raw states; canon (sorted) fewer

    initState: function () { return { heaps: HEAPS.slice() }; },

    legalMoves: function (s) {
      var moves = [];
      for (var h = 0; h < s.heaps.length; h++) {
        for (var take = 1; take <= s.heaps[h]; take++) moves.push({ heap: h, take: take });
      }
      return moves;
    },

    apply: function (s, m) {
      var heaps = s.heaps.slice();
      heaps[m.heap] -= m.take;
      return { heaps: heaps };
    },

    // Terminal when all heaps are empty: the player to move has NO counters to
    // take → they lose (the previous player took the last counter). Normal play.
    terminal: function (s) {
      var total = 0; for (var i = 0; i < s.heaps.length; i++) total += s.heaps[i];
      if (total === 0) return { over: true, value: 'LOSS' };
      return { over: false };
    },

    // Canonical, symmetry-reduced: heaps are interchangeable → sort; drop empties.
    key: function (s) {
      var nz = [];
      for (var i = 0; i < s.heaps.length; i++) if (s.heaps[i] > 0) nz.push(s.heaps[i]);
      nz.sort(function (a, b) { return a - b; });
      return nz.join(',');
    },

    // Symmetry images: any permutation of the heaps is the same position. We emit
    // a reverse + a rotation as representative non-identity images for the test.
    symmetries: function (s) {
      var a = s.heaps.slice();
      var rev = a.slice().reverse();
      var rot = a.slice(1).concat(a.slice(0, 1));
      return [{ heaps: rev }, { heaps: rot }];
    },

    sideToMove: function (s) { return 'to move'; },

    moveLabel: function (s, m) { return 'heap ' + (m.heap + 1) + ' −' + m.take; },

    render: function (s) {
      var rows = [];
      for (var i = 0; i < s.heaps.length; i++) {
        rows.push('  H' + (i + 1) + ': ' + new Array(s.heaps[i] + 1).join('●') + ' (' + s.heaps[i] + ')');
      }
      return rows.join('\n');
    },

    literatureValue: 'WIN', // for the shipped HEAPS [3,4,5], nim-sum = 2 ≠ 0

    // The Nim XOR THEOREM over a battery of positions: across many heap configs,
    // computed value is WIN iff nim-sum ≠ 0 (LOSS iff nim-sum == 0). No draws.
    literatureBattery: function (solve, V) {
      var configs = [
        [1], [2], [1, 1], [1, 2], [2, 2], [3, 4, 5], [1, 2, 3], [4, 4],
        [1, 1, 1], [5, 5, 5], [1, 4, 5], [2, 3, 1], [0, 0], [6], [3, 3, 0]
      ];
      var fails = [];
      for (var i = 0; i < configs.length; i++) {
        var def = makeNim(configs[i]);
        var sol = solve(def);
        var ns = nimSum(configs[i]);
        var expect = ns === 0 ? V.LOSS : V.WIN;
        if (sol.value !== expect) {
          fails.push('[' + configs[i] + '] nim-sum ' + ns + ' want ' + expect + ' got ' + sol.value);
        }
      }
      return { ok: fails.length === 0, detail: fails.length ? fails.join('; ') : (configs.length + ' positions obey the XOR theorem') };
    }
  };

  // Helper: build a Nim def for an arbitrary heap config (used by the battery).
  function makeNim(heaps) {
    var d = {};
    for (var k in GAME_nim) d[k] = GAME_nim[k];
    d.id = 'nim:' + heaps.join('.');
    var h0 = heaps.slice();
    d.initState = function () { return { heaps: h0.slice() }; };
    d.nodeBudget = 5000;
    return d;
  }
  GAME_nim.makeNim = makeNim; // exposed for the battery + tests

  if (root) root.GAME_nim = GAME_nim;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_nim; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
