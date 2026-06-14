// The Carnot Engine — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runCoreTests() AND extends assertions (3) and (4) to the
//   thousands/exhaustive regime the in-page pill can't afford live.
import * as C from './core.mjs';

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Engine Room · The Carnot Engine — Node cross-check\n');

// ── the shared core self-test (identical to the in-page pill) ───────────────
console.log('— shared runCoreTests() (same assertions the in-page pill runs) —');
{
  const res = C.runCoreTests({ grid: 6000, triples: 500, seed: 7 });
  for (const c of res.checks) ok(c.name, c.ok, c.info);
}

console.log('\n— Node-only extensions (the exhaustive regime) —');

const TOL_EXACT = 1e-12;
const TOL_W = 1e-9;

// EXTEND (3)★ — exactness over THOUSANDS of random triples, both γ.
{
  // deterministic PRNG
  let s = 0xC0FFEE ^ 12345;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  let maxErr = 0, worst = '';
  const N = 5000;
  for (let k = 0; k < N; k++) {
    const Tc = pick(120, 700);
    const Th = Tc + pick(20, 900);
    const r = pick(1.2, 20);
    const g = rnd() < 0.5 ? C.GAMMA_MONO : C.GAMMA_DIATOMIC;
    const cyc = C.carnotStates(Th, Tc, r, g);
    const ht = C.heatByEntropy(cyc);
    const eta = ht.W_thermo / ht.Q_h;
    const e = Math.abs(eta - C.carnotEfficiency(Th, Tc));
    if (e > maxErr) { maxErr = e; worst = `Th=${Th.toFixed(1)} Tc=${Tc.toFixed(1)} r=${r.toFixed(2)} γ=${g.toFixed(3)}`; }
  }
  ok(`(3-ext)★ η == 1−Tc/Th over ${N} random triples — exact to ~1e-12`,
     maxErr < TOL_EXACT, `max |Δη| = ${maxErr.toExponential(2)}  @ ${worst}`);
}

// EXTEND (1)★ — Path-1 vs Path-2 work agreement on MANY triples, grid-limited tol.
{
  let s = 0xBEEF ^ 999;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  let maxRel = 0, worst = '';
  const N = 200;
  for (let k = 0; k < N; k++) {
    const Tc = pick(200, 500), Th = Tc + pick(60, 500), r = pick(1.5, 8);
    const g = rnd() < 0.5 ? C.GAMMA_MONO : C.GAMMA_DIATOMIC;
    const cyc = C.carnotStates(Th, Tc, r, g);
    const wa = C.workByArea(cyc, 6000).W;
    const wt = C.heatByEntropy(cyc).W_thermo;
    const rel = Math.abs(wa - wt) / Math.abs(wt);
    if (rel > maxRel) { maxRel = rel; worst = `Th=${Th.toFixed(0)} Tc=${Tc.toFixed(0)} r=${r.toFixed(2)}`; }
  }
  ok(`(1-ext)★ ∮P dV (geometry) == Q_h−Q_c (heat) over ${N} triples — grid-limited ~1e-9`,
     maxRel < TOL_W, `max relative Δ = ${maxRel.toExponential(2)}  @ ${worst}`);
}

// EXTEND (4)★ — EXHAUSTIVE lobe enumeration: scan a dense grid of (Th,Tc,r) and
// BOTH reshape modes, asserting EVERY one loses to Carnot strictly. This is the
// computational stand-in for "no operated cycle ever exceeds the bound".
{
  let allBelow = true, count = 0, minMargin = Infinity, worst = '';
  for (let Tc = 250; Tc <= 450; Tc += 50) {
    for (let Th = Tc + 100; Th <= Tc + 500; Th += 100) {
      for (let r = 2; r <= 8; r += 1) {
        const cyc = C.carnotStates(Th, Tc, r, C.GAMMA_MONO);
        const etaC = C.carnotEfficiency(Th, Tc);
        for (const mode of ['isoV', 'isoP']) {
          const res = C.runCycle(cyc.n, cyc.gamma, C.reshapedLegs(cyc, mode), 4000);
          const within = res.Tmin >= Tc - 1e-6 && res.Tmax <= Th + 1e-6;
          const margin = etaC - res.eta;
          count++;
          if (!(within && margin > 1e-6)) { allBelow = false; worst = `${mode} Th=${Th} Tc=${Tc} r=${r}: η=${res.eta.toFixed(5)} Carnot=${etaC.toFixed(5)} within=${within}`; }
          if (margin < minMargin) minMargin = margin;
        }
      }
    }
  }
  ok(`(4-ext)★ EXHAUSTIVE: all ${count} reshaped lobes (isoV+isoP) lose to Carnot strictly`,
     allBelow, allBelow ? `smallest margin below Carnot across all = ${minMargin.toExponential(2)}` : worst);
}

// EXTEND (7)★ — ΔS_universe monotone in ΔT, strictly positive for ΔT>0, and the
// Gouy–Stodola lost-work is positive and grows with the irreversibility.
{
  const base = C.carnotStates(500, 300, 3, C.GAMMA_MONO);
  let monotone = true, prev = -1;
  for (let dT = 0; dT <= 100; dT += 10) {
    const led = C.irreversibleLedger(base, dT);
    if (dT === 0 && Math.abs(led.dS_universe) > TOL_EXACT) monotone = false;
    if (dT > 0 && !(led.dS_universe > 0 && led.W_lost > 0)) monotone = false;
    if (led.dS_universe < prev - 1e-12) monotone = false;
    prev = led.dS_universe;
  }
  ok('(7-ext)★ ΔS_universe == 0 at ΔT=0, > 0 for ΔT>0, monotone increasing in the leak',
     monotone, `swept ΔT = 0…100 K, all consistent`);
}

// (10-ext) the from-scratch RK4 adiabat stepper lands on T_c to <1e-6 K across γ,r.
{
  let maxErr = 0;
  for (const g of [C.GAMMA_MONO, C.GAMMA_DIATOMIC]) {
    for (let r = 2; r <= 10; r++) {
      const cyc = C.carnotStates(600, 280, r, g);
      const wa = C.workByArea(cyc, 8000);
      maxErr = Math.max(maxErr, Math.abs(wa.adiabatEnds.T3 - cyc.T_c), Math.abs(wa.adiabatEnds.T1 - cyc.T_h));
    }
  }
  ok('(10-ext) RK4 adiabat stepper endpoint == closed-form across γ∈{5/3,7/5}, r=2…10',
     maxErr < 1e-6, `max endpoint error = ${maxErr.toExponential(2)} K`);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
