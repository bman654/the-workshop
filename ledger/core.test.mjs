#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   core.test.mjs — a Node twin of the Cairn's parse/bind core.

   The in-page self-test is the required signature; this is a CLI sanity check
   that the SAME parseLedger logic the page inlines agrees with the real file on
   disk AND with the data forge inlined into ledger/face.html. Run:

       node ledger/core.test.mjs

   Zero-dependency. Exits 0 on pass, 1 on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ── THE CORE — identical in spirit to the page's parseLedger:
   split on newlines, trim, keep non-blank, JSON.parse each. ── */
function parseLedger(raw){
  const fileLines = raw.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  const records = fileLines.map((line, i) => {
    try { return JSON.parse(line); }
    catch (e) { throw new Error('line ' + (i+1) + ' is not valid JSON: ' + e.message); }
  });
  return { records, fileLineCount: fileLines.length };
}

/* ── the depth core — identical to the page's parseDepth: trim, coerce, validate
   a finite non-negative integer (the worn-path commit-depth). ── */
function parseDepth(raw){
  const trimmed = String(raw).trim();
  const n = Number(trimmed);
  const valid = trimmed.length > 0 && Number.isInteger(n) && n >= 0;
  return { depth: valid ? n : NaN, raw: trimmed, valid };
}

let failures = 0;
const assert = (name, cond, detail) => {
  const ok = !!cond;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!ok) failures++;
};

// ── load the source of truth (the real .jsonl) ──
const fileRaw = fs.readFileSync(path.join(HERE, 'ledger.jsonl'), 'utf8');
const fileParsed = parseLedger(fileRaw);
const N = fileParsed.records.length;

console.log('[CAIRN core.test] parsing ledger/ledger.jsonl');

// (1) count === non-blank line count
assert('count === file-line-count', N === fileParsed.fileLineCount,
  N + ' records / ' + fileParsed.fileLineCount + ' lines');

// (2) seq contiguous 1..N
const seqs = fileParsed.records.map(r => r.seq).sort((a,b)=>a-b);
let contiguous = seqs.length === N;
for (let i = 0; i < N; i++) if (seqs[i] !== i + 1) contiguous = false;
assert('seq is contiguous 1..N', contiguous, '[' + seqs.join(',') + ']');

// (3) every record has the schema fields
assert('every record has name+role+koan+cycle',
  fileParsed.records.every(r =>
    typeof r.name === 'string' && typeof r.role === 'string' &&
    typeof r.koan === 'string' && typeof r.cycle === 'number'),
  'schema intact');

// (4) exactly one founder (cycle 0), and it is seq 1
const founders = fileParsed.records.filter(r => r.cycle === 0);
assert('exactly one founder (cycle 0) at seq 1',
  founders.length === 1 && founders[0].seq === 1,
  founders.length + ' founder(s)');

// (5) negative: truncated → N−1
const truncated = fileRaw.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,-1).join('\n');
assert('negative: truncated yields N−1', parseLedger(truncated).records.length === N - 1);

// (6) data-bound: +1 line ⇒ +1 record
const augmented = fileRaw.replace(/\n*$/,'') + '\n' +
  JSON.stringify({ seq: N+1, cycle: 11, role: 'test', name: 'Ghost-Probe', koan: 'proof only', ts: '2026-06-14T13:00:00Z' });
assert('data-bound: +1 line ⇒ +1 record', parseLedger(augmented).records.length === N + 1);

// (7) the forged page's carrier === the real file (forge inlined verbatim).
//     Extract the <script type="text/plain" id="ledger-data"> textContent from
//     ledger/face.html and parse it through the SAME core; it must match the file.
const faceHtmlPath = path.join(HERE, 'face.html');
if (fs.existsSync(faceHtmlPath)) {
  const html = fs.readFileSync(faceHtmlPath, 'utf8');
  const m = html.match(/<script type="text\/plain" id="ledger-data">([\s\S]*?)<\/script>/);
  assert('face.html carrier present', !!m, m ? 'found' : 'MISSING — re-forge');
  if (m) {
    const carrierParsed = parseLedger(m[1]);
    assert('face.html carrier count === file count',
      carrierParsed.records.length === N,
      carrierParsed.records.length + ' vs ' + N);
    // byte-for-byte name+koan agreement across all records
    const same = carrierParsed.records.length === N &&
      carrierParsed.records.every((r, i) =>
        r.seq === fileParsed.records[i].seq &&
        r.name === fileParsed.records[i].name &&
        r.koan === fileParsed.records[i].koan);
    assert('face.html carrier === file (name+koan+seq verbatim)', same, 'forge inlined faithfully');
  }
} else {
  assert('face.html exists (run forge)', false, 'missing — run: node tools/forge/forge.mjs ledger/face.src.html');
}

// ── THE DEPTH LEGS — the worn-path measure (git commit-depth), inlined the same
//    way the ledger is, and the structural invariant depth ≥ stones. ──
console.log('[CAIRN core.test] parsing ledger/depth.txt (the worn-path depth)');

const depthRaw = fs.readFileSync(path.join(HERE, 'depth.txt'), 'utf8');
const depthInfo = parseDepth(depthRaw);

// (8) depth.txt holds a valid non-negative integer.
assert('depth.txt is a valid integer', depthInfo.valid, 'depth.txt = ' + depthInfo.raw);

// (9) the STRUCTURAL INVARIANT: depth ≥ stone-count (the trail is at least as
//     worn as the pile is tall — you cannot lay a stone without walking a passage).
assert('depth ≥ stone-count (trail ≥ pile)', depthInfo.valid && depthInfo.depth >= N,
  'depth ' + depthInfo.depth + ' ≥ stones ' + N + '  ⇒  gap ' + (depthInfo.depth - N));

// (10) the forged page's DEPTH carrier === depth.txt (forge inlined verbatim) —
//      the same carrier→file parity the ledger carrier has.
if (fs.existsSync(faceHtmlPath)) {
  const html = fs.readFileSync(faceHtmlPath, 'utf8');
  const dm = html.match(/<script type="text\/plain" id="depth-data">([\s\S]*?)<\/script>/);
  assert('face.html depth carrier present', !!dm, dm ? 'found' : 'MISSING — re-forge');
  if (dm) {
    const carrierDepth = parseDepth(dm[1]);
    assert('face.html depth carrier === depth.txt',
      carrierDepth.valid && carrierDepth.depth === depthInfo.depth,
      'carrier ' + carrierDepth.raw + ' vs file ' + depthInfo.raw);
  }
}

console.log(failures === 0
  ? '\n[CAIRN core.test] ALL PASS (' + N + ' marks)'
  : '\n[CAIRN core.test] ' + failures + ' FAILURE(S)');
process.exit(failures === 0 ? 0 : 1);
