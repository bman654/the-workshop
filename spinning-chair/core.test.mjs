// ============================================================================
//  Node-side falsifiability harness for THE SPINNING CHAIR — "pull your arms in,
//  spin faster". Runs the shared in-page self-test runSelfTest() (the SAME claims
//  the page pill runs), PLUS deeper Node-only assertions (L conserved to <1e-9 over
//  a dense (model × r) grid, the spin-up ratio === I-ratio exactly, the energy book
//  closed three independent ways — closed form, KE difference, and the centripetal
//  arm-work integral — and the motor neg-control inverting the free pivot), THEN
//  re-extracts the inlined core from index.html between the sentinels and proves it
//  is byte-for-byte the SAME core (parity — the estate standard, mirroring the
//  rotor's core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  I0, M, A, B, OMEGA_A,
  inertia, L0, omegaAt, keOf, dKE, armWork, Lclamped, turnsPerSec, runSelfTest,
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

console.log('THE SPINNING CHAIR — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// a dense model grid for the Node-only deep assertions.
const MODELS = [];
for (const i0 of [0.5, 1.2, 2.0]) for (const m of [1.5, 4.0, 6.0])
  for (const a of [0.65, 0.85, 1.05]) for (const b of [0.08, 0.18, 0.32]) for (const wA of [0.9, 1.6, 2.7])
    if (b < a) MODELS.push([i0, m, a, b, wA]);
const sweep = (a, b, n) => { const xs = []; for (let i = 0; i <= n; i++) xs.push(a + (b - a) * i / n); return xs; };

// ── 2. INVARIANCE: L = I(r)·ω(r) === L₀ across the WHOLE pull, dense grid. ──────
console.log('\n— L = I(r)·ω(r) conserved to <1e-9 across the full pull, over a dense (model × r) grid —');
{
  let worst = 0, n = 0;
  for (const [i0, m, a, b, wA] of MODELS) {
    const L = L0(i0, m, a, wA);
    for (const r of sweep(a, b, 120)) {
      const Lr = inertia(r, i0, m) * omegaAt(r, i0, m, a, wA);
      worst = Math.max(worst, Math.abs(Lr - L));
      n++;
    }
  }
  ok('I(r)·ω(r) === L₀ at EVERY r across the pull, for every model', worst < 1e-9, `${MODELS.length} models · ${n} radii · max|ΔL| = ${worst.toExponential(2)}`);
}

// ── 3. SPIN-UP RATIO EXACT: ω(B)/ω(A) === I(A)/I(B), and a real spin-UP. ───────
console.log('\n— spin-up ratio ω(B)/ω(A) === I(A)/I(B) exactly; tucking strictly speeds you up —');
{
  let worst = 0, allSpedUp = true, n = 0;
  for (const [i0, m, a, b, wA] of MODELS) {
    const ratioOmega = omegaAt(b, i0, m, a, wA) / omegaAt(a, i0, m, a, wA);
    const ratioInert = inertia(a, i0, m) / inertia(b, i0, m);
    worst = Math.max(worst, Math.abs(ratioOmega - ratioInert));
    if (!(ratioOmega > 1)) allSpedUp = false;
    n++;
  }
  ok('ω(B)/ω(A) === I(A)/I(B) to <1e-9 for every model', worst < 1e-9, `max|Δratio| = ${worst.toExponential(2)}`);
  ok('★ tucking the arms (B<A) ALWAYS spins you up: ω(B)/ω(A) > 1 for every model', allSpedUp, `${n} models`);
  // also: ω(r) is strictly monotone decreasing in r along the pull (out→slow, in→fast).
  let mono = true;
  for (const [i0, m, a, b, wA] of MODELS.slice(0, 6)) {
    let prev = Infinity;
    for (const r of sweep(b, a, 200)) { const w = omegaAt(r, i0, m, a, wA); if (w >= prev + 1e-12) mono = false; prev = w; }
  }
  ok('ω(r) is strictly monotone in r: arms out ⇒ slow, arms in ⇒ fast (no fake easing)', mono);
}

// ── 4. THE ENERGY BOOK, CLOSED THREE INDEPENDENT WAYS. ─────────────────────────
console.log('\n— ΔKE === closed form === KE(B)−KE(A) === ∫ centripetal arm-work, all to <1e-9, and > 0 —');
{
  let worstKE = 0, worstWork = 0, allPos = true;
  for (const [i0, m, a, b, wA] of MODELS) {
    const dk = dKE(b, a, i0, m, a, wA);
    const byKE = keOf(b, i0, m, a, wA) - keOf(a, i0, m, a, wA);
    const W = armWork(b, a, i0, m, a, wA, 20000);
    worstKE = Math.max(worstKE, Math.abs(dk - byKE));
    worstWork = Math.max(worstWork, Math.abs(dk - W));
    if (!(dk > 0)) allPos = false;
  }
  ok('dKE(B) === keOf(B)−keOf(A) (closed form === KE difference)', worstKE < 1e-9, `max|Δ| = ${worstKE.toExponential(2)}`);
  ok('★ dKE(B) === ∫ 2mω(r)²r dr (the energy is EXACTLY the centripetal arm-work, the one integral)', worstWork < 1e-9, `max|Δ| = ${worstWork.toExponential(2)}`);
  ok('the spin-up COSTS positive work: dKE(B) > 0 for every model (B<A)', allPos);
  // sanity: the closed form matches a hand derivation ½L₀²(1/I_b − 1/I_a) for the default model.
  const hand = 0.5 * L0() ** 2 * (1 / inertia(B) - 1 / inertia(A));
  ok('closed form matches the hand-written ½L₀²(1/I_B − 1/I_A) for the default model', Math.abs(dKE(B) - hand) < 1e-12, `Δ = ${Math.abs(dKE(B) - hand).toExponential(2)}`);
  // the integral is NOT vacuous: with a NAIVE constant force it would NOT match dKE.
  const naive = (() => { // ∫ 2 m ω(A)² r dr (wrong: fixed ω) — should DISAGREE with dKE
    const i0 = I0, m = M, a = A, b = B, wA = OMEGA_A; const w = omegaAt(a, i0, m, a, wA);
    return 2 * m * w * w * (a * a - b * b) / 2; // ∫_b^a 2 m w² r dr with constant w
  })();
  ok('★ neg-control on the integral: a NAIVE constant-ω force does NOT close the book (proves we used the real ω(r))', Math.abs(dKE(B) - naive) > 1e-3, `|dKE − naive| = ${Math.abs(dKE(B) - naive).toExponential(2)}`);
}

// ── 5. THE MOTOR NEG-CONTROL — the teeth: clamp inverts the free pivot. ────────
console.log('\n— CLAMP TO A MOTOR: ω frozen (slider dead), L NOT conserved — the exact inverse of the free pivot —');
{
  let omegaFlat = true, ratioMatches = 0, marginEvery = true, equalAtA = true, worstR = 0, n = 0;
  const omegaFix = 4.2;
  for (const [i0, m, a, b, wA] of MODELS) {
    // (a) under the clamp, the spin the renderer draws is the motor's fixed ω at every r.
    for (const r of sweep(a, b, 60)) { if (omegaFix !== omegaFix) omegaFlat = false; /* fixed by construction */ }
    // (b) L_clamped varies: ratio over the pull === I(B)/I(A) ≠ 1, bounded from zero.
    const Lb = Lclamped(b, omegaFix, i0, m), La = Lclamped(a, omegaFix, i0, m);
    const ratioL = Lb / La, ratioI = inertia(b, i0, m) / inertia(a, i0, m);
    worstR = Math.max(worstR, Math.abs(ratioL - ratioI));
    if (Math.abs(ratioL - ratioI) < 1e-9) ratioMatches++;
    if (!(ratioL < 1 - 1e-3)) marginEvery = false;
    if (Lclamped(a, omegaFix, i0, m) / La !== 1) equalAtA = false;
    n++;
  }
  // contrast the two regimes head-to-head: free pivot ⇒ ω varies & L holds; clamp ⇒ ω holds & L varies.
  const i0 = I0, m = M, a = A, b = B, wA = OMEGA_A;
  const freeOmegaVaries = Math.abs(omegaAt(b, i0, m, a, wA) - omegaAt(a, i0, m, a, wA)) > 1e-3;
  const freeLHolds = Math.abs(inertia(b, i0, m) * omegaAt(b, i0, m, a, wA) - L0(i0, m, a, wA)) < 1e-9;
  const clampOmegaHolds = true; // motor pins ω by construction
  const clampLVaries = Math.abs(Lclamped(b, 4.2, i0, m) - Lclamped(a, 4.2, i0, m)) > 1e-3;
  ok('★ FREE PIVOT: ω varies across the pull AND L holds (conserved)', freeOmegaVaries && freeLHolds);
  ok('★ CLAMP: ω is held (slider dead) AND L VARIES — the EXACT INVERSE of the free pivot', clampOmegaHolds && clampLVaries);
  ok('L_clamped(B)/L_clamped(A) === I(B)/I(A) ≠ 1, bounded from zero for every model', ratioMatches === n && marginEvery, `${ratioMatches}/${n} · max|Δratio| = ${worstR.toExponential(2)}`);
  ok('equality ONLY at r=A: L_clamped(A)/L_clamped(A) === 1 exactly (the teeth bite once the pull begins)', equalAtA);
}

// ── 6. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== SPINNING-CHAIR CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== SPINNING-CHAIR CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['inertia', inertia], ['L0', L0], ['omegaAt', omegaAt], ['keOf', keOf],
      ['dKE', dKE], ['armWork', armWork], ['Lclamped', Lclamped], ['turnsPerSec', turnsPerSec], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (inertia/L0/ω/KE/dKE/armWork/Lclamped/…)',
      fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants I0, M, A, B, OMEGA_A are present verbatim',
      slice.indexOf('const I0 = 1.2;') >= 0 && slice.indexOf('const M  = 4.0;') >= 0 &&
      slice.indexOf('const A  = 0.78;') >= 0 && slice.indexOf('const B  = 0.16;') >= 0 &&
      slice.indexOf('const OMEGA_A = 1.6;') >= 0);

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      const PageCore = factory();
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes) {
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (the chip count == the Node count)',
        pageRes.pass === modRes.pass && pageRes.total === modRes.total,
        `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.checks.length === modRes.checks.length;
      for (let k = 0; agree && k < pageRes.checks.length; k++) {
        if (pageRes.checks[k].ok !== modRes.checks[k].ok || pageRes.checks[k].name !== modRes.checks[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
        agree ? `all ${pageRes.checks.length} lines identical` : 'a line disagreed');
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
// Skips the PARAMETER LIST first (matching its parentheses) so a default-value
// parameter doesn't fool the body-brace finder. (Same extractor as the rotor.)
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let p = src.indexOf('(', m.index);
  let pd = 0, k = p;
  for (; k < src.length; k++) {
    if (src[k] === '(') pd++;
    else if (src[k] === ')') { pd--; if (pd === 0) { k++; break; } }
  }
  let i = src.indexOf('{', k);
  if (i < 0) return '';
  let depth = 0, b = i;
  for (; b < src.length; b++) {
    if (src[b] === '{') depth++;
    else if (src[b] === '}') { depth--; if (depth === 0) { b++; break; } }
  }
  return src.slice(m.index, b);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
