/* ============================================================================
   sail.mjs — the two-foil sailing core.   the-boathouse/

   A sailing craft is TWO FOILS working in TWO FLUIDS, back to back:
   one in the air (the sail), one in the water (the hull, board and rudder).
   Everything a boat can and cannot do falls out of that one picture.

   THE COURSE THEOREM (the only thing this room claims)
     In any steady state the boat is not accelerating, so the force the air
     makes on it and the force the water makes on it are EXACTLY OPPOSITE.
     Write each of those two forces as a lift perpendicular to its own flow
     plus a drag along it, and call the angle between each force and its own
     perpendicular the DRAG ANGLE:

         eps_air   = atan(D_air   / L_air)      measured off the apparent wind
         eps_water = atan(D_water / L_water)    measured off the boat's course

     Then, purely because the two vectors are antiparallel,

         beta_apparent  =  eps_air  +  eps_water                        (1)

     where beta_apparent is the angle between the boat's COURSE and the wind
     it FEELS.  Not an approximation, not a fit: a statement about two arrows
     pointing opposite ways.  It is the whole of sailing.

     Read it twice and it starts giving things away.
       · A craft driven by DRAG ALONE has L_air = 0, so eps_air = 90 deg, so
         its course is always more than 90 deg from the wind it feels — and
         therefore (the wind triangle below) more than 90 deg from the true
         wind.  A drag machine can never make ground upwind.  Ever.
       · To point higher you must cut drag in the WATER exactly as hard as in
         the air.  Both terms are on the same footing.  Put the same rig on
         steel runners on ice and eps_water collapses to about a degree.
       · Nothing in (1) mentions speed.  That is why an iceboat can outrun the
         wind that is pushing it, and a hull that has to make waves cannot.

   THE WIND TRIANGLE
     apparent wind velocity  A = W - V     (W true wind velocity, V boat)
     so the angle to the TRUE wind is always WIDER than the angle to the
     apparent wind once you are moving:
         beta_true = atan2( Va sin b_a ,  Va cos b_a - Vb )

   WHAT IS MODELLED, AND HOW HONESTLY
     · Sail: thin-aerofoil lift slope 2*pi*AR/(AR+2) about a zero-lift angle
       of -2*(camber/chord) rad, induced drag CL^2/(pi*AR*e), blended into the
       flat-plate law CL=2 sin a cos a, CD=2 sin^2 a past stall.  The blend is
       what lets one expression carry the sail from close-hauled to a dead run
       (at a run the sail is at 90 deg and the flat-plate law hands back a
       barn door, CD ~ 2, which is exactly what it is).
     · A membrane can only pull.  Below zero incidence the sail LUFFS: the
       force collapses toward nothing and the cloth shakes.
     · Hull friction is the ITTC-1957 line, Cf = 0.075/(log10 Re - 2)^2, with a
       form factor.  That is a published formula, not a shape I liked.
     · Wave-making is a MODELLED hump, and is labelled as such in the room:
       a saturating Fn^6 term.  Nothing is claimed of it except that it is the
       reason a displacement hull cannot outrun the wind.
     · Ice runners are Coulomb, not fluid: sliding drag mu*m*g with mu = 0.012
       (steel on ice is published at 0.005-0.02) and a modelled lateral grip
       limit, because a sharpened blade cuts a groove.
     · Heel scales the whole aerodynamic force by cos(heel) — uniformly, so
       (1) is untouched by it.

   No part of this file contains a polar diagram, a pointing angle, a table of
   boat speeds, or the number 42.  Those are all OUTPUTS.
   Twin: `node the-boathouse/sail.test.mjs`
   ============================================================================ */

export const RHO_AIR = 1.225;
export const RHO_WATER = 1025;
export const G = 9.80665;
export const NU_WATER = 1.19e-6;   /* kinematic viscosity of sea water, m^2/s */
export const KT = 0.5144444;       /* one knot in m/s */

/* ---------- small angle helpers ---------------------------------------- */
export function wrapPi(a) {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a - Math.PI;
}
export const DEG = 180 / Math.PI;
function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }
function smooth01(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

/* ---------- the aerofoil ------------------------------------------------ */
/* alpha is the GEOMETRIC incidence of the chord to the flow, radians.
   Returns coefficients referenced to the plan area.                        */
export function foil(alpha, p) {
  const a0 = 2 * (p.camber || 0);            /* thin-aerofoil zero-lift angle */
  const aE = alpha + a0;                     /* effective incidence          */
  const slope = 2 * Math.PI * p.ar / (p.ar + 2);
  const clAtt = slope * aE;
  const cdAtt = p.cd0 + clAtt * clAtt / (Math.PI * p.ar * p.e);
  const s = Math.sin(aE), c = Math.cos(aE);
  const clSep = 2 * s * c;
  const cdSep = p.cd0 + 2 * s * s;
  const t = smooth01((Math.abs(aE) - p.stall) / 0.14);
  return {
    cl: clAtt * (1 - t) + clSep * t,
    cd: cdAtt * (1 - t) + cdSep * t,
    sep: t,
    aEff: aE
  };
}

/* ---------- craft ------------------------------------------------------- */
/* Three craft, one theorem.  They differ only in their two drag angles.    */
export const CRAFT = {
  dinghy: {
    id: 'dinghy', name: 'The Dinghy',
    blurb: 'A planing dinghy: a good sail over a hull that has to make waves.',
    mass: 168, Iz: 300,
    rig: { area: 7.0, ar: 4.1, camber: 0.085, cd0: 0.055, e: 0.80, stall: 0.30,
           mode: 'foil', ce: 2.25, boom: 2.6, luff: 5.4, windage: 0.55, cdw: 0.9 },
    ground: { mode: 'water', lwl: 3.85, swet: 3.30, area: 0.34, ar: 3.6, e: 0.90,
              stall: 0.22, formK: 1.15, cwSat: 0.0135, fnRef: 0.44, cd0: 0.006 },
    rudder: { area: 0.105, arm: 1.95, ar: 3.0 },
    righting: 2050,                 /* N.m per radian of heel                */
    heelMax: 0.52,
    sheetMax: 1.48                  /* how far the boom can go out (rad)     */
  },
  iceboat: {
    id: 'iceboat', name: 'The Iceboat',
    blurb: 'The same idea on steel runners: the water term all but deleted.',
    mass: 205, Iz: 420,
    rig: { area: 5.6, ar: 6.2, camber: 0.060, cd0: 0.040, e: 0.88, stall: 0.26,
           mode: 'foil', ce: 2.60, boom: 2.2, luff: 6.0, windage: 0.42, cdw: 0.8 },
    ground: { mode: 'ice', mu: 0.012, grip: 2.4, latStiff: 26.0 },
    rudder: { area: 0.06, arm: 2.4, ar: 3.0 },
    righting: 9000,
    heelMax: 0.10,
    sheetMax: 1.25
  },
  barndoor: {
    id: 'barndoor', name: 'The Barn Door',
    blurb: 'A square board held square to the wind: drag, and nothing else.',
    mass: 168, Iz: 300,
    rig: { area: 7.0, ar: 4.1, camber: 0, cd0: 0, e: 0.8, stall: 0.3,
           mode: 'drag', cd: 1.18, ce: 2.25, boom: 2.6, luff: 5.4,
           windage: 0.55, cdw: 0.9 },
    ground: { mode: 'water', lwl: 3.85, swet: 3.30, area: 0.34, ar: 3.6, e: 0.90,
              stall: 0.22, formK: 1.15, cwSat: 0.0135, fnRef: 0.44, cd0: 0.006 },
    rudder: { area: 0.105, arm: 1.95, ar: 3.0 },
    righting: 2050,
    heelMax: 0.52,
    sheetMax: 1.57
  }
};

export function newState(craft, opts) {
  opts = opts || {};
  return {
    x: opts.x || 0, y: opts.y || 0,
    vx: opts.vx || 0, vy: opts.vy || 0,
    psi: opts.psi != null ? opts.psi : 0,
    r: 0, heel: 0, sheet: opts.sheet != null ? opts.sheet : 0.5,
    rudder: 0
  };
}

/* ---------- the water / ice side --------------------------------------- */
function groundForce(craft, Vb, lambda) {
  const g = craft.ground;
  if (g.mode === 'ice') {
    /* Coulomb: a blade in ice.  Lateral force rises stiffly with slip and
       saturates where the groove gives way; sliding drag is mu*W and does
       not care how fast you are going. */
    const W = craft.mass * G;
    const capacity = g.grip * W;
    const lat = clamp(-lambda * g.latStiff * W, -capacity, capacity);
    const drag = g.mu * W * Math.tanh(Vb / 0.25);
    return { lift: lat, drag: drag, cw: 0, fn: 0, sep: Math.abs(lat) / capacity };
  }
  /* water */
  const q = 0.5 * RHO_WATER * Vb * Vb;
  const Re = Math.max(1e4, Vb * g.lwl / NU_WATER);
  const cf = 0.075 / Math.pow(Math.log10(Re) - 2, 2);
  const fn = Vb / Math.sqrt(G * g.lwl);
  const xr = fn / g.fnRef, x6 = Math.pow(xr, 6);
  const cw = g.cwSat * x6 / (1 + x6);                 /* modelled wave hump   */
  const fl = foil(-lambda, { ar: g.ar, camber: 0, cd0: g.cd0, e: g.e, stall: g.stall });
  const lift = q * g.area * fl.cl;
  const drag = q * (g.swet * (cf * g.formK + cw) + g.area * fl.cd);
  return { lift, drag, cw, fn, cf, sep: fl.sep };
}

/* ---------- the whole force picture ------------------------------------ */
/* Returns forces in the world plane plus the two drag angles.             */
export function forces(craft, st, env) {
  const cp = Math.cos(st.psi), sp = Math.sin(st.psi);
  const bowx = cp, bowy = sp, ptx = -sp, pty = cp;   /* bow and port units    */

  const Vb = Math.hypot(st.vx, st.vy);
  const Wx = -env.windSpeed * Math.cos(env.windFrom);
  const Wy = -env.windSpeed * Math.sin(env.windFrom);
  const Ax = Wx - st.vx, Ay = Wy - st.vy;            /* apparent wind vector  */
  const Va = Math.hypot(Ax, Ay);
  const ahx = Va > 1e-9 ? Ax / Va : 0, ahy = Va > 1e-9 ? Ay / Va : 0;
  /* the direction the apparent wind comes FROM */
  const fx = Va > 1e-9 ? -ahx : Math.cos(env.windFrom);
  const fy = Va > 1e-9 ? -ahy : Math.sin(env.windFrom);
  const awa = Math.atan2(fx * ptx + fy * pty, fx * bowx + fy * bowy);
  const side = awa >= 0 ? 1 : -1;                    /* +1: wind from port    */

  /* --- the sail ------------------------------------------------------- */
  const rig = craft.rig;
  const qa = 0.5 * RHO_AIR * Va * Va;
  let cl = 0, cd = 0, sep = 0, luff = 0, alpha = 0, aEff = 0;
  if (rig.mode === 'drag') {
    cd = rig.cd; cl = 0; alpha = 0; aEff = 0;
  } else {
    alpha = Math.abs(awa) - st.sheet;
    const f = foil(alpha, rig);
    cl = f.cl; cd = f.cd; sep = f.sep; aEff = f.aEff;
    /* a membrane cannot push: below zero incidence it shakes */
    luff = smooth01((-alpha) / 0.13);
    if (luff > 0) {
      cl *= (1 - luff);
      cd = cd * (1 - luff) + (0.10 + 0.55 * luff) * luff;
    }
  }
  const heelScale = Math.cos(st.heel);
  const La = qa * rig.area * cl * heelScale;
  const Da = qa * (rig.area * cd * heelScale + rig.windage * rig.cdw);

  /* lift acts across the apparent wind, toward the leeward bow */
  const lax = side > 0 ? -ahy : ahy;
  const lay = side > 0 ? ahx : -ahx;
  const Fax = La * lax + Da * ahx;
  const Fay = La * lay + Da * ahy;
  const Fa = Math.hypot(Fax, Fay);

  /* --- the water (or the ice) ------------------------------------------ */
  let lambda = 0, Fhx = 0, Fhy = 0, gf = { lift: 0, drag: 0, cw: 0, fn: 0, sep: 0 };
  let vhx = 0, vhy = 0;
  if (Vb > 1e-6) {
    vhx = st.vx / Vb; vhy = st.vy / Vb;
    lambda = Math.atan2(vhx * ptx + vhy * pty, vhx * bowx + vhy * bowy);
    gf = groundForce(craft, Vb, lambda);
    /* lift to port of the course when slipping to starboard, and back */
    Fhx = gf.lift * (-vhy) - gf.drag * vhx;
    Fhy = gf.lift * (vhx) - gf.drag * vhy;
  }
  const Fh = Math.hypot(Fhx, Fhy);

  /* --- the two drag angles, and the one orientation they must share ----- */
  /* Both angles must be measured off perpendiculars on the SAME side, and the
     side that matters is the side of the COURSE the apparent wind comes from —
     never the side of the BOW.  Two traps, both of which cost a debug cycle:
     (a) atan(D/|L|) is the textbook line and it folds a lift that has changed
         sides — a backed sail, a hull slipping the other way, anything near a
         dead run — onto the wrong branch; keep the sign and use atan2, which
         lands in (0, pi).
     (b) the tack read off the bow is the WRONG orientation the moment the boat
         is going backwards, which a barn door pointed at the wind does all day.
         With the bow's tack, (1) missed by up to 135 degrees on states whose two
         force vectors were provably antiparallel to a part in ten billion.
     With the course's side, (1) is unconditional.                            */
  const courseSide = Vb > 1e-6 ? (vhx * fy - vhy * fx >= 0 ? 1 : -1) : side;
  const epsA = Math.atan2(Da, courseSide * side * La);
  const epsH = Vb > 1e-6 ? Math.atan2(gf.drag, courseSide * gf.lift) : Math.PI / 2;

  /* --- the two angles the theorem is about ----------------------------- */
  /* the angle between the course made good and the wind the boat feels */
  let betaA = NaN;
  if (Vb > 1e-6 && Va > 1e-9) betaA = Math.acos(clamp(vhx * fx + vhy * fy, -1, 1));
  /* the same, to the true wind */
  const twaSigned = Vb > 1e-6
    ? Math.atan2(Math.cos(env.windFrom) * vhy - Math.sin(env.windFrom) * vhx,
                 Math.cos(env.windFrom) * vhx + Math.sin(env.windFrom) * vhy)
    : NaN;
  const twa = Math.abs(twaSigned);

  /* drive and side force in the boat's own frame */
  const drive = Fax * bowx + Fay * bowy;
  const sideF = Fax * ptx + Fay * pty;

  return {
    Va, awa, side, alpha, aEff, cl, cd, sep, luff,
    La, Da, Fax, Fay, Fa, epsA,
    lambda, Lh: gf.lift, Dh: gf.drag, Fhx, Fhy, Fh, epsH,
    cw: gf.cw, fn: gf.fn, groundSep: gf.sep,
    Vb, betaA, twa, twaSigned, drive, sideF,
    heelScale
  };
}

/* ---------- pick the sheeting that drives hardest ---------------------- */
export function bestTrim(craft, st, env) {
  if (craft.rig.mode === 'drag') return craft.sheetMax;
  const probe = { ...st };
  let best = 0, bestF = -Infinity;
  const N = 26, hi = craft.sheetMax;
  for (let i = 0; i <= N; i++) {
    const s = hi * i / N;
    probe.sheet = s;
    const f = forces(craft, probe, env);
    if (f.drive > bestF) { bestF = f.drive; best = s; }
  }
  /* one golden refinement around the winner */
  let lo = Math.max(0, best - hi / N), up = Math.min(hi, best + hi / N);
  for (let k = 0; k < 18; k++) {
    const m1 = lo + (up - lo) * 0.382, m2 = lo + (up - lo) * 0.618;
    probe.sheet = m1; const f1 = forces(craft, probe, env).drive;
    probe.sheet = m2; const f2 = forces(craft, probe, env).drive;
    if (f1 > f2) up = m2; else lo = m1;
  }
  return (lo + up) / 2;
}

/* ---------- one step of the real thing --------------------------------- */
/* ctl: { rudder (rad, +port), sheet (rad) or autoTrim:true, freezeHeading } */
export function step(craft, st, env, dt, ctl) {
  ctl = ctl || {};
  if (ctl.autoTrim) st.sheet = bestTrim(craft, st, env);
  else if (ctl.sheet != null) st.sheet = clamp(ctl.sheet, 0, craft.sheetMax);
  const rud = clamp(ctl.rudder || 0, -0.62, 0.62);
  st.rudder = rud;

  const f = forces(craft, st, env);

  /* heel: quasi-static balance of the heeling moment against the righting
     stiffness, relaxed toward it so it does not snap. */
  const heelTarget = clamp(-f.sideF * craft.rig.ce / craft.righting,
                           -craft.heelMax, craft.heelMax);
  st.heel += (heelTarget - st.heel) * clamp(dt * 2.2, 0, 1);

  /* translate: added mass is much larger sideways than forward */
  const cp = Math.cos(st.psi), sp = Math.sin(st.psi);
  const bowx = cp, bowy = sp, ptx = -sp, pty = cp;
  const Fx = f.Fax + f.Fhx, Fy = f.Fay + f.Fhy;
  const Fsurge = Fx * bowx + Fy * bowy;
  const Fsway = Fx * ptx + Fy * pty;
  const mS = craft.mass * 1.08, mW = craft.mass * (craft.ground.mode === 'ice' ? 1.05 : 2.4);
  const aS = Fsurge / mS, aW = Fsway / mW;
  st.vx += (aS * bowx + aW * ptx) * dt;
  st.vy += (aS * bowy + aW * pty) * dt;

  if (!ctl.freezeHeading) {
    /* yaw: rudder, weather helm from heel, and damping */
    const u = st.vx * bowx + st.vy * bowy;
    const qr = 0.5 * RHO_WATER * craft.rudder.area;
    const slopeR = 2 * Math.PI * craft.rudder.ar / (craft.rudder.ar + 2);
    const aR = clamp(rud + f.lambda, -0.5, 0.5);
    const clR = clamp(slopeR * aR, -1.35, 1.35);
    const Nrud = qr * clR * u * Math.abs(u) * craft.rudder.arm;
    const Nheel = 0.34 * st.heel * f.drive * craft.rig.ce;
    const Ndamp = -craft.Iz * 1.35 * st.r * (0.6 + 0.5 * Math.abs(u));
    const Nweather = -420 * f.lambda * Math.min(1, u * u / 4);
    st.r += (Nrud + Nheel + Ndamp + Nweather) / craft.Iz * dt;
    st.psi = wrapPi(st.psi + st.r * dt);
  } else { st.r = 0; }

  st.x += st.vx * dt;
  st.y += st.vy * dt;
  return f;
}

/* ---------- steady state at a held heading ------------------------------ */
/* This is a tank test: pin the heading, let the crew trim, and wait.
   `twaTarget` is the TRUE WIND ANGLE the heading is pinned at, in radians:
   0 is head to wind, pi/2 is a beam reach, pi is a dead run.  The wind is put
   on the PORT bow, so the boat is on starboard tack throughout.             */
export function settle(craft, env, twaTarget, opts) {
  opts = opts || {};
  const dt = opts.dt || 0.05;
  const maxT = opts.maxT || 240;
  const head = wrapPi(env.windFrom - twaTarget);
  const st = newState(craft, {
    psi: head,
    vx: 0.01 * Math.cos(head),
    vy: 0.01 * Math.sin(head),
    sheet: 0.4
  });
  /* Converge on the thing the theorem actually needs — the FORCE BALANCE — and
     not on the boat speed.  Watching the speed stop changing is the obvious test
     and it is the wrong one: near a dead run the speed is flat to a part in ten
     million while the heel is still creeping, and the two force vectors are a
     few degrees from opposite.  Every one of those states then walks into the
     theorem check looking settled and fails it by ten degrees or more.
     |Fa + Fh| / |Fa| is zero in a true steady state, by definition.            */
  const resid = ff => (ff && ff.Fa > 1e-9
    ? Math.hypot(ff.Fax + ff.Fhx, ff.Fay + ff.Fhy) / ff.Fa : Infinity);
  let f = null, trimEvery = 6, i = 0;
  const n = Math.round(maxT / dt);
  const wantResid = opts.tol || 1e-10;
  for (i = 0; i < n; i++) {
    if (i % trimEvery === 0) st.sheet = bestTrim(craft, st, env);
    f = step(craft, st, env, dt, { sheet: st.sheet, freezeHeading: true });
    if (i > 60 && i % 10 === 0 && resid(f) < wantResid) break;
  }
  const v0 = Math.hypot(st.vx, st.vy);
  st.sheet = bestTrim(craft, st, env);
  /* a few clean steps at the final trim so the reported forces are settled */
  for (let k = 0; k < 80; k++) {
    f = step(craft, st, env, dt, { sheet: st.sheet, freezeHeading: true });
    if (k > 20 && resid(f) < wantResid) break;
  }
  const Vb = Math.hypot(st.vx, st.vy);
  /* In a true steady state the two forces are EXACTLY opposite, so their sum
     is zero.  That residual — and nothing else — is what makes (1) hold; report
     it so a caller can throw out a row that never actually came to rest.      */
  const residual = resid(f);
  return {
    twaHeld: twaTarget, Vb, st, f,
    vmgUp: Vb * Math.cos(f.twa),
    vmgDown: -Vb * Math.cos(f.twa),
    residual,
    drift: Math.abs(Vb - v0) / Math.max(0.05, Vb),
    settled: residual < 1e-6 && Vb > 1e-3,
    steps: i
  };
}

/* ---------- a polar, found by sailing ---------------------------------- */
export function polar(craft, env, opts) {
  opts = opts || {};
  const step_ = opts.step || 2;               /* degrees                     */
  const from = opts.from || 0, to = opts.to || 180;
  const out = [];
  for (let d = from; d <= to; d += step_) {
    const s = settle(craft, env, d / DEG, opts);
    out.push({
      twa: d,                                /* the heading held, deg off the true wind */
      twaMeasured: s.f.twa * DEG,            /* the COURSE actually made good           */
      Vb: s.Vb,
      awa: s.f.betaA * DEG,                  /* course to the APPARENT wind = beta_a    */
      epsA: s.f.epsA * DEG,
      epsH: s.f.epsH * DEG,
      Va: s.f.Va,
      vmg: s.Vb * Math.cos(s.f.twa),         /* + is ground made to windward            */
      luff: s.f.luff,
      sheet: s.st.sheet,
      residual: s.residual,
      settled: s.settled
    });
  }
  return out;
}

/* ---------- summaries the room prints ----------------------------------- */
export function polarSummary(p, windSpeed) {
  let best = null, bestDown = null, fastest = null, closest = null;
  for (const row of p) {
    if (!isFinite(row.Vb) || row.Vb < 1e-4 || !row.settled) continue;
    if (!best || row.vmg > best.vmg) best = row;
    if (!bestDown || -row.vmg > -bestDown.vmg) bestDown = row;
    if (!fastest || row.Vb > fastest.Vb) fastest = row;
    if (row.vmg > 1e-3 && (!closest || row.twaMeasured < closest.twaMeasured)) closest = row;
  }
  return {
    bestUpwind: best, bestDownwind: bestDown, fastest, closest,
    speedRatio: fastest ? fastest.Vb / windSpeed : 0
  };
}

/* the wind triangle, solved the other way: given the angle to the apparent
   wind and the speed ratio, what is the angle to the true wind?            */
export function trueFromApparent(betaA, Va, Vb) {
  return Math.atan2(Va * Math.sin(betaA), Va * Math.cos(betaA) - Vb);
}
