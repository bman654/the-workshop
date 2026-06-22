// The Nimber Strip — the Node twin. runSelfTest() is the SOLE oracle for the page's pill (the page
// calls the SAME code). This twin (A) runs the 5 self-test rows, (B1..B4) adds stronger statements
// — a wider staircase, exhaustive multi-heap minimax + bestMove zeroing, a wider misère neg-control,
// and the pip-set ≡ bestMove cross-check — and (C) byte-parity-checks the core inlined into
// index.html against this module's body. Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the five self-test rows (the page's in-page pill runs this exact function) ─────────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B1) STRONGER STAIRCASE: live-mex grundy(n) === n%4 for every n≤2000 (not just 200). ──────
{
  let ok = true, badN = -1;
  for (let n = 0; n <= 2000; n++){
    if (core.grundy(n) !== (n % 4)){ ok = false; badN = n; break; }
  }
  line(ok, 'B1 · staircase grundy(n)===n%4 ∀ n≤2000 (live mex vs oracle)  ::  ' +
    (ok ? 'all 2001 match' : 'mismatch at n=' + badN));
}

// ── (B2) EXHAUSTIVE MINIMAX + bestMove ZEROES over 3-heap sweeps to heap-size 14: the XOR oracle
// agrees with a full normal-play minimax everywhere, and bestMove on every N-position hands the
// opponent a value-0 child via a legal move. ──────────────────────────────────────────────────
{
  const wmemo = new Map();
  function normalWin(heaps){
    if (core.isTerminal(heaps)) return false;
    const sig = heaps.filter(h => h > 0).sort((a, b) => a - b).join(',');
    if (wmemo.has(sig)) return wmemo.get(sig);
    let win = false;
    const moves = core.legalMoves(heaps);
    for (let i = 0; i < moves.length; i++){
      if (!normalWin(core.apply(heaps, moves[i]))){ win = true; break; }
    }
    wmemo.set(sig, win);
    return win;
  }
  let xorOk = true, moveOk = true, bad = '', positions = 0;
  const H = 14;
  for (let a = 0; a <= H && xorOk && moveOk; a++)
    for (let b = a; b <= H && xorOk && moveOk; b++)        // a≤b≤c cuts the symmetric duplicates
      for (let c = b; c <= H && xorOk && moveOk; c++){
        const heaps = [a, b, c];
        positions++;
        const lost = core.positionValue(heaps) === 0;
        if (lost === normalWin(heaps)){ xorOk = false; bad = '[' + a + ',' + b + ',' + c + '] xor'; break; }
        const mv = core.bestMove(heaps);
        if (core.positionValue(heaps) !== 0){
          if (mv === null || core.positionValue(core.apply(heaps, mv)) !== 0 ||
              mv.take > heaps[mv.heap] || core.MOVES.indexOf(mv.take) < 0){
            moveOk = false; bad = '[' + a + ',' + b + ',' + c + '] move'; break;
          }
        } else if (mv !== null){ moveOk = false; bad = '[' + a + ',' + b + ',' + c + '] P-move'; break; }
      }
  line(xorOk && moveOk,
    'B2 · exhaustive minimax + bestMove zeroes over ' + positions + ' sorted triples ≤14  ::  ' +
    (xorOk && moveOk ? 'XOR oracle and bestMove perfect' : 'FAIL at ' + bad));
}

// ── (B3) WIDER MISÈRE NEG-CONTROL over all pairs [a,b]≤6: the disagreement set with the normal-XOR
// oracle is NON-EMPTY (classifier is win-condition-specific) AND the two oracles AGREE on the
// complement (not noisy) AND the max single-strip Grundy value over the sweep is ≤3 (the lamp-width
// invariant the lever facet needs: 3 binary place-lamps suffice). ──────────────────────────────
{
  let disagree = 0, agree = 0, total = 0;
  for (let a = 0; a <= 6; a++)
    for (let b = 0; b <= 6; b++){
      if (a === 0 && b === 0) continue;
      const heaps = b === 0 ? [a] : [a, b];
      total++;
      const nWin = core.normalMoverWins(heaps);
      const mWin = core.misereMoverWins(heaps);
      if (nWin === mWin) agree++; else disagree++;
    }
  let maxG = 0;
  for (let n = 0; n <= 200; n++) if (core.grundy(n) > maxG) maxG = core.grundy(n);
  const ok = disagree > 0 && agree > 0 && (agree + disagree === total) && maxG <= 3;
  line(ok, 'B3 · misère diverges on a non-empty subset, agrees on the rest, maxGrundy≤3  ::  ' +
    disagree + ' disagree / ' + agree + ' agree of ' + total + ' · maxGrundy=' + maxG);
}

// ── (B4) PIP-SET ≡ bestMove on N-positions: the "→ darkens the lamps" pip set (lever facet) is the
// set of legal moves whose child has positionValue 0. For every N-position in a multi-heap sweep,
// bestMove's chosen child has positionValue 0 AND bestMove's move is a MEMBER of that pip set. ──
{
  function pipSet(heaps){
    return core.legalMoves(heaps).filter(mv => core.positionValue(core.apply(heaps, mv)) === 0);
  }
  let ok = true, bad = '', nChecked = 0;
  const H = 10;
  for (let a = 0; a <= H && ok; a++)
    for (let b = 0; b <= H && ok; b++)
      for (let c = 0; c <= H && ok; c++){
        const heaps = [a, b, c];
        if (core.positionValue(heaps) === 0) continue;   // N-positions only
        nChecked++;
        const pips = pipSet(heaps);
        const mv = core.bestMove(heaps);
        const childZero = mv && core.positionValue(core.apply(heaps, mv)) === 0;
        const member = mv && pips.some(p => p.heap === mv.heap && p.take === mv.take);
        if (!(pips.length > 0 && childZero && member)){
          ok = false; bad = '[' + a + ',' + b + ',' + c + ']'; break;
        }
      }
  line(ok, 'B4 · pip-set ≡ bestMove on N-positions (child value 0, member of pip set)  ::  ' +
    (ok ? nChecked + ' N-positions ≤10 all consistent' : 'FAIL at ' + bad));
}

// ── (C) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-
// sentinel. Enforces the anti-drift convention — one oracle, no second copy. ──────────────────────
{
  const START = '// ===== NIMBER-STRIP CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END NIMBER-STRIP CORE =====';
  const slab = (text) => {
    const i = text.indexOf(START);
    const j = text.indexOf(END);
    if (i < 0 || j < 0) return null;
    return text.slice(i, j + END.length);
  };
  const modText = readFileSync(join(here, 'core.mjs'), 'utf8');
  const htmlText = readFileSync(join(here, 'index.html'), 'utf8');
  const modBlock = slab(modText);
  const htmlBlock = slab(htmlText);
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'C · inlined core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
