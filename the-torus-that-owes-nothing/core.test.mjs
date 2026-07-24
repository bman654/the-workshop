// ============================================================================
//  THE TORUS THAT OWES NOTHING — core.test.mjs (the Node twin).
//
//  Proves the Gauss-Bonnet claim EXACT by integrating the UN-simplified product
//  K(θ)·r(R+r cosθ), so a coding slip in either factor cannot hide behind the
//  cancellation:
//    (1) BOOKS BALANCE — ∮∮ K dA over the whole torus ≈ 0 (< 1e-9).
//    (2) THE SPLIT      — outer belt (cosθ>0) ≈ +4π, inner throat (cosθ<0) ≈ −4π
//        — the credit-then-payback the accountant's dial claims.
//    (3) INVARIANCE     — total≈0, outer≈+4π, inner≈−4π across a GRID of (R,r),
//        because K·dA = cosθ dθ dφ is R,r-independent. A hand-tuned fudge fails.
//    (4) NEG-CONTROL    — the sphere totals +4π = 2π·χ_sphere (χ=2) ≠ 0 across
//        several radii a, so "totals 0" genuinely distinguishes the torus's
//        topology; a mislabeled / ill-conditioned integral can't silently read 0.
//    (5) DIAL ↔ PROOF   — the closed-form ledger() the on-page dial is driven by
//        cannot drift from the quadrature: ledger(π/2)=+4π equals the outer-sum
//        and ledger(3π/2)=0 equals the total; bandLedger→0 at the zero-circles.
//    (e) SLAB PARITY    — the inlined CORE slab in index.html is byte-identical
//        (indentation-normalised) to core.mjs.
//
//  Run:  node the-torus-that-owes-nothing/core.test.mjs   (exit 0 = all green)
// ============================================================================
import { K, bandLedger, ledger, torusTotal, sphereTotal, dialState } from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TAU = 2 * Math.PI, FOURPI = 4 * Math.PI;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail) {
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// ── (1) BOOKS BALANCE — the whole-torus tally is 0 ────────────────────────────
{
  const { total } = torusTotal(1.9, 0.72, 800);
  check('(1) ∮∮ K dA over the torus = 0 (< 1e-9)', Math.abs(total) < 1e-9, 'total=' + total.toExponential(3));
}

// ── (2) THE SPLIT — +4π outer belt, −4π inner throat ──────────────────────────
{
  const { outer, inner } = torusTotal(1.9, 0.72, 800);
  check('(2) outer belt (cosθ>0) = +4π (< 1e-4)', Math.abs(outer - FOURPI) < 1e-4, 'outer=' + outer.toFixed(8) + ' 4π=' + FOURPI.toFixed(8));
  check('(2) inner throat (cosθ<0) = −4π (< 1e-4)', Math.abs(inner + FOURPI) < 1e-4, 'inner=' + inner.toFixed(8));
  check('(2) belt pays exactly what the throat owes (outer = −inner)', Math.abs(outer + inner) < 1e-9, 'sum=' + (outer + inner).toExponential(3));
}

// ── (3) INVARIANCE — R,r-independent, because K·dA = cosθ dθ dφ ────────────────
{
  const grid = [[1.5, 0.4], [1.9, 0.72], [3, 1], [2, 0.9]];
  let maxTot = 0, maxOut = 0, maxIn = 0;
  for (const [R, r] of grid) {
    const t = torusTotal(R, r, 800);
    maxTot = Math.max(maxTot, Math.abs(t.total));
    maxOut = Math.max(maxOut, Math.abs(t.outer - FOURPI));
    maxIn = Math.max(maxIn, Math.abs(t.inner + FOURPI));
  }
  check('(3) total = 0 across the (R,r) grid (< 1e-9)', maxTot < 1e-9, 'max|total|=' + maxTot.toExponential(3));
  check('(3) outer = +4π across the (R,r) grid (< 1e-4)', maxOut < 1e-4, 'max|Δouter|=' + maxOut.toExponential(3));
  check('(3) inner = −4π across the (R,r) grid (< 1e-4)', maxIn < 1e-4, 'max|Δinner|=' + maxIn.toExponential(3));
}

// ── (4) NEG-CONTROL — the sphere totals +4π ≠ 0 (χ=2, distinguishes topology) ──
{
  let maxErr = 0;
  for (const a of [0.5, 1, 2.3, 7]) maxErr = Math.max(maxErr, Math.abs(sphereTotal(a, 800) - FOURPI));
  check('(4) sphere ∮ K dA = +4π = 2π·χ_sphere (χ=2), several radii (< 1e-4)', maxErr < 1e-4, 'max|Δ|=' + maxErr.toExponential(3));
  const s = sphereTotal(1, 800);
  check('(4) sphere total (+4π) is NOT 0 — the tally really reads topology', Math.abs(s) > 1, 's=' + s.toFixed(6) + ' vs torus 0');
}

// ── (5) DIAL ↔ PROOF — the closed-form dial cannot drift from the quadrature ───
{
  check('(5) ledger(−π/2) = 0 (dial home / pass start)', Math.abs(ledger(-Math.PI / 2)) < 1e-12, 'L=' + ledger(-Math.PI / 2).toExponential(2));
  check('(5) ledger(π/2) = +4π (the engraved peak)', Math.abs(ledger(Math.PI / 2) - FOURPI) < 1e-12, 'L=' + ledger(Math.PI / 2).toFixed(9));
  check('(5) ledger(3π/2) = 0 (pointer LANDS on 0 — owes nothing)', Math.abs(ledger(3 * Math.PI / 2)) < 1e-12, 'L=' + ledger(3 * Math.PI / 2).toExponential(2));
  // the dial's engraved endpoints equal the quadrature's outer-sum and total
  const t = torusTotal(1.9, 0.72, 800);
  check('(5) ledger(π/2) == quadrature outer-sum (< 1e-4)', Math.abs(ledger(Math.PI / 2) - t.outer) < 1e-4, 'peak=' + ledger(Math.PI / 2).toFixed(6) + ' outer=' + t.outer.toFixed(6));
  check('(5) ledger(3π/2) == quadrature total (< 1e-9)', Math.abs(ledger(3 * Math.PI / 2) - t.total) < 1e-9, 'end=' + ledger(3 * Math.PI / 2).toExponential(2) + ' total=' + t.total.toExponential(2));
  // the felt beat: the band increment goes SLACK (→0) at BOTH zero-circles
  check('(5) bandLedger(±π/2) = 0 at the zero-circles (the felt beat)',
    Math.abs(bandLedger(Math.PI / 2)) < 1e-12 && Math.abs(bandLedger(-Math.PI / 2)) < 1e-12,
    '+π/2→' + bandLedger(Math.PI / 2).toExponential(2) + '  −π/2→' + bandLedger(-Math.PI / 2).toExponential(2));
  // and it is max +2π at the outer equator, min −2π at the inner throat
  check('(5) bandLedger: +2π at outer equator (θ=0), −2π at throat (θ=π)',
    Math.abs(bandLedger(0) - TAU) < 1e-12 && Math.abs(bandLedger(Math.PI) + TAU) < 1e-12,
    '0→' + bandLedger(0).toFixed(6) + '  π→' + bandLedger(Math.PI).toFixed(6));
  // dialState monotone-travel + closes at the end
  const d0 = dialState(-Math.PI / 2), dMid = dialState(Math.PI / 2), dEnd = dialState(3 * Math.PI / 2);
  check('(5) dialState: frac runs 0 → 0.5 → 1 across the pass', Math.abs(d0.frac) < 1e-9 && Math.abs(dMid.frac - 0.5) < 1e-9 && Math.abs(dEnd.frac - 1) < 1e-9,
    d0.frac.toFixed(3) + ' / ' + dMid.frac.toFixed(3) + ' / ' + dEnd.frac.toFixed(3));
  check('(5) dialState: phase is credit on the belt, payback in the throat', dialState(0).phase === 'credit' && dialState(Math.PI).phase === 'payback');
  check('(5) dialState: the account CLOSES at pass end (L≈0, closed=true)', dEnd.closed === true && Math.abs(dEnd.L) < 1e-6, 'L_end=' + dEnd.L.toExponential(2));
}

// ── (e) SLAB PARITY: inlined CORE slab in index.html === core.mjs slab ─────────
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN = '// === TORUS CORE BEGIN ===';
const END = '// === TORUS CORE END ===';
function region(text) {
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s) {
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
let pageRegion = null;
try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
check('(e) byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
check('(e) byte-parity: index.html inlined core === core.mjs (norm)',
  !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
  pageRegion ? '' : 'index.html not built yet (run forge)');

console.log('\nThe Torus That Owes Nothing — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
