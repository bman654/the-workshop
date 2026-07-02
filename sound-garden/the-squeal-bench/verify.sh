#!/usr/bin/env bash
# ============================================================================
#  The Squeal Bench — the AUDIBLE ear-check (audio-lens).
#
#  This is a DELIGHT-FIRST leaf; the Node twin (core.test.mjs) proves the model is
#  well-formed and single-sourced. This script proves the SOUND matches the three
#  emergent voices + the released silence — the loop cannot hear, so the audio-lens
#  (which also cannot hear, but reads sound as numbers + a spectrogram) stands in for
#  ears. It runs the SAME per-sample stick-slip recurrence, OFFLINE, to four WAVs, and
#  confronts each with the lens:
#
#    SING     — light Fn, fast vB: a PITCHED sawtooth. The lens finds a clear f0 in
#               the audio pitch band and a harmonic peak ladder (f0, 2·f0, …).
#    CREAK    — hard Fn, slow vB: a DULL groan. NO clear f0 (its slips are sub-audible
#               events, not a fused tone); its spectral centroid is far BELOW the sing's.
#    QUAKE    — stiff k, tiny vB: a SPARSE transient TRAIN. NO clear f0; the lens reads
#               discrete ONSETS (countable thuds), unlike the continuous sing.
#    RELEASED — vB=0: DIGITAL SILENCE (RMS floor), no f0, no onsets.
#    …and NONE of the four clip.
#
#  The asserts (in Node):
#    1. SING has an f0 in [60, 400] Hz (a real, fused pitch) — the sing is pitched.
#    2. CREAK and QUAKE have NO f0 in that band (their slips don't fuse into a tone).
#    3. centroid(SING) > centroid(CREAK) — bright sawtooth vs dull groan.
#    4. QUAKE registers MORE discrete onsets than SING (a transient train vs a
#       continuous buzz) — and SING's onsets are ~0 (it is continuous).
#    5. RELEASED is silent (meanRms far below the others; no f0).
#    6. --clips false on all four.
#
#  Renders are produced in a browser (window.__renderSqueal + window.__SR). To make
#  the WAVs: serve the repo, open the leaf, and in the console run e.g.
#     window.__renderSqueal('sing',    2).then(b => /* save sq-sing.wav     */)
#     window.__renderSqueal('creak',   2).then(b => /* save sq-creak.wav    */)
#     window.__renderSqueal('quake',   2).then(b => /* save sq-quake.wav    */)
#     window.__renderSqueal('released',2).then(b => /* save sq-released.wav */)
#  Then point this script at the four WAVs. (A headless render+download harness is
#  the builder's job; the loop cannot hear.)
#
#  Usage:  bash verify.sh <sing.wav> <creak.wav> <quake.wav> <released.wav>
# ============================================================================
set -euo pipefail

SING="${1:?path to the sing WAV is required}"
CREAK="${2:?path to the creak WAV is required}"
QUAKE="${3:?path to the quake WAV is required}"
REL="${4:?path to the released WAV is required}"
LENS="${AUDIO_LENS:-$HOME/.claude/skills/audio-lens/bin/audio-lens.js}"
FFT=4096

# emit a compact JSON summary {f0,centroid,clipping,meanRms,onsets} for a WAV. The
# full analyze already carries `clipping` (a boolean) — the standalone `--clips` flag
# is a MODE that emits ONLY the clip summary, so we do NOT pass it here.
summ() { node "$LENS" analyze "$1" --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(JSON.stringify({f0:j.f0,centroid:j.centroid,clipping:j.clipping,meanRms:j.meanRms,onsets:j.onsets}));})'; }

SING_J=$(summ "$SING"); CREAK_J=$(summ "$CREAK"); QUAKE_J=$(summ "$QUAKE"); REL_J=$(summ "$REL")

echo "sing     : $SING_J"
echo "creak    : $CREAK_J"
echo "quake    : $QUAKE_J"
echo "released : $REL_J"

# spectrograms for the eye (a harmonic ladder for sing, discrete columns for quake)
node "$LENS" analyze "$SING"  --fft "$FFT" --spectrogram "$(dirname "$SING")/spec-sing.png"      --json >/dev/null
node "$LENS" analyze "$CREAK" --fft "$FFT" --spectrogram "$(dirname "$CREAK")/spec-creak.png"    --json >/dev/null
node "$LENS" analyze "$QUAKE" --fft "$FFT" --spectrogram "$(dirname "$QUAKE")/spec-quake.png"    --json >/dev/null
node "$LENS" analyze "$REL"   --fft "$FFT" --spectrogram "$(dirname "$REL")/spec-released.png"   --json >/dev/null
echo "spectrograms → spec-sing.png (harmonic ladder) · spec-creak.png · spec-quake.png (discrete columns) · spec-released.png (empty)"

# the assertions, in Node.
node - "$SING_J" "$CREAK_J" "$QUAKE_J" "$REL_J" <<'NODE'
const [,, sS, cS, qS, rS] = process.argv;
const sing = JSON.parse(sS), creak = JSON.parse(cS), quake = JSON.parse(qS), rel = JSON.parse(rS);
const inBand = f => f != null && f >= 60 && f <= 400;
let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

log(inBand(sing.f0),
    `1. SING has a fused pitch: f0 = ${sing.f0} Hz in [60,400] — the dense slips fuse into a real tone`);

log(!inBand(creak.f0) && !inBand(quake.f0),
    `2. CREAK and QUAKE have NO fused pitch in [60,400] (creak f0 ${creak.f0}, quake f0 ${quake.f0}) — their slips are sub-audible events, not a tone`);

log(sing.centroid > creak.centroid,
    `3. centroid(SING) ${sing.centroid} > centroid(CREAK) ${creak.centroid} — a bright sawtooth vs a dull groan`);

log(quake.onsets > sing.onsets && sing.onsets <= 1,
    `4. QUAKE is a transient TRAIN: ${quake.onsets} discrete onsets > SING's ${sing.onsets} (SING is a continuous buzz, ~0 onsets)`);

log(rel.meanRms < sing.meanRms - 30 && rel.meanRms < creak.meanRms - 30 && !inBand(rel.f0),
    `5. RELEASED is silent: meanRms ${rel.meanRms} dB ≪ the voices (sing ${sing.meanRms}, creak ${creak.meanRms}) and no f0 — the sound was only ever the drag`);

log(sing.clipping===false && creak.clipping===false && quake.clipping===false && rel.clipping===false,
    `6. no clipping on any render (sing ${sing.clipping} / creak ${creak.clipping} / quake ${quake.clipping} / released ${rel.clipping})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — one stick-slip law, offline-rendered at three (k,Fn,vB) points, gives a pitched sawtooth SING, a dull CREAK, a sparse transient-train QUAKE, and — released — digital silence. The sound matches the model. (lens-checked; the loop cannot hear.)');
NODE
