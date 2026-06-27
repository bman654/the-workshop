// The Drift Jar — Node cross-check (the falsifiability twin of core.mjs).
//   (a) runs the shared runSelfTest() at a HEAVIER capsule (more jars, same KSIG);
//   (b) adds INDEPENDENT re-derivations NOT routed through the matrix: the martingale
//       E[x_{t+1}|x_t]=x_t by direct binomial algebra (a SECOND PMF code path), the
//       heterozygosity drain by the coalescent recursion H_{t+1}=(1−1/M)H_t hand-iterated,
//       and the absorption fixed point u_i=i/M satisfying u=Tu row-by-row;
//   (c) THE FAMILY SEAM (kept OUT of the inlinable core, only here): the Gene Jar's
//       Hardy–Weinberg Aa === 2pq === the Drift Jar's H₀, and the Gene Jar IS the Drift
//       Jar's N → ∞ limit (drift switches off);
//   (d) the integration crux — RE-EXTRACTS the inlined core from index.html, asserts it
//       is char-for-char the export-stripped core.mjs body, evals it, and runs ITS
//       runSelfTest, asserting pass-count + every named check agree.
//   There is NO cross-wing import in core.mjs, so page-core === module-core IS the parity.
import * as Core from './core.mjs';
import { hardyWeinberg } from '../the-gene-jar/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('The Conservatory · The Drift Jar — Node cross-check\n');

// ── 1. the shared core self-test (identical to the in-page pill), HEAVIER capsule ──
console.log('— shared runSelfTest({jars:9000}) (same assertions the in-page pill runs, tighter witness band) —');
let moduleRes;
{
  moduleRes = Core.runSelfTest({ jars: 9000, nCap: 30 });
  for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);
}

// ── 2. INDEPENDENT re-derivations (NOT routed through the WF matrix) ───────────────
console.log('\n— independent re-derivations (hand-built, NOT through transitionRow/the matrix) —');

// an INDEPENDENT binomial PMF via the multiplicative recurrence (a different code path
// than the core's log-choose+exp transitionRow): P(0)=(1−q)^M, P(j)=P(j−1)·(M−j+1)/j·q/(1−q).
function binomPMF(M, q) {
  const pmf = new Float64Array(M + 1);
  if (q <= 0) { pmf[0] = 1; return pmf; }
  if (q >= 1) { pmf[M] = 1; return pmf; }
  pmf[0] = Math.pow(1 - q, M);
  for (let j = 1; j <= M; j++) pmf[j] = pmf[j - 1] * ((M - j + 1) / j) * (q / (1 - q));
  return pmf;
}

// (a) MARTINGALE by direct algebra — Σ_j j·Binomial(M,x) === M·x (mean = x), the
//     fixation-prob=initial-p claim's engine, re-derived off an independent PMF.
{
  let worst = 0, where = '';
  for (const N of [4, 8, 12, 16, 20, 30]) {
    const M = 2 * N;
    for (let i = 1; i < M; i++) {
      const x = i / M, pmf = binomPMF(M, x);
      let mean = 0; for (let j = 0; j <= M; j++) mean += (j / M) * pmf[j];
      const e = Math.abs(mean - x);
      if (e > worst) { worst = e; where = 'N=' + N + ' i=' + i; }
    }
  }
  ok('(re-derive)★ martingale E[x′|x]=x by direct binomial algebra (independent PMF)',
     worst < 1e-12, 'worst |mean − x| = ' + worst.toExponential(2) + ' @ ' + where);
}

// (b) HETEROZYGOSITY DRAIN by the COALESCENT recursion — hand-iterate H_{t+1}=(1−1/M)·H_t
//     from H₀=2p₀q₀ and match the closed form heterozygosity(p₀,N,t) over p×N×t.
{
  let worst = 0, where = '';
  for (const N of [4, 8, 12, 16, 20]) {
    const M = 2 * N;
    for (const p of [0.2, 0.375, 0.5, 0.7]) {
      const i0 = Math.round(M * p), p0 = i0 / M;
      let H = 2 * p0 * (1 - p0);                       // H₀
      for (let t = 1; t <= 12; t++) {
        H *= (1 - 1 / M);                              // coalescent step
        const e = Math.abs(H - Core.heterozygosity(p0, N, t));
        if (e > worst) { worst = e; where = 'N=' + N + ' p=' + p + ' t=' + t; }
      }
    }
  }
  ok('(re-derive)★ heterozygosity drain by coalescent recursion H_{t+1}=(1−1/M)H_t matches closed form',
     worst < 1e-12, 'worst |H − heterozygosity()| = ' + worst.toExponential(2) + ' @ ' + where);
}

// (c) ABSORPTION FIXED POINT row-by-row — the claimed solution u_i=i/M satisfies u=T·u:
//     for each interior row, Σ_j T[i][j]·(j/M) === i/M (independent of the Gauss solve).
{
  let worst = 0, where = '';
  for (const N of [4, 8, 12, 16, 20, 30]) {
    const M = 2 * N, T = Core.buildMatrix(N);
    for (let i = 1; i < M; i++) {
      let s = 0; for (let j = 0; j <= M; j++) s += T[i][j] * (j / M);
      const e = Math.abs(s - i / M);
      if (e > worst) { worst = e; where = 'N=' + N + ' i=' + i; }
    }
  }
  ok('(re-derive)★ absorption fixed point u_i=i/M satisfies u=T·u row-by-row (NOT via Gauss)',
     worst < 1e-12, 'worst |Σ T_ij·(j/M) − i/M| = ' + worst.toExponential(2) + ' @ ' + where);
}

// determinism, independently: two makeJar+runJar sequences byte-identical.
{
  function runOnce() {
    const r = Core.runJar(Core.makeJar({ N: 9, p: 0.45, seed: 13579 }), 8000);
    return JSON.stringify(r.trail);
  }
  ok('(determinism)★ identical {N,p,seed} ⇒ byte-identical jar trail', runOnce() === runOnce(), 'two full runs byte-identical');
}

// ── 3. THE FAMILY SEAM — the Gene Jar IS the Drift Jar's N → ∞ limit ───────────────
console.log('\n— the family seam: the Gene Jar (infinite pool) IS the Drift Jar at N → ∞ —');
{
  // H₀ of the Drift Jar === 2pq === the Gene Jar's heterozygote proportion Aa, exactly.
  let seamWorst = 0, where = '';
  for (let k = 0; k <= 40; k++) {
    const p = k / 40, twopq = 2 * p * (1 - p);
    const e = Math.max(
      Math.abs(hardyWeinberg(p).Aa - twopq),
      Math.abs(Core.heterozygosity(p, 12, 0) - twopq),    // H_t at t=0 is 2pq for any N
    );
    if (e > seamWorst) { seamWorst = e; where = 'p=' + p.toFixed(3); }
  }
  ok('(seam)★ Gene Jar Aa === 2pq === Drift Jar H₀ over a dense p-grid', seamWorst < 1e-15,
     'worst |Aa − H₀| = ' + seamWorst.toExponential(2) + ' @ ' + where);

  // the N → ∞ limit of the Drift Jar's heterozygosity equals the Gene Jar's drift-FREE
  // Aa for EVERY t (the infinite pool holds 2pq forever — never drifts, never fixes).
  let limWorst = 0, wl = '';
  for (const p of [0.2, 0.375, 0.5, 0.625, 0.8]) {
    const geneAa = hardyWeinberg(p).Aa;                  // never changes with t (no drift)
    for (const t of [1, 5, 20, 100]) {
      const e = Math.abs(Core.heterozygosity(p, 1e7, t) - geneAa);
      if (e > limWorst) { limWorst = e; wl = 'p=' + p + ' t=' + t; }
    }
  }
  ok('(seam)★ Drift Jar het at N=1e7 === Gene Jar Aa for every t (infinite pool never drifts)',
     limWorst < 1e-4, 'worst |H(N=1e7,t) − Aa| = ' + limWorst.toExponential(2) + ' @ ' + wl);
}

// ── 4. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ─────────────────────
//   Read index.html, slice the inline core between the DRIFT-JAR CORE sentinels, assert
//   it is char-for-char the export-stripped module body (from the first locked marker to
//   the END sentinel), eval it (new Function factory), run ITS runSelfTest and assert
//   pass-count and every named check agree.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== DRIFT-JAR CORE (byte-identical to core.mjs) =====';
  const END = '// ===== END DRIFT-JAR CORE =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? 'slice is ' + (j - i) + ' chars' : 'MISSING SENTINELS — has forge built index.html?');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);

    // the slice must be PURE core — no ws breadcrumb / WS. / forge directive leakage.
    ok('the byte-twin slice contains no breadcrumb / WS. / forge directive leakage',
       !/ws:seen:/.test(slice) && !/\bWS\./.test(slice) && !/forge:include/.test(slice) && !/localStorage/.test(slice),
       'core slice is pure — breadcrumb + ws.js include sit outside the sentinels');

    // (0-teeth)★ BYTE-IDENTITY: the inline slice is char-for-char the module's body (from
    //   the first locked marker to the END sentinel, every leading `export ` removed).
    const modSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8');
    const KMARK = '// The tolerance capsule';
    const k = modSrc.indexOf(KMARK), me = modSrc.indexOf(END);
    const modBody = modSrc.slice(k, me).replace(/^export /gm, '').trim();
    ok('(0-teeth)★ inline core slice is char-for-char the export-stripped core.mjs body',
       slice.trim() === modBody,
       slice.trim() === modBody ? 'identical bytes (' + modBody.length + ' chars)' :
       'DRIFT: slice ' + slice.trim().length + ' vs module ' + modBody.length + ' chars');

    let pageRes = null, evalErr = null;
    try {
      const factory = new Function(slice +
        '\n;return { runSelfTest, makeRng, decayFactor, heterozygosity, fixationProb, absorptionProbs, P };');
      const PageCore = factory();
      pageRes = PageCore.runSelfTest({ jars: 9000, nCap: 30 });

      // the page core's shared formulas must match the module's, value-for-value.
      const decaySame = PageCore.decayFactor(12) === Core.decayFactor(12);
      const hetSame = PageCore.heterozygosity(0.3, 12, 4) === Core.heterozygosity(0.3, 12, 4);
      const rngSame = PageCore.makeRng(1)() === Core.makeRng(1)();
      const ksigSame = PageCore.P.KSIG === Core.P.KSIG;
      ok('(parity)★ page core formulas === module core formulas (decayFactor/heterozygosity/makeRng/KSIG)',
         decaySame && hetSame && rngSame && ksigSame, decaySame && hetSame && rngSame && ksigSame ? 'every shared formula returns the identical value' : 'a formula drifted');
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count',
         pageRes.pass === moduleRes.pass && pageRes.total === moduleRes.total,
         'in-page ' + pageRes.pass + '/' + pageRes.total + '  ·  module ' + moduleRes.pass + '/' + moduleRes.total);
      let agree = pageRes.checks.length === moduleRes.checks.length;
      for (let m = 0; agree && m < pageRes.checks.length; m++) {
        if (pageRes.checks[m].pass !== moduleRes.checks[m].pass) agree = false;
        if (pageRes.checks[m].name !== moduleRes.checks[m].name) agree = false;
      }
      ok('(parity)★ every named assertion agrees ok-for-ok (page vs module)', agree,
         agree ? 'all ' + pageRes.checks.length + ' checks identical' : 'a check disagreed');

      console.log('\n  ▸ RECORDED: in-page ' + pageRes.pass + '/' + pageRes.total + ' · Node module ' + moduleRes.pass + '/' + moduleRes.total);
    }
  }
}

console.log('\n' + pass + '/' + total + ' ' + (pass === total ? '✓ ALL GREEN' : '✗ FAILURES'));
process.exit(pass === total ? 0 : 1);
