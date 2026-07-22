// ============================================================================
//  The Coastline Rule — the divider-walk CORE
//  Pure, dependency-free. This SAME code is inlined verbatim into index.html;
//  this file is the Node-testable twin (core.test.mjs runs against it).
//
//  The paradox, made touchable: you WALK a pair of dividers down a coast,
//  chord by chord, and read back the length YOU measured. Shrink the divider
//  span and the same coast yields a BIGGER length — without settling. A smooth
//  shore does settle. There is no auto box-counter here and no printed verdict;
//  every number is a thing the visitor's own walk produced.
//
//  ONE canonical primitive — walkDividers — feeds the animation, the overlay,
//  the tally, the logbook AND the self-test, so they can never disagree.
// ============================================================================

// --- deterministic PRNG (mulberry32) so a coast is seed-reproducible ---------
export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// closed-form similarity dimension of the Koch coast, and its baseline chord.
export const KOCH_D    = Math.log(4) / Math.log(3);   // 1.2618595071...
export const KOCH_BASE = 0.92;                          // |end − start|, the level-0 chord
// the shipped coast is one fixed seed — pinned so the EXACT integer assertion
// (steps === 4^k) is reproducible. Chosen by brute-force: it walks cleanly.
export const SHIPPED_SEED = 7;
export const SHIPPED_GEN  = 7;

// ============================================================================
//  kochCoast(gen, seed) → array of [x,y].
//  Classic Koch subdivision (segment → 4 segments), BUT each bump's apex side
//  is a seeded coin-flip. Flipping is a REFLECTION across the segment's own
//  base line — an isometry — so every sub-segment keeps length base/3^gen and
//  the level-k vertices stay exactly base/3^k apart. Result: an irregular,
//  seed-varying shore whose similarity dimension is EXACTLY log4/log3, always.
// ============================================================================
export function kochCoast(gen, seed){
  const r = rng((seed >>> 0) ^ 0x9e3779b9);
  const A = [ (1 - KOCH_BASE) / 2, 0.5 ];
  const B = [ (1 + KOCH_BASE) / 2, 0.5 ];
  let pts = [A, B];
  for(let it = 0; it < gen; it++){
    const next = [pts[0]];
    for(let i = 0; i < pts.length - 1; i++){
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const dx = bx - ax, dy = by - ay;
      const p1 = [ax + dx / 3, ay + dy / 3];
      const p3 = [ax + 2 * dx / 3, ay + 2 * dy / 3];
      // apex = rotate (p3−p1) about p1 by ∓60°; the coin flips which side.
      const side = r() < 0.5 ? 1 : -1;
      const ang = side * (-Math.PI / 3);
      const ux = dx / 3, uy = dy / 3, c = Math.cos(ang), s = Math.sin(ang);
      const p2 = [p1[0] + ux * c - uy * s, p1[1] + ux * s + uy * c];
      next.push(p1, p2, p3, [bx, by]);
    }
    pts = next;
  }
  return pts;
}

// convenience: the exact coast this bench ships (fixed seed + gen).
export function shippedCoast(){ return kochCoast(SHIPPED_GEN, SHIPPED_SEED); }

// ============================================================================
//  smoothCoast(seed) → array of [x,y]. The NEGATIVE CONTROL — a coast that
//  merely happens to be smooth: three gentle sines over the same span. It is
//  rectifiable, so its divider length CONVERGES as the span shrinks (its fan
//  comforts shut). Amplitudes are kept gentle so convergence sits near exact.
// ============================================================================
export function smoothCoast(seed){
  const r = rng((seed >>> 0) ^ 0x85ebca6b);
  const x0 = (1 - KOCH_BASE) / 2, span = KOCH_BASE;
  const a1 = 0.030 + 0.010 * r(), a2 = 0.011 + 0.006 * r(), a3 = 0.004 + 0.003 * r();
  const ph1 = r() * 6.2831853, ph2 = r() * 6.2831853, ph3 = r() * 6.2831853;
  const N = 1400, pts = [];
  for(let i = 0; i <= N; i++){
    const t = i / N;
    // taper the ends so the shore meets its endpoints on the baseline
    const env = Math.sin(Math.PI * t);
    const y = 0.5 + env * ( a1 * Math.sin(2 * Math.PI * t + ph1)
                          + a2 * Math.sin(5 * Math.PI * t + ph2)
                          + a3 * Math.sin(9 * Math.PI * t + ph3) );
    pts.push([x0 + t * span, y]);
  }
  return pts;
}

// ============================================================================
//  THE CANONICAL PRIMITIVE — walkDividers(poly, s)
//  March a divider of opening s heel-over-toe along the polyline: plant a foot,
//  find the FIRST point exactly s ahead (circle ∩ forward path), plant again,
//  resume from that landing. The honest partial last step: once no forward
//  point reaches s, the leftover to the coast's end is a fraction of one step.
//    → { feet:[[x,y]…], steps, residual∈[0,1), L=(steps+residual)*s, span:s }
//  This ONE function is the single source of truth: the animation walks `feet`,
//  the overlay draws through `feet`, the tally reads `L`, the logbook plots it,
//  and every self-test calls it. They cannot disagree.
// ============================================================================
function nextFootAtDistance(poly, F, startSeg, startU, s){
  const n = poly.length;
  for(let j = startSeg; j < n - 1; j++){
    const ax = poly[j][0], ay = poly[j][1];
    const dx = poly[j + 1][0] - ax, dy = poly[j + 1][1] - ay;
    const A = dx * dx + dy * dy;
    if(A === 0) continue;
    const fx = ax - F[0], fy = ay - F[1];
    const B = 2 * (fx * dx + fy * dy);
    const C = fx * fx + fy * fy - s * s;
    const disc = B * B - 4 * A * C;
    if(disc < 0) continue;
    const sq = Math.sqrt(disc);
    const t2 = (-B + sq) / (2 * A);              // outgoing crossing (distance rising through s)
    const tLo = (j === startSeg) ? startU : 0;
    if(t2 >= tLo - 1e-12 && t2 <= 1 + 1e-6){
      const t = Math.max(tLo, Math.min(1, t2));
      return { found:true, x: ax + t * dx, y: ay + t * dy, seg: j, u: t };
    }
  }
  return { found:false };
}

export function walkDividers(poly, s){
  const n = poly.length;
  const start = [poly[0][0], poly[0][1]];
  const feet = [start];
  const end = poly[n - 1];
  if(!(s > 0) || n < 2){
    return { feet, steps:0, residual:0, L:0, span:s };
  }
  let F = start, seg = 0, u = 0, steps = 0;
  const GUARD = 4 * poly.length + 16;              // can never plant more feet than vertices+slack
  while(steps < GUARD){
    const nf = nextFootAtDistance(poly, F, seg, u, s);
    if(!nf.found) break;
    let fx = nf.x, fy = nf.y, nu = nf.u;
    const vx = poly[nf.seg + 1][0], vy = poly[nf.seg + 1][1];
    if(Math.hypot(fx - vx, fy - vy) < 1e-7){ fx = vx; fy = vy; nu = 1; }  // snap sub-nm noise to the vertex
    F = [fx, fy];
    feet.push(F);
    seg = (nu >= 1) ? nf.seg + 1 : nf.seg;
    u   = (nu >= 1) ? 0 : nu;
    steps++;
    if(seg >= n - 1) break;                         // landed exactly on the final vertex
  }
  const last = feet[feet.length - 1];
  const dEnd = Math.hypot(end[0] - last[0], end[1] - last[1]);
  const residual = dEnd / s;                        // guaranteed < 1 (else we'd have stepped)
  const L = (steps + residual) * s;
  return { feet, steps, residual, L, span: s };
}

// ============================================================================
//  richardson(spans, lengths) → { slope, D:1+slope, r2, intercept, n }.
//  STANDARD CONVENTION for the whole build: x = log(1/s), y = log L, D = 1+slope.
//  On the exact Koch ladder this returns slope = log4/log3 − 1, so D = log4/log3.
// ============================================================================
export function richardson(spans, lengths){
  const xs = [], ys = [];
  for(let i = 0; i < spans.length; i++){
    if(spans[i] > 0 && lengths[i] > 0){ xs.push(Math.log(1 / spans[i])); ys.push(Math.log(lengths[i])); }
  }
  const n = xs.length;
  if(n < 2) return { slope:NaN, D:NaN, r2:0, intercept:NaN, n };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for(let i = 0; i < n; i++){ sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const ybar = sy / n; let ssR = 0, ssT = 0;
  for(let i = 0; i < n; i++){ const pr = slope * xs[i] + intercept; ssR += (ys[i] - pr) ** 2; ssT += (ys[i] - ybar) ** 2; }
  return { slope, D: 1 + slope, r2: ssT > 0 ? 1 - ssR / ssT : 1, intercept, n };
}

// ============================================================================
//  spanLadder(base, gen) → the RACK rungs s_k = base/3^k, k=1..gen (coarse→fine).
//  These land on real level-k vertices. The shipped coast is gen 7, so the
//  finest rung (k=6) sits one level above the finest vertices — the honest
//  span floor; a slider must not open below s_6.
// ============================================================================
export function spanLadder(base = KOCH_BASE, gen = 6){
  const spans = [];
  for(let k = 1; k <= gen; k++) spans.push(base / Math.pow(3, k));
  return spans;
}
export function sweep(poly, spans){ return spans.map(s => walkDividers(poly, s).L); }
