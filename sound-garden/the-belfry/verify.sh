#!/usr/bin/env bash
# THE BELFRY — everything this room claims, from a cold command line.
#   bash sound-garden/the-belfry/verify.sh
# 1. the twin: the bell, the method, the band, the geometry
# 2. the voice: render the modal bank to WAV and point the audio-lens at it
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
LENS="$HOME/.claude/skills/audio-lens/bin/audio-lens.js"
OUT="${1:-/tmp/belfry-wavs}"
fail=0

echo "── 1 · the twin ──────────────────────────────────────────────────────────"
node "$HERE/belfry.test.mjs" || fail=1

echo
echo "── 2 · the voice ─────────────────────────────────────────────────────────"
node "$HERE/render-wavs.mjs" "$OUT" || fail=1
if [ -f "$LENS" ]; then
  for f in tenor-all-partials tenor-strike-group-only rounds-on-six; do
    printf '  %-30s ' "$f"
    node "$LENS" analyze "$OUT/$f.wav" --peaks --human | tr '\n' ' '
    node "$LENS" analyze "$OUT/$f.wav" --clips --peak
  done
  echo
  echo "  Expect: the full blow shows the ladder 98 : 196 : 392 (hum, prime, nominal);"
  echo "  the strike-group render shows 392 : 590 : 788 and a detector calls it G4,"
  echo "  because the strike note IS NOT IN THE SOUND; nothing clips anywhere."
else
  echo "  (audio-lens not installed — npx skills add bman654/audio-forge)"
fi

echo
echo "── 3 · the forge ─────────────────────────────────────────────────────────"
node "$ROOT/tools/forge/forge.mjs" --check "$HERE/index.src.html" || fail=1

exit $fail
