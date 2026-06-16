// The Reckoning Cabinet — the Node twin.
// The landing makes exactly ONE exact math claim (the hero's slide-rule identity,
// log a + log b == log(a·b)); everything else is representation. This twin extracts
// the SAME RECKONING_CORE slab the page runs (sentinel-to-sentinel, no parallel copy),
// evals it, and asserts the claim EXACT plus the cabinet's structural invariants.
// Exit 0 = GREEN.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const line = (ok, msg) => { if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg); };

// ── extract the core slab from index.html and eval it (one oracle, no second copy) ──
const START = '// ===== RECKONING CORE (byte-identical to the slab the Node twin evals) =====';
const END = '// ===== END RECKONING CORE =====';
const html = readFileSync(join(here, 'index.html'), 'utf8');
const i = html.indexOf(START), j = html.indexOf(END);
if (i < 0 || j < 0) { console.error('FAIL · could not find the RECKONING CORE sentinels'); process.exit(1); }
const slab = html.slice(i, j + END.length);
// the slab declares `const RECKONING_CORE = ...`; expose it from the eval.
const CORE = (new Function(slab + '\nreturn RECKONING_CORE;'))();

// ── (A) THE exact math claim: the slide-rule identity log a + log b == log(a·b) ──
{
  // the default register, 2×3=6, to 1e-9 and the product exact
  const c = CORE.slideRuleProduct(2, 3);
  line(Math.abs(c.sumOfLogs - c.logProduct) < 1e-9,
    'A1 · log a + log b == log(a·b) for 2×3  ::  |Δ|=' + Math.abs(c.sumOfLogs - c.logProduct).toExponential(2));
  line(c.product === 6, 'A2 · 2×3 product is exactly 6  ::  ' + c.product);

  // the identity is not a fluke of one input: it holds across the whole single-digit grid
  let worst = 0;
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    const r = CORE.slideRuleProduct(a, b);
    worst = Math.max(worst, Math.abs(r.sumOfLogs - r.logProduct));
    if (r.product !== a * b) { line(false, 'A3 · product exact for ' + a + '×' + b); }
  }
  line(worst < 1e-9, 'A3 · identity holds across the full 1..9 × 1..9 grid  ::  worst |Δ|=' + worst.toExponential(2));
}

// ── (B) the abacus genuinely STANDS the value (soroban decomposition heaven×5 + earth×1) ──
{
  const r6 = CORE.sorobanRod(6);
  line(r6.heaven === 1 && r6.earth === 1 && r6.value === 6,
    'B1 · soroban stands 6 as 1 heaven (×5) + 1 earth (×1)  ::  ' + JSON.stringify(r6));
  let bad = 0;
  for (let v = 0; v <= 9; v++) { const r = CORE.sorobanRod(v); if (r.value !== v || r.earth > 4 || r.heaven > 1) bad++; }
  line(bad === 0, 'B2 · soroban decomposition reconstructs every digit 0..9  ::  ' + (10 - bad) + '/10');
}

// ── (C) the cabinet's structural invariants (mirrors the in-page wiring test) ──
{
  line(CORE.STATION_IDS.length === 5, 'C1 · five stations declared  ::  ' + CORE.STATION_IDS.join(','));
  line(CORE.OFFSITE === 'gnomon', 'C2 · the gnomon is the sole offsite station  ::  ' + CORE.OFFSITE);
  line(!CORE.STATION_IDS.includes('nomograph'), 'C3 · the Nomograph is NOT a built station (the lacuna)');
}

// ── (D) every station the landing names resolves to a real index.html on disk ──
{
  const hrefs = {
    slipstick: '../slipstick/index.html', astrolabe: '../astrolabe/index.html',
    planimeter: '../planimeter/index.html', abacus: '../abacus/index.html',
    gnomon: '../hours/index.html',
  };
  for (const id of CORE.STATION_IDS) {
    let exists = false;
    try { readFileSync(join(here, hrefs[id])); exists = true; } catch (e) { exists = false; }
    line(exists, 'D · station "' + id + '" resolves to a live page  ::  ' + hrefs[id]);
  }
}

console.log(fails === 0 ? '\nALL GREEN ✓' : '\n' + fails + ' FAILED ✗');
process.exit(fails === 0 ? 0 : 1);
