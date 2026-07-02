// ============================================================================
//  THE SQUEAL BENCH — Node twin of the page's model.
//  Run:  node sound-garden/the-squeal-bench/core.test.mjs
//
//  This is a DELIGHT-FIRST leaf: there is no in-page proof pill. Well-formedness
//  lives here, in Node, and it guards the ONE thing that could silently break the
//  delight — that the model the page's eye+ear play is the SAME model this file
//  proves. It:
//    • runs the shared runSquealSelfTest (imported from ./core.mjs) — the four
//      well-formedness legs: silent-until-gesture, no-clip headroom, slip-rate
//      monotone with drag speed (labeled band), and the family separation
//      (SING pitched & dense, CREAK/QUAKE sub-audible & countable);
//    • DEEPER Node-only re-derivations — the stick-slip ONSET is a genuine vB
//      threshold (a slow drag stable-creeps SILENTLY, a faster one breaks into
//      stick-slip), and the integrator is STABLE at the stiffest quake stiffness
//      (no NaN / no runaway) — the #1 build hazard, checked;
//    • BYTE-TWIN parity — index.src.html's inlined SQUEAL CORE slice === ./core.mjs's,
//      char-for-char (the forged index.html inherits it verbatim, so the page plays
//      exactly this model);
//    • SINGLE-SOURCE — the friction-law recurrence fragment is live .mjs/.js CODE in
//      EXACTLY ONE file (./core.mjs); the page holds it only inside the byte-twin
//      slice (html, proven identical); and this leaf imports NO pitch-core (it makes
//      no note-pitch claim).
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden, so repoRoot is
//  ../.. (the-squeal-bench → sound-garden → repo root), like the-tartini-bench.
// ============================================================================
import {
  runSquealSelfTest, renderSqueal, integrate, frictionMu, slipRate, rms,
  M_BLOCK, MU_S, MU_K, V_STRIBECK, EPS_REG, SUBSTEPS, DEFAULT_SR, regimePreset,
} from './core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-squeal-bench → sound-garden → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the four well-formedness legs, the SAME the page's
//   model must satisfy — imported from ./core.mjs, run at the canonical SR). ──────
console.log('\n— The shared runSquealSelfTest (four well-formedness legs) —');
{
  const r = runSquealSelfTest(DEFAULT_SR);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations —');

// ── 2a. THE STICK-SLIP ONSET is a real vB THRESHOLD: at the sing stiffness/press, a
//   SLOW enough drag stable-creeps — the block just tracks the belt, no slips, near-
//   silent — while a faster drag BREAKS into stick-slip (slips > 0). This is the
//   physics behind "nudge the drag up and a silent creep suddenly SINGS", and it is
//   what makes the three regimes one continuum with a genuine bifurcation, not a mode.
{
  const sing = regimePreset('violin');
  const slow = renderSqueal({ k: sing.k, Fn: sing.Fn, vB: 0.004, sr: DEFAULT_SR, seconds: 1.0 });
  const fast = renderSqueal({ k: sing.k, Fn: sing.Fn, vB: 0.12,  sr: DEFAULT_SR, seconds: 1.0 });
  const slowRate = slipRate(slow), fastRate = slipRate(fast);
  // the bifurcation is in the SLIP COUNT: below the threshold the block reaches a
  // stable creep (rides the belt, zero releases → no squeal); above it, stick-slip.
  const ok = slowRate === 0 && fastRate > 40;
  check('stick-slip onset is a vB threshold: a slow drag (vB=0.004) stable-creeps with ZERO slips (the block just tracks the belt — silent), while a faster drag (vB=0.12) breaks into stick-slip with many slips — a genuine bifurcation, the continuum\'s hinge',
        ok, `slow: ${slowRate.toFixed(1)} slips/s (stable creep, no releases) · fast: ${fastRate.toFixed(1)} slips/s (stick-slip)`);
}

// ── 2b. THE INTEGRATOR IS STABLE at the STIFFEST regime (the #1 build hazard). At
//   the quake stiffness (k=1400, with the biggest press) a naive integrator would
//   SATURATE / blow up; the semi-implicit substepped integrate() must stay finite and
//   bounded (peak well under 1 in deflection units) over a long render.
{
  const q = regimePreset('quake');
  const r = renderSqueal({ k: q.k, Fn: 1.4, vB: 0.01, sr: DEFAULT_SR, seconds: 3.0 });
  let finite = true, maxAbs = 0;
  for (let i = 0; i < r.N; i++){ const y = r.buf[i]; if (!Number.isFinite(y)) { finite = false; break; } const a = y<0?-y:y; if (a>maxAbs) maxAbs=a; }
  const ok = finite && maxAbs < 0.5;
  check('integrator stable at the stiffest regime: k=1400, hard press, 3 s render stays FINITE and bounded (no NaN, no runaway) — the semi-implicit substepping tames the stiff spring that would saturate a naive Euler (the #1 build hazard)',
        ok, `finite=${finite}, peak deflection ${maxAbs.toExponential(3)} (< 0.5)`);
}

// ── 2c. THE RELEASED BOW is the LITERAL zero motion: with vB=0 the block never moves
//   from rest — every sample is exactly 0 — because friction can only respond to a
//   moving belt. The delight-first neg-control, to the bit.
{
  const r = renderSqueal({ ...regimePreset('violin'), vB: 0, sr: DEFAULT_SR, seconds: 0.5 });
  let allZero = true, worst = 0;
  for (let i = 0; i < r.N; i++){ const a = r.buf[i]<0?-r.buf[i]:r.buf[i]; if (a>worst) worst=a; if (r.buf[i] !== 0) allZero = false; }
  check('released bow is literal zero: vB=0 → every sample of the deflection buffer is EXACTLY 0 (the block never leaves rest; friction needs a moving belt) — the sound was only ever the drag',
        allZero && r.slips.length === 0, `all-zero=${allZero}, worst |x| ${worst}, slips ${r.slips.length}`);
}

console.log('\n— Byte-twin parity (the page IS the module) —');

// ── 3. BYTE-TWIN PARITY (SQUEAL CORE): index.src.html's inlined slice === ./core.mjs's
//   slice, char-for-char. forge builds index.src.html → index.html verbatim, so the
//   forged page plays exactly this model; the live worklet is BUILT from these very
//   functions' .toString(), so the sound cannot use a second copy of the law. ──────
{
  const BEGIN = '// ===== SQUEAL CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== SQUEAL CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const src = readFileSync(join(__dir, 'index.src.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(src, BEGIN, END);
  check('byte-twin parity (SQUEAL CORE): index.src.html\'s inlined CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s render, visual, and live worklet all run the module\'s exact recurrence',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'src sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs src ${ps.length})`));
}

console.log('\n— Single-source discipline (the friction law is not re-typed; no pitch anchor) —');

// ── 4. SINGLE-SOURCE GREP: the friction-law recurrence fragment lives as live
//   .mjs/.js CODE in EXACTLY ONE file — ./core.mjs. The page holds it only inside the
//   byte-twin slice (proven identical above — html, not a second source). The
//   comparison fragment is assembled from parts so this test file is NOT itself a hit.
{
  // frictionMu's body core, as core.mjs writes it (assembled so this test file does
  // not contain it verbatim — otherwise the grep would, correctly, flag the test).
  const FRAG = 'stribeck(w, muS, muK, vs) ' + '* (w / (aw ' + '+ eps));';
  const skipDirs = new Set(['.git', 'node_modules', 'assets', 'parallax-baseline']);
  const codeHits = [], allHits = [];
  function walk(dir){
    for (const ent of readdirSync(dir, { withFileTypes: true })){
      const p = join(dir, ent.name);
      if (ent.isDirectory()){ if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js|html)$/.test(ent.name)) continue;
      let s; try { s = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (s.includes(FRAG)){ allHits.push(rel); if (rel.endsWith('.mjs') || rel.endsWith('.js')) codeHits.push(rel); }
    }
  }
  walk(repoRoot);
  const here = 'sound-garden/the-squeal-bench/core.mjs';
  const ok = codeHits.length === 1 && codeHits[0] === here;
  check('single-source: the friction law μ(w) = strib(w)·w/(|w|+eps) is live code in EXACTLY ONE file — sound-garden/the-squeal-bench/core.mjs; the page (index.src.html) only byte-twins it (html, proven identical above)',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

// ── 5. NO PITCH ANCHOR: this leaf makes NO note-pitch claim — pitch emerges as the
//   slip rate — so core.mjs neither imports semiToFreq nor re-types a pitch anchor. ─
{
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  // an actual import STATEMENT of a pitch module (not the word in a prose comment)
  const importsPitch = /import[^;]*from\s*['"][^'"]*pitch-core[^'"]*['"]/.test(coreSrc);
  const reTypesPitch = /\bsemiToFreq\s*\(/.test(coreSrc) || /MIDDLE_C_HZ|261\.6/.test(coreSrc);
  check('no pitch anchor: core.mjs imports NO pitch-core and re-types NO note-pitch constant — the piece owns no note-pitch claim; pitch emerges purely as the measured slip rate',
        !importsPitch && !reTypesPitch,
        `imports pitch-core=${importsPitch} · re-types a pitch anchor=${reTypesPitch}`);
}

console.log(`\n—— The Squeal Bench Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
