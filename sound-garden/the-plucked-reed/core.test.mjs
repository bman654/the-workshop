// ============================================================================
//  THE PLUCKED REED — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-plucked-reed/core.test.mjs
//
//  Re-proves the SAME five legs the in-page pill proves (via the shared
//  runReedSelfTest imported from ./core.mjs, itself built on pitch-core's
//  semiToFreq), then asserts the discipline:
//    • DEEPER re-derivations — the PITCH recovers sr/N at FRESH scale degrees
//      (A2, C5) NOT used by the bundled leg, and an off-by-one tap is shown to
//      shift the recovered period off N (the falsifiable crux of leg 1).
//    • BYTE-TWIN parity (REED CORE) — index.html's inlined REED CORE slice
//      === ./core.mjs's REED CORE slice, char-for-char.
//    • BYTE-TWIN parity (PITCH CORE) — index.html's inlined PITCH CORE slice
//      === ../pitch-core.mjs's PITCH CORE slice, char-for-char.
//    • SINGLE-SOURCE — the Karplus-Strong recurrence literal is live code in
//      EXACTLY ONE file (./core.mjs); the page holds it only inside the byte-twin
//      REED CORE slice (html, proven identical above). The comparison fragment is
//      assembled from parts and matched on the FULL recurrence line so the test
//      is not itself a hit and an incidental sub-fragment elsewhere can't false-fail.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level below sound-garden, so repoRoot is ../..
//  (the-plucked-reed → sound-garden → repo root).
// ============================================================================
import {
  runReedSelfTest, delayLength, renderReed, bestFracLag,
  DEFAULT_SR, semiToFreq, F_HOME, F_ALT,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-plucked-reed → sound-garden → repo root
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
console.log('\n— The full in-page self-test (the shared runReedSelfTest legs) —');
{
  const r = runReedSelfTest(F_HOME, F_ALT, DEFAULT_SR);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (fresh scale degrees, the off-by-one crux) —');

// ── 2. PITCH re-derived at TWO FRESH scale degrees (A2 = semi −15, C5 = semi 12),
//   NOT the page's home/alt — to show the recovery is scale-free. The settled
//   portion's FRACTIONAL period equals the predicted N + (1−b) and lands within a
//   few cents of sr/N. ─────────────────────────────────────────────────────────
{
  const b = 0.5;
  let ok = true, worstCents = 0, worstPred = 0; const rows = [];
  for (const semi of [-15, 12]){                              // A2, C5 — fresh degrees
    const f = semiToFreq(semi);
    const N = delayLength(f, DEFAULT_SR);
    const { buf } = renderReed(N, { g: 0.997, b, p: 0.5, seconds: 0.5, seed: 23 });
    const frac = bestFracLag(buf, N - 2, N + 2, N * 8, buf.length);
    const predicted = N + (1 - b);
    const predErr = Math.abs(frac - predicted);
    const cents = Math.abs(1200 * Math.log2((DEFAULT_SR / frac) / (DEFAULT_SR / N)));
    worstCents = Math.max(worstCents, cents); worstPred = Math.max(worstPred, predErr);
    // the predicted-period match is the exact claim (predErr ~5e-3 samples); the
    // sub-sample (1−b) filter delay is a LARGER fraction of a short period, so the
    // deviation from sr/N grows for high pitches (C5, N=84 → ~10¢) — still small.
    if (!(predErr < 0.05 && cents < 12)) { ok = false; rows.push(`semi ${semi}: frac ${frac.toFixed(3)} vs pred ${predicted}, ${cents.toFixed(2)}¢`); }
  }
  check('PITCH re-derived at fresh scale degrees (A2, C5 — not the page\'s home/alt): the settled-portion fractional period equals N + (1−b) exactly and sr/N lands within ~10 cents (the sub-sample filter delay is a larger fraction of a short period) — the delay length sets the pitch, scale-free',
        ok, ok ? `period = N+(1−b) at both fresh degrees (worst pred Δ ${worstPred.toExponential(2)} samples, ${worstCents.toFixed(2)}¢ from sr/N)` : rows.join(' · '));
}

// ── 3. THE OFF-BY-ONE CRUX: a delay tap of N+1 (a deliberate bug) shifts the
//   recovered period OFF N — proving leg 1 actually constrains the tap, it is not
//   a tautology. We render with the WRONG length and confirm the best lag tracks
//   the wrong length, not N. ───────────────────────────────────────────────────
{
  const b = 0.5;
  const f = F_HOME;
  const N = delayLength(f, DEFAULT_SR);
  const correctPeriod = N + (1 - b);           // the right reed's fractional period
  // render a deliberately mistuned reed at N+1 and N-1; the recovered fractional
  // period must follow the buggy length (Nbug + (1−b)), a FULL sample away from
  // the correct period — so the PITCH leg genuinely constrains the tap.
  let ok = true; const rows = [];
  for (const dN of [+1, -1]){
    const Nbug = N + dN;
    const { buf } = renderReed(Nbug, { g: 0.997, b, p: 0.5, seconds: 0.5, seed: 29 });
    const frac = bestFracLag(buf, N - 3, N + 3, Nbug * 8, buf.length);
    const predBug = Nbug + (1 - b);
    const tracksBug = Math.abs(frac - predBug) < 0.1;
    const awayFromCorrect = Math.abs(frac - correctPeriod) > 0.6;   // ≈ a full sample off
    if (!(tracksBug && awayFromCorrect)) { ok = false; rows.push(`dN ${dN}: frac ${frac.toFixed(3)} vs bug-pred ${predBug}`); }
  }
  check('off-by-one crux: rendering with a deliberately wrong delay length (N±1) shifts the recovered fractional period to that wrong length — a full sample off the correct N+(1−b) — so the PITCH leg genuinely constrains the delay tap (an off-by-one would go red), not a tautology',
        ok, ok ? `recovered period tracked N+1 and N−1 (each ≈ Nbug+(1−b)), a full sample off the correct ${correctPeriod}` : rows.join(' · '));
}

console.log('\n— Single-source discipline (the proofs the recurrence is not re-typed) —');

// ── 4. BYTE-TWIN PARITY (REED CORE): index.html REED CORE === ./core.mjs. ─────
{
  const BEGIN = '// ===== REED CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== REED CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (REED CORE): index.html\'s inlined REED CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runReedSelfTest IS the module\'s, and the live reed runs the same recurrence the test proves',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 5. BYTE-TWIN PARITY (PITCH CORE): the page inlines pitch-core's PITCH CORE
//   slice (giving it semiToFreq) char-for-char ../pitch-core.mjs. ──────────────
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so the fret-mark Hz) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 6. SINGLE-SOURCE GREP: the Karplus-Strong recurrence is live .mjs/.js CODE in
//   EXACTLY ONE file — ./core.mjs. The page holds it only inside the byte-twin
//   REED CORE slice (html, proven identical in check 4). The fragment is the FULL
//   recurrence line, assembled from parts so this test file is NOT itself a hit and
//   no incidental sub-fragment elsewhere can false-fail. ───────────────────────
{
  // the recurrence body, EXACTLY as core.mjs writes it, assembled from parts so
  // the literal does not appear verbatim in this test file (else the grep would,
  // correctly, flag the test as a second mention). Mirrors the rack's leg-8 trick
  // but matches the WHOLE line (not a colliding sub-fragment like `1 / n`).
  const FRAG = 'g * (b * x1 ' + '+ (1 - b) * x2);';
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline', 'out-of-tune']);
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
  const here = 'sound-garden/the-plucked-reed/core.mjs';
  const ok = codeHits.length === 1 && codeHits[0] === here
    && allHits.length === 2 && allHits.includes('sound-garden/the-plucked-reed/index.html');
  check('single-source: the Karplus-Strong recurrence g·(b·x₁+(1−b)·x₂) is live code in EXACTLY ONE file — sound-garden/the-plucked-reed/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 7. SINGLE-SOURCE: renderReed and runReedSelfTest are each DEFINED in exactly
//   one .mjs file, and core.mjs IMPORTS semiToFreq rather than re-typing it. ────
{
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline', 'out-of-tune']);
  const defs = { render: [], test: [] };
  const REND_DEF = 'function ' + 'renderReed(';
  const TEST_DEF = 'function ' + 'runReedSelfTest(';
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.mjs$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(REND_DEF)) defs.render.push(rel);
      if (src.includes(TEST_DEF)) defs.test.push(rel);
    }
  }
  walk(repoRoot);
  const here = 'sound-garden/the-plucked-reed/core.mjs';
  const renderOK = defs.render.length === 1 && defs.render[0] === here;
  const testOK = defs.test.length === 1 && defs.test[0] === here;
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import \{ semiToFreq \} from '\.\.\/pitch-core\.mjs'/.test(coreSrc);
  const noReTypedSemi = !/function semiToFreq\(/.test(coreSrc);
  check('single-source (renderer + pitch): function renderReed and function runReedSelfTest are each defined in EXACTLY ONE .mjs (core.mjs), and core.mjs IMPORTS semiToFreq rather than re-typing it',
        renderOK && testOK && importsPitch && noReTypedSemi,
        `renderReed in [${defs.render.join(', ')}] · runReedSelfTest in [${defs.test.join(', ')}] · imports semiToFreq=${importsPitch} · re-types semiToFreq=${!noReTypedSemi}`);
}

console.log(`\n—— The Plucked Reed Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
