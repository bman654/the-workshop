// ============================================================================
//  THE BUTTERFLY'S VOICE — Node twin of the in-page self-test.
//  Run:  node butterfly-voice/voice-core.test.mjs
//
//  Re-proves the same six legs the in-page pill proves (via the shared
//  runSelfTest), then asserts the SINGLE-SOURCE discipline holds:
//    • value identity  — MIDDLE_C_HZ === semiToFreq(0)  (the anchor IS the note).
//    • anti-circularity grep — the pitch law's digit-literals never appear in
//      voice-core.mjs (they live ONLY in pitch-core.mjs; the butterfly core is
//      separately verified clean by its own bench).
//    • THREE byte-twin parity checks — the page inlines char-for-char copies of
//      (1) the pitch core, (2) the butterfly core, (3) the voice core. This makes
//      "the page's fft IS the imported fft" real, not asserted.
//  process.exit(pass === total ? 0 : 1).
// ============================================================================
import { N, FS_REF, voiceSpectrum, deviceSpectrum, PLAYABLE, runSelfTest } from './voice-core.mjs';
import { semiToFreq, noteName, MIDDLE_C_HZ } from '../sound-garden/pitch-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end) {
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

// ── 1. THE FULL SHARED SELF-TEST (the six legs, identical to the pill). ───────
console.log('\n— The full in-page self-test (the six legs) —');
{
  const r = runSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. THE PLAYABLE RANGE is exactly s∈[−24,24], c∈[6,89], 49 notes. ──────────
{
  let cMin = Infinity, cMax = -Infinity;
  for (const s of PLAYABLE) { const r = voiceSpectrum(s); cMin = Math.min(cMin, r.c); cMax = Math.max(cMax, r.c); }
  const ok = PLAYABLE.length === 49 && PLAYABLE[0] === -24 && PLAYABLE[PLAYABLE.length - 1] === 24 &&
             cMin === 6 && cMax === 89;
  check('playable range: 49 notes, s∈[−24,+24], c∈[6,89] (computed from 2 ≤ c ≤ N/2−2, not hard-coded)',
        ok, `${PLAYABLE.length} notes · s∈[${PLAYABLE[0]},${PLAYABLE[PLAYABLE.length - 1]}] · c∈[${cMin},${cMax}] · N=${N}`);
}

// ── 3. EXACT bin + EXACT pitch, re-measured here over all 49 notes. ──────────
{
  let worstK = 0, worstRec = 0, mis = 0;
  for (const s of PLAYABLE) {
    const r = voiceSpectrum(s);
    worstK = Math.max(worstK, Math.abs(r.kMeas - r.c));
    worstRec = Math.max(worstRec, Math.abs(r.fRecovered - semiToFreq(s)));
    if (r.kMeas !== r.c) mis++;
  }
  check('exact bin: 0 mislocations across all 49 notes, worst |k−c| = 0 (machine-exact)',
        mis === 0 && worstK === 0, `mislocations=${mis} · worst |k−c|=${worstK}`);
  check('exact pitch: worst |k·Δf − semiToFreq(s)| = 0.00 Hz across all 49 notes',
        worstRec < 1e-9, `worst |k·Δf − f| = ${worstRec.toExponential(2)} Hz`);
}

// ── 4. FIXED-fs=N would NOT be exact — proves Approach B is load-bearing. ─────
// Synthesise at fs=N (the obvious choice the design rejected) and show the cents
// error: the cycles don't close, so k·Δf misses the note by a real tuning amount.
{
  let worstCents = 0, worstS = null;
  for (const s of PLAYABLE) {
    const f = semiToFreq(s);
    const fsN = N;                 // fixed fs = N (the rejected approach)
    const cFrac = f * N / fsN;     // == f (since N/N=1) — generally non-integer
    const df = fsN / N;            // == 1
    const kNearest = Math.round(cFrac);
    const fRec = kNearest * df;
    const cents = Math.abs(1200 * Math.log2(fRec / f));
    if (cents > worstCents) { worstCents = cents; worstS = s; }
  }
  check('fixed-fs=N is NOT exact: it leaves a real tuning residual (worst > 1 cent) — why Approach B derives fs',
        worstCents > 1, `worst ${worstCents.toFixed(1)} cents @ s=${worstS} (Approach B drives this to 0)`);
}

// ── 5. DEVICE-RATE teeth across the playable range. The HONEST per-note invariant
// is "the peak is the NEAREST bin (within ±Δf/2)" — that holds for ALL 49 notes.
// Leakage VARIES with how far c sits from an integer: a note whose f lands near a
// device bin barely leaks, a note half-way between bins leaks ~0.49. So we assert
// (a) nearest-bin universally, and (b) the WORST-CASE leakage is large (the line
// genuinely smears) — never claim every note leaks the same, which would be false.
{
  let allNearest = true, worstOff = 0, maxLeak = 0, minLeak = Infinity, worstFrac = 0;
  for (const s of PLAYABLE) {
    const r = deviceSpectrum(s, { fs: 48000 });
    maxLeak = Math.max(maxLeak, r.leakage); minLeak = Math.min(minLeak, r.leakage);
    const off = Math.abs(r.fRecovered - r.f), half = r.df / 2;
    if (off > half + 1e-9) allNearest = false;
    worstOff = Math.max(worstOff, off / half);
    // how far c sits from an integer (0 = on a bin, 0.5 = exactly between)
    worstFrac = Math.max(worstFrac, Math.abs(r.cFractional - Math.round(r.cFractional)));
  }
  check('device-rate teeth: at fs=48000 the peak is the NEAREST bin (within ±Δf/2) for ALL 49 notes, and the worst-case line leaks hard (max 2nd/peak > 0.4) — leakage scales with how far c sits off an integer',
        allNearest && maxLeak > 0.4, `nearest ✓ (worst off ${worstOff.toFixed(2)}·Δf/2) · leakage ∈ [${minLeak.toFixed(3)}, ${maxLeak.toFixed(3)}] · worst |c−round(c)| ${worstFrac.toFixed(3)}`);
}

console.log('\n— Single-source discipline (the proofs the numbers are not re-typed) —');

// ── 6. VALUE IDENTITY: the anchor IS middle C. ───────────────────────────────
{
  check('value identity: MIDDLE_C_HZ === semiToFreq(0) (the pitch anchor IS the s=0 note, one value not a copy)',
        MIDDLE_C_HZ === semiToFreq(0), `MIDDLE_C_HZ = ${MIDDLE_C_HZ} Hz · noteName(0) = ${noteName(0)}`);
}

// ── 7. ANTI-CIRCULARITY GREP: voice-core names NO pitch digit-literal. ───────
{
  const src = readFileSync(join(__dir, 'voice-core.mjs'), 'utf8');
  const forbidden = ['261.625565', '1.05946', '1.0594630'];
  const hit = forbidden.filter(s => src.includes(s));
  check('anti-circularity grep: voice-core.mjs contains NONE of the pitch law\'s digit-literals (261.625565 / 1.05946…) — they live only in pitch-core.mjs',
        hit.length === 0, hit.length === 0 ? 'clean — 0 forbidden literals' : 'FOUND: ' + hit.join(', '));
}

console.log('\n— Byte-twin parity (the three inlined cores === the modules, char-for-char) —');

// ── 8. PITCH-CORE byte-twin: the page's inline pitch block === pitch-core.mjs. ─
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'sound-garden', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('pitch-core byte-twin: index.html pitch block is char-for-char pitch-core.mjs (between sentinels)',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 9. BUTTERFLY-CORE byte-twin: the page's inline butterfly block === core.mjs.
// The page inlines the SAME slice butterfly/index.html inlines (its own sentinel
// family), so "the page's fft IS the imported fft" is real.
{
  const BEGIN = '// ===== BUTTERFLY CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END BUTTERFLY CORE =====';
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const butterflyPage = readFileSync(join(__dir, '..', 'butterfly', 'index.html'), 'utf8');
  const ourSlice = sliceBetween(page, BEGIN, END);
  const theirSlice = sliceBetween(butterflyPage, BEGIN, END);
  check('butterfly-core byte-twin: our inline butterfly block is char-for-char the SAME slice butterfly/index.html inlines (the page\'s fft IS the Butterfly\'s fft)',
        ourSlice != null && theirSlice != null && ourSlice === theirSlice,
        ourSlice == null ? 'our sentinels MISSING' : theirSlice == null ? 'butterfly sentinels MISSING' :
          (ourSlice === theirSlice ? `slice ${ourSlice.length} chars identical` : `DRIFT (ours ${ourSlice.length} vs butterfly ${theirSlice.length})`));
}

// ── 10. VOICE-CORE byte-twin: the page's inline voice block === voice-core.mjs. ─
{
  const BEGIN = '// ===== VOICE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== VOICE CORE END =====';
  const mod = readFileSync(join(__dir, 'voice-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('voice-core byte-twin: index.html voice block is char-for-char voice-core.mjs (between sentinels)',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

console.log(`\n—— The Butterfly's Voice Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
