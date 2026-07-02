#!/usr/bin/env bash
# A SKY YOU NAME — art-foundry preview harness.
#
#   preview.sh <candidate> <outdir> <port>
#
# Renders ONE candidate VISUAL art module — the antique-atlas star glint (art-star.js)
# OR the aged-vellum cartouche frame (art-cartouche.js) — INSIDE the real piece and
# screenshots <outdir>/preview.png for the judge. Both assets appear together in the
# CATASTERIZE reveal (the cartouche frames the plate; the gilded node-stars sit on the
# inked asterism; the field is full of star sprites), so ONE captured frame shows the
# candidate in true context.
#
# Auto-detects which placeholder the candidate replaces by scanning for
# `Gate.art.star` vs `Gate.art.cartouche` (or an optional leading `// @asset star|cartouche`).
# Swaps the candidate over that source file in a scratch copy, forge-builds the page,
# serves it, drives a deterministic lacing → reveal via the page's own window.__sky.drive
# bridge, and captures the settled plate.
#
# Contract each candidate must satisfy lives in art-specs/art-star.md / art-specs/art-cartouche.md.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
PIECE="$(cd "$HERE/.." && pwd)"                       # a-sky-you-name/
REPO="$(cd "$PIECE/.." && pwd)"                       # repo root
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUTDIR"

# which placeholder does this candidate replace?
ASSET="$(grep -m1 '// @asset' "$CANDIDATE" | sed 's#// @asset ##' | tr -d '\r' || true)"
if [ -z "$ASSET" ]; then
  if grep -q 'Gate\.art\.cartouche' "$CANDIDATE"; then ASSET="cartouche";
  else ASSET="star"; fi
fi
case "$ASSET" in
  star)      TARGET="art-star.js" ;;
  cartouche) TARGET="art-cartouche.js" ;;
  *) echo "unknown asset '$ASSET'" >&2; exit 1 ;;
esac

# scratch copy of the piece + tools, candidate swapped in, forge-built in place
cp -R "$PIECE" "$SCRATCH/piece"
cp -R "$REPO/tools" "$SCRATCH/tools"
cp "$CANDIDATE" "$SCRATCH/piece/$TARGET"
( cd "$SCRATCH" && node tools/forge/forge.mjs piece/index.src.html >/dev/null 2>&1 ) || {
  echo "FAIL forge build" >&2; exit 1; }

SRV_PID=""
cleanup(){ [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null || true; rm -rf "$SCRATCH"; }
trap cleanup EXIT
nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!
for _ in $(seq 1 50); do
  curl -fsS "http://localhost:${PORT}/piece/index.html" -o /dev/null 2>/dev/null && break
  sleep 0.1
done

# a boot override: on load, lace a fixed figure and catasterize so the reveal plate
# (cartouche + gilded node-stars) is on screen, plus the full starfield behind it.
cat > "$SCRATCH/piece/preview-boot.js" <<'BOOT'
window.addEventListener('load', function(){
  setTimeout(function(){
    try{ if (window.__sky && window.__sky.drive) window.__sky.drive([0,4,9,14,7]); }catch(e){}
  }, 350);
});
BOOT
node -e '
  const fs=require("fs"), p=process.argv[1];
  let h=fs.readFileSync(p,"utf8");
  h=h.replace("</body>", "<script src=\"preview-boot.js\"></"+"script></body>");
  // some estate pages have no explicit </body>; forge wraps one at publish. If missing, append.
  if(h.indexOf("preview-boot.js")<0) h += "\n<script src=\"preview-boot.js\"></"+"script>";
  fs.writeFileSync(p,h);
' "$SCRATCH/piece/index.html"

prof="$(mktemp -d)"
TIMEOUT="$(command -v gtimeout || command -v timeout || true)"
${TIMEOUT:+$TIMEOUT 40} "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --user-data-dir="$prof" \
  --window-size=1200,800 --virtual-time-budget=3000 \
  --screenshot="$OUTDIR/preview.png" "http://localhost:${PORT}/piece/index.html" >/dev/null 2>&1 || true
rm -rf "$prof"

[ -s "$OUTDIR/preview.png" ] && echo "$OUTDIR/preview.png" || { echo "FAIL no preview.png" >&2; exit 1; }
cleanup; trap - EXIT
