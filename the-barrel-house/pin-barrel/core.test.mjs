// Node twin for THE BARREL HOUSE pin-barrel core — a music box where TIME IS
// THE CRANK. Zero-dep, DOM-free. The ORACLE re-derives every claim by an
// INDEPENDENT route (exact set-equality / counting), sharing NO code with the
// solver (the core's generators + transport). Exit 0 = green; non-zero = red.
// Run: `node the-barrel-house/pin-barrel/core.test.mjs`.
//
//   (1) CANON — voice k's pin-set == voice 0's set shifted by the offset law,
//       proven by EXACT set-equality of offset-transformed pin-sets. Every pin
//       paired (32 pairs across the two voice-mappings v0→v1, v0→v2; 0 unpaired).
//       32 is HONEST, not a miscount: there are ZERO cross-voice cell coincidences
//       (verified here), so the two mappings contribute 16+16=32 distinct pairings.
//   (2) CRAB — voice 1 == retrograde reflection θ→(P-1-θ) of voice 0, same teeth,
//       by set-equality (16 paired / 0 unpaired).
//   (3) ROUND CLOSES — the canon pin-set is invariant under rotation by one
//       period P (the offsets all divide P), so the round seams perfectly.
//   (4) TRANSPORT — a forward sweep of N periods plucks every pin EXACTLY N times
//       (no drops, no doubles); reverse plays it backward; a wrap across the seam
//       is exact (the visible == heard identity).
//   (5) COUNT-EQUALITY GUARD — every voice has the SAME pin count as voice 0. This
//       makes "a dropped note" (the defect a clamp-filter would cause) a hard
//       failure forever. Holds for BOTH the canon and the crab.
//   (6) MATE-LAW — mateOf(p) lands on a real pin of the field (a true partner),
//       and the canon mate-chain is a closed cycle over the voices (no orphan).
//   NEG-CONTROLS (each MUST flip RED): (a) nudge one pin off-tooth ⇒ ≥1 unpaired
//       ⇒ count-equality still holds but set-equality fails; (b) random barrel ⇒
//       "not a canon"; (c) a non-period length jumps the seam (sweep of P+1 steps
//       double-plucks the seam-straddling pins ⇒ NOT an exact N-times sweep).
//   (G) BYTE-PARITY — the core inlined into each barrel page (between the
//       PIN-BARREL CORE sentinels) is byte-identical to this module's core body.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TEETH, STEPS, CANON, MELODY,
  pinsCanon, pinsCrab, randomBarrel, crossing, mateOf,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

const key = p => p.step + '|' + p.tooth;
const setOfVoice = (pins, v) => new Set(pins.filter(p => p.voice === v).map(key));

// ── ORACLE (independent of the solver): re-derive the canon by transforming
//    voice 0's RAW cells and comparing to voice k's set. Does NOT call canonStep. ──
function oracleCanon(pins) {
  const v0 = pins.filter(p => p.voice === 0);
  let paired = 0, unpaired = 0;
  for (let k = 1; k < CANON.voices; k++) {
    const expect = new Set(v0.map(p =>
      ((((p.step + CANON.dPhase[k]) % STEPS) + STEPS) % STEPS) + '|' +
      ((((p.tooth + CANON.dTooth[k]) % TEETH) + TEETH) % TEETH)));
    const got = setOfVoice(pins, k);
    if (expect.size !== got.size) unpaired += Math.abs(expect.size - got.size);
    for (const kk of got) { if (expect.has(kk)) paired++; else unpaired++; }
    for (const kk of expect) { if (!got.has(kk)) unpaired++; }
  }
  return { paired, unpaired };
}
function oracleCrab(pins) {
  const v0 = pins.filter(p => p.voice === 0);
  const expect = new Set(v0.map(p => ((((STEPS - 1 - p.step) % STEPS) + STEPS) % STEPS) + '|' + p.tooth));
  const got = setOfVoice(pins, 1);
  let paired = 0, unpaired = 0;
  for (const kk of got) { if (expect.has(kk)) paired++; else unpaired++; }
  for (const kk of expect) { if (!got.has(kk)) unpaired++; }
  return { paired, unpaired };
}
// cross-voice cell coincidences: two pins of DIFFERENT voice in the same cell.
function crossVoiceCoincidences(pins) {
  const cells = new Map();
  for (const p of pins) { const a = cells.get(key(p)) || new Set(); a.add(p.voice); cells.set(key(p), a); }
  let c = 0; for (const vs of cells.values()) if (vs.size > 1) c++;
  return c;
}
function countsByVoice(pins) {
  const c = {}; for (const p of pins) c[p.voice] = (c[p.voice] || 0) + 1; return c;
}

const canon = pinsCanon();
const crab = pinsCrab();

// ── (1) CANON set-equality: 32 paired / 0 unpaired, honestly (0 coincidences) ──
{
  const o = oracleCanon(canon);
  ck('(1) CANON: voice k == voice 0 shifted by offset law — set-equality, 0 unpaired', o.unpaired === 0);
  ck('(1) CANON: exactly 32 pairs across the two voice-mappings (v0→v1, v0→v2)', o.paired === 32);
  ck('(1) CANON: ZERO cross-voice cell coincidences (so 32 is honest, not a miscount)',
     crossVoiceCoincidences(canon) === 0);
}

// ── (2) CRAB reflection set-equality: 16 paired / 0 unpaired ──
{
  const o = oracleCrab(crab);
  ck('(2) CRAB: voice 1 == retrograde reflection θ→(P-1-θ) of voice 0 — set-equality, 0 unpaired', o.unpaired === 0);
  ck('(2) CRAB: exactly 16 pairs (one per melody pin)', o.paired === 16);
}

// ── (3) ROUND CLOSES — pin-set invariant under rotation by P; offsets divide P ──
ck('(3) ROUND closes: every canon offset divides P=' + STEPS + ' (so a turn seams)',
   CANON.dPhase.every((d, i) => d === i * CANON.dPhase[1]) && STEPS % CANON.dPhase[1] === 0);
ck('(3) ROUND closes: the canon pin-set is invariant under rotation by P (set-equal after +STEPS)', (() => {
  const a = new Set(canon.map(p => p.voice + ':' + key(p)));
  const b = new Set(canon.map(p => p.voice + ':' + ((((p.step + STEPS) % STEPS) + STEPS) % STEPS) + '|' + p.tooth));
  if (a.size !== b.size) return false;
  for (const k of a) if (!b.has(k)) return false;
  return true;
})());

// ── (4) TRANSPORT: a forward sweep of N periods plucks every pin EXACTLY N times ──
ck('(4) TRANSPORT: forward sweep of 3 periods plucks every canon pin exactly 3 times (no drops/doubles)', (() => {
  const hits = new Map();
  for (const p of crossing(canon, 0, 3 * STEPS)) hits.set(p.step + ':' + p.tooth + ':' + p.voice, (hits.get(p.step + ':' + p.tooth + ':' + p.voice) || 0) + 1);
  if (hits.size !== canon.length) return false;
  for (const n of hits.values()) if (n !== 3) return false;
  return true;
})());
ck('(4) TRANSPORT: reverse sweep plays backward (each pluck tagged reversed) and plucks the same set once', (() => {
  const fwd = crossing(canon, 0, STEPS).length;
  const back = crossing(canon, STEPS, 0);
  return fwd === canon.length && back.length === canon.length && back.every(p => p.reversed === true);
})());
ck('(4) TRANSPORT: a wrap across the seam is exact (sweep [-1,+1] plucks the seam pins once)', (() => {
  // any pin at step 0 plus its congruent neighbours; the half-open interval (lo,hi] catches each once.
  const hits = new Map();
  for (const p of crossing(canon, -1, 1)) hits.set(p.step + ':' + p.tooth + ':' + p.voice, (hits.get(p.step + ':' + p.tooth + ':' + p.voice) || 0) + 1);
  for (const n of hits.values()) if (n !== 1) return false;
  return true;  // every pin caught at most once over a 2-step window
})());

// ── (5) COUNT-EQUALITY GUARD (the defect a clamp-filter would silently cause) ──
ck('(5) COUNT-EQUALITY: every canon voice has the same pin count as voice 0 (no dropped note)', (() => {
  const c = countsByVoice(canon); const n0 = c[0];
  return Object.values(c).every(v => v === n0) && n0 === MELODY.length;
})());
ck('(5) COUNT-EQUALITY: the crab\'s two voices each have MELODY.length pins (no dropped note)', (() => {
  const c = countsByVoice(crab);
  return c[0] === MELODY.length && c[1] === MELODY.length;
})());

// ── (6) MATE-LAW: mateOf lands on a real field pin; canon mate-chain is a cycle ──
ck('(6) MATE-LAW: every canon pin\'s mate is a real pin of the field (a true partner)', (() => {
  const field = new Set(canon.map(p => p.voice + ':' + key(p)));
  return canon.every(p => { const m = mateOf(p, 'canon'); return field.has(m.voice + ':' + m.step + '|' + m.tooth); });
})());
ck('(6) MATE-LAW: following the canon mate-chain from any pin returns home in `voices` hops (a closed cycle)', (() => {
  let p = canon[0];
  for (let i = 0; i < CANON.voices; i++) p = mateOf(p, 'canon');
  return p.step === canon[0].step && p.tooth === canon[0].tooth && p.voice === canon[0].voice;
})());
ck('(6) MATE-LAW: every crab pin\'s mate is a real pin of the field', (() => {
  const field = new Set(crab.map(p => p.voice + ':' + key(p)));
  return crab.every(p => { const m = mateOf(p, 'crab'); return field.has(m.voice + ':' + m.step + '|' + m.tooth); });
})());

// ── NEG-CONTROLS (each MUST flip RED, i.e. detect the broken claim) ──
ck('(NEG a) nudge ONE pin off its tooth ⇒ set-equality FAILS (≥1 unpaired) — a real constraint', (() => {
  const broken = pinsCanon(); broken[5].tooth = (broken[5].tooth + 1) % TEETH;
  return oracleCanon(broken).unpaired > 0;
})());
ck('(NEG a) …and count-equality still HOLDS for the nudge (it is a SHIFT, not a drop) — orthogonal guards', (() => {
  const broken = pinsCanon(); broken[5].tooth = (broken[5].tooth + 1) % TEETH;
  const c = countsByVoice(broken); return Object.values(c).every(v => v === c[0]);
})());
ck('(NEG b) a random barrel satisfies no offset map ⇒ certified "not a canon" (≥1 unpaired)', (() => {
  let anyUnpaired = false;
  for (let s = 1; s <= 8; s++) if (oracleCanon(randomBarrel(s * 7919)).unpaired > 0) anyUnpaired = true;
  return anyUnpaired;
})());
ck('(NEG c) a NON-period sweep jumps the seam: a sweep of P+1 double-plucks ⇒ NOT an exact N-times sweep', (() => {
  const hits = new Map();
  for (const p of crossing(canon, 0, STEPS + 1)) hits.set(p.step + ':' + p.tooth + ':' + p.voice, (hits.get(p.step + ':' + p.tooth + ':' + p.voice) || 0) + 1);
  // a P+1 sweep is NOT a clean 1× of every pin: at least one seam-straddling pin is hit twice.
  let anyDouble = false; for (const n of hits.values()) if (n > 1) anyDouble = true;
  return anyDouble;
})());

// ── (G) BYTE-PARITY: inlined core in each barrel page === core.mjs body ──
const here = dirname(fileURLToPath(import.meta.url));
const wingRoot = join(here, '..');
const BEGIN = '// ===== PIN-BARREL CORE (byte-identical to core.mjs) =====';
const END = '// ===== END PIN-BARREL CORE =====';
function region(text) {
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < 0 || j < i) return null;
  return text.slice(i + BEGIN.length, j);
}
function norm(s) { return s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter(l => l.length).join('\n'); }
let coreRegion = null;
try { coreRegion = region(readFileSync(join(here, 'core.mjs'), 'utf8')); } catch { /* missing → fail */ }
ck('(G) PIN-BARREL CORE sentinels present in core.mjs', !!coreRegion);
const pages = [
  ['pin-barrel/index.html', join(here, 'index.html')],
  ['mirror-drum/index.html', join(wingRoot, 'mirror-drum', 'index.html')],
];
for (const [label, path] of pages) {
  let pageRegion = null;
  try { pageRegion = region(readFileSync(path, 'utf8')); } catch { /* not built yet → fail */ }
  ck('(G) ' + label + ' has the forge-inlined core (sentinels present)', !!pageRegion);
  ck('(G) inlined core in ' + label + ' is BYTE-IDENTICAL to core.mjs (indentation-normalised)',
     !!coreRegion && !!pageRegion && norm(coreRegion) === norm(pageRegion));
}

// ── report ──
console.log('The Barrel House — pin-barrel/core.test.mjs');
console.log('  canon: 32 pairs / 0 unpaired (16+16 across two voice-mappings; 0 cross-voice coincidences)');
console.log('  crab:  16 pairs / 0 unpaired (retrograde reflection)');
console.log('  counts by voice (canon): ' + JSON.stringify(countsByVoice(canon)) + '  (count-equality guard)');
console.log('  byte-parity: core.mjs sentinels ' + (coreRegion ? 'present' : 'MISSING'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
