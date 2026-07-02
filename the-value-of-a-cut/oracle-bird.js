/* The Oracle Bird — take-3 · "The Gilded Wren"
 *
 * A small brass-and-amber songbird that perches in the ledger's oracle panel and
 * HOPS (a real parabolic arc, wings spread mid-flight) to the winning side as the
 * position's value changes. Idle: a gentle breathing bob + a slow tail-flick and a
 * rare blink. cheer(): an exuberant wing-flutter + upward bounce toward the winner.
 * warn(): a taut warning ruffle at center — the sign lies here.
 *
 * Direction for this take: a hand-built wren with layered feather-shingle craft, a
 * cocked tail, a bright brass eye-ring, and a warm glow-halo that pools under it on
 * the winning side. Everything is driven by ONE rAF loop through a tiny spring model
 * so the motion reads alive — never linear, never CSS-keyframe.
 *
 * Exposes BOTH:
 *   window.Bird      — the singleton the real page wires (mount/setSide/cheer)
 *   window.makeBird  — a factory returning an independent instance (the preview
 *                      harness mounts one per panel via this)
 *
 * Pure, zero-dependency SVG built with createElementNS. Reads the exhibit palette
 * from :root CSS vars, falling back to spec values.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  // ---- palette (inherit from :root, fall back to the spec's brass) --------------
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function palette() {
    return {
      brass:      cssVar('--brass', '#c9a24a'),
      bright:     cssVar('--brass-bright', '#f0d488'),
      dark:       '#8a6a2a',
      shadow:     '#5c451a',
      beak:       '#d98a3a',
      beakDk:     '#a9611f',
      eye:        '#1a1208',
      blue:       cssVar('--blue', '#6ea8e8'),
      red:        cssVar('--red', '#e0664f'),
      green:      cssVar('--green', '#7bd88f')
    };
  }

  // ---- small helpers -------------------------------------------------------------
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // seeded deterministic-ish jitter so idle timing differs per bird but is stable
  function makeRng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // perch geometry (spec): perch line y≈60, x∈[20,280]; marks blue 58 / center 150 / red 242
  var PERCH_Y = 60;
  var MARK = { blue: 58, center: 150, red: 242, warn: 150 };

  function makeBird() {
    var P = palette();
    var rng = makeRng((Date.now() ^ (Math.floor(Math.random() * 1e9))) >>> 0);

    // ---- per-instance state ------------------------------------------------------
    var st = {
      svg: null, mounted: false,
      raf: 0, t0: 0, last: 0,
      // position spring (x along perch, and vertical hop offset)
      x: MARK.center, xTarget: MARK.center, xVel: 0,
      side: 'center',
      facing: 1,                 // +1 faces right, -1 faces left
      facingTarget: 1, facingBlend: 1,
      // hop animation: a triggered parabolic arc layered on top of the x-spring
      hop: { active: false, t: 0, dur: 0, from: 0, to: 0, height: 0 },
      // flutter energy (0..1) — decays; drives wing beat amplitude/speed
      flutter: 0,
      wingOpen: 0,               // eased 0..1 spread amount for the near/far wings
      cheerBoost: 0,             // extra vertical bounce during a cheer
      warnEnergy: 0,             // taut ruffle on warn (decays — the transient shudder)
      warnHold: 0,               // 1 while 'warn' side is active — a SUSTAINED alert pose
                                 // (held crest-lift + tail-cock) so warn reads distinct
                                 // from plain center even in a static/settled frame
      // ambient
      breath: rng() * 6.28,
      tailPhase: rng() * 6.28,
      blinkAt: 0.8 + rng() * 3,  // seconds until next blink
      blink: 0,                  // 0 open .. 1 shut
      wingBeat: rng() * 6.28,
      // glow tint under the bird
      glowSide: 'center'
    };

    // ---- svg node handles (built in mount) ---------------------------------------
    var g = {};

    function buildStatic(svg) {
      // clear
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      var defs = el('defs', null, svg);
      // soft glow filter for the halo
      var f = el('filter', { id: 'orb-glow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
      el('feGaussianBlur', { 'stdDeviation': '3.2', result: 'b' }, f);
      var m = el('feMerge', null, f);
      el('feMergeNode', { in: 'b' }, m);
      el('feMergeNode', { in: 'SourceGraphic' }, m);

      // radial gradient for the winning-side ground glow
      var rg = el('radialGradient', { id: 'orb-halo', cx: '50%', cy: '50%', r: '50%' }, defs);
      g.haloStop0 = el('stop', { offset: '0%', 'stop-color': P.brass, 'stop-opacity': '0.55' }, rg);
      el('stop', { offset: '100%', 'stop-color': P.brass, 'stop-opacity': '0' }, rg);

      // brass body gradient (top-lit: bright at top, brass mid, shadow low)
      var bg = el('linearGradient', { id: 'orb-body', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
      el('stop', { offset: '0%', 'stop-color': P.bright }, bg);
      el('stop', { offset: '48%', 'stop-color': P.brass }, bg);
      el('stop', { offset: '100%', 'stop-color': P.shadow }, bg);

      // ---- the winning-side halo (under the feet), animated in tick --------------
      g.halo = el('ellipse', {
        cx: 0, cy: PERCH_Y + 2, rx: 26, ry: 5,
        fill: 'url(#orb-halo)', opacity: '0', filter: 'url(#orb-glow)'
      }, svg);

      // ---- the perch -------------------------------------------------------------
      var perch = el('g', null, svg);
      // perch bar with a top-lit brass sheen
      el('line', { x1: 20, y1: PERCH_Y + 1.4, x2: 280, y2: PERCH_Y + 1.4,
        stroke: P.shadow, 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: 0.9 }, perch);
      el('line', { x1: 20, y1: PERCH_Y, x2: 280, y2: PERCH_Y,
        stroke: P.brass, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, perch);
      el('line', { x1: 20, y1: PERCH_Y - 0.7, x2: 280, y2: PERCH_Y - 0.7,
        stroke: P.bright, 'stroke-width': 0.7, 'stroke-linecap': 'round', opacity: 0.7 }, perch);
      // three perch marks (little brass studs) + faint colour under each
      var marks = [
        { x: MARK.blue, c: P.blue },
        { x: MARK.center, c: P.brass },
        { x: MARK.red, c: P.red }
      ];
      marks.forEach(function (mk) {
        el('circle', { cx: mk.x, cy: PERCH_Y, r: 2.6, fill: mk.c, opacity: 0.5 }, perch);
        el('circle', { cx: mk.x, cy: PERCH_Y - 0.5, r: 1.5, fill: P.bright, opacity: 0.85 }, perch);
      });

      // ---- the bird group (local origin at feet, standing on perch) --------------
      // structure: [wrapper translate(x,perchY)] > [bob scale/translate] > body parts
      g.wrap = el('g', null, svg);          // holds translate(x, y+hop)
      g.tilt = el('g', null, g.wrap);       // holds hop-tilt rotation
      g.flip = el('g', null, g.tilt);       // holds facing scaleX
      g.body = el('g', null, g.flip);       // holds breath bob (scale)

      buildBird(g.body);
    }

    // Build the bird itself in LOCAL coords: feet at (0,0), body rising to negative y.
    function buildBird(root) {
      // ----- tail : a short, jaunty UP-COCKED wren tail (pivots at tail-base) ----
      // A wren's signature is a stubby tail flicked up behind. Built as a small fan
      // of 3 short feathers rising back-and-up from the rump at (7,-16).
      g.tail = el('g', null, root);
      var tailShades = [P.shadow, P.dark, P.brass];
      for (var i = 0; i < 3; i++) {
        var lift = i * 1.6;               // outer feathers cock higher
        el('path', {
          // start at rump, sweep back then flick UP (negative y)
          d: 'M 7 -16 q 6 ' + (-1 - lift * 0.3) + ' 9 ' + (-8 - lift),
          fill: 'none', stroke: tailShades[i], 'stroke-width': 2.4 - i * 0.35,
          'stroke-linecap': 'round', opacity: 0.95
        }, g.tail);
      }
      // a thin bright top-edge on the cocked tail (top-lit)
      el('path', { d: 'M 7 -16 q 6 -1.3 9 -8.6', fill: 'none', stroke: P.bright,
        'stroke-width': 0.6, 'stroke-linecap': 'round', opacity: 0.7 }, g.tail);

      // ----- far wing (folded, tucked behind) ------------------------------------
      // wrapped in a group so it can lift + spread OFF the flank during flutter
      // (judges: both takes' far wing read flat — bring it a hair off the body).
      g.wingBackG = el('g', null, root);
      g.wingBack = el('path', {
        d: 'M -3 -18 q 8 3 6 12 q -5 2 -9 -2 q -2 -6 3 -10 z',
        fill: P.shadow, opacity: 0.8
      }, g.wingBackG);
      // a broad spread far-wing revealed behind the body at the hop apex / flutter;
      // dimmer + set back so it reads as the FAR wing, not a duplicate near wing.
      g.wingBackOpen = el('path', {
        d: 'M 2 -27 q 16 -6 26 -1 q -6 5 -14 5 q 7 1 12 5 q -9 4 -18 0 q -6 -3 -8 -9 z',
        fill: P.shadow, stroke: P.dark, 'stroke-width': 0.5, 'stroke-linejoin': 'round',
        opacity: 0, transform: 'scale(0.001)'
      }, g.wingBackG);

      // ----- body (plump wren) : top-lit brass gradient --------------------------
      g.torso = el('path', {
        // rounded body, head up-left, tail-base low-right
        d: 'M 0 -14 C -8 -16 -13 -22 -11 -29 C -9 -36 -1 -39 5 -35 ' +
           'C 9 -32 9 -27 7 -24 C 11 -22 12 -16 8 -12 C 4 -9 -3 -9 0 -14 Z',
        fill: 'url(#orb-body)', stroke: P.dark, 'stroke-width': 0.7
      }, root);

      // breast tint patch (recoloured per winning side)
      g.breast = el('path', {
        d: 'M -6 -14 C -10 -18 -11 -25 -8 -30 C -5 -33 0 -33 1 -28 C 2 -22 -1 -15 -6 -14 Z',
        fill: P.brass, opacity: 0
      }, root);

      // feather-shingle texture on the back (a few overlapping arcs)
      g.feathers = el('g', null, root);
      var fSpec = [ [-3, -30, 8], [1, -27, 8], [-4, -24, 7], [2, -22, 7], [-2, -19, 6] ];
      fSpec.forEach(function (fp) {
        el('path', {
          d: 'M ' + fp[0] + ' ' + fp[1] + ' q ' + (fp[2] * 0.5) + ' 3 ' + fp[2] + ' 0',
          fill: 'none', stroke: P.dark, 'stroke-width': 0.6, opacity: 0.5
        }, g.feathers);
      });

      // ----- crest : a small 3-feather tuft on the crown (pivots at its base) -----
      // Its base sits at the top of the head (~ -2,-37). It stays low at rest and
      // LIFTS + holds while a warning is active, so 'warn' reads distinct from
      // plain 'center' even in a settled/static frame (judges' called-out fix).
      g.crest = el('g', null, root);
      var crestShades = [P.dark, P.brass, P.bright];
      for (var ci = 0; ci < 3; ci++) {
        el('path', {
          d: 'M -2 -37 q ' + (-1 + ci * 1.1) + ' -3.4 ' + (-0.4 + ci * 1.4) + ' -6',
          fill: 'none', stroke: crestShades[ci], 'stroke-width': 1.3 - ci * 0.28,
          'stroke-linecap': 'round', opacity: 0.9
        }, g.crest);
      }

      // ----- head detail: brass eye-ring + dark eye + a bright catch-light --------
      g.headHi = el('path', {  // bright top-of-head sheen
        d: 'M -6 -35 C -4 -38 1 -38 3 -35',
        fill: 'none', stroke: P.bright, 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0.9
      }, root);
      el('circle', { cx: -3, cy: -31, r: 2.9, fill: 'none', stroke: P.bright, 'stroke-width': 0.7, opacity: 0.85 }, root);
      g.eye = el('circle', { cx: -3, cy: -31, r: 2.1, fill: P.eye }, root);
      el('circle', { cx: -3.7, cy: -31.8, r: 0.7, fill: P.bright, opacity: 0.9 }, root); // catch-light
      // eyelid (for blink) — a brass shutter that scales down over the eye
      g.lid = el('rect', { x: -5.2, y: -33.2, width: 4.4, height: 0, rx: 1.6, fill: P.brass }, root);

      // ----- beak (a crisp little pointed wren beak, slightly open) --------------
      g.beak = el('g', null, root);
      // upper mandible — a sharp triangle projecting from the face
      el('path', { d: 'M -8 -31.2 L -17.5 -30 L -8.5 -29 Z', fill: P.beak, stroke: P.beakDk, 'stroke-width': 0.5, 'stroke-linejoin': 'round' }, g.beak);
      // lower mandible — thinner, darker, just below (the "open" gap)
      el('path', { d: 'M -8.5 -29 L -15 -28 L -8 -27.6 Z', fill: P.beakDk, opacity: 0.9, 'stroke-linejoin': 'round' }, g.beak);
      // bright top edge on the upper mandible
      el('path', { d: 'M -8 -31.2 L -17.5 -30', fill: 'none', stroke: P.bright, 'stroke-width': 0.5, opacity: 0.7 }, g.beak);

      // ----- near wing (the animated one) : layered flight feathers --------------
      g.wing = el('g', null, root);         // pivots at the shoulder
      // the FOLDED resting wing (fades out as the wing opens)
      g.wingFold = el('g', null, g.wing);
      g.wingFeathers = el('path', {
        d: 'M -1 -26 q 12 1 15 10 q -3 5 -10 4 q -8 -2 -8 -9 q 0 -3 3 -5 z',
        fill: 'url(#orb-body)', stroke: P.dark, 'stroke-width': 0.6
      }, g.wingFold);
      // feather-separation lines on the wing
      el('path', { d: 'M 2 -22 q 6 2 10 7', fill: 'none', stroke: P.shadow, 'stroke-width': 0.5, opacity: 0.6 }, g.wingFold);
      el('path', { d: 'M 0 -20 q 5 3 8 8', fill: 'none', stroke: P.shadow, 'stroke-width': 0.5, opacity: 0.5 }, g.wingFold);
      // the OPEN, lushly-spread near wing (Take-2 wing extent; the delight peak).
      // Hidden at rest (scale 0), grown + faded in on hop-apex / flutter / cheer.
      // A broad scalloped fan sweeping down-and-back from the shoulder, with a
      // bright top-edge sheen so it stays top-lit as it spreads.
      g.wingOpen = el('g', null, g.wing);
      el('path', {
        d: 'M -1 -27 q 18 -5 30 3 q -7 5 -16 4 q 9 2 15 8 q -10 5 -21 0 ' +
           'q 9 3 15 9 q -12 4 -22 -2 q -6 -4 -8 -12 q -1 -6 5 -11 z',
        fill: 'url(#orb-body)', stroke: P.dark, 'stroke-width': 0.6, 'stroke-linejoin': 'round'
      }, g.wingOpen);
      // engraved feather separations on the spread wing
      el('path', { d: 'M 2 -24 q 14 0 24 8 M 1 -20 q 12 2 20 10 M 0 -16 q 10 3 17 11',
        fill: 'none', stroke: P.shadow, 'stroke-width': 0.5, opacity: 0.55 }, g.wingOpen);
      // bright top-edge sheen riding the leading edge (top-lit)
      el('path', { d: 'M -1 -27 q 18 -5 30 3', fill: 'none', stroke: P.bright,
        'stroke-width': 0.7, 'stroke-linecap': 'round', opacity: 0.7 }, g.wingOpen);
      g.wingOpen.setAttribute('opacity', '0');
      g.wingOpen.setAttribute('transform', 'scale(0.001)');

      // ----- legs + feet (thin brass, gripping perch) ----------------------------
      g.legs = el('g', null, root);
      el('path', { d: 'M -1 -11 L -2 -1', fill: 'none', stroke: P.dark, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g.legs);
      el('path', { d: 'M 3 -11 L 3 -1', fill: 'none', stroke: P.dark, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g.legs);
      // toes
      el('path', { d: 'M -2 -1 l -2.4 1 M -2 -1 l 2.4 1 M -2 -1 l 0 1.4', fill: 'none', stroke: P.dark, 'stroke-width': 0.9, 'stroke-linecap': 'round' }, g.legs);
      el('path', { d: 'M 3 -1 l -2.4 1 M 3 -1 l 2.4 1 M 3 -1 l 0 1.4', fill: 'none', stroke: P.dark, 'stroke-width': 0.9, 'stroke-linecap': 'round' }, g.legs);
    }

    // ---- animation tick ----------------------------------------------------------
    function tick(now) {
      if (!st.mounted) return;
      if (!st.t0) { st.t0 = now; st.last = now; }
      var dt = Math.min(0.05, (now - st.last) / 1000);  // clamp big gaps
      st.last = now;
      var T = (now - st.t0) / 1000;

      // ----- x spring toward target (critically-ish damped) --------------------
      var k = 90, c = 15;
      var ax = -k * (st.x - st.xTarget) - c * st.xVel;
      st.xVel += ax * dt;
      st.x += st.xVel * dt;

      // ----- hop arc (parabola layered on x-motion) ----------------------------
      var hopY = 0, hopTilt = 0;
      if (st.hop.active) {
        st.hop.t += dt;
        var u = clamp(st.hop.t / st.hop.dur, 0, 1);
        hopY = -st.hop.height * 4 * u * (1 - u);          // parabola peak at u=0.5
        hopTilt = Math.sin(u * Math.PI) * 6 * (st.hop.to > st.hop.from ? 1 : -1); // lean into travel
        // during hop the wings spread + beat
        st.flutter = Math.max(st.flutter, 0.6 * Math.sin(u * Math.PI));
        if (u >= 1) { st.hop.active = false; st.flutter = Math.max(st.flutter, 0.35); }
      }

      // ----- flutter / cheer / warn energy decay --------------------------------
      st.flutter = Math.max(0, st.flutter - dt * 1.6);
      st.cheerBoost = Math.max(0, st.cheerBoost - dt * 2.0);
      st.warnEnergy = Math.max(0, st.warnEnergy - dt * 2.2);
      st.wingBeat += dt * (10 + st.flutter * 45);

      // ----- breathing bob + gentle idle sway -----------------------------------
      st.breath += dt * 2.1;
      var breathScale = 1 + Math.sin(st.breath) * 0.018;         // torso "breathes"
      var idleBob = Math.sin(st.breath * 0.5) * 0.6;             // whole-body slow rise
      // cheer adds a bright upward bounce
      var cheerY = -Math.abs(Math.sin(st.cheerBoost * 9)) * st.cheerBoost * 7;

      // warn: a taut alert lift — the bird pulls up, on-guard (reads even frozen)
      var warnLift = -st.warnEnergy * 1.6;
      // total vertical: hop arc + idle bob + cheer bounce + warn alert-lift
      var y = PERCH_Y + hopY + idleBob + cheerY + warnLift;

      // ----- facing blend (turn to face travel direction) -----------------------
      st.facingBlend += (st.facingTarget - st.facingBlend) * Math.min(1, dt * 8);
      var sx = st.facingBlend;   // -1..+1 ; scaleX

      // ----- wing beat: rotate near wing about shoulder -------------------------
      var beatAmp = 8 + st.flutter * 34 + st.warnEnergy * 10;
      var beat = Math.sin(st.wingBeat) * beatAmp;
      // warn adds a fast taut micro-shiver on top
      var shiver = st.warnEnergy > 0 ? Math.sin(T * 60) * st.warnEnergy * 1.4 : 0;

      // ----- wing OPEN amount (0 folded .. 1 lushly spread) ----------------------
      // driven by hop apex + flutter + cheer; this is the delight peak (Take-2 wing).
      var hopOpen = st.hop.active ? Math.sin(clamp(st.hop.t / st.hop.dur, 0, 1) * Math.PI) : 0;
      var openTarget = clamp(Math.max(hopOpen, st.flutter, st.cheerBoost * 0.9), 0, 1);
      // ease the open/close so it never snaps
      st.wingOpen = st.wingOpen == null ? 0 : st.wingOpen;
      st.wingOpen += (openTarget - st.wingOpen) * Math.min(1, dt * 12);
      var open = st.wingOpen < 0.004 ? 0 : st.wingOpen;

      // ----- sustained warn pose (held) ------------------------------------------
      // warnHold rises to 1 the instant warn is set and eases back to 0 when it isn't,
      // so the crest stays lifted + tail stays cocked for the WHOLE warn dwell.
      st.warnHold += ((st.side === 'warn' ? 1 : 0) - st.warnHold) * Math.min(1, dt * 6);
      var warnPose = st.warnHold;

      // ----- tail flick ----------------------------------------------------------
      st.tailPhase += dt * 1.3;
      var tailFlick = Math.sin(st.tailPhase) * 3 + st.warnEnergy * 10 + warnPose * 12;

      // ----- crest lift : low at rest, HELD up while warn is active --------------
      var crestLift = -(warnPose * 26 + st.warnEnergy * 8 + st.flutter * 4);

      // ----- blink ---------------------------------------------------------------
      st.blinkAt -= dt;
      if (st.blinkAt <= 0 && st.blink === 0) { st.blink = 0.001; }
      if (st.blink > 0) {
        st.blink += dt * 8;                 // fast close/open
        if (st.blink >= 2) { st.blink = 0; st.blinkAt = 2.5 + rng() * 4; }
      }
      var lidH = st.blink > 0 ? (st.blink <= 1 ? st.blink : 2 - st.blink) * 4.4 : 0;

      // ===== apply transforms =====
      g.wrap.setAttribute('transform', 'translate(' + st.x.toFixed(2) + ',' + y.toFixed(2) + ')');
      g.tilt.setAttribute('transform', 'rotate(' + hopTilt.toFixed(2) + ')');
      g.flip.setAttribute('transform', 'scale(' + sx.toFixed(3) + ',1)');
      g.body.setAttribute('transform', 'translate(0,' + (-1).toFixed(1) + ') scale(1,' + breathScale.toFixed(3) + ')');
      // when spread, sweep the whole near wing up-and-back off the breast so the
      // open fan reads as a raised wing (not a fold across the chest)
      var wingSweep = -open * 22;
      g.wing.setAttribute('transform', 'rotate(' + (beat + shiver + wingSweep).toFixed(2) + ',-1,-26)');
      g.tail.setAttribute('transform', 'rotate(' + tailFlick.toFixed(2) + ',7,-16)');
      g.crest.setAttribute('transform', 'rotate(' + crestLift.toFixed(2) + ',-2,-37)');
      g.lid.setAttribute('height', lidH.toFixed(2));

      // ----- cross-fade folded <-> spread near wing, and lift the far wing -------
      // near wing: folded shape fades out, lush spread grows in about the shoulder
      g.wingFold.setAttribute('opacity', (1 - open).toFixed(3));
      if (open > 0) {
        var ws = 0.28 + open * 0.72;                 // grow the spread from a nub
        g.wingOpen.setAttribute('opacity', open.toFixed(3));
        g.wingOpen.setAttribute('transform', 'translate(-1,-27) scale(' + ws.toFixed(3) + ') translate(1,27)');
      } else {
        g.wingOpen.setAttribute('opacity', '0');
        g.wingOpen.setAttribute('transform', 'scale(0.001)');
      }
      // far wing: at rest it hugs the flank; on open it lifts + spreads OFF the body
      var farLift = open * -5;                       // rise up-back
      g.wingBackG.setAttribute('transform', 'translate(' + (open * 3).toFixed(2) + ',' + farLift.toFixed(2) + ')');
      g.wingBack.setAttribute('opacity', (0.8 * (1 - open * 0.7)).toFixed(3));
      if (open > 0) {
        var wbs = 0.3 + open * 0.7;
        g.wingBackOpen.setAttribute('opacity', (open * 0.8).toFixed(3));
        g.wingBackOpen.setAttribute('transform', 'translate(2,-27) scale(' + wbs.toFixed(3) + ') translate(-2,27)');
      } else {
        g.wingBackOpen.setAttribute('opacity', '0');
        g.wingBackOpen.setAttribute('transform', 'scale(0.001)');
      }

      // ----- winning-side halo ---------------------------------------------------
      var haloTarget = (st.glowSide === 'blue' || st.glowSide === 'red') ? 0.9 : 0.0;
      var curOp = parseFloat(g.halo.getAttribute('opacity')) || 0;
      var newOp = curOp + (haloTarget - curOp) * Math.min(1, dt * 4);
      g.halo.setAttribute('opacity', newOp.toFixed(3));
      g.halo.setAttribute('cx', st.x.toFixed(2));

      st.raf = requestAnimationFrame(tick);
    }

    // ---- public: recolour breast + halo for a side -------------------------------
    function applySideColour(side) {
      var c = side === 'blue' ? P.blue : side === 'red' ? P.red : null;
      if (c) {
        g.breast.setAttribute('fill', c);
        g.breast.setAttribute('opacity', '0.5');
        g.haloStop0.setAttribute('stop-color', c);
      } else {
        g.breast.setAttribute('opacity', '0');
        g.haloStop0.setAttribute('stop-color', side === 'warn' ? P.green : P.brass);
      }
      g.glowSide = side;
      st.glowSide = side;
    }

    // ---- trigger a hop to a target x ---------------------------------------------
    function hopTo(targetX) {
      var dist = Math.abs(targetX - st.x);
      st.hop.active = true;
      st.hop.t = 0;
      st.hop.dur = clamp(0.28 + dist / 700, 0.28, 0.6);
      st.hop.from = st.x;
      st.hop.to = targetX;
      st.hop.height = clamp(6 + dist * 0.055, 6, 15);
      st.xTarget = targetX;
      // face the direction of travel (blue is left -> face left; red is right -> face right)
      if (targetX < st.x - 1) { st.facingTarget = -1; }
      else if (targetX > st.x + 1) { st.facingTarget = 1; }
    }

    // ================= public API =================
    return {
      __panel: null,
      mount: function (svgEl) {
        if (!svgEl) return;
        st.svg = svgEl;
        buildStatic(svgEl);
        st.mounted = true;
        st.t0 = 0; st.last = 0;
        // start on center, facing left (default oracle repose looking toward the value)
        st.x = MARK.center; st.xTarget = MARK.center; st.xVel = 0;
        st.facingTarget = -1; st.facingBlend = -1;
        if (st.raf) cancelAnimationFrame(st.raf);
        st.raf = requestAnimationFrame(tick);
      },
      setSide: function (side, ctx) {
        if (!st.mounted) return;
        if (side !== 'blue' && side !== 'red' && side !== 'center' && side !== 'warn') side = 'center';
        st.side = side;
        var tx = MARK[side];
        applySideColour(side);
        if (side === 'warn') {
          // sit center + a taut warning ruffle
          hopTo(MARK.center);
          st.warnEnergy = 1;
          st.facingTarget = -1;   // turn to "look at" the misreading
        } else {
          hopTo(tx);
        }
      },
      cheer: function (side, ctx) {
        if (!st.mounted) return;
        if (side !== 'blue' && side !== 'red') side = st.side === 'red' ? 'red' : 'blue';
        st.side = side;
        applySideColour(side);
        hopTo(MARK[side]);
        st.cheerBoost = 1;
        st.flutter = 1;
        // face the winner triumphantly
        st.facingTarget = side === 'blue' ? -1 : 1;
      },
      // expose for debugging / harness safety
      _state: st
    };
  }

  // singleton for the real page + factory for the preview harness (one per panel)
  if (typeof window !== 'undefined') {
    window.makeBird = makeBird;
    window.Bird = makeBird();
  }
})();
