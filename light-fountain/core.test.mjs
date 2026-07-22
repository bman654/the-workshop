// Node twin for The Light That Can't Get Out. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block below), so the page's self-test chip and this test can never drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  criticalAngle, bendRadiusMin, fresnelT, refract, makeStream, localBendRadius,
  traceGuide, traceArcGuide, witness, runSelfTest
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0; const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }
const DEG = 180 / Math.PI, nW = 1.333, nA = 1.0;

// ── (a) THE SELF-TEST — the same runSelfTest the in-page pill calls must be all-green ──
{
  const r = runSelfTest();
  ck('runSelfTest() all green (' + r.passed + '/' + r.total + ')', r.ok && r.passed === r.total);
  for (const c of r.checks) ck('  · ' + c.name, c.pass);
}

// ── (b) THE LAW — R_min = r(n+1)/(n−1); θc = asin(1/n); scale-invariant ──
{
  const thetaC = criticalAngle(nW, nA);
  ck('θc = asin(1/n)', Math.abs(thetaC - Math.asin(1 / nW)) < 1e-15);
  ck('R_min = r(n+1)/(n−1) at r=18 ≈ 126.1', Math.abs(bendRadiusMin(18, nW) - 18 * (nW + 1) / (nW - 1)) < 1e-12);
  ck('R_min/r ≈ 7.006 for water', Math.abs(bendRadiusMin(1, nW) - 7.006) < 0.001);
  ck('R_min scale-invariant (10× r → 10× R_min)', Math.abs(bendRadiusMin(180, nW) - 10 * bendRadiusMin(18, nW)) < 1e-9);
  // sugar-water n=1.4 → R_min ≈ 6r
  ck('sugar-water n=1.4 → R_min ≈ 6r', Math.abs(bendRadiusMin(1, 1.4) - 6.0) < 1e-9);
  // at R = R_min the crest incidence equals θc exactly (osculating law ⟺ arc oracle)
  const r = 18, Rm = bendRadiusMin(r, nW);
  ck('R=R_min ⇒ asin((R−r)/(R+r)) === θc', Math.abs(Math.asin((Rm - r) / (Rm + r)) - thetaC) < 1e-12);
}

// ── (c) FRESNEL — T∈[0,1], 0 at/above critical, →1 at normal incidence, monotone-ish ──
{
  const thetaC = criticalAngle(nW, nA);
  ck('fresnelT(0) high (near-1) at normal incidence', fresnelT(0, nW, nA) > 0.97);
  ck('fresnelT(θc) === 0 (TIR onset)', fresnelT(thetaC, nW, nA) === 0);
  ck('fresnelT above θc === 0 (TIR)', fresnelT(thetaC + 0.1, nW, nA) === 0 && fresnelT(1.5, nW, nA) === 0);
  ck('fresnelT in [0,1] across a sweep', [0, 0.2, 0.4, 0.6, 0.8].every(t => { const T = fresnelT(t, nW, nA); return T >= 0 && T <= 1; }));
}

// ── (d) THE ORACLE — independent closed-form outer incidence on a battery of arcs ──
{
  let maxErr = 0, ok = true;
  for (const R of [100, 150, 250, 400]) for (const r of [8, 18, 33]) {
    const a = traceArcGuide({ R, r, nWater: nW, turns: 12 });
    const closed = Math.asin((R - r) / (R + r));
    maxErr = Math.max(maxErr, Math.abs(a.minOuterTheta - closed), a.outerThetaErr);
    if ((R >= bendRadiusMin(r, nW)) !== a.trapped && Math.abs(R - bendRadiusMin(r, nW)) > 1e-6) ok = false;
  }
  ck('oracle outer incidence = asin((R−r)/(R+r)) < 1e-9 across battery', maxErr < 1e-9);
  ck('oracle trap/leak agrees with R_min across battery', ok);
}

// ── (e) THE CLAIM (independent of runSelfTest) — witness trapped, EVERY bounce ≥ θc ──
{
  const w = witness(), st = makeStream(w.stream), tr = traceGuide(st, w.ray);
  const thetaCDeg = criticalAngle(nW, nA) * DEG;
  ck('witness is TRAPPED (R_apex ≥ R_min)', tr.trapped && st.apexRadius >= bendRadiusMin(st.r, nW));
  ck('witness: every internal bounce θ ≥ θc', tr.bounces.every(b => b.trapped && b.thetaDeg >= thetaCDeg - 1e-9));
  ck('witness: no leaks, escS = Infinity, pool bright', tr.leaks.length === 0 && !isFinite(tr.escS) && tr.poolI >= 0.99);
  ck('witness: min incidence ≥ θc', tr.minThetaDeg >= thetaCDeg - 1e-9);
}

// ── (f) PAYOFF-LIVENESS (independent) — starve the flow so R_apex < R_min: the leak FIRES ──
{
  const w = witness();
  const vxThr = Math.sqrt(w.stream.g * bendRadiusMin(w.stream.r, nW));
  const vLeak = (vxThr / Math.cos(w.stream.alpha)) * 0.72;
  const st = makeStream({ ...w.stream, v: vLeak }), tr = traceGuide(st, w.ray);
  const wit = traceGuide(makeStream(w.stream), w.ray);
  ck('starved: R_apex < R_min', st.apexRadius < bendRadiusMin(st.r, nW));
  ck('starved: a bounce dips below θc', tr.bounces.some(b => b.thetaDeg < criticalAngle(nW, nA) * DEG - 1e-6));
  ck('starved: leak fires at the crest (leakAtApex, escS = apexS)', tr.leaks.length > 0 && tr.leakAtApex && Math.abs(tr.escS - st.apexS) < 1e-6);
  ck('starved: a refracted ray escapes with a real Snell dir', tr.leaks[0].dirOut && isFinite(tr.leaks[0].dirOut.x) && isFinite(tr.leaks[0].dirOut.y));
  ck('starved: downstream darkens (pool far below the witness)', tr.poolI < wit.poolI - 0.5);
  ck('starved: streak clipped at the crest (spout→apex only)', tr.streak.every(p => p.s <= st.apexS + 1e-6));
}

// ── (g) FLOW RESPONSE — the trace threshold sits mid flow-range and the knee is at vₓ_threshold ──
{
  const w = witness();
  const vxThr = Math.sqrt(w.stream.g * bendRadiusMin(w.stream.r, nW));
  const vThr = vxThr / Math.cos(w.stream.alpha);
  let prev = -1, mono = true, crossings = 0, wasTrap = null;
  for (let f = 0.7; f <= 1.3; f += 0.02) {
    const tr = traceGuide(makeStream({ ...w.stream, v: vThr * f }), w.ray);
    if (tr.poolI < prev - 1e-9) mono = false;
    prev = tr.poolI;
    if (wasTrap !== null && wasTrap !== tr.trapped) crossings++;
    wasTrap = tr.trapped;
  }
  ck('flow response: pool weakly-monotone increasing with v', mono);
  ck('flow response: exactly one trap↔leak knee across the sweep', crossings === 1);
  // the knee sits at v = vThr (⟺ R_apex = R_min) to machine precision
  const justBelow = traceGuide(makeStream({ ...w.stream, v: vThr * 0.999 }), w.ray);
  const justAbove = traceGuide(makeStream({ ...w.stream, v: vThr * 1.001 }), w.ray);
  ck('flow response: knee at vₓ_threshold (below leaks, above traps)', !justBelow.trapped && justAbove.trapped);
  // the default scene puts the threshold mid-range (a visitor sweeping flow reliably crosses it)
  const vMin = 480, vMax = 900;
  ck('default scene: threshold sits mid flow-range', vThr > vMin + 0.15 * (vMax - vMin) && vThr < vMax - 0.15 * (vMax - vMin));
}

// ── (h) DOMAIN GUARDS — degenerate scenes are finite, never NaN to canvas ──
{
  const scenes = [
    { x0: 0, y0: 0, alpha: 58 * Math.PI / 180, v: 1e-9, r: 18, g: 900, fallH: 240, samples: 300 },
    { x0: 0, y0: 0, alpha: Math.PI / 2, v: 700, r: 18, g: 900, fallH: 240, samples: 300 },
    { x0: 0, y0: 0, alpha: 40 * Math.PI / 180, v: 200, r: 80, g: 900, fallH: 240, samples: 300 },
    { x0: 0, y0: 0, alpha: 20 * Math.PI / 180, v: 700, r: 18, g: 900, fallH: 240, samples: 300 },
    { x0: 0, y0: 0, alpha: 85 * Math.PI / 180, v: 900, r: 18, g: 900, fallH: 240, samples: 300 },
  ];
  let ok = true;
  for (const s of scenes) {
    const st = makeStream(s), tr = traceGuide(st, { phi0: 0, nWater: nW, nAir: nA, maxBounces: 80 });
    if (![st.apexRadius, st.apexS, st.tEnd, tr.poolI, tr.minThetaDeg, tr.invariantDrift].every(Number.isFinite)) ok = false;
    for (const b of tr.bounces) if (!Number.isFinite(b.thetaDeg) || !Number.isFinite(b.pt.x) || !Number.isFinite(b.pt.y)) ok = false;
    for (const p of tr.streak) if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.s)) ok = false;
  }
  // n=1 (θc→90°) — everything leaks, still finite; marcher capped (bounded bounce count)
  const st1 = makeStream(witness().stream);
  const tr1 = traceGuide(st1, { phi0: 0, nWater: 1.0, nAir: 1.0, maxBounces: 80 });
  ok = ok && Number.isFinite(tr1.poolI) && Number.isFinite(tr1.minThetaDeg) && !tr1.trapped;
  ck('domain guards: 5 degenerate scenes + n=1 all finite, marcher bounded', ok);
  ck('marcher never exceeds maxBounces', traceGuide(makeStream({ ...witness().stream, r: 80 }), { phi0: 0, nWater: nW, maxBounces: 40 }).bounces.length <= 42);
}

// ── (i) localBendRadius — analytic curvature, minimised at the apex = vₓ²/g ──
{
  const w = witness(), st = makeStream(w.stream), p = w.stream;
  const vx = p.v * Math.cos(p.alpha);
  ck('localBendRadius at apex (t=vy/g) === vₓ²/g === apexRadius', Math.abs(localBendRadius(p, p.v * Math.sin(p.alpha) / p.g) - vx * vx / p.g) < 1e-6 && Math.abs(st.apexRadius - vx * vx / p.g) < 1e-6);
  ck('apex is the MINIMUM bend radius along the stream', st.Rlocal.every(R => R >= st.apexRadius - 1e-6));
}

// ── (j) BYTE-TWIN PARITY — coreRegion(core.mjs) === coreRegion(index.html), character-identical ──
function coreRegion(path) {
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf('// === LIGHT-GUIDE CORE BEGIN ===');
  const b = src.indexOf('// === LIGHT-GUIDE CORE END ===');
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + '// === LIGHT-GUIDE CORE END ==='.length);
}
{
  const fromCore = coreRegion(join(__dirname, 'core.mjs'));
  let fromPage = null;
  try { fromPage = coreRegion(join(__dirname, 'index.html')); } catch (e) { fromPage = null; }
  ck('byte-twin: sentinels found in core.mjs', !!fromCore);
  ck('byte-twin: sentinels found in index.html', !!fromPage);
  ck('byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);
}

// ── report ──
const w = witness(), st = makeStream(w.stream);
console.log('The Light That Can\'t Get Out · core.test.mjs');
console.log('  n=' + nW + ' · θc=' + (criticalAngle(nW) * DEG).toFixed(2) + '° · R_min/r=' + (bendRadiusMin(1, nW)).toFixed(3));
console.log('  witness: R_apex=' + st.apexRadius.toFixed(0) + '  R_min=' + bendRadiusMin(st.r, nW).toFixed(0) + '  → TRAPPED');
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('  FAILURES:'); for (const f of fails) console.log('   ✗ ' + f); process.exit(1); }
console.log('  ✓ all green');
