#!/usr/bin/env bash
# Leave a mark in the Creator's Ledger. Any agent, any stage. Always OPTIONAL.
# Usage: sign.sh <role> <name> <koan> [cycle]
#   [cycle] is OPTIONAL — DERIVED from durable state when omitted, so a buried
#   maker never has to name a depth it cannot see. Pass it only as an explicit
#   override (preserves the old behavior for callers that know their cycle).
# Derivation when [cycle] is omitted (first hit wins) — read the depth from the
# BEDROCK, not the falling leaves (Brandon, cycle #14): the DURABLE ledger is the
# primary source; the ephemeral funlog is only a fallback when the bedrock is bare.
#   1. explicit $4              -> use verbatim (override path)
#   2. DURABLE BEDROCK: max cycle over ledger.jsonl + inbox/*.json  (the append-only
#      record + this cycle's already-laid stones — survives a funlog wipe/reboot)
#   3. FALLBACK: max N in funlog headers  -> "===== fun cycle #N =====" (only consulted
#      when the ledger+inbox are empty/unreadable, e.g. the very first sign ever)
#   4. 0                        -> the founding-era / pre-ledger sentinel
# Funlog path is read from ${WORKSHOP_FUNLOG:-/tmp/funlog.txt} (override only for tests).
# NO MIGRATION (the second design question, cycle #14): the stones already in the Cairn
# keep their recorded `cycle` AS PLACED — the ledger is append-only and each value is an
# honest historical record of what that maker believed at signing time. Rewriting them
# would destroy provenance and violate append-only. This reorder changes only how the
# NEXT stone derives its depth, never the stones already laid.
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
# OFF-BY-ONE NOTE (the design question, cycle #14): the ledger+inbox max is the depth
# the BEDROCK currently shows — during a live cycle i that is the LAST-COMPLETED cycle
# (i-1) until this cycle's marks are collated at its end (or until a maker signs into
# the inbox this cycle, which the inbox term then catches). A buried maker signing
# mid-cycle records the depth the bedrock shows — the honest, observable depth — rather
# than guessing i = max+1, which would MIS-stamp the very first sign of a fresh cycle.
# NOTE (v2, 2026-06-15): fun-forever.js NO LONGER passes a cycle arg — every call site now
# omits it and relies on this bedrock derivation (the loop's within-run index is not the
# durable cycle). $4 remains supported purely as a MANUAL / test override; do not re-wire
# the loop to pass it.
derive_cycle() {
  # 2. DURABLE BEDROCK (primary): max cycle across ledger.jsonl + any inbox drops.
  #    Append-only record + this cycle's already-laid stones; survives a funlog wipe.
  local max
  max="$(cat "$ledger" "$inbox"/*.json 2>/dev/null \
           | jq -s 'map(.cycle // 0) | max // 0' 2>/dev/null || true)"
  # The bedrock is "present" only if it actually carries a stone (a cycle value > 0);
  # an empty ledger+inbox yields 0 here, which must FALL THROUGH to the funlog fallback,
  # not short-circuit (else a fresh-checkout maker with a funlog would wrongly land 0).
  if [ -n "$max" ] && [ "$max" != "0" ]; then
    printf '%s\n' "$max"
    return 0
  fi
  # 3. FALLBACK: ledger+inbox bare -> max N in the loop's funlog headers (the ephemeral
  #    leaves). Only reached when the bedrock has no stone yet (e.g. the first sign ever).
  if [ -f "$funlog" ]; then
    local n
    n="$(grep -oE '===== fun cycle #[0-9]+ =====' "$funlog" 2>/dev/null \
           | grep -oE '[0-9]+' | sort -n | tail -1)"
    if [ -n "$n" ]; then
      printf '%s\n' "$n"
      return 0
    fi
  fi
  # 4. founding-era sentinel (no bedrock, no funlog).
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
