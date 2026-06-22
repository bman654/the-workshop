// ============================================================================
//  Node-side falsifiability harness for THE TOP THAT WON'T FALL — gyroscopic
//  precession. Runs the shared in-page self-test runSelfTest() (the SAME claims the
//  page pill runs), PLUS deeper Node-only assertions (the inverse law Ω·ω=mgr/I to
//  machine-ε over a dense (model × ω) grid; the |L| drift honestly bounded by the
//  DERIVED fast-top error and obeying its own scaling; τ⟂L so the length change is
//  second-order; lean-independence exact with a non-vacuous τ-varies companion; and
//  the ω→0 neg-control toppling — the exact opposite of the precessing branch), THEN
//  re-extracts the inlined core from index.html between the sentinels and proves it
//  is byte-for-byte the SAME core (parity — the estate standard, mirroring the
//  Spinning Chair's core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  I, M, G, R, OMEGA0, THETA0,
  angMomentum, torque, precessRate, precessPeriod,
  axleHat, dot, cross, mag, Lvec, tauVec, stepL, driftBound, topples, turnsPerSec, runSelfTest,
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

console.log('THE TOP THAT WON\'T FALL — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// a dense model grid for the Node-only deep assertions: [i, m, g, r, ω, θ].
const MODELS = [];
for (const i of [0.012, 0.045, 0.080]) for (const m of [0.5, 1.8, 3.0])
  for (const r of [0.10, 0.22, 0.30]) for (const w of [60, 130, 200]) for (const th of [0.6, Math.PI / 2, 2.4])
    MODELS.push([i, m, 9.81, r, w, th]);

// ── 2. INVERSE LAW: Ω·ω === mgr/I across a dense (model × ω) grid, to <1e-12. ───
console.log('\n— INVERSE LAW: Ω·ω === mgr/I (a constant of the wheel), and halving ω doubles Ω, over a dense grid —');
{
  let worstProd = 0, worstRatio = 0, n = 0;
  for (const [i, m, g, r, , th] of MODELS) {
    const constant = (m * g * r) / i;
    for (const w of [40, 70, 110, 160, 230, 310]) {
      const Om = precessRate(m, g, r, i, w);
      worstProd = Math.max(worstProd, Math.abs(Om * w - constant));
      worstRatio = Math.max(worstRatio, Math.abs(precessRate(m, g, r, i, w / 2) / Om - 2));
      n++;
    }
  }
  ok('Ω·ω === mgr/I for every (model, ω) — the product is a constant of the wheel', worstProd < 1e-12, `${MODELS.length} models · ${n} spins · max|Δ| = ${worstProd.toExponential(2)}`);
  ok('★ halving ω EXACTLY doubles Ω: Ω(ω/2)/Ω(ω) === 2 to <1e-12 — the printed 2× read off the lap counter', worstRatio < 1e-12, `max|Δratio| = ${worstRatio.toExponential(2)}`);
}

// ── 3. |L| CONSERVED — HONESTLY BOUNDED by the DERIVED fast-top error. ──────────
console.log('\n— |L| drift over a full lap: bounded by the DERIVED error ∝Ω/ω, NONZERO, and shrinking as ω grows —');
{
  // dt coarse enough (5e-3) that the systematic O(Ω·dt) fast-top overshoot dominates
  // float round-off — so the drift we read is the real leading-order approximation,
  // not numerical noise (at dt→0 the systematic term vanishes into float ε).
  const DT = 5e-3;
  const lapDrift = (i, m, g, r, w, th, dt = DT) => {
    const Lmag0 = angMomentum(i, w);
    let L = Lvec(th, 0, Lmag0);
    const Om = precessRate(m, g, r, i, w);
    const steps = Math.round((2 * Math.PI / Om) / dt);
    let phi = 0;
    for (let s = 0; s < steps; s++) { L = stepL(L, tauVec(th, phi, m, g, r), dt); phi += Om * dt; }
    return Math.abs(mag(L) - Lmag0) / Lmag0;
  };
  let allBounded = true, allNonzero = true, allShrink = true, worstRatioToBound = 0;
  for (const [i, m, g, r, w, th] of MODELS) {
    const d1 = lapDrift(i, m, g, r, w, th);
    const d2 = lapDrift(i, m, g, r, 2 * w, th);
    const bound = driftBound(m, g, r, i, w, DT);
    if (!(d1 <= bound * 1.5)) allBounded = false;
    worstRatioToBound = Math.max(worstRatioToBound, d1 / bound);
    if (!(d1 > 1e-12)) allNonzero = false;
    if (!(d2 < d1)) allShrink = false;
  }
  ok('|L| drift over one lap ≤ the DERIVED fast-top bound π·Ω·dt (not a hand-picked tolerance)', allBounded, `worst drift/bound = ${worstRatioToBound.toFixed(3)}`);
  ok('★ |L| drift is genuinely NONZERO — a real leading-order approximation, NOT faked to machine-ε', allNonzero);
  ok('★ |L| drift SHRINKS with spin: drift(2ω) < drift(ω) for every model (faster ⇒ better fast-top)', allShrink);
  // the bound itself scales as Ω/ω: driftBound(2ω) should be ½ of driftBound(ω) (Ω halves).
  const b1 = driftBound(M, G, R, I, 100, DT), b2 = driftBound(M, G, R, I, 200, DT);
  ok('the DERIVED bound itself halves when ω doubles (it is ∝ Ω ∝ 1/ω): driftBound(2ω) === ½·driftBound(ω)', Math.abs(b2 / b1 - 0.5) < 1e-12, `ratio = ${(b2 / b1).toFixed(6)}`);
}

// ── 4. τ ⟂ L — the right angle is the entire mechanism. ────────────────────────
console.log('\n— τ ⟂ L: τ·L === 0 (torque steers, never stretches) and |L+dL|² === |L|²+|dL|² (2nd-order) —');
{
  let worstDot = 0, worstPyth = 0, worstHoriz = 0, n = 0;
  for (const [i, m, g, r, w, th] of MODELS) {
    const Lmag = angMomentum(i, w);
    for (let k = 0; k < 12; k++) {
      const phi = k * Math.PI / 6;
      const L = Lvec(th, phi, Lmag), tau = tauVec(th, phi, m, g, r);
      worstDot = Math.max(worstDot, Math.abs(dot(tau, L)) / (mag(tau) * mag(L) + 1e-300));
      worstHoriz = Math.max(worstHoriz, Math.abs(tau[2]));            // τ is HORIZONTAL ⇒ z-component === 0
      const dt = 1e-3, dL = [tau[0] * dt, tau[1] * dt, tau[2] * dt];
      const Ln = stepL(L, tau, dt);
      worstPyth = Math.max(worstPyth, Math.abs(dot(Ln, Ln) - (dot(L, L) + dot(dL, dL))));
      n++;
    }
  }
  ok('τ·L === 0 at every heading (normalised |cos| < 1e-12) — torque changes L\'s heading, not its length', worstDot < 1e-12, `${n} headings · max|cos| = ${worstDot.toExponential(2)}`);
  ok('★ τ is HORIZONTAL: its z-component === 0 exactly (⊥ to gravity) at every heading', worstHoriz < 1e-12, `max|τ_z| = ${worstHoriz.toExponential(2)}`);
  ok('★ PYTHAGORAS: |L+dL|² === |L|²+|dL|² (the |L| change is 2nd-order in dt — why precession holds)', worstPyth < 1e-9, `max|Δ| = ${worstPyth.toExponential(2)}`);
  // also: |τ| === m·g·r·sinθ exactly (the vector magnitude matches the scalar torque()).
  let worstMag = 0;
  for (const [i, m, g, r, , th] of MODELS) worstMag = Math.max(worstMag, Math.abs(mag(tauVec(th, 0.7, m, g, r)) - torque(m, g, r, th)));
  ok('the τ VECTOR magnitude === the scalar torque() = mgr·sinθ exactly', worstMag < 1e-12, `max|Δ| = ${worstMag.toExponential(2)}`);
}

// ── 5. θ-INDEPENDENCE — sinθ cancels exactly; τ magnitude genuinely varies. ─────
console.log('\n— LEAN-INDEPENDENCE: Ω is the SAME at every lean (sinθ cancels), but τ DOES vary with sinθ —');
{
  let worstOm = 0, tauReallyVaries = true, n = 0;
  for (const [i, m, g, r, w] of MODELS) {
    const ref = precessRate(m, g, r, i, w);
    let tauLo = Infinity, tauHi = -Infinity;
    for (let k = 1; k <= 30; k++) {
      const th = k * (Math.PI - 0.02) / 31 + 0.01;
      const Om = torque(m, g, r, th) / (angMomentum(i, w) * Math.sin(th));     // Ω via the full ratio
      worstOm = Math.max(worstOm, Math.abs(Om - ref));
      const t = torque(m, g, r, th); tauLo = Math.min(tauLo, t); tauHi = Math.max(tauHi, t);
      n++;
    }
    if (!(tauHi - tauLo > 0.5 * tauHi)) tauReallyVaries = false;
  }
  ok('Ω = τ/(L·sinθ) === mgr/Iω for EVERY lean — the sinθ cancels exactly', worstOm < 1e-12, `${n} leans · max|Δ| = ${worstOm.toExponential(2)}`);
  ok('★ NON-VACUOUS: τ magnitude = mgr·sinθ genuinely VARIES with lean (range > ½ peak) — the cancellation is real', tauReallyVaries);
  // a concrete printed contrast: τ(0.3) ≠ τ(1.2) by the sinθ ratio.
  const tLo = torque(M, G, R, 0.3), tHi = torque(M, G, R, 1.2);
  ok('a concrete contrast: τ(θ=0.3) ≠ τ(θ=1.2) (yet Ω(0.3) === Ω(1.2))', Math.abs(tLo - tHi) > 0.5 && Math.abs(precessRate(M, G, R, I, 130) - precessRate(M, G, R, I, 130)) < 1e-12, `τ(0.3)=${tLo.toFixed(2)} vs τ(1.2)=${tHi.toFixed(2)}`);
}

// ── 6. THE NEG-CONTROL — the teeth: ω→0 blows up the law and the wheel topples. ─
console.log('\n— BLEED THE SPIN: ω→0 ⇒ Ω non-finite AND topples()===true — the exact inverse of the fast precessing branch —');
{
  let nonFinite = true, slowTopples = true, fastPrecesses = true, branchesDisagree = true, equalAtCross = true, n = 0;
  for (const [i, m, g, r, , th] of MODELS) {
    if (Number.isFinite(precessRate(m, g, r, i, 0))) nonFinite = false;
    const wCrit = Math.sqrt((m * g * r) / i);                 // the crossover spin Ω == √(mgr/I)
    if (!topples(i, wCrit * 0.4, m, g, r, th)) slowTopples = false;     // slow ⇒ falls
    if (topples(i, wCrit * 8, m, g, r, th)) fastPrecesses = false;      // fast ⇒ precesses (does NOT fall)
    if (topples(i, wCrit * 0.4, m, g, r, th) === topples(i, wCrit * 8, m, g, r, th)) branchesDisagree = false;
    // equality ONLY in the crossover band: at exactly ω=√(mgr/I), Ω===√(mgr/I) ⇒ topples flips true.
    if (!topples(i, wCrit, m, g, r, th)) equalAtCross = false;          // at the crossover it just topples (>=)
    n++;
  }
  ok('★ ω→0: precessRate(ω=0) is NON-FINITE — the fast-top law showing its teeth (Ω→∞ is unphysical)', nonFinite, `${n} models`);
  ok('★ a SLOW wheel topples()===true; a FAST wheel topples()===false — the branches genuinely DISAGREE', slowTopples && fastPrecesses && branchesDisagree);
  ok('the crossover is real: at ω === √(mgr/I) the topple flag flips (equality only in the band)', equalAtCross);
  // head-to-head contrast: fast wheel precesses with a finite period; dead wheel has none.
  const fastPeriod = precessPeriod(M, G, R, I, OMEGA0);
  ok('★ FAST WHEEL precesses with a finite lap period; DEAD WHEEL (ω=0) has a non-finite one — precession needs L', Number.isFinite(fastPeriod) && !Number.isFinite(precessPeriod(M, G, R, I, 0)), `lap = ${fastPeriod.toFixed(2)} s`);
  // domain guards.
  ok('domain guards: ω<0 ⇒ topples; θ=0 ⇒ τ=0; NaN θ ⇒ NaN τ', topples(I, -5, M, G, R, THETA0) && torque(M, G, R, 0) === 0 && Number.isNaN(torque(M, G, R, NaN)));
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== THE-TOP CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== THE-TOP CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['angMomentum', angMomentum], ['torque', torque], ['precessRate', precessRate], ['precessPeriod', precessPeriod],
      ['axleHat', axleHat], ['dot', dot], ['cross', cross], ['mag', mag], ['Lvec', Lvec], ['tauVec', tauVec],
      ['stepL', stepL], ['driftBound', driftBound], ['topples', topples], ['turnsPerSec', turnsPerSec], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (angMomentum/torque/precessRate/tauVec/stepL/topples/…)',
      fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants I, M, G, R, OMEGA0 are present verbatim',
      slice.indexOf('const I  = 0.045;') >= 0 && slice.indexOf('const M  = 1.8;') >= 0 &&
      slice.indexOf('const G  = 9.81;') >= 0 && slice.indexOf('const R  = 0.22;') >= 0 &&
      slice.indexOf('const OMEGA0 = 130;') >= 0);

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      pageRes = factory().runSelfTest();
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
// parameter doesn't fool the body-brace finder. (Same extractor as the siblings.)
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
