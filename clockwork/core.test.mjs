// ============================================================================
//  Node-side falsifiability harness for The Temperature Dial.
//  Runs the shared in-page self-test PLUS deeper Node-only assertions at scale
//  (N up to 200000, 5000-rung ladders, pathological logit vectors — far past
//  what the in-page pill can afford), THEN re-extracts the inlined core from
//  temperature.html and proves it is byte-for-byte the SAME core (parity).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  VOCAB, PROMPT, LOGITS, T_RANGE,
  softmax, softmaxNaive, entropyBits, maxEntropyBits, argmax,
  makeRng, sampleIndex, histogram, chiSquare,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Temperature Dial — core.test.mjs\n');

// ── 1. the shared in-page self-test, at the Node budget ──────────────────────
console.log('— shared runSelfTest() (same claims the in-page pill runs, N=200000, ladder=1000) —');
const st = runSelfTest({ Nsample: 200000, ladder: 1000 });
for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);

const CHI2_CRIT_DOF7 = 24.32;   // χ²(dof=7, α=0.001), Pearson tables

// pathological logit vectors (the regimes the in-page pill can't dwell on).
const PATHO = {
  allEqual: [1, 1, 1, 1, 1, 1, 1, 1],
  oneHuge: [50, 0, 0, 0, 0, 0, 0, 0],
  twoTied: [5, 5, 0, 0, 0, 0, 0, 0],
  monster: [1000, -1000, 3.4, 0.7, 0.2, 2.1, 2.9, -0.5],
};

// ── 2. CLAIM 1 — NORMALIZATION across a 5000-rung ladder × pathological vectors ─
console.log('\n— CLAIM 1: Σp=1 to ~1e-15 across a 5000-rung ladder × pathological logits —');
{
  const N = 5000;
  const loL = Math.log10(T_RANGE.LO), hiL = Math.log10(T_RANGE.HI);
  let maxSumErr = 0, maxDiff = 0, anyNaN = false, worst = '';
  for (const [name, lg] of Object.entries({ LOGITS, ...PATHO })) {
    for (let i = 0; i < N; i++) {
      const T = Math.pow(10, loL + (i / (N - 1)) * (hiL - loL));
      const ps = softmax(lg, T);
      if (!ps.every(Number.isFinite)) { anyNaN = true; worst = `${name}@T=${T}`; }
      const sum = ps.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > maxSumErr) maxSumErr = Math.abs(sum - 1);
      const pn = softmaxNaive(lg, T);
      if (pn.every(Number.isFinite)) for (let k = 0; k < ps.length; k++) {
        const d = Math.abs(ps[k] - pn[k]); if (d > maxDiff) maxDiff = d;
      }
    }
  }
  ok(`A. stable softmax: Σp=1 (max err ≤ 1e-12) & finite over ${N}×5 rungs; agrees with naive where finite (≤1e-12)`,
    maxSumErr <= 1e-12 && maxDiff <= 1e-12 && !anyNaN,
    !anyNaN ? `max|Σp−1|=${maxSumErr.toExponential(3)} · max|stable−naive|=${maxDiff.toExponential(3)}` : `NaN at ${worst}`);

  // the monster: naive overflows, stable does not — the WHOLE reason for max-subtraction.
  const big = [1000, -1000, 0, 0, 0, 0, 0, 0];
  const sS = softmax(big, 1), sN = softmaxNaive(big, 1);
  ok('A. ±1000 monster: stable Σ=1 & p₀≈1, naive → NaN (overflow) — the case max-subtraction exists for',
    Math.abs(sS.reduce((a, b) => a + b, 0) - 1) <= 1e-12 && sS.every(Number.isFinite) && sN.some(v => !Number.isFinite(v)) && Math.abs(sS[0] - 1) < 1e-9,
    `stable Σ=${sS.reduce((a, b) => a + b, 0).toFixed(13)}, p₀=${sS[0].toFixed(12)}; naive[0]=${sN[0]}`);
}

// ── 3. CLAIM 2 — MONOTONE ENTROPY + an INDEPENDENT binary-entropy oracle ─────
console.log('\n— CLAIM 2: H(T) strictly ↑ 0→log₂|V|, against an independent binary-entropy oracle —');
{
  const N = 5000;
  const loL = Math.log10(T_RANGE.LO), hiL = Math.log10(T_RANGE.HI);
  let violations = 0, prev = -Infinity;
  for (let i = 0; i < N; i++) {
    const T = Math.pow(10, loL + (i / (N - 1)) * (hiL - loL));
    const H = entropyBits(softmax(LOGITS, T));
    if (H < prev - 1e-12) violations++;
    prev = H;
  }
  const ceil = maxEntropyBits(VOCAB.length);
  ok(`B. H(T) strictly ↑ over ${N} rungs (0 violations) → ceiling log₂${VOCAB.length}=${ceil.toFixed(6)}; H(1e-4)→0, H(1e6)→ceiling`,
    violations === 0 && entropyBits(softmax(LOGITS, 1e-4)) <= 1e-6 && Math.abs(entropyBits(softmax(LOGITS, 1e6)) - ceil) <= 1e-6,
    `${violations} violations · H(1e-4)=${entropyBits(softmax(LOGITS, 1e-4)).toExponential(2)} · H(1e6)=${entropyBits(softmax(LOGITS, 1e6)).toFixed(6)}`);

  // INDEPENDENT ORACLE: for a TWO-logit problem [a,b], softmax reduces to the
  // logistic σ(Δ/T) on Δ=a−b, and H must equal the binary entropy Hb(σ) =
  // −σlog₂σ − (1−σ)log₂(1−σ). This oracle shares NO code with entropyBits.
  const sigma = x => 1 / (1 + Math.exp(-x));
  const Hb = s => (s <= 0 || s >= 1) ? 0 : -(s * Math.log(s) + (1 - s) * Math.log(1 - s)) / Math.LN2;
  let maxOracleErr = 0;
  for (let i = 0; i < 400; i++) {
    const a = -4 + 8 * (i / 399), b = 0.7, T = 0.3 + 3 * (i % 7) / 6;
    const Hsoft = entropyBits(softmax([a, b], T));
    const Horacle = Hb(sigma((a - b) / T));
    maxOracleErr = Math.max(maxOracleErr, Math.abs(Hsoft - Horacle));
  }
  ok('B. binary-entropy oracle: entropyBits(softmax([a,b],T)) == Hb(σ((a−b)/T)) (shares no code) over 400 cases',
    maxOracleErr <= 1e-12, `max|H−Hb|=${maxOracleErr.toExponential(3)}`);

  // two-tied-max regime tested NOT hidden: softmax([5,5,…],1) → 50/50 on the
  // top two, H of that pair → 1 bit; argmax tie-breaks to the lowest index.
  const tied = softmax([5, 5, 0, 0, 0, 0, 0, 0], 0.01);
  ok('B. two-tied-max: T→0 gives the CORRECT 50/50 split (H→1 bit), argmax tie-breaks to lowest index',
    Math.abs(tied[0] - 0.5) < 1e-9 && Math.abs(tied[1] - 0.5) < 1e-9 && Math.abs(entropyBits(tied) - 1) < 1e-9 && argmax([5, 5, 0, 0, 0, 0, 0, 0]) === 0,
    `p₀=${tied[0].toFixed(9)}, p₁=${tied[1].toFixed(9)}, H=${entropyBits(tied).toFixed(9)} bit, argmax=0`);
}

// ── 4. CLAIM 3 — χ² CONVERGENCE CURVE with a 4/√N mean-recovery band ──────────
console.log('\n— CLAIM 3: the seeded sampler converges — a χ² curve + a 4/√N recovery band —');
{
  const p = softmax(LOGITS, 1);
  const Ns = [500, 2000, 8000, 32000, 128000];
  let allInBand = true, allUnderCrit = true, prevLinf = Infinity, monotoneTighten = true, detail = [];
  for (const N of Ns) {
    const obs = histogram(p, N, 0xC0FFEE ^ N);
    const chi = chiSquare(obs, p, N);
    const linf = Math.max(...obs.map((c, i) => Math.abs(c / N - p[i])));
    const band = 4 / Math.sqrt(N);                 // a generous mean-recovery band
    if (linf > band) allInBand = false;
    if (chi >= CHI2_CRIT_DOF7) allUnderCrit = false;
    if (linf > prevLinf + 1e-6) monotoneTighten = false;  // overall downward trend
    prevLinf = linf;
    detail.push(`N=${N}:χ²=${chi.toFixed(1)},L∞=${linf.toFixed(4)}`);
  }
  ok('C. χ² < 24.32 at every N AND L∞ within the 4/√N band AND the trend tightens with N',
    allUnderCrit && allInBand && monotoneTighten, detail.join(' · '));

  // determinism: same seed ⇒ byte-identical histogram twice.
  const h1 = histogram(p, 50000, 7), h2 = histogram(p, 50000, 7);
  ok('C. determinism: histogram(p,50000,7) is byte-identical across two calls (same seed)',
    h1.join(',') === h2.join(','), `[${h1.join(', ')}]`);
}

// ── 5. CLAIM 4 — the NEGATIVE CONTROL bites, and the gate is non-vacuous ──────
console.log('\n— CLAIM 4: the forgotten-denominator control fails ≫crit; a correct softmax passes —');
{
  const p = softmax(LOGITS, 1);
  const N = 200000;
  // the bug: exp(z) with NO denominator → Σ = the partition function Z ≠ 1.
  const z = LOGITS.map(l => l / 1), m = Math.max(...z);
  const bad = z.map(v => Math.exp(v - m));
  const badSum = bad.reduce((a, b) => a + b, 0);
  const obs = histogram(p, N, 0xBADBAD);
  const chiBad = chiSquare(obs, bad, N);     // true draws vs the wrong expectation → explodes
  const chiGood = chiSquare(obs, p, N);      // SAME draws vs the true p → passes
  ok('D. forgotten denominator: Σ≠1 AND χ²_bad ≫ 3×24.32 (the teeth)',
    Math.abs(badSum - 1) > 1e-6 && chiBad > 3 * CHI2_CRIT_DOF7,
    `Σ_bad=${badSum.toFixed(4)} · χ²_bad=${chiBad.toExponential(3)}`);
  ok('D. NON-VACUOUS: the same draws vs the CORRECT p PASS the identical gate (χ²<24.32)',
    chiGood < CHI2_CRIT_DOF7, `χ²_good=${chiGood.toFixed(3)} < 24.32`);
}

// ── 6. CLAIM 5 — LAW-vs-TOY: exact, deterministic, argmax pinned ──────────────
console.log('\n— CLAIM 5: the law is exact on the frozen toy —');
{
  const a = softmax(LOGITS, 1), b = softmax(LOGITS, 1);
  ok('E. softmax(LOGITS,1) byte-identical across two calls; Σ=1 to 1e-15; argmax=idx0 ("the")',
    a.every((v, i) => v === b[i]) && Math.abs(a.reduce((x, y) => x + y, 0) - 1) <= 1e-15 && argmax(LOGITS) === 0,
    `p₀=${a[0].toFixed(6)} ("${VOCAB[0]}") · Σ=${a.reduce((x, y) => x + y, 0).toFixed(15)}`);
  // the frozen toy literals are exactly as specified (a model edit must be loud).
  ok('E. the frozen toy is pinned: |V|=8, VOCAB & LOGITS literals exact, PROMPT exact',
    VOCAB.length === 8 && VOCAB.join('|') === 'the|cat|sat|on|mat|moon|.|idea' &&
    LOGITS.join(',') === '3.4,0.7,0.2,2.1,2.9,-0.5,1.6,-1.8' && PROMPT === 'the cat sat on the',
    `VOCAB=[${VOCAB.join(',')}] · LOGITS=[${LOGITS.join(',')}]`);
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
//   Read temperature.html, slice the inline core between the banner sentinels,
//   prove each function body is char-for-char the imported toString(), eval the
//   slice, run ITS runSelfTest → pass-count + ok-for-ok + name-for-name parity,
//   and spot-check cross-boundary values.
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'temperature.html'), 'utf8');
  const BEGIN = '// ===== TEMPERATURE CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== TEMPERATURE CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in temperature.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) every named function body is char-for-char the imported toString().
    const fns = { softmax, softmaxNaive, entropyBits, argmax, makeRng, sampleIndex, histogram, chiSquare, runSelfTest };
    for (const [name, fn] of Object.entries(fns)) {
      const pageSrc = extractFn(slice, name);
      ok(`(parity)★ inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 120))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 120))}…`);
    }

    // (b) the frozen literals are inlined exactly (a model edit can't drift the page).
    ok('(parity)★ VOCAB / PROMPT / LOGITS / T_RANGE literals string-match in the page slice',
      slice.includes(`['the', 'cat', 'sat', 'on', 'mat', 'moon', '.', 'idea']`) &&
      slice.includes(`[3.4, 0.7, 0.2, 2.1, 2.9, -0.5, 1.6, -1.8]`) &&
      slice.includes(`'the cat sat on the'`) &&
      slice.includes(`LO: 0.01, HI: 100`),
      'VOCAB · PROMPT · LOGITS · T_RANGE all present verbatim');

    // (c) evaluate the slice and run ITS runSelfTest → full parity.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, softmax, softmaxNaive, entropyBits, maxEntropyBits, argmax, makeRng, sampleIndex, histogram, chiSquare, VOCAB, PROMPT, LOGITS, T_RANGE };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest({ Nsample: 20000, ladder: 240 });
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest({ Nsample: 20000, ladder: 240 });
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (same args)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++)
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');

      // (d) cross-boundary spot values: softmax(LOGITS,1) & histogram(p,5000,7).
      const pPage = PageCore.softmax(PageCore.LOGITS, 1), pMod = softmax(LOGITS, 1);
      const hPage = PageCore.histogram(pPage, 5000, 7), hMod = histogram(pMod, 5000, 7);
      ok('(parity)★ cross-boundary: softmax(LOGITS,1) & histogram(p,5000,7) equal the module values',
        pPage.every((v, i) => v === pMod[i]) && hPage.join(',') === hMod.join(','),
        `p₀=${pPage[0].toFixed(6)} · hist=[${hPage.join(', ')}]`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (The collatz precedent located the body brace as the first `{` after the
//  function keyword — exact for simple `(args)` signatures. runSelfTest here has
//  a DESTRUCTURED parameter list `({ … } = {})`, so we first skip the balanced
//  parameter parens, then brace-match the BODY. Identical for both shapes.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  // skip the balanced parameter parens (handles `{…}` destructuring inside them).
  let p = src.indexOf('(', m.index), pd = 0, q = p;
  for (; q < src.length; q++) {
    if (src[q] === '(') pd++;
    else if (src[q] === ')') { pd--; if (pd === 0) { q++; break; } }
  }
  let i = src.indexOf('{', q);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
