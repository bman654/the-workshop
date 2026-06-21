#!/usr/bin/env bash
# verify.sh — The Spinning Chair's gate. Run from anywhere: bash spinning-chair/verify.sh
# Greens: the Node twin (self-test + deeper assertions + byte-parity), the front-door map
# smoke (no abort, renders all POIs), forge --check --all current, forge --audit-seen drops the
# spinning-chair breadcrumb, and the reciprocal Midway/Rotor cross-link resolves both directions.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — shared self-test + deep assertions + byte-parity)"
node spinning-chair/core.test.mjs || fail=1

say "2 · core.mjs direct run (node core.mjs exits 0 — the literal DoD)"
node spinning-chair/core.mjs >/dev/null 2>&1 && echo "  ✓ node spinning-chair/core.mjs exit 0" || { echo "  ✗ core.mjs nonzero exit"; fail=1; }

say "3 · front-door map smoke (renders all POIs, no abort, spinning-chair slot placed)"
node tools/layout/smoke.cjs >/tmp/chair-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural abort)"; tail -20 /tmp/chair-smoke.out; fail=1
else echo "  ✓ smoke structural pass (exit 0)"; fi

say "4 · forge --check --all (every generated page current, including spinning-chair + front door)"
node tools/forge/forge.mjs --check --all >/tmp/chair-forge.out 2>&1
if grep -q 'all .* current' /tmp/chair-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/chair-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/chair-forge.out | head; fail=1; fi

say "5 · forge --audit-seen (spinning-chair drops ws:seen:spinning-chair)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'spinning-chair — drops ws:seen:spinning-chair'; then
  echo "  ✓ spinning-chair drops ws:seen:spinning-chair"
else echo "  ✗ spinning-chair breadcrumb missing"; fail=1; fi

say "6 · reciprocal cross-links resolve (both files exist + link to each other)"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
check_link "spinning-chair/index.html" "../midway/index.html"
check_link "midway/index.html" "../spinning-chair/index.html"

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
