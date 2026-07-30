/* ============================================================================
 *  THE BELFRY — belfry.test.mjs
 *
 *  Runs every claim the room makes, from the command line, with no browser.
 *      node sound-garden/the-belfry/belfry.test.mjs
 *      node sound-garden/the-belfry/belfry.test.mjs --slow   (adds the 720 hunt)
 *
 *  If a number in the room's prose disagrees with a number printed here, the
 *  prose is wrong.
 *  ========================================================================= */

import * as B from './bell.mjs';
import * as M from './method.mjs';
import * as R from './ringer.mjs';
import * as G from './geom.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SLOW = process.argv.includes('--slow');
const D = 180 / Math.PI;

let pass = 0, fail = 0;
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '   ' + detail : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + (detail ? '   ' + detail : '')); }
}
function head(s) { console.log('\n\x1b[1m' + s + '\x1b[0m'); }
const f = (x, n = 4) => Number(x).toFixed(n);

/* ═══ A · THE FILES ARE WORKLET-SAFE ═══════════════════════════════════════
 * bell.mjs is spliced into a String.raw template to build the AudioWorklet, so
 * one backtick anywhere in it — a comment included — ends the template early
 * and kills the page with a SyntaxError pointing at a line of prose.  The
 * estate has lost a debug cycle to exactly this; assert it instead. */
head('A · worklet-safety of the spliced cores');
for (const file of ['bell.mjs', 'method.mjs', 'ringer.mjs']) {
  const src = readFileSync(join(HERE, file), 'utf8');
  ok(file + ' holds no backtick', src.indexOf('`') < 0);
  ok(file + ' holds no ${',       src.indexOf('${') < 0);
}

/* ═══ B · THE BELL AS A MACHINE ════════════════════════════════════════════ */
head('B · the bell');
const p = B.tenorBell();
ok('a tenor of about 800 kg swings like a half-metre pendulum',
   p.Leq > 0.45 && p.Leq < 0.56, 'Leq = ' + f(p.Leq, 3) + ' m, T0 = ' + f(p.T0, 3) + ' s');

/* B1 · the balance is not upright — statics, checked against the static torque */
const tq = (eps) => -p.Gb * Math.sin(Math.PI - eps) - p.Gc * Math.sin(Math.PI - eps + p.beta);
ok('B1 · the balance is eps* PAST vertical, and the static torque vanishes there',
   Math.abs(tq(p.epsStar)) < 1e-9 && p.epsStarDeg > 0.6 && p.epsStarDeg < 0.8,
   'eps* = ' + f(p.epsStarDeg, 4) + ' deg,  torque(eps*) = ' + tq(p.epsStar).toExponential(2) + ' N m');
ok('     …and it is the clapper that puts it there (a bell with no clapper: eps* = 0)',
   B.tenorBell({ mc: 1e-9, Jc: 1e-12 }).epsStarDeg < 1e-4,
   'clapperless eps* = ' + B.tenorBell({ mc: 1e-9, Jc: 1e-12 }).epsStarDeg.toExponential(2) + ' deg');
ok('     …and past it the bell falls the WRONG way — a bell set inside eps* goes over the stay',
   B.swing(p, 0.5 / D, 0, { dt: 5e-4 }).overStay === true &&
   B.swing(p, 0.9 / D, 0, { dt: 5e-4 }).overStay === false,
   'set at 0.5 deg: over.  set at 0.9 deg: rings.');

/* B2 · the integrator earns the numbers below */
const conv = [2e-3, 1e-3, 5e-4, 2.5e-4].map((dt) => B.swing(p, 6 / D, 50, { dt }));
const tSpread = Math.max(...conv.map((r) => r.strikeT)) - Math.min(...conv.map((r) => r.strikeT));
const aSpread = Math.max(...conv.map((r) => r.apexEps)) - Math.min(...conv.map((r) => r.apexEps));
ok('B2 · RK4 has converged: an 8x change of step moves the blow by under 0.1 ms',
   tSpread < 1e-4, 'strike-time spread = ' + f(tSpread * 1000, 4) + ' ms');
ok('     …and the far balance by under a twentieth of a degree (the impact instant is found by linear interpolation, so this one is first order in dt)',
   aSpread * D < 0.05, 'apex spread = ' + f(aSpread * D, 5) + ' deg');
const rest = [0.30, 0.15, 0.075, 0.0375].map((r) => B.swing(p, 6 / D, 50, { dt: 5e-4, restSpeed: r }));
const rSpread = Math.max(...rest.map((r) => r.strikeT)) - Math.min(...rest.map((r) => r.strikeT));
ok('     …and the rest threshold is bookkeeping, not a parameter: eight-fold, same blow',
   rSpread < 1e-9, 'strike-time spread over restSpeed 0.30 -> 0.0375 = ' + rSpread.toExponential(1) + ' s');

/* B3 · the blow is at a fixed angle, and the fall is a logarithm */
const law = B.strikeLaw(p, { dt: 5e-4 });
ok('B3 · the blow lands at ONE angle of the bell over ' + f(law.decades, 1) + ' decades of drop height',
   law.strikeAngleSpreadDeg < 0.5,
   'angle = ' + f(law.strikeAngleDeg, 2) + ' deg,  spread = ' + f(law.strikeAngleSpreadDeg, 3) + ' deg');
ok('     …the fall time is a straight line against ln(eps - eps*)',
   law.r2 > 0.9999, 'R^2 = ' + f(law.r2, 6) + ' over ' + law.pts.length + ' points');
ok('     …and its SLOPE is the linearised growth rate, computed a different way',
   Math.abs(law.bTimesLambda - 1) < 0.005,
   'b = ' + f(law.b, 5) + ' s,  1/lambda = ' + f(1 / p.lambda, 5) + ' s,  b*lambda = ' + f(law.bTimesLambda, 5));
/* the pole is load-bearing: forget it and the same fit still LOOKS fine */
const lawNoPole = (() => {
  const pts = law.pts;
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const q of pts) { const x = Math.log(q.eps); n++; sx += x; sy += q.t; sxx += x * x; sxy += x * q.t; }
  const b = -(n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy + b * sx) / n;
  let ssr = 0, sst = 0; const yb = sy / n;
  for (const q of pts) { const pr = a - b * Math.log(q.eps); ssr += (q.t - pr) ** 2; sst += (q.t - yb) ** 2; }
  return { b, r2: 1 - ssr / sst };
})();
ok('     …DELETE THE POLE and the fit is still pretty and the slope is 60% wrong',
   lawNoPole.r2 > 0.85 && Math.abs(lawNoPole.b * p.lambda - 1) > 0.3,
   'R^2 = ' + f(lawNoPole.r2, 4) + ' (still looks fine),  b*lambda = ' + f(lawNoPole.b * p.lambda, 3));

/* B4 · one stroke behind */
const os = B.oneStrokeBehind(p, { dt: 5e-4 });
ok('B4 · over a ' + f(os.pullRange[1] / os.pullRange[0], 1) + '-fold range of pull, THIS blow barely moves',
   os.thisSpan < 0.03, 'this blow moves ' + f(os.thisSpan * 1000, 1) + ' ms');
ok('     …and the NEXT blow moves by most of a second',
   os.nextSpan > 0.25, 'next blow moves ' + f(os.nextSpan * 1000, 1) + ' ms');
ok('     …a ratio above 15:1, on a rope that is worth under 3% of the swing',
   os.ratio > 15 && os.energyFraction < 0.03,
   'ratio ' + f(os.ratio, 1) + ' : 1,  rope = ' + f(os.energyFraction * 100, 2) + '% of the swing energy');

/* B5 · what a place costs — and why it is one place at a time */
const pc = B.placeCost(p, 2.0, 6, { dt: 5e-4 });
const at = (k) => pc.places.find((q) => q.places === k);
ok('B5 · the inverted law agrees with the ODE it was fitted to, within a place',
   pc.places.filter((q) => Math.abs(q.places) <= 1).every((q) => q.err !== null && Math.abs(q.err) < 0.005),
   pc.places.map((q) => q.places + ':' + f(q.err === null ? NaN : q.err * 1000, 1) + 'ms').join(' '));
ok('     …one place EARLY costs about 7 degrees of height; two places costs thirty more',
   at(-1).epsDeg - at(0).epsDeg > 5 && at(-2).epsDeg - at(-1).epsDeg > 20,
   [-2, -1, 0, 1, 2].map((k) => k + ': ' + f(at(k).epsDeg, 2) + ' deg').join('   '));
ok('     …and being LATE runs into the balance: place +2 is already within a fifth of a degree of eps*',
   at(2).epsDeg - p.epsStarDeg < 0.2,
   'place +2 = ' + f(at(2).epsDeg, 3) + ' deg,  eps* = ' + f(p.epsStarDeg, 3) + ' deg');
/* the practical ceiling on lateness: where a degree of error is worth a whole row */
const lateBound = (() => {
  let k = 0;
  for (; k < 12; k++) {
    const t = pc.tNom + (k + 1) * pc.gap;
    const over = Math.exp((pc.law.a - t) / pc.law.b);
    if ((pc.law.b / over) * (Math.PI / 180) > pc.rowTime) break;   /* s per degree > a row */
  }
  return k;
})();
ok('     …so lateness has a hard practical ceiling: past ' + lateBound + ' places, one degree of error is a whole row',
   lateBound >= 1 && lateBound <= 5, 'ceiling = ' + lateBound + ' places late');

/* B6 · DELETE THE BALANCE — the same bell, chimed instead of rung */
const chime = B.chimeSweep(p, { dt: 5e-4 });
ok('B6 · DELETE THE BALANCE: chime the same bell and the ringer loses the handle',
   chime.msPerDeg < pc.msPerDeg / 20,
   'chimed at ' + chime.centreDeg + ' deg: ' + f(chime.msPerDeg, 2) + ' ms per degree.   ' +
   'rung at the balance: ' + f(pc.msPerDeg, 1) + ' ms per degree.   ' +
   f(pc.msPerDeg / chime.msPerDeg, 0) + ' : 1');
ok('     …and the chimed blow is not even at a fixed ANGLE any more — it wanders with amplitude',
   chime.strikeAngleSpreadDeg > 4 * law.strikeAngleSpreadDeg,
   'chimed: ' + f(chime.strikeAngleSpreadDeg, 1) + ' deg of wander over a ' + (2 * chime.halfDeg) +
   '-degree change of amplitude.   rung: ' + f(law.strikeAngleSpreadDeg, 2) +
   ' deg over a ' + Math.round(Math.pow(10, law.decades)) + '-fold one.');
/* the ONE cause of both: a bell rung full circle always arrives at the bottom
 * at the same speed, because the last degree of height is worth nothing */
const wSpread = (() => {
  const ws = law.pts.map((q) => q.wMax);
  return (Math.max(...ws) - Math.min(...ws)) / (ws.reduce((a, b) => a + b, 0) / ws.length);
})();
ok('     …and BOTH have one cause: full circle, the bell goes through the bottom at the same speed every time',
   wSpread < 0.02,
   'peak rate varies by ' + f(wSpread * 100, 2) + '% across the whole ' +
   Math.round(Math.pow(10, law.decades)) + '-fold sweep of drop height');

/* B7 · the voice */
const modes = B.bellModes(440, 9);
const nom = modes.find((m) => m.name === 'nominal');
const sq = modes.find((m) => m.name === 'superquint');
const on = modes.find((m) => m.name === 'octave nominal');
ok('B7 · nominal : superquint : octave-nominal stand as 2 : 3 : 4 of the strike note',
   Math.abs(nom.f / 440 - 2) < 0.02 && Math.abs(sq.f / 440 - 3) < 0.05 && Math.abs(on.f / 440 - 4) < 0.05,
   [nom, sq, on].map((m) => f(m.f / 440, 2)).join(' : '));
ok('     …so the note you hear is the missing fundamental of a 2:3:4 — a pitch not in the sound',
   !modes.some((m) => Math.abs(m.f - 440) < 1e-9 && m.key === 'strike'));
ok('     …the tierce is a MINOR third, which is why a bell is sad',
   Math.abs(1200 * Math.log2(modes.find((m) => m.name === 'tierce').f / modes.find((m) => m.name === 'prime').f) - 300) < 20,
   f(1200 * Math.log2(modes.find((m) => m.name === 'tierce').f / modes.find((m) => m.name === 'prime').f), 1) + ' cents above the prime');
const ring = B.ringOfSix();
ok('     …and a ring of six is the top six of a major scale, tenor lowest',
   ring[5].hz < ring[0].hz && Math.abs(1200 * Math.log2(ring[0].hz / ring[5].hz) - 800) < 1,
   ring.map((r) => r.bell + ':' + f(r.hz, 1) + 'Hz').join('  '));

/* ═══ C · THE METHOD ═══════════════════════════════════════════════════════ */
head('C · the method');
const pcrs = M.plainCourse();
ok('C1 · the plain course of Plain Bob Minor is 60 rows, all different, and comes round',
   pcrs.rows.length === 60 && M.isTrue(pcrs.rows) && pcrs.home,
   'calling "' + pcrs.calling + '",  ' + M.coverage(pcrs.rows) + ' distinct rows');
ok('     …every change swaps only ADJACENT bells (the whole physical constraint)',
   pcrs.rows.every((r, i) => {
     if (i === 0) return true;
     const prev = pcrs.rows[i - 1];
     return r.every((b, k) => Math.abs(prev.indexOf(b) - k) <= 1);
   }));

const bl = M.blueLineCheck();
const offs = bl ? bl.offsets.map((o) => o.offset).sort((a, b) => a - b) : null;
ok('C2 · the five working bells ring ONE path, entered twelve rows apart',
   bl !== null && offs.join(',') === '0,12,24,36,48',
   bl ? bl.offsets.map((o) => o.bell + '@' + o.offset).join('  ') : 'no rotation found');
ok('     …and the treble is NOT on that path: it plain hunts, a lap every twelve rows',
   M.rotationOffset(bl.treble, bl.base) < 0 &&
   bl.treble.every((v, i) => v === bl.treble[(i + 12) % 60]),
   'treble path repeats every 12 rows: ' + bl.treble.slice(0, 12).join(' '));

ok('C3 · a plain lead and a bob lead are EVEN on the working bells; a single is ODD',
   M.workingParity('p') === 0 && M.workingParity('b') === 0 && M.workingParity('s') === 1,
   'p=' + M.workingParity('p') + '  b=' + M.workingParity('b') + '  s=' + M.workingParity('s'));
const reach = M.reachable(['p', 'b']);
ok('     …so bobs reach exactly HALF the leads an extent needs',
   reach.nLeads === 30, reach.nLeads + ' of 60 leads,  ' + reach.nHeads + ' of 120 lead heads');
const noExtent = M.searchExtent(['p', 'b'], { maxNodes: 4e6 });
ok('     …and the exhaustive search AGREES, having finished rather than given up',
   noExtent.found === false && noExtent.aborted === false,
   noExtent.nodes.toLocaleString('en-GB') + ' nodes searched, 0 extents');
const yes = M.searchExtent(['p', 'b', 's'], { maxNodes: 4e6 });
ok('     …allow the one odd call and a true 720 falls out at once',
   yes.found === true, yes.nodes + ' nodes,  calling "' + (yes.calling || '') + '"');
if (yes.found) {
  const t = M.ringTouch(yes.calling);
  ok('     …and it really is every one of the 720 orders, once each, ending in rounds',
     t.rows.length === 720 && M.isTrue(t.rows) && M.coverage(t.rows) === 720 && t.home,
     t.rows.length + ' rows,  ' + M.coverage(t.rows) + ' distinct,  home = ' + t.home);
}

const touch = M.findTouch(10);
ok('C4 · a short touch of ten leads comes round true',
   touch !== null && (() => { const t = M.ringTouch(touch); return t.rows.length === 120 && M.isTrue(t.rows) && t.home; })(),
   'calling "' + touch + '" — ' + (touch ? M.ringTouch(touch).rows.length : 0) + ' rows');

for (const item of M.repertoire()) {
  const r = M.rowsFor(item.id, {});
  ok('C5 · the repertoire entry "' + item.id + '" hands back playable rows',
     r.rows.length > 0 && r.rows.every((x) => x.length === 6 && new Set(x).size === 6),
     r.rows.length + ' rows');
}

/* ═══ D · THE TWO HALVES MEET ══════════════════════════════════════════════
 * The method says a bell may move one place per row.  The bell says what one
 * place costs.  This is the joint the room is built on, so check it. */
head('D · the joint');
const maxMove = Math.max(...pcrs.rows.slice(1).map((r, i) =>
  Math.max(...r.map((b, k) => Math.abs(pcrs.rows[i].indexOf(b) - k)))));
ok('D1 · the method never asks a bell to move more than one place in a row',
   maxMove === 1, 'largest move in the plain course = ' + maxMove + ' place');
ok('D2 · …and the bell says the second place would cost ' +
   f(at(-2).epsDeg - at(-1).epsDeg, 0) + ' more degrees of height than the first cost ' +
   f(at(-1).epsDeg - at(0).epsDeg, 0),
   (at(-2).epsDeg - at(-1).epsDeg) > 3 * (at(-1).epsDeg - at(0).epsDeg),
   'first place: +' + f(at(-1).epsDeg - at(0).epsDeg, 2) + ' deg,   second: +' +
   f(at(-2).epsDeg - at(-1).epsDeg, 2) + ' deg');

/* ═══ D2 · THE BAND ════════════════════════════════════════════════════════
 * Six live integrators and six ringers with a stroke of dead time, asked to
 * put a method in the air.  This is the room's actual engine — the page steps
 * exactly this against the wall clock — so the thing to check is not that it
 * runs but that WHAT COMES OUT OF IT IS THE METHOD. */
head('D2 · the band');
{
  const bells = B.ringOfBells();
  const aims = bells.map((q) => R.aimingLaw(q, { dt: 1e-3 }));
  const rows = M.plainCourse().rows;
  const band = new R.Band({ bells, rowTime: 1.9, openHandstroke: true,
                            rowAt: (r) => rows[r % rows.length], aims });
  const cpu0 = Date.now();
  band.start(0);
  let blows = [];
  for (let i = 0; i < 60 * 90; i++) blows = blows.concat(band.step(1 / 60));
  const cpu = Date.now() - cpu0;
  ok('D2a · ninety seconds of Plain Bob Minor costs a few per cent of one core',
     cpu < 9000, cpu + ' ms of CPU for 90 s of ringing (' + blows.length + ' blows), ' +
     f(cpu / 900, 1) + '% of real time');
  /* THE order test: group the blows six at a time and compare with the method */
  let wrong = 0, checked = 0;
  for (let r = 1; r * 6 + 6 <= blows.length; r++) {
    const six = blows.slice(r * 6, r * 6 + 6);
    if (new Set(six.map((x) => x.row)).size !== 1) continue;   /* straddles a row */
    checked++;
    const heard = six.map((x) => x.bell).join('');
    const want = rows[six[0].row % rows.length].join('');
    if (heard !== want) wrong++;
  }
  ok('D2b · what you HEAR is the method — every row comes out in the order the method asks for',
     wrong === 0 && checked > 30, checked + ' whole rows checked, ' + wrong + ' out of order');
  const errs = blows.slice(6).map((x) => Math.abs(x.errMs)).sort((a, b) => a - b);
  const rms = Math.sqrt(blows.slice(6).reduce((s, x) => s + x.errMs * x.errMs, 0) / (blows.length - 6));
  ok('D2c · …and it is struck to a few milliseconds, which is better than most bands',
     errs[errs.length >> 1] < 15 && rms < 90,
     'median ' + f(errs[errs.length >> 1], 1) + ' ms,  90th ' + f(errs[Math.floor(errs.length * 0.9)], 1) +
     ' ms,  rms ' + f(rms, 1) + ' ms');
  /* every bell alternates handstroke and backstroke, which is what a row IS */
  const strokes = {};
  let alt = true;
  for (const x of blows) {
    const s = Math.sign(x.t);
    if (strokes[x.bell] !== undefined && strokes[x.bell] === x.row) alt = false;
    strokes[x.bell] = x.row;
  }
  ok('D2d · every bell sounds exactly once in every row',
     alt && blows.length > 200, blows.length + ' blows, none doubled');
  /* D2f · THE BAND MUST NOT CARE WHAT YOUR FRAME RATE IS.  The integrator
   * takes whole 2 ms steps, so a frame shorter than one step used to advance
   * NOTHING while the schedule the ringers aim at ran on — and a headless
   * browser rendering a simple scene runs at well over a thousand frames a
   * second, so the room struck two seconds late on the machine that was
   * verifying it and nowhere else.  Each ringer now carries the leftover. */
  {
    const runAt = (fps) => {
      const bd = new R.Band({ bells, rowTime: 1.9, openHandstroke: true,
                              rowAt: (r) => rows[r % rows.length], aims });
      bd.start(0);
      let bl = [];
      for (let i = 0; i < Math.round(fps * 60); i++) bl = bl.concat(bd.step(1 / fps));
      return bl;
    };
    const a60 = runAt(60), a2000 = runAt(2000), a17 = runAt(17);
    const same = a60.length === a2000.length && a60.length === a17.length &&
      a60.every((x, i) => x.bell === a2000[i].bell && Math.abs(x.t - a2000[i].t) < 1e-9 &&
                          x.bell === a17[i].bell && Math.abs(x.t - a17[i].t) < 1e-9);
    ok('D2f · the ringing is IDENTICAL at 17, 60 and 2000 frames a second',
       same && a60.length > 100,
       a60.length + ' blows, every one to the same nanosecond at all three rates');
  }

  /* the open handstroke lead is audible: the gap before a handstroke row is
   * one whole blow longer than the gaps inside a row */
  const rowStarts = [];
  for (let r = 2; r < 20; r++) rowStarts.push(band.rowStart(r) - band.rowStart(r - 1));
  const long = rowStarts.filter((x) => x > band.rowTime + band.gap / 2).length;
  ok('D2e · the open handstroke lead puts one extra beat before every handstroke row',
     long === Math.floor(rowStarts.length / 2) || long === Math.ceil(rowStarts.length / 2),
     rowStarts.slice(0, 6).map((x) => f(x, 3)).join(' ') + ' s');
}

/* ═══ D3 · ONE STROKE BEHIND, AS THE VISITOR MEETS IT ══════════════════════
 * The room's headline claim is a BUTTON: lean on one bell's rope for a single
 * stroke.  B4 measures the separation in the abstract; this measures the thing
 * the visitor actually does, through the whole band, with the other five
 * ringers still trying to keep time.  If the button does not do what the panel
 * says it does, the panel is lying. */
head('D3 · leaning on one rope');
{
  const bells = B.ringOfBells();
  const aims = bells.map((q) => R.aimingLaw(q, { dt: 1e-3 }));
  const rows = M.plainCourse().rows;
  const trial = (k) => {
    const bd = new R.Band({ bells, rowTime: 1.86, openHandstroke: true,
                            rowAt: (r) => rows[r % rows.length], aims });
    bd.start(0);
    let bl = [];
    for (let i = 0; i < 60 * 30; i++) bl = bl.concat(bd.step(1 / 60));
    const n0 = bl.filter((x) => x.bell === 6).length;
    bd.ringers[5].nudge = k;                       /* exactly what the button does */
    for (let i = 0; i < 60 * 24; i++) bl = bl.concat(bd.step(1 / 60));
    return bl.filter((x) => x.bell === 6).slice(n0).map((x) => x.errMs);
  };
  const steady = trial(1);
  const pulled = trial(1.20);
  const checked = trial(0.72);
  const quiet = Math.max(...steady.slice(0, 3).map(Math.abs));
  ok('D3a · with nobody leaning on it the tenor stays inside ' + f(quiet, 0) + ' ms of the beat',
     quiet < 40, steady.slice(0, 4).map((x) => f(x, 0)).join('  ') + ' ms');
  ok('D3b · PULL HARDER does not move the blow the bell is already falling towards',
     Math.abs(pulled[0]) < 40 && Math.abs(checked[0]) < 40,
     'pulled: ' + f(pulled[0], 0) + ' ms.   checked: ' + f(checked[0], 0) + ' ms.');
  ok('D3c · …and moves the one AFTER it by a large fraction of a second',
     pulled[1] > 120 && checked[1] < -80,
     'pulled: ' + f(pulled[1], 0) + ' ms LATE.   checked: ' + f(checked[1], 0) + ' ms EARLY.');
  const settled = (a) => Math.max(...a.slice(8, 12).map(Math.abs));
  ok('D3d · …and the ringer has it back on the beat within about eight strokes',
     settled(pulled) < 60 && settled(checked) < 60,
     'pulled: ' + pulled.slice(1, 11).map((x) => f(x, 0)).join(' ') + ' ms');
}

/* ═══ E · THE 720 THE PAGE SHIPS ═══════════════════════════════════════════
 * The page bakes a calling rather than searching at load time.  Whatever it
 * bakes has to be true, so check the file. */
head('E · what the page ships');
try {
  const src = readFileSync(join(HERE, 'index.src.html'), 'utf8');
  const m = src.match(/BAKED_EXTENT\s*=\s*'([pbs]+)'/);
  if (!m) { ok('E1 · the page bakes a 720 calling', false, 'no BAKED_EXTENT found in index.src.html'); }
  else {
    const t = M.ringTouch(m[1]);
    ok('E1 · the 720 baked into the page is true, complete and comes round',
       t.rows.length === 720 && M.isTrue(t.rows) && t.home,
       m[1].length + ' leads,  ' + t.rows.length + ' rows,  ' + M.coverage(t.rows) + ' distinct');
  }
  const mt = src.match(/BAKED_TOUCH\s*=\s*'([pbs]+)'/);
  if (mt) {
    const t = M.ringTouch(mt[1]);
    ok('E2 · the short touch baked into the page is true and comes round',
       M.isTrue(t.rows) && t.home, mt[1] + ' -> ' + t.rows.length + ' rows');
  }
} catch (e) {
  ok('E · index.src.html is present', false, e.message);
}

/* ═══ F · THE GEOMETRY IS WOUND THE RIGHT WAY ══════════════════════════════
 * Back-face culling is what lets the room be built INSIDE OUT so the wall
 * between you and the bells is never drawn.  That trick is worth nothing if a
 * part is wound backwards — and a backwards-wound part does not look broken,
 * it looks FINE, because from outside a thin post you then see the inside of
 * its far face and it is nearly the same picture.  The whole chamber was wound
 * inside out for its first render and the symptom was a screen full of grey:
 * the room was drawing its own outside.  So: every triangle's winding must
 * agree with the normal its own vertices carry. */
head('F · the geometry');
{
  const M2 = G;
  const check = (name, mesh, thr = 0.3) => {
    const n = mesh.idx.length / 3;
    let bad = 0;
    for (let t = 0; t < n; t++) {
      const fn = mesh.faceNormal(t);
      const i = mesh.idx[3 * t];
      const vn = [mesh.nrm[3 * i], mesh.nrm[3 * i + 1], mesh.nrm[3 * i + 2]];
      if (fn[0] * vn[0] + fn[1] * vn[1] + fn[2] * vn[2] <= thr) bad++;
    }
    ok('F · ' + name + ' is wound to face the way its normals point',
       bad === 0, n + ' triangles, ' + bad + ' backwards');
  };
  const bx = new M2.Mesh(); M2.box(bx, 0, 0, 0, 1, 1, 1, [1, 1, 1]); check('a box', bx, 0.9);
  const bi = new M2.Mesh(); M2.box(bi, 0, 0, 0, 1, 1, 1, [1, 1, 1], true); check('an INSIDE-OUT box', bi, 0.9);
  const tb = new M2.Mesh(); M2.tube(tb, [0, 0, 0], [0, 1, 0], 0.2, 0.2, [1, 1, 1], 10); check('a tube', tb, 0.5);
  const wh = new M2.Mesh(); M2.wheelMesh(wh, 0.7, 0.03, 0); check('a bell wheel', wh, 0.4);
  check('a bell', M2.bellMesh(1.0), 0.3);
  /* and the inside-out box really is inside out: its normals point at its own centre */
  let inward = 0;
  for (let i = 0; i < bi.n; i++) {
    const d = bi.pos[3*i] * bi.nrm[3*i] + bi.pos[3*i+1] * bi.nrm[3*i+1] + bi.pos[3*i+2] * bi.nrm[3*i+2];
    if (d < 0) inward++;
  }
  ok('F · …and an inside-out box faces inward at every vertex', inward === bi.n,
     inward + ' of ' + bi.n + ' vertices');
  const hb = M2.hungBell({ diameter: 1.02, lc: 0.42, ballR: 0.09 });
  ok('F · one hung bell is a few thousand triangles, so six of them are nothing',
     hb.bell.nTri < 6000 && hb.clapper.nTri < 900,
     'bell ' + hb.bell.nTri + ' tris, clapper ' + hb.clapper.nTri + ' — six bells = ' +
     (6 * (hb.bell.nTri + hb.clapper.nTri)).toLocaleString('en-GB') + ' triangles a frame');
  ok('F · …and it holds no NaN anywhere', !hb.bell.pos.some(Number.isNaN) &&
     !hb.bell.nrm.some(Number.isNaN) && !hb.clapper.pos.some(Number.isNaN));
}

if (SLOW) {
  head('F2 · the slow ones');
  const t0 = Date.now();
  const all = M.searchExtent(['p', 'b'], { maxNodes: 4e7 });
  ok('F1 · the no-720-with-bobs search is genuinely exhaustive at any node budget',
     all.found === false && all.aborted === false,
     all.nodes.toLocaleString('en-GB') + ' nodes in ' + (Date.now() - t0) + ' ms');
}

console.log('\n' + (fail ? '\x1b[31m' : '\x1b[32m') + pass + ' passed, ' + fail + ' failed\x1b[0m\n');
process.exit(fail ? 1 : 0);
