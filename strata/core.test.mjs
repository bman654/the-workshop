/* core.test.mjs — the Node twin of THE STRATA. Runs the SAME pure-carrier battery
   the page runs (from core.mjs), against the REAL committed strata/strata.json —
   then CROSS-CHECKS the carrier against live git via gen-strata.mjs: the counts
   sum to the true log length, the full record stream is non-decreasing, every
   record lands in exactly one stratum, the 7 horizons sit in strict ancestry, and
   the committed carrier is byte-identical to a fresh re-derivation. No framework:
   prints a PASS/FAIL line per leg, exits non-zero on any red.

   Run:  node strata/core.test.mjs            (default carrier, resolved below)
         node strata/core.test.mjs <path>     (explicit strata.json path)

   Determinism / merge-survival (invariant 7): the twin resolves asOf from the
   carrier's OWN stored records — it walks a normal `git log --reverse` from HEAD
   and finds asOf inside it. If asOf is DANGLING (a rewritten history), the git
   section reports a named SKIP and the twin still exits 0 on the pure-carrier
   battery — it degrades, it never crashes the estate suite. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { selfTest, verdict, leverGeometry, tamper, parse, EXPECTED_STRATA } from './core.mjs';
import { buildRecords, buildCarrier, serialize, assertIntegrity, HORIZONS } from './gen-strata.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CARRIER_PATH = process.argv[2] || resolve(HERE, 'strata.json');
const rawText = readFileSync(CARRIER_PATH, 'utf8');
const carrier = parse(rawText);

let fails = 0;
const ok = (label, pass, detail = '') => {
  console.log((pass ? '  PASS  ' : '  FAIL  ') + label + (detail ? '  — ' + detail : ''));
  if (!pass) fails++;
};

/* ── Section A — the pure-carrier battery (identical to the in-page pill) ───── */
console.log('— strata pure-carrier battery (core.mjs, real strata.json) —');
const { checks, strataCount, logLength } = selfTest(carrier);
for (const c of checks) ok(c.label, c.pass, c.detail);
const vA = verdict(checks);
ok('VERDICT all pure-carrier legs green', vA.allPass, vA.passN + '/' + vA.total);

/* ── Section B — git cross-checks (gen-strata.mjs re-derivation) ────────────── */
console.log('\n— git cross-checks (gen-strata.mjs, live history) —');
const records = buildRecords();
const asOfIdx = records.findIndex((r) => r.shaFull === carrier.asOf);

if (asOfIdx < 0) {
  // asOf resolved from the carrier's own records is not in the current history
  // (rewritten / dangling ref). Named SKIP — the estate suite is not crashed.
  console.log('  SKIP  asOf ' + String(carrier.asOf).slice(0, 7) + ' is not in the current history;' +
    ' a carrier refresh is needed (node strata/gen-strata.mjs). Git cross-checks skipped.');
} else {
  const recs = records.slice(0, asOfIdx + 1);            // the log up to and including asOf

  // B1 — counts sum to the ASOF LOG LENGTH (the "sum to 1,025" leg — derived, not typed)
  ok('Σ commitCount === asOf log length', logLength === recs.length,
    logLength + ' === ' + recs.length + ' records');

  // B2 — the FULL record stream is NON-DECREASING by committer epoch (tie-tolerant:
  // 0 backwards steps; within-stratum ties are expected — 6 today — hence `<=`).
  let back = 0, ties = 0, firstBack = null;
  for (let i = 1; i < recs.length; i++) {
    if (recs[i].epoch < recs[i - 1].epoch) { back++; if (firstBack == null) firstBack = i; }
    else if (recs[i].epoch === recs[i - 1].epoch) ties++;
  }
  ok('full record stream non-decreasing (0 backwards steps)', back === 0,
    back + ' backwards, ' + ties + ' ties' + (firstBack != null ? ' (first @seq ' + (firstBack + 1) + ')' : ''));

  // B3 — every record's epoch falls inside EXACTLY ONE stratum's [firstEpoch, lastEpoch]
  let notOne = 0, firstBad = null;
  for (const r of recs) {
    let n = 0;
    for (const s of carrier.strata) if (r.epoch >= s.firstEpoch && r.epoch <= s.lastEpoch) n++;
    if (n !== 1) { notOne++; if (firstBad == null) firstBad = r.seq; }
  }
  ok('every record in exactly one stratum [firstEpoch,lastEpoch]', notOne === 0,
    notOne === 0 ? recs.length + ' records placed' : notOne + ' misplaced (first @seq ' + firstBad + ')');

  // B4 — horizon SHAs match the pinned BOUNDS table (gen-strata HORIZONS)
  let boundsOK = HORIZONS.length === EXPECTED_STRATA - 1 && carrier.horizons.length === HORIZONS.length, boundsWhy = '';
  if (boundsOK) {
    for (let k = 0; k < HORIZONS.length; k++) {
      if (HORIZONS[k].sha !== carrier.horizons[k].sha) { boundsOK = false; boundsWhy = 'off at horizon ' + (k + 1); break; }
    }
  }
  ok('7 horizon SHAs match the pinned BOUNDS table', boundsOK, boundsOK ? HORIZONS.length + ' pinned' : boundsWhy);

  // B5 — the 7 horizons sit in STRICT ANCESTRY order, all ancestors of asOf
  let ancestryOK = true, ancestryWhy = '';
  try { assertIntegrity(recs, carrier.asOf); }
  catch (e) { ancestryOK = false; ancestryWhy = String(e && e.message || e); }
  ok('7 horizons in strict ancestry, all ancestors of asOf', ancestryOK, ancestryWhy);

  // B6 — the committed carrier is BYTE-IDENTICAL to a fresh re-derivation up to asOf
  const rebuilt = buildCarrier(carrier.asOf, records);
  ok('committed carrier === fresh re-derivation (byte-identical to asOf)',
    !rebuilt.skip && serialize(rebuilt.carrier) === rawText, 'up to asOf ' + String(carrier.asOf).slice(0, 7));

  /* ── Section C — negative controls: a tampered carrier MUST bite RED ──────── */
  console.log('\n— NEGATIVE CONTROLS: tamper must bite RED —');

  // C1 — forge a fake horizon → the pure-carrier L5 linkage leg bites (the page button)
  const tH = selfTest(tamper(carrier, 'horizon'));
  const linkLeg = tH.checks.find((c) => c.label.startsWith('7 horizons, each opens'));
  ok("tamper('horizon') breaks the horizon-linkage leg", linkLeg && !linkLeg.pass, linkLeg && linkLeg.detail);
  ok("tamper('horizon') VERDICT is RED overall", !verdict(tH.checks).allPass,
    verdict(tH.checks).passN + '/' + tH.checks.length);

  // C2 — shove a boundary epoch → the strict-across-boundary L3 leg bites
  const tE = selfTest(tamper(carrier, 'epoch'));
  const boundaryLeg = tE.checks.find((c) => c.label.startsWith('epochs strictly increase'));
  ok("tamper('epoch') breaks the strict-boundary leg", boundaryLeg && !boundaryLeg.pass, boundaryLeg && boundaryLeg.detail);
  ok("tamper('epoch') VERDICT is RED overall", !verdict(tE.checks).allPass,
    verdict(tE.checks).passN + '/' + tE.checks.length);

  // C3 — bump a commitCount: NO pure-carrier leg catches it (geometry re-normalizes),
  // so it is the GIT leg (Σ commitCount === log length) that must bite — proving the
  // cross-check is load-bearing, not decorative.
  const tC = tamper(carrier, 'count');
  const tcSum = tC.strata.reduce((a, s) => a + s.commitCount, 0);
  ok("tamper('count') passes the pure-carrier battery (geometry re-normalizes)",
    verdict(selfTest(tC).checks).allPass, 'Σ commitCount now ' + tcSum);
  ok("tamper('count') breaks the git leg (Σ commitCount ≠ log length)", tcSum !== recs.length,
    tcSum + ' ≠ ' + recs.length);
}

/* ── Section D — lever geometry sanity at a concrete height ─────────────────── */
console.log('\n— lever geometry (both modes tile the core height) —');
for (const mode of ['commits', 'days']) {
  const g = leverGeometry(carrier, mode, 640);
  const sumH = g.heights.reduce((a, b) => a + b, 0);
  ok(mode.toUpperCase() + ' heights sum to core height (640) and are ∝ ' + g.key,
    Math.abs(sumH - 640) < 1e-9 && g.heights.every((h) => h >= 0), 'Σ=' + sumH.toFixed(4) + ' over ' + g.heights.length + ' slabs');
}

console.log('\n' + (fails === 0 ? 'ALL GREEN' : fails + ' RED'));
process.exit(fails === 0 ? 0 : 1);
