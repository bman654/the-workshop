// The Birthday Bench — the Node twin. runSelfTest() is the SOLE oracle (the page calls the SAME
// code). This twin (A) runs the 8 in-page checks, (B) adds two stronger statements — a 1/√N decay
// sweep and a wider √d-trend fit — and (C) byte-parity-checks the core inlined into index.html
// against this module's body. Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as core from './core.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── (A) the eight self-test checks (the page's in-page pill runs this exact function) ──────────
{
  const r = core.runSelfTest();
  console.log('selfTest oracle:', r.passed + '/' + r.total, r.ok ? 'GREEN' : 'RED');
  for (const c of r.checks) line(c.pass, c.name + '  ::  ' + c.info);
}

// ── (B1) 1/√N DECAY SWEEP: the seating Monte-Carlo's worst deviation from exact pClash shrinks
// like 1/√N. We sweep N over {50k, 200k, 800k} and fit log10(maxdev) vs log10(N); a 1/√N law gives
// slope −0.5, demanded in [−0.6, −0.4]. (A flat estimator would give ~0.) ────────────────────────
{
  const d = 365, maxN = 40;
  const Ns = [50000, 200000, 800000];
  const xs = [], ys = [];
  for (const N of Ns){
    const rng = core.makeRng(0xBADA55 + N);
    const clashByN = new Array(maxN + 1).fill(0);
    for (let t = 0; t < N; t++){
      const fc = core.seatUntilClash(rng, d, maxN + 2);
      for (let k = fc; k <= maxN; k++) clashByN[k]++;
    }
    let worst = 0;
    for (let n = 2; n <= maxN; n++){
      const dev = Math.abs(clashByN[n] / N - core.pClash(n, d));
      if (dev > worst) worst = dev;
    }
    xs.push(Math.log10(N)); ys.push(Math.log10(worst));
  }
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++){ sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
  const slope = sxy / sxx;
  line(slope >= -0.6 && slope <= -0.4,
    'B1 · seating-MC maxdev decays ~1/√N (slope ≈ −0.5)  ::  slope=' + slope.toFixed(3) +
    '  maxdevs=[' + ys.map(y => Math.pow(10, y).toExponential(1)).join(', ') + ']');
}

// ── (B2) a WIDER √d-trend fit: ≥ 12 d-values, log-log slope of thresholdN vs d in [0.47, 0.53]. ─
{
  const ds = [49, 64, 100, 128, 169, 256, 365, 400, 512, 729, 1000, 1024, 2048, 4096];
  const xs = ds.map(d => Math.log(d)), ys = ds.map(d => Math.log(core.thresholdN(d)));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++){ sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
  const slope = sxy / sxx;
  line(slope >= 0.47 && slope <= 0.53,
    'B2 · √d trend over ' + ds.length + ' d-values: slope ≈ ½  ::  slope=' + slope.toFixed(4));
}

// ── (C) BYTE-PARITY: the core inlined into index.html === this module's core body, sentinel-to-
// sentinel. Enforces the anti-drift convention — one oracle, no second copy. ──────────────────────
{
  const START = '// ===== BIRTHDAY CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END BIRTHDAY CORE =====';
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
