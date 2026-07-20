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

# ════════════════════════════════════════════════════════════════════════════
# RE-PIN, THEN RE-FORGE — by CONVENTION, never by room NAME.
# ────────────────────────────────────────────────────────────────────────────
# ledger.jsonl + depth.txt just changed, so EVERY static page that inlines them
# (ledger/face.html, plus every ledger-bound room: the Tabularium, the Census, …)
# is now stale until rebuilt. We do this with ZERO per-room-by-name knowledge so
# a future ledger-bound room enrolls simply by dropping in its own files — no edit
# to this script (see "Ledger-bound rooms enroll in auto-maintenance" in
# ledger/README.md). This is the landmine that froze the Tabularium's count until
# #61/#66/#70/#87 and would have frozen the Census the first cycle a publisher
# forgot to hand-re-pin it (#153/#154).
#
# Two phases, IN ORDER:
#   1. RE-PIN every ledger-bound room's shape-guard. A room that pins a recomputed
#      CLAIM from the ledger ships a `<room>/reclaim.mjs` that re-derives that CLAIM
#      from the room's OWN core (tabularium/reclaim.mjs, census/reclaim.mjs, …). We
#      DISCOVER and run every such hook by convention: every `*/reclaim.mjs` in the
#      repo root's immediate child dirs. A room enrolls just by adding the file.
#   2. RE-FORGE all pages generically with `forge --all` — forge auto-discovers
#      every *.src.html recursively, so this rebuilds ledger/face.html AND every
#      room's index.html (re-inlining its freshly re-pinned core.mjs + ledger.jsonl)
#      in one call. Re-pinning happens BEFORE forging so each forged page carries
#      its updated CLAIM line.
# Graceful degradation is preserved: a missing/failed reclaim or a failed forge
# SHOUTS a WARNING (so silent rot is impossible) but does not abort the collate.
# collate lives in ledger/, so the repo root (where tools/forge lives) is "$dir/..".
repo_root="$(cd "$dir/.." && pwd)"
forge="$repo_root/tools/forge/forge.mjs"

# ── PHASE 0: re-derive the ESTATE MANIFEST before any reclaim hook runs. The
# card catalog's reclaim (PHASE 1) joins each room's exhibits FROM the committed
# manifest, and the manifest itself (§6.4) auto-discovers every sub-bench page on
# disk — so a page added during this cycle enrolls in the catalog at seal time
# only if the manifest is re-derived FIRST. Ordering matters: manifest → reclaim
# hooks → forge. Same graceful degradation as the phases below: a failure SHOUTS
# (and the estate gate `forge --check --all` stays red until fixed) but does not
# abort the collate.
manifest_tool="$repo_root/tools/manifest/manifest.mjs"
if [ -f "$manifest_tool" ]; then
  if node "$manifest_tool" >/dev/null; then
    echo "manifest: re-derived (estate-manifest.json + estate-tallies.json current)"
  else
    echo "WARNING: estate manifest re-derivation FAILED — the catalog may be missing pages (run: node tools/manifest/manifest.mjs)" >&2
  fi
else
  echo "WARNING: manifest tool absent — estate manifest NOT re-derived (manifest=$manifest_tool)" >&2
fi

# ── PHASE 1: discover + run every ledger-bound room's reclaim hook by convention.
# Scan the repo root's immediate child dirs for a reclaim.mjs, skipping the VCS /
# deps dirs. No room is named here; enrollment is "ship a reclaim.mjs".
shopt -s nullglob
reclaim_hooks=()
for d in "$repo_root"/*/; do
  base="$(basename "$d")"
  case "$base" in
    .git|node_modules) continue ;;
  esac
  [ -f "$d/reclaim.mjs" ] && reclaim_hooks+=("$d/reclaim.mjs")
done
if [ "${#reclaim_hooks[@]}" -eq 0 ]; then
  echo "re-pin: no */reclaim.mjs hooks discovered (no ledger-bound rooms enrolled)"
else
  for hook in "${reclaim_hooks[@]}"; do
    room="$(basename "$(dirname "$hook")")"
    if node "$hook"; then
      :  # the hook prints its own "re-pinned"/"already current" line
    else
      echo "WARNING: reclaim FAILED for room '$room' — $room/core.mjs CLAIM may be STALE (run: node $room/reclaim.mjs)" >&2
    fi
  done
  echo "re-pin: ran ${#reclaim_hooks[@]} reclaim hook(s) by convention"
fi

# ── PHASE 2: re-forge ALL pages generically (forge --all auto-discovers every
# *.src.html), so ledger/face.html AND every ledger-bound room's index.html are
# rebuilt from the just-re-pinned cores + the freshly-collated ledger in one pass.
if [ -f "$forge" ]; then
  if node "$forge" --all "$repo_root" >/dev/null 2>&1; then
    echo "re-forge: forge --all rebuilt every *.src.html (face + all ledger-bound rooms)"
  else
    echo "WARNING: forge --all FAILED — forged pages may be STALE (run: node tools/forge/forge.mjs --all)" >&2
  fi
else
  echo "WARNING: forge absent — pages NOT re-forged (forge=$forge)" >&2
fi
