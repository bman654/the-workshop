/* ============================================================================
 *  THE WAKE — the Node twin.     node the-boathouse/the-wake/wake.test.mjs
 *
 *  What the room claims, checked against nothing but the model and arithmetic.
 *  Red controls included: every claim is paired with the case that should
 *  BREAK it, because a law nothing can falsify is decoration.
 * ========================================================================== */

import {
  G, KELVIN, EDGE_FRAC, EDGE_RADII, kappaOf, groupRatio, rayAngle, thetaFloor,
  halfAngle, machAngle, weight, thetaSamples, fieldAt, profileOf, peakAngle,
  edgeAngle, extrapolateEdge, scales,
} from './wake.mjs';

let pass = 0, fail = 0;
const D = (r) => r * 180 / Math.PI;
function ok(name, cond, note) {
  if (cond) { pass++; console.log('  ok   ' + name + (note ? '   ' + note : '')); }
  else { fail++; console.log('  FAIL ' + name + (note ? '   ' + note : '')); }
}
function near(name, got, want, tol, unit) {
  ok(name, Math.abs(got - want) <= tol,
     `got ${got.toFixed(6)}${unit || ''} want ${want.toFixed(6)}${unit || ''} tol ${tol}`);
}
function head(s) { console.log('\n── ' + s + ' ' + '─'.repeat(Math.max(0, 66 - s.length))); }

/* ═══ A · the dispersion relation is solved, not assumed ═══════════════════ */
head('A  the dispersion solve');
{
  // the root really satisfies tanh(kappa H)/kappa = cos^2 theta
  let worst = 0;
  for (const H of [0.4, 0.9, 1.0, 1.7, 4, 40]) {
    for (let i = 1; i <= 30; i++) {
      const t = thetaFloor(H) + (1.5 - thetaFloor(H)) * (i / 31);
      const k = kappaOf(t, H);
      if (k === null) continue;
      const res = Math.abs(Math.tanh(k * H) / k - Math.cos(t) ** 2);
      worst = Math.max(worst, res / Math.cos(t) ** 2);
    }
  }
  ok('root of tanh(kH)/k = cos^2 t to 1e-12 relative, all depths',
     worst < 1e-12, 'worst rel residual ' + worst.toExponential(2));

  near('deep limit: kappa = sec^2 theta at H=1e6', kappaOf(0.7, 1e6), 1 / Math.cos(0.7) ** 2, 1e-9);
  near('deep limit is exact at H=Infinity', kappaOf(0.7, Infinity), 1 / Math.cos(0.7) ** 2, 0);

  // no wave keeps up when the water is too shallow for that angle
  ok('supercritical H=0.5 forbids theta below acos(sqrt H)',
     kappaOf(0.5, 0.5) === null && kappaOf(0.0, 0.5) === null && kappaOf(1.2, 0.5) !== null);
  near('thetaFloor(H) = acos(sqrt H) for H<1', thetaFloor(0.36), Math.acos(0.6), 1e-12);
  ok('thetaFloor = 0 for H >= 1', thetaFloor(1) === 0 && thetaFloor(9) === 0);

  near('group ratio -> 1/2 in deep water', groupRatio(3, Infinity), 0.5, 0);
  near('group ratio -> 1 in shallow water', groupRatio(1e-5, 1), 1, 1e-8);
}

/* ═══ B · THE CLAIM: deep water opens at asin(1/3), whatever the boat ══════ */
head('B  the 19.4712 degree wedge');
{
  near('asin(1/3) in degrees', D(KELVIN), 19.471221, 1e-5, ' deg');

  const deep = halfAngle(Infinity);
  near('half angle on deep water', deep.alpha, KELVIN, 1e-9, ' rad');
  near('  ... reached at theta = 35.2644 deg', D(deep.theta), 35.264390, 1e-4, ' deg');
  near('  ... tan(alpha) = 1/(2 sqrt 2)', Math.tan(deep.alpha), 1 / (2 * Math.SQRT2), 1e-9);
  near('  ... the wave there is 3/2 the transverse one: kappa = 3/2',
       deep.kappa, 1.5, 1e-6);

  // the whole point: nothing about the boat is in it.  Nine craft, six decades
  // of mass, every one of them the same wedge.
  const craft = [
    ['a duckling',            0.35, 0.06],
    ['a swimmer',             1.2,  0.5],
    ['a rowing eight',        5.4,  17],
    ['a narrowboat',          3.1,  17],
    ['a fishing launch',      7.0,  9],
    ['a harbour ferry',       9.0,  32],
    ['a destroyer',          17.0, 150],
    ['a container ship',     11.5, 366],
    ['a supertanker',         7.7, 380],
  ];
  let worst = 0;
  for (const [name, U, b] of craft) {
    const s = scales(U, Infinity, b);
    const a = halfAngle(s.H).alpha;
    worst = Math.max(worst, Math.abs(a - KELVIN));
  }
  ok('nine craft, 0.35 to 17 m/s, 0.06 to 380 m: all 19.4712 deg',
     worst < 1e-12, 'largest departure ' + D(worst).toExponential(2) + ' deg');

  // RED CONTROL: take the dispersion away and the number is nonsense.
  // r = 1 (energy travelling at the phase speed) is shallow water, and there
  // the "deep" formula gives 90 degrees for every theta.
  // with c_g = c the ray angle collapses to 90 - theta, whose supremum is a
  // right angle: energy is thrown out sideways and there is no wedge at all.
  const nonDisp = (t) => Math.atan2(Math.sin(t) * Math.cos(t), 1 - Math.cos(t) ** 2);
  ok('RED: with c_g = c the ray angle is 90 - theta, so the wedge opens to 90 deg',
     Math.abs(D(nonDisp(0.4)) - (90 - D(0.4))) < 1e-9 &&
     Math.abs(D(nonDisp(1.2)) - (90 - D(1.2))) < 1e-9);
  // and a made-up group ratio moves the answer, so the 1/2 is load-bearing
  const bogus = (r) => {
    let m = 0;
    for (let i = 1; i < 4000; i++) {
      const t = (Math.PI / 2) * (i / 4000);
      const v = Math.atan2(r * Math.sin(t) * Math.cos(t), 1 - r * Math.cos(t) ** 2);
      m = Math.max(m, v);
    }
    return m;
  };
  ok('RED: r = 0.45 gives 16.9 deg, r = 0.55 gives 22.3 — the half is not free',
     Math.abs(D(bogus(0.45)) - 16.88) < 0.1 && Math.abs(D(bogus(0.55)) - 22.29) < 0.1,
     `${D(bogus(0.45)).toFixed(2)} / ${D(bogus(0.55)).toFixed(2)} deg`);
}

/* ═══ C · shallow water: the wedge opens, then becomes a sonic boom ════════ */
head('C  Kelvin to Mach, by one slider');
{
  // subcritical: wider than Kelvin, and it grows as the depth Froude -> 1
  const a70 = halfAngle(1 / 0.7 ** 2).alpha;       // Fr_h = 0.7
  const a90 = halfAngle(1 / 0.9 ** 2).alpha;       // Fr_h = 0.9
  ok('Fr_h 0.7 then 0.9: 19.47 < ' + D(a70).toFixed(2) + ' < ' + D(a90).toFixed(2) + ' deg',
     a70 > KELVIN && a90 > a70 && a90 < Math.PI / 2);
  near('deep water is recovered as h grows: H = 400 is within 0.01 deg of Kelvin',
       D(halfAngle(400).alpha), D(KELVIN), 0.01, ' deg');

  // supercritical: exactly the Mach cone, asin(1/Fr_h)
  let worst = 0;
  for (const Frh of [1.15, 1.4, 2, 3, 5, 9]) {
    const H = 1 / (Frh * Frh);
    const got = halfAngle(H).alpha, want = machAngle(Frh);
    worst = Math.max(worst, Math.abs(got - want));
  }
  ok('six supercritical depths: the half angle IS asin(1/Fr_h) to 1e-9',
     worst < 1e-9, 'worst ' + D(worst).toExponential(2) + ' deg');
  near('Fr_h = 2 gives 30 deg exactly', D(halfAngle(0.25).alpha), 30, 1e-7, ' deg');

  // the crossing: it goes to 90 degrees at the critical speed and comes back
  const near1 = halfAngle(1 / 0.999 ** 2).alpha;
  ok('at Fr_h = 0.999 the wake is all but a straight wall: ' + D(near1).toFixed(2) + ' deg',
     D(near1) > 80);
  ok('RED: the supercritical wedge is NOT 19.47 — it is speed-dependent',
     Math.abs(D(halfAngle(1 / 4).alpha) - 19.4712) > 10);
}

/* ═══ D · the sampled field is the field ═══════════════════════════════════ */
head('D  the superposition, and its exact slopes');
{
  const S = thetaSamples(Infinity, 0.5, 900);
  ok('sample list is symmetric in theta', (() => {
    for (let i = 0; i < S.n; i += 2) {
      if (Math.abs(S.theta[i] + S.theta[i + 1]) > 1e-15) return false;
      if (Math.abs(S.amp[i] - S.amp[i + 1]) > 1e-15) return false;
    } return true;
  })());

  // the field is symmetric about the track
  let sym = 0;
  for (const [X, Y] of [[-6, 3], [-14, 5], [-25, 9], [-3, 1.4]]) {
    const a = fieldAt(X, Y, S).z, b = fieldAt(X, -Y, S).z;
    sym = Math.max(sym, Math.abs(a - b) / (Math.abs(a) + 1e-9));
  }
  ok('zeta(X,-Y) = zeta(X,Y) to 1e-9 relative', sym < 1e-9, 'worst ' + sym.toExponential(2));

  // the analytic slopes match central differences of the field itself
  let ge = 0;
  const eps = 1e-4;
  for (const [X, Y] of [[-5, 1], [-12, 3.5], [-20, 6.2], [-2, 0.4], [1.5, 2]]) {
    const f = fieldAt(X, Y, S);
    const nx = (fieldAt(X + eps, Y, S).z - fieldAt(X - eps, Y, S).z) / (2 * eps);
    const ny = (fieldAt(X, Y + eps, S).z - fieldAt(X, Y - eps, S).z) / (2 * eps);
    const sc = Math.hypot(f.zx, f.zy) + 1e-6;
    ge = Math.max(ge, Math.hypot(f.zx - nx, f.zy - ny) / sc);
  }
  ok('exact slopes agree with finite differences to 1e-6 relative',
     ge < 1e-6, 'worst ' + ge.toExponential(2));

  // THE RADIATION CONDITION: no waves in front of the boat.
  let ahead = 0, behind = 0;
  for (let i = 1; i <= 40; i++) {
    ahead = Math.max(ahead, Math.abs(fieldAt(2 * Math.PI + i * 0.7, 0, S).z));
    behind = Math.max(behind, Math.abs(fieldAt(-2 - i * 0.7, 0, S).z));
  }
  ok('one wavelength ahead of the boat the water is flat: ' + (ahead / behind).toExponential(2) +
     ' of the wake behind it', ahead / behind < 1e-6);
  // RED: drop the radiation condition and a phantom wave train appears ahead
  const noW = (X, Y) => {
    let z = 0;
    for (let i = 0; i < S.n; i++) z += S.amp[i] * Math.sin(S.kappa[i] * (X * Math.cos(S.theta[i]) + Y * Math.sin(S.theta[i])));
    return z;
  };
  let phantom = 0;
  for (let i = 1; i <= 40; i++) phantom = Math.max(phantom, Math.abs(noW(2 * Math.PI + i * 0.7, 0)));
  ok('RED: without it, a phantom train runs ahead at ' + (phantom / behind).toFixed(2) +
     ' of the wake', phantom / behind > 0.1);

  // the transverse wavelength really is 2 pi / k0
  const axis = [];
  for (let i = 0; i < 4000; i++) axis.push(fieldAt(-2 - i * 0.02, 0, S).z);
  const zeros = [];
  for (let i = 1; i < axis.length; i++) if (axis[i - 1] < 0 && axis[i] >= 0) zeros.push(i * 0.02);
  const gaps = [];
  for (let i = 1; i < zeros.length; i++) gaps.push(zeros[i] - zeros[i - 1]);
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  near('crests along the track sit 2 pi apart (scaled) — the transverse wave',
       meanGap, 2 * Math.PI, 0.05);
}

/* ═══ E · the picture agrees with the theorem ══════════════════════════════ */
head('E  measured off the field, not derived');
{
  // The instrument: sweep an arc at radius R, record the steepest water at each
  // angle, and call the EDGE the widest angle still carrying EDGE_FRAC of the
  // profile's peak.  A caustic has an Airy tail whose angular width falls like
  // R^(-2/3), so that reading is always too wide — and too wide by an amount
  // that is a straight line in R^(-2/3).  Fit it and read the intercept.
  const ladder = (S, opt) => EDGE_RADII.map((R) =>
    D(edgeAngle(profileOf(S, R, Object.assign({ M: 300, K: 16, aMax: 1.15 }, opt)), EDGE_FRAC)));

  const S = thetaSamples(Infinity, 0.6944, 2400);          // Fr_b = 1.2
  const L = ladder(S);
  ok('the edge ladder shrinks with radius, as a caustic tail must',
     L.every((v, i) => i === 0 || v <= L[i - 1] + 1e-9),
     L.map((v, i) => `R${EDGE_RADII[i]}:${v.toFixed(1)}`).join(' '));
  const ex = extrapolateEdge(EDGE_RADII, L).alpha;
  near('extrapolated to infinite radius the DRAWN WATER gives back the wedge',
       ex, 19.4712, 1.2, ' deg');

  // three more hulls, same story
  const rows = [];
  for (const Frb of [0.8, 1.6, 2.4]) {
    const Sx = thetaSamples(Infinity, 1 / (Frb * Frb), 2400);
    rows.push([Frb, extrapolateEdge(EDGE_RADII, ladder(Sx)).alpha]);
  }
  ok('three more hulls extrapolate to the same wedge within 1.5 deg',
     rows.every((r) => Math.abs(r[1] - 19.4712) < 1.5),
     rows.map((r) => `Fr_b ${r[0]} -> ${r[1].toFixed(1)} deg`).join(' · '));

  // the supercritical case needs no extrapolation at all: a Mach front is a
  // shock-like edge, not a cusped caustic, and it reads true at every radius.
  const Ssup = thetaSamples(0.25, 0.35, 2400);             // Fr_h = 2
  const Lsup = ladder(Ssup);
  ok('Fr_h = 2 sandbank: the edge reads 30 deg at EVERY radius, no fit needed',
     Lsup.every((v) => Math.abs(v - 30) < 1.2),
     Lsup.map((v) => v.toFixed(1)).join(' '));

  // and a subcritical depth lands on its own predicted (wider) wedge
  const H85 = 1 / 0.85 ** 2;
  const S85 = thetaSamples(H85, 0.7, 2400);
  near('Fr_h = 0.85: the measured wedge is the predicted ' +
       D(halfAngle(H85).alpha).toFixed(2) + ' deg, not 19.47',
       extrapolateEdge(EDGE_RADII, ladder(S85)).alpha, D(halfAngle(H85).alpha), 1.2, ' deg');

  // WHERE THE BRIGHT WATER IS — a different question, with a different answer.
  const bright = [];
  for (const Frb of [0.45, 1.2, 1.8, 2.6, 3.4]) {
    const Sx = thetaSamples(Infinity, 1 / (Frb * Frb), 2400);
    bright.push([Frb, D(peakAngle(profileOf(Sx, 32, { M: 300, K: 16, aMax: 1.15 })))]);
  }
  ok('a slow fat hull puts its steepest water DEAD ASTERN — transverse rollers',
     bright[0][1] < 2, bright[0][1].toFixed(1) + ' deg at Fr_b 0.45');
  ok('a fast hull puts it in a V well INSIDE the wedge, and tightening',
     bright.slice(1).every((r, i) => i === 0 || r[1] < bright[i][1] + 1e-9) &&
     bright[bright.length - 1][1] < 8,
     bright.map((r) => `${r[0]}:${r[1].toFixed(1)}`).join(' '));
  ok('RED: through all of that the wedge itself never moved off 19.4712',
     Math.abs(D(halfAngle(Infinity).alpha) - 19.4712) < 1e-4);
}

/* ═══ F · the scale-free law ═══════════════════════════════════════════════ */
head('F  a duckling and a tanker draw the same picture');
{
  // same H and B, wildly different craft: identical scaled field
  const a = scales(1.0, Infinity, 0.10194);        // B = 1
  const b = scales(10.0, Infinity, 10.194);        // B = 1
  near('two craft, ten times apart, share B', a.B, b.B, 1e-9);
  const Sa = thetaSamples(a.H, a.B, 500), Sb = thetaSamples(b.H, b.B, 500);
  let worst = 0;
  for (const [X, Y] of [[-8, 2], [-17, 5], [-30, 10]]) {
    const fa = fieldAt(X, Y, Sa).z, fb = fieldAt(X, Y, Sb).z;
    worst = Math.max(worst, Math.abs(fa - fb));
  }
  ok('their scaled fields are the same field to 1e-12', worst < 1e-12);
  near('but the picture is 100x bigger: lambda0 = 2 pi U^2 / g',
       b.lambda0 / a.lambda0, 100, 1e-9);
  near('lambda0 at 5 m/s', scales(5, Infinity, 1).lambda0, 2 * Math.PI * 25 / G, 1e-9, ' m');
  // RED: change B and the picture is NOT the same
  const Sc = thetaSamples(Infinity, 4, 500);
  ok('RED: a different B is a different picture',
     Math.abs(fieldAt(-17, 5, Sa).z - fieldAt(-17, 5, Sc).z) > 0.05);
}

/* ═══ G · the sampling is honest ═══════════════════════════════════════════ */
head('G  the quadrature has converged');
{
  const B = 0.2;                                   // Fr_b = 2.2, a wide theta range
  const ref = thetaSamples(Infinity, B, 24000);
  for (const N of [800, 1600, 3000]) {
    const S = thetaSamples(Infinity, B, N);
    let worst = 0, scale = 0;
    for (const [X, Y] of [[-10, 2], [-22, 7], [-34, 11], [-44, 16], [-60, 21], [-80, 28]]) {
      const r = fieldAt(X, Y, ref).z, v = fieldAt(X, Y, S).z;
      worst = Math.max(worst, Math.abs(r - v));
      scale = Math.max(scale, Math.abs(r));
    }
    ok(`N = ${N} is within ${(100 * worst / scale).toFixed(3)}% of N = 24000 over the drawn domain`,
       worst / scale < 0.01);
  }
  // and it is the CHANGE OF VARIABLE that buys that.  Sampling the same
  // integral uniformly in theta at the same N is visibly wrong out at the rim.
  const sInTheta = (N) => {
    const t1 = thetaSamples(Infinity, B, 40).t1, half = N / 2;
    const o = { theta: new Float64Array(N), kappa: new Float64Array(N), amp: new Float64Array(N), n: N };
    let amax = 0;
    for (let i = 0; i < half; i++) {
      const t = t1 * ((i + 0.5) / half), w = weight(t, Infinity, B);
      const a = w * t1 / half, k = kappaOf(t, Infinity);
      o.theta[2 * i] = t; o.theta[2 * i + 1] = -t;
      o.kappa[2 * i] = o.kappa[2 * i + 1] = k;
      o.amp[2 * i] = o.amp[2 * i + 1] = a;
      if (w > amax) amax = w;
    }
    for (let j = 0; j < N; j++) o.amp[j] /= amax;
    return o;
  };
  const bad = sInTheta(800);
  let be = 0, bs = 0;
  for (const [X, Y] of [[-44, 16], [-60, 21], [-80, 28]]) {
    be = Math.max(be, Math.abs(fieldAt(X, Y, ref).z - fieldAt(X, Y, bad).z));
    bs = Math.max(bs, Math.abs(fieldAt(X, Y, ref).z));
  }
  ok('RED: uniform-in-theta at the same N is ' + (100 * be / bs).toFixed(0) +
     '% wrong at the rim — the tan substitution is doing the work', be / bs > 0.2);

  // the trim is not throwing anything away
  const wide = thetaSamples(Infinity, B, 3000);
  let wpk = 0;
  for (let i = 0; i <= 900; i++) wpk = Math.max(wpk, weight(1.5533 * i / 900, Infinity, B));
  ok('the weight at the trimmed edge is under 2e-4 of the peak, or the edge is 89 deg',
     weight(wide.t1, Infinity, B) <= 2.2e-4 * wpk || wide.t1 >= 1.5532,
     't1 = ' + D(wide.t1).toFixed(2) + ' deg, edge/peak = ' +
     (weight(wide.t1, Infinity, B) / wpk).toExponential(1));
}

/* ═══ summary ═════════════════════════════════════════════════════════════ */
console.log('\n' + '═'.repeat(72));
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═'.repeat(72));
process.exit(fail ? 1 : 0);
