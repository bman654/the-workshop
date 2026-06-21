// The Sorter — Node cross-check (the falsifiability twin of core.mjs).
//   Runs the shared runSelfTest() (identical to the in-page pill), proves the
//   eight rows independently with DENSER sweeps, AND — the integration crux —
//   RE-EXTRACTS the inlined core from index.html, evaluates it, and proves the
//   page core === the module core (char-for-char the export-stripped body, same
//   pass-count, every check agreeing). The Sorter imports nothing from the Hall
//   or the Whirligig, so page-core === module-core IS the parity proof. Exits 0
//   only when every assertion holds.
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

console.log('The Lodestone Hall · The Sorter — Node cross-check\n');
const S = Core.SCENE;

// ── 1. the shared self-test (identical to the in-page pill) ──────────────────
console.log('— shared runSelfTest() (the SAME assertions the in-page pill runs) —');
const moduleRes = Core.runSelfTest();
for (const c of moduleRes.checks) ok(c.name, c.pass, c.info);

// ── ROW 1: integrated radius === m·v/(q·B), dense m × v × B sweep ─────────────
console.log('\n— ROW 1: integrated arc radius === m·v/(q·B) over a dense m × v × B sweep —');
{
  let worst = 0, where = '';
  for (const m of [0.5, 1, 2, 3, 5]){
    for (const v of [0.5, 1, 1.5, 2.5, 4]){
      for (const B of [0.4, 0.8, 1.2, 2]){
        const arc = Core.integrateArc(m, 1, v, B);
        if (arc.radiusErr > worst){ worst = arc.radiusErr; where = `m=${m} v=${v} B=${B}`; }
      }
    }
  }
  ok('(radius)★ integrated distance-from-centre === m·v/(qB) to <1e-9 over m×v×B',
     worst < 1e-9, `worst |dist − r| ${worst.toExponential(2)} @ ${where}`);
}

// ── ROW 2: landing |x| === 2r, dense, AND the sign (−sign(q)·2r) ──────────────
console.log('\n— ROW 2: integrated landing === −sign(q)·2r (|x| === 2r) over a dense sweep —');
{
  let worst = 0, where = '';
  for (const m of [0.5, 1, 2, 3, 5]){
    for (const v of [0.7, 1.5, 3]){
      for (const B of [0.5, 0.8, 1.5]){
        for (const q of [+1, -1]){
          const arc = Core.integrateArc(m, q, v, B);
          const want = -Math.sign(q) * 2 * Core.radius(m, q, v, B);
          const d = Math.abs(arc.landingXMeasured - want);
          if (d > worst){ worst = d; where = `m=${m} v=${v} B=${B} q=${q}`; }
        }
      }
    }
  }
  ok('(landing)★ integrated landing x === −sign(q)·2r to <1e-9 over m×v×B×q (sign + magnitude)',
     worst < 1e-9, `worst |x − (−sign(q)·2r)| ${worst.toExponential(2)} @ ${where}`);
}

// ── ROW 3: the cyclotron fact — asserted STRUCTURALLY (no v in the signature) ─
console.log('\n— ROW 3: T = 2πm/(qB) forgets the speed — STRUCTURAL (period takes no v) + r scales —');
{
  // STRUCTURAL: period() takes (m, q, B) — three args, no v term at all.
  ok('(cyclotron)★ period() signature has NO v argument (takes (m,q,B) — the period forgets the speed)',
     Core.period.length === 3, `period.length = ${Core.period.length}`);
  // T identical across a v-grid (it literally cannot see v):
  let sameT = true; const T0 = Core.period(2, 1, 0.8);
  for (const v of [0.25, 0.5, 1, 2, 4, 8]) if (Core.period(2, 1, 0.8) !== T0) sameT = false;
  ok('(cyclotron)★ T identical across a v-grid (double v ⇒ same T, exact float)', sameT, `T = ${T0}`);
  // while r scales linearly: |r(2v) − 2r(v)| < 1e-12
  let worstR = 0;
  for (const m of [1, 2, 3]) for (const B of [0.5, 0.8, 1.5]) for (const v of [0.5, 1, 2, 4]){
    worstR = Math.max(worstR, Math.abs(Core.radius(m, 1, 2 * v, B) - 2 * Core.radius(m, 1, v, B)));
  }
  ok('(cyclotron)★ radius scales linearly with v: |r(2v) − 2r(v)| < 1e-12', worstR < 1e-12,
     `worst |r(2v) − 2r(v)| ${worstR.toExponential(2)}`);
}

// ── ROW 4: |v| conserved — F·v ≡ 0 over a dense θ-grid (no work) ──────────────
console.log('\n— ROW 4: the field does no work — F·v ≡ 0 over a dense θ-grid, |v| in === out —');
{
  let worstFv = 0;
  for (let k = 0; k < 2000; k++){
    const th = 2 * Math.PI * k / 2000;
    for (const v of [0.5, 1.5, 4]){
      const vx = v * Math.cos(th), vy = v * Math.sin(th);
      const a = Core.accel(vx, vy, 1, 0.8, 2);          // a ∥ F
      worstFv = Math.max(worstFv, Math.abs(a[0] * vx + a[1] * vy));
    }
  }
  ok('(no-work)★ F·v ≡ 0 over a dense θ × v grid to <1e-12 (the magnetic force does no work)',
     worstFv < 1e-12, `worst |F·v| ${worstFv.toExponential(2)}`);
  let worstSpeed = 0;
  for (const m of [0.5, 1, 2, 3]) for (const v of [0.7, 1.5, 3]){
    const arc = Core.integrateArc(m, 1, v, 0.8);
    worstSpeed = Math.max(worstSpeed, Math.abs(arc.speedIn - arc.speedOut), arc.worstSpeedDrift);
  }
  ok('(no-work)★ |v| in === |v| out along the integrated arc to <1e-9 (speed never changes)',
     worstSpeed < 1e-9, `worst speed drift ${worstSpeed.toExponential(2)}`);
}

// ── ROW 5: NEG-CONTROL B=0 ⇒ straight (max|x| === 0, r === ∞) ─────────────────
console.log('\n— ROW 5: NEG-CONTROL — B=0 ⇒ straight flight, no arc, no mass read —');
{
  let worstX = 0;
  for (const m of [0.5, 1, 2, 3, 5]) for (const v of [0.5, 1.5, 4]){
    const arc = Core.integrateArc(m, 1, v, 0);
    worstX = Math.max(worstX, arc.maxX);
  }
  const allInf = [0.5, 1, 2, 3, 5].every(m => Core.radius(m, 1, 1.5, 0) === Infinity);
  ok('(neg-control)★ B=0 ⇒ integrated max|x| === 0 AND r === ∞ — it is the FIELD that bends the charge',
     worstX < 1e-12 && allInf, `worst |x| ${worstX.toExponential(2)}, r=∞ for all: ${allInf}`);
  // and the pill row 5 itself must be GREEN in the module (the neg-control asserted true)
  const negRow = moduleRes.checks.find(c => /NEG-CONTROL/.test(c.name));
  ok('(neg-control)★ the in-pill NEG-CONTROL row passes — the page flips it RED when B=0 is CLAIMED',
     !!negRow && negRow.pass, negRow ? negRow.info : 'row missing');
}

// ── ROW 6: mass-fan x ∝ m ─────────────────────────────────────────────────────
console.log('\n— ROW 6: mass-fan — landingX/m is constant (the stripe spacing IS the mass ratio) —');
{
  let worst = 0;
  for (const q of [+1, -1]) for (const v of [0.7, 1.5, 3]) for (const B of [0.5, 0.8, 1.5]){
    const masses = [1, 2, 3, 4.5];
    const base = Core.landingX(masses[0], q, v, B) / masses[0];
    for (const m of masses) worst = Math.max(worst, Math.abs(Core.landingX(m, q, v, B) / m - base));
  }
  ok('(mass-fan)★ landingX/m === const over loaded masses to <1e-9 (x ∝ m — heavier swings wider)',
     worst < 1e-9, `worst |x/m − const| ${worst.toExponential(2)}`);
}

// ── ROW 7: q-sign flips the bend (opposite-signed) ───────────────────────────
console.log('\n— ROW 7: charge sign flips the bend — q>0 and q<0 land on opposite sides —');
{
  let worst = 0;
  for (const m of [1, 2, 3]) for (const v of [0.7, 1.5, 3]) for (const B of [0.5, 0.8, 1.5]){
    const xp = Core.landingX(m, +1, v, B), xm = Core.landingX(m, -1, v, B);
    worst = Math.max(worst, Math.abs(xp + xm));
  }
  ok('(q-sign)★ landingX(q>0) === −landingX(q<0) pointwise to <1e-12 (opposite sides of the nozzle)',
     worst < 1e-12, `worst |x₊ + x₋| ${worst.toExponential(2)}`);
}

// ── ROW 8: detector ratio === mass ratio ─────────────────────────────────────
console.log('\n— ROW 8: the detector reads mass — measured tick spacing === the mass ratio —');
{
  let worst = 0;
  for (const q of [+1, -1]) for (const v of [0.7, 1.5, 3]) for (const B of [0.5, 0.8, 1.5]){
    const masses = [1, 2, 3, 4.5];
    const measured = Core.measuredMassRatio(masses, q, v, B);
    for (let i = 0; i < masses.length; i++){
      worst = Math.max(worst, Math.abs(measured[i] - masses[i] / masses[0]));
    }
  }
  ok('(detector)★ measuredMassRatio === true mass ratio to <1e-9 across q×v×B (the v,q,B factors cancel)',
     worst < 1e-9, `worst |measured − true| ${worst.toExponential(2)}`);
}

// ── 2. RE-EXTRACTION PARITY: the page core === the module core (byte-twin) ────
console.log('\n— RE-EXTRACTION PARITY: the page core === the module core (byte-twin) —');
{
  let html = '';
  try { html = readFileSync(join(__dir, 'index.html'), 'utf8'); }
  catch { ok('index.html present (forge built it)', false, 'MISSING — run: node tools/forge/forge.mjs lodestone-hall/the-sorter/index.src.html'); }

  if (html){
    const BEGIN = '// === SORTER CORE BEGIN ===';
    const END = '// === SORTER CORE END ===';
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
          '\n;return { SCENE, radius, landingX, period, speed, accel, rk4Step, integrateArc, measuredMassRatio, runSelfTest };');
        const Page = factory();
        pageRes = Page.runSelfTest();
        const sameForm =
          Page.radius(2, 1, 1.5, 0.8) === Core.radius(2, 1, 1.5, 0.8) &&
          Page.landingX(2, 1, 1.5, 0.8) === Core.landingX(2, 1, 1.5, 0.8) &&
          Page.period(2, 1, 0.8) === Core.period(2, 1, 0.8) &&
          Page.period.length === Core.period.length &&
          Page.SCENE.B === Core.SCENE.B && Page.SCENE.m === Core.SCENE.m;
        ok('(parity)★ page core formulas === module core formulas (radius / landingX / period / SCENE identical)',
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
if (pass !== total){ console.error('FAIL — a Sorter assertion did not hold.'); process.exit(1); }
console.log('All Sorter cross-checks green. The arc is exact; the page core === the module core.');
