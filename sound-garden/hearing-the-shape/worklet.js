/* ============================================================================
 *  THE WORKLET TAIL.  Appended to tools/modal/core.mjs (export-stripped) by the
 *  page, so ModalBank/applyMessage are already in scope here.  A classic script
 *  — no imports, no exports.
 *
 *  Two drumheads, each a bank of fourteen modes, panned a little apart so they
 *  still mix in both ears: the whole point is whether the pair BEATS, and
 *  hard-panning two tones is exactly how you make a beat inaudible.
 *  ========================================================================= */
class DrumProcessor extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const o = (opts && opts.processorOptions) || {};
    this.banks = [];
    this.pan = [-0.42, 0.42];
    this.gain = o.gain || 0.5;
    this.muted = false;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'mute') { this.muted = !!m.v; return; }
      if (m.type === 'gain') { this.gain = m.value; return; }
      if (m.type === 'pan') { this.pan = m.value; return; }
      applyMessage(this.banks, m, sampleRate);
    };
    this.mono = new Float64Array(256);
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const L = out[0], R = out[1] || out[0];
    const n = L.length;
    if (this.mono.length < n) this.mono = new Float64Array(n);
    const g = this.muted ? 0 : this.gain;
    for (let v = 0; v < this.banks.length; v++) {
      const b = this.banks[v];
      if (!b) continue;
      const buf = this.mono.subarray(0, n);
      buf.fill(0);
      b.render(buf, n);
      const p = this.pan[v] === undefined ? 0 : this.pan[v];
      const gl = g * Math.cos((p + 1) * Math.PI / 4);
      const gr = g * Math.sin((p + 1) * Math.PI / 4);
      for (let i = 0; i < n; i++) { L[i] += buf[i] * gl; R[i] += buf[i] * gr; }
    }
    /* a gentle limiter so a fistful of simultaneous strikes cannot clip */
    for (let i = 0; i < n; i++) {
      L[i] = Math.tanh(L[i]);
      R[i] = Math.tanh(R[i]);
    }
    return true;
  }
}
registerProcessor('drumhead', DrumProcessor);
