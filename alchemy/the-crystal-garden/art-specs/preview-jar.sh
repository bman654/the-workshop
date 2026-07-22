#!/usr/bin/env bash
# preview a forged JAR-FRAME candidate. usage: bash preview-jar.sh <candidate.js> <outdir> <port>
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$HERE/_preview-common.sh" jar-frame.js "$1" "$2" "$3"
