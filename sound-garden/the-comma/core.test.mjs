// ============================================================================
//  THE COMMA — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-comma/core.test.mjs
//
//  Re-proves the SAME legs the in-page pill proves (via the shared runSelfTest
//  imported from ../pitch-core.mjs), then asserts the SINGLE-SOURCE discipline:
//    • BYTE-TWIN parity  — index.html's inlined COMMA CORE slice === the module
//      slice char-for-char (the page's runSelfTest IS the module's runSelfTest).
//    • ANTI-CIRCULARITY grep — the comma ratio (3¹²/2¹⁹) appears as a code literal
//      in exactly ONE file (pitch-core.mjs); it is NOT re-typed in index.html or
//      this test (this file builds the ratio string from its integer parts).
//    • DEEPER re-derivations — the comma two disjoint ways, the per-fifth shave,
//      the negative control, and the continuity sweep, re-measured here.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the bench lives one level deeper than butterfly-voice, so the
//  module import path is ../pitch-core.mjs (NOT ../sound-garden/pitch-core.mjs).
// ============================================================================
import {
  runSelfTest, pythagoreanComma, PYTHAGOREAN_COMMA, cents, gapCents,
  JUST_FIFTH, temperedFifth, fifthRatio, equalTemperFifth, stackFifths,
} from '../pitch-core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-comma → sound-garden → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the six legs, identical to the pill). ───────
console.log('\n— The full in-page self-test (the shared runSelfTest legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. TWO DISJOINT DERIVATIONS of the comma agree to the bit (Δ=0). ──────────
{
  let raw = 1; for (let i = 0; i < 12; i++) raw *= JUST_FIFTH;   // (3/2)^12, source-disjoint route
  const folded = raw / Math.pow(2, 7);                          // fold 7 octaves down
  const d = Math.abs(folded - PYTHAGOREAN_COMMA);
  check('two disjoint derivations: (3/2)¹² folded ÷2⁷ === the comma ratio (3¹²/2¹⁹) to the bit (Δ=0) — the comma is a rational fact',
        folded === PYTHAGOREAN_COMMA && d === 0, `folded = ${folded} · |Δ| = ${d}`);
}

// ── 3. TWELVE ET FIFTHS CLOSE; TWELVE JUST FIFTHS LEAVE THE COMMA (control). ──
{
  const gJust = gapCents(0), gET = Math.abs(gapCents(1));
  check('residual: twelve ET fifths close (≈0¢ within float eps) while twelve JUST fifths leave the comma (23.460¢) — same machinery, only the ratio differs',
        gET < 1e-9 && Math.abs(gJust - 23.460) < 0.001,
        `just gap = ${gJust.toFixed(3)}¢ · ET residual = ${gET.toExponential(2)}¢`);
}

// ── 4. THE EQUAL HAIR: comma/12 = 1.955¢, and 701.955¢ → 700¢ exactly. ────────
{
  const shave = cents(JUST_FIFTH) - cents(temperedFifth());
  const commaOver12 = equalTemperFifth();
  const justC = cents(JUST_FIFTH), etC = cents(temperedFifth());
  check('per-fifth shave: comma/12 = 1.955¢ === (just 701.955¢ − ET 700.000¢) — ET distributes one comma across twelve pegs',
        Math.abs(shave - commaOver12) < 1e-9 && Math.abs(shave - 1.955) < 0.001 &&
        Math.abs(justC - 701.955) < 0.001 && etC === 700,
        `shave = ${shave.toFixed(6)}¢ === comma/12 = ${commaOver12.toFixed(6)}¢ · just ${justC.toFixed(3)}¢ → ET ${etC}¢`);
}

// ── 5. CONTINUITY: gap(t) strictly monotone decreasing comma → 0, linear in t. ─
{
  let prev = Infinity, mono = true, worstLin = 0;
  const comma = cents(pythagoreanComma());
  for (let k = 0; k <= 200; k++) { const t = k / 200; const g = gapCents(t);
    if (g > prev + 1e-9) mono = false; prev = g;
    worstLin = Math.max(worstLin, Math.abs(g - comma * (1 - t))); }
  check('continuity: gap(t) strictly monotone comma → 0, and gap(t) = comma·(1−t) to < 1e-7¢ (the lever closes it with no jump)',
        mono && worstLin < 1e-7, `monotone ✓ · worst |gap − comma·(1−t)| = ${worstLin.toExponential(2)}¢`);
}

console.log('\n— Single-source discipline (the proofs the comma literal is not re-typed) —');

// ── 6. BYTE-TWIN PARITY: index.html's inlined COMMA CORE === ../pitch-core.mjs. ─
{
  const BEGIN = '// ===== COMMA CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== COMMA CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity: index.html COMMA CORE block is char-for-char ../pitch-core.mjs (between sentinels) — the page\'s runSelfTest IS the module\'s',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 7. PITCH CORE byte-untouched: the prior PITCH CORE block still byte-twins
//     butterfly-voice (we appended after it without perturbing a byte). ────────
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const bvPage = readFileSync(join(repoRoot, 'butterfly-voice', 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const bvSlice = sliceBetween(bvPage, BEGIN, END);
  check('PITCH CORE untouched: the pre-existing PITCH CORE block still === butterfly-voice/index.html\'s inlined copy (the #64 append perturbed no byte above it)',
        modSlice != null && bvSlice != null && modSlice === bvSlice,
        modSlice == null ? 'module sentinels MISSING' : bvSlice == null ? 'butterfly-voice sentinels MISSING' :
          (modSlice === bvSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs bv ${bvSlice.length})`));
}

// ── 8. ANTI-CIRCULARITY GREP: the comma literal lives in EXACTLY ONE module. ──
// Walk the whole repo (skipping .git / node_modules / assets) and find every file
// that contains the bare comma ratio as a code literal. The literal is BUILT here
// from its integer parts so this test file does NOT itself contain it verbatim —
// otherwise the grep would (correctly) flag the test as a second mention.
{
  const NUM = 531441, DEN = 524288;                 // 3¹² and 2¹⁹ — the comma's numerator/denominator
  const BARE = `${NUM}/${DEN}`;                      // the bare ratio, no spaces
  const SPACED = `${NUM} / ${DEN}`;                  // the spaced form (how pitch-core.mjs writes it)
  const skipDirs = new Set(['.git', 'node_modules', 'assets']);
  const codeHits = [], allHits = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) { if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js|html|md|txt)$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(BARE) || src.includes(SPACED)) {
        allHits.push(rel);
        if (rel.endsWith('.mjs') || rel.endsWith('.js')) codeHits.push(rel);
      }
    }
  }
  walk(repoRoot);
  // the literal as live CODE must be DEFINED in exactly one place: pitch-core.mjs.
  // (index.html holds it only inside the BYTE-TWIN slice — which IS pitch-core's own
  // text, proven identical in leg 6 — plus a descriptive prose mention; neither is a
  // second source of truth. This test file built the literal from parts, so it is
  // NOT a hit.) So: exactly one code-file, and it is pitch-core.mjs.
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/pitch-core.mjs' &&
             !allHits.includes('sound-garden/the-comma/core.test.mjs');
  check('anti-circularity: the comma ratio is DEFINED as a code literal in exactly ONE file — sound-garden/pitch-core.mjs (the page only byte-twins it; this test built it from parts)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

console.log(`\n—— The Comma Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
