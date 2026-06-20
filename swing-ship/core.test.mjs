// ============================================================================
//  Node-side falsifiability harness for THE SWING-SHIP — the parametric pendulum you
//  PUMP by changing its length. Runs the shared in-page self-test runSelfTest() (the SAME
//  claims the page pill runs), PLUS deeper Node-only assertions (ω₀=√(g/L) exact across a
//  band; det(monodromy)=1 across (ratio,ε,φ); the principal Mathieu tongue |λ|>1 at 2ω₀
//  with σ>0; ln-amplitude LINEAR with slope=σ and residual <1e-9; the LOAD-BEARING
//  neg-control: pump@1ω₀ same ε → |λ|=1 bounded & mean work/cycle ≈0 while 2ω₀ does real
//  positive work; anti-vacuity ε=0), THEN re-extracts the inlined core from index.html
//  between the sentinels and proves it is byte-for-byte the SAME core (parity — the estate
//  standard, mirroring star-flyer/core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, L0, EPS, omega0, lengthAt, deriv, rk4Step, energy,
  monodromy, floquet, dominantEigenvector, lnAmpFit, meanWorkPerCycle, runSelfTest,
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

console.log('THE SWING-SHIP — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. ω₀ = √(g/L) EXACT across a dense length band (the natural frequency). ────
console.log('\n— ω₀ = √(g/L) is exact across a dense length band —');
{
  let worst = 0, n = 0;
  for (let L = 0.3; L <= 10; L += 0.01) { worst = Math.max(worst, Math.abs(omega0(L) - Math.sqrt(G / L))); n++; }
  ok('|ω₀(L) − √(g/L)| < 1e-12 at EVERY length sample', worst < 1e-12, `${n} samples, max Δ = ${worst.toExponential(2)}`);
}

// ── 3. det(monodromy)=1 EXACT across (ratio, ε, φ) — the periodic-L invariant. ──
console.log('\n— det(monodromy)=1 across a dense (ratio, ε, φ) band (∫trace=0 ⇒ det=1) —');
{
  const w0 = omega0(L0);
  let worst = 0, n = 0;
  for (const r of [0.5, 1, 1.5, 2, 2.5, 3]) for (const e of [0.03, 0.06, 0.1, 0.15])
    for (const phi of [0, 1, 2.5, 4]) {
      worst = Math.max(worst, Math.abs(floquet(r * w0, e, phi).det - 1)); n++;
    }
  ok('|det(M) − 1| < 1e-9 at EVERY (ratio,ε,φ) sample', worst < 1e-9, `${n} samples, max Δ = ${worst.toExponential(2)}`);
}

// ── 4. THE PRINCIPAL TONGUE: pump@2ω₀ → |λ|>1, σ>0, grows with ε (deeper pump, faster). ─
console.log('\n— pump@2ω₀: |λ|>1 (principal Mathieu tongue), σ>0, monotone in ε —');
{
  const w0 = omega0(L0);
  let prevSigma = -1, monoEps = true, allUnstable = true;
  for (const e of [0.04, 0.06, 0.08, 0.10, 0.12, 0.15]) {
    const f = floquet(2 * w0, e, 0);
    if (!(f.unstable && f.lambdaMax > 1 && f.growth > 0)) allUnstable = false;
    if (f.growth < prevSigma - 1e-12) monoEps = false;
    prevSigma = f.growth;
  }
  ok('pump@2ω₀ → |λ|>1 AND σ>0 for every ε∈[0.04,0.15]', allUnstable);
  ok('deeper pump grows faster: σ(ε) STRICTLY increases with ε (a wider tongue)', monoEps);
  const f8 = floquet(2 * w0, 0.08, 0);
  ok('at ε=0.08 the growth is substantial: |λ|>1.15 and σ>0.1', f8.lambdaMax > 1.15 && f8.growth > 0.1,
     `|λ|=${f8.lambdaMax.toFixed(4)}, σ=${f8.growth.toFixed(4)}`);
}

// ── 5. EXPONENTIAL GROWTH: ln(amplitude) LINEAR with slope=σ, residual <1e-9. ───
console.log('\n— exponential growth: ln(amplitude) is LINEAR in t with slope = Floquet σ —');
{
  const w0 = omega0(L0);
  for (const e of [0.06, 0.08, 0.12]) {
    const fit = lnAmpFit(2 * w0, e, 0, L0, 12);
    ok(`ε=${e}: ln(A) linear — slope>0, residual<1e-9, slope==σ`,
       fit.slope > 0 && fit.maxResid < 1e-9 && Math.abs(fit.slope - fit.sigma) < 1e-6,
       `slope=${fit.slope.toExponential(4)}, maxResid=${fit.maxResid.toExponential(2)}, |slope−σ|=${Math.abs(fit.slope - fit.sigma).toExponential(2)}`);
  }
}

// ── 6. THE LOAD-BEARING NEG-CONTROL — FREQUENCY, not effort. ────────────────────
console.log('\n— NEG-CONTROL (the teeth): pump@1ω₀ same ε → |λ|=1 bounded & work/cycle≈0 —');
{
  const w0 = omega0(L0);
  // 1ω0 and several OFF-resonant ratios all bounded (|λ|=1, not unstable)
  let boundedAll = true, n = 0;
  for (const r of [1.0, 1.25, 1.5, 1.75, 2.5, 3.0]) {
    const f = floquet(r * w0, EPS, 0);
    if (!(Math.abs(f.lambdaMax - 1) < 1e-5 && !f.unstable)) boundedAll = false;
    n++;
  }
  ok('OFF the 2:1 tongue (ratios 1,1.25,1.5,1.75,2.5,3) → |λ|=1, BOUNDED for every ratio', boundedAll, `${n} ratios`);

  // mean work per cycle: 1ω0 ≈0 over phases; 2ω0 strictly >0 — same ε.
  let acc = 0, m = 0;
  for (let k = 0; k < 16; k++) { acc += meanWorkPerCycle(1 * w0, EPS, (k / 16) * 2 * Math.PI); m++; }
  const w1 = acc / m;
  const w2 = meanWorkPerCycle(2 * w0, EPS, 0);
  ok('mean work/cycle @1ω₀ ≈ 0 (phase-averaged, SAME ε)', Math.abs(w1) < 1e-4, `⟨W⟩₁ = ${w1.toExponential(2)}`);
  ok('★ same effort, OPPOSITE outcome: W@2ω₀ ≫ 0 while W@1ω₀ ≈ 0 (resonance = the 2:1 TIMING)',
     w2 > 0.05 && w2 > 100 * Math.abs(w1), `W@2ω₀ = ${w2.toFixed(4)}, ratio = ${(w2 / Math.max(Math.abs(w1), 1e-12)).toExponential(1)}×`);
}

// ── 7. ANTI-VACUITY: at 2ω₀ with ε=0 (no pump) → |λ|=1, no growth. ──────────────
console.log('\n— anti-vacuity: 2ω₀ but ε=0 (no pump) → |λ|=1, no growth (needs a real pump) —');
{
  const w0 = omega0(L0);
  const f0 = floquet(2 * w0, 0, 0);
  ok('ε=0 at 2ω₀ → |λ|=1 exactly, NOT unstable (the frequency alone earns nothing)',
     Math.abs(f0.lambdaMax - 1) < 1e-9 && !f0.unstable, `|λ| = ${f0.lambdaMax.toFixed(9)}`);
}

// ── 8. THE NONLINEAR SWING actually climbs at 2ω₀ and not at 1ω₀ (the renderer's truth). ─
console.log('\n— the visible (nonlinear) swing: climbs at 2ω₀, dies/holds at 1ω₀ —');
{
  const w0 = omega0(L0);
  function maxAngleReached(wm, eps, phi, T) {
    const Tm = 2 * Math.PI / wm, dt = Tm / 3000;
    let y = [0.05, 0], t = 0, mx = 0;
    while (t < T) { y = rk4Step(y, t, dt, wm, eps, phi); mx = Math.max(mx, Math.abs(y[0])); t += dt; }
    return mx;
  }
  // best-phase 2ω0 grows well past start; 1ω0 stays near the start angle.
  let best2 = 0;
  for (let k = 0; k < 8; k++) best2 = Math.max(best2, maxAngleReached(2 * w0, EPS, (k / 8) * 2 * Math.PI, 25));
  let worst1 = 0;
  for (let k = 0; k < 8; k++) worst1 = Math.max(worst1, maxAngleReached(1 * w0, EPS, (k / 8) * 2 * Math.PI, 25));
  ok('the nonlinear arc at 2ω₀ CLIMBS far past the 0.05 rad start (best phase reaches >0.5 rad)', best2 > 0.5, `max θ = ${best2.toFixed(3)} rad`);
  ok('the nonlinear arc at 1ω₀ stays bounded near the start (every phase < 0.12 rad)', worst1 < 0.12, `max θ over phases = ${worst1.toFixed(3)} rad`);
}

// ── 9. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== SWING-SHIP CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== SWING-SHIP CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['omega0', omega0], ['lengthAt', lengthAt], ['deriv', deriv], ['rk4Step', rk4Step],
      ['energy', energy], ['monodromy', monodromy], ['floquet', floquet],
      ['dominantEigenvector', dominantEigenvector], ['lnAmpFit', lnAmpFit],
      ['meanWorkPerCycle', meanWorkPerCycle], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (law/integrator/Floquet/neg-control)',
       fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (a2) the two private (non-exported) helpers the core relies on are present verbatim.
    ok('(parity)★ the private linear helpers derivLin & rk4Lin are inlined verbatim',
       slice.indexOf('function derivLin(') >= 0 && slice.indexOf('function rk4Lin(') >= 0);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants G, L0, EPS are present verbatim',
       slice.indexOf('const G = 9.81;') >= 0 && slice.indexOf('const L0 = 2.0;') >= 0 && slice.indexOf('const EPS = 0.08;') >= 0);

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
// Skips the PARAMETER LIST first (matching its parentheses) so a default-value paren
// doesn't fool the body-brace finder. (Same extractor as star-flyer/core.test.)
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
