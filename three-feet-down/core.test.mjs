/* ══════════════════════════════════════════════════════════════════════════════
   THREE FEET DOWN — the Node twin.

       node three-feet-down/core.test.mjs

   Everything asserted here is asserted about the SAME Beast class the page
   animates.  There is no second model of the creature.
   ══════════════════════════════════════════════════════════════════════════════ */
import {
  Beast, GAITS, gaitsFor, hull2, hullMargin, planeFit, kneePos, bodyPlan,
  measureStability, dutyThreshold, dutyForThreeFeet, minFeetLaw,
  waveDutyThreshold, alternatingDutyThreshold, predictThreshold,
  add, sub, len, norm,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '  ' + detail); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const H = (s) => console.log('\n\x1b[1m' + s + '\x1b[0m');

/* ── A · geometry ──────────────────────────────────────────────────────────── */
H('A · hull, margin, plane, IK');
{
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]];
  const h = hull2(sq);
  ok('hull of a square + interior point has 4 corners', h.length === 4, 'got ' + h.length);
  ok('centre is inside, margin = half the side', near(hullMargin(h, [0.5, 0.5]), 0.5, 1e-9), hullMargin(h, [0.5, 0.5]).toFixed(6));
  ok('a point outside reads negative', hullMargin(h, [1.25, 0.5]) < 0, hullMargin(h, [1.25, 0.5]).toFixed(3));
  ok('a point on the edge reads zero', near(hullMargin(h, [1, 0.5]), 0, 1e-9));

  /* two feet make a line — a line has no interior, at any point along it */
  const line = hull2([[0, 0], [1, 0]]);
  ok('two points: the margin is never positive', hullMargin(line, [0.5, 0]) <= 0 && hullMargin(line, [0.5, 0.3]) < 0);

  const pf = planeFit([[0, 0, 0], [1, 0.5, 0], [0, 0.25, 1], [1, 0.75, 1]]);
  ok('plane fit recovers y = 0.5x + 0.25z', near(pf.a, 0.5, 1e-9) && near(pf.b, 0.25, 1e-9) && near(pf.c, 0, 1e-9),
    `a=${pf.a.toFixed(4)} b=${pf.b.toFixed(4)} c=${pf.c.toFixed(4)}`);

  const hip = [0, 1, 0], foot = [0.34, 0.36, 0.12], l1 = 0.46, l2 = 0.54;
  const k = kneePos(hip, foot, l1, l2, [0, 1, 0.6]);
  ok('IK: femur is exactly l1', near(len(sub(k.knee, hip)), l1, 1e-9), len(sub(k.knee, hip)).toFixed(9));
  ok('IK: tibia is exactly l2', near(len(sub(k.knee, foot)), l2, 1e-9), len(sub(k.knee, foot)).toFixed(9));
  const far = kneePos(hip, [3, 0, 0], l1, l2, [0, 1, 0]);
  ok('IK: an unreachable foot straightens the leg instead of tearing it', far.clamped && near(far.reach, (l1 + l2) * 0.999, 1e-9));
}

/* ── B · walking is walking: a planted foot does not move ─────────────────── */
H('B · a planted foot is fixed to the world');
{
  const b = new Beast({ ground: () => 0, legs: 6, gait: 'tripod', duty: 0.5, speed: 0.9 });
  b.target = [0, 0, 1e5];
  for (let i = 0; i < 2000; i++) b.step(1 / 400);
  const before = b.feet.map((f) => ({ down: f.down, p: f.pos.slice() }));
  b.step(1 / 400);
  let maxDrift = 0, checked = 0;
  b.feet.forEach((f, i) => {
    if (f.down && before[i].down) { maxDrift = Math.max(maxDrift, len(sub(f.pos, before[i].p))); checked++; }
  });
  ok('every foot that stayed down did not move a nanometre', maxDrift < 1e-12 && checked >= 2,
    `${checked} feet, drift ${maxDrift.toExponential(1)} m`);

  const x0 = b.pos[0], z0 = b.pos[2];
  for (let i = 0; i < 400; i++) b.step(1 / 400);
  const travelled = Math.hypot(b.pos[0] - x0, b.pos[2] - z0);
  ok('and yet the body advanced ~one second of speed', travelled > 0.7 && travelled < 1.0, travelled.toFixed(3) + ' m in 1 s at 0.9 m/s');
}

/* ── C · the count law ─────────────────────────────────────────────────────── */
H('C · how many feet are down');
{
  for (const [legs, gait, duty] of [[6, 'wave', 0.5], [6, 'wave', 0.7], [8, 'wave', 0.6], [4, 'walk', 0.8]]) {
    const r = measureStability({ legs, gait, duty, samples: 600 });
    ok(`${legs} legs, ${gait}, duty ${duty}: fewest feet down = floor(N·beta) = ${minFeetLaw(legs, duty)}`,
      r.minDown === minFeetLaw(legs, duty), `measured ${r.minDown}..${r.maxDown}`);
  }
}

/* ── D · THE CLAIM ─────────────────────────────────────────────────────────── */
H('D · statically stable means the mass is over the polygon');
{
  const trip = measureStability({ legs: 6, gait: 'tripod', duty: 0.5, samples: 720 });
  ok('hexapod, alternating tripod, duty 1/2 — stable every instant of the cycle',
    trip.fraction >= 0.999 && trip.minDown === 3,
    `${(trip.fraction * 100).toFixed(1)}% stable, ${trip.minDown} feet down, worst margin ${trip.minMargin.toFixed(3)} m`);

  const flank = measureStability({ legs: 6, gait: 'flank', duty: 0.5, samples: 720 });
  ok('hexapod, one side at a time, duty 1/2 — THREE feet down and never stable',
    flank.minDown === 3 && flank.fraction <= 0.001,
    `${(flank.fraction * 100).toFixed(1)}% stable, ${flank.minDown} feet down, worst margin ${flank.minMargin.toFixed(3)} m`);
  ok('  … so three feet down is necessary and NOT sufficient',
    trip.minDown === flank.minDown && trip.fraction > 0.99 && flank.fraction < 0.01,
    'same foot count, opposite verdict');

  const trot = measureStability({ legs: 4, gait: 'trot', duty: 0.5, samples: 720 });
  ok('quadruped trot, duty 1/2 — two feet down, never statically stable',
    trot.maxDown <= 2 && trot.fraction <= 0.001,
    `${(trot.fraction * 100).toFixed(1)}% stable, ${trot.minDown}..${trot.maxDown} feet down`);

  const walk = measureStability({ legs: 4, gait: 'walk', duty: 0.8, samples: 720 });
  ok('quadruped walk, duty 4/5 — three feet down and stable throughout',
    walk.minDown === 3 && walk.fraction >= 0.999,
    `${(walk.fraction * 100).toFixed(1)}% stable, worst margin ${walk.minMargin.toFixed(3)} m`);

  const biped = measureStability({ legs: 2, gait: 'stride', duty: 0.62, samples: 720 });
  ok('biped — statically stable at no instant of any cycle, at any duty',
    biped.fraction === 0, `${(biped.fraction * 100).toFixed(1)}% stable, at most ${biped.maxDown} feet down`);
  let anyBiped = 0;
  for (let d = 0.3; d <= 0.95; d += 0.05) anyBiped += measureStability({ legs: 2, gait: 'stride', duty: d, samples: 180 }).fraction;
  ok('  … swept across every duty from 0.30 to 0.95', anyBiped === 0, 'total stable fraction ' + anyBiped);
}

/* ── E · the thresholds: counted on paper, then measured on the animal ────── */
H('E · the lowest duty that keeps it up — predicted on paper, then bisected');
{
  /* The predictions come from counting feet.  The measurements come from
     walking a beast with IK, a fitted ground plane and a mass taken from its
     own drawn bones, and bisecting for the duty where the whole cycle is
     stable.  Nothing was fitted to anything. */
  const cases = [
    [4, 'walk',   waveDutyThreshold(4), '1/2 + 1/4'],
    [6, 'wave',   waveDutyThreshold(6), '1/2 + 1/6'],
    [8, 'wave',   waveDutyThreshold(8), '1/2 + 1/8'],
    [6, 'tripod', alternatingDutyThreshold(), '1/2'],
    [8, 'tripod', alternatingDutyThreshold(), '1/2'],
  ];
  const th = {};
  for (const [n, g, want, how] of cases) {
    const t = dutyThreshold({ legs: n, gait: g, lean: 0, samples: 620 });
    th[n + g] = t;
    const d = t ? t.duty - want : NaN;
    /* six and eight legs hit the counting bound exactly.  Four does not, and the
       next check says why — so here four only has to NOT BEAT the bound. */
    const exact = n >= 6;
    ok(`${n}-leg ${g}: threshold = ${how}${exact ? '' : ' — but not exactly; see the diagonal, below'}`,
      !!t && d > -0.004 && (exact ? d < 0.004 : d < 0.06),
      `predicted ${want.toFixed(4)}, bisected ${t ? t.duty.toFixed(4) : '—'} (Δ ${(d * 1000).toFixed(1)} milliduty)`);
  }

  /* WHY four legs is different, and it is the nicest fact in the room.
     At beta = 3/4 a quadruped always has exactly three feet down, and the two it
     has on one side plus the one it has on the other make a triangle whose long
     edge is a DIAGONAL of its own support rectangle — and that diagonal runs
     straight under the middle of the animal.  So the margin is not small: it is
     zero.  A hexapod tripod at its own threshold has a hand's breadth. */
  const mq = measureStability({ legs: 4, gait: 'walk', duty: 0.75, lean: 0, samples: 900 });
  const mh = measureStability({ legs: 6, gait: 'tripod', duty: 0.50, lean: 0, samples: 900 });
  ok('at beta = 3/4 a quadruped rides on the diagonal of its own rectangle: margin ~ 0',
    Math.abs(mq.minMargin) < 0.03 && mq.minDown === 3,
    `worst margin over the cycle ${(mq.minMargin * 100).toFixed(2)} cm on ${mq.minDown} feet`);
  ok('  … while a hexapod tripod at ITS threshold has centimetres of clearance, all cycle',
    mh.minMargin > 0.04 && mq.minMargin <= 0,
    `hexapod ${(mh.minMargin * 100).toFixed(2)} cm of clearance at every instant; ` +
    `quadruped ${(mq.minMargin * 100).toFixed(2)} cm — none at all`);
  ok('  … which is why a slow-walking horse sways over the standing side and a beetle need not',
    th['4walk'].duty > dutyForThreeFeet(4) && th['6tripod'].duty <= 0.504,
    `quadruped must go to beta ${th['4walk'].duty.toFixed(4)} to get off the diagonal`);

  ok('  … so at six legs the tripod stands on the floor 3/N and the wave does not',
    Math.abs(alternatingDutyThreshold() - dutyForThreeFeet(6)) < 1e-12 &&
    waveDutyThreshold(6) > dutyForThreeFeet(6) + 0.1,
    'tripod 0.5000 = 3/6 · wave 0.6667. No six-legged gait can be stable below 0.5.');

  /* the invariant behind all of it: a polygon needs three corners */
  let instants = 0, thin = 0, thinAndStable = 0;
  for (const [n, g] of [[2, 'stride'], [4, 'walk'], [4, 'trot'], [4, 'bound'], [6, 'tripod'], [6, 'wave'], [6, 'flank'], [8, 'wave']]) {
    for (const duty of [0.3, 0.42, 0.55, 0.68, 0.8, 0.92]) {
      const b = new Beast({ ground: () => 0, legs: n, gait: g, duty, speed: 0.85, lean: (n + duty) % 2 < 1 ? 1 : 0 });
      b.duty = duty; b.target = [0, 0, 1e5];
      for (let i = 0; i < 900; i++) b.step(1 / 300);
      for (let i = 0; i < 300; i++) {
        b.step(1 / 300);
        const s = b.support(); instants++;
        if (s.nDown < 3) { thin++; if (s.stable) thinAndStable++; }
      }
    }
  }
  ok('across 48 configurations, no instant with fewer than three feet down was ever stable',
    thinAndStable === 0 && thin > 2000,
    `${instants} instants, ${thin} of them under three feet, ${thinAndStable} of those stable`);

  /* the corollary for evenly-phased gaits: the thin instant sets the duty floor */
  for (const [n, g] of [[4, 'walk'], [6, 'wave'], [8, 'wave']]) {
    const r = measureStability({ legs: n, gait: g, duty: dutyForThreeFeet(n) * 0.97, lean: 1, samples: 300 });
    ok(`  ${n}-leg ${g} just below beta = 3/${n}: the thin instant drops to ${r.minDown} feet, so no cycle is whole`,
      r.minDown < 3 && r.fraction < 1, `${(r.fraction * 100).toFixed(0)}% of the cycle stable`);
  }

  /* and the other side of one half: an alternating gait leaves the ground */
  const air = measureStability({ legs: 6, gait: 'tripod', duty: 0.44, samples: 400 });
  ok('an alternating gait below duty 1/2 has a FLIGHT PHASE — instants with nothing down at all',
    air.minDown === 0, `fewest feet down ${air.minDown}, most ${air.maxDown}, ${(air.fraction * 100).toFixed(0)}% stable`);
}

/* ── F · the beast rides the ground ───────────────────────────────────────── */
H('F · it walks up a hill instead of through it');
{
  const slope = 0.28;
  const b = new Beast({ ground: (x, z) => z * slope, legs: 6, gait: 'tripod', duty: 0.55, speed: 0.8 });
  b.target = [0, 0, 1e5];
  for (let i = 0; i < 4000; i++) b.step(1 / 400);
  const clear = b.pos[1] - (b.pos[2] * slope);
  ok('trunk rides ~one stand-height above the slope it is on',
    near(clear, b.plan.stand, 0.09), `clearance ${clear.toFixed(3)} m vs stand ${b.plan.stand.toFixed(3)} m`);
  const tilt = Math.atan2(-b.up[2], b.up[1]);
  ok('and it pitches to match the slope', near(tilt, Math.atan(slope), 0.06),
    `pitch ${(tilt * 57.2958).toFixed(1)}°, slope ${(Math.atan(slope) * 57.2958).toFixed(1)}°`);
  let lowest = Infinity;
  for (const s of b.segments()) if (s.kind === 'trunk') lowest = Math.min(lowest, s.a[1] - s.a[2] * slope, s.b[1] - s.b[2] * slope);
  ok('no part of the trunk is underground', lowest > 0.2, 'lowest trunk clearance ' + lowest.toFixed(3) + ' m');
}

/* ── G · a shove is caught by where the next foot goes ────────────────────── */
H('G · shoved, it catches itself');
{
  const b = new Beast({ ground: () => 0, legs: 6, gait: 'tripod', duty: 0.55, speed: 0.8 });
  b.target = [0, 0, 1e5];
  for (let i = 0; i < 3000; i++) b.step(1 / 400);
  b.shove(2.4, 0);
  const vx0 = Math.abs(b.vel[0]);
  let worst = 0;
  for (let i = 0; i < 1400; i++) { b.step(1 / 400); worst = Math.max(worst, Math.abs(b.vel[0])); }
  ok('the sideways velocity is bled off', Math.abs(b.vel[0]) < 0.25 * vx0, `${vx0.toFixed(2)} → ${Math.abs(b.vel[0]).toFixed(3)} m/s`);
  const off = Math.abs(b.pos[0]);
  ok('and it does not simply keep sliding', off < 3.0, 'displaced ' + off.toFixed(2) + ' m and settled');
  let stable = 0, N = 800;
  for (let i = 0; i < N; i++) { b.step(1 / 400); if (b.support().stable) stable++; }
  ok('once recovered it is statically stable again', stable / N >= 0.98, ((stable / N) * 100).toFixed(1) + '%');
}

/* ── H · the body plan and the gait table hold together ───────────────────── */
H('H · plan + gait bookkeeping');
{
  for (const n of [2, 4, 6, 8]) {
    const p = bodyPlan(n);
    ok(`${n} legs → ${n} hips, ${n / 2} pairs, mirrored left/right`,
      p.hips.length === n && p.pairs === n / 2 &&
      p.hips.filter((h) => h.side === -1).length === n / 2, '');
    const gs = gaitsFor(n);
    ok(`  and ${gs.length} gait(s) offered, each with ${n} phase offsets`,
      gs.length > 0 && gs.every((g) => g.offsets(n / 2).length === n),
      gs.map((g) => g.id).join(', '));
  }
  ok('every gait in the table is offered to at least one leg count',
    GAITS.every((g) => g.legs.some((n) => gaitsFor(n).includes(g))));
  const b = new Beast({ ground: () => 0, legs: 6, gait: 'tripod' });
  b.setLegs(4);
  ok('changing to four legs drops a six-leg-only gait for a real quadruped one',
    gaitsFor(4).some((g) => g.id === b.gaitId), 'now: ' + b.gaitId);
}

/* ── I · the centre of mass comes out of the bones that get drawn ─────────── */
H('I · the mass is the drawing');
{
  const b = new Beast({ ground: () => 0, legs: 6, gait: 'tripod', duty: 0.5, speed: 0 });
  b.freeze = true;
  for (let i = 0; i < 800; i++) b.step(1 / 200);
  const c = b.com();
  ok('standing still, the CoM sits on the midline', Math.abs(c[0] - b.pos[0]) < 0.05, 'offset ' + (c[0] - b.pos[0]).toFixed(4) + ' m');
  ok('and below the top of the trunk', c[1] < b.pos[1] + 0.02, `com y ${c[1].toFixed(3)} vs trunk ${b.pos[1].toFixed(3)}`);
  const s = b.support();
  ok('and inside the polygon its own feet make', s.stable, `margin ${s.margin.toFixed(3)} m on ${s.nDown} feet`);
}

/* ── K · every gait in the room, predicted then measured ─────────────────── */
H('K · the predictor, against the measurement, for every gait the room offers');
{
  let agree = 0, total = 0;
  const misses = [];
  for (const n of [2, 4, 6, 8]) {
    for (const g of gaitsFor(n)) {
      total++;
      const p = predictThreshold(n, g.id);
      const m = dutyThreshold({ legs: n, gait: g.id, lean: 0, samples: 520 });
      const same = (p.duty == null) === (m == null) && (p.duty == null || Math.abs(m.duty - p.duty) < 0.006);
      if (same) agree++; else misses.push(`${n}-leg ${g.id} (predicted ${p.duty == null ? 'never' : p.duty.toFixed(4)}, measured ${m == null ? 'never' : m.duty.toFixed(4)})`);
    }
  }
  ok(`${agree} of ${total} gaits: counting feet gives the measured threshold to four decimals`,
    agree === total - 1 && misses.length === 1 && misses[0].startsWith('4-leg walk'),
    'the one that does not: ' + misses.join('; '));
  ok('  … and the exception is the four-legged walk, riding its own diagonal',
    misses.length === 1 && misses[0].startsWith('4-leg walk'),
    'every other gait — including four-legged trot, pace and bound, and the six- and ' +
    'eight-legged flank — is predicted exactly, "never" included');
}

/* ── J · shifting the weight ──────────────────────────────────────────────── */
H('J · a walking animal moves its body over the legs carrying it');
{
  /* The lean is bounded by a search inside the polygon that exists RIGHT NOW,
     and t = 0 is always one of the candidates, so it is not allowed to make
     anything worse.  Check that on a spread of gaits. */
  let worse = 0, better = 0;
  const grid = [[4,'walk',0.76],[4,'walk',0.82],[4,'trot',0.5],[4,'pace',0.6],
                [6,'tripod',0.5],[6,'tripod',0.62],[6,'wave',0.70],[6,'flank',0.5],
                [8,'wave',0.63],[8,'tripod',0.55],[2,'stride',0.62]];
  const cells = [];
  for (const [n,g,d] of grid){
    const a = measureStability({ legs:n, gait:g, duty:d, lean:0, samples:420 });
    const b = measureStability({ legs:n, gait:g, duty:d, lean:1, samples:420 });
    cells.push([n,g,d,a,b]);
    if (b.fraction < a.fraction - 1e-9) worse++;
    if (b.fraction > a.fraction + 1e-9) better++;
  }
  ok('across 11 gait/duty cells the weight shift never lowers the stable fraction',
    worse === 0, `${better} improved, ${worse} worsened`);

  const t0 = dutyThreshold({ legs:4, gait:'walk', lean:0, samples:420 });
  const t1 = dutyThreshold({ legs:4, gait:'walk', lean:1, samples:420 });
  ok('and on four legs it drops the walk threshold toward the counting bound 3/4',
    t1.duty < t0.duty - 0.008 && t1.duty > dutyForThreeFeet(4) - 1e-9,
    `${t0.duty.toFixed(4)} → ${t1.duty.toFixed(4)}, bound 0.7500`);

  const th0 = dutyThreshold({ legs:6, gait:'tripod', lean:0, samples:420 });
  const th1 = dutyThreshold({ legs:6, gait:'tripod', lean:1, samples:420 });
  ok('  … and does nothing at all for the hexapod tripod, which was already optimal',
    Math.abs(th1.duty - th0.duty) < 0.004 && Math.abs(th1.duty - 0.5) < 0.004,
    `${th0.duty.toFixed(4)} → ${th1.duty.toFixed(4)}`);

  const tr = measureStability({ legs:4, gait:'trot', duty:0.5, lean:1, samples:420 });
  ok('  … and cannot rescue a two-foot gait, because there is no polygon to move into',
    tr.fraction === 0, `trot with a full weight shift: ${(tr.fraction*100).toFixed(0)}% stable`);
}

console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
