/* ============================================================================
   staging.js — THE DIRECTOR.  [in-house]  Sets window.Director.

   The Toy Theatre's beating heart: it turns a PLAY (pure data) into a performance
   on the standing Shadow Theater. A play is a list of cues {at, do, args}; the
   Director advances a monotone beat, fires each cue EXACTLY once when the beat
   passes its `at`, and lets the stage's OWN critically-damped springs (the L485
   smoothCD channels) ease every cued TARGET into one flowing gesture. There is NO
   forked easing here and NO new render path — a cue only ever SETS a target on the
   Stage seam; the springs do the motion, exactly as a dragged hand would.

   Grow-by-data, not code: a company/playbill grows by adding play objects. The verb
   table is a FROZEN allow-list — loadPlay THROWS (with the offending cue index) on any
   `do` not in it, so a typo can't silently sail through.

   ABSORB (monotone-safe): if the viewer grabs a channel mid-play, that channel's cue
   STILL fires (cursor advances — the beat never stalls) but its WRITE is withheld and
   stashed in `score`; the frame the hand lets go, the latest stashed target is
   re-applied. Drag and play never fight over a channel.

   THE VERB TABLE (8) — every entry is a TARGET-setter on the Stage seam:
     pos(id,xF,yF) depth(id,d) artic(id,joint,v) lamp(D)
     show(id,bool) wash(phase)  flat(id,groove)   curtain(drop)

   LIFECYCLE — start() drops the curtain, swaps the scene UNDER cover (hides non-cast,
   hard-sets the play's setup), raises the curtain, then plays. When every cue has fired
   and the stage is at rest, the closing TABLEAU is held, the curtain falls, and an
   intermission holds it until a tap (or a timeout) returns to free-play — restoring the
   cast, the flats to their grooves, and the house lights.

   Payoff-liveness (the required verification, NOT a theorem) lives in the page as
   window.__STAGE_PLAY_TEST — it drives THIS Director headless and asserts every cue's
   effect lands. This module only has to make the play PLAY.
   ============================================================================ */
"use strict";
(function (root) {

  function S() { return root.Stage; }          // the Stage seam (index owns it)

  /* ── the frozen verb allow-list — each maps a cue onto a Stage target-setter ── */
  var VERBS = Object.freeze({
    pos:     function (a) { S().setPuppetPos(a[0], a[1], a[2]); },
    depth:   function (a) { S().setPuppetDepth(a[0], a[1]); },
    artic:   function (a) { S().articulate(a[0], a[1], a[2]); },
    lamp:    function (a) { S().setLampDistance(a[0]); },
    show:    function (a) { S().setVisible(a[0], a[1]); },
    wash:    function (a) { S().setBackdropPhase(a[0]); },
    flat:    function (a) { S().slideFlat(a[0], a[1]); },
    curtain: function (a) { S().setCurtain(a[0]); }
  });

  /* which channel a cue writes (fine-grained so absorb re-applies each of a puppet's
     withheld targets on release), and which PUPPET owns that channel (for seized()). */
  function chanKey(c) {
    if (c.do === 'lamp') return 'lamp';
    if (c.do === 'wash') return 'wash';
    if (c.do === 'curtain') return 'curtain';
    if (c.do === 'artic') return c.args[0] + ':artic:' + c.args[1];
    return c.args[0] + ':' + c.do;                       // pos/depth/show/flat, keyed per puppet+verb
  }
  function ownerOf(c) {                                   // the puppet id a cue's channel belongs to (or null for lamp/wash/curtain)
    if (c.do === 'lamp' || c.do === 'wash' || c.do === 'curtain') return null;
    return c.args[0];
  }

  /* ── the Director state ── */
  var data = null, cues = [], nCues = 0;
  var phase = 'dormant';   // dormant · entering · rising · playing · closing · intermission
  var beat = 0, cursor = 0, score = {}, heldPrev = {};
  var tableau = false, holdT = 0;
  var AUTO_RETURN = 4.0;   // intermission auto-returns to free-play after this many seconds
  var reduced = false;
  try { reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) { }

  /* ── loadPlay: validate + stable-sort by `at`, freeze cursor state ── */
  function loadPlay(playData) {
    if (!playData || !playData.cues) throw new Error('Director.loadPlay: no cues');
    var src = playData.cues;
    for (var i = 0; i < src.length; i++) {
      if (!VERBS[src[i].do]) throw new Error('Director.loadPlay: unknown verb "' + src[i].do + '" at cue ' + i);
    }
    // stable sort by `at` (decorate-sort-undecorate keeps equal-at order authored)
    cues = src.map(function (c, i) { return { c: c, i: i }; })
              .sort(function (p, q) { return (p.c.at - q.c.at) || (p.i - q.i); })
              .map(function (p) { return p.c; });
    data = playData; nCues = cues.length;
    phase = 'dormant'; beat = 0; cursor = 0; score = {}; heldPrev = {}; tableau = false; holdT = 0;
    return nCues;
  }

  /* ── seized: is a cue's channel currently held by the viewer's hand? ── */
  function seized(c) {
    var sid = S().seizedId(); if (!sid) return false;
    var key = chanKey(c);
    if (key === 'lamp') return sid.kind === 'lamp';
    if (key === 'wash' || key === 'curtain') return false;   // not grabbable
    return sid.id === ownerOf(c);
  }

  /* ── resumeReleased: the frame a held channel is let go, re-apply its stashed target ── */
  function resumeReleased() {
    var sid = S().seizedId();
    var heldId = sid ? sid.id : null, heldKind = sid ? sid.kind : null;
    for (var key in score) {
      var rec = score[key];
      var nowHeld = (key === 'lamp') ? (heldKind === 'lamp') : (rec.owner === heldId && heldId != null);
      if (heldPrev[key] && !nowHeld) VERBS[rec.cue.do](rec.cue.args);   // just released → re-apply latest target
      heldPrev[key] = nowHeld;
    }
  }

  /* ── the scene swap, done UNDER the fallen curtain (hard, the one lawful instant set) ── */
  function applyScene() {
    var cast = (data && data.cast) || [];
    var order = root.Puppets.order;
    for (var i = 0; i < order.length; i++) S().setVisible(order[i], cast.indexOf(order[i]) >= 0);
    for (var j = 0; j < order.length; j++) {             // park every flat off-stage first
      if (root.Puppets.get(order[j]).groove) S().slideFlat(order[j], 0, { animate: false });
    }
    if (data && data.setup) S().setState(data.setup, { animate: false });
  }

  /* ── the clock ── */
  function tick(dt) {
    if (phase === 'entering') {
      if (S().isCurtainDown()) { applyScene(); S().setCurtain(0); phase = 'rising'; }
      return;
    }
    if (phase === 'rising') {
      if (S().getState().curtainDrop <= 0.02) {          // curtain fully up → the play begins
        phase = 'playing'; beat = 0; cursor = 0; score = {}; heldPrev = {}; tableau = false;
      }
      return;
    }
    if (phase === 'playing') {
      beat += dt;
      while (cursor < cues.length && cues[cursor].at <= beat) {
        var c = cues[cursor];
        score[chanKey(c)] = { cue: c, owner: ownerOf(c) };
        if (!seized(c)) VERBS[c.do](c.args);
        cursor++;
      }
      resumeReleased();
      if (cursor >= cues.length && S().isResting()) { tableau = true; S().setCurtain(1); phase = 'closing'; }
      return;
    }
    if (phase === 'closing') {
      if (S().isCurtainDown() && S().isResting()) enterIntermission();
      return;
    }
    if (phase === 'intermission') {
      holdT += dt;
      if (holdT >= AUTO_RETURN) returnToFreeplay(true);
      return;
    }
  }
  function enterIntermission() { phase = 'intermission'; holdT = 0; }

  /* ── to free-play: house lights up, cast restored, flats to their grooves ── */
  function returnToFreeplay(animate) {
    if (root.Playbill) root.Playbill.setNowPlaying(null);
    S().toFreeplay({ animate: animate !== false });
    phase = 'dormant'; tableau = false; beat = 0; cursor = 0; score = {}; heldPrev = {};
  }
  function abort() { returnToFreeplay(false); }

  /* ── start a loaded play ── */
  function start() {
    if (!data) return;
    if (root.Playbill) root.Playbill.setNowPlaying(data.id);
    if (reduced) {                                        // reduced motion → jump to the closing tableau, no animation
      applyScene();
      if (data.finalState) S().setState(data.finalState, { animate: false });
      tableau = true; S().setCurtain(1, { animate: false });
      enterIntermission();
      return;
    }
    S().setCurtain(1);                                    // drop the curtain; the swap happens under cover (phase 'entering')
    phase = 'entering';
  }

  function isRunning() { return phase !== 'dormant'; }
  function isTableauReached() { return tableau; }
  function isCurtainDown() { return S().isCurtainDown(); }
  function getState() {
    return { phase: phase, beat: beat, cursor: cursor, nCues: nCues, tableau: tableau, curtainDown: isCurtainDown() };
  }

  root.Director = {
    VERBS: VERBS,
    loadPlay: loadPlay,
    start: start,
    tick: tick,
    abort: abort,
    getState: getState,
    isRunning: isRunning,
    isTableauReached: isTableauReached,
    isCurtainDown: isCurtainDown,
    measureCast: function () { return S().measureCast(); },
    // test hook — the payoff-liveness twin forces non-reduced-motion so cues actually play
    __setReduced: function (v) { var was = reduced; reduced = (v == null ? was : !!v); return was; },
    __chanKey: chanKey,
    __forged: true
  };

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
