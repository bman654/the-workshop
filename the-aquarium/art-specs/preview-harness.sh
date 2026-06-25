#!/usr/bin/env bash
# THE AQUARIUM — art-foundry preview harness.
#
#   preview-harness.sh <candidate> <outdir> <port>
#
# Renders a single candidate visual-art module (a fish silhouette, the caustic
# field, or the vent/coral decor) inside the aquarium's tank context and
# screenshots <outdir>/preview.png. The candidate is a JS module that defines ONE
# global draw function whose name is read from the candidate file's leading
# `// @assetKey <key>` line (or defaults to the basename). The harness wraps it in
# a self-contained preview page that paints the real depth gradient + vent glow
# behind it, then draws the asset on a small grid of poses so the judge sees the
# swim-cycle / light field / decor in true context.
#
# Contract the candidate must satisfy is in the per-asset spec (fish-*.md,
# caustics.md, vent-coral.md). This harness only needs: the candidate file defines
# `window.__ASSET` = a draw function with the signature named in its spec.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUTDIR"

# the candidate's asset kind drives which preview template we wrap it in
KIND="$(grep -m1 '// @kind' "$CANDIDATE" | sed 's#// @kind ##' | tr -d '\r' || true)"
[ -z "$KIND" ] && KIND="fish"

# build the preview page: the tank backdrop + the candidate + a pose grid
cp "$HERE/preview-page.html" "$SCRATCH/preview.html"
cp "$CANDIDATE" "$SCRATCH/asset.js"
# inject the kind so the page knows how to exercise the asset
printf '\nwindow.__ASSET_KIND=%q;\n' "$KIND" >> "$SCRATCH/asset.js" 2>/dev/null || \
  echo "window.__ASSET_KIND='$KIND';" >> "$SCRATCH/asset.js"

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
  --window-size=720,900 --virtual-time-budget=2500 \
  --screenshot="$OUTDIR/preview.png" "http://localhost:${PORT}/preview.html" >/dev/null 2>&1 || true
rm -rf "$prof"

[ -s "$OUTDIR/preview.png" ] && echo "$OUTDIR/preview.png" || { echo "FAIL no preview.png" >&2; exit 1; }
cleanup; trap - EXIT
