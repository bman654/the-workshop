#!/usr/bin/env bash
# THE WEIGHTED LID — art-foundry preview harness.
#
#   preview-harness.sh <candidate> <outdir> <port>
#
# Renders one candidate visual-art module (the lid-bar / gym-plate draw function) inside the
# exhibit's dark contemplative context and screenshots <outdir>/preview.png.
#
# CANDIDATE CONTRACT (full detail in lid-bar.md / gym-plate.md): the candidate is a JS file that
# assigns
#     window.__LID  = function(ctx, x, yTop, w, th){...}  and/or
#     window.__PLATE= function(ctx, cx, cy, pw, ph, weight){...}
# The harness wraps it in preview-page.html, which paints the real dark vessel + gas +
# lid at its balance height, three stacked gym-plates + a spare rack, so
# the judge sees the machined art in true context.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUTDIR"

cp "$HERE/preview-page.html" "$SCRATCH/preview.html"
if [ "$CANDIDATE" = "-" ]; then
  # sentinel: render the LIVE tree — extract the installed window.__PLATE / window.__LID
  # module from between its markers in the live exhibit files.
  : > "$SCRATCH/asset.js"
  [ -f "$HERE/../lid.html" ] && awk '/__PLATE_ART_BEGIN/{f=1;next} /__PLATE_ART_END/{f=0} f' "$HERE/../lid.html" >> "$SCRATCH/asset.js"
  [ -f "$HERE/../lid.html" ] && awk '/__LID_ART_BEGIN/{f=1;next} /__LID_ART_END/{f=0} f' "$HERE/../lid.html" >> "$SCRATCH/asset.js"
  [ -s "$SCRATCH/asset.js" ] || { echo "FAIL sentinel '-' but no live __PLATE/__LID markers found" >&2; exit 1; }
else
  cp "$CANDIDATE" "$SCRATCH/asset.js"
fi

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
