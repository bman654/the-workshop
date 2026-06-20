// ============================================================================
//  THE TARTINI BENCH — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-tartini-bench/core.test.mjs
//
//  Re-proves the SAME five legs the in-page pill proves (via the shared
//  runTartiniSelfTest imported from ./core.mjs — itself built on pitch-core's
//  semiToFreq), then asserts the discipline:
//    • DEEPER re-derivations — the ε/2 difference-tone identity holds at FRESH
//      tones (middle C and a just minor third 6/5 above it — a different ratio
//      than the page's 5/4) and across an ε-sweep ε ∈ {0.05, 0.15, 0.3}, where the
//      diff bin reads ε/2 every time and ε=0 stays a true 0. Scale-free and
//      bend-size-free — not tuned to one register or one bend.
//    • BYTE-TWIN parity — index.html's inlined DIFFERENCE-TONE CORE slice ===
//      ./core.mjs's, char-for-char; and the borrowed PITCH CORE slice in the page
//      === ../pitch-core.mjs's, char-for-char.
//    • SINGLE-SOURCE — the horn law / `eps / 2` fragment is live .mjs CODE in
//      EXACTLY ONE file (./core.mjs); the page holds it only inside the byte-twin
//      slice (html, proven identical); and core.mjs IMPORTS semiToFreq rather than
//      re-typing it.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden, so repoRoot is
//  ../.. (the-tartini-bench → sound-garden → repo root), like the-overtone-rack.
// ============================================================================
import {
  runTartiniSelfTest, diffToneFreq, sumToneFreq, hornTransfer, stimulus,
  diffBinMag, diffBinMagLinear, goertzelMag, renderHorn, analysisWindow,
  F1, F2, EPS, semiToFreq,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-tartini-bench → sound-garden → repo root
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
console.log('\n— The full in-page self-test (the shared runTartiniSelfTest legs) —');
{
  const r = runTartiniSelfTest(F1, F2, EPS);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (fresh tones, ε-sweep) —');

// ── 2a. THE ε/2 IDENTITY at FRESH tones: middle C and a JUST minor third (6/5)
//   above it — a DIFFERENT ratio than the page's 5/4 — so the difference-tone
//   identity is shown scale-free AND ratio-free, not tuned to the page's interval.
{
  const C = semiToFreq(0);          // middle C ≈ 261.63 Hz
  const Cm3 = C * (6 / 5);          // a just minor third above — a fresh ratio
  const { SR, N } = analysisWindow(C, Cm3);
  const y = renderHorn(C, Cm3, 0.18, SR, N);
  const measured = goertzelMag(y, diffToneFreq(C, Cm3), SR);
  const want = diffBinMag(0.18);
  const ok = Math.abs(measured - want) < 1e-9;
  check('fresh-tone identity: at middle C with a just minor third (6/5) above — a different ratio than the page\'s 5/4 — the difference bin reads ε/2 to <1e-9; the third tone is not tuned to one interval',
        ok, `fd ${diffToneFreq(C, Cm3).toFixed(2)} Hz · measured ${measured.toExponential(6)} vs ε/2 ${want.toExponential(6)} — Δ ${Math.abs(measured - want).toExponential(2)}`);
}

// ── 2b. THE ε-SWEEP: the diff bin tracks ε/2 across a range of bends, and the
//   LINEAR path (ε=0) is a true 0 — the bloom is exactly the bend, no more, no less.
{
  let ok = true; const rows = [];
  const { SR, N } = analysisWindow(F1, F2);
  for (const eps of [0.05, 0.15, 0.3]){
    const y = renderHorn(F1, F2, eps, SR, N);
    const m = goertzelMag(y, diffToneFreq(F1, F2), SR);
    const d = Math.abs(m - eps / 2);
    rows.push(`ε=${eps}→${m.toFixed(4)}`);
    if (d >= 1e-9) ok = false;
  }
  const y0 = renderHorn(F1, F2, 0, SR, N);
  const zero = goertzelMag(y0, diffToneFreq(F1, F2), SR);
  ok = ok && zero < 1e-9 && diffBinMagLinear() === 0;
  check('ε-sweep: the difference bin tracks ε/2 across ε ∈ {0.05, 0.15, 0.3} to <1e-9, and ε=0 is a true 0 — the bloom is exactly the bend',
        ok, `${rows.join(' · ')} · linear(ε=0) ${zero.toExponential(2)} (<1e-9), diffBinMagLinear() === 0`);
}

// ── 2c. THE HORN IS THE IDENTITY ON LINEAR, to the bit: hornTransfer(x,0) === x
//   for every sample of a stimulus buffer — the negative control is literally the
//   pass-through, with nothing added.
{
  const { SR, N } = analysisWindow(F1, F2);
  let ok = true, worst = 0;
  for (let i = 0; i < N; i++){
    const x = stimulus(F1, F2, i / SR);
    const d = Math.abs(hornTransfer(x, 0) - x);
    worst = Math.max(worst, d);
    if (d !== 0) ok = false;
  }
  check('hornTransfer(x, 0) === x to the bit over a whole stimulus buffer — LINEAR is the literal identity, the negative control adds nothing',
        ok, `worst Δ ${worst}`);
}

console.log('\n— Byte-twin parity (the page IS the module) —');

// ── 3a. BYTE-TWIN PARITY (DIFFERENCE-TONE CORE): index.html's inlined slice ===
//   ./core.mjs's slice, char-for-char — the page's runTartiniSelfTest IS the
//   module's, and the live horn applies the same hornTransfer.
{
  const BEGIN = '// ===== DIFFERENCE-TONE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== DIFFERENCE-TONE CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (DIFFERENCE-TONE CORE): index.html\'s inlined CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runTartiniSelfTest IS the module\'s, and the live horn applies the same hornTransfer',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 3b. BYTE-TWIN PARITY (borrowed PITCH CORE): the page inlines pitch-core's
//   PITCH CORE slice (giving it semiToFreq, so F1/F2 are derived) char-for-char. ─
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so F1 = semiToFreq(−3), F2 = F1·5/4) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

console.log('\n— Single-source discipline (the horn law is not re-typed) —');

// ── 4. SINGLE-SOURCE GREP: the horn law lives as live .mjs/.js CODE in EXACTLY
//   ONE file — ./core.mjs. The page holds it only inside the byte-twin slice
//   (proven identical above — html, not a second source). The comparison fragment
//   is assembled from parts so this test file is NOT itself a hit.
{
  // hornTransfer's body, as core.mjs writes it (assembled from parts so this test
  // file does not contain it verbatim — otherwise the grep would, correctly, flag
  // the test as a second mention; mirrors the sibling leaves' single-source trick).
  const FRAG = 'return x ' + '+ eps ' + '* x * x;';
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
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-tartini-bench/core.mjs';
  check('single-source: the horn law y = x + ε·x² is live code in EXACTLY ONE file — sound-garden/the-tartini-bench/core.mjs; the page only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 5. SINGLE-SOURCE: core.mjs IMPORTS semiToFreq (does not re-type it), and the
//   analytic ε/2 difference-tone coefficient is defined in exactly one .mjs. ────
{
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import \{ semiToFreq \} from '\.\.\/pitch-core\.mjs'/.test(coreSrc);
  const noReTypedPitch = !/function semiToFreq\(/.test(coreSrc);
  // the diffBinMag definition marker, assembled from parts so this test file is not
  // itself a hit on the def grep below.
  const DEF = 'function ' + 'diffBinMag(eps)';
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
  const here = 'sound-garden/the-tartini-bench/core.mjs';
  const defOK = defs.length === 1 && defs[0] === here;
  check('single-source (pitch + coefficient): core.mjs IMPORTS semiToFreq (does not re-type it), and the analytic ε/2 difference-tone coefficient diffBinMag is defined in EXACTLY ONE .mjs (core.mjs)',
        importsPitch && noReTypedPitch && defOK,
        `imports semiToFreq=${importsPitch} · re-types semiToFreq=${!noReTypedPitch} · diffBinMag defined in [${defs.join(', ')}]`);
}

console.log(`\n—— The Tartini Bench Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
