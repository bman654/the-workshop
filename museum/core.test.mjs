/* ═══════════════════════════════════════════════════════════════════════════
   THE MUSEUM · The Centennial Jubilee — core.test.mjs  (the Node twin)

   Imports core.mjs and asserts the FULL data-fidelity battery GREEN against the
   REAL committed carrier (./cycles.json). The in-page pill computes the identical
   results from the same bytes inlined at forge time, so this twin is the off-line
   proof that the River's claim is true of the actual git record.

   Run:  node museum/core.test.mjs
   Exits 0 (GREEN) on full pass; non-zero on any failure.

   The four required claims (DESIGN §SELF-TEST):
     (a) MONOTONIC — every event.epoch ≥ prior; seq contiguous 1…450.
     (b) COUNT & SPAN match committed git facts — count===450, first/last===CLAIM,
         elapsedSec===last−first===806616, days===10.
     (c) DERIVED AGGREGATES recompute exactly — longestGap===210888, busiestDay
         ===Jun-13/118, meanGap matches.
     (d) TAMPER — selfTest(tamper(raw)) FAILS → the pill flips RED.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  selfTest, tamper, verdict, CLAIM, parseCycles,
  recomputeAggregates, longestGap, busiestDay, formatSpan, perDay
} from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARRIER = join(__dirname, 'cycles.json');
const raw = readFileSync(CARRIER, 'utf8');

let failures = 0;
const line = (s) => process.stdout.write(s + '\n');
const assert = (cond, label) => { line('  ' + (cond ? '✓' : '✗') + ' ' + label); if (!cond) failures++; };

line('THE MUSEUM · core twin — real carrier ' + CARRIER);

/* ── 1. the positive battery on the REAL carrier, pinned to the verified CLAIM ── */
const { checks } = selfTest(raw, CLAIM);
for (const c of checks) {
  line('  ' + (c.pass ? '✓' : '✗') + ' ' + c.label + (c.detail ? '  [' + c.detail + ']' : ''));
  if (!c.pass) failures++;
}
const v = verdict(checks);
line('  → ' + v.passN + '/' + v.total + (v.allPass ? ' GREEN' : ' RED'));
if (!v.allPass) failures++;

/* ── 2. the four REQUIRED claims, asserted explicitly against git ────────────── */
line('\n— the four required claims —');
const parsed = parseCycles(raw);
const ev = parsed.events;
const agg = recomputeAggregates(ev);

// (a) MONOTONIC
let mono = true, contig = true;
for (let i = 0; i < ev.length; i++) {
  if (i > 0 && ev[i].epoch < ev[i - 1].epoch) mono = false;
  if (ev[i].seq !== i + 1) contig = false;
}
assert(mono, '(a) every epoch ≥ prior (monotonic chronological)');
assert(contig && ev.length === CLAIM.count, '(a) seq contiguous 1…' + CLAIM.count);

// (b) COUNT & SPAN
assert(agg.count === CLAIM.count, '(b) count === ' + CLAIM.count);
assert(agg.firstEpoch === CLAIM.firstEpoch, '(b) firstEpoch === ' + CLAIM.firstEpoch);
assert(agg.lastEpoch === CLAIM.lastEpoch, '(b) lastEpoch === ' + CLAIM.lastEpoch);
assert(agg.elapsedSec === CLAIM.lastEpoch - CLAIM.firstEpoch && agg.elapsedSec === CLAIM.elapsedSec,
  '(b) elapsed === last−first === ' + CLAIM.elapsedSec + 's (' + formatSpan(CLAIM.elapsedSec) + ')');
assert(agg.days === CLAIM.days, '(b) distinct local days === ' + CLAIM.days);

// (c) DERIVED AGGREGATES
const gap = longestGap(ev);
const busy = busiestDay(ev);
assert(gap.sec === CLAIM.longestGapSec,
  '(c) longestGap === ' + CLAIM.longestGapSec + 's (' + formatSpan(CLAIM.longestGapSec) +
  ', seq ' + gap.fromSeq + '↔' + gap.toSeq + ')');
assert(busy.day === CLAIM.busiestDay && busy.count === CLAIM.busiestCount,
  '(c) busiestDay === ' + CLAIM.busiestDay + ' / ' + CLAIM.busiestCount + ' commits');
assert(Math.abs(agg.meanGapSec - CLAIM.elapsedSec / (CLAIM.count - 1)) < 1e-6,
  '(c) meanGap === elapsed/(N−1) === ' + Math.round(agg.meanGapSec) + 's');

// a sanity check on the gap endpoints vs the silent night (Jun 8 → Jun 11, Jun-9 empty)
const gapDays = perDay(ev).map(d => d.day);
assert(gapDays.indexOf('2026-06-09') < 0, '(c) Jun-9 is a ZERO-commit day (swallowed by the gap)');

/* ── 3. the CLAIM matches the live recompute (catches a carrier that changed shape) ── */
const claimMatch = agg.count === CLAIM.count && agg.firstEpoch === CLAIM.firstEpoch &&
  agg.lastEpoch === CLAIM.lastEpoch && agg.elapsedSec === CLAIM.elapsedSec && agg.days === CLAIM.days &&
  gap.sec === CLAIM.longestGapSec && busy.day === CLAIM.busiestDay && busy.count === CLAIM.busiestCount;
line('\n— shape guard —');
assert(claimMatch, 'CLAIM matches live recompute (no shape drift)');
assert(parsed.bad === 0, 'carrier has 0 malformed records');

/* ── 4. the NEGATIVE CONTROL — a tampered carrier MUST fail the battery ───────── */
line('\n— negative control (d) —');
const tampered = tamper(raw);
const tv = verdict(selfTest(tampered, CLAIM).checks);
const negOK = !tv.allPass;                       // the forged timestamp must be caught
assert(negOK, '(d) tampered carrier FAILS the battery [' + tv.passN + '/' + tv.total +
  (negOK ? ' — caught' : ' — NOT caught!') + ']');
// and specifically: the swapped pair breaks the monotonic leg
const tEv = parseCycles(tampered).events;
let tMono = true;
for (let i = 1; i < tEv.length; i++) if (tEv[i].epoch < tEv[i - 1].epoch) tMono = false;
assert(!tMono, '(d) tamper breaks epoch monotonicity (the forged timestamp is out of order)');

/* ── verdict ─────────────────────────────────────────────────────────────────── */
if (failures === 0) {
  line('\nALL GREEN — 450 commit-stones round-trip byte-true to the git record.');
  process.exit(0);
} else {
  line('\nRED — ' + failures + ' failure(s).');
  process.exit(1);
}
