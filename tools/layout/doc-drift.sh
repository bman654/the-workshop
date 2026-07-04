#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# doc-drift.sh — the WS1 doc-drift grep TWIN (the polar-reorg conscience for prose).
#
#   node/bash agnostic; run from anywhere:  bash tools/layout/doc-drift.sh
#
# The reorg replaced the pinned-pixel v1 map with the POLAR CONTRACT. Some v1 vocabulary is
# STALE the instant that lands — a retired symbol, a hard-coded pixel, a plate id that no
# longer exists, a sky roster that drifts the moment the sky grows. Docs are where that rot
# hides (code has its own gates; a doc has none), so this twin greps the SCOPED tree for the
# anchored stale patterns and FAILS LOUD if any survives.
#
# SCOPE = every TRACKED file (so untracked/ignored build cruft, node_modules, and the sibling
# worktrees are out for free), MINUS the four "history is allowed to remember" trees:
# **/CHANGELOG.md · worklog/** · ledger/** · tabularium/**. A retired name may live on there.
#
# PATTERNS are ANCHORED (DESIGN §10 W5 — "bare tokens false-positive"): `outskirts` the
# English word (a galaxy's outer disk) is NOT the retired `outskirts` plate id, so the plate
# patterns match the id FORM (quoted / attribute / property), never the bare word.
#
# Two families of mention are LEGITIMATE, not drift, and are allow-listed by a STABLE
# substring (never a line number — those drift):
#   • the v2 RETIREMENT NOTE that names what is gone (tools/layout/README.md's "closed v1
#     region tables (… GROUNDS_WINGS …) are gone");
#   • the §1.9 ALIAS SHIM — `beneathSlot`/`sealedStudySlot` survive as thin aliases of
#     `basementSlot(0|1)`, so their sanctioned definitions/exports/callers are fine; only a
#     v1-style RE-implementation outside the shim would be drift.
#
# Exit 0 (green) iff nothing un-allowed survives; exit 1 (loud) with the offending lines.
# ════════════════════════════════════════════════════════════════════════════
set -uo pipefail

cd "$(dirname "$0")/../.." || { echo "doc-drift: cannot find repo root" >&2; exit 2; }

# the four history trees the sweep never touches (git grep already skips untracked/ignored),
# plus THIS script — a drift-checker legitimately CONTAINS every pattern it hunts, so it must
# never police its own pattern definitions (the linter-exempts-its-own-config rule).
EXCL=(
  ':(exclude,glob)**/CHANGELOG.md'
  ':(exclude,glob)worklog/**'
  ':(exclude,glob)ledger/**'
  ':(exclude,glob)tabularium/**'
  ':(exclude)tools/layout/doc-drift.sh'
)

FAIL=0

# check NAME PATTERN [ALLOW_REGEX] [PATHSPEC ...]
#   greps the scoped tree for PATTERN, drops lines matching ALLOW_REGEX (empty = allow none),
#   and fails loud on anything left.
check() {
  local name="$1" pattern="$2" allow="${3:-}"; shift 3
  local paths=("$@")
  local scope=(-- "${paths[@]}" "${EXCL[@]}")
  local hits
  hits="$(git grep -nIE --no-color "$pattern" "${scope[@]}" 2>/dev/null || true)"
  if [ -n "$allow" ] && [ -n "$hits" ]; then
    hits="$(printf '%s\n' "$hits" | grep -vE "$allow" || true)"
  fi
  hits="$(printf '%s' "$hits" | sed '/^[[:space:]]*$/d')"
  if [ -n "$hits" ]; then
    printf '  ✗ DRIFT — %s:\n' "$name"
    printf '%s\n' "$hits" | sed 's/^/      /'
    FAIL=1
  else
    printf '  ✓ %s\n' "$name"
  fi
}

echo "doc-drift twin — anchored v1→v2 stale-vocabulary sweep over the scoped tree"

# 1 — the retired v1 region symbol. The ONLY legitimate survivor is the README's
#     "these tables are gone" retirement note.
check "GROUNDS_WINGS symbol (retired region table)" \
  'GROUNDS_WINGS' \
  'closed v1 region tables' \
  '.'

# 2 — the hard-coded manor pixel + the retired manor-pin phrase.
check "manor pixel / manor-pin (pinned-geometry residue)" \
  'x586 y296|manor pin' \
  '' \
  '.'

# 3 — the stale door-pill fraction. Scoped to tools/layout only (the fraction is innocent
#     English elsewhere); the pill prints its own live count now, no hard-coded digit.
check "door-pill 16/17 (hard-coded stale count, tools/layout only)" \
  '16/17' \
  '' \
  'tools/layout/'

# 4 — the dissolved `beneath` DISTRICT (steer 2 — beneath folds into manor/basement).
check "district:\"beneath\" (dissolved district)" \
  "district:[[:space:]]*['\"]beneath['\"]" \
  '' \
  '.'

# 5 — the basement SLOT names outside the §1.9 alias shim. The shim + its sanctioned callers
#     are legitimate; a bare v1 re-implementation would not be.
check "beneathSlot / sealedStudySlot outside the §1.9 alias shim" \
  'beneathSlot|sealedStudySlot' \
  'alias|§1\.9|basementSlot|Layout\.(beneathSlot|sealedStudySlot)|beneathSlot:|sealedStudySlot:|\(beneathSlot\)|\(sealedStudySlot\)' \
  '.'

# 6 — the retired v1 PLATE IDs (DESIGN §10 W5's exact list: grounds-west/-east · outskirts ·
#     child:amusements — NOT the `lowerworks` district-rename, which the spec's list omits and
#     which lives only in the reclaim.mjs-generated the-gate slab + the loop-pinned ROADMAP,
#     both re-derived by their own tools, never in the §8 doc prose this twin polices).
#     ANCHORED to the identifier form (quoted id / data-to / dataset.to compare / id: / child:)
#     so the bare English word "outskirts" (a galaxy's outer disk) is safe.
check "retired plate ids (grounds-west/-east · outskirts · child:amusements)" \
  "['\"](grounds-west|grounds-east|outskirts)['\"]|data-to=[\"']?(grounds-west|grounds-east|outskirts)|dataset\.to[[:space:]]*===?[[:space:]]*[\"'](grounds-west|grounds-east|outskirts)|id:[[:space:]]*['\"](grounds-west|grounds-east|outskirts)['\"]|child:amusements" \
  '' \
  '.'

# 7 — the stale lone/single-star sky ROSTER (all four round-6/7 phrasings). The PRINCIPLE
#     survives in prose; only a transcribed enumeration is drift.
check "stale single/lone-star sky roster (transcribed, drifts as the sky grows)" \
  'single-star groups|awaiting siblings|lone-star groups|awaiting a sibling' \
  '' \
  '.'

echo ""
if [ "$FAIL" -ne 0 ]; then
  echo "✗ DOC-DRIFT: stale v1 vocabulary survives the polar reorg (see above) — fix or history-exclude it."
  exit 1
fi
echo "✓ DOC-DRIFT: no stale v1 vocabulary survives in the scoped tree. Clean."
exit 0
