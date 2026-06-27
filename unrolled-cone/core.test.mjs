// ============================================================================
//  Node twin for THE UNROLLED CONE core (singular cone-deficit curvature).
//  Zero-dep.  Run:  node unrolled-cone/core.test.mjs  (exit 0 = green; non-0 = red)
//
//  Proves the room's CLAIM, not merely that the code runs:
//   (G) INTRINSIC FLATNESS — the first fundamental form is E=1, F=0, G=r² at EVERY
//       fold f and α (the fold is an isometry; the cone is flat off the apex).
//   (1) DISCRETE GAUSS–BONNET DUALITY — for a loop enclosing the apex once, the
//       transport holonomy H == 2π − ∮κ_g ds to <1e-12 (turning + spike = 2π).
//   (2) EXACT ANCHOR + SHAPE-INDEPENDENCE — across 7 α × 5 differently-shaped
//       enclosing loops, H === δ(α)=2π(1−sinα) AND ∮κ_g ds == 2π−δ. δ is read from
//       the cut geometry; ∮κ_g ds is measured from the developed turning ALONE — two
//       independent computations agreeing kills circularity and proves the deficit
//       is shape-free (all the curvature is the single apex spike).
//   (3) NEG-CONTROL (MISS THE POINT) — a loop that does NOT enclose the apex returns
//       the arrow UNROTATED (H==0 exactly) and turns the full 2π — flat paper.
//   (4) FLAT PER STEP — every per-step local turn dψ === 0 EXACTLY (the felt
//       reveal: nothing turns while you walk; the whole twist lives at the seam).
//   (5) WEDGE CLOSURE — δ(α) + Φ(α) == 2π over a 200-point α sweep (the kept fan
//       plus the cut wedge is always a full turn).
//   (6) WINDING-2 — a loop that circles the apex twice comes home rotated by 2δ.
//   (7) BYTE-TWIN PARITY — the inlined CORE slab in index.html is byte-identical
//       (indentation-normalised) to core.mjs, so page/pill/twin never drift.
// ============================================================================

import {
  fanAngle, deficit, alphaOfDeficit, baseRadius, coneHeight,
  sigmaOfFold, embed, dP_dr, dP_dphi, firstForm,
  densify, unwrapFan, transportArrow, geodesicTurning,
  enclosingLoop, nonEnclosingLoop,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const EPS = 1e-12;
const TAU = 2 * Math.PI;
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// five gentle, simple, well-separated loop shapes r(t), t∈[0,1) — circle, oval,
// 3-lobe, 5-lobe, and an off-balance blob — all strictly positive, turns < π.
const SHAPES = [
  { name: 'circle',  fn: t => 0.60 },
  { name: 'oval',    fn: t => 0.52 + 0.16 * Math.cos(2 * TAU * t) },
  { name: '3-lobe',  fn: t => 0.52 + 0.11 * Math.cos(3 * TAU * t) },
  { name: '5-lobe',  fn: t => 0.52 + 0.08 * Math.cos(5 * TAU * t) },
  { name: 'blob',    fn: t => 0.52 + 0.12 * Math.sin(TAU * t) + 0.06 * Math.cos(2 * TAU * t) },
];
const ALPHAS = [0.20, 0.40, Math.PI / 6, 0.80, 1.00, 1.20, 1.40];

// ── (G) INTRINSIC FLATNESS: E=1, F=0, G=r² for every fold f and α ────────────
{
  let maxE = 0, maxF = 0, maxG = 0;
  for (const alpha of [0.3, Math.PI/6, 0.9, 1.3]){
    for (const f of [0, 0.25, 0.5, 0.75, 1]){
      for (const r of [0.1, 0.4, 0.85]){
        for (const phi of [0.05, 0.3, fanAngle(alpha) * 0.6]){
          const { E, F, G } = firstForm(r, phi, f, alpha);
          maxE = Math.max(maxE, Math.abs(E - 1));
          maxF = Math.max(maxF, Math.abs(F));
          maxG = Math.max(maxG, Math.abs(G - r * r));
        }
      }
    }
  }
  check('(G) first form E=1, F=0, G=r² at every fold f & α  (isometry ⇒ intrinsically flat)',
    maxE < EPS && maxF < EPS && maxG < EPS,
    '|E−1| ' + maxE.toExponential(2) + ' · |F| ' + maxF.toExponential(2) + ' · |G−r²| ' + maxG.toExponential(2));
}

// ── (1) DISCRETE GAUSS–BONNET DUALITY: H == 2π − ∮κ_g ds (enclosing, winding 1) ─
{
  let maxErr = 0, worst = '';
  for (const alpha of ALPHAS){
    for (const sh of SHAPES){
      const loop = enclosingLoop(alpha, sh.fn, 360);
      const H = transportArrow(loop, alpha).netDelta;
      const kg = geodesicTurning(loop, alpha);
      const e = Math.abs(H - (TAU - kg));
      if (e > maxErr){ maxErr = e; worst = 'α=' + alpha.toFixed(2) + ' ' + sh.name; }
    }
  }
  check('(1) H == 2π − ∮κ_g ds  (7α × 5 shapes; discrete Gauss–Bonnet)',
    maxErr < EPS, 'max |Δ| ' + maxErr.toExponential(2) + ' @' + worst);
}

// ── (2) EXACT ANCHOR + SHAPE-INDEPENDENCE: H===δ AND ∮κ_g==2π−δ, all α × shapes ─
{
  let maxH = 0, maxKg = 0, worst = '';
  for (const alpha of ALPHAS){
    const d = deficit(alpha);
    for (const sh of SHAPES){
      const loop = enclosingLoop(alpha, sh.fn, 360);
      const H = transportArrow(loop, alpha).netDelta;
      const kg = geodesicTurning(loop, alpha);
      const eH = Math.abs(H - d), eK = Math.abs(kg - (TAU - d));
      if (eH > maxH){ maxH = eH; }
      if (eK > maxKg){ maxKg = eK; worst = 'α=' + alpha.toFixed(2) + ' ' + sh.name; }
    }
  }
  check('(2) H === δ(α)=2π(1−sinα) AND ∮κ_g ds == 2π−δ  (7α × 5 shapes; shape-free)',
    maxH < EPS && maxKg < EPS,
    'max |H−δ| ' + maxH.toExponential(2) + ' · max |∮κ_g−(2π−δ)| ' + maxKg.toExponential(2) + ' @' + worst);

  // honesty: the deficit is NOT a free parameter — it round-trips through α exactly.
  let rt = 0;
  for (const alpha of ALPHAS) rt = Math.max(rt, Math.abs(alphaOfDeficit(deficit(alpha)) - alpha));
  check('(2′) HONESTY: alphaOfDeficit(deficit(α)) === α  (the deficit law is invertible, not fitted)',
    rt < EPS, 'max |Δα| ' + rt.toExponential(2));
}

// ── (3) NEG-CONTROL (MISS THE POINT): non-enclosing H==0, turning==2π ─────────
{
  let maxH = 0, maxKg = 0;
  for (const alpha of [0.3, Math.PI/6, 0.9, 1.25]){
    for (const c of [[1.2, 0.0, 0.35], [0.9, 0.6, 0.3], [1.5, -0.4, 0.45], [0.8, 0.0, 0.5]]){
      const loop = nonEnclosingLoop(c[0], c[1], c[2], 240, alpha);
      maxH = Math.max(maxH, Math.abs(transportArrow(loop, alpha).netDelta));
      maxKg = Math.max(maxKg, Math.abs(geodesicTurning(loop, alpha) - TAU));
    }
  }
  check('(3) NEG-CONTROL: miss the apex ⇒ H == 0 exactly, ∮κ_g ds == 2π  (flat paper)',
    maxH === 0 && maxKg < EPS, 'max |H| ' + maxH.toExponential(2) + ' · max |∮κ_g−2π| ' + maxKg.toExponential(2));
}

// ── (4) FLAT PER STEP: every dψ === 0 EXACTLY ────────────────────────────────
{
  let allZero = true, count = 0;
  for (const alpha of [0.25, 0.7, 1.1]){
    for (const sh of SHAPES){
      const loop = enclosingLoop(alpha, sh.fn, 200);
      const { dpsi } = transportArrow(loop, alpha);
      for (const d of dpsi){ count++; if (d !== 0) allZero = false; }
    }
  }
  check('(4) FLAT per step: every Levi-Civita dψ === 0 exactly  (' + count + ' steps; nothing turns as you walk)',
    allZero, allZero ? 'all 0' : 'a step turned');
}

// ── (5) WEDGE CLOSURE: δ(α) + Φ(α) == 2π over a 200-point α sweep ─────────────
{
  let maxErr = 0;
  for (let i = 0; i <= 200; i++){
    const alpha = (i / 200) * (Math.PI / 2);     // α ∈ [0, π/2]
    maxErr = Math.max(maxErr, Math.abs(deficit(alpha) + fanAngle(alpha) - TAU));
  }
  check('(5) δ(α) + Φ(α) === 2π  (200-pt α sweep; kept fan + cut wedge = one full turn)',
    maxErr < EPS, 'max |Δ| ' + maxErr.toExponential(2));
}

// ── (6) WINDING-2: a doubly-wound loop comes home rotated by 2δ ──────────────
{
  let maxErr = 0, worst = '';
  for (const alpha of [0.3, Math.PI/6, 0.9, 1.3]){
    const loop = enclosingLoop(alpha, t => 0.55, 720, 2);
    const H = transportArrow(loop, alpha).netDelta;
    const e = Math.abs(H - 2 * deficit(alpha));
    if (e > maxErr){ maxErr = e; worst = 'α=' + alpha.toFixed(2); }
    if (transportArrow(loop, alpha).winding !== 2) { maxErr = 9; worst = 'winding≠2 @' + alpha.toFixed(2); }
  }
  check('(6) WINDING-2: circle the apex twice ⇒ H === 2δ (winding number read = 2)',
    maxErr < EPS, 'max |H−2δ| ' + maxErr.toExponential(2) + ' @' + worst);
}

// ── plumbing: baseRadius/coneHeight close the right triangle; unwrapFan winds ──
{
  let triErr = 0;
  for (const alpha of [0.3, 0.8, 1.2]){
    for (const L of [1, 2.5]){
      const b = baseRadius(L, alpha), h = coneHeight(L, alpha);
      triErr = Math.max(triErr, Math.abs(Math.hypot(b, h) - L));
    }
  }
  // unwrapFan: a raw fan path crossing the slit once must unwrap to one full 2π turn.
  const alpha = Math.PI / 6, Phi = fanAngle(alpha);
  const raw = [];
  for (let i = 0; i <= 400; i++) raw.push({ r: 0.6, b: (Phi * (i / 400)) % Phi });
  // nudge the last point just past the slit so it registers a wrap-free single turn
  const unrolled = unwrapFan(raw, Phi);
  const dthSpan = unrolled[unrolled.length - 1].th - unrolled[0].th;
  check('(plumbing) base²+height²=slant² (right triangle) & unwrapFan spans one 2π turn',
    triErr < EPS && Math.abs(dthSpan - TAU) < 1e-9,
    'tri ' + triErr.toExponential(2) + ' · fan span ' + dthSpan.toFixed(6));
}

// ── densify sanity (copied verbatim from holonomy): preserves endpoints ──────
{
  const p = [{ r: 0.2, th: 0 }, { r: 0.5, th: 1 }, { r: 0.3, th: 2 }];
  const d = densify(p, 16);
  const ok = d.length === 2 * 16 + 1 &&
    Math.abs(d[0].r - 0.2) < EPS && Math.abs(d[d.length-1].r - 0.3) < EPS;
  check('(densify) endpoint-preserving fine resample', ok, 'len ' + d.length);
}

// ── (7) BYTE-TWIN PARITY: the page's inlined CORE slab === core.mjs slab ──────
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN = '// === CONE CORE BEGIN ===';
const END = '// === CONE CORE END ===';
function region(text){
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s){
  return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n');
}
const coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8'));
let pageRegion = null;
try { pageRegion = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch {}
check('(7) byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
check('(7) byte-parity: index.html inlined core === core.mjs (norm)',
  !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
  pageRegion ? '' : 'index.html not built yet (run forge)');

console.log('\nThe Unrolled Cone — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
