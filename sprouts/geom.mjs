/* ═══════════════════════════════════════════════════════════════════════════
   sprouts/geom.mjs — THE INK: one constant table, one validator, one router.

   This module is the EMBEDDING of the topological game in core.mjs. It never
   decides a rule. Its three jobs:
     • strokeIsLegal(poly)  — the pen's rule: don't touch ink. The human's dragged
       stroke and every route the house draws go through THIS one function.
     • route(state, move)   — a best-effort DRAWING of a move the topology has
       already blessed. A grid flood + BFS + smoothing ladder. The grid is a
       ROUTER, never a referee: if it fails, the house tries a finer grid, then a
       hairline nib, then a different legal move — it NEVER concedes.
     • partitionByInk(…)    — the one place the ink is load-bearing: when a stroke
       splits a face, the drawn loop decides which islands fall inside it.

   ONE constant table, consumed by the renderer, the router and the validator.
   There is never a second copy: a second copy is how drawn and tested drift apart.

   Sheet units (su) throughout. The page's canvases carry ONE seam —
   ctx.setTransform(k·dpr,0,0,k·dpr,0,0) with k = cssSheetWidth/940 — so a curve
   drawn on a phone is the same game as one drawn on a desk.
   ═══════════════════════════════════════════════════════════════════════════ */

// ===== THE SPROUTS INK (byte-identical to geom.mjs) =====

const SHEET = { W: 940, H: 720 };
const PLAY  = { x: 96, y: 64, w: 800, h: 552 };

const NIB_R   = 3.2;    // nominal ink half-width (su)
const NIB_MIN = 1.1;    // the hairline valve floor
const W_MAX   = 1.35;   // speed-widening cap
const TREMBLE = 0.9;    // max lateral render offset (two octaves of arclength noise)
/* CLEARANCE is DERIVED from the render pipeline's own worst case, not chosen:
     2 · (NIB_R·W_MAX + TREMBLE) = 2 · (3.2·1.35 + 0.9) = 2 · 5.22 = 10.44
   rounded up to 10.5 so at least 0.06 su of cream always survives between two
   legal strokes. CHANGE NIB_R OR TREMBLE AND YOU MUST RE-RUN THIS ARITHMETIC. */
const CLEARANCE = 10.5;

const SPOT_R  = 7;      // drawn radius of a spot
const WHISKER = 9;      // free-life stub length; attach radius = SPOT_R + WHISKER = 16
const ATTACH  = SPOT_R + WHISKER;
const STEP    = 4;      // truth-polyline resample spacing
const CELL    = 24;     // spatial hash cell, >= 2·CLEARANCE
const ARM_R   = 22;     // pointerdown within this of a spot grabs it
const LAND_R  = 26;     // release within this of a spot lands on it (34 on coarse pointers)
const LAND_R_COARSE = 34;
const BACK    = Math.ceil(CLEARANCE / STEP) + 2;   // self-test back-window (5)
/* Ink attached to your own start/end spot is exempt within this radius — the
   ≥55° slot separation keeps real curves 2·ATTACH·sin(27.5°) ≈ 14.8 su apart
   there, comfortably over CLEARANCE, so the exemption cannot hide a crossing. */
const R_EXEMPT = ATTACH + CLEARANCE * 0.5;

/* The clearance a given nib must keep. At the nominal nib this IS the constant
   above; the hairline valve draws a genuinely finer line, so it may honestly pass
   closer. The ROUTER and the VALIDATOR both read this one function — if they used
   different numbers the house could draw what the rules forbid, or refuse what
   they allow. */
function clearFor(nib) { return nib === NIB_R ? CLEARANCE : 2 * (nib * W_MAX + TREMBLE); }

/* ── THE HANDEDNESS SEAM (small, and load-bearing) ────────────────────────────
   The sheet's y axis points DOWN, so a raw atan2 increases CLOCKWISE on screen.
   core.mjs's rotation system is mathematically counter-clockwise — that is what
   makes its face trace a genuine planar embedding. So EVERY angle crossing between
   ink and core goes through these two functions, and nowhere else. Skip them and
   the combinatorics still checks out against itself while quietly describing the
   MIRROR IMAGE of the drawing — which shows up as corners assigned to the wrong
   face, and nothing else. (That is exactly how this was found.) */
function toCoreAng(dx, dy) { return Math.atan2(-dy, dx); }
function coreDir(a) { return { x: Math.cos(a), y: -Math.sin(a) }; }
/* Does an angle fall inside a corner sector {a0, span}? This is the whole of
   "which corner did the pen leave by" — the same question core.occurrenceAt asks,
   asked here on a measured departure angle rather than on a wedge laid over the
   paper. (The wedge came first and was wrong in both directions; see the note in
   strokeIsLegal.) */
function angInSector(ang, sec) {
  if (!sec || sec.span >= Math.PI * 2 - 1e-6) return true;
  const TAU2 = Math.PI * 2;
  let t = ((ang - sec.a0) % TAU2 + TAU2) % TAU2;
  return t <= sec.span + 1e-9;
}
/* The departure angle of a polyline from a spot, measured where the corner is
   actually decided: the first sample beyond the attach radius. The human path
   (ink.endpoints) measures it exactly this way, so the router is held to the
   human's own standard rather than to a private one. */
function departAngle(P, c) {
  for (const p of P) if (dist2(p.x, p.y, c.x, c.y) > ATTACH * ATTACH) return toCoreAng(p.x - c.x, p.y - c.y);
  const q = P[P.length - 1];
  return toCoreAng(q.x - c.x, q.y - c.y);
}

const NIB_ANGLE = -40 * Math.PI / 180;
const INK_YOU = '#413e39', INK_HOUSE = '#5e4229', PAPER = '#f2e9d4';

/* ── small vector helpers ─────────────────────────────────────────────────── */
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
function segSegDist2(ax, ay, bx, by, cx, cy, dx, dy) {
  // squared minimum distance between segments AB and CD
  const ux = bx - ax, uy = by - ay, vx = dx - cx, vy = dy - cy, wx = ax - cx, wy = ay - cy;
  const a = ux * ux + uy * uy, b = ux * vx + uy * vy, c = vx * vx + vy * vy;
  const d = ux * wx + uy * wy, e = vx * wx + vy * wy;
  const D = a * c - b * b;
  let sc, sN, sD = D, tc, tN, tD = D;
  if (D < 1e-9) { sN = 0; sD = 1; tN = e; tD = c; }
  else {
    sN = b * e - c * d; tN = a * e - b * d;
    if (sN < 0) { sN = 0; tN = e; tD = c; }
    else if (sN > sD) { sN = sD; tN = e + b; tD = c; }
  }
  if (tN < 0) { tN = 0; if (-d < 0) sN = 0; else if (-d > a) sN = sD; else { sN = -d; sD = a; } }
  else if (tN > tD) { tN = tD; if (-d + b < 0) sN = 0; else if (-d + b > a) sN = sD; else { sN = -d + b; sD = a; } }
  sc = Math.abs(sN) < 1e-9 ? 0 : sN / sD;
  tc = Math.abs(tN) < 1e-9 ? 0 : tN / tD;
  const px = wx + sc * ux - tc * vx, py = wy + sc * uy - tc * vy;
  return px * px + py * py;
}
function ptSegDist2(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const L = vx * vx + vy * vy;
  let t = L > 1e-9 ? (wx * vx + wy * vy) / L : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + t * vx - px, qy = ay + t * vy - py;
  return qx * qx + qy * qy;
}
/* Resample a polyline to a uniform STEP — the TRUTH centreline. Smoothing is
   applied ONLY to the ribbon's offset outlines at render time, never here, so the
   curve that is drawn and the curve that is tested are the same object. */
function resample(poly, step) {
  step = step || STEP;
  if (!poly || poly.length < 2) return (poly || []).slice();
  const out = [{ x: poly[0].x, y: poly[0].y }];
  let carry = 0;
  for (let i = 1; i < poly.length; i++) {
    let ax = poly[i - 1].x, ay = poly[i - 1].y;
    const bx = poly[i].x, by = poly[i].y;
    let seg = Math.hypot(bx - ax, by - ay);
    while (carry + seg >= step) {
      const t = (step - carry) / seg;
      ax = ax + (bx - ax) * t; ay = ay + (by - ay) * t;
      out.push({ x: ax, y: ay });
      seg = Math.hypot(bx - ax, by - ay); carry = 0;
    }
    carry += seg;
  }
  const last = poly[poly.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > step * 0.35) out.push({ x: last.x, y: last.y });
  return out;
}
function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return L; }
/* Chaikin corner-cutting, k rounds. Endpoints pinned. */
function chaikin(p, k) {
  let cur = p;
  for (let r = 0; r < k; r++) {
    if (cur.length < 3) break;
    const out = [cur[0]];
    for (let i = 0; i < cur.length - 1; i++) {
      const a = cur[i], b = cur[i + 1];
      out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    out.push(cur[cur.length - 1]);
    cur = out;
  }
  return cur;
}
/* Twice the signed area of a closed point list (shoelace). Its SIGN says which
   way the walk runs; in sheet coordinates (y down) a bounded face's boundary walk
   comes out POSITIVE and the unbounded face's walk — which traces the very same
   closed curve — comes out negative. That sign is the only thing that tells the
   two apart, and getting it wrong deals every island to the wrong side. */
/* ── THE ORIENTATION TEST — what replaces distance in a spot's neighbourhood ──
   Near a spot every incident curve genuinely converges on the same point, so
   "how far apart are they" stops being a model of anything: the answer is always
   zero and the honest question is the topological one — DID YOU CROSS IT? This
   returns the proper crossing point of two segments, or null (parallel, collinear
   and merely-touching all count as no crossing, which is exactly right: ink that
   runs alongside ink has not changed face). Cost: the same handful of flops the
   distance test cost. ------------------------------------------------------- */
function segCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;            // parallel or collinear
  const qx = cx - ax, qy = cy - ay;
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: ax + t * rx, y: ay + t * ry };
}
/* Crossings closer than this to a spot's centre are the shared endpoint itself —
   every curve at a spot meets every other one there by construction, and the ink
   dot (radius SPOT_R) covers it. The departure angle that names the corner is
   measured way outside this, at r = ATTACH = 16, so nothing topological is
   decided inside it. */
const R_MERGE = SPOT_R * 0.8;

function signedArea2(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  return a;
}
/* even–odd point-in-polygon over a closed point list */
function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

/* ── THE INK MODEL — DOM-free, so the Node twin drives the very same object the
   page draws with. Holds spot positions, committed polylines and the spatial
   hash; answers legality, routes and partitions. ---------------------------- */
function makeInk(opts) {
  opts = opts || {};
  const ink = {
    pos: [],          // spotId → {x,y}
    curves: [],       // curveId → {poly, midIdx, a, b, mid, by}
    dartPoly: {},     // dartId → [points] origin → target
    segs: [],         // flat list of {x1,y1,x2,y2,curve} for collision
    hash: new Map(),
    coarse: !!opts.coarse,
    incident: {},     // spotId → { curveId: true }  — the curves that MEET this spot
    routeFails: 0, routeCalls: 0, hairlines: 0,
  };
  const rngOf = (s) => { let a = (s >>> 0) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  ink.key = (cx, cy) => cx + ',' + cy;
  ink.addSeg = function (x1, y1, x2, y2, cid) {
    const s = { x1, y1, x2, y2, cid, i: ink.segs.length };
    ink.segs.push(s);
    const cx0 = Math.floor(Math.min(x1, x2) / CELL), cx1 = Math.floor(Math.max(x1, x2) / CELL);
    const cy0 = Math.floor(Math.min(y1, y2) / CELL), cy1 = Math.floor(Math.max(y1, y2) / CELL);
    for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) {
      const k = ink.key(cx, cy);
      if (!ink.hash.has(k)) ink.hash.set(k, []);
      ink.hash.get(k).push(s);
    }
  };
  ink.near = function (x1, y1, x2, y2) {
    const out = [], seen = new Set();
    const cx0 = Math.floor(Math.min(x1, x2) / CELL) - 1, cx1 = Math.floor(Math.max(x1, x2) / CELL) + 1;
    const cy0 = Math.floor(Math.min(y1, y2) / CELL) - 1, cy1 = Math.floor(Math.max(y1, y2) / CELL) + 1;
    for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) {
      const b = ink.hash.get(ink.key(cx, cy)); if (!b) continue;
      for (const s of b) if (!seen.has(s.i)) { seen.add(s.i); out.push(s); }
    }
    return out;
  };

  /* ── the opening deal: Poisson-disc, ≥ 140 su apart, in the middle 70% of PLAY,
     so late-game crowding has somewhere to go. ---------------------------- */
  ink.reset = function (st) {
    ink.pos = []; ink.curves = []; ink.dartPoly = {}; ink.segs = []; ink.hash = new Map(); ink.incident = {};
    ink.routeFails = 0; ink.routeCalls = 0; ink.hairlines = 0;
    const rng = rngOf(st.seed ^ 0x5EED);
    const mx = PLAY.x + PLAY.w * 0.15, my = PLAY.y + PLAY.h * 0.15;
    const mw = PLAY.w * 0.70, mh = PLAY.h * 0.70;
    const MIN = st.n <= 3 ? 190 : 140;
    for (let i = 0; i < st.n; i++) {
      let best = null, bestD = -1;
      for (let t = 0; t < 260; t++) {
        const p = { x: mx + rng() * mw, y: my + rng() * mh };
        let d = Infinity;
        for (const q of ink.pos) d = Math.min(d, Math.hypot(p.x - q.x, p.y - q.y));
        if (d === Infinity) { best = p; break; }
        if (d > bestD) { bestD = d; best = p; }
        if (d >= MIN) { best = p; break; }
      }
      ink.pos.push(best);
    }
  };

  /* ── THE PEN'S RULE. The one validator. Returns true if this centreline may be
     inked: it must stay inside PLAY (the margin is a wall — topologically free,
     since a disc and a plane have the same faces), keep CLEARANCE from all
     committed ink and from every spot it does not belong to, and not touch
     itself outside a BACK-sample window. ------------------------------------ */
  ink.strokeIsLegal = function (poly, o) {
    o = o || {};
    const nib = o.nib || NIB_R;
    const clear = o.clear != null ? o.clear : clearFor(nib);
    const P = o.resampled ? poly : resample(poly, STEP);
    if (P.length < 2) return false;
    const from = o.fromSpot, to = o.toSpot;
    const fp = from != null ? ink.pos[from] : null, tp = to != null ? ink.pos[to] : null;
    const c2 = clear * clear;
    const selfLoop = from != null && from === to && !!fp;
    const inc = (sid, cid) => sid != null && ink.incident[sid] && ink.incident[sid][cid];
    const nearPt = (a, b, c) => dist2(a.x, a.y, c.x, c.y) < R_EXEMPT * R_EXEMPT || dist2(b.x, b.y, c.x, c.y) < R_EXEMPT * R_EXEMPT;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      // the margin is a wall
      if (p.x < PLAY.x || p.x > PLAY.x + PLAY.w || p.y < PLAY.y || p.y > PLAY.y + PLAY.h) return false;
      // spot discs (never your own two endpoints)
      for (let s = 0; s < ink.pos.length; s++) {
        if (s === from || s === to || !ink.pos[s]) continue;
        if (dist2(p.x, p.y, ink.pos[s].x, ink.pos[s].y) < (SPOT_R + clear) * (SPOT_R + clear)) return false;
      }
    }
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      const exempt = (fp && (dist2(a.x, a.y, fp.x, fp.y) < R_EXEMPT * R_EXEMPT || dist2(b.x, b.y, fp.x, fp.y) < R_EXEMPT * R_EXEMPT))
                  || (tp && (dist2(a.x, a.y, tp.x, tp.y) < R_EXEMPT * R_EXEMPT || dist2(b.x, b.y, tp.x, tp.y) < R_EXEMPT * R_EXEMPT));
      for (const s of ink.near(a.x, a.y, b.x, b.y)) {
        /* THE EXEMPTION IS PER-CURVE, NOT A HOLE IN THE PAPER. Curves that MEET
           this stroke's own spot genuinely converge there, so no distance test can
           hold near it — those, and only those, are relaxed inside R_EXEMPT. A
           FOREIGN curve passing nearby is enforced to the last su. (A blanket
           radial exemption let a hairline slip across a stranger's curve and out
           of its own face — every drift this build ever had came from there.)

           AND THE RELAXATION IS NOT A WAIVER. Distance is dropped; ORIENTATION
           takes its place. Inside the disc the incident curve may be touched, run
           alongside, hugged — but not CROSSED. That is the exact topological
           content of "you stayed in the corner you left from", and it is strictly
           better than the angular sector rule it replaces: a sector is a wedge of
           straight walls laid over curved ink, so it refused perfectly drawable
           routes (the router stalled on ~1 game in 6) while still leaking a
           hairline that bent back inside its own wedge (6 of 64 cross-face pairs
           stayed routable). One test fixed both, because both had one cause:
           NEAR A SPOT, DISTANCE IS NOT A MODEL OF "DID YOU CROSS A LINE". */
        const relaxA = exempt && fp && inc(from, s.cid) && nearPt(a, b, fp);
        const relaxB = exempt && tp && inc(to, s.cid) && nearPt(a, b, tp);
        if (relaxA || relaxB) {
          const X = segCross(a.x, a.y, b.x, b.y, s.x1, s.y1, s.x2, s.y2);
          if (!X) continue;
          // …except the shared endpoint itself, which every incident curve owns.
          const atA = relaxA && dist2(X.x, X.y, fp.x, fp.y) < R_MERGE * R_MERGE;
          const atB = relaxB && dist2(X.x, X.y, tp.x, tp.y) < R_MERGE * R_MERGE;
          if (atA || atB) continue;
          return false;
        }
        if (segSegDist2(a.x, a.y, b.x, b.y, s.x1, s.y1, s.x2, s.y2) < c2) return false;
      }
      /* Self-collision, outside the BACK window — and A LOOP IS NOT A COLLISION.
         A self-loop leaves its spot and comes home to it, so its head and its tail
         genuinely converge on the same point: a distance test refuses every loop
         ever drawn, and for a while it silently did (at n=5 the last playable move
         is very often the only remaining self-loop, so the game halted early and
         the margin's bracket became a lie). Where both segments are inside the
         shared spot's own disc the question is again the topological one — did the
         stroke CROSS itself, or merely come home? */
      for (let j = 1; j < i - BACK; j++) {
        const c = P[j - 1], d = P[j];
        if (segSegDist2(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y) >= c2) continue;
        if (selfLoop) {
          const rr = R_EXEMPT * R_EXEMPT;
          const home = dist2(a.x, a.y, fp.x, fp.y) < rr && dist2(b.x, b.y, fp.x, fp.y) < rr
                    && dist2(c.x, c.y, fp.x, fp.y) < rr && dist2(d.x, d.y, fp.x, fp.y) < rr;
          if (home) {
            const X = segCross(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
            if (!X || dist2(X.x, X.y, fp.x, fp.y) < R_MERGE * R_MERGE) continue;
          }
        }
        return false;
      }
    }
    return true;
  };
  /* Where a live drag first goes wrong — the closest-approach point, so the flare
     blooms exactly where the eye says the near-miss happened. Returns null if the
     stroke is clean. Also names WHICH curve was struck, so it can warm. */
  ink.firstConflict = function (poly, o) {
    o = o || {};
    const P = o.resampled ? poly : resample(poly, STEP);
    const from = o.fromSpot, to = o.toSpot;
    const fp = from != null ? ink.pos[from] : null, tp = to != null ? ink.pos[to] : null;
    const c2 = CLEARANCE * CLEARANCE;
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      if (b.x < PLAY.x || b.x > PLAY.x + PLAY.w || b.y < PLAY.y || b.y > PLAY.y + PLAY.h) {
        return { i, x: Math.max(PLAY.x, Math.min(PLAY.x + PLAY.w, b.x)), y: Math.max(PLAY.y, Math.min(PLAY.y + PLAY.h, b.y)), cid: -1, wall: true };
      }
      for (let s = 0; s < ink.pos.length; s++) {
        if (s === from || s === to || !ink.pos[s]) continue;
        if (dist2(b.x, b.y, ink.pos[s].x, ink.pos[s].y) < (SPOT_R + CLEARANCE) * (SPOT_R + CLEARANCE))
          return { i, x: b.x, y: b.y, cid: -1, spot: s };
      }
      /* Exactly the rule strokeIsLegal enforces — the flare must bloom where the
         validator would actually refuse, or the pen would be lying to the hand. */
      const inc = (sid, cid) => sid != null && ink.incident[sid] && ink.incident[sid][cid];
      const nearPt = (c) => (fp && dist2(c.x, c.y, fp.x, fp.y) < R_EXEMPT * R_EXEMPT ? 1 : 0)
                          | (tp && dist2(c.x, c.y, tp.x, tp.y) < R_EXEMPT * R_EXEMPT ? 2 : 0);
      const zone = nearPt(a) | nearPt(b);
      for (const s of ink.near(a.x, a.y, b.x, b.y)) {
        const relaxA = (zone & 1) && inc(from, s.cid);
        const relaxB = (zone & 2) && inc(to, s.cid);
        if (relaxA || relaxB) {
          const X = segCross(a.x, a.y, b.x, b.y, s.x1, s.y1, s.x2, s.y2);
          if (!X) continue;
          if (relaxA && dist2(X.x, X.y, fp.x, fp.y) < R_MERGE * R_MERGE) continue;
          if (relaxB && dist2(X.x, X.y, tp.x, tp.y) < R_MERGE * R_MERGE) continue;
          return { i, x: X.x, y: X.y, cid: s.cid };
        }
        if (segSegDist2(a.x, a.y, b.x, b.y, s.x1, s.y1, s.x2, s.y2) < c2) return { i, x: b.x, y: b.y, cid: s.cid };
      }
      for (let j = 1; j < i - BACK; j++) {
        const c = P[j - 1], d = P[j];
        if (segSegDist2(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y) >= c2) continue;
        if (from != null && from === to && fp) {     // a loop coming home is not a collision
          const rr = R_EXEMPT * R_EXEMPT;
          if (dist2(a.x, a.y, fp.x, fp.y) < rr && dist2(b.x, b.y, fp.x, fp.y) < rr
           && dist2(c.x, c.y, fp.x, fp.y) < rr && dist2(d.x, d.y, fp.x, fp.y) < rr) {
            const X = segCross(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
            if (!X || dist2(X.x, X.y, fp.x, fp.y) < R_MERGE * R_MERGE) continue;
          }
        }
        return { i, x: b.x, y: b.y, cid: -2 };
      }
    }
    return null;
  };

  /* ── which spots does this stroke run between, and at what angles? ───────── */
  ink.endpoints = function (st, poly) {
    const P = resample(poly, STEP);
    if (P.length < 3) return null;
    const land = ink.coarse ? LAND_R_COARSE : LAND_R;
    let a = -1, b = -1;
    for (let s = 0; s < ink.pos.length; s++) {
      if (!ink.pos[s]) continue;
      if (a < 0 && dist2(P[0].x, P[0].y, ink.pos[s].x, ink.pos[s].y) < ARM_R * ARM_R) a = s;
    }
    const last = P[P.length - 1];
    for (let s = 0; s < ink.pos.length; s++) {
      if (!ink.pos[s]) continue;
      if (dist2(last.x, last.y, ink.pos[s].x, ink.pos[s].y) < land * land) { b = s; break; }
    }
    if (a < 0 || b < 0) return null;
    const angAt = (pts, sp) => {
      const c = ink.pos[sp];
      for (const p of pts) if (dist2(p.x, p.y, c.x, c.y) > ATTACH * ATTACH) return toCoreAng(p.x - c.x, p.y - c.y);
      const q = pts[pts.length - 1];
      return toCoreAng(q.x - c.x, q.y - c.y);
    };
    return { a, b, angA: angAt(P, a), angB: angAt(P.slice().reverse(), b), poly: P };
  };

  /* ── the roomiest point on the new curve: 24 candidates in s ∈ [0.35L, 0.65L],
     take the one furthest from all other ink. THIS IS THE ANTI-SLIVER POLICY —
     it is what keeps topologically legal moves geometrically drawable late in a
     game, not a nicety. ---------------------------------------------------- */
  ink.roomiestOn = function (P) {
    const L = polyLen(P);
    let best = null, bestD = -1, acc = 0, k = 0;
    const cand = [];
    for (let t = 0; t < 24; t++) cand.push(0.35 * L + (0.30 * L * t) / 23);
    let ci = 0, run = 0;
    for (let i = 1; i < P.length && ci < cand.length; i++) {
      const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
      while (ci < cand.length && run + d >= cand[ci]) {
        const t = d > 1e-6 ? (cand[ci] - run) / d : 0;
        const p = { x: P[i - 1].x + (P[i].x - P[i - 1].x) * t, y: P[i - 1].y + (P[i].y - P[i - 1].y) * t, idx: i };
        let m = Infinity;
        for (const s of ink.near(p.x - 40, p.y - 40, p.x + 40, p.y + 40)) m = Math.min(m, ptSegDist2(p.x, p.y, s.x1, s.y1, s.x2, s.y2));
        for (let q = 0; q < ink.pos.length; q++) if (ink.pos[q]) m = Math.min(m, dist2(p.x, p.y, ink.pos[q].x, ink.pos[q].y));
        // also prefer distance from the play walls
        m = Math.min(m, Math.pow(Math.min(p.x - PLAY.x, PLAY.x + PLAY.w - p.x, p.y - PLAY.y, PLAY.y + PLAY.h - p.y), 2));
        if (m > bestD) { bestD = m; best = p; }
        ci++;
      }
      run += d;
    }
    if (!best) { best = P[Math.floor(P.length / 2)]; best = { x: best.x, y: best.y, idx: Math.floor(P.length / 2) }; }
    return best;
  };

  /* ── commit: bake the polyline into the hash, place the new spot, and split the
     curve into its two darts (which is what makes exact boundary geometry — and
     therefore the partition — possible). --------------------------------- */
  ink.commit = function (st, curve) {
    const P = resample(curve.poly || [], STEP);
    curve.poly = P;
    const mid = ink.roomiestOn(P);
    ink.pos[curve.mid] = { x: mid.x, y: mid.y };
    const cid = curve.id;
    for (let i = 1; i < P.length; i++) ink.addSeg(P[i - 1].x, P[i - 1].y, P[i].x, P[i].y, cid);
    ink.curves[cid] = { poly: P, midIdx: mid.idx, a: curve.a, b: curve.b, mid: curve.mid, by: curve.by };
    for (const sid of [curve.a, curve.b, curve.mid]) { (ink.incident[sid] = ink.incident[sid] || {})[cid] = true; }
    // dart polylines: e1 = a↔mid, e2 = b↔mid
    const e1 = st.edges[curve.e1], e2 = st.edges[curve.e2];
    const head = P.slice(0, Math.max(2, mid.idx + 1)); head[head.length - 1] = { x: mid.x, y: mid.y };
    const tail = P.slice(Math.min(P.length - 2, mid.idx)); tail[0] = { x: mid.x, y: mid.y };
    ink.dartPoly[e1.d0] = head;                       // a → mid
    ink.dartPoly[e1.d1] = head.slice().reverse();     // mid → a
    ink.dartPoly[e2.d0] = tail.slice().reverse();     // b → mid
    ink.dartPoly[e2.d1] = tail;                       // mid → b
    /* The new spot's OWN two angles must come from the real ink. core.commitMove
       seeds them with placeholders because it is pixel-free and cannot know which
       way the curve actually ran; leaving those in place would make every corner
       at a new spot a fiction — and the board-cannot-drift probe reads exactly
       these angles. (Two darts have only one cyclic order, so writing them here
       cannot disturb the face bookkeeping.) */
    const ang = (dp) => {
      const a = dp[0], b = dp[Math.min(dp.length - 1, 3)] || dp[dp.length - 1];
      return toCoreAng(b.x - a.x, b.y - a.y);
    };
    st.darts[e1.d1].ang = ang(ink.dartPoly[e1.d1]);   // mid → a
    st.darts[e2.d1].ang = ang(ink.dartPoly[e2.d1]);   // mid → b
    return mid;
  };

  /* ── THE PARTITION — the one place the ink is load-bearing ────────────────
     When a stroke joins two corners of the SAME boundary cycle, the face splits
     and its other boundary components (islands) must be dealt to one side. On
     paper the drawn loop decides, so here the drawn loop decides: we build face
     A's closed boundary from the real dart polylines plus the new stroke, and
     test each island's representative point against it.
     (Any partition yields a legal Sprouts game, so the CLAIM never depends on
     this being right — only the picture does. When the walk is degenerate we say
     so and fall back, rather than pretending.) --------------------------- */
  ink.partitionByInk = function (st, face, poly, la, lb) {
    if (la.ci !== lb.ci) return null;                 // a merge needs no partition
    const C = face.cycles[la.ci];
    const P = resample(poly, STEP);
    let ring;
    if (C.iso != null || la.di === lb.di) {
      ring = P.slice();                               // a loop back into one corner: the loop IS the ring
    } else {
      const L = C.d.length; ring = [];
      for (let k = la.di; k !== lb.di; k = (k + 1) % L) {
        const dp = ink.dartPoly[C.d[k]];
        if (!dp) { ring = null; break; }
        for (const p of dp) ring.push(p);
      }
      if (ring) for (let i = P.length - 1; i >= 0; i--) ring.push(P[i]);
    }
    if (!ring || ring.length < 4) return (cy, k) => k % 2 === 0;
    /* `ring` is face A's OWN boundary walk. Face A and face B are bounded by the
       SAME closed curve — one from inside, one from outside — so "is this island
       inside the ring?" is only half the answer. The walk's ORIENTATION supplies
       the other half: A is the bounded side exactly when its walk is positive. */
    const aIsInterior = signedArea2(ring) > 0;
    return function (cy) {
      const sid = cy.iso != null ? cy.iso : st.darts[cy.d[0]].spot;
      const p = ink.pos[sid];
      if (!p) return false;
      const inside = inPoly(p.x, p.y, ring);
      return aIsInterior ? inside : !inside;
    };
  };

  /* ── THE ROUTER ───────────────────────────────────────────────────────────
     Conservative Uint8Array dilation (NIB + CLEAR + G·0.7071 — the half-diagonal
     keeps it conservative, so any free cell is genuinely clear), one flood, BFS,
     then a beauty pass that BACKS OFF rather than failing: Chaikin k = 3,2,1,0,
     each candidate revalidated through the SAME strokeIsLegal the human's stroke
     goes through. The raw lattice path is always legal, so beauty may back off
     and legality never fails. Ladder G ∈ {4,2,1}; then THE HAIRLINE VALVE —
     a tight place gets a fine line, which is what a hand with a pen does anyway.
     If even that fails, the caller tries a different legal move. The router NEVER
     concedes: concession comes from core.terminal() alone. -------------------- */
  ink.grid = function (G, nib, skipSpots, exempt, box, extra) {
    /* THE WINDOW. A grid need only cover the paper the route could plausibly use.
       At G = 1 the whole play rect is 800×552 = 441k cells, and a flood allocates
       two arrays that size — so an unroutable move used to cost a fifth of a
       second before it could be given up on, and the endgame calls the router
       dozens of times. A fine grid is for a TIGHT LOCAL SQUEEZE, and a squeeze is
       by definition near the two spots; the coarse rung already owns the long way
       round, where there is open paper to find it in. Clipped to PLAY, so the
       margin stays a wall. */
    const bx = box ? Math.max(PLAY.x, box.x) : PLAY.x;
    const by = box ? Math.max(PLAY.y, box.y) : PLAY.y;
    const bw = (box ? Math.min(PLAY.x + PLAY.w, box.x + box.w) : PLAY.x + PLAY.w) - bx;
    const bh = (box ? Math.min(PLAY.y + PLAY.h, box.y + box.h) : PLAY.y + PLAY.h) - by;
    const ox = bx, oy = by;
    const w = Math.ceil(bw / G), h = Math.ceil(bh / G);
    const occ = new Uint8Array(w * h);
    /* A cell is BLOCKED unless its centre keeps the very clearance strokeIsLegal
       demands, plus the half-diagonal G·0.7071 so the dilation stays CONSERVATIVE:
       any free cell is genuinely clear, and the router can only ever be shyer than
       the rules — never bolder. */
    /* `extra` is ROOM TO SPARE — clearance the rules do not demand, asked for on
       the first rungs only. A shortest path is a greedy path: it shaves past every
       obstacle it can, and each shave leaves a sliver of paper too thin for anyone
       to draw in later. Asking the coarse rung for a corridor wider than the law
       requires makes the house sweep through open paper the way a hand does, and
       it is the single biggest thing keeping a crowded n=5 board drawable to its
       true terminal. It can only ever REFUSE routes, never permit an illegal one —
       so it costs nothing but a rung. */
    const clear = clearFor(nib || NIB_R) + (extra || 0);
    const R = clear + G * 0.7071;
    const stamp = (x1, y1, x2, y2) => {
      const gx0 = Math.max(0, Math.floor((Math.min(x1, x2) - R - ox) / G));
      const gx1 = Math.min(w - 1, Math.ceil((Math.max(x1, x2) + R - ox) / G));
      const gy0 = Math.max(0, Math.floor((Math.min(y1, y2) - R - oy) / G));
      const gy1 = Math.min(h - 1, Math.ceil((Math.max(y1, y2) + R - oy) / G));
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const px = ox + (gx + 0.5) * G, py = oy + (gy + 0.5) * G;
        if (ptSegDist2(px, py, x1, y1, x2, y2) < R * R) occ[gy * w + gx] = 1;
      }
    };
    const exemptCids = {};
    if (exempt) for (const c of exempt) if (c.spot != null && ink.incident[c.spot]) for (const k in ink.incident[c.spot]) exemptCids[k] = true;
    const deferred = [];
    for (const s of ink.segs) { if (exemptCids[s.cid]) { deferred.push(s); continue; } stamp(s.x1, s.y1, s.x2, s.y2); }
    /* Ink attached to the route's OWN two spots is exempt inside R_EXEMPT — the
       same exemption strokeIsLegal grants, and without it every spot that already
       carries a curve would be walled in: two slots 55° apart are 14.8 su apart at
       the attach radius, less than the dilation radius, so the launch cell would
       always read blocked and the router would "fail" on a perfectly drawable move.
       Cleared BEFORE the spot discs are stamped, so other spots still block. */
    if (exempt) for (const c of exempt) {
      const gx0 = Math.max(0, Math.floor((c.x - R_EXEMPT - ox) / G)), gx1 = Math.min(w - 1, Math.ceil((c.x + R_EXEMPT - ox) / G));
      const gy0 = Math.max(0, Math.floor((c.y - R_EXEMPT - oy) / G)), gy1 = Math.min(h - 1, Math.ceil((c.y + R_EXEMPT - oy) / G));
      /* The opening is the WHOLE disc. It used to be sector-shaped, to stop the
         flood leaking into a neighbouring corner — but a wedge of straight walls
         laid over curved ink refuses far more good routes than it catches bad
         ones. The corner is now confirmed where it is actually decided: on the
         finished candidate's measured departure angle, below. */
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const px = ox + (gx + 0.5) * G, py = oy + (gy + 0.5) * G;
        if (dist2(px, py, c.x, c.y) < R_EXEMPT * R_EXEMPT) occ[gy * w + gx] = 0;
      }
    }
    // …then the exempt curves are stamped OUTSIDE the exemption discs, so they
    // still wall off everything beyond the spot they converge at.
    for (const s of deferred) {
      let skip = false;
      for (const c of exempt) if (dist2((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, c.x, c.y) < R_EXEMPT * R_EXEMPT) skip = true;
      if (!skip) stamp(s.x1, s.y1, s.x2, s.y2);
    }
    for (let i = 0; i < ink.pos.length; i++) {
      const p = ink.pos[i]; if (!p) continue;
      if (skipSpots && skipSpots.indexOf(i) >= 0) continue;
      const rr = SPOT_R + clear + G * 0.7071;
      const gx0 = Math.max(0, Math.floor((p.x - rr - ox) / G)), gx1 = Math.min(w - 1, Math.ceil((p.x + rr - ox) / G));
      const gy0 = Math.max(0, Math.floor((p.y - rr - oy) / G)), gy1 = Math.min(h - 1, Math.ceil((p.y + rr - oy) / G));
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
        const px = ox + (gx + 0.5) * G, py = oy + (gy + 0.5) * G;
        if (dist2(px, py, p.x, p.y) < rr * rr) occ[gy * w + gx] = 1;
      }
    }
    return { occ, w, h, G, ox, oy };
  };
  /* ONE flood per launch point: prev[] then holds a shortest path to EVERY cell,
     so a fan of landing directions costs one flood, not one per pair. This is what
     keeps a hard route (the case that walks the whole ladder) cheap enough that the
     deliberation pause hides it entirely. */
  function floodFrom(gr, sources) {
    const { occ, w, h } = gr;
    const prev = new Int32Array(w * h).fill(-1);
    const q = new Int32Array(w * h); let qh = 0, qt = 0;
    /* ONE flood for the WHOLE fan of exit directions, not one per direction. At
       G=1 the grid is 800×552 and a flood allocates two arrays of that size; doing
       it seven times per rung was most of the router's cost (and the reason a hard
       position took over a second). Multi-source costs the same as single-source
       and answers every launch at once. */
    for (const s of sources) { if (occ[s] || prev[s] >= 0) continue; q[qt++] = s; prev[s] = s; }
    if (qt === 0) return null;
    const dxs = [1, -1, 0, 0, 1, 1, -1, -1], dys = [0, 0, 1, -1, 1, -1, 1, -1];
    while (qh < qt) {
      const c = q[qh++], cx = c % w, cy = (c / w) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = cx + dxs[k], ny = cy + dys[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (occ[ni] || prev[ni] >= 0) continue;
        if (k >= 4 && (occ[cy * w + nx] || occ[ny * w + cx])) continue;  // no diagonal squeeze
        prev[ni] = c; q[qt++] = ni;
      }
    }
    return prev;
  }
  function extract(prev, gr, tx, ty) {
    const t = ty * gr.w + tx;
    if (!prev || prev[t] < 0) return null;
    const path = []; let c = t;
    for (let guard = 0; guard < gr.w * gr.h; guard++) { path.push(c); if (prev[c] === c) break; c = prev[c]; }
    path.reverse();
    return path;
  }
  /* Where should a route leave a spot, to land in the corner this move names? */
  ink.exitAngle = function (st, spot, dart) {
    const sp = st.spots[spot];
    if (sp.darts.length === 0 || dart == null) return null;   // any direction will do
    const r = sp.darts;
    const k = r.indexOf(dart);
    if (k < 0) return null;
    const prev = r[(k - 1 + r.length) % r.length];
    const a0 = st.darts[prev].ang, a1 = st.darts[dart].ang;
    let span = a1 - a0; while (span <= 0) span += Math.PI * 2;
    if (r.length === 1) span = Math.PI * 2;
    return a0 + span / 2;
  };
  /* The corner sector, read off the state's own rotation. (Kept here rather than
     imported so this module stays standalone; it is the same arithmetic as
     core.cornerSpan and the twin asserts the two agree.) */
  ink.cornerSpan = function (st, spot, dart) {
    const r = st.spots[spot].darts;
    const TAU2 = Math.PI * 2;
    if (r.length === 0 || dart == null) return { a0: 0, span: TAU2 };
    const k = r.indexOf(dart);
    if (k < 0) return { a0: 0, span: TAU2 };
    const prev = r[(k - 1 + r.length) % r.length];
    const a0 = st.darts[prev].ang;
    let span = st.darts[dart].ang - a0;
    span = ((span % TAU2) + TAU2) % TAU2;
    return { a0, span: r.length === 1 ? TAU2 : span };
  };
  ink.route = function (st, move, o) {
    o = o || {};
    ink.routeCalls++;
    const A = move.a, B = move.b;
    const pa = ink.pos[A.spot], pb = ink.pos[B.spot];
    if (!pa || !pb) return null;
    const rng = rngOf(((A.spot * 7919) ^ (B.spot * 104729) ^ (st.movesMade * 31) ^ (st.seed || 1)) >>> 0);
    const angA0 = ink.exitAngle(st, A.spot, A.dart);
    const angB0 = ink.exitAngle(st, B.spot, B.dart);
    const secA = ink.cornerSpan(st, A.spot, A.dart), secB = ink.cornerSpan(st, B.spot, B.dart);
    const clamp = (p) => ({ x: Math.max(PLAY.x + 2, Math.min(PLAY.x + PLAY.w - 2, p.x)), y: Math.max(PLAY.y + 2, Math.min(PLAY.y + PLAY.h - 2, p.y)) });

    /* THE LADDER. Coarse-and-fast first; a finer grid only when the coarse one
       cannot see a way through; and finally THE HAIRLINE VALVE — the nib tapers
       toward NIB_MIN so a tight place gets a fine line, which is what a hand with
       a pen does anyway. If even that fails the CALLER tries a different legal
       move. The router NEVER concedes: concession comes from terminal() alone. */
    /* The fine rungs get a WINDOW around the two spots — a tight squeeze is local
       by definition, and the coarse rung already owns the long way round. Measured:
       the fine rungs succeed 82 times in a few hundred routes but were charging the
       full 441k-cell grid on every failure too. */
    const pad = 150;
    const box = { x: Math.min(pa.x, pb.x) - pad, y: Math.min(pa.y, pb.y) - pad,
                  w: Math.abs(pa.x - pb.x) + 2 * pad, h: Math.abs(pa.y - pb.y) + 2 * pad };
    /* `loopR` is HOW BIG A LOOP THE HAND WOULD DRAW. A self-loop routed by a
       shortest path is a knot a few su across — legal, and ugly, and unreadable as
       "a curve that comes back". Walling off a generous disc around the spot forces
       the loop to bulge; the rungs then climb down to a tighter loop only where a
       generous one will not fit, which is exactly what a hand does. */
    const rungs = [{ G: 4, nib: NIB_R, extra: 18, loopR: 84 }, { G: 4, nib: NIB_R, extra: 7, loopR: 58 },
                   { G: 4, nib: NIB_R, loopR: 36 }, { G: 4, nib: NIB_R },
                   { G: 2, nib: NIB_R, box }, { G: 1, nib: NIB_MIN, hair: true, box }];
    /* THE LAST RESORT, and it is only ever reached when the alternative is the
       house having nothing to draw — which would end a game short of 2n moves and
       make the bracket in the margin a lie. So when every other move has failed
       too, the finest grid gets the whole sheet to look at. Expensive, and paid
       once a game at most. */
    if (o.desperate) rungs.push({ G: 1, nib: NIB_MIN, hair: true });

    for (const rung of rungs) {
      const gr = ink.grid(rung.G, rung.nib, [A.spot, B.spot],
                          [{ x: pa.x, y: pa.y, spot: A.spot }, { x: pb.x, y: pb.y, spot: B.spot }], rung.box, rung.extra);
      const inBox = (p) => p.x >= gr.ox && p.y >= gr.oy && p.x < gr.ox + gr.w * rung.G && p.y < gr.oy + gr.h * rung.G;
      const gx = (p) => Math.max(0, Math.min(gr.w - 1, Math.floor((p.x - gr.ox) / rung.G)));
      const gy = (p) => Math.max(0, Math.min(gr.h - 1, Math.floor((p.y - gr.oy) / rung.G)));
      const free = (p) => inBox(p) && !gr.occ[gy(p) * gr.w + gx(p)];
      const loop = A.spot === B.spot;
      const loopR = loop ? Math.max(R_EXEMPT + rung.G, rung.loopR || 0) : 0;
      const R0 = loop ? loopR + 3 : ATTACH;
      /* Exit directions SWEEP THE WHOLE CORNER (a bisector that happens to be
         blocked is not a reason to give up on a corner 100° wide), and each ray
         MARCHES OUTWARD until it finds open paper. Before this, a blocked launch
         cell failed the move outright — two routes in three. */
      /* Exit directions SWEEP THE WHOLE CORNER (a bisector that happens to be
         blocked is not a reason to give up on a corner 100° wide), and each ray
         MARCHES OUTWARD until it finds open paper. u runs across the corner. */
      const angAt = (sec, wantAng, u) => (sec && sec.span < Math.PI * 2 - 1e-6)
        ? sec.a0 + sec.span * u
        : (wantAng == null ? u * Math.PI * 2 : wantAng + (u - 0.5) * Math.PI * 1.84);
      const launch = (c, sec, wantAng, u0, u1) => {
        const out = [];
        for (const fr of [0.5, 0.32, 0.68, 0.18, 0.82, 0.06, 0.94]) {
          const ang = angAt(sec, wantAng, u0 + (u1 - u0) * fr);
          const d = coreDir(ang);
          for (let r = R0; r <= R0 + 56; r += 4) {
            const p = clamp({ x: c.x + d.x * r, y: c.y + d.y * r });
            if (free(p)) { out.push({ p, ang }); break; }
          }
        }
        return out;
      };
      /* ── THE LOOP IS ITS OWN PROBLEM. A shortest path from a spot back to the
         same spot is the empty path, so a BFS router simply cannot draw one: the
         two exits sit a few cells apart inside the same cleared disc and the
         "route" between them is four pixels long. Left unfixed this is not a
         cosmetic gap — at n=5 the last playable move is often the only self-loop
         left, and a house that cannot draw it halts the game early.
         So a loop is routed the way a hand draws one: launch OUTSIDE the spot's
         own disc, wall the disc off, and make the path go all the way around. */
      /* AND THE TWO ENDS OF A LOOP MUST LEAVE BY DIFFERENT DOORS. Both ends of a
         self-loop read the SAME corner — often the whole circle — so sweeping the
         same directions for both hands the flood a start and a finish one cell
         apart, and the "loop" it draws is four pixels long. Split the sweep: one
         end takes the first half of the corner, the other the second half. */
      const As = loop ? launch(pa, secA, angA0, 0.04, 0.42) : launch(pa, secA, angA0, 0.06, 0.94);
      const Bs = loop ? launch(pb, secB, angB0, 0.58, 0.96) : launch(pb, secB, angB0, 0.06, 0.94);
      if (As.length === 0 || Bs.length === 0) continue;
      if (loop) {
        const rr = loopR;
        const gx0 = Math.max(0, Math.floor((pa.x - rr - gr.ox) / rung.G)), gx1 = Math.min(gr.w - 1, Math.ceil((pa.x + rr - gr.ox) / rung.G));
        const gy0 = Math.max(0, Math.floor((pa.y - rr - gr.oy) / rung.G)), gy1 = Math.min(gr.h - 1, Math.ceil((pa.y + rr - gr.oy) / rung.G));
        for (let cy = gy0; cy <= gy1; cy++) for (let cx = gx0; cx <= gx1; cx++) {
          const px = gr.ox + (cx + 0.5) * rung.G, py = gr.oy + (cy + 0.5) * rung.G;
          if (dist2(px, py, pa.x, pa.y) < rr * rr) gr.occ[cy * gr.w + cx] = 1;
        }
        for (const e of As.concat(Bs)) gr.occ[gy(e.p) * gr.w + gx(e.p)] = 0;
      }
      /* FAST FIRST, THOROUGH ONLY WHEN IT MUST BE. One multi-source flood answers
         every exit direction at once and settles the easy 90% of routes for the
         price of a single flood. But it yields exactly ONE path per landing point
         — from whichever exit happens to be nearest — and when that one path is
         smoothed into something the validator refuses, the alternatives are gone.
         So on failure we pay for the diversity we skipped and flood each exit
         separately. The cost lands only on the positions that actually need it. */
      const sourceSets = loop ? [] : [As.map((a) => gy(a.p) * gr.w + gx(a.p))];
      if (As.length > 1 || loop) for (const a of As) sourceSets.push([gy(a.p) * gr.w + gx(a.p)]);
      for (const sources of sourceSets) {
        const prev = floodFrom(gr, sources);
        if (!prev) continue;
        for (const b of Bs) {
          const path = extract(prev, gr, gx(b.p), gy(b.p));
          if (!path || path.length < 2) continue;
          if (loop && path.length < 10) continue;                // a loop needs room to be a loop
          const lattice = path.map((c) => ({ x: gr.ox + ((c % gr.w) + 0.5) * rung.G, y: gr.oy + (((c / gr.w) | 0) + 0.5) * rung.G }));
          const base = [{ x: pa.x, y: pa.y }].concat(lattice, [{ x: pb.x, y: pb.y }]);
          /* BEAUTY BACKS OFF, LEGALITY NEVER FAILS: k = 3,2,1,0, each candidate
             revalidated through the SAME strokeIsLegal a human stroke meets. */
          for (const k of [3, 2, 1, 0]) {
            let cand = chaikin(base, k);
            if (k > 0) {                                 // seeded jitter — a hand, not a plotter
              const j = 1.1;
              cand = cand.map((p, i2) => (i2 < 2 || i2 > cand.length - 3) ? p : { x: p.x + (rng() - 0.5) * j, y: p.y + (rng() - 0.5) * j });
            }
            const R = resample(cand, STEP);
            if (R.length < 3) continue;
            /* THE CORNER IS CONFIRMED, NOT ASSUMED. The core will record this
               curve in the corner the MOVE names, so the ink had better leave by
               it. Measured exactly where the human path measures it — the first
               sample past the attach radius — so router and hand are held to one
               standard. Together with strokeIsLegal's non-crossing rule inside the
               spot's disc, this is what keeps `flood ⊆ faces` true. */
            const aOK = angInSector(departAngle(R, pa), secA);
            const bOK = angInSector(departAngle(R.slice().reverse(), pb), secB);
            if (!aOK || !bOK) continue;
            if (ink.strokeIsLegal(R, { fromSpot: A.spot, toSpot: B.spot, resampled: true, nib: rung.nib })) {
              if (rung.hair) ink.hairlines++;
              // the SAME angles that were just confirmed — never a second reading
              return { poly: R, nib: rung.nib, G: rung.G, hair: !!rung.hair,
                       angA: departAngle(R, pa), angB: departAngle(R.slice().reverse(), pb) };
            }
          }
        }
      }
    }
    ink.routeFails++;
    return null;
  };

  /* ── THE BOARD-CANNOT-DRIFT CHECK ─────────────────────────────────────────
     The honest statement of the architecture is `flood ⊆ faces`: a face may be
     thinner than a nib (so the router may fail to connect two corners the core
     says ARE joined — allowed), but a nib may NEVER cross a curve (so the router
     must never connect two corners the core says are on DIFFERENT faces).

     So this asks the real question with the real router, not with a probe point
     that can wander off its own corner: for pairs of live corners the core places
     on different faces, try to route between them. Every success is a genuine
     drift — the one way this piece could quietly become a liar.
     `corners` = [{spot, dart, face, ang}] from core.liveCorners(). ---------- */
  ink.crossFaceRoutable = function (st, corners, budget) {
    let bad = 0, tried = 0;
    const cap = budget || 12;
    for (let i = 0; i < corners.length && tried < cap; i++) {
      for (let j = i + 1; j < corners.length && tried < cap; j++) {
        const a = corners[i], b = corners[j];
        if (a.face === b.face) continue;
        if (a.spot === b.spot && 3 - st.spots[a.spot].deg < 2) continue;
        tried++;
        const r = ink.route(st, { a: { spot: a.spot, dart: a.dart }, b: { spot: b.spot, dart: b.dart } });
        if (r) bad++;
      }
    }
    return { bad, tried };
  };

  return ink;
}

// ===== END THE SPROUTS INK =====

export {
  SHEET, PLAY, NIB_R, NIB_MIN, W_MAX, TREMBLE, CLEARANCE, SPOT_R, WHISKER, ATTACH,
  STEP, CELL, ARM_R, LAND_R, LAND_R_COARSE, BACK, R_EXEMPT, NIB_ANGLE,
  INK_YOU, INK_HOUSE, PAPER,
  resample, polyLen, chaikin, inPoly, segSegDist2, ptSegDist2, dist2, makeInk,
  clearFor, toCoreAng, coreDir, signedArea2, angInSector, departAngle, segCross,
};
