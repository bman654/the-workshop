#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE GATE — reclaim.mjs

   Re-pin the GATE-ROOMS data slab in the-gate/the-gate.src.html from the LIVE
   front-door room registry, so the grounds' room-rep pool stays true to the estate
   as rooms are added. collate.sh PHASE 1 auto-runs every repo-root-child
   reclaim.mjs by convention (ZERO collate.sh edit needed — the-gate/ is a
   repo-root child); PHASE 2 forge --all re-inlines the fresh slab into
   the-gate.html the same cycle.

   It IMPORTS `loadPlaces` from ../card-catalog/reclaim.mjs (that module is
   entry-module-guarded, so importing it does NOT re-pin the card catalog). For
   each place it projects {id, room, glyph, accent, district, href, locked}, SKIPS
   locked:true entries (the undercroft — the gate shows it via a live ws: predicate,
   not as a room-rep), and writes the array as JSON between the GATE-ROOMS
   sentinels in the-gate.src.html.

   Idempotent (a 2nd run on an unchanged estate → byte-identical file). REFUSES
   (nonzero exit, NO write) if the parse yields implausibly few places — a grep
   floor over the front-door PLACES block, mirroring card-catalog/census so a
   parse-miss FAILS loudly rather than shipping a short pool.

   Run:  node the-gate/reclaim.mjs        (from repo root)
   Exits 0 on success (changed or not); non-zero on any error.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlaces } from '../card-catalog/reclaim.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_PATH = join(__dirname, 'the-gate.src.html');
const PLACES_PATH = join(__dirname, '..', 'index.src.html');

const BEGIN = '<!-- GATE-ROOMS BEGIN -->';
const END = '<!-- GATE-ROOMS END -->';

/* Project a front-door PLACES record to the gate's slab shape. */
const GATE_FIELDS = ['id', 'room', 'glyph', 'accent', 'district', 'href', 'locked'];
function projectGate(rec) {
  const o = {};
  for (const f of GATE_FIELDS) {
    if (rec[f] !== undefined) o[f] = rec[f];
  }
  return o;
}

function main() {
  // loadPlaces() already REFUSES on a short/broken parse (a grep-floor over the
  // SAME PLACES block, every required field present). That is our primary guard.
  const all = loadPlaces();

  // independent, gate-local floor guard (belt-and-suspenders): the front-door
  // PLACES must carry plausibly-many rooms. If the import ever changes behavior,
  // this still refuses to ship a short pool.
  const placesText = readFileSync(PLACES_PATH, 'utf8');
  const markerStart = placesText.indexOf('const PLACES = [');
  let block = markerStart >= 0 ? placesText.slice(markerStart) : placesText;
  const blockEnd = block.indexOf('\n];');
  if (blockEnd >= 0) block = block.slice(0, blockEnd);
  const idFloor = (block.match(/\bid:"/g) || []).length;
  if (idFloor < 50) {
    console.error('reclaim (gate): REFUSING — front-door PLACES grep floor is only ' +
      idFloor + ' id:" keys (expected ≥50). Parse looks broken; not shipping a short pool.');
    process.exit(1);
  }
  if (all.length < idFloor) {
    console.error('reclaim (gate): REFUSING — recovered ' + all.length +
      ' places but the block has ' + idFloor + ' id:" keys (a parse-miss would ship short).');
    process.exit(1);
  }

  // SKIP locked entries (the undercroft); project the rest.
  const projected = all.filter((r) => !r.locked).map(projectGate);

  if (projected.length < 50) {
    console.error('reclaim (gate): REFUSING — only ' + projected.length +
      ' unlocked places after projection (expected ≥50).');
    process.exit(1);
  }

  // pretty-printed for a readable diff; stable field order (matches GATE_FIELDS).
  const json = JSON.stringify(projected, null, 1);

  const src = readFileSync(SRC_PATH, 'utf8');
  const b = src.indexOf(BEGIN);
  const e = src.indexOf(END);
  if (b === -1 || e === -1 || e < b) {
    console.error('reclaim (gate): could not find the GATE-ROOMS sentinels in the-gate.src.html.');
    process.exit(1);
  }
  const before = src.slice(0, b + BEGIN.length);
  const after = src.slice(e);
  const updated = before + '\n' + json + '\n' + after;

  const tag = '[' + projected.length + ' rooms · ' + (all.length - projected.length) + ' locked-skipped]';
  if (updated === src) {
    console.log('reclaim (gate): GATE-ROOMS already current ' + tag);
  } else {
    writeFileSync(SRC_PATH, updated);
    console.log('reclaim (gate): GATE-ROOMS re-pinned ' + tag);
  }
  process.exit(0);
}

// Run main() only when invoked as the entry module (so a future twin could import
// helpers without re-pinning).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (err) {
    console.error('reclaim (gate): ' + (err && err.message ? err.message : err));
    process.exit(1);
  }
}
