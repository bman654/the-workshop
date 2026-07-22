/* ============================================================================
   jar-frame.js — "Candle-warm water-glass jar" (foundry take 2)

   A round, wet apothecary jar of faintly-teal water glass standing in the pool
   of a single candle set just off the upper-LEFT of the frame. The whole read is
   built from ONE consistent light: warm amber falls from the upper left, so the
   left face of the cylinder is lit and rim-bright, a crisp specular streak runs
   down the wet near-glass, the right face falls into cool shadow, the water
   surface catches a bright meniscus, and a soft caustic of candlelight pools on
   the sediment floor. Everything OVER the tubes (rim, specular, bloom) is held
   at low alpha so the coloured gardens always read through the near wall.

   API (frozen): window.JarArt.body(ctx,JAR,t,opts) / .rim(ctx,JAR,t,opts)
     JAR : { x,y,w,h,floorY,ceilY,sed }   logical px
     t   : ms timestamp (0 ⇒ reduced-motion, fully static)
     opts: { sediment:[{x,y,r,a}], path:fn(ctx) }  path traces the jar interior
   Both methods fully restore any ctx state they touch.
   ============================================================================ */
(function(){

  // a soft vertical/elliptical light lozenge — a stretched radial, our workhorse
  // for cylinder highlights, candle blooms and floor caustics.
  function lozenge(ctx, cx, cy, rx, ry, c0, c1){
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(rx, ry);
    var g = ctx.createRadialGradient(0,0,0, 0,0,1);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,1,0,6.2832); ctx.fill();
    ctx.restore();
  }

  // the candle sits off-frame, upper-left — one anchor drives all the lighting
  function candle(JAR){
    return { x: JAR.x + JAR.w*0.20, y: JAR.y - 46 };
  }

  // trace the water surface as a gently down-bowed meniscus near the ceiling
  function meniscusPath(ctx, JAR, dip){
    var y = JAR.ceilY, x0 = JAR.x, x1 = JAR.x + JAR.w, cx = JAR.x + JAR.w*0.5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.quadraticCurveTo(cx, y + dip, x1, y);
  }

  var JarArt = {

    // ── BEHIND the tubes: the glass body, warm ambience, meniscus, sediment ──
    body: function(ctx, JAR, t, opts){
      var path = opts.path, C = candle(JAR);
      ctx.save();
      path(ctx); ctx.clip();

      // 1 · water-glass tint — clearly, faintly teal; deeper toward the base
      var vg = ctx.createLinearGradient(0, JAR.y, 0, JAR.y + JAR.h);
      vg.addColorStop(0.00, 'rgba(74,124,128,0.28)');
      vg.addColorStop(0.42, 'rgba(48,98,104,0.36)');
      vg.addColorStop(0.80, 'rgba(30,62,72,0.48)');
      vg.addColorStop(1.00, 'rgba(20,42,54,0.58)');
      ctx.fillStyle = vg; ctx.fillRect(JAR.x, JAR.y, JAR.w, JAR.h);

      // 2 · cylinder shading — darken both vertical edges (glass turning away),
      //     the far RIGHT more than the lit left, so the body reads as round.
      var hg = ctx.createLinearGradient(JAR.x, 0, JAR.x + JAR.w, 0);
      hg.addColorStop(0.00,'rgba(8,16,22,0.30)');
      hg.addColorStop(0.13,'rgba(8,16,22,0)');
      hg.addColorStop(0.60,'rgba(8,14,20,0)');
      hg.addColorStop(1.00,'rgba(6,12,18,0.42)');
      ctx.fillStyle = hg; ctx.fillRect(JAR.x, JAR.y, JAR.w, JAR.h);

      // 3 · warm ambience — the candle's glow behind the glass, pooling toward
      //     the upper-LEFT. Low alpha, so it lifts the ground WITHOUT washing tubes.
      //     Pushed a touch warmer/amber so it reads as a true off-frame flame.
      lozenge(ctx, JAR.x + JAR.w*0.16, JAR.y + JAR.h*0.14, JAR.w*0.52, JAR.h*0.52,
              'rgba(236,172,96,0.24)', 'rgba(236,172,96,0)');
      // 3b · warm apothecary air pooling into the open upper water (no tubes up
      //      high, so the top of the glass can read amber rather than grey).
      lozenge(ctx, JAR.x + JAR.w*0.26, JAR.y - JAR.h*0.02, JAR.w*0.50, JAR.h*0.30,
              'rgba(238,178,100,0.16)', 'rgba(238,178,100,0)');

      // 4 · the lit curve of the cylinder — a soft cool sheen down the candle
      //     side, giving the glass its round shoulder.
      lozenge(ctx, JAR.x + JAR.w*0.19, JAR.y + JAR.h*0.48, JAR.w*0.22, JAR.h*0.52,
              'rgba(200,228,228,0.09)', 'rgba(200,228,228,0)');

      // 4 · slow diagonal refraction drifting through the silicate (motion only)
      if(t){
        var tt = t*0.00013;
        for(var b=0;b<3;b++){
          var yy = JAR.y + ((Math.sin(tt + b*2.3)*0.5+0.5) * JAR.h);
          var sg = ctx.createLinearGradient(0, yy-52, 0, yy+52);
          sg.addColorStop(0.0,'rgba(196,228,226,0)');
          sg.addColorStop(0.5,'rgba(200,232,230,0.05)');
          sg.addColorStop(1.0,'rgba(196,228,226,0)');
          ctx.fillStyle = sg; ctx.fillRect(JAR.x, yy-52, JAR.w, 104);
        }
      }

      // 5 · the meniscus — bright water-surface line, brighter toward the candle
      var dip = 14 + (t ? Math.sin(t*0.0006)*1.4 : 0);
      // sub-surface glow just beneath the meniscus
      var mg = ctx.createLinearGradient(0, JAR.ceilY, 0, JAR.ceilY + 30);
      mg.addColorStop(0,'rgba(224,240,238,0.16)'); mg.addColorStop(1,'rgba(224,240,238,0)');
      ctx.fillStyle = mg; ctx.fillRect(JAR.x, JAR.ceilY, JAR.w, 30);
      // the catch-line itself, gradient-stroked bright on the candle side
      var lg = ctx.createLinearGradient(JAR.x, 0, JAR.x + JAR.w, 0);
      lg.addColorStop(0.00,'rgba(240,250,246,0.30)');
      lg.addColorStop(0.30,'rgba(248,252,248,0.62)');
      lg.addColorStop(0.70,'rgba(210,232,230,0.24)');
      lg.addColorStop(1.00,'rgba(190,214,214,0.12)');
      meniscusPath(ctx, JAR, dip);
      ctx.lineWidth = 1.4; ctx.strokeStyle = lg;
      ctx.lineCap = 'round'; ctx.stroke();

      // 6 · sediment bed — dark settled floor with a candle-warmed top edge
      var bedTop = JAR.floorY;
      var bg = ctx.createLinearGradient(0, bedTop-3, 0, JAR.floorY + JAR.sed + 2);
      bg.addColorStop(0.0,'rgba(58,44,30,0.0)');
      bg.addColorStop(0.14,'rgba(74,56,34,0.5)');
      bg.addColorStop(0.42,'rgba(30,24,26,0.62)');
      bg.addColorStop(1.0,'rgba(16,14,20,0.7)');
      ctx.fillStyle = bg; ctx.fillRect(JAR.x, bedTop-3, JAR.w, JAR.sed + 5);

      // 6b · a warm caustic — candlelight pooling on the floor, candle side.
      //      Deepened + widened a step so the warm pool actually registers.
      lozenge(ctx, JAR.x + JAR.w*0.22, JAR.floorY + 4, JAR.w*0.34, JAR.sed*1.05,
              'rgba(238,182,108,0.30)', 'rgba(238,182,108,0)');

      // 6c · settled grains, each with a tiny lit crown
      var sed = opts.sediment || [];
      for(var i=0;i<sed.length;i++){ var s = sed[i];
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(210,180,128,'+s.a+')'; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x - s.r*0.3, s.y - s.r*0.35, s.r*0.5, 0, 6.2832);
        ctx.fillStyle = 'rgba(248,228,178,'+Math.min(0.5, s.a+0.14)+')'; ctx.fill();
      }

      ctx.restore();
    },

    // ── OVER the tubes: the candle bloom, glass rim, wet specular + edge light ──
    rim: function(ctx, JAR, t, opts){
      var path = opts.path, C = candle(JAR);

      // 1 · the off-frame candle bloom, pooling above/behind the jar. Drawn on
      //     the open field (no clip) so it bleeds past the rim into the dark.
      ctx.save();
      lozenge(ctx, C.x, C.y, JAR.w*0.54, JAR.h*0.36,
              'rgba(234,174,102,0.16)', 'rgba(234,174,102,0)');
      lozenge(ctx, C.x, C.y + 8, JAR.w*0.22, JAR.h*0.16,
              'rgba(255,216,152,0.11)', 'rgba(255,216,152,0)');
      ctx.restore();

      // 2 · the glass rim — a warm brass outline, brighter & warmer on the top
      //     edge (lit from above/left), cooling toward the base.
      ctx.save();
      path(ctx);
      var rimg = ctx.createLinearGradient(0, JAR.y, 0, JAR.y + JAR.h);
      rimg.addColorStop(0.00,'rgba(238,192,116,0.40)');
      rimg.addColorStop(0.50,'rgba(200,164,104,0.20)');
      rimg.addColorStop(1.00,'rgba(150,178,178,0.22)');
      ctx.lineWidth = 1.6; ctx.strokeStyle = rimg; ctx.stroke();
      // a brighter kiss of light across the top rounded shoulder — the strongest
      // rounded-shoulder read; additive so it never darkens what's beneath.
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.moveTo(JAR.x + 22, JAR.y + 1);
      ctx.quadraticCurveTo(JAR.x + JAR.w*0.5, JAR.y - 2.5, JAR.x + JAR.w - 22, JAR.y + 1);
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,238,200,0.34)';
      ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();

      // everything from here reads THROUGH the near wall — clip to the interior
      ctx.save();
      path(ctx); ctx.clip();

      // 3 · a whisper of warm candle sheen on the wet upper glass (very low),
      //     pooled toward the lit shoulder. Drawn as a self-fading lozenge (not a
      //     clipped rectangle) so it leaves NO hard vertical seam mid-glass.
      lozenge(ctx, JAR.x + JAR.w*0.20, JAR.y + JAR.h*0.06, JAR.w*0.44, JAR.h*0.20,
              'rgba(240,188,118,0.09)', 'rgba(240,188,118,0)');

      // 4 · the KEY specular — a crisp, narrow wet streak down the near glass,
      //     just inside the lit edge. Narrow so it never buries the cobalt tube.
      lozenge(ctx, JAR.x + JAR.w*0.135, JAR.y + JAR.h*0.44, JAR.w*0.028, JAR.h*0.44,
              'rgba(255,253,247,0.42)', 'rgba(255,253,247,0)');
      // a dim companion reflection on the far shoulder — sells the roundness
      lozenge(ctx, JAR.x + JAR.w*0.83, JAR.y + JAR.h*0.40, JAR.w*0.02, JAR.h*0.30,
              'rgba(214,236,234,0.14)', 'rgba(214,236,234,0)');

      // 5 · bright rim-light on the extreme LIT (left) edge — round & wet
      var el = ctx.createLinearGradient(JAR.x, 0, JAR.x + 22, 0);
      el.addColorStop(0,'rgba(255,250,238,0.20)'); el.addColorStop(1,'rgba(255,250,238,0)');
      ctx.fillStyle = el; ctx.fillRect(JAR.x, JAR.y, 22, JAR.h);

      // 6 · soft shadow curling round the far (right) edge — the cylinder's back
      var er = ctx.createLinearGradient(JAR.x + JAR.w - 40, 0, JAR.x + JAR.w, 0);
      er.addColorStop(0,'rgba(6,10,16,0)'); er.addColorStop(1,'rgba(6,10,16,0.40)');
      ctx.fillStyle = er; ctx.fillRect(JAR.x + JAR.w - 40, JAR.y, 40, JAR.h);

      // 7 · a faint floor-ward vignette so the base feels deep & round
      var fg = ctx.createLinearGradient(0, JAR.y + JAR.h*0.66, 0, JAR.y + JAR.h);
      fg.addColorStop(0,'rgba(4,8,14,0)'); fg.addColorStop(1,'rgba(4,8,14,0.22)');
      ctx.fillStyle = fg; ctx.fillRect(JAR.x, JAR.y + JAR.h*0.66, JAR.w, JAR.h*0.34);

      ctx.restore();
    }
  };

  if(typeof window!=='undefined') window.JarArt = JarArt;
})();
