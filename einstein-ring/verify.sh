#!/usr/bin/env bash
# verify.sh — The Ring Made of One Star's gate. Run from anywhere: bash einstein-ring/verify.sh
# Greens: the Node twin (self-test + the headline lensing claims + byte-parity), the front-door map
# smoke (no abort, slot star-clear), forge --check --all current, forge --audit-seen drops the
# einstein-ring breadcrumb, and the reciprocal orrery cross-link resolves both directions.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — self-test + exact roots/ring/magnification/neg-control + byte-parity)"
node einstein-ring/core.test.mjs || fail=1

say "2 · front-door map smoke (renders all POIs, no abort, einstein-ring slot star-clear)"
node tools/layout/smoke.cjs >/tmp/er-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural)"; tail -20 /tmp/er-smoke.out; fail=1
else echo "  ✓ smoke structural pass"; grep -i 'einstein-ring' /tmp/er-smoke.out | head -1; fi

say "3 · forge --check --all (every generated page current)"
node tools/forge/forge.mjs --check --all >/tmp/er-forge.out 2>&1
if grep -q 'all .* current' /tmp/er-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/er-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/er-forge.out | head; fail=1; fi

say "4 · forge --audit-seen (einstein-ring drops ws:seen:einstein-ring)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'einstein-ring — drops ws:seen:einstein-ring'; then
  echo "  ✓ einstein-ring drops ws:seen:einstein-ring"
else echo "  ✗ einstein-ring breadcrumb missing"; fail=1; fi

say "5 · reciprocal cross-links resolve (both files exist + link to each other)"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
check_link "einstein-ring/index.html" "../orrery/index.html"
check_link "orrery/index.html" "../einstein-ring/index.html"

say "6 · byte-twin parity of the CORE region (index.html inlined core === core.mjs)"
if node einstein-ring/core.test.mjs 2>&1 | grep -q 'index.html inlined core === core.mjs CORE region'; then
  echo "  ✓ CORE region byte-identical (indentation-normalized)"
else echo "  ✗ CORE region drift between core.mjs and index.html"; fail=1; fi

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
