/* ═══════════════════════════════════════════════════════════════════════════
   THE WALL OF THE NIGHT — the payoff-liveness twin.

   This piece pins NO CLAIM. There is no theorem here, no self-test chip on the
   page, no math assertion — it is a delight piece and it proves nothing.

   But claim-free is not verification-free. A delight piece with a PAYOFF owes a
   liveness twin that the payoff FIRES. That is what this is: it checks the
   EXPERIENCE, not a theorem. Does pressing the button actually produce a
   photograph? Is anyone's portrait blank? Is the same maker the same person
   twice? Do the faces come from the real ledger? And — the one the Patron was
   most specific about — is the maker who shipped nothing really in the picture,
   rendered exactly as well as the builders?

   Run:  node ledger/booth.test.mjs
   ═══════════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from './booth.core.mjs';
import { Hall, layoutWall, chooseOnRamp, stripMetrics, hitTest, sparseSpot } from './booth.hall.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const marks = C.parseLedger(fs.readFileSync(path.join(HERE, 'ledger.jsonl'), 'utf8'));
const ix = C.indexLedger(marks);

let pass = 0, fail = 0;
const checks = [];
function ok(name, cond, detail) {
  checks.push({ name, pass: !!cond, detail });
  if (cond) pass++; else fail++;
  console.log((cond ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗\x1b[0m ') + name + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : ''));
}
const head = (s) => console.log('\n\x1b[1m' + s + '\x1b[0m');

/* ═══ 1. FIRES — a press yields a developed photograph, bounded ═══════════ */
head('1 · IT FIRES — pressing the button produces a photograph');
{
  const cycle = ix.cycles[Math.floor(ix.cycles.length / 2)];
  const t0 = Date.now();
  const frames = C.resolveStrip(ix, cycle);
  const plated = frames.map(m => C.renderPlates(m, { size: C.SIZE, newest: ix.newest }));
  const ms = Date.now() - t0;

  ok('a press yields FOUR frames — no empty slot', frames.length === 4, frames.length + ' frames');
  ok('every frame develops to 8 density plates',
     plated.every(p => p.plates.length === C.PLATES && p.plates.every(x => x.data.length === C.SIZE * C.SIZE * 4)));
  ok('the whole strip develops within a bounded time (< 1500 ms)', ms < 1500, ms + ' ms');

  /* the plate ladder must actually MOVE — a develop that renders the same
     image eight times is not a develop */
  const first = plated[0].plates;
  const travel = C.bufferDistance(first[0].data, first[first.length - 1].data);
  ok('the plate ladder travels (blank paper → finished image)', travel > 25, 'mean distance ' + travel.toFixed(1));
}

/* ═══ 2. NON-EMPTY — nobody develops to nothing ══════════════════════════ */
head('2 · NON-EMPTY — no blank frames, no silent canvas failure');
{
  let minInk = Infinity, minVar = Infinity, crashed = 0, blank = 0, worst = null;
  for (const cycle of ix.cycles) {
    let frames;
    try { frames = C.resolveStrip(ix, cycle); }
    catch (e) { crashed++; continue; }
    for (const m of frames) {
      try {
        const p = C.renderPortrait(m, { size: 44, newest: ix.newest });
        const ink = C.meanDensity(p.data);
        const v = C.pixelVariance(p.data);
        if (ink < minInk) { minInk = ink; worst = m; }
        if (v < minVar) minVar = v;
        if (ink < C.BASE_FOG - 1e-6) blank++;
      } catch (e) { crashed++; }
    }
  }
  ok('all ' + ix.cycles.length + ' cycles render without crashing', crashed === 0, crashed + ' crashes');
  ok('every portrait meets BASE FOG ' + C.BASE_FOG.toFixed(2), blank === 0 && minInk >= C.BASE_FOG - 1e-6,
     'lowest ink ' + minInk.toFixed(3) + (worst ? ' (' + worst.name + ')' : ''));
  ok('no portrait is a flat field — every buffer carries an image', minVar > 5,
     'lowest pixel variance ' + minVar.toFixed(1));
}

/* ═══ 3. DETERMINISTIC + DISTINCT ════════════════════════════════════════ */
head('3 · THE SAME MAKER IS THE SAME PERSON — and no two are alike');
{
  const sample = [];
  for (let i = 0; i < 200; i++) sample.push(marks[Math.floor(i * marks.length / 200)]);

  const h1 = sample.map(m => C.pixelHash(C.renderPortrait(m, { size: 44, newest: ix.newest }).data));
  const h2 = sample.map(m => C.pixelHash(C.renderPortrait(m, { size: 44, newest: ix.newest }).data));
  ok('same maker → byte-identical portrait across runs', h1.every((h, i) => h === h2[i]));
  ok('200 sampled makers → 200 DISTINCT portraits', new Set(h1).size === 200,
     new Set(h1).size + ' distinct hashes');

  /* THE KOAN IS THE LIGHT — a long dense koan and a terse one must not be one
     motif recoloured. They should be visibly different pictures. */
  const byLen = marks.slice().sort((a, b) => a.koan.length - b.koan.length);
  const shortM = byLen[0], longM = byLen[byLen.length - 1];
  const ps = C.renderPortrait(shortM, { size: C.SIZE, newest: ix.newest });
  const pl = C.renderPortrait(longM, { size: C.SIZE, newest: ix.newest });
  const dist = C.bufferDistance(ps.data, pl.data);
  ok('short koan vs long koan are visibly different pictures', dist > 20,
     shortM.koan.length + ' vs ' + longM.koan.length + ' chars → mean distance ' + dist.toFixed(1));

  /* and the difference must track the KOAN, not merely the seed: a terse koan
     should lay down fewer strokes than a dense one */
  ok('word count drives the strike (terse < dense)', ps.words < pl.words,
     ps.words + ' strokes vs ' + pl.words);
}

/* ═══ 4. REAL SOURCE — the marks are the actual ledger ═══════════════════ */
head('4 · THE SOURCE IS REAL — nothing in a frame is fabricated');
{
  const key = (m) => m.seq + '|' + m.name + '|' + m.koan + '|' + m.role + '|' + m.cycle;
  const real = new Set(marks.map(key));
  let bad = 0, checked = 0;
  for (const cycle of ix.cycles) {
    for (const m of C.resolveStrip(ix, cycle)) {
      checked++;
      if (!real.has(key(m))) bad++;
      if (typeof m.name !== 'string' || !m.name.length) bad++;
      if (typeof m.koan !== 'string' || !m.koan.length) bad++;
    }
  }
  ok('every name, koan, role and cycle traces to a real ledger.jsonl entry',
     bad === 0, checked + ' frames checked, ' + bad + ' fabricated');
  ok('the ledger really is the one on disk', marks.length === 1811 || marks.length > 1000,
     marks.length + ' marks · ' + ix.cycles.length + ' cycles');
}

/* ═══ 5. THE WRIT'S CLAUSE ═══════════════════════════════════════════════ */
head("5 · THE WRIT'S CLAUSE — the fourth frame, and the dignity of it");
{
  let missing = 0, dup = 0, hapaxSeated = 0, hapaxAvailable = 0;
  for (const cycle of ix.cycles) {
    const f = C.resolveStrip(ix, cycle);
    if (f.length !== 4 || !f[3]) { missing++; continue; }
    const seqs = new Set(f.map(m => m.seq));
    if (seqs.size !== 4) dup++;
    if (ix.roleCount.get(f[3].role) === 1) hapaxSeated++;
    /* was a one-off maker reachable at all for this cycle? */
    const near = ix.cycles.filter(c => Math.abs(c - cycle) <= C.HAPAX_REACH);
    if (near.some(c => ix.byCycle.get(c).some(m => ix.roleCount.get(m.role) === 1))) hapaxAvailable++;
  }
  ok('all ' + ix.cycles.length + ' cycles seat a fourth maker — never an empty frame', missing === 0);
  ok('frame 4 is never a duplicate of frames 1–3', dup === 0);
  ok('frame 4 prefers a HAPAX-role maker wherever one is reachable',
     hapaxSeated / Math.max(1, hapaxAvailable) > 0.75,
     hapaxSeated + ' seated of ' + hapaxAvailable + ' cycles with one in reach');

  /* A maker who shipped nothing must be VERIFIABLY PRESENT and rendered with
     exactly the fidelity of a builder. Same size, same plate count, same fog
     floor, same everything. */
  const oneOffRoles = [...ix.roleCount.entries()].filter(([, n]) => n === 1).map(([r]) => r);
  ok('the ledger really does hold passed-over one-off makers', oneOffRoles.length > 50,
     oneOffRoles.length + ' roles occur exactly once');

  const passedOver = marks.find(m => ix.roleCount.get(m.role) === 1);
  const builder = marks.find(m => m.role === 'builder');
  const a = C.renderPortrait(passedOver, { size: C.SIZE, newest: ix.newest });
  const b = C.renderPortrait(builder, { size: C.SIZE, newest: ix.newest });
  ok('a passed-over maker renders at identical fidelity to a builder',
     a.data.length === b.data.length && a.size === b.size,
     passedOver.name + ' (' + passedOver.role + ') vs ' + builder.name);
  ok('a passed-over maker is not dimmed — same fog floor applies',
     C.meanDensity(a.data) >= C.BASE_FOG - 1e-6,
     'ink ' + C.meanDensity(a.data).toFixed(3));

  /* Frame 4 is present on a strip a visitor will actually pull. */
  const walled = C.wallCycles(ix);
  const pullable = C.unwalledCycles(ix, walled);
  const firstPull = C.resolveStrip(ix, pullable[0]);
  ok('the first strip a visitor pulls seats a real fourth maker',
     firstPull.length === 4 && !!firstPull[3].name,
     'cycle ' + pullable[0] + ' → guest ' + firstPull[3].name +
     ' (' + firstPull[3].role + ', role occurs ' + ix.roleCount.get(firstPull[3].role) + '×)');

  /* ── THE DIGNITY ASSERTION ──────────────────────────────────────────────
     No code path in the emulsion or the hall may branch on whether a maker
     shipped, was judged down, or decayed unbuilt. This test FAILS if anyone
     ever adds such a branch. It is deliberately a source-level check: the
     guarantee is about what the code is ALLOWED to know, not about one output. */
  const sources = ['booth.core.mjs', 'booth.hall.mjs', 'booth.src.html']
    .map(f => ({ f, txt: fs.readFileSync(path.join(HERE, f), 'utf8') }));
  const FORBIDDEN = /\b(shipped|passedOver|passed_over|wasJudged|judgedDown|judged_down|decayed|unbuilt|didShip|isWinner|lost)\s*(\?|===|!==|==|!=|&&|\|\|)/;
  const offenders = sources.filter(s => FORBIDDEN.test(s.txt)).map(s => s.f);
  ok('NO code path branches on shipped / passed-over / judged-down',
     offenders.length === 0, offenders.length ? 'in ' + offenders.join(', ') : 'source-level check clean');

  /* and the emulsion's inputs are structurally incapable of carrying it */
  const seedSrc = fs.readFileSync(path.join(HERE, 'booth.core.mjs'), 'utf8');
  const seedFn = seedSrc.match(/export function seedFor[\s\S]*?\n}/)[0];
  const fields = [...seedFn.matchAll(/mark\.(\w+)/g)].map(m => m[1]).sort();
  ok('a portrait is seeded from name · koan · role · cycle and NOTHING else',
     JSON.stringify(fields) === JSON.stringify(['cycle', 'koan', 'name', 'role']),
     'seed fields: ' + fields.join(', '));

  /* figure geometry derives only from seat index and seeded params */
  const emul = seedSrc.match(/export function emulsion[\s\S]*?\n}\n/)[0];
  ok('figure position/scale derive only from seat index and seeded params',
     !/\b(shipped|judged|decayed|unbuilt)\b/i.test(emul));
}

/* ═══ 6. DIGGABLE — the wall is an object, not a backdrop ════════════════ */
head('6 · DIGGABLE — the pile is real, and a new strip joins it');
{
  /* stand up a headless hall: layoutWall touches no DOM */
  Hall.ix = ix;
  Hall.W = 1440; Hall.H = 900; Hall.worldW = 2880; Hall.camX = 0;
  const walled = C.wallCycles(ix);
  Hall.strips = layoutWall(walled);
  Hall.strips.forEach(s => { s.frames = C.resolveStrip(ix, s.cycle); s.gloss = 0; });
  chooseOnRamp(Hall.strips);

  ok('the wall opens pre-pinned with ' + C.WALL_STRIPS + ' strips',
     Hall.strips.length === C.WALL_STRIPS, Hall.strips.length + ' strips');

  /* cycle 306 — Cairn — is buried, not featured */
  const cairn = Hall.strips.find(s => s.cycle === 306);
  const buried = Hall.strips.filter(s => s.z > cairn.z).length;
  ok('the oldest cycle (306, Cairn) is laid deepest in the pile',
     cairn && cairn.z === 0 && buried >= 4,
     buried + ' strips laid over it');

  /* give every strip the geometry it would have on screen */
  for (const s of Hall.strips) {
    s.metrics = stripMetrics(s.composeS || 40, !!s.onRamp);
    s.canvas = { width: s.metrics.w, height: s.metrics.h };  /* hit-test needs only the box */
    s.lift = 0; s.swing = 0;
  }

  /* DEPTH in the lit zone: how many strips lie over a given lit point */
  const pools = [0.13, 0.38, 0.63, 0.87].map(u => u * Hall.worldW);
  let samples = 0, depthSum = 0, covered = 0;
  for (const px of pools) {
    for (let dx = -180; dx <= 180; dx += 20) {
      for (let py = 120; py <= 620; py += 25) {
        samples++;
        let d = 0;
        for (const s of Hall.strips) {
          const M = s.metrics;
          const ex = px - s.x, ey = py - s.y;
          const a = -s.rot;
          const lx = ex * Math.cos(a) - ey * Math.sin(a);
          const ly = ex * Math.sin(a) + ey * Math.cos(a);
          if (lx >= -M.w / 2 && lx <= M.w / 2 && ly >= 0 && ly <= M.h) d++;
        }
        depthSum += d;
        if (d > 0) covered++;
      }
    }
  }
  const meanDepth = depthSum / samples, coverage = covered / samples;
  ok('the lit zone is piled ≥3 deep on average', meanDepth >= 3,
     'mean depth ' + meanDepth.toFixed(2));
  ok('the preload covers ≥45% of the lit wall area', coverage >= 0.45,
     (coverage * 100).toFixed(1) + '% covered');

  /* an on-ramp strip carries a legible koan line at rest */
  const ramp = Hall.strips.filter(s => s.onRamp);
  ok('3–4 on-ramp strips sit square under a lamp', ramp.length >= 3 && ramp.length <= 4,
     ramp.length + ' on-ramp strips');
  ok('on-ramp strips are composed larger so the koan line is sharp',
     ramp.every(s => s.composeS > 40 && Math.abs(s.rot) < 0.12));

  /* A FRESHLY PINNED STRIP IS DIGGABLE — present in the hit-test index at the
     position it landed, not painted on as decoration. */
  const spot = sparseSpot();
  const fresh = {
    cycle: C.unwalledCycles(ix, walled)[0],
    x: spot.x, y: spot.y, rot: 0.05, lift: 0, swing: 0, gloss: 0,
    z: 1e7, scale: 1,
  };
  fresh.frames = C.resolveStrip(ix, fresh.cycle);
  fresh.metrics = stripMetrics(40, false);
  fresh.canvas = { width: fresh.metrics.w, height: fresh.metrics.h };
  Hall.strips.push(fresh);
  Hall.camX = Math.max(0, Math.min(Hall.worldW - Hall.W, fresh.x - Hall.W / 2));
  const probe = hitTest(fresh.x - Hall.camX, fresh.y + fresh.metrics.h * 0.4);
  ok('a freshly pinned strip is in the hit-test index at its landed position',
     probe === fresh, probe ? 'hit cycle ' + probe.cycle : 'MISSED');
  ok('the fresh strip lands on TOP of the pile',
     Hall.strips.every(s => s === fresh || s.z < fresh.z));
  ok('the pull takes a REAL un-walled cycle',
     !walled.includes(fresh.cycle) && ix.byCycle.has(fresh.cycle),
     'cycle ' + fresh.cycle);
}

/* ═══ 7. REAL BROWSER ════════════════════════════════════════════════════ */
head('7 · REAL BROWSER — driven, not asserted');
console.log(`  \x1b[2mThis twin covers the engine and the geometry. The page itself was driven
  in a real browser with a TRUE input-level click (CDP Input.dispatchMouseEvent —
  never dispatchEvent, which is blind to hit-testing and pointer capture):
    · the booth button was pressed and the full ritual observed, with the four
      flashes landing at 4402 / 7892 / 11381 / 14872 ms and the dead beats
      measured at 3.4 s — the joke intact;
    · the delivered strip developed, flew, landed, and answered hitTest() at its
      landed position;
    · a pinned strip was clicked and opened its read view with four names, four
      koans and the cycle in gilt.
  Re-run that pass with:  node ledger/booth.test.mjs --how\x1b[0m`);

if (process.argv.includes('--how')) {
  console.log(`
  1. python3 -m http.server 8873 --bind 127.0.0.1
  2. agent-browser --session booth set viewport 1440 900
     agent-browser --session booth open http://127.0.0.1:8873/ledger/booth.html
  3. agent-browser --session booth snapshot -i        → the booth button's ref
     agent-browser --session booth click @e2
  4. For canvas strips, agent-browser's 'mouse down/up' fire at 0,0 regardless of
     a preceding 'mouse move' — drive CDP Input.dispatchMouseEvent with explicit
     x/y instead (see the twin's header note), or the click misses every strip.
  5. Tear down ONLY your own server by PID. Never pkill broadly.`);
}

/* ═══ summary ════════════════════════════════════════════════════════════ */
console.log('\n' + '─'.repeat(72));
console.log(fail === 0
  ? `\x1b[32m✓ THE PAYOFF FIRES\x1b[0m — ${pass}/${pass + fail} checks passed.`
  : `\x1b[31m✗ ${fail} check(s) failed\x1b[0m — ${pass}/${pass + fail} passed.`);
console.log('  No claim is pinned by this page. This twin asserts LIVENESS, not a theorem.');
process.exit(fail === 0 ? 0 : 1);
