#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   door.test.cjs — the front door's legibility + well-formedness pill, AS A NODE TWIN.

   THE BUG IT CLOSES (#337): the door's own self-test (the #doortest pill) once ran ONLY
   in the browser, so the Node gates a builder runs could report GREEN while the rendered
   door was RED. This twin runs the SAME claims (tools/layout/door-claims.cjs, the module
   the page also forge:includes) over the SAME live PLACES (read straight out of
   index.src.html), so `node tools/layout/door.test.cjs` goes red iff the pill is red.

   v2 (§9.1/§9.2 — the Grand Reorganization). The v1 twin needed a checked-in getBBox MIRROR
   + a CHAR_W calibration guard because the v1 pill's claims read the browser's live font
   rasterization (the loupe declutter knife-edge). Under the polar reorg the fit-view estate
   tier draws district STRUCTURES (no room labels at rest) and per-plate labels are modeled by
   the legibility conscience — so EVERY claim is a PURE function of PLACES + the polar solve,
   identical in Node and the browser BY CONSTRUCTION. There is no box-source to inject, no
   mirror to keep fresh, no anneal noise: the twin simply runs runDoorClaims over the live
   PLACES and asserts the pill is fully green. The rendered-truth check the mirror used to
   carry now lives in gate-dom.test.mjs, which verifies the real DOM with REAL browser input
   (the house lesson). door-mirror.cjs is retired.

   EXIT POLICY:
     · exit 0 — the pill is fully GREEN (every ARMED claim passes; skipped claims await their
                wave, §9.2) AND both neg-controls fire (the claims have teeth).
     · exit 1 — a real failure: an armed claim is RED, or a neg-control did NOT fire (a claim
                that cannot fail is not a gate).

   Run:  node tools/layout/door.test.cjs
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');
const Legibility = require('./legibility.cjs');
const DoorClaims = require('./door-claims.cjs');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'index.src.html');
const src = fs.readFileSync(SRC, 'utf8');

/* read the live PLACES straight out of index.src.html (the single source of truth), so
   adding/removing/retuning a room can never silently drift the twin. */
function readArray(name) {
  const head = 'const ' + name + ' = [';
  const start = src.indexOf(head);
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) throw new Error('door.test: could not find array ' + name);
  // eslint-disable-next-line no-eval
  return eval('(' + src.slice(start + ('const ' + name + ' = ').length, end + 2) + ')');
}
const PLACES = readArray('PLACES');

/* the HEADLINE — the pill exactly as the page runs it: runDoorClaims over the live PLACES. */
const live = PLACES.filter(p => !p.locked);
const LAYOUT = Layout.solve(live);
const PART = Layout.plates(live);
const rep = DoorClaims.runDoorClaims({ Legibility, Layout, places: PLACES, layout: LAYOUT, plates: PART });

console.log('door.test — the front door legibility + well-formedness pill, node twin (#337, v2 polar)');
console.log('  ' + live.length + ' live rooms · ' + rep.structureCount + ' fit-view structures · ' +
            rep.estateCollisions + ' estate collisions · worst plate ' + rep.worstPlate +
            ' = ' + rep.worstPlateComposite.toFixed(3) + ' · estate ' + rep.estateComposite.toFixed(3));
console.log('');
console.log('  the ' + rep.armed + ' armed claims (+ ' + rep.skipped + ' awaiting their wave):');
for (const l of rep.lines) {
  const mark = l.skip ? '·' : (l.ok ? '✓' : '✗');
  console.log('    ' + mark + ' ' + l.name + (l.detail ? '  ' + l.detail : ''));
}

/* ════════════════════ NEG-CONTROLS — each MUST fire (the claims have teeth) ═══════════
   §9.3: neg-controls use SYNTHETIC fixtures, never a live §2.1 row. */
let ncFail = 0;

// NEG-CONTROL 1 — estate hitbox: two drawn boxes deliberately placed on top of each other
// MUST register a collision. Proves CLAIM 2 (the estate-tier hitbox check) can fail.
const synth = [
  { id: 's1', box: { x: 1000, y: 1000, w: 200, h: 200 } },
  { id: 's2', box: { x: 1050, y: 1050, w: 200, h: 200 } }
];
const synthCol = DoorClaims.countBoxCollisions(synth).count;
if (synthCol > 0) { console.log('\n  ✓ NEG-CONTROL: two overlapping drawn boxes register a collision [' + synthCol + '] — CLAIM 2 has teeth'); }
else { ncFail++; console.error('\n  ✗ NEG-CONTROL BROKEN: overlapping drawn boxes registered NO collision — CLAIM 2 cannot fail'); }

// NEG-CONTROL 2 — the fold is load-bearing: with the detach OFF the fairground's dormant
// knot cannot fit its polar envelope, so Layout.plates THROWS. Proves the descend/ascend
// round-trip (CLAIM 7) rests on a real fold, not a scorer tweak (mirrors fold.test F4).
let detachOffThrew = false;
try { Layout.plates(live, { detachOff: true }); }
catch (e) { detachOffThrew = true; }
if (detachOffThrew) { console.log('  ✓ NEG-CONTROL: with the fold OFF the estate cannot be laid out (fairground infeasible) — the fold is load-bearing'); }
else { ncFail++; console.error('  ✗ NEG-CONTROL BROKEN: detachOff did NOT throw — the fold is not load-bearing'); }

/* ════════════════════════════════ VERDICT ════════════════════════════════ */
const green = rep.pass;
console.log('');
if (green && ncFail === 0) {
  console.log('PASS ' + rep.passed + '/' + rep.total + ' — the door is PASSABLE (the live pill is green; ' +
              rep.skipped + ' claims await their wave).');
  process.exit(0);
}
if (!green) {
  console.error('door self-test ✗ ' + rep.passed + '/' + rep.total + ' — an ARMED claim is RED:');
  for (const l of rep.lines) if (!l.skip && !l.ok) console.error('  ✗ ' + l.name + (l.detail ? '  ' + l.detail : ''));
}
if (ncFail) console.error('  ✗ ' + ncFail + ' neg-control(s) did not fire — a claim that cannot fail is not a gate.');
process.exit(1);
