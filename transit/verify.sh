#!/usr/bin/env bash
# verify.sh — The Transit's gate. Run from the repo root: bash transit/verify.sh
# Greens: the Node twin (self-test + independent re-derivations + byte-parity), the front-door map
# smoke (no abort, the transit slot star-clear), forge --check --all current (covers transit AND the
# re-forged first-light), forge --audit-seen drops the transit breadcrumb, and both reciprocal
# cross-links (transit <-> first-light) resolve.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — self-test + independent re-derivations + byte-parity)"
node transit/core.test.mjs || fail=1

say "2 · front-door map smoke (renders all POIs, no abort, transit slot star-clear)"
node tools/layout/smoke.cjs >/tmp/transit-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural)"; tail -20 /tmp/transit-smoke.out; fail=1
else echo "  ✓ smoke structural pass"; grep -iE 'transit' /tmp/transit-smoke.out | head -1; fi

say "3 · forge --check --all (every generated page current — transit + the re-forged first-light)"
node tools/forge/forge.mjs --check --all >/tmp/transit-forge.out 2>&1
if grep -q 'all .* current' /tmp/transit-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/transit-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/transit-forge.out | head; fail=1; fi

say "4 · forge --audit-seen (transit drops ws:seen:transit)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'transit — drops ws:seen:transit'; then
  echo "  ✓ transit drops ws:seen:transit"
else echo "  ✗ transit breadcrumb missing"; fail=1; fi

say "5 · reciprocal cross-links resolve (both files exist + link to each other)"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
check_link "transit/index.html" "../first-light/index.html"
check_link "first-light/index.html" "../transit/index.html"

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
