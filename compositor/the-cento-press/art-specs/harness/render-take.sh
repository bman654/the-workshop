#!/usr/bin/env bash
# THE CENTO PRESS — art foundry preview harness
#
#   bash render-take.sh <candidate.js> <outdir> <port>
#
# Loads the candidate art module into the exhibit's real context (preview.html),
# serves it, and screenshots <outdir>/preview.png. Serves ONE visual asset per
# call; which one is inferred from what the candidate defines
# (window.CentoArt.press.draw or window.CentoArt.paper.stock).
set -euo pipefail

CAND="${1:?usage: render-take.sh <candidate.js> <outdir> <port>}"
OUT="${2:?usage: render-take.sh <candidate.js> <outdir> <port>}"
PORT="${3:?usage: render-take.sh <candidate.js> <outdir> <port>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$OUT"
cp "$HERE/preview.html.tmpl" "$OUT/index.html"
cp "$CAND" "$OUT/candidate.js"

SESSION="cento-art-$PORT"
cleanup() {
  [[ -n "${SRV_PID:-}" ]] && kill "$SRV_PID" 2>/dev/null || true
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
}
trap cleanup EXIT

( cd "$OUT" && python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV_PID=$!
sleep 1.2

agent-browser --session "$SESSION" set viewport 1800 1100 >/dev/null
agent-browser --session "$SESSION" open "http://localhost:$PORT/index.html" >/dev/null
agent-browser --session "$SESSION" wait --fn "window.__ARTREADY === true" >/dev/null 2>&1 || true
agent-browser --session "$SESSION" wait 900 >/dev/null
agent-browser --session "$SESSION" screenshot "$OUT/preview.png" >/dev/null

[[ -f "$OUT/preview.png" ]] || { echo "render-take: no preview.png produced" >&2; exit 1; }
echo "render-take: $OUT/preview.png"
