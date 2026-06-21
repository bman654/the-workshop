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
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_PATH = join(__dirname, 'index.src.html');
const PLACES_PATH = join(__dirname, '..', 'index.src.html');

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

/* ── emit the slab + re-pin ─────────────────────────────────────────────────── */
function main() {
  const records = loadPlaces();
  // canonical field order, stable, pretty-printed for a readable diff.
  const FIELD_ORDER = ['id', 'room', 'piece', 'glyph', 'accent', 'district', 'tier', 'wing', 'order', 'href', 'blurb', 'tag', 'locked'];
  const projected = records.map((r) => {
    const o = {};
    for (const f of FIELD_ORDER) if (r[f] !== undefined) o[f] = r[f];
    return o;
  });
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
