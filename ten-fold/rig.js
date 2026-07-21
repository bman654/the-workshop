/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — THE BRASS RIG · the knurled coarse-focus drum
   take 3 — "shade it, don't paint it"

       RigArt.drum(g, w, h, d, opts)

   This take does not draw bands of brass-coloured gradient. It builds the drum
   as an actual surface and LIGHTS it:

     · the drum is a cylinder whose axis lies ACROSS the box; the visible face
       is ~160 deg of arc, so y = R sin(theta) and every ridge foreshortens on
       its own, crowding and losing contrast toward both ends because that is
       what the geometry does;
     · the knurl is a real profile u(S) — 16 straight ridges per ten-fold, cut
       through by a flat-bottomed detent groove at every whole decade — and the
       surface normal is the derivative of that profile, taken numerically, so
       flanks, crests, valleys and the machined lips of a groove all fall out
       of one function instead of being drawn by hand;
     · shading is a REFLECTION. Each pixel reflects the view vector about its
       normal and samples a small room: one broad warm lamp overhead, a dim
       warm bounce off the bench, a cold sliver from the left, and near-black
       everywhere else — multiplied by brass reflectance. Nothing emits. Every
       bright on this drum is the lamp seen in metal, which is why the specular
       streak MOVES as the ridges roll past instead of sitting still;
     · the ridge amplitude is faded below the Nyquist limit of the local pixel
       pitch, so the crowding ends resolve into smooth turned metal rather than
       strobing into moire — legible at rest, stable in motion;
     · axially: a chamfer break at each rim edge, fine circumferential tool
       marks from the lathe, and a band polished bright where a thumb has
       ridden it for years.

   The PAWL is driven by the very same profile function that shaded the metal,
   sampled at the box's mid-line, so its tip is provably on the surface you can
   see: seated, it lies inside the dark groove drawn under it and the leaf is
   relaxed; lifted, the leaf is visibly bowed, the tip is dull, and the detent
   it has left is a groove a little way up the drum.

   opts = { E_MIN, E_MAX, portrait, t }. `portrait` lays the whole rig out
   horizontally. `t` is unused on purpose: nothing here animates of its own
   accord — the only thing that moves is the metal, and only when `d` changes.
   ════════════════════════════════════════════════════════════════════════════ */

if (typeof RigArt === 'undefined') { window.RigArt = {}; }

(function () {
  'use strict';

  /* ── small math ───────────────────────────────────────────────────────── */
  function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ss(a, b, x) { var t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function hash(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }

  /* ── the room the brass reflects ──────────────────────────────────────────
     up = +1 means the reflected ray points at the ceiling lamp.               */
  var LAMP = [1.00, 0.955, 0.855];   // warm white bench lamp
  var BNC  = [1.00, 0.640, 0.300];   // bounce off a warm wooden bench
  var COLD = [0.46, 0.585, 0.780];   // a cold sliver from the room's left
  var BRASS = [1.00, 0.782, 0.428];  // brass reflectance
  var VERD  = [0.052, 0.036, 0.020]; // the warm oil-black that lives in a groove
  var LOW   = [0.62, 0.74, 0.98];    // a dim, cool bench bounce that fills the lower arc

  /* the same light that lit the drum, for the engraved rule beside it */
  RigArt.brassGrad = function (g, x0, y0, x1, y1) {
    var gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0.00, '#100b05');
    gr.addColorStop(0.10, '#3d2c11');
    gr.addColorStop(0.24, '#8a6829');
    gr.addColorStop(0.37, '#d8b063');
    gr.addColorStop(0.44, '#f7e3ae');
    gr.addColorStop(0.50, '#fff3cf');
    gr.addColorStop(0.58, '#e0bd75');
    gr.addColorStop(0.72, '#96702e');
    gr.addColorStop(0.88, '#40300f');
    gr.addColorStop(1.00, '#0d0904');
    return gr;
  };

  /* ── the surface profile ──────────────────────────────────────────────────
     S is arc length along the drum's circumference in px, measured so that a
     whole decade e sits at S = e * circ. Returns the radial displacement.
     A detent is a groove TURNED THROUGH the knurl, so the knurl dies away
     inside it and the floor is clean cylinder again — which is exactly what
     makes a decade legible from across the room.                              */
  function makeProfile(pitch, circ, A, D, gw, E_MIN, E_MAX) {
    var TAU = Math.PI * 2;
    return function (S, ampK, gK) {
      var f = S / pitch; f -= Math.floor(f);
      var c = Math.cos(TAU * f);                       // +1 crest, -1 valley
      /* worn crests, sharp valleys — a knurl that has been used */
      var u = A * ampK * (c >= 0 ? Math.pow(c, 0.80) : -Math.pow(-c, 1.30));
      var e = Math.round(S / circ);
      if (e >= E_MIN && e <= E_MAX) {
        var q = Math.abs(S - e * circ) / gw;
        if (q < 1) {
          u *= 1 - (1 - ss(0.80, 1.00, q)) * 0.94 * gK;  // the knurl is cut away
          u -= D * gK * (1 - ss(0.72, 1.00, q));         // flat floor, steep walls
        }
      }
      return u;
    };
  }
  /* signed distance from the nearest detent's centre, in half-widths:
     negative = above it (the wall that faces away), positive = below.        */
  function detentQ(S, circ, gw, E_MIN, E_MAX) {
    var e = Math.round(S / circ);
    if (e < E_MIN || e > E_MAX) return 9;
    return (S - e * circ) / gw;
  }
  var KA = 0.086, KD = 5.60, KG = 2.25;   // knurl amp · detent depth · half-width
                                          // (all as multiples of the ridge pitch)
  var SIL_K = 0.85;                        // fine serration cut into the outer edge, px
  var SIL_D = 9.0;                         // the deeper detent notch in that edge, px

  /* ── the machined outer silhouette ────────────────────────────────────────
     The drum's OUTER edge (the one the pawl rides) is cut into the same profile
     the face is shaded from, so you can read the state in the outline: a fine
     serration at the knurl pitch, and one clearly deeper notch at each detent —
     at the SAME ladder coordinate as the dark cut in the shaded face. Returns
     how far the edge is inset (to the right of the nominal edge), in px, so the
     teeth only ever cut metal AWAY — they never poke past the housing.         */
  function makeSil(pitch, circ, gw, E_MIN, E_MAX) {
    var TAU = Math.PI * 2;
    return function (S, ampK, gK) {
      var f = S / pitch; f -= Math.floor(f);
      var c = Math.cos(TAU * f);
      var serr = SIL_K * (0.5 - 0.5 * c) * ampK;         // 0 at a crest, deepest in a valley
      var e = Math.round(S / circ), notch = 0;
      if (e >= E_MIN && e <= E_MAX) {
        var q = Math.abs(S - e * circ) / gw;
        if (q < 1) notch = SIL_D * (1 - ss(0.72, 1.00, q)) * gK;   // deep at centre, ramps out
      }
      return serr + notch;
    };
  }

  /* ── the drum body, rendered pixel by pixel ───────────────────────────── */
  function renderBody(IW, IH, halfL, R, circ, pitch, d, E_MIN, E_MAX) {
    var A = KA * pitch;             // knurl amplitude
    var D = KD * A;                 // detent depth
    var gw = KG * pitch;            // detent half-width
    var prof = makeProfile(pitch, circ, A, D, gw, E_MIN, E_MAX);

    /* reuse the buffer across frames — a spinning wheel re-renders every one */
    var buf = RigArt._buf;
    if (!buf || buf.cv.width !== IW || buf.cv.height !== IH) {
      var c0 = document.createElement('canvas');
      c0.width = IW; c0.height = IH;
      var x0 = c0.getContext('2d');
      buf = RigArt._buf = { cv: c0, c2: x0, img: x0.createImageData(IW, IH) };
    }
    var cv = buf.cv, c2 = buf.c2, img = buf.img;
    var px = img.data;

    /* ---- per-row: everything that varies AROUND the drum ---- */
    var thA = new Float64Array(IH), aoA = new Float64Array(IH),
        grA = new Float64Array(IH), viA = new Float64Array(IH),
        rgA = new Float64Array(IH), lpA = new Float64Array(IH);
    var SS = 3, eps = pitch * 0.030, TAU = Math.PI * 2;
    for (var j = 0; j < IH; j++) {
      var tilt = 0, th = 0, ao = 0, grv = 0, rough = 0, lip = 0;
      for (var k = 0; k < SS; k++) {
        var yy = -halfL + j + 0.5 + (k - (SS - 1) / 2) / SS;
        var sn = cl(yy / R, -1, 1);
        var t0 = Math.asin(sn), ct = Math.cos(t0);
        var S = R * t0 + d * circ;
        var ampK = ss(1.15, 3.30, pitch * ct);          // Nyquist fade, knurl
        var gK   = ss(0.90, 2.60, 2 * gw * ct);          // Nyquist fade, detent
        var slope = (prof(S + eps, ampK, gK) - prof(S - eps, ampK, gK)) / (2 * eps);
        tilt += Math.atan(slope);
        th += t0;
        /* occlusion: valleys of the knurl and the floor of a detent are shut in */
        var f = S / pitch; f -= Math.floor(f);
        var vc = Math.max(0, -Math.cos(TAU * f));
        var sq = detentQ(S, circ, gw, E_MIN, E_MAX), q = Math.abs(sq);
        /* the floor is shut in; the WALLS are not — that is what makes a lip */
        var inG = q < 1 ? (1 - ss(0.55, 0.80, q)) * gK : 0;
        ao += 1 - 0.46 * vc * ampK - 0.46 * inG;
        grv += inG;
        /* the lower wall faces up into the lamp: the bright machined lip */
        var lq = (sq - 0.875) / 0.070;
        lip += Math.exp(-lq * lq) * gK;
        rough += ampK;                                   // ends read as turned, not knurled
      }
      thA[j] = th / SS;
      aoA[j] = ao / SS;
      grA[j] = grv / SS;
      rgA[j] = rough / SS;
      lpA[j] = lip / SS;
      var kEnd = Math.abs(-halfL + j + 0.5) / halfL;
      /* the housing throat shuts the light out as the surface rolls away */
      viA[j] = (1 - ss(0.80, 1.00, kEnd) * 0.95) * (1 - ss(0.955, 1.0, kEnd) * 0.8);
      thA[j] -= tilt / SS;                               // theta_eff
    }

    /* ---- per-column: everything that varies ALONG the axis ---- */
    var psA = new Float64Array(IW), wrA = new Float64Array(IW),
        tmA = new Float64Array(IW), edA = new Float64Array(IW);
    for (var i = 0; i < IW; i++) {
      var xn = ((i + 0.5) / IW) * 2 - 1;
      var ce = ss(0.78, 1.00, Math.abs(xn));
      var psi = (xn < 0 ? -1 : 1) * ce * 0.66;           // the rim's chamfer break
      /* fine circumferential tool marks + a few deeper feed lines */
      var n1 = hash(i * 1.7 + 11) - 0.5;
      var n2 = hash(Math.floor(i / 3) * 5.3 + 3) - 0.5;
      psi += n1 * 0.055 + n2 * 0.030;
      psi += Math.sin(i * 0.83 + 1.1) * 0.012;
      psA[i] = psi;
      wrA[i] = Math.exp(-Math.pow((xn + 0.10) / 0.44, 2));   // the thumb's polish
      tmA[i] = 1 + (hash(i * 3.11 + 7) - 0.5) * 0.075;
      edA[i] = 1 - ss(0.955, 1.0, Math.abs(xn)) * 0.85;      // where it meets the housing
    }
    var sP = new Float64Array(IW), cP = new Float64Array(IW);
    for (i = 0; i < IW; i++) { sP[i] = Math.sin(psA[i]); cP[i] = Math.cos(psA[i]); }

    /* half-vector of the key light (upper-left, in front) */
    var Lx = -0.40, Ly = -0.76, Lz = 0.51;
    var Hx = Lx, Hy = Ly, Hz = Lz + 1;
    var hl = Math.sqrt(Hx * Hx + Hy * Hy + Hz * Hz); Hx /= hl; Hy /= hl; Hz /= hl;

    var o = 0;
    for (j = 0; j < IH; j++) {
      var te = thA[j], sT = Math.sin(te), cT = Math.cos(te);
      var ao_ = aoA[j], gr_ = grA[j], vi_ = viA[j], rg_ = rgA[j], lp_ = lpA[j];
      for (i = 0; i < IW; i++) {
        var nx = sP[i], ny = sT * cP[i], nz = cT * cP[i];
        var ndv = nz;
        var rx = 2 * ndv * nx, ry = 2 * ndv * ny;

        /* THE ROOM, seen in the metal. The bench lamp is a narrow strip, so its
           reflection is a STREAK that walks along each flank — not a wash.    */
        var up = -ry;
        var a1 = (up - 0.58) / 0.138, b1 = Math.exp(-a1 * a1) * 0.92; // the lamp's face
        var a2 = (up - 0.95) / 0.075, b2 = Math.exp(-a2 * a2) * 0.34; // its far edge
        var lamp = b1 + b2;
        var ceilAmt = ss(-0.10, 0.62, up) * 0.085;                    // dim ceiling wash
        var bd = up + 0.57, bnc = Math.exp(-(bd * bd) / 0.175) * 0.190;
        /* a second, dimmer practical low in the room — a cool bench bounce that
           only reaches the down-facing flanks, so the lower third of the arc
           keeps its body instead of falling to black. It is a reflection, not a
           fill: it appears only where the metal turns to face the floor. */
        var ld = up + 0.86, low = Math.exp(-(ld * ld) / 0.098) * 0.165;
        var lat = ss(0.28, 0.96, -rx) * 0.050;
        var amb = 0.024;

        var rr = lamp * LAMP[0] + ceilAmt * 0.85 + bnc * BNC[0] + low * LOW[0] + lat * COLD[0] + amb;
        var gg = lamp * LAMP[1] + ceilAmt * 0.92 + bnc * BNC[1] + low * LOW[1] + lat * COLD[1] + amb * 1.10;
        var bb = lamp * LAMP[2] + ceilAmt * 1.00 + bnc * BNC[2] + low * LOW[2] + lat * COLD[2] + amb * 1.45;
        rr *= BRASS[0]; gg *= BRASS[1]; bb *= BRASS[2];

        /* the tight glint that walks across a crest as it turns. On the polished
           thumb-wear band the metal reflects TIGHTER and BRIGHTER — a second,
           much sharper lobe rides only there, so the band reads as burnished
           metal (a keener highlight over flatter crests), not merely as reduced
           contrast. */
        var nh = nx * Hx + ny * Hy + nz * Hz;
        if (nh > 0) {
          var pol = wrA[i];
          var sp = Math.pow(nh, 130) * (0.40 + 0.85 * pol) * (0.35 + 0.65 * rg_);
          sp += Math.pow(nh, 300) * (1.15 * pol) * (0.45 + 0.55 * rg_);   // the burnished lobe
          rr += sp; gg += sp * 0.94; bb += sp * 0.80;
        }
        /* grazing brightening, the way real metal turns to light at the edge */
        var fr = 1 - ndv; fr = fr * fr * fr * fr * 0.26;
        rr += fr * lamp; gg += fr * lamp * 0.9; bb += fr * lamp * 0.75;

        var m = ao_ * vi_ * tmA[i] * edA[i];
        rr *= m; gg *= m; bb *= m;

        /* the freshly-turned lip of a detent — the brightest thing on the drum */
        if (lp_ > 0.004) {
          var lv = lp_ * vi_ * edA[i] * (0.34 + 0.50 * wrA[i]);
          rr += lv * 1.00; gg += lv * 0.90; bb += lv * 0.62;
        }

        /* a shoulder instead of a clip — brass rolls off, it does not blow out */
        rr = rr / (1 + 0.50 * rr) * 1.50;
        gg = gg / (1 + 0.50 * gg) * 1.50;
        bb = bb / (1 + 0.50 * bb) * 1.50;

        /* oil in the bottom of a detent — a warm near-black, not a green cast:
           the floor is simply shut away from every light in the room. */
        if (gr_ > 0) {
          var v = gr_ * 0.52;
          rr = rr * (1 - v) + VERD[0] * v;
          gg = gg * (1 - v) + VERD[1] * v;
          bb = bb * (1 - v) + VERD[2] * v;
        }

        var dth = (hash(i * 2.3 + j * 5.7) - 0.5) * 0.006;
        px[o]     = cl(rr + dth, 0, 1) * 255;
        px[o + 1] = cl(gg + dth, 0, 1) * 255;
        px[o + 2] = cl(bb + dth, 0, 1) * 255;
        px[o + 3] = 255;
        o += 4;
      }
    }
    c2.putImageData(img, 0, 0);
    return cv;
  }

  /* ── the pawl: a leaf spring rooted in a bolted cast clamp, driven by the
     profile it rides. The nose sits in the drum's own toothed silhouette
     (`midInset`), so its lateral travel across the three states is real
     geometry: deep in the notch when seated, out at the edge on a crest, and
     part-way up the detent's exit ramp when just off. The spring reads the
     load honestly — relaxed (near straight) seated, visibly bowed on a crest —
     and its warm cast shadow steps away from the nose as it lifts.            */
  function drawPawl(g, halfW, hxL, BWacross, pitch, circ, d, E_MIN, E_MAX, midInset) {
    var A = KA * pitch, D = KD * A, gw = KG * pitch;
    var prof = makeProfile(pitch, circ, A, D, gw, E_MIN, E_MAX);
    var S = d * circ, eps = pitch * 0.030;
    var u = prof(S, 1, 1);
    var uMin = 0.06 * A - D, uMax = A;
    var lift = cl((u - uMin) / (uMax - uMin), 0, 1);     // 0 seated · 1 on a crest
    var slope = (prof(S + eps, 1, 1) - prof(S - eps, 1, 1)) / (2 * eps);
    var seated = 1 - ss(0.10, 0.42, lift);

    var tipR = 4.5;
    /* the nose rides the machined edge: deep in the notch (seated) out to the
       tooth line (crest). That IS the lateral travel the eye reads. */
    var tipX = -halfW + midInset - 0.8;
    var tipY = cl(-slope, -1, 1) * 5.2 * (1 - seated * 0.55);

    /* the cast clamp, bolted to the housing up and to the left, kept inside the
       box however tight the margin (the phone box is far tighter than the bench) */
    var reach = Math.min(62, (hxL - halfW) * 0.62);
    var boxL = -BWacross * 0.5;
    var cw = Math.min(20, Math.max(11, reach * 0.34));   // clamp width
    var cxL = Math.max(boxL + 2, -halfW - reach);        // clamp's left face
    var ax = cxL + cw * 0.60;                            // the leaf's root, at the clamp face
    var ay = -Math.max(15, Math.min(34, reach * 0.66));
    var ch = Math.min(36, Math.max(24, reach * 0.62));   // clamp height

    g.save();

    /* the warm cast shadow on the drum, stepping away from the nose as it lifts */
    var sOff = 2.2 + lift * 7.2, sDn = 1.8 + lift * 5.4;
    g.save(); g.globalCompositeOperation = 'multiply';
    for (var s2 = 0; s2 < 2; s2++) {
      g.fillStyle = 'rgba(44,29,12,' + (0.50 - s2 * 0.20) + ')';
      g.beginPath();
      g.ellipse(tipX + sOff, tipY + sDn, 4.2 + s2 * 2.4 + lift * 1.6,
        3.1 + s2 * 1.8 + lift * 1.2, 0, 0, 6.2832);
      g.fill();
    }
    g.restore();

    /* THE CAST CLAMP BLOCK */
    var cg = g.createLinearGradient(0, ay - ch * 0.5, 0, ay + ch * 0.5);
    cg.addColorStop(0.00, '#20242e'); cg.addColorStop(0.5, '#12151d'); cg.addColorStop(1, '#0a0c12');
    g.fillStyle = cg;
    g.beginPath(); g.roundRect(cxL, ay - ch * 0.5, cw, ch, 3); g.fill();
    g.strokeStyle = 'rgba(180,150,90,.42)'; g.lineWidth = 1;
    g.beginPath(); g.roundRect(cxL + .5, ay - ch * 0.5 + .5, cw - 1, ch - 1, 3); g.stroke();
    /* a cast rib down its face, so the plate earns its area */
    var rbx = cxL + cw * 0.66;
    g.strokeStyle = 'rgba(6,7,10,.80)'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(rbx, ay - ch * 0.40); g.lineTo(rbx, ay + ch * 0.40); g.stroke();
    g.strokeStyle = 'rgba(210,178,110,.30)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(rbx - 1.4, ay - ch * 0.40); g.lineTo(rbx - 1.4, ay + ch * 0.40); g.stroke();
    /* two rivets holding it down */
    for (var r2 = 0; r2 < 2; r2++) {
      var ry = ay - ch * 0.30 + r2 * ch * 0.60, rx = cxL + cw * 0.32;
      var rg = g.createRadialGradient(rx - 1, ry - 1.2, 0.3, rx, ry, 3.4);
      rg.addColorStop(0, '#f0d69a'); rg.addColorStop(0.5, '#9c7c40'); rg.addColorStop(1, '#241a0b');
      g.fillStyle = rg; g.beginPath(); g.arc(rx, ry, 2.9, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(8,6,3,.8)'; g.lineWidth = 0.7; g.stroke();
    }

    /* THE LEAF — a flat tapered spring, wide at the root, thin at the nose,
       built as a closed band between two offset curves so it reads as sheet
       stock on edge. `bow` grows with lift: seated it lies back nearly straight,
       on a crest the load bows it. */
    var bow = reach * (0.04 + lift * 0.32);
    var cxq = (ax + tipX) * 0.5, cyq = (ay + tipY) * 0.5 - bow;
    function band(o0, o1) {
      g.beginPath();
      g.moveTo(ax, ay - o0);
      g.quadraticCurveTo(cxq, cyq - o1, tipX, tipY - o1 * 0.34);
      g.lineTo(tipX, tipY + o1 * 0.34);
      g.quadraticCurveTo(cxq, cyq + o1, ax, ay + o0);
      g.closePath();
    }
    band(6.2, 4.0); g.fillStyle = 'rgba(6,6,9,.60)'; g.fill();   // the leaf's under-shadow
    band(5.4, 3.3);
    var lg = g.createLinearGradient(ax, ay - 9, tipX, tipY + 8);
    lg.addColorStop(0.00, '#f6e2b0');
    lg.addColorStop(0.24, '#c69f56');
    lg.addColorStop(0.58, '#8a6a2e');
    lg.addColorStop(0.88, '#3d2c12');
    lg.addColorStop(1.00, '#191106');
    g.fillStyle = lg; g.fill();
    /* the lit top arris of the spring */
    g.beginPath();
    g.moveTo(ax, ay - 5.0);
    g.quadraticCurveTo(cxq, cyq - 3.0, tipX, tipY - 1.0);
    g.strokeStyle = 'rgba(255,238,190,' + (0.38 + 0.32 * seated) + ')';
    g.lineWidth = 1.1; g.lineCap = 'round'; g.stroke();

    /* the hardened nose: bright and blooming when it has dropped in, dull on a crest */
    var ng = g.createRadialGradient(tipX - 1.4, tipY - 1.8, 0.4, tipX, tipY, tipR * 1.15);
    if (seated > 0.5) {
      ng.addColorStop(0, '#fff6da'); ng.addColorStop(0.42, '#f0cf8a');
      ng.addColorStop(0.85, '#7d5c26'); ng.addColorStop(1, '#221807');
    } else {
      ng.addColorStop(0, '#d8be84'); ng.addColorStop(0.45, '#9a7735');
      ng.addColorStop(0.86, '#4a3616'); ng.addColorStop(1, '#150f06');
    }
    g.fillStyle = ng; g.beginPath(); g.arc(tipX, tipY, tipR, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,240,200,' + (0.28 + 0.44 * seated) + ')'; g.lineWidth = 0.9;
    g.beginPath(); g.arc(tipX, tipY, tipR, Math.PI * 1.10, Math.PI * 1.95); g.stroke();

    if (seated > 0.02) {
      var bl = g.createRadialGradient(tipX, tipY, 0, tipX, tipY, 14);
      bl.addColorStop(0, 'rgba(255,231,168,' + (0.32 * seated) + ')');
      bl.addColorStop(0.45, 'rgba(255,222,150,' + (0.11 * seated) + ')');
      bl.addColorStop(1, 'rgba(255,222,150,0)');
      g.fillStyle = bl; g.beginPath(); g.arc(tipX, tipY, 14, 0, 6.2832); g.fill();
    }
    g.restore();
  }

  /* ── the whole rig ────────────────────────────────────────────────────── */
  RigArt.drum = function (g, w, h, d, opts) {
    var o = opts || {};
    var E_MIN = (o.E_MIN === undefined) ? -15 : o.E_MIN;
    var E_MAX = (o.E_MAX === undefined) ? 26 : o.E_MAX;
    var vert = !o.portrait;
    var BW = vert ? w : h, BH = vert ? h : w;

    var RW = Math.min(BW * 0.46, 78);
    var RL = BH * 0.93;
    var halfW = RW / 2, halfL = RL / 2;
    var THMAX = 1.396;                        // 80 deg of visible arc
    var R = halfL / Math.sin(THMAX);
    var circ = RL * 0.36;                     // arc length of one ten-fold
    var pitch = circ / 16;                    // 16 ridges per ten-fold

    var IW = Math.max(4, Math.round(RW)), IH = Math.max(4, Math.round(RL));
    var ck = IW + ':' + IH + ':' + d.toFixed(4) + ':' + E_MIN + ':' + E_MAX;
    if (!RigArt._c || RigArt._c.k !== ck) {
      RigArt._c = { k: ck, cv: renderBody(IW, IH, halfL, R, circ, pitch, d, E_MIN, E_MAX) };
    }

    /* the outer-edge silhouette, row by row: the same profile that shaded the
       face, cut into the outline. Amplitude is faded below the local pixel
       Nyquist limit exactly as the shading is, so a spinning edge does not
       strobe. midInset is the edge at the box's mid-line — where the pawl sits. */
    var gwPx = KG * pitch, sil = makeSil(pitch, circ, gwPx, E_MIN, E_MAX);
    var RLn = Math.max(2, Math.round(RL));
    var inset = new Float64Array(RLn + 1);
    for (var si = 0; si <= RLn; si++) {
      var syy = -halfL + (si / RLn) * RL, ssn = cl(syy / R, -1, 1);
      var st0 = Math.asin(ssn), sct = Math.cos(st0), sS = R * st0 + d * circ;
      inset[si] = sil(sS, ss(1.15, 3.30, pitch * sct), ss(0.90, 2.60, 2 * gwPx * sct));
    }
    var midInset = sil(d * circ, ss(1.15, 3.30, pitch), ss(0.90, 2.60, 2 * gwPx));

    g.save();
    g.globalAlpha = 1;
    g.translate(w * 0.5, h * 0.5);
    if (!vert) g.rotate(-Math.PI / 2);
    /* the drum sits to the RIGHT of its box; the pawl gets the room on the left */
    var DX = BW * 0.5 - halfW - 11;
    g.translate(DX, 0);

    /* the housing the drum is sunk into — it reaches left to carry the pawl */
    var hxL = DX + BW * 0.5 - 3, hxR = halfW + 11, hy = halfL + 13;
    /* a dark cast bracket, lit only along its top arris */
    var hb = g.createLinearGradient(0, -hy, 0, hy);
    hb.addColorStop(0.00, '#121620'); hb.addColorStop(0.10, '#0b0e15');
    hb.addColorStop(0.55, '#07090e'); hb.addColorStop(1.00, '#05070b');
    g.fillStyle = hb;
    g.beginPath(); g.roundRect(-hxL, -hy, hxL + hxR, hy * 2, 11); g.fill();
    g.strokeStyle = 'rgba(198,164,102,.17)'; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-hxL + 11, -hy + 0.5); g.lineTo(hxR - 11, -hy + 0.5); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.7)';
    g.beginPath();
    g.moveTo(-hxL + 11, hy - 0.5); g.lineTo(hxR - 11, hy - 0.5); g.stroke();

    /* two countersunk screws holding the bracket to the frame */
    var scx = -hxL + Math.max(12, (hxL - halfW) * 0.20);
    [-hy + 26, hy - 26].forEach(function (sy) {
      var sg = g.createRadialGradient(scx - 1.4, sy - 1.8, 0.3, scx, sy, 5.2);
      sg.addColorStop(0, '#8d7a52'); sg.addColorStop(0.5, '#4a3f28');
      sg.addColorStop(0.88, '#191510'); sg.addColorStop(1, '#0a0908');
      g.fillStyle = sg; g.beginPath(); g.arc(scx, sy, 4.6, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(4,4,6,.9)'; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(scx - 2.8, sy + 1.3); g.lineTo(scx + 2.8, sy - 1.3); g.stroke();
      g.strokeStyle = 'rgba(226,196,138,.22)'; g.lineWidth = 0.8;
      g.beginPath(); g.arc(scx, sy, 4.6, Math.PI * 1.05, Math.PI * 1.9); g.stroke();
    });

    /* the drum, clipped to its own machined silhouette so the toothed edge
       reads in outline against the dark housing behind it */
    g.save();
    g.beginPath();
    g.moveTo(halfW, -halfL);
    g.lineTo(halfW, halfL);
    g.lineTo(-halfW + inset[RLn], halfL);
    for (var jc = RLn - 1; jc >= 0; jc--) g.lineTo(-halfW + inset[jc], -halfL + (jc / RLn) * RL);
    g.closePath(); g.clip();
    g.drawImage(RigArt._c.cv, -halfW, -halfL, RW, RL);

    /* the throat: the housing shuts over the drum at both ends */
    var th = g.createLinearGradient(0, -halfL, 0, halfL);
    th.addColorStop(0.00, 'rgba(3,4,7,.98)'); th.addColorStop(0.055, 'rgba(3,4,7,.55)');
    th.addColorStop(0.155, 'rgba(3,4,7,0)');  th.addColorStop(0.845, 'rgba(3,4,7,0)');
    th.addColorStop(0.945, 'rgba(3,4,7,.55)'); th.addColorStop(1.00, 'rgba(3,4,7,.98)');
    g.fillStyle = th; g.fillRect(-halfW, -halfL, RW, RL);
    g.restore();

    /* the machined edges of the housing aperture. The right, top and bottom are
       straight; the left is the toothed silhouette, given its own dark relief
       and a bright turned lip so the teeth catch the light like real edges. */
    g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(halfW + 1, -halfL - 1); g.lineTo(halfW + 1, halfL + 1);
    g.moveTo(-halfW, -halfL - 1); g.lineTo(halfW + 1, -halfL - 1);
    g.moveTo(-halfW, halfL + 1); g.lineTo(halfW + 1, halfL + 1);
    g.stroke();
    function silPath(dx) {
      g.beginPath();
      g.moveTo(-halfW + inset[0] + dx, -halfL);
      for (var je = 1; je <= RLn; je++) g.lineTo(-halfW + inset[je] + dx, -halfL + (je / RLn) * RL);
    }
    silPath(-1.2); g.strokeStyle = 'rgba(0,0,0,.82)'; g.lineWidth = 2.0; g.stroke();
    silPath(0.5);  g.strokeStyle = 'rgba(233,201,138,.40)'; g.lineWidth = 1.0; g.stroke();
    g.strokeStyle = 'rgba(233,201,138,.34)'; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-halfW + inset[0], -halfL - 1.5); g.lineTo(halfW + 1.5, -halfL - 1.5);
    g.stroke();
    g.strokeStyle = 'rgba(233,201,138,.13)';
    g.beginPath();
    g.moveTo(-halfW + inset[RLn], halfL + 1.5); g.lineTo(halfW + 1.5, halfL + 1.5);
    g.stroke();

    drawPawl(g, halfW, hxL, BW, pitch, circ, d, E_MIN, E_MAX, midInset);

    g.restore();
  };
})();
