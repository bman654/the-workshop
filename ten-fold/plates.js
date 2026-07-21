/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — THE PLATES (the estate's own ink)

   Twenty-five plates, forged in-house, nothing foraged. Each is a function

       PlateArt.<key> = function (g, u, a, t, anchor)

   drawing into `g`, whose origin is ALREADY at the plate's centre. Draw in UNIT
   space: x,y ∈ [−0.5, +0.5] scaled by `u` (the plate's side, in px). `a` is the
   plate's presence (0..1), `t` seconds, `anchor` the [x,y] where this plate's
   CHILD will land.

   TWO HARD RULES, both about the gaps between decades.

   (1) FIELD TEXTURE. At a multi-decade gap an outgoing plate is magnified a
       hundred- to ten-thousand-fold. A drawing made only of smooth washes and
       gradients becomes three fat smears. So every plate carries a `grain()`
       field on top of its drawing — speckle authored in OCTAVES, of which only
       the ones currently landing between about half a pixel and a couple of
       dozen are drawn. Blow the plate up and the coarse octave leaves the range
       while a finer one enters it: the texture is scale-free, so the picture
       stays a picture the whole way out. It is not polish. It is the thing that
       keeps the emptiness worth travelling through.

   (2) COMPOSED AROUND THE ANCHOR. The child emerges from `anchor`. Every plate
       draws a plausible SMUDGE there — a blur, a grain of dust, a lit window, a
       knot of cloud — that the child then resolves into. An anchor landing on
       blank paper makes the whole nesting read as a sticker.
   ════════════════════════════════════════════════════════════════════════════ */

const PlateArt = {};

/* ── the ink kit ─────────────────────────────────────────────────────────── */
function tfRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function tfStroke(g, c, w) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; }

/* cached scatter — [x, y, b] with x,y in [−0.5,0.5] and b a brightness roll */
const TF_PTS = new Map();
function tfPts(seed, n) {
  const k = seed + ':' + n;
  let P = TF_PTS.get(k);
  if (!P) {
    const r = tfRng(seed); P = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { P[i * 3] = r() - 0.5; P[i * 3 + 1] = r() - 0.5; P[i * 3 + 2] = r(); }
    TF_PTS.set(k, P);
  }
  return P;
}

/* THE FIELD TEXTURE — scale-free grain in four octaves. Only the octaves whose
   dots currently fall in a legible pixel range are drawn, so the cost is flat
   and the detail never runs out. */
const TF_OCT = [[0.00040, 1200], [0.0016, 900], [0.0072, 520], [0.030, 200], [0.098, 60]];
function grain(g, u, a, seed, tint, dens, soft) {
  g.fillStyle = tint;
  for (let o = 0; o < TF_OCT.length; o++) {
    const s = TF_OCT[o][0], n = TF_OCT[o][1], px = s * u;
    /* only the octave currently landing between a third of a pixel and about
       seven draws: coarser reads as bokeh, finer as nothing. Because the
       octaves step by ~4x, at any magnification at least one lands in the
       window — until the blow-up outruns even the finest, at which point the
       page's own glass grain (a screen-space field) takes over. */
    if (px < 0.34 || px > 7) continue;
    const P = tfPts(seed * 131 + o, n);
    for (let i = 0; i < n; i++) {
      const b = P[i * 3 + 2];
      g.globalAlpha = a * dens * (0.08 + 0.62 * b * b);
      if (soft && px > 3.0) {
        g.beginPath(); g.arc(P[i * 3], P[i * 3 + 1], s * (0.30 + 0.45 * b), 0, 6.283); g.fill();
      } else {
        g.fillRect(P[i * 3], P[i * 3 + 1], s * 1.4, s * 1.4);
      }
    }
  }
  g.globalAlpha = 1;
}

/* THE SMUDGE the child resolves out of — every plate calls this at its anchor */
function smudge(g, anchor, r, tint, a, seed) {
  if (!anchor) return;
  const [x, y] = anchor;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${tint},${0.42 * a})`);
  gr.addColorStop(0.45, `rgba(${tint},${0.15 * a})`);
  gr.addColorStop(1, `rgba(${tint},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  const rr = tfRng(seed || 5);
  g.fillStyle = `rgba(${tint},${0.30 * a})`;
  for (let i = 0; i < 9; i++) {
    const th = rr() * 6.283, d = Math.pow(rr(), 0.6) * r * 0.8;
    g.beginPath(); g.arc(x + Math.cos(th) * d, y + Math.sin(th) * d, r * (0.03 + 0.07 * rr()), 0, 6.283); g.fill();
  }
}

/* ═══ −15  THE NUCLEUS ════════════════════════════════════════════════════ */
PlateArt.nucleus = function (g, u, a, t, anchor) {
  const r = tfRng(7); g.save(); g.scale(u, u);
  const halo = g.createRadialGradient(0, 0, 0, 0, 0, 0.30);
  halo.addColorStop(0, `rgba(255,214,150,${0.16 * a})`); halo.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = halo; g.beginPath(); g.arc(0, 0, 0.30, 0, 6.283); g.fill();
  for (let i = 0; i < 26; i++) {
    const th = r() * 6.283, rr = Math.sqrt(r()) * 0.17;
    const wob = Math.sin(t * 0.7 + i) * 0.004;
    const x = Math.cos(th) * rr + wob, y = Math.sin(th) * rr - wob, s = 0.036 + r() * 0.012;
    const gr = g.createRadialGradient(x - s * 0.32, y - s * 0.32, 0, x, y, s);
    const neutron = r() > 0.52;
    gr.addColorStop(0, neutron ? `rgba(226,222,214,${0.78 * a})` : `rgba(255,232,178,${0.88 * a})`);
    gr.addColorStop(1, neutron ? `rgba(96,96,102,${0.10 * a})` : `rgba(190,120,44,${0.10 * a})`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, s, 0, 6.283); g.fill();
    tfStroke(g, `rgba(60,34,10,${0.5 * a})`, 0.004); g.stroke();
  }
  grain(g, u, a, 7, 'rgba(255,222,170,1)', 0.30, true);
  g.restore();
};

/* ═══ −12  THE ATOM'S EMPTY ROOM ══════════════════════════════════════════ */
PlateArt.emptyroom = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u);
  /* nearly all of it is nothing — one hard speck at the centre, and the far
     wall of probability so distant it is only a rumour at the frame's edge. */
  const gr = g.createRadialGradient(0, 0, 0.002, 0, 0, 0.052);
  gr.addColorStop(0, `rgba(255,236,190,${0.95 * a})`); gr.addColorStop(1, 'rgba(255,180,70,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 0.052, 0, 6.283); g.fill();
  tfStroke(g, `rgba(150,170,210,${0.13 * a})`, 0.0025);
  for (const rr of [0.30, 0.44]) { g.beginPath(); g.arc(0, 0, rr, 0, 6.283); g.stroke(); }
  const r = tfRng(211);
  for (let i = 0; i < 3; i++) {              // three electrons, far out, faint
    const th = r() * 6.283 + t * 0.12 * (i + 1), rr = 0.34 + i * 0.045;
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr * 0.86;
    const e = g.createRadialGradient(x, y, 0, x, y, 0.030);
    e.addColorStop(0, `rgba(190,214,255,${0.5 * a})`); e.addColorStop(1, 'rgba(190,214,255,0)');
    g.fillStyle = e; g.beginPath(); g.arc(x, y, 0.030, 0, 6.283); g.fill();
  }
  grain(g, u, a, 211, 'rgba(180,198,236,1)', 0.30, true);
  smudge(g, anchor, 0.055, '255,226,178', a * 0.8, 211);
  g.restore();
};

/* ═══ −10  THE CARBON ATOM ════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — plate  −10  THE CARBON ATOM

   The honest picture, and it is almost entirely nothing.

   THREE DECISIONS, all of them arguments about honesty:

   1 — THE CLOUD IS A DENSITY, NOT A DRAWING. There is no shell and no orbit
       here. What there is, is a probability of finding ink: a tight 1s
       condensation at the middle, a broad limb-brightened haze where the four
       valence electrons live (which is where any suggestion of "a shell"
       comes from — it is a statistic, not a wall), and fog. Every dot is a
       coin flipped against that density, so the picture is stipple end to
       end and can never soften into a wash.

   2 — THE STIPPLE IS LAID ON AN INFINITE LATTICE, NOT A FIXED POINT SET.
       Each rung is a jittered grid of pitch s = 0.36·2^(−k/2), forty-eight
       rungs deep, and the plate rasterises only the cells that are actually
       ON SCREEN — it reads its own transform to find out which. So magnifi-
       cation does not stretch a finite scatter into bokeh: the coarse rung
       leaves the legible band, a finer one enters it, and the grain that
       arrives has never been drawn before. Clumping is inherited from parent,
       grandparent and great-grandparent, so the field curdles into knots and
       voids at four, sixteen and sixty-four grains across AT ONCE — which is
       what keeps a three-hundred-fold blow-up from being television static.

   3 — THE NUCLEUS IS DRAWN AT A CONSTANT PIXEL SIZE. It is 1/100 000 of the
       atom; drawn to scale at u = 600 px it would be four thousandths of a
       pixel, and drawn at ANY size that reads it is a lie about how empty
       this is. So it is a hard two-pixel speck that never grows. Magnify the
       plate ten thousandfold and the cloud dissolves into finer and finer
       stipple while the nucleus stays exactly the same unreachable point —
       which is the true relationship between the two, expressed as a rule
       about ink rather than as a picture of a ball.

   Below about seventy pixels the plate stops being resolvable at all, so it
   stops pretending: the stipple hands over to the tight integrated glow you
   would actually see of something that small, with the nucleus still hard at
   the middle of it. Cool blue-white against the warm dark; parchment reserved
   for the innermost knot, and gold for the nucleus alone.

   Nothing on this plate ever moves. Only the odds do: the 2p lean turns once
   in about eighty seconds, and every grain's ink breathes on a thirty-second
   re-roll — the field shimmers without one point travelling. Both freeze
   under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EXT = 0.52;                       /* nothing of this plate lies outside  */
  var TAU = 6.283185307179586;

  /* ── THE LATTICE LADDER: pitch in unit space, each rung a root-two step
       finer than the last, forty-eight rungs deep — down to thirty billionths
       of a unit, which is further than five decades of travel can reach.
       Root-two rather than the obvious quartering, for the reason that
       decides the whole plate's behaviour: three rungs stand in the legible
       band at once instead of one, the crossfade between them is gentle, and
       the finest rung ever walked is within a root of two of the band's
       floor. That last is what stops the plate's grain count — and its cost,
       which is the same thing — from swinging by sixteen as u sweeps.      */
  var OCT = [];
  for (var _s = 0.36, _k = 0; _k < 48; _k++, _s *= 0.7071067811865476) OCT.push(_s);

  /* THE LEGIBLE BAND, in screen pixels: outside it a rung reads as bokeh (too
     coarse) or as nothing (too fine), so it is not drawn. Its floor is not a
     constant — it is set by how much glass the plate is covering THIS FRAME,
     so that the number of cells walked comes out near enough the same whether
     the plate is six hundred pixels across or a hundred thousand. A plate at
     its own decade therefore gets grain about a pixel across; the same plate
     magnified ten thousandfold, whose finest grain no screen could separate
     anyway, gets grain three or four pixels across and the same weight of
     ink. And because the floor moves CONTINUOUSLY with u, no rung is ever
     dropped: the band slides, and the crossfade does what it always did. */
  var P_MIN = 1.05, P_SPAN = 2.83, P_LN = Math.log(P_SPAN), CELL_CAP = 70000;

  /* ── an integer hash: the same cell always gets the same dot ───────────── */
  function ah(ix, iy, k) {
    var n = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(k, 1442695041)) | 0;
    n ^= n >>> 13; n = Math.imul(n, 1274126177); n ^= n >>> 15;
    return (n >>> 0) / 4294967296;
  }

  function sstep(e0, e1, x) {
    var q = (x - e0) / (e1 - e0);
    q = q < 0 ? 0 : (q > 1 ? 1 : q);
    return q * q * (3 - 2 * q);
  }

  /* ── the radial density, tabulated once ────────────────────────────────── */
  /*  core  — the 1s condensation plus the general fog it sits in
      val   — the valence haze, limb-brightened at the covalent radius; this
              is the only term the 2p anisotropy touches.                     */
  var LN = 1024, LR = 0.52, D_CORE = new Float32Array(LN), D_VAL = new Float32Array(LN);
  (function () {
    for (var i = 0; i < LN; i++) {
      var r = (i + 0.5) / LN * LR;
      var fade = 1 - sstep(0.360, 0.495, r);          /* no edge, no shell     */
      D_CORE[i] = (1.150 * Math.exp(-Math.pow(r / 0.034, 2))     /* the 1s knot */
                 + 0.520 * Math.exp(-Math.pow(r / 0.115, 2))     /* falling off */
                 + 0.055 * Math.exp(-Math.pow(r / 0.340, 2))) * fade;   /* fog  */
      D_VAL[i] = 0.155 * Math.exp(-Math.pow((r - 0.235) / 0.105, 2)) * fade;
    }
  })();

  /* ── what part of unit space is actually on the glass right now ────────── */
  function visible(g) {
    var box = { x0: -EXT, y0: -EXT, x1: EXT, y1: EXT };
    var cv = g.canvas, m = g.getTransform ? g.getTransform() : null;
    if (!cv || !m) return box;
    var det = m.a * m.d - m.b * m.c;
    if (!det || !isFinite(det)) return box;
    var ia = m.d / det, ib = -m.b / det, ic = -m.c / det, id = m.a / det;
    var ie = (m.c * m.f - m.d * m.e) / det, iff = (m.b * m.e - m.a * m.f) / det;
    var W = cv.width, H = cv.height;
    var xs = [], ys = [];
    for (var i = 0; i < 4; i++) {
      var px = (i & 1) ? W : 0, py = (i & 2) ? H : 0;
      xs.push(ia * px + ic * py + ie);
      ys.push(ib * px + id * py + iff);
    }
    box.x0 = Math.max(-EXT, Math.min.apply(null, xs));
    box.x1 = Math.min(EXT, Math.max.apply(null, xs));
    box.y0 = Math.max(-EXT, Math.min.apply(null, ys));
    box.y1 = Math.min(EXT, Math.max.apply(null, ys));
    return box;
  }

  /* ── the inks ──────────────────────────────────────────────────────────── */
  /*  three and no fourth: parchment ONLY in the innermost knot, the cool body
      of the cloud, and a colder thinner ink outside. Every boundary between
      them is dithered by the grain's own roll, so the tint turns over without
      a circle ever being drawn — the one thing an atom must not have.        */
  var INK = ['rgb(228,218,198)', 'rgb(178,202,236)', 'rgb(142,168,210)'];
  var INK_A = [0.72, 0.80, 0.70];
  var RMOTION = (typeof matchMedia === 'function')
    ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  function field(g, u, a, t, box, anchor) {
    var w = box.x1 - box.x0, h = box.y1 - box.y0;
    if (w <= 0 || h <= 0) return;

    /* where the band sits this frame, and which rungs land inside it */
    var areaPx = w * h * u * u;
    var P_LO = Math.max(P_MIN, Math.sqrt(areaPx / CELL_CAP)), P_HI = P_LO * P_SPAN;
    var wt = [], tot = 0, o;
    for (o = 0; o < OCT.length; o++) {
      var p = OCT[o] * u, ww = 0;
      if (p > P_LO && p < P_HI) ww = Math.pow(Math.sin(Math.PI * Math.log(p / P_LO) / P_LN), 0.85);
      wt.push(ww); tot += ww;
    }
    if (tot <= 0.0001) return;

    /* The 2p lobes lean, and the lean turns once in about eighty seconds; the
       ink itself re-rolls on a thirty-second breath. Both are far too slow to
       see as motion, and that is the point — no POSITION on this plate ever
       changes, so there is nothing that can jitter. Only the odds move. */
    var still = RMOTION && RMOTION.matches;
    var phi = 0.62 + (still ? 0 : t * 0.038), c2 = Math.cos(2 * phi), s2 = Math.sin(2 * phi);
    var tt = still ? 0 : (t * 0.032) % 1;             /* the ink's own phase   */
    var ax = anchor ? anchor[0] : 0, ay = anchor ? anchor[1] : 0, hasA = !!anchor;
    var scaleR = LN / LR, lastTint = -1;

    for (o = 0; o < OCT.length; o++) {
      if (wt[o] <= 0.004) continue;
      var s = OCT[o], px = s * u, wgt = wt[o] / tot;
      var i0 = Math.floor(box.x0 / s), i1 = Math.ceil(box.x1 / s);
      var j0 = Math.floor(box.y0 / s), j1 = Math.ceil(box.y1 / s);
      if ((i1 - i0) * (j1 - j0) > 260000) continue;         /* a hard safety   */
      /* a grain keeps its pixel weight, and is never allowed to become a
         block: one to two pixels of ink, at every magnification there is. */
      var dot = Math.min(2.2, Math.max(0.85, 0.34 * px)) / u;
      var k3 = o * 7 + 3, k4 = o * 7 + 4, k7 = o * 7 + 7;
      for (var jy = j0; jy <= j1; jy++) {
        /* the clump cells this row falls in — hoisted, because the clumping
           is what the field costs most and it changes once every four grains,
           not once every grain */
        var by2 = jy >> 2, by4 = jy >> 4, by6 = jy >> 6;
        var lastBx = 0x7fffffff, cl = 1;
        for (var ix = i0; ix <= i1; ix++) {
          var bx2 = ix >> 2;
          if (bx2 !== lastBx) {
            lastBx = bx2;
            /* clumping inherited from the parent, grandparent and great-grand-
               parent cell, so the field curdles at four, sixteen and sixty-four
               grains across at once. The amplitude is deep on purpose: it is
               the whole difference between a stipple and a grey noise. */
            cl = (0.42 + 1.30 * ah(bx2, by2, k3)) *
                 (0.50 + 1.05 * ah(ix >> 4, by4, k4)) *
                 (0.62 + 0.80 * ah(ix >> 6, by6, k7));
          }
          var hx = ah(ix, jy, o * 7 + 1);
          var hy = ah(ix, jy, o * 7 + 2);
          var x = (ix + 0.12 + 0.76 * hx) * s;
          var y = (jy + 0.12 + 0.76 * hy) * s;
          var rr2 = x * x + y * y;
          if (rr2 > 0.2704) continue;                       /* 0.52²           */
          var r = Math.sqrt(rr2);
          var li = (r * scaleR) | 0; if (li >= LN) continue;
          /* cos 2(θ − φ) without a trig call */
          var an = rr2 > 1e-12 ? ((x * x - y * y) * c2 + 2 * x * y * s2) / rr2 : 0;
          var d = D_CORE[li] + D_VAL[li] * (1 + 0.26 * an);
          if (hasA) {                       /* the child's knot: a THICKENING  */
            var dx = x - ax, dy = y - ay, d2 = dx * dx + dy * dy;
            if (d2 < 0.0025) d = d + 0.105 * Math.exp(-d2 / 0.00030);
          }
          if (d < 0.0016) continue;
          /* how solidly inked this part of the cloud is. Everything below keys
             off the DENSITY rather than off the radius, so the plate behaves
             the same way in the thin outskirts as it does in a thin frame of
             a deep magnification. */
          var dw = d > 0.55 ? 1 : d / 0.55;
          /* where the cloud is thin, MANY more grains and all of them dim —
             fog is made of a great deal of very little */
          var prob = 0.215 * d * cl * (1 + 1.05 * (1 - dw));
          if (prob > 0.52) prob = 0.52;     /* the cap kept low, so the knots
                                               and the voids stay legible      */
          var hs = ah(ix, jy, o * 7 + 5);
          if (hs > prob) continue;
          var hb = ah(ix, jy, o * 7 + 6);

          var tint = r < 0.011 + 0.013 * hb ? 0 : (r < 0.235 + 0.095 * hb ? 1 : 2);
          if (tint !== lastTint) { g.fillStyle = INK[tint]; lastTint = tint; }

          /* BRIGHTNESS. Deep in the cloud the grain values run wide — a long
             dim tail with the occasional bright point, which is what makes a
             field read as INK rather than as noise. Out in the fog that top
             tail is compressed away: an isolated bright grain on black is a
             star, and this is not a star cluster. */
          var vb = dw * (0.15 + 0.92 * hb * hb) + (1 - dw) * (0.13 + 0.15 * hb);
          /* the ink's slow re-roll — a triangle wave on the grain's own phase,
             so the field breathes and not one grain travels */
          var vp = hx + tt; vp -= vp | 0;
          var shim = 1 + 0.17 * (4 * Math.abs(vp - 0.5) - 1);

          g.globalAlpha = a * wgt * 2.60 * vb * shim *
                          (0.80 + 0.46 * (d > 1 ? 1 : d)) * INK_A[tint];
          g.fillRect(x, y, dot, dot);
        }
      }
    }
    g.globalAlpha = 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  PlateArt.atom = function (g, u, a, t, anchor) {
    if (!(a > 0)) return;
    g.save();
    g.scale(u, u);

    var box = visible(g);

    /* — below resolution the plate stops pretending it is stippled and shows
         the integrated glow you would actually see of something this small.
         Tight, not woolly: at fifteen pixels this plate has to ANNOUNCE that
         something is out there, and a wide soft smear announces nothing. —  */
    var haze = 1 - sstep(22, 78, u);
    if (haze > 0.002) {
      var hg = g.createRadialGradient(0, 0, 0, 0, 0, 0.34);
      hg.addColorStop(0.00, 'rgba(234,244,255,' + (0.92 * a * haze) + ')');
      hg.addColorStop(0.14, 'rgba(206,226,252,' + (0.44 * a * haze) + ')');
      hg.addColorStop(0.36, 'rgba(174,198,234,' + (0.16 * a * haze) + ')');
      hg.addColorStop(0.68, 'rgba(152,178,216,' + (0.040 * a * haze) + ')');
      hg.addColorStop(1.00, 'rgba(140,166,204,0)');
      g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 0.34, 0, TAU); g.fill();
    }

    /* — the cloud — */
    field(g, u, a * (1 - 0.55 * haze), t, box, anchor);

    /* — the smudge the child grows out of: a knot in the fog, not a marker
         and above all not a second body. The density field above already
         thickens the stipple here; this is only the unresolved haze around
         it, kept dim and tight, and dropped once the plate is magnified
         enough that a gradient would read as a smear. —                     */
    if (anchor && u < 6000) {
      var ax = anchor[0], ay = anchor[1];
      var kg = g.createRadialGradient(ax, ay, 0, ax, ay, 0.030);
      kg.addColorStop(0, 'rgba(200,218,246,' + (0.055 * a) + ')');
      kg.addColorStop(0.5, 'rgba(188,208,240,' + (0.020 * a) + ')');
      kg.addColorStop(1, 'rgba(186,208,238,0)');
      g.fillStyle = kg; g.beginPath(); g.arc(ax, ay, 0.030, 0, TAU); g.fill();
    }

    /* — the engraver's construction line: the covalent radius taken as an
         instrument reading, drawn BROKEN so it can never be mistaken for a
         shell, and in the cloud's own cold ink so that nothing on this plate
         but the nucleus is gold. —                                          */
    if (u > 140 && u < 9000) {
      var hair = Math.max(0.9, 0.0006 * u) / u;
      g.lineWidth = hair; g.lineCap = 'butt';
      g.strokeStyle = 'rgba(150,176,214,' + (0.165 * a) + ')';
      var t0 = -0.74, t1 = 0.30;                /* one reading, opened out     */
      g.beginPath(); g.arc(0, 0, 0.235, t0, t1); g.stroke();
      g.beginPath(); g.arc(0, 0, 0.235, t0 + Math.PI, t1 + Math.PI - 0.34); g.stroke();
      for (var k = 0; k < 2; k++) {             /* the caliper's own two ticks */
        var th2 = k ? t1 : t0, cx = Math.cos(th2), cy = Math.sin(th2);
        g.beginPath();
        g.moveTo(cx * 0.216, cy * 0.216); g.lineTo(cx * 0.254, cy * 0.254); g.stroke();
      }
    }

    /* — THE NUCLEUS. Two pixels, forever — and never fewer than one, so the
         arriving mote still has something hard at the middle of it. —       */
    var nr = Math.max(1.1 / u, Math.min(2.0 / u, 0.0032));
    var hr = Math.max(3.4 / u, Math.min(6.0 / u, 0.010));
    var ng = g.createRadialGradient(0, 0, 0, 0, 0, hr);
    ng.addColorStop(0, 'rgba(255,226,158,' + (0.34 * a) + ')');
    ng.addColorStop(1, 'rgba(255,196,90,0)');
    g.fillStyle = ng; g.beginPath(); g.arc(0, 0, hr, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,238,196,' + (0.96 * a) + ')';
    g.beginPath(); g.arc(0, 0, nr, 0, TAU); g.fill();

    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.restore();
  };
})();

/* ═══ −9  THE MOLECULAR LATTICE ═══════════════════════════════════════════ */
PlateArt.lattice = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(17);
  /* cellulose: hexagonal rings laced by hydrogen bonds — a rigid weave you can
     see is a WEAVE, which is why the leaf can stand up. */
  const A = 0.115, rows = 5, cols = 5;
  const node = [];
  for (let i = -rows; i <= rows; i++) for (let j = -cols; j <= cols; j++) {
    const x = (j + (i % 2 ? 0.5 : 0)) * A + (r() - 0.5) * 0.008;
    const y = i * A * 0.866 + (r() - 0.5) * 0.008;
    if (Math.abs(x) < 0.52 && Math.abs(y) < 0.52) node.push([x, y, r()]);
  }
  tfStroke(g, `rgba(168,196,214,${0.26 * a})`, 0.0038);
  for (let i = 0; i < node.length; i++) for (let j = i + 1; j < node.length; j++) {
    const L = Math.hypot(node[i][0] - node[j][0], node[i][1] - node[j][1]);
    if (L > A * 1.08) continue;
    g.beginPath(); g.moveTo(node[i][0], node[i][1]); g.lineTo(node[j][0], node[j][1]); g.stroke();
  }
  for (const [x, y, b] of node) {
    const gr = g.createRadialGradient(x, y, 0, x, y, 0.026);
    gr.addColorStop(0, b > 0.72 ? `rgba(226,236,255,${0.7 * a})` : `rgba(214,206,178,${0.55 * a})`);
    gr.addColorStop(1, 'rgba(180,190,200,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 0.026, 0, 6.283); g.fill();
  }
  grain(g, u, a, 17, 'rgba(196,214,226,1)', 0.32, false);
  smudge(g, anchor, 0.070, '196,220,236', a * 0.7, 17);
  g.restore();
};

/* ═══ −6  THE CHLOROPLAST ═════════════════════════════════════════════════ */
PlateArt.chloro = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(23);
  tfStroke(g, `rgba(160,196,140,${0.55 * a})`, 0.006);
  g.fillStyle = `rgba(52,84,58,${0.34 * a})`;
  g.beginPath(); g.ellipse(0, 0, 0.42, 0.26, 0.14, 0, 6.283); g.fill(); g.stroke();
  g.save(); g.beginPath(); g.ellipse(0, 0, 0.42, 0.26, 0.14, 0, 6.283); g.clip();
  for (let k = 0; k < 8; k++) {                       // grana — stacked thylakoid coins
    const x = -0.30 + k * 0.085 + r() * 0.02, y = (r() - 0.5) * 0.22;
    for (let i = 0; i < 6; i++) {
      const yy = y - 0.040 + i * 0.016;
      tfStroke(g, `rgba(190,220,160,${(0.28 + 0.24 * r()) * a})`, 0.0055);
      g.beginPath(); g.moveTo(x - 0.036, yy); g.lineTo(x + 0.036, yy); g.stroke();
    }
  }
  tfStroke(g, `rgba(150,192,146,${0.20 * a})`, 0.0032);   // the stroma lamellae between
  for (let k = 0; k < 6; k++) {
    g.beginPath(); g.moveTo(-0.34, -0.14 + k * 0.056);
    g.quadraticCurveTo(0, -0.10 + k * 0.056 + (r() - 0.5) * 0.05, 0.34, -0.15 + k * 0.056); g.stroke();
  }
  grain(g, u, a, 23, 'rgba(178,214,156,1)', 0.34, false);
  g.restore();
  smudge(g, anchor, 0.075, '206,236,178', a * 0.75, 23);
  g.restore();
};

/* ═══ −5  THE LEAF CELL ═══════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — −5  THE LEAF CELL      (foundry take 2)

   THE DIRECTION: not "a plant cell", but "a plant cell ON A SLIDE, at 40x".
   Everything here is an OPTICAL fact rather than an anatomical one —

     · ONE focal plane. The cell is a thick object; the objective can only hold
       one depth of it. Chloroplasts above and below that plane are drawn as
       genuine defocus (canvas blur in UNIT space, so it magnifies with the
       picture the way real defocus does) and only the ones ON the plane keep
       their rim and their grana.
     · NEIGHBOURS. A slide never shows you one isolated cell — the frame cuts
       through the walls of the cells around it. Nothing kills a textbook
       diagram faster than a frame that is obviously a crop.
     · LATERAL CHROMATIC ABERRATION. Every wall carries a warm fringe on the
       side away from the optical axis and a cool one toward it, and the axis is
       NOT at the centre of the frame.
     · DUST ON THE COVERSLIP, hopelessly out of focus, sitting over everything.
     · The condenser's cone lights the field unevenly and off-centre.

   THE FIELD TEXTURE is the part that had to be re-thought. The shipped grain()
   authors five fixed octaves and draws only the one currently landing in a
   legible pixel band — which works until the blow-up outruns the finest, at
   about 300x, exactly where the bench's third panel looks. So this plate does
   not author octaves at all: it reads its own transform, works out WHICH PATCH
   OF THE CELL IS ON SCREEN and at what magnification, and hashes a granular
   field into that patch at whatever cell size currently lands at ~2-8 px. There
   is no finest octave. Blow it up ten thousand times and it is still cytoplasm.
   And the grain FLOWS: every speck and filament is laid along the local
   direction of cytoplasmic streaming, so the texture is not noise, it is the
   cell's own current — the same current the chloroplasts are riding.

   THE ANCHOR at [0.14, -0.10] is the one chloroplast in perfect focus, out on a
   transvacuolar strand that crosses the frame's middle. It is the sharpest
   object in the picture because it is the one we are about to fall into.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── private kit (tfc*: namespaced, no collision with plates.js) ─────────── */

var TFC_TAU = 6.283185307179586;

function tfcH(i, j, s) {                     /* stable integer hash → [0,1) */
  var h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(s | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 15), 2654435761);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/* the wall. A leaf cell is neither a circle nor a rounded box — it is a lobed,
   uneven thing pressed out of shape by the cells around it. A soft superellipse
   for the squat proportion, then LOW-frequency lobing (2nd and 3rd harmonics
   carrying most of it) so no two quadrants of the perimeter match. */
function tfcWallR0(th) {
  var c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)), n = 2.42;
  var box = 1 / Math.pow(Math.pow(c / 0.462, n) + Math.pow(s / 0.352, n), 1 / n);
  return box * (1 + 0.072 * Math.sin(th * 2 - 0.42) + 0.058 * Math.sin(th * 3 + 1.1)
                  + 0.031 * Math.sin(th * 5 - 0.6) + 0.015 * Math.sin(th * 9 + 2.2)
                  + 0.008 * Math.sin(th * 14 - 1.4));
}
/* …and the same thing as a table. The field asks for the wall radius once per
   lattice cell — tens of thousands of times a frame in the gap — and seven
   transcendentals apiece was the single largest cost in the plate. 1024 steps
   is finer than a tenth of a pixel of boundary at any magnification the room
   reaches, and it is interpolated, so the silhouette is unchanged. */
var TFC_WLUT = (function () {
  var T = new Float64Array(1025);
  for (var i = 0; i <= 1024; i++) T[i] = tfcWallR0(i / 1024 * TFC_TAU);
  return T;
})();
function tfcWallR(th) {
  var f = th / TFC_TAU;
  f = (f - Math.floor(f)) * 1024;
  var i = f | 0, k = f - i;
  return TFC_WLUT[i] * (1 - k) + TFC_WLUT[i + 1] * k;
}

/* the transvacuolar strand — a quadratic bezier that crosses the middle of the
   frame and passes through the anchor at s ≈ 0.72 */
var TFC_S0 = [-0.34, 0.24], TFC_S1 = [-0.02, 0.02], TFC_S2 = [0.34, -0.26];
function tfcStrand(s) {
  var q = 1 - s, b0 = q * q, b1 = 2 * s * q, b2 = s * s;
  return [b0 * TFC_S0[0] + b1 * TFC_S1[0] + b2 * TFC_S2[0],
          b0 * TFC_S0[1] + b1 * TFC_S1[1] + b2 * TFC_S2[1]];
}
var TFC_SP = (function () { var P = []; for (var i = 0; i <= 22; i++) P.push(tfcStrand(i / 22)); return P; })();
var TFC_SB;
/* the strands' bounding boxes, so the per-lattice-cell distance loops can be
   skipped outright for the large majority of the frame that is nowhere near a
   strand — the loops themselves are what is left of this plate's cost */
function tfcBBox(P) {
  var b = [9, 9, -9, -9];
  for (var i = 0; i < P.length; i++) {
    if (P[i][0] < b[0]) b[0] = P[i][0]; if (P[i][1] < b[1]) b[1] = P[i][1];
    if (P[i][0] > b[2]) b[2] = P[i][0]; if (P[i][1] > b[3]) b[3] = P[i][1];
  }
  return b;
}
function tfcStrandD(x, y) {                  /* distance to the strand */
  var b = TFC_SB;
  if (x < b[0] - 0.20 || x > b[2] + 0.20 || y < b[1] - 0.20 || y > b[3] + 0.20) return 9;
  var best = 9;
  for (var i = 0; i < TFC_SP.length; i++) {
    var dx = x - TFC_SP[i][0], dy = y - TFC_SP[i][1], d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* a second strand — it BRANCHES off the first and runs down to the wall. Two
   strands crossing would draw a tidy X through the middle, and a tidy X is the
   one thing a real slide never shows you. */
var TFC_T0 = [-0.111, 0.079], TFC_T1 = [0.010, 0.205], TFC_T2 = [0.115, 0.352];
function tfcStrand2(s) {
  var q = 1 - s, b0 = q * q, b1 = 2 * s * q, b2 = s * s;
  return [b0 * TFC_T0[0] + b1 * TFC_T1[0] + b2 * TFC_T2[0],
          b0 * TFC_T0[1] + b1 * TFC_T1[1] + b2 * TFC_T2[1]];
}
var TFC_TP = (function () { var P = []; for (var i = 0; i <= 18; i++) P.push(tfcStrand2(i / 18)); return P; })();
TFC_SB = tfcBBox(TFC_SP);
var TFC_TB = tfcBBox(TFC_TP);

var TFC_NUC = [-0.268, 0.150];               /* the nucleus, pressed to the wall */

/* how much cytoplasm is at (x,y): a band just inside the wall (the vacuole's
   pressure holds it there), the strand across the middle, the nucleus, and a
   floor everywhere so no magnification ever finds true emptiness. */
function tfcDens(x, y) {
  var th = Math.atan2(y, x), R = tfcWallR(th), q = Math.hypot(x, y) / R;
  var peri = Math.exp(-Math.pow((q - 0.90) / 0.17, 2));
  var str = Math.exp(-Math.pow(tfcStrandD(x, y) / 0.052, 2));
  var d2 = 9;
  if (!(x < TFC_TB[0] - 0.16 || x > TFC_TB[2] + 0.16 || y < TFC_TB[1] - 0.16 || y > TFC_TB[3] + 0.16))
    for (var i = 0; i < TFC_TP.length; i++) {
      var dx = x - TFC_TP[i][0], dy = y - TFC_TP[i][1], dd = dx * dx + dy * dy;
      if (dd < d2) d2 = dd;
    }
  var str2 = Math.exp(-Math.pow(Math.sqrt(d2) / 0.040, 2));
  var nuc = Math.exp(-Math.pow(Math.hypot(x - TFC_NUC[0], y - TFC_NUC[1]) / 0.135, 2));
  var v = 0.15 + 0.92 * peri + 0.86 * str + 0.50 * str2 + 0.42 * nuc;
  if (q > 1) v *= Math.max(0, 1 - (q - 1) * 7);
  return v > 1.25 ? 1.25 : v;
}

/* the direction the cytoplasm is streaming at (x,y): around the wall, or along
   the strand where the strand dominates. Every speck is laid along this. */
function tfcFlow(x, y) {
  var th = Math.atan2(y, x);
  var around = th + Math.PI / 2;
  var d = tfcStrandD(x, y), w = Math.exp(-Math.pow(d / 0.075, 2));
  if (w < 0.02) return around;
  var best = 0, bd = 9;
  for (var i = 0; i < TFC_SP.length; i++) {
    var ddx = x - TFC_SP[i][0], ddy = y - TFC_SP[i][1], dd = ddx * ddx + ddy * ddy;
    if (dd < bd) { bd = dd; best = i; }
  }
  var i0 = Math.max(0, best - 1), i1 = Math.min(TFC_SP.length - 1, best + 1);
  var along = Math.atan2(TFC_SP[i1][1] - TFC_SP[i0][1], TFC_SP[i1][0] - TFC_SP[i0][0]);
  var ax = Math.cos(around) * (1 - w) + Math.cos(along) * w;
  var ay = Math.sin(around) * (1 - w) + Math.sin(along) * w;
  return Math.atan2(ay, ax);
}

/* WHAT IS ON SCREEN, in unit space — read straight off the live transform, so
   the grain can be authored into the visible patch at the right size no matter
   how far in we are. Falls back to the plate's own bounds. */
function tfcVis(g) {
  var W = 1200, H = 760;
  if (g.canvas) { W = g.canvas.width || W; H = g.canvas.height || H; }
  var x0 = -0.58, y0 = -0.58, x1 = 0.58, y1 = 0.58;
  if (g.getTransform) {
    try {
      var m = g.getTransform(), det = m.a * m.d - m.b * m.c;
      if (det) {
        var ia = m.d / det, ib = -m.b / det, ic = -m.c / det, id = m.a / det;
        var ie = (m.c * m.f - m.d * m.e) / det, jf = (m.b * m.e - m.a * m.f) / det;
        var xs = [], ys = [];
        for (var k = 0; k < 4; k++) {
          var px = (k & 1) ? W : 0, py = (k & 2) ? H : 0;
          xs.push(ia * px + ic * py + ie); ys.push(ib * px + id * py + jf);
        }
        x0 = Math.min.apply(null, xs); x1 = Math.max.apply(null, xs);
        y0 = Math.min.apply(null, ys); y1 = Math.max.apply(null, ys);
      }
    } catch (e) { /* keep the fallback */ }
  }
  return [Math.max(x0, -0.58), Math.max(y0, -0.58), Math.min(x1, 0.58), Math.min(y1, 0.58)];
}

/* defocus, in UNIT space — blur that magnifies with the picture, the way a real
   out-of-focus plane does. Returns false (and clears) when it would be nothing. */
function tfcBlur(g, u, unitR) {
  if (typeof g.filter !== 'string') return false;
  var px = unitR * u;
  if (px < 0.4) { g.filter = 'none'; return false; }
  g.filter = 'blur(' + (px > 15 ? 15 : px).toFixed(2) + 'px)';
  return true;
}

/* ── THE GRANULAR FIELD ──────────────────────────────────────────────────────
   No authored octaves. Work out the patch on screen, pick a lattice whose cells
   land at a legible size RIGHT NOW, and hash the cytoplasm into it: specks, a
   coarser scatter of granules, and short filaments laid along the streaming.  */
/* Cytoplasm, not starlight: the field is olive and parchment, and the few
   near-white / gold grains are rare and never the brightest thing per unit
   area. A speck field that sparkles reads as snow over the picture. */
var TFC_TINT = ['196,192,164', '186,184,158', '172,174,148', '164,172,140',
                '152,164,132', '178,188,152', '206,198,170', '214,186,118'];

function tfcField(g, u, a, t) {
  var V = tfcVis(g), x0 = V[0], y0 = V[1], x1 = V[2], y1 = V[3];
  if (x1 <= x0 || y1 <= y0) return;
  var areaPx = (x1 - x0) * (y1 - y0) * u * u;
  if (areaPx < 4) return;
  /* the deeper in we are, the more incident the field must carry: at its own
     decade the drawing does the work, in the gap the field IS the picture */
  var deep = u > 6000 ? 1 : (u < 900 ? 0 : (u - 900) / 5100);
  var budget = 17000 + 12000 * deep;
  var cellPx = Math.sqrt(areaPx / budget);
  if (cellPx < 2.0) cellPx = 2.0;
  var c = cellPx / u;                        /* lattice cell, in unit space */
  /* NO positional drift. At the finest lattice a drift of even a thousandth of
     a unit is thousands of grain-widths per second and would strobe in the gap.
     The bodies creep; the field holds still — which is exactly what a real
     slide looks like. */
  var drift = 0;

  /* BINNING. Drawn one mark at a time this field cost 40 ms/frame in the gap —
     tens of thousands of separate canvas calls, which is how a plate like this
     ships broken. Every mark instead goes into a Path2D bucket keyed by its
     tint and its alpha rounded to one of eight steps, and each bucket is filled
     or stroked ONCE. Same picture, a couple of hundred calls instead of tens of
     thousands. The bucket key carries the layer too, because a layer's stroke
     width is constant within it. */
  /* deep in the gap the bodies have handed their pale rims and grana over to
     the field (they are too big to describe themselves any more), so the field
     takes up that light — otherwise the picture goes murky exactly where it is
     the only thing left. */
  var boost = 1 + 0.50 * deep;
  var BK = {}, bkN = 0;
  function bucket(lay2, tint2, alpha, mode) {
    if (!(alpha > 0.002)) return null;
    var q = Math.min(7, (alpha * 8 / 0.42) | 0);           /* eight alpha steps */
    var key = lay2 + '|' + tint2 + '|' + q + '|' + mode;
    var b = BK[key];
    if (!b) { b = BK[key] = { p: new Path2D(), c: 'rgba(' + tint2 + ',' + ((q + 0.5) * 0.42 / 8).toFixed(4) + ')', m: mode, l: lay2 }; bkN++; }
    return b.p;
  }

  var lay, i, j, h, hx, hy, x, y, d, s, tint;
  for (lay = 0; lay < 4; lay++) {
    var cs = c * (lay === 0 ? 1 : lay === 1 ? 3 : lay === 2 ? 5.5 : 13);
    var i0 = Math.floor(x0 / cs), i1 = Math.ceil(x1 / cs);
    var j0 = Math.floor(y0 / cs), j1 = Math.ceil(y1 / cs);
    if ((i1 - i0) * (j1 - j0) > 46000) continue;
    for (i = i0; i <= i1; i++) for (j = j0; j <= j1; j++) {
      h = tfcH(i, j, 1013 + lay);
      hx = tfcH(i, j, 7717 + lay); hy = tfcH(i, j, 3313 + lay);
      x = (i + hx) * cs + drift; y = (j + hy) * cs - drift * 0.6;
      d = tfcDens(x, y);
      if (d < 0.06) continue;
      if (h > d * (lay === 0 ? 0.92 : lay === 1 ? 0.34 : lay === 2 ? 0.13 : 0.05)) continue;
      tint = TFC_TINT[(tfcH(i, j, 55 + lay) * 8) | 0];
      var P;
      if (lay === 3) {                        /* vesicles — rare, and only in the gap */
        if (deep < 0.25) continue;
        var vr = cs * (0.10 + 0.11 * hy), va = 0.11 * deep * a * d;
        P = bucket(3, tint, va * boost, 1);
        if (P) P.arc(x, y, vr, 0, TFC_TAU);
        P = bucket(3, tint, va * 0.35 * boost, 0);
        if (P) P.arc(x, y, vr * 0.82, 0, TFC_TAU);
      } else if (lay === 2) {                 /* filaments, laid along the flow */
        var ang = tfcFlow(x, y), L = cs * (0.26 + 0.40 * h);
        var bow = (hx - 0.5) * L * 1.5;       /* well bowed: a filament, not a scratch */
        P = bucket(2, tint, (0.05 + 0.19 * hy) * a * d * boost, 1);
        if (P) {
          P.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L);
          P.quadraticCurveTo(x - Math.sin(ang) * bow, y + Math.cos(ang) * bow,
                             x + Math.cos(ang) * L, y + Math.sin(ang) * L);
        }
      } else if (lay === 1) {                 /* granules — soft, elongated by flow */
        var an = tfcFlow(x, y), rr = cs * (0.12 + 0.26 * hy * hy + 0.10 * deep);
        P = bucket(1, tint, (0.05 + 0.19 * h) * a * d * boost, 0);
        if (P) { P.moveTo(x + rr * 1.7, y); P.ellipse(x, y, rr * 1.7, rr, an, 0, TFC_TAU); }
      } else {                                /* the speck field itself */
        /* sizes spread wide and peaks pulled down — the cortex is granular,
           not glittering. The old (0.09 + 0.50h²) put a hard white starfield
           over the whole cell at its own decade. */
        s = cs * (0.11 + 0.42 * hy * hy);
        P = bucket(0, tint, (0.06 + 0.22 * h * h) * a * d * boost, 0);
        if (P) {
          if (s * u > 2.6) { P.moveTo(x + s * 0.62, y); P.arc(x, y, s * 0.62, 0, TFC_TAU); }
          else P.rect(x, y, s, s);
        }
      }
    }
  }

  /* and now the whole field, in a couple of hundred calls */
  var lw = [0, 0, Math.max(0.7 / u, c * 5.5 * 0.045), Math.max(0.7 / u, c * 13 * 0.021)];
  for (var kk in BK) {
    var b = BK[kk];
    if (b.m) { g.strokeStyle = b.c; g.lineWidth = lw[b.l]; g.stroke(b.p); }
    else { g.fillStyle = b.c; g.fill(b.p); }
  }
}

/* ── one chloroplast, drawn according to how near the focal plane it is ──── */
function tfcChloro(g, u, a, x, y, rx, ry, rot, foc, seed, lightA) {
  var r1 = tfcH(seed, 3, 91), r2 = tfcH(seed, 7, 91), r3 = tfcH(seed, 11, 91);
  var soft = 1 - foc;
  /* INSIDE IT. Past the point where the body is wider than the frame, its rim,
     its grana and its starch grain are not detail any more — they are fat
     smooth bars several hundred pixels across, which is precisely the "fat
     smear" the plate's first rule exists to forbid. At that magnification you
     are no longer looking AT a chloroplast, you are inside one, so the body
     lays down its colour and the granular field takes over describing it. */
  var det = rx * u <= 40 ? 1 : (rx * u >= 210 ? 0 : (210 - rx * u) / 170);
  var inside = det <= 0;
  g.save(); g.translate(x, y); g.rotate(rot);
  /* defocus is CAPPED against the body's own size: past about a fifth of it the
     body stops being an out-of-focus object and becomes a glow, and a glow is a
     photograph's mark, not an engraver's. */
  if (soft > 0.06) tfcBlur(g, u, Math.min(0.0018 + soft * 0.0120, rx * 0.30));
  /* the body. A body off the plane does not just soften — it loses SUBSTANCE:
     it goes greyer, flatter and much fainter, until the deepest ones are barely
     a smear. Holding their colour was what turned the cortex into a necklace of
     green pills. Only near the plane does chlorophyll actually read as green. */
  var chl = 0.30 + 0.70 * foc;                   /* how much colour survives */
  g.fillStyle = 'rgba(' + ((52 + 30 * soft * chl) | 0) + ','
              + ((70 + 34 * foc) | 0) + ','
              + ((56 + 14 * soft) | 0) + ','
              + (0.10 + 0.40 * foc * foc) * a + ')';
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TFC_TAU); g.fill();
  /* the edge is BROKEN — five or six short arcs with gaps between them, never a
     closed line. A closed outline is the single most diagram-like mark there is,
     and drawn breaks do more for "soft-edged" than blur does. */
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(148,178,132,' + (0.05 + 0.13 * foc) * a * det + ')';
  g.lineWidth = rx * 0.05;
  if (!inside) for (var e = 0; e < 6; e++) {
    var he = tfcH(seed, e, 137);
    if (he < 0.30) continue;                   /* a third of the edge is simply absent */
    var e0 = e / 6 * TFC_TAU + he * 0.20;
    g.beginPath();
    g.ellipse(0, 0, rx * 0.98, ry * 0.98, 0, e0, e0 + 0.55 + 0.35 * he);
    g.stroke();
  }
  var la = (lightA === undefined ? 2.2 : lightA) - rot;
  g.strokeStyle = 'rgba(' + ((168 + 26 * foc) | 0) + ',' + ((204 + 16 * foc) | 0) + ','
                + ((146 + 18 * foc) | 0) + ',' + (0.06 + 0.23 * foc) * a * det + ')';
  g.lineWidth = rx * (0.055 + 0.040 * soft);
  if (!inside) { g.beginPath(); g.ellipse(0, 0, rx * 0.97, ry * 0.97, 0, la - 1.15, la + 1.15); g.stroke(); }
  if (foc > 0.62 && !inside) {                 /* grana, only where focus really holds */
    var lam = (foc - 0.62) / 0.38;
    var n = 3 + ((r1 * 3) | 0);
    /* grana. Evenly-ruled parallel stripes are THE textbook mark, so these are
       unevenly spaced, unevenly weighted, and each one stops short somewhere
       along its length — stacks of discs seen through cytoplasm, not hatching. */
    for (var k = 0; k < n; k++) {
      var hk = tfcH(seed, k, 151), hk2 = tfcH(seed, k + 40, 151);
      var yy = (k - (n - 1) / 2) * ry * (0.40 + 0.16 * hk) + (r2 - 0.5) * ry * 0.12;
      var hw = rx * 0.68 * Math.sqrt(Math.max(0, 1 - Math.pow(yy / (ry * 0.98), 2)));
      g.strokeStyle = 'rgba(186,214,156,' + (0.04 + 0.19 * lam * (0.5 + 0.6 * hk2)) * a * det + ')';
      g.lineWidth = ry * (0.06 + 0.05 * hk2);
      g.beginPath();
      g.moveTo(-hw * (0.55 + 0.45 * hk), yy);
      g.lineTo(hw * (0.55 + 0.45 * hk2), yy);
      g.stroke();
    }
    g.fillStyle = 'rgba(220,234,192,' + 0.18 * lam * a * det + ')';   /* the starch grain */
    g.beginPath();
    g.ellipse((r3 - 0.5) * rx * 0.7, (r1 - 0.5) * ry * 0.5, rx * 0.15, ry * 0.20, 0, 0, TFC_TAU);
    g.fill();
  }
  g.filter = 'none';
  g.restore();
  if (soft > 0.62) {              /* the faint halo a badly-defocused body throws —
                                     two arcs, not a ring, and much quieter than
                                     before: it was reading as a lamp, not a body */
    g.save(); tfcBlur(g, u, Math.min(0.006 + soft * 0.006, rx * 0.22));
    g.strokeStyle = 'rgba(168,190,148,' + 0.030 * (soft - 0.62) * 2.6 * a + ')';
    g.lineWidth = rx * 0.11;
    var ha = (lightA === undefined ? 2.2 : lightA);
    g.beginPath(); g.ellipse(x, y, rx * 1.16, ry * 1.16, rot, ha - 1.25, ha + 1.25); g.stroke();
    g.beginPath(); g.ellipse(x, y, rx * 1.16, ry * 1.16, rot, ha + 2.05, ha + 3.20); g.stroke();
    g.filter = 'none'; g.restore();
  }
}

/* ── the wall, laid down as an engraver would: laminated, then hatched ───── */
function tfcWallPath(g, k) {
  g.beginPath();
  for (var i = 0; i <= 200; i++) {
    var th = i / 200 * TFC_TAU;
    var jit = (tfcH(i, 5, 601) - 0.5) * 0.0032 + (tfcH(i >> 2, 9, 733) - 0.5) * 0.0060;
    var R = tfcWallR(th) * k + jit;
    var x = Math.cos(th) * R, y = Math.sin(th) * R;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
PlateArt.cell = function (g, u, a, t, anchor) {
  g.save();
  g.scale(u, u);
  g.lineCap = 'round'; g.lineJoin = 'round';
  var AX = anchor ? anchor[0] : 0.14, AY = anchor ? anchor[1] : -0.10;
  var AXIS = [-0.075, 0.055];                  /* the optical axis, off-centre */

  /* LEVEL OF DETAIL. Arriving as a 15 px mote, every mark that carries this
     plate — the hatch, the grana, the stipple — is sub-pixel and gone, and the
     cell would fade to a grey nothing. So as u collapses the few marks that DO
     survive take up the contrast the lost ones were holding: a thing seen from
     far off gets smaller, not fainter. */
  var small = u > 90 ? 0 : (u < 12 ? 1 : (90 - u) / 78);

  /* ── the field: the condenser's cone, uneven and not on the frame's centre.
        Illumination fall-off, NOT a lens flare — kept low and warm-neutral so
        the plate stays ink-on-near-black rather than a lit photograph.        */
  var fld = g.createRadialGradient(AXIS[0], AXIS[1], 0.02, AXIS[0], AXIS[1], 0.80);
  fld.addColorStop(0, 'rgba(50,50,42,' + 0.40 * a + ')');
  fld.addColorStop(0.55, 'rgba(32,33,29,' + 0.26 * a + ')');
  fld.addColorStop(1, 'rgba(8,10,14,' + 0.08 * a + ')');
  g.fillStyle = fld; g.fillRect(-0.6, -0.6, 1.2, 1.2);

  /* ── THE TISSUE CROP. A slide never shows one isolated cell: the walls of the
        neighbours run IN from off-frame and meet ours at three-way junctions on
        its own boundary. They are broad low-contrast BANDS (a shared wall has
        thickness), off the focal plane because they belong to another depth,
        and each one leaves the frame rather than stopping in mid-air — a wall
        that stops reads as a stray hair. This, more than anything else here, is
        what makes the frame a piece of a tissue instead of a specimen.         */
  var JUNC = [0.44, 1.62, 2.72, 3.86, 5.05];
  /* first their BODIES. A dark band on a near-black ground is invisible, so the
     neighbours would have read as scratches outside a specimen. Laying a faint
     wedge of their cytoplasm outside each stretch of our wall — falling away to
     nothing well before the frame edge, so the plate stays ink-on-near-black —
     is what actually makes this a crop of a tissue: our cell is not floating in
     a void, it is packed in among others. */
  if (small < 0.9) for (var nb = 0; nb < JUNC.length; nb++) {
    var bt = (JUNC[nb] + JUNC[(nb + 1) % JUNC.length] + (nb === 4 ? TFC_TAU : 0)) / 2;
    var bR = tfcWallR(bt) + 0.115 + 0.030 * tfcH(nb, 9, 43);
    var bx = Math.cos(bt) * bR, by = Math.sin(bt) * bR;
    var bw = g.createRadialGradient(bx, by, 0.01, bx, by, 0.26 + 0.05 * tfcH(nb, 10, 43));
    bw.addColorStop(0, 'rgba(46,48,40,' + (0.34 + 0.10 * tfcH(nb, 11, 43)) * a + ')');
    bw.addColorStop(0.6, 'rgba(38,40,34,' + 0.16 * a + ')');
    bw.addColorStop(1, 'rgba(30,32,28,0)');
    g.fillStyle = bw;
    g.beginPath(); g.arc(bx, by, 0.31, 0, TFC_TAU); g.fill();
  }
  for (var n = 0; n < JUNC.length; n++) {
    var jt = JUNC[n], jR = tfcWallR(jt);
    var jx = Math.cos(jt) * jR, jy = Math.sin(jt) * jR;
    /* short, near-radial and no brighter than our own wall. A shared wall runs
       AWAY from the junction and is gone; long sweeping curves out in the open
       field are the thing that reads as a lens flare instead of a cell. */
    var spread = (n % 2 ? 0.20 : -0.18) + (tfcH(n, 2, 41) - 0.5) * 0.08;
    var far = 0.60 + 0.06 * tfcH(n, 7, 41);
    var ex = Math.cos(jt + spread) * far, ey = Math.sin(jt + spread) * far;
    var mx = Math.cos(jt + spread * 0.30) * (jR + 0.07) + (tfcH(n, 3, 41) - 0.5) * 0.018;
    var my = Math.sin(jt + spread * 0.30) * (jR + 0.07) + (tfcH(n, 4, 41) - 0.5) * 0.018;
    g.save();
    tfcBlur(g, u, 0.0030 + 0.0022 * tfcH(n, 5, 41));
    g.beginPath(); g.moveTo(jx, jy); g.quadraticCurveTo(mx, my, ex, ey);
    /* A shared wall seen off-plane is mostly its own shadow, and — this is the
       part that makes it a JUNCTION rather than a beam — it is strongest where
       it MEETS us and dies away as it leaves. The eye reads the attachment,
       which is the whole point of the device; an evenly-lit arc sweeping across
       the field just reads as a searchlight over the slide. */
    var fade = function (c0, c1) {
      var lg = g.createLinearGradient(jx, jy, ex, ey);
      lg.addColorStop(0, c0); lg.addColorStop(0.34, c1);
      lg.addColorStop(1, c1.replace(/[\d.]+\)$/, '0)'));
      return lg;
    };
    g.strokeStyle = fade('rgba(14,18,18,' + 0.62 * a + ')', 'rgba(14,18,18,' + 0.26 * a + ')');
    g.lineWidth = 0.042; g.stroke();
    var pa = (0.072 + 0.024 * tfcH(n, 6, 41)) * a;
    g.strokeStyle = fade('rgba(152,146,120,' + pa + ')', 'rgba(152,146,120,' + pa * 0.30 + ')');
    g.lineWidth = 0.017; g.stroke();
    g.strokeStyle = fade('rgba(190,182,152,' + 0.075 * a + ')', 'rgba(190,182,152,' + 0.020 * a + ')');
    g.lineWidth = 0.0055; g.stroke();
    g.filter = 'none'; g.restore();
  }

  /* ── OUR WALL. Three laminations — outer, middle lamella, inner — with a
        chromatic fringe thrown off the optical axis, then hatched by hand.     */
  var tiny = small;                                               /* the arriving mote */
  g.save();
  /* the cell's own body: olive-parchment dark, NOT a green wash. The green in
     this plate is spent on the chloroplasts, where it means something. */
  tfcWallPath(g, 1.0);
  g.fillStyle = 'rgba(38,42,33,' + (0.46 + 0.30 * tiny) * a + ')'; g.fill();
  g.restore();

  var fr = 0.0034;                                                /* fringe throw */
  var fdx = (0 - AXIS[0]), fdy = (0 - AXIS[1]);
  var fl = Math.hypot(fdx, fdy) || 1; fdx /= fl; fdy /= fl;
  g.save();
  g.translate(fdx * fr, fdy * fr);
  tfcWallPath(g, 1.0);
  g.strokeStyle = 'rgba(240,199,102,' + 0.16 * a + ')'; g.lineWidth = 0.011; g.stroke();
  g.restore();
  g.save();
  g.translate(-fdx * fr, -fdy * fr);
  tfcWallPath(g, 1.0);
  g.strokeStyle = 'rgba(135,148,166,' + 0.16 * a + ')'; g.lineWidth = 0.011; g.stroke();
  g.restore();

  /* the wall is a soft brick, not a bright rope: the body of it is laid in low
     and the HATCH below does the describing. A single even bright line all the
     way round is the contour-map read we are trying to avoid. */
  tfcWallPath(g, 1.0);
  g.strokeStyle = 'rgba(150,144,116,' + (0.17 + 0.30 * tiny) * a + ')';
  g.lineWidth = 0.0155; g.stroke();
  g.strokeStyle = 'rgba(196,186,154,' + (0.12 + 0.34 * tiny) * a + ')';
  g.lineWidth = 0.0055; g.stroke();
  tfcWallPath(g, 0.978);
  g.strokeStyle = 'rgba(206,198,168,' + 0.085 * a + ')'; g.lineWidth = 0.0030; g.stroke();

  for (var w = 0; w < 210; w++) {                 /* the engraver's cross-hatch */
    var th = w / 210 * TFC_TAU + tfcH(w, 2, 77) * 0.02;
    var R = tfcWallR(th), hh = tfcH(w, 4, 88);
    if (hh < 0.34) continue;
    var cx = Math.cos(th), cy = Math.sin(th);
    var i0 = R * (0.982 - 0.006 * hh), i1 = R * (1.000 + 0.007 * hh);
    g.strokeStyle = 'rgba(222,210,174,' + (0.04 + 0.14 * hh) * a + ')';
    g.lineWidth = 0.0018 + 0.0016 * tfcH(w, 6, 99);
    g.beginPath(); g.moveTo(cx * i0, cy * i0); g.lineTo(cx * i1, cy * i1); g.stroke();
  }

  /* ── PIT FIELDS. An unbroken boundary is the last diagram tell, so the wall is
        interrupted: clusters of plasmodesmata pores where the two cells talk to
        each other, and either side of each cluster the wall thins and drops off
        the plane of focus for a moment.                                        */
  if (small < 0.85) for (var p = 0; p < 4; p++) {
    var tp = [0.95, 2.42, 3.55, 5.62][p], Rp = tfcWallR(tp);
    g.save();
    tfcBlur(g, u, 0.0026 + 0.0016 * tfcH(p, 8, 61));
    /* the wall going soft and dark across the pit field: it must visibly BREAK
       the run of the boundary, or it is not doing its one job */
    g.strokeStyle = 'rgba(22,26,24,' + 0.62 * a + ')'; g.lineWidth = 0.026;
    g.beginPath();
    g.arc(0, 0, Rp, tp - 0.095, tp + 0.095); g.stroke();
    g.strokeStyle = 'rgba(186,178,148,' + 0.055 * a + ')'; g.lineWidth = 0.011;
    g.beginPath(); g.arc(0, 0, Rp, tp - 0.080, tp + 0.080); g.stroke();
    /* the pores themselves */
    for (var q2 = -2; q2 <= 2; q2++) {
      var to = tp + q2 * 0.030 + (tfcH(p, q2 + 3, 62) - 0.5) * 0.012;
      var Ro = tfcWallR(to) * (0.997 + 0.004 * tfcH(p, q2 + 9, 63));
      g.fillStyle = 'rgba(16,20,20,' + (0.30 + 0.16 * tfcH(p, q2, 64)) * a + ')';
      g.beginPath();
      g.arc(Math.cos(to) * Ro, Math.sin(to) * Ro, 0.0052 + 0.0022 * tfcH(p, q2, 65), 0, TFC_TAU);
      g.fill();
    }
    g.filter = 'none'; g.restore();
  }

  /* ── INSIDE THE CELL ────────────────────────────────────────────────────── */
  g.save();
  tfcWallPath(g, 0.986); g.clip();

  /* the vacuole: pressure, holding everything against the wall. Two broad, very
     soft, OFF-CENTRE passages rather than one concentric wash — a flat middle is
     what made this read as murk over half the frame. Cell sap is faintly olive,
     not green: the green is the chloroplasts' to spend. */
  var vac = g.createRadialGradient(0.03, -0.02, 0.02, 0.03, -0.02, 0.44);
  vac.addColorStop(0, 'rgba(66,72,56,' + 0.15 * a + ')');
  vac.addColorStop(1, 'rgba(44,50,40,0)');
  g.fillStyle = vac; g.fillRect(-0.6, -0.6, 1.2, 1.2);
  var vp1 = g.createRadialGradient(-0.14, -0.20, 0.01, -0.14, -0.20, 0.30);
  vp1.addColorStop(0, 'rgba(84,88,68,' + 0.085 * a + ')');
  vp1.addColorStop(1, 'rgba(84,88,68,0)');
  g.fillStyle = vp1; g.fillRect(-0.6, -0.6, 1.2, 1.2);
  var vp2 = g.createRadialGradient(0.17, 0.19, 0.01, 0.17, 0.19, 0.26);
  vp2.addColorStop(0, 'rgba(16,20,20,' + 0.13 * a + ')');
  vp2.addColorStop(1, 'rgba(16,20,20,0)');
  g.fillStyle = vp2; g.fillRect(-0.6, -0.6, 1.2, 1.2);

  /* the nucleus — pale, pressed into the wall, its edge losing focus. Not a
     lavender moon: a grey-lilac mass you can only just make out. */
  var lightOf = function (px, py) { return Math.atan2(AXIS[1] - py, AXIS[0] - px); };
  g.save();
  tfcBlur(g, u, 0.0090);
  g.fillStyle = 'rgba(176,168,172,' + 0.20 * a + ')';
  g.beginPath(); g.ellipse(TFC_NUC[0], TFC_NUC[1], 0.098, 0.075, -0.36, 0, TFC_TAU); g.fill();
  g.strokeStyle = 'rgba(198,190,196,' + 0.18 * a + ')'; g.lineWidth = 0.0060;
  g.beginPath(); g.ellipse(TFC_NUC[0], TFC_NUC[1], 0.092, 0.070, -0.36,
                           lightOf(TFC_NUC[0], TFC_NUC[1]) - 1.3,
                           lightOf(TFC_NUC[0], TFC_NUC[1]) + 1.3); g.stroke();
  g.filter = 'none'; g.restore();
  g.save(); tfcBlur(g, u, 0.0034);
  g.fillStyle = 'rgba(212,204,206,' + 0.26 * a + ')';           /* the nucleolus */
  g.beginPath(); g.ellipse(TFC_NUC[0] + 0.016, TFC_NUC[1] - 0.010, 0.026, 0.021, 0.4, 0, TFC_TAU); g.fill();
  g.filter = 'none'; g.restore();

  /* the chloroplasts, riding the stream — crowded two-deep against the wall,
     the way turgor really packs them. Their DEPTH is hashed, so the focal plane
     cuts through the crowd instead of flattering all of it at once. */
  var cyc = t * 0.0135;                          /* cyclosis: one slow circuit */
  for (var i = 0; i < 40; i++) {
    var hb = tfcH(i, 21, 404), hd = tfcH(i, 22, 404), hr = tfcH(i, 23, 404);
    var lane = i % 2;
    /* crowded, but not EVENLY crowded — a regular ring of bodies is a diagram's
       idea of a cortex. They clump, gap and ride at different depths in it. */
    var th2 = (i / 40) * TFC_TAU * 2 + (hb - 0.5) * 0.62 + cyc * (lane ? 1 : 0.82);
    var R2 = tfcWallR(th2) * (lane ? 0.945 - 0.075 * hd : 0.855 - 0.085 * hd);
    var cxp = Math.cos(th2) * R2, cyp = Math.sin(th2) * R2;
    /* most of them are off-plane, and NONE of them is as sharp as the anchor —
       the thing we are falling into is the one thing truly in focus. */
    var foc = Math.pow(tfcH(i, 24, 404), 1.9) * 0.86;
    tfcChloro(g, u, a, cxp, cyp, 0.036 + 0.012 * hr, 0.022 + 0.007 * hb,
              th2 + 1.4 + (hd - 0.5) * 0.9, foc, i, lightOf(cxp, cyp));
  }
  for (var k2 = 0; k2 < 7; k2++) {               /* the ones out on the strands */
    var sp = 0.14 + k2 * 0.108 + Math.sin(t * 0.06 + k2) * 0.0090;   /* the spec caps motion at ~0.01 unit, and
                                                                       at the blow-up even that is a long slow slide */
    var P = tfcStrand(sp), hq = tfcH(k2, 31, 77);
    var P2 = tfcStrand(Math.min(1, sp + 0.04));
    if (Math.abs(sp - 0.72) > 0.058)             /* leave the anchor its room */
      tfcChloro(g, u, a, P[0], P[1], 0.034 + 0.011 * hq, 0.021 + 0.007 * hq,
                Math.atan2(P2[1] - P[1], P2[0] - P[0]), Math.pow(hq, 1.7), 60 + k2,
                lightOf(P[0], P[1]));
    var sq = 0.20 + k2 * 0.10 - Math.sin(t * 0.05 + k2 * 1.7) * 0.0080;
    var Q = tfcStrand2(sq), Q2 = tfcStrand2(Math.min(1, sq + 0.04));
    var hz = tfcH(k2, 37, 77);
    tfcChloro(g, u, a, Q[0], Q[1], 0.031 + 0.010 * hz, 0.019 + 0.006 * hz,
              Math.atan2(Q2[1] - Q[1], Q2[0] - Q[0]), Math.pow(hz, 2.1) * 0.75, 80 + k2,
              lightOf(Q[0], Q[1]));
  }

  /* ── THE ANCHOR. The chloroplast we are falling into: the only thing in the
        frame at true focus, sitting on the strand where it belongs.           */
  var arot = Math.atan2(TFC_SP[17][1] - TFC_SP[15][1], TFC_SP[17][0] - TFC_SP[15][0]);
  g.strokeStyle = 'rgba(168,198,144,' + 0.10 * a + ')';   /* the strand carrying it */
  g.lineWidth = 0.013;
  g.beginPath();
  g.moveTo(TFC_SP[12][0], TFC_SP[12][1]);
  g.quadraticCurveTo(TFC_SP[15][0], TFC_SP[15][1], AX, AY);
  g.quadraticCurveTo(TFC_SP[18][0], TFC_SP[18][1], TFC_SP[21][0], TFC_SP[21][1]);
  g.stroke();
  /* the fall-into point has to ANNOUNCE itself at the plate's own decade, so the
     anchor is given a shade more size and its own pocket of local contrast: the
     cytoplasm darkens just around it, and only then does the body sit on top. */
  var pocket = g.createRadialGradient(AX, AY, 0.012, AX, AY, 0.105);
  pocket.addColorStop(0, 'rgba(12,16,16,' + 0.20 * a + ')');
  pocket.addColorStop(1, 'rgba(12,16,16,0)');
  g.fillStyle = pocket; g.beginPath(); g.arc(AX, AY, 0.105, 0, TFC_TAU); g.fill();
  var glow = g.createRadialGradient(AX, AY, 0, AX, AY, 0.090);
  glow.addColorStop(0, 'rgba(198,228,168,' + (0.13 + 0.20 * tiny) * a + ')');
  glow.addColorStop(0.5, 'rgba(180,212,152,' + 0.042 * a + ')');
  glow.addColorStop(1, 'rgba(180,212,152,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(AX, AY, 0.090, 0, TFC_TAU); g.fill();
  tfcChloro(g, u, a, AX, AY, 0.056, 0.035, arot, 1.0, 909, lightOf(AX, AY));

  /* THE FIELD TEXTURE, drawn LAST of everything inside the wall — over the
     bodies, not under them. This is the fix for the one thing nobody had
     looked at: walking in to u=2400 and beyond, the anchor was a flat green
     ellipse with fat smooth bars across it, because it was painted on TOP of
     the grain. Cytoplasm and the bodies floating in it are made of the same
     stuff at that magnification, and the field has to say so.               */
  tfcField(g, u, a, t);

  g.restore();                                    /* ── out of the cell ────── */

  /* ── dust on the coverslip: nowhere near the focal plane, over everything   */
  var DU = [[-0.33, -0.36, 0.052], [0.37, 0.28, 0.038], [0.11, 0.41, 0.026]];
  if (small < 0.5) for (var d2 = 0; d2 < DU.length; d2++) {
    g.save(); tfcBlur(g, u, 0.020);
    g.strokeStyle = 'rgba(214,208,190,' + 0.10 * a + ')';
    g.lineWidth = DU[d2][2] * 0.30;
    g.beginPath(); g.arc(DU[d2][0], DU[d2][1], DU[d2][2], 0, TFC_TAU); g.stroke();
    g.filter = 'none'; g.restore();
  }

  /* ── the edges of the field lose focus, and the corners lose light. Lifted
        when the plate is only a mote — at 15 px a vignette is just erasure.    */
  var vg = 1 - 0.70 * small;
  var vig = g.createRadialGradient(AXIS[0], AXIS[1], 0.30, AXIS[0], AXIS[1], 0.72);
  vig.addColorStop(0, 'rgba(6,8,12,0)');
  vig.addColorStop(0.62, 'rgba(6,8,12,' + 0.26 * a * vg + ')');
  vig.addColorStop(1, 'rgba(5,6,10,' + 0.62 * a * vg + ')');
  g.fillStyle = vig; g.fillRect(-0.6, -0.6, 1.2, 1.2);

  /* ── ARRIVING. At 15 px every mark above is sub-pixel and the plate would be a
        uniform grey dot, indistinguishable from dirt. So the mote is drawn as
        its own small picture: an ASYMMETRIC dark rim (thicker on the shaded
        side, so it has a lit direction), and the two or three chloroplasts big
        enough to survive, at the contrast the lost thousands were holding.     */
  if (small > 0.02) {
    g.save();
    g.filter = 'none';
    var mA = small * a;
    /* the rim: heavier away from the light, and deliberately not a closed ring */
    var lA = Math.atan2(AXIS[1], AXIS[0]);
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(14,18,18,' + 0.55 * mA + ')';
    g.lineWidth = 0.058;
    g.beginPath(); g.arc(0, 0, 0.415, lA + 0.55, lA + TFC_TAU - 0.55); g.stroke();
    g.strokeStyle = 'rgba(204,196,164,' + 0.42 * mA + ')';
    g.lineWidth = 0.030;
    g.beginPath(); g.arc(0, 0, 0.405, lA - 1.30, lA + 1.05); g.stroke();
    /* one lighter lobe, so the speck has an inside */
    var lob = g.createRadialGradient(-0.07, -0.09, 0.01, -0.07, -0.09, 0.30);
    lob.addColorStop(0, 'rgba(120,124,96,' + 0.40 * mA + ')');
    lob.addColorStop(1, 'rgba(120,124,96,0)');
    g.fillStyle = lob; g.beginPath(); g.arc(0, 0, 0.40, 0, TFC_TAU); g.fill();
    /* the survivors — the anchor first, because it is what we are aiming at */
    var MC = [[AX, AY, 0.088, 0.80], [-0.16, 0.13, 0.072, 0.52], [0.13, 0.20, 0.060, 0.44],
              [-0.06, -0.21, 0.055, 0.38]];
    for (var mc = 0; mc < MC.length; mc++) {
      g.fillStyle = 'rgba(104,150,96,' + MC[mc][3] * mA + ')';
      g.beginPath();
      g.ellipse(MC[mc][0], MC[mc][1], MC[mc][2], MC[mc][2] * 0.68, mc * 1.1, 0, TFC_TAU);
      g.fill();
    }
    g.fillStyle = 'rgba(206,232,178,' + 0.44 * mA + ')';     /* the anchor's own core */
    g.beginPath(); g.arc(AX, AY, 0.040, 0, TFC_TAU); g.fill();
    g.restore();
  }

  g.filter = 'none';
  g.restore();
  /* the state reset must come AFTER the restore: restore() puts back whatever
     alpha and composite op the CALLER happened to be holding, so resetting
     before it just gets reverted. The plate hands the context back clean. */
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
};

/* ═══ −3  THE VEIN AT A MILLIMETRE ════════════════════════════════════════ */
PlateArt.vein = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(37);
  /* the leaf's plumbing seen edge-on: a bundle of xylem pipes, the wall of the
     blade either side, cells packed like cobbles around it. */
  g.fillStyle = `rgba(46,64,48,${0.30 * a})`; g.fillRect(-0.5, -0.5, 1, 1);
  for (let i = 0; i < 130; i++) {                     // the packed mesophyll cobbles
    const x = (r() - 0.5) * 1.0, y = (r() - 0.5) * 1.0;
    if (Math.abs(y) < 0.11) continue;
    g.fillStyle = `rgba(96,138,92,${(0.10 + 0.20 * r()) * a})`;
    tfStroke(g, `rgba(150,190,140,${0.16 * a})`, 0.0022);
    g.beginPath(); g.ellipse(x, y, 0.030 + r() * 0.022, 0.024 + r() * 0.018, r() * 3, 0, 6.283);
    g.fill(); g.stroke();
  }
  const grv = g.createLinearGradient(0, -0.12, 0, 0.12);   // the vein itself
  grv.addColorStop(0, `rgba(206,196,150,${0.18 * a})`);
  grv.addColorStop(0.5, `rgba(232,220,170,${0.34 * a})`);
  grv.addColorStop(1, `rgba(206,196,150,${0.18 * a})`);
  g.fillStyle = grv; g.fillRect(-0.5, -0.115, 1, 0.23);
  tfStroke(g, `rgba(228,214,158,${0.5 * a})`, 0.0035);
  for (let k = -3; k <= 3; k++) {                     // the pipes, running away
    g.beginPath(); g.moveTo(-0.5, k * 0.028 + 0.004);
    g.bezierCurveTo(-0.1, k * 0.028 - 0.010, 0.15, k * 0.028 + 0.012, 0.5, k * 0.028); g.stroke();
  }
  grain(g, u, a, 37, 'rgba(190,214,162,1)', 0.34, false);
  smudge(g, anchor, 0.055, '206,232,176', a * 0.8, 37);
  g.restore();
};

/* ═══ −2  THE PINNULE ═════════════════════════════════════════════════════ */
PlateArt.pinnule = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u);
  tfStroke(g, `rgba(176,206,150,${0.62 * a})`, 0.006); g.fillStyle = `rgba(46,70,50,${0.32 * a})`;
  g.beginPath(); g.moveTo(-0.42, 0.06);
  g.bezierCurveTo(-0.16, -0.26, 0.18, -0.28, 0.44, -0.02);
  g.bezierCurveTo(0.18, 0.26, -0.14, 0.28, -0.42, 0.06); g.closePath(); g.fill(); g.stroke();
  g.save(); g.clip();
  tfStroke(g, `rgba(206,228,180,${0.42 * a})`, 0.004);
  g.beginPath(); g.moveTo(-0.40, 0.05); g.quadraticCurveTo(0, -0.03, 0.42, -0.02); g.stroke();
  for (let i = 1; i < 11; i++) {
    const q = i / 11, x = -0.36 + q * 0.74, y = 0.05 - q * 0.075;
    tfStroke(g, `rgba(206,228,180,${0.26 * a})`, 0.0028);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.05, y - 0.14); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.05, y + 0.14); g.stroke();
    tfStroke(g, `rgba(190,216,166,${0.13 * a})`, 0.0018);     // the finer venation
    for (let k = 1; k < 4; k++) {
      g.beginPath(); g.moveTo(x + 0.05 * k / 4, y - 0.14 * k / 4);
      g.lineTo(x + 0.05 * k / 4 + 0.022, y - 0.14 * k / 4 - 0.020); g.stroke();
    }
  }
  const r = tfRng(41);                                 // sori — the spore cases beneath
  for (let i = 0; i < 12; i++) {
    const x = -0.30 + r() * 0.62, y = (r() - 0.5) * 0.26;
    g.fillStyle = `rgba(150,110,58,${0.30 * a})`;
    g.beginPath(); g.arc(x, y, 0.016 + r() * 0.010, 0, 6.283); g.fill();
  }
  grain(g, u, a, 41, 'rgba(190,220,164,1)', 0.30, false);
  g.restore();
  smudge(g, anchor, 0.055, '206,232,176', a * 0.8, 41);
  g.restore();
};

/* ═══ −1  THE FERN ════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — PLATE 10⁻¹ · THE FERN            (foundry take)

   A single frond standing against the dark: a bare stipe, a rachis that leans
   through the middle and carries its crown back over, nineteen subopposite
   pinnae cut into forward-raked pinnules, sori dusting the undersides of the
   fertile lower half, and the crown still half-coiled — a frond caught in the
   middle of its season, not pressed between two sheets of glass.

   Drawn the way an engraver draws: outline first, then the tone built out of
   the density of marks. No wash anywhere.

   ── THE PROBLEM THIS TAKE SETS OUT TO SOLVE ─────────────────────────────────

   The shipped grain() authors five octaves scattered over the WHOLE unit
   square and stops at 0.0004 unit. Blow the plate up 300x and it fails twice
   over: every octave has left the legible band (the finest lands at 72 px),
   AND the visible window has shrunk to 0.0028 unit across — a window that
   would contain 0.006 of those 1200 dots. Both are the same failure. A field
   authored globally cannot be sampled locally.

   So this plate's field is generated LOCALLY. It reads its own transform,
   works out which patch of unit space is actually on screen, and hashes marks
   into just the grid cells overlapping it. Cost is bounded by the window and
   not by the plate, so the ladder runs nine octaves — 0.055 unit down to
   9e-7 — with a per-octave budget and a fade at each band edge so nothing
   pops as the wheel turns. The picture never runs out of picture.

   And what arrives in the gap is not noise. It is the leaf's own tissue:
   epidermal pavement cells with the wavy anticlinal walls a fern really has,
   chloroplasts crowded inside them, a veinlet crossing the field. The plate
   below this one IS a cell, so the magnification has to walk you into one
   honestly, and hand you off at the door.
   ════════════════════════════════════════════════════════════════════════════ */

(function () {

  /* ── deterministic hash: a value in [0,1) from any three integers ───────── */
  function h3(i, j, k) {
    let n = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 4294967296;
  }

  /* ── the estate's ink, at 10⁻¹ ──────────────────────────────────────────── */
  const INK = {
    blade: '28,42,33',        // the lamina, ink-dark
    edge: '158,188,130',      // its lit edge
    vein: '206,216,170',      // parchment-green venation
    rachis: '226,196,128',    // warm gold along the stem
    sorus: '150,104,50',      // the spore cases beneath
    wall: '188,212,152',      // cell walls, at magnification
    grana: '112,158,88',      // chloroplasts within the cells
    fog: '135,148,166',       // cool fog — the paper itself
    pore: '10,16,12'          // the slit between two guard cells
  };

  /* THE INK TABLE. The field places tens of thousands of marks a frame, and
     building an 'rgba(...)' string for each one costs more than drawing it —
     that single detail was the whole of this plate's frame budget. So every
     ink is pre-mixed at 64 strengths, once, and the hot loops do an integer
     lookup instead of allocating. */
  const QN = 64, TAB = {};
  for (const n in INK) {
    const row = new Array(QN + 1);
    for (let q = 0; q <= QN; q++) row[q] = 'rgba(' + INK[n] + ',' + (q / QN).toFixed(4) + ')';
    TAB[n] = row;
  }
  function ink(name, al) {
    const q = al <= 0 ? 0 : (al >= 1 ? QN : (al * QN + 0.5) | 0);
    return TAB[name][q];
  }

  /* LINE WIDTH, IN HONEST PIXELS. A width authored in unit space is a hairline
     at the plate's own decade and a fat stripe three hundred diameters in —
     the bug that put pale bars across a sister take's blow-up. Every stroke on
     this plate is clamped into a pixel band, so a contour stays a contour at
     every magnification. Geometry that is genuinely thick — the stipe — is
     drawn as an outline and is deliberately NOT put through here. */
  function pw(u, unitW, minPx, maxPx) {
    const w = unitW < minPx / u ? minPx / u : unitW;
    return w > maxPx / u ? maxPx / u : w;
  }

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY — built once per anchor, then cached.
     ════════════════════════════════════════════════════════════════════════ */

  function spineAt(q) {
    return [0.005 - 0.048 * Math.sin(Math.PI * q) + 0.150 * q * q * q,
      0.470 - 0.945 * q];
  }
  function lenShape(q) {
    return Math.pow(Math.max(0, 1 - q), 0.62) * Math.min(1, 0.58 + 2.9 * q);
  }

  /* THE LOBE WAVE. A symmetric |sin| gives scallops; a fern gives pinnules —
     deep notches, and each lobe raked toward the pinna's tip. The skew on z is
     what does the raking, and the 0.17 floor is the strip of blade that still
     joins one pinnule to the next. */
  function lobeWave(z) {
    const zz = Math.pow(z - Math.floor(z), 0.80);
    return 0.22 + 0.78 * Math.pow(Math.sin(Math.PI * zz), 0.88);
  }
  const LOBE_CREST = Math.pow(0.5, 1 / 0.80);     // where in a lobe the crest sits

  function halfW(pn, p) {
    const taper = Math.pow(Math.max(0, 1 - p), 0.52) * (0.52 + 0.48 * Math.min(1, p * 8));
    const z = pn.lobes * p + pn.lphase;
    /* no two pinnules on a real frond are the same size — the per-lobe roll
       steps only where the wave is at its floor, so the blade stays continuous
       while the rhythm stops being mechanical */
    const amp = 0.80 + 0.36 * h3(pn.seed, Math.floor(z), 33);
    return pn.hw0 * taper * (0.22 + (lobeWave(z) - 0.22) * amp);
  }

  function mkPinna(B, side, L, phi, seed) {
    const K = 16, pts = new Float64Array((K + 1) * 2), ds = L / K;
    let x = B[0], y = B[1];
    for (let k = 0; k <= K; k++) {
      pts[k * 2] = x; pts[k * 2 + 1] = y;
      const p = k / K;
      /* the costa arches up out of the rachis, then lets its own tip fall */
      const th = phi + 0.62 * p - 1.06 * p * p;
      x += side * Math.cos(th) * ds;
      y -= Math.sin(th) * ds;
    }
    const pn = {
      B: B, side: side, L: L, phi: phi, seed: seed, pts: pts, K: K,
      lobes: Math.max(3, Math.min(11, Math.round(L / 0.0280))),
      hw0: L * 0.200 * (0.90 + 0.20 * h3(seed, 3, 9)),
      lphase: h3(seed, 5, 11), bb: null
    };
    pn.bb = pinnaBox(pn);
    return pn;
  }

  function pinnaBox(pn) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let k = 0; k <= pn.K; k++) {
      const x = pn.pts[k * 2], y = pn.pts[k * 2 + 1];
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const pad = pn.hw0 * 1.15;
    return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  }

  /* point on the costa at fraction p, plus its unit normal */
  function costa(pn, p) {
    const f = Math.max(0, Math.min(1, p)) * pn.K;
    const k = Math.min(pn.K - 1, Math.floor(f)), r = f - k;
    const x = pn.pts[k * 2] * (1 - r) + pn.pts[k * 2 + 2] * r;
    const y = pn.pts[k * 2 + 1] * (1 - r) + pn.pts[k * 2 + 3] * r;
    let nx = pn.pts[k * 2 + 3] - pn.pts[k * 2 + 1];
    let ny = -(pn.pts[k * 2 + 2] - pn.pts[k * 2]);
    const m = Math.hypot(nx, ny) || 1;
    return [x, y, nx / m, ny / m];
  }

  let CACHE = null;

  function buildFrond(A) {
    const key = A[0].toFixed(4) + ',' + A[1].toFixed(4);
    if (CACHE && CACHE.key === key) return CACHE;

    const P = [], N = 19;
    for (let i = 0; i < N; i++) {
      const side = (i % 2) ? -1 : 1;
      /* subopposite — the pair straddles a node instead of sharing one */
      let q = 0.050 + (i / (N - 1)) * 0.905 + (side < 0 ? 0.014 : 0)
        + (h3(i, 7, 3) - 0.5) * 0.010;
      q = Math.min(0.982, q);
      const B = spineAt(q);
      const L = 0.315 * lenShape(q) * (0.87 + 0.26 * h3(i, 11, 5));
      const phi = 0.26 + 0.52 * q + (h3(i, 13, 2) - 0.5) * 0.14;
      P.push(mkPinna(B, side, L, phi, i));
    }

    /* ── THE ANCHOR PINNULE ────────────────────────────────────────────────
       The child plate grows out of one particular pinnule, so ONE pinna is
       re-aimed until its costa passes exactly through the anchor at 0.86 of
       its length, and the lobe phase is set so a pinnule CREST — not a notch —
       lands there. Nothing is added to mark the spot. The spot is simply where
       a lobe of the plant happens to be, which is the whole difference between
       a nested picture and a sticker. */
    const PA = 0.86;
    let best = -1, bd = 1e9;
    for (let i = 0; i < P.length; i++) {
      if (P[i].side !== (A[0] >= 0 ? 1 : -1)) continue;
      /* want a pinna rooted BELOW the anchor, so it reaches up to it the way
         its neighbours do — never one forced to droop backwards */
      const rise = P[i].B[1] - A[1];
      if (rise < 0.02) continue;
      const d = Math.abs(rise - 0.075) + 0.30 * Math.abs(Math.hypot(A[0] - P[i].B[0], rise) / PA - P[i].L);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) {
      const B = P[best].B, side = P[best].side, seed = P[best].seed;
      let L = Math.hypot(A[0] - B[0], A[1] - B[1]) / PA, phi = 0.55;
      for (let it = 0; it < 60; it++) {                 // 2-D Newton on (L, phi)
        const c = costa(mkPinna(B, side, L, phi, seed), PA);
        const ex = A[0] - c[0], ey = A[1] - c[1];
        if (Math.hypot(ex, ey) < 1e-7) break;
        const dL = L * 0.001, dp = 0.001;
        const cL = costa(mkPinna(B, side, L + dL, phi, seed), PA);
        const cp = costa(mkPinna(B, side, L, phi + dp, seed), PA);
        const a11 = (cL[0] - c[0]) / dL, a12 = (cp[0] - c[0]) / dp;
        const a21 = (cL[1] - c[1]) / dL, a22 = (cp[1] - c[1]) / dp;
        const det = a11 * a22 - a12 * a21;
        if (!isFinite(det) || Math.abs(det) < 1e-12) break;
        L += (a22 * ex - a12 * ey) / det;
        phi += (-a21 * ex + a11 * ey) / det;
        if (!(L > 0.01 && L < 0.6)) { L = Math.hypot(A[0] - B[0], A[1] - B[1]) / PA; break; }
      }
      const pn = mkPinna(B, side, L, phi, seed);
      /* seat a pinnule crest exactly on the anchor */
      const w = pn.lobes * PA;
      pn.lphase = LOBE_CREST - (w - Math.floor(w));
      pn.bb = pinnaBox(pn);
      pn.anchorP = PA;
      P[best] = pn;
    }

    CACHE = { key: key, P: P, A: A, anchorPinna: best };
    return CACHE;
  }

  /* ── is this point leaf tissue? 1 = lamina, 2 = the rachis itself ─────────
     The exact answer walks every pinna's costa, which is fine a few hundred
     times and ruinous a few tens of thousands of times — and a wide view asks
     it once per mark. So the answer is baked ONCE into an occupancy grid the
     first time the frond is drawn, and the exact test is kept for zoomed views,
     where the window is small and there are only a handful of marks to place.
     Same picture, and the plate stops costing 45 ms at its own decade. */
  const GN = 256;
  function laminaGrid(F) {
    if (F.grid) return F.grid;
    const G = new Uint8Array(GN * GN);
    for (let j = 0; j < GN; j++) {
      const y = (j + 0.5) / GN - 0.5;
      for (let i = 0; i < GN; i++) G[j * GN + i] = isLaminaExact(F, (i + 0.5) / GN - 0.5, y);
    }
    F.grid = G;
    return G;
  }
  function laminaAt(F, x, y, exact) {
    if (exact) return isLaminaExact(F, x, y);
    const i = (x + 0.5) * GN | 0, j = (y + 0.5) * GN | 0;
    if (i < 0 || j < 0 || i >= GN || j >= GN) return 0;
    return F.grid[j * GN + i];
  }

  function isLaminaExact(F, x, y) {
    const q = (0.470 - y) / 0.945;
    if (q >= -0.02 && q <= 1.02) {
      const s = spineAt(Math.max(0, Math.min(1, q)));
      if (Math.abs(x - s[0]) < 0.0090 * (1.25 - 0.62 * q)) return 2;
    }
    for (let i = 0; i < F.P.length; i++) {
      const pn = F.P[i], b = pn.bb;
      if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
      let bdd = 1e9, bp = 0;
      for (let k = 0; k < pn.K; k++) {
        const ax = pn.pts[k * 2], ay = pn.pts[k * 2 + 1];
        const vx = pn.pts[k * 2 + 2] - ax, vy = pn.pts[k * 2 + 3] - ay;
        const L2 = vx * vx + vy * vy || 1e-12;
        let s = ((x - ax) * vx + (y - ay) * vy) / L2;
        s = s < 0 ? 0 : (s > 1 ? 1 : s);
        const dx = x - (ax + vx * s), dy = y - (ay + vy * s), d = dx * dx + dy * dy;
        if (d < bdd) { bdd = d; bp = (k + s) / pn.K; }
      }
      if (Math.sqrt(bdd) < halfW(pn, bp)) return 1;
    }
    return 0;
  }

  /* ════════════════════════════════════════════════════════════════════════
     THE FIELD — scale-free tissue, generated only where it can be seen.

     Nine octaves stepping by 4x. The mosaic band is deliberately narrow
     (7–34 px, a ratio under the octave step) so exactly ONE cell scale is ever
     resolved at a time: two overlapping mosaics read as tripe, one reads as
     epidermis. Each octave fades in and out at its band edges so nothing pops
     as the wheel turns, and each carries a mark budget so a wide view thins
     instead of stalling.
     ════════════════════════════════════════════════════════════════════════ */

  const TISSUE = [
    { s: 0.05500, k: 'blotch', lo: 0.70, hi: 20, bud: 4000 },
    { s: 0.01400, k: 'stipple', lo: 0.55, hi: 34, bud: 26000 },
    { s: 0.00360, k: 'stipple', lo: 0.55, hi: 34, bud: 30000 },
    /* THE MISSING RUNG. Between the last stipple leaving its band (u ~ 9 400)
       and the first pavement mosaic entering its own (u ~ 6 500) the plate hung
       on a single octave — the thin moment. This is the tier where ONE PINNULE
       FILLS THE FRAME: not cells yet, but the AREOLE net, the little islands of
       lamina the veinlets fence off. It spans u ~ 1 900 to 56 000 and hands the
       eye from the drawing to the tissue without a bare stretch between. */
    { s: 0.00160, k: 'areole', lo: 3.0, hi: 90, bud: 7000 },
    { s: 0.00092, k: 'mosaic', lo: 6.0, hi: 200, bud: 3400 },
    { s: 0.00023, k: 'mosaic', lo: 6.0, hi: 200, bud: 3400 },
    { s: 0.000058, k: 'mosaic', lo: 6.0, hi: 200, bud: 3400 },
    { s: 0.0000145, k: 'mosaic', lo: 6.0, hi: 200, bud: 3400 },
    { s: 0.0000036, k: 'mosaic', lo: 6.0, hi: 200, bud: 3400 },
    { s: 0.00000090, k: 'stipple', lo: 0.55, hi: 34, bud: 26000 },
    { s: 0.00000022, k: 'stipple', lo: 0.55, hi: 34, bud: 26000 }
  ];

  /* fade in over the bottom octave of the band, out over the top */
  function bandW(px, lo, hi) {
    const f = Math.min(px / lo, hi / px);
    return f >= 2 ? 1 : Math.max(0, f - 1);
  }

  /* what patch of unit space is on screen right now? */
  function visRect(g) {
    try {
      const m = g.getTransform().inverse(), c = g.canvas;
      const W = c.width, H = c.height;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const cs = [0, 0, W, 0, 0, H, W, H];
      for (let i = 0; i < 4; i++) {
        const p = m.transformPoint(new DOMPoint(cs[i * 2], cs[i * 2 + 1]));
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
      }
      if (!isFinite(x0) || !isFinite(x1)) throw 0;
      return { x0: x0, y0: y0, x1: x1, y1: y1 };
    } catch (e) {
      return { x0: -0.52, y0: -0.52, x1: 0.52, y1: 0.52 };
    }
  }

  /* THE VEINLET NET, on its own rule: legible from a pixel of spacing all the
     way up to a vein broader than the screen. In the gap, one veinlet crossing
     the cell field is the mark that says LEAF and not wallpaper. It is laid
     down BEFORE the cells, because the epidermis lies over the vein — which is
     also what keeps a magnified vein from reading as a flat grey slab. */
  function veinlets(g, u, a, F, X0, X1, Y0, Y1) {
    const s = 0.0021, px = s * u;
    if (px < 0.9) return;
    const i0 = Math.floor(X0 / s), i1 = Math.ceil(X1 / s);
    const j0 = Math.floor(Y0 / s), j1 = Math.ceil(Y1 / s);
    const n = (i1 - i0 + 1) * (j1 - j0 + 1);
    const keep = Math.min(1, 2400 / Math.max(1, n));
    const fat = Math.min(1, px / 60);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        if (keep < 1 && h3(i, j, 909) > keep) continue;
        const ax = (i + h3(i, j, 91)) * s, ay = (j + h3(i, j, 92)) * s;
        if (!laminaAt(F, ax, ay, px > 3.0)) continue;
        for (let d = 0; d < 2; d++) {
          const bi = i + (d ? 0 : 1), bj = j + (d ? 1 : 0);
          const bx = (bi + h3(bi, bj, 91)) * s, by = (bj + h3(bi, bj, 92)) * s;
          const mx = (ax + bx) / 2 + (h3(i, j, 93 + d) - 0.5) * s * 0.55;
          const my = (ay + by) / 2 + (h3(i, j, 95 + d) - 0.5) * s * 0.55;
          g.lineWidth = pw(u, s * 0.028 * (1 + 1.8 * fat), 0.85, 6.0);
          g.strokeStyle = ink('vein', (0.12 + 0.15 * h3(i, j, 97 + d)) * a * (1 - 0.45 * fat));
          g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx, my, bx, by); g.stroke();
        }
      }
    }
  }

  function drawField(g, u, a, F, V) {
    const X0 = Math.max(V.x0, -0.52), X1 = Math.min(V.x1, 0.52);
    const Y0 = Math.max(V.y0, -0.52), Y1 = Math.min(V.y1, 0.52);
    if (X1 <= X0 || Y1 <= Y0) return;

    laminaGrid(F);
    veinlets(g, u, a, F, X0, X1, Y0, Y1);

    for (let o = 0; o < TISSUE.length; o++) {
      const O = TISSUE[o], s = O.s, px = s * u;
      const W = bandW(px, O.lo, O.hi);
      if (W <= 0.01) continue;
      const i0 = Math.floor(X0 / s), i1 = Math.ceil(X1 / s);
      const j0 = Math.floor(Y0 / s), j1 = Math.ceil(Y1 / s);
      const n = (i1 - i0 + 1) * (j1 - j0 + 1);
      if (n <= 0) continue;
      const keep = Math.min(1, O.bud / n);
      const exact = Math.min(n, O.bud) < 2500;   // few marks? afford the truth
      const lw = pw(u, s * 0.085, 0.75, 3.5);
      const showGrana = px > 13;

      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          if (keep < 1 && h3(i, j, o * 31 + 1) > keep) continue;
          const cx0 = (i + 0.5 + (h3(i, j, o * 31 + 2) - 0.5) * 0.60) * s;
          const cy0 = (j + 0.5 + (h3(i, j, o * 31 + 3) - 0.5) * 0.60) * s;
          const lam = laminaAt(F, cx0, cy0, exact);
          /* cells sit on their lattice; the paper's own tooth must NOT — off
             the leaf the mark is thrown right across its cell, or the dark
             reads as graph paper instead of as paper */
          const jit = lam ? 0 : 0.85;
          const cx = cx0 + (h3(i, j, o * 31 + 9) - 0.5) * jit * s;
          const cy = cy0 + (h3(i, j, o * 31 + 10) - 0.5) * jit * s;
          const b = h3(i, j, o * 31 + 4);

          if (O.k === 'mosaic') {
            if (!lam) {                       // off the leaf: the paper's tooth
              g.fillStyle = ink('fog', 0.05 * a * W * b);
              g.fillRect(cx, cy, s * 0.24, s * 0.24);
              continue;
            }
            /* EPIDERMAL PAVEMENT CELLS. Fern epidermis is a jigsaw — the walls
               between neighbouring cells run in waves, never straight. Two
               harmonics on the radius give that without needing a Voronoi. */
            const ph = b * 6.283, ph2 = h3(i, j, o * 31 + 5) * 6.283;
            const R = s * (lam === 2 ? 0.33 : 0.50);

            /* A STOMA. Every so often the mosaic is interrupted by a pore —
               two bean-shaped guard cells swelled around a slit. A fern's
               underside is crowded with them, and it is the one mark that
               makes this field unmistakably the SURFACE OF A LEAF rather than
               cells in general. It is also the plate breathing. */
            if (lam === 1 && px > 22 && h3(i, j, o * 31 + 11) < 0.042) {
              const ang = h3(i, j, o * 31 + 12) * 3.1416;
              const ca = Math.cos(ang), sa = Math.sin(ang);
              for (let sg = -1; sg <= 1; sg += 2) {
                g.beginPath();
                for (let m2 = 0; m2 <= 16; m2++) {
                  const th = m2 / 16 * 6.283;
                  /* a stoma is a good deal SMALLER than the pavement cells it
                     is set into — at equal size the field reads as blobs among
                     blobs instead of as pores in a skin */
                  const lx = Math.cos(th) * R * 0.20;
                  const ly = Math.sin(th) * R * 0.40 + sg * R * 0.18;
                  const qx = cx + lx * ca - ly * sa, qy = cy + lx * sa + ly * ca;
                  if (m2 === 0) g.moveTo(qx, qy); else g.lineTo(qx, qy);
                }
                g.closePath();
                g.fillStyle = ink('grana', 0.22 * a * W);
                g.fill();
                g.lineWidth = lw * 1.15;
                g.strokeStyle = ink('wall', 0.58 * a * W);
                g.stroke();
              }
              g.strokeStyle = ink('pore', 0.60 * a * W);                 // the pore
              g.lineWidth = lw * 1.5;
              g.beginPath();
              g.moveTo(cx - ca * R * 0.18, cy - sa * R * 0.18);
              g.lineTo(cx + ca * R * 0.18, cy + sa * R * 0.18);
              g.stroke();
              continue;
            }
            g.beginPath();
            for (let m2 = 0; m2 <= 20; m2++) {
              const th = m2 / 20 * 6.283;
              const rr = R * (1 + 0.26 * Math.sin(3 * th + ph) + 0.13 * Math.sin(5 * th + ph2));
              const qx = cx + Math.cos(th) * rr, qy = cy + Math.sin(th) * rr * 0.85;
              if (m2 === 0) g.moveTo(qx, qy); else g.lineTo(qx, qy);
            }
            g.closePath();
            g.fillStyle = ink('blade', 0.20 * a * W);
            g.fill();
            g.lineJoin = 'round'; g.lineWidth = lw;
            g.strokeStyle = ink('wall', (0.22 + 0.26 * b) * a * W);
            g.stroke();
            /* chloroplasts belong to a cell, so they are drawn inside one —
               crowded toward its walls, the way they actually sit */
            if (showGrana && lam === 1) {
              const ng = 4 + ((h3(i, j, o * 31 + 6) * 4) | 0);
              for (let q2 = 0; q2 < ng; q2++) {
                const th = h3(i * 7 + q2, j, o * 31 + 7) * 6.283;
                const rr = R * (0.34 + 0.50 * h3(i, j * 7 + q2, o * 31 + 8));
                g.fillStyle = ink('grana', (0.26 + 0.34 * h3(i + q2, j, 55)) * a * W);
                g.beginPath();
                g.ellipse(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr * 0.85,
                  R * 0.20, R * 0.13, th, 0, 6.283);
                g.fill();
              }
            }

          } else if (O.k === 'areole') {
            /* AN AREOLE — the island of lamina one loop of veinlets fences off.
               Drawn as its fence, not as a fill: the tone inside it is whatever
               octave below is currently landing, so the rung never becomes the
               wash it is here to prevent. */
            if (!lam) {
              g.fillStyle = ink('fog', 0.045 * a * W * b);
              g.fillRect(cx, cy, s * 0.16, s * 0.16);
              continue;
            }
            const aph = b * 6.283, aph2 = h3(i, j, o * 31 + 5) * 6.283;
            const AR = s * 0.62;
            g.beginPath();
            for (let m2 = 0; m2 <= 14; m2++) {
              const th = m2 / 14 * 6.283;
              const rr = AR * (1 + 0.30 * Math.sin(2 * th + aph) + 0.16 * Math.sin(3 * th + aph2));
              const qx = cx + Math.cos(th) * rr, qy = cy + Math.sin(th) * rr * 0.82;
              if (m2 === 0) g.moveTo(qx, qy); else g.lineTo(qx, qy);
            }
            g.closePath();
            g.fillStyle = ink('blade', 0.16 * a * W);
            g.fill();
            g.lineJoin = 'round';
            g.lineWidth = pw(u, s * 0.055, 0.6, 3.0);
            g.strokeStyle = ink('vein', (0.20 + 0.20 * b) * a * W);
            g.stroke();
            /* a few specks inside, so the net is never an empty wireframe */
            const nsk = 2 + ((h3(i, j, o * 31 + 6) * 3) | 0);
            for (let q2 = 0; q2 < nsk; q2++) {
              const th = h3(i * 7 + q2, j, o * 31 + 7) * 6.283;
              const rr = AR * 0.62 * Math.sqrt(h3(i, j * 7 + q2, o * 31 + 8));
              g.fillStyle = ink('edge', (0.10 + 0.16 * h3(i + q2, j, 57)) * a * W);
              g.beginPath();
              g.arc(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr * 0.82, AR * 0.085, 0, 6.283);
              g.fill();
            }

          } else if (O.k === 'blotch') {
            g.fillStyle = ink(lam ? 'edge' : 'fog',
              (lam ? 0.095 : 0.026) * a * W * (0.3 + b));
            g.beginPath(); g.arc(cx, cy, s * (0.16 + 0.20 * b), 0, 6.283); g.fill();

          } else {                            /* stipple — the engraver's dots */
            const al = (lam ? 0.16 + 0.40 * b * b : 0.026 + 0.050 * b * b) * a * W;
            const d = s * (0.13 + 0.17 * b);
            g.fillStyle = ink(lam ? (b > 0.82 ? 'vein' : 'edge') : 'fog', al);
            /* a dot, not a tile — squares read as blocky noise the moment the
               mark clears a pixel or two, which is exactly the size an
               engraver's stipple wants to be */
            if (d * u > 1.6) { g.beginPath(); g.arc(cx, cy, d * 0.62, 0, 6.283); g.fill(); }
            else g.fillRect(cx, cy, d, d);
          }
        }
      }
    }

  }

  /* ════════════════════════════════════════════════════════════════════════
     THE DRAWING
     ════════════════════════════════════════════════════════════════════════ */

  function bladePath(g, pn, steps, grow, pad) {
    g.beginPath();
    for (let k = 0; k <= steps; k++) {
      const p = k / steps, c = costa(pn, p), w = halfW(pn, p) * grow + pad;
      if (k === 0) g.moveTo(c[0] + c[2] * w, c[1] + c[3] * w);
      else g.lineTo(c[0] + c[2] * w, c[1] + c[3] * w);
    }
    for (let k = steps; k >= 0; k--) {
      const p = k / steps, c = costa(pn, p), w = halfW(pn, p) * grow + pad;
      g.lineTo(c[0] - c[2] * w, c[1] - c[3] * w);
    }
    g.closePath();
  }

  /* the smooth envelope, lobes ignored — this is the frond's MASS, and at
     fifteen pixels it is the only thing left of the drawing */
  function envPath(g, pn, grow, pad) {
    const steps = 14;
    g.beginPath();
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k <= steps; k++) {
        const p = side ? 1 - k / steps : k / steps;
        const c = costa(pn, p);
        const w = (pn.hw0 * Math.pow(Math.max(0, 1 - p), 0.52)
          * (0.52 + 0.48 * Math.min(1, p * 8))) * grow + pad;
        const sg = side ? -1 : 1;
        const x = c[0] + c[2] * sg * w, y = c[1] + c[3] * sg * w;
        if (!side && k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
    }
    g.closePath();
  }

  PlateArt.fern = function (g, u, a, t, anchor) {
    g.save();
    g.scale(u, u);

    const A = (anchor && anchor.length === 2) ? anchor : [0.10, -0.22];
    const F = buildFrond(A);

    /* the frond breathes at its base — a lean of about six milliradians, which
       carries the crown through some seven thousandths of a unit. Slow enough
       that it never reads as a jitter, even standing inside the leaf. */
    const sway = Math.sin(t * 0.21) * 0.0042 + Math.sin(t * 0.131 + 1.7) * 0.0022;
    g.translate(0, 0.470); g.rotate(sway); g.translate(0, -0.470);

    const V = visRect(g);
    /* is this mark anywhere near the screen? Cheap, and it is what keeps the
       cost of the drawing bounded by the WINDOW rather than by the plate —
       the same principle the tissue field is built on. */
    const inV = (x, y, pad) => x > V.x0 - pad && x < V.x1 + pad
      && y > V.y0 - pad && y < V.y1 + pad;
    const lod = 1 / u;                          // one pixel, in unit space
    const wide = (V.x1 - V.x0) > 0.30;

    /* ── 1 · THE MASS ────────────────────────────────────────────────────── */
    if (wide) {
      /* at fifteen pixels the outlines are gone and this haze is the entire
         drawing, so it is allowed to carry more weight the smaller it gets */
      const near = Math.max(0, Math.min(1, (220 - u) / 220));
      const lift = 1 + 2.6 * near;
      /* At fifteen pixels a frond is not nineteen pinnae. It is ONE lanceolate
         mass leaning off a stem, wide a third of the way up and drawn to a
         point — so that silhouette is laid down first, under everything, and it
         is what makes the mote read as a frond instead of a smear of green. */
      if (near > 0.02) {
        g.beginPath();
        for (let side = 0; side < 2; side++) {
          for (let k = 0; k <= 26; k++) {
            const q = side ? 1 - k / 26 : k / 26;
            const s0 = spineAt(q);
            const w = 0.300 * lenShape(q) * Math.cos(0.26 + 0.52 * q) * (side ? -1 : 1);
            const x = s0[0] + w, y = s0[1] - Math.abs(w) * 0.34;
            if (!side && k === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
        }
        g.closePath();
        g.fillStyle = 'rgba(' + INK.edge + ',' + (0.105 * near * a) + ')';
        g.fill();
      }
      for (let pass = 1; pass >= 0; pass--) {
        g.fillStyle = 'rgba(' + INK.edge + ',' + ((pass ? 0.030 : 0.058) * lift * a) + ')';
        for (let i = 0; i < F.P.length; i++) {
          envPath(g, F.P[i], pass ? 1.22 : 0.96, pass ? lod * 1.6 : lod * 0.5);
          g.fill();
        }
      }
    }

    /* ── 2 · THE PINNAE ─────────────────────────────────────────────────── */
    const cap = Math.max(10, Math.min(110, Math.round(u * 0.075)));
    /* Each pinna breathes on its own phase, so the frond does not swing as one
       rigid board — except the pinna the child grows out of, which is held
       still: if IT leaned, the anchor would drift out from under the picture
       that names it. The lean fades out as you enter the leaf, where a
       millimetre of sway would be a mile. */
    const perLean = 0.0062 * Math.max(0, Math.min(1, (20000 - u) / 12000));
    for (let i = 0; i < F.P.length; i++) {
      const pn = F.P[i], b = pn.bb;
      if (b[2] < V.x0 || b[0] > V.x1 || b[3] < V.y0 || b[1] > V.y1) continue;
      const steps = Math.max(14, Math.min(cap, pn.lobes * 9));
      const lean = (i === F.anchorPinna) ? 0 : perLean * Math.sin(t * 0.23 + pn.seed * 1.77);

      g.save();
      if (lean) {
        g.translate(pn.B[0], pn.B[1]); g.rotate(lean); g.translate(-pn.B[0], -pn.B[1]);
      }

      const wob = h3(pn.seed, 1, 44);
      bladePath(g, pn, steps, 1, 0);
      g.fillStyle = 'rgba(' + INK.blade + ',' + (0.66 * a) + ')';
      g.fill();
      g.lineJoin = 'round'; g.lineCap = 'round';

      /* ── THE LAMINA, built out of the DENSITY OF MARKS ────────────────────
         This is the whole difference between an engraved plate and a wire
         diagram: a blade is not a hollow loop, it is TONE. Raked hatching is
         laid inside the outline, heavier under the flank that turns away from
         the light and opening out toward the lit one. No wash anywhere — every
         value in the leaf is a count of strokes. */
      if (u > 130) {
        g.save();
        bladePath(g, pn, steps, 1, 0);
        g.clip();
        const nh = Math.max(6, Math.min(130, Math.round(pn.lobes * 9)));
        g.lineWidth = pw(u, pn.hw0 * 0.030, 0.5, 2.2);
        for (let k = 0; k < nh; k++) {
          const p = (k + 0.5) / nh;
          const c = costa(pn, p), w = halfW(pn, p) * 1.35;
          const fw = costa(pn, Math.min(1, p + 0.05));
          const rx = (fw[0] - c[0]) * 0.55, ry = (fw[1] - c[1]) * 0.55;
          if (!inV(c[0], c[1], w * 2.2)) continue;
          const jt = h3(pn.seed, k, 61);
          for (let sg = -1; sg <= 1; sg += 2) {
            /* the light is up-left: the flank whose normal points up keeps its
               tone open, the one that turns away closes up */
            const up = -(c[3] * sg);
            const dens = 0.30 - 0.13 * up;
            if (h3(pn.seed, k * 2 + (sg > 0 ? 1 : 0), 62) > 0.42 + 0.55 * dens) continue;
            g.strokeStyle = ink('edge', dens * (0.50 + 0.80 * jt) * a);
            g.beginPath();
            g.moveTo(c[0] + c[2] * sg * w * 0.06, c[1] + c[3] * sg * w * 0.06);
            g.quadraticCurveTo(c[0] + c[2] * sg * w * 0.55 + rx * 0.45,
              c[1] + c[3] * sg * w * 0.55 + ry * 0.45,
              c[0] + c[2] * sg * w * 1.05 + rx, c[1] + c[3] * sg * w * 1.05 + ry);
            g.stroke();
          }
        }
        g.restore();
      }

      /* THE CONTOUR, WEIGHTED ALONG ITS LENGTH. An engraver never draws a
         closed line at one pressure. The top of a lobe catches the light and
         thins away toward nothing; the underside carries the weight. Drawn at
         one weight — as it was — a blade reads as a cutout. */
      const cw = 0.0011 + 0.0008 * wob;
      if (u > 90) {
        let px0 = 0, py0 = 0;
        for (let sd = 0; sd < 2; sd++) {
          const sg = sd ? -1 : 1;
          for (let k = 0; k <= steps; k++) {
            const p = k / steps, c = costa(pn, p), w = halfW(pn, p);
            const x = c[0] + c[2] * sg * w, y = c[1] + c[3] * sg * w;
            if (k > 0 && (inV(x, y, 8 / u) || inV(px0, py0, 8 / u))) {
              const mp = (k - 0.5) / steps, mc = costa(pn, mp);
              const lit = 0.5 - 0.5 * (mc[3] * sg);
              const n2 = h3(pn.seed, k + sd * 211, 45);
              g.lineWidth = pw(u, cw * (0.55 + 0.85 * (1 - lit) + 0.35 * n2), 0.6, 5.0);
              g.strokeStyle = ink('edge', (0.20 + 0.46 * lit + 0.16 * n2) * a * (1 - 0.28 * mp));
              g.beginPath(); g.moveTo(px0, py0); g.lineTo(x, y); g.stroke();
            }
            px0 = x; py0 = y;
          }
        }
      } else {
        g.lineWidth = pw(u, cw, 0.9, 5.0);
        g.strokeStyle = 'rgba(' + INK.edge + ',' + ((0.44 + 0.26 * wob) * a) + ')';
        bladePath(g, pn, steps, 1, 0);
        g.stroke();
      }

      /* the costa */
      g.lineWidth = pw(u, 0.0012, 0.85, 5.0);
      g.strokeStyle = 'rgba(' + INK.vein + ',' + (0.42 * a) + ')';
      g.beginPath();
      for (let k = 0; k <= pn.K; k++) {
        const x = pn.pts[k * 2], y = pn.pts[k * 2 + 1];
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();

      /* one veinlet out into each pinnule, raked forward with its lobe */
      if (u > 110) {
        g.lineWidth = pw(u, 0.0007, 0.7, 4.0);
        g.strokeStyle = 'rgba(' + INK.vein + ',' + (0.30 * a) + ')';
        for (let L = 0; L < pn.lobes; L++) {
          const p = Math.min(0.98, (L + LOBE_CREST) / pn.lobes
            + (LOBE_CREST - pn.lphase) / pn.lobes);
          const c = costa(pn, p), w = halfW(pn, p);
          if (!inV(c[0], c[1], w * 2.2)) continue;
          const fx = costa(pn, Math.min(1, p + 0.06));   // forward, toward the tip
          const rake = [fx[0] - c[0], fx[1] - c[1]];
          for (let sg = -1; sg <= 1; sg += 2) {
            g.beginPath(); g.moveTo(c[0], c[1]);
            g.quadraticCurveTo(c[0] + c[2] * sg * w * 0.50 + rake[0] * 0.25,
              c[1] + c[3] * sg * w * 0.50 + rake[1] * 0.25,
              c[0] + c[2] * sg * w * 0.82 + rake[0] * 0.55,
              c[1] + c[3] * sg * w * 0.82 + rake[1] * 0.55);
            g.stroke();
            /* fern venation FORKS — free, dichotomous, never a feather. Once
               there is room for the branch, it takes it. */
            if (u > 420) {
              const mx = c[0] + c[2] * sg * w * 0.46 + rake[0] * 0.22;
              const my = c[1] + c[3] * sg * w * 0.46 + rake[1] * 0.22;
              g.beginPath(); g.moveTo(mx, my);
              g.quadraticCurveTo(c[0] + c[2] * sg * w * 0.72 - rake[0] * 0.10,
                c[1] + c[3] * sg * w * 0.72 - rake[1] * 0.10,
                c[0] + c[2] * sg * w * 0.86 - rake[0] * 0.30,
                c[1] + c[3] * sg * w * 0.86 - rake[1] * 0.30);
              g.stroke();
            }
          }
        }
      }

      /* SORI. Fertile only on the lower, older pinnae — a frond does not set
         spore in its youngest tissue — and a sorus is a CLUSTER of sporangia,
         not a bead, so it is drawn as one: five or six specks under the blade,
         in the two rows either side of the costa where they really sit. */
      if (pn.B[1] > -0.10 && u > 190) {
        for (let L = 0; L < pn.lobes; L++) {
          if (h3(pn.seed, L, 21) > 0.52) continue;
          const p = Math.min(0.96, (L + LOBE_CREST) / pn.lobes
            + (LOBE_CREST - pn.lphase) / pn.lobes);
          const c = costa(pn, p), w = halfW(pn, p);
          if (!inV(c[0], c[1], w * 2.2)) continue;
          for (let sg = -1; sg <= 1; sg += 2) {
            const bx = c[0] + c[2] * sg * w * 0.52, by = c[1] + c[3] * sg * w * 0.52;
            const nsp = 5 + ((h3(pn.seed, L * 3 + sg + 1, 23) * 3) | 0);
            for (let q2 = 0; q2 < nsp; q2++) {
              const th = h3(pn.seed * 5 + L, q2, 24 + sg) * 6.283;
              const rr = w * 0.22 * Math.sqrt(h3(pn.seed, q2 * 7 + L, 26));
              g.fillStyle = 'rgba(' + INK.sorus + ','
                + ((0.40 + 0.30 * h3(L, q2, 27)) * a) + ')';
              g.beginPath();
              g.arc(bx + Math.cos(th) * rr, by + Math.sin(th) * rr * 0.8,
                w * 0.064, 0, 6.283);
              g.fill();
            }
            /* THE INDUSIUM — the papery hood drawn over the cluster while it
               ripens. It is the mark that tells a sorus from a speck of dirt,
               and it only appears once there is room to draw it. */
            if (u > 520) {
              g.lineWidth = pw(u, w * 0.018, 0.55, 3.0);
              g.strokeStyle = 'rgba(' + INK.sorus + ',' + (0.40 * a) + ')';
              g.beginPath(); g.arc(bx, by, w * 0.30, 0, 6.283); g.stroke();
            }
          }
        }
      }
      g.restore();
    }

    /* ── 3 · THE RACHIS AND STIPE ────────────────────────────────────────── */
    const stemW = q => 0.0088 * (1 - 0.66 * q);
    g.beginPath();
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k <= 44; k++) {
        const q = side ? 1 - k / 44 : k / 44;
        const s0 = spineAt(q), s1 = spineAt(Math.min(1, q + 0.02));
        let nx = s1[1] - s0[1], ny = -(s1[0] - s0[0]);
        const m = Math.hypot(nx, ny) || 1;
        const w = Math.max(stemW(q), 0.75 / u) * (side ? -1 : 1);
        const x = s0[0] + nx / m * w, y = s0[1] + ny / m * w;
        if (!side && k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
    }
    g.closePath();
    g.fillStyle = 'rgba(' + INK.blade + ',' + (0.86 * a) + ')';
    g.fill();
    g.lineWidth = pw(u, 0.0011, 0.8, 6.0);
    g.strokeStyle = 'rgba(' + INK.rachis + ',' + (0.50 * a) + ')';
    g.stroke();
    /* the lit ridge down its left flank — the light is coming from up-left */
    g.lineWidth = pw(u, 0.0013, 0.8, 6.0);
    g.strokeStyle = 'rgba(' + INK.rachis + ',' + (0.62 * a) + ')';
    g.beginPath();
    for (let k = 0; k <= 44; k++) {
      const q = k / 44, s0 = spineAt(q), s1 = spineAt(Math.min(1, q + 0.02));
      let nx = s1[1] - s0[1], ny = -(s1[0] - s0[0]);
      const m = Math.hypot(nx, ny) || 1, w = stemW(q) * 0.42;
      if (k === 0) g.moveTo(s0[0] - nx / m * w, s0[1] - ny / m * w);
      else g.lineTo(s0[0] - nx / m * w, s0[1] - ny / m * w);
    }
    g.stroke();

    /* ── RAMENTA. The papery scales at the foot of the stipe: cheap to draw,
       and the whole difference between a stem and a specimen somebody actually
       collected. Indexed by hash and never by a running stream, so switching
       this level of detail on part-way through a dive cannot reshuffle one
       other mark on the plate. ── */
    if (u > 150) {
      g.lineJoin = 'round'; g.lineCap = 'round';
      for (let i = 0; i < 15; i++) {
        const q = 0.004 + h3(i, 81, 5) * 0.085;
        const s0 = spineAt(q), s1 = spineAt(Math.min(1, q + 0.02));
        let nx = s1[1] - s0[1], ny = -(s1[0] - s0[0]);
        const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
        const sg = h3(i, 82, 5) < 0.5 ? 1 : -1;
        const Ls = 0.012 + h3(i, 83, 5) * 0.013;
        const tx = s0[0] + nx * sg * Ls * 0.72, ty = s0[1] + ny * sg * Ls * 0.72 - Ls * 0.62;
        g.beginPath();
        g.moveTo(s0[0] - nx * sg * 0.0014, s0[1] - ny * sg * 0.0014);
        g.quadraticCurveTo(s0[0] + nx * sg * Ls * 0.62, s0[1] + ny * sg * Ls * 0.62 - Ls * 0.10,
          tx, ty);
        g.quadraticCurveTo(s0[0] + nx * sg * Ls * 0.18, s0[1] + ny * sg * Ls * 0.18 - Ls * 0.30,
          s0[0] + nx * sg * 0.0014, s0[1] + ny * sg * 0.0014);
        g.closePath();
        g.fillStyle = 'rgba(' + INK.sorus + ',' + ((0.15 + 0.13 * h3(i, 84, 5)) * a) + ')';
        g.fill();
        g.lineWidth = pw(u, 0.0008, 0.55, 3.0);
        g.strokeStyle = 'rgba(' + INK.rachis + ',' + (0.32 * a) + ')';
        g.stroke();
      }
    }

    /* ── 4 · THE CROWN, STILL COILING ────────────────────────────────────
       The one gesture that says the thing is alive: the tip has not finished
       unrolling. A half turn of crozier, tightening, with the youngest pinnae
       still folded against it. ── */
    if (u > 70) {
      /* built by INTEGRATING a curvature that grows along the arc — which is
         how a crozier actually coils, and the only way to leave it tangent to
         the rachis it grows out of. A lasso would give it away instantly. */
      const T = spineAt(1), Tp = spineAt(0.965);
      let th = Math.atan2(T[1] - Tp[1], T[0] - Tp[0]);
      const N = 54, arc = 0.082, ds = arc / N;
      const CX = new Float64Array(N + 1), CY = new Float64Array(N + 1), CT = new Float64Array(N + 1);
      let x = T[0], y = T[1];
      for (let k = 0; k <= N; k++) {
        CX[k] = x; CY[k] = y; CT[k] = th;
        const p = k / N;
        th += (44 + 520 * p * p) * ds;          // curvature tightening into the coil
        x += Math.cos(th) * ds; y += Math.sin(th) * ds;
      }
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) {
        g.beginPath();
        for (let k = 0; k <= N; k++) { if (k === 0) g.moveTo(CX[k], CY[k]); else g.lineTo(CX[k], CY[k]); }
        g.lineWidth = pass ? pw(u, 0.0016, 0.75, 5.0) : pw(u, 0.0038, 1.2, 9.0);
        g.strokeStyle = pass ? 'rgba(' + INK.rachis + ',' + (0.60 * a) + ')'
          : 'rgba(' + INK.blade + ',' + (0.85 * a) + ')';
        g.stroke();
      }
      /* the youngest pinnae, still folded flat against the outside of the coil */
      g.lineWidth = pw(u, 0.0009, 0.7, 4.0);
      for (let k = 4; k < N - 8; k += 4) {
        const p = k / N, ln = 0.0135 * (1 - p) * (1 - p);
        const nx = -Math.sin(CT[k]), ny = Math.cos(CT[k]);
        const tx = Math.cos(CT[k]), ty = Math.sin(CT[k]);
        g.strokeStyle = 'rgba(' + INK.edge + ',' + ((0.38 - 0.22 * p) * a) + ')';
        g.beginPath(); g.moveTo(CX[k], CY[k]);
        /* they are not spines. They are leaves that have not opened yet, so
           each one curls back ALONG the coil instead of standing off it —
           which is the difference between a crozier and a comb. */
        g.quadraticCurveTo(CX[k] - nx * ln * 0.85 + tx * ln * 0.30,
          CY[k] - ny * ln * 0.85 + ty * ln * 0.30,
          CX[k] - nx * ln * 0.70 + tx * ln * 0.95,
          CY[k] - ny * ln * 0.70 + ty * ln * 0.95);
        g.stroke();
      }
    }

    /* ── 5 · THE TISSUE FIELD, over everything ──────────────────────────── */
    drawField(g, u, a, F, V);

    /* ── 6 · THE ANCHOR — the seated pinnule's own tip, slightly out of
       focus, which the child plate then resolves into. ── */
    if (anchor) {
      const gr = g.createRadialGradient(A[0], A[1], 0, A[0], A[1], 0.040);
      gr.addColorStop(0, 'rgba(' + INK.vein + ',' + (0.15 * a) + ')');
      gr.addColorStop(0.44, 'rgba(' + INK.edge + ',' + (0.055 * a) + ')');
      gr.addColorStop(1, 'rgba(' + INK.edge + ',0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(A[0], A[1], 0.040, 0, 6.283); g.fill();
      /* the spore-dust on that one pinnule, a little out of focus */
      for (let i = 0; i < 18; i++) {
        const th = h3(i, 5, 71) * 6.283, d = Math.pow(h3(i, 6, 72), 0.55) * 0.026;
        g.fillStyle = 'rgba(' + INK.wall + ',' + ((0.07 + 0.16 * h3(i, 7, 73)) * a) + ')';
        g.beginPath();
        g.arc(A[0] + Math.cos(th) * d, A[1] + Math.sin(th) * d * 0.8,
          0.0011 + 0.0022 * h3(i, 8, 74), 0, 6.283);
        g.fill();
      }
    }

    g.globalAlpha = 1;
    g.restore();
  };

})();

/* ═══ 0  THE HAND ═════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — plate 10⁰ : THE HAND        (foundry take 3)

   The one living thing on the ladder, so it is built the way a living thing is
   built: not an outline with a wash inside, but a SURFACE — a lamplit skin with
   a cupped hollow, six mounds, three deep creases, and a friction-ridge field
   that keeps going down as far as you can push the glass.

   The ridge field is the whole trick. Palm skin is not a texture you paint on;
   it is a FLOW — a scalar field whose level sets are the ridges, arched over
   every pad the way a real ridge system arches around a triradius. Here that
   field is authored ONCE and then sampled at whichever octave of ridge spacing
   currently lands near eleven device pixels, the octaves cross-faded by a
   log-hump weight. At the plate's own decade you read the flow as the fine
   modelling of skin; blow it up three hundred times and the same field, four
   octaves finer, resolves into individual ridges with sweat pores strung along
   their crests. Nothing is re-drawn between those two views. It is one surface,
   seen closer — which is the only honest way to build a plate that a visitor
   is going to fall through.

   Everything is culled to the visible box (recovered from the live transform),
   so the deep zoom spends its whole budget on the few square millimetres you
   are actually looking at instead of on a metre of hand you cannot see.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── the lamp: low, warm, up and to the left ─────────────────────────────── */
  var LX = -0.55, LY = -0.835;

  /* the plate's current side in CSS px, so a mark can ask whether it is big
     enough on THIS screen to be worth drawing. Set once per draw. */
  var u0 = 600;

  /* ── deterministic hashes (no Math.random anywhere in this plate) ────────── */
  function hsh(i, j, s) {
    var n = (i * 374761393 + j * 668265263 + s * 1274126177) | 0;
    n = ((n ^ (n >>> 13)) * 1274126177) | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  /* ── what part of unit space is actually on screen right now ─────────────── */
  function visBox(g) {
    var x0 = -0.64, y0 = -0.64, x1 = 0.64, y1 = 0.64;
    try {
      var M = g.getTransform(), cv = g.canvas;
      var det = M.a * M.d - M.b * M.c;
      if (det && cv && cv.width) {
        var W = cv.width, H = cv.height;
        var ia = M.d / det, ib = -M.b / det, ic = -M.c / det, id = M.a / det;
        var ie = (M.c * M.f - M.d * M.e) / det, jf = (M.b * M.e - M.a * M.f) / det;
        var xs = [], ys = [], P = [[0, 0], [W, 0], [0, H], [W, H]];
        for (var i = 0; i < 4; i++) {
          var X = P[i][0], Y = P[i][1];
          xs.push(ia * X + ic * Y + ie); ys.push(ib * X + id * Y + jf);
        }
        x0 = Math.max(x0, Math.min.apply(null, xs));
        x1 = Math.min(x1, Math.max.apply(null, xs));
        y0 = Math.max(y0, Math.min.apply(null, ys));
        y1 = Math.min(y1, Math.max.apply(null, ys));
      }
    } catch (e) { /* no getTransform — fall back to the whole plate */ }
    if (x1 <= x0) { x0 = -0.64; x1 = 0.64; }
    if (y1 <= y0) { y0 = -0.64; y1 = 0.64; }
    return [x0, y0, x1, y1];
  }

  /* ── THE ANATOMY ─────────────────────────────────────────────────────────── */
  /* base [x,y], tip [x,y], half-width at base, half-width at tip, sideways bend */
  var FINGERS = [
    [[-0.190, -0.045], [-0.238, -0.322], 0.055, 0.034, 0.020],   // index
    [[-0.058, -0.072], [-0.076, -0.372], 0.057, 0.035, 0.013],   // middle
    [[ 0.068, -0.066], [ 0.117, -0.330], 0.054, 0.034, -0.016],  // ring
    [[ 0.176, -0.020], [ 0.250, -0.214], 0.045, 0.028, -0.021]   // little
  ];
  var THUMB = [[-0.240, 0.230], [-0.428, -0.026], 0.074, 0.044, 0.026];

  /* the pads: where the ridge flow arches. [x, y, radius, amplitude] */
  var PADS = [
    [-0.234, -0.296, 0.066, 0.0210], [-0.078, -0.344, 0.070, 0.0224],
    [ 0.113, -0.302, 0.066, 0.0210], [ 0.246, -0.194, 0.056, 0.0176],
    [-0.410, -0.006, 0.078, 0.0250],
    /* the four monticuli at the finger roots, then the two great mounds */
    [-0.172,  0.000, 0.058, 0.0120], [-0.050, -0.018, 0.060, 0.0124],
    [ 0.073, -0.008, 0.056, 0.0116], [ 0.170,  0.036, 0.050, 0.0100],
    [-0.224,  0.212, 0.128, 0.0240], [ 0.186,  0.228, 0.112, 0.0200]
  ];

  function palmPath(g) {
    g.moveTo(-0.150, 0.580);
    g.bezierCurveTo(-0.236, 0.474, -0.302, 0.352, -0.296, 0.212);
    g.bezierCurveTo(-0.292, 0.104, -0.262, 0.010, -0.232, -0.062);
    g.bezierCurveTo(-0.150, -0.112, -0.024, -0.124, 0.084, -0.100);
    g.bezierCurveTo(0.150, -0.084, 0.198, -0.056, 0.224, -0.014);
    g.bezierCurveTo(0.272, 0.100, 0.246, 0.316, 0.178, 0.452);
    g.bezierCurveTo(0.156, 0.508, 0.142, 0.548, 0.136, 0.580);
    g.closePath();
  }

  /* A finger is not a tube. It is a tapering column that swells at each joint
     and pinches between them, on an axis that bows outward. So the outline is
     SAMPLED from a width profile rather than drawn as a capsule — that one
     change is most of the difference between a hand and a rubber glove.
     Wound clockwise (screen sense), like the palm, so the whole hand fills as
     a single nonzero region and no seam punches a hole through it. */
  function bump(q, c, s) { var d = (q - c) / s; return Math.exp(-d * d); }
  function fingerGeom(F, q) {
    var b = F[0], tp = F[1], w0 = F[2], w1 = F[3], bend = F[4];
    var dx = tp[0] - b[0], dy = tp[1] - b[1], L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var qq = Math.min(q, 1), cap = Math.max(0, q - 1) / 0.15;
    var w = (w0 + (w1 - w0) * qq)
          * (1 + 0.050 * bump(qq, 0.40, 0.16) + 0.038 * bump(qq, 0.73, 0.13)
               - 0.030 * bump(qq, 0.57, 0.12) - 0.026 * bump(qq, 0.88, 0.10));
    if (cap > 0) w *= Math.sqrt(Math.max(0, 1 - cap * cap));
    var s = bend * Math.sin(Math.PI * qq * 0.92);
    var ax = b[0] + ux * L * qq + nx * s + ux * (cap > 0 ? cap * w1 * 1.18 : 0);
    var ay = b[1] + uy * L * qq + ny * s + uy * (cap > 0 ? cap * w1 * 1.18 : 0);
    return [ax, ay, nx * w, ny * w];
  }
  function fingerPath(g, F) {
    var N = 48, i, G;
    G = fingerGeom(F, 0);
    g.moveTo(G[0] - G[2], G[1] - G[3]);
    for (i = 1; i <= N; i++) { G = fingerGeom(F, 1.15 * i / N); g.lineTo(G[0] - G[2], G[1] - G[3]); }
    for (i = N - 1; i >= 0; i--) { G = fingerGeom(F, 1.15 * i / N); g.lineTo(G[0] + G[2], G[1] + G[3]); }
    g.closePath();
  }

  function handPath(g) {
    g.beginPath();
    palmPath(g);
    for (var i = 0; i < FINGERS.length; i++) fingerPath(g, FINGERS[i]);
    fingerPath(g, THUMB);
  }

  /* ── THE RIDGE FIELD ─────────────────────────────────────────────────────
     q(x,y) = const is one ridge: a gentle transverse drift, plus one gaussian
     arch per pad. */
  function fieldQ(x, y) {
    var q = y
      + 0.046 * Math.sin(2.90 * x + 0.55)
      + 0.021 * Math.sin(4.90 * x - 1.10)
      + 0.026 * Math.sin(1.90 * y + 2.10) * Math.cos(1.60 * x);
    for (var i = 0; i < PADS.length; i++) {
      var p = PADS[i], dx = x - p[0], dy = y - p[1], R = p[2];
      var e = (dx * dx + dy * dy) / (R * R);
      if (e < 9) q += p[3] * Math.exp(-e);
    }
    return q;
  }
  /* solve q(x,y)=v for y — dq/dy is within a whisker of 1, so plain iteration */
  function solveY(x, v) {
    var y = v;
    y -= (fieldQ(x, y) - v);
    y -= (fieldQ(x, y) - v);
    y -= (fieldQ(x, y) - v);
    return y;
  }

  /* one octave of ridges: spacing S, weight w, drawn only inside `box` */
  function ridgeOctave(g, u, A, S, w, box, seed, deep) {
    var x0 = box[0], y0 = box[1], x1 = box[2], y1 = box[3];
    var qmin = 1e9, qmax = -1e9;
    for (var i = 0; i <= 4; i++) for (var j = 0; j <= 4; j++) {
      var q = fieldQ(x0 + (x1 - x0) * i / 4, y0 + (y1 - y0) * j / 4);
      if (q < qmin) qmin = q; if (q > qmax) qmax = q;
    }
    var pad = (x1 - x0) * 0.08 + S;
    var kLo = Math.floor((qmin - pad) / S), kHi = Math.ceil((qmax + pad) / S);
    var nR = kHi - kLo + 1;
    if (nR > 230) { kHi = kLo + 229; nR = 230; }
    var nS = Math.round(Math.min(Math.max((x1 - x0) / (S * 0.75), 16), 190));
    if (nR * nS > 10500) nS = Math.max(10, Math.floor(10500 / nR));
    var dx = (x1 - x0) / (nS - 1);

    /* THE COLUMN CACHE. The field's x-dependent parts, and the short list of
       pads that can possibly reach this column, are the same for every ridge
       — so they are computed once per column instead of once per sample. The
       whole octave's geometry is then solved ONCE and stroked twice. */
    var xs = new Float64Array(nS), FX = new Float64Array(nS), CX = new Float64Array(nS);
    var colPad = new Array(nS), sI, pI;
    for (sI = 0; sI < nS; sI++) {
      var xc = x0 + sI * dx;
      xs[sI] = xc;
      FX[sI] = 0.046 * Math.sin(2.90 * xc + 0.55) + 0.021 * Math.sin(4.90 * xc - 1.10);
      CX[sI] = 0.026 * Math.cos(1.60 * xc);
      var lst = null;
      for (pI = 0; pI < PADS.length; pI++) {
        var Pd = PADS[pI], ddx = xc - Pd[0];
        if (Math.abs(ddx) < 3 * Pd[2]) {
          (lst || (lst = [])).push(ddx * ddx, 1 / (Pd[2] * Pd[2]), Pd[3], Pd[1]);
        }
      }
      colPad[sI] = lst;
    }
    function solveCol(sI2, v) {
      var y = v, it, L2 = colPad[sI2], q, p;
      for (it = 0; it < 2; it++) {
        q = y + FX[sI2] + Math.sin(1.90 * y + 2.10) * CX[sI2];
        if (L2) for (p = 0; p < L2.length; p += 4) {
          var dyp = y - L2[p + 3], e = (L2[p] + dyp * dyp) * L2[p + 1];
          if (e < 9) q += L2[p + 2] * Math.exp(-e);
        }
        y -= (q - v);
      }
      return y;
    }
    /* solve the whole octave once */
    var YY = new Float64Array(nR * nS), GAP = new Uint8Array(nR * nS);
    for (var kk = 0; kk < nR; kk++) {
      var kv = kLo + kk, vv = kv * S;
      var pha = hsh(kv, 3, seed) * 6.283, phb = hsh(kv, 9, seed) * 6.283;
      var ampk = S * (0.12 + 0.10 * hsh(kv, 17, seed));
      var row = kk * nS;
      for (sI = 0; sI < nS; sI++) {
        var xv = xs[sI];
        YY[row + sI] = solveCol(sI, vv)
          + ampk * Math.sin(xv / (15.0 * S) * 6.283 + pha)
          + ampk * 0.38 * Math.sin(xv / (4.6 * S) * 6.283 + phb);
        /* Ridge ENDINGS. At one gap per thirty ridge-widths this fired barely
           once across a deeply-zoomed panel, and a ridge field with no minutiae
           in it reads as combing, not as skin. A real field carries an ending
           or a fork every ten-odd ridge-widths — so the cell shortens and the
           odds come up, and the comb breaks by itself. */
        GAP[row + sI] = hsh(Math.floor(xv / (S * 9)), kv, seed + 5) < 0.135 ? 1 : 0;
      }
    }

    var lwV = Math.max(0.20 * S, 0.55 / u);
    var lwC = Math.max(0.12 * S, 0.45 / u);
    var off = 0.22 * S;                       // crest sits lampward of the valley
    var pr = 0.135 * S, prPx = pr * u;
    var pores = (prPx >= 0.60 && prPx <= 5.0);
    var poreStep = Math.max(2, Math.round(0.9 * S / dx));

    g.lineCap = 'round'; g.lineJoin = 'round';
    /* Pores are strung along a ridge, but NOT on a shared grid. Sampling them
       at `s % poreStep` put every ridge's pores on the same handful of sample
       columns, and the ridges are themselves a fixed distance apart — so the
       field printed a visible lattice of identical dots across the palm. Each
       ridge now starts at its own hashed phase and steps by its own jittered
       interval, and every pore carries its own radius and depth. */
    var poreX = [], poreY = [], poreR = [], poreV = [];
    var vCol = 'rgba(50,27,17,' + (0.155 * deep * w * A).toFixed(4) + ')';
    var cCol = 'rgba(250,218,170,' + (0.105 * deep * w * A).toFixed(4) + ')';

    /* every ridge of an octave goes into ONE path per pass — a hundred separate
       strokes is what makes a plate too expensive to keep on screen */
    for (var pass = 0; pass < 2; pass++) {
      g.strokeStyle = pass === 0 ? vCol : cCol;
      g.lineWidth = pass === 0 ? lwV : lwC;
      var oy = pass === 0 ? 0 : LY * off, ox = pass === 0 ? 0 : LX * off;
      g.beginPath();
      for (var k = 0; k < nR; k++) {
        var kr = kLo + k, base = k * nS, pen = false;
        /* this ridge's own pore phase and its own running interval */
        var nxt = pores ? hsh(kr, 23, seed + 61) * poreStep : 1e9, pn = 0;
        for (var s = 0; s < nS; s++) {
          if (GAP[base + s]) { pen = false; continue; }   /* a ridge ending */
          var x = xs[s], y = YY[base + s];
          if (!pen) { g.moveTo(x + ox, y + oy); pen = true; }
          else g.lineTo(x + ox, y + oy);
          if (pass === 0 && pores && s >= nxt) {
            var hp = hsh(pn, kr, seed + 41);
            nxt = s + poreStep * (0.55 + 0.95 * hsh(pn, kr, seed + 71));
            pn++;
            if (hp > 0.30) {                       /* not every crest is pored */
              poreX.push(x + (hsh(pn, kr, seed + 83) - 0.5) * S * 0.55);
              poreY.push(y - S * 0.03 + (hsh(pn, kr, seed + 97) - 0.5) * S * 0.22);
              poreR.push(pr * (0.62 + 0.85 * hsh(pn, kr, seed + 113)));
              poreV.push(0.55 + 0.75 * hsh(pn, kr, seed + 131));
            }
          }
        }
      }
      g.stroke();
    }

    /* INCIPIENT RIDGES — the short, thin, half-formed fragments that sit in the
       furrow between two full ridges. They are the other half of why real skin
       never reads as a comb, and they cost one extra path for the octave. */
    if (pores) {
      g.strokeStyle = 'rgba(52,29,19,' + (0.085 * deep * w * A).toFixed(4) + ')';
      g.lineWidth = lwV * 0.55;
      g.beginPath();
      var drew = false;
      for (var ki = 0; ki < nR; ki++) {
        var kri = kLo + ki, bi = ki * nS;
        var cells = Math.max(1, Math.floor(nS / Math.max(2, Math.round(11 * S / dx))));
        for (var ci = 0; ci < cells; ci++) {
          if (hsh(ci, kri, seed + 149) > 0.20) continue;
          var s0 = Math.floor((ci + hsh(ci, kri, seed + 163)) * (nS / cells));
          var s1 = Math.min(nS - 1, s0 + Math.max(2, Math.round(3.5 * S / dx)));
          if (s0 >= nS - 2 || GAP[bi + s0]) continue;
          var half = S * (0.40 + 0.20 * hsh(ci, kri, seed + 179));
          g.moveTo(xs[s0], YY[bi + s0] + half);
          for (var si = s0 + 1; si <= s1; si++) g.lineTo(xs[si], YY[bi + si] + half);
          drew = true;
        }
      }
      if (drew) g.stroke();
    }

    if (poreX.length) {
      /* three depth bands, one fill each — a pore field of identical dots is a
         printing screen, not skin, but a fill per pore would cost the room */
      for (var bd = 0; bd < 3; bd++) {
        var lo2 = 0.55 + bd * 0.25, hi2 = lo2 + 0.25, any = false;
        g.beginPath();
        for (var q2 = 0; q2 < poreX.length; q2++) {
          if (poreV[q2] < lo2 || poreV[q2] >= hi2) continue;
          any = true;
          g.moveTo(poreX[q2] + poreR[q2], poreY[q2]);
          g.arc(poreX[q2], poreY[q2], poreR[q2], 0, 6.283);
        }
        if (!any) continue;
        g.fillStyle = 'rgba(34,17,11,'
          + (0.42 * (lo2 + 0.125) * deep * w * A).toFixed(4) + ')';
        g.fill();
      }
    }
  }

  /* ── THE GRAIN: a lattice-anchored speckle field, always in the legible band.
     The cell size is chosen from the CURRENT view and snapped to a global
     power-of-four lattice, so the field never smears and never runs out. */
  function skinGrain(g, u, A, box, seed, dens, deep) {
    var vw = box[2] - box[0], vh = box[3] - box[1];
    if (vw <= 0 || vh <= 0) return;
    var BASE = 4e-7;
    var k0 = Math.round(Math.log((vw / 190) / BASE) / Math.log(4));
    for (var o = k0; o <= k0 + 1; o++) {
      var s = BASE * Math.pow(4, o);
      var across = vw / s;
      if (!(across > 12 && across < 220)) continue;
      var fade = o === k0 ? 1 : 0.34;
      var i0 = Math.floor(box[0] / s), i1 = Math.ceil(box[2] / s);
      var j0 = Math.floor(box[1] / s), j1 = Math.ceil(box[3] / s);
      if ((i1 - i0) * (j1 - j0) > 30000) continue;
      var r = s * 0.17;
      /* one walk of the lattice, two paths — the hash is the expensive part */
      var dark = new Path2D(), lite = new Path2D();
      for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
        var hv = hsh(i, j, seed + o);
        if (hv > 0.24 && hv < 0.84) continue;
        var ox = hsh(i, j, seed + o + 101), oy = hsh(i, j, seed + o + 211);
        var sz = r * (0.40 + 1.1 * hsh(i, j, seed + o + 307));
        (hv <= 0.24 ? dark : lite).rect((i + ox) * s, (j + oy) * s, sz, sz);
      }
      g.fillStyle = 'rgba(40,21,14,' + (0.30 * deep * dens * fade * A).toFixed(4) + ')';
      g.fill(dark);
      g.fillStyle = 'rgba(248,216,168,' + (0.145 * deep * dens * fade * A).toFixed(4) + ')';
      g.fill(lite);
    }
  }

  /* THE CRAZING: the fine polygonal net of creases lying ACROSS the ridges.
     Ridges alone, however well pored, still read a little combed under deep
     magnification, because at that range any smooth flow field is locally
     parallel — the net is what a real macrograph has that a comb does not.
     It only exists once the plate is genuinely magnified, and it is drawn as
     short chorded segments on a jittered lattice so it never repeats. */
  function craze(g, u, A, box, seed, deep) {
    if (deep < 1.5) return;
    var vw = box[2] - box[0], vh = box[3] - box[1];
    if (vw <= 0 || vh <= 0) return;
    var s = vw / 34;                       /* ~34 cells across the view */
    var i0 = Math.floor(box[0] / s), i1 = Math.ceil(box[2] / s);
    var j0 = Math.floor(box[1] / s), j1 = Math.ceil(box[3] / s);
    if ((i1 - i0) * (j1 - j0) > 4200) return;
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(38,20,13,' + (0.085 * Math.min(1, (deep - 1.5) / 2) * A).toFixed(4) + ')';
    g.lineWidth = Math.max(s * 0.035, 0.6 / u);
    g.beginPath();
    for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
      var h0 = hsh(i, j, seed);
      if (h0 > 0.62) continue;
      var cx = (i + hsh(i, j, seed + 11)) * s, cy = (j + hsh(i, j, seed + 23)) * s;
      /* a short chain of two or three chords — a fragment of the net, not a star */
      var th = hsh(i, j, seed + 37) * 6.283, x = cx, y = cy;
      var segs = 2 + (hsh(i, j, seed + 53) > 0.55 ? 1 : 0);
      g.moveTo(x, y);
      for (var q = 0; q < segs; q++) {
        var ln = s * (0.30 + 0.55 * hsh(i, j + q, seed + 67));
        th += (hsh(i, j + q, seed + 79) - 0.5) * 2.1;
        x += Math.cos(th) * ln; y += Math.sin(th) * ln * 0.55;   /* flattened across the ridges */
        g.lineTo(x, y);
      }
    }
    g.stroke();
  }

  /* THE BLOTCH: the slow tonal drift of living skin — flush and pallor. Also
     lattice-anchored, so a plate blown up ten thousand times still has weather
     in it instead of one flat brown. */
  function blotch(g, A, box, seed, deep) {
    var vw = box[2] - box[0];
    if (vw <= 0) return;
    var BASE = 4e-7;
    var o = Math.round(Math.log((vw / 7) / BASE) / Math.log(4));
    for (var oo = o; oo <= o + 1; oo++) {
      var s = BASE * Math.pow(4, oo);
      if (!(vw / s > 1.4 && vw / s < 40)) continue;
      var fade = oo === o ? 1 : 0.6;
      var i0 = Math.floor(box[0] / s) - 1, i1 = Math.ceil(box[2] / s) + 1;
      var j0 = Math.floor(box[1] / s) - 1, j1 = Math.ceil(box[3] / s) + 1;
      if ((i1 - i0) * (j1 - j0) > 400) continue;
      for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
        var hv = hsh(i, j, seed + oo);
        if (hv < 0.42) continue;
        var cx = (i + hsh(i, j, seed + oo + 71)) * s;
        var cy = (j + hsh(i, j, seed + oo + 137)) * s;
        var rr = s * (0.55 + 0.75 * hsh(i, j, seed + oo + 199));
        var warm = hsh(i, j, seed + oo + 251) > 0.45;
        var gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
        gr.addColorStop(0, 'rgba(' + (warm ? '206,124,84' : '58,36,26') + ','
          + ((warm ? 0.085 : 0.075) * deep * fade * A).toFixed(4) + ')');
        gr.addColorStop(1, 'rgba(' + (warm ? '206,124,84' : '58,36,26') + ',0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(cx, cy, rr, 0, 6.283); g.fill();
      }
    }
  }

  /* ── a soft line with a lampward highlight — the palm's creases ─────────── */
  /* sample the midpoint-quadratic chain through `pts` */
  function creaseSamples(pts) {
    var segs = [], p0 = pts[0], i, k;
    for (i = 1; i < pts.length - 1; i++) {
      var m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
      segs.push([p0, pts[i], m]); p0 = m;
    }
    var lastp = pts[pts.length - 1];
    segs.push([p0, lastp, lastp]);
    var out = [];
    for (i = 0; i < segs.length; i++) {
      var S = segs[i];
      for (k = (i ? 1 : 0); k <= 6; k++) {
        var q = k / 6, mq = 1 - q;
        out.push([mq * mq * S[0][0] + 2 * mq * q * S[1][0] + q * q * S[2][0],
                  mq * mq * S[0][1] + 2 * mq * q * S[1][1] + q * q * S[2][1]]);
      }
    }
    return out;
  }
  /* A crease is a VALLEY, not a scratch: it fades in and out along its length,
     it is widest in the middle, and it has a lit shoulder on the lamp side. */
  function crease(g, A, pts, wMain, dark, lite, u, box, few) {
    if (box) {                       /* nothing off screen is worth an inkwell */
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9, m = wMain * 4;
      for (var b = 0; b < pts.length; b++) {
        if (pts[b][0] < bx0) bx0 = pts[b][0]; if (pts[b][0] > bx1) bx1 = pts[b][0];
        if (pts[b][1] < by0) by0 = pts[b][1]; if (pts[b][1] > by1) by1 = pts[b][1];
      }
      if (bx1 + m < box[0] || bx0 - m > box[2] || by1 + m < box[1] || by0 - m > box[3]) return;
    }
    var P = creaseSamples(pts), n = P.length, i;
    g.lineCap = 'round'; g.lineJoin = 'round';
    /* nested strokes over shrinking spans, so the valley tapers away at both
       ends as one continuous line — no beading from per-segment caps */
    /* A flexure crease is a FOLD, not a gouge. The first cut of this ran the
       core layers dark enough that the three great lines read as welts cut into
       the palm; the depths come back roughly a third, the widest layer spreads
       instead, and the shoulders soften — so they read as skin that has been
       folding the same way for years. */
    var LAYER = [[ 'rgba(44,23,15,', 0.130 * dark, 4.4, 0.00, 0, 0 ],
                 [ 'rgba(32,17,10,', 0.170 * dark, 2.2, 0.10, 0, 0 ],
                 [ 'rgba(22,11,6,',  0.240 * dark, 1.1, 0.20, 0, 0 ],
                 [ 'rgba(20,10,6,',  0.190 * dark, 0.7, 0.34, 0, 0 ],
    /* the lit wall of a groove is the FAR one — so the shoulder goes away from
       the lamp. (A ridge does the opposite; that is how you tell them apart.) */
                 [ 'rgba(250,216,164,', 0.10 * lite, 0.95, 0.12, -LX * wMain * 1.35, -LY * wMain * 1.35 ],
                 [ 'rgba(252,222,174,', 0.085 * lite, 0.55, 0.26, -LX * wMain * 1.35, -LY * wMain * 1.35 ],
                 [ 'rgba(18,9,5,',      0.105 * dark, 0.60, 0.16,  LX * wMain * 1.20,  LY * wMain * 1.20 ]];
    var ORDER = few ? [0, 2, 4] : [0, 1, 2, 3, 4, 5, 6];
    for (var L = 0; L < ORDER.length; L++) {
      var lay = LAYER[ORDER[L]];
      var i0 = Math.floor(lay[3] * (n - 1)), i1 = n - 1 - i0;
      if (i1 - i0 < 2) continue;
      g.strokeStyle = lay[0] + (lay[1] * A).toFixed(4) + ')';
      g.lineWidth = Math.max(wMain * lay[2], 0.8 / u);
      g.beginPath();
      g.moveTo(P[i0][0] + lay[4], P[i0][1] + lay[5]);
      for (i = i0 + 1; i <= i1; i++) g.lineTo(P[i][0] + lay[4], P[i][1] + lay[5]);
      g.stroke();
    }
  }

  /* ── the fern lying across the palm, exactly at the anchor ───────────────── */
  function frond(g, A, cx, cy, rot, len, t, tint, alpha, detail) {
    g.save();
    g.translate(cx, cy);
    g.rotate(rot + Math.sin(t * 0.27) * 0.020);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(' + tint + ',' + (0.92 * alpha * A).toFixed(4) + ')';
    g.lineWidth = len * 0.021;
    g.beginPath();
    g.moveTo(-len * 0.5, len * 0.07);
    g.quadraticCurveTo(0, -len * 0.05, len * 0.5, -len * 0.03);
    g.stroke();
    for (var i = 0; i < 16; i++) {
      var q = i / 16, x = -len * 0.46 + q * len * 0.94;
      var y = len * 0.07 - q * len * 0.09 - Math.sin(q * 3.14) * len * 0.022;
      var pl = len * 0.215 * Math.sin(Math.PI * Math.min(1, 0.14 + q * 1.02)) * (1 - q * 0.30);
      for (var sd = -1; sd <= 1; sd += 2) {
        g.strokeStyle = 'rgba(' + tint + ','
          + ((0.50 + 0.34 * (1 - q)) * alpha * A).toFixed(4) + ')';
        g.lineWidth = len * 0.0135;
        g.beginPath(); g.moveTo(x, y);
        g.quadraticCurveTo(x + len * 0.055, y + sd * pl * 0.52, x + len * 0.085, y + sd * pl);
        g.stroke();
        /* the midrib ticks inside each pinna — what tells the eye "frond"
           rather than "feather" once you are close enough to read them */
        if (detail && len * 0.085 * u0 > 6) {
          g.lineWidth = len * 0.0052;
          g.strokeStyle = 'rgba(214,232,180,' + (0.40 * alpha * A).toFixed(4) + ')';
          for (var k2 = 1; k2 < 4; k2++) {
            var pp = k2 / 4;
            g.beginPath();
            g.moveTo(x + len * 0.085 * pp * 0.9, y + sd * pl * pp * 0.86);
            g.lineTo(x + len * 0.085 * pp * 0.9 + len * 0.030,
                     y + sd * pl * pp * 0.86 + sd * len * 0.024);
            g.stroke();
          }
        }
      }
    }
    g.restore();
  }

  /* ══════════════════════════════════════════════════════════════════════════ */
  PlateArt.hand = function (g, u, a, t, anchor) {
    g.save();
    g.scale(u, u);

    var A = a, i, k;
    u0 = u;
    function C(c, al) { return 'rgba(' + c + ',' + (al * A).toFixed(4) + ')'; }

    /* the hand is alive: a slow settle, damped away as the glass goes deep so a
       deep zoom does not swim */
    var mv = 1 / (1 + u / 3500);
    g.translate(Math.sin(t * 0.21) * 0.0055 * mv, Math.sin(t * 0.163 + 1.1) * 0.0042 * mv);

    var box = visBox(g);
    /* THE MOTE. Arriving, the plate is fifteen pixels across: every mark layer
       has dropped out of its legible band and all that is left to say "hand"
       is the low-frequency form. So the lamp-side rim and the roll into shadow
       come up as the plate shrinks — the same lighting, pushed until it still
       reads at a fortieth of the size. Strictly proportional to `a`, like
       every other colour here. */
    var mote = Math.min(1, Math.max(0, (120 - u) / 90));
    /* skin gets more relief the closer you stand to it — and the bench's deep
       panel hands us a = 0.30, so the authored contrast has to climb to meet it */
    var deep = 1 + 3.6 * Math.min(1, Math.max(0, Math.log(u / 900) / Math.LN10 / 2.3));

    /* ── the lamp's own glow, thrown from off the top-left corner ─────────── */
    var lamp = g.createRadialGradient(-0.34, -0.38, 0.02, -0.34, -0.38, 0.92);
    lamp.addColorStop(0, C('240,199,102', 0.10));
    lamp.addColorStop(0.42, C('206,146,70', 0.032));
    lamp.addColorStop(1, 'rgba(180,120,50,0)');
    g.fillStyle = lamp;
    g.fillRect(-0.64, -0.64, 1.28, 1.28);

    /* ── what the hand keeps off the table ───────────────────────────────── */
    for (var sh = 5; sh >= 1; sh--) {
      g.save();
      g.translate(-LX * 0.013 * sh, -LY * 0.013 * sh);
      handPath(g);
      g.fillStyle = C('5,4,6', 0.075);
      g.fill();
      g.restore();
    }

    /* ── the contour, laid down first so the fill covers the inner seams ────
       A hand is not a cut-out, so it does not get an outline. The lamp side
       gets a fine bright hairline where the form turns into the light; the
       shadow side gets a soft, wide, low-contrast bloom that dies away into
       the dark instead of a drawn edge. */
    handPath(g);
    g.lineJoin = 'round';
    var edge = g.createLinearGradient(-0.36, -0.44, 0.32, 0.46);
    edge.addColorStop(0.00, C('250,224,180', 0.40));
    edge.addColorStop(0.34, C('206,160,112', 0.12));
    edge.addColorStop(0.70, 'rgba(120,80,54,0)');
    edge.addColorStop(1.00, 'rgba(84,54,38,0)');
    g.strokeStyle = edge;
    g.lineWidth = Math.max(0.0030, 0.7 / u);
    g.stroke();

    /* ── the skin itself ─────────────────────────────────────────────────── */
    /* the mid-tone carries the lamp: warmer and a shade brighter through the
       middle of the ramp, so the palm reads as lit skin rather than as clay */
    var base = g.createLinearGradient(-0.32, -0.44, 0.30, 0.50);
    base.addColorStop(0.00, C('242,205,155', 0.97));
    base.addColorStop(0.30, C('214,166,120', 0.96));
    base.addColorStop(0.66, C('152,105,74', 0.95));
    base.addColorStop(1.00, C('68,45,33', 0.95));
    handPath(g);
    g.fillStyle = base;
    g.fill();

    /* everything below lives on the skin */
    g.save();
    handPath(g);
    g.clip();

    /* the cup — the hollow of an open palm */
    var cup = g.createRadialGradient(0.004, 0.126, 0.010, 0.004, 0.126, 0.320);
    cup.addColorStop(0, C('34,18,12', 0.46));
    cup.addColorStop(0.52, C('42,23,15', 0.24));
    cup.addColorStop(1, 'rgba(42,23,15,0)');
    g.fillStyle = cup;
    g.fillRect(-0.64, -0.64, 1.28, 1.28);

    /* the shade in the webs between the fingers */
    var WEB = [[-0.124, -0.074], [0.006, -0.086], [0.126, -0.064], [-0.244, 0.074]];
    for (i = 0; i < WEB.length; i++) {
      if (WEB[i][0] + 0.09 < box[0] || WEB[i][0] - 0.09 > box[2] ||
          WEB[i][1] + 0.09 < box[1] || WEB[i][1] - 0.09 > box[3]) continue;
      var wg = g.createRadialGradient(WEB[i][0], WEB[i][1], 0, WEB[i][0], WEB[i][1], 0.088);
      wg.addColorStop(0, C('20,10,6', 0.46));
      wg.addColorStop(0.55, C('24,12,8', 0.16));
      wg.addColorStop(1, 'rgba(22,11,7,0)');
      g.fillStyle = wg;
      g.beginPath(); g.arc(WEB[i][0], WEB[i][1], 0.088, 0, 6.283); g.fill();
    }

    /* the slow weather of the skin, under everything */
    blotch(g, A, box, 2213, deep);

    /* ── THE RIDGE FIELD, at whichever octaves are currently legible ──────── */
    var Sb = 0.0005, LP = Math.log(10.0), cand = [];
    for (k = -7; k <= 9; k++) {
      var S = Sb * Math.pow(2, k), pxs = S * u;
      if (pxs < 4.4 || pxs > 46) continue;
      var lw = Math.log(pxs) - LP;
      var w = Math.exp(-(lw / 0.62) * (lw / 0.62));
      if (w < 0.11) continue;
      cand.push([w, S, k]);
    }
    /* the two best-fitting octaves only: three would split the sample budget
       so thin that the finest of them stops resolving its own ridges */
    cand.sort(function (p, q4) { return q4[0] - p[0]; });
    for (i = 0; i < Math.min(2, cand.length); i++) {
      ridgeOctave(g, u, A, cand[i][1], cand[i][0], box, 907 + cand[i][2] * 13, deep);
    }

    /* ── the mounds, laid OVER the ridge field so they model it ───────────── */
    var MOUND = [[-0.228, 0.202, 0.152], [0.192, 0.222, 0.134],
                 [-0.172, -0.002, 0.070], [-0.050, -0.020, 0.072],
                 [0.073, -0.010, 0.068], [0.170, 0.034, 0.058]];
    function offBox(cx, cy, r) {
      return cx + r < box[0] || cx - r > box[2] || cy + r < box[1] || cy - r > box[3];
    }
    for (i = 0; i < MOUND.length; i++) {
      var M0 = MOUND[i], r0 = M0[2];
      if (offBox(M0[0], M0[1], r0 * 1.1)) continue;
      var hi = g.createRadialGradient(M0[0] + LX * r0 * 0.44, M0[1] + LY * r0 * 0.44, 0,
                                      M0[0], M0[1], r0);
      hi.addColorStop(0, C('255,226,176', 0.40));
      hi.addColorStop(0.58, C('246,200,142', 0.11));
      hi.addColorStop(1, 'rgba(246,200,142,0)');
      g.fillStyle = hi;
      g.beginPath(); g.arc(M0[0], M0[1], r0, 0, 6.283); g.fill();
      var lo = g.createRadialGradient(M0[0] - LX * r0 * 0.54, M0[1] - LY * r0 * 0.54, 0,
                                      M0[0], M0[1], r0 * 1.06);
      lo.addColorStop(0, C('38,20,13', 0.20));
      lo.addColorStop(1, 'rgba(38,20,13,0)');
      g.fillStyle = lo;
      g.beginPath(); g.arc(M0[0], M0[1], r0 * 1.06, 0, 6.283); g.fill();
    }

    /* the pads and the middle phalanges catch the lamp */
    for (i = 0; i < FINGERS.length + 1; i++) {
      var Fp = i < FINGERS.length ? FINGERS[i] : THUMB;
      var bp = Fp[0], tpp = Fp[1];
      var SEG = i < FINGERS.length ? [0.28, 0.90] : [0.40, 0.86];
      for (var sgi = 0; sgi < SEG.length; sgi++) {
        var qq = SEG[sgi];
        var cxp = bp[0] + (tpp[0] - bp[0]) * qq, cyp = bp[1] + (tpp[1] - bp[1]) * qq;
        var rp = (Fp[2] + (Fp[3] - Fp[2]) * qq) * 0.96;
        if (offBox(cxp, cyp, rp * 1.15)) continue;
        var pg = g.createRadialGradient(cxp + LX * rp * 0.46, cyp + LY * rp * 0.46, 0,
                                        cxp, cyp, rp * 1.10);
        pg.addColorStop(0, C('255,224,172', 0.30));
        pg.addColorStop(1, 'rgba(255,224,172,0)');
        g.fillStyle = pg;
        g.beginPath(); g.arc(cxp, cyp, rp * 1.10, 0, 6.283); g.fill();
        var sg2 = g.createRadialGradient(cxp - LX * rp * 0.62, cyp - LY * rp * 0.62, 0,
                                         cxp, cyp, rp * 1.08);
        sg2.addColorStop(0, C('30,15,10', 0.24));
        sg2.addColorStop(1, 'rgba(30,15,10,0)');
        g.fillStyle = sg2;
        g.beginPath(); g.arc(cxp, cyp, rp * 1.08, 0, 6.283); g.fill();
      }
    }

    /* ── the creases ─────────────────────────────────────────────────────── */
    crease(g, A, [[0.220, -0.030], [0.116, 0.004], [-0.014, 0.028], [-0.124, 0.034], [-0.198, 0.024]],
           0.0080, 1.0, 1.0, u, box);                               /* the upper */
    crease(g, A, [[0.182, 0.082], [0.066, 0.106], [-0.064, 0.114], [-0.170, 0.102], [-0.228, 0.080]],
           0.0075, 0.95, 1.0, u, box);                              /* the middle */
    crease(g, A, [[-0.210, -0.038], [-0.256, 0.046], [-0.258, 0.166], [-0.220, 0.294], [-0.156, 0.412]],
           0.0072, 0.92, 0.95, u, box);                             /* round the thumb */
    crease(g, A, [[0.122, 0.198], [0.048, 0.244], [-0.040, 0.270]], 0.0048, 0.66, 0.8, u, box);
    crease(g, A, [[-0.120, 0.444], [-0.012, 0.468], [0.108, 0.454]], 0.0044, 0.66, 0.8, u, box);
    crease(g, A, [[-0.112, 0.500], [-0.008, 0.524], [0.104, 0.510]], 0.0040, 0.52, 0.7, u, box);

    /* the joint creases — fine arcs at each knuckle */
    for (var f = 0; f < FINGERS.length + 1; f++) {
      var F = f < FINGERS.length ? FINGERS[f] : THUMB;
      var b = F[0], tp = F[1];
      var ddx = tp[0] - b[0], ddy = tp[1] - b[1], L = Math.hypot(ddx, ddy) || 1;
      var ux = ddx / L, uy = ddy / L, nx = -uy, ny = ux;
      var JS = f < FINGERS.length ? [0.05, 0.42, 0.74] : [0.10, 0.60];
      for (var jn = 0; jn < JS.length; jn++) {
        var q3 = JS[jn], w3 = (F[2] + (F[3] - F[2]) * q3) * 0.88;
        var cxj = b[0] + ux * L * q3 + nx * F[4] * Math.sin(Math.PI * q3);
        var cyj = b[1] + uy * L * q3 + ny * F[4] * Math.sin(Math.PI * q3);
        var nl = jn === 0 ? 3 : 2;
        for (var c2 = 0; c2 < nl; c2++) {
          var d2 = (c2 - (nl - 1) / 2) * w3 * 0.28;
          crease(g, A, [[cxj - nx * w3 + ux * d2, cyj - ny * w3 + uy * d2],
                        [cxj + ux * (d2 + w3 * 0.18), cyj + uy * (d2 + w3 * 0.18)],
                        [cxj + nx * w3 + ux * d2, cyj + ny * w3 + uy * d2]],
                 0.0030, 0.58, 0.8, u, box, true);
        }
      }
    }

    /* ── the grain: freckle, pore-shadow and the tooth of the paper ──────── */
    skinGrain(g, u, A, box, 1471, 1.0, deep);
    craze(g, u, A, box, 3307, deep);

    /* THE TURN OF THE FORM. A stroke would betray the seams where the fingers
       are welded to the palm, so the roll-away from the lamp is laid on as a
       FILL across the whole clipped hand — dark where the light is not. */
    var turn = g.createLinearGradient(-0.30, -0.42, 0.28, 0.50);
    turn.addColorStop(0.00, 'rgba(18,9,5,0)');
    turn.addColorStop(0.38, C('20,10,6', 0.085));
    turn.addColorStop(0.74, C('16,8,5', 0.27));
    turn.addColorStop(1.00, C('10,5,3', 0.54));
    g.fillStyle = turn;
    g.fillRect(-0.64, -0.64, 1.28, 1.28);

    /* THE EDGE, SOFTENED FROM WITHIN. A wide stroke laid on the silhouette
       while the clip is still active paints only the inner half, so the shadow
       side of the hand thickens into darkness and loses its cut edge without
       ever putting a mark on the background — an outline drawn outside the
       clip haloes the fingers, which is the very thing being fixed. */
    handPath(g);
    var inEdge = g.createLinearGradient(-0.36, -0.44, 0.32, 0.46);
    inEdge.addColorStop(0.00, 'rgba(60,36,24,0)');
    inEdge.addColorStop(0.40, C('46,27,18', 0.09));
    inEdge.addColorStop(1.00, C('24,13,8', 0.32));
    g.strokeStyle = inEdge;
    g.lineWidth = Math.max(0.030, 3.0 / u);
    g.stroke();

    /* a last breath of warm light down the lamp side, inside the edge */
    handPath(g);
    var rim = g.createLinearGradient(-0.36, -0.44, 0.22, 0.34);
    rim.addColorStop(0, C('255,230,184', 0.46 + 0.40 * mote));
    rim.addColorStop(0.30, C('255,208,148', 0.06 + 0.16 * mote));
    rim.addColorStop(1, 'rgba(120,70,40,0)');
    g.strokeStyle = rim;
    g.lineWidth = Math.max(0.015 + 0.014 * mote, 1.4 / u);
    g.stroke();

    /* ── the fern, lying across the palm exactly where the child will come ── */
    var ax = anchor ? anchor[0] : -0.05, ay = anchor ? anchor[1] : 0.14;
    if (!offBox(ax, ay, 0.20)) {
    /* THE ANCHOR MUST NOT BREATHE. The child plate is placed at the anchor by
       the room, which knows nothing of this plate's settle — so if the frond
       drifted with the breath the two would separate as the glass went in.
       The settle is backed out for exactly the length of the frond. */
    g.save();
    g.translate(-Math.sin(t * 0.21) * 0.0055 * mv, -Math.sin(t * 0.163 + 1.1) * 0.0042 * mv);
    /* a close contact shadow — the frond is LYING on the palm, not hovering */
    frond(g, A, ax + 0.0065, ay + 0.0085, -0.34, 0.205, t, '16,9,7', 0.34, false);
    frond(g, A, ax, ay, -0.34, 0.205, t, '178,198,134', 0.95, true);
    var fg = g.createRadialGradient(ax, ay, 0, ax, ay, 0.060);
    fg.addColorStop(0, C('196,220,164', 0.24));
    fg.addColorStop(0.5, C('178,204,150', 0.075));
    fg.addColorStop(1, 'rgba(178,204,150,0)');
    g.fillStyle = fg;
    g.beginPath(); g.arc(ax, ay, 0.060, 0, 6.283); g.fill();
    g.restore();
    }

    g.restore();   /* off the skin */

    /* the anchor's own smudge, so a fifteen-pixel mote still has the fern in it
       — pinned against the settle for the same reason the frond is */
    if (typeof smudge === 'function') {
      g.save();
      g.translate(-Math.sin(t * 0.21) * 0.0055 * mv, -Math.sin(t * 0.163 + 1.1) * 0.0042 * mv);
      smudge(g, [ax, ay], 0.042, '190,220,160', A * 0.70, 47);
      g.restore();
    }

    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.restore();
  };
})();

/* ═══ 1  THE LIT STOOP ════════════════════════════════════════════════════ */
PlateArt.stoop = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(53);
  g.fillStyle = `rgba(24,24,28,${0.5 * a})`; g.fillRect(-0.5, -0.5, 1, 1);
  for (let i = 0; i < 4; i++) {                        // three stone steps and a threshold
    const y = 0.10 + i * 0.095, w = 0.46 - i * 0.035;
    g.fillStyle = `rgba(58,54,50,${(0.55 - i * 0.05) * a})`;
    g.fillRect(-w, y, w * 2, 0.075);
    tfStroke(g, `rgba(214,200,172,${0.16 * a})`, 0.0035);
    g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke();
  }
  g.fillStyle = `rgba(36,32,30,${0.7 * a})`;            // the door
  g.fillRect(-0.16, -0.34, 0.32, 0.46);
  tfStroke(g, `rgba(224,196,150,${0.30 * a})`, 0.005); g.strokeRect(-0.16, -0.34, 0.32, 0.46);
  const lamp = [0.30, -0.26];                           // the lamp above it
  const gl = g.createRadialGradient(lamp[0], lamp[1], 0, lamp[0], lamp[1], 0.34);
  gl.addColorStop(0, `rgba(255,222,150,${0.42 * a})`); gl.addColorStop(0.4, `rgba(255,200,110,${0.13 * a})`);
  gl.addColorStop(1, 'rgba(255,200,110,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(lamp[0], lamp[1], 0.34, 0, 6.283); g.fill();
  g.fillStyle = `rgba(255,238,196,${0.85 * a})`; g.beginPath(); g.arc(lamp[0], lamp[1], 0.020, 0, 6.283); g.fill();
  for (let i = 0; i < 26; i++) {                        // moths and dust in the lamplight
    const th = r() * 6.283, d = Math.pow(r(), 0.5) * 0.30;
    g.fillStyle = `rgba(255,228,180,${(0.06 + 0.16 * r()) * a})`;
    g.beginPath(); g.arc(lamp[0] + Math.cos(th) * d, lamp[1] + Math.sin(th) * d * 0.8, 0.004 + r() * 0.005, 0, 6.283); g.fill();
  }
  grain(g, u, a, 53, 'rgba(210,196,170,1)', 0.28, false);
  smudge(g, anchor, 0.045, '226,214,186', a * 0.85, 53);   // a hand on the rail
  g.restore();
};

/* ═══ 2  THE LIT STREET ═══════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — plate `street` (10² m) · THE LIT STREET

   A block of houses seen from directly above, at night. The plate below this
   one is a lit stoop, so this one is composed as the street that stoop belongs
   to: a road on the diagonal, two rows of houses set back behind lawns and
   driveways, back gardens, an alley, and the backs of the next street's houses
   along the far edge.

   Two things carry the plate, and both are about the GAPS between decades:

   (1) SCALE-FREE FIELD. The shipped grain() ladder bottoms out at 0.0004 unit,
       which is 72 px once the plate is blown up 300x — every octave has left
       the legible band and the field draws nothing. So the asphalt here is laid
       by a TILED field: octaves of stipple on a periodic hash lattice that is
       defined everywhere and visited only where the view actually is. It runs
       from 3 cm of gravel down to sub-millimetre grit, so magnification never
       finds the bottom of it. Cracking and the tar seam are authored the same
       way — two octaves each, one for the plate's own decade and one for the
       blow-up, each drawn only while its size is legible.

   (2) COMPOSED ON THE ANCHOR. The child lands at [0.16, 0.06], which in the
       street's own frame is 17 m out from the crown and dead centre of one
       house's front porch — so what the child grows out of is a lit stoop, in
       the one bright doorway on a street of drawn blinds. Windows are never
       seen from up here; what you see is what they throw on the grass.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── ink kit (private; nothing here collides with plates.js) ─────────────── */
function st_rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function st_line(g, c, w) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; }

const ST_SETS = [];
function st_set(i) {
  let P = ST_SETS[i];
  if (!P) {
    const r = st_rng(9176 + i * 7919); P = new Float32Array(128 * 3);
    for (let k = 0; k < 128; k++) { P[k * 3] = r(); P[k * 3 + 1] = r(); P[k * 3 + 2] = r(); }
    ST_SETS[i] = P;
  }
  return P;
}
function st_hash(i, j) {
  let h = (Math.imul(i | 0, 73856093) ^ Math.imul(j | 0, 19349663)) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0;
}

/* what part of unit space is actually on screen — so a field can be tiled
   infinitely and still cost only what is visible. */
function st_view(g) {
  let v = { x0: -0.5, y0: -0.5, x1: 0.5, y1: 0.5 };
  try {
    const cv = g.canvas, m = g.getTransform().inverse();
    const c = [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 4; i++) {
      const x = m.a * c[i][0] + m.c * c[i][1] + m.e, y = m.b * c[i][0] + m.d * c[i][1] + m.f;
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    const pad = (x1 - x0) * 0.02;
    v = { x0: Math.max(-0.5, x0 - pad), y0: Math.max(-0.5, y0 - pad),
          x1: Math.min(0.5, x1 + pad), y1: Math.min(0.5, y1 + pad) };
  } catch (e) { /* no getTransform: fall back to the whole plate */ }
  return v;
}

/* ONE OCTAVE OF FIELD. Marks of unit size `s` on a periodic lattice, drawn only
   while they land inside the legible band, and only over the tiles the view
   touches. Cost tracks visible AREA, not magnification, so it is the same price
   at u = 600 and at u = 180000 — where it is the only thing left.

   The band is FEATHERED at both ends. A hard cut-off does two bad things: the
   coarsest octave in view sits at full ink right up to the moment it vanishes —
   which is what laid a fall of pale six-pixel dots over the whole plate at its
   own decade, reading as lens dust — and an octave popping in mid-dive is
   visible. Fading in over 0.26→0.62 px and out over 2.6→5.2 px fixes both: the
   plate's own decade is quiet, the dive hands one grain size to the next.

   `opt` gives each MATERIAL its own hand: asphalt gets angular chips, a roof
   gets marks elongated along its courses, grass gets a fine even dust. A speck
   inside a lamp pool can also fire a specular set — which is what makes the
   road read as wet instead of merely lit. */
function st_field(g, u, view, box, s, tint, alpha, cov, opt) {
  const px = s * u;
  if (px < 0.26 || px > 5.2) return;
  let fade = 1;
  if (px < 0.62) fade = (px - 0.26) / 0.36;
  else if (px > 2.6) fade = 1 - 0.90 * (px - 2.6) / 2.6;
  alpha *= fade;
  if (alpha < 0.0025) return;
  const O = opt || 0;
  const shape = O.shape || 'stone';
  const ca = O.ang ? Math.cos(O.ang) : 1, sa = O.ang ? Math.sin(O.ang) : 0;
  const light = O.light || null, spec = O.spec || null;
  const x0 = Math.max(view.x0, box[0]), y0 = Math.max(view.y0, box[1]);
  const x1 = Math.min(view.x1, box[2]), y1 = Math.min(view.y1, box[3]);
  if (x1 <= x0 || y1 <= y0) return;
  const T = s * 22;
  const i0 = Math.floor(x0 / T), i1 = Math.floor(x1 / T);
  const j0 = Math.floor(y0 / T), j1 = Math.floor(y1 / T);
  const tiles = (i1 - i0 + 1) * (j1 - j0 + 1);
  if (tiles > 30000) return;
  let n = Math.round((T * u) * (T * u) * cov / 100);
  /* ── THE INK BUDGET ────────────────────────────────────────────────────────
     This room redraws every plate on every animation frame — there is no cache
     — so the entire texture budget is spent sixty times a second, and marks are
     the whole of the cost. Left unbounded the densest octaves alone lay a third
     of a million marks a frame and the dive falls to six.

     A fixed per-call ceiling is the wrong shape for it, and I tried that first:
     the expensive moment is mid-dive, where a dozen octaves across six
     materials are all legible at once, but the moment that NEEDS the most ink
     is the deep blow-up, where only two or three octaves are in the band at all
     and each must carry the whole frame alone. A ceiling low enough to save the
     first strips the second — which is the one panel this plate is judged on.

     So the budget is shared per DRAW and spent competitively: any one field may
     take a share of what is left, never all of it. Where few octaves compete
     each gets a lavish share and the asphalt stays crushed stone; where a dozen
     compete each is trimmed and the frame still lands in time. */
  const share = Math.min(ST_INK * 0.34, 34000);
  const cap = Math.max(2, Math.floor(share / tiles));
  if (n > cap) n = cap; if (n > 128) n = 128; if (n < 2) n = 2;
  ST_INK -= tiles * n;
  if (ST_INK < 0) ST_INK = 0;
  /* Three ink weights, accumulated as paths and filled once each — a stipple of
     tens of thousands of marks costs three fills, not tens of thousands. The
     weight of a mark is STRATIFIED by its index, not rolled from its brightness:
     roll it, and one tile lands three bright grains where its neighbour lands
     one, and the lattice itself becomes visible as a plaid of tone. Ask how I
     know. */
  const P0 = new Path2D(), P1 = new Path2D(), P2 = new Path2D();
  const Q1 = spec ? new Path2D() : null, Q2 = spec ? new Path2D() : null;
  /* ── THE COST OF A MARK ────────────────────────────────────────────────────
     A quarter of a million marks are laid per draw, so what ONE mark costs is
     the entire budget. Measured in the browser, not guessed: `rect()` adds a
     closed subpath for about 0.08 us, while building the same quad by hand as
     moveTo + three lineTo + closePath costs some thirty times more, per call,
     and needs five calls instead of one. Writing every mark as a hand-built
     rotated quad took this plate from 21 ms a frame to 3.1 SECONDS — which is
     not a plate, it is a slideshow.

     So orientation is bought only where it can actually be seen:
       · the bulk weights are rect(), given ASPECT rather than angle — between a
         third of a pixel and two pixels no eye can tell a rotated chip from an
         oblong, and there is nothing to buy;
       · marks that lie ALONG something (roof courses) take their angle from the
         CONTEXT, turned once per field instead of once per mark, so an oriented
         mark still costs one rect();
       · only the top weight, and only once it is big enough to read as a stone,
         is worth a hand-built angular chip — and by then there are few enough
         of them in view to afford it. */
  function chip(P, x, y, hw, hh, c, sN) {
    const ax = c * hw, ay = sN * hw, bx = -sN * hh, by = c * hh;
    P.moveTo(x - ax - bx, y - ay - by); P.lineTo(x + ax - bx, y + ay - by);
    P.lineTo(x + ax + bx, y + ay + by); P.lineTo(x - ax + bx, y - ay + by);
    P.closePath();
  }
  /* an oriented field tiles its lattice in its OWN rotated frame, so every mark
     is a plain axis-aligned rect there and comes out aligned once the context is
     turned back. (Every caller passing `ang` draws inside a clip, so the larger
     rotated bounding box costs only a few clipped marks.) */
  let X0 = x0, Y0 = y0, X1 = x1, Y1 = y1;
  if (O.ang) {
    g.save(); g.rotate(O.ang);
    let a0 = Infinity, b0 = Infinity, a1 = -Infinity, b1 = -Infinity;
    const C = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    for (let i = 0; i < 4; i++) {
      const rx = C[i][0] * ca + C[i][1] * sa, ry = -C[i][0] * sa + C[i][1] * ca;
      if (rx < a0) a0 = rx; if (rx > a1) a1 = rx;
      if (ry < b0) b0 = ry; if (ry > b1) b1 = ry;
    }
    X0 = a0; Y0 = b0; X1 = a1; Y1 = b1;
  }
  const I0 = Math.floor(X0 / T), I1 = Math.floor(X1 / T);
  const J0 = Math.floor(Y0 / T), J1 = Math.floor(Y1 / T);
  const bigStone = s * 1.44 * u > 2.0;      /* is a stone resolvable at all? */
  /* a lamp pool is 0.09 unit across; a tile of fine grit is a thousandth of
     that, so asking the light where it is once per TILE instead of once per
     mark is the same answer for a hundredth of the work. Only when the tiles
     get coarse enough to straddle the edge of a pool is it asked per mark. */
  const perTile = T < 0.02;
  /* ONE LOOP PER MATERIAL. Deciding a mark's shape inside the loop costs more
     than drawing it: with the branch hoisted out, each loop below is a single
     shape the engine can specialise, and the plate went from 166 ms a frame to
     well under a third of that. The three loops share the lattice walk exactly;
     only the mark differs. */
  const wetAsk = spec && light;
  const tileLight = (ox, oy) => {
    const mx = ox + T * 0.5, my = oy + T * 0.5;
    return light(O.ang ? mx * ca - my * sa : mx, O.ang ? mx * sa + my * ca : my);
  };
  if (shape === 'streak') {
    /* a roof: marks lie ALONG the courses, so tile reads as tile. Oriented by
       the context, so each one is still a single rect. */
    for (let i = I0; i <= I1; i++) for (let j = J0; j <= J1; j++) {
      const h = st_hash(i, j), S = st_set(h & 7), fx = (h >>> 4) & 1, fy = (h >>> 5) & 1;
      const ox = i * T, oy = j * T;
      for (let k = 0; k < n; k++) {
        const b = S[k * 3 + 2], q = k % 9;
        const dx = fx ? 1 - S[k * 3] : S[k * 3], dy = fy ? 1 - S[k * 3 + 1] : S[k * 3 + 1];
        const x = ox + dx * T, y = oy + dy * T;
        const top = q === 0;
        const w = s * (top ? 1.02 + 0.42 * b : 0.58 + 0.40 * b);
        (q < 4 ? P1 : P0).rect(x, y, w * 1.85, w * 0.58);
        if (top) P2.rect(x, y, w * 1.55, w * 0.54);
      }
    }
  } else if (shape === 'fine') {
    /* grass, paper, and the skin of the tar: an even, low-value dust — a lawn
       has no stones in it */
    for (let i = I0; i <= I1; i++) for (let j = J0; j <= J1; j++) {
      const h = st_hash(i, j), S = st_set(h & 7), fx = (h >>> 4) & 1, fy = (h >>> 5) & 1;
      const ox = i * T, oy = j * T;
      const tL = (wetAsk && perTile) ? tileLight(ox, oy) : -1;
      for (let k = 0; k < n; k++) {
        const b = S[k * 3 + 2], q = k % 9;
        const dx = fx ? 1 - S[k * 3] : S[k * 3], dy = fy ? 1 - S[k * 3 + 1] : S[k * 3 + 1];
        const x = ox + dx * T, y = oy + dy * T;
        const w = s * (0.58 + 0.40 * b);
        if (wetAsk && (q === 1 || q === 5)) {
          const L = tL >= 0 ? tL : light(x, y);
          if (L > 0.42) { (L > 0.95 ? Q2 : Q1).rect(x, y, w * 1.15, w * 0.95); continue; }
        }
        (q < 3 ? P1 : P0).rect(x, y, w * 0.72, w * 0.72);
      }
    }
  } else {
    /* asphalt: crushed aggregate. The bulk gets ASPECT (a grain is never
       square); only the top weight, and only once it is big enough for its
       shape to be read at all, is worth building as an angular chip. */
    for (let i = I0; i <= I1; i++) for (let j = J0; j <= J1; j++) {
      const h = st_hash(i, j), S = st_set(h & 7), fx = (h >>> 4) & 1, fy = (h >>> 5) & 1;
      const ox = i * T, oy = j * T;
      const tL = (wetAsk && perTile) ? tileLight(ox, oy) : -1;
      for (let k = 0; k < n; k++) {
        const b = S[k * 3 + 2], q = k % 9;
        const dx = fx ? 1 - S[k * 3] : S[k * 3], dy = fy ? 1 - S[k * 3 + 1] : S[k * 3 + 1];
        const x = ox + dx * T, y = oy + dy * T;
        const top = q === 0;
        const w = s * (top ? 1.02 + 0.42 * b : 0.58 + 0.40 * b);
        if (wetAsk && (q === 1 || q === 5)) {
          const L = tL >= 0 ? tL : light(x, y);
          if (L > 0.42) { (L > 0.95 ? Q2 : Q1).rect(x, y, w * 1.15, w * 0.95); continue; }
        }
        if (!top) { (q < 4 ? P1 : P0).rect(x, y, w * (0.72 + 0.55 * b), w * (0.52 + 0.30 * b)); }
        else if (bigStone && (k & 2)) {
          const rot = b * 3.1416; chip(P2, x, y, w * 0.54, w * (0.30 + 0.22 * b), Math.cos(rot), Math.sin(rot));
        } else { P2.moveTo(x + w * 0.5, y); P2.arc(x, y, w * 0.5, 0, 6.283); }
      }
    }
  }
  g.fillStyle = tint.replace('$', (alpha * 0.13).toFixed(3)); g.fill(P0);
  g.fillStyle = tint.replace('$', (alpha * 0.34).toFixed(3)); g.fill(P1);
  g.fillStyle = tint.replace('$', (alpha * (shape === 'fine' ? 0.42 : shape === 'streak' ? 0.50 : 0.66)).toFixed(3)); g.fill(P2);
  if (spec) {
    g.fillStyle = spec.replace('$', (alpha * 0.42).toFixed(3)); g.fill(Q1);
    g.fillStyle = spec.replace('$', (alpha * 1.00).toFixed(3)); g.fill(Q2);
  }
  if (O.ang) g.restore();
}

/* CRACKING / SEAMS — the same tiled trick for line work. Short jagged
   polylines of unit length `s`, drawn only while that length is between a few
   pixels and most of the frame. Two octaves of these are what keeps the
   asphalt from being a wash at 300x. */
function st_cracks(g, u, view, box, s, tint, w, per) {
  const px = s * u;
  if (px < 7 || px > 2400) return;
  const x0 = Math.max(view.x0, box[0]), y0 = Math.max(view.y0, box[1]);
  const x1 = Math.min(view.x1, box[2]), y1 = Math.min(view.y1, box[3]);
  if (x1 <= x0 || y1 <= y0) return;
  const T = s * 3.2;
  const i0 = Math.floor(x0 / T), i1 = Math.floor(x1 / T);
  const j0 = Math.floor(y0 / T), j1 = Math.floor(y1 / T);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > 4200) return;
  st_line(g, tint, w); g.beginPath();
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const r = st_rng(st_hash(i, j) ^ 0x9e37);
    for (let c = 0; c < per; c++) {
      if (r() > 0.72) continue;
      let x = (i + r()) * T, y = (j + r()) * T, th = r() * 6.283;
      g.moveTo(x, y);
      const segs = 2 + ((r() * 3) | 0);
      for (let k = 0; k < segs; k++) {
        th += (r() - 0.5) * 1.5;
        x += Math.cos(th) * s * (0.3 + 0.5 * r()); y += Math.sin(th) * s * (0.3 + 0.5 * r());
        g.lineTo(x, y);
      }
    }
  }
  g.stroke();
}

/* ── the street's own frame: s runs along the road, m across it ──────────── */
const ST_TH = -1.0996;                       /* the road's bearing */
const ST_DX = Math.cos(ST_TH), ST_DY = Math.sin(ST_TH);
const ST_NX = -ST_DY, ST_NY = ST_DX;
function st_x(s, m) { return ST_DX * s + ST_NX * m; }
function st_y(s, m) { return ST_DY * s + ST_NY * m; }
function st_quad(g, s0, s1, m0, m1) {
  g.beginPath();
  g.moveTo(st_x(s0, m0), st_y(s0, m0)); g.lineTo(st_x(s1, m0), st_y(s1, m0));
  g.lineTo(st_x(s1, m1), st_y(s1, m1)); g.lineTo(st_x(s0, m1), st_y(s0, m1));
  g.closePath();
}
function st_box(s0, s1, m0, m1) {            /* unit-space bbox of that quad */
  const xs = [st_x(s0, m0), st_x(s1, m0), st_x(s1, m1), st_x(s0, m1)];
  const ys = [st_y(s0, m0), st_y(s1, m0), st_y(s1, m1), st_y(s0, m1)];
  return [Math.min.apply(null, xs), Math.min.apply(null, ys),
          Math.max.apply(null, xs), Math.max.apply(null, ys)];
}
function st_seg(g, s0, m0, s1, m1) {
  g.beginPath(); g.moveTo(st_x(s0, m0), st_y(s0, m0)); g.lineTo(st_x(s1, m1), st_y(s1, m1)); g.stroke();
}
/* a warm pool, elongated along the road the way wet asphalt smears a lamp */
function st_pool(g, s, m, r, el, stops) {
  g.save();
  g.translate(st_x(s, m), st_y(s, m)); g.rotate(ST_TH); g.scale(el, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill();
  g.restore();
}

function st_s(x, y) { return ST_DX * x + ST_DY * y; }   /* unit space → street */
function st_m(x, y) { return ST_NX * x + ST_NY * y; }

/* ONE MOON, for the whole plate. Every roof pitch, hip, car roof and shed lid
   is shaded from its own normal against this one world direction, so both rows
   of houses agree about where the light is — which is the difference between a
   block of solids and a block of tiles. */
const ST_MX = -0.58, ST_MY = -0.815;
function st_facet(ns, nm) {
  const d = st_x(ns, nm) * ST_MX + st_y(ns, nm) * ST_MY;
  return 0.10 + 0.62 * (d > 0 ? d : 0);
}
function st_slate(b, a, warm) {                 /* a facet's own value */
  const v = Math.round(20 + 54 * b);
  return `rgba(${v + (warm ? 6 : 0)},${v + 1},${v + (warm ? 2 : 8)},${0.95 * a})`;
}

/* WHERE THE LAMPLIGHT FALLS — filled in each draw, read back by the field so a
   grain of asphalt standing in a pool can strike a specular. Elliptical in the
   street's own frame, because a wet road drags a lamp along itself. */
/* the seam's wander — octaves all the way down, so it never straightens */
function st_wander(s) {
  return Math.sin(s * 31) * 0.00100 + Math.sin(s * 137 + 1.1) * 0.00035
       + Math.sin(s * 640 + 0.4) * 0.00009 + Math.sin(s * 3100 + 2.2) * 0.000024
       + Math.sin(s * 15000 + 0.9) * 0.0000058 + Math.sin(s * 72000 + 1.7) * 0.0000014;
}

/* the ink left to this draw — reset every frame, spent by st_field */
let ST_INK = 130000;

let ST_LIT = [];
function st_lit(x, y) {
  const s = st_s(x, y), m = st_m(x, y);
  let v = 0;
  for (let i = 0; i < ST_LIT.length; i++) {
    const L = ST_LIT[i];
    const ds = (s - L[0]) / (L[2] * L[3]), dm = (m - L[1]) / L[2];
    const q = ds * ds + dm * dm;
    if (q < 1) { const f = 1 - q; v += f * f * L[4]; }
  }
  return v;
}

/* the cross-section, in units (1 unit = 100 m) */
const ST_ROAD = 0.062, ST_WALK = 0.088, ST_FRONT = 0.150, ST_FACE = 0.187,
      ST_BACK = 0.300, ST_GARD = 0.415, ST_ALLEY = 0.448, ST_LOT = 0.118;

PlateArt.street = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u);
  const view = st_view(g);
  ST_INK = 130000;                       /* a fresh frame, a fresh allowance */
  const A = anchor || [0.16, 0.06];
  const aS = A[0] * ST_DX + A[1] * ST_DY;          /* the anchor, in street coords */
  const PLATE = [-0.5, -0.5, 0.5, 0.5];
  /* how far away this plate is being seen from. At 15 px the whole block is a
     mote, and a mote of a street is one thing only: a lit line. So the light
     gains as the plate shrinks — not a cheat, just the way a town looks from
     further off, once everything but the lamps has fallen below a pixel. */
  const far = Math.min(1, Math.max(0, (110 - u) / 95));
  const lampX = 1 + 2.4 * far, poolX = 1 + 0.7 * far;
  const aM = A[0] * ST_NX + A[1] * ST_NY;

  /* THE LIGHT IS LAID OUT FIRST, and drawn last. The asphalt has to know where
     the pools are while it is being stippled — a wet road is not a gradient
     with grain on top, it is grain that is individually catching a lamp. */
  const lamps = [];
  for (let i = -4; i <= 4; i++) {
    const sd = i % 2 ? 1 : -1;
    const ls = aS + i * 0.232 - 0.06;
    if (ls < -0.80 || ls > 0.80) continue;
    lamps.push([ls, sd * (ST_ROAD + 0.014), sd, (1 + 0.035 * Math.sin(t * 0.47 + i * 1.7)) * lampX]);
  }
  const stoopGlow = (1 + 0.04 * Math.sin(t * 0.63)) * lampX;
  ST_LIT = lamps.map(L => [L[0], L[1] * 0.35, 0.088 * poolX, 1.7, 0.92 * Math.min(1.6, L[3])]);
  ST_LIT.push([aS, aM + 0.004, 0.062 * poolX, 1.15, 1.05 * Math.min(1.6, stoopGlow)]);
  const WET = { light: st_lit, spec: 'rgba(255,226,168,$)' };

  /* ── 1 · the ground: night, and the grass that holds most of it ───────── */
  g.fillStyle = `rgba(8,10,13,${0.80 * a})`; g.fillRect(-0.5, -0.5, 1, 1);
  st_field(g, u, view, PLATE, 0.00055, 'rgba(84,100,86,$)', a * 0.38, 5.5, { shape: 'fine' });
  st_field(g, u, view, PLATE, 0.0022, 'rgba(78,94,82,$)', a * 0.26, 4.5, { shape: 'fine' });
  st_field(g, u, view, PLATE, 0.0088, 'rgba(70,86,76,$)', a * 0.05, 2.4, { shape: 'fine' });

  /* ── 2 · the roadway ─────────────────────────────────────────────────── */
  const rBox = st_box(-0.80, 0.80, -ST_ROAD, ST_ROAD);
  g.save();
  st_quad(g, -0.80, 0.80, -ST_ROAD, ST_ROAD); g.clip();
  g.fillStyle = `rgba(34,36,43,${(0.95 + 0.5 * far) * a})`; g.fill();
  /* the wheel paths — where a hundred thousand tyres polished it smooth */
  for (const wm of [-0.030, 0.030]) {
    g.save(); st_quad(g, -0.80, 0.80, wm - 0.016, wm + 0.016); g.clip();
    g.fillStyle = `rgba(58,62,72,${0.26 * a})`; g.fill(); g.restore();
  }
  /* a patch: a rectangle of newer, blacker asphalt laid over some old trench.
     Its edge crosses the crown right about here, which at the bottom of a dive
     is the one thing in frame that is a made edge and not a texture. */
  g.save(); st_quad(g, -0.0016, 0.055, -0.048, 0.0009); g.clip();
  g.fillStyle = `rgba(16,17,21,${0.75 * a})`; g.fill();
  st_field(g, u, view, st_box(-0.0016, 0.055, -0.048, 0.0009), 0.00004,
           'rgba(126,132,144,$)', a * 0.55, 9);
  st_field(g, u, view, st_box(-0.0016, 0.055, -0.048, 0.0009), 0.00016,
           'rgba(120,126,138,$)', a * 0.50, 8);
  g.restore();
  /* the patch's CUT edges — a saw-cut in asphalt is a dark kerf with one thin
     bright lip where the new lay stands proud, not a wide pale band; keeping
     them tighter than the tar seam stops the blow-up reading as stripes */
  st_line(g, `rgba(6,7,10,${0.75 * a})`, 0.00013);
  st_seg(g, -0.0016, -0.048, -0.0016, 0.0009); st_seg(g, -0.0016, 0.0009, 0.055, 0.0009);
  st_line(g, `rgba(196,198,206,${0.30 * a})`, Math.max(0.00003, 0.9 / u));
  st_seg(g, -0.0016, -0.048, -0.0016, 0.0009); st_seg(g, -0.0016, 0.0009, 0.055, 0.0009);
  /* wet: the gutters hold the water, so they hold the light */
  for (const s of [-1, 1]) {
    g.save(); st_quad(g, -0.80, 0.80, s * (ST_ROAD - 0.012), s * ST_ROAD); g.clip();
    g.fillStyle = `rgba(58,64,76,${0.22 * a})`; g.fill(); g.restore();
  }
  /* the asphalt itself: aggregate all the way down. The two coarse octaves
     carry the plate's own decade; the two fine ones are the gravel you only
     ever meet at the bottom of a multi-decade dive. */
  st_field(g, u, view, rBox, 0.0000013, 'rgba(140,148,160,$)', a * 0.72, 12, WET);
  st_field(g, u, view, rBox, 0.0000048, 'rgba(146,154,166,$)', a * 0.78, 12, WET);
  st_field(g, u, view, rBox, 0.000018, 'rgba(150,158,170,$)', a * 0.80, 11, WET);
  st_field(g, u, view, rBox, 0.000072, 'rgba(162,168,178,$)', a * 0.80, 10, WET);
  st_field(g, u, view, rBox, 0.00029, 'rgba(150,156,166,$)', a * 0.72, 9, WET);
  st_field(g, u, view, rBox, 0.00115, 'rgba(140,146,158,$)', a * 0.62, 8, WET);
  st_field(g, u, view, rBox, 0.0046, 'rgba(128,134,146,$)', a * 0.48, 7, WET);
  st_field(g, u, view, rBox, 0.0006, 'rgba(6,7,10,$)', a * 0.55, 7);
  st_field(g, u, view, rBox, 0.00009, 'rgba(6,7,10,$)', a * 0.55, 8);
  /* cracking, two octaves: hairlines at this decade, a whole alligator field
     once you are down among the stones */
  st_cracks(g, u, view, rBox, 0.030, `rgba(6,7,10,${0.55 * a})`, 0.0012, 2);
  st_cracks(g, u, view, rBox, 0.0016, `rgba(8,9,12,${0.45 * a})`, 0.00007, 3);
  st_cracks(g, u, view, rBox, 0.00013, `rgba(180,186,196,${0.30 * a})`, 0.000009, 3);
  st_cracks(g, u, view, rBox, 0.000011, `rgba(168,174,186,${0.26 * a})`, 0.0000009, 3);
  /* ── THE TAR SEAM ────────────────────────────────────────────────────────
     A repair sealed down the crown, pinned so it passes exactly through the
     origin — which is the centre of the 300x frame, so the blow-up gets a MADE
     EDGE and not only weather. It is a ribbon, not a stroke: its two banks
     wander independently, and the wander is summed in octaves down to 1e-6
     unit, so it is a wandering line at every magnification instead of going
     straight the moment you get close to it. The sealant stands a little proud,
     so its lips take the lamplight — which is the only reason a black line on
     black asphalt reads at all. */
  (function () {
    let s0 = Infinity, s1 = -Infinity;
    for (const c of [[view.x0, view.y0], [view.x1, view.y0], [view.x0, view.y1], [view.x1, view.y1]]) {
      const ss = st_s(c[0], c[1]); if (ss < s0) s0 = ss; if (ss > s1) s1 = ss;
    }
    s0 = Math.max(-0.80, s0 - 0.01); s1 = Math.min(0.80, s1 + 0.01);
    if (s1 <= s0) return;
    const base = st_wander(0);
    const step = Math.max((s1 - s0) / 460, 0.30 / u);
    const top = [], bot = [];
    let sMin = Infinity, sMax = -Infinity, mMin = Infinity, mMax = -Infinity;
    for (let s = s0; s <= s1 + step; s += step) {
      const c = st_wander(s) - base;
      const hw = 0.000230 * (0.70 + 0.60 * (0.5 + 0.5 * Math.sin(s * 470 + 0.6)))
                * (0.80 + 0.40 * (0.5 + 0.5 * Math.sin(s * 53 + 2.0)));
      top.push([s, c - hw]); bot.push([s, c + hw]);
      if (s < sMin) sMin = s; if (s > sMax) sMax = s;
      const lo = c - hw, hi = c + hw;
      if (lo < mMin) mMin = lo; if (hi > mMax) mMax = hi;
    }
    const ribbon = () => {
      g.beginPath();
      for (let i = 0; i < top.length; i++) {
        const p = top[i], x = st_x(p[0], p[1]), y = st_y(p[0], p[1]);
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      for (let i = bot.length - 1; i >= 0; i--) {
        const p = bot[i]; g.lineTo(st_x(p[0], p[1]), st_y(p[0], p[1]));
      }
      g.closePath();
    };
    ribbon();
    /* the sealant is drawn OPAQUE over the aggregate, because that is what a
       tar repair is: a ribbon where the crushed stone STOPS. On a black road
       you cannot see the tar — what you see is the aggregate ending, the two
       proud lips taking the lamplight, and, once you are close enough, the
       sealant's own skin, which is a different material entirely: no stones in
       it, just the fine grit that was cast over it while it was still soft. */
    g.fillStyle = `rgba(9,9,12,${0.97 * a})`; g.fill();
    g.save(); ribbon(); g.clip();
    const sBox = st_box(sMin, sMax, mMin, mMax);
    const TAR = { shape: 'fine', light: st_lit, spec: 'rgba(255,232,180,$)' };
    st_field(g, u, view, sBox, 0.0000021, 'rgba(128,132,142,$)', a * 0.50, 11, TAR);
    st_field(g, u, view, sBox, 0.0000082, 'rgba(134,138,148,$)', a * 0.46, 10, TAR);
    st_field(g, u, view, sBox, 0.000034, 'rgba(126,130,140,$)', a * 0.38, 8, TAR);
    g.restore();
    const lip = (P, col, w) => {
      st_line(g, col, w); g.beginPath();
      for (let i = 0; i < P.length; i++) {
        const p = P[i], x = st_x(p[0], p[1]), y = st_y(p[0], p[1]);
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
    };
    /* AT THE PLATE'S OWN DECADE THIS MUST NOT BE A LINE. A lip bright enough to
       read at 300x, drawn at u = 600, is a painted centre line down the middle
       of the road — which is exactly the smear this whole plate is built to
       avoid. So the lip earns its brightness as you approach: a whisper at the
       plate's own scale, an edge once the seam is wide enough to have edges. */
    const near = Math.min(1, Math.max(0.10, (u - 400) / 6000));
    lip(top, `rgba(224,214,192,${0.66 * near * a})`, Math.max(0.00009, Math.min(0.00040, 1.3 / u)));
    lip(bot, `rgba(152,156,168,${0.42 * near * a})`, Math.max(0.00007, Math.min(0.00032, 1.0 / u)));
  })();
  g.restore();

  /* ── 3 · kerbs and pavement ──────────────────────────────────────────── */
  for (const sd of [1, -1]) {
    const wBox = st_box(-0.80, 0.80, sd * ST_ROAD, sd * ST_WALK);
    g.save(); st_quad(g, -0.80, 0.80, sd * ST_ROAD, sd * ST_WALK); g.clip();
    g.fillStyle = `rgba(40,41,46,${0.80 * a})`; g.fill();
    st_field(g, u, view, wBox, 0.00004, 'rgba(186,188,192,$)', a * 0.55, 8, WET);
    st_field(g, u, view, wBox, 0.00016, 'rgba(180,182,188,$)', a * 0.52, 8, WET);
    st_field(g, u, view, wBox, 0.00065, 'rgba(172,174,180,$)', a * 0.46, 7, WET);
    st_field(g, u, view, wBox, 0.0026, 'rgba(160,162,170,$)', a * 0.34, 6, WET);
    st_field(g, u, view, wBox, 0.010, 'rgba(150,152,160,$)', a * 0.22, 4, WET);
    st_line(g, `rgba(200,206,214,${0.10 * a})`, 0.0009);          /* flag joints */
    for (let s = -0.78; s < 0.80; s += 0.026) st_seg(g, s, sd * ST_ROAD, s, sd * ST_WALK);
    g.restore();
    st_line(g, `rgba(226,220,200,${0.26 * a})`, 0.0016);          /* the kerb */
    st_seg(g, -0.80, sd * ST_ROAD, 0.80, sd * ST_ROAD);
    st_line(g, `rgba(200,196,180,${0.11 * a})`, 0.0010);
    st_seg(g, -0.80, sd * ST_WALK, 0.80, sd * ST_WALK);
  }

  /* ── 4 · the lots: drives, walks, roofs, and what the windows throw ──── */
  for (const sd of [1, -1]) {
    for (let i = -7; i <= 7; i++) {
      const r = st_rng(4001 + (sd > 0 ? 0 : 977) + i * 61);
      const cs = aS + i * ST_LOT + (sd > 0 ? 0 : 0.061) + (r() - 0.5) * 0.010;
      if (cs < -0.86 || cs > 0.86) continue;
      const lit = r();                                   /* is anybody home? */
      const home = lit > 0.30;
      const dvs = cs + (r() > 0.5 ? 0.041 : -0.041);     /* the drive */
      g.save();
      st_quad(g, dvs - 0.014, dvs + 0.014, sd * ST_WALK, sd * (ST_FACE - 0.004)); g.clip();
      g.fillStyle = `rgba(38,39,44,${0.85 * a})`; g.fill();
      const dBox = st_box(dvs - 0.014, dvs + 0.014, sd * ST_WALK, sd * ST_FACE);
      st_field(g, u, view, dBox, 0.00018, 'rgba(176,178,184,$)', a * 0.46, 8);
      st_field(g, u, view, dBox, 0.0007, 'rgba(168,170,178,$)', a * 0.42, 7);
      st_field(g, u, view, dBox, 0.0028, 'rgba(158,160,168,$)', a * 0.28, 5);
      g.restore();
      /* somebody's car, home for the night */
      if (r() > 0.52) {
        const cm = sd * (ST_WALK + 0.028 + r() * 0.030);
        g.fillStyle = `rgba(6,7,10,${0.42 * a})`;
        st_quad(g, dvs - 0.011, dvs + 0.011, cm - 0.024, cm + 0.024); g.fill();
        g.fillStyle = st_slate(st_facet(-1, 0) * 0.85, a, false);
        st_quad(g, dvs - 0.0092, dvs + 0.0092, cm - 0.021, cm + 0.021); g.fill();
        st_line(g, `rgba(212,208,194,${0.24 * a})`, 0.0008); g.stroke();
        g.fillStyle = `rgba(92,98,112,${0.34 * a})`;
        st_quad(g, dvs - 0.0070, dvs + 0.0070, cm - 0.009, cm + 0.010); g.fill();
      }
      /* the front walk, kerb to porch */
      g.save();
      st_quad(g, cs - 0.005, cs + 0.005, sd * ST_WALK, sd * ST_FRONT); g.clip();
      g.fillStyle = `rgba(44,45,50,${0.85 * a})`; g.fill();
      st_field(g, u, view, st_box(cs - 0.005, cs + 0.005, sd * ST_WALK, sd * ST_FRONT),
               0.0006, 'rgba(172,174,182,$)', a * 0.45, 7);
      g.restore();

      /* THE HOUSE. From up here it is a roof and a chimney, nothing more — so
         the roof has to do all the work of being a SOLID. It is properly
         hipped: a ridge with two long slopes and a hip triangle at each end,
         and every one of those four facets is shaded from its own normal
         against the plate's single moon. That is what stops a row of houses
         reading as a row of tiles. */
      const hw = 0.036 + r() * 0.006, hd = 0.098 + r() * 0.020;
      const m0 = sd * ST_FACE, m1 = sd * (ST_FACE + hd);
      const mr = sd * (ST_FACE + hd * 0.5);                       /* the ridge */
      const r0 = Math.min(hd * 0.5, hw * 0.58);
      const hBox = st_box(cs - hw, cs + hw, m0, m1);
      const pane = (pts, b) => {
        g.beginPath();
        g.moveTo(st_x(pts[0], pts[1]), st_y(pts[0], pts[1]));
        for (let k = 2; k < pts.length; k += 2) g.lineTo(st_x(pts[k], pts[k + 1]), st_y(pts[k], pts[k + 1]));
        g.closePath(); g.fillStyle = st_slate(b, a, true); g.fill();
      };
      const rA = [cs - hw + r0, mr], rB = [cs + hw - r0, mr];
      pane([cs - hw, m0, cs + hw, m0, rB[0], rB[1], rA[0], rA[1]], st_facet(0, -sd));
      pane([cs - hw, m1, cs + hw, m1, rB[0], rB[1], rA[0], rA[1]], st_facet(0, sd));
      pane([cs - hw, m0, cs - hw, m1, rA[0], rA[1]], st_facet(-1, 0));
      pane([cs + hw, m0, cs + hw, m1, rB[0], rB[1]], st_facet(1, 0));
      /* the tile, laid along the courses so tile reads as tile and not as dust */
      g.save();
      st_quad(g, cs - hw, cs + hw, m0, m1); g.clip();
      const TILE = { shape: 'streak', ang: ST_TH };
      st_field(g, u, view, hBox, 0.00007, 'rgba(190,176,156,$)', a * 0.42, 8, TILE);
      st_field(g, u, view, hBox, 0.00028, 'rgba(186,172,152,$)', a * 0.40, 8, TILE);
      st_field(g, u, view, hBox, 0.0011, 'rgba(178,164,144,$)', a * 0.34, 7, TILE);
      st_field(g, u, view, hBox, 0.0044, 'rgba(168,154,136,$)', a * 0.22, 5, TILE);
      st_line(g, `rgba(196,182,158,${0.10 * a})`, 0.0009);        /* shingle courses */
      for (let k = 1; k < 26; k++) {
        const mm = sd * (ST_FACE + hd * k / 26);
        st_seg(g, cs - hw, mm, cs + hw, mm);
      }
      g.restore();
      st_line(g, `rgba(226,214,188,${0.34 * a})`, 0.0013);        /* the moon on the ridge */
      st_seg(g, rA[0], rA[1], rB[0], rB[1]);
      st_line(g, `rgba(150,144,132,${0.15 * a})`, 0.0009);        /* the hips, creased */
      g.beginPath();
      g.moveTo(st_x(cs - hw, m0), st_y(cs - hw, m0)); g.lineTo(st_x(rA[0], rA[1]), st_y(rA[0], rA[1]));
      g.lineTo(st_x(cs - hw, m1), st_y(cs - hw, m1));
      g.moveTo(st_x(cs + hw, m0), st_y(cs + hw, m0)); g.lineTo(st_x(rB[0], rB[1]), st_y(rB[0], rB[1]));
      g.lineTo(st_x(cs + hw, m1), st_y(cs + hw, m1));
      g.stroke();
      st_line(g, `rgba(6,7,10,${0.50 * a})`, 0.0010);             /* the eave in shadow */
      st_quad(g, cs - hw, cs + hw, m0, m1); g.stroke();
      /* chimney, with a moon-struck top edge */
      const chs = cs + (r() - 0.5) * hw * 1.2;
      const chm = sd * (ST_FACE + hd * 0.46);
      g.fillStyle = st_slate(0.30, a, true);
      st_quad(g, chs - 0.005, chs + 0.005, chm, sd * (ST_FACE + hd * 0.58)); g.fill();
      st_line(g, `rgba(226,214,188,${0.34 * a})`, 0.0009);
      st_seg(g, chs - 0.005, chm, chs + 0.005, chm);
      /* somebody has the fire lit — the one moving thing on the block, and it
         moves about as fast as a minute hand */
      if (u > 260 && r() > 0.74) {
        for (let k = 0; k < 14; k++) {
          const p = k / 14, dr = ((k * 37) % 11) / 11;
          const ps = chs + (dr - 0.5) * 0.010 + Math.sin(t * 0.19 + k * 0.7) * 0.004 * p + p * 0.026;
          const pm = chm + sd * (0.004 + p * 0.020) + Math.cos(t * 0.15 + k) * 0.003 * p;
          g.fillStyle = `rgba(132,142,158,${0.055 * (1 - p) * (0.4 + dr) * a})`;
          g.beginPath(); g.arc(st_x(ps, pm), st_y(ps, pm), 0.0022 + p * 0.006, 0, 6.283); g.fill();
        }
      }

      /* the porch: a small pitch pushed out toward the street */
      const pw = 0.020 + r() * 0.005;
      g.fillStyle = `rgba(46,42,42,${0.92 * a})`;
      st_quad(g, cs - pw, cs + pw, sd * ST_FRONT, m0); g.fill();
      st_line(g, `rgba(206,194,170,${0.24 * a})`, 0.0010); g.stroke();
      st_field(g, u, view, st_box(cs - pw, cs + pw, sd * ST_FRONT, m0),
               0.0009, 'rgba(180,166,146,$)', a * 0.40, 6);

      /* what the windows throw. You never see a window from up here; you see
         the light lying on the grass, and that is what says someone is home. */
      if (home) {
        const nsp = 1 + ((r() * 3.7) | 0);
        for (let k = 0; k < nsp; k++) {
          const side = r();
          const flick = 1 + 0.05 * Math.sin(t * 0.55 + i * 2.1 + k);
          let ss, mm, ds, dm;
          if (side < 0.45) { ss = cs + (r() - 0.5) * hw * 1.6; mm = m1; ds = 0.012; dm = sd * 0.038; }
          else if (side < 0.72) { ss = cs - hw; mm = sd * (ST_FACE + hd * (0.2 + 0.6 * r())); ds = -0.030; dm = 0; }
          else { ss = cs + hw; mm = sd * (ST_FACE + hd * (0.2 + 0.6 * r())); ds = 0.030; dm = 0; }
          const tv = r() > 0.84;
          const col = tv ? '150,190,214' : '244,204,126';
          /* THE THROW. A window seen from directly above is not a window and
             not a blob: it is a LOZENGE of light lying against its own wall —
             wide along the wall, short away from it, with a hard edge where the
             wall stops it and a soft one where it dies on the grass. */
          const wallS = dm === 0;                       /* a gable window? */
          /* WIDER ALONG THE WALL THAN DEEP. Elongate it the other way and the
             throw stops being light lying on grass and becomes a glowing egg
             floating in the garden — which was the first thing I got wrong. */
          const halfW = (wallS ? 0.017 : 0.022) + 0.005 * r();
          const reach = 0.012 + 0.007 * r();
          const dirS = ds > 0 ? 1 : -1;
          g.save();
          /* the hard side: the wall itself. Nothing spills backwards. */
          if (wallS) st_quad(g, ss, ss + dirS * reach * 1.6, mm - halfW * 1.7, mm + halfW * 1.7);
          else st_quad(g, ss - halfW * 1.7, ss + halfW * 1.7, mm, mm + Math.sign(dm) * reach * 1.6);
          g.clip();
          g.translate(st_x(ss, mm), st_y(ss, mm));
          g.rotate(ST_TH);
          /* long along the wall, short away from it */
          if (wallS) { g.scale(reach / halfW, 1); g.translate(dirS * halfW * 0.55, 0); }
          else { g.scale(1, reach / halfW); g.translate(0, Math.sign(dm) * halfW * 0.55); }
          const gr = g.createRadialGradient(0, 0, 0, 0, 0, halfW * 1.35);
          gr.addColorStop(0, `rgba(${col},${(tv ? 0.23 : 0.36) * a * flick})`);
          gr.addColorStop(0.45, `rgba(${col},${(tv ? 0.09 : 0.13) * a * flick})`);
          gr.addColorStop(1, `rgba(${col},0)`);
          g.fillStyle = gr; g.beginPath(); g.arc(0, 0, halfW * 1.35, 0, 6.283); g.fill();
          g.restore();
          /* the sill: the lit edge itself, a bright seam on the roofline */
          g.fillStyle = `rgba(${col},${0.60 * a * flick})`;
          if (dm) st_quad(g, ss - 0.006, ss + 0.006, mm, mm + sd * 0.0022);
          else st_quad(g, ss + (ds > 0 ? 0 : -0.0022), ss + (ds > 0 ? 0.0022 : 0), mm - 0.006, mm + 0.006);
          g.fill();
        }
      }

      /* back garden: a shed, a tree, a washing line's worth of dark */
      if (r() > 0.45) {
        const gs = cs + (r() - 0.5) * 0.05, gm = sd * (ST_BACK + 0.030 + r() * 0.05);
        g.fillStyle = st_slate(st_facet(0, -sd) * 0.78, a, true);
        st_quad(g, gs - 0.011, gs + 0.011, gm - 0.009, gm + 0.009); g.fill();
        st_line(g, `rgba(190,180,160,${0.18 * a})`, 0.0008); g.stroke();
      }
      /* fences between the lots */
      st_line(g, `rgba(150,146,136,${0.12 * a})`, 0.0007);
      st_seg(g, cs + ST_LOT * 0.5, sd * ST_BACK, cs + ST_LOT * 0.5, sd * ST_GARD);
    }
    /* the alley, and the backs of the next street's houses */
    const alBox = st_box(-0.80, 0.80, sd * ST_GARD, sd * ST_ALLEY);
    g.save(); st_quad(g, -0.80, 0.80, sd * ST_GARD, sd * ST_ALLEY); g.clip();
    g.fillStyle = `rgba(28,29,33,${0.80 * a})`; g.fill();
    st_field(g, u, view, alBox, 0.0004, 'rgba(146,150,158,$)', a * 0.40, 7);
    st_field(g, u, view, alBox, 0.0016, 'rgba(140,144,152,$)', a * 0.30, 6);
    g.restore();
    for (let i = -7; i <= 7; i++) {
      const r = st_rng(7717 + (sd > 0 ? 0 : 331) + i * 43);
      const cs = aS + i * ST_LOT + 0.03 + (r() - 0.5) * 0.02;
      if (cs < -0.84 || cs > 0.84) continue;
      const m0 = sd * (ST_ALLEY + 0.014);
      g.save();
      st_quad(g, cs - 0.040, cs + 0.040, m0, sd * 0.60); g.clip();
      g.fillStyle = st_slate(st_facet(0, -sd), a, true); g.fill();
      /* their ridge line runs along the street too, so the far slope is the
         one the moon has: two values, one moon, same as this side */
      g.save(); st_quad(g, cs - 0.040, cs + 0.040, m0 + sd * 0.048, sd * 0.60); g.clip();
      g.fillStyle = st_slate(st_facet(0, sd), a, true); g.fill(); g.restore();
      st_field(g, u, view, st_box(cs - 0.040, cs + 0.040, m0, sd * 0.60),
               0.00028, 'rgba(184,170,150,$)', a * 0.34, 7, { shape: 'streak', ang: ST_TH });
      st_field(g, u, view, st_box(cs - 0.040, cs + 0.040, m0, sd * 0.60),
               0.0011, 'rgba(176,162,142,$)', a * 0.26, 6, { shape: 'streak', ang: ST_TH });
      st_line(g, `rgba(192,178,156,${0.06 * a})`, 0.0008);
      for (let k = 1; k < 12; k++) st_seg(g, cs - 0.040, m0 + sd * k * 0.0082, cs + 0.040, m0 + sd * k * 0.0082);
      g.restore();
      st_quad(g, cs - 0.040, cs + 0.040, m0, sd * 0.60);
      st_line(g, `rgba(196,186,164,${0.16 * a})`, 0.0010); g.stroke();
      st_line(g, `rgba(212,200,176,${0.22 * a})`, 0.0011);     /* their ridge */
      st_seg(g, cs - 0.040, m0 + sd * 0.048, cs + 0.040, m0 + sd * 0.048);
      if (r() > 0.55) {
        const gr = g.createRadialGradient(st_x(cs, m0), st_y(cs, m0), 0, st_x(cs, m0), st_y(cs, m0), 0.035);
        gr.addColorStop(0, `rgba(244,204,126,${0.16 * a})`); gr.addColorStop(1, 'rgba(244,204,126,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(st_x(cs, m0), st_y(cs, m0), 0.035, 0, 6.283); g.fill();
      }
    }
  }

  /* ── 5 · the street trees ────────────────────────────────────────────── */
  for (const sd of [1, -1]) {
    for (let i = -6; i <= 6; i++) {
      const r = st_rng(5501 + (sd > 0 ? 0 : 617) + i * 97);
      if (r() > 0.62) continue;
      const cs = aS + i * ST_LOT + (sd > 0 ? 0.058 : 0.118) + (r() - 0.5) * 0.02;
      if (cs < -0.80 || cs > 0.80) continue;
      const cm = sd * (ST_FRONT - 0.030 - r() * 0.02);
      const sway = Math.sin(t * 0.31 + i) * 0.0015;
      const cx = st_x(cs, cm) + sway, cy = st_y(cs, cm) + sway * 0.6;
      const rad = 0.020 + r() * 0.012;
      for (let k = 0; k < 11; k++) {
        const th = r() * 6.283, d = Math.sqrt(r()) * rad * 0.8;
        g.fillStyle = `rgba(22,26,24,${(0.30 + 0.35 * r()) * a})`;
        g.beginPath(); g.arc(cx + Math.cos(th) * d, cy + Math.sin(th) * d, rad * (0.30 + 0.28 * r()), 0, 6.283); g.fill();
      }
      st_line(g, `rgba(178,172,150,${0.14 * a})`, 0.0009);
      for (let k = 0; k < 7; k++) {
        const th = r() * 6.283, d = rad * (0.5 + 0.5 * r());
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(th) * d, cy + Math.sin(th) * d); g.stroke();
      }
    }
  }

  /* ── 6 · the parked cars ─────────────────────────────────────────────── */
  for (const sd of [1, -1]) {
    for (let i = -8; i <= 8; i++) {
      const r = st_rng(6203 + (sd > 0 ? 0 : 811) + i * 53);
      if (r() > 0.68) continue;
      const cs = aS + i * 0.070 + (sd > 0 ? 0.02 : 0.055) + (r() - 0.5) * 0.012;
      if (cs < -0.78 || cs > 0.78) continue;
      const cm = sd * (ST_ROAD - 0.022);
      g.fillStyle = `rgba(6,7,10,${0.40 * a})`;                       /* under-shadow */
      st_quad(g, cs - 0.024, cs + 0.024, cm - 0.011, cm + 0.011); g.fill();
      g.fillStyle = st_slate(st_facet(0, -sd) * 0.85, a, false);
      st_quad(g, cs - 0.022, cs + 0.022, cm - 0.0095, cm + 0.0095); g.fill();
      st_line(g, `rgba(214,210,196,${(0.20 + 0.22 * st_facet(0, -sd)) * a})`, 0.0008); g.stroke();
      g.fillStyle = `rgba(96,102,116,${(0.20 + 0.34 * st_facet(0, -sd)) * a})`;   /* roof panel */
      st_quad(g, cs - 0.009, cs + 0.010, cm - 0.0072, cm + 0.0072); g.fill();
      g.fillStyle = `rgba(150,164,182,${0.30 * a})`;                  /* glass */
      st_quad(g, cs + 0.010, cs + 0.016, cm - 0.0072, cm + 0.0072); g.fill();
      st_quad(g, cs - 0.015, cs - 0.010, cm - 0.0072, cm + 0.0072); g.fill();
    }
  }

  /* ── 7 · the lamps ───────────────────────────────────────────────────────
     The pools are deliberately THIN here. Most of what you read as lamplight
     on this road was already laid down grain by grain, back when the asphalt
     was stippled — every speck standing in a pool struck its own specular. A
     broad radial gradient on top of that would cross the blow-up as a soft
     band and undo it, so the gradient is only the pool's EXTENT, and the
     brightness lives in the stones. */
  for (let i = 0; i < lamps.length; i++) {
    const L = lamps[i], ls = L[0], lm = L[1], sd = L[2], fl = L[3];
    g.save();
    /* from straight up, the roof is over the lantern: nothing spills onto the
       houses, and the pool stops at the building line */
    st_quad(g, -0.90, 0.90, -ST_FACE, ST_FACE); g.clip();
    st_pool(g, ls, lm * 0.35, 0.088 * poolX, 1.7, [
      [0, `rgba(250,208,132,${Math.min(0.50, 0.145 * fl) * a})`],
      [0.42, `rgba(244,196,116,${Math.min(0.22, 0.055 * fl) * a})`],
      [1, 'rgba(244,196,116,0)']]);
    /* the reflection streak: a wet road hands the lamp back, stretched */
    st_pool(g, ls, lm * 0.5, 0.055 * poolX, 3.4, [
      [0, `rgba(252,214,146,${Math.min(0.30, 0.075 * fl) * a})`],
      [1, 'rgba(252,214,146,0)']]);
    g.restore();
    /* the head */
    g.fillStyle = `rgba(255,238,196,${Math.min(0.95, 0.90 * fl) * a})`;
    g.beginPath(); g.arc(st_x(ls, lm), st_y(ls, lm), 0.0055 * poolX, 0, 6.283); g.fill();
    st_pool(g, ls, lm, 0.020 * poolX, 1, [
      [0, `rgba(255,232,178,${Math.min(0.9, 0.55 * fl) * a})`], [1, 'rgba(255,232,178,0)']]);
    /* the pole's shadow, thrown away from the light */
    st_line(g, `rgba(6,7,10,${0.30 * a})`, 0.0016);
    st_seg(g, ls, lm, ls + 0.030, lm + sd * 0.026);
  }

  /* ── 8 · THE LIT STOOP — the one doorway the child grows out of ───────────
     Everything else on this street burns sodium. This one is WHITE-warm, and
     it is the brightest thing in the frame — because a viewer has to be able
     to find it without being pointed at it, and because the next plate down is
     standing on these steps. */
  const glow = stoopGlow;
  st_pool(g, aS, aM + 0.004, 0.070 * poolX, 1.15, [
    [0, `rgba(255,236,196,${Math.min(0.95, 0.42 * glow) * a})`],
    [0.34, `rgba(255,220,158,${Math.min(0.55, 0.19 * glow) * a})`],
    [1, 'rgba(252,208,128,0)']]);
  g.fillStyle = `rgba(46,42,42,${0.9 * a})`;                    /* the steps */
  st_quad(g, aS - 0.013, aS + 0.013, aM - 0.014, aM + 0.014); g.fill();
  st_line(g, `rgba(248,236,212,${0.42 * a})`, 0.0011);
  for (let k = 0; k < 4; k++) st_seg(g, aS - 0.013, aM - 0.010 + k * 0.007, aS + 0.013, aM - 0.010 + k * 0.007);
  /* the hall, through a door standing open */
  const dgr = g.createLinearGradient(st_x(aS, aM + 0.017), st_y(aS, aM + 0.017),
                                     st_x(aS, aM - 0.014), st_y(aS, aM - 0.014));
  dgr.addColorStop(0, `rgba(255,244,214,${Math.min(1, 0.92 * glow) * a})`);
  dgr.addColorStop(0.45, `rgba(255,232,180,${0.42 * a * glow})`);
  dgr.addColorStop(1, 'rgba(255,224,164,0)');
  g.fillStyle = dgr;
  st_quad(g, aS - 0.008, aS + 0.008, aM - 0.014, aM + 0.017); g.fill();
  g.fillStyle = `rgba(255,248,226,${Math.min(1, 0.85 * glow) * a})`;   /* the threshold */
  st_quad(g, aS - 0.007, aS + 0.007, aM + 0.012, aM + 0.017); g.fill();
  smudge(g, A, 0.030, '255,236,196', a * 0.95, 59);

  /* ── 9 · the plate's own paper: the finest field, over everything ────── */
  st_field(g, u, view, PLATE, 0.000012, 'rgba(206,198,180,$)', a * 0.20, 4, { shape: 'fine' });
  st_field(g, u, view, PLATE, 0.00021, 'rgba(206,198,180,$)', a * 0.09, 2.5, { shape: 'fine' });
  st_field(g, u, view, PLATE, 0.0034, 'rgba(198,192,178,$)', a * 0.05, 1.6, { shape: 'fine' });

  g.restore();
};

/* ═══ 4  THE CITY, FROM THE AIR ═══════════════════════════════════════════
   Ten-fold glass, plate 10^4.

   The idea: do not DRAW a city, SURVEY one. The street grid is an implicit
   warped field (two frames, one either side of the river, each a lattice bent
   by a smooth warp), so streets curve, meet the water at an angle, and change
   their weave across the bridges the way a real town does. Every light is a
   discrete lamp: chains along the roads, clumped window-fields inside the
   blocks. Nothing here is a wash — at 300x the wash would smear, but a lamp is
   a lamp at every magnification, so the picture stipples APART into a field of
   separate points instead of dissolving.

   Scale discipline: the drawing culls itself to the visible window (read off
   the live transform), and every octave — road level, lamp spacing, window
   lattice — is drawn only while its on-screen pitch sits in a legible band.
   The airglow is the ONLY smooth element and it is gone by u ~ 13000, long
   before the blow-up could smear it. The street hierarchy runs eight levels
   deep, so the blow-up still has STREETS in it and reads as a city rather than
   a star field — and down there every one of them is a chain of discrete
   lamps, never a ruled line, because a ruled line at magnification is exactly
   what turns a city back into graph paper.                                   */
PlateArt.city = (function () {
  'use strict';

  const CORE = [0.035, 0.045];

  /* ── integer-lattice hash: the whole city is reproducible from this ──── */
  function h2(i, j, s) {
    let h = (Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function sat(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ── geography ───────────────────────────────────────────────────────── */
  function riverY(x) { return 0.10 + 0.42 * x + 0.075 * Math.sin(x * 4.6 + 1.2) + 0.030 * Math.sin(x * 9.1 - 0.6); }
  /* a wide, breathing river — the one piece of geography the whole plate has
     to defer to. Its half-width is what the masks ask about. */
  function riverW(x) { return 0.0265 + 0.0125 * x + 0.0055 * Math.sin(x * 5.3 + 0.4); }
  /* the bank as DRAWN: the same width pushed about by a couple of octaves, so
     the edge of the water is ragged instead of ruled */
  function bankW(x, sgn) {
    return riverW(x) * (1 + 0.20 * Math.sin(x * 21.7 + sgn * 2.1) + 0.11 * Math.sin(x * 43.3 - 1.1 + sgn));
  }

  /* the four crossings, fixed once — the bridges and the bridgeheads agree */
  const BRIDGE = [];
  for (let bi = 0; bi < 4; bi++) BRIDGE.push(-0.34 + bi * 0.235 + (h2(bi, 9, 3) - 0.5) * 0.05);

  /* parks + the one dark heath: cx, cy, r, aspect, rot, lobes */
  const PARKS = [
    [-0.285, -0.205, 0.132, 0.74, 1.15, 3],
    [0.258, -0.322, 0.058, 1.25, -0.40, 4],
    [0.150, 0.330, 0.048, 0.90, 0.70, 3],
    [-0.395, 0.145, 0.040, 1.10, 0.20, 4]
  ];
  function parkR(P, th) {
    return P[2] * (1 + 0.20 * Math.sin(P[5] * th + P[0] * 9) + 0.10 * Math.sin((P[5] + 2) * th - 1.3)
      + 0.05 * Math.sin((P[5] + 5) * th + 2.2));
  }
  function inPark(x, y) {
    for (let i = 0; i < PARKS.length; i++) {
      const P = PARKS[i], dx = x - P[0], dy = y - P[1];
      if (dx * dx + dy * dy > P[2] * P[2] * 2.6) continue;
      const c = Math.cos(P[4]), s = Math.sin(P[4]);
      const ux = (c * dx + s * dy) / P[3], uy = (-s * dx + c * dy) * P[3];
      const r = Math.sqrt(ux * ux + uy * uy);
      const rr = parkR(P, Math.atan2(uy, ux));
      if (r < rr) return 1 - r / rr;
    }
    return 0;
  }

  /* how much city there is here at all — a lobed falloff, a hot core, and
     outlying settlements loose in the dark at the edges */
  function mass(x, y) {
    const dx = x - CORE[0], dy = y - CORE[1];
    const r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx);
    const lobe = 1 + 0.24 * Math.sin(3 * th + 1.1) + 0.14 * Math.sin(5 * th - 0.6) + 0.09 * Math.sin(2 * th + 2.4);
    const rr = r / (0.362 * lobe);                 /* the town reaches further out */
    let m = Math.exp(-rr * rr * rr * 1.35) + 0.5 * Math.exp(-(r / 0.090) * (r / 0.090));
    const sx = (x + 0.05) / 0.145, sy = (y - 0.335) / 0.120;      /* the far bank */
    m += 0.72 * Math.exp(-(sx * sx + sy * sy));
    /* the bridgeheads. A town always thickens where it meets its own crossing,
       and that is the thing that stops a bridge reading as a bright dash
       floating just off the end of the grid. */
    const rd = y - riverY(x);
    if (rd * rd < 0.0169) {
      for (let b = 0; b < 4; b++) {
        const ex = (x - BRIDGE[b]) / 0.055, ey = rd / 0.080;
        const v = 0.60 * Math.exp(-(ex * ex + ey * ey));
        if (v > m) m = v;
      }
    }
    if (m < 0.30) {                                  /* the outskirts only */
      const vs = 0.085, i = Math.floor(x / vs), j = Math.floor(y / vs);
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        if (h2(i + di, j + dj, 7717) < 0.76) continue;
        const cx = (i + di + 0.15 + 0.7 * h2(i + di, j + dj, 31)) * vs;
        const cy = (j + dj + 0.15 + 0.7 * h2(i + di, j + dj, 37)) * vs;
        const ex = (x - cx) / 0.0195, ey = (y - cy) / 0.0195;
        const v = 0.70 * Math.exp(-(ex * ex + ey * ey));
        if (v > m) m = v;
      }
    }
    return m > 1.25 ? 1.25 : m;
  }

  /* ── the street field: a lattice under a smooth warp ─────────────────── */
  function mkFrame(sp, th, ox, oy, A, B, ph) {
    const c = Math.cos(th), s = Math.sin(th);
    function wx(q) { return A * Math.sin(q * 3.1 + ph) + 0.32 * A * Math.sin(q * 7.9 - 1.1 + ph); }
    function wy(p) { return B * Math.sin(p * 2.7 - 0.9 + ph) + 0.32 * B * Math.sin(p * 6.5 + 2.0 + ph); }
    return {
      sp: sp,
      fwd: function (p, q) { const X = p + wx(q), Y = q + wy(p); return [ox + c * X - s * Y, oy + s * X + c * Y]; },
      inv: function (x, y) {
        const dx = x - ox, dy = y - oy, X = c * dx + s * dy, Y = -s * dx + c * dy;
        let p = X, q = Y;
        for (let i = 0; i < 4; i++) { p = X - wx(q); q = Y - wy(p); }
        return [p, q];
      }
    };
  }
  /* north bank: the old town's weave. south bank: laid out later, on a slant */
  const FN = mkFrame(0.0585, 0.055, CORE[0], CORE[1], 0.072, 0.052, 0.0);
  const FS = mkFrame(0.0505, -0.440, -0.05, 0.335, 0.042, 0.055, 2.30);
  const LV = 6;                       /* block / window sizing hangs off this */
  const LVS = 8;                      /* the CHAIN hierarchy runs deeper: the
                                         blow-up must still find streets in it */

  function frameAt(x, y) { return y > riverY(x) ? FS : FN; }

  /* distance-to-nearest-street as a 0..1 lit-ness. `minPitch` drops every level
     finer than the sampler that is asking — a field of dots spaced 0.02 apart
     cannot see a street every 0.0002, and pretending it can turns real street
     structure into noise. Squared, so a run of lamps lines up unmistakably
     instead of dissolving into an even dust. */
  function streetness(F, pq, minPitch) {
    let m = 0;
    for (let k = 0; k < LVS; k++) {
      const s = F.sp / (1 << k);
      if (minPitch && s < minPitch * 1.15) break;
      const dp = Math.abs((((pq[0] / s) % 1) + 1.5) % 1 - 0.5) * s;
      const dq = Math.abs((((pq[1] / s) % 1) + 1.5) % 1 - 0.5) * s;
      const d = dp < dq ? dp : dq, w = s * 0.125;
      if (d < w) { const q = 1 - d / w, v = q * q * (1 - 0.075 * k); if (v > m) m = v; }
    }
    return m;
  }

  /* inside a block: buildings, courts and the gaps between them */
  function blockLight(F, pq) {
    const bs = F.sp / (1 << (LV - 1)) * 0.5;
    const i = Math.floor(pq[0] / bs), j = Math.floor(pq[1] / bs);
    const occ = h2(i, j, 991);
    if (occ > 0.66) return 0.01;
    const fx = pq[0] / bs - i, fy = pq[1] / bs - j, mg = 0.13 + 0.10 * h2(i, j, 17);
    if (fx < mg || fx > 1 - mg || fy < mg || fy > 1 - mg) return 0.04;
    return 0.22 + 0.48 * h2(i, j, 53);
  }

  /* ── the ink ─────────────────────────────────────────────────────────── */
  /* sodium first — but a city is never one lamp. Old amber sodium, new white
     sodium, a scatter of cold mercury and one or two blue-white floodlights. */
  const LAMP = ['255,200,112', '255,172,72', '255,226,164', '236,224,198', '176,208,240', '150,190,238'];
  function lampCol(hv) {
    return hv > 0.987 ? 5 : hv > 0.940 ? 4 : hv > 0.865 ? 3 : hv > 0.555 ? 2 : hv > 0.230 ? 0 : 1;
  }

  /* a lamp is a round soft point of light, not a pixel. One sprite per colour,
     built once and drawn scaled — which costs no more than a rect and reads as
     a LAMP at every magnification instead of an aliased square. If there is no
     document to build them in, fall back to the rect. */
  let SPR = null, sprTried = false;
  function sprites() {
    if (sprTried) return SPR;
    sprTried = true;
    try {
      const R = 20, out = [];
      for (let c = 0; c < LAMP.length; c++) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = R * 2;
        const q = cv.getContext('2d');
        const gr = q.createRadialGradient(R, R, 0, R, R, R);
        gr.addColorStop(0, 'rgba(' + LAMP[c] + ',1)');
        gr.addColorStop(0.34, 'rgba(' + LAMP[c] + ',0.94)');
        gr.addColorStop(0.62, 'rgba(' + LAMP[c] + ',0.34)');
        gr.addColorStop(1, 'rgba(' + LAMP[c] + ',0)');
        q.fillStyle = gr; q.fillRect(0, 0, R * 2, R * 2);
        out.push(cv);
      }
      SPR = out;
    } catch (e) { SPR = null; }
    return SPR;
  }

  /* Parametric road surface, laid down segment by segment so it FADES with the
     city and stops dead at the water's edge. A road drawn at even weight from
     edge to edge is the thing that turns a city into graph paper, so this one
     is never allowed to: below a hard floor of built mass it is simply not
     there, and it dies well before it reaches open country. */
  function road(g, f, u, a, w, col, al, mask, N, overWater) {
    /* a wide road at deep magnification is unlit asphalt, not a grey band —
       so the wider it gets on screen, the quieter it goes */
    const wpx = w * u;
    if (wpx > 3) al *= Math.max(0.22, 3 / wpx);
    g.lineWidth = Math.max(w, 0.75 / u); g.strokeStyle = col;
    g.lineCap = 'round'; g.lineJoin = 'round';
    N = N || 30; let px = 0, py = 0, pv = 0, have = false;
    for (let i = 0; i <= N; i++) {
      const P = f(i / N), x = P[0], y = P[1];
      let v = mask ? mask(x, y) : 1;
      if (!overWater && Math.abs(y - riverY(x)) < riverW(x) * 1.02) v = 0;
      /* the WEAKER end governs. Averaging the two lets one lit sample drag a
         road a whole sample-length out into country that has no city in it,
         which is how a survey grows the ruled lines it must not have. */
      const mv = v < pv ? v : pv;
      if (have && mv > 0.20) {
        g.globalAlpha = al * a * Math.min(1, (mv - 0.18) / 0.55);
        g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
      }
      px = x; py = y; pv = v; have = true;
    }
  }

  return function (g, u, a, t, anchor) {
    const AN = anchor || [-0.12, -0.09];
    g.save();
    g.scale(u, u);

    /* ── the visible window, read off the live transform ─────────────── */
    let V = { x0: -0.52, x1: 0.52, y0: -0.52, y1: 0.52 };
    try {
      const T = g.getTransform(), det = T.a * T.d - T.b * T.c;
      if (det) {
        const W = g.canvas.width, H = g.canvas.height;
        const ia = T.d / det, ib = -T.b / det, ic = -T.c / det, id = T.a / det;
        const ie = (T.c * T.f - T.d * T.e) / det, ig = (T.b * T.e - T.a * T.f) / det;
        const cor = [0, 0, W, 0, 0, H, W, H];
        let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
        for (let i = 0; i < 8; i += 2) {
          const X = cor[i], Y = cor[i + 1];
          const ux = ia * X + ic * Y + ie, uy = ib * X + id * Y + ig;
          if (ux < mnx) mnx = ux; if (ux > mxx) mxx = ux;
          if (uy < mny) mny = uy; if (uy > mxy) mxy = uy;
        }
        const v = { x0: Math.max(V.x0, mnx), x1: Math.min(V.x1, mxx), y0: Math.max(V.y0, mny), y1: Math.min(V.y1, mxy) };
        if (v.x1 > v.x0 && v.y1 > v.y0) V = v;
      }
    } catch (e) { /* no transform introspection — draw the whole plate */ }

    const inV = function (x, y) { return x > V.x0 && x < V.x1 && y > V.y0 && y < V.y1; };
    const px1 = 1 / u;                                    /* one device px  */
    const SP = sprites();
    let budget = 30000;
    /* a lamp is a LAMP at every magnification — never a blob. Clamped to about
       a pixel wide whatever the scale, which is what keeps the blow-up
       stippling apart instead of smearing. */
    const drOf = function (s) { const r = s * 0.13; return Math.min(1.15 * px1, Math.max(0.80 * px1, r)); };
    const lamp = SP
      ? function (ci, x, y, r) { g.drawImage(SP[ci], x - r * 1.45, y - r * 1.45, r * 2.9, r * 2.9); }
      : function (ci, x, y, r) { g.fillStyle = 'rgba(' + LAMP[ci] + ',1)'; g.fillRect(x - r, y - r, r * 2, r * 2); };
    const wet = function (x, y) { return Math.abs(y - riverY(x)) < riverW(x); };
    const still = u > 20000;             /* deep inside it, the air holds still */

    /* ── 1 the dark ground ───────────────────────────────────────────── */
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(6,8,13,' + (0.93 * a) + ')';
    g.fillRect(-0.5, -0.5, 1, 1);

    /* ── 2 airglow — the only smooth thing, and it leaves before the gap.
       It goes down FIRST, under the water and the parks, so the dark shapes
       of the geography cut through it instead of being washed out by it. ── */
    const lod = 1 - sat((Math.log(u / 900) / Math.LN10) / 1.15);
    if (lod > 0.01) {
      const gl = g.createRadialGradient(CORE[0], CORE[1], 0.01, CORE[0], CORE[1], 0.50);
      gl.addColorStop(0, 'rgba(255,192,104,' + (0.27 * a * lod) + ')');
      gl.addColorStop(0.35, 'rgba(240,164,82,' + (0.11 * a * lod) + ')');
      gl.addColorStop(1, 'rgba(220,150,70,0)');
      g.globalAlpha = 1; g.fillStyle = gl;
      g.beginPath(); g.arc(CORE[0], CORE[1], 0.50, 0, 6.28318); g.fill();
      const gh = g.createRadialGradient(AN[0], AN[1], 0.002, AN[0], AN[1], 0.10);
      gh.addColorStop(0, 'rgba(255,214,140,' + (0.17 * a * lod) + ')');
      gh.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = gh; g.beginPath(); g.arc(AN[0], AN[1], 0.10, 0, 6.28318); g.fill();
    }

    /* ── 3 the river: a hard black cut through the light, banks ragged, with
       a cold rim of sheen. Everything else in the plate defers to it. ── */
    g.globalAlpha = 1;
    g.beginPath();
    for (let i = 0; i <= 96; i++) { const x = -0.52 + i / 96 * 1.04, y = riverY(x) - bankW(x, 1); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    for (let i = 96; i >= 0; i--) { const x = -0.52 + i / 96 * 1.04; g.lineTo(x, riverY(x) + bankW(x, -1)); }
    g.closePath();
    g.fillStyle = 'rgba(3,5,9,' + (1.0 * a) + ')'; g.fill();
    g.strokeStyle = 'rgba(120,138,164,' + (0.12 * a) + ')'; g.lineWidth = Math.max(0.8 * px1, 0.0012); g.stroke();

    /* ── 4 the parks: where the grid simply stops ────────────────────── */
    for (let i = 0; i < PARKS.length; i++) {
      const P = PARKS[i]; g.beginPath();
      for (let k = 0; k <= 56; k++) {
        const th = k / 56 * 6.28318, rr = parkR(P, th);
        const ux = Math.cos(th) * rr * P[3], uy = Math.sin(th) * rr / P[3];
        const c = Math.cos(P[4]), s = Math.sin(P[4]);
        const x = P[0] + c * ux - s * uy, y = P[1] + s * ux + c * uy;
        if (k) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.closePath(); g.fillStyle = 'rgba(7,10,11,' + (0.96 * a) + ')'; g.fill();
    }

    /* ── the mote. Forty pixels of city is a knot of sodium light with a black
       river in it, and any attempt at detail here is just dirt. ────────── */
    if (u < 46) {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const th = i * 1.257 + 0.4, r = 0.10 + 0.10 * h2(i, 1, 44);
        const x = CORE[0] + Math.cos(th) * r, y = CORE[1] + Math.sin(th) * r * 0.9;
        const rad = 0.24 + 0.10 * h2(i, 3, 44);
        const gs = g.createRadialGradient(x, y, 0, x, y, rad);
        gs.addColorStop(0, 'rgba(255,206,126,' + (0.42 * a) + ')');
        gs.addColorStop(0.45, 'rgba(252,186,100,' + (0.13 * a) + ')');
        gs.addColorStop(1, 'rgba(240,170,84,0)');
        g.globalAlpha = 1; g.fillStyle = gs;
        g.beginPath(); g.arc(x, y, rad, 0, 6.28318); g.fill();
      }
      /* the knots inside it: downtown, the far-bank quarter, and the towns
         loose around them. Even at fifteen pixels a town is not ONE dot — it
         has a bright middle and satellites, and that is what tells you it is
         a place you are falling toward rather than a star. */
      for (let i = 0; i < 9; i++) {
        const th = i * 0.897 + 1.1;
        const r = i ? (i > 5 ? 0.30 + 0.14 * h2(i, 8, 44) : 0.15 + 0.16 * h2(i, 6, 44)) : 0;
        const x = CORE[0] + Math.cos(th) * r, y = CORE[1] + Math.sin(th) * r * 0.88;
        g.globalAlpha = Math.min(0.98, a * (i ? (i > 5 ? 0.45 : 0.85) : 1.0));
        g.fillStyle = i ? 'rgba(255,216,150,1)' : 'rgba(255,242,204,1)';
        const rr = (i ? (i > 5 ? 0.8 : 1.15) : 2.1) * px1;
        g.beginPath(); g.arc(x, y, rr, 0, 6.28318); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(4,6,10,' + (0.95 * a) + ')';
      g.lineWidth = Math.max(1.1 * px1, riverW(0) * 1.7);
      g.beginPath();
      for (let i = 0; i <= 24; i++) { const x = -0.5 + i / 24; if (i) g.lineTo(x, riverY(x)); else g.moveTo(x, riverY(x)); }
      g.stroke();
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.restore(); return;
    }

    /* ═══ the light ═══════════════════════════════════════════════════ */
    g.globalCompositeOperation = 'lighter';

    /* ── 5 lamp chains along the street hierarchy ────────────────────── */
    const MASK = function (x, y) { return sat(mass(x, y) * 1.3) * (inPark(x, y) > 0.12 ? 0.18 : 1); };
    const frames = [FN, FS];
    for (let fi = 0; fi < 2 && budget > 0; fi++) {
      const F = frames[fi], south = (F === FS);
      /* each bank keeps its own weave. The two grids meet at the water and do
         not cross it — which is the whole reason a river makes a city legible */
      const SMASK = south
        ? function (x, y) { return y > riverY(x) ? MASK(x, y) : 0; }
        : function (x, y) { return y < riverY(x) ? MASK(x, y) : 0; };
      const HMASK = function (x, y) {
        const v = SMASK(x, y);
        return v <= 0 ? 0 : sat((v - 0.44) / 0.42);
      };
      const c0 = F.inv(V.x0, V.y0), c1 = F.inv(V.x1, V.y0), c2 = F.inv(V.x0, V.y1), c3 = F.inv(V.x1, V.y1);
      let p0 = Math.min(c0[0], c1[0], c2[0], c3[0]), p1 = Math.max(c0[0], c1[0], c2[0], c3[0]);
      let q0 = Math.min(c0[1], c1[1], c2[1], c3[1]), q1 = Math.max(c0[1], c1[1], c2[1], c3[1]);
      const pad = Math.min(0.17, 0.55 * ((p1 - p0) + (q1 - q0)) + 0.004);
      p0 -= pad; p1 += pad; q0 -= pad; q1 += pad;

      const bs = F.sp / (1 << (LV - 1)) * 0.5, ws = bs / 12;
      if (ws * u > 3.6 && ws * u < 70 && budget > 0) {
        const padW = 0.12 * Math.max((p1 - p0) - 2 * pad, (q1 - q0) - 2 * pad) + 3 * ws;
        const wi0 = Math.floor((p0 + pad - padW) / ws), wi1 = Math.ceil((p1 - pad + padW) / ws);
        const wj0 = Math.floor((q0 + pad - padW) / ws), wj1 = Math.ceil((q1 - pad + padW) / ws);
        if ((wi1 - wi0) * (wj1 - wj0) < 60000) {
          const dotR = drOf(ws);
          for (let i = wi0; i <= wi1 && budget > 0; i++) {
            const bi2 = Math.floor(i * ws / bs);
            for (let j = wj0; j <= wj1 && budget > 0; j++) {
              const hv = h2(i, j, 4801);
              if (hv > 0.70) continue;                     /* a dark window   */
              const bj = Math.floor(j * ws / bs);
              if (h2(bi2, bj, 991) > 0.74) continue;       /* a dark building */
              const pp = i * ws, qq = j * ws;
              const fx = pp / bs - bi2, fy = qq / bs - bj, mg = 0.13 + 0.10 * h2(bi2, bj, 17);
              if (fx < mg || fx > 1 - mg || fy < mg || fy > 1 - mg) continue;   /* the yard */
              const P = F.fwd(pp + (h2(i, j, 11) - 0.5) * ws * 0.3, qq + (h2(i, j, 12) - 0.5) * ws * 0.3);
              const x = P[0], y = P[1];
              if (!inV(x, y) || wet(x, y)) continue;
              if ((south && y < riverY(x)) || (!south && y > riverY(x))) continue;
              if (inPark(x, y) > 0.12) continue;
              const m = mass(x, y);
              if (hv > 0.70 * sat(m * 0.9 + 0.1) * (0.50 + 0.80 * h2(bi2, bj, 53))) continue;
              const ci = lampCol(h2(i * 5, j, 88));
              const tw = 0.86 + 0.14 * Math.sin(t * 0.45 + hv * 47.0);
              const al = a * tw * (0.50 + 0.95 * sat(m)) * (0.45 + 0.55 * h2(j, i, 9));
              g.globalAlpha = Math.min(0.92, al);
              lamp(ci, x, y, dotR);
              budget--;
            }
          }
        }
      }

      for (let k = 0; k < LVS && budget > 0; k++) {
        const s = F.sp / (1 << k), spx = s * u;
        if (spx < 8) break;                        /* finer than this: stipple */
        /* THE THREE REGIMES OF A STREET, by how big it is on the glass:
           wide  → a chain of separate lamps (this is what the blow-up sees);
           middling → the lamps do not resolve, so the street is one hairline
                      of light, which is exactly what a real one looks like
                      from up here; narrow → let the stipple field carry it.  */
        const chained = spx > 23;
        /* the lamps along a street have to stand APART on the glass — spaced
           at least a couple of lamp-widths, or a chain becomes a smear and the
           blow-up loses the one thing it is for */
        let sl = s;
        while (sl * u > 9) sl *= 0.5;
        const lampsOn = chained && sl * u > 3.2;
        const bright = (1 - 0.075 * Math.min(k, 6)), rw = s * 0.026;
        const dotR = drOf(sl);
        const surface = spx > 52;          /* only a road you could land on */

        for (let dir = 0; dir < 2; dir++) {
          const lo = dir ? q0 : p0, hi = dir ? q1 : p1, blo = dir ? p0 : q0, bhi = dir ? p1 : q1;
          const n0 = Math.ceil(lo / s), n1 = Math.floor(hi / s);
          if (n1 - n0 > 260) continue;
          for (let n = n0; n <= n1 && budget > 0; n++) {
            const cst = n * s;
            /* not every line of the lattice ever got cut as a street — and the
               deeper the level, the fewer of them did, so the deep weave is a
               street pattern rather than a ruled sheet */
            if (h2(n, dir * 977 + k * 31, 401) > (k < 2 ? 0.99 : k < 5 ? 0.92 : 0.74)) continue;
            /* the road surface, so the weave reads even where lamps are sparse */
            const f = dir
              ? function (u2) { return F.fwd(blo + u2 * (bhi - blo), cst); }
              : function (u2) { return F.fwd(cst, blo + u2 * (bhi - blo)); };
            let seen = false;
            for (let i = 0; i <= 8; i++) { const P = f(i / 8); if (inV(P[0], P[1])) { seen = true; break; } }
            if (!seen) continue;
            if (surface) {
              g.globalCompositeOperation = 'source-over';
              road(g, f, u, a, rw, 'rgba(21,19,18,1)', 0.85 * bright, SMASK);
              g.globalCompositeOperation = 'lighter';
            }
            if (!lampsOn) {                       /* unresolved: one hairline */
              /* a hairline is only ever honest where the lamps genuinely do
                 not resolve. Down in the blow-up they DO, and a continuous
                 ruled line there is the exact thing that turns a city into
                 graph paper — so at depth everything is a discrete lamp. */
              if (spx < 12 || u > 8000) continue;
              g.globalCompositeOperation = 'lighter';
              road(g, f, u, a, 0.7 * px1, 'rgba(255,192,104,1)',
                0.26 * bright * (0.35 + 0.65 * h2(n, dir, 88)) * Math.min(1, (spx - 11) / 9),
                HMASK, 48);
              budget -= 20;
              continue;
            }
            const span = bhi - blo, cnt = Math.min(420, Math.max(2, Math.round(span / sl)));
            for (let i = 0; i <= cnt && budget > 0; i++) {
              const bb = blo + (i + 0.5 * h2(n, i, 7 + k)) / cnt * span;
              const P = dir ? F.fwd(bb, cst) : F.fwd(cst, bb);
              const x = P[0], y = P[1];
              if (!inV(x, y)) continue;
              const w = Math.abs(y - riverY(x)) / riverW(x);
              if (w < 1) continue;                                  /* in the water */
              if ((south && y < riverY(x)) || (!south && y > riverY(x))) continue;
              if (inPark(x, y) > 0.12) continue;
              const m = mass(x, y);
              const hv = h2(n * 131 + i, k * 17 + dir, 55);
              if (hv > 0.04 + 0.96 * m * m) continue;               /* the dark ends */
              const ci = lampCol(h2(n, i * 13 + k, 88));
              const tw = 0.86 + 0.14 * Math.sin(t * 0.55 + hv * 34.0);
              const al = a * bright * tw * (0.80 + 1.15 * m) * (0.55 + 0.45 * h2(i, n, 5));
              g.globalAlpha = Math.min(0.95, al);
              lamp(ci, x, y, dotR);
              budget--;
            }
          }
        }
      }
    }

    /* ── 6 the stipple field: windows, yards, whatever is not a street ── */
    const wpx = FN.sp / (1 << (LV - 1)) * 0.5 / 12 * u;
    const deep = (wpx > 3.6 && wpx < 70) ? 0.36 : 1;
    const OCT = 0.036;
    for (let k = 0; k < 11 && budget > 0; k++) {
      const s = OCT / Math.pow(3, k), spx = s * u;
      if (spx > 34) continue;
      if (spx < 6) break;
      const i0 = Math.floor(V.x0 / s), i1 = Math.ceil(V.x1 / s);
      const j0 = Math.floor(V.y0 / s), j1 = Math.ceil(V.y1 / s);
      if ((i1 - i0) * (j1 - j0) > 45000) continue;
      const dotR = drOf(s);
      for (let i = i0; i <= i1 && budget > 0; i++) {
        for (let j = j0; j <= j1 && budget > 0; j++) {
          const hv = h2(i, j, 3301 + k);
          if (hv > 0.62) continue;                                  /* cheap reject */
          /* per-row and per-column shear, so the lattice never shows itself */
          const x = (i + 0.06 + 0.88 * h2(i, j, 61 + k) + 0.5 * h2(j, k, 71)) * s;
          const y = (j + 0.06 + 0.88 * h2(i, j, 83 + k) + 0.5 * h2(i, k, 97)) * s;
          if (!inV(x, y)) continue;
          if (Math.abs(y - riverY(x)) < riverW(x)) continue;
          const pk = inPark(x, y);
          const m = mass(x, y);
          if (m < 0.055) continue;                    /* open country stays open */
          const F = frameAt(x, y), pq = F.inv(x, y);
          const st = streetness(F, pq, s);
          /* the street term dominates: a lit run must read as a RUN, and the
             inside of a block must stay dark enough to be a block */
          let d = m * (0.035 + 0.965 * st) + m * blockLight(F, pq) * 0.42;
          d *= 0.45 + 0.55 * sat(m * 1.4);            /* the country thins out  */
          if (pk > 0) d *= (pk > 0.25 ? 0.012 : 0.18);  /* lamps on the park path only */
          if (hv > 0.62 * deep * sat(d)) continue;
          const ci = lampCol(h2(i * 7 + k, j, 88));
          const tw = 0.85 + 0.15 * Math.sin(t * 0.5 + hv * 61.0);
          const al = a * tw * (0.46 + 1.10 * sat(d)) * (0.5 + 0.5 * h2(j, i, 9));
          g.globalAlpha = Math.min(0.9, al);
          lamp(ci, x, y, dotR);
          budget--;
        }
      }
    }

    /* ── 7 the big works: ring road, radials, bridges, the anchor street ─ */
    function strung(f, len, sp, tint, bmul, jit, seed, keepDry, floor) {
      let sl = sp; while (sl * u > 20) sl *= 0.5;
      if (sl * u < 3.4) sl = 3.4 / u;
      const cnt = Math.min(600, Math.max(2, Math.round(len / sl)));
      const dotR = drOf(sl);
      const ci0 = tint;
      for (let i = 0; i <= cnt && budget > 0; i++) {
        const P = f(i / cnt), x = P[0] + (h2(seed, i, 3) - 0.5) * jit, y = P[1] + (h2(seed, i, 4) - 0.5) * jit;
        if (!inV(x, y)) continue;
        if (!keepDry && (wet(x, y) || inPark(x, y) > 0.12)) continue;
        const hv = h2(seed, i, 12);
        /* `floor` is what makes a highway a highway: it keeps a thin chain of
           lamps walking off into country that has no city left in it. */
        /* a crossing still belongs to the banks it joins: it keeps its lamps
           over the water, but it dims with the town at either end, so it never
           reads as a bright dash floating clear of the grid */
        const m = keepDry ? Math.max(0.42, sat(mass(x, y) * 1.25)) : Math.max(floor || 0, sat(mass(x, y) * 1.25));
        if (m < 0.05 || hv > 0.10 + 0.95 * m) continue;
        const tw = 0.88 + 0.12 * Math.sin(t * 0.6 + hv * 27.0);
        g.globalAlpha = Math.min(0.95, a * bmul * tw * (0.48 + 0.9 * m) * (0.55 + 0.45 * h2(seed, i, 21)));
        if (SP) g.drawImage(SP[ci0], x - dotR * 1.45, y - dotR * 1.45, dotR * 2.9, dotR * 2.9);
        else { g.fillStyle = 'rgba(' + LAMP[ci0] + ',1)'; g.fillRect(x - dotR, y - dotR, dotR * 2, dotR * 2); }
        budget--;
      }
    }

    /* the ring road, a lobed circuit at the old wall line */
    const ringF = function (s) {
      const th = s * 6.28318;
      const r = 0.268 * (1 + 0.13 * Math.sin(3 * th + 0.6) + 0.07 * Math.sin(5 * th - 1.2));
      return [CORE[0] + Math.cos(th) * r, CORE[1] + Math.sin(th) * r * 0.92];
    };
    g.globalCompositeOperation = 'source-over';
    road(g, ringF, u, a, 0.0022, 'rgba(20,18,17,1)', 0.50, function (x, y) { return sat(mass(x, y) * 1.25); });
    g.globalCompositeOperation = 'lighter';
    strung(ringF, 1.70, 0.0075, 0, 0.56, 0.0016, 71);

    /* radial boulevards leaving the core — three of them keep going as
       highways, a thinning chain of lamps walking off into the dark */
    for (let i = 0; i < 6; i++) {
      const th = i / 6 * 6.28318 + 0.42, bend = (h2(i, 5, 13) - 0.5) * 0.36;
      const f = function (s) {
        const r = s * 0.74, aa = th + bend * s * s;
        return [CORE[0] + Math.cos(aa) * r + 0.02 * Math.sin(s * 5.1 + i), CORE[1] + Math.sin(aa) * r * 0.94];
      };
      g.globalCompositeOperation = 'source-over';
      road(g, f, u, a, 0.0020, 'rgba(19,17,16,1)', 0.48, function (x, y) { return sat(mass(x, y) * 1.25); });
      g.globalCompositeOperation = 'lighter';
      strung(f, 0.74, 0.0060, 0, 0.78, 0.0013, 300 + i, false, (i % 2) ? 0.155 : 0);
    }

    /* four bridges — the lit seams that stitch the two grids together */
    for (let i = 0; i < 4; i++) {
      const bx = BRIDGE[i];
      const by = riverY(bx), w = riverW(bx) * 2.0;
      const f = function (s) { const y = by - w + s * 2 * w; return [bx + Math.sin(s * 3.14159) * 0.006, y]; };
      g.globalCompositeOperation = 'source-over';
      road(g, f, u, a, 0.0028, 'rgba(34,29,25,1)', 0.55, null, 24, true);
      g.globalCompositeOperation = 'lighter';
      strung(f, 2 * w, 0.0055, 2, 0.74, 0.0008, 900 + i, true);
    }

    /* the anchor: one lit street, running out of the core past the park —
       the thing the child plate grows into, drawn as a piece of the picture.
       A shade warmer and a shade brighter than its neighbours, and no more:
       findable, but a street, not a marker. */
    const anF = function (s) {
      const dx = CORE[0] - AN[0], dy = CORE[1] - AN[1], L = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / L, uy = dy / L, o = (s - 0.5) * 0.40;
      return [AN[0] + ux * o + uy * 0.045 * Math.sin(s * 3.0 - 1.5), AN[1] + uy * o - ux * 0.045 * Math.sin(s * 3.0 - 1.5)];
    };
    g.globalCompositeOperation = 'source-over';
    road(g, anF, u, a, 0.0030, 'rgba(30,26,22,1)', 0.62, function (x, y) { return sat(mass(x, y) * 1.25); });
    g.globalCompositeOperation = 'lighter';
    strung(anF, 0.40, 0.0048, 2, 1.30, 0.0010, 61);
    /* the cross street that makes the junction read */
    const anX = function (s) {
      const dx = CORE[0] - AN[0], dy = CORE[1] - AN[1], L = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / L, uy = dy / L, o = (s - 0.5) * 0.16;
      return [AN[0] - uy * o, AN[1] + ux * o];
    };
    g.globalCompositeOperation = 'source-over';
    road(g, anX, u, a, 0.0022, 'rgba(25,22,19,1)', 0.50, function (x, y) { return sat(mass(x, y) * 1.25); });
    g.globalCompositeOperation = 'lighter';
    strung(anX, 0.16, 0.0058, 0, 0.95, 0.0009, 62);

    /* ── 8 the park's one lit thing: a pavilion and the walk that reaches it,
       so the dark shape reads as a PARK and not as a hole in the plate ── */
    {
      const P = PARKS[0], c = Math.cos(P[4]), s = Math.sin(P[4]);
      const walk = function (q) {
        const ux = (-0.52 + 1.04 * q) * P[2] * P[3], uy = Math.sin(q * 3.4 - 0.8) * P[2] * 0.30 / P[3];
        return [P[0] + c * ux - s * uy, P[1] + s * ux + c * uy];
      };
      g.globalCompositeOperation = 'lighter';
      strung(walk, 0.20, 0.0135, 3, 0.34, 0.0016, 555, true);
      const pv = walk(0.56);
      const gp = g.createRadialGradient(pv[0], pv[1], 0, pv[0], pv[1], 0.020);
      gp.addColorStop(0, 'rgba(255,222,158,' + (0.30 * a) + ')');
      gp.addColorStop(1, 'rgba(255,222,158,0)');
      g.globalAlpha = 1; g.fillStyle = gp;
      g.beginPath(); g.arc(pv[0], pv[1], 0.020, 0, 6.28318); g.fill();
      g.globalAlpha = Math.min(0.95, a * 0.85);
      lamp(3, pv[0], pv[1], drOf(0.010));
    }

    /* ── 9 the water takes the light back: bank lamps + their reflections ─ */
    for (let i = 0; i < 190 && budget > 0; i++) {
      const x = -0.50 + (i + 0.5) / 190 * 1.00 + (h2(i, 2, 15) - 0.5) * 0.010;
      const m = mass(x, riverY(x));
      const sgn = h2(i, 7, 15) > 0.5 ? 1 : -1;
      if (h2(i, 3, 16) > 0.10 + 0.90 * m) continue;
      const y = riverY(x) + sgn * bankW(x, -sgn) * (1.05 + 0.09 * h2(i, 8, 15));
      if (!inV(x, y)) continue;
      const dr = drOf(0.006);
      g.globalAlpha = Math.min(0.92, a * (0.42 + 0.55 * m));
      lamp(0, x, y, dr);
      budget--;
      /* its reflection: a broken column of light lying on moving water. Only
         about half of the bank lamps throw one, and never the same length,
         or the river grows a comb of teeth instead of a surface. */
      if (h2(i, 4, 15) > 0.56) continue;
      const nrf = 3 + Math.floor(h2(i, 5, 15) * 8);
      for (let r2 = 1; r2 <= nrf && budget > 0; r2++) {
        const f2 = r2 / nrf;
        const yy = y - sgn * riverW(x) * f2 * (1.3 + 1.2 * h2(i, 6, 15));
        if (!inV(x, yy) || !wet(x, yy)) continue;
        const wob = (still ? 0 : Math.sin(t * 0.42 + r2 * 1.7 + i) * 0.0018) + (h2(i, r2, 25) - 0.5) * 0.0022;
        g.globalAlpha = Math.min(0.40, a * (0.20 + 0.30 * m) * (1 - f2 * 0.8) * (0.3 + 0.7 * h2(i, r2, 19)));
        g.fillStyle = 'rgba(255,206,126,1)';
        g.fillRect(x + wob - dr * 0.9, yy - dr * 0.45, dr * 1.8, dr * 0.9);
        budget--;
      }
    }

    /* ── 10 the city is awake: traffic on the boulevards, two aircraft. All
       of it is switched off at depth, where a moving point in a field of
       one-pixel lamps would read as jitter and nothing else. ──────────── */
    if (!still) {
      for (let i = 0; i < 14; i++) {
        const th = (i % 6) / 6 * 6.28318 + 0.42, bend = (h2(i % 6, 5, 13) - 0.5) * 0.36;
        const ph = (t * 0.0090 * (0.7 + 0.6 * h2(i, 1, 23)) + h2(i, 2, 23)) % 1;
        const s = i % 2 ? ph : 1 - ph, r = s * 0.74, aa = th + bend * s * s;
        const x = CORE[0] + Math.cos(aa) * r + 0.02 * Math.sin(s * 5.1 + (i % 6));
        const y = CORE[1] + Math.sin(aa) * r * 0.94;
        if (!inV(x, y)) continue;
        if (mass(x, y) < 0.14) continue;         /* no headlights in open country */
        const dr = Math.max(0.6 * px1, 0.0018);
        /* a car runs off the end of its boulevard and starts again at the core.
           Faded to nothing at both ends, that reset is invisible; left hard, it
           is a light jumping across the plate, which is worse than no motion. */
        g.globalAlpha = Math.min(0.85, a * 0.62 * Math.sin(s * 3.14159));
        g.fillStyle = i % 3 ? 'rgba(255,232,190,1)' : 'rgba(255,150,110,1)';
        g.fillRect(x - dr, y - dr, dr * 2, dr * 2);
      }
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.0060 + i * 0.5) % 1;
        const x = -0.36 + ph * 0.72, y = (i ? -0.28 : 0.20) + Math.sin(ph * 2.1 + i) * 0.05;
        if (inV(x, y)) {
          const dr = Math.max(0.7 * px1, 0.0020);
          const blink = (Math.sin(t * 2.3 + i * 2) > 0.55) ? 1 : 0.12;
          g.globalAlpha = Math.min(0.7, a * 0.6 * blink);
          g.fillStyle = 'rgba(255,168,132,1)';
          g.fillRect(x - dr, y - dr, dr * 2, dr * 2);
        }
      }
    }

    /* ── 11 the air itself: a breath of haze over the far side ─────────── */
    g.globalCompositeOperation = 'source-over';
    if (lod > 0.01) {
      const hz = g.createLinearGradient(0, -0.5, 0.16, 0.5);
      hz.addColorStop(0, 'rgba(116,132,156,' + (0.045 * a * lod) + ')');
      hz.addColorStop(0.55 + 0.04 * Math.sin(t * 0.05), 'rgba(116,132,156,' + (0.012 * a * lod) + ')');
      hz.addColorStop(1, 'rgba(116,132,156,0)');
      g.globalAlpha = 1; g.fillStyle = hz; g.fillRect(-0.5, -0.5, 1, 1);
    }

    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.restore();
  };
})();

/* ═══ 5  THE COAST AT NIGHT ═══════════════════════════════════════════════ */
PlateArt.coast = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(67);
  g.fillStyle = `rgba(8,14,26,${0.62 * a})`; g.fillRect(-0.5, -0.5, 1, 1);   // the sea
  /* the land, a torn edge running corner to corner, with the lit towns strung
     along it like beads on a wire — which is exactly what a coast looks like
     from up here at night. */
  const edge = [];
  for (let i = 0; i <= 40; i++) {
    const q = i / 40;
    edge.push([-0.52 + q * 1.04, -0.30 + q * 0.55 + Math.sin(q * 9.1) * 0.045 + (r() - 0.5) * 0.03]);
  }
  g.beginPath(); g.moveTo(edge[0][0], edge[0][1]);
  for (const [x, y] of edge) g.lineTo(x, y);
  g.lineTo(0.52, -0.52); g.lineTo(-0.52, -0.52); g.closePath();
  g.fillStyle = `rgba(22,26,26,${0.72 * a})`; g.fill();
  tfStroke(g, `rgba(150,180,200,${0.16 * a})`, 0.0035); g.stroke();
  for (let i = 2; i < edge.length - 2; i += 2) {                 // the towns
    if (r() > 0.62) continue;
    const [x, y] = edge[i], s = 0.02 + Math.pow(r(), 2) * 0.055;
    const gl = g.createRadialGradient(x, y - 0.02, 0, x, y - 0.02, s * 3);
    gl.addColorStop(0, `rgba(255,206,132,${0.46 * a})`); gl.addColorStop(1, 'rgba(255,206,132,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y - 0.02, s * 3, 0, 6.283); g.fill();
  }
  tfStroke(g, `rgba(120,160,200,${0.10 * a})`, 0.0028);          // swell on the water
  for (let i = 0; i < 14; i++) {
    const y = 0.06 + i * 0.032;
    g.beginPath(); g.moveTo(-0.5, y);
    g.bezierCurveTo(-0.15, y + 0.012, 0.15, y - 0.012, 0.5, y + 0.006); g.stroke();
  }
  grain(g, u, a, 67, 'rgba(170,190,214,1)', 0.30, false);
  smudge(g, anchor, 0.040, '255,214,150', a * 0.9, 67);
  g.restore();
};

/* ═══ 7  THE BLUE EARTH ═══════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════════
   PLATE 10^7 — THE BLUE EARTH, as a white-line engraving.

   Take 2. The conceit: this is not a photograph of a planet, it is a plate cut
   by a burin. Every tone on the ball is carried by HATCH RUN ALONG THE
   PARALLELS — the engraver's trick for making a sphere read as a sphere — and
   the hatch is authored in OCTAVES of line spacing, of which only the ones
   currently landing in a legible pixel band are cut. Blow the plate up a
   hundredfold and the coarse rulings walk out of the band while a finer set
   walks in: the engraving stays an engraving all the way down.

   The globe is a real model, not a picture of one. A sun vector fixes a soft
   terminator; the ocean brightens over the shelves toward the coasts; the
   continents are blob fields warped by fixed-octave noise (so the coastline
   never shimmers under zoom), and ONE of them has its radius solved at draw
   time so its coast passes exactly through the anchor. The cyclones are
   logarithmic spirals with the correct sense for their hemisphere, and their
   arms exist as an analytic FIELD, so the stipple that fills them curls the
   right way at every magnification.

   Ink on near-black; the marks are light, the paper is night.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var R = 0.42;                                   /* the ball, in unit space   */
  var SUN = norm3(0.76, 0.60, 0.25);              /* low sun, lower-right      */
  var POLE = norm3(0.23, -0.91, 0.34);            /* north pole, tilted        */

  /* ── vector kit ───────────────────────────────────────────────────────── */
  function norm3(x, y, z) { var m = Math.sqrt(x * x + y * y + z * z); return [x / m, y / m, z / m]; }
  function dot3(a, bx, by, bz) { return a[0] * bx + a[1] * by + a[2] * bz; }
  function cross3(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /* ── hashed value noise, 3D. The only randomness in the plate; it is a pure
        function of position, so nothing shimmers when the frame moves. ────── */
  function h3(i, j, k) {
    var n = (i * 374761393 + j * 668265263 + k * 1274126177) | 0;
    n = (n ^ (n >>> 13)) | 0; n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function sm(t) { return t * t * (3 - 2 * t); }
  function val3(x, y, z) {
    var i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    var u = sm(x - i), v = sm(y - j), w = sm(z - k);
    var c000 = h3(i, j, k), c100 = h3(i + 1, j, k), c010 = h3(i, j + 1, k), c110 = h3(i + 1, j + 1, k);
    var c001 = h3(i, j, k + 1), c101 = h3(i + 1, j, k + 1), c011 = h3(i, j + 1, k + 1), c111 = h3(i + 1, j + 1, k + 1);
    var x00 = c000 + (c100 - c000) * u, x10 = c010 + (c110 - c010) * u;
    var x01 = c001 + (c101 - c001) * u, x11 = c011 + (c111 - c011) * u;
    var y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
  }
  /* a BAND-LIMITED fractal: five octaves centred on the octave the eye can
     currently resolve, cosine-tapered at both ends so that zooming fades a
     coarse octave out exactly as a finer one fades in. This is what makes the
     cloud texture scale-free rather than merely detailed. */
  function band(x, y, z, f0) {
    var s = 0, tot = 0;
    for (var o = -2; o <= 2; o++) {
      var w = Math.cos(o * 0.7854); w *= w;
      var f = f0 * Math.pow(2, o);
      s += w * val3(x * f + o * 17.3, y * f - o * 9.1, z * f + o * 4.7); tot += w;
    }
    return s / tot;
  }
  function fixedFbm(x, y, z, f0, oct) {
    var s = 0, amp = 1, tot = 0, f = f0;
    for (var o = 0; o < oct; o++) {
      s += amp * val3(x * f + o * 31.7, y * f + o * 12.3, z * f - o * 22.9);
      tot += amp; amp *= 0.52; f *= 2.07;
    }
    return s / tot;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function step(v, e0, e1) { return sm(clamp((v - e0) / (e1 - e0), 0, 1)); }

  /* ── the scene: continents, storms, the pole frame. Solved once per anchor
        and cached, because the anchor is the only thing that varies. ──────── */
  var SETUP = null;
  function setup(anchor) {
    var key = anchor ? (anchor[0] + ',' + anchor[1]) : 'none';
    if (SETUP && SETUP.key === key) return SETUP;

    var help = Math.abs(POLE[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    var E1 = norm3.apply(null, cross3(POLE, help));
    var E2 = cross3(POLE, E1);

    /* a screen point (sx,sy) on the near face -> its surface direction */
    function dirAt(sx, sy) {
      var r2 = sx * sx + sy * sy, z = Math.sqrt(Math.max(1e-6, R * R - r2));
      return norm3(sx, sy, z);
    }

    /* CONTINENTS. Each is a cap of angular radius r0 whose edge is warped by
       fixed-octave noise, so the coast is torn at a fixed set of scales and
       never crawls when the frame zooms. */
    var C = [
      { d: dirAt(0.275, 0.075), r0: 0.50, w: 0.34 },  /* the great day-side land */
      { d: dirAt(0.075, 0.335), r0: 0.26, w: 0.42 },  /* a southern mass         */
      { d: dirAt(-0.325, 0.115), r0: 0.16, w: 0.54 }, /* an island arc at the limb */
      { d: dirAt(-0.055, -0.335), r0: 0.40, w: 0.38 } /* THE night land: solved below */
    ];
    if (anchor) {
      var A = dirAt(anchor[0], anchor[1]);
      var c = C[3];
      var ang = Math.acos(clamp(dot3(c.d, A[0], A[1], A[2]), -1, 1));
      var wn = coastWarp(A[0], A[1], A[2], c.w);
      c.r0 = ang / Math.max(0.2, 1 + wn);           /* its coast crosses the anchor */
      SETUP_ANCHOR_DIR = A;
    } else { SETUP_ANCHOR_DIR = null; }

    /* CYCLONES. Placed by where they should sit in the frame; sense is set by
       hemisphere (anticlockwise north of the equator, clockwise south) because
       that is the one thing about a storm everybody's eye already knows. */
    /* Six of them, and BIG: a storm that does not read as an event at plate
       scale is only texture. Four sit squarely on the lit hemisphere where they
       can actually be seen, and the tropics carry two of their own. */
    var st = [
      { p: dirAt(0.150, -0.215), r: 0.270, b: 0.32, arms: 2, eye: 0.095, str: 1.30 },
      { p: dirAt(0.215, 0.145), r: 0.205, b: 0.27, arms: 2, eye: 0.150, str: 1.34 },
      { p: dirAt(0.330, 0.255), r: 0.130, b: 0.24, arms: 2, eye: 0.115, str: 0.96 },
      { p: dirAt(-0.125, 0.070), r: 0.140, b: 0.33, arms: 3, eye: 0.065, str: 0.74 },
      { p: dirAt(0.320, -0.075), r: 0.165, b: 0.30, arms: 2, eye: 0.105, str: 1.10 },
      { p: dirAt(0.055, 0.300), r: 0.150, b: 0.29, arms: 2, eye: 0.120, str: 0.92 }
    ];
    for (var i = 0; i < st.length; i++) {
      var s = st[i];
      var lat = Math.asin(clamp(dot3(POLE, s.p[0], s.p[1], s.p[2]), -1, 1));
      s.sense = lat >= 0 ? 1 : -1;
      var hp = Math.abs(dot3(s.p, 0, 0, 1)) > 0.9 ? [1, 0, 0] : [0, 0, 1];
      s.e1 = norm3.apply(null, cross3(s.p, hp));
      s.e2 = cross3(s.p, s.e1);
      s.cosOut = Math.cos(s.r * 2.6);
    }

    SETUP = { key: key, E1: E1, E2: E2, C: C, st: st, A: SETUP_ANCHOR_DIR };
    return SETUP;
  }
  var SETUP_ANCHOR_DIR = null;

  /* the coast's warp. The last term is sampled on a STRETCHED lattice, which is
     what stops the continents coming out as amoebas: real land is drawn out
     along its rifts, not lobed. */
  function coastWarp(x, y, z, amp) {
    return amp * (fixedFbm(x, y, z, 2.3, 4) - 0.5) * 2 * 0.44
      + amp * 0.30 * (val3(x * 7.1 + 3, y * 7.1, z * 7.1) - 0.5) * 2
      + amp * 0.17 * (val3(x * 15.7 + 8, y * 15.7, z * 15.7) - 0.5) * 2
      + amp * 0.42 * (val3(x * 3.9 + 11, y * 12.4, z * 3.9) - 0.5) * 2;
  }
  /* signed land field: > 0 on land, < 0 at sea, ~0 exactly on the coast */
  function landAt(x, y, z, S) {
    var wn = coastWarp(x, y, z, 1);
    var best = -9;
    for (var i = 0; i < S.C.length; i++) {
      var c = S.C[i];
      var rr = c.r0 * (1 + c.w * wn);
      var v = (Math.cos(Math.max(0.02, rr)) - dot3(c.d, x, y, z)) * -1;
      /* v>0 inside the cap; normalise by the cap's own scale so the shelf
         gradient reads the same on a big continent and a small island */
      best = Math.max(best, v / Math.max(0.02, 1 - Math.cos(rr)));
    }
    return best;
  }

  /* the storm field: an analytic logarithmic spiral, so the stipple inside a
     cyclone curls with the arms no matter how far in you go */
  function stormAt(x, y, z, S, drift) {
    var v = 0;
    for (var i = 0; i < S.st.length; i++) {
      var s = S.st[i];
      var cd = dot3(s.p, x, y, z);
      if (cd < s.cosOut) continue;
      var d = Math.acos(clamp(cd, -1, 1));
      if (d < 1e-5) continue;
      var th = Math.atan2(dot3(s.e2, x, y, z), dot3(s.e1, x, y, z)) + SPIN * s.sense;
      var ph = s.sense * th - Math.log(d / s.r) / s.b;
      var arm = 0.5 + 0.5 * Math.cos(s.arms * ph);
      var env = step(d, s.r * s.eye * 0.55, s.r * s.eye * 1.5) * (1 - step(d, s.r * 1.0, s.r * 2.4));
      v += s.str * env * Math.pow(arm, 1.7) * (0.55 + 0.45 * step(d, s.r * 1.7, s.r * 0.35));
    }
    return v;
  }

  /* the whole cloud deck: zonal bands + the storms + band-limited detail */
  function cloudAt(x, y, z, S, f0, drift) {
    /* rotate the sample backwards about the pole: the deck drifts, the ground
       does not — which is exactly the relationship a real sky has to a real
       coast */
    var c = Math.cos(-drift), s = Math.sin(-drift);
    var px = POLE[0], py = POLE[1], pz = POLE[2];
    var d = px * x + py * y + pz * z;
    var rx = x * c + (py * z - pz * y) * s + px * d * (1 - c);
    var ry = y * c + (pz * x - px * z) * s + py * d * (1 - c);
    var rz = z * c + (px * y - py * x) * s + pz * d * (1 - c);

    var lat = Math.asin(clamp(d, -1, 1));
    /* the ITCZ, the two subtropical clear belts, the mid-latitude storm track */
    var zon = 0.50 * Math.exp(-Math.pow((lat - 0.06) / 0.17, 2))
      + 0.40 * Math.exp(-Math.pow((Math.abs(lat) - 0.85) / 0.30, 2))
      - 0.17 * Math.exp(-Math.pow((Math.abs(lat) - 0.44) / 0.21, 2));
    var wob = (fixedFbm(rx, ry, rz, 3.1, 3) - 0.5) * 0.62;
    var base = zon + wob + 0.17;
    var storm = stormAt(rx, ry, rz, S, drift);
    var det = (band(rx, ry, rz, f0) - 0.48) * 1.35;
    return clamp(base * 0.9 + storm * 1.15 + det * (0.42 + 0.55 * clamp(base + storm, 0, 1)), 0, 1.35);
  }

  /* ── the tone model: what colour of ink, and how much of it, at a point ── */
  var TINT = [
    [62, 110, 176],   /* 0 deep ocean — the plate is called the BLUE Earth  */
    [104, 162, 214],  /* 1 shelf water, brighter and bluer over the shelves */
    [150, 148, 96],   /* 2 land, olive                    */
    [156, 112, 68],   /* 3 land, umber                    */
    [233, 224, 202],  /* 4 cloud, parchment               */
    [242, 209, 150]   /* 5 twilight / glint, warm gold    */
  ];
  function shade(sx, sy, S, f0, drift, out) {
    var r2 = sx * sx + sy * sy;
    if (r2 >= R * R) return false;
    var z = Math.sqrt(R * R - r2);
    var nx = sx / R, ny = sy / R, nz = z / R;
    var lam = nx * SUN[0] + ny * SUN[1] + nz * SUN[2];
    /* THE SOFT TERMINATOR. A planet with air does not have an edge: the light
       runs a long way past the geometric line, so the ramp is wide and gamma'd
       rather than a step. */
    var day = Math.pow(step(lam, -0.36, 0.40), 0.82);
    /* LIMB DARKENING, in the tone field rather than as an overlaid wash — the
       ruling itself must thin toward the edge, which is what gives the ball its
       volume without turning the plate back into a shaded sphere. */
    var limb = 0.26 + 0.74 * Math.pow(clamp(nz, 0, 1), 0.62);
    var ld = landAt(nx, ny, nz, S);
    var cl = cloudAt(nx, ny, nz, S, f0, drift);
    var isLand = ld > 0;
    var tone, fam;
    if (isLand) {
      var arid = fixedFbm(nx + 9, ny, nz, 1.9, 3);
      fam = arid > 0.52 ? 3 : 2;
      /* the ranges: ridged noise, cubed, so only the crests take the ink */
      var rg = 1 - Math.abs(2 * val3(nx * 9.3 + 5, ny * 9.3, nz * 9.3) - 1);
      tone = 0.50 + 0.24 * arid + 0.16 * step(ld, 0.0, 0.30)
        + 0.26 * rg * rg * rg + 0.16 * (band(nx, ny, nz, f0 * 1.3) - 0.5);
    } else {
      var shelf = 1 - step(-ld, 0.0, 0.42);          /* 1 at the coast, 0 abyss */
      fam = shelf > 0.42 ? 1 : 0;
      var dep = fixedFbm(nx + 4, ny + 2, nz, 1.7, 3);   /* basins and rises */
      /* THE OCEAN'S GRAIN, at two scale-free octaves: the coarse one gives the
         water its slow mottle, the fine one its tooth. Both follow the eye. */
      tone = 0.175 + 0.34 * shelf + 0.13 * dep
        + 0.34 * (band(nx, ny, nz, f0 * 1.7) - 0.5)
        + 0.20 * (band(nx + 6, ny - 3, nz + 2, f0 * 0.40) - 0.5);
      /* the glint: the ocean throws the low sun straight back at you */
      tone += 0.62 * Math.pow(clamp(lam, 0, 1), 7) * (1 - clamp(cl, 0, 1));
    }
    var cw = clamp((cl - 0.42) / 0.44, 0, 1);
    if (cw > 0.02) {
      var ct = 0.56 + 0.52 * cw;
      tone = tone * (1 - cw) + ct * cw;
      if (cw > 0.30) fam = 4;
    }
    /* cloud on the dark side is not parchment — it is a cold grey seen by
       earthshine, and it must never out-shout the towns on the coast */
    if (fam === 4 && day < 0.30) fam = 1;
    /* the night keeps a trace of ink — earthshine, and the ghost of the rulings
       carrying the ball's form right around into the dark. A globe that simply
       stops at the terminator reads as a crescent, not a world. */
    tone *= limb * (0.055 + 0.945 * day);
    tone += 0.022 * cw * (1 - day) * limb;           /* cloud by earthshine */
    /* the terminator's own colour: a thin dusk of gold before the ink closes */
    var dusk = Math.exp(-Math.pow(lam / 0.17, 2));
    if (dusk > 0.05) { if (dusk > 0.50 && fam !== 4) fam = 5; tone *= 1 + 0.45 * dusk; }
    out[0] = fam; out[1] = tone; out[2] = day; out[3] = ld; out[4] = cl;
    return true;
  }

  /* ── what part of the plate is actually on screen ──────────────────────── */
  function viewBox(g, u) {
    var W = (g.canvas && g.canvas.width) || 1200, H = (g.canvas && g.canvas.height) || 760;
    var m = null;
    try { m = g.getTransform ? g.getTransform() : null; } catch (e) { m = null; }
    if (!m || !m.a) return { x0: -R, y0: -R, x1: R, y1: R, full: true };
    var det = m.a * m.d - m.b * m.c;
    if (!det) return { x0: -R, y0: -R, x1: R, y1: R, full: true };
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < 4; i++) {
      var px = (i & 1) ? W : 0, py = (i & 2) ? H : 0;
      var dx = px - m.e, dy = py - m.f;
      var ux = (dx * m.d - dy * m.c) / det, uy = (-dx * m.b + dy * m.a) / det;
      if (ux < x0) x0 = ux; if (ux > x1) x1 = ux;
      if (uy < y0) y0 = uy; if (uy > y1) y1 = uy;
    }
    var full = (x0 <= -R && x1 >= R && y0 <= -R && y1 >= R);
    return {
      x0: Math.max(x0, -R), y0: Math.max(y0, -R),
      x1: Math.min(x1, R), y1: Math.min(y1, R), full: full
    };
  }
  /* the latitude / longitude window the view covers, so the fine rulings are
     only cut where they can be seen */
  function latLonWindow(V, S) {
    if (V.full) return { la0: -1.45, la1: 1.45, lo0: -Math.PI, lo1: Math.PI, wrap: true };
    var la0 = 9, la1 = -9, cx = 0, cy = 0, n = 0, ls = [];
    for (var i = 0; i <= 4; i++) for (var j = 0; j <= 4; j++) {
      var x = V.x0 + (V.x1 - V.x0) * i / 4, y = V.y0 + (V.y1 - V.y0) * j / 4;
      var d = Math.sqrt(x * x + y * y);
      if (d > R * 0.9985) { var k = R * 0.9985 / d; x *= k; y *= k; }
      var z = Math.sqrt(Math.max(1e-9, R * R - x * x - y * y));
      var nx = x / R, ny = y / R, nz = z / R;
      var la = Math.asin(clamp(dot3(POLE, nx, ny, nz), -1, 1));
      var lo = Math.atan2(dot3(S.E2, nx, ny, nz), dot3(S.E1, nx, ny, nz));
      if (la < la0) la0 = la; if (la > la1) la1 = la;
      cx += Math.cos(lo); cy += Math.sin(lo); ls.push(lo); n++;
    }
    var mid = Math.atan2(cy, cx), sp = 0;
    for (var q = 0; q < ls.length; q++) {
      var dd = Math.atan2(Math.sin(ls[q] - mid), Math.cos(ls[q] - mid));
      if (Math.abs(dd) > sp) sp = Math.abs(dd);
    }
    if (sp > 1.1 || la1 - la0 > 2.2) return { la0: -1.45, la1: 1.45, lo0: -Math.PI, lo1: Math.PI, wrap: true };
    return { la0: la0 - 0.10, la1: la1 + 0.10, lo0: mid - sp - 0.14, lo1: mid + sp + 0.14, wrap: false };
  }

  /* ── THE BURIN: hatch along the parallels, cut in octaves of spacing ───── */
  var HATCH = [0.112, 0.028, 0.007, 0.00175, 4.375e-4, 1.094e-4, 2.734e-5, 6.836e-6, 1.709e-6];
  var TONE_STEPS = 7;
  /* Deep in a decade gap the plate is handed a low presence on purpose — but
     the MARKS must not thin out with it, or the traveller crosses a blank. So
     the ink is given back some weight as the magnification climbs. */
  var ZG = 1;
  /* the cyclones turn on their own clock, a good deal faster than the deck
     drifts — a storm that turns too slowly to see is a still picture of one */
  var SPIN = 0;

  function cutParallels(g, u, a, S, V, W, f0, drift, sp, wgt) {
    var buckets = {}, o = [0, 0, 0, 0, 0];
    var dLat = sp / R;
    var la0 = Math.ceil(W.la0 / dLat) * dLat;
    var nLat = Math.floor((W.la1 - la0) / dLat);
    if (nLat > 190) { dLat *= Math.ceil(nLat / 190); la0 = Math.ceil(W.la0 / dLat) * dLat; nLat = Math.floor((W.la1 - la0) / dLat); }
    var E1 = S.E1, E2 = S.E2;
    for (var li = 0; li <= nLat; li++) {
      var la = la0 + li * dLat;
      if (la < -1.5 || la > 1.5) continue;
      var cl = Math.cos(la), sl = Math.sin(la);
      /* the rulings crowd together toward the pole; thin them there — and above
         ~68 degrees stop cutting them ALTOGETHER and let the stipple carry the
         tone, because no amount of thinning beats the convergence into moiré */
      var polar = (0.22 + 0.78 * Math.pow(Math.max(0, cl), 1.15))
        * (1 - step(Math.abs(la), 1.14, 1.40));
      if (polar < 0.02) continue;
      var arc = Math.max(0.04, R * cl);
      var dLon = clamp(2.6 / (u * arc), 0.0018, 0.11);
      var span = W.lo1 - W.lo0;
      var nLon = Math.min(520, Math.max(6, Math.ceil(span / dLon)));
      dLon = span / nLon;
      var px = 0, py = 0, have = false;
      for (var q = 0; q <= nLon; q++) {
        var lo = W.lo0 + q * dLon;
        var co = Math.cos(lo), so = Math.sin(lo);
        var nx = POLE[0] * sl + (E1[0] * co + E2[0] * so) * cl;
        var ny = POLE[1] * sl + (E1[1] * co + E2[1] * so) * cl;
        var nz = POLE[2] * sl + (E1[2] * co + E2[2] * so) * cl;
        if (nz <= 0.012) { have = false; continue; }
        var x = nx * R, y = ny * R;
        if (x < V.x0 - 0.02 || x > V.x1 + 0.02 || y < V.y0 - 0.02 || y > V.y1 + 0.02) { have = false; continue; }
        if (!shade(x, y, S, f0, drift, o)) { have = false; continue; }
        if (have) {
          var tn = clamp(o[1] * wgt * polar, 0, 1);
          var lvl = Math.round(tn * TONE_STEPS);
          if (lvl > 0) {
            var k = o[0] * 8 + lvl;
            var arr = buckets[k] || (buckets[k] = []);
            arr.push(px, py, x, y);
          }
        }
        px = x; py = y; have = true;
      }
    }
    strokeBuckets(g, buckets, a, u, sp);
  }

  function cutMeridians(g, u, a, S, V, W, f0, drift, sp, wgt) {
    /* a sparse cross-hatch, only in the brightest quarter — the engraver adds
       the second set of rulings where the light is strongest */
    var buckets = {}, o = [0, 0, 0, 0, 0];
    var dLon = sp / R;
    var lo0 = Math.ceil(W.lo0 / dLon) * dLon;
    var nLon = Math.floor((W.lo1 - lo0) / dLon);
    if (nLon > 150) { dLon *= Math.ceil(nLon / 150); lo0 = Math.ceil(W.lo0 / dLon) * dLon; nLon = Math.floor((W.lo1 - lo0) / dLon); }
    var E1 = S.E1, E2 = S.E2;
    for (var mi = 0; mi <= nLon; mi++) {
      var lo = lo0 + mi * dLon;
      var co = Math.cos(lo), so = Math.sin(lo);
      var dLat = clamp(2.6 / (u * R), 0.0018, 0.10);
      var span = W.la1 - W.la0;
      var nLat = Math.min(420, Math.max(6, Math.ceil(span / dLat)));
      dLat = span / nLat;
      var px = 0, py = 0, have = false;
      for (var q = 0; q <= nLat; q++) {
        var la = W.la0 + q * dLat;
        if (la < -1.5 || la > 1.5) { have = false; continue; }
        var cl = Math.cos(la), sl = Math.sin(la);
        var nx = POLE[0] * sl + (E1[0] * co + E2[0] * so) * cl;
        var ny = POLE[1] * sl + (E1[1] * co + E2[1] * so) * cl;
        var nz = POLE[2] * sl + (E1[2] * co + E2[2] * so) * cl;
        if (nz <= 0.012) { have = false; continue; }
        var x = nx * R, y = ny * R;
        if (x < V.x0 - 0.02 || x > V.x1 + 0.02 || y < V.y0 - 0.02 || y > V.y1 + 0.02) { have = false; continue; }
        if (!shade(x, y, S, f0, drift, o)) { have = false; continue; }
        if (have && o[2] > 0.55) {
          var tn = clamp((o[1] - 0.30) * wgt, 0, 1);
          var lvl = Math.round(tn * TONE_STEPS);
          if (lvl > 0) {
            var k = o[0] * 8 + lvl;
            var arr = buckets[k] || (buckets[k] = []);
            arr.push(px, py, x, y);
          }
        }
        px = x; py = y; have = true;
      }
    }
    strokeBuckets(g, buckets, a, u, sp);
  }

  function strokeBuckets(g, buckets, a, u, sp) {
    var lw = clamp(0.95 / u, 1e-7, sp * 0.42);
    g.lineCap = 'butt'; g.lineJoin = 'round'; g.lineWidth = lw;
    for (var k in buckets) {
      var seg = buckets[k], fam = (k / 8) | 0, lvl = k % 8;
      /* the tone steps are gamma'd, not linear: a burin's lightest cut is still
         a cut, and a linear ramp loses the whole bottom of the scale */
      var c = TINT[fam], al = Math.min(0.98, a * ZG * Math.pow(lvl / TONE_STEPS, 0.62) * 0.86);
      if (al < 0.006) continue;
      g.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al.toFixed(3) + ')';
      g.beginPath();
      for (var i = 0; i < seg.length; i += 4) { g.moveTo(seg[i], seg[i + 1]); g.lineTo(seg[i + 2], seg[i + 3]); }
      g.stroke();
    }
  }

  /* ── THE STIPPLE: the same tone model, punched as dots, on a jittered
        lattice whose cell is chosen so the dots always land in a legible
        pixel band. This is what carries the plate through a decade gap. ──── */
  function stipple(g, u, a, S, V, f0, drift) {
    for (var oc = 0; oc < 14; oc++) {
      var s = 0.155 / Math.pow(3.5, oc);
      var px = s * u;
      if (px < 3.2) break;
      if (px > 62) continue;
      var oGain = px > 26 ? 0.62 : 1.0;              /* the coarse mottle, softly */
      var i0 = Math.floor(V.x0 / s), i1 = Math.ceil(V.x1 / s);
      var j0 = Math.floor(V.y0 / s), j1 = Math.ceil(V.y1 / s);
      var cells = (i1 - i0 + 1) * (j1 - j0 + 1);
      var keep = cells > 46000 ? 46000 / cells : 1;
      var dr = clamp(px * 0.30, 0.85, 2.4) / u;
      var o = [0, 0, 0, 0, 0];
      var byKey = {};
      for (var i = i0; i <= i1; i++) {
        for (var j = j0; j <= j1; j++) {
          var r1 = h3(i, j, oc * 7 + 3);
          if (r1 > keep) continue;
          var x = (i + h3(i, j, oc * 7 + 11)) * s, y = (j + h3(i, j, oc * 7 + 19)) * s;
          if (x * x + y * y >= R * R * 0.9994) continue;
          if (!shade(x, y, S, f0, drift, o)) continue;
          /* SUBTRACTION over open water. The mid-latitudes were reading as
             soil because every cell of open sea got punched; let large
             stretches of ocean stand as clean ruling and nothing else. */
          if (o[3] <= 0 && o[4] < 0.44 && h3(i, j, oc * 7 + 41) > 0.32) continue;
          /* the night hemisphere is INK AND GOLD ONLY: the cloud stipple is
             weighted by the light, so no white snow falls on the dark side and
             the terminator gets its read back */
          var illum = 0.10 + 0.90 * o[2];
          if (o[0] === 4) illum *= o[2];
          var b = 0.45 + 0.55 * h3(i, j, oc * 7 + 29);
          var tn = clamp(o[1] * 1.30 * b * illum, 0, 1);
          var lvl = Math.round(tn * TONE_STEPS);
          if (lvl <= 0) continue;
          var k = o[0] * 8 + lvl;
          var arr = byKey[k] || (byKey[k] = []);
          arr.push(x, y, dr * (0.7 + 0.6 * b));
        }
      }
      for (var kk in byKey) {
        var arr2 = byKey[kk], fam = (kk / 8) | 0, lv = kk % 8;
        var c = TINT[fam], al = Math.min(0.95, a * ZG * oGain * Math.pow(lv / TONE_STEPS, 0.62) * 0.60);
        if (al < 0.005) continue;
        g.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al.toFixed(3) + ')';
        if (px > 5.5) {
          g.beginPath();
          for (var q = 0; q < arr2.length; q += 3) {
            g.moveTo(arr2[q] + arr2[q + 2], arr2[q + 1]);
            g.arc(arr2[q], arr2[q + 1], arr2[q + 2], 0, 6.283);
          }
          g.fill();
        } else {
          for (var q2 = 0; q2 < arr2.length; q2 += 3) {
            g.fillRect(arr2[q2], arr2[q2 + 1], arr2[q2 + 2] * 1.6, arr2[q2 + 2] * 1.6);
          }
        }
      }
    }
  }

  /* ── THE COMB OF THE CURRENTS ──────────────────────────────────────────
        Streamlines of a divergence-free field (velocity = curl of a stream
        function built from the latitude and one band of noise), cut over open
        water only, at whichever octave of seed-spacing currently reads. This
        is the one genuinely STRUCTURED thing waiting in a deep blow-up: the
        traveller who stops between decades finds a CURRENT, not more texture.
        It also gives the mid-latitudes something to be other than stipple. */
  function psi(x, y, fn) {
    var r2 = x * x + y * y;
    var z = Math.sqrt(Math.max(1e-6, R * R - r2));
    var nx = x / R, ny = y / R, nz = z / R;
    var lat = Math.asin(clamp(dot3(POLE, nx, ny, nz), -1, 1));
    return 0.62 * Math.sin(lat * 5.4)
      + 2.60 * (val3(nx * fn + 2.5, ny * fn - 1.3, nz * fn + 4.1) - 0.5);
  }
  function cutCurrents(g, u, a, S, V, f0, drift) {
    var o = [0, 0, 0, 0, 0];
    for (var oc = 0; oc < 12; oc++) {
      var s = 0.086 / Math.pow(3.2, oc);
      var px = s * u;
      if (px < 30) break;
      if (px > 190) continue;
      var fn = R / (3.2 * s), e = s * 0.14, stepLen = s * 0.30, N = 9;
      var i0 = Math.floor(V.x0 / s), i1 = Math.ceil(V.x1 / s);
      var j0 = Math.floor(V.y0 / s), j1 = Math.ceil(V.y1 / s);
      var cells = (i1 - i0 + 1) * (j1 - j0 + 1);
      var keep = (cells > 260 ? 260 / cells : 1) * 0.42;
      g.lineCap = 'round';
      for (var i = i0; i <= i1; i++) {
        for (var j = j0; j <= j1; j++) {
          if (h3(i, j, oc * 13 + 7) > keep) continue;
          var x = (i + h3(i, j, oc * 13 + 3)) * s, y = (j + h3(i, j, oc * 13 + 5)) * s;
          if (x * x + y * y >= R * R * 0.985) continue;
          if (!shade(x, y, S, f0, drift, o)) continue;
          /* open water, lit enough to read, and not buried under the deck */
          if (o[3] > -0.06 || o[2] < 0.24 || o[4] > 0.54) continue;
          var al = a * 0.23 * ZG * clamp(o[1] * 2.2, 0.10, 1);
          if (al < 0.012) continue;
          g.strokeStyle = 'rgba(' + TINT[1][0] + ',' + TINT[1][1] + ',' + TINT[1][2] + ',' + al.toFixed(3) + ')';
          g.lineWidth = clamp(0.95 / u, 1e-7, s * 0.10);
          g.beginPath(); g.moveTo(x, y);
          for (var k = 0; k < N; k++) {
            var vx = (psi(x, y + e, fn) - psi(x, y - e, fn)) / (2 * e);
            var vy = -(psi(x + e, y, fn) - psi(x - e, y, fn)) / (2 * e);
            var mm = Math.sqrt(vx * vx + vy * vy);
            if (!(mm > 1e-9)) break;
            x += vx / mm * stepLen; y += vy / mm * stepLen;
            if (x * x + y * y >= R * R * 0.985) break;
            g.lineTo(x, y);
          }
          g.stroke();
        }
      }
    }
  }

  /* ── the coastline, found by walking the parallels and marking the sign
        change. A dotted burin line, which is how a coast is cut. ─────────── */
  function cutCoast(g, u, a, S, V, W, drift) {
    var dLat = clamp(3.4 / (u * R), 0.0025, 0.055) / 1;
    var span = W.la1 - W.la0;
    var n = Math.min(200, Math.max(8, Math.ceil(span / dLat)));
    dLat = span / n;
    var E1 = S.E1, E2 = S.E2;
    var dots = [], night = [];
    for (var li = 0; li <= n; li++) {
      var la = W.la0 + li * dLat;
      if (la < -1.5 || la > 1.5) continue;
      var cl = Math.cos(la), sl = Math.sin(la), arc = Math.max(0.04, R * cl);
      var dLon = clamp(3.4 / (u * arc), 0.0025, 0.06);
      var sp2 = W.lo1 - W.lo0;
      var m = Math.min(560, Math.max(8, Math.ceil(sp2 / dLon)));
      dLon = sp2 / m;
      var pv = 0, pxx = 0, pyy = 0, have = false;
      for (var q = 0; q <= m; q++) {
        var lo = W.lo0 + q * dLon;
        var co = Math.cos(lo), so = Math.sin(lo);
        var nx = POLE[0] * sl + (E1[0] * co + E2[0] * so) * cl;
        var ny = POLE[1] * sl + (E1[1] * co + E2[1] * so) * cl;
        var nz = POLE[2] * sl + (E1[2] * co + E2[2] * so) * cl;
        if (nz <= 0.02) { have = false; continue; }
        var x = nx * R, y = ny * R;
        if (x < V.x0 - 0.01 || x > V.x1 + 0.01 || y < V.y0 - 0.01 || y > V.y1 + 0.01) { have = false; continue; }
        var v = landAt(nx, ny, nz, S);
        if (have && ((v > 0) !== (pv > 0))) {
          var f = pv / (pv - v);
          var cxx = pxx + (x - pxx) * f, cyy = pyy + (y - pyy) * f;
          var lam = (cxx / R) * SUN[0] + (cyy / R) * SUN[1] + Math.sqrt(Math.max(0, 1 - (cxx * cxx + cyy * cyy) / (R * R))) * SUN[2];
          if (lam > -0.02) dots.push(cxx, cyy, step(lam, -0.02, 0.25));
          else {
            /* a coast seen edge-on at the limb is not a coast, it is dust —
               the towns only get lit where the ground is actually facing us,
               so the gold stays a landfall and never becomes rim litter */
            var nzc = Math.sqrt(Math.max(0, 1 - (cxx * cxx + cyy * cyy) / (R * R)));
            if (nzc > 0.34) night.push(cxx, cyy, h3(li, q, 5));
          }
        }
        pv = v; pxx = x; pyy = y; have = true;
      }
    }
    var rr = clamp(1.05 / u, 1e-7, 0.005);
    g.fillStyle = 'rgba(234,230,214,' + (0.82 * a).toFixed(3) + ')';
    g.beginPath();
    for (var i = 0; i < dots.length; i += 3) {
      var w = rr * (0.80 + 1.05 * dots[i + 2]);
      g.moveTo(dots[i] + w, dots[i + 1]); g.arc(dots[i], dots[i + 1], w, 0, 6.283);
    }
    g.fill();
    /* the towns. Strung along the night coast like beads on a wire — which is
       what a coast looks like from up here after dark, and what the child
       plate is going to turn out to be. */
    g.fillStyle = 'rgba(246,206,132,' + (0.50 * a).toFixed(3) + ')';
    g.beginPath();
    for (var j = 0; j < night.length; j += 3) {
      if (night[j + 2] > 0.30) continue;
      var w2 = rr * (0.9 + 2.0 * night[j + 2]);
      g.moveTo(night[j] + w2, night[j + 1]); g.arc(night[j], night[j + 1], w2, 0, 6.283);
    }
    g.fill();
  }

  /* ── the cyclone arms, cut as spiral lines over their own stipple ─────── */
  function cutStorms(g, u, a, S, V, drift) {
    var o = [0, 0, 0, 0, 0];
    for (var i = 0; i < S.st.length; i++) {
      var s = S.st[i];
      if (dot3(s.p, 0, 0, 1) < -0.05) continue;
      for (var arm = 0; arm < s.arms; arm++) {
        var th0 = arm * (6.2832 / s.arms);
        var pts = [], alp = [];
        for (var k = 0; k <= 96; k++) {
          var th = th0 + (k / 96) * 5.6;
          var d = s.r * s.eye * Math.exp(s.b * (th - th0) * 1.02);
          if (d > s.r * 1.9) break;
          var ang = s.sense * (th - SPIN);
          var co = Math.cos(ang), si = Math.sin(ang);
          var cd = Math.cos(d), sd = Math.sin(d);
          var nx = s.p[0] * cd + (s.e1[0] * co + s.e2[0] * si) * sd;
          var ny = s.p[1] * cd + (s.e1[1] * co + s.e2[1] * si) * sd;
          var nz = s.p[2] * cd + (s.e1[2] * co + s.e2[2] * si) * sd;
          if (nz <= 0.02) { pts.push(null); alp.push(0); continue; }
          var x = nx * R, y = ny * R;
          var lam = nx * SUN[0] + ny * SUN[1] + nz * SUN[2];
          pts.push([x, y]);
          alp.push(step(lam, -0.12, 0.28) * (1 - step(d, s.r * 0.9, s.r * 1.9)) * s.str);
        }
        for (var q = 1; q < pts.length; q++) {
          if (!pts[q] || !pts[q - 1]) continue;
          var f = q / pts.length;
          var al = a * 0.78 * (alp[q] + alp[q - 1]) * 0.5 * (1 - 0.35 * f);
          if (al < 0.008) continue;
          g.lineCap = 'round';
          g.strokeStyle = 'rgba(240,236,222,' + al.toFixed(3) + ')';
          g.lineWidth = clamp((1.0 + 3.6 * (1 - f) * (1 - f)) / u, 1e-7, s.r * 0.07);
          g.beginPath(); g.moveTo(pts[q - 1][0], pts[q - 1][1]); g.lineTo(pts[q][0], pts[q][1]); g.stroke();
          /* the feathered outer edge of the band, half a step behind the arm */
          if (q % 2 === 0 && f > 0.12) {
            g.strokeStyle = 'rgba(212,220,214,' + (al * 0.42).toFixed(3) + ')';
            g.lineWidth = clamp(0.9 / u, 1e-7, s.r * 0.03);
            var ox = (pts[q][1] - pts[q - 1][1]) * 1.7, oy = -(pts[q][0] - pts[q - 1][0]) * 1.7;
            g.beginPath();
            g.moveTo(pts[q - 1][0] + ox, pts[q - 1][1] + oy);
            g.lineTo(pts[q][0] + ox, pts[q][1] + oy); g.stroke();
          }
        }
      }
      /* the eye: a punched hole with a bright wall */
      var pd = dot3(s.p, 0, 0, 1);
      if (pd > 0.14) {
        var ex = s.p[0] * R, ey = s.p[1] * R;
        var er = s.r * s.eye * R * 0.9 * clamp(pd, 0.2, 1);
        var lamE = s.p[0] * SUN[0] + s.p[1] * SUN[1] + s.p[2] * SUN[2];
        var lit = step(lamE, -0.10, 0.30);
        g.fillStyle = 'rgba(10,15,24,' + (0.55 * a * lit).toFixed(3) + ')';
        g.beginPath(); g.ellipse(ex, ey, er * clamp(pd, 0.18, 1), er, 0, 0, 6.283); g.fill();
        g.strokeStyle = 'rgba(240,236,222,' + (0.55 * a * lit).toFixed(3) + ')';
        g.lineWidth = clamp(1.4 / u, 1e-7, er * 0.5);
        g.beginPath(); g.ellipse(ex, ey, er * clamp(pd, 0.18, 1), er, 0, 0, 6.283); g.stroke();
      }
    }
  }

  /* ── the air: a thin lit rim, cut as short strokes around the limb ────── */
  /* THE AIR — a hairline of atmosphere laid ALONG the limb (never across it),
     brightest where the limb is sunlit and dying out around the night side.
     Three concentric passes give the shell its thickness without a wash. */
  function cutAir(g, u, a) {
    var n = 200, dph = 6.2832 / n;
    var w = clamp(1.15 / u, 1e-7, 0.0035);
    var pass = [
      { r: R + w * 0.6, k: 1.00, c: [176, 214, 246], cn: [104, 132, 168] },
      { r: R + w * 2.3, k: 0.52, c: [150, 194, 236], cn: [86, 112, 148] },
      { r: R + w * 4.6, k: 0.22, c: [128, 174, 224], cn: [72, 96, 130] }
    ];
    for (var p = 0; p < pass.length; p++) {
      var P = pass[p];
      g.lineWidth = w * (p === 0 ? 1.0 : (p === 1 ? 1.9 : 3.4));
      for (var i = 0; i < n; i++) {
        var ph = i * dph, c = Math.cos(ph + dph * 0.5), si = Math.sin(ph + dph * 0.5);
        var lam = c * SUN[0] + si * SUN[1];
        var lit = Math.pow(clamp(lam, 0, 1), 0.75);
        var al = a * P.k * (0.045 + 0.72 * lit);
        if (al < 0.006) continue;
        /* the sunward limb is blue; the twilight limb warms before it goes out */
        var mix = clamp(lit * 2.2, 0, 1);
        var col = Math.round(P.cn[0] + (P.c[0] - P.cn[0]) * mix) + ',' +
          Math.round(P.cn[1] + (P.c[1] - P.cn[1]) * mix) + ',' +
          Math.round(P.cn[2] + (P.c[2] - P.cn[2]) * mix);
        if (lit > 0.02 && lit < 0.30) col = '224,186,132';
        g.strokeStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')';
        g.beginPath(); g.arc(0, 0, P.r, ph, ph + dph * 1.04); g.stroke();
      }
    }
  }

  /* ── the day region, as a flat tint block under the engraving ─────────── */
  function dayPath(g) {
    var ps = Math.atan2(SUN[1], SUN[0]);
    g.beginPath();
    g.arc(0, 0, R, ps - 1.5708, ps + 1.5708, false);
    g.ellipse(0, 0, R * Math.abs(SUN[2]), R, ps, 1.5708, 4.7124, false);
    g.closePath();
  }

  /* ── the anchor: one stretch of night coast, and its lights ───────────── */
  function anchorMark(g, u, a, S, anchor, t) {
    if (!anchor) return;
    var ax = anchor[0], ay = anchor[1];
    var r = 0.017;
    var gr = g.createRadialGradient(ax, ay, 0, ax, ay, r * 2.6);
    gr.addColorStop(0, 'rgba(250,212,146,' + (0.26 * a).toFixed(3) + ')');
    gr.addColorStop(0.45, 'rgba(238,186,118,' + (0.08 * a).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(230,180,110,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(ax, ay, r * 2.6, 0, 6.283); g.fill();

    /* THE SHORE ITSELF. Walk out along the coast either way from the anchor and
       snap every step back onto the zero level set of the land field with a
       couple of Newton corrections — so this is the REAL coastline of the real
       continent, found rather than drawn, and the bay that follows is a bay in
       an actual place. */
    var e = 0.0035;
    function L(x, y) {
      var r2 = x * x + y * y;
      if (r2 >= R * R) return -1;
      var zz = Math.sqrt(Math.max(1e-6, R * R - r2));
      return landAt(x / R, y / R, zz / R, S);
    }
    function grad(x, y, out) {
      out[0] = (L(x + e, y) - L(x - e, y)) / (2 * e);
      out[1] = (L(x, y + e) - L(x, y - e)) / (2 * e);
      return Math.sqrt(out[0] * out[0] + out[1] * out[1]);
    }
    var G = [0, 0];
    var m0 = grad(ax, ay, G) || 1;
    var tx = -G[1] / m0, ty = G[0] / m0;           /* along the coast */

    var SH = 30, half = 0.046, shore = [], nrm = [];
    for (var i = -SH; i <= SH; i++) {
      var x = ax + tx * (i / SH) * half, y = ay + ty * (i / SH) * half;
      for (var it = 0; it < 3; it++) {
        var v = L(x, y), mm = grad(x, y, G);
        if (!(mm > 1e-6)) break;
        x -= v * G[0] / (mm * mm) * 0.85; y -= v * G[1] / (mm * mm) * 0.85;
      }
      var mn = grad(x, y, G) || 1, fin = L(x, y);
      /* only keep the steps that actually CONVERGED onto the coast — an
         unconverged step is still sitting on the straight seed line, and a
         straight line laid across a night ocean reads as a scratch */
      if (x * x + y * y >= R * R * 0.995 || !isFinite(x) || !isFinite(y) || Math.abs(fin) > 0.03) {
        shore.push(null); nrm.push(null); continue;
      }
      shore.push([x, y]); nrm.push([G[0] / mn, G[1] / mn]);   /* points inland */
    }

    /* MOONLIGHT ON THE WATER: a hairline laid just off the shore, on the sea
       side, brightest where it passes the anchor. This is the one pale mark on
       the night hemisphere, and it is what makes the gold read as a landfall. */
    var tw = 0.4 + 0.6 * Math.sin(t * 0.21);       /* the very slow breath of air */
    g.lineCap = 'round';
    for (var q = 1; q < shore.length; q++) {
      var p0 = shore[q - 1], p1 = shore[q], n0 = nrm[q - 1], n1 = nrm[q];
      if (!p0 || !p1 || !n0 || !n1) continue;
      var ff = Math.abs((q - SH) / SH);
      if (h3(q, 3, 61) > 0.62) continue;           /* BROKEN, like a burin's dash */
      var off = 0.0026;
      var al0 = a * 0.46 * (1 - 0.80 * ff) * (0.55 + 0.45 * h3(q, 7, 71));
      if (al0 > 0.01) {
        g.strokeStyle = 'rgba(196,214,236,' + al0.toFixed(3) + ')';
        g.lineWidth = 0.0016 * (1 - 0.4 * ff);
        g.beginPath();
        g.moveTo(p0[0] - n0[0] * off, p0[1] - n0[1] * off);
        g.lineTo(p1[0] - n1[0] * off, p1[1] - n1[1] * off);
        g.stroke();
      }
    }

    /* THE BAY OF LIGHTS. Not a string of beads along a wire — five towns of
       different weight with their own scatter of outskirts, packed into the
       elbow of the shore, which is what a landfall looks like from up here
       after dark and what the child plate is about to turn out to be. */
    var towns = [
      { s: 0.00, w: 1.00, n: 26, sp: 0.016 },
      { s: -0.30, w: 0.74, n: 17, sp: 0.013 },
      { s: 0.34, w: 0.80, n: 19, sp: 0.014 },
      { s: -0.66, w: 0.44, n: 10, sp: 0.011 },
      { s: 0.70, w: 0.40, n: 9, sp: 0.011 }
    ];
    for (var ti = 0; ti < towns.length; ti++) {
      var T = towns[ti];
      var si = Math.round((T.s * SH) + SH);
      var P = shore[clamp(si, 0, shore.length - 1)], NN = nrm[clamp(si, 0, shore.length - 1)];
      if (!P || !NN) continue;
      for (var k = 0; k < T.n; k++) {
        var h1 = h3(ti * 31 + 5, k, 17), h2 = h3(ti * 31 + 9, k, 23), h3v = h3(ti * 31 + 13, k, 29);
        /* a gaussian-ish knot, pulled INLAND so the lights sit on the land */
        var rr = T.sp * Math.pow(h1, 0.62);
        var th = h2 * 6.2832;
        var dx = Math.cos(th) * rr * 1.35, dy = Math.sin(th) * rr * 0.85;
        var lx = P[0] + tx * dx + NN[0] * (dy + T.sp * 0.55);
        var ly = P[1] + ty * dx + NN[1] * (dy + T.sp * 0.55);
        if (L(lx, ly) < -0.015) continue;          /* not out at sea */
        var br = 0.30 + 0.70 * h3v * h3v;
        var sz = (0.0013 + 0.0034 * br) * T.w;
        var al = a * (0.34 + 0.60 * br) * T.w * (0.88 + 0.12 * tw);
        if (al < 0.01) continue;
        g.fillStyle = 'rgba(252,214,144,' + al.toFixed(3) + ')';
        g.beginPath(); g.arc(lx, ly, sz, 0, 6.283); g.fill();
      }
    }
    /* the harbour light at the anchor itself — the exact point the child grows from */
    g.fillStyle = 'rgba(255,236,196,' + (0.88 * a).toFixed(3) + ')';
    g.beginPath(); g.arc(ax, ay, 0.0036, 0, 6.283); g.fill();
  }

  /* ── the mote: at a dozen pixels there is no engraving, only a lit ball ── */
  function mote(g, u, a, anchor) {
    g.fillStyle = 'rgba(9,14,25,' + (0.92 * a).toFixed(3) + ')';
    g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.clip();
    dayPath(g);
    g.fillStyle = 'rgba(96,140,186,' + (0.86 * a).toFixed(3) + ')'; g.fill();
    g.fillStyle = 'rgba(150,190,226,' + (0.34 * a).toFixed(3) + ')';
    g.beginPath(); g.arc(SUN[0] * R * 0.62, SUN[1] * R * 0.62, R * 0.42, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(232,226,206,' + (0.30 * a).toFixed(3) + ')';
    g.beginPath(); g.ellipse(R * 0.30, R * 0.10, R * 0.30, R * 0.13, 0.7, 0, 6.283); g.fill();
    /* ONE HEAVY RULING FAMILY, even here. At a dozen pixels there is no
       engraving to speak of — but three chords laid across the lit face and a
       hatched limb keep the speck's DNA continuous with the plate it becomes,
       so the arriving mote is recognisably the same object. */
    g.strokeStyle = 'rgba(206,226,246,' + (0.30 * a).toFixed(3) + ')';
    g.lineWidth = R * 0.055;
    for (var q = -1; q <= 1; q++) {
      var yy = q * R * 0.42, hw = Math.sqrt(Math.max(0, R * R - yy * yy)) * 0.92;
      g.beginPath(); g.moveTo(Math.max(-hw, -R * 0.08), yy); g.lineTo(hw, yy); g.stroke();
    }
    g.restore();
    var ps2 = Math.atan2(SUN[1], SUN[0]);
    g.strokeStyle = 'rgba(190,216,242,' + (0.34 * a).toFixed(3) + ')';
    g.lineWidth = R * 0.07;
    g.beginPath(); g.arc(0, 0, R * 0.96, ps2 - 1.15, ps2 + 1.15); g.stroke();
    var gr = g.createRadialGradient(0, 0, R * 0.94, 0, 0, R * 1.28);
    gr.addColorStop(0, 'rgba(150,196,240,' + (0.42 * a).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(140,186,236,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 1.28, 0, 6.283); g.fill();
    if (anchor) {
      g.fillStyle = 'rgba(252,216,150,' + (0.75 * a).toFixed(3) + ')';
      g.beginPath(); g.arc(anchor[0], anchor[1], R * 0.10, 0, 6.283); g.fill();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  PlateArt.earth = function (g, u, a, t, anchor) {
    g.save();
    g.scale(u, u);
    var S = setup(anchor);
    var drift = (t || 0) * 0.00042;                /* the deck turns, slowly */
    SPIN = (t || 0) * 0.0082;                      /* the storms turn, visibly */

    if (u < 46) { mote(g, u, a, anchor); g.restore(); return; }

    var V = viewBox(g, u);
    if (V.x1 <= V.x0 || V.y1 <= V.y0) { g.restore(); return; }
    ZG = clamp(1 + 2.05 * Math.log(Math.max(1, u / 900)) / (Math.LN10 * 2.6), 1, 3.2);
    var spanU = Math.max(1e-6, Math.min(V.x1 - V.x0, V.y1 - V.y0));
    var f0 = clamp(16 / spanU, 3, 4.2e5);          /* the octave the eye can read */
    var W = latLonWindow(V, S);

    /* the paper */
    g.fillStyle = 'rgba(7,11,20,' + (0.94 * a).toFixed(3) + ')';
    g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();

    g.save();
    g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.clip();

    /* the faintest tint block over the lit hemisphere — a breath of plate tone
       under the engraving, not a fill that does the engraving's job */
    dayPath(g);
    g.fillStyle = 'rgba(24,44,72,' + (0.30 * a).toFixed(3) + ')'; g.fill();

    /* the rulings: every octave of spacing that lands in the legible band */
    for (var h = 0; h < HATCH.length; h++) {
      var sp = HATCH[h], px = sp * u;
      if (px < 4.2 || px > 82) continue;
      var wgt = px > 26 ? 1.15 : 1.0;
      cutParallels(g, u, a, S, V, W, f0, drift, sp, wgt);
      if (px > 9) cutMeridians(g, u, a * 0.55, S, V, W, f0, drift, sp * 1.6, 0.9);
    }

    stipple(g, u, a, S, V, f0, drift);
    cutCurrents(g, u, a, S, V, f0, drift);
    cutStorms(g, u, a, S, V, drift);
    cutCoast(g, u, a, S, V, W, drift);

    g.restore();                                   /* off the ball */

    cutAir(g, u, a);
    anchorMark(g, u, a, S, anchor, t || 0);

    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.restore();
  };
})();

/* ═══ 9  THE MOON'S ROAD ══════════════════════════════════════════════════ */
PlateArt.moonroad = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u);
  tfStroke(g, `rgba(180,196,220,${0.18 * a})`, 0.0032);          // the orbit
  g.beginPath(); g.ellipse(0, 0, 0.40, 0.36, 0.22, 0, 6.283); g.stroke();
  const eg = g.createRadialGradient(0, 0, 0, 0, 0, 0.045);       // the Earth, small now
  eg.addColorStop(0, `rgba(140,180,220,${0.9 * a})`); eg.addColorStop(0.7, `rgba(40,78,120,${0.8 * a})`);
  eg.addColorStop(1, 'rgba(20,40,70,0)');
  g.fillStyle = eg; g.beginPath(); g.arc(0, 0, 0.045, 0, 6.283); g.fill();
  const th = 0.9 + t * 0.05, mx = Math.cos(th) * 0.40, my = Math.sin(th) * 0.36;
  const cs = Math.cos(0.22), sn = Math.sin(0.22);
  const px = mx * cs - my * sn, py = mx * sn + my * cs;
  const mg = g.createRadialGradient(px - 0.004, py - 0.004, 0, px, py, 0.019);
  mg.addColorStop(0, `rgba(232,228,214,${0.95 * a})`); mg.addColorStop(1, `rgba(120,116,108,${0.5 * a})`);
  g.fillStyle = mg; g.beginPath(); g.arc(px, py, 0.019, 0, 6.283); g.fill();
  const r = tfRng(73);
  g.fillStyle = `rgba(255,246,226,${0.55 * a})`;                 // the far field
  for (let i = 0; i < 90; i++) {
    const x = (r() - 0.5) * 0.98, y = (r() - 0.5) * 0.98;
    g.globalAlpha = a * (0.05 + 0.35 * Math.pow(r(), 3));
    g.beginPath(); g.arc(x, y, 0.0022 + r() * 0.003, 0, 6.283); g.fill();
  }
  g.globalAlpha = 1;
  grain(g, u, a, 73, 'rgba(196,206,226,1)', 0.20, true);
  smudge(g, anchor, 0.030, '150,190,230', a * 0.9, 73);
  g.restore();
};

/* ═══ 11  THE INNER PLANETS ═══════════════════════════════════════════════ */
PlateArt.inner = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u);
  const sg = g.createRadialGradient(0, 0, 0, 0, 0, 0.075);
  sg.addColorStop(0, `rgba(255,244,206,${0.95 * a})`); sg.addColorStop(1, 'rgba(255,180,60,0)');
  g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 0.075, 0, 6.283); g.fill();
  const orb = [[0.115, '210,196,180', 0.006], [0.185, '236,214,168', 0.009],
               [0.270, '140,186,228', 0.010], [0.370, '212,146,110', 0.008]];
  orb.forEach((o, i) => {
    const [rr, col, sz] = o;
    tfStroke(g, `rgba(240,199,102,${(0.24 - i * 0.03) * a})`, 0.0026);
    g.beginPath(); g.ellipse(0, 0, rr, rr * 0.42, 0.2, 0, 6.283); g.stroke();
    const th = 1.1 + i * 1.9 + t * 0.06 / (i + 1);
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr * 0.42;
    const cs = Math.cos(0.2), sn = Math.sin(0.2);
    const px = x * cs - y * sn, py = x * sn + y * cs;
    const gl = g.createRadialGradient(px, py, 0, px, py, sz * 3);
    gl.addColorStop(0, `rgba(${col},${0.9 * a})`); gl.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gl; g.beginPath(); g.arc(px, py, sz * 3, 0, 6.283); g.fill();
    g.fillStyle = `rgba(${col},${0.95 * a})`; g.beginPath(); g.arc(px, py, sz, 0, 6.283); g.fill();
  });
  grain(g, u, a, 79, 'rgba(226,214,186,1)', 0.16, true);
  smudge(g, anchor, 0.028, '150,190,230', a * 0.9, 79);
  g.restore();
};

/* ═══ 12  THE SUN'S FAMILY ════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   THE TEN-FOLD GLASS — plate 10^12  ·  THE SUN'S FAMILY
   an engraved orrery plate: the ecliptic seen from well above it, the node
   line ruled on the diagonal, the whole family carried on one graduated limb.

   THE TWO PROBLEMS, AND HOW THIS PLATE ANSWERS THEM
   ─────────────────────────────────────────────────
   (1) FIELD TEXTURE ACROSS FIVE DECADES. Every mark is either a LINE whose
       width is authored in PIXELS (`ink`), or a MOTE from a population whose
       sizes are distributed LOG-UNIFORMLY — so at any magnification some
       sub-population lands in the legible band and gets drawn, and none of it
       ever becomes a fat smear. Two populations do the work: the zodiacal
       dust, generated log-radially about the Sun (equal count per decade of
       radius, size proportional to radius: a genuinely scale-invariant field),
       and the belt, whose grains carry a two-decade spread of sizes.
       At the far end of the zoom the SUN ITSELF takes over, and it is drawn
       at TRUE SCALE: 1.4e9 m across a 1e12 m plate is 0.0014 unit, which is
       exactly the width of the 300x panel. Blow this plate up and the fierce
       point resolves into a granulated photosphere, its supergranular network
       and its spots. That is not a texture trick; it is what is actually
       there. Nothing here is rendered with a smooth wash — brightness is
       carried by line density and stipple, the way an engraver carries it.

   (2) COMPOSED AROUND THE ANCHOR. The anchor is inverted through the
       projection to recover the in-plane radius and phase it corresponds to,
       and EARTH'S ORBIT IS THEN SIZED TO PASS THROUGH IT with Earth standing
       at that phase. Every other radius follows from Earth's by a compressed
       power law, and Mercury, Venus and Mars are phased into the same quarter
       of the wheel. So the anchor is not a marker on the picture: it is the
       crowded knot of the inner planets, which is precisely the plate the
       child resolves into.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TAU = 6.283185307179586;

  /* ── the view ──────────────────────────────────────────────────────────
     SIN_E: sine of the viewer's elevation above the ecliptic (58 deg-ish of
     opening — well above the plane, but not so far that the tracks lose their
     ellipse). PSI: the roll of the plate on the page, which puts the node line
     on the diagonal and — not by accident — carries the anchor onto it. */
  var SIN_E = 0.58, COS_E = Math.sqrt(1 - SIN_E * SIN_E);
  var PSI = 0.80, CP = Math.cos(PSI), SP = Math.sin(PSI);

  function projX(X, Y, Z) { return X * CP - (Y * SIN_E - Z * COS_E) * SP; }
  function projY(X, Y, Z) { return X * SP + (Y * SIN_E - Z * COS_E) * CP; }

  /* ── the ink kit ───────────────────────────────────────────────────────── */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  /* a stroke whose weight is authored in PIXELS, so a line stays a line at
     u = 8 and at u = 10^6 alike. This is the whole reason the engraving
     survives the gaps. */
  function ink(g, u, col, px) {
    g.strokeStyle = col; g.lineWidth = px / u; g.lineCap = 'round'; g.lineJoin = 'round';
  }

  var CACHE = {};
  function field(key, make) { var P = CACHE[key]; if (!P) { P = make(); CACHE[key] = P; } return P; }

  /* THE ZODIACAL DUST — log-radial, so the field has the same statistics at
     every zoom: equal motes per decade of radius, mote size ∝ radius, with a
     half-decade of size jitter so octaves cross over smoothly. Flattened into
     a lens about the plane. */
  function dust(R0, R1) {
    return field('dust:' + R0 + ':' + R1, function () {
      var r = rng(9173), n = 3600, P = new Float32Array(n * 5), L = Math.log(R1 / R0);
      for (var i = 0; i < n; i++) {
        var q = r(), rr = R0 * Math.exp(q * L), ps = r() * TAU;
        var w = (r() + r() + r() - 1.5) / 1.5;
        var z = w * 0.075 * rr;
        P[i * 5] = rr; P[i * 5 + 1] = ps; P[i * 5 + 2] = z;
        P[i * 5 + 3] = 0.0072 * rr * Math.exp((r() - 0.5) * 1.3);  /* size */
        P[i * 5 + 4] = (0.18 + 0.82 * r() * r()) * (0.30 + 0.70 * Math.exp(-w * w * 2.2));
      }
      return P;
    });
  }

  /* THE BELT — one narrow annulus, clumped in longitude, with two swept lanes
     cut in it, and a two-decade log spread of grain sizes so the band stays
     grainy however far in you go. */
  function belt(R) {
    return field('belt:' + R.toFixed(4), function () {
      var r = rng(2749), n = 2400, P = new Float32Array(n * 5);
      var cl = []; for (var c = 0; c < 7; c++) cl.push(r() * TAU);
      for (var i = 0; i < n; i++) {
        var ps = r() < 0.42 ? cl[(r() * 7) | 0] + (r() - 0.5) * 0.9 : r() * TAU;
        var w = (r() + r() + r() - 1.5) / 1.5;                     /* −1..1, bunched */
        var rr = R * (1 + w * 0.105);
        var gap = Math.abs(w - 0.42) < 0.055 || Math.abs(w + 0.60) < 0.045;
        P[i * 5] = rr; P[i * 5 + 1] = ps;
        P[i * 5 + 2] = (r() + r() - 1) * 0.040 * rr;
        P[i * 5 + 3] = 0.00004 * Math.exp(r() * 4.6);              /* 4e−5 .. 4e−3 */
        P[i * 5 + 4] = (gap ? 0.16 : 1) * (0.10 + 0.90 * r() * r() * r());
      }
      return P;
    });
  }

  /* THE PHOTOSPHERE — a granulation whose grain sizes run continuously over
     two decades, cut by the SUPERGRANULAR NETWORK: for each grain the gap
     between its distance to the nearest cell seed and to the next-nearest
     says how deep in a lane it lies. Grains in a lane are smaller and much
     darker, so the disc reads as CELLS WITH BOUNDARIES rather than as an even
     bubble field, and the grain coarsens toward the limb. Only ever visible
     when the plate is blown up past ~10^4 px. */
  function granules() {
    return field('gran2', function () {
      var r = rng(613), n = 15000, P = new Float32Array(n * 5), c;
      var NC = 78, cxs = new Float64Array(NC), cys = new Float64Array(NC);
      for (c = 0; c < NC; c++) {
        var ct = r() * TAU, cq = Math.sqrt(r()) * 1.04;
        cxs[c] = Math.cos(ct) * cq; cys[c] = Math.sin(ct) * cq;
      }
      for (var i = 0; i < n; i++) {
        var th = r() * TAU, q = Math.sqrt(r()) * 0.995;
        var gx = Math.cos(th) * q, gy = Math.sin(th) * q;
        var d1 = 9, d2 = 9;
        for (c = 0; c < NC; c++) {
          var ddx = gx - cxs[c], ddy = gy - cys[c], dd = ddx * ddx + ddy * ddy;
          if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) { d2 = dd; }
        }
        var lane = Math.sqrt(d2) - Math.sqrt(d1);          /* 0 exactly on a boundary */
        var inC = Math.min(1, lane / 0.040);               /* 0 in a lane, 1 inside a cell */
        P[i * 5] = gx; P[i * 5 + 1] = gy;
        P[i * 5 + 2] = 1.05e-6 * Math.exp(r() * 4.3) * (0.55 + 0.45 * inC) * (1 + 0.55 * q * q);
        P[i * 5 + 3] = q;                                  /* fractional radius */
        P[i * 5 + 4] = (0.05 + 0.95 * Math.pow(inC, 1.6)) * (0.42 + 0.58 * r());
      }
      return P;
    });
  }

  /* THE SPOTS, in fractions of the solar radius: a big LEADER, a smaller
     FOLLOWER trailing it along the same latitude, two pores strung between
     them, and one lone spot high on the disc. Sizes deliberately unequal —
     two matched blobs are the giveaway of a drawn sun. The granulation is
     WITHHELD inside each of them: an engraver makes a dark thing by leaving
     the paper bare, not by laying black over his own hatching, and ink
     absence is the only way a spot stays black at any presence `a`. */
  var SPOTS = [
    [-0.34,  0.06, 0.150, 0.7],
    [ 0.01,  0.17, 0.092, 2.4],
    [-0.19,  0.11, 0.030, 5.1],
    [-0.10,  0.15, 0.020, 1.3],
    [ 0.30, -0.46, 0.056, 3.8]
  ];
  /* an umbra is a lobed blot, never a disc — one outline serves both the
     withholding of grain and the drawing of the spot, so they cannot drift */
  function spotR(sp, th) {
    return sp[2] * (1 + 0.17 * Math.sin(3 * th + sp[3]) + 0.09 * Math.sin(5 * th - 2 * sp[3]));
  }

  /* the planets: AU, symbol size, tint, eccentricity, inclination (deg, drawn
     at 2.2x so the tilts read), node longitude, phase */
  var P8 = [
    ['mercury', 0.387, 0.0044, '216,202,180', 0.206, 7.00, 0.90, -0.62],
    ['venus',   0.723, 0.0057, '240,222,178', 0.007, 3.39, 1.30,  0.34],
    ['earth',   1.000, 0.0058, '172,204,236', 0.000, 0.00, 0.00,  0.00],
    ['mars',    1.524, 0.0048, '214,140,102', 0.093, 1.85, 0.85, -0.30],
    ['jupiter', 5.203, 0.0107, '228,208,172', 0.048, 1.30, 1.75,  2.36],
    ['saturn',  9.537, 0.0090, '234,216,164', 0.054, 2.49, 1.98,  4.22],
    ['uranus',  19.19, 0.0072, '178,214,214', 0.047, 0.77, 1.29,  0.78],
    ['neptune', 30.07, 0.0069, '150,182,226', 0.009, 1.77, 2.30,  3.62]
  ];

  /* position on an inclined, slightly eccentric track, in the view frame */
  function orbXYZ(o, psi, out) {
    var r = o.R * (1 - o.e * o.e) / (1 + o.e * Math.cos(psi - o.w));
    var xo = r * Math.cos(psi - o.node), yo = r * Math.sin(psi - o.node);
    var y1 = yo * o.ci, z = yo * o.si;
    out[0] = xo * Math.cos(o.node) - y1 * Math.sin(o.node);
    out[1] = xo * Math.sin(o.node) + y1 * Math.cos(o.node);
    out[2] = z;
    return out;
  }

  /* one arc of Saturn's ring, struck in the RING'S OWN tilted plane so it can
     be laid behind the body and then over it */
  function satArc(g, u, cx, cy, rad, rk, rc, rs, col, wpx, from, to) {
    ink(g, u, col, wpx);
    g.beginPath();
    for (var i = 0; i <= 44; i++) {
      var th = from + (to - from) * i / 44;
      var ex = rad * Math.cos(th), ez = rad * Math.sin(th) * rk;
      var qx = cx + ex * rc - ez * rs, qy = cy + ex * rs + ez * rc;
      if (i) g.lineTo(qx, qy); else g.moveTo(qx, qy);
    }
    g.stroke();
  }

  PlateArt.sunfamily = function (g, u, a, t, anchor) {
    g.save();
    g.scale(u, u);

    var A = anchor || [0.08, 0.11];
    /* invert the projection: which in-plane radius and phase does the anchor
       stand at? Earth's track is then built to pass exactly through it. */
    var sx0 = A[0] * CP + A[1] * SP, sy0 = -A[0] * SP + A[1] * CP;
    var Re = Math.hypot(sx0, sy0 / SIN_E);
    if (!(Re > 0.06)) Re = 0.1387;
    if (Re > 0.20) Re = 0.20;
    var psiE = Math.atan2(sy0 / SIN_E, sx0);
    /* AU -> plate, compressed. Pitched so the inner tracks clear one another
       by more than a hairline — two tracks a couple of pixels apart read as
       plate misregistration, not as depth — and so NEPTUNE RUNS OFF THE SHEET.
       A plate cropped by its own frame is an instrument; one that floats
       wholly inside it is a diagram. */
    var POW = 0.385;

    var O = [], i, k;
    for (i = 0; i < P8.length; i++) {
      var d = P8[i], inc = d[5] * 2.2 * Math.PI / 180;
      var rate = 0.0105 / Math.pow(d[1], 1.5);
      O.push({
        name: d[0], R: Re * Math.pow(d[1], POW), sz: d[2], col: d[3],
        e: d[4], ci: Math.cos(inc), si: Math.sin(inc), node: d[6], w: d[6] + 1.1,
        psi: psiE + d[7] + (d[0] === 'earth' ? 0 : t * rate)
      });
    }
    var Rbelt = Re * Math.pow(2.72, POW);
    var VIS = 1500 / u, P = [0, 0, 0];
    var px = function (s) { return s * u; };

    /* ── 1 · the dust lens ────────────────────────────────────────────────
       far out, when the whole plate is only a mote, the field cannot be
       resolved and one soft lens along the plane is the honest reading; from
       there in, the mote population takes over and never lets go. */
    if (u < 130) {
      g.save();
      g.rotate(PSI);
      var lens = g.createRadialGradient(0, 0, 0, 0, 0, 0.38);
      lens.addColorStop(0, 'rgba(246,226,176,' + (0.62 * a) + ')');
      lens.addColorStop(0.32, 'rgba(230,202,152,' + (0.21 * a) + ')');
      lens.addColorStop(1, 'rgba(210,186,150,0)');
      g.fillStyle = lens;
      g.beginPath(); g.ellipse(0, 0, 0.38, 0.38 * SIN_E, 0, 0, TAU); g.fill();
      g.restore();
      /* the rim of the wheel, ruled. At fifteen pixels the one thing that must
         survive is that this is a TILTED DISC with something hot at its middle,
         so the outermost track is struck as a hairline whatever else is lost. */
      ink(g, u, 'rgba(242,214,150,' + (0.50 * a) + ')', 1.0);
      g.beginPath();
      for (k = 0; k <= 64; k++) {
        var rq = k / 64 * TAU;
        var rx = projX(0.415 * Math.cos(rq), 0.415 * Math.sin(rq), 0);
        var ry = projY(0.415 * Math.cos(rq), 0.415 * Math.sin(rq), 0);
        if (k) g.lineTo(rx, ry); else g.moveTo(rx, ry);
      }
      g.stroke();
    } else {
      var D = dust(0.0009, 0.47);
      g.fillStyle = 'rgba(242,226,184,1)';
      for (i = 0; i < D.length; i += 5) {
        var s = D[i + 3], sp = px(s);
        if (sp < 0.35 || sp > 3.4) continue;
        var rr = D[i], ps = D[i + 1];
        var X = rr * Math.cos(ps), Y = rr * Math.sin(ps), Z = D[i + 2];
        var x = projX(X, Y, Z), y = projY(X, Y, Z);
        if (x < -VIS || x > VIS || y < -VIS || y > VIS) continue;
        /* the lens thins outward: past Jupiter the plate is meant to be empty */
        g.globalAlpha = a * D[i + 4] * 0.78 * Math.min(1, 0.05 / rr + 0.30)
                          * (0.16 + 0.84 * Math.exp(-rr / 0.20));
        if (sp > 1.5) { g.beginPath(); g.arc(x, y, s * 0.55, 0, TAU); g.fill(); }
        else g.fillRect(x - s * 0.5, y - s * 0.5, s, s);
      }
      g.globalAlpha = 1;
    }

    /* ── 2 · the graduated limb ───────────────────────────────────────────
       the plate's own furniture: a doubled ecliptic ring graduated in THREE
       tiers (2 / 10 / 30 deg) and the line of nodes ruled dashed straight
       through the Sun. It is pitched wide enough to be CROPPED by the sheet —
       an instrument's scale runs off the paper. */
    if (u >= 150) {
      var Rl = 0.645;
      var ringPath = function (rg) {
        g.beginPath();
        for (var kk = 0; kk <= 128; kk++) {
          var q = kk / 128 * TAU;
          var lx = projX(rg * Math.cos(q), rg * Math.sin(q), 0);
          var ly = projY(rg * Math.cos(q), rg * Math.sin(q), 0);
          if (kk) g.lineTo(lx, ly); else g.moveTo(lx, ly);
        }
        g.stroke();
      };
      ink(g, u, 'rgba(240,199,102,' + (0.19 * a) + ')', 0.9);
      ringPath(Rl);
      ink(g, u, 'rgba(240,199,102,' + (0.13 * a) + ')', 0.8);
      ringPath(Rl * 1.036);
      /* the graduation itself, in three tiers */
      var step = u > 420 ? 2 : 10;
      for (var deg = 0; deg < 360; deg += step) {
        var th = deg * 0.0174532925;
        var lng = (deg % 30 === 0), med = (deg % 10 === 0);
        var len = lng ? 0.0225 : (med ? 0.0125 : 0.0055);
        ink(g, u, 'rgba(240,199,102,' + ((lng ? 0.28 : med ? 0.20 : 0.13) * a) + ')',
            lng ? 1.05 : med ? 0.85 : 0.7);
        var L2 = Rl - len;
        g.beginPath();
        g.moveTo(projX(Rl * Math.cos(th), Rl * Math.sin(th), 0), projY(Rl * Math.cos(th), Rl * Math.sin(th), 0));
        g.lineTo(projX(L2 * Math.cos(th), L2 * Math.sin(th), 0), projY(L2 * Math.cos(th), L2 * Math.sin(th), 0));
        g.stroke();
      }
      /* the line of nodes, dashed clean across the plate */
      g.save();
      g.setLineDash([6.6 / u, 9 / u]);
      ink(g, u, 'rgba(233,220,192,' + (0.15 * a) + ')', 0.8);
      g.beginPath();
      g.moveTo(projX(-Rl, 0, 0), projY(-Rl, 0, 0));
      g.lineTo(projX(Rl, 0, 0), projY(Rl, 0, 0));
      g.stroke();
      g.restore();
    }

    /* ── 3 · the tracks ───────────────────────────────────────────────────
       engraver's swell, in fourteen strokes per track: the weight lifts hard
       as the curve comes toward the reader and dies as it goes behind. The
       contrast is deliberately steep — the near half of a track carries some
       five times the ink of its far half — because that difference is the
       whole reason the sheet reads as a PLACE seen from above rather than as
       a target. */
    var lodAll = u >= 95;
    for (i = 0; i < O.length; i++) {
      var o = O[i];
      if (!lodAll && !(o.name === 'venus' || o.name === 'mars' || o.name === 'jupiter' || o.name === 'neptune')) continue;
      var N = 168, xs = new Float64Array(N + 1), ys = new Float64Array(N + 1), dp = new Float64Array(N + 1);
      for (k = 0; k <= N; k++) {
        orbXYZ(o, k / N * TAU, P);
        xs[k] = projX(P[0], P[1], P[2]); ys[k] = projY(P[0], P[1], P[2]);
        dp[k] = P[1] / o.R;
      }
      /* alternate tracks carry a touch less ink, so where two of them cross the
         pair reads as one passing behind the other, not as a misprint */
      var base = (0.345 - i * 0.015) * (i & 1 ? 0.84 : 1) * a * (u < 130 ? 2.4 : 1);
      var SEG = 14, per = N / SEG;
      for (var sgi = 0; sgi < SEG; sgi++) {
        var i0 = Math.round(sgi * per), i1 = Math.round((sgi + 1) * per);
        var dn = 0.5 + 0.5 * dp[(i0 + i1) >> 1];
        ink(g, u, 'rgba(240,199,102,' + Math.min(0.95, base * (0.24 + 1.10 * dn)) + ')',
            0.58 + 0.88 * dn);
        g.beginPath(); g.moveTo(xs[i0], ys[i0]);
        for (k = i0 + 1; k <= i1; k++) g.lineTo(xs[k], ys[k]);
        g.stroke();
      }
    }

    /* ── 4 · the belt ─────────────────────────────────────────────────────
       a grainy band, not a ring of dots: swept clumps, two cleared lanes. */
    if (u >= 95) {
      var B = belt(Rbelt), drew = 0;
      g.fillStyle = 'rgba(226,220,204,1)';
      for (i = 0; i < B.length; i += 5) {
        var bs = B[i + 3], bp = px(bs);
        if (bp < 0.35 || bp > 3.4) continue;
        var br = B[i], bps = B[i + 1] + t * 0.004;
        var bX = br * Math.cos(bps), bY = br * Math.sin(bps), bZ = B[i + 2];
        var bx = projX(bX, bY, bZ), by = projY(bX, bY, bZ);
        if (bx < -VIS || bx > VIS || by < -VIS || by > VIS) continue;
        g.globalAlpha = a * B[i + 4] * 0.60;
        if (bp > 1.5) { g.beginPath(); g.arc(bx, by, bs * 0.55, 0, TAU); g.fill(); }
        else g.fillRect(bx - bs * 0.5, by - bs * 0.5, bs, bs);
        drew++;
      }
      g.globalAlpha = 1;
      if (!drew) {                                   /* too far out to resolve */
        ink(g, u, 'rgba(206,196,172,' + (0.16 * a) + ')', 2.2);
        g.beginPath();
        for (k = 0; k <= 72; k++) {
          var bq = k / 72 * TAU, bxx = projX(Rbelt * Math.cos(bq), Rbelt * Math.sin(bq), 0);
          var byy = projY(Rbelt * Math.cos(bq), Rbelt * Math.sin(bq), 0);
          if (k) g.lineTo(bxx, byy); else g.moveTo(bxx, byy);
        }
        g.stroke();
      }
    }

    /* ── 5 · the anchor's haze ────────────────────────────────────────────
       the unresolved crowd at the anchor, laid UNDER the family so the inner
       planets still stand out of it: the glare the child comes out of. */
    if (px(0.014) > 1.5 && px(0.014) < 520) {
      var kg = g.createRadialGradient(A[0], A[1], 0, A[0], A[1], 0.034);
      kg.addColorStop(0, 'rgba(232,236,242,' + (0.46 * a) + ')');
      kg.addColorStop(0.30, 'rgba(220,218,208,' + (0.16 * a) + ')');
      kg.addColorStop(1, 'rgba(200,200,196,0)');
      g.fillStyle = kg; g.beginPath(); g.arc(A[0], A[1], 0.034, 0, TAU); g.fill();
      var kr = rng(3313);
      for (k = 0; k < 16; k++) {
        var ka = kr() * TAU, kd = Math.pow(kr(), 0.55) * 0.024;
        var ks = Math.max(0.0013, 0.55 / u);
        g.fillStyle = 'rgba(240,236,220,' + ((0.12 + 0.34 * kr()) * a) + ')';
        g.beginPath();
        g.arc(A[0] + Math.cos(ka) * kd, A[1] + Math.sin(ka) * kd * 0.8, ks, 0, TAU);
        g.fill();
      }
    }

    /* ── 6 · the family ───────────────────────────────────────────────────
       an engraver's body: the disc cut dark, the sunward limb carried by a lit
       crescent, the far limb hatched away. The light direction is real — every
       crescent points at the Sun at the centre of the sheet. */
    for (i = 0; i < O.length; i++) {
      var o2 = O[i];
      if (!lodAll && !(o2.name === 'venus' || o2.name === 'jupiter' || o2.name === 'neptune')) continue;
      orbXYZ(o2, o2.psi, P);
      var cx = projX(P[0], P[1], P[2]), cy = projY(P[0], P[1], P[2]);
      if (cx < -VIS || cx > VIS || cy < -VIS || cy > VIS) continue;
      var rad = Math.max(o2.sz, 0.85 / u), pr = px(rad);
      var sunA = Math.atan2(-cy, -cx);               /* the Sun sits at the origin */
      var ringOn = (o2.name === 'saturn') && pr > 2.6;
      var rk = 0.44, rc = Math.cos(-0.34), rs = Math.sin(-0.34);
      /* the ring: outer edge, the Cassini division, then the inner ring */
      var RING = [[2.30, 0.42], [1.98, 0.28], [1.82, 0.32], [1.42, 0.20]];

      if (ringOn) {                                  /* the far half, BEHIND the body */
        for (k = 0; k < RING.length; k++) {
          satArc(g, u, cx, cy, rad * RING[k][0], rk, rc, rs,
                 'rgba(236,222,178,' + (RING[k][1] * 0.55 * a) + ')', 0.85, Math.PI, TAU);
        }
      }

      if (pr > 1.7) {
        g.lineCap = 'butt';
        g.fillStyle = 'rgba(12,16,24,' + (0.92 * a) + ')';
        g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(' + o2.col + ',' + (0.30 * a) + ')';    /* far limb, barely there */
        g.lineWidth = Math.min(0.9 / u, rad * 0.45);
        g.beginPath(); g.arc(cx, cy, rad, sunA + 1.05, sunA - 1.05); g.stroke();
        g.strokeStyle = 'rgba(' + o2.col + ',' + (0.55 * a) + ')';    /* the crescent's falloff */
        g.lineWidth = Math.min(2.1 / u, rad * 0.9);
        g.beginPath(); g.arc(cx, cy, rad * 0.68, sunA - 1.35, sunA + 1.35); g.stroke();
        g.strokeStyle = 'rgba(255,246,220,' + (0.94 * a) + ')';       /* the lit crescent */
        g.lineWidth = Math.min(1.25 / u, rad * 0.5);
        g.beginPath(); g.arc(cx, cy, rad * 0.88, sunA - 1.02, sunA + 1.02); g.stroke();
        if (pr > 5) {                                /* hatching on the far limb */
          ink(g, u, 'rgba(' + o2.col + ',' + (0.34 * a) + ')', 0.75);
          g.lineCap = 'butt';
          g.beginPath();
          for (var h = -2; h <= 2; h++) {
            var off = h / 2.6 * rad, half = Math.sqrt(Math.max(0, rad * rad - off * off)) * 0.94;
            var nx = -Math.sin(sunA), ny = Math.cos(sunA);
            var bx2 = cx - Math.cos(sunA) * rad * 0.10 + nx * off;
            var by2 = cy - Math.sin(sunA) * rad * 0.10 + ny * off;
            g.moveTo(bx2, by2);
            g.lineTo(bx2 - Math.cos(sunA) * half * 0.82, by2 - Math.sin(sunA) * half * 0.82);
          }
          g.stroke();
        }
        g.lineCap = 'round';
      } else {
        g.fillStyle = 'rgba(' + o2.col + ',' + (0.92 * a) + ')';
        g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.fill();
      }

      if (ringOn) {                                  /* the near half, OVER the body */
        for (k = 0; k < RING.length; k++) {
          satArc(g, u, cx, cy, rad * RING[k][0], rk, rc, rs,
                 'rgba(240,226,182,' + (RING[k][1] * a) + ')', 0.9, -0.12, Math.PI + 0.12);
        }
      }
    }

    /* ── 7 · the Sun, at true scale ───────────────────────────────────────
       0.0014 unit across: a fierce point on its own plate, a granulated disc
       with spots on it once the glass is deep enough to hold it. */
    var Rs = 0.0007, sp2 = px(Rs);
    /* the corona — ruled streamers, always in scale because they are lines */
    var cr = rng(4409);
    for (k = 0; k < 26; k++) {
      var ca = cr() * TAU, len = (1.5 + 11 * Math.pow(cr(), 1.7)) * Rs;
      if (px(len - Rs) < 1.1) continue;
      ink(g, u, 'rgba(255,226,166,' + ((0.05 + 0.16 * cr()) * a) + ')', 0.7 + 0.5 * cr());
      var e0 = Rs * 1.04;
      g.beginPath();
      g.moveTo(Math.cos(ca) * e0, Math.sin(ca) * e0 * 0.92);
      g.lineTo(Math.cos(ca) * len, Math.sin(ca) * len * 0.92);
      g.stroke();
    }
    /* THE NEAR-FIELD LIGHT. Not a bloom: an engraver has no airbrush, and a
       radial wash is the one mark on this sheet that would betray the hand —
       it is also exactly the mark that turns to a fat smear in the gaps. So
       the Sun's fierceness is cut as an uneven starburst of straight hairlines
       whose LENGTHS are authored in pixels, with two tight haloes kept small
       in pixels. Brightness by line density. */
    if (u >= 90 && sp2 < 14) {
      var rr2 = rng(8821), nRay = 34;
      for (k = 0; k < nRay; k++) {
        var ra = k / nRay * TAU + (rr2() - 0.5) * 0.20;
        var lp = 2.6 + 23 * Math.pow(rr2(), 2.1);            /* px */
        var l0 = Math.max(Rs * 1.2, 1.5 / u), l1 = l0 + lp / u;
        ink(g, u, 'rgba(255,226,166,' + ((0.09 + 0.30 * rr2()) * a) + ')', 0.55 + 0.45 * rr2());
        g.beginPath();
        g.moveTo(Math.cos(ra) * l0, Math.sin(ra) * l0 * 0.94);
        g.lineTo(Math.cos(ra) * l1, Math.sin(ra) * l1 * 0.94);
        g.stroke();
      }
      for (k = 0; k < 2; k++) {
        var hr = (k ? 5.6 : 2.9) / u;
        ink(g, u, 'rgba(255,224,160,' + ((k ? 0.11 : 0.22) * a) + ')', 0.7);
        g.beginPath(); g.ellipse(0, 0, hr, hr * 0.94, 0, 0, TAU); g.stroke();
      }
    }
    if (sp2 < 2.6) {
      var fr = Math.max(Rs, 1.15 / u);
      g.fillStyle = 'rgba(255,214,132,' + (0.42 * a) + ')';
      g.beginPath(); g.arc(0, 0, fr * 2.6, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,248,220,' + (0.97 * a) + ')';
      g.beginPath(); g.arc(0, 0, fr, 0, TAU); g.fill();
    } else {
      if (sp2 < 300) {                               /* a body, not a wash: once
           the photosphere is wider than the frame the stipple carries it alone */
        g.fillStyle = 'rgba(168,116,58,' + (0.60 * a * (1 - sp2 / 300)) + ')';
        g.beginPath(); g.arc(0, 0, Rs, 0, TAU); g.fill();
      }
      var spotsOn = (sp2 > 34 && sp2 < 1400 && px(0.150 * Rs) <= 26);
      var G = granules(), any = 0;
      g.fillStyle = 'rgba(255,240,206,1)';
      for (i = 0; i < G.length; i += 5) {
        var gs = G[i + 2], gp = px(gs);
        if (gp < 0.4 || gp > 3.2) continue;
        var q4 = G[i + 3], mu = Math.sqrt(Math.max(0, 1 - q4 * q4));
        if (spotsOn) {                               /* leave the paper bare */
          var hid = 0;
          for (var sq = 0; sq < SPOTS.length; sq++) {
            var hx = G[i] - SPOTS[sq][0], hy = G[i + 1] - SPOTS[sq][1];
            var h2 = hx * hx + hy * hy, hb = SPOTS[sq][2] * 1.32;
            if (h2 > hb * hb) continue;              /* cheap reject first */
            var he = spotR(SPOTS[sq], Math.atan2(hy, hx));
            if (h2 < he * he) { hid = 1; break; }
          }
          if (hid) continue;
        }
        /* limb darkening cut deep: the disc must fall away hard at its edge or
           it reads as a flat cookie instead of a sphere */
        g.globalAlpha = a * (0.03 + 0.97 * mu * mu * mu) * G[i + 4];
        if (gp > 1.4) { g.beginPath(); g.arc(G[i] * Rs, G[i + 1] * Rs, gs * 0.62, 0, TAU); g.fill(); }
        else g.fillRect(G[i] * Rs - gs * 0.5, G[i + 1] * Rs - gs * 0.5, gs, gs);
        any++;
      }
      g.globalAlpha = 1;
      if (!any) {
        g.fillStyle = 'rgba(255,242,206,' + (0.92 * a) + ')';
        g.beginPath(); g.arc(0, 0, Rs * 0.97, 0, TAU); g.fill();
      }
      if (spotsOn) {
        var sr = rng(1567);
        for (k = 0; k < SPOTS.length; k++) {
          var ux = SPOTS[k][0] * Rs, uy = SPOTS[k][1] * Rs, ss = SPOTS[k][2] * Rs;
          g.fillStyle = 'rgba(20,13,5,' + (0.85 * a) + ')';
          g.beginPath();
          for (var q3 = 0; q3 <= 56; q3++) {
            var t3 = q3 / 56 * TAU, e3 = spotR(SPOTS[k], t3) * Rs;
            var px3 = ux + Math.cos(t3) * e3, py3 = uy + Math.sin(t3) * e3;
            if (q3) g.lineTo(px3, py3); else g.moveTo(px3, py3);
          }
          g.fill();
          if (SPOTS[k][2] > 0.04) {                  /* only the big ones earn a penumbra:
               fine filaments, kept short, so it reads as fibre round a dark
               core and not as a starburst */
            var spokes = px(ss) > 8 ? 30 : 18;
            ink(g, u, 'rgba(212,164,102,' + (0.40 * a) + ')', 0.8);
            for (var q2 = 0; q2 < spokes; q2++) {
              var qa = q2 / spokes * TAU + sr() * 0.10;
              var eq = spotR(SPOTS[k], qa) * Rs;   /* the fibrils follow the blot */
              var f0 = 1.02 + 0.06 * sr(), f1 = 1.40 + 0.24 * sr();
              g.beginPath();
              g.moveTo(ux + Math.cos(qa) * eq * f0, uy + Math.sin(qa) * eq * f0);
              g.lineTo(ux + Math.cos(qa) * eq * f1, uy + Math.sin(qa) * eq * f1);
              g.stroke();
            }
          }
        }
      }
      ink(g, u, 'rgba(255,232,180,' + (0.55 * a) + ')', 1.0);
      g.beginPath(); g.arc(0, 0, Rs, 0, TAU); g.stroke();
    }

    g.globalAlpha = 1;
    g.setLineDash([]);
    g.globalCompositeOperation = 'source-over';
    g.restore();
  };
})();

/* ═══ 14  THE COMET HALO ══════════════════════════════════════════════════ */
PlateArt.comets = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(89);
  const c = g.createRadialGradient(0, 0, 0, 0, 0, 0.055);
  c.addColorStop(0, `rgba(255,240,200,${0.75 * a})`); c.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = c; g.beginPath(); g.arc(0, 0, 0.055, 0, 6.283); g.fill();
  for (let i = 0; i < 340; i++) {                       // the shell — dirty ice, everywhere
    const th = r() * 6.283, rr = 0.16 + Math.pow(r(), 0.6) * 0.34;
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr * (0.86 + r() * 0.2);
    const b = Math.pow(r(), 2);
    g.fillStyle = `rgba(206,220,236,${(0.06 + 0.42 * b) * a})`;
    g.beginPath(); g.arc(x, y, 0.0018 + b * 0.006, 0, 6.283); g.fill();
    if (b > 0.86) {                                     // one or two with a tail
      tfStroke(g, `rgba(190,214,236,${0.16 * a})`, 0.0018);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x * 1.14, y * 1.14); g.stroke();
    }
  }
  grain(g, u, a, 89, 'rgba(200,214,236,1)', 0.22, true);
  smudge(g, anchor, 0.026, '246,228,178', a * 0.9, 89);
  g.restore();
};

/* ═══ 17  THE LOCAL STARS ═════════════════════════════════════════════════ */
PlateArt.localstars = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(97);
  for (let i = 0; i < 30; i++) {
    const x = (r() - 0.5) * 0.94, y = (r() - 0.5) * 0.94, m = Math.pow(r(), 2.2);
    const s = 0.004 + m * 0.016;
    const tint = r() > 0.6 ? '255,214,150' : '196,214,255';
    const gr = g.createRadialGradient(x, y, 0, x, y, s * 4.5);
    const tw = 0.86 + 0.14 * Math.sin(t * 1.4 + i * 2.1);
    gr.addColorStop(0, `rgba(${tint},${(0.55 + 0.4 * m) * a * tw})`); gr.addColorStop(1, `rgba(${tint},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 4.5, 0, 6.283); g.fill();
    if (m > 0.5) {
      tfStroke(g, `rgba(${tint},${0.30 * a})`, 0.0022);
      g.beginPath(); g.moveTo(x - s * 3, y); g.lineTo(x + s * 3, y);
      g.moveTo(x, y - s * 3); g.lineTo(x, y + s * 3); g.stroke();
    }
  }
  grain(g, u, a, 97, 'rgba(206,214,236,1)', 0.24, true);
  smudge(g, anchor, 0.024, '255,226,170', a * 0.95, 97);
  g.restore();
};

/* ═══ 20  THE SPIRAL ARM ══════════════════════════════════════════════════ */
PlateArt.arm = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(101);
  /* a stretch of one arm, seen from within: a lane of dust with the young blue
     clusters strung along its lit edge. */
  const band = g.createLinearGradient(0, -0.28, 0, 0.28);
  band.addColorStop(0, 'rgba(60,66,96,0)');
  band.addColorStop(0.42, `rgba(96,102,140,${0.20 * a})`);
  band.addColorStop(0.56, `rgba(28,24,34,${0.44 * a})`);       // the dust lane, dark
  band.addColorStop(1, 'rgba(60,66,96,0)');
  g.save(); g.rotate(-0.28);
  g.fillStyle = band; g.fillRect(-0.75, -0.28, 1.5, 0.56);
  for (let i = 0; i < 900; i++) {                               // the field stars
    const x = (r() - 0.5) * 1.4, y = (r() - 0.5) * 0.52;
    const near = Math.exp(-Math.pow((y + 0.02) / 0.20, 2));
    const b = Math.pow(r(), 2.6);
    g.fillStyle = r() > 0.88 ? `rgba(180,206,255,${(0.14 + 0.6 * b) * near * a})`
                             : `rgba(240,228,200,${(0.08 + 0.4 * b) * near * a})`;
    g.fillRect(x, y, 0.0026, 0.0026);
  }
  for (let i = 0; i < 9; i++) {                                 // the young clusters
    const x = -0.6 + r() * 1.2, y = -0.10 + (r() - 0.5) * 0.10;
    const gl = g.createRadialGradient(x, y, 0, x, y, 0.055);
    gl.addColorStop(0, `rgba(170,206,255,${0.30 * a})`); gl.addColorStop(1, 'rgba(170,206,255,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, 0.055, 0, 6.283); g.fill();
  }
  g.restore();
  grain(g, u, a, 101, 'rgba(190,196,226,1)', 0.26, true);
  smudge(g, anchor, 0.024, '236,226,196', a * 0.95, 101);
  g.restore();
};

/* ═══ 21  THE GALAXY ══════════════════════════════════════════════════════ */
PlateArt.galaxy = (function () {
  'use strict';

  const TAU = 6.283185307179586;
  const INC = 0.80;          /* tilt: the minor axis, as a fraction of the major */
  const TANP = Math.tan(0.36);   /* the arms' pitch angle, ~21 degrees — open
                                    enough that the arms SWEEP out and dissolve
                                    rather than closing back into a ring */
  const RBAR = 0.132;            /* the bar's half-length */

  function ss(e0, e1, x) { const q = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return q * q * (3 - 2 * q); }

  /* integer hash — the lattice's only source of randomness, so the same cell
     always holds the same star no matter what magnification found it. */
  function hsh(i, j, k) {
    let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1274126177)) | 0;
    h = (h ^ (h >>> 13)) | 0;
    h = Math.imul(h, 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hsh(xi, yi, s), b = hsh(xi + 1, yi, s), c = hsh(xi, yi + 1, s), d = hsh(xi + 1, yi + 1, s);
    const t0 = a + (b - a) * ux, t1 = c + (d - c) * ux;
    return t0 + (t1 - t0) * uy;
  }
  function fbm(x, y, f, oct, seed) {
    let sum = 0, norm = 0, amp = 1;
    for (let o = 0; o < oct; o++) { sum += amp * vnoise(x * f, y * f, seed + o * 37); norm += amp; f *= 2.7; amp *= 0.60; }
    return sum / norm;
  }

  /* ── the disc's OWN noise lattice ──────────────────────────────────────────
     Value noise on (something-radial, AZIMUTH), where the azimuth axis WRAPS
     at an integer cell count so there is no seam at atan2's cut. This is the
     coordinate the dust has to be authored in: a cell is a SECTOR, so it stays
     self-similar all the way down to the nucleus (it still has filaments at
     300x), and — unlike a pair of radial axes — it is genuinely TWO-dimensional
     at every radius. Sampling both axes off the radius is what collapses a lane
     field into concentric tree rings, which is the one thing this plate must
     not do at the blow-up. */
  function vnoiseW(x, yq, s, per) {
    const xi = Math.floor(x), fx = x - xi;
    const yi = Math.floor(yq), fy = yq - yi;
    const j0 = ((yi % per) + per) % per, j1 = (((yi + 1) % per) + per) % per;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hsh(xi, j0, s), b = hsh(xi + 1, j0, s), c = hsh(xi, j1, s), d = hsh(xi + 1, j1, s);
    const t0 = a + (b - a) * ux, t1 = c + (d - c) * ux;
    return t0 + (t1 - t0) * uy;
  }
  /* octaves TRIPLE — an integer ratio, so every octave keeps wrapping cleanly */
  function fbmW(x, ang, f, per, oct, seed) {
    let sum = 0, norm = 0, amp = 1;
    for (let o = 0; o < oct; o++) {
      sum += amp * vnoiseW(x * f, ang * per, seed + o * 37, per);
      norm += amp; f *= 3; per *= 3; amp *= 0.58;
    }
    return sum / norm;
  }

  /* ── the field ─────────────────────────────────────────────────────────────
     one evaluation fills these; no allocation in the hot loop. */
  let PH0 = 0, F_R = 0, F_dens = 0, F_arm = 0, F_warm = 0, F_dust = 0, F_SP = 0, F_ANG = 0;

  /* the spiral coordinate: constant along an arm. The wobble terms are what
     keep the arms from being a pair of perfect mathematical curves — they open
     a spur here, pinch a shoulder there, and make the two arms differ, which is
     the difference between a drawn galaxy and a plotted one. */
  function spiral(R, ph) {
    const lr = Math.log(R > 1e-7 ? R : 1e-7);
    return ph - lr / TANP
         + 0.155 * Math.sin(3.1 * lr + 1.2)
         + 0.085 * Math.sin(7.3 * lr - 0.4)
         + 0.075 * Math.sin(ph + 2.0);
  }

  /* the inverse: WHERE is arm `k` at radius R. One Newton-ish pass is plenty —
     the only unsolved term is a 0.075-radian sine. */
  function armAngle(R, k, ph0) {
    const lr = Math.log(R > 1e-7 ? R : 1e-7);
    const p0 = ph0 + k * Math.PI + lr / TANP
             - 0.155 * Math.sin(3.1 * lr + 1.2) - 0.085 * Math.sin(7.3 * lr - 0.4);
    return p0 - 0.075 * Math.sin(p0 + 2.0);
  }

  function field(x, y) {
    const X = x, Y = y / INC;
    const R = Math.hypot(X, Y);
    F_R = R;
    const ph = Math.atan2(Y, X);
    F_ANG = (ph + Math.PI) * (1 / TAU);        /* 0..1, the wrapping azimuth */
    const lr0 = Math.log(R > 1e-7 ? R : 1e-7);
    const sp = spiral(R, ph);
    F_SP = sp;
    const arm = Math.pow(0.5 + 0.5 * Math.cos(2 * (sp - PH0)), 4.0);
    F_arm = arm;

    /* the arms spring from the ENDS OF THE BAR, which is what makes a barred
       spiral barred and not a ringed one. The outer fade is a fade and not a
       cut, so the arms sweep out and dissolve instead of simply stopping. */
    const outer = Math.exp(-Math.pow(R / 0.492, 3.0));
    const win = ss(RBAR * 0.72, RBAR * 1.25, R) * outer;

    /* SPURS — short feathers at a much steeper pitch, bridging the two arms.
       Patchy (the sine sum is a cheap stand-in for noise in the hot loop) so
       they read as feathering rather than as a second pair of arms. A real
       disc has no clean paper between its arms. */
    const sp2 = ph - lr0 / 1.05;
    const gsp = 0.5 + 0.5 * Math.sin(2.3 * sp + 5.1 * lr0 + 0.7);
    const feath = Math.pow(0.5 + 0.5 * Math.cos(2 * (sp2 + 0.7)), 7) * gsp;

    const disc = Math.exp(-R / 0.265) * (0.54 + 4.75 * arm * win + 0.34 * feath * win) * outer;

    /* the bar: boxy-ended (a high exponent) and a true lozenge rather than a
       needle — and no longer swamped, because the bulge is now compact enough
       that the bar's ENDS stick out of it. That is what makes the eye read
       'barred' instead of 'a spiral with a bright middle'. */
    const eb = Math.sqrt((X / RBAR) * (X / RBAR) + (Y / 0.036) * (Y / 0.036));
    const bar = 2.50 * Math.exp(-Math.pow(eb, 3.0));
    const bulge = 1.70 * Math.exp(-Math.pow(R / 0.034, 0.95));
    /* the cusp: three decades of it, so the plate keeps drawing something all
       the way in. It is the only reason the 300x panel is a picture and not a
       field of even speckle — the nucleus rises out of the middle of it. */
    const nuc = 1.4 * Math.exp(-R / 0.0042)
              + 2.6 * Math.exp(-R / 0.00060)
              + 6.5 * Math.exp(-R / 0.00013);
    const halo = 0.055 * Math.exp(-Math.hypot(x, y * 1.06) / 0.20);

    const hot = bar + bulge + nuc;
    F_dens = disc + hot + halo;
    F_warm = hot / (F_dens + 1e-6);

    /* dust: on the arms' inner edge, down the bar's leading edges, and a
       nuclear spiral that never runs out. */
    const armIn = Math.pow(0.5 + 0.5 * Math.cos(2 * (sp - PH0 + 0.40)), 2.6);
    /* THE BAR'S LEADING DUST LANES. Not a mirrored pair — the real thing is
       POINT-symmetric: the lane rides one edge of the bar on one side of the
       nucleus and the other edge on the other, so the pair reads as a single
       shallow S drawn down the bar and handed off to the arms at its ends.
       The tanh is that swap, smoothed so it crosses at the nucleus. */
    const lo = 0.020 * Math.tanh(X / 0.028);
    const lane = 1.70 * Math.exp(-Math.pow((Y - lo) / 0.0082, 2))
               * Math.exp(-Math.pow(X / (RBAR * 1.04), 4));
    F_dust = (win * (0.22 + 2.35 * armIn) + lane + 1.05 * Math.exp(-R / 0.020))
           * Math.exp(-Math.pow(R / 0.40, 3.0));
  }

  /* ── the plate ─────────────────────────────────────────────────────────── */
  return function (g, u, a, t, anchor) {
    g.save();
    g.scale(u, u);

    /* a bounded sway, not a drift: the plate breathes, but the anchor stays put
       (the arm phase is re-solved from the anchor every frame, below). */
    const th = -0.38 + Math.sin(t * 0.055) * 0.010;
    g.rotate(th);
    const cs = Math.cos(th), sn = Math.sin(th);

    const A = anchor || [-0.19, -0.14];
    const ax = A[0] * cs + A[1] * sn, ay = -A[0] * sn + A[1] * cs;   /* into the tilted frame */
    const aX = ax, aY = ay / INC;
    const aR = Math.max(0.02, Math.hypot(aX, aY));
    PH0 = spiral(aR, Math.atan2(aY, aX));                            /* an arm, exactly here */

    /* ── the visible window, read off the glass itself ─────────────────────
       everything below is iterated over THIS, which is what keeps a 300x
       blow-up the same cost as the plate at rest. */
    let x0 = -0.58, y0 = -0.58, x1 = 0.58, y1 = 0.58;
    try {
      const M = g.getTransform(), inv = M.inverse();
      const W = g.canvas.width, H = g.canvas.height;
      let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      const C = [0, 0, W, 0, 0, H, W, H];
      for (let k = 0; k < 8; k += 2) {
        const px = inv.a * C[k] + inv.c * C[k + 1] + inv.e;
        const py = inv.b * C[k] + inv.d * C[k + 1] + inv.f;
        if (px < mnx) mnx = px; if (px > mxx) mxx = px;
        if (py < mny) mny = py; if (py > mxy) mxy = py;
      }
      x0 = Math.max(x0, mnx - 0.002); x1 = Math.min(x1, mxx + 0.002);
      y0 = Math.max(y0, mny - 0.002); y1 = Math.min(y1, mxy + 0.002);
    } catch (e) { /* no transform to read: fall back to the whole plate */ }

    /* ── the unresolved bed ────────────────────────────────────────────────
       ONLY while the plate is a mote — while its stars genuinely cannot be told
       apart. By its own decade it is already gone and the stipple carries the
       whole picture, so a wash can never be what the glass magnifies. */
    const wS = Math.min(1, Math.max(0, (2.45 - Math.log(u) / Math.LN10) / 0.95));
    if (wS > 0.01) {
      const w = wS * a;
      g.save(); g.scale(1, INC);
      const gd = g.createRadialGradient(0, 0, 0.02, 0, 0, 0.46);
      gd.addColorStop(0, 'rgba(206,204,228,' + (0.66 * w) + ')');
      gd.addColorStop(0.42, 'rgba(132,146,194,' + (0.21 * w) + ')');
      gd.addColorStop(1, 'rgba(112,126,175,0)');
      g.fillStyle = gd; g.beginPath(); g.arc(0, 0, 0.46, 0, TAU); g.fill();
      g.restore();

      /* the two arms, laid in as soft sweeps — this is what makes the 15 px
         mote read as a SPIRAL and not a smudge of light. */
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let arm = 0; arm < 2; arm++) {
        g.beginPath();
        for (let k = 0; k <= 40; k++) {
          const R = RBAR * 0.9 * Math.exp(k / 40 * Math.log(0.43 / (RBAR * 0.9)));
          const p = armAngle(R, arm, PH0);
          const X = Math.cos(p) * R, Y = Math.sin(p) * R * INC;
          if (k === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
        }
        g.strokeStyle = 'rgba(150,180,236,' + (0.80 * w) + ')'; g.lineWidth = 0.062; g.stroke();
        g.strokeStyle = 'rgba(222,236,255,' + (0.76 * w) + ')'; g.lineWidth = 0.017; g.stroke();
      }
    }
    /* the bulge's own unresolved light — gated on the size it lands at, so it
       leaves the frame long before the blow-up can smear it. */
    if (0.135 * u < 1100) {
      const wc = a * Math.min(1, 0.30 + 0.85 * wS);
      g.save(); g.scale(1, 0.92);
      let gc = g.createRadialGradient(0, 0, 0, 0, 0, 0.135);
      gc.addColorStop(0, 'rgba(255,230,178,' + (0.62 * wc) + ')');
      gc.addColorStop(0.40, 'rgba(255,206,130,' + (0.15 * wc) + ')');
      gc.addColorStop(1, 'rgba(255,192,110,0)');
      g.fillStyle = gc; g.beginPath(); g.arc(0, 0, 0.135, 0, TAU); g.fill();
      g.restore();
      gc = g.createRadialGradient(0, 0, 0, 0, 0, 0.030);
      gc.addColorStop(0, 'rgba(255,248,226,' + (0.98 * wc) + ')');
      gc.addColorStop(1, 'rgba(255,214,150,0)');
      g.fillStyle = gc; g.beginPath(); g.arc(0, 0, 0.030, 0, TAU); g.fill();
    }

    /* ── the field of stars ────────────────────────────────────────────────
       a jittered lattice, sized so one cell is ~2.3 px on the glass right now.
       Every cell carries one star and one grain of dust. */
    const w = x1 - x0, h = y1 - y0;
    if (w > 0 && h > 0) {
      const CAP = 260000;
      /* THE LATTICE IS DYADIC IN UNIT SPACE — cells of exactly 2^-j, never a
         size fitted continuously to u. That is what makes a dive hold still:
         inside an octave the cell does not move, so a star found at one
         magnification is at precisely the same place at the next and the field
         REFINES instead of swimming. The octave is chosen so that a cell lands
         near 2.3 px on the glass as it is right now. */
      let cell = Math.pow(2, -Math.round(Math.log2(u / 2.30)));
      let nx = Math.ceil(w / cell), ny = Math.ceil(h / cell);
      while (nx * ny > CAP) { cell *= 2; nx = Math.ceil(w / cell); ny = Math.ceil(h / cell); }
      /* the price of a dyadic ladder is that a cell's size on the glass swings
         over a full factor of two, which would swing the stars-per-screen-area
         by FOUR and make the plate pump brighter and dimmer as you fall through
         it. So a cell emits stars in proportion to its own area: the count per
         cell moves, the count per square of glass does not. Brightness is left
         out of it — cell size decides HOW MANY stars, never how bright each is. */
      const gpx = cell * u;
      const DFAC = Math.min(2.3, Math.max(0.45, (gpx / 2.30) * (gpx / 2.30)));
      const dot = Math.max(cell * 0.34, 1.15 / u);      /* a star is ~1.2 px, always */
      const dsk = Math.max(cell * 0.62, 2.5 / u);       /* a grain of dust, a shade larger */
      const i0 = Math.floor(x0 / cell), i1 = Math.ceil(x1 / cell);
      const j0 = Math.floor(y0 / cell), j1 = Math.ceil(y1 / cell);

      /* dust structure is authored relative to the cell — always legible, never
         aliased — and blended with a LOG-POLAR fbm, which is self-similar in R
         and so still has filaments at the bottom of the nucleus. */
      const fc = 0.055 / cell;

      /* buckets: one fillStyle set per bucket instead of one per star. */
      const PAL = ['233,220,192', '255,216,152', '166,200,255', '255,178,188', '7,8,13'];
      const NA = 20, NB = PAL.length * NA;
      const BX = new Array(NB), BY = new Array(NB), ST = new Array(NB);
      for (let k = 0; k < NB; k++) {
        BX[k] = null;
        ST[k] = 'rgba(' + PAL[(k / NA) | 0] + ',' + (((k % NA) + 0.5) / NA).toFixed(3) + ')';
      }
      const bright = [];

      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const x = (i + hsh(i, j, 1)) * cell, y = (j + hsh(i, j, 2)) * cell;
          field(x, y);
          const dens = F_dens;
          if (dens < 0.010) continue;
          const R = F_R, arm = F_arm, warm = F_warm;

          /* dust is a LANE, not a haze: only the top of the noise is cloud, so
             the field between the lanes stays wide open and the lanes read as
             drawn structure. */
          let ext = 1, dv = 0;
          if (F_dust > 0.05) {
            const lr = Math.log(R > 2.4e-5 ? R : 2.4e-5);
            /* sampled in the SPIRAL coordinate, so the cloud is drawn out into
               filaments that wind the way the arms wind, instead of blobbing. */
            const ang = F_ANG;
            /* DOMAIN WARP. The lane skeleton is a threshold of noise in the
               spiral coordinate — but that coordinate is a function of radius
               far more strongly than of angle, so a clean sample of it yields a
               family of parallel curves: tree rings. Perturbing the spiral
               phase by a low octave of the disc's own noise before thresholding
               lets the lanes wander across each other's radii, so they wind and
               merge rather than nest. */
            const wp = fbmW(lr * 0.40, ang, 1.0, 3, 2, 733) - 0.5;
            const spW = F_SP + wp * 1.15;
            /* the skeleton, sampled with the ANGLE as its second axis — the fix
               for the rings — plus a fine cartesian octave that only chews the
               lane edges. */
            const n = 0.54 * fbmW(spW * 1.35, ang, 1.0, 5, 3, 911)
                    + 0.16 * fbmW(lr * 0.80, ang, 1.0, 15, 2, 401)
                    + 0.30 * fbm(x, y, fc, 3, 307);
            /* and a slow independent gate, so lanes TERMINATE and branch part
               way across the frame instead of every one running edge to edge. */
            const gate = ss(0.30, 0.66, fbmW(lr * 0.52, ang, 1.0, 7, 2, 1277));
            dv = F_dust * ss(0.47, 0.80, n) * (0.50 + 0.50 * gate);
            if (dv > 0) ext = Math.exp(-3.6 * dv);
          }

          /* THE STARS OF THIS CELL. Dust does not paint grey over them — it
             takes them OUT, which is what makes a lane read as a lane even
             where there is no lit bed behind it. And where the field is dense
             the cell holds more than one, so the nucleus can go on rising
             after every star in it is already lit. */
          /* the ladder deliberately does NOT clip early: at the old gains every
             cell from the mid-disc inward sat at prob = 1 AND tone = 1, so the
             bar, the bulge and the inner disc all drew the same saturated
             stipple and the bar could not be seen at all. */
          const de = dens * DFAC;                      /* density PER CELL */
          const prob = Math.min(1, de * 1.10) * Math.pow(ext, 0.65);
          /* the multi-star channel is what lets the bar and the core go on
             rising after every cell in them is already lit — but it is also
             the entire cost of this plate, and inside the nucleus (where it
             saturates everywhere at once) it buys no contrast whatever, only
             ink. Capped low and started late: it separates the bar from the
             disc, which is the one place it has real work to do. */
          const extra = de > 0.95 ? Math.min(4, ((de - 0.95) * 0.80) | 0) : 0;
          const tone = Math.min(1, 0.26 + 0.50 * dens) * Math.pow(ext, 0.5);
          for (let e = 0; e <= extra; e++) {
            if (hsh(i, j, 61 + e * 5) > prob) continue;
            const b = e ? hsh(i, j, 62 + e * 5) : hsh(i, j, 3);
            const q = e ? hsh(i, j, 63 + e * 5) : hsh(i, j, 4);
            const sx = e ? (i + hsh(i, j, 64 + e * 5)) * cell : x;
            const sy = e ? (j + hsh(i, j, 65 + e * 5)) * cell : y;
            /* a WIDER magnitude ladder — more genuinely faint stars beneath a
               few genuinely bright ones. The spread is bought in BRIGHTNESS
               only; the mark stays ~1.2 px, because a star is a property of the
               ink and not of the cell that placed it, and fat cell-sized discs
               are bokeh rather than a star field. */
            let al = a * (0.11 + 2.05 * Math.pow(b, 3.3)) * tone;
            if (al < 0.004) continue;
            let p = 0;
            if (q < 0.09 + 0.52 * arm * (1 - warm)) p = 2;
            else if (q > 0.93 - 0.55 * warm) p = 1;
            if (ext < 0.62 && p === 2) p = 0;
            if (ext < 0.40 && p === 0) p = 1;
            if (b > 0.9955 && a > 0.22) { bright.push(sx, sy, Math.min(1, al * 1.6), p); continue; }
            if (al > 1) al = 1;
            const k = p * NA + Math.min(NA - 1, (al * NA) | 0);
            let A1 = BX[k]; if (!A1) { A1 = BX[k] = []; BY[k] = []; }
            A1.push(sx); BY[k].push(sy);
          }
          /* the grain of dust itself — dark ink over whatever light is behind */
          if (dv > 0.06) {
            const da = a * Math.min(0.78, 1.7 * dv) * Math.min(1, 0.24 + 0.55 * dens);
            if (da > 0.02) {
              const k = 4 * NA + Math.min(NA - 1, (da * NA) | 0);
              let A2 = BX[k]; if (!A2) { A2 = BX[k] = []; BY[k] = []; }
              A2.push((i + hsh(i, j, 5)) * cell); BY[k].push((j + hsh(i, j, 6)) * cell);
            }
          }
        }
      }
      for (let k = 0; k < NB; k++) {
        const A3 = BX[k]; if (!A3 || !A3.length) continue;
        const B3 = BY[k], s = (k >= 4 * NA) ? dsk : dot, o = s * 0.5;
        g.fillStyle = ST[k];
        for (let m = 0; m < A3.length; m++) g.fillRect(A3[m] - o, B3[m] - o, s, s);
      }
      /* the few stars this plate can actually resolve */
      for (let m = 0; m < bright.length; m += 4) {
        const x = bright[m], y = bright[m + 1], al = bright[m + 2], c = PAL[bright[m + 3]];
        g.fillStyle = 'rgba(' + c + ',' + (al * 0.30).toFixed(3) + ')';
        g.beginPath(); g.arc(x, y, dot * 2.6, 0, TAU); g.fill();
        g.fillStyle = 'rgba(' + c + ',' + al.toFixed(3) + ')';
        g.beginPath(); g.arc(x, y, dot * 1.05, 0, TAU); g.fill();
      }
    }

    /* ── the star-forming knots strung along the arms ──────────────────────
       features of a fixed size, so they are drawn only while that size is a
       thing the glass can see. */
    if (a > 0.2 && 0.0040 * u > 1.0 && 0.0040 * u < 200) {
      for (let n = 0; n < 58; n++) {
        const rr = 0.150 + hsh(n, 7, 11) * 0.265;
        const arm = n & 1;
        const p = armAngle(rr, arm, PH0) + (hsh(n, 9, 12) - 0.5) * 0.26;
        const X = Math.cos(p) * rr, Y = Math.sin(p) * rr * INC;
        const s = 0.0022 + hsh(n, 11, 13) * 0.0038;
        const rose = hsh(n, 13, 14) > 0.42;
        const c = rose ? '255,164,176' : '182,212,255';
        const gr = g.createRadialGradient(X, Y, 0, X, Y, s * 2.7);
        gr.addColorStop(0, 'rgba(' + c + ',' + (0.20 * a) + ')');
        gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr; g.beginPath(); g.arc(X, Y, s * 2.7, 0, TAU); g.fill();
        g.fillStyle = 'rgba(' + c + ',' + (0.26 * a) + ')';
        g.beginPath(); g.arc(X, Y, s * 0.42, 0, TAU); g.fill();
      }
    }

    /* ── the anchor: an OB association on the arm that runs through it ─────
       the child does not land on the plate, it comes out of this knot. */
    if (0.030 * u > 1.2 && 0.030 * u < 2600) {
      const gr = g.createRadialGradient(ax, ay, 0, ax, ay, 0.040);
      gr.addColorStop(0, 'rgba(255,184,192,' + (0.15 * a) + ')');
      gr.addColorStop(0.45, 'rgba(196,206,255,' + (0.09 * a) + ')');
      gr.addColorStop(1, 'rgba(180,200,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(ax, ay, 0.040, 0, TAU); g.fill();

      g.strokeStyle = 'rgba(8,9,14,' + (0.50 * a) + ')'; g.lineWidth = 0.009; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(ax - 0.036, ay + 0.020);
      g.quadraticCurveTo(ax - 0.004, ay + 0.008, ax + 0.030, ay + 0.016);
      g.stroke();

      for (let n = 0; n < 46; n++) {
        const dth = hsh(n, 17, 21) * TAU, dr = Math.pow(hsh(n, 19, 22), 0.48) * 0.025;
        const X = ax + Math.cos(dth) * dr, Y = ay + Math.sin(dth) * dr * 0.86;
        const b = hsh(n, 23, 24), s = 0.0013 + b * b * 0.0026;
        g.fillStyle = 'rgba(' + (b > 0.72 ? '224,236,255' : '176,204,255') + ',' + ((0.13 + 0.42 * b) * a).toFixed(3) + ')';
        g.beginPath(); g.arc(X, Y, s, 0, TAU); g.fill();
        if (b > 0.955) {
          g.strokeStyle = 'rgba(214,230,255,' + (0.20 * a) + ')'; g.lineWidth = 0.0012;
          g.beginPath();
          g.moveTo(X - 0.010, Y); g.lineTo(X + 0.010, Y);
          g.moveTo(X, Y - 0.010); g.lineTo(X, Y + 0.010); g.stroke();
        }
      }
    }

    /* ── the globular halo — a scatter of clusters standing off the disc ──── */
    if (a > 0.2 && u < 4200) {
      for (let n = 0; n < 30; n++) {
        const rr = 0.19 + Math.pow(hsh(n, 31, 41), 0.7) * 0.31;
        const p = hsh(n, 37, 42) * TAU;
        const X = Math.cos(p) * rr, Y = Math.sin(p) * rr * 0.94;
        const s = 0.0014 + hsh(n, 41, 43) * 0.0024, al = 0.16 + 0.20 * hsh(n, 43, 44);
        const gr = g.createRadialGradient(X, Y, 0, X, Y, s * 3.0);
        gr.addColorStop(0, 'rgba(240,230,204,' + (al * a) + ')');
        gr.addColorStop(1, 'rgba(240,230,204,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(X, Y, s * 3.0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(246,238,216,' + (al * 1.5 * a) + ')';
        g.beginPath(); g.arc(X, Y, s * 0.40, 0, TAU); g.fill();
      }
    }

    /* ── stars of OUR OWN galaxy, in front of the plate ────────────────────
       A handful of near stars with a real glow and a faint diffraction cross,
       sitting visibly in FRONT of the wheel. They cost almost nothing and they
       are the one thing that tells the eye the spiral is far away — without
       them the whole plate sits flat on the paper. Placed off the disc, so
       they never read as members of it. */
    if (a > 0.2 && u < 5200) {
      for (let n = 0; n < 8; n++) {
        const p = hsh(n, 53, 71) * TAU;
        const rr = 0.30 + hsh(n, 59, 72) * 0.24;
        const X = Math.cos(p) * rr, Y = Math.sin(p) * rr * 0.98;
        const b = hsh(n, 61, 73);
        const s = 0.0032 + b * 0.0030;
        const c = b > 0.55 ? '255,232,196' : '214,230,255';
        const gr = g.createRadialGradient(X, Y, 0, X, Y, s * 4.2);
        gr.addColorStop(0, 'rgba(' + c + ',' + (0.30 * a).toFixed(3) + ')');
        gr.addColorStop(0.35, 'rgba(' + c + ',' + (0.09 * a).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr; g.beginPath(); g.arc(X, Y, s * 4.2, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(' + c + ',' + (0.16 * a).toFixed(3) + ')';
        g.lineWidth = 0.0011; g.lineCap = 'round';
        const sk = s * 3.4;
        g.beginPath();
        g.moveTo(X - sk, Y); g.lineTo(X + sk, Y);
        g.moveTo(X, Y - sk); g.lineTo(X, Y + sk); g.stroke();
        g.fillStyle = 'rgba(255,252,244,' + (0.86 * a).toFixed(3) + ')';
        g.beginPath(); g.arc(X, Y, s * 0.46, 0, TAU); g.fill();
      }
    }

    g.restore();
  };
})();

/* ═══ 23  THE LOCAL GROUP ═════════════════════════════════════════════════ */
PlateArt.localgroup = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(107);
  const G = [[-0.18, 0.06, 0.075, 0.62], [0.20, -0.10, 0.085, 0.44], [0.02, 0.26, 0.030, 0.9]];
  for (const [x, y, rr, tilt] of G) {                    // the two great spirals + M33
    g.save(); g.translate(x, y); g.rotate(tilt * 3.1);
    const c = g.createRadialGradient(0, 0, 0, 0, 0, rr);
    c.addColorStop(0, `rgba(255,238,204,${0.55 * a})`); c.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, rr, rr * tilt, 0, 0, 6.283); g.fill();
    for (let i = 0; i < 320; i++) {
      const q = 0.3 + r() * 2.2, ra = rr * 0.22 * Math.exp(0.42 * q * 1.9);
      if (ra > rr * 1.5) continue;
      const th = q * 2 + (r() > 0.5 ? Math.PI : 0) + (r() - 0.5) * 0.4;
      g.fillStyle = `rgba(220,216,232,${0.28 * a})`;
      g.fillRect(Math.cos(th) * ra, Math.sin(th) * ra * tilt, 0.0022, 0.0022);
    }
    g.restore();
  }
  for (let i = 0; i < 34; i++) {                          // the dwarf attendants
    const x = (r() - 0.5) * 0.9, y = (r() - 0.5) * 0.9;
    g.fillStyle = `rgba(214,208,226,${(0.06 + 0.16 * r()) * a})`;
    g.beginPath(); g.arc(x, y, 0.004 + r() * 0.006, 0, 6.283); g.fill();
  }
  grain(g, u, a, 107, 'rgba(206,200,226,1)', 0.24, true);
  smudge(g, anchor, 0.022, '236,224,206', a * 0.95, 107);
  g.restore();
};

/* ═══ 24  THE COSMIC WEB ══════════════════════════════════════════════════ */
PlateArt.web = function (g, u, a, t, anchor) {
  g.save(); g.scale(u, u); const r = tfRng(109);
  const N = [];
  for (let i = 0; i < 26; i++) N.push([(r() - 0.5) * 0.96, (r() - 0.5) * 0.96, 0.004 + Math.pow(r(), 2) * 0.020]);
  for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
    const dx = N[i][0] - N[j][0], dy = N[i][1] - N[j][1], L = Math.hypot(dx, dy);
    if (L > 0.32) continue;
    const al = (1 - L / 0.32) * 0.34 * a;
    tfStroke(g, `rgba(196,186,222,${al})`, 0.0022);
    g.beginPath(); g.moveTo(N[i][0], N[i][1]);
    g.quadraticCurveTo((N[i][0] + N[j][0]) / 2 + (r() - 0.5) * 0.06,
                       (N[i][1] + N[j][1]) / 2 + (r() - 0.5) * 0.06, N[j][0], N[j][1]);
    g.stroke();
  }
  for (const [x, y, s] of N) {
    const gr = g.createRadialGradient(x, y, 0, x, y, s * 5);
    gr.addColorStop(0, `rgba(240,214,190,${0.66 * a})`); gr.addColorStop(1, 'rgba(240,214,190,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 5, 0, 6.283); g.fill();
  }
  grain(g, u, a, 109, 'rgba(206,196,226,1)', 0.26, true);
  smudge(g, anchor, 0.022, '240,220,200', a * 0.95, 109);
  g.restore();
};

var WH_C0 = 0.34;                     /* coarsest filament cell, in unit space */
var WH_ZONE = [                       /* the redshift ladder, inner → horizon   */
  [136, 150, 174],                    /* cool fog                               */
  [178, 176, 166],                    /* parchment                              */
  [206, 184, 142]                     /* the warm edge of the reach             */
];

function whHash(i, j, k) {
  var h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 2246822519)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function whSs(e0, e1, x) {
  var v = (x - e0) / (e1 - e0);
  if (!(v > 0)) return 0;
  if (v > 1) return 1;
  return v * v * (3 - 2 * v);
}
/* smooth value noise on the hashed lattice */
function whVal(x, y, k) {
  var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  var a00 = whHash(i, j, k), a10 = whHash(i + 1, j, k);
  var a01 = whHash(i, j + 1, k), a11 = whHash(i + 1, j + 1, k);
  var lo = a00 + (a10 - a00) * sx, hi = a01 + (a11 - a01) * sx;
  return lo + (hi - lo) * sy;
}
/* THE DENSITY FIELD — where matter went and where it left. Its bands are pinned
   to the octave ladder itself, so neighbouring octaves share four of their five
   bands: the voids of the fine foam sit inside the voids of the coarse one, and
   the structure stays coherent while the scale runs away. */
function whFbm(x, y, n0) {
  var s = 0, lvl, sc, m;
  /* five bands, the coarsest sixteen cells wide: the great voids have to be
     GREAT, or the plate reads as busy wallpaper instead of a place */
  var W = [0.26, 0.30, 0.22, 0.14, 0.08];
  for (m = 0; m < 5; m++) {
    lvl = n0 - 4 + m;
    sc = WH_C0 * Math.pow(0.5, lvl);
    s += W[m] * whVal(x / sc, y / sc, 100 + ((lvl % 61) + 61));
  }
  return s;
}
/* the stipple only needs the voids at its own scale, and there are tens of
   thousands of it: two bands, not four */
function whFbm2(x, y, n0) {
  var s0 = WH_C0 * Math.pow(0.5, n0 - 2), s1 = s0 * 0.25;
  return 0.58 * whVal(x / s0, y / s0, 100 + (((n0 - 2) % 61) + 61)) +
         0.42 * whVal(x / s1, y / s1, 100 + ((n0 % 61) + 61));
}
/* the rectangle of unit space the canvas can actually see — so no octave ever
   generates a cell that could not be drawn */
function whWindow(g, u) {
  var L = 0.505, W = { x0: -L, x1: L, y0: -L, y1: L };
  try {
    var m = g.getTransform ? g.getTransform() : null;
    if (!m) return W;
    var det = m.a * m.d - m.b * m.c;
    if (!det) return W;
    var cw = g.canvas.width, ch = g.canvas.height;
    var xs = [], ys = [], px = [0, cw, 0, cw], py = [0, 0, ch, ch], i, dx, dy;
    for (i = 0; i < 4; i++) {
      dx = px[i] - m.e; dy = py[i] - m.f;
      xs.push((m.d * dx - m.c * dy) / det);
      ys.push((-m.b * dx + m.a * dy) / det);
    }
    /* the margin is a handful of PIXELS, so it stays a handful of pixels five
       orders of magnitude in — a fixed margin in unit space would be half a
       screen wide down here and would starve the plate of its own octaves */
    var mg = 8 / u;
    W.x0 = Math.max(-L, Math.min.apply(null, xs) - mg);
    W.x1 = Math.min(L, Math.max.apply(null, xs) + mg);
    W.y0 = Math.max(-L, Math.min.apply(null, ys) - mg);
    W.y1 = Math.min(L, Math.max.apply(null, ys) + mg);
    if (!(W.x1 > W.x0) || !(W.y1 > W.y0)) { W.x0 = -L; W.x1 = L; W.y0 = -L; W.y1 = L; }
  } catch (e) { /* no getTransform: fall back to the whole plate */ }
  return W;
}
/* how far in from the horizon a point is: 1 deep inside, 0 at the rim and past */
function whReach(x, y, R) {
  var rho = Math.sqrt(x * x + y * y);
  if (rho >= R) return 0;
  return 1 - whSs(R * 0.52, R * 0.995, rho);
}
function whZone(x, y, R) {
  var rho = Math.sqrt(x * x + y * y) / R;
  return rho < 0.62 ? 0 : (rho < 0.87 ? 1 : 2);
}

/* ONE OCTAVE OF FOAM — a jittered node per cell, joined to the neighbours the
   density field allows, batched into a dozen paths so a whole octave costs a
   dozen strokes however many filaments it holds. The field is sampled once per
   NODE, not once per edge; an edge takes the mean of its ends. */
function whOctave(g, u, a, t, c, k, oct, W, R, stip) {
  var i0 = Math.floor(W.x0 / c) - 1, i1 = Math.ceil(W.x1 / c) + 1;
  var j0 = Math.floor(W.y0 / c) - 1, j1 = Math.ceil(W.y1 / c) + 1;
  var ni = i1 - i0 + 1, nj = j1 - j0 + 1;
  if (ni * nj > 26000 || ni < 2 || nj < 2) return;
  var amax = a * oct * 1.05;
  if (amax < 0.0015) return;

  /* nodes first: position, density, reach */
  var NX = new Float64Array(ni * nj), NY = new Float64Array(ni * nj);
  var ND = new Float32Array(ni * nj), NR = new Float32Array(ni * nj);
  var ii, jj, p, x, y;
  for (ii = 0; ii < ni; ii++) {
    for (jj = 0; jj < nj; jj++) {
      p = ii * nj + jj;
      x = (i0 + ii + 0.5 + (whHash(i0 + ii, j0 + jj, 1) - 0.5) * 0.86) * c;
      y = (j0 + jj + 0.5 + (whHash(i0 + ii, j0 + jj, 2) - 0.5) * 0.86) * c;
      NX[p] = x; NY[p] = y;
      NR[p] = whReach(x, y, R);
      ND[p] = NR[p] > 0 ? whFbm(x, y, k) : 0;
    }
  }

  var NB = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var seg = [], kn = [], z, b, n, e, q, gq;
  for (z = 0; z < 12; z++) seg.push([]);
  for (z = 0; z < 3; z++) kn.push([]);
  var ax, ay, bx, by, mx, my, d, rc, al, len, bow, s;

  for (ii = 0; ii < ni; ii++) {
    for (jj = 0; jj < nj; jj++) {
      p = ii * nj + jj;
      if (NR[p] <= 0.004) continue;
      ax = NX[p]; ay = NY[p];
      for (n = 0; n < 4; n++) {
        e = NB[n];
        if (ii + e[0] >= ni || jj + e[1] >= nj || jj + e[1] < 0) continue;
        q = (ii + e[0]) * nj + (jj + e[1]);
        if (NR[q] <= 0.004) continue;             /* never cross the horizon */
        bx = NX[q]; by = NY[q];
        d = (ND[p] + ND[q]) * 0.5;
        rc = (NR[p] + NR[q]) * 0.5;
        /* the void test is a FLOOR, not a wall: a void still keeps a tenth of
           its filaments, very dim, so the field reads as texture everywhere and
           as structure where the matter went */
        gq = whHash(i0 + ii + e[0] * 811, j0 + jj + e[1] * 419, 40 + n);
        if (gq > 0.115 + (d - 0.470) * 3.5) continue;
        al = amax * rc * (0.13 + 1.50 * (d - 0.435));
        if (al < amax * 0.055) al = amax * 0.055;
        if (n > 1) al *= 0.5;                     /* diagonals sit well back  */
        if (al < 0.004) continue;
        if (al > amax) al = amax;
        b = (al / amax * 4) | 0; if (b > 3) b = 3;
        mx = (ax + bx) * 0.5; my = (ay + by) * 0.5;
        z = whZone(mx, my, R);
        len = Math.abs(bx - ax) + Math.abs(by - ay) + 1e-9;
        /* every strand bows. A straight node-to-node segment meeting three
           others at a node is a wireframe; a bowed one is a filament. */
        bow = (whHash(i0 + ii + e[0] * 37, j0 + jj + e[1] * 91, 61) - 0.5) * 0.34 * len;
        seg[z * 4 + b].push(ax, ay, mx - (by - ay) / len * bow, my + (bx - ax) / len * bow, bx, by);
      }
      /* the knots: where the field piles up, a node thick enough to see */
      d = ND[p];
      if (d > 0.60) {
        s = 0.052 * c * (0.55 + 1.7 * (d - 0.60));
        kn[whZone(ax, ay, R)].push(ax, ay, s,
          amax * NR[p] * (0.34 + 1.7 * (d - 0.60)) *
          (0.90 + 0.10 * Math.sin(t * 0.13 + whHash(i0 + ii, j0 + jj, 5) * 6.283)));
      }
    }
  }

  var lw = Math.max(0.55 / u, c * 0.0068);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = lw;
  var gs = 1 / u, hs, tt, om, qx, qy, m;
  for (z = 0; z < 12; z++) {
    var S = seg[z];
    if (!S.length) continue;
    var C = WH_ZONE[z >> 2];
    var col = 'rgba(' + C[0] + ',' + C[1] + ',' + C[2] + ',' + (amax * ((z & 3) + 0.62) / 4) + ')';
    if (stip) {
      /* PURE STIPPLE, no lines. The strand is walked at roughly two-pixel steps
         and each step bitten as one grain snapped to the pixel grid — engraved,
         never smeared, and it dissolves into the field instead of ending. */
      g.fillStyle = col;
      g.beginPath();
      for (n = 0; n < S.length; n += 6) {
        len = Math.abs(S[n + 4] - S[n]) + Math.abs(S[n + 5] - S[n + 1]);
        m = Math.max(2, Math.min(9, Math.round(len * u / 2.0)));
        for (hs = 0; hs <= m; hs++) {
          tt = hs / m; om = 1 - tt;
          qx = om * om * S[n] + 2 * om * tt * S[n + 2] + tt * tt * S[n + 4];
          qy = om * om * S[n + 1] + 2 * om * tt * S[n + 3] + tt * tt * S[n + 5];
          g.rect(Math.round(qx * u) / u, Math.round(qy * u) / u, gs, gs);
        }
      }
      g.fill();
      continue;
    }
    g.strokeStyle = col;
    g.beginPath();
    for (n = 0; n < S.length; n += 6) {
      g.moveTo(S[n], S[n + 1]);
      g.quadraticCurveTo(S[n + 2], S[n + 3], S[n + 4], S[n + 5]);
    }
    g.stroke();
  }
  for (z = 0; z < 3; z++) {
    var K = kn[z];
    if (!K.length) continue;
    var CC = WH_ZONE[z];
    for (n = 0; n < K.length; n += 4) {
      g.fillStyle = 'rgba(' + (CC[0] + 26) + ',' + (CC[1] + 22) + ',' + (CC[2] + 12) + ',' + K[n + 3] + ')';
      g.beginPath(); g.arc(K[n], K[n + 1], K[n + 2], 0, 6.283); g.fill();
    }
  }
}

/* THE STIPPLE — the foam below the resolution of the filaments. Spacing is
   pinned in SCREEN pixels, so it is a texture at 15 px and still a texture at
   180 000, and the same density field thins it into the same voids. */
function whStipple(g, u, a, W, R, visArea, bf) {
  /* the grain is authored as a DENSITY — grains per square pixel of what is
     actually on screen — not as a count spread over an assumed viewport. That
     is the whole reason the deepest dive costs the same as the first view and
     looks the same: the budget follows the visible rectangle. */
  var sp = Math.min(6.5, Math.max(1.0, Math.sqrt(visArea / (26000 * bf))));  /* px between cells */
  var cs = sp / u;
  var i0 = Math.floor(W.x0 / cs), i1 = Math.ceil(W.x1 / cs);
  var j0 = Math.floor(W.y0 / cs), j1 = Math.ceil(W.y1 / cs);
  /* the caps must not bite before the visible rectangle is covered, or the
     blow-up opens onto blank paper down one side */
  if (i1 - i0 > 300) i1 = i0 + 300;
  if (j1 - j0 > 300) j1 = j0 + 300;
  var n0 = Math.round(Math.log(WH_C0 / cs) / Math.LN2);   /* the ladder steps by 2 */
  var sz = Math.max(0.62, sp * 0.20) / u;
  var buck = [], z, b, i, j, x, y, d, rc, al, br, n;
  for (z = 0; z < 9; z++) buck.push([]);
  var amax = a * 0.95;
  for (i = i0; i <= i1; i++) {
    for (j = j0; j <= j1; j++) {
      x = (i + whHash(i, j, 71)) * cs;
      y = (j + whHash(i, j, 72)) * cs;
      rc = whReach(x, y, R);
      if (rc <= 0.004) continue;
      d = whFbm2(x, y, n0);
      /* a floor under the gate: a void is DUSTY, never blank. The floor was too
         low to hold the blow-up, where a void fills a third of the frame and
         read as empty paper; raised, the voids still read as voids because the
         gate above the floor is unchanged. */
      if (whHash(i, j, 73) > (0.30 + 0.80 * d * d) * (0.40 + 0.60 * rc)) continue;
      br = whHash(i, j, 74);
      al = amax * rc * (0.13 + 0.62 * br * br) * (0.52 + 0.86 * d);
      if (al < 0.004) continue;
      if (al > amax) al = amax;
      b = (al / amax * 3) | 0; if (b > 2) b = 2;
      buck[whZone(x, y, R) * 3 + b].push(x, y, br);
    }
  }
  for (z = 0; z < 9; z++) {
    var S = buck[z];
    if (!S.length) continue;
    var C = WH_ZONE[(z / 3) | 0];
    g.fillStyle = 'rgba(' + C[0] + ',' + C[1] + ',' + C[2] + ',' + (amax * ((z % 3) + 0.62) / 3) + ')';
    g.beginPath();
    for (n = 0; n < S.length; n += 3) {
      /* NOT snapped to the pixel grid. It was, briefly: cells sit about two and
         a half pixels apart here, so rounding each grain to whole pixels ate
         most of the jitter and the field came up as a regular dotted lattice —
         a screen door, not a foam. Sub-pixel placement keeps the scatter
         irregular, which matters far more at this spacing than a crisp edge. */
      var s = sz * (0.70 + 0.66 * S[n + 2]);
      g.rect(S[n], S[n + 1], s, s);
    }
    g.fill();
  }
}

/* THE HORIZON — one line, bitten unevenly the way a real plate bites, with the
   last of the light crowding inside it. No glow, no halo, no flare: past this
   line the function simply stops drawing. */
function whHorizon(g, u, a, t, R) {
  var i, th, rr, al, x, y;
  g.lineCap = 'butt'; g.lineJoin = 'round';
  g.lineWidth = Math.max(0.7 / u, 0.0013);
  if (R * u < 30) {
    /* A MOTE, far off across the room. Everything else about this plate is a
       texture, and a texture at fifteen pixels is a grey smudge — so at this
       size the plate is allowed to be exactly two marks: one crisp gold ring
       and one grain at its heart. You can see the edge of everything before you
       can see anything inside it, which is the right order to arrive in. */
    g.lineWidth = Math.max(0.9 / u, 0.0013);
    g.strokeStyle = 'rgba(240,199,102,' + (a * 0.78) + ')';
    g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.stroke();
    g.strokeStyle = 'rgba(240,199,102,' + (a * 0.22) + ')';
    g.beginPath(); g.arc(0, 0, R * 0.93, 0, 6.283); g.stroke();
    var gs = Math.max(1.1 / u, R * 0.13);
    g.fillStyle = 'rgba(233,220,192,' + (a * 0.62) + ')';
    g.beginPath(); g.arc(0, 0, gs, 0, 6.283); g.fill();
    return;
  }
  var N = 520;
  for (i = 0; i < N; i++) {
    th = i / N * 6.283185;
    rr = R + (whVal(th * 2.7, 4.5, 91) - 0.5) * 0.0058 + (whVal(th * 9.5, 1.5, 92) - 0.5) * 0.0021;
    al = a * (0.020 + 0.42 * whVal(th * 4.1, 0.5, 93) * whVal(th * 1.7, 8.5, 94));
    if (al < a * 0.055) continue;                     /* the line breaks up    */
    g.strokeStyle = 'rgba(240,199,102,' + al + ')';
    g.beginPath();
    g.arc(0, 0, rr, th, th + 6.283185 / N * 1.06);
    g.stroke();
    /* the ghost of a second bite, a hair inside the first */
    if (al > a * 0.20) {
      g.strokeStyle = 'rgba(240,199,102,' + (al * 0.30) + ')';
      g.beginPath();
      g.arc(0, 0, rr * 0.9945, th, th + 6.283185 / N * 1.06);
      g.stroke();
    }
  }
  var M = 340;
  for (i = 0; i < M; i++) {
    th = whHash(i, 3, 95) * 6.283185;
    rr = R * (0.855 + 0.140 * Math.pow(whHash(i, 7, 96), 0.7));
    x = Math.cos(th) * rr; y = Math.sin(th) * rr;
    al = a * (0.05 + 0.30 * whHash(i, 11, 97));
    g.fillStyle = 'rgba(240,199,102,' + al + ')';
    g.fillRect(x, y, 0.0022, 0.0022);
  }
}

/* THE ANCHOR — a knot of the web, self-similar so it holds together as the
   child grows out of it. Not a marker and not a star: filaments arrive at it
   the way they arrive anywhere, only more of them, and the grain piles up. */
function whKnot(g, u, a, cx, cy, rad, depth) {
  var px = rad * u, i, th, r0, r1, d, s, al;
  if (px < 0.6) return;
  var ph = whHash((cx * 9973) | 0, (cy * 7919) | 0, 200 + depth) * 6.283185;

  /* strands arriving — tangential, curving in, never a radial star */
  g.lineCap = 'round';
  g.lineWidth = Math.max(0.55 / u, rad * 0.038);
  for (i = 0; i < 6; i++) {
    th = ph + (i / 6) * 6.283185 + (whHash(i, depth, 201) - 0.5) * 0.7;
    r0 = rad * (1.7 + 1.9 * whHash(i, depth, 202));
    r1 = rad * (0.30 + 0.30 * whHash(i, depth, 204));
    g.strokeStyle = 'rgba(199,196,185,' + (a * (0.08 + 0.15 * whHash(i, depth, 203))) + ')';
    g.beginPath();
    g.moveTo(cx + Math.cos(th) * r0, cy + Math.sin(th) * r0);
    g.quadraticCurveTo(
      cx + Math.cos(th + 0.62) * rad * 1.5, cy + Math.sin(th + 0.62) * rad * 1.5,
      cx + Math.cos(th + 1.15) * r1, cy + Math.sin(th + 1.15) * r1);
    g.stroke();
  }
  /* the grain of the knot itself — piled, not lit */
  for (i = 0; i < 110; i++) {
    th = whHash(i, depth, 205) * 6.283185;
    d = Math.pow(whHash(i, depth, 206), 0.62) * rad * 1.35;
    s = rad * (0.018 + 0.050 * whHash(i, depth, 207));
    al = a * (0.11 + 0.34 * whHash(i, depth, 208)) * (1 - 0.45 * (d / (rad * 1.35)));
    g.fillStyle = 'rgba(233,220,192,' + al + ')';
    g.beginPath(); g.arc(cx + Math.cos(th) * d, cy + Math.sin(th) * d, s, 0, 6.283); g.fill();
  }
  /* two or three heavier grains at its heart, the thing the child resolves into */
  for (i = 0; i < 3; i++) {
    th = ph * 1.7 + i * 2.2;
    d = rad * (0.06 + 0.20 * whHash(i, depth, 209));
    g.fillStyle = 'rgba(240,231,206,' + (a * (0.26 + 0.16 * whHash(i, depth, 210))) + ')';
    g.beginPath();
    g.arc(cx + Math.cos(th) * d, cy + Math.sin(th) * d, rad * (0.055 + 0.045 * whHash(i, depth, 211)), 0, 6.283);
    g.fill();
  }
  /* and the same knot again, four times smaller — so the dive finds more of it */
  if (depth < 3) {
    whKnot(g, u, a, cx + Math.cos(ph) * rad * 0.30, cy + Math.sin(ph) * rad * 0.30, rad * 0.27, depth + 1);
  }
}

/* ═══ 26  THE WHOLE OF IT ═════════════════════════════════════════════════ */
PlateArt.whole = function (g, u, a, t, anchor) {
  g.save();
  g.scale(u, u);

  /* the horizon breathes, barely — two incommensurate periods so it never ticks.
     The amplitude is pinned in SCREEN PIXELS, not unit space: 0.0032 unit is a
     hair at its own decade and 570 px of crawling rim at 180 000, so the whole
     breath is clamped to at most one pixel of travel however deep the dive. */
  var brAmp = Math.min(1, 1.0 / (0.0032 * u));
  var R = 0.4520 + brAmp * (0.0021 * Math.sin(t * 0.061) + 0.0011 * Math.sin(t * 0.0237 + 1.7));
  var W = whWindow(g, u);
  var visArea = ((W.x1 - W.x0) * u) * ((W.y1 - W.y0) * u);
  /* presence buys geometry: a plate at a = 0.2 in the corner of the room does
     not need full foam, and the room draws every plate every frame. But the
     budget holds FULL down to a = 0.30, because the blow-up panel is judged at
     0.30 and it is the density contract — the lever only bites below that, on
     the genuinely peripheral plate no one is reading. */
  var bf = 0.32 + 0.68 * whSs(0.10, 0.30, a);

  /* everything the plate has to say is inside the reach */
  g.save();
  g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.clip();

  /* the ground: a breath of paper inside the reach, warming as it thins */
  var gr = g.createRadialGradient(0, 0, 0, 0, 0, R);
  gr.addColorStop(0, 'rgba(124,138,158,' + (0.040 * a) + ')');
  gr.addColorStop(0.58, 'rgba(126,138,156,' + (0.034 * a) + ')');
  gr.addColorStop(0.90, 'rgba(158,148,132,' + (0.016 * a) + ')');
  gr.addColorStop(1, 'rgba(190,156,100,0)');
  g.fillStyle = gr;
  g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();

  /* THE FOAM, octave by octave — only the ones landing in the legible band.
     The ladder is gathered FIRST and its weights normalised, because an octave
     caught mid-fade used to leave the whole plate thin: the texture visibly
     thickened and thinned as you dived. Total ink is now held flat, so every
     magnification costs the same and LOOKS the same — which is the contract the
     blow-up panel is there to check. */
  var pxmin = Math.max(3.2, Math.sqrt(visArea / (22000 * bf)));
  var lad = [], wsum = 0, kk, cc, ppx, oo;
  for (kk = 0; kk <= 30; kk++) {
    cc = WH_C0 * Math.pow(0.5, kk); ppx = cc * u;
    if (ppx < pxmin || ppx > 22) continue;
    /* the fades are narrow on purpose: the ladder steps by 2, so a wide fade at
       each end would leave every octave half-lit and the plate half-drawn */
    oo = whSs(pxmin, pxmin * 1.25, ppx) * (1 - whSs(16, 22, ppx));
    if (oo <= 0.004) continue;
    lad.push([cc, kk, oo]); wsum += oo;
  }
  /* hold the summed weight at the ladder's own steady state (two octaves fully
     in band); clamped so a genuinely sparse band is lifted, never invented */
  var norm = wsum > 0.05 ? Math.min(1.7, Math.max(0.8, 1.85 / wsum)) : 1;
  for (kk = 0; kk < lad.length; kk++) {
    /* the FINEST octave in band is inked as pure stipple with no strokes — that
       is what foam does as it passes under the resolution of a line, and it is
       what stops the near view reading as a wireframe mesh */
    whOctave(g, u, a, t, lad[kk][0], lad[kk][1], lad[kk][2] * norm, W, R,
             kk === lad.length - 1 && lad.length > 1);
  }

  whStipple(g, u, a, W, R, visArea, bf);

  /* The shipped grain() is deliberately NOT called here, and this plate is the
     one place in the set where that is right. In soft mode its coarse octave
     lays scattered radial discs across the disc — the only marks on the plate a
     strict reading of "no glow effects" would catch — and in hard mode the same
     octave becomes six-pixel grey tiles sitting on top of the foam. Rule 1 asks
     for scale-free authored texture, not for this particular helper, and
     whStipple above is that texture: octaves pinned to screen pixels, thinned
     by the same density field as the filaments, so the voids of the speckle are
     the voids of the web instead of an unrelated field laid over them. */

  if (anchor) whKnot(g, u, a, anchor[0], anchor[1], 0.019, 0);

  g.restore();

  whHorizon(g, u, a, t, R);

  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.restore();
};
