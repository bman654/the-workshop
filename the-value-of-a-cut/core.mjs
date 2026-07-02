// The Value of a Cut — logic core (Blue-Red Hackenbush). Two INDEPENDENT, code-disjoint authorities:
//
//   • value(edges) → an EXACT dyadic rational {num:BigInt, den:BigInt=2^k}, built by Conway's recursive
//                    SIMPLEST-NUMBER rule  value(G) = { max Left-option | min Right-option }  summed over
//                    ground-rooted components. Integer BigInt numerator over a power-of-two BigInt
//                    denominator — NO float anywhere. Blue-Red positions are ALWAYS numbers. This is the
//                    "what is the position worth" authority the page's HERO PLATE reads.
//                    GUARD: value() throws if the board contains a GREEN edge (green ⇒ a nimber, not a
//                    number; asking value() for a number where none exists would be a lie).
//
//   • outcome(edges) → 'L' | 'R' | 'N' | 'P', from a PURE-BOOLEAN negamax (leftWins / rightWins) that
//                    imports NOTHING from the value algebra. This is the sole WHO-WINS authority the page
//                    reads. For a Blue-Red board it always lands in {L,R,P} (never N — a number is never
//                    fuzzy); for a GREEN board it may be N, and that is the whole point of the neg-control.
//
// CONVENTION (load-bearing — honoured across shapes, narration, core and fixtures):
//   Left = Blue = POSITIVE.  A +½ stalk is a BLUE edge grounded on the earth with a RED edge on top of it
//   (the Colon reads the stalk root→sky as the binary fraction 0.1 = ½). "a blue edge on a red = +½" is
//   loose shorthand; the ACTUAL construction is blue-grounded, red-on-top. Deeper the ladder goes, the
//   smaller the dyadic: b·r → +½, b·r·r → +¼, b·r·r·r → +⅛ … (the Colon Principle).
//
// SOURCING (anti-drift): the page inlines this core BYTE-FOR-BYTE between the VALUE-OF-A-CUT CORE
// sentinels; core.test.mjs byte-parity-checks the inlined copy in index.html against this body. The
// xorshift32 PRNG (makeRng) is consumed only by the self-test sweeps so the page and the Node twin agree
// bit-for-bit. Zero-dependency, DOM-free ESM.

// ===== VALUE-OF-A-CUT CORE (byte-identical to core.mjs) =====
"use strict";

// A deterministic, seedable PRNG (xorshift32) so the Node twin and the page agree bit-for-bit.
// seed === 0 is reseeded to the golden-ratio constant (xorshift32 is stuck at 0 otherwise).
function makeRng(seed){
  let s = seed >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return function(){
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;   // [0, 1)
  };
}

// ── EXACT DYADIC RATIONALS as { num:BigInt, den:BigInt } with den a power of two ────────────────────
// No float ever touches a value. reduce() strips common factors of two so den stays a power of two and
// the pair is the unique lowest-terms dyadic. den is ALWAYS positive; the sign lives entirely in num.
const B0 = 0n, B1 = 1n, B2 = 2n;
function reduceDy(num, den){
  if (den <= 0n) throw new Error("dyadic denominator must be positive");
  if (num === 0n) return { num: 0n, den: 1n };
  // den is a power of two by construction; strip shared factors of two.
  while ((num % B2) === 0n && (den % B2) === 0n){ num /= B2; den /= B2; }
  return { num, den };
}
const DY = (num, den = 1n) => reduceDy(BigInt(num), BigInt(den));
function dyAdd(a, b){ return reduceDy(a.num * b.den + b.num * a.den, a.den * b.den); }
function dyCmp(a, b){ const d = a.num * b.den - b.num * a.den; return d < 0n ? -1 : d > 0n ? 1 : 0; }
function dyEq(a, b){ return dyCmp(a, b) === 0; }
function dyNeg(a){ return { num: -a.num, den: a.den }; }
function dySign(a){ return a.num < 0n ? -1 : a.num > 0n ? 1 : 0; }
// floor(a) and ceil(a) as BigInt integers (den a positive power of two).
function dyFloor(a){ let q = a.num / a.den; if (a.num < 0n && q * a.den !== a.num) q -= 1n; return q; }
function dyCeil(a){ let q = a.num / a.den; if (a.num > 0n && q * a.den !== a.num) q += 1n; return q; }

// simplestBetween(L, Rhi): the UNIQUE dyadic of least birthday strictly between L and Rhi (L < Rhi) —
// Conway's simplicity rule for combining a game's options into its number value.
//   • if an integer lies in (L, Rhi), the one of smallest |n| is simplest;
//   • else the interval sits strictly between two consecutive integers n and n+1, and the simplest dyadic
//     is found by bisection: the shortest a/2^k in (L, Rhi) — halve the step until one lands.
// PURE BigInt; no float, no arbitrary depth cap that could silently truncate (a Blue-Red forest of E
// edges has denominator ≤ 2^E, so k never exceeds the edge count).
function simplestBetween(L, Rhi){
  if (dyCmp(L, Rhi) >= 0) throw new Error("simplestBetween needs L < Rhi");
  // integer of smallest absolute value in the open interval (L, Rhi)?
  const lo = dyFloor(L) + 1n;       // smallest integer > L
  const hi = dyCeil(Rhi) - 1n;      // largest integer < Rhi
  if (lo <= hi){
    // some integer is strictly between; pick the one nearest 0 (smallest birthday).
    let best;
    if (lo <= 0n && 0n <= hi) best = 0n;
    else if (hi < 0n) best = hi;    // whole interval negative → the one closest to 0 is the largest
    else best = lo;                 // whole interval positive → the one closest to 0 is the smallest
    return DY(best, 1n);
  }
  // no integer between → interval lies strictly inside (n, n+1) for n = floor(L). Bisect dyadics.
  const n = dyFloor(L);             // == dyFloor(Rhi) here
  let den = B2;                     // denominators 2, 4, 8, …
  for (;;){
    // candidate numerators: n + j/den for j in 1..den-1, scanned so the LOWEST-birthday (fewest halvings)
    // odd numerator wins first — but at each fixed den we only need to test ODD j (even j reduces to a
    // coarser den already tried). The first hit at the smallest den is the simplest.
    for (let j = 1n; j < den; j += 2n){
      const c = reduceDy(n * den + j, den);
      if (dyCmp(L, c) < 0 && dyCmp(c, Rhi) < 0) return c;
    }
    den *= B2;
    if (den > (B1 << 64n)) throw new Error("simplestBetween: denominator exceeded 2^64 (should be impossible for a finite forest)");
  }
}

// closedFormStalk(colors): the CLOSED-FORM dyadic value of a single stalk grounded on the earth, given
// its edge colours from the EARTH upward as an array of 'b'|'r' (blue|red). Independent of value() — this
// is the Colon Principle written as a direct sign-expansion, the second authority for the stalk sweep.
//   Read root→sky: the FIRST (grounded) edge is the integer's leading run; each same-colour edge extends
//   the integer part, and the first colour CHANGE begins the fractional binary expansion. Formally, the
//   sign-expansion of a Hackenbush stalk value is: blue=+, red=−; the value is
//     sum over positions i (1-based from the earth) of  s_i · 2^(1 - m_i)
//   where the classic algorithm is: while the leading edges share the ground colour they count ±1 each
//   (the integer part); after the first sign change every subsequent edge contributes ±2^-k with k
//   incrementing. We implement the standard "sign-expansion → number" fold with exact dyadics.
function closedFormStalk(colors){
  if (colors.length === 0) return DY(0);
  // signs from the earth upward: blue = +1, red = −1
  const s = colors.map(c => c === 'b' ? 1 : -1);
  // integer part: the maximal leading run of the ground sign.
  let i = 0; const g = s[0];
  while (i < s.length && s[i] === g) i++;
  let val = DY(BigInt(g * i), 1n);        // ± (length of the leading run) as an integer
  // fractional part: from the first sign change onward, each edge adds its sign · 2^-k, k = 1,2,3,…
  let k = 1;
  for (let t = i; t < s.length; t++){
    val = dyAdd(val, DY(BigInt(s[t]), B1 << BigInt(k)));
    k++;
  }
  return val;
}

// ── THE GRAPH MODEL ─────────────────────────────────────────────────────────────────────────────
// nodes: 0 = THE EARTH (the ground). edges: { id, a, b, color } with color ∈ {'blue','red','green'}.
// An edge is GROUNDED iff a path of edges connects it to node 0. Cutting an edge removes it, then every
// edge no longer connected to the earth FALLS (the hero moment).
function groundedEdges(edges){
  const adj = new Map();
  for (const e of edges){
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a).push(e); adj.get(e.b).push(e);
  }
  const reach = new Set([0]); const stack = [0];
  while (stack.length){
    const x = stack.pop();
    for (const e of (adj.get(x) || [])){
      const y = (e.a === x) ? e.b : e.a;
      if (!reach.has(y)){ reach.add(y); stack.push(y); }
    }
  }
  // an edge survives iff at least one endpoint is reachable from the earth.
  return edges.filter(e => reach.has(e.a) || reach.has(e.b));
}
// fallenAfterCut(edges, id): { kept, fallen } — the surviving grounded edges after cutting `id`, and the
// edges that fall (were present, now ungrounded — INCLUDING the cut edge itself). The page animates
// `fallen`; the logic uses `kept`.
function fallenAfterCut(edges, id){
  const remaining = edges.filter(e => e.id !== id);
  const kept = groundedEdges(remaining);
  const keptIds = new Set(kept.map(e => e.id));
  const fallen = edges.filter(e => !keptIds.has(e.id));   // the cut edge + everything it un-grounded
  return { kept, fallen };
}
function cutEdge(edges, id){ return fallenAfterCut(edges, id).kept; }

// hasGreen(edges): any impartial edge present? value() refuses these.
function hasGreen(edges){ return edges.some(e => e.color === 'green'); }

// keyOf(edges): a canonical structural key so memo tables share across id-equal shapes. We relabel nodes
// by a deterministic BFS order from the earth, then serialise sorted (color, endpoints) — so two boards
// that are the same graph up to node-id renaming collide in the memo (a big speed win for the sweeps).
function keyOf(edges){
  if (edges.length === 0) return "";
  const adj = new Map();
  for (const e of edges){
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a).push(e); adj.get(e.b).push(e);
  }
  // canonical node labels: BFS from earth(0); unreached nodes (shouldn't happen post-grounding) get
  // labels after, in ascending id order, for total determinism.
  const label = new Map([[0, 0]]); let next = 1;
  const q = [0];
  while (q.length){
    const x = q.shift();
    const nbrs = (adj.get(x) || []).map(e => (e.a === x) ? e.b : e.a).sort((p, r) => p - r);
    for (const y of nbrs){ if (!label.has(y)){ label.set(y, next++); q.push(y); } }
  }
  const allNodes = new Set(); for (const e of edges){ allNodes.add(e.a); allNodes.add(e.b); }
  for (const nd of [...allNodes].sort((p, r) => p - r)){ if (!label.has(nd)) label.set(nd, next++); }
  return edges
    .map(e => { const u = label.get(e.a), v = label.get(e.b); const lo = Math.min(u, v), hi = Math.max(u, v); return e.color[0] + lo + "-" + hi; })
    .sort()
    .join("|");
}

// leftOptions / rightOptions: the child boards after a move. Left = Blue cuts a blue (or green) edge;
// Right = Red cuts a red (or green) edge. (Green is cuttable by BOTH — impartial.)
function leftOptions(edges){
  const out = [];
  for (const e of edges){ if (e.color === 'blue' || e.color === 'green') out.push(cutEdge(edges, e.id)); }
  return out;
}
function rightOptions(edges){
  const out = [];
  for (const e of edges){ if (e.color === 'red' || e.color === 'green') out.push(cutEdge(edges, e.id)); }
  return out;
}

// ── value(edges): the EXACT dyadic value, by Conway simplest-number recursion, memoised on keyOf. ──
// value(G) = simplest number strictly between (max over Left-options value) and (min over Right-options
// value). One-sided cases: {maxL | } = the simplest number > maxL (namely floor(maxL)+1); { | minR } =
// the simplest number < minR (ceil(minR)-1); {|} = 0. Because a Blue-Red forest is ALWAYS a number, the
// number case (maxL < minR) is the only interior branch — if maxL >= minR ever occurred the board would
// not be a number, which cannot happen for Blue-Red, so we throw (a loud contract violation, never a
// silent forced fraction).
const _valMemo = new Map();
function value(edges){
  if (hasGreen(edges)) throw new Error("value() called on a board containing a GREEN edge — green is a nimber, not a number");
  if (edges.length === 0) return DY(0);
  const k = keyOf(edges);
  if (_valMemo.has(k)) return _valMemo.get(k);
  const Ls = leftOptions(edges).map(value);
  const Rs = rightOptions(edges).map(value);
  const maxL = Ls.length ? Ls.reduce((m, x) => dyCmp(x, m) > 0 ? x : m) : null;
  const minR = Rs.length ? Rs.reduce((m, x) => dyCmp(x, m) < 0 ? x : m) : null;
  let v;
  if (maxL === null && minR === null){ v = DY(0); }
  else if (minR === null){ v = DY(dyFloor(maxL) + 1n, 1n); }        // {maxL | } — simplest number above maxL
  else if (maxL === null){ v = DY(dyCeil(minR) - 1n, 1n); }         // { | minR } — simplest number below minR
  else if (dyCmp(maxL, minR) < 0){ v = simplestBetween(maxL, minR); }
  else {
    // maxL >= minR would mean the position is NOT a number. Impossible for Blue-Red Hackenbush.
    throw new Error("non-number Blue-Red position (maxL >= minR) — should be impossible: " + keyOf(edges));
  }
  _valMemo.set(k, v);
  return v;
}

// ── outcome(): the CODE-DISJOINT who-wins authority (pure booleans, imports NO value algebra) ──
// leftWins(edges): can Left (Blue), to move, force a win? rightWins(edges): Right (Red)? A side wins if
// it has a move to a child where the OPPONENT-to-move loses. No move ⇒ that side loses.
const _lw = new Map(), _rw = new Map();
function leftWins(edges){
  const k = keyOf(edges);
  if (_lw.has(k)) return _lw.get(k);
  let w = false;
  const opts = leftOptions(edges);
  for (const child of opts){ if (!rightWins(child)){ w = true; break; } }
  _lw.set(k, w);
  return w;
}
function rightWins(edges){
  const k = keyOf(edges);
  if (_rw.has(k)) return _rw.get(k);
  let w = false;
  const opts = rightOptions(edges);
  for (const child of opts){ if (!leftWins(child)){ w = true; break; } }
  _rw.set(k, w);
  return w;
}
// outcome(edges): the combinatorial outcome class.
//   L = Left (Blue) wins no matter who moves first
//   R = Right (Red) wins no matter who moves first
//   N = first player to move wins  (∗-like / fuzzy — impossible for a Blue-Red number board)
//   P = previous player wins  (the mover LOSES; a Blue-Red number board's value is 0)
function outcome(edges){
  const l = leftWins(edges), r = rightWins(edges);
  if (l && r) return 'N';
  if (l && !r) return 'L';
  if (!l && r) return 'R';
  return 'P';
}

// bestMove(edges, side): a perfect-play cut — 'blue' side (Left) or 'red' side (Right). Prefer a cut whose
// child leaves the OPPONENT-to-move losing; else, among losing positions, the VALUE-optimal resistance
// (Left keeps the value as HIGH as possible; Right as LOW as possible), breaking ties by lowest edge id
// for determinism. Returns the edge id to cut, or null if the side has no legal cut.
function bestMove(edges, side){
  const mine = side === 'blue' ? ['blue', 'green'] : ['red', 'green'];
  const cand = edges.filter(e => mine.includes(e.color));
  if (cand.length === 0) return null;
  const oppWins = side === 'blue' ? rightWins : leftWins;
  // winning cut: opponent-to-move then loses.
  let winning = null;
  for (const e of cand){ if (!oppWins(cutEdge(edges, e.id))){ if (winning === null || e.id < winning) winning = e.id; } }
  if (winning !== null) return winning;
  // losing position: value-optimal resistance (only meaningful when no green — a green board has no number).
  if (!hasGreen(edges)){
    let best = null, bestVal = null;
    for (const e of cand){
      const cv = value(cutEdge(edges, e.id));
      if (best === null){ best = e.id; bestVal = cv; continue; }
      const c = dyCmp(cv, bestVal);
      const better = side === 'blue' ? (c > 0) : (c < 0);
      if (better || (c === 0 && e.id < best)){ best = e.id; bestVal = cv; }
    }
    return best;
  }
  // green board, no winning move: deterministic first candidate.
  return cand.reduce((m, e) => e.id < m ? e.id : m, cand[0].id);
}

// ── the self-test: EXACTLY 4 named rows, each proven against an INDEPENDENT statement ─────────────
// LEG A · SIGN ⟺ WINNER over a bank of random Blue-Red forests (zero mismatches; value 0 ⟺ P).
// LEG B · the COLON PRINCIPLE: value(stalk) === closedFormStalk(colors) for all stalks up to a depth.
// LEG C · the ALL-GREEN neg-control: an odd all-green stalk is a NIMBER whose sign does NOT foretell the
//          partisan winner — outcome() returns N (first-player win), asserted, and value() REFUSES it.
// LEG D · the FALL: cutting the base of a stalk drops the whole stalk; cutting the top leaves the base.
function edgesFrom(spec){ return spec.map((s, i) => ({ id: i + 1, a: s.a, b: s.b, color: s.c })); }
// a grounded stalk from colours (earth upward): colors[i] ∈ {'blue','red','green'} → chain 0-1-2-…-n.
function stalkEdges(colors){ return colors.map((c, i) => ({ id: i + 1, a: i, b: i + 1, color: c })); }

function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // clear memo so a self-test is deterministic regardless of prior UI use.
  _valMemo.clear(); _lw.clear(); _rw.clear();

  // ── LEG A · SIGN ⟺ WINNER over random Blue-Red forests. sign(value) must equal the negamax class:
  //    >0 ⟺ L, <0 ⟺ R, =0 ⟺ P. A number is never fuzzy, so N must NEVER appear. Zero mismatches. ──
  {
    const rng = makeRng(0x0CADE);   // the concrete uint32 shared verbatim page↔twin
    let ok = true, bad = '', n = 0, sawL = 0, sawR = 0, sawP = 0;
    for (let t = 0; t < 300 && ok; t++){
      // random partisan forest: 1..3 chains off the earth, each 1..4 edges, each edge blue/red.
      const spec = []; let node = 1; const chains = 1 + ((rng() * 3) | 0);
      for (let c = 0; c < chains; c++){
        let prev = 0; const len = 1 + ((rng() * 4) | 0);
        for (let i = 0; i < len; i++){ const col = rng() < 0.5 ? 'blue' : 'red'; spec.push({ a: prev, b: node, c: col }); prev = node; node++; }
      }
      const E = edgesFrom(spec);
      n++;
      const v = value(E), oc = outcome(E);
      const s = dySign(v);
      const cls = s > 0 ? 'L' : s < 0 ? 'R' : 'P';
      if (oc === 'L') sawL++; else if (oc === 'R') sawR++; else if (oc === 'P') sawP++;
      if (cls !== oc){ ok = false; bad = keyOf(E) + ' sign→' + cls + ' vs outcome ' + oc; }
    }
    ck('A · sign(value) ⟺ optimal-play winner over ' + n + ' random blue/red forests (>0⟺L, <0⟺R, 0⟺P; no N)',
       ok && sawL > 0 && sawR > 0 && sawP > 0,
       ok ? 'all agree · L=' + sawL + ' R=' + sawR + ' P=' + sawP + ' (0 mismatches)' : 'MISMATCH at ' + bad);
  }

  // ── LEG B · the COLON PRINCIPLE: value(stalk) === closedFormStalk(colors), EXACT dyadic, for ALL
  //    blue/red stalks up to depth 10 in the page (2046 stalks). closedFormStalk is a code-disjoint
  //    authority (a direct sign-expansion), so this is two computations that must agree bit-for-bit. ──
  {
    let ok = true, bad = '', n = 0, maxDen = 1n;
    outerB:
    for (let depth = 1; depth <= 10; depth++){
      for (let mask = 0; mask < (1 << depth); mask++){
        const colors = [];
        for (let i = 0; i < depth; i++) colors.push((mask >> i) & 1 ? 'blue' : 'red');
        const E = stalkEdges(colors);
        const v = value(E);
        const cf = closedFormStalk(colors.map(c => c === 'blue' ? 'b' : 'r'));
        n++;
        if (v.den > maxDen) maxDen = v.den;
        if (!dyEq(v, cf)){ ok = false; bad = colors.join(',') + ' value=' + v.num + '/' + v.den + ' closed=' + cf.num + '/' + cf.den; break outerB; }
      }
    }
    ck('B · Colon Principle: value(stalk) === closed-form sign-expansion, exact dyadic, ∀ blue/red stalks depth≤10 (' + n + ')',
       ok, ok ? 'all ' + n + ' stalks match exactly · deepest denominator 2^' + (maxDen.toString(2).length - 1) : 'FAIL at ' + bad);
  }

  // ── LEG C · the ALL-GREEN NEG-CONTROL. An odd all-green stalk is Nim heap of odd height ⇒ a NIMBER
  //    (∗n, n odd) ⇒ first player wins ⇒ outcome === 'N'. Its "sign" (if you forced a number) does NOT
  //    foretell the partisan winner — there is no partisan winner, the FIRST mover wins either way. We
  //    assert outcome==='N' AND that value() REFUSES the board (throws — green is not a number). Also a
  //    balanced pair of equal green stalks is a P-position (nim-sum 0), a genuine second-player win. ──
  {
    // odd green stalk (height 3): Nim heap 3 ⇒ ∗3 ⇒ N.
    const g3 = stalkEdges(['green', 'green', 'green']);
    const ocN = outcome(g3);
    let refused = false;
    try { value(g3); } catch (e) { refused = true; }
    // two equal green stalks height 2 each: nim-sum 2⊕2 = 0 ⇒ P.
    const gPair = edgesFrom([
      { a: 0, b: 1, c: 'green' }, { a: 1, b: 2, c: 'green' },
      { a: 0, b: 3, c: 'green' }, { a: 3, b: 4, c: 'green' },
    ]);
    const ocP = outcome(gPair);
    // an UNEQUAL green pair {2,1}: nim-sum 2⊕1 = 3 ≠ 0 ⇒ N.
    const gUneq = edgesFrom([
      { a: 0, b: 1, c: 'green' }, { a: 1, b: 2, c: 'green' },
      { a: 0, b: 3, c: 'green' },
    ]);
    const ocN2 = outcome(gUneq);
    const pass = ocN === 'N' && refused && ocP === 'P' && ocN2 === 'N';
    ck('C · neg-control: odd all-green stalk is a NIMBER — outcome=N (first player wins), value() refuses it; equal green pair is P, unequal is N',
       pass, 'green ∗3 → ' + ocN + ' (value refused: ' + refused + ') · {2,2} → ' + ocP + ' · {2,1} → ' + ocN2);
  }

  // ── LEG D · the FALL. Cutting the grounded base of a stalk drops the WHOLE stalk; cutting the top edge
  //    leaves the grounded base standing. The mechanic the page animates, checked at the logic layer. ──
  {
    const E = edgesFrom([{ a: 0, b: 1, c: 'blue' }, { a: 1, b: 2, c: 'blue' }, { a: 2, b: 3, c: 'red' }]);
    const cutBase = fallenAfterCut(E, 1);   // cut the earth-rooted edge
    const cutTop = fallenAfterCut(E, 3);    // cut the topmost edge
    const pass = cutBase.kept.length === 0 && cutBase.fallen.length === 3 &&
                 cutTop.kept.length === 2 && cutTop.fallen.length === 1;
    ck('D · the fall: cutting the base drops the whole stalk (3 fall); cutting the top leaves the base (1 falls)',
       pass, 'cut base → ' + cutBase.kept.length + ' kept, ' + cutBase.fallen.length + ' fell · cut top → ' + cutTop.kept.length + ' kept, ' + cutTop.fallen.length + ' fell');
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END VALUE-OF-A-CUT CORE =====

export {
  makeRng,
  DY, reduceDy, dyAdd, dyCmp, dyEq, dyNeg, dySign, dyFloor, dyCeil, simplestBetween, closedFormStalk,
  groundedEdges, fallenAfterCut, cutEdge, hasGreen, keyOf, leftOptions, rightOptions,
  value, outcome, leftWins, rightWins, bestMove,
  edgesFrom, stalkEdges, runSelfTest
};
