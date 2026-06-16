// Buffon's Needles — the Node twin. runSelfTest() is the SOLE oracle (the page calls the SAME code).
// This twin (1) runs the 4 self-test checks, (2) adds a stronger least-squares 1/sqrt(N) slope check,
// and (3) byte-parity-checks the core inlined into index.html against this module's body. Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the four self-test checks (the page's in-page pill runs this exact function) ──────────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B) extra rigor: least-squares slope of log10(meanErr) vs log10(N) ≈ -0.5 over MANY decades ──
// A flat estimator would give slope ~0; a 1/sqrt(N) law gives exactly -0.5. We span Ns over 3 decades
// and demand the fitted slope sit in [-0.6, -0.4] — a cheap, stronger statement than the ratio check.
{
  const L = 0.8, t = 1.0, trials = 80;
  const Ns = [1000, 3000, 10000, 30000, 100000, 300000, 1000000];
  const xs = [], ys = [];
  for (const N of Ns){
    let e = 0;
    for (let s = 0; s < trials; s++){
      e += Math.abs(core.runBatch(core.makeRng(20000 + N + s), N, L, t).pi - Math.PI);
    }
    e /= trials;
    xs.push(Math.log10(N)); ys.push(Math.log10(e));
  }
  const n = xs.length;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++){ sxy += (xs[i]-mx)*(ys[i]-my); sxx += (xs[i]-mx)*(xs[i]-mx); }
  const slope = sxy / sxx;
  line(slope >= -0.6 && slope <= -0.4,
    'B · least-squares 1/sqrt(N) slope ≈ -0.5 over 3 decades  ::  slope=' + slope.toFixed(3));
}

// ── (C) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-sentinel ──
// This enforces the anti-drift convention the page advertises: one oracle, no second copy.
{
  const START = '// ===== BUFFON CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END BUFFON CORE =====';
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
