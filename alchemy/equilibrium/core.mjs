/* ============================================================================
   LE CHATELIER'S VISE — core.mjs   (the SOLE math authority for the bench)

   A reversible reaction  aA + bB ⇌ cC + dD  sealed in a closed vessel of volume
   V (a piston you shove) at temperature T (a flame you raise). It runs BOTH ways
   at once and settles where the forward and back rates exactly cancel — the
   equilibrium. One state variable, the extent ξ, tracks how far the reaction has
   advanced from the loaded mixture:

        n_i(ξ) = n0_i + nu_i·ξ        (nu_i is the SIGNED stoichiometry:
                                        −a,−b for reactants, +c,+d for products)

   The reaction quotient — concentrations c_i = n_i/V raised to their signed nu —
   is

        Q(ξ) = Π (n_i/V)^nu_i

   and equilibrium is the ξ* where Q(ξ*) = K(T), the temperature-dependent constant
   from the van't Hoff relation. Le Chatelier's principle falls straight out of the
   arithmetic: SHOVE the piston (drop V) and the system shifts toward the side with
   FEWER gas molecules (sign of Δn_gas); RAISE the flame and an exothermic reaction
   BACKS OFF (van't Hoff lowers K). A reaction with Δn_gas = 0 (the H₂+I₂⇌2HI
   control) does not move under a squeeze at all — proof the shift is real physics,
   not a cosmetic trick.

   THE REGISTER — float + tolerance, NOT exact BigInt rational. Equilibrium is a
   TRANSCENDENTAL root: ξ* solves a polynomial-of-ratios equation whose root is
   generally irrational and whose K(T) carries exp(). A "fake-exact" rational
   answer here would be a LIE. So this core is honest about its register: it finds
   ξ* by BRACKETED BISECTION (Q is strictly monotone in ξ across the feasible
   window ⇒ exactly one sign change ⇒ unconditional convergence, no Newton seed),
   and every claim is asserted to a public tolerance TOL_SETTLE. That tolerance is
   the contract the bench caption and the landing proof both read — never invent a
   tighter one.

   This module is self-contained (no import) — exactly like its sibling cores.
   index.html INLINES this file byte-identical between the EQUILIBRIUM-CORE
   sentinels; core.test.mjs runs it in Node. If the page's inline ever drifts from
   this file, the page's re-extraction parity check fails.
   ============================================================================ */

// ── the gas constant (J·mol⁻¹·K⁻¹) and the public settle tolerance ──────────────
export const R_GAS = 8.314462618;
export const TOL_SETTLE = 1e-9;        // the public tolerance the caption + landing-proof read

// ── signed stoichiometry from a reaction's coefficients + split point. ──────────
//    rx.coef = [a,b,…,c,d]; rx.split = how many of those are REACTANTS. Reactants
//    get a negative sign (they are consumed as ξ grows), products a positive one.
export function nuOf(rx){
  const out = [];
  for(let i = 0; i < rx.coef.length; i++) out.push(i < rx.split ? -rx.coef[i] : +rx.coef[i]);
  return out;
}

// ── van't Hoff: K(T) = Kref · exp(−ΔH/R · (1/T − 1/Tref)). For an EXOthermic
//    reaction (ΔH<0) raising T LOWERS K; for an ENDOthermic one (ΔH>0) it raises K. ──
export function Keq(rx, T){
  return rx.Kref * Math.exp(-rx.dH / R_GAS * (1 / T - 1 / rx.Tref));
}

// ── the feasible window [lo,hi] of ξ where EVERY species mole n0_i + nu_i·ξ > 0.
//    A reactant (nu<0) bounds ξ from ABOVE (it runs out as ξ grows); a product
//    (nu>0) bounds from BELOW (it would go negative if ξ ran backwards too far). ──
export function feasibleRange(n0, nu){
  let lo = -Infinity, hi = Infinity;
  for(let i = 0; i < nu.length; i++){
    if(nu[i] > 0){ const b = -n0[i] / nu[i]; if(b > lo) lo = b; }   // n_i>0 ⇒ ξ > −n0/nu
    else if(nu[i] < 0){ const b = -n0[i] / nu[i]; if(b < hi) hi = b; }   // n_i>0 ⇒ ξ < −n0/nu
  }
  return [lo, hi];
}

// ── the reaction quotient Q(ξ) = Π (n_i/V)^nu_i. Strictly increasing in ξ across
//    the feasible window: every product factor (nu>0) grows and every reactant
//    factor (in the denominator) shrinks as ξ rises, so Q rises monotonically —
//    from 0 at the lower wall (a product →0) to +∞ at the upper wall (a reactant
//    →0). That single monotone sweep is why bisection converges unconditionally. ──
export function reactionQuotient(n0, nu, xi, V){
  let num = 1, den = 1;
  for(let i = 0; i < nu.length; i++){
    const ni = n0[i] + nu[i] * xi;
    if(ni <= 0){ return nu[i] > 0 ? 0 : Infinity; }   // at/past a wall: product→0 ⇒ Q→0, reactant→0 ⇒ Q→∞
    const conc = ni / V;
    if(nu[i] > 0) num *= Math.pow(conc, nu[i]);
    else if(nu[i] < 0) den *= Math.pow(conc, -nu[i]);
  }
  return num / den;
}

// ── settle(): find ξ* with Q(ξ*) = K by BRACKETED BISECTION on f(ξ) = Q(ξ) − K.
//    Q is strictly monotone across the feasible window, so there is at most one
//    sign change; bisection on that bracket converges unconditionally (no Newton
//    seed, no divergence). If K is outside the reachable range of Q (K below the
//    lower wall's 0⁺ or above the upper wall's ∞⁻), clamp ξ to the nearest wall
//    and flag it. Q is evaluated at the PASSED V, so the returned ξ is the
//    equilibrium AT THAT volume — the squeeze's new V feeds straight in. ──
export function settle(n0, nu, V, K, tol = 1e-12, maxit = 200){
  const [lo, hi] = feasibleRange(n0, nu);
  if(!(hi > lo)) return { ok: false, xi: lo, Q: NaN, clamped: true, iters: 0 };
  const eps = (hi - lo) * 1e-9;
  let a = lo + eps, b = hi - eps;
  const f = x => reactionQuotient(n0, nu, x, V) - K;
  let fa = f(a), fb = f(b);
  // K unreachable: clamp to the nearest feasible wall (Q is monotone ⇒ the sign tells which)
  if(fa > 0) return { ok: true, xi: a, Q: reactionQuotient(n0, nu, a, V), clamped: true, iters: 0 };
  if(fb < 0) return { ok: true, xi: b, Q: reactionQuotient(n0, nu, b, V), clamped: true, iters: 0 };
  let mid = a, it = 0;
  for(; it < maxit; it++){
    mid = 0.5 * (a + b);
    const fm = f(mid);
    if(Math.abs(fm) < tol * Math.max(1, K) || (b - a) < 1e-15 * Math.max(1, Math.abs(mid))) break;
    if((fm > 0) === (fa > 0)){ a = mid; fa = fm; } else { b = mid; fb = fm; }
  }
  return { ok: true, xi: mid, Q: reactionQuotient(n0, nu, mid, V), clamped: false, iters: it };
}

/* ── reSettle(): the ONE call the camera makes per change. Given a reaction, a
   loaded mixture (moles), a volume and a temperature, it derives the signed nu and
   K(T), settles ξ at THIS V, and returns a self-consistent snapshot. PURE — a fresh
   object every call, no shared mutable state, so the camera's settledFrom snapshot
   never aliases. The returned P is computed from the SETTLED moles, so the gas-law
   pressure is consistent with the equilibrium it reports. ── */
export function reSettle(rx, moles, V, T){
  const nu = nuOf(rx);
  const K = Keq(rx, T);
  const s = settle(moles, nu, V, K);
  const newMoles = moles.map((m, i) => m + nu[i] * s.xi);
  const dnGas = nu.reduce((a, x) => a + x, 0);              // Σ nu — the sign that predicts the squeeze
  return {
    xi: s.xi, K, Q: s.Q, moles: newMoles, species: rx.species, nu,
    dnGas,
    V, T,
    P: newMoles.reduce((a, m) => a + m, 0) * R_GAS * T / V   // ideal-gas total pressure (drives the haze)
  };
}

// ── DISPLAY-ONLY marker (parallels the sibling's toNum): the values are already
//    floats; this names where a number is bound for pixels, never for a verdict. ──
export const toNum = x => x;

/* ============================================================================
   THE REACTION LIBRARY — three curated gas-phase equilibria, ONE a load-bearing
   negative control. Each carries van't Hoff data (Kref at Tref, ΔH in J/mol) and a
   per-species band palette. The split point separates reactants from products in
   coef[]; nuOf reads the sign from it, so dnGas is DERIVED, never hardcoded.
     • haber  N₂+3H₂⇌2NH₃   exothermic, Δn_gas = −2 (the headline squeeze)
     • no2    2NO₂⇌N₂O₄     exothermic, Δn_gas = −1 (brown ⇌ clear, a vivid shift)
     • hi     H₂+I₂⇌2HI     Δn_gas =  0  — THE NEGATIVE CONTROL: a squeeze does
                                            nothing, proving the shift is real.
   ============================================================================ */
export const LIBRARY = [
  { id: 'haber', name: 'Haber–Bosch · N₂+3H₂⇌2NH₃', species: ['N₂', 'H₂', 'NH₃'],
    coef: [1, 3, 2], split: 2, Kref: 0.5, Tref: 400, dH: -92000,
    colors: ['#6f9ad6', '#d7e0ea', '#dca74a'] },                       // exothermic, Δn=-2
  { id: 'no2', name: '2NO₂⇌N₂O₄', species: ['NO₂', 'N₂O₄'],
    coef: [2, 1], split: 1, Kref: 8, Tref: 298, dH: -57200,
    colors: ['#b6603a', '#e8ddc8'] },                                  // exothermic, Δn=-1, brown↔clear
  { id: 'hi', name: 'H₂+I₂⇌2HI (Δn=0 control)', species: ['H₂', 'I₂', 'HI'],
    coef: [1, 1, 2], split: 2, Kref: 4, Tref: 700, dH: -9200, negativeControl: true,
    colors: ['#d7e0ea', '#9b59b6', '#c98ad6'] },                       // Δn=0
];
