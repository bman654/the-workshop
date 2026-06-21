#!/usr/bin/env bash
# ============================================================================
#  The Murmuration Meter — the headless-twin check (visual exhibit, NOT audio).
#
#  This is a NUMERICAL / VISUAL piece, so the verify is just the Node twin: it
#  re-proves the four proven claims and the single-source discipline. No WAVs,
#  no audio-lens.
#
#  The four proven claims:
#    • ROTATION-INVARIANT — rotating the whole flock leaves φ unchanged (<1e-12).
#    • ANCHOR η=0         — with no noise the flock locks into one mind (1−φ<1e-6).
#    • ANCHOR η=2π        — at full noise the order sits on the 1/√N floor
#                            (φ̄·√N = O(1) across two scales — a law, not a number).
#    • MONOTONE           — φ(η) only ever falls as the noise rises (and collapses
#                            from one mind to a milling crowd). NO precise η_c is
#                            ever claimed: the crossover is soft, density/N-dependent.
#  Plus byte-twin parity (the page's inlined core === core.mjs) and single-source.
#
#  Usage:  bash verify.sh
# ============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "— The Murmuration Meter: re-proving rotation-invariance, the two anchors, monotone collapse, and single-source —"
node "$DIR/core.test.mjs"

echo "PASS — the Node twin is green: φ is rotation-blind, the two ends anchor, order only falls as noise rises, and the physics is single-sourced. No η_c is painted on the wall."
