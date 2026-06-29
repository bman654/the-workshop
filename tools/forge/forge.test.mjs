#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   forge.test.mjs — the deterministic round-trip + failure-mode test for forge's
   inline asset/json directives (forge:asset, forge:json).

   Zero-dependency, house style of ledger/core.test.mjs. It SPAWNS forge.mjs via
   spawnSync (so it needs zero change to forge's `process.exit(main(...))` tail,
   and captures BOTH streams even on exit-0 — see runForge), building fixtures in
   a fresh mkdtemp dir (no repo footprint, parallel-safe). Run:

       node tools/forge/forge.test.mjs

   Exits 0 on pass, 1 on any failure. Touches no deployed page.

   The load-bearing proof: a fixture .src.html referencing a small REAL audio
   asset + its timing JSON builds to an .html whose inlined data:audio/...;base64
   decodes byte-identical to the source asset (an INDEPENDENT re-encode, not a
   "contains data:" smell test), and `forge --check` reports it CURRENT — a
   tampered on-disk byte is detected as drift.
   ═══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FORGE = path.join(HERE, 'forge.mjs');

let failures = 0;
const assert = (name, cond, detail) => {
  const ok = !!cond;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!ok) failures++;
};

/* Spawn forge with the given args. Returns { code, stdout, stderr }. spawnSync
   captures BOTH streams regardless of exit code — important here because a
   SUCCESSFUL (exit-0) oversized build still prints its warning to stderr, and the
   test asserts on that warning. (execFileSync surfaces stderr only on throw.) */
function runForge(args) {
  const r = spawnSync('node', [FORGE, ...args], { encoding: 'utf8' });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
console.log('[forge.test] fixture dir: ' + tmp);

try {
  // ── fixtures ──────────────────────────────────────────────────────────────
  // (a) a small REAL mp3: a minimal valid MPEG frame header + zero padding.
  //     Honest binary — bytes are what the byte-fold test needs, not playability.
  const mp3Bytes = Buffer.concat([Buffer.from([0xFF, 0xFB, 0x90, 0x64]), Buffer.alloc(252, 0)]);
  fs.writeFileSync(path.join(tmp, 'v.mp3'), mp3Bytes);

  // a real timing JSON (validated by forge:json; emitted verbatim)
  const jsonText = '{\n  "duration": 12.5,\n  "cues": [0, 3.2, 7.8]\n}\n';
  fs.writeFileSync(path.join(tmp, 'v.json'), jsonText);

  // a 1-line include so a normal page shape (an include + inline tokens) is exercised
  fs.writeFileSync(path.join(tmp, 'noop.js'), 'const NOOP = 1;\n');

  // the page: an audio src asset, a json literal, and an include
  const srcHtml =
    '<!doctype html>\n' +
    '<html><body>\n' +
    '<audio src="<!-- forge:asset v.mp3 -->"></audio>\n' +
    '<script>\n' +
    'const T = <!-- forge:json v.json -->;\n' +
    '<!-- forge:include noop.js -->\n' +
    '</script>\n' +
    '</body></html>\n';
  const srcPath = path.join(tmp, 'p.src.html');
  const outPath = path.join(tmp, 'p.html');
  fs.writeFileSync(srcPath, srcHtml);

  // ── (a) build → assert the inlined bytes match an INDEPENDENT re-encode ─────
  const r1 = runForge([srcPath]);
  assert('(a) build exits 0', r1.code === 0, r1.stderr || r1.stdout);
  const built = fs.readFileSync(outPath, 'utf8');
  const expectedB64 = fs.readFileSync(path.join(tmp, 'v.mp3')).toString('base64');
  assert('(a) html contains data:audio/mpeg;base64,', built.includes('data:audio/mpeg;base64,'),
    'mime prefix present');
  assert('(a) inlined base64 === independent re-encode of v.mp3',
    built.includes('data:audio/mpeg;base64,' + expectedB64),
    'byte-identical fold (true diff, not a contains-data smell test)');
  assert('(a) json literal emitted verbatim',
    built.includes('const T = ' + jsonText.replace(/\n$/, '') + ';'),
    'passthrough, not re-serialized');
  assert('(a) include folded too', built.includes('const NOOP = 1;'), 'mixed page shape works');

  // ── (b) --check on the fresh build → exit 0 (zero drift) ────────────────────
  const r2 = runForge(['--check', srcPath]);
  assert('(b) --check on fresh build exits 0', r2.code === 0, r2.stdout || r2.stderr);

  // ── (c) tamper one on-disk asset byte → --check exits 1, then restore ───────
  // Mutate the SOURCE asset's bytes: a fresh in-memory build now differs from the
  // on-disk .html (the fold is a pure function of the bytes), so --check goes red.
  const goodMp3 = fs.readFileSync(path.join(tmp, 'v.mp3'));
  fs.writeFileSync(path.join(tmp, 'v.mp3'), Buffer.concat([goodMp3, Buffer.from([0x01])]));
  const r3 = runForge(['--check', srcPath]);
  assert('(c) tampered asset byte → --check exits 1 (drift detected)', r3.code === 1,
    'fold is a pure function of the bytes');
  fs.writeFileSync(path.join(tmp, 'v.mp3'), goodMp3);          // restore
  const r3b = runForge(['--check', srcPath]);
  assert('(c) restored → --check exits 0 again', r3b.code === 0, 'deterministic round-trip');

  // ── purity: build twice, assert identical bytes ────────────────────────────
  const first = fs.readFileSync(outPath, 'utf8');
  runForge([srcPath]);
  const second = fs.readFileSync(outPath, 'utf8');
  assert('purity: two builds are byte-identical', first === second, 'deterministic');

  // ── failure mode: missing asset → exit 1, include-shaped message ────────────
  const missSrc = path.join(tmp, 'miss.src.html');
  fs.writeFileSync(missSrc, '<audio src="<!-- forge:asset nope.mp3 -->"></audio>\n');
  const rMiss = runForge([missSrc]);
  assert('missing asset → exit 1', rMiss.code === 1, rMiss.stderr);
  assert('missing asset → include-shaped message',
    rMiss.stderr.includes('forge:asset target not found: "nope.mp3"') &&
    rMiss.stderr.includes('relative to'),
    'byte-shaped like forge:include');

  // ── failure mode: unknown extension → exit 1, lists the allow-table ─────────
  fs.writeFileSync(path.join(tmp, 'u.bin'), Buffer.from([0, 1, 2, 3]));
  const binSrc = path.join(tmp, 'bin.src.html');
  fs.writeFileSync(binSrc, '<a href="<!-- forge:asset u.bin -->">x</a>\n');
  const rBin = runForge([binSrc]);
  assert('unknown ext → exit 1', rBin.code === 1, rBin.stderr);
  assert('unknown ext → lists the allow-table',
    rBin.stderr.includes('unknown extension') && rBin.stderr.includes('.mp3') && rBin.stderr.includes('.png'),
    'hard error names the known set');

  // ── failure mode: invalid JSON → exit 1 ─────────────────────────────────────
  fs.writeFileSync(path.join(tmp, 'bad.json'), '{ not: valid json, }');
  const badSrc = path.join(tmp, 'bad.src.html');
  fs.writeFileSync(badSrc, '<script>const X = <!-- forge:json bad.json -->;</script>\n');
  const rBad = runForge([badSrc]);
  assert('invalid json → exit 1', rBad.code === 1, rBad.stderr);
  assert('invalid json → names the file', rBad.stderr.includes('invalid JSON in "bad.json"'), rBad.stderr);

  // ── failure mode: asset just over WARN_BYTES → ships w/o --strict, fails w/ ─
  // WARN is 4 MiB ENCODED; base64 expands ~4/3, so raw bytes ≈ encoded * 3/4.
  // Make raw just over 3 MiB so encoded clears 4 MiB. Stay well under the 24 MiB
  // hard ceiling (raw ~3 MiB → encoded ~4 MiB).
  const bigRaw = 3 * 1024 * 1024 + 64 * 1024;                 // ~3.06 MiB raw → ~4.08 MiB encoded
  fs.writeFileSync(path.join(tmp, 'big.wav'), Buffer.alloc(bigRaw, 0xAB));
  const bigSrc = path.join(tmp, 'big.src.html');
  fs.writeFileSync(bigSrc, '<audio src="<!-- forge:asset big.wav -->"></audio>\n');
  // sanity: confirm the fixture actually clears the warn line but not the ceiling
  const bigEnc = Buffer.alloc(bigRaw, 0xAB).toString('base64').length;
  assert('size fixture is over WARN, under HARD',
    bigEnc > 4 * 1024 * 1024 && bigEnc < 24 * 1024 * 1024,
    bigEnc + ' bytes encoded');
  const rBig = runForge([bigSrc]);
  assert('oversized asset (no --strict) → exit 0 (shipped)', rBig.code === 0, rBig.stderr);
  assert('oversized asset (no --strict) → warning on stderr',
    rBig.stderr.includes('⚠') && rBig.stderr.toLowerCase().includes('warn line'), rBig.stderr);
  const rBigStrict = runForge([bigSrc, '--strict']);
  assert('oversized asset (--strict) → exit 1 (refused)', rBigStrict.code === 1, rBigStrict.stderr);

  // ── failure mode: --check --strict on an oversized asset → exit 1 ───────────
  runForge([bigSrc]);                                         // produce big.html first
  const rCheckStrict = runForge(['--check', bigSrc, '--strict']);
  assert('--check --strict on oversized → exit 1', rCheckStrict.code === 1, rCheckStrict.stderr);

  // ── asset-only page (no include) is valid (the relaxed directive guard) ─────
  const onlySrc = path.join(tmp, 'only.src.html');
  fs.writeFileSync(onlySrc, '<audio src="<!-- forge:asset v.mp3 -->"></audio>\n');
  const rOnly = runForge([onlySrc]);
  assert('asset-only page (no include) builds', rOnly.code === 0, rOnly.stderr);

} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(failures === 0
  ? '\n[forge.test] ALL PASS'
  : '\n[forge.test] ' + failures + ' FAILURE(S)');
process.exit(failures === 0 ? 0 : 1);
