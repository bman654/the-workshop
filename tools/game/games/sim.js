/* ═══════════════════════════════════════════════════════════════════════════
   sim.js — game-def: Sim on K6 (the game that can't be drawn). Pure DATA + tiny
   pure fns in the EXACT adversary.js contract (same shape as hex3.js/chomp.js).
   One engine, many games (see tools/game/adversary.js). Dual-use: attaches
   GAME_sim global AND exports via the module guard (forge strips it when inlining).

   RULES: six studs stand in a ring — the complete graph K6, 15 chords (edges).
   Red (player 0, first) and Blue (player 1) alternate claiming an uncoloured
   chord in THEIR colour. Whoever is FORCED to complete a same-colour TRIANGLE
   among the studs LOSES. Colour is bound to the player (Red always red), so the
   only triangle that can appear on a move is the mover's own.

   LITERATURE (the claims the self-test proves):
     • NO DRAW is possible: by R(3,3)=6, every 2-colouring of K6's 15 edges hides
       a monochromatic triangle, so the board can never fill without a loser.
     • Sim is a SECOND-PLAYER win: solve() retrograde-labels the whole tree and
       returns the root (Red to move) as a LOSS with an EXACT finite mate distance.
     • NEG-CONTROL on K5: at least one triangle-free 2-colouring exists (the
       pentagon/pentagram split), so 5 studs CAN draw — 6 is the exact threshold.

   State: { edges:[15] of 0|'R'|'B', turn:0|1 }. Colour is bound to the player
   (turn 0 = Red, turn 1 = Blue), so the coloured-edge counts fix the turn:
   #R==#B ⇔ turn 0, #R==#B+1 ⇔ turn 1. key() folds the S6 stud-relabelling (720
   vertex permutations) ONLY — NOT a colour-swap: colour is bound to the player
   (Red always moves first), so #R ≥ #B always distinguishes the two colour-classes
   by size, and swapping them changes the mover's own graph — the very thing that
   can be forced into a triangle. So S6 is the whole sound symmetry group.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var NV = 6, NE = 15;

  // ── fixed edge indexing: all pairs i<j in lexicographic order → index 0..14 ──
  var EDGES = [];            // EDGES[e] = [i,j]
  var EIDX = [];             // EIDX[i][j] = EIDX[j][i] = edge index
  for (var i = 0; i < NV; i++) EIDX.push(new Array(NV).fill(-1));
  (function () {
    var e = 0;
    for (var a = 0; a < NV; a++) for (var b = a + 1; b < NV; b++) {
      EDGES.push([a, b]); EIDX[a][b] = EIDX[b][a] = e; e++;
    }
  })();

  // ── the 20 triangles as edge-index triples (C(6,3)) ──
  var TRIS = [];
  for (var a = 0; a < NV; a++) for (var b = a + 1; b < NV; b++) for (var c = b + 1; c < NV; c++) {
    TRIS.push([EIDX[a][b], EIDX[a][c], EIDX[b][c]]);
  }

  // ── precompute the 720 vertex permutations as EDGE-index permutations ──
  // permEdges[p][e] = the index the edge e maps to under vertex permutation p.
  var PERMS = [];            // each is an int[15]: old-edge-index → new-edge-index
  (function () {
    var perm = [0, 1, 2, 3, 4, 5];
    function rec(k) {
      if (k === NV) {
        var pe = new Array(NE);
        for (var e2 = 0; e2 < NE; e2++) {
          var uv = EDGES[e2];
          pe[e2] = EIDX[perm[uv[0]]][perm[uv[1]]];
        }
        PERMS.push(pe);
        return;
      }
      for (var i2 = k; i2 < NV; i2++) {
        var t = perm[k]; perm[k] = perm[i2]; perm[i2] = t;
        rec(k + 1);
        t = perm[k]; perm[k] = perm[i2]; perm[i2] = t;
      }
    }
    rec(0);
  })();

  function sym(v) { return v === 0 ? '.' : (v === 'R' ? 'r' : 'b'); }

  // Memo for key(): canonicalisation costs 720 relabellings, but many raw
  // colourings recur (BFS revisits, the never-loses sweep replays games, live
  // play probes children). Cache raw-colouring+turn → canonical key. Deterministic,
  // so a warm cache never changes an answer; bounded by the reachable raw states.
  var KEY_MEMO = new Map();

  // Does the colouring contain ANY monochromatic triangle? (Only the mover's own
  // colour can be completed on a move, but we detect any — either proves a loss.)
  function hasMonoTri(edges) {
    for (var t = 0; t < TRIS.length; t++) {
      var e0 = edges[TRIS[t][0]];
      if (e0 !== 0 && e0 === edges[TRIS[t][1]] && e0 === edges[TRIS[t][2]]) return true;
    }
    return false;
  }

  // Canonical string of a colouring under a single vertex permutation.
  function relabel(edges, pe) {
    var out = new Array(NE);
    for (var e = 0; e < NE; e++) out[pe[e]] = sym(edges[e]);
    return out.join('');
  }

  var GAME_sim = {
    id: 'sim',
    title: 'Sim (K6)',
    blurb: 'Claim chords in your colour; whoever is forced to complete a same-colour triangle loses — and the board can never be a draw.',
    players: ['R', 'B'],       // player 0 = Red (first), player 1 = Blue
    boardKind: 'graph',
    nv: NV, ne: NE,
    EDGES: EDGES, TRIS: TRIS,
    nodeBudget: 40000,         // measured canonical reachable set is far smaller (see battery)

    initState: function () { var b = new Array(NE); for (var i = 0; i < NE; i++) b[i] = 0; return { edges: b, turn: 0 }; },

    // If the position already holds a mono triangle it is terminal (no moves).
    // Otherwise every uncoloured chord is legal — INCLUDING a chord that completes
    // your own triangle (that suicidal-but-forced move is exactly the trap).
    legalMoves: function (s) {
      if (hasMonoTri(s.edges)) return [];
      var moves = [];
      for (var e = 0; e < NE; e++) if (s.edges[e] === 0) moves.push({ edge: e });
      return moves;
    },

    apply: function (s, m) {
      var b = s.edges.slice();
      b[m.edge] = GAME_sim.players[s.turn];   // colour bound to the mover
      return { edges: b, turn: s.turn ^ 1 };
    },

    // The player who JUST moved may have completed THEIR OWN mono triangle → that
    // player LOSES, so the side to move (the other player) has WON. Value is from
    // the side-to-move POV, hence WIN. No draws are possible (R(3,3)=6), so a full
    // board always holds a triangle; the full-without-triangle branch is
    // unreachable but kept total, never claiming a draw.
    terminal: function (s) {
      if (hasMonoTri(s.edges)) return { over: true, value: 'WIN' };
      for (var e = 0; e < NE; e++) if (s.edges[e] === 0) return { over: false };
      return { over: true, value: 'WIN' };   // unreachable; never a DRAW
    },

    // Canonical key: minimise the colouring string over all 720 stud-relabellings
    // (the FULL and ONLY sound symmetry). Colour-swap is deliberately NOT folded:
    // colour is bound to the player and Red moves first, so #R ≥ #B always — the
    // two colour-classes are DISTINGUISHABLE by size, and swapping them changes the
    // mover's own graph (which is exactly what can be forced into a triangle). No
    // colour map preserves both value and reachability, so S6 is the whole group.
    key: function (s) {
      var raw = '';                              // the un-canonical colouring
      for (var e = 0; e < NE; e++) raw += sym(s.edges[e]);
      var memoK = raw + s.turn;
      var hit = KEY_MEMO.get(memoK);
      if (hit !== undefined) return hit;
      var best = null;
      for (var p = 0; p < PERMS.length; p++) {
        var str = relabel(s.edges, PERMS[p]);
        if (best === null || str < best) best = str;
      }
      var out = best + '|' + s.turn;
      KEY_MEMO.set(memoK, out);
      return out;
    },

    // Generator symmetries for the engine's canon-soundness check: three vertex
    // relabellings (a transposition, a 6-cycle, the reversal) generate all of S6,
    // so invariance under them ⇒ invariance under the whole group — a sound, cheap
    // probe. (No colour-swap image: colour-swap is NOT a symmetry here, see key().)
    symmetries: function (s) {
      var out = [];
      var gens = [
        [1, 0, 2, 3, 4, 5],       // swap studs 0,1
        [1, 2, 3, 4, 5, 0],       // 6-cycle
        [5, 4, 3, 2, 1, 0]        // reversal
      ];
      for (var g = 0; g < gens.length; g++) {
        var perm = gens[g], nb = new Array(NE);
        for (var e = 0; e < NE; e++) {
          var uv = EDGES[e];
          nb[EIDX[perm[uv[0]]][perm[uv[1]]]] = s.edges[e];
        }
        out.push({ edges: nb, turn: s.turn });
      }
      return out;
    },

    sideToMove: function (s) { return GAME_sim.players[s.turn]; },

    moveLabel: function (s, m) { var uv = EDGES[m.edge]; return 'chord ' + (uv[0] + 1) + '-' + (uv[1] + 1) + ' (' + GAME_sim.players[s.turn] + ')'; },

    render: function (s) {
      var lines = ['  studs 1..6, chords (·=open r=Red b=Blue):'];
      for (var e = 0; e < NE; e++) {
        var uv = EDGES[e];
        lines.push('    ' + (uv[0] + 1) + '-' + (uv[1] + 1) + ' ' + sym(s.edges[e]));
      }
      return lines.join('\n');
    },

    literatureValue: 'LOSS',   // root = Red (P1) to move; Sim is a SECOND-player win ⇒ LOSS for the mover

    /* THE NO-DRAW THEOREM (R(3,3)=6) + the exact threshold, over enumerations that
       run the SAME hasMonoTri the game uses:
         (a) EXHAUSTIVE K6: all 2^15 = 32768 complete 2-colourings contain a mono
             triangle → exactly 0 draw-boards.
         (b) SOLVED: the root is a P2 win (LOSS for the mover) with a FINITE mate
             distance (no draws ⇒ every node decisive).
         (c) NEG-CONTROL K5: of the 2^10 = 1024 complete 2-colourings, ≥1 is
             triangle-free, and the pentagon/pentagram (C5 red / C5 blue) split is
             one such — so 5 studs CAN draw; 6 is the exact threshold.
         (d) node-count under budget. */
    literatureBattery: function (solve, V) {
      var fails = [];

      // ── (a) EXHAUSTIVE K6: 0 triangle-free complete colourings ──
      var k6 = countTriangleFree(6);
      if (k6.total !== 32768) fails.push('K6 enum wrong count: ' + k6.total + ' ≠ 32768');
      if (k6.free !== 0) fails.push('K6 NOT no-draw: ' + k6.free + ' triangle-free colourings (want 0)');

      // ── (b) SOLVED: root LOSS (P2 win) with finite mate distance, and the WHOLE
      //        solved tree is DRAW-free (the no-draw theorem made manifest in the
      //        game graph itself, complementing the 2^15-colouring count above) ──
      var sol = solve(GAME_sim);
      if (!sol.ok) fails.push('solve failed: ' + sol.error);
      else {
        if (sol.value !== V.LOSS) fails.push('root value ' + sol.value + ' ≠ LOSS (P2 win)');
        if (!(sol.dist > 0 && sol.dist < Infinity)) fails.push('mate distance not finite: ' + sol.dist);
        var draws = 0; sol.table.forEach(function (n) { if (n.value === V.DRAW) draws++; });
        if (draws !== 0) fails.push(draws + ' DRAW nodes in the solved tree (must be 0 — no position is a tie)');
      }

      // ── (c) NEG-CONTROL K5: ≥1 triangle-free, incl. the pentagon/pentagram split ──
      var k5 = countTriangleFree(5);
      if (k5.total !== 1024) fails.push('K5 enum wrong count: ' + k5.total + ' ≠ 1024');
      if (k5.free < 1) fails.push('K5 neg-control broken: 0 triangle-free colourings (want ≥1)');
      if (!pentagonSplitIsTriangleFree()) fails.push('pentagon/pentagram split is NOT triangle-free?!');

      // ── (d) node-count sane ──
      var nc = sol && sol.ok ? sol.nodeCount : 0;
      if (nc <= 0 || nc >= 300000) fails.push('node-count out of range: ' + nc);

      return {
        ok: fails.length === 0,
        // structured counts so a UI (the board's "why it can't draw" drawer) can
        // read the LIVE proof numbers instead of hard-coding them — text CANNOT
        // drift from the enumeration. drawFree = triangle-free complete colourings.
        counts: {
          k6: { total: k6.total, drawFree: k6.free },
          k5: { total: k5.total, drawFree: k5.free }
        },
        detail: fails.length ? fails.join('; ')
          : ('K6: all 32768 complete colourings hold a mono triangle (0 draws) · root=LOSS (P2 win) mate-in-' +
             (sol && sol.dist) + ' over ' + nc + ' canonical nodes · K5 neg-control: ' + k5.free +
             ' triangle-free colourings exist (incl. pentagon/pentagram) — 6 is the exact threshold')
      };
    }
  };

  // Count complete 2-colourings of K_n (no uncoloured edge) that are triangle-free.
  // Returns { total, free }. Uses a fresh edge/triangle index for the given n.
  function countTriangleFree(n) {
    var eidx = [], edges = [], ei = 0;
    for (var a = 0; a < n; a++) eidx.push(new Array(n).fill(-1));
    for (var a2 = 0; a2 < n; a2++) for (var b2 = a2 + 1; b2 < n; b2++) { edges.push([a2, b2]); eidx[a2][b2] = eidx[b2][a2] = ei++; }
    var tris = [];
    for (var x = 0; x < n; x++) for (var y = x + 1; y < n; y++) for (var z = y + 1; z < n; z++) tris.push([eidx[x][y], eidx[x][z], eidx[y][z]]);
    var m = edges.length, total = 1 << m, free = 0;
    for (var mask = 0; mask < total; mask++) {
      var ok = true;
      for (var t = 0; t < tris.length; t++) {
        var b0 = (mask >> tris[t][0]) & 1, b1 = (mask >> tris[t][1]) & 1, b2b = (mask >> tris[t][2]) & 1;
        if (b0 === b1 && b1 === b2b) { ok = false; break; }   // all-0 (all Red) or all-1 (all Blue) triangle
      }
      if (ok) free++;
    }
    return { total: total, free: free };
  }

  // The explicit witness for K5: colour the 5-cycle 0-1-2-3-4-0 Red and the
  // "pentagram" 5-cycle 0-2-4-1-3-0 Blue. Neither 5-cycle contains a triangle.
  function pentagonSplitIsTriangleFree() {
    var n = 5, eidx = [];
    for (var a = 0; a < n; a++) eidx.push(new Array(n).fill(-1));
    var ei = 0; for (var a2 = 0; a2 < n; a2++) for (var b2 = a2 + 1; b2 < n; b2++) eidx[a2][b2] = eidx[b2][a2] = ei++;
    var col = new Array(10).fill(null);
    var pent = [[0,1],[1,2],[2,3],[3,4],[4,0]];       // Red pentagon
    var star = [[0,2],[2,4],[4,1],[1,3],[3,0]];       // Blue pentagram
    for (var i = 0; i < 5; i++) col[eidx[pent[i][0]][pent[i][1]]] = 0;
    for (var j = 0; j < 5; j++) col[eidx[star[j][0]][star[j][1]]] = 1;
    var tris = [];
    for (var x = 0; x < n; x++) for (var y = x + 1; y < n; y++) for (var z = y + 1; z < n; z++) tris.push([eidx[x][y], eidx[x][z], eidx[y][z]]);
    for (var t = 0; t < tris.length; t++) {
      var c0 = col[tris[t][0]], c1 = col[tris[t][1]], c2 = col[tris[t][2]];
      if (c0 === c1 && c1 === c2) return false;
    }
    return true;
  }

  // ── the perfect P2 player, self-contained over the solved table (no Adversary
  // dependency) — the board facet calls this to let the machine play flawlessly.
  // Ranks the LIVE legal moves (re-canonicalising each child) so it stays correct
  // under the S6 stud-relabelling fold (colour-swap is NOT folded — colour is
  // bound to the player, see key()). Returns the chosen move, or null if terminal.
  function perfectMove(state, sol) {
    var moves = GAME_sim.legalMoves(state);
    if (!moves.length) return null;
    var best = null, bestRank = null;
    for (var i = 0; i < moves.length; i++) {
      var child = GAME_sim.apply(state, moves[i]);
      var c = sol.table.get(GAME_sim.key(child));
      // rank tuple [tier,dist]: 0 = LOSS-for-opp (we win, fastest), 1 = DRAW,
      // 2 = WIN-for-opp (we lose, slowest). (No draws here, but keep it total.)
      var rank = c ? (c.value === 'LOSS' ? [0, c.dist] : c.value === 'DRAW' ? [1, 0] : [2, c.dist === Infinity ? 1e9 : c.dist]) : [2, 1e9];
      if (best === null || betterRank(rank, bestRank)) { best = moves[i]; bestRank = rank; }
    }
    return best;
  }
  function betterRank(a, b) {
    if (a[0] !== b[0]) return a[0] < b[0];
    if (a[0] === 2) return a[1] > b[1];
    return a[1] < b[1];
  }

  GAME_sim.hasMonoTri = hasMonoTri;
  GAME_sim.countTriangleFree = countTriangleFree;
  GAME_sim.pentagonSplitIsTriangleFree = pentagonSplitIsTriangleFree;
  GAME_sim.perfectMove = perfectMove;

  if (root) root.GAME_sim = GAME_sim;
  if (typeof module !== 'undefined' && module.exports) { module.exports = GAME_sim; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
