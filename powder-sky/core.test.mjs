/* ═══════════════════════════════════════════════════════════════════════════
   core.test.mjs — the PAYOFF-LIVENESS twin for THE POWDER SKY.

   This is a CLAIM-FREE delight piece: it proves NO physics. This twin asserts,
   headlessly, that the SHOW'S PAYOFF ACTUALLY FIRES — the experience, not a
   theorem (DESIGNING.md: the payoff-liveness gate). It drives the REAL scheduler
   / event-log (Sim.step over the real playback path), never a canvas pointer:

     1 · every scored shell IGNITES exactly once into its scored pattern + colour
         (peony = a tailless sphere of the right star-count; crossette emits
         sub-bursts that re-split; willow stars carry downward terminal drift);
     2 · the REPORT fires at t_flash + fuseDelay(size) — flash-THEN-boom ordering
         on the real playback path;
     3 · a saved SHOWCODE replayed produces a BYTE-IDENTICAL fired event-list;
     4 · reduced-motion emits ONE composed still and schedules ZERO timed audio;
     5 · IT REALLY BLOOMS — bright "pixels" (star luminance) appear at the scored
         beats near the scored positions.

   Run:  node powder-sky/core.test.mjs
   The SAME core.mjs is forge:include'd byte-identically into index.html.
   ═══════════════════════════════════════════════════════════════════════════ */
import {
  Sim, makeShow, demoShow, encodeShow, decodeShow, buildSchedule,
  riseDur, fuseDelay, BLOOMS, FIELD, mulberry32,
} from './core.mjs';

let pass = 0, fail = 0; const log = [];
function ok(c, m) { if (c) { pass++; log.push('  ✓ ' + m); } else { fail++; log.push('  ✗ ' + m); } }
function sec(t) { log.push('\n── ' + t + ' ──'); }

/* run a whole show to completion on the real fixed-step path, return the sim. */
function playOut(show, opts) {
  const sim = new Sim(show, opts);
  let guard = 0;
  while (!sim.done && guard < 200000) { sim.step(FIELD.DT); guard++; }
  return sim;
}

const show = demoShow();

/* ── 1 · every shell ignites exactly once, into its scored pattern + colour ── */
sec('1 · each scored shell ignites exactly ONCE into its pattern + colour');
{
  const sim = playOut(show);
  const ig = sim.fired('ignite');
  ok(ig.length === show.shells.length, `${show.shells.length} shells → ${ig.length} ignites (one each)`);
  let allMatch = true, counts = {};
  ig.forEach(e => { counts[e.i] = (counts[e.i] || 0) + 1; });
  show.shells.forEach((sh, i) => {
    const e = ig.find(x => x.i === i);
    if (!e || e.type !== sh.type || e.hue !== sh.hue || e.x !== sh.x || e.y !== sh.y) allMatch = false;
    if (counts[i] !== 1) allMatch = false;
  });
  ok(allMatch, 'every ignite carries the scored {type, hue, x, y} and fires exactly once');
}

/* pattern shapes: peony star-count, crossette re-splits, willow droops downward */
sec('1b · the named blooms read as themselves');
{
  // peony: a tailless sphere — a big ring of stars, none carrying a tail
  const peony = BLOOMS.peony(mulberry32(101), { size: 4, hue: 'crimson' });
  ok(peony.length >= 40 && peony.every(s => (s.tail || 0) === 0), `peony = ${peony.length} tailless stars (a sphere)`);
  // willow: gold, low drag, gravity-dominant → downward droop over its long life
  const willow = BLOOMS.willow(mulberry32(202), { size: 5, hue: 'gold' });
  ok(willow.every(s => s.chem === 'gold' && s.grav >= 90 && s.life > 2), 'willow stars are heavy, gold, long-lived (they droop)');
  // crossette: comets that carry a split schedule that re-splits (gen ≥ 2)
  const cross = BLOOMS.crossette(mulberry32(505), { size: 5, hue: 'green' });
  ok(cross.length >= 5 && cross.every(s => s.kind === 'comet' && s.split && s.split.gen >= 2), 'crossette = comets that split, then split again');

  // and on the LIVE path a crossette actually MULTIPLIES its particle count
  const one = makeShow({ bpm: 120, bars: 2, shells: [{ beat: 0, x: 500, y: 200, type: 'crossette', hue: 'green', size: 6, seed: 505 }] });
  const sim = new Sim(one);
  while (sim.t < riseDur(6) + 0.05) sim.step(FIELD.DT);         // step PAST the rise → just ignited
  const justOpened = sim.liveCount;
  let peakAfter = justOpened;
  for (let k = 0; k < 90; k++) { sim.step(FIELD.DT); peakAfter = Math.max(peakAfter, sim.liveCount); }
  ok(peakAfter > justOpened, `crossette multiplies on the live path (${justOpened} comets → ${peakAfter} after splits)`);

  // willow droops: after rising near apogee its stars sink BELOW the burst point
  const wshow = makeShow({ bpm: 120, bars: 2, shells: [{ beat: 0, x: 500, y: 180, type: 'willow', hue: 'gold', size: 5, seed: 202 }] });
  const ws = new Sim(wshow);
  while (ws.t < riseDur(5) + 0.10) ws.step(FIELD.DT);          // just after ignite
  const topY = Math.min(...ws.stars.map(s => s.y));            // the highest a star reached
  let maxY = topY;
  for (let k = 0; k < 220; k++) { ws.step(FIELD.DT); for (const s of ws.stars) if (s.y > maxY) maxY = s.y; }
  ok(topY <= 180 + 40 && maxY > 180 + 60, `willow rises to y≈${topY.toFixed(0)} then droops to y≈${maxY.toFixed(0)} (below the burst at 180)`);
}

/* ── 2 · report fires AFTER the flash, by the designed fuse delay ── */
sec('2 · the report cracks a beat AFTER the flash (flash-then-boom)');
{
  const sim = playOut(show);
  let good = true, ordered = true;
  show.shells.forEach((sh, i) => {
    const fl = sim.fired('ignite').find(e => e.i === i);
    const rp = sim.fired('report').find(e => e.i === i);
    if (!fl || !rp) { good = false; return; }
    if (!(rp.t > fl.t)) ordered = false;
    const gap = rp.t - fl.t, want = fuseDelay(sh.size);
    if (Math.abs(gap - want) > 1e-6) good = false;
  });
  ok(ordered, 'every report time is strictly AFTER its flash time');
  ok(good, 'each report fires exactly fuseDelay(size) after its flash (bigger shells crack later)');
  // bigger shells crack later than small ones
  ok(fuseDelay(6) > fuseDelay(2), `fuseDelay grows with size (${fuseDelay(2).toFixed(3)}s → ${fuseDelay(6).toFixed(3)}s)`);
  // and the shiver (water pressure ripple) follows the report — the triple pulse
  const first = sim.fired('report')[0], firstShiver = sim.fired('shiver')[0];
  ok(firstShiver && firstShiver.t > first.t, 'the reflection shivers a beat after the report (triple pulse)');
}

/* ── 3 · a kept showcode replays BYTE-IDENTICALLY ── */
sec('3 · a saved showcode replays the same night, event-for-event');
{
  const code = encodeShow(show);
  const back = decodeShow(code);
  // the decoded show re-encodes to the same code (stable round-trip)
  ok(encodeShow(back) === code, 'showcode round-trips to a byte-identical code');
  const a = playOut(show), b = playOut(back);
  const sa = JSON.stringify(a.events), sb = JSON.stringify(b.events);
  ok(sa === sb, `the fired event-list is byte-identical after a keep+load (${a.events.length} events)`);
  // schedules match too (times, positions, patterns, colours, crack-offsets)
  ok(JSON.stringify(buildSchedule(show)) === JSON.stringify(buildSchedule(back)), 'the derived schedule is identical');
}

/* ── 4 · reduced-motion: one composed still, ZERO timed audio ── */
sec('4 · reduced-motion composes a STILL and schedules zero timed audio');
{
  const sim = new Sim(show, { reducedMotion: true });
  // stepping must NOT animate or fire any timed events
  for (let k = 0; k < 600; k++) sim.step(FIELD.DT);
  const stills = sim.fired('still');
  ok(stills.length === 1, `exactly one composed still is emitted (${stills.length})`);
  ok(sim.fired('ignite').length === 0 && sim.fired('report').length === 0, 'zero timed ignite/report events (no timed audio to schedule)');
  ok(sim.stillSnapshot && sim.stillSnapshot.blooms.length === show.shells.length, `the still paints all ${show.shells.length} blooms at once`);
  ok(sim.stillSnapshot.blooms.every(b => b.stars.length > 0), 'every painted bloom carries its opened stars');
}

/* ── 5 · IT REALLY BLOOMS — light appears at the scored beats near the marks ── */
sec('5 · it really blooms — bright light appears at each scored position');
{
  let allLit = true, details = [];
  for (let i = 0; i < show.shells.length; i++) {
    const sh = show.shells[i];
    // play a single-shell show and probe brightness right after its ignite
    const one = makeShow({ bpm: 120, bars: 2, wind: show.wind, shells: [Object.assign({}, sh, { beat: 0 })] });
    const sim = new Sim(one);
    // step to just past ignite (riseDur), then a few frames so stars have spread
    const tIg = riseDur(sh.size);
    while (sim.t < tIg + 0.08) sim.step(FIELD.DT);
    const b = sim.brightnessAt(sh.x, sh.y, 130);
    if (!(b > 5)) { allLit = false; details.push(`${sh.type}@${sh.x},${sh.y}=${b.toFixed(1)}`); }
  }
  ok(allLit, allLit ? 'each scored shell lights bright pixels near its mark' : 'DARK at: ' + details.join(' '));
  // and BEFORE any ignite the sky is dark (no false light)
  const sim2 = new Sim(show);
  sim2.step(FIELD.DT);
  ok(sim2.brightnessAt(show.shells[0].x, show.shells[0].y, 130) === 0, 'the sky is dark before the first shell blooms (no phantom light)');
}

/* ── report ── */
log.push('\n' + '═'.repeat(60));
log.push(`  POWDER SKY — payoff-liveness twin: ${pass} passed, ${fail} failed`);
log.push('═'.repeat(60));
console.log(log.join('\n'));
if (typeof process !== 'undefined' && process.exit) process.exit(fail ? 1 : 0);
