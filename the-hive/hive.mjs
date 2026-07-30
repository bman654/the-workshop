/* ═══════════════════════════════════════════════════════════════════════════
   hive.mjs — the whole content of The Hive, with no DOM in it.

   A honeybee that has found food comes home into a DARK hive and dances on
   vertical comb.  The dance is a sentence with two words in it:

     · the ANGLE of her straight "waggle" run away from straight-up is the
       angle of the food away from the SUN'S COMPASS BEARING.  Gravity stands
       in for the sun, because it is pitch dark in there.
     · the DURATION of that run is the distance.

   So to say where the food is she must know where the sun is — and the sun
   moves.  That is the fact this file exists to make exact.  The sun's compass
   bearing does NOT sweep at a steady fifteen degrees an hour: at midsummer in
   England it ambles at about twelve degrees an hour at sunrise and rips round
   at nearly twenty-nine at noon.  Stand on the Tropic of Cancer on midsummer
   day and at noon it swings from due east to due west in an instant, because
   the sun is exactly overhead and has no compass bearing at all.  A bee that
   simply added fifteen an hour would send her sisters into the wrong field by
   lunchtime.

   Everything below is pure.  Its Node twin is hive.test.mjs.

   Angle conventions, once, so nothing has to guess later:
     · BEARING / AZIMUTH: degrees clockwise from north.  0 N, 90 E, 180 S.
     · DANCE ANGLE: degrees clockwise from straight-up on the vertical comb.
     · HOUR ANGLE H: degrees, 0 at solar noon, +15 per hour after noon.
   ═══════════════════════════════════════════════════════════════════════════ */

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

export const norm360 = (a) => ((a % 360) + 360) % 360;
/* signed difference a−b folded into (−180, 180] */
export const angDiff = (a, b) => { let d = norm360(a - b); return d > 180 ? d - 360 : d; };

/* ── 1 · WHERE THE SUN IS ────────────────────────────────────────────────────
   Standard low-precision solar geometry.  'dayOfYear' 1..365, 'hour' is LOCAL
   SOLAR time (noon = sun on the meridian), 'lat' degrees north.

   Declination uses the usual cosine fit; it is good to about a third of a
   degree, which is far finer than a bee's dance and far finer than anything
   this room claims.
   ────────────────────────────────────────────────────────────────────────── */

export function declination(dayOfYear) {
  return -23.44 * Math.cos(D2R * (360 / 365) * (dayOfYear + 10));
}

/* Azimuth measured clockwise from NORTH, and altitude above the horizon. */
export function sunPosition(dayOfYear, hour, lat) {
  const dec = declination(dayOfYear) * D2R;
  const phi = lat * D2R;
  const H = (hour - 12) * 15 * D2R;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  /* azimuth measured from SOUTH, positive westward — atan2 form, no quadrant
     bookkeeping and no division by a cosine that can vanish at the pole. */
  const aSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { azimuth: norm360(180 + aSouth * R2D), altitude: alt * R2D, declination: dec * R2D };
}

/* The closed form for how fast that bearing is sweeping, degrees per hour.

   Differentiate aSouth = atan2(u, v), u = sin H, v = cos H sin φ − tan δ cos φ:
       daSouth/dH = (v·u' − u·v') / (u² + v²),   u' = cos H,  v' = −sin H sin φ
   and dH/dt is 15°/h exactly.  At solar noon (H = 0) this collapses to the
   one number the room quotes:   15 / (sin φ − tan δ cos φ). */
export function sunAzimuthRate(dayOfYear, hour, lat) {
  const dec = declination(dayOfYear) * D2R;
  const phi = lat * D2R;
  const H = (hour - 12) * 15 * D2R;
  const u = Math.sin(H), v = Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi);
  const du = Math.cos(H), dv = -Math.sin(H) * Math.sin(phi);
  const dAdH = (v * du - u * dv) / (u * u + v * v);   /* radians of A per radian of H */
  return dAdH * 15;                                    /* degrees of A per hour */
}

/* The same number at noon, written out — this is what the room puts on screen. */
export function noonAzimuthRate(dayOfYear, lat) {
  const dec = declination(dayOfYear) * D2R, phi = lat * D2R;
  return 15 / (Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
}

/* Hour angle of sunrise, in hours before noon.  null = the sun never sets or
   never rises on that day at that latitude. */
export function daylight(dayOfYear, lat) {
  const dec = declination(dayOfYear) * D2R, phi = lat * D2R;
  const c = -Math.tan(phi) * Math.tan(dec);
  if (c <= -1) return { rise: 0, set: 24, polar: 'day' };
  if (c >= 1) return { rise: 12, set: 12, polar: 'night' };
  const H0 = Math.acos(c) * R2D / 15;
  return { rise: 12 - H0, set: 12 + H0, polar: null };
}

/* ── 2 · THE DANCE ───────────────────────────────────────────────────────────
   The calibration below is a CALIBRATION, not a law.  Waggle duration rises
   very nearly linearly with distance, but the slope is a property of the
   subspecies and even of the colony — Apis mellifera ligustica and A. m.
   carnica disagree by tens of percent, and von Frisch measured different
   slopes in different years.  The numbers here are a plain linear fit in the
   published range for A. mellifera: about a second and a sixth per kilometre,
   with a small intercept.  The room says all of this out loud.
   ────────────────────────────────────────────────────────────────────────── */

export const CAL = {
  t0: 0.15,          /* s   — intercept of the waggle-duration line */
  perKm: 1.15,       /* s/km — its slope */
  roundBelow: 60,    /* m   — under this she circles and says nothing about direction */
  waggleHz: 13.0,    /* Hz  — side-to-side body waggles during the straight run */
  buzzHz: 270,       /* Hz  — the vibration burst the followers actually FEEL */
  returnFrac: 0.62,  /* the looping return leg, as a fraction of the run's duration */
};

export const waggleSeconds = (metres) => CAL.t0 + CAL.perKm * (metres / 1000);
export const secondsToMetres = (s) => (s - CAL.t0) * 1000 / CAL.perKm;

/* Is this a waggle dance (direction encoded) or a round dance (it is not)? */
export const danceKind = (metres) => (metres < CAL.roundBelow ? 'round' : 'waggle');

/* THE ENCODER — the dancer.  Straight angle arithmetic on compass bearings. */
export function encodeDance(bearingDeg, metres, sunAzimuthDeg) {
  const kind = danceKind(metres);
  return {
    kind,
    angle: kind === 'waggle' ? norm360(bearingDeg - sunAzimuthDeg) : null,
    seconds: kind === 'waggle' ? waggleSeconds(metres) : null,
    waggles: kind === 'waggle' ? waggleSeconds(metres) * CAL.waggleHz : null,
    circuitSeconds: kind === 'waggle'
      ? waggleSeconds(metres) * (1 + CAL.returnFrac)
      : 0.55,
  };
}

/* THE DECODER — a follower.  Deliberately written the OTHER way round: it
   builds a unit vector on the comb, rotates it into the world by the sun, and
   reads the bearing back off the vector.  It shares no line of arithmetic with
   the encoder, so agreeing is evidence and not a tautology. */
export function decodeDance(dance, sunAzimuthDeg) {
  if (dance.kind !== 'waggle') return { bearing: null, metres: null };
  const a = dance.angle * D2R;
  /* on the comb: x to the right, y straight up.  the run's unit vector */
  const cx = Math.sin(a), cy = Math.cos(a);
  /* A bearing (clockwise from north) has components (N,E) = (cos, sin).
     "Up on the comb" is the sun's own bearing s      → ( cos s,  sin s);
     "right on the comb" is 90° clockwise of that     → (−sin s,  cos s).
     So the run vector in the world is cy·up + cx·right — a rotation, built as
     a rotation, sharing no line of arithmetic with the encoder's subtraction. */
  const s = sunAzimuthDeg * D2R;
  const N = cy * Math.cos(s) + cx * -Math.sin(s);
  const E = cy * Math.sin(s) + cx * Math.cos(s);
  return {
    bearing: norm360(Math.atan2(E, N) * R2D),
    metres: secondsToMetres(dance.seconds),
  };
}

/* ── 3 · FOLLOWERS ───────────────────────────────────────────────────────────
   A recruit does not get a clean reading.  A single waggle run scatters by
   something like ten to fifteen degrees; she follows several runs and averages,
   which is why the fan of recruits is narrower than the dance itself.  The two
   sigmas below are model parameters the visitor can turn to zero — they are not
   claims, and turning them to zero is the point of having them.
   ────────────────────────────────────────────────────────────────────────── */

export const NOISE = { angleDeg: 13.0, distFrac: 0.13, runsFollowed: 4 };

/* deterministic, seedable PRNG so every claim in this file is reproducible */
export function rng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
/* Box–Muller, one value per call (the spare is kept) */
export function gaussian(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* One recruit's flight vector, in the world. */
export function recruit(dance, sunAzimuthDeg, rand, noise = NOISE) {
  if (dance.kind === 'round') {
    /* a round dance carries no direction at all: she leaves on any bearing */
    return { bearing: rand() * 360, metres: 40 + rand() * 220, informed: false };
  }
  const runs = Math.max(1, noise.runsFollowed);
  const sa = noise.angleDeg / Math.sqrt(runs);
  const heard = { ...dance, angle: dance.angle + gaussian(rand) * sa };
  const read = decodeDance(heard, sunAzimuthDeg);
  const d = read.metres * (1 + gaussian(rand) * noise.distFrac / Math.sqrt(runs));
  return { bearing: read.bearing, metres: Math.max(5, d), informed: true };
}

export function releaseRecruits(n, dance, sunAzimuthDeg, seed, noise = NOISE) {
  const rand = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(recruit(dance, sunAzimuthDeg, rand, noise));
  return out;
}

/* ── 4 · CIRCULAR STATISTICS ─────────────────────────────────────────────────
   The honest way to ask "does this dance carry a direction?".  You cannot
   average bearings arithmetically (359° and 1° do not average to 180°), so you
   average unit vectors.  The length r of the mean vector is the answer:
   r → 1 means every recruit agrees, r → 0 means they are scattered round the
   whole compass.  Rayleigh's test turns r into a p-value against "uniform".
   ────────────────────────────────────────────────────────────────────────── */

export function circStats(bearingsDeg) {
  const n = bearingsDeg.length;
  if (!n) return { n: 0, r: 0, meanDeg: null, sdDeg: null, Z: 0, p: 1 };
  let C = 0, S = 0;
  for (const b of bearingsDeg) { const t = b * D2R; C += Math.cos(t); S += Math.sin(t); }
  C /= n; S /= n;
  const r = Math.hypot(C, S);
  const mean = norm360(Math.atan2(S, C) * R2D);
  const Z = n * r * r;
  /* Zar's approximation to the Rayleigh p-value; exact enough over the whole
     range we ever quote, and it is monotone in Z, which is all a verdict needs */
  const p = Math.exp(-Z) * (1 + (2 * Z - Z * Z) / (4 * n)
    - (24 * Z - 132 * Z * Z + 76 * Z ** 3 - 9 * Z ** 4) / (288 * n * n));
  return {
    n, r, meanDeg: mean,
    sdDeg: r > 0 ? Math.sqrt(-2 * Math.log(r)) * R2D : Infinity,
    Z, p: Math.max(0, Math.min(1, p)),
  };
}

/* ── 5 · THE DANCE, MOMENT BY MOMENT ─────────────────────────────────────────
   The figure of eight: a straight waggle run at the dance angle, then a loop
   back to the start, alternating left and right.  't' is seconds since the
   dance began; the return is a half-ellipse so the trace closes.
   ────────────────────────────────────────────────────────────────────────── */

export function dancePhase(dance, t) {
  const runT = dance.kind === 'waggle' ? dance.seconds : 0.30;
  const retT = runT * CAL.returnFrac;
  const period = runT + retT;
  const k = Math.floor(t / period);
  const u = (t - k * period) / period;
  const uRun = runT / period;
  const side = (k % 2 === 0) ? 1 : -1;
  if (u < uRun) return { leg: 'run', s: u / uRun, side, circuit: k };
  return { leg: 'return', s: (u - uRun) / (1 - uRun), side, circuit: k };
}

/* Position on the comb in "run-lengths", in the dance's own frame: +y is along
   the waggle run.  Returned before rotation, so the renderer rotates once. */
export function dancePoint(dance, t, runLen = 1) {
  const ph = dancePhase(dance, t);
  if (ph.leg === 'run') {
    const along = (ph.s - 0.5) * runLen;
    /* The actual side-to-side waggle, at the real 13 Hz — windowed by a half
       sine so the amplitude grows out of, and dies back into, zero at the two
       ends of the run.  That is what she does, and it is also what makes the
       figure of eight close exactly instead of nearly. */
    const shimmy = dance.kind === 'waggle'
      ? Math.sin(2 * Math.PI * CAL.waggleHz * t) * Math.sin(Math.PI * ph.s) * runLen * 0.085 : 0;
    return { x: shimmy, y: along, heading: 0, waggling: dance.kind === 'waggle' };
  }
  /* half-ellipse back to the start, bulging to 'side' */
  const a = Math.PI * ph.s;
  return {
    x: ph.side * Math.sin(a) * runLen * 0.42,
    y: Math.cos(a) * runLen * 0.5,
    heading: 0,
    waggling: false,
  };
}

/* ── 6 · THE SOUND THE FOLLOWERS ACTUALLY FEEL ───────────────────────────────
   It is pitch dark in a hive; nobody sees the dance.  The straight run is
   delivered as a train of vibration bursts near 270 Hz, pulsed at the 13 Hz
   waggle rate, through the comb and the air, and the followers read it with
   their antennae.  Michelsen's mechanical bee, in 1989, recruited real bees to
   a real feeder by producing exactly this and nothing else.

   'renderDanceSignal' builds the envelope so the browser and Node can make the
   SAME sound — the browser schedules it on a gain node, Node writes a WAV and
   the audio-lens looks at it.  The only claim being made is that the LENGTH of
   the buzz is the distance.
   ────────────────────────────────────────────────────────────────────────── */

export function renderDanceSignal(dance, sampleRate, circuits = 2) {
  const runT = dance.kind === 'waggle' ? dance.seconds : 0.30;
  const retT = runT * CAL.returnFrac;
  const period = runT + retT;
  const n = Math.max(1, Math.round(period * circuits * sampleRate));
  const out = new Float32Array(n);
  let phase = 0;
  const dp = 2 * Math.PI * CAL.buzzHz / sampleRate;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const u = t % period;
    let env = 0;
    if (dance.kind === 'waggle' && u < runT) {
      /* 13 Hz pulse train, raised-cosine pulses, with a short fade at each end
         of the run so the burst starts and stops without a click */
      const pulse = 0.5 - 0.5 * Math.cos(2 * Math.PI * CAL.waggleHz * u);
      const edge = Math.min(1, u / 0.02, (runT - u) / 0.02);
      env = pulse * Math.max(0, edge) * 0.72;
    }
    phase += dp;
    out[i] = env * Math.sin(phase);
  }
  return out;
}

/* ── 7 · THE MEADOW ──────────────────────────────────────────────────────────
   Where things are, in metres, north/east of the hive.  The renderer needs a
   flower patch that is the same every visit, so it comes from the same PRNG.
   ────────────────────────────────────────────────────────────────────────── */

export function meadow(seed = 4242, n = 900, radius = 1500) {
  const rand = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const th = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * radius;
    pts.push({ e: Math.sin(th) * rr, n: Math.cos(th) * rr, kind: (rand() * 3) | 0, s: 0.6 + rand() * 0.8 });
  }
  return pts;
}

export const toBearing = (east, north) => norm360(Math.atan2(east, north) * R2D);
export const toRange = (east, north) => Math.hypot(east, north);
export const fromPolar = (bearingDeg, metres) => ({
  e: Math.sin(bearingDeg * D2R) * metres,
  n: Math.cos(bearingDeg * D2R) * metres,
});
