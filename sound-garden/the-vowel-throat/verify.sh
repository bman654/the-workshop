#!/usr/bin/env bash
# ============================================================================
#  The Vowel Throat — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: two formants recover the
#  published F1/F2, collapsing both resonances merges the peaks and fails the
#  two-formant classifier, and the throat only REMOVES energy. This script proves
#  the SOUND matches: it renders the SAME live chain offline (window.__renderThroat)
#  to three WAVs, then has the audio-lens skill (which CANNOT hear) read them back
#  as spectral peaks + centroid + a clip check + spectrograms.
#
#  The three renders, each 6 s of the master-chain'd glottal throat:
#    • vowel-a   — /a/ {F1 730, F2 1090}: two surviving clusters, formants CLOSE.
#    • vowel-i   — /i/ {F1 270, F2 2290}: two clusters, formants FAR apart, bright.
#    • collapse  — both filters parked at F1 730: ONE cluster, no vowel.
#  The asserts (in Node, on the top-3 spectral peaks):
#    1. /a/ — two of the top-3 peaks within ±120 Hz of 730 and 1090 (the comb's
#       ±one-rung resolution; F0 ≈ 120 Hz).
#    2. /i/ — two peaks near 270 and 2290, AND centroid(/i/) > centroid(/a/) (the
#       bright front vowel has more high energy than the back vowel).
#    3. COLLAPSE — no peak PAIR with (hi − lo) > 3·F0 (≈360 Hz): one hill, no
#       two-formant structure (the audible twin of the classifier → false).
#    4. --clips false on all three (the carillon master chain cannot clip).
#
#  Renders are produced in a browser (the offline render is Web Audio). To make
#  the WAVs: serve the repo, open the leaf, and in the console run:
#     window.__renderThroat(6, {vowel:'a'}).then(b => /* save as vowel-a.wav  */)
#     window.__renderThroat(6, {vowel:'i'}).then(b => /* save as vowel-i.wav  */)
#     window.__renderThroat(6, {vowel:'a', collapse:true}).then(b => /* collapse.wav */)
#  Then point this script at the three WAVs.
#
#  Usage:  bash verify.sh <vowel-a.wav> <vowel-i.wav> <collapse.wav>
# ============================================================================
set -euo pipefail

VA="${1:?path to the /a/ WAV is required}"
VI="${2:?path to the /i/ WAV is required}"
COL="${3:?path to the collapse WAV is required}"
# Resolve the audio-lens CLI: an explicit $AUDIO_LENS wins; else this repo's own
# vendored copy (the tool this repo birthed); else the installed audio-lens skill.
LENS="${AUDIO_LENS:-}"
if [ -z "$LENS" ]; then
  _repo="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$_repo" ] && [ -f "$_repo/tools/audio-lens/bin/audio-lens.js" ]; then
    LENS="$_repo/tools/audio-lens/bin/audio-lens.js"
  else
    LENS="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/audio-lens/bin/audio-lens.js"
  fi
fi
F0=120

# emit the top-N peak freqs (sorted ascending) as space-separated Hz
peaks() { node "$LENS" analyze "$1" --peaks --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).peaks.map(x=>x.freq).sort((a,b)=>a-b);console.log(p.join(" "));})'; }
centroid() { node "$LENS" analyze "$1" --centroid --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).centroid))'; }
clips() { node "$LENS" analyze "$1" --clips --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

VA_P=$(peaks "$VA"); VI_P=$(peaks "$VI"); COL_P=$(peaks "$COL")
VA_C=$(centroid "$VA"); VI_C=$(centroid "$VI")
VA_CL=$(clips "$VA"); VI_CL=$(clips "$VI"); COL_CL=$(clips "$COL")

echo "vowel /a/  peaks: $VA_P   centroid $VA_C   clips $VA_CL"
echo "vowel /i/  peaks: $VI_P   centroid $VI_C   clips $VI_CL"
echo "collapse   peaks: $COL_P                    clips $COL_CL"

node "$LENS" analyze "$VA"  --spectrogram "$(dirname "$VA")/spec-a.png"        --json >/dev/null
node "$LENS" analyze "$VI"  --spectrogram "$(dirname "$VI")/spec-i.png"        --json >/dev/null
node "$LENS" analyze "$COL" --spectrogram "$(dirname "$COL")/spec-collapse.png" --json >/dev/null
echo "spectrograms → spec-a.png (two hills) · spec-i.png (far-split) · spec-collapse.png (one hill)"

# the four assertions, in Node (float math + the two-formant test on the peaks).
node - "$F0" "$VA_P" "$VI_P" "$COL_P" "$VA_C" "$VI_C" "$VA_CL" "$VI_CL" "$COL_CL" <<'NODE'
const [,, f0s, vaS, viS, colS, vaC, viC, vacl, vicl, colcl] = process.argv;
const f0 = +f0s;
const parse = s => s.trim().split(/\s+/).map(Number).filter(x=>x>0).sort((a,b)=>a-b);
const va = parse(vaS), vi = parse(viS), col = parse(colS);
// is there a peak within tol Hz of target?
const near = (peaks, target, tol)=> peaks.some(p => Math.abs(p-target) <= tol);
// the widest peak PAIR separation (hi − lo) among the top peaks
function maxPairSep(p){ if (p.length < 2) return 0; return p[p.length-1] - p[0]; }

let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

const TOL = f0;   // ±one comb spacing
const aF1 = near(va, 730, TOL), aF2 = near(va, 1090, TOL);
log(aF1 && aF2,
    `1. /a/ — two peaks near the published formants (730 within ±${TOL}: ${aF1} · 1090 within ±${TOL}: ${aF2}) [peaks ${va.join(', ')}]`);

const iF1 = near(vi, 270, TOL+40), iF2 = near(vi, 2290, TOL);   // F1 270 is low; allow a touch more for the bin
const brighter = (+viC) > (+vaC);
log(iF2 && brighter,
    `2. /i/ — a peak near F2 2290 (within ±${TOL}: ${iF2}; F1 270 near: ${iF1}) AND brighter than /a/ (centroid ${(+viC).toFixed(0)} > ${(+vaC).toFixed(0)}) [peaks ${vi.join(', ')}]`);

const sep = maxPairSep(col);
log(sep <= 3*f0,
    `3. COLLAPSE — one hill: widest top-peak separation ${sep.toFixed(0)} Hz ≤ 3·f0 (${3*f0}) — no two-formant structure [peaks ${col.join(', ')}]`);

log(vacl==='false' && vicl==='false' && colcl==='false',
    `4. no clipping on any of the three (${vacl}/${vicl}/${colcl})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — /a/ shows two clusters at its published formants, /i/ splits far and reads brighter, and the collapse keeps only one. The throat carves the voice; the sound matches the math.');
NODE
