/* ============================================================================
 *  THE WIND CHIMES — the Node twin.
 *  Run:  node sound-garden/the-wind-chimes/core.test.mjs      (exit 0 = green)
 *
 *  Zero dependencies.  It drives the SAME core.mjs the page inlines and the
 *  worklet runs, and every leg that can carry a discriminating control has one —
 *  a variant that MUST go red, so a passing number cannot be a dead code path
 *  or a constant someone fitted.
 *
 *  A  THE LADDER          the partials are a free-free beam's, not a string's
 *  B  THE NODES           mode 1 stands still at 0.2242 / 0.7758, by bisection
 *  C  THE CUTTING         pitch <-> length inverts, and f goes as 1/L^2
 *  D  THE TUNING          the six tubes are A major pentatonic, from pitch-core
 *  E  THE CLAIM, MEASURED T60 fitted to RENDERED AUDIO peaks on the node
 *  F  WHERE YOU HIT       striking at 0.5 removes mode 2 from the SOUND
 *  G  THE RIG RINGS       wind strikes all six tubes; dead calm is silent
 *  H  NOTHING BREAKS      no NaN, no clipping, in the worst overlap
 *  I  THE BYTE TWIN       the shipped page inlines core.mjs verbatim, twice
 *  J  THE WORKLET BUILDS  core.mjs with its exports stripped is a valid script
 * ========================================================================== */

import {
  MODE_RATIO, modeNodes, modeShape, cutLength, fundamental,
  DEFAULT_TUBE, PENT_SEMIS, ChimeRig, ModalBank, alphaTotal, t60,
  renderStrike, sustainCurve, peakOf, bandpass, rmsEnvelope,
  runChimeSelfTest,
} from './core.mjs';
import { semiToFreq, noteName, cents } from '../pitch-core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const ok = (name, pass, detail) => {
  if (!pass) fails++;
  console.log((pass ? '  ok   ' : '  FAIL ') + name + (detail ? '   [' + detail + ']' : ''));
};
const head = (s) => console.log('\n' + s);
const stripExports = (t) =>
  t.replace(/^export\s+(?=(?:default\s+)?(?:function|class|const|let|var))/gm, '')
   .replace(/^export\s*\{[\s\S]*?\};?\s*$/gm, '');

/* ── A · THE LADDER ─────────────────────────────────────────────────────── */
head('A · the ladder is a free-free beam\'s, and nothing else\'s');
{
  const want = [1, 2.7565, 5.4039, 8.9330, 13.3443, 18.6379];
  let worst = 0;
  for (let i = 0; i < want.length; i++) worst = Math.max(worst, Math.abs(MODE_RATIO[i] - want[i]));
  ok('1 : 2.756 : 5.404 : 8.933 : 13.34 : 18.64', worst < 5e-4, 'max dev ' + worst.toExponential(2));
  /* control: a STRING would be 1 : 2 : 3 : 4 … — if the ladder came out harmonic
     we would have built a monochord by accident */
  let harm = 0;
  for (let i = 0; i < want.length; i++) harm = Math.max(harm, Math.abs(MODE_RATIO[i] - (i + 1)));
  ok('control: it is NOT the harmonic ladder of a string', harm > 12,
     'departs from 1:2:3:… by ' + harm.toFixed(2));
}

/* ── B · THE NODES ──────────────────────────────────────────────────────── */
head('B · where each mode stands still — found, not remembered');
{
  const n1 = modeNodes(0), n2 = modeNodes(1);
  ok('mode 1: 0.2242 and 0.7758',
     n1.length === 2 && Math.abs(n1[0] - 0.2242) < 5e-4 && Math.abs(n1[1] - 0.7758) < 5e-4,
     n1.map((x) => x.toFixed(4)).join(', '));
  ok('mode 2: 0.1321, 0.5000, 0.8679 — a DIFFERENT set',
     n2.length === 3 && Math.abs(n2[1] - 0.5) < 5e-4 && Math.abs(n2[0] - 0.1321) < 5e-4,
     n2.map((x) => x.toFixed(4)).join(', '));
  ok('the ends are antinodes, |Y| = 1, for every mode',
     [0, 1, 2, 3, 4, 5].every((n) => Math.abs(Math.abs(modeShape(n, 0)) - 1) < 1e-9 &&
                                     Math.abs(Math.abs(modeShape(n, 1)) - 1) < 1e-6),
     'including mode 6, where the naive formula loses nine digits to cancellation');
}

/* ── C · THE CUTTING ────────────────────────────────────────────────────── */
head('C · the metal decides the note');
{
  const L = cutLength(440, DEFAULT_TUBE.od, DEFAULT_TUBE.wall);
  ok('a tube cut for 440 Hz sings 440 Hz',
     Math.abs(fundamental(L, DEFAULT_TUBE.od, DEFAULT_TUBE.wall) - 440) < 1e-9,
     (L * 1000).toFixed(1) + ' mm of 25 x 1.5 mm aluminium');
  ok('twice as long is two octaves down (f goes as 1/L^2)',
     Math.abs(fundamental(2 * L, DEFAULT_TUBE.od, DEFAULT_TUBE.wall) - 110) < 1e-9);
  /* controls, in the direction the gyration radius actually points: a WIDER tube
     of the same length sings higher, and a thicker wall on a fixed bore sings
     LOWER, because K = sqrt(od^2 + id^2)/4 falls as the bore closes up */
  const wide = fundamental(L, 0.038, DEFAULT_TUBE.wall);
  const thick = fundamental(L, DEFAULT_TUBE.od, 0.003);
  ok('control: a wider tube of the same length sings higher',
     wide > 660, wide.toFixed(1) + ' Hz at 38 mm outside diameter');
  ok('control: a thicker wall on the same outside diameter sings lower',
     thick < 425, thick.toFixed(1) + ' Hz for a 3 mm wall');
}

/* ── D · THE TUNING ─────────────────────────────────────────────────────── */
head('D · six tubes, tuned by the estate\'s own pitch authority');
{
  const f = PENT_SEMIS.map(semiToFreq);
  const names = PENT_SEMIS.map(noteName).join(' ');
  const rig = new ChimeRig({ freqs: f });
  let worst = 0;
  for (let i = 0; i < f.length; i++) worst = Math.max(worst, Math.abs(cents(rig.freqs[i][0] / f[i])));
  ok('every cut tube lands on its note to under a hundredth of a cent',
     worst < 0.01, names + ' · worst ' + worst.toExponential(1) + ' cents');
  ok('the lengths fall in a smooth graded rack',
     rig.L.every((L, i) => i === 0 || L < rig.L[i - 1]),
     rig.L.map((L) => (L * 1000).toFixed(0)).join(' / ') + ' mm');
}

/* ── E · THE CLAIM, MEASURED ────────────────────────────────────────────── */
head('E · the cord\'s toll — measured off the audio, not read off the formula');
{
  const f1 = semiToFreq(PENT_SEMIS[0]);
  const curve = sustainCurve(f1, { steps: 33 });
  const pk = peakOf(curve);
  const node = modeNodes(0)[0];
  ok('the longest ring is at the mode-1 node',
     Math.abs(pk.xi - node) < 0.005,
     'measured ' + pk.xi.toFixed(4) + ' vs analytic ' + node.toFixed(4) +
     ' — apart by ' + (Math.abs(pk.xi - node) * 1000).toFixed(2) + ' thousandths of a length');
  const want = t60(alphaTotal(0, f1, node));
  ok('and its height agrees with the damping model to within 6%',
     Math.abs(pk.t60 - want) / want < 0.06,
     'measured ' + pk.t60.toFixed(2) + ' s vs ' + want.toFixed(2) + ' s');
  const mid = curve[curve.length - 1];
  ok('control: hung at its middle the SAME tube is dead in a quarter of the time',
     pk.t60 / mid.t60 > 4, pk.t60.toFixed(1) + ' s vs ' + mid.t60.toFixed(1) + ' s');
}

/* ── F · WHERE YOU HIT ──────────────────────────────────────────────────── */
head('F · where the clapper lands decides the timbre');
{
  const f1 = semiToFreq(PENT_SEMIS[0]);
  const sr = 22050, f2 = f1 * MODE_RATIO[1];
  /* Q = 80: at Q = 20 the skirt of this filter still passes enough of the very
     loud fundamental to set a -24 dB floor, and you measure the FILTER, not the
     tube.  That cost a red leg before it was noticed. */
  const energy = (buf, f) => {
    const b = bandpass(buf, sr, f, 80);
    let s = 0;
    for (let i = Math.round(sr * 0.05); i < b.length; i++) s += b[i] * b[i];
    return Math.sqrt(s / b.length);
  };
  const atMid = renderStrike(f1, 0.2242, { sr: sr, seconds: 2, xiStrike: 0.5, vel: 0.9, thud: false });
  const atLow = renderStrike(f1, 0.2242, { sr: sr, seconds: 2, xiStrike: 0.35, vel: 0.9, thud: false });
  const dB = 20 * Math.log10(energy(atMid, f2) / energy(atLow, f2));
  const m1 = energy(atMid, f1) / energy(atLow, f1);
  ok('a strike at the exact middle takes the 2nd partial out (>30 dB down)',
     dB < -30, dB.toFixed(1) + ' dB against the same blow at 0.35');
  ok('… while the fundamental is LOUDER for that same blow, so it is not a weak hit',
     m1 > 1.2, 'mode 1 is ' + m1.toFixed(2) + 'x — 0.5 is nearer mode 1\'s antinode');
}

/* ── G · THE RIG RINGS ──────────────────────────────────────────────────── */
head('G · the air really does play it');
{
  const f = PENT_SEMIS.map(semiToFreq);
  const run = (speed, secs) => {
    const rig = new ChimeRig({ freqs: f, wind: { speed: speed } });
    const per = new Array(rig.nT).fill(0);
    let n = 0, maxVel = 0;
    for (let i = 0; i < secs * 60; i++) for (const e of rig.step(1 / 60)) {
      per[e.tube]++; n++; maxVel = Math.max(maxVel, e.vel);
      if (!(e.xi >= 0 && e.xi <= 1)) throw new Error('a strike landed off the tube: ' + e.xi);
    }
    return { per: per, n: n, maxVel: maxVel };
  };
  const calm = run(0, 30);
  ok('dead calm rings nothing at all', calm.n === 0, calm.n + ' strikes in 30 s');
  const breeze = run(2.4, 300);
  ok('a breeze rings every one of the six tubes',
     breeze.per.every((c) => c > 0), breeze.per.join(' / ') + ' strikes in five minutes');
  const gale = run(4.5, 120);
  ok('control: a gale rings more often, and never throws the clapper out of the rack',
     gale.n / 120 > breeze.n / 300 && gale.maxVel < 3,
     (gale.n / 2).toFixed(0) + ' per min vs ' + (breeze.n / 5).toFixed(0) +
     ' · fastest blow ' + gale.maxVel.toFixed(2) + ' m/s');
  const rig = new ChimeRig({ freqs: f, wind: { speed: 0 } });
  rig.clapper.w = [0, 0, 0.9];
  const sp = [];
  for (let i = 0; i < 60 * 40; i++) {
    rig.step(1 / 60);
    if (i % 60 === 0) sp.push(Math.hypot(rig.clapper.w[0], rig.clapper.w[1], rig.clapper.w[2]));
  }
  ok('a clapper set swinging in still air comes to rest',
     sp[sp.length - 1] < sp[0] * 0.25,
     sp[0].toFixed(3) + ' rad/s down to ' + sp[sp.length - 1].toFixed(3) + ' over 40 s');
}

/* ── H · NOTHING BREAKS ─────────────────────────────────────────────────── */
head('H · the voice survives the worst the wind can do');
{
  const f = PENT_SEMIS.map(semiToFreq);
  const rig = new ChimeRig({ freqs: f });
  const sr = 44100;
  const bank = new ModalBank(rig.freqs, sr, { pans: rig.az.map((a) => Math.sin(a) * 0.62) });
  for (let r = 0; r < 6; r++) for (let i = 0; i < rig.nT; i++) bank.strike(i, 1.6, 0.31 + 0.02 * i);
  const n = sr * 3, L = new Float32Array(n), R = new Float32Array(n);
  bank.render(L, R, n);
  let peak = 0, bad = 0;
  for (let i = 0; i < n; i++) {
    if (!isFinite(L[i]) || !isFinite(R[i])) bad++;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  ok('no NaN and no Inf anywhere in three seconds of pile-up', bad === 0);
  ok('and it does not clip', peak < 0.999, 'peak ' + peak.toFixed(3));
  const env = rmsEnvelope(L, sr, 40);
  ok('one onset, then a falling tail',
     env[0].v > 0 && env[env.length - 1].v < env[0].v * 0.35,
     'rms ' + env[0].v.toFixed(3) + ' -> ' + env[env.length - 1].v.toFixed(4));
}

/* ── I · THE BYTE TWIN ──────────────────────────────────────────────────── */
head('I · the page ships this exact core, twice');
{
  /* the forge strips a leading `export ` as it inlines, so compare against what
     it actually emits — the rest must be byte-for-byte */
  const core = stripExports(readFileSync(join(__dir, 'core.mjs'), 'utf8')).trim();
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  let n = 0, at = 0;
  for (;;) { const i = page.indexOf(core, at); if (i < 0) break; n++; at = i + 1; }
  ok('index.html holds core.mjs verbatim twice — once for the eye, once for the ear',
     n === 2, 'found ' + n + ' cop' + (n === 1 ? 'y' : 'ies'));
  const tail = readFileSync(join(__dir, 'worklet.js'), 'utf8').trim();
  ok('… and worklet.js verbatim once', page.indexOf(tail) >= 0);
}

/* ── J · THE WORKLET BUILDS ─────────────────────────────────────────────── */
head('J · what the audio thread is handed is a valid classic script');
{
  const core = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const tail = readFileSync(join(__dir, 'worklet.js'), 'utf8');
  const src = stripExports(core) + '\n' + tail;
  ok('no export survives the strip', !/^export/m.test(src));
  ok('no backtick in core.mjs — the page hands it to String.raw', core.indexOf('`') < 0);
  let compiled = true, why = '';
  try { new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', src); }
  catch (e) { compiled = false; why = e.message; }
  ok('it compiles', compiled, why);
}

/* ── the core's own self-test, mirrored so the two can never disagree ───── */
head('· the core\'s own self-test');
{
  for (const l of runChimeSelfTest().lines) ok(l.name, l.ok, l.detail);
}

console.log('\n' + (fails ? fails + ' FAILED' : 'all green') + '\n');
process.exit(fails ? 1 : 0);
