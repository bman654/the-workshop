// @kind fish
// @assetKey fish-ventshrimp
// Vent shrimp — the floor GRAZE, self-lit.
//
// A humped Rimicaris-style vent shrimp seen in profile: an arched carapace hump,
// a segmented abdomen tucking into a flicking tail-fan (uropods + telson drawn as
// one connected ribbed membrane), a swarm of rippling pereiopods walking as a
// travelling metachronal wave, two tapering sweeping antennae, and a bright
// dorsal eye-spot. It carries its OWN light: a warm orange body core washed from
// beneath by the cold teal of the vent it grazes. Where the column light has
// failed entirely, this little crust still glows — chemosynthesis made visible.
//
// ctx is pre-translated to the shrimp centre and rotated to its heading
// (+x = forward / head, +y = down). Draw in LOCAL coords; we ctx.save()/restore()
// internally but leave the transform as received.
//   p = { s, L, col, ph, boil, light, TAU }
window.__ASSET = function drawVentShrimp(ctx, p) {
  var s = p.s, L = p.L, ph = p.ph || 0, TAU = p.TAU || Math.PI * 2;
  var boil = p.boil || 0, light = p.light == null ? 1 : p.light;

  // --- palette ----------------------------------------------------------------
  // The species is warm (#ff9d6e). The vent below washes it teal. We carry our
  // own light, so depth-dimming is gentle: self-lit things stay visible on black.
  var WARM = '#ff9d6e';     // self-lit body core
  var WARM_HI = '#ffd2ad';  // hot dorsal highlight
  var WARM_DK = '#b35a36';  // shaded under-carapace
  var TEAL = '#7fe6d8';     // vent under-light (cold, from below)
  // alpha floor: even at low light a self-lit thing reads. Boil brightens.
  var glow = 0.62 + 0.30 * light + 0.14 * boil;
  if (glow > 1) glow = 1;

  // gentle self-glow pulse with the swim phase
  var pulse = 0.82 + 0.18 * Math.sin(ph * 0.5);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ============================================================================
  // 0. SELF-GLOW HALO — a soft warm core sitting over a colder teal wash from the
  //    vent below. This is the "own light" the spec asks for; the page draws an
  //    outer halo too, but the crust's intimate glow is ours.
  //    GRAFT (judge 2): widen + soften the teal vent under-pool so each animal
  //    sits in a larger cold floor-glow; tighten the warm core into a crisper
  //    emissive crust (steeper falloff, less diffuse bleed) so it blazes over it.
  // ============================================================================
  var hx = 0.02 * L; // glow centred over the body / hump
  // teal under-wash (offset DOWN: light rises from the vent below the floor).
  // Wider + softer than take 1: a broad low cold pool the warm crust sits on.
  ctx.globalCompositeOperation = 'screen';
  var tealR = L * 1.75;
  var rgT = ctx.createRadialGradient(hx, s * 1.35, 0, hx, s * 1.35, tealR);
  rgT.addColorStop(0, withA(TEAL, 0.30 * glow * pulse));
  rgT.addColorStop(0.40, withA(TEAL, 0.15 * glow * pulse));
  rgT.addColorStop(0.72, withA(TEAL, 0.05 * glow * pulse));
  rgT.addColorStop(1, withA(TEAL, 0));
  ctx.fillStyle = rgT;
  ctx.beginPath(); ctx.arc(hx, s * 1.35, tealR, 0, TAU); ctx.fill();
  // warm core glow (centred on the body) — crisper crust: tighter, steeper falloff.
  var rgW = ctx.createRadialGradient(hx, -s * 0.1, 0, hx, -s * 0.1, L * 0.80);
  rgW.addColorStop(0, withA(WARM, 0.46 * glow * pulse));
  rgW.addColorStop(0.35, withA(WARM, 0.18 * glow * pulse));
  rgW.addColorStop(0.70, withA(WARM, 0.04 * glow * pulse));
  rgW.addColorStop(1, withA(WARM, 0));
  ctx.fillStyle = rgW;
  ctx.beginPath(); ctx.arc(hx, -s * 0.1, L * 0.80, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // ============================================================================
  // Body geometry. Head at +x, tail at −x. The abdomen flexes with ph (a sculling
  // shrimp tucks its tail under and snaps it back). The hump is the carapace.
  // ============================================================================
  // segment centreline: from nose (+L) back to tail base (−0.55L), then the
  // flexing abdomen curls down/under to the tail-fan at ~−L.
  var flick = Math.sin(ph) * (0.55 + 0.45 * boil);       // tail-fan flick
  // GRAFT (judge 1): a smoother abdomen curl (take 2's eased tuck) so the
  // fully-folded pose curls rather than kinks. Use a gentler coefficient and a
  // softened phase so the tuck eases in/out instead of snapping.
  var curl = (0.28 + 0.20 * boil) * (0.55 + 0.45 * Math.sin(ph - 0.6));

  // tail base + fan tip in local coords
  var tailBaseX = -0.58 * L, tailBaseY = curl * s * 0.9;
  // GRAFT: lengthen the telson reach a touch so the fan never reads thin/comma.
  var fanX = -1.08 * L, fanY = tailBaseY + flick * s * 1.10 + curl * s * 0.7;

  // ----------------------------------------------------------------------------
  // 1. PEREIOPODS — the swarm of walking/swimming legs under the belly, a
  //    travelling metachronal wave (back-to-front ripple). Drawn first so the
  //    body overlaps their roots.
  // ----------------------------------------------------------------------------
  var nLegs = 9;
  ctx.lineWidth = Math.max(0.7, s * 0.10);
  for (var li = 0; li < nLegs; li++) {
    var t = li / (nLegs - 1);                 // 0=head ... 1=tail
    var bx = (0.42 - 1.0 * t) * L;            // root x along the belly
    var by = s * (0.42 + 0.32 * hump(t));     // belly line (follows the hump)
    // metachronal wave: phase increases toward the tail
    var lph = ph * 1.6 - t * 2.4;
    var swing = Math.sin(lph);
    var legLen = s * (0.95 + 0.25 * Math.sin(t * 3.1));
    var tipx = bx - legLen * 0.35 + swing * legLen * 0.45;
    var tipy = by + legLen * (0.75 + 0.22 * swing);
    var midx = bx - legLen * 0.1 + swing * legLen * 0.2;
    var midy = by + legLen * 0.45;
    ctx.strokeStyle = withA(WARM, (0.34 + 0.16 * (0.5 + 0.5 * swing)) * glow);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(midx, midy, tipx, tipy);
    ctx.stroke();
  }

  // ----------------------------------------------------------------------------
  // 2. ANTENNAE — two long fine antennae sweeping forward from the head, with a
  //    slow searching sway. Drawn behind the body so the head overlaps roots.
  //    GRAFT (both judges): a faint per-segment TAPER — draw each antenna as a
  //    short chain of segments thinning toward the tip, instead of one flat
  //    stroke, so it reads as a tapering feeler.
  // ----------------------------------------------------------------------------
  var antDir = [-1, 1]; // up-forward, down-forward
  var antSeg = 5;
  for (var ai = 0; ai < 2; ai++) {
    var sgn = antDir[ai];
    var sway = Math.sin(ph * 0.9 + ai * 2.1) * s * 0.30;
    var rootx = L * 0.82, rooty = -s * 0.10 + sgn * s * 0.05;
    var ctrlx = L * 1.30, ctrly = sgn * s * 0.55 + sway * 0.5;
    var tipx2 = L * 1.66, tipy2 = sgn * s * 1.05 + sway;
    // walk the quadratic in segments, thinning + dimming toward the tip
    var px = rootx, py = rooty;
    for (var seg = 1; seg <= antSeg; seg++) {
      var u = seg / antSeg, iu = 1 - u;
      // de Casteljau point on the quadratic (root, ctrl, tip)
      var qx = iu * iu * rootx + 2 * iu * u * ctrlx + u * u * tipx2;
      var qy = iu * iu * rooty + 2 * iu * u * ctrly + u * u * tipy2;
      ctx.lineWidth = Math.max(0.4, s * 0.085 * (1 - 0.7 * (u - u / antSeg)));
      ctx.strokeStyle = withA(WARM_HI, 0.40 * glow * (1 - 0.45 * u));
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(qx, qy);
      ctx.stroke();
      px = qx; py = qy;
    }
  }

  // ----------------------------------------------------------------------------
  // 3. TAIL-FAN (uropods + telson) — GRAFT (judge 1): a single CONNECTED ribbed
  //    fan-membrane drawn as one filled blade-set with rib lines, replacing take
  //    1's three loose blades. Fixes the thin-at-low-flick problem and gives a
  //    more anatomical tail. A fan-width FLOOR keeps it from collapsing to a point.
  //    Drawn before the body so the abdomen overlaps its root.
  // ----------------------------------------------------------------------------
  // fan spread has a floor so the relaxed pose never reads thin or comma-shaped.
  var fanSpread = s * (0.85 + 0.45 * Math.abs(flick));
  var fnx = fanX - s * 0.20;                         // telson centreline reach
  // membrane: a closed fan from the tail base out to a ribbed trailing edge
  ctx.beginPath();
  ctx.moveTo(tailBaseX, tailBaseY);                  // hinge at the abdomen tip
  ctx.lineTo(fnx + s * 0.08, fanY - fanSpread);      // upper uropod tip
  ctx.quadraticCurveTo(fnx - s * 0.16, fanY - fanSpread * 0.42,
                       fnx - s * 0.30, fanY);        // upper edge dips to telson
  ctx.quadraticCurveTo(fnx - s * 0.16, fanY + fanSpread * 0.42,
                       fnx + s * 0.08, fanY + fanSpread); // lower uropod tip
  ctx.closePath();
  // warm membrane fill, hot at the hinge fading out toward the trailing edge
  var fanFill = ctx.createLinearGradient(tailBaseX, fanY, fnx, fanY);
  fanFill.addColorStop(0, withA(WARM, 0.85 * glow));
  fanFill.addColorStop(1, withA(WARM_DK, 0.55 * glow));
  ctx.fillStyle = fanFill;
  ctx.fill();
  // teal under-light catches the lower fan membrane (vent light from below)
  ctx.save();
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  var fanTeal = ctx.createLinearGradient(0, fanY, 0, fanY + fanSpread);
  fanTeal.addColorStop(0, withA(TEAL, 0));
  fanTeal.addColorStop(1, withA(TEAL, 0.42 * glow));
  ctx.fillStyle = fanTeal;
  ctx.fillRect(fnx - s * 0.6, fanY - fanSpread, (tailBaseX - fnx) + s * 0.8, fanSpread * 2.2);
  ctx.restore();
  // rib lines (uropods + telson) fanning from the hinge across the membrane
  ctx.lineWidth = Math.max(0.5, s * 0.08);
  var ribN = 4;
  for (var rb = 0; rb <= ribN; rb++) {
    var rt = rb / ribN - 0.5;                        // -0.5..0.5
    var ry = fanY + rt * 2 * fanSpread;
    var central = 1 - Math.abs(rt) * 1.4;            // centre rib (telson) brightest/longest
    var rx = fnx - s * 0.30 * Math.max(0, central) - s * 0.04;
    ctx.strokeStyle = withA(rb === 2 ? WARM_HI : WARM_DK, (0.40 + 0.30 * Math.max(0, central)) * glow);
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo((tailBaseX + rx) * 0.5, (tailBaseY + ry) * 0.5, rx, ry);
    ctx.stroke();
  }

  // ----------------------------------------------------------------------------
  // 4. BODY — carapace hump + flexing abdomen as one filled silhouette, with a
  //    warm vertical gradient (hot dorsal, shaded belly) and a teal belly rim.
  // ----------------------------------------------------------------------------
  // Upper (dorsal) outline: nose → high arched carapace hump → abdomen → tail.
  // The hump peaks tall (−1.5s) and forward, so the silhouette is clearly HUMPED.
  ctx.beginPath();
  ctx.moveTo(L * 0.96, s * 0.06);                   // nose tip (rostrum)
  ctx.quadraticCurveTo(L * 0.66, -s * 0.62, L * 0.40, -s * 1.18); // steep rise
  ctx.quadraticCurveTo(L * 0.18, -s * 1.50, -L * 0.02, -s * 1.30); // hump crest (tall)
  ctx.quadraticCurveTo(-L * 0.26, -s * 1.02, -L * 0.40, -s * 0.55); // shoulder down
  // smoother run into the tail base (eased, matches the gentler curl)
  ctx.quadraticCurveTo(-L * 0.52, -s * 0.18, tailBaseX, tailBaseY - s * 0.30); // to tail base (upper)
  // lower (ventral) outline back from the tail base to the nose
  ctx.quadraticCurveTo(-L * 0.48, tailBaseY + s * 0.48, tailBaseX, tailBaseY + s * 0.46);
  ctx.quadraticCurveTo(-L * 0.12, s * 0.66, L * 0.32, s * 0.54); // belly
  ctx.quadraticCurveTo(L * 0.68, s * 0.42, L * 0.96, s * 0.06);  // back to nose
  ctx.closePath();

  // warm dorsal→ventral gradient fill (saturated — judges: KEEP take 1's body)
  var bg = ctx.createLinearGradient(0, -s * 1.5, 0, s * 0.66);
  bg.addColorStop(0, withA(WARM_HI, glow));
  bg.addColorStop(0.42, withA(WARM, glow));
  bg.addColorStop(1, withA(WARM_DK, glow));
  ctx.fillStyle = bg;
  ctx.fill();

  // teal under-light rim along the belly (re-stroke the lower edge in screen).
  // Brighter + thicker so the cold light from the vent visibly catches the belly.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = Math.max(1.2, s * 0.20);
  ctx.strokeStyle = withA(TEAL, 0.62 * glow);
  ctx.beginPath();
  ctx.moveTo(tailBaseX, tailBaseY + s * 0.46);
  ctx.quadraticCurveTo(-L * 0.12, s * 0.66, L * 0.32, s * 0.54);
  ctx.quadraticCurveTo(L * 0.68, s * 0.42, L * 0.96, s * 0.06);
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------------------------------
  // 5. CARAPACE SEGMENTATION + dorsal sheen. A few faint cross-ridges read the
  //    segmented abdomen; a hot specular run along the hump crest.
  // ----------------------------------------------------------------------------
  ctx.lineWidth = Math.max(0.6, s * 0.08);
  ctx.strokeStyle = withA(WARM_DK, 0.45 * glow);
  for (var sg = 0; sg < 4; sg++) {
    var sx = (-0.10 - sg * 0.12) * L;
    var sy0 = -s * (0.95 - sg * 0.14);
    var sy1 = s * (0.42 - sg * 0.04) + curl * s * 0.4 * sg / 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy0);
    ctx.quadraticCurveTo(sx - s * 0.12, 0, sx, sy1);
    ctx.stroke();
  }
  // dorsal specular sheen along the tall hump crest
  ctx.strokeStyle = withA(WARM_HI, 0.62 * glow);
  ctx.lineWidth = Math.max(0.8, s * 0.11);
  ctx.beginPath();
  ctx.moveTo(L * 0.58, -s * 0.70);
  ctx.quadraticCurveTo(L * 0.20, -s * 1.34, -L * 0.02, -s * 1.14);
  ctx.stroke();

  // ----------------------------------------------------------------------------
  // 6. EYE-SPOT — Rimicaris carries a bright dorsal photoreceptor patch. A hot
  //    little teal-white spark high on the carapace; the brightest point.
  //    GRAFT (judge 2): a crisper catch-light — a tighter halo plus a hard hot
  //    white core, so the eye reads as a sharp spark not a soft blob.
  // ----------------------------------------------------------------------------
  var ex = L * 0.46, ey = -s * 0.78;
  ctx.globalCompositeOperation = 'screen';
  var eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, s * 0.38);
  eg.addColorStop(0, withA('#eafffb', 0.95 * glow));
  eg.addColorStop(0.40, withA(TEAL, 0.45 * glow));
  eg.addColorStop(1, withA(TEAL, 0));
  ctx.fillStyle = eg;
  ctx.beginPath(); ctx.arc(ex, ey, s * 0.38, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // hard hot core (crisper catch-light)
  ctx.fillStyle = withA('#ffffff', 0.96 * glow);
  ctx.beginPath(); ctx.arc(ex, ey, s * 0.10, 0, TAU); ctx.fill();

  ctx.restore();

  // --- helpers ---------------------------------------------------------------
  // hump profile 0..1 → 0..1, peaks near the head third (where the carapace is)
  function hump(u) {
    var x = (u - 0.28);
    return Math.max(0, 1 - (x * x) * 4.2);
  }
  // '#rrggbb' + alpha → rgba()
  function withA(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a < 0 ? 0 : a > 1 ? 1 : a) + ')';
  }
};
