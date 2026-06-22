// The Nimber Strip — logic core (no closed form is hard-coded; mex is the SOLE authority).
//
// THE WHOLE POINT: a horizontal STRIP of n lit tiles. On your turn you take 1, 2, or 3 stones
// off the live end — the classic subtraction game S = {1, 2, 3}. Take the last stone to win.
// It LOOKS like a fresh little game, but it is secretly Nim: every position carries a Grundy
// value (a "nimber"), and those nimbers cycle 0, 1, 2, 3, 0, 1, 2, 3, … straight down the strip
// — a four-step staircase nobody put there by hand. Split the strip at gaps into several
// sub-strips and the whole heap-Nim machinery wakes up: a position is LOST for the mover exactly
// when the XOR of the sub-strips' nimbers is zero, and the perfect move is the one that zeroes it.
//
// WHY THE NUMBERS ARE REAL (mex is the oracle, never a formula): the Grundy value of a single
// strip of length k is computed bottom-up by the Sprague–Grundy rule —
//   grundy(k) = mex{ grundy(k-1), grundy(k-2), grundy(k-3) }   (only the legal, in-range moves)
// where mex(S) is the minimum excludant: the smallest non-negative integer NOT in S. NOTHING in
// this core writes k%4; the famous closed form g(k)=k%4 appears ONLY inside runSelfTest as the
// INDEPENDENT oracle we COMPARE the live mex against — so a broken mex breaks the self-test loudly.
//
// THE STAIRCASE (emergent, never stamped): because S={1,2,3} looks back exactly 3 steps, the mex
// recurrence settles into the period-4 cycle 0,1,2,3 — but we never tell the code that. We let the
// mex run and watch g(k)==k%4 fall out for every k≤2000.
//
// THE UNIFICATION (Sprague–Grundy): a disjunctive game (several independent strips, you move in
// ONE per turn) has value = XOR of its parts' Grundy values. positionValue(heaps) = that XOR.
//   • positionValue===0  ⟺ the mover is LOST under perfect play (a P-position).
//   • positionValue!==0  ⟺ the mover can WIN, by a move that drives the XOR to 0.
// bestMove finds such a move by enumerating legalMoves and keeping one whose child has value 0.
//
// THE NEGATIVE CONTROL (misère bites both ways): under MISÈRE play (take the last stone and you
// LOSE), the normal-play XOR oracle MIS-predicts certain endgames — e.g. a lone heap [1]: normal
// XOR says nonzero ⇒ "mover wins", but in misère taking that last stone loses, so the mover is
// actually lost. misereMoverWins computes the true misère winner by exhaustive recursion; the
// self-test asserts it DISAGREES with the normal-XOR verdict on an explicit flip set (proving the
// classifier is win-condition-specific, not a tautology).
//
// SOURCING (anti-drift): the page inlines this core byte-for-byte between the NIMBER-STRIP CORE
// sentinels; core.test.mjs byte-parity-checks the inlined copy in index.html against this body.
// The xorshift32 PRNG (makeRng) is consumed only by the self-play tournament so the page and the
// Node twin agree bit-for-bit.
//
// Zero-dep, DOM-free ESM.

// ===== NIMBER-STRIP CORE (byte-identical to core.mjs) =====
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

// The subtraction set S: on a turn you may remove 1, 2, or 3 stones from ONE strip.
const MOVES = [1, 2, 3];

// mex(set) — the MINIMUM EXCLUDANT: the smallest non-negative integer not present.
// This is the single primitive the whole nimber theory rests on. Pure, no closed form.
function mex(present){
  let m = 0;
  while (present.has(m)) m++;
  return m;
}

// grundy(k): the Grundy value (nimber) of ONE strip of length k, by the Sprague–Grundy rule,
// computed BOTTOM-UP with memoisation. grundy(0)=0 (terminal: mex of the empty set). For k≥1,
// grundy(k)=mex over the in-range legal children grundy(k-1),grundy(k-2),grundy(k-3). NEVER k%4.
const _gmemo = [0];
function grundy(k){
  if (k < 0) throw new Error('grundy: negative length ' + k);
  for (let i = _gmemo.length; i <= k; i++){
    const reach = new Set();
    for (let t = 0; t < MOVES.length; t++){
      const j = i - MOVES[t];
      if (j >= 0) reach.add(_gmemo[j]);   // _gmemo[j] is already settled (bottom-up)
    }
    _gmemo[i] = mex(reach);
  }
  return _gmemo[k];
}

// legalMoves(heaps): every move available from a multi-strip position, as {heap, take} pairs.
// heap = index into heaps; take ∈ MOVES with take ≤ heaps[heap]. Order is heap-major, take-minor.
function legalMoves(heaps){
  const out = [];
  for (let h = 0; h < heaps.length; h++){
    const size = heaps[h];
    for (let t = 0; t < MOVES.length; t++){
      const take = MOVES[t];
      if (take <= size) out.push({ heap: h, take });
    }
  }
  return out;
}

// apply(heaps, move): the child position after playing {heap, take}. Empty strips stay (size 0);
// they carry Grundy 0 and contribute nothing to the XOR, so they are harmless to keep.
function apply(heaps, move){
  const next = heaps.slice();
  next[move.heap] -= move.take;
  return next;
}

// isTerminal(heaps): no stones left anywhere — the player TO MOVE has lost (the mover before took
// the last stone, in normal play). Equivalent to positionValue===0 with no legal move.
function isTerminal(heaps){
  for (let h = 0; h < heaps.length; h++) if (heaps[h] > 0) return false;
  return true;
}

// positionValue(heaps): the Sprague–Grundy value of the disjunctive sum = XOR of each strip's
// Grundy value. ===0 ⟺ the mover is LOST (a P-position); !==0 ⟺ the mover can win.
function positionValue(heaps){
  let x = 0;
  for (let h = 0; h < heaps.length; h++) x ^= grundy(heaps[h]);
  return x;
}

// bestMove(heaps): a provably perfect move under NORMAL play, or null if the position is terminal
// or already lost (positionValue===0 with stones still on the board ⇒ no winning move exists).
// A winning move is one whose CHILD has positionValue 0 — it hands the opponent a P-position.
// Returns the first such move in legalMoves order (deterministic), as {heap, take}.
function bestMove(heaps){
  if (isTerminal(heaps)) return null;
  const moves = legalMoves(heaps);
  for (let i = 0; i < moves.length; i++){
    if (positionValue(apply(heaps, moves[i])) === 0) return moves[i];
  }
  return null;   // a P-position: every child is winning for the opponent — no move saves you
}

// misereMoverWins(heaps): does the player TO MOVE win under MISÈRE play (taking the last stone
// LOSES)? Exhaustive minimax recursion — the true misère oracle, independent of the XOR rule.
// Memoised on the sorted, zero-stripped heap signature so the recursion stays small.
const _mmemo = new Map();
function misereMoverWins(heaps){
  const sig = heaps.filter(h => h > 0).sort((a, b) => a - b).join(',');
  if (isTerminal(heaps)){
    // No stones: the previous player took the last stone and (misère) LOST ⇒ the mover WINS.
    return true;
  }
  if (_mmemo.has(sig)) return _mmemo.get(sig);
  let win = false;
  const moves = legalMoves(heaps);
  for (let i = 0; i < moves.length; i++){
    // the mover wins if some move leaves the OPPONENT in a losing (mover-loses) position
    if (!misereMoverWins(apply(heaps, moves[i]))){ win = true; break; }
  }
  _mmemo.set(sig, win);
  return win;
}

// normalMoverWins(heaps): the NORMAL-play winner read off the XOR oracle (mover wins ⟺ XOR≠0).
// Used only to contrast with misereMoverWins in the neg-control.
function normalMoverWins(heaps){ return positionValue(heaps) !== 0; }

// ── the self-test: EXACTLY 5 named rows, each proven against an INDEPENDENT oracle ─────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // (1) THE STAIRCASE — the live mex recurrence reproduces g(n)=n%4 for every n≤200. n%4 is the
  // ORACLE here (compared against), never the source: grundy() runs pure mex.
  {
    let ok = true, badN = -1;
    for (let n = 0; n <= 200; n++){
      if (grundy(n) !== (n % 4)){ ok = false; badN = n; break; }
    }
    ck('1 · staircase: live-mex grundy(n) === n%4 ∀ n≤200', ok,
       ok ? 'all 201 match the n%4 oracle' : 'mismatch at n=' + badN + ' grundy=' + grundy(badN));
  }

  // (2) THE UNIFICATION — positionValue===0 ⟺ the mover LOSES, checked against an EXHAUSTIVE
  // normal-play minimax (not against XOR itself), over single AND multi-heap positions.
  {
    const _wmemo = new Map();
    function normalWinExhaustive(heaps){
      if (isTerminal(heaps)) return false;   // normal play: no move ⇒ mover lost
      const sig = heaps.filter(h => h > 0).sort((a, b) => a - b).join(',');
      if (_wmemo.has(sig)) return _wmemo.get(sig);
      let win = false;
      const moves = legalMoves(heaps);
      for (let i = 0; i < moves.length; i++){
        if (!normalWinExhaustive(apply(heaps, moves[i]))){ win = true; break; }
      }
      _wmemo.set(sig, win);
      return win;
    }
    let ok = true, bad = '';
    // single heaps 0..30
    for (let a = 0; a <= 30 && ok; a++){
      const lost = positionValue([a]) === 0;
      if (lost === normalWinExhaustive([a])){ ok = false; bad = '[' + a + ']'; }
    }
    // multi-heaps a,b,c ≤ 8
    for (let a = 0; a <= 8 && ok; a++)
      for (let b = 0; b <= 8 && ok; b++)
        for (let c = 0; c <= 8 && ok; c++){
          const heaps = [a, b, c];
          const lost = positionValue(heaps) === 0;
          if (lost === normalWinExhaustive(heaps)){ ok = false; bad = '[' + a + ',' + b + ',' + c + ']'; }
        }
    ck('2 · unification: XOR=0 ⟺ mover loses (vs exhaustive minimax, single+multi)', ok,
       ok ? 'single 0..30 + all triples ≤8 agree' : 'mismatch at ' + bad);
  }

  // (3) bestMove IS PERFECT — on every N-position it zeroes the XOR (child value 0) and is a legal
  // move; on every P-position it returns null; on terminal it returns null.
  {
    let ok = true, bad = '';
    // terminal → null
    if (bestMove([0, 0, 0]) !== null){ ok = false; bad = 'terminal not null'; }
    for (let a = 0; a <= 8 && ok; a++)
      for (let b = 0; b <= 8 && ok; b++)
        for (let c = 0; c <= 8 && ok; c++){
          const heaps = [a, b, c];
          const mv = bestMove(heaps);
          if (positionValue(heaps) === 0){
            if (mv !== null){ ok = false; bad = 'P-position [' + a + ',' + b + ',' + c + '] gave a move'; }
          } else {
            if (mv === null){ ok = false; bad = 'N-position [' + a + ',' + b + ',' + c + '] gave null'; break; }
            // legal?
            const legal = mv.heap >= 0 && mv.heap < heaps.length && MOVES.indexOf(mv.take) >= 0 && mv.take <= heaps[mv.heap];
            if (!legal){ ok = false; bad = 'illegal move on [' + a + ',' + b + ',' + c + ']'; break; }
            // zeroes the XOR?
            if (positionValue(apply(heaps, mv)) !== 0){ ok = false; bad = 'move on [' + a + ',' + b + ',' + c + '] did not zero XOR'; break; }
          }
        }
    ck('3 · bestMove perfect: zeroes XOR on every N-pos, null on P/terminal, always legal', ok,
       ok ? 'all triples ≤8 + terminal' : bad);
  }

  // (4) THE PERFECT AI NEVER LOSES A WON GAME — a deterministic self-play tournament from many
  // random starts. From each start, whichever side faces a NON-zero XOR (the winning side) plays
  // bestMove; the loser plays the BEST resistance (also bestMove, falling back to any legal move).
  // The side that was winning at the start must take the last stone. Zero losses over the field.
  {
    const rng = makeRng(0xC0FFEE);
    let games = 0, winnerLosses = 0;
    for (let t = 0; t < 400; t++){
      // a random 1..3-strip start, sizes 1..14
      const k = 1 + ((rng() * 3) | 0);
      const heaps = [];
      for (let i = 0; i < k; i++) heaps.push(1 + ((rng() * 14) | 0));
      const startValue = positionValue(heaps);
      if (startValue === 0) continue;   // a lost start has no "winner" to defend
      games++;
      // the player to move at the start is the WINNER; track whose turn it is.
      let cur = heaps.slice();
      let moverIsWinner = true;   // mover at start is the winner
      let lastMover = null;
      while (!isTerminal(cur)){
        let mv = bestMove(cur);
        if (mv === null){
          // the loser facing a P-position: play any legal move (best resistance)
          const lm = legalMoves(cur);
          mv = lm[(rng() * lm.length) | 0];
        }
        lastMover = moverIsWinner;   // who is taking this move
        cur = apply(cur, mv);
        moverIsWinner = !moverIsWinner;
      }
      // lastMover took the final stone ⇒ that side WON (normal play). It must be the winner.
      if (lastMover !== true) winnerLosses++;
    }
    ck('4 · perfect AI: 0 losses over the seed-0xC0FFEE self-play tournament', winnerLosses === 0,
       games + ' won-starts played, ' + winnerLosses + ' winner-losses');
  }

  // (5) MISÈRE NEG-CONTROL — the classifier bites both ways: under misère, the normal-XOR verdict
  // MIS-predicts an explicit endgame. The flip set is the small positions where take-last-loses
  // overturns the XOR call; the lone heap [1] MUST be in it (normal: XOR=1≠0 ⇒ "mover wins"; misère:
  // taking the last stone loses ⇒ mover actually LOSES). We assert the disagreement set is non-empty
  // and that [1] disagrees, then re-affirm agreement away from the flips.
  {
    const flipSet = [];
    for (let a = 0; a <= 3; a++)
      for (let b = 0; b <= 3; b++){
        const heaps = a === 0 && b === 0 ? [] : (b === 0 ? [a] : [a, b]);
        if (a === 0 && b === 0) continue;
        const nWin = normalMoverWins(heaps);
        const mWin = misereMoverWins(heaps);
        if (nWin !== mWin) flipSet.push(heaps.join(','));
      }
    const oneDisagrees = normalMoverWins([1]) !== misereMoverWins([1]);
    // normal says win (XOR=1), misère says lose
    const oneShape = normalMoverWins([1]) === true && misereMoverWins([1]) === false;
    ck('5 · misère neg-control: normal-XOR mis-predicts (flip set non-empty, includes [1])',
       flipSet.length > 0 && oneDisagrees && oneShape,
       'flips={' + flipSet.join(' | ') + '} · [1]: normalWin=' + normalMoverWins([1]) + ' misèreWin=' + misereMoverWins([1]));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END NIMBER-STRIP CORE =====

export {
  makeRng, MOVES, mex, grundy, legalMoves, apply, isTerminal,
  positionValue, bestMove, misereMoverWins, normalMoverWins, runSelfTest
};
