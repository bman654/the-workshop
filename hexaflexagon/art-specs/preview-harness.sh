#!/usr/bin/env bash
# Preview harness for the Hexaflexagon's forged face scenes.
#   Usage:  bash preview-harness.sh <candidate.js> <outdir> <port>
#
# The candidate JS file, when evaluated in the page, MUST define:
#   window.installHexaArt = function (A) {
#       A.setScene('eclipse', function drawEclipse(ctx){ /* paints one S×S face */ });
#       return 'eclipse';                 // the face key to preview (day|night|eclipse)
#   };
# where A === window.__HEXA_ART. ctx is an HexaFaces.S × HexaFaces.S canvas 2D
# context; paint ONE hexagon-centred scene (see the per-face spec .md for the art
# direction, the hexagon geometry, and the registration contract).
#
# The harness loads the LIVE hexaflexagon exhibit, installs the candidate, rebuilds
# the pre-rendered offscreen scenes, shows that face FLAT (p=0, the whole hexagon
# image), settles, and screenshots the flat face to <outdir>/preview.png.
set -euo pipefail
CAND="$1"; OUTDIR="$2"; PORT="$3"
mkdir -p "$OUTDIR"
SESS="forge-hexa-$$-$RANDOM"
URL="http://localhost:${PORT}/hexaflexagon/index.html"
B64=$(base64 < "$CAND" | tr -d '\n')

cleanup(){ agent-browser --session "$SESS" close >/dev/null 2>&1 || true; }
trap cleanup EXIT

agent-browser --session "$SESS" set viewport 900 900 >/dev/null 2>&1
agent-browser --session "$SESS" open "$URL" >/dev/null 2>&1
agent-browser --session "$SESS" wait --fn "!!window.__HEXA_ART" >/dev/null 2>&1

# install the candidate, rebuild the scenes, show the target face flat
agent-browser --session "$SESS" eval --stdin <<EOF >/dev/null 2>&1
(function(){
  var code = atob("${B64}");
  (0,eval)(code);                              // defines window.installHexaArt
  var key = window.installHexaArt(window.__HEXA_ART) || 'eclipse';
  window.__HEXA_ART.rebuild();
  window.__HEXA_ART.showFace(key);
  return key;
})()
EOF

sleep 0.5
agent-browser --session "$SESS" screenshot "${OUTDIR}/preview.png" >/dev/null 2>&1
echo "preview -> ${OUTDIR}/preview.png"
