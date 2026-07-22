/* ════════════════════════════════════════════════════════════════════════════
   core.mjs — The Cartesian Diver. Real physics, CLAIM-FREE. The SOLE math
   authority: the page render AND the Node twin both read from THIS. y+ = deeper
   (0 = the meniscus at the neck; 1 = resting on the floor of the bottle).

   No number is ever PRINTED to the visitor. This drives the toy; the honest
   layer is the FEEL (the un-holdable knife-edge) and the payoff-liveness twin —
   never a HUD, never a printed pressure/Boyle number, never a theorem.

   The mechanism (SHOWN in the belly bubble, never told):
     A rigid glass devil of fixed volume Vglass traps a pocket of air Vair.
     Squeezing the bottle raises the internal pressure; the trapped air
     compresses (Boyle, isothermal): Vair(P) = V0·P0 / P. Less air ⇒ less
     displaced water ⇒ less lift ⇒ he sinks. Water is incompressible.

   Why the hover REFUSES to be held (a genuine UNSTABLE equilibrium):
     Deeper water = more hydrostatic pressure = a smaller bubble = less lift.
     So a diver a hair below neutral gets HEAVIER as it sinks (dF/dy < 0, a
     positive eigenvalue) and runs away to the floor; a hair above gets lighter
     and floats to the top. Neutral is a knife-edge you can touch, never keep.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── constants (the knife-edge TUNING surface — see NOTE at foot) ─────────────
   The SIGN of the instability is fixed by physics; its TIMESCALE and the width
   of the usable squeeze band are the tuning knobs (H · DRAG · SQ_GAIN · the air
   pocket). These are playtest-tuned so a realistic imperfect hold visibly slips
   within a heartbeat, and the control band sits in the comfortable middle of a
   finger's squeeze. ── */
export const P0 = 1;          // atmospheric baseline pressure (arbitrary units)
export const RHO = 1;         // water density
export const G = 9.8;         // gravity
export const H = 0.6;         // hydrostatic gain: how fast pressure rises with depth
export const DRAG = 0.45;     // linear water drag on the diver's velocity
export const SQ_GAIN = 1.2;   // how much a full squeeze raises internal pressure

/* the diver: a fixed glass shell (Vglass) with a trapped air pocket at rest
   (Vair0). mass is tuned so at rest (no squeeze) he floats firmly at the neck,
   and a moderate mid-range squeeze balances him near mid-bottle. */
export function makeDiver(){
  return { y: 0, v: 0, Vglass: 1.0, Vair0: 0.42, mass: 1.21 };
}

/* internal pressure at squeeze `sq` (0..1) and depth `y`. Squeeze and depth
   both add to the atmospheric baseline. Depth only counts inside the water. */
export const pressure = (d, sq, y) => P0 + SQ_GAIN * sq + H * Math.max(0, y);

/* Boyle's law — the trapped air pocket at the current pressure. This is the
   number the belly bubble is DRAWN from; it is never printed. */
export const airVolume = (d, sq) => d.Vair0 * P0 / pressure(d, sq, d.y);

/* one physics tick. `extAccel` is an optional external acceleration (the live
   render feeds a faint micro-turbulence here so a hold is genuinely imperfect;
   the Node twin passes 0 for a clean deterministic instability test). Returns
   the frame's mechanism state — the render reads `net` for the honest tremble. */
export function step(d, squeeze, dt, extAccel = 0){
  const Vair = airVolume(d, squeeze);
  const buoy = RHO * G * (d.Vglass + Vair);   // Archimedes: weight of water pushed aside
  const weight = d.mass * G;
  const net = (weight - buoy) / d.mass;       // deterministic net accel, down-positive
  const aDown = net - DRAG * d.v + extAccel;
  d.v += aDown * dt;
  d.y += d.v * dt;
  if (d.y < 0){ d.y = 0; d.v = Math.min(0, d.v) * 0.3; }   // bumps the meniscus, small bounce
  if (d.y > 1){ d.y = 1; d.v = 0; }                        // rests on the floor
  return { Vair, buoy, weight, net };
}

/* the depth-balance pressure: net force is zero exactly when the displaced
   volume equals the diver's mass. This is a single value, independent of how
   you reach it — the whole reason neutral is a razor. */
export function equilibriumPressure(d){
  const Veq = d.mass - d.Vglass;              // the air volume that exactly balances weight
  return d.Vair0 * P0 / Veq;                  // ⇒ the pressure that squeezes the pocket to Veq
}

/* the canonical hover the render marks with its still-line and the twin probes:
   the squeeze that balances the diver at mid-bottle (y0), and that y0 itself.
   The render's still-line and the twin MUST both read THIS, or the toy feels
   dead while the twin passes green. */
export function interiorEquilibrium(d = makeDiver(), y0 = 0.5){
  const Peq = equilibriumPressure(d);
  const sqHold = (Peq - P0 - H * y0) / SQ_GAIN;   // solve pressure(sqHold, y0) = Peq
  return { y0, sqHold, Peq };
}

/* ── the held-breath (the felt challenge, diegetic — no score, no number) ──
   The marked still-line sits at STILL_Y; a thin band around it is where a held
   breath accrues. While the diver's centroid rests inside the band and nearly
   still, `clarity` (0..1) swells — the render clears the glass and quiets the
   hum toward a single held tone; slip out and it releases. */
export const STILL_Y = 0.5;
export const STILL_BAND = 0.075;
export function inStillBand(y, v){ return Math.abs(y - STILL_Y) < STILL_BAND && Math.abs(v) < 0.10; }
export function breathStep(clarity, y, v, dt){
  return inStillBand(y, v) ? Math.min(1, clarity + dt*0.42) : Math.max(0, clarity - dt*0.9);
}

/* the honest tremble amplitude (0..1), READ from the same core's net force:
   near neutral (net→0) the ever-present micro-turbulence stops being swamped
   and the quiver blows up; firmly sinking/rising (large |net|) it is glassy.
   This is that perturbation-to-force ratio, clamped — NOT a cosmetic sine. */
export function trembleAmp(net, ref = 1.4){
  return Math.max(0, 1 - Math.min(1, Math.abs(net) / ref));
}

/* ════════════════════════════════════════════════════════════════════════════
   THE PAYOFF-LIVENESS SUITE — the verification a claim-free delight piece owes.
   NOT a theorem: it proves the PAYOFFS FIRE by driving the SAME core the render
   drives. The page runs this too (window.__diverLiveness) and the Node twin
   (core.test.mjs) re-runs it headless. No printed claim; only that it's alive.
   ════════════════════════════════════════════════════════════════════════════ */
export function runLiveness(){
  const DT = 1 / 120;
  const results = {};

  // (1) a firm past-threshold squeeze ⇒ he sinks toward the floor, monotone-ish.
  {
    const d = makeDiver();
    let prev = d.y, monotone = true;
    for (let i = 0; i < 720; i++){ step(d, 1.0, DT); if (d.y < prev - 1e-6) monotone = false; prev = d.y; }
    results.squeezeSinks = d.y > 0.9 && monotone;
    results._sinkY = d.y;
  }

  // (2) release ⇒ he rises back to the neck.
  {
    const d = makeDiver(); d.y = 0.9; d.v = 0;
    for (let i = 0; i < 720; i++) step(d, 0.0, DT);
    results.releaseRises = d.y < 0.02;
    results._riseY = d.y;
  }

  // (3) the bubble VISIBLY shrinks under pressure (Boyle, shown in the belly).
  {
    const soft = airVolume(makeDiver(), 0.0);
    const hard = airVolume(makeDiver(), 0.9);
    results.bubbleShrinks = hard < soft * 0.6;
    results._shrink = hard / soft;
  }

  // (4) REFUSES TO HOLD — the same neutral the render marks repels BOTH ways.
  {
    const { y0, sqHold } = interiorEquilibrium();
    const up = makeDiver(); up.y = y0 - 0.02;
    const dn = makeDiver(); dn.y = y0 + 0.02;
    for (let i = 0; i < 500; i++){ step(up, sqHold, DT); step(dn, sqHold, DT); }
    results.refusesToHold = (y0 - up.y) > 0.05 && (dn.y - y0) > 0.05;
    results._up = up.y; results._dn = dn.y; results._y0 = y0;
  }

  // (5) a DRIVEN hold at neutral decays away — a held sqHold cannot keep it bounded.
  {
    const { y0, sqHold } = interiorEquilibrium();
    const d = makeDiver(); d.y = y0 + 0.02;
    for (let i = 0; i < 720; i++) step(d, sqHold, DT);   // ~6s of a perfectly-held squeeze
    results.holdDecays = Math.abs(d.y - y0) > 0.15;       // yet it has run clean out of the band
    results._drift = Math.abs(d.y - y0);
  }

  // (6) a RESTORED session resumes at the saved depth (persistence liveness):
  //     a diver rehydrated at a saved y, held at its balancing squeeze for one
  //     tick, is still essentially where it was saved — it doesn't teleport.
  {
    const saved = 0.42;
    const d = makeDiver(); d.y = saved;
    const sqAt = (equilibriumPressure(d) - P0 - H * saved) / SQ_GAIN;
    step(d, sqAt, DT);
    results.sessionResumes = Math.abs(d.y - saved) < 0.01;
    results._resumeY = d.y;
  }

  // (7) the HELD-BREATH accrues in the still band and releases outside it.
  {
    let cin = 0;  for (let i = 0; i < 120; i++) cin  = breathStep(cin, STILL_Y, 0.0, 1/60);   // parked in-band, still
    let cout = 0.9; for (let i = 0; i < 120; i++) cout = breathStep(cout, 0.0, 0.0, 1/60);      // out of band → releases
    results.breathAccrues = cin > 0.5 && cout < 0.1;
    results._cin = cin; results._cout = cout;
  }

  results.pass = results.squeezeSinks && results.releaseRises && results.bubbleShrinks
              && results.refusesToHold && results.holdDecays && results.sessionResumes
              && results.breathAccrues;
  return results;
}

/* ── TUNING NOTE (why these constants) ────────────────────────────────────────
   equilibriumPressure = Vair0/(mass−Vglass) = 0.30/0.15 = 2.0. The squeeze that
   balances depth y is sq*(y) = (2.0 − 1 − H·y)/SQ_GAIN, so mid-bottle hovers sit
   at sq ≈ 0.43‥0.73 — the comfortable middle of a finger's squeeze. At rest
   (sq=0) he floats firmly at the neck; past sq≈0.83 he commits to the floor from
   anywhere. The unstable eigenvalue with these numbers gives a runaway on the
   order of a couple of seconds for a small slip — a heartbeat's hold, not a
   breath's — which the live turbulence and the amplified tremble tighten. ── */
