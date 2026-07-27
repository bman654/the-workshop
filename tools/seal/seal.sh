#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# seal.sh — the one command that closes out a making session.
#
#   bash tools/seal/seal.sh "the commit message"
#   bash tools/seal/seal.sh -F /path/to/message.txt      # long message from a file
#
# It does the bookkeeping so a maker never has to think about it:
#   1. folds any stone you signed into the Cairn's ledger
#   2. re-derives the estate manifest, re-pins every page that quotes it, re-forges
#      — so the meta-exhibits that describe the estate (the card catalog, the
#        Tabularium, the Census) never go stale behind you
#   3. hard-gates on forge currency — a stale forge is never sealed
#   4. regenerates INDEX.md from the manifest
#   5. trims NEXT.md back to its ring
#   6. commits, and pushes (failing OPEN — see below)
#
# INHERITED FROM seedbed/seal-cycle.sh, and worth restating:
#
# WHY ONE SHELL CALL. The close-out used to be four model-driven steps. A quota or
# API death between them left a session STRANDED — bookkeeping advanced, work never
# committed. Quota throttles API round-trips, not local shell execution, so once
# this single call is issued it runs to completion. If the model dies BEFORE it,
# nothing happened and a clean re-run is safe.
#
# PUSH FAILS OPEN. The keeper's 1Password locks while he is away and then refuses
# to sign; a push can fail through no fault of the work. The COMMIT is the durable
# record — a failed push must never fail a seal. The next successful push carries
# every pending commit up. The one case needing a hand is a non-fast-forward
# reject (origin ahead): pull --rebase, then re-run.
#
# RE-RUN SAFE. A clean tree at entry means the session is already sealed; we just
# ensure it is pushed and exit.
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

die(){ echo "seal: ERROR — $*" >&2; exit 1; }

push_failed_open(){
  echo "seal: WARNING — git push FAILED. The work IS sealed locally and is safe." >&2
  echo "seal:   · auth/agent failure (1Password locked): do nothing; a later push carries it up." >&2
  echo "seal:   · non-fast-forward reject (origin ahead): git pull --rebase, then re-run this." >&2
  return 0
}

# ── args ──────────────────────────────────────────────────────────────────────
msgfile=""
cleanup_msg=0
if [ "${1:-}" = "-F" ]; then
  [ -n "${2:-}" ] || die "-F needs a path"
  msgfile="$2"
  [ -f "$msgfile" ] || die "commit-message file not found: $msgfile"
  [ -s "$msgfile" ] || die "commit-message file is empty: $msgfile"
else
  [ "$#" -ge 1 ] || die "need a commit message:  bash tools/seal/seal.sh \"what you made\""
  [ -n "${1// /}" ] || die "commit message is empty"
  msgfile="$(mktemp)"; cleanup_msg=1
  printf '%s\n' "$1" > "$msgfile"
fi
trap '[ "$cleanup_msg" = 1 ] && rm -f "$msgfile"' EXIT

# ── locate repo root (this script lives in <root>/tools/seal/) ────────────────
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
cd "$root"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git work tree: $root"

if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ] || ! git symbolic-ref -q HEAD >/dev/null 2>&1; then
  die "repo is mid-rebase/merge or HEAD is detached — resolve that first, then re-run"
fi

echo "seal: HEAD=$(git rev-parse --short HEAD), depth $(git rev-list --count HEAD)"

if [ -z "$(git status --porcelain)" ]; then
  echo "seal: working tree CLEAN — already sealed (or nothing to seal); ensuring pushed."
  git push || push_failed_open
  echo "seal: done (push-only)."
  exit 0
fi

# ── 1. the ledger + the estate's self-description ─────────────────────────────
# collate folds inbox stones into ledger.jsonl, refreshes the worn-path depth,
# re-derives the estate manifest, runs every */reclaim.mjs hook, and re-forges all
# pages. A room enrolls in this auto-maintenance simply by shipping a reclaim.mjs —
# nothing here knows any room by name.
echo "seal: [1/6] collating the ledger + re-deriving the estate…"
bash "$root/ledger/collate.sh"

# ── 2. forge currency — a HARD gate ───────────────────────────────────────────
# collate just re-forged everything, so this must be clean. collate only WARNS on a
# forge failure; here it is fatal. Never seal a stale forge.
echo "seal: [2/6] verifying forge currency…"
node "$root/tools/forge/forge.mjs" --check --all >/dev/null 2>&1 \
  || die "forge --check --all is NOT clean — refusing to seal a stale forge (run: node tools/forge/forge.mjs --check --all)"

# ── 3. INDEX.md — derived, never hand-kept ────────────────────────────────────
echo "seal: [3/6] regenerating INDEX.md…"
node "$root/tools/seal/index-gen.mjs"

# ── 4. NEXT.md — bounded by code, not by discipline ───────────────────────────
echo "seal: [4/6] trimming NEXT.md to its ring…"
node "$root/tools/seal/trim-next.mjs"

# ── 5. commit ─────────────────────────────────────────────────────────────────
echo "seal: [5/6] staging + committing…"
git add -A
if git diff --cached --quiet; then
  echo "seal: nothing staged (already committed?) — proceeding to push."
else
  git commit -F "$msgfile"
fi

# ── 6. push, failing open ─────────────────────────────────────────────────────
echo "seal: [6/6] pushing…"
git push || push_failed_open

echo "seal: SEALED. HEAD=$(git rev-parse --short HEAD), depth $(git rev-list --count HEAD)."
