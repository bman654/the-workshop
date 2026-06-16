/* ═══════════════════════════════════════════════════════════════════════════
   THE TABULARIUM — core.test.mjs  (the Node twin)

   Imports core.mjs and asserts the FULL data-fidelity battery GREEN against the
   REAL ledger file (../ledger/ledger.jsonl). The in-page pill computes the
   identical results from the same bytes inlined at forge time, so this twin is
   the off-line proof that the room's claim is true of the actual record.

   Run:  node tabularium/core.test.mjs
   Exits 0 (GREEN) on full pass; non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { selfTest, tamper, verdict, CLAIM, parseLedger } from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = join(__dirname, '..', 'ledger', 'ledger.jsonl');
const raw = readFileSync(LEDGER_PATH, 'utf8');

let failures = 0;
const line = (s) => process.stdout.write(s + '\n');

/* ── 1. the positive battery on the REAL ledger, pinned to the verified CLAIM ── */
line('THE TABULARIUM · core twin — real ledger ' + LEDGER_PATH);
const { checks } = selfTest(raw, CLAIM);
for (const c of checks) {
  line('  ' + (c.pass ? '✓' : '✗') + ' ' + c.label + (c.detail ? '  [' + c.detail + ']' : ''));
  if (!c.pass) failures++;
}
const v = verdict(checks);
line('  → ' + v.passN + '/' + v.total + (v.allPass ? ' GREEN' : ' RED'));
if (!v.allPass) failures++;

/* ── 2. the CLAIM matches the live recompute (catches a file that changed shape) ── */
const parsed = parseLedger(raw);
const agg = selfTest(raw).agg;
const claimMatch = agg.marks === CLAIM.marks && agg.makers === CLAIM.makers &&
  agg.cycles === CLAIM.cycles && agg.minCyc === CLAIM.minCyc && agg.maxCyc === CLAIM.maxCyc;
line((claimMatch ? '  ✓' : '  ✗') + ' CLAIM matches live recompute  [' +
  agg.marks + '/' + agg.makers + '/' + agg.cycles + '/' + agg.minCyc + '→' + agg.maxCyc + ']');
if (!claimMatch) failures++;
if (parsed.bad !== 0) { line('  ✗ ' + parsed.bad + ' malformed line(s)'); failures++; }

/* ── 3. the NEGATIVE CONTROL — a tampered carrier MUST fail the battery ───────── */
const tampered = tamper(raw);
const tv = verdict(selfTest(tampered, CLAIM).checks);
const negOK = !tv.allPass;                       // the forged mark must be caught
line((negOK ? '  ✓' : '  ✗') + ' negative control: tampered carrier FAILS  [' +
  tv.passN + '/' + tv.total + (negOK ? ' — caught' : ' — NOT caught!') + ']');
if (!negOK) failures++;

/* ── verdict ─────────────────────────────────────────────────────────────────── */
if (failures === 0) {
  line('\nALL GREEN — the legend round-trips byte-true to the record.');
  process.exit(0);
} else {
  line('\nRED — ' + failures + ' failure(s).');
  process.exit(1);
}
