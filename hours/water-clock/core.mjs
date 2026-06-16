/* ============================================================================
   THE HOURS · WATER-CLOCK — core.mjs   (the SOLE fluids authority for the bench)

   A clepsydra tells the hour by how far its water has fallen. The trouble the
   ancients hit: water does not fall at a steady pace. Torricelli's law gives the
   speed of the jet leaving a small hole at the bottom under a head h:

        v = √(2·g·h)                                    (the deeper the water, the faster it leaves)

   Conservation of volume ties the falling surface to that jet. If the vessel has
   cross-section A(h) at height h and the orifice has area a, then in time dt the
   surface drops dh while a·v·dt of water leaves:

        A(h)·(−dh) = a·v·dt        ⇒        dh/dt = −(a / A(h))·√(2·g·h)

   ── THE STRAIGHT CYLINDER (A constant) ──
   dh/dt = −(a/A)·√(2gh) depends on h, so the level falls FAST when full and SLOW
   when nearly empty. Integrating:  √h(t) = √h0 − (a/A)·√(g/2)·t, hence

        h(t) = ( √h0 − (a/A)·√(g/2)·t )²              (a falling parabola in t)

   Even hour-marks in TIME land at uneven heights — they CROWD toward the bottom,
   because Δ(√h) is the constant, not Δh. A cylinder can never keep even hours.

   ── THE SHAPED BORE (the fix the ancients sought) ──
   DEMAND a constant drop rate dh/dt = −c. Solve the ODE for the cross-section:

        −c = −(a/A(h))·√(2gh)      ⇒      A(h) = (a/c)·√(2g)·√h = K·√h

   A cross-section proportional to √h. Since A = π·r², the radius profile is

        r(h) = √(K/π)·h^(1/4)                          (a FOURTH-ROOT bore — narrow base, flaring top)

   With A(h)=K·√h the level falls LINEARLY:  h(t) = h0 − c·t.  Even hours in time
   now land at EVEN heights. Same water, same hole, same finish time — but the
   marks are a metronome instead of an accelerando. THAT is the lesson.

   Everything the bench draws — the vessel WALLS, the water level, the hour-marks —
   is read FROM this module (the drawn vessel outline IS the bore the math used).
   The bench animates nothing but the surface y; it computes no fluids of its own.

   index.html INLINES this file byte-identical between sentinels; core.test.mjs
   runs it in Node. If the page's inline ever drifts from this file, the page's
   re-extraction parity check fails.

   PINNED CONSTANTS — all derive from T_DRAIN. To retime the clock, change ONLY
   T_DRAIN; never touch G, and keep A_CYL derived (so the negative control stays
   honest: same Torricelli law, same orifice, same finish, ONLY the shape differs).
   ============================================================================ */

// ── physical + design constants (labeled; the bench reads these, never hardcodes) ──
export const G = 9.80665;                       // standard gravity (m/s²)
export const H0 = 0.30;                          // both vessels fill to this head (m) — a fair race
export const T_DRAIN = 15;                       // the shaped bore drains in exactly this many seconds
export const C = H0 / T_DRAIN;                    // the demanded constant drop rate (m/s) = 0.02
export const A_ORIFICE = Math.PI * 0.002 * 0.002; // the SAME hole both vessels drain through (2 mm radius)
export const K_BORE = (A_ORIFICE / C) * Math.sqrt(2 * G); // A(h) = K_BORE·√h for the constant-rate bore
export const N_MARKS = 6;                         // six even hour-marks down the head
// the cylinder's cross-section, DERIVED so it too drains in exactly T_DRAIN — the
// negative control shares law, orifice and finish-time; ONLY its shape is straight.
export const A_CYL = (T_DRAIN / Math.sqrt(2 * H0 / G)) * A_ORIFICE;

// ── cross-section of the shaped bore at head h: A(h) = K_BORE·√h ──
export function shapedArea(h){ return K_BORE * Math.sqrt(Math.max(h, 0)); }

// ── cross-section of the straight cylinder: constant ──
export function cylinderArea(_){ return A_CYL; }

// ── the outflow ODE: dh/dt = −(a/A(h))·√(2gh). The ONE law both vessels obey. ──
export function dhdt(h, areaFn, a = A_ORIFICE){
  const hc = Math.max(h, 0);
  return -(a / areaFn(hc)) * Math.sqrt(2 * G * hc);
}

// ── shaped bore: the closed-form LINEAR level h(t) = h0 − C·t (the headline result) ──
export function shapedHeight(t){ return Math.max(H0 - C * t, 0); }
export function shapedEmpty(){ return H0 / C; }   // = T_DRAIN exactly

// ── straight cylinder: the closed-form drain time and the falling-parabola level ──
export function cylinderEmpty(h0 = H0, A = A_CYL, a = A_ORIFICE){
  return (A / a) * Math.sqrt(2 * h0 / G);          // √h reaches 0 at this t
}
export function cylinderHeight(t, h0 = H0, A = A_CYL, a = A_ORIFICE){
  const tE = cylinderEmpty(h0, A, a);
  if(t >= tE) return 0;
  const s = Math.sqrt(h0) - (a / A) * Math.sqrt(G / 2) * t;
  return s > 0 ? s * s : 0;
}

// ── the level reader the view uses for either vessel, in physical seconds ──
export function heightAt(kind, t){
  return kind === 'shaped' ? shapedHeight(t) : cylinderHeight(t);
}
export function emptyTime(kind){
  return kind === 'shaped' ? shapedEmpty() : cylinderEmpty();
}

// ── radii the VIEW draws from, so the DRAWN vessel IS the bore the math used.
//    (shaped base radius ≈0.39 cm — near zero; the view applies a small COSMETIC
//     floor so the vessel doesn't pinch to a point. The math here is unfloored.) ──
export function shapedRadius(h){ return Math.sqrt(shapedArea(h) / Math.PI); }
export function cylinderRadius(){ return Math.sqrt(A_CYL / Math.PI); }
export function radiusAt(kind, h){ return kind === 'shaped' ? shapedRadius(h) : cylinderRadius(); }

// ── the hour-marks: N even divisions of TIME, read back to heights off the level law.
//    On the shaped bore the heights come out even; on the cylinder they crowd. ──
export function hourMarks(kind, N = N_MARKS){
  const tE = emptyTime(kind);
  const out = [];
  for(let i = 0; i <= N; i++){
    const t = (i / N) * tE;
    out.push({ i, t, h: heightAt(kind, t) });
  }
  return out;
}

// ── the same marks, plus √h — exposing the cylinder's hidden invariant Δ(√h)=const ──
export function sqrtMarks(kind, N = N_MARKS){
  return hourMarks(kind, N).map(m => ({ ...m, sqrtH: Math.sqrt(Math.max(m.h, 0)) }));
}

// ── the independent WITNESS: integrate the raw ODE with RK4 and confirm the
//    closed forms above. Frame jitter never touches this — it is the twin only.
//    f clamps h to hStop so the singular A(0)=0 can't blow the integrator up. ──
export function rk4Drain(areaFn, { h0 = H0, dt = 1e-3, a = A_ORIFICE, hStop = 1e-7 } = {}){
  let h = h0, t = 0;
  const samples = [{ t, h }];
  const f = hh => { const hc = Math.max(hh, hStop); return -(a / areaFn(hc)) * Math.sqrt(2 * G * hc); };
  while(h > hStop && t < 10000){
    const k1 = f(h), k2 = f(h + 0.5 * dt * k1), k3 = f(h + 0.5 * dt * k2), k4 = f(h + dt * k3);
    h = h + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); t += dt;
    if(h < 0) h = 0;
    samples.push({ t, h });
  }
  return { tEmpty: t, samples };
}
