/* ═══════════════════════════════════════════════════════════════════════════
   THE WALL OF THE NIGHT — booth.sound.mjs
   The party's noise. Every sound is synthesised here in WebAudio: there is not
   one audio file in this piece, because the estate forges its own assets and
   never forages them.

   TWO RULES IT OBEYS:
   1. NOTHING SOUNDS UNASKED. The context is not even created until the visitor
      presses the booth's button. A page that opens silent stays silent.
   2. IT INHERITS THE LISTENER'S PREFERENCE AND INVENTS NO SECOND CONTROL. The
      estate's shared mute key (`ws:pref:muted`, the one every other room reads)
      is the only authority. There is deliberately no mute button on this page:
      a visitor who muted the estate elsewhere arrives already muted, and a
      second switch here would only let the two disagree.

   On the estate's AIR specifically: ground.md says a page that already sings
   should not wear the air chip, and this one sings. The booth brings its own
   room tone rather than mounting `tools/calendar/air.js` — which would also
   drag the calendar score's whole dependency chain into a photo booth. The
   preference wiring is the part that matters, and that is shared.
   ═══════════════════════════════════════════════════════════════════════════ */

const MUTE_KEY = 'ws:pref:muted';

function estateMuted() {
  try {
    if (typeof WS !== 'undefined' && WS && typeof WS.muted === 'function') return WS.muted();
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) { return false; }
}

export const Sound = {
  ctx: null,
  bus: null,
  toneGain: null,
  started: false,

  /* Created ONLY on the first press. */
  wake() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      this.ctx = new AC();
      this.bus = this.ctx.createGain();
      this.bus.gain.value = estateMuted() ? 0 : 0.9;
      this.bus.connect(this.ctx.destination);
      try {
        if (typeof WS !== 'undefined' && WS && WS.onMuteChange) {
          WS.onMuteChange(() => { if (this.bus) this.bus.gain.value = estateMuted() ? 0 : 0.9; });
        }
      } catch (e) {}
      return this.ctx;
    } catch (e) { return null; }
  },

  get ok() { return !!this.ctx && !estateMuted(); },

  /* ── primitives ──────────────────────────────────────────────────────── */

  noiseBuf(dur) {
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const b = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    /* a seeded-ish pink-ish noise: cheap one-pole lowpassed white */
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      last = 0.92 * last + 0.08 * w;
      d[i] = last * 2.6;
    }
    return b;
  },

  burst(dur, freq, q, gain, type) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf(dur);
    const f = this.ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t); src.stop(t + dur + 0.02);
  },

  ping(freq, dur, gain, type, at) {
    if (!this.ok) return;
    const t = this.ctx.currentTime + (at || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + dur + 0.02);
  },

  /* ── the party's seven noises ────────────────────────────────────────── */

  /* a coin dropped in a slot: the fall, three tumbling strikes, then the ring */
  coin() {
    if (!this.ok) return;
    this.burst(0.05, 2400, 2, 0.18);
    [0.10, 0.20, 0.29].forEach((d, i) => {
      this.ping(1900 - i * 260, 0.09, 0.10, 'square', d);
      this.ping(3100 - i * 340, 0.06, 0.05, 'triangle', d);
    });
    /* the ring: two detuned partials, long decay */
    this.ping(2637, 0.62, 0.11, 'sine', 0.34);
    this.ping(3951, 0.48, 0.06, 'sine', 0.35);
    this.ping(5274, 0.30, 0.03, 'sine', 0.35);
  },

  /* the capacitor charging — a rising whine, the sound of a flash getting ready */
  whine(dur, from, to) {
    if (!this.ok) return null;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'sawtooth';
    o.frequency.setValueAtTime(from || 420, t);
    o.frequency.exponentialRampToValueAtTime(to || 2100, t + dur);
    o2.frequency.setValueAtTime((from || 420) * 1.006, t);
    o2.frequency.exponentialRampToValueAtTime((to || 2100) * 1.006, t + dur);
    f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 3.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.25);
    g.gain.setValueAtTime(0.055, t + dur - 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.bus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    return g;
  },

  shutter() { if (!this.ok) return; this.burst(0.035, 3400, 1.2, 0.5); this.burst(0.09, 700, 0.9, 0.22); },

  flashPop() {
    if (!this.ok) return;
    this.burst(0.02, 6000, 0.7, 0.42);
    this.ping(90, 0.30, 0.20, 'sine');
    this.burst(0.28, 1500, 0.5, 0.10);
  },

  thwack() { if (!this.ok) return; this.burst(0.055, 1250, 0.8, 0.34); this.burst(0.12, 380, 0.6, 0.14); },

  swish(dur) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    const d = dur || 0.9;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf(d);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 1.1;
    f.frequency.setValueAtTime(320, t);
    f.frequency.linearRampToValueAtTime(1700, t + d * 0.55);
    f.frequency.linearRampToValueAtTime(420, t + d);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.10, t + d * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + d);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t); src.stop(t + d + 0.02);
  },

  /* the wet strip sliding out of the slot */
  chunk() { if (!this.ok) return; this.burst(0.13, 240, 0.7, 0.30); this.ping(140, 0.16, 0.12, 'square'); },

  /* ROOM TONE — a hall at one in the morning is not silent. Very low, endless,
     started with the rest of the sound and never stopped. */
  roomTone() {
    if (!this.ok || this.started) return;
    this.started = true;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf(4.0);
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 180; f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = 0.030;
    this.toneGain = g;
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start();
    /* a slow breath so it never reads as a stuck buffer */
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    lfo.frequency.value = 0.06; lg.gain.value = 0.012;
    lfo.connect(lg); lg.connect(g.gain);
    lfo.start();
  },
};
