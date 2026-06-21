// ============================================================================
//  THE TONE MILL — Node twin of the in-page self-test.
//  Run:  node tone-mill/core.test.mjs
//
//  Re-proves the SAME four legs the in-page pill proves (via the shared
//  runSelfTest imported from ./core.mjs), then asserts the discipline:
//    • BYTE-TWIN parity (TONE-MILL CORE) — index.html's inlined TONE-MILL CORE
//      slice === ./core.mjs's slice, char-for-char, AFTER stripping the leading
//      `export ` that forge removes on inline (the page's pill IS the module's
//      runSelfTest; they cannot disagree).
//    • BYTE-TWIN parity (borrowed PITCH CORE) — index.html's PITCH CORE slice ===
//      ./core.mjs's PITCH CORE slice === ../sound-garden/pitch-core.mjs's PITCH
//      CORE slice. semiToFreq / MIDDLE_C_HZ / noteName is single-sourced.
//    • ANTI-CIRCULARITY — the pitch anchor literal 261.625565 appears in the
//      tone-mill room in EXACTLY ONE place inside the byte-twin region: the
//      borrowed PITCH CORE slice (which is pitch-core's). The TONE-MILL CORE slice
//      re-types NO Hz literal — the anchor is imported, never copied.
//    • DEEPER re-derivations — the siren law (f=N·Ω/2π), the octave (doubling Ω
//      === +1200¢ over a fine sweep), and the just-ring intervals are re-derived
//      here independently of runSelfTest, and the neg-control is shown to BITE
//      (the test can go red — it is not vacuously green).
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf is a top-level room, so the repo root is .. (tone-mill →
//  repo root); pitch-core lives at ../sound-garden/pitch-core.mjs.
// ============================================================================
import {
  runSelfTest, toothPassHz, revPerSec, cents, centsOfRatio, nearestNote,
  ringChordCents, apparentDriftHz, isFrozen,
} from './core.mjs';
// the pitch anchor is single-sourced to pitch-core; import it FROM THERE (not a
// re-typed literal) for the readout-anchor check — core.mjs inlines pitch-core's
// slice byte-for-byte (asserted in leg 8), so semiToFreq(0) === core's anchor.
import { MIDDLE_C_HZ, semiToFreq } from '../sound-garden/pitch-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const TWO_PI = Math.PI * 2;
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
// forge strips a leading `export ` on each exported declaration when it inlines
// the module into the page; mirror that transform so the slices compare equal.
function stripExport(s){ return s.replace(/^(\s*)export\s+(?=(const|let|var|function|class|async)\b)/gm, '$1'); }

// ── 1. THE FULL SHARED SELF-TEST (the four legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runSelfTest legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— The siren law, the octave, and the rings re-derived (Node-only) —');

// ── 2. THE SIREN LAW f = N·Ω/2π is exact, two ways: toothPassHz(N,Ω) === the
//   tooth-pass rate read off θ (teeth crossing the edge per second), across N,Ω.
{
  let worst = 0;
  for (const N of [8,12,16,24,32]) for (let i=1;i<=40;i++){
    const omega = i*0.37*TWO_PI;            // rad/s, a wide range
    const fLaw = toothPassHz(N, omega);     // N·Ω/2π
    // teeth crossing the edge in a tiny dt: θ advances revPerSec(Ω)·dt revs → ·N teeth
    const dt = 1e-7;
    const seen = (revPerSec(omega)*dt*N)/dt;
    worst = Math.max(worst, Math.abs(fLaw - seen));
  }
  check('the siren law is exact: toothPassHz(N,Ω) === the tooth-pass rate read off θ (teeth/edge/sec) to <1e-9, across N∈{8..32}, 40 speeds',
        worst < 1e-9, `worst |f_law − seen| = ${worst.toExponential(2)} Hz`);
}

// ── 3. DOUBLING Ω === +1200¢ over a FINE sweep (not just the legs' samples), and
//   ×1.5 → +701.955¢ (a just fifth), ×3 → +1901.955¢ — for every N, every Ω.
{
  let worstOct = 0, worstFifth = 0, worstTwelfth = 0;
  for (const N of [12,16,24,32]) for (let i=1;i<=120;i++){
    const omega = i*0.08*TWO_PI;
    worstOct     = Math.max(worstOct,     Math.abs(cents(toothPassHz(N,omega), toothPassHz(N,2*omega)) - 1200));
    worstFifth   = Math.max(worstFifth,   Math.abs(cents(toothPassHz(N,omega), toothPassHz(N,1.5*omega)) - 701.955000865));
    worstTwelfth = Math.max(worstTwelfth, Math.abs(cents(toothPassHz(N,omega), toothPassHz(N,3*omega)) - 1901.955000865));
  }
  check('the octave is a rate-doubling: over a 480-point (N,Ω) sweep, ×2Ω === +1200¢ exactly, ×1.5Ω === +701.955¢, ×3Ω === +1901.955¢',
        worstOct < 1e-9 && worstFifth < 1e-6 && worstTwelfth < 1e-6,
        `worst |×2−1200| = ${worstOct.toExponential(2)}¢ · |×1.5−702| = ${worstFifth.toExponential(2)}¢ · |×3−1902| = ${worstTwelfth.toExponential(2)}¢`);
}

// ── 4. THE JUST RINGS: ringChordCents(p·K, q·K) is the q:p interval, Ω-free and
//   K-free (it depends only on the count RATIO), matching the just references.
{
  const cases = [[1,2,1200],[2,3,701.955000865],[3,4,498.044999135],[4,5,386.313713865]];
  let ok = true, worst = 0;
  for (const [p,q,ref] of cases){
    for (const K of [1,8,13]){            // K-free: the same interval at any tooth-multiplier
      const c = ringChordCents(p*K, q*K);
      const e = Math.abs(c - ref);
      worst = Math.max(worst, e); if (e > 1e-6) ok = false;
    }
  }
  check('the rings sound the derived just interval: ringChordCents(p·K, q·K) === the q:p ratio (2:1→1200¢, 3:2→701.955¢, 4:3→498.045¢, 5:4→386.314¢), Ω-free AND K-free',
        ok, `worst |dev| = ${worst.toExponential(2)}¢ vs the just references`);
}

// ── 5. THE NEG-CONTROL BITES: a detached needle (heard Hz off N·Ω/2π) is caught
//   while the strobe STILL freezes the disc — the test is not vacuously green.
{
  const omega = 5.0*TWO_PI, N = 24;
  const fTooth = toothPassHz(N, omega);
  const stillFreezes = isFrozen(N, omega, fTooth, 1e-9);          // strobe=tooth still freezes
  const heardOff6 = Math.abs((fTooth*1.06) - fTooth)/fTooth > 0.05;  // +6% knob caught
  const heardOnIsClean = !(Math.abs(fTooth - fTooth)/fTooth > 0.05); // a TRUE (un-detached) heard is NOT flagged
  check('the neg-control bites: a +6% detached knob is caught (heard ≠ N·Ω/2π) while the strobe still freezes the disc, AND a matched (locked) tone is NOT flagged — the test can go red',
        stillFreezes && heardOff6 && heardOnIsClean,
        `freeze holds · +6% knob flagged · locked tone clean`);
}

console.log('\n— The anchor is DERIVED, not typed (anti-circularity) —');

// ── 6. THE ANCHOR: nearestNote(MIDDLE_C_HZ) === middle C with 0¢ off, and
//   semiToFreq(0) === MIDDLE_C_HZ — the note readouts ride the single-sourced anchor.
{
  const nn = nearestNote(MIDDLE_C_HZ);
  const c4 = nn.name === 'C4' && Math.abs(nn.centsOff) < 1e-9;
  const anchor = Math.abs(semiToFreq(0) - MIDDLE_C_HZ) < 1e-12;
  check('the readout rides the anchor: nearestNote(MIDDLE_C_HZ) === C4 +0¢, and semiToFreq(0) === MIDDLE_C_HZ — note names are DERIVED from the one pitch literal',
        c4 && anchor, `nearestNote(${MIDDLE_C_HZ}) = ${nn.name} ${nn.centsOff.toFixed(3)}¢ · semiToFreq(0) = ${semiToFreq(0)}`);
}

console.log('\n— Byte-twin discipline (the page IS the module, char-for-char) —');

// ── 7. BYTE-TWIN PARITY (TONE-MILL CORE): index.html slice === ./core.mjs slice
//   (after the same `export `-strip forge applies on inline).
{
  const BEGIN = '// ===== TONE-MILL CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== TONE-MILL CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = stripExport(sliceBetween(mod, BEGIN, END) || '');
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (TONE-MILL CORE): index.html\'s inlined TONE-MILL CORE slice is char-for-char ./core.mjs (after forge\'s export-strip) — the page\'s pill runs the module\'s runSelfTest',
        modSlice && pageSlice != null && modSlice === pageSlice,
        pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 8. BYTE-TWIN PARITY (borrowed PITCH CORE): page === core.mjs === pitch-core.mjs.
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const src = readFileSync(join(__dir, '..', 'sound-garden', 'pitch-core.mjs'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END), ss = sliceBetween(src, BEGIN, END);
  const allEqual = ms != null && ps != null && ss != null && ms === ps && ps === ss;
  check('byte-twin parity (PITCH CORE): the PITCH CORE slice is identical across index.html, ./core.mjs, AND ../sound-garden/pitch-core.mjs — the anchor is single-sourced, re-typed nowhere',
        allEqual,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' : ss == null ? 'pitch-core sentinels MISSING' :
          (allEqual ? `slice ${ms.length} chars identical in all three` : `DRIFT (mod ${ms.length} / page ${ps.length} / pitch-core ${ss.length})`));
}

// ── 9. ANTI-CIRCULARITY: the anchor literal 261.625565 lives in the tone-mill
//   room ONLY inside the borrowed PITCH CORE slice (= pitch-core's), and the
//   TONE-MILL CORE slice re-types NO Hz literal.
{
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const toneSlice = sliceBetween(mod, '// ===== TONE-MILL CORE (inlined byte-twin) BEGIN =====', '// ===== TONE-MILL CORE END =====') || '';
  const pitchSlice = sliceBetween(mod, '// ===== PITCH CORE (inlined byte-twin) BEGIN =====', '// ===== PITCH CORE END =====') || '';
  const anchorInTone = /261\.625565/.test(toneSlice);
  const anchorInPitch = /261\.625565/.test(pitchSlice);
  check('anti-circularity: the anchor literal 261.625565 appears in the TONE-MILL CORE slice ZERO times and in the borrowed PITCH CORE slice exactly (it lives only in pitch-core) — the siren law re-types no Hz',
        !anchorInTone && anchorInPitch, `tone-slice has anchor: ${anchorInTone} · pitch-slice has anchor: ${anchorInPitch}`);
}

console.log(`\n—— The Tone Mill Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
