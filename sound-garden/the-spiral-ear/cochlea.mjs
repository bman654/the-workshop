/* ══════════════════════════════════════════════════════════════════════════
   cochlea.mjs — the inner ear as a fluid-loaded membrane.  DOM-free.

   THREE NUMBERS ARE TYPED IN AND NOTHING ELSE IS:

     · a membrane STIFFNESS that falls by a factor of e every 2.5 mm
       (equivalently: the local resonance drops three decades over 35 mm),
     · a membrane MASS per unit area that does not change with place,
     · a damping ratio that does not change with place.

   Everything the room shows falls out of those and out of the fact that the
   membrane is loaded on both faces by water:

     · a TRAVELLING WAVE that slows, shortens and piles up as it goes,
     · a peak that is NOT at the place whose resonance matches the tone,
     · a cliff apical of the peak, hundreds of dB per octave, because past
       resonance the membrane goes mass-controlled and the wavenumber turns
       real — the wave stops propagating and simply decays,
     · therefore a shadow that spreads UPWARD in frequency and not downward,
     · therefore a travel delay that is longer for low notes than high,
     · therefore two sounds with THE SAME MAGNITUDE SPECTRUM that the ear
       answers very differently, because one of them arrives in step with
       its own delays and the other does not.

   THE MODEL.  Classical one-dimensional ("long-wave") cochlear transmission
   line.  p(x) is the pressure difference across the partition; the membrane
   is a damped oscillator per unit area with impedance

        Z(x, w) = R(x) + j( w M - S(x)/w )

   and incompressible fluid in the two scalae gives

        d2p/dx2 = (2 rho j w / H) * p / Z(x, w) = k2(x) p .

   Boundary conditions: a stapes that is a velocity source at x = 0
   (dp/dx = -2 rho j w v_st) and a helicotrema that shorts the two scalae at
   x = L (p = 0).  Solved as a complex tridiagonal system.

   The transient response is exact linear superposition: FFT the stimulus,
   multiply by the transfer function of every place, inverse FFT.  The twin
   also integrates the same system directly in the time domain, so the two
   entirely different solvers can be made to agree.

   No backtick appears in this file, on purpose: it is inlined verbatim.
   ══════════════════════════════════════════════════════════════════════════ */

export const PARAM = Object.freeze({
  L:      0.035,     /* m      basilar membrane length, base to helicotrema   */
  rho:    1000,      /* kg/m3  perilymph                                       */
  H:      1.0e-3,    /* m      effective scala height (area / BM width)        */
  M:      0.035,     /* kg/m2  membrane mass per unit area — CONSTANT          */
  fBase:  16000,     /* Hz     local resonance at x = 0                        */
  fApex:  16,        /* Hz     local resonance at x = L  (=> 3 decades)        */
  zeta:   0.05,      /* -      damping ratio — CONSTANT                        */
  wBase:  0.00012,   /* m      membrane width at the base (drawing only)       */
  wApex:  0.00050    /* m      membrane width at the apex (drawing only)       */
});

/* ── the three typed-in profiles ─────────────────────────────────────────── */

/** local undamped resonance, rad/s, at distance x metres from the stapes */
export function omega0(x, P = PARAM) {
  return 2 * Math.PI * P.fBase * Math.pow(P.fApex / P.fBase, x / P.L);
}
/** local resonance in Hz — the "characteristic frequency" of a place */
export function cfAt(x, P = PARAM) { return omega0(x, P) / (2 * Math.PI); }
/** the inverse: the place whose resonance is f */
export function placeOfCF(f, P = PARAM) {
  return P.L * Math.log(f / P.fBase) / Math.log(P.fApex / P.fBase);
}
/** membrane stiffness per unit area, N/m3 */
export function stiffness(x, P = PARAM) { const w = omega0(x, P); return P.M * w * w; }
/** membrane resistance per unit area, kg/(m2 s) */
export function resistance(x, P = PARAM) { return 2 * P.zeta * P.M * omega0(x, P); }

/** how far apart two places are, in metres, whose resonances differ by an octave */
export function octaveMillimetres(P = PARAM) {
  return 1000 * P.L * Math.LN2 / Math.log(P.fBase / P.fApex);
}

/* ── the grid ─────────────────────────────────────────────────────────────── */

/**
 * Precompute everything that does not depend on frequency.
 * n = number of intervals; the grid has n+1 nodes, x[0]=0 (stapes),
 * x[n]=L (helicotrema).
 */
export function makeGrid(n = 1024, P = PARAM) {
  const N = n + 1, dx = P.L / n;
  const x = new Float64Array(N), S = new Float64Array(N), R = new Float64Array(N),
        w0 = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    x[i] = i * dx;
    w0[i] = omega0(x[i], P);
    S[i] = P.M * w0[i] * w0[i];
    R[i] = 2 * P.zeta * P.M * w0[i];
  }
  return { n, N, dx, x, S, R, w0, P, fluid: 2 * P.rho / P.H };
}

/* ── the steady-state solve ───────────────────────────────────────────────── */

/* complex tridiagonal Thomas solve, arrays interleaved (re, im).
   a[i] P[i-1] + b[i] P[i] + c[i] P[i+1] = d[i]                              */
function thomasC(N, a, b, c, d, out, cp, dp) {
  /* forward sweep */
  let br = b[0], bi = b[1], den = br * br + bi * bi;
  cp[0] = (c[0] * br + c[1] * bi) / den;
  cp[1] = (c[1] * br - c[0] * bi) / den;
  dp[0] = (d[0] * br + d[1] * bi) / den;
  dp[1] = (d[1] * br - d[0] * bi) / den;
  for (let i = 1; i < N; i++) {
    const i2 = i * 2, p2 = i2 - 2;
    const ar = a[i2], ai = a[i2 + 1];
    /* m = b - a*cp[i-1] */
    const mr = b[i2] - (ar * cp[p2] - ai * cp[p2 + 1]);
    const mi = b[i2 + 1] - (ar * cp[p2 + 1] + ai * cp[p2]);
    const md = mr * mr + mi * mi;
    cp[i2]     = (c[i2] * mr + c[i2 + 1] * mi) / md;
    cp[i2 + 1] = (c[i2 + 1] * mr - c[i2] * mi) / md;
    /* rhs = d - a*dp[i-1] */
    const rr = d[i2] - (ar * dp[p2] - ai * dp[p2 + 1]);
    const ri = d[i2 + 1] - (ar * dp[p2 + 1] + ai * dp[p2]);
    dp[i2]     = (rr * mr + ri * mi) / md;
    dp[i2 + 1] = (ri * mr - rr * mi) / md;
  }
  /* back substitution */
  out[(N - 1) * 2] = dp[(N - 1) * 2];
  out[(N - 1) * 2 + 1] = dp[(N - 1) * 2 + 1];
  for (let i = N - 2; i >= 0; i--) {
    const i2 = i * 2, n2 = i2 + 2;
    out[i2]     = dp[i2]     - (cp[i2] * out[n2] - cp[i2 + 1] * out[n2 + 1]);
    out[i2 + 1] = dp[i2 + 1] - (cp[i2] * out[n2 + 1] + cp[i2 + 1] * out[n2]);
  }
  return out;
}

/** scratch buffers so a sweep of a thousand frequencies allocates nothing */
export function makeSolver(grid) {
  const N = grid.N;
  return {
    grid,
    a: new Float64Array(N * 2), b: new Float64Array(N * 2),
    c: new Float64Array(N * 2), d: new Float64Array(N * 2),
    cp: new Float64Array(N * 2), dp: new Float64Array(N * 2),
    p: new Float64Array(N * 2), v: new Float64Array(N * 2)
  };
}

/**
 * Solve the transmission line at one angular frequency.
 * Returns { p, v } as interleaved complex arrays over the grid, for a stapes
 * velocity of 1 m/s.  With opt.uncoupled the fluid is removed: every place
 * then sees the same pressure and the membrane is a bank of independent
 * resonators.  That is the negative control and it is one branch.
 */
export function solveAt(sol, omega, opt) {
  const g = sol.grid, N = g.N, dx = g.dx, inv2 = 1 / (dx * dx);
  const uncoupled = !!(opt && opt.uncoupled);
  const { a, b, c, d, p, v } = sol;

  if (omega === 0) { p.fill(0); v.fill(0); return { p, v }; }

  if (uncoupled) {
    /* every place driven by the same pressure; pick the pressure the coupled
       model would need at the stapes for the same drive, so the two curves
       are comparable in level: p = 2 rho / (H) * v_st / (j w) * L is arbitrary.
       We simply use unit pressure — only the SHAPE of this control matters. */
    for (let i = 0; i < N; i++) {
      p[i * 2] = 1; p[i * 2 + 1] = 0;
    }
  } else {
    /* interior rows */
    for (let i = 1; i < N - 1; i++) {
      const i2 = i * 2;
      /* Z = R + j (w M - S/w) */
      const zr = g.R[i], zi = omega * g.P.M - g.S[i] / omega;
      const zm = zr * zr + zi * zi;
      /* k2 = fluid * j w / Z = fluid*w * (j / Z) = fluid*w*(zi + j zr)/|Z|^2 */
      const k2r = g.fluid * omega * (zi / zm);
      const k2i = g.fluid * omega * (zr / zm);
      a[i2] = inv2; a[i2 + 1] = 0;
      b[i2] = -2 * inv2 - k2r; b[i2 + 1] = -k2i;
      c[i2] = inv2; c[i2 + 1] = 0;
      d[i2] = 0; d[i2 + 1] = 0;
    }
    /* row 0: stapes velocity source, dp/dx = -2 rho j w v_st, v_st = 1 */
    {
      const zr = g.R[0], zi = omega * g.P.M - g.S[0] / omega;
      const zm = zr * zr + zi * zi;
      const k2r = g.fluid * omega * (zi / zm);
      const k2i = g.fluid * omega * (zr / zm);
      const gr = 0, gi = -2 * g.P.rho * omega;      /* dp/dx at the stapes */
      a[0] = 0; a[1] = 0;
      b[0] = -2 * inv2 - k2r; b[1] = -k2i;
      c[0] = 2 * inv2; c[1] = 0;
      d[0] = 2 * gr / dx; d[1] = 2 * gi / dx;
    }
    /* row N-1: helicotrema, p = 0 */
    {
      const i2 = (N - 1) * 2;
      a[i2] = 0; a[i2 + 1] = 0;
      b[i2] = 1; b[i2 + 1] = 0;
      c[i2] = 0; c[i2 + 1] = 0;
      d[i2] = 0; d[i2 + 1] = 0;
    }
    thomasC(N, a, b, c, d, p, sol.cp, sol.dp);
  }

  /* membrane velocity v = p / Z */
  for (let i = 0; i < N; i++) {
    const i2 = i * 2;
    const zr = g.R[i], zi = omega * g.P.M - g.S[i] / omega;
    const zm = zr * zr + zi * zi;
    v[i2]     = (p[i2] * zr + p[i2 + 1] * zi) / zm;
    v[i2 + 1] = (p[i2 + 1] * zr - p[i2] * zi) / zm;
  }
  return { p, v };
}

/** |v| along the membrane for a pure tone — the excitation pattern */
export function envelopeAt(sol, freq, opt) {
  const { v } = solveAt(sol, 2 * Math.PI * freq, opt);
  const N = sol.grid.N, e = new Float64Array(N);
  for (let i = 0; i < N; i++) e[i] = Math.hypot(v[i * 2], v[i * 2 + 1]);
  return e;
}

/** index and place (metres) of the largest membrane velocity for a tone */
export function peakOf(sol, freq, opt) {
  const e = envelopeAt(sol, freq, opt);
  let bi = 0;
  for (let i = 1; i < e.length; i++) if (e[i] > e[bi]) bi = i;
  /* parabolic refinement on the log envelope */
  let xp = sol.grid.x[bi];
  if (bi > 0 && bi < e.length - 1) {
    const l = Math.log(e[bi - 1] + 1e-300), m = Math.log(e[bi] + 1e-300),
          r = Math.log(e[bi + 1] + 1e-300);
    const den = l - 2 * m + r;
    if (den !== 0) xp += sol.grid.dx * (0.5 * (l - r) / den);
  }
  return { index: bi, x: xp, amp: e[bi], env: e };
}

/**
 * Travel delay: the group delay of the transfer function from stapes velocity
 * to membrane velocity, evaluated AT THE PEAK PLACE of that same tone.
 * Central difference in frequency; returns seconds.
 */
export function travelDelay(sol, freq, opt) {
  const df = Math.max(0.5, freq * 0.002);
  const pk = peakOf(sol, freq, opt);
  const i2 = pk.index * 2;
  const lo = solveAt(sol, 2 * Math.PI * (freq - df), opt);
  const pl = Math.atan2(lo.v[i2 + 1], lo.v[i2]);
  const hi = solveAt(sol, 2 * Math.PI * (freq + df), opt);
  const ph = Math.atan2(hi.v[i2 + 1], hi.v[i2]);
  let dphi = ph - pl;
  while (dphi > Math.PI) dphi -= 2 * Math.PI;
  while (dphi < -Math.PI) dphi += 2 * Math.PI;
  return { delay: -dphi / (2 * Math.PI * 2 * df), x: pk.x, index: pk.index };
}

/**
 * Total phase accumulated by the travelling wave from the stapes to the peak,
 * in cycles.  Unwrapped along x, so it counts real ripples, not a residue.
 */
export function phaseCycles(sol, freq, opt) {
  const { v } = solveAt(sol, 2 * Math.PI * freq, opt);
  const pk = peakOf(sol, freq, opt);
  let prev = Math.atan2(v[1], v[0]), acc = 0;
  for (let i = 1; i <= pk.index; i++) {
    let ph = Math.atan2(v[i * 2 + 1], v[i * 2]);
    let d = ph - prev;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    acc += d; prev = ph;
  }
  return -acc / (2 * Math.PI);
}

/**
 * The tuning curve OF ONE PLACE: how that place answers every frequency.
 * Returns { f, mag } arrays over nOct octaves either side of the place's own
 * best frequency.  This is the curve whose two flanks are wildly unequal.
 */
export function tuningCurve(sol, index, fLo, fHi, steps, opt) {
  const f = new Float64Array(steps), mag = new Float64Array(steps);
  for (let i = 0; i < steps; i++) {
    const fr = fLo * Math.pow(fHi / fLo, i / (steps - 1));
    const r = solveAt(sol, 2 * Math.PI * fr, opt);
    f[i] = fr;
    mag[i] = Math.hypot(r.v[index * 2], r.v[index * 2 + 1]);
  }
  return { f, mag };
}

/* ── FFT (radix-2, in place, interleaved complex) ─────────────────────────── */

export function fft(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ar + br; im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/* ── the transient field, by exact superposition ──────────────────────────── */

/**
 * Answer of the whole membrane to an arbitrary stimulus.
 *
 *   stim   Float64Array of stapes velocity samples, length a power of two
 *   fs     sample rate of that array
 *   places array of grid indices to report (the render only needs a few hundred)
 *
 * Returns { t, places, field } where field is a Float64Array of
 * places.length * nT samples, row-major by place: the real membrane velocity.
 * This is not an approximation — the system is linear and this is its exact
 * response, up to the circular wrap of the FFT (keep the buffer long).
 */
export function transientField(sol, stim, fs, places, opt) {
  const nT = stim.length, half = nT >> 1;
  const sr = Float64Array.from(stim), si = new Float64Array(nT);
  fft(sr, si, false);

  const nP = places.length;
  const field = new Float64Array(nP * nT);
  const accR = new Float64Array(nP * nT), accI = new Float64Array(nP * nT);

  for (let k = 1; k <= half; k++) {
    const omega = 2 * Math.PI * k * fs / nT;
    const { v } = solveAt(sol, omega, opt);
    const xr = sr[k], xi = si[k];
    for (let q = 0; q < nP; q++) {
      const i2 = places[q] * 2;
      const hr = v[i2], hi = v[i2 + 1];
      const yr = xr * hr - xi * hi, yi = xr * hi + xi * hr;
      accR[q * nT + k] = yr; accI[q * nT + k] = yi;
      if (k < half) {                       /* hermitian mirror */
        accR[q * nT + (nT - k)] = yr; accI[q * nT + (nT - k)] = -yi;
      }
    }
  }
  const rowR = new Float64Array(nT), rowI = new Float64Array(nT);
  for (let q = 0; q < nP; q++) {
    rowR.set(accR.subarray(q * nT, q * nT + nT));
    rowI.set(accI.subarray(q * nT, q * nT + nT));
    fft(rowR, rowI, true);
    field.set(rowR, q * nT);
  }
  const t = new Float64Array(nT);
  for (let i = 0; i < nT; i++) t[i] = i / fs;
  return { t, places, field, nT };
}

/* ── the two stimuli that a spectrum analyser cannot tell apart ───────────── */

/** a band-limited click: flat magnitude from fLo to fHi, zero phase */
export function makeClick(n, fs, fLo, fHi) {
  const re = new Float64Array(n), im = new Float64Array(n), half = n >> 1;
  for (let k = 1; k <= half; k++) {
    const f = k * fs / n;
    const a = (f >= fLo && f <= fHi) ? 1 : 0;
    re[k] = a; im[k] = 0;
    if (k < half) { re[n - k] = a; im[n - k] = 0; }
  }
  fft(re, im, true);
  /* centre it so the (symmetric) click is not split across the wrap */
  const out = new Float64Array(n), shift = n >> 3;
  for (let i = 0; i < n; i++) out[(i + shift) % n] = re[i];
  return normalise(out);
}

/**
 * The same click with its phases rearranged so that every frequency arrives
 * at its own place at the same instant.  The delays are MEASURED off the
 * model, not fitted: g(f) = tauMax - travelDelay(f), integrated into a phase.
 * Because this is an all-pass, the magnitude spectrum is bit-for-bit the
 * click's and (Parseval) so is the energy.
 */
export function makeChirp(sol, n, fs, fLo, fHi, opt) {
  const half = n >> 1, df = fs / n;
  /* measured travel delay on a log grid, then interpolated */
  const K = 96, tab = new Float64Array(K), ftab = new Float64Array(K);
  for (let i = 0; i < K; i++) {
    const f = fLo * Math.pow(fHi / fLo, i / (K - 1));
    ftab[i] = f;
    tab[i] = travelDelay(sol, f, opt).delay;
  }
  let tauMax = 0;
  for (let i = 0; i < K; i++) if (tab[i] > tauMax) tauMax = tab[i];
  const delayAt = (f) => {
    if (f <= ftab[0]) return tab[0];
    if (f >= ftab[K - 1]) return tab[K - 1];
    const u = Math.log(f / fLo) / Math.log(fHi / fLo) * (K - 1);
    const i = Math.min(K - 2, Math.floor(u)), fr = u - i;
    return tab[i] * (1 - fr) + tab[i + 1] * fr;
  };

  const re = new Float64Array(n), im = new Float64Array(n);
  /* phase from integrating the desired group delay g = tauMax - tau(f) */
  let phi = 0;
  const phase = new Float64Array(half + 1);
  for (let k = 1; k <= half; k++) {
    const f = k * df;
    const fc = Math.min(fHi, Math.max(fLo, f));
    phi += -2 * Math.PI * (tauMax - delayAt(fc)) * df;
    phase[k] = phi;
  }
  for (let k = 1; k <= half; k++) {
    const f = k * df;
    const a = (f >= fLo && f <= fHi) ? 1 : 0;
    const pr = Math.cos(phase[k]) * a, pi = Math.sin(phase[k]) * a;
    re[k] = pr; im[k] = pi;
    if (k < half) { re[n - k] = pr; im[n - k] = -pi; }
  }
  fft(re, im, true);
  const out = new Float64Array(n), shift = n >> 3;
  for (let i = 0; i < n; i++) out[(i + shift) % n] = re[i];
  return normalise(out);
}

function normalise(a) {
  let e = 0;
  for (let i = 0; i < a.length; i++) e += a[i] * a[i];
  const s = 1 / Math.sqrt(e / a.length);
  for (let i = 0; i < a.length; i++) a[i] *= s;
  return a;
}

/** the magnitude spectrum of a real signal, for proving two of them equal */
export function magSpectrum(sig) {
  const n = sig.length, re = Float64Array.from(sig), im = new Float64Array(n);
  fft(re, im, false);
  const half = n >> 1, out = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) out[k] = Math.hypot(re[k], im[k]);
  return out;
}

/**
 * The whole membrane's answer, summed: what a single electrode outside the
 * cochlea would see.  Peaks when many places move together.
 */
export function summedResponse(field, nP, nT) {
  const out = new Float64Array(nT);
  for (let q = 0; q < nP; q++) {
    const off = q * nT;
    for (let i = 0; i < nT; i++) out[i] += field[off + i];
  }
  return out;
}

/* ── the independent check: direct time integration ───────────────────────── */

/* real tridiagonal factorisation, reused every step */
function luReal(N, a, b, c) {
  const cp = new Float64Array(N), bp = new Float64Array(N);
  bp[0] = b[0]; cp[0] = c[0] / b[0];
  for (let i = 1; i < N; i++) {
    bp[i] = b[i] - a[i] * cp[i - 1];
    cp[i] = c[i] / bp[i];
  }
  return { a, bp, cp };
}
function luSolve(N, lu, d, out) {
  const { a, bp, cp } = lu;
  const dp = out;
  dp[0] = d[0] / bp[0];
  for (let i = 1; i < N; i++) dp[i] = (d[i] - a[i] * dp[i - 1]) / bp[i];
  for (let i = N - 2; i >= 0; i--) dp[i] -= cp[i] * dp[i + 1];
  return out;
}

/**
 * Integrate the SAME system forward in time, with no frequency domain
 * anywhere in it.  Velocity-Verlet on the membrane, with the pressure solved
 * implicitly at every step (the fluid is incompressible, so it is).
 *
 *   d2p/dx2 - (2 rho / (H M)) p = -(2 rho / (H M)) (R u + S xi)
 *
 * Returns the membrane velocity at the requested places, sampled at fsOut.
 */
export function integrate(grid, stimAccel, fsIn, K, nOut, places) {
  /* dt is an exact sub-multiple of the stimulus sample period, so the output
     lands on the SAME time base as the frequency-domain answer.  Rounding a
     free-chosen dt to the nearest output stride instead puts a four per cent
     error in the clock, which at 2 kHz is half a cycle in twenty milliseconds
     and reads as a sign error in the physics. */
  const dt = 1 / (fsIn * K), nSteps = nOut * K;
  return integrateRaw(grid, stimAccel, fsIn, nSteps, dt, places, K, nOut);
}

function integrateRaw(grid, stimAccel, fsIn, nSteps, dt, places, outStride, nOut) {
  const N = grid.N, dx = grid.dx, inv2 = 1 / (dx * dx), P = grid.P;
  const q = grid.fluid / P.M;                       /* 2 rho / (H M) */
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) { a[i] = inv2; b[i] = -2 * inv2 - q; c[i] = inv2; }
  b[0] = -2 * inv2 - q; c[0] = 2 * inv2; a[0] = 0;
  b[N - 1] = 1; a[N - 1] = 0; c[N - 1] = 0;
  const lu = luReal(N, a, b, c);

  const xi = new Float64Array(N), u = new Float64Array(N), acc = new Float64Array(N);
  const rhs = new Float64Array(N), p = new Float64Array(N);
  const nP = places.length;
  const out = new Float64Array(nP * nOut);

  const pressureFrom = (xiA, uA, aSt) => {
    for (let i = 1; i < N - 1; i++) rhs[i] = -q * (grid.R[i] * uA[i] + grid.S[i] * xiA[i]);
    rhs[0] = -q * (grid.R[0] * uA[0] + grid.S[0] * xiA[0]) + 2 * (-2 * P.rho * aSt) / dx;
    rhs[N - 1] = 0;
    luSolve(N, lu, rhs, p);
    return p;
  };

  /* symplectic (semi-implicit) Euler: first order, unconditionally tidy, and
     the point of it is that it shares NO code with the frequency domain. */
  let oi = 0;
  for (let s = 0; s < nSteps; s++) {
    const tf = s * dt * fsIn;
    const ti = Math.floor(tf), fr = tf - ti;
    const aSt = (ti + 1 < stimAccel.length)
      ? stimAccel[ti] * (1 - fr) + stimAccel[ti + 1] * fr
      : stimAccel[Math.min(stimAccel.length - 1, ti)];
    pressureFrom(xi, u, aSt);
    for (let i = 0; i < N; i++) acc[i] = (p[i] - grid.R[i] * u[i] - grid.S[i] * xi[i]) / P.M;
    for (let i = 0; i < N; i++) u[i] += acc[i] * dt;
    for (let i = 0; i < N; i++) xi[i] += u[i] * dt;
    if (s % outStride === 0 && oi < nOut) {
      for (let k = 0; k < nP; k++) out[k * nOut + oi] = u[places[k]];
      oi++;
    }
  }
  return { out, nOut, nP };
}

/* ── notes, for the keys along the membrane ───────────────────────────────── */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
/** nearest equal-tempered note name for a frequency, A4 = 440 */
export function noteName(f) {
  const n = Math.round(12 * Math.log2(f / 440)) + 69;
  return NOTE_NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
}

/**
 * The rate, in nepers per metre, at which ANY tone dies apical of its own
 * place.  Past resonance the membrane is mass-controlled, Z -> j w M, and
 *
 *      k^2 = 2 rho j w / (H j w M) = 2 rho / (H M)
 *
 * which is real, positive, and — the whole point — has no frequency in it at
 * all.  So every tone, high or low, falls off the same cliff at the same
 * rate.  The twin measures it off the solve and compares.
 */
export function apicalDecayClosedForm(P = PARAM) {
  return Math.sqrt(2 * P.rho / (P.H * P.M));
}
/** the same number in the unit a visitor can hold: dB per millimetre */
export function apicalDecayDbPerMm(P = PARAM) {
  return 20 * Math.log10(Math.E) * apicalDecayClosedForm(P) / 1000;
}
