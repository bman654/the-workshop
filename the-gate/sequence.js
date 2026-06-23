/* ═══════════════════════════════════════════════════════════════════════════
   sequence.js  —  the click-through state machine + DEV URL override
                   (window.Gate.sequence)

   The journey (description.md):
     black → fade-in 2s → IDLE (gates closed, interactive)
       → on gate click: gears turn 2.5s → gates swing outward 2.5s
       → fade to black 2s → welcome card holds 3s → navigate to ../index.html

   prefers-reduced-motion: collapse the animations (snap, short holds) but STILL
   navigate. Calls WS.seen('the-gate') on entry to IDLE.

   DEV URL OVERRIDE (from day one):
     ?dev | ?scene=idle  → boot STRAIGHT to idle revealed (no black/fade), gates
                           closed + interactive.
     ?scene=open         → idle with gates already open.
     ?t=day|dusk|night   → pin the band (skip the local-clock classifier).
     ?moon=<0..1>        → pin moonK (illuminated fraction) for brightness.
     ?wx=clear|cloudy|storm → pin weather.
     ?seed=<n>           → seed the weather RNG.
     ?undercroft=1       → FORCE the undercroft hatch visible (dev review only;
                           production stays earned-only via the store predicate).
     ?room=<id>          → PIN which room's rep renders in the grounds slot (dev
                           review only; a slab room id, e.g. ?room=verse). Falls
                           back to the Cairn default when absent or not in the slab.

   This module owns ONLY the state machine + timings + URL parsing. It calls into
   the gate's swing/spin (Gate.scenegate) and the colormap crossfade (via a
   `recolor()` callback the boot dispatcher supplies), so the boot stays a thin
   dispatcher and asset agents never touch this file.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var SEQ = {};

  // timings (ms) — real even though greybox art is rough.
  var T_FADEIN = 2000, T_GEARS = 2500, T_SWING = 2500, T_FADEOUT = 2000, T_WELCOME = 3000;

  var phase = 'boot';        // boot|fadein|idle|gears|swing|fadeout|welcome|done
  var clicked = false;
  var ctx = null;            // { svgHost, overlay, welcomeEl, S, recolor, reduced, navigate }

  SEQ.phase = function () { return phase; };

  /* parseUrl(): read location.search → the dev overrides. */
  SEQ.parseUrl = function (search) {
    var q = {};
    var s = (search || '').replace(/^\?/, '');
    s.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i);
      var v = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1));
      q[k] = v;
    });
    var dev = ('dev' in q) || q.scene === 'idle' || q.scene === 'open';
    var out = {
      dev: dev,
      scene: q.scene || (('dev' in q) ? 'idle' : null),   // 'idle' | 'open' | null
      t: (['day', 'dusk', 'night'].indexOf(q.t) >= 0) ? q.t : null,
      moon: (q.moon != null && q.moon !== '' && !isNaN(+q.moon)) ? Math.max(0, Math.min(1, +q.moon)) : null,
      wx: (['clear', 'cloudy', 'storm'].indexOf(q.wx) >= 0) ? q.wx : null,
      seed: (q.seed != null && q.seed !== '' && !isNaN(+q.seed)) ? (+q.seed) : null,
      undercroft: ('undercroft' in q) && q.undercroft !== '0' && q.undercroft !== 'false',
      room: q.room || null,
      // ?smil=<seconds> — freeze the SVG animation clock at a fixed time, so an
      // animated rep can be rendered/judged at chosen phases of its loop (headless
      // --virtual-time-budget does NOT advance SMIL; setCurrentTime does).
      smil: (q.smil != null && q.smil !== '' && !isNaN(+q.smil)) ? Math.max(0, +q.smil) : null
    };
    return out;
  };

  function reducedMotion() {
    try { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }
  // exposed so the boot can freeze ambient SMIL (e.g. the Ripple Tank) under
  // reduced-motion — one source of truth for the media-query check (SPEC §2.5.5).
  SEQ.prefersReducedMotion = reducedMotion;

  /* start(context): begin the sequence.
     context = {
       overlay,        // the black overlay element (opacity 1 = black)
       welcomeEl,      // the welcome card element (hidden initially)
       S,              // Gate.scene
       dev,            // boolean — dev override active
       scene,          // 'idle'|'open'|null
       onEnterIdle,    // optional cb when we land in idle (wire the click)
     }  */
  SEQ.start = function (context) {
    ctx = context || {};
    ctx.reduced = reducedMotion();

    if (ctx.dev) {
      // dev: no black, no fade. Show scene immediately.
      if (ctx.overlay) { ctx.overlay.style.transition = 'none'; ctx.overlay.style.opacity = '0'; }
      enterIdle();
      if (ctx.scene === 'open') {
        // gates already open (no animation)
        if (Gate.scenegate) Gate.scenegate.swing(1, ctx.S);
        phase = 'idle'; // still interactive-ish, but open
      }
      return;
    }

    // normal boot: start black, fade in over 2s
    phase = 'fadein';
    if (ctx.overlay) {
      ctx.overlay.style.opacity = '1';
      // double-rAF so the transition runs
      var ms = ctx.reduced ? 200 : T_FADEIN;
      ctx.overlay.style.transition = 'opacity ' + ms + 'ms ease';
      raf2(function () { ctx.overlay.style.opacity = '0'; });
      setTimeout(enterIdle, ms);
    } else {
      enterIdle();
    }
  };

  function enterIdle() {
    phase = 'idle';
    // breadcrumb: a visit registers for the Survey of Heaven / Undercroft
    try { if (root.WS && root.WS.seen) root.WS.seen('the-gate'); } catch (e) {}
    if (typeof ctx.onEnterIdle === 'function') ctx.onEnterIdle();
  }

  /* triggerOpen(): the gate was clicked. Run gears → swing → fade → welcome → nav.
     Idempotent (ignores a second click). */
  SEQ.triggerOpen = function () {
    if (clicked || phase !== 'idle') return;
    clicked = true;
    var S = ctx.S;

    if (ctx.reduced) {
      // collapse: snap gears+gate open, brief fade, short welcome, navigate.
      if (Gate.scenegate) { Gate.scenegate.spinGears(2, S); Gate.scenegate.swing(1, S); }
      phase = 'fadeout';
      fadeOut(300, function () { showWelcome(900, navigate); });
      return;
    }

    // 1) gears turn (2.5s)
    phase = 'gears';
    tween(T_GEARS, function (p) {
      if (Gate.scenegate) Gate.scenegate.spinGears(2 * easeInOut(p), S);
    }, function () {
      // 2) gates swing outward (2.5s)
      phase = 'swing';
      tween(T_SWING, function (p) {
        if (Gate.scenegate) Gate.scenegate.swing(easeInOut(p), S);
      }, function () {
        // 3) fade to black (2s)
        phase = 'fadeout';
        fadeOut(T_FADEOUT, function () {
          // 4) welcome card holds 3s → navigate
          showWelcome(T_WELCOME, navigate);
        });
      });
    });
  };

  function fadeOut(ms, done) {
    if (ctx.overlay) {
      ctx.overlay.style.transition = 'opacity ' + ms + 'ms ease';
      raf2(function () { ctx.overlay.style.opacity = '1'; });
    }
    setTimeout(done, ms);
  }

  function showWelcome(holdMs, done) {
    phase = 'welcome';
    if (ctx.welcomeEl) {
      ctx.welcomeEl.style.display = 'flex';
      raf2(function () { ctx.welcomeEl.classList.add('in'); });
    }
    setTimeout(done, holdMs);
  }

  function navigate() {
    phase = 'done';
    var dest = (ctx && ctx.dest) || '../index.html';
    try { root.location.href = dest; } catch (e) {}
  }

  /* ── small animation utils ──────────────────────────────────────────────────── */
  function raf2(fn) {
    var r = root.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    r(function () { r(fn); });
  }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tween(ms, step, done) {
    var t0 = (root.performance && root.performance.now) ? root.performance.now() : Date.now();
    var raf = root.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
    function frame(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / ms));
      step(p);
      if (p < 1) raf(frame); else if (done) done();
    }
    raf(frame);
  }

  Gate.sequence = SEQ;

  if (typeof module !== 'undefined' && module.exports) { module.exports = SEQ; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
