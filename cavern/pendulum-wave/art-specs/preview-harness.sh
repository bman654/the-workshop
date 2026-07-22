#!/usr/bin/env bash
# THE PENDULUM WAVE — art-foundry preview harness.
#
#   preview-harness.sh <candidate> <outdir> <port>
#
# Renders one candidate visual-art module (the bob-glow draw function) inside the
# exhibit's dark contemplative context and screenshots <outdir>/preview.png.
#
# CANDIDATE CONTRACT (full detail in bob-glow.md): the candidate is a JS file that
# assigns
#     window.__ASSET = function(ctx, x, y, r, hue01, intensity){ ... }
# and MAY also assign
#     window.__HUE = function(hue01){ return [r,g,b]; }
# The harness wraps it in preview-page.html, which paints the real dark stage +
# level beam and draws 15 graduated-hue bobs on a travelling-wave arc (some with
# additive trail ghosts) so the judge sees the glow in true context.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUTDIR"

cp "$HERE/preview-page.html" "$SCRATCH/preview.html"
cp "$CANDIDATE" "$SCRATCH/asset.js"

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
  --force-device-scale-factor=1 --user-data-dir="$prof" --timeout=20000 \
  --window-size=720,480 --virtual-time-budget=2000 \
  --screenshot="$OUTDIR/preview.png" "http://localhost:${PORT}/preview.html" >/dev/null 2>&1 || true
rm -rf "$prof"

[ -s "$OUTDIR/preview.png" ] && echo "$OUTDIR/preview.png" || { echo "FAIL no preview.png" >&2; exit 1; }
cleanup; trap - EXIT
