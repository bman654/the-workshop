#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  THE TEN-FOLD GLASS — foundry preview harness.
#
#    bash render-take.sh <candidate.js> <outdir> <port>
#    bash render-take.sh -             <outdir> <port>      # the LIVE tree
#
#  Loads the candidate art module into the room's own preview bench, serves the
#  repo, and screenshots <outdir>/preview.png.
#
#  It works out for itself what the candidate IS: a file containing `RigArt.`
#  is judged as the brass rig; otherwise the plate key is read straight out of
#  the candidate's own `PlateArt.<key> =` line, so ONE harness serves every
#  visual asset in the batch.
#
#  `-` in place of a candidate renders the LIVE tree instead — nothing is
#  staged over plates.js / rig.js, so what you see is what ships. The foundry
#  lays its work out at /tmp/art-foundry/<key>/…, so the key comes from the
#  outdir; it is then checked against the live plates.js and fails loudly if
#  that plate does not actually exist there.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CAND="${1:?usage: render-take.sh <candidate.js> <outdir> <port>}"
OUT="${2:?missing outdir}"
PORT="${3:?missing port}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
mkdir -p "$OUT"

# stage the candidate somewhere the server can reach it. An EMPTY stage is what
# renders the live tree: the bench loads plates.js / rig.js first and the stage
# then overrides nothing.
STAGE="$HERE/_take-$PORT.js"
cleanup(){ rm -f "$STAGE"; [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null || true; }
trap cleanup EXIT

if [ "$CAND" = "-" ]; then
  : > "$STAGE"
  KEY="$(basename "$(dirname "${OUT%/}")")"
  case "$KEY" in
    ''|.|/|tmp|art-foundry)
      echo "render-take: '-' needs an outdir of the form /tmp/art-foundry/<key>/<sub>" >&2; exit 1;;
  esac
  grep -qE "PlateArt\.$KEY[[:space:]]*=" "$ROOT/ten-fold/plates.js" || {
    echo "render-take: live plates.js has no PlateArt.$KEY (inferred from $OUT)" >&2; exit 1; }
  QUERY="mode=plate&key=$KEY&cand=_take-$PORT.js"
elif grep -q 'RigArt\.' "$CAND"; then
  cp "$CAND" "$STAGE"
  QUERY="mode=rig&cand=_take-$PORT.js"
else
  cp "$CAND" "$STAGE"
  KEY="$(grep -oE 'PlateArt\.[A-Za-z0-9_]+[[:space:]]*=' "$STAGE" | head -1 | sed -E 's/PlateArt\.([A-Za-z0-9_]+).*/\1/')"
  [ -n "$KEY" ] || { echo "render-take: cannot find PlateArt.<key> in $CAND" >&2; exit 1; }
  QUERY="mode=plate&key=$KEY&cand=_take-$PORT.js"
fi

( cd "$ROOT" && python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV=$!
sleep 1.2

SESSION="tenfold-take-$PORT"
URL="http://127.0.0.1:$PORT/ten-fold/art-specs/preview.html?$QUERY"
agent-browser --session "$SESSION" set viewport 1200 760 >/dev/null
agent-browser --session "$SESSION" open "$URL"    >/dev/null
agent-browser --session "$SESSION" wait 1200      >/dev/null
agent-browser --session "$SESSION" screenshot "$OUT/preview.png" >/dev/null
agent-browser --session "$SESSION" close          >/dev/null 2>&1 || true

echo "render-take: $OUT/preview.png"
