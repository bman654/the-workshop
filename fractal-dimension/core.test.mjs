// ============================================================================
//  The Coastline Rule — headless self-test (the Node twin).
//  index.html's runSelfTest() mirrors this battery exactly; the topbar chip
//  reports N/N. `node core.test.mjs` is the DoD gate.
//
//  This is an INSTRUMENT-WITH-A-PROOF: the register is "prove the theorem", and
//  the monotone + divergence checks ARE the payoff-liveness — the tally's
//  refusal-to-settle is asserted at the computation level, and the smooth
//  control's convergence is asserted as its foil.
// ============================================================================
import {
  kochCoast, shippedCoast, smoothCoast, walkDividers, richardson,
  spanLadder, sweep, KOCH_D, KOCH_BASE, SHIPPED_SEED, SHIPPED_GEN
} from './core.mjs';

let passed = 0, failed = 0;
const results = [];
function ok(name, cond, info){
  const p = !!cond;
  if(p) passed++; else failed++;
  results.push({ name, pass:p, info: info || '' });
}

const coast  = shippedCoast();
const smooth = smoothCoast(3);
const spans  = spanLadder(KOCH_BASE, 6);
const lens   = sweep(coast, spans);
const slens  = sweep(smooth, spans);

// (a) MONOTONE — L non-decreasing as s→0 on the shipped fractal coast.
{
  let mono = true, strict = true;
  for(let i = 1; i < lens.length; i++){ if(lens[i] < lens[i-1]) mono = false; if(lens[i] <= lens[i-1]) strict = false; }
  ok('(a) L is monotone non-decreasing as the span shrinks (measured strictly increasing)',
     mono && strict, 'L = [' + lens.map(l=>l.toFixed(3)).join(', ') + ']');
}

// (a′) DIVERGENCE — the tally refuses to settle: finest/coarsest > 2.5.
{
  const ratio = lens[lens.length-1] / lens[0];
  ok("(a′) the coast's tally diverges — L_finest / L_coarsest > 2.5",
     ratio > 2.5, 'ratio = ' + ratio.toFixed(3) + '×');
}

// (b) SLOPE → D — richardson recovers KOCH_D with D = 1 + slope.
{
  const R = richardson(spans, lens);
  const err = Math.abs(R.D - KOCH_D);
  ok('(b) log–log slope recovers the coast dimension (D = 1 + slope ≈ log4/log3)',
     err < 0.02 && R.r2 > 0.999, 'D = ' + R.D.toFixed(4) + ' (err ' + err.toFixed(4) + ', R² ' + R.r2.toFixed(4) + ')');
}

// (b-EXACT) — on the SHIPPED coast, steps === 4^k and |L − (4/3)^k·base| < 1e-9.
{
  let allExact = true, detail = [];
  for(let k = 1; k <= 6; k++){
    const s = KOCH_BASE / Math.pow(3, k);
    const w = walkDividers(coast, s);
    const wantSteps = 4 ** k;
    const wantL = Math.pow(4/3, k) * KOCH_BASE;
    const stepsOK = w.steps === wantSteps;
    const lenOK = Math.abs(w.L - wantL) < 1e-9;
    if(!stepsOK || !lenOK) allExact = false;
    if(k <= 3 || !stepsOK || !lenOK) detail.push('k'+k+':'+w.steps+(stepsOK?'':'≠'+wantSteps));
  }
  ok('(b-EXACT) shipped coast walks EXACTLY 4^k steps at span base/3^k, L = (4/3)^k·base',
     allExact, detail.join(' '));
}

// (b′) SEED-INVARIANCE — a different seed → a different coast, D within 0.03.
{
  const c2 = kochCoast(SHIPPED_GEN, SHIPPED_SEED + 5);
  const differs = JSON.stringify(c2) !== JSON.stringify(coast);
  const R = richardson(spans, sweep(c2, spans));
  const err = Math.abs(R.D - KOCH_D);
  ok('(b′) a different seed is a different coast yet D stays within 0.03 of log4/log3',
     differs && err < 0.03, 'D = ' + R.D.toFixed(4) + ' (err ' + err.toFixed(4) + ')');
}

// (c) NEG-CONTROL — the smooth shore CONVERGES; and the CONTRAST.
{
  const ratio = slens[slens.length-1] / slens[0];
  const R = richardson(spans, slens);
  const convergent = ratio < 1.05 && Math.abs(R.slope) < 0.02 && Math.abs(R.D - 1) < 0.02;
  ok('(c) the smooth control converges — ratio < 1.05, |slope| < 0.02, |D−1| < 0.02',
     convergent, 'ratio ' + ratio.toFixed(3) + '×, slope ' + R.slope.toFixed(3) + ', D ' + R.D.toFixed(3));
  const fractalGrowth = lens[lens.length-1] / lens[0];
  const contrast = fractalGrowth / ratio;
  ok('(c-CONTRAST) the fractal fan OPENS while the smooth fan SHUTS — growth ratio > 3×',
     contrast > 3, 'fractal ' + fractalGrowth.toFixed(2) + '× vs smooth ' + ratio.toFixed(2) + '× → ' + contrast.toFixed(2) + '×');
}

// EDGE CASES ------------------------------------------------------------------
// straight edge → L === exact length.
{
  const straight = [[0.1,0.5],[0.9,0.5]];
  const w = walkDividers(straight, 0.2);
  ok('edge: a straight edge measures its EXACT length (no length invented)',
     Math.abs(w.L - 0.8) < 1e-12, 'L = ' + w.L.toFixed(6) + ' (exact 0.8)');
}
// span > whole coast → steps === 0, L === crow-flies chord.
{
  const w = walkDividers(coast, 5);   // wider than the whole coast
  const crow = Math.hypot(coast[coast.length-1][0]-coast[0][0], coast[coast.length-1][1]-coast[0][1]);
  ok('edge: a span wider than the coast takes 0 steps and reads the crow-flies chord',
     w.steps === 0 && Math.abs(w.L - crow) < 1e-12, 'steps ' + w.steps + ', L ' + w.L.toFixed(4) + ' = chord ' + crow.toFixed(4));
}
// degenerate 1-step.
{
  const line = [[0,0],[1,0]];
  const w = walkDividers(line, 1);
  ok('edge: a single exact step lands one foot at the far end (1 step, residual 0)',
     w.steps === 1 && w.residual < 1e-12 && w.feet.length === 2, 'steps ' + w.steps + ', residual ' + w.residual.toExponential(1));
}
// zero-length coast → L === 0 (no length invented from a point).
{
  const point = [[0.5,0.5],[0.5,0.5]];
  const w = walkDividers(point, 0.1);
  ok('edge: a zero-length coast has L = 0 — a point fakes no length',
     w.L === 0 && w.steps === 0, 'L = ' + w.L);
}
// every full-step chord === span, and feet.length === steps + 1.
{
  const w = walkDividers(coast, 0.05);
  let chordsOK = true;
  for(let i = 1; i <= w.steps; i++){
    const d = Math.hypot(w.feet[i][0]-w.feet[i-1][0], w.feet[i][1]-w.feet[i-1][1]);
    if(Math.abs(d - 0.05) > 1e-6) chordsOK = false;
  }
  ok('invariant: every full-step chord equals the span, and feet.length === steps + 1',
     chordsOK && w.feet.length === w.steps + 1, 'steps ' + w.steps + ', feet ' + w.feet.length);
}
// seed-pure: identical inputs → identical L (bit-for-bit).
{
  const a = walkDividers(shippedCoast(), 0.037).L;
  const b = walkDividers(shippedCoast(), 0.037).L;
  ok('seed-pure: identical coast + span ⇒ identical L (bit-for-bit)', a === b, 'L = ' + a.toFixed(9));
}

// ----------------------------------------------------------------------------
const total = passed + failed;
console.log('\n  The Coastline Rule — core.test.mjs : ' + passed + '/' + total + '\n');
for(const r of results) console.log('  ' + (r.pass ? '✓' : '✗') + ' ' + r.name + (r.info ? '\n      ' + r.info : ''));
console.log('');
if(failed > 0){ console.error('  FAILED ' + failed + ' check(s).\n'); process.exit(1); }
console.log('  all green.\n');
