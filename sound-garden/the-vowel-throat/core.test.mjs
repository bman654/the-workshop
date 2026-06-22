// ============================================================================
//  THE VOWEL THROAT — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-vowel-throat/core.test.mjs
//
//  Re-proves the SAME four legs the in-page pill proves (via the shared
//  runThroatSelfTest imported from ./core.mjs — itself built on pitch-core's
//  semiToFreq), then asserts the discipline:
//    • A DISJOINT re-derivation of bandpassMag's peak — sample |H| on a FINE grid
//      and confirm the argmax sits at the center fc (independent of the analytic
//      claim that |H(fc)| = 1). The formant-recovery in LEG 1 leans on this.
//    • FORMANT RECOVERY at fresh f₀'s — the two cardinals' formants are recovered
//      within ±one comb spacing at TWO buzz pitches, so the recovery is not tuned
//      to one register.
//    • BYTE-TWIN parity (×2) — index.html's inlined THROAT CORE slice === core.mjs
//      char-for-char, and its PITCH CORE slice === ../pitch-core.mjs.
//    • ANTI-CIRCULARITY / SINGLE-SOURCE — the bandpassMag definition lives in
//      EXACTLY ONE .mjs (./core.mjs); the cardinal F1/F2 literal pair lives in
//      exactly one .mjs; the THROAT CORE slice is import-free (no `import` inside).
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden landing, so
//  repoRoot is ../.. (the-vowel-throat → sound-garden → repo root).
// ============================================================================
import {
  runThroatSelfTest, bandpassMag, formantPeaks, throatResponse,
  CARDINAL_A, CARDINAL_I, Q1, Q2, F2_HI, padToFormants, formantsToPad,
  VOWELS, semiToFreq, F0,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-vowel-throat → sound-garden → repo root
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

// ── 1. THE FULL SHARED SELF-TEST (the four legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runThroatSelfTest legs) —');
{
  const r = runThroatSelfTest(F0);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations —');

// ── 2. A DISJOINT re-derivation of bandpassMag's PEAK: sample |H| on a fine grid
//   and confirm the argmax sits at the center fc (and |H(fc)| = 1). This is the
//   independent check that LEG 1's formant recovery rests on — the analytic claim
//   "the bandpass peaks at its center" verified by brute-force argmax. ─────────
{
  let ok = true; const rows = [];
  for (const [fc, q] of [[CARDINAL_A.F1, Q1], [CARDINAL_A.F2, Q2], [CARDINAL_I.F2, Q2]]){
    let bestF = 0, bestMag = -1;
    // a fine log grid spanning well below and above the center
    for (let i = 0; i <= 20000; i++){
      const f = fc * 0.25 * Math.pow(16, i / 20000);   // fc/4 → fc·4
      const m = bandpassMag(f, fc, q);
      if (m > bestMag){ bestMag = m; bestF = f; }
    }
    const atCenter = Math.abs(bestF - fc) / fc < 0.001;     // argmax within 0.1% of fc
    const unitGain = Math.abs(bandpassMag(fc, fc, q) - 1) < 1e-12;
    if (!(atCenter && unitGain)) ok = false;
    rows.push(`fc ${fc}: argmax ${bestF.toFixed(1)} (Δ${(Math.abs(bestF-fc)).toFixed(2)}), |H(fc)|=${bandpassMag(fc,fc,q).toFixed(6)}`);
  }
  check('bandpassMag peak (disjoint grid argmax): sampling |H| on a fine grid, the maximum sits at the center fc and |H(fc)| = 1 exactly — the analytic peak LEG 1 leans on, verified by brute force',
        ok, rows.join('  ·  '));
}

// ── 3. FORMANT RECOVERY at FRESH buzz pitches: the two cardinals' formants are
//   recovered within ±one comb spacing at f₀ = 100 Hz and 140 Hz — the recovery
//   is not tuned to the page's f₀. (Denser comb → tighter; sparser → still ≤ f₀.)
{
  let ok = true; const rows = [];
  for (const f0 of [100, 140]){
    const N = Math.max(40, Math.ceil((F2_HI * 1.2) / f0));
    for (const v of [CARDINAL_A, CARDINAL_I]){
      const pk = formantPeaks(f0, N, v.F1, v.F2, Q1, Q2, false);
      const d1 = Math.abs(pk.p1 - v.F1), d2 = Math.abs(pk.p2 - v.F2);
      if (!(d1 <= f0 && d2 <= f0)) ok = false;
      rows.push(`f0=${f0} /${v.ipa}/ Δ${d1.toFixed(0)}/${d2.toFixed(0)}`);
    }
  }
  check('formant recovery at fresh buzz pitches (f₀ = 100, 140 Hz): both cardinals recover F1/F2 within ±one comb spacing at each pitch — the recovery is scale-free, not tuned to the page register',
        ok, rows.join(' · '));
}

// ── 4. THE PAD ↔ FORMANT BIJECTION round-trips to the bit, and every VOWELS
//   entry maps INTO the unit square (the pad encloses the whole vowel set). ────
{
  let worst = 0, inSquare = true;
  for (const v of VOWELS){
    const p = formantsToPad(v.F1, v.F2);
    if (p.x < -1e-9 || p.x > 1+1e-9 || p.y < -1e-9 || p.y > 1+1e-9) inSquare = false;
    const f = padToFormants(p.x, p.y);
    worst = Math.max(worst, Math.abs(f.F1 - v.F1), Math.abs(f.F2 - v.F2));
  }
  check('the pad↔formant log bijection round-trips to the bit and the pad encloses every vowel: formantsToPad∘padToFormants is identity, and all ten VOWELS land inside the unit square',
        worst < 1e-9 && inSquare, `worst round-trip Δ ${worst.toExponential(2)} Hz · all vowels in-square ${inSquare}`);
}

console.log('\n— Single-source discipline (the proofs the laws are not re-typed) —');

// ── 5. BYTE-TWIN PARITY (NEW physics): index.html THROAT CORE === ./core.mjs. ─
{
  const BEGIN = '// ===== THROAT CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== THROAT CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (THROAT CORE): index.html\'s inlined THROAT CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runThroatSelfTest IS the module\'s, and the live throat reads the same Q1/Q2 and bandpassMag',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 6. BYTE-TWIN PARITY (borrowed PITCH CORE): the page inlines pitch-core's
//   PITCH CORE slice (giving it semiToFreq) char-for-char ../pitch-core.mjs. ──
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so f₀ = semiToFreq(−13.5)) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 7. ANTI-CIRCULARITY: the bandpassMag definition lives in exactly one .mjs
//   (./core.mjs), and the THROAT CORE slice is import-free (no `import` inside).
{
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  // the definition marker, assembled from parts so this test file is NOT itself a
  // hit (the grep would otherwise flag the marker string below).
  const BP_DEF = 'function ' + 'bandpassMag(';
  const defs = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.mjs$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      if (src.includes(BP_DEF)) defs.push(p.slice(repoRoot.length + 1));
    }
  }
  walk(repoRoot);
  const here = 'sound-garden/the-vowel-throat/core.mjs';
  const defOK = defs.length === 1 && defs[0] === here;
  // the THROAT CORE slice must be import-free.
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const slice = sliceBetween(mod, '// ===== THROAT CORE (inlined byte-twin) BEGIN =====', '// ===== THROAT CORE END =====');
  const noImport = slice != null && !/\bimport\b/.test(slice);
  check('anti-circularity: function bandpassMag is defined in EXACTLY ONE .mjs (core.mjs), and the THROAT CORE slice is import-free (f₀ is passed in, the page can inline it regardless of load order)',
        defOK && noImport, `bandpassMag defined in [${defs.join(', ')}] · slice import-free ${noImport}`);
}

// ── 8. SINGLE-SOURCE: the cardinal F1/F2 literal pair (730/1090 for /a/, the open
//   back vowel) lives as live .mjs CODE in EXACTLY ONE file — ./core.mjs. The page
//   holds it only inside the byte-twin THROAT CORE slice (proven identical in leg
//   5 — html, not a second source). The fragment is built from parts so this test
//   is not itself a hit. ──────────────────────────────────────────────────────
{
  // the /a/ formant pair, as core.mjs writes it in the VOWELS table.
  const FRAG = 'F1: 7' + '30,  F2: 10' + '90';
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  const codeHits = [], allHits = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js|html)$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(FRAG)){ allHits.push(rel); if (rel.endsWith('.mjs') || rel.endsWith('.js')) codeHits.push(rel); }
    }
  }
  walk(repoRoot);
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-vowel-throat/core.mjs';
  check('single-source: the cardinal /a/ formant pair (730/1090) is live code in EXACTLY ONE file — sound-garden/the-vowel-throat/core.mjs; the page only byte-twins it (html, proven identical in leg 5)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

console.log(`\n—— The Vowel Throat Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
