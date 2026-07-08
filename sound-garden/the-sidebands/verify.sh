#!/usr/bin/env bash
# ============================================================================
#  The Sidebands — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: each sideband amplitude
#  is |Jₙ(β)| over an (n,β) grid to <1e-9, energy is conserved ΣₙJₙ(β)² == 1, and
#  the carrier null is real — |J₀(2.4048255…)| < tol at the first zero of J₀. This
#  script proves the SOUND matches: it renders the SAME FM chain (offline, Web
#  Audio) to three WAVs at an AUDIBLE carrier band, then has the audio-lens skill
#  (which CANNOT hear) read them back as spectral peaks + a clip check + spectrograms.
#
#  THE STATED SEAM (held everywhere — page, this script, the worklog/CHANGELOG):
#  the LIVE instrument lets the hand sweep fc/fm/β freely and its hero default may
#  put the carrier or salient sidebands anywhere. The HEARD-headless claim is made
#  ONLY here, on the SAME FM law at a FIXED lens band chosen so every partial the
#  asserts touch sits inside the audio-lens's usable window (60 Hz peak-pick floor …
#  5 kHz ceiling): carrier fc = 1200 Hz, modulator fm = 500 Hz. Then the comb teeth
#  fc±n·fm land at … 200, 700, 1200, 1700, 2200, 2700 … Hz — all in-band, and each
#  adjacent tooth is fm/fc = 41.7% apart, far past the lens's 3% same-note dedup, so
#  the carrier and its sidebands read as DISTINCT peaks (Tartini renders its claim an
#  octave up for the same reason; this bench picks a band, not a transpose).
#
#  THE β CHOICE — why the hero is β=1.0, not the live default. The lens keeps only
#  the THREE loudest in-band peaks. At many β the symmetric ±1 sidebands |J₁(β)| are
#  LOUDER than the carrier |J₀(β)| (e.g. β=2.0: J₀=0.224 but J₁=0.577), so the carrier
#  is present yet shoved out of the top-3 — a false miss. β=1.0 is chosen because there
#  J₀=0.765 is the unambiguous #1 peak (J₁=0.440, J₂=0.115), so "carrier present" is a
#  clean top-3 hit. The NULL render is β=2.4048255… (the first zero of J₀): J₀≈0 so the
#  carrier drops out entirely while J₁=0.519, J₂=0.432 flood the sidebands — the audible
#  twin of |J₀|≈0. The NEG control is β=0: the whole comb collapses to a lone pure
#  carrier (every sideband a true zero), so the lens reports the carrier ALONE.
#
#  The asserts (in Node):
#    0. PRECONDITION — the carrier fc AND the checked sidebands {fc±fm, fc±2fm} ALL
#       sit inside 60…5000 Hz, and the carrier↔sideband gap fm/fc > 3% (so the lens
#       dedup keeps them distinct). Fails LOUDLY so a future retune can't silently
#       slide the carrier or a checked tooth under the lens floor / ceiling / dedup.
#    1. HERO (β=1.0) — a spectral peak within ONE FFT bin of the carrier fc is present
#       (the carrier rung is alight) AND sideband energy is present (fc±fm in top-3).
#    2. NULL (β=2.4048…) — NO peak within one FFT bin of fc (the carrier rung is DARK,
#       the audible twin of |J₀|≈0) WHILE sideband energy IS present (fc±fm/fc±2fm in
#       top-3): the loudest part of the sound vanished and energy fled to the sides.
#    3. NEG (β=0) — the carrier IS present AND there is NO sideband peak at fc±fm: the
#       comb collapsed to a lone pure tone (every Jₙ≠0 is a true zero).
#    4. --clips false on all three renders (headroom tames it; the FM amplitude is
#       held below full scale so even the worst comb sums clean).
#
#  Renders are produced in a browser (the offline render is Web Audio). To make the
#  WAVs: serve the repo, open the leaf, and in the console run:
#     window.__renderSidebands(2, {beta:1.0   }).then(b => /* save sb-hero.wav */)
#     window.__renderSidebands(2, {beta:2.4048255576957728}).then(b => /* sb-null.wav */)
#     window.__renderSidebands(2, {beta:0.0   }).then(b => /* save sb-neg.wav  */)
#  (window.__renderSidebands renders the SAME FM chain at the LENS BAND fc=1200/fm=500,
#  exactly as window.__renderTartini renders the Tartini horn — the live UI's fc/fm/β
#  are NOT used by the render hook; the hook pins the lens band so the claim is stable.)
#  Then point this script at the three WAVs.
#
#  Usage:  bash verify.sh <sb-hero.wav> <sb-null.wav> <sb-neg.wav>
# ============================================================================
set -euo pipefail

HERO="${1:?path to the hero (β=1.0) WAV is required}"
NULL="${2:?path to the null (β=2.4048) WAV is required}"
NEG="${3:?path to the neg (β=0) WAV is required}"
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
FC=1200       # the carrier — the center rung that goes dark at the J₀ null
FM=500        # the modulator — the comb spacing fc±n·fm
SR=12000      # the render sample rate (the offline AudioContext rate)
FFT=4096      # one FFT bin = SR/FFT = 2.93 Hz

# emit the top-3 peak freqs (sorted ascending) as space-separated Hz
peaks() { node "$LENS" analyze "$1" --peaks --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).peaks.map(x=>x.freq).sort((a,b)=>a-b);console.log(p.join(" "));})'; }
clips() { node "$LENS" analyze "$1" --clips --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

HERO_P=$(peaks "$HERO"); NULL_P=$(peaks "$NULL"); NEG_P=$(peaks "$NEG")
HERO_CL=$(clips "$HERO"); NULL_CL=$(clips "$NULL"); NEG_CL=$(clips "$NEG")

echo "hero (β=1.0)   peaks: $HERO_P   clips $HERO_CL"
echo "null (β=2.40)  peaks: $NULL_P   clips $NULL_CL"
echo "neg  (β=0)     peaks: $NEG_P   clips $NEG_CL"

node "$LENS" analyze "$HERO" --fft "$FFT" --spectrogram "$(dirname "$HERO")/spec-hero.png" --json >/dev/null
node "$LENS" analyze "$NULL" --fft "$FFT" --spectrogram "$(dirname "$NULL")/spec-null.png" --json >/dev/null
node "$LENS" analyze "$NEG"  --fft "$FFT" --spectrogram "$(dirname "$NEG")/spec-neg.png"   --json >/dev/null
echo "spectrograms → spec-hero.png (carrier lit + sidebands) · spec-null.png (carrier DARK, sidebands lit) · spec-neg.png (lone carrier)"

# the assertions, in Node (the one-FFT-bin tolerance + the precondition guard).
node - "$FC" "$FM" "$SR" "$FFT" "$HERO_P" "$NULL_P" "$NEG_P" "$HERO_CL" "$NULL_CL" "$NEG_CL" <<'NODE'
const [,, fcs, fms, srs, ffts, heroS, nullS, negS, hcl, ncl, gcl] = process.argv;
const fc = +fcs, fm = +fms, SR = +srs, FFT = +ffts;
const BIN = SR / FFT;                          // one FFT bin in Hz
const parse = s => s.trim().split(/\s+/).map(Number).filter(x=>x>0).sort((a,b)=>a-b);
const hero = parse(heroS), nul = parse(nullS), neg = parse(negS);
const near = (arr, f) => arr.some(p => Math.abs(p - f) <= BIN);

let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// precondition: the lens band still holds — carrier fc AND the checked sidebands
// {fc±fm, fc±2fm} all inside the lens window (60…5000 Hz), and the carrier↔sideband
// gap fm/fc > 3% so the lens's 3% same-note dedup keeps them as distinct peaks. A
// future retune that slides any checked tooth under the floor / over the ceiling /
// inside the dedup band trips THIS before the soft asserts run.
const checked = [fc, fc - fm, fc + fm, fc - 2*fm, fc + 2*fm];
const allInBand = checked.every(f => f >= 60 && f <= 5000);
const gapOK = (fm / fc) > 0.03;
log(allInBand && gapOK,
    `0. precondition: carrier fc=${fc} Hz and checked sidebands {${checked.slice(1).join(', ')}} Hz all inside the lens band 60…5000 Hz, and the carrier↔sideband gap fm/fc = ${(fm/fc*100).toFixed(1)}% > 3% (above the dedup floor) — bin = ${BIN.toFixed(2)} Hz`);

// HERO (β=1.0): the carrier rung is alight (top-3 hit within one bin of fc) AND a
// sideband is present — the comb is real and the carrier dominates it.
log(near(hero, fc) && (near(hero, fc - fm) || near(hero, fc + fm)),
    `1. HERO (β=1.0): a peak within one FFT bin (±${BIN.toFixed(2)} Hz) of the carrier ${fc} Hz IS present (the carrier rung is lit) AND a sideband at ${fc}±${fm} Hz is present — the comb bloomed and the carrier leads it`);

// NULL (β=2.4048…): the carrier rung is DARK (NO peak within one bin of fc) WHILE
// the sidebands are present — the audible twin of |J₀(2.4048)|≈0: the loudest part
// of the sound vanished and the energy fled into the sidebands.
const nullSideband = near(nul, fc - fm) || near(nul, fc + fm) || near(nul, fc - 2*fm) || near(nul, fc + 2*fm);
log(!near(nul, fc) && nullSideband,
    `2. NULL (β=2.4048…): NO peak within one FFT bin of the carrier ${fc} Hz (the carrier rung is DARK — the audible twin of |J₀|≈0) WHILE sideband energy IS present (a tooth at ${fc}±${fm}/${fc}±${2*fm} Hz survives) — the carrier vanished, energy fled to the sides`);

// NEG (β=0): the comb collapses to a lone pure carrier — the carrier is present and
// there is NO sideband at fc±fm (every Jₙ≠0 is a true zero).
log(near(neg, fc) && !near(neg, fc - fm) && !near(neg, fc + fm),
    `3. NEG (β=0): the carrier ${fc} Hz IS present AND there is NO peak at fc±fm=${fc-fm}/${fc+fm} Hz — the comb collapsed to a lone pure tone (every sideband a true zero)`);

log(hcl==='false' && ncl==='false' && gcl==='false',
    `4. no clipping on any render (hero ${hcl} / null ${ncl} / neg ${gcl})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — push β and the FM comb blooms with the carrier leading (β=1.0); at the first zero of J₀ (β=2.4048…) the carrier rung goes DARK while the sidebands flood; β=0 collapses it to a lone pure tone. The sound matches the math. (lens-checked at fc=1200/fm=500 Hz — the same FM law, pinned to a band where every checked partial clears the 60 Hz floor, the 5 kHz ceiling, and the 3% dedup.)');
NODE
