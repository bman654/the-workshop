/* ============================================================================
 *  tools/modal — A BANK OF RESONATORS.  Zero-dependency, DOM-free ESM.
 *
 *  Four letters in NEXT.md asked for this file.  The Wind Chimes wanted a
 *  resonator bank; the Aviary wanted somewhere to hang a driven oscillator;
 *  the Gaffer's Bench wanted to PING a cooled vessel and could not, so it only
 *  blew across it.  Every struck, plucked, bowed or rolled thing in this estate
 *  is the same object: a list of modes, each with a frequency, a decay and a
 *  shape, excited somewhere.  This is that object, written once.
 *
 *  DO NOT PUT A BACKTICK OR A DOLLAR-BRACE ANYWHERE IN THIS FILE, comments
 *  included.  The page hands the whole text to an AudioWorklet inside a
 *  String.raw template, and one backtick in a comment ends the template early
 *  and kills the worklet with a SyntaxError pointing at a line of prose.
 *  (That has cost this estate a debug cycle once already.)  modal.test.mjs
 *  asserts the absence.
 *
 *  ── WHAT A MODE IS ─────────────────────────────────────────────────────────
 *  Anything that vibrates linearly about a rest state solves the same equation
 *  in each of its normal coordinates:
 *
 *        q'' + (2/tau) q' + omega^2 q = f(t)
 *
 *  so a mode is exactly three numbers: a frequency, a decay time, and how
 *  strongly a given push moves it.  Discretised at a sample rate, that is a
 *  two-pole IIR filter, which is the cheapest useful thing in audio:
 *
 *        y[n] = 2 r cos(theta) y[n-1]  -  r^2 y[n-2]  +  x[n]
 *
 *  with theta = 2 pi f / fs and r = exp(-1 / (tau fs)).  Its impulse response
 *  is r^n sin((n+1) theta) / sin(theta) — a decaying sinusoid at exactly f,
 *  which is why the bank needs no oscillators, no wavetables and no tuning.
 *  Feeding it an impulse rings it; feeding it noise bows it; feeding it another
 *  bank's output couples them.
 *
 *  ── WHY THE STRIKE IS A PULSE AND NOT AN IMPULSE ───────────────────────────
 *  A real mallet is in contact for a millisecond or two, and a finite contact
 *  is a low-pass filter on the excitation: that is the whole difference between
 *  a felt beater and a claw hammer, and you cannot fake it with a gain.  So a
 *  strike here injects a raised-cosine pulse of a chosen width.  Its spectrum
 *  is (near enough) a sinc-squared whose first null sits at 2/T, so a 2 ms
 *  contact has nothing above about a kilohertz to give.  modal.test.mjs
 *  measures that roll-off against the closed form.
 *  ========================================================================= */

export const LN1000 = Math.log(1000);

/* T60 (seconds to -60 dB) -> the per-sample pole radius. */
export function poleRadius(t60, fs) {
  if (!(t60 > 0)) return 0;
  return Math.exp(-LN1000 / (t60 * fs));
}

/* The reverse, for reporting: what T60 does a pole radius mean? */
export function radiusToT60(r, fs) {
  if (r <= 0 || r >= 1) return Infinity;
  return -LN1000 / (fs * Math.log(r));
}

/* ---------------------------------------------------------------------------
 *  THE BANK
 *
 *  Fixed capacity, flat typed arrays, no allocation after construction — it is
 *  meant to live inside an AudioWorklet process() call.
 * ------------------------------------------------------------------------ */
export class ModalBank {
  constructor(fs, capacity = 64) {
    this.fs = fs;
    this.capacity = capacity;
    this.count = 0;
    this.a1 = new Float64Array(capacity);
    this.a2 = new Float64Array(capacity);
    this.gain = new Float64Array(capacity);    /* input scale, includes sin(theta) */
    this.out = new Float64Array(capacity);     /* per-mode output scale (the shape) */
    this.y1 = new Float64Array(capacity);
    this.y2 = new Float64Array(capacity);
    this.drive = new Float64Array(capacity);   /* this strike's per-mode amplitude */
    this.freq = new Float64Array(capacity);
    this.t60 = new Float64Array(capacity);
    /* the contact pulse currently being poured in */
    this.pulse = new Float64Array(1024);
    this.pulseLen = 0;
    this.pulsePos = 0;
  }

  /* Define mode i.  outScale is how much of this mode reaches the listener —
   * for a drumhead, the eigenfunction at the microphone; usually just 1. */
  setMode(i, f, t60, outScale = 1) {
    const theta = 2 * Math.PI * f / this.fs;
    const r = poleRadius(t60, this.fs);
    this.a1[i] = 2 * r * Math.cos(theta);
    this.a2[i] = -r * r;
    this.gain[i] = Math.sin(theta);            /* unit peak impulse response */
    this.out[i] = outScale;
    this.freq[i] = f;
    this.t60[i] = t60;
    if (i >= this.count) this.count = i + 1;
  }

  setCount(n) { this.count = Math.min(n, this.capacity); }

  reset() {
    this.y1.fill(0); this.y2.fill(0); this.drive.fill(0);
    this.pulseLen = 0; this.pulsePos = 0;
  }

  /* Is anything still ringing?  Cheap, and lets a caller idle the graph. */
  peak() {
    let p = 0;
    for (let i = 0; i < this.count; i++) {
      const v = Math.abs(this.y1[i] * this.out[i]);
      if (v > p) p = v;
    }
    return p;
  }

  /* Strike.  amps[i] is how hard this blow pushes mode i (for a membrane:
   * the eigenfunction evaluated where the stick landed).  contact is the
   * mallet's contact time in seconds — the softness of the beater. */
  strike(amps, contact = 0.0015, force = 1) {
    for (let i = 0; i < this.count; i++) this.drive[i] += (amps[i] || 0) * force;
    /* L = 1 is a true single-sample impulse, and then the bank's output is
     * EXACTLY the sampled damped sinusoid — which is what lets a caller draw
     * the same motion from the closed form and know the picture matches. */
    const L = Math.max(1, Math.min(this.pulse.length, Math.round(contact * this.fs)));
    /* raised cosine, unit AREA so that force means the same at any contact time */
    let sum = 0;
    for (let k = 0; k < L; k++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * (k + 0.5) / L); this.pulse[k] = w; sum += w; }
    for (let k = 0; k < L; k++) this.pulse[k] /= sum;
    this.pulseLen = L;
    this.pulsePos = 0;
  }

  /* Render n samples, ADDING into out (Float32Array or Float64Array). */
  render(out, n, extra = null) {
    const { a1, a2, gain, y1, y2, drive, count } = this;
    for (let s = 0; s < n; s++) {
      let x = 0;
      if (this.pulsePos < this.pulseLen) x = this.pulse[this.pulsePos++];
      const e = extra ? extra[s] : 0;
      let acc = 0;
      for (let i = 0; i < count; i++) {
        const u = (x * drive[i] + e) * gain[i];
        const y = a1[i] * y1[i] + a2[i] * y2[i] + u;
        y2[i] = y1[i]; y1[i] = y;
        acc += y * this.out[i];
      }
      out[s] += acc;
    }
    if (this.pulsePos >= this.pulseLen) { this.pulseLen = 0; this.pulsePos = 0; for (let i = 0; i < count; i++) drive[i] = 0; }
    return out;
  }

  /* Modal displacement of the object right now, per mode — for drawing the
   * thing you are hearing.  y1 is the current sample of each mode. */
  displacement(into) {
    for (let i = 0; i < this.count; i++) into[i] = this.y1[i];
    return into;
  }
}

/* ---------------------------------------------------------------------------
 *  DECAY LAWS — how a real object loses each mode.
 *
 *  Radiation into air rises with frequency; internal friction is roughly flat;
 *  so a struck object's high partials always die first, and an object that
 *  keeps them is one that is not radiating (a bell in a vacuum, a string on a
 *  bare peg).  One knob, honestly named.
 * ------------------------------------------------------------------------ */
export function decayLaw(f, { t60at100 = 4.0, brightness = 0.5 } = {}) {
  /* alpha = internal + radiative*sqrt(f), the same shape the Wind Chimes uses */
  const aInt = LN1000 / t60at100 * (1 - brightness);
  const aRad = LN1000 / t60at100 * brightness / 10;
  return LN1000 / (aInt + aRad * Math.sqrt(f));
}

/* The single-sided magnitude of a raised-cosine contact pulse of length T at
 * frequency f, normalised to 1 at DC.  A closed form the twin can check the
 * rendered strike against. */
export function contactResponse(f, T) {
  const u = f * T;
  if (u < 1e-9) return 1;
  /* sinc(u)/(1-u^2) is 0/0 at u = 1 — a REMOVABLE singularity worth half.
   * Expanding about u = 1+d gives exactly 1/((1+d)(2+d)), which is 1/2 there;
   * take that branch nearby or the formula returns Infinity and a perfectly
   * good measurement looks like a failure. */
  const d = u - 1;
  if (Math.abs(d) < 1e-3) return 1 / ((1 + d) * (2 + d));
  const x = Math.PI * u;
  return Math.abs((Math.sin(x) / x) / (1 - u * u));
}

/* ---------------------------------------------------------------------------
 *  THE WORKLET SIDE
 *
 *  A page inlines this file into a String.raw and appends a processor that
 *  owns one ModalBank per voice.  Kept here so the next room does not write
 *  the scaffolding a fourth time.  MESSAGES:
 *     {type:'modes', voice, f:[], t60:[], out:[]}
 *     {type:'strike', voice, amps:[], contact, force}
 *     {type:'gain', value}
 * ------------------------------------------------------------------------ */
export function applyMessage(banks, msg, fs) {
  const v = msg.voice | 0;
  if (msg.type === 'modes') {
    let b = banks[v];
    if (!b || b.capacity < msg.f.length) { b = new ModalBank(fs, Math.max(16, msg.f.length)); banks[v] = b; }
    b.setCount(msg.f.length);
    for (let i = 0; i < msg.f.length; i++) b.setMode(i, msg.f[i], msg.t60[i], msg.out ? msg.out[i] : 1);
    return true;
  }
  if (msg.type === 'strike') {
    const b = banks[v];
    if (b) b.strike(msg.amps, msg.contact, msg.force);
    return true;
  }
  if (msg.type === 'reset') { if (banks[v]) banks[v].reset(); return true; }
  return false;
}
