// ============================================================================
//  THE DEEP HEARTH · The Settling Melt — core.test.mjs (the Node falsifiability twin)
//
//  Runs `node the-deep-hearth/settling-melt/core.test.mjs`; ALL GREEN or exit 1.
//
//  Proves the crystal-settling claim — six phases crystallize in strict liquidus
//  order, a SWEEPING floor removes each crystal from the liquid so the pile is a
//  stratified record and the residue is enriched by exactly 1/F, a STILL floor
//  separates nothing and the core comes up blank — the same way the in-page pill
//  does (the shared runCoreTests()), then adds heavier work that does NOT route
//  through the page:
//    • the MUTATION HARNESS: five planted bugs, each proved to TRIP the check it
//      is supposed to trip (a test that cannot fail is not a test),
//    • a 24×24 (damper, depth) history grid: order holds for all 15 pairs, total
//      and per-component mass close to <1e-9, enrichment ≡ 1/F everywhere,
//    • the ANALYTIC IDENTITY: the mass-weighted mean of the per-band closed-form
//      enrichment telescopes to ln(1/fmin)/(1−fmin) — a third, independent route
//      to the same number,
//    • closed-form band enrichment === Simpson quadrature over the whole core,
//    • a dense STILL neg-control across the grid,
//    • the PAYOFF SHAPE: what pullCore() hands the rack is a well-formed core
//      (slice heights sum to 1, each slice's mix sums to 1) — swept banded,
//      still blank,
//  plus the INTEGRATION crux: byte-twin parity — the slab inlined into index.html
//  between the SETTLING-MELT CORE sentinels is char-identical (indentation-
//  normalised) to this directory's core.mjs — and a SINGLE-SOURCE grep proving
//  the band-enrichment closed form is not forked anywhere else in the tree.
//
//  (The PAYOFF-LIVENESS twin — that the drill actually creates, tags and racks a
//  core on the live path — is a DOM concern and lives in the page as
//  `window.__settlingMelt.liveness()`, driven headlessly; it calls the same real
//  entry functions a visitor's hand does, never a synthetic canvas pointer event.)
// ============================================================================
import * as Core from './core.mjs';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0; const fails = [];
function check(name, cond, info = '') {
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name + (info ? '  ·  ' + info : '')); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Deep Hearth · The Settling Melt — core.test.mjs\n');

// ── 1. the shared runCoreTests() — IDENTICAL to the in-page self-test pill ─────
console.log('— shared runCoreTests() (the same assertions the in-page pill runs) —');
{
  const r = Core.runCoreTests();
  for (const c of r.checks) check(c.name, c.pass, c.info);
}

// ── 2. THE MUTATION HARNESS — every claim is proved falsifiable ────────────────
console.log('\n— mutation harness: each planted bug must TRIP the check it targets —');
{
  const MUTS = [
    { mut: 'order',  needle: 'onset strictly monotone' },
    { mut: 'mass',   needle: 'per-component mass closes' },
    { mut: 'enrich', needle: 'enrichment ≡ 1/F exactly' },
    { mut: 'still',  needle: 'STILL core is UNBANDED' },
    { mut: 'bandE',  needle: 'closed form === Simpson quadrature' },
  ];
  const base = Core.runCoreTests();
  check('the UNMUTATED core passes every check', base.ok, base.passed + '/' + base.total);
  for (const { mut, needle } of MUTS) {
    const r = Core.runCoreTests(mut);
    const targeted = r.checks.filter(c => c.name.includes(needle));
    check(`mutation '${mut}' trips "${needle}"`,
      targeted.length > 0 && targeted.every(c => !c.pass) && !r.ok,
      `${r.total - r.passed}/${r.total} checks fail under the bug`);
  }
}

// ── 3. FINE (damper, depth) GRID — order, mass, and 1/F over 576 histories ─────
console.log('\n— 24×24 history grid: order · mass closure · enrichment ≡ 1/F —');
{
  const G = 24;
  let badOrder = 0, worstTot = 0, worstPer = 0, worstEnr = 0, worstF = 0, where = '';
  for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) {
    const h = Core.history(a / (G - 1), b / (G - 1), true);
    const s = Core.simulate(h);
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
      if (!(s.onset[i] >= 0 && s.onset[i] < s.onset[j])) badOrder++;
    }
    for (const t of s.trace) {
      let sum = 0; for (let i = 0; i < 6; i++) sum += t.melt[i] + t.cum[i];
      if (Math.abs(sum - 1) > worstTot) { worstTot = Math.abs(sum - 1); where = `rate=${h.rate.toFixed(2)},depth=${h.depth.toFixed(2)}`; }
      for (let i = 0; i < 6; i++) worstPer = Math.max(worstPer, Math.abs(t.melt[i] + t.cum[i] - h.frac[i]));
      worstEnr = Math.max(worstEnr, Math.abs(t.Cz * t.F - Core.CZ0));
      worstF = Math.max(worstF, Math.abs(t.F - t.Fledger));
    }
  }
  check(`order holds for all 15 pairs across ${G * G} histories`, badOrder === 0, badOrder + ' violations');
  check('total mass closes across the grid (<1e-9)', worstTot < 1e-9, 'worst ' + worstTot.toExponential(2) + ' @ ' + where);
  check('per-component mass closes across the grid (<1e-9)', worstPer < 1e-9, 'worst ' + worstPer.toExponential(2));
  check('enrichment ≡ 1/F across the grid (<1e-12)', worstEnr < 1e-12, 'worst ' + worstEnr.toExponential(2));
  check('closed-form F === step-marched ledger F across the grid (<1e-9)', worstF < 1e-9, 'worst ' + worstF.toExponential(2));
}

// ── 4. THE ANALYTIC IDENTITY — a THIRD independent route to the enrichment ────
//     Σ_bands (mass · E) telescopes: Σ ln((1−Sa)/(1−Sb)) = ln(1/fmin), and the
//     total crystallized mass is (1−fmin), so the mass-weighted mean band
//     enrichment must be exactly ln(1/fmin)/(1−fmin) — computed from fmin alone,
//     touching neither the march nor the per-band closed form.
console.log('\n— analytic identity: mass-weighted mean band enrichment = ln(1/fmin)/(1−fmin) —');
{
  let worst = 0, where = '';
  for (let a = 0; a <= 12; a++) for (let b = 0; b <= 12; b++) {
    const h = Core.history(a / 12, b / 12, true);
    const c = Core.pullCore(h, Core.simulate(h));
    let mean = 0; for (const s of c.slices) mean += s.h * s.E;
    const analytic = Math.log(1 / h.fmin) / (1 - h.fmin);
    const d = Math.abs(mean - analytic);
    if (d > worst) { worst = d; where = `rate=${h.rate.toFixed(2)},depth=${h.depth.toFixed(2)} (${mean.toFixed(9)} vs ${analytic.toFixed(9)})`; }
  }
  check('mass-weighted mean band enrichment === the closed telescoping value (<1e-9)',
    worst < 1e-9, 'worst |Δ| = ' + worst.toExponential(2) + ' @ ' + where);
}

// ── 5. band enrichment: closed form === Simpson quadrature over WHOLE cores ───
console.log('\n— every band: closed-form enrichment === Simpson quadrature —');
{
  let worst = 0, n = 0;
  for (const [r, d] of [[0.05, 0.1], [0.4, 0.5], [0.8, 0.2], [0.99, 0.95]]) {
    const h = Core.history(r, d, true);
    const c = Core.pullCore(h, Core.simulate(h));
    for (const s of c.slices) {
      n++;
      worst = Math.max(worst, Math.abs(s.E - Core.meanEnrichmentQuad(s.Sa, s.Sb, 200)) / s.E);
    }
  }
  check(`all ${n} bands across 4 cores: closed form === quadrature (relative <1e-12)`, worst < 1e-12,
    'worst |Δ|/E = ' + worst.toExponential(2));
}

// ── 6. DENSE NEG-CONTROL — a STILL floor separates nothing, for ANY history ───
console.log('\n— neg-control: the STILL floor never records anything, for any history —');
{
  let bad = 0, worstBulk = 0, worstVar = 0;
  for (let a = 0; a <= 20; a++) for (let b = 0; b <= 20; b++) {
    const h = Core.history(a / 20, b / 20, false);
    const c = Core.pullCore(h, Core.simulate(h));
    if (c.banded || c.slices.length !== 1 || c.slices[0].E !== 1) bad++;
    worstVar = Math.max(worstVar, Core.bandVar(c));
    for (let i = 0; i < 6; i++) worstBulk = Math.max(worstBulk, Math.abs(c.slices[0].mix[i] - h.frac[i]));
  }
  check('STILL cores are blank across 441 histories (1 slice, E ≡ 1, variance ≡ 0)',
    bad === 0 && worstVar === 0, bad + ' banded; max band variance ' + worstVar);
  check('STILL core bulk === the starting bulk across 441 histories (<1e-12)',
    worstBulk < 1e-12, 'worst |Δ| = ' + worstBulk.toExponential(2));
}

// ── 7. POS-CONTROL + THE PAYOFF SHAPE — what the rack is handed is well-formed ─
console.log('\n— the payoff shape: pullCore() hands the rack a well-formed core —');
{
  const h = Core.history(0.3, 0.6, true);
  const c = Core.pullCore(h, Core.simulate(h));
  let hs = 0, worstMix = 0;
  for (const s of c.slices) { hs += s.h; let m = 0; for (let i = 0; i < 6; i++) m += s.mix[i]; worstMix = Math.max(worstMix, Math.abs(m - 1)); }
  check('SWEPT core: slice heights sum to 1 (<1e-12)', Math.abs(hs - 1) < 1e-12, '|Σh − 1| = ' + Math.abs(hs - 1).toExponential(2));
  check('SWEPT core: every slice mix sums to 1 (<1e-12)', worstMix < 1e-12, 'worst ' + worstMix.toExponential(2));
  check('SWEPT core is banded with a real enrichment gradient to paint',
    c.banded && c.slices.length > 100 && Core.enrichSpread(c) > 4,
    c.slices.length + ' bands, ×' + Core.enrichSpread(c).toFixed(1) + ' bottom-to-top');
  const he = Core.history(0.3, 0.6, false);
  const ce = Core.pullCore(he, Core.simulate(he));
  check('STILL core, same history: blank — one slice, no gradient',
    !ce.banded && ce.slices.length === 1 && Core.enrichSpread(ce) === 1);
  // and the SWEPT/STILL pair really is the same history, differing only by the lever
  check('the pair differs ONLY by the floor lever (same rate, depth, fmin)',
    h.rate === he.rate && h.depth === he.depth && h.fmin === he.fmin,
    'fmin = ' + h.fmin.toFixed(6) + ' both sides');
}

// ── 8. BYTE-TWIN PARITY: index.html's inlined CORE slab === core.mjs ──────────
console.log('\n— BYTE-TWIN PARITY: the page core === the module core —');
{
  const BEGIN = '// === SETTLING-MELT CORE BEGIN ===';
  const END = '// === SETTLING-MELT CORE END ===';
  const region = (text) => {
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  };
  const norm = (s) => s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch { }
  check('CORE sentinels present in core.mjs', !!coreRegion);
  check('index.html inlined core === core.mjs (indentation-normalised byte-twin)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? ('page ' + norm(pageRegion).length + ' chars vs module ' + norm(coreRegion).length + ' chars')
      : 'index.html not built yet (run forge)');
}

// ── 9. SINGLE-SOURCE grep: the band-enrichment closed form lives in one place ──
console.log('\n— SINGLE SOURCE: the band-enrichment closed form lives in exactly one place —');
{
  const root = join(here, '..', '..');
  // build the needle from fragments so this literal does not itself match the grep
  const NEEDLE = ['Math.log1p(d / (1 - Sb))', 'd;'].join(' / ');
  const SELF = fileURLToPath(import.meta.url);
  const hits = [];
  const SKIP = new Set(['.git', 'node_modules']);
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (SKIP.has(name)) continue;
      const p = join(dir, name);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) { walk(p); continue; }
      if (p === SELF) continue;
      if (!/\.(mjs|js|html)$/.test(name)) continue;
      let txt; try { txt = readFileSync(p, 'utf8'); } catch { continue; }
      if (txt.includes(NEEDLE)) hits.push(p.replace(root + '/', ''));
    }
  };
  walk(root);
  const expected = ['the-deep-hearth/settling-melt/core.mjs', 'the-deep-hearth/settling-melt/index.html'];
  const got = hits.sort();
  check('the enrichment closed form appears ONLY in core.mjs + its one inlined index.html (no fork)',
    got.every(h => expected.includes(h)) && got.length <= 2,
    'found in: ' + (got.length ? got.join(', ') : '(only core.mjs until forge runs)'));
}

console.log('\nThe Deep Hearth · The Settling Melt — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
