#!/usr/bin/env bash
# ============================================================================
#  The Plucked Reed — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: the settled period is
#  N+(1−b) (≈ sr/N), the fundamental decays at the feedback gain g, the highs die
#  first, g=0 leaves only hiss, and the loop filter can only remove highs. THIS
#  script proves the SOUND matches: it has the page render the SAME Karplus-Strong
#  recurrence offline to three WAVs, then the audio-lens skill (which CANNOT hear)
#  reads them back as detected pitch + spectral centroid + a clip check + spectrograms.
#
#  The three renders (all at N = round(sr/f) for the home pitch G3, sr=44100):
#    • LIVE   — g=0.999, b=0.5  : a ringing string.
#    • BRIGHT — g=0.999, b=0.95 : a string with the highs kept (brighter).
#    • DEAD   — g=0.0,   b=0.5  : the neg-control — the loop never feeds back,
#                                 only the one-shot hiss sounds.
#
#  The asserts:
#    1. PITCH (leg 1) — LIVE's detected fundamental is within a few cents of
#       sr/N (= 44100/225 ≈ 196 Hz, G3). The delay length set the pitch.
#    2. CENTROID / highs-die-first (leg 3) — LIVE's first-half centroid exceeds
#       its second-half centroid (the highs die first), and BRIGHT's centroid is
#       higher than LIVE's (a brighter loop filter keeps the highs).
#    3. NEG-CONTROL (leg 4) — DEAD has NO detected pitch (f0 == null) and a much
#       lower tail RMS than LIVE: with g=0 there is no string, only hiss.
#    4. --clips false on all three (the master trim + per-pluck normalise tame it).
#
#  Renders are produced in a browser (the offline render is plain JS). To make the
#  WAVs: serve the repo, open the leaf, and in the console run (N = window.__delayLength(window.__F_HOME)):
#     window.__renderReed(N, {g:0.999,b:0.5 }).then(b => /* save as reed-live.wav   */)
#     window.__renderReed(N, {g:0.999,b:0.95}).then(b => /* save as reed-bright.wav */)
#     window.__renderReed(N, {g:0.0,  b:0.5 }).then(b => /* save as reed-dead.wav   */)
#  Then point this script at the three WAVs.
#
#  Usage:  bash verify.sh <reed-live.wav> <reed-bright.wav> <reed-dead.wav>
# ============================================================================
set -euo pipefail

LIVE="${1:?path to the live WAV is required}"
BRIGHT="${2:?path to the bright WAV is required}"
DEAD="${3:?path to the dead (neg-control) WAV is required}"
LENS="${AUDIO_LENS:-$HOME/.claude/skills/audio-lens/bin/audio-lens.js}"
SR=44100; N=225; F0=196      # G3 home pitch, sr/N = 44100/225 ≈ 196 Hz

field() { node "$LENS" analyze "$1" --pitch --centroid --rms --clips --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);process.stdout.write(String(o["'"$2"'"]));})'; }

LIVE_F0=$(field "$LIVE" f0);     LIVE_C=$(field "$LIVE" firstHalf); LIVE_C2=$(field "$LIVE" secondHalf)
LIVE_CL=$(field "$LIVE" clips);  BRIGHT_C=$(field "$BRIGHT" centroid); BRIGHT_CL=$(field "$BRIGHT" clips)
DEAD_F0=$(field "$DEAD" f0);     DEAD_RMS=$(field "$DEAD" meanRms);  LIVE_RMS=$(field "$LIVE" meanRms); DEAD_CL=$(field "$DEAD" clips)

echo "live   : f0 $LIVE_F0 Hz   centroid(early) $LIVE_C > (late) $LIVE_C2   rms $LIVE_RMS dB   clips $LIVE_CL"
echo "bright : centroid $BRIGHT_C   clips $BRIGHT_CL"
echo "dead   : f0 $DEAD_F0   rms $DEAD_RMS dB   clips $DEAD_CL"

node "$LENS" analyze "$LIVE" --spectrogram "$(dirname "$LIVE")/spec-live.png" --json >/dev/null
node "$LENS" analyze "$DEAD" --spectrogram "$(dirname "$DEAD")/spec-dead.png" --json >/dev/null
echo "spectrograms → spec-live.png (bright attack, the high rails fade from the tail) · spec-dead.png (a single hiss burst, no rails)"

node - "$SR" "$N" "$F0" "$LIVE_F0" "$LIVE_C" "$LIVE_C2" "$BRIGHT_C" "$DEAD_F0" "$DEAD_RMS" "$LIVE_RMS" "$LIVE_CL" "$BRIGHT_CL" "$DEAD_CL" <<'NODE'
const [,, srS, nS, f0S, liveF0, liveC, liveC2, brightC, deadF0, deadRms, liveRms, lcl, bcl, dcl] = process.argv;
const sr=+srS, N=+nS, target=sr/N;
let fail=0; const log=(ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// 1. PITCH — live f0 within a few cents of sr/N
const lf=parseFloat(liveF0);
const cents = isFinite(lf) && lf>0 ? Math.abs(1200*Math.log2(lf/target)) : Infinity;
log(isFinite(lf) && cents < 25,
  `1. PITCH: live fundamental ${lf} Hz ≈ sr/N ${target.toFixed(1)} Hz (${cents.toFixed(1)}¢) — the delay length set the pitch`);

// 2. CENTROID — highs die first (early>late) AND bright keeps highs (bright>live)
const e=parseFloat(liveC), l=parseFloat(liveC2), bc=parseFloat(brightC);
log(e>l && bc>e,
  `2. BRIGHTNESS: live early centroid ${e.toFixed(0)} > late ${l.toFixed(0)} (highs die first) and bright ${bc.toFixed(0)} > live early ${e.toFixed(0)} (a brighter loop keeps the highs)`);

// 3. NEG-CONTROL — dead has no pitch and a far lower RMS than live
const noPitch = deadF0 === 'null' || deadF0 === '' || deadF0 === 'NaN' || !isFinite(parseFloat(deadF0));
const dr=parseFloat(deadRms), lr=parseFloat(liveRms);
log(noPitch && (dr < lr - 8),
  `3. NEG-CONTROL: dead (g=0) has NO detected pitch (f0=${deadF0}) and rms ${dr.toFixed(1)} dB ≪ live ${lr.toFixed(1)} dB — no echo loop, no string, only hiss`);

// 4. no clipping
log(lcl==='false' && bcl==='false' && dcl==='false',
  `4. no clipping on any of the three (${lcl}/${bcl}/${dcl})`);

if (fail){ console.log('FAIL'); process.exit(1); }
console.log('PASS — the live reed rings at sr/N with the highs dying first, a brighter loop keeps more highs, and with g=0 the same pluck makes no string at all (only hiss). The sound matches the math.');
NODE
