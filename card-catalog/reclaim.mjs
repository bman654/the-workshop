#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE CARD CATALOG — reclaim.mjs

   Re-pin the static CATALOG-DATA slab in card-catalog/index.src.html to the
   records RE-DERIVED from the front-door PLACES table, so the bound volume stays
   true to the estate as rooms are added. collate.sh runs this every cycle (the
   proven per-room reclaim.mjs convention: PHASE 1 runs every reclaim hook, PHASE
   2 forges --all), with ZERO collate.sh edit — this room enrolls just by shipping
   this file. After this re-pins index.src.html, forge --all (PHASE 2) re-inlines
   the slab into index.html.

   It reads ../index.src.html, finds `const PLACES = [ … ];`, slices it with a
   TOLERANT comment-and-string-aware balanced-brace scan (NEVER eval/Function the
   file — at module-eval the PLACES block references Layout/WS globals; we do a
   structural slice + a restricted per-field scalar parser instead), projects each
   entry to {id,room,piece,glyph,accent,district,tier,wing,order,href,blurb,tag,
   locked}, and writes the JSON slab between the CATALOG-DATA sentinels.

   ── ENTRY-TIME (git-derived, build-time): the slab is NOT a pure function of
   PLACES. ── The front-door `order` field is a MAP-DISPLAY index (a room's slot
   within its wing/plate), NOT entry-time — so it cannot order the Register of
   Admissions truthfully. Instead reclaim derives, for EACH record, the moment the
   room actually entered the estate from git history, and bakes two fields into the
   slab so core.mjs stays pure (DOM-free, no shelling):
     • `entry`     — the integer commit DEPTH-from-root of the room's FIRST-ADD
                     commit (`git rev-list --count <hash>`); this is the SAME
                     "cycle == git depth" metric the Cairn ledger uses, and being
                     monotone in real history it naturally orders genesis /
                     pre-cycle rooms ahead of recent ones. This is the SORT KEY for
                     ORDERING 3 (byEntry).
     • `entryDate` — the YYYY-MM-DD date of that first-add commit (human display,
                     stamped on each admissions card + the room's detail panel).
   The first-add commit is the EARLIEST `--diff-filter=A` commit touching any of
   the room's source paths (resolved from `href`: <dir>/<file>.src.html, then
   <dir>/<file>.html, then the directory). A room whose first-add commit cannot be
   found (brand-new / uncommitted / a renamed path) gets a deterministic fallback
   that sorts it LAST (entry = ENTRY_SENTINEL, entryDate = '') rather than crashing
   or shipping a hole. Embedding git-derived facts here is correct: entry-time is a
   fact about HISTORY, not about the plan — so the slab legitimately depends on more
   than PLACES. reclaim is build-time and already shells the filesystem; shelling
   git is in-bounds (core.mjs never does).

   The slab carries EVERY PLACES entry INCLUDING the locked undercroft (the page's
   filterUnlocked gates at RENDER time from live ws:). hrefs in PLACES are
   repo-root-relative; the catalog lives one level down, so the PAGE prefixes
   `../` at render time (the slab keeps the raw href so the twin can fs-resolve
   `../<href>` exactly as the page does).

   A malformed / short parse MUST REFUSE (exit nonzero) like census/reclaim — it
   asserts the recovered count against a `grep -c 'id:"'` floor over the SAME
   PLACES block, so a parse-miss FAILS loudly rather than shipping a short catalog.

   Run:  node card-catalog/reclaim.mjs
   Exits 0 on success (whether or not the slab changed); non-zero on any error.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ROOM_LOCKS } from '../tools/manifest/registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SRC_PATH = join(__dirname, 'index.src.html');
const PLACES_PATH = join(__dirname, '..', 'index.src.html');
const MANIFEST_PATH = join(REPO_ROOT, 'tools', 'manifest', 'estate-manifest.json');

/* A room whose first-add commit cannot be found (brand-new, uncommitted, or a
   renamed path) gets this sentinel `entry` so it sorts LAST in the Register
   rather than crashing reclaim or shipping a hole. Large enough to dwarf any real
   git depth; finite (not Infinity) so it survives JSON round-trip as an integer. */
const ENTRY_SENTINEL = 1e9;

const BEGIN = '<!-- CATALOG-DATA BEGIN -->';
const END = '<!-- CATALOG-DATA END -->';

/* ── sliceBalanced: from `from` (an opening bracket char) return the index of its
   MATCHING close, scanning comment- and string-aware. Throws on imbalance. ──── */
function sliceBalanced(src, openIdx, openCh, closeCh) {
  let depth = 0, i = openIdx, inStr = null;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === openCh) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) return i; }
  }
  throw new Error('unbalanced ' + openCh + closeCh + ' starting at ' + openIdx);
}

/* ── splitEntries: a `[ {…}, {…}, … ]` block (without the outer brackets) split
   into its top-level `{ … }` object literal substrings, comment/string-aware. ── */
function splitEntries(block) {
  const out = [];
  let depth = 0, inStr = null, cur = '', started = false;
  for (let i = 0; i < block.length; i++) {
    const c = block[i], n = block[i + 1];
    if (inStr) {
      cur += c;
      if (c === '\\') { cur += (block[++i] || ''); continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '/' && n === '/') { while (i < block.length && block[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < block.length && !(block[i] === '*' && block[i + 1] === '/')) i++; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; if (depth > 0) cur += c; continue; }
    if (c === '{') { if (depth === 0) { started = true; cur = '{'; } else cur += c; depth++; continue; }
    if (c === '}') { depth--; cur += c; if (depth === 0 && started) { out.push(cur); started = false; cur = ''; } continue; }
    if (depth > 0) cur += c;
  }
  return out;
}

/* ── a restricted per-field scalar parser. Finds `name:` at the TOP level of one
   entry literal (depth 1, i.e. not inside a nested object like `companion:{…}`)
   and reads its scalar value: a quoted string (', ", or `), an integer, or a
   boolean/null keyword. Returns undefined if the field is absent or non-scalar
   (e.g. companion, which we do not project). String values are unescaped for the
   common JS escapes so a blurb's \" survives as ". ── */
function readField(entry, name) {
  // scan tokens at brace-depth 1 (the entry's own object), tracking strings.
  let depth = 0, inStr = null, i = 0;
  const inner = entry; // includes the outer { }
  for (; i < inner.length; i++) {
    const c = inner[i], n = inner[i + 1];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '/' && n === '/') { while (i < inner.length && inner[i] !== '\n') i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') { depth++; continue; }
    if (c === '}') { depth--; continue; }
    // only consider keys at the entry's own top level (depth 1)
    if (depth === 1) {
      // a key is an identifier immediately followed (after optional ws) by ':'
      if (/[A-Za-z_$]/.test(c)) {
        let j = i;
        while (j < inner.length && /[A-Za-z0-9_$\-]/.test(inner[j])) j++;
        const key = inner.slice(i, j);
        let k = j;
        while (k < inner.length && /\s/.test(inner[k])) k++;
        if (inner[k] === ':') {
          if (key === name) return parseScalar(inner, k + 1);
          // not our key — advance past the key so we don't re-scan its chars
          i = k;
        }
      }
    }
  }
  return undefined;
}

/* parseScalar: from index `p` (just after the ':'), skip ws and read ONE scalar:
   a quoted string, an integer (optionally negative), or true/false/null. Returns
   the JS value, or undefined if the value is non-scalar (an object/array). */
function parseScalar(s, p) {
  while (p < s.length && /\s/.test(s[p])) p++;
  const ch = s[p];
  if (ch === '"' || ch === "'" || ch === '`') {
    let out = '', i = p + 1;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') { out += unescapeChar(s[i + 1]); i++; continue; }
      if (c === ch) break;
      out += c;
    }
    return out;
  }
  if (ch === '-' || /[0-9]/.test(ch)) {
    let i = p, num = '';
    if (s[i] === '-') { num += '-'; i++; }
    while (i < s.length && /[0-9]/.test(s[i])) { num += s[i]; i++; }
    if (num === '' || num === '-') return undefined;
    return parseInt(num, 10);
  }
  if (s.startsWith('true', p)) return true;
  if (s.startsWith('false', p)) return false;
  if (s.startsWith('null', p)) return null;
  return undefined; // object / array literal → not a projected scalar
}

function unescapeChar(c) {
  switch (c) {
    case 'n': return '\n';
    case 't': return '\t';
    case 'r': return '\r';
    case '\\': return '\\';
    case '"': return '"';
    case "'": return "'";
    case '`': return '`';
    case '/': return '/';
    default: return c == null ? '' : c;
  }
}

/* ── parse the front-door PLACES into projected records ─────────────────────── */
const SCALAR_FIELDS = ['id', 'room', 'piece', 'glyph', 'accent', 'district', 'tier', 'wing', 'order', 'href', 'blurb', 'tag'];

function projectEntry(entry) {
  const rec = {};
  for (const f of SCALAR_FIELDS) {
    const v = readField(entry, f);
    if (v !== undefined) rec[f] = v;
  }
  rec.locked = readField(entry, 'locked') === true;
  return rec;
}

/* ── ENTRY-TIME, derived from git history (build-time only) ──────────────────────
   The candidate source paths for a record, in probe order, resolved from `href`.
   For href "sound-garden/index.html": probe sound-garden/index.src.html (the
   authored source forge inlines from), then sound-garden/index.html (the shipped
   page), then the directory sound-garden/ (the room's whole footprint — catches
   first-add even if the page was later renamed within the dir). For a top-level
   single-file room the href file itself is the first probe. Repo-root-relative,
   filtered to those that actually exist so git is asked only about real paths. */
function entryPathsFor(href) {
  const h = String(href || '').trim();
  const out = [];
  if (h) {
    const slash = h.lastIndexOf('/');
    const dir = slash === -1 ? '' : h.slice(0, slash);
    const file = slash === -1 ? h : h.slice(slash + 1);
    const dot = file.lastIndexOf('.');
    const base = dot === -1 ? file : file.slice(0, dot);
    if (dir) {
      out.push(join(dir, base + '.src.html'));   // authored source
      out.push(join(dir, base + '.html'));        // shipped page
      out.push(dir);                              // the room's directory
    } else {
      out.push(join(base + '.src.html'));
      out.push(h);
    }
  }
  // de-dup, keep only paths that exist under the repo so git gets real targets
  const seen = new Set();
  return out.filter((p) => {
    if (seen.has(p)) return false;
    seen.add(p);
    return existsSync(join(REPO_ROOT, p));
  });
}

/* The FIRST-ADD commit for a set of repo-relative paths: the EARLIEST commit that
   ADDED any of them (`git log --diff-filter=A --reverse`, first line). Returns
   { hash, date } or null if git has no add-record for any path (brand-new /
   uncommitted / renamed). Robust: any git failure (not a repo, path unknown)
   yields null, never throws — reclaim falls back to the deterministic sentinel. */
function firstAddCommit(paths) {
  if (!paths.length) return null;
  let best = null; // { hash, date, depth }
  for (const p of paths) {
    let line;
    try {
      const out = execFileSync('git', [
        'log', '--diff-filter=A', '--reverse', '--format=%H|%ad', '--date=short',
        '--', p
      ], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      line = out.split('\n').find((l) => l.includes('|'));
    } catch (e) {
      line = undefined; // git failed for this path — try the next probe
    }
    if (!line) continue;
    const bar = line.indexOf('|');
    const hash = line.slice(0, bar).trim();
    const date = line.slice(bar + 1).trim();
    if (!hash) continue;
    let depth;
    try {
      depth = parseInt(String(execFileSync('git', ['rev-list', '--count', hash], {
        cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
      }).trim()), 10);
    } catch (e) { continue; }
    if (!Number.isFinite(depth)) continue;
    // keep the SHALLOWEST (earliest) first-add across the probes — depth is
    // monotone in history, so the smallest depth is the truest entry moment.
    if (!best || depth < best.depth) best = { hash, date, depth };
  }
  return best;
}

/* Resolve { entry, entryDate } for one projected record. Falls back to the
   last-sorting sentinel when no first-add commit can be found. */
function entryTimeFor(record) {
  const commit = firstAddCommit(entryPathsFor(record.href));
  if (!commit) return { entry: ENTRY_SENTINEL, entryDate: '' };
  return { entry: commit.depth, entryDate: commit.date };
}

/* ── parsePlacesText: the structural core. Given the FULL text of a front-door
   index.src.html (or any file holding a `const PLACES = [ … ];`), slice the block,
   split its entries, project + validate each. Exported so the Node twin can feed
   it BOTH the real front door AND synthetic negative-control fixtures (a dup-id
   slab, a bogus-href slab) and assert the failure modes. ── */
export function parsePlacesText(src) {
  const marker = 'const PLACES = [';
  const start = src.indexOf(marker);
  if (start === -1) throw new Error('could not find `const PLACES = [` in the source');
  const open = src.indexOf('[', start);
  const close = sliceBalanced(src, open, '[', ']');
  const block = src.slice(open + 1, close); // inside the outer brackets
  const entries = splitEntries(block);
  const records = entries.map(projectEntry).filter((r) => r.id);

  // ── REFUSE on a short parse: the recovered count must meet a `grep -c id:"`
  // floor over the SAME block, so a parse-miss FAILS loudly. ──
  const idFloor = (block.match(/\bid:"/g) || []).length;
  if (idFloor === 0) throw new Error('no `id:"` keys found in PLACES block — parse is broken');
  if (records.length < idFloor) {
    throw new Error('REFUSING: recovered ' + records.length + ' records but the block has ' +
      idFloor + ' `id:"` keys — a parse-miss would ship a SHORT catalog.');
  }

  // every record must carry the load-bearing fields (id, room, href, district)
  for (const r of records) {
    for (const f of ['id', 'room', 'href', 'district']) {
      if (r[f] == null || r[f] === '') {
        throw new Error('REFUSING: record "' + (r.id || '?') + '" is missing required field "' + f + '"');
      }
    }
  }
  return records;
}

export function loadPlaces(placesPath = PLACES_PATH) {
  return parsePlacesText(readFileSync(placesPath, 'utf8'));
}

/* ── withEntryTimes: stamp each record with its git-derived { entry, entryDate } ──
   Kept OUT of parsePlacesText so the parser stays a pure structural projection
   (the Node twin feeds it synthetic fixtures that have no git history); the slab
   the page ships is built from THIS, so the embedded entry/entryDate are the
   single source the twin and the page both read. Every returned record carries an
   INTEGER `entry` (a real git depth, or ENTRY_SENTINEL) and a string `entryDate`
   (YYYY-MM-DD, or '' for the sentinel) — no holes. */
export function withEntryTimes(records) {
  return records.map((r) => {
    const { entry, entryDate } = entryTimeFor(r);
    return { ...r, entry, entryDate };
  });
}

/* ── EXHIBITS, joined from the estate manifest (§4.4, build-time) ────────────────
   The manifest (tools/manifest/estate-manifest.json, §6) is the estate's authority on
   which PIECES belong to which room. reclaim reads it and joins each room's exhibit
   list onto its card, keyed by room id, so the Register can resolve a room by one of
   the pieces it hosts. Each exhibit is projected to { name, href, kind } plus a `gate`
   (its ws:seen breadcrumb) and/or `hidden` flag when the manifest marks it a SECRET —
   the two fields core.mjs's spoiler law reads to keep a within/hidden piece out of the
   index until the visitor has earned it. companionOf and other manifest-internal fields
   are dropped (the card is room-level). Cards stay room-level; a card with no manifest
   exhibits gets `exhibits: []`.

   Build-time only: the manifest is a committed repo fact, so reading it here is as
   legitimate as shelling git for entry-time — core.mjs never touches the filesystem.
   A missing/broken manifest REFUSES loudly rather than shipping a silently
   exhibit-less catalog (the same discipline as the short-parse floor guard). */
export function loadExhibitsByRoom(manifestPath = MANIFEST_PATH) {
  const man = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!man || !Array.isArray(man.districts)) {
    throw new Error('REFUSING: estate manifest has no districts array — cannot join exhibits.');
  }
  const byRoom = new Map();
  for (const d of man.districts) {
    for (const room of (d.rooms || [])) {
      const list = (room.exhibits || []).map((ex) => {
        const o = { name: ex.name, href: ex.href, kind: ex.kind };
        if (ex.gate != null) o.gate = ex.gate;         // the ws:seen key a secret is earned by
        if (ex.hidden === true) o.hidden = true;       // an explicitly hidden exhibit
        if (ex.lock != null) o.lock = ex.lock;         // the §6.5 reveal-lock descriptor (same-locks
                                                       // law): core.mjs lockMet gates the index on the
                                                       // SAME predicate that reveals the walkable link.
                                                       // (lockId is manifest-side audit metadata — dropped.)
        return o;
      });
      byRoom.set(room.id, list);
    }
  }
  return byRoom;
}

/* stamp each record with its manifest exhibit list (room-level join by id). A card
   the manifest does not know gets an empty list, never undefined, so every slab card
   carries an `exhibits` array. */
export function withExhibits(records, byRoom) {
  return records.map((r) => ({ ...r, exhibits: byRoom.get(r.id) || [] }));
}

/* ── emit the slab + re-pin ─────────────────────────────────────────────────── */
function main() {
  let records = withExhibits(withEntryTimes(loadPlaces()), loadExhibitsByRoom());
  // ── ROOM REVEAL-LOCKS (§6.5 same-locks law): bake each LOCKED room's walkable
  // reveal-lock descriptor (registry ROOM_LOCKS — the weakest path across every
  // way in) onto its card, so core.mjs unlockedFor shows the card exactly when
  // the visitor could walk there. A locked room with NO descriptor REFUSES: a
  // lock the catalog cannot honor must never ship silently. ──
  for (const id of Object.keys(ROOM_LOCKS)) {
    if (!records.some((r) => r.id === id && r.locked)) {
      throw new Error('REFUSING: ROOM_LOCKS["' + id + '"] matches no locked PLACES record — stale lock row.');
    }
  }
  records = records.map((r) => {
    if (!r.locked) return r;
    const lock = ROOM_LOCKS[r.id];
    if (!lock) throw new Error('REFUSING: locked room "' + r.id + '" has no ROOM_LOCKS descriptor — the catalog cannot honor its reveal-lock.');
    return { ...r, lock };
  });
  // canonical field order, stable, pretty-printed for a readable diff. `entry`
  // (git depth-from-root) + `entryDate` (YYYY-MM-DD) are git-derived; `exhibits` is
  // the estate-manifest join (§4.4); `lock` is the room reveal-lock (§6.5) — baked here.
  const FIELD_ORDER = ['id', 'room', 'piece', 'glyph', 'accent', 'district', 'tier', 'wing', 'order', 'href', 'blurb', 'tag', 'locked', 'lock', 'entry', 'entryDate', 'exhibits'];
  const projected = records.map((r) => {
    const o = {};
    for (const f of FIELD_ORDER) if (r[f] !== undefined) o[f] = r[f];
    return o;
  });
  // GUARD: every record must carry an integer `entry` (no holes) before we ship.
  for (const r of projected) {
    if (!Number.isInteger(r.entry)) {
      throw new Error('REFUSING: record "' + (r.id || '?') + '" has no integer `entry` field — entry-time derivation produced a hole.');
    }
  }
  const json = JSON.stringify(projected, null, 1);

  const src = readFileSync(SRC_PATH, 'utf8');
  const b = src.indexOf(BEGIN);
  const e = src.indexOf(END);
  if (b === -1 || e === -1 || e < b) {
    console.error('reclaim: could not find the CATALOG-DATA sentinels in card-catalog/index.src.html.');
    process.exit(1);
  }
  const before = src.slice(0, b + BEGIN.length);
  const after = src.slice(e);
  const updated = before + '\n' + json + '\n' + after;

  const tag = '[' + projected.length + ' cards · ' + projected.filter((r) => r.locked).length + ' locked]';
  if (updated === src) {
    console.log('reclaim: CATALOG-DATA already current ' + tag);
  } else {
    writeFileSync(SRC_PATH, updated);
    console.log('reclaim: CATALOG-DATA re-pinned ' + tag);
  }
  process.exit(0);
}

// Run main() ONLY when invoked as the entry module (so the Node twin can import
// the parser helpers without re-pinning the file).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (err) {
    console.error('reclaim: ' + (err && err.message ? err.message : err));
    process.exit(1);
  }
}
