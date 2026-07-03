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
  'wing', 'order', 'href', 'blurb', 'tag', 'locked', 'entry', 'entryDate', 'exhibits'
];

/* ── THE LOCK PREDICATE — PURE (ids/wsHas in, not localStorage reads) ──────────
   The SAME predicate the front door's reveal-fns use to decide whether a gated way
   down is revealed. Each locked room is gated by its OWN key family (front-door
   parity): the Undercroft by its undercroft breadcrumbs, the Reliquary (#399) by
   ws:seen:reliquary (the study entered). A locked room is shown ONLY if storage is
   on AND its own reveal key is present. `store` is the WS.store() snapshot shape:
   { ok:boolean, has(key):boolean, ... }. Storage off ⇒ locked rooms hidden. Pure:
   depends only on its two arguments, so the twin can drive both sealed and unsealed
   branches with plain fixtures. */
export function unlockedFor(record, store) {
  if (!record.locked) return true;
  if (!store || !store.ok) return false;
  if (record.id === 'reliquary') return store.has('ws:seen:reliquary');
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
   `entry` ASC — the TRUE order rooms entered the estate. `entry` is the git
   DEPTH-from-root of a room's first-add commit (the "cycle == git depth" metric),
   baked into the slab by reclaim.mjs at build time; it is monotone in real
   history, so genesis / pre-cycle rooms (the Strange Gardens, the Sound Garden,
   the Arcade) head the Register and the newest rooms sort last. A record with no
   `entry` (only synthetic fixtures, never the shipped slab) sorts to the END
   (entry ?? Infinity), then a deterministic id tiebreak. Both legs stay covered by
   the permutation proof; the twin additionally asserts the result is monotone
   non-decreasing in `entry` and that the bug's reported inversion (a genesis room
   landing AFTER a recent one) is gone. NB: we deliberately do NOT sort on the
   front-door `order` field — that is a MAP-DISPLAY slot, not entry-time. */
export function byEntry(records) {
  return records.slice().sort((a, b) =>
    ((a.entry ?? Infinity) - (b.entry ?? Infinity)) ||
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

/* ═══ EXHIBITS — the estate-manifest join (§4.4) ════════════════════════════════
   Each card carries `exhibits: [{ name, href, kind, gate? }]`, joined onto it from
   the estate manifest (§6) by reclaim at build time. The card stays ROOM-LEVEL; the
   exhibit list lets the search resolve a room by one of the PIECES it hosts — search
   "Snell" and the hall that shows the Spyglass answers, even though "Spyglass" is no
   card of its own. `kind` is the manifest's own vocabulary for how a piece belongs to
   its room (bench | companion | cross | exhibit | game | instrument | piece | stray |
   within); it drives the search sub-line's phrasing and the spoiler law below.

   THE SPOILER LAW (§4.4): a WITHIN piece (`kind:'within'`) or a hidden exhibit
   (`hidden:true`) is a discoverable SECRET — indexed ONLY once the visitor has earned
   it, i.e. its `gate` breadcrumb (a `ws:seen:<id>` key) is present in the live store.
   Non-secret exhibits are always indexed. This is the SAME lock-parity discipline the
   Reliquary uses to hide a whole room until entered (the phantom-witness precedent),
   pushed one level down to a room's own pieces: no piece the visitor has not yet met
   can leak into the register's search. */

/* is this exhibit a spoiler-gated secret (a within-piece or an explicitly hidden one)? */
export function exhibitGated(ex) {
  return !!ex && (ex.kind === 'within' || ex.hidden === true);
}

/* the exhibits of a record that are INDEXED given the live store: every non-gated
   exhibit, plus a gated one only when its own `gate` key is earned. `store` may be
   undefined ⇒ gated exhibits excluded (the spoiler-safe default a fresh visitor sees).
   Pure: depends only on the record and the store snapshot. */
export function indexedExhibits(record, store) {
  const list = Array.isArray(record && record.exhibits) ? record.exhibits : [];
  return list.filter((ex) => {
    if (!exhibitGated(ex)) return true;
    if (!ex.gate) return false;                 // gated but keyless → never index
    return !!(store && store.ok && store.has(ex.gate));
  });
}

/* house-voice phrasing for the "↳ within: <name> — <phrase>" search sub-line, keyed
   on the manifest's exhibit kind; a plain-spoken account of how the piece belongs to
   its room. An unlisted kind reads as the neutral catch-all. */
export const KIND_PHRASE = {
  bench: 'a bench of this room',
  companion: 'a companion of this room',
  cross: 'a crossing shown here',
  exhibit: 'an exhibit of this room',
  game: 'an amusement of this room',
  instrument: 'an instrument of this room',
  piece: 'a piece of this room',
  stray: 'kept with this room',
  within: 'found within this room'
};
export function exhibitPhrase(ex) {
  return (ex && KIND_PHRASE[ex.kind]) || 'shown in this room';
}

/* ── search: the manicule predicate — case-insensitive substring over the visible
   text (room | piece | blurb) AND the room's INDEXED exhibit names (§4.4). Returns
   the matching cards (unordered; the page orders them by the active index). Empty/
   blank query ⇒ ALL records (search clears to the full volume). Sound + complete by
   construction; the twin proves it against an independent brute-force reference.
   `store` gates the exhibit surface by the spoiler law; optional (legacy 2-arg calls
   still resolve every room-level match). */
export function searchText(record, store) {
  const base = [record.room, record.piece, record.blurb];
  const exNames = indexedExhibits(record, store).map((e) => e && e.name);
  // \x01 separator: fields never contain it, so a query can't straddle a boundary
  // (keeps searchText's substring semantics identical to matchInfo's per-field scan).
  return base.concat(exNames).map((s) => String(s == null ? '' : s)).join('');
}

/* matchInfo: the query verdict for one record, given the live store. Returns
   { hit, via, exhibit? } where `via` names the FIRST field that answered (priority
   room > piece > blurb > exhibit). When the answer came via an exhibit, `exhibit`
   carries the matched exhibit so the page can render the "↳ within" sub-line. Empty
   query ⇒ hit via 'room'. Sound + complete: hit iff q is a substring of the
   spoiler-aware surface. */
export function matchInfo(record, query, store) {
  const q = String(query == null ? '' : query).trim().toLowerCase();
  if (q === '') return { hit: true, via: 'room' };
  const has = (s) => String(s == null ? '' : s).toLowerCase().includes(q);
  if (has(record.room)) return { hit: true, via: 'room' };
  if (has(record.piece)) return { hit: true, via: 'piece' };
  if (has(record.blurb)) return { hit: true, via: 'blurb' };
  for (const ex of indexedExhibits(record, store)) {
    if (has(ex && ex.name)) return { hit: true, via: 'exhibit', exhibit: ex };
  }
  return { hit: false, via: null };
}
export function matches(record, query, store) {
  return matchInfo(record, query, store).hit;
}
export function search(records, query, store) {
  return records.filter((r) => matches(r, query, store));
}

/* ── SEALED CARDS (steer 4) — register presences with no navigable room ─────
   A short, hand-authored list of rooms the Register ACKNOWLEDGES but does not open.
   The Cabinet of Honors (§4.5) is off every visitor path — no PLACES row, no nav link,
   no sky star — so its ONLY estate-wide presence is this greyed, href-less card. Sealed
   cards are NOT part of the records slab: they carry no id/district/entry and are
   EXCLUDED from every proof (set-equality, the four orderings, the drill tree, the
   search predicate). The page renders them greyed and unclickable; the twin asserts
   they never leak into the volume's ordered/searchable set. */
export const SEALED_CARDS = [
  { room: 'The Cabinet of Honors', note: 'closed to visitors', glyph: '🗝' }
];

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
     (g) ENTRY-TIME TRUTH — every card carries an integer `entry` (no holes); the
         Register of Admissions is monotone non-decreasing in `entry`; and a known
         genesis room sorts strictly before a known recent room (the bug's
         reported inversion, asserted gone — checked only when both are present).
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

  // (e) SEARCH edges — empty all, absent none (spoiler-aware, gated on `store`)
  const ABSENT = '☃zzqx-no-such-room';   // a query no blurb contains
  add('empty query returns the whole volume', search(visible, '', store).length === visible.length,
    search(visible, '', store).length + '');
  add('a guaranteed-absent query returns none', search(visible, ABSENT, store).length === 0,
    search(visible, ABSENT, store).length + '');

  // (e2) EXHIBIT SPOILER PARITY — a gated (within/hidden) exhibit is indexed by the
  // search ONLY when its own key is earned in THIS store; non-gated exhibits always.
  // This is the phantom-witness discipline one level down: no unmet piece leaks in.
  let exhibitParity = true, exhibitDetail = 'no gated exhibits', gatedSeen = 0;
  for (const r of visible) {
    const all = Array.isArray(r.exhibits) ? r.exhibits : [];
    const idx = new Set(indexedExhibits(r, store).map((e) => e.href));
    for (const ex of all) {
      const shouldIndex = !exhibitGated(ex)
        ? true
        : !!(ex.gate && store && store.ok && store.has(ex.gate));
      if (exhibitGated(ex)) gatedSeen++;
      if (idx.has(ex.href) !== shouldIndex) { exhibitParity = false; exhibitDetail = r.id + '/' + ex.name; break; }
    }
    if (!exhibitParity) break;
  }
  add('each gated exhibit is indexed iff its own key is earned (spoiler parity)',
    exhibitParity, exhibitParity ? gatedSeen + ' gated exhibit(s) checked' : 'leak at ' + exhibitDetail);

  // (g) ENTRY-TIME — the Register of Admissions now tells the TRUE order. Every
  // card carries an integer `entry` (git depth, baked by reclaim — no holes); the
  // Register is MONOTONE NON-DECREASING in `entry`; and a known genesis room sorts
  // STRICTLY BEFORE a known recent room (the exact inversion the bug reported).
  const everyEntryInt = visible.every((r) => Number.isInteger(r.entry));
  add('every card carries an integer `entry` (no holes)', everyEntryInt,
    everyEntryInt ? visible.length + ' stamped' : 'missing entry on a card');
  const reg = byEntry(visible);
  let monotone = true, firstInv = null;
  for (let i = 1; i < reg.length; i++) {
    if ((reg[i].entry ?? Infinity) < (reg[i - 1].entry ?? Infinity)) {
      monotone = false; firstInv = reg[i - 1].id + '→' + reg[i].id; break;
    }
  }
  add('Register of Admissions is monotone non-decreasing in `entry`', monotone,
    monotone ? reg.length + ' in order' : 'inversion at ' + firstInv);
  // genesis-before-recent: only asserted when BOTH landmark rooms are present
  // (they are in the real estate; synthetic fixtures may lack them — skip cleanly).
  const pos = (id) => reg.findIndex((r) => r.id === id);
  const gi = pos('sound-garden'), ci = pos('card-catalog');
  if (gi !== -1 && ci !== -1) {
    add('a genesis room (sound-garden) sorts before a recent room (card-catalog)',
      gi < ci, 'sound-garden @' + gi + ' < card-catalog @' + ci);
  }

  // (f) LOCK PARITY — every locked card is present in the data slab, and each is
  // shown in `visible` iff its OWN reveal key is earned (per-room gating: the
  // Undercroft by its undercroft breadcrumbs, the Reliquary by ws:seen:reliquary).
  // Generalised for the TWO gated ways down (#399): the visible locked SET must
  // equal exactly the locked cards unlockedFor lets through.
  const lockedData = records.filter((r) => r.locked);
  const lockedInData = lockedData.length > 0;
  add('a locked way down is in the data slab', lockedInData,
    lockedInData ? lockedData.length + ' gated room(s)' : 'MISSING');
  const visibleLockedIds = visible.filter((r) => r.locked).map((r) => r.id).sort();
  const shouldShowIds = lockedData.filter((r) => unlockedFor(r, store)).map((r) => r.id).sort();
  const parity = visibleLockedIds.length === shouldShowIds.length &&
    visibleLockedIds.every((id, i) => id === shouldShowIds[i]);
  add('each locked card shown iff its own key is earned', parity,
    'visible=[' + visibleLockedIds.join(',') + '] expected=[' + shouldShowIds.join(',') + ']');

  return { checks, visible };
}

/* ── verdict: a battery → { passN, total, allPass } ──────────────────────────── */
export function verdict(checks) {
  const passN = checks.filter((c) => c.pass).length;
  return { passN, total: checks.length, allPass: passN === checks.length };
}
