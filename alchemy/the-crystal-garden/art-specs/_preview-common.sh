#!/usr/bin/env bash
# _preview-common.sh — render a foundry CANDIDATE art module inside The Crystal
# Garden's real exhibit and screenshot a deterministically-grown jar for judging.
#
#   usage:  bash _preview-common.sh <target_module> <candidate.js> <outdir> <port>
#     target_module : "tube-material.js" or "jar-frame.js" (which slot the candidate fills)
#     candidate.js  : the forged art CODE to preview
#     outdir        : where to write preview.png
#     port          : an http port to serve on
#
# It builds into a TEMP copy (never mutates the shipped tree), forges, serves,
# plants one grain of every salt at fixed seeds, steps them to a grown state, and
# screenshots. A full jar showing all five habits is what the judge scores.
set -euo pipefail

TARGET="$1"; CAND="$2"; OUT="$3"; PORT="$4"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIECE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$PIECE/../.." && pwd)"
FORGE="$REPO/tools/forge/forge.mjs"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"; [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null || true' EXIT

cp "$PIECE/core.mjs" "$PIECE/tube-material.js" "$PIECE/jar-frame.js" "$PIECE/index.src.html" "$TMP/"
cp "$CAND" "$TMP/$TARGET"                       # swap in the candidate
node "$FORGE" "$TMP/index.src.html" >/dev/null  # forge the temp page

mkdir -p "$OUT"
( cd "$TMP" && python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV=$!
sleep 1

AB="agent-browser --session cg-foundry-$PORT"
$AB set viewport 1200 900 >/dev/null 2>&1 || true
$AB open "http://localhost:$PORT/index.html" >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
# deterministic grown jar: clear, plant one of each salt spread across x, step hard
$AB eval --stdin >/dev/null 2>&1 <<'EVAL'
(()=>{
  const G = window.__garden; const g = G.gardens(); g.length = 0;
  const salts = ['cobalt','iron','copper','nickel','manganese'];
  const J = G.JARL; const seeds=[11,22,33,44,55];
  for(let i=0;i<salts.length;i++){
    const x = J.x + J.w*(0.12 + i*0.19);
    const gd = G.plant(G.saltById(salts[i]), x, J.floorY);
    gd.rngState = seeds[i]>>>0;               // pin the seed for a reproducible preview
    for(let k=0;k<420;k++) G.step(gd);
  }
  return 'grown';
})()
EVAL
$AB wait 300 >/dev/null 2>&1
$AB screenshot "$OUT/preview.png" >/dev/null 2>&1
$AB close >/dev/null 2>&1 || true
echo "preview → $OUT/preview.png"
