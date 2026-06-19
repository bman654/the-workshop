// ============================================================================
//  Node-side falsifiability harness for THE ROTOR — the wall-of-death spin drum.
//  Runs the shared in-page self-test runSelfTest() (the SAME claims the page pill runs),
//  PLUS deeper Node-only assertions (threshold both sides <1e-9 across a dense (μ,r,g)
//  band, the LOAD-BEARING mass-invariance over a dense (m,ω,t) grid, strict press
//  monotonicity, the frictionless neg-control's holds≡false above the real ω_c, and the
//  drop01 kinematics), THEN re-extracts the inlined core from index.html between the
//  sentinels and proves it is byte-for-byte the SAME core (parity — the estate standard,
//  mirroring drop-tower/star-flyer core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, R_DRUM, MU, press, holds, omegaC, riderState, holdsFrictionless, frictionReserve, runSelfTest,
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

console.log('THE ROTOR — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. THRESHOLD BOTH SIDES <1e-9 ACROSS A DENSE (μ, r, g) BAND (headline). ─────
console.log('\n— ω_c⁻ slides / ω_c⁺ sticks to <1e-9, and μN−mg≈0 at ω_c, across a dense (μ,r,g) band —');
{
  let allOk = true, worstGap = 0, n = 0;
  for (const mu of [0.20, 0.30, 0.45, 0.62, 0.80]) for (const r of [1.4, 2.0, 2.8, 3.5]) for (const g of [9.81, 9.0, 10.5]) {
    const m = 70;                              // mass is irrelevant to the threshold
    const wc = omegaC(mu, r, g);
    if (holds(m, wc * (1 - 1e-6), mu, r, g)) allOk = false;        // just below ⇒ slides
    if (riderState(m, wc * (1 - 1e-6), 0.5, mu, r, g).pinned) allOk = false;
    if (!holds(m, wc * (1 + 1e-6), mu, r, g)) allOk = false;       // just above ⇒ sticks
    if (!riderState(m, wc * (1 + 1e-6), 0.5, mu, r, g).pinned) allOk = false;
    const gap = Math.abs(mu * press(m, wc, r) - m * g);
    worstGap = Math.max(worstGap, gap);
    n++;
  }
  ok('ω_c⁻ slides AND ω_c⁺ sticks AND |μN−mg|<1e-9 at ω_c, at EVERY (μ,r,g)', allOk && worstGap < 1e-9, `${n} bands, max|μN−mg| at ω_c = ${worstGap.toExponential(2)}`);
}

// ── 3. ★ THE LOAD-BEARING MASS-INVARIANCE on a dense (m, ω, t) grid. ────────────
console.log('\n— ★ mass-invariance: distinct masses share one fate (holds, pinned, AND drop01) —');
{
  const masses = [10, 22, 50, 95, 130, 200];
  let holdsSame = true, pinnedSame = true, dropSame = true, n = 0, flips = 0;
  // omegaC is byte-identical for any two masses (it takes no mass argument).
  let wcIdentical = true;
  const wc0 = omegaC();
  for (const mu of [0.30, 0.45, 0.62]) for (const r of [1.6, 2.0, 2.8]) {
    const wcRef = omegaC(mu, r);
    let prevH = null;
    for (let w = 0; w <= 6; w += 0.01) {
      const base = holds(masses[0], w, mu, r);
      if (prevH !== null && base !== prevH) flips++;
      prevH = base;
      for (const m of masses) {
        if (holds(m, w, mu, r) !== base) holdsSame = false;
        for (const t of [0, 0.25, 0.6, 1.2, 2.0]) {
          const a = riderState(masses[0], w, t, mu, r);
          const b = riderState(m, w, t, mu, r);
          if (a.pinned !== b.pinned) pinnedSame = false;
          if (a.drop01 !== b.drop01) dropSame = false;       // byte-identical sink
          n++;
        }
      }
      if (omegaC(mu, r) !== wcRef) wcIdentical = false;       // stable, mass-free
    }
  }
  ok('omegaC takes NO mass argument — the crossing is the SAME √(g/μr) for every rider', wcIdentical && Number.isFinite(wc0));
  ok('holds(m,ω) is identical for {10,22,50,95,130,200} kg at every (μ,r,ω)', holdsSame, `${n} grid points, ${flips} stick↔slide flips`);
  ok('★ pinned matches AND drop01 is byte-identical across all masses (they sink in lockstep)', pinnedSame && dropSame);
}

// ── 4. STRICT PRESS MONOTONICITY on a fine grid (a faster spin presses harder). ─
console.log('\n— strict monotonicity: N = mω²r increases on a fine grid —');
{
  let mono = true, prev = -Infinity, n = 0;
  for (let w = 0; w <= 8; w += 0.002) { const N = press(80, w); if (N <= prev - 1e-15) mono = false; prev = N; n++; }
  ok('press(m,ω,r) STRICTLY increases across [0,8] step 0.002', mono, `${n} samples`);
}

// ── 5. THE FRICTIONLESS NEG-CONTROL — μ=0 NEVER holds, even above the real ω_c. ─
console.log('\n— NEG-CONTROL (the teeth): a frictionless wall always slides, even where the real wall holds —');
{
  let fricHolds = 0, realHolds = 0, disagreeAbove = 0, samplesAbove = 0, reserveAlwaysZero = true;
  const wc = omegaC();
  for (let w = 0; w <= 8; w += 0.01) {
    if (holdsFrictionless(70, w)) fricHolds++;                    // must NEVER hold
    if (frictionReserve(70, w, 0) !== 0) reserveAlwaysZero = false; // μ=0 reserve is dead
    if (holds(70, w)) realHolds++;
    if (w > wc) { samplesAbove++; if (holds(70, w) && !holdsFrictionless(70, w)) disagreeAbove++; }
  }
  // the wall STILL presses at μ=0 (Explorer 2's honest distinction: press grows, reserve dead).
  let pressGrows = true, prevN = -Infinity;
  for (let w = 0; w <= 8; w += 0.01) { const N = press(70, w); if (N <= prevN - 1e-15) pressGrows = false; prevN = N; }
  ok('the neg-control NEVER holds (holdsFrictionless is false for every ω)', fricHolds === 0, `${fricHolds} holding spins`);
  ok('★ the teeth bite: above the real ω_c the real wall HOLDS but the frictionless wall does NOT (non-empty disagreement)',
     disagreeAbove > 0 && disagreeAbove === samplesAbove, `${disagreeAbove}/${samplesAbove} spins above ω_c disagree`);
  ok('anti-vacuity: a band where the real wall HOLDS exists, AND omegaC(μ=0)===Infinity', realHolds > 0 && omegaC(0) === Infinity, `${realHolds} holding spins for the real wall`);
  ok('the wall STILL presses at μ=0: press strictly grows; the friction reserve μN is identically dead', pressGrows && reserveAlwaysZero);
}

// ── 6. drop01 KINEMATICS (s = ½at²): pinned≡0, sliding ↑ to 1, faster slide sinks faster. ─
console.log('\n— drop01 kinematics: pinned riders hang; sliding riders sink, faster below ω_c —');
{
  const wc = omegaC();
  // pinned (above ω_c): drop01 is exactly 0 for all t.
  let pinnedZero = true;
  for (const t of [0, 0.5, 2, 20, 200]) if (riderState(70, wc * 1.3, t).drop01 !== 0) pinnedZero = false;
  // sliding (below ω_c): drop01 strictly increases in t and reaches 1.
  let inc = true, prev = -1, reaches1 = false, n = 0;
  for (let t = 0; t <= 6; t += 0.01) { const d = riderState(70, wc * 0.5, t).drop01; if (d < prev - 1e-15) inc = false; if (d >= 1) reaches1 = true; prev = d; n++; }
  // the exact ½at² value before clamping: at small t, drop01 = ½ aSlip t² / fall.
  const t0 = 0.1, fall = 1.6, aSlip = G - MU * (wc * 0.5) ** 2 * R_DRUM;
  const expect = 0.5 * aSlip * t0 * t0 / fall;
  const got = riderState(70, wc * 0.5, t0).drop01;
  // faster slide (smaller ω ⇒ bigger aSlip) sinks faster at fixed t.
  const slow = riderState(70, wc * 0.7, 0.6).drop01, fast = riderState(70, wc * 0.2, 0.6).drop01;
  ok('pinned riders hang: drop01 ≡ 0 for all t above ω_c', pinnedZero);
  ok('sliding riders sink: drop01 strictly ↑ in t and reaches 1 in finite time', inc && reaches1, `${n} samples`);
  ok('drop01 is exactly ½·aSlip·t²/fall before clamping (the kinematics are real)', Math.abs(got - expect) < 1e-12, `Δ = ${Math.abs(got - expect).toExponential(2)}`);
  ok('a faster slide (smaller ω, bigger aSlip) sinks faster at fixed t', fast > slow, `fast ${fast.toFixed(4)} > slow ${slow.toFixed(4)}`);
}

// ── 7. frictionReserve / press contract: the dial races μN against mg. ──────────
console.log('\n— the balance-dial contract: frictionReserve = μN, holds ⇔ μN ≥ mg —');
{
  let consistent = true, worst = 0;
  for (const m of [22, 95]) for (let w = 0; w <= 6; w += 0.05) {
    const reserve = frictionReserve(m, w);
    const weight = m * G;
    if ((reserve >= weight) !== holds(m, w)) consistent = false;   // the dial latch == holds
    worst = Math.max(worst, Math.abs(reserve - MU * press(m, w)));  // reserve === μN exactly
  }
  ok('frictionReserve === μ·press to machine precision (the dial reads the real reserve)', worst < 1e-12, `worst Δ = ${worst.toExponential(2)}`);
  ok('the dial latch (reserve ≥ mg) agrees with holds() at every (m,ω)', consistent);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== ROTOR CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== ROTOR CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['press', press], ['holds', holds], ['omegaC', omegaC], ['riderState', riderState],
      ['holdsFrictionless', holdsFrictionless], ['frictionReserve', frictionReserve], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (press/holds/ωc/state/neg-control/reserve)',
       fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants G, R_DRUM, MU are present verbatim',
       slice.indexOf('const G = 9.81;') >= 0 && slice.indexOf('const R_DRUM = 2.0;') >= 0 && slice.indexOf('const MU = 0.45;') >= 0);

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
