#!/usr/bin/env bash
# THE SHADOW THEATER — art-foundry preview harness.
#
#   preview-harness.sh <candidate> <outdir> <port>
#
# Renders a single candidate visual-art module IN TRUE CONTEXT — the full Shadow
# Theater render engine (rasterize -> scale-about-the-lamp -> blur -> darken-union
# compositor) — and screenshots <outdir>/preview.png so a judge sees the real cast:
# overlapping paper merging to solid black, a lamp-near crane looming huge + soft, a
# pierced moon staying lit. The candidate is one of the two forged visual modules:
#
#   * a puppets.js candidate  (defines root.Puppets)     -> swapped in as puppets.js
#   * a proscenium.js candidate (defines root.Proscenium) -> swapped in as proscenium.js
#
# The harness auto-detects which by grepping the candidate, builds an isolated
# scratch copy of the piece + tools/, swaps the candidate in, forges the page,
# INJECTS a showcase pose (production page stays clean), serves it, and shoots.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
PIECE="$(cd "$HERE/.." && pwd)"
ROOT="$(cd "$PIECE/.." && pwd)"
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUTDIR"

# which module does this candidate replace?
TARGET="puppets.js"
if grep -q 'root\.Proscenium\|window\.Proscenium' "$CANDIDATE" 2>/dev/null; then TARGET="proscenium.js"; fi
if grep -q 'root\.Puppets\|window\.Puppets' "$CANDIDATE" 2>/dev/null; then TARGET="puppets.js"; fi

# isolated renderable set: the piece dir + tools/ (forge inlines ../tools/ws/ws.js).
mkdir -p "$SCRATCH/shadow-theater" "$SCRATCH/tools"
rsync -a --exclude '.git' "$PIECE/" "$SCRATCH/shadow-theater/"
rsync -a --exclude '.git' "$ROOT/tools/" "$SCRATCH/tools/"
cp "$CANDIDATE" "$SCRATCH/shadow-theater/$TARGET"

cd "$SCRATCH"
node tools/forge/forge.mjs shadow-theater/index.src.html >/dev/null

# inject a showcase pose so the screenshot shows the full SET in context (loom, union,
# depth, the lit moon) — kept OUT of the production page.
POSE='<script>setTimeout(function(){try{Stage.setState({puppets:[{id:"crane",x:0.50,y:0.52,depth:0.60,artic:{wing:0.90}},{id:"fox",x:0.28,y:0.60,depth:0.14,artic:{look:0.62}},{id:"moon",x:0.60,y:0.30,depth:0.05,artic:{}},{id:"reed",x:0.84,y:0.74,depth:0.10,artic:{sway:0.30}},{id:"willow",x:0.14,y:0.13,depth:0.12,artic:{sway:0.40}},{id:"vee",x:0.42,y:0.20,depth:0.02,artic:{}}],lampD:340},{animate:false});if(Stage.settleNow)Stage.settleNow();}catch(e){}},700);</script>'
perl -0pi -e "s#</body>#$POSE\n</body>#" "$SCRATCH/shadow-theater/index.html"

SRV_PID=""
cleanup(){ [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null || true; rm -rf "$SCRATCH"; }
trap cleanup EXIT

nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!
for _ in $(seq 1 50); do
  curl -fsS "http://localhost:${PORT}/shadow-theater/index.html" -o /dev/null 2>/dev/null && break
  sleep 0.1
done

prof="$(mktemp -d)"
TIMEOUT="$(command -v gtimeout || command -v timeout || true)"
${TIMEOUT:+$TIMEOUT 30} "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --user-data-dir="$prof" --timeout=20000 \
  --window-size=960,760 --virtual-time-budget=3000 \
  --screenshot="$OUTDIR/preview.png" "http://localhost:${PORT}/shadow-theater/index.html" >/dev/null 2>&1 || true
rm -rf "$prof"

[ -s "$OUTDIR/preview.png" ] && echo "$OUTDIR/preview.png" || { echo "FAIL no preview.png" >&2; exit 1; }
