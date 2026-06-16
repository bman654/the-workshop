// The Passing Siren — logic core (Doppler & the Mach cone you drag).
//
// THE WHOLE POINT: a dark top-down field where the Doppler effect becomes a thing you can SEE.
// Drag a buzzing source across the plane; it fires concentric wavefront rings at a fixed cadence.
// The rings BUNCH tight ahead of the motion and STRETCH behind — the pitch shift is the visible
// crowding, not a number on a chart. A fixed ear hears the pitch bend UP on approach, snap DOWN
// once the source passes. Crank the speed past the wave speed c and the bunched rings harden into
// a hard red MACH CONE whose half-angle sin μ = c/v you can read live.
//
// WHY THE PROOF IS REAL: each ring is a circle centred where the source WAS when it fired, growing
// at the wave speed c. The ear hears ring k when that circle's radius reaches it; differentiating
// the arrival time gives the EXACT closed form f_obs = f_src·c/(c − v·cosθ), where θ is the angle
// between the source velocity and the line to the ear, measured at emission. So the heard pitch is
// not asserted — it falls out of the geometry, two independent ways (the velocity-projection form
// and the te-derivative of the exact arrival map), and the self-test pins them equal numerically.
// Above c the ring envelope is a cone with sin μ = c/v — pure geometry, independent of the lag τ.
// The NEGATIVE CONTROL is a stationary source: it bunches NO rings and bends NO pitch (f_obs ≡
// f_src to machine precision) — proof that the shift is the MOTION's, not arithmetic noise.
//
// SOURCING (anti-drift, encoded as a test in core.test.mjs): the page inlines this core byte-for-
// byte between the PASSING-SIREN CORE sentinels; core.test.mjs byte-parity-checks the inlined copy
// in index.html against this file's body so it can never silently drift.
//
// Zero-dep ESM. World units: c = 1 (wave speed). Positions/velocities are in those units.

// ===== PASSING-SIREN CORE (byte-identical to core.mjs) =====
"use strict";

const C = 1.0;          // wave speed (world units / second)

// Heard frequency factor for a moving source, still listener (classical Doppler, source-motion
// form): f_obs = f_src · c / (c − v_radial), v_radial = component of source velocity TOWARD the
// listener = v·cosθ, θ = angle(velocity, source→listener) measured at EMISSION. Approaching
// (v_radial>0) → denominator shrinks → pitch rises; receding (v_radial<0) → pitch falls. Returns
// the bare factor f_obs/f_src (=1 when stationary, ∞ when a ring overtakes the listener, v>c only).
function dopplerFactor(vx, vy, sx, sy, lx, ly){
  const dx = lx - sx, dy = ly - sy;          // source → listener at emission
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-12) return 1;
  const vrad = (vx*dx + vy*dy) / dist;       // = v·cosθ
  const denom = C - vrad;
  if (denom <= 1e-9) return Infinity;        // ring overtakes listener (only possible when v>c)
  return C / denom;
}

// Exact arrival time at listener L of the ring emitted at time te from a CONSTANT-velocity source
// X(te) = X0 + V·te. The ring's radius at time t is c·(t − te); it reaches L when that radius
// equals |L − X(te)|. So t_arrive(te) = te + |L − X(te)| / c.
function arrivalTime(te, x0, y0, vx, vy, lx, ly){
  const sx = x0 + vx*te, sy = y0 + vy*te;
  return te + Math.hypot(lx - sx, ly - sy) / C;
}

// Instantaneous heard frequency from the arrival map: f_obs = f_src / (d t_arrive / d te).
// d t_arrive/dte = 1 − v_radial/c, so f_obs = f_src · c/(c − v_radial) — the SAME closed form,
// derived a second way. arrivalRate returns d t_arrive / d te by a centred difference; the
// self-test pins this against dopplerFactor() across a full pass.
function arrivalRate(te, x0, y0, vx, vy, lx, ly, h){
  h = h || 1e-5;
  const a1 = arrivalTime(te - h, x0, y0, vx, vy, lx, ly);
  const a2 = arrivalTime(te + h, x0, y0, vx, vy, lx, ly);
  return (a2 - a1) / (2*h);                  // d t_arrive / d te
}

// Mach cone half-angle for a SUPERSONIC source: the envelope of the expanding rings is a cone with
// sin(μ) = c/v. Pure geometry — a ring fired at lag τ has radius c·τ; the source has since travelled
// v·τ, so the tangent from the source-now to that circle subtends sin(μ) = cτ/(vτ) = c/v, INDEPENDENT
// of τ. Returns radians, or NaN if subsonic (no cone exists at or below c).
function machAngle(speed){
  if (speed <= C) return NaN;
  return Math.asin(C / speed);
}

// ── the self-test: prove the three claims numerically ──────────────────────────────────────
function runSelfTest(){
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass, info });

  // (1) SUBSONIC: the rendered ring-arrival rate matches the closed form across a FULL pass.
  // Source flies left→right past an off-axis ear; sample θ from deep-approach to deep-recede and
  // demand the two independent derivations agree to machine precision the whole way.
  {
    const x0 = -4, y0 = 0, vx = 0.6, vy = 0, lx = 0, ly = 0.8, fsrc = 12;
    let maxRel = 0;
    for (let te = -6; te <= 6; te += 0.05){
      // closed form via velocity·(source→listener) at this emission position
      const sx = x0 + vx*te, sy = y0 + vy*te;
      const fClosed = fsrc * dopplerFactor(vx, vy, sx, sy, lx, ly);
      // independent: f_obs = f_src / (d t_arrive/d te), te-derivative of the EXACT arrival map
      const fArr = fsrc / arrivalRate(te, x0, y0, vx, vy, lx, ly);
      if (!isFinite(fClosed) || !isFinite(fArr)) continue;
      maxRel = Math.max(maxRel, Math.abs(fArr - fClosed) / fClosed);
    }
    ck('1 · subsonic: arrival-rate = c/(c−v·cosθ) across a full pass', maxRel < 1e-6, 'maxRelErr = ' + maxRel.toExponential(2));
  }

  // (2) NEGATIVE CONTROL: a STATIONARY source bends NO pitch — f_obs = f_src exactly, at every
  // angle. This is the playable control on the page (the "stop source" button).
  {
    let maxDev = 0;
    for (let ang = 0; ang < 6.283; ang += 0.21){
      const lx = 2*Math.cos(ang), ly = 2*Math.sin(ang);
      const f = dopplerFactor(0, 0, 0, 0, lx, ly);   // zero velocity → no shift
      maxDev = Math.max(maxDev, Math.abs(f - 1));
    }
    ck('2 · stationary control: f_obs = f_src (no shift, all angles)', maxDev < 1e-12, 'maxDev = ' + maxDev.toExponential(2));
  }

  // (3) SUPERSONIC: the ring-envelope half-angle equals asin(c/v) — checked against a DIRECT
  // geometric envelope sweep (the minimum tangent angle over many lagged rings) at several speeds.
  {
    let maxErr = 0, sample = '';
    for (const v of [1.4, 2.0, 3.0]){
      const closed = machAngle(v);
      // direct: source NOW at the origin (te=0); rings fired at te<0 from x = v·te, radius = −c·te.
      let minAng = Infinity;
      for (let k = 1; k < 4000; k++){
        const te = -k * 0.001;
        const cx = v*te, rad = -C*te;          // ring centre x, radius
        const dist = Math.hypot(0 - cx, 0);    // source-now (origin) to ring centre
        if (rad >= dist) continue;
        minAng = Math.min(minAng, Math.asin(rad / dist));
      }
      const err = Math.abs(minAng - closed);
      if (err > maxErr){ maxErr = err; sample = 'v=' + v + 'c μ=' + (closed*180/Math.PI).toFixed(2) + '°'; }
    }
    ck('3 · supersonic: sin μ = c/v (cone envelope)', maxErr < 1e-3, sample + ' err=' + maxErr.toExponential(2));
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
// ===== END PASSING-SIREN CORE =====

export { C, dopplerFactor, arrivalTime, arrivalRate, machAngle, runSelfTest };
