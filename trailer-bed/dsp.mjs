// Small pure-sample DSP kit for the trailer bed renderer. Zero dependencies.

// RBJ-cookbook bandpass (constant-peak-gain) with an exponential center-freq
// sweep fc0 → fc1 across the buffer. Coefficients recomputed every 32 samples.
export function bandpassSweep(sr, x, fc0, fc1, Q){
  const y = new Float32Array(x.length);
  let b0=0,b1=0,b2=0,a1=0,a2=0;
  let x1=0,x2=0,y1=0,y2=0;
  for (let i=0;i<x.length;i++){
    if ((i & 31) === 0){
      const fc = fc0 * Math.pow(fc1/fc0, x.length>1 ? i/(x.length-1) : 0);
      const w = 2*Math.PI*Math.min(fc, sr*0.45)/sr;
      const alpha = Math.sin(w)/(2*Q);
      const a0 = 1+alpha;
      b0 =  alpha/a0; b1 = 0; b2 = -alpha/a0;
      a1 = (-2*Math.cos(w))/a0; a2 = (1-alpha)/a0;
    }
    const v = b0*x[i] + b1*x1 + b2*x2 - a1*y1 - a2*y2;
    x2=x1; x1=x[i]; y2=y1; y1=v;
    y[i]=v;
  }
  return y;
}

// one-pole lowpass coefficient for a given cutoff
export function onePoleK(sr, fc){ return 1 - Math.exp(-2*Math.PI*fc/sr); }

export function dbToLin(db){ return Math.pow(10, db/20); }
export function linToDb(x){ return 20*Math.log10(Math.max(1e-9, x)); }

// equal-power pan gains, pan ∈ [-1, 1]
export function panGains(pan){
  const a = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI/4;
  return [Math.cos(a), Math.sin(a)];
}

// add a mono voice buffer into a stereo mix at sample offset with pan + gain
export function mixIn(L, R, buf, offset, gain, pan){
  const [gL, gR] = panGains(pan);
  const end = Math.min(L.length, offset + buf.length);
  for (let i = Math.max(0, offset); i < end; i++){
    const v = buf[i - offset] * gain;
    L[i] += v * gL;
    R[i] += v * gR;
  }
}
