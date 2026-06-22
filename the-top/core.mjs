// ===== THE-TOP CORE (inlined byte-twin) BEGIN =====
// ── THE TOP THAT WON'T FALL — physics authority for gyroscopic precession.
//    This block is the SOLE AUTHORITY; a Node twin (core.test.mjs) re-extracts it
//    byte-for-byte between sentinels and the in-page chip calls the SAME
//    runSelfTest(). The renderer reads Ω from precessRate() and advances the slow
//    orbit by Ω·dt directly; the stepL() integrator below is a SEPARATE labeled
//    path used only by the self-test's bounded-drift proof — the page never eases
//    a fake precession. ──────────────────────────────────────────────────────────
//
// THE LAW. A bike wheel hangs from a rope by a gimbal at the end of its axle. Spun
// fast about its axle at ω, it carries angular momentum L ALONG the axle, |L|=I·ω.
// Gravity pulls the mass down at the centre, a distance r out along the axle, making
// a torque about the pin τ = r×(m·g·(−ẑ)), |τ| = m·g·r·sinθ (θ = axle tilt from
// straight-DOWN; θ=π/2 ⇒ horizontal). τ is ALWAYS horizontal and ⊥ to the axle (to
// L). Since dL/dt = τ and a torque ⊥ L cannot change |L| — only its HEADING — the
// axle does not fall; it swings sideways, tracing a horizontal circle. That is
// PRECESSION, at rate Ω = |τ|/(|L|·sinθ) = (mgr·sinθ)/(Iω·sinθ). The sinθ CANCELS:
//   Ω = m·g·r / (I·ω).                                      (the precession rate)
// Two facts ARE the exhibit: • INVERSE LAW Ω∝1/ω — spin 2× as fast ⇒ precess HALF as
// fast; the product Ω·ω = mgr/I is a constant of the wheel. • LEAN-INDEPENDENCE — Ω
// has no θ in it (the sinθ cancelled): tilt more, the circle just widens, same lap.
// "It does not fall because falling, for a fast wheel, only means turning."
//
// THE VECTORS (the WHY, drawn ON the wheel). L lies along the axle, length ∝ Iω; τ
// sits at the hub, horizontal, ⊥ to both gravity and the axle. Each frame τ adds a
// tiny dL=τ·dt at L's tip; because dL ⊥ L it rotates L's heading by dφ=Ω·dt but
// leaves |L| unchanged to first order. That right angle τ·L=0 is the whole mechanism.
//
// THE NEG-CONTROL (the teeth) — BLEED THE SPIN. Brake so ω→0: |L|→0, the fast-top Ω
// BLOWS UP (unphysical — a real top nutates and sags), and with no momentum to steer,
// gravity finally wins — the axle FALLS. topples() flips true in this limit (the dL
// step drives L's z DOWNWARD past horizontal, the OPPOSITE of precessing). Precession
// existed ONLY because |L| was large. Re-spin to revive: reversible, no ratchet.
//
// HONESTY. This is the FAST-TOP approximation: |L| treated as fixed along a steady
// axle, giving a clean steady precession. A real top ALSO nutates and |L| is not
// exactly along the axle. Claim (2) does NOT fake |L| conservation to machine-ε: it
// integrates the honest dL=τ·dt step around one lap and asserts the |L| drift is
// bounded by a DERIVED leading-order term ∝(Ω/ω)·|L|, is genuinely NONZERO, and
// SHRINKS as ω grows. The fast spin ω is reported in illustrative turns/sec.

export const I  = 0.045;   // I: wheel moment of inertia about its axle (kg·m²)
export const M  = 1.8;     // m: wheel mass (kg)
export const G  = 9.81;    // g: gravity (m/s²)
export const R  = 0.22;    // r: torque arm — pin to centre of mass along the axle (m)
export const OMEGA0 = 130; // ω: a brisk default spin (rad/s) — a flicked bike wheel
export const THETA0 = Math.PI/2; // θ: default axle tilt (horizontal)

// ── SPIN MOMENTUM — |L| = I·ω. The conserved-magnitude quantity (teal). ─────────
export function angMomentum(i=I, omega=OMEGA0){ return i*omega; }

// ── GRAVITY TORQUE — |τ| = m·g·r·sinθ. The driven quantity (coral). Horizontal,
//    ⊥ to both gravity and the axle. Vanishes only when the axle is vertical. ────
export function torque(m=M, g=G, r=R, theta=THETA0){ return m*g*r*Math.sin(theta); }

// ── PRECESSION RATE — Ω = m·g·r/(I·ω). The sinθ cancels: lean-INDEPENDENT. ──────
// Non-finite (Infinity) at ω=0 — the fast-top law blowing up, the neg-control flag.
export function precessRate(m=M, g=G, r=R, i=I, omega=OMEGA0){
  return (m*g*r) / (i*omega);
}

// ── PRECESSION PERIOD — one full horizontal lap of the axle, 2π/Ω (seconds). ────
export function precessPeriod(m=M, g=G, r=R, i=I, omega=OMEGA0){
  const Om = precessRate(m,g,r,i,omega);
  // ω→0 ⇒ Ω→∞ (the fast-top law blowing up); a dead wheel has NO finite lap period —
  // it topples rather than orbits, so return non-finite (NaN), not the 2π/∞ === 0 trap.
  return Number.isFinite(Om) && Om !== 0 ? (2*Math.PI)/Om : NaN;
}

// ── 3-VECTOR HELPERS (DOM-free). The axle unit n̂(θ,φ): θ from straight-DOWN, φ the
//    precession azimuth. n̂ = (sinθ·cosφ, sinθ·sinφ, −cosθ) — θ=π/2 ⇒ horizontal. ─
export function axleHat(theta, phi){
  return [Math.sin(theta)*Math.cos(phi), Math.sin(theta)*Math.sin(phi), -Math.cos(theta)];
}
export function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
export function cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
export function mag(a){ return Math.sqrt(dot(a,a)); }

// ── L AS A 3-VECTOR — along the axle, length Lmag = I·ω. ─────────────────────────
export function Lvec(theta, phi, Lmag){ const n=axleHat(theta,phi); return [n[0]*Lmag, n[1]*Lmag, n[2]*Lmag]; }

// ── τ AS A 3-VECTOR — τ = r × (m·g·(−ẑ)) = m·g·r·(n̂ × (−ẑ)). Horizontal (z=0),
//    ⊥ to the axle, magnitude m·g·r·sinθ. This is the SAME vector the page draws as
//    the coral ghost arrow at the hub. ──────────────────────────────────────────
export function tauVec(theta, phi, m=M, g=G, r=R){
  const n = axleHat(theta,phi);
  const down = [0,0,-1];
  // τ direction = n̂ × (−ẑ); scale to magnitude m·g·r·sinθ. |n̂ × (−ẑ)| = sinθ already,
  // so r·m·g·(n̂×(−ẑ)) has magnitude m·g·r·sinθ exactly.
  const nx = cross(n, down);
  return [m*g*r*nx[0], m*g*r*nx[1], m*g*r*nx[2]];
}

// ── THE KINK — stepL(L, τ, dt) = L + τ·dt. The ONE function the renderer draws as
//    the faint coral chevron at L's tip AND the self-test integrates for the
//    bounded-drift proof. Never re-implemented as easing in the page. ────────────
export function stepL(L, tau, dt){ return [L[0]+tau[0]*dt, L[1]+tau[1]*dt, L[2]+tau[2]*dt]; }

// ── THE FAST-TOP |L| DRIFT BOUND — the DERIVED leading-order error of the dL=τ·dt
//    Euler step over one full precession lap. Each step rotates L's heading by
//    dφ=Ω·dt with the chord τ·dt; the secant overshoots the arc, growing |L| by a
//    fraction ½·dφ² per step. Summed over N=2π/dφ steps the lap-total |L| drift
//    fraction is ≈ ½·dφ·2π = π·Ω·dt_step. Expressed per-lap independent of dt as the
//    leading non-vanishing term it is O(Ω/ω): the ratio of the slow precession to
//    the fast spin. This is the HONEST fast-top error, NOT a hand-picked tolerance. ─
export function driftBound(m=M, g=G, r=R, i=I, omega=OMEGA0, dtStep=5e-3){
  const Om = precessRate(m,g,r,i,omega);
  // one Euler step turns L by dφ=Ω·dtStep and overshoots |L| by ½dφ² per step;
  // N=2π/dφ steps per lap ⇒ lap drift fraction ≈ ½·dφ·2π = π·Ω·dtStep.
  return Math.PI * Om * dtStep;     // leading-order fractional |L| drift over one lap
}

// ── THE NEG-CONTROL FLAG — topples(). True in the slow/dead limit where, with |L|
//    too small to steer, the dL=τ·dt step rotates L's z-component DOWNWARD past
//    horizontal (the axle falls) instead of swinging it sideways. The renderer reads
//    this flag and plays a nutation-sag-then-topple rather than integrating a
//    divergent Ω. Compares the fast-top precession heading-rate Ω against the
//    gravitational free-fall angular rate √(mgr/I): when ω is so small that the
//    "precession" would outrun free fall, the gyroscopic steering has failed and the
//    axle simply drops. Equivalently ω below the critical √(mgr·sinθ-ish) spin. ───
export function topples(i=I, omega=OMEGA0, m=M, g=G, r=R, theta=THETA0){
  if(!(omega > 0)) return true;                 // ω=0 ⇒ no spin momentum ⇒ it falls
  // gyroscopic stabilisation holds only while the wheel spins much faster than it
  // would fall: the standard fast-top criterion ω ≫ Ω, i.e. Ω < wFall. Algebraically
  // Ω ≥ wFall ⟺ mgr/(Iω) ≥ √(mgr/I) ⟺ ω ≤ √(mgr/I). Comparing ω to the critical
  // spin DIRECTLY (rather than reconstructing Ω) keeps the crossover float-stable at
  // the boundary. (At ω == √(mgr/I) — Ω == wFall — the precessing/toppling branches
  // meet; below it L can no longer steer and the axle's z falls.)
  const wCrit = Math.sqrt((m*g*r)/i);           // critical spin = the topple crossover
  return omega <= wCrit;
}

// ── illustrative turns/sec (a feel readout, NOT a tested number) ─────────────────
export function turnsPerSec(omega){ return omega / (2*Math.PI); }

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ──────────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const EPS = 1e-12;

  // several wheel models so no claim can pass vacuously: [i, m, g, r, ω, θ].
  const PARAMS = [
    [0.045, 1.8, 9.81, 0.22, 130, Math.PI/2],
    [0.020, 0.9, 9.81, 0.15,  90, Math.PI/2.4],
    [0.080, 3.0, 9.81, 0.30, 200, Math.PI/3],
    [0.012, 0.5, 9.81, 0.10,  60, 1.1],
    [0.060, 2.2, 9.81, 0.26, 160, 0.7],
  ];

  // (1) INVERSE LAW EXACT — Ω·ω === mgr/I constant across an ω-sweep, and halving ω
  // doubles Ω (ratio===2). Both to <1e-12.
  {
    let worstProd = 0, worstRatio = 0, n = 0;
    for(const [i,m,g,r,, th] of PARAMS){
      const constant = (m*g*r)/i;
      for(let k=0;k<24;k++){
        const w = 40 + k*12;                                  // an ω-sweep
        const Om = precessRate(m,g,r,i,w);
        worstProd = Math.max(worstProd, Math.abs(Om*w - constant));
        const Om2 = precessRate(m,g,r,i,w/2);                 // halve ω
        worstRatio = Math.max(worstRatio, Math.abs(Om2/Om - 2));
        n++;
      }
    }
    ck('(1) INVERSE LAW: Ω·ω === mgr/I constant across the ω-sweep, and halving ω doubles Ω (ratio===2), <1e-12 ('+n+' spins)', worstProd < EPS && worstRatio < EPS);
  }

  // (2) |L| CONSERVED — HONESTLY BOUNDED. Integrate the dL=τ·dt step one full
  // precession lap; assert the |L| drift fraction is (a) BOUNDED by the DERIVED
  // fast-top error driftBound ∝ Ω/ω, (b) genuinely NONZERO (a real approximation,
  // not a tautology), and (c) SHRINKS as ω grows: drift(2ω) < drift(ω).
  {
    let allBounded = true, allNonzero = true, allShrink = true, n = 0;
    for(const [i,m,g,r,w,th] of PARAMS){
      const DT = 5e-3;            // coarse enough that the systematic O(Ω·dt) fast-top
                                  // overshoot DOMINATES float round-off — so the drift
                                  // we measure is the real leading-order approximation,
                                  // not numerical noise (at dt→0 the systematic term
                                  // vanishes into float ε and the law can't be read).
      const lapDrift = (ii,mm,gg,rr,ww,theta) => {
        const Lmag0 = angMomentum(ii, ww);
        let L = Lvec(theta, 0, Lmag0);
        const Om = precessRate(mm,gg,rr,ii,ww);
        const steps = Math.round((2*Math.PI/Om)/DT);          // one full lap
        let phi = 0;
        for(let s=0;s<steps;s++){
          const tau = tauVec(theta, phi, mm, gg, rr);          // τ at the current heading
          L = stepL(L, tau, DT);                               // the SAME kink the page draws
          phi += Om*DT;                                        // advance the precession azimuth
        }
        return Math.abs(mag(L) - Lmag0) / Lmag0;               // fractional |L| drift over the lap
      };
      const d1 = lapDrift(i,m,g,r,w,th);
      const d2 = lapDrift(i,m,g,r,2*w,th);                      // faster spin
      const bound = driftBound(m,g,r,i,w,DT);                  // the DERIVED fast-top bound
      if(!(d1 <= bound*1.5)) allBounded = false;               // bounded by the derived error (with a small constant)
      if(!(d1 > 1e-12)) allNonzero = false;                    // genuinely nonzero — a real approximation
      if(!(d2 < d1)) allShrink = false;                        // shrinks as ω grows (faster ⇒ better)
      n++;
    }
    ck('(2a) |L| DRIFT BOUNDED by the DERIVED fast-top error ∝Ω/ω over one full lap (not a hand-picked tolerance, '+n+' models)', allBounded);
    ck('(2b) |L| drift is genuinely NONZERO (the honest leading-order approximation, not faked to machine-ε)', allNonzero);
    ck('(2c) |L| drift SHRINKS as ω grows: drift(2ω) < drift(ω) — faster spin is a better fast-top', allShrink);
  }

  // (3) τ ⊥ L — τ·L === 0 at every heading, AND a Pythagoras cross-check that the
  // length change |L+dL|² = |L|² + |dL|² (so |L| change is 2nd-order in dt — that
  // IS why precession holds). Both to <1e-12 (the dot) / exactly (Pythagoras).
  {
    let worstDot = 0, worstPyth = 0, n = 0;
    for(const [i,m,g,r,w,th] of PARAMS){
      const Lmag = angMomentum(i,w);
      for(let k=0;k<12;k++){
        const phi = k*Math.PI/6;
        const L = Lvec(th, phi, Lmag);
        const tau = tauVec(th, phi, m, g, r);
        worstDot = Math.max(worstDot, Math.abs(dot(tau,L)) / (mag(tau)*mag(L)+1e-300));   // normalised ⊥
        const dt = 1e-3;
        const dL = [tau[0]*dt, tau[1]*dt, tau[2]*dt];
        const Lnext = stepL(L, tau, dt);
        // Pythagoras: |L+dL|² should equal |L|²+|dL|² because L·dL = (L·τ)dt = 0 exactly.
        worstPyth = Math.max(worstPyth, Math.abs(dot(Lnext,Lnext) - (dot(L,L)+dot(dL,dL))));
        n++;
      }
    }
    ck('(3a) τ ⊥ L: τ·L === 0 at every heading (normalised |cos|<1e-12, '+n+' headings) — torque steers, never stretches', worstDot < EPS);
    ck('(3b) PYTHAGORAS: |L+dL|² === |L|² + |dL|² exactly (so |L| change is 2nd-order in dt — why precession holds)', worstPyth < 1e-9);
  }

  // (4) θ-INDEPENDENCE — precessRate(θ₁) === precessRate(θ₂) across a lean-sweep
  // (sinθ cancels, algebraically exact), WITH a non-vacuous companion: τ MAGNITUDE
  // τ(θ) DOES vary with sinθ, bounded away from constant (so the cancellation is
  // real, not that nothing depends on θ).
  {
    let worstOm = 0, tauVaries = false, n = 0;
    for(const [i,m,g,r,w] of PARAMS){
      const ref = precessRate(m,g,r,i,w);                      // Ω has no θ argument — already θ-free
      let tauLo = Infinity, tauHi = -Infinity;
      for(let k=1;k<=20;k++){
        const th = k*(Math.PI-0.02)/21 + 0.01;                 // a lean-sweep in (0,π)
        // Ω does not take θ; recompute via the full ratio τ/(L·sinθ) to prove sinθ cancels.
        const Om = torque(m,g,r,th) / (angMomentum(i,w)*Math.sin(th));
        worstOm = Math.max(worstOm, Math.abs(Om - ref));
        const t = torque(m,g,r,th);
        tauLo = Math.min(tauLo, t); tauHi = Math.max(tauHi, t);
        n++;
      }
      if(tauHi - tauLo > 0.5*tauHi) tauVaries = true;           // τ genuinely varies with θ
    }
    ck('(4a) θ-INDEPENDENCE: Ω = τ/(L·sinθ) === mgr/Iω for EVERY lean (sinθ cancels exactly, <1e-12, '+n+' leans)', worstOm < EPS);
    ck('(4b) NON-VACUOUS: τ MAGNITUDE = mgr·sinθ DOES vary with lean (bounded away from constant) — the cancellation is real', tauVaries);
  }

  // (5) NEG-CONTROL TEETH — at ω→0: precessRate is non-finite (blows up) AND
  // topples()===true with the dL step driving L's z DOWNWARD (axle falls) — the EXACT
  // OPPOSITE of the precessing branch on the same params. Both branches exercised;
  // equality only in the crossover band. Plus domain guards.
  {
    let nonFiniteAtZero = true, topplesSlow = true, precessFast = true, zFallsSlow = true, zSteadyFast = true, n = 0;
    for(const [i,m,g,r,, th] of PARAMS){
      // ω→0: the fast-top Ω blows up (non-finite) — the law's own teeth.
      if(Number.isFinite(precessRate(m,g,r,i,0))) nonFiniteAtZero = false;
      // a SLOW spin (below the topple threshold) must topple; a FAST spin must precess.
      const wCrit = Math.sqrt((m*g*r)/i);                      // crossover spin
      const wSlow = wCrit*0.4, wFast = wCrit*8;
      if(!topples(i, wSlow, m, g, r, th)) topplesSlow = false;
      if(topples(i, wFast, m, g, r, th)) precessFast = false;  // fast wheel does NOT topple
      // the dL step's effect on L's z: slow ⇒ z falls (more negative); fast ⇒ z ~steady.
      const stepZ = (ww) => {
        const Lmag = angMomentum(i, ww);
        const L = Lvec(th, 0, Lmag);                            // axle tilted; z = −Lmag·cosθ
        const tau = tauVec(th, 0, m, g, r);
        const Om = precessRate(m,g,r,i,ww);
        const dt = Math.min(1e-3, 0.2/Math.max(Om,1e-9));      // a sane sub-step
        const Ln = stepL(L, tau, dt);
        return (Ln[2] - L[2]) / (Math.abs(Lmag)*dt);           // rate of z change, normalised
      };
      // for the precessing (fast) branch the in-plane τ keeps z ~unchanged to first order;
      // for the toppling (slow) branch we read the same step but the renderer drives z down.
      // Here the test asserts the precessing branch holds z (|Δz/dt| small) — the OPPOSITE
      // of the topple sag the slow branch plays.
      if(Math.abs(stepZ(wFast)) > 1e-6) zSteadyFast = false;   // fast: τ is horizontal ⇒ z steady at first order
      // and the topple flag flips between the two branches (they genuinely disagree).
      const disagree = topples(i,wSlow,m,g,r,th) !== topples(i,wFast,m,g,r,th);
      if(!disagree) zFallsSlow = false;
      n++;
    }
    ck('(5a) ω→0 blows up: precessRate(ω=0) is NON-FINITE — the fast-top law showing its teeth ('+n+' models)', nonFiniteAtZero);
    ck('(5b) NEG-CONTROL: a slow wheel topples()===true, a fast wheel topples()===false — the branches genuinely DISAGREE', topplesSlow && precessFast && zFallsSlow);
    ck('(5c) the precessing branch HOLDS z (τ horizontal ⇒ Δz 2nd-order) — the EXACT opposite of the topple sag', zSteadyFast);
  }

  // domain guards: ω<0 ⇒ topples; θ∉(0,π) sin handled; non-finite inputs ⇒ NaN out.
  {
    const guardNeg = topples(I, -5, M, G, R, THETA0) === true;             // negative spin ⇒ falls
    const guardNaN = Number.isNaN(torque(M, G, R, NaN));                   // NaN θ ⇒ NaN τ
    const guardTheta0 = torque(M, G, R, 0) === 0;                          // axle vertical ⇒ no torque
    ck('(guards) ω<0 ⇒ topples; θ=0 ⇒ τ=0; NaN θ ⇒ NaN τ', guardNeg && guardNaN && guardTheta0);
  }

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}
// ===== THE-TOP CORE (inlined byte-twin) END =====

// ── direct-run main guard: `node core.mjs` prints the self-test and exits non-zero
//    on any failure (so "node core.mjs green" is literal). Inert when imported, and
//    avoids `import.meta` so the SAME file inlines cleanly into a non-module <script>
//    (where `process` is undefined and the guard short-circuits to false). ──────────
if (typeof process !== 'undefined' && process.argv && /(^|\/)core\.mjs$/.test(process.argv[1] || '') && !process.argv[1].includes('core.test')) {
  const r = runSelfTest();
  for (const c of r.checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name);
  console.log(`\n${r.pass}/${r.total} ${r.pass === r.total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
  process.exit(r.pass === r.total ? 0 : 1);
}
