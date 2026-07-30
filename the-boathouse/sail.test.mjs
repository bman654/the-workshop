/* ============================================================================
   sail.test.mjs — the Node twin for the two-foil sailing core.

       node the-boathouse/sail.test.mjs

   What is worth testing here is NOT "does the boat go the speed I like". It is
   the one thing the room claims, which is a statement about two arrows:

       beta_apparent  =  eps_air  +  eps_water

   and its three consequences — a drag machine can never make ground upwind,
   cutting water drag points you higher just as hard as cutting air drag, and
   nothing in the theorem mentions speed.

   The strongest check in this file is the last one: the theorem is re-tested on
   two hundred craft with RANDOM numbers in every coefficient — nonsense rigs on
   nonsense hulls — and it still holds to a millionth of a degree, because it was
   never about the numbers.
   ============================================================================ */

import {
  CRAFT, DEG, KT, RHO_AIR, RHO_WATER, G, NU_WATER,
  foil, forces, newState, step, settle, polar, polarSummary,
  trueFromApparent, wrapPi, bestTrim
} from './sail.mjs';

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${name}${detail ? '   ' + detail : ''}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name}   ${detail || ''}`); }
}
function near(name, got, want, tol, unit) {
  const d = Math.abs(got - want);
  ok(name, d <= tol, `${got.toPrecision(8)} vs ${want.toPrecision(8)}  (|d|=${d.toExponential(2)}${unit || ''}, tol ${tol})`);
}
function head(s) { console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 70 - s.length))}`); }

const ENV = (v, from) => ({ windSpeed: v, windFrom: from === undefined ? 0 : from });

/* ══ 1. the aerofoil, against thin-aerofoil theory ═══════════════════════════ */
head('1. the foil obeys the theory it was built from');
{
  const p = { ar: 4.1, camber: 0, cd0: 0.05, e: 0.8, stall: 0.30 };
  const slope = 2 * Math.PI * p.ar / (p.ar + 2);
  const a = 0.05;
  near('lift slope at 2.9 deg = 2*pi*AR/(AR+2)', foil(a, p).cl / a, slope, 1e-12);
  near('a flat plate at zero incidence makes no lift', foil(0, p).cl, 0, 1e-15);

  /* a cambered thin aerofoil's zero-lift angle is -2*(camber/chord) */
  const pc = { ...p, camber: 0.085 };
  near('zero-lift angle = -2 * camber', foil(-2 * 0.085, pc).cl, 0, 1e-12, ' rad');

  /* induced drag: CL^2/(pi AR e) above the profile floor */
  const f = foil(0.10, p);
  near('induced drag = CL^2/(pi AR e)', f.cd - p.cd0, f.cl * f.cl / (Math.PI * p.ar * p.e), 1e-12);

  /* past stall the blend must reach the flat-plate law: a board held square to
     the flow is CD ~ 2, which is what a sail on a dead run actually is */
  const sq = foil(Math.PI / 2, p);
  near('at 90 deg the blend hands back the barn-door CD', sq.cd - p.cd0, 2.0, 1e-9);
  near('at 90 deg it makes no lift', sq.cl, 0, 1e-15);
  ok('the blend is monotone through the stall', (() => {
    let prev = -Infinity, mono = true;
    for (let d = 0; d <= 40; d += 0.5) { const c = foil(d / DEG, p).cd; if (c < prev - 1e-12) mono = false; prev = c; }
    return mono;
  })());
}

/* ══ 2. the ITTC-1957 friction line, against its published values ═══════════ */
head('2. hull friction is the published line, not a shape I liked');
{
  /* Cf = 0.075/(log10 Re - 2)^2 — the 1957 ITTC model-ship correlation line.
     Its values are tabulated; check three decades against the arithmetic and
     against the numbers a naval architect would look up. */
  const cf = Re => 0.075 / Math.pow(Math.log10(Re) - 2, 2);
  near('Cf(1e6)  = 4.688e-3', cf(1e6), 4.688e-3, 1e-6);
  near('Cf(1e7)  = 3.000e-3', cf(1e7), 3.000e-3, 1e-6);
  near('Cf(1e9)  = 1.531e-3', cf(1e9), 1.531e-3, 1e-6);
  ok('friction falls with Reynolds number', cf(1e6) > cf(1e7) && cf(1e7) > cf(1e9));

  /* and it is the line the core is actually using */
  const c = CRAFT.dinghy, env = ENV(6);
  const st = newState(c, { psi: -Math.PI / 2, vx: 0, vy: -2.0, sheet: 0.6 });
  const Vb = 2.0, Re = Vb * c.ground.lwl / NU_WATER;
  const f = forces(c, st, env);
  const qw = 0.5 * RHO_WATER * Vb * Vb;
  const expect = qw * (c.ground.swet * (cf(Re) * c.ground.formK + f.cw) + c.ground.area * c.ground.cd0);
  ok('the hull drag at zero leeway is exactly friction + the wave hump',
    Math.abs(f.Dh - expect) / expect < 1e-9, `Dh=${f.Dh.toFixed(4)} N`);
  near('Froude number at 2 m/s over a 3.85 m waterline', f.fn, 2.0 / Math.sqrt(G * 3.85), 1e-12);
}

/* ══ 3. the wind triangle ════════════════════════════════════════════════════ */
head('3. the wind triangle closes');
{
  const c = CRAFT.dinghy, env = ENV(6);
  let worst = 0;
  for (let d = 30; d <= 170; d += 10) {
    const s = settle(c, env, d / DEG);
    if (!s.settled) continue;
    /* the angle to the TRUE wind, rebuilt from the apparent one and the two speeds */
    const rebuilt = Math.abs(trueFromApparent(s.f.betaA, s.f.Va, s.Vb)) * DEG;
    worst = Math.max(worst, Math.abs(rebuilt - s.f.twa * DEG));
  }
  ok('true angle rebuilt from the apparent one, over 15 headings',
    worst < 1e-6, `worst ${worst.toExponential(2)} deg`);

  /* the true angle is always WIDER than the apparent one, once moving */
  let wider = true, samples = 0;
  for (let d = 30; d <= 170; d += 10) {
    const s = settle(c, env, d / DEG);
    if (!s.settled || s.Vb < 0.5) continue;
    samples++;
    if (!(s.f.twa * DEG > s.f.betaA * DEG - 1e-9)) wider = false;
  }
  ok('the wind you feel is always further forward than the wind there is', wider, `${samples} headings`);
}

/* ══ 4. THE COURSE THEOREM ═══════════════════════════════════════════════════ */
head('4. THE COURSE THEOREM: beta_a = eps_air + eps_water');
{
  let worstErr = 0, worstAt = '', n = 0, worstResid = 0;
  let worstCross = 0;
  for (const id of Object.keys(CRAFT)) {
    for (const V of [3, 6, 11]) {
      /* and at a wind blowing from somewhere arbitrary, so nothing is axis-aligned */
      const env = ENV(V, 0.7734);
      for (let d = 25; d <= 175; d += 5) {
        const s = settle(CRAFT[id], env, d / DEG);
        if (!s.settled) continue;
        n++;
        const err = Math.abs(s.f.betaA * DEG - (s.f.epsA * DEG + s.f.epsH * DEG));
        if (err > worstErr) { worstErr = err; worstAt = `${id} ${V} m/s ${d} deg`; }
        worstResid = Math.max(worstResid, s.residual);
        /* and the REASON: the two forces are exactly antiparallel */
        const cross = (s.f.Fax * s.f.Fhy - s.f.Fay * s.f.Fhx) / (s.f.Fa * s.f.Fh);
        const dot = (s.f.Fax * s.f.Fhx + s.f.Fay * s.f.Fhy) / (s.f.Fa * s.f.Fh);
        worstCross = Math.max(worstCross, Math.abs(cross));
        if (!(dot < -0.999999)) { worstCross = 9; }
      }
    }
  }
  ok('holds over every settled state of 3 craft x 3 winds x 31 headings',
    worstErr < 1e-4 && n > 200, `${n} states, worst ${worstErr.toExponential(2)} deg at ${worstAt}`);
  ok('because the air force and the water force are ANTIPARALLEL',
    worstCross < 3e-5, `worst |sin(angle between)| = ${worstCross.toExponential(2)}`);
  ok('and every one of those states really did come to rest',
    worstResid < 1e-5, `worst |Fa+Fh|/|Fa| = ${worstResid.toExponential(2)}`);
  /* and the residue is not slop, it is the whole of the error: the identity is
     off by no more than the angle the two arrows are from opposite. */
  ok('the identity is off by no more than the state is from rest',
    worstErr / DEG <= worstResid * 1.05,
    `${(worstErr / DEG).toExponential(2)} rad of error against ${worstResid.toExponential(2)} of residual`);
}

/* ══ 5. A DRAG MACHINE CAN NEVER MAKE GROUND UPWIND ═════════════════════════ */
head('5. a craft with no lift in the air can never make ground upwind');
{
  const bd = CRAFT.barndoor;
  let maxVmg = -Infinity, minCourse = Infinity, epsWorst = 0, n = 0;
  for (const V of [2, 6, 14]) {
    const p = polar(bd, ENV(V, -1.1), { step: 2 });
    for (const r of p) {
      if (!r.settled) continue;
      n++;
      maxVmg = Math.max(maxVmg, r.vmg);
      minCourse = Math.min(minCourse, r.twaMeasured);
      epsWorst = Math.max(epsWorst, Math.abs(r.epsA - 90));
    }
  }
  ok('its air drag angle is exactly 90 degrees, at every heading and every wind',
    epsWorst < 1e-11, `${n} states, worst departure ${epsWorst.toExponential(2)} deg`);
  ok('so its course is never inside 90 deg of the wind it feels — and therefore never upwind',
    maxVmg <= 0, `best VMG to windward = ${maxVmg.toFixed(4)} m/s (closest course ${minCourse.toFixed(1)} deg)`);

  /* and the same hull with a SAIL on it does make ground upwind — the difference
     is the one term, not the boat */
  const up = polarSummary(polar(CRAFT.dinghy, ENV(6), { step: 2 }), 6);
  ok('put a foil on the same hull and it points 35 deg and gains to windward',
    up.closest.twaMeasured < 40 && up.bestUpwind.vmg > 1.5,
    `closest ${up.closest.twaMeasured.toFixed(1)} deg, best VMG ${up.bestUpwind.vmg.toFixed(2)} m/s`);
}

/* ══ 6. BOTH TERMS ARE ON THE SAME FOOTING ══════════════════════════════════ */
head('6. cutting drag in the water points you higher, exactly as air drag does');
{
  const base = CRAFT.dinghy;
  const closest = c => {
    const s = polarSummary(polar(c, ENV(6), { step: 1 }), 6);
    return s.closest ? s.closest.twaMeasured : NaN;
  };
  const c0 = closest(base);

  /* halve the WATER drag only */
  const wet = JSON.parse(JSON.stringify(base));
  wet.ground.swet *= 0.5; wet.ground.cwSat *= 0.5;
  const cW = closest(wet);

  /* halve the AIR drag only, by about the same number of degrees of drag angle */
  const air = JSON.parse(JSON.stringify(base));
  air.rig.cd0 *= 0.5; air.rig.windage *= 0.5;
  const cA = closest(air);

  ok('halving the water drag makes it point higher', cW < c0 - 0.5,
    `${c0.toFixed(1)} -> ${cW.toFixed(1)} deg`);
  ok('halving the air drag makes it point higher', cA < c0 - 0.5,
    `${c0.toFixed(1)} -> ${cA.toFixed(1)} deg`);

  /* and the ledger balances exactly: whatever you change about the craft, the
     movement of beta is the movement of eps_air PLUS the movement of eps_water,
     with nothing left over. That is worth checking because it is where the
     interesting behaviour hides — cutting AIR drag improves eps_air by nearly
     three degrees and buys only half a degree of pointing, because the boat
     goes faster and hands most of it straight back to the water. */
  const at = (c, deg) => settle(c, ENV(6), deg / DEG);
  const s0 = at(base, 50), sW = at(wet, 50), sA = at(air, 50);
  for (const [what, s] of [['water', sW], ['air', sA]]) {
    const dA_ = (s.f.epsA - s0.f.epsA) * DEG;
    const dH_ = (s.f.epsH - s0.f.epsH) * DEG;
    const dB_ = (s.f.betaA - s0.f.betaA) * DEG;
    ok(`cutting ${what} drag: d beta = d eps_air + d eps_water, exactly`,
      Math.abs(dB_ - dA_ - dH_) < 1e-5,
      `d beta ${dB_.toFixed(4)} = ${dA_.toFixed(4)} (air) + ${dH_.toFixed(4)} (water) deg, over by ${Math.abs(dB_ - dA_ - dH_).toExponential(1)}`);
  }
}

/* ══ 7. NOTHING IN THE THEOREM MENTIONS SPEED ═══════════════════════════════ */
head('7. the theorem says nothing about speed — so an iceboat outruns the wind');
{
  const ice = polarSummary(polar(CRAFT.iceboat, ENV(6), { step: 2 }), 6);
  const din = polarSummary(polar(CRAFT.dinghy, ENV(6), { step: 2 }), 6);
  ok('the iceboat beats the wind that is pushing it',
    ice.speedRatio > 1, `${ice.speedRatio.toFixed(2)} x the true wind`);
  ok('the hull that has to make waves does not',
    din.speedRatio < 1, `${din.speedRatio.toFixed(2)} x the true wind`);
  ok('the iceboat makes ground to WINDWARD faster than the wind blows',
    ice.bestUpwind.vmg > 6, `VMG ${ice.bestUpwind.vmg.toFixed(2)} m/s in a 6.00 m/s wind`);

  /* the reason is the last line of the theorem: on the ice the sum of the two
     drag angles is ~10 deg, so the apparent wind sits ten degrees off the course
     no matter how fast the thing goes. Double the wind and beta barely moves
     while the speed nearly doubles. */
  const a = settle(CRAFT.iceboat, ENV(3), 70 / DEG);
  const b = settle(CRAFT.iceboat, ENV(6), 70 / DEG);
  ok('double the wind: the speed nearly doubles',
    b.Vb / a.Vb > 1.9, `${a.Vb.toFixed(2)} -> ${b.Vb.toFixed(2)} m/s (x${(b.Vb / a.Vb).toFixed(3)})`);
  ok('...and the angle to the apparent wind hardly moves at all',
    Math.abs(b.f.betaA - a.f.betaA) * DEG < 0.3,
    `${(a.f.betaA * DEG).toFixed(3)} -> ${(b.f.betaA * DEG).toFixed(3)} deg`);

  /* and the wave hump is the reason the hull cannot: it saturates */
  const fast = settle(CRAFT.dinghy, ENV(20), 100 / DEG);
  ok('the displacement hull piles into its own wave and stops there',
    fast.f.fn > 0.4 && fast.f.cw > 0.5 * CRAFT.dinghy.ground.cwSat,
    `Fn ${fast.f.fn.toFixed(3)}, Cw ${fast.f.cw.toExponential(2)} of a ${CRAFT.dinghy.ground.cwSat} ceiling`);
}

/* ══ 8. the sail is a membrane, and a membrane can only pull ════════════════ */
head('8. sheeted too far out, the sail luffs instead of pushing');
{
  const c = CRAFT.dinghy, env = ENV(6);
  const st = newState(c, { psi: -0.9, vx: 1.2 * Math.cos(-0.9), vy: 1.2 * Math.sin(-0.9) });
  st.sheet = bestTrim(c, st, env);
  const tight = forces(c, st, env);
  st.sheet = c.sheetMax;
  const slack = forces(c, st, env);
  ok('let the sheet run and the cloth shakes', slack.luff > 0.9 && tight.luff < 1e-6,
    `luff ${tight.luff.toFixed(3)} sheeted in, ${slack.luff.toFixed(3)} sheeted out`);
  ok('and the drive collapses', slack.drive < 0.12 * tight.drive,
    `${tight.drive.toFixed(1)} N -> ${slack.drive.toFixed(1)} N`);

  /* bestTrim really does find the best drive, checked against a fine sweep */
  let worst = 0;
  for (let d = 30; d <= 170; d += 20) {
    const s = settle(c, env, d / DEG);
    const probe = { ...s.st };
    const best = bestTrim(c, probe, env);
    probe.sheet = best;
    const fBest = forces(c, probe, env).drive;
    let sweep = -Infinity;
    for (let i = 0; i <= 400; i++) { probe.sheet = c.sheetMax * i / 400; sweep = Math.max(sweep, forces(c, probe, env).drive); }
    worst = Math.max(worst, (sweep - fBest) / Math.abs(sweep));
  }
  ok('the trim it picks is the best there is, against a 400-point sweep',
    worst < 1e-5, `worst shortfall ${(worst * 100).toExponential(2)} %`);
}

/* ══ 9. symmetry and determinism ════════════════════════════════════════════ */
head('9. the sea has no favourite side, and the model has no memory');
{
  const c = CRAFT.dinghy;
  const a = settle(c, ENV(6, 0.4), 55 / DEG);
  const b = settle(c, ENV(6, 0.4 + Math.PI / 3), 55 / DEG);
  near('turn the wind 60 deg and the same heading gives the same speed', b.Vb, a.Vb, 1e-9, ' m/s');
  near('...and the same angle to the apparent wind', b.f.betaA, a.f.betaA, 1e-12);

  const r1 = settle(c, ENV(7.3, -2.0), 88 / DEG);
  const r2 = settle(c, ENV(7.3, -2.0), 88 / DEG);
  ok('the same question twice gives bit-identical answers',
    r1.Vb === r2.Vb && r1.f.betaA === r2.f.betaA && r1.st.sheet === r2.st.sheet);

  near('wrapPi folds to (-pi, pi]', wrapPi(3 * Math.PI + 0.25), 0.25 - Math.PI, 1e-12);
  near('one knot is 1852 m in an hour', KT, 1852 / 3600, 1e-6);
  ok('the two densities are the two fluids', RHO_AIR === 1.225 && RHO_WATER === 1025);
}

/* ══ 10. the free-sailing integrator agrees with the tank ═══════════════════ */
head('10. a boat actually sailed reaches the speed the tank predicted');
{
  const c = CRAFT.dinghy, env = ENV(6);
  const target = 75 / DEG;
  const tank = settle(c, env, target);
  /* now sail it for real: heading free, a helmsman holding the course with the
     rudder, the crew trimming. It must arrive at the tank's answer. */
  const st = newState(c, { psi: wrapPi(env.windFrom - target), vx: 0.01, vy: 0.01, sheet: 0.5 });
  const dt = 0.02;
  for (let i = 0; i < 6000; i++) {
    const err = wrapPi(wrapPi(env.windFrom - target) - st.psi);
    step(c, st, env, dt, { rudder: Math.max(-0.5, Math.min(0.5, -2.2 * err - 0.9 * st.r)), autoTrim: (i % 10 === 0) });
  }
  const Vb = Math.hypot(st.vx, st.vy);
  ok('free-sailing speed matches the pinned-heading speed',
    Math.abs(Vb - tank.Vb) / tank.Vb < 0.03,
    `sailed ${Vb.toFixed(3)} vs tank ${tank.Vb.toFixed(3)} m/s`);

  /* The theorem is a statement about a boat that is NOT ACCELERATING, and the
     room draws the two arrows live, so it is worth knowing exactly how the
     identity decays when the boat is being worked.  Mid-tack, with the rudder
     hard over and the boat slowing, the two arrows are visibly not opposite and
     beta is degrees away from the sum.  Let the helm go and both come back. */
  const mid = newState(c, { psi: wrapPi(env.windFrom - 0.75), sheet: 0.35 });
  mid.vx = 2.4 * Math.cos(mid.psi); mid.vy = 2.4 * Math.sin(mid.psi);
  for (let i = 0; i < 40; i++) step(c, mid, env, 0.02, { rudder: 0.6, sheet: 0.35 });
  const fm = forces(c, mid, env);
  const residM = Math.hypot(fm.Fax + fm.Fhx, fm.Fay + fm.Fhy) / fm.Fa;
  const errM = Math.abs(fm.betaA - fm.epsA - fm.epsH) * DEG;
  ok('mid-tack, the boat IS accelerating and the identity is visibly off',
    residM > 0.05 && errM > 0.5, `residual ${residM.toFixed(3)}, beta off by ${errM.toFixed(2)} deg`);

  /* now stop working her and let the same state come to rest */
  for (let i = 0; i < 12000; i++) step(c, st, env, 0.02, { sheet: st.sheet, freezeHeading: true });
  const f = forces(c, st, env);
  const residS = Math.hypot(f.Fax + f.Fhx, f.Fay + f.Fhy) / f.Fa;
  ok('let her settle and the identity comes back with the balance',
    residS < 1e-8 && Math.abs(f.betaA - f.epsA - f.epsH) * DEG < 1e-6,
    `residual ${residS.toExponential(2)}, beta off by ${(Math.abs(f.betaA - f.epsA - f.epsH) * DEG).toExponential(2)} deg`);

  /* a tack: bear through the wind and come out the other side with way on */
  const t = newState(c, { psi: wrapPi(env.windFrom - 0.75), sheet: 0.35 });
  t.vx = 2.2 * Math.cos(t.psi); t.vy = 2.2 * Math.sin(t.psi);
  const want = wrapPi(env.windFrom + 0.75);
  let through = false;
  for (let i = 0; i < 1500; i++) {
    const err = wrapPi(want - t.psi);
    step(c, t, env, 0.02, { rudder: Math.max(-0.6, Math.min(0.6, 2.6 * err - 0.8 * t.r)), autoTrim: (i % 8 === 0) });
    if (Math.abs(wrapPi(want - t.psi)) < 0.05) { through = true; break; }
  }
  ok('she comes about, and comes out with way on', through && Math.hypot(t.vx, t.vy) > 0.7,
    `through in ${through ? 'time' : 'NO'}, ${Math.hypot(t.vx, t.vy).toFixed(2)} m/s out of the tack`);
}

/* ══ 11. THE THEOREM DOES NOT CARE ABOUT THE MODEL ══════════════════════════ */
head('11. two hundred craft with nonsense numbers, and it still holds');
{
  /* If (1) were a fit, or an accident of the coefficients I chose, then a craft
     with random garbage in every coefficient would break it. It cannot: the
     theorem is a statement about two arrows pointing opposite ways, and it knows
     nothing about aerofoils, hulls, or the sea. */
  let seed = 20260729;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const R = (a, b) => a + (b - a) * rnd();

  let worst = 0, worstDesc = '', n = 0, skipped = 0;
  for (let k = 0; k < 200; k++) {
    const c = {
      id: 'rnd' + k, name: 'rnd', mass: R(60, 900), Iz: R(90, 1500),
      rig: {
        area: R(1.5, 22), ar: R(1.2, 11), camber: R(0, 0.20), cd0: R(0.005, 0.30),
        e: R(0.5, 0.99), stall: R(0.12, 0.45), mode: 'foil',
        ce: R(1, 5), boom: 2.4, luff: 5, windage: R(0, 3.0), cdw: R(0.4, 1.4)
      },
      ground: {
        mode: 'water', lwl: R(1.8, 12), swet: R(0.8, 30), area: R(0.03, 1.6),
        ar: R(0.6, 9), e: R(0.5, 0.99), stall: R(0.10, 0.40),
        formK: R(1.0, 1.6), cwSat: R(0.001, 0.06), fnRef: R(0.28, 0.75), cd0: R(0.002, 0.05)
      },
      rudder: { area: R(0.02, 0.5), arm: R(0.8, 5), ar: 3 },
      righting: R(400, 40000), heelMax: R(0.05, 0.7), sheetMax: R(1.0, 1.57)
    };
    for (const d of [40, 75, 120, 160]) {
      const s = settle(c, ENV(R(2, 16), R(-3, 3)), d / DEG, { maxT: 300 });
      if (!s.settled) { skipped++; continue; }
      n++;
      const err = Math.abs(s.f.betaA * DEG - (s.f.epsA + s.f.epsH) * DEG);
      if (err > worst) { worst = err; worstDesc = `craft ${k} at ${d} deg`; }
    }
  }
  ok('the course theorem on 200 randomly-generated craft',
    worst < 1e-4 && n > 500, `${n} settled states (${skipped} never settled), worst ${worst.toExponential(2)} deg at ${worstDesc}`);

  /* and the drag-machine corollary is equally indifferent to the numbers:
     give any of those hulls a pure drag rig and it can never gain to windward */
  let bestUpwindAnywhere = -Infinity;
  for (let k = 0; k < 40; k++) {
    const c = {
      id: 'bd' + k, name: 'bd', mass: R(60, 900), Iz: R(90, 1500),
      rig: { area: R(1.5, 22), ar: 4, camber: 0, cd0: 0, e: 0.8, stall: 0.3,
             mode: 'drag', cd: R(0.6, 2.0), ce: R(1, 4), boom: 2.4, luff: 5,
             windage: R(0, 2), cdw: R(0.4, 1.4) },
      ground: { mode: 'water', lwl: R(1.8, 12), swet: R(0.8, 30), area: R(0.03, 1.6),
                ar: R(0.6, 9), e: R(0.5, 0.99), stall: R(0.10, 0.40), formK: R(1.0, 1.6),
                cwSat: R(0.001, 0.06), fnRef: R(0.28, 0.75), cd0: R(0.002, 0.05) },
      rudder: { area: R(0.02, 0.5), arm: R(0.8, 5), ar: 3 },
      righting: R(400, 40000), heelMax: R(0.05, 0.7), sheetMax: 1.57
    };
    for (let d = 10; d <= 170; d += 10) {
      const s = settle(c, ENV(R(2, 16)), d / DEG, { maxT: 200 });
      if (!s.settled) continue;
      bestUpwindAnywhere = Math.max(bestUpwindAnywhere, s.Vb * Math.cos(s.f.twa));
    }
  }
  ok('and no drag machine, on any hull, ever gains a metre to windward',
    bestUpwindAnywhere <= 0, `best VMG found anywhere = ${bestUpwindAnywhere.toExponential(3)} m/s`);
}

/* ══ report ═════════════════════════════════════════════════════════════════ */
console.log(`\n${'═'.repeat(74)}`);
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) { console.log('  failing: ' + failures.join(', ')); process.exit(1); }
console.log('  the two arrows point opposite ways, and everything else follows.');
