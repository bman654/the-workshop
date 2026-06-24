#!/usr/bin/env bash
# Foundry SOUND render bench — the audio analog of gate-foundry/render-take.sh.
#
#   render-wav.sh <scratch_dir> <candidate_path> <port> <out_dir> [dur_sec]
#
# OfflineAudioContext is browser-only, so a sound take cannot be rendered in pure
# Node. This drives the BROWSER bench: it copies art-foundry/sfx-bench.html + the
# candidate WebAudio module into <scratch_dir> (as candidate.js), serves it on
# <port>, uses agent-browser to render the candidate through an OfflineAudioContext
# (eval awaits the returned promise → base64 on stdout), decodes the base64 to
# <out_dir>/asset.wav, then runs the in-house audio-lens CLI to write
# <out_dir>/analysis.txt (an agent cannot hear — the analysis IS how the judge hears).
# Always tears the server + browser session down. Echoes the artifact paths.
#
# Source of truth is GATE_SRC (default /tmp/gate-worktree) — holds art-foundry/ + tools/audio-lens/.
set -euo pipefail

SCRATCH="$1"; CANDIDATE="$2"; PORT="$3"; OUTDIR="$4"; DUR="${5:-3}"
GATE_SRC="${GATE_SRC:-/tmp/gate-worktree}"
BENCH="$GATE_SRC/art-foundry/sfx-bench.html"
LENS="$GATE_SRC/tools/audio-lens/bin/audio-lens.js"
SESSION="sfx-$PORT"   # unique per reserved port so parallel takes don't collide

mkdir -p "$SCRATCH" "$OUTDIR"
cp "$BENCH" "$SCRATCH/sfx-bench.html"
cp "$CANDIDATE" "$SCRATCH/candidate.js"

SRV_PID=""
cleanup() {
  [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null || true
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!

# Wait for readiness (max ~5s).
for _ in $(seq 1 50); do
  if curl -fsS "http://localhost:${PORT}/sfx-bench.html" -o /dev/null 2>/dev/null; then break; fi
  sleep 0.1
done

agent-browser --session "$SESSION" open "http://localhost:${PORT}/sfx-bench.html" >/dev/null 2>&1
agent-browser --session "$SESSION" wait --load networkidle >/dev/null 2>&1 || true

# Render: eval awaits the returned promise, so the base64 comes back on stdout. Extract the long
# base64 token robustly (ignore any stray log lines agent-browser may print around it).
RAW="$(agent-browser --session "$SESSION" eval "renderCandidate(${DUR})" 2>/dev/null || true)"
B64="$(printf '%s' "$RAW" | python3 -c "import sys,re; t=sys.stdin.read(); m=re.findall(r'[A-Za-z0-9+/=]{200,}', t); sys.stdout.write(m[0] if m else '')")"

if [ -z "$B64" ]; then
  echo "FAIL: empty render — candidate.js did not register a Gate.sfx builder, or it threw. raw=[${RAW:0:200}]" >&2
  exit 1
fi

printf '%s' "$B64" | python3 -c "import sys,base64; open('${OUTDIR}/asset.wav','wb').write(base64.b64decode(sys.stdin.read()))"

# Analyze (the deaf judge's ears). --human is the readable report; fall back to JSON if --human is absent.
if node "$LENS" analyze "$OUTDIR/asset.wav" --human > "$OUTDIR/analysis.txt" 2>/dev/null; then :; else
  node "$LENS" analyze "$OUTDIR/asset.wav" > "$OUTDIR/analysis.txt" 2>&1 || true
fi

[ -s "$OUTDIR/asset.wav" ] || { echo "FAIL: $OUTDIR/asset.wav not written" >&2; exit 1; }
echo "$OUTDIR/asset.wav"
echo "$OUTDIR/analysis.txt"

cleanup; trap - EXIT
