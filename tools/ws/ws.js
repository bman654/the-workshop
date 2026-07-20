/* ═══════════════════════════════════════════════════════════════════════════
   ws.js — the Workshop's shared `ws:` unlock module (the one source of truth).

   The workshop has a hidden growth axis: pieces drop trivial localStorage
   breadcrumbs (`ws:seen:*`, `ws:best:*`, `ws:dwell:*`, `ws:flag:*`), and the
   Undercroft reads them to decide what's unlocked. See /UNLOCK.md.

   This file used to be a copy-paste micro-convention pasted into every page.
   It is now ONE module, inlined into pages VIA forge (`<!-- forge:include
   ../tools/ws/ws.js -->`) so shipped files stay self-contained but the source
   lives in exactly one place. forge strips the module guard at the bottom; in a
   browser this attaches a `WS` global and auto-fires the unlock cue.

   Vanilla, ES5-ish, zero-dependency. Every storage touch is wrapped — storage
   off (private mode / disabled) is always harmless. Secrets are bonuses, never
   blockers.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var WS = {};

  /* ── storage helpers (all swallow throws — storage may be blocked) ────────── */
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }
  function lsRemove(k) {
    try { localStorage.removeItem(k); } catch (e) { /* nothing to forget */ }
  }

  /* ── Shared estate-wide MUTE (the single key ws:pref:muted) ─────────────────
     House convention (DESIGNING.md): any page that makes sound reads/writes ONE
     shared key, so a visitor mutes once and it holds everywhere — and a mute
     toggled on another estate tab takes effect live. A page's audio gates on
     WS.muted(); a control writes via WS.setMuted(); WS.onMuteChange(fn) fires on
     any change (this tab OR another). */
  var MUTE_KEY = 'ws:pref:muted';
  var muteSubs = [];
  WS.muted = function () { return lsGet(MUTE_KEY) === '1'; };
  WS.setMuted = function (v) {
    var on = !!v;
    lsSet(MUTE_KEY, on ? '1' : '0');
    for (var i = 0; i < muteSubs.length; i++) {
      try { muteSubs[i](on); } catch (e) {}
    }
    return on;
  };
  WS.onMuteChange = function (fn) {
    if (typeof fn === 'function') muteSubs.push(fn);
  };
  // cross-tab: a mute set on ANOTHER estate tab fires our subscribers live.
  if (root && root.addEventListener) {
    root.addEventListener('storage', function (e) {
      if (!e || e.key !== MUTE_KEY) return;
      var on = WS.muted();
      for (var i = 0; i < muteSubs.length; i++) {
        try { muteSubs[i](on); } catch (e2) {}
      }
    });
  }

  /* ── Shared BACKGROUND-AIR courtesy waiver (the single key ws:pref:air-bg) ──
     Same house convention (DESIGNING.md): ONE shared key, set once, held
     everywhere. A hidden tab stills the estate's air by default, because an
     estate that follows you into another window is rude. This is the visitor
     waiving that courtesy on purpose — "keep humming while I work elsewhere" —
     so it is OPT-IN, and absent means the courtesy stands.

     The cross-tab listener is load-bearing, not boilerplate: the whole use for
     this preference is several estate tabs open at once, so flipping it in one
     must take effect live in the rest, exactly as the mute already does. */
  var AIRBG_KEY = 'ws:pref:air-bg';
  var airBgSubs = [];
  WS.airBackground = function () { return lsGet(AIRBG_KEY) === '1'; };
  WS.setAirBackground = function (v) {
    var on = !!v;
    lsSet(AIRBG_KEY, on ? '1' : '0');
    for (var i = 0; i < airBgSubs.length; i++) {
      try { airBgSubs[i](on); } catch (e) {}
    }
    return on;
  };
  WS.onAirBackgroundChange = function (fn) {
    if (typeof fn === 'function') airBgSubs.push(fn);
  };
  // cross-tab: the waiver set on ANOTHER estate tab fires our subscribers live.
  if (root && root.addEventListener) {
    root.addEventListener('storage', function (e) {
      if (!e || e.key !== AIRBG_KEY) return;
      var on = WS.airBackground();
      for (var i = 0; i < airBgSubs.length; i++) {
        try { airBgSubs[i](on); } catch (e2) {}
      }
    });
  }

  /* ── Writers ──────────────────────────────────────────────────────────────
     All wrapped so storage-off is harmless. */

  /* WS.seen(id): set ws:seen:<id>=now if absent. Returns true iff newly set. */
  WS.seen = function (id) {
    var k = 'ws:seen:' + id;
    if (lsGet(k) != null) return false;
    return lsSet(k, String(Date.now()));
  };

  /* WS.best(game, val): raise ws:best:<game> only if val > current. */
  WS.best = function (game, val) {
    var k = 'ws:best:' + game;
    var prev = +(lsGet(k) || 0);
    if (val > prev) lsSet(k, String(val));
  };

  /* WS.flag(ev): set ws:flag:<ev>='1'. */
  WS.flag = function (ev) {
    lsSet('ws:flag:' + ev, '1');
  };

  /* WS.dwellAdd(id, ms): add ms to ws:dwell:<id>, then re-sum ALL ws:dwell:*
     and set ws:flag:patience once the summed total crosses `thresh` (default
     150000 ms ≈ 2.5 min). Returns the new summed total. */
  WS.dwellAdd = function (id, ms, thresh, patienceFlag) {
    if (thresh == null) thresh = 150000;
    if (patienceFlag == null) patienceFlag = 'patience';
    var k = 'ws:dwell:' + id;
    lsSet(k, String((+lsGet(k) || 0) + ms));
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var kk = localStorage.key(i);
        if (kk && kk.indexOf('ws:dwell:') === 0) total += (+lsGet(kk) || 0);
      }
    } catch (e) { return 0; }
    if (total >= thresh && lsGet('ws:flag:' + patienceFlag) == null) {
      WS.flag(patienceFlag);
    }
    return total;
  };

  /* WS.startDwell(id, opts): start a dwell accumulator that ticks only while the
     tab is visible. opts.tick (ms/tick, default 5000), opts.thresh (summed ms to
     set the patience flag, default 150000), opts.patienceFlag (flag name, default
     'patience'). Returns the interval id (clearInterval to stop). No-op outside a
     browser. */
  WS.startDwell = function (id, opts) {
    opts = opts || {};
    var tick = opts.tick != null ? opts.tick : 5000;
    var thresh = opts.thresh != null ? opts.thresh : 150000;
    var patienceFlag = opts.patienceFlag != null ? opts.patienceFlag : 'patience';
    if (!root || !root.document) return null;
    return setInterval(function () {
      if (root.document.hidden) return;
      WS.dwellAdd(id, tick, thresh, patienceFlag);
    }, tick);
  };

  /* ── Reader ───────────────────────────────────────────────────────────────
     WS.store(): snapshot of every ws: key. Same shape as the Undercroft's old
     makeStore — the predicates below run verbatim against it. */
  WS.store = function () {
    var ok = true, map = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('ws:') === 0) map[k] = localStorage.getItem(k);
      }
    } catch (e) { ok = false; }
    return {
      ok: ok,
      has: function (k) { return k in map; },
      get: function (k) { return map[k]; },
      all: map
    };
  };

  /* ── Predicate table ──────────────────────────────────────────────────────
     id + predicate ONLY. Secret names / blurbs / riddles stay in the Undercroft
     so secret prose never leaks into public page source. The store arg is `s`. */
  WS.SECRETS = [
    { id: 'quickening',     unlocked: function (s) { return s.has('ws:seen:game-of-life') && s.has('ws:seen:lattice'); } },
    { id: 'the-long-quiet', unlocked: function (s) { return s.has('ws:flag:patience'); } },
    { id: 'eleven',         unlocked: function (s) { return s.has('ws:flag:eleven'); } },
    { id: 'the-survivor',   unlocked: function (s) { return (+s.get('ws:best:swarm') || 0) >= 5; } },
    { id: 'rosette',        unlocked: function (s) {
        return s.has('ws:seen:game-of-life') && s.has('ws:seen:lattice')
            && s.has('ws:flag:patience') && s.has('ws:flag:eleven')
            && (+s.get('ws:best:swarm') || 0) >= 8;
      } },
    { id: 'codex',          unlocked: function (s) { return s.has('ws:seen:verse') && s.has('ws:seen:scriptorium'); } },
    { id: 'floating-ink',   unlocked: function (s) { return s.has('ws:seen:cartographer') && s.has('ws:seen:scriptorium'); } },
    { id: 'almanac',        unlocked: function (s) { return s.has('ws:seen:verse') && s.has('ws:seen:orrery'); } },
    { id: 'enigma',         unlocked: function (s) { return s.has('ws:seen:scriptorium') && s.has('ws:seen:slipstick'); } },
    { id: 'reckoner',       unlocked: function (s) { return s.has('ws:seen:slipstick') && s.has('ws:seen:astrolabe') && s.has('ws:seen:abacus'); } },
    { id: 'night-shift',    unlocked: function (s) { return s.has('ws:flag:the-lamplighter-won') && s.has('ws:flag:the-ferryman-won'); } },
    { id: 'light-mixer',    unlocked: function (s) {
        // earned by mastering every Feat of Light in the Hall of Mirrors (all 9)
        var f = ['rainbow','halo','spyglass','camera','spectroscope','polariser','anamorphosis','iridescence','maze'];
        for (var i = 0; i < f.length; i++) { if (!s.has('ws:flag:earned-' + f[i])) return false; }
        return true;
      } },

    /* reliquary (#399): read the Sealed Room's Diary to its end — the estate's
       found-diary mystery, solved across the Museum → Scytale → Card Catalog. An
       honest cross-link trophy: the Reliquary and the Undercroft share this ws
       engine. Predicate = the payoff key the Sealed Study sets on final solve. */
    { id: 'reliquary',      unlocked: function (s) { return s.has('ws:seen:reliquary-solved'); } },

    /* the-mere: the whole diary, read to its very last page — the memorial annex
       past the study's cold wall. The grand payoff of the Sealed Room's mystery,
       one clue and one chapter beyond the reliquary trophy above. Predicate = the
       grand key the annex sets on entry (guarded on the final chapter's witness). */
    { id: 'the-mere',       unlocked: function (s) { return s.has('ws:seen:the-mere'); } },

    /* ── The Constellation of Mastery (wave one) ────────────────────────────────
       A named group of secrets that reward what you CONQUERED, not merely what you
       wandered past. Each candle stands for a feat finished; the capstone lights
       only when all five are lit. Predicates are ids + fns ONLY — the names, badges,
       riddles, and prose live in undercroft/index.src.html (hidden-world content),
       so no secret prose leaks into a public trigger page. */

    /* m-keeper-of-tales: carried ALL THREE public Lantern tales to their ends.
       GATES the earned Keeper's Alcove (keeper.html). */
    { id: 'm-keeper-of-tales', unlocked: function (s) {
        return s.has('ws:flag:the-lamplighter-won')
            && s.has('ws:flag:the-ferryman-won')
            && s.has('ws:flag:the-clockmaker-won');
      } },

    /* m-clean-sweep: a flawless ("clean") solve of all FOUR puzzle benches. */
    { id: 'm-clean-sweep', unlocked: function (s) {
        return s.has('ws:flag:latch-clean')
            && s.has('ws:flag:slitherlink-clean')
            && s.has('ws:flag:akari-clean')
            && s.has('ws:flag:mirror-maze-clean');
      } },

    /* m-held-the-line: outlasted the Swarm to the tenth wave (reachable; sits
       between survivor>=5 and rosette>=8 with no clash). */
    { id: 'm-held-the-line', unlocked: function (s) {
        return (+s.get('ws:best:swarm') || 0) >= 10;
      } },

    /* m-half-the-light: mastered at least FIVE of the nine Feats of Light. */
    { id: 'm-half-the-light', unlocked: function (s) {
        var f = ['rainbow','halo','spyglass','camera','spectroscope','polariser','anamorphosis','iridescence','maze'];
        var n = 0;
        for (var i = 0; i < f.length; i++) { if (s.has('ws:flag:earned-' + f[i])) n++; }
        return n >= 5;
      } },

    /* m-eleven-and-still: pushed every dial to eleven AND kept the long quiet. */
    { id: 'm-eleven-and-still', unlocked: function (s) {
        return s.has('ws:flag:eleven') && s.has('ws:flag:patience');
      } },

    /* m-grandmaster (capstone): the constellation's own rosette — lights only when
       all five mastery feats above are satisfied. Re-evaluates the RAW predicates
       against `s` (does NOT recurse through WS.unlocked). */
    { id: 'm-grandmaster', unlocked: function (s) {
        // 1) m-keeper-of-tales
        if (!(s.has('ws:flag:the-lamplighter-won')
            && s.has('ws:flag:the-ferryman-won')
            && s.has('ws:flag:the-clockmaker-won'))) return false;
        // 2) m-clean-sweep
        if (!(s.has('ws:flag:latch-clean')
            && s.has('ws:flag:slitherlink-clean')
            && s.has('ws:flag:akari-clean')
            && s.has('ws:flag:mirror-maze-clean'))) return false;
        // 3) m-held-the-line
        if (!((+s.get('ws:best:swarm') || 0) >= 10)) return false;
        // 4) m-half-the-light
        var f = ['rainbow','halo','spyglass','camera','spectroscope','polariser','anamorphosis','iridescence','maze'];
        var n = 0;
        for (var i = 0; i < f.length; i++) { if (s.has('ws:flag:earned-' + f[i])) n++; }
        if (n < 5) return false;
        // 5) m-eleven-and-still
        if (!(s.has('ws:flag:eleven') && s.has('ws:flag:patience'))) return false;
        return true;
      } }
  ];

  /* lookup a secret row by id */
  function secretById(id) {
    for (var i = 0; i < WS.SECRETS.length; i++) {
      if (WS.SECRETS[i].id === id) return WS.SECRETS[i];
    }
    return null;
  }

  /* WS.unlocked(id, store): is secret <id> unlocked given a store? */
  WS.unlocked = function (id, store) {
    var m = secretById(id);
    return !!(m && store && store.ok && m.unlocked(store));
  };

  /* ── Cue machinery (`ws:ann:` announced-namespace) ────────────────────────── */

  /* WS.bootstrap(): on the FIRST EVER run on this origin (ws:ann:bootstrap absent),
     silently mark ws:ann:<id> for every CURRENTLY-satisfied secret, so a returning
     visitor who unlocked things before this feature existed gets NO cue spam. Then
     sets ws:ann:bootstrap. Idempotent. Must run before checkUnlocks. */
  WS.bootstrap = function () {
    if (lsGet('ws:ann:bootstrap') != null) return;
    var store = WS.store();
    if (store.ok) {
      for (var i = 0; i < WS.SECRETS.length; i++) {
        var sec = WS.SECRETS[i];
        if (sec.unlocked(store)) lsSet('ws:ann:' + sec.id, String(Date.now()));
      }
    }
    lsSet('ws:ann:bootstrap', String(Date.now()));
  };

  /* WS.checkUnlocks(opts): for every secret currently satisfied AND not yet
     announced (ws:ann:<id> absent), mark it announced and collect it. If any are
     fresh AND not opts.silent AND we're in a browser, renderCue(fresh, store).
     Returns the fresh id list. */
  WS.checkUnlocks = function (opts) {
    opts = opts || {};
    var store = WS.store();
    var fresh = [];
    if (store.ok) {
      for (var i = 0; i < WS.SECRETS.length; i++) {
        var sec = WS.SECRETS[i];
        if (!sec.unlocked(store)) continue;
        var ak = 'ws:ann:' + sec.id;
        if (lsGet(ak) != null) continue;
        lsSet(ak, String(Date.now()));
        fresh.push(sec.id);
      }
    }
    if (fresh.length && !opts.silent && root && root.document) {
      WS.renderCue(fresh, store);
    }
    return fresh;
  };

  /* WS.renderCue(ids, store): inject a tasteful candlelit toast. Spoiler-light &
     evocative — never names the secret. One toast even if several ids are fresh. */
  var CUE_STYLE_ID = 'wscue-style';
  WS.renderCue = function (ids, store) {
    if (!root || !root.document) return;
    var doc = root.document;
    var body = doc.body;
    if (!body) return;
    if (!store) store = WS.store();

    var reduce = false;
    try { reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    // once-only scoped stylesheet
    if (!doc.getElementById(CUE_STYLE_ID)) {
      var st = doc.createElement('style');
      st.id = CUE_STYLE_ID;
      st.textContent =
        '.wscue{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(18px);' +
        'z-index:2147483600;max-width:min(92vw,440px);box-sizing:border-box;' +
        'display:flex;align-items:flex-start;gap:13px;padding:16px 18px 16px 17px;' +
        'border-radius:14px;border:1px solid rgba(201,162,74,.34);' +
        'background:linear-gradient(180deg,rgba(19,20,28,.97),rgba(9,10,15,.98));' +
        'box-shadow:0 18px 54px -20px rgba(0,0,0,.85),0 0 64px -26px rgba(201,162,74,.6),' +
        'inset 0 1px 0 rgba(201,162,74,.10);' +
        'color:#e7e2d6;pointer-events:auto;opacity:0;' +
        'transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1);' +
        'font-family:Georgia,"Times New Roman",serif;}' +
        '.wscue.wscue-in{opacity:1;transform:translateX(-50%) translateY(0);}' +
        '.wscue .wscue-rune{flex:0 0 auto;font-size:21px;line-height:1.2;color:#c9a24a;' +
        'text-shadow:0 0 16px rgba(201,162,74,.65);animation:wscue-flicker 3.4s ease-in-out infinite;}' +
        '.wscue .wscue-body{flex:1 1 auto;min-width:0;}' +
        '.wscue .wscue-kick{display:block;font:600 9.5px/1 ui-monospace,Menlo,monospace;' +
        'letter-spacing:.26em;text-transform:uppercase;color:#c9a24a;opacity:.72;margin-bottom:6px;}' +
        '.wscue .wscue-text{display:block;font-size:14.5px;line-height:1.5;color:#e7e2d6;}' +
        '.wscue .wscue-x{flex:0 0 auto;margin:-4px -4px 0 2px;padding:4px 7px;cursor:pointer;' +
        'background:none;border:none;color:#8a8472;font:600 15px/1 ui-monospace,Menlo,monospace;' +
        'border-radius:8px;transition:color .25s,background .25s;}' +
        '.wscue .wscue-x:hover{color:#c9a24a;background:rgba(201,162,74,.08);}' +
        '.wscue .wscue-mute{flex:0 0 auto;margin:-4px 0 0 2px;padding:4px 6px;cursor:pointer;' +
        'background:none;border:none;color:#8a8472;font:600 14px/1 ui-monospace,Menlo,monospace;' +
        'border-radius:8px;transition:color .25s,background .25s;}' +
        '.wscue .wscue-mute:hover{color:#c9a24a;background:rgba(201,162,74,.08);}' +
        '@keyframes wscue-flicker{0%,100%{opacity:.92;}45%{opacity:.66;}70%{opacity:1;}}' +
        '@media (prefers-reduced-motion: reduce){' +
        '.wscue{transition:opacity .4s ease;transform:translateX(-50%) translateY(0);}' +
        '.wscue.wscue-in{transform:translateX(-50%) translateY(0);}' +
        '.wscue .wscue-rune{animation:none;}}';
      (doc.head || body).appendChild(st);
    }

    // evocative, spoiler-light copy — warmer if they've already found the cellar
    var found = store && store.has && store.has('ws:seen:undercroft');
    var text = found
      ? 'A way has opened beneath — the Undercroft keeps something new.'
      : 'Something stirs in the dark beneath the workshop.';

    var toast = doc.createElement('div');
    toast.className = 'wscue';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    var rune = doc.createElement('span');
    rune.className = 'wscue-rune';
    rune.textContent = '✦';

    var bodyWrap = doc.createElement('div');
    bodyWrap.className = 'wscue-body';
    var kick = doc.createElement('span');
    kick.className = 'wscue-kick';
    kick.textContent = 'beneath the workshop';
    var txt = doc.createElement('span');
    txt.className = 'wscue-text';
    txt.textContent = text;
    bodyWrap.appendChild(kick);
    bodyWrap.appendChild(txt);

    // estate-wide mute toggle — writes the shared key ws:pref:muted, so muting
    // here (the chime sounds from this toast) holds across every estate page.
    var mute = doc.createElement('button');
    mute.className = 'wscue-mute';
    function syncMuteBtn() {
      var m = WS.muted();
      mute.textContent = m ? '🔇' : '🔊';
      mute.setAttribute('aria-label', m ? 'unmute the estate' : 'mute the estate');
      mute.title = m ? 'Muted estate-wide — click to unmute' : 'Mute sound across the whole estate';
    }
    syncMuteBtn();
    mute.addEventListener('click', function () { WS.setMuted(!WS.muted()); syncMuteBtn(); });
    WS.onMuteChange(syncMuteBtn);

    var x = doc.createElement('button');
    x.className = 'wscue-x';
    x.setAttribute('aria-label', 'dismiss');
    x.textContent = '×';

    toast.appendChild(rune);
    toast.appendChild(bodyWrap);
    toast.appendChild(mute);
    toast.appendChild(x);
    body.appendChild(toast);

    var dismissed = false;
    var hideTimer = null;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      toast.classList.remove('wscue-in');
      var gone = function () { if (toast.parentNode) toast.parentNode.removeChild(toast); };
      if (reduce) setTimeout(gone, 420);
      else setTimeout(gone, 850);
    }
    x.addEventListener('click', dismiss);

    // reveal (next frame so the transition runs)
    if (reduce) {
      toast.classList.add('wscue-in');
    } else if (root.requestAnimationFrame) {
      root.requestAnimationFrame(function () {
        root.requestAnimationFrame(function () { toast.classList.add('wscue-in'); });
      });
    } else {
      setTimeout(function () { toast.classList.add('wscue-in'); }, 20);
    }

    // whisper-soft chime — ONLY if an AudioContext is ALREADY running. Never
    // create/resume one (respect the workshop's audio-courtesy rule). Honours the
    // estate-wide mute: if ws:pref:muted === '1', the chime stays silent (read at
    // fire-time, so a mute toggled on ANY estate tab takes effect immediately).
    try {
      var __wsMuted = false;
      try { __wsMuted = WS.muted(); } catch (e) {}
      var AC = root.__wsAudioCtx || root.audioCtx || null;
      if (!__wsMuted && AC && AC.state === 'running' && AC.createOscillator) {
        var now = AC.currentTime;
        var osc = AC.createOscillator();
        var g = AC.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1244.5; // a high, soft D#6
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.04, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        osc.connect(g); g.connect(AC.destination);
        osc.start(now); osc.stop(now + 1.45);
      }
    } catch (e) { /* never let a chime break the cue */ }

    // auto-dismiss after ~7s
    hideTimer = setTimeout(dismiss, 7000);
  };

  /* ── Auto-init (browser only) ─────────────────────────────────────────────
     A converted page only has to (1) inline ws.js and (2) call WS.seen('<id>')
     synchronously at parse time; this fires the cue once the DOM is ready. */
  function autoInit() {
    WS.bootstrap();
    WS.checkUnlocks();
  }
  if (root && root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }

  // browser global
  if (root && root.document) root.WS = WS;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = WS; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
