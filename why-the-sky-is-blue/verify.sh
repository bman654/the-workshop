#!/usr/bin/env bash
# verify.sh — the Scattering Tank's gate. Run from anywhere: bash why-the-sky-is-blue/verify.sh
# Greens: the Node twin (self-test + independent re-derivations + stronger sweeps + byte-parity),
# the front-door map smoke (no abort, slot star-clear), forge --check --all current, forge
# --audit-seen drops the why-the-sky-is-blue breadcrumb, and the reciprocal cross-links resolve
# BOTH directions for rainbow, halo, and last-scattering.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2
fail=0
say(){ printf '\n=== %s ===\n' "$1"; }

say "1 · Node twin (core.test.mjs — self-test + re-derivations + stronger sweeps + byte-parity)"
node why-the-sky-is-blue/core.test.mjs || fail=1

say "2 · front-door map smoke (renders all POIs, no abort, why-the-sky-is-blue slot star-clear)"
node tools/layout/smoke.cjs >/tmp/sky-smoke.out 2>&1
if [ $? -ne 0 ]; then echo "  ✗ smoke FAILED (structural)"; tail -20 /tmp/sky-smoke.out; fail=1
else echo "  ✓ smoke structural pass"; fi

say "3 · forge --check --all (every generated page current)"
node tools/forge/forge.mjs --check --all >/tmp/sky-forge.out 2>&1
if grep -q 'all .* current' /tmp/sky-forge.out; then echo "  ✓ $(grep 'forge --check' /tmp/sky-forge.out | tail -1)"
else echo "  ✗ forge drift:"; grep -iE 'STALE|✗|drift' /tmp/sky-forge.out | head; fail=1; fi

say "4 · forge --audit-seen (why-the-sky-is-blue drops ws:seen:why-the-sky-is-blue)"
if node tools/forge/forge.mjs --audit-seen 2>&1 | grep -q 'why-the-sky-is-blue — drops ws:seen:why-the-sky-is-blue'; then
  echo "  ✓ why-the-sky-is-blue drops ws:seen:why-the-sky-is-blue"
else echo "  ✗ why-the-sky-is-blue breadcrumb missing"; fail=1; fi

say "5 · reciprocal cross-links resolve (both files exist + link to each other)"
check_link(){ # $1 = file that must exist, $2 = substring it must contain
  if [ -f "$1" ] && grep -q "$2" "$1"; then echo "  ✓ $1 → contains '$2'"; else echo "  ✗ $1 missing or no link to '$2'"; fail=1; fi
}
# our page links out to all three optics/cosmology neighbours
check_link "why-the-sky-is-blue/index.html" "../rainbow/index.html"
check_link "why-the-sky-is-blue/index.html" "../halo/index.html"
check_link "why-the-sky-is-blue/index.html" "../last-scattering/index.html"
# and each of them links BACK to us
check_link "rainbow/index.html"         "../why-the-sky-is-blue/index.html"
check_link "halo/index.html"            "../why-the-sky-is-blue/index.html"
check_link "last-scattering/index.html" "../why-the-sky-is-blue/index.html"

say "RESULT"
if [ "$fail" -eq 0 ]; then echo "  ✓ ALL GATES GREEN"; else echo "  ✗ SOME GATES RED"; fi
exit "$fail"
