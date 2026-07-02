'use strict';
/* ── ART: cartouche — the aged-vellum / indigo engraved atlas frame ──────────
   FOUNDRY final · "the engraver's plate" (Take 1 base + the bead-and-reel graft).

   An authentically-antique celestial-atlas cartouche the way an 18th-century
   engraver would pull it — the frame is INTAGLIO gilt line-work, so every gold
   stroke is a LIT edge over a darker recess (a paired highlight + shadow line),
   never a flat modern rule. A double border rule with a hairline in the channel
   between; a bead-and-reel dotted chain (the strongest period signal) rides the
   inner track; the corners carry a restrained engraved scroll flourish (bezier
   ribbons curling into a beaded eye); and a small keystone loop is tied onto the
   top rule at the big size. The whole plate is warmed by a faint, deterministic
   vellum tone + a breath of foxing up top. The interior stays calm and dark so a
   gold name, a blue designation and a two-line cream myth all read cleanly on
   top. `alpha` (0..1) grows the frame in on catasterize.

   Palette matches `verse` / `the-cartographers-dream` (indigo + #f0c766 gilt),
   NOT gate brass.

   Contract:  Gate.art.cartouche(ctx, x, y, w, h, alpha=1)
   Coordinate space: CSS px in the caller's already-transformed context. Draws
   only; saves/restores its own state; returns nothing.
   ─────────────────────────────────────────────────────────────────────────── */
window.Gate = window.Gate || {}; window.Gate.art = window.Gate.art || {};

function _skyRoundRect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// tiny deterministic PRNG (mulberry32) so the vellum tone is stable per size.
function _skyRng(seed) {
  var s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// An INTAGLIO gilt stroke: a soft dark recess line, then a bright gold edge
// riding just above it — reads as an engraved groove catching the light.
function _skyIntaglioPath(g, tracer, edge, lw, litRGB, shadowRGB) {
  // recess (drawn first, offset down a hair)
  g.save();
  g.lineWidth = lw + 1;
  g.strokeStyle = shadowRGB;
  g.translate(0, 0.65);
  tracer(g); g.stroke();
  g.restore();
  // lit gold edge
  g.save();
  g.lineWidth = lw;
  g.strokeStyle = litRGB;
  tracer(g); g.stroke();
  g.restore();
}

window.Gate.art.cartouche = function (ctx, x, y, w, h, alpha) {
  alpha = (alpha == null) ? 1 : alpha;
  if (alpha <= 0 || w <= 0 || h <= 0) return;

  var S = Math.min(w, h);
  var small = S < 220;                       // kept-plate scale vs main reveal
  var rad = Math.min(S * 0.055, 16);
  // border geometry, all scaled off the short side so both sizes read
  var m1 = Math.max(3.5, S * 0.028);         // outer rule inset
  var chan = Math.max(3, S * 0.020);         // channel between the two rules
  var m2 = m1 + chan;                        // inner rule inset
  var lwOuter = Math.max(1.1, S * 0.0075);
  var lwInner = Math.max(0.9, S * 0.006);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ── 1. panel: indigo deepening downward, faint vellum warmth up top ──
  var pg = ctx.createLinearGradient(x, y, x, y + h);
  pg.addColorStop(0.00, 'rgba(31,42,80,0.80)');   // --indigo2 warmed
  pg.addColorStop(0.50, 'rgba(19,28,58,0.82)');
  pg.addColorStop(1.00, 'rgba(10,14,26,0.86)');   // ~--void2
  _skyRoundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = pg; ctx.fill();

  // a radial warmth from the top-centre (candlelit vellum), very faint
  var vg = ctx.createRadialGradient(x + w / 2, y + h * 0.13, S * 0.05,
                                    x + w / 2, y + h * 0.13, h * 0.92);
  vg.addColorStop(0, 'rgba(233,220,192,0.095)');
  vg.addColorStop(0.5, 'rgba(233,220,192,0.024)');
  vg.addColorStop(1, 'rgba(233,220,192,0)');
  _skyRoundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = vg; ctx.fill();

  // ── 2. deterministic vellum foxing / tone (clipped to the panel) ──
  ctx.save();
  _skyRoundRect(ctx, x, y, w, h, rad); ctx.clip();
  var rng = _skyRng((Math.round(w) * 73856093) ^ (Math.round(h) * 19349663));
  var motes = small ? 26 : 80;
  for (var i = 0; i < motes; i++) {
    var fx = x + rng() * w;
    var fy = y + rng() * h;
    // foxing pools toward the top (age spots) + edges
    var edgeBias = Math.min(fx - x, x + w - fx, fy - y, y + h - fy) / (S * 0.5);
    var topBias = 1 - (fy - y) / h;
    var pr = (rng() * 1.4 + 0.4) * (small ? 0.8 : 1);
    var a = (0.012 + rng() * 0.028) * (0.4 + 0.6 * topBias) * (0.5 + 0.5 * (1 - Math.min(1, edgeBias)));
    // warm (foxing) vs faint cool (staining), mostly warm
    var warm = rng() < 0.72;
    ctx.beginPath();
    ctx.arc(fx, fy, pr, 0, Math.PI * 2);
    ctx.fillStyle = warm
      ? 'rgba(196,148,86,' + a.toFixed(3) + ')'
      : 'rgba(120,140,178,' + (a * 0.7).toFixed(3) + ')';
    ctx.fill();
  }
  // a faint darkening in the bottom corners (age / handling)
  var cg = ctx.createRadialGradient(x + w / 2, y + h, S * 0.1, x + w / 2, y + h, h * 0.75);
  cg.addColorStop(0, 'rgba(6,8,16,0.16)');
  cg.addColorStop(1, 'rgba(6,8,16,0)');
  ctx.fillStyle = cg; ctx.fillRect(x, y, w, h);
  ctx.restore();

  // ── 3. the double border rule (intaglio gilt) ──
  var litOuter = 'rgba(240,199,102,0.62)';
  var litInner = 'rgba(240,199,102,0.34)';
  var shadow = 'rgba(6,8,16,0.55)';

  _skyIntaglioPath(ctx,
    function (g) { _skyRoundRect(g, x + m1, y + m1, w - m1 * 2, h - m1 * 2, Math.max(2, rad - m1)); },
    'outer', lwOuter, litOuter, shadow);

  _skyIntaglioPath(ctx,
    function (g) { _skyRoundRect(g, x + m2, y + m2, w - m2 * 2, h - m2 * 2, Math.max(1.5, rad - m2)); },
    'inner', lwInner, litInner, shadow);

  // a hairline bead riding the channel between the two rules (engraver's detail)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,233,168,0.18)';
  ctx.lineWidth = 0.6;
  var mm = (m1 + m2) / 2;
  _skyRoundRect(ctx, x + mm, y + mm, w - mm * 2, h - mm * 2, Math.max(1.5, rad - mm));
  ctx.stroke();
  ctx.restore();

  // ── 3b. bead-and-reel dotted chain riding the inner rule (grafted from
  //    Take 3) — the strongest period signal in the set. A regular run of tiny
  //    gilt dots along the straight portion of each inner-rule edge, inset past
  //    the corner radius so it never crowds the volutes. Modest density; thinned
  //    and sparser on the small branch so the kept-plate stays quiet.
  var ir2 = Math.max(1.5, rad - m2);           // inner-rule corner radius
  var bix = x + m2, biy = y + m2, biw = w - m2 * 2, bih = h - m2 * 2;
  if (biw > 40 && bih > 40) {
    var beadR = Math.max(0.6, (small ? 0.62 : 0.85) * (S / 260) + 0.35);
    var step = Math.max(small ? 11 : 9, (small ? 13 : 10.5) * (S / 260));
    ctx.fillStyle = small ? 'rgba(244,208,120,0.30)' : 'rgba(244,208,120,0.40)';
    // top + bottom runs (start half a corner-radius past the arc)
    var runX0 = bix + ir2 + step * 0.5, runX1 = bix + biw - ir2;
    for (var bx = runX0; bx < runX1; bx += step) {
      ctx.beginPath(); ctx.arc(bx, biy, beadR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, biy + bih, beadR, 0, Math.PI * 2); ctx.fill();
    }
    // left + right runs
    var runY0 = biy + ir2 + step * 0.5, runY1 = biy + bih - ir2;
    for (var by = runY0; by < runY1; by += step) {
      ctx.beginPath(); ctx.arc(bix, by, beadR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bix + biw, by, beadR, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── 4. engraved corner flourishes — restrained bezier scrollwork ──
  // Drawn at the inner-rule corners, curling inward. A lit gold ribbon over a
  // shadow ribbon, so it reads as engraved intaglio like the rules.
  var fl = Math.min(S * (small ? 0.11 : 0.10), 44);     // flourish reach
  var ix = x + m2, iy = y + m2, iw = w - m2 * 2, ih = h - m2 * 2;
  var flLw = Math.max(0.9, S * 0.0055);

  function drawFlourish(cx, cy, sx, sy) {
    // local frame: sx/sy point INTO the panel from this corner
    var ex = cx + sx * fl * 0.30, ey = cy + sy * fl * 0.30;   // volute eye
    function ribbon(g) {
      g.beginPath();
      // main sweep along the top edge, curling inward to a tight volute eye
      g.moveTo(cx + sx * fl * 0.98, cy + sy * fl * 0.05);
      g.bezierCurveTo(
        cx + sx * fl * 0.55, cy + sy * fl * 0.01,
        cx + sx * fl * 0.22, cy + sy * fl * 0.07,
        cx + sx * fl * 0.11, cy + sy * fl * 0.30);
      g.bezierCurveTo(
        cx + sx * fl * 0.04, cy + sy * fl * 0.50,
        cx + sx * fl * 0.22, cy + sy * fl * 0.62,
        cx + sx * fl * 0.38, cy + sy * fl * 0.50);
      // the tight inner spiral of the volute (1.25 turns into the eye)
      g.bezierCurveTo(
        cx + sx * fl * 0.48, cy + sy * fl * 0.40,
        cx + sx * fl * 0.44, cy + sy * fl * 0.24,
        cx + sx * fl * 0.30, cy + sy * fl * 0.22);
      g.bezierCurveTo(
        cx + sx * fl * 0.18, cy + sy * fl * 0.205,
        cx + sx * fl * 0.18, cy + sy * fl * 0.36,
        ex, ey);
      // a second, shorter leaf sweeping down the side edge
      g.moveTo(cx + sx * fl * 0.05, cy + sy * fl * 0.98);
      g.bezierCurveTo(
        cx + sx * fl * 0.01, cy + sy * fl * 0.55,
        cx + sx * fl * 0.12, cy + sy * fl * 0.28,
        cx + sx * fl * 0.34, cy + sy * fl * 0.19);
    }
    // shadow recess
    ctx.save();
    ctx.strokeStyle = 'rgba(6,8,16,0.5)';
    ctx.lineWidth = flLw + 0.9;
    ctx.translate(0, 0.6);
    ribbon(ctx); ctx.stroke();
    ctx.restore();
    // lit gold ribbon
    ctx.save();
    ctx.strokeStyle = 'rgba(240,199,102,0.55)';
    ctx.lineWidth = flLw;
    ribbon(ctx); ctx.stroke();
    ctx.restore();
    // a tiny gilt bead at the volute eye
    ctx.beginPath();
    ctx.arc(ex, ey, Math.max(0.8, flLw * 0.95), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,233,168,0.55)';
    ctx.fill();
  }

  drawFlourish(ix, iy, 1, 1);
  drawFlourish(ix + iw, iy, -1, 1);
  drawFlourish(ix, iy + ih, 1, -1);
  drawFlourish(ix + iw, iy + ih, -1, -1);

  // ── 5. top-centre keystone tick — a small engraved anchor for the eye ──
  if (!small) {
    var kx = x + w / 2, ky = y + m2, kw = fl * 0.34;
    ctx.save();
    // shadow recess for the keystone (matches the intaglio rules)
    ctx.strokeStyle = 'rgba(6,8,16,0.5)';
    ctx.lineWidth = flLw + 0.9;
    ctx.translate(0, 0.6);
    ctx.beginPath();
    ctx.moveTo(kx - kw, ky);
    ctx.quadraticCurveTo(kx, ky + fl * 0.24, kx + kw, ky);
    ctx.stroke();
    ctx.restore();
    // lit gold keystone loop, riding the top rule
    ctx.save();
    ctx.strokeStyle = 'rgba(240,199,102,0.48)';
    ctx.lineWidth = flLw;
    ctx.beginPath();
    ctx.moveTo(kx - kw, ky);
    ctx.quadraticCurveTo(kx, ky + fl * 0.24, kx + kw, ky);
    ctx.stroke();
    // little pendant bead + the eye
    ctx.beginPath();
    ctx.arc(kx, ky + fl * 0.14, Math.max(0.9, flLw * 1.05), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,233,168,0.55)';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
};
