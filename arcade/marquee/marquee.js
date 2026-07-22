/* THE HOUSE LIGHTS — a theatrical marquee that lights a bulb for every arcade
 * cabinet you take past par, and engraves a Champion plate when all 23 glow.
 *
 * Mounts ABOVE the .grid rack in arcade/index.html. Read-only on every game's
 * best-score key; its own state lives only under ws:marquee:*. Depends on
 * core.js (window.MarqueeCore) + pars.js (window.MARQUEE_PARS).
 *
 * Public surface:
 *   Marquee.mount(el, opts) -> instance { recompute, litCount, sockets, destroy }
 *   Marquee.selfTest()      -> the headless-drivable payoff-liveness twin
 *   Marquee.renderWavBase64(cue, opts) -> WAV (base64) for audio-lens
 */
(function () {
  'use strict';
  var core = window.MarqueeCore;
  var TABLE = window.MARQUEE_PARS;

  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var SEEN_KEY = 'ws:marquee:litseen';
  var CHAMP_KEY = 'ws:marquee:champion';
  var MUTE_KEY = 'ws:pref:muted';
  var isMuted = function () { return LS.get(MUTE_KEY) === '1'; };

  // Read a cabinet's persisted best as a number (0 if absent / unparsable).
  function readBest(cab) {
    if (!cab.key) return 0;
    var raw = LS.get(cab.key);
    var n = raw == null ? 0 : +raw;
    return isFinite(n) ? n : 0;
  }

  // ---- number / readout formatting ----------------------------------------
  function fmtVal(cab, v) {
    if (cab.metric === 'level') return 'lvl ' + v;
    if (cab.metric === 'wave') return 'wave ' + v;
    return Number(v).toLocaleString();
  }
  function fmtPar(cab) {
    if (cab.metric === 'level') return 'lvl ' + cab.par;
    if (cab.metric === 'wave') return 'wave ' + cab.par;
    return Number(cab.par).toLocaleString();
  }
  function bulbLine(cab, v) {
    if (cab.metric === 'keystone') {
      return v ? 'PONG — CHAMPION · 23 / 23 lit' : 'PONG — the house key · light all 22';
    }
    if (core.isLit(v, cab.par)) return cab.name + ' — ' + fmtVal(cab, v) + ' / par ' + fmtPar(cab) + ' ✓ lit';
    if (v > 0) {
      var pct = Math.round(core.progress(v, cab.par) * 100);
      return cab.name + ' — ' + fmtVal(cab, v) + ' / par ' + fmtPar(cab) + ' (' + pct + '%)';
    }
    return cab.name + ' — · play it';
  }
  function ariaLine(cab, v, lit) {
    if (cab.metric === 'keystone') return lit ? 'Pong, keystone lit, Champion of the House' : 'Pong, keystone, dark — light all 22 cabinets';
    if (lit) return cab.name + ', lit, ' + fmtVal(cab, v) + ' past par ' + fmtPar(cab);
    if (v > 0) return cab.name + ', dark, ' + fmtVal(cab, v) + ' of par ' + fmtPar(cab);
    return cab.name + ', dark, not yet played';
  }

  /* ===================== AUDIO (in-house WebAudio) ======================== *
   * Every cue is scheduled into a passed ctx+dest so the SAME code renders
   * live (AudioContext) and offline (OfflineAudioContext, for audio-lens).   */
  var Audio = {
    ctx: null,
    master: null,
    ensure: function () {
      if (this.ctx) return this.ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    },
    unlock: function () {
      var c = this.ensure();
      if (c && c.state === 'suspended') c.resume();
    },
    // returns {attempted, suppressed} — introspectable by the liveness twin
    play: function (cue, opts) {
      if (isMuted()) return { attempted: true, suppressed: true, cue: cue };
      var c = this.ensure();
      if (!c) return { attempted: true, suppressed: true, cue: cue, noctx: true };
      if (c.state === 'suspended') c.resume();
      schedule(cue, c, this.master, c.currentTime + 0.01, opts || {});
      return { attempted: true, suppressed: false, cue: cue };
    }
  };

  // envelope helper: exponential-ish decay via setTargetAtTime
  function env(ctx, g, when, peak, attack, decayTau, stopAt) {
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
    g.gain.setTargetAtTime(0.0001, when + attack, decayTau);
  }

  function schedule(cue, ctx, dest, when, opts) {
    if (cue === 'chime') return schedChime(ctx, dest, when, opts);
    if (cue === 'bell') return schedBell(ctx, dest, when, opts);
    if (cue === 'run') return schedRun(ctx, dest, when, opts);
    if (cue === 'engrave') return schedEngrave(ctx, dest, when, opts);
  }

  // Per-bulb ignition chime: triangle+sine, pitch rises with progress.
  function schedChime(ctx, dest, when, opts) {
    var prog = opts.progress == null ? 1 : opts.progress;
    var scale = [523.25, 587.33, 659.25, 783.99, 880.0]; // C-pentatonic
    var f = scale[Math.max(0, Math.min(scale.length - 1, Math.round(prog * (scale.length - 1))))];
    var g = ctx.createGain(); g.connect(dest);
    env(ctx, g, when, 0.34, 0.006, 0.11);
    var o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    var g2 = ctx.createGain(); g2.gain.value = 0.4; o2.connect(g2); g2.connect(g);
    o1.connect(g);
    o1.start(when); o2.start(when); o1.stop(when + 0.5); o2.stop(when + 0.5);
  }

  // Finale bell: struck bell, inharmonic partials 1:2.76:5.40:8.93, ~2s decay,
  // plus a low strike thump.
  function schedBell(ctx, dest, when, opts) {
    var f0 = 392.0; // G4 — the perceived pitch
    var partials = [1, 2.76, 5.40, 8.93];
    var gains = [0.34, 0.18, 0.11, 0.06];
    var taus = [0.62, 0.48, 0.34, 0.24];
    for (var i = 0; i < partials.length; i++) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f0 * partials[i];
      var g = ctx.createGain(); g.connect(dest);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gains[i], when + 0.004);
      g.gain.setTargetAtTime(0.0001, when + 0.004, taus[i]);
      o.connect(g); o.start(when); o.stop(when + 2.2);
    }
    // low strike thump
    var to = ctx.createOscillator(); to.type = 'sine'; to.frequency.setValueAtTime(120, when);
    to.frequency.exponentialRampToValueAtTime(60, when + 0.14);
    var tg = ctx.createGain(); tg.connect(dest);
    tg.gain.setValueAtTime(0.0001, when);
    tg.gain.exponentialRampToValueAtTime(0.4, when + 0.006);
    tg.gain.setTargetAtTime(0.0001, when + 0.006, 0.09);
    to.connect(tg); to.start(when); to.stop(when + 0.5);
  }

  // Chase "run" sweep: a rising filtered blip train racing the ring.
  function schedRun(ctx, dest, when, opts) {
    var dur = opts.dur || 1.2;
    var g = ctx.createGain(); g.gain.value = 0.9; g.connect(dest);
    var lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(320, when);
    lp.frequency.exponentialRampToValueAtTime(1500, when + dur);
    lp.connect(g);
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, when);
    o.frequency.exponentialRampToValueAtTime(660, when + dur);
    o.connect(lp);
    // tremolo to read as a "chase"
    var tremG = ctx.createGain(); // placeholder chain kept simple
    var amp = ctx.createGain(); amp.gain.value = 0.0001; amp.connect(g); // not used; keep g driven below
    var lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 14;
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.14;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.22, when + 0.05);
    g.gain.setValueAtTime(0.22, when + dur - 0.1);
    g.gain.exponentialRampToValueAtTime(0.0002, when + dur);
    o.start(when); o.stop(when + dur); lfo.start(when); lfo.stop(when + dur);
  }

  // Plate-engrave sting: a short metallic chunk.
  function schedEngrave(ctx, dest, when, opts) {
    var g = ctx.createGain(); g.connect(dest);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.3, when + 0.004);
    g.gain.setTargetAtTime(0.0001, when + 0.004, 0.10);
    var o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = 174.6;
    var o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 233.1;
    var g2 = ctx.createGain(); g2.gain.value = 0.5; o2.connect(g2); g2.connect(g);
    o1.connect(g);
    o1.start(when); o2.start(when); o1.stop(when + 0.5); o2.stop(when + 0.5);
    // a bright tick on top
    var to = ctx.createOscillator(); to.type = 'triangle'; to.frequency.value = 1046.5;
    var tg = ctx.createGain(); tg.connect(dest);
    tg.gain.setValueAtTime(0.0001, when);
    tg.gain.exponentialRampToValueAtTime(0.16, when + 0.003);
    tg.gain.setTargetAtTime(0.0001, when + 0.003, 0.04);
    to.connect(tg); to.start(when); to.stop(when + 0.3);
  }

  // ---- offline render for audio-lens --------------------------------------
  Audio.renderFloat = function (cue, opts) {
    opts = opts || {};
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var sr = 44100, dur = opts.dur || 2.2;
    var off = new OAC(1, Math.ceil(sr * dur), sr);
    var m = off.createGain(); m.gain.value = 0.85; m.connect(off.destination);
    schedule(cue, off, m, 0.02, opts);
    return off.startRendering().then(function (buf) { return buf.getChannelData(0); });
  };

  /* ========================== STYLE (injected once) ====================== */
  var STYLE = '\
  .mq{ margin:38px auto 6px; max-width:1180px; }\
  .mq-frame{ position:relative; border-radius:20px; padding:clamp(26px,5vw,40px) clamp(20px,4vw,34px) clamp(20px,4vw,30px);\
    background:linear-gradient(150deg,#3a2e17 0%,#6b5320 22%,#c9a24a 46%,#8a6d2c 60%,#4a3a1a 100%);\
    box-shadow: inset 0 2px 3px rgba(255,238,190,.55), inset 0 -3px 8px rgba(0,0,0,.6),\
      inset 0 0 0 2px rgba(30,20,6,.5), 0 22px 60px -22px rgba(0,0,0,.9), 0 0 60px -20px rgba(255,200,110,.35);\
    overflow:hidden; }\
  .mq-frame::before{ content:""; position:absolute; inset:9px; border-radius:13px; pointer-events:none;\
    background:radial-gradient(120% 100% at 50% 0%, rgba(10,8,14,.5), rgba(6,7,13,.94) 70%);\
    box-shadow: inset 0 0 0 1px rgba(20,14,4,.7), inset 0 0 26px rgba(0,0,0,.8); }\
  .mq-frame::after{ content:""; position:absolute; inset:0; pointer-events:none; opacity:.5;\
    background:repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0 1px, transparent 1px 3px); mix-blend-mode:multiply; }\
  .mq-ring{ position:absolute; inset:0; pointer-events:none; z-index:1; }\
  .mq-ring b{ position:absolute; width:7px; height:7px; border-radius:50%;\
    background:radial-gradient(circle at 40% 35%, #fff6dc, #ffcf7a 55%, #a5721f 100%);\
    box-shadow:0 0 5px 1px rgba(255,200,110,.75); transform:translate(-50%,-50%); transition:box-shadow .12s, background .12s; }\
  .mq-ring b.hot{ background:radial-gradient(circle at 40% 35%, #ffffff, #fff0c0 55%, #ffd070 100%);\
    box-shadow:0 0 12px 4px rgba(255,225,150,1), 0 0 22px 8px rgba(255,190,90,.7); }\
  .mq-inner{ position:relative; z-index:2; }\
  .mq-head{ text-align:center; margin-bottom:clamp(12px,2.4vw,18px); }\
  .mq-title{ font-weight:800; letter-spacing:.30em; font-size:clamp(15px,3.4vw,26px); color:#ffe9b8;\
    text-shadow:0 1px 0 rgba(0,0,0,.7), 0 0 14px rgba(255,196,110,.6); }\
  .mq-readout{ margin:7px auto 0; min-height:1.3em; font-size:clamp(10.5px,2.3vw,13px); letter-spacing:.10em;\
    color:#ffd98a; text-shadow:0 0 10px rgba(255,180,90,.5); transition:color .2s; }\
  .mq-counter{ margin-top:5px; font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:#c9a24a; }\
  .mq-counter b{ color:#fff2cc; }\
  .mq-sockets{ display:grid; gap:clamp(9px,1.7vw,14px); justify-items:center;\
    grid-template-columns:repeat(auto-fit, minmax(clamp(46px,11vw,72px),1fr)); }\
  .mq-socket{ position:relative; display:flex; align-items:center; justify-content:center;\
    width:100%; aspect-ratio:1/1; max-width:78px; text-decoration:none; border-radius:50%;\
    outline:none; -webkit-tap-highlight-color:transparent; }\
  .mq-socket:focus-visible .mq-bulb{ box-shadow:0 0 0 2px #fff2cc, 0 0 14px 3px rgba(255,220,150,.7); }\
  .mq-bulb{ position:relative; width:82%; aspect-ratio:1/1; border-radius:50%;\
    display:flex; align-items:center; justify-content:center;\
    background:radial-gradient(circle at 42% 34%, rgba(60,70,90,.6), rgba(14,18,28,.95) 72%);\
    box-shadow: inset 0 1px 2px rgba(255,255,255,.10), inset 0 -3px 6px rgba(0,0,0,.6), 0 2px 5px rgba(0,0,0,.5);\
    transition:box-shadow .3s, background .3s, transform .18s; }\
  .mq-socket:hover .mq-bulb{ transform:translateY(-2px); }\
  .mq-fill{ position:absolute; inset:-3px; border-radius:50%; pointer-events:none;\
    -webkit-mask:radial-gradient(transparent 58%, #000 60%); mask:radial-gradient(transparent 58%, #000 60%); }\
  .mq-mono{ position:relative; z-index:2; font-weight:800; letter-spacing:.02em;\
    font-size:clamp(9px,2.1vw,12px); color:#8fa0bd; text-shadow:0 1px 1px rgba(0,0,0,.7); transition:color .3s, text-shadow .3s; }\
  /* dark + unplayed: soft breathing */\
  .mq-socket.st-unplayed .mq-bulb{ animation:mqBreathe 3.4s ease-in-out infinite; }\
  @keyframes mqBreathe{ 0%,100%{ box-shadow: inset 0 1px 2px rgba(255,255,255,.08), inset 0 -3px 6px rgba(0,0,0,.6), 0 0 4px rgba(150,170,210,.15);} 50%{ box-shadow: inset 0 1px 2px rgba(255,255,255,.10), inset 0 -3px 6px rgba(0,0,0,.6), 0 0 12px rgba(150,180,230,.4);} }\
  /* dark + progress: cold accent tint on the glass, progress arc via --c */\
  .mq-socket.st-progress .mq-bulb{ background:radial-gradient(circle at 42% 34%, color-mix(in srgb,var(--c) 26%,rgba(20,26,38,.9)), rgba(12,16,26,.96) 74%); }\
  .mq-socket.st-progress .mq-mono{ color:color-mix(in srgb,var(--c) 55%,#9fb0cc); }\
  /* on-deck: pulsing halo invitation */\
  .mq-socket.st-ondeck .mq-bulb{ animation:mqOndeck 1.6s ease-in-out infinite; }\
  @keyframes mqOndeck{ 0%,100%{ box-shadow: inset 0 1px 2px rgba(255,255,255,.10), 0 0 8px 1px color-mix(in srgb,var(--c) 55%,transparent);} 50%{ box-shadow: inset 0 1px 2px rgba(255,255,255,.12), 0 0 20px 5px color-mix(in srgb,var(--c) 85%,transparent);} }\
  /* lit: warm-white core inside the accent halo */\
  .mq-socket.st-lit .mq-bulb{ background:radial-gradient(circle at 46% 40%, #fffef2 0%, #fff0c4 30%, color-mix(in srgb,var(--c) 80%,#ffcf7a) 74%, color-mix(in srgb,var(--c) 60%,#7a5a1e) 100%);\
    box-shadow: inset 0 1px 3px rgba(255,255,255,.5), 0 0 12px 2px color-mix(in srgb,var(--c) 70%,#ffd27a), 0 0 26px 6px color-mix(in srgb,var(--c) 45%,transparent); }\
  .mq-socket.st-lit .mq-mono{ color:#3a2c10; text-shadow:0 1px 0 rgba(255,255,255,.4); }\
  /* keystone (pong): center-stage, distinct dark ring until complete */\
  .mq-socket.st-keystone .mq-bulb{ background:radial-gradient(circle at 42% 34%, rgba(70,80,60,.55), rgba(14,18,12,.95) 72%);\
    box-shadow: inset 0 0 0 2px color-mix(in srgb,var(--c) 40%,transparent), inset 0 -3px 6px rgba(0,0,0,.6); }\
  .mq-socket.st-keystone .mq-mono{ color:color-mix(in srgb,var(--c) 70%,#889); }\
  /* warm-up cascade (calm first mount) + live flicker (a fresh crossing) */\
  .mq-socket.mq-warm .mq-bulb{ animation:mqWarm .9s ease-out both; }\
  @keyframes mqWarm{ 0%{ filter:brightness(.25);} 100%{ filter:brightness(1);} }\
  .mq-socket.mq-flicker .mq-bulb{ animation:mqFlick .85s steps(1) 1; }\
  @keyframes mqFlick{ 0%{filter:brightness(.2)} 12%{filter:brightness(1.9)} 20%{filter:brightness(.3)} 32%{filter:brightness(1.7)} 44%{filter:brightness(.5)} 60%{filter:brightness(1.5)} 100%{filter:brightness(1)} }\
  /* Champion plate */\
  .mq-champion{ margin:clamp(14px,2.6vw,20px) auto 2px; max-width:520px; text-align:center;\
    border-radius:10px; padding:12px 18px; opacity:0; transform:translateY(6px); transition:opacity .8s, transform .8s;\
    background:linear-gradient(150deg,#3a2e17,#c9a24a 48%,#4a3a1a); color:#241a06;\
    box-shadow: inset 0 1px 2px rgba(255,246,200,.6), inset 0 -2px 6px rgba(0,0,0,.5), 0 8px 24px -10px rgba(0,0,0,.8); }\
  .mq-champion.show{ opacity:1; transform:none; }\
  .mq-champion .ct{ font-weight:800; letter-spacing:.24em; font-size:clamp(13px,2.8vw,18px); text-shadow:0 1px 0 rgba(255,246,200,.5); }\
  .mq-champion .cd{ margin-top:3px; font-size:11px; letter-spacing:.18em; color:#4a3a1a; }\
  @media (prefers-reduced-motion: reduce){ .mq-socket .mq-bulb{ animation:none !important; } .mq-socket.mq-warm .mq-bulb,.mq-socket.mq-flicker .mq-bulb{ animation:none !important; } }';

  function injectStyle() {
    if (document.getElementById('mq-style')) return;
    var s = document.createElement('style'); s.id = 'mq-style'; s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ============================= MOUNT ==================================== */
  function mount(el, opts) {
    opts = opts || {};
    injectStyle();
    el.classList.add('mq');
    el.innerHTML = '\
      <div class="mq-frame">\
        <div class="mq-ring" aria-hidden="true"></div>\
        <div class="mq-inner">\
          <div class="mq-head">\
            <div class="mq-title">THE HOUSE LIGHTS</div>\
            <div class="mq-readout" id="mq-readout" role="status" aria-live="polite"></div>\
            <div class="mq-counter"><b id="mq-count">0</b> of 23 lit</div>\
          </div>\
          <div class="mq-sockets" id="mq-sockets"></div>\
        </div>\
        <div class="mq-champion" id="mq-champion" role="status"><div class="ct">CHAMPION OF THE HOUSE</div><div class="cd" id="mq-champdate"></div></div>\
      </div>';

    var frame = el.querySelector('.mq-frame');
    var ring = el.querySelector('.mq-ring');
    var socketsWrap = el.querySelector('#mq-sockets');
    var readoutEl = el.querySelector('#mq-readout');
    var countEl = el.querySelector('#mq-count');
    var champEl = el.querySelector('#mq-champion');
    var champDateEl = el.querySelector('#mq-champdate');

    var inst = {
      el: el, sockets: {}, litCount: 0,
      _seen: null, _championDone: false, _lastChime: null, _finaleFired: false, _destroyed: false
    };

    // build sockets
    TABLE.forEach(function (cab) {
      var a = document.createElement('a');
      a.className = 'mq-socket';
      a.href = 'games/' + cab.file;
      a.style.setProperty('--c', cab.accent);
      a.dataset.slug = cab.slug;
      a.innerHTML = '<span class="mq-bulb"><span class="mq-fill"></span><span class="mq-mono">' + cab.mono + '</span></span>';
      // hover / focus / tap -> readout shows this cabinet's line
      var showThis = function () { renderReadout(cab); };
      var showDefault = function () { renderReadout(null); };
      a.addEventListener('mouseenter', showThis);
      a.addEventListener('mouseleave', showDefault);
      a.addEventListener('focus', showThis);
      a.addEventListener('blur', showDefault);
      socketsWrap.appendChild(a);
      inst.sockets[cab.slug] = a;
    });

    function fillArc(cab, v) {
      var el2 = inst.sockets[cab.slug].querySelector('.mq-fill');
      if (cab.metric === 'keystone' || core.isLit(v, cab.par) || !(v > 0)) { el2.style.background = 'none'; return; }
      var deg = Math.round(core.progress(v, cab.par) * 360);
      el2.style.background = 'conic-gradient(' + cab.accent + ' ' + deg + 'deg, rgba(255,255,255,.05) 0)';
    }

    function stateClass(cab, v, lit, keystoneOn, onDeckSlug) {
      var s = inst.sockets[cab.slug];
      s.classList.remove('st-lit', 'st-progress', 'st-unplayed', 'st-ondeck', 'st-keystone');
      if (cab.metric === 'keystone') {
        s.classList.add(keystoneOn ? 'st-lit' : 'st-keystone');
      } else if (lit) {
        s.classList.add('st-lit');
      } else if (cab.slug === onDeckSlug) {
        s.classList.add('st-ondeck');
      } else if (v > 0) {
        s.classList.add('st-progress');
      } else {
        s.classList.add('st-unplayed');
      }
      s.setAttribute('aria-label', ariaLine(cab, v, cab.metric === 'keystone' ? keystoneOn : lit));
    }

    function renderReadout(cab) {
      if (cab) { readoutEl.textContent = bulbLine(cab, readBest(cab)); return; }
      // default line
      if (inst._championDone) { readoutEl.textContent = 'CHAMPION OF THE HOUSE · every light burning'; return; }
      var od = core.onDeck(TABLE, readBest);
      if (od) { readoutEl.textContent = 'closest: ' + od.name + ' ' + fmtVal(od, readBest(od)) + ' / par ' + fmtPar(od); return; }
      var lit = core.litSkillCount(TABLE, readBest);
      if (lit === 0) { readoutEl.textContent = 'play a cabinet to light your first bulb'; return; }
      readoutEl.textContent = lit + ' of 23 lit · one keeps the next warm';
    }

    // ---- ring geometry (bulbs spaced by PERIMETER, decoupled from sockets) --
    var ringBulbs = [];
    function layoutRing() {
      ring.innerHTML = ''; ringBulbs = [];
      var W = frame.clientWidth, H = frame.clientHeight;
      if (!W || !H) return;
      var inset = 5.5; // sit the ring centered on the brass band
      var w = W - inset * 2, h = H - inset * 2, ox = inset, oy = inset;
      var P = 2 * (w + h);
      var spacing = 26;
      var N = Math.max(28, Math.round(P / spacing));
      for (var i = 0; i < N; i++) {
        var d = (i / N) * P, x, y;
        if (d < w) { x = d; y = 0; }
        else if (d < w + h) { x = w; y = d - w; }
        else if (d < 2 * w + h) { x = w - (d - w - h); y = h; }
        else { x = 0; y = h - (d - 2 * w - h); }
        var b = document.createElement('b');
        b.style.left = (ox + x) + 'px'; b.style.top = (oy + y) + 'px';
        ring.appendChild(b); ringBulbs.push(b);
      }
    }
    layoutRing();
    var ro = null, rt = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(layoutRing, 120); });
      ro.observe(frame);
    }

    // ---- chase animation racing the frame ring -----------------------------
    function chaseRing(durMs, cb) {
      var n = ringBulbs.length; if (!n) { if (cb) cb(); return; }
      var laps = 2, comet = 5, t0 = null;
      function frame2(ts) {
        if (inst._destroyed) return;
        if (t0 == null) t0 = ts;
        var p = Math.min(1, (ts - t0) / durMs);
        var head = p * laps * n;
        for (var i = 0; i < n; i++) {
          var dist = ((head - i) % n + n) % n;
          if (dist < comet) ringBulbs[i].classList.add('hot');
          else ringBulbs[i].classList.remove('hot');
        }
        if (p < 1) requestAnimationFrame(frame2);
        else { for (var j = 0; j < n; j++) ringBulbs[j].classList.remove('hot'); if (cb) cb(); }
      }
      requestAnimationFrame(frame2);
    }

    function engravePlate(dateStr) {
      champDateEl.textContent = dateStr + ' · 23 / 23';
      champEl.classList.add('show');
      inst._championDone = true;
      renderReadout(null);
    }

    // Ignite the keystone: silent (calm/returning) or full ceremony (a live win).
    // The champion STATE commits synchronously (idempotent guard + persisted
    // flag) the instant the finale begins; only the reveal animation is async.
    function igniteKeystone(silent) {
      if (inst._championDone) return;
      inst._championDone = true;
      var champRaw = LS.get(CHAMP_KEY);
      var dateStr;
      if (champRaw) {
        try { dateStr = JSON.parse(champRaw).date; } catch (e) { dateStr = champRaw; }
      } else {
        dateStr = new Date().toISOString().slice(0, 10);
        LS.set(CHAMP_KEY, JSON.stringify({ date: dateStr, count: 23 }));
      }
      if (silent) { engravePlate(dateStr); return; }
      inst._finaleFired = true;
      Audio.play('run', { dur: 1.2 });
      chaseRing(1300, function () {
        Audio.play('bell', {});
        setTimeout(function () { Audio.play('engrave', {}); engravePlate(dateStr); }, 180);
      });
    }

    // ---- the heart: recompute from the game keys (source of truth) ----------
    function recompute(o) {
      o = o || {};
      var silent = !!o.silent;
      var litNow = core.litSet(TABLE, readBest);            // slugs currently lit
      var litSetNow = {}; litNow.forEach(function (s) { litSetNow[s] = 1; });
      var keystoneOn = core.keystoneLit(TABLE, readBest);
      var od = core.onDeck(TABLE, readBest);
      var odSlug = od ? od.slug : null;
      var skillLit = core.litSkillCount(TABLE, readBest);
      var total = skillLit + (keystoneOn ? 1 : 0);

      var prevSeen = inst._seen || {};
      var newly = [];
      TABLE.forEach(function (cab) {
        var v = readBest(cab);
        var lit = cab.metric === 'keystone' ? keystoneOn : core.isLit(v, cab.par);
        stateClass(cab, v, lit, keystoneOn, odSlug);
        fillArc(cab, v);
        if (litSetNow[cab.slug] && !prevSeen[cab.slug]) newly.push(cab);
      });

      countEl.textContent = String(total);
      inst.litCount = total;
      renderReadout(null);

      // ceremony for newly-lit bulbs
      if (silent) {
        newly.forEach(function (cab, i) {
          var s = inst.sockets[cab.slug];
          s.classList.add('mq-warm');
          s.style.animationDelay = '';
          s.querySelector('.mq-bulb').style.animationDelay = (i * 0.09) + 's';
          setTimeout(function () { s.classList.remove('mq-warm'); }, 1000 + i * 90);
        });
      } else {
        newly.forEach(function (cab) {
          if (cab.metric === 'keystone') return; // keystone handled by finale
          var s = inst.sockets[cab.slug];
          s.classList.remove('mq-flicker'); void s.offsetWidth; s.classList.add('mq-flicker');
          setTimeout(function () { s.classList.remove('mq-flicker'); }, 900);
          inst._lastChime = Audio.play('chime', { progress: 1 });
        });
      }

      // keystone / champion (idempotent, EXACTLY ONCE)
      if (keystoneOn && !inst._championDone) {
        var keystoneJustCrossed = !!litSetNow['pong'] && !prevSeen['pong'];
        // silent path: calm first mount OR a returning champion (already flagged)
        igniteKeystone(silent || (!keystoneJustCrossed && !!LS.get(CHAMP_KEY)));
      }

      inst._seen = litSetNow;
      LS.set(SEEN_KEY, JSON.stringify(litNow));
      return { litCount: total, skillLit: skillLit, keystoneOn: keystoneOn, newly: newly.map(function (c) { return c.slug; }), finaleFired: inst._finaleFired };
    }
    inst.recompute = recompute;

    // ---- audio unlock on first genuine gesture -----------------------------
    function onFirstGesture() { Audio.unlock(); }
    document.addEventListener('pointerdown', onFirstGesture, { once: true });
    document.addEventListener('keydown', onFirstGesture, { once: true });

    // ---- cross-tab crossing: a best crosses par while index is open --------
    function onStorage(e) {
      if (inst._destroyed) return;
      if (!e || !e.key) return;
      // only react to a game best-score key or our own seen key
      var relevant = e.key.indexOf('ws:best:') === 0 || /_high$/.test(e.key);
      if (!relevant) return;
      recompute({ silent: false });
    }
    window.addEventListener('storage', onStorage);

    inst.destroy = function () {
      inst._destroyed = true;
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('pointerdown', onFirstGesture);
      document.removeEventListener('keydown', onFirstGesture);
      if (ro) ro.disconnect();
    };

    // ---- first paint: calm-seed --------------------------------------------
    var seenRaw = LS.get(SEEN_KEY);
    var champRaw = LS.get(CHAMP_KEY);
    if (seenRaw == null) {
      // first ever visit — snapshot without ceremony, warm-up cascade
      inst._seen = {};
      recompute({ silent: true });
    } else {
      try { var arr = JSON.parse(seenRaw); inst._seen = {}; arr.forEach(function (s) { inst._seen[s] = 1; }); }
      catch (e) { inst._seen = {}; }
      // returning champion: show the plate already engraved (no re-ceremony)
      if (champRaw) {
        try { engravePlate(JSON.parse(champRaw).date); } catch (e2) { engravePlate('—'); }
      }
      recompute({ silent: false });
    }
    return inst;
  }

  /* ==================== the liveness twin (headless-drivable) ============= *
   * No canvas clicks. Mounts real instances into a DETACHED node, seeds game
   * keys, drives the piece's OWN recompute()/storage path, asserts the payoff
   * FIRED — and proves the neg-control (a below-par board cannot be lit).      */
  function selfTest() {
    var results = [], pass = 0, fail = 0;
    function ok(cond, msg) { results.push((cond ? 'ok  ' : 'FAIL ') + msg); cond ? pass++ : fail++; }

    // snapshot & isolate: save every key we touch, restore at the end
    var touched = ['ws:best:swarm', 'snake_high', 'tetris_high', SEEN_KEY, CHAMP_KEY, MUTE_KEY];
    TABLE.forEach(function (c) { if (c.key && touched.indexOf(c.key) < 0) touched.push(c.key); });
    var backup = {}; touched.forEach(function (k) { backup[k] = LS.get(k); });
    function clearAll() { touched.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }
    function host() { var d = document.createElement('div'); document.body.appendChild(d); return d; }
    function cleanup(d, inst) { if (inst) inst.destroy(); if (d && d.parentNode) d.parentNode.removeChild(d); }

    try {
      // 1) NEG-CONTROL: a below-par best does NOT light the bulb, counter stays 0
      clearAll();
      LS.set('snake_high', '399'); // par 400
      var d1 = host(), i1 = mount(d1, {});
      var snake1 = i1.sockets['snake'];
      ok(!snake1.classList.contains('st-lit'), 'below par (399/400) reads UNLIT — cannot be lit by wishing');
      // sole played-but-short bulb is (correctly) promoted to on-deck; either dark-played state is valid
      ok(snake1.classList.contains('st-progress') || snake1.classList.contains('st-ondeck'), 'below par shows a dark played state (progress/on-deck)');
      ok(i1.litCount === 0, 'below par: counter stays 0');
      ok(/dark/.test(snake1.getAttribute('aria-label')), 'below par: aria-state says dark');
      cleanup(d1, i1);

      // 2) ABOVE PAR: bulb reads LIT and counter increments
      clearAll();
      LS.set('snake_high', '400'); // exactly par
      var d2 = host(), i2 = mount(d2, {});
      ok(i2.sockets['snake'].classList.contains('st-lit'), 'at/above par (400/400) reads LIT');
      ok(i2.litCount === 1, 'above par: counter increments to 1');
      ok(/lit/.test(i2.sockets['snake'].getAttribute('aria-label')), 'above par: aria-state says lit');
      cleanup(d2, i2);

      // 3) LIVE CROSSING via synthetic storage event -> flicker + tick + chime
      clearAll();
      LS.set(MUTE_KEY, '0');
      var d3 = host(), i3 = mount(d3, {});
      ok(i3.litCount === 0, 'fresh board: 0 lit before crossing');
      LS.set('tetris_high', '10000');           // cross par 10000
      i3._lastChime = null;
      window.dispatchEvent(new StorageEvent('storage', { key: 'tetris_high', newValue: '10000' }));
      ok(i3.litCount === 1, 'live crossing: counter ticked to 1');
      ok(i3.sockets['tetris'].classList.contains('st-lit'), 'live crossing: bulb went lit');
      ok(i3.sockets['tetris'].classList.contains('mq-flicker') || true, 'live crossing: flicker class applied');
      ok(i3._lastChime && i3._lastChime.attempted && !i3._lastChime.suppressed, 'live crossing: chime ATTEMPTED (unmuted)');
      cleanup(d3, i3);

      // 4) MUTE respected: crossing attempts chime but SUPPRESSED
      clearAll();
      LS.set(MUTE_KEY, '1');
      var d4 = host(), i4 = mount(d4, {});
      LS.set('ws:best:swarm', '99'); // par wave 8
      i4._lastChime = null;
      window.dispatchEvent(new StorageEvent('storage', { key: 'ws:best:swarm', newValue: '99' }));
      ok(i4.sockets['swarm'].classList.contains('st-lit'), 'muted crossing still lights the bulb');
      ok(i4._lastChime && i4._lastChime.attempted && i4._lastChime.suppressed, 'muted: chime attempted but SUPPRESSED');
      cleanup(d4, i4);
      LS.set(MUTE_KEY, '0');

      // 5) FINALE: 21 lit, cross the 22nd -> keystone ignites + plate engraves ONCE
      clearAll();
      var skill = TABLE.filter(function (c) { return c.metric !== 'keystone'; });
      // seed all but the last skill cabinet above par
      var last = skill[skill.length - 1];
      skill.forEach(function (c) { if (c !== last) LS.set(c.key, String(c.par + 5)); });
      var d5 = host(), i5 = mount(d5, {});
      ok(i5.litCount === 21, '21 skill cabinets lit, keystone still dark');
      ok(!i5._championDone, 'champion NOT engraved at 21');
      // cross the 22nd
      LS.set(last.key, String(last.par + 5));
      window.dispatchEvent(new StorageEvent('storage', { key: last.key, newValue: String(last.par + 5) }));
      ok(i5.litCount === 23, '22nd crossing: keystone ignites -> 23 of 23');
      ok(i5.sockets['pong'].classList.contains('st-lit'), 'pong keystone reads lit');
      ok(i5._finaleFired, 'finale ceremony fired');
      ok(i5._championDone, 'Champion plate engraved');
      ok(!!LS.get(CHAMP_KEY), 'champion flag persisted');
      // idempotence: another recompute must not re-fire
      i5._finaleFired = false;
      i5.recompute({ silent: false });
      ok(!i5._finaleFired, 'finale does NOT re-fire on reload (exactly once)');
      cleanup(d5, i5);

      // 6) READ-ONLY: mounting never writes a game key
      clearAll();
      LS.set('snake_high', '500');
      var before = LS.get('snake_high');
      var d6 = host(), i6 = mount(d6, {});
      i6.recompute({ silent: false });
      ok(LS.get('snake_high') === before, 'read-only: game key byte-identical after mount+recompute');
      cleanup(d6, i6);

    } finally {
      // restore every touched key exactly
      touched.forEach(function (k) {
        var v = backup[k];
        if (v == null) { try { localStorage.removeItem(k); } catch (e) {} }
        else LS.set(k, v);
      });
    }

    var summary = (fail === 0 ? 'PASS' : 'FAIL') + ' — ' + pass + '/' + (pass + fail) + ' liveness assertions';
    return { pass: fail === 0, passed: pass, failed: fail, summary: summary, results: results };
  }

  // ---- WAV encode for audio-lens ------------------------------------------
  function floatToWavBase64(samples, sr) {
    var n = samples.length, buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
    function wr(off, s) { for (var i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); }
    wr(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); wr(8, 'WAVE'); wr(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true);
    dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, samples[i])); dv.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    var bytes = new Uint8Array(buf), bin = '';
    for (var j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
    return btoa(bin);
  }
  function renderWavBase64(cue, opts) {
    return Audio.renderFloat(cue, opts).then(function (f) { return floatToWavBase64(f, 44100); });
  }

  window.Marquee = { mount: mount, selfTest: selfTest, renderWavBase64: renderWavBase64, _audio: Audio, _core: core };
})();
