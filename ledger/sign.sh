#!/usr/bin/env bash
# Leave a mark in the Creator's Ledger. Any agent, any stage. Always OPTIONAL.
# Usage: sign.sh <role> <name> <koan> [cycle]
#   [cycle] is OPTIONAL — DERIVED from durable state when omitted, so a buried
#   maker never has to name a depth it cannot see. Pass it only as an explicit
#   override (preserves the old behavior for callers that know their cycle).
# Derivation when [cycle] is omitted — the depth is the MAX OF TWO honest measures
# (the bedrock FLOOR and the live leaves), then a sentinel (cycle-fixer, cycle #53):
#   1. explicit $4              -> use verbatim (override path)
#   2. derived = max(bedrockMax, funlogMax)  where
#        bedrockMax = max cycle over ledger.jsonl + inbox/*.json  (the DURABLE,
#          append-only record + this cycle's already-laid stones)
#        funlogMax  = max N in funlog headers  -> "===== fun cycle #N ====="
#      ...so the bedrock still FLOORS the value (a buried maker never regresses below
#      the durable record — survives a funlog wipe/reboot) AND the live funlog can
#      ADVANCE it past a STALE bedrock. See WHY below.
#   3. 0                        -> the founding-era sentinel (no bedrock, no funlog)
# Funlog path is read from ${WORKSHOP_FUNLOG:-/tmp/funlog.txt} (override only for tests).
#
# WHY MAX-OF-BOTH, not bedrock-first (the monotonic-counter argument, cycle #53):
# A forward-marching cycle counter must be able to ADVANCE. The old "bedrock-first,
# funlog-fallback" order could NEVER advance from the bedrock alone: the derived
# cycle was just last cycle's max, so the new mark re-stamped that same max, which
# became next cycle's max — a self-perpetuating freeze. It staled at 30 and stamped
# 117 marks there across real cycles ~31→52. Taking max(bedrock, funlog) keeps BOTH
# properties the v2 rewrite wanted: the durable bedrock is still a FLOOR (it can only
# raise the value, never lower it — a funlog wipe cannot regress a buried maker), and
# the live funlog, which the loop actually advances each cycle, breaks the freeze by
# pulling the value forward whenever it has marched past a stale bedrock.
# NO MIGRATION (the second design question, cycle #14): the stones already in the Cairn
# keep their recorded `cycle` AS PLACED — the ledger is append-only and each value is an
# honest historical record of what that maker believed at signing time. Rewriting them
# would destroy provenance and violate append-only. This derivation change touches only
# how the NEXT stone derives its depth, never the stones already laid — including the 117
# stones frozen at cycle 30 by the old freeze (cycle #53): they stay AS PLACED, honest
# records of what each maker observed; only cycle 53+ stamps correctly going forward.
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

# Derive the current cycle as max(bedrock floor, live funlog) (see header for WHY).
# OFF-BY-ONE NOTE (the design question, cycle #14, unchanged): both terms read an
# "as-of-last-completed" depth. The ledger+inbox max is the depth the BEDROCK shows —
# during a live cycle i that is the LAST-COMPLETED cycle (i-1) until this cycle's marks
# are collated (or a maker signs into the inbox this cycle, which the inbox term catches).
# The funlog header likewise reads #(i-1) until cycle i writes its OWN header. A maker
# signing mid-cycle records the honest, observable depth either source shows — never a
# guessed i = max+1, which would MIS-stamp the very first sign of a fresh cycle. The
# max-of-both keeps that honest framing: it takes the higher of two as-of-last-completed
# readings, so a stale source can only be OUTVOTED by a fresher one, never fabricate.
# NOTE (v2, 2026-06-15): fun-forever.js NO LONGER passes a cycle arg — every call site now
# omits it and relies on this derivation (the loop's within-run index is not the durable
# cycle). $4 remains supported purely as a MANUAL / test override; do not re-wire the loop
# to pass it.
derive_cycle() {
  # bedrockMax (the FLOOR): max cycle across ledger.jsonl + any inbox drops. The
  # append-only record + this cycle's already-laid stones; survives a funlog wipe.
  # An empty/unreadable bedrock yields 0 (jq's `// 0` defaults).
  local bedrock_max
  bedrock_max="$(cat "$ledger" "$inbox"/*.json 2>/dev/null \
           | jq -s 'map(.cycle // 0) | max // 0' 2>/dev/null || true)"
  case "$bedrock_max" in (''|*[!0-9]*) bedrock_max=0 ;; esac
  # funlogMax (can ADVANCE past a stale bedrock): max N in the loop's funlog headers
  # "===== fun cycle #N =====" (the ephemeral leaves). Absent/unreadable funlog -> 0.
  local funlog_max=0
  if [ -f "$funlog" ]; then
    local n
    n="$(grep -oE '===== fun cycle #[0-9]+ =====' "$funlog" 2>/dev/null \
           | grep -oE '[0-9]+' | sort -n | tail -1)"
    case "$n" in (''|*[!0-9]*) n=0 ;; esac
    funlog_max="$n"
  fi
  # derived = max(bedrock floor, live funlog). Both 0 -> the founding-era sentinel.
  if [ "$funlog_max" -gt "$bedrock_max" ]; then
    printf '%s\n' "$funlog_max"
  else
    printf '%s\n' "$bedrock_max"
  fi
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
