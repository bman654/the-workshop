#!/usr/bin/env bash
# ============================================================================
#  The Comb — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: the feedforward comb
#  |H(f)| = |1 + g·e^(−j2πfτ)| has its first notch at EXACTLY 1/(2τ) and teeth
#  spaced 1/τ; a rendered probe is annihilated on the notches and doubled on the
#  peaks; and τ=0 / g=0 are dead flat. THIS script proves the SOUND matches: it
#  renders the SAME delay-and-add (offline, Web Audio — a literal DelayNode) on a
#  FIXED 3-tone probe, then has the audio-lens skill (which CANNOT hear) read the
#  WAVs back as spectral peaks + a clip check + spectrograms.
#
#  THE STATED SEAM (held everywhere — page, this script, the worklog/CHANGELOG):
#  the LIVE instrument lets the hand sweep τ/g freely over pink noise or a tone. The
#  HEARD-headless claim is made ONLY here, on the SAME delay-and-add at a FIXED probe
#  chosen so every checked tone sits inside the audio-lens's usable window (60 Hz
#  peak-pick floor … 5 kHz ceiling): with τ pinned to 1.0 ms the comb has PEAKS at
#  n/τ = …,1000,2000,… Hz and NOTCHES at (n+½)/τ = 500,1500,2500,… Hz. The probe puts
#  ONE tone on a PEAK (1000 Hz) and TWO on NOTCHES (500, 1500 Hz) — three tones, each
#  ≥500 Hz apart (far past the lens's 3% same-note dedup), all in-band, so they read
#  as DISTINCT peaks and the lens's top-3 captures every survivor.
#
#  THE THREE RENDERS:
#    • HERO (τ=1.0 ms, g=1.0) — the deep feedforward comb. The two NOTCH tones (500,
#      1500 Hz) are ANNIHILATED (they sit on (n+½)/τ where |H|=0); only the PEAK tone
#      (1000 Hz) survives, doubled. top-3 = {1000} alone.
#    • NEG-τ (τ=0, g=1.0) — the echo lands ON the original: y = 2x, a flat gain, NO
#      comb. All three tones survive equally → the notch tones RE-APPEAR. The DELAY
#      armed the comb; remove it and the teeth vanish.
#    • NEG-g (τ=1.0 ms, g=0) — the echo is silent: y = x, untouched, NO comb. Again
#      all three survive → the notch tones RE-APPEAR. The echo GAIN armed the comb too.
#
#  The asserts (in Node):
#    0. PRECONDITION — the peak tone 1000 Hz AND the notch tones {500,1500} ALL sit
#       inside 60…5000 Hz, and the tone gap (500 Hz) / lowest tone > 3% (so the lens
#       dedup keeps them distinct). Fails LOUDLY so a future retune can't slide a
#       checked tone under the floor / ceiling / dedup.
#    1. HERO — a peak at 1000 Hz IS present AND NEITHER notch tone (500/1500 Hz) is:
#       the comb annihilated the tones parked on its teeth.
#    2. NEG-τ — the comb is gone: BOTH notch tones (500, 1500 Hz) ARE present again
#       (the teeth vanished when the delay collapsed).
#    3. NEG-g — same with the gain at 0: BOTH notch tones ARE present again.
#    4. --clips false on all three (the per-tone trim + the bounded feedforward gain
#       1+g ≤ 2 keep every render under full scale).
#
#  Renders are produced in a browser (the offline render is Web Audio). To make the
#  WAVs: serve the repo, open the leaf, and in the console run:
#     window.__renderComb(2, {tau:0.001, g:1.0}).then(b => /* save comb-hero.wav  */)
#     window.__renderComb(2, {tau:0,     g:1.0}).then(b => /* save comb-negtau.wav */)
#     window.__renderComb(2, {tau:0.001, g:0  }).then(b => /* save comb-negg.wav   */)
#  (window.__renderComb renders the SAME delay-and-add at the pinned probe — the live
#  UI's τ/g are NOT used by the render hook; the hook pins the probe so the claim is
#  stable.) Then point this script at the three WAVs.
#
#  Usage:  bash verify.sh <comb-hero.wav> <comb-negtau.wav> <comb-negg.wav>
# ============================================================================
set -euo pipefail

HERO="${1:?path to the hero (τ=1ms,g=1) WAV is required}"
NEGT="${2:?path to the neg-τ (τ=0) WAV is required}"
NEGG="${3:?path to the neg-g (g=0) WAV is required}"
LENS="${AUDIO_LENS:-$HOME/.claude/skills/audio-lens/bin/audio-lens.js}"
PEAK=1000      # the comb PEAK tone n/τ — survives the comb
N1=500         # the first comb NOTCH tone (0+½)/τ — annihilated by the comb
N2=1500        # the second comb NOTCH tone (1+½)/τ — annihilated by the comb
SR=24000       # the render sample rate (the offline AudioContext rate)
FFT=4096       # one FFT bin = SR/FFT = 5.86 Hz

# emit the top-3 peak freqs (sorted ascending) as space-separated Hz
peaks() { node "$LENS" analyze "$1" --peaks --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).peaks.map(x=>x.freq).sort((a,b)=>a-b);console.log(p.join(" "));})'; }
clips() { node "$LENS" analyze "$1" --clips --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips))'; }

HERO_P=$(peaks "$HERO"); NEGT_P=$(peaks "$NEGT"); NEGG_P=$(peaks "$NEGG")
HERO_CL=$(clips "$HERO"); NEGT_CL=$(clips "$NEGT"); NEGG_CL=$(clips "$NEGG")

echo "hero  (τ=1ms,g=1) peaks: $HERO_P   clips $HERO_CL"
echo "neg-τ (τ=0)       peaks: $NEGT_P   clips $NEGT_CL"
echo "neg-g (g=0)       peaks: $NEGG_P   clips $NEGG_CL"

node "$LENS" analyze "$HERO" --fft "$FFT" --spectrogram "$(dirname "$HERO")/spec-hero.png" --json >/dev/null
node "$LENS" analyze "$NEGT" --fft "$FFT" --spectrogram "$(dirname "$NEGT")/spec-negtau.png" --json >/dev/null
echo "spectrograms → spec-hero.png (only the 1000 Hz peak survives, the 500/1500 notch tones cut away) · spec-negtau.png (all three tones present — the comb is gone)"

# the assertions, in Node (the one-FFT-bin tolerance + the precondition guard).
node - "$PEAK" "$N1" "$N2" "$SR" "$FFT" "$HERO_P" "$NEGT_P" "$NEGG_P" "$HERO_CL" "$NEGT_CL" "$NEGG_CL" <<'NODE'
const [,, peakS, n1S, n2S, srs, ffts, heroS, negtS, neggS, hcl, ntcl, ngcl] = process.argv;
const PEAK = +peakS, N1 = +n1S, N2 = +n2S, SR = +srs, FFT = +ffts;
const BIN = SR / FFT;                          // one FFT bin in Hz
const parse = s => s.trim().split(/\s+/).map(Number).filter(x=>x>0).sort((a,b)=>a-b);
const hero = parse(heroS), negt = parse(negtS), negg = parse(neggS);
const near = (arr, f) => arr.some(p => Math.abs(p - f) <= 2*BIN);   // within two FFT bins of f

let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// precondition: the lens band still holds — the peak tone AND both notch tones all
// inside the lens window (60…5000 Hz), and the tone gap (N2−PEAK = 500 Hz) over the
// lowest tone > 3% so the lens's 3% same-note dedup keeps them distinct. A future
// retune that slides any checked tone under the floor / over the ceiling / inside the
// dedup band trips THIS before the soft asserts run.
const checked = [N1, PEAK, N2];
const allInBand = checked.every(f => f >= 60 && f <= 5000);
const gapOK = (PEAK - N1) / N1 > 0.03;
log(allInBand && gapOK,
    `0. precondition: peak tone ${PEAK} Hz and notch tones {${N1}, ${N2}} Hz all inside the lens band 60…5000 Hz, and the tone gap ${PEAK-N1} Hz / ${N1} Hz = ${((PEAK-N1)/N1*100).toFixed(1)}% > 3% (above the dedup floor) — bin = ${BIN.toFixed(2)} Hz`);

// HERO (τ=1ms, g=1): the PEAK tone survives (doubled) AND NEITHER notch tone is
// present — the comb annihilated the tones parked on its teeth (n+½)/τ.
log(near(hero, PEAK) && !near(hero, N1) && !near(hero, N2),
    `1. HERO (τ=1ms, g=1): the peak tone ${PEAK} Hz IS present (survived, doubled) AND neither notch tone ${N1}/${N2} Hz is — the comb annihilated the tones sitting on its teeth (n+½)/τ`);

// NEG-τ (τ=0): the comb is gone — BOTH notch tones re-appear (the teeth vanished
// when the delay collapsed). The DELAY armed the comb.
log(near(negt, N1) && near(negt, N2) && near(negt, PEAK),
    `2. NEG-τ (τ=0): the echo landed ON the original — BOTH notch tones ${N1}/${N2} Hz ARE present again (plus the peak ${PEAK} Hz): no delay, no teeth, the comb vanished`);

// NEG-g (g=0): the comb is gone — BOTH notch tones re-appear (the echo is silent).
// The echo GAIN armed the comb too.
log(near(negg, N1) && near(negg, N2) && near(negg, PEAK),
    `3. NEG-g (g=0): the echo is silent — BOTH notch tones ${N1}/${N2} Hz ARE present again (plus the peak ${PEAK} Hz): no echo, no teeth, the comb vanished`);

log(hcl==='false' && ntcl==='false' && ngcl==='false',
    `4. no clipping on any render (hero ${hcl} / neg-τ ${ntcl} / neg-g ${ngcl})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — at τ=1 ms, g=1 the delay-and-add carves a comb whose teeth land on (n+½)/τ: the tones parked there (500, 1500 Hz) are annihilated while the one on a peak (1000 Hz) survives. Collapse the delay (τ=0) OR silence the echo (g=0) and the comb vanishes — the notch tones re-appear. The sound matches the math. (lens-checked at τ=1 ms, probe 500/1000/1500 Hz — the same delay-and-add, pinned to a band where every checked tone clears the 60 Hz floor, the 5 kHz ceiling, and the 3% dedup.)');
NODE
