#!/usr/bin/env bash
# ============================================================================
#  THE WIND CHIMES — the EAR-CHECK.
#
#  The loop that builds this estate cannot hear.  The audio-lens cannot either,
#  but it reads sound as numbers and as a spectrogram you can look at, so it
#  stands in for ears.  This script renders the room's own voice to WAVs in Node
#  (no browser: the worklet's DSP is core.mjs, so Node plays the same tubes),
#  then confronts them with the lens.
#
#  WHAT IT ASSERTS
#    1  IN TUNE       each of the six tubes reads as its own note, within 12 c.
#    2  NOT A BELL    the strike is inharmonic: the partial above the
#                     fundamental sits near 2.756x, nowhere near 2x, and there
#                     is no sub-octave hum partial.
#    3  THE CLAIM     the SAME tube hung at 0.2242 and at 0.5 —
#                       · the node render is still sounding when the middle
#                         render has gone quiet, and
#                       · the lens NAMES THEM AS DIFFERENT NOTES: hung on the
#                         node it is A3; hung at the middle the fundamental is
#                         strangled and the strike tone becomes the 2nd partial,
#                         D#5.  Hang a chime in the wrong place and it does not
#                         merely ring shorter — it changes note.
#    4  WHERE YOU HIT struck at 0.5 the 2nd partial is gone from the lens's own
#                     top-three peaks; struck at 0.35 it is there.
#    5  DEAD CALM     no wind is digital silence (silence ratio 1).
#    6  NO CLIPPING   not one render clips, including a minute of gusting air.
#
#  It also leaves three spectrograms in the output directory, because the claim
#  is legible with the eye: node.png has one long bright band running the whole
#  frame; middle.png has that same band as a short wedge, and a higher one that
#  outlives it.
#
#  Usage:  bash sound-garden/the-wind-chimes/verify.sh [outdir]
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null || echo "$HERE/../..")"
OUT="${1:-/tmp/chime-wavs}"

LENS="${AUDIO_LENS:-}"
if [ -z "$LENS" ]; then
  if [ -f "$ROOT/tools/audio-lens/bin/audio-lens.js" ]; then
    LENS="node $ROOT/tools/audio-lens/bin/audio-lens.js"
  elif command -v audio-lens >/dev/null 2>&1; then
    LENS="audio-lens"
  else
    echo "no audio-lens found (set \$AUDIO_LENS)"; exit 1
  fi
fi

echo "· rendering the room's voice"
node "$HERE/render-wavs.mjs" "$OUT" >/dev/null

echo "· looking at it"
for f in tube-0 tube-1 tube-2 tube-3 tube-4 tube-5 node middle centre third gust calm; do
  $LENS analyze "$OUT/$f.wav" --json > "$OUT/$f.json"
done
$LENS analyze "$OUT/node.wav"   --spectrogram "$OUT/node.png"   >/dev/null
$LENS analyze "$OUT/middle.wav" --spectrogram "$OUT/middle.png" >/dev/null
$LENS analyze "$OUT/gust.wav"   --spectrogram "$OUT/gust.png"   >/dev/null

node - "$OUT" <<'JS'
const { readFileSync } = require('node:fs');
const dir = process.argv[2];
const J = (n) => JSON.parse(readFileSync(dir + '/' + n + '.json', 'utf8'));
let bad = 0;
const ok = (name, pass, detail) => {
  if (!pass) bad++;
  console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail ? '   [' + detail + ']' : ''));
};

const NOTES = ['A3', 'B3', 'C#4', 'E4', 'F#4', 'A4'];

console.log('\n1 · in tune');
for (let i = 0; i < 6; i++) {
  const a = J('tube-' + i);
  ok('tube ' + i + ' reads as ' + NOTES[i],
     a.monoNote.name === NOTES[i] && Math.abs(a.monoNote.cents) <= 12,
     a.monoNote.name + ' ' + (a.monoNote.cents >= 0 ? '+' : '') + a.monoNote.cents +
     'c · ' + a.f0.toFixed(1) + ' Hz');
}

console.log('\n2 · a struck tube — not a bell, not a string');
{
  const a = J('tube-0');
  const above = a.peaks.map((p) => p.freq / a.f0).filter((r) => r > 1.5);
  const second = Math.min.apply(null, above);
  ok('the partial above the fundamental sits near 2.756x, not 2x',
     Math.abs(second - 2.7565) < 0.06, 'measured ' + second.toFixed(3) + 'x');
  ok('no sub-octave hum partial — a bell has one, a tube does not',
     !a.peaks.some((p) => Math.abs(p.freq / a.f0 - 0.5) < 0.06));
}

console.log('\n3 · the cord\'s toll, in the sound itself');
{
  const n = J('node'), m = J('middle');
  ok('hung on the node it is still sounding when hung-at-the-middle has stopped',
     n.silenceRatio < m.silenceRatio - 0.1,
     'quiet for ' + (n.silenceRatio * 100).toFixed(0) + '% of the take vs ' +
     (m.silenceRatio * 100).toFixed(0) + '%');
  ok('and the lens names them as DIFFERENT NOTES — the strangled fundamental ' +
     'hands the strike tone to the 2nd partial',
     n.monoNote.name === 'A3' && m.monoNote.name === 'D#5',
     'node ' + n.monoNote.name + ' (' + n.f0.toFixed(0) + ' Hz) vs middle ' +
     m.monoNote.name + ' (' + m.f0.toFixed(0) + ' Hz)');
  ok('and it is far brighter, having lost its low end',
     m.centroid > n.centroid * 2, 'centroid ' + n.centroid + ' -> ' + m.centroid + ' Hz');
}

console.log('\n4 · where the clapper lands');
{
  const c = J('centre'), t = J('third');
  const has2 = (a) => a.peaks.some((p) => Math.abs(p.freq / a.f0 - 2.7565) < 0.12);
  ok('struck at 0.35 the 2nd partial is among the loudest three', has2(t),
     t.peaks.map((p) => p.note).join(' '));
  ok('struck at 0.5 — a node of mode 2 — it is not', !has2(c),
     c.peaks.map((p) => p.note).join(' '));
}

console.log('\n5 · dead calm');
{
  const a = J('calm');
  ok('no wind is digital silence', a.silenceRatio === 1 && a.peak.peakDb < -100,
     'peak ' + a.peak.peakDb + ' dBFS');
}

console.log('\n6 · nothing clips');
for (const f of ['tube-0', 'node', 'middle', 'centre', 'gust']) {
  const a = J(f);
  ok(f + ' peaks at ' + a.peak.peakDb + ' dBFS', !a.clipping);
}

console.log('\n' + (bad ? bad + ' FAILED' : 'the ear-check is green') + '\n');
process.exit(bad ? 1 : 0);
JS
