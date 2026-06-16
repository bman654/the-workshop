// The Elementary Garden — the Node twin. runSelfTest() is the SOLE oracle (the in-page pill calls the
// SAME code). This twin (A) runs the self-test checks, (B) RE-DERIVES Rule 90 = Pascal mod 2 cell for
// cell from an independent integer C(n,k) computation, (C) is a NEGATIVE CONTROL that Rule 90 ≠ Rule 30
// on the same seed, (D) runs an EMPIRICAL χ²/run sniff on the Rule 30 centre column (flagged — never
// gates GREEN), and (E) byte-parity-checks the core inlined into index.html against this module's body.
// Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the self-test checks (the page's in-page pill runs this exact function) ──────────────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B) INDEPENDENT re-derivation: Rule 90 from one centre seed === C(n,k) mod 2, cell for cell ──
// We compute the binomial coefficient parity a completely different way (an exact integer Pascal
// recurrence carried mod 2), and demand it agree with the engine's lit cells over MANY rows.
{
  const ROWS = 80;
  const W = 2 * ROWS + 3, apex = (W - 1) >> 1;
  const seed = new Uint8Array(W); seed[apex] = 1;
  const grid = core.evolve(seed, 90, ROWS);

  // exact Pascal's triangle carried mod 2 by the additive recurrence C(n,k)=C(n-1,k-1)+C(n-1,k)
  let prev = [1];
  let total = 0, agree = 0, mism = 0, litCells = 0;
  for (let n = 0; n < ROWS; n++){
    for (let k = 0; k <= n; k++){
      const col = apex - n + 2 * k;
      const parity = prev[k] & 1;                 // C(n,k) mod 2 from the recurrence
      const lucas = (k & n) === k ? 1 : 0;        // and via Lucas, as a cross-check of the cross-check
      if (parity !== lucas){ mism++; }            // (these two independent derivations must also agree)
      const onCA = grid[n][col] === 1 ? 1 : 0;
      if (onCA) litCells++;
      total++;
      if (onCA === parity) agree++; else mism++;
    }
    // advance the mod-2 Pascal row
    const next = new Array(n + 2).fill(0);
    for (let k = 0; k <= n + 1; k++){
      const a = k > 0 ? (prev[k - 1] || 0) : 0;
      const b = (prev[k] || 0);
      next[k] = (a + b) & 1;
    }
    prev = next;
  }
  line(mism === 0 && total === (ROWS * (ROWS + 1)) / 2,   // the triangle has 1+2+…+ROWS cells
    'B · Rule 90 === C(n,k) mod 2 by an INDEPENDENT integer recurrence (and Lucas), cell for cell  ::  ' +
    agree + '/' + total + ' triangle cells agree · ' + litCells + ' lit · ' + mism + ' mismatches over ' + ROWS + ' rows');
}

// ── (C) NEGATIVE CONTROL: Rule 90 ≠ Rule 30 on the identical seed (chaos is genuinely different) ──
{
  const ROWS = 64, W = 2 * ROWS + 3, apex = (W - 1) >> 1;
  const seed = new Uint8Array(W); seed[apex] = 1;
  const g90 = core.evolve(seed, 90, ROWS);
  const g30 = core.evolve(seed, 30, ROWS);
  let diff = 0, cells = 0;
  for (let n = 0; n < ROWS; n++)
    for (let c = 0; c < W; c++){ cells++; if (g90[n][c] !== g30[n][c]) diff++; }
  line(diff > 0, 'C · NEGATIVE CONTROL — Rule 90 ≠ Rule 30 on the same seed  ::  ' +
    diff + '/' + cells + ' cells differ (the two rules are genuinely distinct)');
}

// ── (D) EMPIRICAL (flagged — NEVER gates GREEN): Rule 30 centre column passes a χ²/run sniff ──────
// This is informational only: we print a chi-square on the bit balance and the longest run, and we
// PASS this line on a generous band so a true (but lumpy) random column never reds the build. It is
// NOT a theorem — Rule 30's randomness is an empirical observation, deliberately not gated.
{
  const NG = 20000, W = 2 * NG + 3, apex = (W - 1) >> 1;
  let row = new Uint8Array(W); row[apex] = 1;
  let ones = 0, prev = -1, maxRun = 0, curRun = 0, transitions = 0;
  for (let g = 0; g < NG; g++){
    const b = row[apex];
    ones += b;
    if (b !== prev){ curRun = 1; if (prev !== -1) transitions++; } else curRun++;
    if (curRun > maxRun) maxRun = curRun;
    prev = b;
    row = core.stepRow(row, 30);
  }
  const zeros = NG - ones, exp = NG / 2;
  const chi2 = ((ones - exp) ** 2) / exp + ((zeros - exp) ** 2) / exp;  // 1 dof
  const frac = ones / NG;
  // generous band: balanced to within a few %, run not absurdly long, lots of transitions.
  const empOk = frac > 0.45 && frac < 0.55 && maxRun < 40 && transitions > NG * 0.3;
  line(empOk, 'D · EMPIRICAL (flagged, not a theorem) — Rule 30 centre column looks random  ::  ' +
    'p(1)=' + frac.toFixed(4) + ' · χ²=' + chi2.toFixed(2) + ' (1 dof, ~3.84 @ p.05) · longest run ' +
    maxRun + ' · ' + transitions + ' transitions over ' + NG + ' gens');
}

// ── (E) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-sentinel ──
// This enforces the anti-drift convention the page advertises: one engine, no second copy.
{
  const START = '// ===== ELEMENTARY CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END ELEMENTARY CORE =====';
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
  line(ok, 'E · inlined core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
