/* ═══════════════════════════════════════════════════════════════════════════
   audio.js  —  STUBBED WebAudio engine + REAL brass mute chip  (window.Gate.audio)

   Phase A scaffold: NO sound sources yet (gears/creak/rain/wind/chimes come in
   Phase D). But the mute chip is wired to the SHARED estate flag NOW so the wiring
   is proven and a visitor's mute holds across the estate:
     • initial chip state ← WS.muted()
     • toggle             → WS.setMuted(v)
     • external change     → WS.onMuteChange(fn) re-syncs the chip

   When the engine lands it will gate every source on WS.muted() + the opening
   click, render via OfflineAudioContext → WAV for audio-lens verification, and
   publish window.__wsAudioCtx (so the WS chime can ride it). For now those are
   documented TODOs; the engine fns are inert no-ops.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Gate = root.Gate = root.Gate || {};
  var A = {};

  var muted = false;
  var muteSubs = [];

  /* init(): read the shared mute flag, subscribe to cross-tab changes. */
  A.init = function () {
    var WS = root.WS;
    muted = WS && WS.muted ? WS.muted() : false;
    if (WS && WS.onMuteChange) {
      WS.onMuteChange(function (on) {
        muted = on;
        for (var i = 0; i < muteSubs.length; i++) { try { muteSubs[i](on); } catch (e) {} }
      });
    }
    return muted;
  };

  A.muted = function () { return muted; };

  /* setMuted(v): write through to the shared estate flag (WS fires our subscriber
     via onMuteChange, which updates `muted` + notifies local listeners). */
  A.setMuted = function (v) {
    var WS = root.WS;
    if (WS && WS.setMuted) { WS.setMuted(!!v); }
    else {
      muted = !!v;
      for (var i = 0; i < muteSubs.length; i++) { try { muteSubs[i](muted); } catch (e) {} }
    }
    return muted;
  };

  A.toggle = function () { return A.setMuted(!muted); };

  /* onMuteChange(fn): fn(on) when the mute state changes (local or cross-tab). */
  A.onMuteChange = function (fn) { if (typeof fn === 'function') muteSubs.push(fn); };

  /* ── STUB engine surface (inert no-ops; Phase D fills these in) ──────────────
     Each will gate on `muted` + the opening click and accept an injected ctx so
     it can render offline → WAV for audio-lens. */
  A.unlock = function () { /* TODO Phase D: create/resume AudioContext on the opening click; publish window.__wsAudioCtx */ };
  A.gears = function () { /* TODO Phase D: clockwork gear bed during the 2.5s turn */ };
  A.creak = function () { /* TODO Phase D: hinge creak during the 2.5s swing */ };
  A.ambient = function () { /* TODO Phase D: one ambient bed per band (birds/rain/wind) */ };
  A.thunder = function () { /* TODO Phase D: thunder crack synced to a lightning flash */ };
  A.stopAll = function () { /* TODO Phase D: tear down all sources */ };

  Gate.audio = A;

  if (typeof module !== 'undefined' && module.exports) { module.exports = A; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
