// ============================================================================
//  core.test.mjs — the headless Node TWIN for The Mechanism Bench.
//
//  Two jobs, both load-bearing:
//   (A) PROOF — import the SOLE authority (core.mjs) and run runSelfTest(); every
//       one of the bench's claims (cognate theorem · Peaucellier · BRIDGE · branch
//       tracking) must pass at machine tolerance. These are the SAME checks the
//       in-page green pill runs, because the page inlines this exact core.
//   (B) ANTI-DRIFT (page slab === module) — extract the block between the
//       MECHANISM-BENCH CORE sentinels from BOTH core.mjs and the shipped
//       index.html and assert they are byte-identical. The page can therefore
//       never silently drift from the proven core.
//
//  Run:  node the-drawing-room/mechanism-bench/core.test.mjs   → all PASS, exit 0.
// ============================================================================
import { runSelfTest, Solver, Cog, loadPreset, makeTable, pinnedSet, branchGuards, dist } from './core.mjs';
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
console.log('\nThe Mechanism Bench — the three claims (runSelfTest, headless):');
const res = runSelfTest();
for (const c of res.checks) check(c.name, c.pass, c.info);

/* an extra twin-only stress: the BRIDGE on the Peaucellier preset too (the in-page
   self-test bridges the four-bar; here we also bridge the straight-line linkage). */
console.log('\nBRIDGE — also on the Peaucellier preset (Newton ≡ exact inversion line):');
{
  const t = loadPreset(makeTable(), 'peaucellier');
  const pp = t.preset;
  const k2 = pp.L * pp.L - pp.ell * pp.ell;
  const pinned = pinnedSet(t), guards = branchGuards(t);
  const a = t.pivots[t.driverAnchor], r = t.driverR;
  const L0 = t.bars.map(b => b.L);
  // closeable arc (mirror core.peauRange)
  const oc = pp.r, lo = pp.L - pp.ell;
  const cosMin = (oc * oc + pp.r * pp.r - lo * lo) / (2 * oc * pp.r);
  const thMin = cosMin >= 1 ? 0 : (cosMin <= -1 ? Math.PI : Math.acos(cosMin));
  const rlo = thMin + 0.08, rhi = 2 * Math.PI - thMin - 0.08;
  let maxBridge = 0, maxBarDev = 0, closed = 0, N = 240;
  for (let i = 0; i <= N; i++) {
    const th = rlo + (rhi - rlo) * i / N;
    t.pivots[t.driver].x = a.x + r * Math.cos(th);
    t.pivots[t.driver].y = a.y + r * Math.sin(th);
    const sres = Solver.relax(t.pivots, t.bars, pinned, { tol: 1e-13, maxIt: 120, branchGuards: guards });
    if (sres.maxResid > 1e-6) continue;
    closed++;
    // closed-form: P is the exact circle-inverse of the SOLVED Q in the circle √k2 about O
    const Q = t.pivots[t.driver], O = pp.O;
    const dx = Q.x - O.x, dy = Q.y - O.y, dd = dx * dx + dy * dy, f = k2 / dd;
    const Pexact = { x: O.x + dx * f, y: O.y + dy * f };
    maxBridge = Math.max(maxBridge, Math.hypot(t.pivots[t.pen].x - Pexact.x, t.pivots[t.pen].y - Pexact.y));
    for (let k = 0; k < t.bars.length; k++) maxBarDev = Math.max(maxBarDev, Math.abs(dist(t.pivots[t.bars[k].i], t.pivots[t.bars[k].j]) - L0[k]));
  }
  check('Peaucellier bridge: Newton-solved pen matches the exact inversion point <1e-6, bars rigid <1e-6',
    maxBridge < 1e-6 && maxBarDev < 1e-6 && closed >= N * 0.9,
    'Newton≡exact=' + maxBridge.toExponential(2) + ' barDrift=' + maxBarDev.toExponential(2) + ' closed=' + closed + '/' + (N + 1));
}

/* ─── (B) anti-drift: the page's inlined slab is byte-identical to core.mjs ── */
console.log('\nAnti-drift — the shipped page inlines the core byte-for-byte:');
const OPEN = '// ===== MECHANISM-BENCH CORE (byte-identical to core.mjs) =====';
const CLOSE = '// ===== END MECHANISM-BENCH CORE =====';
function slab(text, label) {
  const i = text.indexOf(OPEN), j = text.indexOf(CLOSE);
  if (i < 0 || j < 0) throw new Error('sentinels not found in ' + label);
  return text.slice(i, j + CLOSE.length);
}
const coreSrc = readFileSync(join(HERE, 'core.mjs'), 'utf8');
const coreSlab = slab(coreSrc, 'core.mjs');
let pageSlab = null, pageErr = null;
try { pageSlab = slab(readFileSync(join(HERE, 'index.html'), 'utf8'), 'index.html'); }
catch (e) { pageErr = e.message; }
check('the shipped index.html inlines the MECHANISM-BENCH CORE slab byte-for-byte (page slab === module)',
  pageSlab !== null && pageSlab === coreSlab,
  pageErr ? ('index.html: ' + pageErr) : ('slab length = ' + coreSlab.length + ' chars'));

/* ─── summary ─────────────────────────────────────────────────────────────── */
console.log('\n────────────────────────────────────────────────────────────');
console.log('Mechanism Bench twin: ' + pass + '/' + total + ' passed.');
if (fails.length) { console.error('FAILURES: ' + fails.join('; ')); process.exit(1); }
console.log('ALL PASS ✓');
process.exit(0);
