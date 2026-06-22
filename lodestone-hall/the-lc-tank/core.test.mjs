// The LC Tank — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() (identical to the in-page pill), re-proves each of
//   the five rows independently over DENSER sweeps, asserts the core is a FRESH
//   self-contained spine (§anti-circularity: no import, re-types its OWN ODE, names
//   its honest cousin resonance), and RE-EXTRACTS the inlined slab from index.html to
//   prove the page core === the module core — evaluated with NO injection (the slab is
//   self-contained, THE divergence from the transformer whose slice referenced the
//   parent). Exits 0 only when all hold.
import * as Core from './core.mjs';        // the LC-tank closed-form authority
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

console.log('The Lodestone Hall · The LC Tank — Node cross-check\n');
const { LC, omega, period, periodT, qClosed, iClosed, energyE, energyM, energyOf, energyTotal, deriv, rk4Step, trace } = Core;

// ── §0. the shared self-test (identical to the in-page pill) ─────────────────
console.log('— §0 shared runSelfTest() (the SAME assertions the in-page pill runs) —');
const moduleRes = Core.runSelfTest();
for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);

// ── §1 PERIOD === 2π√(LC), two independent ways, over a DENSER L×C sweep ──────
console.log('\n— §1: period === 2π√(LC) (analytic + measured zero-crossing), denser sweep —');
{
  let worstA = 0, worstM = 0, where = '';
  const LS = [0.25, 0.4, 0.6, 1, 1.7, 2.5, 4], CS = [0.25, 0.4, 0.7, 1, 1.5, 3, 4];
  for (const L of LS) for (const C of CS) {
    const T = period(L, C);
    worstA = Math.max(worstA, Math.abs(T - 2 * Math.PI * Math.sqrt(L * C)));
    worstA = Math.max(worstA, Math.abs(periodT(L, C) - T));   // alias === canonical
    // measured: linear-interp zero crossings of the closed-form q
    const dt = T / 5000, cross = [];
    let prev = qClosed(0, L, C);
    for (let k = 1; k <= 8000 && cross.length < 3; k++) {
      const t = k * dt, cur = qClosed(t, L, C);
      if ((prev <= 0 && cur > 0) || (prev >= 0 && cur < 0)) {
        cross.push((k - 1) * dt + dt * (0 - prev) / (cur - prev));
      }
      prev = cur;
    }
    const measured = cross.length >= 3 ? cross[2] - cross[0] : Infinity;
    const d = Math.abs(measured - T);
    if (d > worstM) { worstM = d; where = `L=${L} C=${C}`; }
  }
  ok('(period)★ analytic period() === 2π√(LC) AND periodT alias === canonical, <1e-9',
     worstA < 1e-9, `worst |Δ| ${worstA.toExponential(2)}`);
  ok('(period)★ MEASURED zero-crossing period of the closed form === 2π√(LC), <1e-9',
     worstM < 1e-9, `worst |measured−T| ${worstM.toExponential(2)} @ ${where}`);
}

// ── §2 CLOSED FORM === INTEGRATED ODE at R=0 over MANY periods, denser sweep ──
console.log('\n— §2: closed form === integrated ODE at R=0 (rk4 vs qClosed/iClosed) —');
{
  let worst = 0, where = '';
  const LS = [0.25, 0.5, 1, 2, 4], CS = [0.25, 0.6, 1, 1.8, 4];
  for (const L of LS) for (const C of CS) {
    const T = period(L, C), perCycle = 1440, h = T / perCycle, nP = 10;
    let s = [LC.Q0, 0];
    for (let k = 1; k <= nP * perCycle; k++) {
      s = rk4Step(s, h, L, C, 0);
      const t = k * h;
      const d = Math.max(Math.abs(s[0] - qClosed(t, L, C)), Math.abs(s[1] - iClosed(t, L, C)));
      if (d > worst) { worst = d; where = `L=${L} C=${C}`; }
    }
  }
  ok('(closed===ode)★ rk4 from (Q0,0) === qClosed/iClosed over 10 periods, max(|Δq|,|Δi|) <1e-9',
     worst < 1e-9, `worst ${worst.toExponential(2)} @ ${where}`);
}

// ── §3 ENERGY FLAT at R=0 (the flat-sum line) over a denser sweep + longer span ─
console.log('\n— §3: energy FLAT at R=0 — ½q²/C + ½Li² holds dead constant —');
{
  let worst = 0, where = '';
  const LS = [0.25, 0.5, 1, 2, 4], CS = [0.25, 0.5, 1, 2, 4];
  for (const L of LS) for (const C of CS) {
    const sp = trace(L, C, 0, 40).spread;   // longer span: 40 periods
    if (sp > worst) { worst = sp; where = `L=${L} C=${C}`; }
  }
  ok('(flat-sum)★ trace(L,C,0,40).spread (eMax−eMin)/E0 <1e-9 across the sweep',
     worst < 1e-9, `worst spread ${worst.toExponential(2)} @ ${where}`);
}

// ── §4 NEG-CONTROL: R>0 strictly decays vs R=0 flat — the CONTRAST, denser R ───
console.log('\n— §4: NEG-CONTROL — R>0 energy strictly DECAYS while R=0 holds FLAT —');
{
  let decayOk = true, flatOk = true, worstEnd = 0, worstFlat = 0, anyUptick = false;
  for (const R of [0.01, 0.05, 0.1, 0.3, 0.6]) {
    for (const [L, C] of [[1, 1], [0.5, 2], [2, 0.5], [4, 4]]) {
      const damped = trace(L, C, R, 25);
      const lossless = trace(L, C, 0, 25);
      if (!damped.monotoneDown) anyUptick = true;
      const drains = damped.eEnd < damped.E0 * (1 - 1e-6);
      const noClimb = damped.eMaxPost <= damped.E0 + 1e-12;
      decayOk = decayOk && damped.monotoneDown && drains && noClimb;
      flatOk = flatOk && lossless.spread < 1e-9;
      worstEnd = Math.max(worstEnd, damped.eEnd / damped.E0);
      worstFlat = Math.max(worstFlat, lossless.spread);
    }
  }
  ok('(neg-control)★ R>0: monotone-down, never climbs above E0, span drains (eEnd<E0·(1−1e-6))',
     decayOk && !anyUptick, `worst eEnd/E0 ${worstEnd.toExponential(3)} (no up-tick: ${!anyUptick})`);
  ok('(neg-control)★ R=0 SAME sweep holds FLAT (spread<1e-9) — the contrast is the assertion',
     flatOk, `worst R=0 spread ${worstFlat.toExponential(2)}`);
}

// ── §5 QUARTER-PHASE: |i| at q-extrema ≈0, |q| at i-extrema ≈0, never both lit ─
console.log('\n— §5: QUARTER-PHASE — charge and current a quarter cycle apart, never both lit —');
{
  let worstQ = 0, worstI = 0, bothBright = 0;
  const LS = [0.25, 0.5, 1, 2, 4], CS = [0.3, 0.7, 1, 2.2, 4];
  for (const L of LS) for (const C of CS) {
    const w = omega(L, C), Imax = w * LC.Q0;
    for (let n = 0; n < 10; n++) {
      worstQ = Math.max(worstQ, Math.abs(iClosed(n * Math.PI / w, L, C)));
      worstI = Math.max(worstI, Math.abs(qClosed((n + 0.5) * Math.PI / w, L, C)));
    }
    const T = period(L, C);
    for (let k = 0; k <= 1000; k++) {
      const t = T * k / 1000;
      bothBright = Math.max(bothBright, (Math.abs(qClosed(t, L, C)) / LC.Q0) * (Math.abs(iClosed(t, L, C)) / Imax));
    }
  }
  ok('(quarter-phase)★ |i| at every q-extremum <1e-9 AND |q| at every i-extremum <1e-9',
     worstQ < 1e-9 && worstI < 1e-9, `|i|@q-ext ${worstQ.toExponential(2)}, |q|@i-ext ${worstI.toExponential(2)}`);
  ok('(quarter-phase)★ never both lit: max |q̂·î| ≤ 0.5+ε (structural via |cos·sin|)',
     bothBright <= 0.5 + 1e-9, `max |q̂·î| ${bothBright.toFixed(6)}`);
}

// ── §6 ENERGY-ORACLE consistency: the split terms === the sum, the alias === the
//      oracle, and the sum at R=0 reads exactly ½Q0²/C (all energy electric at boot) ─
console.log('\n— §6: energy oracle — split terms === sum, alias === oracle, boot energy = ½Q0²/C —');
{
  let worstSplit = 0, worstAlias = 0, worstBoot = 0;
  const LS = [0.25, 1, 3], CS = [0.4, 1, 2.5], TS = [0, 0.3, 1.1, 2.7, 5.0];
  for (const L of LS) for (const C of CS) for (const t of TS) {
    const q = qClosed(t, L, C), i = iClosed(t, L, C);
    worstSplit = Math.max(worstSplit, Math.abs((energyE(q, C) + energyM(i, L)) - energyOf(q, i, L, C)));
    worstAlias = Math.max(worstAlias, Math.abs(energyTotal(q, i, L, C) - energyOf(q, i, L, C)));
    worstBoot = Math.max(worstBoot, Math.abs(energyOf(qClosed(0, L, C), iClosed(0, L, C), L, C) - 0.5 * LC.Q0 * LC.Q0 / C));
  }
  ok('(energy)★ energyE+energyM === energyOf AND energyTotal alias === energyOf, exact',
     worstSplit === 0 && worstAlias === 0, `worst split Δ ${worstSplit}, alias Δ ${worstAlias}`);
  ok('(energy)★ at boot (t=0) all energy is electric: energyOf === ½Q0²/C, <1e-12',
     worstBoot < 1e-12, `worst Δ ${worstBoot.toExponential(2)}`);
}

// ── §ANTI-CIRCULARITY — the core is a FRESH self-contained spine, not a fork ──
console.log('\n— §ANTI-CIRCULARITY: a fresh spine — NO import, re-types its OWN ODE, names its honest cousin —');
{
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const B = '// === LC-TANK CORE BEGIN ===', E = '// === LC-TANK CORE END ===';
  const slice = mod.slice(mod.indexOf(B), mod.indexOf(E) + E.length);
  // (a) the slab imports NOTHING (self-contained), and the WHOLE module never reaches
  //     up to a parent core — a fresh spine, not a fork.
  const noImportInSlab = !/^[ \t]*import\b/m.test(slice);
  const noParentImport = !/from\s+['"]\.\.\//.test(mod) && !/import\b/.test(slice);
  ok('(anti-circ)★ the LC-tank slab contains NO import and never reaches to a parent core',
     noImportInSlab && noParentImport, `no import in slab: ${noImportInSlab}, no ../ parent import: ${noParentImport}`);
  // (b) the slab RE-TYPES its own ODE (the damped-oscillator deriv is present verbatim)
  const reTypesOde = /-\s*\(R\s*\/\s*L\)\s*\*\s*s\[1\]\s*-\s*s\[0\]\s*\/\s*\(L\s*\*\s*C\)/.test(slice);
  ok('(anti-circ)★ the slab re-types its OWN undriven-damped ODE  q\'=i; i\'=−(R/L)i − q/(LC)',
     reTypesOde, reTypesOde ? 'the deriv is present verbatim in the slab' : 'ODE NOT found in slab');
  // (c) the header NAMES the honest cousin (resonance) so a reader can find the kinship
  const namesCousin = /resonance/.test(mod);
  ok('(anti-circ)★ the header names its honest cousin (resonance — same ODE family, but DRIVEN)',
     namesCousin, namesCousin ? 'header references resonance' : 'cousin NOT named');
  // (d) NO drive/forcing term in the deriv — this is the UNDRIVEN free tank. The deriv
  //     RHS is exactly the two homogeneous terms; a +F/L or +cos(Ω t)/L forcing term
  //     would make it the resonance core, not ours. We isolate the deriv line and
  //     assert i' has NO additive term beyond the damping and restoring terms — and,
  //     structurally, that the R=0 trace conserves energy (a drive term could NOT).
  const derivLine = (slice.match(/const deriv\s*=.*$/m) || [''])[0];
  const rhs = (derivLine.match(/\[\s*s\[1\]\s*,([^\]]*)\]/) || ['', ''])[1];   // the i' expression
  const noForcing = !/\+\s*[A-Za-z_]\w*\s*\/\s*L\b/.test(rhs) && !/cos|sin/i.test(rhs);  // no +F/L, no forcing trig
  const r0Conserves = trace(1, 1, 0, 40).spread < 1e-9;                          // a drive term could not conserve
  ok('(anti-circ)★ NO drive/forcing term in the deriv — the UNDRIVEN free tank (and R=0 conserves energy)',
     noForcing && r0Conserves, `deriv i\' has no +F/L or forcing trig: ${noForcing}; R=0 spread <1e-9: ${r0Conserves}`);
}

// ── §BYTE-TWIN PARITY — re-extract the LC-tank slice from index.html, assert
//    char-identical to core.mjs's slice, then EVAL it with NO injection (self-contained) ─
console.log('\n— §BYTE-TWIN PARITY: page core === module core, evaluated with NO injection (self-contained slab) —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { ok('index.html present (forge built it)', false, 'MISSING — run: node tools/forge/forge.mjs lodestone-hall/the-lc-tank/index.src.html'); }

  if (html) {
    const B = '// === LC-TANK CORE BEGIN ===', E = '// === LC-TANK CORE END ===';
    const i = html.indexOf(B), j = html.indexOf(E);
    ok('inline LC-tank sentinels present in index.html', i >= 0 && j > i,
       i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS — has forge built index.html?');

    if (i >= 0 && j > i) {
      const pageSlice = html.slice(i, j + E.length);
      const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
      const modSlice = mod.slice(mod.indexOf(B), mod.indexOf(E) + E.length);

      ok('(0-teeth)★ inline LC-tank slice (BEGIN..END) is char-for-char the module body',
         pageSlice === modSlice,
         pageSlice === modSlice ? `identical bytes (${modSlice.length} chars)`
         : `DRIFT: page ${pageSlice.length} vs module ${modSlice.length} chars`);

      ok('the inline slice contains no forge directive leakage',
         !/forge:include/.test(pageSlice), 'core slice is pure — no include leaked into the byte-twin');

      // EVAL the slice (no export block inside the sentinels) with NO injection — the
      // slab is self-contained, so a bare new Function(body + return {...}) suffices.
      let pageRes = null, evalErr = null, Page = null;
      try {
        const body = pageSlice.replace(/^\s*"use strict";\s*$/m, '');
        const factory = new Function(
          body + '\n;return { LC, omega, period, periodT, qClosed, iClosed, energyE, energyM, energyOf, energyTotal, deriv, rk4Step, trace, runSelfTest };');
        Page = factory();
        pageRes = Page.runSelfTest();
        const sameForm =
          Page.period(1.7, 2.3) === Core.period(1.7, 2.3) &&
          Page.omega(0.5, 4) === Core.omega(0.5, 4) &&
          Page.qClosed(1.3, 1.7, 2.3) === Core.qClosed(1.3, 1.7, 2.3) &&
          Page.iClosed(1.3, 1.7, 2.3) === Core.iClosed(1.3, 1.7, 2.3) &&
          Page.energyOf(0.4, 0.2, 1.7, 2.3) === Core.energyOf(0.4, 0.2, 1.7, 2.3) &&
          Page.LC.Q0 === Core.LC.Q0 && Page.LC.R_max === Core.LC.R_max;
        ok('(parity)★ page core formulas === module core formulas (period/omega/qClosed/iClosed/energyOf/LC identical)',
           sameForm, sameForm ? 'every shared formula returns the identical value (no injection)' : 'a formula drifted');
      } catch (e) { evalErr = e; }

      ok('inline core evaluates without error (NO injection — self-contained slab)', !evalErr, evalErr ? String(evalErr) : 'ok');
      if (pageRes) {
        ok('(parity)★ inline core pass-count == module pass-count',
           pageRes.passed === moduleRes.passed && pageRes.total === moduleRes.total,
           `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleRes.passed}/${moduleRes.total}`);
        let agree = pageRes.checks.length === moduleRes.checks.length;
        for (let k = 0; agree && k < pageRes.checks.length; k++) {
          if (pageRes.checks[k].pass !== moduleRes.checks[k].pass) agree = false;
          if (pageRes.checks[k].name !== moduleRes.checks[k].name) agree = false;
        }
        ok('(parity)★ every named row agrees row-for-row (page vs module)', agree,
           agree ? `all ${pageRes.checks.length} rows identical` : 'a row disagreed');
      }
    }
  }
}

// ── §tally ────────────────────────────────────────────────────────────────────
console.log(`\n${pass}/${total} checks passed.`);
if (pass !== total) { console.error('FAIL — an LC Tank assertion did not hold.'); process.exit(1); }
console.log('All LC Tank cross-checks green. The period is exact, the energy holds, R damps it, and the page core === the module core — a fresh self-contained spine.');
