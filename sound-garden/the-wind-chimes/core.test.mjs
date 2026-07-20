// ============================================================================
//  THE WIND CHIMES — Node twin of the page's room. THE PAYOFF-LIVENESS TWIN.
//  Run:  node sound-garden/the-wind-chimes/core.test.mjs
//
//  This is a DELIGHT-FIRST leaf: it makes NO math claim and there is no in-page
//  proof pill. So this file does NOT prove a theorem — it proves the PAYOFF FIRES.
//  The house rule it answers to: a liveness twin must be HEADLESS-DRIVABLE and must
//  drive the room's OWN real entry function, never a synthetic canvas pointer event
//  (headless cannot deliver a tap on a canvas, so a liveness check that waited on one
//  would sail through green over a completely dead room).
//
//  So every leg below calls the SAME functions the live page calls:
//    · createChime()/gust()/step()  — exactly what the page's rAF loop drives;
//    · strikeTube()                 — exactly what a finger flicking a tube calls;
//    · renderStrike()/strikeEnvelope() — exactly what the page hands to its
//      AudioBuffer and what it draws each tube's glow from.
//  There is ONE path, and this is it.
//
//  It:
//    • runs the shared runChimeSelfTest (imported from ./core.mjs) — the six legs:
//      the wind moves it · a strike fires · the strike rises then decays · in tune
//      by construction · well-formed three ways · bounded in any wind;
//    • DEEPER Node-only re-derivations — the WIND→NOTES MAPPING is real (a soft
//      breeze reaches only the inner/high tubes; a gust sweeps the whole rack), a
//      DIRECT TUBE-NUDGE rings in dead calm, and the glow is driven by the SAME
//      envelope as the sound (so the payoff is visible with the sound off);
//    • BYTE-TWIN parity — index.src.html's inlined CHIME CORE slice === ./core.mjs's
//      and its PITCH CORE slice === ../pitch-core.mjs's, both char-for-char (the
//      forged index.html inherits them verbatim, so the page plays exactly this);
//    • SINGLE-SOURCE — the pitch anchor is IMPORTED, never re-typed in this leaf.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf lives one level deeper than the garden, so repoRoot is
//  ../.. (the-wind-chimes → sound-garden → repo root), like the-squeal-bench.
// ============================================================================
import {
  runChimeSelfTest, createChime, tubeFreqs, tubeLengths, tubeTau,
  renderStrike, renderStrikes, strikeEnvelope, env, rms, peak, rmsEnvelope,
  PENT_SEMIS, TUBE_ANGLES, TUBE_RATIOS, THETA_MAX, TAU_ATK, DEFAULT_SR,
  semiToFreq, noteName,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-wind-chimes → sound-garden → repo root
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

const FREQS = tubeFreqs(semiToFreq);
const NAMES = PENT_SEMIS.map(noteName);
const FLO = Math.min.apply(null, FREQS);

// ── 1. THE FULL SHARED SELF-TEST (the six legs the page's model must satisfy —
//   imported from ./core.mjs, run at the canonical SR). ───────────────────────
console.log('\n— The shared runChimeSelfTest (six legs: the payoff, the tuning, the bounds) —');
{
  const r = runChimeSelfTest(semiToFreq, DEFAULT_SR);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (the room\'s promises, measured) —');

// ── 2a. THE WIND→NOTES MAPPING IS REAL — the single claim the room makes to a
//   visitor without saying it in words: "a soft breeze only reaches the inner/high
//   tubes; a gust sweeps the whole rack." Nothing in the code branches on wind
//   strength — this behaviour falls out purely of the nested tube GEOMETRY — so it
//   is worth measuring rather than assuming. A soft breeze must ring the HIGHEST
//   tube and never the LOWEST; a strong one must ring ALL FIVE.
{
  function ringsAt(breeze, seconds, seed){
    const c = createChime({ freqs: FREQS, seed });
    c.setBreeze(breeze);
    for (let i = 0; i < seconds * 60; i++) c.step(1 / 60);
    const per = new Map();
    for (const h of c.st.strikes) per.set(h.tube, (per.get(h.tube) || 0) + 1);
    return per;
  }
  const soft = ringsAt(0.12, 60, 7);
  const gale = ringsAt(0.80, 60, 7);
  const HI = FREQS.length - 1, LO = 0;                 // index 4 = F#4 (highest), 0 = A3
  const softHitsHigh = (soft.get(HI) || 0) > 0;
  const softSparesLow = (soft.get(LO) || 0) === 0;
  const galeSweepsAll = [0,1,2,3,4].every(i => (gale.get(i) || 0) > 0);
  // and the soft breeze must be biased UP the rack: more strikes on the top two
  // tubes than the bottom two (the "bright tinkles" the room promises).
  const softTop = (soft.get(4)||0) + (soft.get(3)||0);
  const softBot = (soft.get(0)||0) + (soft.get(1)||0);
  const ok = softHitsHigh && softSparesLow && galeSweepsAll && softTop > softBot;
  const fmt = m => [0,1,2,3,4].map(i => NAMES[i] + ':' + (m.get(i)||0)).join(' ');
  check('the wind→notes mapping is real (and is pure geometry, not a rule): a SOFT breeze rings the highest tube and never reaches the lowest, and is biased to the top of the rack — while a GUST sweeps the clapper across ALL FIVE. Nothing branches on wind strength; the nested tube angles alone do this',
        ok, `soft (0.12): ${fmt(soft)} — high rung ${softHitsHigh}, low spared ${softSparesLow}, top ${softTop} > bottom ${softBot} · gale (0.80): ${fmt(gale)} — all five ${galeSweepsAll}`);
}

// ── 2b. A DIRECT TUBE-NUDGE RINGS IN DEAD CALM — the room is an instrument you can
//   strum with no wind at all. This drives strikeTube(), the very function the
//   canvas pointer handler and the number-key handler call. (The definition of done
//   names this explicitly: "direct-touch a tube to ring it.")
{
  const c = createChime({ freqs: FREQS, seed: 9 });
  c.setBreeze(0);
  for (let i = 0; i < 120; i++) c.step(1 / 60);         // 2 s of provably dead calm
  const beforeCalm = c.st.strikes.length;
  const hits = [];
  for (let i = 0; i < FREQS.length; i++) hits.push(c.strikeTube(i, 0.62));
  const allRang = hits.every((h, i) => h && h.tube === i && h.vel > 0);
  // and each nudge must make actual SOUND — a rendered buffer with real energy
  const buf = renderStrikes(hits, 3.0, DEFAULT_SR, FREQS);
  const energy = rms(buf, 0, buf.length);
  const outOfRange = c.strikeTube(99, 0.5);             // and an invalid tube rings nothing
  const ok = beforeCalm === 0 && allRang && energy > 1e-3 && outOfRange === null;
  check('a direct tube-nudge rings in DEAD CALM: after 2 s of wind-free silence (0 strikes), flicking each of the five tubes by the room\'s OWN strikeTube() — the same call the canvas pointer and the number keys make — rings all five with real velocity and renders real sound; an out-of-range tube rings nothing',
        ok, `calm before: ${beforeCalm} strikes · nudged ${hits.length}/5 (all valid: ${allRang}) · rendered rms ${energy.toExponential(2)} · invalid tube → ${outOfRange}`);
}

// ── 2c. THE GLOW IS THE SOUND (the accessibility promise, checked). The page draws
//   each struck tube's brightness from strikeEnvelope() — the SAME curve that shapes
//   the audio. So a muted / air-off / reduced-motion / cannot-listen visitor still
//   gets the whole payoff: the light must rise then fall exactly as the sound does,
//   and must be strictly ordered by how hard the tube was hit.
{
  const tau0 = tubeTau(FREQS[0], FLO);
  const gAt = t => strikeEnvelope(t, 0.9, tau0);
  const g0 = gAt(0), gPeak = gAt(0.04), gLate = gAt(tau0 * 3);
  const risesThenFalls = g0 === 0 && gPeak > g0 && gLate < gPeak;
  // the glow tracks the AUDIO's own measured envelope, not a separate animation:
  // sample both and correlate their shape over the tail.
  const buf = renderStrike(FREQS[0], 0.9, tau0 * 2, DEFAULT_SR, tau0);
  const audioEnv = rmsEnvelope(buf, DEFAULT_SR, 50);
  let worstRel = 0;
  for (let k = 4; k < audioEnv.length; k++){          // skip the attack blocks
    const t = (k + 0.5) * 0.05;
    const a = audioEnv[k] / audioEnv[4];
    const g = gAt(t) / gAt((4 + 0.5) * 0.05);
    worstRel = Math.max(worstRel, Math.abs(a - g));
  }
  const tracks = worstRel < 0.09;
  // and a harder strike must glow brighter, monotonically
  const brights = [0.15, 0.4, 0.7, 1.0].map(v => strikeEnvelope(0.04, v, tau0));
  const ordered = brights.every((b, i) => i === 0 || b > brights[i-1]);
  const ok = risesThenFalls && tracks && ordered;
  check('the glow IS the sound (so the payoff survives with the sound OFF): a tube\'s brightness comes from the SAME strikeEnvelope the audio is shaped by — it is 0 at onset, blooms just after it, and its decay tracks the rendered audio\'s own measured envelope to <9%; and a harder strike glows strictly brighter',
        ok, `glow(0) = ${g0} → glow(40 ms) = ${gPeak.toFixed(3)} → glow(3τ) = ${gLate.toFixed(4)} (rise-then-fall: ${risesThenFalls}) · worst |glow − audio envelope| = ${(worstRel*100).toFixed(1)}% (< 9%) · brightness by velocity [${brights.map(b=>b.toFixed(3)).join(', ')}] strictly rising: ${ordered}`);
}

// ── 2d. THE VOICE IS NOT A BELL (the A/B the ear-check confirms with real audio).
//   The Sound Garden already has a Carillon; this leaf earns its place only if its
//   voice is genuinely a different thing. A free-free tube's partials are the
//   inharmonic ratios [1, 2.756, 5.404, 8.933]: crucially there is NO partial BELOW
//   the fundamental (a bell's defining hum is an octave down at 0.5) and the
//   overtones are spread far wider than a bell's (1.19 / 1.5 / 2.0). That is the
//   structural reason the two cannot be mistaken for each other; verify.sh then
//   measures it on rendered audio against an actual carillon render.
{
  const noSubOctave = TUBE_RATIOS.every(r => r >= 1);
  const firstOvertone = TUBE_RATIOS[1];
  const wayWiderThanABell = firstOvertone > 2.0;        // a bell's widest low partial is the 2.0 nominal
  const inharmonic = TUBE_RATIOS.every((r, i) => i === 0 || Math.abs(r - Math.round(r)) > 0.05);
  // and it must be measurable: the rendered tube has no spectral energy an octave down
  const tau0 = tubeTau(FREQS[0], FLO);
  const buf = renderStrike(FREQS[0], 0.9, 2.0, DEFAULT_SR, tau0);
  // a naive one-bin DFT magnitude at f0/2 (where a bell's hum would sit) vs at f0
  function binMag(f){
    let re = 0, im = 0; const N = Math.min(buf.length, DEFAULT_SR);
    for (let i = 0; i < N; i++){ const w = 2*Math.PI*f*i/DEFAULT_SR; re += buf[i]*Math.cos(w); im -= buf[i]*Math.sin(w); }
    return Math.sqrt(re*re + im*im) / N;
  }
  const hum = binMag(FREQS[0]/2), fund = binMag(FREQS[0]);
  const humIsEmpty = hum < fund * 0.02;
  const ok = noSubOctave && wayWiderThanABell && inharmonic && humIsEmpty;
  check('the voice is a struck TUBE, not a bell (why this leaf is not a second Carillon): the free-free partial set has NO partial below the fundamental — where a bell\'s defining hum sits an octave down — and its first overtone is at 2.756, far wider than a bell\'s 1.19/1.5/2.0. Measured on the render, the octave-below bin is empty',
        ok, `ratios [${TUBE_RATIOS.join(', ')}] · none below 1: ${noSubOctave} · first overtone ${firstOvertone} > 2.0: ${wayWiderThanABell} · inharmonic: ${inharmonic} · |X(f₀/2)| / |X(f₀)| = ${(hum/fund).toExponential(2)} (< 2%)`);
}

// ── 2e. THE TUBE LENGTHS DO NOT LIE. The page draws tube i at length L ∝ 1/√f, and
//   tells the visitor the eye can read the pitch order off the lengths. A free-free
//   tube's fundamental really does go as 1/L², so that is honest — check both that
//   the drawn lengths follow the law and that they are strictly ordered with pitch.
{
  const L = tubeLengths(FREQS);
  let worst = 0;
  for (let i = 0; i < FREQS.length; i++) worst = Math.max(worst, Math.abs(L[i] - Math.sqrt(FLO / FREQS[i])));
  const ordered = L.every((l, i) => i === 0 || l < L[i-1]);      // lower pitch ⇒ longer tube
  const longestIsLowest = L[0] === Math.max.apply(null, L);
  // and the RACK's geometry must agree: |contact angle| falls as pitch rises, so the
  // longest/lowest tube really is the one furthest out (the one the wind works for)
  const nested = TUBE_ANGLES.every((a, i) => i === 0 || Math.abs(a) < Math.abs(TUBE_ANGLES[i-1]));
  const insideRack = TUBE_ANGLES.every(a => Math.abs(a) < THETA_MAX);
  const ok = worst === 0 && ordered && longestIsLowest && nested && insideRack;
  check('the drawing does not lie: tube lengths are exactly L ∝ 1/√f (a free-free tube\'s f goes as 1/L², so the eye really can read pitch order off the lengths), strictly longest-is-lowest — and the rack is genuinely NESTED, |contact angle| shrinking as pitch rises, every tube inside the rack\'s edge so the swing can always reach it',
        ok, `lengths [${L.map(x=>x.toFixed(3)).join(', ')}] worst Δ vs 1/√f = ${worst} · longest is lowest: ${longestIsLowest} · angles [${TUBE_ANGLES.join(', ')}] nested: ${nested} · all inside ±${THETA_MAX}: ${insideRack}`);
}

console.log('\n— Byte-twin parity (the page IS the modules) —');

// ── 3a. BYTE-TWIN PARITY (CHIME CORE): index.src.html's inlined slice === ./core.mjs's
//   slice, char-for-char. forge builds index.src.html → index.html verbatim, so the
//   forged page runs exactly this model. ────────────────────────────────────────
{
  const BEGIN = '// ===== CHIME CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== CHIME CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const src = readFileSync(join(__dir, 'index.src.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(src, BEGIN, END);
  check('byte-twin parity (CHIME CORE): index.src.html\'s inlined CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s animation, its live AudioBuffer voices, and its offline WAVs all run the module\'s exact pendulum, strike model and tone',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'src sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs src ${ps.length})`));
}

// ── 3b. BYTE-TWIN PARITY (borrowed PITCH CORE): the page inlines ../pitch-core.mjs's
//   PITCH CORE slice (which is what gives it semiToFreq) char-for-char, so the room's
//   tuning is computed by the estate's ONE pitch law rather than a second copy. ──
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const src = readFileSync(join(__dir, 'index.src.html'), 'utf8');
  const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(src, BEGIN, END);
  check('byte-twin parity (PITCH CORE): index.src.html\'s inlined PITCH CORE block is char-for-char ../pitch-core.mjs — so the five tube pitches are computed by the estate\'s ONE equal-temperament anchor, not a re-typed copy of it',
        ms != null && ps != null && ms === ps,
        ms == null ? 'module sentinels MISSING' : ps == null ? 'src sentinels MISSING' :
          (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs src ${ps.length})`));
}

// ── 3c. THE FORGED PAGE INHERITED BOTH SLICES. forge copies index.src.html →
//   index.html; if the build were stale, the page a visitor actually loads could run
//   an older model than the one proven above. Check the SHIPPED file directly. ───
{
  const built = readFileSync(join(__dir, 'index.html'), 'utf8');
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const pit = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const bc = sliceBetween(built, '// ===== CHIME CORE (inlined byte-twin) BEGIN =====', '// ===== CHIME CORE END =====');
  const bp = sliceBetween(built, '// ===== PITCH CORE (inlined byte-twin) BEGIN =====', '// ===== PITCH CORE END =====');
  const mc = sliceBetween(mod, '// ===== CHIME CORE (inlined byte-twin) BEGIN =====', '// ===== CHIME CORE END =====');
  const mp = sliceBetween(pit, '// ===== PITCH CORE (inlined byte-twin) BEGIN =====', '// ===== PITCH CORE END =====');
  const ok = bc != null && bp != null && bc === mc && bp === mp;
  check('the SHIPPED page inherited both slices: the forged index.html a visitor actually loads carries the CHIME CORE and PITCH CORE byte-identical to their modules — a stale build cannot ship a different model than the one proven here',
        ok, ok ? `index.html: CHIME ${bc.length} chars + PITCH ${bp.length} chars, both identical to source`
               : `CHIME match ${bc === mc} · PITCH match ${bp === mp}`);
}

console.log('\n— Single-source discipline (the pitch anchor is imported, not re-typed) —');

// ── 4. SINGLE-SOURCE: this leaf DOES make a tuning constraint, so unlike the Squeal
//   Bench it legitimately imports the pitch law — but it must IMPORT it, never
//   re-type it. core.mjs must contain no equal-temperament anchor literal of its own,
//   and must genuinely import semiToFreq from ../pitch-core.mjs. ─────────────────
{
  const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const importsPitch = /import\s*\{[^}]*semiToFreq[^}]*\}\s*from\s*['"]\.\.\/pitch-core\.mjs['"]/.test(coreSrc);
  // the anchor's digits (261.625565) and the semitone ratio must appear NOWHERE here
  const reTypesAnchor = /261\.6|1\.0594|Math\.pow\(\s*2\s*,\s*[a-z]*\s*\/\s*12\s*\)/i.test(coreSrc);
  // and every tube frequency must come from the passed-in fn, so no Hz literal at all
  const hzLiteral = /\b(220|246\.9|277\.1|329\.6|369\.9|440)\b/.test(coreSrc);
  const ok = importsPitch && !reTypesAnchor && !hzLiteral;
  check('single-source: core.mjs IMPORTS semiToFreq from ../pitch-core.mjs and re-types no pitch law of its own — no equal-temperament anchor literal, no 2^(n/12), and not one tube frequency written as a Hz number. The tuning constraint is inherited from the estate, not asserted locally',
        ok, `imports the pitch law: ${importsPitch} · re-types an anchor: ${reTypesAnchor} · contains a tube-Hz literal: ${hzLiteral} · the only tuning data typed here is the semitone set [${PENT_SEMIS.join(', ')}]`);
}

console.log(`\n—— The Wind Chimes Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
