// Node twin for The Coin That Lies math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block at the bottom), so the page's self-test and this test can't drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  N, LIGHT, HEAVY, allCases, caseKey, weigh, flip, partition,
  reach, log3Bound, smallestW, tightMax, candidateWeighings, buildSchedule, SCHEDULE,
  leaves, distinguish, solvableIn, solvableExhaustive, bestFirstWeighing,
  verifyBinary, runSelfTest
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

// ── (A) every {<,=,>} outcome partitions the live suspect set DISJOINT + TOTAL across an
//        exhaustive sweep of every candidate weighing × all 2N cases. ──
{
  const cases = allCases(N);
  const cands = candidateWeighings(N);
  let allOK = true, checks = 0;
  for (const w of cands) {
    const b = partition(cases, w.left, w.right);
    const total = b['<'].length + b['='].length + b['>'].length;
    const keys = new Set([...b['<'], ...b['='], ...b['>']].map(caseKey));
    checks++;
    if (total !== cases.length || keys.size !== cases.length) { allOK = false; break; }
  }
  ck('(A) partition disjoint+total over ' + checks + ' weighings × ' + cases.length + ' cases', allOK && checks === cands.length);
  // pans are equal-count by construction (so a real coin never tips the beam)
  ck('(A) every candidate weighing has equal-count pans', cands.every(w => w.left.length === w.right.length));
}

// ── (B) reach(W) === 3^W; ⌈log₃ K⌉ is the floor; log3Bound === smallestW on a sweep;
//        spot-checks K=24→3, 27→3, 28→4. ──
{
  let reachOK = true; for (let w = 0; w <= 6; w++) if (reach(w) !== Math.pow(3, w)) reachOK = false;
  ck('(B) reach(W) === 3^W for W=0..6', reachOK);
  const sweep = [1, 2, 3, 8, 9, 10, 24, 26, 27, 28, 81, 82];
  ck('(B) log3Bound(K) === smallestW(K) over a sweep (float === integer def)', sweep.every(K => log3Bound(K) === smallestW(K)));
  ck('(B) spot-checks: ⌈log₃24⌉=3, ⌈log₃27⌉=3, ⌈log₃28⌉=4', log3Bound(24) === 3 && log3Bound(27) === 3 && log3Bound(28) === 4);
  ck('(B) the floor for 12 coins: ⌈log₃(2·12)⌉ = 3, and 3² < 24 ≤ 3³', log3Bound(2 * N) === 3 && reach(2) < 2 * N && 2 * N <= reach(3));
}

// ── (C) the preloaded 12-coin schedule resolves every one of the 24 leaves at decision-tree
//        depth EXACTLY 3 — covered.size === 2N, depths === {3}; one leaf per case (bijection). ──
{
  const lv = leaves(SCHEDULE);
  const withKey = lv.filter(l => l.key);
  const covered = new Set(withKey.map(l => l.key));
  const depths = new Set(withKey.map(l => l.depth));
  ck('(C) schedule covers all ' + (2 * N) + ' cases', covered.size === 2 * N);
  ck('(C) every leaf at depth EXACTLY 3', depths.size === 1 && depths.has(3));
  // bijection: each case appears as exactly one leaf
  const allKeys = new Set(allCases(N).map(caseKey));
  ck('(C) leaves are a bijection onto the 24 cases', covered.size === allKeys.size && [...allKeys].every(k => covered.has(k)));
  ck('(C) the first weighing is the classic 4-vs-4', SCHEDULE.left.length === 4 && SCHEDULE.right.length === 4);
}

// ── distinguish() against ALL 24 planted fakes returns the matching single leaf at depth 3 ──
{
  let ok = 0;
  for (const c of allCases(N)) {
    const observe = (left, right) => weigh(left, right, c.f, c.k);
    const r = distinguish(observe);
    if (r.leaf === caseKey(c) && r.depth === 3) ok++;
  }
  ck('distinguish() resolves all 24 planted fakes to the right leaf at depth 3', ok === 2 * N);
}

// ── weigh ANTISYMMETRY over every case: weigh(R,L) === flip(weigh(L,R)) ──
{
  const cases = allCases(N);
  const cands = candidateWeighings(N);
  let ok = 0, total = 0;
  // sample over all cases × a spread of weighings (all of them is fine — fast)
  for (const w of cands) {
    for (const c of cases) {
      total++;
      const lr = weigh(w.left, w.right, c.f, c.k);
      const rl = weigh(w.right, w.left, c.f, c.k);
      if (rl === flip(lr)) ok++;
    }
  }
  ck('weigh antisymmetry: weigh(R,L) === flip(weigh(L,R)) (' + total + '×)', ok === total);
  // the balanced case ('=' ) is its own flip; a real coin never tips a balanced pan
  ck("flip('=') === '=' and flip('<')==='>'", flip('=') === '=' && flip('<') === '>' && flip('>') === '<');
}

// ── log3Bound vs smallestW agreement already in (B); here the achievability GATE ──
// ── (D) solvableIn(12,3) === true && solvableIn(13,3) === false, both AGAINST the exhaustive
//        reference oracle (greedy can never silently disagree with the true answer). ──
{
  ck('(D) solvableIn(12,3) === true (greedy)', solvableIn(N, 3) === true);
  ck('(D) solvableIn(13,3) === false (greedy)', solvableIn(13, 3) === false);
  // the exhaustive oracle tries EVERY weighing at every node — the undeniable truth
  ck('(D) EXHAUSTIVE: 12 coins resolvable in 3 weighings', solvableExhaustive(allCases(12), 3, 12) === true);
  ck('(D) EXHAUSTIVE: 13 coins NOT resolvable in 3 weighings', solvableExhaustive(allCases(13), 3, 13) === false);
  // greedy === exhaustive (the gate is honest)
  ck('(D) greedy solvableIn agrees with the exhaustive oracle at n=12 and n=13',
     solvableIn(12, 3) === solvableExhaustive(allCases(12), 3, 12) &&
     solvableIn(13, 3) === solvableExhaustive(allCases(13), 3, 13));
  // also: 12 fails in 2, 27 (max for 3) is the ceiling — but 13 exceeds the no-reference max
  ck('(D) 12 coins UNsolvable in 2 weighings (the floor bites)', solvableIn(12, 2) === false);
  ck('(D) tightMax(3) === 12 and 2·tightMax(3) === 24 === 2N (the no-reference maximum)', tightMax(3) === 12 && 2 * tightMax(3) === 2 * N);
}

// ── why 13 fails: the best first weighing leaves a worst branch 10 > 3² = 9 (pigeonhole) ──
{
  const bf = bestFirstWeighing(13);
  ck('13: best first weighing worst branch === 10 > 9', bf.worstBranch === 10 && bf.worstBranch > reach(2));
  const bf12 = bestFirstWeighing(12);
  ck('12: best first weighing worst branch ≤ 9 (fits 3²)', bf12.worstBranch <= reach(2));
}

// ── the TWO-OUTCOME control: a bit, not a trit ──
{
  const vb = verifyBinary(2 * N, 3);
  ck("(E) two-outcome: 2³ = 8 < 24 ⇒ unresolvable, ⌈log₂24⌉ = 5 > 3", vb.resolvable === false && vb.need === 5 && vb.reach2 === 8);
}

// ── (E) the NEG-CONTROL runSelfTest modes fire RED and NAME the offender ──
{
  const norm = runSelfTest({ mode: 'normal' });
  ck('(E) runSelfTest("normal") passes (construction + floor both hold)', norm.pass === true && norm.offender === null);
  ck('(E) normal mode emits the FOUR honest claim lines', norm.lines.length >= 4 && norm.lines.every(l => l.ok));

  const two = runSelfTest({ mode: 'twoOutcome' });
  ck('(E) twoOutcome NEG fires RED and names the offender', two.pass === true && /two-way balance/i.test(two.offender));

  const thir = runSelfTest({ mode: 'thirteen' });
  ck('(E) thirteen NEG fires RED and names the offender (worst branch 10 > 9)', thir.pass === true && /13th coin/.test(thir.offender) && /10 > 3/.test(thir.offender));
}

// ── (F) BYTE-TWIN PARITY — coreRegion(core.mjs) === coreRegion(index.html), character-identical. ──
function coreRegion(path) {
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf('// === CORE BEGIN ===');
  const b = src.indexOf('// === CORE END ===');
  if (a < 0 || b < 0) return null;
  return src.slice(a, b + '// === CORE END ==='.length);
}
const fromCore = coreRegion(join(__dirname, 'core.mjs'));
let fromPage = null;
try { fromPage = coreRegion(join(__dirname, 'index.html')); } catch (e) { fromPage = null; }
ck('(F) byte-twin: CORE BEGIN..END found in core.mjs', !!fromCore);
ck('(F) byte-twin: CORE BEGIN..END found in index.html', !!fromPage);
ck('(F) byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);

// ── report ──
console.log('The Coin That Lies — core.test.mjs');
console.log('  N=' + N + ' · cases=' + (2 * N) + ' · floor ⌈log₃' + (2 * N) + '⌉=' + log3Bound(2 * N) + ' · reach(3)=' + reach(3));
console.log('  schedule leaves=' + new Set(leaves(SCHEDULE).filter(l => l.key).map(l => l.key)).size + '/' + (2 * N) + ' all at depth 3');
console.log('  solvableIn(12,3)=' + solvableIn(12, 3) + '  solvableIn(13,3)=' + solvableIn(13, 3) + '  (greedy === exhaustive)');
console.log('  13 worst first branch=' + bestFirstWeighing(13).worstBranch + ' > 9 = 3²');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
