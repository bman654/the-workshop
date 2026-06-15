// ============================================================================
//  THE CONSERVATORY · PREDATOR–PREY — Node twin of the in-page self-test.
//  Run:  node conservatory/predator-prey/core.test.mjs
//  Proves the falsifiable claim EXACT, and that the in-page core is byte-identical
//  to this module (re-extraction parity), so "self-test green" can't drift.
// ============================================================================
import {
  P, field, V, fixedPoint, linearPeriod,
  eulerStep, rk4Step, trace, traceOrbit, quarterLag, runSelfTest,
  ECO_K, agentMeanField, stepEcoCounts, headlessRun, ensembleCensus,
  censusPeriodAmp, runAgentSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\n— The full in-page self-test (the proven L–V core) —');
const r = runSelfTest();
for (const c of r.checks) check(c.name, c.pass, c.info);
check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);

console.log('\n— The agent-ecology self-test (the bridge: the crowd recovers the law) —');
const ra = runAgentSelfTest();
for (const c of ra.checks) check(c.name, c.pass, c.info);
check('agent self-test reports all green', ra.pass === ra.total, ra.pass + '/' + ra.total);

console.log('\n— Independent re-derivations (this file, not the bundled self-test) —');

// THE PARAMETERS are exactly the locked values.
{
  check('locked params a=1.1 b=0.4 c=0.4 d=0.1',
        P.a === 1.1 && P.b === 0.4 && P.c === 0.4 && P.d === 0.1);
}

// THE FIXED POINT is exactly (c/d, a/b) = (4, 2.75), and the field vanishes there.
{
  const [xs, ys] = fixedPoint();
  check('fixed point == (c/d, a/b) == (4, 2.75)', xs === 4 && ys === 2.75, '(' + xs + ', ' + ys + ')');
  const [fx, fy] = field(xs, ys);
  check('field vanishes at the fixed point (both <1e-13)', Math.abs(fx) < 1e-13 && Math.abs(fy) < 1e-13,
        'f=(' + fx.toExponential(2) + ', ' + fy.toExponential(2) + ')');
}

// THE LINEARIZED PERIOD is exactly 2π/√(ac) = 9.472…
{
  const T = linearPeriod();
  check('linear period == 2π/√(ac) == 9.472', Math.abs(T - 9.4722576) < 1e-5, 'T=' + T.toFixed(6));
}

// RK4 CONSERVES V across MANY starting orbits — flat to ~machine precision.
{
  const dt = 0.004;
  for (const [x0, y0] of [[10, 5], [6, 4], [4.5, 3], [12, 2]]) {
    const r = trace(x0, y0, dt, Math.round(linearPeriod() / dt) * 4, 'rk4');
    check('RK4 conserves V from (' + x0 + ',' + y0 + ') to <1e-10', r.driftMax < 1e-10,
          'max|ΔV|=' + r.driftMax.toExponential(2));
  }
}

// THE MATCHING NUMBERS from the verified prototype (/tmp/lv_check.mjs):
//   RK4 dt=0.004 over T=40 → 7.9e-12 ; Euler same → 3.1e-2 ; dt/4 → 1.9e-14.
{
  const dt = 0.004, T = 40, N = Math.round(T / dt);
  const rk4 = trace(10, 5, dt, N, 'rk4');
  const eul = trace(10, 5, dt, N, 'euler');
  const fine = trace(10, 5, dt / 4, N * 4, 'rk4');
  check('prototype parity: RK4 drift ≈ 7.9e-12 (< 1e-10)', rk4.driftMax < 1e-10 && rk4.driftMax > 1e-13,
        rk4.driftMax.toExponential(3));
  check('prototype parity: Euler drift ≈ 3.1e-2 (> 1e-2)', eul.driftMax > 1e-2,
        eul.driftMax.toExponential(3));
  check('prototype parity: RK4 dt/4 drift ≈ 1.9e-14 (4th order, ≥10× smaller)',
        rk4.driftMax / fine.driftMax >= 10, rk4.driftMax.toExponential(2) + ' → ' + fine.driftMax.toExponential(2));
}

// EULER LEAKS OUTWARD and MONOTONICALLY — and gets WORSE with bigger dt (the
// dt slider's promise): the drift grows monotonically in dt.
{
  const N0 = 10000;
  let prev = -1; let monotoneInDt = true;
  for (const dt of [0.002, 0.004, 0.008, 0.016]) {
    const r = trace(10, 5, dt, Math.round(N0 * 0.004 / dt), 'euler');
    check('Euler dt=' + dt + ': V drifts OUTWARD (end ΔV > 0) and monotonically',
          r.endDrift > 0 && r.monotoneOutward, 'end ΔV=' + r.endDrift.toExponential(2));
    if (r.driftMax < prev - 1e-9) monotoneInDt = false;
    prev = r.driftMax;
  }
  check('Euler drift grows monotonically with dt (bigger step ⇒ worse leak)', monotoneInDt);
}

// THE CENTER: Jacobian trace = 0, eigenvalues pure-imaginary ±i√(ac), det = ac.
{
  const [xs, ys] = fixedPoint();
  const Jtrace = (P.a - P.b * ys) + (-P.c + P.d * xs);
  const det = -(-P.b * xs) * (P.d * ys); // = b d x* y* = a c
  check('Jacobian trace == 0 at the centre (no decay/growth)', Math.abs(Jtrace) < 1e-13,
        'trace=' + Jtrace.toExponential(2));
  check('Jacobian det == a·c == ω² (eigenvalues ±i√(ac))',
        Math.abs(det - P.a * P.c) < 1e-13, 'det=' + det.toFixed(6) + '  ac=' + (P.a * P.c).toFixed(6));
}

// SMALL-LOOP PERIOD matches the linear formula; BIG-LOOP period is LONGER (the
// scope guard explorers flagged: 2π/√(ac) is the LINEARIZED period only).
{
  const dt = 0.004, T = linearPeriod();
  const small = traceOrbit(4.25, 2.75, P, dt); // tiny loop around (4, 2.75)
  const big = traceOrbit(10, 5, P, dt);         // a fat boom-bust loop
  check('small loop period ≈ 2π/√(ac) (linear regime, <2%)',
        Math.abs(small.period - T) / T < 0.02, 'T_small=' + small.period.toFixed(3) + ' vs ' + T.toFixed(3));
  check('BIG loop period is LONGER than the linear formula (nonlinear slowdown)',
        big.period > T * 1.02, 'T_big=' + big.period.toFixed(3) + ' > ' + T.toFixed(3));
}

// QUARTER-LAG: predators trail prey by ~T/4 on a small loop.
{
  const dt = 0.004;
  const orb = traceOrbit(4.25, 2.75, P, dt);
  const xs = orb.pts.map((q) => q[0]), ys = orb.pts.map((q) => q[1]);
  const lag = quarterLag(xs, ys, dt);
  check('predators trail prey by ~T/4 (cross-correlation peak)',
        Math.abs(lag - orb.period / 4) < 0.12 * orb.period,
        'lag=' + lag.toFixed(3) + '  T/4=' + (orb.period / 4).toFixed(3));
}

// DETERMINISM — two full self-test runs are byte-identical.
{
  const a = JSON.stringify(runSelfTest().detail);
  const bb = JSON.stringify(runSelfTest().detail);
  check('two full self-test runs are byte-identical (deterministic)', a === bb);
}

// ---------------------------------------------------------------------------
//  INDEPENDENT AGENT WITNESSES — re-derive the bridge claims here (not the
//  bundled agent self-test), so "agent green" can't drift either.
// ---------------------------------------------------------------------------

// THE AGENT MEAN-FIELD is byte-for-byte field() at every state we probe.
{
  let maxErr = 0;
  for (const [x, y] of [[12, 7], [3.3, 2.1], [5, 5], [1.5, 0.9]]) {
    const [ax, ay] = agentMeanField(x, y);
    const [lx, ly] = field(x, y);
    maxErr = Math.max(maxErr, Math.abs(ax - lx), Math.abs(ay - ly));
  }
  check('agent mean-field == field() to 0 (independent states)', maxErr === 0, 'max|Δ|=' + maxErr);
}

// THE DENSITY SCALE puts the center at integer counts (4·K, 2.75·K).
{
  check('ECO_K=100 ⇒ center at (400 hares, 275 lynx)',
        ECO_K === 100 && 4 * ECO_K === 400 && 2.75 * ECO_K === 275, '(' + 4 * ECO_K + ', ' + 2.75 * ECO_K + ')');
}

// THE EMERGENT PERIOD & AMPLITUDE match the RK4 orbit (re-measured here).
{
  const orb = traceOrbit(8, 4, P, 0.004);
  let oxmin = Infinity, oxmax = -Infinity;
  for (const [px] of orb.pts) { if (px < oxmin) oxmin = px; if (px > oxmax) oxmax = px; }
  const orbAmp = (oxmax - oxmin) / 2;
  const census = ensembleCensus(8, 4, 120, 24, 0.02, 7000001);
  const pa = censusPeriodAmp(census);
  const perErr = Math.abs(pa.period - orb.period) / orb.period;
  const ampErr = Math.abs(pa.xamp - orbAmp) / orbAmp;
  check('emergent census period ≈ RK4 orbit period (<5%)', pa.ncross >= 2 && perErr < 0.05,
        pa.period.toFixed(3) + ' vs ' + orb.period.toFixed(3) + ' (' + (perErr * 100).toFixed(2) + '%)');
  check('emergent ⟨x⟩ amplitude ≈ RK4 orbit x-amplitude (<5%)', ampErr < 0.05,
        pa.xamp.toFixed(3) + ' vs ' + orbAmp.toFixed(3) + ' (' + (ampErr * 100).toFixed(2) + '%)');
}

// REMOVE THE LYNX ⇒ a deterministic monotone hare explosion (no rescue).
{
  const r = headlessRun(777, 3, 0.02, { H0: Math.round(3 * ECO_K), lynxRemoved: true });
  check('cull all lynx ⇒ hares explode (deterministic growth path)',
        r.Nh > Math.round(3 * ECO_K) * 2, Math.round(3 * ECO_K) + ' → ' + r.Nh + ' hares in t=3');
}

// DETERMINISM of the count engine — same seed ⇒ identical headless run.
{
  const a = headlessRun(42, 50, 0.02, {});
  const b = headlessRun(42, 50, 0.02, {});
  check('headlessRun deterministic — same seed ⇒ identical counts',
        a.Nh === b.Nh && a.Nl === b.Nl, a.Nh === b.Nh && a.Nl === b.Nl ? 'identical' : 'DIFFER');
}

// ---------------------------------------------------------------------------
//  RE-EXTRACTION PARITY — the core inlined in index.html is byte-identical to
//  core.mjs (between the // ===== PREY-CORE sentinels), indentation-normalised.
// ---------------------------------------------------------------------------
{
  const here = dirname(fileURLToPath(import.meta.url));
  const modSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const START = '// ===== PREY-CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END PREY-CORE =====';

  const modBody = modSrc
    .slice(modSrc.indexOf('const P = {'), modSrc.indexOf('export {'))
    .trim();
  const pi = pageSrc.indexOf(START), pj = pageSrc.indexOf(END);
  check('index.html contains the PREY-CORE sentinels', pi >= 0 && pj > pi);
  if (pi >= 0 && pj > pi) {
    const pageBody = pageSrc.slice(pi + START.length, pj).trim();
    const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
    check('inlined core matches core.mjs (function bodies, indentation-normalised)',
          norm(pageBody) === norm(modBody),
          norm(pageBody) === norm(modBody) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageBody).length + ' vs mod ' + norm(modBody).length + ' chars)');
  }

  // ----- the AGENT-CORE block is inlined byte-identical too -----
  const A_START = '// ===== AGENT-CORE (byte-identical to core.mjs) =====';
  const A_END = '// ===== END AGENT-CORE =====';
  const norm = (s) => s.replace(/^\s+/gm, '').replace(/\r/g, '').trim();
  const mi = modSrc.indexOf(A_START), mj = modSrc.indexOf(A_END);
  const ai = pageSrc.indexOf(A_START), aj = pageSrc.indexOf(A_END);
  check('core.mjs & index.html both contain the AGENT-CORE sentinels',
        mi >= 0 && mj > mi && ai >= 0 && aj > ai);
  if (mi >= 0 && mj > mi && ai >= 0 && aj > ai) {
    const modAgent = modSrc.slice(mi + A_START.length, mj).trim();
    const pageAgent = pageSrc.slice(ai + A_START.length, aj).trim();
    check('inlined AGENT-CORE matches core.mjs (indentation-normalised)',
          norm(pageAgent) === norm(modAgent),
          norm(pageAgent) === norm(modAgent) ? 'byte-identical' :
            'DIFFER (page ' + norm(pageAgent).length + ' vs mod ' + norm(modAgent).length + ' chars)');
  }
}

console.log('\n' + (pass === total ? '✓ ALL ' : '✗ ') + pass + '/' + total + ' checks passed.\n');
process.exit(pass === total ? 0 : 1);
