// The Glass Wind Tunnel — logic core (lift is a SHAPE you can see).
//
// THE WHOLE POINT: a wing flies because the air over its curved top is forced to go FASTER
// than the air beneath. Faster air is lower pressure (Bernoulli), and that pressure deficit on
// top — suction — is what holds the wing up. In this tunnel you don't read lift off an arrow or
// a curve: you SEE it as a SHAPE. The air enters in ~9 horizontal STREAMTUBES, each the band
// between two streamlines that carry equal mass flux Δψ. Because mass is conserved, in a tube
// width·speed = Δψ = const, so WIDTH ∝ 1/SPEED. Tilt the wing and the tubes over the top
// squeeze THIN (narrow = fast = low pressure = suction) while the tubes beneath fan WIDE; the
// whole stack bulges UP and over the foil. That upward bulge IS the lift, seen directly. The
// brass lift-needle is only its echo.
//
// THE FIELD (exact potential flow, single-sourced here): the foil is the image of a circle
// |ζ|=R under the Joukowski map z = ζ + b²/ζ. In the circle plane the complex potential is
//   w(ζ) = U(ζ e^{-iα} + R² e^{iα}/ζ) − iΓ/(2π)·ln ζ,   ψ = Im w (the stream function),
//   dw/dζ = U(e^{-iα} − R² e^{iα}/ζ²) − iΓ/(2π ζ).
// The circulation Γ is PINNED by the Kutta condition (rear stagnation pinned at the trailing
// edge's pre-image ζ=R): Γ = −4πUR·sinα (lift-up sign). Physical velocity = (dw/dζ)/(dz/dζ),
// with dz/dζ = 1 − b²/ζ²; the division is taken LAST and points inside |ζ|<R are skipped
// (the map's singularity lives there). Streamtubes are traced by RK4 along ψ-contours; because
// equal-Δψ bands carry equal mass flux, a tube's width·speed = Δψ is the soul made provable.
//
// THE LIFT LAW IT PROVES (EXACT, the textbook thin-airfoil result — scoped to ATTACHED flow):
//   With b = R the circle maps to a flat plate of chord c = 4R — the thin-airfoil limit — and
//   Cl = 2·Γ/(U·c) gives EXACTLY Cl = 2π·sinα, with slope dCl/dα = 2π per radian at α=0. This
//   is a hard identity to machine precision, NOT a fit. The page states plainly on-screen that
//   attached flow below α_crit is this exact law, while the STALL above α_crit is a modeled
//   visual regime (a depiction), not a claimed law.
//
// THE LOAD-BEARING NEGATIVE CONTROL: a wing flies ONLY because its sharp trailing edge forces
// the air to circulate (the Kutta condition selects the one Γ with no flow wrapping the edge).
// Drop Kutta — let the rear stagnation point float free to its no-circulation position — and the
// net circulation is identically zero, so Cl ≡ 0 at EVERY α. clNoKutta proves this: a vacuous
// "always lifts" renderer FAILS, because without Kutta there is no lift at all.
//
// SOURCING (anti-drift, enforced by core.test.mjs): index.html inlines this core byte-for-byte
// between the WIND-TUNNEL CORE sentinels; the Node twin byte-parity-checks the inlined copy
// against this file's body so the page can never silently drift from its proof.
//
// Zero-dep ESM. No randomness, no wall-clock — every function is a pure total map on the reals.
// (The stall's dead-air stipple uses a SEEDED PRNG that lives ONLY in index.html, never here.)

// ===== WIND-TUNNEL CORE (byte-identical to core.mjs) =====
"use strict";

// Free-stream speed (1, nondimensional) and the circle radius R. b = R is the flat-plate /
// thin-airfoil limit where the Joukowski image has chord exactly 4R and Cl = 2π·sinα is EXACT.
const U = 1;
const R = 1.3;
const B = R;                 // Joukowski parameter; b = R ⇒ flat plate, chord = 4R, exact thin-airfoil law
const CHORD = 4 * R;         // c = 4R: the chord of the mapped flat plate (single source of the chord)

// The critical angle of attack: below it the flow stays attached (the EXACT regime); above it the
// top tube tears loose into a modeled wake (a depiction, never a claimed law). Default 14°.
const ALPHA_CRIT = 14 * Math.PI / 180;

// ── GUARDS ───────────────────────────────────────────────────────────────────────────────
// Named, throwing guards so a non-physical input is a loud RangeError, never a silent NaN fate.
function guardFinite(x, n){
  if (typeof x !== 'number' || !Number.isFinite(x)){
    throw new RangeError(n + ' must be a finite number; got ' + x);
  }
}
function guardPos(x, n){
  guardFinite(x, n);
  if (x <= 0) throw new RangeError(n + ' must be > 0; got ' + x);
}

// ── COMPLEX ARITHMETIC (tiny, local — a complex number is a [re, im] pair) ──────────────────
function cmul(a, c){ return [a[0]*c[0] - a[1]*c[1], a[0]*c[1] + a[1]*c[0]]; }
function cdiv(a, c){
  const d = c[0]*c[0] + c[1]*c[1];
  return [(a[0]*c[0] + a[1]*c[1]) / d, (a[1]*c[0] - a[0]*c[1]) / d];   // division taken LAST
}
function cabs(z){ return Math.hypot(z[0], z[1]); }
// principal complex log (ψ uses only the imaginary part = the argument)
function clog(z){ return [0.5 * Math.log(z[0]*z[0] + z[1]*z[1]), Math.atan2(z[1], z[0])]; }
// principal complex sqrt (for inverting the Joukowski map)
function csqrt(z){
  const r = Math.hypot(z[0], z[1]);
  const re = Math.sqrt((r + z[0]) / 2);
  let im = Math.sqrt((r - z[0]) / 2);
  if (z[1] < 0) im = -im;
  return [re, im];
}

// ── THE KUTTA CIRCULATION ───────────────────────────────────────────────────────────────────
// kuttaGamma(α): the ONE circulation that pins the rear stagnation point at the trailing edge
// pre-image ζ=R (the Kutta condition). Γ = −4πUR·sinα — negative for α>0, the lift-UP sign.
// This is the SOLE definition of the circulation in the whole codebase.
function kuttaGamma(alpha){
  guardFinite(alpha, 'alpha');
  return -4 * Math.PI * U * R * Math.sin(alpha);
}

// noKuttaGamma(α): THE NEGATIVE CONTROL. With the Kutta condition dropped, the rear stagnation
// point floats free to the symmetric no-circulation solution: Γ ≡ 0 at every α. A wing with no
// enforced circulation produces no lift — this is why Cl ≡ 0 below.
function noKuttaGamma(_alpha){
  return 0;
}

// ── THE LIFT LAW (EXACT, attached regime) ─────────────────────────────────────────────────
// Cl(α) = 2·Γ/(U·c), re-derived from the recovered circulation (NOT hard-typed as 2π·sinα).
// With Γ = −4πUR·sinα and c = 4R this is EXACTLY 2π·sinα (the thin-airfoil law) to machine ε.
function Cl(alpha){
  guardFinite(alpha, 'alpha');
  const gamma = kuttaGamma(alpha);
  return -2 * gamma / (U * CHORD);                 // lift-up: +Cl for α>0 (Γ<0)
}

// clNoKutta(α): THE LOAD-BEARING NEGATIVE CONTROL. Same lift formula, but fed the no-Kutta
// circulation (≡0) ⇒ Cl ≡ 0 at every α. A vacuous always-lift renderer fails this.
function clNoKutta(alpha){
  guardFinite(alpha, 'alpha');
  const gamma = noKuttaGamma(alpha);
  return -2 * gamma / (U * CHORD);                 // ≡ 0
}

// clPostStall(α): the MODELED post-stall lift (a DEPICTION, not a claimed law). Below α_crit it
// is exactly the attached law; crossing α_crit it decays over a smooth shoulder (sin falls and a
// separation penalty grows), so the needle crashes off its peak. The page labels this a modeled
// regime; no self-test asserts it is exact.
function clPostStall(alpha){
  guardFinite(alpha, 'alpha');
  const a = Math.abs(alpha);
  if (a <= ALPHA_CRIT) return Cl(alpha);
  // smooth decay shoulder past the cliff: peak value at α_crit, easing down over ~10°
  const peak = Cl(ALPHA_CRIT);
  const over = a - ALPHA_CRIT;
  const decay = Math.exp(-over / (8 * Math.PI / 180));    // e-folding ~8°
  const post = peak * (0.62 + 0.38 * decay);              // settles toward ~62% of peak
  return Math.sign(alpha) * post;
}

// ── THE FIELD (circle plane) ────────────────────────────────────────────────────────────────
// psi(ζ, α, gammaFn): the stream function ψ = Im w(ζ). Streamlines are ψ = const; the tube
// between two equal-Δψ streamlines carries equal mass flux. gammaFn selects Kutta vs no-Kutta.
function psi(zeta, alpha, gammaFn = kuttaGamma){
  guardFinite(alpha, 'alpha');
  const G = gammaFn(alpha);
  const eia = [Math.cos(alpha), Math.sin(alpha)];
  const eima = [Math.cos(alpha), -Math.sin(alpha)];
  const a1 = cmul(zeta, eima);                          // ζ e^{-iα}
  const a2 = cdiv([R*R*eia[0], R*R*eia[1]], zeta);      // R² e^{iα}/ζ
  let im = U * (a1[1] + a2[1]);
  const lg = clog(zeta);
  const term = cmul([0, -G / (2 * Math.PI)], lg);       // −iΓ/(2π)·ln ζ
  im += term[1];
  return im;
}

// circleVelocity(ζ, α, gammaFn): dw/dζ in the circle plane (a complex number [re, im]).
function circleVelocity(zeta, alpha, gammaFn = kuttaGamma){
  guardFinite(alpha, 'alpha');
  const G = gammaFn(alpha);
  const eia = [Math.cos(alpha), Math.sin(alpha)];
  const eima = [Math.cos(alpha), -Math.sin(alpha)];
  const z2 = cmul(zeta, zeta);
  const t2 = cdiv([R*R*eia[0], R*R*eia[1]], z2);        // R² e^{iα}/ζ²
  let term = [U * (eima[0] - t2[0]), U * (eima[1] - t2[1])];
  const t3 = cdiv([0, -G / (2 * Math.PI)], zeta);       // −iΓ/(2π ζ)
  return [term[0] + t3[0], term[1] + t3[1]];
}

// joukowskiMap(ζ): the physical-plane point z = ζ + b²/ζ.
function joukowskiMap(zeta){
  const t = cdiv([B*B, 0], zeta);
  return [zeta[0] + t[0], zeta[1] + t[1]];
}

// dzdzeta(ζ): the derivative of the map, dz/dζ = 1 − b²/ζ².
function dzdzeta(zeta){
  const z2 = cmul(zeta, zeta);
  const t = cdiv([B*B, 0], z2);
  return [1 - t[0], -t[1]];
}

// physVelocity(ζ, α, gammaFn): the PHYSICAL-plane velocity (u, v) at the point z=joukowskiMap(ζ).
// = conj( (dw/dζ) / (dz/dζ) ). Division taken LAST. Returns null inside |ζ|<R (inside the foil).
function physVelocity(zeta, alpha, gammaFn = kuttaGamma){
  if (cabs(zeta) < R - 1e-9) return null;              // inside the mapped circle — no flow there
  const q = cdiv(circleVelocity(zeta, alpha, gammaFn), dzdzeta(zeta));
  return [q[0], -q[1]];                                // conjugate ⇒ (u, v)
}

// invJoukowski(z): the |ζ|≥R pre-image of a physical point z (the outer branch of ζ = (z±√(z²−4b²))/2).
function invJoukowski(z){
  const z2 = cmul(z, z);
  const disc = csqrt([z2[0] - 4*B*B, z2[1]]);
  const za = [(z[0] + disc[0]) / 2, (z[1] + disc[1]) / 2];
  const zb = [(z[0] - disc[0]) / 2, (z[1] - disc[1]) / 2];
  return cabs(za) >= cabs(zb) ? za : zb;
}

// speed(z, α, gammaFn): the physical flow speed |v| at physical point z (via the pre-image).
function speed(z, alpha, gammaFn = kuttaGamma){
  const v = physVelocity(invJoukowski(z), alpha, gammaFn);
  return v === null ? 0 : Math.hypot(v[0], v[1]);
}

// Cp(z, α, gammaFn): the pressure coefficient Cp = 1 − (|v|/U)². Cp<0 is suction (the ribbon runs
// ember-hot), Cp>0 is stagnation/over-pressure (cool blue). The renderer colours each ribbon by Cp.
function Cp(z, alpha, gammaFn = kuttaGamma){
  const s = speed(z, alpha, gammaFn);
  const r = s / U;
  return 1 - r * r;
}

// ── TRACE A STREAMTUBE ──────────────────────────────────────────────────────────────────────
// traceTube(yStart, alpha, opts): RK4-trace one streamline from the left inlet (x = x0, y = yStart)
// left→right through the physical field. Returns {pts:[[x,y]…], psi0} — the ψ it rides (≈const).
// The renderer fills the band between adjacent traces as one ribbon. gammaFn selects the regime.
function traceTube(yStart, alpha, opts = {}){
  guardFinite(yStart, 'yStart'); guardFinite(alpha, 'alpha');
  const x0 = opts.x0 != null ? opts.x0 : -6;
  const x1 = opts.x1 != null ? opts.x1 : 6;
  const h  = opts.h  != null ? opts.h  : 0.04;
  const maxSteps = opts.maxSteps != null ? opts.maxSteps : 4000;
  const gammaFn = opts.gammaFn || kuttaGamma;
  const f = (z) => physVelocity(invJoukowski(z), alpha, gammaFn);
  let z = [x0, yStart];
  const pts = [z.slice()];
  const psi0 = psi(invJoukowski(z), alpha, gammaFn);
  for (let i = 0; i < maxSteps && z[0] < x1; i++){
    const k1 = f(z); if (!k1) break;
    const za = [z[0] + h/2*k1[0], z[1] + h/2*k1[1]]; const k2 = f(za); if (!k2) break;
    const zb = [z[0] + h/2*k2[0], z[1] + h/2*k2[1]]; const k3 = f(zb); if (!k3) break;
    const zc = [z[0] + h*k3[0],   z[1] + h*k3[1]];   const k4 = f(zc); if (!k4) break;
    z = [z[0] + h/6*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0]),
         z[1] + h/6*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])];
    pts.push(z.slice());
  }
  return { pts, psi0 };
}

// ── THE SELF-TEST — the tunnel proves its own (attached-regime) claim ────────────────────────
// LEG A: Cl(α) === 2π·sinα to ε across α∈{−10,−5,0,3,7,11,13}°, Cl re-derived as 2Γ/(Uc) NOT
//        hard-typed; and the slope dCl/dα → 2π/rad at α=0.
// LEG B (LOAD-BEARING NEG-CONTROL): clNoKutta ≡ 0 at every α, AND |Cl−clNoKutta|@11° ≥ 2π·sin3°
//        — lift exists ONLY because Kutta forces circulation; a vacuous always-lift renderer fails.
// LEG C (continuity / width·speed): along a traced tube ψ is conserved, and for a thin tube
//        width·speed → Δψ as the tube narrows; an explicit constant-width fake VIOLATES it.
// LEG D (sign / symmetry): Cl(0)===0, Cl(−α)===−Cl(α) to the bit, recovered Γ<0 for α>0 (lift up),
//        and at α>0 the top of the foil runs faster than the bottom (top suction, Cp_top<0).
// LEG E (structural neg-control): the ATTACHED field is divergence-free at a ring of probes
//        (net flux≈0); the no-Kutta field is ALSO div-free (potential), but the two carry
//        DIFFERENT circulation — ∮v·dl around the foil is −Γ for Kutta and 0 for no-Kutta — so
//        they are genuinely different flows, not a relabel. (Asserts NOTHING about the stall.)
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const D = (deg) => deg * Math.PI / 180;

  // ── LEG A — Cl === 2π·sinα exact, and the 2π/rad slope ──
  {
    const degs = [-10, -5, 0, 3, 7, 11, 13];
    let worst = 0;
    for (const d of degs){
      const a = D(d);
      const err = Math.abs(Cl(a) - 2 * Math.PI * Math.sin(a));
      if (err > worst) worst = err;
    }
    const hh = 1e-6;
    const slope = (Cl(hh) - Cl(-hh)) / (2 * hh);
    const slopeOk = Math.abs(slope - 2 * Math.PI) < 1e-6;
    log('A · Cl(α) = 2π·sinα to <1e-12 across −10…13° (re-derived 2Γ/Uc), slope dCl/dα → 2π/rad',
        worst < 1e-12 && slopeOk,
        'worst |Cl−2π·sinα| = ' + worst.toExponential(2) + ' · slope@0 = ' + slope.toFixed(6) + ' (2π=' + (2*Math.PI).toFixed(6) + ')');
  }

  // ── LEG B — drop Kutta and ALL lift vanishes (load-bearing) ──
  {
    const degs = [-13, -7, 0, 3, 7, 11, 13];
    let allZero = true;
    for (const d of degs){ if (clNoKutta(D(d)) !== 0) allZero = false; }
    const gap = Math.abs(Cl(D(11)) - clNoKutta(D(11)));
    const thresh = 2 * Math.PI * Math.sin(D(3));
    log('B · NEG-CONTROL: clNoKutta ≡ 0 at every α, and |Cl−clNoKutta|@11° ≥ 2π·sin3° (lift needs Kutta)',
        allZero && gap >= thresh,
        'no-Kutta lift is identically 0 · gap@11° = ' + gap.toFixed(4) + ' ≥ ' + thresh.toFixed(4));
  }

  // ── LEG C — continuity: ψ conserved along a tube; width·speed → Δψ; a fake violates it ──
  {
    const a = D(8);
    // two close streamlines above the foil; ψ should hold along each, and width·speed ≈ Δψ.
    const t1 = traceTube(0.55, a, { x0: -6, x1: 4, h: 0.01, maxSteps: 4000 });
    const t2 = traceTube(0.60, a, { x0: -6, x1: 4, h: 0.01, maxSteps: 4000 });
    const driftOf = (t) => {
      let mn = Infinity, mx = -Infinity;
      for (const p of t.pts){ const v = psi(invJoukowski(p), a); if (v < mn) mn = v; if (v > mx) mx = v; }
      return mx - mn;
    };
    const drift1 = driftOf(t1), drift2 = driftOf(t2);
    const dpsi = Math.abs(t2.psi0 - t1.psi0);
    // sample width·speed at a few x-stations. The EXACT relation is dψ = speed·dn, where dn is the
    // PERPENDICULAR spacing (ψ is the flux function, |∇ψ| = speed, dn ⟂ flow), so we project the
    // tube-2 point onto tube-1's local flow-normal to get the true perpendicular width.
    const nearX = (t, xt) => { let best = t.pts[0], bd = Infinity; for (const p of t.pts){ const dd = Math.abs(p[0]-xt); if (dd < bd){ bd = dd; best = p; } } return best; };
    let worstRel = 0;
    for (const xt of [-3, -1, 0, 1, 3]){
      const p = nearX(t1, xt), q = nearX(t2, xt);
      const v = physVelocity(invJoukowski(p), a); if (!v) continue;
      const sp = Math.hypot(v[0], v[1]);
      const nx = -v[1] / sp, ny = v[0] / sp;                 // unit normal to the flow at p
      const width = Math.abs((q[0]-p[0]) * nx + (q[1]-p[1]) * ny);   // perpendicular spacing dn
      const ws = width * sp;
      const rel = Math.abs(ws - dpsi) / dpsi;
      if (rel > worstRel) worstRel = rel;
    }
    // explicit constant-width FAKE: a band of fixed width across a varying-speed region must
    // violate width·speed = const (speed changes, width pinned ⇒ product changes).
    const FAKEW = 0.1;
    const wsFakeA = FAKEW * speed([-3, 0.6], a);
    const wsFakeB = FAKEW * speed([0.0, 0.6], a);
    const fakeViolates = Math.abs(wsFakeA - wsFakeB) > 1e-3;
    log('C · continuity: ψ holds along each tube (<1e-4), perpendicular width·speed = Δψ (<1%); a constant-width fake VIOLATES it',
        drift1 < 1e-4 && drift2 < 1e-4 && worstRel < 0.01 && fakeViolates,
        'ψ-drift ' + drift1.toExponential(1) + '/' + drift2.toExponential(1) + ' · worst width·speed rel-err ' + (worstRel*100).toFixed(2) + '% · fake Δ ' + Math.abs(wsFakeA-wsFakeB).toFixed(4));
  }

  // ── LEG D — sign & symmetry guards ──
  {
    const zeroOk = Cl(0) === 0;
    let antisym = true;
    for (const d of [3, 7, 11, 13]){ if (Cl(D(d)) !== -Cl(D(-d))) antisym = false; }
    const gammaUp = kuttaGamma(D(7)) < 0;                 // Γ<0 for α>0 (lift up)
    // top of the foil faster than the bottom at α>0 (top suction): sample physical points just
    // above and below the mid-chord (z ≈ 0 ± small y on the foil surface, x near 0)
    const a = D(8);
    const topSpeed = speed([0, 0.18], a);
    const botSpeed = speed([0, -0.18], a);
    const topFaster = topSpeed > botSpeed;
    const cpTop = Cp([0, 0.18], a);
    log('D · sign/symmetry: Cl(0)=0, Cl(−α)=−Cl(α) to the bit, Γ<0 for α>0, top faster than bottom (Cp_top<0)',
        zeroOk && antisym && gammaUp && topFaster && cpTop < 0,
        'top |v| ' + topSpeed.toFixed(3) + ' > bot ' + botSpeed.toFixed(3) + ' · Cp_top = ' + cpTop.toFixed(3));
  }

  // ── LEG E — divergence-free attached field; Kutta vs no-Kutta carry different circulation ──
  {
    const a = D(8);
    // net outward flux through a small loop in the FLOW (above the foil) ≈ 0 (incompressible)
    const fluxAround = (gammaFn) => {
      const cx = 1.6, cy = 1.4, rad = 0.05, n = 720;
      let flux = 0;
      for (let i = 0; i < n; i++){
        const th = 2 * Math.PI * i / n;
        const z = [cx + rad * Math.cos(th), cy + rad * Math.sin(th)];
        const v = physVelocity(invJoukowski(z), a, gammaFn);
        if (!v) return Infinity;
        flux += (v[0] * Math.cos(th) + v[1] * Math.sin(th)) * (2 * Math.PI * rad / n);
      }
      return flux;
    };
    const fK = Math.abs(fluxAround(kuttaGamma));
    const fN = Math.abs(fluxAround(noKuttaGamma));
    // circulation around the foil: ∮ v·dl on a big loop = −Γ (Kutta) vs 0 (no-Kutta).
    const circAround = (gammaFn) => {
      const cx = 0, cy = 0, rad = 3.0, n = 1440;
      let circ = 0;
      for (let i = 0; i < n; i++){
        const th = 2 * Math.PI * i / n;
        const z = [cx + rad * Math.cos(th), cy + rad * Math.sin(th)];
        const v = physVelocity(invJoukowski(z), a, gammaFn);
        if (!v) return NaN;
        // tangent dl = rad·(−sinθ, cosθ)·dθ
        circ += (v[0] * (-Math.sin(th)) + v[1] * Math.cos(th)) * (rad * 2 * Math.PI / n);
      }
      return circ;
    };
    const circK = circAround(kuttaGamma);
    const circN = circAround(noKuttaGamma);
    const expected = -kuttaGamma(a);                       // ∮v·dl = +Γ_phys; Γ_phys = kuttaGamma (signed)
    const divFree = fK < 1e-6 && fN < 1e-6;
    const circOk = Math.abs(circK - kuttaGamma(a)) < 5e-3 && Math.abs(circN) < 5e-3 && Math.abs(circK - circN) > 1;
    log('E · NEG-CONTROL: both fields divergence-free (flux≈0), but Kutta carries Γ≠0 while no-Kutta carries 0 (different flows)',
        divFree && circOk,
        'flux K/N ' + fK.toExponential(1) + '/' + fN.toExponential(1) + ' · ∮v·dl K=' + circK.toFixed(3) + ' (Γ=' + kuttaGamma(a).toFixed(3) + ') N=' + circN.toFixed(3));
  }

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END WIND-TUNNEL CORE =====

export {
  U, R, B, CHORD, ALPHA_CRIT,
  cmul, cdiv, cabs, clog, csqrt,
  kuttaGamma, noKuttaGamma, Cl, clNoKutta, clPostStall,
  psi, circleVelocity, joukowskiMap, dzdzeta, physVelocity, invJoukowski,
  speed, Cp, traceTube,
  guardFinite, guardPos,
  runSelfTest,
};
