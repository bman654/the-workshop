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
//    CRUX-3  the SMOOTH sine plate matches the single-term analytic harmonic field
//            u = sin(πx)·sinh(πy)/sinh(π) over the WHOLE interior to a tight tol —
//            a genuinely different math object than the ramp, and corner-safe (no
//            Gibbs jump; clean O(h²) edge-to-edge, unlike the fragile step plate).
//  Plus the touchable neg-controls:
//    NEG-A   a Poisson source ρ breaks the mean-value property by EXACTLY ¼ρ at
//            that cell while the rest stays harmonic.
//    NEG-B   an early-stopped bead beaches at the WRONG rim cell / path diverges.
//  Plus: optimal ω beats Gauss–Seidel; a bead always terminates on a Dirichlet gate
//  (the maximum principle); and the WALL — an interior stone bar keeps the mean-
//  value identity on wall-adjacent cells and makes a bead curve AROUND it to a gate.
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

// ── 8. SINGLE-SOURCE grep: the load-bearing solver line (the SOR over-relaxation
//      update) appears ONLY in core.mjs and the pages that INLINE this ONE core —
//      nowhere else in the tree is the math forked. The Casting Floor inlines it;
//      so does the Foundry's Still Pond, which imports THIS core unforked (the
//      deepen mandate). The count-nonzero neighbour gather now serves the wall, but
//      the SOR update line is the unforgeable signature of the relaxer, so it is the
//      needle. Its presence in exactly {core.mjs, casting-floor, still-pond} proves
//      single-source; ANY other hit is a rogue fourth Laplace solver. ─────────────
console.log('\n— SINGLE SOURCE: the relaxation math lives in exactly one place —');
{
  const root = join(here, '..', '..');
  // build the needle from fragments so this literal does not itself match the grep
  const NEEDLE = ['f[i] += omega * (avg', 'f[i]);'].join(' - ');   // the SOR update line
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
  // the SOLE home of the math: core.mjs (the source) + the pages that inline it.
  //   still-pond/index.html appears once the pond is built + forged; before that it
  //   is simply absent (allowed). Any hit OUTSIDE this set is a forbidden fork.
  const allowed = new Set([
    'the-foundry/casting-floor/core.mjs',
    'the-foundry/casting-floor/index.html',
    'the-foundry/still-pond/index.html',
  ]);
  const got = hits.sort();
  const rogue = got.filter(h => !allowed.has(h));
  const hasSource = got.includes('the-foundry/casting-floor/core.mjs');
  check('the SOR update line appears ONLY in core.mjs + the pages that inline it (no forked solver)',
    hasSource && rogue.length === 0,
    'found in: ' + (got.length ? got.join(', ') : '(none — run forge)') +
    (rogue.length ? '  ROGUE: ' + rogue.join(', ') : ''));
}

// ── 9. WALL is a STRICT SUPERSET: with no wall cells the deepened count-nonzero
//      relaxer produces a field BIT-IDENTICAL to the classic ¼·Σ4 case (the two
//      shipped Foundry benches, which never seat a wall, are numerically unchanged).
console.log('\n— WALL is a strict superset: no-wall relax is unchanged (the old benches are safe) —');
{
  const N = 32;
  const bc = (x, y) => Math.sin(2.7 * x) * Math.cos(1.6 * y) + 0.5 * x;
  const g = Core.makeGrid(N);
  Core.clampRim(g, bc);
  for (const i of g.field.keys()) if (g.mask[i] === Core.FREE) g.field[i] = 4.0;
  Core.relax(g, { tol: 1e-11 });
  // reference: the classic pure ¼·(Σ4 + src) relaxer, hand-rolled here (no wall path)
  const gr = Core.makeGrid(N);
  Core.clampRim(gr, bc);
  for (const i of gr.field.keys()) if (gr.mask[i] === Core.FREE) gr.field[i] = 4.0;
  Core.applyFixed(gr);
  const w = Core.optimalOmega(N);
  const classicResidual = () => {
    let worst = 0;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      const i = y * N + x; if (gr.mask[i] !== Core.FREE) continue;
      const avg = 0.25 * (gr.field[i - 1] + gr.field[i + 1] + gr.field[i - N] + gr.field[i + N] + gr.source[i]);
      worst = Math.max(worst, Math.abs(gr.field[i] - avg));
    }
    return worst;
  };
  let r = classicResidual(), s = 0;
  while (r >= 1e-11 && s < 20000) {
    for (const color of [0, 1]) for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
      if (((x + y) & 1) !== color) continue;
      const i = y * N + x; if (gr.mask[i] !== Core.FREE) continue;
      const avg = 0.25 * (gr.field[i - 1] + gr.field[i + 1] + gr.field[i - N] + gr.field[i + N] + gr.source[i]);
      gr.field[i] += w * (avg - gr.field[i]);
    }
    s++; r = classicResidual();
  }
  let worst = 0;
  for (let i = 0; i < N * N; i++) worst = Math.max(worst, Math.abs(g.field[i] - gr.field[i]));
  check('no-wall count-nonzero relaxer === classic ¼·Σ4 relaxer bit-for-bit (strict superset)',
    worst === 0, 'max field diff deepened vs classic = ' + worst.toExponential(2));
}

// ── 10. WALL insulation: a stone bar bisects the plate; a bead can NEVER cross the
//      solid part of the bar (the two sides are separate rooms), yet the mean-value
//      identity holds cell-by-cell right against the stone on BOTH sides. ─────────
console.log('\n— WALL insulation: the stone is a true barrier, and the field stays harmonic beside it —');
{
  for (const N of [33, 49]) {
    const g = Core.makeGrid(N);
    Core.clampRim(g, (x, y) => 1 - 2 * y);         // warm top, cold bottom
    const my = (N - 1) >> 1;
    const gapX = N - 6;
    for (let x = 1; x < gapX; x++) Core.setWall(g, x, my);   // bar with a right-hand gap
    Core.relax(g, { tol: 1e-12 });
    // (a) harmonic beside the stone on both sides
    let worstAdj = 0;
    for (let x = 1; x < gapX; x++) {
      for (const ay of [my - 1, my + 1]) {
        if (g.mask[ay * N + x] !== Core.FREE) continue;
        worstAdj = Math.max(worstAdj, Math.abs(Core.meanValueDefectAt(g, x, ay)));
      }
    }
    // (b) a bead dropped above the SOLID part of the bar never tunnels through it
    const bead = Core.descendGradient(g, 4, my - 3, { maxSteps: 20000 });
    let tunneled = false;
    for (const [px, py] of bead.path) {
      if (g.mask[Math.round(py) * N + Math.round(px)] === Core.WALL) { tunneled = true; break; }
    }
    check('WALL@' + N + ' harmonic on both faces of the stone (mean-value defect < 1e-9)',
      worstAdj < 1e-9, 'worst wall-adjacent defect ' + worstAdj.toExponential(2));
    check('WALL@' + N + ' a bead never steps onto / through the stone',
      !tunneled, 'tunneled=' + tunneled);
  }
}

console.log('\nThe Foundry · The Casting Floor — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
