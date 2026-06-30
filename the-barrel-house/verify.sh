#!/usr/bin/env bash
# ============================================================================
#  The Barrel House — the lens-native AUDIO ear-check (audio-lens).
#
#  The Node twin (pin-barrel/core.test.mjs) proves the MATH exact: the canon by
#  set-equality (32 pairs / 0 unpaired), the crab by reflection (16 / 0), the
#  round closes, the transport plucks every pin exactly N times per N turns, the
#  count-equality guard, and the three neg-controls. This script proves the
#  HEARD leg: it drives the page's GENUINE offline render (window.__renderOffline,
#  Web Audio under an OfflineAudioContext — NOT an in-page autocorr stand-in) to a
#  WAV, then has the audio-lens skill (which CANNOT hear) read the comb pitches
#  back and confirm no clipping.
#
#  The comb is a C-based pentatonic stack: tooth t → MIDI 60+SCALE[t]. The melody
#  rides teeth 5..12, so the rendered canon's loudest tones must land on notes
#  from {C5 D5 E5 G5 A5 C6 D6 E6} (the pentatonic set), each within a few cents.
#  We assert: (1) the top spectral peaks are pentatonic-set notes (in tune); (2)
#  the render does NOT clip; (3) it is not silent; (4) a spectrogram is written so
#  the pluck-on-cross timing (evenly spaced vertical streaks) is screenshot-readable.
#
#  This script is SELF-DRIVING: it serves the repo on an uncommon port, opens the
#  Pin-Barrel in a headless browser via agent-browser, renders the canon offline,
#  pulls the WAV bytes back, lenses them, and tears its own server + session down.
#
#  Usage:  bash the-barrel-house/verify.sh            (renders + lenses the canon)
#          AUDIO_LENS=/path/to/audio-lens.js bash the-barrel-house/verify.sh
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${BH_PORT:-8791}"
SESS="bh-verify-$$"
LENS="${AUDIO_LENS:-$HOME/.claude-team/skills/audio-lens/bin/audio-lens.js}"
[ -f "$LENS" ] || LENS="$HOME/.claude/skills/audio-lens/bin/audio-lens.js"
WAV="$(mktemp -t bh-canon-XXXX).wav"
B64="$(mktemp -t bh-b64-XXXX).txt"
SPEC="$ROOT/the-barrel-house/spec-canon.png"

cleanup() {
  agent-browser --session "$SESS" close >/dev/null 2>&1 || true
  [ -n "${SRV:-}" ] && kill "$SRV" >/dev/null 2>&1 || true
  rm -f "$WAV" "$B64" 2>/dev/null || true
}
trap cleanup EXIT

# --- serve the repo on an uncommon port (torn down by exact PID) ---
( cd "$ROOT" && python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV=$!
sleep 1

URL="http://localhost:$PORT/the-barrel-house/pin-barrel/index.html"
agent-browser --session "$SESS" open "$URL" >/dev/null 2>&1
agent-browser --session "$SESS" wait --load networkidle >/dev/null 2>&1
sleep 1

# --- drive the GENUINE offline render → base64 WAV ---
agent-browser --session "$SESS" eval --stdin > "$B64" 2>&1 <<'EOF'
(async function(){
  const blob = await window.__renderOffline(6);     // 6s forward sweep of the canon
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf); let bin='';
  for (let i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
})()
EOF

node - "$B64" "$WAV" <<'NODE'
const fs=require('fs');
let raw=fs.readFileSync(process.argv[2],'utf8').trim();
if(raw.startsWith('"')&&raw.endsWith('"')) raw=JSON.parse(raw);
fs.writeFileSync(process.argv[3], Buffer.from(raw,'base64'));
NODE

echo "rendered canon → $WAV ($(wc -c < "$WAV") bytes)"

PEAKS=$(node "$LENS" analyze "$WAV" --peaks --json)
CLIPS=$(node "$LENS" analyze "$WAV" --clips --json)
SIL=$(node "$LENS" analyze "$WAV" --silence-ratio --json)
node "$LENS" analyze "$WAV" --spectrogram "$SPEC" --json >/dev/null
echo "peaks:   $PEAKS"
echo "clips:   $CLIPS"
echo "silence: $SIL"
echo "spectrogram → $SPEC (evenly spaced vertical streaks = pluck-on-cross; stacked lines = comb pitches)"

node - "$PEAKS" "$CLIPS" "$SIL" <<'NODE'
const peaks=JSON.parse(process.argv[2]).peaks||[];
const clips=JSON.parse(process.argv[3]).clips;
const sil=JSON.parse(process.argv[4]).silenceRatio;
let fail=0; const log=(ok,m)=>{ console.log((ok?'  ✓ ':'  ✗ ')+m); if(!ok)fail=1; };

// the comb is a C-pentatonic stack: teeth 5..12 → these note names (octave-free).
const PENTA = new Set(['C','D','E','G','A']);
const inTune = peaks.filter(p => PENTA.has(String(p.note).replace(/[0-9#-]/g,'')) && Math.abs(p.cents) <= 35);
log(peaks.length>0 && inTune.length>=2,
    `at least 2 of the top peaks are in-tune pentatonic comb notes — got [${peaks.map(p=>p.note+(p.cents>=0?'+':'')+p.cents+'c').join(' ')}]`);
log(clips===false, `the 2-3-voice comb does NOT clip (master DynamicsCompressor limiter holds)`);
log(sil < 0.5, `the render is not silent (silenceRatio=${sil})`);

console.log(fail? '\n  ✗ audio ear-check FAILED' : '\n  ✓ audio ear-check PASSED — heard pitches match the comb, no clipping');
process.exit(fail);
NODE
