// @asset star
'use strict';
/* ── ART: star — the antique-atlas star glint (take 3: the burin sparkle) ────
   ONE star as an old celestial atlas would engrave it at night. Not a proc disc
   + a stroked cross — a hand-cut glint: a warm luminous core with a tight white
   hotspot, a soft diffraction bloom, and a delicate engraved sparkle built from
   TAPERED needle spikes (filled kite polygons, so they narrow to a burin point
   like an engraver's line, never a flat stroke). A faint 45°-offset secondary
   set of shorter spikes gives the "twinkle cross" its old-chart richness; the
   brightest tiers also carry one thin diffraction-echo ring.

   Three tint tiers — cool (blue-white far dust), warm (amber near anchor),
   gild (the gold laced / node hero star, richest bloom). `r` is the core radius
   in CSS px (bigger ⇒ brighter magnitude ⇒ more bloom + a readable glint);
   `alpha` scales the WHOLE sprite's opacity so gilded nodes bloom in cleanly and
   the first-star ring can pulse.

   Contract:  Gate.art.star(ctx, x, y, r, kind='cool', alpha=1)
   Coordinate space: CSS px in the caller's already-transformed context. Draws
   only; saves/restores its own ctx state; returns nothing.
   ─────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.art = window.Gate.art || {};

/* per-tier palette. hot = tight white-hot centre, core = the body colour,
   bloom = the soft diffraction halo, spike = the engraved sparkle rays.
   Each is an "r,g,b" string so we can vary alpha per pass. */
var _STAR_TIER = {
  cool: { hot: '244,247,255', core: '206,220,246', bloom: '150,178,236', spike: '198,214,248' },
  warm: { hot: '255,246,214', core: '245,214,150', bloom: '224,176,110', spike: '242,206,146' },
  gild: { hot: '255,248,214', core: '255,222,140', bloom: '244,190,96',  spike: '255,224,140' }
};

/* one tapered needle spike as a filled kite: a thin diamond from centre out to
   `len`, half-width `hw` at ~28% out, meeting to a point at the tip. Rotated by
   `ang`. Filled (not stroked) so it reads as an engraved, tapering burin ray. */
function _skySpike(ctx, x, y, ang, len, hw) {
  var c = Math.cos(ang), s = Math.sin(ang);
  var px = -s, py = c;                 // perpendicular unit
  var mx = x + c * len * 0.28, my = y + s * len * 0.28;   // widest point
  ctx.beginPath();
  ctx.moveTo(x, y);                                        // root
  ctx.lineTo(mx + px * hw, my + py * hw);                  // one shoulder
  ctx.lineTo(x + c * len, y + s * len);                   // tip
  ctx.lineTo(mx - px * hw, my - py * hw);                  // other shoulder
  ctx.closePath();
  ctx.fill();
}

window.Gate.art.star = function (ctx, x, y, r, kind, alpha) {
  kind = kind || 'cool';
  alpha = (alpha == null) ? 1 : alpha;
  if (alpha <= 0 || r <= 0) return;
  var T = _STAR_TIER[kind] || _STAR_TIER.cool;

  // magnitude drives how much sparkle a star earns. Faint dust (r<~1.4) is just
  // a soft glint of a core; brightness ramps in the spikes and the echo ring.
  var coreR = Math.max(0.55, r);
  var mag = Math.max(0, Math.min(1, (r - 1.1) / 3.4));    // 0 faint … 1 bright
  var glintF = Math.max(0, Math.min(1, (r - 1.35) / 1.9)); // when spikes appear
  var gild = (kind === 'gild');

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── 1. the soft diffraction bloom (additive so overlapping stars sum warmly) ──
  //   Faint dust carries a hair more haze for atmosphere at the plate margins
  //   (a higher floor on the magnitude size-term); the brightest gild node trims
  //   its radius a touch so its engraved rays keep LEADING over the halo.
  var prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  var bloomR = coreR * (gild ? 4.5 : 3.9) * (0.82 + 0.36 * mag);
  var bg = ctx.createRadialGradient(x, y, 0, x, y, bloomR);
  bg.addColorStop(0.0, 'rgba(' + T.bloom + ',' + (gild ? 0.66 : 0.52) + ')');
  bg.addColorStop(0.22, 'rgba(' + T.bloom + ',' + (gild ? 0.34 : 0.24) + ')');
  bg.addColorStop(1.0, 'rgba(' + T.bloom + ',0)');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(x, y, bloomR, 0, Math.PI * 2); ctx.fill();

  // ── 2. the engraved sparkle — tapered needle spikes (only on brighter tiers) ──
  if (glintF > 0.01) {
    ctx.fillStyle = 'rgba(' + T.spike + ',' + (0.92 * glintF) + ')';
    var primLen = coreR * (gild ? 4.9 : 4.0) * (0.55 + 0.68 * mag);
    var primHW = Math.max(0.5, coreR * 0.28);
    // primary 4-point cross (vertical/horizontal — the classic atlas twinkle)
    _skySpike(ctx, x, y, -Math.PI / 2, primLen, primHW);   // up
    _skySpike(ctx, x, y, Math.PI / 2, primLen, primHW);    // down
    _skySpike(ctx, x, y, 0, primLen, primHW);              // right
    _skySpike(ctx, x, y, Math.PI, primLen, primHW);        // left
    // secondary shorter diagonal spikes — fainter, for old-chart richness.
    // The hero GILD node joins them a touch more strongly (a genuine six-point
    // atlas sparkle), kept faint enough it never competes with the 4-point read.
    var secF = glintF * mag;
    if (secF > 0.02) {
      ctx.fillStyle = 'rgba(' + T.spike + ',' + ((gild ? 0.56 : 0.42) * secF) + ')';
      var secLen = primLen * (gild ? 0.64 : 0.58), secHW = primHW * 0.8;
      for (var k = 0; k < 4; k++) {
        _skySpike(ctx, x, y, Math.PI / 4 + k * Math.PI / 2, secLen, secHW);
      }
    }
  }

  // ── 3. the engraver's AUREOLE — a thin etched contour ring, the way an old
  //       chart cuts the edge of a star's glow. Take 3's echo ring under-read at
  //       node scale; this reads at the r~2.6–5 node sizes actually used. Onset
  //       lowered and alpha strengthened, still gated to the brighter/gild tiers
  //       so faint dust never grows a hard ring. Sits closer in (×2.05) so it
  //       hugs the core rather than floating out into the bloom. ──
  if (mag > 0.22 || (gild && r > 1.35)) {
    var ringF = Math.min(1, (mag - 0.22) / 0.6 + (gild ? 0.4 : 0));
    var ringA = (gild ? 0.42 : 0.24) * Math.max(0.25, ringF);
    ctx.strokeStyle = 'rgba(' + T.bloom + ',' + ringA + ')';
    ctx.lineWidth = Math.max(0.6, coreR * 0.14);
    ctx.beginPath(); ctx.arc(x, y, coreR * 2.05, 0, Math.PI * 2); ctx.stroke();
  }

  // ── 4. the core: a warm body disc + a tight white-hot centre ──
  ctx.globalCompositeOperation = prevOp;   // back to normal for a crisp core
  var cg = ctx.createRadialGradient(x, y, 0, x, y, coreR);
  cg.addColorStop(0.0, 'rgba(' + T.hot + ',1)');
  cg.addColorStop(0.45, 'rgba(' + T.core + ',1)');
  cg.addColorStop(1.0, 'rgba(' + T.core + ',0.85)');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(x, y, coreR, 0, Math.PI * 2); ctx.fill();

  // a pin-sharp hotspot so even faint stars keep a crisp jewel of light
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(' + T.hot + ',' + (0.9 * (0.55 + 0.45 * mag)) + ')';
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.35, coreR * 0.42), 0, Math.PI * 2); ctx.fill();

  ctx.restore();
};
