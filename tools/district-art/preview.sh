#!/usr/bin/env bash
# ── district-art foundry PREVIEW HARNESS (§5.3, T3.2) ────────────────────────────
# The visual-exhibit medium (art-foundry/engine-core.mjs MEDIA['visual-exhibit']) renders a
# candidate via:  bash <previewHarness> <candidate> <outdir> <port>  — and each asset's
# previewHarness is `tools/district-art/preview.sh <district>`, so this script receives:
#
#   preview.sh <district> <candidate> <outdir> <port>
#
#     <district>   the district id to crop (e.g. works) — pins the ?rep=<district> deep-link.
#     <candidate>  a district-art.js candidate module to swap in ('-' or empty = the live tree).
#     <outdir>     where the PNGs are written (the engine reads $outdir/preview.png).
#     <port>       the http port to serve on.
#
# It forges index.html into an isolated scratch tree with the candidate district-art.js swapped
# in at tools/district-art/district-art.js, serves it, and screenshots TWO stills:
#   · estate-fit.png — the estate plate at FIT view (all district structures, the §5.1 read).
#   · preview.png    — the district CROP (the ?rep=<district> camera deep-link frames that ONE
#                      structure centred, held at the estate tier) — the judge's money shot.
# Always tears the server down. Echoes the PNG paths it produced.
#
# SRC_ROOT (the source worktree) defaults to this script's repo root; override with $SRC_ROOT.
set -euo pipefail

DISTRICT="${1:-works}"
CANDIDATE="${2:--}"
OUTDIR="${3:-}"
PORT="${4:-8099}"

# repo root = two levels up from tools/district-art/preview.sh, unless SRC_ROOT overrides.
_self="$(cd "$(dirname "$0")" && pwd)"
SRC_ROOT="${SRC_ROOT:-$(cd "$_self/../.." && pwd)}"
SCRATCH="${PREVIEW_SCRATCH:-$(mktemp -d)}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if [ -z "$OUTDIR" ]; then echo "preview.sh: need <outdir> (arg 3)" >&2; exit 2; fi
mkdir -p "$OUTDIR" "$SCRATCH"

# Minimal renderable set: index.src.html + tools/ + the-fairground-gate/ (forge inlines them).
rsync -a --delete --exclude '.git' "$SRC_ROOT/tools/" "$SCRATCH/tools/"
rsync -a --delete --exclude '.git' "$SRC_ROOT/the-fairground-gate/" "$SCRATCH/the-fairground-gate/"
cp "$SRC_ROOT/index.src.html" "$SCRATCH/index.src.html"

if [ "$CANDIDATE" != "-" ] && [ -n "$CANDIDATE" ]; then
  cp "$CANDIDATE" "$SCRATCH/tools/district-art/district-art.js"
fi

cd "$SCRATCH"
node tools/forge/forge.mjs index.src.html >/dev/null

# Serve, with teardown trap.
SRV_PID=""
cleanup() { [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null || true; }
trap cleanup EXIT
nohup python3 -m http.server "$PORT" --directory "$SCRATCH" >/dev/null 2>&1 &
SRV_PID=$!

# Wait for readiness (max ~6s).
for _ in $(seq 1 60); do
  if curl -fsS "http://localhost:${PORT}/index.html" -o /dev/null 2>/dev/null; then break; fi
  sleep 0.1
done

TIMEOUT="$(command -v gtimeout || command -v timeout || true)"
shoot() {  # shoot <name> <query-string>
  local name="$1" qs="$2"
  local out="$OUTDIR/$name.png"
  local prof; prof="$(mktemp -d)"
  ${TIMEOUT:+$TIMEOUT 45} "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=1 --user-data-dir="$prof" --timeout=25000 \
    --window-size=1600,1600 --virtual-time-budget=6000 \
    --screenshot="$out" "http://localhost:${PORT}/index.html${qs}" >/dev/null 2>&1 || true
  rm -rf "$prof"
  [ -s "$out" ] && echo "$out" || { echo "FAIL $out" >&2; return 1; }
}

shoot estate-fit ""
shoot preview "?rep=${DISTRICT}"

cleanup; trap - EXIT
