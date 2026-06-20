#!/usr/bin/env bash
# ============================================================================
#  The Tartini Bench — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: diffToneFreq is |f₂−f₁|
#  to the bit, the difference bin of the horn output is ε/2 to <1e-9, the whole x²
#  expansion matches, and the LINEAR path is a true zero. This script proves the
#  SOUND matches: it renders the SAME WaveShaper horn chain (offline, Web Audio)
#  to two WAVs, then has the audio-lens skill (which CANNOT hear) read them back as
#  spectral peaks + a clip check + spectrograms.
#
#  THE STATED SEAM (held everywhere — page, this script, the worklog/CHANGELOG):
#  the LIVE instrument's hero default is f₁=220, f₂=275, ε=0.12 → a difference tone
#  at 55 Hz. 55 Hz is MATH-confirmed exact but is BELOW the audio-lens's 60 Hz
#  peak-pick floor, so it is NEVER lens-confirmed. The heard-headless claim is made
#  ONLY here, on the SAME horn AN OCTAVE UP: f₁=2600, f₂=2750 → a difference tone
#  at 150 Hz (above the 60 Hz floor) while the 5350 Hz sum sits ABOVE the lens's
#  5 kHz ceiling (so it is ignored and the 150 Hz difference tone clears the top-3).
#
#  The asserts (in Node):
#    1. HORN — a spectral peak within ONE FFT bin of 150 Hz is present.
#    2. LINEAR — NO peak within one FFT bin of 150 Hz (the bend bred it; remove the
#       bend and it is gone — the audible twin of diffBinMagLinear() === 0).
#    3. --clips false on both (the compressor + headroom tame it).
#  A precondition-assert (diff > 60 && sum > 5000) makes a future retune fail LOUDLY
#  rather than silently sliding the difference tone under the lens floor.
#
#  Renders are produced in a browser (the offline render is Web Audio). To make the
#  WAVs: serve the repo, open the leaf, and in the console run:
#     window.__renderTartini(2, {nonlinear:true }).then(b => /* save tartini-horn.wav   */)
#     window.__renderTartini(2, {nonlinear:false}).then(b => /* save tartini-linear.wav */)
#  Then point this script at the two WAVs.
#
#  Usage:  bash verify.sh <tartini-horn.wav> <tartini-linear.wav>
# ============================================================================
set -euo pipefail

HORN="${1:?path to the horn WAV is required}"
LIN="${2:?path to the linear WAV is required}"
LENS="${AUDIO_LENS:-$HOME/.claude/skills/audio-lens/bin/audio-lens.js}"
F1=2600
F2=2750
DIFF=150
SR=12000
FFT=4096

# emit the top-3 peak freqs (sorted ascending) as space-separated Hz
peaks() { node "$LENS" analyze "$1" --peaks --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).peaks.map(x=>x.freq).sort((a,b)=>a-b);console.log(p.join(" "));})'; }
clips() { node "$LENS" analyze "$1" --clips --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

HORN_P=$(peaks "$HORN"); LIN_P=$(peaks "$LIN")
HORN_CL=$(clips "$HORN"); LIN_CL=$(clips "$LIN")

echo "horn   peaks: $HORN_P   clips $HORN_CL"
echo "linear peaks: $LIN_P   clips $LIN_CL"

node "$LENS" analyze "$HORN" --fft "$FFT" --spectrogram "$(dirname "$HORN")/spec-horn.png"   --json >/dev/null
node "$LENS" analyze "$LIN"  --fft "$FFT" --spectrogram "$(dirname "$LIN")/spec-linear.png" --json >/dev/null
echo "spectrograms → spec-horn.png (a peak at 150 Hz) · spec-linear.png (no 150 Hz peak)"

# the assertions, in Node (the one-FFT-bin tolerance + the precondition guard).
node - "$F1" "$F2" "$DIFF" "$SR" "$FFT" "$HORN_P" "$LIN_P" "$HORN_CL" "$LIN_CL" <<'NODE'
const [,, f1s, f2s, diffs, srs, ffts, hornS, linS, hcl, lcl] = process.argv;
const f1 = +f1s, f2 = +f2s, diff = +diffs, SR = +srs, FFT = +ffts;
const BIN = SR / FFT;                         // one FFT bin in Hz
const parse = s => s.trim().split(/\s+/).map(Number).filter(x=>x>0).sort((a,b)=>a-b);
const horn = parse(hornS), lin = parse(linS);
const near = (arr, f) => arr.some(p => Math.abs(p - f) <= BIN);

let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// precondition: the retune still clears the lens floor (diff > 60) and the sum is
// ignored (sum > 5000) — so the difference tone is the meaningful new peak.
const sum = f1 + f2;
log(diff > 60 && sum > 5000,
    `0. precondition: difference ${diff} Hz > 60 (above the lens floor) and sum ${sum} Hz > 5000 (above the ceiling, ignored) — bin = ${BIN.toFixed(2)} Hz`);

log(near(horn, diff),
    `1. HORN render HAS a peak within one FFT bin (±${BIN.toFixed(2)} Hz) of the difference tone ${diff} Hz — the bend bred a real spectral component`);

log(!near(lin, diff),
    `2. LINEAR render has NO peak within one FFT bin of ${diff} Hz — remove the bend and the third tone is gone (the audible twin of diffBinMagLinear() === 0)`);

log(hcl==='false' && lcl==='false',
    `3. no clipping on either render (horn ${hcl} / linear ${lcl})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — the bent horn breeds a real peak at the difference tone f₂−f₁; flip the horn linear and the peak is gone. The sound matches the math. (lens-checked at 2600/2750 — the same horn, an octave up where the difference tone clears the 60 Hz peak-pick floor.)');
NODE
