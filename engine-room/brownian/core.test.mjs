// The Brownian Ratchet — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runCoreTests() at a far higher sample budget (tighter Poisson
//   σ → the NULL bites harder) AND — the integration crux — RE-EXTRACTS the inlined
//   core from index.html, evaluates it, and proves it is byte-for-byte the SAME core
//   (same pass-count, ok-for-ok) AND that its inlined carnotEfficiency() body is
//   char-for-char the imported carnotEfficiency.toString() (the "(0-teeth)" parity).
//   This matches the Demon's re-extraction precedent: page === module === sibling.
import * as Core from './core.mjs';
import { carnotEfficiency } from '../carnot/core.mjs';
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

console.log('The Engine Room · The Brownian Ratchet — Node cross-check\n');

// ── 1. the shared core self-test (identical to the in-page pill, MORE samples) ──
console.log('— shared runCoreTests() (same four claims the in-page pill runs; 4M steps, 8 seeds) —');
let moduleRes;
{
  moduleRes = Core.runCoreTests({ steps: 4_000_000, seeds: [1, 2, 3, 4, 5, 6, 7, 8] });
  for (const c of moduleRes.checks) ok(c.name, c.ok, c.info);
}

// ── 2. Node-only extensions: the null bites with 16 seeds; the tilt sweep is fine;
//       the ceiling grid is dense; the controls get many-seed nulls. ──────────────
console.log('\n— EXT (1): matched-temperature NULL, pooled z-score over 16 seeds —');
{
  // 16 independent seeds, pooled. The pooled mean must sit inside KSIG·(rms σ/√M).
  // We ALSO report the z-score |mean|/(σ_pooled) — it should be O(1), not blowing up.
  let allOk = true, worstZ = 0, worst = '';
  for (const T of [0.4, 0.6, 1.0, 1.3]) {
    let om = 0, sig2 = 0; const seeds = Array.from({ length: 16 }, (_, i) => i + 1);
    for (const s of seeds) {
      const r = Core.simulate({ Tg: T, Tp: T, tau: 0, a: 0.2, hasPawl: true, steps: 4_000_000, seed: s });
      om += r.omega; sig2 += r.sigmaOmega * r.sigmaOmega;
    }
    const mean = om / 16, pooled = Math.sqrt(sig2) / 16;
    const z = Math.abs(mean) / pooled;
    if (z > worstZ) worstZ = z;
    if (Math.abs(mean) > Core.KSIG * pooled) { allOk = false; worst = `T=${T}: |mean|=${Math.abs(mean).toExponential(2)} > ${Core.KSIG}·σ_pooled=${(Core.KSIG * pooled).toExponential(2)} (z=${z.toFixed(2)})`; }
  }
  ok('(1-ext)★ matched-T pooled mean inside KSIG band over 16 seeds (worst z-score O(1))',
     allOk, allOk ? `worst pooled z-score = ${worstZ.toFixed(2)} (≤ ${Core.KSIG})` : worst);
}

console.log('\n— EXT (2): 21-point fine ΔΘ sweep — monotone, single sign-flip exactly at ΔΘ=0 —');
{
  const Tbar = 0.6;
  const ds = Array.from({ length: 21 }, (_, i) => -0.4 + i * 0.04); // −0.4 … +0.4 step .04
  let monoOk = true, signOk = true, worst = '', prev = -Infinity, flips = 0, prevSign = null;
  const seeds = [1, 2, 3, 4, 5, 6];
  for (const d of ds) {
    const dd = Math.abs(d) < 1e-9 ? 0 : d;            // snap the −0/+0 ulp to a clean 0
    const Tg = Tbar + dd / 2, Tp = Tbar - dd / 2;
    const c = Core.compute({ Tg, Tp, load: 0, a: 0.2, hasPawl: true, steps: 4_000_000, seeds });
    if (c.omega < prev - Core.KSIG * c.omegaSigma) { monoOk = false; worst = `mono broke @ ΔΘ=${dd.toFixed(2)}`; }
    prev = c.omega;
    // count sign changes only where clearly out of noise
    if (Math.abs(c.omega) > Core.KSIG * c.omegaSigma) {
      const sg = Math.sign(c.omega);
      if (sg !== Math.sign(dd) && dd !== 0) { signOk = false; worst = `sign mismatch @ ΔΘ=${dd.toFixed(2)}`; }
      if (prevSign !== null && sg !== prevSign) flips++;
      prevSign = sg;
    }
  }
  ok('(2-ext)★ 21-pt ΔΘ sweep: monotone, sign(ω)==sign(ΔΘ), exactly one sign flip (across 0)',
     monoOk && signOk && flips === 1, (monoOk && signOk && flips === 1) ? `monotone, ${flips} flip (at the origin)` : `${worst} (flips=${flips})`);
}

console.log('\n— EXT (3): dense Carnot-ceiling grid — η ≤ ceiling everywhere, never crosses —');
{
  let anyCross = false, maxRatio = 0, worst = '';
  for (let Tg = 0.4; Tg <= 1.2 + 1e-9; Tg += 0.1) {
    for (let Tp = 0.1; Tp < Tg - 0.02; Tp += 0.1) {
      const tgr = +Tg.toFixed(2), tpr = +Tp.toFixed(2);
      const stall = Core.stallLoad(tgr, tpr, 0.2);
      for (const frac of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
        const c = Core.compute({ Tg: tgr, Tp: tpr, load: frac * stall, a: 0.2, steps: 1_000_000, seeds: [1, 2, 3, 4] });
        if (c.eta != null && c.etaCeil > 0) {
          if (c.eta > c.etaCeil + 5e-3) { anyCross = true; worst = `Tg=${tgr} Tp=${tpr} frac=${frac}: η=${c.eta.toFixed(4)} > ceil ${c.etaCeil.toFixed(4)}`; }
          // the imported ceiling must equal the scale-cancelling 1−Θp/Θg
          if (Math.abs(c.etaCeil - (1 - tpr / tgr)) > 1e-9) { anyCross = true; worst = `etaCeil != 1−Θp/Θg @ Tg=${tgr} Tp=${tpr}`; }
          maxRatio = Math.max(maxRatio, c.eta / c.etaCeil);
        }
      }
    }
  }
  ok('(3-ext)★ η ≤ Carnot ceiling over the whole (Θg>Θp, load) grid — never crossed',
     !anyCross, !anyCross ? `closest approach η/ceiling = ${maxRatio.toFixed(3)} (the ratchet is deeply irreversible — Carnot is a loose wall it never kisses)` : worst);
}

console.log('\n— EXT (4): many-seed negative controls — symmetric wheel AND no-pawl both null —');
{
  const seeds16 = Array.from({ length: 16 }, (_, i) => i + 1);
  // 4a: a=0.5 under a STRONG ΔΘ, 16 seeds
  const sym = Core.compute({ Tg: 1.2, Tp: 0.3, load: 0, a: 0.5, hasPawl: true, steps: 4_000_000, seeds: seeds16 });
  const ok4a = Math.abs(sym.omega) <= Core.KSIG * sym.omegaSigma;
  // 4b: no pawl, 16 seeds
  const nop = Core.compute({ Tg: 1.2, Tp: 0.3, load: 0, a: 0.2, hasPawl: false, steps: 4_000_000, seeds: seeds16 });
  const ok4b = Math.abs(nop.omega) <= Core.KSIG * nop.omegaSigma;
  ok('(4-ext)★ symmetric-wheel (a=0.5) AND no-pawl both null under strong ΔΘ over 16 seeds',
     ok4a && ok4b, `4a |ω|=${Math.abs(sym.omega).toExponential(2)} ≤ ${(Core.KSIG * sym.omegaSigma).toExponential(2)} · 4b |ω|=${Math.abs(nop.omega).toExponential(2)} ≤ ${(Core.KSIG * nop.omegaSigma).toExponential(2)}`);
}

console.log('\n— EXT (det): determinism — identical args ⇒ byte-identical omega & net —');
{
  const a = Core.simulate({ Tg: 0.9, Tp: 0.5, tau: 0.05, a: 0.2, steps: 500_000, seed: 42 });
  const b = Core.simulate({ Tg: 0.9, Tp: 0.5, tau: 0.05, a: 0.2, steps: 500_000, seed: 42 });
  ok('(det) seeded MC is byte-deterministic (same args twice ⇒ same omega & net)',
     a.omega === b.omega && a.net === b.net, `omega=${a.omega.toExponential(6)} net=${a.net} (×2 identical)`);
}

// ── 3. THE RE-EXTRACTION PARITY HARNESS (the integration crux) ────────────────
//   Read index.html, slice the inline core between the banner sentinels, strip the
//   import line (the page inlines carnotEfficiency() verbatim under the banner),
//   evaluate the slice to get ITS runCoreTests, run it, and assert (i) same pass-
//   count & ok-for-ok as the module, (ii) the inline carnotEfficiency() body is
//   char-for-char the imported carnotEfficiency.toString().
console.log('\n— RE-EXTRACTION PARITY: the page core === the module === the sibling —');
{
  const html = readFileSync(join(__dir, 'index.html'), 'utf8');
  const BEGIN = '// ===== BROWNIAN CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== BROWNIAN CORE END =====';
  const i = html.indexOf(BEGIN), j = html.indexOf(END);
  ok('inline-core banner sentinels present in index.html', i >= 0 && j > i,
     i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS');

  if (i >= 0 && j > i) {
    const slice = html.slice(i + BEGIN.length, j);

    // (a) the inline carnotEfficiency() body must be char-for-char the imported one.
    const pageCarnot = extractFn(slice, 'carnotEfficiency');
    const importedCarnot = carnotEfficiency.toString();
    const norm = s => s.replace(/^export\s+/, '').trim();
    ok('(0-teeth)★ inline carnotEfficiency() body is char-for-char the imported carnotEfficiency.toString()',
       norm(pageCarnot) === norm(importedCarnot),
       norm(pageCarnot) === norm(importedCarnot) ? 'identical bytes' :
       `DRIFT:\n  page: ${JSON.stringify(norm(pageCarnot).slice(0, 90))}\n  mod:  ${JSON.stringify(norm(importedCarnot).slice(0, 90))}`);

    // (b) evaluate the slice and run ITS runCoreTests → same pass-count & ok-for-ok.
    //     The page can't ES-import, so the slice already inlines carnotEfficiency().
    //     Run BOTH the page slice and the module at the SAME small budget so the
    //     stochastic checks compare like-for-like.
    let pageRes = null, evalErr = null;
    const SMALL = { steps: 300_000, seeds: [1, 2, 3] };
    let moduleSmall = Core.runCoreTests(SMALL);
    try {
      const factory = new Function(slice + '\n;return { runCoreTests, simulate, compute, ratchetRates, symmetricRates, stallLoad, KSIG };');
      const PageCore = factory();
      pageRes = PageCore.runCoreTests(SMALL);
    } catch (e) { evalErr = e; }

    ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
    if (pageRes) {
      ok('(parity)★ inline core pass-count == module pass-count (same small budget)',
         pageRes.passed === moduleSmall.passed && pageRes.total === moduleSmall.total,
         `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleSmall.passed}/${moduleSmall.total}`);
      let agree = pageRes.checks.length === moduleSmall.checks.length;
      for (let k = 0; agree && k < pageRes.checks.length; k++) {
        if (pageRes.checks[k].ok !== moduleSmall.checks[k].ok) agree = false;
      }
      ok('(parity)★ every named claim agrees ok-for-ok (page vs module)', agree,
         agree ? `all ${pageRes.checks.length} claims identical` : 'a claim disagreed');

      // the deterministic re-extracted core must also reproduce the module's exact
      // omega for a fixed (seeded) run — the page's simulate IS the module's simulate.
      const pageSim = (new Function(slice + '\n;return simulate;'))()({ Tg: 0.9, Tp: 0.5, tau: 0.05, a: 0.2, steps: 200_000, seed: 9 });
      const modSim = Core.simulate({ Tg: 0.9, Tp: 0.5, tau: 0.05, a: 0.2, steps: 200_000, seed: 9 });
      ok('(parity)★ re-extracted simulate() reproduces the module omega byte-for-byte',
         pageSim.omega === modSim.omega && pageSim.net === modSim.net,
         `page ω=${pageSim.omega.toExponential(6)} == module ω=${modSim.omega.toExponential(6)}`);

      console.log(`\n  ▸ RECORDED: in-page ${pageRes.passed}/${pageRes.total} · Node module (4M/8-seed) ${moduleRes.passed}/${moduleRes.total}`);
    }
  }
}

// extract `function NAME(...) { ... }` with brace-matching from a source string.
function extractFn(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(');
  const m = re.exec(src);
  if (!m) return '';
  let i = src.indexOf('{', m.index);
  if (i < 0) return '';
  let depth = 0, k = i;
  for (; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return src.slice(m.index, k);
}

console.log(`\n${pass}/${total} ${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === total ? 0 : 1);
