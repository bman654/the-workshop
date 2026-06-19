// ============================================================================
//  THE OVERTONE RACK — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-overtone-rack/core.test.mjs
//
//  Re-proves the SAME four legs the in-page pill proves (via the shared
//  runRackSelfTest imported from ./core.mjs — itself built on the bench's
//  `partials` ladder + pitch-core's semiToFreq), then asserts the discipline:
//    • DEEPER re-derivations — estimateF0 recovers f₀ with / without the
//      fundamental, on the odd-only set, at FRESH fundamentals (middle C, G3) —
//      the active-set / 2nd-fundamental requirement, beyond the bundled legs.
//    • INHARMONIC SWEEP boundary — stretch ∈ {1.2, 1.4, 1.7} → ok:false, and
//      stretch = 1.0 (exactly harmonic) → ok:true. The boundary is real, not a
//      knife-edge: the estimator only fails when the spacing genuinely is not a
//      common multiple.
//    • BYTE-TWIN parity (NEW physics) — index.html's inlined OVERTONE CORE slice
//      === ./core.mjs's OVERTONE CORE slice, char-for-char.
//    • SINGLE-SOURCE — the 1/n amplitude law is live code in EXACTLY ONE file
//      (./core.mjs); estimateF0 / floatGcd are each defined in exactly one .mjs;
//      and core.mjs does NOT re-type the k·g ladder (it imports `partials`).
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the rack, so repoRoot is
//  ../.. (the-overtone-rack → sound-garden → repo root), like the-beating-bench.
// ============================================================================
import {
  runRackSelfTest, sawRack, squareRack, activeFreqs, estimateF0,
  inharmonicFreqs, partialMultiplier, additiveSample, waveform,
  RACK_SIZE, EST_REL_TOL, INHARM_STRETCH, partials, semiToFreq, F0, F0_ALT,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-overtone-rack → sound-garden → repo root
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
console.log('\n— The full in-page self-test (the shared runRackSelfTest legs) —');
{
  const r = runRackSelfTest(F0, F0_ALT, partials);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (fresh fundamentals, active sets) —');

// ── 2. THE MISSING FUNDAMENTAL re-derived at TWO fresh fundamentals. ──────────
//   middle C (261.625565 Hz) and G3 (196.0 Hz) — NOT the page's f0/f0Alt — to
//   show the recovery is scale-free. With / without the fundamental, and on the
//   odd-only square set, estimateF0 returns the SAME f₀ to within EST_REL_TOL.
{
  let ok = true, worst = 0; const rows = [];
  for (const base of [261.625565, 196.0]){
    const saw = sawRack(), sq = squareRack();
    const full = activeFreqs(saw, base, partials, false);
    const cases = [
      ['full', full],
      ['pulled', full.slice(1)],
      ['odd', activeFreqs(sq, base, partials, false)],
      ['oddPulled', activeFreqs(sq, base, partials, false).slice(1)],
    ];
    for (const [tag, fr] of cases){
      const est = estimateF0(fr);
      const rel = Math.abs(est.f0 - base) / base;
      worst = Math.max(worst, rel);
      if (!(est.ok && rel <= EST_REL_TOL)) { ok = false; rows.push(`${base}/${tag} FAIL`); }
    }
  }
  check('missing-fundamental re-derived at fresh fundamentals (middle C 261.63 Hz, G3 196 Hz): with / without the fundamental AND on the odd-only set, estimateF0 returns the SAME f₀ — the active-set / 2nd-fundamental recovery is scale-free',
        ok, ok ? `f₀ recovered at both fresh fundamentals across full/pulled/odd/oddPulled — worst |Δf₀|/f₀ = ${worst.toExponential(2)} ≤ ${EST_REL_TOL}` : rows.join(' · '));
}

// ── 3. THE INHARMONIC BOUNDARY: stretch sweep around the harmonic edge. ───────
//   The eight-partial stack f0·n^s: at s = 1.0 it is EXACTLY harmonic → ok:true;
//   at s ∈ {1.2, 1.4, 1.7} it is inharmonic → ok:false. The failure is the
//   spacing, and it appears the instant the stack leaves the integer grid.
{
  const ns = [1, 2, 3, 4, 5, 6, 7, 8];
  const harmonic = estimateF0(ns.map(n => F0 * Math.pow(n, 1.0)));   // s=1 → exact harmonic
  let inharmAllFail = true; const rows = [];
  for (const s of [1.2, 1.4, 1.7]){
    const est = estimateF0(ns.map(n => F0 * Math.pow(n, s)));
    rows.push(`s=${s} → ok:${est.ok}`);
    if (est.ok !== false) inharmAllFail = false;
  }
  check('inharmonic boundary: the SAME estimator returns ok:true at stretch s=1.0 (exactly harmonic) and ok:false at s ∈ {1.2, 1.4, 1.7} — the failure appears the instant the partials leave the integer grid, it is not a knife-edge',
        harmonic.ok === true && inharmAllFail,
        `s=1.0 → ok:${harmonic.ok} (f₀ ${harmonic.f0.toFixed(2)}) · ${rows.join(' · ')}`);
}

// ── 4. THE SUM IS THE SHAPE (a direct re-derivation): the additive saw sum at a
//   fine grid agrees with waveform() to the bit, and a pure-fundamental rack
//   (a₁=1, else 0) is exactly sin(2πt). The trace is the function. ────────────
{
  const saw = sawRack();
  const wf = waveform(saw, 256);
  let ok = true, worst = 0;
  for (let k = 0; k < 256; k++){ const d = Math.abs(wf[k] - additiveSample(saw, k / 256)); worst = Math.max(worst, d); if (d > 0) ok = false; }
  const pure = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let pureOK = true, pw = 0;
  for (let k = 0; k < 64; k++){ const t = k / 64; const d = Math.abs(additiveSample(pure, t) - Math.sin(2 * Math.PI * t)); pw = Math.max(pw, d); if (d > 1e-12) pureOK = false; }
  check('the sum is the shape: waveform() equals additiveSample() to the bit over a period, and a pure-fundamental rack is exactly sin(2πt) — the drawn trace IS the additive function the ear hears',
        ok && pureOK, `waveform parity worst Δ ${worst.toExponential(2)} · pure fundamental = sin(2πt) worst Δ ${pw.toExponential(2)}`);
}

console.log('\n— Single-source discipline (the proofs the laws are not re-typed) —');

// ── 5. BYTE-TWIN PARITY (NEW physics): index.html OVERTONE CORE === ./core.mjs.
{
  const BEGIN = '// ===== OVERTONE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== OVERTONE CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (OVERTONE CORE): index.html\'s inlined OVERTONE CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runRackSelfTest IS the module\'s, and the live rack sums the same additiveSample()',
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
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so f₀ = semiToFreq(−9)) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 7. BYTE-TWIN PARITY (borrowed harmonic ladder): the page inlines the bench's
//   `partials` (k·g) as its own byte-twin slice, char-for-char the bench's. ──
{
  const BEGIN = '// ===== HARMONIC LADDER (inlined byte-twin) BEGIN =====';
  const END = '// ===== HARMONIC LADDER (inlined byte-twin) END =====';
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const bench = readFileSync(join(__dir, '..', 'the-beating-bench', 'core.mjs'), 'utf8');
  const ps = sliceBetween(page, BEGIN, END);
  // the bench defines `partials` inside its BEAT CORE — re-extract the function
  // body and assert the page's twin contains the SAME k·g definition, verbatim.
  const benchFn = (() => {
    const m = bench.match(/function partials\(g, n = N_PARTIALS\) \{[\s\S]*?\n\}/);
    return m ? m[0] : null;
  })();
  check('byte-twin parity (HARMONIC LADDER): index.html inlines the bench\'s `partials` (the k·g ladder) char-for-char — the page is self-contained yet the ladder is single-sourced, not re-typed',
        ps != null && benchFn != null && ps.includes(benchFn),
        ps == null ? 'page ladder sentinels MISSING' : benchFn == null ? 'bench partials() not found' :
          (ps.includes(benchFn) ? `page twin contains the bench\'s partials() verbatim (${benchFn.length} chars)` : 'page twin DIFFERS from bench partials()'));
}

// ── 8. SINGLE-SOURCE GREP: the 1/n amplitude law lives as live .mjs/.js CODE in
//   EXACTLY ONE file — ./core.mjs. The page holds it only inside the byte-twin
//   OVERTONE CORE slice (proven identical in leg 5 — html, not a second source).
//   The comparison fragment is built from parts so this test is not itself a hit.
{
  // sawAmp's body, as core.mjs writes it (the literal is assembled from parts so
  // this test file does NOT contain it verbatim — otherwise the grep would,
  // correctly, flag the test as a second mention; mirrors the bench's leg-8 trick).
  const FRAG = 'return 1 ' + '/ ' + 'n;';
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
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/the-overtone-rack/core.mjs';
  check('single-source: the 1/n amplitude law is live code in EXACTLY ONE file — sound-garden/the-overtone-rack/core.mjs; the page only byte-twins it (html, proven identical in leg 5)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 9. SINGLE-SOURCE: estimateF0 and floatGcd are each DEFINED in exactly one
//   .mjs file, and core.mjs does NOT re-type the k·g ladder (it imports it). ──
{
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  const defs = { est: [], gcd: [] };
  // the two definition markers, assembled from parts so this test file is not
  // itself a hit (the grep would otherwise flag the grep strings below).
  const EST_DEF = 'function ' + 'estimateF0(';
  const GCD_DEF = 'function ' + 'floatGcd(';
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.mjs$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(EST_DEF)) defs.est.push(rel);
      if (src.includes(GCD_DEF)) defs.gcd.push(rel);
    }
  }
  walk(repoRoot);
  const here = 'sound-garden/the-overtone-rack/core.mjs';
  const estOK = defs.est.length === 1 && defs.est[0] === here;
  const gcdOK = defs.gcd.length === 1 && defs.gcd[0] === here;
  // core.mjs must IMPORT partials, not re-type the k·g ladder body.
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsLadder = /import \{ partials \} from '\.\.\/the-beating-bench\/core\.mjs'/.test(coreSrc);
  const noReTypedLadder = !/function partials\(/.test(coreSrc);
  check('single-source (estimator + ladder): function estimateF0 and function floatGcd are each defined in EXACTLY ONE .mjs (core.mjs), and core.mjs IMPORTS the k·g `partials` ladder rather than re-typing it',
        estOK && gcdOK && importsLadder && noReTypedLadder,
        `estimateF0 in [${defs.est.join(', ')}] · floatGcd in [${defs.gcd.join(', ')}] · imports partials=${importsLadder} · re-types ladder=${!noReTypedLadder}`);
}

console.log(`\n—— The Overtone Rack Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
