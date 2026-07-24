/* ═══════════════════════════════════════════════════════════════════════════
   HEXAFLEXAGON — FACE ART · DAY  (foundry FINAL — synth of takes 1 + 2)
   "Day — a walled garden under a gold sun."

   BASE: foundry take #1 (the consensus winner — the warm, instant "sunlit
   walled garden" read + estate parchment hand). Conservatively grafted per the
   judges: (1) a crisper engraved woodcut SUNBURST (warm gold, held tight in its
   upper-left corner); (2) take #2's articulated voussoir-ring + keystone
   GATEWAY with a sunlit path glowing up THROUGH the arch; (3) hand-drawn stone
   COURSES/blocks on the wall; plus the required fixes — the near-centre gold
   hook/seam artifact removed, the lollipop flowers massed into clustered beds,
   and the cypress/topiary given drawn silhouettes rather than blurred blobs.
   Take #1's WARM green foliage palette is kept (take #2's cooler olive is NOT
   imported), the dead-centre stays quiet warm sky/wall for the eclipse
   corona-sliver, and the leaf stays STATIC (motion belongs to the fold).

   API — a single global installer used by BOTH the preview harness and the
   shipped build (see hexaflexagon/art-specs/face-day.md):
       window.installHexaArt(A) → A.setScene('day', drawDay); returns 'day'
       window.HexaArt.day = drawDay
   drawDay(ctx): paints one HexaFaces.S × HexaFaces.S hexagon-centred scene into
   an S×S canvas-2D context. Deterministic (fixed noise seed). Painted once per
   mount into an offscreen bitmap, so a few ms of craft is fine.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ---- geometry (mirror HexaFaces so ink registers to the sampled hexagon) ---- */
  var HF = (typeof window !== 'undefined' && window.HexaFaces) || null;
  var S = HF ? HF.S : 900;
  var C = HF ? HF.C : S / 2;
  var R = HF ? HF.R : S * 0.47;

  /* ---- kin palette (warm ink-and-wash on parchment) ---- */
  var PAPER = '#f3ecd6', PAPER_HI = '#fbf5e4';
  var INK = '#2b2a24', INK_SOFT = 'rgba(43,42,36,0.62)';
  var GOLD = '#f4d27a', GOLD_DEEP = '#c9a24a', GOLD_HI = '#fff4cf';
  var GREEN = '#6f8f5a', GREEN_DK = '#55744a', GREEN_HI = '#8fae6c';
  var STONE = '#c8b98f', STONE_SH = '#a7966a', STONE_HI = '#e6dcbb';
  var STONE_JOINT = 'rgba(120,102,66,0.5)';
  var BLOOM = ['#bf5638', '#e0a648', '#d47f6f', '#e6c25a', '#9c7fa0'];

  /* ---- deterministic PRNG ---- */
  function mkRnd(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function corner(i, rad) {
    var a = (-90 + 60 * i) * Math.PI / 180;
    return [C + rad * Math.cos(a), C + rad * Math.sin(a)];
  }
  function hexPath(ctx, rad) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) { var p = corner(i, rad == null ? R : rad); if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  /* ---- a calligraphic tapering ink stroke: fat middle, thin ends (or one-ended) ----
     pts: array of [x,y]; wMax: max half-thickness*2 at fattest; opt.taper 'both'|'end'|'none' */
  function inkStroke(ctx, pts, wMax, col, opt) {
    opt = opt || {};
    var taper = opt.taper || 'both';
    var dense = [], N = 64;
    var segLen = [], total = 0, k;
    for (k = 0; k < pts.length - 1; k++) { var l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); segLen.push(l); total += l; }
    if (total < 1e-3) return;
    for (var j = 0; j <= N; j++) {
      var d = j / N * total, acc = 0, si = 0;
      while (si < segLen.length - 1 && acc + segLen[si] < d) { acc += segLen[si]; si++; }
      var t = segLen[si] > 1e-6 ? (d - acc) / segLen[si] : 0;
      dense.push([pts[si][0] + (pts[si + 1][0] - pts[si][0]) * t, pts[si][1] + (pts[si + 1][1] - pts[si][1]) * t]);
    }
    function widthAt(u) {
      if (taper === 'none') return wMax;
      if (taper === 'end') return wMax * Math.pow(1 - u, 0.7);       // thick at start, thin tip
      return wMax * Math.pow(Math.sin(Math.PI * u), 0.55);          // thin-fat-thin
    }
    var left = [], right = [];
    for (k = 0; k <= N; k++) {
      var u = k / N;
      var a = dense[Math.max(0, k - 1)], b = dense[Math.min(N, k + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      var nx = -ty / tl, ny = tx / tl, hw = widthAt(u) / 2;
      left.push([dense[k][0] + nx * hw, dense[k][1] + ny * hw]);
      right.push([dense[k][0] - nx * hw, dense[k][1] - ny * hw]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (k = 1; k <= N; k++) ctx.lineTo(left[k][0], left[k][1]);
    for (k = N; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1]);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  }

  /* ---- soft colour wash: fill a shape with a blurred, low-alpha bleed ---- */
  function wash(ctx, drawFn, col, alpha, blur) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (ctx.filter !== undefined) ctx.filter = 'blur(' + (blur || 5) + 'px)';
    ctx.fillStyle = col;
    ctx.beginPath(); drawFn(ctx); ctx.fill();
    ctx.restore();
  }
  function blob(ctx, cx, cy, rx, ry, rnd, wob) {
    var n = 12;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2;
      var rr = 1 + (rnd() - 0.5) * (wob || 0.14);
      var x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /* ---- anisotropic laid-fibre parchment grain (deterministic, synchronous) ---- */
  function grain(ctx) {
    var img = ctx.getImageData(0, 0, S, S), d = img.data, rnd = mkRnd(0x51ed);
    for (var y = 0; y < S; y++) {
      var laid = Math.sin(y * 0.85) * 2.2 + Math.sin(y * 0.21 + 1.3) * 1.4;   // close horizontal laid lines
      for (var x = 0; x < S; x++) {
        var i = (y * S + x) * 4;
        if (d[i + 3] === 0) continue;
        var chain = Math.sin(x * 0.045) * 1.1;                                // wider vertical chain lines
        var n = (rnd() - 0.5) * 9 + laid + chain;
        d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  function drawDay(ctx) {
    var rnd = mkRnd(20260723);
    ctx.save();
    hexPath(ctx); ctx.clip();

    /* — warm sky wash over parchment — */
    var g = ctx.createLinearGradient(0, C - R, 0, C + R * 0.55);
    g.addColorStop(0, '#f7e3ac'); g.addColorStop(0.5, '#f6ead0'); g.addColorStop(1, '#eef0d6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);

    /* — the sun: HIGH and OFF-CENTRE (upper-left); keeps dead-centre quiet — */
    var sx = C - R * 0.42, sy = C - R * 0.52, sr = R * 0.132;
    // outer glow bleed (held so its soft edge never reaches the quiet centre)
    var sg = ctx.createRadialGradient(sx, sy, R * 0.02, sx, sy, R * 0.40);
    sg.addColorStop(0, 'rgba(255,244,207,0.95)');
    sg.addColorStop(0.34, 'rgba(244,210,122,0.52)');
    sg.addColorStop(1, 'rgba(244,210,122,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, R * 0.40, 0, 7); ctx.fill();
    // GRAFT (take 2): a crisper engraved woodcut sunburst — alternating long/short
    // ray-lines tapering to a point, in WARM gold, held tight to the sun so the
    // burst stays in its upper-left corner and never reaches the quiet centre.
    var NR = 36;
    for (var r = 0; r < NR; r++) {
      var ra = r / NR * Math.PI * 2 + 0.10;
      var lng = sr * ((r % 2) ? 0.62 : 1.05) + (rnd() - 0.5) * sr * 0.14;
      var r0 = sr * 1.10, r1 = r0 + lng;
      inkStroke(ctx, [
        [sx + Math.cos(ra) * r0, sy + Math.sin(ra) * r0],
        [sx + Math.cos(ra) * r1, sy + Math.sin(ra) * r1]
      ], sr * 0.055, 'rgba(201,162,74,0.74)', { taper: 'end' });
    }
    // sun body — soft gold wash + hand-inked rim
    var sb = ctx.createRadialGradient(sx - sr * 0.25, sy - sr * 0.25, sr * 0.06, sx, sy, sr);
    sb.addColorStop(0, GOLD_HI); sb.addColorStop(0.6, GOLD); sb.addColorStop(1, GOLD_DEEP);
    ctx.fillStyle = sb; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
    var rim = [];
    for (var q = 0; q <= 44; q++) { var qa = q / 44 * Math.PI * 2, rr = sr + (rnd() - 0.5) * sr * 0.04; rim.push([sx + Math.cos(qa) * rr, sy + Math.sin(qa) * rr]); }
    inkStroke(ctx, rim, sr * 0.045, GOLD_DEEP, { taper: 'none' });

    /* — one soft wash cloud upper-right, balancing the sun (centre kept clear) — */
    (function cloud(cx, cy, w) {
      wash(ctx, function (c) {
        blob(c, cx - w * 0.30, cy + w * 0.06, w * 0.34, w * 0.20, rnd, 0.2);
        blob(c, cx + w * 0.05, cy - w * 0.05, w * 0.40, w * 0.26, rnd, 0.2);
        blob(c, cx + w * 0.40, cy + w * 0.04, w * 0.30, w * 0.18, rnd, 0.2);
      }, PAPER_HI, 0.55, 7);
    })(C + R * 0.42, C - R * 0.32, R * 0.28);

    /* — a swallow, upper-right, small — */
    (function bird(bx, by, sc) {
      inkStroke(ctx, [[bx - sc, by], [bx - sc * 0.3, by - sc * 0.6], [bx, by - sc * 0.15]], sc * 0.09, INK_SOFT, { taper: 'both' });
      inkStroke(ctx, [[bx, by - sc * 0.15], [bx + sc * 0.3, by - sc * 0.6], [bx + sc, by]], sc * 0.09, INK_SOFT, { taper: 'both' });
    })(C + R * 0.34, C - R * 0.36, R * 0.06);

    /* — the garden ground behind & the bowed stone wall — */
    // wall crest bows down at the sides so it rings the lower scene (softer than a hard band)
    var wallTop = C + R * 0.055, bow = R * 0.115;
    function crestY(x) { var u = (x - C) / R; return wallTop + bow * u * u; }
    var xL = C - R * 0.86, xR = C + R * 0.86;

    // grass wash filling the whole lower scene under the crest
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xL, crestY(xL));
    for (var gx = xL; gx <= xR; gx += 8) ctx.lineTo(gx, crestY(gx) - R * 0.02);
    ctx.lineTo(xR, C + R * 1.1); ctx.lineTo(xL, C + R * 1.1); ctx.closePath();
    var gg = ctx.createLinearGradient(0, wallTop, 0, C + R * 0.95);
    gg.addColorStop(0, '#c7d19a'); gg.addColorStop(0.45, '#aabd82'); gg.addColorStop(1, '#93a86f');
    ctx.fillStyle = gg; ctx.fill();
    ctx.restore();

    /* — foliage rising behind the wall: two cypress + topiary tucked at the crest —
       GRAFT-fix: drawn silhouettes (a soft grounded shadow, then a crisp inked
       body + rim) rather than a big blurred blob. Warm greens kept. */
    function cypress(cx, baseY, h, wdt) {
      // soft grounded shadow (not a full-body blur)
      wash(ctx, function (c) { c.ellipse(cx + wdt * 0.5, baseY - h * 0.06, wdt * 1.1, h * 0.10, 0, 0, 7); }, 'rgba(60,80,52,0.5)', 0.8, 5);
      // teardrop silhouette (crisp)
      ctx.beginPath();
      ctx.moveTo(cx, baseY - h);
      ctx.quadraticCurveTo(cx + wdt, baseY - h * 0.45, cx + wdt * 0.35, baseY);
      ctx.quadraticCurveTo(cx, baseY + h * 0.03, cx - wdt * 0.35, baseY);
      ctx.quadraticCurveTo(cx - wdt, baseY - h * 0.45, cx, baseY - h);
      ctx.closePath();
      var cg = ctx.createLinearGradient(cx - wdt, 0, cx + wdt, 0);
      cg.addColorStop(0, GREEN_DK); cg.addColorStop(0.5, GREEN); cg.addColorStop(1, GREEN_DK);
      ctx.fillStyle = cg; ctx.fill();
      // inked outline giving it a drawn edge, sunlit side lighter
      var out = [];
      out.push([cx, baseY - h]);
      out.push([cx + wdt * 0.7, baseY - h * 0.5]);
      out.push([cx + wdt * 0.35, baseY]);
      out.push([cx - wdt * 0.35, baseY]);
      out.push([cx - wdt * 0.7, baseY - h * 0.5]);
      out.push([cx, baseY - h]);
      inkStroke(ctx, out, wdt * 0.14, 'rgba(43,58,40,0.5)', { taper: 'none' });
      inkStroke(ctx, [[cx - wdt * 0.34, baseY - h * 0.85], [cx - wdt * 0.28, baseY - h * 0.15]], wdt * 0.10, 'rgba(160,190,120,0.45)', { taper: 'both' }); // lit rib
      inkStroke(ctx, [[cx, baseY - h * 0.92], [cx, baseY - h * 0.1]], wdt * 0.09, 'rgba(43,42,36,0.24)', { taper: 'both' });
    }
    function topiary(cx, baseY, rad) {
      // soft grounded shadow
      wash(ctx, function (c) { c.ellipse(cx + rad * 0.4, baseY, rad * 1.2, rad * 0.22, 0, 0, 7); }, 'rgba(60,80,52,0.5)', 0.8, 4);
      // trunk (drawn first, behind the sphere)
      inkStroke(ctx, [[cx, baseY - rad * 0.05], [cx, baseY - rad * 0.5]], rad * 0.16, '#6b5636', { taper: 'none' });
      // clipped sphere — crisp scalloped silhouette
      var sph = [], NSC = 24;
      for (var s2 = 0; s2 <= NSC; s2++) {
        var sa = s2 / NSC * Math.PI * 2;
        var scal = rad * (1 + 0.06 * Math.sin(s2 * 3.0) + (rnd() - 0.5) * 0.03);
        sph.push([cx + Math.cos(sa) * scal, baseY - rad * 0.9 + Math.sin(sa) * scal]);
      }
      ctx.beginPath(); ctx.moveTo(sph[0][0], sph[0][1]);
      for (var s3 = 1; s3 < sph.length; s3++) ctx.lineTo(sph[s3][0], sph[s3][1]);
      ctx.closePath();
      var tg = ctx.createRadialGradient(cx - rad * 0.4, baseY - rad * 1.25, rad * 0.1, cx, baseY - rad * 0.9, rad * 1.2);
      tg.addColorStop(0, GREEN_HI); tg.addColorStop(0.7, GREEN); tg.addColorStop(1, GREEN_DK);
      ctx.fillStyle = tg; ctx.fill();
      inkStroke(ctx, sph, rad * 0.055, 'rgba(43,58,40,0.5)', { taper: 'none' });   // drawn rim
      // a few inked scallops for clipped-leaf texture
      for (var t = 0; t < 5; t++) {
        var aa = -Math.PI + t / 4 * Math.PI, ax = cx + Math.cos(aa) * rad * 0.6, ay = baseY - rad * 0.9 + Math.sin(aa) * rad * 0.55;
        inkStroke(ctx, [[ax - rad * 0.18, ay], [ax, ay - rad * 0.12], [ax + rad * 0.18, ay]], rad * 0.05, 'rgba(43,58,40,0.34)', { taper: 'both' });
      }
    }
    cypress(C - R * 0.60, crestY(C - R * 0.60) + R * 0.02, R * 0.40, R * 0.075);
    cypress(C + R * 0.62, crestY(C + R * 0.62) + R * 0.02, R * 0.34, R * 0.066);
    topiary(C - R * 0.30, crestY(C - R * 0.30) + R * 0.015, R * 0.085);
    topiary(C + R * 0.30, crestY(C + R * 0.30) + R * 0.015, R * 0.085);

    /* — the stone wall: coping, body, joints, merlons, arched gate — */
    var wallBot = C + R * 0.46;
    // body
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xL, crestY(xL));
    for (var wx = xL; wx <= xR; wx += 6) ctx.lineTo(wx, crestY(wx));
    ctx.lineTo(xR, wallBot); ctx.lineTo(xL, wallBot); ctx.closePath();
    var wg = ctx.createLinearGradient(0, wallTop, 0, wallBot);
    wg.addColorStop(0, STONE_HI); wg.addColorStop(0.25, STONE); wg.addColorStop(1, STONE_SH);
    ctx.fillStyle = wg; ctx.fill();
    ctx.clip();   // stone courses only inside the wall
    // GRAFT (take 2): hand-drawn stone COURSES + staggered blocks (warm ink),
    // giving the masonry craft rather than a flat face.
    var courseH = R * 0.088, crestC = crestY(C);
    for (var cyc = crestC + R * 0.04; cyc < wallBot; cyc += courseH) {
      var rowi = Math.round((cyc - (crestC + R * 0.04)) / courseH);
      // course line (slightly living)
      inkStroke(ctx, [[xL, cyc + (rnd() - 0.5) * 3], [C, cyc + (rnd() - 0.5) * 3], [xR, cyc + (rnd() - 0.5) * 3]], R * 0.005, STONE_JOINT, { taper: 'none' });
      // a faint sunlit lip just under each course for depth
      inkStroke(ctx, [[xL, cyc + 2.5], [xR, cyc + 2.5]], R * 0.004, 'rgba(230,220,187,0.5)', { taper: 'none' });
      // staggered vertical block joints
      var off = (rowi % 2) ? courseH * 0.7 : 0;
      for (var vx = xL + off + R * 0.03; vx < xR; vx += courseH * 1.5) {
        var jj = vx + (rnd() - 0.5) * 4;
        inkStroke(ctx, [[jj, cyc + 2], [jj, cyc + courseH - 2]], R * 0.004, STONE_JOINT, { taper: 'none' });
      }
    }
    ctx.restore();
    // coping highlight along the crest (lit from the upper-left sun)
    var cop = [];
    for (var cxp = xL; cxp <= xR; cxp += 6) cop.push([cxp, crestY(cxp)]);
    inkStroke(ctx, cop, R * 0.018, STONE_HI, { taper: 'none' });
    inkStroke(ctx, cop, R * 0.007, 'rgba(120,102,66,0.55)', { taper: 'none' });
    // merlons along the crest — a CRENEL GAP is left at dead-centre so the
    // exact centre column stays quiet sky (the eclipse's corona-sliver lives there)
    for (var m = -0.74; m <= 0.74; m += 0.185) {
      if (Math.abs(m) < 0.09) continue;
      var mx = C + R * m, my = crestY(mx), mw = R * 0.058, mh = R * 0.05;
      ctx.beginPath();
      ctx.moveTo(mx - mw / 2, my); ctx.lineTo(mx - mw / 2, my - mh);
      ctx.lineTo(mx + mw / 2, my - mh); ctx.lineTo(mx + mw / 2, my); ctx.closePath();
      var mgc = ctx.createLinearGradient(mx - mw / 2, 0, mx + mw / 2, 0);
      mgc.addColorStop(0, STONE_HI); mgc.addColorStop(1, STONE_SH);
      ctx.fillStyle = mgc; ctx.fill();
      inkStroke(ctx, [[mx - mw / 2, my - mh], [mx + mw / 2, my - mh]], R * 0.006, 'rgba(120,102,66,0.5)', { taper: 'none' });
    }

    // GRAFT (take 2): the ARCHED GATEWAY — a voussoir ring + keystone with a
    // sunlit path glowing up THROUGH the opening. Centred horizontally, LOW
    // (its crown sits well below the quiet centre).
    (function gate() {
      var gxc = C, gr = R * 0.135;                 // half-width of the opening
      var gSpring = wallBot - R * 0.14;            // springline; crown = gSpring - gr
      var gBot = wallBot;
      var ringW = R * 0.045;                       // voussoir band thickness

      // 1) dark receding interior — a shaded passage (warm, not foliage-green)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(gxc - gr, gBot);
      ctx.lineTo(gxc - gr, gSpring);
      ctx.arc(gxc, gSpring, gr, Math.PI, 0);
      ctx.lineTo(gxc + gr, gBot); ctx.closePath();
      ctx.clip();
      var inside = ctx.createLinearGradient(0, gSpring - gr, 0, gBot);
      inside.addColorStop(0, '#3a3324'); inside.addColorStop(0.55, '#4c4230'); inside.addColorStop(1, '#6a5c3c');
      ctx.fillStyle = inside; ctx.fillRect(gxc - gr, gSpring - gr, gr * 2, gBot - (gSpring - gr));
      // sunlit path continuing THROUGH the opening (reads as a way out)
      var through = ctx.createLinearGradient(0, gBot, 0, gSpring - gr * 0.3);
      through.addColorStop(0, 'rgba(213,196,151,0.95)'); through.addColorStop(1, 'rgba(213,196,151,0)');
      ctx.fillStyle = through;
      ctx.beginPath();
      ctx.moveTo(gxc - gr * 0.5, gBot); ctx.lineTo(gxc - gr * 0.14, gSpring - gr * 0.25);
      ctx.lineTo(gxc + gr * 0.14, gSpring - gr * 0.25); ctx.lineTo(gxc + gr * 0.5, gBot); ctx.closePath(); ctx.fill();
      ctx.restore();

      // 2) the stone voussoir ring around the arch
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(gxc - gr - ringW, gBot);
      ctx.lineTo(gxc - gr - ringW, gSpring);
      ctx.arc(gxc, gSpring, gr + ringW, Math.PI, 0);
      ctx.lineTo(gxc + gr + ringW, gBot);
      ctx.lineTo(gxc + gr, gBot);
      ctx.lineTo(gxc + gr, gSpring);
      ctx.arc(gxc, gSpring, gr, 0, Math.PI, true);
      ctx.lineTo(gxc - gr, gBot); ctx.closePath();
      var rg = ctx.createLinearGradient(gxc - gr, 0, gxc + gr, 0);
      rg.addColorStop(0, STONE_HI); rg.addColorStop(0.5, STONE); rg.addColorStop(1, STONE_SH);
      ctx.fillStyle = rg; ctx.fill();
      ctx.restore();
      // voussoir joints radiating from the arch centre
      for (var vj = 0; vj <= 7; vj++) {
        var va = Math.PI + vj / 7 * Math.PI;
        inkStroke(ctx, [
          [gxc + Math.cos(va) * gr, gSpring + Math.sin(va) * gr],
          [gxc + Math.cos(va) * (gr + ringW), gSpring + Math.sin(va) * (gr + ringW)]
        ], R * 0.005, 'rgba(120,102,66,0.5)', { taper: 'none' });
      }
      // crisp inked outlines: inner opening + outer ring
      var inArc = [];
      for (var iv = 0; iv <= 20; iv++) { var ia = Math.PI + iv / 20 * Math.PI; inArc.push([gxc + Math.cos(ia) * gr, gSpring + Math.sin(ia) * gr]); }
      inkStroke(ctx, [[gxc - gr, gBot], [gxc - gr, gSpring]], R * 0.009, INK_SOFT, { taper: 'none' });
      inkStroke(ctx, inArc, R * 0.010, INK_SOFT, { taper: 'none' });
      inkStroke(ctx, [[gxc + gr, gSpring], [gxc + gr, gBot]], R * 0.009, INK_SOFT, { taper: 'none' });
      var outArc = [];
      for (var ov = 0; ov <= 20; ov++) { var oa = Math.PI + ov / 20 * Math.PI; outArc.push([gxc + Math.cos(oa) * (gr + ringW), gSpring + Math.sin(oa) * (gr + ringW)]); }
      inkStroke(ctx, outArc, R * 0.006, 'rgba(120,102,66,0.55)', { taper: 'none' });

      // 3) keystone at the crown
      var kx = gxc, ky = gSpring - gr - ringW;
      ctx.beginPath();
      ctx.moveTo(kx - gr * 0.16, ky + ringW); ctx.lineTo(kx + gr * 0.16, ky + ringW);
      ctx.lineTo(kx + gr * 0.12, ky - R * 0.028); ctx.lineTo(kx - gr * 0.12, ky - R * 0.028); ctx.closePath();
      ctx.fillStyle = STONE_HI; ctx.fill();
      inkStroke(ctx, [[kx - gr * 0.12, ky - R * 0.028], [kx + gr * 0.12, ky - R * 0.028]], R * 0.006, 'rgba(120,102,66,0.5)', { taper: 'none' });
    })();

    /* — a soft cast shadow grounding the wall on the foreground grass — */
    wash(ctx, function (c) {
      c.moveTo(xL, wallBot);
      for (var sxp = xL; sxp <= xR; sxp += 10) c.lineTo(sxp, wallBot + R * 0.05);
      c.lineTo(xR, wallBot); c.closePath();
    }, '#5c6b42', 0.28, 9);

    /* — foreground: flagstone path to the gate + clustered flower beds — */
    // path (narrowing toward the gate, all below centre)
    (function path() {
      var top = wallBot - R * 0.005, botY = C + R * 0.86;
      var tw = R * 0.075, bw = R * 0.26;
      ctx.beginPath();
      ctx.moveTo(C - tw, top); ctx.lineTo(C + tw, top);
      ctx.lineTo(C + bw, botY); ctx.lineTo(C - bw, botY); ctx.closePath();
      var pg = ctx.createLinearGradient(0, top, 0, botY);
      pg.addColorStop(0, '#c9b78c'); pg.addColorStop(0.5, '#d5c497'); pg.addColorStop(1, '#c4b184');
      ctx.fillStyle = pg; ctx.fill();
      ctx.save(); ctx.clip();
      for (var pr = 0; pr < 5; pr++) {
        var pt = pr / 5, yy = top + (botY - top) * pt + R * 0.02;
        var hw = tw + (bw - tw) * pt;
        inkStroke(ctx, [[C - hw, yy], [C, yy + (rnd() - 0.5) * R * 0.008], [C + hw, yy]], R * 0.006, 'rgba(120,102,66,0.4)', { taper: 'none' });
      }
      ctx.restore();
    })();
    // GRAFT-fix: clustered flower BEDS (massed low blossom) rather than lollipops.
    // A low mounded green base, then dense dabs of bloom clustered over it.
    function bed(cx0, cx1, yBase) {
      var span = cx1 - cx0, mid = (cx0 + cx1) / 2;
      // mounded green base of the bed (crisp, low)
      wash(ctx, function (c) {
        blob(c, mid, yBase + R * 0.01, span * 0.60, R * 0.05, rnd, 0.22);
      }, GREEN_DK, 0.7, 4);
      ctx.beginPath(); blob(ctx, mid, yBase + R * 0.005, span * 0.56, R * 0.042, rnd, 0.18); ctx.closePath();
      var bg = ctx.createLinearGradient(0, yBase - R * 0.04, 0, yBase + R * 0.05);
      bg.addColorStop(0, GREEN_HI); bg.addColorStop(1, GREEN_DK);
      ctx.fillStyle = bg; ctx.fill();
      // clustered blossom dabs massed over the mound
      var n = 22;
      for (var f = 0; f < n; f++) {
        var fx = cx0 + rnd() * span;
        var dxr = (fx - mid) / (span * 0.5);                        // 0 centre .. 1 edge
        var moundTop = yBase - R * 0.032 * (1 - dxr * dxr);          // follow the mound crown
        var fy = moundTop + rnd() * R * 0.055;
        var sc = R * (0.013 + rnd() * 0.010);
        // short green stem tucked into the bed (not a lollipop)
        inkStroke(ctx, [[fx, fy + sc * 2.0], [fx + (rnd() - 0.5) * sc * 0.6, fy + sc * 0.5]], sc * 0.34, GREEN_DK, { taper: 'end' });
        var col = BLOOM[(Math.floor(rnd() * BLOOM.length)) % BLOOM.length];
        wash(ctx, function (c) { c.arc(fx, fy, sc * 1.1, 0, 7); }, col, 0.85, 1.8);
        ctx.beginPath(); ctx.arc(fx, fy, sc * 0.66, 0, 7); ctx.fillStyle = col; ctx.fill();
        ctx.beginPath(); ctx.arc(fx - sc * 0.18, fy - sc * 0.18, sc * 0.18, 0, 7); ctx.fillStyle = 'rgba(255,248,224,0.6)'; ctx.fill();
      }
    }
    bed(C - R * 0.74, C - R * 0.28, C + R * 0.60);
    bed(C + R * 0.28, C + R * 0.74, C + R * 0.60);

    /* — parchment grain over everything, then a hand-inked hex frame — */
    grain(ctx);
    var fr = [];
    for (var fi = 0; fi <= 6; fi++) { var p = corner(fi % 6, R - R * 0.006); fr.push([p[0] + (rnd() - 0.5) * 2, p[1] + (rnd() - 0.5) * 2]); }
    inkStroke(ctx, fr, R * 0.008, 'rgba(120,96,52,0.55)', { taper: 'none' });

    ctx.restore();
  }

  /* ---- install (harness + shipped build) ---- */
  if (typeof window !== 'undefined') {
    window.installHexaArt = function (A) { A.setScene('day', drawDay); return 'day'; };
    (window.HexaArt = window.HexaArt || {}).day = drawDay;
  }
})();
