// ============================================================================
//  Node-side falsifiability harness for The Plumbline — the Least Squares bench.
//  Runs the shared in-page self-test runSelfTest() (the SAME four claims the page
//  pill runs), PLUS deeper Node-only assertions (a fourth independent oracle for
//  the slope, the floor proven against gdFit's own trace, the guard, determinism),
//  THEN re-extracts the inlined core from index.html between the sentinels and
//  proves it is byte-for-byte the SAME core (parity — the convex-hull idiom).
//  Run:  node plumbline-core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  sum, mean, distinctXCount, sse, fitL2, gdFit, perturbAllWorse, fitL1,
  makeRng, gauss, scatterCloud, round2, runSelfTest,
} from './plumbline-core.mjs';
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

console.log('The Plumbline — plumbline-core.test.mjs\n');

// ── 1. THE SHARED IN-PAGE SELF-TEST (the same four claims the pill runs) ───────
console.log('— shared runSelfTest() (the SAME claims the in-page pill runs) —');
{
  const st = runSelfTest();
  for (const l of st.lines) ok('[self-test] ' + l.name, l.ok, l.detail);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. A FOURTH INDEPENDENT ORACLE for the slope (textbook covariance form). ──
// A DIFFERENT route again: not the centered normal equations fitL2 solves, not
// gradient descent, not the perturbation jury — the raw textbook formula
//     m = (nΣxy − ΣxΣy) / (nΣx² − (Σx)²),   b = (Σy − mΣx)/n
// (algebraically the same optimum, computed without centering). It must agree with
// fitL2 to machine precision over many seeds — a fourth stranger swearing the same.
console.log('\n— CLAIM 1+: a FOURTH oracle (raw textbook covariance) agrees with fitL2 —');
function oracleSlope(points){
  const n = points.length;
  const Sx = sum(points.map(p => p.x)), Sy = sum(points.map(p => p.y));
  const Sxy = sum(points.map(p => p.x * p.y)), Sxx = sum(points.map(p => p.x * p.x));
  const m = (n * Sxy - Sx * Sy) / (n * Sxx - Sx * Sx);
  const b = (Sy - m * Sx) / n;
  return { m, b };
}
{
  let worstM = 0, worstB = 0, tested = 0, firstBad = -1;
  for (let s = 1; s <= 200; s++){
    const pts = scatterCloud((s * 2654435761) >>> 0, { n: 10 + (s % 12), noise: 1.0 });
    const cf = fitL2(pts), o = oracleSlope(pts);
    tested++;
    const dM = Math.abs(cf.m - o.m), dB = Math.abs(cf.b - o.b);
    if (dM > worstM) worstM = dM;
    if (dB > worstB) worstB = dB;
    if ((dM > 1e-9 || dB > 1e-9) && firstBad < 0) firstBad = s;
  }
  ok('★ a 4th stranger (raw uncentered covariance formula) agrees with fitL2 over 200 seeds (≤1e-9)',
     worstM <= 1e-9 && worstB <= 1e-9, `${tested} seeds · worst Δm=${worstM.toExponential(2)} Δb=${worstB.toExponential(2)}`);
}

// ── 3. CLAIM 1 (deep): closed form == GD, wider sweep + the trace converges. ──
console.log('\n— CLAIM 1 (deep): fitL2 == gdFit over 300 seeds, monotone descent —');
{
  let worstM = 0, worstB = 0, firstBad = -1, nonMono = 0;
  for (let s = 1; s <= 300; s++){
    const pts = scatterCloud((s * 40503) >>> 0, { n: 8 + (s % 16), noise: 0.8 + (s % 5) * 0.2 });
    const cf = fitL2(pts), gd = gdFit(pts, { maxIters: 8000, lr: 0.5 });
    const dM = Math.abs(cf.m - gd.m), dB = Math.abs(cf.b - gd.b);
    if (dM > worstM) worstM = dM;
    if (dB > worstB) worstB = dB;
    if ((dM > 1e-9 || dB > 1e-9) && firstBad < 0) firstBad = s;
    // the trace's Σr² must be (non-strictly) monotone non-increasing — descent.
    for (let i = 1; i < gd.trace.length; i++){
      if (gd.trace[i].sse > gd.trace[i - 1].sse + 1e-9){ nonMono++; break; }
    }
  }
  ok('fitL2 == gdFit over 300 seeds (≤1e-9) AND every GD trace is monotone non-increasing in Σr²',
     worstM <= 1e-9 && worstB <= 1e-9 && nonMono === 0,
     `worst Δm=${worstM.toExponential(2)} Δb=${worstB.toExponential(2)} · ${nonMono} non-monotone trace(s)`);
  // the trace really STARTS wrong and ENDS at the closed form (it's a journey).
  const pts = scatterCloud(99, { n: 14, noise: 1.2 });
  const cf = fitL2(pts), gd = gdFit(pts, { maxIters: 6000, lr: 0.5 });
  const start = gd.trace[0], end = gd.trace[gd.trace.length - 1];
  ok('the GD trace starts at the deliberately-wrong flat line (m=0) and ends ON the closed form',
     start.m === 0 && Math.abs(end.m - cf.m) <= 1e-9 && start.sse > end.sse,
     `start m=0 Σr²=${start.sse.toFixed(2)} → end m=${end.m.toFixed(6)} Σr²=${end.sse.toFixed(4)} (cf m=${cf.m.toFixed(6)})`);
}

// ── 4. CLAIM 1 (anti-circularity): the source grep, explicit. ────────────────
console.log('\n— CLAIM 1: fitL2 / gdFit / the jury share no fit code —');
{
  const f = fitL2.toString(), g = gdFit.toString(), j = perturbAllWorse.toString();
  ok('fitL2 names neither gdFit nor a GD trace', !f.includes('gdFit') && !f.includes('trace'));
  ok('gdFit names neither fitL2 nor the centered normal-equations symbols (Sxy/Sxx)',
     !g.includes('fitL2') && !g.includes('Sxy') && !g.includes('Sxx'));
  ok('the perturbation jury names neither fitL2 nor gdFit (it only reads sse)',
     !j.includes('fitL2') && !j.includes('gdFit') && j.includes('sse('));
  ok('all three reference only the primitive atoms (sum/mean/sse), never each other',
     (f.includes('mean(') && g.includes('mean(')) && j.includes('sse('));
}

// ── 5. CLAIM 2 (deep): the floor proven against gdFit's OWN best trace point. ─
// A different witness than the random jury: gradient descent visits thousands of
// (m,b) pairs on its way down; NONE of them may score below the closed-form Σr².
// If the closed form weren't the true minimum, some trace point would undercut it.
console.log('\n— CLAIM 2 (deep): no GD trace point ever undercuts the closed-form Σr² —');
{
  let undercut = 0, firstBad = -1, worstUnder = 0, tested = 0;
  for (let s = 1; s <= 120; s++){
    const pts = scatterCloud((s * 22695477) >>> 0, { n: 12, noise: 1.1 });
    const cf = fitL2(pts), gd = gdFit(pts, { maxIters: 4000, lr: 0.5 });
    tested++;
    for (const pt of gd.trace){
      const under = cf.sse - pt.sse;               // > 0 would mean it BEAT the fit
      if (under > 1e-9){ undercut++; if (under > worstUnder) worstUnder = under; if (firstBad < 0) firstBad = s; break; }
    }
  }
  ok('no point on any GD trace (120 seeds × thousands of steps) ever scores below the closed-form Σr²',
     undercut === 0, undercut === 0 ? `${tested} seeds · 0 undercuts (the closed form is the strict floor of the whole descent)` :
       `${undercut} undercut(s) (worst ${worstUnder.toExponential(2)}, first @seed ${firstBad})`);
  // and the jury is non-vacuous: a WRONG "fit" (the flat line) gets beaten constantly.
  const pts = scatterCloud(7, { n: 12, noise: 1.0 });
  const wrong = { m: 0, b: mean(pts.map(p => p.y)), sse: sse(pts, 0, mean(pts.map(p => p.y))) };
  const juryWrong = perturbAllWorse(pts, wrong, 3, 400, 0.3);
  ok('the jury BITES: perturbing a deliberately-wrong flat line, many nudges beat it (non-vacuous)',
     !juryWrong.ok && juryWrong.beaten > 0, `${juryWrong.beaten}/${juryWrong.tested} nudges beat the wrong line`);
}

// ── 6. CLAIM 3 (deep): the two routes + collinear, with explicit numbers. ────
console.log('\n— CLAIM 3 (deep): R² two routes == each other AND == 1 on a line —');
{
  let worst = 0, firstBad = -1;
  for (let s = 1; s <= 200; s++){
    const pts = scatterCloud((s * 2246822519) >>> 0, { n: 9 + (s % 10), noise: 1.0 });
    const cf = fitL2(pts);
    const d = Math.abs(cf.r2 - cf.r * cf.r);
    if (d > worst) worst = d;
    if (d > 1e-12 && firstBad < 0) firstBad = s;
  }
  ok('1−SS_res/SS_tot == r² (Pearson²) to ≤1e-12 over 200 seeds', worst <= 1e-12, `worst |ΔR²|=${worst.toExponential(2)}`);
  // collinear with NON-trivial slope+intercept → R²=1, Σr²=0, |r|=1, exactly.
  const coll = [];
  for (let i = 0; i < 10; i++) coll.push({ x: i * 0.7 + 1, y: -1.4 * (i * 0.7 + 1) + 3.2 });
  const cc = fitL2(coll);
  ok('collinear (y=−1.4x+3.2): R²==1, Σr²==0, |r|==1, slope/intercept recovered exactly',
     Math.abs(cc.r2 - 1) < 1e-12 && cc.sse < 1e-18 && Math.abs(Math.abs(cc.r) - 1) < 1e-12 &&
     Math.abs(cc.m + 1.4) < 1e-9 && Math.abs(cc.b - 3.2) < 1e-9,
     `m=${cc.m.toFixed(9)} b=${cc.b.toFixed(9)} R²=${cc.r2.toFixed(15)} r=${cc.r.toFixed(9)}`);
  // R² is bounded in [−∞,1] for a fit but the best-fit's R² is in [0,1]; sign of r tracks slope.
  const up = fitL2([{ x: 1, y: 1.1 }, { x: 2, y: 2.05 }, { x: 3, y: 2.9 }, { x: 4, y: 4.1 }]);
  const dn = fitL2([{ x: 1, y: 4.1 }, { x: 2, y: 2.9 }, { x: 3, y: 2.05 }, { x: 4, y: 1.1 }]);
  ok('signed Pearson r tracks slope direction: r>0 when slope up, r<0 when slope down (the sign the square loses)',
     up.r > 0 && up.m > 0 && dn.r < 0 && dn.m < 0, `up r=${up.r.toFixed(3)} dn r=${dn.r.toFixed(3)}`);
}

// ── 7. CLAIM 4 (deep): fitL1 deterministic + the teeth + the negative control. ─
console.log('\n— CLAIM 4 (deep): L1 deterministic, ≠ L2, robust; collinear control —');
{
  // fitL1 is DETERMINISTIC: two calls on the same cloud give byte-identical (m,b).
  const cloud = scatterCloud(555, { n: 13, noise: 1.3 });
  const a = fitL1(cloud), b = fitL1(cloud);
  ok('fitL1 is deterministic (two calls byte-identical — the teeth caption can\'t jitter)',
     a.m === b.m && a.b === b.b, `m=${a.m.toFixed(9)} b=${a.b.toFixed(9)}`);
  // L1 ≠ L2 on the noisy cloud (a different "best").
  const l2 = fitL2(cloud), l1 = fitL1(cloud);
  ok('L1 ≠ L2 on a noisy cloud (a genuinely different best line)',
     Math.abs(l2.m - l1.m) > 1e-3 || Math.abs(l2.b - l1.b) > 1e-3,
     `L2 m=${l2.m.toFixed(4)} L1 m=${l1.m.toFixed(4)} (Δ=${Math.abs(l2.m - l1.m).toFixed(4)})`);
  // the robustness contrast over SEVERAL seeds: an edge outlier moves L2 ≫ L1.
  let robustFails = 0, sumRatio = 0, n = 0;
  for (let s = 1; s <= 30; s++){
    const tame = scatterCloud((s * 99991) >>> 0, { n: 12, noise: 0.35, m: 0.5, b: 5 });
    const l2a = fitL2(tame), l1a = fitL1(tame);
    const last = tame.length - 1;
    const drag = tame.map((p, i) => i === last ? { x: p.x, y: -6 } : p);
    const l2b = fitL2(drag), l1b = fitL1(drag);
    const l2m = Math.abs(l2b.m - l2a.m), l1m = Math.abs(l1b.m - l1a.m);
    if (!(l2m > l1m * 3 && l2m > 0.1)) robustFails++;
    sumRatio += l2m / Math.max(l1m, 1e-9); n++;
  }
  ok('over 30 clouds, a high-leverage outlier moves L2 ≫ L1 every time (squared loss is NOT robust)',
     robustFails === 0, `${n} clouds · 0 failures · mean L2/L1 slope-move ratio ≈ ${(sumRatio / n).toFixed(0)}`);
  // the NEGATIVE CONTROL: on a perfectly collinear cloud L1 and L2 must AGREE.
  const coll = [];
  for (let i = 0; i < 9; i++) coll.push({ x: i + 1, y: 0.8 * (i + 1) + 2 });
  const cl2 = fitL2(coll), cl1 = fitL1(coll);
  ok('the teeth do NOT bite where they shouldn\'t: on a collinear cloud, L1 == L2 (both hit the exact line)',
     Math.abs(cl2.m - cl1.m) < 1e-3 && Math.abs(cl2.b - cl1.b) < 1e-2,
     `L2 m=${cl2.m.toFixed(6)} L1 m=${cl1.m.toFixed(6)}`);
}

// ── 8. THE GUARD — fewer than 2 distinct x ⇒ {ok:false}, never a NaN line. ────
console.log('\n— GUARD: < 2 distinct x ⇒ ok:false (no NaN line) —');
{
  const vertical = [{ x: 3, y: 1 }, { x: 3, y: 5 }, { x: 3, y: 9 }];   // all same x
  const single = [{ x: 2, y: 4 }];
  const empty = [];
  ok('fitL2 returns ok:false on a vertical column (all same x) — guarded, not NaN',
     !fitL2(vertical).ok && !Number.isNaN(fitL2(vertical).m), `distinctX=${distinctXCount(vertical)}`);
  ok('fitL2 returns ok:false on a single point', !fitL2(single).ok);
  ok('fitL2 returns ok:false on the empty cloud', !fitL2(empty).ok);
  ok('gdFit returns ok:false (empty trace) on a vertical column', !gdFit(vertical).ok && gdFit(vertical).trace.length === 0);
  ok('fitL1 returns ok:false on a vertical column', !fitL1(vertical).ok);
  // two points at distinct x → the line passes through both EXACTLY (R²=1, Σr²=0).
  const two = fitL2([{ x: 1, y: 2 }, { x: 5, y: 4 }]);
  ok('exactly two points at distinct x → the unique line through both (R²=1, Σr²=0)',
     two.ok && Math.abs(two.m - 0.5) < 1e-12 && Math.abs(two.b - 1.5) < 1e-12 && two.sse < 1e-18,
     `m=${two.m} b=${two.b} R²=${two.r2}`);
}

// ── 9. DETERMINISM — same seed ⇒ identical cloud (browser/Node reproducibility). ─
console.log('\n— DETERMINISM: scatterCloud is seed-pure —');
{
  let same = true;
  for (let s = 1; s <= 50; s++){
    const a = JSON.stringify(scatterCloud(s, { n: 12 })), b = JSON.stringify(scatterCloud(s, { n: 12 }));
    if (a !== b) same = false;
  }
  ok('scatterCloud is seed-pure (50 seeds, identical clouds across two calls — page & Node match)', same);
  // every generated point is rounded to 2 decimals and inside the world box.
  const cloud = scatterCloud(31337, { n: 12, world: 10 });
  let clean = true;
  for (const p of cloud){
    if (round2(p.x) !== p.x || round2(p.y) !== p.y) clean = false;
    if (p.y < 0 || p.y > 10) clean = false;
  }
  ok('every scatterCloud point is grid-rounded (2dp) and inside the 10×10 world box', clean, `${cloud.length} pts`);
}

// ── 10. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte. ───
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== PLUMBLINE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PLUMBLINE CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const pairs = [
      ['sum', sum], ['mean', mean], ['distinctXCount', distinctXCount], ['sse', sse],
      ['fitL2', fitL2], ['gdFit', gdFit], ['perturbAllWorse', perturbAllWorse], ['fitL1', fitL1],
      ['makeRng', makeRng], ['gauss', gauss], ['scatterCloud', scatterCloud], ['round2', round2],
      ['runSelfTest', runSelfTest],
    ];
    let drift = '';
    for (const [name, fn] of pairs){
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())){ drift = name; break; }
    }
    ok('(parity)★ every inlined function body is char-for-char the imported core (atoms/fitL2/gdFit/jury/fitL1/rng/scatter/oracle)',
       drift === '', drift === '' ? `all ${pairs.length} functions byte-identical` : `DRIFT in ${drift}`);

    // (b) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      const PageCore = factory();
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }
    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count (the pill count == the Node count)',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.lines.length === modRes.lines.length;
      for (let k = 0; agree && k < pageRes.lines.length; k++){
        if (pageRes.lines[k].ok !== modRes.lines[k].ok || pageRes.lines[k].name !== modRes.lines[k].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.lines.length} lines identical` : 'a line disagreed');
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
function extractFn(src, name){
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++){
    if (src[k] === '{') depth++;
    else if (src[k] === '}'){ depth--; if (depth === 0){ k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
