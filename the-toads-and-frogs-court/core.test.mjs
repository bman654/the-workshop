// The Toads & Frogs Court — the Node twin. runSelfTest() is the SOLE oracle for the page's pill (the
// page calls the SAME code). This twin (A) runs the 5 self-test rows, (B1..B5) adds stronger
// statements — wider zero/sign cross-checks, canonical idempotence, negate involution + order-reversal,
// a wider neg-control, and a wider seeded tournament — and (C) byte-parity-checks the core inlined into
// index.html against this module's body. Exit 0 = ALL GREEN.
//
// NOTE on bound: the exhaustive sweeps stay ≤ length 7 by design — the board count is 3^len, so it
// grows exponentially. Length 7 is 3280 boards; longer boards are PLAYABLE on the page but not
// exhaustively self-tested. (Asserted in the SPEC.)
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

// ── (B1) WIDER zero⟺mover-loses AND sign⟺winner over ALL boards up to length 7 (3280 boards). ────
{
  const map = { '+':'L', '-':'R', '0':'P', '||':'N' };
  let zeroOk = true, signOk = true, bad = '', n = 0;
  const seen = { L:0, R:0, P:0, N:0 };
  outer:
  for (let len = 0; len <= 7; len++){
    for (const b of core.allBoards(len)){
      n++;
      const oc = core.outcome(b);
      seen[oc] = (seen[oc] || 0) + 1;
      if (core.isZero(core.value(b)) !== (oc === 'P')){ zeroOk = false; bad = b.join('') + ' zero'; break outer; }
      if (map[core.sign(core.value(b))] !== oc){ signOk = false; bad = b.join('') + ' sign'; break outer; }
    }
  }
  line(zeroOk && signOk,
    'B1 · zero⟺P and sign⟺winner over ' + n + ' boards len≤7  ::  ' +
    (zeroOk && signOk ? 'all agree · census L=' + seen.L + ' R=' + seen.R + ' P=' + seen.P + ' N=' + seen.N
                      : 'FAIL at ' + bad));
}

// ── (B2) CANONICAL IDEMPOTENCE + eq ANTISYMMETRY: canon(value) is a fixpoint (gkey(canon(v))===gkey(v))
// and eq is antisymmetric (a≤b ∧ b≤a ⟺ eq) over sampled value pairs from the len≤6 value set. ──────
{
  const vals = [];
  const seenKeys = new Set();
  for (let len = 0; len <= 6; len++){
    for (const b of core.allBoards(len)){
      const v = core.value(b);
      const k = core.gkey(v);
      if (!seenKeys.has(k)){ seenKeys.add(k); vals.push(v); }
    }
  }
  let idemOk = true, badI = '';
  for (const v of vals){
    if (core.gkey(core.canon(v)) !== core.gkey(v)){ idemOk = false; badI = core.gkey(v); break; }
  }
  // antisymmetry on sampled pairs (cap to keep it quick — first 60 distinct values, all pairs)
  let antiOk = true, badA = '';
  const sample = vals.slice(0, 60);
  for (let i = 0; i < sample.length && antiOk; i++){
    for (let j = 0; j < sample.length && antiOk; j++){
      const a = sample[i], b = sample[j];
      const both = core.leq(a, b) && core.leq(b, a);
      if (both !== core.eq(a, b)){ antiOk = false; badA = core.gkey(a) + ' vs ' + core.gkey(b); }
    }
  }
  line(idemOk && antiOk,
    'B2 · canon idempotent on ' + vals.length + ' distinct values + eq antisymmetric on ' + sample.length + '²  ::  ' +
    (idemOk && antiOk ? 'fixpoint + antisymmetry hold' : 'FAIL ' + (badI || badA)));
}

// ── (B3) NEGATE INVOLUTION + ORDER-REVERSAL: negate(negate(v))===v, and leq(a,b) ⟺ leq(−b,−a)
// over the len≤7 value set (sampled pairs). ──────────────────────────────────────────────────────
{
  const vals = [];
  const seenKeys = new Set();
  for (let len = 0; len <= 7; len++){
    for (const b of core.allBoards(len)){
      const v = core.value(b);
      const k = core.gkey(v);
      if (!seenKeys.has(k)){ seenKeys.add(k); vals.push(v); }
    }
  }
  let invOk = true, badI = '';
  for (const v of vals){
    if (core.gkey(core.negate(core.negate(v))) !== core.gkey(v)){ invOk = false; badI = core.gkey(v); break; }
  }
  let revOk = true, badR = '';
  const sample = vals.slice(0, 70);
  for (let i = 0; i < sample.length && revOk; i++){
    for (let j = 0; j < sample.length && revOk; j++){
      const a = sample[i], b = sample[j];
      if (core.leq(a, b) !== core.leq(core.negate(b), core.negate(a))){
        revOk = false; badR = core.gkey(a) + ' vs ' + core.gkey(b);
      }
    }
  }
  line(invOk && revOk,
    'B3 · negate involution on ' + vals.length + ' values + order-reversal leq(a,b)⟺leq(−b,−a) on ' + sample.length + '²  ::  ' +
    (invOk && revOk ? 'involution + order-reversal hold' : 'FAIL ' + (badI || badR)));
}

// ── (B4) WIDER NEG-CONTROL over len≤7 + exhibit a board whose value ≠ its negative (TF__ = 1 ≠ −1). ─
{
  let ok = true, bad = '', n = 0;
  outer:
  for (let len = 0; len <= 7; len++){
    for (const b of core.allBoards(len)){
      n++;
      if (!core.eq(core.value(core.mirrorSwap(b)), core.negate(core.value(b)))){ ok = false; bad = b.join(''); break outer; }
    }
  }
  const tf = core.value('TF__'.split(''));
  const notSelfNeg = core.eq(tf, core.ONE) && !core.eq(tf, core.negate(tf));   // 1 ≠ −1
  line(ok && notSelfNeg,
    'B4 · mirror+swap negates over ' + n + ' boards len≤7 · TF__=1 is NOT its own negative  ::  ' +
    (ok && notSelfNeg ? 'all negate + asymmetry exhibited' : 'FAIL at ' + bad));
}

// ── (B5) WIDER SEEDED TOURNAMENT — seed 0x70AD5, 400 starts, lengths 3..7: the side outcome() says
// wins (playing bestMove) NEVER loses, AND whenever a winning child exists, bestMove lands on it. ──
{
  const rng = core.makeRng(0x70AD5);
  let starts = 0, defenderWins = 0, badPick = 0;
  for (let t = 0; t < 400; t++){
    const len = 3 + ((rng() * 5) | 0);   // length 3..7
    const b = [];
    for (let i = 0; i < len; i++){ const r = (rng() * 3) | 0; b.push(r === 0 ? 'T' : r === 1 ? 'F' : '_'); }
    const oc = core.outcome(b);
    let toMove, winner;
    if (oc === 'L'){ toMove = 'T'; winner = 'T'; }
    else if (oc === 'R'){ toMove = 'F'; winner = 'F'; }
    else if (oc === 'N'){ toMove = 'T'; winner = 'T'; }
    else continue;
    starts++;
    let cur = b.slice(), side = toMove, guard = 0;
    while (!core.isTerminal(cur, side) && guard++ < 200){
      const oppWins = side === 'T' ? core.rightToMoveWins : core.leftToMoveWins;
      const ms = core.legalMoves(cur, side);
      const hasWinning = ms.some(m => !oppWins(core.apply(cur, m, side)));
      const mv = core.bestMove(cur, side);
      if (hasWinning && oppWins(core.apply(cur, mv, side))) badPick++;
      cur = core.apply(cur, mv, side);
      side = side === 'T' ? 'F' : 'T';
    }
    const won = side === 'T' ? 'F' : 'T';
    if (won !== winner) defenderWins++;
  }
  line(defenderWins === 0 && badPick === 0,
    'B5 · seeded tournament len 3..7: winner never loses + bestMove lands on a winning child  ::  ' +
    starts + ' starts · ' + defenderWins + ' winner-losses · ' + badPick + ' missed wins');
}

// ── (C) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-
// sentinel. Enforces the anti-drift convention — one oracle, no second copy. ──────────────────────
{
  const START = '// ===== TOADS-FROGS CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END TOADS-FROGS CORE =====';
  const slab = (text) => {
    const i = text.indexOf(START);
    const j = text.indexOf(END);
    if (i < 0 || j < 0) return null;
    return text.slice(i, j + END.length);
  };
  let modText = '', htmlText = '';
  try { modText = readFileSync(join(here, 'core.mjs'), 'utf8'); } catch { /* missing → FAIL below */ }
  try { htmlText = readFileSync(join(here, 'index.html'), 'utf8'); } catch { /* missing → FAIL below */ }
  const modBlock = slab(modText);
  const htmlBlock = slab(htmlText);
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'C · inlined core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
