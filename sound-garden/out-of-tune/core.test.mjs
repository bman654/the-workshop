// ============================================================================
//  OUT OF TUNE — Node twin of the in-page self-test.
//  Run:  node sound-garden/out-of-tune/core.test.mjs
//
//  Re-proves the SAME legs the in-page pill proves (via the shared
//  runOutOfTuneSelfTest imported from ../pitch-core.mjs), then asserts the
//  SINGLE-SOURCE discipline:
//    • BYTE-TWIN parity — index.html's inlined OUT OF TUNE CORE slice === the
//      module slice char-for-char (the page's runOutOfTuneSelfTest IS the module's).
//    • PRIOR BLOCKS UNTOUCHED — the COMMA CORE and PITCH CORE blocks above it are
//      still byte-identical to the-comma's / butterfly-voice's inlined copies (the
//      #76 append perturbed no byte above it).
//    • ANTI-CIRCULARITY grep — the pitch law (function cents / function foldToOctave)
//      is DEFINED in exactly one file (pitch-core.mjs); it is NOT re-defined in the
//      page or this test (this leaf REUSES the COMMA CORE's cents/fold).
//    • CORE A parity — the test's PLANETS array IS ./data.mjs (not re-typed), so the
//      LEG-1/LEG-2 numbers measure the same data the page plays.
//    • DEEPER re-derivations — the audible band, the controls, the chord tones.
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: this bench lives one level deeper than butterfly-voice, so the module
//  import path is ../pitch-core.mjs (NOT ../sound-garden/pitch-core.mjs).
// ============================================================================
import {
  runOutOfTuneSelfTest, nearestDev, nearestDevAbs, nearestJustName,
  planetHz, adjacentDev, foldToOctave, cents,
  KEPLER_REL_TOL, DETUNE_FLOOR, DETUNE_CEIL, CLEAN_THRESH, keplerRel, JUST_SET,
} from '../pitch-core.mjs';
import { PLANETS, PLUTO, CONCORDIA } from './data.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');     // out-of-tune → sound-garden → repo root
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

// ── 1. THE FULL SHARED SELF-TEST (the four legs, identical to the pill). ──────
console.log('\n— The full in-page self-test (the shared runOutOfTuneSelfTest legs) —');
{
  const r = runOutOfTuneSelfTest(PLANETS, CONCORDIA);
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— Deeper Node-only re-derivations (this file, not the bundled self-test) —');

// ── 2. EVERY REAL PLANET OBEYS KEPLER a^(3/2) === period within 0.10%. ────────
{
  let ok = true, worst = 0, worstName = '';
  for (const p of PLANETS) { const rel = keplerRel(p.a, p.period);
    if (rel >= KEPLER_REL_TOL) ok = false;
    if (rel > worst) { worst = rel; worstName = p.name; } }
  check('Kepler: every real planet a^(3/2) === period within 0.10% — a and period are stored separately in the orrery, so their agreement is real proof',
        ok && worst < KEPLER_REL_TOL, `worst = ${(worst*100).toFixed(4)}% (${worstName}) · band ${(KEPLER_REL_TOL*100).toFixed(2)}%`);
  // and Pluto (the optional dwarf) still passes Kepler.
  const pr = keplerRel(PLUTO.a, PLUTO.period);
  check('Pluto (optional dwarf) also passes Kepler', pr < KEPLER_REL_TOL, `Pluto rel = ${(pr*100).toFixed(4)}%`);
}

// ── 3. THE AUDIBLE DETUNING BAND: every adjacent pair nonzero & in [3,60]¢. ───
{
  let ok = true, lo = Infinity, hi = -Infinity, loP = '', hiP = '';
  const lines = [];
  for (let i = 0; i < PLANETS.length - 1; i++) {
    const dev = adjacentDev(PLANETS[i].period, PLANETS[i+1].period);
    const ad = Math.abs(dev);
    if (!(ad >= DETUNE_FLOOR && ad <= DETUNE_CEIL) || ad === 0) ok = false;
    if (ad < lo) { lo = ad; loP = PLANETS[i].name+'→'+PLANETS[i+1].name; }
    if (ad > hi) { hi = ad; hiP = PLANETS[i].name+'→'+PLANETS[i+1].name; }
    lines.push(`${PLANETS[i].name.slice(0,4)}→${PLANETS[i+1].name.slice(0,4)} ${dev>=0?'+':'−'}${ad.toFixed(2)}¢`);
  }
  check('audible detuning: every adjacent pair NONZERO and in [3,60]¢ off the nearest just — the chord is provably sour',
        ok, `band ${lo.toFixed(2)}¢ (${loP}) … ${hi.toFixed(2)}¢ (${hiP})`);
  console.log('      ' + lines.join(' · '));
  // the specific headline pairs the prose claims, pinned exact:
  const merVen = Math.abs(adjacentDev(PLANETS[0].period, PLANETS[1].period));
  const satUra = Math.abs(adjacentDev(PLANETS[5].period, PLANETS[6].period));
  const satUraName = nearestJustName(foldToOctave(PLANETS[6].period/PLANETS[5].period));
  const merVenName = nearestJustName(foldToOctave(PLANETS[1].period/PLANETS[0].period));
  check('headline pairs pinned: Mercury–Venus = 37.55¢ off the major third (sourest real), Saturn–Uranus = 24.14¢ off the tritone',
        Math.abs(merVen-37.55)<0.01 && merVenName==='M3' && Math.abs(satUra-24.14)<0.01 && satUraName==='tritone',
        `Mer–Ven ${merVen.toFixed(2)}¢ off ${merVenName} · Sat–Ura ${satUra.toFixed(2)}¢ off ${satUraName}`);
}

// ── 4. CONTROL A (Concordia): exact-3:2 passes Kepler via BAND, snaps 0¢ exact. ─
{
  const rel = keplerRel(CONCORDIA.a, CONCORDIA.period);
  const passes = rel < KEPLER_REL_TOL;
  const wouldFailWithEquals = (Math.pow(CONCORDIA.a, 1.5) === CONCORDIA.period) === false;  // 1 ULP
  const snap = cents(foldToOctave(CONCORDIA.period/1.0) / (3/2));
  check('control A (Concordia): fictional exact-3:2 PASSES Kepler via the BAND (=== would false-fail by 1 ULP) AND its interval snaps to 0¢ bit-exact',
        passes && wouldFailWithEquals && snap === 0,
        `Kepler rel = ${rel.toExponential(2)} · a^1.5 = ${Math.pow(CONCORDIA.a,1.5)} (≠ ${CONCORDIA.period} by 1 ULP) · dev = ${snap}¢`);
  const tone = planetHz(CONCORDIA.period);
  check('control A tone: Concordia sings a pure beat-free 330 Hz fifth above Earth (220 Hz)', tone === 330, `${tone} Hz`);
}

// ── 5. CONTROL B (Eris-X): a corrupt body FAILS the Kepler band (has teeth). ──
{
  const rel = keplerRel(2.0, 3.5);     // a:2.0 period:3.5 — period ≠ a^(3/2)
  check('control B (Eris-X corrupt): a body with period ≠ a^(3/2) FAILS the Kepler band by ~190x — the law-check is non-vacuous',
        rel >= KEPLER_REL_TOL && rel > 0.10, `Eris-X rel = ${(rel*100).toFixed(2)}% ≥ ${(KEPLER_REL_TOL*100).toFixed(2)}% — REJECTED`);
}

// ── 6. THE CHORD TONES are Earth-anchored period-folds (what you HEAR). ───────
{
  const want = { Mercury:423.8, Venus:270.7, Earth:220.0, Mars:413.8, Jupiter:326.2, Saturn:405.0, Uranus:288.8, Neptune:283.2 };
  let ok = true; const got=[];
  for (const p of PLANETS) { const hz = planetHz(p.period); got.push(`${p.name.slice(0,3)} ${hz.toFixed(1)}`);
    if (Math.abs(hz - want[p.name]) > 0.05) ok = false; }
  check('chord voicing: each planet = 220·foldToOctave(period/Earth); Earth sits exactly on 220 Hz home',
        ok && planetHz(1.0) === 220, got.join(' · '));
}

console.log('\n— Single-source discipline (the proofs nothing is re-typed) —');

// ── 7. BYTE-TWIN PARITY: index.html OUT OF TUNE CORE === ../pitch-core.mjs. ───
{
  const BEGIN = '// ===== OUT OF TUNE CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== OUT OF TUNE CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity: index.html OUT OF TUNE CORE block is char-for-char ../pitch-core.mjs (between sentinels) — the page\'s runOutOfTuneSelfTest IS the module\'s',
        modSlice != null && pageSlice != null && modSlice === pageSlice,
        modSlice == null ? 'module sentinels MISSING' : pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 8. PRIOR COMMA CORE block byte-untouched: still === the-comma's inlined copy. ─
{
  const BEGIN = '// ===== COMMA CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== COMMA CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const commaPage = readFileSync(join(repoRoot, 'sound-garden', 'the-comma', 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const cSlice = sliceBetween(commaPage, BEGIN, END);
  check('COMMA CORE untouched: the pre-existing COMMA CORE block still === the-comma/index.html\'s inlined copy (the #76 append perturbed no byte above it)',
        modSlice != null && cSlice != null && modSlice === cSlice,
        modSlice == null ? 'module sentinels MISSING' : cSlice == null ? 'the-comma sentinels MISSING' :
          (modSlice === cSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs comma ${cSlice.length})`));
}

// ── 9. PRIOR PITCH CORE block byte-untouched: still === butterfly-voice's copy. ─
{
  const BEGIN = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== PITCH CORE END =====';
  const mod = readFileSync(join(__dir, '..', 'pitch-core.mjs'), 'utf8');
  const bvPage = readFileSync(join(repoRoot, 'butterfly-voice', 'index.html'), 'utf8');
  const modSlice = sliceBetween(mod, BEGIN, END);
  const bvSlice = sliceBetween(bvPage, BEGIN, END);
  check('PITCH CORE untouched: the pre-existing PITCH CORE block still === butterfly-voice/index.html\'s inlined copy',
        modSlice != null && bvSlice != null && modSlice === bvSlice,
        modSlice == null ? 'module sentinels MISSING' : bvSlice == null ? 'butterfly-voice sentinels MISSING' :
          (modSlice === bvSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs bv ${bvSlice.length})`));
}

// ── 10. ANTI-CIRCULARITY: the pitch law is DEFINED in exactly one file. ───────
// The function definitions for cents and foldToOctave must appear in exactly one
// place — sound-garden/pitch-core.mjs. The page holds them only inside the COMMA CORE
// byte-twin slice (which IS pitch-core's own text, proven identical in leg 8); the OUT
// OF TUNE CORE REUSES them (never re-defines). The search needles are BUILT from
// fragments here so this test file does NOT itself contain the literal definition
// string — otherwise the grep would (correctly) flag the test as a second mention.
{
  const FN = 'fun' + 'ction ';                       // built from parts → not a literal hit
  const CENTS_DEF = FN + 'cents(';                    // a real def: the keyword + ' cents('
  const FOLD_DEF  = FN + 'foldToOctave(';             // the keyword + ' foldToOctave('
  const skipDirs = new Set(['.git', 'node_modules', 'assets']);
  const centsHits = [], foldHits = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) { if (!skipDirs.has(ent.name)) walk(p); continue; }
      if (!/\.(mjs|js)$/.test(ent.name)) continue;  // only true code modules define the law
      let src; try { src = readFileSync(p, 'utf8'); } catch { continue; }
      const rel = p.slice(repoRoot.length + 1);
      if (src.includes(CENTS_DEF)) centsHits.push(rel);
      if (src.includes(FOLD_DEF)) foldHits.push(rel);
    }
  }
  walk(repoRoot);
  const ok = centsHits.length === 1 && centsHits[0] === 'sound-garden/pitch-core.mjs' &&
             foldHits.length === 1 && foldHits[0] === 'sound-garden/pitch-core.mjs';
  check('anti-circularity: the cents() and foldToOctave() definitions live in exactly ONE module — sound-garden/pitch-core.mjs (this leaf reuses them, never re-types the pitch law)',
        ok, `cents defs: [${centsHits.join(', ')}] · fold defs: [${foldHits.join(', ')}]`);
  // and the page does NOT re-define them outside the byte-twin slice (no extra def in HTML).
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const centsDefs = page.split(CENTS_DEF).length - 1;
  const foldDefs = page.split(FOLD_DEF).length - 1;
  check('page defines cents/foldToOctave exactly once each — only inside the COMMA CORE byte-twin slice (no second definition added by this leaf)',
        centsDefs === 1 && foldDefs === 1, `page: cents ${centsDefs}× · fold ${foldDefs}×`);
}

// ── 11. CORE A parity: the test's PLANETS IS ./data.mjs (not re-typed). ───────
// We import PLANETS from ./data.mjs (the same module the page imports). To prove this
// test did not silently re-type the array, re-read data.mjs as text and reconstruct the
// {name,a,period} triples, then assert they match the imported objects field-by-field.
{
  const dataSrc = readFileSync(join(__dir, 'data.mjs'), 'utf8');
  // pull every planet row from the PLANETS array literal in data.mjs.
  const m = dataSrc.match(/export const PLANETS\s*=\s*\[([\s\S]*?)\];/);
  let ok = m != null, info = 'PLANETS literal not found';
  if (m) {
    const rows = [...m[1].matchAll(/name:"([^"]+)",\s*a:([\d.]+),\s*period:([\d.]+)/g)]
      .map(r => ({ name: r[1], a: +r[2], period: +r[3] }));
    ok = rows.length === PLANETS.length && rows.every((r, i) =>
      r.name === PLANETS[i].name && r.a === PLANETS[i].a && r.period === PLANETS[i].period);
    info = ok ? `${rows.length} planets match data.mjs text byte-faithfully` : 'data.mjs text ≠ imported PLANETS';
  }
  check('CORE A parity: the imported PLANETS array IS ./data.mjs\'s text (this test did not re-type it; the page imports the SAME single copy)', ok, info);
}

console.log(`\n—— Out of Tune Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
