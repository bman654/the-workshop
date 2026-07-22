/* ============================================================================
   tube-material.js — the hollow refractive MINERAL-TUBE material for The Crystal
   Garden. Draws one salt tube along a screen-space polyline so it reads as a
   HOLLOW, WET, REFRACTIVE glass membrane (a lit near wall, a see-through lumen,
   a dimmer far wall, a travelling glint, a soft bloom) — NOT a flat strand.

   Foundry synthesis: the "lampwork capillary" cross-section (strongest hollow
   read across a thick trunk AND a ~1px branch, plus the best membrane-bulb tips),
   with the travelling glint calmed to an occasional wet sparkle and the
   bloom/body eased so the densest trunks keep their lit-wall/dark-lumen contrast
   instead of crowding into an opaque mass.

   API (frozen):
     window.TubeMat.draw(ctx, pts, width, salt, isTip, t)
       ctx    : 2D context, already clipped to the jar interior
       pts    : [{x,y}, …] sway-transformed polyline (≥2 pts)
       width  : base stroke width px (the tube's live w, ~0.75 … ~5)
       salt   : { core, edge, glow } hex colour set
       isTip  : truthy ⇒ growing; draw the membrane bulb at pts[last]
       t      : ms timestamp; t===0 ⇒ reduced motion, output MUST be static
   ============================================================================ */
(function(){
  // light comes from the jar's upper-left edge; the lit near wall sits toward
  // this direction, the hollow lumen + far wall toward its opposite.
  var LX = -0.940, LY = -0.342;               // unit vector toward the light

  function rgb(hex){
    var n = parseInt(hex.slice(1),16);
    return [ (n>>16)&255, (n>>8)&255, n&255 ];
  }
  function rgba(c, a){ return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'; }
  function scale(c, f){                        // multiply toward black (darken)
    return [ (c[0]*f)|0, (c[1]*f)|0, (c[2]*f)|0 ];
  }
  function toward(c, o, f){                     // mix c toward o by f
    return [ (c[0]+(o[0]-c[0])*f)|0, (c[1]+(o[1]-c[1])*f)|0, (c[2]+(o[2]-c[2])*f)|0 ];
  }
  function trace(ctx, pts){
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for(var j=1;j<pts.length;j++) ctx.lineTo(pts[j].x, pts[j].y);
  }
  // stroke the path offset by k px along the light axis (+ = toward light).
  function band(ctx, pts, k, w, style){
    ctx.save();
    ctx.translate(LX*k, LY*k);
    trace(ctx, pts);
    ctx.lineWidth = w; ctx.strokeStyle = style; ctx.stroke();
    ctx.restore();
  }

  var WHITE = [255,255,255];

  var TubeMat = {
    draw: function(ctx, pts, width, salt, isTip, t){
      if(pts.length < 2) return;
      var w = width;
      var core = rgb(salt.core), edge = rgb(salt.edge), glow = rgb(salt.glow);
      // how strongly the hollow read applies — fades out toward a 1px thread.
      var hollow = Math.max(0, Math.min(1, (w - 1.1) / 2.6));

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      // 1) soft bloom into the water — two coats, wide + tight, glowing warm.
      //    eased a touch so overlapping trunks don't crowd into an opaque mass.
      band(ctx, pts, 0, w + 5.5, rgba(glow, 0.055));
      band(ctx, pts, 0, w + 2.6, rgba(glow, 0.085));

      // 2) the coloured membrane body (the glass, before we carve it). Kept a
      //    hair narrower + slightly translucent so where many tubes overlap the
      //    dark lumen still reads through the mass, not a flat opaque wall.
      band(ctx, pts, 0, Math.max(0.9, w + 0.6), rgba(core, 0.90));

      // 3) far wall + shadow edge — deepen the shadow side so the tube rounds.
      //    a colour-preserving dark (wet coloured glass, not soot).
      var shadow = scale(core, 0.34);
      band(ctx, pts, -w * 0.34, Math.max(0.5, w * 0.52), rgba(shadow, 0.55 * hollow));

      // 4) the hollow lumen — see-through to shadowed liquid, carved slightly
      //    toward shadow so the LIT near wall stays thick. A cool near-black
      //    tinted faintly by the salt keeps it wet, not dead.
      var lumen = toward(scale(core, 0.12), [6,5,10], 0.60);
      band(ctx, pts, -w * 0.11, Math.max(0.45, w * 0.46), rgba(lumen, 0.34 + 0.50 * hollow));

      // 5) the lit near wall — a luminous wet band of the salt's own light.
      band(ctx, pts,  w * 0.29, Math.max(0.6, w * 0.36), rgba(edge, 0.34 + 0.36 * hollow));

      // 6) the wet glass rim — the crisp specular edge where light first meets
      //    the membrane. Near-white flushed with the salt's edge hue.
      var rimC = toward(edge, WHITE, 0.55);
      band(ctx, pts,  w * 0.42, Math.max(0.4, w * 0.14), rgba(rimC, 0.50 + 0.30 * hollow));

      // 7) the travelling glint — a specular bead sliding up the near wall via an
      //    animated line-dash. Tuned SPARSE + short so it reads as an occasional
      //    wet sparkle, not a chain of beads down the wall. Static + deterministic
      //    under reduced motion (t===0).
      ctx.save();
      ctx.translate(LX * (w * 0.36), LY * (w * 0.36));
      trace(ctx, pts);
      ctx.lineWidth = Math.max(0.45, w * 0.15);
      ctx.strokeStyle = rgba(WHITE, 0.22 + 0.14 * hollow);
      var beadLen = Math.max(2.2, w * 1.15), gap = 92;
      ctx.setLineDash([beadLen, gap]);
      ctx.lineDashOffset = (t === 0) ? (pts[0].y * 0.7) : (-(t * 0.028));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 8) the growing tip — a bright membrane bulb of fresh skin: a warm halo,
      //    a colour-glass sphere with a dark lumen, and a wet specular kiss.
      if(isTip){
        var e = pts[pts.length - 1];
        var R = Math.max(2.8, w * 1.35);
        ctx.beginPath(); ctx.arc(e.x, e.y, R * 1.5, 0, 7);
        ctx.fillStyle = rgba(glow, 0.14); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, 7);
        ctx.fillStyle = rgba(edge, 0.85); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + LX * R * 0.30, e.y + LY * R * 0.30, R * 0.46, 0, 7);
        ctx.fillStyle = rgba(scale(core, 0.22), 0.55); ctx.fill();   // hollow lumen in the bulb
        var kx = e.x + LX * R * 0.42, ky = e.y + LY * R * 0.42;
        ctx.beginPath(); ctx.arc(kx, ky, Math.max(0.7, R * 0.30), 0, 7);
        ctx.fillStyle = rgba(WHITE, 0.85); ctx.fill();               // specular kiss
      }

      ctx.restore();
    }
  };
  if(typeof window !== 'undefined') window.TubeMat = TubeMat;
})();
