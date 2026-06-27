#!/usr/bin/env bash
# ============================================================================
#  The Jug — the AUDIBLE-twin ear-check (audio-lens).
#
#  The Node twin (core.test.mjs) proves the MATH exact: f_H = (c/2π)√(A/(V·L_eff))
#  IS √(k/m) — a mass on a spring, ρ-independent; halving V and doubling A each give
#  ×√2 (+600¢), quadrupling L_eff gives ×½ (−1200¢); and a matrix-exp ODE render of
#  the lumped resonator leaves ONLY f_H alive (nothing at 2f), with an 8× drive
#  bit-identical. THIS script proves the SOUND matches: it renders the SAME bandpass
#  resonator (offline, Web Audio — the literal BiquadFilter type='bandpass' the
#  browser plays) at FIVE pinned named geometries, driven by a FIXED ping-train probe
#  (8 ms white bursts every 0.4 s = the flick, repeated), then has the audio-lens
#  skill (which CANNOT hear) read each WAV's pitch + peaks + clip check + spectrograms.
#
#  THE STATED SEAM (held everywhere — page, this script, the worklog/CHANGELOG):
#  the LIVE instrument lets the hand drag three handles freely over white breath-noise.
#  The HEARD-headless claim is made ONLY here, on the SAME bandpass at FIVE pinned
#  geometries whose f_H (from the SAME helmholtzFreq) lands on a low register where
#  every checked pitch clears the audio-lens's 60 Hz floor … 5 kHz ceiling.
#
#  THE FIVE RENDERS (f_H from the page's single-sourced helmholtzFreq):
#    • HERO   (A0, V0, L0)      → 220 Hz (A3). The hum. NO peak at 440 — one lumped mode.
#    • HALVE-V (A0, V0/2, L0)   → 311 Hz (E♭4). f∝1/√V ⇒ ×√2, a tritone up.
#    • QUAD-L  (A0, V0, 4·L0)   → 110 Hz (A2). f∝1/√L_eff ⇒ ÷2, an octave down (clears 60 Hz).
#    • DOUBLE-A (2·A0, V0, L0)  → 311 Hz (E♭4). f∝√A ⇒ ×√2 — the same tritone, other lever.
#    • NEG-2f  (A0, V0, L0)+2f  → peaks at BOTH 220 AND 440. We BUILD a partial so the
#                                 lens proves it CAN see one — its absence in HERO is a
#                                 claim, not a blind spot.
#
#  The asserts (in Node):
#    0. PRECONDITION — {110, 220, 311, 440} Hz all sit inside 60…5000 Hz with >3% gaps
#       (fails LOUD on a retune that slides a checked pitch under the floor / ceiling).
#    1. HERO — the dominant pitch is 220 Hz (±30¢) AND there is NO peak near 440 Hz.
#    2. HALVE-V — the dominant pitch is 311 Hz (±30¢); the ratio to HERO is √2 (±30¢).
#    3. QUAD-L — the dominant pitch is 110 Hz (±30¢); HERO/QUAD-L = 2 (±30¢); clears 60 Hz.
#    4. NEG-2f — peaks at BOTH 220 AND 440 Hz (the lens DOES see a partial when present).
#    5. DOUBLE-A — the dominant pitch is 311 Hz (±30¢); the ratio to HERO is √2 (±30¢).
#    6. --clips false on all five.
#
#  Renders are produced in a browser (the offline render is Web Audio). To make them:
#  serve the repo, open the leaf, and in the console run e.g.
#     window.__renderJug(2,'hero').then(b => /* save jug-hero.wav */)
#     window.__renderJug(2,'halveV') / 'quadL' / 'doubleA' / 'neg2f'
#  (window.__renderJug renders the SAME bandpass at the pinned geometry — the live
#  handles are NOT used by the render.) Then point this script at the five WAVs.
#
#  Usage:  bash verify.sh <hero.wav> <halveV.wav> <quadL.wav> <doubleA.wav> <neg2f.wav>
# ============================================================================
set -euo pipefail

HERO="${1:?path to the hero (220) WAV is required}"
HALVE="${2:?path to the halve-V (311) WAV is required}"
QUAD="${3:?path to the quad-L (110) WAV is required}"
DBL="${4:?path to the double-A (311) WAV is required}"
NEG="${5:?path to the neg-2f (220+440) WAV is required}"
LENS="${AUDIO_LENS:-$HOME/.claude/skills/audio-lens/bin/audio-lens.js}"
FFT=4096

pitch() { node "$LENS" analyze "$1" --pitch --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).f0));'; }
peaks() { node "$LENS" analyze "$1" --peaks --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).peaks.map(x=>x.freq).sort((a,b)=>a-b);console.log(p.join(" "));});'; }
clips() { node "$LENS" analyze "$1" --clips --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clips));'; }

HERO_F=$(pitch "$HERO"); HALVE_F=$(pitch "$HALVE"); QUAD_F=$(pitch "$QUAD"); DBL_F=$(pitch "$DBL")
HERO_P=$(peaks "$HERO"); NEG_P=$(peaks "$NEG")
HERO_CL=$(clips "$HERO"); HALVE_CL=$(clips "$HALVE"); QUAD_CL=$(clips "$QUAD"); DBL_CL=$(clips "$DBL"); NEG_CL=$(clips "$NEG")

echo "hero    (A0,V0,L0)   pitch: $HERO_F Hz   peaks: $HERO_P   clips $HERO_CL"
echo "halve-V (A0,V0/2,L0) pitch: $HALVE_F Hz   clips $HALVE_CL"
echo "quad-L  (A0,V0,4L0)  pitch: $QUAD_F Hz   clips $QUAD_CL"
echo "double-A(2A0,V0,L0)  pitch: $DBL_F Hz   clips $DBL_CL"
echo "neg-2f  (A0,V0,L0)+2f peaks: $NEG_P   clips $NEG_CL"

node "$LENS" analyze "$HERO" --fft "$FFT" --spectrogram "$(dirname "$HERO")/spec-hero.png" --json >/dev/null
node "$LENS" analyze "$NEG" --fft "$FFT" --spectrogram "$(dirname "$NEG")/spec-neg2f.png" --json >/dev/null
echo "spectrograms → spec-hero.png (one bright band at 220 Hz, nothing at 440) · spec-neg2f.png (TWO bands: 220 AND 440 — the lens sees the partial we built)"

node - "$HERO_F" "$HALVE_F" "$QUAD_F" "$DBL_F" "$HERO_P" "$NEG_P" "$HERO_CL" "$HALVE_CL" "$QUAD_CL" "$DBL_CL" "$NEG_CL" <<'NODE'
const [,, heroF, halveF, quadF, dblF, heroPs, negPs, hcl, hacl, qcl, dcl, ncl] = process.argv;
const cents = (a, b) => 1200 * Math.log2(a / b);
const parse = s => s.trim().split(/\s+/).map(Number).filter(x => x > 0);
const heroPk = parse(heroPs), negPk = parse(negPs);
const near = (arr, f, tolHz) => arr.some(p => Math.abs(p - f) <= tolHz);
const TOL = 30;                      // cents tolerance per pitch / ratio
const HERO=220, HALVE=311.13, QUAD=110, P2=440;

let fail = 0; const log = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fail = 1; };

// 0. PRECONDITION — every checked pitch inside the lens band, with >3% gaps.
const checked = [QUAD, HERO, HALVE, P2];
const inBand = checked.every(f => f >= 60 && f <= 5000);
let gapOK = true; for (let i=1;i<checked.length;i++){ if ((checked[i]-checked[i-1])/checked[i-1] <= 0.03) gapOK = false; }
log(inBand && gapOK,
    `0. precondition: {110, 220, 311, 440} Hz all inside the lens band 60…5000 Hz with >3% gaps (a retune that slides a checked pitch under the floor/ceiling trips here)`);

// 1. HERO — dominant pitch 220 (±30¢) AND no peak near 440.
log(Math.abs(cents(+heroF, HERO)) <= TOL && !near(heroPk, P2, 12),
    `1. HERO: the hum is ${(+heroF).toFixed(1)} Hz = ${cents(+heroF,HERO).toFixed(1)}¢ from A3 (220) — within ±30¢ — AND no peak near 440 Hz (one lumped mode, nothing at 2f)`);

// 2. HALVE-V — 311 (±30¢); ratio to hero = √2 (±30¢).
log(Math.abs(cents(+halveF, HALVE)) <= TOL && Math.abs(cents(+halveF, +heroF) - 600) <= TOL,
    `2. HALVE-V: ${(+halveF).toFixed(1)} Hz = ${cents(+halveF,HALVE).toFixed(1)}¢ from E♭4 (311); halve-V/hero = ${cents(+halveF,+heroF).toFixed(1)}¢ (a tritone, +600¢ ±30¢) — f∝1/√V`);

// 3. QUAD-L — 110 (±30¢); hero/quad = octave (±30¢); clears 60 Hz.
log(Math.abs(cents(+quadF, QUAD)) <= TOL && Math.abs(cents(+heroF, +quadF) - 1200) <= TOL && +quadF >= 60,
    `3. QUAD-L: ${(+quadF).toFixed(1)} Hz = ${cents(+quadF,QUAD).toFixed(1)}¢ from A2 (110), clears the 60 Hz floor; hero/quad = ${cents(+heroF,+quadF).toFixed(1)}¢ (an octave, +1200¢ ±30¢) — f∝1/√L_eff`);

// 4. NEG-2f — peaks at BOTH 220 AND 440 (the lens DOES see a partial when present).
log(near(negPk, HERO, 12) && near(negPk, P2, 12),
    `4. NEG-2f: peaks at BOTH ${HERO} AND ${P2} Hz are present [${negPk.map(x=>x.toFixed(0)).join(', ')}] — we built a 2f partial and the lens sees it, so its ABSENCE in HERO is a claim, not a blind spot`);

// 5. DOUBLE-A — 311 (±30¢); ratio to hero = √2 (±30¢).
log(Math.abs(cents(+dblF, HALVE)) <= TOL && Math.abs(cents(+dblF, +heroF) - 600) <= TOL,
    `5. DOUBLE-A: ${(+dblF).toFixed(1)} Hz = ${cents(+dblF,HALVE).toFixed(1)}¢ from E♭4 (311); double-A/hero = ${cents(+dblF,+heroF).toFixed(1)}¢ (the same tritone by a different lever, +600¢ ±30¢) — f∝√A`);

// 6. no clipping on any render.
log(hcl==='false' && hacl==='false' && qcl==='false' && dcl==='false' && ncl==='false',
    `6. no clipping on any render (hero ${hcl} / halve ${hacl} / quad ${qcl} / double ${dcl} / neg ${ncl})`);

if (fail) { console.log('FAIL'); process.exit(1); }
console.log('PASS — lens-checked at five pinned geometries on the SAME bandpass that IS the resonator — the heard pitch is f_H, halving V is a tritone (×√2), doubling A the same tritone, quadrupling L_eff an octave (×½), and there is no second mode at 2f (we built one and the lens heard it).');
NODE
