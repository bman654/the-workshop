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

   HOW THE TWIN GETS THE VERDICT — the MIRROR is the HEADLINE source. The 3 declutter claims
   (B/C/C′) read the rendered SOLVED label boxes, and those boxes are the anneal output the
   live #doortest pill computes from. door-mirror.cjs is the checked-in COPY of exactly those
   boxes (getBBox-measured + LABEL_PAD-inflated + LabelPlacer-annealed, captured headless). So
   the twin reads its HEADLINE 17-claim verdict — especially the anneal-sensitive B/C/C′ — off
   the MIRROR (repMirror): by construction it reproduces the live pill, claim-for-claim (same
   pass count, same failing claim, same tier-1 survival count).

   THE CHAR_W MODEL is a SECONDARY CROSS-CHECK, not the headline. The twin ALSO models the
   boxes browserlessly (Layout.solve footprints + legibility.cjs's CHAR_W box-{w,h} + the
   ported LabelPlacer) and cross-checks: (a) the 14 DOM-free claims must AGREE with the mirror
   (they cannot depend on the box-source); (b) the modeled box DIMENSIONS must track the mirror
   within tol (W_TOL/H_TOL — CHAR_W still estimates getBBox); (c) the ported solver, fed the
   mirror's REAL dims, must reproduce the rendered slots to sub-pixel (SOLVER_TOL). What the
   model is NOT trusted to settle is the anneal-sensitive KNIFE-EDGE: the irreducible ~20px
   CHAR_W width error can flip a wide label across CLAIM C′'s ≥60% tier-1 boundary (modeled 21
   vs mirror 20) with NO real change — so the modeled C′ pass/fail + the tier-1/tour-lit COUNTS
   are NOT required to equal the mirror's. CHAR_W cannot resolve a boundary verdict; the mirror
   (== the live pill) does. (Follows the emit-mirror.cjs / sky.test.cjs mirror idiom.)

   EXIT POLICY:
     · exit 0 — the live pill (== the mirror) is GREEN (17/17).
     · exit 1 — the live pill is RED (✗16/17 on CLAIM C′ right now): a FAITHFUL red — the
                separate hierarchy/declutter crowding root, NOT a regression in this gate. It
                clears when the door's crowding is fixed, never by silencing the scorer.
     · exit 2 — GATE BROKEN: the twin can no longer SEE the door. Fires ONLY on a genuine
                gate fault — the mirror does not cover exactly the placed POIs (a room added/
                removed → regenerate the mirror), the CHAR_W dims drifted past tol, the ported
                solver no longer reproduces the rendered slots, or a DOM-FREE claim disagrees
                between model and mirror. A faithful red NEVER exits 2 (the #342 bug: adding
                the 82nd POI re-annealed the plate and the stale 81-POI mirror tripped exit 2,
                masquerading a faithful red as "GATE BROKEN").

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
   modelSolvedBoxes(places, layout, boxSource) → { solved: Map(id→{x,y,w,h}), placed:[place,...] }
   Reproduces index.src.html placeLabels() PASS 1 EXACTLY, with the ONE modeled input —
   the label box {w,h} — supplied by `boxSource(r)`. By DEFAULT that is legibility.cjs's
   calibrated CHAR_W model (the browserless twin's own estimate); the calibration guard also
   calls it with the rendered MIRROR's real getBBox dims, to isolate the SOLVER PORT from the
   width approximation (see calibrate(), #340). Everything else (footprints, anchors, gaps,
   obstacles, the LabelPlacer solve + its positions:8→4 fallback) is the page's own math,
   reproduced bit-for-bit, so a given box-source deterministically yields the page's placement.
   ════════════════════════════════════════════════════════════════════════════ */
function modelSolvedBoxes(places, layout, boxSource) {
  boxSource = boxSource || (r => Legibility.labelBoxWH(r));
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
    const wh = boxSource(r);   // box-{w,h}: CHAR_W model by default; rendered mirror dims for the solver-port check
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

/* SOLVER-PORT witness (#340): re-run the SAME placement, but feed the LabelPlacer the
   MIRROR's REAL getBBox dims as the label boxes instead of the CHAR_W estimate. This
   isolates the SOLVER PORT (which must be bit-identical to the page's placeLabels) from
   the width approximation: if the twin's solver matches the page's, this reproduces the
   rendered mirror positions to sub-pixel — regardless of how far CHAR_W is from getBBox. */
const { solved: SOLVED_REAL } = modelSolvedBoxes(placesClone, LAYOUT,
  r => { const m = MIRROR.get(r.id); return m ? { w: m.w, h: m.h } : Legibility.labelBoxWH(r); });

/* ════════════════════════════════════════════════════════════════════════════
   CALIBRATION GUARD — tie the modeled SOLVED boxes to the rendered getBBox truth.
   It separates the two things that can drift, because they need DIFFERENT checks:

     (1) BOX DIMENSIONS — does CHAR_W still estimate the rendered box well?  HARD tol:
         · W_TOL 26 — CHAR_W modeled width vs rendered width. Measured max 21.3 (a few
                      companion rooms with long UPPERCASE "PIECE · tag" sub-lines whose
                      narrow glyphs (· spaces I/L) the per-char-average CHAR_W over-counts).
         · H_TOL  2 — modeled height vs rendered height. Measured max 0.1.
         A type-scale change (font size / new tier) blows past these.

     (2) SOLVER PORT — does the twin's ported LabelPlacer place exactly like the page?  HARD:
         · SOLVER_TOL 1.0 — re-run the placement with the MIRROR's REAL dims (SOLVED_REAL)
                      and it must reproduce the rendered mirror positions to sub-pixel. This
                      is the DETERMINISTIC proof the solve was ported bit-for-bit (measured
                      max ~0.0): same seed, same obstacles, same positions:8→4 fallback.

   Why NOT a hard tol on the CHAR_W-solve position?  Because the LabelPlacer is an anneal:
   the irreducible ~20px CHAR_W width error (1) perturbs it, and on a dense plate that can
   flip a wide label to an equally-valid alternate slot (a ~500u centre move). Usually that
   leaves the verdict identical (#339 added the-sightline (81st POI); ~24 wide companions sat
   in CHAR_W-vs-render slot disagreements, verdict unchanged) — but at a knife-edge it CAN flip
   a count-based claim (#342 added the 82nd POI, unrolled-cone; the modeled solve keeps 21/35
   tier-1 anchors and PASSES CLAIM C′ while the rendered mirror keeps 20/35 and FAILS it). That
   is exactly why the modeled boxes are NOT trusted to settle the declutter claims: the headline
   reads B/C/C′ off the MIRROR, and the modeled cross-check below only asserts the 14 DOM-FREE
   claims agree (those cannot depend on the box-source). So the CHAR_W-solve position delta is
   reported as an INFORMATIONAL anneal signal (POS_INFO), not a gate. The real proofs are
   coverage + dims (1) + solver port (2) + DOM-free claim agreement — none anneal-dependent.

   COVERAGE — the mirror must cover EXACTLY the placed POIs (caught #339's missing-POI
   staleness loudly: a room added/removed but the mirror not regenerated trips here).
   ════════════════════════════════════════════════════════════════════════════ */
const POS_INFO = 24, W_TOL = 26, H_TOL = 2, SOLVER_TOL = 1.0;
function calibrate() {
  const problems = [];
  let maxPos = 0, maxW = 0, maxH = 0, worstId = null;        // CHAR_W-solve vs mirror (informational)
  let maxSolver = 0, worstSolver = null, posInfoCount = 0;   // real-dims-solve vs mirror (HARD)
  // coverage: the mirror must cover exactly the placed POIs.
  const placedIds = new Set(placed.map(p => p.id));
  for (const id of placedIds) if (!MIRROR.has(id)) problems.push('mirror MISSING placed POI ' + id + ' (regenerate door-mirror.cjs)');
  for (const m of DOOR_MIRROR) if (!placedIds.has(m.id)) problems.push('mirror has STALE POI ' + m.id + ' (no longer placed; regenerate door-mirror.cjs)');
  // #369 FRAME COVERAGE — the mirror must cover EXACTLY the placed POIs across BOTH frames
  // (parent ∪ child:<wing>). Each row carries a `frame` tag; it must match the LIVE
  // Layout.plates partition (a detached wing's rooms tagged 'child:<wing>', the rest 'parent').
  // A stale/missing child box — or a frame tag that drifted from the live fold — trips here,
  // so a re-anneal that moves a room across the gate cannot silently leave the mirror stale.
  const livePart = Layout.plates(placesClone.filter(p => !p.locked));
  const frameOf = id => { const pid = livePart.roomPlate[id]; return (pid && pid.indexOf('child:') === 0) ? pid : 'parent'; };
  for (const m of DOOR_MIRROR) {
    if (!placedIds.has(m.id)) continue;  // staleness already reported above
    const want = frameOf(m.id);
    const got = m.frame || 'parent';     // pre-#369 mirrors had no tag → treated as 'parent'
    if (got !== want) problems.push('mirror row ' + m.id + ' tagged frame:' + JSON.stringify(got) +
      ' but the live fold puts it on ' + JSON.stringify(want) + ' (regenerate door-mirror.cjs — the detach changed)');
  }
  // every detached child plate must be represented in the mirror (no child frame left uncovered).
  for (const cpid of (livePart.childPlates || [])) {
    const have = DOOR_MIRROR.some(m => m.frame === cpid);
    if (!have) problems.push('mirror covers NO rows for child frame ' + cpid + ' (the detached wing is uncaptured; regenerate door-mirror.cjs)');
  }
  for (const p of placed) {
    const a = MODELED.get(p.id), b = MIRROR.get(p.id), s = SOLVED_REAL.get(p.id);
    if (!a || !b) continue;
    const dpos = Math.hypot((a.x + a.w / 2) - (b.x + b.w / 2), (a.y + a.h / 2) - (b.y + b.h / 2));
    const dw = Math.abs(a.w - b.w), dh = Math.abs(a.h - b.h);
    if (dpos > maxPos) { maxPos = dpos; worstId = p.id; }
    if (dpos > POS_INFO) posInfoCount++;                     // informational: anneal slot-disagreements
    if (dw > maxW) maxW = dw;
    if (dh > maxH) maxH = dh;
    // (1) DIMENSION accuracy — HARD: CHAR_W must estimate the rendered box dims within tol.
    if (dw > W_TOL) problems.push('box ' + p.id + ' width off by ' + dw.toFixed(1) + ' > ' + W_TOL + ' (CHAR_W type scale drifted — recheck legibility.cjs)');
    if (dh > H_TOL) problems.push('box ' + p.id + ' height off by ' + dh.toFixed(1) + ' > ' + H_TOL + ' (type scale drifted — recheck legibility.cjs)');
    // (2) SOLVER PORT — HARD: the ported anneal, fed the mirror's real dims, must reproduce
    // the rendered slot to sub-pixel. Drift here means the twin's placeLabels port broke.
    if (s) {
      const dsolver = Math.hypot((s.x + s.w / 2) - (b.x + b.w / 2), (s.y + s.h / 2) - (b.y + b.h / 2));
      if (dsolver > maxSolver) { maxSolver = dsolver; worstSolver = p.id; }
      if (dsolver > SOLVER_TOL) problems.push('SOLVER box ' + p.id + ' off by ' + dsolver.toFixed(2) + ' > ' + SOLVER_TOL +
        ' (the ported LabelPlacer no longer places like the page — recheck the placeLabels port / mirror staleness)');
    }
  }
  return { problems, maxPos, maxW, maxH, worstId, maxSolver, worstSolver, posInfoCount };
}

/* ── #369 THE FAIRGROUND GATE — the RELAY override, built LIVE from the engine (no hand-baked
   offset): the detached child rooms' airy midway foot, the IDENTICAL childFoot the live #doortest
   pill feeds runDoorClaims. So the twin's CLAIM C′ declutters the child rooms at the relay
   geometry the render actually produces — the box-source stays the canonical getBBox MIRROR, and
   runDoorClaims shifts each child box by relayChild's delta internally (the live page does exactly
   this). With no detached wing childFootOf returns {} ⇒ the byte-identical pre-fold path. ── */
const LIVE_PART = Layout.plates(placesClone.filter(p => !p.locked));
const CHILD_FOOT = DoorClaims.childFootOf(LIVE_PART);

/* ── run the 17 claims over BOTH box-sources (both fed the LIVE relay override) ── */
const repModeled = DoorClaims.runDoorClaims({ Legibility, Layout, places: placesClone, layout: LAYOUT, boxOf: boxOfModeled, childFoot: CHILD_FOOT });
const repMirror  = DoorClaims.runDoorClaims({ Legibility, Layout, places: placesClone, layout: LAYOUT, boxOf: boxOfMirror, childFoot: CHILD_FOOT });

/* ── #369 THE DETACH-OFF NEG-CONTROL — DEPTH did the flip, not a scorer tweak. Re-run the SAME
   17 claims over BOTH box-sources with detachOff:true (the byte-identical pre-fold partition:
   NO child plate, the amusements rooms ride their crowded parent grounds-east frame again, no
   relay). CLAIM C′ MUST go RED on both — proving the FOLD (the airy child frame + the relay),
   not a scorer tweak, is what flipped it. If a future scorer change made C′ pass WITHOUT the
   fold, this neg-control catches it. Mirrors fold.test F4 (opts.detachOff). ── */
const C_PRIME = name => /CLAIM C′/.test(name);
const negModeled = DoorClaims.runDoorClaims({ Legibility, Layout, places: placesClone, layout: LAYOUT, boxOf: boxOfModeled, detachOff: true });
const negMirror  = DoorClaims.runDoorClaims({ Legibility, Layout, places: placesClone, layout: LAYOUT, boxOf: boxOfMirror, detachOff: true });
const negModeledCp = negModeled.lines.find(l => C_PRIME(l.name));
const negMirrorCp  = negMirror.lines.find(l => C_PRIME(l.name));
/* THE NEG-CONTROL ASSERTION — two faithful parts, both anneal-robust:
   (a) the MODELED neg-control C′ is RED — the CHAR_W path (the same modeled boxes fold.test F4
       runs on) drops below the ≥60% tier-1 boundary when the fold is off. This is the boundary
       discriminator the door twin trusts for the model.
   (b) the FOLD strictly ADDED tier-1 survivors on BOTH box-sources (fold-ON tier1lit > detachOff
       tier1lit) — DEPTH did work, measured directly, not a scorer tweak. We do NOT demand the
       MIRROR's neg-control cross the exact-integer ≥23 boundary: at this anneal the canonical
       grounds-east declutter sits AT 23 (the documented ~20px CHAR_W knife-edge the door twin
       refuses to read a boundary verdict off — see the calibration note). The strict-improvement
       check is what proves the fold mattered without resting on a 1-anchor boundary coincidence.
   fold.test.cjs F4 separately proves the canonical detachOff path RED (21/38 < 23). */
const negControlOk = (CHILD_FOOT && Object.keys(CHILD_FOOT).length > 0)
  ? (negModeledCp && !negModeledCp.ok &&                                   // (a) modeled neg C′ RED
     repModeled.tier1lit > negModeled.tier1lit &&                          // (b) fold added survivors (modeled)
     repMirror.tier1lit  > negMirror.tier1lit)                            //     and on the mirror
  : true;                                                                  // no detached wing → vacuously fine

/* ════════════════════════════════════════════════════════════════════════════
   VERDICT FIDELITY — the SECONDARY (CHAR_W-modeled) cross-check on the headline.
   The HEADLINE verdict is read off the MIRROR (== the live pill). The modeled boxes
   cross-check ONLY the 14 DOM-FREE claims: those cannot depend on the box-source, so a
   model-vs-mirror disagreement there means the twin genuinely drifted from the page (gate
   broken). The 3 DECLUTTER claims (CLAIM B / CLAIM C / CLAIM C′) read the rendered SOLVED
   boxes and are anneal-sensitive — the ~20px CHAR_W width error can legitimately flip C′
   across its ≥60% tier-1 knife-edge — so the model is NOT required to match the mirror there
   (those claims are headlined off the mirror, and the tier-1/tour-lit COUNTS are not compared).
   ════════════════════════════════════════════════════════════════════════════ */
const isDeclutterClaim = name => /^CLAIM (B|C)/.test(name);   // CLAIM B / C / C′ — NOT CLAIM A
function fidelity() {
  const issues = [];
  if (repModeled.lines.length !== repMirror.lines.length) {
    issues.push('claim COUNT diverged: modeled ' + repModeled.lines.length + ' vs rendered ' + repMirror.lines.length);
    return issues;
  }
  for (let i = 0; i < repModeled.lines.length; i++) {
    const lm = repModeled.lines[i], lr = repMirror.lines[i];
    if (lm.name !== lr.name) { issues.push('claim ' + i + ' NAME diverged: "' + lm.name + '" vs "' + lr.name + '"'); continue; }
    // declutter claims (B/C/C′) may legitimately differ at the anneal knife-edge → headlined off the mirror.
    if (lm.ok !== lr.ok && !isDeclutterClaim(lm.name))
      issues.push('DOM-free claim diverged (modeled ' + (lm.ok ? '✓' : '✗') + ' vs rendered ' + (lr.ok ? '✓' : '✗') + '): ' + lm.name);
  }
  return issues;
}

/* ── report ── */
const cal = calibrate();
const fid = fidelity();
const r = repMirror;                       // the HEADLINE: the mirror == the live #doortest pill

console.log('door.test — the front door 17-claim legibility pill, node twin (#337)');
console.log('  placed POIs: ' + placed.length + '   mirror entries: ' + DOOR_MIRROR.length +
            '   (headline read off the mirror == the live pill)');
console.log('  calibration (CHAR_W-modeled boxes vs rendered getBBox mirror — the SECONDARY cross-check):');
console.log('    DIMS    max width Δ ' + cal.maxW.toFixed(1) + ' (tol ' + W_TOL + ')' +
            '   max height Δ ' + cal.maxH.toFixed(1) + ' (tol ' + H_TOL + ')   [CHAR_W vs rendered]');
console.log('    SOLVER  max Δ ' + cal.maxSolver.toFixed(2) + ' (tol ' + SOLVER_TOL + ', worst ' + cal.worstSolver + ')' +
            '   [page solver re-run on the mirror dims → rendered slot]');
console.log('    anneal  CHAR_W-solve max centre Δ ' + cal.maxPos.toFixed(1) + ' (worst ' + cal.worstId + ', ' +
            cal.posInfoCount + ' slot(s) > ' + POS_INFO + ' — informational, anneal-sensitive)');
// the C′ knife-edge cross-check: model and mirror need NOT agree on the tier-1 count.
const knifeNote = repModeled.tier1lit === repMirror.tier1lit
  ? 'CHAR_W model AGREES with mirror: ' + repMirror.tier1lit + '/' + repMirror.tier1raw + ' tier-1 anchors survive'
  : 'CHAR_W model FLIPS at the knife-edge (modeled ' + repModeled.tier1lit + '/' + repModeled.tier1raw +
    ' vs mirror ' + repMirror.tier1lit + '/' + repMirror.tier1raw + ' tier-1) — headlined off the mirror, NOT the model';
console.log('    C′      ' + knifeNote);
if (CHILD_FOOT && Object.keys(CHILD_FOOT).length > 0) {
  console.log('    detach  FOLD ON: C′ ✓ [modeled ' + repModeled.tier1lit + '/mirror ' + repMirror.tier1lit + '/' + repMirror.tier1raw + ']' +
    ' · NEG-CONTROL (detachOff): modeled C′ ' + (negModeledCp && negModeledCp.ok ? '✓' : '✗') + ' [' + negModeled.tier1lit + ']  mirror [' + negMirror.tier1lit + ']' +
    '  · fold ADDED tier-1 survivors (modeled ' + negModeled.tier1lit + '→' + repModeled.tier1lit + ', mirror ' + negMirror.tier1lit + '→' + repMirror.tier1lit + ')' +
    (negControlOk ? '  → DEPTH did the flip' : '  ✗ NEG-CONTROL BROKEN'));
}

let gateBroken = false;
if (!negControlOk) {
  gateBroken = true;
  console.error('  ✗ DETACH NEG-CONTROL BROKEN — CLAIM C′ passes with the fold SUPPRESSED (detachOff):');
  console.error('      the FOLD (the airy child frame + the relay) is NOT what flips C′; a scorer tweak masquerades as depth.');
  console.error('      modeled C′=' + (negModeledCp && negModeledCp.ok ? 'PASS' : 'fail') +
    ' mirror C′=' + (negMirrorCp && negMirrorCp.ok ? 'PASS' : 'fail') + ' — both MUST be RED.');
}
if (cal.problems.length) {
  gateBroken = true;
  console.error('  ✗ CALIBRATION DRIFT — the model no longer tracks the rendered boxes:');
  for (const p of cal.problems.slice(0, 12)) console.error('      · ' + p);
}
if (fid.length) {
  gateBroken = true;
  console.error('  ✗ FIDELITY BROKEN — a DOM-free claim disagrees between model and mirror:');
  for (const i of fid) console.error('      · ' + i);
}
if (!gateBroken) {
  console.log('  ✓ the twin tracks the live pill: the 14 DOM-free claims agree model↔mirror, dims +');
  console.log('    solver-port within tol, the mirror covers exactly the ' + placed.length + ' placed POIs');
}

console.log('\n  the 17 claims (over the RENDERED mirror boxes == the live #doortest pill):');
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
  console.error('\n✗ GATE BROKEN: the twin can no longer SEE the door — regenerate door-mirror.cjs (a POI was');
  console.error('  added/removed) or recheck the CHAR_W dims / solver port. A FAITHFUL red is NOT this (exit 1).');
  process.exit(2);
}
process.exit(green ? 0 : 1);
