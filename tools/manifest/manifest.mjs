#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE ESTATE MANIFEST — manifest.mjs   (DESIGN §6.1–§6.2, §7.1)

   Generates tools/manifest/estate-manifest.json — the single generated-and-
   committed catalogue the three §6.3 consumers read (Register exhibit-search,
   the map depth-tallies, WS2 tour-stop validation). It is a re-derivation, not a
   hand-list: ROOMS come from the front-door PLACES via card-catalog/reclaim.mjs's
   proven parser; EXHIBITS come from the per-hub extractor registry (registry.mjs)
   scraped off the live pages; the sole-hub set is COMPUTED mechanically and
   diffed against the R3 stray table (DESIGN §7.3).

   THE COMPLETENESS LAW (§6.2): every top-level dir is claimed by EXACTLY one of a
   room href, an exhibit href, the crossings collection, the hidden node, or the
   allowlist. The generator emits `unclaimed: []` when that holds (W2.1a done-means).
   The `--check` gate + floors + double-claim FAIL land in W2.1b; this file is the
   design-carrying half — it authors the manifest to green over the real repo.

   Determinism (§1.6): no Math.random / Date / locale; all key-iteration sorted;
   `generatedAt` is the git HEAD sha (a fact about the repo, not the wall clock).

   THE --check GATE (§6.2 / §9.4, W2.1b): re-derives and diffs forge-style — completeness
   (unclaimed []), the double-claim law, href existence, the count floors, and staleness vs
   the committed file (EXCLUDING generatedAt, which is a per-commit HEAD sha). Joins the
   estate gate set at W2 (§9.4). Exits non-zero and names the fault on any failure.

   Run:  node tools/manifest/manifest.mjs           # write the manifest
         node tools/manifest/manifest.mjs --report   # + a diagnostic summary
         node tools/manifest/manifest.mjs --dry       # compute, print, don't write
         node tools/manifest/manifest.mjs --check      # the estate gate (re-derive + diff; never writes)
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlaces } from '../../card-catalog/reclaim.mjs';
import {
  HUBS, INTERNAL, STRAYS, HERITAGE, COMPANIONS, WITHINS, CROSS, HIDDEN, ALLOWLIST, NONE,
} from './registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const require = createRequire(import.meta.url);
const Contract = require('../layout/contract.js');
const OUT = join(__dirname, 'estate-manifest.json');
const PLACES_SRC = join(ROOT, 'index.src.html');

const dirOf = (href) => String(href || '').split('/')[0];
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);   // codepoint order (locale-free, §1.6)
const sorted = (arr) => [...arr].sort(cmp);

function die(msg) { console.error('manifest: ' + msg); process.exit(1); }

/* ── §6.2 baseline floors — COARSE parse-regression tripwires, never the authoritative
   count (the door-pill bijection from PLACES owns the true room count; these catch a
   scrape regression that would silently ship a short manifest). They track the honest
   COMPUTED value and RISE per wave as re-homing / WITHINs / the gather add pieces
   (W2.3 / W2.5 / W2.7 → §6.2's ≥340 ship target).

   REPO-WINS (spec-header rule): §6.2 pins `pieces ≥ 340`, but §6.1 itself marks pieces
   ILLUSTRATIVE ("the generator computes it; no hand-pinned drifting digits, the house
   rule") and the honest computed value at W2.1b is 324 < 340. So the pieces floor is set
   BELOW the current honest value now and raised as pieces are added — a red gate at
   wave-end would violate arm-by-wave. `rooms = 60` is the design value verbatim (it clears
   the post-gather census of 62 by construction, and the pre-gather 94 with room to spare). */
const ROOMS_FLOOR = 60;
const PIECES_FLOOR = 324;   // W2.3: risen to the post-enrolment count (§10 W2.3). The R3 strays were
                            // already enrolled at T2.1a, so the honest total is unchanged at 324 — the
                            // W2.3 re-homing added on-page kin links, not new pieces. RISES toward ≥340
                            // as the WITHINs (W2.5) and the gather (W2.7) enroll genuinely new pieces.

/* ── the on-disk top-level dir universe ─────────────────────────────────────── */
function topLevelDirs() {
  return readdirSync(ROOT)
    .filter((d) => { try { return statSync(join(ROOT, d)).isDirectory() && !d.startsWith('.'); } catch { return false; } })
    .sort();
}

/* ── first-class scrape: dirs THIS hub links in its own exhibit idiom ────────── */
function classTokens(attrs) {
  const m = attrs.match(/class="([^"]*)"/);
  return m ? m[1].trim().split(/\s+/).filter(Boolean) : [];
}
function isFirstClass(tokens, firstClass) {
  if (tokens.length === 0) return firstClass.includes(NONE);
  return tokens.some((t) => firstClass.includes(t));
}
/* all top-level dirs a hub links via a first-class (../X/…) anchor. When a hub row
   pins a `file`, only that page is read (the room's real front page — e.g. hours/
   the-hours.html); otherwise EVERY html page under the hub dir is scanned, because
   several hubs present exhibits across sub-pages (clockwork/turn.html, sound-garden
   instrument pages), matching the census reverse-link ground truth. */
function hubPages(hub, file) {
  if (file) return [join(ROOT, file)];
  const base = join(ROOT, hub);
  return readdirSync(base)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.src.html'))
    .sort()
    .map((f) => join(base, f));
}
function scrapeHubDirs(hub, firstClass, file) {
  const pages = hubPages(hub, file);
  if (!pages.length) die('hub "' + hub + '" has no html pages');
  const re = /<a\b([^>]*?)href="(?:\.\.\/)([a-zA-Z0-9_-]+)\/[^"]*"([^>]*)>/g;
  const out = new Set();
  for (const page of pages) {
    if (!existsSync(page)) die('hub "' + hub + '" page not found: ' + page);
    const html = readFileSync(page, 'utf8');
    let m;
    while ((m = re.exec(html))) {
      const dir = m[2];
      if (dir === hub) continue;
      if (isFirstClass(classTokens(m[1] + ' ' + m[3]), firstClass)) out.add(dir);
    }
  }
  return out;
}

/* ── a cached, deterministic display name for a piece dir / internal page ────── */
const nameCache = new Map();
function titleCase(slug) {
  return String(slug).split('-').map((w) => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}
function readName(relPathOrDir) {
  if (nameCache.has(relPathOrDir)) return nameCache.get(relPathOrDir);
  let file = join(ROOT, relPathOrDir);
  let html = null;
  try {
    if (existsSync(file) && statSync(file).isDirectory()) {
      const idx = join(file, 'index.html');
      if (existsSync(idx)) html = readFileSync(idx, 'utf8');
      else { const h = readdirSync(file).filter((f) => f.endsWith('.html') && !f.endsWith('.src.html')).sort()[0]; if (h) html = readFileSync(join(file, h), 'utf8'); }
    } else if (existsSync(file)) { html = readFileSync(file, 'utf8'); }
  } catch { /* fall through to titleCase */ }
  let name = null;
  if (html) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const raw = (h1 && h1[1]) || (t && t[1]) || '';
    name = raw.replace(/<[^>]+>/g, '').split('·')[0].split('—')[0].replace(/\s+/g, ' ').trim() || null;
  }
  const slug = String(relPathOrDir).split('/').pop().replace(/\.html$/, '');
  const val = name || titleCase(slug);
  nameCache.set(relPathOrDir, val);
  return val;
}

/* ── internal-piece extractors (js-manifest / pieces-dir / internal-links) ───── */
function extractInternal(row) {
  const out = []; // {name, href, kind}
  if (row.rule === 'js-manifest') {
    const src = readFileSync(join(ROOT, row.file), 'utf8');
    const base = row.base || dirOf(row.file);
    const re = /file:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(src))) out.push({ name: m[2], href: base + '/' + m[1], kind: row.kind });
  } else if (row.rule === 'pieces-dir') {
    const dir = join(ROOT, row.dir);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.html') && !f.endsWith('.src.html')).sort()) {
      out.push({ name: titleCase(f.replace(/\.html$/, '')), href: row.dir + '/' + f, kind: row.kind });
    }
  } else if (row.rule === 'internal-links') {
    const html = readFileSync(join(ROOT, row.file), 'utf8');
    const re = /<a\b([^>]*?)href="([a-zA-Z0-9_-]+)\/[^"]*"([^>]*)>/g; // subdir links (no ../)
    const seen = new Set();
    let m;
    while ((m = re.exec(html))) {
      const sub = m[2];
      if (seen.has(sub)) continue;
      if (isFirstClass(classTokens(m[1] + ' ' + m[3]), row.firstClass)) {
        seen.add(sub);
        out.push({ name: readName(row.hub + '/' + sub), href: row.hub + '/' + sub + '/index.html', kind: row.kind });
      }
    }
  }
  // §6.2 hard error: every extracted href must exist on disk (an exact file for
  // js-manifest/pieces-dir; internal-links resolves to a subdir index).
  for (const e of out) {
    const probe = join(ROOT, e.href);
    const ok = row.rule === 'internal-links'
      ? (existsSync(probe) || existsSync(join(ROOT, dirname(e.href))))
      : existsSync(probe);
    if (!ok) die('internal href does not exist on disk: ' + e.href + ' (hub ' + row.hub + ')');
  }
  return out;
}

/* ═══ BUILD ═══════════════════════════════════════════════════════════════════ */
function build(opts = {}) {
  const CONTRACTS = Contract.CONTRACTS;
  const rooms = loadPlaces(PLACES_SRC);
  const roomByDir = new Map();          // dir -> room record (primary presenter lookup)
  for (const r of rooms) roomByDir.set(dirOf(r.href), r);
  const roomDirs = new Set(rooms.map((r) => dirOf(r.href)));

  // opts.extraDirs = synthetic top-level dirs planted for the §6.2 neg-control (a dir in
  // the universe claimed by nothing). FS-free: a planted dir has no first-class hub link,
  // resolves to primary=null, is skipped before any existsSync probe, and lands in
  // `unclaimed` — exactly as a real un-enrolled dir would, without mutating the repo.
  const allDirs = [...new Set([...topLevelDirs(), ...(opts.extraDirs || [])])].sort();
  const companionDirs = new Set(Object.keys(COMPANIONS));
  const withinDirs = new Set(Object.keys(WITHINS));
  const allowSet = new Set(ALLOWLIST);
  const specialClaims = new Set([CROSS.dir, ...HIDDEN.map((h) => dirOf(h.href))]);

  // the exhibit universe: top-level dirs that must resolve to a hub exhibit
  const nonExhibit = new Set([...roomDirs, ...allowSet, ...companionDirs, ...withinDirs, ...specialClaims]);
  const universe = allDirs.filter((d) => !nonExhibit.has(d)).sort();

  /* ── scrape every hub, build piece -> {first-class hubs} ─────────────────── */
  const hubExhibits = new Map();        // hubDir -> Set(universe dirs)
  for (const { hub, firstClass, file } of HUBS) {
    const dirs = scrapeHubDirs(hub, firstClass, file);
    hubExhibits.set(hub, new Set([...dirs].filter((d) => universe.includes(d))));
  }
  const fcHubsOf = (piece) => {
    const out = [];
    for (const { hub } of HUBS) if (hubExhibits.get(hub).has(piece)) out.push(hub);
    return out.sort();
  };

  /* ── primary resolution (DESIGN §7.1 R1 + §7.3 sole-hub/R3) ──────────────── */
  const primaryOf = new Map();          // piece -> hubDir (its owning room dir)
  const shed = [];
  for (const p of universe) {
    const fc = fcHubsOf(p);
    const nonWB = fc.filter((h) => h !== 'workbench');
    let primary;
    if (nonWB.length) primary = nonWB[0];                 // alphabetically-first first-class hub
    else if (Object.prototype.hasOwnProperty.call(STRAYS, p)) primary = STRAYS[p]; // sole-Workbench, R3-bound
    else if (fc.includes('workbench')) { primary = 'workbench'; shed.push(p); }    // Shed heritage
    else primary = null;                                  // orphan → surfaced below
    if (primary) primaryOf.set(p, primary);
  }

  /* ── assemble exhibits per room ──────────────────────────────────────────── */
  const exhibitsByRoom = new Map();     // roomId -> [{name,href,kind,...}]
  const pushEx = (hubDir, ex) => {
    const room = roomByDir.get(hubDir);
    if (!room) die('exhibit hub "' + hubDir + '" is not a PLACES room dir (piece ' + ex.href + ')');
    if (!exhibitsByRoom.has(room.id)) exhibitsByRoom.set(room.id, []);
    exhibitsByRoom.get(room.id).push(ex);
    return room;
  };
  const claimed = new Set([...roomDirs]);
  // claimBy: dir -> the channel(s) that claim it, so a double-claim surfaces (the
  // FAIL enforcement is W2.1b; here it is a self-check that keeps the author honest)
  const claimBy = new Map();
  for (const d of roomDirs) claimBy.set(d, ['room']);
  const stake = (dir, chan) => { if (!claimBy.has(dir)) claimBy.set(dir, []); claimBy.get(dir).push(chan); claimed.add(dir); };

  // top-level-dir exhibits (the 117 universe pieces)
  for (const p of universe) {
    const hubDir = primaryOf.get(p);
    if (!hubDir) continue;
    if (!existsSync(join(ROOT, p))) die('exhibit dir does not exist on disk: ' + p);
    const kind = hubDir === 'workbench' ? 'instrument'
      : Object.prototype.hasOwnProperty.call(STRAYS, p) && fcHubsOf(p).filter((h) => h !== 'workbench').length === 0 ? 'stray'
        : 'exhibit';
    pushEx(hubDir, { name: readName(p), href: p + '/index.html', kind });
    stake(p, 'exhibit:' + hubDir);
  }
  // internal-page exhibits (not top-level dirs — pieces count only)
  for (const row of INTERNAL) {
    for (const ex of extractInternal(row)) pushEx(row.hub, ex);
  }
  // companions (R5) — skip those that are also WITHINs (WITHIN claims them)
  for (const piece of sorted(Object.keys(COMPANIONS))) {
    if (withinDirs.has(piece)) continue;
    if (!existsSync(join(ROOT, piece))) die('companion dir does not exist: ' + piece);
    pushEx(COMPANIONS[piece], { name: readName(piece), href: piece + '/index.html', kind: 'companion' });
    stake(piece, 'companion:' + COMPANIONS[piece]);
  }
  // withins (§7.2)
  for (const piece of sorted(Object.keys(WITHINS))) {
    const w = WITHINS[piece];
    if (!existsSync(join(ROOT, piece))) die('within dir does not exist: ' + piece);
    const room = roomByDir.get(w.parent);
    if (!room) die('within parent "' + w.parent + '" is not a room (piece ' + piece + ')');
    const ex = { name: readName(piece), href: piece + '/index.html', kind: 'within', gate: w.gate };
    if (Object.prototype.hasOwnProperty.call(COMPANIONS, piece)) ex.companionOf = COMPANIONS[piece];
    pushEx(w.parent, ex);
    stake(piece, 'within:' + w.parent);
  }

  /* ── the crossings collection (R4) + hidden (R7) ─────────────────────────── */
  const crossOnDisk = readdirSync(join(ROOT, CROSS.dir))
    .filter((d) => { try { return statSync(join(ROOT, CROSS.dir, d)).isDirectory(); } catch { return false; } }).sort();
  if (crossOnDisk.join(',') !== sorted(CROSS.roster).join(',')) {
    die('crossings roster drift — on disk [' + crossOnDisk.join(', ') + '] vs registry [' + sorted(CROSS.roster).join(', ') + ']');
  }
  const collection = {
    id: CROSS.id, label: CROSS.label,
    pieces: crossOnDisk.map((d) => ({ name: readName(CROSS.dir + '/' + d), href: CROSS.dir + '/' + d + '/index.html' })),
  };
  stake(CROSS.dir, 'collection:' + CROSS.id);
  const hidden = HIDDEN.map((h) => ({ id: h.id, gate: h.gate, ws: h.ws, href: h.href }));
  for (const h of HIDDEN) { if (!existsSync(join(ROOT, dirOf(h.href)))) die('hidden dir does not exist: ' + h.href); stake(dirOf(h.href), 'hidden:' + h.id); }

  // allowlist (present-or-future; presence not required)
  for (const d of ALLOWLIST) if (allDirs.includes(d)) stake(d, 'allowlist');

  /* ── the completeness gate ───────────────────────────────────────────────── */
  const unclaimed = allDirs.filter((d) => !claimed.has(d)).sort(cmp);
  const doubleClaimed = [...claimBy.entries()].filter(([, chans]) => chans.length > 1)
    .map(([dir, chans]) => dir + ' <- [' + chans.join(', ') + ']').sort(cmp);

  /* ── piece counting (§6.1) ───────────────────────────────────────────────── */
  // per-district: room-pages + exhibits (top-level + internal + companion + within)
  //               primary to that district's rooms. NOT collection/hidden.
  const districtIds = sorted(Object.keys(CONTRACTS));
  const districtOf = new Map();         // roomId -> districtId
  for (const r of rooms) districtOf.set(r.id, r.district);

  const districts = districtIds
    .filter((id) => rooms.some((r) => r.district === id))
    .map((id) => {
      const c = CONTRACTS[id];
      const drooms = rooms.filter((r) => r.district === id)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || cmp(a.id, b.id));
      const roomsOut = drooms.map((r) => {
        const ex = (exhibitsByRoom.get(r.id) || []).slice().sort((a, b) => cmp(a.name, b.name) || cmp(a.href, b.href));
        return {
          id: r.id, room: r.room, href: r.href, tier: r.tier, cluster: r.wing || null,
          locked: r.locked || false,
          exhibits: ex,
        };
      });
      const pieces = roomsOut.reduce((n, r) => n + 1 + r.exhibits.length, 0);
      return {
        id, label: c.theme && c.theme.label, tier: c.tier,
        angle: (typeof c.angle === 'number') ? c.angle : null,
        counts: { rooms: roomsOut.length, pieces, within: pieces - roomsOut.length },
        rooms: roomsOut,
      };
    })
    .sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99) || (a.angle ?? 999) - (b.angle ?? 999) || cmp(a.id, b.id));

  const collectionPieces = collection.pieces.length;
  const hiddenPieces = hidden.length;
  const perDistrictPieces = districts.reduce((n, d) => n + d.counts.pieces, 0);
  const estatePieces = perDistrictPieces + collectionPieces + hiddenPieces;

  let head = 'unknown';
  try { head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { /* detached / no git */ }

  const manifest = {
    generatedAt: head,
    counts: { districts: districts.length, rooms: rooms.length, pieces: estatePieces },
    districts,
    collections: [collection],
    hidden,
    unclaimed,
  };

  return { manifest, universe, primaryOf, shed, unclaimed, doubleClaimed, allDirs, claimed, districts };
}

/* ═══ THE --check GATE (§6.2 / §6.3 / §9.4) ═══════════════════════════════════
   A forge-style re-derive-and-diff gate: completeness (unclaimed []), the double-claim
   law, href existence (enforced in build() via die()), the count floors, and staleness
   vs the committed file. Returns { ok, failures } so it is unit-testable off the CLI. */

// staleness compare EXCLUDES generatedAt: it is the git HEAD sha at generation time, so
// the committed manifest is perpetually stale-by-one vs its OWN commit (§6.1) — comparing
// it would make the gate a permanent false-red. Every OTHER field must match a fresh emit.
function normalizeForCompare(manifestObj) {
  const { generatedAt, ...rest } = manifestObj;   // eslint-disable-line no-unused-vars
  return JSON.stringify(rest, null, 2);
}

function evaluate(result, committedJson) {
  const failures = [];
  const m = result.manifest;
  // 1. completeness — the structural no-more-orphans law
  if (result.unclaimed.length) {
    failures.push('UNCLAIMED (' + result.unclaimed.length + '): ' + result.unclaimed.join(', ')
      + ' — claim each via a room href / an exhibit href / the crossings collection / the hidden node / the §6.2 allowlist');
  }
  // 2. the double-claim law — a dir claimed by more than one channel
  if (result.doubleClaimed.length) {
    failures.push('DOUBLE-CLAIMED (' + result.doubleClaimed.length + '): ' + result.doubleClaimed.join('; ')
      + ' — every dir must be claimed by EXACTLY one channel');
  }
  // 3. baseline floors — coarse parse-regression tripwires
  if (m.counts.rooms < ROOMS_FLOOR) failures.push('rooms floor: ' + m.counts.rooms + ' < ' + ROOMS_FLOOR + ' (a parse regression dropped rooms)');
  if (m.counts.pieces < PIECES_FLOOR) failures.push('pieces floor: ' + m.counts.pieces + ' < ' + PIECES_FLOOR + ' (a scrape regression dropped pieces)');
  // 4. staleness — the committed manifest must re-derive byte-identical (minus generatedAt)
  if (committedJson == null) {
    failures.push('estate-manifest.json is MISSING — run `node tools/manifest/manifest.mjs`');
  } else {
    let committed;
    try { committed = JSON.parse(committedJson); } catch { committed = null; }
    if (committed == null) failures.push('estate-manifest.json is unparseable — run `node tools/manifest/manifest.mjs`');
    else if (normalizeForCompare(m) !== normalizeForCompare(committed)) {
      failures.push('estate-manifest.json is STALE — re-derive: `node tools/manifest/manifest.mjs` (then commit it in the same change)');
    }
  }
  return { ok: failures.length === 0, failures };
}

/* ═══ MAIN ════════════════════════════════════════════════════════════════════ */
function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv);

  /* ── --check: the estate gate (re-derive + diff, forge-style; never writes) ── */
  if (args.has('--check')) {
    // --plant=<name> is the §6.2 neg-control hook: inject a synthetic unclaimed dir so the
    // gate FAILS LOUD (used by manifest.test.mjs; FS-free, harms nothing).
    const plant = argv.filter((a) => a.startsWith('--plant=')).map((a) => a.slice('--plant='.length));
    const result = build({ extraDirs: plant });
    const committed = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
    const { ok, failures } = evaluate(result, committed);
    const m = result.manifest;
    console.log(`manifest --check: ${m.counts.districts} districts · ${m.counts.rooms} rooms · ${m.counts.pieces} pieces · unclaimed ${result.unclaimed.length} · floors rooms≥${ROOMS_FLOOR} pieces≥${PIECES_FLOOR}`);
    if (ok) { console.log('manifest --check: OK — complete · no double-claim · floors met · not stale'); process.exit(0); }
    console.error('manifest --check: FAIL\n  - ' + failures.join('\n  - '));
    process.exit(1);
  }

  const { manifest, universe, shed, unclaimed, doubleClaimed } = build();
  const json = JSON.stringify(manifest, null, 2);

  if (!args.has('--dry')) {
    const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
    if (prev === json) console.log('manifest: estate-manifest.json already current');
    else { writeFileSync(OUT, json + '\n'); console.log('manifest: estate-manifest.json ' + (prev ? 're-derived' : 'written')); }
  }

  const outbuilding = manifest.districts.find((d) => d.id === 'outbuilding');
  console.log(`manifest: ${manifest.counts.districts} districts · ${manifest.counts.rooms} rooms · ${manifest.counts.pieces} pieces · unclaimed ${unclaimed.length}`);
  console.log(`manifest: Maker's Shed (outbuilding) reads ${outbuilding ? outbuilding.counts.pieces : '?'} pieces (Workbench heritage ${shed.length})`);

  if (args.has('--report') || args.has('--dry')) {
    console.log('\n--- exhibit universe: ' + universe.length + ' pieces ---');
    console.log('--- Shed heritage (Workbench-primary): ' + shed.length + ' ---\n  ' + shed.join(', '));
    if (unclaimed.length) console.log('\n!!! UNCLAIMED (' + unclaimed.length + '):\n  ' + unclaimed.join('\n  '));
    else console.log('\n✓ unclaimed: [] — every top-level dir is claimed');
    if (doubleClaimed.length) console.log('\n!!! DOUBLE-CLAIMED (' + doubleClaimed.length + '):\n  ' + doubleClaimed.join('\n  '));
    else console.log('✓ no double-claim — every dir claimed by exactly one channel');
    console.log('\n--- per-district counts ---');
    for (const d of manifest.districts) console.log(`  ${d.id}: rooms ${d.counts.rooms} · pieces ${d.counts.pieces} · within ${d.counts.within}`);
  }

  // arm the completeness law in write/report mode too (defense in depth): a broken
  // manifest must not be silently written green. The full gate (floors + staleness) is --check.
  if (unclaimed.length || doubleClaimed.length) {
    console.error('manifest: FAIL — ' + (unclaimed.length ? unclaimed.length + ' unclaimed ' : '') + (doubleClaimed.length ? doubleClaimed.length + ' double-claimed' : ''));
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(); } catch (e) { console.error('manifest: ' + (e && e.stack ? e.stack : e)); process.exit(1); }
}

export { build, evaluate, normalizeForCompare, ROOMS_FLOOR, PIECES_FLOOR };
