/* ============================================================================
 *  THE AVIARY -- the AudioWorklet tail.
 *
 *  Never loaded on its own.  The page concatenates core.mjs + song.mjs (with
 *  their export keywords stripped) + this file into one string and hands it to
 *  audioWorklet.addModule() as a Blob URL, so the shipped page fetches nothing
 *  and the DSP on the audio thread is the identical text Node renders WAVs from.
 *
 *  Why a worklet.  Every voice is a stiff two-variable ODE integrated fourteen
 *  times per output sample, twice over (two syringes), and the pressure and
 *  tension driving it change continuously inside a 128-sample block.  There is
 *  no graph of BiquadFilterNodes that is this; the sound IS the model.
 * ========================================================================== */

/* ── a small Schroeder wood: four combs, two allpasses, per channel ────────── */
function Comb(n, g) { this.b = new Float32Array(n); this.i = 0; this.g = g; this.lp = 0; }
Comb.prototype.run = function (x) {
  const y = this.b[this.i];
  this.lp += (y - this.lp) * 0.42;            /* damping: leaves eat the highs */
  this.b[this.i] = x + this.lp * this.g;
  this.i = (this.i + 1) % this.b.length;
  return y;
};
function Allpass(n, g) { this.b = new Float32Array(n); this.i = 0; this.g = g; }
Allpass.prototype.run = function (x) {
  const y = this.b[this.i];
  const v = x + y * this.g;
  this.b[this.i] = v;
  this.i = (this.i + 1) % this.b.length;
  return y - this.g * v;
};
function Wood(sr, spread) {
  const s = (n) => Math.max(8, Math.round(n * sr / 44100 * spread));
  this.c = [new Comb(s(1687), 0.80), new Comb(s(1913), 0.78),
            new Comb(s(2251), 0.76), new Comb(s(2803), 0.74)];
  this.a = [new Allpass(s(347), 0.5), new Allpass(s(113), 0.5)];
}
Wood.prototype.run = function (x) {
  let y = 0;
  for (let i = 0; i < 4; i++) y += this.c[i].run(x);
  y *= 0.25;
  y = this.a[0].run(y);
  y = this.a[1].run(y);
  return y;
};

/* ── one scheduled singer ──────────────────────────────────────────────────── */
function Singer(sr, packed, opts) {
  this.sr = sr;
  this.sp = packed;
  this.bird = new Bird(sr, {
    gamma: packed.gamma, lengthM: packed.lengthM, gain: packed.gain,
    substeps: opts.substeps,
  });
  this.pan = opts.pan || 0;
  this.dist = opts.dist == null ? 1 : opts.dist;
  this.level = opts.level == null ? 1 : opts.level;
  this.active = false;
  this.state = 'rest';
  this.restLeft = 0.4 + Math.random() * 2;
  this.phrase = null; this.pi = 0; this.tg = 0; this.gap = 0;
  this.aL = A_REST; this.bL = 0.5; this.aR = A_REST; this.bR = 0.5;
  this.tgtA1 = A_REST; this.tgtB1 = 0.5; this.tgtA2 = A_REST; this.tgtB2 = 0.5;
  this.slew = Math.exp(-1 / (0.0025 * sr));   /* muscles have mass */
  this.air = 0;                                /* distance lowpass state */
  this.airK = 1 - Math.pow(0.45, this.dist);
  this.env = 0;
  this.free = false;                           /* driven from outside instead */
  this.side = 0;
}
Singer.prototype.pick = function () {
  const ph = this.sp.phrases;
  this.phrase = ph[(Math.random() * ph.length) | 0];
  this.pi = 0; this.tg = 0; this.gap = 0;
  this.state = 'sing';
};
Singer.prototype.advance = function (dt) {
  if (this.free) return;
  if (this.state === 'rest') {
    this.restLeft -= dt;
    if (this.restLeft <= 0 && this.active) this.pick();
    else { this.tgtA1 = A_REST; this.tgtA2 = A_REST; return; }
  }
  if (this.state === 'sing') {
    if (this.gap > 0) {
      this.gap -= dt; this.tgtA1 = A_REST; this.tgtA2 = A_REST;
      if (this.gap <= 0) { this.pi++; this.tg = 0; }
      else return;
    }
    if (this.pi >= this.phrase.length) {
      this.state = 'rest';
      this.restLeft = this.sp.restLo + Math.random() * (this.sp.restHi - this.sp.restLo);
      this.tgtA1 = A_REST; this.tgtA2 = A_REST; return;
    }
    const entry = this.phrase[this.pi];
    const g = this.sp.gestures[entry[0]];
    const t = this.tg / g.dur;
    if (t >= 1) { this.gap = entry[1]; this.tg = 0; this.tgtA1 = A_REST; this.tgtA2 = A_REST;
                  if (this.gap <= 0) { this.pi++; } return; }
    const p = samplePath(g.pts, t);
    this.tgtA1 = airPressure(p[0]); this.tgtB1 = p[1];
    if (g.pts2) { const q = samplePath(g.pts2, t); this.tgtA2 = airPressure(q[0]); this.tgtB2 = q[1]; }
    else { this.tgtA2 = A_REST; this.tgtB2 = p[1]; }
    this.tg += dt;
  }
};
Singer.prototype.drive = function (a1, b1, a2, b2) {
  this.tgtA1 = a1; this.tgtB1 = b1; this.tgtA2 = a2; this.tgtB2 = b2;
};
Singer.prototype.tick = function () {
  const k = this.slew;
  this.aL = this.tgtA1 + (this.aL - this.tgtA1) * k;
  this.bL = this.tgtB1 + (this.bL - this.tgtB1) * k;
  this.aR = this.tgtA2 + (this.aR - this.tgtA2) * k;
  this.bR = this.tgtB2 + (this.bR - this.tgtB2) * k;
  /* The only pressure at which the model provably cannot sound is at or below
     the Hopf line, so that -- and NOT some convenient small number -- is where
     the CPU shortcut is allowed to skip the integration.  Gating this on
     A_MIN_SING silenced every note quieter than alpha = 0.004, which is exactly
     the band the pitch claim is measured in, and it took a spectrum analyser on
     the live worklet to find it. */
  const silent = this.aL <= 0 && this.aR <= 0 && this.env < 1e-6;
  if (silent) { this.bird.lastL = 0; this.bird.lastR = 0; return 0; }
  this.bird.side = this.side;
  let s = this.bird.tick(this.aL, this.bL, this.aR, this.bR);
  const m = Math.abs(s);
  this.env = m > this.env ? m : this.env + (m - this.env) * 0.002;
  this.air += (s - this.air) * this.airK;
  return this.air * this.level;
};

/* ── the processor ─────────────────────────────────────────────────────────── */
class AviaryProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    const sub = o.substeps || 14;
    this.sr = sampleRate;
    this.dt = 1 / sampleRate;
    this.singers = [];
    const packs = o.voices || [];
    for (let i = 0; i < packs.length; i++) {
      const v = packs[i];
      this.singers.push(new Singer(sampleRate, v.sp, {
        pan: v.pan, dist: v.dist, level: v.level,
        substeps: v.hero ? sub : Math.max(8, sub - 4),
      }));
    }
    /* the hand: the visitor's own curve, driven from the main thread */
    this.hand = new Singer(sampleRate, o.handSp, { pan: 0, dist: 0.25, level: 1, substeps: sub });
    this.hand.free = true;
    this.hand.active = true;
    this.handMode = 'off';         /* off | live | loop */
    this.handPts = null; this.handPts2 = null; this.handDur = 1; this.handT = 0;
    this.handA = 0; this.handB = 0.5; this.handA2 = 0; this.handB2 = 0.5;

    this.woodL = new Wood(sampleRate, 1.0);
    this.woodR = new Wood(sampleRate, 1.13);
    this.wet = o.wet == null ? 0.26 : o.wet;
    this.master = o.gain == null ? 0.55 : o.gain;
    this.muted = false;
    this.tickCount = 0;
    this.snapEvery = Math.max(1, Math.round(sampleRate / 128 / 60));
    this.blocks = 0;

    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'mute') this.muted = !!m.v;
      else if (m.type === 'active') {
        for (let i = 0; i < this.singers.length; i++) {
          const on = m.ids.indexOf(i) >= 0;
          const s = this.singers[i];
          if (on && !s.active) s.restLeft = Math.min(s.restLeft, 0.2 + Math.random() * 2.5);
          s.active = on;
        }
      } else if (m.type === 'sing') {
        const s = this.singers[m.v]; if (s) { s.active = true; s.pick(); }
      } else if (m.type === 'side') {
        if (m.v === -1) this.hand.side = m.side;
        else { const s = this.singers[m.v]; if (s) s.side = m.side; }
      } else if (m.type === 'hand') {
        this.handMode = m.mode;
        if (m.gamma) { this.hand.bird.gamma = m.gamma;
                       this.hand.bird.L.gamma = m.gamma; this.hand.bird.R.gamma = m.gamma;
                       this.hand.bird.L.dt = m.gamma / (this.sr * this.hand.bird.L.sub);
                       this.hand.bird.R.dt = m.gamma / (this.sr * this.hand.bird.R.sub); }
        if (m.pts) { this.handPts = m.pts; this.handPts2 = m.pts2 || null;
                     this.handDur = m.dur || 1; this.handT = 0; }
        if (m.mode === 'off') { this.hand.drive(A_REST, 0.5, A_REST, 0.5); }
      } else if (m.type === 'handXY') {
        this.handA = m.a; this.handB = m.b;
        this.handA2 = m.a2 == null ? 0 : m.a2; this.handB2 = m.b2 == null ? m.b : m.b2;
      } else if (m.type === 'diag') {
        /* what the audio thread thinks it is emitting, per source. A maker
           debugging silence-that-is-not-silent will want this. */
        this.diag = true;
      } else if (m.type === 'wet') this.wet = m.v;
      else if (m.type === 'gain') this.master = m.v;
    };
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const L = out[0], R = out.length > 1 ? out[1] : out[0];
    const n = L.length;
    L.fill(0); if (R !== L) R.fill(0);
    const dt = this.dt;
    const S = this.singers;

    for (let i = 0; i < n; i++) {
      let dry = 0, dryL = 0, dryR = 0;
      for (let k = 0; k < S.length; k++) {
        const s = S[k];
        s.advance(dt);
        const v = s.tick();
        if (v === 0) continue;
        const p = s.pan;
        dryL += v * (0.5 - 0.5 * p) * 2 * 0.5;
        dryR += v * (0.5 + 0.5 * p) * 2 * 0.5;
        dry += v;
      }
      /* the hand */
      if (this.handMode === 'live') {
        this.hand.drive(this.handA, this.handB, this.handA2, this.handB2);
      } else if (this.handMode === 'loop' && this.handPts) {
        const t = this.handT / this.handDur;
        const p = samplePath(this.handPts, t);
        if (this.handPts2) { const q = samplePath(this.handPts2, t); this.hand.drive(airPressure(p[0]), p[1], airPressure(q[0]), q[1]); }
        else this.hand.drive(airPressure(p[0]), p[1], A_REST, p[1]);
        this.handT += dt; if (this.handT >= this.handDur) this.handT = 0;
      } else this.hand.drive(A_REST, this.handB, A_REST, this.handB);
      const hv = this.hand.tick();
      dryL += hv * 0.5; dryR += hv * 0.5; dry += hv;

      const w = this.wet;
      L[i] = (dryL + this.woodL.run(dry * 0.5) * w) * this.master;
      R[i] = (dryR + this.woodR.run(dry * 0.5) * w) * this.master;
    }

    if (this.diag) {
      this.diag = false;
      let mx = 0, mh = 0;
      for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(L[i]));
      const per = [];
      for (let k = 0; k < S.length; k++) per.push([S[k].env, S[k].aL, S[k].bL, S[k].side]);
      this.port.postMessage({ type: 'diag', maxL: mx, hand: [this.hand.env, this.hand.aL, this.hand.bL],
        handMode: this.handMode, wet: this.wet, master: this.master, muted: this.muted, per: per });
    }

    /* soft clip -- a wood is never louder than a wood */
    for (let i = 0; i < n; i++) {
      L[i] = Math.tanh(L[i]); if (R !== L) R[i] = Math.tanh(R[i]);
    }
    if (this.muted) { L.fill(0); if (R !== L) R.fill(0); }

    this.blocks++;
    if (this.blocks % this.snapEvery === 0) {
      const a = [], b = [], e = [], on = [];
      for (let k = 0; k < S.length; k++) {
        a.push(S[k].aL); b.push(S[k].bL); e.push(S[k].env); on.push(S[k].active ? 1 : 0);
      }
      this.port.postMessage({
        type: 'snap', a: a, b: b, env: e, on: on,
        hand: [this.hand.aL, this.hand.bL, this.hand.env, this.hand.aR, this.hand.bR],
      });
    }
    return true;
  }
}

registerProcessor('aviary', AviaryProcessor);
