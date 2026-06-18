// ============================================================================
//  Node-side falsifiability harness for THE COASTER — the shaped-rail loop-survival
//  bench. Runs the shared in-page self-test runSelfTest() (the SAME claims the page
//  pill runs), PLUS deeper Node-only assertions (conservation to machine precision,
//  the analytic survival predicate h≥2.5r matched across a fine band, the exact
//  detach angle, and the LOAD-BEARING neg-control: alwaysSlide completes a release
//  the real integrator detaches), THEN re-extracts the inlined core from index.html
//  between the sentinels and proves it is byte-for-byte the SAME core (parity — the
//  estate standard, mirroring cradle-weaver/cradle-core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, buildTrack, integrate, alwaysSlide, detectDetach, survives, runSelfTest,
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

console.log('THE COASTER — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// a canonical track shared by the deep tests: loop radius r=1, bottom on the ground.
const r = 1;
const track = buildTrack({
  pre:  [{x:0,y:3},{x:1.5,y:1.2},{x:3,y:0.15},{x:3.6,y:0.0}],
  loop: { cx:4, cy:1, r },
  post: [{x:5,y:0.1},{x:7,y:0.4}],
  ds: 0.005
});

// ── 2. CONSERVATION holds tightly across many legal releases. ──────────────────
console.log('\n— conservation: ½mv²+mgy is constant along every legal run —');
{
  // E is conserved along the ACTUAL trajectory — i.e. over the samples the bead can
  // reach (y ≤ release height). A sample above the release height is never visited
  // (the bead stops and reverses before it), so it is not part of the path.
  let worst = 0;
  for (let h = 2.6; h <= 4.0; h += 0.2) {
    const res = integrate(track, h * r);
    const hAbs = track.loopBottomY + h * r;
    const Es = res.trace.filter(t => t.y <= hAbs + 1e-9).map(t => t.E);
    const E0 = Es[0];
    let mx = 0;
    for (const E of Es) mx = Math.max(mx, Math.abs(E - E0) / E0);
    worst = Math.max(worst, mx);
  }
  ok('energy conserved to < 1e-9 along the reachable trajectory (legal releases h∈[2.6r,4r])', worst < 1e-9, `worst rel drift ${worst.toExponential(2)}`);
}

// ── 3. THE SURVIVAL PREDICATE is exactly h ≥ 2.5r, matched across a fine band. ──
console.log('\n— survival predicate: integrated survival === analytic h≥2.5r —');
{
  let mismatches = 0, n = 0;
  for (let h = 2.0; h <= 3.0; h += 0.005) {
    n++;
    const integ = integrate(track, h * r).verdict.survived;
    const analytic = survives(h * r, r);
    if (integ !== analytic) mismatches++;
  }
  ok('integrated vs analytic survival agree across a fine band around 2.5r', mismatches === 0, `${n - mismatches}/${n} agree`);

  // bisection: the survival boundary IS 2.5r (the textbook value, derived not asserted).
  let lo = 2.0 * r, hi = 3.0 * r;
  for (let it = 0; it < 100; it++) {
    const mid = (lo + hi) / 2;
    if (integrate(track, mid).verdict.survived) hi = mid; else lo = mid;
  }
  const hStar = (lo + hi) / 2;
  ok('bisection boundary h*/r → 2.5 (the survival threshold IS the textbook value)',
     Math.abs(hStar / r - 2.5) < 2e-3, `h*/r = ${(hStar / r).toFixed(5)}`);
}

// ── 4. THE EXACT DETACH ANGLE for sub-threshold releases. ──────────────────────
console.log('\n— detach angle: integrator φ === analytic acos((2/3)(h/r−1)) —');
{
  let worst = 0, n = 0;
  // strictly below threshold (leave a margin off the knife-edge at exactly 2.5r).
  for (let k = 0; k < 18; k++) {
    const h = 1.6 + k * 0.05;       // 1.6 .. 2.45, all clearly < 2.5
    const res = integrate(track, h * r);
    if (res.verdict.survived) { ok(`sub-threshold h=${h.toFixed(2)}r should detach`, false); continue; }
    const analytic = detectDetach(h * r, r);
    const integ = res.verdict.detachPhi;
    n++;
    worst = Math.max(worst, Math.abs(integ - analytic));
  }
  ok('every sub-2.5r release detaches at the analytic angle (within sample spacing)',
     worst < 0.05 && n > 0, `worst |Δφ| = ${worst.toFixed(4)} rad over ${n} releases`);

  // at detach, v² == −g·r·cosθ_d exactly (the N=0 condition) — the bead goes ballistic.
  const res = integrate(track, 2.2 * r);
  const d = res.trace[res.verdict.detachIndex];
  const vCent2 = -G * r * Math.cos(res.verdict.detachPhi);
  ok('at the detach point v² == −g·r·cosθ_d (N=0; the bead becomes a free projectile)',
     vCent2 > 0 && Math.abs(d.v * d.v - vCent2) / vCent2 < 0.05, `v²=${(d.v*d.v).toFixed(4)}  −g·r·cosθ=${vCent2.toFixed(4)}`);
}

// ── 5. THE LOAD-BEARING NEG-CONTROL — alwaysSlide completes what the real
//      integrator detaches; they DISAGREE on the whole sub-threshold band. ──────
console.log('\n— NEG-CONTROL (the teeth): an always-completes renderer FAILS —');
{
  const subBand = [];
  for (let k = 0; k < 18; k++) subBand.push((1.6 + k * 0.05) * r);   // 1.6r .. 2.45r, all < 2.5r
  let realDetaches = 0, slideCompletes = 0, disagree = 0;
  for (const h of subBand) {
    const real = integrate(track, h).verdict.survived;
    const slide = alwaysSlide(track, h).verdict.survived;
    if (!real) realDetaches++;
    if (slide) slideCompletes++;
    if (real !== slide) disagree++;
  }
  ok('non-empty sub-threshold band to test', subBand.length > 0, `${subBand.length} releases`);
  ok('the REAL integrator detaches on EVERY sub-2.5r release', realDetaches === subBand.length, `${realDetaches}/${subBand.length}`);
  ok('alwaysSlide (neg-control) COMPLETES every one of them (it never checks N)', slideCompletes === subBand.length, `${slideCompletes}/${subBand.length}`);
  ok('★ the teeth bite: real vs alwaysSlide DISAGREE on the ENTIRE sub-threshold band',
     disagree === subBand.length && subBand.length > 0, `${disagree}/${subBand.length} disagree — an always-completes renderer would FAIL here`);

  // anti-vacuity in both directions: a clearly-legal release survives under BOTH.
  ok('anti-vacuity: a generous legal release (h=3r) survives under the real integrator',
     integrate(track, 3 * r).verdict.survived === true);
}

// ── 6. GEOMETRY-LOCK: the loop is a TRUE circle (κ === 1/r on it). ─────────────
console.log('\n— geometry-lock: the loop arc is an exact circle, κ === 1/r —');
{
  const loopSamples = track.samples.filter(p => p.onLoop);
  let maxErr = 0;
  for (const p of loopSamples) maxErr = Math.max(maxErr, Math.abs(p.kappa - 1 / r));
  ok('every loop sample carries κ === 1/r exactly (so 2.5r is geometry, not magic)',
     loopSamples.length > 100 && maxErr < 1e-12, `${loopSamples.length} loop samples, maxErr ${maxErr.toExponential(2)}`);
  // the loop bottom and top are at the expected heights (0 and 2r above ground).
  const top = loopSamples.reduce((a, b) => Math.abs(b.phi - Math.PI) < Math.abs(a.phi - Math.PI) ? b : a);
  ok('the loop top sits at height 2r above the loop bottom', Math.abs(top.y - 2 * r) < 1e-3, `top y = ${top.y.toFixed(6)}`);
}

// ── 7. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== COASTER CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== COASTER CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['buildTrack', buildTrack], ['integrate', integrate], ['alwaysSlide', alwaysSlide],
      ['detectDetach', detectDetach], ['survives', survives], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (physics/predicate/neg-control)',
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
// parameter doesn't fool the body-brace finder. (Same extractor as cradle-core.test.)
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
