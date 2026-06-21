// ============================================================================
//  Node-side falsifiability harness for THE FERRIS WHEEL — the turning-gondola
//  apparent-weight bench. Runs the shared in-page self-test runSelfTest() (the SAME
//  claims the page pill runs), PLUS deeper Node-only assertions (the crest floats at
//  ω₀=√(g/r) across a band of radii; ω₀ mass-invariant across many masses; the
//  bottom−top gap === 2mω²r across a wide ω×m sweep; ω=0 ⇒ a flat m·g all around;
//  N_top STRICTLY negative and STRICTLY decreasing past ω₀; and the SINUSOIDAL shape
//  N(θ)=m(g+ω²r·cosθ) pinned at the four cardinal seats), THEN re-extracts the inlined
//  core from index.html between the sentinels and proves it is byte-for-byte the SAME
//  core (parity — the estate standard, mirroring drop-tower/core.test.mjs).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  G, R, apparentWeight, bottomN, topN, weightGap, floatOmega, sweep, flatScale, runSelfTest,
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

console.log('THE FERRIS WHEEL — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. THE CREST FLOATS AT ω₀ = √(g/r), ACROSS A BAND OF RADII (the headline). ─
console.log('\n— the crest goes weightless EXACTLY at ω₀=√(g/r), across a band of radii —');
{
  let worstFloat = 0, worstRoot = 0, n = 0;
  for (let r = 4; r <= 18; r += 0.5) {
    const w0 = floatOmega(r);
    for (const m of [12, 30, 55, 90]) {
      worstFloat = Math.max(worstFloat, Math.abs(topN(w0, m, r)));               // N_top(ω₀)=0
      worstFloat = Math.max(worstFloat, Math.abs(apparentWeight(Math.PI, w0, m, r)));
      n++;
    }
    worstRoot = Math.max(worstRoot, Math.abs(G - w0 * w0 * r));                  // g − ω₀²r = 0
  }
  ok('N_top(ω₀) = 0 at the crest across a band of radii × masses', worstFloat < 1e-9, `${n} cells, worst |N_top| = ${worstFloat.toExponential(2)}`);
  ok('ω₀ is the exact root of g − ω²r = 0 (closed form, not fit)', worstRoot < 1e-12, `worst |g−ω₀²r| = ${worstRoot.toExponential(2)}`);
}

// ── 3. MASS-INVARIANT FLOAT — adult and child float at the SAME ω₀. ────────────
console.log('\n— ω₀ is mass-invariant: every rider floats at the same spin —');
{
  // floatOmega takes NO mass argument — invariance by construction. Confirm that the ω
  // recovered numerically by zeroing N_top per mass is the same across a wide mass range.
  let spread = 0;
  const r = R;
  const ref = floatOmega(r);
  for (const m of [5, 18, 40, 75, 120, 200]) {
    // bisect N_top(ω,m)=0 on ω∈[0,5] — must land on ω₀ regardless of m.
    let lo = 0, hi = 5;
    for (let it = 0; it < 80; it++) { const mid = (lo + hi) / 2; if (topN(mid, m, r) > 0) lo = mid; else hi = mid; }
    const wm = (lo + hi) / 2;
    spread = Math.max(spread, Math.abs(wm - ref));
  }
  ok('the ω that floats the crest is identical across masses 5…200 kg (Δ<1e-9)', spread < 1e-9, `worst Δ from ω₀ = ${spread.toExponential(2)}`);
  ok('floatOmega(r) carries no mass term — invariance by construction', floatOmega.length === 1 || floatOmega.length === 0);
}

// ── 4. THE GAP === 2mω²r ACROSS A WIDE ω×m SWEEP. ──────────────────────────────
console.log('\n— the dip-minus-crest gap is EXACTLY 2mω²r for all ω —');
{
  let worst = 0, n = 0;
  for (const m of [0.5, 1, 7.3, 60, 110]) for (let w = 0; w <= 3; w += 0.02) for (const r of [4, 9, 15]) {
    const got = bottomN(w, m, r) - topN(w, m, r);
    const want = 2 * m * w * w * r;
    worst = Math.max(worst, Math.abs(got - want), Math.abs(weightGap(w, m, r) - want)); n++;
  }
  ok('bottomN − topN === 2mω²r (and weightGap matches) across a wide sweep (<1e-9)', worst < 1e-9, `${n} cells, worst Δ = ${worst.toExponential(2)}`);
}

// ── 5. PARKED WHEEL ⟹ FLAT m·g ALL AROUND (the neg-control AGREES here). ────────
console.log('\n— parked (ω=0): a flat m·g all the way around, no swing —');
{
  let worst = 0;
  for (const m of [0.5, 1, 3, 22, 95]) {
    for (const s of sweep(0, m, R, 360)) worst = Math.max(worst, Math.abs(s.N - m * G));
  }
  ok('ω=0 ⇒ N(θ) === m·g at EVERY θ (the needle does not swing)', worst < 1e-12, `worst Δ = ${worst.toExponential(2)}`);
}

// ── 6. PAST ω₀ THE CREST READS STRICTLY NEGATIVE — the ride's unique property. ─
console.log('\n— past ω₀ the crest reads STRICTLY NEGATIVE (the lap-bar pulls down) —');
{
  const m = 2.0, r = R, w0 = floatOmega(r);
  // below ω₀ the crest is strictly positive; above it strictly negative; at ω₀ exactly 0.
  let belowAllPos = true, aboveAllNeg = true, aboveMono = true, prev = Infinity, nNeg = 0;
  for (let w = 0; w <= w0 - 0.02; w += 0.02) if (!(topN(w, m, r) > 0)) belowAllPos = false;
  for (let w = w0 + 0.02; w <= w0 + 2.0; w += 0.02) {
    const nt = topN(w, m, r);
    if (!(nt < 0)) aboveAllNeg = false; else nNeg++;
    if (!(nt < prev)) aboveMono = false; prev = nt;
  }
  ok('below ω₀: the crest reading is STRICTLY POSITIVE (still pressing the pan)', belowAllPos);
  ok('at ω₀: the crest reading is EXACTLY 0 (true weightless float)', Math.abs(topN(w0, m, r)) < 1e-9, `N_top(ω₀) = ${topN(w0, m, r).toExponential(2)}`);
  ok('★ above ω₀: the crest reading is STRICTLY NEGATIVE and STRICTLY decreasing (lap-bar load grows)', aboveAllNeg && aboveMono, `${nNeg} negative samples — NOT clamped at 0`);

  // the magnitude of the negative reading IS the lap-bar's downward pull: |N_top| = m(ω²r−g).
  let pullWorst = 0;
  for (let w = w0 + 0.05; w <= w0 + 1.5; w += 0.05) {
    const lapBar = -topN(w, m, r);            // downward force the restraint supplies
    const want = m * (w * w * r - G);
    pullWorst = Math.max(pullWorst, Math.abs(lapBar - want));
  }
  ok('the lap-bar load |N_top| === m(ω²r − g) past the threshold (<1e-9)', pullWorst < 1e-9, `worst Δ = ${pullWorst.toExponential(2)}`);
}

// ── 7. THE SINUSOIDAL SHAPE — N(θ)=m(g+ω²r·cosθ) pinned at the four seats. ──────
console.log('\n— the breath is sinusoidal: N(θ) pinned at bottom / sides / top —');
{
  const m = 1.7, r = R, w = 1.3;
  const nb = apparentWeight(0, w, m, r);                 // bottom θ=0
  const ns = apparentWeight(Math.PI / 2, w, m, r);       // 3-o'clock θ=π/2 ⟹ cos=0 ⟹ m·g
  const nt = apparentWeight(Math.PI, w, m, r);           // top θ=π
  const ns2 = apparentWeight(3 * Math.PI / 2, w, m, r);  // 9-o'clock θ=3π/2 ⟹ cos=0 ⟹ m·g
  ok('θ=0 (bottom) reads m(g+ω²r) — the heaviest seat (the dip)', Math.abs(nb - m * (G + w * w * r)) < 1e-12);
  ok('θ=π/2 and θ=3π/2 (the sides) read EXACTLY m·g (the cos θ=0 cross-over seats)',
     Math.abs(ns - m * G) < 1e-12 && Math.abs(ns2 - m * G) < 1e-12);
  ok('θ=π (top) reads m(g−ω²r) — the lightest seat (the crest)', Math.abs(nt - m * (G - w * w * r)) < 1e-12);
  ok('the bottom is above m·g and the top is below it by the SAME amount (symmetry)',
     Math.abs((nb - m * G) - (m * G - nt)) < 1e-12);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== FERRIS-WHEEL CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== FERRIS-WHEEL CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['apparentWeight', apparentWeight], ['bottomN', bottomN], ['topN', topN],
      ['weightGap', weightGap], ['floatOmega', floatOmega], ['sweep', sweep],
      ['flatScale', flatScale], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (physics/neg-control)',
       fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants G and R are present verbatim.
    ok('(parity)★ the inlined constants G (gravity) and R (radius) are present verbatim',
       slice.indexOf('const G = 9.81;') >= 0 && slice.indexOf('const R = 9.0;') >= 0);

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
