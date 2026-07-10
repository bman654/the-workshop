/* ═══════════════════════════════════════════════════════════════════════════
   showing.js — THE SHOWING's deck shell (WS2 / DESIGN §10). The DOM + audio
   WIRING around the pure cue engine (cue-engine.js, forge-included first).

   The deck is ONE page that never navigates: chapter "stops" are framed in a
   same-origin iframe whose src the cue sheet sets; the master clock is the
   current chapter's audio.currentTime, or — when audio cannot start (no gesture
   / WS.muted / a visitor chose to read) — an rAF virtual clock. One engine, two
   clocks (DESIGN §10). This file owns the impure surface: the stage iframe, the
   word-lit caption band (colophon idiom ported to the RAW claude-tts sidecar —
   filter items[] to type==='word', map to spans BY ORDER), the always-visible
   operator strip (CLICKABLE panic buttons in the parent, which work regardless
   of iframe focus), the focus guard, the RM preflight banner, chapter HOLDs, and
   the location.hash reload-recovery. The seek re-derivation, scrub debounce, and
   hash codec are pure and live in CueEngine.

   Comments inside this forge-included block use the BLOCK form ONLY, never a
   multi-line HTML comment (the forge landmine that silently kills the script),
   and never contain the sequence that would close a block comment early.

   Vanilla, dependency-free. No Math.random / no Date.* — the cue LOGIC is a pure
   function of (chapters, time) in CueEngine; the virtual clock is rAF-driven
   (DESIGN §0/§10 determinism, ledger invariant 5). setTimeout is UI pacing only
   (the 2s visitor auto-advance), never a cue clock.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CE = window.CueEngine;
  var CHAPTERS = window.SHOWING_CHAPTERS || [];
  if (!CE || !CHAPTERS.length) {
    /* Nothing to show — leave the gate copy in place so the page is not blank. */
    try { console.error('[showing] CueEngine or SHOWING_CHAPTERS missing'); } catch (e) {}
    return;
  }

  /* ── ?record — a chrome-free RECORDING run (matches the trailer's ?record) ────
     Same query-param convention as the trailer. When present, the deck hides the
     operator strip + the reading options, runs the stage full-bleed on black,
     narrates, AUTO-ADVANCES ~2s after each chapter's narration ends, and shows the
     current chapter name in a quiet top banner. One gesture is still required to
     bless audio (browser autoplay policy), so the start gate's "begin" stays — the
     STRIP (the controls) is what's hidden; a single click begins the take. */
  var RECORD = false;
  try { RECORD = /[?&]record(?:=|&|$)/.test(window.location.search); } catch (e) { RECORD = false; }

  /* ── ?record preflight constants (ported from trailer.js:78-79) ───────────────
     COUNT_IN_MS: silent held-black count-in before the take's in-point (ENGINE §8).
     FRAME_SETTLE_MS: settle beat after the stage frame's last `load`.
     PREFLIGHT_ENABLED: the heavy preflight machinery (probe bank, arm poll,
       held-black, gate panel) runs iff RECORD (the real pre-take gate) OR the deck
       opts in via a `data-preflight` attribute (the projection-room film re-runs
       the SAME panel LIVE as CH1 content — T3.1). showing/dev-showing set neither,
       so ordinary playback is byte-for-byte unchanged. Resolved in boot(). */
  var COUNT_IN_MS = 2200;
  var FRAME_SETTLE_MS = 400;
  var PREFLIGHT_ENABLED = false;
  var preflightProbes = [];   /* per-chapter audio buffer probes (C2), built under the flag */

  /* ── ws.js mute bridge (ws-optional; the estate's ws:pref:muted convention) ── */
  function muted() {
    try {
      if (typeof WS !== 'undefined' && WS && WS.muted) return WS.muted();
      return localStorage.getItem('ws:pref:muted') === '1';
    } catch (e) { return false; }
  }

  /* ── deck state ────────────────────────────────────────────────────────────
     mode:      'scheduled' (parent keeps focus, cues run) | 'live' (Brandon is
                clicked into the frame; the deck pauses, the focus guard stands
                down, RE-ARM returns).
     visitor:   true → chapters AUTO-ADVANCE after a short hold (silent-mode
                gallery run); false → operator HOLD at each chapter end.
     usingAudio true once a real <audio> clock is driving; false = rAF virtual. */
  var state = {
    idx: 0,
    mode: 'scheduled',
    visitor: false,
    record: false,
    started: false,
    playing: false,
    holding: false,
    usingAudio: false,
    clockMs: 0,
    lastFireT: -Infinity,   /* seconds; (from, to] so a t=0 cue fires on tick 1 */
    lastRafTs: null,
    lastHashMs: null,
    rafId: 0,
    autoTimer: 0,
    scrubbing: false,
    frameLoadedAt: 0,       /* perf.now() of the last stage-frame load (preflight C1) */
    bootProfileKeys: null,  /* ws: profile keys present BEFORE any frame loaded (C6) */
    bootHadHash: false,     /* was a resume hash present AT BOOT, before the deck's own
                               mirror wrote one? (C6 — read this, never live location.hash,
                               so CH1's live panel isn't false-reddened by our own mirror) */
    arming: false,          /* record: between the arm click and the take starting */
    pfTimer: 0              /* record: the 300ms preflight repaint poll */
  };

  var scrub = CE.createScrubDebounce();
  var els = {};
  var audio = null;
  var wordCache = {};      /* chapter id → [word items] */
  var lineCache = {};      /* chapter id → [caption lines] */
  var lineSpans = [];      /* span els of the CURRENT caption line */
  var litLine = -1;
  var litSpan = -1;        /* index within the current line */

  /* ── small helpers ───────────────────────────────────────────────────────── */
  function chapter(i) { return CHAPTERS[i]; }
  function cur() { return CHAPTERS[state.idx]; }
  function durationMs(ch) {
    if (ch && ch.timing && typeof ch.timing.duration_ms === 'number') return ch.timing.duration_ms;
    if (ch && typeof ch.durationMs === 'number') return ch.durationMs;
    return 8000; /* placeholder-safe default */
  }
  function words(ch) {
    if (!ch) return [];
    if (wordCache[ch.id]) return wordCache[ch.id];
    var items = (ch.timing && ch.timing.items) || [];
    var out = [];
    for (var i = 0; i < items.length; i++) if (items[i] && items[i].type === 'word') out.push(items[i]);
    wordCache[ch.id] = out;
    return out;
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
    while (els.cuelog.childNodes.length > 40) els.cuelog.removeChild(els.cuelog.firstChild);
    els.cuelog.scrollTop = els.cuelog.scrollHeight;
  }
  function frameWin() {
    try { return els.frame && els.frame.contentWindow; } catch (e) { return null; }
  }

  /* ── captions: ONE line at a time (a subtitle, not a wall of prose) ──────────
     The RAW word sidecar is grouped into short lines at build time; only the
     CURRENT line is on stage. When the next line's window opens, the old line
     bumps UP out of the way and fades while the new line takes its place — so
     the framed page stays visible behind a single quiet line of text. Seeks and
     chapter jumps hard-cut (no animation). Word-lighting is unchanged, scoped
     to the current line's spans. */
  function buildLines(ch) {
    if (!ch) return [];
    if (lineCache[ch.id]) return lineCache[ch.id];
    var ws = words(ch), lines = [], line = null;
    var MAX = 56;   /* chars per caption line — subtitle-sized in the big serif */
    for (var i = 0; i < ws.length; i++) {
      var v = String(ws[i].value);
      if (!line || (line.len + 1 + v.length) > MAX) {
        line = { words: [], len: 0, startMs: ws[i].s, endMs: ws[i].e };
        lines.push(line);
      }
      line.words.push(ws[i]);
      line.len += (line.words.length > 1 ? 1 : 0) + v.length;
      line.endMs = ws[i].e;
      /* prefer to break after strong punctuation once the line is half full */
      if (line.len >= MAX * 0.5 && /[.!?;:—]["')\]]?$/.test(v)) line = null;
    }
    lineCache[ch.id] = lines;
    return lines;
  }
  function buildCaptions(ch) {
    /* reset the caption viewport for a (re)entered chapter; lines mount lazily */
    els.captions.textContent = '';
    litLine = -1; litSpan = -1; lineSpans = [];
    buildLines(ch);
  }
  function mountLine(line, animateOut) {
    var old = els.captions.querySelector('.cap-line.cur');
    if (old) {
      if (animateOut) {
        old.className = 'cap-line out';
        /* UI pacing only (never a cue clock): sweep the faded line from the DOM */
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
      sp.textContent = line.words[i].value;
      el.appendChild(sp);
      el.appendChild(document.createTextNode(' '));
      lineSpans.push(sp);
    }
    els.captions.appendChild(el);
  }
  function lightCaption(ms) {
    var ch = cur();
    var lines = buildLines(ch);
    if (!lines.length) return;
    var li = 0;
    for (var i = 0; i < lines.length; i++) { if (ms >= lines[i].startMs) li = i; else break; }
    if (li !== litLine) {
      mountLine(lines[li], li === litLine + 1); /* animate only the natural advance */
      litLine = li;
      litSpan = -1;
    }
    var ws = lines[li].words, idx = -1;
    for (var j = 0; j < ws.length; j++) {
      if (ms >= ws[j].s && ms < ws[j].e) { idx = j; break; }
      if (ms >= ws[j].s) idx = j; /* keep last-passed lit between windows */
    }
    if (idx === litSpan) return;
    if (litSpan >= 0 && lineSpans[litSpan]) lineSpans[litSpan].classList.remove('on');
    if (idx >= 0 && lineSpans[idx]) lineSpans[idx].classList.add('on');
    litSpan = idx;
  }

  /* ── the stage frame (debounced loads, DESIGN §10) ─────────────────────────── */
  function setFrame(src) {
    if (src == null) return;
    var emit = scrub.propose(src);          /* null when already loaded / deferred */
    if (emit != null) { state.frameLoadedAt = 0; els.frame.src = emit; } /* recorded as loaded */
  }
  function forceStage(src) {
    /* load `src` FRESH even when the frame is already "on" it — a same-URL frame
       otherwise keeps its accumulated state (a finished marble run, a hand-driven
       GO-LIVE detour). location.replace on the frame window also recovers a frame
       that navigated elsewhere during GO-LIVE. */
    if (src == null) return;
    state.frameLoadedAt = 0;
    scrub.sync(src);
    try {
      var fw = frameWin();
      if (fw && fw.location) { fw.location.replace(new URL(src, window.location.href).href); return; }
    } catch (e) {}
    try { els.frame.src = src; } catch (e) {}
  }

  /* ── deck-local verbs ("deck.*") — durable stage overlays that ride the STATE
     replay machinery but never touch the frame. deck.card(id) shows a plate from
     the SHOWING_CARDS registry; deck.card(null) clears it. Idempotent. ────────── */
  var curCard = null;
  function setCard(id) {
    id = id || null;
    if (id === curCard) return;
    curCard = id;
    if (!els.card) return;
    var reg = window.SHOWING_CARDS || {};
    if (!id || !reg[id]) { els.card.hidden = true; els.card.innerHTML = ''; curCard = null; return; }
    els.card.innerHTML = reg[id];
    els.card.hidden = false;
  }
  var DECK_HOOKS = { card: setCard };

  /* ── cue routing (try/catch per cue — a failed poke logs, never throws) ────── */
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
    /* re-poke every state cue ≤ target, in order, so a seek reconstructs durable
       page state (idempotent hooks — DESIGN §10). Best-effort; logged. */
    for (var i = 0; i < list.length; i++) pokeHook(list[i].state, 'replay');
  }

  /* ── entering a chapter (or seeking within it) ─────────────────────────────── */
  function enterChapter(i, t0) {
    if (i < 0 || i >= CHAPTERS.length) return null;
    if (state.autoTimer) { clearTimeout(state.autoTimer); state.autoTimer = 0; }
    state.idx = i;
    state.holding = false;
    state.clockMs = Math.max(0, t0 || 0);
    var ch = cur();
    var tSec = state.clockMs / 1000;
    /* the cue cursor starts AT the entry time — a mid-chapter entry (reload
       resume, hash rehydrate) must NOT re-fire every cue ≤ t on the first tick:
       durable state comes from the explicit stateReplay below, and IMPULSES are
       never replayed (the reload-resume marble-run-ding bug). At t=0 the cursor
       stays -Infinity so the chapter's t=0 cues still fire. */
    state.lastFireT = tSec > 0 ? tSec : -Infinity;
    setCard(null);   /* a card never outlives its chapter; the replay below re-shows one if due */
    var seek = CE.deriveSeek(ch, tSec, scrub.current());
    if (seek.frameChanged) setFrame(seek.frame); else if (seek.frame != null) scrub.sync(seek.frame);
    buildCaptions(ch);
    lightCaption(state.clockMs);
    /* state replay happens after the frame is ready (its load handler), but also
       best-effort now for a same-frame seek where no load will fire. */
    if (!seek.frameChanged) replayStates(seek.stateReplay);
    pendingReplay = seek.frameChanged ? seek.stateReplay : null;
    resetAudioTo(tSec);
    paintChrome();
    return seek;
  }
  var pendingReplay = null;

  function resetAudioTo(tSec) {
    if (!audio) return;
    try {
      var ch = cur();
      /* only swap src when it actually changed — RE-ASSIGNING the same src resets
         the media element to a stopped state (the scrub-killed-the-voice bug) */
      if (state.usingAudio && ch && ch.audio && audio.src !== ch.audio) { audio.src = ch.audio; }
      if (audio.readyState > 0 || audio.src) { try { audio.currentTime = tSec; } catch (e) {} }
    } catch (e) {}
  }

  /* ── the clock: audio.currentTime when audio drives, rAF virtual otherwise ── */
  function tick(ts) {
    state.rafId = requestAnimationFrame(tick);
    var ch = cur(), dur = durationMs(ch);

    if (state.playing && !state.holding) {
      if (state.usingAudio && audio && !audio.paused) {
        state.clockMs = audio.currentTime * 1000;
      } else if (state.lastRafTs != null) {
        state.clockMs += (ts - state.lastRafTs);
      }
    }
    state.lastRafTs = ts;

    /* fire the cues we crossed since the last tick (forward playback) */
    if (state.playing && !state.holding) {
      var to = state.clockMs / 1000;
      var fired = CE.cuesInRange(ch, state.lastFireT, to);
      for (var i = 0; i < fired.length; i++) fireCue(fired[i]);
      state.lastFireT = to;
    }

    lightCaption(state.clockMs);
    paintClock(dur);
    mirrorHash(ts);

    /* chapter end → HOLD (operator) or auto-advance (visitor) */
    if (state.playing && !state.holding && state.clockMs >= dur) {
      state.clockMs = dur;
      onChapterEnd();
    }
  }

  function onChapterEnd() {
    /* record + visitor both AUTO-ADVANCE ~2s after the chapter's clock (its
       narration) runs out; an operator run HOLDs for a manual advance. In a
       narrated run the audio drives the clock to dur, then the rAF clock carries
       the last few ms — so this fires right as the voice finishes. */
    if (state.visitor || state.record) {
      state.holding = true;
      showReady();
      state.autoTimer = setTimeout(function () { advance(); }, 2000);
    } else {
      state.holding = true;
      showReady();
    }
  }
  function showReady() {
    var next = chapter(state.idx + 1);
    if (next) els.ready.textContent = 'next — ' + next.title;
    else els.ready.textContent = '— end of the showing';
    els.frame.classList.add('holding');
  }
  function advance() {
    if (state.autoTimer) { clearTimeout(state.autoTimer); state.autoTimer = 0; }
    els.frame.classList.remove('holding');
    els.ready.textContent = '';
    if (state.idx + 1 < CHAPTERS.length) { enterChapter(state.idx + 1, 0); armPlay(); }
    /* last chapter: stay held at the end card */
  }

  /* ── reload-recovery hash mirror (coarse tick) ─────────────────────────────── */
  function mirrorHash(nowMs) {
    if (!state.started) return;
    if (!CE.shouldMirror(state.lastHashMs, nowMs, 2000)) return;
    state.lastHashMs = nowMs;
    var h = CE.encodeHash({ chapter: cur().id, offsetMs: state.clockMs });
    if (h) { try { history.replaceState(null, '', h); } catch (e) { location.hash = h; } }
  }

  /* ── chrome paint ──────────────────────────────────────────────────────────── */
  function paintClock(dur) {
    els.clock.textContent = fmt(state.clockMs);
    els.dur.textContent = fmt(dur);
    if (!state.scrubbing && els.scrub) {
      els.scrub.value = String(dur ? Math.round(state.clockMs / dur * 1000) : 0);
    }
  }
  function paintChrome() {
    els.mode.textContent = state.mode + (state.visitor ? ' · visitor' : '') +
      (state.usingAudio ? '' : ' · silent');
    els.play.textContent = state.playing && !state.holding ? '⏸' : '▶';
    var btns = els.chapters.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-current', i === state.idx ? 'true' : 'false');
    if (!state.holding) {
      /* in live mode the ready-line carries the how-do-I-get-back hint (the cue
         log is hidden by default, so the hint must live in visible chrome) */
      els.ready.textContent = state.mode === 'live' ? 'the stage is yours — RE-ARM resumes' : '';
      els.frame.classList.remove('holding');
    }
    var addr = cur() && cur().addr;
    els.addr.textContent = addr || '';
    if (els.recname) {
      var rc = cur();
      els.recname.textContent = rc ? ((state.idx + 1) + '/' + CHAPTERS.length + '  ·  ' + rc.title) : '';
    }
  }

  /* ── transport ───────────────────────────────────────────────────────────── */
  function armPlay() {
    /* frame-load-gated: play only once the frame's load has settled, with a
       short max-wait so narration never talks over a blank frame (DESIGN §10). */
    state.playing = true;
    state.holding = false;
    startClock();
    paintChrome();
  }
  function startClock() {
    var ch = cur();
    /* a visitor who chose "read it silently" gets the rAF virtual clock, never the
       narration audio — visitor mode IS silent mode (the header's promise; before
       this guard, gate-read armed the voice exactly like a begin) */
    if (audio && ch && ch.audio && (!muted() || state.record) && !state.visitor) {
      try {
        if (audio.src !== ch.audio) audio.src = ch.audio;
        var p = audio.play();
        if (p && p.then) {
          p.then(function () { state.usingAudio = true; paintChrome(); })
           .catch(function () { state.usingAudio = false; paintChrome(); });
        } else { state.usingAudio = true; }
      } catch (e) { state.usingAudio = false; }
    } else {
      state.usingAudio = false; /* silent virtual clock */
    }
  }
  function togglePlay() {
    if (!state.started) return;
    if (state.holding) { advance(); return; }
    state.playing = !state.playing;
    if (state.playing) { if (state.usingAudio && audio) { try { audio.play(); } catch (e) {} } }
    else { if (state.usingAudio && audio) { try { audio.pause(); } catch (e) {} } }
    paintChrome();
  }
  function prevChapter() { if (state.idx > 0) { enterChapter(state.idx - 1, 0); armPlay(); } else { enterChapter(0, 0); armPlay(); } }
  function nextChapter() { if (state.holding) { advance(); return; } if (state.idx + 1 < CHAPTERS.length) { enterChapter(state.idx + 1, 0); armPlay(); } }
  function restartAudio() {
    var seek = enterChapter(state.idx, 0);
    /* a restart means a PRISTINE stage — if the opening frame is the one already
       up, force-reload it so accumulated page state (a finished run, fired dots)
       resets with the narration */
    if (seek && !seek.frameChanged && seek.frame != null) {
      pendingReplay = seek.stateReplay;
      forceStage(seek.frame);
    }
    armPlay();
  }
  function goLive() {
    state.mode = 'live';
    state.playing = false;
    if (state.usingAudio && audio) { try { audio.pause(); } catch (e) {} }
    log('— GO-LIVE — click into the stage; RE-ARM to resume');
    paintChrome();
    try { els.frame.focus(); } catch (e) {}
  }
  function reArm() {
    state.mode = 'scheduled';
    /* the stage may have been hand-driven (or navigated away) during GO-LIVE —
       restore the rehearsed look for the current time: a FRESH frame, then the
       idempotent STATE cues ≤ t replayed on its load (impulses stay unfired). */
    var ch = cur(), tSec = state.clockMs / 1000;
    var seek = CE.deriveSeek(ch, tSec, null);
    if (seek && seek.frame != null) {
      pendingReplay = seek.stateReplay;
      forceStage(seek.frame);
    }
    log('— RE-ARMED — stage restored to the rehearsed state');
    focusReclaim();
    paintChrome();
  }

  /* ── within-chapter scrub (exercises the whole debounce API, DESIGN §10) ───── */
  function scrubStart() { state.scrubbing = true; scrub.begin(); }
  function scrubMove() {
    if (!state.started) return;
    var dur = durationMs(cur());
    var frac = (+els.scrub.value) / 1000;
    state.clockMs = frac * dur;
    var seek = CE.deriveSeek(cur(), state.clockMs / 1000, scrub.current());
    if (seek.frameChanged) scrub.propose(seek.frame); /* deferred while scrubbing */
    lightCaption(state.clockMs);
    els.clock.textContent = fmt(state.clockMs);
  }
  function scrubEnd() {
    state.scrubbing = false;
    var emit = scrub.release();      /* the ONE final frame to load, or null */
    if (emit != null) { state.frameLoadedAt = 0; els.frame.src = emit; }
    var tSec = state.clockMs / 1000;
    replayStates(CE.stateCuesUpTo(cur(), tSec));
    state.lastFireT = tSec;          /* don't replay impulses we scrubbed past */
    resetAudioTo(tSec);
    /* scrubbing back out of an end-of-chapter HOLD releases the hold */
    if (state.holding && state.clockMs < durationMs(cur())) {
      state.holding = false;
      els.frame.classList.remove('holding');
      els.ready.textContent = '';
    }
    /* if the narration was playing, KEEP it playing from the new position — a
       seek must never strand the deck on the silent clock (the bug the Patron
       hit on day one: scrub back → voice gone, captions marching on) */
    if (state.started && state.playing && !state.holding && state.usingAudio && audio) {
      try { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
    paintChrome();
  }

  /* ── focus guard + RM preflight ────────────────────────────────────────────── */
  function focusReclaim() { if (state.mode === 'scheduled') { try { els.focussink.focus(); } catch (e) {} } }
  function rmCheck(win, label) {
    try {
      if (win && win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        els.rmbanner.hidden = false;
        els.rmbanner.textContent = 'REDUCE MOTION IS ON (' + label + ') — turn it off: System Settings → Accessibility → Display. The estate freezes its motion under it.';
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ── ?record chrome: injected at runtime so the whole feature lives in ONE
     shared file (both decks forge:include this) — no per-deck HTML to keep in
     sync. Hides the strip + reading options, runs the stage full-bleed, and adds
     a quiet top banner carrying the current chapter name. ────────────────────── */
  var RECORD_CSS = [
    'body.record #strip{ display:none !important; }',
    'body.record #cuelog{ display:none !important; }',
    'body.record #stage{ inset:0 !important; }',
    'body.record #captions{ bottom:7vh !important; }',
    'body.record #rmbanner{ bottom:0 !important; }',
    'body.record #card{ bottom:16vh !important; }',
    'body.record #gate-read, body.record #gate-resume{ display:none !important; }',
    'body.record.rec-live{ cursor:none; }',
    '#recname{ position:fixed; left:0; right:0; top:0; z-index:8; display:none;',
    '  padding:16px 22px 24px; text-align:center; pointer-events:none;',
    '  font:600 13px/1.2 ui-monospace,Menlo,monospace; letter-spacing:.26em;',
    '  text-transform:uppercase; color:#d9b168; text-shadow:0 2px 20px rgba(0,0,0,.9);',
    '  background:linear-gradient(180deg, rgba(4,6,10,.74), transparent); }',
    'body.record #recname{ display:block; }'
  ].join('\n');

  function installRecordChrome() {
    state.record = true;
    try {
      var st = document.createElement('style');
      st.id = 'record-style';
      st.textContent = RECORD_CSS;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
    try { document.body.classList.add('record'); } catch (e) {}
    var rn = document.createElement('div');
    rn.id = 'recname';
    rn.setAttribute('aria-hidden', 'true');
    document.body.appendChild(rn);
    els.recname = rn;
    /* a clearer start affordance for the take (the strip is gone) */
    try {
      if (els.gBegin) els.gBegin.textContent = '▶ begin recording';
      var sub = els.gate && els.gate.querySelector('.sub');
      if (sub) sub.textContent = 'Recording mode — the deck plays through on its own and auto-advances between chapters; the controls are hidden.';
    } catch (e) {}
    paintChrome();
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ?record PREFLIGHT + ARM — ported from trailer/trailer.js:992-1208 and adapted
     to the showing deck's single-frame / single-<audio> architecture (T0.2 design
     `scratch/worker-report-T0.2.md`). Two consumers: (a) the real pre-take gate,
     under ?record; (b) CH1 of the projection-room film, which re-runs the SAME
     panel LIVE as content (data-preflight opt-in). Comments use the BLOCK form
     only (the forge HTML-comment landmine).
     ═══════════════════════════════════════════════════════════════════════════ */
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* Snapshot the estate's profile keys BEFORE any frame loads — the deck's own CH0
     frame would itself stamp `ws:seen:` on load, so a naive length check would
     false-RED on a genuinely fresh record port. C6 passes iff this is empty. */
  function snapshotProfileKeys() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && /^ws:(seen|flag|best|dwell|done|carry):/.test(k)) out.push(k);
      }
    } catch (e) {}
    return out;
  }

  /* The six preflight checks — pure read-only measurement, returning the trailer's
     identical { ok, checks:[{ name, ok, detail }] } shape. Run on the arm poll AND
     re-run inside armRecord (a row that flips red between poll and click still
     refuses). Row order is fixed for on-camera legibility. */
  function preflightRecord() {
    var checks = [];
    var now = nowMs();

    /* C1 — the stage frame loaded + a settle beat (single frame; adapts the
       trailer's stack-frames-loaded check). */
    var frameOk = state.frameLoadedAt > 0 && (now - state.frameLoadedAt) >= FRAME_SETTLE_MS;
    checks.push({ name: 'stage frame loaded', ok: !!frameOk,
      detail: state.frameLoadedAt > 0 ? (frameOk ? 'loaded · settled' : 'settling…') : 'loading…' });

    /* C2 — every chapter's audio buffered (readyState ≥ 2), via the record-only
       probe bank (the reused #voice element can hold only one src at a time). */
    var audioOk = preflightProbes.length > 0, ad = [];
    for (var i = 0; i < preflightProbes.length; i++) {
      var rs = preflightProbes[i] ? preflightProbes[i].readyState : 0;
      if (rs < 2) audioOk = false;
      ad.push((CHAPTERS[i] ? CHAPTERS[i].id : i) + '=' + (preflightProbes[i] ? rs : '—'));
    }
    if (!preflightProbes.length) ad.push('no probes');
    checks.push({ name: 'audio buffered (readyState ≥ 2)', ok: audioOk, detail: ad.join(' ') });

    /* C3 — Reduce Motion OFF (the estate freezes its motion under RM). */
    var rmOn = false;
    try { rmOn = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
    checks.push({ name: 'reduce motion off', ok: !rmOn, detail: rmOn ? 'ON — the estate freezes' : 'off' });

    /* C4 — estate unmuted (the narration voice depends on it). */
    var m = muted();
    checks.push({ name: 'estate unmuted', ok: !m, detail: m ? "ws:pref:muted='1'" : 'unmuted' });

    /* C5 — viewport ≥ 1920×1080. */
    var vw = window.innerWidth, vh = window.innerHeight;
    checks.push({ name: 'viewport ≥ 1920×1080', ok: vw >= 1920 && vh >= 1080, detail: vw + '×' + vh });

    /* C6 — fresh record profile: no prior ws: keys AND no resume mirror in the hash
       AT BOOT (a re-entered session deep-links mid-film). Both read from the boot
       snapshot, never live — the deck writes its own resume hash once playback starts,
       so a live check would false-RED the moment CH1's on-camera panel runs. Invariant
       7: served from a dedicated fresh port. */
    var priorN = state.bootProfileKeys ? state.bootProfileKeys.length : 0;
    var hasHash = !!state.bootHadHash;
    var freshOk = priorN === 0 && !hasHash;
    checks.push({ name: 'fresh record profile', ok: freshOk,
      detail: freshOk ? 'clean' : (priorN ? (priorN + ' prior keys') : 'resume hash present') });

    var ok = true;
    for (var j = 0; j < checks.length; j++) if (!checks[j].ok) ok = false;
    return { ok: ok, checks: checks };
  }

  /* Paint the preflight panel. `target` = { list, status } DOM els; default = the
     record gate's injected panel. The projection-room CH1 stage passes its own
     target so the SAME renderer paints the on-camera panel (T3.1). */
  function renderPreflight(pf, target) {
    var list = (target && target.list) || els.pfList;
    var status = (target && target.status) || els.pfStatus;
    if (!list) return;
    var html = '';
    for (var i = 0; i < pf.checks.length; i++) {
      var c = pf.checks[i];
      html += '<div class="pf-row ' + (c.ok ? 'ok' : 'bad') + '">' +
              '<span class="pf-mark">' + (c.ok ? '✓' : '✗') + '</span>' +
              '<span class="pf-name">' + c.name + '</span>' +
              '<span class="pf-detail">' + c.detail + '</span></div>';
    }
    list.innerHTML = html;
    if (status) {
      status.textContent = pf.ok
        ? 'READY — click anywhere to arm the take'
        : 'NOT READY — any red row above blocks the take (fix it, do not record)';
      status.className = 'pf-status ' + (pf.ok ? 'ok' : 'bad');
    }
  }

  /* ── preflight chrome injected at runtime (no per-deck HTML → forge zero-diff on
     the source; showing/dev-showing stay byte-identical). Styles + probe bank run
     under PREFLIGHT_ENABLED; the gate arm surface (#heldblack + #preflight panel)
     only under RECORD. ──────────────────────────────────────────────────────── */
  var PREFLIGHT_CSS = [
    /* instant-on / animate-out black (the count-in cover + the out-point) */
    '#heldblack{ position:fixed; inset:0; background:#000; z-index:60; opacity:0;',
    '  pointer-events:none; transition:opacity .4s ease; }',
    '#heldblack.on{ opacity:1; transition:none; }',
    /* the panel: bare .pf-* classes so the CH1 stage panel is styled too */
    '.pf-title{ letter-spacing:.16em; text-transform:uppercase; font-size:11px;',
    '  color:var(--muted); margin-bottom:18px; }',
    '.pf-row{ display:grid; grid-template-columns:1.4em 1fr auto; gap:16px;',
    '  align-items:baseline; padding:7px 0; border-bottom:1px solid rgba(255,255,255,.06); }',
    '.pf-row .pf-mark{ font-weight:700; }',
    '.pf-row.ok .pf-mark{ color:#5bd58b; }',
    '.pf-row.bad .pf-mark{ color:#e0473b; }',
    '.pf-row .pf-name{ color:var(--ink); }',
    '.pf-row.bad .pf-name{ color:#f2a29a; }',
    '.pf-row .pf-detail{ color:var(--muted); white-space:nowrap; }',
    '.pf-status{ margin-top:22px; font-size:16px; letter-spacing:.01em; }',
    '.pf-status.ok{ color:#7fe0a6; }',
    '.pf-status.bad{ color:#e0473b; }',
    /* the record gate takes over: black, the panel replaces the marketing copy */
    '#preflight{ display:none; }',
    'body.record #gate{ background:#000; gap:0; padding:48px; align-items:flex-start;',
    '  justify-content:center; text-align:left; }',
    'body.record #gate .kick, body.record #gate h1,',
    'body.record #gate .sub, body.record #gate .acts{ display:none; }',
    'body.record #preflight{ display:block; width:100%; max-width:820px;',
    '  font:600 15px/1.7 ui-monospace,Menlo,monospace; color:var(--muted); }'
  ].join('\n');

  function injectPreflightStyles() {
    try {
      var st = document.createElement('style');
      st.id = 'preflight-style';
      st.textContent = PREFLIGHT_CSS;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  /* One hidden, muted, never-played <audio preload=auto> per chapter — measures
     C2 and warms the HTTP cache so the live #voice element's per-chapter src load
     is instant (fewer mid-take stutters). */
  function buildPreflightProbes() {
    try {
      var bank = document.createElement('div');
      bank.id = 'pf-probes';
      bank.setAttribute('aria-hidden', 'true');
      bank.style.cssText = 'position:absolute; width:0; height:0; overflow:hidden;';
      for (var i = 0; i < CHAPTERS.length; i++) {
        var ch = CHAPTERS[i];
        if (!ch || !ch.audio) { preflightProbes.push(null); continue; }
        var a = document.createElement('audio');
        a.preload = 'auto';
        a.muted = true;
        a.src = ch.audio;
        bank.appendChild(a);
        preflightProbes.push(a);
      }
      document.body.appendChild(bank);
    } catch (e) {}
  }

  /* The record gate arm surface: a full-screen black overlay for the count-in and
     the preflight panel injected into the existing #gate. */
  function injectRecordArmChrome() {
    try {
      var hb = document.createElement('div');
      hb.id = 'heldblack';
      hb.setAttribute('aria-hidden', 'true');
      document.body.appendChild(hb);
      els.heldblack = hb;
    } catch (e) {}
    try {
      var pf = document.createElement('div');
      pf.id = 'preflight';
      pf.setAttribute('aria-hidden', 'true');
      pf.innerHTML = '<div class="pf-title">record preflight · the pre-take gate</div>' +
                     '<div id="pf-list"></div>' +
                     '<div id="pf-status" class="pf-status"></div>';
      els.gate.appendChild(pf);
      els.pfList = document.getElementById('pf-list');
      els.pfStatus = document.getElementById('pf-status');
    } catch (e) {}
  }

  /* Unlock a media element under a real gesture (a synthetic .click() unlocks no
     audio — verified). Muted through the play→pause so no blip escapes. */
  function unlockEl(a) {
    if (!a || !a.src) return;
    try {
      var wasMuted = a.muted;
      a.muted = true;
      var p = a.play();
      var done = function () { try { a.pause(); a.currentTime = 0; a.muted = wasMuted; } catch (e) {} };
      if (p && p.then) p.then(done).catch(function () { try { a.muted = wasMuted; } catch (e2) {} });
      else done();
    } catch (e) { try { a.muted = false; } catch (e2) {} }
  }

  /* Everything that needs the real arm gesture, done once at the click: prime CH0's
     src onto the reused #voice element and bless it, so the count-in's later
     programmatic play() is allowed. (No music bed yet — the projection-room bed
     lands at T4.2 and unlocks here too.) */
  function reachIn() {
    try {
      var ch0 = CHAPTERS[0];
      if (audio && ch0 && ch0.audio && !audio.src) audio.src = ch0.audio;
    } catch (e) {}
    unlockEl(audio);
  }

  /* Wire the ?record arm surface: the WHOLE gate is clickable (OBS "Interact"
     clicks anywhere), and a 300ms poll repaints the panel until READY so a
     condition that flips (RM toggled, a probe that finishes buffering) is live
     before the operator clicks. */
  function setupRecordArm() {
    if (els.gate) els.gate.addEventListener('click', armRecord);
    (function poll() {
      if (state.started || state.arming) return;
      renderPreflight(preflightRecord());
      state.pfTimer = setTimeout(poll, 300);
    })();
  }

  /* The ONE real blessing gesture: re-run preflight (refuse on any red), reach in,
     black out, then a silent count-in before the take's in-point. */
  function armRecord() {
    if (state.started || state.arming) return;
    var pf = preflightRecord();
    renderPreflight(pf);
    if (!pf.ok) { log('✗ record: REFUSED to arm — preflight red'); return; }
    state.arming = true;
    if (state.pfTimer) { clearTimeout(state.pfTimer); state.pfTimer = 0; }

    reachIn();
    /* black FIRST (instant), then hide the gate → no flash of the green panel */
    if (els.heldblack) els.heldblack.classList.add('on');
    if (els.gate) { els.gate.hidden = true; els.gate.style.display = 'none'; }
    if (els.rmbanner && els.rmbanner.parentNode) els.rmbanner.parentNode.removeChild(els.rmbanner);
    log('▸ record: armed — silent count-in ' + COUNT_IN_MS + ' ms');

    setTimeout(function () {
      start(false, 0, 0);               /* enters CH0 + arms the voice under the black */
      if (els.heldblack) els.heldblack.classList.remove('on');  /* fade out → first room */
      log('▸ record: the film runs');
    }, COUNT_IN_MS);
  }

  /* ── boot ───────────────────────────────────────────────────────────────────── */
  function boot() {
    /* C6: snapshot the profile AND the resume-hash BEFORE any frame (or probe) can
       stamp a ws: key and BEFORE the deck's own hash mirror writes a resume hash.
       (A live location.hash check would false-RED C6 the instant playback starts —
       which is exactly when the projection-room CH1 panel re-runs preflight on camera.) */
    state.bootProfileKeys = snapshotProfileKeys();
    try { state.bootHadHash = CE.parseHash(location.hash) != null; } catch (e) { state.bootHadHash = false; }
    var $ = function (id) { return document.getElementById(id); };
    els = {
      frame: $('frame'), captions: $('captions'), rmbanner: $('rmbanner'), card: $('card'),
      play: $('btn-play'), prev: $('btn-prev'), next: $('btn-next'), restart: $('btn-restart'),
      live: $('btn-live'), rearm: $('btn-rearm'), logbtn: $('btn-log'),
      clock: $('clock'), dur: $('dur'), scrub: $('scrub'), chapters: $('chapters'),
      mode: $('mode'), ready: $('ready'), cuelog: $('cuelog'), addr: $('addr'),
      gate: $('gate'), gBegin: $('gate-begin'), gRead: $('gate-read'), gResume: $('gate-resume'),
      audio: $('voice'), focussink: $('focussink')
    };
    audio = els.audio;

    /* the preflight machinery runs under ?record (the pre-take gate) OR when the
       deck opts in via data-preflight (the projection-room film's live CH1 panel) */
    var pfContent = false;
    try {
      pfContent = (document.documentElement && document.documentElement.hasAttribute('data-preflight')) ||
                  (document.body && document.body.hasAttribute('data-preflight'));
    } catch (e) { pfContent = false; }
    PREFLIGHT_ENABLED = RECORD || pfContent;
    if (PREFLIGHT_ENABLED) { injectPreflightStyles(); buildPreflightProbes(); }

    /* ?record: install the chrome-free recording surface + the arm gate */
    if (RECORD) { installRecordChrome(); injectRecordArmChrome(); }

    /* chapter buttons */
    for (var i = 0; i < CHAPTERS.length; i++) {
      (function (n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = (n + 1) + '. ' + CHAPTERS[n].title;
        b.addEventListener('click', function () { enterChapter(n, 0); armPlay(); focusReclaim(); });
        els.chapters.appendChild(b);
      })(i);
    }

    /* operator strip — CLICKABLE panic buttons (work regardless of iframe focus) */
    els.play.addEventListener('click', function () { togglePlay(); focusReclaim(); });
    els.prev.addEventListener('click', function () { prevChapter(); focusReclaim(); });
    els.next.addEventListener('click', function () { nextChapter(); focusReclaim(); });
    els.restart.addEventListener('click', function () { restartAudio(); focusReclaim(); });
    els.live.addEventListener('click', function () { goLive(); });
    els.rearm.addEventListener('click', function () { reArm(); });
    if (els.logbtn) {
      els.logbtn.addEventListener('click', function () {
        els.cuelog.hidden = !els.cuelog.hidden;
        els.logbtn.setAttribute('aria-pressed', els.cuelog.hidden ? 'false' : 'true');
        focusReclaim();
      });
    }
    if (els.scrub) {
      els.scrub.addEventListener('pointerdown', scrubStart);
      els.scrub.addEventListener('input', scrubMove);
      els.scrub.addEventListener('change', scrubEnd);
    }

    /* hotkeys — convenience only; buttons are the guarantee (DESIGN §10) */
    document.addEventListener('keydown', function (e) {
      if (state.mode !== 'scheduled') return;         /* a focused frame owns its keys in go-live */
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nextChapter(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevChapter(); }
      else if (e.key === 'l' || e.key === 'L') { goLive(); }
    });

    /* focus guard: reclaim keyboard routing on every frame load + on blur while
       scheduled; also run the per-frame RM preflight as each frame settles */
    els.frame.addEventListener('load', function () {
      state.frameLoadedAt = nowMs();   /* preflight C1 settle stamp (inert off-record) */
      rmCheck(frameWin(), 'stage');
      if (pendingReplay) { replayStates(pendingReplay); pendingReplay = null; }
      focusReclaim();
    });
    window.addEventListener('blur', function () { if (state.mode === 'scheduled' && state.started) focusReclaim(); });

    /* RM preflight — parent, up front */
    rmCheck(window, 'this display');

    /* mute → cross-tab silence guard: if muted mid-run, fall to the silent clock */
    try {
      window.addEventListener('storage', function (ev) {
        if (ev && ev.key === 'ws:pref:muted' && muted() && state.usingAudio) {
          state.usingAudio = false;
          if (audio) { try { audio.pause(); } catch (e) {} }
          log('— muted elsewhere; continuing on the silent clock —');
          paintChrome();
        }
      });
    } catch (e) {}

    /* reload recovery: rehydrate from the hash mirror if present */
    var rec = CE.parseHash(location.hash);
    if (rec) {
      var ri = -1;
      for (var k = 0; k < CHAPTERS.length; k++) if (CHAPTERS[k].id === rec.chapter) { ri = k; break; }
      if (ri >= 0) {
        state.idx = ri;
        els.gResume.hidden = false;
        els.gResume.textContent = '▸ resume — ' + CHAPTERS[ri].title;
        els.gResume.addEventListener('click', function () { start(false, ri, rec.offsetMs); });
      }
    }

    /* begin / read ALWAYS start from the top — only the explicit resume button
       returns to the recovered spot (a reload must not hijack a fresh start).
       In ?record the whole gate is the OBS Interact arm target (preflight + count-in)
       and replaces the plain begin-click. */
    if (RECORD) setupRecordArm();
    else els.gBegin.addEventListener('click', function () { start(false, 0, 0); });
    els.gRead.addEventListener('click', function () { start(true, 0, 0); });

    /* pre-load chapter 0's chrome behind the gate so a Begin is instant */
    enterChapter(state.idx, 0);
    state.rafId = requestAnimationFrame(tick);
  }

  function start(visitor, i, offsetMs) {
    state.started = true;
    state.visitor = !!visitor;
    state.mode = 'scheduled';
    els.gate.hidden = true;
    els.gate.style.display = 'none';
    /* the take has begun — with the gate gone, drop the pointer for a clean frame */
    if (state.record) { try { document.body.classList.add('rec-live'); } catch (e) {} }
    enterChapter(i, offsetMs || 0);
    armPlay();
    focusReclaim();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* liveness handle for the rehearsal gate (T4.7) + headless probes: a read-only
     window onto deck state and the transport, the __fairgroundLiveness idiom. */
  window.__showing = {
    state: state,
    chapters: CHAPTERS,
    go: function (i, t) { enterChapter(i, t || 0); armPlay(); },
    toggle: togglePlay,
    next: nextChapter,
    prev: prevChapter,
    live: goLive,
    rearm: reArm,
    clockMs: function () { return state.clockMs; },
    deckVerbs: function () { return Object.keys(DECK_HOOKS); },
    cardShown: function () { return curCard; },
    /* caption-line probe for the rehearsal gate: the lines must PARTITION the
       chapter's words (coverage) while only the current line is mounted. */
    cap: function () {
      var ch = cur(), lines = buildLines(ch), total = 0;
      for (var i = 0; i < lines.length; i++) total += lines[i].words.length;
      return {
        lines: lines.length, totalWords: total, chapterWords: words(ch).length,
        curLine: litLine,
        curLineWords: (litLine >= 0 && lines[litLine]) ? lines[litLine].words.length : 0,
        mounted: els.captions.querySelectorAll('.cap-line.cur .cap-w').length
      };
    },
    /* run the RM preflight against a given window (default the parent) and return
       whether the banner fired — the seam the T4.7 rehearsal gate uses to assert
       the RM-emulated pass raises the banner, and the honest way to verify it where
       agent-browser cannot emulate prefers-reduced-motion (a headless twin passes a
       matchMedia stub; a CDP-emulated headless gate passes the real frame window). */
    preflight: function (win) { return rmCheck(win || window, 'preflight'); },
    bannerVisible: function () { return !els.rmbanner.hidden; },

    /* ?record preflight surface + the reusable CH1 panel component (T1.1 / T3.1).
       recPreflight() is the live six-check measurement; renderPanel(pf, target)
       paints it into any {list,status} target (the CH1 stage panel) so T3.1 can
       flip rows to the narration. recArm() is the real arm gesture for the OBS
       operator / rehearsal harness. */
    recPreflight: function () { return preflightRecord(); },
    recChecks: function () { return preflightRecord().checks; },
    renderPanel: function (pf, target) { return renderPreflight(pf || preflightRecord(), target); },
    recArm: function () { return armRecord(); },
    heldBlackOn: function () { return !!(els.heldblack && els.heldblack.classList.contains('on')); },
    armed: function () { return !!state.arming; }
  };
})();
