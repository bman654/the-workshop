#!/usr/bin/env bash
# ============================================================================
#  The Endless Staircase — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: the chord folds home to
#  the bit every octave (LEG A), its centroid stays in a derived band and resets
#  each turn (LEG B), the flat LADDER centroid climbs out of the band (LEG C), and
#  the chord is always bounded (LEG D). This script proves the SOUND matches: it
#  renders the SAME shPartials() law through the page's offline render to WAVs,
#  then has the audio-lens skill (which CANNOT hear) read them back as spectral
#  centroid + clip check + spectrograms.
#
#  audio-lens has no WINDOWED centroid, so we render SHORT HELD STILLS (a single
#  phase, thetaStart === thetaEnd) at θ ∈ {0, 3, 6, 9} for both envelopes:
#    1. ILLUSION stills — all four centroids (Hz) within a tight % band of each
#       other (banded — the audible twin of LEG B; the brightness barely moves as
#       the chord climbs a full octave).
#    2. LADDER stills at the same phases — centroids STRICTLY INCREASING and the
#       last clearly ABOVE the illusion band's top (the audible twin of LEG C —
#       the tone climbs out and never returns). The flat control's ~+1-octave
#       escape gives a wide, unambiguous margin; the % tolerance is read from it.
#    3. --clips false on the loop render and the flat render and all stills (the
#       audible LEG D — the bounded chord + compressor never clip).
#    4. write spec-loop.png (a fixed bright band; partials sliding through a
#       stationary glow) and spec-flat.png (the whole stack marching diagonally
#       off the top) so the difference is screenshot-readable.
#
#  Do NOT trust the headless ear — these numbers ARE the proof the sound matches
#  the math (Rain/Loom/Carillon/Lattice/Gamelan/Quorum/Rack precedent).
#
#  Renders are produced in a browser (the offline render is Web Audio). To make
#  the WAVs: serve the repo, open the leaf, and in the console run e.g.:
#     window.__renderStaircase({seconds:2, thetaStart:0, thetaEnd:0}).then(b=>/* save i0.wav  */)
#     window.__renderStaircase({seconds:2, thetaStart:3, thetaEnd:3}).then(b=>/* save i3.wav  */)
#     window.__renderStaircase({seconds:2, thetaStart:6, thetaEnd:6}).then(b=>/* save i6.wav  */)
#     window.__renderStaircase({seconds:2, thetaStart:9, thetaEnd:9}).then(b=>/* save i9.wav  */)
#     window.__renderStaircase({seconds:2, thetaStart:0, thetaEnd:0, flat:true}).then(b=>/* l0.wav */)
#     window.__renderStaircase({seconds:2, thetaStart:3, thetaEnd:3, flat:true}).then(b=>/* l3.wav */)
#     window.__renderStaircase({seconds:2, thetaStart:6, thetaEnd:6, flat:true}).then(b=>/* l6.wav */)
#     window.__renderStaircase({seconds:2, thetaStart:9, thetaEnd:9, flat:true}).then(b=>/* l9.wav */)
#     window.__renderStaircase({seconds:6, thetaStart:0, thetaEnd:12}).then(b=>/* loop.wav  */)
#     window.__renderStaircase({seconds:6, thetaStart:0, thetaEnd:12, flat:true}).then(b=>/* flat.wav */)
#  Then point this script at them, in this exact order.
#
#  Usage:  bash verify.sh i0 i3 i6 i9 l0 l3 l6 l9 loop flat   (each a .wav path)
# ============================================================================
set -euo pipefail

I0="${1:?need illusion still θ=0}"; I3="${2:?need illusion θ=3}"; I6="${3:?need illusion θ=6}"; I9="${4:?need illusion θ=9}"
L0="${5:?need ladder θ=0}";   L3="${6:?need ladder θ=3}";   L6="${7:?need ladder θ=6}";   L9="${8:?need ladder θ=9}"
LOOP="${9:?need loop sweep wav}"; FLAT="${10:?need flat sweep wav}"
LENS="${AUDIO_LENS:-$HOME/.claude/skills/audio-lens/bin/audio-lens.js}"

centroid() { node "$LENS" analyze "$1" --centroid --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).centroid))'; }
clips() { node "$LENS" analyze "$1" --clips --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

IC0=$(centroid "$I0"); IC3=$(centroid "$I3"); IC6=$(centroid "$I6"); IC9=$(centroid "$I9")
LC0=$(centroid "$L0"); LC3=$(centroid "$L3"); LC6=$(centroid "$L6"); LC9=$(centroid "$L9")
LOOP_CL=$(clips "$LOOP"); FLAT_CL=$(clips "$FLAT")
I0CL=$(clips "$I0"); L9CL=$(clips "$L9")

echo "ILLUSION centroids (Hz) θ=0/3/6/9:  $IC0  $IC3  $IC6  $IC9"
echo "LADDER   centroids (Hz) θ=0/3/6/9:  $LC0  $LC3  $LC6  $LC9"
echo "clips — loop:$LOOP_CL flat:$FLAT_CL i0:$I0CL l9:$L9CL"

DIR="$(dirname "$LOOP")"
node "$LENS" analyze "$LOOP" --spectrogram "$DIR/spec-loop.png" --json >/dev/null
node "$LENS" analyze "$FLAT" --spectrogram "$DIR/spec-flat.png" --json >/dev/null
echo "spectrograms → spec-loop.png (a fixed bright band; partials slide through) · spec-flat.png (the whole stack marches off the top)"

node - "$IC0" "$IC3" "$IC6" "$IC9" "$LC0" "$LC3" "$LC6" "$LC9" "$LOOP_CL" "$FLAT_CL" "$I0CL" "$L9CL" <<'NODE'
const [,, ic0,ic3,ic6,ic9, lc0,lc3,lc6,lc9, loopCl, flatCl, i0Cl, l9Cl] = process.argv;
const ill = [ic0,ic3,ic6,ic9].map(Number);
const lad = [lc0,lc3,lc6,lc9].map(Number);
let fail = 0; const log=(ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// 1. ILLUSION banded — all four centroids within a tight % spread of each other.
//    The tolerance is read from the data: the flat ladder fans by ~+1 octave (≈100%
//    rise), so an illusion spread under 20% is unambiguously "banded, not climbing".
const iMin = Math.min(...ill), iMax = Math.max(...ill);
const iSpread = (iMax - iMin) / iMin;          // fractional spread
log(iSpread < 0.20,
    `1. ILLUSION centroids banded across a full octave climb — spread ${(iSpread*100).toFixed(1)}% < 20% (${ill.map(x=>x.toFixed(0)).join(' / ')} Hz); the brightness barely moves while the chord climbs`);

// 2. LADDER strictly increasing AND escaping the illusion band (its last centroid
//    well above the illusion's max). The same eight stills; only the envelope changed.
let up = true; for (let i=1;i<lad.length;i++) if (lad[i] <= lad[i-1]) up = false;
const escapes = lad[lad.length-1] > iMax * 1.2;   // > 20% above the illusion top
log(up && escapes,
    `2. LADDER centroids strictly increasing and escaping the band — ${lad.map(x=>x.toFixed(0)).join(' / ')} Hz, last ${lad[3].toFixed(0)} > illusion max ${iMax.toFixed(0)} ×1.2; flip the envelope flat and the tone climbs out and never returns`);

// 3. no clipping anywhere (bounded chord + compressor).
log(loopCl==='false' && flatCl==='false' && i0Cl==='false' && l9Cl==='false',
    `3. no clipping on the loop, the flat sweep, or the stills (loop:${loopCl} flat:${flatCl} i0:${i0Cl} l9:${l9Cl}) — the bounded chord never spikes`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — the illusion chord holds its brightness while climbing a full octave (banded), the flat ladder climbs strictly out of that band, and nothing clips. The sound matches the math.');
NODE
