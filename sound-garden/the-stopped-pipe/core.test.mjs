// ============================================================================
//  THE STOPPED PIPE — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-stopped-pipe/core.test.mjs
//
//  Re-proves the SAME five legs the in-page pill proves (via the shared
//  runPipeSelfTest imported from ./core.mjs, itself built on pitch-core's
//  semiToFreq), then asserts the discipline:
//    • DEEPER re-derivation — the OCTAVE ratio = 2.000000 at TWO fresh degrees
//      NOT used by the page (C3, G4) — the claim is scale-free.
//    • NEG-CONTROL CRUX (falsifiable teeth) — rendering the stopped pipe with
//      sign=+1 (the bug: forgetting the cap inverts) makes the evens RETURN
//      (even/odd jumps from ~1e-4 to order ~1) AND flips autocorr@N from −0.99 to
//      +0.99 — the sign is load-bearing; the claims are not tautologies.
//    • BYTE-TWIN parity (PIPE CORE) — index.html's inlined PIPE CORE slice
//      === ./core.mjs's PIPE CORE slice, char-for-char.
//    • BYTE-TWIN parity (PITCH CORE) — index.html's inlined PITCH CORE slice
//      === ../pitch-core.mjs's PITCH CORE slice, char-for-char.
//    • SINGLE-SOURCE — the signed loop recurrence literal is live code in EXACTLY
//      ONE file (./core.mjs); the page holds it only inside the byte-twin PIPE
//      CORE slice (html, proven identical above). The fragment is assembled from
//      parts so the test is not itself a hit; the reed's `g * (b * x1 …` differs
//      by the `sign *` prefix so there is no false cross-hit. And renderPipe /
//      runPipeSelfTest are each defined in exactly one .mjs, with semiToFreq
//      IMPORTED, not re-typed.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level below sound-garden, so repoRoot is ../..
//  (the-stopped-pipe → sound-garden → repo root).
// ============================================================================
import {
  runPipeSelfTest, delayLength, renderPipe, bestFracLag, autocorr, goertzel,
  DEFAULT_SR, semiToFreq, F_HOME, F_ALT, SIGN_OPEN, SIGN_STOPPED, P_BLOW,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-stopped-pipe → sound-garden → repo root
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
console.log('\n— The full in-page self-test (the shared runPipeSelfTest legs) —');
{
  const r = runPipeSelfTest(F_HOME, F_ALT, DEFAULT_SR);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (fresh degrees, the falsifiable crux) —');

// ── 2. OCTAVE re-derived at TWO FRESH scale degrees (C3 = semi −12, G4 = semi 7),
//   NOT the page's home/alt — to show the octave drop is scale-free. The capped
//   pipe's fractional fundamental is EXACTLY an octave below the open pipe's. ────
{
  let ok = true, worst = 0; const rows = [];
  for (const semi of [-12, 7]){                                 // C3 (N≈337), G4 (N≈126) — fresh degrees
    const f = semiToFreq(semi);
    const N = delayLength(f, DEFAULT_SR);
    const open = renderPipe(N, { sign: SIGN_OPEN, seconds: 1.0, seed: 23 });
    const stop = renderPipe(N, { sign: SIGN_STOPPED, seconds: 1.0, seed: 23 });
    const s = N * 12, e = open.buf.length;
    const fracOpen = bestFracLag(open.buf, N - 2, N + 2, s, e);
    const fracStop = bestFracLag(stop.buf, 2 * N - 3, 2 * N + 3, s, e);
    const ratio = (DEFAULT_SR / fracOpen) / (DEFAULT_SR / fracStop);
    worst = Math.max(worst, Math.abs(ratio - 2));
    if (!(Math.abs(ratio - 2) < 1e-4)) { ok = false; rows.push(`semi ${semi} (N=${N}): ratio ${ratio.toFixed(6)}`); }
  }
  check('OCTAVE re-derived at fresh scale degrees (C3 N≈337, G4 N≈126 — not the page\'s home/alt): the capped pipe\'s fractional fundamental is EXACTLY an octave below the open pipe\'s (ratio = 2.000000) — the octave drop is scale-free, set by the sign flip, not tuned to one note',
        ok, ok ? `open/stopped fundamental ratio = 2.000000 at both fresh degrees (worst |Δ| ${worst.toExponential(1)})` : rows.join(' · '));
}

// ── 3. THE NEG-CONTROL CRUX (falsifiable teeth): the headline depends on the SIGN.
//   Render the "stopped" pipe with sign=+1 (the bug — forgetting that the cap
//   inverts the reflection) at the SAME N and SAME blow. The evens RETURN (even/odd
//   energy jumps from ~1e-4 to order ~1) AND autocorr@N flips from −0.99 to +0.99.
//   So both the odd-only claim and the period-doubling claim genuinely constrain
//   the sign — they are not tautologies of the synthesis. ───────────────────────
{
  const N = delayLength(F_HOME, DEFAULT_SR), fOpen = DEFAULT_SR / N, fStop = fOpen / 2;
  const win = N * 40, m = N * 12, s = N * 12;
  // measure even/odd at the STOPPED fundamental ladder for both signs
  function evenOdd(sign){
    const r = renderPipe(N, { sign, seconds: 1.0, seed: 7 });
    let ev = 0, od = 0;
    for (let n = 1; n <= 7; n++){ const a = goertzel(r.buf, m, m + win, n * fStop, DEFAULT_SR); if (n % 2) od += a * a; else ev += a * a; }
    return { eo: od > 0 ? ev / od : Infinity, ac: autocorr(r.buf, N, s, r.buf.length) };
  }
  const capped = evenOdd(SIGN_STOPPED);   // the real cap
  const buggy = evenOdd(SIGN_OPEN);       // the bug: cap that "forgot" to invert
  const evensReturn = buggy.eo > capped.eo * 1e3 && buggy.eo > 0.1;   // evens jump back up by ≫1000×
  const acFlips = capped.ac < -0.9 && buggy.ac > 0.9;                 // antiperiodic → periodic
  check('neg-control CRUX (falsifiable teeth): a "stopped" pipe rendered with sign=+1 (the bug — forgetting the cap inverts) makes the evens RETURN (even/odd jumps from ~1e-4 to order ~1, a ≫1000× swing) AND flips autocorr@N from −0.99 to +0.99 — the sign is load-bearing, the odd-only & period-doubling claims are not tautologies',
        evensReturn && acFlips,
        `capped (sign −1): even/odd ${capped.eo.toExponential(2)}, acorr@N ${capped.ac.toFixed(3)} · bug (sign +1): even/odd ${buggy.eo.toExponential(2)}, acorr@N ${buggy.ac.toFixed(3)}`);
}

console.log('\n— Single-source discipline (the proofs the recurrence is not re-typed) —');

// ── 4. BYTE-TWIN PARITY (PIPE CORE): index.html PIPE CORE === ./core.mjs. ─────
{
  const BEGIN = '// ===== PIPE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PIPE CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (PIPE CORE): index.html\'s inlined PIPE CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runPipeSelfTest IS the module\'s, and the live pipe runs the same signed recurrence the test proves',
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
  check('byte-twin parity (PITCH CORE): index.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — semiToFreq (and so the pipe\'s pitches) is single-sourced, not re-typed',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
}

// ── 6. SINGLE-SOURCE GREP: the signed loop recurrence is live .mjs/.js CODE in
//   EXACTLY ONE file — ./core.mjs. The page holds it only inside the byte-twin
//   PIPE CORE slice (html, proven identical in check 4). The fragment is the FULL
//   recurrence line WITH its `sign *` prefix, assembled from parts so this test
//   file is NOT itself a hit, and so it does NOT collide with the Plucked Reed's
//   `g * (b * x1 + (1 - b) * x2)` (which lacks the `sign *` prefix). ────────────
{
  // the recurrence body, EXACTLY as core.mjs writes it, assembled from parts so
  // the literal does not appear verbatim in this test file (else the grep would,
  // correctly, flag the test as a second mention). The `sign * ` prefix is what
  // distinguishes it from the Plucked Reed's open-loop recurrence.
  const FRAG = 'sign * g * (b * x1 ' + '+ (1 - b) * x2);';
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
  const here = 'sound-garden/the-stopped-pipe/core.mjs';
  const ok = codeHits.length === 1 && codeHits[0] === here
    && allHits.length === 2 && allHits.includes('sound-garden/the-stopped-pipe/index.html');
  check('single-source: the signed loop recurrence sign·g·(b·x₁+(1−b)·x₂) is live code in EXACTLY ONE file — sound-garden/the-stopped-pipe/core.mjs; the page only byte-twins it (html, proven identical above), and the `sign *` prefix keeps it distinct from the Plucked Reed\'s open-loop recurrence',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 7. SINGLE-SOURCE: renderPipe and runPipeSelfTest are each DEFINED in exactly
//   one .mjs file, and core.mjs IMPORTS semiToFreq rather than re-typing it. ────
{
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline', 'out-of-tune']);
  const defs = { render: [], test: [] };
  const REND_DEF = 'function ' + 'renderPipe(';
  const TEST_DEF = 'function ' + 'runPipeSelfTest(';
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
  const here = 'sound-garden/the-stopped-pipe/core.mjs';
  const renderOK = defs.render.length === 1 && defs.render[0] === here;
  const testOK = defs.test.length === 1 && defs.test[0] === here;
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import \{ semiToFreq \} from '\.\.\/pitch-core\.mjs'/.test(coreSrc);
  const noReTypedSemi = !/function semiToFreq\(/.test(coreSrc);
  check('single-source (renderer + pitch): function renderPipe and function runPipeSelfTest are each defined in EXACTLY ONE .mjs (core.mjs), and core.mjs IMPORTS semiToFreq rather than re-typing it',
        renderOK && testOK && importsPitch && noReTypedSemi,
        `renderPipe in [${defs.render.join(', ')}] · runPipeSelfTest in [${defs.test.join(', ')}] · imports semiToFreq=${importsPitch} · re-types semiToFreq=${!noReTypedSemi}`);
}

console.log(`\n—— The Stopped Pipe Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
