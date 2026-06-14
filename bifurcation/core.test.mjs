import * as C from './core.mjs';

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Road Into Chaos — Node cross-check\n');

const L = C.MAPS.logistic;

// 1. The first superstable point R_0 of the logistic map is exactly r=2.
//    (x*=1/2 is the critical point; r·(1/2)(1/2)=1/2 ⇒ r=2.)
{
  const r0 = C.superstablePoint(L, 0, L.lo, 1e-3);
  ok('R₀ (superstable fixed point) of logistic map = 2.000', Math.abs(r0 - 2) < 1e-6,
     `R₀ = ${r0.toFixed(9)}`);
}

// 2. The known superstable parameters match published values to high precision.
//    R_1 = 1+√5 = 3.2360679…  (superstable 2-cycle, closed form);
//    R_2 = 3.4985616993…       (superstable 4-cycle).
{
  const R = C.superstableLadder(L, 4);
  const r1exact = 1 + Math.sqrt(5);
  ok('R₁ (superstable 2-cycle) = 1+√5 = 3.2360680', Math.abs(R[1] - r1exact) < 1e-7,
     `R₁ = ${R[1].toFixed(9)} vs ${r1exact.toFixed(9)}`);
  ok('R₂ (superstable 4-cycle) = 3.4985617', Math.abs(R[2] - 3.4985616993) < 1e-6,
     `R₂ = ${R[2].toFixed(9)}`);
}

// 3. THE HEADLINE — Feigenbaum's δ is MEASURED from the cascade, → 4.6692.
//    The ladder must be monotone increasing and crowd together, and the last
//    (most converged) ratio must land near the universal constant.
{
  const R = C.superstableLadder(L, 8);
  const monotone = R.every((v, i) => i === 0 || v > R[i - 1]);
  const { ratios, best } = C.feigenbaumRatios(R);
  const err = Math.abs(best - C.FEIGENBAUM_DELTA);
  ok('superstable ladder is monotone increasing & crowding', monotone && R.length >= 7,
     `${R.length} rungs: ${R.map(v => v.toFixed(5)).join(', ')}`);
  ok('Feigenbaum δ MEASURED from the cascade → 4.6692',
     err < 0.02,
     `δ = ${best.toFixed(5)} vs ${C.FEIGENBAUM_DELTA.toFixed(5)} (err ${err.toExponential(2)})`);
  ok('the δ estimates CONVERGE toward the constant (later ratios closer)',
     Math.abs(ratios[ratios.length - 1] - C.FEIGENBAUM_DELTA) <
     Math.abs(ratios[0] - C.FEIGENBAUM_DELTA),
     `ratios: ${ratios.map(v => v.toFixed(4)).join(' → ')}`);
}

// 4. UNIVERSALITY — the SAME δ falls out of an entirely different map (sine).
//    This is the deep claim: δ is a property of the cascade, not of the formula.
{
  const R = C.superstableLadder(C.MAPS.sine, 7);
  const { best } = C.feigenbaumRatios(R);
  const err = Math.abs(best - C.FEIGENBAUM_DELTA);
  ok('UNIVERSALITY: the sine map yields the SAME δ ≈ 4.6692',
     err < 0.05,
     `δ(sine) = ${best.toFixed(4)} (err ${err.toExponential(2)})`);
}

// 5. The Lyapunov exponent is NEGATIVE in the periodic regime (order).
//    At r=3.2 the logistic map has a stable 2-cycle ⇒ λ < 0.
{
  const lam = C.lyapunov(L, 3.2);
  ok('Lyapunov λ < 0 in the periodic window (r=3.2, stable 2-cycle)', lam < -0.01,
     `λ = ${lam.toFixed(4)}`);
}

// 6. The Lyapunov exponent is POSITIVE deep in chaos (r=4.0 is fully chaotic;
//    for the logistic map at r=4 the exact value is λ = ln 2 = 0.6931).
{
  const lam = C.lyapunov(L, 4.0);
  ok('Lyapunov λ > 0 in chaos (r=4.0) and ≈ ln 2 = 0.6931 (the exact value)',
     lam > 0 && Math.abs(lam - Math.LN2) < 0.02, `λ = ${lam.toFixed(4)} vs ln2 = ${Math.LN2.toFixed(4)}`);
}

// 7. A PERIODIC WINDOW inside chaos — the famous period-3 window at r≈3.83
//    has λ < 0 again (order re-emerging from chaos). The road is not monotone.
{
  const lam = C.lyapunov(L, 3.83);
  const p = C.periodOf(L, 3.83);
  ok('the period-3 window (r=3.83) is ORDER inside chaos: λ<0 and period=3',
     lam < 0 && p === 3, `λ = ${lam.toFixed(4)}, period = ${p}`);
}

// 8. The orbit-diagram period count tracks the cascade: 1 → 2 → 4 at the right r.
{
  const p1 = C.periodOf(L, 2.8);   // below first doubling
  const p2 = C.periodOf(L, 3.2);   // a stable 2-cycle
  const p4 = C.periodOf(L, 3.5);   // a stable 4-cycle
  ok('attractor period climbs 1 → 2 → 4 across the first doublings',
     p1 === 1 && p2 === 2 && p4 === 4, `periods @ r=2.8,3.2,3.5 = ${p1},${p2},${p4}`);
}

// 9. The accumulation point r_∞ where chaos begins is ≈ 3.5699456 (the known
//    value), recovered by δ-extrapolating the superstable ladder.
{
  const R = C.superstableLadder(L, 8);
  const rInf = C.accumulationPoint(R);
  ok('r_∞ (onset of chaos) extrapolates to ≈ 3.5699456',
     Math.abs(rInf - 3.5699456) < 0.001, `r_∞ = ${rInf.toFixed(7)}`);
}

// 10. NEGATIVE CONTROL — a GENUINELY chaotic doubling-free check: a linear map
//     x → r·x has NO period-doubling cascade, so no superstable ladder forms
//     above the trivial point. Confirms the machinery isn't manufacturing a
//     cascade out of nothing.
{
  const linear = { lo: 0, hi: 0.99, f: (r, x) => r * x, xmax: 0.5, label: 'linear' };
  const R = C.superstableLadder(linear, 4);
  ok('NEGATIVE CONTROL: a linear map x→r·x produces NO doubling ladder',
     R.length <= 1, `rungs found = ${R.length}`);
}

// 11. DETERMINISM — the measurement is a measurement, not a guess: re-running the
//     ladder is bit-for-bit identical.
{
  const a = C.superstableLadder(L, 6);
  const b = C.superstableLadder(L, 6);
  const same = a.length === b.length && a.every((v, i) => v === b[i]);
  ok('deterministic: the cascade ladder is bit-for-bit reproducible', same,
     `${a.length} rungs identical`);
}

// 12. FALSIFICATION — δ is genuinely ≈ 4.669, NOT 2, NOT e, NOT π. If someone
//     claimed the windows merely halve (δ=2) the data would refute them.
{
  const R = C.superstableLadder(L, 8);
  const { best } = C.feigenbaumRatios(R);
  ok('the measured ratio refutes "windows just halve" (δ≠2) and ≠π,e',
     Math.abs(best - 2) > 2 && Math.abs(best - Math.PI) > 1 && Math.abs(best - Math.E) > 1.5,
     `δ = ${best.toFixed(4)} is none of 2, e=${Math.E.toFixed(3)}, π=${Math.PI.toFixed(3)}`);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
