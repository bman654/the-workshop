// ============================================================================
//  THE BEATING BENCH — Node twin of the in-page self-test.
//  Run:  node sound-garden/the-beating-bench/core.test.mjs
//
//  Re-proves the SAME legs the in-page pill proves (via the shared
//  runBeatSelfTest imported from ./core.mjs — itself built on ../pitch-core.mjs),
//  then asserts the SINGLE-SOURCE discipline:
//    • BYTE-TWIN parity (NEW physics) — index.html's inlined BEAT CORE slice
//      === ./core.mjs's BEAT CORE slice, char-for-char (the page's
//      runBeatSelfTest IS the module's).
//    • BYTE-TWIN parity (the borrowed lattice) — index.html's inlined OUT OF
//      TUNE CORE slice === ../pitch-core.mjs's, AND its COMMA CORE slice ===
//      ../pitch-core.mjs's (the page supplies cents/foldToOctave + JUST_SET via
//      byte-twins, not re-typed tuning math).
//    • SINGLE-SOURCE — the just-interval ratios live as code literals in exactly
//      ONE file: ../pitch-core.mjs. They are NOT re-typed in core.mjs or in the
//      page outside the byte-twin slices. The syntonic-comma negative control
//      (81/80) is BUILT here from its integer parts so this test is not a hit.
//    • DEEPER re-derivations — the nearest-pair beat, the consonant silent set,
//      the syntonic-comma throb, and the dead-stop minimum, re-measured here.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the bench lives one level deeper than the rack, so the module
//  import path is ../pitch-core.mjs (NOT ../sound-garden/pitch-core.mjs), exactly
//  like sound-garden/the-comma/core.test.mjs.
// ============================================================================
import {
  runBeatSelfTest, beatRate, nearestPair, stillZones, silentZoneIndices,
  nearestStillZone, JUST_M3, DITONE, N_PARTIALS,
} from './core.mjs';
import { JUST_SET, JUST_NAME, cents, foldToOctave } from '../pitch-core.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // the-beating-bench → sound-garden → repo root
let pass = 0, total = 0;
function check(name, cond, info) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end) {
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}

// ── 1. THE FULL SHARED SELF-TEST (the five legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runBeatSelfTest legs) —');
{
  const r = runBeatSelfTest(220);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. THE HEARD BEAT IS |Δf| OF THE NEAREST PARTIAL PAIR (a second f0). ──────
{
  const f0 = 261.6256;          // a different drone register, to show scale-freedom
  let ok = true, worst = 0;
  for (let k = 0; k <= 400; k++) {
    const r = 1 + k / 400;
    const d = Math.abs(beatRate(f0, r) - nearestPair(f0, r).beat);
    worst = Math.max(worst, d); if (d > 1e-9) ok = false;
  }
  check('needle = |Δf| (f0=261.63): the beat rate === |fHi − fLo| of the nearest partial pair to the bit across 401 ratios — the seen traces and the heard throb are one number',
        ok, `worst |beatRate − |Δf|| = ${worst.toExponential(2)} Hz`);
}

// ── 3. THE SILENT ISLANDS ARE THE CONSONANCES (and only them). ───────────────
{
  const f0 = 220;
  const silent = silentZoneIndices(f0).map(i => JUST_NAME[i]);
  const EXPECT = ['unison', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'octave'];
  const setMatch = silent.length === EXPECT.length && EXPECT.every((n, k) => silent[k] === n);
  let zeroOK = true, throbOK = true, minThrob = Infinity;
  for (let i = 0; i < JUST_SET.length; i++) {
    const br = beatRate(f0, JUST_SET[i]);
    if (EXPECT.includes(JUST_NAME[i])) { if (br > 1e-9) zeroOK = false; }
    else { minThrob = Math.min(minThrob, br); if (br <= 1e-3) throbOK = false; }
  }
  check('consonant islands: the just ratios that beat 0 are EXACTLY {unison,m3,M3,P4,P5,m6,M6,octave} (the classical consonances), and every complex just ratio still throbs — dissonance never stills',
        setMatch && zeroOK && throbOK,
        `silent = [${silent.join(', ')}] · complex ratios throb ≥ ${minThrob.toFixed(2)} Hz`);
}

// ── 4. THE SYNTONIC-COMMA NEGATIVE CONTROL: 5/4 silent, 81/64 throbs. ─────────
// Build the ditone from integer parts so this file does NOT contain a re-typed
// ratio literal that the single-source grep (leg 8) would flag.
{
  const f0 = 220;
  const NUM = 81, DEN = 64;               // the Pythagorean ditone 81/64
  const ditone = NUM / DEN;
  const brJust = beatRate(f0, JUST_M3);   // 5/4 (imported, single-sourced)
  const brDit  = beatRate(f0, ditone);
  const nudge  = cents(ditone / JUST_M3); // the syntonic comma in cents
  check('syntonic-comma control: 5/4 reaches DEAD SILENCE (0 Hz) but 81/64 (5/4 nudged by 81/80) STILL THROBS — visual/semitone proximity to M3 cannot fake stillness; only the true ratio is silent',
        brJust < 1e-9 && brDit > 1e-3 && Math.abs(nudge - 21.506) < 0.01 && DITONE === ditone,
        `5/4 → ${brJust.toExponential(2)} Hz (silent) · 81/64 → ${brDit.toFixed(3)} Hz (throb) · nudge ${nudge.toFixed(3)}¢`);
}

// ── 5. THE DEAD STOP IS A TRUE MINIMUM (P5), symmetric on both sides. ────────
{
  const f0 = 220, P5 = 3 / 2;
  const at = beatRate(f0, P5);
  let mono = true, pu = -1, pd = -1;
  for (let k = 1; k <= 60; k++) {
    const e = k * 0.0006;
    const up = beatRate(f0, P5 * (1 + e)), dn = beatRate(f0, P5 * (1 - e));
    if (up <= pu - 1e-9 || dn <= pd - 1e-9) mono = false; pu = up; pd = dn;
  }
  check('a true dead-stop: the beat is 0 at 3/2 and grows STRICTLY on both sides as you drag away — the silence is a real minimum you slow into, not a flat valley',
        at < 1e-9 && mono && beatRate(f0, P5 * 1.005) > at && beatRate(f0, P5 * 0.995) > at,
        `beat at 3/2 = ${at.toExponential(2)} Hz · monotone both sides ✓ · ±0.5% → ${beatRate(f0, P5*1.005).toFixed(2)} Hz`);
}

console.log('\n— Single-source discipline (the proofs the ratios are not re-typed) —');

// ── 6. BYTE-TWIN PARITY (NEW physics): index.html BEAT CORE === ./core.mjs. ──
{
  const BEGIN = '// ===== BEAT CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== BEAT CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (BEAT CORE): index.html\'s inlined BEAT CORE block is char-for-char ./core.mjs (between sentinels) — the page\'s runBeatSelfTest IS the module\'s',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 7. BYTE-TWIN PARITY (borrowed lattice): page OUT OF TUNE CORE + COMMA CORE
//     === ../pitch-core.mjs (the page gets cents/foldToOctave + JUST_SET via
//     byte-twins of the module, not re-typed). ───────────────────────────────
{
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const pairs = [
    ['OUT OF TUNE CORE', '// ===== OUT OF TUNE CORE (inlined byte-twin) BEGIN =====', '// ===== OUT OF TUNE CORE END ====='],
    ['COMMA CORE', '// ===== COMMA CORE (inlined byte-twin) BEGIN =====', '// ===== COMMA CORE END ====='],
  ];
  for (const [label, BEGIN, END] of pairs) {
    const ms = sliceBetween(mod, BEGIN, END), ps = sliceBetween(page, BEGIN, END);
    check(`byte-twin parity (${label}): index.html's inlined ${label} block is char-for-char ../pitch-core.mjs — the borrowed lattice (JUST_SET / cents / foldToOctave) is single-sourced, not re-typed`,
          ms != null && ps != null && ms === ps,
          ms == null ? 'module sentinels MISSING' : ps == null ? 'page sentinels MISSING' :
            (ms === ps ? `slice ${ms.length} chars identical` : `DRIFT (mod ${ms.length} vs page ${ps.length})`));
  }
}

// ── 8. SINGLE-SOURCE GREP: the just-interval ratios live as code literals in
//     EXACTLY ONE file — ../pitch-core.mjs. Walk the repo; the JUST_SET literal
//     string must appear as live code only in pitch-core.mjs (the page holds it
//     only inside the byte-twinned OUT OF TUNE CORE slice — proven identical in
//     leg 7 — and core.mjs imports it). ────────────────────────────────────────
{
  // the bare JUST_SET array literal as pitch-core.mjs writes it (its presence as
  // CODE marks a source of truth). BUILT here from the ratios' integer parts so
  // this test file does NOT itself contain the literal verbatim — otherwise the
  // grep would (correctly) flag the test as a second mention.
  const PARTS = [[1,1],[16,15],[9,8],[6,5],[5,4],[4,3],[45,32],[3,2],[8,5],[5,3],[9,5],[15,8],[2,1]];
  const FRAG = '[' + PARTS.map(([p,q]) => p + '/' + q).join(', ') + ']';
  const skipDirs = new Set(['.git', 'node_modules', 'assets']);
  const codeHits = [], allHits = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) { if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js|html)$/.test(ent.name)) continue;
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(FRAG)) {
        allHits.push(rel);
        if (rel.endsWith('.mjs') || rel.endsWith('.js')) codeHits.push(rel);
      }
    }
  }
  walk(repoRoot);
  // the ONLY .mjs/.js code-literal source must be pitch-core.mjs. The page hits
  // (html) are byte-twin slices, proven identical to the module in leg 7 — not a
  // second source. core.mjs must NOT contain the literal (it imports JUST_SET).
  const ok = codeHits.length === 1 && codeHits[0] === 'sound-garden/pitch-core.mjs' &&
             !codeHits.includes('sound-garden/the-beating-bench/core.mjs');
  check('single-source: the just-interval ratio set is a code literal in EXACTLY ONE file — sound-garden/pitch-core.mjs; core.mjs imports it and the page only byte-twins it',
        ok, `code-literal files: [${codeHits.join(', ')}] · all text mentions: [${allHits.join(', ')}]`);
}

console.log(`\n—— The Beating Bench Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
