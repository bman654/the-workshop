// ============================================================================
//  THE JUGGLER'S PITCH — the Node twin.
//    node the-jugglers-pitch/juggle.test.mjs
//
//  Everything the room claims, proved against the SAME engine the page runs.
//  Nothing here is a tolerance band where an integer will do.
// ============================================================================
import {
  parsePattern, formatPattern, permutationTest, simulationTest, analyse, ballCount,
  crosses, airTime, apexHeight, countByBrute, countByOrbits, arrivalState,
  Juggle, poseAt, solveElbow, BODY, HANDS, DEFAULTS, G, REPERTOIRE,
} from './juggle.mjs';

let pass = 0, fail = 0;
const ok = (cond, msg, extra) => {
  if (cond) { pass++; }
  else { fail++; console.log('  FAIL  ' + msg + (extra !== undefined ? '   [' + extra + ']' : '')); }
};
const near = (a, b, eps, msg) => ok(Math.abs(a - b) <= eps, msg, a + ' vs ' + b);
const head = (s) => console.log('\n' + s);

// ─────────────────────────────────────────────────────────────────────────────
head('PART A — notation');
{
  ok(parsePattern('531').seq.join(',') === '5,3,1', 'A1 531 parses');
  ok(parsePattern('9 7 5 3 1').seq.join(',') === '9,7,5,3,1', 'A2 spaces ignored');
  ok(parsePattern('b97').seq.join(',') === '11,9,7', 'A3 letters carry throws above 9');
  ok(parsePattern('5!3').ok === false, 'A4 a non-throw is refused');
  ok(parsePattern('').ok === false, 'A5 empty is refused');
  ok(formatPattern([11, 9, 7]) === 'b97', 'A6 round trip');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART B — the two tests of validity agree, exhaustively');
// The algebraic test (i + s[i] mod n is a permutation) and the simulation test
// (throw it for 120 beats and see whether anything collides or a hand comes up
// empty) know nothing about each other.  Over every sequence of period 1..5
// with throws 0..9 — 111,110 of them — they must return the same verdict.
{
  let checked = 0, valid = 0, disagreements = 0, firstBad = null;
  const seq = [];
  const walk = (n, i) => {
    if (i === n) {
      const p = permutationTest(seq).valid;
      const s = simulationTest(seq, 60).valid;
      checked++;
      if (p !== s) { disagreements++; if (!firstBad) firstBad = seq.slice(); }
      if (p) valid++;
      return;
    }
    for (let v = 0; v <= 9; v++) { seq[i] = v; walk(n, i + 1); }
  };
  for (let n = 1; n <= 5; n++) { seq.length = n; walk(n, 0); }
  ok(checked === 111110, 'B1 every sequence of period<=5, throws 0..9, was tested', checked);
  ok(disagreements === 0, 'B2 algebra and simulation NEVER disagree', firstBad ? formatPattern(firstBad) : '');
  ok(valid > 0 && valid < checked, 'B3 the tests discriminate (they are not both trivially true)', valid + '/' + checked);
  console.log('       ' + valid.toLocaleString() + ' of ' + checked.toLocaleString() + ' sequences are juggleable');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART C — the average IS the ball count');
{
  // Not asserted from the mean: COUNTED, by watching how many balls the
  // simulation has aloft-or-held, and then compared with the mean.
  let checked = 0, mismatches = 0, nonInteger = 0;
  const seq = [];
  const walk = (n, i) => {
    if (i === n) {
      const s = simulationTest(seq, 60);
      if (s.valid) {
        const bc = ballCount(seq);
        checked++;
        if (!bc.exact) nonInteger++;
        if (s.balls !== bc.balls) mismatches++;
      }
      return;
    }
    for (let v = 0; v <= 9; v++) { seq[i] = v; walk(n, i + 1); }
  };
  for (let n = 1; n <= 5; n++) { seq.length = n; walk(n, 0); }
  ok(mismatches === 0, 'C1 counted balls === mean(s) for every juggleable pattern', mismatches);
  ok(nonInteger === 0, 'C2 a juggleable pattern NEVER has a fractional average', nonInteger);
  ok(checked === 5088, 'C3 all 5,088 juggleable sequences of period<=5 were counted, not a handful', checked);
  // and the converse bites: a fractional average is never juggleable
  ok(!permutationTest([4, 3]).valid, 'C4 43 (mean 3.5) is refused');
  ok(!permutationTest([3, 2]).valid, 'C5 32 (mean 2.5) is refused');
  ok(permutationTest([4, 4, 1]).valid && ballCount([4, 4, 1]).balls === 3, 'C6 441 is three balls');
  ok(permutationTest([9, 7, 5, 3, 1]).valid && ballCount([9, 7, 5, 3, 1]).balls === 5, 'C7 97531 is five balls');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART D — the counting law: (b+1)^n, exactly');
// Buhler, Eisenbud, Graham & Wright: the number of period-n patterns using at
// most b balls is (b+1)^n.  Two independent counts, both against the integer.
{
  let cells = 0, hits = 0;
  const rows = [];
  for (let n = 1; n <= 5; n++) {
    const row = [];
    for (let b = 0; b <= 5; b++) {
      const want = Math.pow(b + 1, n);
      const brute = countByBrute(n, b);
      const orbits = countByOrbits(n, b);
      cells++;
      if (brute === want && orbits === want) hits++;
      else console.log('  FAIL  D n=' + n + ' b=' + b + ': brute ' + brute + ', orbits ' + orbits + ', want ' + want);
      row.push(brute);
    }
    rows.push(row);
  }
  ok(hits === cells, 'D1 all ' + cells + ' cells of the table hit (b+1)^n exactly', hits + '/' + cells);
  console.log('       n\\b   ' + [0, 1, 2, 3, 4, 5].map((b) => String(b).padStart(7)).join(''));
  rows.forEach((r, i) => console.log('        ' + (i + 1) + '    ' + r.map((v) => String(v).padStart(7)).join('')));
  // push the SECOND method further, where brute force cannot follow
  let far = 0, farHits = 0;
  for (let n = 6; n <= 8; n++) for (let b = 0; b <= 6; b++) { far++; if (countByOrbits(n, b) === Math.pow(b + 1, n)) farHits++; }
  ok(farHits === far, 'D2 the orbit count keeps hitting it out to period 8', farHits + '/' + far);
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART E — odd crosses, even does not');
// Measured off the running pattern, not asserted: for every throw the engine
// schedules, look at which hand actually catches it.
{
  const pats = ['3', '4', '531', '441', '423', '51', '552', '7', '645', '97531', '744', '55550', '801'];
  let throws = 0, wrong = 0;
  for (const p of pats) {
    const j = new Juggle(parsePattern(p).seq);
    j.build(400);
    for (const b of j.balls) {
      for (const s of b.segs) {
        if (s.kind !== 'fly' || s.beat < 0) continue;
        throws++;
        const crossed = s.hand !== s.toHand;
        if (crossed !== crosses(s.v)) wrong++;
      }
    }
  }
  ok(throws > 4000, 'E1 a few thousand real throws were watched', throws);
  ok(wrong === 0, 'E2 a throw crosses to the other hand iff its digit is odd', wrong);
  // and the visible consequence: the cascade's arcs cross, the fountain's do not
  const cas = new Juggle([3]); cas.build(60);
  const fou = new Juggle([4]); fou.build(60);
  const sideChanges = (j) => j.balls.reduce((a, b) => a + b.segs.filter((s) => s.kind === 'fly' && s.beat >= 0 && Math.sign(s.p0[0]) !== Math.sign(s.p1[0])).length, 0);
  ok(sideChanges(cas) > 50, 'E3 in a 3-cascade every arc changes side of the body', sideChanges(cas));
  ok(sideChanges(fou) === 0, 'E4 in a 4-fountain NO arc changes side', sideChanges(fou));
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART F — the ballistics');
{
  const T = DEFAULTS.beatT, d = DEFAULTS.dwell;
  // the flown trajectory's own apex, measured by sampling, matches g*air^2/8
  const j = new Juggle(parsePattern('97531').seq, { beatT: T, dwell: d });
  j.build(200);
  let worst = 0;
  for (const b of j.balls) {
    for (const s of b.segs) {
      if (s.kind !== 'fly' || s.beat < 0 || s.beat > 100) continue;
      let hi = -1e9;
      for (let k = 0; k <= 400; k++) {
        const t = s.t0 + (s.t1 - s.t0) * (k / 400);
        hi = Math.max(hi, j._ballAt(b, t).pos[1]);
      }
      const want = HANDS.y + apexHeight(s.v, T, d);
      worst = Math.max(worst, Math.abs(hi - want));
    }
  }
  near(worst, 0, 2e-4, 'F1 every sampled arc peaks at hand height + g*(s-d)^2*T^2/8');
  // the ratio law, stated as the room states it
  near(apexHeight(5, T, d) / apexHeight(3, T, d), Math.pow((5 - d) / (3 - d), 2), 1e-12, 'F2 h(5)/h(3) = ((5-d)/(3-d))^2');
  near(apexHeight(3, T, d), 0.678, 2e-3, 'F3 a 3 at the house tempo peaks 0.678 m above the hands');
  near(apexHeight(5, T, d), 2.451, 4e-3, 'F4 a 5 peaks 2.451 m — not 5/3 of a 3 but 3.61x');
  near(apexHeight(5, T, d) / apexHeight(3, T, d), 3.6136, 1e-3, 'F4b and that ratio is exactly ((5-d)/(3-d))^2');
  ok(apexHeight(7, T, d) > 2 * apexHeight(5, T, d), 'F5 and a 7 more than doubles a 5 again');
  near(airTime(3, T, d), (3 - d) * T, 1e-12, 'F6 air time is (s - dwell) beats');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART G — the animation holds together');
{
  const pats = ['3', '4', '5', '531', '441', '423', '51', '552', '645', '97531', '744', '55550', '801', '7'];
  let worstJump = 0, worstJumpPat = '', worstHandGap = 0, worstHandPat = '';
  let outOfReach = 0, minBallY = 1e9;
  for (const p of pats) {
    const seq = parsePattern(p).seq;
    const j = new Juggle(seq);
    const T = j.beatT;
    const N = 3000;
    let prev = null;
    for (let k = 0; k <= N; k++) {
      const t = (k / N) * 20 * T;
      const s = j.sample(t);
      if (prev) {
        for (let i = 0; i < s.balls.length; i++) {
          const a = prev.balls[i].pos, b = s.balls[i].pos;
          const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
          if (d > worstJump) { worstJump = d; worstJumpPat = p; }
        }
      }
      prev = s;
      for (const b of s.balls) minBallY = Math.min(minBallY, b.pos[1]);
      // a hand holding a ball must be AT that ball
      for (let h = 0; h < 2; h++) {
        const hp = s.hands[h].pos;
        if (!s.hands[h].holding) continue;
        let best = 1e9;
        for (const b of s.balls) if (!b.flying) best = Math.min(best, Math.hypot(hp[0] - b.pos[0], hp[1] - b.pos[1], hp[2] - b.pos[2]));
        if (best < 1e8 && best > worstHandGap) { worstHandGap = best; worstHandPat = p; }
      }
      // and the arms must reach
      const pose = poseAt(j, t);
      for (const [sh, hd] of [['shoulderR', 'handR'], ['shoulderL', 'handL']]) {
        const S = pose.joints[sh], H = pose.joints[hd];
        const L = Math.hypot(S[0] - H[0], S[1] - H[1], S[2] - H[2]);
        if (L > BODY.upperArm + BODY.foreArm) outOfReach++;
      }
    }
  }
  // a step of 20*T/3000 s at a 5-ball apex speed is a few mm; anything bigger is a seam
  // The bound is not a magic number: the fastest a ball can be moving is its
  // launch speed g*air/2 for the tallest throw in the set, so no sampled step
  // may exceed that times the sampling interval.
  {
    const tallest = 9;
    const jj = new Juggle([9]);
    const vLaunch = G * airTime(tallest, jj.beatT, jj.dwell) / 2;
    const dt = 20 * jj.beatT / 3000;
    const bound = vLaunch * dt * 1.02;
    ok(worstJump < bound, 'G1 no ball outruns its own launch speed between frames (a seam would)',
       worstJump.toFixed(5) + ' m vs bound ' + bound.toFixed(5) + ' (' + worstJumpPat + ')');
    ok(worstJump > bound * 0.3, 'G1b and the bound is tight enough to be a real test', worstJump.toFixed(5));
  }
  near(worstHandGap, 0, 1e-9, 'G2 a hand that is holding a ball is exactly on it (' + worstHandPat + ')');
  ok(outOfReach === 0, 'G3 the arms reach every throw and catch, always', outOfReach);
  ok(minBallY > 0.75, 'G4 nothing is ever dropped on the grass', minBallY.toFixed(3));
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART H — the pattern really is periodic');
// The configuration must repeat after lcm(n,2) beats: same balls, same places,
// only the identities rotated.  This is a structural check on the scheduler.
{
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  let worst = 0, worstPat = '';
  for (const p of ['3', '4', '531', '441', '423', '51', '552', '645', '97531', '55550']) {
    const seq = parsePattern(p).seq;
    const n = seq.length;
    const P = (2 * n) / gcd(2, n);
    const j = new Juggle(seq);
    for (let k = 0; k <= 40; k++) {
      const t = 4 * j.beatT + (k / 40) * 2 * j.beatT;
      const A = j.sample(t).balls.map((b) => b.pos.map((x) => x.toFixed(6)).join(',')).sort();
      const B = j.sample(t + P * j.beatT).balls.map((b) => b.pos.map((x) => x.toFixed(6)).join(',')).sort();
      for (let i = 0; i < A.length; i++) {
        const a = A[i].split(',').map(Number), b = B[i].split(',').map(Number);
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (d > worst) { worst = d; worstPat = p; }
      }
    }
  }
  near(worst, 0, 1e-6, 'H1 the whole configuration repeats after lcm(period,2) beats (' + worstPat + ')');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART I — the arrival state, and the negative controls');
{
  ok(arrivalState([3]).slice(0, 3).every(Boolean), 'I1 a 3-cascade has three balls already coming down');
  ok(arrivalState([0]).every((x) => !x), 'I2 the empty pattern has nothing in the air');
  const st = arrivalState([5, 5, 5, 5, 0]);
  ok(st.filter(Boolean).length === 4, 'I3 55550 is a four-ball pattern (one beat with an empty hand)', st.filter(Boolean).length);
  // load-bearing negative control: the engine REFUSES an unjuggleable pattern
  let threw = false;
  try { new Juggle([4, 3]); } catch (e) { threw = true; }
  ok(threw, 'I4 the engine refuses to animate 43 rather than fudging it');
  // ...and the reason it gives is the true one
  const r = analyse([4, 3]);
  ok(!r.valid && /both land/.test(r.reason), 'I5 and it says why: two balls, one beat', r.reason);
  ok(analyse([4, 3]).agree, 'I6 both tests refuse it, not just one');
  // an out-of-reach hand geometry would be caught, so prove the check can fail
  ok(solveElbow([0, 1.4, 0], [1.2, 1.4, 0], BODY.upperArm, BODY.foreArm, 1) === null,
     'I7 the reach test is not vacuous: a metre away returns no elbow');
  ok(solveElbow([0, 1.4, 0], [0.2, 1.05, 0.05], BODY.upperArm, BODY.foreArm, 1) !== null, 'I8 a real catch point does');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART J — every pattern on the board is real');
{
  let bad = 0;
  for (const r of REPERTOIRE) {
    const pp = parsePattern(r.p);
    const a = analyse(pp.seq);
    if (!pp.ok || !a.valid) { bad++; console.log('  FAIL  J ' + r.p + ' — ' + (a.reason || pp.error)); }
  }
  ok(bad === 0, 'J1 all ' + REPERTOIRE.length + ' patterns on the board are juggleable');
  const balls = REPERTOIRE.map((r) => ballCount(parsePattern(r.p).seq).balls);
  ok(new Set(balls).size >= 5, 'J2 the board spans several ball counts', [...new Set(balls)].sort().join(','));
  ok(REPERTOIRE.some((r) => r.p.includes('0')), 'J3 the board includes a pattern with an empty beat');
  ok(REPERTOIRE.some((r) => ballCount(parsePattern(r.p).seq).balls >= 5), 'J4 and one of five balls or more');
}

// ─────────────────────────────────────────────────────────────────────────────
head('PART K — the file is safe to inline');
{
  const src = await (await import('node:fs/promises')).readFile(new URL('./juggle.mjs', import.meta.url), 'utf8');
  ok(!src.includes('`'), 'K1 no backtick anywhere (it is inlined into the page) — see LANDMINES.md');
  ok(!/\bdocument\b|\bwindow\b/.test(src), 'K2 the core is DOM-free');
  ok(!/Math\.random/.test(src), 'K3 and deterministic');
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'FAILURES') + ' — ' + pass + ' checks passed, ' + fail + ' failed.\n');
process.exit(fail === 0 ? 0 : 1);
