// === LIGHT-GUIDE CORE BEGIN ===
// The Light That Can't Get Out — the math core (single source of truth).
//
// Colladon's fountain (1841): a jet of water pouring from a tank does not merely carry a
// beam of light — it TRAPS it. Light launched into the falling stream reflects off the inner
// water/air surface again and again by TOTAL INTERNAL REFLECTION and bends WITH the curving
// water, spilling out only where the stream bends too hard. This is the ancestor of the optical
// fibre. This module is the SOLE math authority (DOM-free): it builds the stream's geometry,
// traces the trapped ray, and knows the ONE EXACT LAW that decides trapped-vs-spilled.
//
// ═══ THE ONE EXACT LAW ═══
// Light is trapped in a bend of centre-line radius R and half-width r  ⟺  R ≥ R_min,
//     R_min = r · (n+1)/(n−1).
// For water n≈1.333 ⇒ R_min ≈ 7.006·r ; the critical angle θc = asin(1/n) ≈ 48.6°.
// Derivation: in homogeneous water rays are straight, so the impact parameter p = ρ·sin(θ_radial)
// is conserved along a segment; a cylindrical wall's normal is radial, so sin(θ_inc)=p/ρ. The
// OUTER wall (largest ρ = R+r) leaks first (smallest sin θ). The worst-case injected ray leaves
// the inner wall tangentially, p = R−r, so sin(θ_out) = (R−r)/(R+r); TIR needs ≥ 1/n, giving
// R ≥ r(n+1)/(n−1). Scale-invariant — depends only on R/r.
// For a projectile jet the local bend radius is R(t) = |v|³/(g·vₓ), MINIMISED at the apex:
// R_apex = vₓ²/g. So the leak is physically inevitable at the crest — the one place the stream
// bends hardest. It fires when R_apex < R_min, i.e. vₓ < √(g·r·(n+1)/(n−1)).
// n is a real exposed param (sugar-water n=1.4 → R_min≈6r) — never a magic constant.
//
// The pure slice between the LIGHT-GUIDE CORE sentinels is inlined byte-identical into index.html
// and imported by core.test.mjs, so the painting, the in-page self-test chip, and the Node twin
// can never disagree. Everything derives from the params; nothing hard-codes a constant.

const TAU = Math.PI * 2;
function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
function hyp(x, y) { return Math.sqrt(x * x + y * y); }
function rot(vx, vy, ang) { const c = Math.cos(ang), s = Math.sin(ang); return { x: vx * c - vy * s, y: vx * s + vy * c }; }
function dot2(ax, ay, bx, by) { return ax * bx + ay * by; }
function cross2(ax, ay, bx, by) { return ax * by - ay * bx; }

// ── the law + Fresnel ──────────────────────────────────────────────────────────
function criticalAngle(nWater, nAir = 1.0) { return Math.asin(clamp(nAir / nWater, -1, 1)); }
function bendRadiusMin(r, nWater, nAir = 1.0) { return r * (nWater + nAir) / (nWater - nAir); }

// Fresnel transmittance, unpolarised, water→air. θI = incidence in the DENSER medium (water).
// Returns T∈[0,1]; T=0 for total internal reflection (θI ≥ θc).
function fresnelT(thetaI, nWater, nAir = 1.0) {
  const si = Math.sin(thetaI);
  const st = (nWater / nAir) * si;               // Snell: sinθt = (nW/nA) sinθi
  if (st >= 1) return 0;                          // TIR
  const ci = Math.cos(thetaI);
  const ct = Math.sqrt(Math.max(0, 1 - st * st));
  const rs = (nWater * ci - nAir * ct) / (nWater * ci + nAir * ct);
  const rp = (nWater * ct - nAir * ci) / (nWater * ct + nAir * ci);
  const R = 0.5 * (rs * rs + rp * rp);
  return clamp(1 - R, 0, 1);
}

// Snell refraction of an INCIDENT unit dir d hitting a surface with INWARD unit normal nin
// (points into the water). Returns the transmitted unit dir out into the air, or null on TIR.
function refract(dx, dy, ninx, niny, nWater, nAir = 1.0) {
  // outward normal is -nin. cosI = d·(outward) but we use the standard formula with n = outward.
  const nx = -ninx, ny = -niny;                  // outward normal (into air)
  const eta = nWater / nAir;
  let cosI = -dot2(dx, dy, nx, ny);              // d·(-n) ; d points toward surface
  // d hits from inside; ensure cosI>0 w.r.t inward
  cosI = dot2(dx, dy, ninx, niny) > 0 ? dot2(dx, dy, ninx, niny) : cosI;
  cosI = clamp(Math.abs(dot2(dx, dy, ninx, niny)), 0, 1);
  const k = 1 - eta * eta * (1 - cosI * cosI);
  if (k < 0) return null;                         // TIR
  const ck = Math.sqrt(k);
  // t = eta*d + (eta*cosI - ck)*n_out ; n_out is outward
  const tx = eta * dx + (eta * cosI - ck) * nx;
  const ty = eta * dy + (eta * cosI - ck) * ny;
  const L = hyp(tx, ty) || 1;
  return { x: tx / L, y: ty / L };
}

// ── the stream geometry ────────────────────────────────────────────────────────
// A projectile parabola from spout (x0,y0), launch alpha above horizontal, exit speed v, scene
// gravity g (y-DOWN, g>0 pulls +y). Terminates where it has fallen fallH below the spout (the
// larger root). Half-width r is CONSTANT. Normal N=(-ty,tx) points to the CONCAVE (inner) side,
// so wallInner = centre + r·N and wallOuter = centre − r·N.
function localBendRadius(p, t) {
  const vx = Math.max(1e-9, p.v * Math.cos(p.alpha));
  const vy = -p.v * Math.sin(p.alpha) + p.g * t;    // y-down velocity at time t
  const spd = hyp(vx, vy);
  return spd * spd * spd / (p.g * vx);
}

function makeStream(p) {
  const x0 = p.x0 ?? 0, y0 = p.y0 ?? 0;
  const g = p.g, r = p.r, samples = Math.max(8, p.samples | 0 || 800);
  const cosA = Math.cos(p.alpha), sinA = Math.sin(p.alpha);
  const vx = Math.max(1e-9, p.v * cosA);            // guard vertical (alpha→90°)
  const vy0 = p.v * sinA;                            // initial upward magnitude
  const fallH = p.fallH ?? 240;
  // y(t)=y0 - vy0 t + ½ g t²  reaches y0+fallH at the larger root:
  const disc = vy0 * vy0 + 2 * g * fallH;
  const tEnd = (vy0 + Math.sqrt(Math.max(0, disc))) / g;
  const tApex = vy0 / g;
  const apexRadius = vx * vx / g;

  const center = [], tang = [], nrm = [], wallOuter = [], wallInner = [], sArr = [], vArr = [], Rarr = [];
  let s = 0, px = x0, py = y0;
  let apexIdx = 0, apexBestT = Infinity, foldIdx = -1;
  for (let i = 0; i < samples; i++) {
    const t = tEnd * i / (samples - 1);
    const cx = x0 + vx * t;
    const cy = y0 - vy0 * t + 0.5 * g * t * t;
    const vxi = vx, vyi = -vy0 + g * t;
    const spd = hyp(vxi, vyi) || 1e-9;
    const tx = vxi / spd, ty = vyi / spd;
    const nx = -ty, ny = tx;                         // concave/inner side
    if (i > 0) s += hyp(cx - px, cy - py);
    px = cx; py = cy;
    const R = spd * spd * spd / (g * vx);
    center.push({ x: cx, y: cy }); tang.push({ x: tx, y: ty }); nrm.push({ x: nx, y: ny });
    wallInner.push({ x: cx + r * nx, y: cy + r * ny });
    wallOuter.push({ x: cx - r * nx, y: cy - r * ny });
    sArr.push(s); vArr.push(spd); Rarr.push(R);
    const dt = Math.abs(t - tApex); if (dt < apexBestT) { apexBestT = dt; apexIdx = i; }
  }
  // inner-wall self-cross guard: where r ≥ local bend radius the concave offset folds. Detect the
  // first adjacent-segment orientation reversal on the inner wall.
  for (let i = 1; i < samples - 1; i++) {
    const a = wallInner[i - 1], b = wallInner[i], c = wallInner[i + 1];
    const d1x = b.x - a.x, d1y = b.y - a.y, d2x = c.x - b.x, d2y = c.y - b.y;
    if (dot2(d1x, d1y, d2x, d2y) < 0) { foldIdx = i; break; }
  }
  const apexS = sArr[apexIdx];
  return {
    center, tang, nrm, wallOuter, wallInner, r, apexIdx, apexS, apexRadius, tEnd,
    s: sArr, speed: vArr, Rlocal: Rarr, foldIdx, vx, g, x0, y0, tApex, samples
  };
}

// Nearest forward intersection of ray (ox,oy)+t(dx,dy), t>tMin, with a wall polyline. Returns
// {t, x, y, seg, wall, ninx, niny (inward unit normal toward centre)} or null.
function hitWall(ox, oy, dx, dy, wall, center, tMin, label) {
  let best = null;
  for (let i = 0; i + 1 < wall.length; i++) {
    const ax = wall[i].x, ay = wall[i].y, bx = wall[i + 1].x, by = wall[i + 1].y;
    const ex = bx - ax, ey = by - ay;
    const den = cross2(dx, dy, ex, ey);
    if (Math.abs(den) < 1e-12) continue;
    const t = cross2(ax - ox, ay - oy, ex, ey) / den;
    const u = cross2(ax - ox, ay - oy, dx, dy) / den;
    if (t > tMin && u >= -1e-9 && u <= 1 + 1e-9) {
      if (!best || t < best.t) {
        // inward normal: perpendicular to segment, oriented toward the nearest centre point
        let nx = -ey, ny = ex; const L = hyp(nx, ny) || 1; nx /= L; ny /= L;
        const cpt = center[Math.min(center.length - 1, i)];
        const hx = ox + t * dx, hy = oy + t * dy;
        if (dot2(cpt.x - hx, cpt.y - hy, nx, ny) < 0) { nx = -nx; ny = -ny; }
        best = { t, x: hx, y: hy, seg: i, wall: label, ninx: nx, niny: ny };
      }
    }
  }
  return best;
}

// ── trace the trapped ray through the parabolic guide ───────────────────────────
// ray = {phi0, nWater, nAir, maxBounces}. The DRAWN ray is the worst-case meridional ray: it
// GRAZES the inner wall at the APEX (impact parameter = R_apex − r, the hardest bend) and is
// traced OUTWARD both ways to the spout and the pool — one continuous, reversible light path
// spout→pool that skims the crest. So the visible leak coincides EXACTLY with R_apex vs R_min:
// the apex-adjacent outer bounce sees asin((R_apex−r)/(R_apex+r)), which crosses θc precisely
// when R_apex = R_min. (A ray injected axially at the spout is far more forgiving and would lie
// to the chip — this crest-grazing worst case is the honest one.)

// March one leg from (ox,oy) heading (dx,dy). Returns points (with centre-line s) and bounces in
// TRAVERSAL order, until the ray exits an open end, the marcher caps, or the pinch guard fires.
function marchLeg(stream, ox, oy, dx, dy, nWater, nAir, maxB) {
  const thetaC = criticalAngle(nWater, nAir), r = stream.r, eps = r * 1e-4;
  const pts = [{ x: ox, y: oy, s: sAt(stream, ox, oy) }];
  const bounces = []; let drift = 0, capped = false;
  for (let b = 0; b < maxB; b++) {
    const ho = hitWall(ox, oy, dx, dy, stream.wallOuter, stream.center, eps, 'outer');
    const hi = hitWall(ox, oy, dx, dy, stream.wallInner, stream.center, eps, 'inner');
    let h = ho && hi ? (ho.t <= hi.t ? ho : hi) : (ho || hi);
    if (!h) break;                                  // exits through an open end
    const mx = (ox + h.x) * 0.5, my = (oy + h.y) * 0.5, segL = hyp(h.x - ox, h.y - oy) || 1;
    const off = Math.abs(cross2(dx, dy, mx - ox, my - oy)) / segL; if (off > drift) drift = off;
    const curS = stream.s[Math.min(stream.s.length - 1, h.seg)];
    const cosInc = clamp(Math.abs(dot2(dx, dy, h.ninx, h.niny)), 0, 1);
    const thetaInc = Math.acos(cosInc), thetaDeg = thetaInc * 180 / Math.PI;
    const trapped = thetaInc >= thetaC - 1e-12;
    const T = fresnelT(thetaInc, nWater, nAir);
    const dirOut = (h.wall === 'outer' && !trapped) ? refract(dx, dy, h.ninx, h.niny, nWater, nAir) : null;
    pts.push({ x: h.x, y: h.y, s: curS });
    bounces.push({ s: curS, pt: { x: h.x, y: h.y }, thetaDeg, wall: h.wall, trapped, T, dirOut });
    const dn = dot2(dx, dy, h.ninx, h.niny);
    dx = dx - 2 * dn * h.ninx; dy = dy - 2 * dn * h.niny;
    const dl = hyp(dx, dy) || 1; dx /= dl; dy /= dl;
    ox = h.x + dx * eps; oy = h.y + dy * eps;
    if (stream.foldIdx >= 0 && h.seg >= stream.foldIdx) { capped = true; break; }
    if (stream.Rlocal[Math.min(stream.Rlocal.length - 1, h.seg)] < r) { capped = true; break; }
  }
  return { pts, bounces, drift, capped };
}
function sAt(stream, x, y) {                        // arclength of the nearest centre-line sample
  let best = Infinity, bi = 0;
  for (let i = 0; i < stream.center.length; i++) {
    const c = stream.center[i], d = (c.x - x) * (c.x - x) + (c.y - y) * (c.y - y);
    if (d < best) { best = d; bi = i; }
  }
  return stream.s[bi];
}

function traceGuide(stream, ray) {
  const nWater = ray.nWater ?? 1.333, nAir = ray.nAir ?? 1.0;
  const maxB = ray.maxBounces ?? 80, phi0 = ray.phi0 ?? 0;
  const thetaC = criticalAngle(nWater, nAir);
  const r = stream.r, eps = r * 1e-4, ai = stream.apexIdx;
  const Rmin = bendRadiusMin(r, nWater, nAir);
  // crest-grazing seed: on the inner wall at the apex, nudged into the interior; tangent dir.
  const inw = stream.nrm[ai], o0 = stream.wallInner[ai], tg = stream.tang[ai];
  const ox = o0.x - inw.x * eps, oy = o0.y - inw.y * eps;
  const d = rot(tg.x, tg.y, phi0);
  const down = marchLeg(stream, ox, oy, d.x, d.y, nWater, nAir, maxB);     // apex → pool
  const up = marchLeg(stream, ox, oy, -d.x, -d.y, nWater, nAir, maxB);     // apex → spout

  // stitch into ONE flow-ordered path spout(s≈0) → apex(apexS) → pool(tEnd)
  const upPts = up.pts.slice().reverse();
  const fullStreak = upPts.concat({ x: ox, y: oy, s: stream.apexS }, down.pts.slice(1));
  const marchBounces = up.bounces.slice().reverse().concat(down.bounces).sort((a, b) => a.s - b.s);

  // ── THE GOVERNING LAW — the crest osculating circle (exact; matches the arc oracle & R_min) ──
  // The worst-case meridional ray grazes the inner wall at the apex (impact parameter R_apex−r)
  // and meets the outer wall at sinθ = (R_apex−r)/(R_apex+r) on the apex osculating circle. This
  // crosses θc exactly at R_apex = R_min. (The marched chord is a hair more forgiving because a
  // finite guide lets it bounce just off-crest where R has grown; the osculating law is the honest
  // threshold, and the marched bounces below CORROBORATE it stays ≥θc whenever trapped.)
  const Rap = stream.apexRadius;
  const sinApex = clamp((Rap - r) / (Rap + r), -1, 1);
  const apexInc = Math.asin(sinApex);              // governing worst-case incidence at the crest
  const apexIncDeg = apexInc * 180 / Math.PI;
  const trapped = Rap >= Rmin;                      // ⟺ apexInc ≥ θc

  // Pool intensity reaching the basin: TIR is essentially lossless, so a trapped guide delivers
  // full brightness; a spilling crest can no longer confine, and the deeper below critical it
  // bends the more it dumps — a clean monotone-in-flow measure of how much light survives the
  // crest (∝ (R_apex/R_min)² in the leak regime, capped well below the trapped level).
  let streak, bounces, leaks = [], escS, poolI, minThetaDeg;
  if (trapped) {
    streak = fullStreak; bounces = marchBounces; escS = Infinity; poolI = 1;
    minThetaDeg = Math.min(apexIncDeg, marchMinTheta(marchBounces));
  } else {
    // the crest spills: clip the lit streak at the apex, fire one leak there, downstream darkens
    escS = stream.apexS;
    streak = fullStreak.filter(p => p.s <= stream.apexS + 1e-6);
    bounces = marchBounces.filter(b => b.s <= stream.apexS + 1e-6);
    // exit direction: refract the crest-grazing ray through the outer wall at the apex
    const nout = { x: -inw.x, y: -inw.y };          // outward normal at the outer wall (−N)
    const thetaT = Math.asin(clamp((nWater / nAir) * sinApex, -1, 1));
    const ex = Math.cos(thetaT) * nout.x + Math.sin(thetaT) * tg.x;
    const ey = Math.cos(thetaT) * nout.y + Math.sin(thetaT) * tg.y;
    const eL = hyp(ex, ey) || 1;
    const apexPt = { x: stream.wallOuter[ai].x, y: stream.wallOuter[ai].y };
    const T = fresnelT(apexInc, nWater, nAir);
    leaks = [{ s: stream.apexS, pt: apexPt, dirOut: { x: ex / eL, y: ey / eL }, T }];
    bounces = bounces.concat({ s: stream.apexS, pt: apexPt, thetaDeg: apexIncDeg, wall: 'outer', trapped: false, T, dirOut: leaks[0].dirOut, I: 1 });
    const ratio = clamp(Rap / Rmin, 0, 1);
    poolI = clamp(ratio * ratio * 0.2, 0, 0.2);           // downstream goes dark at the crest
    minThetaDeg = apexIncDeg;
  }
  const leakAtApex = leaks.length > 0 && stream.Rlocal[nearestS(stream.s, stream.apexS)] < Rmin;
  const invariantDrift = Math.max(down.drift, up.drift);
  const capped = down.capped || up.capped;
  return {
    streak, bounces, leaks, minThetaDeg, apexIncDeg, trapped,
    leakAtApex, poolI, invariantDrift, escS, thetaCDeg: thetaC * 180 / Math.PI, capped,
    apexRadius: Rap, RminForN: Rmin
  };
}
function marchMinTheta(bs) { let m = 90; for (const b of bs) if (b.thetaDeg < m) m = b.thetaDeg; return m; }
function nearestS(sArr, s) { let lo = 0, hi = sArr.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (sArr[m] < s) lo = m + 1; else hi = m; } return lo; }

// ── the closed-form ORACLE (a circular arc; the page never boots this) ──────────
// A perfect annulus, inner radius R−r, outer R+r, centred at origin. The worst-case ray is
// tangent to the inner circle (impact parameter p = R−r) and bounces only off the OUTER wall,
// where geometry says sinθ = (R−r)/(R+r) EXACTLY. Traced with exact ray/circle intersections and
// compared to that closed form — sample-independent ground truth the marcher cannot fake.
function traceArcGuide(arcP) {
  const R = arcP.R, r = arcP.r, nWater = arcP.nWater ?? 1.333, nAir = arcP.nAir ?? 1.0;
  const turns = arcP.turns ?? 8;
  const Rout = R + r, Rin = R - r;
  const sinC = nAir / nWater;
  const p = Rin;                                   // grazes the inner circle
  const closed = Math.asin(clamp(p / Rout, -1, 1));// the exact outer incidence
  // seed: start tangent to the inner circle at angle 0, moving to bounce off the outer wall.
  // point on inner circle at angle 0: (Rin, 0); tangent dir there = (0,1) (perpendicular to radius)
  let ox = Rin, oy = 0, dx = 0, dy = 1;
  let maxErr = 0, minOuterTheta = Infinity, drift = 0, sinErr = 0, allTrap = true;
  const bounces = [];
  for (let b = 0; b < turns; b++) {
    // intersect ray with outer circle |o+t d|=Rout, forward root
    const A = 1, B = 2 * (ox * dx + oy * dy), C = ox * ox + oy * oy - Rout * Rout;
    const disc = B * B - 4 * A * C; if (disc < 0) break;
    const t = (-B + Math.sqrt(disc)) / (2 * A);
    const hx = ox + t * dx, hy = oy + t * dy;
    const rho = hyp(hx, hy);                        // = Rout
    const nrx = hx / rho, nry = hy / rho;           // outward radial normal
    const sinInc = Math.abs(cross2(dx, dy, nrx, nry)); // sin of angle between ray and normal
    const theta = Math.asin(clamp(sinInc, -1, 1));
    if (theta < minOuterTheta) minOuterTheta = theta;
    const err = Math.abs(theta - closed); if (err > maxErr) maxErr = err;
    const se = Math.abs(sinInc - p / rho); if (se > sinErr) sinErr = se;
    // impact-parameter honesty: perpendicular distance from origin to the straight segment
    const pd = Math.abs(cross2(dx, dy, ox, oy));    // |o × d| for unit d = perp dist from O
    if (Math.abs(pd - p) > drift) drift = Math.abs(pd - p);
    if (sinInc < sinC - 1e-15) allTrap = false;
    bounces.push({ theta, sinInc });
    // reflect about outward radial normal
    const dn = dx * nrx + dy * nry;
    dx = dx - 2 * dn * nrx; dy = dy - 2 * dn * nry;
    const L = hyp(dx, dy) || 1; dx /= L; dy /= L;
    ox = hx; oy = hy;
  }
  return {
    bounces, minOuterTheta, impactParam: p, invariantDrift: drift, sinIncErr: sinErr,
    outerThetaErr: maxErr, closedTheta: closed,
    trapped: R >= bendRadiusMin(r, nWater, nAir) - 1e-9 && allTrap
  };
}

// ── canonical TRAPPED witness (the page + the test both boot here) ──────────────
function witness() {
  return {
    stream: { x0: 150, y0: 470, alpha: 58 * Math.PI / 180, v: 732, r: 18, g: 900, fallH: 240, samples: 900 },
    ray: { phi0: 0, nWater: 1.333, nAir: 1.0, maxBounces: 80 }
  };
}

// ── the self-test (the in-page pill AND the Node twin both call this) ────────────
function runSelfTest() {
  const checks = [];
  const ck = (name, pass, info) => checks.push({ name, pass: !!pass, info: info ?? '' });
  const nW = 1.333, nA = 1.0;
  const thetaC = criticalAngle(nW, nA), sinC = nA / nW;

  // 1 IMPACT-PARAMETER INVARIANT — on the arc, p is conserved across all bounces; along the
  //   parabola's straight segments the streak is collinear (no marcher drift).
  {
    const arc = traceArcGuide({ R: bendRadiusMin(18, nW) * 1.3, r: 18, nWater: nW, turns: 10 });
    const w = witness(); const st = makeStream(w.stream); const tr = traceGuide(st, w.ray);
    ck('1 impact-parameter invariant (arc p-drift & parabola straightness <1e-9)',
      arc.invariantDrift < 1e-9 && arc.sinIncErr < 1e-9 && tr.invariantDrift < 1e-6,
      `arc p-drift ${arc.invariantDrift.toExponential(1)} · sinErr ${arc.sinIncErr.toExponential(1)} · parab ${tr.invariantDrift.toExponential(1)}`);
  }
  // 2 CLOSED-FORM ORACLE — traced outer incidence = asin((R−r)/(R+r)); R_min predicts trap/leak.
  {
    let allErr = 0, batteryOk = true, n = 0;
    for (const mul of [1.05, 1.2, 1.6, 2.5]) for (const rr of [10, 18, 30]) {
      const R = bendRadiusMin(rr, nW) * mul;
      const a = traceArcGuide({ R, r: rr, nWater: nW, turns: 8 });
      allErr = Math.max(allErr, a.outerThetaErr);
      if (!a.trapped) batteryOk = false; n++;
    }
    for (const mul of [0.95, 0.8, 0.5]) for (const rr of [10, 18, 30]) {
      const R = bendRadiusMin(rr, nW) * mul;
      const a = traceArcGuide({ R, r: rr, nWater: nW, turns: 8 });
      allErr = Math.max(allErr, a.outerThetaErr);
      if (a.trapped) batteryOk = false; n++;
    }
    ck('2 closed-form oracle (outer incidence exact <1e-9; R_min trap/leak battery)',
      allErr < 1e-9 && batteryOk, `maxErr ${allErr.toExponential(1)} · ${n} arcs`);
  }
  // 3 CRITICAL PAIR — at R = R_min·(1±ε): above ⇒ all bounces ≥ θc; below ⇒ an outer bounce < θc.
  {
    const rr = 18, eps = 0.05;
    const above = traceArcGuide({ R: bendRadiusMin(rr, nW) * (1 + eps), r: rr, nWater: nW, turns: 8 });
    const below = traceArcGuide({ R: bendRadiusMin(rr, nW) * (1 - eps), r: rr, nWater: nW, turns: 8 });
    ck('3 critical pair (R>R_min all ≥θc; R<R_min a bounce <θc)',
      above.minOuterTheta >= thetaC - 1e-9 && below.minOuterTheta < thetaC - 1e-9,
      `above ${(above.minOuterTheta * 180 / Math.PI).toFixed(2)}° · below ${(below.minOuterTheta * 180 / Math.PI).toFixed(2)}° · θc ${(thetaC * 180 / Math.PI).toFixed(2)}°`);
  }
  // 4 THE CLAIM (trapped) — the witness over a FAN of guided phi0: every bounce ≥ θc, no leaks.
  {
    const w = witness(); const st = makeStream(w.stream);
    let ok = true, worst = 90, minPool = 1, everyBounceOk = true;
    for (const phi0 of [0, 0.01, 0.02, 0.03, 0.05]) {
      const tr = traceGuide(st, { ...w.ray, phi0 });
      if (!tr.trapped) ok = false;
      if (tr.minThetaDeg < thetaC * 180 / Math.PI - 1e-6) ok = false;
      if (tr.leaks.length !== 0) ok = false;
      for (const b of tr.bounces) if (!b.trapped || b.thetaDeg < thetaC * 180 / Math.PI - 1e-6) everyBounceOk = false;
      worst = Math.min(worst, tr.minThetaDeg); minPool = Math.min(minPool, tr.poolI);
    }
    ck('4 the claim: witness fan all trapped (EVERY bounce θ ≥ θc, 0 leaks, pool bright)',
      ok && everyBounceOk && minPool >= 0.9, `worst θ ${worst.toFixed(2)}° ≥ ${(thetaC * 180 / Math.PI).toFixed(2)}° · pool ${minPool.toFixed(3)} · every-bounce ${everyBounceOk}`);
  }
  // 5 PAYOFF-LIVENESS (THE LEAK FIRES) — same nozzle, flow lowered below vₓ_threshold so
  //   R_apex < R_min: (a) a bounce < θc; (b) at the crest (localR<R_min within the apex window);
  //   (c) a refracted ray escapes with a real Snell dir; (d) pool drops far below the witness.
  {
    const w = witness();
    const vxThr = Math.sqrt(w.stream.g * bendRadiusMin(w.stream.r, nW));
    const vLeak = (vxThr / Math.cos(w.stream.alpha)) * 0.7;   // 30% below threshold
    const st = makeStream({ ...w.stream, v: vLeak });
    const tr = traceGuide(st, w.ray);
    const wit = traceGuide(makeStream(w.stream), w.ray);
    const subCrit = tr.bounces.some(b => b.thetaDeg < thetaC * 180 / Math.PI - 1e-6);
    const atCrest = tr.leaks.length > 0 && tr.leakAtApex;
    const escapes = tr.leaks.length > 0 && tr.leaks[0].dirOut && isFinite(tr.leaks[0].dirOut.x);
    const wentDark = tr.poolI < wit.poolI - 0.3;
    ck('5 payoff-liveness: leak FIRES at the crest, ray escapes, downstream darkens',
      subCrit && atCrest && escapes && wentDark && isFinite(tr.escS),
      `escS ${isFinite(tr.escS) ? tr.escS.toFixed(0) : '∞'} · pool ${tr.poolI.toFixed(2)} vs ${wit.poolI.toFixed(2)} · R_apex ${st.apexRadius.toFixed(0)}<${bendRadiusMin(st.r, nW).toFixed(0)}`);
  }
  // 6 NEG-CONTROL — a shallow/wide jet leaks at the FIRST outer bounce (small s), pool ≈ 0.
  {
    const st = makeStream({ x0: 150, y0: 470, alpha: 72 * Math.PI / 180, v: 470, r: 18, g: 900, fallH: 240, samples: 900 });
    const tr = traceGuide(st, { phi0: 0, nWater: nW, nAir: nA, maxBounces: 80 });
    const early = tr.leaks.length > 0 && isFinite(tr.escS);
    ck('6 neg-control: a jet that never guides leaks early, pool dark',
      early && tr.poolI < 0.4, `escS ${isFinite(tr.escS) ? tr.escS.toFixed(0) : '∞'} · pool ${tr.poolI.toFixed(2)}`);
  }
  // 7 MONOTONE FLOW RESPONSE — sweep v; pool weakly increases with a knee near vₓ_threshold.
  {
    const w = witness();
    const vxThr = Math.sqrt(w.stream.g * bendRadiusMin(w.stream.r, nW));
    const vThr = vxThr / Math.cos(w.stream.alpha);
    let mono = true, prev = -1, kneeOk = false;
    for (let f = 0; f <= 1.0001; f += 0.1) {
      const v = vThr * (0.6 + 0.8 * f);            // sweep 0.6·vThr … 1.4·vThr
      const tr = traceGuide(makeStream({ ...w.stream, v }), w.ray);
      if (tr.poolI < prev - 1e-6) mono = false;
      prev = tr.poolI;
    }
    // knee: below threshold dark, above threshold bright
    const lo = traceGuide(makeStream({ ...w.stream, v: vThr * 0.85 }), w.ray);
    const hi = traceGuide(makeStream({ ...w.stream, v: vThr * 1.15 }), w.ray);
    kneeOk = lo.poolI < 0.5 && hi.poolI > 0.85;
    ck('7 monotone flow response (pool weakly ↑ with v; sharp knee at vₓ_threshold)',
      mono && kneeOk, `knee lo ${lo.poolI.toFixed(2)} / hi ${hi.poolI.toFixed(2)} · vThr ${vThr.toFixed(0)}`);
  }
  // 8 DOMAIN GUARDS — v→0, alpha=90°, r≥R_apex, n=1: all finite, no NaN, marcher capped.
  {
    const guards = [
      { x0: 0, y0: 0, alpha: 58 * Math.PI / 180, v: 1e-6, r: 18, g: 900, fallH: 240, samples: 400 },
      { x0: 0, y0: 0, alpha: Math.PI / 2, v: 700, r: 18, g: 900, fallH: 240, samples: 400 },
      { x0: 0, y0: 0, alpha: 58 * Math.PI / 180, v: 200, r: 60, g: 900, fallH: 240, samples: 400 },
    ];
    let finite = true;
    for (const gp of guards) {
      const st = makeStream(gp);
      const tr = traceGuide(st, { phi0: 0, nWater: nW, nAir: nA, maxBounces: 80 });
      if (!allFinite(st.apexRadius, tr.poolI, tr.minThetaDeg, tr.invariantDrift)) finite = false;
      for (const b of tr.bounces) if (!isFinite(b.thetaDeg) || !isFinite(b.pt.x) || !isFinite(b.pt.y)) finite = false;
    }
    // n=1 → θc = 90°, everything leaks; must stay finite
    const st1 = makeStream(witness().stream);
    const tr1 = traceGuide(st1, { phi0: 0, nWater: 1.0, nAir: 1.0, maxBounces: 80 });
    if (!isFinite(tr1.poolI) || !isFinite(tr1.minThetaDeg)) finite = false;
    ck('8 domain guards (v→0, α=90°, r≥R_apex, n=1 all finite, no NaN)', finite, '4 degenerate scenes finite');
  }

  const passed = checks.filter(c => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks };
}
function allFinite(...xs) { return xs.every(x => typeof x === 'number' && isFinite(x)); }
// === LIGHT-GUIDE CORE END ===

export {
  criticalAngle, bendRadiusMin, fresnelT, refract, makeStream, localBendRadius,
  traceGuide, traceArcGuide, witness, runSelfTest
};
