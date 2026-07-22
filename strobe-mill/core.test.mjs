// ============================================================================
//  THE STROBE MILL — Node twin of the in-page payoff-liveness self-test.
//  Run:  node strobe-mill/core.test.mjs
//
//  This is a DELIGHT piece — it makes no theorem and owes no proof. The twin
//  verifies the PAYOFF FIRES (the wheel freezes; the crawl reverses; the pip
//  ghosts) and the DISCIPLINE that the rate arithmetic is BORROWED from the Tone
//  Mill, never forked:
//    • the shared runStrobeSelfTest legs (identical to the in-page pill);
//    • BYTE-TWIN parity (STROBE-MILL CORE) — index.html's inlined slice ===
//      ./core.mjs's slice char-for-char, after forge's `export`-strip;
//    • BORROWED-NOT-FORKED — the apparentDriftHz/isFrozen/revPerSec/toothPassHz
//      this module stands on are the SAME function objects the Tone Mill exports
//      (imported, not re-typed), and the STROBE-MILL CORE slice re-types no Hz law;
//    • the page really inlines the Tone Mill's rate core (its twin brain);
//    • DEEPER re-derivations (freeze fires, crawl sign/size, ghost doubling, the
//      angular identity) over finer sweeps, plus a BITE check (a non-freeze rate
//      is NOT reported frozen — the test can go red).
//  process.exit(pass === total ? 0 : 1).
//
//  Depth note: the leaf is a top-level sibling room, so the repo root is .. and
//  the borrowed core lives at ../tone-mill/core.mjs.
// ============================================================================
import {
  runStrobeSelfTest, apparentSpinRadPerSec, apparentSpinRevPerSec, spokesFrozen,
  freezeStrobeRates, nearestFreezeRate, pipImageCount, foldToSpoke,
  // the borrowed Tone Mill primitives, passed through ./core.mjs:
  toothPassHz as toothPassHz_viaStrobe, revPerSec as revPerSec_viaStrobe,
  apparentDriftHz as apparentDriftHz_viaStrobe, isFrozen as isFrozen_viaStrobe,
} from './core.mjs';
// import the Tone Mill's exports DIRECTLY too, to prove identity (same reference).
import {
  toothPassHz, revPerSec, apparentDriftHz, isFrozen,
} from '../tone-mill/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const TWO_PI = Math.PI * 2;
let pass = 0, total = 0;
function check(name, cond, info){
  total++;
  if (cond){ pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0 || j <= i) return null;
  return text.slice(i + begin.length, j);
}
// forge strips a leading `export ` on each exported declaration when it inlines
// the module into the page; mirror that transform so the slices compare equal.
function stripExport(s){ return s.replace(/^(\s*)export\s+(?=(const|let|var|function|class|async)\b)/gm, '$1'); }

// ── 1. THE SHARED SELF-TEST (the payoff-liveness legs, identical to the pill). ──
console.log('\n— The in-page payoff-liveness self-test (the shared runStrobeSelfTest legs) —');
{
  const r = runStrobeSelfTest();
  for (const l of r.lines) check(l.name, l.ok, l.detail);
  check('self-test reports all green', r.pass === r.total, r.pass + '/' + r.total);
}

console.log('\n— The payoff re-derived, independently of runStrobeSelfTest —');

// ── 2. THE FREEZE FIRES over a FINE sweep: at f = M·revPerSec/m the apparent spin
//   is 0 to machine precision, for many M / Ω / m. (Finer than the pill's grid.)
{
  let worst = 0, allFrozen = true, n = 0;
  for (const M of [1,2,3,4,5,6,8,12]){
    for (let i = 1; i <= 30; i++){
      const omega = i * 0.31 * TWO_PI;
      for (const f of freezeStrobeRates(M, omega, 6)){
        worst = Math.max(worst, Math.abs(apparentSpinRadPerSec(M, omega, f)));
        if (!spokesFrozen(M, omega, f, 1e-9)) allFrozen = false;
        n++;
      }
    }
  }
  check('the freeze fires (fine sweep): apparent angular velocity === 0 at every f = M·revPerSec/m across 8 spoke-counts × 30 speeds × 6 orders',
        allFrozen && worst < 1e-9, `${n} freeze rates · worst |apparent spin| = ${worst.toExponential(2)} rad/s`);
}

// ── 3. THE CRAWL SIGN AND SIZE: in the freeze's neighbourhood (|detune| < spin/2,
//   where the flash still catches the pip once per rev), apparent === −(flash −
//   spin); detune UP ⇒ backward (<0), DOWN ⇒ forward (>0), for many Ω. Detunes are
//   taken as fractions of the spin so they stay inside that neighbourhood (outside
//   it the aliasing folds to a DIFFERENT branch — that is the illusion, not a bug).
{
  let signOk = true, worst = 0, n = 0;
  for (let i = 1; i <= 40; i++){
    const omega = i * 0.19 * TWO_PI, fFreeze = revPerSec(omega);
    for (const frac of [0.02, 0.10, 0.22, 0.30]){       // all < 1/3 → round(spin/flash)=1 both ways
      const d = frac * fFreeze;
      const up = apparentSpinRevPerSec(1, omega, fFreeze + d);
      const dn = apparentSpinRevPerSec(1, omega, fFreeze - d);
      if (!(up < 0 && dn > 0)) signOk = false;
      worst = Math.max(worst, Math.abs(up + d), Math.abs(dn - d));
      n++;
    }
  }
  check('the crawl reverses by the right amount: in the freeze neighbourhood apparent rev/s === −(flash − spin); UP ⇒ backward, DOWN ⇒ forward across 40 speeds × 4 detunes',
        signOk && worst < 1e-9, `${n} cases · UP<0 & DOWN>0 always · worst |apparent−(−Δ)| = ${worst.toExponential(2)} rev/s`);
}

// ── 4. THE PIP GHOST DOUBLING: at k× the spin the single pip has exactly k frozen
//   images, k = 1..6 (1× → 1 true freeze, 2× → the two-pip ghost, …).
{
  let ok = true; const seen = [];
  for (const rev of [1.5, 3.0, 6.5]){
    const omega = rev * TWO_PI, base = revPerSec(omega);
    const row = [];
    for (let k = 1; k <= 6; k++){ const c = pipImageCount(omega, k * base); row.push(c); if (c !== k) ok = false; }
    seen.push(row.join(''));
  }
  check('the pip ghost doubles: at k× the spin the rim pip shows exactly k frozen images for k = 1..6 (the reversed-wagon-wheel doubling)',
        ok, `image counts at 1×..6× = ${seen.join(', ')}`);
}

// ── 5. THE ANGULAR LAYER IS THE TONE MILL'S SIREN RATE, viewed with the eye:
//   apparentSpinRadPerSec(M,Ω,f) === apparentDriftHz(M,Ω,f)·2π/M exactly, AND the
//   folded live-lens delta agrees with apparentSpinRevPerSec (the eye's reading).
{
  let worstId = 0, worstFold = 0, n = 0;
  for (const M of [1,2,3,5,8]){
    for (let i = 1; i <= 24; i++){
      const omega = i * 0.27 * TWO_PI;
      for (const f of [5.3, 11.0, 17.5, 26.0, 38.0, 55.0]){
        worstId = Math.max(worstId, Math.abs(apparentSpinRadPerSec(M, omega, f) - apparentDriftHz(M, omega, f) * TWO_PI / M));
        // the LIVE lens folds the per-flash advance (revPerSec/f revs) to the nearest
        // spoke and multiplies by f — must equal apparentSpinRevPerSec.
        const perFlashRev = revPerSec(omega) / f;
        const eye = foldToSpoke(perFlashRev, M) * f;
        worstFold = Math.max(worstFold, Math.abs(eye - apparentSpinRevPerSec(M, omega, f)));
        n++;
      }
    }
  }
  check('borrowed, not forked: apparent spin === apparentDriftHz·2π/M AND the folded per-flash advance (the eye\'s own reading) === apparentSpinRevPerSec, across the sweep',
        worstId < 1e-9 && worstFold < 1e-9, `${n} points · max |Δ identity| = ${worstId.toExponential(2)} · max |Δ eye-vs-formula| = ${worstFold.toExponential(2)}`);
}

// ── 6. THE BITE: an OFF-freeze rate is NOT reported frozen, and snapping lands on a
//   real freeze — the test is not vacuously green.
{
  const omega = 5.0 * TWO_PI;
  const offRate = revPerSec(omega) * 1.17;            // deliberately between freezes
  const offFrozen = spokesFrozen(1, omega, offRate, 0.04);
  const snapped = nearestFreezeRate(1, omega, offRate);
  const snapFrozen = spokesFrozen(1, omega, snapped, 1e-9);
  const crawls = Math.abs(apparentSpinRevPerSec(1, omega, offRate)) > 0.1;
  check('the test bites: an off-freeze flash is NOT reported frozen (it crawls) while snap-to-freeze lands on a true freeze — the payoff check can go red',
        !offFrozen && crawls && snapFrozen, `off-rate frozen=${offFrozen} (crawls ${apparentSpinRevPerSec(1,omega,offRate).toFixed(2)} rev/s) · snapped ${snapped.toFixed(3)}Hz frozen=${snapFrozen}`);
}

console.log('\n— Borrowed-not-forked discipline (the Tone Mill\'s rate core, reused) —');

// ── 7. IDENTITY: the primitives this module stands on ARE the Tone Mill's exports
//   (same function objects), passed through ./core.mjs — not re-typed copies.
{
  const same = toothPassHz_viaStrobe === toothPassHz && revPerSec_viaStrobe === revPerSec
            && apparentDriftHz_viaStrobe === apparentDriftHz && isFrozen_viaStrobe === isFrozen;
  check('identity: toothPassHz/revPerSec/apparentDriftHz/isFrozen reached through ./core.mjs are the SAME objects the Tone Mill exports — the Hz authority is imported, not forked',
        same, `all four === ../tone-mill/core.mjs exports`);
}

// ── 8. BYTE-TWIN PARITY (STROBE-MILL CORE): index.html slice === ./core.mjs slice
//   (after the same `export `-strip forge applies on inline).
{
  const BEGIN = '// ===== STROBE-MILL CORE BEGIN =====';
  const END = '// ===== STROBE-MILL CORE END =====';
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const modSlice = stripExport(sliceBetween(mod, BEGIN, END) || '');
  const pageSlice = sliceBetween(page, BEGIN, END);
  check('byte-twin parity (STROBE-MILL CORE): index.html\'s inlined slice is char-for-char ./core.mjs (after forge\'s export-strip) — the page\'s pill runs the module\'s runStrobeSelfTest',
        modSlice && pageSlice != null && modSlice === pageSlice,
        pageSlice == null ? 'page sentinels MISSING' :
          (modSlice === pageSlice ? `slice ${modSlice.length} chars identical` : `DRIFT (mod ${modSlice.length} vs page ${pageSlice.length})`));
}

// ── 9. THE PAGE INLINES THE TONE MILL'S RATE CORE (its twin brain): index.html
//   carries the Tone Mill's TONE-MILL CORE slice, so the strobe arithmetic on the
//   page is byte-identical to the one the Tone Mill page runs.
{
  const page = readFileSync(join(__dir, 'index.html'), 'utf8');
  const toneCore = readFileSync(join(__dir, '..', 'tone-mill', 'core.mjs'), 'utf8');
  const BEGIN = '// ===== TONE-MILL CORE (inlined byte-twin) BEGIN =====';
  const END = '// ===== TONE-MILL CORE END =====';
  const pageTone = sliceBetween(page, BEGIN, END);
  const modTone = stripExport(sliceBetween(toneCore, BEGIN, END) || '');
  check('the page inlines the Tone Mill\'s rate core: index.html\'s TONE-MILL CORE slice === ../tone-mill/core.mjs\'s (after export-strip) — the visual twin runs the aural twin\'s brain',
        modTone && pageTone != null && modTone === pageTone,
        pageTone == null ? 'page has no TONE-MILL CORE slice' :
          (modTone === pageTone ? `slice ${pageTone.length} chars identical` : `DRIFT (tone-mill ${modTone.length} vs page ${pageTone.length})`));
}

// ── 10. THE STROBE-MILL SLICE RE-TYPES NO Hz LAW: it never re-writes the aliasing
//   residual by hand — it only DELEGATES to apparentDriftHz/isFrozen. (A tell: the
//   siren residual `Math.round(ratio)` / `fTooth` never appears in the slice.)
{
  const mod = readFileSync(join(__dir, 'core.mjs'), 'utf8');
  const slice = sliceBetween(mod, '// ===== STROBE-MILL CORE BEGIN =====', '// ===== STROBE-MILL CORE END =====') || '';
  const reTypesResidual = /fTooth|toothPassHz\s*\([^)]*\)\s*\/\s*strobe|ratio\s*-\s*Math\.round/.test(slice);
  const delegates = /apparentDriftHz\s*\(/.test(slice) && /isFrozen\s*\(/.test(slice);
  check('no re-typed Hz law: the STROBE-MILL CORE slice delegates to apparentDriftHz/isFrozen and re-writes no siren residual of its own',
        !reTypesResidual && delegates, `re-types residual: ${reTypesResidual} · delegates to core: ${delegates}`);
}

console.log(`\n—— The Strobe Mill Node twin: ${pass}/${total} ——\n`);
process.exit(pass === total ? 0 : 1);
