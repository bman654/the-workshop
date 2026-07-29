/* ============================================================================
 *  THE AVIARY  --  song.mjs
 *
 *  Six birds, written by hand as curves in the (alpha, beta) plane.
 *
 *  These are NOT identifications and they are not recordings.  Nothing here was
 *  fitted to a field tape and no claim is made that any of them is a robin.
 *  They are six gestures a hand drew in the same two numbers -- how hard the
 *  bird pushes, how tight it holds -- to find out how far that gets you.  It
 *  gets you further than it has any right to.  Each is named for the shape it
 *  makes, not for a species.
 *
 *  HOW A GESTURE IS WRITTEN.  A breakpoint is [t, pressure, HERTZ], with t
 *  running 0..1 over the gesture's own duration.  The hertz is turned into a
 *  tension by inverting the room's own claim,
 *
 *      beta = (2 pi f / gamma)^2 ,
 *
 *  at pack time, so a song is authored as the pitch contour a listener hears
 *  and stored as the curve the syrinx actually walks.  Between breakpoints the
 *  value is linear; on top of that the worklet runs a one-pole slew, because a
 *  muscle has mass and cannot corner.
 *
 *  WHY THE PRESSURES ARE ALL SMALL.  f = gamma*sqrt(beta)/(2 pi) is the pitch
 *  the note is BORN with, at the threshold.  Blow harder and the limit cycle
 *  grows, the oscillation stops being sinusoidal, and the pitch runs sharp --
 *  by 2 % at alpha = 0.05, by 25 % at alpha = 0.20, by nearly an octave at
 *  alpha = 0.5 (all measured, low register).  So these birds sing at
 *  alpha between about 0.04 and 0.15, where tension really is the pitch, and
 *  get their loudness from the gain of the bird instead.  That is a real
 *  constraint the model imposed on the composing, and finding it is the reason
 *  the first draft of these songs did not descend when it was written to.
 *
 *  The SECOND voice, when a bird has one, is a second list driving the other
 *  syrinx.  Both empty into the one trachea, so their partials add before the
 *  tube and beat.
 *
 *  NO BACKTICK MAY APPEAR IN THIS FILE (see core.mjs).
 * ========================================================================== */
import { TWO_PI } from './core.mjs';

/* linear interpolation through a breakpoint list at normalised time t */
export function samplePath(pts, t) {
  const n = pts.length;
  if (n === 0) return [0, 0.5];
  if (t <= pts[0][0]) return [pts[0][1], pts[0][2]];
  if (t >= pts[n - 1][0]) return [pts[n - 1][1], pts[n - 1][2]];
  let i = 1;
  while (i < n && pts[i][0] < t) i++;
  const p = pts[i - 1], q = pts[i];
  const span = q[0] - p[0];
  const f = span > 1e-9 ? (t - p[0]) / span : 0;
  return [p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f];
}

/* ── authoring helpers ─────────────────────────────────────────────────── */
/* n cycles of pitch swinging between two frequencies, under an envelope */
function trill(n, env, fLo, fHi) {
  const pts = [];
  const steps = n * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([t, env(t), (i % 2 === 0) ? fLo : fHi]);
  }
  return pts;
}
function bell(rise, fall, peak) {
  return function (t) {
    if (t < rise) return peak * (t / rise);
    if (t > 1 - fall) return peak * ((1 - t) / fall);
    return peak;
  };
}

/* ── THE SIX ────────────────────────────────────────────────────────────────
   gamma       the labial clock, so the bird's register
   lengthM     tracheal length: a bigger bird has a longer tube and a lower
               resonance, which is most of what makes a big bird sound big
   enter       how far the sky has to have lightened before it joins in (0 = the
               first grey, 1 = full sunrise).  The order is the maker's, not a
               measurement -- though in a real wood the big-eyed birds do go
               first, and for the same reason: they can see sooner.
   ─────────────────────────────────────────────────────────────────────────── */
export const SPECIES = [
  {
    id: 'fluter', name: 'The Fluter',
    note: 'low, unhurried, almost a pure tone. Its notes lie under beta = 1/4, so each one has to break through the fold to start: they snap on rather than fade in.',
    gamma: 21000, lengthM: 0.042, gain: 1.9, enter: 0.02,
    hue: 28, size: 1.30, perch: 0,
    gestures: {
      a: { dur: 0.66, pts: [[0, 0, 2500], [0.05, 0.135, 2480], [0.30, 0.125, 2260],
                            [0.62, 0.115, 2020], [0.84, 0.105, 1900], [1, 0, 1880]] },
      b: { dur: 0.52, pts: [[0, 0, 1780], [0.06, 0.130, 1820], [0.44, 0.125, 2080],
                            [0.80, 0.115, 2340], [1, 0, 2380]] },
      c: { dur: 0.78, pts: [[0, 0, 2820], [0.05, 0.140, 2800], [0.24, 0.130, 2660],
                            [0.48, 0.125, 2200], [0.72, 0.120, 2440], [0.92, 0.100, 1990], [1, 0, 1960]] },
      /* the scratchy sign-off: BOTH syringes, deliberately out of tune */
      tw: {
        dur: 0.44,
        pts: trill(9, bell(0.08, 0.25, 0.105), 3500, 4300),
        pts2: trill(7, bell(0.10, 0.25, 0.090), 4550, 3700),
      },
    },
    phrases: [
      [['a', 0.36], ['c', 0.32], ['tw', 0]],
      [['b', 0.32], ['a', 0.38], ['tw', 0]],
      [['c', 0.34], ['b', 0.36], ['a', 0.32], ['tw', 0]],
    ],
    restLo: 2.6, restHi: 5.0,
  },
  {
    id: 'seesaw', name: 'The See-Saw',
    note: 'two notes and nothing else, over and over. The whole song is one short line segment in the plane, walked back and forth.',
    gamma: 24000, lengthM: 0.022, gain: 1.5, enter: 0.16,
    hue: 44, size: 0.88, perch: 1,
    gestures: {
      hi: { dur: 0.16, pts: [[0, 0, 3760], [0.10, 0.145, 3780], [0.72, 0.135, 3680], [1, 0, 3650]] },
      lo: { dur: 0.19, pts: [[0, 0, 2870], [0.10, 0.150, 2900], [0.75, 0.135, 2810], [1, 0, 2790]] },
    },
    phrases: [
      [['hi', 0.05], ['lo', 0.10], ['hi', 0.05], ['lo', 0.10], ['hi', 0.05], ['lo', 0.10],
       ['hi', 0.05], ['lo', 0.10], ['hi', 0.05], ['lo', 0]],
      [['hi', 0.05], ['lo', 0.10], ['hi', 0.05], ['lo', 0.10], ['hi', 0.05], ['lo', 0.10],
       ['hi', 0.05], ['lo', 0]],
    ],
    restLo: 2.2, restHi: 4.0,
  },
  {
    id: 'cascade', name: 'The Cascade',
    note: 'a run downhill that speeds up as it falls, and then the same flourish it always ends on.',
    gamma: 25000, lengthM: 0.026, gain: 1.5, enter: 0.30,
    hue: 16, size: 0.98, perch: 2,
    gestures: {
      run: {
        dur: 1.50,
        pts: (function () {
          const out = []; const N = 11;
          let t = 0;
          for (let i = 0; i < N; i++) {
            const w = 0.140 - 0.008 * i;             /* each note shorter than the last */
            const f = 4300 - 185 * i;
            out.push([t, 0, f]);
            out.push([t + w * 0.14, 0.150, f]);
            out.push([t + w * 0.80, 0.135, f * 0.975]);
            out.push([t + w, 0, f * 0.97]);
            t += w + 0.010;
          }
          return out.map(function (p) { return [p[0] / t, p[1], p[2]]; });
        })(),
      },
      flr: {
        dur: 0.42,
        pts: [[0, 0, 2450], [0.06, 0.155, 2560], [0.24, 0.150, 4600], [0.40, 0.145, 3180],
              [0.56, 0.155, 4820], [0.74, 0.140, 3000], [0.90, 0.105, 2820], [1, 0, 2740]],
        pts2: [[0, 0, 2800], [0.10, 0.085, 2920], [0.50, 0.090, 3960], [0.85, 0.070, 3150], [1, 0, 3060]],
      },
    },
    phrases: [[['run', 0.05], ['flr', 0]]],
    restLo: 3.4, restHi: 6.4,
  },
  {
    id: 'piper', name: 'The Piper',
    note: 'never says the same thing twice; silvery, and mostly made of the gaps between.',
    gamma: 26500, lengthM: 0.020, gain: 1.35, enter: 0.0,
    hue: 212, size: 0.82, perch: 3,
    gestures: {
      s1: { dur: 0.32, pts: [[0, 0, 4800], [0.07, 0.140, 4880], [0.30, 0.135, 3900],
                             [0.52, 0.140, 5220], [0.78, 0.130, 4200], [1, 0, 4100]] },
      s2: { dur: 0.48, pts: [[0, 0, 3580], [0.06, 0.145, 3700], [0.22, 0.140, 5340],
                             [0.44, 0.130, 4300], [0.62, 0.140, 5550], [0.84, 0.125, 4600], [1, 0, 4400]] },
      s3: { dur: 0.24, pts: trill(5, bell(0.12, 0.28, 0.130), 4500, 5480) },
      s4: { dur: 0.36, pts: [[0, 0, 5700], [0.08, 0.135, 5760], [0.55, 0.125, 4480],
                             [0.85, 0.115, 3760], [1, 0, 3700]] },
    },
    phrases: [
      [['s1', 0.10], ['s3', 0.12], ['s2', 0]],
      [['s2', 0.11], ['s4', 0.09], ['s1', 0]],
      [['s4', 0.13], ['s3', 0.10], ['s3', 0.11], ['s1', 0]],
      [['s3', 0.09], ['s1', 0.13], ['s4', 0]],
    ],
    restLo: 1.8, restHi: 3.6,
  },
  {
    id: 'rattle', name: 'The Rattle',
    note: 'far too loud for its size: one long trill held open for a second and a half, forty-four notes in it.',
    gamma: 28500, lengthM: 0.016, gain: 1.15, enter: 0.44,
    hue: 36, size: 0.64, perch: 4,
    gestures: {
      intro: { dur: 0.36, pts: [[0, 0, 4900], [0.08, 0.145, 5080], [0.40, 0.140, 4560],
                                [0.70, 0.145, 5240], [1, 0.085, 4800]] },
      tr: { dur: 1.58, pts: trill(44, bell(0.03, 0.10, 0.155), 4250, 5700) },
      tail: { dur: 0.56, pts: trill(9, bell(0.05, 0.45, 0.140), 5100, 6250) },
    },
    phrases: [[['intro', 0.02], ['tr', 0.02], ['tail', 0]]],
    restLo: 3.8, restHi: 8.0,
  },
  {
    id: 'chatterer', name: 'The Chatterer',
    note: 'both syringes at once, and deliberately not in tune with each other. The buzz IS two birds in one throat -- shut one side and it goes.',
    gamma: 23000, lengthM: 0.028, gain: 1.25, enter: 0.62,
    hue: 86, size: 0.92, perch: 5,
    gestures: {
      bz: {
        dur: 0.54,
        pts: [[0, 0, 2960], [0.06, 0.140, 3040], [0.40, 0.135, 3180], [0.80, 0.125, 3100], [1, 0, 3060]],
        pts2: [[0, 0, 3560], [0.06, 0.130, 3640], [0.40, 0.130, 3800], [0.80, 0.120, 3700], [1, 0, 3660]],
      },
      ck: {
        dur: 0.18,
        pts: [[0, 0, 3820], [0.12, 0.155, 3900], [0.55, 0.140, 3320], [1, 0, 3220]],
        pts2: [[0, 0, 4340], [0.12, 0.125, 4440], [0.55, 0.105, 3820], [1, 0, 3720]],
      },
    },
    phrases: [
      [['ck', 0.08], ['ck', 0.08], ['bz', 0]],
      [['bz', 0.11], ['ck', 0.07], ['ck', 0.07], ['ck', 0]],
    ],
    restLo: 2.4, restHi: 4.6,
  },
];

export function speciesById(id) {
  for (let i = 0; i < SPECIES.length; i++) if (SPECIES[i].id === id) return SPECIES[i];
  return null;
}

/* Flatten a species into the plain tables the worklet wants -- and convert the
   authored HERTZ into the tension the syrinx is actually held at.  This is the
   room's own claim, run backwards. */
export function packSpecies(sp) {
  const g = {};
  const toB = function (pts) {
    return pts.map(function (p) {
      const w = TWO_PI * p[2] / sp.gamma;
      return [p[0], p[1], w * w];
    });
  };
  for (const k in sp.gestures) {
    const gg = sp.gestures[k];
    g[k] = { dur: gg.dur, pts: toB(gg.pts), pts2: gg.pts2 ? toB(gg.pts2) : null };
  }
  return {
    id: sp.id, gamma: sp.gamma, lengthM: sp.lengthM, gain: sp.gain,
    gestures: g, phrases: sp.phrases, restLo: sp.restLo, restHi: sp.restHi,
  };
}
