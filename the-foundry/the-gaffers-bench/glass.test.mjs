#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════════
   THE GAFFER'S BENCH — the Node twin.

       node the-foundry/the-gaffers-bench/glass.test.mjs

   Nothing here is asserted from a table.  The viscosity fit is asked to predict
   a fixed point it was never given.  The 12 in the inflation law is dug back
   out of an energy balance done numerically.  Mass is followed through an hour
   of blowing, sagging, jacking and remeshing and has to come back to the last
   bit.  The sag rate is checked against the closed form for a hanging tube, the
   cooling rate against Stefan-Boltzmann by hand, and the volume integrator
   against a hemisphere it has never seen.
   ══════════════════════════════════════════════════════════════════════════════ */
import {
  GLASS, SIGMA_SB, G_ACCEL, T_AMBIENT_K, BLOW_PRESSURE, FURNACE_K,
  FIXED_POINTS, STRAIN_POINT, VFT, fitVFT, vftLogEta, vftEta, vftTempFor, workability,
  makePiece, step, geometry, remesh, totalMass, innerVolume, surfaceArea,
  meanCurvature, cumulativeArc, pieceLength, maxRadius,
  crackOff, scoreLine, lipGeometry, noteOf, pitchLabel, helmholtzFreq,
  lathe, latheIndices, packVessel, unpackVessel,
} from './glass.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond){ pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '  ' + detail); }
};
const H = (s) => console.log('\n\x1b[1m' + s + '\x1b[0m');
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-30, Math.abs(b));

/* ── A · THE VISCOSITY CURVE ──────────────────────────────────────────────── */
H('A · glass has no melting point — the VFT fit, and a point it was not given');
{
  ok('the fit is a real solve, not a table  ' +
     `A=${VFT.A.toFixed(4)}  B=${VFT.B.toFixed(1)}  T0=${VFT.T0.toFixed(1)} °C`,
     isFinite(VFT.A) && isFinite(VFT.B) && isFinite(VFT.T0) && VFT.B > 0 && VFT.T0 > 0 && VFT.T0 < 400);

  for (const p of FIXED_POINTS){
    const y = vftLogEta(p.TC);
    ok(`${p.name} point reproduced: log10 η(${p.TC} °C) = ${y.toFixed(4)} (want ${p.logEta})`,
       Math.abs(y - p.logEta) < 1e-9);
  }
  /* THE OUT-OF-SAMPLE CHECK — three points went in, a fourth comes out */
  const Tstrain = vftTempFor(STRAIN_POINT.logEta);
  ok(`OUT OF SAMPLE — the strain point (10^13.5 Pa·s) lands at ${Tstrain.toFixed(1)} °C ` +
     `against a published ${STRAIN_POINT.TC_published} ± ${STRAIN_POINT.tol}`,
     Math.abs(Tstrain - STRAIN_POINT.TC_published) <= STRAIN_POINT.tol,
     `Δ = ${(Tstrain - STRAIN_POINT.TC_published).toFixed(1)} K`);

  /* monotone, and spanning the decades the craft actually lives in */
  let mono = true;
  for (let T = 400; T < 1300; T += 5) if (!(vftLogEta(T) > vftLogEta(T + 5))) mono = false;
  ok('viscosity falls monotonically from 400 °C to 1300 °C', mono);
  const span = vftLogEta(520) - vftLogEta(1200);
  ok(`fourteen decades really are in there: log η goes ${vftLogEta(1200).toFixed(2)} → ${vftLogEta(520).toFixed(2)} ` +
     `over 520–1200 °C`, span > 10, `span ${span.toFixed(1)} decades`);
  ok('inverse round-trips: vftTempFor(vftLogEta(T)) === T', rel(vftTempFor(vftLogEta(900)), 900) < 1e-12);
  ok(`the words on the gauge track the number: 1100 "${workability(1100)}", 950 "${workability(950)}", ` +
     `800 "${workability(800)}", 600 "${workability(600)}"`,
     workability(1100) === 'running' && workability(950) === 'working' &&
     workability(800) === 'stiffening' && workability(600) === 'cold');

  /* the fit does not depend on WHICH three points, only on the curve they lie on:
     re-fit from three DIFFERENT temperatures read off the same curve */
  const alt = fitVFT([
    { logEta: vftLogEta(1150), TC: 1150 },
    { logEta: vftLogEta(850),  TC: 850  },
    { logEta: vftLogEta(600),  TC: 600  },
  ]);
  ok('re-fitting from three other points on the same curve recovers A, B, T0',
     rel(alt.A, VFT.A) < 1e-8 && rel(alt.B, VFT.B) < 1e-8 && rel(alt.T0, VFT.T0) < 1e-8);
}

/* ── B · THE 12 IN THE INFLATION LAW ──────────────────────────────────────── */
H('B · v_n = q / (12 μ t H²) — the 12 dug out of an energy balance, numerically');
{
  /* A spherical shell, radius R, wall t, viscosity μ, internal pressure p.
     The law says Ṙ = p R² / (12 μ t).  Check it the OTHER way round:
     the work the blower does, p·dV/dt, must equal the heat the glass eats,
     ∫ 12 μ ε̇² dV over the wall — integrated here as a Riemann sum over shells,
     with ε̇ read off the motion and nothing about "12" assumed. */
  const R = 0.040, t = 0.0025, mu = 3.7e3, p = 2600;
  const Rdot = p * R * R / (12 * mu * t);          // the law under test

  /* work in */
  const dVdt = 4 * Math.PI * R * R * Rdot;
  const Win  = p * dVdt;

  /* dissipation out, summed over 4000 sub-shells across the wall.  Strain rates
     for a radially expanding incompressible shell: ε̇θ = ε̇φ = Ṙ/R, ε̇r = −2Ṙ/R.
     Φ = 2μ e:e = 2μ(ε̇θ² + ε̇φ² + ε̇r²). */
  let Wout = 0;
  const M = 4000;
  for (let k = 0; k < M; k++){
    const rr = R - t / 2 + t * (k + 0.5) / M;
    const e = Rdot / R;
    const phi = 2 * mu * (e * e + e * e + 4 * e * e);
    Wout += phi * 4 * Math.PI * rr * rr * (t / M);
  }
  /* They do not agree exactly, and the disagreement is not slop: integrating the
     wall over its real thickness rather than at the mid-surface adds exactly
     t²/12R².  Assert THAT, and the thin-shell law is pinned as the leading term
     of an integral rather than merely "close". */
  const excess = Wout / Win - 1, predicted = t * t / (12 * R * R);
  ok(`pressure work ${Win.toExponential(6)} W vs viscous dissipation ${Wout.toExponential(6)} W: ` +
     `they differ by ${excess.toExponential(4)}, and the thick-wall correction t²/12R² is ` +
     `${predicted.toExponential(4)}`, rel(excess, predicted) < 2e-4,
     `rel ${rel(excess, predicted).toExponential(2)}`);

  /* and the law is what the core uses: build a sphere in the core's own
     representation, take one step, and read the radius back. */
  const N = 200;
  const sp = {
    N, u: new Float64Array(N), r: new Float64Array(N), T: new Float64Array(N),
    m: new Float64Array(N - 1), t: new Float64Array(N), ds: new Float64Array(N - 1),
    k1: new Float64Array(N), k2: new Float64Array(N), eta: new Float64Array(N),
    rPipe: 0, tilt: Math.PI / 2, spin: 0, onPipe: true, lip: null, age: 0,
  };
  const TC = vftTempFor(Math.log10(mu));
  for (let i = 0; i < N; i++){
    const psi = Math.PI * i / (N - 1);
    sp.u[i] = R * (1 - Math.cos(psi));
    sp.r[i] = R * Math.sin(psi);
    sp.T[i] = TC;
  }
  sp.rPipe = sp.r[0];
  geometry(sp);
  for (let e = 0; e < N - 1; e++){
    const rm = 0.5 * (sp.r[e] + sp.r[e + 1]);
    sp.m[e] = GLASS.rho * 2 * Math.PI * rm * t * sp.ds[e];
  }
  geometry(sp);
  const Hm = meanCurvature(sp, N >> 1);
  ok(`the core's own curvature of a sphere of R = ${R} m is 1/R: H = ${Hm.toFixed(4)} vs ${(1 / R).toFixed(4)}`,
     rel(Hm, 1 / R) < 2e-3, `rel ${rel(Hm, 1 / R).toExponential(2)}`);

  /* v_n at the equator, from the core's own numbers, against the closed form.
     (Surface tension is in the core's q, so put it in the prediction too.) */
  /* Now the real solver: give the sphere the bench's own blow pressure and take
     one step.  The membrane balance has to hand back Ṙ = qR²/(12 μ t), with the
     skin's own 4γ/R subtracted from the pressure — and neither that 12 nor the
     Trouton 3 in section D was written anywhere in the code.  Both come out of
     the SAME plane-stress tensor law. */
  const i0 = N >> 1;
  const qPred = BLOW_PRESSURE - 4 * GLASS.gamma * Hm;
  const vPred = qPred / (12 * vftEta(TC) * sp.t[i0] * Hm * Hm);
  const r0 = sp.r[i0];
  const dt = 0.002;
  step(sp, dt, { blow: 1, heat: 0, spin: 0, tilt: Math.PI / 2 });
  const vMeas = (sp.r[i0] - r0) / dt;
  ok(`one step of the real solver moves the equator at ${vMeas.toFixed(6)} m/s; ` +
     `q R²/12μt says ${vPred.toFixed(6)}`, rel(vMeas, vPred) < 0.02,
     `rel ${(100 * rel(vMeas, vPred)).toFixed(2)} %`);
}

/* ── C · MASS ─────────────────────────────────────────────────────────────── */
H('C · nothing in this room manufactures glass');
{
  const p = makePiece();
  const m0 = totalMass(p);
  ok(`a first gather weighs ${(1000 * m0).toFixed(0)} g — a real one is 100–300 g`,
     m0 > 0.08 && m0 < 0.35);

  /* forty seconds of everything at once */
  let worst = 0;
  for (let n = 0; n < 8000; n++){
    step(p, 0.005, {
      blow: (n % 400 < 160) ? 1 : 0,
      heat: (n % 400 >= 300) ? 1 : 0,
      spin: 22 + 30 * Math.sin(n * 0.01),
      tilt: Math.PI / 2 + 1.1 * Math.sin(n * 0.004),
      jack: (n % 400 >= 200 && n % 400 < 260) ? { s: 0.16, w: 0.09, rate: 6 } : null,
      paddle: (n % 400 === 380) ? pieceLength(p) * 0.93 : null,
    });
    worst = Math.max(worst, rel(totalMass(p), m0));
  }
  ok(`mass after 40 s of blowing, heating, sagging, jacking, paddling and 8000 remeshes: ` +
     `worst drift ${worst.toExponential(2)} relative`, worst < 1e-12);
  ok('the piece is still a piece — finite, single-valued, positive radius',
     [...p.u, ...p.r, ...p.t, ...p.T].every(Number.isFinite) &&
     p.r.every(v => v >= 0) && p.u.every((v, i) => i === 0 || v > p.u[i - 1] - 1e-12));
  ok(`and it grew: ${(1000 * maxRadius(p)).toFixed(1)} mm across the belly, ` +
     `${(1000 * pieceLength(p)).toFixed(0)} mm long`, maxRadius(p) > 0.025);
}

/* ── D · SAG ──────────────────────────────────────────────────────────────── */
H('D · Trouton: a hanging tube stretches at σ / 3μ, and it is spin that saves you');
{
  /* A straight cylindrical sleeve on the pipe, pointing straight down, cold
     enough to be slow.  The element nearest the pipe carries everything below
     it, so its axial strain rate has a closed form. */
  function sleeve(TC){
    const N = 120, R = 0.012, wall = 0.003, L = 0.09;
    const p = {
      N, u: new Float64Array(N), r: new Float64Array(N), T: new Float64Array(N),
      m: new Float64Array(N - 1), t: new Float64Array(N), ds: new Float64Array(N - 1),
      k1: new Float64Array(N), k2: new Float64Array(N), eta: new Float64Array(N),
      rPipe: R, tilt: 0, spin: 0, onPipe: false, lip: null, age: 0, freeTip: true,
    };
    for (let i = 0; i < N; i++){ p.u[i] = L * i / (N - 1); p.r[i] = R; p.T[i] = TC; }
    geometry(p);
    for (let e = 0; e < N - 1; e++) p.m[e] = GLASS.rho * 2 * Math.PI * R * wall * p.ds[e];
    geometry(p);
    return p;
  }
  const TC = 880;
  const mu = vftEta(TC);

  /* Switch the skin off for the sag legs.  γ is 0.3 N/m and a 12 mm tube's own
     weight is only about 7 N/m, so the two are the same size and Trouton would
     be measured through a 9 % fog.  With γ = 0 the answer is exact, and the
     skin gets its own check underneath. */
  const gammaWas = GLASS.gamma;
  GLASS.gamma = 0;

  const p = sleeve(TC);
  const M = totalMass(p);
  /* the strain rate of the TOP element has a closed form: it carries the whole
     weight, over its own cross-section, over three times its viscosity.  The
     test computes it here from r, t, mass and η — the core is only asked what
     it got.  (Read out of p.diag, because remesh redistributes the nodes
     afterwards and node spacing is no longer a strain.) */
  const Ax = 2 * Math.PI * p.r[0] * p.t[0];
  step(p, 0.004, { blow: 0, heat: 0, spin: 0, tilt: 0 });
  /* η at the temperature the step actually ran at — the glass cooled a tenth of
     a kelvin on the way through, and a tenth of a kelvin is a quarter of a
     percent of the viscosity.  That is how steep this curve is. */
  const ePred = (G_ACCEL * M) / (3 * vftEta(p.T[0]) * Ax);
  const eMeas = p.diag.e1[0];
  ok(`hanging straight down at ${TC} °C (η = ${mu.toExponential(2)} Pa·s): the solver's own ` +
     `ε̇ = ${eMeas.toFixed(6)} /s, Trouton says σ/3μ = ${ePred.toFixed(6)} /s`,
     rel(eMeas, ePred) < 1e-6, `rel ${rel(eMeas, ePred).toExponential(2)}`);

  /* and the WHOLE sleeve, by a completely different route: integrate that
     closed form along a uniform tube and BOTH r and t cancel out —
     dL/dt = g ρ L² / 6μ, a number with no geometry left in it at all.
     Two tenths of a second, so the cooling has not moved η much. */
  const q0 = sleeve(TC);
  const Lpred = G_ACCEL * GLASS.rho * 0.09 * 0.09 / (6 * mu);
  const L0 = pieceLength(q0);
  for (let n = 0; n < 50; n++) step(q0, 0.004, { blow: 0, heat: 0, spin: 0, tilt: 0 });
  const Lmeas = (pieceLength(q0) - L0) / 0.2;
  ok(`the whole 90 mm sleeve lengthens at ${(1000 * Lmeas).toFixed(3)} mm/s; ` +
     `gρL²/6μ — no r, no t in it — says ${(1000 * Lpred).toFixed(3)} mm/s`,
     rel(Lmeas, Lpred) < 0.06, `rel ${(100 * rel(Lmeas, Lpred)).toFixed(1)} %`);

  /* it is COS of the tilt, and only cos: sideways, the spin averages gravity away */
  const lens = [];
  for (const tilt of [0, Math.PI / 3, Math.PI / 2]){
    const sl = sleeve(TC);
    for (let n = 0; n < 125; n++) step(sl, 0.004, { blow: 0, heat: 0, spin: 40, tilt });
    lens.push(pieceLength(sl));
  }
  ok(`half a second of hanging (level moves by 40 rad/s of centrifugal only): straight down it grew to ${(1000 * lens[0]).toFixed(2)} mm, ` +
     `at 60° ${(1000 * lens[1]).toFixed(2)} mm, level ${(1000 * lens[2]).toFixed(2)} mm (started 90.00)`,
     lens[0] > lens[1] && lens[1] > lens[2] && Math.abs(lens[2] - 0.09) < 2e-5);
  const ratio = (lens[0] - lens[2]) / (lens[1] - lens[2]);
  ok(`and the growth really goes as cos: straight-down / 60° = ${ratio.toFixed(4)} against 1/cos 60° = 2`,
     Math.abs(ratio - 2) < 0.02);

  /* now put the skin back and check it does exactly what the balance says:
     it takes 2γ straight off the meridional tension */
  GLASS.gamma = gammaWas;
  const pg = sleeve(TC);
  const Ng = (G_ACCEL * M) / (2 * Math.PI * pg.r[0]) - 2 * GLASS.gamma;
  const s2g = -2 * GLASS.gamma / pg.t[0];
  step(pg, 0.004, { blow: 0, heat: 0, spin: 0, tilt: 0 });
  const ePredG = (2 * (Ng / pg.t[0]) - s2g) / (6 * vftEta(pg.T[0]));
  ok(`with the skin back on, the same tube stretches at ${pg.diag.e1[0].toFixed(6)} /s instead of ` +
     `${ePred.toFixed(6)} — the two faces of the glass pull back with 2γ = ${(2 * GLASS.gamma).toFixed(2)} N/m`,
     rel(pg.diag.e1[0], ePredG) < 5e-4 && pg.diag.e1[0] < ePred,
     `rel ${rel(pg.diag.e1[0], ePredG).toExponential(2)} — the residue is the one-sided curvature stencil at the very end node`);

  /* pointing UP, it slumps back toward the pipe instead */
  const upP = sleeve(TC);
  for (let n = 0; n < 125; n++) step(upP, 0.004, { blow: 0, heat: 0, spin: 40, tilt: Math.PI });
  ok(`pointed up, the same sleeve slumps back: ${(1000 * pieceLength(upP)).toFixed(2)} mm`,
     pieceLength(upP) < 0.09 - 1e-5);
}

/* ── E · COOLING ──────────────────────────────────────────────────────────── */
H('E · Stefan-Boltzmann sets the working time, and nobody tuned it');
{
  const p = makePiece({ TC: 1075 });
  const i0 = 60;
  const T0 = p.T[i0], t0 = p.t[i0];
  const TK = T0 + 273.15;
  const fluxPred = 2 * GLASS.emiss * SIGMA_SB * (Math.pow(TK, 4) - Math.pow(T_AMBIENT_K, 4)) +
                   2 * GLASS.hConv * (TK - T_AMBIENT_K);
  const ratePred = fluxPred / (GLASS.rho * GLASS.cp * t0);
  const dt = 0.001;
  step(p, dt, { blow: 0, heat: 0, spin: 0, tilt: Math.PI / 2 });
  const rateMeas = (T0 - p.T[i0]) / dt;
  ok(`a ${(1000 * t0).toFixed(1)} mm wall at ${T0.toFixed(0)} °C loses ${rateMeas.toFixed(1)} K/s; ` +
     `by hand, ${(fluxPred / 1000).toFixed(0)} kW/m² over ρc·t gives ${ratePred.toFixed(1)} K/s`,
     rel(rateMeas, ratePred) < 0.03, `rel ${(100 * rel(rateMeas, ratePred)).toFixed(2)} %`);

  /* THE WORKING TIME.  Nothing here is a tuned constant: it is how long a real
     gather stays above the softening point in still air. */
  const q = makePiece({ TC: 1075 });
  let tWork = 0;
  for (let n = 0; n < 20000; n++){
    step(q, 0.005, { blow: 0, heat: 0, spin: 22, tilt: Math.PI / 2 });
    const hot = q.T[Math.floor(q.N * 0.6)];
    if (hot < 727){ tWork = n * 0.005; break; }
  }
  ok(`off the glory hole at 1075 °C, the belly falls below the softening point ` +
     `after ${tWork.toFixed(1)} s — a gaffer really does get about ten`,
     tWork > 4 && tWork < 30);

  /* the glory hole puts it back */
  const before = q.T[Math.floor(q.N * 0.6)];
  for (let n = 0; n < 2000; n++) step(q, 0.005, { blow: 0, heat: 1, spin: 22, tilt: Math.PI / 2 });
  ok(`ten seconds in the glory hole takes it from ${before.toFixed(0)} °C back to ` +
     `${q.T[Math.floor(q.N * 0.6)].toFixed(0)} °C`, q.T[Math.floor(q.N * 0.6)] > 850);
}

/* ── F · THE VOLUME INTEGRATOR ────────────────────────────────────────────── */
H('F · the volume the note depends on, checked against a shape with an answer');
{
  /* a hemisphere of radius R, thin-walled: interior volume = 2πR³/3 */
  const N = 400, R = 0.05, wall = 1e-5;
  const p = {
    N, u: new Float64Array(N), r: new Float64Array(N), T: new Float64Array(N),
    m: new Float64Array(N - 1), t: new Float64Array(N), ds: new Float64Array(N - 1),
    k1: new Float64Array(N), k2: new Float64Array(N), eta: new Float64Array(N),
    rPipe: R, tilt: 0, spin: 0, onPipe: false, lip: null, age: 0,
  };
  for (let i = 0; i < N; i++){
    const psi = (Math.PI / 2) * i / (N - 1);
    p.u[i] = R * Math.sin(psi);
    p.r[i] = R * Math.cos(psi);
    p.T[i] = 20;
  }
  geometry(p);
  for (let e = 0; e < N - 1; e++) p.m[e] = GLASS.rho * 2 * Math.PI * 0.5 * (p.r[e] + p.r[e + 1]) * wall * p.ds[e];
  geometry(p);
  /* First a shape where the frustum rule is EXACT and the wall offset is
     uniform: a cylinder.  Nothing here is approximated at all. */
  {
    const M = 60, Rc = 0.03, Lc = 0.11, wc = 0.002;
    const c = {
      N: M, u: new Float64Array(M), r: new Float64Array(M), T: new Float64Array(M),
      m: new Float64Array(M - 1), t: new Float64Array(M), ds: new Float64Array(M - 1),
      k1: new Float64Array(M), k2: new Float64Array(M), eta: new Float64Array(M),
      rPipe: Rc, tilt: 0, spin: 0, onPipe: false, lip: null, age: 0, freeTip: true,
    };
    for (let i = 0; i < M; i++){ c.u[i] = Lc * i / (M - 1); c.r[i] = Rc; c.T[i] = 20; }
    geometry(c);
    for (let e = 0; e < M - 1; e++) c.m[e] = GLASS.rho * 2 * Math.PI * Rc * wc * c.ds[e];
    geometry(c);
    const Vc = innerVolume(c), Vce = Math.PI * (Rc - wc / 2) ** 2 * Lc;
    ok(`a ${1000 * Rc} mm cylinder with a ${1000 * wc} mm wall holds ${(1e6 * Vc).toFixed(6)} cm³; ` +
       `π(R−t/2)²L = ${(1e6 * Vce).toFixed(6)} cm³`, rel(Vc, Vce) < 1e-12,
       `rel ${rel(Vc, Vce).toExponential(1)}`);
  }
  const Ri = R - 0.5 * p.t[0];
  const V = innerVolume(p), Vexact = 2 * Math.PI * Ri * Ri * Ri / 3;
  ok(`and a curved one, where the wall offset is only APPROXIMATELY radial — a ${(1000 * p.t[0]).toFixed(3)} mm hemisphere holds ${(1e6 * V).toFixed(3)} cm³ against 2π(R−t/2)³/3 = ${(1e6 * Vexact).toFixed(3)} cm³`,
     rel(V, Vexact) < 1e-3, `rel ${rel(V, Vexact).toExponential(2)}`);
  const A = surfaceArea(p), Aexact = 2 * Math.PI * R * R;
  ok(`and its area: ${(1e4 * A).toFixed(3)} cm² vs 2πR² = ${(1e4 * Aexact).toFixed(3)} cm²`,
     rel(A, Aexact) < 2e-4);
}

/* ── G · THE VOICE ────────────────────────────────────────────────────────── */
H('G · the note is the shape, and the law is The Jug\'s, not a second copy');
{
  /* the law itself is proven one room over; here we only check we are calling
     it with the geometry we think we are, and that the craft moves the pitch */
  const f = helmholtzFreq({ A: Math.PI * 0.012 * 0.012, V: 3.8e-4, Leff: 0.0404 });
  ok(`a 24 mm mouth on 380 cm³ with a 20 mm neck rings at ${f.toFixed(1)} Hz (${pitchLabel(f)})`,
     f > 250 && f < 340);

  const p = makePiece();
  for (let n = 0; n < 1400; n++){
    step(p, 0.005, {
      blow: n < 900 ? 1 : 0, heat: n < 900 ? 0.35 : 0, spin: 24, tilt: Math.PI / 2,
      jack: (n >= 950 && n < 1250) ? { s: 0.13, w: 0.07, rate: 9 } : null,
    });
  }
  const k = scoreLine(p);
  ok(`the jacks left a score line at node ${k} of ${p.N}, radius ${(1000 * p.r[k]).toFixed(1)} mm`,
     k > 0 && k < p.N * 0.42 && p.r[k] < maxRadius(p) * 0.65);

  const v = crackOff(p);
  const n1 = noteOf(v);
  ok(`cracked off, it is a vessel: mouth ${(2000 * n1.rLip).toFixed(1)} mm across, ` +
     `${(1e6 * n1.V).toFixed(0)} cm³ inside, and it sounds ${n1.f.toFixed(1)} Hz (${pitchLabel(n1.f)})`,
     n1.f > 60 && n1.f < 1600 && n1.V > 1e-5);
  ok('the mouth ends up at the origin and the vessel keeps its length',
     Math.abs(v.u[0]) < 1e-12 && pieceLength(v) > 0.03);

  /* f ∝ 1/√V, from the core's own numbers */
  const fA = helmholtzFreq({ A: n1.A, V: n1.V, Leff: n1.Leff });
  const fB = helmholtzFreq({ A: n1.A, V: 2 * n1.V, Leff: n1.Leff });
  ok(`twice the air you blew is a fifth-and-a-bit lower: ratio ${(fA / fB).toFixed(6)} vs √2`,
     rel(fA / fB, Math.SQRT2) < 1e-12);
  ok(`and the note names read right: 261.6 Hz → ${pitchLabel(261.626)}, 440 → ${pitchLabel(440)}`,
     pitchLabel(440) === 'A4' && pitchLabel(261.626).startsWith('C4'));

  /* THE CRAFT CLAIM.  Not "the law is the law" — that is proven one room over.
     This one: the jacks tune it.  Take one blown piece, crack it off, listen;
     then take the SAME piece, close the neck two seconds further, crack it off
     again, and it has gone DOWN, because f goes as the square root of the
     mouth area and the mouth is the only thing that changed much. */
  const base = makePiece();
  for (let n = 0; n < 900; n++) step(base, 1 / 600, { blow: 1, heat: 0, spin: 24, tilt: Math.PI / 2 });
  for (let n = 0; n < 900; n++) step(base, 1 / 600, { blow: 0, heat: 1, spin: 24, tilt: Math.PI / 2 });
  const wide = crackOff(structuredCloneish(base));
  for (let n = 0; n < 1500; n++)
    step(base, 1 / 600, { blow: 0, heat: 0.55, spin: 24, tilt: Math.PI / 2, jack: { s: 0.12, w: 0.06, rate: 9 } });
  const tight = crackOff(base);
  const nw = noteOf(wide), nt = noteOf(tight);
  ok(`jacked further in, the same piece drops: a ${(2000 * nw.rLip).toFixed(1)} mm mouth sang ` +
     `${nw.f.toFixed(0)} Hz (${pitchLabel(nw.f)}), a ${(2000 * nt.rLip).toFixed(1)} mm mouth sings ` +
     `${nt.f.toFixed(0)} Hz (${pitchLabel(nt.f)})`,
     nt.rLip < nw.rLip && nt.f < nw.f,
     `ΔA gives √(A'/A) = ${Math.sqrt(nt.A / nw.A).toFixed(3)}`);
}

function structuredCloneish(p){
  const q = {};
  for (const k of Object.keys(p)){
    const v = p[k];
    q[k] = (v instanceof Float64Array) ? v.slice() : v;
  }
  q.diag = null;
  return q;
}

/* ── H · THE LATHE AND THE SHELF ──────────────────────────────────────────── */
H('H · the mesh, and a vessel small enough to keep');
{
  const p = makePiece();
  for (let n = 0; n < 600; n++) step(p, 0.005, { blow: 1, heat: 0.4, spin: 24, tilt: Math.PI / 2 });
  const sides = 48;
  const L = lathe(p, sides);
  ok(`lathe: ${L.count} vertices, all finite`, L.pos.every(Number.isFinite) && L.nor.every(Number.isFinite));
  let unit = true;
  for (let v = 0; v < L.count; v += 37){
    const n = Math.hypot(L.nor[v * 3], L.nor[v * 3 + 1], L.nor[v * 3 + 2]);
    if (Math.abs(n - 1) > 1e-6) unit = false;
  }
  ok('every normal is a unit vector', unit);
  const idx = latheIndices(p.N, sides);
  ok(`${idx.length / 3} triangles, every index inside the buffer`,
     idx.length === (p.N - 1) * sides * 6 && idx.every(i => i < L.count));
  /* the seam column really is the same ring closed */
  let seam = true;
  for (let i = 0; i < p.N; i += 11){
    const a = i * (sides + 1), b = a + sides;
    for (let c = 0; c < 3; c++) if (Math.abs(L.pos[a * 3 + c] - L.pos[b * 3 + c]) > 1e-9) seam = false;
  }
  ok('the lathe closes on itself — first column === last column', seam);

  const v = crackOff(p);
  const packed = packVessel(v);
  const json = JSON.stringify(packed);
  ok(`a kept vessel is ${json.length} bytes of JSON`, json.length < 700);
  const back = unpackVessel(packed);
  const g0 = noteOf(v), g1 = noteOf(back);
  ok(`and it comes back the same shape: ${g0.f.toFixed(1)} Hz → ${g1.f.toFixed(1)} Hz through the shelf`,
     rel(g1.f, g0.f) < 0.10, `rel ${(100 * rel(g1.f, g0.f)).toFixed(1)} %`);
}

/* ── I · IT SURVIVES ABUSE ────────────────────────────────────────────────── */
H('I · the solver does not blow up when a visitor does something silly');
{
  const cases = [
    ['blowing flat out, cold, for a minute',   { blow: 1, heat: 0, spin: 0,   tilt: 0 }],
    ['blowing flat out inside the furnace',    { blow: 1, heat: 1, spin: 120, tilt: 0 }],
    ['spinning at 120 rad/s pointing down',    { blow: 0, heat: 1, spin: 120, tilt: 0 }],
    ['jacks hard on, everywhere, always',      { blow: 0, heat: 1, spin: 22,  tilt: Math.PI, jack: { s: 0.5, w: 1.0, rate: 40 } }],
    ['paddle jammed through the whole piece',  { blow: 0.4, heat: 1, spin: 22, tilt: 0, paddle: 0.001 }],
  ];
  for (const [name, ctl] of cases){
    const p = makePiece();
    const m0 = totalMass(p);
    for (let n = 0; n < 12000; n++) step(p, 0.005, ctl);
    const finite = [...p.u, ...p.r, ...p.t, ...p.T].every(Number.isFinite);
    ok(`${name}: still finite, mass held to ${rel(totalMass(p), m0).toExponential(1)}`,
       finite && rel(totalMass(p), m0) < 1e-12 && maxRadius(p) < 5 && pieceLength(p) < 5);
  }
}

console.log('\n' + (fail === 0
  ? `\x1b[32m  ${pass} checks, all green.\x1b[0m`
  : `\x1b[31m  ${fail} FAILED of ${pass + fail}.\x1b[0m`) + '\n');
process.exit(fail === 0 ? 0 : 1);
