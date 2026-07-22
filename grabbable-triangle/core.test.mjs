// ============================================================================
//  THE GRABBABLE TRIANGLE — core.test.mjs (the Node twin).
//
//  Proves the Gauss-Bonnet claim EXACT, on both surfaces, by GENUINELY INDEPENDENT
//  routes — a theorem-check, not a tautology:
//    (1) OCTANT ANCHOR — the three-right-angle octant reads 270.000000000° /
//        excess = π/2 on THREE independent routes (tangent angles · Van Oosterom
//        solid angle · l'Huilier side-lengths) to 1e-12.
//    (2) SWEEP EQUALITY — over a deterministic-PRNG battery, the tangent-plane
//        excess equals K·area (area from a positional route) on BOTH the sphere
//        and the Poincaré-disk hyperbolic plane, to <1e-9.
//    (3) SIGN & MONOTONICITY — shrink→0, grow (bigger triangle → bigger excess),
//        collinear→0; sphere excess > 0, hyperbolic excess < 0.
//    (4) NEG-CONTROL — recompute the angles with the STRAIGHT SCREEN CHORD in place
//        of the geodesic tangent: the octant collapses to EXACTLY 0 ≠ π/2, and the
//        chord "excess" is ~0 for every swept triangle while differing from the
//        honest excess by >0.1. A π/2 reading can ONLY come from honest geodesics.
//    (5) DIAL CONTINUITY — the one warp family is smooth through the flat detent:
//        excess passes through 0 at K=0, and matches the closed-form sphere/disk
//        routes at K=±1 for the same polar corners.
//    (e) SLAB PARITY — the inlined CORE slab in index.html is byte-identical
//        (indentation-normalised) to core.mjs.
//
//  Run:  node grabbable-triangle/core.test.mjs   (exit 0 = all green)
// ============================================================================
import {
  dot3, cross3, sub3, norm3, clampAcos,
  spherePointFromPolar, sphereGeoTangent, sphereAngleAt, sphereExcessAngles,
  sphereExcessVOS, sphereSide, lhuilierSphere, greatCircleArc,
  poincareToHyperboloid, hyperboloidToPoincare, mink, hypDist, hypAngleAt,
  hypExcessAngles, hypSide, lhuilierHyperbolic, poincarePointFromPolar,
  poincareGeodesicArc,
  polarDistance, angleFromSides, triangleReckoning,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

// the OCTANT: three right angles at +x, +y, +z on the unit sphere.
const OCT = [[1,0,0],[0,1,0],[0,0,1]];

// ── (1) OCTANT ANCHOR — 270° / excess π/2 on THREE independent routes ─────────
{
  const [A,B,C] = OCT;
  const eAng = sphereExcessAngles(A,B,C);                 // tangent-plane angles
  const eVOS = Math.abs(sphereExcessVOS(A,B,C));          // Van Oosterom solid angle
  const eLh  = lhuilierSphere(sphereSide(B,C), sphereSide(C,A), sphereSide(A,B)); // sides
  const sumDeg = (sphereAngleAt(A,B,C)+sphereAngleAt(B,C,A)+sphereAngleAt(C,A,B))*180/Math.PI;
  check('(1) octant angle-sum = 270.000000000°', Math.abs(sumDeg - 270) < 1e-9, 'sum=' + sumDeg.toFixed(9) + '°');
  check('(1) octant excess = π/2 · route A (tangent angles)', Math.abs(eAng - Math.PI/2) < 1e-12, 'e=' + eAng.toFixed(15));
  check('(1) octant excess = π/2 · route B (Van Oosterom–Strackee)', Math.abs(eVOS - Math.PI/2) < 1e-12, 'e=' + eVOS.toFixed(15));
  check('(1) octant excess = π/2 · route C (l\'Huilier side-lengths)', Math.abs(eLh - Math.PI/2) < 1e-12, 'e=' + eLh.toFixed(15));
  check('(1) three independent routes AGREE to 1e-12', Math.abs(eAng-eVOS) < 1e-12 && Math.abs(eAng-eLh) < 1e-12,
    'A−B=' + Math.abs(eAng-eVOS).toExponential(2) + ' A−C=' + Math.abs(eAng-eLh).toExponential(2));
  // octant area = 1/8 of the unit sphere = π/2, and = excess (K=1,R=1)
  check('(1) octant area = π/2 = one-eighth of the sphere (= excess, K=R=1)', Math.abs(eVOS - Math.PI/2) < 1e-12);
}

// ── helpers to build random non-degenerate triangles ──────────────────────────
function randSpherePt(r){ // random unit vector
  let x, y, z, L;
  do { x = 2*r()-1; y = 2*r()-1; z = 2*r()-1; L = Math.hypot(x,y,z); } while (L < 0.2);
  return [x/L, y/L, z/L];
}
function randDiskPt(r, maxRad){ // random hyperboloid pt from a disk pt within maxRad
  const rr = maxRad * Math.sqrt(r()), th = 2*Math.PI*r();
  return poincareToHyperboloid(rr*Math.cos(th), rr*Math.sin(th));
}

// ── (2) SWEEP EQUALITY — excessAngles == K·area on BOTH surfaces, <1e-9 ────────
{
  // SPHERE (K=+1): tangent-angle excess == positional Van Oosterom excess (= area).
  const r = mulberry32(0xA17C3);
  let maxErrS = 0, worstS = '', nS = 0;
  for (let s = 0; s < 400; s++){
    const A = randSpherePt(r), B = randSpherePt(r), C = randSpherePt(r);
    const eAng = sphereExcessAngles(A,B,C);
    if (eAng < 0.05 || eAng > 2*Math.PI - 0.2) continue;     // skip tiny/near-whole
    const area = Math.abs(sphereExcessVOS(A,B,C));            // positional area (K=1)
    const err = Math.abs(eAng - (+1)*area);                  // K·area, K=+1
    if (err > maxErrS){ maxErrS = err; worstS = 'e=' + eAng.toFixed(3); }
    nS++;
  }
  check('(2) SPHERE sweep: Σα−π == +area (angles vs solid-angle), <1e-9',
    maxErrS < 1e-9 && nS > 100, 'max|Δ|=' + maxErrS.toExponential(2) + ' over ' + nS + ' tris');

  // HYPERBOLIC (K=−1): tangent-angle excess == −area (area from l'Huilier sides).
  const rh = mulberry32(0xB22D1);
  let maxErrH = 0, nH = 0;
  for (let s = 0; s < 400; s++){
    const A = randDiskPt(rh, 0.85), B = randDiskPt(rh, 0.85), C = randDiskPt(rh, 0.85);
    const eAng = hypExcessAngles(A,B,C);                      // negative
    if (eAng > -0.05) continue;                              // skip near-degenerate
    const area = lhuilierHyperbolic(hypSide(B,C), hypSide(C,A), hypSide(A,B)); // positive
    const err = Math.abs(eAng - (-1)*area);                  // K·area, K=−1
    if (err > maxErrH) maxErrH = err;
    nH++;
  }
  check('(2) HYPERBOLIC sweep: Σα−π == −area (angles vs l\'Huilier), <1e-9',
    maxErrH < 1e-9 && nH > 100, 'max|Δ|=' + maxErrH.toExponential(2) + ' over ' + nH + ' tris');
}

// ── (3) SIGN & MONOTONICITY ──────────────────────────────────────────────────
{
  // shrink a sphere triangle toward a point → excess → 0
  const tiny = [spherePointFromPolar(0.02, 0), spherePointFromPolar(0.02, 2.1), spherePointFromPolar(0.02, 4.2)];
  const eTiny = sphereExcessAngles(tiny[0], tiny[1], tiny[2]);
  check('(3) sphere: shrink→0 (excess ~ r²·K → tiny)', eTiny > 0 && eTiny < 1e-3, 'e=' + eTiny.toExponential(2));
  // grow: a bigger sphere triangle has bigger excess (monotone in scale)
  const small = [spherePointFromPolar(0.3,0), spherePointFromPolar(0.3,2.1), spherePointFromPolar(0.3,4.2)];
  const big   = [spherePointFromPolar(0.9,0), spherePointFromPolar(0.9,2.1), spherePointFromPolar(0.9,4.2)];
  const eSmall = sphereExcessAngles(...small), eBig = sphereExcessAngles(...big);
  check('(3) sphere: grow → bigger excess (monotone, both >0)', eBig > eSmall && eSmall > 0, 'small=' + eSmall.toFixed(3) + ' big=' + eBig.toFixed(3));
  // collinear (three points on a great circle: equator) → degenerate → excess 0
  const eq = [[1,0,0],[Math.cos(1),Math.sin(1),0],[Math.cos(2),Math.sin(2),0]];
  const eCol = sphereExcessAngles(...eq);
  check('(3) sphere: collinear (great-circle) → excess ~0', Math.abs(eCol) < 1e-6, 'e=' + eCol.toExponential(2));
  // hyperbolic sign: negative
  const H = [poincareToHyperboloid(0.4,0.1), poincareToHyperboloid(-0.3,0.4), poincareToHyperboloid(-0.1,-0.5)];
  const eH = hypExcessAngles(...H);
  check('(3) hyperbolic: excess < 0 (angles fall short)', eH < 0, 'e=' + eH.toFixed(4));
}

// ── (4) NEG-CONTROL — straight screen chords collapse the excess to 0 ─────────
// the interior angle measured with the STRAIGHT chord direction (not the geodesic
// tangent): for the sphere the chord triangle is planar-Euclidean → sum = π.
function chordAngleAt(A, B, C){
  const tB = norm3(sub3(B, A)), tC = norm3(sub3(C, A));
  return clampAcos(dot3(tB, tC));
}
function chordExcess(A, B, C){ return chordAngleAt(A,B,C) + chordAngleAt(B,C,A) + chordAngleAt(C,A,B) - Math.PI; }
{
  const [A,B,C] = OCT;
  const eChord = chordExcess(A,B,C), eGeo = sphereExcessAngles(A,B,C);
  check('(4) NEG-CONTROL: octant chord excess = EXACTLY 0 (flat, 180°)', Math.abs(eChord) < 1e-9, 'chord=' + eChord.toExponential(2));
  check('(4) NEG-CONTROL: honest−chord gap = π/2 (>0.1) — the edges truly curve', Math.abs(eGeo - eChord) > 0.1, 'gap=' + (eGeo-eChord).toFixed(4));
  // across a sweep: chord excess ~0 always, and the gap to honest excess >0.1
  const r = mulberry32(0xC0FFEE);
  let maxChord = 0, minGap = Infinity, n = 0;
  for (let s = 0; s < 500; s++){
    const P = randSpherePt(r), Q = randSpherePt(r), R = randSpherePt(r);
    const eGe = sphereExcessAngles(P,Q,R);
    if (eGe < 0.15 || eGe > 2*Math.PI - 0.3) continue;       // healthy, non-tiny band
    const eCh = chordExcess(P,Q,R);
    maxChord = Math.max(maxChord, Math.abs(eCh));
    minGap = Math.min(minGap, Math.abs(eGe - eCh));
    n++;
  }
  check('(4) NEG-CONTROL sweep: chord excess ~0 (<1e-9) for every triangle', maxChord < 1e-9 && n > 100, 'max=' + maxChord.toExponential(2) + ' n=' + n);
  check('(4) NEG-CONTROL sweep: honest−chord gap > 0.1 always', minGap > 0.1, 'min gap=' + minGap.toFixed(4));
}

// ── (5) DIAL CONTINUITY — one warp family, smooth through the flat detent ──────
{
  // three fixed polar corners
  const corners = [{r:0.6, theta:0.3}, {r:0.7, theta:2.4}, {r:0.55, theta:4.5}];
  // detent K=0 → excess ~ 0 (Euclid)
  const flat = triangleReckoning(corners, 0);
  check('(5) dial: K=0 detent → excess = 0 (Euclid, 180°)', Math.abs(flat.signedExcess) < 1e-12, 'e=' + flat.signedExcess.toExponential(2));
  // continuity: excess passes smoothly through 0 as K crosses 0
  const ePlus = triangleReckoning(corners, 0.02).signedExcess;
  const eMinus = triangleReckoning(corners, -0.02).signedExcess;
  check('(5) dial: excess sign follows K across the detent (+→0→−)', ePlus > 0 && eMinus < 0 && Math.abs(ePlus) < 0.02 && Math.abs(eMinus) < 0.02,
    'K+0.02→' + ePlus.toExponential(2) + '  K−0.02→' + eMinus.toExponential(2));
  // area = excess/K holds (Gauss-Bonnet) for K≠0
  const rk = triangleReckoning(corners, 1.3);
  check('(5) dial: area = excess/K (Gauss-Bonnet) at K=1.3', Math.abs(rk.area - rk.signedExcess/1.3) < 1e-12, 'area=' + rk.area.toFixed(6));
  // the warp family at K=+1 matches the closed-form sphere route for the SAME corners
  const A = spherePointFromPolar(corners[0].r, corners[0].theta);
  const B = spherePointFromPolar(corners[1].r, corners[1].theta);
  const Cc = spherePointFromPolar(corners[2].r, corners[2].theta);
  const eWarp = triangleReckoning(corners, 1).signedExcess;
  const eClosed = sphereExcessAngles(A, B, Cc);
  check('(5) dial K=+1 == closed-form sphere route (same corners), <1e-9', Math.abs(eWarp - eClosed) < 1e-9,
    'warp=' + eWarp.toFixed(9) + ' closed=' + eClosed.toFixed(9));
  // and at K=−1 matches the closed-form Poincaré route for the same polar corners
  const HP = corners.map(p => poincareToHyperboloid(...poincarePointFromPolar(p.r, p.theta)));
  const eWarpN = triangleReckoning(corners, -1).signedExcess;
  const eClosedN = hypExcessAngles(HP[0], HP[1], HP[2]);
  check('(5) dial K=−1 == closed-form Poincaré route (same corners), <1e-9', Math.abs(eWarpN - eClosedN) < 1e-9,
    'warp=' + eWarpN.toFixed(9) + ' closed=' + eClosedN.toFixed(9));
}

// ── extra sanity: geodesic polylines are honestly CURVED (not chords) ──────────
{
  // great-circle arc midpoint sits OFF the chord midpoint (bulges outward)
  const arc = greatCircleArc([1,0,0],[0,1,0], 8);
  const mid = arc[4], chordMid = [0.5,0.5,0];
  const bulge = Math.hypot(mid[0]-chordMid[0], mid[1]-chordMid[1], mid[2]-chordMid[2]);
  check('(x) great-circle arc is CURVED (midpoint off chord)', bulge > 0.05, 'bulge=' + bulge.toFixed(3));
  // Poincaré arc between two off-centre points is curved (not a straight segment)
  const parc = poincareGeodesicArc([0.5,0.1],[-0.1,0.5], 8);
  const pm = parc[4], pcm = [0.2, 0.3];
  const pbulge = Math.hypot(pm[0]-pcm[0], pm[1]-pcm[1]);
  check('(x) Poincaré geodesic arc is CURVED (midpoint off chord)', pbulge > 0.02, 'bulge=' + pbulge.toFixed(3));
}

// ── (e) SLAB PARITY: inlined CORE slab in index.html === core.mjs slab ─────────
const here = dirname(fileURLToPath(import.meta.url));
const BEGIN = '// === TRIANGLE CORE BEGIN ===';
const END = '// === TRIANGLE CORE END ===';
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
check('(e) byte-parity: CORE sentinels present in core.mjs', !!coreRegion);
check('(e) byte-parity: index.html inlined core === core.mjs (norm)',
  !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion),
  pageRegion ? '' : 'index.html not built yet (run forge)');

console.log('\nThe Grabbable Triangle — core.test.mjs');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
