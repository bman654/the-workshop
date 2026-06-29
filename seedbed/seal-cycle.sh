#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# seal-cycle.sh — the ONE deterministic, atomic end-of-cycle seal.
#
# Usage:  bash seedbed/seal-cycle.sh <mode> <track> <cycle-N> <commit-msg-file>
#   <mode>            BUILD | PLAN | TRIVIAL | WRIT
#   <track>           garden | grounds | foundry | bug | writ
#   <cycle-N>         the cycle number = gauges.currentCycle (the idempotency key)
#   <commit-msg-file> a readable file holding the full commit subject+body the
#                     publisher wrote (passed to `git commit -F`).
#
# WHY THIS EXISTS — the recovery-from-quota fix (the #357 stranding).
# The publisher used to run `gauge record`, then `collate`, then `git commit`,
# then `git push` as FOUR separate model-driven steps. A weekly-quota / API death
# between `record` and `commit` left the cycle STRANDED: the gauge counter had
# advanced ("last completed N") but the work was never committed — and a restart
# can't resume it (a fresh director runs the gauge, sees N+1, and treats the dirty
# tree as orphaned rather than finishing it). Folding record+collate+commit+push
# into ONE shell call removes the gap: quota limits throttle API round-trips, NOT
# local shell execution, so once the publisher issues this single tool call the
# script runs to completion regardless of quota. If quota dies BEFORE this call,
# nothing was recorded — a clean re-run of publish, never a stranded cycle.
#
# ORDER IS DELIBERATE: the fallible steps (collate, forge-check) run BEFORE the
# gauge record, so the SOLE state mutation (record) sits immediately before the
# commit with nothing fallible between them — the record↔commit window is two
# local git ops. RE-RUN SAFE: `gauge record --cycle N` is idempotent (a re-record
# of an already-recorded cycle is a no-op), and a CLEAN tree at entry means the
# cycle is already sealed → we just ensure it is pushed.
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

die(){ echo "seal-cycle: ERROR — $*" >&2; exit 1; }

# ── args ──────────────────────────────────────────────────────────────────────
[ "$#" -eq 4 ] || die "need 4 args: <mode> <track> <cycle-N> <commit-msg-file> (got $#)"
mode="$1"; track="$2"; cycle="$3"; msgfile="$4"

case "$mode"  in BUILD|PLAN|TRIVIAL|WRIT) ;; *) die "unknown mode '$mode' (want BUILD|PLAN|TRIVIAL|WRIT)";; esac
case "$track" in garden|grounds|foundry|bug|writ) ;; *) die "unknown track '$track' (want garden|grounds|foundry|bug|writ)";; esac
case "$cycle" in ''|*[!0-9]*) die "cycle '$cycle' is not a positive integer";; esac
[ -f "$msgfile" ] || die "commit-msg file not found: $msgfile"
[ -s "$msgfile" ] || die "commit-msg file is empty: $msgfile"

# ── locate repo root (this script lives in <root>/seedbed/) ─────────────────────
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
cd "$root"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git work tree: $root"

# ── refuse mid-reconcile (a sow/seal during rebase/merge/detached HEAD is unsafe)
if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ] || ! git symbolic-ref -q HEAD >/dev/null 2>&1; then
  die "repo is mid-rebase/merge or HEAD is detached — resolve that first, then re-run the seal"
fi

echo "seal-cycle: mode=$mode track=$track cycle=$cycle  (HEAD=$(git rev-parse --short HEAD), depth $(git rev-list --count HEAD))"

# ── CLEAN-TREE GUARD: a clean tree at entry means this cycle is already committed
# (a re-run after a successful seal, or genuinely nothing to seal). Do NOT collate
# /record/commit onto a clean tree (that would mint a spurious depth-bump commit) —
# just make sure the existing work is pushed, then exit.
if [ -z "$(git status --porcelain)" ]; then
  echo "seal-cycle: working tree CLEAN — cycle already sealed (or nothing to seal); ensuring pushed."
  git push
  echo "seal-cycle: done (push-only). HEAD=$(git rev-parse --short HEAD), depth $(git rev-list --count HEAD)."
  exit 0
fi

# ── 1. COLLATE the ledger: fold inbox marks into ledger.jsonl, re-pin every
#       ledger-bound room's CLAIM, re-forge all pages. (No-op on an empty inbox.)
echo "seal-cycle: [1/5] collating the ledger…"
bash "$root/ledger/collate.sh"

# ── 2. FORGE CURRENCY (hard gate): collate just re-forged everything, so this
#       MUST be clean. If not, abort BEFORE recording/committing — never seal a
#       stale forge. (collate only WARNS on a forge failure; this turns it fatal.)
echo "seal-cycle: [2/5] verifying forge currency…"
node "$root/tools/forge/forge.mjs" --check --all >/dev/null 2>&1 \
  || die "forge --check --all is NOT clean after collate — refusing to seal a stale forge (run: node tools/forge/forge.mjs --check --all)"

# ── 3. RECORD the gauge outcome — the SOLE state mutation, idempotent via --cycle.
#       Placed last-before-commit so the record↔commit window is just local git ops.
echo "seal-cycle: [3/5] recording the gauge outcome…"
node "$root/seedbed/gauge.mjs" record --mode "$mode" --track "$track" --cycle "$cycle"

# ── 4. STAGE + COMMIT the whole cycle in one shot.
echo "seal-cycle: [4/5] staging + committing…"
git add -A
if git diff --cached --quiet; then
  echo "seal-cycle: nothing staged to commit (already committed?) — proceeding to push."
else
  git commit -F "$msgfile"
fi

# ── 5. PUSH.
echo "seal-cycle: [5/5] pushing…"
git push

echo "seal-cycle: SEALED cycle $cycle.  HEAD=$(git rev-parse --short HEAD), depth $(git rev-list --count HEAD)."
node "$root/seedbed/gauge.mjs" --status 2>/dev/null | sed -n '1,2p' || true
