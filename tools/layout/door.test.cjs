#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   door.test.cjs — the front door's 17-claim legibility pill, AS A NODE TWIN.

   THE BUG IT CLOSES (#337): the door's own legibility self-test (the #doortest pill)
   ran ONLY in the browser, where it reads the LIVE estate and goes ✗16/17 (CLAIM C′).
   The node gates a builder runs (smoke.cjs, legibility.test.cjs) check the conscience's
   self-consistency on SYNTHETIC controls, so they report GREEN while the rendered door
   is RED — the gate could not SEE what the door shows. This twin runs the SAME 17 claims
   (tools/layout/door-claims.cjs, the module the page also forge:includes) over the SAME
   live data, so `node tools/layout/door.test.cjs` faithfully goes red iff the pill is red.

   HOW THE TWIN GETS THE BOXES (the only DOM-dependent input): 14 of the 17 claims are
   DOM-free and port directly. The 3 declutter claims (B/C/C′) read the rendered SOLVED
   label boxes — so the twin MODELS them: Layout.solve gives exact footprints, legibility.cjs's
   getBBox-calibrated CHAR_W box-{w,h} model gives label dims, and LabelPlacer.solve places
   them exactly as placeLabels() does in the page. A CALIBRATION GUARD ties the modeled
   boxes to the rendered getBBox truth (the checked-in door-mirror.cjs, captured once via
   agent-browser) within a documented tolerance, AND proves the door claims yield the SAME
   verdict over the modeled boxes as over the rendered mirror — so the twin's red IS the
   live pill's red, claim-for-claim. (Follows the emit-mirror.cjs / sky.test.cjs idiom.)

   EXIT POLICY: exits NON-ZERO whenever n < 17 (the door is genuinely red right now —
   ✗16/17 on CLAIM C′ — and that red is FAITHFUL, the separate hierarchy/declutter root,
   NOT a regression in this gate). It goes green only when the live pill goes green. A
   DISTINCT non-zero exit fires if the twin DRIFTS from the rendered mirror (the gate
   itself broke — recalibrate / regenerate the mirror), so a stale model can never silently
   pass a red door or fail a green one.

   Run:  node tools/layout/door.test.cjs
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');
const LabelPlacer = require('../label/label.js');
const Legibility = require('./legibility.cjs');
const DoorClaims = require('./door-claims.cjs');
const DOOR_MIRROR = require('./door-mirror.cjs');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'index.src.html');
const src = fs.readFileSync(SRC, 'utf8');

/* ── read the live declarations straight out of index.src.html (the single source of
   truth) so adding/removing/retuning a room can never silently drift the twin. ── */
function readArray(name) {
  const head = 'const ' + name + ' = [';
  const start = src.indexOf(head);
  const end = src.indexOf('\n];', start);
  if (start < 0 || end < 0) throw new Error('door.test: could not find array ' + name);
  // eslint-disable-next-line no-eval
  return eval('(' + src.slice(start + ('const ' + name + ' = ').length, end + 2) + ')');
}
function readExpr(name) {
  const m = src.match(new RegExp('const\\s+' + name + '\\s*=\\s*([^;]*);'));
  if (!m) throw new Error('door.test: could not find const ' + name);
  // eslint-disable-next-line no-eval
  return eval('(' + m[1].trim() + ')');
}

const PLACES = readArray('PLACES');
const FURNITURE = readArray('FURNITURE');
const LABEL_BOUNDS = readExpr('LABEL_BOUNDS');
const LABEL_SEED = readExpr('LABEL_SEED');
const LABEL_GAP = readExpr('LABEL_GAP');
const LABEL_PAD = readExpr('LABEL_PAD');

/* ── footprint geometry (mirror index.src.html) ── */
function footBBox(r) {
  return r.footprint === 'tower' ? { x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 }
                                 : { x: r.x, y: r.y, w: r.w, h: r.h };
}
function footCentre(r) {
  return r.footprint === 'tower' ? { x: r.x, y: r.y } : { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
function labelGap(r) { const b = footBBox(r); return Math.max(b.w, b.h) / 2 + LABEL_GAP; }
function preferList(r) { return r.prefer ? (Array.isArray(r.prefer) ? r.prefer.slice() : [r.prefer]) : undefined; }

/* ════════════════════════════════════════════════════════════════════════════
   modelSolvedBoxes(places) → { solved: Map(id→{x,y,w,h}), placed:[place,...] }
   Reproduces index.src.html placeLabels() PASS 1 EXACTLY, with the ONE modeled input —
   the label box {w,h} — taken from legibility.cjs's calibrated CHAR_W model instead of a
   live getBBox. Everything else (footprints, anchors, gaps, obstacles, the LabelPlacer
   solve + its positions:8→4 fallback) is the page's own math, reproduced bit-for-bit.
   ════════════════════════════════════════════════════════════════════════════ */
function modelSolvedBoxes(places, layout) {
  const placed = places.filter(p => !p.locked && layout.foot[p.id]);

  // obstacles = footprints + the static FURNITURE + the gnomon HUD furniture +
  // the engraved zone-caption boxes (all reproduced from the page's own derivation).
  const footObstacles = placed.map(p => footBBox(p));
  const gnomon = places.find(p => p.id === 'gnomon');
  const HOURS_FURNITURE = [];
  if (gnomon && layout.foot.gnomon) {
    const GX = gnomon.x + gnomon.w / 2, GY = gnomon.y + gnomon.h / 2, DIAL_R = 30;
    const hudY = GY - (DIAL_R + 18);
    HOURS_FURNITURE.push({ x: GX - 170, y: hudY - 13, w: 340, h: 30 });   // clock+phase
    HOURS_FURNITURE.push({ x: GX - 95,  y: GY + DIAL_R + 30, w: 190, h: 14 }); // self-test pill
  }
  const zoneObstacles = layout.districtRects.map(d => {
    const labelW = d.label.length * 6.4;
    return { x: d.x + d.w / 2 - labelW / 2, y: d.y - 17, w: labelW, h: 15 };
  });
  const obstacles = footObstacles.concat(FURNITURE).concat(HOURS_FURNITURE).concat(zoneObstacles);

  const features = placed.map(r => {
    const wh = Legibility.labelBoxWH(r);   // the single-source CHAR_W box-{w,h} model
    const f = { id: r.id, anchor: footCentre(r), label: { w: wh.w, h: wh.h }, gap: labelGap(r) };
    const pref = preferList(r); if (pref) f.prefer = pref;
    if (r.pin) f.pin = r.pin;
    return f;
  });

  const spec = { bounds: LABEL_BOUNDS, features, obstacles, seed: LABEL_SEED };
  let res = LabelPlacer.solve(Object.assign({ positions: 8 }, spec));
  if (res.overlaps > 0) {
    const alt = LabelPlacer.solve(Object.assign({ positions: 4 }, spec));
    if (alt.overlaps < res.overlaps) res = alt;
  }
  const solved = new Map();
  res.placements.forEach(p => solved.set(p.id, { x: p.label.x, y: p.label.y, w: p.label.w, h: p.label.h }));
  return { solved, placed };
}

/* ── solve + copy footprints back onto a places CLONE (so footCentre/footBBox read the
   derived slots, exactly like the page copies LAYOUT.foot onto PLACES). ── */
const placesClone = PLACES.map(p => Object.assign({}, p));
const LAYOUT = Layout.solve(placesClone);
for (const p of placesClone) {
  const f = LAYOUT.foot[p.id]; if (!f) continue;
  if (f.r != null) { p.x = f.x; p.y = f.y; p.r = f.r; }
  else { p.x = f.x; p.y = f.y; p.w = f.w; p.h = f.h; }
}

const { solved: MODELED, placed } = modelSolvedBoxes(placesClone, LAYOUT);
const boxOfModeled = id => MODELED.get(id) || null;

/* the rendered-truth box-source: the checked-in getBBox mirror. */
const MIRROR = new Map();
for (const m of DOOR_MIRROR) MIRROR.set(m.id, { x: m.x, y: m.y, w: m.w, h: m.h });
const boxOfMirror = id => MIRROR.get(id) || null;

/* ════════════════════════════════════════════════════════════════════════════
   CALIBRATION GUARD — tie the modeled SOLVED boxes to the rendered getBBox truth.
   Documented tolerance (re-measure if the type scale changes; see header):
     · POS_TOL  24 — the modeled LabelPlacer slot vs the rendered slot, centre distance.
                     Measured max 16.9 viewBox-units over the 80 boxes (no side flips).
     · W_TOL    26 — modeled width vs rendered width. Measured max 21.4 (a couple of
                     companion rooms whose "↳ … within" line the CHAR_W model under-counts
                     — harmless: it does not flip a claim, proven by the verdict cross-check).
     · H_TOL     2 — modeled height vs rendered height. Measured max 0.1.
   A stale mirror (a room added/removed/retuned but the mirror not regenerated) trips this
   loudly. This is the geometry early-warning; the VERDICT cross-check below is the proof.
   ════════════════════════════════════════════════════════════════════════════ */
const POS_TOL = 24, W_TOL = 26, H_TOL = 2;
function calibrate() {
  const problems = [];
  let maxPos = 0, maxW = 0, maxH = 0, worstId = null;
  // coverage: the mirror must cover exactly the placed POIs.
  const placedIds = new Set(placed.map(p => p.id));
  for (const id of placedIds) if (!MIRROR.has(id)) problems.push('mirror MISSING placed POI ' + id + ' (regenerate door-mirror.cjs)');
  for (const m of DOOR_MIRROR) if (!placedIds.has(m.id)) problems.push('mirror has STALE POI ' + m.id + ' (no longer placed; regenerate door-mirror.cjs)');
  for (const p of placed) {
    const a = MODELED.get(p.id), b = MIRROR.get(p.id);
    if (!a || !b) continue;
    const dpos = Math.hypot((a.x + a.w / 2) - (b.x + b.w / 2), (a.y + a.h / 2) - (b.y + b.h / 2));
    const dw = Math.abs(a.w - b.w), dh = Math.abs(a.h - b.h);
    if (dpos > maxPos) { maxPos = dpos; worstId = p.id; }
    if (dw > maxW) maxW = dw;
    if (dh > maxH) maxH = dh;
    if (dpos > POS_TOL) problems.push('box ' + p.id + ' centre off by ' + dpos.toFixed(1) + ' > ' + POS_TOL);
    if (dw > W_TOL) problems.push('box ' + p.id + ' width off by ' + dw.toFixed(1) + ' > ' + W_TOL);
    if (dh > H_TOL) problems.push('box ' + p.id + ' height off by ' + dh.toFixed(1) + ' > ' + H_TOL);
  }
  return { problems, maxPos, maxW, maxH, worstId };
}

/* ── run the 17 claims over BOTH box-sources ── */
const repModeled = DoorClaims.runDoorClaims({ Legibility, Layout, places: placesClone, layout: LAYOUT, boxOf: boxOfModeled });
const repMirror  = DoorClaims.runDoorClaims({ Legibility, Layout, places: placesClone, layout: LAYOUT, boxOf: boxOfMirror });

/* ════════════════════════════════════════════════════════════════════════════
   VERDICT FIDELITY — the modeled boxes must yield the SAME 17-claim verdict the
   rendered mirror (== the live pill) yields: same pass count, same failing claims,
   same model-sensitive counts. This is THE proof that the gate sees what the door shows.
   ════════════════════════════════════════════════════════════════════════════ */
function fidelity() {
  const issues = [];
  if (repModeled.passed !== repMirror.passed)
    issues.push('pass count diverged: modeled ' + repModeled.passed + '/' + repModeled.total +
                ' vs rendered ' + repMirror.passed + '/' + repMirror.total);
  const failM = repModeled.lines.filter(l => !l.ok).map(l => l.name).sort();
  const failR = repMirror.lines.filter(l => !l.ok).map(l => l.name).sort();
  if (JSON.stringify(failM) !== JSON.stringify(failR))
    issues.push('failing claims diverged:\n      modeled : ' + (failM.join(' | ') || '(none)') +
                '\n      rendered: ' + (failR.join(' | ') || '(none)'));
  if (repModeled.tier1lit !== repMirror.tier1lit)
    issues.push('tier-1 survival diverged: modeled ' + repModeled.tier1lit + ' vs rendered ' + repMirror.tier1lit);
  if (repModeled.tourLit !== repMirror.tourLit)
    issues.push('tour labels-lit diverged: modeled ' + repModeled.tourLit + ' vs rendered ' + repMirror.tourLit);
  return issues;
}

/* ── report ── */
const cal = calibrate();
const fid = fidelity();
const r = repModeled;

console.log('door.test — the front door 17-claim legibility pill, node twin (#337)');
console.log('  placed POIs: ' + placed.length + '   mirror entries: ' + DOOR_MIRROR.length);
console.log('  calibration (modeled SOLVED boxes vs rendered getBBox mirror):');
console.log('    max centre Δ ' + cal.maxPos.toFixed(1) + ' (tol ' + POS_TOL + ', worst ' + cal.worstId + ')' +
            '   max width Δ ' + cal.maxW.toFixed(1) + ' (tol ' + W_TOL + ')' +
            '   max height Δ ' + cal.maxH.toFixed(1) + ' (tol ' + H_TOL + ')');

let gateBroken = false;
if (cal.problems.length) {
  gateBroken = true;
  console.error('  ✗ CALIBRATION DRIFT — the model no longer tracks the rendered boxes:');
  for (const p of cal.problems.slice(0, 12)) console.error('      · ' + p);
}
if (fid.length) {
  gateBroken = true;
  console.error('  ✗ FIDELITY BROKEN — modeled boxes disagree with the rendered mirror:');
  for (const i of fid) console.error('      · ' + i);
}
if (!gateBroken) {
  console.log('  ✓ fidelity: modeled boxes reproduce the rendered (live-pill) verdict claim-for-claim');
  console.log('             (tier-1 survival ' + r.tier1lit + '/' + r.tier1raw + ', tour lit ' + r.tourLit + '/' + r.tourRaw +
              ', resting ' + r.restVerdict + ' ' + (r.restComposite == null ? '?' : (+r.restComposite).toFixed(3)) +
              ', full plate ' + r.fullVerdict + ' ' + (r.fullComposite == null ? '?' : (+r.fullComposite).toFixed(3)) + ')');
}

console.log('\n  the 17 claims (over the modeled SOLVED boxes):');
for (const l of r.lines) console.log('    ' + (l.ok ? '✓' : '✗') + ' ' + l.name + (l.detail ? '  ' + l.detail : ''));

const green = r.passed === r.total;
console.log('');
if (green) {
  console.log('PASS ' + r.passed + '/' + r.total + ' — the door is PASSABLE (the live pill is green).');
} else {
  console.log('door self-test ✗ ' + r.passed + '/' + r.total + ' — the live door is RED (faithfully reported):');
  for (const l of r.lines) if (!l.ok) console.log('  ✗ ' + l.name + (l.detail ? '  ' + l.detail : ''));
  console.log('  (this red is the separate hierarchy/declutter root, NOT a regression in this gate;');
  console.log('   it clears when the door\'s crowding root is fixed — not by silencing the scorer.)');
}

if (gateBroken) {
  console.error('\n✗ GATE BROKEN: the twin drifted from the rendered door — recalibrate or regenerate door-mirror.cjs.');
  process.exit(2);
}
process.exit(green ? 0 : 1);
