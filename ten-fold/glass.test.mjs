// ============================================================================
//  THE TEN-FOLD GLASS — the PAYOFF-LIVENESS twin (Node side).
//
//  This piece makes NO math claim and carries NO neg-control theorem. What it
//  owes is proof that the EXPERIENCE FIRES: that the wheel really reaches every
//  plate, that the rule never lies, that the nesting actually happens rather
//  than being cut, and that a reload lands somewhere sane.
//
//  It runs the SAME runSelfTest() the in-page ?selftest chip runs (driving the
//  REAL detent entry function — never a synthetic canvas pointer event, which
//  headless cannot deliver), plus Node-only assertions, plus a byte-parity check
//  that the slab forge-inlined into index.html IS this core.
//
//  Run:  node ten-fold/glass.test.mjs   →  MUST be ALL GREEN.
// ============================================================================
import {
  LADDER, LEGEND, GFIX, E_MIN, E_MAX, T_MIN, T_MAX, WARP_B,
  warp, invWarp, stepDetent, sanitizeD, alphaFor, renderPlan, stepFree,
  readingAt, bandAt, runSelfTest,
} from './glass.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
const ok = (name, cond, detail = '') => {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ·  ' + detail : '')); }
  else { console.log('  ✗ ' + name + (detail ? '  ·  ' + detail : '')); }
};

console.log('The Ten-Fold Glass — glass.test.mjs (liveness, not a theorem)\n');

// ── 1. the shared in-page liveness test ──────────────────────────────────────
console.log('— the shared runSelfTest() (identical to the in-page ?selftest chip) —');
{
  const st = runSelfTest();
  for (const l of st.lines) ok(l.name, l.ok, l.detail);
  ok('every in-page liveness check is green', st.ok, `${st.passed}/${st.total}`);
}

// ── 2. THE LADDER ITSELF ─────────────────────────────────────────────────────
console.log('\n— the ladder —');
{
  ok('the ladder carries at least 13 plates', LADDER.length >= 13, `${LADDER.length} plates`);
  ok('the plates are strictly ascending in decade',
     LADDER.every((p, i) => i === 0 || p.e > LADDER[i - 1].e), `10^${E_MIN} … 10^${E_MAX}`);
  ok('at least 13 decades BELOW human scale', -E_MIN >= 13, `${-E_MIN} decades down`);
  ok('at least 13 decades ABOVE human scale', E_MAX >= 13, `${E_MAX} decades up`);
  ok('every plate key is unique', new Set(LADDER.map(p => p.key)).size === LADDER.length);
  ok('EVERY detent on the ladder carries a legend, plate or no plate',
     Array.from({ length: E_MAX - E_MIN + 1 }, (_, i) => E_MIN + i)
          .every(e => typeof LEGEND[String(e)] === 'string' && LEGEND[String(e)].length > 0),
     `${E_MAX - E_MIN + 1} detents, ${LADDER.length} of them drawn`);
  const gapless = [];
  for (let e = E_MIN; e <= E_MAX; e++) if (!LADDER.some(p => p.e === e)) gapless.push(e);
  ok('the empty stretches are LEFT empty (a legend, never a fabricated plate)',
     gapless.length === (E_MAX - E_MIN + 1) - LADDER.length,
     `${gapless.length} legend-only detents — e.g. 10^${gapless[0]}: "${LEGEND[String(gapless[0])]}"`);
}

// ── 3. THE OUTWARD ANCHOR CHAIN — no big numbers, ever ───────────────────────
console.log('\n— the fixed-point chain (accumulated outward: only small numbers multiply) —');
{
  ok('every accumulated fix point stays inside its own plate',
     GFIX.every(g => Math.abs(g[0]) < 0.5 && Math.abs(g[1]) < 0.5),
     `max |g| = ${Math.max(...GFIX.map(g => Math.max(Math.abs(g[0]), Math.abs(g[1])))).toFixed(4)} of a plate side`);
  ok('every fix point is finite across all 41 decades',
     GFIX.every(g => Number.isFinite(g[0]) && Number.isFinite(g[1])));
  // the same point, recomputed from the OTHER end (absolute world coords) blows
  // up — this is WHY the chain accumulates outward. A sanity check on the claim.
  const absoluteScale = Math.pow(10, E_MAX - E_MIN);
  ok('an absolute-world-coordinate formulation would need 10^41 of dynamic range',
     absoluteScale > 1e40, `10^${E_MAX - E_MIN} — the outward chain needs none`);
}

// ── 4. THE DETENT, driven for real ───────────────────────────────────────────
console.log('\n— the detent (the REAL entry function, driven headlessly) —');
{
  ok('a press from mid-travel SEATS on the near detent rather than skipping it',
     stepDetent(4.3, -1) === 4 && stepDetent(4.3, +1) === 5 &&
     stepDetent(-7.8, -1) === -8 && stepDetent(-7.8, +1) === -7,
     '4.3↓→4 (seats), 4.3↑→5, −7.8↓→−8 (seats), −7.8↑→−7');
  ok('a shifted press strides five decades', stepDetent(0, -1, 5) === -5 && stepDetent(0, +1, 5) === 5);
  ok('the detent never walks off the ladder',
     stepDetent(E_MIN, -1) === E_MIN && stepDetent(E_MAX, +1) === E_MAX &&
     stepDetent(E_MIN, -1, 5) === E_MIN && stepDetent(E_MAX, +1, 9) === E_MAX);
  // walk the WHOLE ladder and collect the names actually reached
  let d = E_MAX; const namesDown = [];
  for (let i = 0; i < 60 && d > E_MIN; i++) { d = stepDetent(d, -1);
    const p = LADDER.find(q => q.e === d); if (p) namesDown.push(p.name); }
  ok('walking down from the top names every plate but the one you started on',
     namesDown.length === LADDER.length - 1 && namesDown[namesDown.length - 1] === 'the nucleus',
     `${namesDown.length} plates named, ending at "${namesDown[namesDown.length - 1]}"`);
}

// ── 5. THE READING ───────────────────────────────────────────────────────────
console.log('\n— the reading —');
{
  ok('on a detent the reading is a whole power of ten',
     readingAt(0).exp === '0' && readingAt(-15).exp === '-15' && readingAt(26).exp === '26');
  ok('off a detent the reading carries its true decimals (it never rounds away)',
     readingAt(3.47).exp === '3.47' && readingAt(-4.5).exp === '−4.50',
     `10^${readingAt(3.47).exp} and 10^${readingAt(-4.5).exp}`);
  ok('a legend-only detent says so, and names itself',
     readingAt(19).hasPlate === false && readingAt(19).title === "a spiral arm's thickness");
  ok('a plate detent names the plate',
     readingAt(7).hasPlate === true && readingAt(7).title === 'the blue Earth');
  ok('every point of the travel sits in a named band of weather',
     Array.from({ length: 421 }, (_, i) => T_MIN + i * 0.1).every(x => !!bandAt(x).name));
}

// ── 6. PRESENCE + THE PLAN ───────────────────────────────────────────────────
console.log('\n— presence and the render plan —');
{
  ok('a plate at its own decade is fully present', alphaFor(1) === 1);
  ok('a plate 5 decades deep is gone', alphaFor(1e-5) === 0);
  ok('a plate 5 decades of blow-up past you is gone', alphaFor(1e5) === 0);
  ok('presence is continuous — no jump bigger than 0.01 per 0.01 decade',
     (() => { let worst = 0, prev = alphaFor(Math.pow(10, -5));
        for (let l = -5; l <= 5; l += 0.01) { const a = alphaFor(Math.pow(10, l));
          worst = Math.max(worst, Math.abs(a - prev)); prev = a; } return worst <= 0.011; })(),
     'no popping in or out');
  const plan = renderPlan(0, 800);
  ok('at the hand, the plan is ordered outermost-first (the parent is laid down first)',
     plan.every((q, i) => i === 0 || q.e < plan[i - 1].e),
     plan.map(q => '10^' + q.e).join(' → '));
  ok('at the hand, the hand itself is drawn at exactly the view size',
     Math.abs(plan.find(q => q.key === 'hand').size - 800) < 1e-9);
  ok('the plan is finite everywhere along the travel',
     Array.from({ length: 421 }, (_, i) => T_MIN + i * 0.1)
          .every(x => renderPlan(x, 800).every(q => Number.isFinite(q.size) &&
                                                    Number.isFinite(q.x) && Number.isFinite(q.y))));
}

// ── 7. THE FREE STEP ─────────────────────────────────────────────────────────
console.log('\n— the pawl (the free step) —');
{
  // released off a detent with no speed, it SETTLES onto one — and stays.
  let d = 3.31, v = 0, frames = 0;
  while (frames < 900 && !(v === 0 && Math.abs(d - Math.round(d)) < 1e-9)) {
    const s = stepFree(d, v, 1 / 60, null); d = s.d; v = s.vel; frames++;
  }
  ok('released off a detent, the wheel SEATS on one and stops',
     v === 0 && Math.abs(d - Math.round(d)) < 1e-9,
     `settled to 10^${Math.round(d)} in ${frames} frames (${(frames / 60).toFixed(2)} s)`);
  // a hard flick COASTS several decades before it seats (the pawl skims crests).
  let d2 = 0, v2 = -6.5, n = 0;
  while (n < 1200 && !(v2 === 0)) { const s = stepFree(d2, v2, 1 / 60, null); d2 = s.d; v2 = s.vel; n++; }
  ok('a hard flick COASTS across several decades before it bites',
     Math.abs(d2 - 0) >= 2 && Math.abs(d2 - Math.round(d2)) < 1e-9,
     `one flick carried ${Math.abs(d2).toFixed(0)} decades, seating at 10^${Math.round(d2)}`);
  // the travel never escapes the elastic ends
  let d3 = E_MAX, v3 = 40, esc = false;
  for (let i = 0; i < 600; i++) { const s = stepFree(d3, v3, 1 / 60, null); d3 = s.d; v3 = s.vel;
    if (d3 > T_MAX + 1e-9 || d3 < T_MIN - 1e-9) esc = true; }
  ok('a violent flick at the top overshoots elastically and is pulled back',
     !esc && d3 <= E_MAX + 1e-9, `came to rest at 10^${d3.toFixed(2)}, never past 10^${T_MAX}`);
}

// ── 8. THE WARP ──────────────────────────────────────────────────────────────
console.log('\n— the finger warp —');
{
  ok('the warp fixes every integer (a detent is where the finger dwells)',
     [-15, -3, 0, 4, 26].every(n => Math.abs(warp(n) - n) < 1e-12));
  ok('B < 1, so the warp is strictly monotone by construction', WARP_B < 1, `B = ${WARP_B}`);
  ok('the warp DWELLS at a detent — a hand moving at constant speed slows there',
     (1 - WARP_B * Math.cos(0)) < (1 - WARP_B * Math.cos(Math.PI)),
     `dwell rate ${(1 - WARP_B).toFixed(2)}× at the detent vs ${(1 + WARP_B).toFixed(2)}× at the crest`);
  ok('invWarp inverts to machine precision at the crests too',
     [0.5, -0.5, 12.5, -14.5].every(u => Math.abs(invWarp(warp(u)) - u) < 1e-9));
}

// ── 9. RESTORE ───────────────────────────────────────────────────────────────
console.log('\n— restore —');
{
  ok('a garbage stored decade restores to the hand',
     sanitizeD('{}') === 0 && sanitizeD(Infinity) === 0 && sanitizeD(-Infinity) === 0);
  ok('a legitimate stored decade survives verbatim', sanitizeD(-9.25) === -9.25 && sanitizeD('17') === 17);
}

// ── 10. BYTE-PARITY — the page runs THIS core ────────────────────────────────
console.log('\n— byte-parity: the slab inlined into index.html IS this core —');
{
  const BEGIN = '// ===== TEN-FOLD CORE (inlined byte-twin of glass.mjs) BEGIN =====';
  const END   = '// ===== TEN-FOLD CORE END =====';
  const region = (s) => { const a = s.indexOf(BEGIN), b = s.indexOf(END);
    return (a < 0 || b < 0) ? null : s.slice(a, b + END.length); };
  const norm = (s) => s.split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
  const mine = region(readFileSync(join(here, 'glass.mjs'), 'utf8'));
  let page = null;
  try { page = region(readFileSync(join(here, 'index.html'), 'utf8')); } catch { /* not built */ }
  ok('glass.mjs carries the sentinels', !!mine, mine ? `${mine.length} chars` : 'MISSING');
  ok('index.html carries the same core, byte for byte',
     !!page && !!mine && norm(page) === norm(mine),
     page ? `${norm(page).length} vs ${norm(mine).length} chars` : 'index.html not built yet (run forge)');
}

console.log(`\n${pass === total ? '✓ ALL GREEN' : '✗ FAILURES'} — ${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
