/* ============================================================================
   core.test.mjs — the Node twin of The Crystal Garden's in-page liveness pill.

   Run:  node alchemy/the-crystal-garden/core.test.mjs

   The Crystal Garden makes NO theorem — it is a delight. What a payoff piece owes
   is a LIVENESS twin proving the payoff FIRES (register-appropriate: not a proof,
   the experience). This runs the SAME runLiveness() the in-page badge runs, then
   adds independent property checks + a byte-identical re-extraction parity test.

   The payoff, asserted three ways (all true BY CONSTRUCTION, not by luck):
     (A) MONOTONE GROWTH — every shipped salt's climbed HEIGHT and BRANCH-COUNT are
         non-decreasing every tick and strictly greater at the end (rise ≥ 0 always,
         height = running max, branchCount increment-only).
     (B) DEGENERATE / NEG-LIVENESS — a grain nucleated in the meniscus dead band
         accretes ~nothing (flat stub) while a floor grain of the same salt climbs.
     (C) DETERMINISTIC RESUME — serialize→restore is byte-identical AND the restored
         garden keeps growing bit-for-bit identically (the RNG state travels in JSON).
   Exits non-zero on any failure.
   ============================================================================ */

import {
  MAX_TIPS, DEAD_BAND, RAMP, SALTS, saltById, seedGarden, step, serialize, restore,
  growthReport, degenerateReport, resumeReport, runLiveness,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function ok(name, cond, info) {
  if (cond) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + name + (info ? '  ·  ' + info : '')); }
}

// ── 1. the SHARED liveness suite (the exact one the in-page pill runs) ───────────
console.log('\nshared liveness suite (identical to the in-page pill):');
{
  const L = runLiveness();
  for (const c of L.checks) ok(c.name, c.ok, c.info);
  ok('runLiveness() is all-green (' + L.pass + '/' + L.total + ')', L.pass === L.total);
}

// ── 2. independent property checks (not routed through runLiveness) ──────────────
console.log('\nindependent properties of the growth model:');
{
  // (A) per-salt monotonicity holds tick-by-tick for EVERY salt at several seeds
  let allMono = true;
  for (const s of SALTS) for (const seed of [3, 17, 91, 500]) {
    const r = growthReport(s.id, seed, 200);
    if (!r.monoHeight || !r.monoBranch) allMono = false;
  }
  ok('height & branch-count never regress, every salt × 4 seeds × 200 ticks', allMono);

  // the five salts grow to GENUINELY distinct silhouettes (habit graft is load-bearing)
  const shape = SALTS.map((s) => growthReport(s.id, 42, 240));
  const cobalt = shape[0], copper = shape.find((_, i) => SALTS[i].id === 'copper');
  ok('cobalt climbs TALLER than copper (spindly vs bushy)', cobalt.height > copper.height,
     'cobalt ' + cobalt.height + 'px vs copper ' + copper.height + 'px');
  ok('copper carries MORE tubes than cobalt (bushy vs spindly)', copper.branches > cobalt.branches,
     'copper ' + copper.branches + ' vs cobalt ' + cobalt.branches + ' tubes');

  // (B) the degenerate seed is FLAT and UNBRANCHED for every salt, floor seed climbs
  let degOk = true, worst = '';
  for (const s of SALTS) {
    const d = degenerateReport(s.id, 55, 240);
    if (!(d.stubFlat && d.stubUnbranched && d.floorHeight > 24)) { degOk = false; worst = s.id; }
  }
  ok('meniscus-band grain stays a flat, unbranched stub for every salt (neg-liveness)', degOk, worst);
  // and it is EXACTLY flat (rise gated to 0 in the dead band — a crisp neg-control)
  const d0 = seedGarden('iron', 200, /*deep in dead band*/ 24, 40, 320, 300, 20, 7);
  for (let i = 0; i < 240; i++) step(d0);
  ok('a grain in the dead band never rises: maxHeight === 0 exactly', d0.maxHeight === 0, 'height ' + d0.maxHeight);

  // (C) deterministic resume is bit-exact after serialize→restore, for every salt
  let resOk = true, growOk = true;
  for (const s of SALTS) {
    const r = resumeReport(s.id, 123, 140, 80);
    if (!r.byteIdentical) resOk = false;
    if (!r.growsSame) growOk = false;
  }
  ok('serialize→restore byte-identical for every salt', resOk);
  ok('every restored garden keeps growing bit-for-bit identically', growOk);

  // resume across a DEEP grow (not just a fresh seed): 300 ticks then resume 100 more
  const g = seedGarden('nickel', 160, 300, 40, 320, 300, 20, 2718);
  for (let i = 0; i < 300; i++) step(g);
  const snap = serialize(g), g2 = restore(snap);
  ok('deep-grown (300 ticks) serialize→restore is byte-identical', snap === serialize(g2));
  for (let i = 0; i < 100; i++) { step(g); step(g2); }
  ok('deep-grown gardens continue bit-for-bit identically (100 more ticks)', serialize(g) === serialize(g2));

  // bounded: alive tips never exceed MAX_TIPS, for a bushy salt run long
  const gb = seedGarden('copper', 160, 300, 40, 320, 300, 20, 99);
  let maxAlive = 0;
  for (let i = 0; i < 400; i++) { step(gb); const a = gb.tips.filter((t) => t.alive).length; if (a > maxAlive) maxAlive = a; }
  ok('alive tips are bounded by MAX_TIPS even for a bushy salt run long', maxAlive <= MAX_TIPS, 'peak alive ' + maxAlive + ' ≤ ' + MAX_TIPS);
}

// ── 3. re-extraction parity: the inline core IS core.mjs, byte-for-byte ───────────
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== CRYSTAL-GARDEN CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END CRYSTAL-GARDEN CORE =====';
  function stripModuleGuard(src) {
    const lines = src.split('\n'); const out = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const guardStart = /^\s*if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)/;
      if (guardStart.test(line)) {
        let depth = 0, seenBrace = false, j = i;
        for (; j < lines.length; j++) {
          for (const ch of lines[j]) { if (ch === '{') { depth++; seenBrace = true; } else if (ch === '}') depth--; }
          if (seenBrace && depth <= 0) break;
        }
        i = j; continue;
      }
      line = line.replace(/^(\s*)export\s+(?=(default\s+)?(const|let|var|function|class|async)\b)/, '$1');
      out.push(line);
    }
    return out.join('\n');
  }
  let parityOk = false, info = '';
  try {
    const coreSrc = readFileSync(join(__dir, 'core.mjs'), 'utf8').replace(/\r\n/g, '\n');
    const pageSrc = readFileSync(join(__dir, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
    const si = pageSrc.indexOf(START), ei = pageSrc.indexOf(END);
    ok('inline-core sentinels present in index.html', si >= 0 && ei > si,
       si >= 0 && ei > si ? 'slice is ' + (ei - si) + ' chars' : 'MISSING SENTINELS');
    if (si >= 0 && ei > si) {
      const inline = pageSrc.slice(si + START.length, ei).replace(/^\n/, '').replace(/\n[ \t]*$/, '');
      const expected = stripModuleGuard(coreSrc).replace(/\n+$/, '');
      parityOk = (inline === expected);
      if (!parityOk) {
        const a = inline.split('\n'), b = expected.split('\n');
        let d = -1; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i] !== b[i]) { d = i; break; } }
        info = 'first diff at line ' + (d + 1) + ' (inline ' + a.length + ' lines, core ' + b.length + ')';
      }
    }
  } catch (e) { info = 'parity read failed: ' + e.message; }
  ok('(parity)★ index.html inline core IS core.mjs, byte-for-byte (guard+export-stripped)', parityOk, info);
}

const total = pass + fail;
console.log('\n' + (fail === 0 ? '\x1b[32m' : '\x1b[31m') + pass + '/' + total + (fail === 0 ? ' GREEN' : ' — ' + fail + ' FAILED') + '\x1b[0m\n');
process.exit(fail === 0 ? 0 : 1);
