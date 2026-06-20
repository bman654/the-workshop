// ============================================================================
//  THE SIDEBANDS — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-sidebands/core.test.mjs
//
//  Re-proves the SAME five legs the in-page pill proves (via the shared
//  runSidebandSelfTest imported from ./core.mjs — itself built on pitch-core's
//  semiToFreq), then asserts the discipline:
//    • DEEPER re-derivations — the |Jₙ(β)| comb holds at a FRESH carrier (five
//      semitones down) and depth (β grid) by the leakage-free DFT; energy stays 1
//      across a β-sweep; and the downward recurrence agrees with the power series at
//      a DEEP order/depth (n=30, β=8) where naive upward recurrence would underflow.
//    • BYTE-TWIN parity — index.html's inlined BESSEL CORE slice === ./core.mjs's,
//      char-for-char; and the borrowed PITCH CORE slice in the page ===
//      ../pitch-core.mjs's, char-for-char.
//    • SINGLE-SOURCE — the Miller recurrence body is live .mjs CODE in EXACTLY ONE
//      file (./core.mjs); the page holds it only inside the byte-twin slice (html,
//      proven identical); core.mjs IMPORTS semiToFreq rather than re-typing it; and
//      sidebandAmp is defined in exactly one .mjs.
//    • CROSS-CHECK — |J₀(plate.BESSEL_J0_ZEROS[0])| < 1e-9, reading the first J₀
//      zero LIVE out of tools/plate/plate.js by a read-only regex (not a copied
//      literal) — the same constant the plate tool already trusts.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden, so repoRoot is
//  ../.. (the-sidebands → sound-garden → repo root), like the-tartini-bench.
// ============================================================================
import {
  runSidebandSelfTest, besselJarray, besselJ, sidebandAmp, sidebandFreq,
  combAmps, combEnergy, fmSample, renderFM, goertzelMag, analysisWindow,
  FC, FM, BETA, J0_ZERO1, semiToFreq,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-sidebands → sound-garden → repo root
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
// an INDEPENDENT Bessel by the power series (the test's second method, distinct from
// the recurrence under test) — used for the deep-order re-derivation in 2c.
function besselSeries(n, x){
  const h = x / 2;
  let term = Math.pow(h, n);
  for (let k = 2; k <= n; k++) term /= k;
  let sum = term; const h2 = h * h;
  for (let m = 1; m < 400; m++){
    term *= -h2 / (m * (m + n));
    sum += term;
    if (Math.abs(term) < 1e-18 * (Math.abs(sum) + 1e-300)) break;
  }
  return sum;
}

// ── 1. THE FULL SHARED SELF-TEST (the five legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runSidebandSelfTest legs) —');
{
  const r = runSidebandSelfTest(FC, FM, BETA);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (fresh carrier/β, deep order) —');

// ── 2a. THE |Jₙ(β)| COMB at a FRESH carrier and depth grid: carrier five semitones
//   below middle C (a different band than the page's middle C) — for each β the DFT
//   of the rendered FM signal reads |Jₙ(β)|/2 at the carrier + first five sidebands
//   to <1e-9. Scale-free and depth-free, not tuned to one band or one depth.
{
  const fc = semiToFreq(-5);                  // a fresh carrier (≈196 Hz), not the page's middle C
  const fm = fc / 16;                         // keep the 16:1 integer ratio so the window stays leakage-free
  const { SR, N } = analysisWindow(fm);
  let ok = true, worst = 0; const rows = [];
  for (const beta of [1.0, 3.5, 5.0, 7.5]){
    const y = renderFM(fc, fm, beta, SR, N);
    for (let n = 0; n <= 5; n++){
      const measured = goertzelMag(y, sidebandFreq(fc, fm, n), SR);
      const want = sidebandAmp(n, beta) / 2;
      const d = Math.abs(measured - want); worst = Math.max(worst, d);
      if (d >= 1e-9){ ok = false; rows.push(`β=${beta},n=${n} ${measured.toExponential(2)}≠${want.toExponential(2)}`); }
    }
  }
  check('fresh-carrier comb: at a carrier five semitones below middle C — a different band than the page — the rendered FM spectrum reads |Jₙ(β)|/2 at the carrier + first five sidebands across β ∈ {1.0,3.5,5.0,7.5} to <1e-9; the comb is not tuned to one band or depth',
        ok, ok ? `comb teeth === |Jₙ(β)|/2 to <1e-9 across the β grid (worst Δ ${worst.toExponential(2)})`
               : rows.join(', '));
}

// ── 2b. THE β-SWEEP ENERGY: Σₙ Jₙ(β)² stays 1 across a fine sweep ε ∈ [0,12] to
//   <1e-9 — FM redistributes energy, never creates it. (A finer sweep than the
//   oracle's; the conserved total is a property of every depth, not three of them.)
{
  let ok = true, worst = 0, worstAt = null;
  for (let b = 0; b <= 12.0001; b += 0.25){
    const d = Math.abs(combEnergy(b, 64) - 1);
    if (d > worst){ worst = d; worstAt = Math.round(b * 100) / 100; }
    if (d >= 1e-9) ok = false;
  }
  check('β-sweep energy: Σₙ Jₙ(β)² stays 1 across a fine sweep β ∈ [0,12] (step 0.25) to <1e-9 — energy is conserved at every depth, not just a few',
        ok, ok ? `worst |Σ Jₙ² − 1| = ${worst.toExponential(2)} at β=${worstAt}` : `energy off (worst ${worst.toExponential(2)} at β=${worstAt})`);
}

// ── 2c. DEEP ORDER, NO UNDERFLOW: at n=30, β=8 the downward recurrence agrees with
//   the power series to <1e-9 — a regime where naive UPWARD recurrence (and a single
//   tiny seed without the Neumann renormalization) would underflow to garbage. This
//   is the load-bearing reason the engine recurs DOWNWARD and renormalizes.
{
  const recur = besselJarray(8, 30)[30];
  const series = besselSeries(30, 8);
  const d = Math.abs(recur - series);
  const ok = d < 1e-9 && Math.abs(recur) > 0;       // a real nonzero value, agreeing with the series
  check('deep order, no underflow: at n=30, β=8 the downward recurrence === the power series to <1e-9 (a regime where naive upward recurrence underflows) — the engine recurs DOWNWARD and renormalizes for exactly this reason',
        ok, `J₃₀(8) recurrence ${recur.toExponential(4)} vs series ${series.toExponential(4)} — Δ ${d.toExponential(2)}`);
}

console.log('\n— Byte-twin parity (the page IS the module) —');

// ── 3a. BYTE-TWIN PARITY (BESSEL CORE): index.html's inlined slice === ./core.mjs's
//   slice, char-for-char — the page's runSidebandSelfTest IS the module's, and the
//   live comb is drawn from the same besselJarray.
{
  const BEGIN = '// ===== BESSEL CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== BESSEL CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (BESSEL CORE): index.html\'s inlined CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runSidebandSelfTest IS the module\'s, and the live comb is drawn from the same besselJarray',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 3b. BYTE-TWIN PARITY (borrowed PITCH CORE): the page inlines pitch-core's PITCH
//   CORE slice (giving it semiToFreq, so FC/FM are derived) char-for-char. ────────
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so FC = semiToFreq(0), FM = FC/16) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

console.log('\n— Single-source discipline (the FM law is not re-typed) —');

// ── 4. SINGLE-SOURCE GREP: the Miller recurrence body lives as live .mjs/.js CODE
//   in EXACTLY ONE file — ./core.mjs. The page holds it only inside the byte-twin
//   slice (proven identical above — html, not a second source). The comparison
//   fragment is assembled from parts so this test file is NOT itself a hit.
{
  // the Miller recurrence body, as core.mjs writes it (assembled from parts so this
  // test file does not contain it verbatim — otherwise the grep would, correctly,
  // flag the test as a second mention; mirrors the sibling leaves' single-source trick).
  const FRAG = '(2 * n / (ax === 0 ? 1 : ax)) * j[n] ' + '- j[n + 1]';
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
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-sidebands/core.mjs';
  check('single-source: the Miller downward-recurrence body is live code in EXACTLY ONE file — sound-garden/the-sidebands/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 5. SINGLE-SOURCE: core.mjs IMPORTS semiToFreq (does not re-type it), and the
//   sideband amplitude law sidebandAmp is defined in exactly one .mjs. ──────────
{
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import \{ semiToFreq \} from '\.\.\/pitch-core\.mjs'/.test(coreSrc);
  const noReTypedPitch = !/function semiToFreq\(/.test(coreSrc);
  // the sidebandAmp definition marker, assembled from parts so this test file is not
  // itself a hit on the def grep below.
  const DEF = 'function ' + 'sidebandAmp(n, beta)';
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  const defs = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.mjs$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(DEF)) defs.push(rel);
    }
  }
  walk(repoRoot);
  const here = 'sound-garden/the-sidebands/core.mjs';
  const defOK = defs.length === 1 && defs[0] === here;
  check('single-source (pitch + amplitude): core.mjs IMPORTS semiToFreq (does not re-type it), and the sideband-amplitude law sidebandAmp(n, β) = |Jₙ(β)| is defined in EXACTLY ONE .mjs (core.mjs)',
        importsPitch && noReTypedPitch && defOK,
        `imports semiToFreq=${importsPitch} · re-types semiToFreq=${!noReTypedPitch} · sidebandAmp defined in [${defs.join(', ')}]`);
}

console.log('\n— Cross-check against the plate tool\'s J₀ zeros (live, not a copied literal) —');

// ── 6. CROSS-CHECK: read the first J₀ zero LIVE out of tools/plate/plate.js by a
//   read-only regex (NOT a copied literal in this file), then confirm besselJ(0, ·)
//   nulls there to <1e-9. The same constant the plate tool already trusts — the
//   carrier null is anchored to the estate's existing Bessel authority, not to a
//   number typed here.
{
  let firstZero = null, src = '';
  try {
    src = readFileSync(join(repoRoot, 'tools', 'plate', 'plate.js'), 'utf8');
    const m = src.match(/BESSEL_J0_ZEROS\s*=\s*\[\s*([0-9.]+)/);
    if (m) firstZero = parseFloat(m[1]);
  } catch (e) { /* reported below */ }
  const nulls = firstZero != null && Math.abs(besselJ(0, firstZero)) < 1e-9;
  check('cross-check (plate tool): the first J₀ zero read LIVE from tools/plate/plate.js (read-only regex, not a copied literal) nulls besselJ(0, ·) to <1e-9 — the carrier null anchors to the estate\'s existing Bessel constant',
        firstZero != null && nulls,
        firstZero == null ? 'could not read BESSEL_J0_ZEROS[0] from plate.js'
                          : `plate.js J₀ zero[0] = ${firstZero} · |besselJ(0, ·)| = ${Math.abs(besselJ(0, firstZero)).toExponential(2)} (<1e-9)`);
}

console.log(`\n—— The Sidebands Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
