#!/usr/bin/env bash
# The Homicidal Chauffeur — verify gate. Thin wrapper over the Node twin (meshing-wheels idiom).
# Runs the four-claim self-test oracle, the heavy Dubins sweeps, the independent Newton-shooting
# oracle, the RK4 ODE-faithfulness study, the deterministic pursuit sims, and the byte-parity check
# that index.html's inlined CHAUFFEUR-CORE region is byte-identical to core.mjs. Exits its code.
set -e
cd "$(dirname "$0")"
node core.test.mjs
