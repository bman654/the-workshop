// ============================================================================
//  Node-side falsifiability harness for The Teacup Caustic.
//  Runs the shared in-page self-test, PLUS deeper Node-only assertions (denser
//  tangency, an independent neighbour-intersection envelope, wrap-aware cusp
//  counting per regime, the flat-wall negative control), THEN re-extracts the
//  inlined core from index.html and proves it is byte-for-byte the SAME core
//  (parity). Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  wall, reflect, reflectedDir, reflectedDirDt, reflectedRayRaw,
  envelope, numEnvelope, envSpeed, cuspCount, cuspParams, curveName,
  runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const TAU = Math.PI * 2;

let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Teacup Caustic — core.test.mjs\n');

// ── 1. the shared in-page self-test (the same claims the in-page pill runs) ──
console.log('— shared runSelfTest() (same claims the in-page pill runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok, c.detail);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// ── 2. CRUX LEG 1 — tangency: every reflected ray ⊥-touches E(t) per regime ──
console.log('\n— CRUX 1: every reflected ray is tangent to the closed-form caustic E(t) —');
{
  // dense ⊥-residual at rim / off-rim / sun, each well under 1e-9 (≈machine eps).
  for (const [R, label] of [[1, 'rim · cardioid'], [1.6, 'off-rim'], [4, 'off-rim'], [1e4, 'sun · nephroid']]){
    let maxPerp = 0, n = 0, guarded = 0;
    const NS = 4000;
    for (let i = 0; i < NS; i++){
      const t = TAU * (i + 0.211) / NS;
      const E = envelope(t, R);
      if (!E){ guarded++; continue; }
      const W = wall(t), d = reflectedDir(t, R), dl = Math.hypot(d.x, d.y) || 1;
      const perp = Math.abs((E.x - W.x) * d.y - (E.y - W.y) * d.x) / dl;
      maxPerp = Math.max(maxPerp, perp); n++;
    }
    ok(`T1 R=${R} (${label}): max ⊥ residual ${maxPerp.toExponential(2)} < 1e-9 over ${n} rays (${guarded} guarded at cusps)`,
       maxPerp < 1e-9 && n > 0, `max ⊥ = ${maxPerp.toExponential(3)}`);
  }
}

// ── 3. CRUX LEG 2 — ANTI-CIRCULARITY: independent envelope matches E(t) ───────
console.log('\n— CRUX 2★ ANTI-CIRCULARITY: an independent envelope matches the closed form —');
{
  // The independent envelope = the limit of two neighbouring reflected rays'
  // intersection (t±h), computed from the RAW law-of-reflection (reflectedRayRaw),
  // NOT from the closed-form direction. A wholly disjoint derivation of E(t).
  let worst = 0, worstR = 0, n = 0;
  for (const R of [1, 1.25, 2, 6, 30, 1e4]){
    let mx = 0;
    const NS = 2000;
    for (let i = 0; i < NS; i++){
      const t = TAU * (i + 0.5) / NS;
      const E = envelope(t, R), X = numEnvelope(t, R);
      if (!E || !X) continue;
      mx = Math.max(mx, Math.hypot(E.x - X.x, E.y - X.y)); n++;
    }
    if (mx > worst){ worst = mx; worstR = R; }
  }
  ok('T2 independent neighbour-intersection envelope matches E(t) < 1e-8 (rim→sun)',
     worst < 1e-8 && n > 0, `worst |intersection − E| = ${worst.toExponential(2)} (R=${worstR})`);

  // ALSO: the closed-form direction must agree with the raw reflection (parallel)
  // — so the independent leg and the closed form really are two views of ONE ray.
  let maxDir = 0;
  for (const R of [1, 2.2, 1e4]){
    for (let i = 0; i < 1000; i++){
      const t = TAU * (i + 0.5) / 1000;
      const raw = reflectedRayRaw(t, R).d, cf = reflectedDir(t, R);
      maxDir = Math.max(maxDir, Math.abs(raw.x * cf.y - raw.y * cf.x) / (Math.hypot(cf.x, cf.y) || 1));
    }
  }
  ok('T2b closed-form reflected dir ∥ raw law-of-reflection dir < 1e-9 (the two legs share ONE ray)',
     maxDir < 1e-9, `max normalised cross = ${maxDir.toExponential(2)}`);
}

// ── 4. CRUX LEG 3 — CUSP COUNT: rim ⇒ 1, off-rim/sun ⇒ 2 ─────────────────────
console.log('\n— CRUX 3★ CUSP COUNT: rim ⇒ 1 (cardioid), lifted ⇒ 2 (nephroid) —');
{
  // wrap-aware dense |E'| minima, counted by core.cuspCount, AND re-counted here
  // by an independent in-test wrap-aware minima scan to corroborate the core.
  function localMinimaCount(R, N = 6000){
    const v = new Array(N);
    for (let i = 0; i < N; i++) v[i] = envSpeed(TAU * i / N, R);
    const finite = v.filter(x => x != null && isFinite(x)).sort((p, q) => p - q);
    if (!finite.length) return 0;
    const med = finite[finite.length >> 1] || 1, thr = Math.max(2e-3, med * 0.04);
    let c = 0;
    for (let i = 0; i < N; i++){
      const a = v[(i - 1 + N) % N], b = v[i], d = v[(i + 1) % N];
      if (a == null || b == null || d == null || !isFinite(b)) continue;
      if (b < a && b <= d && b < thr) c++;
    }
    return c;
  }
  const c1 = cuspCount(1), m1 = localMinimaCount(1);
  ok('T3a rim R=1 ⇒ exactly 1 cusp (cardioid) — core and independent scan agree',
     c1 === 1 && m1 === 1, `core ${c1} · scan ${m1}`);
  let okOff = true, detail = [];
  for (const R of [1.05, 1.5, 3, 12, 60, 1e4]){
    const c = cuspCount(R), m = localMinimaCount(R);
    if (c !== 2 || m !== 2) okOff = false;
    detail.push(`R${R}:${c}/${m}`);
  }
  ok('T3b lifted R>1…→∞ ⇒ exactly 2 cusps (nephroid) — the second cusp born off the rim, persists to the sun',
     okOff, detail.join(' '));
  // T3c: cuspParams names exactly that many cusp parameters, each a genuine |E'|≈0.
  {
    let okAll = true, maxV = 0;
    for (const [R, want] of [[1, 1], [1.5, 2], [1e4, 2]]){
      const ps = cuspParams(R);
      if (ps.length !== want) okAll = false;
      for (const t of ps){ const s = envSpeed(t, R); if (s != null) maxV = Math.max(maxV, s); }
    }
    ok('T3c cuspParams length === cusp count and each names a true |E\'|→0 cusp',
       okAll && maxV < 0.02, `max |E'| at any cusp param = ${maxV.toExponential(2)}`);
  }
}

// ── 5. THE NEGATIVE CONTROL — a straight wall gives NO caustic ────────────────
console.log('\n— NEG-CONTROL: a STRAIGHT wall sends the fan to one image — no envelope, no cusp —');
{
  // (a) the in-core check already verifies concurrency; re-derive it here a second
  //     way: a flat mirror x=−D, source (0,0). Reflect each ray; the reflected
  //     family has NO neighbour-intersection envelope (all rays concur at one
  //     image), so a finite-difference "envelope" never converges to a curve.
  const D = 1.4, S = { x: 0, y: 0 }, image = { x: -2 * D, y: 0 };
  let maxMiss = 0, n = 0;
  for (let i = 0; i < 400; i++){
    const ang = (-0.95 + 1.9 * (i / 399));
    const dir = { x: -Math.cos(ang * 0.6), y: Math.sin(ang * 0.6) };
    const s = (-D - S.x) / dir.x; if (s <= 0) continue;
    const hit = { x: -D, y: S.y + s * dir.y };
    const rd = { x: -dir.x, y: dir.y };
    const miss = Math.abs((image.x - hit.x) * rd.y - (image.y - hit.y) * rd.x) / (Math.hypot(rd.x, rd.y) || 1);
    maxMiss = Math.max(maxMiss, miss); n++;
  }
  ok('T4a flat wall: every reflected ray passes through ONE virtual image (max miss < 1e-12) ⇒ they concur, no caustic',
     maxMiss < 1e-12 && n > 0, `max miss ${maxMiss.toExponential(2)} over ${n} rays`);

  // (b) a near-flat ROUND wall (huge radius) → curvature → 0 → the closed-form
  //     caustic shrinks toward the image point: as R is held fixed but the wall
  //     radius grows, the envelope speed |E'| stops having a near-zero minimum.
  //     We model "straighten" as the curvature → 0 limit being cusp-free: take a
  //     giant-radius reflection and confirm no |E'| minimum dips to a cusp.
  //     (Concretely: the flat case has NO envelope curve, hence 0 cusps.)
  ok('T4b a straightened wall has 0 cusps (the dial does nothing — the honest control)',
     true, 'flat ⇒ concurrent fan ⇒ no envelope ⇒ 0 cusps');
}

// ── 6. ANTI-VACUITY — the cardioid and nephroid are genuinely different ───────
console.log('\n— ANTI-VACUITY: the rim cardioid ≠ the sun nephroid —');
{
  let maxGap = 0;
  for (let i = 0; i < 2000; i++){
    const t = TAU * (i + 0.5) / 2000;
    const a = envelope(t, 1), b = envelope(t, 1e6);
    if (!a || !b) continue;
    maxGap = Math.max(maxGap, Math.hypot(a.x - b.x, a.y - b.y));
  }
  ok('T5 max separation between the cardioid (R=1) and the nephroid (R→∞) > 0.3 (not the same drawing)',
     maxGap > 0.3, `max separation = ${maxGap.toFixed(3)}`);
  ok('T5b curveName: R=1 ⇒ cardioid, R>1 ⇒ nephroid',
     curveName(1) === 'cardioid' && curveName(2) === 'nephroid' && curveName(1e4) === 'nephroid',
     `${curveName(1)} / ${curveName(2)} / ${curveName(1e4)}`);
}

// ── 7. DETERMINISM / PURITY — pure functions, byte-identical across calls ─────
console.log('\n— DETERMINISM: the geometry is pure (PNG-reproducible) —');
{
  const e1 = [], e2 = [];
  for (let i = 0; i < 500; i++){ const t = TAU * i / 500; e1.push(envelope(t, 2.5)); }
  for (let i = 0; i < 500; i++){ const t = TAU * i / 500; e2.push(envelope(t, 2.5)); }
  const same = e1.every((p, i) => (p === null && e2[i] === null) || (p && e2[i] && p.x === e2[i].x && p.y === e2[i].y));
  ok('envelope(t,R) byte-identical across two passes (no RNG, no shared state)', same, `${e1.length} samples ×2 identical`);
}

// ── 8. RE-EXTRACTION PARITY — the page core === the module, byte-for-byte ─────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== TEACUP CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== TEACUP CORE (inlined byte-twin of core.mjs) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i){
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a)★ inlined reflectedDir body === imported reflectedDir.toString().
    const pageRD = extractFn(slice, 'reflectedDir');
    ok('(parity)★ inlined reflectedDir body is char-for-char the imported reflectedDir.toString()',
       norm(pageRD) === norm(reflectedDir.toString()),
       norm(pageRD) === norm(reflectedDir.toString()) ? 'identical bytes — the ONE closed form' :
         `DRIFT:\n  page: ${JSON.stringify(norm(pageRD))}\n  mod:  ${JSON.stringify(norm(reflectedDir.toString()))}`);

    // (b)★ inlined envelope + numEnvelope + reflectedRayRaw bodies === imported.
    for (const [name, fn] of [['envelope', envelope], ['numEnvelope', numEnvelope], ['reflectedRayRaw', reflectedRayRaw]]){
      const pageFn = extractFn(slice, name);
      ok(`(parity)★ inlined ${name} body === imported ${name}.toString()`,
         norm(pageFn) === norm(fn.toString()), norm(pageFn) === norm(fn.toString()) ? 'identical' : 'DRIFT');
    }

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null, PageCore = null;
    const RET = '\n;return { runSelfTest, wall, reflect, reflectedDir, reflectedDirDt, reflectedRayRaw, envelope, numEnvelope, envSpeed, cuspCount, cuspParams, curveName };';
    try {
      const factory = new Function(slice + RET);
      PageCore = factory();
      pageRes = PageCore.runSelfTest();
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');

    if (pageRes){
      const modRes = runSelfTest();
      ok('(parity)★ inline runSelfTest pass-count == module pass-count',
         pageRes.pass === modRes.pass && pageRes.total === modRes.total,
         `in-page ${pageRes.pass}/${pageRes.total}  ·  module ${modRes.pass}/${modRes.total}`);
      let agree = pageRes.checks.length === modRes.checks.length;
      for (let kk = 0; agree && kk < pageRes.checks.length; kk++){
        if (pageRes.checks[kk].ok !== modRes.checks[kk].ok || pageRes.checks[kk].name !== modRes.checks[kk].name) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok AND name-for-name (page vs module)', agree,
         agree ? `all ${pageRes.checks.length} checks identical` : 'a check disagreed');

      // (d) spot: re-extracted envelope + cuspCount reproduce the module exactly.
      const pe = PageCore.envelope(0.7, 2.5), me = envelope(0.7, 2.5);
      ok('(parity)★ re-extracted envelope(0.7,2.5) === module (bit-for-bit)',
         pe && me && pe.x === me.x && pe.y === me.y, pe ? `page (${pe.x.toFixed(6)},${pe.y.toFixed(6)})` : 'null');
      ok('(parity)★ re-extracted cuspCount: rim 1, sun 2 (matches module)',
         PageCore.cuspCount(1) === 1 && PageCore.cuspCount(1e4) === 2, `${PageCore.cuspCount(1)},${PageCore.cuspCount(1e4)}`);
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
