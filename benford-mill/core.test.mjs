// The Benford Mill — the Node twin. runSelfTest() is the SOLE oracle (the page calls the SAME code).
// This twin (1) runs the 8 self-test checks, (2) adds a deeper-budget HONESTY leg proving the mean χ²
// stays ≈ df=8 over many seeds at several budgets (it does NOT shrink to a fake zero — an honest fit),
// and (3) byte-parity-checks the core inlined into index.html against this module's body. Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the eight self-test checks (the page's in-page pill runs this exact function) ──────────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B) HONESTY leg: the χ² fit is a STATISTIC, not a rigged equality. Over many seeds at each
// budget the MEAN χ² must sit near its degrees of freedom (df=8) — the signature of a correct fit
// to a true model. A rigged "always green" mill would push χ² to ~0; a wrong model would blow it up.
// We demand each budget's mean χ² land in [5, 12] (df=8 ± a comfortable margin). NOT shrinking with N
// is the whole honest point: more grains do NOT make Benford "more exact" — the fit stays a fit. ──
{
  const PASSES = core.PASSES_DEFAULT, trials = 200;
  const budgets = [300, 1500, 6000, 20000];
  let allOk = true, report = [];
  for (const N of budgets){
    let acc = 0;
    for (let s = 0; s < trials; s++){
      const g = core.mill(core.makeHopper(N, 30000 + s), PASSES, 'multiply', '' + (40000 + s));
      acc += core.chiSquared(core.leadingCounts(g)).stat;
    }
    const mean = acc / trials;
    const ok = mean >= 5 && mean <= 12;
    allOk = allOk && ok;
    report.push('N=' + N + '→' + mean.toFixed(2));
  }
  line(allOk, 'B · mean χ² ≈ df=8 across budgets (an honest fit, does NOT collapse to 0)  ::  ' + report.join('  '));
}

// ── (C) the negative control bites HARD at every budget: ADD milling rejects Benford regardless of N
// (the failure is structural, not a small-sample artifact). Min χ² over many seeds must stay ≫ crit. ──
{
  const PASSES = core.PASSES_DEFAULT, trials = 40;
  const crit001 = core.chiSquareCritical(0.001, core.DF);
  let minChi = Infinity, dig8 = 0;
  for (let s = 0; s < trials; s++){
    const g = core.mill(core.makeHopper(1500, 7068 + s), PASSES, 'add', '' + (12158 + s));
    const c = core.leadingCounts(g);
    minChi = Math.min(minChi, core.chiSquared(c).stat);
    if (c.indexOf(Math.max.apply(null, c)) === 7) dig8++;
  }
  line(minChi > crit001 && dig8 === trials,
    'C · ADD control rejects Benford at EVERY seed (min χ² ≫ crit, digit-8 pileup)  ::  minχ²=' +
    minChi.toFixed(0) + ' ≫ ' + crit001.toFixed(1) + ' · dig8 ' + dig8 + '/' + trials);
}

// ── (D) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-sentinel.
// This enforces the anti-drift convention the page advertises: one oracle, no second copy. ──
{
  const START = '// ===== BENFORD-MILL CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END BENFORD-MILL CORE =====';
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
  line(ok, 'D · inlined core in index.html is BYTE-IDENTICAL to core.mjs  ::  ' +
    (modBlock ? modBlock.length : 'n/a') + ' bytes vs ' + (htmlBlock ? htmlBlock.length : 'n/a') + ' bytes');
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
