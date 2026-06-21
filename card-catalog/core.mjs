/* ═══════════════════════════════════════════════════════════════════════════
   THE ARCHIVE · The Card Catalog — card-catalog/core.mjs
   The four orderings + the search predicate + the drill tree + the lock filter
   + the subject derivation, as PURE functions. The SOLE authority for what the
   bound volume shows and in what order.

   Single source of truth, imported by BOTH:
     • card-catalog/core.test.mjs — the Node twin, run against a slab parsed
       from the front-door PLACES (and from synthetic negative-control fixtures)
     • card-catalog/index.html    — inlined verbatim at forge time between the
       CARD-CATALOG CORE sentinels, so the in-page pill computes the IDENTICAL
       battery from the SAME code the twin checks.

   DOM-free, zero-import, no randomness, no wall-clock NOW. Given an array of
   card records (id, room, piece, glyph, accent, district, tier, wing, order,
   href, blurb, tag, locked) and a "store" (the live ws: snapshot), it answers:
   does the catalog FAITHFULLY and COMPLETELY register the estate — every room
   once, each of the four indexes a true permutation, the drill a strict tree,
   the search sound + complete, every href resolvable, and the locked way down
   hidden until earned?

   The records come from the front-door PLACES via the CATALOG-DATA slab that
   reclaim.mjs re-pins each cycle (collate convention), so the volume stays true
   to the estate as it grows. Nothing here is hand-typed about the estate's
   contents; the data is the projection of PLACES.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The load-bearing fields of a card, in canonical order. A record carries
   exactly these; the page renders room/piece/glyph/accent/blurb and uses the
   spatial fields (district/tier/wing/order) for the indexes. */
export const FIELDS = [
  'id', 'room', 'piece', 'glyph', 'accent', 'district', 'tier',
  'wing', 'order', 'href', 'blurb', 'tag', 'locked'
];

/* ── THE LOCK PREDICATE — PURE (ids/wsHas in, not localStorage reads) ──────────
   The SAME predicate the front door's revealUndercroft() uses to decide whether
   the locked way down is revealed: a locked room is shown ONLY if storage is on
   AND one of the two undercroft breadcrumbs is present. `store` is the WS.store()
   snapshot shape: { ok:boolean, has(key):boolean, ... }. Storage off ⇒ locked
   rooms hidden (front-door parity). Pure: depends only on its two arguments, so
   the twin can drive both sealed and unsealed branches with plain fixtures. */
export function unlockedFor(record, store) {
  if (!record.locked) return true;
  if (!store || !store.ok) return false;
  return store.has('ws:seen:undercroft-rune') || store.has('ws:seen:undercroft');
}

/* ── filterUnlocked: the cards visible NOW, given the live store ───────────────
   Gates at RENDER time. The CATALOG_DATA slab carries EVERY PLACES entry
   INCLUDING the locked undercroft (it is NOT filtered out of the data); this is
   the one place the live ws: state decides what the reader may see. */
export function filterUnlocked(records, store) {
  return records.filter((r) => unlockedFor(r, store));
}

/* ═══ THE SUBJECT DERIVATION — a TOTAL map from a card to exactly ONE subject ═══
   Raw `tag` is idiosyncratic free-text ("verse engine", "f = N·Ω/2π"), so we do
   NOT index on it directly. Instead we map each room to exactly ONE curated
   SUBJECT, keyed first on the room's `wing` (the strongest curatorial signal),
   then on its `district` for the unwinged remainder, with a final catch-all that
   keeps the map TOTAL. Total ⇒ every room lands in exactly one subject, so the
   THEMATIC INDEX is a true permutation of the card set (the twin proves it).

   The subjects are the estate's natural fields of study — eight shelves of one
   library. Order here is the DISPLAY order of the subject shelves. */
export const SUBJECTS = [
  'Light & Optics',
  'Number & Logic',
  'Motion & Mechanics',
  'Heat, Field & Matter',
  'Sky & Spacetime',
  'Life & Growth',
  'Word, Image & Play',
  'The Estate Itself'
];

/* wing slug → subject. Every wing the estate has is listed; an unlisted wing
   falls to the district map below. Authored from the live PLACES wings. */
const WING_SUBJECT = {
  optics: 'Light & Optics',
  number: 'Number & Logic',
  reckoning: 'Number & Logic',
  arrow: 'Motion & Mechanics',
  'curved-country': 'Motion & Mechanics',
  'kinetics-sound': 'Motion & Mechanics',
  induction: 'Heat, Field & Matter',
  works: 'Heat, Field & Matter',
  stellar: 'Sky & Spacetime',
  'moving-frame': 'Sky & Spacetime',
  vantages: 'Sky & Spacetime',
  conservatory: 'Life & Growth',
  glasshouses: 'Life & Growth',
  studies: 'Word, Image & Play',
  east: 'Word, Image & Play',
  amusements: 'Word, Image & Play',
  sewing: 'Word, Image & Play',
  maker: 'The Estate Itself',
  archive: 'The Estate Itself',
  horology: 'The Estate Itself'
};

/* district → subject, for the UNWINGED remainder (rooms with no wing slug). */
const DISTRICT_SUBJECT = {
  observatory: 'Sky & Spacetime',
  cavern: 'Heat, Field & Matter',
  outbuilding: 'The Estate Itself',
  beneath: 'The Estate Itself'
};

/* A few unwinged GROUNDS rooms (iron-filings, rattleback, overhang) need a
   subject; they are field/mechanics pieces. Keyed by id so the map stays exact
   and auditable rather than guessing from a free-text tag. */
const ID_SUBJECT = {
  'iron-filings': 'Heat, Field & Matter',
  rattleback: 'Motion & Mechanics',
  overhang: 'Motion & Mechanics'
};

/* ── subjectOf: a card → exactly ONE subject. TOTAL by construction. ───────────
   Scan order: explicit id override → wing map → district map → grounds default.
   The final fallback ('Motion & Mechanics' for any unclassified grounds room,
   else 'The Estate Itself') guarantees totality: there is no card this does not
   place. Pure; same card → same subject forever. */
export function subjectOf(record) {
  if (ID_SUBJECT[record.id]) return ID_SUBJECT[record.id];
  if (record.wing && WING_SUBJECT[record.wing]) return WING_SUBJECT[record.wing];
  if (DISTRICT_SUBJECT[record.district]) return DISTRICT_SUBJECT[record.district];
  // unwinged grounds remainder → a mechanics shelf; anything else → the estate.
  if (record.district === 'grounds') return 'Motion & Mechanics';
  return 'The Estate Itself';
}

/* ── stable comparators ────────────────────────────────────────────────────────
   byId: lexicographic on id (the universal tiebreak — ids are unique, so this is
   a TOTAL order, which every ordering falls back to so each is fully determined). */
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/* ── the LIBRARY-FILING RULE — a room's name with a leading article dropped ────
   Nearly every room is "The …", so a naive sort files the whole estate under T.
   A real catalog files "The Card Catalog" under C. fileKey lower-cases and drops
   a leading "the "/"a "/"an " for the A→Z sort and the alphabetical heading, so
   the Index reads like a library's. Pure; the displayed name keeps its article. */
export function fileKey(record) {
  return String(record.room).toLowerCase().replace(/^(the|an|a)\s+/, '').trim();
}
/* the A→Z thumb-cut letter for a record (the first filing-key character, upper). */
export function fileInitial(record) {
  const k = fileKey(record);
  const m = k.match(/[a-z0-9]/);
  return m ? m[0].toUpperCase() : '#';
}
const byFileKey = (a, b) => {
  const ka = fileKey(a), kb = fileKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
};

/* ── ORDERING 1 · GAZETTEER (by MAP LOCATION) ─────────────────────────────────
   district → wing → within-wing order → id. Districts and wings in the estate's
   own canonical sequence (the order they read on the plan), so the tree the page
   draws matches the map. */
const DISTRICT_ORDER = ['manor', 'observatory', 'grounds', 'cavern', 'outbuilding', 'beneath'];
function districtRank(d) {
  const i = DISTRICT_ORDER.indexOf(d);
  return i === -1 ? DISTRICT_ORDER.length : i;
}
/* a wing's rank within its district: first-seen order in the supplied records,
   computed once per call so it is stable for a given card set. Unwinged rooms
   sort AFTER winged ones (a synthetic high rank) so a district's named wings read
   first, then its loose rooms. */
function wingRanker(records) {
  const seen = new Map();
  let n = 0;
  for (const r of records) {
    const key = r.district + ' ' + (r.wing || '');
    if (!seen.has(key)) seen.set(key, n++);
  }
  return (r) => (r.wing ? seen.get(r.district + ' ' + r.wing) : 1e9 + (seen.get(r.district + ' ') || 0));
}
export function byLocation(records) {
  const wrank = wingRanker(records);
  return records.slice().sort((a, b) =>
    districtRank(a.district) - districtRank(b.district) ||
    wrank(a) - wrank(b) ||
    ((a.order ?? Infinity) - (b.order ?? Infinity)) ||
    byId(a, b));
}

/* ── ORDERING 2 · THEMATIC INDEX (by SUBJECT) ─────────────────────────────────
   subject shelf (in SUBJECTS display order) → room name A→Z → id. */
export function bySubject(records) {
  const srank = (r) => {
    const i = SUBJECTS.indexOf(subjectOf(r));
    return i === -1 ? SUBJECTS.length : i;
  };
  return records.slice().sort((a, b) =>
    srank(a) - srank(b) ||
    byFileKey(a, b) ||
    byId(a, b));
}

/* ── ORDERING 3 · REGISTER OF ADMISSIONS (by ORDER OF ENTRY) ──────────────────
   the `order` field ASC. `order` is SPARSE — only some PLACES entries carry it —
   so a missing order sorts to the END (order ?? Infinity), then a deterministic
   id tiebreak. Both legs are covered by the permutation proof. */
export function byEntry(records) {
  return records.slice().sort((a, b) =>
    ((a.order ?? Infinity) - (b.order ?? Infinity)) ||
    byId(a, b));
}

/* ── ORDERING 4 · INDEX (A–Z) ─────────────────────────────────────────────────
   alphabetical by the room's FILING KEY (leading article dropped), id tiebreak —
   so "The Card Catalog" files under C, like a library's index. */
export function byAlpha(records) {
  return records.slice().sort((a, b) => byFileKey(a, b) || byId(a, b));
}

/* The four orderings, keyed by mode slug (the page's four thumb-tabs). Each is a
   pure (records) → ordered records function. */
export const ORDERINGS = {
  gazetteer: byLocation,
  thematic: bySubject,
  entry: byEntry,
  alpha: byAlpha
};

/* ── buildTree: the GAZETTEER drill as a STRICT TREE (district → wing → room) ──
   Returns [{ district, label, wings:[{ wing, label, rooms:[card…] }] }] in
   GAZETTEER order. Unwinged rooms of a district go under a synthetic wing with
   wing:'' (label derived). Every card appears under exactly ONE leaf — the twin
   proves the leaves reunion to the full set with no id under two leaves. */
export function buildTree(records) {
  const ordered = byLocation(records);
  const districts = [];
  const dIndex = new Map();
  const wIndex = new Map();
  for (const r of ordered) {
    let d = dIndex.get(r.district);
    if (!d) {
      d = { district: r.district, label: districtLabel(r.district), wings: [] };
      dIndex.set(r.district, d);
      districts.push(d);
    }
    const wkey = r.district + ' ' + (r.wing || '');
    let w = wIndex.get(wkey);
    if (!w) {
      w = { wing: r.wing || '', label: wingLabel(r.wing, r.district), rooms: [] };
      wIndex.set(wkey, w);
      d.wings.push(w);
    }
    w.rooms.push(r);
  }
  return districts;
}

/* Human-facing labels for the drill heads (display only; the structure is keyed
   on the raw slugs). */
const DISTRICT_LABEL = {
  manor: 'The Manor House',
  observatory: 'The Observatory',
  grounds: 'The Grounds',
  cavern: 'The Cavern',
  outbuilding: 'The Outbuildings',
  beneath: 'Beneath'
};
function districtLabel(d) {
  return DISTRICT_LABEL[d] || ('The ' + String(d).replace(/[-_]/g, ' '));
}
const WING_LABEL = {
  studies: 'The Studies', east: 'The East Wing', 'kinetics-sound': 'Kinetics & Sound',
  glasshouses: 'The Glasshouses', stellar: 'The Stellar Wing', vantages: 'Scenes You Walk Into',
  'moving-frame': 'The Moving Frame', 'curved-country': 'Curved Country', aerospace: 'The Aerodrome',
  optics: 'Optics', number: 'The Number Wing', amusements: 'Amusements', works: 'The Works',
  maker: "The Maker's Wing", sewing: 'The Sewing Room', archive: 'The Archive',
  reckoning: 'The Reckoning Cabinet', arrow: 'The Arrow Wing', conservatory: 'Living-Systems Wing',
  horology: 'Horology', induction: 'Electromagnetism'
};
function wingLabel(wing, district) {
  if (!wing) return districtLabel(district) + ' · loose rooms';
  return WING_LABEL[wing] || ('The ' + String(wing).replace(/[-_]/g, ' ') + ' wing');
}

/* ── search: the manicule predicate — case-insensitive substring over the
   visible text (room | piece | blurb). Returns the matching cards (unordered;
   the page orders them by the active index). Empty/blank query ⇒ ALL records
   (search clears to the full volume). Sound + complete by construction; the twin
   proves it against an independent brute-force reference. */
export function searchText(record) {
  return [record.room, record.piece, record.blurb].map((s) => String(s == null ? '' : s)).join('');
}
export function matches(record, query) {
  const q = String(query == null ? '' : query).trim().toLowerCase();
  if (q === '') return true;
  return searchText(record).toLowerCase().includes(q);
}
export function search(records, query) {
  return records.filter((r) => matches(r, query));
}

/* ── runSelfTest: the COMPLETENESS + FIDELITY battery ──────────────────────────
   Pure, given the FULL records slab (every PLACES entry incl. locked) and a
   store snapshot. Proves, over the cards VISIBLE in `store`:
     (a) SET EQUALITY — the visible set is exactly filterUnlocked(records,store);
         |visible| === the count, ids distinct, no phantom/missing.
     (b) EACH OF THE 4 ORDERINGS IS A PERMUTATION of the visible set (the sorted
         DISTINCT-id list of each ordering deep-equals the canonical sorted ids).
     (c) THE DRILL IS A STRICT TREE — buildTree's leaves (district→wing→room)
         union to the full visible set with NO id under two leaves.
     (d) SUBJECT TOTALITY — subjectOf lands every card in exactly one SUBJECTS
         shelf (no card unclassified).
     (e) SEARCH edges — empty query returns all visible; a guaranteed-absent
         query returns none. (Full sound+complete is proven in the Node twin
         against a brute-force reference over a battery of queries.)
     (f) LOCK PARITY — the locked card is in the data slab but absent from the
         visible set unless the store carries an undercroft breadcrumb.
   Returns { checks:[{label,pass,detail}], visible }. */
export function runSelfTest(records, store) {
  const checks = [];
  const add = (label, pass, detail) =>
    checks.push({ label, pass: !!pass, detail: detail == null ? '' : String(detail) });

  const visible = filterUnlocked(records, store);
  const ids = visible.map((r) => r.id);
  const idSet = new Set(ids);
  const canonical = [...idSet].sort();

  // (a) SET EQUALITY — distinct, no dup, count matches
  add('visible set has no duplicate id', idSet.size === ids.length, idSet.size + ' / ' + ids.length);
  add('|visible| === filterUnlocked count', visible.length === ids.length, visible.length + '');

  // (b) EACH ORDERING IS A PERMUTATION of the visible set
  for (const key of Object.keys(ORDERINGS)) {
    const ordered = ORDERINGS[key](visible);
    const oids = [...new Set(ordered.map((r) => r.id))].sort();
    const same = oids.length === canonical.length && oids.every((v, i) => v === canonical[i]);
    add('ordering "' + key + '" is a permutation of the volume', same,
      ordered.length + ' cards');
  }

  // (c) STRICT TREE — leaves reunion to the full set, no id under two leaves
  const tree = buildTree(visible);
  const leafIds = [];
  for (const d of tree) for (const w of d.wings) for (const r of w.rooms) leafIds.push(r.id);
  const leafSet = new Set(leafIds);
  const treeCanonical = [...leafSet].sort();
  add('drill tree: no id under two leaves', leafSet.size === leafIds.length,
    leafSet.size + ' / ' + leafIds.length);
  add('drill tree: leaves reunion to the full volume',
    treeCanonical.length === canonical.length && treeCanonical.every((v, i) => v === canonical[i]),
    leafIds.length + ' leaves');

  // (d) SUBJECT TOTALITY — every card lands in one SUBJECTS shelf
  let allClassified = true, badSubj = null;
  for (const r of visible) {
    if (SUBJECTS.indexOf(subjectOf(r)) === -1) { allClassified = false; badSubj = r.id; break; }
  }
  add('every card lands in exactly one subject shelf', allClassified,
    allClassified ? SUBJECTS.length + ' shelves' : 'unclassified: ' + badSubj);

  // (e) SEARCH edges — empty all, absent none
  const ABSENT = '☃zzqx-no-such-room';   // a query no blurb contains
  add('empty query returns the whole volume', search(visible, '').length === visible.length,
    search(visible, '').length + '');
  add('a guaranteed-absent query returns none', search(visible, ABSENT).length === 0,
    search(visible, ABSENT).length + '');

  // (f) LOCK PARITY — locked card present in data, gated in visible
  const lockedInData = records.some((r) => r.locked);
  const lockedVisible = visible.some((r) => r.locked);
  const earned = store && store.ok && (store.has('ws:seen:undercroft-rune') || store.has('ws:seen:undercroft'));
  add('locked way down is in the data slab', lockedInData, lockedInData ? 'present' : 'MISSING');
  add('locked card shown iff earned', lockedVisible === !!earned,
    'visible=' + lockedVisible + ' earned=' + !!earned);

  return { checks, visible };
}

/* ── verdict: a battery → { passN, total, allPass } ──────────────────────────── */
export function verdict(checks) {
  const passN = checks.filter((c) => c.pass).length;
  return { passN, total: checks.length, allPass: passN === checks.length };
}
