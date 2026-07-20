/* ============================================================================
   core.test.mjs — the Node twin of The Climbing Ribbon bench's in-page self-test.

   Run:  node alchemy/the-climbing-ribbon/core.test.mjs

   Proves, for the partition/retention math the page inlines byte-identical, ONLY the
   claims the bench honestly makes:
     • CRUX ★: the band/front ratio from the RK4-integrated coupled ODEs is INVARIANT —
       for each pigment it equals its Rf to <1e-9 across ≥3 stop-times × ≥3 strip
       lengths × BOTH front laws (Washburn AND linear). Non-definitional: front & bands
       are integrated independently; the invariance EMERGES. The claim is "band/front is
       constant across runs, lengths, and laws," never "equals a handbook Rf."
     • NEG-CONTROL A ★: phases identical (mobilePol === statPol) ⇒ every Rf === 0.5
       EXACTLY (bit-exact) ⇒ the ladder collapses, all pigments co-migrate. (The α=1 rhyme.)
     • NEG-CONTROL B ★: a SHIPPED pigment pair + two SHIPPED solvents straddling the
       paper polarity whose sign(Rf_i − Rf_j) REVERSES — a leader becomes a trailer
       (load-bearing, not decorative).
     • PAYOFF: the default blend under the default solvent resolves into ≥2 separated bands.
     • HONESTY: every Rf ∈ (0,1), dimensionless, compared to no external constant; band
       width is a render flourish only and cannot enter the Rf computation.
     • LIVENESS: develop() drives the payoff headless — the front climbs & decelerates,
       a separating solvent parts the blend, the notch co-migrates it.
   PLUS a byte-identical re-extraction parity test (page inline core === core.mjs).
   It runs the SAME runSelfTest() + livenessProbe() the in-page badge runs, then adds
   independent property checks + parity. Exits non-zero on any failure.
   ============================================================================ */

import {
  TOL_CRUX, PAPER_POL, BETA, PIGMENTS, SOLVENTS, DEFAULT_SOLVENT, DEFAULT_BLEND,
  retention, rf, pigmentByName, solventByName, mixBlend, LAWS, lawParams, makeRun, develop,
  cruxWorstError, runSelfTest, livenessProbe,
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

// ── 1. run the SHARED self-test body (the exact one the page pill runs) ──────────
console.log('\nshared self-test body (identical to the in-page pill):');
{
  const st = runSelfTest();
  for (const c of st.checks) ok(c.name, c.ok, c.info);
  ok('runSelfTest() is all-green (' + st.pass + '/' + st.total + ')', st.pass === st.total);
}

// ── 2. the payoff-liveness probe (headless, drives develop()) ────────────────────
console.log('\npayoff-liveness (headless via develop()):');
{
  const lv = livenessProbe();
  for (const c of lv.checks) ok(c.name, c.ok, c.info);
  ok('livenessProbe() is all-green (' + lv.pass + '/' + lv.total + ')', lv.pass === lv.total);
}

// ── 3. independent property checks (not routed through runSelfTest) ──────────────
console.log('\nindependent properties of the partition math:');
{
  // retention at the notch is exactly 1 for every pigment
  let k1 = true; for (const pg of PIGMENTS) if (retention(pg.p, PAPER_POL, PAPER_POL) !== 1) k1 = false;
  ok('retention(p, s, s) === 1 exactly for every pigment (m===s ⇒ k=e^0)', k1);

  // rf monotone in the partition: higher k ⇒ lower Rf
  ok('rf is strictly decreasing in retention k', rf(0.1, 0.9) < 0.5 && rf(0.9, 0.9, 0.9) === 0.5);

  // like-dissolves-like: a pigment matching the solvent rides higher than one matching the paper
  const solvent = 0.12;   // non-polar
  const rMatchSolvent = rf(0.12, solvent);       // pigment == solvent polarity
  const rMatchPaper = rf(PAPER_POL, solvent);    // pigment == paper polarity
  ok('like-dissolves-like: pigment matching the solvent rides higher than one matching the paper',
     rMatchSolvent > rMatchPaper, 'Rf(matches solvent)=' + rMatchSolvent.toFixed(3) + ' > Rf(matches paper)=' + rMatchPaper.toFixed(3));

  // the CRUX residual is tiny under an off-default solvent too (invariance is not solvent-specific)
  const cwAqua = cruxWorstError(PIGMENTS, PAPER_POL, SOLVENTS.find((s) => s.name === 'Aqua').p).worst;
  ok('CRUX holds under a DIFFERENT solvent (Aqua) too, <1e-9', cwAqua < TOL_CRUX, 'worst ' + cwAqua.toExponential(2));

  // TOTAL order reversal across the notch (every pair, not just the shipped one) — the square form guarantee
  const below = SOLVENTS.find((s) => s.p < PAPER_POL).p, above = SOLVENTS.find((s) => s.p > PAPER_POL).p;
  const orderBelow = PIGMENTS.map((pg) => rf(pg.p, below));
  const orderAbove = PIGMENTS.map((pg) => rf(pg.p, above));
  let totalReverse = true;
  for (let i = 0; i < PIGMENTS.length; i++) for (let j = i + 1; j < PIGMENTS.length; j++) {
    if (Math.sign(orderBelow[i] - orderBelow[j]) !== -Math.sign(orderAbove[i] - orderAbove[j])) totalReverse = false;
  }
  ok('the ladder inverts TOTALLY across the notch — every pigment pair reverses (square-form guarantee)', totalReverse);

  // develop(): band final centroid === rf_i · front final, exactly (render === proof share one source)
  const pg3 = DEFAULT_BLEND.map((n) => pigmentByName(n));
  const params = lawParams('washburn', { Hmax: 1.0, tEnd: 30 });
  const run = develop({ pigments: pg3, solvent: SOLVENTS[DEFAULT_SOLVENT], law: 'washburn', params, tEnd: 30 });
  let bandExact = true, worst = 0;
  for (let i = 0; i < pg3.length; i++) {
    const ratio = run.final.bands[i] / run.final.front;
    worst = Math.max(worst, Math.abs(ratio - run.final.rfs[i]));
    if (Math.abs(ratio - run.final.rfs[i]) > TOL_CRUX) bandExact = false;
  }
  ok('develop(): every band centroid === rf_i · front to <1e-9 (the animated walk IS the proof)',
     bandExact, 'worst ' + worst.toExponential(2));

  // the two front laws produce DIFFERENT front shapes (so the invariance is not a single-law artifact)
  const pW = lawParams('washburn', { Hmax: 1, tEnd: 30 }), pL = lawParams('linear', { Hmax: 1, tEnd: 30 });
  const rW = develop({ pigments: pg3, solvent: SOLVENTS[DEFAULT_SOLVENT], law: 'washburn', params: pW, tEnd: 30 });
  const rL = develop({ pigments: pg3, solvent: SOLVENTS[DEFAULT_SOLVENT], law: 'linear', params: pL, tEnd: 30 });
  const half = Math.floor(rW.front.length / 2);
  ok('the two front laws are genuinely different shapes (Washburn front ≠ linear front at mid-run)',
     Math.abs(rW.front[half] - rL.front[half]) > 0.05,
     'washburn ' + rW.front[half].toFixed(3) + ' vs linear ' + rL.front[half].toFixed(3) + ' at half-time');

  // mixBlend darkens to a mud, and its members carry the parting Rf
  const blend = mixBlend(DEFAULT_BLEND);
  ok('mixBlend() returns a muddy blob + its member pigments with Rf', blend.members.length === DEFAULT_BLEND.length && /^#[0-9a-f]{6}$/.test(blend.color));
}

// ── 4. re-extraction parity: the inline core IS core.mjs, byte-for-byte ───────────
console.log('\nre-extraction parity (page inline core === core.mjs, byte-for-byte):');
{
  const START = '// ===== RIBBON-CORE (byte-identical to core.mjs) =====';
  const END   = '// ===== END RIBBON-CORE =====';
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
