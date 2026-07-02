#!/usr/bin/env bash
# Preview harness for The Unstirring's forged VISUAL assets.
#   bash preview-dye.sh <candidate.js> <outdir> <port> [mode]
#     candidate.js : the forged art module (sets window.UnstirringDye / .UnstirringGlass / .UnstirringSyrup)
#     outdir       : screenshot goes to <outdir>/preview.png
#     port         : an uncommon port to serve on (the foundry picks it)
#     mode         : dye (default) | glass | syrup — which asset this candidate is + how to pose the scene
#
# It builds a throwaway page that inlines core.mjs + the candidate, drives the scene to a pose
# that shows the asset in its best light (dye: half-wound spiral at Re≈0; glass: mid-crank so the
# caustic + fiducial are off-axis; syrup: at rest), and screenshots it via agent-browser using a
# TRUE render (real load, not dispatchEvent). Deterministic pose (no user input needed).
set -euo pipefail
CAND="${1:?candidate.js path required}"
OUTDIR="${2:?outdir required}"
PORT="${3:?port required}"
MODE="${4:-dye}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"          # the-unstirring/
REPO="$(cd "$HERE/.." && pwd)"                     # repo root
mkdir -p "$OUTDIR"
WORK="$(mktemp -d)"
SESS="unstir-forge-preview-$$"

cleanup(){
  agent-browser --session "$SESS" close >/dev/null 2>&1 || true
  # kill only the server we started on THIS exact port
  local p; p="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -n "$p" ]; then echo "$p" | while read -r x; do ps -p "$x" -o command= 2>/dev/null | grep -q "http.server $PORT" && kill "$x" 2>/dev/null || true; done; fi
  rm -rf "$WORK"
}
trap cleanup EXIT

# which window handle + pose does this candidate drive?
case "$MODE" in
  glass) HANDLE="window.UnstirringGlass"; WIND="1.15";;
  syrup) HANDLE="window.UnstirringSyrup"; WIND="0";;
  *)     HANDLE="window.UnstirringDye";   WIND="0.9";;    # half-wound spiral shows the bloom
esac

# assemble the preview page: core + candidate + a minimal scene driven to the pose.
CORE="$(cat "$HERE/core.mjs")"
CANDJS="$(cat "$CAND")"
cat > "$WORK/preview.html" <<HTMLEOF
<!doctype html><meta charset="utf-8"><title>forge preview</title>
<style>html,body{margin:0;height:100%;background:#080604;overflow:hidden}#c{display:block;width:100vw;height:100vh}</style>
<canvas id="c"></canvas>
<script>${CANDJS}</script>
<script type="module">
${CORE}
const cv=document.getElementById('c'),ctx=cv.getContext('2d');const TAU=Math.PI*2;
const DPR=Math.min(devicePixelRatio||1,2);let W=innerWidth,H=innerHeight;
cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);
const cx=W/2,cy=H/2,rad=Math.min(W,H)*0.42,S=rad/B_OUT,Rout=B_OUT*S,Rin=A_IN*S;
// seed a blob and wind it to the pose so the asset shows its work
let P=[];const rc=0.72,R=0.12,N=2600;
for(let i=0;i<N;i++){const a=Math.random()*TAU,r0=R*Math.sqrt(Math.random());
  let x=rc*Math.cos(-Math.PI/2)+r0*Math.cos(a),y=rc*Math.sin(-Math.PI/2)+r0*Math.sin(a);
  let r=Math.hypot(x,y),th=Math.atan2(y,x);if(r<A_IN+0.01)r=A_IN+0.01;if(r>B_OUT-0.01)r=B_OUT-0.01;
  P.push({r,th,r0:r,th0:th,seed:Math.random()});}
const WIND=${WIND};for(const p of P)advect(p,WIND,0);
const view={cx,cy,S,Rin,Rout,W,H};
const env={wind:WIND,windAbs:Math.abs(WIND),Re:0,density:Math.min(1,Math.abs(WIND)/6),dragging:false,spin:0,t:1.2};
// fallbacks (used if this candidate doesn't set the given handle — so a preview never blanks)
const Syrup=(${HANDLE==='window.UnstirringSyrup'?'window.UnstirringSyrup':'window.UnstirringSyrup'})||{paint(c,v){const g=c.createRadialGradient(v.cx,v.cy,v.Rin*0.4,v.cx,v.cy,v.Rout*1.1);g.addColorStop(0,'#191308');g.addColorStop(1,'#080604');c.fillStyle='#080604';c.fillRect(0,0,v.W,v.H);c.fillStyle=g;c.beginPath();c.arc(v.cx,v.cy,v.Rout*1.1,0,TAU);c.fill();}};
const Dye=window.UnstirringDye||{draw(c,pts,v){c.globalCompositeOperation='lighter';for(const p of pts){const x=v.cx+p.r*Math.cos(p.th)*v.S,y=v.cy+p.r*Math.sin(p.th)*v.S;c.fillStyle='hsla(42,88%,60%,0.5)';c.fillRect(x-1.4,y-1.4,2.8,2.8);}c.globalCompositeOperation='source-over';}};
const Glass=window.UnstirringGlass||{drawGlass(c,v,e){c.strokeStyle='rgba(232,182,76,.28)';c.lineWidth=1.5;c.beginPath();c.arc(v.cx,v.cy,v.Rout,0,TAU);c.stroke();c.beginPath();c.arc(v.cx,v.cy,v.Rin,0,TAU);c.fillStyle='#241a0e';c.fill();c.save();c.translate(v.cx,v.cy);c.rotate(e.wind*TAU);c.strokeStyle='#e8b64c';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(v.Rin*0.78,0);c.stroke();c.restore();}};
Syrup.paint(ctx,view,env);Dye.draw(ctx,P,view,env);Glass.drawGlass(ctx,view,env);
window.__ready=true;
</script>
HTMLEOF

# serve the temp dir on the given port
( cd "$WORK" && python3 -m http.server "$PORT" >/dev/null 2>&1 & )
sleep 1
agent-browser --session "$SESS" open "http://localhost:$PORT/preview.html" >/dev/null 2>&1
agent-browser --session "$SESS" wait --fn "window.__ready===true" >/dev/null 2>&1 || sleep 1
sleep 0.5
agent-browser --session "$SESS" screenshot "$OUTDIR/preview.png" >/dev/null 2>&1
echo "wrote $OUTDIR/preview.png (mode=$MODE, wind=$WIND)"
