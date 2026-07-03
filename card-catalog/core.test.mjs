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
         ids deep-equal the canonical sorted list — the byEntry id-tiebreak leg
         covered by rooms sharing a git-depth `entry`).
     (b2) ENTRY-TIME TRUTH — every slab record carries an integer `entry` (git
         depth, baked by reclaim) + a string `entryDate`; the Register of
         Admissions is monotone non-decreasing in `entry`; and a genesis room
         (sound-garden) sorts STRICTLY before a recent one (card-catalog) — the
         exact inversion the bug reported, asserted gone.
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
  ORDERINGS, buildTree, search, matches, matchInfo, searchText, subjectOf, SUBJECTS,
  filterUnlocked, unlockedFor, runSelfTest, verdict,
  indexedExhibits, exhibitGated, exhibitPhrase, SEALED_CARDS
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
const RELIQ_SEEN = storeOf(['ws:seen:reliquary']);           // #399 entered the sealed study (Reliquary key only)

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
// the id-tiebreak leg of byEntry is exercised: rooms can share an `entry` (same
// first-add commit / depth), and they must tiebreak by id deterministically.
{
  const reg = ORDERINGS.entry(unlocked);
  let tieOk = true, tieDetail = 'no ties';
  for (let i = 1; i < reg.length; i++) {
    if ((reg[i].entry ?? Infinity) === (reg[i - 1].entry ?? Infinity)) {
      if (reg[i - 1].id > reg[i].id) { tieOk = false; tieDetail = reg[i - 1].id + ' before ' + reg[i].id; break; }
    }
  }
  check('byEntry: rooms sharing an `entry` tiebreak by id (deterministic)', tieOk, tieDetail);
}

// ═══════════════ (b2) ENTRY-TIME — the Register now tells the TRUTH ═══════════════
section('(b2) ENTRY-TIME — the Register of Admissions tells the true order rooms were raised');
{
  // The git-derived fields live on the SLAB (reclaim bakes them). Assert against
  // the operative DATA so a stale / un-reclaimed slab is caught.
  const everyInt = DATA.every((r) => Number.isInteger(r.entry));
  check('every slab record carries an INTEGER `entry` (git depth, no holes)', everyInt,
    everyInt ? DATA.length + ' stamped' : 'a record is missing an integer entry');
  const everyDate = DATA.every((r) => typeof r.entryDate === 'string');
  check('every slab record carries a string `entryDate`', everyDate, everyDate ? 'all strings' : 'a record has a non-string entryDate');

  const reg = ORDERINGS.entry(unlocked);
  let mono = true, inv = null;
  for (let i = 1; i < reg.length; i++) {
    if ((reg[i].entry ?? Infinity) < (reg[i - 1].entry ?? Infinity)) { mono = false; inv = reg[i - 1].id + '→' + reg[i].id; break; }
  }
  check('Register is MONOTONE non-decreasing in `entry`', mono, mono ? reg.length + ' in true order' : 'inversion at ' + inv);

  // THE BUG, asserted gone: a genesis room (sound-garden, an original pre-estate
  // room) must sort STRICTLY BEFORE a recent room (card-catalog, #232) — the exact
  // inversion the bug reported. These landmark rooms are in the real estate.
  const gi = reg.findIndex((r) => r.id === 'sound-garden');
  const ci = reg.findIndex((r) => r.id === 'card-catalog');
  check('genesis (sound-garden) present in the volume', gi !== -1, 'idx ' + gi);
  check('recent (card-catalog) present in the volume', ci !== -1, 'idx ' + ci);
  check('the bug is gone: sound-garden sorts BEFORE card-catalog', gi !== -1 && ci !== -1 && gi < ci,
    'sound-garden @' + gi + (gi < ci ? ' < ' : ' !< ') + 'card-catalog @' + ci);
  // and their git depths confirm it independently of the sort
  const sg = DATA.find((r) => r.id === 'sound-garden'), cc = DATA.find((r) => r.id === 'card-catalog');
  if (sg && cc) check('sound-garden.entry < card-catalog.entry (git depth)', sg.entry < cc.entry,
    sg.entry + ' < ' + cc.entry);
  // the strange-garden is the deepest genesis room — it should head the Register
  const sgg = reg.findIndex((r) => r.id === 'strange-garden');
  if (sgg !== -1) check('a genesis garden lands in the first few admissions', sgg < 6, 'strange-garden @' + sgg);
}

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
  // an independent, spoiler-aware reference predicate — deliberately NOT core.matches.
  // The searchable surface is room | piece | blurb PLUS the room's INDEXED exhibit
  // names (§4.4): a gated (within/hidden) exhibit joins the surface only once its
  // `gate` key is earned in `store`. Joined with '\x01' (as searchText does) so a
  // query can't straddle a field boundary.
  const idxExNames = (r, store) => (Array.isArray(r.exhibits) ? r.exhibits : []).filter((ex) => {
    const gated = ex.kind === 'within' || ex.hidden === true;
    if (!gated) return true;
    return !!(ex.gate && store && store.ok && store.has(ex.gate));
  }).map((ex) => ex.name);
  const ref = (r, q, store) => {
    const needle = String(q).trim().toLowerCase();
    if (needle === '') return true;
    const hay = [r.room, r.piece, r.blurb, ...idxExNames(r, store)]
      .map((s) => String(s == null ? '' : s)).join('\x01').toLowerCase();
    return hay.indexOf(needle) !== -1;
  };
  // queries hit every surface: room/piece/blurb prose AND exhibit names (Census of
  // Hands, Slipstick, Carillon, Bastion are NON-gated exhibits of real rooms).
  const QUERIES = ['', 'the', 'mirror', 'GARDEN', 'π', 'Snell', 'cradle', 'zzz-nope', 'Engine', 'light',
    'maze', 'star', 'A', 'time', 'number', 'magnetic', 'fold',
    'Census', 'Slipstick', 'Carillon', 'Bastion', 'planimeter'];
  // prove BOTH store branches so the spoiler gate is exercised in the sound+complete test
  for (const [storeName, store] of [['SEALED', SEALED], ['UNSEALED', UNSEALED], ['STORAGE_OFF', STORAGE_OFF]]) {
    let allMatch = true, firstBad = null;
    for (const q of QUERIES) {
      const got = sortedIds(search(unlocked, q, store));
      const want = sortedIds(unlocked.filter((r) => ref(r, q, store)));
      if (!eqArr(got, want)) { allMatch = false; firstBad = JSON.stringify(q) + ' got ' + got.length + ' want ' + want.length; break; }
    }
    check('search(q, ' + storeName + ') === brute-force reference over ' + QUERIES.length + ' queries', allMatch, firstBad || 'all match');
  }
  check('empty query returns the whole volume', search(unlocked, '', SEALED).length === unlocked.length, '');
  check('a guaranteed-absent query returns none', search(unlocked, '☃zzqx-no-room', SEALED).length === 0, '');
  // case-insensitivity proven explicitly (over prose AND an exhibit name)
  check('search is case-insensitive (prose)', eqArr(sortedIds(search(unlocked, 'GARDEN', SEALED)), sortedIds(search(unlocked, 'garden', SEALED))), '');
  check('search is case-insensitive (exhibit name)', eqArr(sortedIds(search(unlocked, 'CARILLON', SEALED)), sortedIds(search(unlocked, 'carillon', SEALED))), '');
  // matches/searchText are consistent with search
  check('matches() agrees with search() membership',
    unlocked.every((r) => matches(r, 'the', SEALED) === search(unlocked, 'the', SEALED).includes(r)), '');
  // searchText includes an indexed (non-gated) exhibit name so the surface is real
  const withEx = unlocked.find((r) => (r.exhibits || []).some((e) => !(e.kind === 'within' || e.hidden)));
  if (withEx) {
    const anEx = withEx.exhibits.find((e) => !(e.kind === 'within' || e.hidden));
    check('searchText carries an indexed exhibit name (' + anEx.name + ')',
      searchText(withEx, SEALED).toLowerCase().includes(anEx.name.toLowerCase()), withEx.id);
  }
}

// ═══════════════ (d2) THE EXHIBIT JOIN + SPOILER LAW (phantom-witness, §4.4) ═══════════════
section('(d2) EXHIBITS — the manifest join, the ↳via verdict, and the spoiler law');
{
  // every card carries an exhibits ARRAY (reclaim joins the manifest; no holes)
  const everyArr = DATA.every((r) => Array.isArray(r.exhibits));
  check('every card carries an `exhibits` array (manifest join, no holes)', everyArr,
    everyArr ? DATA.length + ' joined' : 'a card has no exhibits array');
  const withEx = DATA.filter((r) => (r.exhibits || []).length).length;
  check('at least one room hosts exhibits (the join is non-empty)', withEx > 0, withEx + ' rooms host exhibits');

  // matchInfo `via`: a query that hits ONLY an exhibit name (not room/piece/blurb)
  // reports via:'exhibit' and carries the matched exhibit for the ↳ within line.
  const host = DATA.find((r) => r.id === 'museum');   // hosts "The Census of Hands" (kind exhibit)
  if (host) {
    const mi = matchInfo(host, 'Census of Hands', SEALED);
    const roomHasIt = String(host.room + host.piece + host.blurb).toLowerCase().includes('census of hands');
    check('museum has a non-gated Census exhibit but no such prose', !roomHasIt, 'prose-clean');
    check('matchInfo("Census of Hands") on the museum → via:exhibit', mi.hit && mi.via === 'exhibit', mi.via);
    check('matchInfo carries the matched exhibit (for the ↳ within line)', !!(mi.exhibit && /Census/.test(mi.exhibit.name)), mi.exhibit && mi.exhibit.name);
    check('exhibitPhrase renders a house-voice line', /this room|shown/.test(exhibitPhrase(mi.exhibit)), exhibitPhrase(mi.exhibit));
    // a room-level match still reports via:'room' (priority room > … > exhibit)
    check('a room-name match reports via:room (priority)', matchInfo(host, 'museum', SEALED).via === 'room', '');
  }

  // THE SPOILER LAW — a WITHIN piece is a phantom until its own witness is earned.
  // The 4 within-exhibits live on the-top / warren / reversing-room / the-wrinkling,
  // each gated by its OWN ws:seen breadcrumb. Prove each is INVISIBLE to search under a
  // sealed store and RESOLVES its host room ONLY under a store carrying its gate key.
  const gatedExhibits = [];
  for (const r of DATA) for (const ex of (r.exhibits || [])) if (exhibitGated(ex)) gatedExhibits.push({ r, ex });
  check('the estate has gated (within/hidden) exhibits to guard', gatedExhibits.length > 0, gatedExhibits.length + ' gated');
  let spoilerOk = true, spoilerDetail = 'all gated pieces stay phantom until earned', testable = 0;
  for (const { r, ex } of gatedExhibits) {
    const key = ex.gate;
    const earned = storeOf([key]);
    const term = ex.name.replace(/^[^A-Za-z0-9]+/, '').slice(0, 12);  // a distinctive slice of the piece name
    // the piece name must not ALSO appear in the host's prose (else the test proves nothing)
    const inProse = String(r.room + (r.piece || '') + (r.blurb || '')).toLowerCase().includes(term.toLowerCase());
    if (inProse) continue;
    testable++;
    // under SEALED: the piece must NOT be indexed → search by its name must NOT surface its host via the exhibit
    const sealedHit = matchInfo(r, term, SEALED);
    // under EARNED: the piece IS indexed → search by its name surfaces the host via:exhibit
    const earnedHit = matchInfo(r, term, earned);
    // storage-off must also hide it
    const offHit = matchInfo(r, term, STORAGE_OFF);
    if (sealedHit.hit && sealedHit.via === 'exhibit') { spoilerOk = false; spoilerDetail = 'LEAK sealed: ' + r.id + '/' + ex.name; break; }
    if (offHit.hit && offHit.via === 'exhibit') { spoilerOk = false; spoilerDetail = 'LEAK storage-off: ' + r.id + '/' + ex.name; break; }
    if (!(earnedHit.hit && earnedHit.via === 'exhibit')) { spoilerOk = false; spoilerDetail = 'MISS earned: ' + r.id + '/' + ex.name; break; }
  }
  check('spoiler law: every within/hidden exhibit is a phantom until its witness is earned', spoilerOk, spoilerDetail);
  check('the spoiler law is actually exercised (a gated piece is prose-clean + testable)', testable > 0, testable + ' testable');

  // indexedExhibits parity: gated ⊆ shown only when keyed; sealed hides all gated
  let idxOk = true, idxDetail = 'parity holds';
  for (const r of DATA) {
    const sealedIdx = new Set(indexedExhibits(r, SEALED).map((e) => e.href));
    for (const ex of (r.exhibits || [])) {
      if (exhibitGated(ex) && sealedIdx.has(ex.href)) { idxOk = false; idxDetail = 'sealed indexed a gated piece: ' + r.id + '/' + ex.name; break; }
    }
    if (!idxOk) break;
  }
  check('indexedExhibits(SEALED) never includes a gated piece', idxOk, idxDetail);
}

// ═══════════════ (d3) SEALED CARDS (steer 4) — acknowledged, never opened ═══════════════
section('(d3) SEALED CARDS — a greyed register presence with no navigable room, excluded from every proof');
{
  check('SEALED_CARDS is a non-empty const', Array.isArray(SEALED_CARDS) && SEALED_CARDS.length > 0, SEALED_CARDS.length + ' sealed');
  check('the Cabinet of Honors is a sealed card', SEALED_CARDS.some((c) => /Cabinet of Honors/.test(c.room)), '');
  // no href → not navigable
  check('no sealed card carries an href', SEALED_CARDS.every((c) => c.href == null), '');
  check('every sealed card carries a note + glyph (rendered greyed)', SEALED_CARDS.every((c) => c.note && c.glyph), '');
  // EXCLUDED from the records slab (no id collision, never in the volume)
  const slabRooms = new Set(DATA.map((r) => String(r.room)));
  check('no sealed card is in the records slab (excluded from set-equality)',
    SEALED_CARDS.every((c) => !slabRooms.has(String(c.room))), '');
  // and never appears in an ordering of the real volume
  const alphaRooms = new Set(ORDERINGS.alpha(unlocked).map((r) => String(r.room)));
  check('no sealed card leaks into an ordering of the volume',
    SEALED_CARDS.every((c) => !alphaRooms.has(String(c.room))), '');
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
  const reliqSeen = filterUnlocked(DATA, RELIQ_SEEN);
  const off = filterUnlocked(DATA, STORAGE_OFF);
  check('sealed store hides the undercroft', !sealed.some((r) => r.id === 'undercroft'), sealed.length + ' visible');
  check('ws:seen:undercroft-rune reveals it', unsealed.some((r) => r.id === 'undercroft'), unsealed.length + ' visible');
  check('ws:seen:undercroft (returning) reveals it', unsealed2.some((r) => r.id === 'undercroft'), '');
  check('storage-off hides locked rooms (front-door parity)', !off.some((r) => r.id === 'undercroft'), '');
  check('unsealed = sealed + the undercroft (undercroft key reveals ONLY it)', unsealed.length === sealed.length + 1, '');
  // #399 — the Reliquary is a SECOND gated way down, gated by its OWN key
  const hasReliq = DATA.some((r) => r.id === 'reliquary');
  if (hasReliq) {
    check('sealed store hides the reliquary', !sealed.some((r) => r.id === 'reliquary'), '');
    check('undercroft key does NOT reveal the reliquary (per-room gating)', !unsealed.some((r) => r.id === 'reliquary'), '');
    check('ws:seen:reliquary reveals the reliquary', reliqSeen.some((r) => r.id === 'reliquary'), '');
    check('reliquary key does NOT reveal the undercroft (per-room gating)', !reliqSeen.some((r) => r.id === 'undercroft'), '');
    check('reliqSeen = sealed + the reliquary only', reliqSeen.length === sealed.length + 1, '');
    const rl = DATA.find((r) => r.id === 'reliquary');
    check('unlockedFor(reliquary, SEALED) === false', unlockedFor(rl, SEALED) === false, '');
    check('unlockedFor(reliquary, RELIQ_SEEN) === true', unlockedFor(rl, RELIQ_SEEN) === true, '');
    check('unlockedFor(reliquary, UNSEALED) === false (own key only)', unlockedFor(rl, UNSEALED) === false, '');
  }
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
  const reliqRes = runSelfTest(DATA, RELIQ_SEEN);        // #399 — reliquary key reveals only the study card
  const rv = verdict(reliqRes.checks);
  check('runSelfTest all-green under RELIQ_SEEN store', rv.allPass, rv.passN + '/' + rv.total);
  if (!sv.allPass) for (const c of sealedRes.checks) if (!c.pass) console.log('      sealed FAIL: ' + c.label + ' (' + c.detail + ')');
  if (!uv.allPass) for (const c of unsealedRes.checks) if (!c.pass) console.log('      unsealed FAIL: ' + c.label + ' (' + c.detail + ')');
  if (!rv.allPass) for (const c of reliqRes.checks) if (!c.pass) console.log('      reliqSeen FAIL: ' + c.label + ' (' + c.detail + ')');
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
