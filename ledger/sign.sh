#!/usr/bin/env bash
# Leave a mark in the Creator's Ledger. Any agent, any stage. Always OPTIONAL.
# Usage: sign.sh <role> <name> <koan> [cycle]
#   [cycle] is OPTIONAL — DERIVED from the git history when omitted, so a buried
#   maker never has to name a depth it cannot see. Pass it only as an explicit
#   override (preserves the old behavior for callers that know their cycle).
#
# Derivation when [cycle] is omitted (v3, 2026-06-15 — the GIT-DEPTH rewrite):
#   THE CYCLE OF A STONE IS THE GIT COMMIT-DEPTH OF THE COMMIT IT LIVES IN.
#   `git rev-list --count <commit>` is a commit's OWN depth (its distance from the
#   root + 1). At sign time HEAD is the LAST landed commit; this cycle's marks are
#   collated and committed in the NEXT commit, whose depth is therefore
#       ( git rev-list --count HEAD ) + 1
#   So the derived cycle is HEAD's depth plus one — the own-commit depth of the
#   upcoming commit the stone will be sealed into. Run git from the ledger dir
#   (`git -C "$dir" rev-list --count HEAD`).
#
# WHY git-depth (supersedes the old max(bedrock,funlog) "fun-cycle" semantics):
# The old derivation was a self-referential max over the ledger's own `cycle`
# field plus the loop's funlog headers. It had two fatal flaws the bug names:
#   (1) THE FREEZE — the derived cycle was just last cycle's max re-stamped, so it
#       could never advance from the bedrock alone; it staled at 30 and stamped
#       117 marks there across real cycles ~31→52.
#   (2) THE SCRAMBLE — the funlog's within-run index reset/scrambled across loop
#       relaunches, so the ancient stones' cycles disagreed with real chronology.
# Git depth is immune to BOTH: it is monotonic (every commit is strictly deeper
# than its parent) and authoritative (it is the repository's own measure of how
# far the trail is worn, the same integer collate.sh writes to depth.txt). The
# founding stone (seq 1) lives in commit d38a402 at depth 306 — so under this
# derivation a stone signed at that commit's tip would carry cycle 306, honoring
# the 305 un-named commits that preceded the ledger (the Cairn's "depth − stones"
# gap = the quantified silence) instead of the meaningless sentinel 0.
#
# FALLBACK (a non-git sandbox — the hermetic self-test runs in a bare mktemp dir):
# if `git rev-list` fails (not a repo / no HEAD / git absent), fall back to the
# legacy derivation: max(bedrock floor, live funlog), then a 0 sentinel. This
# keeps the test hermetic AND keeps sign.sh usable outside a checkout. The
# fallback is the OLD behavior verbatim:
#   bedrockMax = max .cycle over ledger.jsonl + inbox/*.json   (the durable record)
#   funlogMax  = max N in funlog headers "===== fun cycle #N ====="  (the leaves)
#   derived    = max(bedrockMax, funlogMax)  ; both 0 -> founding-era sentinel 0
# Funlog path is ${WORKSHOP_FUNLOG:-/tmp/funlog.txt} (override only for tests).
#
# NO MIGRATION of stones already laid: the ledger is append-only and each placed
# `cycle` is an honest historical record of what that maker observed at signing
# time. This change touches only how the NEXT stone derives its depth — it never
# rewrites the stones already in the Cairn (including the 117 frozen at cycle 30):
# they stay AS PLACED, legible as the place the path once stalled.
#
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

# ── The LEGACY fallback derivation (only reached in a non-git sandbox). ──
# max(bedrock floor, live funlog), then a 0 sentinel — the old behavior verbatim.
derive_cycle_fallback() {
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

# ── The LIVE derivation: the git commit-depth of the UPCOMING commit. ──
# `git rev-list --count HEAD` is HEAD's own depth; +1 is the depth of the next
# commit, where this cycle's collated stones will live. On any git failure
# (non-repo / no HEAD / git absent) we return non-zero so the caller falls back.
derive_cycle_git() {
  local head_depth
  head_depth="$(git -C "$dir" rev-list --count HEAD 2>/dev/null)" || return 1
  case "$head_depth" in (''|*[!0-9]*) return 1 ;; esac
  printf '%s\n' "$((head_depth + 1))"
}

derive_cycle() {
  # Prefer the authoritative git depth; fall back to the legacy max() in a
  # non-git sandbox so the self-test stays hermetic and sign.sh still works
  # outside a checkout.
  local c
  if c="$(derive_cycle_git)"; then
    printf '%s\n' "$c"
  else
    derive_cycle_fallback
  fi
}

if [ -n "$cycle_arg" ]; then
  cycle="$cycle_arg"            # explicit override — used verbatim (manual / tests)
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
