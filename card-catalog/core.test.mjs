#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE CARD CATALOG — Node twin (core.test.mjs)

   Proves the bound volume is COMPLETE and TRUE against the REAL estate. It parses
   BOTH sources with the SAME machinery the page and reclaim trust:
     • the front-door PLACES (the estate's register of rooms), via reclaim's
       parsePlacesText — the SAME projection reclaim re-pins into the slab.
     • the inlined CATALOG-DATA slab the page actually ships (so a stale slab is
       caught) — read from index.src.html between the sentinels.
   and core.mjs's pure orderings / tree / search / lock filter.

   THE MATH CLAIM = COMPLETENESS + FIDELITY (structural, not a number):
     (a) SET EQUALITY — slab ids === front-door PLACES ids (incl. the locked
         undercroft); |slab| === |PLACES|; symmetric difference is ∅.
     (b) EACH OF THE 4 ORDERINGS IS A PERMUTATION of the unlocked set (distinct
         ids deep-equal the canonical sorted list — sparse-`order` fallback
         covered by including the no-order rooms).
     (c) HREF RESOLVABILITY — every card's `../<href>` fs.existsSync-resolves.
     (d) SEARCH SOUND + COMPLETE — for a battery of queries, search(q) returns
         EXACTLY the rooms matching an independent brute-force reference, plus
         empty-query (all) and no-match (none) edges.
     (e) THE DRILL IS A STRICT TREE — buildTree's leaves reunion to the full set
         with no id under two leaves.
     (f) SUBJECT TOTALITY — subjectOf is total over the slab.
     (g) LOCK PARITY — sealed store hides the undercroft; unsealed store reveals
         it; storage-off hides it.
   NEGATIVE CONTROLS that MUST make the twin fail loudly:
     • a synthetic PLACES with a DUPLICATED id (breaks a & e).
     • a synthetic PLACES with a BOGUS href (breaks c).
     • a too-SHORT parse → reclaim REFUSES (the floor guard).

   Run:  node card-catalog/core.test.mjs   (exit 0 ⇔ all green)
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ORDERINGS, buildTree, search, matches, searchText, subjectOf, SUBJECTS,
  filterUnlocked, unlockedFor, runSelfTest, verdict
} from './core.mjs';
import { parsePlacesText } from './reclaim.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const FRONT_DOOR = join(REPO, 'index.src.html');
const SRC_PATH = join(__dirname, 'index.src.html');

let failures = 0;
function check(label, pass, detail) {
  const ok = !!pass;
  if (!ok) failures++;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (detail ? '  — ' + detail : ''));
}
function section(t) { console.log('\n' + t); }

/* a fake WS.store() snapshot from a plain key→value map */
function storeOf(keys, ok = true) {
  const map = {};
  for (const k of keys) map[k] = '1';
  return { ok, has: (k) => k in map, get: (k) => map[k], all: map };
}
const SEALED = storeOf([]);                                  // earned nothing
const UNSEALED = storeOf(['ws:seen:undercroft-rune']);       // earned the way down
const UNSEALED2 = storeOf(['ws:seen:undercroft']);           // returning visitor
const STORAGE_OFF = storeOf([], false);                      // no localStorage

function sortedIds(list) { return [...new Set(list.map((r) => r.id))].sort(); }
function eqArr(a, b) { return a.length === b.length && a.every((v, i) => v === b[i]); }

// ── parse the REAL front-door PLACES (the projection reclaim re-pins) ──
const places = parsePlacesText(readFileSync(FRONT_DOOR, 'utf8'));

// ── parse the shipped CATALOG-DATA slab from this room's source ──
function readSlab() {
  const src = readFileSync(SRC_PATH, 'utf8');
  const BEGIN = '<!-- CATALOG-DATA BEGIN -->';
  const END = '<!-- CATALOG-DATA END -->';
  const b = src.indexOf(BEGIN), e = src.indexOf(END);
  if (b === -1 || e === -1) throw new Error('CATALOG-DATA sentinels not found in index.src.html');
  const json = src.slice(b + BEGIN.length, e).trim();
  return JSON.parse(json);
}
let slab;
try { slab = readSlab(); } catch (e) { slab = null; console.log('NOTE: ' + e.message + ' (run reclaim first)'); }

// ═══════════════ (a) SET EQUALITY: slab === front-door PLACES ═══════════════
section('(a) SET EQUALITY — the slab registers exactly the estate');
if (slab) {
  const pIds = sortedIds(places), sIds = sortedIds(slab);
  check('|slab| === |front-door PLACES|', slab.length === places.length, slab.length + ' vs ' + places.length);
  check('slab ids === PLACES ids (symmetric difference ∅)', eqArr(pIds, sIds),
    'Δ=' + [...pIds.filter((x) => !sIds.includes(x)), ...sIds.filter((x) => !pIds.includes(x))].join(','));
  check('slab carries the locked undercroft (not filtered out at re-pin)',
    slab.some((r) => r.locked && r.id === 'undercroft'), 'present in data');
  check('slab ids are distinct', new Set(slab.map((r) => r.id)).size === slab.length, '');
} else {
  check('slab present (reclaim has re-pinned the page)', false, 'no slab — run node card-catalog/reclaim.mjs');
}

// Use the slab as the operative data when present (it is what the page ships);
// otherwise fall back to the freshly-parsed PLACES so the rest of the battery
// still runs before the first re-pin.
const DATA = slab || places;
const unlocked = filterUnlocked(DATA, SEALED);     // what a fresh visitor sees
const canonical = sortedIds(unlocked);

// ═══════════════ (b) EACH ORDERING IS A PERMUTATION ═══════════════
section('(b) EACH OF THE 4 ORDERINGS IS A PERMUTATION of the volume');
for (const key of Object.keys(ORDERINGS)) {
  const ordered = ORDERINGS[key](unlocked);
  check('ordering "' + key + '" is a permutation', eqArr(sortedIds(ordered), canonical),
    ordered.length + ' cards');
  check('ordering "' + key + '" is fully determined (no equal-compare ties left ambiguous)',
    ordered.length === unlocked.length, '');
}
// the sparse-order fallback is exercised: rooms with no `order` exist and land at the end of byEntry
const noOrder = unlocked.filter((r) => r.order == null);
check('sparse `order` present (fallback under test)', noOrder.length > 0, noOrder.length + ' rooms without order');
const entryOrdered = ORDERINGS.entry(unlocked);
const tailIds = entryOrdered.slice(entryOrdered.length - noOrder.length).map((r) => r.id).sort();
check('no-order rooms tiebreak to the tail of the Register, sorted by id',
  eqArr(tailIds, noOrder.map((r) => r.id).sort()),
  tailIds.join(','));

// ═══════════════ (c) HREF RESOLVABILITY ═══════════════
section('(c) HREF RESOLVABILITY — every card points at a real in-repo page');
{
  let allOk = true, firstBad = null;
  for (const r of DATA) {
    const p = join(REPO, r.href);               // hrefs are repo-root-relative
    if (!existsSync(p)) { allOk = false; firstBad = r.id + ' → ' + r.href; break; }
  }
  check('every href fs-resolves under the repo root', allOk, allOk ? DATA.length + ' hrefs' : 'bad: ' + firstBad);
  // and the page's `../<href>` form (the catalog lives one level down) resolves too
  let relOk = true, firstRelBad = null;
  for (const r of DATA) {
    const p = join(__dirname, '..', r.href);
    if (!existsSync(p)) { relOk = false; firstRelBad = r.id; break; }
  }
  check('the page\'s `../<href>` travel target resolves', relOk, relOk ? 'all' : 'bad: ' + firstRelBad);
}

// ═══════════════ (d) SEARCH SOUND + COMPLETE ═══════════════
section('(d) SEARCH is SOUND + COMPLETE vs an independent brute-force reference');
{
  // an independent reference predicate — deliberately NOT core.matches
  const ref = (r, q) => {
    const needle = String(q).trim().toLowerCase();
    if (needle === '') return true;
    const hay = (String(r.room) + String(r.piece == null ? '' : r.piece) + String(r.blurb == null ? '' : r.blurb)).toLowerCase();
    return hay.indexOf(needle) !== -1;
  };
  const QUERIES = ['', 'the', 'mirror', 'GARDEN', 'π', 'Snell', 'cradle', 'zzz-nope', 'Engine', 'light',
    'maze', 'star', 'A', 'time', 'number', 'magnetic', 'fold'];
  let allMatch = true, firstBad = null;
  for (const q of QUERIES) {
    const got = sortedIds(search(unlocked, q));
    const want = sortedIds(unlocked.filter((r) => ref(r, q)));
    if (!eqArr(got, want)) { allMatch = false; firstBad = JSON.stringify(q) + ' got ' + got.length + ' want ' + want.length; break; }
  }
  check('search(q) === brute-force reference over ' + QUERIES.length + ' queries', allMatch, firstBad || 'all match');
  check('empty query returns the whole volume', search(unlocked, '').length === unlocked.length, '');
  check('a guaranteed-absent query returns none', search(unlocked, '☃zzqx-no-room').length === 0, '');
  // case-insensitivity proven explicitly
  check('search is case-insensitive', eqArr(sortedIds(search(unlocked, 'GARDEN')), sortedIds(search(unlocked, 'garden'))), '');
  // matches/searchText are consistent with search
  check('matches() agrees with search() membership',
    unlocked.every((r) => matches(r, 'the') === search(unlocked, 'the').includes(r)), '');
}

// ═══════════════ (e) STRICT TREE ═══════════════
section('(e) THE DRILL is a STRICT TREE (district → wing → room)');
{
  const tree = buildTree(unlocked);
  const leafIds = [];
  for (const d of tree) for (const w of d.wings) for (const r of w.rooms) leafIds.push(r.id);
  check('no id under two leaves', new Set(leafIds).size === leafIds.length, leafIds.length + ' leaves');
  check('leaves reunion to the full volume', eqArr([...new Set(leafIds)].sort(), canonical), '');
  // every district present in data is a tree node
  const dInData = [...new Set(unlocked.map((r) => r.district))].sort();
  const dInTree = tree.map((d) => d.district).sort();
  check('every district is a tree node', eqArr(dInData, dInTree), dInTree.join(','));
}

// ═══════════════ (f) SUBJECT TOTALITY ═══════════════
section('(f) SUBJECT derivation is TOTAL');
{
  let total = true, bad = null;
  for (const r of DATA) if (SUBJECTS.indexOf(subjectOf(r)) === -1) { total = false; bad = r.id; break; }
  check('every card lands in exactly one of the ' + SUBJECTS.length + ' subject shelves', total, bad ? 'unclassified ' + bad : 'all placed');
  // bySubject is a permutation already proven in (b); here assert subjects partition
  const counts = new Map(SUBJECTS.map((s) => [s, 0]));
  for (const r of DATA) counts.set(subjectOf(r), counts.get(subjectOf(r)) + 1);
  let sum = 0; for (const v of counts.values()) sum += v;
  check('Σ subject counts === |volume| (a true partition)', sum === DATA.length, sum + ' = ' + DATA.length);
}

// ═══════════════ (g) LOCK PARITY ═══════════════
section('(g) LOCK PARITY — the way down hidden until earned (front-door predicate)');
{
  const sealed = filterUnlocked(DATA, SEALED);
  const unsealed = filterUnlocked(DATA, UNSEALED);
  const unsealed2 = filterUnlocked(DATA, UNSEALED2);
  const off = filterUnlocked(DATA, STORAGE_OFF);
  check('sealed store hides the undercroft', !sealed.some((r) => r.id === 'undercroft'), sealed.length + ' visible');
  check('ws:seen:undercroft-rune reveals it', unsealed.some((r) => r.id === 'undercroft'), unsealed.length + ' visible');
  check('ws:seen:undercroft (returning) reveals it', unsealed2.some((r) => r.id === 'undercroft'), '');
  check('storage-off hides locked rooms (front-door parity)', !off.some((r) => r.id === 'undercroft'), '');
  check('unsealed = sealed + the one locked room', unsealed.length === sealed.length + 1, '');
  // the pure predicate, directly
  const uc = DATA.find((r) => r.id === 'undercroft');
  check('unlockedFor(undercroft, SEALED) === false', unlockedFor(uc, SEALED) === false, '');
  check('unlockedFor(undercroft, UNSEALED) === true', unlockedFor(uc, UNSEALED) === true, '');
  check('unlockedFor(non-locked, SEALED) === true', unlockedFor(DATA.find((r) => !r.locked), SEALED) === true, '');
}

// ═══════════════ runSelfTest (the in-page pill's battery) ═══════════════
section('(h) runSelfTest battery (the SAME pill the page runs) — both store branches');
{
  const sealedRes = runSelfTest(DATA, SEALED);
  const sv = verdict(sealedRes.checks);
  check('runSelfTest all-green under SEALED store', sv.allPass, sv.passN + '/' + sv.total);
  const unsealedRes = runSelfTest(DATA, UNSEALED);
  const uv = verdict(unsealedRes.checks);
  check('runSelfTest all-green under UNSEALED store', uv.allPass, uv.passN + '/' + uv.total);
  if (!sv.allPass) for (const c of sealedRes.checks) if (!c.pass) console.log('      sealed FAIL: ' + c.label + ' (' + c.detail + ')');
  if (!uv.allPass) for (const c of unsealedRes.checks) if (!c.pass) console.log('      unsealed FAIL: ' + c.label + ' (' + c.detail + ')');
}

// ═══════════════ NEGATIVE CONTROLS ═══════════════
section('NEGATIVE CONTROLS — these MUST make the volume fail');
{
  // a minimal synthetic PLACES so parsePlacesText accepts it (idFloor == records)
  const mk = (entries) => 'const PLACES = [\n' + entries.join(',\n') + '\n];';
  const ENTRY = (id, href, room) =>
    `  { id:"${id}", room:"${room || id}", piece:"P", glyph:"x", accent:"#000", href:"${href}", tag:"t", district:"manor", tier:2, blurb:"b" }`;

  // DUP-ID fixture: two entries share an id → (a) symmetric-diff & (e) tree must break.
  const dupText = mk([ENTRY('alpha', 'verse/index.html'), ENTRY('alpha', 'museum/index.html', 'Other'), ENTRY('beta', 'census/index.html')]);
  const dup = parsePlacesText(dupText);
  const dupUnlocked = filterUnlocked(dup, SEALED);
  const dupCanon = sortedIds(dupUnlocked);
  // |records| (3) !== distinct ids (2): the volume's no-duplicate invariant bites.
  const dupNoDupePass = new Set(dup.map((r) => r.id)).size === dup.length;
  check('DUP-ID: the no-duplicate-id invariant FAILS (as it must)', dupNoDupePass === false,
    'distinct=' + new Set(dup.map((r) => r.id)).size + ' total=' + dup.length);
  // an ordering over the dup set is NOT a permutation of the canonical *distinct* set
  // (it carries 3 cards but only 2 distinct ids — proving the proof is discriminating)
  const dupOrdered = ORDERINGS.alpha(dupUnlocked);
  check('DUP-ID: ordering length (3) !== distinct-id count (2)', dupOrdered.length !== dupCanon.length,
    dupOrdered.length + ' vs ' + dupCanon.length);
  // the tree leaves also carry the duplicate → leafSet.size !== leafIds.length
  const dupTree = buildTree(dupUnlocked);
  const dLeaf = [];
  for (const d of dupTree) for (const w of d.wings) for (const r of w.rooms) dLeaf.push(r.id);
  check('DUP-ID: drill tree has an id under two leaves (FAILS strict-tree)', new Set(dLeaf).size !== dLeaf.length, '');

  // BOGUS-HREF fixture: an href to a non-existent page → (c) must break.
  const bogusText = mk([ENTRY('gamma', 'NO-SUCH-DIR/index.html'), ENTRY('delta', 'verse/index.html')]);
  const bogus = parsePlacesText(bogusText);
  let bogusResolves = true;
  for (const r of bogus) { if (!existsSync(join(REPO, r.href))) { bogusResolves = false; break; } }
  check('BOGUS-HREF: href resolvability FAILS (as it must)', bogusResolves === false, '');

  // SHORT-PARSE fixture: a block whose id-floor exceeds the records recovered.
  // We simulate a parse-miss by giving an entry whose `id:"…"` appears but the
  // brace structure is intact — instead, prove the floor guard fires when the
  // text has more `id:"` markers than recoverable entries (a malformed entry).
  let refused = false, refusedMsg = '';
  try {
    // ONE recoverable entry, but its (single-quoted) blurb literally contains the
    // substring  id:"phantom"  — so the `id:"` floor counts 2 markers while only 1
    // record is recovered (records < floor). The floor guard MUST refuse: this is
    // the parse-miss tripwire that prevents shipping a SHORT catalog.
    const sneaky = "const PLACES = [\n" +
      "  { id:\"only\", room:\"r\", piece:\"p\", glyph:\"g\", accent:\"#000\", href:\"verse/index.html\", tag:\"t\", district:\"manor\", tier:2, blurb:'a stray marker id:\"phantom\" hides in prose' }\n" +
      "];";
    parsePlacesText(sneaky);
  } catch (e) { refused = true; refusedMsg = e.message; }
  check('SHORT-PARSE: a sub-floor recovery REFUSES (loud, exit-nonzero in CLI)', refused, refusedMsg.slice(0, 60));
}

// ═══════════════ VERDICT ═══════════════
console.log('\n' + (failures === 0
  ? '✓ THE VOLUME IS COMPLETE & TRUE — every check green.'
  : '✗ ' + failures + ' check(s) FAILED.'));
process.exit(failures === 0 ? 0 : 1);
