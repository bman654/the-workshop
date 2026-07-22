/* ============================================================================
 *  wave.twin.mjs — the Pendulum Wave PAYOFF-LIVENESS twin (headless, Node).
 *  Run:  node cavern/pendulum-wave/wave.twin.mjs   (exit 0 = green; non-0 = red)
 *
 *  This bench proves NO theorem — it is pure delight. But delight owes a liveness:
 *  its PAYOFF must actually FIRE. This drives the REAL core + model (buildWave on
 *  tools/dynamics/verlet.mjs, the same bytes the forge-inlined page runs) — never a
 *  canvas pointer event — and asserts the five things the eye is promised:
 *
 *    1 · REALIGNMENT FIRES — released in phase, the order parameter R(0) ≈ 1, it
 *        scatters, and it returns to a unison crest at the recurrence: R(T_cycle)
 *        > 0.98, and the LAST crest before T_cycle lands within ±1.5% of T_cycle.
 *    2 · CHAOS EN ROUTE — somewhere in the middle third the phases fully scatter:
 *        min R over t ∈ (0.15, 0.85)·T_cycle < 0.35.
 *    3 · A TRAVELLING WAVE EARLY — in the first ~5% the phase gradient across the
 *        row is smooth and monotone (each faster bob leads its slower neighbour).
 *    4 · THE SNAKE AT T/2 — at half-time the phases collapse to TWO anti-phase
 *        clusters, split by the parity of (M+n).
 *    5 · GRADUATED — the measured periods P̂_n are strictly monotone and each sits
 *        on its calibration target (the frozen table is honest).
 *
 *  Also: FROZEN_L reproduces a fresh calibrate() to integration residue (the frozen
 *  table isn't a stale artefact — the deterministic core regenerates it).
 * ============================================================================ */

import {
  buildWave, calibrate, makeWorld, lengthLaw, orderParam,
  FROZEN_L, FROZEN_P, PRESETS, SUBSTEP, THETA0, G, N,
} from './model.mjs';

let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

/* run the wave for `seconds`, sampling R(t) every `sampleDt`. Returns the sample
 * arrays + the wave handle (parked at the end). */
function runWave(presetKey, seconds, sampleDt){
  const Ls = FROZEN_L[presetKey], Ps = FROZEN_P[presetKey];
  const wave = buildWave(Ls, { g: G, periods: Ps });
  wave.releaseAll(THETA0);
  const STEPS = Math.round(seconds / SUBSTEP);
  const every = Math.max(1, Math.round(sampleDt / SUBSTEP));
  const ts = [], Rs = [];
  for (let s = 0; s <= STEPS; s++){
    if (s % every === 0){ ts.push(s * SUBSTEP); Rs.push(wave.R()); }
    wave.stepWave(SUBSTEP);
  }
  return { wave, ts, Rs };
}

/* ── 1 · REALIGNMENT FIRES ──────────────────────────────────────────────────── */
for (const key of ['contemplative', 'lively']){
  const Tc = PRESETS[key].Tcycle;
  const { ts, Rs } = runWave(key, Tc * 1.02, 0.02);
  const R0 = Rs[0];
  // nearest sample to T_cycle
  let iT = 0, best = Infinity;
  for (let i = 0; i < ts.length; i++){ const d = Math.abs(ts[i] - Tc); if (d < best){ best = d; iT = i; } }
  const Rt = Rs[iT];
  // the last crest (local R maximum above 0.95) before/at T_cycle, and its time
  let crestT = -1, crestR = 0;
  for (let i = 2; i < ts.length - 2; i++){
    if (ts[i] > Tc * 1.02) break;
    if (Rs[i] > 0.95 && Rs[i] >= Rs[i - 1] && Rs[i] >= Rs[i + 1] && ts[i] > Tc * 0.4){
      crestT = ts[i]; crestR = Rs[i];
    }
  }
  const crestErr = crestT > 0 ? Math.abs(crestT - Tc) / Tc : 1;
  check('1 · ' + key + ': R(0) ≈ 1 (released in phase)', R0 > 0.999, 'R(0) = ' + R0.toFixed(4));
  check('1 · ' + key + ': R(T_cycle) > 0.98 (unison crest returns)', Rt > 0.98,
        'R(' + Tc + 's) = ' + Rt.toFixed(4));
  check('1 · ' + key + ': last crest within ±1.5% of T_cycle', crestErr < 0.015,
        'crest @ ' + crestT.toFixed(2) + 's (R=' + crestR.toFixed(3) + ') · err ' + (crestErr * 100).toFixed(2) + '%');
}

/* ── 2 · CHAOS EN ROUTE (min R in the middle third is low) ───────────────────── */
{
  const Tc = PRESETS.contemplative.Tcycle;
  const { ts, Rs } = runWave('contemplative', Tc, 0.02);
  let minR = Infinity, minT = 0;
  for (let i = 0; i < ts.length; i++){
    if (ts[i] > 0.15 * Tc && ts[i] < 0.85 * Tc && Rs[i] < minR){ minR = Rs[i]; minT = ts[i]; }
  }
  check('2 · chaos en route: min R over (0.15,0.85)·T_cycle < 0.35', minR < 0.35,
        'min R = ' + minR.toFixed(3) + ' @ ' + minT.toFixed(2) + 's');
}

/* ── 3 · A TRAVELLING WAVE EARLY (monotone phase gradient in first ~5%) ──────── */
{
  const Tc = PRESETS.contemplative.Tcycle;
  const Ls = FROZEN_L.contemplative, Ps = FROZEN_P.contemplative;
  const wave = buildWave(Ls, { g: G, periods: Ps });
  wave.releaseAll(THETA0);
  const tSample = 0.045 * Tc;                       // ~4.5% in
  const STEPS = Math.round(tSample / SUBSTEP);
  for (let s = 0; s < STEPS; s++) wave.stepWave(SUBSTEP);
  const ph = wave.phases();
  // Bring each neighbour phase-difference onto (−π,π] to undo the atan2 branch cut,
  // then work with the UNWRAPPED gradient — the travelling wave is a smooth ramp of
  // phase across the row even once individual bobs have crossed ±π. (Because ω_n is
  // LINEAR in n — ω_n = 2π(M+n)/T_cycle — the true per-bob step is a CONSTANT
  // 2π·t/T_cycle, so a real travelling wave is perfectly uniform here.)
  const wrap = (d) => { while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI; return d; };
  const diffs = [];
  for (let i = 1; i < ph.length; i++) diffs.push(wrap(ph[i] - ph[i - 1]));
  // released from a +θ₀ crest at rest, every phase advances as −ω_n·t, so the ramp
  // runs monotonically in ONE direction across the row (its sign is just the swing
  // sense — the travelling wave is the same either way).
  const mono = diffs.every(d => d > 0) || diffs.every(d => d < 0);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  let worst = 0; for (const d of diffs) worst = Math.max(worst, Math.abs(d - mean));
  const smooth = diffs.every(d => Math.abs(d - mean) < 0.6 * Math.abs(mean));   // near-uniform: no tangle
  check('3 · travelling wave early: phase gradient monotone across the row', mono,
        'unwrapped φ runs one way in n at t=' + tSample.toFixed(2) + 's · total ramp ' +
        diffs.reduce((a, b) => a + b, 0).toFixed(3) + ' rad');
  check('3 · travelling wave early: gradient smooth & near-uniform (no tangle yet)', smooth,
        'per-bob step ' + mean.toFixed(3) + ' rad · worst deviation ' + worst.toFixed(4) + ' rad');
}

/* ── 4 · THE SNAKE AT T/2 (two anti-phase clusters, parity of M+n) ───────────── */
{
  const key = 'contemplative';
  const Tc = PRESETS[key].Tcycle, M = PRESETS[key].M;
  const Ls = FROZEN_L[key], Ps = FROZEN_P[key];
  const wave = buildWave(Ls, { g: G, periods: Ps });
  wave.releaseAll(THETA0);
  const STEPS = Math.round((Tc / 2) / SUBSTEP);
  for (let s = 0; s < STEPS; s++) wave.stepWave(SUBSTEP);
  const ph = wave.phases();
  // each bob should be near φ≈0 (even M+n) or φ≈±π (odd M+n). Measure how close each
  // sits to the crest its parity predicts.
  let worstEven = 0, worstOdd = 0, ok = true;
  for (let i = 0; i < N; i++){
    const even = ((M + i) % 2 === 0);
    // distance to 0 or to π on the circle
    const to0 = Math.abs(Math.atan2(Math.sin(ph[i]), Math.cos(ph[i])));         // |φ| in [0,π]
    const toPi = Math.PI - to0;
    if (even){ worstEven = Math.max(worstEven, to0); if (to0 > 0.5) ok = false; }
    else     { worstOdd  = Math.max(worstOdd,  toPi); if (toPi > 0.5) ok = false; }
  }
  check('4 · snake at T/2: two anti-phase clusters split by parity of (M+n)', ok,
        'even-parity bobs within ' + worstEven.toFixed(3) + ' rad of φ=0 · odd within ' +
        worstOdd.toFixed(3) + ' rad of φ=π (both < 0.5)');
}

/* ── 5 · GRADUATED (measured periods strictly monotone, on target) ──────────── */
{
  const key = 'contemplative';
  const Ps = FROZEN_P[key], Ls = FROZEN_L[key];
  const { measured } = calibrate(makeWorld, Ps, Ls, G, THETA0);
  let mono = true, worstErr = 0;
  for (let i = 0; i < N; i++){
    worstErr = Math.max(worstErr, Math.abs(measured[i] - Ps[i]) / Ps[i]);
    if (i > 0 && measured[i] >= measured[i - 1]) mono = false;
  }
  check('5 · graduated: measured periods strictly monotone (long → short)', mono,
        'P̂ from ' + measured[0].toFixed(3) + 's down to ' + measured[N - 1].toFixed(3) + 's');
  check('5 · graduated: each period sits on its calibration target (<0.3%)', worstErr < 0.003,
        'worst |ΔP|/P = ' + (worstErr * 100).toFixed(4) + '%');
}

/* ── FROZEN_L reproduces a fresh calibration (the table is honest) ───────────── */
{
  let worst = 0;
  for (const key of ['contemplative', 'lively']){
    const Ps = FROZEN_P[key];
    const seed = lengthLaw({ g: G, N, Tcycle: PRESETS[key].Tcycle, M: PRESETS[key].M }).Ls;
    const { Ls: fresh } = calibrate(makeWorld, Ps, seed, G, THETA0);
    for (let i = 0; i < N; i++) worst = Math.max(worst, Math.abs(fresh[i] - FROZEN_L[key][i]) / FROZEN_L[key][i]);
  }
  check('FROZEN_L reproduces a fresh calibrate() (deterministic, no drift)', worst < 1e-4,
        'worst relative diff ' + worst.toExponential(2));
}

console.log('\nThe Pendulum Wave — wave.twin.mjs (payoff liveness)');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
