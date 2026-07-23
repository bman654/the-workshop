/* ═══════════════════════════════════════════════════════════════════════════
   THE THAUMATROPE — FACE ART  (window.ThaumFaces)

   Warm ink-on-parchment engravings for the paper toy's three preset cards. Each
   card is a matched PAIR of 360×360 faces that REGISTER: the inner thing (bird /
   fish / rider) lands centred inside the outer frame (cage / bowl / horse) when
   the two faces fuse. The BACK face is authored already-mirrored, so the drawn
   ink lands square over the front once the render mirrors the back about the
   vertical string-axis — the artist never thinks about registration.

   API (the contract the art foundry's forged module must satisfy):
     ThaumFaces.paper(ctx)         → lay the parchment ground + edge shading (360²)
     ThaumFaces.pairs = {
       birdcage:   { label, a(ctx), b(ctx) },   // a = front (bird),  b = back (cage)
       fishbowl:   { label, a(ctx), b(ctx) },   // a = fish,          b = bowl
       riderhorse: { label, a(ctx), b(ctx) },   // a = rider,         b = horse
     }
   Each a()/b() paints one 360×360 face: it calls paper(ctx) itself, then inks its
   figure in warm-black over the parchment. Coordinate space is the raw 360×360
   canvas (origin top-left). The page owns the physics, the fusion, and the mount;
   this module owns only the marks.  ── placeholder art; the foundry enriches it.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  var FS = 360;
  var PAPER = '#f3ecd6', INK = '#2b2a24';

  function paper(ctx) {
    ctx.clearRect(0, 0, FS, FS);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, FS, FS);
    // faint warm grain + a soft vignette so the card reads as a physical leaf
    var g = ctx.createRadialGradient(FS * 0.5, FS * 0.44, FS * 0.12, FS * 0.5, FS * 0.5, FS * 0.72);
    g.addColorStop(0, 'rgba(255,250,235,.5)');
    g.addColorStop(1, 'rgba(120,96,52,.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FS, FS);
    ctx.strokeStyle = 'rgba(120,96,52,.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, FS - 7, FS - 7);
  }

  function pen(ctx, w) {
    ctx.strokeStyle = INK; ctx.lineWidth = w;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = INK;
  }

  /* ── the six figures (centred so paired faces register) ── */
  function bird(ctx) {
    paper(ctx); pen(ctx, 7); var cx = 180, cy = 190;
    ctx.beginPath(); ctx.ellipse(cx, cy, 52, 40, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 44, cy - 30, 22, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 64, cy - 34); ctx.lineTo(cx + 90, cy - 28); ctx.lineTo(cx + 64, cy - 22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 50, cy - 34, 3.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 6, cy - 8); ctx.quadraticCurveTo(cx - 40, cy - 60, cx - 70, cy - 30); ctx.quadraticCurveTo(cx - 40, cy - 18, cx - 6, cy - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 48, cy + 16); ctx.lineTo(cx - 96, cy + 40); ctx.lineTo(cx - 50, cy + 34); ctx.stroke();
    pen(ctx, 5); ctx.beginPath(); ctx.moveTo(cx + 8, cy + 38); ctx.lineTo(cx + 8, cy + 66); ctx.moveTo(cx + 26, cy + 38); ctx.lineTo(cx + 26, cy + 66); ctx.stroke();
  }
  function cage(ctx) {
    paper(ctx); pen(ctx, 6); var cx = 180;
    ctx.beginPath(); ctx.moveTo(cx, 60); ctx.lineTo(cx, 44); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, 42, 10, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 96, 96); ctx.quadraticCurveTo(cx, 58, cx + 96, 96); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, 96, 96, 16, 0, 0, Math.PI); ctx.stroke();
    for (var i = -4; i <= 4; i++) {
      var x = cx + i * 24, yTop = 96 + 16 * Math.sqrt(Math.max(0, 1 - Math.pow(i * 24 / 96, 2)));
      ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, 300); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(cx, 300, 96, 16, 0, 0, 7); ctx.stroke();
    pen(ctx, 8); ctx.beginPath(); ctx.ellipse(cx, 314, 104, 15, 0, 0, 7); ctx.stroke();
  }
  function fish(ctx) {
    paper(ctx); pen(ctx, 7); var cx = 180, cy = 185;
    ctx.beginPath(); ctx.moveTo(cx - 70, cy); ctx.quadraticCurveTo(cx - 10, cy - 46, cx + 64, cy);
    ctx.quadraticCurveTo(cx - 10, cy + 46, cx - 70, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 64, cy); ctx.lineTo(cx + 96, cy - 30); ctx.lineTo(cx + 96, cy + 30); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4, cy - 30); ctx.quadraticCurveTo(cx + 8, cy - 52, cx + 24, cy - 34); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 44, cy - 8, 4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 14, cy + 14, 10, 0.1, 1.9); ctx.stroke();
  }
  function bowl(ctx) {
    paper(ctx); pen(ctx, 6); var cx = 180;
    ctx.beginPath(); ctx.moveTo(cx - 104, 120); ctx.bezierCurveTo(cx - 104, 270, cx + 104, 270, cx + 104, 120); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, 120, 104, 26, 0, 0, 7); ctx.stroke();
    pen(ctx, 3.5); ctx.strokeStyle = 'rgba(43,42,36,.55)';
    ctx.beginPath(); ctx.ellipse(cx, 150, 86, 18, 0, 0, Math.PI); ctx.stroke();
    for (var i = 0; i < 5; i++) { var x = cx - 60 + i * 30, y = 200 + ((i % 2) * 18); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.stroke(); }
  }
  function rider(ctx) {
    paper(ctx); pen(ctx, 7); var cx = 180, cy = 150;
    ctx.beginPath(); ctx.arc(cx, cy - 30, 18, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + 40, cy - 6); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx - 34, cy + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + 44); ctx.lineTo(cx + 30, cy + 92); ctx.moveTo(cx, cy + 44); ctx.lineTo(cx - 26, cy + 94); ctx.stroke();
    pen(ctx, 3); ctx.beginPath(); ctx.moveTo(cx - 40, cy - 42); ctx.quadraticCurveTo(cx, cy - 58, cx + 40, cy - 42); ctx.stroke();
  }
  function horse(ctx) {
    paper(ctx); pen(ctx, 7); var cx = 180, cy = 230;
    ctx.beginPath(); ctx.ellipse(cx, cy, 74, 34, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 56, cy - 22); ctx.quadraticCurveTo(cx + 112, cy - 58, cx + 104, cy - 96);
    ctx.lineTo(cx + 92, cy - 96); ctx.quadraticCurveTo(cx + 78, cy - 40, cx + 44, cy - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 104, cy - 96); ctx.lineTo(cx + 96, cy - 108); ctx.moveTo(cx + 96, cy - 96); ctx.lineTo(cx + 88, cy - 108); ctx.stroke();
    pen(ctx, 6); [-44, -18, 40, 66].forEach(function (dx, i) { ctx.beginPath(); ctx.moveTo(cx + dx, cy + 22); ctx.lineTo(cx + dx + (i < 2 ? -6 : 6), cy + 96); ctx.stroke(); });
    pen(ctx, 4); ctx.beginPath(); ctx.moveTo(cx - 70, cy - 6); ctx.quadraticCurveTo(cx - 104, cy + 30, cx - 92, cy + 78); ctx.stroke();
  }

  /* Forged engravings, when present, override the placeholders. The art foundry
     installs each as thaumatrope/art/<key>.js registering window.ThaumArt.<key> =
     { a, b } (a pair) or window.ThaumArt.paper = fn (the parchment); the wiring
     builder forge:includes those BEFORE this file. Absent → the placeholders below. */
  var F = (root.ThaumArt) || {};
  var built = {
    birdcage:   { label: 'bird / cage',   a: bird,  b: cage },
    fishbowl:   { label: 'fish / bowl',   a: fish,  b: bowl },
    riderhorse: { label: 'rider / horse', a: rider, b: horse },
  };
  for (var key in built) {
    if (F[key] && F[key].a) built[key].a = F[key].a;
    if (F[key] && F[key].b) built[key].b = F[key].b;
  }
  root.ThaumFaces = {
    FS: FS, PAPER: PAPER, INK: INK,
    paper: (F.paper || paper),
    pairs: built,
  };
})(typeof window !== 'undefined' ? window : globalThis);
