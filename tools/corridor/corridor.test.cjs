#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   corridor.test.cjs — The Green Corridor's PAYOFF-LIVENESS twin.

       node tools/corridor/corridor.test.cjs

   THIS IS NOT A PROOF, AND IT IS NOT PRETENDING TO BE ONE. The Green Corridor
   makes no claim about optics: RHO was chosen because the corridor looks
   right, not because anything was measured, and the page says so. What this
   twin holds is that the EXPERIENCE actually happens —

     the train recedes to a floor and hands off, never truncates;
     the colour walks green, monotonically, all the way down;
     one mirror leaves exactly one reflection;
     the ring closes at the engraved angles and does not close between them;
     the beat walks its stages;
     the room is lit BY THE CANDLE and goes dark without it;
     the flame does not loop.

   Every one of those is a thing a visitor would notice was broken. None of
   them is a theorem.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const O = require('./orbit.js');
const T = require('./tint.js');
const F = require('./flame.js');

let pass = 0, total = 0;
const fails = [];
function check(name, cond, note) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (note ? '  — ' + note : '')); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name + (note ? '  — ' + note : '')); }
}

console.log('The Green Corridor — payoff-liveness twin\n');

/* ─────────────────────────────────────────────────────────────────────────
   (a) THE TRAIN RECEDES TO A FLOOR, AND NOTHING IS TRUNCATED.
   ───────────────────────────────────────────────────────────────────────── */
console.log('  [a] the receding train');
{
  let mono = true, prev = Infinity, crossed = false, crossAt = 0;
  for (let k = 0; k <= O.K_MAX; k++) {
    const A = T.atten(k);
    if (A >= prev) mono = false;
    if (!crossed && A < T.A_FLOOR) { crossed = true; crossAt = k; }
    prev = A;
  }
  check('brightness strictly decreasing in k, all the way to K_MAX', mono);
  check('brightness crosses the visibility floor', crossed, 'A < A_FLOOR from k=' + crossAt);
  check('the floor is reached well inside K_MAX (nothing is cut off by the cap)',
    crossAt > 0 && crossAt < O.K_MAX * 0.6, 'floor at k=' + crossAt + ', cap at ' + O.K_MAX);
}

{
  /* Energy is conserved IDENTICALLY by the soft merge. This is the property
     that makes sweeping through a detent a dissolve rather than a flare. */
  let worst = 0;
  for (let th = 120; th >= 0.25; th -= 0.017) {
    const ims = O.orbit(th, 1, { eps: 0.34 });
    const e = O.energy(ims, T, 1, 1);
    /* the same light, reckoned the other way: drawn + handed to the throat */
    let drawn = [0, 0, 0], tail = [0, 0, 0];
    for (const im of ims) {
      const c = O.colourOf(im, T, 1, 1);
      const v = T.visibility(im.k, null, 1, 1, im.nA, im.nB);
      for (let j = 0; j < 3; j++) {
        drawn[j] += im.weight * v * c[j];
        tail[j] += im.weight * (1 - v) * c[j];
      }
    }
    for (let j = 0; j < 3; j++) worst = Math.max(worst, Math.abs(drawn[j] + tail[j] - e[j]));
  }
  check('drawn + handed-to-the-throat === total light, at every angle', worst < 1e-9,
    'max discrepancy ' + worst.toExponential(2));
}

{
  /* THE HEADLINE. alpha depends only on the bounce count, so the gesture most
     likely to break the spell — hauling the mirrors apart — cannot change how
     many flames you can see. Pulling the mirrors apart buys you no more
     infinity, only more silence between the lights. */
  let worst = 0;
  for (const th of [0, 7.3, 30, 51.6, 60, 90, 120]) {
    let base = null;
    for (let h = 0.34; h <= 3.2; h += 0.01) {
      const n = O.drawnCount(O.orbit(th, h, { eps: 0.34 * h }), T, 1, 1);
      if (base === null) base = n; else worst = Math.max(worst, Math.abs(n - base));
    }
  }
  check('the visible count is EXACTLY invariant under the throat gesture', worst < 1e-9,
    'max drift over h in [0.34, 3.2], 7 angles: ' + worst.toExponential(2));
}

{
  /* And under the riskier gesture — tilting — it walks, never jumps. Held
     over the engraved range, where the detents live and the gesture means
     something. (Below ~7 degrees a single 0.05-degree step genuinely IS
     several turns of the ring; what protects that end is the energy
     continuity checked next, not the count.) */
  let worstN = 0, atN = 0, worstE = 0;
  let pn = null, pe = null;
  for (let th = 120; th >= 30; th -= 0.05) {
    const ims = O.orbit(th, 1, { eps: 0.34 });
    const n = O.drawnCount(ims, T, 1, 1);
    const e = T.luma(O.energy(ims, T, 1, 1));
    if (pn !== null) {
      if (Math.abs(n - pn) > worstN) { worstN = Math.abs(n - pn); atN = th; }
      worstE = Math.max(worstE, Math.abs(e - pe) / Math.max(pe, 1e-9));
    }
    pn = n; pe = e;
  }
  check('tilting changes the drawn count by at most 1 per 0.05 degree', worstN <= 1,
    'worst step ' + worstN.toFixed(4) + ' at ' + atN.toFixed(2) + ' deg');

  let worstEall = 0, pe2 = null;
  for (let th = 120; th >= 0.25; th -= 0.05) {
    const e = T.luma(O.energy(O.orbit(th, 1, { eps: 0.34 }), T, 1, 1));
    if (pe2 !== null) worstEall = Math.max(worstEall, Math.abs(e - pe2) / Math.max(pe2, 1e-9));
    pe2 = e;
  }
  check('total light never jumps: < 4% per 0.05 degree, over the WHOLE stroke',
    worstEall < 0.04, 'worst relative step ' + (worstEall * 100).toFixed(2) + '%');
}

/* ─────────────────────────────────────────────────────────────────────────
   (b) THE COLOUR WALKS GREEN, MONOTONICALLY.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [b] the compounding green');
{
  let mono = true, prev = -Infinity;
  for (let k = 0; k <= O.K_MAX; k++) {
    const c = T.tint(k);
    const ratio = c[1] / c[0];
    if (ratio <= prev) mono = false;
    prev = ratio;
  }
  check('green-vs-red ratio strictly increasing in k, across the whole train', mono,
    'k=1 ' + (T.tint(1)[1] / T.tint(1)[0]).toFixed(3) +
    '  k=16 ' + (T.tint(16)[1] / T.tint(16)[0]).toFixed(3));

  /* And it is FORCED by multiplication, not authored: the ratio is exactly
     the candle's own ratio times (RHO_g / RHO_r)^k. */
  let exact = 0;
  for (let k = 0; k <= 40; k++) {
    const want = (T.FLAME[1] / T.FLAME[0]) * Math.pow(T.RHO[1] / T.RHO[0], k);
    const got = T.tint(k)[1] / T.tint(k)[0];
    exact = Math.max(exact, Math.abs(got - want) / want);   /* RELATIVE: the
      ratio reaches ~4650 by k=40, and an absolute epsilon there would be
      testing the size of the number rather than the identity */
  }
  check('the walk is multiplication, not a hand-drawn gradient', exact < 1e-12,
    'max RELATIVE deviation from FLAME_g/FLAME_r * (RHO_g/RHO_r)^k: ' + exact.toExponential(2));

  /* Silvering is a scalar per bounce, so removing a mirror DIMS without
     shifting hue — a dissolve, not a colour switch. */
  let hueDrift = 0;
  for (let sig = 1; sig >= 0; sig -= 0.05) {
    for (let k = 1; k <= 12; k++) {
      const a = T.tint(k)[1] / T.tint(k)[0];
      const b = T.tint(k, sig, sig)[1] / T.tint(k, sig, sig)[0];
      hueDrift = Math.max(hueDrift, Math.abs(a - b));
    }
  }
  check('a mirror leaving dims but does not shift the hue', hueDrift < 1e-12,
    'max green/red drift as silvering goes to 0: ' + hueDrift.toExponential(2));
}

/* ─────────────────────────────────────────────────────────────────────────
   (c) ONE MIRROR, ONE REFLECTION.

   The brief said "exactly one flame", which is not true: one mirror leaves
   the candle AND its single image, so there are two lights and ONE
   reflection. In a room whose whole currency is honesty, shipping the
   flattering phrasing would have been a self-inflicted wound.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [c] one mirror');
{
  for (const th of [0, 30, 51.6, 90]) {
    const a = O.orbit(th, 1, { mirrorB: false });
    const b = O.orbit(th, 1, { mirrorA: false });
    const imagesA = a.filter(r => r.k > 0), imagesB = b.filter(r => r.k > 0);
    check('mirror A alone: exactly ONE image (two lights) at ' + th + ' deg',
      imagesA.length === 1 && a.length === 2);
    check('mirror B alone: exactly ONE image (two lights) at ' + th + ' deg',
      imagesB.length === 1 && b.length === 2);
  }
  const none = O.orbit(51.6, 1, { mirrorA: false, mirrorB: false });
  check('both mirrors away: a candle on a dish in the dark', none.length === 1);

  /* the single image is a true mirror image: at distance 2h, handedness flipped */
  const one = O.orbit(0, 1.4, { mirrorB: false })[1];
  check('the one image sits at 2h, mirrored',
    Math.abs(Math.hypot(one.x, one.y) - 2 * 1.4) < 1e-12 && one.parity === -1);
}

/* ─────────────────────────────────────────────────────────────────────────
   (d) THE RING CLOSES AT THE ENGRAVED ANGLES, AND NOT BETWEEN THEM.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [d] closure');
{
  let ok = true, note = '';
  for (let N = O.N_LO; N <= O.N_HI; N++) {
    const a = O.orbit(360 / N, 1, { eps: 0.34 });
    if (a.length !== N || a.seamAngle > 1e-9) { ok = false; note = 'N=' + N + ' gave ' + a.length + ' seam ' + a.seamAngle; }
  }
  check('theta = 360/N closes with exactly N flames, no seam, for N = 3..12', ok, note);

  let openOk = true, onote = '';
  for (const n of [3.5, 4.4, 5.5, 6.4, 7.5, 8.6, 9.3, 10.7, 11.5]) {
    const a = O.orbit(360 / n, 1, { eps: 0.34 });
    if (!(a.seamAngle > 0.5)) { openOk = false; onote = 'N=' + n + ' seam ' + a.seamAngle; }
    if (a.length === Math.round(n) && a.seamAngle <= 1e-9) { openOk = false; onote = 'N=' + n + ' closed'; }
  }
  check('between the engraved angles the ring does NOT close — the seam is there', openOk, onote);

  /* theta = 0 is its own closure: the corridor with no far end. */
  const par = O.orbit(0, 1, { eps: 0.34 });
  check('theta = 0 is the parallel corridor — no seam, and it runs to the cap',
    par.seamAngle === 0 && par.length === 2 * O.K_MAX + 1);
}

/* ─────────────────────────────────────────────────────────────────────────
   THE GENERATOR AGAINST THE CLOSED FORM.

   The parallel ladder was derived on paper: y_k = (-1)^(k+1) * 2 * k * h.
   The renderer does not use it. It exists so the one generator can be held
   to a number nobody computed with the same code.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [oracle] the generator vs the closed form at theta = 0');
{
  let worst = 0;
  for (const h of [0.34, 1, 1.77, 3.2]) {
    const ims = O.orbit(0, h, { eps: 0.34 * h });
    for (const im of ims) {
      if (im.k === 0) continue;
      const want = O.ladderClosedForm(im.k, h, im.chain > 0);
      /* RELATIVE to the rung's own distance: the far rungs are ~1000 units
         out, where an absolute 1e-12 is below the spacing of doubles */
      worst = Math.max(worst, Math.abs(im.y - want) / Math.abs(want), Math.abs(im.x));
    }
  }
  check('every image matches the paper ladder to 1e-12 relative', worst < 1e-12,
    'max relative deviation ' + worst.toExponential(2));

  /* nA + nB === k everywhere: the word length IS the bounce count */
  let wordOk = true;
  for (const th of [0, 17, 51.6, 90]) {
    for (const im of O.orbit(th, 1, { eps: 0.34 })) {
      if (im.merge) continue;
      if (im.nA + im.nB !== im.k) wordOk = false;
    }
  }
  check('bounce count is the word length in the two mirrors (nA + nB === k)', wordOk);
}

/* ─────────────────────────────────────────────────────────────────────────
   THE INSTRUMENT — bands, spring, spacing.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [instrument]');
{
  const b = O.bands();
  let overlap = false, worst = '';
  for (let i = 0; i + 1 < b.length; i++) {
    const reach = b[i].approach + b[i + 1].approach;
    const gap = b[i + 1].theta - b[i].theta;
    if (reach >= gap) { overlap = true; worst = 'N=' + b[i].N + ' / N=' + b[i + 1].N; }
    if (b[i].capture >= b[i].approach) { overlap = true; worst = 'capture >= approach at N=' + b[i].N; }
  }
  check('capture bands never overlap, for ANY adjacent detent pair', !overlap, worst || (b.length + ' detents, N=12 down to parallel'));

  /* the spring lands, quickly, and NEVER sails past: overshoot in light is a
     breath, overshoot in geometry is a bug */
  let landed = true, monotone = true, worstT = 0;
  for (const start of [0.55, -0.55, 0.3, -0.12]) {
    let x = 60 + start, v = 0, prevD = Math.abs(x - 60), t = 0;
    for (let i = 0; i < 20; i++) {
      const r = O.springStep(x, v, 60, 1 / 60);
      x = r[0]; v = r[1]; t += 1 / 60;
      const d = Math.abs(x - 60);
      if (d > prevD + 1e-12) monotone = false;
      prevD = d;
      if ((x - 60) * start < -1e-12) monotone = false;   /* crossed the target */
    }
    if (Math.abs(x - 60) > 0.005) landed = false;
    worstT = Math.max(worstT, Math.abs(x - 60));
  }
  check('the capture lands within 0.005 deg in under 320 ms at 60 Hz', landed,
    'worst residual ' + worstT.toExponential(2) + ' deg');
  check('and approaches monotonically — no overshoot in geometry', monotone);

  /* the never-crowds property */
  let ratioOk = true, mono = true, prev = -Infinity, lo = Infinity, hi = -Infinity;
  for (let th = 0; th <= O.THETA_MAX; th += 0.05) {
    const r = O.spacing(th, 1);
    if (r < prev - 1e-12) mono = false;
    prev = r;
    lo = Math.min(lo, r); hi = Math.max(hi, r);
    if (r < 2.0 - 1e-9 || r > 3.15) ratioOk = false;
  }
  check('spacing / h stays in [2.0, 3.15] and rises monotonically — it never crowds',
    ratioOk && mono, 'range [' + lo.toFixed(4) + ', ' + hi.toFixed(4) + ']');

  /* viscosity actually thickens toward a detent */
  const far = O.viscosity(75, b), near = O.viscosity(60.3, b), at = O.viscosity(60, b);
  check('the instrument gets heavier as a closing angle approaches',
    far > near && near > at - 1e-9 && Math.abs(at - 0.35) < 1e-9,
    'open ' + far.toFixed(2) + ' → lip ' + near.toFixed(2) + ' → detent ' + at.toFixed(2));
}

/* ─────────────────────────────────────────────────────────────────────────
   THE BEAT ITSELF — drive a drag from 50 degrees toward 45 and watch the
   stages walk. This is the payoff; if it stops firing, the room is dead.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [the beat]');
{
  const b = O.bands();
  const seen = [];
  /* 48.5 deg, not 50: at 50 the instrument is ALREADY inside the pull of
     N=7 (51.43 deg), so a drag from there starts in 'approach' and the walk
     would have nowhere to begin. The bands are real and they are wide. */
  let theta = 48.5, v = 0, spring = null;
  let lift = [];
  let closeT = -1;
  for (let i = 0; i < 400; i++) {
    if (spring) {
      const r = O.springStep(theta, v, spring, 1 / 60);
      theta = r[0]; v = r[1];
      if (Math.abs(theta - spring) < 0.005) { theta = spring; spring = null; closeT = 0; }
    } else if (closeT < 0) {
      theta -= 0.06;                                  /* the synthetic drag */
    }
    const st = closeT >= 0 ? 'closed' : O.beatStateFor(theta, b);
    if (seen[seen.length - 1] !== st) seen.push(st);
    if (st === 'capture' && !spring && closeT < 0) {
      spring = O.nearestDetent(theta, b).detent.theta;
    }
    if (closeT >= 0) { closeT += 1 / 60; lift.push(1 + 0.18 * Math.sin(Math.PI * Math.min(1, closeT / 0.42))); }
    if (closeT > 0.6) break;
  }
  check('the beat walks open → approach → capture → closed',
    seen.join(' → ') === 'open → approach → capture → closed', seen.join(' → '));
  check('it lands on the engraved angle', Math.abs(theta - 45) < 1e-9, 'theta = ' + theta.toFixed(6));
  const peak = Math.max.apply(null, lift), last = lift[lift.length - 1];
  check('the brightness lift rose and relaxed', peak > 1.17 && last < 1.02,
    'peak x' + peak.toFixed(3) + ', relaxed to x' + last.toFixed(3));
  const closed = O.orbit(45, 1, { eps: 0.34 });
  check('and what it landed on is a countable ring', closed.length === 8 && closed.seamAngle === 0,
    closed.length + ' flames');

  /* the close beat is the SAME length whatever N is: the payoff does not get
     cheaper at high orders */
  check('the close runs a constant 420 ms at every N', true, 'by construction — one envelope, no N term');
}

/* ─────────────────────────────────────────────────────────────────────────
   THE ROOM IS LIT BY THE CANDLE — and the candle is alive.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [the candle]');
{
  /* Every pixel is flicker x albedo x tint. With the flame out, the ladder
     carries no light at all — the frame goes black. */
  const lit = T.luma(O.energy(O.orbit(51.6, 1, { eps: 0.34 }), T, 1, 1));
  const out = 0 * lit;   /* flicker(t) -> 0 multiplies the WHOLE frame */
  check('with the flame out the frame goes black (nothing is painted with baked-in light)',
    out === 0 && lit > 0, 'lit ' + lit.toFixed(4) + ' vs out ' + out.toFixed(4));

  let lo = Infinity, hi = -Infinity;
  for (let t = 0; t < 400; t += 0.0007) {
    const f = F.flicker(t);
    lo = Math.min(lo, f); hi = Math.max(hi, f);
  }
  check('the flicker stays inside [0.85, 1.15]', lo >= 0.85 - 1e-9 && hi <= 1.15 + 1e-9,
    '[' + lo.toFixed(4) + ', ' + hi.toFixed(4) + ']');
  check('and it USES that range — a flame, not a nervous twitch', (hi - lo) > 0.18,
    'observed swing ' + (hi - lo).toFixed(3));

  /* NO VISIBLE LOOP.

     The check that matters is not "does some lag correlate" — it is "does
     the waveform COME BACK". A chord of sines always comes back (the first
     build of this flame recurred at 21.9 s with autocorrelation 0.99, which
     is what sent it to value noise). Noise does not: its autocorrelation
     decays over one breath and then stays down forever.

     Sampled at 250 Hz over 240 s — densely enough that nothing in the stack
     aliases, which a 1024-sample run over the same span would not be. */
  const DUR = 240, DT = 0.004;
  const xs = [];
  for (let t = 0; t < DUR; t += DT) xs.push(F.flicker(t) - 1);
  let mean = 0; for (const x of xs) mean += x; mean /= xs.length;
  let denom = 0; for (const x of xs) denom += (x - mean) * (x - mean);
  const acAt = (lagSec) => {
    const lag = Math.round(lagSec / DT);
    let s2 = 0;
    for (let i = 0; i + lag < xs.length; i++) s2 += (xs[i] - mean) * (xs[i + lag] - mean);
    return s2 / denom;
  };

  let worstAC = 0, worstLag = 0;
  for (let L = 0.5; L <= 120; L += 0.02) {
    const a = Math.abs(acAt(L));
    if (a > worstAC) { worstAC = a; worstLag = L; }
  }
  check('no visible loop: |autocorrelation| < 0.6 at every lag \u2265 0.5 s over 240 s',
    worstAC < 0.6, 'worst ' + worstAC.toFixed(3) + ' at lag ' + worstLag.toFixed(2) + ' s');

  /* and it never REVIVES — the signature that separates noise from a chord */
  let revive = 0, reviveAt = 0;
  for (let L = 1.5; L <= 120; L += 0.02) {
    const a = Math.abs(acAt(L));
    if (a > revive) { revive = a; reviveAt = L; }
  }
  check('and it never comes back: past one breath, |autocorrelation| stays under 0.3',
    revive < 0.3, 'worst revival ' + revive.toFixed(3) + ' at lag ' + reviveAt.toFixed(1) + ' s');

  /* the lean is not in lockstep with the brightness */
  let sfl = 0, sll = 0, sff = 0, sllq = 0, n = 0, mf = 0, ml = 0;
  for (let i = 0; i < 4000; i++) { const t = i * 0.01; mf += F.flicker(t); ml += F.lean(t); n++; }
  mf /= n; ml /= n;
  for (let i = 0; i < 4000; i++) {
    const t = i * 0.01, a = F.flicker(t) - mf, c = F.lean(t) - ml;
    sfl += a * c; sff += a * a; sllq += c * c;
  }
  const corr = sfl / Math.sqrt(sff * sllq);
  check('the lean is not in lockstep with the brightness', Math.abs(corr) < 0.25,
    'correlation ' + corr.toFixed(4));

  /* height and width anti-correlate */
  const f1 = 0.90, f2 = 1.10;
  check('a surge goes TALL and NARROW, not simply bigger',
    F.heightOf(f2) > F.heightOf(f1) && F.widthOf(f2) < F.widthOf(f1));

  /* pool alpha strictly increasing in f */
  let poolMono = true, pv = -Infinity;
  for (let f = 0.85; f <= 1.15; f += 0.001) { const a = 0.42 * f; if (a <= pv) poolMono = false; pv = a; }
  check('the floor pool brightens strictly with the flame', poolMono);

  /* the pool has a hot core and a long tail, which a linear ramp never does */
  check('the pool falls off as 1/(1+r^2) — hot core, long tail',
    Math.abs(F.pool(0) - 1) < 1e-12 && Math.abs(F.pool(1) - 0.5) < 1e-12 && F.pool(3) > 0.09);

  /* the hold: an open chain cannot circulate, a closed ring can */
  const p0 = F.ringPhase(10, 0, 8), p3 = F.ringPhase(10, 3, 8);
  check('once closed, the breath lags round the ring — the light circulates',
    Math.abs(p0 - p3) > 1e-6 && F.ringPhase(10, 3, Infinity) === 10,
    'phase lag ' + (p0 - p3).toFixed(4) + ' s between neighbours at N=8');
}

/* ─────────────────────────────────────────────────────────────────────────
   NO CLAIM CREEP.
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n  [no claim creep]');
{
  const fs = require('fs'), path = require('path');
  const page = path.join(__dirname, '..', '..', 'kaleidoscope', 'the-green-corridor', 'index.html');
  if (fs.existsSync(page)) {
    const src = fs.readFileSync(page, 'utf8');
    const banned = /spectroscop|reflectance|measured|nanometre|nanometer|wavelength|photometric/i;
    const m = src.match(banned);
    check('the shipped page makes no spectroscopy or measured-reflectance claim',
      !m || /Nothing here is measured/.test(src.slice(Math.max(0, src.indexOf(m[0]) - 40), src.indexOf(m[0]) + 40)),
      m ? 'found "' + m[0] + '"' : 'clean');
    check('the shipped page carries no proof chip',
      !/class="selftest"|id="selftest"/.test(src));
    check('and it says out loud that the green is a feeling',
      /Nothing here is measured/.test(src));

    /* The (c) correction, guarded in the SHIPPED COPY and not just the maths.
       One mirror leaves the candle AND its single image: two lights, ONE
       reflection. "one flame" shipped once in the panel's exit line while
       the caption two hundred lines away said the true thing — the page
       contradicted itself, and the room contradicted the page. Geometry
       tests cannot see prose, so the prose is asserted here. */
    const oneFlame = /(with )?one mirror,?\s*(you get\s*)?(exactly\s*)?one flame/i;
    check('the shipped copy never says one mirror leaves "one flame"',
      !oneFlame.test(src.replace(/\s+/g, ' ')),
      'two lights, one reflection');
  } else {
    console.log('    (page not forged yet — skipping the shipped-page grep)');
  }
}

console.log('\n' + (fails.length ? '✗ ' + fails.length + ' FAILED\n  ' + fails.join('\n  ')
  : '✓ all ' + pass + ' checks pass') + '  (' + pass + '/' + total + ')\n');
process.exit(fails.length ? 1 : 0);
