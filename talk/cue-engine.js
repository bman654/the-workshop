/* ═══════════════════════════════════════════════════════════════════════════
   cue-engine.js — THE SHOWING's cue engine CORE (WS2 / DESIGN §10).

   The Showing (talk/showing.html) is ONE page that never navigates: chapter
   "stops" are framed in a same-origin iframe whose src the cue sheet sets, and
   the master clock is the current chapter's `audio.currentTime`. This file is
   the pure, DOM-free HEART of that deck — the seek re-derivation, the scrub
   debounce, and the reload-recovery hash mirror. The deck shell (T4.2), the
   chapters (T4.3+), and every DOM/audio wire live elsewhere; this module is the
   testable core, separable from the DOM (DESIGN §10, "Engine as a testable
   module").

   ── The model ────────────────────────────────────────────────────────────────
   CHAPTERS = [{ id, title, audio, timing, opening:{frame},
                 cues:[{ t, frame|state|impulse|spot|note }] }]
   Every cue carries a time `t` (seconds, on the chapter's audio clock) and
   EXACTLY ONE payload key naming its kind:
     • frame   — set the iframe src (KEYFRAME: only the latest ≤ t matters).
     • state   — an idempotent __tourHooks poke that drives a page to a DURABLE
                 state ("crank to k", "select door 2"). REPLAYED on any seek.
     • impulse — a one-shot animated poke ("fire one volley"). FORWARD-FIRE ONLY.
     • spot    — an ephemeral spotlight/highlight. Forward-fire only (not durable).
     • note    — operator-strip cue-log text; no page effect. Forward-fire only.

   ── Why two classes make seeking honest (DESIGN §10) ─────────────────────────
   On ANY seek the engine re-derives, it does NOT fire-and-forget:
     frame  = opening.frame overridden by the latest `frame` cue with t ≤ target
              (re-loaded ONLY if it differs from what's shown — debounced);
     state  = EVERY `state` cue with t ≤ target, replayed IN ORDER (durable state
              reconstructed, so a backward scrub across a frame change never
              narrates over a page that "never fired");
     impulse/spot/note = NOT replayed (forward-fire-only). They fire only as the
              clock naturally crosses them during real playback (`cuesInRange`).
   So `deriveSeek` answers "where should the deck BE at time t"; `cuesInRange`
   answers "what fires as we PLAY across (from, to]".

   ── Scrub debounce (DESIGN §10) ──────────────────────────────────────────────
   Heavy framed pages re-decode inlined assets on every load, so iframe.src
   re-sets are debounced to scrub-RELEASE: a drag across three frame boundaries
   reloads once (the final frame), not three. `createScrubDebounce()` is that
   pure collapser; it also dedupes against the currently-loaded frame (a drag
   that returns home reloads zero times).

   ── Reload recovery (DESIGN §10) ─────────────────────────────────────────────
   The deck mirrors {chapter, offsetMs} into location.hash on a COARSE tick; a
   mid-talk Cmd-R costs one unlock click, not the deck. `encodeHash`/`parseHash`
   are the round-tripping codec; `shouldMirror` is the coarse-tick throttle
   (the clock is passed IN — no Date.* in here).

   ── Dual-use module (the tour.js/ws.js idiom) ────────────────────────────────
   In a browser this attaches `window.CueEngine`; under Node it exports the same
   pure surface so the twin (cue-engine.test.mjs) can drive every decision with
   no DOM. forge strips the trailing `module.exports` guard on inline. Comments
   inside this forge-included block use the BLOCK form ONLY, never a multi-line
   `<!-- -->` (the forge landmine that silently kills the script).

   Vanilla, ES5-ish, zero-dependency. NO Math.random / Date.* anywhere — the
   whole engine is a pure function of (chapters, target time) (DESIGN §10/§0
   determinism); every clock value is supplied by the caller.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* The cue payload keys, in the fixed precedence used to name a cue's kind.
     A well-formed cue carries exactly one of these (lint enforces it). */
  var KIND_KEYS = ['frame', 'state', 'impulse', 'spot', 'note'];

  /* Kinds whose durable effect is REPLAYED on a seek (reconstructed from t=0).
     Only `state` — the idempotent-hook class (DESIGN §10). */
  var REPLAY_KINDS = { state: true };

  /* ── cue introspection ─────────────────────────────────────────────────────
     Which single kind does this cue carry? Returns the key name, or null if the
     cue names zero or more-than-one payload key (malformed — lint reports it). */
  function cueKind(cue) {
    if (!cue || typeof cue !== 'object') return null;
    var found = null;
    for (var i = 0; i < KIND_KEYS.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cue, KIND_KEYS[i])) {
        if (found) return null; /* more than one payload key → malformed */
        found = KIND_KEYS[i];
      }
    }
    return found;
  }

  /* A NEW array of a chapter's cues, STABLY sorted by ascending t (ties keep
     authoring order). Never mutates the caller's array; deterministic across
     engines (decorate-sort-undecorate, not a bare Array.sort). */
  function sortedCues(chapter) {
    var cues = (chapter && chapter.cues) || [];
    var deco = [];
    for (var i = 0; i < cues.length; i++) deco.push([cues[i], i]);
    deco.sort(function (a, b) {
      var ta = +a[0].t, tb = +b[0].t;
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return a[1] - b[1]; /* stable on ties */
    });
    var out = [];
    for (var j = 0; j < deco.length; j++) out.push(deco[j][0]);
    return out;
  }

  /* ── frame derivation ──────────────────────────────────────────────────────
     The frame that should be SHOWING at time t: the chapter's opening frame,
     overridden by the latest `frame` cue with t ≤ target. null if the chapter
     has neither. Keyframe semantics — only the last frame cue ≤ t matters. */
  function frameAt(chapter, t) {
    var frame = (chapter && chapter.opening && chapter.opening.frame != null)
      ? chapter.opening.frame : null;
    var cues = sortedCues(chapter);
    for (var i = 0; i < cues.length; i++) {
      var c = cues[i];
      if (+c.t > t) break; /* cues are sorted; nothing further is ≤ t */
      if (cueKind(c) === 'frame') frame = c.frame;
    }
    return frame;
  }

  /* Every `state` cue with t ≤ target, in ascending-t order — the ordered
     replay list that reconstructs durable page state on a seek. */
  function stateCuesUpTo(chapter, t) {
    var cues = sortedCues(chapter), out = [];
    for (var i = 0; i < cues.length; i++) {
      var c = cues[i];
      if (+c.t > t) break;
      if (REPLAY_KINDS[cueKind(c)]) out.push(c);
    }
    return out;
  }

  /* ── the seek re-derivation (the heart, DESIGN §10) ────────────────────────
     Given a chapter, a target time, and the frame CURRENTLY shown, answer where
     the deck should BE at `t`:
        { t, frame, frameChanged, stateReplay:[cue…] }
     `frameChanged` is true only when the derived frame differs from `currentFrame`
     (the caller reloads the iframe only then — the debounce collapses further).
     `stateReplay` is every state cue ≤ t, in order, to re-poke after the frame is
     ready. Impulse/spot/note cues are deliberately absent: forward-fire-only. */
  function deriveSeek(chapter, t, currentFrame) {
    var frame = frameAt(chapter, t);
    return {
      t: t,
      frame: frame,
      frameChanged: frame !== currentFrame,
      stateReplay: stateCuesUpTo(chapter, t)
    };
  }

  /* ── forward playback ──────────────────────────────────────────────────────
     The cues to FIRE as the clock advances across (tFrom, tTo], in ascending-t
     order — ALL kinds (the DOM layer routes each by kind). Half-open on the low
     end so a cue already fired at tFrom is not re-fired next tick; inclusive on
     the high end so a cue landing exactly on the new time fires now. To include
     a cue at t=0 on the first advance, pass tFrom < 0 (e.g. -Infinity). */
  function cuesInRange(chapter, tFrom, tTo) {
    var cues = sortedCues(chapter), out = [];
    for (var i = 0; i < cues.length; i++) {
      var ct = +cues[i].t;
      if (ct > tFrom && ct <= tTo) out.push(cues[i]);
    }
    return out;
  }

  /* ── scrub debounce (DESIGN §10) ───────────────────────────────────────────
     Collapses a scrub's intermediate frame proposals into ONE reload at release,
     and dedupes against the loaded frame (return-to-home reloads zero times).
       sync(frame)   record the currently-loaded frame WITHOUT emitting (init /
                     after a real iframe load settles).
       begin()       enter scrubbing — subsequent proposals are deferred.
       propose(f)    when scrubbing: stash f, return null (deferred). Otherwise:
                     return f to load now, or null if f already loaded.
       release()     leave scrubbing — return the final proposed frame to load
                     ONCE (null if none proposed, or the final equals the loaded
                     frame). A drag across N boundaries → at most one non-null.
       scrubbing()/current()  introspection. */
  function createScrubDebounce() {
    var scrubbing = false, pending = null, havePending = false, loaded = null;
    return {
      sync: function (frame) { loaded = frame; },
      begin: function () { scrubbing = true; havePending = false; pending = null; },
      propose: function (frame) {
        if (scrubbing) { pending = frame; havePending = true; return null; }
        if (frame === loaded) return null;
        loaded = frame; return frame;
      },
      release: function () {
        scrubbing = false;
        if (!havePending) return null;
        havePending = false;
        var f = pending; pending = null;
        if (f === loaded) return null;
        loaded = f; return f;
      },
      scrubbing: function () { return scrubbing; },
      current: function () { return loaded; }
    };
  }

  /* ── reload-recovery hash mirror (DESIGN §10) ──────────────────────────────
     {chapter, offsetMs} ⇆ a `location.hash` string, round-trip clean.
     Format:  #ch=<encoded chapter id>&t=<integer ms ≥ 0>
     encodeHash returns '' when there is no chapter to mirror (nothing to write). */
  function encodeHash(state) {
    if (!state || state.chapter == null || state.chapter === '') return '';
    var ms = Math.floor(+state.offsetMs);
    if (!isFinite(ms) || ms < 0) ms = 0;
    return '#ch=' + encodeURIComponent(String(state.chapter)) + '&t=' + ms;
  }

  /* Parse a `location.hash` string back to {chapter, offsetMs} (offsetMs a
     non-negative integer). Returns null for an empty/malformed hash (no chapter,
     or a non-numeric time) so the caller can fall through to a fresh start. */
  function parseHash(hash) {
    if (hash == null) return null;
    var s = String(hash);
    if (s.charAt(0) === '#') s = s.slice(1);
    if (!s) return null;
    var parts = s.split('&'), chapter = null, tRaw = null;
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      if (kv[0] === 'ch') chapter = kv.length > 1 ? decodeURIComponent(kv.slice(1).join('=')) : '';
      else if (kv[0] === 't') tRaw = kv.length > 1 ? kv[1] : '';
    }
    if (chapter == null || chapter === '') return null;
    if (tRaw == null || tRaw === '' || !/^\d+$/.test(tRaw)) return null;
    return { chapter: chapter, offsetMs: parseInt(tRaw, 10) };
  }

  /* Coarse-tick throttle for the hash mirror: should we re-write the hash now?
     The clock is passed IN (no Date.* here). True on the first write (lastMs
     null) or once at least coarseMs has elapsed. */
  function shouldMirror(lastMs, nowMs, coarseMs) {
    if (lastMs == null) return true;
    return (nowMs - lastMs) >= coarseMs;
  }

  /* ── chapter lint (cheap correctness net for the deck + rehearsal gate) ─────
     Returns an array of human-readable problems (empty = clean). Catches the
     mistakes that would silently misbehave: a missing id/opening frame, a cue
     with a non-finite t or not exactly one payload key, and an ABSOLUTE frame
     src (the deck frames only `../<page>` relatives — DESIGN §10; absolutes
     break on Pages vs localhost and the rehearsal gate rejects them). */
  function lintChapter(chapter) {
    var problems = [];
    if (!chapter || typeof chapter !== 'object') { return ['chapter is not an object']; }
    var id = chapter.id || '(no id)';
    if (chapter.id == null || chapter.id === '') problems.push('chapter has no id');
    if (!chapter.opening || chapter.opening.frame == null || chapter.opening.frame === '')
      problems.push(id + ': missing opening.frame');
    else if (isAbsoluteFrame(chapter.opening.frame))
      problems.push(id + ': opening.frame is absolute ("' + chapter.opening.frame + '") — use ../<page>');
    var cues = (chapter.cues) || [];
    for (var i = 0; i < cues.length; i++) {
      var c = cues[i], where = id + ' cue[' + i + ']';
      if (!c || typeof c !== 'object') { problems.push(where + ': not an object'); continue; }
      if (typeof c.t !== 'number' || !isFinite(c.t)) problems.push(where + ': t is not a finite number');
      var kind = cueKind(c);
      if (!kind) problems.push(where + ': must carry exactly one of ' + KIND_KEYS.join('/'));
      else if (kind === 'frame' && isAbsoluteFrame(c.frame))
        problems.push(where + ': frame is absolute ("' + c.frame + '") — use ../<page>');
    }
    return problems;
  }

  /* A frame src is "absolute" (deck-illegal) if it is protocol-relative, a
     scheme URL, or root-anchored. Relatives like ../index.html?hours=allon pass. */
  function isAbsoluteFrame(src) {
    if (typeof src !== 'string') return false;
    return src.charAt(0) === '/' || /^[a-z][a-z0-9+.-]*:/i.test(src);
  }

  /* Lint a whole CHAPTERS array: flat list of problems, prefixed by index for
     any chapter that has no id. Also flags duplicate chapter ids (the hash
     mirror keys on id). */
  function lintChapters(chapters) {
    var problems = [], seen = {};
    if (!Array.isArray(chapters)) return ['CHAPTERS is not an array'];
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i];
      var sub = lintChapter(ch);
      for (var j = 0; j < sub.length; j++) problems.push('[' + i + '] ' + sub[j]);
      var cid = ch && ch.id;
      if (cid != null && cid !== '') {
        if (seen[cid]) problems.push('[' + i + '] duplicate chapter id "' + cid + '"');
        seen[cid] = true;
      }
    }
    return problems;
  }

  var API = {
    KIND_KEYS: KIND_KEYS,
    cueKind: cueKind,
    sortedCues: sortedCues,
    frameAt: frameAt,
    stateCuesUpTo: stateCuesUpTo,
    deriveSeek: deriveSeek,
    cuesInRange: cuesInRange,
    createScrubDebounce: createScrubDebounce,
    encodeHash: encodeHash,
    parseHash: parseHash,
    shouldMirror: shouldMirror,
    isAbsoluteFrame: isAbsoluteFrame,
    lintChapter: lintChapter,
    lintChapters: lintChapters
  };

  /* ── attach (browser) ──────────────────────────────────────────────────────
     No auto-boot: this is a pure library the deck shell (T4.2) drives. */
  if (root) root.CueEngine = API;

  /* dual-use module guard (forge strips exactly this braced single line) */
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
