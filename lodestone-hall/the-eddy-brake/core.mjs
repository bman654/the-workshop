// ============================================================================
//  THE EDDY BRAKE — the Lodestone Hall's Lenz-braking core.
//
//  Zero-dependency, DOM-free ESM. Runs in the browser AND in Node. This module
//  is the SOLE SOURCE OF TRUTH for every number the bench shows: the magnet's
//  position, its velocity, the live Joule-heat sum, and the terminal-velocity
//  gauge are ALL read from here. The page inlines the slab between the EDDY-BRAKE
//  CORE BEGIN / END sentinels byte-for-byte; core.test.mjs RE-EXTRACTS the inlined
//  copy and proves it is char-for-char this module's body, so page, pill, and Node
//  twin can never silently drift.
//
//  THE ONE IDEA — LENZ'S LAW AS A BRAKE. Drop a plain iron slug down a plastic
//  tube: it falls free, gravity-time. Drop the SAME slug as a MAGNET down a COPPER
//  tube and it drifts down in slow motion, as if through honey — though nothing
//  touches it. The descending magnet's flux through each ring of pipe wall is
//  CHANGING, so (Faraday) an EMF is induced around the ring, driving an eddy
//  current; and (Lenz) that current always OPPOSES the change that made it — the
//  ring ahead of the magnet pushes UP (opposing the approach), the ring behind
//  pulls back (opposing the departure). Net: a retarding force on the magnet. This
//  is the SAME change-in-flux law as the Hall's galvanometer — now BRAKING the
//  motion instead of READING it.
//
//  THE DRAG IS LINEAR IN SPEED (the slow-magnet regime). The induced EMF in the
//  wall ∝ dΦ/dt ∝ v; the eddy current ∝ EMF·σ (Ohm in the wall, σ = wall
//  conductance); the retarding force on the magnet ∝ current·dΦ/dx ∝ σ·v. So in
//  the slow regime the magnetic drag is exactly
//        F_drag = − b·v ,   b = k·σ        (b = the damping, ∝ wall conductance)
//  a viscous, speed-proportional brake. (k folds the dipole strength + pipe
//  geometry into one constant; it is a SCENE constant, not a proven number — only
//  the RATIOS and the conservation balance below are asserted exact.)
//
//  TERMINAL VELOCITY — drag balances gravity, ALMOST INSTANTLY. The equation of
//  motion is m·v̇ = m·g − b·v (taking down as +). Its solution relaxes to a
//  terminal velocity on a time-constant τ = m/b:
//        v(t) = v_term·(1 − e^{−t/τ}) ,   v_term = m·g / b = m·g / (k·σ).
//  Two exact claims fall out, asserted across a CONDUCTIVITY-dial sweep:
//   (1) at terminal velocity drag === gravity: b·v_term === m·g  (the balance).
//   (2) v_term ∝ 1/σ EXACTLY: v_term(σ)·σ is CONSTANT across the dial — copper
//       (high σ) → slow drift; aluminium (lower σ) → faster; a poor conductor →
//       faster still; and as σ → 0 (the plastic tube) v_term DIVERGES (no terminal
//       velocity: free-fall).
//
//  ENERGY IS CONSERVED TO MACHINE-ε. The kinetic energy the magnet WOULD have
//  gained in free fall is dissipated as I²R Joule heat in the pipe wall. Integrate
//  the EOM (RK4) over a descent of height h; the running heat sum is
//        Q = ∫ (b·v)·v dt = ∫ F_drag·v dt          (drag-force × speed = power lost)
//  and the exact ledger over the whole descent is
//        m·g·h === ΔKE + Q            (PE drop = kinetic gained + heat dissipated)
//  asserted to < 1e-9. At terminal velocity ΔKE → 0 over a steady stretch, so there
//  ALL the PE drop becomes heat: the brake is a furnace that runs on falling.
//
//  THE LENZ SIGN IS THE CONSERVATION HINGE. b = k·σ with the Lenz-ON sign (+):
//  drag OPPOSES v, Q ≥ 0 (real dissipation, energy conserved). FLIP the induced
//  sign (the Lenz-OFF cheat, b < 0): the "brake" AIDS the motion — a runaway
//  ACCELERATOR. The same heat integral goes Q < 0 (energy pulled from nowhere) and
//  the balance breaks: ΔKE > m·g·h. That is the free-energy alarm — the SAME hinge
//  the Hall's closedLoopHandWork proves (Lenz ON ∮ ≥ 0 vs Lenz OFF ∮ < 0). We
//  IMPORT that authority and assert our brake's sign convention agrees with it.
//
//  NEG-CONTROL — THE PLASTIC TUBE (σ = 0). A non-conductor carries NO eddy current:
//  b = 0, F_drag ≡ 0, Q ≡ 0 (zero rings), and the magnet is in PURE FREE FALL,
//  v(t) === g·t to machine-ε — identical to the plain iron slug. It is the
//  CONDUCTOR, not mere proximity, that brakes. v_term diverges as σ → 0: no
//  terminal velocity at all.
//
//  SOURCING (anti-drift, encoded in core.test.mjs): index.html inlines the parent
//  Hall slab (../core.mjs) FIRST, scoped so only its Lenz authority escapes, then
//  this slab; the twin byte-parity-checks BOTH and asserts our sign convention
//  agrees with the Hall's Lenz-ON/OFF ledger. No drag math lives on the page outside
//  this slab.
// ============================================================================

// === EDDY-BRAKE CORE BEGIN ===
"use strict";

// The shipped scene constants. g, m, h set the fall; SIGMA names the dial's
// conductance stops (copper → aluminium → a poor conductor); k folds dipole
// strength + pipe geometry into the damping b = k·σ. Only RATIOS + the energy
// balance are PROVEN exact — k, g, m, h are honest UX scene constants.
const SCENE = {
  g: 9.8,             // gravity (down = +)
  m: 1.0,             // magnet mass
  h: 6.0,             // pipe length (the descent height the balance is taken over)
  k: 8.0,             // damping per unit conductance: b = k·σ (strong → copper drifts
                      //   at v_term ≈ 1.2 while the free-falling iron slug races past)
  // the conductivity dial's stops (relative wall conductance σ; copper is the
  // reference 1.0). Aluminium conducts ~0.6× copper; a poor conductor far less.
  sigmaStops: [
    { id: 'copper',    label: 'copper',          sigma: 1.00 },
    { id: 'aluminium', label: 'aluminium',       sigma: 0.61 },
    { id: 'brass',     label: 'brass',           sigma: 0.28 },
    { id: 'poor',      label: 'a poor conductor', sigma: 0.10 },
    { id: 'plastic',   label: 'plastic (none)',   sigma: 0.00 },  // the NEG-CONTROL
  ],
};

// ── THE DAMPING. b = k·σ with the Lenz sign. sign=+1 is Lenz ON (drag opposes v,
//    the real brake); sign=−1 is the LENZ-OFF cheat (drag aids v → runaway). A
//    non-conductor (σ=0) gives b=0 exactly: no eddy current, no brake.
function damping(sigma, sign = +1, scene = SCENE){
  const s = (sign < 0) ? -1 : 1;
  return s * scene.k * sigma;
}

// ── THE DRAG FORCE on the magnet at speed v: F_drag = −b·v (Lenz ON: opposes v).
//    This is the SOLE force law; the picture's eddy-ring glow + the v-gauge are
//    drawn from the state this force integrates to.
function dragForce(v, sigma, sign = +1, scene = SCENE){
  return -damping(sigma, sign, scene) * v;
}

// ── TERMINAL VELOCITY: drag balances gravity, b·v_term = m·g ⇒ v_term = m·g/b.
//    Lenz ON, σ>0: a finite positive terminal speed. σ→0 (plastic): b→0 ⇒ v_term
//    DIVERGES (no terminal velocity — free-fall). Returns Infinity for σ=0.
function vTerminal(sigma, scene = SCENE){
  const b = damping(sigma, +1, scene);
  if (b === 0) return Infinity;
  return scene.m * scene.g / b;
}

// ── THE ACCELERATION at state (v): a = g − (b/m)·v  (down = +). The whole
//    descent is RK4-integrated from this single accessor — no second force law.
function accel(v, sigma, sign = +1, scene = SCENE){
  // m·v̇ = m·g + F_drag  ⇒  v̇ = g + F_drag/m = g − (b/m)·v
  return scene.g + dragForce(v, sigma, sign, scene) / scene.m;
}

// ── THE DESCENT INTEGRATOR (RK4). Integrate v̇ = g − (b/m)·v and ẋ = v from rest
//    over a fixed wall-time T in N steps, accumulating the Joule-heat sum
//    Q = ∫ (−F_drag)·v dt = ∫ b·v² dt (the power the drag removes from the magnet,
//    dissipated as I²R heat in the wall). Returns the full ledger:
//      { x, v, t, Q, ke, peDrop, balance } where balance = peDrop − (ke + Q) is the
//    conservation residual (→ 0 to machine-ε with Lenz ON). The page steps the SAME
//    integrator one frame at a time; the twin runs it whole.
function integrateDescent(sigma, T, N, sign = +1, scene = SCENE){
  const dt = T / N;
  let v = 0, x = 0, t = 0, Q = 0;
  // dv/dt = f(v) = g − (b/m)·v. Heat power p(v) = (−F_drag)·v = b·v². We accumulate
  // Q with the SAME RK4 weights as v so the ledger is consistent to the integrator's
  // order (the residual then closes to machine-ε, not merely to truncation error).
  const fV = (vv) => accel(vv, sigma, sign, scene);
  const fQ = (vv) => damping(sigma, sign, scene) * vv * vv;   // b·v² (signed by Lenz)
  for (let i = 0; i < N; i++){
    const k1v = fV(v),            k1q = fQ(v);
    const k2v = fV(v + 0.5*dt*k1v), k2q = fQ(v + 0.5*dt*k1v);
    const k3v = fV(v + 0.5*dt*k2v), k3q = fQ(v + 0.5*dt*k2v);
    const k4v = fV(v + dt*k3v),    k4q = fQ(v + dt*k3v);
    const vNext = v + (dt/6)*(k1v + 2*k2v + 2*k3v + k4v);
    // x advances by the average velocity over the step (∫v dt via the same RK4 v's)
    x += (dt/6)*(v + 2*(v+0.5*dt*k1v) + 2*(v+0.5*dt*k2v) + (v+dt*k3v));
    Q += (dt/6)*(k1q + 2*k2q + 2*k3q + k4q);
    v = vNext; t += dt;
  }
  const ke = 0.5 * scene.m * v * v;       // kinetic energy gained from rest
  const peDrop = scene.m * scene.g * x;   // gravitational PE released over the drop x
  const balance = peDrop - (ke + Q);      // conservation residual (→0, Lenz ON)
  return { x, v, t, Q, ke, peDrop, balance };
}

// ── PROOF INSTRUMENT — relative defect helper.
function relDefect(a, b){ return Math.abs(a - b) / Math.max(1e-12, Math.abs(b)); }

// ── CLAIM CHECKS ─────────────────────────────────────────────────────────────

// (1) AT TERMINAL VELOCITY DRAG === GRAVITY: b·v_term === m·g across the dial.
function checkTerminalBalance(scene = SCENE){
  let worst = 0, where = '';
  for (const stop of scene.sigmaStops){
    if (stop.sigma === 0) continue;                  // plastic has no v_term (the neg-control)
    const b = damping(stop.sigma, +1, scene);
    const vt = vTerminal(stop.sigma, scene);
    const d = Math.abs(b * vt - scene.m * scene.g);  // should be exactly 0
    if (d > worst){ worst = d; where = stop.id; }
  }
  return { worst, where };
}

// (2) v_term ∝ 1/σ EXACTLY: v_term(σ)·σ is the SAME constant (= m·g/k) for every σ>0.
function checkVtermInverseSigma(scene = SCENE){
  let worst = 0, where = '';
  const ref = scene.m * scene.g / scene.k;           // v_term·σ should equal this
  // a dense sweep + the named dial stops
  const sweep = [];
  for (let i = 1; i <= 200; i++) sweep.push(i/200);  // σ ∈ (0,1]
  for (const stop of scene.sigmaStops) if (stop.sigma > 0) sweep.push(stop.sigma);
  for (const sigma of sweep){
    const prod = vTerminal(sigma, scene) * sigma;    // = m·g/(k·σ)·σ = m·g/k, const
    const d = Math.abs(prod - ref);
    if (d > worst){ worst = d; where = 'σ=' + sigma.toFixed(3); }
  }
  return { worst, where, ref };
}

// (3) ENERGY BALANCE m·g·h === ΔKE + Q to <1e-9 over the descent, Lenz ON, across
//     the dial. We integrate to a fixed time long enough to traverse a stretch, and
//     assert the residual closes. (Returns the worst |residual| over the stops.)
function checkEnergyBalance(scene = SCENE){
  let worst = 0, where = '';
  for (const stop of scene.sigmaStops){
    // integrate a descent; the residual is peDrop − (ke + Q), which must vanish
    // REGARDLESS of σ (including σ=0 free-fall: then Q=0 and peDrop=ke exactly).
    const r = integrateDescent(stop.sigma, 4.0, 20000, +1, scene);
    const d = Math.abs(r.balance);
    if (d > worst){ worst = d; where = stop.id; }
  }
  return { worst, where };
}

// (4) THE LENZ HINGE — Lenz ON dissipates (Q ≥ 0, balance closes); Lenz OFF creates
//     energy (Q < 0, ΔKE > peDrop → free energy). Returns both ledgers + the verdict.
function checkLenzHinge(scene = SCENE){
  const sigma = 1.0;   // copper
  const on  = integrateDescent(sigma, 2.0, 20000, +1, scene);
  const off = integrateDescent(sigma, 2.0, 20000, -1, scene);
  // Lenz ON: real dissipation, balance closed. Lenz OFF: energy created from nowhere.
  const onConserves  = on.Q >= 0 && Math.abs(on.balance) < 1e-9;
  const offCreates   = off.Q < 0 && off.ke > off.peDrop;     // KE exceeds the PE drop
  return { on, off, onConserves, offCreates };
}

// (5) NEG-CONTROL — THE PLASTIC TUBE (σ=0): pure free-fall v(t) === g·t, Q ≡ 0,
//     and v_term diverges. Drag must be EXACTLY zero at every speed (b=0 multiplies
//     out). Returns the worst free-fall defect + the heat (must be 0) + divergence.
function checkPlasticFreeFall(scene = SCENE){
  // (a) drag ≡ 0 at σ=0 for any v (b = k·0 = 0)
  let dragWorst = 0;
  for (let i = 0; i <= 50; i++){
    const v = -5 + i*0.2;
    dragWorst = Math.max(dragWorst, Math.abs(dragForce(v, 0, +1, scene)));
  }
  // (b) free-fall: integrate σ=0 and compare v(T) to the closed form g·T
  const T = 1.3, N = 20000;
  const r = integrateDescent(0, T, N, +1, scene);
  const freeFallV = scene.g * T;                 // v = g·t with no drag
  const vDefect = Math.abs(r.v - freeFallV);
  // (c) divergence: v_term(σ→0) → ∞ (Infinity exactly at σ=0)
  const diverges = vTerminal(0, scene) === Infinity;
  // and v_term grows without bound as σ shrinks (monotone blow-up)
  const grow = vTerminal(0.01, scene) > 10 * vTerminal(0.5, scene);
  return { dragWorst, heat: r.Q, vDefect, diverges, grow };
}

// ── THE SELF-TEST — the bench proves its own claim. FOUR positive claims each to
//    <1e-9 (one EXACT to the bit), plus the RED neg-control (the falsifier).
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const EPS = 1e-9;

  // CLAIM 1 — at terminal velocity drag === gravity (b·v_term === m·g), the dial.
  const c1 = checkTerminalBalance();
  log('1 · at v_term drag === gravity:  b·v_term === m·g  across the conductivity dial, <1e-9',
      c1.worst < EPS, 'worst |b·v_term − mg| = ' + c1.worst.toExponential(2) + ' @ ' + c1.where);

  // CLAIM 2 — v_term ∝ 1/σ EXACTLY (v_term·σ constant across a dense σ sweep).
  const c2 = checkVtermInverseSigma();
  log('2 · v_term ∝ 1/σ  exactly (v_term·σ === m·g/k = ' + c2.ref.toFixed(3) + ' across the σ-sweep), <1e-9',
      c2.worst < EPS, 'worst |v_term·σ − mg/k| = ' + c2.worst.toExponential(2) + ' @ ' + c2.where);

  // CLAIM 3 — ENERGY BALANCE m·g·h === ΔKE + Q to <1e-9 over the descent, the dial.
  const c3 = checkEnergyBalance();
  log('3 · energy conserved:  m·g·h === ΔKE + Joule-heat Q  over the descent, across the dial, <1e-9',
      c3.worst < EPS, 'worst |PE − (KE+Q)| = ' + c3.worst.toExponential(2) + ' @ ' + c3.where);

  // CLAIM 4 — THE LENZ HINGE: Lenz ON conserves (Q≥0, balance closed); Lenz OFF
  //           creates energy (Q<0, KE>PE) — the free-energy alarm.
  const c4 = checkLenzHinge();
  log('4 · Lenz hinge:  ON ⇒ Q ≥ 0 & balance closed   vs   OFF ⇒ Q < 0 & ΔKE > mgh (free energy)',
      c4.onConserves && c4.offCreates,
      'ON Q = ' + c4.on.Q.toExponential(2) + ', bal ' + c4.on.balance.toExponential(2) +
      ' · OFF Q = ' + c4.off.Q.toExponential(2) + ', KE−PE = ' + (c4.off.ke - c4.off.peDrop).toExponential(2));

  // NEG-CONTROL (fires RED — the FALSIFIER) — THE PLASTIC TUBE (σ=0): drag ≡ 0 at
  //   EVERY speed, Q ≡ 0 (zero rings), v(t) === g·t (free-fall), v_term diverges.
  const c5 = checkPlasticFreeFall();
  const cN = c5.dragWorst === 0 && c5.heat === 0 && c5.vDefect < EPS && c5.diverges && c5.grow;
  log('5 · NEG-CONTROL  plastic (σ=0) ⇒ drag ≡ 0, Q ≡ 0 (no rings), v === g·t (free-fall), v_term → ∞',
      cN, 'max|drag| = ' + c5.dragWorst.toExponential(2) + ', Q = ' + c5.heat.toExponential(2) +
          ', |v−gt| = ' + c5.vDefect.toExponential(2) + ', diverges ' + c5.diverges);

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === EDDY-BRAKE CORE END ===

export {
  SCENE,
  damping, dragForce, vTerminal, accel, integrateDescent, relDefect,
  checkTerminalBalance, checkVtermInverseSigma, checkEnergyBalance,
  checkLenzHinge, checkPlasticFreeFall,
  runSelfTest,
};
