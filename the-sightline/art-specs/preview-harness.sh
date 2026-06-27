#!/usr/bin/env bash
# Preview harness for The Sightline's VISUAL foundry assets (slab-material,
# constellation-figure). The forged candidate is a JS snippet that DEFINES the live
# draw function (drawSlab / drawFigureOverlay). Because the page's draw loop calls the
# GLOBAL function, we render a candidate by appending it as a trailing <script> that
# REASSIGNS that global, then drive the camera to a representative mid-reveal and shot.
#
# Usage:  bash the-sightline/art-specs/preview-harness.sh <candidate.js> <outdir> <port>
# Writes: <outdir>/preview.png
#
# The candidate may reassign the global itself (window.drawSlab = …) OR just define
# `function drawSlab(…){…}` / `function drawFigureOverlay(…){…}` — the harness appends a
# `window.NAME = NAME;` if the candidate didn't, and auto-detects which function it is.
set -u
CAND="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")/.." && pwd)"           # the-sightline/
ROOT="$(cd "$HERE/.." && pwd)"                       # repo root
SESS="sl-foundry-preview-$PORT"
mkdir -p "$OUTDIR"

# 1) ensure the page is freshly built from source
node "$ROOT/tools/forge/forge.mjs" "$HERE/index.src.html" >/dev/null 2>&1

# 2) build the preview page = index.html + a trailing override <script>; pick the
#    representative reveal fraction by which function the candidate defines.
PREV="$HERE/_preview.html"
python3 - "$HERE/index.html" "$CAND" "$PREV" <<'PY'
import sys
page_p, cand_p, out_p = sys.argv[1], sys.argv[2], sys.argv[3]
page = open(page_p, encoding='utf-8').read()
body = open(cand_p, encoding='utf-8').read()
fn = 'drawFigureOverlay' if 'drawFigureOverlay' in body else 'drawSlab'
if ('window.'+fn) not in body:
    body = body + '\ntry{ window.'+fn+' = '+fn+'; }catch(e){}\n'
# stash the reveal fraction for the shell to read
open(out_p+'.fn','w').write(fn)
script = '<script>/*foundry-candidate*/\n' + body + '\n</script>\n'
assert '</body>' in page, 'no </body> in index.html'
open(out_p,'w',encoding='utf-8').write(page.replace('</body>', script+'</body>', 1))
print('built _preview.html overriding', fn)
PY
FN="$(cat "$PREV.fn" 2>/dev/null || echo drawSlab)"; rm -f "$PREV.fn"
TFRAC="0.62"; [ "$FN" = "drawFigureOverlay" ] && TFRAC="0.92"

# 3) serve the-sightline/ on the given port (its own server; torn down by PID below)
python3 -m http.server "$PORT" --directory "$HERE" >/dev/null 2>&1 &
SRV=$!
sleep 1

# 4) render + screenshot
URL="http://localhost:$PORT/_preview.html"
agent-browser --session "$SESS" open "$URL" >/dev/null 2>&1
agent-browser --session "$SESS" wait --load networkidle >/dev/null 2>&1
agent-browser --session "$SESS" eval "window.__sightline.previewState($TFRAC); 'ok'" >/dev/null 2>&1
agent-browser --session "$SESS" wait 400 >/dev/null 2>&1
agent-browser --session "$SESS" screenshot "$OUTDIR/preview.png" >/dev/null 2>&1

# 5) teardown (only our own server + session)
agent-browser --session "$SESS" close >/dev/null 2>&1
kill "$SRV" >/dev/null 2>&1
rm -f "$PREV"
[ -f "$OUTDIR/preview.png" ] && echo "preview.png written ($FN)" || echo "FAILED to render $FN"
