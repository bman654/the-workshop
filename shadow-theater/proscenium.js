/* ============================================================================
   proscenium.js — the SILK SCREEN, the ARCH, and the LAMP BLOOM.  [in-house]

   DIRECTION — a lamp-lit silk stage in a carved walnut proscenium. The silk is a
   warm amber weave (never a flat fill — a deterministic mulberry grain), brightest
   where the lamp's light falls and dimming to a soft vignette at the edges. The
   frame is a carved walnut arch. The lamp's BLOOM is a separate per-frame draw so
   it tracks the dolly (as the lamp comes in, the bloom widens + brightens).

   This module owns ONLY the backdrop; the shadow (the acc buffer) is multiplied on
   TOP of drawScreen by the engine's compositor. Forged in-house per the direction in
   art-specs/proscenium.md: a warm mulberry-grain weave, a carved walnut arch whose
   spandrels sink into soft shadow, and a lamp bloom that widens as the lamp dollies in.

   THE CONTRACT (what the compositor binds to):
     Proscenium.drawBackdrop(ctx, W, H, phase)        // opaque silk + sky + vignette; phase 0=dawn·.5=dusk·1=night
     Proscenium.drawScreen(ctx, W, H)                 // === drawBackdrop(ctx,W,H,0.5) — the free-play default (back-compat)
     Proscenium.drawLampBloom(ctx, x, y, W, H, k)     // warm bloom at (x,y), k=intensity
     Proscenium.drawCurtain(ctx, W, H, drop)          // warm pleated fly-curtain; drop 0=flown·1=lowered (over silk+shadow, behind arch)
     Proscenium.drawFrame(ctx, W, H)                  // the walnut arch, over everything

   PHASE + COMPOSITE NOTE — the backdrop is baked into the silk cache UNDER the lamp
   bloom ('lighter') and the shadow multiply, so `night` only darkens the periphery: the
   night CENTRE FLOOR stays warm (rgb≈60,49,32) and the lamp pool stays phase-independently
   bright, so shadows cast into it never lose contrast. Do not move the backdrop above the
   bloom/multiply.
   ============================================================================ */
"use strict";
(function (root) {

  /* phase colour helpers — a three-point lerp (dawn @0, dusk @0.5, night @1). */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c0, c1, t) { return [Math.round(lerp(c0[0], c1[0], t)), Math.round(lerp(c0[1], c1[1], t)), Math.round(lerp(c0[2], c1[2], t))]; }
  function lerp3(t, a, b, c) { return (t < 0.5) ? mix(a, b, t * 2) : mix(b, c, (t - 0.5) * 2); }
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  function rgba(c, al) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al + ')'; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* the woven grain, rendered ONCE into an offscreen tile and cached per size. */
  var _grain = null, _gw = 0, _gh = 0;
  function grainTile(W, H) {
    var gw = Math.max(2, Math.round(W)), gh = Math.max(2, Math.round(H));
    if (_grain && _gw === gw && _gh === gh) return _grain;
    var c = document.createElement('canvas'); c.width = gw; c.height = gh;
    var g = c.getContext('2d');
    var img = g.createImageData(gw, gh);
    var d = img.data, rnd = mulberry32(0x51ac);
    for (var y = 0; y < gh; y++) {
      for (var x = 0; x < gw; x++) {
        var i = (y * gw + x) * 4;
        // a horizontal-weft weave: fine vertical threads + a hair of noise
        var weft = 0.5 + 0.5 * Math.sin(x * 0.9);
        var warp = 0.5 + 0.5 * Math.sin(y * 0.75 + 1.3);
        var v = (weft * 0.6 + warp * 0.4) * 0.5 + rnd() * 0.5;
        var a = Math.round(26 * v);                 // low-alpha warm threads
        d[i] = 60; d[i + 1] = 40; d[i + 2] = 18; d[i + 3] = a;
      }
    }
    g.putImageData(img, 0, 0);
    _grain = c; _gw = gw; _gh = gh;
    return c;
  }

  /* the silk, washed by the hour. phase 0=dawn · 0.5=dusk · 1=night. The centre floor
     stays warm at every phase (so shadow contrast survives night); only the periphery
     cools + darkens, and a low outdoor sky band cools toward night at the top. */
  function drawBackdrop(ctx, W, H, phase) {
    phase = (phase == null) ? 0.5 : clamp01(phase);
    // the warm floor at the centre — stays warm at every hour (dusk === the old #5a3f1e)
    var inner = lerp3(phase, [116, 82, 44], [90, 63, 30], [60, 49, 32]);
    var midc  = lerp3(phase, [78, 56, 30], [58, 40, 18], [34, 27, 17]);
    var outer = lerp3(phase, [30, 19, 10], [18, 11, 6], [7, 8, 13]);
    var rg = ctx.createRadialGradient(W * 0.5, H * 0.44, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    rg.addColorStop(0, rgb(inner));
    rg.addColorStop(0.45, rgb(midc));
    rg.addColorStop(1, rgb(outer));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    // a low outdoor sky band across the top — warm rose at dawn, cool blue at night
    var sky = lerp3(phase, [78, 50, 38], [42, 34, 30], [22, 30, 54]);
    var skyA = 0.10 + 0.16 * phase;
    var sg = ctx.createLinearGradient(0, 0, 0, H * 0.42);
    sg.addColorStop(0, rgba(sky, skyA.toFixed(3)));
    sg.addColorStop(1, rgba(sky, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H * 0.42);
    // the woven grain, tiled over (the cached mulberry weft)
    try { ctx.drawImage(grainTile(W, H), 0, 0, W, H); } catch (e) { }
    // a soft vignette to seat the silk in shadow, deepening toward night
    var vA = lerp(0.42, 0.74, phase);
    var vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.30, W * 0.5, H * 0.5, Math.max(W, H) * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,' + vA.toFixed(3) + ')');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  // back-compat: the free-play default is dusk, byte-identical call shape for the compositor.
  function drawScreen(ctx, W, H) { drawBackdrop(ctx, W, H, 0.5); }

  /* the fly-curtain — warm pleated silk hung inside the walnut arch. drop 0=flown
     (nothing), 1=lowered (hem at the stage floor). Canvas paint only — never eats
     pointer events; drawn UNDER the arch by the compositor so its top tucks behind
     the walnut. */
  function drawCurtain(ctx, W, H, drop) {
    drop = clamp01(drop);
    if (drop <= 0.001) return;
    var t = Math.max(14, Math.min(W, H) * 0.045);       // === drawFrame's thickness
    var top = t, left = t, right = W - t, span = right - left;
    var hem = top + (H - 2 * t) * drop;
    var N = Math.max(8, Math.round(span / 46));         // pleat count
    var cw = span / N;
    var scallop = Math.min(cw * 0.5, (H - 2 * t) * 0.05) * (0.55 + 0.45 * drop);
    // the silhouette path: down the left, scalloped hem across, up the right, close along the fly
    function silkPath() {
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, hem);
      for (var i = 0; i < N; i++) {
        var x0 = left + i * cw, xm = x0 + cw * 0.5, x1 = x0 + cw;
        ctx.quadraticCurveTo(xm, hem + scallop, x1, hem);
      }
      ctx.lineTo(right, top);
      ctx.closePath();
    }
    ctx.save();
    // base silk
    silkPath();
    ctx.fillStyle = 'rgb(102,42,27)';
    ctx.fill();
    // pleats — fold shadow at each seam, a silk catch down each pleat centre
    ctx.save();
    silkPath(); ctx.clip();
    var botExtent = hem + scallop - top + 4;
    for (var i = 0; i < N; i++) {
      var x0 = left + i * cw;
      var gf = ctx.createLinearGradient(x0, 0, x0 + cw, 0);
      gf.addColorStop(0, 'rgba(28,9,5,0.9)');
      gf.addColorStop(0.5, 'rgba(28,9,5,0)');
      gf.addColorStop(1, 'rgba(28,9,5,0.9)');
      ctx.fillStyle = gf; ctx.fillRect(x0, top, cw + 1, botExtent);
      var gc = ctx.createLinearGradient(x0, 0, x0 + cw, 0);
      gc.addColorStop(0, 'rgba(214,120,80,0)');
      gc.addColorStop(0.5, 'rgba(220,128,86,0.38)');
      gc.addColorStop(1, 'rgba(214,120,80,0)');
      ctx.fillStyle = gc; ctx.fillRect(x0, top, cw + 1, botExtent);
    }
    // lit at the fly, shadowed toward the hem (a hung fabric)
    var vg = ctx.createLinearGradient(0, top, 0, hem);
    vg.addColorStop(0, 'rgba(255,222,152,0.14)');
    vg.addColorStop(0.5, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = vg; ctx.fillRect(left, top, span, botExtent);
    ctx.restore();
    // the gilt fringe following the scallops + a tassel dip under each low point
    ctx.beginPath();
    ctx.moveTo(left, hem);
    for (var j = 0; j < N; j++) {
      var xa = left + j * cw, xam = xa + cw * 0.5, xb = xa + cw;
      ctx.quadraticCurveTo(xam, hem + scallop, xb, hem);
    }
    ctx.strokeStyle = 'rgba(201,162,74,0.72)';
    ctx.lineWidth = Math.max(1.2, cw * 0.05);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201,162,74,0.5)';
    ctx.lineWidth = Math.max(1, cw * 0.035);
    var tass = Math.min(11, scallop * 0.95);
    for (var k = 0; k < N; k++) {
      var xm = left + k * cw + cw * 0.5;
      ctx.beginPath(); ctx.moveTo(xm, hem + scallop); ctx.lineTo(xm, hem + scallop + tass); ctx.stroke();
    }
    ctx.restore();
  }

  function drawLampBloom(ctx, x, y, W, H, k) {
    k = (k == null) ? 1 : k;
    var r = Math.max(W, H) * (0.24 + 0.16 * k);
    var bg = ctx.createRadialGradient(x, y, 4, x, y, r);
    bg.addColorStop(0, 'rgba(255,226,166,' + (0.34 * k).toFixed(3) + ')');
    bg.addColorStop(0.4, 'rgba(255,206,128,' + (0.16 * k).toFixed(3) + ')');
    bg.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawFrame(ctx, W, H) {
    var t = Math.max(14, Math.min(W, H) * 0.045);   // frame thickness
    ctx.save();
    // walnut border: a warm bevelled band around the stage
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#4e3822'); grd.addColorStop(0.5, '#3a281a'); grd.addColorStop(1, '#22160c');
    ctx.fillStyle = grd;
    // top, bottom, left, right bands
    ctx.fillRect(0, 0, W, t);
    ctx.fillRect(0, H - t, W, t);
    ctx.fillRect(0, 0, t, H);
    ctx.fillRect(W - t, 0, t, H);
    // a thin gilt inner rail
    ctx.strokeStyle = 'rgba(201,162,74,0.4)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(t - 0.7, t - 0.7, W - 2 * t + 1.4, H - 2 * t + 1.4);
    // a carved arch across the top corners — soft shadow tucked into each spandrel
    // so the proscenium reads carved, not merely edged
    var ah = Math.min(120, H * 0.22);
    ctx.save();
    ctx.beginPath();
    ctx.rect(t, t, W - 2 * t, ah);
    ctx.clip();
    var cornerR = ah * 1.35;
    var cs = ctx.createRadialGradient(t, t, 2, t, t, cornerR);
    cs.addColorStop(0, 'rgba(10,6,3,0.5)'); cs.addColorStop(1, 'rgba(10,6,3,0)');
    ctx.fillStyle = cs; ctx.fillRect(t, t, cornerR, ah);
    var cs2 = ctx.createRadialGradient(W - t, t, 2, W - t, t, cornerR);
    cs2.addColorStop(0, 'rgba(10,6,3,0.5)'); cs2.addColorStop(1, 'rgba(10,6,3,0)');
    ctx.fillStyle = cs2; ctx.fillRect(W - t - cornerR, t, cornerR, ah);
    ctx.restore();
    // the gilt arch rail catching the lamp
    ctx.strokeStyle = 'rgba(201,162,74,0.30)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(t, t + ah);
    ctx.quadraticCurveTo(W * 0.5, t - 2, W - t, t + ah);
    ctx.stroke();
    ctx.restore();
  }

  root.Proscenium = {
    drawBackdrop: drawBackdrop,
    drawScreen: drawScreen,
    drawLampBloom: drawLampBloom,
    drawCurtain: drawCurtain,
    drawFrame: drawFrame,
    __forged: true
  };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
