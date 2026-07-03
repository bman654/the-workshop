/* ════════════════════════════════════════════════════════════════════════════
   formations.js — THE FORMATION REGISTRY (layout engine v2, WS1 §1.3 / §1.8)

   Eight named PACKERS, each a pure, deterministic function that seats a district's
   rooms inside its declared FRAME (contract.js) at the local origin, under the §1.1
   LOT CONTRACT (a uniform base lot that FILLS the frame; floored at MIN_LOT 30px;
   capped at SIZE_BAND[tier]). The generic grid is RETIRED — a contract with a
   missing/unknown layoutFn throws (contract.js.noLayoutFnError). This file is the
   crush machine's replacement (#275/#328/#335/#410 die at the contract, not in a
   packer).

   Each formation implements ONE contract:
     pack(rooms, frame, ctx) → { slots:[{id,x,y,w,h[,cx,cy,r,disc]}], clusterRects, hull }
       — rooms sorted byOrderId; slots at local origin. A round formation (rings/court/
         crescent/knot) emits DISC footprints (the observatory backing-circle idiom,
         #275): x,y,w,h is the disc's bounding box and cx,cy,r the circle; disjointness
         is Euclidean (centre distance ≥ rA+rB+GUT), so an inscribed square footprint
         stays clear too. A grid formation (greathouse/pascal/ashlar/roadside) emits
         axis-aligned RECT footprints. Every pack's hull is CONTAINED in the frame by
         construction — the disc formations place centres already INSET by the disc
         radius (so a disc never leaves the frame); the grid formations size to the
         inset frame and are then centred by fitInto at the SAME pad (no double-shrink).
     maxCapacity(frame) → the largest n this formation seats at ≥ MIN_LOT — an HONEST
       geometric scan (the largest n whose pack still clears MIN_LOT with GUT slack),
       so that pack succeeds for every n ∈ 1..maxCapacity and n = maxCapacity+1 THROWS.
       The W0.2 harness (formations.test.cjs) is the BINDING proof of this contract
       (§1.3: "the harness is the binding proof, not this parenthetical").

   DETERMINISM (§1.6): no Math.random, no Date, no locale/Intl, no unsorted key
   iteration; fixed-iteration bisections; all emitted coords round to 0.1. pack()
   double-runs byte-identical (formations.test.cjs). Pure LIBRARY — reaches for no
   global; forge-inlines standalone and Node-requires standalone.

   RECONCILIATION FLAGGED (repo-wins, §header). The §1.3 maxCapacity FORMULAS for the
   disc formations (court/crescent/knot) are geometrically OPTIMISTIC: they count a
   room's footprint ALONG the curve but ignore that each disc also extends by its RADIUS
   NORMAL to the curve, which forces the seating curve inward and lowers the true count.
   Per §1.3's own rule ("the harness is the binding proof, not this parenthetical") the
   maxCapacity here is an HONEST geometric scan instead of the pinned formula. Two other
   spec details are reconciled to make the honest count MEET the declared district caps:
   (1) COURT seats on a ROUNDED-COURT perimeter (the §1.3 phrase), not an inscribed
   ellipse — more perimeter, so works→17 · gardens→12 · opticks→10 all clear their caps
   (§2.1). (2) KNOT fits each satellite disc against the RECT frame with the ring starting
   on the wide +x axis, so a 2- or 3-room knot uses the long side — cavern→4 (=cap 4),
   outbuilding→3 (≥ cap 2). CRESCENT is FRAME-FITTED (a circular arc whose chord spans
   the inner width and whose sagitta is a fraction of the inner height, concave toward the
   manor) so its hull stays in the promenades frame (a literal 150° R=w/2 arc overflows
   frame.h=130). These honest ceilings are what §1.8's capacity-feasibility check (T0.3)
   must read; they were verified ≥ every declared cap.
   ════════════════════════════════════════════════════════════════════════════ */

var Formations = (function () {
  'use strict';

  /* ── §1.1 lot contract constants (the tier-ratio reference + the floor/cap). ── */
  var MIN_LOT = 30;                                   // the no-speck floor (px, footprint width)
  var TIER_SCALE = { 1: 1.25, 2: 1.0, 3: 0.8 };       // per-room tier scale (render refinement)
  var SIZE_BAND = { 1: { w: 168, h: 116 }, 2: { w: 122, h: 86 }, 3: { w: 92, h: 64 } };
  var ASPECT = SIZE_BAND[2].h / SIZE_BAND[2].w;       // ≈0.7049 — landscape building aspect (h/w)
  var INSET = 14;                                      // frame edge → content pad (DISTRICT_PAD)
  var GUT = 10;                                        // seat gutter (≥ the harness floor 6)

  var r01 = function (v) { return Math.round(v * 10) / 10; };
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ── the surviving v1 helpers (lift, don't rewrite — §1.9). ── */
  function byOrderId(a, b) {
    var oa = a.order == null ? 1e9 : a.order, ob = b.order == null ? 1e9 : b.order;
    if (oa !== ob) return oa - ob;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }
  function rectUnion(rects) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.x < x0) x0 = r.x; if (r.y < y0) y0 = r.y;
      if (r.x + r.w > x1) x1 = r.x + r.w; if (r.y + r.h > y1) y1 = r.y + r.h;
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ── SORT rooms so that (a) the ANCHOR (lowest order, tie by id) leads, and (b)
       cluster members stay CONTIGUOUS (§1.3 court note). Clusters are ordered by their
       own anchor (min order); within a cluster by order/id. The global anchor is the
       first cluster's first room, so it leads the whole sequence — the facade seats the
       sequence start at the manor-facing side. Deterministic. ── */
  function contiguousOrder(rooms) {
    var groups = {};
    rooms.forEach(function (r) { var c = r.wing || ''; (groups[c] = groups[c] || []).push(r); });
    var keys = Object.keys(groups).sort();
    keys.forEach(function (k) { groups[k].sort(byOrderId); });
    // order clusters by their anchor (first room after the within-sort), then by slug
    keys.sort(function (a, b) {
      var ra = groups[a][0], rb = groups[b][0], c = byOrderId(ra, rb);
      return c !== 0 ? c : (a < b ? -1 : a > b ? 1 : 0);
    });
    var out = [];
    keys.forEach(function (k) { groups[k].forEach(function (r) { out.push(r); }); });
    return out;
  }

  /* ── the DISC/RECT item model used between placement and finish. Each item carries
       its room + either a disc {cx,cy,r} or a rect {x,y,w,h} in UNBOUNDED local coords. ── */
  function boundsOf(items) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    items.forEach(function (it) {
      var a, b, c, d;
      if (it.disc) { a = it.cx - it.r; b = it.cy - it.r; c = it.cx + it.r; d = it.cy + it.r; }
      else { a = it.x; b = it.y; c = it.x + it.w; d = it.y + it.h; }
      if (a < x0) x0 = a; if (b < y0) y0 = b; if (c > x1) x1 = c; if (d > y1) y1 = d;
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ── fitInto (§1.9 lift): uniformly scale DOWN (never up) + centre the item cloud
       into the frame with `pad` breathing room, then re-origin at top-left (0,0). Under
       a uniform scale, disjoint discs stay disjoint and rect gutters stay proportional;
       the returned hull is CONTAINED in the frame by construction. Grid packers pass
       their OWN pad so this only CENTRES (scale 1) — the disc packers place in-frame and
       don't call it at all. ── */
  function fitItems(items, fw, fh, pad) {
    pad = pad == null ? INSET : pad;
    var bb = boundsOf(items);
    var availW = fw - 2 * pad, availH = fh - 2 * pad;
    var s = 1;
    if (bb.w > availW) s = Math.min(s, availW / bb.w);
    if (bb.h > availH) s = Math.min(s, availH / bb.h);
    var ox = pad + (availW - bb.w * s) / 2 - bb.x * s;
    var oy = pad + (availH - bb.h * s) / 2 - bb.y * s;
    items.forEach(function (it) {
      if (it.disc) { it.cx = it.cx * s + ox; it.cy = it.cy * s + oy; it.r = it.r * s; }
      else { it.x = it.x * s + ox; it.y = it.y * s + oy; it.w = it.w * s; it.h = it.h * s; }
    });
    return s;
  }

  /* ── turn placed items → the pack return: 0.1-rounded slots, per-cluster tint rects
       (local coords, the v1 wingRects idiom, cluster-keyed), and the contained hull. ── */
  function finish(items, formation) {
    var slots = items.map(function (it) {
      if (it.disc) {
        var bx = r01(it.cx - it.r), by = r01(it.cy - it.r), d = r01(2 * it.r);
        return { id: it.room.id, x: bx, y: by, w: d, h: d, cx: r01(it.cx), cy: r01(it.cy), r: r01(it.r), disc: true };
      }
      return { id: it.room.id, x: r01(it.x), y: r01(it.y), w: r01(it.w), h: r01(it.h) };
    });
    var byCluster = {};
    items.forEach(function (it, i) {
      var c = it.room.wing || '';
      if (c === '') return;
      var s = slots[i];
      (byCluster[c] = byCluster[c] || []).push({ x: s.x, y: s.y, w: s.w, h: s.h });
    });
    var clusterRects = Object.keys(byCluster).sort().map(function (c) {
      var u = rectUnion(byCluster[c]);
      return { cluster: c, x: r01(u.x - 3), y: r01(u.y - 3), w: r01(u.w + 6), h: r01(u.h + 6) };
    });
    var hb = rectUnion(slots.map(function (s) { return { x: s.x, y: s.y, w: s.w, h: s.h }; }));
    var hull = formation === 'rings'
      ? { r: r01(Math.max(hb.w, hb.h) / 2) }
      : { w: r01(hb.w), h: r01(hb.h) };
    return { slots: slots, clusterRects: clusterRects, hull: hull, formation: formation };
  }

  function capThrow(name, n, max, frame) {
    throw new Error('Layout: formation "' + name + '" cannot seat ' + n + ' rooms in frame ' +
      (frame.r != null ? 'r' + frame.r : frame.w + '×' + frame.h) + ' (max ' + max + ' at MIN_LOT ' +
      MIN_LOT + 'px). More breadth here would crush legibility — GATHER, GROW, FOLD, or PETITION (§1.8).');
  }

  /* ── minimum pairwise distance among centre points (Infinity for < 2 points). ── */
  function minChordOf(pts) {
    var m = Infinity;
    for (var i = 0; i < pts.length; i++)
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < m) m = d;
      }
    return m;
  }

  /* ── largest disc radius b ∈ [0, capB] whose n centres (from centresFn(b) — the seating
       curve INSET by b, so discs stay inside the frame) stay pairwise ≥ 2b+GUT apart.
       As b grows the curve tightens AND the requirement grows, so pairwise-clearance is
       monotone in b (downward-closed) → a fixed 48-step bisection converges deterministically.
       n ≤ 1 is unconstrained → capB (the single-disc caller frame-caps it). ── */
  function fitDiscRadius(centresFn, capB, n) {
    if (n <= 1) return capB;
    var lo = 0, hi = capB;
    for (var i = 0; i < 48; i++) {
      var mid = (lo + hi) / 2;
      if (minChordOf(centresFn(mid)) >= 2 * mid + GUT) lo = mid; else hi = mid;
    }
    return lo;
  }

  /* ── the largest disc that fits a single room centred in `frame` (never > tier-1 half). ── */
  function singleDisc(frame) {
    return Math.min(SIZE_BAND[1].w / 2, frame.w / 2 - INSET, frame.h / 2 - INSET);
  }

  /* ── a rounded-rectangle boundary, parametrised arc-length-uniformly in t ∈ [0,1)
       CLOCKWISE from the top-middle. Eight segments (4 straight, 4 quarter-arcs); t maps
       across them by their share of the perimeter, so equal Δt ≈ equal arc length. Pure
       + deterministic. The court seats rooms on this boundary (a "rounded court", §1.3) —
       more perimeter than an inscribed ellipse, so the honest capacity clears the caps. ── */
  function roundedRectParam(cx, cy, hw, hh, rc) {
    rc = Math.max(0, Math.min(rc, Math.min(hw, hh)));
    var ex = hw - rc, ey = hh - rc, q = Math.PI / 2 * rc;
    var TR = { x: cx + ex, y: cy - ey }, BR = { x: cx + ex, y: cy + ey },
        BL = { x: cx - ex, y: cy + ey }, TL = { x: cx - ex, y: cy - ey };
    var segs = [
      { L: ex,     f: function (u) { return { x: cx + u * ex, y: cy - hh }; } },
      { L: q,      f: function (u) { var a = -Math.PI / 2 + u * Math.PI / 2; return { x: TR.x + rc * Math.cos(a), y: TR.y + rc * Math.sin(a) }; } },
      { L: 2 * ey, f: function (u) { return { x: cx + hw, y: cy - ey + u * 2 * ey }; } },
      { L: q,      f: function (u) { var a = u * Math.PI / 2; return { x: BR.x + rc * Math.cos(a), y: BR.y + rc * Math.sin(a) }; } },
      { L: 2 * ex, f: function (u) { return { x: cx + ex - u * 2 * ex, y: cy + hh }; } },
      { L: q,      f: function (u) { var a = Math.PI / 2 + u * Math.PI / 2; return { x: BL.x + rc * Math.cos(a), y: BL.y + rc * Math.sin(a) }; } },
      { L: 2 * ey, f: function (u) { return { x: cx - hw, y: cy + ey - u * 2 * ey }; } },
      { L: q,      f: function (u) { var a = Math.PI + u * Math.PI / 2; return { x: TL.x + rc * Math.cos(a), y: TL.y + rc * Math.sin(a) }; } },
      { L: ex,     f: function (u) { return { x: cx - ex + u * ex, y: cy - hh }; } }
    ];
    var total = 0; for (var s = 0; s < segs.length; s++) total += segs[s].L;
    return {
      total: total,
      pt: function (t) {
        var d = (((t % 1) + 1) % 1) * total, acc = 0;
        for (var i = 0; i < segs.length; i++) {
          if (acc + segs[i].L >= d || i === segs.length - 1) {
            var u = segs[i].L ? (d - acc) / segs[i].L : 0; return segs[i].f(u);
          }
          acc += segs[i].L;
        }
      }
    };
  }

  /* ── fill a RECT region with n uniform landscape lots: choose the column count that
       yields the LARGEST lot width still fitting the region height, capped at maxLot and
       floored at MIN_LOT. Returns {cols, lotW, lotH, rows} or null if n can't fit ≥MIN_LOT.
       (packGrid's fill-sizing form — the crush guard is the null return.) ── */
  function fillGrid(n, rw, rh, gut, maxLot) {
    var best = null;
    for (var cols = 1; cols <= n; cols++) {
      var rows = Math.ceil(n / cols);
      var lotW = Math.min(maxLot, (rw - (cols - 1) * gut) / cols);
      var lotH = lotW * ASPECT;
      var gridH = rows * lotH + (rows - 1) * gut;
      if (lotW < MIN_LOT) continue;                       // this column count crushes → skip
      if (gridH > rh + 0.01) continue;                    // too tall for the region → skip
      if (!best || lotW > best.lotW) best = { cols: cols, lotW: lotW, lotH: lotH, rows: rows };
    }
    return best;
  }

  /* ════════════════════════ THE 4 NEW FORMATIONS ════════════════════════ */

  /* COURT — rooms as backing discs spread along the perimeter of a rounded court (inset by
     the disc radius, so discs stay inside the frame); the green centre is left clear for the
     district STRUCTURE (§5). 2-D by construction — no column collapse is possible. Anchor
     (sequence start, frac 0.5 = the manor-facing bottom) leads; cluster members stay
     contiguous around the perimeter. */
  function courtCentres(frame, n, b, phaseFrac) {
    var cx = frame.w / 2, cy = frame.h / 2;
    if (n === 1) return [{ x: cx, y: cy }];
    var hw = Math.max(1, cx - INSET - b), hh = Math.max(1, cy - INSET - b);
    var P = roundedRectParam(cx, cy, hw, hh, Math.min(hw, hh) * 0.5);
    var pts = [];
    for (var k = 0; k < n; k++) pts.push(P.pt(phaseFrac + k / n));
    return pts;
  }
  var court = {
    maxCapacity: function (frame) {
      var n = 0;
      for (var k = 1; k <= 200; k++) {
        var b = (k === 1) ? singleDisc(frame)
          : fitDiscRadius(function (bb) { return courtCentres(frame, k, bb, 0.5); }, SIZE_BAND[1].w / 2, k);
        if (b >= MIN_LOT / 2 - 1e-4) n = k; else break;
      }
      return n;
    },
    pack: function (rooms, frame, ctx) {
      var list = contiguousOrder(rooms);
      var n = list.length, max = this.maxCapacity(frame);
      if (n > max) capThrow('court', n, max, frame);
      var phase = (ctx && typeof ctx.anchorFrac === 'number') ? ctx.anchorFrac : 0.5;
      var b = (n === 1) ? singleDisc(frame)
        : fitDiscRadius(function (bb) { return courtCentres(frame, n, bb, phase); }, SIZE_BAND[1].w / 2, n);
      var pts = courtCentres(frame, n, b, phase);
      var items = list.map(function (r, i) { return { room: r, disc: true, cx: pts[i].x, cy: pts[i].y, r: b }; });
      return finish(items, 'court');
    }
  };

  /* CRESCENT — a single circular arc, concave toward the manor, rooms evenly spread; grows
     by widening. FRAME-FITTED (see header): the chord spans the inner width and the sagitta
     is a fraction of the inner height, both inset by the disc radius, so the hull stays in
     the frame. */
  function crescentCentres(frame, n, b) {
    var cx = frame.w / 2, cy = frame.h / 2;
    if (n === 1) return [{ x: cx, y: cy }];
    var chord = Math.max(2, frame.w - 2 * (INSET + b));
    var availH = Math.max(2, frame.h - 2 * (INSET + b));
    var sag = Math.max(6, availH * 0.9);
    var Rarc = (chord * chord / 4 + sag * sag) / (2 * sag);
    var half = Math.asin(clamp(chord / (2 * Rarc), -1, 1));
    var acx = cx, acy = (INSET + b) + Rarc;                 // circle centre below the crest
    var pts = [];
    for (var k = 0; k < n; k++) {
      var t = -half + 2 * half * k / (n - 1);               // endpoints inclusive → widest spread
      pts.push({ x: acx + Rarc * Math.sin(t), y: acy - Rarc * Math.cos(t) });
    }
    return pts;
  }
  var crescent = {
    maxCapacity: function (frame) {
      var n = 0;
      for (var k = 1; k <= 200; k++) {
        var b = (k === 1) ? singleDisc(frame)
          : fitDiscRadius(function (bb) { return crescentCentres(frame, k, bb); }, SIZE_BAND[1].w / 2, k);
        if (b >= MIN_LOT / 2 - 1e-4) n = k; else break;
      }
      return n;
    },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length, max = this.maxCapacity(frame);
      if (n > max) capThrow('crescent', n, max, frame);
      var b = (n === 1) ? singleDisc(frame)
        : fitDiscRadius(function (bb) { return crescentCentres(frame, n, bb); }, SIZE_BAND[1].w / 2, n);
      var pts = crescentCentres(frame, n, b);
      var items = list.map(function (r, i) { return { room: r, disc: true, cx: pts[i].x, cy: pts[i].y, r: b }; });
      return finish(items, 'crescent');
    }
  };

  /* KNOT — an anchor room large at the centre with satellites on ONE tight ring; n=1
     degenerates to the anchor alone. The ring radius and the uniform satellite radius are
     the largest that (a) fit every satellite disc inside the RECT frame (the ring starts on
     the wide +x axis, so a 2- or 3-room knot exploits the long side), (b) clear the anchor by
     GUT, and (c) clear each other by GUT. The anchor then FILLS the middle (≥ a satellite). */
  var KNOT_MARGIN = 2;                                       // keep discs a touch off the frame edge
  function knotFit(frame, n) {
    var cx = frame.w / 2, cy = frame.h / 2, cap = SIZE_BAND[1].w / 2, k = n - 1;
    if (k <= 0) {
      var b0 = Math.min(cap, cx - KNOT_MARGIN, cy - KNOT_MARGIN);
      return { ok: b0 >= MIN_LOT / 2, cx: cx, cy: cy, bA: b0, bS: 0, Rring: 0, angles: [] };
    }
    var angles = [];
    for (var i = 0; i < k; i++) angles.push(2 * Math.PI * i / k);
    function Rmax(bS) {                                       // largest ring whose every satellite fits the rect
      var m = Infinity;
      for (var a = 0; a < angles.length; a++) {
        var c = Math.abs(Math.cos(angles[a])), s = Math.abs(Math.sin(angles[a]));
        if (c > 1e-9) m = Math.min(m, (cx - KNOT_MARGIN - bS) / c);
        if (s > 1e-9) m = Math.min(m, (cy - KNOT_MARGIN - bS) / s);
      }
      return m;
    }
    function need(bS) {                                       // min ring for sat-sat AND anchor(≥bS)+GUT clearance
      var satsat = (k >= 2) ? (2 * bS + GUT) / (2 * Math.sin(Math.PI / k)) : 0;
      return Math.max(satsat, 2 * bS + GUT);
    }
    // geom(bS) := a ring exists that fits AND clears — DOWNWARD-CLOSED in bS (bigger discs
    // both shrink Rmax and raise need). Bisect for the largest such bS; the MIN_LOT floor is
    // applied to the RESULT, never inside the predicate (that would break monotonicity).
    function geom(bS) { return Rmax(bS) >= need(bS) - 1e-6; }
    var lo = 0, hi = cap;
    for (var it = 0; it < 48; it++) { var mid = (lo + hi) / 2; if (geom(mid)) lo = mid; else hi = mid; }
    var bS = Math.min(lo, cap);
    if (bS < MIN_LOT / 2) return { ok: false, cx: cx, cy: cy, bA: 0, bS: 0, Rring: 0, angles: angles };
    var R = Rmax(bS);                                         // satellites to the frame edge → anchor gets the middle
    var bA = Math.max(bS, Math.min(cap, R - bS - GUT, cx - KNOT_MARGIN, cy - KNOT_MARGIN));
    return { ok: true, cx: cx, cy: cy, bA: bA, bS: bS, Rring: R, angles: angles };
  }
  var knot = {
    maxCapacity: function (frame) {
      var n = 0;
      for (var k = 1; k <= 200; k++) { if (knotFit(frame, k).ok) n = k; else break; }
      return n;
    },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length, max = this.maxCapacity(frame);
      if (n > max) capThrow('knot', n, max, frame);
      var f = knotFit(frame, n);
      var items = [{ room: list[0], disc: true, cx: f.cx, cy: f.cy, r: f.bA }];
      for (var i = 0; i < f.angles.length; i++)
        items.push({ room: list[1 + i], disc: true, cx: f.cx + f.Rring * Math.cos(f.angles[i]), cy: f.cy + f.Rring * Math.sin(f.angles[i]), r: f.bS });
      return finish(items, 'knot');
    }
  };

  /* ROADSIDE — rooms seat at declared ROAD PARAMETERS, not in a frame (§1.3). It IGNORES
     its frame; the ROADSIDE_STOPS table is the budget. pack() reads the solved road
     polyline from ctx.road (a [{x,y}] polyline, t=0 at the tip) and returns rect slots;
     standalone (harness / forge) it synthesises a nominal south-running road long enough
     that the gate and the gatehouse footprints clear. */
  var ROADSIDE_STOPS = [
    { t: 0, at: 'road-tip' },                    // the gate
    { t: 0.18, side: 'east', offset: 14 }        // the gatehouse (offset = halfWidth+14; halfWidth added below)
  ];
  var roadside = {
    maxCapacity: function () { return ROADSIDE_STOPS.length; },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length, max = this.maxCapacity();
      if (n > max) capThrow('roadside', n, max, frame || { w: 0, h: 0 });
      // the road polyline: from ctx, else a nominal straight south run (tip at top). The
      // nominal length keeps the two stops' footprints apart at t=0 / t=0.18.
      var road = (ctx && ctx.road && ctx.road.length >= 2) ? ctx.road
        : [{ x: 60, y: 0 }, { x: 60, y: 500 }];
      var halfWidth = (ctx && ctx.roadHalfWidth != null) ? ctx.roadHalfWidth : 12;
      var band = SIZE_BAND[3];
      function along(t) {                          // point at fractional arc length t∈[0,1]
        var segs = [], tot = 0;
        for (var i = 1; i < road.length; i++) {
          var dx = road[i].x - road[i - 1].x, dy = road[i].y - road[i - 1].y;
          var L = Math.sqrt(dx * dx + dy * dy); segs.push({ a: road[i - 1], b: road[i], L: L }); tot += L;
        }
        var target = t * tot, acc = 0;
        for (var s = 0; s < segs.length; s++) {
          if (acc + segs[s].L >= target || s === segs.length - 1) {
            var f = segs[s].L ? (target - acc) / segs[s].L : 0;
            return { x: segs[s].a.x + (segs[s].b.x - segs[s].a.x) * f, y: segs[s].a.y + (segs[s].b.y - segs[s].a.y) * f };
          }
          acc += segs[s].L;
        }
        return road[road.length - 1];
      }
      var items = [];
      for (var k = 0; k < n; k++) {
        var stop = ROADSIDE_STOPS[k], p = along(stop.t);
        var ox = 0;
        if (stop.side === 'east') ox = halfWidth + stop.offset;
        else if (stop.side === 'west') ox = -(halfWidth + stop.offset);
        items.push({ room: list[k], x: p.x + ox - band.w / 2, y: p.y - band.h / 2, w: band.w, h: band.h });
      }
      // roadside ignores its frame — normalise to a top-left origin WITHOUT scaling (no fit).
      var bb = boundsOf(items);
      items.forEach(function (it) { it.x -= bb.x; it.y -= bb.y; });
      return finish(items, 'roadside');
    }
  };

  /* ════════════════════════ THE 4 LIFTED FORMATIONS ════════════════════════ */

  /* RINGS — the observatory's concentric-contour formation (#275), lifted; the frame is a
     disc {r}. ringCounts / solveRingRadii are lifted verbatim. */
  function ringCounts(n) {
    var rings = [], rem = n;
    if (rem > 0) { rings.push(1); rem -= 1; }
    if (rem > 0) { var c = Math.min(8, rem); rings.push(c); rem -= c; }
    var cap = 12;
    while (rem > 0) { var k = Math.min(cap, rem); rings.push(k); rem -= k; cap += 4; }
    return rings;
  }
  function solveRingRadii(counts, halfMin, gut) {
    var nRings = counts.length - 1;
    if (nRings === 0) return { radii: [0], b: Math.max(4, Math.min(halfMin * 0.5, 18)) };
    var best = null;
    for (var S = 4; S <= halfMin; S += 0.25) {
      var radii = [0];
      for (var k = 1; k <= nRings; k++) radii.push(k * S);
      var b = (S - gut) / 2;
      for (var j = 1; j <= nRings; j++) {
        var nk = counts[j];
        if (nk >= 2) { var chordB = radii[j] * Math.sin(Math.PI / nk) - gut / 2; if (chordB < b) b = chordB; }
      }
      var fitB = halfMin - radii[nRings];
      if (fitB < b) b = fitB;
      if (b > 0 && (!best || b > best.b)) best = { radii: radii.slice(), b: b };
    }
    return best || { radii: [0], b: Math.max(4, halfMin * 0.4) };
  }
  var RINGS_PAD = 16, RINGS_GUT = 6;
  var rings = {
    maxCapacity: function (frame) {
      var halfMin = frame.r - RINGS_PAD, n = 0;
      for (var k = 1; k <= 200; k++) {
        var sol = solveRingRadii(ringCounts(k), halfMin, RINGS_GUT);
        if (sol.b >= MIN_LOT / 2) n = k; else break;      // contiguous feasibility from 1
      }
      return n;
    },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length, max = this.maxCapacity(frame);
      if (n > max) capThrow('rings', n, max, frame);
      var R = frame.r, cx = R, cy = R, halfMin = R - RINGS_PAD;
      var counts = ringCounts(n), sol = solveRingRadii(counts, halfMin, RINGS_GUT);
      var b = sol.b, radii = sol.radii, idx = 0, items = [];
      for (var ri = 0; ri < counts.length; ri++) {
        var cnt = counts[ri], rad = radii[ri];
        var base = (ri % 2 === 0) ? -Math.PI / 2 : (-Math.PI / 2 + Math.PI / Math.max(1, cnt));
        for (var s = 0; s < cnt && idx < n; s++) {
          var ang = base + (cnt > 1 ? (2 * Math.PI * s / cnt) : 0);
          var px = cx + (rad === 0 ? 0 : rad * Math.cos(ang));
          var py = cy + (rad === 0 ? 0 : rad * Math.sin(ang));
          items.push({ room: list[idx++], disc: true, cx: px, cy: py, r: b });
        }
      }
      fitItems(items, 2 * R, 2 * R);
      return finish(items, 'rings');
    }
  };

  /* PASCAL — the number wing's centred-triangle formation (#328), lifted; rect slots. */
  function triangleRows(n) {
    var rows = [], placed = 0, cap = 1;
    while (placed < n) { var k = Math.min(cap, n - placed); rows.push(k); placed += k; cap++; }
    if (rows.length >= 2 && rows[rows.length - 1] === 1) { rows[rows.length - 2] += 1; rows.pop(); }
    return rows;
  }
  function pascalSw(n, frame) {
    var rows = triangleRows(n), R = rows.length, gh = 11, gv = 7, pad = 9;
    var spanU = [];
    for (var r = 0; r < R; r++) spanU.push(Math.max(r, rows[r] - 1));
    var baseU = spanU[R - 1];
    var availW = frame.w - 2 * pad, availH = frame.h - 2 * pad;
    var swByW = (availW - baseU * gh) / (baseU + 1);
    var swByH = (availH - (R - 1) * gv) / (R * ASPECT);
    return { sw: Math.min(swByW, swByH, SIZE_BAND[2].w), rows: rows, R: R, spanU: spanU, gh: gh, gv: gv, pad: pad };
  }
  var pascal = {
    maxCapacity: function (frame) {
      var n = 0;
      for (var k = 1; k <= 200; k++) { if (pascalSw(k, frame).sw >= MIN_LOT) n = k; else break; }
      return n;
    },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length, max = this.maxCapacity(frame);
      if (n > max) capThrow('pascal', n, max, frame);
      var P = pascalSw(n, frame), sw = P.sw, sh = ASPECT * sw;
      var pitchX = sw + P.gh, pitchY = sh + P.gv, formH = P.R * sh + (P.R - 1) * P.gv;
      var cx = frame.w / 2, top = frame.h / 2 - formH / 2, items = [], used = 0;
      for (var ri = 0; ri < P.R; ri++) {
        var c = P.rows[ri], ext = P.spanU[ri] * pitchX, rowY = top + ri * pitchY;
        for (var s = 0; s < c; s++) {
          var t = (c === 1) ? 0.5 : s / (c - 1);
          var slotCx = cx - ext / 2 + t * ext;
          items.push({ room: list[used++], x: slotCx - sw / 2, y: rowY, w: sw, h: sh });
        }
      }
      fitItems(items, frame.w, frame.h, P.pad);
      return finish(items, 'pascal');
    }
  };

  /* ASHLAR — coursed equal stones (#335 lower-works), lifted; rect slots. */
  var ASHLAR_MIN_SW = 30;
  function ashlarCourse(n, frame) {
    var gh = 10, gv = 9, pad = 8;
    var availW = frame.w - 2 * pad, availH = frame.h - 2 * pad;
    var chosen = null, fallback = null;
    for (var Rt = 1; Rt <= n; Rt++) {
      var Ct = Math.ceil(n / Rt);
      var swByW = (availW - (Ct - 1) * gh) / Ct;
      var shByH = (availH - (Rt - 1) * gv) / Rt;
      var swT = Math.min(swByW, shByH / ASPECT, SIZE_BAND[1].w);
      if (swT <= 0) continue;
      if (!fallback || swT > fallback.sw) fallback = { C: Ct, R: Rt, sw: swT };
      if (swT >= ASHLAR_MIN_SW && !chosen) chosen = { C: Ct, R: Rt, sw: swT };
    }
    var best = chosen || fallback;
    return best ? { C: best.C, R: best.R, sw: best.sw, gh: gh, gv: gv, pad: pad } : null;
  }
  var ashlar = {
    maxCapacity: function (frame) {
      var n = 0;
      for (var k = 1; k <= 200; k++) { var c = ashlarCourse(k, frame); if (c && c.sw >= ASHLAR_MIN_SW) n = k; else break; }
      return n;
    },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length, max = this.maxCapacity(frame);
      if (n > max) capThrow('ashlar', n, max, frame);
      var A = ashlarCourse(n, frame), C = A.C, R = A.R, sw = A.sw, sh = sw * ASPECT;
      var pitchX = sw + A.gh, pitchY = sh + A.gv, totalH = R * sh + (R - 1) * A.gv;
      var cx = frame.w / 2, top = frame.h / 2 - totalH / 2, items = [], used = 0;
      for (var r = 0; r < R; r++) {
        var inThis = (r === 0) ? (n - (R - 1) * C) : C;
        var courseW = inThis * sw + (inThis - 1) * A.gh, left = cx - courseW / 2, rowY = top + r * pitchY;
        for (var s = 0; s < inThis; s++) items.push({ room: list[used++], x: left + s * pitchX, y: rowY, w: sw, h: sh });
      }
      fitItems(items, frame.w, frame.h, A.pad);
      return finish(items, 'ashlar');
    }
  };

  /* GREATHOUSE — the manor's house mass re-centred on the frame, PLUS the NEW south
     basement band (§2.2). House rooms fill a centred grid above the band (the crush-proof
     fill-sizer, so the plate reads as a solid house, not #410's crushed specks); the two
     basement slots are reserved for the locked Undercroft/Reliquary via
     basementSlot(frame,0|1). capacity 23 = 21 house seats + the 2 basement slots. Rooms
     tagged wing:'basement' (or, standalone, any overflow past the 21 house seats) seat in
     the band. NOTE: the #410 three-block massing SILHOUETTE is a render-wave refinement
     (§5); the formation's contract here is the legible ≥MIN_LOT seating + the reserved
     basement band, both met by the fill grid. */
  var greathouse = {
    maxCapacity: function (frame) { return 23; },
    pack: function (rooms, frame, ctx) {
      var list = rooms.slice().sort(byOrderId);
      var n = list.length;
      if (n > 23) capThrow('greathouse', n, 23, frame);
      // split: declared basement rooms first, then overflow past the 21 house seats.
      var basement = [], house = [];
      list.forEach(function (r) { ((r.wing || '') === 'basement' ? basement : house).push(r); });
      while (house.length > 21 && basement.length < 2) basement.push(house.pop());
      if (house.length > 21 || basement.length > 2) capThrow('greathouse', n, 23, frame);

      var fw = frame.w, fh = frame.h, pad = 8;
      var bandH = Math.min(46, fh * 0.24);                 // the south basement band
      var houseBottom = fh - bandH - 10, houseTop = pad;
      var items = [];
      if (house.length) {
        var g = fillGrid(house.length, fw - 2 * pad, houseBottom - houseTop, 8, SIZE_BAND[1].w);
        if (!g) capThrow('greathouse', n, 23, frame);
        var gridW = g.cols * g.lotW + (g.cols - 1) * 8, gridH = g.rows * g.lotH + (g.rows - 1) * 8;
        var ox = (fw - gridW) / 2, oy = houseTop + Math.max(0, (houseBottom - houseTop - gridH) / 2);
        for (var i = 0; i < house.length; i++) {
          var col = i % g.cols, row = Math.floor(i / g.cols);
          var usedInRow = Math.min(g.cols, house.length - row * g.cols);
          var rowW = usedInRow * g.lotW + (usedInRow - 1) * 8;
          var rx = (fw - rowW) / 2 + col * (g.lotW + 8);
          items.push({ room: house[i], x: rx, y: oy + row * (g.lotH + 8), w: g.lotW, h: g.lotH });
        }
      }
      // the basement band: up to 2 slots flanking the centre (front-door) gap.
      for (var bi = 0; bi < basement.length; bi++) {
        var bs = greathouse.basementSlot(frame, bi);
        items.push({ room: basement[bi], x: bs.x, y: bs.y, w: bs.w, h: bs.h });
      }
      fitItems(items, fw, fh, pad);
      return finish(items, 'greathouse');
    },
    /* the two gated ways down (§2.2 / §1.9): basementSlot(frame,0)=west (Undercroft),
       (frame,1)=east (Reliquary). Folly-sized, flanking the south front-door gap. */
    basementSlot: function (frame, half) {
      var band = SIZE_BAND[3], pad = 8;
      var bandH = Math.min(46, frame.h * 0.24);
      var w = Math.min(band.w * 0.7, frame.w / 2 - pad - 10), h = Math.min(band.h * 0.7, bandH);
      var halfW = frame.w / 2;
      var hx = (half === 0) ? pad : halfW + 10;
      var span = halfW - pad - 10;
      return { x: hx + (span - w) / 2, y: frame.h - bandH + (bandH - h) / 2, w: w, h: h };
    }
  };

  var FORMATIONS = {
    greathouse: greathouse, rings: rings, pascal: pascal, ashlar: ashlar,
    court: court, crescent: crescent, knot: knot, roadside: roadside
  };

  return {
    FORMATIONS: FORMATIONS,
    MIN_LOT: MIN_LOT, TIER_SCALE: TIER_SCALE, SIZE_BAND: SIZE_BAND, GUT: GUT, INSET: INSET,
    ROADSIDE_STOPS: ROADSIDE_STOPS,
    byOrderId: byOrderId, rectUnion: rectUnion, contiguousOrder: contiguousOrder,
    ringCounts: ringCounts, solveRingRadii: solveRingRadii, triangleRows: triangleRows
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = Formations; }

/* ── CLI: `node tools/layout/formations.js` prints each formation's maxCapacity against
     its §2.1 frame(s) so a maker can eyeball the honest ceilings the contracts sit under. ── */
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  var F = Formations.FORMATIONS;
  var rows = [
    ['greathouse', { w: 280, h: 200 }], ['rings', { r: 140 }], ['pascal', { w: 240, h: 170 }],
    ['ashlar', { w: 240, h: 160 }], ['court/works', { w: 300, h: 220 }, 'court'],
    ['court/gardens', { w: 240, h: 180 }, 'court'], ['court/opticks', { w: 220, h: 150 }, 'court'],
    ['crescent', { w: 280, h: 130 }], ['knot/cavern', { w: 150, h: 110 }, 'knot'],
    ['knot/outbuilding', { w: 140, h: 100 }, 'knot'], ['roadside', { w: 120, h: 120 }]
  ];
  console.log('formations.js — honest maxCapacity(frame) per §2.1 district frame\n');
  rows.forEach(function (row) {
    var key = row[2] || row[0], fr = row[1];
    console.log('  ' + row[0] + ' ' + (fr.r != null ? 'r' + fr.r : fr.w + '×' + fr.h) +
      '  →  maxCapacity ' + F[key].maxCapacity(fr));
  });
}
