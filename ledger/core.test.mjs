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
import { execFileSync } from 'node:child_process';

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

// ── (4) THE CYCLE = GIT-DEPTH INVARIANTS ──────────────────────────────────────
// `cycle` is the git commit-DEPTH of the commit a stone lives in (sign.sh v3):
// rev-list --count is strictly increasing along history, so the ledger's cycles —
// laid in seq order, which IS commit order — must be POSITIVE integers, MONOTONIC
// non-decreasing by seq (multiple stones can SHARE a depth when committed together;
// GAPS are honored — cycles where no one signed), and the founding stone (seq 1)
// must carry the UNIQUE MINIMUM depth (it was laid first, deepest in the past, and
// no later stone can be shallower). This REPLACES the old "exactly one founder
// (cycle 0) at seq 1" assertion, which encoded the now-defunct sentinel-0 semantics
// — the founder's true cycle is its commit depth (306), not 0.

// records in seq order (the chronological order stones were laid / committed)
const bySeq = [...fileParsed.records].sort((a,b) => a.seq - b.seq);

// (4a) every cycle is a POSITIVE integer (depth >= 1; the root commit is depth 1,
//      so no real stone is ever 0 or negative — 0 was the defunct sentinel).
const allPositiveInt = bySeq.every(r =>
  typeof r.cycle === 'number' && Number.isInteger(r.cycle) && r.cycle >= 1);
const badCycle = bySeq.find(r =>
  !(typeof r.cycle === 'number' && Number.isInteger(r.cycle) && r.cycle >= 1));
assert('every cycle is a positive integer (git depth ≥ 1)', allPositiveInt,
  badCycle ? ('seq ' + badCycle.seq + ' has cycle ' + JSON.stringify(badCycle.cycle))
           : 'all ' + N + ' cycles ≥ 1');

// (4b) cycle is MONOTONIC non-decreasing by seq (commit depth never goes backward;
//      equal values are legal — co-committed stones share a depth; gaps are legal).
let monotonic = true, firstDrop = null;
for (let i = 1; i < bySeq.length; i++) {
  if (bySeq[i].cycle < bySeq[i-1].cycle) {
    monotonic = false;
    if (!firstDrop) firstDrop = { seq: bySeq[i].seq, cycle: bySeq[i].cycle, prev: bySeq[i-1].cycle };
  }
}
assert('cycle is monotonic non-decreasing by seq', monotonic,
  firstDrop ? ('regression at seq ' + firstDrop.seq + ': ' + firstDrop.prev + ' → ' + firstDrop.cycle)
            : 'never decreases across ' + N + ' stones');

// (4c) seq 1 carries the UNIQUE MINIMUM cycle (the founder is alone at the floor —
//      laid first, deepest in the past; no later stone is shallower or ties it).
const minCycle = Math.min(...bySeq.map(r => r.cycle));
const atMin = bySeq.filter(r => r.cycle === minCycle);
const founder = bySeq[0];                       // seq 1 after sort
assert('seq 1 has the UNIQUE MINIMUM cycle',
  founder.seq === 1 && atMin.length === 1 && atMin[0].seq === 1,
  'min cycle ' + minCycle + ' held by ' + atMin.length + ' stone(s) [seq ' +
    atMin.map(r => r.seq).join(',') + ']');

// NOTE: we deliberately do NOT re-derive the founder's depth from `git blame` here.
//      Committing the cycle migration rewrites every line of ledger.jsonl, so AFTER the
//      migration commit `git blame` attributes line 1 to the migration commit (a recent
//      depth), not to the founding commit (306). A blame-based assertion would therefore
//      pass only on an uncommitted overlay and FAIL on every committed checkout. The
//      founder's depth (306) is a one-time recovered fact frozen into the data; the
//      load-bearing, blame-independent invariants (4a positive-int, 4b monotonic,
//      4c seq-1 unique-minimum) fully guard it going forward.

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
//    way the ledger is, and the structural invariant relating the trail to the
//    pile. The OLD form was "depth ≥ stone-count" — one passage per stone. That
//    encoded a ONE-MARK-PER-COMMIT manor, which the autonomous loop is not: each
//    cycle MULTIPLE seats (director, explorers, builder, publisher) each sign a
//    mark, and collate.sh seals ALL of one cycle's marks into a SINGLE commit. So
//    the pile grows ~4-5 stones per passage walked, and depth ≥ stones was
//    structurally GUARANTEED to fail once the loop got going (already −71 at #114,
//    never CI-gated, drifted silently). The TRUE invariant counts PASSAGES, not
//    stones: because each stone's `cycle` IS the git commit-depth of the commit it
//    lives in (sign.sh/collate.sh v3), the count of DISTINCT `cycle` values among
//    the stones === the number of distinct introducing-commits === the number of
//    real passages walked to lay the pile. THAT is what depth must dominate. The
//    "quantified silence" idea survives, recast: depth − distinctCommits counts the
//    passages walked on which NO ONE signed (the nameless cycles), not depth − N. ──
console.log('[CAIRN core.test] parsing ledger/depth.txt (the worn-path depth)');

const depthRaw = fs.readFileSync(path.join(HERE, 'depth.txt'), 'utf8');
const depthInfo = parseDepth(depthRaw);

// the number of DISTINCT introducing-commits = the number of passages walked.
const distinctCycleCount = new Set(fileParsed.records.map(r => r.cycle)).size;
const maxCycle = Math.max(...fileParsed.records.map(r => r.cycle));

// (8) depth.txt holds a valid non-negative integer.
assert('depth.txt is a valid integer', depthInfo.valid, 'depth.txt = ' + depthInfo.raw);

// (9) THE STRUCTURAL INVARIANT (multi-seat form): depth+1 ≥ distinct introducing-
//     commits — every distinct `cycle` is a passage that was walked, and depth is at
//     least that many. The +1 honors collate.sh's DOCUMENTED off-by-one: the in-
//     flight batch (this very cycle's marks, not yet sealed) is stamped depth+1
//     while depth.txt still holds the last-LANDED depth, so exactly one distinct
//     cycle may legitimately overhang depth by 1.  Companion upper-edge guard:
//     max(cycle) ≤ depth+1 — no stone may claim a commit deeper than the in-flight
//     one.  Together they are a REAL guard: a stone whose cycle exceeds depth+1
//     (a forged-deep mark) breaks both. You cannot lay a stone without walking a
//     passage — the multi-seat truth of that old vow.
assert('depth+1 ≥ distinct introducing-commits (trail ≥ passages)',
  depthInfo.valid && distinctCycleCount <= depthInfo.depth + 1,
  'depth ' + depthInfo.depth + ' (+1) ≥ ' + distinctCycleCount + ' passages  ⇒  ' +
    (depthInfo.depth - distinctCycleCount) + ' silent passage(s)');

// (9b) the upper edge: no stone claims a commit deeper than the in-flight one.
assert('max(cycle) ≤ depth+1 (no stone overhangs the in-flight commit)',
  depthInfo.valid && maxCycle <= depthInfo.depth + 1,
  'max cycle ' + maxCycle + ' ≤ depth+1 ' + (depthInfo.depth + 1));

// (9c) negative / tamper guard — proves (9) and (9b) are guards, not tautologies:
//      a forged-deep stone (cycle = depth+5) MUST break the invariant. We test the
//      predicates on a tampered copy of the records rather than the real file.
const tampered = [...fileParsed.records, { seq: N+1, cycle: depthInfo.depth + 5,
  role: 'tamper', name: 'Forged-Deep', koan: 'a stone with no passage', ts: '2026-01-01T00:00:00Z' }];
const tDistinct = new Set(tampered.map(r => r.cycle)).size;
const tMax = Math.max(...tampered.map(r => r.cycle));
const tamperCaught = !(tDistinct <= depthInfo.depth + 1) || !(tMax <= depthInfo.depth + 1);
assert('negative: a forged-deep stone (cycle = depth+5) is REJECTED', tamperCaught,
  'tampered max ' + tMax + ' > depth+1 ' + (depthInfo.depth + 1) + ' ⇒ caught');

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
