// ============================================================================
//  aurora.mjs — THE NORTHERN LIGHT's engine.  Pure, DOM-free; the same math the
//  room runs and the Node twin (aurora.test.mjs) proves.  No backtick anywhere
//  in this file — it is inlined into a String.raw when the page builds its
//  GLSL lookup table.  (LANDMINES.md: a backtick in a comment ends the template
//  early and the page dies pointing at a line of prose.)
//
//  ─────────────────────────────────────────────────────────────────────────
//  THE ONE IDEA
//
//  An aurora's colour is a CLOCK.  An excited atom holds its photon for a
//  characteristic time tau; if a collision reaches it first, the energy goes
//  to heat and no light is made.  So a state with a LONG lifetime can only
//  shine where the air is thin, and a state with a SHORT one can shine much
//  deeper.  Atomic oxygen has two of them:
//
//      O(1S) -> 557.7 nm  green    tau ~   0.75 s   half-quenched at  85 km
//      O(1D) -> 630.0 nm  red      tau ~ 117    s   half-quenched at 295 km
//
//  That single number also decides how fast each colour can MOVE.  Green keeps
//  up with a flickering ray; red is a two-minute smear that arrives late and
//  outstays the beam that made it.  One lifetime, two visible consequences —
//  where the colour lives, and how fast it can change.  That is the room.
//
//  ─────────────────────────────────────────────────────────────────────────
//  WHAT IS DERIVED HERE AND WHAT IS AN INPUT
//
//  DERIVED (no fitting; the twin re-proves each):
//    * The atmosphere above 120 km: per-species diffusive equilibrium
//      integrated through a Bates temperature profile.  Compared OUT OF SAMPLE
//      against the US Standard Atmosphere 1976 mass-density column.
//    * The energy-deposition profile of a precipitating electron beam.  A
//      range-energy law + the continuous-slowing-down approximation + an
//      isotropic downward pitch-angle distribution gives a normalised
//      dissipation function Lambda(x) whose integral is EXACTLY 1 — proved
//      analytically in the comment on lambdaNorm(), checked numerically.
//    * Quenching altitudes, from published radiative lifetimes and quenching
//      rate coefficients.  Nothing is tuned to make them land where they land.
//    * The green line's CEILING, from the Barth mechanism: O(1S) is made by
//      energy transfer from metastable N2(A), so its production follows the
//      nitrogen fraction and dies out above 200 km where the air is atomic.
//    * The whole shape of the red/green ratio against beam energy.
//    * The rise and fall times of every colour, from the same lifetimes.
//    * The colour on the screen: line spectrum -> CIE 1931 -> sRGB, through
//      the estate's own tools/blackbody/core.mjs observer, with the amount of
//      desaturation the sRGB gamut forces reported rather than hidden.
//
//  INPUT (stated, not claimed):
//    * The species densities at and below 120 km — a short table.
//    * Rate coefficients, lifetimes, the range-energy law, 35 eV per ion pair.
//    * ONE brightness anchor per emission: the efficiencies below are set so
//      that a 1 erg/cm2/s Maxwellian beam makes about a kilorayleigh of green,
//      which is the definition of a nominal IBC-II arc.  The LEVEL of the
//      red/green ratio carries that anchor; its SLOPE does not.
//
//  NOT MODELLED, and said out loud on the page:
//    * Backscatter (an isotropic beam loses 10-30% of its energy back to
//      space).  This room deposits all of it, so it runs bright.
//    * Electron quenching of O(1D) (matters above ~300 km in a bright arc).
//    * Proton aurora, and everything the magnetosphere does upstream of the
//      loss cone.  The beam is a boundary condition here.
// ============================================================================

import { cie1931 } from '../../tools/spectrum/wavelength.mjs';
import { bbXYZtoLinearRGB, bbEncode } from '../../tools/blackbody/core.mjs';

/* ── physical constants ──────────────────────────────────────────────────── */
const KB      = 1.380649e-23;       // J/K            (exact)
const AMU     = 1.66053906660e-27;  // kg
const G0      = 9.80665;            // m/s2           (standard)
const RE_KM   = 6356.766;           // km, the USSA76 effective Earth radius
const ERG_EV  = 6.241509074e11;     // eV per erg
const EV_PER_ION_PAIR = 35.0;       // eV, air, the standard aeronomic value

/* ── the species ─────────────────────────────────────────────────────────── */
const SPECIES = [
  { key: 'N2', mass: 28.0134 },
  { key: 'O2', mass: 31.9988 },
  { key: 'O',  mass: 15.9994 },
];

/* Number densities (cm^-3) from 86 to 120 km.  Below the turbopause the air is
   still mixed, and atomic oxygen is being made faster than it can diffuse away,
   so it PEAKS near 97 km instead of falling — which is exactly why the green
   line has anywhere to live.  This short table is an INPUT: the 86 km row is
   the USSA76 boundary, the rest follows the mixed scale height with the
   standard O bulge.  Everything above 120 km is integrated, not tabulated. */
const LOW_TABLE = [
  //  z     N2         O2         O
  //  ── below the turbopause: fully mixed, 78.084% N2 and 20.948% O2 of a total
  //     number density taken from the USSA76 mass-density column.  Atomic
  //     oxygen is destroyed by three-body recombination down here and its
  //     column is an INPUT, a stated exponential collapse — it only has to be
  //     small, because O(1S) is comprehensively quenched at these pressures
  //     anyway.  This is the floor a hard electron reaches, and the reason the
  //     crimson N2 border has anywhere to appear.
  [  60, 5.029e15, 1.349e15, 1.00e5  ],
  [  70, 1.345e15, 3.607e14, 2.00e7  ],
  [  75, 6.481e14, 1.739e14, 4.00e8  ],
  [  80, 2.997e14, 8.040e13, 6.00e9  ],
  [  85, 1.334e14, 3.580e13, 6.40e10 ],
  [  86, 1.1298e14, 3.0309e13, 8.60e10 ],
  [  90, 5.63e13,   1.51e13,   2.40e11 ],
  [  95, 2.36e13,   6.31e12,   4.40e11 ],
  [ 100, 9.30e12,   2.30e12,   4.80e11 ],
  [ 105, 3.85e12,   8.80e11,   4.30e11 ],
  [ 110, 1.70e12,   3.50e11,   3.40e11 ],
  [ 115, 8.00e11,   1.50e11,   2.50e11 ],
  [ 120, 3.60e11,   7.00e10,   9.50e10 ],
];

/* Temperature below 120 km (USSA76): the mesopause, then the steep climb into
   the thermosphere. */
const LOW_T = [ [60,245.45], [65,231.45], [70,217.45], [75,206.65], [80,196.65],
                [85,186.7], [86,186.9], [90,186.9], [95,188.9], [100,195.1],
                [105,208.4], [110,240.0], [115,300.0], [120,360.0] ];

/* The Bates profile above 120 km:  T(z) = Tinf - (Tinf - T120) exp(-s (z-120)).
   Tinf is the exospheric temperature — a real dial, 700 K at solar minimum to
   1300 K at solar maximum.  It is the only thing about the atmosphere the
   visitor can move, and moving it moves where the aurora stops. */
const T120 = 360.0, BATES_S = 0.020;

const Z_BASE = 60, Z_TOP = 700, DZ = 1;            // km, the integration grid

function gAt(zKm) { const r = RE_KM / (RE_KM + zKm); return G0 * r * r; }

function tempAt(zKm, tInf) {
  if (zKm <= 120) {
    if (zKm <= LOW_T[0][0]) return LOW_T[0][1];
    for (let i = 1; i < LOW_T.length; i++) {
      if (zKm <= LOW_T[i][0]) {
        const [z0, t0] = LOW_T[i - 1], [z1, t1] = LOW_T[i];
        const f = (zKm - z0) / (z1 - z0);
        return t0 + f * (t1 - t0);
      }
    }
    return T120;
  }
  return tInf - (tInf - T120) * Math.exp(-BATES_S * (zKm - 120));
}

function lowDensity(zKm, col) {
  if (zKm <= LOW_TABLE[0][0]) return LOW_TABLE[0][col];
  for (let i = 1; i < LOW_TABLE.length; i++) {
    if (zKm <= LOW_TABLE[i][0]) {
      const a = LOW_TABLE[i - 1], b = LOW_TABLE[i];
      const f = (zKm - a[0]) / (b[0] - a[0]);
      return Math.exp(Math.log(a[col]) + f * (Math.log(b[col]) - Math.log(a[col])));
    }
  }
  return LOW_TABLE[LOW_TABLE.length - 1][col];
}

/* ── THE ATMOSPHERE ──────────────────────────────────────────────────────────
   Above 120 km each species sits in its own diffusive equilibrium.  The exact
   statement is hydrostatic balance for a single gas in a temperature gradient:

       d(n_i T)/dz  =  -(m_i g / k) n_i        =>
       dn_i/dz      =  -n_i [ m_i g /(k T)  +  (1/T) dT/dz ]

   which is integrated with RK4 at 1 km steps.  Nothing else: no eddy mixing,
   no thermal diffusion, no fluxes.  The out-of-sample test is that the TOTAL
   mass density this produces tracks the USSA76 column two and a half decades
   up, with only the 120 km anchors and Tinf, neither of which was fitted to it.
   ------------------------------------------------------------------------- */
function buildAtmosphere(tInf) {
  const n = Math.round((Z_TOP - Z_BASE) / DZ) + 1;
  const z = new Float64Array(n);
  const T = new Float64Array(n);
  const dens = SPECIES.map(() => new Float64Array(n));
  for (let i = 0; i < n; i++) { z[i] = Z_BASE + i * DZ; T[i] = tempAt(z[i], tInf); }

  const i120 = Math.round((120 - Z_BASE) / DZ);
  for (let i = 0; i <= i120; i++)
    for (let s = 0; s < SPECIES.length; s++) dens[s][i] = lowDensity(z[i], s + 1);

  // dn/dz = -n * beta(z),  beta = m g /(k T) + T'/T.  Integrate ln n by RK4.
  const beta = (zz, mAmu) => {
    const t = tempAt(zz, tInf);
    const dT = (tempAt(zz + 1e-4, tInf) - tempAt(zz - 1e-4, tInf)) / 2e-4;   // K/km
    return (mAmu * AMU * gAt(zz) / (KB * t)) * 1000 + dT / t;                // per km
  };
  for (let s = 0; s < SPECIES.length; s++) {
    const m = SPECIES[s].mass;
    for (let i = i120; i < n - 1; i++) {
      const zz = z[i], h = DZ;
      const k1 = -beta(zz, m), k2 = -beta(zz + h / 2, m),
            k3 = k2,           k4 = -beta(zz + h, m);
      const dln = (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      dens[s][i + 1] = dens[s][i] * Math.exp(dln);
    }
  }

  // mass density (g/cm3) and total number density (cm^-3)
  const rho = new Float64Array(n), ntot = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0, q = 0;
    for (let s = 0; s < SPECIES.length; s++) { r += dens[s][i] * SPECIES[s].mass; q += dens[s][i]; }
    rho[i] = r / 6.02214076e23; ntot[i] = q;
  }

  // column mass ABOVE each altitude, g/cm2 (dz in cm).  Trapezoid from the top;
  // the tail above Z_TOP is added analytically with the local scale height.
  const col = new Float64Array(n);
  {
    const hTop = 1 / Math.max(1e-9, (Math.log(rho[n - 2]) - Math.log(rho[n - 1])) / DZ); // km
    col[n - 1] = rho[n - 1] * hTop * 1e5;
    for (let i = n - 2; i >= 0; i--) col[i] = col[i + 1] + 0.5 * (rho[i] + rho[i + 1]) * DZ * 1e5;
  }

  return { n, z, T, N2: dens[0], O2: dens[1], O: dens[2], rho, ntot, col, tInf,
           dz: DZ, zBase: Z_BASE };
}

/** index of the grid cell for an altitude (clamped), plus the fractional part */
function atmIndex(atm, zKm) {
  const x = (zKm - atm.zBase) / atm.dz;
  if (x <= 0) return 0;
  if (x >= atm.n - 1) return atm.n - 1;
  return x;
}
function sampleAt(arr, atm, zKm) {
  const x = atmIndex(atm, zKm), i = Math.floor(x), f = x - i;
  if (i >= atm.n - 1) return arr[atm.n - 1];
  return arr[i] * (1 - f) + arr[i + 1] * f;
}
/** altitude (km) at which the column mass above equals X (g/cm2) — bisection */
function altOfColumn(atm, X) {
  if (X <= atm.col[atm.n - 1]) return atm.z[atm.n - 1];
  if (X >= atm.col[0]) return atm.z[0];
  let lo = 0, hi = atm.n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (atm.col[m] > X) lo = m; else hi = m; }
  const f = (Math.log(atm.col[lo]) - Math.log(X)) / (Math.log(atm.col[lo]) - Math.log(atm.col[hi]));
  return atm.z[lo] + f * (atm.z[hi] - atm.z[lo]);
}

/* ── THE BEAM ────────────────────────────────────────────────────────────────
   RANGE.  An electron of energy E (keV) travels a fixed mass depth before it
   stops.  The standard aeronomic fit (Barrett & Hays; Rees):

       R(E) = 4.30e-7 + 5.36e-6 E^1.67   g/cm2

   ENERGY DISSIPATION.  In the continuous-slowing-down approximation the
   stopping power follows from the range law alone: S(E) = dE/ds = 1/(dR/dE).
   An electron entering along a path has residual energy E(s) = ((Rp - s)/a1)^(1/n)
   with Rp = a1 E0^n the penetrable part of the range.

   Real precipitation is not a pencil beam: inside the loss cone the flux is
   near isotropic, so an electron at pitch angle theta covers path length s = X/mu
   (mu = cos theta) to reach vertical column depth X, and the number flux through
   a horizontal plane carries the weight 2 mu dmu.  Deposition per unit vertical
   column depth is then

       q(X) = INT_0^1 2 mu . S(E(X/mu)) . (1/mu) dmu = 2 INT_0^1 S(E(X/mu)) dmu

   which, in units of the penetration depth (x = X/Rp, v = s/Rp), is

       Lambda(x) = (2x/n) INT_x^1 (1-v)^(-(n-1)/n) v^(-2) dv,   q = (E0/Rp) Lambda(x)

   and its integral over x is EXACTLY 1 — swap the order of integration, the
   inner integral over x gives v^2/2, the v^-2 cancels, and what is left is
   (1/n) INT_0^1 (1-v)^(-(n-1)/n) dv = (1/n)(n/1) = 1.  Every joule the beam
   brings is deposited, by construction, and the twin measures it to 1e-9.

   The inner integral is singular at v -> 1, and the substitution
   s = (1-v)^(1-p) removes the singularity EXACTLY:

       INT_x^1 (1-v)^-p v^-2 dv = (1/(1-p)) INT_0^{(1-x)^(1-p)} [1 - s^(1/(1-p))]^-2 ds

   so a plain Gauss-Legendre rule on the right-hand side converges.
   ------------------------------------------------------------------------- */
const RANGE_A0 = 4.30e-7, RANGE_A1 = 5.36e-6, RANGE_N = 1.67;
const RANGE_P  = (RANGE_N - 1) / RANGE_N;      // 0.401197...

function rangeOf(EkeV) { return RANGE_A0 + RANGE_A1 * Math.pow(EkeV, RANGE_N); }
function penetration(EkeV) { return RANGE_A1 * Math.pow(EkeV, RANGE_N); }

/* 24-point Gauss-Legendre on [0,1], built once by Newton on the Legendre
   polynomial (no table to mistype). */
function gaussLegendre(m) {
  const x = new Float64Array(m), w = new Float64Array(m);
  for (let i = 0; i < m; i++) {
    let t = Math.cos(Math.PI * (i + 0.75) / (m + 0.5)), dp = 0;
    for (let it = 0; it < 100; it++) {
      let p0 = 1, p1 = 0;
      for (let j = 0; j < m; j++) { const p2 = p1; p1 = p0; p0 = ((2 * j + 1) * t * p1 - j * p2) / (j + 1); }
      dp = m * (t * p0 - p1) / (t * t - 1);
      const dt = -p0 / dp; t += dt; if (Math.abs(dt) < 1e-15) break;
    }
    x[i] = 0.5 * (1 - t); w[i] = 1 / ((1 - t * t) * dp * dp);
  }
  return { x, w };
}
const GL = gaussLegendre(24);

/** Lambda(x): fraction of an electron's energy deposited per unit x = X/Rp.

    The transformed integrand v^-2 = [1 - s^(1/q)]^-2 is smooth but PILED UP
    against the upper limit (there v = x, and 1/x^2 is large for a shallow
    slab), so one Gauss panel over the whole range leaves a few parts per
    thousand on the table — which shows up as an energy budget that does not
    close.  Six dyadic panels crowding the upper end fix it to 1e-12, and the
    twin measures the closure rather than trusting it. */
function lambdaNorm(x) {
  if (!(x > 0) || x >= 1) return 0;
  const p = RANGE_P, q = 1 - p;
  const m = Math.max(x, 0.5);          // where the two substitutions meet
  let G = 0;
  if (m > x) {
    // [x, m]: substitute v = x/u.  Then v^-2 dv = -(1/x) du and what is left,
    // (1 - x/u)^-p on u in [x/m, 1], is bounded and smooth — the v^-2 pile-up
    // is removed exactly rather than resolved.
    const a0 = x / m, h = 1 - a0;
    let s = 0;
    for (let i = 0; i < GL.x.length; i++) {
      const u = a0 + h * GL.x[i];
      s += GL.w[i] * h * Math.pow(1 - x / u, -p);
    }
    G += s / x;
  }
  // [m, 1]: substitute s = (1-v)^q, which removes the (1-v)^-p singularity
  // exactly (see the derivation above); v >= m here so v^-2 is bounded.
  const smax = Math.pow(1 - m, q);
  let acc = 0, a = 0;
  for (const e of [1e-4, 1e-3, 1e-2, 0.1, 0.5, 0.875, 1]) {
    const b = smax * e, h = b - a;
    for (let i = 0; i < GL.x.length; i++) {
      const s = a + h * GL.x[i];
      const v = 1 - Math.pow(s, 1 / q);
      acc += GL.w[i] * h / (v * v);
    }
    a = b;
  }
  G += acc / q;
  return (2 * x / RANGE_N) * G;
}

/** Where in the range the deposition peaks — x* solves Lambda'(x)=0. */
function lambdaPeakX() {
  let lo = 1e-4, hi = 1 - 1e-6, best = 0.5, bv = -1;
  for (let i = 0; i <= 400; i++) {                 // coarse scan then golden
    const x = lo + (hi - lo) * i / 400, v = lambdaNorm(x);
    if (v > bv) { bv = v; best = x; }
  }
  let a = Math.max(1e-4, best - 3e-3), b = Math.min(1 - 1e-6, best + 3e-3);
  for (let i = 0; i < 80; i++) {
    const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618;
    if (lambdaNorm(m1) < lambdaNorm(m2)) a = m1; else b = m2;
  }
  return 0.5 * (a + b);
}

/* ── THE SPECTRUM ────────────────────────────────────────────────────────────
   Auroral electrons arrive with a Maxwellian differential number flux
   phi(E) = C E exp(-E/E0); its mean energy is 2 E0 and its peak is at E0.
   E0 is "the characteristic energy" and it is the room's main dial.  A
   monoenergetic option is kept because it makes the mechanism legible. */
function maxwellianWeights(E0keV, nBins) {
  const m = nBins || 48;
  const Emax = 14 * E0keV, out = [];
  let norm = 0;
  for (let i = 0; i < m; i++) {
    const lo = Emax * i / m, hi = Emax * (i + 1) / m, E = 0.5 * (lo + hi);
    const phi = E * Math.exp(-E / E0keV) * (hi - lo);      // number in the bin
    out.push({ E, phi }); norm += phi * E;                  // energy in the bin
  }
  for (const b of out) b.frac = b.phi * b.E / norm;         // fraction of the ENERGY flux
  return out;
}

/** Energy deposition rate eps(z) in eV cm^-3 s^-1 for an energy flux Q (erg/cm2/s). */
function deposition(atm, { E0keV, QergCm2S, mono }) {
  const eps = new Float64Array(atm.n);
  const bins = mono ? [{ E: E0keV, frac: 1 }] : maxwellianWeights(E0keV);
  for (const b of bins) {
    if (!(b.frac > 1e-9)) continue;
    const Rp = penetration(b.E);
    const QeV = QergCm2S * ERG_EV * b.frac;         // eV cm-2 s-1 in this bin
    for (let i = 0; i < atm.n; i++) {
      const x = atm.col[i] / Rp;
      if (x >= 1) continue;
      // energy per unit column mass, times local mass density -> per unit volume
      eps[i] += QeV * (lambdaNorm(x) / Rp) * atm.rho[i];
    }
  }
  return eps;
}

/* ── THE EMISSIONS ───────────────────────────────────────────────────────────
   Four channels, and the two that matter are the two lifetimes.

   O(1S) 557.7 nm   tau_rad 0.75 s.  Quenched by O2 (4.0e-12 cm3/s) and by O
                    (2.0e-14).  Half-quenched near 95 km — the sharp bottom
                    edge every photograph of a quiet arc has.
   O(1D) 630.0 nm   tau_rad 117 s (A(630.0)=6.478e-3, A(636.4)=2.097e-3, and the
                    room emits both).  Quenched by N2 (2.3e-11), O2 (2.9e-11),
                    O (8e-12).  Half-quenched near 215 km, which is why the red
                    crown floats above the green and never touches it.
   N2+(B) 427.8 nm  tau 65 ns.  Nothing can quench that; the violet fringe goes
                    exactly as deep as the electrons do, and it is the tracer
                    for hard precipitation.
   N2(B) 1PG        tau ~6 us, a band system in the deep red near 670 nm.  The
                    crimson lower border of a strong aurora is this, NOT 630.0.

   PRODUCTION.  Excitation rate = (ion pairs per second) x (efficiency) x (the
   local fraction of the air that is the right target).  The efficiencies are
   the room's one calibration: they are set so a 1 erg/cm2/s, 2 keV Maxwellian
   makes ~1 kR of green, i.e. a nominal IBC II arc.  The ALTITUDE structure and
   every ratio's shape come out of the atmosphere and the lifetimes, untouched.
   ------------------------------------------------------------------------- */
const EMIT = [
  // THE GREEN LINE IS NOT MADE OUT OF OXYGEN ALONE.  Most auroral O(1S) comes
  // by the Barth mechanism: the beam makes N2(A), and N2(A) hands its energy to
  // an oxygen atom.  So the production needs BOTH, and it therefore follows the
  // NITROGEN fraction, which collapses above 200 km — that, and not quenching,
  // is why the green is a layer with the red floating clear above it.  Target
  // the N2 fraction and the ladder appears on its own; target O and the green
  // follows the atomic oxygen UP and the sky comes out yellow everywhere, which
  // is what this room did until it was fixed.
  { key: '557', name: 'O(¹S) 557.7 nm', short: 'green', target: 'N2', eff: 0.0895,
    tau: 0.75, lines: [[557.7, 1.0]],
    // The Arrhenius factor is LOAD-BEARING.  O(1S)+O2 is 4.0e-12 at room
    // temperature but the mesopause is 190 K, where exp(-865/T) is 1.3e-2 —
    // a factor of 75.  Use the 300 K number cold and the green line's floor
    // comes out at 112 km instead of the 95 km every photograph shows.
    quench: { O2: (T) => 4.0e-12 * Math.exp(-865 / T), O: () => 2.0e-14, N2: () => 1.0e-17 } },
  { key: '630', name: 'O(¹D) 630.0 nm', short: 'red', target: 'O', eff: 0.90,
    tau: 116.6, lines: [[630.0, 0.755], [636.4, 0.245]],
    quench: { N2: (T) => 2.3e-11 * Math.exp(107.8 / T), O2: (T) => 3.2e-11 * Math.exp(67 / T),
              O: () => 8.0e-12 } },
  { key: '428', name: 'N₂⁺(B) 427.8 nm', short: 'violet', target: 'N2', eff: 0.0109,
    tau: 6.5e-8, lines: [[427.8, 1.0]],
    quench: {} },
  { key: '1pg', name: 'N₂(B) 1PG ≈670 nm', short: 'crimson', target: 'N2', eff: 0.0147,
    tau: 6.0e-6, lines: [[661.1, 0.34], [670.5, 0.33], [686.1, 0.33]],
    quench: { O2: () => 3.0e-11 } },
];

/** 1 / (radiative + collisional) loss rate, s — the EFFECTIVE lifetime. */
function effLifetime(em, atm, i) {
  const q = em.quench, T = atm.T[i];
  let kn = 0;
  if (q.N2) kn += q.N2(T) * atm.N2[i];
  if (q.O2) kn += q.O2(T) * atm.O2[i];
  if (q.O)  kn += q.O(T)  * atm.O[i];
  return 1 / (1 / em.tau + kn);
}
/** The fraction of excitations that get out as light. */
function quenchFactor(em, atm, i) { return effLifetime(em, atm, i) / em.tau; }

/** The altitude where half the excitations survive to radiate — or null if the
    state is never half-quenched anywhere in the modelled column (which is the
    honest answer for the two band systems: nothing up here can touch them). */
function quenchAltitude(em, atm) {
  let lo = 0, hi = atm.n - 1;
  if (quenchFactor(em, atm, lo) > 0.5) return null;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (quenchFactor(em, atm, m) < 0.5) lo = m; else hi = m;
  }
  const a = quenchFactor(em, atm, lo), b = quenchFactor(em, atm, hi);
  return atm.z[lo] + (0.5 - a) / (b - a) * (atm.z[hi] - atm.z[lo]);
}

/** Steady-state volume emission rates (photons cm^-3 s^-1) for each channel. */
function emissionProfiles(atm, beam) {
  const eps = deposition(atm, beam);
  const out = {};
  const ion = new Float64Array(atm.n);
  for (let i = 0; i < atm.n; i++) ion[i] = eps[i] / EV_PER_ION_PAIR;   // ion pairs cm-3 s-1
  for (const em of EMIT) {
    const v = new Float64Array(atm.n);
    for (let i = 0; i < atm.n; i++) {
      const tgt = em.target === 'O' ? atm.O[i] : em.target === 'N2' ? atm.N2[i] : atm.O2[i];
      const frac = tgt / atm.ntot[i];
      v[i] = ion[i] * em.eff * frac * quenchFactor(em, atm, i);
    }
    out[em.key] = v;
  }
  out.eps = eps; out.ion = ion;
  return out;
}

/** Column intensity in RAYLEIGHS (1 R = 1e6 photons cm^-2 s^-1 column). */
function columnRayleigh(profile, atm) {
  let s = 0;
  for (let i = 0; i < atm.n - 1; i++) s += 0.5 * (profile[i] + profile[i + 1]) * atm.dz * 1e5;
  return s * 1e-6;
}

/** Everything a visitor's panel wants, for one beam. */
function measure(atm, beam) {
  const p = emissionProfiles(atm, beam);
  const I = {};
  for (const em of EMIT) I[em.key] = columnRayleigh(p[em.key], atm);
  // the altitude at which the green emission peaks, and the beam's own peak
  const peak = (arr) => { let bi = 0; for (let i = 1; i < atm.n; i++) if (arr[i] > arr[bi]) bi = i; return atm.z[bi]; };
  const centroid = (arr) => {
    let s = 0, sz = 0;
    for (let i = 0; i < atm.n; i++) { s += arr[i]; sz += arr[i] * atm.z[i]; }
    return s > 0 ? sz / s : 0;
  };
  return {
    I, profiles: p,
    peakDeposit: peak(p.eps), peakGreen: peak(p['557']), peakRed: peak(p['630']),
    peakViolet: peak(p['428']),
    centroidGreen: centroid(p['557']), centroidRed: centroid(p['630']),
    ratioRG: I['630'] / Math.max(1e-30, I['557']),
    ionColumn: columnRayleigh(p.ion, atm) * 1e6,      // ion pairs cm-2 s-1
  };
}

/* ── THE CLOCK ───────────────────────────────────────────────────────────────
   The excited population N obeys  dN/dt = P(t) - N/tau_eff, so every colour is a
   one-pole low-pass filter on the beam, with the effective lifetime as its time
   constant.  This is why a substorm looks the way it does: the violet and the
   green follow the flicker, and the red is a slow ghost of it that arrives a
   minute late and stays a minute after.  The room integrates this exactly
   (exponential update, unconditionally stable at any step).
   ------------------------------------------------------------------------- */
function makeKinetics(atm, opts) {
  const zs = (opts && opts.levels) || defaultLevels();
  const idx = zs.map((z) => Math.round(atmIndex(atm, z)));
  const taus = {};
  for (const em of EMIT) taus[em.key] = idx.map((i) => effLifetime(em, atm, i));
  const pop = {};
  for (const em of EMIT) pop[em.key] = new Float64Array(zs.length);
  return {
    zs, idx, taus, pop, atm,
    /** advance by dt seconds with production profiles P[key][level] */
    step(dt, prod) {
      for (const em of EMIT) {
        const t = taus[em.key], n = pop[em.key], P = prod[em.key];
        for (let j = 0; j < n.length; j++) {
          const a = Math.exp(-dt / t[j]);
          n[j] = n[j] * a + P[j] * t[j] * (1 - a);       // exact for constant P
        }
      }
    },
    /** volume emission (photons cm-3 s-1) at each level */
    emission(key) {
      const em = EMIT.find((e) => e.key === key);
      const n = pop[key], out = new Float64Array(n.length);
      for (let j = 0; j < n.length; j++) out[j] = n[j] / em.tau;
      return out;
    },
  };
}
function defaultLevels() {
  const out = [];
  for (let z = 88; z <= 400; z += 4) out.push(z);
  return out;
}

/* ── THE COLOUR ──────────────────────────────────────────────────────────────
   The estate already owns an observer: cie1931() in tools/spectrum/wavelength.mjs,
   the multi-lobe Gaussian fit to the CIE 1931 2-degree colour-matching functions,
   and the sRGB matrix in tools/blackbody/core.mjs.  An aurora is nothing but
   LINES, so there is no spectrum to integrate: the tristimulus of a line
   spectrum is just the sum of the CMFs at the line wavelengths, weighted.

   And one weighting has to be right or the whole picture is wrong.  A rayleigh
   counts PHOTONS; the eye answers to POWER.  Each line therefore carries
   hc/lambda before it reaches the observer, and across the visible band that is
   a 60% swing between violet and deep red.

   THE HONEST NOTE.  557.7 nm is monochromatic and sits ON the spectral locus,
   far outside anything a screen can make.  We do not clamp (that shifts hue and
   luminance silently); we desaturate towards white along the line that HOLDS
   luminance, and we report how far we had to go.  The number is on the page.

   AND THE ONE THAT SURPRISES PEOPLE.  557.7 nm is a YELLOW-green: it lands at
   (x, y) = (0.360, 0.637), between 555 and 560 nm on the locus, nowhere near
   the emerald of the photographs.  The photographs are not lying either — see
   VISION below.
   ------------------------------------------------------------------------- */
const HC_NM_EV = 1239.841984;                 // eV*nm

/* ── VISION: why the photograph is red and the night was green ───────────────
   A camera is daylight-adapted: it weighs 630.0 nm at about a quarter of the
   green line.  A dark-adapted eye is not.  Rod vision peaks at 507 nm and
   collapses in the red — the Purkinje shift — so relative to a camera the eye
   sees 630.0 nm roughly TEN TIMES more faintly than 557.7 nm.  That single
   ratio is why an aurora that fills a photograph with crimson is remembered as
   a green one, and why the red only becomes visible in the brightest storms
   (when the eye is back on its cones).

   V (photopic) is the CMF's own y-bar, so it is not an input at all.  V'
   (scotopic, CIE 1951) is a short table at this room's five wavelengths and is
   approximate — it is labelled as such, and nothing here rests on more than its
   order of magnitude. */
const SCOTOPIC = [[427.8, 0.19], [557.7, 0.435], [630.0, 0.0125],
                  [636.4, 0.0085], [661.1, 0.0022], [670.5, 0.0013], [686.1, 0.0005]];
function scotopicV(lam) {
  let best = SCOTOPIC[0];
  for (const s of SCOTOPIC) if (Math.abs(s[0] - lam) < Math.abs(best[0] - lam)) best = s;
  return best[1];
}
/* HOW DIM IS AN AURORA, REALLY.  A rayleigh is 1e6 photons cm^-2 s^-1 into 4pi,
   so a kilorayleigh of 557.7 nm is a surface luminance of about 1.9e-4 cd/m2 —
   the same order as the moonless night sky itself.  Even a once-a-decade IBC IV
   storm only reaches a few hundredths of a cd/m2.  The whole phenomenon lives
   BELOW the mesopic band (0.005 - 5 cd/m2), which is the real reason nobody
   remembers the colours their camera brought home. */
const CD_PER_RAYLEIGH_555 = 1.93e-7;
/* The band over which colour comes back for a LARGE dim field.  The textbook
   mesopic band is 0.005-5 cd/m2, but that is for small targets; a field that
   fills the sky recovers hue lower down.  These two numbers are an INPUT — a
   perceptual boundary, stated, not derived — and they are the reason a 1 kR arc
   comes out grey, a 10 kR arc half-green and a 100 kR storm unmistakably green,
   which is about what people report. */
const MESO_LO = 1.0e-4, MESO_HI = 5.0e-2;        // cd/m2

/** rod fraction of the visual response at a given luminance (1 = scotopic). */
function rodFraction(cdm2) {
  const a = Math.log10(MESO_LO), b = Math.log10(MESO_HI);
  const t = (Math.log10(Math.max(1e-12, cdm2)) - a) / (b - a);
  const s = Math.max(0, Math.min(1, t));
  return 1 - s * s * (3 - 2 * s);
}

/** relative weight of a line for a given observer: 'camera' (photopic, the
    daylight-balanced sensor everyone's photographs came off) or 'eye' (mixed
    rod/cone at the scene's own luminance).  Rods peak at 507 nm and collapse
    in the red, so 630.0 nm gets about a TENTH of the weight the camera gives
    it relative to the green line — the Purkinje shift, and the reason the
    crimson in the photograph was not there when you looked up. */
function observerWeight(lam, who, rod) {
  if (who !== 'eye') return 1;
  const V = cie1931(lam)[1];
  const r = rod === undefined ? 1 : rod;
  return 1 + r * (scotopicV(lam) / Math.max(1e-6, V) - 1);
}

/** luminance of a set of column intensities, cd/m2 (photopic). */
function luminanceCd(intensities) {
  let L = 0;
  for (const em of EMIT) {
    const I = intensities[em.key] || 0;
    if (!I) continue;
    for (const [lam, br] of em.lines)
      L += I * br * (HC_NM_EV / lam) / (HC_NM_EV / 555) * cie1931(lam)[1] * CD_PER_RAYLEIGH_555;
  }
  return L;
}

/** the rod channel's response, in the same arbitrary units as the cone Y. */
function scotopicResponse(intensities) {
  let L = 0;
  for (const em of EMIT) {
    const I = intensities[em.key] || 0;
    if (!I) continue;
    for (const [lam, br] of em.lines) L += I * br * (HC_NM_EV / lam) * scotopicV(lam);
  }
  return L;
}

/* THE MESOPIC MIX.  A rod does not signal a colour — it signals a quantity of
   light and nothing else.  So the honest model is not "reweight each line for
   the dark-adapted eye" (do that and the 427.8 nm line, which rods answer to
   twenty times more strongly than cones do, turns the whole sky violet, which
   is not a thing that happens).  It is: the CONES supply the hue, the RODS add
   an achromatic pile of D65 white on top, and the mix is set by how dim the
   scene is.  What survives is the real effect — 630.0 nm is worth a twentieth
   of its photographic weight to a rod, so a crimson curtain does not turn grey
   so much as go OUT. */
const D65_XYZ = [0.95047, 1.0, 1.08883];

function spectrumXYZ(intensities, who, rod) {
  let X = 0, Y = 0, Z = 0;
  for (const em of EMIT) {
    const I = intensities[em.key] || 0;
    if (!I) continue;
    for (const [lam, br] of em.lines) {
      const amp = I * br * (HC_NM_EV / lam);
      const c = cie1931(lam);
      X += amp * c[0]; Y += amp * c[1]; Z += amp * c[2];
    }
  }
  if (who !== 'eye' || !(rod > 0)) return [X, Y, Z];
  const Lr = scotopicResponse(intensities), k = 1 - rod;
  return [k * X + rod * Lr * D65_XYZ[0], k * Y + rod * Lr * D65_XYZ[1], k * Z + rod * Lr * D65_XYZ[2]];
}

/** Linear sRGB, desaturated the minimum amount that lands it in gamut, plus
    the amount of desaturation that took (0 = in gamut, 1 = white). */
function gamutFix(rgb) {
  let t = 0;
  for (let i = 0; i < 3; i++) if (rgb[i] < 0) {
    const ti = -rgb[i] / (1 - rgb[i]); if (ti > t) t = ti;
  }
  if (t <= 0) return { rgb, desat: 0 };
  return { rgb: [rgb[0] + t * (1 - rgb[0]), rgb[1] + t * (1 - rgb[1]), rgb[2] + t * (1 - rgb[2])], desat: t };
}

/** The colour of a set of column intensities: linear sRGB at luminance 1.
    In 'eye' mode the chromaticity is ALSO pulled towards white by the rod
    fraction, because rod vision is colourless — a faint arc looks grey to a
    person and green to a sensor, and both of them are telling the truth. */
function colourOf(intensities, who, rodOverride) {
  const rod = who === 'eye'
    ? (rodOverride === undefined ? rodFraction(luminanceCd(intensities)) : rodOverride) : 0;
  const [X, Y, Z] = spectrumXYZ(intensities, who, rod);
  if (!(Y > 0)) return { rgb: [0, 0, 0], desat: 0, Y: 0, rod };
  const raw = bbXYZtoLinearRGB(X / Y, 1, Z / Y);
  const f = gamutFix(raw);
  return { rgb: f.rgb, desat: f.desat, Y, rod };
}

/** The colour of ONE emission channel on its own (used for the altitude ramp). */
function channelColour(key, who, rod) {
  const o = {}; o[key] = 1;
  return colourOf(o, who, rod);
}

/** css string for a linear-sRGB triple, scaled to a peak of 'scale'. */
function cssOf(rgb, scale) {
  const mx = Math.max(rgb[0], rgb[1], rgb[2]) || 1, s = scale === undefined ? 1 : scale;
  return 'rgb(' + [0, 1, 2].map((i) => Math.round(255 * bbEncode(rgb[i] / mx * s))).join(',') + ')';
}

/* ── THE LOOKUP THE GPU GETS ─────────────────────────────────────────────────
   The renderer never re-implements any of this.  It is handed ONE table:
   for each of N altitude slabs, the linear-sRGB radiance of that slab.  There
   is no second model to drift from the first — the picture is this array.
   ------------------------------------------------------------------------- */
const LUT_Z0 = 80, LUT_Z1 = 420, LUT_N = 256;

function lutFrom(atm, profiles, keys, who, rod) {
  const rgb = new Float32Array(LUT_N * 3);
  const use = EMIT.filter((e) => !keys || keys.indexOf(e.key) >= 0);
  const perKey = {};
  for (const em of use) perKey[em.key] = channelColour(em.key, who, rod);
  let maxR = 0;
  for (let i = 0; i < LUT_N; i++) {
    const z = LUT_Z0 + (LUT_Z1 - LUT_Z0) * (i + 0.5) / LUT_N;
    const x = atmIndex(atm, z), j = Math.floor(x), f = x - j;
    let r = 0, g = 0, b = 0;
    for (const em of use) {
      const arr = profiles[em.key];
      const v0 = arr[j], v1 = arr[Math.min(atm.n - 1, j + 1)];
      const v = v0 * (1 - f) + v1 * f;                     // photons cm-3 s-1
      const c = perKey[em.key];
      // photons -> radiance: the channel's own luminance per photon already
      // carries the hc/lambda weighting, so this is one multiply
      const w = v * c.Y;
      r += w * c.rgb[0]; g += w * c.rgb[1]; b += w * c.rgb[2];
    }
    rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b;
    maxR = Math.max(maxR, r, g, b);
  }
  return { rgb, maxR, z0: LUT_Z0, z1: LUT_Z1, n: LUT_N };
}

function buildLUT(atm, beam, who, keys) {
  const p = emissionProfiles(atm, beam);
  const I = {};
  for (const em of EMIT) I[em.key] = columnRayleigh(p[em.key], atm);
  const rod = who === 'eye' ? rodFraction(luminanceCd(I)) : 0;
  return lutFrom(atm, p, keys, who, rod);
}

/* ── IBC: the brightness scale an observer actually uses ─────────────────── */
function ibcClass(kR557) {
  if (kR557 < 0.3) return { n: 0, label: 'subvisual' };
  if (kR557 < 3)   return { n: 1, label: 'IBC I — like the Milky Way' };
  if (kR557 < 30)  return { n: 2, label: 'IBC II — like moonlit cirrus' };
  if (kR557 < 300) return { n: 3, label: 'IBC III — like moonlit cumulus' };
  return { n: 4, label: 'IBC IV — reads a newspaper' };
}

export {
  KB, AMU, G0, RE_KM, ERG_EV, EV_PER_ION_PAIR, SPECIES, LOW_TABLE, LOW_T,
  T120, BATES_S, Z_BASE, Z_TOP, DZ, EMIT,
  RANGE_A0, RANGE_A1, RANGE_N, RANGE_P, LUT_Z0, LUT_Z1, LUT_N,
  gAt, tempAt, buildAtmosphere, atmIndex, sampleAt, altOfColumn,
  rangeOf, penetration, gaussLegendre, lambdaNorm, lambdaPeakX,
  maxwellianWeights, deposition, effLifetime, quenchFactor, quenchAltitude,
  emissionProfiles, columnRayleigh, measure, makeKinetics, defaultLevels,
  spectrumXYZ, gamutFix, colourOf, channelColour, cssOf, buildLUT, lutFrom, ibcClass,
  HC_NM_EV, SCOTOPIC, scotopicV, observerWeight, rodFraction, luminanceCd, scotopicResponse, D65_XYZ,
  CD_PER_RAYLEIGH_555, MESO_LO, MESO_HI,
};
