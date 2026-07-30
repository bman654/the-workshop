/* ============================================================================
 *  THE BELFRY — worklet.js   ·   the audio-thread tail
 *
 *  bell.mjs is prepended to this file (export-stripped) to make the worklet
 *  module, so PARTIALS and bellModes are already in scope here.  That is why
 *  bell.mjs may not contain a backtick.
 *
 *  Six bells, nine modes each: fifty-four complex phasors, one rotation per
 *  sample.  A mode is struck by ADDING to its state, so a bell that is still
 *  ringing when it is struck again keeps its old sound and gains a new one,
 *  which is what a real bell does at speed and is the whole reason a peal
 *  sounds like a wash and not like a xylophone.
 *
 *  Every mode starts IN PHASE, exactly as a struck body does, so the first
 *  sample of a blow is the sum of all nine amplitudes.  The estate has been
 *  bitten by a limiter inventing partials out of exactly that, so the master
 *  bus here is scaled so the in-phase sum of the loudest possible simultaneous
 *  blow cannot reach full scale, and there is no limiter at all.
 *  ========================================================================= */

class BelfryProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = options.processorOptions || {};
    const sr = sampleRate;
    this.n = o.freqs.length;
    this.nm = PARTIALS.length;
    const N = this.n * this.nm;
    this.re = new Float32Array(N);
    this.im = new Float32Array(N);
    this.cs = new Float32Array(N);
    this.sn = new Float32Array(N);
    this.dk = new Float32Array(N);
    this.amp = new Float32Array(N);
    this.grp = new Uint8Array(N);            /* 0 hum, 1 prime, 2 upper, 3 strike */
    this.panL = new Float32Array(this.n);
    this.panR = new Float32Array(this.n);
    const KEYS = { hum: 0, prime: 1, upper: 2, strike: 3 };
    for (let b = 0; b < this.n; b++) {
      const modes = bellModes(o.freqs[b], o.t60s[b]);
      for (let k = 0; k < this.nm; k++) {
        const i = b * this.nm + k;
        const m = modes[k];
        const w = 2 * Math.PI * m.f / sr;
        /* a hair of inharmonic detune per bell, because no two castings agree */
        const d = 1 + (o.detune ? o.detune[b] : 0) * (k % 3 === 0 ? 1 : -0.6) * 0.0016;
        this.cs[i] = Math.cos(w * d);
        this.sn[i] = Math.sin(w * d);
        this.dk[i] = Math.exp(-6.9078 / (m.t60 * sr));
        this.amp[i] = m.amp;
        this.grp[i] = KEYS[m.key];
      }
      const p = o.pans[b];
      this.panL[b] = Math.cos((p + 1) * Math.PI / 4);
      this.panR[b] = Math.sin((p + 1) * Math.PI / 4);
    }
    /* the in-phase worst case: every mode of every bell struck on one sample */
    let worst = 0;
    for (let i = 0; i < N; i++) worst += this.amp[i];
    this.gain = (o.gain || 0.9) / worst;
    this.gOn = [1, 1, 1, 1];
    this.muted = !!o.muted;
    this.master = 0;
    this.port.onmessage = (e) => this.onMsg(e.data);
  }

  onMsg(d) {
    if (d.type === 'strike') {
      const b = d.bell, a = d.amp;
      for (let k = 0; k < this.nm; k++) {
        const i = b * this.nm + k;
        /* the higher partials come out of a harder blow more than the hum does:
         * a bell struck softly is duller, which is the whole difference between
         * a bell that is ringing well and one that is being nursed round */
        const bright = Math.pow(a, 0.35 + 0.22 * k / this.nm);
        this.re[i] += this.amp[i] * bright;
      }
    } else if (d.type === 'groups') {
      this.gOn = d.v.slice();
    } else if (d.type === 'mute') {
      this.muted = !!d.v;
    }
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const L = out[0], R = out[1] || out[0];
    const n = this.n, nm = this.nm;
    const re = this.re, im = this.im, cs = this.cs, sn = this.sn, dk = this.dk;
    const grp = this.grp, gOn = this.gOn;
    const g = this.muted ? 0 : this.gain;
    let peak = this.master;
    for (let s = 0; s < L.length; s++) {
      let l = 0, r = 0;
      for (let b = 0; b < n; b++) {
        let acc = 0;
        const base = b * nm;
        for (let k = 0; k < nm; k++) {
          const i = base + k;
          const x = re[i], y = im[i], d = dk[i];
          re[i] = (x * cs[i] - y * sn[i]) * d;
          im[i] = (x * sn[i] + y * cs[i]) * d;
          if (gOn[grp[i]]) acc += re[i];
        }
        l += acc * this.panL[b];
        r += acc * this.panR[b];
      }
      l *= g; r *= g;
      const m = l > r ? (l > 0 ? l : -l) : (r > 0 ? r : -r);
      if (m > peak) peak = m;
      L[s] = l; R[s] = r;
    }
    /* Report the peak of the LAST FEW QUANTA and then forget it, rather than a
     * slowly-decaying meter: a decaying meter cannot tell "the room went quiet"
     * from "the meter is still falling", which is exactly the question you ask
     * it when you are checking whether the mute works. */
    this.master = peak;
    if ((this.tick = (this.tick || 0) + 1) % 40 === 0) {
      this.port.postMessage({ type: 'peak', v: this.master });
      this.master = 0;
    }
    return true;
  }
}
registerProcessor('belfry', BelfryProcessor);
