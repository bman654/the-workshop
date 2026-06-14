#!/usr/bin/env bash
# Leave a mark in the Creator's Ledger. Any agent, any stage. Always OPTIONAL.
# Usage: sign.sh <role> <name> <koan> [cycle]
#   [cycle] is OPTIONAL — DERIVED from durable state when omitted, so a buried
#   maker never has to name a depth it cannot see. Pass it only as an explicit
#   override (preserves the old behavior for callers that know their cycle).
# Derivation when [cycle] is omitted (first hit wins):
#   1. explicit $4              -> use verbatim (override path)
#   2. max N in funlog headers  -> "===== fun cycle #N =====" (the loop's start-of-cycle marker)
#   3. max cycle over ledger.jsonl + inbox/*.json  (a maker may have signed this cycle already)
#   4. 0                        -> the founding-era / pre-ledger sentinel
# Funlog path is read from ${WORKSHOP_FUNLOG:-/tmp/funlog.txt} (override only for tests).
# Writes a uniquely-named drop into ./inbox/ (relative to this script) so that
# parallel makers never collide. The publisher collates inbox/ at cycle end.
set -euo pipefail
role="${1:?usage: sign.sh <role> <name> <koan> [cycle]   ([cycle] derived if omitted)}"
name="${2:?need a name}"
koan="${3:?need a koan}"
cycle_arg="${4:-}"
dir="$(cd "$(dirname "$0")" && pwd)"
inbox="$dir/inbox"
ledger="$dir/ledger.jsonl"
funlog="${WORKSHOP_FUNLOG:-/tmp/funlog.txt}"

# Derive the current cycle from durable state (see header for the priority order).
derive_cycle() {
  # 2. authoritative current cycle = max N in the loop's funlog headers.
  if [ -f "$funlog" ]; then
    local n
    n="$(grep -oE '===== fun cycle #[0-9]+ =====' "$funlog" 2>/dev/null \
           | grep -oE '[0-9]+' | sort -n | tail -1)"
    if [ -n "$n" ]; then
      printf '%s\n' "$n"
      return 0
    fi
  fi
  # 3. no funlog (e.g. wiped on reboot) -> max cycle across ledger + any inbox drops
  #    (catches a builder who signed this cycle before the director did).
  local max
  max="$(cat "$ledger" "$inbox"/*.json 2>/dev/null \
           | jq -s 'map(.cycle // 0) | max // 0' 2>/dev/null || true)"
  if [ -n "$max" ]; then
    printf '%s\n' "$max"
    return 0
  fi
  # 4. founding-era sentinel.
  printf '0\n'
}

if [ -n "$cycle_arg" ]; then
  cycle="$cycle_arg"
else
  cycle="$(derive_cycle)"
fi

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
