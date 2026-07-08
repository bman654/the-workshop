#!/usr/bin/env bash
# ============================================================================
#  The Overtone Rack — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: the amplitude laws are
#  1/n, the additive sum is the trace, the tolerance-GCD estimator recovers f₀
#  with the fundamental pulled, and an inharmonic rack makes it FAIL. This script
#  proves the SOUND matches: it renders the SAME additive law through the page's
#  offline render to three WAVs, then has the audio-lens skill (which CANNOT
#  hear) read them back as spectral peaks + centroid + a clip check + spectrograms.
#
#  The canonical recipe is an all-1/n sawtooth on 8 partials at f0 = 220 Hz, so
#  the loudest partials are the lowest ones and dominate the top-3 spectral peaks
#  (Facet risk-4 mitigation). The asserts compare SPACING, not exact frequency:
#    1. HARMONIC — top-3 peaks evenly spaced (max/min consecutive-gap ratio < 1.15)
#       and each spacing is an integer multiple of f0 within 5%.
#    2. INHARMONIC — top-3 peaks NOT integer multiples of f0 (they fail the same
#       f0-grid test the harmonic peaks pass) and the spacing has fanned out:
#       n^1.4 breaks the common fundamental (the audible twin of estimateF0 → fail).
#    3. PULLED — peaks still on the f0-grid (gap ratio < 1.15) AND no peak within
#       5% of f0 (the fundamental is truly absent) AND centroid(pulled) >
#       centroid(harmonic) (energy shifted up) — yet the implied grid still points
#       at f0.
#    4. --clips false on all three (the compressor + per-partial trim tame it).
#
#  Renders are produced in a browser (the offline render is Web Audio). To make
#  the WAVs: serve the repo, open the leaf, and in the console run:
#     window.__renderRack(6, {}).then(b => /* save as rack-harm.wav   */)
#     window.__renderRack(6, {pullFundamental:true}).then(b => /* rack-pulled.wav */)
#     window.__renderRack(6, {inharmonic:true}).then(b => /* save as rack-inh.wav */)
#  Then point this script at the three WAVs.
#
#  Usage:  bash verify.sh <rack-harm.wav> <rack-pulled.wav> <rack-inh.wav>
# ============================================================================
set -euo pipefail

HARM="${1:?path to the harmonic WAV is required}"
PULL="${2:?path to the pulled WAV is required}"
INH="${3:?path to the inharmonic WAV is required}"
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
F0=220

# emit the top-3 peak freqs (sorted ascending) as space-separated Hz
peaks() { node "$LENS" analyze "$1" --peaks --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).peaks.map(x=>x.freq).sort((a,b)=>a-b);console.log(p.join(" "));})'; }
centroid() { node "$LENS" analyze "$1" --centroid --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).centroid))'; }
clips() { node "$LENS" analyze "$1" --clips --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

HARM_P=$(peaks "$HARM"); PULL_P=$(peaks "$PULL"); INH_P=$(peaks "$INH")
HARM_C=$(centroid "$HARM"); PULL_C=$(centroid "$PULL")
HARM_CL=$(clips "$HARM"); PULL_CL=$(clips "$PULL"); INH_CL=$(clips "$INH")

echo "harmonic  peaks: $HARM_P   centroid $HARM_C   clips $HARM_CL"
echo "pulled    peaks: $PULL_P   centroid $PULL_C   clips $PULL_CL"
echo "inharmonic peaks: $INH_P                       clips $INH_CL"

node "$LENS" analyze "$HARM" --spectrogram "$(dirname "$HARM")/spec-harm.png"   --json >/dev/null
node "$LENS" analyze "$PULL" --spectrogram "$(dirname "$PULL")/spec-pulled.png" --json >/dev/null
node "$LENS" analyze "$INH"  --spectrogram "$(dirname "$INH")/spec-inh.png"     --json >/dev/null
echo "spectrograms → spec-harm.png (even f0-grid) · spec-pulled.png (grid, no bottom rung) · spec-inh.png (fanned gaps)"

# the four assertions, in Node (float math + the f0-grid integer-multiple test).
node - "$F0" "$HARM_P" "$PULL_P" "$INH_P" "$HARM_C" "$PULL_C" "$HARM_CL" "$PULL_CL" "$INH_CL" <<'NODE'
const [,, f0s, harmS, pullS, inhS, harmC, pullC, hcl, pcl, icl] = process.argv;
const f0 = +f0s;
const parse = s => s.trim().split(/\s+/).map(Number).filter(x=>x>0).sort((a,b)=>a-b);
const harm = parse(harmS), pull = parse(pullS), inh = parse(inhS);
// consecutive-gap ratio (max gap / min gap) — ~1 means evenly spaced
function gapRatio(p){ if (p.length < 2) return Infinity;
  const g=[]; for (let i=1;i<p.length;i++) g.push(p[i]-p[i-1]);
  return Math.max(...g)/Math.min(...g); }
// is every consecutive gap an integer multiple of f0 within tol? (the grid test)
function onGrid(p, tol=0.05){ for (let i=1;i<p.length;i++){ const g=p[i]-p[i-1];
  const n=Math.round(g/f0); if (n<1 || Math.abs(g/f0-n)/n > tol) return false; } return true; }
// also: each peak itself sits on n·f0 within tol
function peaksOnGrid(p, tol=0.05){ for (const f of p){ const n=Math.round(f/f0);
  if (n<1 || Math.abs(f/f0-n)/n > tol) return false; } return true; }
const near = (a,b,tol=0.05)=>Math.abs(a-b)/b <= tol;

let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

const hr = gapRatio(harm);
log(hr < 1.15 && onGrid(harm) && peaksOnGrid(harm),
    `1. HARMONIC peaks evenly spaced on the f0-grid (gap ratio ${hr.toFixed(3)} < 1.15, each ≈ n·${f0} Hz)`);

// the INHARMONIC discriminator: the peaks are NOT integer multiples of f0 (they
// fail the same f0-grid test the harmonic peaks pass) — the meaningful signal,
// the audible twin of estimateF0 returning ok:false. The gap ratio is also
// strictly larger than the harmonic's near-1, confirming the spacing fanned.
const ir = gapRatio(inh);
log(!peaksOnGrid(inh) && ir > hr + 0.1,
    `2. INHARMONIC peaks NOT on the f0-grid (each peak ≉ n·${f0} Hz) and spacing fanned (gap ratio ${ir.toFixed(3)} > harmonic ${hr.toFixed(3)}) — n^1.4 breaks the common fundamental`);

const pr = gapRatio(pull);
const noFund = !pull.some(f => near(f, f0));
log(pr < 1.15 && onGrid(pull) && noFund && (+pullC > +harmC),
    `3. RESIDUE survives the pull (gap ratio ${pr.toFixed(3)} < 1.15 on the f0-grid · no peak within 5% of ${f0} Hz: ${noFund} · centroid ${(+pullC).toFixed(0)} > harmonic ${(+harmC).toFixed(0)})`);

log(hcl==='false' && pcl==='false' && icl==='false',
    `4. no clipping on any of the three (${hcl}/${pcl}/${icl})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — the partials sit on an even f0-grid; pull the fundamental and the grid (so the pitch) survives with the bottom rung gone; an inharmonic retune fans the gaps and breaks the grid. The sound matches the math.');
NODE
