#!/usr/bin/env bash
# THE FAITHFUL DRUM — art-foundry preview harness.
#
#   preview.sh <candidate> <outdir> <port>
#
# Renders ONE candidate art module — either the brass MATERIAL pass (drum-brass) or the
# starter INK loops (starter-loops) — INSIDE the real drum exhibit and screenshots
# <outdir>/preview.png for the judge.
#
# The harness auto-detects which placeholder the candidate replaces by scanning it for
# `window.Brass` vs `window.Loops` (or an optional leading `// @asset drum-brass|starter-loops`
# line), swaps the candidate over that source file in a scratch copy of the piece,
# forge-builds the page, serves it, and captures:
#   - drum-brass    → the drum FROZEN at a fixed angle with a starter loop loaded
#                     (so the judge sees the brass wall + slit lips + rims in context)
#   - starter-loops → the full 12-frame STRIP DESK with the loop loaded, and the drum
#                     frozen at a lock-ish angle (so the judge reads the whole cycle)
#
# Contract each candidate must satisfy lives in art-specs/drum-brass.md /
# art-specs/starter-loops.md. This harness only needs the candidate to keep the
# window.Brass / window.Loops API shape those specs pin.
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
PIECE="$(cd "$HERE/.." && pwd)"                       # the-faithful-drum/
REPO="$(cd "$PIECE/.." && pwd)"                       # repo root
SCRATCH="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUTDIR"

# which placeholder does this candidate replace?
ASSET="$(grep -m1 '// @asset' "$CANDIDATE" | sed 's#// @asset ##' | tr -d '\r' || true)"
if [ -z "$ASSET" ]; then
  if grep -q 'window\.Loops\|root\.Loops\|\.Loops *=' "$CANDIDATE"; then ASSET="starter-loops";
  else ASSET="drum-brass"; fi
fi
case "$ASSET" in
  drum-brass)    TARGET="drum-brass.js"; LOOP="horse"; ANGLE="0.42"; SHOT="drum" ;;
  starter-loops) TARGET="starter-loops.js"; LOOP="horse"; ANGLE="0.30"; SHOT="strip" ;;
  *) echo "unknown asset '$ASSET'" >&2; exit 1 ;;
esac

# scratch copy of the piece with the candidate swapped in, then forge-build in place
cp -R "$PIECE" "$SCRATCH/piece"
cp -R "$REPO/tools" "$SCRATCH/tools"
cp "$CANDIDATE" "$SCRATCH/piece/$TARGET"
# fix the ws.js include path (../tools/ws/ws.js) — the scratch layout preserves it
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

# a tiny driver page that loads the built piece in an iframe, freezes the drum / loads the
# loop, and exposes a done flag — but simpler: inject via URL hash the built page reads.
# The built page has no hash hooks, so instead drive it with a headless eval through a
# wrapper: we screenshot the piece directly after a virtual-time budget with a query the
# page ignores; to freeze deterministically we append a boot override file.
cat > "$SCRATCH/piece/preview-boot.js" <<BOOT
window.addEventListener('load', function(){
  setTimeout(function(){
    try{
      if (typeof loadLoop==='function'){ loadLoop('$LOOP'); var sel=document.getElementById('loops'); if(sel) sel.value='$LOOP'; }
      if (typeof omega!=='undefined'){ omega=0; }
      if (typeof angle!=='undefined'){ angle=$ANGLE; }
      if (typeof drawDrum==='function') drawDrum();
      if (typeof renderStrip==='function') renderStrip();
    }catch(e){}
  }, 300);
});
BOOT
# splice the boot override just before </body> of the built html
node -e '
  const fs=require("fs"), p=process.argv[1];
  let h=fs.readFileSync(p,"utf8");
  h=h.replace("</body>", "<script src=\"preview-boot.js\"></"+"script></body>");
  fs.writeFileSync(p,h);
' "$SCRATCH/piece/index.html"

prof="$(mktemp -d)"
TIMEOUT="$(command -v gtimeout || command -v timeout || true)"
${TIMEOUT:+$TIMEOUT 40} "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --user-data-dir="$prof" \
  --window-size=1000,1200 --virtual-time-budget=2500 \
  --screenshot="$OUTDIR/preview.png" "http://localhost:${PORT}/piece/index.html" >/dev/null 2>&1 || true
rm -rf "$prof"

[ -s "$OUTDIR/preview.png" ] && echo "$OUTDIR/preview.png" || { echo "FAIL no preview.png" >&2; exit 1; }
cleanup; trap - EXIT
