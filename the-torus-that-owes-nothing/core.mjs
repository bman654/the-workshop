/* ═══════════════════════════════════════════════════════════════════════════
   THE TORUS THAT OWES NOTHING — core.mjs  (Curved Country's 4th hall)

   The SOLE math authority for the hall. Zero-dependency, DOM-free ESM. The page
   inlines the slab between the CORE BEGIN / END sentinels below (forge:include);
   core.test.mjs asserts the inlined slab is byte-identical to this file and runs
   the SAME claims the in-page pill proves. Every painted number AND the
   accountant's dial are driven from here — the 3-D embedding + camera on the page
   are render-only and stay OUT of this proven slab on purpose.

   THE ONE MIRACLE. On a torus
       P(θ,φ) = ((R + r cosθ)cosφ, (R + r cosθ)sinφ, r sinθ)
   the Gaussian curvature and the area element are
       K(θ)  = cosθ / ( r (R + r cosθ) )
       dA    = r (R + r cosθ) dθ dφ
   so the r(R + r cosθ) CANCELS and
       K dA  = cosθ dθ dφ.
   Therefore  ∮∮ K dA = ∫₀^{2π}dφ ∫₀^{2π} cosθ dθ = 2π · 0 = 0  — for EVERY torus,
   any R, r. The outer belt (cosθ>0) contributes +4π; the inner throat (cosθ<0)
   contributes −4π; their sum is 0 = 2π·χ_torus (χ=2−2g=0 for the doughnut). The
   sphere is the neg-control: ∮ K dA = +4π = 2π·χ_sphere (χ=2) ≠ 0.
   ═══════════════════════════════════════════════════════════════════════════ */

// === TORUS CORE BEGIN ===
const TORUS_TAU = 2 * Math.PI;

/* Gaussian curvature of the torus at tube-angle θ (R, r are the two radii). */
function K(theta, R, r) {
  return Math.cos(theta) / (r * (R + r * Math.cos(theta)));
}

/* ∮_φ K dA over ONE θ-ring (the instantaneous band increment the sweep credits).
   = ∫₀^{2π} cosθ dφ = 2π cosθ.  → 0 at the zero-circles θ=±π/2 (the felt beat). */
function bandLedger(theta) {
  return TORUS_TAU * Math.cos(theta);
}

/* The CLOSED-FORM cumulative ledger from the bottom zero-circle θ=−π/2, the sole
   driver of the accountant's dial. L(θ) = ∫_{−π/2}^{θ} 2π cosψ dψ = 2π(sinθ + 1).
   Drift-free by construction: L(−π/2)=0, L(π/2)=+4π (the engraved peak), and
   L(3π/2)=0 again — the pointer lands ON 0 because the closed form returns to 0,
   never by accumulating increments that could drift. */
function ledger(theta) {
  return TORUS_TAU * (Math.sin(theta) + 1);
}

/* 2-D midpoint quadrature of the UN-simplified product K(θ)·r(R+r cosθ) over
   [0,2π]² — deliberately NOT pre-cancelled, so a coding slip in either factor
   cannot hide. Splits the tally by the sign of cosθ (outer belt vs inner throat).
   n is forced a multiple of 4 so θ=±π/2 fall on CELL EDGES (clean split, no
   straddle). Returns { total, outer, inner }. */
function torusTotal(R, r, n = 800) {
  n = Math.max(4, n - (n % 4));
  const dth = TORUS_TAU / n, dph = TORUS_TAU / n;
  let outer = 0, inner = 0;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * dth;
    const c = Math.cos(th);
    let row = 0;
    for (let j = 0; j < n; j++) {
      // K·dA integrand = [cosθ / (r(R+r cosθ))] · [r(R+r cosθ)] — the cancellation,
      // evaluated as the PRODUCT of its two un-simplified factors.
      row += K(th, R, r) * (r * (R + r * c)) * dph;
    }
    row *= dth;
    if (c >= 0) outer += row; else inner += row;
  }
  return { total: outer + inner, outer, inner };
}

/* NEG-CONTROL: ∮ K dA on a sphere of radius a, integrated the same un-simplified
   way — K=1/a², dA=a² sinθ dθ dφ over colatitude θ∈[0,π]. → +4π = 2π·χ_sphere. */
function sphereTotal(a, n = 800) {
  n = Math.max(4, n);
  const dth = Math.PI / n, dph = TORUS_TAU / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const th = (i + 0.5) * dth;
    for (let j = 0; j < n; j++) {
      s += (1 / (a * a)) * (a * a * Math.sin(th)) * dth * dph;
    }
  }
  return s;
}

/* The dial geometry, closed-form from θ_s (the sweep parameter, ranging
   −π/2 → 3π/2 over one pass). Everything the ring-dial needs, all from ledger():
     L        cumulative ∮∮K dA credited so far          (0 → +4π → 0)
     frac     pointer travel 0→1 around the ring         (θ_s mapped linearly)
     phase    'credit' (belt, cosθ_s>0) | 'payback' (throat, cosθ_s<0)
     rate     instantaneous band increment 2π cosθ_s     (→0 at the zero-circles)
     closed   true within tol of the home 0 at pass end  (θ_s≈3π/2)  */
function dialState(thetaS, tol = 1e-6) {
  const L = ledger(thetaS);
  const frac = (thetaS - (-Math.PI / 2)) / TORUS_TAU;      // 0 at start, 1 at 3π/2
  const rate = bandLedger(thetaS);
  const phase = rate >= 0 ? 'credit' : 'payback';
  const atHome = frac >= 1 - 1e-9;
  const closed = atHome && Math.abs(L) < tol;
  return { L, frac, phase, rate, closed };
}

/* The canonical geometry the hall paints with (fat enough to read the throat). */
const TORUS = { R: 1.9, r: 0.72 };
const SWEEP = { start: -Math.PI / 2, end: 3 * Math.PI / 2, span: TORUS_TAU };
// === TORUS CORE END ===

export { K, bandLedger, ledger, torusTotal, sphereTotal, dialState, TORUS, SWEEP };
