#!/usr/bin/env bash
# verify.sh — the Breathing Star's gate. Run from the repo root: bash breathing-star/verify.sh
# Greens: the Node twin (self-test + independent re-derivations + byte-parity), the front-door map
# smoke (no abort, slot star-clear), forge --check --all current, forge --audit-seen drops the
# breathing-star breadcrumb, and both reciprocal cross-links resolve.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — self-test + independent re-derivations + byte-parity)"
node breathing-star/core.test.mjs || fail=1

say "2 · front-door map smoke (renders all POIs, no abort, breathing-star slot star-clear)"
node tools/layout/smoke.cjs >/tmp/bstar-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural)"; tail -20 /tmp/bstar-smoke.out; fail=1
else echo "  ✓ smoke structural pass"; grep -i 'breathing-star' /tmp/bstar-smoke.out | head -1; fi

say "3 · forge --check --all (every generated page current)"
node tools/forge/forge.mjs --check --all >/tmp/bstar-forge.out 2>&1
if grep -q 'all .* current' /tmp/bstar-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/bstar-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/bstar-forge.out | head; fail=1; fi

say "4 · forge --audit-seen (breathing-star drops ws:seen:breathing-star)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'breathing-star — drops ws:seen:breathing-star'; then
  echo "  ✓ breathing-star drops ws:seen:breathing-star"
else echo "  ✗ breathing-star breadcrumb missing"; fail=1; fi

say "5 · reciprocal cross-links resolve (both files exist + link to each other)"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
check_link "breathing-star/index.html" "../stellar-forge/index.html"
check_link "stellar-forge/index.html" "../breathing-star/index.html"

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
