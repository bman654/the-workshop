/* ═══════════════════════════════════════════════════════════════════════════
   showing-rail.js — THE SCORE RAIL (WS7 T1.3). A deck-own component that renders
   the film's FULL cue sheet as a Victorian player-piano programme roll down the
   left margin: punched cue marks travel DOWN past a fixed brass tracker bar (the
   play-line) and flare as they cross, chapter plates ride the roll as printed
   labels. Visual design + geometry ported wholesale from the T1.2 mock
   (talk/stage/rail-mock.html); this file wires it to the LIVE deck.

   ZERO edits to showing.js. Same discipline as the deck's Hush Watcher: a
   self-driving rAF that only READS the master clock exposed on
   window.__showing.state (clockMs + idx) and derives every visual from it — no
   second timeline, no accumulation. Position is a PURE function of the master
   clock, so seeks/scrubs/re-entries all converge (ledger invariant 5).

   Gating (regression-safe): the rail builds ONLY when the deck opts in via a
   `data-rail` attribute (the projection-room film) OR a `?rail=1` query override.
   `?rail=0` force-hides. With neither, this script returns immediately and the
   deck (showing / dev-showing) is behaviourally identical — nothing is injected,
   no rAF runs. dev-showing is verified via `?rail=1`.

   Comments use the BLOCK form ONLY (this file is forge-included into a <script>;
   a multi-line HTML comment would silently kill the inlined script). Vanilla,
   dependency-free, no Math.random / no Date.* — deterministic.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── gating: opt-in only, so showing/dev-showing stay regression-clean ─────── */
  function railParam() {
    try {
      var m = /[?&]rail=([01])(?:&|$)/.exec(window.location.search);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }
  function railAttr() {
    try {
      var de = document.documentElement, bd = document.body;
      var has = (de && de.hasAttribute('data-rail')) || (bd && bd.hasAttribute('data-rail'));
      if (!has) return false;
      var v = (de && de.getAttribute('data-rail')) || (bd && bd.getAttribute('data-rail')) || '';
      return v !== 'off';
    } catch (e) { return false; }
  }
  var q = railParam();
  var ENABLED = q === '1' ? true : q === '0' ? false : railAttr();
  if (!ENABLED) return;   /* inert — nothing injected, no rAF */

  /* ── geometry (must match the injected CSS: --bar-y, #sr-scroll top) ───────── */
  var PX = 16;            /* px per second of film time */
  var BAR_Y = 640;        /* play-line, screen px from rail top */
  var SCROLL_TOP = 80;    /* #sr-scroll offset from rail top */
  var FLARE_S = 1.1;      /* seconds a crossing punch stays lit */
  var PAD = 40;           /* top pad above the last cue in strip space */
  var SNAP_JUMP = 1.0;    /* |Δnow| over this in one frame → a seek: snap, no slide */
  var LANE_X = { frame: 31, state: 44, impulse: 57, spot: 70, note: 83 };

  /* ── the rail's own CSS (materials scoped to #sr-rail so deck tokens are never
     clobbered — the mock redefined :root vars for its stage backdrop; we must
     NOT, or --bg/--gold/--lit on the real deck would change). ───────────────── */
  var CSS = [
    '#sr-rail{ --paper:#e7dcbb; --paper-lo:#d9cca6; --p-ink:#2b2114; --p-dim:#7a6b4d;',
    '  --brass-hi:#e9cd7f; --brass:#b78f3a; --brass-lo:#8a6a28; --brass-edge:#5f4a1c;',
    '  --walnut-hi:#3a2a1c; --walnut-lo:#20160d; --hole:#171006; --flare:#ffdf9e;',
    '  --rail-w:356px; --cheek:12px; --bar-y:640px;',
    '  position:fixed; left:0; top:0; bottom:0; width:var(--rail-w); z-index:6;',
    '  pointer-events:none; transform:translateX(0);',
    '  transition:transform .48s cubic-bezier(.6,.05,.32,1);',
    '  box-shadow:14px 0 34px rgba(0,0,0,.55);',
    '  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;',
    '  -webkit-font-smoothing:antialiased; }',
    '#sr-rail.sr-hidden{ transform:translateX(-106%); }',
    '#sr-rail.sr-noanim{ transition:none; }',
    '@media (prefers-reduced-motion: reduce){ #sr-rail{ transition:none; }',
    '  .sr-row.sr-flare .sr-punch, .sr-row.sr-flare .sr-verb{ transition:none; animation:none; } }',

    '#sr-rail .sr-cheek{ position:absolute; top:0; bottom:0; width:var(--cheek); z-index:4;',
    '  background:linear-gradient(90deg, var(--walnut-hi), var(--walnut-lo));',
    '  box-shadow:inset -2px 0 3px rgba(0,0,0,.5); }',
    '#sr-rail .sr-cheek.right{ right:0; left:auto;',
    '  background:linear-gradient(270deg, var(--walnut-hi), var(--walnut-lo));',
    '  box-shadow:inset 2px 0 3px rgba(0,0,0,.5); }',
    '#sr-rail .sr-cheek.left{ left:0; }',

    '#sr-head{ position:absolute; left:0; right:0; top:0; height:58px; z-index:5;',
    '  background:linear-gradient(180deg, var(--brass-hi) 0%, var(--brass) 55%, var(--brass-lo) 100%);',
    '  border-bottom:2px solid var(--brass-edge);',
    '  display:flex; flex-direction:column; align-items:center; justify-content:center;',
    '  padding-right:74px; text-shadow:0 1px 0 rgba(255,240,200,.5); }',
    '#sr-head .t{ font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;',
    '  font-size:15px; letter-spacing:.30em; color:#3d2f12; font-variant:small-caps; }',
    '#sr-head .s{ font-size:9.5px; letter-spacing:.14em; color:#4d3c18; margin-top:2px;',
    '  font-family:"Iowan Old Style",Palatino,Georgia,serif; font-style:italic; }',
    '#sr-head .screw{ position:absolute; top:50%; width:7px; height:7px; border-radius:50%;',
    '  transform:translateY(-50%);',
    '  background:radial-gradient(circle at 35% 30%, #f2dfa4, #7c5f24 70%);',
    '  box-shadow:inset 0 0 2px rgba(0,0,0,.6); }',
    '#sr-head .screw.l{ left:18px; } #sr-head .screw.r{ right:18px; }',
    '#sr-head .sr-counter{ position:absolute; right:14px; top:50%; transform:translateY(-50%);',
    '  background:#221808; color:var(--flare); border:1px solid var(--brass-edge); border-radius:3px;',
    '  font:11.5px/1 ui-monospace,Menlo,monospace; letter-spacing:.08em; padding:4px 7px;',
    '  box-shadow:inset 0 1px 4px rgba(0,0,0,.8), 0 1px 0 rgba(255,240,200,.4);',
    '  text-shadow:0 0 6px rgba(255,213,138,.6); }',

    '#sr-rail .sr-spool{ position:absolute; left:var(--cheek); right:var(--cheek); height:22px; z-index:3;',
    '  background:linear-gradient(180deg, #0d0905 0%, #4a3826 30%, #6b543a 50%, #2e2113 80%, #0d0905 100%); }',
    '#sr-rail .sr-spool.top{ top:58px; box-shadow:0 4px 8px rgba(20,12,4,.55); }',
    '#sr-rail .sr-spool.bottom{ bottom:0; box-shadow:0 -4px 8px rgba(20,12,4,.55); }',

    '#sr-scroll{ position:absolute; left:var(--cheek); right:var(--cheek);',
    '  top:80px; bottom:22px; overflow:hidden; z-index:1;',
    '  background:repeating-linear-gradient(90deg,',
    '      rgba(122,107,77,.28) 0px, rgba(122,107,77,.28) 1px, transparent 1px, transparent 13px)',
    '      24px 0 / 66px 100% no-repeat,',
    '    repeating-linear-gradient(180deg,',
    '      rgba(120,100,60,.05) 0 2px, transparent 2px 6px),',
    '    linear-gradient(90deg, var(--paper-lo) 0%, var(--paper) 7%, var(--paper) 93%, var(--paper-lo) 100%); }',
    '#sr-scroll::before, #sr-scroll::after{ content:""; position:absolute; left:0; right:0;',
    '  height:16px; z-index:3; pointer-events:none; }',
    '#sr-scroll::before{ top:0; background:linear-gradient(180deg, rgba(30,20,8,.45), transparent); }',
    '#sr-scroll::after{ bottom:0; background:linear-gradient(0deg, rgba(30,20,8,.45), transparent); }',

    '#sr-strip{ position:absolute; left:0; right:0; top:0; height:0; will-change:transform; }',

    '#sr-lanehead{ position:absolute; left:var(--cheek); top:84px; width:66px; margin-left:24px;',
    '  display:flex; z-index:2; pointer-events:none; }',
    '#sr-lanehead span{ width:13px; text-align:center; font-size:8.5px; color:var(--p-dim);',
    '  font-family:ui-monospace,Menlo,monospace; opacity:.85; }',

    '#sr-rail .sr-row{ position:absolute; left:0; right:0; height:0; }',
    '#sr-rail .sr-punch{ position:absolute; transform:translate(-50%,-50%);',
    '  background:var(--hole); box-shadow:inset 0 1px 2px rgba(0,0,0,.85), 0 1px 0 rgba(255,248,225,.5); }',
    '#sr-rail .sr-punch.k-frame{ width:16px; height:8px; border-radius:4px; }',
    '#sr-rail .sr-punch.k-state{ width:9px; height:9px; border-radius:50%; }',
    '#sr-rail .sr-punch.k-impulse{ width:6px; height:6px; border-radius:50%; }',
    '#sr-rail .sr-punch.k-spot{ width:8px; height:8px; border-radius:2px; transform:translate(-50%,-50%) rotate(45deg); }',
    '#sr-rail .sr-punch.k-note{ width:10px; height:3px; border-radius:1.5px; }',
    '#sr-rail .sr-verb{ position:absolute; left:92px; max-width:192px; transform:translateY(-50%);',
    '  font:13px/1.15 ui-monospace,Menlo,monospace; color:var(--p-ink);',
    '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '#sr-rail .sr-ts{ position:absolute; right:12px; transform:translateY(-50%);',
    '  font:10px/1 ui-monospace,Menlo,monospace; color:var(--p-dim); }',
    '#sr-rail .sr-leader{ position:absolute; height:0; border-top:1px dotted rgba(122,107,77,.55); }',

    '#sr-rail .sr-row.sr-spent .sr-verb, #sr-rail .sr-row.sr-spent .sr-ts{ opacity:.45; }',
    '#sr-rail .sr-row.sr-spent .sr-punch{ background:#241a0e; box-shadow:inset 0 1px 2px rgba(0,0,0,.7); }',
    '#sr-rail .sr-row.sr-flare .sr-punch{ background:var(--flare);',
    '  box-shadow:0 0 14px 4px rgba(255,213,138,.55), inset 0 0 3px rgba(255,255,255,.8); }',
    '#sr-rail .sr-row.sr-flare .sr-verb{ color:#6b3f00; font-weight:700;',
    '  text-shadow:0 0 10px rgba(255,196,110,.65); }',
    '#sr-rail .sr-row.sr-flare::before{ content:""; position:absolute; left:8px; right:8px;',
    '  top:-14px; height:28px; border-radius:14px; pointer-events:none;',
    '  background:radial-gradient(50% 50% at 50% 50%, rgba(255,213,138,.30), transparent 70%); }',

    '#sr-rail .sr-plate{ position:absolute; left:8px; right:8px; height:34px; margin-top:4px;',
    '  background:linear-gradient(180deg, #f2ead2, #e9dfc4);',
    '  border-top:1px solid #8a6f3f; border-bottom:1px solid #8a6f3f;',
    '  box-shadow:0 1px 0 #c9bb94 inset, 0 -1px 0 #c9bb94 inset, 0 1px 3px rgba(60,40,10,.25);',
    '  display:flex; align-items:center; justify-content:center; }',
    '#sr-rail .sr-plate .no{ font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;',
    '  font-size:12.5px; letter-spacing:.12em; color:#4a3a1a; font-variant:small-caps; white-space:nowrap; }',

    '#sr-bar{ position:absolute; left:0; right:0; top:var(--bar-y); height:0; z-index:3;',
    '  pointer-events:none; }',
    '#sr-bar::before{ content:""; position:absolute; left:0; width:104px; top:-2px; height:3px;',
    '  background:linear-gradient(180deg, var(--brass-hi), var(--brass-lo));',
    '  box-shadow:0 1px 3px rgba(10,6,0,.55), 0 -1px 2px rgba(255,240,200,.25); }',
    '#sr-bar::after{ content:""; position:absolute; left:104px; right:0; top:-1px; height:1px;',
    '  background:rgba(138,106,40,.4); }',
    '#sr-bar .port{ position:absolute; top:0; width:18px; height:13px; border-radius:6px;',
    '  transform:translate(-50%,-50%); border:2px solid var(--brass-lo); background:transparent;',
    '  box-shadow:0 1px 2px rgba(10,6,0,.45), inset 0 1px 1px rgba(255,240,200,.3); }',
    '#sr-bar .pallet{ position:absolute; left:-2px; top:0; width:16px; height:22px;',
    '  transform:translateY(-50%); border-radius:0 4px 4px 0;',
    '  background:linear-gradient(180deg, var(--brass-hi) 0%, var(--brass) 46%, var(--brass-lo) 100%);',
    '  border:1px solid var(--brass-edge); box-shadow:0 2px 5px rgba(10,6,0,.5); }'
  ].join('\n');

  /* ── label helpers: a short legible verb for each cue kind ──────────────────── */
  function shortPath(url) {
    var s = String(url || '');
    s = s.split('#')[0].split('?')[0];
    s = s.replace(/\.html$/, '').replace(/\/index$/, '').replace(/^\.\.?\//, '').replace(/^\/+/, '');
    var segs = s.split('/').filter(Boolean);
    if (!segs.length) return s || '(frame)';
    var last = segs[segs.length - 1];
    return (last === 'index' && segs.length > 1) ? segs[segs.length - 2] : last;
  }
  function fmtArgs(args) {
    if (!args || !args.length) return '';
    var out = [];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      out.push(typeof a === 'string' ? "'" + a + "'" : String(a));
    }
    return out.join(', ');
  }
  function verbStr(payload) {
    if (!payload || !payload.verb) return '(cue)';
    return payload.verb + '(' + fmtArgs(payload.args) + ')';
  }
  function cueLabel(cue, kind) {
    if (kind === 'frame') return '→ ' + shortPath(cue.frame);
    if (kind === 'state') return verbStr(cue.state);
    if (kind === 'impulse') return verbStr(cue.impulse);
    if (kind === 'spot') return '◆ ' + ((cue.spot && cue.spot.sel) || '(spot)');
    if (kind === 'note') return String(cue.note || '');
    return '(cue)';
  }

  /* ── state ──────────────────────────────────────────────────────────────────── */
  var built = false;
  var rows = [];          /* { el, absT } for per-tick flare/spent flips */
  var offsets = [];       /* film-absolute chapter start, seconds */
  var hideWins = [];      /* [{from,to}] absolute-sec windows where the rail hides */
  var TMAX = 360;
  var strip = null, railEl = null, clockEl = null;
  var lastNow = null;

  function stripY(absT) { return PAD + (TMAX - absT) * PX; }

  function durSec(ch) {
    var ms = (ch && ch.timing && typeof ch.timing.duration_ms === 'number') ? ch.timing.duration_ms
      : (ch && typeof ch.durationMs === 'number') ? ch.durationMs : 8000;
    return ms / 1000;
  }

  function fmtClock(t) {
    if (t < 0) t = 0;
    var m = Math.floor(t / 60), s = t - m * 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }

  function kindOf(cue) {
    try { if (window.CueEngine && window.CueEngine.cueKind) return window.CueEngine.cueKind(cue); } catch (e) {}
    var keys = ['frame', 'state', 'impulse', 'spot', 'note'];
    for (var i = 0; i < keys.length; i++) if (Object.prototype.hasOwnProperty.call(cue, keys[i])) return keys[i];
    return null;
  }

  /* ── build once from the live CHAPTERS data ────────────────────────────────── */
  function build(chapters) {
    /* film-absolute chapter offsets from committed durations */
    var acc = 0;
    for (var i = 0; i < chapters.length; i++) { offsets[i] = acc; acc += durSec(chapters[i]); }
    TMAX = acc;

    /* per-beat auto-hide windows (data-driven; inert where absent). A chapter may
       declare railHide:true (whole chapter) and/or railHideAt:[[from,to],...]
       (chapter-relative seconds). Derived to absolute-sec windows here. */
    for (i = 0; i < chapters.length; i++) {
      var ch = chapters[i], o = offsets[i], end = o + durSec(ch);
      if (ch && ch.railHide === true) hideWins.push({ from: o, to: end });
      if (ch && ch.railHideAt && ch.railHideAt.length) {
        for (var w = 0; w < ch.railHideAt.length; w++) {
          var win = ch.railHideAt[w];
          hideWins.push({ from: o + (+win[0] || 0), to: o + (+win[1] || 0) });
        }
      }
    }

    injectCSS();
    injectDOM();

    strip = document.getElementById('sr-strip');
    railEl = document.getElementById('sr-rail');
    clockEl = document.getElementById('sr-clock');

    var items = [];   /* { y, h, plate|cue, ... } for the label-nudge pass */

    /* chapter plates — a plate's TOP edge sits at its boundary, hanging just below
       so it crosses the play-line as a title card before the chapter's first cue.
       A continuation entry (displayCont:true — a load-bearing audio split shown as
       ONE chapter) prints no plate of its own; its displayNum is the shown number.
       Absent on every entry → each entry gets its own plate numbered i+1. */
    for (i = 0; i < chapters.length; i++) {
      if (chapters[i] && chapters[i].displayCont) continue;
      var dn = (chapters[i] && typeof chapters[i].displayNum === 'number') ? chapters[i].displayNum : (i + 1);
      var el = document.createElement('div');
      el.className = 'sr-plate';
      el.innerHTML = '<span class="no">№ ' + dn + ' · ' + esc(chapters[i].title || '') + '</span>';
      var py = stripY(offsets[i]);
      el.style.top = py + 'px';
      strip.appendChild(el);
      items.push({ y: py, h: 34, plate: true });
    }

    /* cue rows — every cue across every chapter, at its film-absolute position */
    for (i = 0; i < chapters.length; i++) {
      var cues = (chapters[i] && chapters[i].cues) || [];
      for (var c = 0; c < cues.length; c++) {
        var cue = cues[c], kind = kindOf(cue);
        if (!kind) continue;
        var absT = offsets[i] + (+cue.t || 0);
        var y = stripY(absT);
        var row = document.createElement('div');
        row.className = 'sr-row';
        row.style.top = y + 'px';
        var punch = document.createElement('span');
        punch.className = 'sr-punch k-' + kind;
        punch.style.left = LANE_X[kind] + 'px';
        punch.style.top = '0px';
        var verb = document.createElement('span');
        verb.className = 'sr-verb';
        verb.textContent = cueLabel(cue, kind);
        var ts = document.createElement('span');
        ts.className = 'sr-ts';
        ts.textContent = 't:' + (+cue.t || 0).toFixed(1);
        row.appendChild(punch); row.appendChild(verb); row.appendChild(ts);
        strip.appendChild(row);
        items.push({ y: y, h: 16, cue: true, row: row, verb: verb, ts: ts, punchX: LANE_X[kind] });
        rows.push({ el: row, absT: absT });
      }
    }

    nudgeLabels(items);
    built = true;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* label nudge: punches stay at TRUE time positions; colliding labels get pushed
     down to a min separation with a dotted leader back to their punch; plates are
     immovable obstacles cues yield to. Ported verbatim from the T1.2 mock. */
  function nudgeLabels(items) {
    items.sort(function (a, b) { return a.y - b.y; });
    var floor = -1e9;
    items.forEach(function (it) {
      var top = it.plate ? it.y + 4 : it.y - 8;
      if (top < floor) {
        var shift = floor - top;
        if (it.plate) { floor = it.y + 4 + it.h + 4; return; }
        it.verb.style.transform = 'translateY(calc(-50% + ' + shift + 'px))';
        it.ts.style.transform = 'translateY(calc(-50% + ' + shift + 'px))';
        if (shift > 4) {
          var lead = document.createElement('span');
          lead.className = 'sr-leader';
          lead.style.left = (it.punchX + 12) + 'px';
          lead.style.width = (92 - it.punchX - 16) + 'px';
          lead.style.top = (shift / 2) + 'px';
          lead.style.transform = 'rotate(' + Math.atan2(shift, 92 - it.punchX - 16) * 57.3 / 2 + 'deg)';
          it.row.appendChild(lead);
        }
        floor = it.y + shift + 12;
      } else {
        floor = (it.plate ? it.y + 4 + it.h + 4 : it.y + 12);
      }
    });
  }

  function injectCSS() {
    try {
      var st = document.createElement('style');
      st.id = 'sr-style';
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }
  function injectDOM() {
    var rail = document.createElement('div');
    rail.id = 'sr-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML =
      '<div class="sr-cheek left"></div><div class="sr-cheek right"></div>' +
      '<div id="sr-head"><span class="screw l"></span>' +
      '<div class="t">The Score</div>' +
      '<div class="s">programme roll · the projection room</div>' +
      '<span class="sr-counter" id="sr-clock">00:00.0</span></div>' +
      '<div class="sr-spool top"></div>' +
      '<div id="sr-lanehead"><span>F</span><span>S</span><span>I</span><span>◆</span><span>¶</span></div>' +
      '<div id="sr-scroll"><div id="sr-strip"></div></div>' +
      '<div id="sr-bar"><span class="pallet"></span>' +
      '<span class="port" style="left:43px"></span><span class="port" style="left:56px"></span>' +
      '<span class="port" style="left:69px"></span><span class="port" style="left:82px"></span>' +
      '<span class="port" style="left:95px"></span></div>' +
      '<div class="sr-spool bottom"></div>';
    document.body.appendChild(rail);
  }

  /* ── per-tick render: PURE function of the master clock (nowAbs) ────────────── */
  function hiddenAt(nowAbs) {
    for (var i = 0; i < hideWins.length; i++) {
      if (nowAbs >= hideWins[i].from && nowAbs < hideWins[i].to) return true;
    }
    return false;
  }
  function render(nowAbs) {
    var ty = (BAR_Y - SCROLL_TOP) - stripY(nowAbs);
    strip.style.transform = 'translateY(' + ty + 'px)';
    for (var i = 0; i < rows.length; i++) {
      var d = nowAbs - rows[i].absT;
      var el = rows[i].el;
      el.classList.toggle('sr-flare', d >= 0 && d < FLARE_S);
      el.classList.toggle('sr-spent', d >= FLARE_S);
    }
    clockEl.textContent = fmtClock(nowAbs);

    /* seek/jump detection: a large single-frame delta snaps the hide/show slide */
    var snap = lastNow != null && Math.abs(nowAbs - lastNow) > SNAP_JUMP;
    railEl.classList.toggle('sr-noanim', snap);
    railEl.classList.toggle('sr-hidden', hiddenAt(nowAbs));
    lastNow = nowAbs;
  }

  /* ── drive loop: read the deck's master clock every frame, derive nowAbs ───── */
  function nowAbsFromDeck(S) {
    var idx = S.state.idx || 0;
    if (idx < 0) idx = 0;
    if (idx >= offsets.length) idx = offsets.length - 1;
    return (offsets[idx] || 0) + (S.state.clockMs || 0) / 1000;
  }
  function loop() {
    requestAnimationFrame(loop);
    var S = window.__showing;
    if (!built || !S || !S.state) return;
    render(nowAbsFromDeck(S));
  }

  /* ── boot: build from the live deck once it exposes CHAPTERS, then drive ───── */
  function boot() {
    var S = window.__showing;
    var chapters = (S && S.chapters) || window.SHOWING_CHAPTERS;
    if (!chapters || !chapters.length) { setTimeout(boot, 60); return; }
    if (!document.body) { setTimeout(boot, 60); return; }
    build(chapters);
    requestAnimationFrame(loop);

    /* liveness handle for verification (agent-browser / headless probes) */
    window.__showingRail = {
      enabled: true,
      built: function () { return built; },
      nowAbs: function () { var s = window.__showing; return s ? nowAbsFromDeck(s) : 0; },
      hidden: function () { return !!railEl && railEl.classList.contains('sr-hidden'); },
      cues: function () { return rows.length; },
      flares: function () {
        var n = 0; for (var i = 0; i < rows.length; i++) if (rows[i].el.classList.contains('sr-flare')) n++;
        return n;
      },
      offsets: function () { return offsets.slice(); },
      total: function () { return TMAX; },
      hideWindows: function () { return hideWins.slice(); },
      /* test seam: inject a hide window (absolute sec) to exercise auto-hide where
         a deck defines none (dev-showing) — verification only, never shipped data */
      _testHide: function (from, to) { hideWins.push({ from: +from, to: +to }); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
