/* ══════════════════════════════════════════════════════════════════════════════
   THE SHOWING — the-errand's IMPULSE hook (WS2 · DESIGN §10 · Appendix B ch08 · T4.4).

   the-errand is NOT a Grand Tour stop (it carries no docent — it is absent from every
   thread in tools/tour/tours.js). This single hook is the ONLY tour/Showing wiring on
   the page, and it exists solely for THE SHOWING: ch08 ("THE MARBLE RUN") frames this
   page and pokes window.__tourHooks.go to pull the GO lever live while the narration
   plays over the run ("There it goes.").

   CLASS — IMPULSE (§10): a one-shot animated poke, forward-fire-only, never replayed on
   a backward seek. It drives the page's OWN entry function, App.go() — the exact
   function the GO lever's click handler (onGo -> go) invokes — so the Showing runs the
   identical fixed-timestep sim a visitor drives (the liveness-twin rule: call the real
   entry, never a synthesized click / canvas event).

   NO AUDIO NEEDED: the marble sim advances on its own rAF-driven fixed-timestep clock;
   the first-gesture audio unlock inside go() is a harmless no-op without a real gesture
   (the AudioContext stays suspended) and the run plays regardless — the same way the
   pin-barrel and double-slit acts stay silent under the estate's gesture/mute gate.

   ROBUSTNESS: the bench boots on the Bell-Ringer preset, so a payoff is already placed
   and go() runs immediately. If a visitor had cleared the board before the deck framed
   the page, load Bell-Ringer first so the poke always delivers a run rather than
   flashing the page's "add a Flag or Candle" hint. RE-ENTRANT: go() rebuilds a fresh
   world on every call, so a re-poke (a re-armed cue, a forward re-seek) simply restarts
   the run — never throws, never leaves the bench wedged.

   App is a page-global (var App = (function(){...})()); this file is forge-inlined into
   a <script> AFTER the App-defining script, and the hook only touches App at poke time,
   so ordering never bites. Block comments only (the HTML-comment-in-script forge
   landmine); no module.exports (nothing to strip on inline).
   ══════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  window.__tourHooks = window.__tourHooks || {};
  window.__tourHooks.go = function () {
    try {
      if (typeof App === 'undefined' || !App || typeof App.go !== 'function') return false;
      /* ensure a payoff sits on the board so the real go() actually runs a marble
         (go() no-ops with a hint when hasPayoff() is false) */
      var placed = (typeof App.getPlaced === 'function') ? App.getPlaced() : [];
      var hasPayoff = !!placed && placed.some(function (p) { return p && p.type === 'payoff'; });
      if (!hasPayoff && typeof App.setPreset === 'function') App.setPreset('bell-ringer');
      App.go();                                   /* the GO lever's real entry function */
      return (typeof App.mode === 'function') ? (App.mode() === 'WATCH' || App.mode() === 'DONE') : true;
    } catch (e) { return false; }
  };
})();
