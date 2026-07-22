/* ============================================================================
 *  cradle.legacy.mjs — the FROZEN old angular integrator (th[]/om[]), NOT SHIPPED.
 *
 *  This is the cradle's pre-refounding physics, lifted verbatim from the old page so
 *  the golden-trajectory diff (cradle.golden.mjs) can prove the Verlet-core rebuild
 *  is a re-SOUL, not a regression: same swing period, same lift-k → k-out counts and
 *  emergent speeds, no worse energy drift, and the same collision CADENCE (the subtle
 *  way feel rots even when counts stay correct). It rides along only in the test tree.
 * ============================================================================ */

export const R = 0.045, D = 2 * R, GAP = 0.0008, SPACING = D + GAP, L = 0.92, G = 9.81;
export const DEF_LIFT = 0.86;

/* the old event-collision primitive was a local `collide`; here we reuse the core's
 * identical collide1D so the two integrators differ ONLY in their pendulum step, not
 * their collision algebra (isolating what the refounding actually changed). */
import { collide1D } from '../../tools/dynamics/verlet.mjs';

export function buildLegacy(N){
  const m = new Array(N).fill(1);
  const th = new Array(N).fill(0), om = new Array(N).fill(0);
  const pivotX = (i) => (i - (N - 1) / 2) * SPACING;
  const centerX = (i) => pivotX(i) + L * Math.sin(th[i]);

  let events = 0, pending = [];

  function lift(k, side, angle){
    for (let i = 0; i < N; i++){ th[i] = 0; om[i] = 0; }
    /* lift OUTWARD (left group to −θ, right group to +θ) — the same scenario the
     * refounded sim runs, so the golden diff compares like with like. */
    const sign = (side === 'L') ? -1 : 1;
    for (let i = 0; i < k; i++){ const idx = (side === 'L') ? i : (N - 1 - i); th[idx] = sign * Math.abs(angle); om[idx] = 0; }
  }

  function step(dt, e){
    const k = G / L;
    for (let i = 0; i < N; i++){
      const a = -k * Math.sin(th[i]);
      th[i] += om[i] * dt + 0.5 * a * dt * dt;
      const a2 = -k * Math.sin(th[i]);
      om[i] += 0.5 * (a + a2) * dt;
    }
    for (let pass = 0; pass < N + 2; pass++){
      let any = false;
      for (let i = 0; i < N - 1; i++){
        const dx = centerX(i + 1) - centerX(i);
        if (dx < D - 1e-9){
          const ci = Math.max(0.25, Math.cos(th[i])), cj = Math.max(0.25, Math.cos(th[i + 1]));
          const vi = L * om[i] * ci, vj = L * om[i + 1] * cj;
          if (vi - vj > 0){
            const r = collide1D(m[i], m[i + 1], vi, vj, e);
            om[i] = r[0] / (L * ci); om[i + 1] = r[1] / (L * cj);
            const pen = D - dx;
            th[i] -= (pen * 0.5) / (L * ci); th[i + 1] += (pen * 0.5) / (L * cj);
            events++; pending.push(vi - vj); any = true;
          }
        }
      }
      if (!any) break;
    }
  }

  function KE(){ let s = 0; for (let i = 0; i < N; i++){ const v = L * om[i]; s += 0.5 * m[i] * v * v; } return s; }
  function PE(){ let u = 0; for (let i = 0; i < N; i++) u += m[i] * G * L * (1 - Math.cos(th[i])); return u; }
  function speed(i){ return Math.abs(L * om[i]); }
  function drain(){ const c = pending; pending = []; return c; }

  return {
    N, m, th, om, pivotX, centerX, lift, step,
    KE, PE, speed, drain, get events(){ return events; },
  };
}
