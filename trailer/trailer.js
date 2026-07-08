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

  /* The colophon frame's stack key — the cold-open zoom target (ENGINE §3). */
  var COLO_KEY = (CHAPTER.opening && CHAPTER.opening.frame) || '../colophon.html';

  /* Cold-open weave-drive constants (SP-B items 1/2/3, T6.1). The reveal is a
     pure function of colophon audio-time; we map the MASTER film clock onto it so
     the word-weave tracks the film deterministically (no colophon-audio load
     race). Anchors re-derived at execution (inv 3): colophon "I" (word 53) s=21462
     from the live cloud-data.json; S0 "I" s=140 from trailer/audio/S0.json.
     colophon-time = COLO_I_MS + (masterMs − S0_ATMS) − S0_I_MS, so S0's spoken "I"
     lands exactly on the colophon's "I" reveal, and the ~4.72 s colophon span for
     words 53–65 tracks S0's ~4.80 s "I am Claude … workshop". */
  var COLO_I_MS = 21462;     /* colophon "I" reveal s-time (live cloud-data.json) */
  var S0_I_MS = 140;         /* S0 "I" s-time (trailer/audio/S0.json) */
  var S0_ATMS = 1500;        /* master-clock time S0's voice begins (== its atMs) */
  var COLD_OPEN_CUT_MS = 6600; /* master time of the fade-to-black */
  /* colophon-time at master t=0 (the paragraph before "I am Claude", per item 1). */
  var COLO_START_MS = COLO_I_MS + (0 - S0_ATMS) - S0_I_MS;

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
    pendingReplay: null,    /* state cues to re-poke after a flip settles */
    scalesRampId: 0         /* token: a later scalesCollapse cancels a running collar ramp (SP-B item 10) */
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
  var curDisplay = null;          /* the active segment's display-override map */
  var curCard = null;             /* the card id currently on #card (idempotent) */

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
  /* When a frame leaves the stage, SILENCE any live AudioContext it published on
     window.__wsAudioCtx (the estate's convention — the Lattice's #begin, the
     Aquarium's hush, the Gate's storm all publish it). Without this a diegetic
     source keeps sounding after its frame flips out: the Lattice's music bled
     under the Errand's digital-zero silence AND lingered over the Gate finale,
     stealing the record-scratch gag's thunder and drowning the Estate's own
     logotune (SP-B items 11 + 12). Idempotent + try/caught — a frame with no ctx
     (or an already-suspended one) is a silent no-op. */
  function suspendFrameAudio(el) {
    try {
      var w = el && el.contentWindow;
      var ac = w && w.__wsAudioCtx;
      if (ac && typeof ac.suspend === 'function' && ac.state === 'running') {
        var pr = ac.suspend(); if (pr && pr.catch) pr.catch(function () {});
        log('▸ hush frame audio (' + (state.activeKey || '?') + ' left stage)');
      }
    } catch (e) {}
  }
  function setFrame(key) {
    if (key == null || key === state.activeKey) return;
    var next = frameEls[key];
    if (!next) { log('· frame ' + key + ' — not in stack'); return; }
    var prev = state.activeKey && frameEls[state.activeKey];
    if (prev) {
      prev.classList.remove('on');
      /* clear any cold-open inline transform/opacity (the colophon zoom/fade) so
         a re-flip or a scrub-replay starts from a clean frame (ENGINE §3). */
      prev.style.transform = ''; prev.style.transformOrigin = '';
      prev.style.opacity = ''; prev.style.transition = ''; prev.style.willChange = '';
      suspendFrameAudio(prev); /* SP-B 11/12: no diegetic audio bleeds off-stage */
    }
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
  /* The spoken sidecar token, and its ON-SCREEN form after the per-segment
     display-override map (ENGINE §4 F9). The override rides the caption band
     ONLY — never the voice / never the TTS input. A trailing-punctuation match
     lets "Vincent" light even when the sidecar token is "Vincent," and lets the
     S5 "Claude" → "— Claude" rule survive a "Claude." token. */
  function rawWordText(w) { return String(w.value != null ? w.value : w.w); }
  function applyDisplay(text, disp) {
    if (!disp) return text;
    if (Object.prototype.hasOwnProperty.call(disp, text)) return disp[text];
    var m = text.match(/^(.*?)([.,!?;:'"\)\]]+)$/);
    if (m && Object.prototype.hasOwnProperty.call(disp, m[1])) return disp[m[1]] + m[2];
    return text;
  }
  function displayText(w) { return applyDisplay(rawWordText(w), curDisplay); }

  /* Does this word force a new caption line before it? `breakBefore` entries may
     be a numeric word index OR a spoken-token string (the token form is
     sidecar-index-independent — it survives T4.1's real render). Used for the S5
     signature "— Claude" on its OWN line (covenant, ENGINE §4). */
  function forcesBreak(brk, idx, w) {
    for (var b = 0; b < brk.length; b++) {
      if (typeof brk[b] === 'number' && brk[b] === idx) return true;
      if (typeof brk[b] === 'string' && rawWordText(w) === brk[b]) return true;
    }
    return false;
  }
  function buildLines(seg) {
    if (!seg) return [];
    if (lineCache[seg.id]) return lineCache[seg.id];
    var ws = segWords(seg), lines = [], line = null;
    var MAX = 56;
    var disp = seg.display || null, brk = seg.breakBefore || [];
    for (var i = 0; i < ws.length; i++) {
      var forced = forcesBreak(brk, i, ws[i]);
      if (forced) line = null;
      var v = applyDisplay(rawWordText(ws[i]), disp); /* width uses the display form */
      if (!line || (line.len + 1 + v.length) > MAX) {
        line = { words: [], len: 0, startMs: ws[i].s, endMs: ws[i].e };
        lines.push(line);
      }
      line.words.push(ws[i]);
      line.len += (line.words.length > 1 ? 1 : 0) + v.length;
      line.endMs = ws[i].e;
      if (!forced && line.len >= MAX * 0.5 && /[.!?;:—]["')\]]?$/.test(v)) line = null;
    }
    lineCache[seg.id] = lines;
    return lines;
  }
  function resetCaptions(seg) {
    if (els.captions) els.captions.textContent = '';
    litLine = -1; litSpan = -1; lineSpans = [];
    curDisplay = (seg && seg.display) || null;
    if (seg) buildLines(seg);
  }
  function wordText(w) { return displayText(w); }

  /* ── the caption band's visibility (ENGINE §4 + §2 T8.9): the band is on ONLY
     while the ACTIVE segment's words are sounding — in at the first word `s`
     −300 ms, out at the last word `e` +200 ms. Off for the whole cold open and
     every VO gap (A/B/C), so no frozen words hang on screen through a silence. */
  function bandVisible() {
    var seg = state.activeSeg;
    if (!seg) return false;
    if (seg.silent) return false; /* S0 cold open — caption band OFF (SCRIPT §1 S0) */
    var ws = segWords(seg);
    if (!ws.length) return false; /* a stub segment with no sidecar stays hushed */
    var ms = state.clockMs - seg.atMs;
    return ms >= (ws[0].s - 300) && ms <= (ws[ws.length - 1].e + 200);
  }
  function paintBand() {
    if (!els.captions) return;
    if (state.playing && !state.ended && bandVisible()) els.captions.classList.remove('hush');
    else els.captions.classList.add('hush');
  }
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

  /* ── full-screen cards (ENGINE §5b) — setCard(id) shows a plate from
     TRAILER_CARDS; setCard(null) clears it. Idempotent; a durable STATE overlay
     that rides the seek-replay machinery but never touches the frame. */
  function setCard(id) {
    id = id || null;
    if (id === curCard) return;
    curCard = id;
    if (!els.card) return;
    var reg = window.TRAILER_CARDS || {};
    if (!id || !reg[id]) { els.card.classList.remove('on'); els.card.innerHTML = ''; curCard = null; log('▸ card — clear'); return; }
    els.card.innerHTML = reg[id];
    els.card.classList.add('on');
    log('▸ card ' + id);
  }

  /* ── the Colophon cold-open zoom (ENGINE §3) — a parent-side transform on the
     colophon iframe ELEMENT (it fills the stage 1:1, so a word rect from
     colophonWordRect maps straight to stage coords). Zoom in on the target word
     (scale so its line-height ≈ 30% of stage height — F10), centred on stage;
     200 ms scale-out to identity on the word's landing; 0.8 s fade to black at
     the cut. Reads the rect ONLY while the colophon is the active frame. */
  function coloFrame() { return frameEls[COLO_KEY] || null; }
  function colophonZoom(word) {
    if (state.activeKey !== COLO_KEY) { log('· colophonZoom — colophon not active'); return; }
    var cf = coloFrame();
    if (!cf || !cf.contentWindow || !els.stage) return;
    var rect = null;
    try {
      var h = cf.contentWindow.__tourHooks;
      rect = (h && typeof h.colophonWordRect === 'function') ? h.colophonWordRect(word) : null;
    } catch (e) { rect = null; }
    if (!rect || !rect.height) { log('· colophonZoom — no rect for "' + word + '" (page not woven yet?)'); return; }
    var sb = els.stage.getBoundingClientRect();
    var stageW = sb.width, stageH = sb.height;
    var wcx = rect.left + rect.width / 2, wcy = rect.top + rect.height / 2;
    /* F10 wants the word ≈28–33% of stage height, "≈4.5–5.5 at the colophon's
       type size". The live colophon renders narration words at a ~21px glyph box
       (measured — smaller than F10 assumed), so the 28–33% figure would demand
       a ~15× scale that crops out the previous-sentence tail the cold open needs.
       Repo wins: honour the design SCALE range 4.5–5.5 (5.5 keeps the most
       context); the crop constraints [tail visible + highlight in crop] are the
       binding assertion, checked by rect arithmetic at rehearsal (T5.2). */
    var S = 0.30 * stageH / rect.height;
    S = Math.max(4.5, Math.min(5.5, S));
    var dx = stageW / 2 - wcx, dy = stageH / 2 - wcy;
    cf.style.willChange = 'transform';
    cf.style.transition = 'none';
    cf.style.transformOrigin = wcx.toFixed(1) + 'px ' + wcy.toFixed(1) + 'px';
    cf.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + S.toFixed(3) + ')';
    state.coloZoom = { word: word, scale: S, wordH: rect.height, stageH: stageH, pctOfStageH: S * rect.height / stageH };
    log('▸ colophonZoom "' + word + '" S=' + S.toFixed(2) + ' (' + Math.round(S * rect.height / stageH * 100) + '% stage-h)');
  }
  function colophonZoomOut(ms) {
    var cf = coloFrame();
    if (!cf) return;
    ms = (typeof ms === 'number' && ms > 0) ? ms : 200;
    cf.style.transition = 'transform ' + ms + 'ms ease';
    cf.style.transform = 'none';
    log('▸ colophonZoomOut ' + ms + 'ms → identity');
  }
  function colophonFade(ms) {
    var cf = coloFrame();
    if (!cf) return;
    ms = (typeof ms === 'number' && ms > 0) ? ms : 800;
    cf.style.transition = (cf.style.transition ? cf.style.transition + ', ' : '') + 'opacity ' + ms + 'ms ease';
    cf.style.opacity = '0';
    log('▸ colophonFade ' + ms + 'ms → black');
  }

  /* ── the cold-open weave-drive (SP-B items 1/2/3, T6.1). Called every playing
     frame from tick(): while the colophon is the active frame and we're inside the
     cold-open window, scrub its audio.currentTime (colophonSeek) to the master-clock
     -derived colophon-time. Because the colophon's reveal is a pure function of
     audio-time, this makes the word-weave a deterministic function of the FILM
     clock — the fix for Brandon's "static, dead colophon" + no-voice-then-pause
     (the page's own audio playback, with its load race, is no longer relied on).
     Held to COLD_OPEN_CUT_MS so the reveal freezes cleanly at the fade. */
  function coloHooks() {
    var cf = coloFrame();
    try { return cf && cf.contentWindow && cf.contentWindow.__tourHooks; } catch (e) { return null; }
  }
  function driveColdOpen() {
    if (state.activeKey !== COLO_KEY) return;
    if (state.clockMs > COLD_OPEN_CUT_MS) return;
    var h = coloHooks();
    if (!h || typeof h.colophonSeek !== 'function') return;
    h.colophonSeek(COLO_I_MS + (state.clockMs - S0_ATMS) - S0_I_MS);
  }

  /* ── the radio-button skit + deck-drawn fake cursor (ENGINE §5). skitOn/Third/
     Pick/Off are durable STATE; the cursor moves/twitches and the bloom are
     transient IMPULSE. Cursor positions derive from the option rects (no magic
     numbers), so they hold at any stage size. */
  function skitQ(sel) { return els.skit ? els.skit.querySelector(sel) : null; }
  function easeFn(e) {
    if (e === 'in') return 'cubic-bezier(.7,0,.84,0)';       /* zero-hesitation snap */
    if (e === 'inout') return 'ease-in-out';
    return 'cubic-bezier(.16,.84,.44,1)';                    /* drift-in (default) */
  }
  function skitOn() {
    if (!els.skit) return;
    var light = skitQ('[data-opt="light"] .dot'), dark = skitQ('[data-opt="dark"] .dot'),
        leafRow = skitQ('[data-opt="leaf"]'), leafDot = skitQ('[data-opt="leaf"] .dot'),
        cur = skitQ('.skit-cursor');
    if (light) light.classList.add('on');
    if (dark) dark.classList.remove('on');
    if (leafDot) leafDot.classList.remove('on');
    if (leafRow) leafRow.classList.remove('show');
    if (els.bloom) els.bloom.classList.remove('on');
    if (cur) { cur.style.transition = 'none'; cur.style.left = '84%'; cur.style.top = '86%'; }
    els.skit.classList.add('on');
    log('▸ skitOn');
  }
  function skitCursor(which, ms, easing) {
    var cur = skitQ('.skit-cursor'), row = skitQ('[data-opt="' + which + '"]');
    if (!cur || !row || !els.skit) { log('· skitCursor — missing cursor/opt ' + which); return; }
    ms = (typeof ms === 'number' && ms >= 0) ? ms : 600;
    var sb = els.skit.getBoundingClientRect(), rb = row.getBoundingClientRect();
    var x = (rb.left - sb.left) - 26, y = (rb.top - sb.top) + rb.height * 0.5 - 4;
    var e = easeFn(easing);
    cur.style.transition = 'left ' + ms + 'ms ' + e + ', top ' + ms + 'ms ' + e;
    cur.style.left = (x / sb.width * 100).toFixed(2) + '%';
    cur.style.top = (y / sb.height * 100).toFixed(2) + '%';
    log('▸ skitCursor → ' + which + ' (' + ms + 'ms)');
  }
  function skitTwitch() {
    var cur = skitQ('.skit-cursor');
    if (!cur) return;
    var top0 = cur.style.top, base = parseFloat(top0) || 0;
    cur.style.transition = 'top 120ms ease-out';
    cur.style.top = (base + 1.1).toFixed(2) + '%';   /* ≤ 12px flinch toward dark */
    setTimeout(function () { cur.style.transition = 'top 120ms ease-in'; cur.style.top = top0; }, 130);
    log('▸ skitTwitch');
  }
  function skitThird() {
    var leafRow = skitQ('[data-opt="leaf"]');
    if (leafRow) leafRow.classList.add('show');
    log('▸ skitThird — "build whatever you want; have fun"');
  }
  function skitPick() {
    var light = skitQ('[data-opt="light"] .dot'), leafDot = skitQ('[data-opt="leaf"] .dot');
    if (light) light.classList.remove('on');
    if (leafDot) leafDot.classList.add('on');
    log('▸ skitPick — the third button fills');
  }
  function bloomFlash() {
    if (!els.bloom || !els.skit) return;
    var leaf = skitQ('[data-opt="leaf"]');
    if (leaf) {
      var sb = els.skit.getBoundingClientRect(), rb = leaf.getBoundingClientRect();
      els.bloom.style.setProperty('--bx', ((rb.left + rb.width / 2 - sb.left) / sb.width * 100).toFixed(1) + '%');
      els.bloom.style.setProperty('--by', ((rb.top + rb.height / 2 - sb.top) / sb.height * 100).toFixed(1) + '%');
    }
    els.bloom.classList.remove('on');
    void els.bloom.offsetWidth;   /* restart the keyframe deterministically */
    els.bloom.classList.add('on');
    log('▸ bloomFlash — 250ms white-out → Scales');
  }
  function skitOff() { if (els.skit) els.skit.classList.remove('on'); log('▸ skitOff'); }

  /* ── native estate-page drives (ENGINE §6 + §10) ───────────────────────────
     The four hooked pages (colophon / coaster / aquarium / errand) expose
     __tourHooks verbs; every other exhibit drives through its real DOM (the
     ENGINE §6 verified selectors). frameDrive reaches into a PRELOADED frame —
     the ACTIVE one, or a NAMED one (for a pre-roll on a not-yet-flipped frame) —
     and performs ONE action:
       { click:'#sel' }              el.click()             (dropBtn · begin · lever · tFly · btnPlay · btnRain · runBtn · genreX)
       { tap:'#sel' }                pointerdown+pointerup  (pointerdown-gated overlays: aquarium #gate)
       { range:['#sel', 2.8] }       value + input/change   (rotor #omega)
       { key:'h' }                   keydown                (particle-life / mandelbrot panel-hide)
       { scroll:'#sel' }             scrollIntoView(center) (rotor #drumWrap · diary #board)
       { call:['a.b.fn', ...args] }  fn.apply(parent,args)  (turnPage · setMass · Gate.sequence.triggerOpen · __wsAudioCtx.resume)
       { hook:'name', args:[...] }   __tourHooks.name(...)   (aquariumHush on a not-yet-active frame)
     All frames share ONE localhost origin, so the frame document + globals are
     reachable. Every branch is try/caught: a missing target LOGS, never throws. */
  function driveWin(spec) {
    var key = spec && spec.frame;
    var el = key ? frameEls[key] : (state.activeKey && frameEls[state.activeKey]);
    try { return el && el.contentWindow; } catch (e) { return null; }
  }
  function resolvePath(win, path) {
    var parts = String(path).split('.'), obj = win, parent = win;
    for (var i = 0; i < parts.length; i++) {
      parent = obj;
      obj = obj && obj[parts[i]];
      if (obj == null) return null;
    }
    return { fn: obj, ctx: parent };
  }
  function frameDrive(spec) {
    spec = spec || {};
    var w = driveWin(spec);
    var tag = spec.frame ? ' @' + spec.frame : '';
    if (!w) { log('· drive — no target frame' + tag); return; }
    var doc = null; try { doc = w.document; } catch (e) { doc = null; }
    try {
      if (spec.scroll && doc) {
        var s = doc.querySelector(spec.scroll);
        if (s && s.scrollIntoView) s.scrollIntoView({ block: 'center' });
        log('▸ drive scroll ' + spec.scroll + (s ? '' : ' — absent') + tag); return;
      }
      if (spec.key) {
        try { w.dispatchEvent(new w.KeyboardEvent('keydown', { key: spec.key, bubbles: true })); } catch (e) {}
        if (doc && doc.body) { try { doc.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: spec.key, bubbles: true })); } catch (e) {} }
        log('▸ drive key ' + spec.key + tag); return;
      }
      if (spec.tap && doc) {
        var tp = doc.querySelector(spec.tap);
        if (tp) { tp.dispatchEvent(new w.Event('pointerdown', { bubbles: true })); tp.dispatchEvent(new w.Event('pointerup', { bubbles: true })); }
        log('▸ drive tap ' + spec.tap + (tp ? '' : ' — absent') + tag); return;
      }
      if (spec.range && doc) {
        var r = doc.querySelector(spec.range[0]);
        if (r) { r.value = spec.range[1]; r.dispatchEvent(new w.Event('input', { bubbles: true })); r.dispatchEvent(new w.Event('change', { bubbles: true })); }
        log('▸ drive range ' + spec.range[0] + '=' + spec.range[1] + (r ? '' : ' — absent') + tag); return;
      }
      if (spec.click && doc) {
        var c = doc.querySelector(spec.click);
        if (c && c.click) c.click();
        log('▸ drive click ' + spec.click + (c ? '' : ' — absent') + tag); return;
      }
      if (spec.hook) {
        var hk = null; try { hk = w.__tourHooks; } catch (e) { hk = null; }
        if (hk && typeof hk[spec.hook] === 'function') { hk[spec.hook].apply(null, spec.args || []); log('▸ drive hook ' + spec.hook + '()' + tag); }
        else log('· drive hook ' + spec.hook + ' — absent' + tag);
        return;
      }
      if (spec.call) {
        var rp = resolvePath(w, spec.call[0]);
        if (rp && typeof rp.fn === 'function') { rp.fn.apply(rp.ctx, spec.call.slice(1)); log('▸ drive call ' + spec.call[0] + '()' + tag); }
        else log('· drive call ' + spec.call[0] + ' — not a fn' + tag);
        return;
      }
      log('· drive — empty spec' + tag);
    } catch (e) { log('✗ drive threw' + tag + ': ' + e.message); }
  }

  /* Generic wrapper-transform (ENGINE §2 F14): a CSS translate/scale on a frame
     ELEMENT over N ms — the arcade 2.5 s pan and the Gate "manor grows" push-in
     (~1.06→1.12). setFrame clears the inline transform when the frame flips out. */
  function stageTransform(spec) {
    spec = spec || {};
    var key = spec.frame || state.activeKey, el = frameEls[key];
    if (!el) { log('· stageTransform — no frame ' + key); return; }
    var from = spec.from || 'scale(1)', to = spec.to || 'scale(1)',
        ms = (typeof spec.ms === 'number' && spec.ms > 0) ? spec.ms : 2500;
    el.style.transformOrigin = 'center center';
    el.style.willChange = 'transform';
    el.style.transition = 'none';
    el.style.transform = from;
    void el.offsetWidth;                 /* commit `from` before the eased leg */
    el.style.transition = 'transform ' + ms + 'ms ease';
    el.style.transform = to;
    log('▸ stageTransform ' + key + ' ' + ms + 'ms');
  }

  /* The Scales collar sweep (ENGINE §6): an rAF ramp of the frame's global
     setMass(M) from `from`→`to` over `ms`, kept BELOW Chandrasekhar (1.44) so no
     fate flips early — the legible collar sweep. The crossAt cue then makes ONE
     setMass(1.5) call to trip the implode; its shock (implode-tween u>0.55 ≈
     660 ms) lands on the bed DROP. */
  function scalesRamp(spec) {
    spec = spec || {};
    var myId = ++state.scalesRampId; /* SP-B 10: a token so a later scalesCollapse cancels THIS ramp */
    var key = spec.frame || state.activeKey, el = frameEls[key];
    var w = null; try { w = el && el.contentWindow; } catch (e) { w = null; }
    if (!w || typeof w.setMass !== 'function') { log('· scalesRamp — no setMass on ' + key); return; }
    var from = (typeof spec.from === 'number') ? spec.from : 0.9,
        to = (typeof spec.to === 'number') ? spec.to : 1.43,
        ms = (typeof spec.ms === 'number' && spec.ms > 0) ? spec.ms : 1400;
    var t0 = null;
    function step(ts) {
      /* bail if scalesCollapse (or a newer ramp) superseded us — otherwise this
         ramp's final setMass(1.43) could land AFTER the crossAt setMass(1.5) and
         re-inflate the star back below Chandrasekhar, killing the DROP payoff. */
      if (myId !== state.scalesRampId) return;
      if (t0 == null) t0 = ts;
      var u = Math.min(1, (ts - t0) / ms);
      try { w.setMass(from + (to - from) * u); } catch (e) {}
      if (u < 1 && state.playing && !state.ended) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    log('▸ scalesRamp ' + from + '→' + to + ' ' + ms + 'ms on ' + key);
  }

  /* The crossAt collapse (ENGINE §6; SP-B item 10) — trip the implode CLEANLY.
     First CANCEL any collar ramp still stepping (bump the token) so no late ramp
     frame can re-lower the mass under the Chandrasekhar limit; THEN one setMass
     across it (default 1.5 > 1.44 → classify → neutron-star → implode tween whose
     shock lands on the bed DROP). Replaces the fragile frameDrive{call:setMass}
     that raced the ramp's tail. */
  function scalesCollapse(spec) {
    spec = spec || {};
    state.scalesRampId++; /* invalidate any running collar ramp — no more setMass from it */
    var key = spec.frame || state.activeKey, el = frameEls[key];
    var w = null; try { w = el && el.contentWindow; } catch (e) { w = null; }
    var m = (typeof spec.mass === 'number') ? spec.mass : 1.5;
    if (!w || typeof w.setMass !== 'function') { log('· scalesCollapse — no setMass on ' + key); return; }
    try { w.setMass(m); log('▸ scalesCollapse setMass(' + m + ') → cross Chandrasekhar on ' + key); }
    catch (e) { log('✗ scalesCollapse threw: ' + e.message); }
  }

  /* Prime a frame's opacity transition for the NEXT flip (one of the two ENGINE
     §2 F15 fade exceptions — the first cold-plate fade-in ~0.8 s). setFrame
     clears the inline transition on flip-out, so the longer fade applies once. */
  function primeFade(key, ms) {
    var el = frameEls[key];
    if (!el) { log('· primeFade — no frame ' + key); return; }
    ms = (typeof ms === 'number' && ms > 0) ? ms : 800;
    el.style.transition = 'opacity ' + ms + 'ms ease';
    log('▸ primeFade ' + key + ' ' + ms + 'ms');
  }

  /* ── cue routing (try/catch per cue — a failed poke logs, never throws) ─────
     deck.* verbs run parent-side (segment transport, stage overlays, cold-open
     zoom, the skit); everything else is a __tourHooks verb on the active frame. */
  var DECK_HOOKS = {
    playSeg: playSeg,
    stopSeg: stopSeg,
    setFrame: setFrame,
    setCard: setCard,
    card: setCard,
    colophonZoom: colophonZoom,
    colophonZoomOut: colophonZoomOut,
    colophonFade: colophonFade,
    skitOn: skitOn,
    skitCursor: skitCursor,
    skitTwitch: skitTwitch,
    skitThird: skitThird,
    skitPick: skitPick,
    bloomFlash: bloomFlash,
    skitOff: skitOff,
    frameDrive: frameDrive,
    drive: frameDrive,
    stageTransform: stageTransform,
    scalesRamp: scalesRamp,
    scalesCollapse: scalesCollapse,
    primeFade: primeFade
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
      driveColdOpen();   /* SP-B T6.1: scrub the colophon weave off the master clock */
    }

    lightCaption();
    paintBand();
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
    /* SP-B item 6: pause() paused the active VO <audio> too; play() must RESUME it
       or the film runs on (screens/karaoke/music) with the voice gone for good.
       Both bed + VO were frozen at the same instant, so a plain resume keeps them
       in lock-step (the drift nudge already fired). Skip an ended/finished seg. */
    var seg = state.activeSeg, a = seg && segEls[seg.id];
    if (a && a.src && a.paused && !a.ended && !muted()) {
      try { var pv = a.play(); if (pv && pv.catch) pv.catch(function () {}); } catch (e) {}
    }
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
  /* SP-B item 5: durable overlays are reconstructed by REPLAYING every state cue
     ≤ t (deriveSeek). But an overlay set at an EARLIER clock position has no cue
     in the replay list when you scrub BACK before it, so it used to hang on
     screen. Reset every durable overlay to baseline FIRST, then replay rebuilds
     exactly the ones that should be showing at t. (skitOn/setCard are idempotent
     and self-resetting, so a replay after this is clean.) */
  function resetOverlays() {
    setCard(null);
    skitOff();
    if (els.bloom) els.bloom.classList.remove('on');
    var cf = coloFrame();
    if (cf) {
      cf.style.transform = ''; cf.style.transformOrigin = '';
      cf.style.opacity = ''; cf.style.transition = ''; cf.style.willChange = '';
    }
  }
  function seekTo(ms) {
    var dur = durationMs();
    state.clockMs = Math.max(0, Math.min(dur, ms));
    var tSec = state.clockMs / 1000;
    /* stop any VO still sounding from the pre-seek position (audio hygiene) */
    for (var sid in segEls) { if (segEls[sid]) { try { segEls[sid].pause(); } catch (e) {} } }
    var seek = CE.deriveSeek(CHAPTER, tSec, state.activeKey);
    if (seek.frame != null) setFrame(seek.frame);
    resetOverlays();                        /* clear stale overlays before the replay rebuilds them */
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
      bloom: $('bloom'),
      rmbanner: $('rmbanner'), cuelog: $('cuelog'), heldblack: $('heldblack'),
      startgate: $('startgate'), startbtn: $('start-btn'), segbank: $('segbank'),
      authoring: $('authoring'), play: $('btn-play'), scrub: $('scrub'),
      clock: $('clock'), dur: $('dur'), logbtn: $('btn-log')
    };
    bed = $('bed');
    /* the bed mp3 is 180 s but the film runs to ~186.9 s (the Gate finale); when
       the bed `ended`s, flag it so the clock switches cleanly to the synthetic
       performance.now() continuation (ENGINE §1/§8) that carries the held black. */
    if (bed) bed.addEventListener('ended', function () { state.bedEnded = true; });

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
    primeColdOpen();
    startClock();
    play();
  }

  /* AUTHORING-ONLY cold-open primer (SP-B items 1/2/3, T6.1): weave-and-hold the
     colophon at COLO_START_MS (the paragraph before "I am Claude") via colophonHold
     — which mutes the page's own narration (the rendered S0 segment is the voice)
     and reaches state="play" SYNCHRONOUSLY (no dependence on the colophon mp3's own
     playback/load, whose race was Brandon's "static, dead colophon" + no-voice
     pause). The reveal is then driven deterministically by driveColdOpen() scrubbing
     colophonSeek() off the master clock. The RECORD-mode reach-in — real-gesture
     unlock, #voice shield, silent count-in, Gate unlock+suspend — is T6.2's contract
     and is deliberately NOT built here (this no-ops in ?record). */
  function primeColdOpen() {
    if (RECORD) return;
    if (state.activeKey !== COLO_KEY) return;
    var h = coloHooks();
    try {
      if (h && typeof h.colophonHold === 'function') h.colophonHold(COLO_START_MS);
      if (h && typeof h.colophonSeek === 'function') h.colophonSeek(COLO_START_MS);
    } catch (e) {}
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
    deck: DECK_HOOKS,                                   /* poke verbs directly in a spot-check */
    cardId: function () { return curCard; },
    coloZoom: function () { return state.coloZoom || null; },
    bandHushed: function () { return !!(els.captions && els.captions.classList.contains('hush')); },
    skitOn: function () { return !!(els.skit && els.skit.classList.contains('on')); },
    injectSeg: function (id, seg) { if (segById[id]) { for (var k in seg) segById[id][k] = seg[k]; delete wordCache[id]; delete lineCache[id]; } },
    buildLines: function (id) { return buildLines(segById[id]); },
    preflight: function (win) { return rmCheck(win || window, 'preflight'); },
    bannerVisible: function () { return !!(els.rmbanner && !els.rmbanner.hidden); }
  };
})();
