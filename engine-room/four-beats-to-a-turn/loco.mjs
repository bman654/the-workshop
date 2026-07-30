/* ═══════════════════════════════════════════════════════════════════════════
   FOUR BEATS TO A TURN  ·  loco.mjs
   The engine behind engine-room/four-beats-to-a-turn/ — a two-cylinder
   double-acting steam locomotive, from the crank pin out to the chimney top.

   THIS FILE IS PURE. No DOM, no audio context, no canvas. Everything the page
   draws, sounds or prints comes from here, and loco.test.mjs runs the same
   functions in Node. That is the only way a claim survives contact with a
   renderer.

   THE SPINE OF THE ROOM
     A double-acting cylinder exhausts twice per revolution of the crank. Two
     cylinders quartered 90 degrees apart therefore exhaust FOUR times per
     revolution, evenly spaced, and every one of those exhausts is fired up
     the chimney as a beat you can hear. So

         beats per second  =  4 * v / (pi * D)        (while the wheels grip)

     which makes the sound of a locomotive a speedometer with no dial in it.
     When the wheels stop gripping that equality is the first thing to break —
     the beats race away and the train does not — and that IS what slipping is.

   WHAT IS EXACT HERE, AND WHAT IS A MODEL
     EXACT (and tested):
       · the crank/connecting-rod kinematics and their derivative;
       · four release events per revolution, evenly spaced, from the geometry;
       · the work closure: the torque integrated round one revolution equals
         the area of the four indicator diagrams, to quadrature error;
       · the adhesion bound: the rail force never exceeds mu * N.
     A MODEL, and labelled as one on the page:
       · the indicator diagram (hyperbolic expansion, constant back pressure,
         a wire-drawing term) — the standard schoolroom card, not a real one;
       · the boiler's capacitance and the fire's response to the blast. Both
         are lumped, both are motivated below, neither is a claim.

   NO BACKTICK MAY APPEAR IN THIS FILE — comments included. The page inlines it
   inside a String.raw template to hand to an AudioWorklet. (LANDMINES.md)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ATM = 101325;          /* Pa */
export const G   = 9.80665;         /* m/s^2 */
export const BAR = 1e5;

/* ── the machine ─────────────────────────────────────────────────────────────
   A British inside-frame 0-6-0 side tank with OUTSIDE cylinders, so that every
   moving part of the drive is out where a visitor can watch it. Dimensions are
   an unremarkable industrial/shunting engine of about 1900. */
export const SPEC = {
  wheelD:    1.372,     /* driving wheel diameter, m  (4 ft 6 in) */
  bore:      0.406,     /* cylinder bore, m           (16 in)     */
  stroke:    0.610,     /* piston stroke, m           (24 in)     */
  rodLen:    2.600,     /* connecting rod, m — 8 ft 6 in, L/r = 8.5 */
  axles:     3,         /* coupled axles */
  clearance: 0.08,      /* clearance volume, as a fraction of swept volume */
  release:   0.94,      /* exhaust opens at this fraction of the power stroke */
  exhClose:  0.10,      /* exhaust closes here on the return — compression begins */

  massLoco:  45000,     /* kg, all of it on the coupled wheels */
  massWagon: 25000,     /* kg per loaded mineral wagon */
  wheelI:    229,       /* kg m^2, six wheels + cranks + rods, about the axles */

  pSafety:   12.4 * BAR + ATM,   /* safety valves lift here (absolute) */
  steamMax:  1.9,       /* kg/s the fire can raise, flat out */

  /* boiler capacitance — see boilerCapacity() */
  waterMass: 2500,      /* kg of water at saturation */
  cpWater:   4400,      /* J/kg/K */
  hfg:       1.96e6,    /* J/kg latent heat at ~13 bar */
  dTsatdp:   3.5e-5,    /* K/Pa around 13 bar (188 C at 12 bar, 195 C at 14) */
  steamSpace: 1.6,      /* m^3 above the water */

  muDry:     0.22,      /* sanded, dry rail */
  muGreasy:  0.085,     /* wet leaf-mould autumn rail — the interesting one */
  fireTau:   22,        /* s, how slowly the fire answers the blast */
  poleSpacing: 55,      /* m between telegraph poles (60 yd) */
};

export const crankR   = () => SPEC.stroke / 2;
export const pistonA  = () => Math.PI * SPEC.bore * SPEC.bore / 4;
export const sweptV   = () => pistonA() * SPEC.stroke;
export const wheelR   = () => SPEC.wheelD / 2;

/* ── 1 · CRANK AND CONNECTING ROD ────────────────────────────────────────────
   s(t) is the distance from the crank axis to the little end, so the piston is
   at its OUTER dead centre at theta = 0 and its inner dead centre at theta = pi.
   ds/dtheta is written out rather than differenced: it is the lever arm that
   turns piston force into crank torque, and it is exactly zero at both dead
   centres, which is why a locomotive stopped on a dead centre cannot start. */
export function pistonPos(theta) {
  const r = crankR(), L = SPEC.rodLen, s = Math.sin(theta);
  return r * Math.cos(theta) + Math.sqrt(L * L - r * r * s * s);
}
export function pistonDeriv(theta) {
  const r = crankR(), L = SPEC.rodLen, s = Math.sin(theta), c = Math.cos(theta);
  const root = Math.sqrt(L * L - r * r * s * s);
  return -r * s - (r * r * s * c) / root;
}
/* fraction of the stroke the FRONT (outer, cover) end has swept, 0 at its own
   dead centre and 1 at the other. The back (crank) end is the same function of
   theta + pi. */
export function frontFrac(theta) {
  const r = crankR();
  return (pistonPos(0) - pistonPos(theta)) / (2 * r);
}

/* ── 2 · THE INDICATOR DIAGRAM ───────────────────────────────────────────────
   One cylinder end, one revolution. x is that end's swept fraction (0..1), and
   the end is on its POWER stroke while x is increasing and EXHAUSTING while x
   is decreasing. Volumes are in units of the swept volume, so V = c + x.

     admission   x < cutoff        p = pAdm, less wire drawing
     expansion   cutoff <= x < rel p = pAdm * (c + cutoff) / (c + x)     [n = 1]
     blowdown    x >= release      p falls fast to the back pressure
     exhaust     x decreasing      p = pBack
     compression x < exhClose      p = pBack * ((c + exhClose)/(c + x))^1.3

   Hyperbolic expansion (n = 1) is the textbook card for saturated steam that is
   re-evaporating off the cylinder walls as it expands. It is a model. */
export function endPressure(x, rising, cutoff, pAdm, pBack) {
  const c = SPEC.clearance, rel = SPEC.release;
  if (rising) {
    if (x < cutoff) return pAdm;
    const pe = pAdm * (c + cutoff) / (c + x);
    if (x < rel) return pe;
    /* blowdown over the last 6 % of the stroke */
    const pRel = pAdm * (c + cutoff) / (c + rel);
    const u = (x - rel) / (1 - rel);
    return pBack + (pRel - pBack) * Math.exp(-6 * u);
  }
  if (x > SPEC.exhClose) return pBack;
  return pBack * Math.pow((c + SPEC.exhClose) / (c + x), 1.3);
}

/* Wire drawing: the ports cannot pass steam infinitely fast, so admission
   pressure sags with piston speed. A single quadratic term, calibrated so a
   full-regulator engine at 4 rev/s loses about a quarter of boiler pressure. */
export function admissionPressure(pBoiler, regulator, absPistonSpeed) {
  const p = ATM + (pBoiler - ATM) * regulator;
  const drop = 1 / (1 + 0.010 * absPistonSpeed * absPistonSpeed);
  return ATM + (p - ATM) * drop;
}
/* Back pressure climbs with the speed the exhaust has to get out at. */
export function backPressure(revsPerSec) {
  return ATM + 0.10 * BAR + 0.050 * BAR * revsPerSec * revsPerSec;
}

/* Torque on the crankshaft from ONE cylinder at crank angle theta.
   Front end pushes the piston toward the crank (-s), back end away (+s), and
   torque = F_s * ds/dtheta. */
export function cylinderTorque(theta, cutoff, pAdm, pBack) {
  const A = pistonA();
  const xf = frontFrac(theta);
  const xb = 1 - xf;
  const frontRising = Math.sin(theta) > 0;     /* d(xf)/dtheta > 0 on (0, pi) */
  const pf = endPressure(xf, frontRising,  cutoff, pAdm, pBack);
  const pb = endPressure(xb, !frontRising, cutoff, pAdm, pBack);
  const Fs = (pb - pf) * A;                    /* force in the +s direction */
  return Fs * pistonDeriv(theta);
}
export function totalTorque(theta, cutoff, pAdm, pBack, quarterErr) {
  return cylinderTorque(theta, cutoff, pAdm, pBack)
       + cylinderTorque(theta + Math.PI / 2 + (quarterErr || 0), cutoff, pAdm, pBack);
}

/* Work done on one cylinder end in one revolution — the area of its card.
   Closed by numerical quadrature in x, which is what makes the closure test in
   the twin a real check on the torque expression rather than a tautology. */
export function endWork(cutoff, pAdm, pBack, n) {
  const N = n || 20000, Vs = sweptV();
  let up = 0, down = 0;
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N;
    up   += endPressure(x, true,  cutoff, pAdm, pBack);
    down += endPressure(x, false, cutoff, pAdm, pBack);
  }
  return (up - down) / N * Vs;
}

/* ── 3 · THE BEAT ────────────────────────────────────────────────────────────
   A beat is the moment an exhaust valve opens: that end's swept fraction
   crossing the release fraction on the way up. Four of them per revolution.

   beatPhases() returns the crank angles, in [0, 2pi), at which they happen —
   derived from the geometry, not spaced by hand. With perfect quartering they
   come out exactly pi/2 apart; with a quartering error they limp by exactly
   that error, which is what a badly-quartered engine sounds like. */
export function releaseAngle() {
  /* solve frontFrac(theta) = release on the rising branch (0, pi) */
  let lo = 0, hi = Math.PI;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (frontFrac(m) < SPEC.release) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
export function beatPhases(quarterErr) {
  const a = releaseAngle(), e = quarterErr || 0, T = Math.PI * 2;
  const raw = [a, a + Math.PI, a - Math.PI / 2 - e, a + Math.PI / 2 - e];
  return raw.map((v) => ((v % T) + T) % T).sort((p, q) => p - q);
}
/* Beat strength: the mass of steam let go, times how hard it is let go at.
   Both fall out of the card, so a long cutoff barks and a short one whispers. */
export function beatStrength(cutoff, pAdm, pBack) {
  const c = SPEC.clearance;
  const pRel = pAdm * (c + cutoff) / (c + SPEC.release);
  const over = Math.max(0, pRel - pBack);
  const vol  = (c + SPEC.release) * sweptV();
  return over * vol;                      /* joules, roughly: p dV at release */
}

/* ── 4 · BOILER AND FIRE ─────────────────────────────────────────────────────
   Saturated steam density, fitted to the steam tables over 1..15 bar absolute:
       rho = 0.590 * p_bar^0.9405        (within 0.7 % at 1, 5, 10 and 14 bar)
   The boiler's real capacitance is not the steam space — it is the WATER. Drop
   the pressure and the saturation temperature falls with it, and the sensible
   heat the water no longer needs flashes off as steam. Hence

       dm/dp  =  M_w * cp * (dTsat/dp) / h_fg   +   V_steam * drho/dp

   which is about 20 kg per bar here: two orders more than the steam space
   alone, and the reason a locomotive can be thrashed for a minute before the
   needle really moves. */
export function steamDensity(pAbs) {
  return 0.590 * Math.pow(pAbs / BAR, 0.9405);
}
export function dRhoDp(pAbs) {
  return 0.590 * 0.9405 * Math.pow(pAbs / BAR, -0.0595) / BAR;
}
export function boilerCapacity(pAbs) {
  return SPEC.waterMass * SPEC.cpWater * SPEC.dTsatdp / SPEC.hfg
       + SPEC.steamSpace * dRhoDp(pAbs);
}
/* Steam swallowed per revolution: four ends, each taking (clearance + cutoff)
   of a swept volume at admission density. */
export function steamPerRev(cutoff, pAdm) {
  return 4 * (SPEC.clearance + cutoff) * sweptV() * steamDensity(pAdm);
}

/* ── 5 · THE WHOLE ENGINE ────────────────────────────────────────────────────
   State: x (m along the line), v (m/s), theta (crank angle), omega (rad/s),
   p (boiler, absolute Pa), fire (0..1), slipping (bool), blowoff (0..1).

   Wheels:   I * alpha = tau - F_rail * r
   Train:    M * a     = F_rail - R - brake
   Gripping: a = alpha * r, so  a = (tau/r - R - brake) / (M + I/r^2)
             and F_rail = tau/r - (I/r^2) * a.
   If |F_rail| would exceed mu*N the wheels break away and the two integrate
   separately with F_rail pinned at the sliding limit. They re-lock when the rim
   speed catches the train AND the force the grip would have to hold is inside
   the limit — never on rim speed alone, or it chatters. */
export function newState(over) {
  const s = {
    x: 0, v: 0, theta: 0.7, omega: 0, p: SPEC.pSafety - 0.4 * BAR,
    fire: 0.30, slipping: false, blowoff: 0, slipSpeed: 0,
    wagons: 3, quarterErr: 0, sand: false,
    /* diagnostics, refreshed every step */
    tau: 0, fRail: 0, adhLimit: 0, steamUse: 0, steamGen: 0, pAdm: 0, pBack: 0,
    beats: 0, revs: 0, t: 0, distance: 0,
  };
  return Object.assign(s, over || {});
}
export function trainMass(st) { return SPEC.massLoco + st.wagons * SPEC.massWagon; }
export function adhesiveWeight() { return SPEC.massLoco * G; }
export function mu(st) { return st.sand ? SPEC.muDry : SPEC.muGreasy; }

/* Davis-style resistance, plus a breakaway term: a standing train is stickier
   than a rolling one, which is why a driver gives it a heave and then eases. */
export function resistance(st) {
  const M = trainMass(st), v = Math.abs(st.v);
  const roll = M * G * (0.0018 + 0.0042 * Math.exp(-v / 0.28));
  const air  = 0.5 * 1.2 * 12 * v * v;   /* a rake of open wagons is draggy */
  return roll + air;
}

/* One fixed-size step. Returns the list of beats fired during it, each with the
   exact fractional time inside the step at which its crank angle was crossed —
   the page schedules the sound at that instant, so the ear and the eye are
   locked to the same crank and not to the frame rate. */
export function step(st, dt, ctl) {
  const c = ctl || {};
  const regulator = clamp(c.regulator === undefined ? 0 : c.regulator, 0, 1);
  const cutoff    = clamp(c.cutoff === undefined ? 0.65 : c.cutoff, 0.08, 0.85);
  const brakeF    = clamp(c.brake === undefined ? 0 : c.brake, 0, 1) * 90000;
  st.sand = !!c.sand;
  if (c.wagons !== undefined) st.wagons = c.wagons;
  if (c.quarterErr !== undefined) st.quarterErr = c.quarterErr;

  const r = wheelR(), R = crankR(), M = trainMass(st), I = SPEC.wheelI;
  const revs = Math.abs(st.omega) / (2 * Math.PI);
  const pBack = backPressure(revs);
  const pistonSpeed = Math.abs(st.omega) * R;
  const pAdm = admissionPressure(st.p, regulator, pistonSpeed);
  st.pAdm = pAdm; st.pBack = pBack;

  /* torque at the current crank angle */
  const tau = regulator > 0.001
    ? totalTorque(st.theta, cutoff, pAdm, pBack, st.quarterErr)
    : -0.02 * st.omega * I;             /* regulator shut: the drive just drags */
  st.tau = tau;

  const dir = st.v > 1e-3 ? 1 : st.v < -1e-3 ? -1 : 0;
  const resMag = resistance(st);
  const drag = dir === 0 ? 0 : (resMag + brakeF) * dir;
  const limit = mu(st) * adhesiveWeight();
  st.adhLimit = limit;

  let a = 0, alpha = 0, fRail = 0;
  const Meff = M + I / (r * r);
  if (dir === 0 && Math.abs(tau / r) <= resMag + brakeF && !st.slipping) {
    /* standing still and the pull is inside what static friction holds back */
    a = 0; alpha = 0; fRail = tau / r; st.v = 0;
    if (Math.abs(fRail) > limit) st.slipping = true;
  } else if (!st.slipping) {
    a = (tau / r - drag) / Meff;
    fRail = tau / r - (I / (r * r)) * a;
    if (Math.abs(fRail) > limit) st.slipping = true;
    else alpha = a / r;
  }
  if (st.slipping) {
    const rel = st.omega * r - st.v;                    /* rim running away */
    fRail = limit * Math.sign(rel || (tau > 0 ? 1 : -1));
    alpha = (tau - fRail * r) / I;
    a = (fRail - drag) / M;
    /* re-lock: the rim has caught the rail AND grip could hold what is left */
    const relNext = (st.omega + alpha * dt) * r - (st.v + a * dt);
    if (rel * relNext <= 0) {
      const aLock = (tau / r - drag) / Meff;
      if (Math.abs(tau / r - (I / (r * r)) * aLock) <= limit) {
        st.slipping = false;
        a = aLock; alpha = a / r;
      }
    }
  }
  st.fRail = fRail;

  /* ── advance, catching every beat crossed on the way ─────────────────────── */
  const th0 = st.theta, omega0 = st.omega;
  st.v += a * dt;
  if (dir !== 0 && brakeF > 0 && st.v * dir < 0) st.v = 0;      /* brake to a stand */
  st.omega = st.slipping ? omega0 + alpha * dt : st.v / r;
  st.slipSpeed = st.omega * r - st.v;
  const th1 = th0 + 0.5 * (omega0 + st.omega) * dt;
  st.theta = th1;
  st.x += st.v * dt;
  st.distance += Math.abs(st.v) * dt;
  st.t += dt;

  const fired = [];
  if (th1 !== th0) {
    const phases = beatPhases(st.quarterErr);
    const T = Math.PI * 2;
    const lo = Math.min(th0, th1), hi = Math.max(th0, th1);
    const kLo = Math.floor(lo / T) - 1, kHi = Math.floor(hi / T) + 1;
    for (let k = kLo; k <= kHi; k++) {
      for (let i = 0; i < phases.length; i++) {
        const ang = k * T + phases[i];
        if (ang > lo && ang <= hi) {
          fired.push({ frac: (ang - th0) / (th1 - th0), phase: i, angle: ang });
        }
      }
    }
    fired.sort((p, q) => p.frac - q.frac);
    st.beats += fired.length;
    st.revs += (th1 - th0) / T;
  }

  /* ── boiler and fire ─────────────────────────────────────────────────────── */
  const use = regulator > 0.001 ? Math.abs(revs) * steamPerRev(cutoff, pAdm) : 0;
  st.steamUse = use;
  const blastTarget = clamp(0.26 + 0.62 * (use / 1.35), 0, 1.35);
  st.fire += (blastTarget - st.fire) * (1 - Math.exp(-dt / SPEC.fireTau));
  const gen = SPEC.steamMax * clamp(st.fire, 0, 1);
  st.steamGen = gen;
  st.p += (gen - use) / boilerCapacity(st.p) * dt;
  if (st.p > SPEC.pSafety) {
    st.blowoff = Math.min(1, st.blowoff + dt * 3);
    st.p = SPEC.pSafety;                       /* the valves hold it here */
  } else {
    st.blowoff = Math.max(0, st.blowoff - dt * 1.6);
  }
  if (st.p < ATM + 0.3 * BAR) st.p = ATM + 0.3 * BAR;

  /* the strength of each beat, once, from the card that fired it */
  const bs = regulator > 0.001 ? beatStrength(cutoff, pAdm, pBack) : 0;
  for (const b of fired) b.strength = bs;
  return fired;
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/* Predicted beat rate from the DRAWN speed. The page prints this next to the
   measured one; they agree while the wheels grip and part company when they
   do not. */
export function beatsPerSecFromSpeed(v) {
  return 4 * Math.abs(v) / (Math.PI * SPEC.wheelD);
}
export function beatsPerSecFromWheel(omega) {
  return 4 * Math.abs(omega) / (2 * Math.PI);
}

/* ── 6 · THE VOICE ───────────────────────────────────────────────────────────
   Each beat is a slug of steam let go into the smokebox and shoved up a tapered
   chimney. It is broadband, it is shaped by the chimney's own quarter-wave
   resonance, and it decays in a few tens of milliseconds. Synthesised here, in
   the same file the twin measures, so what the audio-lens reads is what the
   room plays.

   chuff(sr, strength, sharp) — one beat, mono, peak-normalised to <= 1.
     strength  0..1   how hard the steam was let go (from beatStrength)
     sharp     0..1   short cutoff gives a crisper, higher, drier bark
   The noise is deterministic (a small LCG) so the twin gets the same samples
   every time. */
export function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 * 2 - 1; };
}
export function chuff(sr, strength, sharp, seed) {
  const st = clamp(strength, 0, 1), sh = clamp(sharp === undefined ? 0.5 : sharp, 0, 1);
  const dur = 0.055 + 0.115 * (1 - sh) + 0.06 * st;
  const n = Math.max(8, Math.round(dur * sr));
  const out = new Float32Array(n);
  const rnd = lcg(seed === undefined ? 12345 : seed);
  /* two resonators: the chimney column and the smokebox thump */
  const f1 = 330 + 520 * sh, q1 = 2.4;
  const f2 = 78 + 34 * st,   q2 = 5.5;
  let y1 = 0, y1p = 0, y2 = 0, y2p = 0;
  const w1 = 2 * Math.PI * f1 / sr, w2 = 2 * Math.PI * f2 / sr;
  const d1 = Math.exp(-w1 / (2 * q1)), d2 = Math.exp(-w2 / (2 * q2));
  const a1 = 2 * d1 * Math.cos(w1), b1 = d1 * d1;
  const a2 = 2 * d2 * Math.cos(w2), b2 = d2 * d2;
  const attack = Math.max(2, Math.round(sr * (0.0016 + 0.004 * (1 - sh))));
  const tail   = 1 / (sr * (0.020 + 0.055 * (1 - sh) + 0.03 * st));
  for (let i = 0; i < n; i++) {
    const env = (i < attack ? i / attack : Math.exp(-(i - attack) * tail));
    const x = rnd() * env;
    const o1 = x + a1 * y1 - b1 * y1p; y1p = y1; y1 = o1;
    const o2 = x + a2 * y2 - b2 * y2p; y2p = y2; y2 = o2;
    out[i] = (o1 * 0.55 + o2 * 0.85 * (0.4 + 0.6 * st) + x * 0.35);
  }
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  const g = pk > 0 ? (0.25 + 0.75 * st) / pk : 0;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

/* A three-note chime whistle: three pipes a minor third and a fifth apart,
   which is why a whistle sounds like a chord and not like a kettle. */
export const WHISTLE_RATIOS = [1, 1.1892, 1.4983];   /* ~ 0, +3, +7 semitones */
export function whistle(sr, seconds, f0) {
  const n = Math.round(sr * seconds), out = new Float32Array(n);
  const base = f0 || 392;
  const rnd = lcg(777);
  let breath = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.09) * Math.min(1, (seconds - t) / 0.22);
    let s = 0;
    for (let k = 0; k < 3; k++) {
      const f = base * WHISTLE_RATIOS[k] * (1 + 0.0022 * Math.sin(2 * Math.PI * 5.5 * t + k));
      s += Math.sin(2 * Math.PI * f * t) * (k === 0 ? 1 : 0.72);
      s += Math.sin(4 * Math.PI * f * t) * 0.16;
    }
    breath = breath * 0.86 + rnd() * 0.14;
    out[i] = (s / 3 * 0.8 + breath * 0.22) * env;
  }
  return out;
}

/* ═══ the number the room is named for ═══════════════════════════════════════
   Beats per revolution: cylinders x ends. Stated here once so nothing else has
   to hard-code a 4. */
export const BEATS_PER_REV = 2 * 2;
