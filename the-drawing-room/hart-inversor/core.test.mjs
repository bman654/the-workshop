// ============================================================================
//  core.test.mjs — the headless Node TWIN for Hart's Inversor.
//
//  Three jobs, all load-bearing:
//   (A) PROOF — import the SOLE authority (core.mjs) and run runSelfTest(); every
//       one of the five claims (exact line · inversion invariant · rigidity ·
//       fold/branch guard · neg-control) must pass at machine tolerance. These are
//       the SAME checks the in-page green pill runs, because the page inlines this
//       exact core.
//   (B) PAYOFF-LIVENESS — drive the REAL crank/render path (buildHart → crankTo →
//       penPoint, exactly what the page's animation loop calls) across the closeable
//       sweep and assert the produced Q-locus is dead straight (max-dev ≤ ε); then
//       trigger the OFF-SPEC detune AND (separately) the parallelogram fold-flip on
//       the live path and assert the deviation actually BLOWS UP — the experience,
//       not only the unit test.
//   (C) ANTI-DRIFT (page slab === module) — extract the block between the
//       HART-INVERSOR CORE sentinels from BOTH core.mjs and the shipped index.html
//       and assert they are byte-identical, so the rendered bench can never
//       silently drift from the proven core.
//
//  Run:  node the-drawing-room/hart-inversor/core.test.mjs   → all PASS, exit 0.
// ============================================================================
import { runSelfTest, buildHart, crankTo, crankRange, penPoint, polePoint, crankPoint, dist, lineFitMaxDev } from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0; const fails = [];
function check(name, cond, detail) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  (' + detail + ')' : '')); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name + (detail ? '  (' + detail + ')' : '')); }
}

/* ─── (A) the proof: the bench's own self-test, headless ──────────────────── */
console.log('\nHart\'s Inversor — the five claims (runSelfTest, headless):');
const res = runSelfTest();
for (const c of res.checks) check(c.name, c.pass, c.info);

/* drive the REAL crank/render path and collect the Q-locus (what the page draws) */
function driveLocus(opts) {
  const t = buildHart(opts);
  const rng = crankRange(t), N = 260, pts = [];
  for (let i = 0; i <= N; i++) {
    const th = rng.lo + (rng.hi - rng.lo) * i / N;
    const r = crankTo(t, th);
    if (r.maxResid < 1e-8) pts.push(penPoint(t));
  }
  return pts;
}

/* ─── (B) payoff-liveness: the straight line fires, the break blows it up ──── */
console.log('\nPayoff-liveness — the REAL crank path draws the line, the break bows it:');
{
  const trueLocus = driveLocus({});
  const trueDev = lineFitMaxDev(trueLocus);
  check('LIVE crank sweep inks a straight Q-locus (max-dev ≤ 1e-9) with a real span',
    trueLocus.length > 200 && trueDev < 1e-9 && dist(trueLocus[0], trueLocus[trueLocus.length - 1]) > 0.6,
    'trueDev=' + trueDev.toExponential(2) + ' n=' + trueLocus.length + ' span=' + dist(trueLocus[0], trueLocus[trueLocus.length - 1]).toFixed(3));

  const bowLocus = driveLocus({ detune: 0.06 });
  const bowDev = lineFitMaxDev(bowLocus);
  check('OFF-SPEC detune on the LIVE path bows the locus ≫ tol (payoff break fires)',
    bowLocus.length > 200 && bowDev > 1e-3 && bowDev > trueDev * 1e6,
    'bowDev=' + bowDev.toExponential(2) + ' vs trueDev=' + trueDev.toExponential(2));

  const foldLocus = driveLocus({ crossed: false });
  const foldDev = lineFitMaxDev(foldLocus);
  check('the FOLD-FLIP (parallelogram) on the LIVE path leaves the line ≫ tol',
    foldLocus.length > 100 && foldDev > 1e-3,
    'foldDev=' + foldDev.toExponential(2) + ' n=' + foldLocus.length);
}

/* ─── (C) anti-drift: the page's inlined slab is byte-identical to core.mjs ── */
console.log('\nAnti-drift — the shipped page inlines the core byte-for-byte:');
const OPEN = '// ===== HART-INVERSOR CORE (byte-identical to core.mjs) =====';
const CLOSE = '// ===== END HART-INVERSOR CORE =====';
function slab(text, label) {
  const i = text.indexOf(OPEN), j = text.indexOf(CLOSE);
  if (i < 0 || j < 0) throw new Error('sentinels not found in ' + label);
  return text.slice(i, j + CLOSE.length);
}
const coreSlab = slab(readFileSync(join(HERE, 'core.mjs'), 'utf8'), 'core.mjs');
let pageSlab = null, pageErr = null;
try { pageSlab = slab(readFileSync(join(HERE, 'index.html'), 'utf8'), 'index.html'); }
catch (e) { pageErr = e.message; }
check('the shipped index.html inlines the HART-INVERSOR CORE slab byte-for-byte (page slab === module)',
  pageSlab !== null && pageSlab === coreSlab,
  pageErr ? ('index.html: ' + pageErr) : ('slab length = ' + coreSlab.length + ' chars'));

/* ─── summary ─────────────────────────────────────────────────────────────── */
console.log('\n────────────────────────────────────────────────────────────');
console.log('Hart\'s Inversor twin: ' + pass + '/' + total + ' passed.');
if (fails.length) { console.error('FAILURES: ' + fails.join('; ')); process.exit(1); }
console.log('ALL PASS ✓');
process.exit(0);
