// The Unstirring — forged glass asset (foundry synth: Take 2 base + judge grafts).
// window.UnstirringGlass.drawGlass(ctx, view, env)
//   Direction: thick beveled optical glassware, lit from upper-left.
//   • OUTER WALL (fixed): dark glass body + meniscus refraction band + a biased
//     rim-light with a crisp specular hotspot core (Take 1's sharper hotspot grafted
//     onto Take 2's substantial wall).
//   • INNER GLASS (crankable, rotates by env.wind*2π): a lit convex dome carrying a
//     DOMINANT, clean specular caustic CRESCENT (Take 1's tighter arc geometry, Take 2's
//     warmth) riding just inside the inner rim, so the rotation reads ON the glass.
//   • De-gauged fiducial: a SHORT thick gold spoke + tip bead (not a clock hand) so
//     turns are countable without the disc reading as a dial.
//   • Subdued knurled grip + a gentle idle grab-ring dimmed away from the caustic peak.
//   All light reads as GLASS + LIGHT, never flat amber outlines.
(function () {
  'use strict';
  var TAU = Math.PI * 2;

  function drawGlass(ctx, view, env) {
    var cx = view.cx, cy = view.cy;
    var Rin = view.Rin, Rout = view.Rout;
    var wind = (env && typeof env.wind === 'number') ? env.wind : 0;
    var dragging = env && env.dragging;
    var t = (env && typeof env.t === 'number') ? env.t : 0;
    var ang = wind * TAU;               // inner-glass rotation, exact crank angle

    // --- save everything we touch ---
    var savedComposite = ctx.globalCompositeOperation;
    var savedAlpha = ctx.globalAlpha;
    ctx.save();

    // ===================================================================
    // OUTER WALL — a thick optical glass ring, fixed. Key light from upper-left.
    // ===================================================================
    var wallOuter = Rout;
    var wallInner = Rout * 0.955;       // wall thickness

    // syrup meniscus refraction just inside the wall — a visible thick-glass band so the
    // outer wall reads as substantial glass, not an empty outline. (kept from Take 2)
    ctx.globalCompositeOperation = 'lighter';
    var men = ctx.createRadialGradient(cx, cy, wallInner * 0.82, cx, cy, wallInner);
    men.addColorStop(0, 'rgba(120,150,170,0)');
    men.addColorStop(0.6, 'rgba(150,180,200,0.10)');
    men.addColorStop(1, 'rgba(190,215,235,0.26)');
    ctx.fillStyle = men;
    ctx.beginPath();
    ctx.arc(cx, cy, wallInner, 0, TAU);
    ctx.arc(cx, cy, wallInner * 0.8, 0, TAU, true);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // the glass body of the wall — dark, with a body sheen
    ctx.beginPath();
    ctx.arc(cx, cy, wallOuter, 0, TAU);
    ctx.arc(cx, cy, wallInner, 0, TAU, true);
    ctx.fillStyle = 'rgba(30,26,18,0.55)';
    ctx.fill();

    // wall base stroke (both edges) — a faint amber-glass edge
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(232,182,76,0.16)';
    ctx.beginPath(); ctx.arc(cx, cy, wallOuter, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, wallInner, 0, TAU); ctx.stroke();

    // RIM-LIGHT: a bright biased specular arc on the outer edge (upper-left key).
    ctx.globalCompositeOperation = 'lighter';
    var keyA = -Math.PI * 0.78;         // upper-left
    // broad soft rim glow
    ctx.lineWidth = Rout * 0.055;
    var rimGrad = ctx.createLinearGradient(
      cx + Math.cos(keyA) * Rout, cy + Math.sin(keyA) * Rout,
      cx - Math.cos(keyA) * Rout, cy - Math.sin(keyA) * Rout);
    rimGrad.addColorStop(0.0, 'rgba(255,244,214,0.55)');
    rimGrad.addColorStop(0.35, 'rgba(232,182,76,0.16)');
    rimGrad.addColorStop(0.7, 'rgba(232,182,76,0)');
    ctx.strokeStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, (wallOuter + wallInner) / 2, keyA - 1.15, keyA + 1.15);
    ctx.stroke();
    // hard specular hotspot core — GRAFT from Take 1: a tight, bright, round-capped
    // core streak that sharpens the highlight so the wall reads as polished glass.
    ctx.lineCap = 'round';
    ctx.lineWidth = Rout * 0.016;
    ctx.strokeStyle = 'rgba(255,253,244,0.98)';
    ctx.beginPath();
    ctx.arc(cx, cy, wallOuter - Rout * 0.012, keyA - 0.30, keyA + 0.30);
    ctx.stroke();
    // an even tighter blown-out pip at the exact key point
    ctx.lineWidth = Rout * 0.028;
    ctx.strokeStyle = 'rgba(255,255,252,0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, wallOuter - Rout * 0.012, keyA - 0.09, keyA + 0.09);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // a faint opposite (fill-light) rim so the ring reads round
    ctx.lineWidth = Rout * 0.03;
    ctx.strokeStyle = 'rgba(180,200,220,0.10)';
    ctx.beginPath();
    ctx.arc(cx, cy, (wallOuter + wallInner) / 2, keyA + Math.PI - 0.7, keyA + Math.PI + 0.7);
    ctx.stroke();

    // ===================================================================
    // INNER GLASS — the crankable polished cylinder. Everything here rotates by `ang`.
    // ===================================================================
    ctx.globalCompositeOperation = 'source-over';

    // polished disc body — a lit dome: bright top-left sheen falling to a dark base, so the
    // inner glass reads as a rounded, lit cylinder rather than a flat dark hole.
    var body = ctx.createRadialGradient(
      cx - Rin * 0.4, cy - Rin * 0.45, Rin * 0.05,
      cx, cy, Rin * 1.05);
    body.addColorStop(0, 'rgba(96,74,42,0.9)');
    body.addColorStop(0.4, 'rgba(58,44,24,0.78)');
    body.addColorStop(0.75, 'rgba(34,25,13,0.7)');
    body.addColorStop(1, 'rgba(14,10,6,0.72)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, Rin, 0, TAU);
    ctx.fill();

    // a restrained top-left ambient sheen — kept LOW so the rotating caustic is the
    // dominant highlight and rotation reads clearly. (kept from Take 2)
    ctx.globalCompositeOperation = 'lighter';
    var sheen = ctx.createRadialGradient(
      cx - Rin * 0.42, cy - Rin * 0.42, 0,
      cx - Rin * 0.42, cy - Rin * 0.42, Rin * 0.7);
    sheen.addColorStop(0, 'rgba(240,220,180,0.16)');
    sheen.addColorStop(1, 'rgba(232,190,110,0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.arc(cx, cy, Rin, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // inner edge — a beveled glass rim, brighter on top
    ctx.lineWidth = Math.max(1.5, Rin * 0.02);
    var bevel = ctx.createLinearGradient(cx, cy - Rin, cx, cy + Rin);
    bevel.addColorStop(0, 'rgba(255,240,205,0.7)');
    bevel.addColorStop(0.5, 'rgba(232,182,76,0.22)');
    bevel.addColorStop(1, 'rgba(120,90,40,0.28)');
    ctx.strokeStyle = bevel;
    ctx.beginPath();
    ctx.arc(cx, cy, Rin * 0.99, 0, TAU);
    ctx.stroke();

    // --- rotating group: caustic + knurled grip + fiducial ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    // clip to the inner glass so caustic/grip stay ON the cylinder (crisp rim)
    ctx.beginPath();
    ctx.arc(0, 0, Rin * 0.995, 0, TAU);
    ctx.clip();

    // ---------------------------------------------------------------------------
    // CAUSTIC CRESCENT — the dominant highlight, riding just inside the inner rim.
    // GRAFT: Take 1's tighter, cleaner three-band arc geometry (broad glow / mid /
    // hot core) + specular focus point, in Take 2's warm palette. It stays clipped to
    // the inner cylinder so the rotation reads ON the glass, never in the void.
    // ---------------------------------------------------------------------------
    ctx.globalCompositeOperation = 'lighter';
    var causticA = -Math.PI * 0.5;      // rests at top of the (rotated) glass frame
    var causR = Rin * 0.86;             // rides just inside the rim

    // (1) broad crescent glow — a wide soft bloom hugging the rim
    ctx.lineWidth = Rin * 0.34;
    ctx.strokeStyle = 'rgba(248,196,96,0.30)';
    ctx.beginPath();
    ctx.arc(0, 0, causR, causticA - 1.15, causticA + 1.15);
    ctx.stroke();

    // (2) mid crescent — warmer, tighter
    ctx.lineCap = 'round';
    ctx.lineWidth = Rin * 0.16;
    ctx.strokeStyle = 'rgba(255,216,132,0.62)';
    ctx.beginPath();
    ctx.arc(0, 0, causR, causticA - 0.74, causticA + 0.74);
    ctx.stroke();

    // (3) hot specular core — a bold, crisp, near-white arc: the caustic's focus
    ctx.lineWidth = Rin * 0.07;
    ctx.strokeStyle = 'rgba(255,250,232,0.98)';
    ctx.beginPath();
    ctx.arc(0, 0, causR, causticA - 0.38, causticA + 0.38);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // (4) the brightest focal knot — a small hot specular blob at the crescent peak
    var hx = Math.cos(causticA) * causR, hy = Math.sin(causticA) * causR;
    var knot = ctx.createRadialGradient(hx, hy, 0, hx, hy, Rin * 0.20);
    knot.addColorStop(0, 'rgba(255,255,250,1)');
    knot.addColorStop(0.4, 'rgba(255,232,160,0.6)');
    knot.addColorStop(1, 'rgba(255,224,150,0)');
    ctx.fillStyle = knot;
    ctx.beginPath();
    ctx.arc(hx, hy, Rin * 0.20, 0, TAU);
    ctx.fill();

    // (5) spectral prism fringes — cool inside, warm outside — framing the caustic
    ctx.lineWidth = Rin * 0.02;
    ctx.strokeStyle = 'rgba(150,200,255,0.34)';
    ctx.beginPath();
    ctx.arc(0, 0, causR - Rin * 0.10, causticA - 0.7, causticA + 0.7);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,150,110,0.30)';
    ctx.beginPath();
    ctx.arc(0, 0, causR + Rin * 0.085, causticA - 0.6, causticA + 0.6);
    ctx.stroke();

    // (6) a faint secondary caustic (internal reflection) on the opposite rim
    ctx.lineWidth = Rin * 0.05;
    ctx.strokeStyle = 'rgba(255,214,130,0.16)';
    ctx.beginPath();
    ctx.arc(0, 0, causR, causticA + Math.PI - 0.5, causticA + Math.PI + 0.5);
    ctx.stroke();

    // (7) the bright rim lip of the inner glass following the caustic — a lit lip so the
    // caustic feels like it's grazing the actual glass edge.
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = 'rgba(255,240,200,0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, Rin * 0.99, causticA - 0.55, causticA + 0.55);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // ---------------------------------------------------------------------------
    // KNURLED GRIP — DE-GAUGED: fewer, thinner ticks, only lit on the sunward arc so
    // they read as a subtle machined grip texture, not a full clock bezel.
    // ---------------------------------------------------------------------------
    ctx.globalCompositeOperation = 'lighter';
    var nTicks = 36;
    var tickInner = Rin * 0.92, tickOuter = Rin * 0.985;
    for (var i = 0; i < nTicks; i++) {
      var ta = (i / nTicks) * TAU;
      var d = Math.cos(ta - causticA);          // 1 at sunward (caustic), -1 opposite
      if (d <= 0.05) continue;                  // only the sunward grip glints — no full ring
      var lit = 0.30 * d;                        // subtle
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = 'rgba(255,232,180,' + lit.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * tickInner, Math.sin(ta) * tickInner);
      ctx.lineTo(Math.cos(ta) * tickOuter, Math.sin(ta) * tickOuter);
      ctx.stroke();
    }

    // ---------------------------------------------------------------------------
    // FIDUCIAL — DE-GAUGED: a SHORT thick gold spoke + tip bead + hub, reaching only
    // ~55% of the way out (not a clock hand to the rim), so turns are countable but the
    // disc reads as glass, not a dial.
    // ---------------------------------------------------------------------------
    ctx.globalCompositeOperation = 'source-over';
    var spokeLen = Rin * 0.5;
    // spoke shadow (down/right) for relief
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(3.2, Rin * 0.05);
    ctx.strokeStyle = 'rgba(70,46,16,0.55)';
    ctx.beginPath();
    ctx.moveTo(0.8, 0.9);
    ctx.lineTo(spokeLen + 0.8, 0.9);
    ctx.stroke();
    // bright gold spoke
    ctx.lineWidth = Math.max(2.6, Rin * 0.04);
    var spoke = ctx.createLinearGradient(0, 0, spokeLen, 0);
    spoke.addColorStop(0, 'rgba(200,152,60,0.95)');
    spoke.addColorStop(1, 'rgba(255,240,195,1)');
    ctx.strokeStyle = spoke;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(spokeLen, 0);
    ctx.stroke();
    // top highlight along the spoke (lit from above)
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(255,248,220,0.7)';
    ctx.beginPath();
    ctx.moveTo(Rin * 0.06, -1.0);
    ctx.lineTo(spokeLen - 1.0, -1.0);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // fiducial tip bead
    ctx.globalCompositeOperation = 'lighter';
    var dotX = spokeLen, dotR = Math.max(3.4, Rin * 0.05);
    var dotG = ctx.createRadialGradient(dotX - dotR * 0.4, -dotR * 0.4, 0, dotX, 0, dotR * 1.8);
    dotG.addColorStop(0, 'rgba(255,252,238,1)');
    dotG.addColorStop(0.45, 'rgba(255,216,124,0.9)');
    dotG.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = dotG;
    ctx.beginPath();
    ctx.arc(dotX, 0, dotR * 1.8, 0, TAU);
    ctx.fill();
    // hub cap at the center
    ctx.globalCompositeOperation = 'source-over';
    var hub = ctx.createRadialGradient(-Rin * 0.02, -Rin * 0.02, 0, 0, 0, Rin * 0.1);
    hub.addColorStop(0, 'rgba(120,92,44,0.95)');
    hub.addColorStop(1, 'rgba(40,28,14,0.95)');
    ctx.fillStyle = hub;
    ctx.beginPath();
    ctx.arc(0, 0, Rin * 0.085, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,232,180,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, Rin * 0.085, Math.PI * 1.15, Math.PI * 1.95);  // top glint
    ctx.stroke();

    ctx.restore(); // end rotating group

    // ===================================================================
    // IDLE GRAB-RING — a gentle dashed ring on the inner glass, pulses when idle.
    // DE-GAUGED + dimmed on the arc where the caustic peaks so the two don't crowd.
    // ===================================================================
    if (!dragging) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.8);      // 0..1
      var rr = Rin * (0.70 + 0.016 * pulse);
      var baseAlpha = 0.20 + 0.16 * pulse;
      // world-space angle of the caustic peak (caustic is at causticA in the rotated frame)
      var causWorld = ang + (-Math.PI * 0.5);
      ctx.globalCompositeOperation = 'lighter';
      ctx.setLineDash([Rin * 0.07, Rin * 0.075]);
      ctx.lineDashOffset = -t * 10;
      ctx.lineWidth = Math.max(1.4, Rin * 0.02);
      // draw the ring in short arc segments, fading out near the caustic peak so the
      // grab-ring and the caustic stay visually separated.
      var segs = 48;
      for (var s = 0; s < segs; s++) {
        var a0 = (s / segs) * TAU, a1 = ((s + 1) / segs) * TAU;
        var amid = (a0 + a1) / 2;
        // angular distance from the caustic peak (0..PI)
        var da = Math.abs(((amid - causWorld + Math.PI) % TAU + TAU) % TAU - Math.PI);
        var fade = Math.min(1, da / 0.9);           // 0 at the caustic, 1 away from it
        var alpha = baseAlpha * (0.15 + 0.85 * fade);
        ctx.strokeStyle = 'rgba(255,224,150,' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(cx, cy, rr, a0, a1);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // --- restore ---
    ctx.restore();
    ctx.globalCompositeOperation = savedComposite;
    ctx.globalAlpha = savedAlpha;
  }

  window.UnstirringGlass = { drawGlass: drawGlass };
})();
