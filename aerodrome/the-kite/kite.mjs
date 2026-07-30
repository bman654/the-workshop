/* ============================================================================
 *  THE KITE  ·  aerodrome/the-kite/  —  the shared model.
 *
 *  A kite on a line, in the vertical plane through the wind. Everything on the
 *  page comes out of THIS file; the Node twin (kite.test.mjs) runs the same
 *  bytes with no browser in the room, and the page forge-inlines it, so the
 *  numbers on the wall and the numbers in the terminal can never drift.
 *
 *  WHAT IS ACTUALLY RUNNING
 *   · ONE Verlet world (tools/dynamics/verlet.mjs, unforked). The kite is not a
 *     rigid-body integrator bolted on the side — it is FOUR point masses held in
 *     a rigid quadrilateral by six distance constraints, so its rotation, its
 *     pitching, and the moment the tail puts on it all fall out of the same
 *     Gauss-Seidel projection that holds the line together. Line, bridle, sail
 *     and tail are one constraint network.
 *   · THE SAIL is a flat plate. The resultant of a flat plate at incidence is
 *     normal to the plate with C_N = 2 sin(alpha) — resolve that and you get the
 *     schoolbook pair C_L = 2 sin a cos a, C_D = C_D0 + 2 sin^2 a. It is applied
 *     at the centre of pressure and split between the nose and the tail point by
 *     the lever rule, which is exact for a force on the chord line of a rigid
 *     body — that is where the pitching moment comes from.
 *   · THE CENTRE OF PRESSURE moves aft as the plate comes side-on:
 *     x_cp/c = 0.5 - 0.25*|cos a|. The two ends of that interpolation are the
 *     ones that are known exactly (quarter chord as a -> 0, mid-chord at 90 deg);
 *     the path between them is an interpolation and the page says so.
 *   · THE LINE is 20 point masses with real mass per metre and real cylinder
 *     cross-flow drag (C_d = 1.1 on the component of the apparent wind normal to
 *     each segment). That is why it sags into a bow instead of a straight line,
 *     and why a longer line flies LOWER.
 *   · THE TAIL is a chain of bows, each a bluff drag area in the local apparent
 *     wind. It pulls from the tail point, so it damps and it costs drag.
 *   · THE WIND is the log law, U(z) = U10 * ln(z/z0)/ln(10/z0), z0 = 0.03 m
 *     (mown grass), with an optional seeded Ornstein-Uhlenbeck gust on U10.
 *
 *  THE CLAIMS  (each is measured in kite.test.mjs, and live on the page)
 *   A · CLOSURE. In steady flight the LOCAL direction of the line where it meets
 *       the kite satisfies  tan(phi) = (L - mg) / D.  Two instruments that never
 *       speak: phi read off the geometry of the solver's node positions, the
 *       right-hand side read off the aerodynamic model. They must agree.
 *   B · THE CEILING. The kite's elevation seen from the flyer's hands is always
 *       BELOW atan(L/D) — the same number as a glider's glide ratio. A kite
 *       cannot out-climb its own lift-to-drag.
 *   C · THE LONG LINE FLIES LOWER. More line = more line drag and more line
 *       weight = a bigger gap between the local angle at the kite and the angle
 *       you actually see. Monotone in line length.
 *   D · THE TAIL IS A DAMPER, AND IT COSTS HEIGHT. Kick the pitch and the
 *       oscillation dies faster with the tail on; and the same wind holds the
 *       tailed kite lower, because the bows are drag. (The OTHER thing a tail
 *       does — killing the side-to-side yaw-roll swing that makes a tailless
 *       diamond dart about — is out of this plane. The room does not claim it.)
 *
 *  HONEST ABOUT THE MODEL
 *   · Two dimensions. The kite cannot yaw, roll or fly across the window.
 *   · The sail is rigid and flat: no billow, no spar bend, no luffing.
 *   · The line is inextensible-by-projection (position-based), not a spring; the
 *     twin measures the residual stretch and holds it under 1%.
 *   · One number, C_D0 = 0.06, stands in for skin friction, the spars and the
 *     bridle. Everything else is geometry and the flat-plate resultant.
 * ==========================================================================*/

import { World } from '../../tools/dynamics/verlet.mjs';

const RHO  = 1.225;      // kg/m^3, air at sea level
const GRAV = 9.81;       // m/s^2
const Z0   = 0.03;       // m, roughness length of mown grass

/* ── the wind: the log law over a rough surface ──────────────────────────── */
function windAt(z, u10, z0){
  z0 = z0 || Z0;
  const zz = Math.max(z, z0 * 1.5);
  return u10 * Math.log(zz / z0) / Math.log(10 / z0);
}

/* ── the flat plate. sa = sin(alpha) signed, ca = cos(alpha) signed ───────── */
function plateCN(sa){ return 2 * sa; }                        // resultant, normal to the sail
function plateCL(sa, ca){ return 2 * sa * Math.abs(ca); }     // ...resolved across the wind
function plateCD(sa, cd0){ return cd0 + 2 * sa * sa; }        // ...and along it
function cpFraction(ca){ return 0.5 - 0.25 * Math.abs(ca); }  // centre of pressure, from the nose

/* the best lift-to-drag a flat plate with this parasite drag can do, and the
   angle it does it at — swept, not solved, because the maximum is shallow. */
function bestLD(cd0){
  let bl = 0, ba = 0;
  for (let d = 1; d <= 60; d += 0.25){
    const a = d * Math.PI / 180, sa = Math.sin(a), ca = Math.cos(a);
    const ld = plateCL(sa, ca) / plateCD(sa, cd0);
    if (ld > bl){ bl = ld; ba = d; }
  }
  return { ld: bl, deg: ba };
}

/* ── a small seeded PRNG so a gust is repeatable in Node and in the browser ─ */
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEFAULTS = {
  chord: 0.95,          // m, spine, nose to tail
  area: 0.40,           // m^2, sail
  mass: 0.085,          // kg, sail + spars
  cd0: 0.06,            // parasite drag coefficient on the sail area
  bridleAhead: 0.22,    // m, how far the tow point stands off the sail, windward
  bridleFrac: 0.20,     // where along the chord the tow point sits (0 nose, 1 tail)
  sparBow: 0.05,        // m, the leeward bulge of the bowed spar (gives the body depth)

  lineLen: 30,          // m
  lineNodes: 20,
  lineDia: 0.0010,      // m
  lineRho: 0.0007,      // kg/m
  lineCd: 1.1,          // cross-flow drag of a cylinder

  tailBows: 5,
  tailLen: 3.0,         // m
  tailNodes: 10,
  bowArea: 0.0055,      // m^2 of drag area per bow
  tailRho: 0.0035,      // kg/m of ribbon

  u10: 6.0,             // m/s at ten metres — the number a forecast gives you
  gust: 0.10,           // gust strength (fraction of U10); 0 = a wind tunnel
  gustTau: 4.0,         // s, gust correlation time
  handY: 1.4,           // m, the flyer's hands
  handX: 0,

  reelRate: 4,          // m/s — the fastest a pair of hands can take line IN
  payRate: 1.6,         // m/s — and the fastest you can let it OUT and keep it flying
  vMax: 120,            // m/s — a governor; nothing on a kite goes faster than this

  h: 1 / 480,           // s, physics substep
  iters: 30,            // Gauss-Seidel projections per substep
  seed: 0x1EAF,
};

/* ── the kite's four points, and the masses that give it the right inertia ──
 *  nose and tail carry mu each, the spar point carries the rest of the sail,
 *  and the tow point carries the bridle's own few grams. The split is chosen so
 *  the assembled body's moment of inertia about its own centre of mass lands on
 *  the flat plate's m*c^2/12 — kite.test.mjs measures it and holds it to 10%.  */
function kiteMasses(p){
  const mB = 0.004;                                  // the bridle legs
  const mu = Math.max(0.002, (p.mass * p.chord * p.chord / 12
              - mB * p.bridleAhead * p.bridleAhead) / (2 * (p.chord / 2) * (p.chord / 2)));
  const mD = Math.max(0.004, p.mass - mB - 2 * mu);
  return { mN: mu, mT: mu, mD, mB };
}

function v2(x, y){ return [x, y]; }
function sub(a, b){ return [a[0] - b[0], a[1] - b[1]]; }
function add(a, b){ return [a[0] + b[0], a[1] + b[1]]; }
function mul(a, s){ return [a[0] * s, a[1] * s]; }
function dot(a, b){ return a[0] * b[0] + a[1] * b[1]; }
function len(a){ return Math.hypot(a[0], a[1]); }
function norm(a){ const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; }
function perp(a){ return [-a[1], a[0]]; }            // rotate +90 deg

/* ═══════════════════════════════════════════════════════════════════════════
   THE SIMULATION
   ═════════════════════════════════════════════════════════════════════════ */
class Kite {
  constructor(opts){
    this.p = Object.assign({}, DEFAULTS, opts || {});
    this.reset();
  }

  /* ── build the whole constraint network from scratch ───────────────────── */
  reset(o){
    const p = this.p;
    if (o) Object.assign(p, o);
    const w = new World({ gravity: [0, -GRAV], drag: 0, iterations: p.iters, dt: p.h });
    this.w = w;
    this.rng = mulberry32(p.seed >>> 0);
    this.t = 0;
    this.gustMul = 1;
    this.kick = 0;

    /* where the kite starts: up the line at a plausible elevation, chord tipped
       so the sail already has some incidence — it settles within a second. */
    const elev = 0.72;                                   // rad, ~41 degrees
    const R = p.lineLen * 0.995;                         // born with the line ALREADY taut:
                                                         // a slack birth lets the line snatch,
                                                         // and a snatch flips the sail over.
    const hand = v2(p.handX, p.handY);
    const cg = v2(hand[0] + R * Math.cos(elev), hand[1] + R * Math.sin(elev));
    const alpha0 = 0.35;                                  // rad of incidence at birth
    // leeward normal points back along the line (up and downwind), turned by alpha
    const lineDir = v2(Math.cos(elev), Math.sin(elev));
    const nLee = norm([lineDir[0] * Math.cos(alpha0) - lineDir[1] * Math.sin(alpha0),
                       lineDir[0] * Math.sin(alpha0) + lineDir[1] * Math.cos(alpha0)]);
    const cvec = [nLee[1], -nLee[0]];                     // chord: nose -> tail

    const m = kiteMasses(p);
    const nose = sub(cg, mul(cvec, p.chord * 0.5));
    const tail = add(cg, mul(cvec, p.chord * 0.5));
    const spar = add(cg, mul(nLee, p.sparBow));
    const tow  = add(add(cg, mul(nLee, -p.bridleAhead)),
                     mul(cvec, (p.bridleFrac - 0.5) * p.chord));

    this.iN = w.add(nose[0], nose[1], { mass: m.mN });
    this.iT = w.add(tail[0], tail[1], { mass: m.mT });
    this.iD = w.add(spar[0], spar[1], { mass: m.mD });
    this.iB = w.add(tow[0],  tow[1],  { mass: m.mB });
    const body = [this.iN, this.iT, this.iD, this.iB];
    this.body = body;
    this.bodyLinks = [];
    for (let a = 0; a < body.length; a++)
      for (let b = a + 1; b < body.length; b++)
        this.bodyLinks.push(w.link(body[a], body[b]));

    /* the line: anchor -> ... -> tow point */
    this.iA = w.add(hand[0], hand[1], { mass: 1, pinned: true });
    this.line = [];
    this.lineLinks = [];
    const nSeg = p.lineNodes;
    const segLen = p.lineLen / nSeg;
    const nodeMass = Math.max(1e-5, p.lineRho * segLen);
    let prev = this.iA;
    for (let i = 1; i <= nSeg; i++){
      const s = i / nSeg;
      const x = hand[0] + (tow[0] - hand[0]) * s;
      const y = hand[1] + (tow[1] - hand[1]) * s;
      const id = (i === nSeg) ? this.iB : w.add(x, y, { mass: nodeMass });
      if (i < nSeg) this.line.push(id);
      this.lineLinks.push(w.link(prev, id, segLen));
      prev = id;
    }

    /* the tail: a ribbon of bows streaming from the tail point */
    this.tail = [];
    this.tailLinks = [];
    const tSeg = p.tailNodes;
    const tLen = p.tailLen / tSeg;
    const tMass = Math.max(1e-5, p.tailRho * tLen);
    prev = this.iT;
    const tdir = norm([0.94, -0.34]);            // streaming downwind and a little down;
    for (let i = 1; i <= tSeg; i++){             // laid out at EXACTLY its rest length, because
      const x = tail[0] + tdir[0] * tLen * i;    // a tail born stretched snaps, and a snap in a
      const y = tail[1] + tdir[1] * tLen * i;    // quadratic drag law is how you blow up a solver
      const id = w.add(x, y, { mass: tMass });
      this.tail.push(id);
      this.tailLinks.push(w.link(prev, id, tLen));
      prev = id;
    }

    this.lineTarget = p.lineLen;
    this.last = this.measure();
    return this;
  }

  /* ── the reel. You ASK for a length; the hands can only take it in so fast.
     This is not a nicety: dropping every segment's rest length by two thirds in
     one step teleports the kite twenty metres, and no explicit aerodynamic model
     survives the apparent wind that implies. A reel has a rate. ─────────────── */
  setLineLength(L){ this.lineTarget = Math.max(4, Math.min(90, L)); return this; }
  _reel(dt){
    const p = this.p;
    if (Math.abs(this.lineTarget - p.lineLen) < 1e-9) return;
    /* letting out is not the same move as pulling in. Line only leaves the reel
       while the kite is PULLING — that is what a flyer's hands are doing when
       they feel the tug and let it slip. Slack line pays out nothing, which is
       also why a dying kite cannot be let out of trouble. */
    const paying = this.lineTarget > p.lineLen;
    if (paying && !(this._tension() > 0.8)) return;
    /* a short line pays out slowly: the kite has to FLY out to take the slack,
       and how fast it can do that scales with how far away it already is. */
    const rate = paying ? Math.min(p.payRate, 0.07 * p.lineLen) : p.reelRate;
    const step = rate * dt;
    p.lineLen += Math.max(-step, Math.min(step, this.lineTarget - p.lineLen));
    const segLen = p.lineLen / p.lineNodes;
    for (const c of this.lineLinks) c.rest = segLen;
    const nodeMass = Math.max(1e-5, p.lineRho * segLen);
    for (const id of this.line){ this.w.mass[id] = nodeMass; this.w.invMass[id] = 1 / nodeMass; }
  }
  setWind(u){ this.p.u10 = Math.max(0, u); return this; }
  setBridle(f){                                   // re-cut the bridle, live
    const p = this.p;
    p.bridleFrac = Math.max(0.08, Math.min(0.62, f));
    this._recutBridle();
    return this;
  }
  setBridleAhead(d){ this.p.bridleAhead = Math.max(0.08, Math.min(0.6, d)); this._recutBridle(); return this; }
  _recutBridle(){
    /* the tow point's three rest lengths ARE the bridle. Re-derive them from the
       geometry the knot would give, and the solver walks the knot to its new
       place over the next few steps. */
    const p = this.p, w = this.w;
    const cvec = v2(1, 0), nLee = v2(0, 1);       // body frame: build in local coords
    const cgL = v2(0, 0);
    const noseL = sub(cgL, mul(cvec, p.chord * 0.5));
    const tailL = add(cgL, mul(cvec, p.chord * 0.5));
    const sparL = add(cgL, mul(nLee, p.sparBow));
    const towL  = add(add(cgL, mul(nLee, -p.bridleAhead)),
                      mul(cvec, (p.bridleFrac - 0.5) * p.chord));
    const want = new Map();
    want.set(this.iN + '|' + this.iB, len(sub(towL, noseL)));
    want.set(this.iT + '|' + this.iB, len(sub(towL, tailL)));
    want.set(this.iD + '|' + this.iB, len(sub(towL, sparL)));
    for (const c of this.bodyLinks){
      const k1 = c.i + '|' + c.j, k2 = c.j + '|' + c.i;
      if (want.has(k1)) c.rest = want.get(k1);
      else if (want.has(k2)) c.rest = want.get(k2);
    }
  }
  setTail(bows, length){
    const p = this.p;
    p.tailBows = Math.max(0, Math.min(9, Math.round(bows)));
    if (length != null) p.tailLen = Math.max(0.4, length);
    const tLen = p.tailLen / p.tailNodes;
    for (const c of this.tailLinks) c.rest = tLen;
    const tMass = Math.max(1e-5, p.tailRho * tLen);
    for (const id of this.tail){ this.w.mass[id] = tMass; this.w.invMass[id] = 1 / tMass; }
    return this;
  }
  /* give the sail a pitch kick of `deg` degrees — the perturbation the damping
     test measures the decay of. Rotates the whole body about its centre of mass. */
  pitchKick(deg){
    const w = this.w, a = deg * Math.PI / 180;
    const cg = this.cg();
    const ca = Math.cos(a), sa = Math.sin(a);
    for (const id of this.body){
      const dx = w.x[id] - cg[0], dy = w.y[id] - cg[1];
      const nx = cg[0] + dx * ca - dy * sa, ny = cg[1] + dx * sa + dy * ca;
      const vx = w.x[id] - w.px[id], vy = w.y[id] - w.py[id];
      w.x[id] = nx; w.y[id] = ny; w.px[id] = nx - vx; w.py[id] = ny - vy;
    }
    return this;
  }
  /* the flyer walks: move the hands (and carry the line with them, gently). */
  setHand(x, y){
    const p = this.p; p.handX = x; if (y != null) p.handY = y;
    this.w.setPos(this.iA, p.handX, p.handY, { zeroVel: true });
    return this;
  }

  /* ── geometry readers ──────────────────────────────────────────────────── */
  pt(id){ return [this.w.x[id], this.w.y[id]]; }
  vel(id){ return [(this.w.x[id] - this.w.px[id]) / this.p.h, (this.w.y[id] - this.w.py[id]) / this.p.h]; }
  cg(){
    const w = this.w; let mx = 0, my = 0, mt = 0;
    for (const id of this.body){ const m = w.mass[id]; mx += w.x[id] * m; my += w.y[id] * m; mt += m; }
    return [mx / mt, my / mt];
  }
  chordVec(){ return norm(sub(this.pt(this.iT), this.pt(this.iN))); }   // nose -> tail
  leeNormal(){ const c = this.chordVec(); return [-c[1], c[0]]; }        // away from the wind side
  /* moment of inertia of the assembled body about its own centre of mass */
  inertia(){
    const w = this.w, cg = this.cg(); let I = 0;
    for (const id of this.body){
      const dx = w.x[id] - cg[0], dy = w.y[id] - cg[1];
      I += w.mass[id] * (dx * dx + dy * dy);
    }
    return I;
  }

  /* ── the aerodynamic state of the sail right now ───────────────────────── */
  sail(){
    const p = this.p;
    const cvec = this.chordVec(), nLee = this.leeNormal();
    const ca_ = cpFraction(0);                                  // (placeholder, see below)
    const vN = this.vel(this.iN), vT = this.vel(this.iT);
    // velocity at the centre of pressure, by the lever rule on the chord
    const pN = this.pt(this.iN), pT = this.pt(this.iT);
    let s = 0.4;                                                // first guess for the CP
    for (let it = 0; it < 2; it++){
      const vcp = [vN[0] + (vT[0] - vN[0]) * s, vN[1] + (vT[1] - vN[1]) * s];
      const zcp = pN[1] + (pT[1] - pN[1]) * s;
      const u = this.windSpeedAt(zcp);
      const W = [u - vcp[0], -vcp[1]];
      const Wl = len(W) || 1e-9;
      const Wh = [W[0] / Wl, W[1] / Wl];
      s = cpFraction(dot(Wh, cvec));
    }
    const vcp = [vN[0] + (vT[0] - vN[0]) * s, vN[1] + (vT[1] - vN[1]) * s];
    const zcp = pN[1] + (pT[1] - pN[1]) * s;
    const u = this.windSpeedAt(zcp);
    let W = [u - vcp[0], -vcp[1]];
    let Wl = len(W);
    /* an apparent wind six times the true wind is not weather, it is a solver in
       trouble; bound it so a transient cannot square itself into infinity. */
    const wCap = 6 * Math.max(2, u);
    if (Wl > wCap){ const f2 = wCap / Wl; W = [W[0] * f2, W[1] * f2]; Wl = wCap; }
    const Wh = Wl > 1e-9 ? [W[0] / Wl, W[1] / Wl] : [1, 0];
    const sa = dot(Wh, nLee);                                   // sin(alpha), signed
    const cq = dot(Wh, cvec);                                   // cos(alpha), signed
    const q = 0.5 * RHO * Wl * Wl;
    const FN = q * p.area * plateCN(sa);                        // along nLee
    const Fpar = q * p.area * p.cd0;                            // along the wind
    // resolve into the wind frame for the readings the room quotes
    const fx = FN * nLee[0] + Fpar * Wh[0];
    const fy = FN * nLee[1] + Fpar * Wh[1];
    const lift = fx * (-Wh[1]) + fy * Wh[0];                    // across the apparent wind
    const drag = fx * Wh[0] + fy * Wh[1];                       // along it
    return {
      alpha: Math.asin(Math.max(-1, Math.min(1, sa))),
      alphaDeg: Math.asin(Math.max(-1, Math.min(1, sa))) * 180 / Math.PI,
      sa, cq, s, q, W, Wl, Wh, FN, Fpar, cvec, nLee,
      lift: Math.abs(lift), liftSigned: lift, drag,
      fx, fy, cd0: p.cd0, unusedCa: ca_,
    };
  }

  windSpeedAt(z){ return windAt(z, this.p.u10 * this.gustMul); }

  /* ── one physics substep: forces onto velocities, then the world projects ── */
  _substep(h){
    const w = this.w, p = this.p;
    w.dt = h;
    const push = (id, fx, fy) => {
      const m = w.mass[id];
      if (!m || w.pinned[id]) return;
      w.px[id] -= (fx / m) * h * h;
      w.py[id] -= (fy / m) * h * h;
    };
    /* Quadratic drag on a light node is the classic way to detonate an explicit
       integrator: one big apparent wind, one overshoot, and the next step's wind
       is bigger still. The physical cap is the honest one — air drag can at most
       bring a body TO the speed of the air it is in, never past it — so the
       impulse is limited to exactly that. Inside the sane regime it changes
       nothing (the twin's numbers are identical); outside it, the room survives. */
    const pushDrag = (id, fx, fy, Wx, Wy) => {
      const m = w.mass[id];
      if (!m || w.pinned[id]) return;
      const f = Math.hypot(fx, fy);
      if (f < 1e-12) return;
      const cap = Math.hypot(Wx, Wy) * m / h;
      if (f > cap){ const s2 = cap / f; fx *= s2; fy *= s2; }
      w.px[id] -= (fx / m) * h * h;
      w.py[id] -= (fy / m) * h * h;
    };

    /* the sail */
    const S = this.sail();
    push(this.iN, S.FN * S.nLee[0] * (1 - S.s), S.FN * S.nLee[1] * (1 - S.s));
    push(this.iT, S.FN * S.nLee[0] * S.s,       S.FN * S.nLee[1] * S.s);
    push(this.iD, S.Fpar * S.Wh[0], S.Fpar * S.Wh[1]);
    this._sail = S;
    /* THE ASSEMBLY LEDGER — every aerodynamic force above the tow point, summed,
       because the thing the line has to hold up is the kite AND its tail. This is
       the left-hand side of the closure claim; nothing on the line goes in it. */
    let aeroX = S.fx, aeroY = S.fy;

    /* the line: cross-flow drag on every segment, halved onto its two nodes */
    const segLen = p.lineLen / p.lineNodes;
    const kLine = 0.5 * RHO * p.lineCd * p.lineDia * segLen;
    let prev = this.iA;
    for (let i = 0; i < this.lineLinks.length; i++){
      const j = (i === this.lineLinks.length - 1) ? this.iB : this.line[i];
      const ax = w.x[prev], ay = w.y[prev], bx = w.x[j], by = w.y[j];
      const tx = bx - ax, ty = by - ay;
      const tl = Math.hypot(tx, ty) || 1e-9;
      const ux = tx / tl, uy = ty / tl;
      const vx = (w.x[prev] - w.px[prev] + w.x[j] - w.px[j]) / (2 * h);
      const vy = (w.y[prev] - w.py[prev] + w.y[j] - w.py[j]) / (2 * h);
      const zc = (ay + by) * 0.5;
      const Wx = this.windSpeedAt(zc) - vx, Wy = -vy;
      const along = Wx * ux + Wy * uy;
      const nx = Wx - along * ux, ny = Wy - along * uy;       // the normal component only
      const nl = Math.hypot(nx, ny);
      const f = kLine * nl;
      pushDrag(prev, f * nx * 0.5, f * ny * 0.5, nx, ny);
      pushDrag(j,    f * nx * 0.5, f * ny * 0.5, nx, ny);
      prev = j;
    }

    /* the tail: each node carries a share of the bows, as a bluff drag area */
    const bows = p.tailBows;
    const perNode = bows > 0 ? (bows * p.bowArea) / this.tail.length : 0;
    const kTail = 0.5 * RHO * 1.2 * perNode;
    for (const id of this.tail){
      const vx = (w.x[id] - w.px[id]) / h, vy = (w.y[id] - w.py[id]) / h;
      const Wx = this.windSpeedAt(w.y[id]) - vx, Wy = -vy;
      const Wl = Math.hypot(Wx, Wy);
      const tfx = kTail * Wl * Wx, tfy = kTail * Wl * Wy;
      pushDrag(id, tfx, tfy, Wx, Wy);
      aeroX += tfx; aeroY += tfy;
    }
    this._aero = { x: aeroX, y: aeroY };
    this._massAloft = p.mass + (bows > 0 || p.tailLen > 0 ? p.tailRho * p.tailLen : 0);

    /* the ground: nothing goes under the grass */
    w.step(h);
    const vMax = p.vMax;
    for (let i = 0; i < w.x.length; i++){
      if (w.pinned[i]) continue;
      if (w.y[i] < 0.02){ w.y[i] = 0.02; if (w.py[i] < 0.02) w.py[i] = 0.02; }
      /* the governor: nothing on a kite moves at 120 m/s, and a solver that says
         otherwise is already wrong — better visibly wrong than infinite. Inert in
         flight (the twin checks that it never fires), it is what keeps a violent
         slider from turning the whole world into NaN. */
      const dx = w.x[i] - w.px[i], dy = w.y[i] - w.py[i];
      const sp = Math.hypot(dx, dy) / h;
      if (!(sp < vMax)){
        if (!Number.isFinite(sp)){ w.px[i] = w.x[i]; w.py[i] = w.y[i]; }
        else { const f = vMax / sp; w.px[i] = w.x[i] - dx * f; w.py[i] = w.y[i] - dy * f; }
      }
    }
  }

  /* advance real time. `dt` seconds, chopped into fixed substeps. */
  step(dt){
    const p = this.p;
    const n = Math.max(1, Math.min(64, Math.round(dt / p.h)));
    for (let k = 0; k < n; k++){
      this._gust(p.h);
      this._reel(p.h);
      this._substep(p.h);
      this.t += p.h;
    }
    this.last = this.measure();
    return this.last;
  }

  /* the gust: an Ornstein-Uhlenbeck wander on the ten-metre wind */
  _gust(h){
    const p = this.p;
    if (!p.gust){ this.gustMul = 1; return; }
    const tau = p.gustTau;
    const g = this.rng() * 2 - 1;
    this.gustMul += (1 - this.gustMul) * (h / tau) + p.gust * Math.sqrt(2 * h / tau) * g * 1.7;
    this.gustMul = Math.max(0.25, Math.min(2.2, this.gustMul));
  }

  /* run to a steady state fast (no gust), for the bench */
  settle(seconds, opt){
    const p = this.p, keep = p.gust;
    if (!opt || !opt.gust) p.gust = 0, this.gustMul = 1;
    const n = Math.round(seconds / p.h);
    for (let k = 0; k < n; k++){ if (p.gust) this._gust(p.h); this._reel(p.h); this._substep(p.h); this.t += p.h; }
    p.gust = keep;
    this.last = this.measure();
    return this.last;
  }

  /* ── everything the room and the twin read ─────────────────────────────── */
  measure(){
    const p = this.p;
    const S = this._sail || this.sail();
    const hand = this.pt(this.iA);
    const tow = this.pt(this.iB);
    const cg = this.cg();
    const d = sub(tow, hand);
    const range = len(d);
    const elevSee = Math.atan2(d[1], d[0]);                 // what the flyer sees
    /* the LOCAL direction of the line where it meets the kite */
    const nearNode = this.line.length ? this.pt(this.line[this.line.length - 1]) : hand;
    const dl = sub(tow, nearNode);
    const elevLocal = Math.atan2(dl[1], dl[0]);
    /* the assembly: sail + tail. In steady flight the apparent wind is the true
       wind (the kite is not going anywhere), so "up" and "downwind" ARE the lift
       and drag axes, and the whole claim is one line of Newton. */
    const A = this._aero || { x: S.fx, y: S.fy };
    const mAloft = this._massAloft != null ? this._massAloft : p.mass;
    const mg = mAloft * GRAV;
    const L = A.y, D = A.x;
    const tanPredict = D > 1e-6 ? (L - mg) / D : 0;
    const LD = D > 1e-6 ? L / D : 0;
    /* the tension the hands feel: the pull of the first segment */
    const first = this.line.length ? this.pt(this.line[0]) : tow;
    const stretch = this._stretch();
    const bestLd = bestLD(p.cd0);
    return {
      t: this.t,
      x: cg[0], z: cg[1], height: cg[1], range,
      elevSee, elevSeeDeg: elevSee * 180 / Math.PI,
      elevLocal, elevLocalDeg: elevLocal * 180 / Math.PI,
      predictDeg: Math.atan(tanPredict) * 180 / Math.PI,
      tanPredict, tanLocal: Math.tan(elevLocal),
      alphaDeg: S.alphaDeg, lift: L, drag: D, mg, LD,
      sailLift: S.liftSigned, sailDrag: S.drag,
      tailLift: L - S.liftSigned, tailDrag: D - S.drag,
      ceilingDeg: Math.atan(LD) * 180 / Math.PI,
      bestLD: bestLd.ld, bestAlphaDeg: bestLd.deg,
      bestCeilingDeg: Math.atan(bestLd.ld) * 180 / Math.PI,
      wind: this.windSpeedAt(cg[1]), u10: p.u10 * this.gustMul, gust: this.gustMul,
      apparent: S.Wl, q: S.q,
      pitchDeg: Math.atan2(S.cvec[1], S.cvec[0]) * 180 / Math.PI,
      cpFrac: S.s,
      tension: this._tension(),
      sagDeg: (elevLocal - elevSee) * 180 / Math.PI,
      stretch,
      lineLen: p.lineLen, tailBows: p.tailBows, bridleFrac: p.bridleFrac,
      handX: hand[0], handY: hand[1],
      towX: tow[0], towY: tow[1], firstX: first[0], firstY: first[1],
      hum: this.humHz(),
    };
  }

  /* the tension in the first segment, from how far the constraint is stretched
     — the same quantity that gives the residual-stretch honesty check. */
  _tension(){
    /* a position-based line has no stiffness to read a force from, so take the
       tension where it IS defined: the whole kite's force balance. */
    const S = this._sail || this.sail();
    const A = this._aero || { x: S.fx, y: S.fy };
    const mg = (this._massAloft != null ? this._massAloft : this.p.mass) * GRAV;
    return Math.hypot(A.x, A.y - mg);
  }
  _stretch(){
    let worst = 0;
    for (const c of this.lineLinks){
      const dx = this.w.x[c.j] - this.w.x[c.i], dy = this.w.y[c.j] - this.w.y[c.i];
      const d = Math.hypot(dx, dy);
      worst = Math.max(worst, Math.abs(d - c.rest) / c.rest);
    }
    return worst;
  }
  /* the line SINGS: a cylinder in cross-flow sheds vortices at the Strouhal
     frequency, f = St*U/d with St ~ 0.2. A 1 mm line in 8 m/s is 1.6 kHz — the
     thrum every kite flyer has heard, and a number, not a guess. */
  humHz(){
    const mid = this.line.length ? this.pt(this.line[Math.floor(this.line.length / 2)]) : this.pt(this.iA);
    const u = this.windSpeedAt(mid[1]);
    return 0.2 * u / this.p.lineDia;
  }

  /* the shape of the line, for drawing */
  linePoints(){
    const out = [this.pt(this.iA)];
    for (const id of this.line) out.push(this.pt(id));
    out.push(this.pt(this.iB));
    return out;
  }
  tailPoints(){
    const out = [this.pt(this.iT)];
    for (const id of this.tail) out.push(this.pt(id));
    return out;
  }
  bodyPoints(){
    return { nose: this.pt(this.iN), tail: this.pt(this.iT), spar: this.pt(this.iD), tow: this.pt(this.iB) };
  }
}

export {
  Kite, DEFAULTS, RHO, GRAV, Z0,
  windAt, plateCN, plateCL, plateCD, cpFraction, bestLD, kiteMasses, mulberry32,
};
