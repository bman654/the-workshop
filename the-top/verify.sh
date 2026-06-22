#!/usr/bin/env bash
# verify.sh — The Top That Won't Fall's gate. Run from anywhere: bash the-top/verify.sh
# Greens: the Node twin (self-test + deeper assertions + byte-parity page≡module), the
# front-door map smoke (no abort, renders all POIs, the new Midway POI placed), forge
# --check --all current, forge --audit-seen drops the the-top breadcrumb, and the
# reciprocal triad cross-links resolve both directions to The Spinning Chair AND The
# Equal-Area Sweep.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — shared self-test + deep assertions + byte-parity)"
node the-top/core.test.mjs || fail=1

say "2 · core.mjs direct run (node core.mjs exits 0 — the literal DoD)"
node the-top/core.mjs >/dev/null 2>&1 && echo "  ✓ node the-top/core.mjs exit 0" || { echo "  ✗ core.mjs nonzero exit"; fail=1; }

say "3 · front-door map smoke (renders all POIs, no abort, the-top Midway slot placed)"
node tools/layout/smoke.cjs >/tmp/top-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural abort)"; tail -20 /tmp/top-smoke.out; fail=1
else echo "  ✓ smoke structural pass (exit 0)"; fi

say "4 · forge --check --all (every generated page current, including the-top + front door)"
node tools/forge/forge.mjs --check --all >/tmp/top-forge.out 2>&1
if grep -q 'all .* current' /tmp/top-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/top-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/top-forge.out | head; fail=1; fi

say "5 · forge --audit-seen (the-top drops ws:seen:the-top)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'the-top — drops ws:seen:the-top'; then
  echo "  ✓ the-top drops ws:seen:the-top"
else echo "  ✗ the-top breadcrumb missing"; fail=1; fi

say "6 · reciprocal triad cross-links resolve (all three name each other)"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
check_link "the-top/index.html" "../spinning-chair/index.html"
check_link "the-top/index.html" "../equal-area-sweep/index.html"
check_link "spinning-chair/index.html" "../the-top/index.html"
check_link "equal-area-sweep/index.html" "../the-top/index.html"

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
