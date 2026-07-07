/* ═══════════════════════════════════════════════════════════════════════════
   trailer.js — THE TRAILER's deck shell (WS5 / Book 3, the trailer).

   A NEW small shell (NOT a contorted showing.js): ONE continuous timeline, no
   chapters/holds/visitor-mode/operator-strip/hash-resume. It runs the pure cue
   engine (cue-engine.js, forge-included first, UNCHANGED) over ONE cue-engine
   chapter (window.TRAILER_CHAPTERS[0]) and owns the impure surface the film
   needs:

     • Clocks (ENGINE §1). Master clock = the music-bed <audio>
       (bed.currentTime * 1000) from t=0 through the Gate outro; a synthetic
       rAF continuation drives the held black after the bed `ended`. Authoring
       mode (no bed / cannot start) keeps the rAF VIRTUAL clock — one engine,
       two clocks. VO segments are PEERS, not the clock: one preloaded <audio>
       per segment, started by an impulse cue at its atMs, with a one-shot drift
       nudge (> 0.08 s).
     • The PRELOADED IFRAME STACK (ENGINE §2). ALL stage frames are created at
       boot from TRAILER_FRAME_MANIFEST; a cut is a z-order/opacity flip (~1
       frame), NEVER a src reload and NEVER display:none (a display:none frame
       reports zero rects and breaks boot-measuring pages like the colophon).
     • The word-lit caption band (copied from showing.js, keyed to the ACTIVE
       segment's sidecar), cue routing (pokeHook/fireCue, every cue try/catch),
       the Reduce-Motion preflight, and the authoring scrub (deriveSeek).

   This file is the T2.1 SHELL. The real bed + segment mp3s + the full cue sheet
   (skit, zoom, cards, drives) fold in at T2.2 / T4 / T5.1; the segment/caption
   plumbing here is inert until those assets arrive.

   Comments inside this forge-included block use the BLOCK / line form ONLY,
   never a multi-line HTML comment (the forge landmine that silently kills the
   inlined script). Vanilla, dependency-free. No Math.random / no Date.* — the
   cue LOGIC is a pure function of (chapter, time) in CueEngine; the virtual
   clock is rAF-driven; setTimeout is UI pacing only, never a cue clock.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CE = window.CueEngine;
  var CHAPTERS = window.TRAILER_CHAPTERS || [];
  var MANIFEST = window.TRAILER_FRAME_MANIFEST || { frames: {} };
  var SEGMENTS = window.TRAILER_SEGMENTS || [];
  if (!CE || !CHAPTERS.length) {
    try { console.error('[trailer] CueEngine or TRAILER_CHAPTERS missing'); } catch (e) {}
    return;
  }
  /* The trailer is ONE long chapter (ENGINE §0). */
  var CHAPTER = CHAPTERS[0];

  /* ?record → the OBS contract (ENGINE §8). The FULL preflight + reach-in
     choreography land at T6.2; the shell only needs to know the mode so it can
     size the stage, strip authoring chrome, disable the hash mirror, and never
     seek. */
  var RECORD = /[?&]record(?:=|&|$)/.test(window.location.search);

  /* ── deck state ──────────────────────────────────────────────────────────── */
  var state = {
    started: false,
    playing: false,
    clockMs: 0,
    lastFireT: -Infinity,   /* seconds; (from, to] so a t=0 cue fires on tick 1 */
    lastRafTs: null,
    usingAudio: false,      /* true once the bed <audio> is driving the clock */
    bedEnded: false,        /* after the bed `ended`: synthetic rAF continuation */
    ended: false,           /* film content is over → held black */
    rafId: 0,
    scrubbing: false,
    activeKey: null,        /* the stack key currently on top */
    activeSeg: null,        /* the VO segment currently sounding (drives captions) */
    pendingReplay: null     /* state cues to re-poke after a flip settles */
  };

  var els = {};
  var bed = null;                 /* the music-bed <audio> (master clock) */
  var frameEls = {};              /* stack key → iframe element */
  var segEls = {};                /* segment id → <audio> element */
  var segById = {};               /* segment id → segment descriptor */
  var wordCache = {};             /* segment id → [word items] */
  var lineCache = {};             /* segment id → [caption lines] */
  var lineSpans = [];
  var litLine = -1;
  var litSpan = -1;

  /* ── small helpers ─────────────────────────────────────────────────────────── */
  function durationMs() {
    var t = CHAPTER.timing;
    if (t && typeof t.duration_ms === 'number') return t.duration_ms;
    if (typeof CHAPTER.durationMs === 'number') return CHAPTER.durationMs;
    return 180000; /* placeholder film length until the real bed folds in */
  }
  function fmt(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function log(msg) {
    if (!els.cuelog) return;
    var line = document.createElement('div');
    line.className = 'cue-line';
    line.textContent = msg;
    els.cuelog.appendChild(line);
    while (els.cuelog.childNodes.length > 60) els.cuelog.removeChild(els.cuelog.firstChild);
    els.cuelog.scrollTop = els.cuelog.scrollHeight;
  }
  function frameWin() {
    try {
      var el = state.activeKey && frameEls[state.activeKey];
      return el && el.contentWindow;
    } catch (e) { return null; }
  }

  /* ── ws.js mute bridge (the estate's ws:pref:muted convention) ────────────── */
  function muted() {
    try {
      if (typeof WS !== 'undefined' && WS && WS.muted) return WS.muted();
      return localStorage.getItem('ws:pref:muted') === '1';
    } catch (e) { return false; }
  }

  /* ── the preloaded iframe stack (ENGINE §2) ────────────────────────────────
     Build EVERY frame at boot from the manifest; a cut = opacity/z flip. Never
     display:none. Each frame carries `allow` from its manifest entry (the audio
     policy table) + referrerpolicy=no-referrer. */
  function buildStack() {
    var frames = MANIFEST.frames || {};
    var keys = Object.keys(frames);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i], entry = frames[key] || {};
      var f = document.createElement('iframe');
      f.className = 'stage-frame';
      f.setAttribute('title', 'stage · ' + key);
      f.setAttribute('referrerpolicy', 'no-referrer');
      f.setAttribute('allow', entry.allow || "autoplay 'none'");
      f.setAttribute('loading', 'eager');
      /* src is the key VERBATIM (the cue `frame` value is the identical string,
         query params included — e.g. the Gate's ?scene=…&seed=…). */
      f.src = key;
      els.stage.appendChild(f);
      frameEls[key] = f;
    }
  }
  function setFrame(key) {
    if (key == null || key === state.activeKey) return;
    var next = frameEls[key];
    if (!next) { log('· frame ' + key + ' — not in stack'); return; }
    var prev = state.activeKey && frameEls[state.activeKey];
    if (prev) { prev.classList.remove('on'); }
    next.classList.add('on');
    state.activeKey = key;
    log('▸ frame ' + key);
  }

  /* ── VO segments (ENGINE §1) — peers, not the clock ────────────────────────
     One preloaded <audio> per segment; an impulse cue starts it at its atMs on
     the master clock. A single one-shot drift nudge ~500 ms after start keeps
     the segment locked to the bed. Captions light from the ACTIVE segment. */
  function buildSegments() {
    for (var i = 0; i < SEGMENTS.length; i++) {
      var seg = SEGMENTS[i];
      if (!seg || seg.id == null) continue;
      segById[seg.id] = seg;
      var a = document.createElement('audio');
      a.preload = RECORD ? 'auto' : 'none';
      if (seg.audio) a.src = seg.audio;
      a.setAttribute('data-seg', seg.id);
      els.segbank.appendChild(a);
      segEls[seg.id] = a;
    }
  }
  function playSeg(id) {
    var seg = segById[id], a = segEls[id];
    if (!seg) { log('· playSeg ' + id + ' — no segment'); return; }
    state.activeSeg = seg;
    resetCaptions(seg);
    if (!a || !a.src || muted()) return; /* stub / silent shell: caption-only */
    try {
      a.currentTime = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    /* one-shot drift nudge ~500 ms after start */
    seg.__drift = false;
    (function (segRef, aud) {
      setTimeout(function () {
        if (segRef.__drift || !aud || aud.paused) return;
        segRef.__drift = true;
        var expected = (state.clockMs - segRef.atMs) / 1000;
        var actual = aud.currentTime;
        if (isFinite(expected) && Math.abs(actual - expected) > 0.08) {
          try { aud.currentTime = Math.max(0, expected); } catch (e) {}
        }
      }, 500);
    })(seg, a);
  }
  function stopSeg(id) {
    var a = segEls[id];
    if (a) { try { a.pause(); } catch (e) {} }
    if (state.activeSeg && state.activeSeg.id === id) { state.activeSeg = null; resetCaptions(null); }
  }

  /* ── captions: ONE karaoke line at a time (copied from showing.js, keyed to
     the ACTIVE segment's sidecar) ──────────────────────────────────────────── */
  function segWords(seg) {
    if (!seg) return [];
    if (wordCache[seg.id]) return wordCache[seg.id];
    var items = (seg.timing && seg.timing.items) || [];
    var out = [];
    for (var i = 0; i < items.length; i++) if (items[i] && items[i].type === 'word') out.push(items[i]);
    wordCache[seg.id] = out;
    return out;
  }
  function buildLines(seg) {
    if (!seg) return [];
    if (lineCache[seg.id]) return lineCache[seg.id];
    var ws = segWords(seg), lines = [], line = null;
    var MAX = 56;
    for (var i = 0; i < ws.length; i++) {
      var v = String(ws[i].value != null ? ws[i].value : ws[i].w);
      if (!line || (line.len + 1 + v.length) > MAX) {
        line = { words: [], len: 0, startMs: ws[i].s, endMs: ws[i].e };
        lines.push(line);
      }
      line.words.push(ws[i]);
      line.len += (line.words.length > 1 ? 1 : 0) + v.length;
      line.endMs = ws[i].e;
      if (line.len >= MAX * 0.5 && /[.!?;:—]["')\]]?$/.test(v)) line = null;
    }
    lineCache[seg.id] = lines;
    return lines;
  }
  function resetCaptions(seg) {
    if (els.captions) els.captions.textContent = '';
    litLine = -1; litSpan = -1; lineSpans = [];
    if (seg) buildLines(seg);
  }
  function wordText(w) { return String(w.value != null ? w.value : w.w); }
  function mountLine(line, animateOut) {
    var old = els.captions.querySelector('.cap-line.cur');
    if (old) {
      if (animateOut) {
        old.className = 'cap-line out';
        setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 700);
      } else {
        els.captions.textContent = '';
      }
    }
    var el = document.createElement('div');
    el.className = 'cap-line cur';
    lineSpans = [];
    for (var i = 0; i < line.words.length; i++) {
      var sp = document.createElement('span');
      sp.className = 'cap-w';
      sp.textContent = wordText(line.words[i]);
      el.appendChild(sp);
      el.appendChild(document.createTextNode(' '));
      lineSpans.push(sp);
    }
    els.captions.appendChild(el);
  }
  function lightCaption() {
    var seg = state.activeSeg;
    if (!seg || !seg.timing) { return; }
    var ms = state.clockMs - seg.atMs;
    var lines = buildLines(seg);
    if (!lines.length) return;
    var li = 0;
    for (var i = 0; i < lines.length; i++) { if (ms >= lines[i].startMs) li = i; else break; }
    if (li !== litLine) {
      mountLine(lines[li], li === litLine + 1);
      litLine = li;
      litSpan = -1;
    }
    var ws = lines[li].words, idx = -1;
    for (var j = 0; j < ws.length; j++) {
      if (ms >= ws[j].s && ms < ws[j].e) { idx = j; break; }
      if (ms >= ws[j].s) idx = j;
    }
    if (idx === litSpan) return;
    if (litSpan >= 0 && lineSpans[litSpan]) lineSpans[litSpan].classList.remove('on');
    if (idx >= 0 && lineSpans[idx]) lineSpans[idx].classList.add('on');
    litSpan = idx;
  }

  /* ── cue routing (try/catch per cue — a failed poke logs, never throws) ─────
     deck.* verbs run parent-side (segment transport, stage overlays — T2.2
     registers the rest); everything else is a __tourHooks verb on the active
     frame. */
  var DECK_HOOKS = {
    playSeg: playSeg,
    stopSeg: stopSeg,
    setFrame: setFrame
  };
  function pokeHook(payload, kind) {
    var verb = payload && payload.verb;
    if (!verb) { log('· ' + kind + ' cue with no verb'); return; }
    if (verb.indexOf('deck.') === 0) {
      var dv = DECK_HOOKS[verb.slice(5)];
      if (typeof dv === 'function') {
        try { dv.apply(null, payload.args || []); log('✓ ' + kind + ' ' + verb + '()'); }
        catch (e) { log('✗ ' + kind + ' ' + verb + ' threw: ' + e.message); }
      } else { log('· ' + kind + ' ' + verb + ' — no deck handler'); }
      return;
    }
    var fw = frameWin();
    var hooks = null;
    try { hooks = fw && fw.__tourHooks; } catch (e) { hooks = null; }
    if (hooks && typeof hooks[verb] === 'function') {
      try { hooks[verb].apply(null, payload.args || []); log('✓ ' + kind + ' ' + verb + '()'); }
      catch (e) { log('✗ ' + kind + ' ' + verb + ' threw: ' + e.message); }
    } else {
      log('· ' + kind + ' ' + verb + ' — hook absent on frame');
    }
  }
  function fireSpot(payload) {
    var sel = payload && payload.sel;
    var fw = frameWin();
    if (!sel) { log('· spot cue with no sel'); return; }
    try {
      var el = fw && fw.document && fw.document.querySelector(sel);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      log('· spot ' + sel + (el ? '' : ' — not found'));
    } catch (e) { log('✗ spot ' + sel + ' threw: ' + e.message); }
  }
  function fireCue(cue) {
    var kind = CE.cueKind(cue);
    try {
      if (kind === 'frame') setFrame(cue.frame);
      else if (kind === 'state') pokeHook(cue.state, 'state');
      else if (kind === 'impulse') pokeHook(cue.impulse, 'impulse');
      else if (kind === 'spot') fireSpot(cue.spot);
      else if (kind === 'note') log('▸ ' + cue.note);
      else log('? malformed cue at t=' + cue.t);
    } catch (e) { log('✗ cue t=' + cue.t + ' threw: ' + e.message); }
  }
  function replayStates(list) {
    for (var i = 0; i < list.length; i++) pokeHook(list[i].state, 'replay');
  }

  /* ── the clock: bed.currentTime when the bed drives; synthetic rAF after the
     bed `ended`; rAF virtual otherwise (authoring / no bed) — ENGINE §1 ─────── */
  function tick(ts) {
    state.rafId = requestAnimationFrame(tick);
    var dur = durationMs();

    if (state.playing && !state.ended) {
      if (state.usingAudio && bed && !bed.paused && !state.bedEnded) {
        state.clockMs = bed.currentTime * 1000;
      } else if (state.lastRafTs != null) {
        state.clockMs += (ts - state.lastRafTs);
      }
    }
    state.lastRafTs = ts;

    if (state.playing && !state.ended) {
      var to = state.clockMs / 1000;
      var fired = CE.cuesInRange(CHAPTER, state.lastFireT, to);
      for (var i = 0; i < fired.length; i++) fireCue(fired[i]);
      state.lastFireT = to;
    }

    lightCaption();
    paintChrome(dur);

    /* film content over → held black (synthetic clock keeps running under it) */
    if (state.playing && !state.ended && state.clockMs >= dur) {
      onFilmEnd();
    }
  }

  function onFilmEnd() {
    state.ended = true;
    state.clockMs = durationMs();
    if (els.heldblack) els.heldblack.classList.add('on');
    if (els.captions) els.captions.classList.add('hush');
    log('— held black — end of the trailer');
  }

  /* ── chrome paint (authoring only; DOM-removed in ?record) ─────────────────── */
  function paintChrome(dur) {
    if (RECORD) return;
    if (els.clock) els.clock.textContent = fmt(state.clockMs);
    if (els.dur) els.dur.textContent = fmt(dur);
    if (els.play) els.play.textContent = state.playing ? '⏸' : '▶';
    if (!state.scrubbing && els.scrub) {
      els.scrub.value = String(dur ? Math.round(state.clockMs / dur * 1000) : 0);
    }
  }

  /* ── the master-clock start (blessing gesture) ─────────────────────────────
     Tries the bed <audio>; falls to the rAF virtual clock when there is no bed
     src / muted (the T2.1 shell has no bed yet, so authoring runs virtual). The
     rich record-mode reach-in choreography (colophon weave-and-pause, Gate
     unlock+suspend) is T6.2. */
  function startClock() {
    if (bed && bed.getAttribute('src') && !muted()) {
      try {
        var p = bed.play();
        if (p && p.then) {
          p.then(function () { state.usingAudio = true; })
           .catch(function () { state.usingAudio = false; });
        } else { state.usingAudio = true; }
      } catch (e) { state.usingAudio = false; }
    } else {
      state.usingAudio = false;
    }
  }

  /* ── authoring transport ───────────────────────────────────────────────────── */
  function play() {
    if (!state.started) return;
    state.playing = true;
    if (state.usingAudio && bed) { try { var p = bed.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    paintChrome(durationMs());
  }
  function pause() {
    state.playing = false;
    if (state.usingAudio && bed) { try { bed.pause(); } catch (e) {} }
    for (var id in segEls) { if (segEls[id]) { try { segEls[id].pause(); } catch (e) {} } }
    paintChrome(durationMs());
  }
  function togglePlay() { if (state.playing) pause(); else play(); }

  /* ── authoring scrub (deriveSeek — the seek re-derivation earns its keep off
     the record path) ─────────────────────────────────────────────────────────── */
  function seekTo(ms) {
    var dur = durationMs();
    state.clockMs = Math.max(0, Math.min(dur, ms));
    var tSec = state.clockMs / 1000;
    var seek = CE.deriveSeek(CHAPTER, tSec, state.activeKey);
    if (seek.frame != null) setFrame(seek.frame);
    replayStates(seek.stateReplay);
    state.lastFireT = tSec;                 /* don't re-fire impulses we scrubbed past */
    state.ended = false;
    if (els.heldblack) els.heldblack.classList.remove('on');
    /* the active segment + captions re-derive lazily on the next natural cue */
    state.activeSeg = null; resetCaptions(null);
    if (state.usingAudio && bed) { try { bed.currentTime = tSec; } catch (e) {} }
    paintChrome(dur);
  }
  function scrubStart() { state.scrubbing = true; }
  function scrubMove() {
    if (!els.scrub) return;
    var dur = durationMs();
    var frac = (+els.scrub.value) / 1000;
    state.clockMs = frac * dur;
    if (els.clock) els.clock.textContent = fmt(state.clockMs);
  }
  function scrubEnd() {
    state.scrubbing = false;
    if (!els.scrub) return;
    var dur = durationMs();
    seekTo(((+els.scrub.value) / 1000) * dur);
  }

  /* ── Reduce-Motion preflight (ENGINE §8) ───────────────────────────────────── */
  function rmCheck(win, label) {
    try {
      if (win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (els.rmbanner) {
          els.rmbanner.hidden = false;
          els.rmbanner.textContent = 'REDUCE MOTION IS ON (' + label + ') — turn it off: System Settings → Accessibility → Display. The estate freezes its motion under it.';
        }
        return true;
      }
    } catch (e) {}
    if (els.rmbanner) els.rmbanner.hidden = true;
    return false;
  }

  /* ── boot ───────────────────────────────────────────────────────────────────── */
  function boot() {
    var $ = function (id) { return document.getElementById(id); };
    els = {
      stage: $('stage'), captions: $('captions'), card: $('card'), skit: $('skit'),
      rmbanner: $('rmbanner'), cuelog: $('cuelog'), heldblack: $('heldblack'),
      startgate: $('startgate'), startbtn: $('start-btn'), segbank: $('segbank'),
      authoring: $('authoring'), play: $('btn-play'), scrub: $('scrub'),
      clock: $('clock'), dur: $('dur'), logbtn: $('btn-log')
    };
    bed = $('bed');

    if (RECORD) {
      document.body.classList.add('record');
      /* authoring chrome DOM-removed, not hidden (ENGINE §8 step 1) */
      if (els.authoring && els.authoring.parentNode) els.authoring.parentNode.removeChild(els.authoring);
      if (els.cuelog && els.cuelog.parentNode) els.cuelog.parentNode.removeChild(els.cuelog);
    }

    buildStack();
    buildSegments();

    /* open on the chapter's first frame so the stage is never blank behind the gate */
    var open = (CHAPTER.opening && CHAPTER.opening.frame) || null;
    if (open) setFrame(open);

    /* authoring transport wiring */
    if (!RECORD) {
      if (els.play) els.play.addEventListener('click', function () { togglePlay(); });
      if (els.scrub) {
        els.scrub.addEventListener('pointerdown', scrubStart);
        els.scrub.addEventListener('input', scrubMove);
        els.scrub.addEventListener('change', scrubEnd);
      }
      if (els.logbtn) {
        els.logbtn.addEventListener('click', function () {
          if (!els.cuelog) return;
          els.cuelog.hidden = !els.cuelog.hidden;
          els.logbtn.setAttribute('aria-pressed', els.cuelog.hidden ? 'false' : 'true');
        });
      }
      document.addEventListener('keydown', function (e) {
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
        if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlay(); }
      });
    }

    /* the ONE blessing gesture (real input — a synthetic .click() unlocks no
       audio). The full record-mode reach-in choreography + preflight is T6.2. */
    if (els.startbtn) els.startbtn.addEventListener('click', start);

    /* RM preflight up front (parent) */
    rmCheck(window, 'this display');

    state.rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (state.started) return;
    state.started = true;
    if (els.startgate) { els.startgate.hidden = true; els.startgate.style.display = 'none'; }
    startClock();
    play();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ── liveness handle (the __showing / __fairgroundLiveness idiom) — a
     read-only window onto the shell for the rehearsal gate + headless probes. */
  window.__trailer = {
    state: state,
    chapter: CHAPTER,
    record: RECORD,
    start: start,
    play: play,
    pause: pause,
    seekTo: seekTo,
    clockMs: function () { return state.clockMs; },
    activeFrame: function () { return state.activeKey; },
    frameKeys: function () { return Object.keys(frameEls); },
    segIds: function () { return Object.keys(segEls); },
    deckVerbs: function () { return Object.keys(DECK_HOOKS); },
    preflight: function (win) { return rmCheck(win || window, 'preflight'); },
    bannerVisible: function () { return !!(els.rmbanner && !els.rmbanner.hidden); }
  };
})();
