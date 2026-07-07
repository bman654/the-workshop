"use strict";
/* ═══════════════ THE DRIFT GALLERY — page logic (WS4 T8.5) ═══════════════════
   A deck excursion frame for d05 (the-drift). It walks a fixed, four-scene story
   about the estate's June-2026 soul drift and its surgical re-souling:

     SCENE 1  the cold flip-through — five retired exhibits, each a "chart OF the
              thing" (full-bleed, one plate at a time), read live from museum/archive/
     SCENE 2  the change beat — the correction from outside (five questions, the
              fourteen-surveyor audit, the surgical cure)
     SCENE 3  before → after pairs — the cold body on the left, the re-souled body
              at HEAD on the right, a rework arrow between (the Hydrogen Atom is
              the required pair)
     SCENE 4  the survivor — the one bench left as it was, so the story stays checkable

   PURITY (invariant 7): this page renders ONLY from the static tables below. No
   randomness, no wall-clock — the walk is a pure function of the step index, so the
   deck can replay any state cue on a reload and land exactly where it was. The
   exhibits themselves (which DO use timers/randomness) are never inlined here — they
   are loaded by RELATIVE-PATH iframe, exactly the way talk/dev-showing.html frames
   the estate's rooms — so this page's own source stays clean for the frame manifest.

   THE HOOK: window.__tourHooks.galleryTo(k) is STATE + idempotent. k is a flat step
   index 1…N over the whole walk; the deck anchors each step to a real word time.
   The scene→first-step map is exposed for the deck as GALLERY.sceneStart. ────────── */

(function () {
  var LOGICAL_W = 1200;                 /* the logical desktop width each exhibit is scaled from */

  var $ = function (id) { return document.getElementById(id); };

  /* ── The verbatim QUOTES ledger. Every string here is READ from a source file /
     commit at the cited ref and diffed whitespace-normalized before shipping
     (invariant 3, the quotation covenant); the page presents them as quotations,
     it does not invent them. The tools/tour/drift-gallery.test.mjs twin re-proves
     each against its git source (normalized), and re-proves the walk's shape. ── */
  var QUOTES = {
    'pp-confession': {
      text: 'an honest rendering of the continuous ODE populations — not an independent agent sim',
      cite: 'its own footer · 4b4fb90'
    },
    'per-brandon': {
      text: 'per Brandon',
      cite: 'the soul-restore commit · 716cfb8'
    },
    'audit-cure': {
      text: 'surgical re-souling of two pockets + a thin scatter, never an estate-wide overhaul',
      cite: 'the estate soul audit · 56a7115'
    },
    'hydrogen-soul': {
      text: 'a touchable, rotatable orbital cloud',
      cite: 'its re-soul commit · cc5a22e'
    },
    'lattice-soul': {
      text: 'a crystal you pour electrons into',
      cite: 'its re-soul commit · b60179a'
    }
  };

  /* ── The walk. Ten steps across four scenes; every exhibit path is RELATIVE.
     The cold plates read from museum/archive/ (the retired-exhibit archive); the
     "after" bodies read from the exhibits' live paths at HEAD. ── */
  var STEPS = [
    /* SCENE 1 — the cold flip-through (full-bleed, one plate at a time) */
    { scene: 1, kind: 'plate', title: 'The Hydrogen Atom', sha: '2e12cf1', date: '2026-06-14',
      src: '../museum/archive/hydrogen-2e12cf1.html',
      cap: [{ t: 'A radial wavefunction, plotted; an energy-level ladder; a screening slider. Self-test 5/5. Correct — and a chart.' }] },
    { scene: 1, kind: 'plate', title: 'The Lattice', sha: '1f47be4', date: '2026-06-13',
      src: '../museum/archive/lattice-1f47be4.html',
      cap: [{ t: 'One atom promised a crystal — and delivered a dispersion band chart. Self-test 8/8.' }] },
    { scene: 1, kind: 'plate', title: 'Predator & Prey', sha: '4b4fb90', date: '2026-06-15',
      src: '../museum/archive/predator-prey-4b4fb90.html',
      cap: [{ t: 'A phase portrait with a conserved quantity, proven. Its own footer confessed it: ' }, { q: 'pp-confession' }, { t: '.' }] },
    { scene: 1, kind: 'plate', title: 'The Stirling Cycle', sha: '47160c4', date: '2026-06-14',
      src: '../museum/archive/stirling-47160c4.html',
      cap: [{ t: 'A heat engine, as a pressure–volume diagram. Self-test 9/9.' }] },
    { scene: 1, kind: 'plate', title: 'The Replicator', sha: '5b698d4', date: '2026-06-15',
      src: '../museum/archive/replicator-5b698d4.html',
      cap: [{ t: 'Strategies evolving to an equilibrium — a simplex, conserved.' }] },

    /* SCENE 2 — the change beat (no exhibit; the correction itself) */
    { scene: 2, kind: 'beat', title: 'The correction came from outside',
      cap: [
        { t: 'Nobody inside could see the drift — every maker lived one turn, and every look was a first look. The continuous memory outside the walls did. The soul-restore commit says ' },
        { q: 'per-brandon' },
        { t: ': a five-question definition of done. Fourteen surveyors then bounded it — about fourteen percent, two pockets. The audit’s cure, in its own words: ' },
        { q: 'audit-cure' },
        { t: '.' }
      ] },

    /* SCENE 3 — before → after pairs (cold left, re-souled HEAD right) */
    { scene: 3, kind: 'pair', title: 'The Hydrogen Atom', required: true,
      beforeSrc: '../museum/archive/hydrogen-2e12cf1.html', beforeSha: '2e12cf1',
      afterSrc: '../cavern/hydrogen/index.html', afterSha: 'cc5a22e', afterDate: '2026-06-15',
      cap: [{ t: 'The plotted curve became, in its commit’s words, ' }, { q: 'hydrogen-soul' }, { t: '. Same truth, new body.' }] },
    { scene: 3, kind: 'pair', title: 'Predator & Prey',
      beforeSrc: '../museum/archive/predator-prey-4b4fb90.html', beforeSha: '4b4fb90',
      afterSrc: '../conservatory/predator-prey/index.html', afterSha: '0bb51a5', afterDate: '2026-06-15',
      cap: [{ t: 'The equations became hares and lynxes that hunt and starve — the chart became a population you watch live.' }] },
    { scene: 3, kind: 'pair', title: 'The Lattice',
      beforeSrc: '../museum/archive/lattice-1f47be4.html', beforeSha: '1f47be4',
      afterSrc: '../cavern/lattice/index.html', afterSha: 'b60179a', afterDate: '2026-06-15',
      cap: [{ t: 'The band chart became, in its commit’s words, ' }, { q: 'lattice-soul' }, { t: '.' }] },

    /* SCENE 4 — the survivor (a held, hook-less bench; framed, never poked — inv 6) */
    { scene: 4, kind: 'survivor', title: 'The survivor bench', sha: 'HEAD', date: '2026-06-15',
      src: '../conservatory/sir/index.html',
      cap: [{ t: 'One bench was left standing as it was. The survivor still shows the cloned form — so the story of that week stays checkable.' }] }
  ];

  var SCENES = [
    { n: 1, name: 'The drift' },
    { n: 2, name: 'The correction' },
    { n: 3, name: 'The re-souling' },
    { n: 4, name: 'The survivor' }
  ];

  var N = STEPS.length;

  /* scene → first step index (1-based), exposed so the deck can anchor at scene
     granularity or at per-plate granularity (each STEP is a real word-time anchor). */
  var sceneStart = {};
  for (var si = 0; si < STEPS.length; si++) {
    var sn = STEPS[si].scene;
    if (sceneStart[sn] === undefined) sceneStart[sn] = si + 1;
  }

  /* ── DOM handles ── */
  var stage = $('stage');
  var arrow = $('arrow');
  var beat = $('beat');
  var caption = $('caption');
  var sceneTag = $('sceneTag');
  var stepMeta = $('stepMeta');
  var dotsEl = $('dots');

  /* ── the mount-once iframe cache, keyed by src. A screen is created and its src
     set the first time a step needs it, then reused (so backward seeks never
     reload). Each screen scales a fixed logical-width desktop render to fit its
     slot, top-aligned, so the whole exhibit reads at a glance. ── */
  var screens = {};                                  /* src → { wrap, scaler, iframe } */
  function frameFor(src) {
    if (screens[src]) return screens[src];
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.setAttribute('data-src', src);
    var scaler = document.createElement('div');
    scaler.className = 'screen-scale';
    var iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'exhibit — ' + src);
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('tabindex', '-1');
    iframe.src = src;                                 /* lazy: only the shown exhibits load */
    scaler.appendChild(iframe);
    wrap.appendChild(scaler);
    stage.appendChild(wrap);
    screens[src] = { wrap: wrap, scaler: scaler, iframe: iframe };
    return screens[src];
  }

  function hideAllScreens() {
    for (var k in screens) if (screens.hasOwnProperty(k)) screens[k].wrap.classList.remove('shown', 'full', 'left', 'right', 'survivor');
  }

  /* scale the fixed logical-width render to the screen's live box (width-fit,
     top-aligned). A pure geometry read — no timers, no wall-clock. */
  function rescale(entry) {
    if (!entry) return;
    var box = entry.wrap.getBoundingClientRect();
    var s = box.width / LOGICAL_W;
    if (!(s > 0)) s = 1;
    entry.scaler.style.transform = 'scale(' + s + ')';
    entry.scaler.style.width = LOGICAL_W + 'px';
    entry.scaler.style.height = (box.height > 0 ? Math.ceil(box.height / s) : 900) + 'px';
  }
  function rescaleShown() {
    for (var k in screens) if (screens.hasOwnProperty(k)) {
      if (screens[k].wrap.classList.contains('shown')) rescale(screens[k]);
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
    });
  }

  /* render a caption spec (array of { t } text runs and { q } quote refs) into
     HTML, wrapping every verbatim quote in a <q class="cited"> so it reads as a
     quotation, never as the page's own drawn words. */
  function renderCaption(spec) {
    var html = '';
    for (var i = 0; i < spec.length; i++) {
      var run = spec[i];
      if (run.t !== undefined) {
        html += esc(run.t);
      } else if (run.q !== undefined) {
        var Q = QUOTES[run.q];
        html += '<q class="cited" title="' + esc(Q.cite) + '">' + esc(Q.text) + '</q>';
      }
    }
    return html;
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    for (var i = 0; i < STEPS.length; i++) {
      (function (idx) {
        var st = STEPS[idx];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dot scene-' + st.scene;
        b.setAttribute('data-step', String(idx + 1));
        b.setAttribute('aria-label', 'step ' + (idx + 1) + ' — ' + st.title);
        b.title = 'Scene ' + st.scene + ' — ' + st.title;
        if (idx + 1 < N && STEPS[idx + 1].scene !== st.scene) b.classList.add('scene-end');
        b.addEventListener('click', function () { galleryTo(idx + 1); });
        dotsEl.appendChild(b);
      })(i);
    }
  }

  /* ═══════════════ THE STATE SETTER — pure function of the step index ═════════
     galleryTo(k) reconstructs the ENTIRE visible state (which exhibit screens are
     mounted+shown and where, the arrow, the beat panel, the caption, the scene tag,
     the active dot) from k alone. Idempotent, STATE-convergent: re-calling it with
     the current k re-settles identically; calling any k jumps straight there. This
     is what lets the deck replay every cue ≤ the seek target on a reload. ── */
  var cur = 0;
  function clampK(k) {
    k = Math.round(Number(k) || 1);
    if (k < 1) k = 1;
    if (k > N) k = N;
    return k;
  }

  function galleryTo(k) {
    k = clampK(k);
    cur = k;
    var st = STEPS[k - 1];

    hideAllScreens();
    arrow.classList.remove('shown');
    beat.classList.remove('shown');
    stage.classList.remove('is-pair', 'is-beat', 'is-single');

    if (st.kind === 'plate' || st.kind === 'survivor') {
      var e = frameFor(st.src);
      e.wrap.classList.add('shown', 'full');
      if (st.kind === 'survivor') e.wrap.classList.add('survivor');
      stage.classList.add('is-single');
    } else if (st.kind === 'pair') {
      var L = frameFor(st.beforeSrc);
      var R = frameFor(st.afterSrc);
      L.wrap.classList.add('shown', 'left');
      R.wrap.classList.add('shown', 'right');
      arrow.classList.add('shown');
      arrow.innerHTML =
        '<span class="arrow-shaft">re-souled →</span>' +
        '<span class="arrow-sha">' + esc(st.afterSha) + '</span>' +
        '<span class="arrow-date">' + esc(st.afterDate) + '</span>';
      stage.classList.add('is-pair');
    } else if (st.kind === 'beat') {
      beat.classList.add('shown');
      beat.innerHTML =
        '<div class="beat-inner">' +
          '<h2 class="beat-h">' + esc(st.title) + '</h2>' +
          '<p class="beat-body">' + renderCaption(st.cap) + '</p>' +
        '</div>';
      stage.classList.add('is-beat');
    }

    /* the meta line (which exhibit, at which sha/date) */
    if (st.kind === 'beat') {
      stepMeta.innerHTML = '';
    } else if (st.kind === 'pair') {
      stepMeta.innerHTML =
        '<span class="ex">' + esc(st.title) + '</span>' +
        '<span class="ba"><span class="sha cold">' + esc(st.beforeSha) + '</span>' +
        ' <span class="sep">→</span> <span class="sha warm">' + esc(st.afterSha) + '</span></span>';
    } else {
      stepMeta.innerHTML =
        '<span class="ex">' + esc(st.title) + '</span>' +
        '<span class="sha cold">' + esc(st.sha) + '</span>' +
        '<span class="date">' + esc(st.date) + '</span>';
    }

    /* the caption band (beat carries its prose in the panel itself) */
    caption.innerHTML = (st.kind === 'beat') ? '' : renderCaption(st.cap);
    caption.classList.toggle('empty', st.kind === 'beat');

    /* scene tag */
    var sc = SCENES[st.scene - 1];
    sceneTag.innerHTML =
      '<span class="sc-n">Scene ' + st.scene + ' / ' + SCENES.length + '</span>' +
      '<span class="sc-name">' + esc(sc ? sc.name : '') + '</span>';

    /* dots */
    var dots = dotsEl.children;
    for (var d = 0; d < dots.length; d++) {
      var dstep = Number(dots[d].getAttribute('data-step'));
      dots[d].classList.toggle('on', dstep === k);
      dots[d].classList.toggle('past', dstep < k);
      dots[d].setAttribute('aria-current', dstep === k ? 'step' : 'false');
    }

    /* nav affordances */
    $('prev').disabled = (k <= 1);
    $('next').disabled = (k >= N);

    /* probes for the deck / rehearsal gate + the state-convergence check */
    document.body.setAttribute('data-gallery-step', String(k));
    document.body.setAttribute('data-gallery-scene', String(st.scene));
    window.__GALLERY_STATE__ = { step: k, scene: st.scene, kind: st.kind, of: N };

    rescaleShown();
    return k;
  }

  /* ═══════════════ THE TOUR HOOK — galleryTo(k), STATE + idempotent ═══════════
     window.__tourHooks.galleryTo(k) lets talk/dev-showing.html walk the drift
     story in step with Cairn's d05 narration. STATE, not impulse: it fully
     reconstructs the frame from k, so a reload/scrub replays cleanly. ── */
  var hooks = (window.__tourHooks = window.__tourHooks || {});
  hooks.galleryTo = function (k) { return galleryTo(k); };

  /* expose the walk metadata for the deck's cue authoring (T8.8) */
  window.GALLERY = { steps: N, scenes: SCENES.length, sceneStart: sceneStart };

  /* ── standalone navigation (the deck owns pacing when framed; these are for a
     human opening the page directly) ── */
  $('prev').addEventListener('click', function () { galleryTo(cur - 1); });
  $('next').addEventListener('click', function () { galleryTo(cur + 1); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft') { galleryTo(cur - 1); }
    else if (ev.key === 'ArrowRight') { galleryTo(cur + 1); }
  });

  /* keep scaled renders correct as the box changes size */
  if (typeof ResizeObserver === 'function') {
    var ro = new ResizeObserver(function () { rescaleShown(); });
    ro.observe(stage);
  }
  window.addEventListener('resize', rescaleShown);

  /* ═══════════════ THE IN-PAGE PILL — a walk self-test ═══════════════
     A small battery over the same STEPS/QUOTES tables the page renders from,
     kin to the Node twin tools/tour/drift-gallery.test.mjs. Green means
     the walk is well-formed: the required Hydrogen pair is present, every exhibit
     path is relative, the scenes are contiguous, every quote resolves. ── */
  function selfCheck() {
    var checks = [];
    var add = function (label, pass) { checks.push({ label: label, pass: !!pass }); };

    add('four scenes, ten steps', SCENES.length === 4 && N === 10);

    var contiguous = true, seen = 0;
    for (var i = 0; i < STEPS.length; i++) {
      if (STEPS[i].scene < seen) contiguous = false;
      seen = STEPS[i].scene;
    }
    add('steps grouped in scene order', contiguous);

    var hydroPair = false;
    for (var j = 0; j < STEPS.length; j++) {
      if (STEPS[j].kind === 'pair' && STEPS[j].required &&
          STEPS[j].beforeSrc.indexOf('hydrogen') >= 0 && STEPS[j].afterSrc.indexOf('hydrogen') >= 0) hydroPair = true;
    }
    add('the Hydrogen Atom before/after pair is present', hydroPair);

    var rel = true;
    for (var m = 0; m < STEPS.length; m++) {
      var st = STEPS[m];
      var paths = [];
      if (st.src) paths.push(st.src);
      if (st.beforeSrc) paths.push(st.beforeSrc);
      if (st.afterSrc) paths.push(st.afterSrc);
      for (var p = 0; p < paths.length; p++) {
        if (paths[p].slice(0, 3) !== '../' || /^[a-z]+:/i.test(paths[p])) rel = false;
      }
    }
    add('every exhibit path is a relative sibling', rel);

    var quotesOk = true;
    for (var s = 0; s < STEPS.length; s++) {
      var cap = STEPS[s].cap || [];
      for (var c = 0; c < cap.length; c++) {
        if (cap[c].q !== undefined && (!QUOTES[cap[c].q] || !QUOTES[cap[c].q].text)) quotesOk = false;
      }
    }
    add('every cited quote resolves in the ledger', quotesOk);

    var pass = checks.every(function (c) { return c.pass; });
    return { checks: checks, pass: pass };
  }
  function paintPill() {
    var r = selfCheck();
    var node = $('selftest');
    node.className = 'selftest ' + (r.pass ? 'ok' : 'bad');
    var passN = r.checks.filter(function (c) { return c.pass; }).length;
    node.textContent = r.pass
      ? '✓ the walk reads true · ' + N + ' steps'
      : 'self-test ' + passN + '/' + r.checks.length + ' ✗';
    try { console.log('[DRIFT-GALLERY self-test]', r.pass ? 'PASS' : 'FAIL', passN + '/' + r.checks.length); } catch (_e) {}
    window.__GALLERY_SELFTEST__ = { pass: r.pass, passN: passN, total: r.checks.length, checks: r.checks };
    return r.pass;
  }
  $('selftest').addEventListener('click', paintPill);

  /* ═══════════════ BOOT ═══════════════ */
  buildDots();
  galleryTo(1);
  paintPill();
})();
