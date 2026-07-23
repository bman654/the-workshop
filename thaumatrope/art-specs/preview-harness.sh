#!/usr/bin/env bash
# Preview harness for the Thaumatrope's forged face engravings.
#   Usage:  bash preview-harness.sh <candidate.js> <outdir> <port>
#
# The candidate JS file, when evaluated in the page, MUST define:
#   window.installThaumArt = function (A) {
#       // for a PAIR asset:
#       A.setPair('birdcage', function frontCtx(ctx){...}, function backCtx(ctx){...});
#       return 'birdcage';               // the pair key to preview (mount + fuse)
#       // ── OR ── for the PAPER/texture asset:
#       A.setPaper(function(ctx){...});
#       return 'paper';                  // preview on the bird/cage card
#   };
# where A === window.__THAUM_ART. ctx is a 360x360 canvas 2D context (parchment
# ground already available via A / the module's own paper fn). See the per-asset
# spec .md for the full art direction + registration contract.
#
# The harness loads the LIVE thaumatrope exhibit, installs the candidate, rebuilds
# the rack, mounts the target card, parks the rate rail ABOVE the fusion lock, and
# screenshots the fused composite to <outdir>/preview.png.
set -euo pipefail
CAND="$1"; OUTDIR="$2"; PORT="$3"
mkdir -p "$OUTDIR"
SESS="forge-thaum-$$-$RANDOM"
URL="http://localhost:${PORT}/thaumatrope/index.html"
B64=$(base64 < "$CAND" | tr -d '\n')

cleanup(){ agent-browser --session "$SESS" close >/dev/null 2>&1 || true; }
trap cleanup EXIT

agent-browser --session "$SESS" open "$URL" >/dev/null 2>&1
agent-browser --session "$SESS" wait --fn "!!window.__THAUM_ART" >/dev/null 2>&1

# install the candidate, rebuild the rack, mount the target card
agent-browser --session "$SESS" eval --stdin <<EOF >/dev/null 2>&1
(function(){
  var code = atob("${B64}");
  (0,eval)(code);                         // defines window.installThaumArt
  var target = window.installThaumArt(window.__THAUM_ART) || 'birdcage';
  window.__THAUM_ART.rebuild();
  var mountKey = (target==='paper') ? 'birdcage' : target;
  window.__THAUM_ART.mount(mountKey);
  return target;
})()
EOF

# park the rate rail above the fusion lock so the composite is fully fused, settle, shoot
agent-browser --session "$SESS" eval 'window.__THAUM_PERSIST.rail(0.80); "fused"' >/dev/null 2>&1
sleep 0.6
agent-browser --session "$SESS" screenshot "${OUTDIR}/preview.png" >/dev/null 2>&1
echo "preview -> ${OUTDIR}/preview.png"
