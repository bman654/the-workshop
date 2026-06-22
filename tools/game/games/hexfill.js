/* ═══════════════════════════════════════════════════════════════════════════
   hexfill.js — the certified, DOM-free no-draw core for The Board That Cannot
   Tie. ONE module, forge-inlined into hex/index.html AND require()'d by the Node
   twin hex/index.test.mjs, so the lit path you SEE and the no-draw the proof
   ASSERTS run identical code (the "chomp way": dual-use guard, forge strips it).

   THE CLAIM this core makes true and the self-test asserts: fill an n×n rhombic
   Hex board with a coin-flip and EXACTLY ONE colour always spans its two walls —
   never zero (no draw), never both. That is the Hex theorem, and it is a
   consequence of HEX ADJACENCY: each cell touches its two short-diagonal
   neighbours. The negative control proves it: swap the adjacency to a plain
   4-neighbour SQUARE grid (drop the two diagonals) and ties become common.

   Encoding (one, everywhere — matching hex3.js): cells are 'X' / 'O' (or 0 for an
   empty PLAY cell; the core only ever classifies FULL X/O boards). X owns
   TOP↔BOTTOM (row 0 ↔ row SZ-1); O owns LEFT↔RIGHT (col 0 ↔ col SZ-1). board[] is
   a flat SZ*SZ array, cell i = r*SZ + c.

   The neighbour table is a PARAMETER, so the hex board and the square control run
   the SAME engine with only NB swapped — the one variable the teaching turns on.

   Connectivity is weighted union-find with path-halving over same-colour
   neighbours, plus two virtual WALL nodes per query (start-wall and far-wall);
   `who` spans iff the two walls share a root. O(n·α(n)) per query. The page's
   victory glow lights core.spanComponent(...) — the path-finder lives HERE, in
   the certified core, never hand-rolled on the page.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  // Hex adjacency on the rhombus: 4 orthogonal + the two short diagonals. This is
  // EXACTLY hex3.js's NB — the two short-diagonal directions are the whole point.
  var HEX_NB = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, -1]];
  // Square adjacency: drop the two diagonals. The negative control.
  var SQ_NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  // ── weighted union-find with path-halving ──────────────────────────────────
  // n data cells + 2 virtual wall nodes (indices n and n+1). Int32 parents,
  // Uint8 rank for the union-by-rank weighting.
  function makeDSU(n) {
    var parent = new Int32Array(n);
    var rank = new Uint8Array(n);
    for (var i = 0; i < n; i++) parent[i] = i;
    function find(x) {
      while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } // path-halving
      return x;
    }
    function union(a, b) {
      var ra = find(a), rb = find(b);
      if (ra === rb) return;
      if (rank[ra] < rank[rb]) { var t = ra; ra = rb; rb = t; }
      parent[rb] = ra;
      if (rank[ra] === rank[rb]) rank[ra]++;
    }
    return { find: find, union: union, n: n };
  }

  function idx(r, c, SZ) { return r * SZ + c; }

  // Build a DSU over `who`'s stones + two wall nodes, unioning same-colour
  // neighbours over NB and each wall-side stone to its wall node. Returns
  // { dsu, wallA, wallB } so callers can both test spanning and collect a path.
  function buildUnion(board, SZ, who, NB) {
    var N = SZ * SZ;
    var wallA = N, wallB = N + 1;       // virtual nodes: start wall, far wall
    var dsu = makeDSU(N + 2);
    for (var r = 0; r < SZ; r++) {
      for (var c = 0; c < SZ; c++) {
        var i = idx(r, c, SZ);
        if (board[i] !== who) continue;
        // attach to the owner's two walls
        if (who === 'X') {
          if (r === 0) dsu.union(i, wallA);            // top
          if (r === SZ - 1) dsu.union(i, wallB);       // bottom
        } else { // 'O'
          if (c === 0) dsu.union(i, wallA);            // left
          if (c === SZ - 1) dsu.union(i, wallB);       // right
        }
        // union same-colour neighbours (each undirected edge seen twice — fine)
        for (var d = 0; d < NB.length; d++) {
          var nr = r + NB[d][0], nc = c + NB[d][1];
          if (nr < 0 || nr >= SZ || nc < 0 || nc >= SZ) continue;
          var ni = idx(nr, nc, SZ);
          if (board[ni] === who) dsu.union(i, ni);
        }
      }
    }
    return { dsu: dsu, wallA: wallA, wallB: wallB };
  }

  // Does `who` connect their two walls on this board under adjacency NB?
  function spans(board, SZ, who, NB) {
    var u = buildUnion(board, SZ, who, NB);
    return u.dsu.find(u.wallA) === u.dsu.find(u.wallB);
  }

  // The connected component of `who` that touches BOTH walls — the cells to GLOW.
  // Returns a flat array of cell indices (in row-major order), or [] if `who`
  // does not span. A random fill may contain several spanning chains; this
  // returns every cell in the wall-A∪wall-B component (one valid witness set).
  function spanComponent(board, SZ, who, NB) {
    var u = buildUnion(board, SZ, who, NB);
    if (u.dsu.find(u.wallA) !== u.dsu.find(u.wallB)) return [];
    var root = u.dsu.find(u.wallA), N = SZ * SZ, out = [];
    for (var i = 0; i < N; i++) {
      if (board[i] === who && u.dsu.find(i) === root) out.push(i);
    }
    return out;
  }

  // { x:bool, o:bool } — runs spans for both colours.
  function classify(board, SZ, NB) {
    return { x: spans(board, SZ, 'X', NB), o: spans(board, SZ, 'O', NB) };
  }

  // Coin-flip 'X'/'O' into a board (rng()<0.5). Used by both the live fill
  // (Math.random) and the seeded self-test battery (an LCG). Mutates board.
  function randomFill(board, SZ, rng) {
    var N = SZ * SZ;
    for (var i = 0; i < N; i++) board[i] = rng() < 0.5 ? 'X' : 'O';
    return board;
  }

  // Run `trials` seeded coin-flip fills and tally outcomes. Seeded LCG so the
  // page chip and the Node twin agree bit-for-bit.
  //   ties = neither colour spans (a DRAW — only ever nonzero on SQ_NB)
  //   both = both colours span (only ever nonzero on SQ_NB)
  function battery(SZ, NB, trials, seed) {
    var s = (seed >>> 0) || 1;
    function rng() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    var N = SZ * SZ, board = new Array(N);
    var ties = 0, x = 0, o = 0, both = 0;
    for (var t = 0; t < trials; t++) {
      randomFill(board, SZ, rng);
      var cl = classify(board, SZ, NB);
      if (cl.x && cl.o) both++;
      if (cl.x) x++;
      if (cl.o) o++;
      if (!cl.x && !cl.o) ties++;
    }
    return { trials: trials, ties: ties, x: x, o: o, both: both };
  }

  var HexFill = {
    HEX_NB: HEX_NB,
    SQ_NB: SQ_NB,
    makeDSU: makeDSU,
    spans: spans,
    spanComponent: spanComponent,
    classify: classify,
    randomFill: randomFill,
    battery: battery
  };

  if (root) root.HexFill = HexFill;
  if (typeof module !== 'undefined' && module.exports) { module.exports = HexFill; }
})(typeof window !== 'undefined' ? window : globalThis);
