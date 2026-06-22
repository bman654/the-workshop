// ============================================================================
//  THE FOUNDRY · The Casting Floor — core.test.mjs (the Node falsifiability twin)
//
//  Runs `node the-foundry/casting-floor/core.test.mjs`; ALL GREEN or exit 1.
//
//  Proves the one claim (a pinned Dirichlet rim determines a unique harmonic
//  interior the field SETTLES to) TWO independent ways, never both routed through
//  the same relaxer:
//    CRUX-1  mean-value EVERYWHERE: residual ‖∇²T‖∞ < tol at every interior cell.
//    CRUX-2  linear ramp T=ax+by reproduced to a TIGHT tol vs a closed-form oracle
//            (a linear field is exactly harmonic — no sweep in the oracle).
//    CRUX-3  one-hot-edge matches the analytic Fourier-sine Σ (a genuinely
//            different math object than the ramp) to a looser, Gibbs-safe tol.
//  Plus the touchable neg-controls:
//    NEG-A   a Poisson source ρ breaks the mean-value property by EXACTLY ¼ρ at
//            that cell while the rest stays harmonic.
//    NEG-B   an early-stopped bead beaches at the WRONG rim cell / path diverges.
//  Plus: optimal ω beats Gauss–Seidel, and a bead always terminates on a
//  Dirichlet gate (the maximum principle).
//
//  And the INTEGRATION crux: byte-twin parity — the slab inlined into index.html
//  between the CASTING-FLOOR CORE sentinels is char-identical (indentation-
//  normalised) to this directory's core.mjs — plus a SINGLE-SOURCE grep proving
//  there is no second copy of the math anywhere in the tree.
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

console.log('The Foundry · The Casting Floor — core.test.mjs\n');

// ── 1. the shared runCoreTests() — IDENTICAL to the in-page self-test pill ─────
console.log('— shared runCoreTests() (the same assertions the in-page pill runs) —');
{
  const r = Core.runCoreTests();
  for (const c of r.checks) check(c.name, c.pass, c.info);
}

// ── 2. CRUX-2 anti-circular at MULTIPLE N (the closed-form oracle holds as N
//      changes — proving ω = 2/(1+sin(π/N)) is computed from N, not hardcoded) ──
console.log('\n— CRUX-2 linear-ramp oracle holds across grid sizes (ω derived from N) —');
{
  let worstAll = 0, worstN = 0;
  for (const N of [16, 24, 32, 40, 48]) {
    const a = 1.7, b = 2.9;
    const g = Core.makeGrid(N);
    Core.clampRim(g, (x, y) => a * x + b * y);
    for (const i of g.field.keys()) if (g.mask[i] === Core.FREE) g.field[i] = -3.0;
    Core.relax(g, { tol: 1e-12 });
    let worst = 0;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const d = Math.abs(g.field[y * N + x] - Core.linearRampOracle(a, b, N, x, y));
      if (d > worst) worst = d;
    }
    if (worst > worstAll) { worstAll = worst; worstN = N; }
  }
  check('CRUX-2★ linear ramp exact at N ∈ {16,24,32,40,48} (ω = 2/(1+sin(π/N)) is non-brittle)',
    worstAll < 1e-6, 'worst ' + worstAll.toExponential(2) + ' @ N=' + worstN);
}

// ── 3. ω is genuinely derived: assert optimalOmega(N) matches the formula and is
//      in (1,2) and approaches 2 as N grows (not a hardcoded 1.9) ──────────────
console.log('\n— ω is derived from the ACTUAL N (never hardcoded) —');
{
  let okFormula = true, okBand = true, mono = true, prev = 0;
  for (const N of [8, 16, 32, 64, 128]) {
    const w = Core.optimalOmega(N);
    const want = 2 / (1 + Math.sin(Math.PI / N));
    if (Math.abs(w - want) > 1e-15) okFormula = false;
    if (!(w > 1 && w < 2)) okBand = false;
    if (w <= prev) mono = false; prev = w;
  }
  check('ω = 2/(1+sin(π/N)) exactly, ∈ (1,2), increasing toward 2 with N (not a magic 1.9)',
    okFormula && okBand && mono, 'ω(32)=' + Core.optimalOmega(32).toFixed(4) + ', ω(128)=' + Core.optimalOmega(128).toFixed(4));
}

// ── 4. red-black coloring is ORDER-INDEPENDENT within a colour: a forward sweep
//      and a reversed-traversal sweep over the same colour produce the same field
//      (each colour reads only the OTHER colour) ─────────────────────────────────
console.log('\n— red-black coloring is order-independent within a colour —');
{
  const N = 24;
  const seed = (g) => { Core.clampRim(g, (x, y) => Math.sin(2 * x) + y);
    for (const i of g.field.keys()) if (g.mask[i] === Core.FREE) g.field[i] = 0.5 * (i % 7); };
  const ga = Core.makeGrid(N); seed(ga); Core.applyFixed(ga);
  const gb = Core.makeGrid(N); seed(gb); Core.applyFixed(gb);
  const w = Core.optimalOmega(N);
  // ga: the library's red-then-black sweep
  Core.sweepRedBlack(ga, w);
  // gb: red colour updated in a hand-rolled REVERSED order, then black reversed
  for (const color of [0, 1]) {
    for (let y = N - 2; y >= 1; y--) for (let x = N - 2; x >= 1; x--) {
      if (((x + y) & 1) !== color) continue;
      const ix = y * N + x;
      if (gb.mask[ix] !== Core.FREE) continue;
      const mean = 0.25 * (gb.field[ix - 1] + gb.field[ix + 1] + gb.field[ix - N] + gb.field[ix + N] + gb.source[ix]);
      gb.field[ix] += w * (mean - gb.field[ix]);
    }
  }
  let worst = 0;
  for (let i = 0; i < N * N; i++) worst = Math.max(worst, Math.abs(ga.field[i] - gb.field[i]));
  check('within a colour the update order does not matter (red/black decouples the grid)',
    worst < 1e-15, 'max field diff forward vs reversed = ' + worst.toExponential(2));
}

// ── 5. ω > 2 DIVERGES (the instability dial's far end is a real, tested control) —
console.log('\n— ω > 2 makes the iteration diverge (the touchable instability control) —');
{
  const N = 32;
  const g = Core.makeGrid(N);
  Core.clampRim(g, (x, y) => Math.sin(2 * x) + y);
  for (const i of g.field.keys()) if (g.mask[i] === Core.FREE) g.field[i] = 1.0;
  Core.applyFixed(g);
  for (let s = 0; s < 200; s++) Core.sweepRedBlack(g, 2.05);   // unstable ω
  const r = Core.residualInf(g);
  check('ω = 2.05 (> 2) diverges — residual blows up instead of settling',
    !isFinite(r) || r > 1e3, 'residual after 200 unstable sweeps = ' + r.toExponential(2));
}

// ── 6. forget-the-pour: TWO wildly different initial guesses converge to the SAME
//      field (uniqueness of the Dirichlet solution — the pour is forgotten) ──────
console.log('\n— the casting forgets the pour: any initial guess settles to ONE field —');
{
  const N = 32;
  const bc = (x, y) => Math.sin(2.7 * x) * Math.cos(1.6 * y) + 0.5 * x;
  const ga = Core.makeGrid(N), gb = Core.makeGrid(N);
  Core.clampRim(ga, bc); Core.clampRim(gb, bc);
  for (const i of ga.field.keys()) if (ga.mask[i] === Core.FREE) ga.field[i] = 12.0;        // hot pour
  for (const i of gb.field.keys()) if (gb.mask[i] === Core.FREE) gb.field[i] = -9.0 + (i % 5); // cold messy pour
  Core.relax(ga, { tol: 1e-10 }); Core.relax(gb, { tol: 1e-10 });
  let worst = 0;
  for (let i = 0; i < N * N; i++) worst = Math.max(worst, Math.abs(ga.field[i] - gb.field[i]));
  check('two opposite molten pours relax to the SAME field (Dirichlet solution is unique)',
    worst < 1e-7, 'max difference between the two settled fields = ' + worst.toExponential(2));
}

// ── 7. BYTE-TWIN PARITY: index.html's inlined CORE slab === core.mjs ───────────
console.log('\n— BYTE-TWIN PARITY: the page core === the module core —');
{
  const BEGIN = '// === CASTING-FLOOR CORE BEGIN ===';
  const END = '// === CASTING-FLOOR CORE END ===';
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

// ── 8. SINGLE-SOURCE grep: the load-bearing solver line (the SOR 4-neighbour
//      average) appears ONLY in core.mjs and the ONE inlined index.html — nowhere
//      else in the tree is the math forked ─────────────────────────────────────
console.log('\n— SINGLE SOURCE: the relaxation math lives in exactly one place —');
{
  const root = join(here, '..', '..');
  // build the needle from fragments so this literal does not itself match the grep
  const NEEDLE = ['avg = 0.25 * (f[i - 1]', 'f[i + 1]', 'f[i - N]', 'f[i + N]', 'src[i])'].join(' + ');
  const SELF = fileURLToPath(import.meta.url);   // this test file is the harness, not a fork
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
  // expected: core.mjs (the source) + casting-floor/index.html (the one inline)
  const expected = ['the-foundry/casting-floor/core.mjs', 'the-foundry/casting-floor/index.html'].sort();
  const got = hits.sort();
  const onlyExpected = got.every(h => expected.includes(h));
  check('the SOR sweep line appears ONLY in core.mjs + its one inlined index.html (no fork)',
    onlyExpected && got.length <= 2, 'found in: ' + (got.length ? got.join(', ') : '(only core.mjs until forge runs)'));
}

console.log('\nThe Foundry · The Casting Floor — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
