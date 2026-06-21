// The Wire That Jumps — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() (identical to the in-page pill), proves the five
//   rows independently over an I × θ × B-sign grid, AND — the integration crux —
//   RE-EXTRACTS the inlined core from index.html, evaluates it, and proves the
//   page core === the module core (char-for-char the export-stripped body, same
//   pass-count, every check agreeing). The Wire That Jumps imports nothing from
//   the Hall, so page-core === module-core IS the parity proof. Exits 0 only when
//   every assertion holds.
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
function norm(a){ return Math.hypot(a[0], a[1], a[2]); }
function dot(a, b){ return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }

console.log('The Lodestone Hall · The Wire That Jumps — Node cross-check\n');
const S = Core.SCENE;
const HALF_PI = Math.PI/2;

// ── 1. the shared self-test (identical to the in-page pill) ──────────────────
console.log('— shared runSelfTest() (the SAME assertions the in-page pill runs) —');
const moduleRes = Core.runSelfTest();
for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);

// ── ROW 1: |F| === B·I·L at θ=0 (L⊥B), dense I-sweep, both signs ─────────────
console.log('\n— ROW 1: |F| === B·I·L at θ=0 over a dense I-sweep —');
{
  let worst = 0, where = '';
  for (let k = -500; k <= 500; k++){
    const I = (S.I_max) * k/500;
    const F = Core.forceOnBar(I, 0, +1, +1);
    const d = Math.abs(norm(F) - S.B * Math.abs(I) * S.L);
    if (d > worst){ worst = d; where = `I=${I.toFixed(3)}`; }
  }
  ok('(BIL-exact)★ |F| === B·|I|·L at θ=0 to <1e-9 over the dense I-sweep',
     worst < 1e-9, `worst |Δ| ${worst.toExponential(2)} @ ${where}`);
}

// ── ROW 2: LINEAR IN I — |F(2I)| === 2|F(I)| AND x(t;2I) === 2x(t;I) ──────────
console.log('\n— ROW 2: linear in I — |F(2I)| === 2·|F(I)| and the race-ghost x(t;2I) === 2·x(t;I) —');
{
  let worstF = 0, worstX = 0, where = '';
  for (let it = 0; it <= 90; it++){
    const th = HALF_PI * it/90;
    for (let I = 0.1; I <= 2.5; I += 0.1){
      const f1 = norm(Core.forceOnBar(I, th, +1, +1));
      const f2 = norm(Core.forceOnBar(2*I, th, +1, +1));
      const dF = Math.abs(f2 - 2*f1);
      const x1 = Core.kinematics(I, th, 0.9, +1, +1).x;
      const x2 = Core.kinematics(2*I, th, 0.9, +1, +1).x;
      const dX = Math.abs(x2 - 2*x1);
      if (dF > worstF){ worstF = dF; }
      if (dX > worstX){ worstX = dX; where = `θ=${th.toFixed(2)} I=${I.toFixed(1)}`; }
    }
  }
  ok('(linear)★ |F(2I)| === 2·|F(I)| AND x(t;2I) === 2·x(t;I) (the doubled ghost) to <1e-9',
     worstF < 1e-9 && worstX < 1e-9, `worst |ΔF| ${worstF.toExponential(2)}, |Δx| ${worstX.toExponential(2)} @ ${where}`);
}

// ── ROW 3: SIGN FLIPS ON EITHER REVERSAL — F(−I) === −F(I) AND F(I,−B) === −F(I,+B)
console.log('\n— ROW 3: F flips sign on reversing I OR B (two distinct causes, the same flip) —');
{
  let worstI = 0, worstB = 0;
  for (let it = 0; it <= 90; it++){
    const th = HALF_PI * it/90;
    for (const I of [0.3, 1, 2.5, 4, 5]){
      const f  = Core.forceOnBar(I, th, +1, +1);
      const fI = Core.forceOnBar(I, th, -1, +1);
      const fB = Core.forceOnBar(I, th, +1, -1);
      for (let c = 0; c < 3; c++){
        worstI = Math.max(worstI, Math.abs(fI[c] + f[c]));
        worstB = Math.max(worstB, Math.abs(fB[c] + f[c]));
      }
    }
  }
  ok('(I-flip)★ reverse current ⇒ F(−I) === −F(I) pointwise to <1e-9',
     worstI < 1e-9, `worst |F(−I)+F(I)| ${worstI.toExponential(2)}`);
  ok('(B-flip)★ reverse field ⇒ F(I,−B) === −F(I,+B) pointwise to <1e-9 (distinct cause, same flip)',
     worstB < 1e-9, `worst |F(−B)+F(+B)| ${worstB.toExponential(2)}`);
}

// ── ROW 4: PERPENDICULAR TO BOTH — dot(F, L̂) === 0 AND dot(F, B) === 0 ALL tilts
console.log('\n— ROW 4: F ⊥ both current and field — dot(F,L) === 0 AND dot(F,B) === 0 at every tilt —');
{
  let worst = 0, where = '';
  for (let it = 0; it <= 180; it++){
    const th = HALF_PI * it/180;
    for (const Bsign of [+1, -1]){
      for (const I of [0.5, 1.5, 3.5, 5]){
        const F = Core.forceOnBar(I, th, +1, Bsign);
        const L = Core.barVector(+1);
        const B = Core.fieldVector(th, Bsign);
        const d = Math.max(Math.abs(dot(F, L)), Math.abs(dot(F, B)));
        if (d > worst){ worst = d; where = `θ=${th.toFixed(2)} I=${I} Bsign=${Bsign}`; }
      }
    }
  }
  ok('(perp)★ dot(F, L) === 0 AND dot(F, B) === 0 for ALL tilts & B-signs to <1e-9',
     worst < 1e-9, `worst |dot| ${worst.toExponential(2)} @ ${where}`);
}

// ── ROW 5: NEG-CONTROL (fires RED) — at θ=90° (L∥B), F ≡ [0,0,0] EXACTLY ──────
console.log('\n— ROW 5: NEG-CONTROL — at L∥B (θ=90°), F ≡ [0,0,0] exactly (no leap where they agree) —');
{
  let worst = 0;
  for (const Bsign of [+1, -1]){
    for (const Isign of [+1, -1]){
      for (let I = 0; I <= S.I_max; I += 0.05){
        const F = Core.forceOnBar(I, HALF_PI, Isign, Bsign);
        worst = Math.max(worst, Math.abs(F[0]), Math.abs(F[1]), Math.abs(F[2]));
      }
    }
  }
  ok('(neg-control)★ L∥B ⇒ F ≡ [0,0,0] to the bit (a parallel current can\'t push)',
     worst < 1e-9, `worst |F| @ θ=90° ${worst.toExponential(2)} — the falsifier: no force where current ∥ field`);
  // and the pill's row 5 must itself be GREEN in the module (the neg-control asserted true)
  const negRow = moduleRes.checks.find(c => /NEG-CONTROL/.test(c.name));
  ok('(neg-control)★ the in-pill NEG-CONTROL row passes (asserting F≡0 at L∥B) — the page flips it RED when REACHED',
     !!negRow && negRow.pass, negRow ? negRow.info : 'row missing');
}

// ── 2. RE-EXTRACTION PARITY: the page core === the module core (byte-twin) ────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { ok('index.html present (forge built it)', false, 'MISSING — run: node tools/forge/forge.mjs lodestone-hall/the-wire-that-jumps/index.src.html'); }

  if (html){
    const BEGIN = '// === RAILSHUTTLE CORE BEGIN ===';
    const END = '// === RAILSHUTTLE CORE END ===';
    const i = html.indexOf(BEGIN), j = html.indexOf(END);
    ok('inline-core sentinels present in index.html', i >= 0 && j > i,
       i >= 0 && j > i ? `slice is ${j - i} chars` : 'MISSING SENTINELS — has forge built index.html?');

    if (i >= 0 && j > i){
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
          '\n;return { SCENE, cross, dot, norm, barVector, fieldVector, forceOnBar, kinematics, runSelfTest };');
        const Page = factory();
        pageRes = Page.runSelfTest();
        const a = Page.forceOnBar(2.3, 0.4, +1, +1), b = Core.forceOnBar(2.3, 0.4, +1, +1);
        const sameForm =
          a[0] === b[0] && a[1] === b[1] && a[2] === b[2] &&
          Page.SCENE.B === Core.SCENE.B && Page.SCENE.L === Core.SCENE.L && Page.SCENE.m === Core.SCENE.m;
        ok('(parity)★ page core formulas === module core formulas (forceOnBar / SCENE identical)',
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
if (pass !== total){ console.error('FAIL — a Wire-That-Jumps assertion did not hold.'); process.exit(1); }
console.log('All Wire-That-Jumps cross-checks green. The launch force is exact; the page core === the module core.');
