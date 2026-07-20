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
     Proscenium.drawScreen(ctx, W, H)                 // opaque silk + vignette (CSS px)
     Proscenium.drawLampBloom(ctx, x, y, W, H, k)     // warm bloom at (x,y), k=intensity
     Proscenium.drawFrame(ctx, W, H)                  // the walnut arch, over everything
   ============================================================================ */
"use strict";
(function (root) {

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

  function drawScreen(ctx, W, H) {
    // base warm amber, brightest toward the middle-upper stage
    var rg = ctx.createRadialGradient(W * 0.5, H * 0.44, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    rg.addColorStop(0, '#5a3f1e');
    rg.addColorStop(0.45, '#3a2812');
    rg.addColorStop(1, '#120b06');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    // the woven grain, tiled over
    try { ctx.drawImage(grainTile(W, H), 0, 0, W, H); } catch (e) { }
    // a soft vignette to seat the silk in shadow
    var vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.30, W * 0.5, H * 0.5, Math.max(W, H) * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
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
    drawScreen: drawScreen,
    drawLampBloom: drawLampBloom,
    drawFrame: drawFrame,
    __forged: true
  };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
