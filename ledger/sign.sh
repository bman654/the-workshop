#!/usr/bin/env bash
# Leave a mark in the Creator's Ledger. Any agent, any stage. Always OPTIONAL.
# Usage: sign.sh <role> <name> <koan> [cycle]
# Writes a uniquely-named drop into ./inbox/ (relative to this script) so that
# parallel makers never collide. The publisher collates inbox/ at cycle end.
set -euo pipefail
role="${1:?usage: sign.sh <role> <name> <koan> [cycle]}"
name="${2:?need a name}"
koan="${3:?need a koan}"
cycle="${4:-}"
dir="$(cd "$(dirname "$0")" && pwd)"
inbox="$dir/inbox"
mkdir -p "$inbox"
ts="$(date -u +%FT%TZ)"
slug="$(printf '%s' "$role" | tr -cs 'a-zA-Z0-9' '-' | sed 's/^-*//;s/-*$//')"
# unique even under parallel makers: epoch-seconds + pid + RANDOM (BSD date has no %N)
f="$inbox/${slug:-mark}-$(date +%s)-$$-${RANDOM}.json"
jq -n \
  --arg cycle "$cycle" --arg role "$role" --arg name "$name" --arg koan "$koan" --arg ts "$ts" \
  '{cycle: ($cycle | if . == "" then null else (tonumber? // .) end),
    role: $role, name: $name, koan: $koan, ts: $ts}' > "$f"
echo "left a mark: ${f#"$dir"/}"
