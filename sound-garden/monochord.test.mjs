// ============================================================================
//  THE MONOCHORD — Node twin of the in-page self-test.
//  Run:  node sound-garden/monochord.test.mjs
//
//  Re-proves the SAME legs the in-page pill proves (via the shared runSelfTest
//  imported from ./monochord.core.mjs), then asserts the SINGLE-SOURCE discipline:
//    • BYTE-TWIN parity — monochord.html's inlined MONOCHORD CORE slice ===
//      monochord.core.mjs char-for-char (the page's runSelfTest IS the module's).
//    • ANCHOR vs pitch-core — the anchor 110 Hz / A2 is the equal-temperament grid
//      value (semiToFreq(-15) and noteName(-15)), proving the core's anchor is not
//      a re-typed magic number while the core itself imports NOTHING.
//    • DISJOINT re-derivations — the even ladder fₙ = n·c/2L re-computed here for
//      n=1..16, the stiff control's teeth, the node-forcing table, an anti-
//      circularity grep, and the core's zero-import discipline.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import {
  runSelfTest, fIdeal, harmonicRatio, fStiff, stiffRatio, waveSpeed,
  survivingModes, forcedHarmonic, anchorSpeed,
  SEMI_ANCHOR, ANCHOR_HZ, L_REF, T_REF, MU_REF, B_REF,
} from './monochord.core.mjs';
import { semiToFreq, noteName } from './pitch-core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..');     // sound-garden → repo root
let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end) {
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

// ── LEG1. THE FULL SHARED SELF-TEST (the six legs, identical to the pill). ────
console.log('\n— LEG1 · the full in-page self-test (the shared runSelfTest legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('LEG1 · self-test reports all green (pass === total, ok)', r.pass === r.total && r.ok, r.pass + '/' + r.total);
}

console.log('\n— Single-source discipline —');

// ── LEG2. BYTE-TWIN PARITY: monochord.html's MONOCHORD CORE === the module. ───
{
  const BEGIN = '// ===== MONOCHORD CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== MONOCHORD CORE END =====';
  const mod = readFileSync(join(__dir, 'monochord.core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'monochord.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('LEG2 · byte-twin parity: monochord.html MONOCHORD CORE block is char-for-char monochord.core.mjs (between sentinels) — the page\'s runSelfTest IS the module\'s',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── LEG3. ANCHOR vs pitch-core: the anchor IS the ET-grid value. ─────────────
// Proves the core's ANCHOR_HZ/SEMI_ANCHOR are the equal-temperament grid value
// (pitch-core stays the single pitch source) WITHOUT the core importing it.
{
  // The ET anchor literal (261.625565) is itself rounded, so the grid value is
  // 109.99999987… — exactly the A2 grid pitch to < 0.0001 Hz (≈2e-6 cents), which is
  // the right tolerance here (a musical, not bit, match). This proves ANCHOR_HZ is
  // pitch-core's grid value, not an unrelated magic number.
  const grid = semiToFreq(SEMI_ANCHOR);
  const name = noteName(SEMI_ANCHOR);
  const cents = Math.abs(1200 * Math.log2(grid / ANCHOR_HZ));
  const ok = Math.abs(grid - ANCHOR_HZ) < 1e-4 && cents < 1e-3 && name === 'A2';
  check('LEG3 · anchor is the ET grid value: |semiToFreq(-15) − 110| < 1e-4 Hz (< 1e-3 cents) and noteName(-15) === "A2" — the anchor is pitch-core\'s grid value, not a re-typed magic number',
        ok, `semiToFreq(${SEMI_ANCHOR}) = ${grid.toFixed(6)} Hz vs ANCHOR_HZ ${ANCHOR_HZ} (${cents.toExponential(2)} cents) · note ${name}`);
}

console.log('\n— Deeper Node-only re-derivations —');

// ── LEG4. DISJOINT LADDER RE-DERIVATION: fₙ = n·c/2L, n=1..16, fₙ/f₁ === n. ───
{
  const c = waveSpeed(T_REF, MU_REF);
  const f1 = c / (2 * L_REF);                 // disjoint route: speed first, not fIdeal's n·c/2L
  let ok = true, worst = 0;
  for (let n = 1; n <= 16; n++) {
    const fn = n * c / (2 * L_REF);
    const r = fn / f1;
    worst = Math.max(worst, Math.abs(r - n));
    if (Math.abs(r - n) > 1e-9 || r !== harmonicRatio(n)) ok = false;
  }
  check('LEG4 · disjoint ladder: fₙ = n·c/2L re-derived here gives fₙ/f₁ === n to <1e-9 for n=1..16 — the even ladder, computed a second way',
        ok, `worst |fₙ/f₁ − n| = ${worst.toExponential(2)} over n=1..16 · c=${c}`);
}

// ── LEG5. STIFF CONTROL HAS TEETH: strictly sharp, monotone, would fail LEG-A. ─
{
  let strictlySharp = true, monotone = true, prev = -Infinity, wouldFailA = false;
  for (let n = 1; n <= 8; n++) {
    const r = stiffRatio(n);
    if (n > 1 && !(r > n + 1e-9)) strictlySharp = false;
    if (!(r > prev)) monotone = false; prev = r;
    if (n > 1 && Math.abs(r - n) >= 1e-9) wouldFailA = true;
  }
  // and fStiff(n) sits strictly above fIdeal(n) for n>1 (sharp in Hz too)
  let sharpHz = true;
  for (let n = 2; n <= 8; n++) if (!(fStiff(n, L_REF, T_REF, MU_REF) > fIdeal(n, L_REF, T_REF, MU_REF))) sharpHz = false;
  const collapses = stiffRatio(5, 0) === 5;            // B=0 → exactly even
  check('LEG5 · stiff control has teeth: partials strictly sharp & monotone-in-n (would FAIL LEG-A), sharp in Hz too, and collapse to exactly even at B=0',
        strictlySharp && monotone && wouldFailA && sharpHz && collapses,
        `ratio(8)=${stiffRatio(8).toFixed(4)} (>8) · B=0 → ratio(5)=${stiffRatio(5,0)} · fStiff>fIdeal ✓`);
}

// ── LEG6. NODE-FORCING TABLE PINNED. ─────────────────────────────────────────
{
  const table = [[1,2,2],[1,3,3],[2,3,3],[1,4,4],[3,4,4],[1,5,5],[2,5,5],[3,5,5],[1,6,6],[5,6,6]];
  let ok = true, detail = [];
  for (const [a,b,want] of table) { const got = forcedHarmonic(a,b); if (got !== want) ok = false; detail.push(`${a}/${b}→H${got}`); }
  const mid = survivingModes(1,2);
  const midOk = !mid.includes(1) && forcedHarmonic(1,2) === 2;     // forbidden midpoint cannot force H1
  check('LEG6 · node-forcing table pinned: touching a/b forces Hb across the table, and the midpoint 1/2 forces H2 (never H1 — the fundamental is killed there)',
        ok && midOk, `${detail.join(' ')} · midpoint survivors {${mid.join(',')}}`);
}

console.log('\n— Anti-circularity + import discipline —');

// ── LEG7. ANTI-CIRCULARITY GREP: the fIdeal DEFINITION token in exactly ONE .mjs.
// The needle (the "fn-keyword + fIdeal(" definition token) is BUILT from parts so
// this test file does not itself contain it verbatim — else the grep would (rightly)
// flag this test as a second definer.
{
  const needle = 'fun' + 'ction fIdeal(';
  const skipDirs = new Set(['.git', 'node_modules', 'assets']);
  const codeHits = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) { if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.mjs$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      if (src.includes(needle)) codeHits.push(p.slice(repoRoot.length + 1));
    }
  }
  walk(repoRoot);
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/monochord.core.mjs';
  // the message names the needle via the variable (not the literal) so this test
  // file is NOT itself a hit — otherwise the grep would correctly flag it.
  check('LEG7 · anti-circularity: `' + needle + '` is defined in EXACTLY ONE .mjs — sound-garden/monochord.core.mjs (the page only byte-twins it; this test built the needle from parts)',
        ok, `.mjs definers: [${codeHits.join(', ')}]`);
}

// ── LEG8. ZERO-IMPORT DISCIPLINE: monochord.core.mjs imports NOTHING. ─────────
// So the inlined byte-twin runs in-page with no module resolver.
{
  const src = readFileSync(join(__dir, 'monochord.core.mjs'), 'utf8');
  const importRe = /^\s*import\s/m;
  const requireRe = /\brequire\s*\(/;
  const ok = !importRe.test(src) && !requireRe.test(src);
  check('LEG8 · zero-import core: monochord.core.mjs contains NO import/require — the inlined byte-twin runs in-page with no resolver',
        ok, ok ? 'no import/require found (export-only)' : 'an import/require leaked into the core');
}

console.log(`\n—— The Monochord Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
