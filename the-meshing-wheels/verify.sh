#!/usr/bin/env bash
# The Meshing Wheels — verify gate. Thin wrapper over the Node twin (gear-wing idiom).
# Runs the residue-map core's self-test + hand anchors + byte-twin parity; exits its code.
set -e
cd "$(dirname "$0")"
node core.test.mjs
