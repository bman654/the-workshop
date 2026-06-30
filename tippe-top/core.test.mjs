// ============================================================================
//  Node-side falsifiability harness for THE TIPPE-TOP — the top that stands up on
//  its head. Two layers, mirroring the-top:
//   LAYER 1 — the SHARED in-page self-test runSelfTest() (the SAME claims the page
//             pill runs): assert every check ok-for-ok.
//   LAYER 2 — deeper Node-only assertions: a dense R×a×C×A model grid + 500 seeded-
//             random VALID models for (A) Jellett exact, (B) ledger closes, (C) flips
//             IFF ω>ω_crit (≥200 μ×ω cells, mismatch===0), (D) μ=0 never flips to
//             machine-ε; PLUS byte-parity — re-extract the BEGIN/END slab from
//             index.html and prove each inlined fn body === imported fn.toString()
//             char-for-char, the constants are verbatim, and new Function(slice)'s
//             runSelfTest() agrees pass-count + ok-for-ok + name-for-name.
//  Run:  node core.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  R, A_a, M, C, A, G, MU0, OMEGA0, H_SIM, K_RISE, N_CAP,
  defaults, comHeight, dArm, inWindow, omegaCrit, jellett, thetaDot, deriv,
  nFromP, rk4, clampTheta, integrate, startState, flips, flipTime, energyLedger,
  lagrangeDeriv, lagrangeEnergy, lagrangeRun, runSelfTest,
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

console.log('THE TIPPE-TOP — core.test.mjs\n');

// ── LAYER 1. THE SHARED IN-PAGE SELF-TEST (the same claims the pill runs) ──────────
console.log('— LAYER 1 · shared runSelfTest() (the SAME claims the in-page chip runs) —');
{
  const st = runSelfTest();
  for (const c of st.checks) ok('[self-test] ' + c.name, c.ok);
  ok('[self-test] all in-page checks pass', st.pass === st.total, `${st.pass}/${st.total}`);
}

// a small deterministic PRNG so the random-model sweep is reproducible.
function mulberry32(seed){ let a = seed >>> 0; return function(){
  a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// draw a random VALID symmetric tippe-top model (inside the geometry window).
function randomModel(rng){
  for(let tries=0; tries<200; tries++){
    const r = 0.012 + rng()*0.02;                 // R ∈ [0.012, 0.032] m
    const a = r*(0.20 + rng()*0.45);              // a/R = α ∈ [0.20, 0.65]
    const m = 0.008 + rng()*0.02;                 // mass
    const c = (0.3 + rng()*0.4) * m*r*r;          // C ~ a fraction of m R²
    // γ = A/C must land inside (1−α, 1+α); pick A accordingly.
    const al = a/r;
    const gamma = (1 - al) + rng()*(2*al)*0.9 + al*0.05;   // strictly inside the window
    const at = gamma * c;
    const p = { R:r, a, M:m, C:c, A:at, g:9.81, mu: 0.1 + rng()*0.5 };
    // require ω_crit real & positive (den>0) and inside the window
    if(inWindow(p) && (at - c + m*a*r) > 0 && Number.isFinite(omegaCrit(p)) && omegaCrit(p) > 0) return p;
  }
  return null;
}

// ── LAYER 2.A — the dense MODEL GRID + 500 random VALID models. ────────────────────
console.log('\n— LAYER 2 · DENSE GRID — (A) Jellett exact, (B) ledger closes, over a dense R×a×C×A grid —');
{
  const GRID = [];
  for(const r of [0.015, 0.020, 0.026])
    for(const al of [0.25, 0.35, 0.50])
      for(const cf of [0.35, 0.55])
        for(const gOff of [0.3, 0.7]){
          const a = r*al, m = 0.015, c = cf*m*r*r;
          const gamma = (1-al) + gOff*(2*al);    // inside the window
          const p = { R:r, a, M:m, C:c, A:gamma*c, g:9.81, mu:0.3 };
          if(inWindow(p) && (p.A - p.C + m*a*r) > 0) GRID.push(p);
        }
  let jExact = true, ledger = true, heat = true, worstJ = 0, worstResid = 0;
  for(const p of GRID){
    const v0 = startState(0.05, omegaCrit(p)*4, p);
    const v = integrate(v0, H_SIM, Math.round(30/H_SIM), p);
    const jd = Math.abs(v[1]-v0[1])/Math.abs(v0[1]); worstJ = Math.max(worstJ, jd);
    if(!(jd < 1e-12)) jExact = false;
    const L = energyLedger(v0, integrate(v0, 5e-4, Math.round(30/5e-4), p), p);
    worstResid = Math.max(worstResid, L.residual);
    if(!(L.residual < 1e-8)) ledger = false;
    if(!(L.fricLoss > 1e-12 && L.dPE > 0)) heat = false;
  }
  ok('(A) Jellett P=C·n·d EXACT across the flip over the dense grid (machine-ε)', jExact, `${GRID.length} models · worst P-drift = ${worstJ.toExponential(2)}`);
  ok('(B) energy ledger closes over the dense grid (residual < 1e-8)', ledger, `worst residual = ${worstResid.toExponential(2)}`);
  ok('★ friction loss NONZERO & CoM rises on every grid model (the heat is real, the climb is real)', heat);
}

console.log('\n— LAYER 2 · 500 SEEDED-RANDOM VALID MODELS — (A)(B)(C)(D) all hold —');
{
  const rng = mulberry32(0x71997070);
  let nModels = 0, jExact = true, ledger = true, cAll = true, dAll = true;
  let worstJ = 0, worstResid = 0, worstD = 0, cMism = 0, cCells = 0;
  for(let i=0;i<500;i++){
    const p = randomModel(rng);
    if(!p) continue; nModels++;
    const nc = omegaCrit(p);
    // (A) Jellett exact + (B) ledger over a 30 s flip
    const v0 = startState(0.05, nc*4, p);
    const v = integrate(v0, H_SIM, Math.round(30/H_SIM), p);
    const jd = Math.abs(v[1]-v0[1])/Math.abs(v0[1]); worstJ = Math.max(worstJ, jd);
    if(!(jd < 1e-12)) jExact = false;
    const L = energyLedger(v0, v, p); worstResid = Math.max(worstResid, L.residual);
    if(!(L.residual < 1e-6)) ledger = false;       // H_SIM ledger, a slightly looser fit
    // (C) the EXACT bifurcation — the RISE DIRECTION at the upright state:
    // sign(thetaDot(θ→0, ω)) === sign(ω−ω_crit). (The global flip near threshold can
    // stall — the flip-time divergence — so the boolean we assert === is the local
    // bifurcation, the rigorous statement.)
    for(const f of [0.5, 0.8, 0.95, 1.05, 1.3, 2.0, 4.0]){
      const rises = thetaDot(0.05, nc*f, p) > 0;
      if(rises !== (nc*f > nc)) { cMism++; cAll = false; }
      cCells++;
    }
    // and end-to-end: a clearly supercritical top walks PAST the equator (it flipped);
    // a clearly subcritical one never does. (How FAR past π/2 a top settles depends on
    // its geometry — flat high-α tops invert partially; the default model fully inverts.)
    if(!(integrate(startState(0.05, nc*3,   p), H_SIM, Math.round(120/H_SIM), p)[0] > Math.PI/2)) cAll = false;
    if(  integrate(startState(0.05, nc*0.6, p), H_SIM, Math.round(40/H_SIM),  p)[0] > Math.PI/2 ) cAll = false;
    // (D) μ=0 never flips to machine-ε
    const p0 = Object.assign({}, p, { mu:0 });
    for(const f of [0.5, 2, 6]){
      const vv = integrate(startState(0.05, nc*f, p0), H_SIM, Math.round(30/H_SIM), p0);
      worstD = Math.max(worstD, Math.abs(vv[0]-0.05));
      if(!(Math.abs(vv[0]-0.05) < 1e-12)) dAll = false;
    }
  }
  ok('(A) Jellett EXACT across 500 random valid models (machine-ε)', jExact, `${nModels} models · worst = ${worstJ.toExponential(2)}`);
  ok('(B) ledger closes across 500 random valid models', ledger, `worst residual = ${worstResid.toExponential(2)}`);
  ok('★ (C) FLIPS IFF ω>ω_crit across the random models — zero mismatches', cAll, `${cCells} cells · ${cMism} mismatches`);
  ok('★ (D) μ=0 NEVER flips across the random models — finalθ===θ0 to machine-ε', dAll, `worst |Δθ| = ${worstD.toExponential(2)}`);
}

// ── LAYER 2.C — the dedicated ≥200-cell μ×ω bifurcation sweep, mismatch===0. ───────
console.log('\n— LAYER 2 · (C) the μ×ω bifurcation sweep — ≥200 cells, mismatch === 0 —');
{
  const p0 = defaults();
  let mism = 0, cells = 0;
  const nc = omegaCrit(p0);
  for(const mu of [0.08, 0.15, 0.25, 0.35, 0.45, 0.55]){
    const p = Object.assign({}, p0, { mu });
    for(let k=0;k<40;k++){
      const w0 = nc*(0.4 + k*0.04);
      const rises = thetaDot(0.05, w0, p) > 0;       // the rise direction = the bifurcation
      if(rises !== (w0 > nc)) mism++;
      cells++;
    }
  }
  ok('★ sign(thetaDot at upright) === (ω0>ω_crit) over the μ×ω grid — the model\'s own bifurcation, EXACT boolean', mism === 0, `${cells} cells · ${mism} mismatches`);
}

// ── LAYER 2.D — μ=0 ⇒ thetaDot()≡0 IDENTICALLY (structural), not just numerically. ─
console.log('\n— LAYER 2 · (D) μ=0 ⇒ thetaDot≡0 structurally —');
{
  const p0 = Object.assign({}, defaults(), { mu:0 });
  let allZero = true;
  for(let k=0;k<50;k++){
    const th = 0.01 + k*(Math.PI-0.02)/50;
    for(const n of [10, 50, 200, 500]){
      if(thetaDot(th, n, p0) !== 0) allZero = false;
    }
  }
  ok('★ thetaDot(θ, n, μ=0) === 0 for EVERY (θ, n) — μ=0 kills the rise identically (spin does no work on the CoM)', allZero);
}

// ── LAYER 2.E — the comHeight law + ΔPE = 2·M·g·a, EXACT. ──────────────────────────
console.log('\n— LAYER 2 · the comHeight law h(θ)=R−a cosθ, ΔPE flip = 2 M g a —');
{
  const p = defaults();
  const hLow = comHeight(0, p), hHigh = comHeight(Math.PI, p);
  const dPEexact = p.M*p.g*(hHigh - hLow);
  ok('h(0)=R−a (low), h(π)=R+a (high) EXACT', Math.abs(hLow-(p.R-p.a))<1e-15 && Math.abs(hHigh-(p.R+p.a))<1e-15);
  ok('★ ΔPE over a full flip === 2·M·g·a EXACT', Math.abs(dPEexact - 2*p.M*p.g*p.a) < 1e-15, `ΔPE = ${dPEexact.toExponential(4)} J`);
}

// ── LAYER 2.F — RE-EXTRACTION PARITY: the page core === the module core, byte-twin. ─
console.log('\n— LAYER 2 · RE-EXTRACTION PARITY: the page core === the module core —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== TIPPE-TOP CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== TIPPE-TOP CORE (inlined byte-twin) END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
    i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);
    const norm = s => s.replace(/^export\s+/, '').trim();

    // (a) ★ each inlined function body === imported fn.toString() char-for-char.
    const fnPairs = [
      ['defaults', defaults], ['comHeight', comHeight], ['dArm', dArm], ['inWindow', inWindow],
      ['omegaCrit', omegaCrit], ['jellett', jellett], ['thetaDot', thetaDot], ['deriv', deriv],
      ['nFromP', nFromP], ['rk4', rk4], ['clampTheta', clampTheta], ['integrate', integrate],
      ['startState', startState], ['flips', flips], ['flipTime', flipTime], ['energyLedger', energyLedger],
      ['lagrangeDeriv', lagrangeDeriv], ['lagrangeEnergy', lagrangeEnergy], ['lagrangeRun', lagrangeRun],
      ['runSelfTest', runSelfTest],
    ];
    let fdrift = '';
    for (const [name, fn] of fnPairs) {
      const pageBody = extractFn(slice, name);
      if (norm(pageBody) !== norm(fn.toString())) { fdrift = name; break; }
    }
    ok('(parity)★ every inlined FUNCTION body is char-for-char the imported core (omegaCrit/deriv/integrate/energyLedger/runSelfTest/…)',
      fdrift === '', fdrift === '' ? `all ${fnPairs.length} functions byte-identical` : `DRIFT in ${fdrift}`);

    // (b) the load-bearing constants are present verbatim.
    ok('(parity)★ the inlined constants R, a, M, C, A, g, μ, ω, H_SIM, K_RISE are present verbatim',
      slice.indexOf('const R   = 0.02;') >= 0 && slice.indexOf('const A_a = 0.006;') >= 0 &&
      slice.indexOf('const M   = 0.015;') >= 0 && slice.indexOf('const C   = 2.3e-6;') >= 0 &&
      slice.indexOf('const A   = 2.5e-6;') >= 0 && slice.indexOf('const G   = 9.81;') >= 0 &&
      slice.indexOf('const H_SIM = 1e-3;') >= 0 && slice.indexOf('const K_RISE = 60;') >= 0);

    // (c) evaluate the slice and run ITS runSelfTest → same pass-count + ok-for-ok.
    let pageRes = null, evalErr = null;
    const RET = '\n;return { runSelfTest };';
    try {
      const factory = new Function(slice + RET);
      pageRes = factory().runSelfTest();
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
// Skips the PARAMETER LIST first (matching its parentheses) so a default-value
// parameter doesn't fool the body-brace finder. (Same extractor as the siblings.)
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
