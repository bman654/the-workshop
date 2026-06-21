/* ════════════════════════════════════════════════════════════════════════════
   THE TRADING BENCH — core.mjs · the physics authority (pure, DOM-free).

   Two identical pendulums, joined at mid-height by a coupling spring, are the
   textbook pair of COUPLED OSCILLATORS. Pull one aside and let go: it slowly
   dies while its silent twin wakes to full swing — the energy POURS from one
   bob to the other and back, on the slow BEAT clock, with nobody touching it in
   between. This module is the sole authority for that physics. The page inlines
   it byte-faithfully via `forge:include core.mjs` (forge strips the `export`
   keywords so it runs as a plain in-page <script>); the Node twin core.test.mjs
   imports the SAME functions and runs runSelfTest() verbatim.

   THE PHYSICS — two identical small-angle pendulums (length L, gravity g) whose
   bobs are joined by a spring of coupling strength K. With θ_i the angle of bob i,

        θ₁'' = −(g/L)·θ₁ − K·(θ₁ − θ₂)
        θ₂'' = −(g/L)·θ₂ − K·(θ₂ − θ₁)

   The trick is to change coordinates to the two NORMAL MODES, which decouple:
        s = θ₁ + θ₂   (SYMMETRIC / "release together") → ω₁ = √(g/L)
        d = θ₁ − θ₂   (ANTISYMMETRIC / "mirrored")      → ω₂ = √(g/L + 2K)
   Each obeys a plain SHM equation: s'' = −ω₁²s, d'' = −ω₂²d. So
        s(t) = s₀·cos ω₁t + (sv₀/ω₁)·sin ω₁t
        d(t) = d₀·cos ω₂t + (dv₀/ω₂)·sin ω₂t
   and the bobs are recovered exactly: θ₁ = (s+d)/2, θ₂ = (s−d)/2. Because the
   spring stiffens only the antisymmetric mode, ω₂ > ω₁; the two carriers run at
   slightly different rates and BEAT against each other. Pull bob 1 to A with bob
   2 at rest: s₀ = d₀ = A, so

        θ₁(t) = A·cos((ω₂−ω₁)t/2)·cos((ω₁+ω₂)t/2)   ← envelope · fast carrier
        θ₂(t) = A·sin((ω₂−ω₁)t/2)·sin((ω₁+ω₂)t/2)

   The SLOW envelopes env₁ = A·cos(Δω·t/2), env₂ = A·sin(Δω·t/2) (Δω = ω₂−ω₁)
   trade amplitude with period T_beat = 2π/Δω: the launched bob's envelope hits
   ZERO and the twin's hits A at t = T_beat/2 — the full pour. As K→0, Δω→0 and
   T_beat→∞: no coupling, no trade. The CLOSED FORM is the live authority (no
   integrator drift); a direct RK4 of the coupled ODE is the independent oracle
   the self-test checks it against. Small-angle linear frame — the trade is exact
   in that regime. The self-test pins every one of these.
   ════════════════════════════════════════════════════════════════════════════ */

// ── The two normal-mode frequencies. p = { g, L, K }. ────────────────────────
//   ω₁ = √(g/L)   (symmetric: spring never stretches, so it doesn't feel K)
//   ω₂ = √(g/L + 2K)  (antisymmetric: both bobs pull on the spring → stiffer)
export function modeFreqs(p) {
  const { g, L, K } = p;
  return { w1: Math.sqrt(g / L), w2: Math.sqrt(g / L + 2 * K) };
}

// ── The beat period T_beat = 2π/(ω₂−ω₁): the time for energy to return home.
//   Energy is fully across at T_beat/2. As K→0, ω₂→ω₁ and T_beat→∞ (no trade).
export function beatPeriod(p) {
  const { w1, w2 } = modeFreqs(p);
  const dw = w2 - w1;
  return dw > 0 ? (2 * Math.PI) / dw : Infinity;
}

// ── The CLOSED-FORM state. p carries the launch ICs as well:
//   p = { g, L, K, th1_0, th2_0, v1_0, v2_0 }. Returns [θ₁, θ₂] at time t.
//   We solve the two decoupled normal modes analytically, then map back.
export function closedForm(t, p) {
  const { w1, w2 } = modeFreqs(p);
  const s0 = p.th1_0 + p.th2_0, d0 = p.th1_0 - p.th2_0;
  const sv0 = p.v1_0 + p.v2_0, dv0 = p.v1_0 - p.v2_0;
  const s = s0 * Math.cos(w1 * t) + (sv0 / w1) * Math.sin(w1 * t);
  const d = d0 * Math.cos(w2 * t) + (dv0 / w2) * Math.sin(w2 * t);
  return [(s + d) / 2, (s - d) / 2];
}
// ── The CLOSED-FORM velocities (analytic derivative of closedForm). Returns [v₁, v₂]. ──
export function closedFormVel(t, p) {
  const { w1, w2 } = modeFreqs(p);
  const s0 = p.th1_0 + p.th2_0, d0 = p.th1_0 - p.th2_0;
  const sv0 = p.v1_0 + p.v2_0, dv0 = p.v1_0 - p.v2_0;
  const sv = -s0 * w1 * Math.sin(w1 * t) + sv0 * Math.cos(w1 * t);
  const dv = -d0 * w2 * Math.sin(w2 * t) + dv0 * Math.cos(w2 * t);
  return [(sv + dv) / 2, (sv - dv) / 2];
}

// ── The SLOW envelopes that the per-bob amplitude follows. For the single-bob
//   launch (θ₁=A, θ₂=0, no initial velocity → s₀=d₀=A) the two bobs' slow
//   beat envelopes are exactly
//       env_launched = A·|cos(Δω·t/2)|   (the pulled bob, fading to 0)
//       env_twin     = A·|sin(Δω·t/2)|   (the silent twin, waking to A)
//   with Δω = ω₂−ω₁ and A = θ₁_0 (the pull amplitude). At t=T_beat/2 the first
//   hits 0 and the second hits A — the full pour. The page uses env² for fluid
//   heights; the test asserts the envelopes hit 0 / A at T_beat/2.
export function envelopes(t, p) {
  const { w1, w2 } = modeFreqs(p);
  const halfDw = (w2 - w1) / 2;
  const A = Math.abs(p.th1_0);               // the pull amplitude (single-bob launch)
  const envLaunched = A * Math.abs(Math.cos(halfDw * t));
  const envTwin = A * Math.abs(Math.sin(halfDw * t));
  return { env1: envLaunched, env2: envTwin, envLaunched, envTwin };
}

// ── ENERGIES. The conserved quantities are the per-MODE energies, not a naive
//   per-bob KE+PE split (the single-bob launch starts with energy already stored
//   in the coupling spring). With unit bob mass and small angles:
//     E_s = ¼(sv² + ω₁²·s²)    — the symmetric mode's energy box
//     E_d = ¼(dv² + ω₂²·d²)    — the antisymmetric mode's energy box
//   (the ¼ comes from s=θ₁+θ₂ carrying a factor-2 in its definition). Each mode
//   is its own closed energy box; their sum is the conserved total.
export function modeEnergies(t, p) {
  const { w1, w2 } = modeFreqs(p);
  const s0 = p.th1_0 + p.th2_0, d0 = p.th1_0 - p.th2_0;
  const sv0 = p.v1_0 + p.v2_0, dv0 = p.v1_0 - p.v2_0;
  const s = s0 * Math.cos(w1 * t) + (sv0 / w1) * Math.sin(w1 * t);
  const d = d0 * Math.cos(w2 * t) + (dv0 / w2) * Math.sin(w2 * t);
  const sv = -s0 * w1 * Math.sin(w1 * t) + sv0 * Math.cos(w1 * t);
  const dv = -d0 * w2 * Math.sin(w2 * t) + dv0 * Math.cos(w2 * t);
  const Es = 0.25 * (sv * sv + w1 * w1 * s * s);
  const Ed = 0.25 * (dv * dv + w2 * w2 * d * d);
  return { Es, Ed };
}
// ── TOTAL mechanical energy (conserved): E_s + E_d. ──
export function totalEnergy(t, p) {
  const { Es, Ed } = modeEnergies(t, p);
  return Es + Ed;
}
// ── The mode-energy AMPLITUDES (the constant energy each mode holds). Used as a
//   reference for the conservation test and the steady half-fill of the pure modes.
export function modeEnergyAmplitudes(p) {
  const { w1, w2 } = modeFreqs(p);
  const s0 = p.th1_0 + p.th2_0, d0 = p.th1_0 - p.th2_0;
  const sv0 = p.v1_0 + p.v2_0, dv0 = p.v1_0 - p.v2_0;
  // E_s = ¼(ω₁²·s_amp²), with s_amp² = s0² + (sv0/ω1)²  (SHM amplitude²)
  const Es = 0.25 * (w1 * w1) * (s0 * s0 + (sv0 / w1) * (sv0 / w1));
  const Ed = 0.25 * (w2 * w2) * (d0 * d0 + (dv0 / w2) * (dv0 / w2));
  return { Es, Ed };
}

// ── The PER-BOB energy that drives the two glowing VIALS. The physically honest
//   way to split the total between the two vessels (so they always sum to the
//   conserved total and trade on the beat) is via the modal energy carried at
//   each bob: the symmetric mode lives equally on both bobs, the antisymmetric
//   mode too — but the BEAT lives in the cross-term. We assign each bob the
//   instantaneous mechanical energy of ITS coordinate including its share of the
//   coupling PE, computed from the closed-form state so it is exact and sums to
//   the conserved total. Concretely, for unit mass:
//     KE_i = ½ v_i² ;  PE_grav_i = ½(g/L)θ_i² ;  PE_spring SHARED = ¼K(θ₁−θ₂)²
//   The shared spring PE is split EQUALLY (½ each), so E₁+E₂ = total exactly.
export function perBobEnergy(t, p) {
  const [th1, th2] = closedForm(t, p);
  const [v1, v2] = closedFormVel(t, p);
  const wg = p.g / p.L;                         // (g/L) = ω₁²
  const spring = 0.5 * p.K * (th1 - th2) * (th1 - th2);   // total spring PE
  const e1 = 0.5 * v1 * v1 + 0.5 * wg * th1 * th1 + 0.5 * spring;
  const e2 = 0.5 * v2 * v2 + 0.5 * wg * th2 * th2 + 0.5 * spring;
  return { e1, e2 };
}

/* ── The ODE field for the FULL coupled-pendulum integration (the independent
   oracle the closed form is checked against). state s = [θ₁, θ₂, v₁, v₂].
   Returns [θ₁', θ₂', v₁', v₂'].  Small-angle: restoring −(g/L)θ + coupling. */
export function deriv(s, p) {
  const [t1, t2, v1, v2] = s;
  const wg = p.g / p.L;
  return [
    v1, v2,
    -wg * t1 - p.K * (t1 - t2),
    -wg * t2 - p.K * (t2 - t1),
  ];
}
// One RK4 step of size h (the field is autonomous — no explicit time). RK4 has
// tiny bounded error on this smooth linear field; this is the oracle, not the ship.
export function rk4Step(s, h, p) {
  const k1 = deriv(s, p);
  const k2 = deriv(s.map((x, i) => x + h / 2 * k1[i]), p);
  const k3 = deriv(s.map((x, i) => x + h / 2 * k2[i]), p);
  const k4 = deriv(s.map((x, i) => x + h * k3[i]), p);
  return s.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/* ════════════════════════════════════════════════════════════════════════════
   THE SELF-TEST — proves the claims. The Node twin runs this verbatim; the pill calls it.

   (a) PARITY — the closed-form θ₁/θ₂ reconstructs the directly-RK4-integrated
       coupled ODE to <1e-9 over a full beat.
   (b) FULL TRADE — assert on the slow ENVELOPE (not the raw angle): at t=T_beat/2
       the launched bob's envelope → 0 AND the twin's envelope → A.
   (c) CONSERVATION — total energy conserved across the trade, AND the per-mode
       energies E_s, E_d separately conserved (each mode is its own energy box).
   (d) NEG-CONTROL — as K→0 the beat period → ∞; AND the pure-mode releases never
       trade (max|θ₁−θ₂|=0 symmetric, max|θ₁+θ₂|=0 mirrored, over a beat).
   ════════════════════════════════════════════════════════════════════════════ */
export function runSelfTest() {
  const log = [];
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; log.push('✗ ' + m); } };
  const near = (a, b, tol) => Math.abs(a - b) < tol;

  const g = 9.81, L = 0.6, K = 0.9, A = 0.25;
  // canonical single-bob launch: bob 1 pulled to A, bob 2 at rest, no velocity.
  const launch = { g, L, K, th1_0: A, th2_0: 0, v1_0: 0, v2_0: 0 };
  const { w1, w2 } = modeFreqs(launch);
  const Tbeat = beatPeriod(launch);

  // (a) PARITY — integrate the coupled ODE directly with RK4 from the same ICs and
  //     compare to the closed form at many instants across a FULL beat. <1e-9.
  {
    let s = [launch.th1_0, launch.th2_0, launch.v1_0, launch.v2_0];
    const steps = 20000;
    const h = Tbeat / steps;
    let worst = 0, t = 0;
    for (let i = 0; i < steps; i++) {
      s = rk4Step(s, h, launch); t += h;
      const [c1, c2] = closedForm(t, launch);
      worst = Math.max(worst, Math.abs(s[0] - c1), Math.abs(s[1] - c2));
    }
    ok(worst < 1e-9, `closed form reconstructs the directly-RK4-integrated coupled ODE over a full beat (worst |Δθ| ${worst.toExponential(2)})`);
  }

  // (b) FULL TRADE — at t=T_beat/2 the LAUNCHED bob's slow envelope → 0 and the
  //     TWIN's → A. Assert the ENVELOPE, NOT the raw twin angle (its fast carrier
  //     is at an arbitrary phase there, so the raw twin angle is NOT A).
  {
    const tHalf = Tbeat / 2;
    const env = envelopes(tHalf, launch);
    ok(near(env.envLaunched, 0, 1e-9), `at T_beat/2 the launched bob's envelope → 0 (got ${env.envLaunched.toExponential(2)})`);
    ok(near(env.envTwin, A, 1e-9), `at T_beat/2 the twin's envelope → A=${A} (got ${env.envTwin.toFixed(6)})`);
    // and the launched bob's RAW angle is also ~0 there (carrier × 0 envelope)
    const [l1] = closedForm(tHalf, launch);
    ok(near(l1, 0, 1e-6), `…the launched bob's RAW angle is ~0 at T_beat/2 too (got ${l1.toExponential(2)})`);
    // sanity: the raw TWIN angle is NOT A there (the documented pitfall) — its
    // envelope is full but the fast carrier sits at an arbitrary phase.
    const [, t2raw] = closedForm(tHalf, launch);
    ok(Math.abs(t2raw - A) > 1e-3, `…and the raw twin angle is NOT A at that instant (only the envelope is full): ${t2raw.toFixed(4)} ≠ ${A}`);
  }

  // (c) CONSERVATION — total energy conserved across the trade, and E_s, E_d each
  //     separately conserved (each normal mode is its own closed energy box).
  {
    const E0 = totalEnergy(0, launch);
    const m0 = modeEnergies(0, launch);
    let worstTot = 0, worstS = 0, worstD = 0;
    for (let i = 0; i <= 400; i++) {
      const t = (i / 400) * Tbeat;
      const Et = totalEnergy(t, launch);
      const m = modeEnergies(t, launch);
      worstTot = Math.max(worstTot, Math.abs(Et - E0) / E0);
      worstS = Math.max(worstS, Math.abs(m.Es - m0.Es) / Math.max(1e-12, m0.Es));
      worstD = Math.max(worstD, Math.abs(m.Ed - m0.Ed) / Math.max(1e-12, m0.Ed));
    }
    ok(worstTot < 1e-12, `total energy conserved across the trade (rel drift ${worstTot.toExponential(2)})`);
    ok(worstS < 1e-12 && worstD < 1e-12, `E_s and E_d separately conserved — each mode is its own energy box (worst ${Math.max(worstS, worstD).toExponential(2)})`);
    // the per-bob vials always SUM to the conserved total (so left drains as right fills)
    let worstSum = 0;
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Tbeat;
      const { e1, e2 } = perBobEnergy(t, launch);
      worstSum = Math.max(worstSum, Math.abs((e1 + e2) - E0) / E0);
    }
    ok(worstSum < 1e-12, `the two vials always sum to the conserved total (worst rel ${worstSum.toExponential(2)}) — left drains exactly as right fills`);
  }

  // (d) NEG-CONTROL — as K→0 the beat period 2π/(ω₂−ω₁) → ∞; AND the pure-mode
  //     releases NEVER trade (one bob holds its rest amplitude forever).
  {
    const Tb09 = beatPeriod({ g, L, K: 0.9 });
    const Tb009 = beatPeriod({ g, L, K: 0.09 });
    const Tb0009 = beatPeriod({ g, L, K: 0.009 });
    ok(Tb09 < Tb009 && Tb009 < Tb0009, `K→0 stretches the beat without bound (${Tb09.toFixed(1)}s → ${Tb009.toFixed(0)}s → ${Tb0009.toFixed(0)}s)`);
    ok(beatPeriod({ g, L, K: 0 }) === Infinity, `K=0 ⇒ T_beat = ∞ — no coupling, no trade`);

    // SYMMETRIC release (θ₁=θ₂=A): only ω₁ runs; the spring NEVER stretches, so
    // θ₁−θ₂ stays 0 for all time — the bobs swing in lockstep, no trade.
    const sym = { g, L, K, th1_0: A, th2_0: A, v1_0: 0, v2_0: 0 };
    let maxDiff = 0;
    for (let i = 0; i <= 400; i++) {
      const t = (i / 400) * beatPeriod(sym === Infinity ? launch : launch);
      const [a, b] = closedForm((i / 400) * Tbeat, sym);
      maxDiff = Math.max(maxDiff, Math.abs(a - b));
    }
    ok(maxDiff < 1e-12, `SYMMETRIC release never trades: max|θ₁−θ₂| = ${maxDiff.toExponential(2)} (spring never stretches)`);

    // MIRRORED release (θ₁=−θ₂=A): only ω₂ runs; θ₁+θ₂ stays 0 forever — the bobs
    // scissor, the spring pulses, but no energy crosses (each bob keeps its swing).
    const mir = { g, L, K, th1_0: A, th2_0: -A, v1_0: 0, v2_0: 0 };
    let maxSum = 0;
    for (let i = 0; i <= 400; i++) {
      const [a, b] = closedForm((i / 400) * Tbeat, mir);
      maxSum = Math.max(maxSum, Math.abs(a + b));
    }
    ok(maxSum < 1e-12, `MIRRORED release never trades: max|θ₁+θ₂| = ${maxSum.toExponential(2)} (only the antisymmetric mode runs)`);
  }

  return { pass, fail, log };
}
