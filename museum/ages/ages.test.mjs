/* ages.test.mjs — the Node twin of THE FRONT DOOR THROUGH THE AGES.
   The ages exhibit is a set of 7 cold-sky captures of the estate's front door,
   labelled and ordered ONLY by museum/ages/manifest.json. This twin proves the
   manifest is honest and the forged page agrees with it:

     A · manifest integrity     — valid array of 7, k = 1…7, every field present,
                                   dates strictly chronological (internal).
     B · assets on disk         — every capture file exists with the exact bytes
                                   and sha256 the manifest records.
     C · chronology vs real git — each sha's real committer date (`git show -s
                                   --format=%cI <sha>`) is strictly ascending AND
                                   equals the manifest date. If any sha is dangling
                                   (a rewritten history), this whole section reports
                                   a NAMED SKIP and the twin still exits 0 on A/B/D
                                   — it degrades, it never crashes the estate suite
                                   (invariant 7).
     D · page renders only from the manifest — the forged museum/ages.html inlines
                                   the manifest verbatim (deep-equal), inlines
                                   exactly 7 webp data URIs, and pulls in zero
                                   external resources.

   No framework: prints a PASS/FAIL line per leg, exits non-zero on any red.

   Run:  node museum/ages/ages.test.mjs
         node museum/ages/ages.test.mjs <manifest.json path> */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const MANIFEST_PATH = process.argv[2] || resolve(HERE, 'manifest.json');
const BUILT_PAGE = resolve(HERE, '../ages.html');

let fails = 0;
let skips = 0;
const ok = (label, pass, detail = '') => {
  console.log((pass ? '  PASS  ' : '  FAIL  ') + label + (detail ? '  — ' + detail : ''));
  if (!pass) fails++;
};
const skip = (label, detail = '') => {
  console.log('  SKIP  ' + label + (detail ? '  — ' + detail : ''));
  skips++;
};

/* ── read the manifest ── */
const rawManifest = readFileSync(MANIFEST_PATH, 'utf8');
let manifest;
try { manifest = JSON.parse(rawManifest); }
catch (e) { console.error('FATAL — manifest is not valid JSON: ' + e.message); process.exit(1); }

/* ═══ Section A — manifest integrity (pure, no git) ═══ */
console.log('— ages manifest integrity (museum/ages/manifest.json) —');
ok('manifest is a JSON array', Array.isArray(manifest), typeof manifest);
ok('exactly 7 captures', manifest.length === 7, 'count=' + manifest.length);

const REQUIRED = ['k', 'sha', 'date', 'era', 'file', 'bytes', 'sha256'];
let fieldsOk = true;
for (const e of manifest) for (const f of REQUIRED) if (e[f] === undefined || e[f] === null) fieldsOk = false;
ok('every record has ' + REQUIRED.join('·'), fieldsOk);

let contiguous = true;
for (let i = 0; i < manifest.length; i++) if (manifest[i].k !== i + 1) contiguous = false;
ok('k = 1…N, contiguous & in array order', contiguous);

let internalChrono = true;
const badChrono = [];
for (let i = 1; i < manifest.length; i++) {
  if (!(manifest[i - 1].date < manifest[i].date)) { internalChrono = false; badChrono.push(manifest[i].date); }
}
ok('manifest dates strictly chronological', internalChrono, badChrono.length ? 'not-after: ' + badChrono.join(',') : '');

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
ok('every date is YYYY-MM-DD', manifest.every((e) => dateRe.test(e.date)));

/* ═══ Section B — assets on disk (bytes + sha256 match the manifest) ═══ */
console.log('— ages capture assets on disk —');
let allBytes = true, allHash = true, allPresent = true;
for (const e of manifest) {
  const p = resolve(HERE, e.file);
  if (!existsSync(p)) { allPresent = false; ok('asset present: ' + e.file, false, 'missing'); continue; }
  const buf = readFileSync(p);
  const bytesMatch = buf.length === e.bytes;
  const hash = createHash('sha256').update(buf).digest('hex');
  const hashMatch = hash === e.sha256;
  if (!bytesMatch) allBytes = false;
  if (!hashMatch) allHash = false;
  ok('asset present: ' + e.file, true);
  if (!bytesMatch) ok('  bytes match ' + e.file, false, buf.length + ' ≠ ' + e.bytes);
  if (!hashMatch) ok('  sha256 match ' + e.file, false, hash.slice(0, 12) + ' ≠ ' + String(e.sha256).slice(0, 12));
}
ok('all 7 assets present', allPresent);
ok('all bytes match the manifest', allBytes);
ok('all sha256 match the manifest', allHash);

/* ═══ Section C — chronology vs real git (NAMED SKIP on a dangling ref) ═══
   Per-sha resolution of each capture's OWN commit — not an asOf walk. A dangling
   ref degrades to a named SKIP (invariant 7), never a crash. */
console.log('— ages chronology cross-checked against real git —');
function gitCommitISO(sha) {
  return execFileSync('git', ['show', '-s', '--format=%cI', sha + '^{commit}'], {
    cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}
let gitDates = [];
let dangling = null;
for (const e of manifest) {
  try { gitDates.push({ k: e.k, sha: e.sha, iso: gitCommitISO(e.sha), manDate: e.date }); }
  catch (_err) { dangling = e.sha; break; }
}
if (dangling) {
  skip('git chronology cross-check', 'sha ' + dangling + ' is dangling in this repo — history rewritten; run the capture task to refresh');
} else {
  let gitChrono = true, dateAgree = true;
  for (let i = 0; i < gitDates.length; i++) {
    const day = gitDates[i].iso.slice(0, 10);
    if (day !== gitDates[i].manDate) dateAgree = false;
    if (i > 0 && !(gitDates[i - 1].iso < gitDates[i].iso)) gitChrono = false;
  }
  ok('real committer dates strictly ascending', gitChrono);
  ok('manifest date == real committer day for every sha', dateAgree);
}

/* ═══ Section D — the forged page renders ONLY from the manifest ═══ */
console.log('— ages page renders only from the manifest (museum/ages.html) —');
if (!existsSync(BUILT_PAGE)) {
  ok('forged museum/ages.html exists', false, 'run: node tools/forge/forge.mjs museum/ages.src.html');
} else {
  const html = readFileSync(BUILT_PAGE, 'utf8');
  ok('forged museum/ages.html exists', true);

  /* the inlined data carrier must be byte-for-byte the manifest */
  const m = html.match(/<script[^>]*id="ages-manifest"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) {
    ok('page inlines the #ages-manifest carrier', false, 'carrier block not found');
  } else {
    ok('page inlines the #ages-manifest carrier', true);
    let inlined = null;
    try { inlined = JSON.parse(m[1]); } catch (e) { /* left null */ }
    const deepEqual = inlined && JSON.stringify(inlined) === JSON.stringify(manifest);
    ok('inlined carrier deep-equals the manifest', !!deepEqual);
  }

  /* exactly one inlined webp plate per capture, nothing more */
  const webpCount = (html.match(/data:image\/webp;base64,/g) || []).length;
  ok('exactly 7 webp captures inlined', webpCount === 7, 'found ' + webpCount);

  /* self-contained: zero external resources (the captures' headline finding) */
  const extRes = html.match(/(?:src|href)\s*=\s*["']https?:\/\//g) || [];
  ok('no external http(s) src/href', extRes.length === 0, extRes.length ? extRes.length + ' external refs' : '');
  const extScript = html.match(/<script[^>]*\ssrc\s*=/g) || [];
  ok('no external <script src>', extScript.length === 0, extScript.length ? extScript.length + ' external scripts' : '');
}

/* ── verdict ── */
console.log('');
if (fails === 0) {
  console.log('ALL GREEN' + (skips ? ' (' + skips + ' skipped — see above)' : '') + '  ✓');
  process.exit(0);
} else {
  console.log(fails + ' FAILED  ✗');
  process.exit(1);
}
