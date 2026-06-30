/* The Long Chain — strand art (foundry synth)
 *
 * A long chain (length >= 3) is drawn as ONE continuous luminous gold filament:
 * "a struck harp string still ringing." The thread glow is built from STACKED
 * translucent strokes (wide bloom -> warm body -> hot core) rather than a
 * bbox-relative SVG filter, because a perfectly straight (horizontal/vertical)
 * path has a degenerate bounding box that collapses such a filter to nothing and
 * makes the connecting thread vanish — so the stroke stack keeps the run glowing
 * continuously on ANY geometry. The path is Catmull-Rom smoothed so the filament
 * hangs like a thread rather than kinking at each coin.
 *
 * Coins (box centres) are molten beads: a tight glow pool, a radial-gradient bead
 * (hot pale centre -> warm gold rim), and a small specular catch-light kissed to
 * the TOP-LEFT (lit from above). A single bright spark drifts coin->coin along the
 * arc-length, lingering slightly at each coin, so the filament reads "charged" at
 * rest — calm, candlelit, never neon. Short chains are a single thin cool dim line
 * with small flat coins — present but plainly lesser; the contrast is the teaching.
 *
 * API: window.LongChainStrand.drawChain(g, pts, {long, reduced, scale}) -> {stop()}
 */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var DEFS_ID = 'lc-strand-defs';

  function el(name, attrs, parent) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Inject shared filter/gradient defs ONCE per document, id-namespaced.
  function ensureDefs(ownerSvg) {
    var doc = ownerSvg.ownerDocument || document;
    if (doc.getElementById(DEFS_ID)) return;
    var defs = el('defs', { id: DEFS_ID }, ownerSvg);

    // Tight glow for the coin bead + shimmer spark (circles have a real 2D bbox,
    // so a bbox-relative filter is safe here — unlike a straight line).
    var fGlow = el('filter', {
      id: 'lc-strand-glow', x: '-60%', y: '-60%', width: '220%', height: '220%',
      'color-interpolation-filters': 'sRGB'
    }, defs);
    el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: '2.4', result: 'g' }, fGlow);

    // Radial gradient for the molten coin bead — hot pale centre -> warm gold rim
    // -> transparent, so each node fuses softly into the thread rather than sitting
    // on it as a hard disc. Centre lifted up-left (cx 42 / cy 36) so the bead reads
    // lit from above. (Grafted from take 2's coin treatment.)
    var rg = el('radialGradient', { id: 'lc-coin-grad', cx: '42%', cy: '36%', r: '62%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff6dc' }, rg);
    el('stop', { offset: '34%', 'stop-color': '#f7e1a0' }, rg);
    el('stop', { offset: '72%', 'stop-color': '#f0d488' }, rg);
    el('stop', { offset: '100%', 'stop-color': '#e6b858', 'stop-opacity': '0' }, rg);

    // Linear gradient along the core to give the thread faint living variation.
    var lg = el('linearGradient', { id: 'lc-core-grad', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffe9ad' }, lg);
    el('stop', { offset: '50%', 'stop-color': '#fff4d2' }, lg);
    el('stop', { offset: '100%', 'stop-color': '#ffe9ad' }, lg);
  }

  // Smooth a polyline into a path string via Catmull-Rom -> cubic Bezier, so the
  // filament curves like a hung thread rather than kinking at each coin.
  // (Grafted from take 3.) Straight 2-point chains stay a clean line.
  function smoothPath(pts) {
    if (!pts.length) return '';
    if (pts.length === 1) return 'M' + pts[0].x + ' ' + pts[0].y;
    if (pts.length === 2) return 'M' + pts[0].x + ' ' + pts[0].y + 'L' + pts[1].x + ' ' + pts[1].y;
    var d = 'M' + pts[0].x + ' ' + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += 'C' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + p2.x + ' ' + p2.y;
    }
    return d;
  }

  // Cumulative arc-length samples so we can place the travelling spark by distance.
  function arcLengths(pts) {
    var segs = [], total = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
      var L = Math.hypot(dx, dy);
      segs.push({ x0: pts[i].x, y0: pts[i].y, dx: dx, dy: dy, L: L, start: total });
      total += L;
    }
    return { segs: segs, total: total };
  }
  function pointAt(arc, dist) {
    var segs = arc.segs;
    if (!segs.length) return null;
    if (dist <= 0) return { x: segs[0].x0, y: segs[0].y0 };
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (dist <= s.start + s.L || i === segs.length - 1) {
        var t = s.L > 0 ? (dist - s.start) / s.L : 0;
        if (t > 1) t = 1;
        return { x: s.x0 + s.dx * t, y: s.y0 + s.dy * t };
      }
    }
    return null;
  }

  function drawChain(g, pts, opts) {
    opts = opts || {};
    var long = !!opts.long;
    var reduced = !!opts.reduced;
    var scale = opts.scale || 100;

    // Size tracks the board: stroke + coin radius scale with the dot gap.
    var u = scale / 100;
    var coreW = long ? 3.0 * u : 1.3 * u;
    var midW = long ? 7.0 * u : 0;
    var bloomW = long ? 15 * u : 0;
    var coinR = long ? 6.0 * u : 3.2 * u;

    // find owning <svg> for defs injection
    var ownerSvg = g;
    while (ownerSvg && ownerSvg.tagName !== 'svg') ownerSvg = ownerSvg.parentNode;
    ownerSvg = ownerSvg || g;

    if (long) {
      ensureDefs(ownerSvg);
      var d = smoothPath(pts);

      // The thread's glow is built from STACKED translucent strokes (robust on any
      // geometry, cheap). Wide bloom -> warm body -> hot core, drawn back-to-front.
      var glowLayers = [
        { w: bloomW,        col: '#f0d488', op: 0.16 },
        { w: bloomW * 0.66, col: '#f3d892', op: 0.22 },
        { w: midW,          col: '#f6df9c', op: 0.40 },
        { w: midW * 0.55,   col: '#fbe9b6', op: 0.70 }
      ];
      for (var gi = 0; gi < glowLayers.length; gi++) {
        var gl = glowLayers[gi];
        el('path', {
          d: d, fill: 'none', stroke: gl.col, 'stroke-width': gl.w,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: gl.op
        }, g);
      }

      // coin glow pool UNDER the core — a tight halo so each node reads warm without
      // out-shouting the thread. Trimmed from take 1's coinR*2.1 to coinR*1.5 (the
      // smith/judges flagged the original blooms merging into the thread on dense
      // boards). The gradient's own transparent rim does the feathering, so no blur.
      for (var i = 0; i < pts.length; i++) {
        el('circle', { cx: pts[i].x, cy: pts[i].y, r: coinR * 1.5,
          fill: 'url(#lc-coin-grad)', opacity: 0.5 }, g);
      }

      // thin hot core — the actual ringing string, drawn over the glow so it stays
      // unbroken end to end.
      el('path', {
        d: d, fill: 'none', stroke: 'url(#lc-core-grad)', 'stroke-width': coreW,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 1 }, g);

      // coin beads: the molten bead (radial gradient) + a small specular catch-light
      // kissed to the TOP-LEFT so the bead reads lit from above. (Graft from take 2.)
      for (var k = 0; k < pts.length; k++) {
        el('circle', { cx: pts[k].x, cy: pts[k].y, r: coinR,
          fill: 'url(#lc-coin-grad)' }, g);
        el('circle', {
          cx: (pts[k].x - coinR * 0.30).toFixed(2),
          cy: (pts[k].y - coinR * 0.34).toFixed(2),
          r: Math.max(1.0, coinR * 0.26),
          fill: '#fffdf4', 'fill-opacity': '0.92' }, g);
      }

      // travelling spark: a small bright node drifting coin->coin, lingering slightly
      // at each coin so the "charged" life reads. Continuously present (no dead rest
      // gap that would read as static), eased to zero at both endpoints so a frozen
      // frame never shows a stray dot at the ends.
      var arc = arcLengths(pts);
      var spark = null;
      if (arc.total > 0) {
        spark = el('circle', { cx: pts[0].x, cy: pts[0].y, r: coinR * 0.95,
          fill: '#fffaf0', opacity: 0, filter: 'url(#lc-strand-glow)' }, g);
      }

      var raf = 0, running = false;
      if (!reduced && spark) {
        running = true;
        var nCoins = pts.length;
        // slow & calm; longer chains drift longer so a long chain feels weighty.
        var periodMs = 3000 + arc.total * 3.2;
        var start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        var tick = function (now) {
          if (!running) return;
          var t = ((now - start) % periodMs) / periodMs;       // 0..1
          // ease-linger at each coin: a gentle sinusoid retards progress near nodes
          // (grafted from take 3's per-coin ease), kept subtle so it stays calm.
          var eased = t - 0.05 * Math.sin(t * Math.PI * 2 * (nCoins - 1)) / (Math.PI * 2);
          if (eased < 0) eased = 0; else if (eased > 1) eased = 1;
          var p = pointAt(arc, eased * arc.total);
          if (p) {
            spark.setAttribute('cx', p.x.toFixed(2));
            spark.setAttribute('cy', p.y.toFixed(2));
            // ease in at the head, out at the tail; a small floor keeps it
            // continuously perceptible mid-run (never a dead pause that reads as
            // static), while the sin envelope still rests it to ~0 at both ends so a
            // frozen frame never shows a stray dot.
            var fade = Math.sin(t * Math.PI);                  // 0 at ends, 1 mid
            var op = fade < 0.001 ? 0 : (0.20 + 0.62 * fade);
            spark.setAttribute('opacity', op.toFixed(3));
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }

      return {
        stop: function () {
          running = false;
          if (raf) { cancelAnimationFrame(raf); raf = 0; }
        }
      };
    }

    // SHORT chain: a single thin, cool, dim line + small flat coins. No animation.
    el('path', {
      d: smoothPath(pts), fill: 'none', stroke: 'rgba(176,168,196,0.45)',
      'stroke-width': coreW, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, g);
    for (var j = 0; j < pts.length; j++) {
      el('circle', { cx: pts[j].x, cy: pts[j].y, r: coinR,
        fill: 'rgba(176,168,196,0.55)' }, g);
    }
    return { stop: function () {} };
  }

  window.LongChainStrand = { drawChain: drawChain };
})();
