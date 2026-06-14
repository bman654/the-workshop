// ============================================================================
//  Node-side falsifiability harness for The Ulam Spiral.
//  Runs the shared in-page self-test PLUS deeper Node-only assertions at scale
//  (N up to 160000 — far past what the in-page pill can afford). These prove
//  the inlined core's math is byte-correct.
//  Run:  node core.test.mjs
// ============================================================================
import {
  sieve, isPrimeTrial,
  nToXY, xyToN, buildSpiral,
  ARMS, armValue, fitDiagonal, diagonalValues,
  POLYS, polyStreak, factorize, polyPrimeCount,
  piExact, pntRatio,
  runSelfTest,
} from './core.mjs';

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { console.log(`FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
};

console.log('The Ulam Spiral — core.test.mjs\n');

// --- First, the shared in-page self-test must be fully green (at N=20000). ---
const st = runSelfTest(20000);
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

// --- Deeper Node-only assertions (the heavy checks the page can't afford). ---
const BIG = 160000;

// A. EXHAUSTIVE sieve ⟺ trial division to N=160000, 0 mismatches.
{
  const S = sieve(BIG);
  let bad = 0, firstBad = '';
  for (let n = 0; n <= BIG; n++) {
    if ((S[n] === 1) !== isPrimeTrial(n)) { if (!bad) firstBad = `n=${n}`; bad++; }
  }
  ok(`A. sieve ⟺ trial division to N=${BIG}, 0 mismatches`, bad === 0,
    bad ? `${bad} disagree (first ${firstBad})` : `${BIG + 1} integers`);
}

// B. nToXY bijection to 160000 — exactly N distinct coords, all round-trip,
//    all match the from-scratch simulation.
{
  const { pos } = buildSpiral(BIG);
  const seen = new Set();
  let mism = 0, collide = 0, rt = 0;
  for (let n = 1; n <= BIG; n++) {
    const [x, y] = nToXY(n);
    const sim = pos.get(n);
    if (!sim || sim[0] !== x || sim[1] !== y) mism++;
    const key = x + ',' + y;
    if (seen.has(key)) collide++; else seen.add(key);
    if (xyToN(x, y) !== n) rt++;
  }
  ok(`B. nToXY bijection to ${BIG}: ${BIG} distinct coords, round-trips, === simulation`,
    mism === 0 && collide === 0 && rt === 0 && seen.size === BIG,
    `mism=${mism} collide=${collide} rt=${rt} distinct=${seen.size}`);
}

// C. All four preset streaks + factorizations exact (derived live).
{
  const e = polyStreak(POLYS.euler.f);
  const e2 = polyStreak(POLYS.euler2.f);
  const q4 = polyStreak(POLYS.q4.f);
  const leg = polyStreak(POLYS.legendre.f);
  const good =
    e.streak === 41 && e.breakN === 41 && e.breakVal === 1681 && e.factorization === '41×41' &&
    e2.streak === 40 && e2.breakN === 40 && e2.breakVal === 1681 && e2.factorization === '41×41' &&
    q4.streak === 21 && q4.breakN === 21 && q4.breakVal === 1763 && q4.factorization === '41×43' &&
    leg.streak === 29 && leg.breakN === 29 && leg.breakVal === 1711 && leg.factorization === '29×59';
  ok('C. preset streaks/factorizations exact: 41·40·21·29',
    good,
    `euler ${e.streak}/${e.factorization}, euler2 ${e2.streak}/${e2.factorization}, q4 ${q4.streak}/${q4.factorization}, leg ${leg.streak}/${leg.factorization}`);
}

// D. 8 random off-centre 45° diagonals: fitDiagonal.a === 4 always, and it
//    predicts the next 15 cells exactly. (Generic diagonals, not the arms.)
{
  let good = true, bad = '';
  // deterministic LCG so the test is reproducible
  let seed = 0x1234abcd;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let trial = 0; trial < 8; trial++) {
    // pick a random start cell well off-centre and a random 45° step direction
    const x0 = Math.floor((rng() - 0.5) * 120);
    const y0 = Math.floor((rng() - 0.5) * 120);
    const sx = rng() < 0.5 ? 1 : -1;
    const sy = rng() < 0.5 ? 1 : -1;
    const vals = diagonalValues(x0, y0, sx, sy, 18);   // need 3 to fit + 15 to predict
    const fit = fitDiagonal([vals[0], vals[1], vals[2]]);
    if (fit.a !== 4) { good = false; bad = `trial ${trial}: a=${fit.a} (start ${x0},${y0} step ${sx},${sy})`; break; }
    // predict cells t=3..17
    for (let t = 3; t < 18; t++) {
      const pred = fit.a * t * t + fit.b * t + fit.c;
      if (pred !== vals[t]) { good = false; bad = `trial ${trial} t=${t}: pred ${pred} ≠ ${vals[t]}`; break; }
    }
    if (!good) break;
  }
  ok('D. 8 random 45° diagonals: fitDiagonal.a===4, predicts next 15 cells exactly', good, bad);
}

// E. piExact(100000)===9592, piExact(160000)===14683.
{
  const S = sieve(BIG);
  const pi100k = piExact(100000, S);
  const pi160k = piExact(160000, S);
  ok('E. π(100000)=9592 and π(160000)=14683 (exact, sieve-counted)',
    pi100k === 9592 && pi160k === 14683,
    `π(100k)=${pi100k}, π(160k)=${pi160k}`);
}

// F. PNT band genuinely tightening at scale:
//    ratio(160k) < ratio(20k) < ratio(1k) AND ratio(160k) ∈ [1.08, 1.11].
{
  const r1k = pntRatio(1000, sieve(1000));
  const r20k = pntRatio(20000, sieve(20000));
  const r160k = pntRatio(BIG, sieve(BIG));
  const good = r160k < r20k && r20k < r1k && r160k >= 1.08 && r160k <= 1.11;
  ok('F. PNT band tightens at scale: ratio(160k)<ratio(20k)<ratio(1k), ratio(160k)∈[1.08,1.11]',
    good,
    `1k=${r1k.toFixed(4)} 20k=${r20k.toFixed(4)} 160k=${r160k.toFixed(4)}`);
}

console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);
