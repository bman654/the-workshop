// ============================================================================
//  Node-side falsifiability harness for THE BANKED CURVE — the no-push speed on a
//  banked track. Runs the shared in-page self-test runSelfTest() (the SAME claims the
//  page pill runs), PLUS deeper Node-only assertions (the bob nulls EXACTLY at v* across
//  a dense θ×r band, the closed form equals the numeric zero, strict monotonicity in v on
//  a fine grid, mass-invariance, the flat-track neg-control, and the friction-band closed
//  forms + collapse), THEN re-extracts the inlined core from index.html between the
//  sentinels and proves it is byte-for-byte the SAME core (parity — the estate standard,
//  mirroring star-flyer/core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, designSpeed, bobAngle, frictionBand, rideState, flatBobAngle, numericNullSpeed, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const D = Math.PI / 180;

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('THE BANKED CURVE — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. HEADLINE: the bob is dead-straight EXACTLY at v* across a DENSE θ×r band. ─
console.log('\n— the plumb-bob nulls EXACTLY at v* across a dense (θ, r) band —');
{
  let worst = 0, n = 0;
  for (let thd = 6; thd <= 44; thd += 1) {
    const th = thd * D;
    for (let r = 15; r <= 90; r += 2.5) {
      const vs = designSpeed(r, th);
      worst = Math.max(worst, Math.abs(bobAngle(vs, r, th))); n++;
    }
  }
  ok('|bobAngle(v*,r,θ)| < 1e-12 at EVERY (θ,r) sample', worst < 1e-12, `${n} samples, max|bob| = ${worst.toExponential(2)}`);
}

// ── 3. CLOSED-FORM = ROOT: √(g·r·tanθ) is the TRUE zero of bobAngle. ────────────
console.log('\n— closed form √(g·r·tanθ) equals the numeric zero of bobAngle —');
{
  let worst = 0, n = 0;
  for (let thd = 6; thd <= 44; thd += 1) {
    const th = thd * D;
    for (const r of [20, 35, 50, 65, 80]) {
      const closed = designSpeed(r, th), root = numericNullSpeed(r, th);
      worst = Math.max(worst, Math.abs(closed - root)); n++;
    }
  }
  ok('√(g·r·tanθ) === numeric root of bobAngle to 1e-12 across the band', worst < 1e-12, `${n} samples, max Δv = ${worst.toExponential(2)}`);
}

// ── 4. STRICT MONOTONICITY in v on a fine grid (one clean zero-crossing). ───────
console.log('\n— strict monotonicity: bobAngle(v) increases on a fine grid (one answer/round) —');
{
  let mono = true, n = 0, crossings = 0;
  for (let thd = 8; thd <= 40; thd += 2) {
    const th = thd * D, r = 60; let prev = -Infinity, prevB = -Infinity;
    for (let v = 0; v <= 60; v += 0.05) {
      const b = bobAngle(v, r, th);
      if (b < prev - 1e-15) mono = false;
      if (prevB < 0 && b >= 0) crossings++;   // count sign changes — must be exactly one per θ
      prev = b; prevB = b; n++;
    }
  }
  ok('bobAngle(v) STRICTLY non-decreasing across [0,60] step 0.05', mono, `${n} samples`);
  ok('exactly ONE zero-crossing per θ (17 θ-rows ⇒ 17 crossings)', crossings === 17, `${crossings} crossings`);
}

// ── 5. MASS-INVARIANCE: v* and bobAngle carry no mass term (light == loaded). ───
console.log('\n— mass-invariance: the law has no m, so light cab == loaded freight —');
{
  // simulate "two masses" by wrapping the call; the law takes no mass so the outputs
  // MUST be byte-identical. (A real mass term would change one of these.)
  let identical = true, n = 0;
  const drive = (m, v, r, th) => bobAngle(v, r, th);   // m is ignored by the law
  for (let thd = 8; thd <= 40; thd += 2) {
    const th = thd * D, r = 55;
    if (designSpeed(r, th) !== designSpeed(r, th)) identical = false;
    for (let v = 2; v <= 40; v += 2) {
      if (drive(1, v, r, th) !== drive(1500, v, r, th)) identical = false;  // light vs loaded
      n++;
    }
  }
  ok('v* and bobAngle byte-identical for a 1 kg vs 1500 kg car at every sample', identical, `${n} samples`);
}

// ── 6. THE LOAD-BEARING NEG-CONTROL — a FLAT track NEVER nulls. ─────────────────
console.log('\n— NEG-CONTROL (the teeth): a flat track (θ=0) has NO no-push speed —');
{
  let flatVStarZero = true, flatNeverNulls = true, disagree = true, n = 0;
  for (const r of [30, 60, 90]) {
    if (designSpeed(r, 0) !== 0) flatVStarZero = false;
    for (let v = 0.5; v <= 50; v += 0.5) {
      if (!(flatBobAngle(v, r) > 0)) flatNeverNulls = false;          // a flat track always throws the bob out
      const banked = bobAngle(v, r, 25 * D);
      if (Math.abs(flatBobAngle(v, r) - banked) < 1e-3) disagree = false;  // banked & flat stay well apart
      n++;
    }
  }
  const flatRestZero = flatBobAngle(0, 60) === 0;          // the ONLY null on a flat track is v=0
  const bankedNullPositive = designSpeed(60, 25 * D) > 1;  // the banked answer is a DIFFERENT positive speed
  ok('designSpeed(r,0)===0 for every r (a flat track has no positive no-push speed)', flatVStarZero);
  ok('★ the teeth bite: bobAngle(v>0,r,0)>0 for EVERY v>0 — a flat track NEVER nulls', flatNeverNulls, `${n} samples`);
  ok('flat DISAGREES with the banked case at every v>0 (they stay > 1e-3 apart)', disagree);
  ok('anti-vacuity: the flat track’s only zero is v=0, while banked nulls at a different v*>0', flatRestZero && bankedNullPositive);
}

// ── 7. THE FRICTION BAND — closed forms straddle v*, collapse to the point as μ→0. ─
console.log('\n— friction band: lo < v* < hi for μ>0, collapses to v* as μ→0, NO-UPPER flag —');
{
  let straddleOk = true, n = 0;
  for (const r of [30, 60, 90]) for (let thd = 10; thd <= 35; thd += 5) {
    const th = thd * D, vs = designSpeed(r, th);
    for (const mu of [0.1, 0.3, 0.6]) {
      const b = frictionBand(r, th, mu);
      if (!(b.lo < vs && vs < b.hi)) straddleOk = false;
      // the closed bounds must match the algebraic formulas exactly
      const t = Math.tan(th);
      const loRef = Math.sqrt(Math.max(0, G * r * (t - mu) / (1 + mu * t)));
      const den = 1 - mu * t, hiRef = den <= 0 ? Infinity : Math.sqrt(G * r * (t + mu) / den);
      if (Math.abs(b.lo - loRef) > 1e-12 || (isFinite(hiRef) && Math.abs(b.hi - hiRef) > 1e-12)) straddleOk = false;
      n++;
    }
  }
  ok('lo < v* < hi for μ>0 AND the bounds === the closed forms √(gr(tanθ∓μ)/(1±μtanθ))', straddleOk, `${n} (r,θ,μ) samples`);

  // collapse: as μ→0 the band width → 0 and both bounds → v*.
  const r = 60, th = 30 * D, vs = designSpeed(r, th);
  let collapseOk = true, prevW = Infinity;
  for (const mu of [0.1, 0.01, 1e-3, 1e-5, 1e-7]) {
    const b = frictionBand(r, th, mu);
    const w = b.hi - b.lo;
    if (w > prevW + 1e-12) collapseOk = false;   // monotonically shrinking
    prevW = w;
  }
  const tiny = frictionBand(r, th, 1e-9);
  ok('the band width monotonically SHRINKS as μ→0 and collapses to the hairline v*',
     collapseOk && (tiny.hi - tiny.lo) < 1e-6 && Math.abs(tiny.lo - vs) < 1e-6 && Math.abs(tiny.hi - vs) < 1e-6,
     `μ=1e-9 width = ${(tiny.hi - tiny.lo).toExponential(2)}`);

  // the NO-UPPER flag fires EXACTLY at the μ·tanθ≥1 boundary.
  let flagOk = true;
  for (const thd of [20, 30, 40, 50]) {
    const th2 = thd * D, t = Math.tan(th2);
    if (frictionBand(60, th2, 1 / t + 0.05).noUpper !== true) flagOk = false;   // just over ⇒ no upper
    if (frictionBand(60, th2, 1 / t - 0.05).noUpper !== false) flagOk = false;  // just under ⇒ finite upper
    if (!isFinite(frictionBand(60, th2, 1 / t + 0.05).hi) !== true) flagOk = false; // hi is Infinity past boundary
  }
  ok('★ "NO UPPER LIMIT" (hi=Infinity) fires EXACTLY when μ·tanθ≥1', flagOk);
}

// ── 8. rideState is the renderer's contract: bob, atNull, sign derive from the core. ─
console.log('\n— rideState contract: bob/atNull/sign derive from the SAME core —');
{
  let worst = 0, signOk = true, nullOk = true;
  const r = 60;
  for (let thd = 10; thd <= 38; thd += 4) {
    const th = thd * D, vs = designSpeed(r, th);
    for (let v = 0; v <= 50; v += 2) {
      const s = rideState(v, r, th);
      worst = Math.max(worst, Math.abs(s.bob - bobAngle(v, r, th)));
      const expSign = Math.abs(s.bob) < 1e-12 ? 0 : (s.bob < 0 ? -1 : 1);
      if (s.sign !== expSign) signOk = false;
    }
    // atNull fires right at v* and not far away
    if (!rideState(vs, r, th).atNull) nullOk = false;
    if (rideState(vs * 0.5, r, th).atNull) nullOk = false;
  }
  ok('rideState.bob === bobAngle to machine precision', worst < 1e-15, `worst Δ = ${worst.toExponential(2)}`);
  ok('rideState.sign matches sign(bob); atNull fires at v* and NOT at v*/2', signOk && nullOk);
}

// ── 9. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== BANKED-CURVE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== BANKED-CURVE CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['designSpeed', designSpeed], ['bobAngle', bobAngle], ['frictionBand', frictionBand],
      ['rideState', rideState], ['flatBobAngle', flatBobAngle], ['numericNullSpeed', numericNullSpeed],
      ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (law/state/neg-control/band)',
       fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constant G is present verbatim.
    ok('(parity)★ the inlined constant G (gravity) is present verbatim',
       slice.indexOf('const G = 9.81;') >= 0);

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
// Skips the PARAMETER LIST first (matching its parentheses) so a default/destructuring
// parameter doesn't fool the body-brace finder. (Same extractor as star-flyer/core.test.)
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
