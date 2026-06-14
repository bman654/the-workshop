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
