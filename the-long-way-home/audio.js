/* ═══════════════════════════════════════════════════════════════════════════
   audio.js — the shared sound bus for "The Long Way Home" (in-house Web Audio).

   One AudioContext, one master bus. Three elevation-tied beds crossfade as you
   walk the ring:
     · DAY drone   — a warm low chord (root + fifth), lit when you are above the
                     horizon (the Day-world, stations I–V).
     · NIGHT pad   — a sparse, cold, high shimmer, lit in the deep (stations VI–XI).
                     Crossing GATE A dims the whole bus: the master lowpass sweeps
                     down and the day voices drop away.
     · DAWN chord  — a fuller warm major triad that SWELLS past the day drone when
                     you cross GATE B up into the Return (station XII).

   Three one-shots: a soft mote-GLIDE on each step, a page-CHIME when a leaf opens,
   and a low stone THUD under each archway as you pass through a gate.

   Everything gates on WS (the estate-wide mute) and only ever starts inside a real
   user gesture (browser autoplay policy). Vanilla, zero-dependency.
   ═══════════════════════════════════════════════════════════════════════════ */
var LWHAudio = (function () {
  'use strict';
  var ctx = null, master = null, lp = null;
  var dayGain = null, nightGain = null, dawnGain = null;
  var dayNodes = [], nightNodes = [], dawnNodes = [], lfo = null;
  var started = false, muted = false;

  function now() { return ctx ? ctx.currentTime : 0; }

  function makeOsc(type, freq, gainNode) {
    var o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    o.connect(gainNode);
    o.start();
    return o;
  }

  /* Build the three beds once, all feeding the master lowpass → master gain. */
  function build() {
    master = ctx.createGain();
    master.gain.value = 0.0;
    lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1600;
    lp.Q.value = 0.6;
    lp.connect(master);
    master.connect(ctx.destination);

    /* DAY — warm low chord: a root + a fifth, two slightly detuned saws each,
       through a gentle lowpass already in `lp`. A slow LFO breathes the level. */
    dayGain = ctx.createGain(); dayGain.gain.value = 0.0; dayGain.connect(lp);
    var dayRoot = 110.0;                 // A2
    var dayFreqs = [dayRoot, dayRoot * 1.005, dayRoot * 1.5, dayRoot * 1.4985, dayRoot * 2];
    var dayTypes = ['sawtooth', 'sawtooth', 'triangle', 'triangle', 'sine'];
    var dayLevels = [0.16, 0.13, 0.10, 0.08, 0.05];
    for (var i = 0; i < dayFreqs.length; i++) {
      var g = ctx.createGain(); g.gain.value = dayLevels[i]; g.connect(dayGain);
      dayNodes.push(makeOsc(dayTypes[i], dayFreqs[i], g));
    }
    lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.16;
    lfo.connect(lfoG); lfoG.connect(dayGain.gain); lfo.start();

    /* NIGHT — sparse cold shimmer: high sines a touch detuned, very quiet, with a
       long feedback delay so it reads as cold air, plus a slow tremolo. */
    nightGain = ctx.createGain(); nightGain.gain.value = 0.0; nightGain.connect(lp);
    var nDelay = ctx.createDelay(1.2); nDelay.delayTime.value = 0.42;
    var nFb = ctx.createGain(); nFb.gain.value = 0.45;
    nDelay.connect(nFb); nFb.connect(nDelay); nDelay.connect(nightGain);
    var nightFreqs = [523.25, 659.25, 783.99, 987.77]; // a cold C major-ish high cluster
    var nightLevels = [0.045, 0.035, 0.03, 0.022];
    for (var j = 0; j < nightFreqs.length; j++) {
      var ng = ctx.createGain(); ng.gain.value = nightLevels[j];
      ng.connect(nightGain); ng.connect(nDelay);
      nightNodes.push(makeOsc('sine', nightFreqs[j], ng));
    }
    var ntrem = ctx.createOscillator(); ntrem.type = 'sine'; ntrem.frequency.value = 0.13;
    var ntremG = ctx.createGain(); ntremG.gain.value = 0.02;
    ntrem.connect(ntremG); ntremG.connect(nightGain.gain); ntrem.start();
    nightNodes.push(ntrem);

    /* DAWN — a fuller warm major triad (root, third, fifth, octave), brighter than
       the day drone; swells past it on the Return. */
    dawnGain = ctx.createGain(); dawnGain.gain.value = 0.0; dawnGain.connect(lp);
    var dRoot = 130.81;                  // C3
    var dawnFreqs = [dRoot, dRoot * 1.26, dRoot * 1.5, dRoot * 2, dRoot * 2.52];
    var dawnTypes = ['sawtooth', 'triangle', 'triangle', 'sine', 'sine'];
    var dawnLevels = [0.15, 0.11, 0.11, 0.07, 0.05];
    for (var k = 0; k < dawnFreqs.length; k++) {
      var dg = ctx.createGain(); dg.gain.value = dawnLevels[k]; dg.connect(dawnGain);
      dawnNodes.push(makeOsc(dawnTypes[k], dawnFreqs[k], dg));
    }
  }

  /* Start the bed inside a user gesture. Idempotent. */
  function start() {
    if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      window.__wsAudioCtx = ctx; // let the WS unlock-chime ride the same ctx
      build();
      started = true;
      if (ctx.state === 'suspended') ctx.resume();
      // fade the master in
      master.gain.cancelScheduledValues(now());
      master.gain.setValueAtTime(0.0001, now());
      master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.9, now() + 1.4);
    } catch (e) { /* audio is a bonus; never break the room */ }
  }

  function setMuted(m) {
    muted = !!m;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(now());
    master.gain.setTargetAtTime(muted ? 0.0001 : 0.9, now(), 0.2);
  }

  /* mood ∈ [0,2]: 0 = day/dusk, 1 = deep night, 2 = dawn. Crossfade the beds and
     sweep the master lowpass (dim in the deep). Called every frame; cheap. */
  function setMood(mood) {
    if (!started || !ctx) return;
    var t = now();
    var day = Math.max(0, 1 - mood);                 // 1 at mood0, 0 by mood1
    var night = Math.max(0, 1 - Math.abs(mood - 1)); // peak at mood1
    var dawn = Math.max(0, mood - 1);                // 0 until mood1, 1 at mood2
    // dawn swells FULLER than day (×1.18); night is quiet
    dayGain.gain.setTargetAtTime(day * 0.9, t, 0.25);
    nightGain.gain.setTargetAtTime(night * 0.8, t, 0.25);
    dawnGain.gain.setTargetAtTime(dawn * 1.06, t, 0.25);
    // the bus dims in the deep: lowpass sweeps from open (day/dawn) to closed (night)
    var openness = Math.max(day, dawn);              // 1 in light, 0 in deep
    var cutoff = 360 + openness * 1900;              // 360 Hz deep → ~2260 Hz lit
    lp.frequency.setTargetAtTime(cutoff, t, 0.3);
  }

  /* ── one-shots ── */
  function blip(freq, dur, type, level, attack) {
    if (!started || !ctx || muted) return;
    var t = now();
    var o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level || 0.12, t + (attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }

  // a soft mote-glide: a short upward-bending sine, very quiet
  function glide() {
    if (!started || !ctx || muted) return;
    var t = now();
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.14);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.26);
  }

  // a page-chime when a leaf opens — a high bell (two partials)
  function chime() {
    if (!started || !ctx || muted) return;
    blip(1046.5, 1.1, 'sine', 0.07, 0.006);   // C6
    blip(1567.98, 0.9, 'sine', 0.035, 0.006); // G6
  }

  // a low stone threshold thud under an archway. warm = dawn gate (brighter), else lapis.
  function thud(warm) {
    if (!started || !ctx || muted) return;
    var t = now();
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(warm ? 90 : 70, t);
    o.frequency.exponentialRampToValueAtTime(warm ? 54 : 40, t + 0.5);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    // a little noise grit for the stone
    var nb = ctx.createBufferSource();
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    nb.buffer = buf;
    var ng = ctx.createGain(); ng.gain.value = 0.12;
    var nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 300;
    o.connect(g); g.connect(master);
    nb.connect(nf); nf.connect(ng); ng.connect(master);
    o.start(t); o.stop(t + 0.74); nb.start(t);
  }

  function isStarted() { return started; }

  return {
    start: start, setMuted: setMuted, setMood: setMood,
    glide: glide, chime: chime, thud: thud, isStarted: isStarted
  };
})();
