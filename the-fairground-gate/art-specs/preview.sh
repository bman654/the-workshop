#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# preview.sh — the FAIRGROUND GATE foundry render harness.
#
#   bash preview.sh <candidate.js> <outdir> <port>
#
# Loads a candidate gate-art.js (the forged window.GateArt) into an isolated build of the
# estate front door, serves it, drives the page into the state that shows the asset, and
# screenshots <outdir>/preview.png so the foundry judges can SEE the take in real context.
#
# Which asset the candidate covers is auto-detected by what window.GateArt exposes:
#   • drawFace   → screenshot the FRONT DOOR with the gate face lit (free-explore).
#   • drawMidway → screenshot the DESCENDED child layer (the cobbled midway under the tiles).
# A candidate that defines BOTH gets the descended shot (which shows the gate it came from
# AND the midway). The judges score against art-specs/gate-face.md / midway.md.
#
# Always tears its own server + browser session down. Echoes the PNG path it produced.
# ════════════════════════════════════════════════════════════════════════════
set -euo pipefail

CANDIDATE="$1"; OUTDIR="$2"; PORT="$3"
# normalise OUTDIR to an absolute path (agent-browser's screenshot path is resolved against
# ITS cwd, which is the now-cleaned scratch dir — so we must hand it an absolute path).
mkdir -p "$OUTDIR"; OUTDIR="$(cd "$OUTDIR" && pwd)"
REPO="${GATE_REPO:-$(cd "$(dirname "$0")/../.." && pwd)}"
SCRATCH="$(mktemp -d /tmp/fairgate-preview.XXXXXX)"
SESSION="fairgate-preview-$PORT"

cleanup() {
  [ -n "${SRV_PID:-}" ] && kill "$SRV_PID" 2>/dev/null || true
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
  rm -rf "$SCRATCH" 2>/dev/null || true
}
trap cleanup EXIT

# Minimal renderable set: index.src.html + tools/ (forge inlines tools/* + the-fairground-gate/).
mkdir -p "$SCRATCH/the-fairground-gate"
cp "$REPO/index.src.html" "$SCRATCH/index.src.html"
rsync -a --exclude '.git' "$REPO/tools/" "$SCRATCH/tools/"
# swap in the candidate gate-art.js (the module forge:includes).
cp "$CANDIDATE" "$SCRATCH/the-fairground-gate/gate-art.js"
# the amusement room pages are not needed for the front-door render; the POI tiles draw
# from PLACES alone. Copy the rest of the repo's html dirs lazily ONLY if a link is followed
# (we never navigate, so skip — keeps the scratch small).

cd "$SCRATCH"
node tools/forge/forge.mjs index.src.html >/dev/null

# serve
nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!
for _ in $(seq 1 50); do
  curl -fsS "http://localhost:${PORT}/index.html" -o /dev/null 2>/dev/null && break
  sleep 0.1
done

# load + settle fonts, then drive to the asset state and screenshot.
agent-browser --session "$SESSION" open "http://localhost:${PORT}/index.html" >/dev/null
agent-browser --session "$SESSION" wait --load networkidle >/dev/null
agent-browser --session "$SESSION" wait 900 >/dev/null

# detect what the candidate exposes + drive the page accordingly, then screenshot.
agent-browser --session "$SESSION" eval --stdin >/dev/null <<'EVALEOF'
(function(){
  var GA = window.GateArt || {};
  var bar = document.getElementById("platebar");
  function tour(to){ var d=Array.prototype.slice.call(bar.querySelectorAll(".door")).find(function(x){return x.dataset.to===to;}); if(d) d.click(); }
  if (GA.drawMidway) {
    // descended state: tour grounds-east (lights the gate), then descend into the child.
    tour("grounds-east");
    var gate=document.querySelector(".gate-face");
    if(gate) gate.dispatchEvent(new MouseEvent("click",{bubbles:true}));
  } else {
    // front-door state: drop to free-explore so the gate face is lit + central.
    var vp=document.getElementById("viewport");
    vp.dispatchEvent(new WheelEvent("wheel",{deltaY:1,bubbles:true}));
    tour("grounds-east");   // frame the east grounds where the gate sits
  }
  return "staged";
})()
EVALEOF
agent-browser --session "$SESSION" wait 1200 >/dev/null
agent-browser --session "$SESSION" screenshot "$OUTDIR/preview.png" >/dev/null

echo "$OUTDIR/preview.png"
