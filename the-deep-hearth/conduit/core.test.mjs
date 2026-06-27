// ============================================================================
//  THE DEEP HEARTH · The Conduit — core.test.mjs (the Node falsifiability twin)
//
//  Runs `node the-deep-hearth/conduit/core.test.mjs`; ALL GREEN or exit 1.
//
//  Proves the one claim — EFFUSIVE vs EXPLOSIVE is decided by φ reaching ¾ —
//  the same way the in-page pill does (the shared runCoreTests()), then adds
//  heavier sweeps that do NOT route through the page:
//    • the rendered column MARCH agrees with the closed-form φ_max predicate over
//      a fine dial grid with ZERO disagreements (rendered === predicate),
//    • the boundary is monotone in BOTH dials and its threshold curve w*(S) is
//      non-increasing in silica,
//    • the neg-controls: gas→0 ⇒ nothing fragments; basalt ⇒ even max gas is
//      effusive,
//    • φ_max sits AT the vent (φ is monotone ↑ toward the vent),
//  plus the INTEGRATION crux: byte-twin parity — the slab inlined into index.html
//  between the DEEP-HEARTH CORE sentinels is char-identical (indentation-
//  normalised) to this directory's core.mjs — and a SINGLE-SOURCE grep proving
//  the predicate math is not forked anywhere else in the tree.
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

console.log('The Deep Hearth · The Conduit — core.test.mjs\n');

// ── 1. the shared runCoreTests() — IDENTICAL to the in-page self-test pill ─────
console.log('— shared runCoreTests() (the same assertions the in-page pill runs) —');
{
  const r = Core.runCoreTests();
  for (const c of r.checks) check(c.name, c.pass, c.info);
}

// ── 2. φ IS MONOTONE ↑ TOWARD THE VENT (so φ_max really is at the vent and z_f is
//      a unique crossing) — checked for a spread of dial settings ───────────────
console.log('\n— φ(h) is monotone increasing toward the vent (φ_max sits at the vent) —');
{
  let worstDrop = 0, where = '';
  for (const S of [0.2, 0.5, 0.8, 1.0]) for (const w of [0.2, 0.5, 0.8, 1.0]) {
    let prev = -1;
    for (let i = 0; i <= 500; i++) {
      const h = (i / 500) * Core.H_CONDUIT;
      const phi = Core.phiAt(S, w, h);
      const drop = prev - phi;            // any DECREASE as we rise is a violation
      if (drop > worstDrop) { worstDrop = drop; where = `S=${S},w=${w},h=${h.toFixed(0)}`; }
      prev = phi;
    }
  }
  check('φ never decreases as the column rises (φ_max = φ at the vent)', worstDrop < 1e-12,
    'worst upward φ-drop = ' + worstDrop.toExponential(2) + (where ? ' @ ' + where : ''));
}

// ── 3. FINE-GRID rendered===predicate at higher resolution than the pill grid ──
console.log('\n— rendered march === predicate on a FINE 60×60 grid (heavier than the pill) —');
{
  const G = 60;
  let disagree = 0, worstZ = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const S = i / (G - 1), w = j / (G - 1);
    const p = Core.predict(S, w), m = Core.marchColumn(S, w, 1200);
    if (p.explosive !== m.explosive) disagree++;
    else if (p.explosive) worstZ = Math.max(worstZ, Math.abs(p.zf - m.zfMarch));
  }
  check('60×60 grid: closed predicate === forward march, ZERO disagreements', disagree === 0, disagree + ' disagreements');
  check('60×60 grid: marched z_f matches closed z_f to the march step', worstZ < (Core.H_CONDUIT / 1200) * 2 + 1e-6,
    'worst |Δz_f| = ' + worstZ.toFixed(3) + ' m');
}

// ── 4. NEG-CONTROLS, sharpened ─────────────────────────────────────────────────
console.log('\n— neg-controls: zero gas inert · basalt cannot blast —');
{
  let anyZero = false;
  for (let i = 0; i <= 200; i++) { const S = i / 200; if (Core.predict(S, 0).explosive) anyZero = true; }
  check('gas→0: NO silica value (0…1, 201 samples) ever fragments', !anyZero, anyZero ? 'a silica fragmented at zero gas' : 'all effusive');

  let basaltEverBlasts = false, worstPhi = 0;
  for (let j = 0; j <= 200; j++) { const w = j / 200; const p = Core.predict(0, w); if (p.explosive) basaltEverBlasts = true; worstPhi = Math.max(worstPhi, p.phimax); }
  check('basalt (S=0) across ALL gas (201 samples) stays effusive', !basaltEverBlasts,
    'max φ_max over all gas at basalt = ' + worstPhi.toFixed(4) + ' < ¾');
}

// ── 5. COUPLING & VISCOSITY are monotone in S (the gate's plumbing is honest) ──
console.log('\n— coupling χ(S) and type viscosity rise monotonically with silica —');
{
  let chiMono = true, etaMono = true, pc = -1, pe = -1;
  for (let i = 0; i <= 100; i++) {
    const S = i / 100;
    const c = Core.couplingChi(S), e = Core.etaTypeLog(S);
    if (c < pc - 1e-15) chiMono = false; if (e < pe - 1e-15) etaMono = false;
    pc = c; pe = e;
  }
  check('χ(S) strictly increases with silica (basalt degasses → rhyolite locks gas in)',
    chiMono && Core.couplingChi(0) < 0.01 && Core.couplingChi(1) > 0.99,
    'χ(basalt)=' + Core.couplingChi(0).toExponential(2) + ', χ(rhyolite)=' + Core.couplingChi(1).toFixed(4));
  check('type log-viscosity rises with silica (basalt 10² → rhyolite 10⁸ Pa·s)',
    etaMono && Math.abs(Core.etaTypeLog(0) - 2) < 1e-9 && Math.abs(Core.etaTypeLog(1) - 8) < 1e-9,
    'logη: ' + Core.etaTypeLog(0).toFixed(1) + ' → ' + Core.etaTypeLog(1).toFixed(1));
}

// ── 6. BYTE-TWIN PARITY: index.html's inlined CORE slab === core.mjs ───────────
console.log('\n— BYTE-TWIN PARITY: the page core === the module core —');
{
  const BEGIN = '// === DEEP-HEARTH CORE BEGIN ===';
  const END = '// === DEEP-HEARTH CORE END ===';
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

// ── 7. SINGLE-SOURCE grep: the load-bearing φ line lives in exactly one place ──
console.log('\n— SINGLE SOURCE: the φ gas-fraction math lives in exactly one place —');
{
  const root = join(here, '..', '..');
  // build the needle from fragments so this literal does not itself match the grep
  const NEEDLE = ['num / (num', '(1 - n) * V_M)'].join(' + ');
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
  const expected = ['the-deep-hearth/conduit/core.mjs', 'the-deep-hearth/conduit/index.html'].sort();
  const got = hits.sort();
  const onlyExpected = got.every(h => expected.includes(h));
  check('the φ line appears ONLY in core.mjs + its one inlined index.html (no fork)',
    onlyExpected && got.length <= 2, 'found in: ' + (got.length ? got.join(', ') : '(only core.mjs until forge runs)'));
}

console.log('\nThe Deep Hearth · The Conduit — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
