// Node twin for The Dissection Bench geometry core. Zero-dep. Run: `node dissection/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold
// self-test pill and this test can never drift. It re-proves the SIX legs the in-page pill proves
// — a²+b²===c² exact, the 4 pieces sum to b², the source pieces tile one b-square (once-cov≈1),
// the assembled pieces tile the c-square (once-cov≈1), Σ piece areas === c² at EVERY swing-angle θ
// to machine-ε, and the NEG-CONTROL mis-cut drops coverage and is caught — PLUS a byte-twin parity
// row proving index.html's inlined CORE slice is char-for-char core.mjs (the established convention,
// see euclid-engine/core.test.mjs and sound-garden/the-comma/core.test.mjs).
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dist, polyArea, pointInPoly, clipToConvex, perigal, poseAt, onceCoverage, badPerigal } from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nThe Dissection Bench — Node twin (the six legs the in-page pill proves)\n');

// ── 1. a²+b² === c² (exact) for several leg pairs. ────────────────────────────
{
  let worst = 0, allOk = true;
  const pairs = [[3, 4], [5, 12], [6, 8], [2, 3], [8, 15], [7, 24]];
  for (const [x, y] of pairs) {
    const g = perigal(x, y);
    const d = Math.abs((x * x + y * y) - g.c * g.c);
    worst = Math.max(worst, d);
    if (d > 1e-9) allOk = false;
  }
  ck('a²+b² === c² (exact) across ' + pairs.length + ' leg pairs', allOk, 'worst |Δ| = ' + worst.toExponential(2));
}

const g = perigal(3, 4);

// ── 2. the 4 pieces sum to b² (=16 for the 3-4-5 tableau). ────────────────────
{
  const sum4 = g.pieces.reduce((s, p) => s + polyArea(p.srcPose), 0);
  ck('the 4 cut pieces sum === b² (=16)', Math.abs(sum4 - g.B * g.B) < 1e-9, 'Σ = ' + sum4.toFixed(9) + ' · b² = ' + (g.B * g.B));
}

// ── 3. the 4 pieces, in their SOURCE poses, tile ONE b-square (once-coverage≈1). ─
{
  const cov = onceCoverage(g.pieces.map(p => p.srcPose), g.bSquare, 140);
  ck('source pieces tile one b-square (once-cov≈1, no gap/overlap)', cov > 0.99, 'once-cov = ' + cov.toFixed(5));
}

// ── 4. the 4 pieces + a-square, in CELL poses, tile the c-square (once-cov≈1). ──
{
  const cellPolys = g.pieces.map(p => p.cellPose).concat([g.aSquareSrc]);
  const covC = onceCoverage(cellPolys, g.cell, 140);
  ck('assembled pieces tile the c-square (once-cov≈1, no gap/overlap)', covC > 0.99, 'once-cov = ' + covC.toFixed(5));
}

// ── 5. AREA CONSERVED AT EVERY SWING ANGLE — the headline claim. ──────────────
{
  let maxErr = 0;
  const target = g.c * g.c;
  for (let i = 0; i <= 80; i++) {
    const th = i / 80;
    const pose = poseAt(g, th);
    const tot = pose.pieces.reduce((s, pc) => s + polyArea(pc.poly), 0) + polyArea(pose.aPoly);
    maxErr = Math.max(maxErr, Math.abs(tot - target));
  }
  ck('Σ piece areas === c² at every θ (rigid glide conserves area to machine-ε)', maxErr < 1e-9, 'maxErr = ' + maxErr.toExponential(2));
}

// ── 6. NEG CONTROL — the mis-cut lattice fails to tile the c-square (caught). ──
{
  const bad = badPerigal(3, 4, 1.5);
  const badPolys = bad.pieces.map(p => p.cellPose).concat([bad.aSquareSrc]);
  const badCov = onceCoverage(badPolys, bad.cell, 120);
  ck('NEG-CONTROL: the mis-cut does NOT tile the c-square (caught)', badCov < 0.97, 'once-cov drops to ' + badCov.toFixed(5));
}

// ── A couple of pure-helper anchors (shoelace + clip), so the helpers are grounded too. ─
console.log('\n— Pure-helper anchors —');
{
  // a unit square has area 1 by shoelace; a 3-4-5 triangle has area 6.
  const unit = polyArea([[0, 0], [1, 0], [1, 1], [0, 1]]);
  const tri = polyArea([[0, 0], [3, 0], [0, 4]]);
  ck('shoelace: unit square area === 1, 3-4-5 right triangle area === 6', unit === 1 && tri === 6, 'unit = ' + unit + ' · tri = ' + tri);
  // clipping a big square to a small central square yields exactly the small square's area.
  const big = [[-2, -2], [2, -2], [2, 2], [-2, 2]];
  const small = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const clipped = clipToConvex(big, small);
  ck('Sutherland–Hodgman clip: big ∩ small === small (area 4)', Math.abs(polyArea(clipped) - 4) < 1e-9, 'clipped area = ' + polyArea(clipped).toFixed(9));
  // pointInPoly sanity: centre is in, far point is out.
  ck('pointInPoly: centre inside, far point outside', pointInPoly(small, 0, 0) === true && pointInPoly(small, 5, 5) === false);
  // dist sanity: the 3-4-5.
  ck('dist: |(0,0)→(3,4)| === 5', dist([0, 0], [3, 4]) === 5);
}

// ── BYTE-TWIN PARITY: index.html's inlined CORE region === core.mjs CORE, char-for-char. ──
console.log('\n— Single-source discipline (the inlined slab is the module, byte-for-byte) —');
{
  const BEGIN = '// === CORE BEGIN ===';
  const END = '// === CORE END ===';
  const region = (text) => {
    const i = text.indexOf(BEGIN), j = text.indexOf(END);
    if (i < 0 || j < 0 || j < i) return null;
    return text.slice(i, j + END.length);
  };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(here, 'index.html'), 'utf8');
  const coreReg = region(coreSrc);
  const pageReg = region(pageSrc);
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));
}

console.log('\n—— The Dissection Bench Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
