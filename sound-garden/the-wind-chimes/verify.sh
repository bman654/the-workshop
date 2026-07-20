#!/usr/bin/env bash
# ============================================================================
#  The Wind Chimes — the AUDIBLE ear-check (audio-lens).
#
#  This is a DELIGHT-FIRST leaf; the Node twin (core.test.mjs) proves the payoff
#  FIRES and that the model the page plays is the model the twin drives. This script
#  proves the SOUND is what the room promises — the loop cannot hear, so the
#  audio-lens (which also cannot hear, but reads sound as numbers + a spectrogram)
#  stands in for ears. It confronts six rendered WAVs with the lens:
#
#    tube-0 … tube-4 — one strike on each tube, lowest → highest.
#    calm            — the room in dead calm: DIGITAL SILENCE.
#    gust            — all five tubes struck in a 45 ms cluster (the worst overlap).
#    carillon        — a render of the Sound Garden's Carillon, for the A/B.
#
#  THE ASSERTS (in Node):
#    1. IN TUNE — the tuning is this piece's ONE correctness constraint. Each tube's
#       FUNDAMENTAL must sit on its A-major-pentatonic pitch. This is measured with a
#       GOERTZEL probe at the exact target frequency versus ±50-cent neighbours, NOT
#       with a monophonic pitch estimator — deliberately. A struck tube is INHARMONIC
#       (partials at 1 : 2.756 : 5.404 : 8.933), and those overtones pull any f0
#       tracker flat: measured here, a pure 220 Hz sine reads +4¢ and the same
#       envelope on HARMONIC partials reads +3¢, while the real inharmonic tube reads
#       −31¢ — the pull is the estimator's, not the tube's. (This is the same reason
#       real bells have a whole "strike tone" literature.) The lens still names every
#       tube's NOTE correctly, which is checked too; the Goertzel is what pins the
#       cents. Both together are the honest statement.
#    2. RISE THEN DECAY — each tube shows ONE onset, an early loudness peak, and a
#       monotonically decaying tail (the payoff, in the audio itself).
#    3. LOWER TUBES RING LONGER — the tail length falls with pitch, as the longer
#       tubes' physics says it must.
#    4. DEAD CALM IS SILENT — the calm render is digital silence (silence-ratio 1).
#    5. NOTHING CLIPS — not one of the renders clips, including the five-tube gust.
#    6. NOT A BELL (the A/B) — the chime is audibly DISTINCT from the Carillon:
#       it is BRIGHTER (higher spectral centroid) and, decisively, it has NO
#       sub-octave HUM partial — the octave-below bin that is a bell's signature is
#       empty on the tube and present on the carillon. The wing gains no near-duplicate.
#
#  MAKING THE WAVs. Serve the repo, open the leaf, and use its headless hooks:
#     window.__renderChimeTube(i, 0.85, 9)   → tube-<i>.wav   (i = 0…4)
#     window.__renderChimeCalm(3)            → calm.wav
#     window.__renderChimeGust(6)            → gust.wav
#  and open ../carillon.html for the A/B reference:
#     window.__renderOffline(8, 3)           → carillon.wav
#  Each returns a WAV Blob. Put all seven in one directory and point this at it.
#
#  Usage:  bash verify.sh <wav-dir>
# ============================================================================
set -euo pipefail

DIR="${1:?path to the directory of rendered WAVs is required}"
for f in tube-0 tube-1 tube-2 tube-3 tube-4 calm gust carillon; do
  [ -f "$DIR/$f.wav" ] || { echo "missing $DIR/$f.wav — see the header for how to render it"; exit 1; }
done

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
FFT=4096

summ() { node "$LENS" analyze "$1" --fft "$FFT" --json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(JSON.stringify({f0:j.f0,note:(j.monoNote||{}).name,cents:(j.monoNote||{}).cents,centroid:j.centroid,clipping:j.clipping,meanRms:j.meanRms,peakDb:(j.peak||{}).peakDb,clipPct:(j.peak||{}).clipPct,onsets:j.onsets,silenceRatio:j.silenceRatio}));});'; }

echo "— the lens on each render —"
T0=$(summ "$DIR/tube-0.wav"); T1=$(summ "$DIR/tube-1.wav"); T2=$(summ "$DIR/tube-2.wav")
T3=$(summ "$DIR/tube-3.wav"); T4=$(summ "$DIR/tube-4.wav")
CALM=$(summ "$DIR/calm.wav"); GUST=$(summ "$DIR/gust.wav"); CAR=$(summ "$DIR/carillon.wav")
echo "tube-0 (A3) : $T0"
echo "tube-1 (B3) : $T1"
echo "tube-2 (C#4): $T2"
echo "tube-3 (E4) : $T3"
echo "tube-4 (F#4): $T4"
echo "calm        : $CALM"
echo "gust        : $GUST"
echo "carillon    : $CAR"

# spectrograms for the eye: a chime's four widely-spaced inharmonic stripes, versus
# the carillon's dense bell stack with its hum an octave under the strike tone.
node "$LENS" analyze "$DIR/tube-0.wav"   --fft "$FFT" --spectrogram "$DIR/spec-tube-0.png"   --json >/dev/null
node "$LENS" analyze "$DIR/gust.wav"     --fft "$FFT" --spectrogram "$DIR/spec-gust.png"     --json >/dev/null
node "$LENS" analyze "$DIR/carillon.wav" --fft "$FFT" --spectrogram "$DIR/spec-carillon.png" --json >/dev/null
echo "spectrograms → spec-tube-0.png (four wide inharmonic stripes) · spec-gust.png · spec-carillon.png (a dense bell stack, hum an octave down)"
echo

node - "$DIR" "$T0" "$T1" "$T2" "$T3" "$T4" "$CALM" "$GUST" "$CAR" <<'NODE'
const fs = require('fs');
const [,, dir, ...rest] = process.argv;
const [t0,t1,t2,t3,t4,calm,gust,car] = rest.map(s => JSON.parse(s));
const tubes = [t0,t1,t2,t3,t4];
let fail = 0; const log = (ok,msg)=>{ console.log((ok?'  ✓ ':'  ✗ ')+msg); if(!ok) fail=1; };

// ── the pitch law, re-derived here ONLY to state the expected targets (the page and
//    the core get theirs from sound-garden/pitch-core.mjs; this is the ear's ruler).
const MIDDLE_C_HZ = 261.625565;
const semiToFreq = s => MIDDLE_C_HZ * Math.pow(2, s/12);
const PENT = [-3,-1,1,4,6];
const NAMES = ['A3','B3','C#4','E4','F#4'];
const TARGET = PENT.map(semiToFreq);

// ── read a mono 16-bit WAV into a Float64Array (enough for these renders).
function readWav(p){
  const b = fs.readFileSync(p);
  let off = 12, sr = 44100, dataOff = -1, dataLen = 0;
  while (off + 8 <= b.length){
    const id = b.toString('ascii', off, off+4), sz = b.readUInt32LE(off+4);
    if (id === 'fmt ') sr = b.readUInt32LE(off+12);
    if (id === 'data'){ dataOff = off+8; dataLen = sz; break; }
    off += 8 + sz + (sz & 1);
  }
  const n = Math.floor(dataLen/2), out = new Float64Array(n);
  for (let i=0;i<n;i++) out[i] = b.readInt16LE(dataOff + i*2) / 32768;
  return { buf: out, sr };
}
// ── GOERTZEL: the energy at ONE exact frequency. This is how the fundamental's pitch
//    is pinned without an f0 tracker that inharmonic overtones can drag off target.
function goertzel(buf, sr, f, start, len){
  const N = Math.min(len, buf.length - start);
  const k = 2 * Math.cos(2*Math.PI*f/sr);
  let s0=0, s1=0, s2=0;
  for (let i=0;i<N;i++){ s0 = buf[start+i] + k*s1 - s2; s2 = s1; s1 = s0; }
  return Math.sqrt(s1*s1 + s2*s2 - k*s1*s2) / N;
}
const cents = (a,b) => 1200 * Math.log2(a/b);

// ── 1. IN TUNE (the one correctness constraint) ──────────────────────────────
{
  let ok = true; const rows = [];
  for (let i=0;i<5;i++){
    const { buf, sr } = readWav(dir + '/tube-' + i + '.wav');
    const win = Math.min(sr, buf.length);                 // 1 s from the onset
    const f = TARGET[i];
    // the fundamental must dominate its ±50-cent neighbourhood: if the tube were
    // even a quarter-tone off, a neighbour would win instead.
    const at   = goertzel(buf, sr, f, 0, win);
    const flat = goertzel(buf, sr, f*Math.pow(2,-50/1200), 0, win);
    const shrp = goertzel(buf, sr, f*Math.pow(2, 50/1200), 0, win);
    // and locate the true local peak by a fine sweep of ±60 cents
    let bestF = f, bestM = -1;
    for (let c=-60;c<=60;c+=1){ const ff = f*Math.pow(2,c/1200); const m = goertzel(buf, sr, ff, 0, win);
      if (m > bestM){ bestM = m; bestF = ff; } }
    const dev = cents(bestF, f);
    const dominates = at > flat*1.5 && at > shrp*1.5;
    const inTune = Math.abs(dev) <= 5;                    // ±5 cents of the exact pitch
    const named = tubes[i].note === NAMES[i];
    if (!(dominates && inTune && named)) ok = false;
    rows.push(`${NAMES[i]} want ${f.toFixed(2)}Hz → peak ${bestF.toFixed(2)}Hz (${dev>=0?'+':''}${dev.toFixed(1)}¢), dominates ±50¢ ${dominates}, lens names it "${tubes[i].note}" (its cents read ${tubes[i].cents}¢ — the inharmonic pull, not the tube)`);
  }
  log(ok, `1. IN TUNE (the one correctness constraint): every tube's FUNDAMENTAL sits on its A-pentatonic pitch within ±5¢, dominating its ±50-cent neighbourhood, and the lens names every note correctly —\n        ${rows.join('\n        ')}`);
}

// ── 2. RISE THEN DECAY, and 3. LOWER TUBES RING LONGER ──────────────────────
{
  let ok = true, okTail = true; const rows = [];
  const tails = [];
  for (let i=0;i<5;i++){
    const { buf, sr } = readWav(dir + '/tube-' + i + '.wav');
    // block-RMS envelope at 30 ms
    const w = Math.floor(sr*0.03), env = [];
    for (let s=0; s+w<=buf.length; s+=w){ let a=0; for (let j=s;j<s+w;j++) a+=buf[j]*buf[j]; env.push(Math.sqrt(a/w)); }
    let pi=0; for (let k=1;k<env.length;k++) if (env[k]>env[pi]) pi=k;
    const rose = pi > 0, early = pi*30 <= 150;
    let mono = true; for (let k=pi+1;k<env.length;k++) if (env[k] > env[k-1]*1.05) mono = false;
    const died = env[env.length-1] < env[pi]*0.15;
    // the tail: how long until it falls to 10% of peak
    let t10 = env.length; for (let k=pi;k<env.length;k++) if (env[k] < env[pi]*0.10){ t10 = k; break; }
    tails.push(t10*0.03);
    const one = tubes[i].onsets <= 1;
    if (!(rose && early && mono && died && one)) ok = false;
    rows.push(`${NAMES[i]}: peak at ${pi*30}ms (rose ${rose}), decay monotone ${mono}, ends at ${(env[env.length-1]/env[pi]*100).toFixed(1)}% of peak, ${tubes[i].onsets} onsets, 10%-tail ${(t10*0.03).toFixed(2)}s`);
  }
  log(ok, `2. RISE THEN DECAY (the payoff, in the audio): each tube is silent at onset, peaks within ~150 ms, then decays monotonically to a whisper, with ONE onset (a struck tube, not a switch) —\n        ${rows.join('\n        ')}`);
  for (let i=1;i<5;i++) if (tails[i] > tails[i-1] + 0.35) okTail = false;   // allow a small band
  log(okTail, `3. LOWER TUBES RING LONGER: the 10%-tail falls (or holds) as pitch rises — [${tails.map(t=>t.toFixed(2)).join('s, ')}s] for ${NAMES.join(' ')} — the long tube at the rack's edge is also the one that sings longest`);
}

// ── 4. DEAD CALM IS SILENT ──────────────────────────────────────────────────
log(calm.silenceRatio === 1 && calm.f0 == null && calm.meanRms < -100,
    `4. DEAD CALM IS DIGITAL SILENCE: with no wind the room renders silence-ratio ${calm.silenceRatio}, no f0, meanRms ${calm.meanRms} dB — nothing hums on its own; the sound was only ever the wind`);

// ── 5. NOTHING CLIPS ────────────────────────────────────────────────────────
{
  const all = [...tubes, calm, gust];
  const anyClip = all.some(x => x.clipping !== false);
  log(!anyClip && gust.clipping === false,
      `5. NOTHING CLIPS — not one render, including the five-tube GUST cluster (peak ${gust.peakDb} dBFS, clipping ${gust.clipping}): the soft tanh limiter means the worst overlap the wind can produce still has headroom`);
}

// ── 6. NOT A BELL — the A/B against the Carillon ────────────────────────────
{
  // (a) the chime is brighter than the bell
  const brighter = t0.centroid > car.centroid;
  // (b) THE DECISIVE ONE: a bell's signature HUM partial sits an octave BELOW its
  //     strike tone. A free-free tube has no partial below its fundamental at all.
  //     Measure the octave-below bin on each, relative to its own fundamental.
  const tw = readWav(dir + '/tube-0.wav');
  const f0 = TARGET[0];
  const tubeFund = goertzel(tw.buf, tw.sr, f0, 0, Math.min(tw.sr, tw.buf.length));
  const tubeHum  = goertzel(tw.buf, tw.sr, f0/2, 0, Math.min(tw.sr, tw.buf.length));
  const tubeHumRatio = tubeHum / tubeFund;
  // the carillon: find its strongest partial, then look an octave under it
  const cw = readWav(dir + '/carillon.wav');
  const win = Math.min(cw.sr*2, cw.buf.length);
  let bestF = 0, bestM = -1;
  for (let f=110; f<=900; f*=Math.pow(2,1/48)){ const m = goertzel(cw.buf, cw.sr, f, 0, win); if (m>bestM){bestM=m;bestF=f;} }
  const carHum = goertzel(cw.buf, cw.sr, bestF/2, 0, win);
  const carHumRatio = carHum / bestM;
  const tubeHasNoHum = tubeHumRatio < 0.02;
  const carHasHum = carHumRatio > tubeHumRatio * 3;
  const ok = brighter && tubeHasNoHum && carHasHum;
  log(ok, `6. NOT A BELL (the A/B — the wing gains no near-duplicate): the chime is BRIGHTER than the Carillon (centroid ${Math.round(t0.centroid)} Hz vs ${Math.round(car.centroid)} Hz), and decisively it has NO sub-octave HUM — the octave-below-fundamental bin holds ${(tubeHumRatio*100).toFixed(2)}% of the tube's fundamental (a free-free tube has no partial under its fundamental) against ${(carHumRatio*100).toFixed(1)}% for the carillon, whose hum an octave down is the defining mark of a bell`);
}

if (fail) { console.log('\nFAIL'); process.exit(1); }
console.log('\nPASS — five tubes, each ringing exactly its A-pentatonic pitch; every strike rises then decays with one onset; the longer tubes ring longer; dead calm is literal silence; nothing clips even when the wind strikes all five at once; and the voice is a struck TUBE, not a bell. The room sounds like what it says it is. (lens-checked; the loop cannot hear.)');
NODE
