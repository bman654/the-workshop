// ============================================================================
//  THE ENDLESS STAIRCASE — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-endless-staircase/core.test.mjs
//
//  Re-proves the SAME four legs the in-page pill proves (via the shared
//  runStaircaseSelfTest imported from ./core.mjs), then asserts the discipline:
//    • BYTE-TWIN parity (NEW physics) — index.html's inlined STAIRCASE CORE slice
//      === ./core.mjs's STAIRCASE CORE slice, char-for-char. The page's pill IS
//      the module's test; they cannot disagree.
//    • BYTE-TWIN parity (borrowed PITCH CORE) — index.html's PITCH CORE slice ===
//      ./core.mjs's PITCH CORE slice === ../pitch-core.mjs's PITCH CORE slice.
//      semiToFreq (and so SH_F0 = semiToFreq(−48)) is single-sourced, not re-typed.
//    • ANCHOR — SH_F0 === semiToFreq(−48) within 1e-12 (C0, DERIVED not typed),
//      and the bell centre SH_LOG_CTR === log₂(semiToFreq(0)) (the bank middle).
//    • DEEPER illusion re-derivation — the recycling really is periodic (a fine
//      θ-sweep proves shPartials(θ) === shPartials(θ+12) as a full multiset), and
//      the band is genuinely DERIVED (re-deriving it here reproduces CENTROID_BAND).
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden index, so repoRoot
//  is ../.. (the-endless-staircase → sound-garden → repo root), like the rack.
// ============================================================================
import {
  runStaircaseSelfTest, shPartials, centroidLog2, CENTROID_BAND,
  shEnvelope, shFrac, semiToFreq, SH_F0, SH_N, SH_LOG_CTR, SH_SIGMA,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
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
console.log('\n— The full in-page self-test (the shared runStaircaseSelfTest legs) —');
{
  const r = runStaircaseSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— The anchor & the bell centre are DERIVED, not typed —');

// ── 2. THE ANCHOR: SH_F0 is C0 = semiToFreq(−48), and the bell centre is the
//   bank middle = log₂(semiToFreq(0)) (middle C). Both derived from the one anchor.
{
  const dF0 = Math.abs(SH_F0 - semiToFreq(-48));
  const dCtr = Math.abs(SH_LOG_CTR - Math.log2(semiToFreq(0)));
  check('SH_F0 === semiToFreq(−48) (C0, four octaves below middle C) within 1e-12 — the bank\'s lowest partial is DERIVED from the pitch anchor, never a typed Hz literal',
        dF0 < 1e-12, `|SH_F0 − semiToFreq(−48)| = ${dF0.toExponential(2)} (SH_F0 = ${SH_F0.toFixed(6)} Hz)`);
  check('SH_LOG_CTR === log₂(semiToFreq(0)) — the bell is pinned at MIDDLE C, the geometric middle (k=4) of the C0..C8 bank, so the loud partials are flanked equally and the loop folds home exactly',
        dCtr < 1e-12, `|Δ centre| = ${dCtr.toExponential(2)} · centre = ${SH_LOG_CTR.toFixed(4)} log₂Hz · σ = ${SH_SIGMA} oct`);
}

console.log('\n— Deeper Node-only re-derivations (periodicity, the derived band) —');

// ── 3. THE RECYCLING IS GENUINELY PERIODIC: over a fine θ-sweep across a whole
//   octave (NOT just integers), the illusion's partial set at θ+12 is identical to
//   the set at θ, rung-for-rung — the standing proof that frac(θ/12) wraps the loop.
{
  let ok = true, worst = 0;
  const STEPS = 1000;
  for (let i = 0; i <= STEPS; i++){
    const theta = (i/STEPS) * 12;
    const lo = shPartials(theta), hi = shPartials(theta + 12);
    for (let k = 0; k < SH_N; k++){
      const df = Math.abs(lo[k].f - hi[k].f), da = Math.abs(lo[k].a - hi[k].a);
      worst = Math.max(worst, df, da);
      if (df > 1e-9 || da > 1e-9) ok = false;
    }
  }
  check('recycling is genuinely periodic: over 1001 sub-semitone phases across a full octave, shPartials(θ) and shPartials(θ+12) are identical rung-for-rung — the loop closes everywhere, not at a knife-edge of integer steps',
        ok, `worst |Δ| across all rungs & phases = ${worst.toExponential(2)} (< 1e-9)`);
}

// ── 4. THE BAND IS DERIVED: re-deriving the min/max of the illusion centroid over
//   a fine 0→12 sweep (the SAME recipe core.mjs uses) reproduces CENTROID_BAND,
//   and the flat LADDER centroid at θ=12 sits OUTSIDE that band by a wide margin —
//   the discriminator is real, not tuned to a knife-edge.
{
  let lo = Infinity, hi = -Infinity;
  const STEPS = 2400;
  for (let i = 0; i <= STEPS; i++){ const c = centroidLog2((i/STEPS)*12, { flat: false }); if (c < lo) lo = c; if (c > hi) hi = c; }
  const eps = 1e-9;
  const bandOK = Math.abs((lo - eps) - CENTROID_BAND.lo) < 1e-12 && Math.abs((hi + eps) - CENTROID_BAND.hi) < 1e-12;
  const cf12 = centroidLog2(12, { flat: true });
  const margin = cf12 - CENTROID_BAND.hi;
  check('the band is DERIVED, the escape is wide: re-running the min/max sweep reproduces CENTROID_BAND, and the flat LADDER centroid at θ=12 lands OUTSIDE the band by ~0.9 octaves — not a tuned knife-edge',
        bandOK && margin > 0.5,
        `band [${CENTROID_BAND.lo.toFixed(4)}, ${CENTROID_BAND.hi.toFixed(4)}] (width ${(CENTROID_BAND.hi-CENTROID_BAND.lo).toFixed(4)} oct) · ladder escapes top by ${margin.toFixed(3)} oct`);
}

console.log('\n— Byte-twin discipline (the page IS the module, char-for-char) —');

// ── 5. BYTE-TWIN PARITY (NEW physics): index.html STAIRCASE CORE === ./core.mjs.
{
  const BEGIN = '// ===== STAIRCASE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== STAIRCASE CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (STAIRCASE CORE): index.html\'s inlined STAIRCASE CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s pill runs the module\'s runStaircaseSelfTest, and the live synth/helix consume the same shPartials()',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 6. BYTE-TWIN PARITY (borrowed PITCH CORE): page === core.mjs === pitch-core.mjs.
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const src = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END), ss = sliceBetween(src, BEGIN, END);
  const allEqual = ms != null && ps != null && ss != null && ms === ps && ps === ss;
  check('byte-twin parity (PITCH CORE): the PITCH CORE slice is identical across index.html, ./core.mjs, AND ../pitch-core.mjs — semiToFreq (and so SH_F0 = semiToFreq(−48)) is single-sourced, re-typed nowhere',
        allEqual,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' : ss == null ? 'pitch-core sentinels MISSING' :
          (allEqual ? `slice ${ms.length} chars identical in all three` : `DRIFT (mod ${ms.length} / page ${ps.length} / pitch-core ${ss.length})`));
}

console.log(`\n—— The Endless Staircase Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
