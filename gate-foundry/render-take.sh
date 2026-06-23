#!/usr/bin/env bash
# Foundry render helper — render a candidate asset module in full scene context.
#
#   render-take.sh <scratch_dir> <module_relpath> <candidate_path|-> <port> <out_dir>
#
# Builds an isolated copy of the gate's renderable file set (the-gate/ + tools/)
# under <scratch_dir>, swaps the candidate module in at <module_relpath> (unless
# candidate is "-"), forges the self-contained html, serves it on <port>, and
# screenshots a standard set (idle-night, idle-day, open-night) into <out_dir>.
# Always tears the server down. Echoes the PNG paths it produced.
#
# Source of truth for the worktree is GATE_SRC (default /tmp/gate-worktree).
set -euo pipefail

SCRATCH="$1"; MODULE="$2"; CANDIDATE="$3"; PORT="$4"; OUTDIR="$5"
GATE_SRC="${GATE_SRC:-/tmp/gate-worktree}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$SCRATCH" "$OUTDIR"
# Minimal renderable set: the-gate/ + tools/ (forge inlines ../tools/{ws,sky,hours}).
rsync -a --delete --exclude '.git' "$GATE_SRC/the-gate/" "$SCRATCH/the-gate/"
rsync -a --delete --exclude '.git' "$GATE_SRC/tools/"    "$SCRATCH/tools/"

if [ "$CANDIDATE" != "-" ]; then
  cp "$CANDIDATE" "$SCRATCH/$MODULE"
fi

cd "$SCRATCH"
node tools/forge/forge.mjs the-gate/the-gate.src.html >/dev/null

# Serve, with teardown trap.
SRV_PID=""
cleanup() { [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null || true; }
trap cleanup EXIT
nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!

# Wait for readiness (max ~5s).
for _ in $(seq 1 50); do
  if curl -fsS "http://localhost:${PORT}/the-gate/the-gate.html" -o /dev/null 2>/dev/null; then break; fi
  sleep 0.1
done

TIMEOUT="$(command -v gtimeout || command -v timeout || true)"
shoot() {  # shoot <name> <query>
  local name="$1"
  local q="$2"
  local out="$OUTDIR/$name.png"
  local prof
  prof="$(mktemp -d)"
  ${TIMEOUT:+$TIMEOUT 30} "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=1 --user-data-dir="$prof" --timeout=20000 \
    --window-size=1600,900 --virtual-time-budget=4500 \
    --screenshot="$out" "http://localhost:${PORT}/the-gate/the-gate.html?${q}" >/dev/null 2>&1 || true
  rm -rf "$prof"
  [ -s "$out" ] && echo "$out" || { echo "FAIL $out" >&2; return 1; }
}

# Optional 6th arg: extra query params appended to every shot (e.g. "room=physics-lab").
EXTRA="${6:-}"
QS_SUFFIX=""
[ -n "$EXTRA" ] && QS_SUFFIX="&$EXTRA"
shoot idle-night "dev&scene=idle&t=night&wx=clear&moon=0.55&undercroft=1${QS_SUFFIX}"
shoot idle-day   "dev&scene=idle&t=day&wx=clear&undercroft=1${QS_SUFFIX}"
shoot open-night "dev&scene=open&t=night&wx=clear&moon=0.55&undercroft=1${QS_SUFFIX}"

cleanup; trap - EXIT
