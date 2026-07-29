/* ============================================================================
 *  THE AVIARY -- prove.js  (the Web Worker tail)
 *
 *  Never loaded on its own: the page concatenates core.mjs + this file into one
 *  Blob URL, so the measurement runs the identical arithmetic the audio thread
 *  runs, off the main thread, and the shipped page still fetches nothing.
 *
 *  It integrates.  It does not predict.  Every predicted curve on screen comes
 *  from the algebra in core.mjs; every dot comes from here.
 * ========================================================================== */

function say(o) { self.postMessage(o); }

self.onmessage = function (e) {
  if (e.data.type !== 'run') return;
  const t0 = Date.now();

  /* ── 1. where it sings: bisect the onset from rest, at each tension ────── */
  const betas = [];
  for (let i = 0; i < 9; i++) betas.push(0.012 + 0.238 * i / 8);     /* through the fold */
  for (const b of [0.30, 0.42, 0.60, 0.85, 1.15, 1.55, 2.00]) betas.push(b);
  const onset = [];
  const mo = { dt: 0.025, settle: 3000, meas: 500, thresh: 0.05, iters: 14 };
  for (let i = 0; i < betas.length; i++) {
    const b = betas[i];
    const a = measureOnset(b, { dt: mo.dt, settle: mo.settle, meas: mo.meas,
      thresh: mo.thresh, iters: mo.iters, lo: -0.02, hi: Math.min(0.6, (b + 2) * 0.4) });
    onset.push([b, a]);
    say({ type: 'progress', frac: 0.55 * (i + 1) / betas.length, stage: 'the sounding boundary' });
  }

  /* ── 2. the roof, for a few tensions ──────────────────────────────────── */
  const roof = [];
  for (const b of [0.10, 0.60, 1.40, 2.00]) {
    let r = null;
    for (let a = b + 2.30; a > b + 1.6; a -= 0.004) {
      if (sustainedAmp(a, b, { dt: 0.025, settle: 2000, meas: 400 }).amp > 0.05) { r = a; break; }
    }
    roof.push([b, r]);
  }
  say({ type: 'progress', frac: 0.68, stage: 'the roof' });

  /* ── 3. what pitch: the note the model is BORN with ───────────────────── */
  const pitch = [];
  const pb = [0.30, 0.40, 0.52, 0.66, 0.82, 1.00, 1.22, 1.48, 1.78, 2.12, 2.50];
  for (let i = 0; i < pb.length; i++) {
    const b = pb[i];
    const w = sustainedOmega(0.004, b, { dt: 0.012, settle: 4500, meas: 1600 });
    pitch.push([b, w]);
    say({ type: 'progress', frac: 0.68 + 0.32 * (i + 1) / pb.length, stage: 'the pitch at threshold' });
  }

  say({ type: 'done', onset: onset, roof: roof, pitch: pitch, ms: Date.now() - t0 });
};
