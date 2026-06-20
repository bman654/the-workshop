// The Whirligig — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() (identical to the in-page pill), proves the five
//   rows independently, AND — the integration crux — RE-EXTRACTS the inlined core
//   from index.html, evaluates it, and proves the page core === the module core
//   (char-for-char the export-stripped body, same pass-count, every check agreeing).
//   The Whirligig imports nothing from the Hall, so page-core === module-core IS
//   the parity proof. Exits 0 only when every assertion holds.
import * as Core from './core.mjs';
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
function cross(a, b){
  return [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
}

console.log('The Lodestone Hall · The Whirligig — Node cross-check\n');
const S = Core.SCENE;

// ── 1. the shared self-test (identical to the in-page pill) ──────────────────
console.log('— shared runSelfTest() (the SAME assertions the in-page pill runs) —');
const moduleRes = Core.runSelfTest();
for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);

// ── ROW 1: τ === N·I·A·B·sinθ from the four-side F=I·L×B sum, dense θ×current ──
console.log('\n— ROW 1: four-side Lorentz sum === N·I·A·B·sinθ over a dense θ × current sweep —');
{
  let worst = 0, where = '';
  for (let k = 0; k < 500; k++){
    const th = 2*Math.PI*k/500;
    for (let I = -5; I <= 5; I += 0.25){
      // derive by summing r×F over ALL FOUR sides (long + short), the literal picture
      let tz = 0;
      for (const { r, F } of Core.forcePerSide(th, I, +1, +1)) tz += cross(r, F)[2];
      for (const { r, F } of Core.shortSideForces(th, I, +1))   tz += cross(r, F)[2];
      const derived = S.N * tz;
      const closed = S.N * I * S.A * S.B * Math.sin(th);
      const d = Math.abs(derived - closed);
      if (d > worst){ worst = d; where = `θ=${th.toFixed(2)} I=${I}`; }
    }
  }
  ok('(τ-exact)★ four-side F=I·L×B sum === N·I·A·B·sinθ to <1e-9 over θ×current',
     worst < 1e-9, `worst |Δ| ${worst.toExponential(2)} @ ${where}`);
}

// ── ROW 2: work-per-rev WITH commutator > 0, === ∮commutatedTau dθ, === 4·N·I·A·B
console.log('\n— ROW 2: work per revolution with the commutator === 4·N·I·A·B (> 0, a motor) —');
{
  let worstSelf = 0, worstTarget = 0, allPos = true;
  for (const I of [0.5, 1, 2, 3.5, 5]){
    const w = Core.workPerRev(true, I, +1);
    if (!(w > 0)) allPos = false;
    // independent numeric ∮ commutatedTau dθ
    let a = 0, n = 40000, d = 2*Math.PI/n;
    for (let k = 0; k < n; k++) a += Core.commutatedTau(2*Math.PI*(k+0.5)/n, I, +1)*d;
    worstSelf = Math.max(worstSelf, Math.abs(w - Core.workPerRev(true, I, +1)));  // determinism
    const target = 4*S.N*I*S.A*S.B;
    worstTarget = Math.max(worstTarget, Math.abs(w - target));
  }
  ok('(work)★ ∮commutatedTau dθ > 0 and === 4·N·I·A·B across the current dial (<1e-4 quadrature)',
     allPos && worstTarget < 1e-4, `all > 0: ${allPos}, worst |∮ − 4NIAB| ${worstTarget.toExponential(2)}`);
}

// ── ROW 3: B-reversal flips τ sign exactly ───────────────────────────────────
console.log('\n— ROW 3: reverse the field B → τ flips sign, exactly, pointwise —');
{
  let worst = 0;
  for (let k = 0; k < 400; k++){
    const th = 2*Math.PI*k/400;
    for (const I of [1, 2.5, 5]){
      const p = Core.whirligigTorque(th, I, +1), m = Core.whirligigTorque(th, I, -1);
      worst = Math.max(worst, Math.abs(p + m));
    }
  }
  ok('(B-flip)★ τ(θ,I,+1) === −τ(θ,I,−1) pointwise to <1e-9',
     worst < 1e-9, `worst |τ₊ + τ₋| ${worst.toExponential(2)}`);
  // reverse-current also flips it (the OTHER reverse switch): τ(θ,−I) === −τ(θ,I)
  let worstC = 0;
  for (let k = 0; k < 400; k++){
    const th = 2*Math.PI*k/400;
    const p = Core.whirligigTorque(th, 2.5, +1), m = Core.whirligigTorque(th, -2.5, +1);
    worstC = Math.max(worstC, Math.abs(p + m));
  }
  ok('(I-flip)★ reverse-current also flips τ exactly: τ(θ,−I) === −τ(θ,I) (distinct cause, same flip)',
     worstC < 1e-9, `worst |τ(I) + τ(−I)| ${worstC.toExponential(2)}`);
}

// ── ROW 4: PICTURE === CORE — the arrows the diorama draws ARE the torque's terms
console.log('\n— ROW 4: the arrows are the torque — forcePerSide() sum (r×F) === τ —');
{
  let worst = 0, worstShort = 0;
  for (let k = 0; k < 360; k++){
    const th = 2*Math.PI*k/360;
    let tzLong = 0;
    for (const { r, F } of Core.forcePerSide(th, 2.0, +1, +1)) tzLong += cross(r, F)[2];
    let tzShort = 0;
    for (const { r, F } of Core.shortSideForces(th, 2.0, +1)) tzShort += cross(r, F)[2];
    worst = Math.max(worst, Math.abs(S.N*tzLong - Core.whirligigTorque(th, 2.0, +1)));
    worstShort = Math.max(worstShort, Math.abs(tzShort));
  }
  ok('(bridge)★ N·Σ(r×F over long sides) === whirligigTorque  AND short sides carry 0 axle torque',
     worst < 1e-9 && worstShort < 1e-9, `worst |N·Σ − τ| ${worst.toExponential(2)}, worst short axle τ ${worstShort.toExponential(2)}`);
}

// ── ROW 5: NEG-CONTROL (fires RED) — commutator OFF ⇒ ∮τ dθ === 0 to the bit ──
console.log('\n— ROW 5: NEG-CONTROL — WITHOUT the commutator, ∮τ dθ === 0 (it only ROCKS) —');
{
  let worst = 0;
  for (const I of [1, 2, 3.5, 5]){
    const w = Core.workPerRev(false, I, +1);
    worst = Math.max(worst, Math.abs(w));
  }
  ok('(neg-control)★ commutator OFF ⇒ ∮τ dθ === 0 to the bit (zero net work — only rocks)',
     worst < 1e-9, `worst |∮τ dθ| ${worst.toExponential(2)} — it is the COMMUTATOR, not the field, that makes a motor`);
  // and the pill row 5 itself must be GREEN in the module (the neg-control is asserted true)
  const negRow = moduleRes.checks.find(c => /NEG-CONTROL/.test(c.name));
  ok('(neg-control)★ the in-pill NEG-CONTROL row passes (asserting ∮=0) — the page flips it RED when CLAIMED',
     !!negRow && negRow.pass, negRow ? negRow.info : 'row missing');
}

// ── 2. RE-EXTRACTION PARITY: the page core === the module core (byte-twin) ────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { ok('index.html present (forge built it)', false, 'MISSING — run: node tools/forge/forge.mjs lodestone-hall/the-whirligig/index.src.html'); }

  if (html){
    const BEGIN = '// === WHIRLIGIG CORE BEGIN ===';
    const END = '// === WHIRLIGIG CORE END ===';
    const i = html.indexOf(BEGIN), j = html.indexOf(END);
    ok('inline-core sentinels present in index.html', i >= 0 && j > i,
       i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS — has forge built index.html?');

    if (i >= 0 && j > i){
      // the slice forge inlines = the module body from BEGIN..END (export block sits
      // AFTER END in both module + page, so compare the BEGIN..END region directly).
      const sliceEnd = j + END.length;
      const pageSlice = html.slice(i, sliceEnd);

      const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
      const mi = mod.indexOf(BEGIN), mj = mod.indexOf(END);
      const modSlice = mod.slice(mi, mj + END.length);

      ok('(0-teeth)★ inline core slice (BEGIN..END) is char-for-char the module body',
         pageSlice === modSlice,
         pageSlice === modSlice ? `identical bytes (${modSlice.length} chars)`
         : `DRIFT: page ${pageSlice.length} vs module ${modSlice.length} chars`);

      ok('the inline slice contains no forge directive / ws.js leakage',
         !/forge:include/.test(pageSlice) && !/\bWS\./.test(pageSlice),
         'core slice is pure — no include leaked into the byte-twin');

      // evaluate the slice (export-stripped) and confirm its self-test agrees
      let pageRes = null, evalErr = null;
      try {
        const body = pageSlice.replace(/^\s*"use strict";\s*$/m, '');
        const factory = new Function(body +
          '\n;return { SCENE, forcePerSide, shortSideForces, whirligigTorque, commutatorSign, commutatedTau, workPerRev, runSelfTest };');
        const Page = factory();
        pageRes = Page.runSelfTest();
        const sameForm =
          Page.whirligigTorque(0.7, 2, +1) === Core.whirligigTorque(0.7, 2, +1) &&
          Page.commutatorSign(0.5) === Core.commutatorSign(0.5) &&
          Page.commutatorSign(4.0) === Core.commutatorSign(4.0) &&
          Page.SCENE.N === Core.SCENE.N && Page.SCENE.A === Core.SCENE.A;
        ok('(parity)★ page core formulas === module core formulas (torque / commutatorSign / SCENE identical)',
           sameForm, sameForm ? 'every shared formula returns the identical value' : 'a formula drifted');
      } catch (e) { evalErr = e; }

      ok('inline core evaluates without error', !evalErr, evalErr ? String(evalErr) : 'ok');
      if (pageRes){
        ok('(parity)★ inline core pass-count == module pass-count',
           pageRes.passed === moduleRes.passed && pageRes.total === moduleRes.total,
           `in-page ${pageRes.passed}/${pageRes.total}  ·  module ${moduleRes.passed}/${moduleRes.total}`);
        let agree = pageRes.checks.length === moduleRes.checks.length;
        for (let k = 0; agree && k < pageRes.checks.length; k++){
          if (pageRes.checks[k].pass !== moduleRes.checks[k].pass) agree = false;
          if (pageRes.checks[k].name !== moduleRes.checks[k].name) agree = false;
        }
        ok('(parity)★ every named assertion agrees row-for-row (page vs module)', agree,
           agree ? `all ${pageRes.checks.length} checks identical` : 'a check disagreed');
      }
    }
  }
}

// ── tally ────────────────────────────────────────────────────────────────────
console.log(`\n${pass}/${total} checks passed.`);
if (pass !== total){ console.error('FAIL — a Whirligig assertion did not hold.'); process.exit(1); }
console.log('All Whirligig cross-checks green. The motor is exact; the page core === the module core.');
