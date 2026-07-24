/* ═══════════════════════════════════════════════════════════════════════════
   THE HEXAFLEXAGON — FACE ART  (window.HexaFaces)

   Three faces for the creased-paper trihexaflexagon. Each face is authored as
   ONE hexagon-CENTRED scene painted into an S×S offscreen canvas; the page's
   fold engine SLICES it across the six leaf triangles (source triangle
   [C, corner_i, corner_i+1]) and affine-maps each onto its folded screen
   triangle. So the art must be a single centred composition — its motif reads
   whole at rest and re-reads whole after a flex, and the impossible face's motif
   sits DEAD-CENTRE so the on-ramp centre-sliver teases exactly it.

   THE TRIAD (the wonder):
     day     — a walled garden under a gold sun. The face you start on.
     night   — the SAME garden, crescent moon + stars. Reads instantly as Day's
               obvious pair, so the eye closes the set at TWO.
     eclipse — a corona ring with the black moon across it on deep sky. Neither
               day nor night; the rare hidden alignment the third flex surfaces.

   API (the contract the art foundry's forged modules must satisfy):
     HexaFaces.S                     → scene canvas edge (px)
     HexaFaces.R                     → hexagon corner radius in scene space
     HexaFaces.PAPER / INK / GOLD …  → the kin palette tokens
     HexaFaces.paper(ctx)            → lay the parchment (or night) ground S×S
     HexaFaces.scenes = {
        day:     draw(ctx),          // paints one S×S hexagon-centred scene
        night:   draw(ctx),
        eclipse: draw(ctx),
     }
   Each draw(ctx) owns the WHOLE hexagon-centred composition (it lays its own
   ground first). Coordinate space is the raw S×S canvas, origin top-left,
   centre C=(S/2,S/2), hexagon corners at radius R, corner 0 at TOP (angle −90°),
   stepping +60°. The page owns the fold physics, the state machine, the reveal
   beat and the centre-sliver hint; this module owns only the marks.

   FORGED OVERRIDES: the art foundry installs hexaflexagon/art/<key>.js files
   that register window.HexaArt.<key> (day|night|eclipse|paper) = draw(ctx); the
   wiring builder forge:includes them BEFORE this file, and the merge below
   prefers them over these placeholders. ── placeholder art; the foundry enriches.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  var S = 900;
  var C = S / 2;
  var R = S * 0.47;                 // hexagon corner radius (matches the engine's src sampling)

  var PAPER = '#f3ecd6', PAPER_HI = '#fbf5e4', INK = '#2b2a24';
  var GOLD = '#f4d27a', GOLD_DEEP = '#c9a24a';
  var NIGHT = '#171a2e', NIGHT_HI = '#26305a', SANGUINE = '#8a4a2a';
  var WALL = '#c8b98f', WALL_SH = '#a7966a', LEAF = '#6f8f5a';

  /* corner i position (scene space) */
  function corner(i, rad) {
    var a = (-90 + 60 * i) * Math.PI / 180;
    return [C + (rad == null ? R : rad) * Math.cos(a), C + (rad == null ? R : rad) * Math.sin(a)];
  }
  /* clip the drawing to the hexagon so ink never bleeds past the sampled wedge */
  function hexPath(ctx, rad) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) { var p = corner(i, rad); if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  /* baked warm grain — a light anisotropic laid mottle so a face reads as a
     physical leaf even before the foundry's richer parchment lands. Deterministic. */
  function grain(ctx, tint, amt) {
    var img = ctx.getImageData(0, 0, S, S), d = img.data, seed = 1337;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var y = 0; y < S; y++) {
      var laid = Math.sin(y * 0.9) * 3;           // faint horizontal laid lines
      for (var x = 0; x < S; x++) {
        var i = (y * S + x) * 4;
        if (d[i + 3] === 0) continue;
        var n = (rnd() - 0.5) * amt + laid;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function paper(ctx) {
    ctx.save();
    hexPath(ctx); ctx.clip();
    var g = ctx.createRadialGradient(C, C * 0.86, R * 0.1, C, C, R * 1.25);
    g.addColorStop(0, PAPER_HI); g.addColorStop(1, '#e7ddc2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    grain(ctx, PAPER, 16);
    ctx.restore();
  }

  /* ── shared: the low garden wall that makes DAY and NIGHT read as one place ── */
  function gardenWall(ctx, dusk) {
    ctx.save();
    hexPath(ctx); ctx.clip();
    var horizon = C + R * 0.30;
    // ground
    ctx.fillStyle = dusk ? '#20304a' : '#e5dcbe';
    ctx.fillRect(0, horizon, S, S);
    // the wall — a run of merlons across the mid-lower scene
    var wy = horizon - R * 0.16, wh = R * 0.42;
    ctx.fillStyle = dusk ? WALL_SH : WALL;
    ctx.fillRect(C - R * 0.92, wy, R * 1.84, wh);
    ctx.fillStyle = dusk ? '#8f8055' : PAPER_HI;
    for (var mx = -0.86; mx < 0.86; mx += 0.24) {
      ctx.fillRect(C + R * mx, wy - R * 0.07, R * 0.12, R * 0.09);   // merlons
    }
    // an arched gate dead-ish centre, low — leaves the centre free for the motif above
    ctx.fillStyle = dusk ? '#0e1526' : '#7a6a44';
    ctx.beginPath();
    ctx.moveTo(C - R * 0.14, wy + wh);
    ctx.lineTo(C - R * 0.14, wy + wh * 0.42);
    ctx.arc(C, wy + wh * 0.42, R * 0.14, Math.PI, 0);
    ctx.lineTo(C + R * 0.14, wy + wh);
    ctx.closePath(); ctx.fill();
    // two little topiary
    ctx.fillStyle = dusk ? '#2c4032' : LEAF;
    [-0.66, 0.66].forEach(function (tx) {
      ctx.beginPath(); ctx.arc(C + R * tx, wy - R * 0.02, R * 0.11, 0, 7); ctx.fill();
      ctx.fillStyle = dusk ? '#26351f' : '#5a7a48';
      ctx.fillRect(C + R * tx - R * 0.02, wy - R * 0.02, R * 0.04, R * 0.16);
      ctx.fillStyle = dusk ? '#2c4032' : LEAF;
    });
    ctx.restore();
  }

  function day(ctx) {
    ctx.save();
    hexPath(ctx); ctx.clip();
    var sky = ctx.createLinearGradient(0, 0, 0, S);
    sky.addColorStop(0, '#f6e6b6'); sky.addColorStop(0.55, '#f3ecd6'); sky.addColorStop(1, '#efe6c8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, S, S);
    // sun — high and to one side, so the DEAD-CENTRE stays garden-sky (the eclipse owns the centre)
    var sx = C + R * 0.34, sy = C - R * 0.44;
    var sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, R * 0.34);
    sg.addColorStop(0, '#fff4cf'); sg.addColorStop(0.5, GOLD); sg.addColorStop(1, 'rgba(244,210,122,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, R * 0.34, 0, 7); ctx.fill();
    ctx.fillStyle = GOLD_DEEP; ctx.beginPath(); ctx.arc(sx, sy, R * 0.14, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(201,162,74,.6)'; ctx.lineWidth = 3;
    for (var r = 0; r < 12; r++) { var a = r / 12 * Math.PI * 2; ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * R * 0.19, sy + Math.sin(a) * R * 0.19);
      ctx.lineTo(sx + Math.cos(a) * R * 0.25, sy + Math.sin(a) * R * 0.25); ctx.stroke(); }
    ctx.restore();
    gardenWall(ctx, false);
    ctx.save(); hexPath(ctx); ctx.clip(); grain(ctx, PAPER, 12); ctx.restore();
    frameHex(ctx, 'rgba(120,96,52,.5)');
  }

  function night(ctx) {
    ctx.save();
    hexPath(ctx); ctx.clip();
    var sky = ctx.createLinearGradient(0, 0, 0, S);
    sky.addColorStop(0, '#0e1226'); sky.addColorStop(0.6, NIGHT); sky.addColorStop(1, '#20263f');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, S, S);
    // stars
    var seed = 91; function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    ctx.fillStyle = '#e9ecff';
    for (var i = 0; i < 46; i++) { var x = rnd() * S, y = rnd() * (C + R * 0.1), s = rnd() * 2.2 + 0.5;
      ctx.globalAlpha = 0.4 + rnd() * 0.6; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // crescent moon — mirrors the sun's position so night reads as day's twin
    var mx = C + R * 0.34, my = C - R * 0.44;
    ctx.fillStyle = '#eef0ff'; ctx.beginPath(); ctx.arc(mx, my, R * 0.17, 0, 7); ctx.fill();
    ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(mx + R * 0.07, my - R * 0.03, R * 0.16, 0, 7); ctx.fill();
    ctx.restore();
    gardenWall(ctx, true);
    ctx.save(); hexPath(ctx); ctx.clip(); grain(ctx, NIGHT, 12); ctx.restore();
    frameHex(ctx, 'rgba(160,175,230,.28)');
  }

  function eclipse(ctx) {
    ctx.save();
    hexPath(ctx); ctx.clip();
    var sky = ctx.createRadialGradient(C, C, R * 0.1, C, C, R * 1.2);
    sky.addColorStop(0, '#241a33'); sky.addColorStop(0.5, '#0c0a18'); sky.addColorStop(1, '#05040c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, S, S);
    // faint stars, dimmed by the corona light
    var seed = 7; function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    ctx.fillStyle = '#cfd2ee';
    for (var i = 0; i < 30; i++) { var x = rnd() * S, y = rnd() * S, d = Math.hypot(x - C, y - C);
      if (d < R * 0.42) continue; ctx.globalAlpha = 0.25 + rnd() * 0.4; ctx.beginPath(); ctx.arc(x, y, rnd() * 1.6 + 0.4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // THE CORONA — dead centre: the impossible face's motif, teased by the sliver
    var cor = ctx.createRadialGradient(C, C, R * 0.18, C, C, R * 0.5);
    cor.addColorStop(0, 'rgba(244,210,122,0)');
    cor.addColorStop(0.42, 'rgba(255,241,196,.95)');
    cor.addColorStop(0.5, 'rgba(244,210,122,.85)');
    cor.addColorStop(0.72, 'rgba(201,162,74,.30)');
    cor.addColorStop(1, 'rgba(201,162,74,0)');
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(C, C, R * 0.5, 0, 7); ctx.fill();
    // ragged corona streamers
    ctx.strokeStyle = 'rgba(255,240,190,.5)'; ctx.lineWidth = 2.4;
    for (var s = 0; s < 24; s++) { var a = s / 24 * Math.PI * 2, len = R * (0.24 + (s % 3) * 0.05);
      ctx.beginPath(); ctx.moveTo(C + Math.cos(a) * R * 0.2, C + Math.sin(a) * R * 0.2);
      ctx.lineTo(C + Math.cos(a) * (R * 0.2 + len), C + Math.sin(a) * (R * 0.2 + len)); ctx.stroke(); }
    // the black moon across it
    ctx.fillStyle = '#05040a'; ctx.beginPath(); ctx.arc(C, C, R * 0.2, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,244,205,.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(C, C, R * 0.2, 0, 7); ctx.stroke();
    ctx.restore();
    frameHex(ctx, 'rgba(201,162,74,.45)');
  }

  function frameHex(ctx, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; hexPath(ctx); ctx.stroke(); ctx.restore();
  }

  /* ── merge forged overrides over the placeholders ── */
  var F = root.HexaArt || {};
  var scenes = { day: day, night: night, eclipse: eclipse };
  for (var k in scenes) { if (typeof F[k] === 'function') scenes[k] = F[k]; }

  root.HexaFaces = {
    S: S, R: R, C: C,
    PAPER: PAPER, PAPER_HI: PAPER_HI, INK: INK, GOLD: GOLD, GOLD_DEEP: GOLD_DEEP,
    NIGHT: NIGHT, SANGUINE: SANGUINE,
    paper: (typeof F.paper === 'function' ? F.paper : paper),
    corner: corner,
    scenes: scenes,
  };
})(typeof window !== 'undefined' ? window : globalThis);
