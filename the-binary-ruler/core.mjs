// ============================================================================
// === CORE BEGIN ===  The Binary Ruler — math core (single source of truth).
// ----------------------------------------------------------------------------
// THE OBJECT: Tower of Hanoi, n discs (1=smallest .. n=largest), 3 pegs (0,1,2).
// A state is an Int array pos[1..n] giving the peg each disc sits on.
//
// THE SOUL: solving optimally IS counting 0..2^n-1 in binary.
//  • the OPTIMAL solve has length exactly 2^n - 1;
//  • the disc moved at step t (1-indexed) === ruler(t) = trailingZeros(t)+1;
//  • the peg-config after t optimal moves is fixed by the binary-reflected Gray
//    code G(t)=t^(t>>1) — and a CLOSED-FORM decoder grayState(n,t) reads each
//    disc's peg straight off t with NO replay; consecutive states differ in
//    EXACTLY ONE disc (Gray adjacency, decoded — not just structural).
//  • stray off the ruler and a closed-form minMoves(state) proves your wheel must
//    roll PAST the brass floor: provable best-possible total = yours + minMoves.
// Every claim below is COMPUTED, never hard-coded, and checked by runSelfTest().
// ----------------------------------------------------------------------------

// ── primitives ──
function trailingZeros(t){ let c = 0; while ((t & 1) === 0) { c++; t >>= 1; } return c; }   // t>=1
function ruler(t){ return trailingZeros(t) + 1; }                 // disc moved at step t (1..n)
function grayCode(t){ return t ^ (t >>> 1); }                     // binary-reflected Gray code
function popcount(x){ let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }
function optimalLength(n){ return Math.pow(2, n) - 1; }           // the proven floor

// ── the optimal solver (recursive Hanoi, peg 0 → peg 2 via 1) ──
// Returns the move list: each {disc, from, to}. Length === 2^n - 1.
function optimalMoves(n){
  const out = [];
  (function h(k, from, to, via){
    if (k === 0) return;
    h(k - 1, from, via, to);
    out.push({ disc: k, from, to });
    h(k - 1, via, to, from);
  })(n, 0, 2, 1);
  return out;
}

// ── the legal-move machine you PLAY ──
function freshTower(n){ const p = new Array(n + 1).fill(0); return p; }   // all on peg 0
function topDisc(pos, n, peg){                       // smallest disc on a peg, or 0 if empty
  let best = Infinity;
  for (let d = 1; d <= n; d++) if (pos[d] === peg && d < best) best = d;
  return best === Infinity ? 0 : best;
}
function legalMove(pos, n, from, to){                // can the top of `from` move to `to`?
  if (from === to) return false;
  const t = topDisc(pos, n, from); if (t === 0) return false;
  const onto = topDisc(pos, n, to);
  return onto === 0 || t < onto;                     // smaller-on-larger only
}
function applyMove(pos, n, from, to){                // PURE: returns a new pos, or null if illegal
  if (!legalMove(pos, n, from, to)) return null;
  const np = pos.slice(); np[topDisc(pos, n, from)] = to; return np;
}
function isSolved(pos, n){ for (let d = 1; d <= n; d++) if (pos[d] !== 2) return false; return true; }

// ── the honest replay bridge (ground truth for the closed-form decoder) ──
function stateAfter(n, t){                            // pos after t optimal moves (0<=t<=2^n-1)
  const mv = optimalMoves(n);
  const pos = freshTower(n);
  for (let i = 0; i < t; i++) pos[mv[i].disc] = mv[i].to;
  return pos;
}
function discsDiffering(a, b, n){ let c = 0; for (let d = 1; d <= n; d++) if (a[d] !== b[d]) c++; return c; }

// ── the CLOSED-FORM Gray↔peg decoder (NO search, NO replay) ──
// The peg of each disc after t optimal moves (0→2 via 1), read straight off t.
// Walk discs largest→smallest carrying (from,to,via) and rem=t; half=2^(k-1):
//   rem <  half : disc k hasn't moved → it sits on `from`; recurse (from,via,to)
//   rem === half: disc k just landed on `to`; all smaller discs are on `via`
//   rem >  half : disc k is on `to`; rem-=half; recurse (via,to,from)
// VERIFIED equal to stateAfter() for n=1..10 over every t (see test (3)).
function grayState(n, t){
  const peg = new Array(n + 1).fill(0);
  let from = 0, to = 2, via = 1, rem = t, k = n;
  while (k > 0){
    const half = 1 << (k - 1);                         // moves to relocate the (k-1)-subtower
    if (rem < half){                                   // disc k unmoved → on `from`
      peg[k] = from;
      const nf = from, nt = via, nv = to; from = nf; to = nt; via = nv; k--;
    } else if (rem === half){                          // disc k just moved → on `to`; rest on `via`
      peg[k] = to;
      for (let d = k - 1; d >= 1; d--) peg[d] = via;
      k = 0;
    } else {                                           // disc k on `to`; keep going via→to
      peg[k] = to; rem -= half;
      const nf = via, nt = to, nv = from; from = nf; to = nt; via = nv; k--;
    }
  }
  return peg;
}

// ── the PROVABLE minimal moves to carry the n-disc tower home (peg 2) from ANY
//    legal state — closed form, NO search. Scan discs largest→smallest: if disc d
//    already sits where the stack below it needs, it's free; else it must move once
//    (carrying its 2^(d-1) sub-tower) and the smaller target flips to the third peg.
//    From the fresh tower this returns exactly 2^n-1; from the solved state, 0. This
//    is what lets You-drive show overshoot HONESTLY: provable best-possible TOTAL is
//    yourMoves + minMoves(state); (that − floor) is how far you've strayed. ──
function minMoves(pos, n, target){
  let moves = 0, need = (target === undefined ? 2 : target);
  for (let d = n; d >= 1; d--){
    if (pos[d] !== need){ moves += (1 << (d - 1)); need = 3 - pos[d] - need; }
  }
  return moves;
}

// ── a TRUE shortest-path oracle over the raw Hanoi state-graph (BFS), used ONLY by
//    the negative controls to certify costs WITHOUT trusting the recursion OR the
//    minMoves closed form. State encoded base-3 (disc 1 = least-significant trit).
//    BFS from any state to all-on-peg-2 returns the genuine minimum. ──
function keyOf(pos, n){ let k = 0; for (let d = n; d >= 1; d--) k = k * 3 + pos[d]; return k; }
function fromKey(k, n){ const p = new Array(n + 1).fill(0); for (let d = 1; d <= n; d++){ p[d] = k % 3; k = (k - p[d]) / 3; } return p; }
function bfsDistToHome(startPos, n){
  const goal = keyOf((() => { const g = new Array(n + 1).fill(2); return g; })(), n);
  const start = keyOf(startPos, n);
  if (start === goal) return 0;
  const dist = new Map(); dist.set(start, 0);
  const q = [start]; let head = 0;
  while (head < q.length){
    const k = q[head++]; const d = dist.get(k); const p = fromKey(k, n);
    for (let from = 0; from < 3; from++) for (let to = 0; to < 3; to++){
      if (from === to || !legalMove(p, n, from, to)) continue;
      const np = applyMove(p, n, from, to); const nk = keyOf(np, n);
      if (!dist.has(nk)){ dist.set(nk, d + 1); if (nk === goal) return d + 1; q.push(nk); }
    }
  }
  return Infinity;
}

// ── NEG-CONTROL A: a deterministic legal-DETOUR foil. It shuttles disc 1 around the
//    cycle (0→1→2→0, 3 wasted legal moves the optimal solve never makes), then solves
//    optimally from there via the BFS oracle — so it ALWAYS terminates and ALWAYS uses
//    STRICTLY MORE than 2^n-1 moves. Returns {solved, moves}, BFS-certified. ──
function detourFoil(n){
  let pos = freshTower(n), moves = 0;
  const detour = [[0,1],[1,2],[2,0]];               // disc 1: 0→1→2→0 (all legal on a fresh tower)
  for (const [f,t] of detour){ const np = applyMove(pos, n, f, t); if (np){ pos = np; moves++; } }
  moves += bfsDistToHome(pos, n);                    // genuine optimal remainder via BFS
  return { solved: true, moves };
}

// ── NEG-CONTROL B: the OFF-RULER first move. On a fresh tower disc 1 has two legal
//    destinations; exactly one is the on-ruler (optimal) move. The OTHER leaves the
//    decoded Gray path: its resulting state ≠ grayState(n,1), AND its certified total
//    (1 + BFS-optimal remainder) is STRICTLY over the floor — while the on-ruler move
//    keeps 1 + dist === floor exactly. "Stray and your wheel passes the brass," proven.
//    Returns the on/off moves, both totals, and the floor. ──
function offRulerProbe(n){
  const floor = optimalLength(n);
  const mv = optimalMoves(n);
  const start = freshTower(n);
  const onNext = applyMove(start, n, mv[0].from, mv[0].to);        // the on-ruler t=1 state
  const onTotal = 1 + bfsDistToHome(onNext, n);
  let offNext = null, offMove = null;
  for (let from = 0; from < 3 && !offNext; from++) for (let to = 0; to < 3 && !offNext; to++){
    if (!legalMove(start, n, from, to)) continue;
    const cand = applyMove(start, n, from, to);
    if (discsDiffering(cand, onNext, n) !== 0){ offNext = cand; offMove = [from, to]; }
  }
  const offTotal = offNext ? 1 + bfsDistToHome(offNext, n) : Infinity;
  const gray1 = grayState(n, 1);
  return {
    floor, onNext, onTotal, offMove, offNext, offTotal,
    offLeavesGray: offNext ? (discsDiffering(offNext, gray1, n) !== 0) : true,
  };
}

// ── the self-test battery (the page runs the SAME one) ──
function runSelfTest(){
  const lines = [];
  const ck = (name, ok, detail) => lines.push({ name, ok: !!ok, detail: detail || '' });

  // (1) optimal solve length === 2^n - 1, n = 1..12.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 12; n++){
      const len = optimalMoves(n).length;
      if (len !== optimalLength(n)){ ok = false; ff = `n=${n}: len ${len} ≠ ${optimalLength(n)}`; break; }
    }
    ck('optimal length === 2ⁿ−1 for n=1..12', ok, ff || 'all 12 lengths exact');
  }

  // (2) disc moved at step t === ruler(t) = trailingZeros(t)+1, whole optimal solve, n=1..12.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 12 && ok; n++){
      const mv = optimalMoves(n);
      for (let t = 1; t <= mv.length; t++){
        if (mv[t - 1].disc !== ruler(t)){ ok = false; ff = `n=${n},t=${t}: disc ${mv[t-1].disc} ≠ ruler ${ruler(t)}`; break; }
      }
    }
    ck('disc(t) === ruler(t)=trailingZeros(t)+1, whole solve, n=1..12', ok, ff || 'every step matches the ruler');
  }

  // (3) CLOSED-FORM Gray decoder === replayed peg-state, n=1..10, ALL t. The proof
  //     footer's "peg(t)=Gray-decode G(t)" is literally true: a search-free decoder.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 10 && ok; n++){
      for (let t = 0; t <= optimalLength(n); t++){
        const truth = stateAfter(n, t), got = grayState(n, t);
        if (discsDiffering(truth, got, n) !== 0){
          ok = false; ff = `n=${n},t=${t}: decode=${got.slice(1)} ≠ replay=${truth.slice(1)}`; break;
        }
      }
    }
    ck('grayState(n,t) closed-form === replayed peg-state, n=1..10 all t', ok, ff || 'the decoder reads every peg straight off t');
  }

  // (4) Gray adjacency — DECODED, not just structural: consecutive grayState(n,t-1)→
  //     grayState(n,t) differ in EXACTLY ONE disc, AND G(t) flips exactly 1 bit, n=1..11.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 11 && ok; n++){
      let prev = grayState(n, 0);
      for (let t = 1; t <= optimalLength(n); t++){
        const cur = grayState(n, t);
        const dd = discsDiffering(prev, cur, n);
        if (dd !== 1){ ok = false; ff = `n=${n},t=${t}: ${dd} discs differ (decoded)`; break; }
        const gd = grayCode(t) ^ grayCode(t - 1);
        if (popcount(gd) !== 1){ ok = false; ff = `t=${t}: Gray changed ${popcount(gd)} bits`; break; }
        // the single changed disc IS the one the ruler names for step t
        let changed = 0; for (let d = 1; d <= n; d++) if (prev[d] !== cur[d]) { changed = d; break; }
        if (changed !== ruler(t)){ ok = false; ff = `n=${n},t=${t}: decoded disc ${changed} ≠ ruler ${ruler(t)}`; break; }
        prev = cur;
      }
    }
    ck('Gray adjacency DECODED: each step moves exactly 1 disc & flips 1 Gray bit & names ruler(t) (n=1..11)', ok, ff || 'one disc, one bit, the ruler disc, every tick');
  }

  // (5) NEG-CONTROL A — the legal-detour foil FINISHES but in STRICTLY MORE than
  //     2^n-1 moves, BFS-certified, n=2..9.
  {
    let ok = true, ff = '';
    for (let n = 2; n <= 9 && ok; n++){
      const floor = optimalLength(n);
      const g = detourFoil(n);
      if (!g.solved){ ok = false; ff = `n=${n}: detour did not finish`; break; }
      if (!(g.moves > floor)){ ok = false; ff = `n=${n}: detour ${g.moves} not > floor ${floor}`; break; }
    }
    ck('neg-control A: a legal-detour foil solves but in STRICTLY MORE than 2ⁿ−1 (BFS-certified, n=2..9)', ok, ff || 'every detour overshoots the floor');
  }

  // (6) NEG-CONTROL B — one OFF-RULER legal first move: certified total (1 + BFS
  //     remainder) STRICTLY over the floor AND the resulting state ≠ grayState(n,1)
  //     (it left the decoded Gray path), while the on-ruler move keeps 1+dist===floor
  //     exactly, n=2..9. "Stray off the ruler and your wheel passes the brass."
  {
    let ok = true, ff = '';
    for (let n = 2; n <= 9 && ok; n++){
      const p = offRulerProbe(n);
      if (p.onTotal !== p.floor){ ok = false; ff = `n=${n}: on-ruler total ${p.onTotal} ≠ floor ${p.floor}`; break; }
      if (!p.offMove){ ok = false; ff = `n=${n}: no off-ruler move`; break; }
      if (!(p.offTotal > p.floor)){ ok = false; ff = `n=${n}: off total ${p.offTotal} not > floor ${p.floor}`; break; }
      if (!p.offLeavesGray){ ok = false; ff = `n=${n}: off-ruler state === grayState(n,1) (did not leave the path)`; break; }
    }
    ck('neg-control B: off-ruler move overshoots (1+BFS > floor) AND leaves grayState(n,1); on-ruler stays on floor (n=2..9)', ok, ff || 'every off-ruler first move provably strays and overshoots');
  }

  // (7) minMoves CLOSED FORM anchors the overshoot meter: from the fresh tower it
  //     equals 2^n-1; from solved it is 0; and along the WHOLE optimal solve it counts
  //     down exactly 1 per move (so yourMoves + minMoves(state) === floor at every
  //     optimal step), n=1..11. And it never lies vs BFS at the start, n=2..9.
  {
    let ok = true, ff = '';
    for (let n = 1; n <= 11 && ok; n++){
      const floor = optimalLength(n);
      if (minMoves(freshTower(n), n, 2) !== floor){ ok = false; ff = `n=${n}: fresh minMoves ≠ ${floor}`; break; }
      const solved = freshTower(n).map(() => 2); solved[0] = 0;
      if (minMoves(solved, n, 2) !== 0){ ok = false; ff = `n=${n}: solved minMoves ≠ 0`; break; }
      const mv = optimalMoves(n); let pos = freshTower(n);
      for (let t = 0; t <= mv.length; t++){
        if (t + minMoves(pos, n, 2) !== floor){ ok = false; ff = `n=${n},t=${t}: ${t}+minMoves ≠ ${floor}`; break; }
        if (t < mv.length){ pos = pos.slice(); pos[mv[t].disc] = mv[t].to; }
      }
    }
    for (let n = 2; n <= 9 && ok; n++){
      if (minMoves(freshTower(n), n, 2) !== bfsDistToHome(freshTower(n), n)){ ok = false; ff = `n=${n}: minMoves ≠ BFS at start`; break; }
    }
    ck('minMoves closed form: fresh=2ⁿ−1, solved=0, counts down 1/optimal move, === BFS at start (n=1..11)', ok, ff || 'the overshoot meter is anchored');
  }

  // (8) STRUCTURAL ruler witness — the classic 1,2,1,3,1,2,1,4,1,2,1,3,1,2,1; fresh
  //     tower all peg 0; solved all peg 2.
  {
    const r = []; for (let t = 1; t <= 15; t++) r.push(ruler(t));
    const okR = r.join('') === '121312141213121';
    const fresh = freshTower(4).slice(1).every(p => p === 0);
    const end = stateAfter(4, 15).slice(1).every(p => p === 2);
    ck('structural: ruler(1..15)=1,2,1,3,1,2,1,4,…; fresh→all peg0; solved→all peg2', okR && fresh && end, `ruler=${r.join(',')}`);
  }

  const pass = lines.filter(l => l.ok).length;
  const total = lines.length;
  const fails = lines.filter(l => !l.ok).map(l => l.name + (l.detail ? ' — ' + l.detail : ''));
  return { pass, total, fails, lines };
}
// === CORE END ===
// ============================================================================

export {
  trailingZeros, ruler, grayCode, popcount, optimalLength,
  optimalMoves, freshTower, topDisc, legalMove, applyMove, isSolved,
  stateAfter, discsDiffering, grayState, minMoves,
  keyOf, fromKey, bfsDistToHome, detourFoil, offRulerProbe, runSelfTest,
};
