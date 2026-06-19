// ============================================================================
//  Node-side falsifiability harness for THE TEACUPS — the two-spin tea-cup ride.
//  Runs the shared in-page self-test runSelfTest() (the SAME claims the page pill runs),
//  PLUS deeper Node-only assertions (closure to <1e-9 across many p/q, the LOAD-BEARING
//  petals==NUMERATOR by both a wrap-around lobe count and the analytic ω·T/(2π)==p, the
//  |a| extrema by a dense sweep incl. negative ω, the ω=0 lock-the-cup neg-control's
//  plain-ring + constant felt pull, and the closure-IFF-rational teeth on √2/2), THEN
//  re-extracts the inlined core from index.html between the sentinels and proves it is
//  byte-for-byte the SAME core (parity — the estate standard, mirroring rotor/core.test).
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  R, RHO, OMEGA_BIG, OMEGA_SMALL,
  gcd, reduceRatio, seat, path, accel, accelVec, feltA,
  closurePeriod, feltMax, feltMin, extrema, petalCount, runSelfTest,
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

console.log('THE TEACUPS — core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ────────────
console.log('— shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. CLOSURE to <1e-9: path(0) === path(closurePeriod(q)) across many p/q & (R,ρ,Ω). ─
console.log('\n— CLOSURE: the seat returns to its start after q platter-turns, to <1e-9 —');
{
  let allOk = true, worst = 0, n = 0;
  const ratios = [[1,2],[1,3],[2,3],[2,5],[3,5],[3,4],[5,7],[4,6]];   // 4/6 reduces to 2/3
  for (const [pp,qq] of ratios) for (const R_ of [1.0, 1.4, 0.8, 2.0]) for (const rho of [0.5, 0.3, 0.9]) for (const Om of [1.0, 0.7, 1.6]) {
    const { p, q } = reduceRatio(pp, qq);
    const w = (p/q)*Om;
    const T = closurePeriod(q, Om);
    const z0 = path(0, R_, rho, Om, w), zT = path(T, R_, rho, Om, w);
    const err = Math.hypot(z0.x - zT.x, z0.y - zT.y);
    worst = Math.max(worst, err);
    if (err >= 1e-9) allOk = false;
    n++;
  }
  ok('path(0)===path(T) at every (p/q,R,ρ,Ω) with T=2π·q/Ω', allOk && worst < 1e-9, `${n} bands, max close err = ${worst.toExponential(2)}`);
  // 4/6 must close at the REDUCED q=3, not q=6.
  const r46 = reduceRatio(4,6);
  ok('4/6 reduces to 2/3 (closes after q=3, NOT 6 platter-turns)', r46.p === 2 && r46.q === 3);
}

// ── 3. ★ PETALS == NUMERATOR on a wrap-around lobe count AND analytic ω·T/(2π)==p. ─
console.log('\n— ★ petals = the NUMERATOR (not the denominator): two independent proofs —');
{
  const R_ = 1.0, rho = 0.5, Om = 1.0;             // R>ρ ⇒ honest outward lobes
  const ratios = [[1,2],[1,3],[2,3],[2,5],[3,5],[3,4],[5,7],[5,8]];
  let lobeOk = true, analyticOk = true, n = 0, detail = [];
  for (const [pp,qq] of ratios) {
    const { p, q } = reduceRatio(pp, qq);
    const w = (p/q)*Om;
    const T = closurePeriod(q, Om);
    const analytic = (w*T)/(2*Math.PI);
    if (Math.abs(analytic - p) >= 1e-9) analyticOk = false;
    // wrap-around radial local-max count over the closed loop
    const N = 48000;
    const rad = (i)=>{ const z = path((i/N)*T, R_, rho, Om, w); return Math.hypot(z.x, z.y); };
    let prev = rad(N-1), cur = rad(0), lobes = 0;
    for (let i=1;i<=N;i++){ const next = rad(i % N); if (cur > prev && cur >= next) lobes++; prev = cur; cur = next; }
    if (lobes !== p) lobeOk = false;
    detail.push(`${pp}/${qq}→${lobes}`);
    n++;
  }
  ok('★ analytic ω·T/(2π) === p (the NUMERATOR) exactly, every ratio', analyticOk, `${n} ratios`);
  ok('★ wrap-around |z| lobe count === p (the NUMERATOR), NOT the denominator', lobeOk, detail.join(' '));
  // explicit falsification of the brief's claim: petalCount uses numerator, not denominator.
  ok('petalCount(3,5)===3 (numerator) — and ≠ 5 (the brief\'s false "denominator")', petalCount(3,5) === 3 && petalCount(3,5) !== 5);
  ok('petalCount(5,7)===5, petalCount(2,3)===2, petalCount(1,2)===1', petalCount(5,7)===5 && petalCount(2,3)===2 && petalCount(1,2)===1);
}

// ── 4. |a| EXTREMA <1e-9: a dense sweep (incl. negative ω) attains feltMax & feltMin. ─
console.log('\n— |a| extrema: the dense sweep max==feltMax (lurch), min==feltMin (float) —');
{
  let allOk = true, worst = 0, n = 0;
  const bands = [
    [1.0,0.5,1.0,0.5], [1.4,0.3,0.7,1.1], [0.8,0.5,1.0,-0.6],
    [1.0,0.5,1.0,2.0], [2.0,0.9,1.6,-1.2], [1.0,0.5,1.0,1.5],
  ];
  for (const [R_,rho,Om,w] of bands) {
    const { q } = reduceRatio(Math.round(w*1000), Math.round(Om*1000));
    const T = closurePeriod(q, Om);
    let mn = Infinity, mx = -Infinity;
    const N = 80000;
    for (let i=0;i<=N;i++){ const a = feltA((i/N)*T, R_, rho, Om, w); if (a<mn) mn=a; if (a>mx) mx=a; }
    const eMax = feltMax(R_, rho, Om, w), eMin = feltMin(R_, rho, Om, w);
    worst = Math.max(worst, Math.abs(mx - eMax), Math.abs(mn - eMin));
    if (Math.abs(mx - eMax) >= 1e-9 || Math.abs(mn - eMin) >= 1e-9) allOk = false;
    n++;
  }
  ok('sweep max === R·Ω²+ρ(Ω+ω)² AND sweep min === |R·Ω²−ρ(Ω+ω)²|, every band (incl. ω<0)', allOk, `${n} bands, max Δ = ${worst.toExponential(2)}`);
  // accelVec is the VECTOR (the sloshing-tea direction); |accelVec| === feltA exactly.
  let vecOk = true;
  for (let t=0;t<=6;t+=0.013){ const v = accelVec(t), a = accel(t); if (v.x!==a.x || v.y!==a.y) vecOk = false; if (Math.abs(Math.hypot(v.x,v.y) - feltA(t)) > 1e-12) vecOk = false; }
  ok('accelVec === accel (the felt VECTOR) and |accelVec| === feltA (the scalar) to machine precision', vecOk);
}

// ── 5. ★ NEG-CONTROL ω=0 (lock the cup): a plain ring + CONSTANT felt pull (R+ρ)Ω². ─
console.log('\n— ★ lock the cup (ω=0): a plain ring at constant pull, no flower —');
{
  const R_ = 1.0, rho = 0.5, Om = 1.0, ringR = R_ + rho, ringA = ringR*Om*Om;
  // (a) |z| is constant ≡ R+ρ.
  let radConst = true, worstR = 0;
  for (let t=0;t<=40;t+=0.01){ const z = path(t, R_, rho, Om, 0); const e = Math.abs(Math.hypot(z.x,z.y) - ringR); worstR = Math.max(worstR, e); if (e >= 1e-9) radConst = false; }
  // (b) feltA is constant ≡ (R+ρ)Ω², so aMax==aMin from the SWEEP.
  let aMn = Infinity, aMx = -Infinity, worstA = 0;
  for (let t=0;t<=40;t+=0.01){ const a = feltA(t, R_, rho, Om, 0); worstA = Math.max(worstA, Math.abs(a - ringA)); if (a<aMn)aMn=a; if (a>aMx)aMx=a; }
  ok('ω=0 ⇒ |z| ≡ R+ρ (a plain RING, not a flower)', radConst, `R+ρ=${ringR}, max Δ = ${worstR.toExponential(2)}`);
  ok('ω=0 ⇒ feltA ≡ (R+ρ)Ω² CONSTANT; the swept aMax==aMin (no lurch, no float)', (aMx - aMn) < 1e-9 && worstA < 1e-9, `pull=${ringA}, swept spread = ${(aMx-aMn).toExponential(2)}`);
  ok('ω=0 ⇒ petalCount(0,q) === 0 (zero petals)', petalCount(0,1) === 0 && petalCount(0,7) === 0);
  // (c) ★ anti-vacuity: a band with ω≠0 has aMax−aMin strictly > 0 (the disagreement is real).
  let everSwings = false;
  for (const w of [0.3, 0.5, 1.0, 2.0]) { const e = extrema(R_, rho, Om, w); if ((e.aMax - e.aMin) > 1e-6) everSwings = true; }
  ok('★ anti-vacuity: with ω≠0 the felt pull SWINGS (aMax−aMin > 0), so the neg-control is not vacuous', everSwings);
}

// ── 6. CLOSURE IFF RATIONAL (the teeth): √2/2 NEVER returns within a safe floor. ─
console.log('\n— closure ⟺ rational: an irrational ω/Ω = √2/2 never closes —');
{
  const R_ = 1.0, rho = 0.5, Om = 1.0, w = (Math.SQRT2/2)*Om;
  const z0 = path(0, R_, rho, Om, w);
  let minErr = Infinity, atq = 0;
  for (let q=1;q<=2000;q++){
    const T = closurePeriod(q, Om);
    const zT = path(T, R_, rho, Om, w);
    const e = Math.hypot(z0.x - zT.x, z0.y - zT.y);
    if (e < minErr) { minErr = e; atq = q; }
  }
  // The verified min return error over q=1..3000 is ~8e-4; assert it stays ABOVE 5e-4
  // over q=1..2000 (do NOT use a >1e-3 threshold — that would falsely fail). This proves
  // the curve does not close: no return within 5e-4 for the first 2000 denominators.
  ok('√2/2 (irrational): NO return within 5e-4 over q=1..2000 (the flower never closes)', minErr > 5e-4, `min return err = ${minErr.toExponential(3)} at q=${atq}`);
  // a RATIONAL ratio (1/2) DOES close to <1e-12 at its q — the contrast that makes it "iff".
  const rclose = (()=>{ const { q } = reduceRatio(1,2); const T = closurePeriod(q, Om); const zT = path(T, R_, rho, Om, 0.5*Om); return Math.hypot(z0.x - zT.x, z0.y - zT.y); })();
  ok('the contrast: a RATIONAL 1/2 closes to <1e-12 at q (closure ⟺ rational)', rclose < 1e-12, `rational close err = ${rclose.toExponential(2)}`);
}

// ── 7. ★ RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ──────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== TEACUPS CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== TEACUPS CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['gcd', gcd], ['reduceRatio', reduceRatio], ['seat', seat], ['path', path],
      ['accel', accel], ['accelVec', accelVec], ['feltA', feltA],
      ['closurePeriod', closurePeriod], ['feltMax', feltMax], ['feltMin', feltMin],
      ['extrema', extrema], ['petalCount', petalCount], ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (gcd/seat/path/accel/extrema/petalCount/…)',
       fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants R, RHO, OMEGA_BIG, OMEGA_SMALL are present verbatim',
       slice.indexOf('const R = 1.0;') >= 0 && slice.indexOf('const RHO = 0.5;') >= 0 &&
       slice.indexOf('const OMEGA_BIG = 1.0;') >= 0 && slice.indexOf('const OMEGA_SMALL = 0.5;') >= 0);

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
// parameter doesn't fool the body-brace finder. (Same extractor as rotor/core.test.)
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
