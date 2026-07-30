/* ═══════════════════════════════════════════════════════════════════════════
   FOUR BEATS TO A TURN — the Node twin.   node engine-room/four-beats-to-a-turn/loco.test.mjs

   Everything the room claims out loud is checked here against the same
   functions the page runs. The claims, in order:

     A  the crank kinematics, and that both dead centres carry no torque
     B  four release events per revolution, evenly spaced — from the geometry
     C  a quartering error moves the beats by exactly that error, and never
        changes how many there are
     D  the work closure: torque integrated round the crank equals the area of
        the four indicator cards
     E  beats per second = 4 v / (pi D), from a real integration, while gripping
     F  slipping breaks that equality — and only that equality
     G  the rail force never exceeds mu * N, ever
     H  energy closure while rolling
     I  the steam-table fit, and the boiler's behaviour at both ends
     J  the voice: bounded, decaying, and no backtick in the engine
   ═══════════════════════════════════════════════════════════════════════════ */
import * as L from './loco.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '   \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + (detail ? '   ' + detail : '')); }
};
const near = (name, got, want, tol, unit) =>
  ok(name, Math.abs(got - want) <= tol,
     'got ' + fmt(got) + ' want ' + fmt(want) + ' +/- ' + fmt(tol) + (unit ? ' ' + unit : ''));
const fmt = (v) => (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-4 && v !== 0)) ? v.toExponential(3) : (+v.toFixed(6)).toString();
const head = (s) => console.log('\n\x1b[1m' + s + '\x1b[0m');

const TWO_PI = Math.PI * 2;

/* ── A · crank and rod ───────────────────────────────────────────────────── */
head('A  crank and connecting rod');
{
  const r = L.crankR(), Ld = L.SPEC.rodLen;
  near('outer dead centre s(0) = L + r', L.pistonPos(0), Ld + r, 1e-12, 'm');
  near('inner dead centre s(pi) = L - r', L.pistonPos(Math.PI), Ld - r, 1e-12, 'm');
  near('stroke = 2r', L.pistonPos(0) - L.pistonPos(Math.PI), 2 * r, 1e-12, 'm');

  let worst = 0;
  for (let i = 0; i < 2000; i++) {
    const th = i / 2000 * TWO_PI, h = 1e-6;
    const fd = (L.pistonPos(th + h) - L.pistonPos(th - h)) / (2 * h);
    worst = Math.max(worst, Math.abs(fd - L.pistonDeriv(th)));
  }
  ok('ds/dtheta matches a central difference everywhere', worst < 1e-6, 'worst ' + fmt(worst));

  near('lever arm is exactly zero at theta = 0', L.pistonDeriv(0), 0, 1e-15);
  near('lever arm is exactly zero at theta = pi', L.pistonDeriv(Math.PI), 0, 1e-15);

  const pAdm = 12 * L.BAR, pBack = L.ATM + 0.1 * L.BAR;
  near('one cylinder makes no torque on a dead centre (0)',
       L.cylinderTorque(0, 0.6, pAdm, pBack), 0, 1e-9, 'N m');
  near('one cylinder makes no torque on a dead centre (pi)',
       L.cylinderTorque(Math.PI, 0.6, pAdm, pBack), 0, 1e-9, 'N m');
  let minAbs = Infinity;
  for (let i = 0; i < 4000; i++) {
    const th = i / 4000 * TWO_PI;
    minAbs = Math.min(minAbs, Math.abs(L.totalTorque(th, 0.6, pAdm, pBack, 0)));
  }
  ok('but the PAIR never does — no dead centre for two cylinders quartered',
     minAbs > 5000, 'least combined torque ' + fmt(minAbs) + ' N m');

  near('front frac is 0 at its own dead centre', L.frontFrac(0), 0, 1e-15);
  near('front frac is 1 half a turn later', L.frontFrac(Math.PI), 1, 1e-15);
}

/* ── B · the beat ────────────────────────────────────────────────────────── */
head('B  four beats to a turn, spaced by the geometry');
{
  near('front frac at the release angle = release',
       L.frontFrac(L.releaseAngle()), L.SPEC.release, 1e-12);
  const ph = L.beatPhases(0);
  ok('there are exactly ' + L.BEATS_PER_REV + ' of them', ph.length === L.BEATS_PER_REV, ph.map((v) => (+v.toFixed(5))).join(', '));
  let worst = 0;
  for (let i = 0; i < ph.length; i++) {
    const gap = ((ph[(i + 1) % ph.length] - ph[i] + TWO_PI) % TWO_PI) || TWO_PI;
    worst = Math.max(worst, Math.abs(gap - Math.PI / 2));
  }
  ok('evenly spaced to machine precision', worst < 1e-12, 'worst gap error ' + fmt(worst) + ' rad');
}

/* ── C · quartering error ────────────────────────────────────────────────── */
head('C  a quartering error limps by exactly the error');
{
  const e = 0.14;                       /* 8 degrees out */
  const ph = L.beatPhases(e);
  ok('still four beats', ph.length === 4);
  const gaps = ph.map((v, i) => ((ph[(i + 1) % 4] - v + TWO_PI) % TWO_PI) || TWO_PI).sort((a, b) => a - b);
  near('the two short gaps are pi/2 - e', gaps[0], Math.PI / 2 - e, 1e-12, 'rad');
  near('the two long gaps are pi/2 + e', gaps[3], Math.PI / 2 + e, 1e-12, 'rad');
  near('and they still add to a full turn', gaps.reduce((a, b) => a + b, 0), TWO_PI, 1e-12, 'rad');
}

/* ── D · the work closure ────────────────────────────────────────────────── */
head('D  work closure — the crank gets exactly what the cards give');
{
  for (const cutoff of [0.15, 0.35, 0.65, 0.82]) {
    const pAdm = 12.5 * L.BAR, pBack = L.ATM + 0.13 * L.BAR;
    const N = 200000;
    let W = 0;
    for (let i = 0; i < N; i++) {
      const th = (i + 0.5) / N * TWO_PI;
      W += L.totalTorque(th, cutoff, pAdm, pBack, 0);
    }
    W = W / N * TWO_PI;                                /* joules per revolution */
    const cards = 4 * L.endWork(cutoff, pAdm, pBack, 400000);
    const relErr = Math.abs(W - cards) / Math.abs(cards);
    ok('cutoff ' + (cutoff * 100).toFixed(0) + '%: crank ' + (W / 1000).toFixed(2)
       + ' kJ/rev vs cards ' + (cards / 1000).toFixed(2) + ' kJ/rev',
       relErr < 2e-3, 'relative ' + (relErr * 100).toFixed(4) + ' %');
  }
  const pAdm = 12.5 * L.BAR, pBack = L.ATM + 0.13 * L.BAR;
  const w15 = L.endWork(0.15, pAdm, pBack), w80 = L.endWork(0.80, pAdm, pBack);
  ok('a long cutoff does more work per stroke', w80 > w15,
     fmt(w80 / 1000) + ' kJ vs ' + fmt(w15 / 1000) + ' kJ');
  const s15 = 4 * (L.SPEC.clearance + 0.15) * L.sweptV() * L.steamDensity(pAdm);
  const s80 = 4 * (L.SPEC.clearance + 0.80) * L.sweptV() * L.steamDensity(pAdm);
  ok('...and a short cutoff does more work per KILOGRAM of steam — the whole '
     + 'reason a driver notches up', (4 * w15) / s15 > (4 * w80) / s80,
     fmt((4 * w15) / s15 / 1e3) + ' vs ' + fmt((4 * w80) / s80 / 1e3) + ' kJ/kg');
}

/* ── E · the room's claim ────────────────────────────────────────────────── */
head('E  beats per second = 4 v / (pi D), from a real run');
{
  const st = L.newState({ wagons: 3, sand: true });
  const dt = 1 / 2000;
  const ctl = { regulator: 0.85, cutoff: 0.55, brake: 0, sand: true, wagons: 3 };
  /* run up to speed */
  for (let i = 0; i < 2000 * 60; i++) L.step(st, dt, ctl);
  ok('the train is moving and gripping', st.v > 4 && !st.slipping,
     'v = ' + fmt(st.v) + ' m/s = ' + fmt(st.v * 3.6) + ' km/h');
  /* now count beats over a measured window */
  const t0 = st.t, b0 = st.beats;
  let vSum = 0, n = 0;
  for (let i = 0; i < 2000 * 30; i++) { L.step(st, dt, ctl); vSum += st.v; n++; }
  const measured = (st.beats - b0) / (st.t - t0);
  const predicted = L.beatsPerSecFromSpeed(vSum / n);
  const rel = Math.abs(measured - predicted) / predicted;
  ok('measured ' + measured.toFixed(4) + ' beats/s vs 4v/(piD) = ' + predicted.toFixed(4),
     rel < 2e-3, 'relative ' + (rel * 100).toFixed(3) + ' %');
  ok('a beat is worth ' + (Math.PI * L.SPEC.wheelD / 4).toFixed(4) + ' m of railway',
     Math.abs(Math.PI * L.SPEC.wheelD / 4 - 1.0776) < 1e-3);
}

/* ── F · slipping ────────────────────────────────────────────────────────── */
head('F  slipping is exactly the failure of that equality');
{
  const st = L.newState({ wagons: 6, sand: false });
  const dt = 1 / 4000;
  const ctl = { regulator: 1.0, cutoff: 0.85, brake: 0, sand: false, wagons: 6 };
  let slipped = false, tSlip = 0;
  for (let i = 0; i < 4000 * 6; i++) {
    L.step(st, dt, ctl);
    if (st.slipping && !slipped) { slipped = true; tSlip = st.t; }
  }
  ok('full regulator, full gear, six wagons on greasy rail: she slips', slipped,
     'first slip at t = ' + fmt(tSlip) + ' s');
  ok('the rim has run away from the rail', st.slipSpeed > 1.0,
     'rim - rail = ' + fmt(st.slipSpeed) + ' m/s');
  const fromWheel = L.beatsPerSecFromWheel(st.omega);
  const fromSpeed = L.beatsPerSecFromSpeed(st.v);
  ok('the beats say ' + fromWheel.toFixed(2) + '/s and the railway says '
     + fromSpeed.toFixed(2) + '/s', fromWheel > 2.5 * fromSpeed,
     'ratio ' + (fromWheel / fromSpeed).toFixed(2));
  /* sand it and she picks up */
  const before = st.slipSpeed;
  for (let i = 0; i < 4000 * 6; i++) L.step(st, dt, { ...ctl, sand: true });
  ok('sand the rail and the slip closes', st.slipSpeed < before * 0.5 || !st.slipping,
     'rim - rail now ' + fmt(st.slipSpeed) + ' m/s, slipping = ' + st.slipping);
}

/* ── G · the adhesion bound ──────────────────────────────────────────────── */
head('G  the rail is never asked for more than it has');
{
  let worst = 0, worstCase = '';
  for (const wag of [0, 3, 6]) {
    for (const sand of [false, true]) {
      for (const cut of [0.2, 0.55, 0.85]) {
        const st = L.newState({ wagons: wag, sand });
        const ctl = { regulator: 1, cutoff: cut, brake: 0, sand, wagons: wag };
        for (let i = 0; i < 20000; i++) {
          L.step(st, 1 / 2000, ctl);
          const over = Math.abs(st.fRail) - st.adhLimit;
          if (over > worst) { worst = over; worstCase = wag + ' wagons, cutoff ' + cut + ', sand ' + sand; }
        }
      }
    }
  }
  ok('|F_rail| <= mu N over 18 runs of 10 s', worst <= 1e-6,
     'worst overshoot ' + fmt(worst) + ' N' + (worstCase ? ' (' + worstCase + ')' : ''));
}

/* ── H · energy closure ──────────────────────────────────────────────────── */
head('H  energy closure while rolling');
{
  const st = L.newState({ wagons: 2, sand: true });
  const dt = 1 / 8000, ctl = { regulator: 0.7, cutoff: 0.5, brake: 0, sand: true, wagons: 2 };
  for (let i = 0; i < 8000 * 3; i++) L.step(st, dt, ctl);   /* settle, gripping */
  const M = L.trainMass(st), I = L.SPEC.wheelI, r = L.wheelR();
  const ke = () => 0.5 * M * st.v * st.v + 0.5 * I * st.omega * st.omega;
  const ke0 = ke();
  let Wcrank = 0, Wres = 0;
  for (let i = 0; i < 8000 * 8; i++) {
    const th0 = st.theta;
    const tau = st.tau;
    const res = L.resistance(st) * Math.sign(st.v || 1);
    L.step(st, dt, ctl);
    Wcrank += tau * (st.theta - th0);
    Wres   += res * st.v * dt;
  }
  const dke = ke() - ke0;
  const rel = Math.abs(Wcrank - Wres - dke) / Math.abs(Wcrank);
  ok('crank work ' + (Wcrank / 1e6).toFixed(4) + ' MJ = resistance '
     + (Wres / 1e6).toFixed(4) + ' MJ + delta-KE ' + (dke / 1e6).toFixed(4) + ' MJ',
     rel < 3e-3, 'relative ' + (rel * 100).toFixed(4) + ' %');
  ok('and she is still gripping, so no friction term is hiding in there', !st.slipping);
}

/* ── I · boiler and fire ─────────────────────────────────────────────────── */
head('I  the boiler');
{
  /* the saturated-steam fit against four rows of the steam tables */
  const table = [[1, 0.590], [5, 2.668], [10, 5.145], [14, 7.106]];
  let worstPc = 0;
  for (const [pb, rho] of table) {
    const got = L.steamDensity(pb * L.BAR);
    worstPc = Math.max(worstPc, Math.abs(got - rho) / rho * 100);
  }
  ok('rho = 0.590 p^0.9405 tracks the steam tables at 1, 5, 10, 14 bar',
     worstPc < 1.0, 'worst ' + worstPc.toFixed(2) + ' %');
  let wd = 0;
  for (let p = 2; p <= 15; p += 0.25) {
    const h = 1e-3 * L.BAR, fd = (L.steamDensity(p * L.BAR + h) - L.steamDensity(p * L.BAR - h)) / (2 * h);
    wd = Math.max(wd, Math.abs(fd - L.dRhoDp(p * L.BAR)));
  }
  ok('drho/dp is the derivative of that fit', wd < 1e-8, 'worst ' + fmt(wd));

  const C = L.boilerCapacity(13.4 * L.BAR);
  near('capacitance is about 20 kg per bar, and the WATER is nearly all of it',
       C * L.BAR, 20.3, 0.8, 'kg/bar');
  const steamOnly = L.SPEC.steamSpace * L.dRhoDp(13.4 * L.BAR) * L.BAR;
  ok('the steam space alone would be ' + steamOnly.toFixed(2) + ' kg/bar — ' +
     (C * L.BAR / steamOnly).toFixed(0) + 'x smaller', C * L.BAR / steamOnly > 20);

  /* shut off: pressure climbs to the valves and stops there */
  const a = L.newState({ p: 10 * L.BAR });
  for (let i = 0; i < 2000 * 400; i++) L.step(a, 1 / 2000, { regulator: 0, cutoff: 0.5, wagons: 3 });
  near('regulator shut for 400 s: pressure sits on the safety valve',
       a.p, L.SPEC.pSafety, 1, 'Pa');
  ok('and the valves are blowing', a.blowoff > 0.9, 'blowoff ' + fmt(a.blowoff));

  /* thrash it: pressure falls, and it falls at the rate the capacitance says */
  const b = L.newState({ p: L.SPEC.pSafety, fire: 1, wagons: 3, sand: true });
  const ctl = { regulator: 1, cutoff: 0.7, sand: true, wagons: 3 };
  for (let i = 0; i < 2000 * 5; i++) L.step(b, 1 / 2000, ctl);
  const p0 = b.p; let net = 0;
  for (let i = 0; i < 2000 * 40; i++) { L.step(b, 1 / 2000, ctl); net += (b.steamGen - b.steamUse) / 2000; }
  const predicted = p0 + net / L.boilerCapacity(p0);
  ok('40 s flat out: ' + ((p0 - L.ATM) / L.BAR).toFixed(2) + ' -> '
     + ((b.p - L.ATM) / L.BAR).toFixed(2) + ' bar (predicted '
     + ((predicted - L.ATM) / L.BAR).toFixed(2) + ')',
     b.p < p0 - 0.5 * L.BAR && Math.abs(b.p - predicted) < 0.25 * L.BAR);
}

/* ── J · the voice ───────────────────────────────────────────────────────── */
head('J  the voice');
{
  const sr = 48000;
  for (const [s, sh] of [[1, 0.1], [0.5, 0.5], [0.15, 0.9]]) {
    const b = L.chuff(sr, s, sh, 99);
    let pk = 0, e0 = 0, e1 = 0;
    const fifth = Math.floor(b.length / 5);
    for (let i = 0; i < b.length; i++) {
      pk = Math.max(pk, Math.abs(b[i]));
      if (i < fifth) e0 += b[i] * b[i];
      else if (i >= b.length - fifth) e1 += b[i] * b[i];
    }
    ok('chuff(' + s + ', ' + sh + '): ' + (b.length / sr * 1000).toFixed(0) + ' ms, peak '
       + pk.toFixed(3) + ', dies away', pk <= 1.0001 && pk > 0.2 && e1 < e0 * 0.12,
       'last fifth carries 1/' + (e0 / (e1 || 1e-9)).toFixed(0) + ' of the first');
  }
  const loud = L.chuff(sr, 1, 0.5, 7), soft = L.chuff(sr, 0.2, 0.5, 7);
  let pl = 0, ps = 0;
  for (let i = 0; i < loud.length; i++) pl = Math.max(pl, Math.abs(loud[i]));
  for (let i = 0; i < soft.length; i++) ps = Math.max(ps, Math.abs(soft[i]));
  ok('a strong beat is louder than a weak one', pl > ps * 1.8, pl.toFixed(3) + ' vs ' + ps.toFixed(3));
  ok('deterministic — same seed, same samples',
     L.chuff(sr, 0.6, 0.4, 3)[100] === L.chuff(sr, 0.6, 0.4, 3)[100]);

  const w = L.whistle(sr, 1.2, 392);
  let wp = 0; for (let i = 0; i < w.length; i++) wp = Math.max(wp, Math.abs(w[i]));
  ok('the whistle is a three-note chord and does not clip', wp <= 1.0 && wp > 0.3, 'peak ' + wp.toFixed(3));
  near('its middle pipe is a minor third up', 12 * Math.log2(L.WHISTLE_RATIOS[1]), 3, 0.01, 'semitones');
  near('its top pipe is a fifth up', 12 * Math.log2(L.WHISTLE_RATIOS[2]), 7, 0.01, 'semitones');
}

/* ── the landmine guard ──────────────────────────────────────────────────── */
head('the landmine guard');
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'loco.mjs'), 'utf8');
  ok('loco.mjs holds no backtick, so it survives being handed to an AudioWorklet '
     + 'inside a String.raw template', src.indexOf(String.fromCharCode(96)) === -1);
  ok('and no HTML comment, which the forge would splice into a script',
     !/<!--/.test(src));
}

console.log('\n' + (fail ? '\x1b[31m' : '\x1b[32m') + pass + ' passed, ' + fail + ' failed\x1b[0m\n');
process.exit(fail ? 1 : 0);
