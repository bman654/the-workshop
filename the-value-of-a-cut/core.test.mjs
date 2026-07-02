// The Value of a Cut — the Node twin. runSelfTest() is the SOLE oracle for the page's in-page pill (the
// page calls the SAME code). This twin (A) runs the 4 self-test rows, (B1..B5) adds STRONGER statements —
// a wider forest sweep, the depth-16 Colon Principle (sampled + a full depth-14 exhaustive), value(0)⟺P
// exact, bestMove correctness under perfect play, and the value-negation symmetry — and (C) byte-parity-
// checks the core inlined into index.html against this module's body. Exit 0 = ALL GREEN.
//
// NOTE on bounds (asserted in SPEC): exhaustive forest sweeps stay small (the option tree is exponential in
// edge count); the Colon Principle is exhaustive to depth 14 (32766 stalks) here and sampled to depth 16 —
// the in-page sweep runs depth ≤ 10 for snappiness. Longer positions are fully PLAYABLE on the page but not
// exhaustively self-tested.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the four self-test rows (the page's in-page pill runs this exact function) ──────────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B1) WIDER SIGN⟺WINNER over a larger forest bank (seed distinct from the in-page row), and an
//    exact value(G)===0 ⟺ outcome==='P' cross-check. A number is never fuzzy, so N must NEVER appear. ──
{
  const rng = core.makeRng(0xB1EEF);
  let ok = true, bad = '', n = 0, sawN = 0;
  const seen = { L: 0, R: 0, P: 0, N: 0 };
  for (let t = 0; t < 1500 && ok; t++){
    const spec = []; let node = 1; const chains = 1 + ((rng() * 4) | 0);
    for (let c = 0; c < chains; c++){
      let prev = 0; const len = 1 + ((rng() * 5) | 0);
      for (let i = 0; i < len; i++){
        // occasional branch: attach to an earlier node in this chain to make trees, not just chains
        if (i > 1 && rng() < 0.25) prev = prev - ((rng() * 2) | 0);
        const col = rng() < 0.5 ? 'blue' : 'red';
        spec.push({ a: Math.max(0, prev), b: node, c: col }); prev = node; node++;
      }
    }
    const E = core.edgesFrom(spec);
    n++;
    const v = core.value(E), oc = core.outcome(E);
    seen[oc]++;
    if (oc === 'N') sawN++;
    const s = core.dySign(v);
    const cls = s > 0 ? 'L' : s < 0 ? 'R' : 'P';
    const zeroMatch = (s === 0) === (oc === 'P');
    if (cls !== oc || !zeroMatch){ ok = false; bad = core.keyOf(E) + ' sign→' + cls + ' vs ' + oc; }
  }
  line(ok && sawN === 0 && seen.L > 0 && seen.R > 0 && seen.P > 0,
    'B1 · sign⟺winner + value0⟺P over ' + n + ' random blue/red forests/trees, NO N (numbers are never fuzzy)  ::  ' +
    (ok ? 'census L=' + seen.L + ' R=' + seen.R + ' P=' + seen.P + ' N=' + seen.N : 'FAIL at ' + bad));
}

// ── (B2) the COLON PRINCIPLE, EXHAUSTIVE to depth 14 (32766 blue/red stalks): value(stalk) equals the
//    closed-form sign-expansion, exact dyadic, no float drift. Two code-disjoint authorities agree. ──
{
  let ok = true, bad = '', n = 0, maxDen = 1n;
  outer:
  for (let depth = 1; depth <= 14; depth++){
    for (let mask = 0; mask < (1 << depth); mask++){
      const colors = [];
      for (let i = 0; i < depth; i++) colors.push((mask >> i) & 1 ? 'blue' : 'red');
      const v = core.value(core.stalkEdges(colors));
      const cf = core.closedFormStalk(colors.map(c => c === 'blue' ? 'b' : 'r'));
      n++;
      if (v.den > maxDen) maxDen = v.den;
      if (!core.dyEq(v, cf)){ ok = false; bad = colors.join(',') + ' ' + v.num + '/' + v.den + ' vs ' + cf.num + '/' + cf.den; break outer; }
    }
  }
  line(ok, 'B2 · Colon Principle EXHAUSTIVE depth≤14 (' + n + ' stalks): value === closed-form, exact dyadic  ::  ' +
    (ok ? 'all match · deepest 2^' + (maxDen.toString(2).length - 1) : 'FAIL at ' + bad));
}

// ── (B3) the COLON PRINCIPLE at DEPTH 16, SAMPLED (a bank of random depth-15..16 stalks) — the claim in
//    the DoD ("all stalks ≤ depth 16"). Exact rational, integer BigInt numerator over 2^k. ──
{
  const rng = core.makeRng(0xC010D);
  let ok = true, bad = '', n = 0, maxDen = 1n;
  for (let t = 0; t < 4000 && ok; t++){
    const depth = 15 + ((rng() * 2) | 0);   // 15 or 16
    const colors = [];
    for (let i = 0; i < depth; i++) colors.push(rng() < 0.5 ? 'blue' : 'red');
    const v = core.value(core.stalkEdges(colors));
    const cf = core.closedFormStalk(colors.map(c => c === 'blue' ? 'b' : 'r'));
    n++;
    if (v.den > maxDen) maxDen = v.den;
    // assert exact-dyadic invariants: den a power of two, lowest terms (num odd unless den==1).
    const denPow2 = (v.den & (v.den - 1n)) === 0n;
    const lowest = v.den === 1n || (v.num % 2n) !== 0n;
    if (!core.dyEq(v, cf) || !denPow2 || !lowest){ ok = false; bad = colors.join(','); }
  }
  line(ok, 'B3 · Colon Principle depth 15..16 SAMPLED (' + n + ' stalks): value === closed-form, den a power of two, lowest terms  ::  ' +
    (ok ? 'all match · deepest 2^' + (maxDen.toString(2).length - 1) : 'FAIL at ' + bad));
}

// ── (B4) PERFECT PLAY — a seeded tournament. From random decisive Blue-Red starts, the side outcome()
//    says wins, playing bestMove, NEVER loses; AND whenever a winning cut exists bestMove lands on it. ──
{
  const rng = core.makeRng(0x4CE55);
  let starts = 0, defenderLosses = 0, missedWins = 0;
  for (let t = 0; t < 600; t++){
    const spec = []; let node = 1; const chains = 1 + ((rng() * 3) | 0);
    for (let c = 0; c < chains; c++){
      let prev = 0; const len = 1 + ((rng() * 4) | 0);
      for (let i = 0; i < len; i++){ const col = rng() < 0.5 ? 'blue' : 'red'; spec.push({ a: prev, b: node, c: col }); prev = node; node++; }
    }
    let E = core.edgesFrom(spec);
    const oc = core.outcome(E);
    let toMove, winner;
    if (oc === 'L'){ toMove = 'blue'; winner = 'blue'; }
    else if (oc === 'R'){ toMove = 'red'; winner = 'red'; }
    else continue;   // P: mover loses, no winner to defend (N never happens for blue/red)
    starts++;
    let side = toMove, guard = 0;
    while (guard++ < 400){
      const mine = side === 'blue' ? ['blue', 'green'] : ['red', 'green'];
      const cand = E.filter(e => mine.includes(e.color));
      if (cand.length === 0) break;   // side to move cannot move ⇒ it loses
      const oppWins = side === 'blue' ? core.rightWins : core.leftWins;
      const hasWinning = cand.some(e => !oppWins(core.cutEdge(E, e.id)));
      const mv = core.bestMove(E, side);
      if (hasWinning && oppWins(core.cutEdge(E, mv))) missedWins++;
      E = core.cutEdge(E, mv);
      side = side === 'blue' ? 'red' : 'blue';
    }
    const lost = side;   // side to move now has no move ⇒ lost
    const won = lost === 'blue' ? 'red' : 'blue';
    if (won !== winner) defenderLosses++;
  }
  line(defenderLosses === 0 && missedWins === 0,
    'B4 · perfect play (seed 0x4CE55, ' + starts + ' decisive starts): outcome-winner never loses + bestMove lands on a winning cut  ::  ' +
    defenderLosses + ' winner-losses · ' + missedWins + ' missed wins');
}

// ── (B5) VALUE NEGATION SYMMETRY — recolouring a forest blue↔red negates its value EXACTLY, over a bank
//    of random forests. A code-independent structural symmetry of Blue-Red Hackenbush. ──
{
  const rng = core.makeRng(0x5D717);
  let ok = true, bad = '', n = 0;
  for (let t = 0; t < 2000 && ok; t++){
    const spec = []; let node = 1; const chains = 1 + ((rng() * 3) | 0);
    for (let c = 0; c < chains; c++){
      let prev = 0; const len = 1 + ((rng() * 4) | 0);
      for (let i = 0; i < len; i++){ const col = rng() < 0.5 ? 'blue' : 'red'; spec.push({ a: prev, b: node, c: col }); prev = node; node++; }
    }
    const E = core.edgesFrom(spec);
    const Eflip = E.map(e => ({ ...e, color: e.color === 'blue' ? 'red' : e.color === 'red' ? 'blue' : e.color }));
    n++;
    if (!core.dyEq(core.value(Eflip), core.dyNeg(core.value(E)))){ ok = false; bad = core.keyOf(E); }
  }
  line(ok, 'B5 · value negation symmetry: recolour blue↔red negates the value EXACTLY over ' + n + ' forests  ::  ' +
    (ok ? 'all negate exactly' : 'FAIL at ' + bad));
}

// ── (C) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-sentinel.
//    Enforces the anti-drift convention — one oracle, no second copy. ──────────────────────────────
{
  const START = '// ===== VALUE-OF-A-CUT CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END VALUE-OF-A-CUT CORE =====';
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
