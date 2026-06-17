/* ═══════════════════════════════════════════════════════════════════════════
   Pick & the Wheel — the headless twin. Proves the four director claims (a–d)
   plus four guards (e–h). Run:  node pick-and-wheel/core.test.mjs
   Prints "N/N passed", exits 0 on all-green, 1 on any failure.

   This is the SAME core the page renders from (core.mjs), so a green twin is a
   green page — the two roads agree on hundreds of random shapes, not just the demo.
   ═══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  wheelArea, pick, pickWithHoles, gcd, shoelace, boundaryPoints,
  classifyNodes, vertsBBox, isSimple, SPE_TEST,
} from './core.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));

let pass = 0, total = 0;
const fails = [];
function ok(cond, label){
  total++;
  if(cond){ pass++; console.log('  ✓ ' + label); }
  else { fails.push(label); console.log('  ✗ ' + label); }
}

// ── seeded PRNG (mulberry32) — determinism is a tested claim (f) ──
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const SEED = 0x9E3779B1;

// ── lattice-polygon generators on the board envelope [-4..4]² ──
function convexHull(pts){
  pts = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo = [];
  for(const p of pts){ while(lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = [];
  for(let i = pts.length - 1; i >= 0; i--){ const p = pts[i]; while(up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function randPt(rnd){ return { x: Math.floor(rnd() * 9) - 4, y: Math.floor(rnd() * 9) - 4 }; }

// A convex lattice polygon (hull of random points). Always simple.
function randConvex(rnd){
  const k = 4 + Math.floor(rnd() * 5);
  const pts = [];
  for(let i = 0; i < k; i++) pts.push(randPt(rnd));
  const V = convexHull(pts);
  return (V.length >= 3 && Math.abs(shoelace(V)) >= 0.5) ? V : null;
}

// A NON-convex simple polygon: start from a convex hull and dent ONE edge inward
// by inserting a midpoint pulled toward the centroid (stays simple, gains a reflex
// vertex). Reject if it goes non-simple or degenerate.
function randNonConvex(rnd){
  const base = randConvex(rnd);
  if(!base || base.length < 4) return null;
  const cx = base.reduce((s, p) => s + p.x, 0) / base.length;
  const cy = base.reduce((s, p) => s + p.y, 0) / base.length;
  const i = Math.floor(rnd() * base.length);
  const a = base[i], b = base[(i + 1) % base.length];
  // candidate dent: the edge midpoint nudged toward the centroid, snapped to lattice
  const mx = Math.round((a.x + b.x) / 2 + Math.sign(cx - (a.x + b.x) / 2));
  const my = Math.round((a.y + b.y) / 2 + Math.sign(cy - (a.y + b.y) / 2));
  const dent = { x: mx, y: my };
  if(base.some(p => p.x === dent.x && p.y === dent.y)) return null;
  const V = base.slice(0, i + 1).concat([dent], base.slice(i + 1));
  // dedupe consecutive equal points
  const clean = V.filter((p, k2) => { const q = V[(k2 - 1 + V.length) % V.length]; return !(p.x === q.x && p.y === q.y); });
  if(clean.length < 4 || !isSimple(clean) || Math.abs(shoelace(clean)) < 0.5) return null;
  // require a genuine dent (area strictly less than the convex hull's)
  if(Math.abs(shoelace(clean)) >= Math.abs(shoelace(base))) return null;
  return clean;
}

// A polygon WITH a hole: a big axis-aligned outer rectangle, a smaller rectangle
// hole strictly inside it (CCW outer, the hole as its own ring).
function randHoled(rnd){
  const x0 = -4 + Math.floor(rnd() * 2), y0 = -4 + Math.floor(rnd() * 2);
  const x1 =  4 - Math.floor(rnd() * 2), y1 =  4 - Math.floor(rnd() * 2);
  if(x1 - x0 < 4 || y1 - y0 < 4) return null;
  const outer = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  const hx0 = x0 + 1 + Math.floor(rnd() * Math.max(1, (x1 - x0 - 3)));
  const hy0 = y0 + 1 + Math.floor(rnd() * Math.max(1, (y1 - y0 - 3)));
  const hw = 1 + Math.floor(rnd() * Math.max(1, (x1 - hx0 - 1)));
  const hh = 1 + Math.floor(rnd() * Math.max(1, (y1 - hy0 - 1)));
  const hx1 = hx0 + hw, hy1 = hy0 + hh;
  if(hx1 >= x1 || hy1 >= y1) return null;
  // hole ring (orientation irrelevant — we use |shoelace|)
  const hole = [{ x: hx0, y: hy0 }, { x: hx1, y: hy0 }, { x: hx1, y: hy1 }, { x: hx0, y: hy1 }];
  return { outer, hole };
}

// For a holed shape, the wheel rolls a SINGLE dense ring: the corrected,
// lattice-aligned ZERO-WIDTH KEYHOLE — outer ring, dive in to the hole along a
// lattice line, trace the hole the OPPOSITE way, return along the SAME line.
// The retrace cancels, so the wheel sees only (outer − hole). The COUNT road
// uses the two-ring pickWithHoles formula (never this keyhole).
function keyhole(outer, hole){
  // bridge from outer[0] to the nearest hole vertex along the shared lattice line.
  const ring = [];
  for(const p of outer) ring.push(p);
  // re-enter at outer[0]; go to hole start, trace hole reversed, come back.
  const hStart = hole[0];
  ring.push(outer[0]);              // anchor (closes nothing yet)
  ring.push(hStart);               // bridge in
  for(let i = hole.length - 1; i >= 0; i--) ring.push(hole[i]);   // hole, reversed
  ring.push(hStart);               // back to hole start
  ring.push(outer[0]);             // bridge out
  return ring;
}

console.log('Pick & the Wheel — headless self-test\n');

/* ── (a) CENTRAL CLAIM — wheel === count over ≥300 random lattice polygons ── */
{
  const rnd = mulberry32(SEED);
  let worst = 0, worstShape = null, roundOK = 0, n = 0, holeN = 0, convexN = 0, ncN = 0;
  const target = 300;
  // ~100 convex
  while(convexN < 100){
    const V = randConvex(rnd); if(!V) continue;
    const w = wheelArea(V, SPE_TEST), c = pick(V).area;
    const rel = Math.abs(w - c) / c; if(rel > worst){ worst = rel; worstShape = V; }
    if(Math.round(w * 2) === Math.round(c * 2)) roundOK++;
    convexN++; n++;
  }
  // ~100 non-convex simple
  let guard = 0;
  while(ncN < 100 && guard < 100000){
    guard++;
    const V = randNonConvex(rnd); if(!V) continue;
    const w = wheelArea(V, SPE_TEST), c = pick(V).area;
    const rel = Math.abs(w - c) / c; if(rel > worst){ worst = rel; worstShape = V; }
    if(Math.round(w * 2) === Math.round(c * 2)) roundOK++;
    ncN++; n++;
  }
  // ~100 with a hole (two-ring count vs single-keyhole wheel)
  guard = 0;
  while(holeN < 100 && guard < 100000){
    guard++;
    const H = randHoled(rnd); if(!H) continue;
    const c = pickWithHoles(H.outer, [H.hole]).area;
    const w = wheelArea(keyhole(H.outer, H.hole), SPE_TEST);
    const rel = Math.abs(w - c) / c; if(rel > worst){ worst = rel; worstShape = { holed: H }; }
    if(Math.round(w * 2) === Math.round(c * 2)) roundOK++;
    holeN++; n++;
  }
  console.log('  · random polys: ' + convexN + ' convex + ' + ncN + ' non-convex + ' + holeN + ' holed = ' + n);
  console.log('  · worst |wheel − count|/count = ' + worst.toExponential(3) + '  (half-snap matches ' + roundOK + '/' + n + ')');
  ok(n >= 300, '(a) tested at least 300 random lattice polygons (got ' + n + ')');
  ok(worst < 1e-3, '(a) wheel === count to rel-err < 1e-3 on every poly (worst ' + worst.toExponential(3) + ')');
  // lattice areas are integers OR half-integers (A = I + B/2 − 1, B can be odd);
  // the wheel must snap to the TRUE lattice value — to the nearest HALF.
  ok(roundOK / n >= 0.995, '(a) round(2·wheel) === round(2·count) (snaps to the true lattice area) on ≥99.5% (' + roundOK + '/' + n + ')');
}

/* ── (b) INTEGRALITY — B∈ℤ, 2A∈ℤ, (2A−B) even (⇒ I∈ℤ), I≥0 on every poly ──
   NOTE: 2A need NOT be even — a lattice polygon may have HALF-integer area (e.g.
   the triangle (0,0)(4,0)(0,1) has A=2 but (0,0)(3,0)(0,1) has A=1.5). Pick's
   integer guarantee is on I, and it holds because 2A and B always share PARITY:
   2A = 2I + B − 2 ⇒ 2A − B = 2(I−1) is even. THAT is the load-bearing invariant. */
{
  const rnd = mulberry32(SEED ^ 0xABCD);
  let allInt = true, n = 0, worstViol = '', halfArea = 0;
  for(let t = 0; t < 400 && n < 250; t++){
    const V = (t % 3 === 0) ? randConvex(rnd) : (t % 3 === 1 ? randNonConvex(rnd) : randConvex(rnd));
    if(!V) continue;
    const p = pick(V); n++;
    if(!Number.isInteger(p.area)) halfArea++;
    const good = Number.isInteger(p.B) && Number.isInteger(p.twoA) &&
                 ((p.twoA - p.B) % 2 === 0) && Number.isInteger(p.I) && p.I >= 0;
    if(!good){ allInt = false; worstViol = JSON.stringify({ V, p }); }
  }
  console.log('  · ' + n + ' polys, ' + halfArea + ' with half-integer area (legitimate)');
  ok(allInt, '(b) every lattice poly: B∈ℤ, 2A∈ℤ, (2A−B) even ⇒ I∈ℤ, I≥0 (' + n + ' polys)' + (allInt ? '' : ' — VIOLATION ' + worstViol));
}

/* ── (c) THREE-METHOD AGREEMENT on a curated L-tromino (area 12, I=5, B=16) ── */
{
  // L-tromino: a 2×4 bar with a 2×2 notch — area 12. (planimeter-prototype-verified)
  const L = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 4 }, { x: 0, y: 4 }];
  const p = pick(L);
  const w = wheelArea(L, SPE_TEST);
  const sl = Math.abs(shoelace(L));        // third independent witness (raw integer)
  console.log('  · L-tromino: pick.area=' + p.area + '  I=' + p.I + '  B=' + p.B + '  shoelace=' + sl + '  wheel=' + w.toFixed(6));
  ok(p.area === 12 && p.I === 5 && p.B === 16, '(c) curated L-tromino reads area 12, I=5, B=16');
  ok(sl === p.area, '(c) shoelace === pick.area exactly (' + sl + ' === ' + p.area + ')');
  ok(Math.abs(w - p.area) < 1e-3, '(c) wheel within 1e-3 of the integer area (' + w.toFixed(6) + ' ≈ 12)');
}

/* ── (d) NEGATIVE CONTROL — off-lattice vertex ⇒ Pick UNDEFINED, wheel finite ── */
{
  // unit-area triangle, then nudge ONE vertex +0.4 off its node.
  const tri = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4.1 }];   // start near a 8-area triangle
  const onLattice = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }];
  const pOn = pick(onLattice);
  ok(pOn.defined === true, '(d) on-lattice triangle: Pick DEFINED (area ' + pOn.area + ')');
  const perturbed = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4.4 }];
  const pOff = pick(perturbed);
  const wOff = wheelArea(perturbed, SPE_TEST);
  const slOff = Math.abs(shoelace(perturbed));
  console.log('  · off-lattice: pick.defined=' + pOff.defined + '  wheel=' + (wOff === null ? 'null' : wOff.toFixed(3)) + '  shoelace=' + slOff.toFixed(3));
  ok(pOff.defined === false, '(d) off-lattice vertex ⇒ pick().defined === false (Pick UNDEFINED)');
  ok(wOff !== null && Number.isFinite(wOff), '(d) wheel still returns a finite reading off-lattice');
  ok(Math.abs(wOff - slOff) < 1e-2, '(d) wheel === |shoelace| of the true off-lattice shape within 1e-2 (' + wOff.toFixed(3) + ' ≈ ' + slOff.toFixed(3) + ')');
}

/* ── (e) gcd / boundary sanity ── */
{
  const sq = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  const p1 = pick(sq);
  ok(p1.B === 4 && p1.I === 0 && p1.area === 1, '(e) unit square: B=4, I=0, A=1');
  const sq2 = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
  const p2 = pick(sq2);
  ok(p2.B === 8 && p2.I === 1 && p2.area === 4, '(e) 2×2 square: B=8, I=1, A=4');
  ok(gcd(6, 4) === 2, '(e) gcd(6,4) === 2 (an edge Δ=(6,4) contributes 2 boundary points)');
  ok(boundaryPoints([{ x: 0, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }]) === gcd(6, 4) + gcd(6, 0) + gcd(0, 4), '(e) boundaryPoints = Σ gcd over edges');
}

/* ── (f) DETERMINISM — same seed → same readings ── */
{
  function firstWorst(){
    const rnd = mulberry32(0xCAFEF00D); let acc = '';
    for(let t = 0; t < 20; t++){ const V = randConvex(rnd); if(!V) continue; acc += pick(V).area + ':' + wheelArea(V, SPE_TEST).toFixed(9) + ';'; }
    return acc;
  }
  ok(firstWorst() === firstWorst(), '(f) same seed → byte-identical readings (deterministic)');
}

/* ── (g) DISJOINTNESS WITNESS — the two roads share NO code (soul, falsifiable) ── */
{
  const src = fs.readFileSync(path.join(__dir, 'core.mjs'), 'utf8');
  // isolate each function body by name (crude but exact: slice from "function NAME"
  // to the next top-level "export function" or "function ").
  function bodyOf(name){
    const re = new RegExp('(?:export\\s+)?function\\s+' + name + '\\b');
    const m = re.exec(src); if(!m) return '';
    let i = src.indexOf('{', m.index); let depth = 0, j = i;
    for(; j < src.length; j++){ if(src[j] === '{') depth++; else if(src[j] === '}'){ depth--; if(depth === 0){ j++; break; } } }
    return src.slice(m.index, j);
  }
  const pickRoad = ['gcd', 'shoelace', 'boundaryPoints', 'pick', 'pickWithHoles'].map(bodyOf).join('\n');
  const wheelAdapter = bodyOf('wheelArea');
  const wheelBanned = ['measuredArea', 'wheelRoll', 'solveElbow', 'armDir', 'densifyClosed'];
  const pickBanned = ['pick', 'boundaryPoints', 'shoelace', 'gcd'];
  let disjoint = true, why = '';
  for(const w of wheelBanned){ if(pickRoad.includes(w)){ disjoint = false; why += ' pick-road mentions ' + w + ';'; } }
  for(const p of pickBanned){ if(wheelAdapter.includes(p)){ disjoint = false; why += ' wheelArea mentions ' + p + ';'; } }
  ok(disjoint, '(g) Pick road references no wheel symbol & wheelArea references no Pick symbol' + (disjoint ? '' : ' —' + why));
}

/* ── (h) BYTE-PARITY — the WHEEL-CORE slab is char-identical to planimeter L321–376 ── */
{
  const src = fs.readFileSync(path.join(__dir, 'core.mjs'), 'utf8');
  const a = src.indexOf('// ===== WHEEL-CORE');
  const b = src.indexOf('// ===== /WHEEL-CORE');
  const slab = src.slice(src.indexOf('\n', a) + 1, b);              // between the sentinels
  // Anchor the planimeter slab by CONTENT, not fixed line numbers, so an unrelated
  // edit elsewhere in planimeter (e.g. the reciprocal teaser link) cannot break a
  // byte-parity test that is really about the FOUR functions. The slab runs from
  // `function solveElbow` to the close of `measuredArea` (the L321–376 region).
  const plani = fs.readFileSync(path.join(__dir, '..', 'planimeter', 'index.html'), 'utf8');
  const start = plani.indexOf('  function solveElbow(P, M, T, L, branch){');
  // the last line of measuredArea: `return { ok:true, area: L * r.dW, dW: r.dW };`
  const lastReturn = plani.indexOf('return { ok:true, area: L * r.dW, dW: r.dW };', start);
  const semi = plani.indexOf(';', lastReturn);                      // end of that return statement
  const close = plani.indexOf('}', semi) + 1;                       // measuredArea's CLOSING brace
  const expected = plani.slice(start, close) + '\n';
  const norm = s => s.replace(/\s+$/gm, '');                        // ignore only trailing-space drift
  const matched = start >= 0 && lastReturn >= 0 &&
                  norm(slab.trimEnd() + '\n') === norm(expected);
  ok(matched, '(h) WHEEL-CORE slab is byte-faithful to planimeter solveElbow…measuredArea (the L321–376 region)');
}

/* ── classifyNodes in-sync cross-check (the explorer-2 flag) ── */
{
  const rnd = mulberry32(SEED ^ 0x5151);
  let synced = true, n = 0;
  for(let t = 0; t < 200 && n < 60; t++){
    const V = (t % 2 === 0) ? randConvex(rnd) : randNonConvex(rnd);
    if(!V) continue;
    const p = pick(V);
    const cn = classifyNodes(V, vertsBBox(V, 1));
    if(cn.boundary.length !== p.B || cn.interior.length !== p.I){ synced = false; }
    n++;
  }
  ok(synced, '(sync) classifyNodes lengths === pick().B / pick().I on ' + n + ' polys (lit dots ARE the needle)');
}

console.log('\n' + pass + '/' + total + ' passed');
if(fails.length){ console.log('FAILED:\n  - ' + fails.join('\n  - ')); process.exit(1); }
process.exit(0);
