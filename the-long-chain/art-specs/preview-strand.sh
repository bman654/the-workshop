#!/usr/bin/env bash
# Preview harness for the `strand` visual asset (The Long Chain).
#   usage: bash preview-strand.sh <candidate.js> <outdir> <port>
# Loads the candidate LongChainStrand module into a minimal SVG board showing a 4-coin
# LONG chain (bright) beside a 2-coin SHORT chain (dim), serves it, screenshots preview.png.
set -euo pipefail
CAND="${1:?candidate.js path}"
OUT="${2:?outdir}"
PORT="${3:?port}"
mkdir -p "$OUT"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$CAND" "$WORK/strand-art.js"

cat > "$WORK/index.html" <<'HTML'
<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:#0d0b12;height:100%;}
  svg{display:block;margin:24px auto;background:linear-gradient(160deg,#15121b,#0d0b12);
    border:1px solid rgba(201,162,74,.22);border-radius:14px;}
</style></head><body>
  <svg id="board" width="520" height="300" viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg"></svg>
  <script src="./strand-art.js"></script>
  <script>
    var svg=document.getElementById('board');
    var SVGNS='http://www.w3.org/2000/svg';
    function g(){ var e=document.createElementNS(SVGNS,'g'); svg.appendChild(e); return e; }
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // LONG chain: 4 coins across the top
    var longPts=[{x:90,y:110},{x:190,y:110},{x:290,y:110},{x:390,y:110}];
    // SHORT chain: 2 coins lower-right
    var shortPts=[{x:300,y:220},{x:400,y:220}];
    if(window.LongChainStrand){
      LongChainStrand.drawChain(g(), longPts, {long:true, reduced:reduced, scale:100});
      LongChainStrand.drawChain(g(), shortPts, {long:false, reduced:reduced, scale:100});
      window.__ok=true;
    } else { window.__ok=false; }
  </script>
</body></html>
HTML

( cd "$WORK" && python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 & echo $! > "$WORK/srv.pid" )
SRV_PID="$(cat "$WORK/srv.pid")"
trap 'kill "$SRV_PID" 2>/dev/null || true; rm -rf "$WORK"' EXIT
sleep 1
agent-browser --session "strandprev$PORT" open "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1
agent-browser --session "strandprev$PORT" wait --load networkidle >/dev/null 2>&1
agent-browser --session "strandprev$PORT" wait 700 >/dev/null 2>&1
agent-browser --session "strandprev$PORT" screenshot "$OUT/preview.png" >/dev/null 2>&1
agent-browser --session "strandprev$PORT" close >/dev/null 2>&1 || true
echo "preview at $OUT/preview.png"
