#!/usr/bin/env bash
# preview a forged TUBE-MATERIAL candidate. usage: bash preview-tube.sh <candidate.js> <outdir> <port>
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$HERE/_preview-common.sh" tube-material.js "$1" "$2" "$3"
