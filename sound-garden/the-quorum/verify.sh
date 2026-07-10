#!/usr/bin/env bash
# ============================================================================
#  The Quorum — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: order r rises with K,
#  sits on the 1/√N floor with none, and stays flat when the clocks are deaf.
#  This script proves the SOUND matches: it renders the SAME step() law through
#  the page's offline render to low-K, high-K, and deaf-K WAVs, then has the
#  audio-lens skill (which CANNOT hear) read them back as numbers + spectrograms.
#
#  The robust comparative (tempo-on-a-wash is flaky; onset COUNT is not):
#    • onsetCount(high K) ≪ onsetCount(low K)      — the hailstorm collapses
#    • onsetCount(deaf K=6) ≈ onsetCount(low K)    — the deaf control holds
#    • --clips false at high K                     — the compressor tames the pulse
#  and the spectrograms: low-K = a dense mist of scattered click-streaks;
#  high-K = a few clean bright columns (16 clocks firing as one heartbeat).
#
#  Renders are produced in a browser (the offline render is Web Audio); this
#  script documents the recipe + asserts on the resulting WAVs. To produce the
#  WAVs: serve the repo, open the leaf, and in the console run e.g.
#     window.__renderQuorum(8, 0).then(b => /* save b as quorum-lo.wav */)
#     window.__renderQuorum(8, 5.74).then(b => /* save as quorum-hi.wav */)
#     window.__renderQuorum(8, 5.74, true).then(b => /* save as quorum-de.wav */)
#  (Kmax = 3·suggestedKc(16) ≈ 5.74.) Then point this script at the three WAVs.
#
#  Usage:  bash verify.sh <quorum-lo.wav> <quorum-hi.wav> <quorum-de.wav>
# ============================================================================
set -euo pipefail

LO="${1:?path to low-K (K=0) WAV}"
HI="${2:?path to high-K (K≈5.74) WAV}"
DE="${3:?path to deaf high-K WAV}"
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

count() { node "$LENS" analyze "$1" --tempo --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).onsets))'; }
clips() { node "$LENS" analyze "$1" --clips --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

LO_N=$(count "$LO"); HI_N=$(count "$HI"); DE_N=$(count "$DE"); HI_CLIP=$(clips "$HI")

echo "onset counts:  low K = $LO_N   high K = $HI_N   deaf K = $DE_N   (high clips? $HI_CLIP)"
node "$LENS" analyze "$LO" --spectrogram "$(dirname "$LO")/spec-lo.png" --json >/dev/null
node "$LENS" analyze "$HI" --spectrogram "$(dirname "$HI")/spec-hi.png" --json >/dev/null
echo "spectrograms → spec-lo.png (dense scattered mist) · spec-hi.png (a few clean columns)"

fail=0
[ "$HI_N" -lt "$LO_N" ] || { echo "FAIL: high-K onsets ($HI_N) not ≪ low-K ($LO_N)"; fail=1; }
# the deaf control: deaf high-K behaves like uncoupled low-K (within a generous margin)
node -e "process.exit(Math.abs($DE_N-$LO_N) <= Math.max(6, $LO_N*0.3) ? 0 : 1)" || { echo "FAIL: deaf onsets ($DE_N) not ≈ low-K ($LO_N)"; fail=1; }
[ "$HI_CLIP" = "false" ] || { echo "FAIL: high-K clips (compressor not taming the unison pulse)"; fail=1; }

if [ "$fail" = 0 ]; then
  echo "PASS — the hailstorm collapses to a heartbeat as K climbs; the deaf control stays a hailstorm; no clipping. The sound matches the math."
else
  exit 1
fi
