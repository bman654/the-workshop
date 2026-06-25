// Node twin for Weightless at the Top core. Zero-dep. Run: `node cross/weightless-at-the-top/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, plus BOTH real parents at the
// same two ../ hops, so the page's gold self-test pill and this twin can never drift. It re-proves the 4
// rows the in-page pill proves, PLUS the byte-twin parity row (index.html CORE === core.mjs CORE char-for-
// char) and the code-disjointness grep (the IMPOSED adapter names no CO fn; the EARNED adapter names no
// FW fn). ONE threshold: apparent weight → 0 at crest speed² = g·r — EARNED by a fall, or IMPOSED by a motor.
//
//   1.  BRIDGE machine-ε   — |imposedCrestSpeed2(ω₀) − sharedCrestSpeed2()| < 1e-9 at the live shared r.
//   2.  BRIDGE exact (===) — imposedCrestFelt(ω₀)===0 AND ω₀²r===g AND earnedAnalytic(2.5r)===g·r; CO.G===FW.G.
//   3.  EARNED through parent (sample-limited) — integrated crest v²/(g·r)→1 (<1e-3) AND felt needle ≈0 (<1e-2).
//   4.  NEG-CONTROLS (own authority) — just-clear h=2.5r doesn't detach, 2.49r does, ½ω₀ still presses (>0).
//   5.  BYTE-TWIN PARITY + DISJOINTNESS — index.html CORE === core.mjs CORE; adapters code-disjoint; both
//       parents imported at the same two ../ hops.
//   6.  PARITY with the shared runSelfTest (the function the page inlines as its pill).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as CO from '../../the-coaster/core.mjs';
import * as FW from '../../ferris-wheel/core.mjs';
import {
  G, R, TWO_PI,
  imposedOmega0, imposedCrestFelt, imposedCrestSpeed2, imposedPress,
  earnedTrack, earnedCrestSpeed2, earnedCrestSpeed2Analytic, earnedCrestFelt, justClearHeight, earnedDetach,
  sharedCrestSpeed2, imposedNeedle, earnedNeedle, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nWeightless at the Top — Node twin (a coaster bead EARNS the float by falling; a ferris gondola is DRIVEN to it)\n');
const w0 = imposedOmega0();

// ── ROW 1: BRIDGE machine-ε — both floats meet on v² = g·r ───────────────────────────────────────────
console.log('— Row 1: BRIDGE machine-ε — |imposedCrestSpeed2(ω₀) − sharedCrestSpeed2()| < 1e-9 —');
{
  const diff = Math.abs(imposedCrestSpeed2(w0) - sharedCrestSpeed2());
  ck('|imposedCrestSpeed2(ω₀) − g·r| < 1e-9 at the live shared r (the two floats meet on one crest speed²)',
    diff < 1e-9, 'diff=' + diff.toExponential(2) + ' at r=' + R + ', v²=g·r=' + sharedCrestSpeed2().toFixed(2));
  // and the imposed crest speed² really IS the shared float speed at ω₀ (coincident, not merely close)
  ck('imposedCrestSpeed2(ω₀) coincides with g·r (the ferris is driven to exactly the float crest speed)',
    Math.abs(imposedCrestSpeed2(w0) - sharedCrestSpeed2()) < 1e-9, '(ω₀·r)²=' + imposedCrestSpeed2(w0).toFixed(6));
}

// ── ROW 2: BRIDGE exact (===) — the three diff-zero identities + one gravity ─────────────────────────
console.log('\n— Row 2: BRIDGE exact (===) — imposedCrestFelt(ω₀)===0, ω₀²r===g, earnedAnalytic(2.5r)===g·r —');
{
  const okFloat = imposedCrestFelt(w0) === 0;
  const okRoot  = w0 * w0 * R === G;
  const okEarn  = earnedCrestSpeed2Analytic(justClearHeight()) === sharedCrestSpeed2();
  ck('imposedCrestFelt(ω₀) === 0 byte-exact (the motor-driven crest unloads to EXACTLY zero at ω₀)', okFloat, 'N_top(ω₀)=' + imposedCrestFelt(w0));
  ck('ω₀²·r === g byte-exact (the float root has no smuggled factor — g·r is the whole story)', okRoot, 'ω₀²r−g=' + (w0 * w0 * R - G));
  ck('earnedCrestSpeed2Analytic(2.5r) === g·r byte-exact (the just-clears release EARNS exactly the float crest speed²)', okEarn, 'earnedΔ=' + (earnedCrestSpeed2Analytic(justClearHeight()) - sharedCrestSpeed2()));
  ck('CO.G === FW.G (both rides feel the SAME one gravity — the shared crest is a shared number)', CO.G === FW.G, 'CO.G=' + CO.G + ' FW.G=' + FW.G);
}

// ── ROW 3: EARNED through the parent — sample-limited, NOT ε ──────────────────────────────────────────
console.log('\n— Row 3: EARNED through the parent (sample-limited) — integrated crest v²/(g·r)→1 AND felt needle ≈0 —');
{
  const track = earnedTrack();
  const ratio = earnedCrestSpeed2(track, 2.5 * R) / (G * R);
  const felt  = earnedNeedle(track, 2.5 * R);
  ck('integrated coaster crest v²/(g·r) → 1 within 1e-3 (the parent’s own energy stepper lands on the float speed)',
    Math.abs(ratio - 1) < 1e-3, 'v²/(g·r)−1=' + (ratio - 1).toExponential(2) + ' (loose floor by design — discretized scan)');
  ck('the earned felt needle ≈ 0 within 1e-2 (the bead floats free over the top — the SAME zero as the ferris)',
    Math.abs(felt) < 1e-2, 'earnedNeedle=' + felt.toExponential(2));
  // the analytic earned felt at the just-clear height is exactly the shared zero too (closed-form mate)
  ck('earnedCrestFelt(2.5r) === 0 byte-exact (the closed-form earned crest also lands on the shared zero)',
    earnedCrestFelt(justClearHeight()) === 0, 'earnedCrestFelt(2.5r)=' + earnedCrestFelt(justClearHeight()));
}

// ── ROW 4: NEG-CONTROLS, each from its OWN authority ─────────────────────────────────────────────────
console.log('\n— Row 4: neg-controls (own authority) — detach below threshold; the sub-float spin still presses —');
{
  const clears = earnedDetach(justClearHeight());
  const below  = earnedDetach(2.49 * R);
  const press  = imposedPress(0.5 * w0);
  ck('the coaster just-clear release (h=2.5r) does NOT detach (null — it makes it over the top)', clears === null, 'detach(2.5r)=' + clears);
  ck('a hair below (h=2.49r) DOES detach at a real angle > 0 (the rail can no longer hold the bead)', below != null && below > 0, 'detach(2.49r)=' + (below == null ? 'null' : below.toFixed(3)) + ' rad');
  ck('the ferris crest still PRESSES below ω₀ (imposedPress(½ω₀) > 0 — a sub-float spin is not weightless)', press > 0, 'press(½ω₀)=' + press.toFixed(4) + ' (= ¾g, not floating)');
}

// ── ROW 5: BYTE-TWIN PARITY + ADAPTER DISJOINTNESS + same-hop ────────────────────────────────────────
console.log('\n— Row 5: byte-twin parity (index.html CORE === core.mjs CORE) + adapter disjointness + same-hop —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const coreReg = region(coreSrc);
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));

  // the two adapters are code-DISJOINT by grep: the IMPOSED block names no coaster fn; the EARNED block
  // names no ferris fn. Neither mechanism reaches into the other's physics.
  const IMP_B = '// ─ IMPOSED-ADAPTER BEGIN ─', IMP_E = '// ─ IMPOSED-ADAPTER END ─';
  const EAR_B = '// ─ EARNED-ADAPTER BEGIN ─', EAR_E = '// ─ EARNED-ADAPTER END ─';
  const impBody = coreSrc.slice(coreSrc.indexOf(IMP_B), coreSrc.indexOf(IMP_E));
  const earBody = coreSrc.slice(coreSrc.indexOf(EAR_B), coreSrc.indexOf(EAR_E));
  ck('the IMPOSED adapter names NO coaster symbol (CO.* / earnedTrack / earnedCrest / earnedDetach)',
    !/\bCO\.|earnedTrack|earnedCrest|earnedDetach/.test(impBody), 'reads only the ferris-wheel apparent-weight law');
  ck('the EARNED adapter names NO ferris symbol (FW.* / imposedOmega0 / imposedCrest / imposedPress)',
    !/\bFW\.|imposedOmega0|imposedCrest|imposedPress/.test(earBody), 'reads only the coaster’s energy stepper + detach verdict');

  // both parents imported at the same two ../ hops (the single-source discipline).
  ck('both parents imported at ../../ (the-coaster + ferris-wheel, byte-untouched)',
    /from '\.\.\/\.\.\/the-coaster\/core\.mjs'/.test(coreSrc) && /from '\.\.\/\.\.\/ferris-wheel\/core\.mjs'/.test(coreSrc),
    'CO=../../the-coaster · FW=../../ferris-wheel');
}

// ── ROW 6: PARITY with the shared runSelfTest ────────────────────────────────────────────────────────
console.log('\n— Row 6: the shared runSelfTest (the function the page inlines as its pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all rows', r.ok, r.passed + '/' + r.total);
}

console.log('\n—— Weightless at the Top Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
