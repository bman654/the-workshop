// The Transformer — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() (identical to the in-page pill), proves the five
//   rows independently against the REAL parent oracle, RE-EXTRACTS the inlined core
//   from index.html and proves the page core === the module core (byte-twin) —
//   injecting the parent symbols as factory args (THE divergence from the whirligig,
//   whose slice was self-contained; here the slice references the parent) — and
//   asserts the parents stay byte-untouched oracles. Exits 0 only when all hold.
import * as Hall from '../core.mjs';       // the PARENT oracle, BYTE-UNTOUCHED
import * as Core from './core.mjs';        // the transformer turns-ratio authority
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
function ok(name, cond, info = '') {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
const numDeriv = (f, x, e) => (f(x-2*e) - 8*f(x-e) + 8*f(x+e) - f(x+2*e)) / (12*e);

console.log('The Lodestone Hall · The Transformer — Node cross-check\n');
const X = Core.XFMR;
const RIG = Hall.SCENE.rig, GEOM = Hall.COIL, OM = X.omega;

// ── §0. the shared self-test (identical to the in-page pill) ─────────────────
console.log('— §0 shared runSelfTest() (the SAME assertions the in-page pill runs) —');
const moduleRes = Core.runSelfTest();
for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);

// ── §ROW 1: TURNS-RATIO LAW over a dense INDEPENDENT Np × Ns × θ × ω sweep ────
console.log('\n— §ROW1: V_s/V_p === N_s/N_p  (|V_s·Np − V_p·Ns| over a dense independent sweep) —');
{
  let worst = 0, where = '';
  const NP = [10, 25, 60, 100, 200, 320], NS = [5, 30, 100, 220, 320], OMS = [0.2, 0.7, 1.3, 2.1, 3.0];
  for (let k = 0; k < 600; k++){
    const th = 2*Math.PI*k/600;
    for (const w of OMS) for (const np of NP) for (const ns of NS){
      const vp = Core.primaryVoltage(th, w, np), vs = Core.secondaryVoltage(th, w, ns);
      if (Math.abs(vp) < 1e-12) continue;
      const d = Math.abs(vs*np - vp*ns);
      if (d > worst){ worst = d; where = `θ=${th.toFixed(2)} ω=${w} Np=${np} Ns=${ns}`; }
    }
  }
  ok('(turns-ratio)★ |V_s·Np − V_p·Ns| < 1e-9 over the dense sweep',
     worst < 1e-9, `worst |Δ| ${worst.toExponential(2)} @ ${where}`);
}

// ── §ROW 2: POWER CONSERVATION + dual current ratio ──────────────────────────
console.log('\n— §ROW2: V_p·I_p === V_s·I_s with I_s=I_p·Np/Ns  (+ dual current ratio) —');
{
  let worstP = 0, worstC = 0;
  const NP = [10, 60, 100, 200, 320], NS = [5, 50, 160, 320], IP = [0.5, 1.0, 2.0, 4.0];
  for (let k = 0; k < 400; k++){
    const th = 2*Math.PI*k/400;
    for (const np of NP) for (const ns of NS) for (const Ip of IP){
      const vp = Core.primaryVoltage(th, OM, np), vs = Core.secondaryVoltage(th, OM, ns);
      const Is = Core.secondaryCurrent(Ip, np, ns);
      worstP = Math.max(worstP, Math.abs(vp*Ip - vs*Is));
      worstC = Math.max(worstC, Math.abs(Is*ns - Ip*np));
      // and primaryCurrent is the exact inverse
      worstC = Math.max(worstC, Math.abs(Core.primaryCurrent(Is, np, ns) - Ip));
    }
  }
  ok('(power)★ |V_p·I_p − V_s·I_s| < 1e-9 (voltage up ⇒ current down, power held)',
     worstP < 1e-9, `worst |Δ| ${worstP.toExponential(2)}`);
  ok('(current)★ I_s·Ns === I_p·Np and primaryCurrent inverts secondaryCurrent, <1e-9',
     worstC < 1e-9, `worst |Δ| ${worstC.toExponential(2)}`);
}

// ── §ROW 3: FARADAY finite-difference of the IMPORTED flux Φ(t)=Ns·fluxAtAngle ─
console.log('\n— §ROW3: V_s === −N_s·dΦ/dt of the IMPORTED flux  (5-point finite difference) —');
{
  // The 5-point truncation error is O(N_s) (the flux amplitude scales with N_s), so
  // the faithful per-winding threshold divides it out: |V_s closed − numeric| / N_s.
  let worst = 0, worstRel = 0;
  for (const Ns of [20, 100, 240, 320]){
    for (let k = 0; k < 400; k++){
      const th = 2*Math.PI*k/400;
      const closed  = Core.secondaryVoltage(th, OM, Ns);
      const Phi = (t) => Ns * Hall.fluxAtAngle(t, RIG, GEOM);   // the IMPORTED parent flux
      const numeric = -numDeriv(Phi, th, 2e-4) * OM;
      worst = Math.max(worst, Math.abs(closed - numeric));
      worstRel = Math.max(worstRel, Math.abs(closed - numeric) / Ns);
    }
  }
  ok('(faraday)★ V_s === −N_s·dΦ/dt of the parent\'s OWN flux (the twin EARNS the law), per-winding <1e-9',
     worstRel < 1e-9, `worst |V_s closed − numeric|/N_s ${worstRel.toExponential(2)} (raw worst ${worst.toExponential(2)} grows with N_s)`);
}

// ── §ROW 4: NEG-CONTROL UNLINK — exact-0 every Ns + linked RMS>1.0 (teeth) ────
console.log('\n— §ROW4: NEG-CONTROL unlink — V_s ≡ 0 for ANY N_s while the linked RMS is large —');
{
  let unl = 0, linkSq = 0, n = 0;
  for (let k = 0; k < 3000; k++){
    const th = 2*Math.PI*k/3000;
    for (const Ns of [5, 50, 160, 320]){
      unl = Math.max(unl, Math.abs(Core.secondaryVoltage(th, OM, Ns, { unlinkedCore: true })));
    }
    const v = Core.secondaryVoltage(th, OM, X.Ns); linkSq += v*v; n++;
  }
  const rms = Math.sqrt(linkSq/n);
  ok('(neg-unlink)★ max|V_s unlinked| === 0 exactly AND linked RMS > 1.0 (a vacuous pass FAILS)',
     unl === 0 && rms > 1.0, `max|V_s unlinked| ${unl}, linked RMS ${rms.toFixed(1)}`);
}

// ── §ROW 5: NEG-CONTROL DC — exact-0 at ω=0 + AC RMS>1.0 ─────────────────────
console.log('\n— §ROW5: NEG-CONTROL DC — ω=0 ⇒ both meters dead while the AC RMS is large —');
{
  let dc = 0, acSq = 0, n = 0;
  for (let k = 0; k < 3000; k++){
    const th = 2*Math.PI*k/3000;
    dc = Math.max(dc,
      Math.abs(Core.primaryVoltage(th, OM, X.Np, { dcPrimary: true })),
      Math.abs(Core.secondaryVoltage(th, OM, X.Ns, { dcPrimary: true })));
    const vp = Core.primaryVoltage(th, OM, X.Np); acSq += vp*vp; n++;
  }
  const rms = Math.sqrt(acSq/n);
  ok('(neg-dc)★ max(|V_p|,|V_s|) at ω=0 === 0 exactly AND AC RMS > 1.0',
     dc === 0 && rms > 1.0, `max|V| at ω=0 ${dc}, AC RMS ${rms.toFixed(1)}`);
}

// ── §ANTI-CIRCULARITY — SCOPED grep of ONLY the TRANSFORMER slice ─────────────
console.log('\n— §ANTI-CIRCULARITY: the transformer slice names the parent oracle and re-types NO flux math —');
{
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const B = '// === TRANSFORMER CORE BEGIN ===', E = '// === TRANSFORMER CORE END ===';
  const i = mod.indexOf(B), j = mod.indexOf(E);
  const slice = mod.slice(i, j + E.length);
  const namesOracle = /emfAlternator|dFluxdTheta|fluxAtAngle/.test(slice) || /from ['"]\.\.\/core/.test(mod);
  ok('(anti-circ)★ the transformer slice NAMES the parent oracle (imports its EMF law, not forks it)',
     namesOracle, namesOracle ? 'slice references the parent oracle' : 'slice does NOT name the oracle');
  const noTrig = !/Math\.(sin|cos)/.test(slice);
  const noFlux = !/streamPsi|fluxThroughMouth|fluxGrad|psiGrad/.test(slice);
  ok('(anti-circ)★ the transformer slice re-types NO flux math (no Math.sin/cos, no parent flux internals)',
     noTrig && noFlux, `no trig in slice: ${noTrig}, no flux internals in slice: ${noFlux}`);
  // sanity: the parent's Math.sin DOES exist elsewhere in ../core.mjs — confirm the
  // grep was correctly BOUNDED to the slice and did not false-positive.
  const parentSrc = readFileSync(join(__dir, '..', 'core.mjs'), 'utf8');
  ok('(anti-circ)★ the grep is bounded: the parent core DOES contain Math.sin (so the slice scope matters)',
     /Math\.(sin|cos)/.test(parentSrc), 'parent core uses Math.sin/cos as expected — the slice excludes it');
}

// ── §BYTE-TWIN PARITY — re-extract the TRANSFORMER slice from index.html, assert
//    char-identical to core.mjs's slice, then EVAL it injecting the parent symbols ─
console.log('\n— §BYTE-TWIN PARITY: page transformer core === module core, evaluated with injected parent symbols —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { ok('index.html present (forge built it)', false, 'MISSING — run: node tools/forge/forge.mjs lodestone-hall/the-transformer/index.src.html'); }

  if (html){
    const B = '// === TRANSFORMER CORE BEGIN ===', E = '// === TRANSFORMER CORE END ===';
    const i = html.indexOf(B), j = html.indexOf(E);
    ok('inline transformer sentinels present in index.html', i >= 0 && j > i,
       i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS — has forge built index.html?');

    if (i >= 0 && j > i){
      const pageSlice = html.slice(i, j + E.length);
      const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
      const mi = mod.indexOf(B), mj = mod.indexOf(E);
      const modSlice = mod.slice(mi, mj + E.length);

      ok('(0-teeth)★ inline transformer slice (BEGIN..END) is char-for-char the module body',
         pageSlice === modSlice,
         pageSlice === modSlice ? `identical bytes (${modSlice.length} chars)`
         : `DRIFT: page ${pageSlice.length} vs module ${modSlice.length} chars`);

      ok('the inline slice contains no forge directive leakage',
         !/forge:include/.test(pageSlice), 'core slice is pure — no include leaked into the byte-twin');

      // EVAL the slice (export-stripped), injecting the parent symbols as factory args.
      // THIS is the divergence from the whirligig: the slice references the parent.
      let pageRes = null, evalErr = null;
      try {
        const body = pageSlice.replace(/^\s*"use strict";\s*$/m, '');
        const factory = new Function('emfAlternator', 'dFluxdTheta', 'fluxAtAngle', 'SCENE', 'COIL',
          body + '\n;return { XFMR, windingVoltage, primaryVoltage, secondaryVoltage, turnsRatio, secondaryCurrent, primaryCurrent, powerThrough, runSelfTest };');
        const Page = factory(Hall.emfAlternator, Hall.dFluxdTheta, Hall.fluxAtAngle, Hall.SCENE, Hall.COIL);
        pageRes = Page.runSelfTest();
        const sameForm =
          Page.secondaryVoltage(0.7, OM, 160) === Core.secondaryVoltage(0.7, OM, 160) &&
          Page.primaryVoltage(1.3, OM, 100) === Core.primaryVoltage(1.3, OM, 100) &&
          Page.turnsRatio(100, 50) === Core.turnsRatio(100, 50) &&
          Page.secondaryCurrent(2, 100, 50) === Core.secondaryCurrent(2, 100, 50) &&
          Page.XFMR.Np === Core.XFMR.Np && Page.XFMR.Ns === Core.XFMR.Ns;
        ok('(parity)★ page core formulas === module core formulas (voltage / ratio / current / XFMR identical)',
           sameForm, sameForm ? 'every shared formula returns the identical value (parent symbols injected)' : 'a formula drifted');
      } catch (e) { evalErr = e; }

      ok('inline core evaluates without error (parent symbols injected as factory args)', !evalErr, evalErr ? String(evalErr) : 'ok');
      if (pageRes){
        ok('(parity)★ inline core pass-count == module pass-count',
           pageRes.passed === moduleRes.passed && pageRes.total === moduleRes.total,
           `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleRes.passed}/${moduleRes.total}`);
        let agree = pageRes.checks.length === moduleRes.checks.length;
        for (let k = 0; agree && k < pageRes.checks.length; k++){
          if (pageRes.checks[k].pass !== moduleRes.checks[k].pass) agree = false;
          if (pageRes.checks[k].name !== moduleRes.checks[k].name) agree = false;
        }
        ok('(parity)★ every named row agrees row-for-row (page vs module)', agree,
           agree ? `all ${pageRes.checks.length} rows identical` : 'a row disagreed');
      }
    }
  }
}

// ── §PARENT INTEGRITY — the parents stay byte-untouched oracles ──────────────
console.log('\n— §PARENT INTEGRITY: the parent core resolves and its slab is inlined byte-true —');
{
  ok('(parent)★ Hall.SCENE && Hall.fluxAtAngle resolve (the parent oracle is importable)',
     !!Hall.SCENE && typeof Hall.fluxAtAngle === 'function' && typeof Hall.emfAlternator === 'function',
     'parent oracle symbols present');

  // the PARENT slab forge-inlined into the transformer's index.html must be
  // char-identical to ../core.mjs's slab (the page shares the SAME Φ oracle byte-true).
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const parentSrc = readFileSync(join(__dir, '..', 'core.mjs'), 'utf8');
  const LB = '// === LODESTONE-HALL CORE BEGIN ===', LE = '// === LODESTONE-HALL CORE END ===';
  const pi = html.indexOf(LB), pj = html.indexOf(LE);
  const mi = parentSrc.indexOf(LB), mj = parentSrc.indexOf(LE);
  const pageParent = pi >= 0 ? html.slice(pi, pj + LE.length) : '';
  const modParent  = parentSrc.slice(mi, mj + LE.length);
  ok('(parent)★ the parent slab inlined into index.html is char-identical to ../core.mjs (same Φ oracle, not a fork)',
     pageParent === modParent && pageParent.length > 0,
     pageParent === modParent ? `identical bytes (${modParent.length} chars)` : `DRIFT: page ${pageParent.length} vs module ${modParent.length}`);

  const hallRes = Hall.runSelfTest();
  ok('(parent)★ the parent Lodestone Hall self-test still passes (oracle untouched)',
     hallRes.ok, `${hallRes.passed}/${hallRes.total}`);
}

// ── §tally ────────────────────────────────────────────────────────────────────
console.log(`\n${pass}/${total} checks passed.`);
if (pass !== total){ console.error('FAIL — a Transformer assertion did not hold.'); process.exit(1); }
console.log('All Transformer cross-checks green. The turns ratio is exact; the page core === the module core; the parent stays a byte-untouched oracle.');
