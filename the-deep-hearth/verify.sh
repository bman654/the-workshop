#!/usr/bin/env bash
# The Deep Hearth — verify gate. Thin wrapper over the Conduit's Node twin.
# Runs the shared runCoreTests() (rendered march === predicate over the dial grid,
# monotone boundary, φ_c=¾ boundary, neg-controls), the φ-monotone-toward-vent
# study, the fine 60×60 grid sweep, the coupling/viscosity monotonicity, the
# byte-parity check that conduit/index.html's inlined DEEP-HEARTH CORE region is
# byte-identical to core.mjs, and the single-source grep. Exits its code.
set -e
cd "$(dirname "$0")"
node conduit/core.test.mjs
node melting-floor/core.test.mjs
