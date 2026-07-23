/* ============================================================================
   puppets.js — the paper-cut SILHOUETTE SET for The Shadow Theater.  [in-house]

   DIRECTION — hand-cut mulberry-paper puppets on rods, seen only as shadows on a
   lamp-lit silk. Six figures compose a wordless night-by-water: a crane that takes
   flight, a watching fox, reeds and a willow that sway, a pierced moon, and a far
   vee of tiny cranes. Each is a FLAT vector contour — the geometry engine (n0)
   rasterizes the contour, scales it about the lamp, blurs by the penumbra, and
   MIN-unions it into the shadow. This module owns ONLY the shapes + their
   articulation; it never touches the canvas or the lamp.

   These are the FINAL cutouts, forged in-house (not the blocky greybox): long clean
   curves, iconic-at-a-glance, cut so each figure stays ONE solid black union at
   every handle value. Pierced figures (fox eye, moon disc) are authored as a SINGLE
   non-self-intersecting outline + an even-odd hole, so the pierce reads as a lit
   glint and never as a subtraction seam between overlapping solids.

   THE CONTRACT (what n0 + the twin bind to):
     window.Puppets.RES            unit box edge (contours live in [0,RES]², y-down)
     window.Puppets.order          [id,…] back-to-front paint / z order
     window.Puppets.get(id)        the puppet record:
        { id, label, polarity:'shadow'|'aperture', box:{w,h},
          anchor:[ax,ay],          // the RES-space point that maps to screen (x,y)
          handles:[{id,pivot:[x,y]}],   // grabbable hinge(s), pivot in RES space
          depth0, x0frac, y0frac,  // sensible default placement
          silhouette(state) -> [ {fill:'nonzero'|'evenodd', pts:[[x,y]…], hole?} ]
          glyph()          -> same shape at rest (shelf thumbnail) }
     state carries the live articulation: { wing, look, sway, t }.

   RENDER NOTE (why the pierced figures are single outlines): n0 fills each puppet as
   ONE Path2D and switches the whole path to even-odd the moment ANY subpath is a
   hole. Under even-odd, two overlapping SOLID subpaths cancel in their overlap. So a
   holed figure keeps its body as one continuous outline (no overlapping solids) and
   adds only the hole; holeless figures (crane, reed, willow, vee) stay non-zero and
   may overlap freely into a clean union.
   ============================================================================ */
"use strict";
(function (root) {

  var RES = 100;

  /* small helpers ---------------------------------------------------------- */
  function rot(p, piv, a) {                       // rotate point p about pivot by a (rad)
    var c = Math.cos(a), s = Math.sin(a), dx = p[0] - piv[0], dy = p[1] - piv[1];
    return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c];
  }
  function rotAll(pts, piv, a) { var o = []; for (var i = 0; i < pts.length; i++) o.push(rot(pts[i], piv, a)); return o; }
  function shift(pts, dx, dy) { var o = []; for (var i = 0; i < pts.length; i++) o.push([pts[i][0] + dx, pts[i][1] + dy]); return o; }
  function circle(cx, cy, r, n) {                 // n-gon approximating a circle
    n = n || 24; var o = [];
    for (var i = 0; i < n; i++) { var a = (i / n) * Math.PI * 2; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return o;
  }
  function ellipse(cx, cy, rx, ry, n) {           // vertical/horizontal sausage
    n = n || 22; var o = [];
    for (var i = 0; i < n; i++) { var a = (i / n) * Math.PI * 2; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return o;
  }

  /* ── THE CRANE — long neck, small head/beak, thin legs, a HINGED WING ─────
     One flowing body+neck+head+beak outline (non-zero), two legs, and a wing that
     pivots at the shoulder: folded along the back at rest, sweeping overhead in
     flight (sweep it across the moon and the two shadows merge to solid black). */
  var crane = {
    id: 'crane', label: 'the crane', polarity: 'shadow',
    box: { w: 100, h: 100 }, anchor: [54, 58],
    handles: [{ id: 'wing', pivot: [50, 50] }],
    depth0: 0.30, x0frac: 0.50, y0frac: 0.46,
    silhouette: function (st) {
      var wing = (st && st.wing != null) ? st.wing : 0.15;
      var out = [];
      /* body → back → neck → head → beak → throat → breast → belly → back (one loop) */
      out.push({ fill: 'nonzero', pts: [
        [24, 58], [30, 53], [38, 50], [46, 49], [52, 49],
        [58, 45], [64, 39], [70, 32], [75, 26], [79, 22],
        [82, 19], [84, 19], [88, 20], [95, 21.5],           // crown → beak tip
        [87, 24], [81, 25], [76, 30], [71, 37], [66, 45],   // beak underside → neck front
        [62, 51], [63, 58], [60, 63],                       // throat → breast
        [52, 66], [44, 65], [36, 62], [29, 60]              // belly → back to tail
      ] });
      /* two thin legs */
      out.push({ fill: 'nonzero', pts: [[44, 62], [47, 62], [46, 96], [43, 96]] });
      out.push({ fill: 'nonzero', pts: [[52, 62], [55, 62], [56, 96], [53, 96]] });
      /* the WING — a paper fan pivoting at the shoulder; rotates UP on `wing` */
      var piv = [50, 50];
      var theta = -0.12 - 1.55 * wing;                       // CCW (y-down) = sweep up + over
      var wpts = [[50, 50], [42, 52], [33, 53], [24, 52], [18, 49], [22, 45], [31, 44], [40, 45], [47, 47]];
      out.push({ fill: 'nonzero', pts: rotAll(wpts, piv, theta) });
      return out;
    },
    glyph: function () { return this.silhouette({ wing: 0.55 }); }
  };

  /* ── THE FOX — seated profile, tall ears, a brush tail, a PIERCED eye ─────
     ONE continuous outline (nose → ears → back → tail lobe → rump → paws → chest)
     so nothing self-overlaps, + an even-odd eye hole → a lit glint. `look` tilts
     the head a touch. */
  var fox = {
    id: 'fox', label: 'the fox', polarity: 'shadow',
    box: { w: 100, h: 100 }, anchor: [50, 66],
    handles: [{ id: 'look', pivot: [72, 40] }],
    depth0: 0.16, x0frac: 0.26, y0frac: 0.60,
    silhouette: function (st) {
      var look = (st && st.look != null) ? st.look : 0.5;    // 0 down .. 1 up
      var tilt = (look - 0.5) * 0.22;                        // radians about the neck
      var neck = [52, 46];                                   // head pivots here
      /* the head+ears portion (everything forward of the neck) — tilted by `look` */
      var head = [
        [86, 53], [79, 49], [74, 47],                        // nose → muzzle → front-ear base
        [71, 30], [66, 46], [62, 47],                        // front ear (tip) → notch
        [59, 45], [54, 31], [50, 46]                         // back ear (tip) → back-ear base
      ];
      head = rotAll(head, neck, tilt);
      var out = [];
      var body = [
        [47, 51], [43, 57], [36, 58],                        // nape → back
        [28, 58], [20, 62], [13, 70], [10, 78],              // tail brush (out & down behind)
        [16, 80], [24, 77], [31, 73],                        // tail inner, back to rump
        [35, 79], [41, 85], [48, 86],                        // seated rump on the ground
        [54, 85], [59, 84], [62, 86], [67, 85],              // back foot → front paw
        [70, 78], [72, 68], [73, 60], [78, 56]               // chest → throat back to nose
      ];
      var outline = head.concat(body);
      out.push({ fill: 'nonzero', pts: outline });
      /* the eye — an even-odd pierced hole (a lit glint), riding with the head */
      var eye = rotAll(circle(76.5, 48, 1.8, 12), neck, tilt);
      out.push({ fill: 'evenodd', hole: true, pts: eye });
      return out;
    },
    glyph: function () { return this.silhouette({ look: 0.62 }); }
  };

  /* ── THE REEDS — a cattail cluster; the light-gaps are the spaces between ──
     Non-zero stalks with sausage heads + two long arcing blades. `sway` bends the
     tips (more toward the tip), the whole clump breathing at the water's edge. */
  var reed = {
    id: 'reed', label: 'the reeds', polarity: 'shadow',
    box: { w: 100, h: 100 }, anchor: [50, 96],
    handles: [{ id: 'sway', pivot: [50, 96] }],
    depth0: 0.08, x0frac: 0.80, y0frac: 0.72,
    silhouette: function (st) {
      var sway = (st && st.sway != null) ? st.sway : 0;
      var bend = Math.sin(sway * Math.PI * 2) * 7;
      var out = [];
      /* three cattails: [baseX, headTopY, headBotY, bendK] */
      var cats = [[42, 30, 44, 0.6], [52, 16, 34, 1.0], [61, 38, 50, 0.78]];
      for (var i = 0; i < cats.length; i++) {
        var bx = cats[i][0], hy0 = cats[i][1], hy1 = cats[i][2], k = cats[i][3];
        var b = bend * k, tipx = bx + b;
        /* the thin stalk from the waterline up to the head */
        out.push({ fill: 'nonzero', pts: [
          [bx - 1.1, 96], [bx + 1.1, 96], [tipx + 1.4, hy1], [tipx - 1.4, hy1]
        ] });
        /* the cattail head — a soft sausage */
        var hcy = (hy0 + hy1) / 2, hry = (hy1 - hy0) / 2 + 1;
        out.push({ fill: 'nonzero', pts: ellipse(tipx, hcy, 3.0, hry, 18) });
      }
      /* two long arcing leaf blades (no head), bending more than the stalks */
      var blades = [[36, -1.2, 22], [66, 1.15, 26]];
      for (var j = 0; j < blades.length; j++) {
        var x0 = blades[j][0], dir = blades[j][1], topy = blades[j][2];
        var tb = bend * 1.3 * dir, midx = x0 + dir * 6 + tb * 0.5, tx = x0 + dir * 11 + tb;
        out.push({ fill: 'nonzero', pts: [
          [x0 - 1.0, 96], [x0 + 1.6, 96],
          [midx + 1.4, 60], [tx + 0.7, topy], [tx - 0.7, topy],
          [midx - 1.2, 60]
        ] });
      }
      return out;
    },
    glyph: function () { return this.silhouette({ sway: 0.22 }); }
  };

  /* ── THE MOON — polarity:aperture: a cloud band with a PIERCED disc ───────
     Drawn even-odd so the disc subtracts → light passes → the silk blooms brightest
     there (that lit disc IS the moon). A wing swept over it MIN-unions black → the
     hero merge. */
  var moon = {
    id: 'moon', label: 'the moon', polarity: 'aperture',
    box: { w: 100, h: 100 }, anchor: [50, 40],
    handles: [], depth0: 0.05, x0frac: 0.70, y0frac: 0.26,
    silhouette: function () {
      var out = [];
      /* the soft wavy cloud band (one solid) */
      out.push({ fill: 'evenodd', pts: [
        [3, 33], [18, 28], [33, 31], [48, 27], [63, 30], [78, 27], [95, 31],
        [97, 49], [80, 53], [64, 50], [48, 54], [32, 50], [16, 53], [2, 49]
      ] });
      /* the pierced disc — the moon (a hole → the silk blooms through it) */
      out.push({ fill: 'evenodd', hole: true, pts: circle(50, 40, 15, 34) });
      return out;
    },
    glyph: function () { return [{ fill: 'nonzero', pts: circle(50, 40, 16, 28) }]; }
  };

  /* ── THE WILLOW — a crown bough with long drooping fronds ─────────────────
     Non-zero. Fronds hang from the top of the frame and drift with `sway`, more at
     each tip; alternating fronds drift opposite ways so the whole tree stirs. */
  var willow = {
    id: 'willow', label: 'the willow', polarity: 'shadow',
    box: { w: 100, h: 100 }, anchor: [50, 6],
    handles: [{ id: 'sway', pivot: [50, 6] }],
    depth0: 0.10, x0frac: 0.16, y0frac: 0.16,
    silhouette: function (st) {
      var sway = (st && st.sway != null) ? st.sway : 0;
      var drift = Math.sin(sway * Math.PI * 2) * 6;
      var out = [];
      /* a lumpy crown bough across the top */
      out.push({ fill: 'nonzero', pts: [
        [12, 5], [26, 1], [40, 4], [52, 2], [66, 4], [80, 2], [90, 7],
        [86, 15], [70, 12], [54, 14], [40, 12], [24, 14], [14, 14]
      ] });
      /* long weeping fronds — each cascades outward from the bough and tapers to a
         point; the whole tree drifts on `sway`, more toward the tips */
      var fr = [                                             // [rootX, spreadDir]
        [20, -1.0], [30, -0.55], [40, -0.2], [50, 0.2], [60, 0.55], [72, 1.0]
      ];
      for (var i = 0; i < fr.length; i++) {
        var rx = fr[i][0], spread = fr[i][1];
        var d = drift * (0.5 + spread * 0.5);                // tip drift
        var q = rx + spread * 3, mid = rx + spread * 8 + d * 0.5, tip = rx + spread * 11 + d;
        /* left edge down, then the point, then right edge back up — a tapering leaf */
        out.push({ fill: 'nonzero', pts: [
          [rx - 2.0, 10], [rx - 1.4, 34], [q - 1.0, 60], [mid - 0.5, 80],
          [tip, 92],                                          // the pointed tip
          [mid + 1.3, 80], [q + 1.6, 60], [rx + 2.0, 34], [rx + 2.6, 10]
        ] });
      }
      return out;
    },
    glyph: function () { return this.silhouette({ sway: 0.2 }); }
  };

  /* ── THE VEE — three tiny far cranes; wings FLAP on state.t ────────────────
     The DEPTH showcase: placed far → small + crisp. Each little gull-body flaps
     on the global clock, so the stage is never quite still. */
  var vee = {
    id: 'vee', label: 'the far cranes', polarity: 'shadow',
    box: { w: 100, h: 100 }, anchor: [50, 40],
    handles: [], depth0: 0.02, x0frac: 0.44, y0frac: 0.22,
    silhouette: function (st) {
      var t = (st && st.t != null) ? st.t : 0;
      var out = [];
      var birds = [[50, 40, 1.0, 0], [33, 46, 0.82, 1.2], [67, 47, 0.82, 2.4]];
      for (var i = 0; i < birds.length; i++) {
        var cx = birds[i][0], cy = birds[i][1], sc = birds[i][2], ph = birds[i][3];
        var flap = Math.sin(t * 3.0 + ph);                   // -1..1 wing lift
        var lift = flap * 5 * sc;
        out.push({ fill: 'nonzero', pts: [
          [cx - 10 * sc, cy - 6 * sc - lift],                // left wing tip
          [cx - 4 * sc, cy - 1 * sc],                        // left shoulder
          [cx, cy + 3 * sc],                                 // body / breast
          [cx + 4 * sc, cy - 1 * sc],                        // right shoulder
          [cx + 10 * sc, cy - 6 * sc - lift],                // right wing tip
          [cx + 3 * sc, cy + 1 * sc],                        // right inner
          [cx, cy + 4.5 * sc],                               // tail dip
          [cx - 3 * sc, cy + 1 * sc]                         // left inner
        ] });
      }
      return out;
    },
    glyph: function () { return this.silhouette({ t: 0.35 }); }
  };

  /* ══════════════════════ THE FLATS — set-pieces for the Toy Theatre ══════════════════════
     A flat is an ORDINARY puppet record (flows through the same renderPuppet path — no new
     render code) with two extra fields: `isFlat:true` and a `groove` {offX, restX, restY,
     depth}. It parks fully OFF-STAGE in free-play (offX) and a play slides it in on its
     groove (0=offstage → 1=onstage) or places it hard in the play's setup. Once on, it is a
     normal grabbable puppet, so grabbing a flat mid-scene is absorbed like any other. These
     are wide low horizon pieces — their contours reach past [0,RES] on purpose. */

  /* ── THE FAR HILLS — a wide low rolling horizon band, deepest z ─────────────── */
  var hills = {
    id: 'hills', label: 'the far hills', polarity: 'shadow', isFlat: true,
    box: { w: 100, h: 100 }, anchor: [50, 100], handles: [],
    depth0: 0.03, x0frac: -0.60, y0frac: 0.99,
    groove: { offX: -0.60, restX: 0.50, restY: 0.99, depth: 0.03 },
    silhouette: function () {
      return [{ fill: 'nonzero', pts: [
        [-46, 108], [-46, 92], [-32, 88], [-18, 91], [-4, 85], [10, 90], [22, 86],
        [36, 91], [50, 86], [63, 91], [76, 85], [90, 90], [104, 86], [118, 91],
        [132, 88], [146, 93], [146, 108]
      ] }];
    },
    glyph: function () { return this.silhouette(); }
  };

  /* ── THE NEAR BANK — a foreground embankment with a reed tuft, front z ───────── */
  var bank = {
    id: 'bank', label: 'the near bank', polarity: 'shadow', isFlat: true,
    box: { w: 100, h: 100 }, anchor: [50, 100], handles: [],
    depth0: 0.05, x0frac: -0.55, y0frac: 1.00,
    groove: { offX: -0.55, restX: 0.50, restY: 1.00, depth: 0.05 },
    silhouette: function () {
      return [{ fill: 'nonzero', pts: [
        [-46, 118], [-46, 90], [-26, 87], [-8, 89], [4, 82],
        [8, 72], [12, 82], [22, 88], [38, 85], [56, 89], [76, 86],
        [98, 90], [120, 87], [146, 91], [146, 118]
      ] }];
    },
    glyph: function () { return this.silhouette(); }
  };

  /* ── THE NEST — a twig cradle with two nestlings; sits BEHIND the willow so its
        fronds occlude it, and the frond-sweep is the reveal. A tiny `stir` handle
        shifts the nestlings. ───────────────────────────────────────────────────── */
  var nest = {
    id: 'nest', label: 'the nest', polarity: 'shadow', isFlat: true,
    box: { w: 100, h: 100 }, anchor: [50, 60], handles: [{ id: 'stir', pivot: [50, 52] }],
    depth0: 0.06, x0frac: -0.80, y0frac: 0.52,
    groove: { offX: -0.80, restX: 0.34, restY: 0.52, depth: 0.06 },
    silhouette: function (st) {
      var stir = (st && st.stir != null) ? st.stir : 0;
      var s = Math.sin(stir * Math.PI * 2) * 3;
      var out = [];
      // the twig cradle — a shallow cupped basket (one solid)
      out.push({ fill: 'nonzero', pts: [
        [20, 58], [28, 67], [40, 71], [50, 72], [60, 71], [72, 67], [80, 58],
        [75, 55], [64, 62], [50, 64], [36, 62], [25, 55]
      ] });
      // two nestlings — little rounded heads peeking over the rim, shifting on stir
      out.push({ fill: 'nonzero', pts: circle(42 + s, 53, 5.2, 14) });
      out.push({ fill: 'nonzero', pts: circle(58 - s, 54, 5.2, 14) });
      // tiny upturned beaks
      out.push({ fill: 'nonzero', pts: [[41 + s, 49], [44 + s, 44.5], [47 + s, 49]] });
      out.push({ fill: 'nonzero', pts: [[57 - s, 50], [60 - s, 45.5], [63 - s, 50]] });
      return out;
    },
    glyph: function () { return this.silhouette({ stir: 0.25 }); }
  };

  var TABLE = { crane: crane, fox: fox, reed: reed, moon: moon, willow: willow, vee: vee, hills: hills, bank: bank, nest: nest };
  // back → front. flats sit at the extremes (hills deepest, bank frontmost) and nest tucks
  // directly BEHIND the willow so the willow's fronds occlude it — the reveal is that occlusion.
  var ORDER = ['hills', 'moon', 'vee', 'nest', 'willow', 'reed', 'crane', 'fox', 'bank'];

  root.Puppets = {
    RES: RES,
    order: ORDER.slice(),
    get: function (id) { return TABLE[id]; },
    all: function () { var o = []; for (var i = 0; i < ORDER.length; i++) o.push(TABLE[ORDER[i]]); return o; },
    /* marker the wiring builder / smoke checks look for — these are the final cutouts */
    __forged: true
  };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
