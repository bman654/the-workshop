// ============================================================================
//  THE GAFFER'S BENCH — glass.mjs
//
//  A hot-glass core.  DOM-free, dependency-free, forge-inlinable, and runnable
//  in Node (`node the-foundry/the-gaffers-bench/glass.test.mjs`).
//
//  It knows four things, and everything the bench does is one of them.
//
//  1 · GLASS HAS NO MELTING POINT.  It has a viscosity that falls smoothly
//      through fourteen decades, and that single fact is why the craft exists
//      at all.  The curve here is a Vogel–Fulcher–Tammann fit
//          log10 eta = A + B / (T - T0)          eta in Pa*s, T in degC
//      FITTED HERE, in code, to the three published fixed points of soda-lime
//      float glass — working 10^3 at 1015 degC, softening 10^6.6 at 727 degC,
//      annealing 10^12 at 545 degC.  Three points, three unknowns, no fudge.
//      The fit is then asked for a fourth point nobody gave it — the STRAIN
//      point, 10^13.5 — and it answers 515 degC against a published 505-515.
//      That is an out-of-sample hit and it is the twin's first check.
//
//  2 · A BUBBLE OF HOT GLASS IS A VISCOUS MEMBRANE.  Blow into a shell of
//      thickness t, mean curvature H, viscosity mu, against a net outward
//      traction q, and it moves along its own normal at
//          v_n = q / (12 mu t H^2)
//      That 12 is not a taste.  For a sphere it is what you get by setting the
//      work you do, p dV/dt, equal to the heat the glass eats, the integral of
//      12 mu edot^2 over the wall — and the twin does exactly that integral,
//      numerically, and gets the same number.
//
//  3 · IT SAGS, AND THAT IS TROUTON'S RULE.  Every station carries the weight
//      of the glass beyond it.  Uniaxial extension of a Newtonian fluid needs
//      three times its shear viscosity, so the axial strain rate is
//          edot_z = g M_beyond / (3 mu * 2 pi r t)
//      The pipe SPINS, so only the component of gravity along the pipe
//      survives a turn: g_axial = g cos(tilt).  The sideways component
//      averages to nothing.  That is not a modelling convenience — it is the
//      reason a gaffer never stops turning.
//
//  4 · THIN HOT GLASS COOLS FAST.  Two faces radiating at 1300 K into a room
//      lose about a quarter of a megawatt per square metre, and three
//      millimetres of glass has almost no heat in it, so the piece drops some
//      thirty kelvin a second.  Nobody tuned the working time.  It falls out
//      of Stefan-Boltzmann and it is about ten seconds.
//
//  WHAT IS MODELLED AND WHAT IS NOT, plainly:
//    · The piece is AXISYMMETRIC by construction, which the spin earns.
//    · The membrane is treated as locally equibiaxial — it stretches the same
//      amount in both surface directions.  A real parison does not exactly,
//      and a full meridional boundary-value solve would say so; this does not
//      pretend to be that.  Everything it DOES claim it claims exactly:
//      mass is conserved to machine precision through inflation, sag, jacking
//      and remeshing alike, and the sphere case reduces to the energy balance.
//    · Devitrification, the real chemistry of the batch, and the elastic
//      solid below the strain point are all absent.  Below about 500 degC the
//      viscosity is simply so large that nothing moves, which is the truth to
//      four decimals and much cheaper than a solid solver.
//
//  UNITS ARE SI THROUGHOUT.  Metres, kilograms, seconds, pascals, kelvin —
//  except viscosity's temperature argument, which is in degrees Celsius,
//  because that is the language every published fixed point is written in.
// ============================================================================

/* ── the material: soda-lime-silica, the glass every hot shop actually uses ── */
export const GLASS = {
  rho:    2500,     // kg/m^3   density of the melt
  cp:     1200,     // J/(kg K) specific heat, hot
  emiss:  0.90,     // -        thermal emissivity of the surface
  gamma:  0.30,     // N/m      surface tension at working heat
  hConv:  15,       // W/(m^2 K) still-air convection off both faces
  kTherm: 1.2,      // W/(m K)  conductivity — only used for along-wall smoothing
};
export const SIGMA_SB = 5.670374419e-8;   // W m^-2 K^-4
export const G_ACCEL  = 9.80665;          // m/s^2
export const T_AMBIENT_K = 295;           // K — a hot shop is not cold, but it is not a furnace

/* ══════════════════════════════════════════════════════════════════════════
   1 · VISCOSITY — the Vogel-Fulcher-Tammann curve, FITTED here
   ══════════════════════════════════════════════════════════════════════════ */

/* The three published fixed points of soda-lime float glass.  These are the
   ONLY numbers put in by hand.  A, B and T0 are solved from them below. */
export const FIXED_POINTS = [
  { name: 'working',   logEta: 3.0,  TC: 1015, note: 'gathering and blowing heat' },
  { name: 'softening', logEta: 6.6,  TC: 727,  note: 'it holds its own weight'    },
  { name: 'annealing', logEta: 12.0, TC: 545,  note: 'stress relaxes in minutes'  },
];
/* Deliberately NOT fitted — the twin asks the fit to predict it. */
export const STRAIN_POINT = { name: 'strain', logEta: 13.5, TC_published: 510, tol: 12 };

/* Solve  y_i = A + B/(T_i - T0)  for the three unknowns.  Eliminating A and B
   leaves one linear equation in T0; the rest is back-substitution. */
export function fitVFT(pts = FIXED_POINTS){
  const [p1, p2, p3] = pts;
  const y1 = p1.logEta, y2 = p2.logEta, y3 = p3.logEta;
  const T1 = p1.TC,     T2 = p2.TC,     T3 = p3.TC;
  /* (y1-y2)/(y2-y3) = [(T2-T1)(T3-T0)] / [(T3-T2)(T1-T0)]  ->  linear in T0 */
  const R = ((y1 - y2) * (T3 - T2)) / ((y2 - y3) * (T2 - T1));   // = (T3-T0)/(T1-T0)
  const T0 = (T3 - R * T1) / (1 - R);
  const B  = (y2 - y3) / (1 / (T2 - T0) - 1 / (T3 - T0));
  const A  = y1 - B / (T1 - T0);
  return { A, B, T0 };
}
export const VFT = fitVFT();

/* log10 of the viscosity in Pa*s at T degrees Celsius.  Below T0 the fit has
   no meaning at all (it diverges); clamp to "an unmoving solid". */
export function vftLogEta(TC){
  const d = TC - VFT.T0;
  if (d <= 1) return 40;
  return Math.min(40, VFT.A + VFT.B / d);
}
export function vftEta(TC){ return Math.pow(10, vftLogEta(TC)); }

/* the inverse: at what temperature is the glass this stiff? */
export function vftTempFor(logEta){ return VFT.T0 + VFT.B / (logEta - VFT.A); }

/* handy for the gauge on the bench */
export function workability(TC){
  const y = vftLogEta(TC);
  if (y < 2.4) return 'running';
  if (y < 4.2) return 'working';
  if (y < 6.0) return 'stiffening';
  if (y < 8.0) return 'set';
  return 'cold';
}

/* ══════════════════════════════════════════════════════════════════════════
   2 · THE PIECE — an axisymmetric shell, Lagrangian in mass
   ══════════════════════════════════════════════════════════════════════════
   Node i sits at (u_i, r_i) in the meridian half-plane: u along the pipe,
   measured from where the steel ends and the glass begins; r out from the
   axis.  Node 0 is welded to the pipe.  The last node is the closed tip, on
   the axis.  Between them, element e carries a FIXED mass m_e; the wall
   thickness is never stored, it is always derived from that mass, which is
   why nothing this file does can quietly manufacture glass.
   ══════════════════════════════════════════════════════════════════════════ */

/* a first gather, already given its starting puff: a thick-walled parison */
export function makePiece(opts = {}){
  const N       = opts.N       ?? 110;
  const length  = opts.length  ?? 0.075;   // m  — how far it sticks off the pipe
  const rMax    = opts.rMax    ?? 0.0225;  // m  — fattest radius
  const rPipe   = opts.rPipe   ?? 0.0075;  // m  — where it grips the steel
  const wall    = opts.wall    ?? 0.0070;  // m  — a very thick first bubble
  const T0C     = opts.TC      ?? 990;     // degC — marvered down from the gather

  const u = new Float64Array(N), r = new Float64Array(N), T = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const f = i / (N - 1);
    u[i] = length * f;
    /* a teardrop: grips the pipe, swells, closes on the axis */
    const swell = Math.sin(Math.PI * Math.pow(f, 0.78));
    r[i] = rPipe + (rMax - rPipe) * swell;
    if (i === N - 1) r[i] = 0;
    T[i] = T0C;
  }
  r[0] = rPipe;

  const p = {
    N, u, r, T,
    m: new Float64Array(N - 1),      // element masses, kg — the conserved quantity
    t: new Float64Array(N),          // derived wall thickness, m
    ds: new Float64Array(N - 1),     // element arc lengths, m
    k1: new Float64Array(N),         // meridional curvature, 1/m
    k2: new Float64Array(N),         // hoop curvature, 1/m
    eta: new Float64Array(N),        // viscosity, Pa*s
    rPipe,
    tilt: Math.PI / 2,               // rad — 0 = pointing straight down
    spin: 22,                        // rad/s
    onPipe: true,
    lip: null,                       // set once it is cracked off
    age: 0,
  };
  /* seed the element masses from the starting wall thickness, then never
     touch them again except through remesh (which is exactly conservative) */
  geometry(p);
  for (let e = 0; e < N - 1; e++){
    const rm = 0.5 * (r[e] + r[e + 1]);
    p.m[e] = GLASS.rho * 2 * Math.PI * rm * wall * p.ds[e];
  }
  geometry(p);
  return p;
}

export function totalMass(p){ let s = 0; for (let e = 0; e < p.N - 1; e++) s += p.m[e]; return s; }

/* arc lengths, wall thickness from mass, curvatures.  Called after every move. */
export function geometry(p){
  const { N, u, r, ds, t, k1, k2, m } = p;
  for (let e = 0; e < N - 1; e++){
    const du = u[e + 1] - u[e], dr = r[e + 1] - r[e];
    ds[e] = Math.max(1e-9, Math.hypot(du, dr));
  }
  /* thickness: a node's share of the two elements touching it */
  for (let i = 0; i < N; i++){
    let mm = 0, vol = 0;
    if (i > 0)     { mm += 0.5 * m[i - 1]; vol += 0.5 * Math.PI * (r[i - 1] + r[i]) * ds[i - 1]; }
    if (i < N - 1) { mm += 0.5 * m[i];     vol += 0.5 * Math.PI * (r[i] + r[i + 1]) * ds[i];     }
    t[i] = vol > 1e-12 ? mm / (GLASS.rho * vol) : 0.001;
    t[i] = Math.min(0.05, Math.max(2e-5, t[i]));
  }
  /* curvatures, by arclength derivatives.  Signs are chosen so that a sphere
     of radius R gives k1 = k2 = +1/R with the OUTWARD normal. */
  for (let i = 0; i < N; i++){
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
    const h1 = i > 0 ? ds[i - 1] : ds[0];
    const h2 = i < N - 1 ? ds[i] : ds[N - 2];
    const H = h1 + h2;
    const up = (u[b] - u[a]) / H, rp = (r[b] - r[a]) / H;
    const nrm = Math.hypot(up, rp) || 1;
    const ux = up / nrm, rx = rp / nrm;
    /* second derivatives by a non-uniform three-point stencil */
    const upp = 2 * ((u[b] - u[i]) / h2 - (u[i] - u[a]) / h1) / H;
    const rpp = 2 * ((r[b] - r[i]) / h2 - (r[i] - r[a]) / h1) / H;
    k1[i] = rx * upp - ux * rpp;
    k2[i] = r[i] > 1.5e-3 ? ux / r[i] : k1[i];     // at a smooth pole the two agree
    if (!isFinite(k1[i])) k1[i] = 0;
    if (!isFinite(k2[i])) k2[i] = k1[i];
  }
  return p;
}

export function meanCurvature(p, i){ return 0.5 * (p.k1[i] + p.k2[i]); }

/* the air the vessel encloses, from the INNER surface — discs along the axis */
export function innerVolume(p, from = 0){
  const { N, u, r, t } = p;
  let V = 0;
  for (let i = from; i < N - 1; i++){
    const ra = Math.max(0, r[i] - 0.5 * t[i]);
    const rb = Math.max(0, r[i + 1] - 0.5 * t[i + 1]);
    const du = u[i + 1] - u[i];
    V += Math.PI * du * (ra * ra + ra * rb + rb * rb) / 3;    // exact for a frustum
  }
  return Math.abs(V);
}

export function surfaceArea(p){
  let A = 0;
  for (let e = 0; e < p.N - 1; e++) A += Math.PI * (p.r[e] + p.r[e + 1]) * p.ds[e];
  return A;
}

/* how long the piece is, off the steel */
export function pieceLength(p){ return p.u[p.N - 1] - p.u[0]; }
export function maxRadius(p){ let m = 0; for (let i = 0; i < p.N; i++) m = Math.max(m, p.r[i]); return m; }

/* ══════════════════════════════════════════════════════════════════════════
   3 · ONE STEP
   ══════════════════════════════════════════════════════════════════════════
   ctl = {
     blow   : 0..1     how hard you are blowing (0 = not)
     heat   : 0..1     how far the piece is inside the glory hole
     tiltRate, spin    the pipe
     jack   : {s, w, rate}    the jacks, closing at arclength fraction s
     paddle : uPlane          flatten anything past this station
   }
   ══════════════════════════════════════════════════════════════════════════ */

export const BLOW_PRESSURE = 700;       // Pa — a gaffer blows gently, and briefly
export const FURNACE_K = 1563;          // K  — 1290 degC in the glory hole
export const FURNACE_H = 150;           // W/(m^2 K) — a glory hole is a burner, not an oven
export const EDOT_MAX = 1.6;            // 1/s — nor stretches faster
export const WALL_MIN = 1.2e-4;         // m  — thinner than this and it is foil, and it goes

/* A blown bubble is a FINITE-TIME blowup and that is not a bug in the law: the
   wall thins as the square of the radius, so v_n runs away.  Three real things
   stop it — you run out of breath, it cools, or it bursts.  This is the third. */
export function checkBurst(p){
  if (p.burst) return true;
  for (let i = 1; i < p.N - 1; i++){
    if (p.r[i] > 0.004 && p.t[i] < WALL_MIN){ p.burst = true; p.burstAt = i; return true; }
  }
  return false;
}

/* THE THERMAL HALF, on its own, because scrap glass still cools.
   Both faces radiate at emiss·σ(T⁴ − T_amb⁴) and lose h(T − T_amb) to the air;
   inside the glory hole the outer face takes εσ(T_fur⁴ − T⁴) back, plus the
   convective bite of a burner.  The heat CAPACITY per square metre is ρ·c_p·t,
   and t is millimetres, which is the whole reason a gaffer has to hurry. */
export function coolOnly(p, dt, heat = 0){
  const { N, T, t, ds } = p;
  const Tamb4 = Math.pow(T_AMBIENT_K, 4), Tfur4 = Math.pow(FURNACE_K, 4);
  for (let i = 0; i < N; i++){
    const TK = T[i] + 273.15;
    const TK4 = TK * TK * TK * TK;
    let flux = -(2 * GLASS.emiss * SIGMA_SB * (TK4 - Tamb4) + 2 * GLASS.hConv * (TK - T_AMBIENT_K));
    if (heat > 0) flux += heat * (GLASS.emiss * SIGMA_SB * (Tfur4 - TK4) + FURNACE_H * (FURNACE_K - TK));
    const cap = GLASS.rho * GLASS.cp * Math.max(4e-4, t[i]);   // J/(m^2 K)
    T[i] += (flux / cap) * dt;
    if (T[i] < 20) T[i] = 20;
    if (T[i] > 1350) T[i] = 1350;
  }
  /* a little conduction along the wall, which the glass really has, and which
     also keeps the node-to-node temperature field from ringing */
  const alpha = GLASS.kTherm / (GLASS.rho * GLASS.cp);         // m^2/s
  const tmp = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
    const h = 0.5 * ((i > 0 ? ds[i - 1] : ds[0]) + (i < N - 1 ? ds[i] : ds[N - 2]));
    const lam = Math.min(0.45, alpha * dt / (h * h));          // explicit-diffusion stability clamp
    tmp[i] = T[i] + lam * (T[a] - 2 * T[i] + T[b]);
  }
  for (let i = 0; i < N; i++) T[i] = tmp[i];
  return p;
}

export function step(p, dt, ctl = {}){
  const { N, u, r, T, t, k1, k2, eta, ds, m } = p;
  const blow   = Math.max(0, Math.min(1, ctl.blow ?? 0));
  const heat   = Math.max(0, Math.min(1, ctl.heat ?? 0));
  const spin   = ctl.spin ?? p.spin;
  const tilt   = ctl.tilt ?? p.tilt;

  geometry(p);
  /* a burst piece is scrap: it still cools, it no longer flows */
  if (p.burst){
    coolOnly(p, dt, heat);
    p.age += dt;
    return p;
  }

  /* ── 3a · heat: radiate out of both faces, soak from the furnace on one ── */
  coolOnly(p, dt, heat);
  for (let i = 0; i < N; i++) eta[i] = vftEta(T[i]);

  /* ══════════════════════════════════════════════════════════════════════
     3b · THE MEMBRANE — the exact axisymmetric balance, pressure and weight
          carried by the same two tensions
     ══════════════════════════════════════════════════════════════════════
     Take the whole cap of glass beyond a station and balance it along the
     axis.  Whatever is inside pushes on the projected disc, pi r^2, and
     gravity pulls on everything out there; the only thing holding it is the
     axial component of the meridional tension N1 around the rim:

         N1 * 2 pi r (du/ds)  =  p pi r^2  +  g_axial M_beyond  -  2 gamma * 2 pi r (du/ds)

     (the last term is the skin, which has two faces, so its tension is 2gamma).
     Then the NORMAL balance closes it — the classic membrane statement:

         (N1 + 2gamma) k1 + (N2 + 2gamma) k2  =  p

     Two equations, two tensions, no free parameter.  Divide by the wall to get
     stresses and invert the plane-stress Newtonian law
         sigma1 = 2mu(2 e1 + e2),  sigma2 = 2mu(2 e2 + e1)
     for the two surface strain rates.  That single tensor law gives BOTH the
     famous numbers back: a sphere under pressure moves at p R^2 / (12 mu t),
     and a hanging tube stretches at sigma / (3 mu), Trouton's ratio and all.
     Neither was put in.

     This replaces an earlier normal-velocity closure that divided by the mean
     curvature squared.  That form is correct for a sphere and NONSENSE at an
     inflection, where H passes through zero — and a blown parison grows two
     inflections within a second of the first puff.  It tore a hole in the
     shoulder every time.  Curvature belongs in the load, never in a
     denominator.
     ══════════════════════════════════════════════════════════════════════ */
  const pInt = p.onPipe ? blow * BLOW_PRESSURE : 0;    // off the pipe there is nothing to blow into
  const gAx  = G_ACCEL * Math.cos(tilt);               // the spin averages the rest away
  const e1 = new Float64Array(N), e2 = new Float64Array(N);
  const gam2 = 2 * GLASS.gamma;
  {
    /* mass beyond each NODE */
    const beyond = new Float64Array(N);
    for (let i = N - 2; i >= 0; i--) beyond[i] = beyond[i + 1] + m[i];
    for (let i = 0; i < N; i++){
      const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
      const dU = u[b] - u[a], dR = r[b] - r[a];
      const L  = Math.hypot(dU, dR) || 1;
      let duds = dU / L;
      /* r/(du/ds) is the local meridional radius and stays finite at the tip,
         where both go to zero together — but only if we do not divide by an
         exact zero on the way.  Clamp the DIRECTION cosine, keep its sign. */
      const eps = 0.05;
      if (Math.abs(duds) < eps) duds = (duds < 0 ? -1 : 1) * eps;

      const pLoad = pInt + GLASS.rho * spin * spin * r[i] * t[i];   // Pa outward
      const ri = Math.max(r[i], 2e-4);
      let N1 = (pLoad * ri) / (2 * duds) + (gAx * beyond[i]) / (2 * Math.PI * ri * duds) - gam2;

      const Hc = 0.5 * (k1[i] + k2[i]);
      const rhs = pLoad - 2 * gam2 * Hc;          // = p - 2gamma(k1+k2)
      let kk2 = k2[i];
      const kFloor = 1 / Math.max(0.25, 4 * ri);
      if (Math.abs(kk2) < kFloor) kk2 = (kk2 < 0 ? -1 : 1) * kFloor;
      let N2 = (rhs - N1 * k1[i]) / kk2;

      const s1 = N1 / t[i], s2 = N2 / t[i];
      const six = 6 * eta[i];
      let a1 = (2 * s1 - s2) / six, a2 = (2 * s2 - s1) / six;
      if (!isFinite(a1)) a1 = 0;
      if (!isFinite(a2)) a2 = 0;
      e1[i] = Math.max(-EDOT_MAX, Math.min(EDOT_MAX, a1));
      e2[i] = Math.max(-EDOT_MAX, Math.min(EDOT_MAX, a2));
    }
    /* One pass of 1-2-1 on the strain rates.  A discrete membrane has a
       checkerboard mode that no continuum equation has; this is the
       regularisation and it is named as one, not hidden in a constant. */
    smoothArray(e1); smoothArray(e2);
  }

  /* ── 3d · the tools ── */
  const jack = ctl.jack;
  const arc = cumulativeArc(p);
  const total = arc[N - 1] || 1;
  const jr = new Float64Array(N);
  if (jack && jack.rate){
    const sj = jack.s * total, w = (jack.w ?? 0.10) * total;
    for (let i = 0; i < N; i++){
      const d = (arc[i] - sj) / w;
      const win = Math.exp(-d * d);
      /* the jacks only bite where the glass is soft: compliance ~ 1/eta */
      const soft = Math.min(1, 4000 / Math.max(1, eta[i]));
      jr[i] = -jack.rate * win * soft * Math.max(0, r[i] - p.rPipe * 0.55);
    }
  }
  let paddleV = null;
  if (ctl.paddle != null){
    paddleV = new Float64Array(N);
    for (let i = 0; i < N; i++){
      const over = u[i] - ctl.paddle;
      if (over > 0){
        const soft = Math.min(1, 4000 / Math.max(1, eta[i]));
        paddleV[i] = -Math.min(over, 0.02) * 9 * soft;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     3e · MOVE — strain rates back into node positions
     ══════════════════════════════════════════════════════════════════════
     The hoop rate IS the radial motion: e2 = rdot / r, no integration needed.
     The meridional rate says how much longer each element gets.  Give the
     element its new length and its new radial rise, and Pythagoras hands back
     the axial one — which never divides by anything, and so behaves perfectly
     at the tip where the meridian is running almost straight out.
     ══════════════════════════════════════════════════════════════════════ */
  const rdot = new Float64Array(N);
  for (let i = 0; i < N; i++) rdot[i] = e2[i] * r[i] + jr[i];
  rdot[0] = 0;
  rdot[N - 1] = 0;

  const nr = new Float64Array(N), nu = new Float64Array(N);
  for (let i = 0; i < N; i++) nr[i] = Math.max(0, r[i] + rdot[i] * dt);
  nr[0] = p.rPipe;
  if (!p.freeTip) nr[N - 1] = 0;
  nu[0] = 0;
  for (let e = 0; e < N - 1; e++){
    const dU = u[e + 1] - u[e], dR = r[e + 1] - r[e];
    const L  = Math.hypot(dU, dR);
    const em = 0.5 * (e1[e] + e1[e + 1]);
    const L2 = Math.max(1e-9, L * (1 + em * dt));
    const dR2 = nr[e + 1] - nr[e];
    const dU2 = Math.sqrt(Math.max(0, L2 * L2 - dR2 * dR2));
    nu[e + 1] = nu[e] + (dU < 0 ? -dU2 : dU2);
  }
  u.set(nu); r.set(nr);
  /* the paddle is a plane, not a stress: it simply will not let glass past */
  if (paddleV) for (let i = 0; i < N; i++) u[i] += paddleV[i] * dt;

  /* the pipe holds its end; the tip stays on the axis (a real gather is always
     closed and rounded — `freeTip` exists only so the twin can hang a bare tube) */
  u[0] = 0; r[0] = p.rPipe;
  if (!p.freeTip) r[N - 1] = 0;
  /* The profile must not turn back on itself, or the lathe folds.  The epsilon
     here has to be MUCH smaller than the axial spacing near the tip, where the
     meridian runs almost radially and du per node falls as ds^2/2R — a 10 um
     floor there is not a guard, it is a jack, and it will tear a hole in the
     shoulder in a tenth of a second.  Ask how it went. */
  for (let i = 1; i < N; i++) if (u[i] < u[i - 1] + 1e-9) u[i] = u[i - 1] + 1e-9;

  /* A whisper only.  Laplacian smoothing of a closed convex meridian is mean
     curvature flow, and mean curvature flow SHRINKS things: at a quarter per
     step it quietly ate a fifth of the bubble over half a minute while every
     conservation check stayed green, because mass was never the thing being
     lost.  The strain-rate filter in 3b does the real regularising. */
  smoothProfile(p, Math.min(0.05, 1.6 * dt));
  remesh(p);
  geometry(p);
  p.age += dt;
  p.diag = { e1, e2, gAx, pInt };
  checkBurst(p);
  return p;
}

/* one pass of a 1-2-1 filter, ends held */
export function smoothArray(a){
  const n = a.length;
  if (n < 3) return a;
  let prev = a[0];
  for (let i = 1; i < n - 1; i++){
    const cur = a[i];
    a[i] = 0.25 * prev + 0.5 * cur + 0.25 * a[i + 1];
    prev = cur;
  }
  return a;
}

export function cumulativeArc(p){
  const a = new Float64Array(p.N);
  for (let e = 0; e < p.N - 1; e++) a[e + 1] = a[e] + p.ds[e];
  return a;
}

/* a whisper of curvature diffusion — the numerical stand-in for the fact that
   surface tension acts on every scale, including the ones a 110-node mesh
   cannot see.  It moves nodes, never mass. */
function smoothProfile(p, lambda){
  const { N, u, r } = p;
  const nu = new Float64Array(N), nr = new Float64Array(N);
  nu[0] = u[0]; nr[0] = r[0];
  nu[N - 1] = u[N - 1]; nr[N - 1] = r[N - 1];
  for (let i = 1; i < N - 1; i++){
    nu[i] = u[i] + lambda * (0.5 * (u[i - 1] + u[i + 1]) - u[i]);
    nr[i] = r[i] + lambda * (0.5 * (r[i - 1] + r[i + 1]) - r[i]);
  }
  u.set(nu); r.set(nr);
}

/* ══════════════════════════════════════════════════════════════════════════
   REMESH — exactly mass-conserving
   ══════════════════════════════════════════════════════════════════════════
   Nodes drift and bunch as the piece inflates.  Redistribute them uniformly in
   arclength.  The trick that makes it exact: interpolate the CUMULATIVE mass,
   not the element masses.  New element masses are differences of a monotone
   interpolant of the same curve, so they telescope back to the same total,
   bit for bit.
   ══════════════════════════════════════════════════════════════════════════ */
export function remesh(p){
  const { N, u, r, T, m, ds } = p;
  for (let e = 0; e < N - 1; e++){
    const du = u[e + 1] - u[e], dr = r[e + 1] - r[e];
    ds[e] = Math.max(1e-9, Math.hypot(du, dr));
  }
  const s = new Float64Array(N);
  for (let e = 0; e < N - 1; e++) s[e + 1] = s[e] + ds[e];
  const L = s[N - 1];
  if (!(L > 0)) return p;

  const C = new Float64Array(N);
  for (let e = 0; e < N - 1; e++) C[e + 1] = C[e] + m[e];
  const M = C[N - 1];

  const nu = new Float64Array(N), nr = new Float64Array(N), nT = new Float64Array(N), nC = new Float64Array(N);
  let j = 0;
  for (let i = 0; i < N; i++){
    const target = L * i / (N - 1);
    while (j < N - 2 && s[j + 1] < target) j++;
    const seg = s[j + 1] - s[j];
    const f = seg > 1e-12 ? (target - s[j]) / seg : 0;
    const g = Math.max(0, Math.min(1, f));
    nu[i] = u[j] + g * (u[j + 1] - u[j]);
    nr[i] = r[j] + g * (r[j + 1] - r[j]);
    nT[i] = T[j] + g * (T[j + 1] - T[j]);
    nC[i] = C[j] + g * (C[j + 1] - C[j]);
  }
  nu[0] = u[0]; nr[0] = r[0]; nT[0] = T[0]; nC[0] = 0;
  nu[N - 1] = u[N - 1]; nr[N - 1] = r[N - 1]; nT[N - 1] = T[N - 1]; nC[N - 1] = M;

  u.set(nu); r.set(nr); T.set(nT);
  /* telescoping differences: the sum is M to the last bit */
  for (let e = 0; e < N - 1; e++) m[e] = nC[e + 1] - nC[e];
  return p;
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · CRACKING OFF — where the vessel gets its mouth
   ══════════════════════════════════════════════════════════════════════════
   A gaffer scores a line near the pipe with the jacks, taps it, and the piece
   drops off.  The neck that was jacked BECOMES the mouth.  Everything the
   thing will ever sound like was decided by hand, thirty seconds earlier.
   ══════════════════════════════════════════════════════════════════════════ */

/* The narrowest station between the pipe collar and the belly — where it will
   break.  The search deliberately skips the first few nodes: the glass right at
   the steel is always the width of the steel, and breaking THERE would mean the
   jacks never mattered.  Past the collar, the narrowest place is the one the
   visitor made. */
export function scoreLine(p){
  const lo = Math.max(4, Math.floor(p.N * 0.05));
  const hi = Math.max(lo + 2, Math.floor(p.N * 0.45));
  let best = Infinity, bi = lo;
  for (let i = lo; i < hi; i++){ if (p.r[i] < best){ best = p.r[i]; bi = i; } }
  return bi;
}

export function crackOff(p, at = null){
  const k = at == null ? scoreLine(p) : at;
  const N2 = p.N - k;
  if (N2 < 8) return p;
  const q = {
    N: N2,
    u: p.u.slice(k), r: p.r.slice(k), T: p.T.slice(k),
    m: p.m.slice(k), t: new Float64Array(N2), ds: new Float64Array(N2 - 1),
    k1: new Float64Array(N2), k2: new Float64Array(N2), eta: new Float64Array(N2),
    rPipe: p.r[k], tilt: 0, spin: 0, onPipe: false, lip: null, age: p.age,
  };
  const u0 = q.u[0];
  for (let i = 0; i < N2; i++) q.u[i] -= u0;
  geometry(q);
  q.lip = lipGeometry(q);
  return q;
}

/* the mouth: its area, and how long a plug of air sits in it.  The neck runs
   from the lip until the radius has grown by a fifth; the end correction of
   1.7 r is the standard unflanged-plus-flanged pair. */
export function lipGeometry(p){
  const rLip = p.r[0];
  let L = 0;
  for (let i = 1; i < p.N; i++){
    if (p.r[i] > rLip * 1.20) break;
    L = p.u[i] - p.u[0];
  }
  const A = Math.PI * rLip * rLip;
  const Leff = L + 1.7 * rLip;
  const V = innerVolume(p, 0);
  return { rLip, A, L, Leff, V };
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · THE VOICE
   ══════════════════════════════════════════════════════════════════════════
   The note is not this file's law.  The Helmholtz law belongs to The Jug, one
   room over in the Music Room, and it is imported from there rather than
   retyped: f = (c/2pi) sqrt(A / (V Leff)).  A mass of air in the mouth you
   jacked, bobbing on the spring of the air you blew.  What THIS bench adds is
   that both numbers were made by hand, thirty seconds ago, out of a lump.
   ══════════════════════════════════════════════════════════════════════════ */
import { helmholtzFreq } from '../../sound-garden/the-jug/core.mjs';
export { helmholtzFreq };

export function noteOf(p){
  const g = p.lip || lipGeometry(p);
  if (!(g.V > 1e-9) || !(g.A > 1e-9)) return { f: 0, ...g };
  return { f: helmholtzFreq({ A: g.A, V: g.V, Leff: g.Leff }), ...g };
}

const PITCH_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function pitchLabel(f){
  if (!(f > 0)) return '—';
  const n = 12 * Math.log2(f / 440) + 69;
  const k = Math.round(n);
  const cents = Math.round((n - k) * 100);
  return PITCH_NAMES[((k % 12) + 12) % 12] + (Math.floor(k / 12) - 1) + (cents === 0 ? '' : (cents > 0 ? ' +' : ' −') + Math.abs(cents) + 'c');
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · A LATHE — the meridian, turned into a mesh
   ══════════════════════════════════════════════════════════════════════════
   Pure arithmetic, no GL.  Positions and normals for a shell of revolution,
   plus a per-vertex temperature and optical thickness so the renderer can ask
   the blackbody core what colour that station is.
   ══════════════════════════════════════════════════════════════════════════ */
export function lathe(p, sides, out){
  const N = p.N;
  const nv = N * (sides + 1);
  const pos = out?.pos && out.pos.length === nv * 3 ? out.pos : new Float32Array(nv * 3);
  const nor = out?.nor && out.nor.length === nv * 3 ? out.nor : new Float32Array(nv * 3);
  const aux = out?.aux && out.aux.length === nv * 2 ? out.aux : new Float32Array(nv * 2);
  geometry(p);
  /* meridian normal, in (u, r) */
  const mu = new Float64Array(N), mr = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
    const dU = p.u[b] - p.u[a], dR = p.r[b] - p.r[a];
    const L = Math.hypot(dU, dR) || 1;
    mu[i] = -dR / L; mr[i] = dU / L;
  }
  let v = 0;
  for (let i = 0; i < N; i++){
    for (let j = 0; j <= sides; j++){
      const th = 2 * Math.PI * j / sides;
      const c = Math.cos(th), s = Math.sin(th);
      pos[v * 3]     = p.r[i] * c;
      pos[v * 3 + 1] = p.r[i] * s;
      pos[v * 3 + 2] = p.u[i];
      nor[v * 3]     = mr[i] * c;
      nor[v * 3 + 1] = mr[i] * s;
      nor[v * 3 + 2] = mu[i];
      aux[v * 2]     = p.T[i];
      aux[v * 2 + 1] = p.t[i];
      v++;
    }
  }
  return { pos, nor, aux, N, sides, count: nv };
}

export function latheIndices(N, sides){
  const idx = new Uint32Array((N - 1) * sides * 6);
  let k = 0;
  for (let i = 0; i < N - 1; i++){
    for (let j = 0; j < sides; j++){
      const a = i * (sides + 1) + j, b = a + 1, c = a + (sides + 1), d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
  }
  return idx;
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · A VESSEL, SMALL ENOUGH TO KEEP
   ══════════════════════════════════════════════════════════════════════════
   Twenty-four (u, r) pairs and a note.  Small enough to sit in localStorage
   next to somebody else's, so the shelf on the bench fills up over visits.
   ══════════════════════════════════════════════════════════════════════════ */
export function packVessel(p, samples = 24){
  const arc = cumulativeArc(p), L = arc[p.N - 1] || 1;
  const uu = [], rr = [];
  for (let k = 0; k < samples; k++){
    const target = L * k / (samples - 1);
    let j = 0; while (j < p.N - 2 && arc[j + 1] < target) j++;
    const seg = arc[j + 1] - arc[j];
    const f = seg > 1e-12 ? (target - arc[j]) / seg : 0;
    uu.push(Math.round(1e5 * (p.u[j] + f * (p.u[j + 1] - p.u[j]))));
    rr.push(Math.round(1e5 * (p.r[j] + f * (p.r[j + 1] - p.r[j]))));
  }
  const n = noteOf(p);
  return { u: uu, r: rr, f: Math.round(n.f * 10) / 10, v: Math.round(n.V * 1e7) / 100 };
}

export function unpackVessel(v){
  const N = v.u.length;
  const p = {
    N, u: new Float64Array(N), r: new Float64Array(N), T: new Float64Array(N),
    m: new Float64Array(N - 1), t: new Float64Array(N), ds: new Float64Array(N - 1),
    k1: new Float64Array(N), k2: new Float64Array(N), eta: new Float64Array(N),
    rPipe: v.r[0] / 1e5, tilt: 0, spin: 0, onPipe: false, lip: null, age: 0,
  };
  for (let i = 0; i < N; i++){ p.u[i] = v.u[i] / 1e5; p.r[i] = v.r[i] / 1e5; p.T[i] = 20; }
  for (let e = 0; e < N - 1; e++) p.m[e] = 1e-4;
  geometry(p);
  for (let i = 0; i < N; i++) p.t[i] = 0.0025;
  p.lip = lipGeometry(p);
  return p;
}
