#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE GATE FOUNDRY — backlog.mjs
   The TRUE, LIVE backlog of front-door rooms that have NO bespoke rep yet.

   ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
   The Gate gives some rooms a bespoke hand-drawn "rep" (a little representative
   drawing on the gate). Most rooms don't have one yet. The surveyor needs the
   TRUE current backlog of un-repped rooms — derived FRESH from the live sources
   every run, NOT from a stale snapshot. gate-foundry/room-pool.json is frozen at
   gate-build time and is deliberately NOT consulted here; this script re-derives
   the backlog from the same live sources the gate itself is re-pinned from.

   ── THE DATA MODEL ──────────────────────────────────────────────────────────
   backlog = (room inventory) − (the BESPOKE rep registry's keys).

   • ROOM INVENTORY — enumerated by importing card-catalog/reclaim.mjs.
       WHY this source (not the-gate/rooms.js loadSlab, not room-pool.json):
       reclaim.mjs is the cleanest node-runnable enumeration of EVERY front-door
       room. It exports loadPlaces() — a tolerant, comment/string-aware structural
       parse of `const PLACES = [ … ]` in the repo-root index.src.html (the single
       authored source of the front door) — and withEntryTimes(), which stamps
       each room with its git-derived entry moment. the-gate/rooms.js loadSlab()
       reads a DOM element (browser-context) and reaches the SAME set only via the
       GATE-ROOMS slab that reclaim re-pins; importing reclaim gets us that set
       PLUS the entry-date sort key in one node-runnable call. (Verified at build:
       reclaim's unlocked PLACES set == the live GATE-ROOMS slab, 74 == 74, zero
       diff.) room-pool.json is the frozen snapshot we are explicitly avoiding.

       We DROP locked rooms (e.g. the undercroft): the gate never surfaces them —
       its render-time filterUnlocked gates them out — so a rep for one could never
       show. The kept set is exactly the gate's room universe (the GATE-ROOMS slab).

   • REPPED SET — the keys of the BESPOKE registry in the-gate/rooms.js. Bespoke
       reps are NOT a folder of files; they are draw functions in the-gate/scene.js
       keyed by `var BESPOKE = { <id>: { rep, repColors }, … }` in the-gate/rooms.js.
       So the repped set = the BESPOKE keys. We do NOT import rooms.js (it is a
       browser-context IIFE touching root.document); we TEXT-EXTRACT the BESPOKE
       keys with a comment/string-aware balanced-brace scan — the same robustness
       discipline reclaim uses on PLACES. A BESPOKE key that is not a real room id
       (e.g. `cairn`, the synthetic Tabularium/Cairn-Face fixture) simply matches
       no inventory row and drops out of the diff harmlessly.

   ── ORDERING (keeper's decision) ────────────────────────────────────────────
   Sort the backlog by room ENTRY-DATE ascending, so the OLDEST un-repped rooms
   float to the top (they have waited longest for a rep). Entry-date is reused
   verbatim from reclaim's withEntryTimes(): a room's `entry` is the integer
   commit DEPTH-from-root of the commit that FIRST ADDED its source (the same
   "cycle == git depth" metric the Cairn ledger uses), and `entryDate` is that
   commit's YYYY-MM-DD. Monotone in real history, so smaller depth == older room.
   A room whose first-add commit can't be found gets reclaim's last-sorting
   sentinel (entry = 1e9, entryDate = ''); it sorts to the BOTTOM, never crashes.
   Ties (equal depth — rooms added in the same commit) break by id, ascending,
   for a fully deterministic order.

   ── THE SURVEYOR CALLS THIS ─────────────────────────────────────────────────
   The foundry surveyor runs this to learn what to rep next (oldest first):
       node gate-foundry/backlog.mjs            # human-readable, oldest first
       node gate-foundry/backlog.mjs --json     # machine output (for tooling)
       node gate-foundry/backlog.mjs --self-check   # run the embedded pure-core checks
   Exits 0 on success; non-zero with a clear message on any unreadable source
   (it REFUSES to fake data). --json prints {count, generatedAt, backlog:[…]}.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const ROOMS_JS_PATH = join(REPO_ROOT, 'the-gate', 'rooms.js');
const RECLAIM_PATH = join(REPO_ROOT, 'card-catalog', 'reclaim.mjs');
// The front-door authored source reclaim's loadPlaces() parses `const PLACES` out
// of. Checked up-front so a missing front door REFUSES with a clear message rather
// than surfacing reclaim's raw ENOENT.
const PLACES_SRC_PATH = join(REPO_ROOT, 'index.src.html');

/* ── BESPOKE-key extraction (text, comment/string-aware) ─────────────────────
   Slice `var BESPOKE = { … }` out of the-gate/rooms.js and read its top-level
   keys. Both bare-identifier keys (cairn:) and quoted keys ('sound-garden':) are
   recognised; comments and string literals are skipped so a `:` or brace inside a
   blurb / color hex can never be mistaken for a key. Exported so the twin can
   feed it synthetic fixtures. Throws on a clearly-broken block (no `{` / no keys)
   so a parse-miss FAILS loudly rather than silently reporting an empty rep set
   (which would over-report the backlog). */
export function extractBespokeKeys(src) {
  const marker = 'BESPOKE';
  const m = src.indexOf(marker);
  if (m === -1) throw new Error('could not find the BESPOKE registry in the-gate/rooms.js');
  const open = src.indexOf('{', m);
  if (open === -1) throw new Error('found BESPOKE but no opening `{` for its object literal');

  // balance braces from `open`, comment/string-aware, to find the matching close.
  let depth = 0, inStr = null, i = open, close = -1;
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
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { close = i; break; } }
  }
  if (close === -1) throw new Error('BESPOKE object literal has unbalanced braces');

  const block = src.slice(open + 1, close);
  const keys = [];
  depth = 0; inStr = null;
  for (let j = 0; j < block.length; j++) {
    const c = block[j], n = block[j + 1];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '/' && n === '/') { while (j < block.length && block[j] !== '\n') j++; continue; }
    if (c === '/' && n === '*') { j += 2; while (j < block.length && !(block[j] === '*' && block[j + 1] === '/')) j++; j++; continue; }
    if (c === '{') { depth++; continue; }
    if (c === '}') { depth--; continue; }
    if (depth !== 0) continue; // keys live at the BESPOKE object's own top level

    // a QUOTED key: '<key>' or "<key>" or `<key>` immediately followed by ':'
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      let k = j + 1, key = '';
      for (; k < block.length; k++) {
        if (block[k] === '\\') { key += block[k + 1] || ''; k++; continue; }
        if (block[k] === q) break;
        key += block[k];
      }
      let p = k + 1;
      while (p < block.length && /\s/.test(block[p])) p++;
      if (block[p] === ':') keys.push(key);
      j = k; // resume after the closing quote
      continue;
    }
    // a BARE-IDENTIFIER key: identifier immediately followed (after ws) by ':'
    if (/[A-Za-z_$]/.test(c)) {
      let k = j;
      while (k < block.length && /[A-Za-z0-9_$\-]/.test(block[k])) k++;
      const key = block.slice(j, k);
      let p = k;
      while (p < block.length && /\s/.test(block[p])) p++;
      if (block[p] === ':') keys.push(key);
      j = k - 1; // resume after the identifier
      continue;
    }
  }
  if (!keys.length) throw new Error('parsed the BESPOKE block but found no keys — extraction is broken');
  return keys;
}

/* ── the pure set-diff + sort core ───────────────────────────────────────────
   Given the room inventory (each {id, room, district, entry, entryDate, …}) and
   the BESPOKE keys, return the un-repped rooms sorted OLDEST-first. Pure and
   git-free, so the twin can exercise it with synthetic fixtures. Sort key:
   `entry` (git depth) ascending; ties break by id ascending for stability. A
   room missing `entry` is treated as the last-sorting sentinel (1e9). */
export const ENTRY_SENTINEL = 1e9;

export function computeBacklog(inventory, bespokeKeys) {
  const repped = new Set(bespokeKeys);
  const backlog = inventory.filter((r) => !repped.has(r.id));
  backlog.sort((a, b) => {
    const ea = Number.isFinite(a.entry) ? a.entry : ENTRY_SENTINEL;
    const eb = Number.isFinite(b.entry) ? b.entry : ENTRY_SENTINEL;
    if (ea !== eb) return ea - eb;
    return String(a.id).localeCompare(String(b.id));
  });
  return backlog;
}

/* ── live load: inventory (via reclaim) ∩ refuse on unreadable sources ───────── */
async function loadInventory() {
  if (!existsSync(RECLAIM_PATH)) {
    throw new Error('inventory source missing: ' + RECLAIM_PATH +
      ' (the Card Catalog reclaim.mjs is the room enumerator)');
  }
  if (!existsSync(PLACES_SRC_PATH)) {
    throw new Error('front-door source missing: ' + PLACES_SRC_PATH +
      ' (reclaim parses the room inventory from `const PLACES` in this file)');
  }
  let reclaim;
  try {
    reclaim = await import(RECLAIM_PATH);
  } catch (e) {
    throw new Error('could not import the inventory enumerator (' + RECLAIM_PATH + '): ' +
      (e && e.message ? e.message : e));
  }
  if (typeof reclaim.loadPlaces !== 'function' || typeof reclaim.withEntryTimes !== 'function') {
    throw new Error('inventory enumerator does not export loadPlaces()/withEntryTimes() — ' +
      'card-catalog/reclaim.mjs may have changed shape');
  }
  // loadPlaces() throws (REFUSES) on a short/garbled PLACES parse — let that bubble.
  // withEntryTimes() shells read-only git to stamp {entry, entryDate} per room.
  const all = reclaim.withEntryTimes(reclaim.loadPlaces());
  // DROP locked rooms: the gate never surfaces them (render-time filterUnlocked),
  // so they can carry no visible rep. The kept set == the live GATE-ROOMS slab.
  return all.filter((r) => !r.locked);
}

function loadBespokeKeys() {
  if (!existsSync(ROOMS_JS_PATH)) {
    throw new Error('rep registry missing: ' + ROOMS_JS_PATH +
      ' (the BESPOKE registry lives in the-gate/rooms.js)');
  }
  const src = readFileSync(ROOMS_JS_PATH, 'utf8');
  return extractBespokeKeys(src);
}

/* ── presentation ────────────────────────────────────────────────────────── */
function formatHuman(backlog, bespokeKeys, inventoryCount) {
  const lines = [];
  lines.push('THE GATE — un-repped room backlog (oldest first, by git entry-depth)');
  lines.push('');
  lines.push('  inventory (unlocked front-door rooms): ' + inventoryCount);
  lines.push('  repped (BESPOKE keys): ' + bespokeKeys.length + '  [' + bespokeKeys.join(', ') + ']');
  lines.push('  un-repped backlog: ' + backlog.length);
  lines.push('');
  if (!backlog.length) {
    lines.push('  (nothing un-repped — every front-door room has a bespoke rep)');
    return lines.join('\n');
  }
  // column widths for a clean table
  const idW = Math.max(2, ...backlog.map((r) => String(r.id).length));
  const nameW = Math.max(4, ...backlog.map((r) => String(r.room || r.id).length));
  const distW = Math.max(8, ...backlog.map((r) => String(r.district || '').length));
  const head = '  ' +
    'entry'.padStart(6) + '  ' +
    'date'.padEnd(10) + '  ' +
    'id'.padEnd(idW) + '  ' +
    'room'.padEnd(nameW) + '  ' +
    'district'.padEnd(distW);
  lines.push(head);
  lines.push('  ' + '-'.repeat(head.length - 2));
  for (const r of backlog) {
    const entry = Number.isFinite(r.entry) && r.entry < ENTRY_SENTINEL ? String(r.entry) : '—';
    const date = r.entryDate || '(unknown)';
    lines.push('  ' +
      entry.padStart(6) + '  ' +
      date.padEnd(10) + '  ' +
      String(r.id).padEnd(idW) + '  ' +
      String(r.room || r.id).padEnd(nameW) + '  ' +
      String(r.district || '').padEnd(distW));
  }
  return lines.join('\n');
}

function toJson(backlog, bespokeKeys, inventoryCount) {
  return {
    count: backlog.length,
    inventoryCount,
    reppedCount: bespokeKeys.length,
    reppedKeys: bespokeKeys,
    generatedAt: new Date().toISOString(),
    backlog: backlog.map((r) => ({
      id: r.id,
      room: r.room || r.id,
      district: r.district || null,
      entry: Number.isFinite(r.entry) ? r.entry : null,
      entryDate: r.entryDate || null,
    })),
  };
}

/* ── embedded self-check: exercise the pure core without live git ────────────
   A lightweight sanity pass over extractBespokeKeys + computeBacklog using
   synthetic fixtures. Returns true (all green) / false (a failure printed).
   The full fixture twin is gate-foundry/backlog.test.mjs; this --self-check
   gives the surveyor an in-script confidence check. */
function selfCheck() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ✗ ' + m); } };

  // extractBespokeKeys: bare + quoted keys, comments, nested braces, hex strings
  const fix = `
    var BESPOKE = {
      cairn: { rep: 'cairn', repColors: undefined },   // bare key, // not a key: foo:
      'physics-lab': { rep: 'cavern-mound', repColors: {
        DAY: { 'rep.swatch1': '#6e7680' }  /* not a key: bar: */
      } },
      "ripple": { rep: 'ripple-tank' },
      \`sound-garden\`: { rep: 'organ-pipes' }
    };`;
  const keys = extractBespokeKeys(fix);
  ok(JSON.stringify(keys) === JSON.stringify(['cairn', 'physics-lab', 'ripple', 'sound-garden']),
    'extractBespokeKeys finds exactly the 4 top-level keys (bare + quoted), skipping nested keys/comments — got ' + JSON.stringify(keys));

  // computeBacklog: set-diff removes repped ids (incl. synthetic key that matches nothing)
  const inv = [
    { id: 'b', room: 'B', entry: 30, entryDate: '2026-06-03' },
    { id: 'a', room: 'A', entry: 10, entryDate: '2026-06-01' },
    { id: 'physics-lab', room: 'Lab', entry: 20, entryDate: '2026-06-02' },
    { id: 'd', room: 'D', entry: 10, entryDate: '2026-06-01' },   // tie with 'a' on entry
    { id: 'c', room: 'C' },                                       // missing entry → sentinel, sorts last
  ];
  const back = computeBacklog(inv, ['physics-lab', 'cairn' /* synthetic, matches nothing */]);
  const order = back.map((r) => r.id).join(',');
  ok(order === 'a,d,b,c', 'computeBacklog drops repped, sorts by entry asc then id, sentinel last — got ' + order);
  ok(!back.some((r) => r.id === 'physics-lab'), 'repped room excluded from backlog');

  console.log((fail ? '✗' : '✓') + ' self-check: ' + pass + ' passed, ' + fail + ' failed');
  return fail === 0;
}

/* ── main ────────────────────────────────────────────────────────────────── */
async function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes('--json');
  const wantSelfCheck = args.includes('--self-check');

  if (wantSelfCheck) {
    process.exit(selfCheck() ? 0 : 1);
  }

  const inventory = await loadInventory();
  const bespokeKeys = loadBespokeKeys();
  const backlog = computeBacklog(inventory, bespokeKeys);

  if (wantJson) {
    process.stdout.write(JSON.stringify(toJson(backlog, bespokeKeys, inventory.length), null, 2) + '\n');
  } else {
    process.stdout.write(formatHuman(backlog, bespokeKeys, inventory.length) + '\n');
  }
  process.exit(0);
}

// Run main() only when invoked as the entry module (so the twin can import the
// pure cores without triggering a live load).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('backlog: ' + (err && err.message ? err.message : err));
    process.exit(1);
  });
}
