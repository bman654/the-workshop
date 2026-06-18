// ============================================================================
//  Node-side falsifiability harness for THE DROP TOWER — the sealed-cabin apparent-
//  weight bench. Runs the shared in-page self-test runSelfTest() (the SAME claims the
//  page pill runs), PLUS deeper Node-only assertions (TRUE 0 g pointwise across a
//  band, the coin floating with the floor, rest = m·g exactly, the brake-peak formula
//  + strict monotonicity + arrest-to-rest, and the LOAD-BEARING neg-control:
//  alwaysHeavy reads N=m·g where the real integrate reads 0), THEN re-extracts the
//  inlined core from index.html between the sentinels and proves it is byte-for-byte
//  the SAME core (parity — the estate standard, mirroring the-coaster/core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, integrate, integrateCoin, alwaysHeavy, peakG, runSelfTest,
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

console.log('THE DROP TOWER — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. TRUE 0 g, POINTWISE, ACROSS A BAND (the headline). ──────────────────────
console.log('\n— TRUE free fall: N = 0 at EVERY free-fall instant, across a band —');
{
  let worst = 0, n = 0, legLenWorst = 0, brakeLenWorst = 0;
  for (let h = 8; h <= 70; h += 6) for (const d of [1.5, 3, 5, 8]) {
    const res = integrate(h, d, 2.5, 300);
    const fall = res.trace.filter(s => s.leg === 'fall');
    for (const s of fall) { worst = Math.max(worst, Math.abs(s.N)); n++; }
    // geometry-lock across the band: fall leg == h, brake leg == d, exactly.
    legLenWorst   = Math.max(legLenWorst,   Math.abs(fall[fall.length-1].y - h));
    const brake = res.trace.filter(s => s.leg === 'brake');
    brakeLenWorst = Math.max(brakeLenWorst, Math.abs((brake[brake.length-1].y - h) - d));
  }
  ok('N = 0 at EVERY free-fall sample across the whole band', worst < 1e-9, `${n} samples, max|N| = ${worst.toExponential(2)}`);
  ok('geometry-lock across the band: free-fall leg == h_drop exactly', legLenWorst < 1e-9, `worst Δ = ${legLenWorst.toExponential(2)}`);
  ok('geometry-lock across the band: brake leg == d_brake exactly (the coral band is honest)', brakeLenWorst < 1e-9, `worst Δ = ${brakeLenWorst.toExponential(2)}`);
}

// ── 3. THE COIN FLOATS WITH THE FLOOR (visual === physics). ────────────────────
console.log('\n— the loose coin: y_coin === y_floor across the fall (it is the SAME physics) —');
{
  let worst = 0, n = 0;
  for (let h = 10; h <= 60; h += 10) {
    const res = integrate(h, 4, 2, 300);
    const fall = res.trace.filter(s => s.leg === 'fall');
    const coin = integrateCoin(h, 300);
    for (let i = 0; i < fall.length; i++) { worst = Math.max(worst, Math.abs(coin[i].y - fall[i].yFloor)); n++; }
  }
  ok('|y_coin − y_floor| < 1e-9 at every free-fall instant (the float is not a tween)', worst < 1e-9, `${n} samples, worst gap = ${worst.toExponential(2)}`);
}

// ── 4. REST EXACT: a = 0 ⟹ N = m·g to machine precision. ───────────────────────
console.log('\n— rest exact: the scale carries the whole weight, N = m·g —');
{
  let worst = 0;
  for (const m of [0.5, 1, 2.5, 7.3]) {
    const res = integrate(25, 4, m, 60);
    for (const s of res.trace) if (s.leg === 'rest' || s.leg === 'settled') worst = Math.max(worst, Math.abs(s.N - m * G), Math.abs(s.a));
  }
  ok('rest & settled: N === m·g and a === 0 to machine precision (any m)', worst < 1e-12, `worst err = ${worst.toExponential(2)}`);
}

// ── 5. ENERGY → ENTRY SPEED: v_brakeEntry² === 2 g h_drop. ──────────────────────
console.log('\n— energy → entry speed: v_brakeEntry² === 2·g·h_drop —');
{
  let worst = 0;
  for (let h = 5; h <= 80; h += 5) {
    const res = integrate(h, 4, 2, 240);
    const fall = res.trace.filter(s => s.leg === 'fall');
    const vEnd = fall[fall.length - 1].v;
    const want = 2 * G * h;
    worst = Math.max(worst, Math.abs(vEnd * vEnd - want) / want, Math.abs(res.verdict.vBrakeEntry ** 2 - want) / want);
  }
  ok('v_brakeEntry² === 2·g·h_drop across a band (trace & verdict, <1e-9 rel)', worst < 1e-9, `worst rel = ${worst.toExponential(2)}`);
}

// ── 6. THE BRAKE PEAK: exact, strictly monotone, and it arrests the cabin. ──────
console.log('\n— the crush: peak = m·(v²/(2d)+g), strictly monotone, arrests to v=0 —');
{
  let maxRel = 0, n = 0;
  for (let h = 8; h <= 70; h += 6) for (const d of [1, 2, 3.5, 5, 8, 12]) {
    const res = integrate(h, d, 3.2, 200);
    const Npeak = Math.max(...res.trace.map(s => s.N));
    const want = 3.2 * (2 * G * h / (2 * d) + G);
    maxRel = Math.max(maxRel, Math.abs(Npeak - want) / want); n++;
    // the brake actually brings v → 0 at the platform
    const lastBrake = res.trace.filter(s => s.leg === 'brake').slice(-1)[0];
    if (Math.abs(lastBrake.v) > 1e-9) maxRel = 1e9;
  }
  ok('integrated peak N === m·(v²/(2d)+g), v²=2gh, AND v→0 at the platform, across a band', maxRel < 1e-9, `${n} cells, worst rel = ${maxRel.toExponential(2)}`);

  // strict monotonicity: a fine sweep — smaller d strictly raises peak g; larger h strictly raises peak g.
  let monoD = true, monoH = true;
  let prev = Infinity;
  for (let d = 1; d <= 12; d += 0.25) { const p = peakG(30, d); if (!(p < prev)) monoD = false; prev = p; }
  prev = -Infinity;
  for (let h = 5; h <= 80; h += 0.5) { const p = peakG(h, 4); if (!(p > prev)) monoH = false; prev = p; }
  ok('STRICTLY monotone: a shorter brake strictly raises peak g (fine sweep)', monoD);
  ok('STRICTLY monotone: a higher hoist strictly raises peak g (fine sweep)', monoH);

  // closed form vs integrated agree to machine precision (the dial drama is real physics).
  let cfWorst = 0;
  for (let h = 8; h <= 70; h += 7) for (const d of [1.5, 4, 9]) {
    const res = integrate(h, d, 1, 150);
    const Npeak = Math.max(...res.trace.map(s => s.N));   // m=1 ⟹ N_peak = peakG·g
    cfWorst = Math.max(cfWorst, Math.abs(Npeak - peakG(h, d) * G) / (peakG(h, d) * G));
  }
  ok('the closed-form peakG(h,d)=h/d+1 matches the integrated peak (<1e-9 rel)', cfWorst < 1e-9, `worst rel = ${cfWorst.toExponential(2)}`);
}

// ── 7. THE LOAD-BEARING NEG-CONTROL — alwaysHeavy NEVER registers free fall. ────
console.log('\n— NEG-CONTROL (the teeth): a scale that fakes weight FAILS the fall —');
{
  const Hs = [12, 25, 40, 60], Ds = [1.5, 3, 5, 9];
  let fallSamples = 0, disagree = 0, restSamples = 0, restAgree = 0, heavyZero = 0;
  for (const h of Hs) for (const d of Ds) {
    const real = integrate(h, d, 2, 160);
    const heavy = alwaysHeavy(h, d, 2, 160);
    for (let i = 0; i < real.trace.length; i++) {
      const rs = real.trace[i], hs = heavy.trace[i];
      if (rs.leg === 'fall') {
        fallSamples++;
        if (Math.abs(hs.N) < 1e-9) heavyZero++;                 // should be 0 — never reads 0
        if (Math.abs(rs.N - hs.N) > 1e-9) disagree++;           // real=0 vs heavy=mg ⟹ disagree
      } else if (rs.leg === 'rest') {
        restSamples++;
        if (Math.abs(rs.N - hs.N) < 1e-12) restAgree++;         // both = mg ⟹ agree
      }
    }
  }
  ok('non-empty free-fall band to test', fallSamples > 0, `${fallSamples} free-fall samples`);
  ok('the neg-control NEVER registers free fall (alwaysHeavy N is never 0)', heavyZero === 0, `${heavyZero} zero-reads`);
  ok('★ the teeth bite: real vs alwaysHeavy DISAGREE on EVERY free-fall sample', disagree === fallSamples && fallSamples > 0, `${disagree}/${fallSamples} disagree — a weight-faking scale FAILS here`);
  ok('anti-vacuity: at REST real and alwaysHeavy AGREE (both = m·g)', restSamples > 0 && restAgree === restSamples, `${restAgree}/${restSamples} agree at rest`);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== DROP-TOWER CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== DROP-TOWER CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['integrate', integrate], ['integrateCoin', integrateCoin],
      ['alwaysHeavy', alwaysHeavy], ['peakG', peakG], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (physics/coin/neg-control)',
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
// parameter doesn't fool the body-brace finder. (Same extractor as the-coaster/core.test.)
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
