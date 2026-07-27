/* ============================================================================
 *  THE WIND CHIMES — the AudioWorklet tail.
 *
 *  This file is NEVER loaded on its own.  The page concatenates
 *      core.mjs (with its export keywords stripped)  +  this file
 *  into one string and hands it to audioWorklet.addModule() as a Blob URL, so
 *  the shipped page still fetches nothing and the DSP running on the audio
 *  thread is the identical text Node renders WAVs from.
 *
 *  Why a worklet at all: the tubes are SIX modal resonators each, six modes
 *  apiece, and every strike lands in the middle of a 128-sample block with a
 *  velocity and a contact position the physics only just decided.  A graph of
 *  36 BiquadFilterNodes could make the notes, but it could not be handed a
 *  strike position, and it would still be an approximation of this arithmetic
 *  rather than the arithmetic itself.  Here the sound IS the model, sample by
 *  sample, off the main thread, and it does not glitch when the renderer is
 *  busy drawing six bending tubes.
 * ========================================================================== */

class ChimeProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    this.bank = new ModalBank(o.freqs, sampleRate, {
      pans: o.pans, xiHang: o.xiHang, gain: o.gain,
    });
    this.level = 0;
    this.muted = false;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'strike') this.bank.strike(m.tube, m.vel, m.xi);
      else if (m.type === 'hang') this.bank.setHang(m.xi);
      else if (m.type === 'wind') this.bank.setWind(m.v);
      else if (m.type === 'gain') this.bank.gain = m.v;
      else if (m.type === 'mute') this.muted = !!m.v;
      else if (m.type === 'poll') {
        /* the eye asks the ear how loud each mode still is */
        this.port.postMessage({ type: 'amps', amp: Array.from(this.bank.amp) });
      }
    };
  }

  process(inputs, outputs) {
    const out = outputs[0];
    const L = out[0], R = out.length > 1 ? out[1] : out[0];
    const n = L.length;
    L.fill(0); if (R !== L) R.fill(0);
    this.bank.render(L, R, n);
    /* muted still RUNS the model — so the tubes go on decaying while you are
     * not listening, and un-muting does not release a stored avalanche */
    if (this.muted) { L.fill(0); if (R !== L) R.fill(0); }
    return true;
  }
}

registerProcessor('chime', ChimeProcessor);
