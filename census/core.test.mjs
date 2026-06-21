/* core.test.mjs — the Node twin of THE CENSUS OF HANDS. Runs the SAME battery the
   page runs, against the REAL committed ledger/ledger.jsonl. No framework: throws
   on first failure, prints a PASS line per leg, exits non-zero on any red.
   Run:  node census/core.test.mjs            (default ledger, resolved below)
         node census/core.test.mjs <path>     (explicit ledger path) */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  selfTest, verdict, buildCensus, normalizeRole, headOf, tamper,
  canonicalLine, BUCKETS, CLAIM
} from './core.mjs';

// The default ledger is ../ledger/ledger.jsonl, resolved relative to THIS module —
// so the twin runs GREEN from any cwd (e.g. `node census/core.test.mjs` at repo root).
const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = process.argv[2] || resolve(HERE, '../ledger/ledger.jsonl');
const raw = readFileSync(LEDGER, 'utf8');

let fails = 0;
const ok = (label, pass, detail = '') => {
  console.log((pass ? '  PASS  ' : '  FAIL  ') + label + (detail ? '  — ' + detail : ''));
  if (!pass) fails++;
};

console.log('— census battery (real ledger) —');
const { checks, census, N } = selfTest(raw, CLAIM);
for (const c of checks) ok(c.label, c.pass, c.detail);
const v = verdict(checks);
ok('VERDICT all legs green', v.allPass, v.passN + '/' + v.total);

console.log('\n— normalization rule unit checks —');
ok("'builder (planter)' → builder", normalizeRole('builder (planter)') === 'builder');
ok("'planter (builder)' → planter", normalizeRole('planter (builder)') === 'planter');
ok("'builder · bug-fixer' → builder", normalizeRole('builder · bug-fixer') === 'builder');
ok("'grounds-worker (builder)' → grounds-worker", normalizeRole('grounds-worker (builder)') === 'grounds-worker');
ok("'groundskeeper' → groundskeeper", normalizeRole('groundskeeper') === 'groundskeeper');
ok("'groundskeeper (director)' → groundskeeper", normalizeRole('groundskeeper (director)') === 'groundskeeper');
ok("'Explorer' (case) → explorer", normalizeRole('Explorer') === 'explorer');
ok("'explorer:facet:framing' → explorer", normalizeRole('explorer:facet:framing') === 'explorer');
ok("'scout:fresh-mediums' → explorer", normalizeRole('scout:fresh-mediums') === 'explorer');
ok("'cycle-fixer' → bug-fixer", normalizeRole('cycle-fixer') === 'bug-fixer');
ok("'the planter' → planter", normalizeRole('the planter') === 'planter');
ok("'judge of cycle #1' → judge", normalizeRole('judge of cycle #1') === 'judge');
ok("'director (gardener)' → director", normalizeRole('director (gardener)') === 'director');
ok("unmappable 'gremlin' → other", normalizeRole('gremlin') === 'other');
ok("headOf trims+folds 'explorer A — x' → 'explorer a'", headOf('explorer A — x') === 'explorer a');

console.log('\n— strict byte-true round-trip (canonical line === source line) —');
// the STRICTEST form: the canonical re-emit equals the exact source line, byte for byte.
const sourceLines = raw.split('\n').filter((l) => l.trim() !== '');
let strict = true, strictSeq = null;
for (let i = 0; i < census.tokens.length; i++) {
  const m = JSON.parse(sourceLines[i]);
  if (canonicalLine(m) !== sourceLines[i]) { strict = false; strictSeq = m.seq; break; }
}
ok('canonical re-emit === source line for all ' + N + ' marks', strict,
  strict ? '' : 'first drift at seq ' + strictSeq);

console.log('\n— NEGATIVE CONTROL: tamper must bite RED —');
// The brief: "drop or duplicate one mark and the partition sum ≠ N AND seq-contiguity
// bites RED." The load-bearing legs: Σ-buckets vs PINNED total (≠ 653) and seq 1…653.
for (const mode of ['drop', 'dup']) {
  const t = selfTest(tamper(raw, mode), CLAIM);
  const partitionPinned = t.checks.find((c) => c.label.startsWith('Σ bucket counts === pinned'));
  const contig = t.checks.find((c) => c.label.startsWith('seq contiguous'));
  ok('tamper(' + mode + ') breaks partition-sum-vs-N leg', !partitionPinned.pass, partitionPinned.detail);
  ok('tamper(' + mode + ') breaks seq-contiguity leg', !contig.pass, contig.detail);
  ok('tamper(' + mode + ') VERDICT is RED overall', !verdict(t.checks).allPass,
    verdict(t.checks).passN + '/' + t.checks.length);
}

console.log('\n— partition closes on the real ledger —');
let sum = 0; for (const b of BUCKETS) sum += census.byRole.get(b);
ok('Σ buckets === N === ' + N, sum === N, sum + '');

console.log('\n' + (fails === 0 ? 'ALL GREEN' : fails + ' RED') );
process.exit(fails === 0 ? 0 : 1);
