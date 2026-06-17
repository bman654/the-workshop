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

# ── STAMP THE CYCLE HERE — collate is the only honest place to do it. ──
# A stone's `cycle` is the git commit-DEPTH of the commit it lives in. sign.sh runs
# per-maker, at scattered moments during a cycle, so it CANNOT know that depth: if
# HEAD moves mid-cycle (any external commit — a human's push, a PR merge, a sibling
# fix) the makers split across depths and the record stops being monotonic. collate
# runs ONCE, at cycle end, just before the single commit that seals every one of this
# cycle's stones — so it alone knows their shared depth: rev-list(HEAD)+1, the depth
# of that upcoming commit. We stamp that ONE value onto every stone folded here, so
# co-committed makers always share their commit's depth. (In a non-git sandbox the
# depth is unknowable, so we keep whatever .cycle the drop carried — the hermetic
# self-test path.) This supersedes sign.sh's provisional sign-time estimate.
stamp_depth=""
if _hd=$(git -C "$dir" rev-list --count HEAD 2>/dev/null) && [ -n "$_hd" ]; then
  stamp_depth=$((_hd + 1))
fi

shopt -s nullglob
n=0
for f in "$inbox"/*.json; do
  base="$(basename "$f")"
  [ "$base" = ".gitkeep" ] && continue
  seq=$((seq + 1))
  if [ -n "$stamp_depth" ]; then
    jq -c --argjson seq "$seq" --argjson cyc "$stamp_depth" \
      '{seq: $seq, cycle: $cyc, role: .role, name: .name, koan: .koan, ts: .ts}' \
      "$f" >> "$ledger"
  else
    jq -c --argjson seq "$seq" \
      '{seq: $seq, cycle: .cycle, role: .role, name: .name, koan: .koan, ts: .ts}' \
      "$f" >> "$ledger"
  fi
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

# ── re-pin + re-forge the TABULARIUM: it is the estate's OTHER data-bound room,
# binding the SAME ledger.jsonl. Before this (bug #88) its core logic + 407-mark
# carrier were hand-copied, so every collate silently staleness-rotted the room
# until a publisher re-pinned CLAIM + re-inlined the carrier by hand (#61/#66/#70/#87).
# Now it has a forge source (tabularium/index.src.html) that includes core.mjs +
# ../ledger/ledger.jsonl, exactly like the Cairn face. Two steps, in order:
#   1. RE-PIN the shape-guard: rewrite core.mjs's `const CLAIM = {...}` from the
#      freshly-collated ledger (via tabularium/reclaim.mjs, which uses the SAME
#      parse+recompute the page and Node twin trust). The page pins its pill to
#      recompute(its own carrier), so it is always self-consistent; CLAIM stays
#      the Node twin's loud "file changed shape" guard, kept current here.
#   2. RE-FORGE the page so it re-inlines the updated core.mjs + ledger.jsonl.
# Order matters: re-pin core.mjs BEFORE forging, so the forged page carries the
# updated CLAIM line too.
reclaim="$dir/../tabularium/reclaim.mjs"
tab_src="$dir/../tabularium/index.src.html"
if [ -f "$reclaim" ]; then
  if node "$reclaim"; then
    :
  else
    echo "WARNING: reclaim FAILED — tabularium/core.mjs CLAIM may be STALE (run: node tabularium/reclaim.mjs)" >&2
  fi
else
  echo "WARNING: tabularium/reclaim.mjs absent — CLAIM NOT re-pinned" >&2
fi
if [ -f "$forge" ] && [ -f "$tab_src" ]; then
  if node "$forge" "$tab_src" >/dev/null 2>&1; then
    echo "tabularium re-forged: tabularium/index.html re-inlines the updated core.mjs + ledger.jsonl"
  else
    echo "WARNING: forge run FAILED — tabularium/index.html may be STALE (run: node tools/forge/forge.mjs tabularium/index.src.html)" >&2
  fi
else
  echo "WARNING: forge or tabularium/index.src.html absent — tabularium/index.html NOT re-forged" >&2
fi
