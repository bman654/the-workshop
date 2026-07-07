"use strict";
/* ═══════════════ THE ARCH-RAISING — geometry.mjs (WS4 T8.6) ═══════════════════
   The pure, DOM-free geometry of a semicircular masonry arch, raised one course
   at a time. It is the deck's d08 frame ("reach"): a thing that N different hands
   build and none of them could finish alone. Drawing kinship with the estate's
   the-keystone-arch/ exhibit, but this is a Book-2-own, DETERMINISTIC frame —
   fixed constants only, no random numbers, no wall-clock (invariant 7).

   Dual-use, exactly like strata/core.mjs and strata/diagram.mjs:
     • talk/arch-raise.html   — forge inlines this file into the page's <script>
                                (the `export ` keyword is stripped), so the drawn
                                arch and its in-page pill compute from THIS source.
     • tools/tour/arch-raise.test.mjs — the Node twin imports the SAME module and
                                re-proves the ring closes and the stages partition.

   THE RAISING is five stages (0…4): a bare yard, then four placements the deck
   anchors to the d08 script's four archStage cues —

     0  the stoneyard   nine wedges cut and waiting; nothing holds up
     1  the springers   voussoir 0 and N−1 bedded on the two abutments
     2  the voussoirs    the intermediate wedges climb, course by course
     3  the keystone    the crown wedge drops into the last gap; the ring closes
     4  the lock         the centering is struck; the line of thrust threads the
                         ring springer to springer and it goes rigid

   THE STATE is a pure function of the stage index k: archStateAt(k) returns which
   voussoirs are set, whether the ring is closed, whether it is locked. That is what
   lets the deck replay any archStage(k) cue on a reload and land exactly right. ── */

/* the test-pinned geometry, in the SVG frame (y grows DOWN, so the arch rises for
   theta in 0…180°). O is the springing-line centre; the two springers sit at
   theta=0 (right) and theta=180 (left). */
export const ARCH = {
  cx: 500, cy: 470,     /* springing-line centre */
  Ri: 172, Ro: 252,     /* intrados / extrados radii */
  N: 9,                 /* voussoir count — ODD, so one keystone crowns the ring */
  faceSamples: 7        /* points sampled along each curved stone face */
};

/* the five stages of the raising (yard + four placements). The deck anchors each
   placement (k=1…4) to a real word time in the d08 narration; k=0 is the yard shown
   when the frame flips in. `gloss` is the PAGE'S OWN caption text (not a quotation
   of any git artifact — the covenant does not apply), kept here so page + twin
   agree on the stage count and labels from one source. */
export const STAGES = [
  { k: 0, id: 'yard',       title: 'The stoneyard',
    gloss: 'Nine wedges, cut to shape, waiting in the yard. Nothing holds up yet.' },
  { k: 1, id: 'springers',  title: 'The springers',
    gloss: 'The springers are bedded on the abutments — one hand sets them and moves on.' },
  { k: 2, id: 'voussoirs',  title: 'The voussoirs',
    gloss: 'Fresh hands raise the voussoirs course by course, each wedge leaning on the last.' },
  { k: 3, id: 'keystone',   title: 'The keystone',
    gloss: 'The last hand drops the keystone into the crown gap. The ring is closed.' },
  { k: 4, id: 'lock',       title: 'The ring locks',
    gloss: 'The centering is struck. One line of thrust threads springer to springer — the ring stands on its own shape. None of them could have finished it alone.' }
];

/* the three hands, for the story the frame tells (different makers, one arch). */
export const HANDS = {
  first: { id: 'first', label: 'first hand',  of: 'the springers' },
  fresh: { id: 'fresh', label: 'fresh hands', of: 'the voussoirs' },
  last:  { id: 'last',  label: 'last hand',   of: 'the keystone'  }
};

export function deg2rad(d) { return (d * Math.PI) / 180; }

/* a point at polar (r, thetaDeg) about (cx,cy) in the SVG frame (y down → the arch
   rises for theta in 0…180°). Pure trig; deterministic. */
export function polar(r, thetaDeg, cx, cy) {
  const a = deg2rad(thetaDeg);
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

/* which stage SETS voussoir j: the two springers at stage 1, the crown keystone at
   stage 3, every other voussoir at stage 2. */
export function stageOfVoussoir(j, N) {
  if (j === 0 || j === N - 1) return 1;
  if (j === (N - 1) / 2) return 3;
  return 2;
}

/* the indices of every voussoir set at or before stage k. */
export function voussoirsSetAt(k, N) {
  const out = [];
  for (let j = 0; j < N; j++) if (stageOfVoussoir(j, N) <= k) out.push(j);
  return out;
}

/* THE PURE STATE at stage k — the deck replays any k and lands exactly here. */
export function archStateAt(k, N) {
  N = N || ARCH.N;
  k = Math.max(0, Math.min(STAGES.length - 1, Math.round(Number(k) || 0)));
  const set = voussoirsSetAt(k, N);
  return {
    stage: k,
    of: STAGES.length,
    id: STAGES[k].id,
    set: set,
    ringClosed: k >= 3,      /* the keystone in → the ring is continuous */
    locked: k >= 4,          /* the centering struck → the thrust line stands */
    n: N
  };
}

/* BUILD THE ARCH: every voussoir's boundary polygon, corners, centroid, kind, and
   the "hand" that sets it — all in the SVG world frame. The render consumes this;
   it never computes geometry of its own. */
export function buildArch(opts) {
  const p = Object.assign({}, ARCH, opts || {});
  const cx = p.cx, cy = p.cy, Ri = p.Ri, Ro = p.Ro, N = p.N, SAMP = p.faceSamples;
  if (N % 2 === 0) throw new Error('N must be odd so a single keystone crowns the ring');
  const dTheta = 180 / N;
  const keystoneIndex = (N - 1) / 2;
  const voussoirs = [];
  for (let j = 0; j < N; j++) {
    const ta = j * dTheta, tb = (j + 1) * dTheta, mid = (ta + tb) / 2;
    /* sample the two curved faces so the wedge reads as real masonry (no SVG
       arc-flag guesswork); a fixed sample count keeps it deterministic. */
    const outer = [], inner = [];
    for (let s = 0; s <= SAMP; s++) outer.push(polar(Ro, ta + (tb - ta) * s / SAMP, cx, cy));
    for (let s = SAMP; s >= 0; s--) inner.push(polar(Ri, ta + (tb - ta) * s / SAMP, cx, cy));
    const poly = outer.concat(inner);         /* closed boundary, extrados then intrados */
    const corners = {
      innerA: polar(Ri, ta, cx, cy), innerB: polar(Ri, tb, cx, cy),
      outerA: polar(Ro, ta, cx, cy), outerB: polar(Ro, tb, cx, cy)
    };
    const centroid = polar((Ri + Ro) / 2, mid, cx, cy);
    const kind = (j === keystoneIndex) ? 'keystone' : (j === 0 || j === N - 1) ? 'springer' : 'voussoir';
    const hand = kind === 'springer' ? 'first' : kind === 'keystone' ? 'last' : 'fresh';
    const course = Math.min(j, N - 1 - j);    /* rings up from the nearest springer */
    voussoirs.push({ j: j, thetaA: ta, thetaB: tb, mid: mid, poly: poly, corners: corners,
      centroid: centroid, kind: kind, hand: hand, course: course,
      stage: stageOfVoussoir(j, N) });
  }
  return { cx: cx, cy: cy, Ri: Ri, Ro: Ro, N: N, dTheta: dTheta,
    keystoneIndex: keystoneIndex, springerIndices: [0, N - 1], voussoirs: voussoirs };
}

/* the ring band outline (extrados out, intrados back) — drawn faint as the
   "centering" ghost the audience reads as the arch's target shape. */
export function ringOutline(arch, samples) {
  const n = samples || 64;
  const pts = [];
  for (let s = 0; s <= n; s++) pts.push(polar(arch.Ro, 180 * s / n, arch.cx, arch.cy));
  for (let s = n; s >= 0; s--) pts.push(polar(arch.Ri, 180 * s / n, arch.cx, arch.cy));
  return pts;
}

/* THE LINE OF THRUST: the compression path threading the seated ring springer to
   springer through the crown — the mid-ring arc, a faithful schematic of the single
   contained line, drawn only once the ring is locked. */
export function thrustPath(arch, samples) {
  const n = samples || 64;
  const Rm = (arch.Ri + arch.Ro) / 2;
  const pts = [];
  for (let s = 0; s <= n; s++) pts.push(polar(Rm, 180 * s / n, arch.cx, arch.cy));
  return pts;
}

/* THE SELF-TEST BATTERY — the same shape checks the in-page pill and the Node twin
   both run over one source: the arch is a well-formed ring, the stages partition
   every voussoir exactly once and monotonically, and the geometry is finite. */
export function selfTestBattery(arch) {
  arch = arch || buildArch();
  const N = arch.N;
  const checks = [];
  const add = (label, pass) => checks.push({ label: label, pass: !!pass });

  add('odd voussoir count, one keystone at the crown',
    N % 2 === 1 && arch.keystoneIndex === (N - 1) / 2 && arch.voussoirs[arch.keystoneIndex].kind === 'keystone');

  add('exactly two springers, at the ends',
    arch.springerIndices.length === 2 && arch.springerIndices[0] === 0 && arch.springerIndices[1] === N - 1 &&
    arch.voussoirs[0].kind === 'springer' && arch.voussoirs[N - 1].kind === 'springer');

  add('five stages (yard + four placements)', STAGES.length === 5);

  /* stages 1..3 place every voussoir exactly once */
  let partition = true;
  for (let j = 0; j < N; j++) { const s = stageOfVoussoir(j, N); if (s < 1 || s > 3) partition = false; }
  const placed = voussoirsSetAt(3, N);
  add('stages 1..3 place every voussoir exactly once',
    partition && placed.length === N && new Set(placed).size === N);

  /* monotone: each stage's set contains the previous (nothing is ever un-set) */
  let mono = true;
  for (let k = 1; k <= 4; k++) {
    const prev = voussoirsSetAt(k - 1, N), curr = new Set(voussoirsSetAt(k, N));
    for (const j of prev) if (!curr.has(j)) mono = false;
  }
  add('placement is monotone (nothing already set is removed)', mono);

  add('the locked ring is the whole ring',
    voussoirsSetAt(4, N).length === N && archStateAt(4, N).ringClosed && archStateAt(4, N).locked);

  add('the yard (stage 0) holds nothing up', voussoirsSetAt(0, N).length === 0 && !archStateAt(0, N).ringClosed);

  /* adjacent voussoirs share a joint (the ring is continuous) */
  let closed = true;
  for (let j = 0; j < N - 1; j++) if (Math.abs(arch.voussoirs[j].thetaB - arch.voussoirs[j + 1].thetaA) > 1e-9) closed = false;
  add('adjacent voussoirs share a joint (continuous ring)', closed);

  /* geometry finite */
  let finite = true;
  for (const v of arch.voussoirs) for (const q of v.poly) if (!isFinite(q[0]) || !isFinite(q[1])) finite = false;
  add('all geometry finite (no NaN)', finite);

  return { checks: checks, pass: checks.every((c) => c.pass) };
}
