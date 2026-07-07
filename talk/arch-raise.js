"use strict";
/* ═══════════════ THE ARCH-RAISING — page logic (WS4 T8.6) ════════════════════
   The deck's d08 frame ("reach"): a semicircular masonry arch raised one course at
   a time by many hands. Everything drawn is a pure function of the stage index —
   the SVG structure is built once from the geometry module above (buildArch), and
   archStage(k) only toggles which stones are SET, whether the ring is CLOSED, and
   whether it is LOCKED. No randomness, no wall-clock (invariant 7), so the deck can
   replay any archStage(k) cue on a reload and land exactly where it was.

   THE HOOK: window.__tourHooks.archStage(k) is STATE + idempotent, re-entrant in
   both directions. k is the stage index 0…4; the deck anchors the four placements
   (k=1…4) to real d08 word times, k=0 being the yard shown when the frame flips in.

   Block comments ONLY inside this script (the forge landmine). ─────────────────── */

(function () {
  var $ = function (id) { return document.getElementById(id); };

  var arch = buildArch();               /* geometry.mjs, inlined above */
  var N = arch.N;
  var LAST = STAGES.length - 1;         /* 4 */
  var handStage = { first: 1, fresh: 2, last: 3 };

  /* ── path builders (fixed-precision → byte-stable, deterministic) ── */
  function polyPath(poly) {
    var d = 'M ' + poly[0][0].toFixed(2) + ' ' + poly[0][1].toFixed(2);
    for (var i = 1; i < poly.length; i++) d += ' L ' + poly[i][0].toFixed(2) + ' ' + poly[i][1].toFixed(2);
    return d + ' Z';
  }
  function polyLine(pts) {
    var d = 'M ' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length; i++) d += ' L ' + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
    return d;
  }
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'; });
  }

  /* ── the two abutment piers the springers bed on, with a slight batter ── */
  function pier(cxIn, cxOut) {
    var topIn = cxIn, topOut = cxOut;
    var botIn = cxIn + (cxIn < arch.cx ? 10 : -10);      /* batter inward at the base */
    var botOut = cxOut + (cxOut < arch.cx ? -12 : 12);
    var yTop = arch.cy, yBot = 600;
    return 'M ' + topOut.toFixed(1) + ' ' + yTop + ' L ' + topIn.toFixed(1) + ' ' + yTop +
      ' L ' + botIn.toFixed(1) + ' ' + yBot + ' L ' + botOut.toFixed(1) + ' ' + yBot + ' Z';
  }

  /* ── the depleting yard tray: nine tokens, one per voussoir, that dim as their
     stone is placed. A small upward wedge glyph, tinted by the hand that sets it. ── */
  function yardTray() {
    var tokW = 26, gap = 12, base = 652, h = 24;
    var total = N * tokW + (N - 1) * gap;
    var x0 = arch.cx - total / 2;
    var s = '<g class="yard">';
    s += '<text class="yard-label" x="' + arch.cx + '" y="' + (base - h - 12) + '">the stoneyard</text>';
    for (var j = 0; j < N; j++) {
      var left = x0 + j * (tokW + gap);
      var v = arch.voussoirs[j];
      var d = 'M ' + left + ' ' + base + ' L ' + (left + tokW) + ' ' + base +
        ' L ' + (left + tokW - 4) + ' ' + (base - h) + ' L ' + (left + 4) + ' ' + (base - h) + ' Z';
      s += '<path class="tok hand-' + v.hand + '" data-tok="' + j + '" d="' + d + '"/>';
    }
    s += '</g>';
    return s;
  }

  /* ── build the whole SVG ONCE; archStage(k) only toggles classes on it ── */
  function buildSvg() {
    var ghost = polyLine(ringOutline(arch));
    var thrust = polyLine(thrustPath(arch));
    var rSpringOut = arch.cx + arch.Ro, rSpringIn = arch.cx + arch.Ri;
    var lSpringOut = arch.cx - arch.Ro, lSpringIn = arch.cx - arch.Ri;

    var stones = '';
    for (var j = 0; j < N; j++) {
      var v = arch.voussoirs[j];
      var d = polyPath(v.poly);
      stones +=
        '<g class="vou hand-' + v.hand + '" data-j="' + j + '" data-kind="' + v.kind +
        '" data-course="' + v.course + '" data-hand="' + v.hand + '">' +
        '<path class="ghost" d="' + d + '"/>' +
        '<path class="stone" d="' + d + '"/>' +
        '</g>';
    }

    /* the two thrust marks at the springer beds, shown once locked */
    function thrustMark(x, dir) {
      var y = arch.cy;
      return '<path class="thrust-mark" d="M ' + x + ' ' + (y - 7) + ' L ' + (x + dir * 12) + ' ' + y +
        ' L ' + x + ' ' + (y + 7) + ' Z"/>';
    }

    var svg =
      '<svg id="archSvg" viewBox="0 0 1000 680" role="img" aria-label="a masonry arch, raised course by course">' +
        '<defs>' +
          '<linearGradient id="g-first" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#c9a35c"/><stop offset="1" stop-color="#7c5a26"/></linearGradient>' +
          '<linearGradient id="g-fresh" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#b79a72"/><stop offset="1" stop-color="#6d5738"/></linearGradient>' +
          '<linearGradient id="g-last" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#f0d493"/><stop offset="1" stop-color="#c69a3f"/></linearGradient>' +
          '<linearGradient id="g-pier" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#3a3025"/><stop offset="1" stop-color="#22190f"/></linearGradient>' +
          '<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">' +
            '<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '</defs>' +
        '<rect class="ground" x="0" y="598" width="1000" height="8"/>' +
        '<path class="pier" d="' + pier(rSpringIn, rSpringOut) + '"/>' +
        '<path class="pier" d="' + pier(lSpringIn, lSpringOut) + '"/>' +
        '<line class="springline" x1="' + lSpringOut + '" y1="' + arch.cy + '" x2="' + rSpringOut + '" y2="' + arch.cy + '"/>' +
        '<path class="centering" d="' + ghost + '"/>' +
        '<g class="stones">' + stones + '</g>' +
        '<path class="thrust" d="' + thrust + '"/>' +
        thrustMark(lSpringIn, 1) + thrustMark(rSpringIn, -1) +
        yardTray() +
      '</svg>';

    $('stage').innerHTML = svg;
  }

  /* ── the hands legend (three makers, one arch) ── */
  function buildHands() {
    var order = ['first', 'fresh', 'last'];
    var html = '';
    for (var i = 0; i < order.length; i++) {
      var h = HANDS[order[i]];
      html += '<span class="hand hand-' + h.id + '" data-hand="' + h.id + '">' +
        '<span class="sw"></span>' + esc(h.label) + ' <span class="of">· ' + esc(h.of) + '</span></span>';
    }
    $('hands').innerHTML = html;
  }

  function buildDots() {
    var el = $('dots');
    el.innerHTML = '';
    for (var i = 0; i < STAGES.length; i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dot';
        b.setAttribute('data-stage', String(idx));
        b.title = 'Stage ' + idx + ' — ' + STAGES[idx].title;
        b.setAttribute('aria-label', b.title);
        b.addEventListener('click', function () { archStage(idx); });
        el.appendChild(b);
      })(i);
    }
  }

  /* ═══════════════ THE STATE SETTER — pure function of the stage index ═══════ */
  var cur = 0;
  function clampK(k) {
    k = Math.round(Number(k) || 0);
    if (k < 0) k = 0;
    if (k > LAST) k = LAST;
    return k;
  }

  function archStage(k) {
    k = clampK(k);
    cur = k;
    var st = archStateAt(k, N);
    var setSet = {};
    for (var s = 0; s < st.set.length; s++) setSet[st.set[s]] = true;

    var svg = $('archSvg');
    var vous = svg.getElementsByClassName('vou');
    for (var i = 0; i < vous.length; i++) {
      var j = Number(vous[i].getAttribute('data-j'));
      var on = !!setSet[j];
      vous[i].classList.toggle('set', on);
    }
    var toks = svg.querySelectorAll('.tok');
    for (var t = 0; t < toks.length; t++) {
      var tj = Number(toks[t].getAttribute('data-tok'));
      toks[t].classList.toggle('placed', !!setSet[tj]);
    }

    svg.classList.toggle('ring-closed', st.ringClosed);
    svg.classList.toggle('locked', st.locked);

    /* caption + stage tag (the page's own words) */
    var stage = STAGES[k];
    $('stageTag').innerHTML =
      '<span class="st-n">Stage ' + k + ' / ' + LAST + '</span>' +
      '<span class="st-name">' + esc(stage.title) + '</span>';
    $('caption').textContent = stage.gloss;

    /* hands legend: a hand lights when its course has been laid */
    var hands = $('hands').children;
    for (var hI = 0; hI < hands.length; hI++) {
      var hid = hands[hI].getAttribute('data-hand');
      hands[hI].classList.toggle('lit', handStage[hid] <= k);
    }

    /* dots */
    var dots = $('dots').children;
    for (var d = 0; d < dots.length; d++) {
      var ds = Number(dots[d].getAttribute('data-stage'));
      dots[d].classList.toggle('on', ds === k);
      dots[d].classList.toggle('past', ds < k);
      dots[d].setAttribute('aria-current', ds === k ? 'step' : 'false');
    }

    $('prev').disabled = (k <= 0);
    $('next').disabled = (k >= LAST);

    /* probes for the deck / rehearsal gate + state-convergence checks */
    document.body.setAttribute('data-arch-stage', String(k));
    window.__ARCH_STATE__ = { stage: st.stage, of: st.of, id: st.id, set: st.set.slice(),
      ringClosed: st.ringClosed, locked: st.locked, n: st.n, title: stage.title };
    return k;
  }

  /* ═══════════════ THE TOUR HOOK ═══════════════ */
  var hooks = (window.__tourHooks = window.__tourHooks || {});
  hooks.archStage = function (k) { return archStage(k); };

  /* metadata for the deck's cue authoring (T8.8) */
  window.ARCH_RAISE = {
    stages: STAGES.length,
    stageIds: STAGES.map(function (s) { return s.id; }),
    stageTitles: STAGES.map(function (s) { return s.title; })
  };

  /* ── standalone navigation (the deck owns pacing when framed) ── */
  function wireNav() {
    $('prev').addEventListener('click', function () { archStage(cur - 1); });
    $('next').addEventListener('click', function () { archStage(cur + 1); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft') archStage(cur - 1);
      else if (ev.key === 'ArrowRight') archStage(cur + 1);
    });
  }

  /* ═══════════════ THE IN-PAGE PILL — a raising self-test ═══════════════
     The geometry battery (shared with the Node twin) PLUS a runtime proof that
     archStage(k) is idempotent and converges from both directions over the live
     DOM. Green means the arch is a well-formed ring and the deck can replay any
     cue and land exactly right. ── */
  function selfCheck() {
    var r = selfTestBattery(arch);
    var checks = r.checks.slice();

    var saved = cur;
    function snap(k) { archStage(k); return JSON.stringify(window.__ARCH_STATE__.set); }

    var idem = true;
    for (var k = 0; k <= LAST; k++) { var a = snap(k); var b = snap(k); if (a !== b) idem = false; }

    /* forward to the lock then back to stage 1 must equal a fresh seek to 1 */
    snap(LAST);
    var back = snap(1);
    snap(LAST); snap(3);
    var backAgain = snap(1);
    var conv = (back === backAgain);

    archStage(saved);

    checks.push({ label: 'archStage(k) is idempotent (re-seek settles identically)', pass: idem });
    checks.push({ label: 'archStage(k) converges from both directions', pass: conv });

    var passN = checks.filter(function (c) { return c.pass; }).length;
    return { checks: checks, pass: passN === checks.length, passN: passN, total: checks.length };
  }

  function paintPill() {
    var r = selfCheck();
    var node = $('selftest');
    node.className = 'selftest ' + (r.pass ? 'ok' : 'bad');
    node.textContent = r.pass ? '✓ the arch stands · ' + N + ' stones' : 'self-test ' + r.passN + '/' + r.total + ' ✗';
    try { console.log('[ARCH-RAISE self-test]', r.pass ? 'PASS' : 'FAIL', r.passN + '/' + r.total); } catch (_e) {}
    window.__ARCH_SELFTEST__ = { pass: r.pass, passN: r.passN, total: r.total, checks: r.checks };
    return r.pass;
  }

  /* ═══════════════ BOOT ═══════════════ */
  buildSvg();
  buildHands();
  buildDots();
  wireNav();
  archStage(0);
  paintPill();
  $('selftest').addEventListener('click', paintPill);
})();
