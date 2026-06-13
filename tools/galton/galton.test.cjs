#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   galton.test.cjs — the Galton board's headless self-test. Requires the SAME
   core the page inlines (tools/galton/galton.js), so the green chip in the
   browser and this Node run prove the IDENTICAL math. Run:
       node tools/galton/galton.test.cjs

   The crux this proves:
     • The IDEAL is exactly binomial — binomialPMF(rows,p) sums to 1, has mean
       rows·q and variance rows·p·q (q=1-p), and matches hand-checked small cases
       (Pascal's row). This part is an EXACT identity.
     • The SIMULATION converges to it — a large seeded run's χ² goodness-of-fit to
       the binomial PMF does NOT reject at α (statistic < critical value), at
       p=0.5 AND a biased p. This part is a STATISTICAL claim, stated as such.
     • Every path is valid; the run is deterministic; empirical moments track the
       theory and tighten with N.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const G = require('./galton.js');

let pass = 0, total = 0;
const fails = [];
function check(name, cond, note) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (note ? '  — ' + note : '')); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name + (note ? '  — ' + note : '')); }
}

console.log('Galton board self-test\n');

/* ─────────────────────────────────────────────────────────────────────────
   PART A — the shared CORE self-test (the exact object the in-page chip runs).
   The green chip must report the same count.
   ───────────────────────────────────────────────────────────────────────── */
const core = G.runSelfTest();
console.log('  [shared core — same code path as the in-page chip]');
core.results.forEach((r, i) => {
  check('core #' + (i + 1) + ' ' + r.name, r.pass, r.note);
});
console.log('');

/* ─────────────────────────────────────────────────────────────────────────
   PART B — extra Node-side assertions that harden the proof.
   ───────────────────────────────────────────────────────────────────────── */
console.log('  [hardening]');

/* B1. logChoose / choose reproduce small Pascal triangle rows EXACTLY. */
{
  const pascal = {
    4: [1, 4, 6, 4, 1],
    5: [1, 5, 10, 10, 5, 1],
    6: [1, 6, 15, 20, 15, 6, 1],
    8: [1, 8, 28, 56, 70, 56, 28, 8, 1]
  };
  let ok = true, where = '';
  for (const n of Object.keys(pascal)) {
    const row = pascal[n];
    for (let k = 0; k < row.length; k++) {
      if (G.choose(+n, k) !== row[k]) { ok = false; where = `C(${n},${k})=${G.choose(+n, k)}≠${row[k]}`; break; }
    }
    if (!ok) break;
  }
  check('B1 binomial coefficients match Pascal exactly (n=4,5,6,8)', ok, where || 'C(n,k) integer-exact for the board range');
}

/* B2. binomialPMF sums to 1 across the FULL UI row range and several p, with
   moments matching rows·q and rows·p·q to ~1e-12. */
{
  let ok = true, where = '', maxSum = 0, maxMom = 0;
  const ps = [0.1, 0.25, 0.5, 0.62, 0.88];
  for (let rows = G.ROWS_MIN; rows <= G.ROWS_MAX && ok; rows++) {
    for (const p of ps) {
      const q = 1 - p;
      const pmf = G.binomialPMF(rows, p);
      let s = 0, m = 0, m2 = 0;
      for (let k = 0; k <= rows; k++) { s += pmf[k]; m += k * pmf[k]; m2 += k * k * pmf[k]; }
      maxSum = Math.max(maxSum, Math.abs(s - 1));
      const variance = m2 - m * m;
      maxMom = Math.max(maxMom, Math.abs(m - rows * q), Math.abs(variance - rows * p * q));
      if (Math.abs(s - 1) > 1e-12 || Math.abs(m - rows * q) > 1e-9 || Math.abs(variance - rows * p * q) > 1e-9) {
        ok = false; where = `rows=${rows} p=${p} Σ=${s} m=${m} v=${variance}`; break;
      }
    }
  }
  check('B2 PMF Σ=1, mean=rows·q, var=rows·p·q across rows 4..16 × p', ok,
    where || `Σ-err ≤ ${maxSum.toExponential(1)}, moment-err ≤ ${maxMom.toExponential(1)}`);
}

/* B3. A LARGE seeded convergence run (≥100k) does NOT reject the binomial at
   α=0.01, across several seeds and BOTH fair and biased p — and report the χ²,
   df, critical value, and p-value for each (the headline evidence). */
{
  const alpha = 0.01;
  const runs = [
    { seed: 'estate-fair',  rows: 12, p: 0.50, n: 100000 },
    { seed: 'estate-fair2', rows: 16, p: 0.50, n: 150000 },
    { seed: 'estate-bias',  rows: 12, p: 0.30, n: 120000 },
    { seed: 'estate-bias2', rows: 10, p: 0.72, n: 120000 }
  ];
  let ok = true, where = '';
  console.log('    χ² goodness-of-fit vs the exact binomial PMF (α=0.01):');
  for (const r of runs) {
    const sim = G.simulate(r.seed, r.rows, r.p, r.n);
    const pmf = G.binomialPMF(r.rows, r.p);
    const cs = G.chiSquare(sim.hist, pmf);
    const crit = G.chiSquareCritical(alpha, cs.df);
    const pv = G.chiSquarePValue(cs.stat, cs.df);
    const verdict = cs.stat < crit ? 'do-not-reject' : 'REJECT';
    console.log(`      seed=${r.seed} rows=${r.rows} p=${r.p} N=${r.n}: ` +
      `χ²=${cs.stat.toFixed(3)} df=${cs.df} crit=${crit.toFixed(3)} ` +
      `p-value=${pv.toFixed(4)} → ${verdict}`);
    if (cs.stat >= crit) { ok = false; where = `${r.seed} REJECTED (χ²=${cs.stat.toFixed(2)} ≥ ${crit.toFixed(2)})`; }
  }
  check('B3 ≥100k seeded runs do NOT reject the binomial (fair + biased, α=0.01)', ok,
    where || 'all four runs consistent with Binomial(rows, 1-p)');
}

/* B4. The χ² machinery itself is calibrated: chiSquareCDF/PValue agree with
   known χ² table values, and a histogram drawn from the WRONG distribution
   (uniform over bins) IS rejected — a real test must be able to fail. */
{
  let ok = true, where = '';
  // Known χ²-table 0.95 quantiles (critical at α=0.05): df → x.
  const table = { 1: 3.841, 5: 11.070, 10: 18.307, 15: 24.996, 20: 31.410 };
  let maxErr = 0;
  for (const df of Object.keys(table)) {
    const crit = G.chiSquareCritical(0.05, +df);
    const err = Math.abs(crit - table[df]);
    maxErr = Math.max(maxErr, err);
    if (err > 0.02) { ok = false; where = `df=${df} crit=${crit.toFixed(3)} vs table ${table[df]}`; break; }
  }
  // power: a deliberately-wrong (flat) histogram must be rejected at p=0.5.
  if (ok) {
    const rows = 12, p = 0.5, n = 120000;
    const pmf = G.binomialPMF(rows, p);
    const flat = [];
    for (let k = 0; k <= rows; k++) flat[k] = Math.round(n / (rows + 1));
    const cs = G.chiSquare(flat, pmf);
    const crit = G.chiSquareCritical(0.01, cs.df);
    if (cs.stat <= crit) { ok = false; where = `flat histogram NOT rejected (χ²=${cs.stat.toFixed(1)} ≤ ${crit.toFixed(1)})`; }
  }
  check('B4 χ² CDF calibrated to table values; a wrong (flat) histogram IS rejected', ok,
    where || `crit-err ≤ ${maxErr.toExponential(1)}; flat run rejected as it must be`);
}

/* B5. Determinism across the full UI grid: same (seed,rows,p,N) ⇒ identical
   histogram + first-K path sequence; two seeds differ. */
{
  let ok = true, where = '';
  for (let rows = G.ROWS_MIN; rows <= G.ROWS_MAX && ok; rows += 3) {
    for (const p of [0.35, 0.5, 0.7]) {
      const a = G.simulate('grid', rows, p, 3000, { keepPaths: 100 });
      const b = G.simulate('grid', rows, p, 3000, { keepPaths: 100 });
      for (let k = 0; k <= rows; k++) if (a.hist[k] !== b.hist[k]) { ok = false; where = `rows=${rows} p=${p} hist drift`; break; }
      if (!ok) break;
      for (let i = 0; i < a.paths.length && ok; i++) {
        for (let s = 0; s < a.paths[i].length; s++) {
          if (a.paths[i][s] !== b.paths[i][s]) { ok = false; where = `rows=${rows} p=${p} path drift`; break; }
        }
      }
    }
  }
  if (ok) {
    const x = G.simulate('seed-A', 12, 0.5, 5000), y = G.simulate('seed-B', 12, 0.5, 5000);
    let same = true;
    for (let k = 0; k <= 12; k++) if (x.hist[k] !== y.hist[k]) { same = false; break; }
    if (same) { ok = false; where = 'distinct seeds gave identical histograms'; }
  }
  check('B5 deterministic across rows 4..16 × p grid; distinct seeds differ', ok,
    where || 'every (seed,rows,p,N) reproducible to the path');
}

/* B6. Conservation + path validity at scale: every ball lands in exactly one
   bin ∈ [0,rows], bin == right-bounces, Σhist == N — over many configs. */
{
  let ok = true, where = '';
  for (let rows = G.ROWS_MIN; rows <= G.ROWS_MAX && ok; rows += 2) {
    for (const p of [0.2, 0.5, 0.8]) {
      const n = 6000;
      const sim = G.simulate('cons', rows, p, n);
      let sum = 0, bad = false;
      for (let k = 0; k <= rows; k++) { sum += sim.hist[k]; if (sim.hist[k] < 0) bad = true; }
      if (bad) { ok = false; where = `rows=${rows} p=${p} negative bin`; break; }
      if (sum !== n) { ok = false; where = `rows=${rows} p=${p} Σhist=${sum} != ${n}`; break; }
      // re-derive bins from the same stream
      const rng = G.makeRng('cons');
      for (let i = 0; i < n && ok; i++) {
        const ball = G.dropBall(rng, rows, p);
        let rights = 0;
        for (let s = 0; s < ball.steps.length; s++) {
          if (ball.steps[s] !== 1 && ball.steps[s] !== -1) { ok = false; where = `non-±1 step`; break; }
          if (ball.steps[s] === 1) rights++;
        }
        if (ok && (rights !== ball.bin || ball.steps.length !== rows || ball.bin < 0 || ball.bin > rows)) {
          ok = false; where = `rows=${rows} ball ${i} invalid`;
        }
      }
    }
  }
  check('B6 conservation + path validity at scale (rows 4..16 × p)', ok,
    where || 'every ball: rows ±1 steps → one bin == right-count; Σhist == N');
}

/* B7. No NaN/Inf in any of the exported quantities across the grid. */
{
  let ok = true, where = '';
  for (let rows = G.ROWS_MIN; rows <= G.ROWS_MAX && ok; rows++) {
    for (const p of [0.05, 0.5, 0.95]) {
      const pmf = G.binomialPMF(rows, p);
      const nrm = G.normalApprox(rows, p);
      for (let k = 0; k <= rows; k++) {
        if (!isFinite(pmf[k]) || pmf[k] < 0 || !isFinite(nrm[k]) || nrm[k] < 0) { ok = false; where = `rows=${rows} p=${p} k=${k} non-finite`; break; }
      }
      if (!ok) break;
      const sim = G.simulate('finite', rows, p, 1500);
      if (!isFinite(sim.mean) || !isFinite(sim.variance)) { ok = false; where = `rows=${rows} p=${p} moments non-finite`; }
    }
  }
  check('B7 finite everywhere (PMF, normal overlay, empirical moments)', ok, where || 'all quantities finite & non-negative');
}

/* ─────────────────────────────────────────────────────────────────────────── */
console.log('');
const allPass = fails.length === 0 && core.pass;
console.log(`Galton board self-test: ${pass}/${total} ` + (allPass ? 'PASS' : 'FAIL'));
if (!allPass) {
  console.error('\nFAILURES:\n  - ' + fails.join('\n  - '));
  process.exit(1);
}
process.exit(0);
