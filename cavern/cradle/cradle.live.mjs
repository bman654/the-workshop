/* ============================================================================
 *  cradle.live.mjs — the Newton's Cradle PAYOFF-LIVENESS twin (headless, Node).
 *  Run:  node cavern/cradle/cradle.live.mjs   (exit 0 = green; non-0 = red)
 *
 *  Drives the REAL sim (cradle-sim.mjs → the same buildCradle the forge-inlined page
 *  runs) — never a canvas pointer event — and asserts the CRADLE'S PAYOFF actually
 *  FIRES on the live path:
 *    L1 · IT MOVES — after a lift-1 release the FAR ball swings out (settled arc, not
 *         the impact-spike velocity) to > 0.5× the lifted amplitude while the lifted
 *         ball hands off to near-rest.
 *    L2 · THE HAND-OFF — lift-k → k-out for k∈{1,2,3}, N∈{5,7}: the k far balls settle
 *         swinging near the lift amplitude, the N−k others stay dead-at-rest.
 *    L3 · CONSERVATION — |Δp| across every collision event < 1e-9; at e=1 the impulse
 *         barely touches KE, at e<1 it strictly BLEEDS KE (p held either way).
 *    L4 · THERE'S SOMETHING TO CLACK ON — a lift-k release fires ≥ k collision events.
 * ============================================================================ */

import { buildCradle, SUBSTEP, DEF_LIFT } from './cradle-sim.mjs';

let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail){
  if (ok) pass++; else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? '  ' + detail : ''));
}

/* run a lift-k release, returning per-ball settled-amplitude stats + event/dp/ke data.
 * `settledFrom`/`settledTo` bracket the window (seconds after the FIRST strike) over
 * which we read each ball's peak |angle| — i.e. the swing AFTER the cascade, before
 * the far group returns to re-strike. */
function runRelease(N, k, e, seconds, settleWin){
  const c = buildCradle(N, e);
  c.lift(k, 'L', DEF_LIFT);
  const STEPS = Math.round(seconds / SUBSTEP);
  const win = settleWin || [0.06, 0.85];
  let firstStrike = -1, prevEv = 0;
  let maxDp = 0, maxKEdelta = -Infinity, minKEdelta = Infinity;
  const peak = new Array(N).fill(0);           // per-ball peak |angle| within the window
  for (let s = 0; s < STEPS; s++){
    c.stepCradle(SUBSTEP);
    const ev = c.events;
    if (ev > prevEv){
      if (firstStrike < 0) firstStrike = s;
      maxDp = Math.max(maxDp, c.lastEventDp);
      maxKEdelta = Math.max(maxKEdelta, c.lastEventKEDelta);
      minKEdelta = Math.min(minKEdelta, c.lastEventKEDelta);
    }
    prevEv = ev;
    if (firstStrike >= 0){
      const t = (s - firstStrike) * SUBSTEP;
      if (t >= win[0] && t <= win[1]){
        for (let i = 0; i < N; i++) peak[i] = Math.max(peak[i], Math.abs(c.angleOf(i)));
      }
    }
  }
  return { c, firstStrike, peak, maxDp, maxKEdelta, minKEdelta, events: c.events };
}

/* ── L1 · IT MOVES (lift-1-L, N=5, e=1) ──────────────────────────────────────── */
{
  const r = runRelease(5, 1, 1, 2.6);
  const far = r.peak[4], lifted = r.peak[0];
  check('L1 · far ball SWINGS OUT after release (settled arc > 0.5× lift)',
    r.firstStrike >= 0 && far > 0.5 * DEF_LIFT,
    'far amp ' + far.toFixed(3) + ' rad (lift ' + DEF_LIFT.toFixed(2) + ') · strike @ ' +
    (r.firstStrike * SUBSTEP).toFixed(3) + 's');
  check('L1 · lifted ball HANDS OFF to near-rest (settled arc < 0.25× lift)',
    lifted < 0.25 * DEF_LIFT, 'lifted ball residual amp ' + lifted.toFixed(3) + ' rad');
}

/* ── L2 · THE HAND-OFF lift-k → k-out, k∈{1,2,3}, N∈{5,7} ─────────────────────── */
for (const N of [5, 7]){
  for (const k of [1, 2, 3]){
    const r = runRelease(N, k, 1, 2.6);
    let farOk = true, restOk = true, farMin = 99, restMax = 0;
    for (let i = 0; i < N; i++){
      const amp = r.peak[i], isFar = (i >= N - k);
      if (isFar){ farOk = farOk && amp > 0.85 * DEF_LIFT; farMin = Math.min(farMin, amp); }
      else       { restOk = restOk && amp < 0.15 * DEF_LIFT; restMax = Math.max(restMax, amp); }
    }
    check('L2 · N=' + N + ' lift-' + k + ' → ' + k + '-out (far group ≥0.85×lift, rest <0.15×lift)',
      farOk && restOk,
      'far min ' + farMin.toFixed(3) + ' (≥' + (0.85 * DEF_LIFT).toFixed(3) + ') · rest max ' +
      restMax.toFixed(3) + ' (<' + (0.15 * DEF_LIFT).toFixed(3) + ')');
  }
}

/* ── L3 · CONSERVATION — |Δp|≈0 per event; e=1 keeps KE, e<1 bleeds it ────────── */
{
  const elastic = runRelease(5, 1, 1.0, 3.0);
  check('L3 · elastic: |Δp| across every collision < 1e-9',
    elastic.maxDp < 1e-9, 'worst |Δp| ' + elastic.maxDp.toExponential(2));
  check('L3 · elastic: collision barely touches KE (|ΔKE| < 1e-3 J per event)',
    Math.abs(elastic.maxKEdelta) < 1e-3 && Math.abs(elastic.minKEdelta) < 1e-3,
    'worst |ΔKE| ' + Math.max(Math.abs(elastic.maxKEdelta), Math.abs(elastic.minKEdelta)).toExponential(2) + ' J');

  const lossy = runRelease(5, 1, 0.85, 3.0);
  check('L3 · inelastic (e=0.85): |Δp| still < 1e-9 per event',
    lossy.maxDp < 1e-9, 'worst |Δp| ' + lossy.maxDp.toExponential(2));
  check('L3 · inelastic (e=0.85): collisions strictly BLEED KE (max ΔKE < 0)',
    lossy.maxKEdelta < -1e-6, 'largest ΔKE ' + lossy.maxKEdelta.toExponential(2) + ' J (must be < 0)');
}

/* ── L4 · a lift-k release fires ≥ k collision events (the clack has fuel) ────── */
{
  let ok = true, note = [];
  for (const [N, k] of [[5, 1], [5, 2], [7, 3]]){
    const r = runRelease(N, k, 1, 1.6);
    if (r.events < k) ok = false;
    note.push('N' + N + '·lift' + k + '=' + r.events + 'ev');
  }
  check('L4 · every lift-k release fires ≥ k collision events', ok, note.join(' · '));
}

console.log('\nNewton\'s Cradle — cradle.live.mjs (payoff liveness)');
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail){ console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
