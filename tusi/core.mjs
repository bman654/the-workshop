// ===== TUSI CORE (the shared pen geometry) =====
// ── THE TUSI COUPLE — the geometry authority for the tusi/ room AND for the
//    Spin Cabinet panel that borrows it. pen() and wheelCentre() were copied
//    VERBATIM from ../spirograph/index.html:244-260 and lived in tusi/index.html
//    until cycle 435, when they were lifted here so the estate has ONE tusi
//    geometry (the whirligig pattern: a room keeps its core in core.mjs, the page
//    forge:includes it, a Node twin proves it, and a neighbour may borrow it).
//
//    The Tusi couple is the hypotrochoid degenerated to inside, d=1, R=2r: a disk
//    of radius r rolling without slipping inside a ring of radius R, with the pen
//    pinned on the rim, traces a DEAD-STRAIGHT diameter of length 2R. The ratio
//    rho = R/r is CONTINUOUS here (R = rho·r is generally non-integer), so there
//    is NO gcd / closure / petal-count code — those would divide by a fractional
//    gcd. The contact point is K(t) = (R·cos t, R·sin t).
//
//    This file is inlined into tusi/index.html by forge (which strips the
//    `export` keywords) and imported as a real module by core.test.mjs and by
//    spin-cabinet/panels.mjs. One source, three consumers.

// Pen position at rolling-parameter t. R,r are radii; d in [0,1]. (verbatim)
export function pen(R, r, d, t, inside){
  if(inside){
    var Rm = R - r, ph = (R - r) / r * t;
    return { x: Rm * Math.cos(t) + d * r * Math.cos(ph),
             y: Rm * Math.sin(t) - d * r * Math.sin(ph) };
  } else {
    var Rp = R + r, pe = (R + r) / r * t;
    return { x: Rp * Math.cos(t) - d * r * Math.cos(pe),
             y: Rp * Math.sin(t) - d * r * Math.sin(pe) };
  }
}

// Centre of the rolling wheel at parameter t (for drawing the disk). (verbatim)
export function wheelCentre(R, r, t, inside){
  var rad = inside ? (R - r) : (R + r);
  return { x: rad * Math.cos(t), y: rad * Math.sin(t) };
}

// ----------------------------------------------------------------------------
// lineFit(R, r): PCA best-fit line of the FULL crank (d=1, inside), the PROOF
// LENS. mean-center, 2x2 covariance, major eigenvector = best-fit-line direction;
// perpendicular = its normal. Returns {maxPerp, maxAlong, aspect=maxPerp/maxAlong}.
// The SAME helper backs both the live readout and the self-test, so canvas, words
// and proof agree on ONE number. N endpoint-inclusive over the full crank period.
// ----------------------------------------------------------------------------
export function lineFit(R, r, N){
  N = N || 4000;
  var d = 1, inside = true;
  // FULL crank: the wheel makes R/r turns per ring-lap; the closed figure needs
  // r ring-laps to repeat exactly when R/r is rational, but the PROOF only needs
  // a faithful sample of the figure. One ring-trip t in [0,2pi] already contains
  // the whole degenerate segment at 2:1; for the neg-control ellipse one ring-trip
  // traces one full ellipse-arc. We sample [0,2pi] (the canvas lens' own range)
  // so the measured number is exactly what the canvas inks.
  var xs = new Array(N + 1), ys = new Array(N + 1), mx = 0, my = 0;
  for(var k = 0; k <= N; k++){
    var t = 2 * Math.PI * k / N;
    var p = pen(R, r, d, t, inside);
    xs[k] = p.x; ys[k] = p.y; mx += p.x; my += p.y;
  }
  mx /= (N + 1); my /= (N + 1);
  var sxx = 0, sxy = 0, syy = 0;
  for(var i = 0; i <= N; i++){
    var dx = xs[i] - mx, dy = ys[i] - my;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
  }
  sxx /= (N + 1); sxy /= (N + 1); syy /= (N + 1);
  // eigen-decompose the symmetric 2x2 covariance [[sxx,sxy],[sxy,syy]]
  var tr = sxx + syy, det = sxx * syy - sxy * sxy;
  var disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  var l1 = tr / 2 + disc;          // larger eigenvalue (along the line)
  // major eigenvector for l1
  var ex, ey;
  if(Math.abs(sxy) > 1e-300){ ex = l1 - syy; ey = sxy; }
  else { if(sxx >= syy){ ex = 1; ey = 0; } else { ex = 0; ey = 1; } }
  var en = Math.hypot(ex, ey) || 1; ex /= en; ey /= en;
  var nx = -ey, ny = ex;           // perpendicular (the line's normal)
  var maxPerp = 0, maxAlong = 0;
  for(var j = 0; j <= N; j++){
    var ax = xs[j] - mx, ay = ys[j] - my;
    var along = Math.abs(ax * ex + ay * ey);
    var perp = Math.abs(ax * nx + ay * ny);
    if(along > maxAlong) maxAlong = along;
    if(perp > maxPerp) maxPerp = perp;
  }
  return { maxPerp: maxPerp, maxAlong: maxAlong, aspect: maxAlong > 0 ? maxPerp / maxAlong : 0 };
}
