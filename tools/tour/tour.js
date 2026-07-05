/* ═══════════════════════════════════════════════════════════════════════════
   tour.js — the Grand Tour docent ENGINE (WS2 / DESIGN §1, §3, §5, §7).

   Authored, forge-included alongside the thread data (tours.js) into the front
   door + every stop page. Reads `?tour=<id>&stop=<n>` (the URL is the sole state
   carrier, §1) and — when the params are valid AND this page IS stops[n].href —
   mounts ONE engraved docent card in the estate's brass-on-ink grammar, records
   the high-water mark, performs the stop's beats, dwells, then walks on.

   ── What this file is (T0.2) ─────────────────────────────────────────────────
   The docent CHROME (the card) + the STATE MACHINE (load→ARRIVE→PERFORM→DWELL→
   ADVANCE, plus FINALE, wandered-off, pause/soft-pause/hold, bfcache re-entry) +
   the deploy-independent `rel()` URL builder + the `ws:` write points. The PERFORM
   phase is a thin seam here (do-nothing default); T0.3 fills in the layered beats
   runtime (`__tourAct` → `[data-tour-spot]` walk → default) behind the same seam.
   The front-door overture + TOURS drawer are the front door's own page contract
   (T1.1/T1.2), not this engine.

   ── Dual-use module (the ws.js/tours.js idiom) ───────────────────────────────
   In a browser this attaches a `GrandTour` global (pure helpers + the machine
   factory) and, once the DOM is ready, boots itself off the URL. Under Node it
   exports the same pure surface so the twin (tour.test.mjs) can drive every
   decision without a DOM. forge strips the trailing `module.exports` guard on
   inline. Comments inside a forge-included block use the block form ONLY, never a
   multi-line `<!-- -->` (the forge landmine that silently kills the script).

   ── The docent sentinel ──────────────────────────────────────────────────────
   `DOCENT_SENTINEL` ('grand-tour-docent') is the marker string tour-check looks
   for in a shipped stop page to prove the include is present (the forgotten-
   include gate, DESIGN §5/§8). tours.js defines the same literal; this engine
   carries it too (it is stamped onto the mounted card's container as
   data-tour-docent) so the sentinel is present whether or not tour mode fires.

   Vanilla, ES5-ish, zero-dependency. NO Math.random / Date.* in logic paths
   (DESIGN §1 determinism); rAF/perf-now timers are UI pacing only.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* The forgotten-include gate's marker (DESIGN §5/§8). Keep in lockstep with
     tours.js DOCENT_SENTINEL and tour-check. */
  var DOCENT_SENTINEL = 'grand-tour-docent';

  var DEFAULT_DWELL = 18000; /* ms, §1 (per-stop `dwell` overrides it) */
  var ACT_CAP = 45000;       /* ms hard cap on a beats act (§4) — then proceed to DWELL */
  var SPOT_DWELL = 4000;     /* ms per [data-tour-spot] in the declarative walk (§4) */

  /* ════════════════════════════════════════════════════════════════════════
     PURE LOGIC — no DOM, no Date, no Math.random. Exported for the Node twin.
     ════════════════════════════════════════════════════════════════════════ */

  /* ── URL / path helpers ──────────────────────────────────────────────────── */
  function pathOf(href) { return String(href).split('#')[0].split('?')[0]; }
  function splitHref(href) {
    var s = String(href), hash = '', query = '';
    var h = s.indexOf('#'); if (h >= 0) { hash = s.slice(h); s = s.slice(0, h); }
    var q = s.indexOf('?'); if (q >= 0) { query = s.slice(q); s = s.slice(0, q); }
    return { path: s, query: query, hash: hash };
  }
  function dirOf(p) { var i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); }
  function countSegments(d) { return d === '' ? 0 : d.split('/').length; }
  function isAbsolute(href) {
    return /^\/\//.test(href) || /^\//.test(href) || /^[a-z][a-z0-9+.-]*:\/\//i.test(href);
  }
  /* DESIGN §1 — the deploy-independent relative URL builder (BINDING formula).
     `from`/`to` are repo-relative; the estate uses only current-relative links,
     so the engine NEVER emits an absolute path. */
  function rel(from, to) { return '../'.repeat(countSegments(dirOf(pathOf(from)))) + to; }

  /* Merge the engine's two params (tour, stop) onto a stop's own query, keeping
     the stop's own query/hash. */
  function mergeTourParams(href, id, n) {
    var p = splitHref(href);
    var usp = new URLSearchParams(p.query.charAt(0) === '?' ? p.query.slice(1) : p.query);
    usp.set('tour', id); usp.set('stop', String(n));
    var qs = usp.toString();
    return p.path + (qs ? '?' + qs : '') + p.hash;
  }
  /* Strip ONLY the engine's two keys from a search string; return the rebuilt
     search (with leading '?' iff non-empty). Leave records nothing else. */
  function stripTourParams(search) {
    var s = String(search || '');
    var usp = new URLSearchParams(s.charAt(0) === '?' ? s.slice(1) : s);
    usp.delete('tour'); usp.delete('stop');
    var qs = usp.toString();
    return qs ? '?' + qs : '';
  }
  /* Parse the engine's params from a search string → {tour, stop} | null.
     Missing `stop` defaults to 0; a non-numeric stop forces out-of-range. */
  function parseTourParams(search) {
    var s = String(search || '');
    var usp = new URLSearchParams(s.charAt(0) === '?' ? s.slice(1) : s);
    if (!usp.has('tour')) return null;
    var raw = usp.get('stop');
    var stop = raw == null ? 0 : parseInt(raw, 10);
    if (isNaN(stop)) stop = -1;
    return { tour: usp.get('tour'), stop: stop };
  }

  /* Deploy-independent "is this page stops[n].href?" — compares the current
     pathname's tail against the repo-relative href on a SEGMENT boundary, so the
     Pages base (/the-workshop/) and localhost (/) both match, and 'pool/…' never
     matches 'the-pool/…'. A directory URL ('/x/') normalizes to '/x/index.html'. */
  function normPathname(p) {
    var s = String(p == null ? '' : p).split('#')[0].split('?')[0];
    if (s === '') s = '/';
    if (s.charAt(s.length - 1) === '/') s += 'index.html';
    return s;
  }
  function pageMatches(pathname, href) {
    var target = pathOf(href);
    var np = normPathname(pathname);
    if (np === target) return true;
    var needle = '/' + target;
    return np.length >= needle.length && np.slice(np.length - needle.length) === needle;
  }

  /* ── tour lookup + the load-time classification (the state-machine entry) ──── */
  function findTour(tours, id) {
    if (!Array.isArray(tours)) return null;
    for (var i = 0; i < tours.length; i++) if (tours[i] && tours[i].id === id) return tours[i];
    return null;
  }
  /* classifyLoad → one of:
       {mode:'normal',  reason}                       — no/unknown/out-of-range params
       {mode:'wandered', tour, stop, stopIndex}       — valid params, wrong page
       {mode:'tour', tour, stop, stopIndex, stopCount, isFinale, isHold} */
  function classifyLoad(tours, params, pathname) {
    if (!params || params.tour == null) return { mode: 'normal', reason: 'no-params' };
    var t = findTour(tours, params.tour);
    if (!t) return { mode: 'normal', reason: 'unknown-tour' };
    var stops = Array.isArray(t.stops) ? t.stops : [];
    var n = params.stop;
    if (typeof n !== 'number' || !isFinite(n) || n < 0 || Math.floor(n) !== n || n >= stops.length)
      return { mode: 'normal', reason: 'stop-out-of-range' };
    var stop = stops[n];
    if (!pageMatches(pathname, stop.href)) return { mode: 'wandered', tour: t, stop: stop, stopIndex: n };
    return {
      mode: 'tour', tour: t, stop: stop, stopIndex: n, stopCount: stops.length,
      isFinale: (n === stops.length - 1), isHold: !!stop.hold
    };
  }

  /* ── link targets (all via rel(); the engine never emits an absolute path) ── */
  function stopHrefPath(tour, n) { return pathOf(tour.stops[n].href); }
  function targetTo(tour, n, fromHref) {
    var dest = splitHref(tour.stops[n].href);
    var relPath = rel(fromHref, dest.path);
    return mergeTourParams(relPath + dest.query + dest.hash, tour.id, n);
  }
  function advanceTarget(tour, n, fromHref) { return (n + 1 >= tour.stops.length) ? null : targetTo(tour, n + 1, fromHref); }
  function backTarget(tour, n, fromHref) { return (n - 1 < 0) ? null : targetTo(tour, n - 1, fromHref); }
  function frontDoorTarget(fromHref) { return rel(fromHref, 'index.html'); } /* NO tour params — a plain visit */
  function beginTarget(tour, fromHref) { return targetTo(tour, 0, fromHref); }
  function stopTarget(tour, n, fromHref) { return targetTo(tour, n, fromHref); } /* resume to stop n */

  /* ── resume / affordance data (§7) — degrades silently when storage is off ── */
  function resumeState(ws, tourId) {
    var out = { ok: false, best: null, done: false };
    try {
      if (!ws || !ws.store) return out;
      var s = ws.store();
      out.ok = !!s.ok;
      if (!s.ok) return out;
      var b = s.get('ws:best:tour:' + tourId);
      out.best = (b == null ? null : +b);
      out.done = !!s.has('ws:flag:tour:' + tourId + ':done');
    } catch (e) { /* storage off → plain begin */ }
    return out;
  }
  /* The TOURS drawer's data source (§6/§7) — T1.1 renders these rows. `fromHref`
     is the page the drawer lives on (the front door: 'index.html'). */
  function drawerRows(tours, ws, fromHref) {
    var from = fromHref || 'index.html';
    var rows = [];
    if (!Array.isArray(tours)) return rows;
    for (var i = 0; i < tours.length; i++) {
      var t = tours[i];
      var rs = resumeState(ws, t.id);
      rows.push({
        id: t.id, title: t.title, tagline: t.tagline, minutes: t.minutes,
        beginTarget: beginTarget(t, from),
        resume: (rs.ok && rs.best != null && !rs.done) ? {
          stopIndex: rs.best, resumeTarget: stopTarget(t, rs.best, from), startOverTarget: beginTarget(t, from)
        } : null,
        done: rs.done
      });
    }
    return rows;
  }
  /* The exhibit-start PLAQUE's data source (§7). Front-door-started threads
     (start === 'index.html') render NO plaque — the drawer is their affordance.
     Returns null when this page starts no exhibit-start tour. `fromHref` is the
     current page (== the tour's start page for an exhibit start). */
  function startPlaqueInfo(tours, pathname, ws) {
    if (!Array.isArray(tours)) return null;
    for (var i = 0; i < tours.length; i++) {
      var t = tours[i];
      if (!t || typeof t.start !== 'string') continue;
      if (pathOf(t.start) === 'index.html') continue;          /* front-door start → drawer, no plaque */
      if (!pageMatches(pathname, t.start)) continue;
      var from = pathOf(t.start);
      var rs = resumeState(ws, t.id);
      return {
        id: t.id, title: t.title, minutes: t.minutes,
        beginTarget: beginTarget(t, from),
        resume: (rs.ok && rs.best != null && !rs.done) ? {
          stopIndex: rs.best, resumeTarget: stopTarget(t, rs.best, from), startOverTarget: beginTarget(t, from)
        } : null,
        done: rs.done
      };
    }
    return null;
  }

  /* ── ws: write points (the ONLY two, §7) ─────────────────────────────────── */
  function recordArrive(ws, tourId, n) { try { if (ws && ws.best) ws.best('tour:' + tourId, n); } catch (e) {} }
  function recordFinale(ws, tourId) { try { if (ws && ws.flag) ws.flag('tour:' + tourId + ':done'); } catch (e) {} }

  /* ── the dwell clock (pure; the CALLER drives ticks with a dt — no timers) ─── */
  function createDwellClock(durationMs) {
    var remaining = durationMs, running = false, expired = false;
    return {
      arm: function () { remaining = durationMs; running = true; expired = false; },
      suspend: function () { running = false; },
      resume: function () { if (!expired) running = true; },
      tick: function (dt) {
        if (!running || expired || !(dt > 0)) return;
        remaining -= dt;
        if (remaining <= 0) { remaining = 0; expired = true; running = false; }
      },
      remaining: function () { return remaining; },
      secondsLeft: function () { return Math.ceil(remaining / 1000); },
      fraction: function () { return durationMs <= 0 ? 1 : (1 - remaining / durationMs); },
      expired: function () { return expired; },
      running: function () { return running; }
    };
  }

  /* ── the beats RUNTIME (§4) — the layered page-side act contract ─────────────
     Pure + TICK-DRIVEN (the createDwellClock philosophy): the caller advances an
     internal clock with tick(dt); beat(ms) resolves once that clock passes `ms`
     of UNPAUSED time. NO Date / performance.now / setTimeout lives here — the
     browser drives ticks from the same rAF loop that feeds the dwell clock; the
     twin drives them by hand. Layering, lowest wins by absence (§4):
        __tourAct(ctx)  →  [data-tour-spot] walk (~4s each)  →  do-nothing.
     run() ALWAYS resolves (never rejects): the machine proceeds to DWELL whether
     the act finished, called ctx.done(), was aborted (leave/advance), threw, or
     hit the hard cap. The act's OWN pending beats reject with an AbortError on
     abort/cap so a cooperative act unwinds and stops touching the page. `ctx` is
     EXACTLY the §4 surface — eight keys, nothing more. */
  function makeAbortController(Ctor) {
    var C = Ctor || (typeof AbortController !== 'undefined' ? AbortController : null);
    if (C) { return new C(); }
    /* tiny shim for an environment without AbortController (both Node 24 and
       modern browsers ship it; this is a belt-and-braces fallback). */
    var fired = false, listeners = [];
    var signal = {
      aborted: false,
      addEventListener: function (t, f) { if (t === 'abort' && typeof f === 'function') listeners.push(f); },
      removeEventListener: function (t, f) { for (var i = listeners.length - 1; i >= 0; i--) if (listeners[i] === f) listeners.splice(i, 1); }
    };
    return {
      signal: signal,
      abort: function () {
        if (fired) return; fired = true; signal.aborted = true;
        for (var i = 0; i < listeners.length; i++) { try { listeners[i]({ type: 'abort' }); } catch (e) {} }
      }
    };
  }

  /* spec = {
       info:{tourId, stopIndex, reduced, cap},   act: fn|null,   spots: [el…],
       spotDwell?, spotlight?(el, on), scrollTo?(el), onSoftPause?(),
       Promise?, AbortCtor?   (injection seams for the twin) } */
  function createBeatsRuntime(spec) {
    spec = spec || {};
    var info = spec.info || {};
    var P = spec.Promise || (typeof Promise !== 'undefined' ? Promise : null);
    var reduced = !!info.reduced;
    var cap = (typeof info.cap === 'number' && info.cap > 0) ? info.cap : ACT_CAP;
    var spotDwell = (typeof spec.spotDwell === 'number' && spec.spotDwell > 0) ? spec.spotDwell : SPOT_DWELL;
    var spotlightImpl = typeof spec.spotlight === 'function' ? spec.spotlight : null;
    var scrollImpl = typeof spec.scrollTo === 'function' ? spec.scrollTo : null;
    var actFn = typeof spec.act === 'function' ? spec.act : null;
    var spots = Array.isArray(spec.spots) ? spec.spots.slice() : [];
    var layer = actFn ? 'act' : (spots.length ? 'walk' : 'none');

    var clock = 0, capElapsed = 0;
    var paused = false, aborted = false, finished = false, capped = false, softPaused = false;
    var abortReason = null;
    var pending = [];             /* {target, resolve, reject} — beats awaiting the clock */
    var ac = makeAbortController(spec.AbortCtor);

    function abortError(reason) {
      var e; try { e = new Error('the docent moved on'); } catch (x) { e = { message: 'aborted' }; }
      e.name = 'AbortError'; e.reason = reason || abortReason || 'abort'; return e;
    }
    /* pause-aware sleep; resolves after `ms` of unpaused clock, rejects on abort. */
    function beat(ms) {
      return new P(function (resolve, reject) {
        if (aborted) { reject(abortError()); return; }
        if (finished) { resolve(); return; }
        var d = +ms; if (!(d > 0)) { resolve(); return; }
        pending.push({ target: clock + d, resolve: resolve, reject: reject });
      });
    }
    /* the same engraved halo the declarative walk uses; resolves after the hold. */
    function spotlight(el, ms) {
      var hold = (typeof ms === 'number' && ms > 0) ? ms : spotDwell;
      if (spotlightImpl) { try { spotlightImpl(el, true); } catch (e) {} }
      function off() { if (spotlightImpl) { try { spotlightImpl(el, false); } catch (e) {} } }
      return beat(hold).then(function () { off(); }, function (err) { off(); throw err; });
    }

    /* ctx — EXACTLY the §4 surface (kept small on purpose). */
    var ctx = {
      tourId: info.tourId, stopIndex: info.stopIndex, reduced: reduced,
      signal: ac.signal,
      beat: beat,
      spotlight: spotlight,
      softPause: function () { softPaused = true; if (typeof spec.onSoftPause === 'function') { try { spec.onSoftPause(); } catch (e) {} } },
      done: function () { finish(); }
    };

    function drainResolve() {
      if (!pending.length) return;
      var keep = [];
      for (var i = 0; i < pending.length; i++) {
        if (pending[i].target <= clock) { try { pending[i].resolve(); } catch (e) {} }
        else keep.push(pending[i]);
      }
      pending = keep;
    }
    function drainReject(reason) {
      var p = pending; pending = [];
      for (var i = 0; i < p.length; i++) { try { p[i].reject(abortError(reason)); } catch (e) {} }
    }
    function finish() {
      if (finished || aborted) return;
      finished = true;
      var p = pending; pending = [];
      for (var i = 0; i < p.length; i++) { try { p[i].resolve(); } catch (e) {} }
    }
    function abort(reason) {
      if (aborted || finished) return;
      aborted = true; abortReason = reason || 'abort';
      drainReject(abortReason);
      try { ac.abort(); } catch (e) {}
    }

    /* layer 2 — visit each [data-tour-spot] in order, via the SAME beat()/halo. */
    function runWalk() {
      var i = 0;
      function step() {
        if (aborted || finished || i >= spots.length) return P.resolve();
        var elx = spots[i++];
        if (scrollImpl) { try { scrollImpl(elx); } catch (e) {} }
        return spotlight(elx, spotDwell).then(step);
      }
      return step();
    }

    var donePromise = null;
    function run() {
      if (donePromise) return donePromise;
      var body;
      if (layer === 'act') {
        var r = null;
        try { r = actFn(ctx); } catch (e) { r = null; }          /* a thrown act → straight to dwell */
        body = (r && typeof r.then === 'function') ? r : P.resolve();
      } else if (layer === 'walk') {
        body = runWalk();
      } else {
        body = P.resolve();
      }
      /* run() never rejects: whatever the body does, the machine gets a resolve
         so it always advances to DWELL. The result reports how the act ended. */
      donePromise = new P(function (resolve) {
        var settled = false;
        function settle() { if (settled) return; settled = true; resolve({ softPaused: softPaused, aborted: aborted, capped: capped, finished: finished }); }
        body.then(settle, settle);
      });
      return donePromise;
    }

    return {
      layer: function () { return layer; },
      run: run,
      tick: function (dt) {
        if (!(dt > 0) || paused || aborted || finished) return;
        clock += dt; capElapsed += dt;
        drainResolve();
        if (!capped && !finished && !aborted && capElapsed >= cap) { capped = true; abort('cap'); }
      },
      pause: function () { paused = true; },
      resume: function () { if (!aborted && !finished) paused = false; },
      isPaused: function () { return paused; },
      abort: abort,
      done: finish,
      softPaused: function () { return softPaused; },
      elapsed: function () { return clock; },
      signal: ac.signal,
      pendingCount: function () { return pending.length; },
      state: function () { return { layer: layer, clock: clock, paused: paused, aborted: aborted, finished: finished, capped: capped, softPaused: softPaused }; }
    };
  }

  /* ── the docent STATE MACHINE (pure; every side effect injected via `env`) ───
     env = {
       tours, params, pathname, ws, reduced,
       makeBeats(info) -> a beats runtime (createBeatsRuntime above) | undefined
                          (the §4 seam; if omitted, the machine enters DWELL with
                          no performance — the do-nothing default),
       navigate(url), leave(), rejoinTarget(tour, n) -> url | null,
       view: { mount(vm), announce(text), updateDwell(frac, secs), setPaused(b),
               setSoftPaused(b), setWaiting(b), showFinale(vm), showWandered(vm),
               teardown() }
     }
     Phases: normal · arrive · perform · dwell · paused · softpaused · hold ·
             finale · wandered · left. ═══════════════════════════════════════ */
  function createDocentMachine(env) {
    var phase = 'idle', cur = null, clock = null, beats = null, gen = 0;
    var view = env.view || {};
    function call(fn) { try { return fn && fn(); } catch (e) {} }
    function dwellMs(stop) { return typeof stop.dwell === 'number' && stop.dwell > 0 ? stop.dwell : DEFAULT_DWELL; }
    function viewModel(c) {
      return {
        tourId: c.tour.id, tourTitle: c.tour.title, stopTitle: c.stop.title,
        caption: c.stop.caption, markerCount: c.stopCount, current: c.stopIndex,
        isFinale: c.isFinale, isHold: c.isHold, canBack: c.stopIndex > 0, reduced: !!env.reduced
      };
    }
    function performInfo(c) {
      return { tourId: c.tour.id, stopIndex: c.stopIndex, beats: c.stop.beats || null, reduced: !!env.reduced, cap: ACT_CAP };
    }

    /* softPaused: the just-finished act called ctx.softPause() ("the visitor took
       over") — the countdown then starts SUSPENDED, waiting for a walk-on (§4). */
    function enterDwell(softPaused) {
      beats = null;
      if (phase === 'left' || phase === 'normal' || phase === 'wandered' || phase === 'idle') return;
      if (cur.isFinale) {
        phase = 'finale';
        recordFinale(env.ws, cur.tour.id);
        call(function () { view.showFinale(viewModel(cur)); });
        return;
      }
      if (cur.isHold) { phase = 'hold'; call(function () { view.setWaiting(true); }); return; }
      clock = createDwellClock(dwellMs(cur.stop));
      clock.arm();
      if (softPaused) {
        phase = 'softpaused'; clock.suspend();
        call(function () { view.setSoftPaused(true); });
      } else {
        phase = 'dwell';
        call(function () { view.updateDwell(0, clock.secondsLeft()); });
      }
    }

    var M = {
      phase: function () { return phase; },
      state: function () { return { phase: phase, stopIndex: cur ? cur.stopIndex : null, remaining: clock ? clock.remaining() : null }; },

      start: function () {
        gen++;                                   /* a stale act completion (bfcache re-entry) must not fire enterDwell */
        if (beats) { call(function () { beats.abort('restart'); }); beats = null; }
        if (phase !== 'idle') { call(view.teardown); clock = null; }
        var cls = classifyLoad(env.tours, env.params, env.pathname);
        if (cls.mode === 'normal') { phase = 'normal'; return cls; }
        if (cls.mode === 'wandered') {
          cur = cls; phase = 'wandered';
          call(function () {
            view.showWandered({
              rejoinTarget: env.rejoinTarget ? env.rejoinTarget(cls.tour, cls.stopIndex) : null,
              tourTitle: cls.tour.title
            });
          });
          return cls;
        }
        /* tour mode */
        cur = cls; phase = 'arrive';
        recordArrive(env.ws, cls.tour.id, cls.stopIndex);   /* the ONE recording point (§7) */
        call(function () { view.mount(viewModel(cls)); });
        call(function () { view.announce(cls.stop.title + ' — on ' + cls.tour.title); });
        phase = 'perform';
        var myGen = gen;
        beats = env.makeBeats ? env.makeBeats(performInfo(cls)) : null;
        if (beats) {
          /* run() always RESOLVES; the result tells us whether the act soft-paused.
             The gen guard drops a completion that belongs to a superseded start. */
          beats.run().then(
            function (res) { if (myGen === gen) enterDwell(!!(res && res.softPaused)); },
            function () { if (myGen === gen) enterDwell(false); }
          );
        } else {
          enterDwell(false);                     /* do-nothing default: ARRIVE → DWELL */
        }
        return cls;
      },

      tick: function (dt) {
        if (phase === 'perform') { if (beats) beats.tick(dt); return; }
        if (phase !== 'dwell' || !clock) return;
        clock.tick(dt);
        if (clock.expired()) { M.walkOn(); return; }
        call(function () { view.updateDwell(clock.fraction(), clock.secondsLeft()); });
      },

      /* engagement on the page (soft-pause, §1) — only bites a live countdown */
      engage: function () {
        if (phase !== 'dwell') return;
        phase = 'softpaused'; if (clock) clock.suspend();
        call(function () { view.setSoftPaused(true); });
      },
      pause: function () {
        if (phase === 'perform') { if (beats) beats.pause(); call(function () { view.setPaused(true); }); return; }
        if (phase === 'dwell') { phase = 'paused'; if (clock) clock.suspend(); call(function () { view.setPaused(true); }); }
      },
      resume: function () {
        if (phase === 'perform') { if (beats) beats.resume(); call(function () { view.setPaused(false); }); return; }
        if (phase === 'paused' || phase === 'softpaused') {
          phase = 'dwell'; if (clock) clock.resume();
          call(function () { view.setPaused(false); });
          call(function () { view.setSoftPaused(false); });
          call(function () { view.updateDwell(clock.fraction(), clock.secondsLeft()); });
        }
      },
      walkOn: function () {
        if (!cur) return;
        var tgt = advanceTarget(cur.tour, cur.stopIndex, cur.stop.href);
        if (tgt == null) return;                 /* finale has no walk-on */
        if (beats) { call(function () { beats.abort('advance'); }); beats = null; }
        phase = 'left'; call(view.teardown); call(function () { env.navigate(tgt); });
      },
      back: function () {
        if (!cur) return;
        var tgt = backTarget(cur.tour, cur.stopIndex, cur.stop.href);
        if (tgt == null) return;                 /* first stop: back is inert */
        if (beats) { call(function () { beats.abort('back'); }); beats = null; }
        phase = 'left'; call(view.teardown); call(function () { env.navigate(tgt); });
      },
      leave: function () {
        if (beats) { call(function () { beats.abort('leave'); }); beats = null; }  /* stop the act; we stay on the page */
        phase = 'left'; call(view.teardown); call(env.leave);   /* strips params; records nothing */
      },
      /* FINALE footer choices (§5) */
      finaleChoice: function (kind) {
        if (!cur) return;
        if (kind === 'again') { phase = 'left'; call(view.teardown); call(function () { env.navigate(beginTarget(cur.tour, cur.stop.href)); }); }
        else if (kind === 'front') { phase = 'left'; call(view.teardown); call(function () { env.navigate(frontDoorTarget(cur.stop.href)); }); }
        else if (kind === 'wander') { M.leave(); }
      },
      /* bfcache restore (§1): a persisted Back/Forward snapshot froze our timers —
         re-run the machine from the URL so the card + dwell dial come back alive. */
      pageshow: function (persisted) { if (persisted) { phase = 'idle'; M.start(); } }
    };
    return M;
  }

  /* ════════════════════════════════════════════════════════════════════════
     THE PUBLIC PURE SURFACE
     ════════════════════════════════════════════════════════════════════════ */
  var API = {
    DOCENT_SENTINEL: DOCENT_SENTINEL, DEFAULT_DWELL: DEFAULT_DWELL, ACT_CAP: ACT_CAP,
    pathOf: pathOf, splitHref: splitHref, dirOf: dirOf, countSegments: countSegments,
    isAbsolute: isAbsolute, rel: rel, mergeTourParams: mergeTourParams, stripTourParams: stripTourParams,
    parseTourParams: parseTourParams, normPathname: normPathname, pageMatches: pageMatches,
    findTour: findTour, classifyLoad: classifyLoad,
    advanceTarget: advanceTarget, backTarget: backTarget, frontDoorTarget: frontDoorTarget,
    beginTarget: beginTarget, stopTarget: stopTarget,
    resumeState: resumeState, drawerRows: drawerRows, startPlaqueInfo: startPlaqueInfo,
    recordArrive: recordArrive, recordFinale: recordFinale,
    createDwellClock: createDwellClock, createBeatsRuntime: createBeatsRuntime,
    createDocentMachine: createDocentMachine
  };

  /* ════════════════════════════════════════════════════════════════════════
     BROWSER LAYER — DOM chrome + real timers/listeners. Runs only in a browser.
     ════════════════════════════════════════════════════════════════════════ */
  function boot() {
    var doc = root.document;
    var C = String.fromCharCode(215); /* × — kept out of source as a literal via charcode */

    function prefersReduced() {
      try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
      catch (e) { return false; }
    }
    function el(tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function btn(cls, label, aria, onClick) {
      var b = el('button', cls); b.type = 'button'; b.innerHTML = label;
      if (aria) b.setAttribute('aria-label', aria);
      b.addEventListener('click', function (ev) { ev.preventDefault(); onClick(); });
      return b;
    }

    var STYLE_ID = 'tour-docent-style';
    function injectStyles() {
      if (doc.getElementById(STYLE_ID)) return;
      var st = el('style'); st.id = STYLE_ID;
      /* brass-on-ink, self-styling with var() fallbacks so it reads right on any
         host page (Survey Reveal modal is the visual precedent, index.src ~840). */
      st.textContent =
        '#tour-docent{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;pointer-events:none;' +
        'display:flex;justify-content:center;padding:0 16px calc(18px + env(safe-area-inset-bottom));' +
        'font-family:var(--serif,Georgia,"Times New Roman",serif);}' +
        '#tour-docent .td-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}' +
        '#tour-docent .td-card{pointer-events:auto;box-sizing:border-box;width:100%;max-width:34rem;' +
        'color:var(--ink,#eaf0fa);background:linear-gradient(180deg,rgba(26,30,42,.97),rgba(15,18,27,.98));' +
        'border:1px solid var(--brass,#c9a24a);border-radius:8px;' +
        'box-shadow:0 0 0 1px rgba(201,162,74,.16),0 18px 60px rgba(0,0,0,.6),inset 0 0 30px rgba(201,162,74,.05);' +
        'padding:15px 18px 13px;transform:translateY(16px);opacity:0;' +
        'transition:transform .5s cubic-bezier(.2,.7,.2,1),opacity .5s ease;}' +
        '#tour-docent.td-in .td-card{transform:none;opacity:1;}' +
        '.td-chip{font:600 9px/1 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.26em;' +
        'text-transform:uppercase;color:var(--brass,#c9a24a);opacity:.82;}' +
        '.td-stop{margin:8px 0 6px;font:italic 20px/1.2 var(--serif,Georgia,serif);' +
        'color:var(--brass-bright,#f0d489);text-shadow:0 0 12px rgba(201,162,74,.3);}' +
        '.td-cap{margin:0 0 11px;font:15px/1.5 var(--serif,Georgia,serif);color:var(--muted,#c8cddb);}' +
        '.td-markers{display:flex;gap:7px;align-items:center;margin:0 0 12px;flex-wrap:wrap;}' +
        '.td-mk{width:7px;height:7px;border-radius:50%;background:rgba(201,162,74,.26);' +
        'transition:width .3s,height .3s,background .3s,box-shadow .3s;}' +
        '.td-mk.cur{width:10px;height:10px;background:var(--brass-bright,#f0d489);box-shadow:0 0 9px rgba(201,162,74,.6);}' +
        '.td-mk.seen{background:rgba(201,162,74,.5);}' +
        '.td-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}' +
        '.td-btn{min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;gap:7px;' +
        'padding:0 13px;cursor:pointer;color:var(--brass,#c9a24a);background:rgba(0,0,0,.22);' +
        'border:1px solid rgba(201,162,74,.32);border-radius:6px;' +
        'font:600 12px/1 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.05em;' +
        'transition:color .2s,border-color .2s,background .2s;}' +
        '.td-btn:hover{color:var(--brass-bright,#f0d489);border-color:var(--brass,#c9a24a);background:rgba(201,162,74,.08);}' +
        '.td-btn:focus-visible{outline:2px solid var(--brass-bright,#f0d489);outline-offset:2px;}' +
        '.td-btn[disabled]{opacity:.35;cursor:default;}' +
        '.td-walk{flex:1 1 auto;position:relative;justify-content:center;color:#12151d;' +
        'background:var(--brass-bright,#f0d489);border-color:var(--brass-bright,#f0d489);' +
        'box-shadow:0 0 16px rgba(201,162,74,.28);}' +
        '.td-walk:hover{filter:brightness(1.06);color:#12151d;background:var(--brass-bright,#f0d489);}' +
        '.td-walk.waiting{color:var(--brass,#c9a24a);background:rgba(0,0,0,.22);border-color:rgba(201,162,74,.32);box-shadow:none;}' +
        '.td-dial{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:20px;height:20px;pointer-events:none;}' +
        '.td-dial circle{fill:none;stroke-width:3;}' +
        '.td-dial .td-dial-trk{stroke:rgba(18,21,29,.28);}' +
        '.td-dial .td-dial-fil{stroke:#12151d;stroke-linecap:round;transition:stroke-dashoffset .25s linear;' +
        'transform:rotate(-90deg);transform-origin:50% 50%;}' +
        '.td-x{margin-left:auto;}' +
        '.td-finrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:2px;}' +
        '@media (max-width:430px){#tour-docent{padding:0 0 env(safe-area-inset-bottom);}' +
        '#tour-docent .td-card{max-width:none;border-radius:12px 12px 0 0;border-bottom:0;}}' +
        '@media (prefers-reduced-motion:reduce){#tour-docent .td-card{transition:none;transform:none;opacity:1;}' +
        '.td-dial .td-dial-fil{transition:none;}.td-mk{transition:none;}}';
      (doc.head || doc.body).appendChild(st);
    }

    /* the card view — one object with the update methods the machine calls */
    function makeView(reduced, ctl) {
      var container = el('div', 'tour-docent'); container.id = 'tour-docent';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Grand Tour docent');
      container.setAttribute('data-tour-docent', DOCENT_SENTINEL); /* the sentinel, made functional */
      var live = el('span', 'td-live'); live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status');
      var card = el('div', 'td-card');
      container.appendChild(live); container.appendChild(card);

      var walkLabel = null, dialFill = null, pauseBtn = null;
      var DIAL_LEN = 2 * Math.PI * 8; /* r=8 */

      function markers(count, current) {
        var wrap = el('div', 'td-markers'); wrap.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < count; i++) {
          var m = el('span', 'td-mk' + (i === current ? ' cur' : (i < current ? ' seen' : '')));
          wrap.appendChild(m);
        }
        return wrap;
      }
      function raise() {
        if (reduced) { container.classList.add('td-in'); return; }
        if (root.requestAnimationFrame) root.requestAnimationFrame(function () { root.requestAnimationFrame(function () { container.classList.add('td-in'); }); });
        else container.classList.add('td-in');
      }
      function ensureMounted() { if (!container.parentNode && doc.body) doc.body.appendChild(container); }

      function buildWalking(vm) {
        card.innerHTML = '';
        card.appendChild(el('div', 'td-chip', vm.tourTitle));
        card.appendChild(el('div', 'td-stop', vm.stopTitle));
        card.appendChild(el('div', 'td-cap', vm.caption));
        card.appendChild(markers(vm.markerCount, vm.current));

        var row = el('div', 'td-row');
        var back = btn('td-btn td-back', '&#9198;', 'go back a stop', function () { ctl.back(); });
        if (!vm.canBack) back.setAttribute('disabled', 'disabled');
        row.appendChild(back);

        if (!vm.isHold) {
          pauseBtn = btn('td-btn td-pause', '&#9208;', 'pause the walk', function () {
            if (pauseBtn.getAttribute('data-paused') === '1') ctl.resume(); else ctl.pause();
          });
          row.appendChild(pauseBtn);
        } else { pauseBtn = null; }

        var walk = btn('td-btn td-walk', '', 'walk on to the next stop', function () {
          /* while waiting (soft-paused / hold) OR counting down, clicking walks on */
          ctl.walkOn();
        });
        if (!reduced) {
          walk.insertAdjacentHTML('afterbegin',
            '<svg class="td-dial" viewBox="0 0 20 20" aria-hidden="true">' +
            '<circle class="td-dial-trk" cx="10" cy="10" r="8"></circle>' +
            '<circle class="td-dial-fil" cx="10" cy="10" r="8" stroke-dasharray="' + DIAL_LEN.toFixed(2) + '" stroke-dashoffset="' + DIAL_LEN.toFixed(2) + '"></circle>' +
            '</svg>');
          dialFill = walk.querySelector('.td-dial-fil');
        } else { dialFill = null; }
        walkLabel = el('span', 'td-walk-label', 'walk on ⏭');
        walk.appendChild(walkLabel);
        row.appendChild(walk);

        var x = btn('td-btn td-x', '✕ leave', 'leave the tour', function () { ctl.leave(); });
        row.appendChild(x);
        card.appendChild(row);
      }

      var V = {
        el: container,
        contains: function (node) { return !!(node && container.contains(node)); },
        mount: function (vm) { injectStyles(); ensureMounted(); container.classList.remove('td-in'); buildWalking(vm); raise(); },
        announce: function (text) { live.textContent = text; },
        updateDwell: function (frac, secs) {
          if (reduced) { if (walkLabel) walkLabel.textContent = 'walking on — ' + secs + 's'; return; }
          if (dialFill) dialFill.setAttribute('stroke-dashoffset', (DIAL_LEN * (1 - frac)).toFixed(2));
          if (walkLabel) walkLabel.textContent = 'walk on ⏭';
        },
        setPaused: function (b) {
          if (pauseBtn) { pauseBtn.innerHTML = b ? '&#9205;' : '&#9208;'; pauseBtn.setAttribute('data-paused', b ? '1' : '0'); pauseBtn.setAttribute('aria-label', b ? 'resume the walk' : 'pause the walk'); }
          if (b && walkLabel) walkLabel.textContent = 'paused';
        },
        setSoftPaused: function (b) { V.setWaiting(b); if (pauseBtn) { pauseBtn.innerHTML = b ? '&#9205;' : '&#9208;'; pauseBtn.setAttribute('data-paused', b ? '1' : '0'); } },
        setWaiting: function (b) {
          var walk = card.querySelector('.td-walk');
          if (walk) walk.classList.toggle('waiting', !!b);
          if (dialFill) dialFill.setAttribute('stroke-dashoffset', DIAL_LEN.toFixed(2));
          if (walkLabel) walkLabel.textContent = b ? '▶ walk on when you’re ready — the docent waits' : 'walk on ⏭';
        },
        showFinale: function (vm) {
          injectStyles(); ensureMounted(); container.classList.remove('td-in');
          card.innerHTML = '';
          card.appendChild(el('div', 'td-chip', vm.tourTitle));
          card.appendChild(el('div', 'td-stop', vm.stopTitle));
          card.appendChild(el('div', 'td-cap', vm.caption));
          card.appendChild(markers(vm.markerCount, vm.current));
          var row = el('div', 'td-finrow');
          row.appendChild(btn('td-btn', '⟲ walk it again', 'walk this tour again', function () { ctl.finaleChoice('again'); }));
          row.appendChild(btn('td-btn', '⌂ the front door', 'return to the front door', function () { ctl.finaleChoice('front'); }));
          row.appendChild(btn('td-btn', '✕ wander from here', 'leave the tour and stay here', function () { ctl.finaleChoice('wander'); }));
          card.appendChild(row);
          live.textContent = vm.stopTitle + ' — on ' + vm.tourTitle;
          raise();
        },
        showWandered: function (vm) {
          injectStyles(); ensureMounted(); container.classList.remove('td-in');
          card.innerHTML = '';
          card.appendChild(el('div', 'td-chip', vm.tourTitle || 'Grand Tour'));
          card.appendChild(el('div', 'td-cap', 'you’ve wandered off the thread — rejoin it ↗ · leave the tour'));
          var row = el('div', 'td-finrow');
          var rejoin = btn('td-btn td-walk', 'rejoin it ↗', 'rejoin the thread', function () { if (vm.rejoinTarget) root.location.assign(vm.rejoinTarget); });
          if (!vm.rejoinTarget) rejoin.setAttribute('disabled', 'disabled');
          row.appendChild(rejoin);
          row.appendChild(btn('td-btn', '✕ leave the tour', 'leave the tour', function () { ctl.leave(); }));
          card.appendChild(row);
          live.textContent = 'You have wandered off the thread.';
          raise();
        },
        teardown: function () { container.classList.remove('td-in'); if (container.parentNode) container.parentNode.removeChild(container); },
        reset: function () { if (container.parentNode) container.parentNode.removeChild(container); container.classList.remove('td-in'); }
      };
      return V;
    }

    /* the exhibit-start plaque (§7) — quiet, bottom-right, dismissible per visit.
       Rendered ONLY when NOT touring and this page starts an exhibit-start tour. */
    function renderPlaque(info, reduced) {
      if (!doc.body) return;
      injectPlaqueStyles();
      var wrap = el('div', 'td-plaque'); wrap.id = 'td-plaque';
      wrap.setAttribute('data-tour-docent', DOCENT_SENTINEL);
      var head = el('div', 'tdp-head', '⟲ A Grand Tour begins here');
      var title = el('div', 'tdp-title', String(info.title).toUpperCase());
      wrap.appendChild(head); wrap.appendChild(title);
      var row = el('div', 'tdp-row');
      if (info.resume) {
        row.appendChild(btn('tdp-btn', 'resume where you left off', 'resume this tour where you left off', function () { root.location.assign(info.resume.resumeTarget); }));
        row.appendChild(btn('tdp-btn tdp-alt', 'start over', 'start this tour over', function () { root.location.assign(info.resume.startOverTarget); }));
      } else {
        row.appendChild(btn('tdp-btn', 'begin', 'begin this tour', function () { root.location.assign(info.beginTarget); }));
      }
      wrap.appendChild(row);
      var x = btn('tdp-x', '✕', 'dismiss', function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); });
      wrap.appendChild(x);
      doc.body.appendChild(wrap);
      if (!reduced && root.requestAnimationFrame) root.requestAnimationFrame(function () { root.requestAnimationFrame(function () { wrap.classList.add('tdp-in'); }); });
      else wrap.classList.add('tdp-in');
    }
    function injectPlaqueStyles() {
      if (doc.getElementById('td-plaque-style')) return;
      var st = el('style'); st.id = 'td-plaque-style';
      st.textContent =
        '#td-plaque{position:fixed;right:16px;bottom:16px;z-index:2147482000;max-width:min(90vw,300px);' +
        'box-sizing:border-box;padding:13px 32px 13px 15px;color:var(--ink,#eaf0fa);' +
        'background:linear-gradient(180deg,rgba(26,30,42,.96),rgba(15,18,27,.97));' +
        'border:1px solid var(--brass,#c9a24a);border-radius:8px;font-family:var(--serif,Georgia,serif);' +
        'box-shadow:0 12px 40px rgba(0,0,0,.5),inset 0 0 24px rgba(201,162,74,.05);' +
        'opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.7,.2,1);}' +
        '#td-plaque.tdp-in{opacity:1;transform:none;}' +
        '.tdp-head{font:600 9px/1.2 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.16em;text-transform:uppercase;color:var(--brass,#c9a24a);opacity:.8;}' +
        '.tdp-title{margin:6px 0 10px;font:italic 15px/1.2 var(--serif,Georgia,serif);color:var(--brass-bright,#f0d489);}' +
        '.tdp-row{display:flex;gap:8px;flex-wrap:wrap;}' +
        '.tdp-btn{min-height:38px;padding:0 12px;cursor:pointer;color:#12151d;background:var(--brass-bright,#f0d489);' +
        'border:1px solid var(--brass-bright,#f0d489);border-radius:5px;font:600 11px/1 var(--mono,ui-monospace,Menlo,monospace);letter-spacing:.04em;}' +
        '.tdp-btn:hover{filter:brightness(1.06);}.tdp-btn:focus-visible{outline:2px solid #fff;outline-offset:2px;}' +
        '.tdp-alt{color:var(--brass,#c9a24a);background:rgba(0,0,0,.2);border-color:rgba(201,162,74,.32);}' +
        '.tdp-x{position:absolute;top:6px;right:6px;width:26px;height:26px;padding:0;cursor:pointer;' +
        'color:var(--muted,#8b95a8);background:none;border:0;font:600 14px/1 var(--mono,ui-monospace,Menlo,monospace);border-radius:5px;}' +
        '.tdp-x:hover{color:var(--brass,#c9a24a);}.tdp-x:focus-visible{outline:1.5px solid var(--brass,#c9a24a);outline-offset:2px;}' +
        '@media (prefers-reduced-motion:reduce){#td-plaque{transition:none;transform:none;opacity:1;}}';
      (doc.head || doc.body).appendChild(st);
    }

    /* ── the beats seam (§4) — the browser side of the layered runtime ──────────
       Wires createBeatsRuntime to the live page: the act is the page's own
       window.__tourAct (a bespoke performance); with none, the declarative walk
       visits the page's [data-tour-spot] elements in numeric order with an
       engraved halo. The runtime itself is pure + tick-driven; the machine feeds
       it dt from the same rAF loop as the dwell clock. __tourHooks is a DIFFERENT
       page surface (the Showing's cue verbs, §4/§10) and is deliberately NOT read
       here — tours never call hooks. */
    var SPOT_STYLE_ID = 'tour-spot-style';
    function injectSpotStyles() {
      if (doc.getElementById(SPOT_STYLE_ID)) return;
      var st = el('style'); st.id = SPOT_STYLE_ID;
      st.textContent =
        '.td-spot-lit{outline:2px solid var(--brass-bright,#f0d489)!important;outline-offset:3px;' +
        'box-shadow:0 0 0 3px rgba(201,162,74,.22),0 0 24px rgba(201,162,74,.4)!important;' +
        'border-radius:4px;transition:outline-color .3s ease,box-shadow .3s ease;position:relative;z-index:1;}' +
        '@media (prefers-reduced-motion:reduce){.td-spot-lit{transition:none;}}';
      (doc.head || doc.body).appendChild(st);
    }
    function collectSpots() {
      var list = [];
      try { list = Array.prototype.slice.call(doc.querySelectorAll('[data-tour-spot]')); } catch (e) {}
      list.sort(function (a, b) {
        return (parseInt(a.getAttribute('data-tour-spot'), 10) || 0) - (parseInt(b.getAttribute('data-tour-spot'), 10) || 0);
      });
      return list;
    }
    function makeBeatsBrowser(info) {
      var spots = collectSpots();
      var act = (typeof root.__tourAct === 'function') ? root.__tourAct : null;
      if (act || spots.length) injectSpotStyles();
      return createBeatsRuntime({
        info: info,
        act: act,
        spots: spots,
        spotDwell: SPOT_DWELL,
        spotlight: function (elx, on) { if (elx && elx.classList) elx.classList.toggle('td-spot-lit', !!on); },
        scrollTo: function (elx) {
          if (!elx || !elx.scrollIntoView) return;
          try { elx.scrollIntoView({ behavior: info.reduced ? 'auto' : 'smooth', block: 'center', inline: 'center' }); }
          catch (e) { try { elx.scrollIntoView(); } catch (e2) {} }
        }
      });
    }

    /* deploy best-effort rejoin (wandered case). rel() from the CURRENT pathname:
       correct on localhost (base '/'); on Pages (base '/the-workshop/') it is off
       by the base depth — the design's real way back is the start plaque's resume
       (§1/§7), so this stays a best-effort convenience. */
    function rejoinTargetBrowser(tour, n) {
      var from = String(root.location.pathname || '').replace(/^\/+/, '');
      if (from === '' || from.charAt(from.length - 1) === '/') from += 'index.html';
      return stopTarget(tour, n, from);
    }

    function run() {
      var params = parseTourParams(root.location.search);
      var pathname = root.location.pathname;
      var reduced = prefersReduced();
      var ws = root.WS || null;
      var cls0 = classifyLoad(TOURS_REF(), params, pathname);

      if (cls0.mode === 'normal') {
        if (cls0.reason && cls0.reason !== 'no-params') { try { console.info('[grand-tour] ' + cls0.reason + ' — showing a plain page'); } catch (e) {} }
        var plaque = startPlaqueInfo(TOURS_REF(), pathname, ws);
        if (plaque) renderPlaque(plaque, reduced);
        return;
      }

      var ctl = {};
      var view = makeView(reduced, ctl);
      var machine = createDocentMachine({
        tours: TOURS_REF(), params: params, pathname: pathname, ws: ws, reduced: reduced,
        makeBeats: makeBeatsBrowser, view: view,
        navigate: function (url) { root.location.assign(url); },
        leave: function () {
          try { root.history.replaceState(null, '', root.location.pathname + stripTourParams(root.location.search) + root.location.hash); }
          catch (e) { /* replaceState can throw on file://; the chrome is already gone */ }
        },
        rejoinTarget: rejoinTargetBrowser
      });
      /* bind the controller the view's buttons call */
      ctl.back = machine.back; ctl.pause = machine.pause; ctl.resume = machine.resume;
      ctl.walkOn = machine.walkOn; ctl.leave = machine.leave; ctl.finaleChoice = machine.finaleChoice;

      wireListeners(doc, machine, view);
      machine.start();
      runRaf(machine);
      root.addEventListener('pageshow', function (e) { if (e && e.persisted) { view.reset(); machine.pageshow(true); runRaf(machine); } });
    }

    function wireListeners(doc, machine, view) {
      /* Esc = leave (capture; outranks the front-door retreat only WHILE touring).
         ←/→ = back/walk-on but ONLY when focus is within the card (stop pages own
         their arrow keys — DESIGN §3). */
      doc.addEventListener('keydown', function (e) {
        var ph = machine.phase();
        var touring = ph !== 'normal' && ph !== 'left' && ph !== 'idle';
        if (!touring) return;
        if (e.key === 'Escape' || e.keyCode === 27) { e.stopPropagation(); e.preventDefault(); machine.leave(); return; }
        if (view.contains(e.target)) {
          if (e.key === 'ArrowLeft') { e.preventDefault(); machine.back(); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); machine.walkOn(); }
        }
      }, true);

      /* soft-pause: ANY engagement on the page OUTSIDE the card suspends a live
         countdown (§1). Interacting with the docent itself is not "taking over". */
      var engaged = function (e) { if (view.contains(e.target)) return; machine.engage(); };
      doc.addEventListener('pointerdown', engaged, true);
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.keyCode === 27) return; engaged(e); }, true);
      try { doc.addEventListener('wheel', engaged, { capture: true, passive: true }); } catch (e2) { doc.addEventListener('wheel', engaged, true); }
      try { doc.addEventListener('scroll', engaged, { capture: true, passive: true }); } catch (e3) { doc.addEventListener('scroll', engaged, true); }
      var lastMove = 0;
      doc.addEventListener('mousemove', function (e) {
        var t = (root.performance && root.performance.now) ? root.performance.now() : 0;
        if (t - lastMove < 400) return; lastMove = t; engaged(e);
      }, true);
      doc.addEventListener('visibilitychange', function () { if (!doc.hidden) machine.engage(); });
    }

    function runRaf(machine) {
      if (!root.requestAnimationFrame) return;
      var last = null;
      function frame(ts) {
        var ph = machine.phase();
        if (ph === 'left' || ph === 'normal' || ph === 'idle') return;
        /* feed dt to the machine every frame while alive; it routes ticks itself
           (dwell → the countdown clock, perform → the beats runtime, else no-op). */
        if (last != null) machine.tick(ts - last);
        last = ts;
        root.requestAnimationFrame(frame);
      }
      root.requestAnimationFrame(frame);
    }

    /* TOURS is a sibling forge-include (a browser global); read it lazily so load
       order within the page doesn't matter. */
    function TOURS_REF() { return root.TOURS || []; }

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run);
    else run();
  }

  /* ── attach + auto-boot ──────────────────────────────────────────────────── */
  if (root) root.GrandTour = API;
  if (root && root.document) { try { boot(); } catch (e) { /* a thrown docent leaves the page usable (§3) */ } }

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
