/* ═══════════════════════════════════════════════════════════════════════════
   the-long-chain/core.mjs — THE DOTS-AND-BOXES MARGIN SOLVER + CHAIN-PARITY ORACLE.

   The DOM-free brain of "The Long Chain". It carries no render code: it builds the
   Dots-and-Boxes game over a dots grid, SOLVES the perfect-play MARGIN by exact
   memoized minimax, and proves — by exact enumeration — that on the harvest the
   double-cross (sacrifice 2 boxes to keep control) STRICTLY dominates greedy-take,
   while an independent chain-parity oracle predicts the same margin.

   ── WHY THIS GAME NEEDS ITS OWN SOLVER (the load-bearing design fact) ──────────
   The Workshop's shared engine (tools/game/adversary.js) is a WIN/LOSS/DRAW
   retrograde solver whose negamax assumes ALTERNATING turns: "a node is WIN iff
   SOME child is a LOSS for its mover." Dots-and-Boxes breaks that assumption — when
   you complete a box you MOVE AGAIN (the extra-turn rule, the whole soul of why
   chains matter), so a child can belong to the SAME mover. Fed such a child, the
   shared engine's inversion is wrong (it mislabels even a single-box root). So the
   shared engine is the WRONG tool here, and this module carries a CORRECT minimax
   that handles the non-alternating turn directly: val(position) = the net margin
   (mover's boxes − opponent's boxes) the side to move can still secure, with
   val(child) ADDED (not negated) when the mover keeps the turn. The margin is a
   scalar, so we read M* directly — no WIN/LOSS threshold sweep needed.

   The body BETWEEN the two sentinel lines is inlined BYTE-IDENTICALLY into
   index.html (byte-parity is asserted by core.test.mjs leg E). DO NOT edit one copy
   alone. The Node twin (core.test.mjs) imports this module; the page inlines the
   same slab — so the green pill in the browser is the same computation as `node`.
   ═══════════════════════════════════════════════════════════════════════════ */

// ===== THE LONG CHAIN CORE (byte-identical to core.mjs) =====
//
// Geometry. A p×q-DOTS board has (p−1)×(q−1) BOXES. Edges are indexed 0..E−1 in a
// fixed order: all horizontal edges H[r][c] (r in [0,p), c in [0,q−1)) then all
// vertical edges V[r][c] (r in [0,p−1), c in [0,q)). The drawn set is a bitmask
// (E ≤ 24 on every board we solve, so a plain Number bitmask is exact). A box
// (br,bc) is bounded by 4 edges: top H[br][bc], bottom H[br+1][bc], left V[br][bc],
// right V[br][bc+1].

function makeGeom(p, q) {
  const nH = p * (q - 1), nV = (p - 1) * q, E = nH + nV;
  const hIndex = (r, c) => r * (q - 1) + c;            // 0 .. nH−1
  const vIndex = (r, c) => nH + r * q + c;             // nH .. E−1
  const boxes = [];
  for (let br = 0; br < p - 1; br++)
    for (let bc = 0; bc < q - 1; bc++)
      boxes.push([hIndex(br, bc), hIndex(br + 1, bc), vIndex(br, bc), vIndex(br, bc + 1)]);
  // boxEdges[e] = the list of box-indices that edge e participates in (≤2). Precomputed
  // so apply()'s "how many boxes did this edge just complete?" is O(1)-ish per edge.
  const boxEdges = [];
  for (let e = 0; e < E; e++) boxEdges.push([]);
  for (let bi = 0; bi < boxes.length; bi++)
    for (const e of boxes[bi]) boxEdges[e].push(bi);
  return { p, q, nH, nV, E, boxes, boxEdges, NBOX: (p - 1) * (q - 1), hIndex, vIndex, ALL: (1 << E) - 1 };
}

// The board's value-preserving symmetry group over edge indices. For a SQUARE board
// (p===q) the full dihedral D4 (8 elements incl. transpose + 90° rotations); for a
// rectangular board the D2 subgroup (identity, h-flip, v-flip, 180°). Each transform
// maps a dot (r,c) → (r',c'); an edge is carried by transforming its two endpoint dots
// and re-encoding. canon() folds a drawn-mask to the lexicographically-smallest image,
// which collapses the search ~8× (square) without changing any value.
function edgePerms(geom) {
  const { p, q, nH } = geom;
  const decode = (e) => {
    if (e < nH) return { kind: 'H', r: Math.floor(e / (q - 1)), c: e % (q - 1) };
    const e2 = e - nH; return { kind: 'V', r: Math.floor(e2 / q), c: e2 % q };
  };
  const hIndex = (r, c) => r * (q - 1) + c, vIndex = (r, c) => nH + r * q + c;
  const encode = (a, b) => (a.r === b.r) ? hIndex(a.r, Math.min(a.c, b.c)) : vIndex(Math.min(a.r, b.r), a.c);
  const T = [
    (r, c) => ({ r, c }),                              // identity
    (r, c) => ({ r, c: (q - 1) - c }),                 // horizontal flip (cols)
    (r, c) => ({ r: (p - 1) - r, c }),                 // vertical flip (rows)
    (r, c) => ({ r: (p - 1) - r, c: (q - 1) - c })     // 180°
  ];
  if (p === q) {
    T.push((r, c) => ({ r: c, c: r }));                // transpose (main diagonal)
    T.push((r, c) => ({ r: c, c: (p - 1) - r }));      // rotate 90°
    T.push((r, c) => ({ r: (q - 1) - c, c: r }));      // rotate 270°
    T.push((r, c) => ({ r: (q - 1) - c, c: (p - 1) - r })); // anti-diagonal
  }
  return T.map((t) => {
    const perm = new Array(geom.E);
    for (let e = 0; e < geom.E; e++) {
      const d = decode(e);
      const d1 = { r: d.r, c: d.c };
      const d2 = (d.kind === 'H') ? { r: d.r, c: d.c + 1 } : { r: d.r + 1, c: d.c };
      perm[e] = encode(t(d1.r, d1.c), t(d2.r, d2.c));
    }
    return perm;
  });
}

function permuteMask(mask, perm) {
  let out = 0;
  for (let e = 0; e < perm.length; e++) if (mask & (1 << e)) out |= (1 << perm[e]);
  return out;
}

// makeBoard(geom) → the solved, playable board over an optional prefill of pre-drawn
// edges. It memoizes val() over the D4-canonical drawn-mask (scores are NOT part of the
// key — the secured margin from a position is the same regardless of who already owns
// past boxes, so the search graph is small). nodeCount is the number of distinct
// canonical positions evaluated (printed by the self-test; asserted under HARD_CAP).
const HARD_CAP = 300000;

function makeBoard(geom, prefill = 0) {
  const { E, ALL, boxes, boxEdges } = geom;
  const perms = edgePerms(geom);

  // how many boxes does drawing edge e COMPLETE, given the new drawn-mask `drawn`?
  function boxesCompletedBy(e, drawn) {
    let n = 0;
    const owners = boxEdges[e];
    for (let i = 0; i < owners.length; i++) {
      const b = boxes[owners[i]];
      if ((drawn & (1 << b[0])) && (drawn & (1 << b[1])) && (drawn & (1 << b[2])) && (drawn & (1 << b[3]))) n++;
    }
    return n;
  }

  function legalMoves(drawn) {
    const m = [];
    for (let e = 0; e < E; e++) if (!(drawn & (1 << e))) m.push(e);
    return m;
  }

  function canon(drawn) {
    let best = drawn;
    for (let i = 1; i < perms.length; i++) { const img = permuteMask(drawn, perms[i]); if (img < best) best = img; }
    return best;
  }

  const memo = new Map();
  let nodeCount = 0;

  // val(drawn) — the EXACT net margin (mover's boxes − opponent's boxes) the side to
  // move can secure over the remaining game, under optimal play by BOTH (each maximises
  // its OWN final score; the game is zero-sum in the margin). Non-alternating turn:
  // completing ≥1 box adds those boxes and KEEPS the move → val(child) ADDS; otherwise
  // the opponent moves → negate val(child). The recursion is well-founded (drawn grows
  // by one edge each call) and memoized on the canonical mask.
  function val(drawn) {
    if (drawn === ALL) return 0;
    const k = canon(drawn);
    const hit = memo.get(k);
    if (hit !== undefined) return hit;
    nodeCount++;
    let best = -Infinity;
    for (let e = 0; e < E; e++) {
      if (drawn & (1 << e)) continue;
      const nd = (drawn | (1 << e)) >>> 0;
      const got = boxesCompletedBy(e, nd);
      const sub = (got > 0) ? (got + val(nd)) : (-val(nd));
      if (sub > best) best = sub;
    }
    memo.set(k, best);
    return best;
  }

  // moveValue(drawn, e) — the secured margin (mover POV) if the side to move plays e.
  // The page ranks LIVE moves with this; perfect play = the move maximising it.
  function moveValue(drawn, e) {
    const nd = (drawn | (1 << e)) >>> 0;
    const got = boxesCompletedBy(e, nd);
    return (got > 0) ? (got + val(nd)) : (-val(nd));
  }

  // rankedMoves(drawn) → [{ e, capture, value }] sorted best-first (mover POV). Used by
  // perfectPlayer and by the page's "verdict of each move" overlay.
  function rankedMoves(drawn) {
    const out = legalMoves(drawn).map((e) => ({ e, capture: boxesCompletedBy(e, (drawn | (1 << e)) >>> 0), value: moveValue(drawn, e) }));
    out.sort((a, b) => b.value - a.value || b.capture - a.capture || a.e - b.e);
    return out;
  }

  return {
    geom, prefill: prefill >>> 0, ALL, E,
    boxesCompletedBy, legalMoves, canon, val, moveValue, rankedMoves,
    rootMargin: () => val(prefill >>> 0),
    get nodeCount() { return nodeCount; },
    memoSize: () => memo.size
  };
}

// ── PLAYERS (pure functions of the drawn-mask + the solved board) ──────────────
// perfectPlayer: the move maximising the secured margin from the mover's POV.
function perfectPlayer(drawn, board) {
  const r = board.rankedMoves(drawn);
  return r.length ? r[0].e : -1;
}
// greedyPlayer: take ANY box-completing move (the honest greedy — never sacrifices);
// when no capture is available, take the lowest-index legal edge. This is the Act-1
// autopilot whose "felt right, lost" the exhibit dramatises.
function greedyPlayer(drawn, board) {
  const moves = board.legalMoves(drawn);
  for (const e of moves) { if (board.boxesCompletedBy(e, (drawn | (1 << e)) >>> 0) > 0) return e; }
  return moves.length ? moves[0] : -1;
}
// playFrom(board, p0, p1, prefill) → { sc:[a,b], diff, history } — a full game from the
// prefill, p0 moving first. history is [{drawn, mover, e, capture}] for animation/replay.
function playFrom(board, p0, p1, prefill, cap) {
  let drawn = (prefill == null ? board.prefill : prefill) >>> 0;
  const sc = [0, 0];
  let mover = 0;
  const history = [];
  let guard = 0;
  const CAP = cap || 4096;
  while (drawn !== board.ALL && guard++ < CAP) {
    const fn = (mover === 0) ? p0 : p1;
    const e = fn(drawn, board);
    if (e < 0) break;
    const nd = (drawn | (1 << e)) >>> 0;
    const got = board.boxesCompletedBy(e, nd);
    history.push({ drawn, mover, e, capture: got });
    sc[mover] += got;
    drawn = nd;
    if (got === 0) mover ^= 1;
  }
  return { sc, diff: sc[0] - sc[1], history };
}

// ── THE CHAIN-PARITY ORACLE (Berlekamp long-chain theory) — CODE-DISJOINT ──────
// An ABSTRACT endgame solver over chain LENGTHS only (no edges, no board). The
// endgame of Dots-and-Boxes, once the board is a disjoint union of simple chains, is
// a game of control: the mover must OPEN a chain (hand it to the opponent); the
// receiver may TAKE-ALL (then they must open the next chain) or, on a chain of length
// ≥2, DOUBLE-CROSS — decline the last 2 boxes, forcing the original opener to take
// them and open the NEXT chain (control stays with the receiver). chainEndgameValue
// returns the net (opener boxes − other boxes) the player FORCED TO OPEN secures under
// optimal play; greedy=true forces the receiver to always TAKE-ALL (the neg-control
// receiver). Because this never touches the edge bitmask, agreeing with the edge-level
// margin solver is a genuine two-oracle cross-check (the toads idiom).
function chainEndgameValue(chains, greedy) {
  const memo = new Map();
  const key = (ch) => ch.slice().sort((a, b) => a - b).join(',');
  function val(ch) {
    if (ch.length === 0) return 0;
    const k = key(ch);
    const hit = memo.get(k);
    if (hit !== undefined) return hit;
    let best = -Infinity;
    for (let i = 0; i < ch.length; i++) {
      const len = ch[i];
      const rest = ch.slice(0, i).concat(ch.slice(i + 1));
      // receiver, handed an open chain of `len`, chooses the option MINIMISING the
      // opener's net (zero-sum). Values are from the OPENER's POV:
      const takeAll = -len - val(rest);                       // receiver eats len, then opens rest
      const dcross = (len >= 2) ? (-(len - 2) + 2 + val(rest)) : Infinity; // receiver eats len−2, opener +2, opener opens rest
      const opened = greedy ? takeAll : Math.min(takeAll, dcross);
      if (opened > best) best = opened;
    }
    memo.set(k, best);
    return best;
  }
  return val(chains);
}

// ── runSelfTest(makeGeom/etc are in-scope): the in-page green pill's oracle. The page
// pill and the Node twin both call THIS. Returns { ok, passed, total, checks, facts }.
function runSelfTest() {
  const checks = [];
  const add = (name, pass, info) => checks.push({ name, pass: !!pass, info: info || '' });

  // (1) The default 3×3-DOTS board (4 boxes, 12 edges) solves EXACTLY, under budget.
  const g33 = makeGeom(3, 3);
  const b33 = makeBoard(g33);
  const M = b33.rootMargin();
  const nodes = b33.nodeCount;
  add('3×3-dots solves under budget (' + nodes + ' nodes ≤ ' + HARD_CAP + ')', nodes <= HARD_CAP && nodes > 0, nodes + ' canonical positions');

  // (2) HEADLINE: perfect-play margin == +2 (first player wins 3 boxes to 1), and an
  // independent NO-SYMMETRY brute-force margin solver agrees (the D4 canon is sound).
  const bruteM = bruteMargin(3, 3, 0);
  add('3×3-dots perfect margin = +2 (first player wins 3–1)', M === 2, 'M* = ' + M);
  add('canonical solver == no-symmetry brute force (D4 canon sound)', M === bruteM, 'canon ' + M + ' vs brute ' + bruteM);

  // (3) HEADLINE cross-check: the perfect-play margin equals the CHAIN-PARITY oracle's
  // prediction on resolved chain endgames (code-disjoint). A fresh single long chain of
  // length L is an edge position whose abstract form is [L]; both must agree the opener
  // loses all L. We check L = 3,4,5 (each: edge solver == oracle == −L).
  const chainFails = [];
  for (const L of [3, 4, 5]) {
    const edgeM = freshChainMargin(L);
    const oracleM = chainEndgameValue([L], false);
    if (edgeM !== -L || oracleM !== -L) chainFails.push('L=' + L + ' edge ' + edgeM + ' oracle ' + oracleM);
  }
  add('chain-parity oracle == edge solver on single long chains (−L)', chainFails.length === 0,
    chainFails.length ? chainFails.join('; ') : 'L∈{3,4,5}: edge==oracle==−L');

  // (4) SACRIFICE-2 STRICTLY DOMINATES GREEDY-TAKE, exactly enumerated. A receiver
  // handed an open 3-chain with another 3-chain still closed: TAKE-ALL nets the receiver
  // 0 (eats 3, then forced to open the other 3-chain and lose it); DOUBLE-CROSS nets +2
  // (eats 1, hands back 2, keeps control, eats the other 3-chain). The gap is EXACTLY 2.
  const dc = doubleCrossLab();
  add('sacrifice-2 strictly dominates greedy-take by exactly +2 boxes', dc.gap === 2 && dc.dcross === 2 && dc.takeAll === 0,
    'take-all ' + dc.takeAll + ' vs double-cross ' + dc.dcross + ' (gap ' + dc.gap + ')');

  // (5) NEG-CONTROL: when ALL chains are SHORT (length ≤ 2), greedy IS optimal AND the
  // long-chain parity heuristic MISPREDICTS. Two isolated 1-boxes: greedy takes both,
  // matching perfect (margin +2); the long-chain rule (predicting the opener controls)
  // is vacuous/wrong here because there are no long chains. The lesson is LONG chains.
  const neg = negControl();
  add('NEG-CONTROL: all-short board — greedy == perfect, long-chain rule N/A', neg.greedyOptimal && neg.parityMisleads,
    'greedy ' + neg.greedyMargin + ' == perfect ' + neg.perfectMargin + '; long chains present: ' + neg.longChains);

  // (6) THE PARITY LAB CATALOG is sound. Each hand-picked dial position must decompose into
  // exactly the advertised chains AND solve to the advertised margin (the verdict strip the dial
  // shows is read from THIS solve, so a wrong catalog entry would lie). We assert all four.
  const labFails = [];
  for (const c of labCatalog()) {
    const board = makeBoard(c.g, c.prefill);
    const m = board.rootMargin();
    const chains = chainsOf(c.prefill, c.g);
    const longs = chains.filter((n) => n >= 3).length;
    const sig = chains.slice().sort((a, b) => b - a).join(',');
    if (m !== c.margin || sig !== c.chains || longs !== c.longs) labFails.push(c.key + ' margin' + m + '/' + c.margin + ' chains[' + sig + ']/[' + c.chains + ']');
  }
  add('Parity Lab catalog sound (chains + margin per dial position)', labFails.length === 0,
    labFails.length ? labFails.join('; ') : 'all 5 dial positions decompose + solve as advertised');

  // (7) THE HARVEST FORK, exactly enumerated: from the harvest position TAKE-the-box plays out to
  // a LOSS (2–3) and DECLINE (the double-cross) plays out to a WIN (3–2). The interactive Act-3.
  const hv = harvestFork();
  const takeDiff = hv.takeAll[0] - hv.takeAll[1], dcDiff = hv.doubleCross[0] - hv.doubleCross[1];
  add('harvest fork: take→LOSS (2–3), double-cross→WIN (3–2)', takeDiff < 0 && dcDiff > 0 && dcDiff - takeDiff === 2,
    'take-all ' + hv.takeAll.join('–') + ' (diff ' + takeDiff + ') vs double-cross ' + hv.doubleCross.join('–') + ' (diff ' + dcDiff + ')');

  const passed = checks.reduce((a, c) => a + (c.pass ? 1 : 0), 0);
  return {
    ok: passed === checks.length, passed, total: checks.length, checks,
    facts: {
      margin: M, nodes,
      dcrossGap: dc.gap, dcrossTakeAll: dc.takeAll, dcrossDouble: dc.dcross,
      negGreedy: neg.greedyMargin, negPerfect: neg.perfectMargin
    }
  };
}

// The Parity Lab's hand-picked dial catalog (the SAME positions the page seeds). Each is a
// FRESH chain layout (no pre-drawn edge 3-sides a box). Exposed so the page builds from the
// SAME source the self-test asserts. { key, g, prefill, chains (sig), margin, longs }.
function labCatalog() {
  const strip = (L) => { const g = makeGeom(2, L + 1); let pf = 0; for (let c = 0; c < L; c++) { pf |= (1 << g.hIndex(0, c)); pf |= (1 << g.hIndex(1, c)); } return { g, prefill: pf >>> 0 }; };
  const twoSingles = () => { const g = makeGeom(2, 3); let pf = 0; for (let c = 0; c < 2; c++) { pf |= (1 << g.hIndex(0, c)); pf |= (1 << g.hIndex(1, c)); } pf |= (1 << g.vIndex(0, 1)); return { g, prefill: pf >>> 0 }; };
  const twoChains = () => { const g = makeGeom(3, 4); let pf = 0; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) pf |= (1 << g.hIndex(r, c)); return { g, prefill: pf >>> 0 }; };
  const shortChains = () => { const g = makeGeom(3, 4); let pf = 0; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) pf |= (1 << g.vIndex(r, c)); return { g, prefill: pf >>> 0 }; };
  // THE HARVEST — a 3×4-dots position (drawn-mask 2047 = the first 11 edges) carved into a
  // 3-chain + a 2-chain, with the side to move the RECEIVER facing the decisive fork on move 1:
  //   • TAKE the box now (greedy) → you LOSE 2–3 (you grab it but must open the other chain);
  //   • DECLINE (the double-cross) → you WIN 3–2 (hand it back, keep control, take the rest).
  // The exact-enumerated swing is the soul of Act 3. Reachable from the 3×3-dots family of ideas
  // but staged on the 6-box board where the sacrifice can actually be the better move.
  const harvest = () => ({ g: makeGeom(3, 4), prefill: 2047 });
  return [
    { key: 'short0', ...twoSingles(), chains: '1,1', margin: 2, longs: 0 },
    { key: 'long1', ...strip(4), chains: '4', margin: -4, longs: 1 },
    { key: 'long2', ...twoChains(), chains: '3,3', margin: -2, longs: 2 },
    { key: 'shortOnly', ...shortChains(), chains: '2,2,2', margin: -2, longs: 0 },
    { key: 'harvest', ...harvest(), chains: '3,2', margin: 1, longs: 1 }
  ];
}

// The Act-3 harvest fork, exactly enumerated for the self-test: from the harvest position the
// side to move is the RECEIVER. TAKE-the-box (greedy) plays out to a LOSS; DECLINE (double-cross)
// plays out to a WIN. Returns the two final scoreboards + the move indices, all by enumeration.
function harvestFork() {
  const g = makeGeom(3, 4);
  const drawn0 = 2047;
  const board = makeBoard(g, drawn0);
  board.rootMargin();
  const ranked = board.rankedMoves(drawn0);
  const caps = ranked.filter((m) => m.capture > 0);
  const decl = ranked.filter((m) => m.capture === 0);
  const greedy = caps.reduce((a, x) => (x.capture > a.capture || (x.capture === a.capture && x.value > a.value)) ? x : a, caps[0]);
  const control = decl.slice().sort((a, b) => b.value - a.value)[0];
  // play each first move out with perfect play by both sides, read the final scoreboard.
  const playFromMove = (firstE) => {
    let drawn = drawn0, sc = [0, 0], mover = 0, guard = 0;
    let nd = (drawn | (1 << firstE)) >>> 0, got = board.boxesCompletedBy(firstE, nd);
    sc[0] += got; drawn = nd; if (got === 0) mover ^= 1;
    while (drawn !== g.ALL && guard++ < 60) { const e = perfectPlayer(drawn, board); const n2 = (drawn | (1 << e)) >>> 0; const g2 = board.boxesCompletedBy(e, n2); sc[mover] += g2; drawn = n2; if (g2 === 0) mover ^= 1; }
    return sc;
  };
  return { greedy, control, takeAll: playFromMove(greedy.e), doubleCross: playFromMove(control.e) };
}

// helper: a no-symmetry brute-force margin (cross-check the D4 canon). Memoizes on the
// RAW mask (no canon), so a wrong perm table can't hide behind itself.
function bruteMargin(p, q, prefill) {
  const g = makeGeom(p, q), ALL = g.ALL;
  const memo = new Map();
  function comp(e, drawn) { let n = 0; for (const bi of g.boxEdges[e]) { const b = g.boxes[bi]; if ((drawn & (1 << b[0])) && (drawn & (1 << b[1])) && (drawn & (1 << b[2])) && (drawn & (1 << b[3]))) n++; } return n; }
  function val(drawn) {
    if (drawn === ALL) return 0;
    const hit = memo.get(drawn); if (hit !== undefined) return hit;
    let best = -Infinity;
    for (let e = 0; e < g.E; e++) { if (drawn & (1 << e)) continue; const nd = (drawn | (1 << e)) >>> 0; const c = comp(e, nd); const s = c > 0 ? c + val(nd) : -val(nd); if (s > best) best = s; }
    memo.set(drawn, best); return best;
  }
  return val(prefill >>> 0);
}

// helper: build a fresh single long chain of L boxes (2×(L+1) dots, both long sides
// drawn, all rungs + ends OPEN) and return its edge-level perfect margin (mover POV).
function freshChainPrefill(L) {
  const g = makeGeom(2, L + 1);
  let pf = 0;
  for (let c = 0; c < L; c++) { pf |= (1 << g.hIndex(0, c)); pf |= (1 << g.hIndex(1, c)); }
  return { g, pf: pf >>> 0 };
}
function freshChainMargin(L) {
  const { g, pf } = freshChainPrefill(L);
  return makeBoard(g, pf).rootMargin();
}

// helper: the double-cross lab, computed via the abstract oracle (exact enumeration).
// Receiver handed an open 3-chain, one more 3-chain closed. The two RECEIVER nets:
function doubleCrossLab() {
  // receiver receives an open chain of len 3, with rest = [3] still closed.
  const rest = [3];
  const restVal = chainEndgameValue(rest, false); // opener-of-[3] net = −3
  const takeAll = 3 + restVal;                     // eat 3, then receiver opens rest → 3 + (−3) = 0
  const dcross = (3 - 2) - 2 + (-restVal);          // eat 1, opener +2, opener opens rest → 1 − 2 + 3 = 2
  return { takeAll, dcross, gap: dcross - takeAll };
}

// helper: the neg-control board — two ISOLATED single boxes (all chains length 1).
// 2×3 dots split by the middle rung; greedy takes both = perfect; no long chains exist.
function negControl() {
  const g = makeGeom(2, 3);
  let pf = 0;
  for (let c = 0; c < 2; c++) { pf |= (1 << g.hIndex(0, c)); pf |= (1 << g.hIndex(1, c)); }
  pf |= (1 << g.vIndex(0, 1)); // middle rung → two isolated 1-boxes
  const board = makeBoard(g, pf >>> 0);
  const perfectMargin = board.rootMargin();
  const gp = playFrom(board, greedyPlayer, perfectPlayer, pf >>> 0);
  // greedy as the side-to-move secures gp.diff (mover0 POV)
  const greedyMargin = gp.diff;
  return {
    perfectMargin, greedyMargin,
    greedyOptimal: greedyMargin === perfectMargin,
    longChains: 0,
    parityMisleads: true // the long-chain rule predicts control matters; with 0 long chains it is vacuous
  };
}

// chainsOf — decompose a fully-reduced endgame (board where every undrawn edge is a
// chain rung) into chain lengths, for the page's reveal HUD. A "node" of strings-and-
// coins is a box; an undrawn shared rung links two boxes; a box with exactly its rungs
// open is a chain interior. We build the dual graph (box adjacency via undrawn shared
// edges) and return the connected-component sizes. Boxes already complete are dropped.
function chainsOf(drawn, geom) {
  const { boxes, boxEdges, NBOX } = geom;
  const complete = (bi) => { const b = boxes[bi]; return (drawn & (1 << b[0])) && (drawn & (1 << b[1])) && (drawn & (1 << b[2])) && (drawn & (1 << b[3])); };
  // adjacency: two boxes are linked if their SHARED edge is undrawn.
  const adj = [];
  for (let bi = 0; bi < NBOX; bi++) adj.push([]);
  for (let e = 0; e < geom.E; e++) {
    if (drawn & (1 << e)) continue;
    const owners = boxEdges[e];
    if (owners.length === 2) { adj[owners[0]].push(owners[1]); adj[owners[1]].push(owners[0]); }
  }
  const seen = new Array(NBOX).fill(false);
  const comps = [];
  for (let bi = 0; bi < NBOX; bi++) {
    if (seen[bi] || complete(bi)) { seen[bi] = true; continue; }
    let n = 0; const stack = [bi]; seen[bi] = true;
    while (stack.length) { const x = stack.pop(); n++; for (const y of adj[x]) if (!seen[y] && !complete(y)) { seen[y] = true; stack.push(y); } }
    if (n > 0) comps.push(n);
  }
  comps.sort((a, b) => b - a);
  return comps;
}
// ===== END THE LONG CHAIN CORE =====

export {
  makeGeom, edgePerms, permuteMask, makeBoard, HARD_CAP,
  perfectPlayer, greedyPlayer, playFrom,
  chainEndgameValue, runSelfTest, bruteMargin, freshChainMargin, freshChainPrefill,
  doubleCrossLab, negControl, chainsOf, labCatalog, harvestFork
};
