/* ══════════════════════════════════════════════════════════════════════════════
   THE SHOWING — the ledger face's STATE hooks (content wave 2 · DESIGN §10).

   ledger/face.html is ch11's held frame ("STONE BY STONE"). These hooks let the
   deck walk the cairn in step with the narration: a gentle readable drift down
   the newest stones (opening a koan or two), a long WHOOSH down the pile — the
   pile's sheer depth is the point — to the FOUNDING stone (opened as the
   narration reads its koan aloud), then below the ground line to the unmarked
   stones of the prehistory.

   RECORD SAFETY: this file only SCROLLS and toggles the page's own `.open`
   class (the same thing a visitor's click does). It never reads, writes, or
   reorders a single record. It is included into face.src.html as one additive
   <script> block — the same sanctioned shape as the tour include (WS2 E1).

   CLASS — STATE (§10): both verbs are idempotent-by-target. cairnTo re-called
   with the same target converges (a glide in flight toward it is left alone; a
   new target cancels the old glide — the crankGlide token idiom). openKoan on
   an already-open stone is a no-op. A seek replay therefore reconstructs the
   rehearsed scroll position + open koans. Under reduced motion both JUMP.

   Block comments only (forge landmine); no module.exports.
   ══════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  function reduced() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches; }
    catch (e) { return false; }
  }
  /* resolve a target token to an element (or null for 'frac:' document targets) */
  function stoneAt(fr) {
    var cairn = document.getElementById('cairn');
    if (!cairn) return null;
    var stones = cairn.querySelectorAll('.stone');
    if (!stones.length) return null;
    var i = Math.max(0, Math.min(stones.length - 1, Math.round(fr * (stones.length - 1))));
    return stones[i]; /* 0 = newest (top of pile), 1 = the founder (base) */
  }
  function resolveEl(target) {
    target = String(target == null ? '' : target);
    if (target === 'founder') return document.querySelector('.stone.founder');
    if (target === 'silence') return document.querySelector('.silence');
    if (target.indexOf('stone:') === 0) return stoneAt(parseFloat(target.slice(6)) || 0);
    return null;
  }
  function targetY(target) {
    target = String(target == null ? '' : target);
    if (target === 'top') return 0;
    if (target.indexOf('frac:') === 0) {
      var fr = Math.max(0, Math.min(1, parseFloat(target.slice(5)) || 0));
      var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return fr * max;
    }
    var el = resolveEl(target);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return window.scrollY + r.top - (window.innerHeight - r.height) / 2; /* centre it */
  }

  var token = 0;
  var hooks = window.__tourHooks = window.__tourHooks || {};

  /* cairnTo(target, ms): glide the page's scroll to a rehearsed waypoint.
     target: 'top' · 'frac:<0..1>' · 'stone:<0..1 of the pile, 0=newest>' ·
     'founder' · 'silence'.  ms: glide duration (default 1200; RM jumps). */
  hooks.cairnTo = function (target, ms) {
    var y = targetY(target);
    if (y == null) return false;
    y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight));
    var my = ++token;
    if (reduced() || !(ms > 0)) { window.scrollTo(0, y); return true; }
    var y0 = window.scrollY, dy = y - y0;
    if (Math.abs(dy) < 2) return true;
    var t0 = performance.now();
    (function step(now) {
      if (my !== token) return;                       /* superseded by a newer glide */
      var k = Math.min(1, (now - t0) / ms);
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;  /* easeInOutQuad */
      window.scrollTo(0, y0 + dy * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
    return true;
  };

  /* openKoan(target): open the koan on 'founder' or 'stone:<fr>' — exactly the
     page's own click toggle, applied one-way (idempotent; never closes). */
  hooks.openKoan = function (target) {
    var el = resolveEl(target);
    if (!el || !el.classList || !el.classList.contains('stone')) return false;
    el.classList.add('open');
    return true;
  };
})();
