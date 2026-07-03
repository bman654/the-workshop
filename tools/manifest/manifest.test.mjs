#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   manifest.test.mjs — Node self-test for the estate manifest gate (DESIGN §6.2 /
   §6.3 / §9.4, W2.1b). Run:  node tools/manifest/manifest.test.mjs

   Proves the --check gate's four laws over the REAL repo AND their neg-controls:

     (1) COMPLETENESS — build() over the live repo yields `unclaimed: []`; --check
         passes (exit 0). NEG-CONTROL: a planted unclaimed dir makes --check FAIL
         LOUD — both in-process (evaluate → ok:false, names the dir) and through the
         real CLI (`--check --plant=…` exits non-zero). This is the §6.2 acceptance.
     (2) DOUBLE-CLAIM LAW — the live repo has none; a synthetic double-claim makes
         evaluate FAIL.
     (3) COUNT FLOORS — the live counts clear rooms≥60 / pieces≥PIECES_FLOOR; a
         manifest one short of a floor FAILS.
     (4) STALENESS — a committed manifest that re-derives byte-identical passes;
         a changed non-generatedAt field FAILS; a manifest differing ONLY in
         `generatedAt` PASSES (the load-bearing exclusion — else permanent false-red).

   No deps beyond the sibling module + Node. Prints "manifest self-test: N/N PASS";
   exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { build, evaluate, normalizeForCompare, talliesJson, ROOMS_FLOOR, PIECES_FLOOR } from './manifest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dirname, 'manifest.mjs');
const OUT = join(__dirname, 'estate-manifest.json');
const PLANT = '__manifest_negctl_orphan__';   // a dir name that provably is not on disk

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + label); }
}
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

/* ── the live build (shared) ─────────────────────────────────────────────────── */
const live = build();
const committedJson = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
// the depth-tally projection (§6.3 consumer 2) is checked alongside the manifest; every
// evaluate() below feeds a FRESH tallies string (the mutations under test never touch
// districts[], so a fresh projection is the right "committed" baseline for them).
const committedTallies = talliesJson(live.manifest);

/* ── (1) completeness over the real repo ─────────────────────────────────────── */
ok(live.unclaimed.length === 0, 'live repo: unclaimed is [] (got ' + live.unclaimed.length + ': ' + live.unclaimed.join(', ') + ')');
ok(live.doubleClaimed.length === 0, 'live repo: no double-claim (got ' + live.doubleClaimed.length + ')');
{ const { ok: gok, failures } = evaluate(live, committedJson, committedTallies);
  ok(gok, 'live repo: --check evaluate is GREEN (failures: ' + failures.join(' | ') + ')'); }

/* ── (1-neg) a planted unclaimed dir — the §6.2 acceptance neg-control ────────── */
{ const planted = build({ extraDirs: [PLANT] });
  ok(planted.unclaimed.includes(PLANT), 'planted dir appears in unclaimed');
  const { ok: gok, failures } = evaluate(planted, committedJson, committedTallies);
  ok(!gok, 'planted dir makes evaluate FAIL');
  ok(failures.some((f) => f.includes(PLANT)), 'the failure NAMES the planted dir (loud)');
  // it must not corrupt the true claim partition — every REAL dir still claimed
  ok(planted.unclaimed.length === 1, 'ONLY the planted dir is unclaimed (partition intact)'); }

/* ── (1-neg CLI) the real --check CLI exits LOUD on a planted dir ─────────────── */
{ let exit0 = false;
  try { execFileSync('node', [MANIFEST, '--check'], { stdio: 'pipe' }); exit0 = true; } catch { exit0 = false; }
  ok(exit0, 'CLI `--check` exits 0 on the clean repo (the wired gate is green)');
  let failedLoud = false, named = false;
  try { execFileSync('node', [MANIFEST, '--check', '--plant=' + PLANT], { stdio: 'pipe' }); }
  catch (e) { failedLoud = (e.status === 1); named = String(e.stdout || '') .includes(PLANT) || String(e.stderr || '').includes(PLANT); }
  ok(failedLoud, 'CLI `--check --plant=…` exits non-zero (FAILS LOUD)');
  ok(named, 'CLI failure output names the planted dir'); }

/* ── (2-neg) the double-claim law ────────────────────────────────────────────── */
{ const synth = { manifest: deepClone(live.manifest), unclaimed: [], doubleClaimed: ['some-dir <- [room, exhibit:numbers-room]'] };
  const { ok: gok, failures } = evaluate(synth, committedJson, committedTallies);
  ok(!gok, 'a double-claimed dir makes evaluate FAIL');
  ok(failures.some((f) => f.includes('DOUBLE-CLAIMED')), 'the failure is the double-claim law'); }

/* ── (3) count floors + neg-control ──────────────────────────────────────────── */
ok(live.manifest.counts.rooms >= ROOMS_FLOOR, 'rooms clear the floor (' + live.manifest.counts.rooms + ' ≥ ' + ROOMS_FLOOR + ')');
ok(live.manifest.counts.pieces >= PIECES_FLOOR, 'pieces clear the floor (' + live.manifest.counts.pieces + ' ≥ ' + PIECES_FLOOR + ')');
{ const shortM = { manifest: deepClone(live.manifest), unclaimed: [], doubleClaimed: [] };
  shortM.manifest.counts.pieces = PIECES_FLOOR - 1;
  const { ok: gok, failures } = evaluate(shortM, committedJson, committedTallies);
  ok(!gok, 'a manifest one short of the pieces floor FAILS');
  ok(failures.some((f) => f.includes('pieces floor')), 'the failure is the pieces floor'); }
{ const shortR = { manifest: deepClone(live.manifest), unclaimed: [], doubleClaimed: [] };
  shortR.manifest.counts.rooms = ROOMS_FLOOR - 1;
  const { ok: gok, failures } = evaluate(shortR, committedJson, committedTallies);
  ok(!gok, 'a manifest one short of the rooms floor FAILS');
  ok(failures.some((f) => f.includes('rooms floor')), 'the failure is the rooms floor'); }

/* ── (4) staleness + the generatedAt exclusion (the load-bearing one) ────────── */
{ // a fresh emit compared against itself is NOT stale
  const selfJson = JSON.stringify(live.manifest, null, 2);
  const r1 = evaluate(live, selfJson, committedTallies);
  ok(r1.ok, 'fresh manifest vs itself is NOT stale (' + r1.failures.join(' | ') + ')');
  // differing ONLY in generatedAt must still pass — else the gate is a permanent false-red
  const onlyGen = deepClone(live.manifest); onlyGen.generatedAt = 'deadbeef' + '0'.repeat(33);
  const r2 = evaluate(live, JSON.stringify(onlyGen, null, 2), committedTallies);
  ok(r2.ok, 'differing ONLY in generatedAt is NOT stale (the exclusion holds)');
  ok(normalizeForCompare(onlyGen) === normalizeForCompare(live.manifest), 'normalizeForCompare strips generatedAt');
  // a changed real field IS stale
  const changed = deepClone(live.manifest); changed.counts.pieces = live.manifest.counts.pieces + 1;
  const r3 = evaluate(live, JSON.stringify(changed, null, 2), committedTallies);
  ok(!r3.ok && r3.failures.some((f) => f.includes('STALE')), 'a changed non-generatedAt field IS stale');
  // a missing committed file is a failure
  const r4 = evaluate(live, null, committedTallies);
  ok(!r4.ok && r4.failures.some((f) => f.includes('MISSING')), 'a missing committed manifest FAILS'); }

/* ── (5) the depth-tally projection (§6.3 consumer 2) is checked too ──────────── */
{ // a stale tallies file (a district count nudged) is caught
  const staleTallies = JSON.parse(committedTallies);
  const anyD = Object.keys(staleTallies.districts)[0];
  staleTallies.districts[anyD].within += 1;
  const r5 = evaluate(live, committedJson, JSON.stringify(staleTallies, null, 2));
  ok(!r5.ok && r5.failures.some((f) => f.includes('estate-tallies.json is STALE')), 'a stale estate-tallies.json FAILS');
  // a missing tallies file is a failure
  const r6 = evaluate(live, committedJson, null);
  ok(!r6.ok && r6.failures.some((f) => f.includes('estate-tallies.json is MISSING')), 'a missing estate-tallies.json FAILS'); }

/* ── done ────────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) { console.error('\nmanifest self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
console.log('manifest self-test: ' + total + '/' + total + ' PASS');
