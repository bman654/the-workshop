// Node twin for The Three Doors math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block at the bottom), so the page's self-test pill and this test can't drift.
//
// Proves the four brief claims green:
//   (1) INFORMED host P(win|switch)=2/3 and P(win|stay)=1/3, derived BOTH via Bayes
//       (likelihood ½ when pick=car vs 1 when pick=goat) AND via exhaustive enumeration over
//       3 car × 3 pick × host-choice — each asserted EXACT (validMass=1).
//   (2) a SEEDED mulberry32 Monte-Carlo approaches 2/3 & 1/3 within a stated ε (the SAME play the
//       on-page gauges show).
//   (3) NEG-CONTROL: an ignorant uniform host, conditioned on goat-revealed rounds ONLY
//       (car-revealed rounds voided/excluded), gives P(win|switch)=P(win|stay)=1/2 EXACT —
//       validMass=2/3 (≈1/3 voided). The advantage vanishes.
//   (4) BYTE-PARITY: the core region inlined into index.html === core.mjs, character-identical.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  N, EPS, worlds, informedLegalOpens, ignorantLegalOpens, switchTarget,
  analyze, bayesPosteriorOnSwitch, mulberry32, playRound, monteCarlo, runSelfTest
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOL = 1e-12;

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok){ if (ok) pass++; else { fail++; fails.push(name); } }
const near = (a, b, e = TOL) => Math.abs(a - b) <= e;

// ── (1) INFORMED host: enumeration AND Bayes, each exact ──────────────────────────────────
const inf = analyze('informed');
ck('(1) enumeration: P(win|switch)=2/3 exact', near(inf.pSwitch, 2/3));
ck('(1) enumeration: P(win|stay)=1/3 exact',  near(inf.pStay, 1/3));
ck('(1) enumeration: P(switch)+P(stay)=1', near(inf.pSwitch + inf.pStay, 1));
ck('(1) enumeration: validMass=1 (all 9 worlds valid, no voids)', near(inf.validMass, 1));
ck('(1) enumeration: 6 of 9 cells win-switch (off-diagonal)',
   inf.cells.filter(c => c.verdict === 'win-switch').length === 6);
ck('(1) enumeration: 3 of 9 cells win-stay (the diagonal)',
   inf.cells.filter(c => c.verdict === 'win-stay').length === 3);
// the diagonal cells (car===pick) are exactly the stay-wins; off-diagonal are switch-wins
ck('(1) enumeration: diagonal cells (car=pick) are win-stay',
   inf.cells.filter(c => c.car === c.pick).every(c => c.verdict === 'win-stay'));
ck('(1) enumeration: off-diagonal cells (car≠pick) are win-switch',
   inf.cells.filter(c => c.car !== c.pick).every(c => c.verdict === 'win-switch'));

// Bayes — the independent derivation, agreeing to the bit
const bay = bayesPosteriorOnSwitch();
ck('(1) Bayes: posterior on switch = 2/3', near(bay.pSwitch, 2/3));
ck('(1) Bayes: posterior on stay = 1/3',  near(bay.pStay, 1/3));
ck('(1) Bayes == enumeration (switch)', near(bay.pSwitch, inf.pSwitch));
ck('(1) Bayes == enumeration (stay)',   near(bay.pStay, inf.pStay));
// the likelihood asymmetry that BUYS the 2/3 is real: ½ (pick=car, host free) vs 1 (pick=goat, forced)
{
  // a goat-pick world: car=2, pick=0 → the informed host is FORCED to the single legal goat
  const forced = informedLegalOpens(2, 0);
  ck('(1) Bayes mechanism: informed host FORCED (1 legal open) when pick is a goat', forced.length === 1);
  // a car-pick world: car=0, pick=0 → the host has a FREE choice between two goats (likelihood ½ each)
  const free = informedLegalOpens(0, 0);
  ck('(1) Bayes mechanism: informed host FREE (2 legal opens) when pick is the car', free.length === 2);
}

// ── (2) SEEDED Monte-Carlo approaches the closed form (the SAME play the gauges show) ───────
const mcI = monteCarlo('informed', 60000, 0x3D0025);
ck('(2) MC informed switch ≈ 2/3 (±0.01)', near(mcI.pSwitch, 2/3, 0.01));
ck('(2) MC informed stay ≈ 1/3 (±0.01)',  near(mcI.pStay, 1/3, 0.01));
ck('(2) MC informed never voids (informed host never spills the car)', mcI.voided === 0);
// determinism: the same seed yields the same tally (the gauges are reproducible)
{
  const a = monteCarlo('informed', 5000, 0xABCD12), b = monteCarlo('informed', 5000, 0xABCD12);
  ck('(2) MC is deterministic per seed (sw,st,valid identical)',
     a.sw === b.sw && a.st === b.st && a.valid === b.valid);
}

// ── (3) NEG-CONTROL: ignorant host conditioned on goat-reveals → 1/2, advantage GONE ────────
const ign = analyze('ignorant');
ck('(3) ignorant: P(win|switch)=1/2 exact', near(ign.pSwitch, 1/2));
ck('(3) ignorant: P(win|stay)=1/2 exact',  near(ign.pStay, 1/2));
ck('(3) ignorant: advantage VANISHES (pSwitch − pStay = 0)', near(ign.pSwitch - ign.pStay, 0));
ck('(3) ignorant: validMass=2/3 (one-third voided by car-reveals)', near(ign.validMass, 2/3));
// the void mass is real and lives off the diagonal (where a careless host can spill the car)
{
  const voidMass = ign.cells.reduce((s, c) => s + c.cellVoidW, 0);
  ck('(3) ignorant: total void mass = 1/3', near(voidMass, 1/3));
  ck('(3) ignorant: diagonal (car=pick) NEVER voids',
     ign.cells.filter(c => c.car === c.pick).every(c => c.cellVoidW <= EPS));
  ck('(3) ignorant: off-diagonal cells carry switch-void verdict',
     ign.cells.filter(c => c.car !== c.pick).every(c => c.verdict === 'switch-void'));
}
const mcG = monteCarlo('ignorant', 60000, 0x9A11FF);
ck('(3) MC ignorant switch ≈ 1/2 (±0.01)', near(mcG.pSwitch, 1/2, 0.01));
ck('(3) MC ignorant stay ≈ 1/2 (±0.01)',  near(mcG.pStay, 1/2, 0.01));
ck('(3) MC ignorant voided fraction ≈ 1/3 (±0.01)',
   near(mcG.voided/(mcG.valid + mcG.voided), 1/3, 0.01));

// structural sanity on switchTarget — the unique third door
ck('switchTarget(0,1)=2', switchTarget(0,1) === 2);
ck('switchTarget(2,0)=1', switchTarget(2,0) === 1);
ck('switchTarget(1,2)=0', switchTarget(1,2) === 0);

// runSelfTest (the IDENTICAL function the page pill runs) is all-green
const st = runSelfTest();
ck('core.runSelfTest() is all-green (the page pill runs this exact function)', st.ok === true);

// ── (4) BYTE-TWIN PARITY — coreRegion(core.mjs) === coreRegion(index.html), char-identical ──
function coreRegion(path){
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf('// === CORE BEGIN ===');
  const b = src.indexOf('// === CORE END ===');
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + '// === CORE END ==='.length);
}
const fromCore = coreRegion(join(__dirname, 'core.mjs'));
let fromPage = null;
try { fromPage = coreRegion(join(__dirname, 'index.html')); } catch (e) { fromPage = null; }
ck('(4) byte-twin: CORE BEGIN..END found in core.mjs', !!fromCore);
ck('(4) byte-twin: CORE BEGIN..END found in index.html', !!fromPage);
ck('(4) byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);

// ── report ──
console.log('The Three Doors — core.test.mjs');
console.log('  N=' + N + ' doors · 9 equally-likely worlds (3 car × 3 pick)');
console.log('  informed: P(switch)=' + inf.pSwitch.toFixed(12) + '  P(stay)=' + inf.pStay.toFixed(12) +
            '  (validMass=' + inf.validMass.toFixed(12) + ')');
console.log('  ignorant: P(switch)=' + ign.pSwitch.toFixed(12) + '  P(stay)=' + ign.pStay.toFixed(12) +
            '  (validMass=' + ign.validMass.toFixed(12) + ', ~1/3 voided)');
console.log('  MC informed 60k: switch=' + mcI.pSwitch.toFixed(4) + ' stay=' + mcI.pStay.toFixed(4));
console.log('  MC ignorant 60k: switch=' + mcG.pSwitch.toFixed(4) +
            ' voided=' + (mcG.voided/(mcG.valid+mcG.voided)).toFixed(4));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
