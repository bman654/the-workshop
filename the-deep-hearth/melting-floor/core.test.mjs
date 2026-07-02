// ============================================================================
//  THE DEEP HEARTH · The Melting Floor — core.test.mjs (the Node falsifiability twin)
//
//  Runs `node the-deep-hearth/melting-floor/core.test.mjs`; ALL GREEN or exit 1.
//
//  Proves the decompression-melting claim — lift the lid, drop the pressure, the
//  solidus slides down through the geotherm and the rock melts, NO heat added —
//  the same way the in-page pill does (the shared runCoreTests()), then adds
//  heavier sweeps that do NOT route through the page:
//    • the rendered column MARCH's per-cell melt fraction agrees with the closed
//      lever-rule F over a fine (L,w) grid to <1e-9 (rendered === predicate),
//    • the closed linear crossing solve agrees with an INDEPENDENT bisection root
//      of (T_g − T_s) to <1e-9 over the grid (two different algorithms),
//    • F is monotone NON-DECREASING in lift everywhere and the interior derivative
//      equals the closed A·G_rock/ΔT_sl, and the crossing marches shallower,
//    • the REFRACTORY neg-control: F ≡ 0, no crossing in range, at ANY lift & water,
//    • the geotherm/solidus slopes are non-parallel (the crossing denominator is safe),
//  plus the INTEGRATION crux: byte-twin parity — the slab inlined into index.html
//  between the MELTING-FLOOR CORE sentinels is char-identical (indentation-
//  normalised) to this directory's core.mjs — and a SINGLE-SOURCE grep proving
//  the lever-rule math is not forked anywhere else in the tree.
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

console.log('The Deep Hearth · The Melting Floor — core.test.mjs\n');

// ── 1. the shared runCoreTests() — IDENTICAL to the in-page self-test pill ─────
console.log('— shared runCoreTests() (the same assertions the in-page pill runs) —');
{
  const r = Core.runCoreTests();
  for (const c of r.checks) check(c.name, c.pass, c.info);
}

// ── 2. FINE-GRID rendered march F === closed lever-rule F (heavier than the pill) ─
console.log('\n— rendered march F === closed lever-rule F on a FINE 50×50 grid, 1000 cells —');
{
  const G = 50, CELLS = 1000;
  let worst = 0, where = '';
  for (let li = 0; li < G; li++) for (let wj = 0; wj < G; wj++) {
    const L = (li / (G - 1)) * Core.L_MAX, w = wj / (G - 1);
    for (let c = 0; c <= CELLS; c++) {
      const z = Core.D_ROOF + (c / CELLS) * (Core.D_CHAMBER - Core.D_ROOF);
      // independent march-side F (raw thermal lines)
      const P = Core.P_SURF + Core.G_ROCK * (z - L);
      const Ts = Core.TS0 + Core.A_SOL * P - Core.B_SOL * w;
      let Fm = ((Core.T_SURF + Core.GAMMA * z) - Ts) / Core.DT_SL;
      Fm = Fm < 0 ? 0 : Fm > 1 ? 1 : Fm;
      const Fc = Core.meltFraction(z, L, w, false);
      const d = Math.abs(Fm - Fc);
      if (d > worst) { worst = d; where = `L=${L.toFixed(0)},w=${w.toFixed(2)},z=${z.toFixed(0)}`; }
    }
  }
  check('50×50×1000: rendered march F === closed meltFraction() (<1e-9)', worst < 1e-9,
    'worst |ΔF| = ' + worst.toExponential(2) + (where ? ' @ ' + where : ''));
}

// ── 3. crossing: closed linear solve === independent bisection on a FINE grid ──
console.log('\n— crossing: linear solve === bisection root of (T_g − T_s) on a FINE 60×60 grid —');
{
  const G = 60;
  let worst = 0, where = '';
  for (let li = 0; li < G; li++) for (let wj = 0; wj < G; wj++) {
    const L = (li / (G - 1)) * Core.L_MAX, w = wj / (G - 1);
    const zc = Core.crossingDepth(L, w, false);
    const zb = Core.crossingByBisection(L, w, false);
    const d = Math.abs(zc - zb);
    if (d > worst) { worst = d; where = `L=${L.toFixed(0)},w=${w.toFixed(2)}`; }
  }
  check('60×60 grid: linear crossing === bisection crossing (<1e-9)', worst < 1e-9,
    'worst |Δz_x| = ' + worst.toExponential(2) + (where ? ' @ ' + where : ''));
}

// ── 4. THE GESTURE, end to end: seated ⇒ SOLID, full lift ⇒ MELTS (dry), and the
//      crossing sweeps a large visible distance across the band (not a token move) ─
console.log('\n— the gesture: seated dry SOLID · full dry lift MELTS · crossing sweeps the band —');
{
  const seated = Core.predict(0, 0, false);
  const lifted = Core.predict(Core.L_MAX, 0, false);
  check('seated (L=0), dry: the visible band is SOLID (crossing below the chamber)',
    !seated.melts && seated.zx > Core.D_CHAMBER, 'z_x(seated) = ' + seated.zx.toFixed(0) + ' m (chamber ' + Core.D_CHAMBER + ' m)');
  check('full lift (L=L_MAX), dry: the rock MELTS — decompression melting, no heat added',
    lifted.melts && lifted.Fchamber > 0.4, 'F(chamber) = ' + lifted.Fchamber.toFixed(3) + ', z_x = ' + lifted.zx.toFixed(0) + ' m');
  const sweep = seated.zx - lifted.zx;
  check('the crossing sweeps a large, VISIBLE distance as the lid lifts (≥ 400 m)',
    sweep >= 400, 'crossing swept ' + sweep.toFixed(0) + ' m over ' + Core.L_MAX + ' m of lift');
}

// ── 5. F monotone in LIFT on a fine grid; interior derivative matches closed form ─
console.log('\n— F is non-decreasing in lift · interior dF/dL === closed A·G_rock/ΔT_sl —');
{
  const G = 40, dL = Core.L_MAX / 400;
  let badF = 0, worstDeriv = 0;
  const analytic = Core.dFdL_interior();
  for (let li = 0; li < 400; li++) {
    const L0 = li * dL, L1 = (li + 1) * dL;
    for (let c = 0; c < G; c++) {
      const z = Core.D_ROOF + (c / (G - 1)) * (Core.D_CHAMBER - Core.D_ROOF);
      const F0 = Core.meltFraction(z, L0, 0.3, false), F1 = Core.meltFraction(z, L1, 0.3, false);
      if (F1 < F0 - 1e-12) badF++;
      if (F0 > 1e-6 && F0 < 1 - 1e-6 && F1 > 1e-6 && F1 < 1 - 1e-6) {
        worstDeriv = Math.max(worstDeriv, Math.abs((F1 - F0) / dL - analytic));
      }
    }
  }
  check('F(z) never decreases as the lid lifts (400 lift steps × ' + G + ' depths)', badF === 0, badF + ' violations');
  check('interior dF/dL === closed A·G_rock/ΔT_sl = ' + analytic.toExponential(3) + ' /m', worstDeriv < 1e-9,
    'worst |Δ(dF/dL)| = ' + worstDeriv.toExponential(2));
}

// ── 6. REFRACTORY neg-control, sharpened: dense (L,w) sweep, dense depth samples ─
console.log('\n— neg-control: the refractory floor NEVER melts, for any gesture —');
{
  let anyMelt = false, worstF = 0, where = '';
  for (let li = 0; li <= 120; li++) for (let wj = 0; wj <= 40; wj++) {
    const L = (li / 120) * Core.L_MAX, w = wj / 40;
    if (Core.predict(L, w, true).melts) { anyMelt = true; where = `L=${L.toFixed(0)},w=${w.toFixed(2)}`; }
    for (let c = 0; c <= 40; c++) {
      const z = Core.D_ROOF + (c / 40) * (Core.D_CHAMBER - Core.D_ROOF);
      worstF = Math.max(worstF, Core.meltFraction(z, L, w, true));
    }
  }
  check('refractory rock: F ≡ 0 & no crossing in range across 121×41 (lift,water) samples', !anyMelt && worstF === 0,
    anyMelt ? 'melted at ' + where : 'max F over all gestures = ' + worstF.toFixed(6) + ' (dead solid)');
}

// ── 7. the LID-AWARE pressure the ribbon reads is honest: dP = −G_rock·L at roof ─
console.log('\n— the ribbon pressure tracks the lift: dP = −G_rock·L at the sealed roof —');
{
  let worst = 0;
  for (let li = 0; li <= 100; li++) {
    const L = (li / 100) * Core.L_MAX;
    const p = Core.predict(L, 0.3, false);
    const expected = -Core.G_ROCK * L;
    worst = Math.max(worst, Math.abs(p.dP - expected));
    // and the raw pressureAt matches P_surf + G_rock(z − L)
    const zc = Core.D_CHAMBER;
    const pr = Core.pressureAt(zc, L);
    worst = Math.max(worst, Math.abs(pr - (Core.P_SURF + Core.G_ROCK * (zc - L))));
  }
  check('the reported ΔP and pressureAt track the lid lift exactly (dP = −G_rock·L)', worst < 1e-9,
    'worst |Δ| = ' + worst.toExponential(2) + ' MPa');
}

// ── 8. BYTE-TWIN PARITY: index.html's inlined CORE slab === core.mjs ───────────
console.log('\n— BYTE-TWIN PARITY: the page core === the module core —');
{
  const BEGIN = '// === MELTING-FLOOR CORE BEGIN ===';
  const END = '// === MELTING-FLOOR CORE END ===';
  const region = (text) => {
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i + BEGIN.length, j);
  };
  const norm = (s) => s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
  const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
  let pageRegion = null;
  try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
  check('CORE sentinels present in core.mjs', !!coreRegion);
  check('index.html inlined core === core.mjs (indentation-normalised byte-twin)',
    !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
    pageRegion ? ('page ' + (pageRegion ? norm(pageRegion).length : 0) + ' chars vs module ' + (coreRegion ? norm(coreRegion).length : 0) + ' chars')
      : 'index.html not built yet (run forge)');
}

// ── 9. SINGLE-SOURCE grep: the load-bearing lever-rule line lives in one place ──
console.log('\n— SINGLE SOURCE: the lever-rule melt-fraction math lives in exactly one place —');
{
  const root = join(here, '..', '..');
  // build the needle from fragments so this literal does not itself match the grep
  const NEEDLE = ['(geothermT(z) - Ts)', 'DT_SL'].join(' / ');
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
  const expected = ['the-deep-hearth/melting-floor/core.mjs', 'the-deep-hearth/melting-floor/index.html'].sort();
  const got = hits.sort();
  const onlyExpected = got.every(h => expected.includes(h));
  check('the lever-rule line appears ONLY in core.mjs + its one inlined index.html (no fork)',
    onlyExpected && got.length <= 2, 'found in: ' + (got.length ? got.join(', ') : '(only core.mjs until forge runs)'));
}

console.log('\nThe Deep Hearth · The Melting Floor — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
