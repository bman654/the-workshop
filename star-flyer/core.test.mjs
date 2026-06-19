// ============================================================================
//  Node-side falsifiability harness for THE STAR FLYER — the conical-pendulum swing
//  carousel. Runs the shared in-page self-test runSelfTest() (the SAME claims the page
//  pill runs), PLUS deeper Node-only assertions (residual <1e-9 at the solved θ across a
//  dense ω×(r₀,L) band, strict θ-monotonicity on a fine grid, the ω→0 / ω→large limits,
//  the R-coupling widening, and the LOAD-BEARING neg-control: rigid spokes read θ≡0 where
//  the real swing leans), THEN re-extracts the inlined core from index.html between the
//  sentinels and proves it is byte-for-byte the SAME core (parity — the estate standard,
//  mirroring drop-tower/core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, HUB, CHAIN, residual, solveLean, rideState, solveLeanRigid, rideStateRigid, runSelfTest,
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

console.log('THE STAR FLYER — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. RESIDUAL <1e-9 AT THE SOLVED θ, ACROSS A DENSE ω×(r₀,L) BAND (headline). ─
console.log('\n— the solved θ is a genuine root of f across a dense (ω, r₀, L) band —');
{
  let worst = 0, n = 0;
  for (const r0 of [0.4, 0.9, 1.5]) for (const L of [2, 4, 6]) {
    for (let w = 0; w <= 3.5; w += 0.005) {
      const th = solveLean(w, r0, L);
      worst = Math.max(worst, Math.abs(residual(th, w, r0, L))); n++;
    }
  }
  ok('|residual(solveLean(ω),ω)| < 1e-9 at EVERY (ω,r₀,L) sample', worst < 1e-9, `${n} samples, max|f| = ${worst.toExponential(2)}`);
}

// ── 3. STRICT MONOTONICITY on a fine grid (faster spin ⇒ bigger lean). ─────────
console.log('\n— strict monotonicity: θ(ω) increases on a fine grid —');
{
  let mono = true, prev = -1, n = 0;
  for (let w = 0; w <= 12; w += 0.005) { const th = solveLean(w); if (th < prev - 1e-15) mono = false; prev = th; n++; }
  ok('θ(ω) STRICTLY non-decreasing across [0,12] step 0.005', mono, `${n} samples`);
}

// ── 4. THE LIMITS: ω→0 (no lean exactly) and ω→large (bounded below 90°). ───────
console.log('\n— limits: ω→0 gives θ=0 exactly; ω→large stays bounded below 90° —');
{
  let zeroOk = true, boundedOk = true, approachOk = true;
  for (const r0 of [0.4, 0.9, 1.5]) for (const L of [2, 4, 6]) {
    if (solveLean(0, r0, L) !== 0) zeroOk = false;
    for (const w of [5, 10, 50, 200, 1000]) if (!(solveLean(w, r0, L) < Math.PI / 2)) boundedOk = false;
    if (!(solveLean(200, r0, L) * 180 / Math.PI > 88)) approachOk = false;   // genuinely approaches the asymptote
  }
  ok('ω→0: solveLean(0)===0 exactly for every (r₀,L)', zeroOk);
  ok('ω→large: θ < 90° for all finite ω AND θ(200) > 88° (approaches the asymptote)', boundedOk && approachOk);
}

// ── 5. R-COUPLING: the orbit genuinely WIDENS — an implicit fixed point, not fixed. ─
console.log('\n— R-coupling: R = r₀ + L·sin(θ) strictly widens with ω across the band —');
{
  let widen = true, n = 0;
  for (const r0 of [0.4, 0.9, 1.5]) for (const L of [2, 4, 6]) {
    let prevR = -1;
    for (let w = 0.1; w <= 10; w += 0.01) { const R = r0 + L * Math.sin(solveLean(w, r0, L)); if (R < prevR - 1e-15) widen = false; prevR = R; n++; }
  }
  ok('R strictly widens with ω across every (r₀,L) band (the orbit really opens out)', widen, `${n} samples`);
}

// ── 6. THE LOAD-BEARING NEG-CONTROL — rigid spokes NEVER lean. ──────────────────
console.log('\n— NEG-CONTROL (the teeth): rigid spokes read θ≡0 where a real swing leans —');
{
  let leanSamples = 0, disagree = 0, rigidNonZero = 0, restSamples = 0, restAgree = 0;
  for (const r0 of [0.4, 0.9, 1.5]) for (const L of [2, 4, 6]) {
    for (let w = 0.5; w <= 3.5; w += 0.02) {
      const real = solveLean(w, r0, L), rigid = solveLeanRigid(w, r0, L);
      if (real > 1e-6) leanSamples++;
      if (rigid !== 0) rigidNonZero++;                    // a locked arm must NEVER lean
      if (Math.abs(real - rigid) > 1e-6) disagree++;      // real>0 vs rigid=0 ⇒ disagree
    }
    restSamples++;
    if (solveLean(0, r0, L) === 0 && solveLeanRigid(0, r0, L) === 0) restAgree++;
    // rideStateRigid sanity: θ=0, R=r₀, rise=0 — the chairs whirl flat at rest radius.
    const rs = rideStateRigid(2.2, r0, L);
    if (!(rs.theta === 0 && rs.R === r0 && rs.rise === 0)) rigidNonZero++;
  }
  ok('non-empty leaning band to test', leanSamples > 0, `${leanSamples} leaning samples`);
  ok('the neg-control NEVER leans (solveLeanRigid is always 0; rideStateRigid is flat)', rigidNonZero === 0, `${rigidNonZero} non-zero reads`);
  ok('★ the teeth bite: real vs rigid DISAGREE on EVERY leaning sample', disagree === leanSamples && leanSamples > 0, `${disagree}/${leanSamples} disagree — a rigid spoke FAILS to lean`);
  ok('anti-vacuity: at ω=0 real and rigid AGREE (both θ=0)', restSamples > 0 && restAgree === restSamples, `${restAgree}/${restSamples} agree at rest`);
}

// ── 7. rideState is the renderer's contract: θ, R, rise derive from the SAME core. ─
console.log('\n— rideState contract: θ, R, rise are derived from the solved θ —');
{
  let worst = 0;
  for (let w = 0; w <= 3.5; w += 0.05) {
    const s = rideState(w);
    const th = solveLean(w);
    worst = Math.max(worst,
      Math.abs(s.theta - th),
      Math.abs(s.R - (HUB + CHAIN * Math.sin(th))),
      Math.abs(s.rise - CHAIN * (1 - Math.cos(th))),
      Math.abs(s.residual - residual(th, w)));
  }
  ok('rideState({θ,R,rise,residual}) === the core values to machine precision', worst < 1e-15, `worst Δ = ${worst.toExponential(2)}`);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== STAR-FLYER CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== STAR-FLYER CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['residual', residual], ['solveLean', solveLean], ['rideState', rideState],
      ['solveLeanRigid', solveLeanRigid], ['rideStateRigid', rideStateRigid], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (law/solver/state/neg-control)',
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
// Skips the PARAMETER LIST first (matching its parentheses) so a destructuring
// parameter doesn't fool the body-brace finder. (Same extractor as drop-tower/core.test.)
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
