#!/usr/bin/env bash
# Preview harness for The Barrel House's VISUAL foundry assets (cylinder, comb,
# stud, crank, loupe). Each forged candidate is a JS snippet that INSTALLS its draw
# function on window.__barrelArt.<name> (the foundry hook the Pin-Barrel page
# consults each frame before its placeholder). The harness appends the candidate as
# a trailing <script>, drives the drum to a representative state (a few cranks +
# loupe on), and screenshots the exhibit.
#
# Usage:  bash the-barrel-house/art-specs/preview-harness.sh <candidate.js> <outdir> <port>
# Writes: <outdir>/preview.png
#
# The candidate defines ONE of: drawCylinder / drawComb / drawStud / drawCrank /
# drawLoupe — see each asset's spec for the exact signature. It should assign
# window.__barrelArt.<name> = function(...){...}; the harness also auto-wraps a bare
# `function drawX(...){}` by appending `window.__barrelArt.drawX = drawX;`.
set -u
CAND="$1"; OUTDIR="$2"; PORT="$3"
HERE="$(cd "$(dirname "$0")/.." && pwd)"            # the-barrel-house/
ROOT="$(cd "$HERE/.." && pwd)"                        # repo root
SESS="bh-foundry-preview-$PORT"
mkdir -p "$OUTDIR"

# 1) freshly build the Pin-Barrel page from source
node "$ROOT/tools/forge/forge.mjs" "$HERE/pin-barrel/index.src.html" >/dev/null 2>&1

# 2) build the preview page = pin-barrel/index.html + a trailing install <script>
PREV="$HERE/pin-barrel/_preview.html"
python3 - "$HERE/pin-barrel/index.html" "$CAND" "$PREV" <<'PY'
import sys, re
page_p, cand_p, out_p = sys.argv[1], sys.argv[2], sys.argv[3]
page = open(page_p, encoding='utf-8').read()
body = open(cand_p, encoding='utf-8').read()
# detect which draw fn the candidate defines (for the bare-function auto-wrap)
m = re.search(r'function\s+(drawCylinder|drawComb|drawStud|drawCrank|drawLoupe)\b', body)
if m:
    fn = m.group(1)
    if ('__barrelArt.'+fn) not in body:
        body = body + '\ntry{ window.__barrelArt = window.__barrelArt || {}; window.__barrelArt.'+fn+' = '+fn+'; }catch(e){}\n'
script = '<script>/*foundry-candidate*/\n' + body + '\n</script>\n'
assert '</body>' in page, 'no </body> in pin-barrel/index.html'
open(out_p, 'w', encoding='utf-8').write(page.replace('</body>', script+'</body>', 1))
print('built _preview.html')
PY

# 3) serve the-barrel-house/ on the given port (its own server; torn down by PID)
python3 -m http.server "$PORT" --directory "$HERE" >/dev/null 2>&1 &
SRV=$!
sleep 1

# 4) render: open, drive a few cranks + turn the loupe on (so cylinder/comb/stud/
#    crank/loupe all show in a representative played state), then screenshot.
URL="http://localhost:$PORT/pin-barrel/_preview.html"
agent-browser --session "$SESS" open "$URL" >/dev/null 2>&1
agent-browser --session "$SESS" wait --load networkidle >/dev/null 2>&1
agent-browser --session "$SESS" eval "(function(){ try{ document.getElementById('loupebtn').click(); }catch(e){}; var cv=document.getElementById('barrel'); for(var i=0;i<10;i++) cv.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true})); return 'ok'; })()" >/dev/null 2>&1
agent-browser --session "$SESS" wait 500 >/dev/null 2>&1
agent-browser --session "$SESS" screenshot "$OUTDIR/preview.png" >/dev/null 2>&1

# 5) teardown (only our own server + session)
agent-browser --session "$SESS" close >/dev/null 2>&1
kill "$SRV" >/dev/null 2>&1
rm -f "$PREV"
[ -f "$OUTDIR/preview.png" ] && echo "preview.png written" || echo "FAILED to render"
