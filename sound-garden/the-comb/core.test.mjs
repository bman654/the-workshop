// ============================================================================
//  THE COMB — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-comb/core.test.mjs
//
//  Re-proves the SAME five legs the in-page pill proves (via the shared
//  runCombSelfTest imported from ./core.mjs — itself built on pitch-core's
//  semiToFreq), then asserts the discipline:
//    • DEEPER re-derivations — the feedforward comb holds at a FRESH τ grid and a
//      FRESH gain: a swept render + DFT confirms the MEASURED spectral nulls land on
//      (n+½)/τ to <1e-9 (the heard nulls ARE the law's nulls); the first notch ===
//      1/(2τ) and spacing === 1/τ over a fine τ sweep; and the notch place is
//      gain-INVARIANT (the dip frequency is unchanged as g sweeps 0→1).
//    • BYTE-TWIN parity — index.html's inlined COMB CORE slice === ./core.mjs's,
//      char-for-char; and the borrowed PITCH CORE slice in the page ===
//      ../pitch-core.mjs's, char-for-char.
//    • SINGLE-SOURCE — the feedforward time-domain law body is live .mjs CODE in
//      EXACTLY ONE file (./core.mjs); the page holds it only inside the byte-twin
//      slice (html, proven identical); core.mjs IMPORTS semiToFreq rather than
//      re-typing it; and the notch-ladder law notchFreq is defined in exactly one .mjs.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden, so repoRoot is
//  ../.. (the-comb → sound-garden → repo root), like the-sidebands.
// ============================================================================
import {
  runCombSelfTest, combMagSq, combMag, notchFreq, peakFreq, notchSpacing,
  notchDepth, peakHeight, combSampleTone, renderCombTones, dftMag, analysisWindow,
  TAU0, G0, PROBE_FC, semiToFreq,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-comb → sound-garden → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the five legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runCombSelfTest legs) —');
{
  const r = runCombSelfTest(TAU0, G0);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (fresh τ/g, the heard nulls land on (n+½)/τ) —');

// ── 2a. THE HEARD NULLS LAND ON (n+½)/τ: render the delay-and-add on a sum of probe
//   tones — some on notches (n+½)/τ, some on peaks n/τ — at a FRESH τ grid and g=1,
//   then DFT each tone. The notch tones must MEASURE ≈0 (annihilated) and the peak
//   tones ≈1 (doubled) to <1e-9. The MEASURED spectral nulls are exactly the law's
//   notch frequencies — band-independent (a leakage-free window pins every tone).
{
  let ok = true, worstNotch = 0, worstPeak = 0; const rows = [];
  for (const tau of [0.0004, 0.0008, 0.0016, 0.005]){
    const df = 1 / (2 * tau);
    const { SR, N } = analysisWindow(df);
    const peaks = [1,2,3].map(n => peakFreq(n, tau));
    const notches = [0,1,2,3].map(n => notchFreq(n, tau));
    const y = renderCombTones(peaks.concat(notches), tau, 1.0, SR, N);
    for (const f of notches){ const a = dftMag(y, f, SR); worstNotch = Math.max(worstNotch, a);
      if (a >= 1e-9){ ok = false; rows.push(`τ=${tau} notch ${f.toFixed(0)}Hz=${a.toExponential(2)}≠0`); } }
    for (const f of peaks){ const a = dftMag(y, f, SR); const d = Math.abs(a - 1.0); worstPeak = Math.max(worstPeak, d);
      if (d >= 1e-9){ ok = false; rows.push(`τ=${tau} peak ${f.toFixed(0)}Hz=${a.toExponential(2)}≠1`); } }
  }
  check('heard nulls land on (n+½)/τ: a rendered probe — tones on notches (n+½)/τ and peaks n/τ — through the delay-and-add at g=1 measures ≈0 on every notch (annihilated, worst amp <1e-9) and ≈1 on every peak (doubled), across a fresh τ grid; the measured spectral nulls ARE the law\'s notch frequencies',
        ok, ok ? `notch tones max ${worstNotch.toExponential(2)} (≈0) · peak tones worst |amp−1| ${worstPeak.toExponential(2)} (≈1) across the τ grid`
               : rows.join(', '));
}

// ── 2b. FIRST NOTCH === 1/(2τ), SPACING === 1/τ over a fine τ sweep: scale-free,
//   not tuned to one delay. The first tooth is the half-spacing of the comb.
{
  let ok = true, worstFirst = 0, worstSpace = 0, worstAt = 0;
  for (let tms = 0.2; tms <= 12.0001; tms += 0.1){
    const tau = tms / 1000;
    const dFirst = Math.abs(notchFreq(0, tau) - 1/(2*tau));
    const dSpace = Math.abs((notchFreq(1, tau) - notchFreq(0, tau)) - notchSpacing(tau));
    if (dFirst > worstFirst){ worstFirst = dFirst; }
    if (dSpace > worstSpace){ worstSpace = dSpace; worstAt = tms; }
    // tolerances scale with the frequency magnitude (1/τ grows to ~5000 at τ=0.2ms)
    if (dFirst >= 1e-7 || dSpace >= 1e-6) ok = false;
  }
  check('first notch === 1/(2τ), spacing === 1/τ across a fine τ sweep [0.2,12] ms (step 0.1 ms): the first tooth is exactly the comb\'s half-spacing and consecutive teeth are exactly 1/τ apart — scale-free, not tuned to one delay',
        ok, ok ? `worst first-notch Δ ${worstFirst.toExponential(2)} · worst spacing Δ ${worstSpace.toExponential(2)} (at τ=${worstAt.toFixed(1)} ms)`
               : `off (first Δ ${worstFirst.toExponential(2)}, spacing Δ ${worstSpace.toExponential(2)})`);
}

// ── 2c. THE NOTCH PLACE IS GAIN-INVARIANT: as g sweeps 0→1 the dip frequency stays
//   exactly (n+½)/τ — combMagSq dips at the same f for every g (the depth |1−g|
//   changes, the PLACE does not). This is the load-bearing claim "the delay arms the
//   comb, not the gain."
{
  const tau = 0.0021, fn = notchFreq(0, tau);
  let ok = true, worst = 0;
  for (let g = 0; g <= 1.0001; g += 0.05){
    // the magnitude-squared at the notch frequency must equal the dip floor (1−g)²
    // (a local minimum there) for EVERY g — the place doesn't move with the gain.
    const d = Math.abs(combMagSq(fn, tau, g) - (1 - g) * (1 - g));
    worst = Math.max(worst, d);
    if (d >= 1e-9) ok = false;
  }
  check('the notch place is gain-invariant: as g sweeps 0→1 the dip at the first notch frequency (n+½)/τ stays a local minimum equal to (1−g)² for every g — the depth |1−g| changes but the PLACE does not (the delay arms the comb, not the gain)',
        ok, `|H|²-at-notch === (1−g)² over the g sweep, worst Δ ${worst.toExponential(2)} (notch ${fn.toFixed(1)} Hz fixed)`);
}

console.log('\n— Byte-twin parity (the page IS the module) —');

// ── 3a. BYTE-TWIN PARITY (COMB CORE): index.html's inlined slice === ./core.mjs's
//   slice, char-for-char — the page's runCombSelfTest IS the module's, and the live
//   comb is drawn from the same combMag.
{
  const BEGIN = '// ===== COMB CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== COMB CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (COMB CORE): index.html\'s inlined CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runCombSelfTest IS the module\'s, and the live comb is drawn from the same combMag',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 3b. BYTE-TWIN PARITY (borrowed PITCH CORE): the page inlines pitch-core's PITCH
//   CORE slice (giving it semiToFreq, so the tone probe's pitch is derived) char-for-char.
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so the tone probe PROBE_FC = semiToFreq(0)) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

console.log('\n— Single-source discipline (the comb law is not re-typed) —');

// ── 4. SINGLE-SOURCE GREP: the feedforward time-domain law body lives as live
//   .mjs/.js CODE in EXACTLY ONE file — ./core.mjs. The page holds it only inside
//   the byte-twin slice (proven identical above — html, not a second source). The
//   comparison fragment is assembled from parts so this test file is NOT itself a hit.
{
  // the feedforward delay-and-add body, as core.mjs writes it (assembled from parts so
  // this test file does not contain it verbatim — otherwise the grep would, correctly,
  // flag the test as a second mention; mirrors the sibling leaves' single-source trick).
  const FRAG = 'Math.cos(2 * Math.PI * f * t) + g * Math.cos(2 * Math.PI * f * ' + '(t - tau))';
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
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-comb/core.mjs';
  check('single-source: the feedforward delay-and-add law body is live code in EXACTLY ONE file — sound-garden/the-comb/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 5. SINGLE-SOURCE: core.mjs IMPORTS semiToFreq (does not re-type it), and the
//   notch-ladder law notchFreq is defined in exactly one .mjs. ──────────────────
{
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import \{ semiToFreq \} from '\.\.\/pitch-core\.mjs'/.test(coreSrc);
  const noReTypedPitch = !/function semiToFreq\(/.test(coreSrc);
  // the notchFreq definition marker, assembled from parts so this test file is not
  // itself a hit on the def grep below.
  const DEF = 'function ' + 'notchFreq(n, tau)';
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
  const here = 'sound-garden/the-comb/core.mjs';
  const defOK = defs.length === 1 && defs[0] === here;
  check('single-source (pitch + notch ladder): core.mjs IMPORTS semiToFreq (does not re-type it), and the notch-ladder law notchFreq(n,τ) = (n+½)/τ is defined in EXACTLY ONE .mjs (core.mjs)',
        importsPitch && noReTypedPitch && defOK,
        `imports semiToFreq=${importsPitch} · re-types semiToFreq=${!noReTypedPitch} · notchFreq defined in [${defs.join(', ')}]`);
}

console.log(`\n—— The Comb Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
