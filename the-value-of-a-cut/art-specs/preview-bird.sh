#!/usr/bin/env bash
# THE VALUE OF A CUT — art-foundry preview harness for the ORACLE BIRD.
#
#   preview-bird.sh <candidate> <outdir> <port>
#
# Loads the candidate JS (which must set `window.Bird` with mount/setSide/cheer per
# art-specs/oracle-bird.md) into the real oracle-panel context (#birdstage, the brass
# ledger palette), mounts it, cycles it through blue → red → center → warn → cheer, and
# screenshots <outdir>/preview.png so a judge sees the bird hopping to each side in true
# context. Zero-dependency; headless Chrome.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome-stable || command -v chromium || command -v chromium-browser || echo "$CHROME")"
mkdir -p "$OUTDIR"

cp "$HERE/preview-bird-page.html" "$SCRATCH/preview.html"
cp "$CANDIDATE" "$SCRATCH/bird.js"

SRV_PID=""
cleanup(){ [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null || true; rm -rf "$SCRATCH"; }
trap cleanup EXIT

nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!
for _ in $(seq 1 50); do
  curl -fsS "http://localhost:${PORT}/preview.html" -o /dev/null 2>/dev/null && break
  sleep 0.1
done

prof="$(mktemp -d)"
TIMEOUT="$(command -v gtimeout || command -v timeout || true)"
${TIMEOUT:+$TIMEOUT 30} "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=2 --user-data-dir="$prof" --timeout=20000 \
  --window-size=640,540 --virtual-time-budget=4000 \
  --screenshot="$OUTDIR/preview.png" "http://localhost:${PORT}/preview.html" >/dev/null 2>&1 || true
rm -rf "$prof"

[ -s "$OUTDIR/preview.png" ] && echo "$OUTDIR/preview.png" || { echo "FAIL no preview.png" >&2; exit 1; }
cleanup; trap - EXIT
