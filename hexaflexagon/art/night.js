/* ═══════════════════════════════════════════════════════════════════════════
   HEXAFLEXAGON — FACE ART · NIGHT  (foundry FINAL — synth of takes 1 + 2)
   "Night — the same walled garden as Day, after dark."

   BASE: foundry take #1 (Judge 1's pick — the richer, more alive nocturne with
   the warm-heartbeat lantern + estate ink-and-wash hand). Grafted per BOTH
   judges:
     • REGISTRATION FIX (both judges, spec-mandated): the moon now rides the
       EXACT off-centre seat the DAY sun holds in art/day.js — upper-LEFT at
       (C−R*0.42, C−R*0.52). Both takes had wrongly MIRRORED it to upper-right
       (inheriting the faces.js placeholder's misleading "mirror" comment); the
       spec calls for the SAME position so day/night read as a matched pair. The
       whole scene is now lit UNIFORMLY from the upper-left, exactly like Day
       (lit faces up-left, shadows down-right).
     • take #2 grafts: a crisper CARVED crescent (earthshine + clean shadow-disc
       subtraction + maria on the lit limb); COOLER ground/horizon discipline so
       it reads decisively as night, not dusk (warm horizon dialled to a faint
       ember; lantern spill CONTAINED so it no longer floods); a cool moonlit
       PATH REFLECTION pooling directly under the gate mouth.
     • star density evened; topiary kept clearly GREEN (not cooled to grey);
       trees re-registered to Day's arrangement — tall CYPRESS at ±0.60/0.62 and
       round TOPIARY at ±0.30 — so the silhouette echoes Day, not just the
       position. Dead-centre stays quiet sky for the buried eclipse's corona
       sliver. The warm gate lantern is KEPT as the hero accent (Judge 1's
       "winning move"), only contained.

   API — a single global installer used by BOTH the preview harness and the
   shipped build (see hexaflexagon/art-specs/face-night.md):
       window.installHexaArt(A) → A.setScene('night', drawNight); returns 'night'
       window.HexaArt.night = drawNight
   drawNight(ctx): paints one HexaFaces.S × HexaFaces.S hexagon-centred scene into
   an S×S canvas-2D context. Deterministic (fixed noise seed). Painted once per
   mount into an offscreen bitmap, so a few ms of craft is fine. STATIC (motion
   belongs to the fold, not the leaf).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var HF = (typeof window !== 'undefined' ? window : globalThis).HexaFaces;
  var S = HF ? HF.S : 900;
  var C = HF ? HF.C : S / 2;
  var R = HF ? HF.R : S * 0.47;

  // ── night key (cool ink-and-wash on cool paper; topiary kept GREEN) ──────
  var SKY_TOP = '#0a0e20', SKY_MID = '#141833', SKY_LOW = '#232a48';
  var MOONLIGHT = '#eef0ff', MOON_CORE = '#f7f8ff';
  var STONE = '#5f6552', STONE_LIT = '#b9c0a2', STONE_SH = '#2e3226';
  var TOPIARY = '#2b402f', TOPIARY_RIM = '#9cc093', TOPIARY_SH = '#182619';
  var GATE_VOID = '#0b1122', LANTERN = '#ffd486';
  var INK = '#0c1020';

  function corner(i, rad) {
    var a = (-90 + 60 * i) * Math.PI / 180;
    return [C + rad * Math.cos(a), C + rad * Math.sin(a)];
  }
  function hexPath(ctx, rad) {
    rad = rad == null ? R : rad;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) { var p = corner(i, rad); if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
    ctx.closePath();
  }

  // deterministic PRNG
  function mkRnd(seed) {
    return function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  }

  /* An inked, hand-drawn stroke: a poly-line with faint deterministic jitter,
     drawn round-capped so it reads as a confident brush line. */
  function inkedPath(ctx, pts, w, col, jit, rnd) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var jx = jit ? (rnd() - 0.5) * jit : 0, jy = jit ? (rnd() - 0.5) * jit : 0;
      if (i === 0) ctx.moveTo(pts[i][0] + jx, pts[i][1] + jy);
      else ctx.lineTo(pts[i][0] + jx, pts[i][1] + jy);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* One round topiary (Day's inner ±0.30 trees): an ink-washed dome catching a
     cool moon rim on its upper-LEFT (moon side), shadow pooling lower-right, on a
     slim trunk. Kept deep GREEN, not cooled to grey. */
  function topiary(ctx, cx, ballY, rad, rnd) {
    // trunk (drawn behind; occluded by the wall painted after)
    ctx.save();
    ctx.fillStyle = STONE_SH;
    ctx.beginPath();
    ctx.moveTo(cx - rad * 0.16, ballY);
    ctx.lineTo(cx - rad * 0.10, ballY + rad * 1.6);
    ctx.lineTo(cx + rad * 0.10, ballY + rad * 1.6);
    ctx.lineTo(cx + rad * 0.16, ballY);
    ctx.closePath(); ctx.fill();
    // body — a wobbly deterministic dome
    var N = 26, ring = [];
    for (var i = 0; i <= N; i++) {
      var a = i / N * Math.PI * 2;
      var wob = 1 + (Math.sin(a * 3 + cx) * 0.06 + (rnd() - 0.5) * 0.07);
      ring.push([cx + Math.cos(a) * rad * wob, ballY + Math.sin(a) * rad * wob]);
    }
    ctx.beginPath();
    for (var j = 0; j < ring.length; j++) { if (j === 0) ctx.moveTo(ring[j][0], ring[j][1]); else ctx.lineTo(ring[j][0], ring[j][1]); }
    ctx.closePath();
    // wash body — highlight from the upper-LEFT (the moon)
    var bg = ctx.createRadialGradient(cx - rad * 0.35, ballY - rad * 0.4, rad * 0.1, cx, ballY, rad * 1.15);
    bg.addColorStop(0, TOPIARY_RIM); bg.addColorStop(0.35, TOPIARY); bg.addColorStop(1, TOPIARY_SH);
    ctx.fillStyle = bg; ctx.fill();
    // ink outline
    ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.stroke();
    // a couple of interior leaf ticks (texture)
    ctx.strokeStyle = 'rgba(127,160,122,0.5)'; ctx.lineWidth = 1.3;
    for (var t = 0; t < 5; t++) {
      var ta = -1.2 + rnd() * 1.1, rr = rad * (0.3 + rnd() * 0.5);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ta) * rr, ballY + Math.sin(ta) * rr);
      ctx.lineTo(cx + Math.cos(ta) * rr - 5, ballY + Math.sin(ta) * rr - 6);
      ctx.stroke();
    }
    ctx.restore();
    // crisp moonlit rim on the upper-LEFT crown
    ctx.strokeStyle = 'rgba(156,192,147,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, ballY, rad * 0.98, Math.PI, Math.PI * 1.5); ctx.stroke();
  }

  /* One tall cypress (Day's outer ±0.60/0.62 trees): a crisp inked teardrop
     silhouette, lit rib down its upper-LEFT (moon side), shadow to the lower
     right — echoing Day's dominant tree form so the garden reads as one place. */
  function cypress(ctx, cx, baseY, h, wdt, rnd) {
    // teardrop silhouette
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.quadraticCurveTo(cx + wdt, baseY - h * 0.45, cx + wdt * 0.35, baseY);
    ctx.quadraticCurveTo(cx, baseY + h * 0.03, cx - wdt * 0.35, baseY);
    ctx.quadraticCurveTo(cx - wdt, baseY - h * 0.45, cx, baseY - h);
    ctx.closePath();
    var cg = ctx.createLinearGradient(cx - wdt, baseY - h, cx + wdt, baseY);
    cg.addColorStop(0, TOPIARY_RIM); cg.addColorStop(0.42, TOPIARY); cg.addColorStop(1, TOPIARY_SH);
    ctx.fillStyle = cg; ctx.fill();
    // inked drawn edge
    var out = [
      [cx, baseY - h],
      [cx + wdt * 0.7, baseY - h * 0.5],
      [cx + wdt * 0.35, baseY],
      [cx - wdt * 0.35, baseY],
      [cx - wdt * 0.7, baseY - h * 0.5],
      [cx, baseY - h]
    ];
    inkedPath(ctx, out, 2.0, INK, 1.5, rnd);
    // moonlit lit rib down the upper-left flank + a faint central spine
    inkedPath(ctx, [[cx - wdt * 0.32, baseY - h * 0.82], [cx - wdt * 0.24, baseY - h * 0.2]], 2.0, 'rgba(156,192,147,0.5)', 1, rnd);
    inkedPath(ctx, [[cx, baseY - h * 0.9], [cx, baseY - h * 0.1]], 1.4, 'rgba(12,16,32,0.35)', 1, rnd);
  }

  function drawNight(ctx) {
    var rnd = mkRnd(20260723);

    ctx.save();
    hexPath(ctx); ctx.clip();

    // ── night sky ──────────────────────────────────────────────────────
    var sky = ctx.createLinearGradient(0, 0, 0, S);
    sky.addColorStop(0, SKY_TOP); sky.addColorStop(0.55, SKY_MID); sky.addColorStop(1, SKY_LOW);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, S, S);

    var horizon = C + R * 0.30;

    // a faint COOL-warm ember lingering at the horizon (day's ghost — dialled
    // right back so the leaf reads as night, not dusk)
    var warm = ctx.createLinearGradient(0, horizon - R * 0.34, 0, horizon + R * 0.02);
    warm.addColorStop(0, 'rgba(150,122,74,0)');
    warm.addColorStop(1, 'rgba(150,122,74,0.09)');
    ctx.fillStyle = warm; ctx.fillRect(0, horizon - R * 0.34, S, R * 0.36);

    // ── moon glow (registered to DAY's sun seat: upper-LEFT) ───────────
    var mx = C - R * 0.42, my = C - R * 0.52, mr = R * 0.16;
    var halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4.2);
    halo.addColorStop(0, 'rgba(238,240,255,0.42)');
    halo.addColorStop(0.35, 'rgba(200,210,255,0.12)');
    halo.addColorStop(1, 'rgba(200,210,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, mr * 4.2, 0, 7); ctx.fill();

    // ── stars (sky only; thin inside the moon glow & near dead-centre) ──
    for (var i = 0; i < 92; i++) {
      var x = rnd() * S, y = rnd() * (horizon - 10);
      var dc = Math.hypot(x - C, y - C);
      var dm = Math.hypot(x - mx, y - my);
      if (dm < mr * 3.2) continue;                 // no stars inside the moon glow
      if (dc < R * 0.14 && rnd() < 0.72) continue;  // keep dead-centre quiet
      var sz = rnd(); var srad = sz * sz * 2.4 + 0.5;
      ctx.globalAlpha = 0.35 + rnd() * 0.55;
      ctx.fillStyle = rnd() < 0.15 ? '#dfe6ff' : MOONLIGHT;
      ctx.beginPath(); ctx.arc(x, y, srad, 0, 7); ctx.fill();
      // a 4-point glint on the brightest few
      if (srad > 2.1) {
        ctx.globalAlpha *= 0.7; ctx.strokeStyle = MOONLIGHT; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - srad * 2.4, y); ctx.lineTo(x + srad * 2.4, y);
        ctx.moveTo(x, y - srad * 2.4); ctx.lineTo(x, y + srad * 2.4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // ── the carved crescent (crisper graft from take 2) ─────────────────
    // lit limb opens DOWN-RIGHT, into the garden it lights.
    // 1) earthshine: a faint whole-disc fill so the dark limb is just seen
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.clip();
    var earth = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr);
    earth.addColorStop(0, 'rgba(70,80,130,0.5)'); earth.addColorStop(1, 'rgba(44,54,100,0.32)');
    ctx.fillStyle = earth; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    ctx.restore();
    // 2) lit crescent = moon disc MINUS a shadow disc offset UP-LEFT
    var shX = mx - mr * 0.40, shY = my - mr * 0.30, shR = mr * 0.98;
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.clip();            // inside the disc
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, 7);
    ctx.arc(shX, shY, shR, 0, 7);
    ctx.clip('evenodd');                                              // ⇒ the crescent
    var md = ctx.createRadialGradient(mx + mr * 0.25, my + mr * 0.25, mr * 0.1, mx, my, mr);
    md.addColorStop(0, MOON_CORE); md.addColorStop(0.7, MOONLIGHT); md.addColorStop(1, '#cdd2f0');
    ctx.fillStyle = md; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    // faint maria dappling the lit limb (down-right)
    ctx.fillStyle = 'rgba(150,160,205,0.26)';
    [[0.34, 0.20, 0.16], [0.10, 0.46, 0.10], [0.5, -0.02, 0.08]].forEach(function (c) {
      ctx.beginPath(); ctx.arc(mx + mr * c[0], my + mr * c[1], mr * c[2], 0, 7); ctx.fill();
    });
    ctx.restore();
    // 3) crisp cool hairline round the whole disc
    ctx.strokeStyle = 'rgba(150,165,230,0.28)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(mx, my, mr * 0.99, 0, 7); ctx.stroke();

    // ── ground (cool moonlit lawn) ──────────────────────────────────────
    var gnd = ctx.createLinearGradient(0, horizon, 0, S);
    gnd.addColorStop(0, '#1a2136'); gnd.addColorStop(1, '#0e1426');
    ctx.fillStyle = gnd; ctx.fillRect(0, horizon, S, S - horizon);

    // a moon-silvered path curving to the gate (cool)
    ctx.save();
    var pg = ctx.createLinearGradient(0, horizon, 0, S);
    pg.addColorStop(0, 'rgba(190,200,235,0.20)'); pg.addColorStop(1, 'rgba(150,165,210,0.05)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(C - R * 0.05, horizon + R * 0.02);
    ctx.lineTo(C + R * 0.05, horizon + R * 0.02);
    ctx.lineTo(C + R * 0.34, S);
    ctx.lineTo(C - R * 0.34, S);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // ── trees BEHIND the wall (Day's arrangement: cypress ±0.60/0.62, topiary
    //    ±0.30). Painted before the wall so the crest occludes their bases. ──
    var wy = horizon - R * 0.16, wh = R * 0.42;
    cypress(ctx, C - R * 0.60, wy + R * 0.02, R * 0.37, R * 0.072, rnd);
    cypress(ctx, C + R * 0.62, wy + R * 0.02, R * 0.32, R * 0.064, rnd);
    topiary(ctx, C - R * 0.30, wy - R * 0.05, R * 0.095, rnd);
    topiary(ctx, C + R * 0.30, wy - R * 0.05, R * 0.095, rnd);

    // ── the wall + merlons ─────────────────────────────────────────────
    var wx0 = C - R * 0.92, ww = R * 1.84;
    // body wash (cool stone, lit along the top by the moon)
    var wg = ctx.createLinearGradient(0, wy, 0, wy + wh);
    wg.addColorStop(0, '#767c62'); wg.addColorStop(0.14, STONE); wg.addColorStop(1, STONE_SH);
    ctx.fillStyle = wg; ctx.fillRect(wx0, wy, ww, wh);
    // moon-lit cap line along the wall top
    ctx.fillStyle = STONE_LIT; ctx.globalAlpha = 0.8;
    ctx.fillRect(wx0, wy, ww, R * 0.012);
    ctx.globalAlpha = 1;
    // faint coursing (horizontal stone joints)
    ctx.strokeStyle = 'rgba(20,24,20,0.35)'; ctx.lineWidth = 1;
    for (var cy = wy + wh * 0.32; cy < wy + wh; cy += wh * 0.26) {
      inkedPath(ctx, [[wx0 + 4, cy], [wx0 + ww * 0.5, cy + 2], [wx0 + ww - 4, cy]], 1, 'rgba(20,24,20,0.30)', 3, rnd);
    }
    // merlons — each lit on its moon-facing (LEFT) top edge, shadowed down-right
    for (var mxi = -0.86; mxi < 0.86; mxi += 0.24) {
      var bx = C + R * mxi, byT = wy - R * 0.07, bw = R * 0.12, bh = R * 0.09;
      ctx.fillStyle = STONE; ctx.fillRect(bx, byT, bw, bh);
      ctx.fillStyle = 'rgba(20,22,40,0.42)'; ctx.fillRect(bx + bw - R * 0.02, byT, R * 0.02, bh); // right shadow face
      ctx.fillStyle = STONE_LIT; ctx.globalAlpha = 0.85;
      ctx.fillRect(bx, byT, bw, R * 0.012);                 // lit top
      ctx.fillRect(bx, byT, R * 0.012, bh);                 // lit LEFT edge (moon side)
      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(bx, byT, bw, bh);
    }
    // wall sides ink
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(wx0, wy); ctx.lineTo(wx0, wy + wh); ctx.moveTo(wx0 + ww, wy); ctx.lineTo(wx0 + ww, wy + wh); ctx.stroke();

    // ── arched gate (centred), with a warm lantern breathing inside ────
    var gx = C, gTop = wy + wh * 0.42, gr = R * 0.14, gBot = wy + wh;
    // the dark opening
    ctx.fillStyle = GATE_VOID;
    ctx.beginPath();
    ctx.moveTo(gx - gr, gBot); ctx.lineTo(gx - gr, gTop);
    ctx.arc(gx, gTop, gr, Math.PI, 0); ctx.lineTo(gx + gr, gBot); ctx.closePath();
    ctx.fill();
    // lantern glow low in the arch — the hero warm accent, CONTAINED so it
    // pools in the gate mouth and never floods the cool scene
    var lx = gx, ly = gBot - gr * 0.7;
    var lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, gr * 1.15);
    lg.addColorStop(0, 'rgba(255,214,140,0.82)'); lg.addColorStop(0.42, 'rgba(255,196,110,0.30)'); lg.addColorStop(1, 'rgba(255,196,110,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, gr * 1.15, 0, 7); ctx.fill();
    ctx.fillStyle = LANTERN; ctx.beginPath(); ctx.arc(lx, ly, gr * 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff0cf'; ctx.beginPath(); ctx.arc(lx, ly - gr * 0.03, gr * 0.07, 0, 7); ctx.fill();
    // gate ink arch
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(gx - gr, gBot); ctx.lineTo(gx - gr, gTop);
    ctx.arc(gx, gTop, gr, Math.PI, 0); ctx.lineTo(gx + gr, gBot);
    ctx.stroke();
    // moon-lit rim hugging the arch's upper-LEFT (the moon-facing edge)
    ctx.strokeStyle = 'rgba(185,192,162,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(gx, gTop, gr, Math.PI * 1.02, Math.PI * 1.48); ctx.stroke();
    // and a short lit line down the LEFT jamb
    ctx.beginPath(); ctx.moveTo(gx - gr, gTop); ctx.lineTo(gx - gr, gTop + wh * 0.34); ctx.stroke();

    // ── cool moonlit reflection pooling under the gate mouth (graft: take 2) ─
    var refG = ctx.createLinearGradient(0, gBot, 0, gBot + wh * 0.72);
    refG.addColorStop(0, 'rgba(200,208,240,0.22)');
    refG.addColorStop(1, 'rgba(200,208,240,0)');
    ctx.fillStyle = refG;
    ctx.beginPath();
    ctx.moveTo(gx - gr * 0.7, gBot);
    ctx.lineTo(gx + gr * 0.7, gBot);
    ctx.lineTo(gx + gr * 1.1, gBot + wh * 0.72);
    ctx.lineTo(gx - gr * 1.1, gBot + wh * 0.72);
    ctx.closePath(); ctx.fill();
    // a small contained warm echo of the lantern on the wet sill stone
    var lref = ctx.createRadialGradient(gx, gBot + wh * 0.10, 1, gx, gBot + wh * 0.10, gr * 0.8);
    lref.addColorStop(0, 'rgba(255,205,130,0.16)'); lref.addColorStop(1, 'rgba(255,205,130,0)');
    ctx.fillStyle = lref; ctx.beginPath(); ctx.arc(gx, gBot + wh * 0.10, gr * 0.8, 0, 7); ctx.fill();

    ctx.restore();

    // ── laid-fibre parchment grain (anisotropic, cool, subtle) ─────────
    grain(ctx);

    // ── hex frame ──────────────────────────────────────────────────────
    ctx.save(); ctx.strokeStyle = 'rgba(160,175,230,0.30)'; ctx.lineWidth = 4;
    hexPath(ctx); ctx.stroke(); ctx.restore();
  }

  /* per-pixel laid-fibre mottle — horizontal laid lines dominate (anisotropic),
     very low amplitude, cooled toward blue so the paper reads physical at night. */
  function grain(ctx) {
    ctx.save(); hexPath(ctx); ctx.clip();
    var img = ctx.getImageData(0, 0, S, S), d = img.data, rnd = mkRnd(4711);
    for (var y = 0; y < S; y++) {
      var laid = Math.sin(y * 0.85) * 2.2 + Math.sin(y * 0.21) * 1.4;  // laid fibres
      for (var x = 0; x < S; x++) {
        var i = (y * S + x) * 4;
        if (d[i + 3] === 0) continue;
        var n = (rnd() - 0.5) * 9 + laid;
        d[i]     = clamp(d[i]     + n * 0.85);   // slightly less on red → cool
        d[i + 1] = clamp(d[i + 1] + n * 0.95);
        d[i + 2] = clamp(d[i + 2] + n);
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.restore();
  }
  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  // ── API contract ─────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.installHexaArt = function (A) {
      A.setScene('night', drawNight);
      return 'night';
    };
    (window.HexaArt = window.HexaArt || {}).night = drawNight;
  }
})();
