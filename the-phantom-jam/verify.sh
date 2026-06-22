#!/usr/bin/env bash
# ============================================================================
#  The Phantom Jam — the headless-twin check (visual exhibit, NOT audio).
#
#  This is a NUMERICAL / VISUAL piece, so the verify is just the Node twin: it
#  re-proves the four cruxes and the single-source discipline. No WAVs,
#  no audio-lens.
#
#  The four cruxes:
#    • CRUX-1 GROW    — at a jam-prone density one brake tap blooms a stop-and-go
#                        jam from a machine-flat smooth ring.
#    • CRUX-2 DECAY   — the SAME tap re-heals when too SPARSE and when packed too
#                        TIGHT (the jam band is a two-sided window).
#    • CRUX-3 WAVE    — the jam crawls BACKWARD at a constant speed (within tol of
#                        WAVE_REF = −0.58 cells/time) — against the flow of cars.
#    • CRUX-4 AGREE   — the DERIVED stability threshold 2·V′(L/N) − A agrees with
#                        the simulation's observed grow/decay boundary (zero
#                        mismatches), and the sharp upper edge flips N=17→N=18.
#  Plus byte-twin parity (the page's inlined core === core.mjs) and single-source.
#
#  The honesty line: near the band's lower root the linear growth rate → 0, so a
#  finite tap over a finite run may not bloom even where linear theory says
#  unstable — the boundary there is SOFT and run-length-dependent. We never paint
#  a hard critical density; the band is a thing you find on the dial.
#
#  Usage:  bash verify.sh
# ============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "— The Phantom Jam: re-proving grow, the two-sided decay, the backward wave, and the derived↔observed agreement —"
node "$DIR/core.test.mjs"

echo "PASS — the Node twin is green: one tap blooms a jam above critical density, the ring heals below it (and packed too tight), the jam crawls backward at a constant speed, and the derived threshold foretells the sim. No hard critical density is painted on the wall — the lower-root boundary is soft."
