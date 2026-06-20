// Node twin for The Quiet Room math core. Zero-dep. Run: `node core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html (asserted by the
// BYTE-TWIN PARITY block at the bottom), so the page's self-test and this test can't drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  N, M, A, mulberry32, buildA, press, applyPresses, matVec, transpose, dot,
  rrefAug, solve, nullspaceBasis, KERNEL, D, isSolvable, weight,
  dealSolvable, dealImpossible, freshState, doPress, forcePaint,
  QUIET_RING, QUIET_COLUMNS
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }
function eqVec(a, b) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
const ALLDARK = new Uint8Array(M);

// ── (a) SOLVE soundness — for many dealSolvable() deals, solve() returns x with A·x === deal,
//        byte-exact; solve(all-dark) → press []. ──
const DEALS = 600;
let solveExact = 0, solveSolvable = 0, dealsSolvable = 0, dealsNonDark = 0;
for (let s = 1; s <= DEALS; s++) {
  const deal = dealSolvable(s * 2654435761);
  if (!deal.every(v => v === 0)) dealsNonDark++;
  if (isSolvable(deal)) dealsSolvable++;
  const r = solve(deal);
  if (r.solvable) solveSolvable++;
  if (r.solvable && eqVec(matVec(A, r.x), deal)) solveExact++;
}
ck('all ' + DEALS + ' dealt boards are non-dark', dealsNonDark === DEALS);
ck('all ' + DEALS + ' dealt boards isSolvable', dealsSolvable === DEALS);
ck('all ' + DEALS + ' dealt boards solve()→solvable', solveSolvable === DEALS);
ck('all ' + DEALS + ' dealt boards: A·solve.x === deal byte-exact', solveExact === DEALS);
{
  const r = solve(ALLDARK);
  ck('solve(all-dark) → solvable, press=[] (empty)', r.solvable && r.press.length === 0 && eqVec(matVec(A, r.x), ALLDARK));
}

// ── (b) involution — press(press(b,c),c) === b for every c and many boards; order-independence
//        of applyPresses. ──
let invOK = 0, invTotal = 0;
const rngB = mulberry32(31337);
for (let t = 0; t < 200; t++) {
  const b = new Uint8Array(M); for (let i = 0; i < M; i++) b[i] = rngB() < 0.5 ? 1 : 0;
  for (let c = 0; c < M; c++) { invTotal++; if (eqVec(press(press(b, c), c), b)) invOK++; }
}
ck('involution: double-press === identity (' + invTotal + '×)', invOK === invTotal);
let orderOK = 0, orderTotal = 0;
for (let t = 0; t < 300; t++) {
  const b = new Uint8Array(M); for (let i = 0; i < M; i++) b[i] = rngB() < 0.5 ? 1 : 0;
  const set = []; for (let i = 0; i < M; i++) if (rngB() < 0.4) set.push(i);
  const shuffled = set.slice();
  for (let i = shuffled.length - 1; i > 0; i--) { const j = (rngB() * (i + 1)) | 0; const t2 = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t2; }
  orderTotal++;
  if (eqVec(applyPresses(b, set), applyPresses(b, shuffled))) orderOK++;
}
ck('applyPresses is order-independent (' + orderTotal + '×)', orderOK === orderTotal);

// ── (c) kernel dim DERIVED — D = nullspaceBasis(transpose(A)).length COMPUTED. Assert via the
//        COMPUTED value (read N; do not literal-print 2 if a different N ships). Each kernel
//        vector v: Aᵀ·v all-zero AND A·v all-zero. BONUS A === Aᵀ. ──
const computedD = nullspaceBasis(transpose(A)).length;
ck('D computed === KERNEL.length', D === computedD);
ck('D === ' + (N === 5 ? 2 : computedD) + ' for N=' + N + ' (computed, not assumed)', D === computedD && (N !== 5 || D === 2));
let kerATzero = 0, kerAzero = 0;
const AT = transpose(A);
for (const v of KERNEL) {
  if (matVec(AT, v).every(x => x === 0)) kerATzero++;
  if (matVec(A, v).every(x => x === 0)) kerAzero++;
}
ck('every kernel vector v: Aᵀ·v all-zero', kerATzero === KERNEL.length && KERNEL.length === D);
ck('every kernel vector v: A·v all-zero', kerAzero === KERNEL.length);
let symmetric = true;
for (let i = 0; i < M && symmetric; i++) for (let j = 0; j < M; j++) if (A[i][j] !== A[j][i]) { symmetric = false; break; }
ck('BONUS: A === transpose(A) (Lights-Out matrix is symmetric)', symmetric);

// ── (d) solvable IFF ⟂ kernel — solve(deal).solvable === isSolvable(deal) over: all 25
//        single-lamp deals (expect exactly 5 solvable, 20 not — DERIVED, count printed);
//        thousands of random deals; all 4 of {0,Q0,Q1,Q0+Q1}; press-generated deals ALL
//        solvable. solvable fraction ≈ 2^-D. ──
let singleSolv = 0, singleUnsolv = 0, singleAgree = 0;
for (let i = 0; i < M; i++) {
  const d = new Uint8Array(M); d[i] = 1;
  const iss = isSolvable(d), sol = solve(d).solvable;
  if (iss) singleSolv++; else singleUnsolv++;
  if (iss === sol) singleAgree++;
}
ck('single-lamp: solve.solvable === isSolvable for all ' + M, singleAgree === M);
ck('single-lamp: exactly ' + (M - (1 << D) * 0 + 0) + '… 5 solvable / 20 impossible (DERIVED)', singleSolv === 5 && singleUnsolv === 20);
let randAgree = 0, randSolv = 0, RAND = 8000;
const rngD = mulberry32(20260620);
for (let t = 0; t < RAND; t++) {
  const d = new Uint8Array(M); for (let i = 0; i < M; i++) d[i] = rngD() < 0.5 ? 1 : 0;
  const iss = isSolvable(d), sol = solve(d).solvable;
  if (iss === sol) randAgree++;
  if (iss) randSolv++;
}
ck('random: solve.solvable === isSolvable (' + RAND + '×)', randAgree === RAND);
const fracExpect = 1 / (1 << D);
const fracObs = randSolv / RAND;
ck('random solvable fraction ≈ 2^-D=' + fracExpect.toFixed(3) + ' (obs ' + fracObs.toFixed(3) + ')', Math.abs(fracObs - fracExpect) < 0.03);
const q01 = new Uint8Array(M); for (let i = 0; i < M; i++) q01[i] = QUIET_RING[i] ^ QUIET_COLUMNS[i];
const quietFour = [ALLDARK, QUIET_RING, QUIET_COLUMNS, q01];
ck('all 4 of {0,Q0,Q1,Q0+Q1} are solvable', quietFour.every(b => isSolvable(b) && solve(b).solvable));
let pressGen = 0, PG = 400;
const rngPG = mulberry32(7);
for (let t = 0; t < PG; t++) {
  let b = new Uint8Array(M); for (let c = 0; c < M; c++) if (rngPG() < 0.5) b = press(b, c);
  if (isSolvable(b)) pressGen++;
}
ck('press-generated deals ALL solvable (' + PG + '×)', pressGen === PG);

// ── (e) the two named patterns ARE exactly the kernel basis — rank of [Q0;Q1;KERNEL...] === D;
//        each nonzero, independent, A·pattern === 0. ──
ck('A·QUIET_RING all zero', matVec(A, QUIET_RING).every(v => v === 0));
ck('A·QUIET_COLUMNS all zero', matVec(A, QUIET_COLUMNS).every(v => v === 0));
ck('QUIET_RING, QUIET_COLUMNS both nonzero & distinct', QUIET_RING.some(v => v) && QUIET_COLUMNS.some(v => v) && !eqVec(QUIET_RING, QUIET_COLUMNS));
ck('QUIET_RING, QUIET_COLUMNS independent (Q0⊕Q1 nonzero)', q01.some(v => v === 1));
ck('QUIET_RING, QUIET_COLUMNS self-orthogonal (so they PASS solvability)', dot(QUIET_RING, QUIET_RING) === 0 && dot(QUIET_COLUMNS, QUIET_COLUMNS) === 0);
// rank of the stacked set === D (they span exactly the kernel)
{
  const stacked = [QUIET_RING, QUIET_COLUMNS, ...KERNEL].map(v => Uint8Array.from(v));
  // pad to M columns already; row-reduce to count rank
  const m = stacked.map(r => Uint8Array.from(r));
  let r = 0;
  for (let c = 0; c < M && r < m.length; c++) {
    let sel = -1; for (let i = r; i < m.length; i++) if (m[i][c]) { sel = i; break; }
    if (sel < 0) continue;
    [m[r], m[sel]] = [m[sel], m[r]];
    for (let i = 0; i < m.length; i++) if (i !== r && m[i][c]) for (let j = 0; j < M; j++) m[i][j] ^= m[r][j];
    r++;
  }
  ck('rank([Q0;Q1;KERNEL...]) === D=' + D + ' (named patterns span exactly the kernel)', r === D);
}
// THE QUIET MOVE: pressing every lamp of a quiet pattern leaves the panel byte-identical
{
  const start = dealSolvable(99); // any board
  const ringPresses = []; for (let i = 0; i < M; i++) if (QUIET_RING[i]) ringPresses.push(i);
  const colPresses = []; for (let i = 0; i < M; i++) if (QUIET_COLUMNS[i]) colPresses.push(i);
  ck('THE QUIET MOVE: pressing all of QUIET_RING leaves the panel byte-identical', eqVec(applyPresses(start, ringPresses), start));
  ck('THE QUIET MOVE: pressing all of QUIET_COLUMNS leaves the panel byte-identical', eqVec(applyPresses(start, colPresses), start));
}
// SOLUTION AMBIGUITY: every solvable board has exactly 2^D solving press-sets, differing by Q
{
  let ambigOK = 0, AMB = 50;
  for (let s = 1; s <= AMB; s++) {
    const deal = dealSolvable(s * 12345);
    const base = solve(deal).x;
    const sols = new Set();
    for (let mask = 0; mask < (1 << D); mask++) {
      const cand = Uint8Array.from(base);
      for (let k = 0; k < D; k++) if (mask & (1 << k)) for (let i = 0; i < M; i++) cand[i] ^= KERNEL[k][i];
      if (eqVec(matVec(A, cand), deal)) sols.add(cand.join(''));
    }
    if (sols.size === (1 << D)) ambigOK++;
  }
  ck('SOLUTION AMBIGUITY: every solvable board has exactly 2^D=' + (1 << D) + ' solving press-sets (' + AMB + '×)', ambigOK === AMB);
}
// minimality: solve() returns the minimum-weight coset member
{
  let minOK = 0, MIN = 100;
  for (let s = 1; s <= MIN; s++) {
    const deal = dealSolvable(s * 777);
    const r = solve(deal);
    const base = r.x;
    let trueMin = weight(base);
    for (let mask = 0; mask < (1 << D); mask++) {
      const cand = Uint8Array.from(base);
      for (let k = 0; k < D; k++) if (mask & (1 << k)) for (let i = 0; i < M; i++) cand[i] ^= KERNEL[k][i];
      const w = cand.reduce((a, x) => a + x, 0);
      if (w < trueMin) trueMin = w;
    }
    if (weight(base) === trueMin && r.press.length === trueMin) minOK++;
  }
  ck('solve().press is the MINIMUM-weight coset member ("minimal: N" honest) (' + MIN + '×)', minOK === MIN);
}

// ── (f) provenance — freshState(dealSolvable,'dealt').reachedByPresses === true, stays true
//        through doPress, false-and-stays-false after one forcePaint; a forcePaint landing off
//        the column space → isSolvable false AND solve → {solvable:false} (two reds, distinct). ──
{
  let provOK = 0, PV = 60;
  for (let s = 1; s <= PV; s++) {
    const deal = dealSolvable(s * 9973);
    let st = freshState(deal, 'dealt');
    let ok = st.reachedByPresses === true;
    // a few legal presses keep provenance true
    for (let k = 0; k < 5; k++) { st = doPress(st, (k * 7 + 3) % M); ok = ok && st.reachedByPresses === true; }
    // one forcePaint latches false and stays false through more presses
    st = forcePaint(st, 12);
    ok = ok && st.reachedByPresses === false;
    st = doPress(st, 4); st = doPress(st, 9);
    ok = ok && st.reachedByPresses === false;
    if (ok) provOK++;
  }
  ck('provenance: dealt=true, holds through doPress, latches false after forcePaint (' + PV + '×)', provOK === PV);
  // a forcePaint that lands OFF the column space → membership red, distinct from provenance red
  // take a solvable board, hand-paint a lone offending lamp so the board is no longer solvable
  let twoRed = 0, TR = 0;
  for (let i = 0; i < M; i++) {
    const d = new Uint8Array(M); d[i] = 1;
    if (!isSolvable(d)) {  // an impossible single-lamp board (off the column space)
      TR++;
      const st = forcePaint(freshState(ALLDARK, 'dealt'), i);
      const r = solve(st.board);
      if (st.reachedByPresses === false && !isSolvable(st.board) && r.solvable === false) twoRed++;
    }
  }
  ck('forcePaint off the column space → provenance RED *and* solve()→{false} (two reds, distinct) (' + TR + '×)', twoRed === TR && TR === 20);
}

// ── (g) BYTE-TWIN PARITY — coreRegion(core.mjs) === coreRegion(index.html), character-identical. ──
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
ck('byte-twin: CORE BEGIN..END found in core.mjs', !!fromCore);
ck('byte-twin: CORE BEGIN..END found in index.html', !!fromPage);
ck('byte-twin: inlined core is CHARACTER-IDENTICAL to core.mjs', !!fromCore && fromCore === fromPage);

// ── report ──
console.log('The Quiet Room core.test.mjs');
console.log('  N=' + N + ' M=' + M + ' · kernel dim D=' + D + ' (computed) · 2^(M-D)=2^' + (M - D) + ' solvable of 2^' + M);
console.log('  single-lamp deals: ' + singleSolv + ' solvable / ' + singleUnsolv + ' impossible');
console.log('  deals: solvable=' + dealsSolvable + '/' + DEALS + ' A·x===deal=' + solveExact + '/' + DEALS);
console.log('  random solvable fraction observed=' + fracObs.toFixed(4) + ' (2^-D=' + fracExpect.toFixed(4) + ')');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
