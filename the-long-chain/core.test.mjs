// The Long Chain — the Node twin. runSelfTest() is the SOLE oracle (the page's green
// pill calls the SAME code). This twin (A) runs the in-page self-test, (B) re-proves the
// 3×3-dots perfect margin two independent ways + checks the D4 canon against a no-symmetry
// brute force, (C) proves the chain-parity oracle agrees with the edge solver across a
// battery of chain shapes, (D) proves sacrifice-2 STRICTLY dominates greedy-take by the
// exactly-enumerated +2 margin AND the all-short neg-control inverts it, and (E) byte-parity
// checks the core inlined into index.html against this module's slab + forge --check current.
// Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the in-page self-test oracle: the 5 checks the green pill runs ──────────────────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, 'A · ' + c.name + '  ::  ' + c.info);
}

// ── (B) THE 3×3-DOTS MARGIN, two ways + canon soundness. M* = +2 (first player 3–1). The
// canonical-key solver must equal a no-symmetry brute force (the D4 fold cannot drift values). ──
{
  const g = core.makeGeom(3, 3);
  const board = core.makeBoard(g);
  const M = board.rootMargin();
  const brute = core.bruteMargin(3, 3, 0);
  line(M === 2, 'B · 3×3-dots perfect-play margin == +2  ::  M* = ' + M);
  line(M === brute, 'B · canonical solver == no-symmetry brute force  ::  canon ' + M + ' vs brute ' + brute);
  line(board.nodeCount <= core.HARD_CAP && board.nodeCount > 0, 'B · solved under HARD_CAP  ::  ' + board.nodeCount + ' canonical nodes ≤ ' + core.HARD_CAP);
  // perfect-vs-perfect self-play reaches exactly +2 on the live board.
  const pp = core.playFrom(board, core.perfectPlayer, core.perfectPlayer, 0);
  line(pp.diff === 2 && pp.sc[0] === 3 && pp.sc[1] === 1,
    'B · perfect-vs-perfect plays out to 3–1 (diff +2)  ::  ' + pp.sc.join('–') + ' diff ' + pp.diff);
}

// ── (C) THE CHAIN-PARITY ORACLE (code-disjoint) == the edge-level solver, on a battery of
// fresh single long chains (the opener loses all L). Also: a no-symmetry brute on the chain
// board confirms the canon there too. ──
{
  const fails0 = [];
  for (const L of [2, 3, 4, 5, 6]) {
    const edgeM = core.freshChainMargin(L);
    const oracleM = core.chainEndgameValue([L], false);
    const { g, pf } = core.freshChainPrefill(L);
    const bruteM = core.bruteMargin(g.p, g.q, pf);
    if (edgeM !== -L || oracleM !== -L || bruteM !== -L) fails0.push(`L=${L} edge${edgeM} oracle${oracleM} brute${bruteM}`);
  }
  line(fails0.length === 0, 'C · oracle == edge solver == brute on fresh chains L∈{2..6} (all −L)  ::  ' + (fails0.join('; ') || 'agree'));
  // multi-chain oracle parity: an ODD number of equal long chains leaves the OPENER in
  // control (net improves), an EVEN number hands control away — the chain-rule parity.
  const odd = core.chainEndgameValue([3, 3, 3], false);   // 3 long chains
  const even = core.chainEndgameValue([3, 3], false);     // 2 long chains
  line(odd === -1 && even === -2, 'C · chain-parity: [3,3,3] opener net −1 vs [3,3] −2 (parity controls)  ::  odd ' + odd + ' even ' + even);
}

// ── (D) SACRIFICE-2 STRICTLY DOMINATES GREEDY-TAKE, exactly enumerated. Receiver handed an
// open 3-chain with another 3-chain closed: TAKE-ALL nets the receiver 0, DOUBLE-CROSS nets +2.
// Plus the NEG-CONTROL: a board of only short chains where greedy IS optimal (gap 0). ──
{
  const dc = core.doubleCrossLab();
  line(dc.takeAll === 0 && dc.dcross === 2 && dc.gap === 2,
    'D · sacrifice-2 beats greedy-take by EXACTLY +2  ::  take-all ' + dc.takeAll + ', double-cross ' + dc.dcross + ', gap ' + dc.gap);
  const neg = core.negControl();
  line(neg.greedyOptimal && neg.greedyMargin === neg.perfectMargin,
    'D · NEG-CONTROL: all-short board — greedy IS optimal (no long chain to exploit)  ::  greedy ' + neg.greedyMargin + ' == perfect ' + neg.perfectMargin);
  // and on the neg-control board the long-chain decomposition has ZERO long chains —
  // so "control via double-cross" is vacuous there, confirming the lesson is LONG chains.
  const g = core.makeGeom(2, 3);
  let pf = 0; for (let c = 0; c < 2; c++) { pf |= (1 << g.hIndex(0, c)); pf |= (1 << g.hIndex(1, c)); } pf |= (1 << g.vIndex(0, 1));
  const comps = core.chainsOf(pf >>> 0, g);
  const longs = comps.filter((n) => n >= 3).length;
  line(longs === 0, 'D · neg-control board has ZERO long chains (parity heuristic N/A)  ::  chains ' + JSON.stringify(comps));
}

// ── (E) BYTE-PARITY: the core inlined into index.html is byte-identical to this module's
// sentinel-to-sentinel slab; and forge --check reports the page's includes current. ──
{
  const START = '// ===== THE LONG CHAIN CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END THE LONG CHAIN CORE =====';
  const slab = (text) => { const i = text.indexOf(START), j = text.indexOf(END); if (i < 0 || j < 0) return null; return text.slice(i, j + END.length); };
  const modBlock = slab(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let htmlBlock = null;
  try { htmlBlock = slab(readFileSync(join(here, 'index.html'), 'utf8')); } catch (e) { /* page not forged yet */ }
  const ok = modBlock !== null && htmlBlock !== null && modBlock === htmlBlock;
  line(ok, 'E · inlined core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
  // forge --check on the page (engine + def includes current).
  try {
    const out = execFileSync('node', [join(here, '..', 'tools', 'forge', 'forge.mjs'), '--check', join(here, 'index.src.html')], { encoding: 'utf8' });
    const clean = /current|up to date|no drift|✓/i.test(out) && !/stale|drift/i.test(out);
    line(clean, 'E · forge --check clean for index.src.html  ::  ' + out.trim().split('\n').slice(-1)[0]);
  } catch (e) {
    line(false, 'E · forge --check FAILED  ::  ' + (e.stdout || e.message || '').toString().trim().split('\n').slice(-1)[0]);
  }
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
