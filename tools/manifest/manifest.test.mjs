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

   Plus the §6.4 PAGE LAW (catalog completeness at the page grain): the live repo
   has zero unclaimed pages and zero stale DENY rows; a planted orphan page FAILS
   LOUD by name (in-process and via `--check --plant-page=…`); a planted sub-bench
   under a real room is AUTO-DISCOVERED and the staleness gate NAMES it until the
   re-derived manifest is committed; a gated within's sub-bench inherits the gate.

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

/* ── (6) the §6.4 PAGE LAW — every shipped page catalogued or accounted ───────── */
{ // the live repo is page-complete: no orphan pages, no stale DENY rows
  ok(live.unclaimedPages.length === 0, 'live repo: unclaimedPages is [] (got ' + live.unclaimedPages.length + ': ' + live.unclaimedPages.join(', ') + ')');
  ok(live.denyUnused.length === 0, 'live repo: every DENY row matches a real page (' + live.denyUnused.join(', ') + ')');
  ok(live.htmlPages.length > 400, 'the page walk sees the estate (' + live.htmlPages.length + ' shipped pages)');
  // the gated sub-bench: a bench discovered INSIDE a gated within inherits the gate
  // (spoiler discipline §4.4 — the Soap-Film Surveyor stays unlisted until earned)
  let surveyor = null;
  for (const d of live.manifest.districts) for (const r of d.rooms) {
    for (const ex of r.exhibits) if (ex.href === 'soap-film/surveyor/index.html') surveyor = ex;
  }
  ok(!!surveyor, 'the soap-film sub-bench is auto-discovered');
  ok(surveyor && surveyor.gate === 'ws:seen:soap-film' && surveyor.hidden === true && surveyor.hostedVia === 'soap-film',
    'a sub-bench of a gated within INHERITS the gate + hidden + hostedVia (got ' + JSON.stringify(surveyor) + ')'); }

/* ── (6-neg) planted pages FAIL LOUD by name ──────────────────────────────────── */
const PLANT_PAGE = '__negctl_pages__/nowhere/index.html';   // resolves to NO room/unit
{ const planted = build({ extraPages: [PLANT_PAGE, 'conservatory/__negctl_note__.html'] });
  ok(planted.unclaimedPages.includes(PLANT_PAGE), 'an unresolvable planted sub-unit lands in unclaimedPages');
  ok(planted.unclaimedPages.includes('conservatory/__negctl_note__.html'),
    'a planted FLAT page under a room is NOT silently claimed (rooms do not swallow flats)');
  const { ok: gok, failures } = evaluate(planted, committedJson, committedTallies);
  ok(!gok, 'planted pages make evaluate FAIL');
  ok(failures.some((f) => f.includes(PLANT_PAGE) && f.includes('UNCLAIMED PAGES')), 'the failure NAMES the planted page (loud)'); }
{ // a planted sub-bench under a REAL room is AUTO-DISCOVERED (this is how a brand-new
  // page enters the catalog) — and vs the committed manifest the gate turns STALE and
  // NAMES the newcomer, so un-re-derived drift is loud AND actionable.
  const planted = build({ extraPages: ['conservatory/__negctl_bench__/index.html'] });
  let found = null;
  for (const d of planted.manifest.districts) for (const r of d.rooms) {
    for (const ex of r.exhibits) if (ex.href === 'conservatory/__negctl_bench__/index.html') found = r.id;
  }
  ok(found === 'conservatory', 'a new sub-bench under a room dir is auto-enrolled under that room');
  ok(planted.unclaimedPages.length === 0, 'the auto-enrolled newcomer is claimed, not orphaned');
  const { ok: gok, failures } = evaluate(planted, committedJson, committedTallies);
  ok(!gok, 'a newcomer not yet in the committed manifest turns the gate red');
  ok(failures.some((f) => f.includes('STALE') && f.includes('conservatory/__negctl_bench__/index.html')),
    'the STALE failure NAMES the not-yet-committed page'); }
{ // a stale DENY row (matching nothing on disk) is drift and FAILS
  const synth = { manifest: deepClone(live.manifest), unclaimed: [], doubleClaimed: [], unclaimedPages: [], denyUnused: ['no-such-page.html'] };
  const { ok: gok, failures } = evaluate(synth, committedJson, committedTallies);
  ok(!gok, 'a DENY row matching nothing FAILS');
  ok(failures.some((f) => f.includes('no-such-page.html')), 'the failure names the stale DENY row'); }

/* ── (6-neg CLI) the real --check CLI exits LOUD on a planted page ────────────── */
{ let failedLoud = false, named = false;
  try { execFileSync('node', [MANIFEST, '--check', '--plant-page=' + PLANT_PAGE], { stdio: 'pipe' }); }
  catch (e) { failedLoud = (e.status === 1); named = String(e.stdout || '').includes(PLANT_PAGE) || String(e.stderr || '').includes(PLANT_PAGE); }
  ok(failedLoud, 'CLI `--check --plant-page=…` exits non-zero (FAILS LOUD)');
  ok(named, 'CLI failure output names the planted page'); }

/* ── (7) the §6.5 BOTH-OR-NEITHER + SAME-LOCKS laws ───────────────────────────── */
{ // live repo: every LOCKS descriptor proven ≡ ws.js; every place-secret catalogued
  // under its own reveal-lock; every catalogued page referenced by another page.
  ok(live.lockDrift.length === 0, 'live repo: zero lock drift vs ws.js (' + live.lockDrift.join('; ') + ')');
  ok(live.secretFaults.length === 0, 'live repo: secret-path audit clean (' + live.secretFaults.join('; ') + ')');
  ok(live.unreachable.length === 0, 'live repo: every catalogued page reachable (' + live.unreachable.join(', ') + ')');
  // the re-gated quickening: the catalog lock is the PATH lock, not the visit-proxy
  let quick = null;
  for (const d of live.manifest.districts) for (const r of d.rooms) {
    for (const ex of r.exhibits) if (ex.href === 'sound-garden/quickening.html') quick = ex;
  }
  ok(!!quick && quick.lockId === 'quickening' && quick.hidden === true
    && JSON.stringify(quick.lock) === JSON.stringify({ all: ['ws:seen:game-of-life', 'ws:seen:lattice'] }),
    'quickening carries its true PATH lock (game-of-life && lattice), not a visit-proxy (got ' + JSON.stringify(quick && quick.lock) + ')');
  // the 9 Undercroft place-secrets are enrolled, each hidden with a lock
  const uc = [];
  for (const d of live.manifest.districts) for (const r of d.rooms) {
    for (const ex of r.exhibits) if (ex.href.startsWith('undercroft/')) uc.push(ex);
  }
  ok(uc.length === 9 && uc.every((e) => e.hidden === true && e.lock && e.lockId),
    'the 9 Undercroft place-secrets are catalogued hidden+locked (got ' + uc.length + ')'); }

/* ── (7-neg) the §6.5 failure modes are LOUD ──────────────────────────────────── */
{ const base = { manifest: deepClone(live.manifest), unclaimed: [], doubleClaimed: [], unclaimedPages: [], denyUnused: [] };
  const r1 = evaluate({ ...base, lockDrift: ['LOCKS["x"] ≠ ws.js'] }, committedJson, committedTallies);
  ok(!r1.ok && r1.failures.some((f) => f.includes('LOCK DRIFT')), 'lock drift FAILS loud');
  const r2 = evaluate({ ...base, secretFaults: ['place secret "y" is NOT catalogued'] }, committedJson, committedTallies);
  ok(!r2.ok && r2.failures.some((f) => f.includes('SECRET-PATH AUDIT') && f.includes('"y"')), 'a secret-path fault FAILS naming the secret');
  const r3 = evaluate({ ...base, unreachable: ['ghost/index.html'] }, committedJson, committedTallies);
  ok(!r3.ok && r3.failures.some((f) => f.includes('UNREACHABLE') && f.includes('ghost/index.html')), 'an unreachable entry FAILS by name'); }
{ // REAL wiring: a planted sub-bench is auto-enrolled but NO page references it —
  // the reachability arm must flag exactly that newcomer.
  const planted = build({ extraPages: ['conservatory/__negctl_bench__/index.html'] });
  ok(planted.unreachable.includes('conservatory/__negctl_bench__/index.html'),
    'the reachability arm flags an enrolled page nothing links (both-or-neither, catalog side)'); }

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
