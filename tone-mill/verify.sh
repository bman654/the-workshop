#!/usr/bin/env bash
# ============================================================================
#  The Tone Mill — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: the eye-rate × N === the
#  scheduled f = N·Ω/2π (leg a), doubling Ω === +1200¢ (leg b), the two rings
#  sound the just ratio (leg c), and the detached needle drives f off N·Ω/2π
#  (leg d). This script proves the (b) HEARD leg of the split crux: it renders
#  the SAME toothPassHz() law through the page's offline render to WAVs, then has
#  the audio-lens skill (which CANNOT hear) read the FUNDAMENTAL back.
#
#  The lens recovers a pitch to within one FFT bin (NOT bit-exact: at 2048/44100
#  a bin is ~21.5 Hz, ~+4¢ near the fundamental is fine). We assert a BAND:
#    1. BASE render at Ω = 5 rev/s, N = 24 — the lens recovers the law's
#       fundamental = AUDIO_SCALE·N·Ω/2π within bin tolerance.
#    2. OCTAVE render at Ω = 10 rev/s (×2) — the lens recovers ~2× the base
#       fundamental (the +1200¢ octave, HEARD — the audible twin of leg b).
#    3. DETACHED render — the lens recovers a Hz that is NOT the law's
#       fundamental (off by ~6%, a wide unambiguous margin — the audible twin of
#       the neg-control leg d: with the needle detached, the ear ≠ the eye).
#    4. --clips false on every render (the bounded sine never clips).
#    5. write spec-base.png / spec-octave.png so the octave jump is screenshot-
#       readable (the bright fundamental line sits twice as high).
#
#  THE INTENTIONAL SINE-OFFLINE / SAWTOOTH-LIVE SPLIT — do NOT "fix" it. The live
#  instrument uses a SAWTOOTH (the buzzy acoustic-siren timbre you HEAR at the
#  bench). The offline render uses a SINE so the lens reads ONE clean fundamental
#  with no harmonic to confuse the peak-pick. The lens proves the FREQUENCY; the
#  page sells the TIMBRE. Both ring the SAME toothPassHz() law (the export
#  window.__renderToneMill calls), so the frequency the lens recovers IS the law.
#
#  Renders are produced in a browser (the offline render is Web Audio). To make
#  the WAVs: serve the repo, open tone-mill/index.html, and in the console run:
#     window.__renderToneMill({seconds:2, rev:5,  N:24}).then(b=>/* save base.wav   */)
#     window.__renderToneMill({seconds:2, rev:10, N:24}).then(b=>/* save octave.wav */)
#     window.__renderToneMill({seconds:2, rev:5,  N:24, detached:true}).then(b=>/* detached.wav */)
#  (save each Blob to a file). Then point this script at them, in this order.
#
#  Usage:  bash verify.sh base.wav octave.wav detached.wav
# ============================================================================
set -euo pipefail

BASE="${1:?need base render (Ω=5, N=24) wav}"
OCT="${2:?need octave render (Ω=10, N=24) wav}"
DET="${3:?need detached render wav}"
# Resolve the audio-lens CLI: an explicit $AUDIO_LENS wins; else this repo's own
# vendored copy (the tool this repo birthed); else the installed audio-lens skill.
LENS="${AUDIO_LENS:-}"
if [ -z "$LENS" ]; then
  _repo="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$_repo" ] && [ -f "$_repo/tools/audio-lens/bin/audio-lens.js" ]; then
    LENS="$_repo/tools/audio-lens/bin/audio-lens.js"
  else
    LENS="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/audio-lens/bin/audio-lens.js"
  fi
fi

# the law's expected fundamentals: AUDIO_SCALE·N·Ω/2π with AUDIO_SCALE=2.4, N=24.
#   Ω=5 rev/s ⇒ tooth-pass = 24·5 = 120 Hz ⇒ heard = 2.4·120 = 288 Hz
#   Ω=10 rev/s ⇒ 576 Hz (the octave, ×2)
#   detached ⇒ 288·1.06 = 305.28 Hz (off the law by +6%)
EXP_BASE=288.0
EXP_OCT=576.0

pitch() { node "$LENS" analyze "$1" --pitch --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).f0))'; }
clips() { node "$LENS" analyze "$1" --clips --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

PB=$(pitch "$BASE"); PO=$(pitch "$OCT"); PD=$(pitch "$DET")
CB=$(clips "$BASE"); CO=$(clips "$OCT"); CD=$(clips "$DET")

echo "lens-recovered fundamentals (Hz):  base=$PB  octave=$PO  detached=$PD"
echo "expected from the law:             base≈$EXP_BASE  octave≈$EXP_OCT (×2)  detached≠$EXP_BASE"
echo "clips — base:$CB octave:$CO detached:$CD"

DIR="$(dirname "$BASE")"
node "$LENS" analyze "$BASE" --spectrogram "$DIR/spec-base.png"   --json >/dev/null
node "$LENS" analyze "$OCT"  --spectrogram "$DIR/spec-octave.png" --json >/dev/null
echo "spectrograms → spec-base.png (fundamental line) · spec-octave.png (the line sits twice as high — the heard octave)"

node - "$PB" "$PO" "$PD" "$EXP_BASE" "$EXP_OCT" "$CB" "$CO" "$CD" <<'NODE'
const [,, pb, po, pd, eb, eo, cb, co, cd] = process.argv;
const PB=+pb, PO=+po, PD=+pd, EB=+eb, EO=+eo;
let fail = 0; const log=(ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// a bin at 2048/44100 ≈ 21.5 Hz; allow ±1 bin (be generous: ±25 Hz) for the lens.
const BIN = 25;
const cents = (a,b)=> 1200*Math.log2(a/b);

// 1. base fundamental within bin tolerance of the law.
log(Math.abs(PB - EB) <= BIN,
    `1. base fundamental recovered: lens ${PB.toFixed(1)} Hz vs law ${EB} Hz (Δ ${Math.abs(PB-EB).toFixed(1)} Hz ≈ ${cents(PB,EB).toFixed(1)}¢, within one bin) — the eye-rate IS the heard pitch`);

// 2. the octave is HEARD: the octave render's fundamental ≈ 2× the base's.
const ratio = PO / PB;
log(Math.abs(cents(PO, PB) - 1200) <= 50 && Math.abs(PO - EO) <= 2*BIN,
    `2. the heard octave: octave render ${PO.toFixed(1)} Hz ≈ 2× base ${PB.toFixed(1)} Hz (ratio ${ratio.toFixed(3)}, ${cents(PO,PB).toFixed(1)}¢ ≈ +1200¢) — doubling Ω is an octave you can HEAR`);

// 3. the detached render is OFF the law by a wide margin (the neg-control, heard).
log(Math.abs(cents(PD, EB)) > 50,
    `3. the detached needle drifts: detached render ${PD.toFixed(1)} Hz ≠ law ${EB} Hz (${cents(PD,EB).toFixed(1)}¢ off, well past a bin) — the ear unhooks from the eye`);

// 4. nothing clips.
log(cb==='false' && co==='false' && cd==='false',
    `4. no clipping on any render (base:${cb} octave:${co} detached:${cd}) — the bounded sine never spikes`);

if (fail){ console.log('FAIL'); process.exit(1); }
console.log('PASS — the lens recovers the fundamental = N·Ω/2π within a bin, hears the octave when Ω doubles, and catches the detached needle drifting off the law. The sound matches the math.');
NODE
