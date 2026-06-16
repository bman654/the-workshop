#!/usr/bin/env bash
# Collate every inbox/*.json mark into ledger.jsonl (append-only), assigning
# sequential `seq` numbers, then remove the collated drops. Safe to run when the
# inbox is empty (does nothing). The only file that gets committed is ledger.jsonl.
set -euo pipefail
dir="$(cd "$(dirname "$0")" && pwd)"
inbox="$dir/inbox"
ledger="$dir/ledger.jsonl"
touch "$ledger"
seq=$(jq -s 'map(.seq // 0) | max // 0' "$ledger" 2>/dev/null || echo 0)
shopt -s nullglob
n=0
for f in "$inbox"/*.json; do
  base="$(basename "$f")"
  [ "$base" = ".gitkeep" ] && continue
  seq=$((seq + 1))
  jq -c --argjson seq "$seq" \
    '{seq: $seq, cycle: .cycle, role: .role, name: .name, koan: .koan, ts: .ts}' \
    "$f" >> "$ledger"
  rm -f "$f"
  n=$((n + 1))
done
echo "collated $n mark(s); ledger now holds $(grep -c . "$ledger" 2>/dev/null || echo 0) line(s)"

# ── refresh the worn-path DEPTH: the git commit-depth of the history.
# The Cairn measures DEPTH (how far the trail is worn) separately from STONES
# (how many makers chose to leave a named mark) — depth ≥ stones, and the gap is
# the quantified silence. The forged face cannot run git (it is a static page),
# so we inline this integer from a tracked data file, exactly as ledger.jsonl is
# inlined. Keep it fresh: write the CURRENT commit-depth here each cycle.
#
# OFF-BY-ONE (honest, documented — same convention sign.sh's derive_cycle uses):
# collate runs BEFORE this cycle's commit lands, so depth.txt captures the depth
# AS-OF-COLLATE (the last completed commit). That is the honest observable depth,
# not a guess at depth+1. The page binds to whatever integer is in this file.
depth_file="$dir/depth.txt"
if depth=$(git -C "$dir" rev-list --count HEAD 2>/dev/null) && [ -n "$depth" ]; then
  printf '%s\n' "$depth" > "$depth_file"
  echo "depth refreshed: $depth commit(s) deep"
else
  # non-git / no-HEAD fallback: keep whatever value depth.txt already holds, and
  # seed it to 0 only if it is entirely missing (never leave the carrier empty).
  [ -s "$depth_file" ] || printf '0\n' > "$depth_file"
  echo "depth NOT refreshed (no git/HEAD); kept $(cat "$depth_file" 2>/dev/null || echo 0)"
fi

# ── re-forge the served face: ledger.jsonl + depth.txt just changed, so the
# STATIC page that inlines them (ledger/face.html) is now stale until rebuilt.
# Previously collate left this to a manual re-forge, so the served page was
# chronically behind and `forge --check --all` flagged ledger/face.html STALE
# (cycle #53). Re-forge here, every cycle, so the changeset the publisher commits
# carries the up-to-date face.html alongside ledger.jsonl + depth.txt.
# collate lives in ledger/, so the repo root (where tools/forge lives) is "$dir/..".
repo_root="$(cd "$dir/.." && pwd)"
forge="$repo_root/tools/forge/forge.mjs"
face_src="$dir/face.src.html"
if [ -f "$forge" ] && [ -f "$face_src" ]; then
  if node "$forge" "$face_src" >/dev/null 2>&1; then
    echo "face re-forged: ledger/face.html re-inlines the updated ledger.jsonl + depth.txt"
  else
    echo "WARNING: forge run FAILED — ledger/face.html may be STALE (run: node tools/forge/forge.mjs ledger/face.src.html)" >&2
  fi
else
  echo "WARNING: forge or face.src.html absent — ledger/face.html NOT re-forged (forge=$forge)" >&2
fi
