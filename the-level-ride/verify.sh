#!/usr/bin/env bash
# verify.sh — The Level Ride's gate. Run from anywhere: bash the-level-ride/verify.sh
# Greens: the Node twin (self-test + deeper assertions + byte-parity page≡module), the
# core.mjs direct run, the front-door map smoke (no abort, renders all POIs, the new
# Level Ride POI placed in the rolling cluster), forge --check --all current, forge
# --audit-seen drops the the-level-ride breadcrumb, and the reciprocal cross-links
# resolve BOTH directions to all four rolling kin (the-top / brazil-nut-box /
# banked-curve / brachistochrone).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — shared self-test + deep assertions + byte-parity)"
node the-level-ride/core.test.mjs || fail=1

say "2 · core.mjs direct run (node core.mjs exits 0 — the literal DoD)"
node the-level-ride/core.mjs >/dev/null 2>&1 && echo "  ✓ node the-level-ride/core.mjs exit 0" || { echo "  ✗ core.mjs nonzero exit"; fail=1; }

say "3 · front-door map smoke (renders all POIs, no abort, the-level-ride slot placed)"
node tools/layout/smoke.cjs >/tmp/lr-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural abort)"; tail -20 /tmp/lr-smoke.out; fail=1
else echo "  ✓ smoke structural pass (exit 0)"; fi
if grep -q 'the-level-ride .* amusements' /tmp/lr-smoke.out; then echo "  ✓ the-level-ride placed in the amusements cluster"
else echo "  ✗ the-level-ride POI not placed"; fail=1; fi

say "4 · forge --check --all (every generated page current, including the-level-ride + front door)"
node tools/forge/forge.mjs --check --all >/tmp/lr-forge.out 2>&1
if grep -q 'all .* current' /tmp/lr-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/lr-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/lr-forge.out | head; fail=1; fi

say "5 · forge --audit-seen (the-level-ride drops ws:seen:the-level-ride)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'the-level-ride — drops ws:seen:the-level-ride'; then
  echo "  ✓ the-level-ride drops ws:seen:the-level-ride"
else echo "  ✗ the-level-ride breadcrumb missing"; fail=1; fi

say "6 · reciprocal cross-links resolve BOTH directions to the four rolling kin"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
# out: the-level-ride names all four kin
check_link "the-level-ride/index.html" "../the-top/index.html"
check_link "the-level-ride/index.html" "../brazil-nut-box/index.html"
check_link "the-level-ride/index.html" "../banked-curve/index.html"
check_link "the-level-ride/index.html" "../brachistochrone/index.html"
# back: each kin names the-level-ride
check_link "the-top/index.html" "../the-level-ride/index.html"
check_link "brazil-nut-box/index.html" "../the-level-ride/index.html"
check_link "banked-curve/index.html" "../the-level-ride/index.html"
check_link "brachistochrone/index.html" "../the-level-ride/index.html"

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
