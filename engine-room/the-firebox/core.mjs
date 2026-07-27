/* ══════════════════════════════════════════════════════════════════════════════
   THE FIREBOX — the model, without a screen.

   Zero-dependency, DOM-free ESM.  Runs in the browser (forge-inlined) and in
   Node (`node engine-room/the-firebox/core.test.mjs`).

   The fire itself is a fluid solver and it lives on the GPU — you cannot put a
   Navier–Stokes pressure solve in a Node twin and learn anything.  What CAN
   live here, and does, is everything the fluid is carrying:

     · FIRE            every constant of the chemistry, in one object.  The page
                       turns this object into the shader's `#define` preamble,
                       so a number cannot mean one thing here and another on
                       the GPU.
     · reactStep()     one cell of gas for one tick: pyrolysis, combustion,
                       soot, radiation.  The reaction shader is written to
                       mirror it line for line — and the room does not ask you
                       to take that on faith: THE BENCH runs the real shader
                       over a strip of known cells and compares the readback
                       against this function (page: "prove it").
     · the LOGS        a log is a capsule; dropping one is a settle against the
                       grate and against the logs already there.  Tested here.

   WHAT THE MODEL SAYS (all of it measured by the twin, none of it tuned by eye)
     · a cell full of volatiles at ignition temperature, burned adiabatically,
       lands near 1900 K — a wood flame's real adiabatic temperature;
     · rich cells make soot and lean ones do not, which is the entire reason a
       flame is yellow at the top and blue at the root;
     · a lit log with the damper OPEN sustains itself: its own heat drives the
       pyrolysis that feeds it.  Shut the damper and the same log goes out.
       That loop is the fire.  The twin runs it both ways.
   ══════════════════════════════════════════════════════════════════════════════ */

// === FIREBOX CORE BEGIN ===
"use strict";

/* ── the box, in metres ───────────────────────────────────────────────────── */
const BOX = {
  W: 0.72,          // firebox interior width
  H: 0.92,          // interior height, grate to throat
  GRATE_Y: 0.13,    // height of the top of the grate bars above the floor
  NX: 176,          // solver grid
  NY: 224,
};

/* ── the chemistry, entire ────────────────────────────────────────────────────
   Temperatures in kelvin, times in seconds.  `fuel` is in units of "one cell
   filled to stoichiometric": burn 1.0 of it and you release Q_FUEL kelvin.
   Soot is an optical density in units of "opaque over one cell". ── */
const FIRE = {
  T_AMB:      293,     // the room
  T_MAX:      2100,    // a ceiling: no mixture of air and volatiles can burn hotter than
                       // burning ALL of it adiabatically, and adiabaticFlameT() measures
                       // that at 2023 K.  A stagnant cell that keeps being fed would
                       // otherwise integrate its way past it — nothing physical does.
  T_PYRO:     560,     // wood starts giving up its volatiles
  T_IGN:      810,     // where those volatiles catch
  IGN_SOFT:   130,     // width of the ignition knee
  Q_FUEL:     1560,    // kelvin released per unit of fuel burned
  K_BURN:     90.0,    // burn rate constant, 1/s
  RICH:       3.0,     // how much fuel starves itself of air
  SOOT_Y:     0.62,     // soot made per unit fuel burned, at full richness
  SOOT_RICH:  0.34,    // fuel density at which soot production is half-on
  SOOT_MAX:   4.0,    // an optical density past which more soot cannot make the smoke any blacker
  SOOT_OX:    12.0,     // soot burn-off rate, 1/s, at full draught and heat
  SOOT_T:     1450,    // where soot starts to burn off
  COOL_CONV:  0.55,    // convective/mixing loss toward ambient, 1/s
  COOL_RAD:   0.030,   // radiative loss coefficient (×1000 K/s at 1000 K, per unit emissivity)
  EMIS_GAS:   0.10,    // emissivity of clean gas — nearly transparent
  EMIS_SOOT:  1.30,    // emissivity added per unit soot — this is what radiates
  PYRO_MAX:   13.0,    // volatiles a unit of hot wood surface gives off, per second
  PYRO_KNEE:  240,     // …reached this many kelvin above T_PYRO, and saturating there: a
                       // charring surface cannot be made to gasify arbitrarily faster by
                       // making the flame on it hotter
  LOG_H:      1.60,    // how fast the flame heats the wood's SURFACE, 1/s
  LOG_K:      0.62,    // how fast the log's cool interior drags on that surface, 1/s
  LOG_C:      0.11,    // and how slowly the interior itself follows — the thermal mass, 1/s
  LOG_LOSS:   0.10,    // what the wood loses to the room, 1/s
  LOG_ENDO:   9.0,     // kelvin of the wood's own heat spent driving a unit of volatiles out
  LOG_GAS:    3.20,    // how fast hot wood heats the gas touching it, 1/s
  FLUSH:      10.0,    // how often a cell's gas is swapped for what is arriving, 1/s.
                       // The SHADER does not use this — it has real advection.  The 0-D
                       // experiment below does, because a cell of gas that never leaves
                       // is not a fire, it is an oven, and the rates differ by 50×.
  NOSLIP:     26.0,    // how hard the wood's surface holds the gas still, 1/s (a fluid
                       // constant, not a chemical one — it belongs to the solver, but it
                       // lives here so that it too reaches the shader as a #define)    // volatiles released per second per kelvin above T_PYRO, per unit of wood surface
  PYRO_CAP:   1.30,    // most fuel a cell will hold
  CHAR_K:     2.9e-4,  // metres of wood surface lost per unit of fuel released
  DRAUGHT_MIN:0.06,    // air still reaching the fire with the damper fully shut
};

/* the GLSL preamble the shader is compiled with — the SAME numbers, by
   construction.  Floats are emitted with a decimal point so GLSL takes them
   as float and not int. */
function glslDefines(extra){
  const all = Object.assign({}, FIRE, extra || {});
  let s = '';
  for (const k of Object.keys(all)){
    const v = all[k];
    if (typeof v !== 'number') continue;
    s += '#define F_' + k + ' ' + (Number.isInteger(v) ? v.toFixed(1) : String(v)) + '\n';
  }
  return s;
}

/* smoothstep, the GLSL one, so both sides agree at the knees */
function smoothstep(a, b, x){
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* ── ONE CELL, ONE TICK ───────────────────────────────────────────────────────
   `c` = { T, fuel, soot }, `wood` = how much of the cell is wood surface (0..1),
   `woodT` = the temperature of THAT WOOD (not of the gas — see logStep below),
   `draught` = the damper, 0..1.  Returns a NEW cell.  Order matters and is the
   order the shader uses:  wood warms gas → pyrolyse → burn → soot → radiate. ── */
function reactStep(c, wood, woodT, draught, dt){
  let T = c.T, fuel = c.fuel, soot = c.soot;
  /* the air actually reaching this cell.  `draught` may be pushed BELOW zero by
     the caller to represent a box whose one chimney cannot feed everything that
     is trying to burn in it — see the shared-supply note in the room. */
  const air = Math.max(0, FIRE.DRAUGHT_MIN + (1 - FIRE.DRAUGHT_MIN) * draught);

  /* 0 · the wood warms the gas lying against it.  This is the path by which a
        log that is already alight lights the next lot of gas that arrives. */
  let rel = 0;
  if (wood > 0){
    T += (woodT - T) * Math.min(1, wood * FIRE.LOG_GAS * dt);

    /* 1 · PYROLYSIS — hot wood gives off volatiles.  The rate is set by the
          WOOD's temperature, not the gas's: a log has thermal mass, which is
          exactly why a fire keeps going between gusts instead of guttering out
          every time a cold draught passes over it. */
    const gasify = smoothstep(FIRE.T_PYRO, FIRE.T_PYRO + FIRE.PYRO_KNEE, woodT);
    if (gasify > 0){
      rel = Math.min(FIRE.PYRO_CAP - fuel, wood * FIRE.PYRO_MAX * gasify * dt);
      if (rel > 0) fuel += rel; else rel = 0;
    }
  }

  /* 2 · COMBUSTION — first order in fuel, limited by the air that can get to
        it, gated by a soft ignition knee.  A rich cell chokes itself.
        THE HOT SURFACE IS A PILOT: gas lying against wood at 1200 K is lit by
        that wood whether or not the gas has warmed up yet — which is what a
        burning log IS, a sheet of flame standing off a hot surface.  So the
        knee is asked about the hotter of the gas and the wood it touches. */
  const ign = smoothstep(FIRE.T_IGN - FIRE.IGN_SOFT, FIRE.T_IGN + FIRE.IGN_SOFT,
    Math.max(T, wood > 0 ? woodT : 0));
  const oxy = air / (1 + FIRE.RICH * fuel);
  let burn = FIRE.K_BURN * fuel * oxy * ign * dt;
  if (burn > fuel) burn = fuel;
  fuel -= burn;
  T += burn * FIRE.Q_FUEL;

  /* 3 · SOOT — made in the rich part of the flame, burned off in the lean hot
        part.  Yellow is unburnt carbon glowing; blue is where there is none. */
  const rich = smoothstep(0, 2 * FIRE.SOOT_RICH, c.fuel);
  soot += burn * FIRE.SOOT_Y * rich;
  soot -= soot * FIRE.SOOT_OX * air * smoothstep(FIRE.SOOT_T, FIRE.SOOT_T + 350, T) * dt;
  if (soot < 0) soot = 0;
  if (soot > FIRE.SOOT_MAX) soot = FIRE.SOOT_MAX;

  /* 4 · LOSSES — mixing with room air, plus radiation.  The radiating body is
        the soot: clean gas is nearly transparent, which is why a sooty flame
        is bright and a clean one is not. */
  const emis = FIRE.EMIS_GAS + FIRE.EMIS_SOOT * Math.min(1, soot);
  const q = (T / 1000), a = (FIRE.T_AMB / 1000);
  T -= (T - FIRE.T_AMB) * FIRE.COOL_CONV * dt;
  T -= FIRE.COOL_RAD * emis * (q * q * q * q - a * a * a * a) * 1000 * dt;
  if (T < FIRE.T_AMB) T = FIRE.T_AMB;
  if (T > FIRE.T_MAX) T = FIRE.T_MAX;

  return { T, fuel, soot, burn, rel };
}

/* ── AND ONE PIECE OF WOOD, ONE TICK ─────────────────────────────────────────
   A log is not one temperature.  Its SURFACE follows the flame within a second
   — that is what gasifies — while its INTERIOR follows the surface over many
   seconds.  That second number is the whole reason a fire is a fire and not a
   flash: blow the flame flat for half a second and the surface is held up from
   inside, so the wood is still gasifying when the flame swings back.  Take the
   interior away and the same fire goes out every time a draught crosses it —
   the twin runs exactly that experiment. ── */
function logStep(Ts, Tc, Tgas, releaseRate, dt){
  const dTs = FIRE.LOG_H * (Tgas - Ts) + FIRE.LOG_K * (Tc - Ts)
            - FIRE.LOG_LOSS * (Ts - FIRE.T_AMB) - FIRE.LOG_ENDO * releaseRate;
  const dTc = FIRE.LOG_C * (Ts - Tc);
  return {
    Ts: Math.max(FIRE.T_AMB, Ts + dTs * dt),
    Tc: Math.max(FIRE.T_AMB, Tc + dTc * dt),
  };
}

/* how much wood a cell loses when its neighbours pyrolyse — the page uses this
   to shrink the logs, the twin to check that a fire eats its fuel. */
function charLoss(fuelReleased){ return FIRE.CHAR_K * fuelReleased; }

/* ── LOGS ─────────────────────────────────────────────────────────────────────
   A log is a capsule: a segment (a..b) with a radius.  Everything about
   stacking is distance-between-segments, so there is exactly one geometric
   primitive in this room. ── */
function segDist(p, a, b){
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const wx = p[0] - a[0], wy = p[1] - a[1];
  const vv = vx * vx + vy * vy;
  let t = vv > 0 ? (wx * vx + wy * vy) / vv : 0;
  t = Math.min(1, Math.max(0, t));
  const dx = p[0] - (a[0] + t * vx), dy = p[1] - (a[1] + t * vy);
  return Math.hypot(dx, dy);
}
/* closest approach between two segments (2-D) — sampled, then refined.  Exact
   enough for resting logs and far shorter than the analytic form. */
function segSegDist(a0, a1, b0, b1){
  let best = Infinity;
  for (let i = 0; i <= 24; i++){
    const t = i / 24;
    const p = [a0[0] + t * (a1[0] - a0[0]), a0[1] + t * (a1[1] - a0[1])];
    const d = segDist(p, b0, b1);
    if (d < best) best = d;
  }
  for (let i = 0; i <= 24; i++){
    const t = i / 24;
    const p = [b0[0] + t * (b1[0] - b0[0]), b0[1] + t * (b1[1] - b0[1])];
    const d = segDist(p, a0, a1);
    if (d < best) best = d;
  }
  return best;
}

class Log {
  constructor(x, y, ang, len, rad){
    this.x = x; this.y = y; this.ang = ang;
    this.len = len; this.rad = rad;
    this.rad0 = rad;
    this.char = 0;            // 0 = fresh timber, 1 = black
    this.spent = 0;           // total fuel it has given up
    this.Ts = FIRE.T_AMB;     // the surface — what gasifies
    this.Tc = FIRE.T_AMB;     // the interior — the thermal mass
  }
  ends(){
    const c = Math.cos(this.ang) * this.len * 0.5, s = Math.sin(this.ang) * this.len * 0.5;
    return [[this.x - c, this.y - s], [this.x + c, this.y + s]];
  }
  /* signed distance from a point to the log's surface */
  sdf(px, py){
    const [a, b] = this.ends();
    return segDist([px, py], a, b) - this.rad;
  }
  clone(){
    const l = new Log(this.x, this.y, this.ang, this.len, this.rad);
    l.char = this.char; l.spent = this.spent; l.Ts = this.Ts; l.Tc = this.Tc; l.rad0 = this.rad0;
    return l;
  }
}

/* Drop a log at x with angle ang: lower it until it touches the grate or a log
   already in the box, then let it roll a little toward the side it overhangs.
   Deterministic, and (the twin checks) never leaves two logs intersecting. */
function settleLog(log, others, grateY, dyStep){
  const step = dyStep || 0.004;
  let guard = 0;
  while (log.y > grateY + log.rad && guard++ < 4000){
    const test = log.clone(); test.y -= step;
    if (hits(test, others, grateY)) break;
    log.y = test.y;
  }
  /* one small settle: if the log is resting on exactly one other, let it tilt
     toward the free side, the way a stick does on a pile */
  const support = others.filter((o) => touches(log, o, 0.012));
  if (support.length === 1){
    const o = support[0];
    const dir = Math.sign(log.x - o.x) || 1;
    for (let i = 0; i < 9; i++){
      const test = log.clone();
      test.ang += dir * 0.035;
      test.y -= step * 0.4;
      if (hits(test, others, grateY)) break;
      log.ang = test.ang; log.y = test.y;
    }
  }
  return log;
}
function touches(a, b, slack){
  const [p0, p1] = a.ends(), [q0, q1] = b.ends();
  return segSegDist(p0, p1, q0, q1) <= a.rad + b.rad + (slack || 0);
}
function hits(log, others, grateY){
  const [p0, p1] = log.ends();
  if (Math.min(p0[1], p1[1]) - log.rad <= grateY) return true;
  for (const o of others){
    const [q0, q1] = o.ends();
    if (segSegDist(p0, p1, q0, q1) < log.rad + o.rad - 1e-6) return true;
  }
  return false;
}

/* the opening arrangement — three logs, laid the way you actually lay a fire:
   two on the grate with a gap between them for air, one across the top. */
function openingLogs(){
  const logs = [];
  const a = settleLog(new Log(0.19, 0.45, 0.05, 0.30, 0.044), [], BOX.GRATE_Y);
  logs.push(a);
  const b = settleLog(new Log(0.54, 0.45, -0.07, 0.30, 0.040), logs, BOX.GRATE_Y);
  logs.push(b);
  const top = settleLog(new Log(0.37, 0.62, 0.16, 0.42, 0.042), logs, BOX.GRATE_Y);
  logs.push(top);
  return logs;
}

/* ── the sustaining loop, as a 0-D experiment ─────────────────────────────────
   ONE cell of gas lying against ONE piece of wood: the gas heats the wood, the
   wood gasifies, the gas burns, and the gas is carried away and replaced by
   what is arriving from below.  That last clause is the FLUSH — it is what
   advection does in the real solver, and leaving it out is the difference
   between a flame and an oven: without it the same cell of gas sits on the
   wood for ever and every rate in the model is mis-scaled by the fifty-odd
   times a second a real cell's contents are replaced.
   The whole fire is in these five numbers.  If the loop closes they stay up;
   if it does not they fall to the room. ── */
class Cell {
  constructor(T){
    const t = T === undefined ? 1200 : T;
    this.T = t; this.fuel = 0.28; this.soot = 0.2;
    this.Ts = t; this.Tc = t;             // the wood: surface, then interior
    this.burn = 0; this.rel = 0;
  }
  /* `wood` = how much wood this cell touches; `starve` = hold the arriving gas
     at room temperature (a gust across the fire, or a bellows full of cold
     air) — used by the twin to blow the flame flat and see what survives. */
  step(draught, dt, wood, starve){
    const gasIn = starve ? { T: FIRE.T_AMB, fuel: 0, soot: 0 } : this;
    const before = this.T;
    const r = reactStep(gasIn, wood === undefined ? 1 : wood, this.Ts, draught, dt);
    const f = Math.min(1, FIRE.FLUSH * dt);
    this.T = r.T + (FIRE.T_AMB - r.T) * f;
    this.fuel = r.fuel * (1 - f);
    this.soot = r.soot * (1 - f);
    this.burn = r.burn; this.rel = r.rel;
    const L = logStep(this.Ts, this.Tc, before, r.rel / dt, dt);
    this.Ts = L.Ts; this.Tc = L.Tc;
    return this;
  }
}
function sustainRun(draught, seconds, T0, wood){
  const dt = 1 / 240;
  const c = new Cell(T0);
  const gas = [], log = [], core = [];
  for (let i = 0; i < Math.round(seconds / dt); i++){
    c.step(draught, dt, wood === undefined ? 1 : wood, false);
    if (i % 24 === 0){ gas.push(c.T); log.push(c.Ts); core.push(c.Tc); }
  }
  return { hist: gas, logHist: log, coreHist: core,
           end: { T: c.T, fuel: c.fuel, soot: c.soot, burn: c.burn },
           endLogT: c.Ts, endCoreT: c.Tc, cell: c };
}

/* adiabatic flame temperature: burn a stoichiometric cell with no losses at
   all and no wood in it.  (Losses OFF is what "adiabatic" means.) */
function adiabaticFlameT(){
  const save = { c: FIRE.COOL_CONV, r: FIRE.COOL_RAD };
  FIRE.COOL_CONV = 0; FIRE.COOL_RAD = 0;
  let c = { T: FIRE.T_IGN + 90, fuel: 0.72, soot: 0 };
  for (let i = 0; i < 4000; i++) c = reactStep(c, 0, 0, 1, 1 / 240);
  FIRE.COOL_CONV = save.c; FIRE.COOL_RAD = save.r;
  return c.T;
}
// === FIREBOX CORE END ===

export {
  BOX, FIRE, glslDefines, smoothstep,
  reactStep, logStep, charLoss,
  Log, segDist, segSegDist, settleLog, touches, hits, openingLogs,
  Cell, sustainRun, adiabaticFlameT,
};
