// ============================================================================
//  Node-side falsifiability harness for The Measurement.
//  Proves that SAMPLING IS COLLAPSE — the SAME operator (sampleIndex) draws a
//  token from softmax and an outcome from |ψ|² — to statistical significance,
//  over the 12 verified seeds at N=40k plus a convergence sweep to 200k. Then it
//  re-extracts the inlined core from measurement.html and proves it is byte-for-
//  byte the SAME core (parity), AND that the MODULE's sampleIndex IS the SAME
//  function object as core.sampleIndex (the real collapse-operator import, not a
//  lookalike), AND that measurement-core.mjs defines NO sampler/RNG/χ²/softmax
//  body of its own (source-disjointness — collapse can ONLY come from the import).
//  Run:  node measurement-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  sampleIndex, makeRng, histogram, chiSquare, softmax, argmax, entropyBits,
  LOGITS, VOCAB, T_RANGE,
  psi_n, E_n, SUPER, K, normCoeffs, bornVector, measure, chiCrit, runSelfTest,
} from './measurement-core.mjs';
import * as measurementCore from './measurement-core.mjs';
import * as core from './core.mjs';
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

console.log('The Measurement — measurement-core.test.mjs\n');

// ── the verified parameters ───────────────────────────────────────────────────
const DOF = K - 1;                        // = 47
const CRIT = 82.8;                         // χ²(47, α=0.001), named literature constant
const SUP = normCoeffs(SUPER);
const pBorn = bornVector(SUP, K, true);    // |ψ|²  (the prepared state)
const pAmp  = bornVector(SUP, K, false);   // |ψ|   (the amplitude — negative control)
const SEEDS = [0xC0FFEE,1,2,3,42,1234,0xBEEF,7,99,0xD00D,555,31337];   // the 12 verified seeds

// ── #1. SAME-FUNCTION-OBJECT — the collapse operator is a REAL import ─────────
//  sampleIndex/makeRng/histogram/chiSquare here ARE core's objects (the collapse
//  operator), AND softmax/argmax/entropyBits too (the token face) — not lookalikes.
console.log('— #1 SAME-FUNCTION-OBJECT: the collapse operator IS core.* (a real import) —');
{
  ok('#1a measurementCore.sampleIndex === core.sampleIndex AND makeRng/histogram/chiSquare === (the SAME collapse operator)',
    measurementCore.sampleIndex === core.sampleIndex && sampleIndex === core.sampleIndex &&
    makeRng === core.makeRng && histogram === core.histogram && chiSquare === core.chiSquare,
    `sampleIndex===core.sampleIndex → ${measurementCore.sampleIndex === core.sampleIndex} · makeRng/histogram/chiSquare === → ${makeRng === core.makeRng && histogram === core.histogram && chiSquare === core.chiSquare}`);
  ok('#1b softmax/argmax/entropyBits === core.* too (the token face is the Dial\'s, not re-typed)',
    softmax === core.softmax && argmax === core.argmax && entropyBits === core.entropyBits,
    `softmax===core.softmax → ${softmax === core.softmax} · argmax/entropyBits === → ${argmax === core.argmax && entropyBits === core.entropyBits}`);
}

// ── #2. SOURCE-DISJOINTNESS — this file defines NO sampler/RNG/χ²/softmax body ─
//  A string scan over measurement-core.mjs source: no mulberry32 magic constant,
//  no `function sampleIndex`, no Math.imul, no `function softmax`/`function chiSquare`.
//  The collapse operator can ONLY come from the import — the source is disjoint.
console.log('\n— #2 SOURCE-DISJOINTNESS: measurement-core.mjs defines no sampler/RNG/χ²/softmax body —');
{
  const src = readFileSync(join(__dir, 'measurement-core.mjs'), 'utf8');
  // strip the banner comment block + line comments so prose mentions don't false-trip.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const bans = [
    ['0x6D2B79F5 (mulberry32 magic)', /0x6D2B79F5/i],
    ['Math.imul (RNG mixing)',        /Math\.imul/],
    ['function sampleIndex body',     /function\s+sampleIndex\s*\(/],
    ['function makeRng body',         /function\s+makeRng\s*\(/],
    ['function histogram body',       /function\s+histogram\s*\(/],
    ['function chiSquare body',       /function\s+chiSquare\s*\(/],
    ['function softmax body',         /function\s+softmax\s*\(/],
  ];
  let clean = true, hit = '';
  for (const [label, re] of bans){ if (re.test(code)){ clean = false; hit = label; } }
  ok('#2 no sampler/RNG/χ²/softmax body defined in measurement-core.mjs (collapse comes ONLY from the import)',
    clean, clean ? 'all 7 banned bodies absent — source is disjoint' : `FOUND: ${hit}`);
}

// ── #3. NORMALIZATION SWEEP ──────────────────────────────────────────────────
//  Σ|cₙ|²=1; ∫|ψ|²dx = 1 via the discretized vector (≤1e-12); Σ softmax=1 across
//  a T-ladder over the full proven range.
console.log('\n— #3 NORMALIZATION: Σ|cₙ|²=1, ∫|ψ|²dx=1 (discretized), Σ softmax(LOGITS,T)=1 —');
{
  const coeffSum = SUP.reduce((a,t) => a + t.c*t.c, 0);
  const bornSum  = pBorn.reduce((a,b) => a+b, 0);
  // the Riemann sum Σ |ψ(x_i)|² · dx ≈ ∫|ψ|²dx = 1 (the raw, pre-normalization integral).
  let integral = 0; const dx = 1/K;
  for (let i=0;i<K;i++){ const x=(i+0.5)*dx; let a=0; for (const {n,c} of SUP) a += c*psi_n(n,x); integral += a*a*dx; }
  let maxSoft = 0;
  const loL = Math.log10(T_RANGE.LO), hiL = Math.log10(T_RANGE.HI);
  for (let i=0;i<240;i++){ const T = Math.pow(10, loL + (i/239)*(hiL-loL));
    maxSoft = Math.max(maxSoft, Math.abs(softmax(LOGITS,T).reduce((a,b)=>a+b,0) - 1)); }
  ok('#3a Σ|cₙ|²=1 and Σ bornVector(SUPER)=1 to ≤1e-15 (Born\'s normalization)',
    Math.abs(coeffSum-1) <= 1e-15 && Math.abs(bornSum-1) <= 1e-15,
    `Σ|cₙ|²=${coeffSum.toFixed(15)} · |Σ|ψ|²−1|=${Math.abs(bornSum-1).toExponential(2)}`);
  ok('#3b ∫|ψ|²dx = 1 via the discretized Riemann sum to ≤1e-12 (the eigenstate is normalized on [0,1])',
    Math.abs(integral-1) <= 1e-12, `∫|ψ|²dx=${integral.toFixed(13)} (|err|=${Math.abs(integral-1).toExponential(2)})`);
  ok('#3c Σ softmax(LOGITS,T)=1 to ≤1e-12 across a 240-rung T∈[0.01,100] ladder (the token face is always a distribution)',
    maxSoft <= 1e-12, `max|Σsoftmax−1|=${maxSoft.toExponential(2)}`);
}

// ── #4. BORN RECONVERGENCE over the 12 verified seeds ────────────────────────
//  every seed χ²(observed,|ψ|²) < 82.8 (NOT rejected), AND L∞ tightens 2k→200k.
console.log('\n— #4 BORN RECONVERGENCE: 12 seeds NOT-rejected at N=40k; L∞ tightens 2k→200k —');
{
  const N = 40000;
  let allPass = true, lo = Infinity, hi = -Infinity;
  for (const s of SEEDS){
    const obs = histogram(pBorn, N, s);
    const chi = chiSquare(obs, pBorn, N);
    if (chi >= CRIT) allPass = false;
    lo = Math.min(lo, chi); hi = Math.max(hi, chi);
  }
  ok('#4a all 12 verified seeds: χ²(observed,|ψ|²) < 82.8 (dof 47, α=0.001) — Born\'s rule reconverges, NOT rejected',
    allPass, `χ² range over 12 seeds: ${lo.toFixed(1)}–${hi.toFixed(1)} (all < ${CRIT})`);
  // L∞ = max|obs/N − p| tightens monotonically as N grows.
  const linfs = [2000,10000,40000,200000].map(M => {
    const obs = histogram(pBorn, M, 0xC0FFEE);
    let linf = 0; for (let i=0;i<K;i++) linf = Math.max(linf, Math.abs(obs[i]/M - pBorn[i]));
    return { M, linf };
  });
  let monotone = true; for (let i=1;i<linfs.length;i++) if (linfs[i].linf >= linfs[i-1].linf) monotone = false;
  ok('#4b L∞ = max|obs/N − |ψ|²| tightens monotonically 2k→10k→40k→200k (the histogram climbs to Born)',
    monotone, linfs.map(d => `${d.M>=1000?(d.M/1000)+'k':d.M}:${d.linf.toExponential(2)}`).join(' → '));
}

// ── #5. NEGATIVE CONTROL WITH TEETH over the same 12 seeds ───────────────────
//  χ²(observed, |ψ|) ≫ 3×crit every seed (amplitude is wrong) AND χ²(observed,
//  |ψ|²) < crit every seed (non-vacuous: the right vector always passes the gate).
console.log('\n— #5 NEGATIVE CONTROL: |ψ| (amplitude) BITES ≫3×crit every seed, |ψ|² passes every seed —');
{
  const N = 40000;
  let allBite = true, allPass = true, ampLo = Infinity, ampHi = -Infinity;
  for (const s of SEEDS){
    const obs = histogram(pBorn, N, s);
    const chiAmp  = chiSquare(obs, pAmp,  N);
    const chiBorn = chiSquare(obs, pBorn, N);
    if (chiAmp <= 3*CRIT) allBite = false;
    if (chiBorn >= CRIT)  allPass = false;
    ampLo = Math.min(ampLo, chiAmp); ampHi = Math.max(ampHi, chiAmp);
  }
  ok('#5 every seed: χ²(observed,|ψ|) ≫ 3×82.8 (amplitude ≠ probability) AND χ²(observed,|ψ|²) < 82.8 (the gate is non-vacuous)',
    allBite && allPass, `χ²_|ψ| range: ${ampLo.toExponential(2)}–${ampHi.toExponential(2)} (all ≫ ${(3*CRIT).toFixed(0)}) · |ψ|² passes all 12`);
}

// ── #6. SHAPE-IDENTITY — one unmodified histogram consumes BOTH faces ─────────
//  The K=48 |ψ|² vector and the 8-bin softmax(LOGITS,T) are the SAME number[]
//  type; the SAME histogram() (the collapse operator) draws from both with no
//  branching — proof the two faces share one sampler.
console.log('\n— #6 SHAPE-IDENTITY: one histogram() draws from BOTH the K=48 |ψ|² and the 8-bin softmax —');
{
  const hQ = histogram(pBorn, 5000, 0xBEEF);              // 48-bin quantum face
  const pTok = softmax(LOGITS, 1);
  const hT = histogram(pTok, 5000, 0xBEEF);               // 8-bin token face
  const ok6 = hQ.length === K && hT.length === VOCAB.length &&
              hQ.reduce((a,b)=>a+b,0) === 5000 && hT.reduce((a,b)=>a+b,0) === 5000;
  ok('#6 the SAME unmodified histogram() consumes the 48-bin |ψ|² AND the 8-bin softmax — both are length-N number[]',
    ok6, `|ψ|²→${hQ.length} bins (Σ=${hQ.reduce((a,b)=>a+b,0)}) · softmax→${hT.length} bins (Σ=${hT.reduce((a,b)=>a+b,0)}) · one sampler, no branching`);
}

// ── #7. IRREVERSIBILITY — H(post)=0 < H(pre); non-injectivity ────────────────
console.log('\n— #7 IRREVERSIBILITY: H(post)=0 < H(pre)=entropyBits(|ψ|²); non-injective —');
{
  const Hpre = entropyBits(pBorn);
  const rng = makeRng(0xC0FFEE);
  const out = measure(pBorn, rng);
  const delta = new Array(K).fill(0); delta[out.outcome] = 1;
  const Hpost = entropyBits(delta);
  // non-injectivity: a DIFFERENT prepared state ψ_{1,3} ≠ ψ_{1,2,4}; the post-
  // state (an index) cannot invert to which ψ produced it.
  const pB13 = bornVector(normCoeffs([{n:1,c:1},{n:3,c:1}]), K, true);
  const distinct = !pBorn.every((v,i) => Math.abs(v - pB13[i]) < 1e-12);
  // there is no recover(k)→ψ exported (the module exports no inverse).
  const noInverse = typeof measurementCore.recover === 'undefined' && typeof measurementCore.unmeasure === 'undefined';
  ok('#7 H(post=δ)=0 strictly < H(pre)=entropyBits(|ψ|²); the map is non-injective and exposes no recover(k)→ψ (collapse is one-way)',
    Hpost === 0 && Hpre > 1 && distinct && noInverse,
    `H(pre)=${Hpre.toFixed(4)} bits > H(post)=${Hpost} · outcome=bin ${out.outcome} (x=${out.x.toFixed(4)}) · distinct ψ exist & no inverse exported`);
}

// ── #8. COLLAPSE-TARGET sanity ───────────────────────────────────────────────
//  token T→0 collapses to argmax(LOGITS)=idx0 (greedy); box most-probable bin is
//  argmax(bornVector(SUPER)) (the |ψ|² peak the histogram piles up on).
console.log('\n— #8 COLLAPSE-TARGET: token T→0 → argmax(LOGITS)=0; box peak bin = argmax(|ψ|²) —');
{
  const pCold = softmax(LOGITS, 0.001);
  const greedy = argmax(pCold);
  const peakBin = argmax(pBorn);
  // at T→0 the cold token distribution piles on the argmax: a seeded draw lands there.
  const drew = histogram(pCold, 1000, 0xC0FFEE);
  const drewAll0 = drew[greedy] === 1000;
  ok('#8 token T→0 collapses to argmax(LOGITS)=0 ("the"); box most-probable bin = argmax(|ψ|²)',
    greedy === 0 && greedy === argmax(LOGITS) && drewAll0 && peakBin >= 0 && peakBin < K,
    `argmax(LOGITS)=${greedy} ("${VOCAB[greedy]}") · cold draws all land on bin ${greedy} (${drew[greedy]}/1000) · |ψ|² peak bin=${peakBin} (x=${((peakBin+0.5)/K).toFixed(4)})`);
}

// ── #9. RE-EXTRACTION PARITY — the page core === the module core, the cross is live
//  Read measurement.html, slice the inline core between the banner sentinels,
//  prove the inlined sampleIndex/makeRng bodies are char-for-char the imported
//  toString(), eval the slice, and cross-boundary spot-check === the module.
console.log('\n— #9 RE-EXTRACTION PARITY: the page core === the module core, the collapse cross is live —');
{
  const html = readFileSync(join(__dir, 'measurement.html'), 'utf8');
  const BEGIN = '// ===== MEASUREMENT CORE (inlined byte-twin of measurement-core.mjs) BEGIN =====';
  const END = '// ===== MEASUREMENT CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('#9 inline-core banner sentinels present in measurement.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) the inlined sampleIndex/makeRng/histogram/chiSquare bodies are char-for-
    //     char the imported core.toString() (they TRACE to core.mjs through the
    //     module's re-export — same as partition's softmax twin); the quantum
    //     bodies are char-for-char the module's.
    const fns = {
      sampleIndex: core.sampleIndex, makeRng: core.makeRng, histogram: core.histogram,
      chiSquare: core.chiSquare, softmax: core.softmax, argmax: core.argmax, entropyBits: core.entropyBits,
      normCoeffs, bornVector, measure, chiCrit,
    };
    for (const [name, fn] of Object.entries(fns)){
      const pageSrc = extractFn(slice, name);
      ok(`#9 inlined ${name}() body is char-for-char the imported ${name}.toString()`,
        norm(pageSrc) === norm(fn.toString()),
        norm(pageSrc) === norm(fn.toString()) ? 'identical bytes' :
          `DRIFT:\n  page: ${JSON.stringify(norm(pageSrc).slice(0, 120))}…\n  mod:  ${JSON.stringify(norm(fn.toString()).slice(0, 120))}…`);
    }

    // (b) the arrow-fn quantum primitives psi_n / E_n are present char-for-char too.
    const psiOk = slice.includes('const psi_n = (n,x) => Math.SQRT2 * Math.sin(n*Math.PI*x);');
    const EnOk  = slice.includes('const E_n   = n => n*n*Math.PI*Math.PI/2;');
    ok('#9 inlined psi_n / E_n arrow-fns are char-for-char the Cavern box eigenstate',
      psiOk && EnOk, `psi_n present: ${psiOk} · E_n present: ${EnOk}`);

    // (c) eval the slice and check cross-boundary values === the module.
    let PageCore = null, evalErr = null;
    const RET = '\n;return { psi_n, E_n, SUPER, K, normCoeffs, bornVector, measure, sampleIndex, makeRng, histogram, chiSquare, softmax, argmax, entropyBits, LOGITS };';
    try { PageCore = new Function(slice + RET)(); } catch (e) { evalErr = e; }
    ok('#9 inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (PageCore){
      const pPage = PageCore.bornVector(PageCore.normCoeffs(PageCore.SUPER), PageCore.K, true);
      const agree = pPage.every((v,idx) => v === pBorn[idx]);
      // deterministic collapse across the boundary: same seed → same outcome.
      const oPage = PageCore.measure(pPage, PageCore.makeRng(0xC0FFEE)).outcome;
      const oMod  = measure(pBorn, makeRng(0xC0FFEE)).outcome;
      ok('#9 cross-boundary: page bornVector(SUPER) === module |ψ|², and the same seed collapses to the same outcome',
        agree && oPage === oMod, `page |ψ|² === module → ${agree} · page collapse bin ${oPage} === module bin ${oMod}`);

      // (d) the page's measure() CALLS its inlined sampleIndex twin (same body the
      //     module imports) — the collapse cross is a real code-dependency.
      const pageMeasureSrc = norm(extractFn(slice, 'measure'));
      const callsSampler = /sampleIndex\(/.test(pageMeasureSrc);
      ok('#9 the page\'s measure() CALLS its inlined sampleIndex twin (same body the module imports) — collapse is a real code-dependency',
        callsSampler && measurementCore.sampleIndex === core.sampleIndex,
        `page measure() calls sampleIndex(): ${callsSampler} · module sampleIndex === core.sampleIndex: ${measurementCore.sampleIndex === core.sampleIndex}`);
    }
  }
}

// ── #10. DETERMINISM — identical seed → byte-identical histograms + χ² ───────
console.log('\n— #10 DETERMINISM: identical seed → byte-identical histograms + χ² —');
{
  const a = histogram(pBorn, 40000, 0xC0FFEE), b = histogram(pBorn, 40000, 0xC0FFEE);
  const same = a.every((v,i) => v === b[i]);
  const chiA = chiSquare(a, pBorn, 40000), chiB = chiSquare(b, pBorn, 40000);
  ok('#10 identical seed → byte-identical histogram and identical χ² (the collapse is pure given its rng)',
    same && chiA === chiB, `histograms identical: ${same} · χ²=${chiA.toFixed(6)} (×2 identical: ${chiA === chiB})`);
}

// ── #11. FROZEN-LITERAL PINS ─────────────────────────────────────────────────
//  E_n(1)=π²/2 matches the Cavern box; SUPER + LOGITS literals + T_RANGE pinned.
console.log('\n— #11 FROZEN-LITERAL PINS: E_n(1)=π²/2 (Cavern box), SUPER/LOGITS/T_RANGE pinned —');
{
  const boxMatch = Math.abs(E_n(1) - Math.PI*Math.PI/2) < 1e-15 && Math.abs(E_n(4) - 16*Math.PI*Math.PI/2) < 1e-12;
  const psiMatch = Math.abs(psi_n(1,0.5) - Math.SQRT2) < 1e-15;   // √2·sin(π/2)=√2
  const superOk = SUPER.length === 3 && SUPER[0].n===1 && SUPER[1].n===2 && SUPER[2].n===4 &&
                  SUPER.every(t => t.c === 1);
  const logitsOk = LOGITS.length === 8 && LOGITS[0] === 3.4 && argmax(LOGITS) === 0;
  const rangeOk = T_RANGE.LO === core.T_RANGE.LO && T_RANGE.HI === core.T_RANGE.HI && K === 48;
  ok('#11 E_n(1)=π²/2 & E_n(4)=8π² (box ladder), psi_n(1,½)=√2, SUPER=ψ₁+ψ₂+ψ₄, LOGITS pinned, T_RANGE===core.T_RANGE, K=48',
    boxMatch && psiMatch && superOk && logitsOk && rangeOk,
    `E_n(1)=${E_n(1).toFixed(4)} (=π²/2) · SUPER=[${SUPER.map(t=>t.n).join(',')}] · K=${K} · T_RANGE=[${T_RANGE.LO},${T_RANGE.HI}]===core`);
}

// ── #12. RECIPROCITY — the cross-links resolve both ways ─────────────────────
//  cavern/box teaser → ../../clockwork/measurement.html; the page's Dial cross
//  → ./temperature.html; the page's box cross → ../cavern/box/index.html.
console.log('\n— #12 RECIPROCITY: the cross-links resolve both ways —');
{
  const boxHtml = readFileSync(join(__dir, '..', 'cavern', 'box', 'index.html'), 'utf8');
  const pageHtml = readFileSync(join(__dir, 'measurement.html'), 'utf8');
  const boxTeasesMeasurement = boxHtml.includes('../../clockwork/measurement.html');
  const pageCrossesDial = pageHtml.includes('./temperature.html');
  const pageCrossesBox  = pageHtml.includes('../cavern/box/index.html');
  ok('#12 cavern/box teases → measurement.html; the page crosses → temperature.html AND ../cavern/box (reciprocal both ways)',
    boxTeasesMeasurement && pageCrossesDial && pageCrossesBox,
    `box→measurement: ${boxTeasesMeasurement} · page→Dial: ${pageCrossesDial} · page→box: ${pageCrossesBox}`);
}

// ── #13. THE SHARED SELF-TEST runs green at N≫ (the in-page legs are a subset) ─
console.log('\n— #13 SHARED SELF-TEST: runSelfTest() is all-green at N=40k —');
{
  const r = runSelfTest({ N: 40000, seed: 0xC0FFEE });
  ok(`#13 runSelfTest({N:40000}) is ${r.pass}/${r.total} all-green (the in-page 6 legs are a subset of this)`,
    r.pass === r.total, r.lines.map(l => (l.ok?'✓':'✗')).join(''));
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// (skips the balanced parameter parens — handles destructured/defaulted params —
//  then brace-matches the BODY. Identical matcher to partition-core.test.mjs.)
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index), pd = 0, q = p;
  for (; q < src.length; q++){
    if (src[q] === '(') pd++;
    else if (src[q] === ')') { pd--; if (pd === 0) { q++; break; } }
  }
  let i = src.indexOf('{', q);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++){
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
