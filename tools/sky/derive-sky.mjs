/* derive-sky.mjs — the v2 SKY GEOMETRY (§3.1/§3.2/§3.4).

   Reads the migration source (catalog-polar.mjs: GROUPS/STARS/HINTS) + the LIVE
   district solve (layout.js) and HANGS every figure on the DERIVED sky ring:

     R_sky      = the solve's world.Rsky (= max district outer edge + SKY_GAP)
     anchor(g)  = polar(R_sky + rOff, theta)   about world.centre  [compass 0=N,90=E,180=S,270=W]
     star pos   = anchor + rot(dx,dy, hang)     (figures pixel-rigid; hang is a one-time rigid turn)
     field star = anchor (a 1-star group at its own bearing, hash-staggered rOff)

   Then it DE-CONFLICTS the ring residents (sorted (theta asc, id asc); all-pairs
   i<j; the LATER of any 24px-overlapping pair pushed OUTWARD +PUSH_STEP rOff until
   clear — a DERIVED budget bounded by SKY_BAND, hard-error on exhaustion), VERIFIES
   every star (inside the viewBox; STAR_PAD clear of every solved footprint + the manor
   pool; 2*STAR_PAD inter-figure clearance — intra-figure spacing is inherited/rigid and
   EXEMPT), and EMITS the legacy {id:{x,y,mag}} CATALOG slab (+ GROUPS + HINTS; STAR_META
   is manifest-guarded, W2.5) into tools/sky/sky.js between sentinels.

   Determinism (§1.6): no Math.random / Date / locale; (theta,id) total sort; reuses
   Polar.hash01; every emitted coord 0.1-rounded. A double run is byte-identical.

   CLI:
     node tools/sky/derive-sky.mjs               # --preflight: the SIZING report + asserts
     node tools/sky/derive-sky.mjs --emit        # write the slab into sky.js
     node tools/sky/derive-sky.mjs --check        # fail (exit 1) if sky.js's slab is stale
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { GROUPS, STARS, HINTS } from './catalog-polar.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Layout = require('../layout/layout.js');
const Polar = require('../layout/polar.js');

const DEG = Math.PI / 180;
const r01 = (v) => Math.round(v * 10) / 10;
const STAR_PAD = 12;      // a star disc's clearance half-extent (matches sky.test)
const FIG_CLEAR = 24;     // §3.1 inter-figure bbox clearance (2*STAR_PAD)
const PUSH_STEP = 40;     // §3.1 outward de-confliction step (rOff units)

/* ── the live district solve → R_sky, world centre, footprints, the manor box ── */
function loadSolve() {
  const src = readFileSync(join(__dirname, '..', '..', 'index.src.html'), 'utf8');
  const a = src.indexOf('const PLACES = [');
  const b = src.indexOf('\n];', a);
  if (a < 0 || b < 0) throw new Error('derive-sky: could not find PLACES in index.src.html');
  // eslint-disable-next-line no-eval
  const PLACES = eval('(' + src.slice(a + 'const PLACES = '.length, b + 2) + ')');
  const sol = Layout.solve(PLACES);
  return sol;
}

/* ── geometry ──────────────────────────────────────────────────────────────── */
function polarPt(centre, r, thetaDeg) {
  const t = thetaDeg * DEG;
  return { x: centre.x + r * Math.sin(t), y: centre.y - r * Math.cos(t) };
}
function rot(dx, dy, phiDeg) {
  const p = phiDeg * DEG, c = Math.cos(p), s = Math.sin(p);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}
function bboxOf(pts) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of pts) { minx = Math.min(minx, p.x); miny = Math.min(miny, p.y); maxx = Math.max(maxx, p.x); maxy = Math.max(maxy, p.y); }
  return { x: minx, y: miny, w: maxx - minx, h: maxy - miny };
}
function grow(b, m) { return { x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m }; }
function boxOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ── build one resident (a group OR a field star) at a given rOff ── */
function residentStars(id, world, rOffOverride) {
  const g = GROUPS[id];
  if (g) {
    const rOff = rOffOverride == null ? g.rOff : rOffOverride;
    const anchor = polarPt(world.centre, world.Rsky + rOff, g.theta);
    const members = Object.keys(STARS)
      .filter((sid) => STARS[sid].group === id)
      .map((sid) => {
        const s = STARS[sid];
        const o = rot(s.dx, s.dy, g.hang || 0);
        return { id: sid, x: anchor.x + o.x, y: anchor.y + o.y, mag: s.mag };
      });
    return { id, isGroup: true, lane: g.lane, theta: g.theta, hang: g.hang || 0, members };
  }
  // field star = 1-star group at its own bearing
  const s = STARS[id];
  const rOff = rOffOverride == null ? s.rOff : rOffOverride;
  const anchor = polarPt(world.centre, world.Rsky + rOff, s.theta);
  return { id, isGroup: false, lane: null, theta: s.theta, hang: 0, members: [{ id, x: anchor.x, y: anchor.y, mag: s.mag }] };
}

/* ── the full derive: hang → de-conflict → verify → CATALOG ── */
function derive(opts = {}) {
  const sol = loadSolve();
  const world = sol.world;
  const report = { Rsky: world.Rsky, skyBand: world.skyBand, viewBox: world.viewBox, centre: world.centre, groups: {}, pushes: [], maxReach: 0 };

  // resident ids: every group + every field star. lanes are pinned (not pushed); ring residents de-conflict.
  const groupIds = Object.keys(GROUPS);
  const fieldIds = Object.keys(STARS).filter((sid) => STARS[sid].group === null);
  const allIds = groupIds.concat(fieldIds);

  // current rOff per resident (starts at the source rOff; ring residents may grow)
  const rOff = {};
  for (const id of groupIds) rOff[id] = GROUPS[id].rOff;
  for (const id of fieldIds) rOff[id] = STARS[id].rOff;

  const laneOf = (id) => (GROUPS[id] ? GROUPS[id].lane : null);
  const thetaOf = (id) => (GROUPS[id] ? GROUPS[id].theta : STARS[id].theta);

  // §3.1 de-confliction budget: a resident may push only while its outermost star
  //   stays inside the band: rOff_final + figure_outward_reach <= SKY_BAND - STAR_PAD.
  function outwardReach(id) {
    // max radial distance of any member BEYOND the anchor radius (anchor = Rsky+rOff)
    const res = residentStars(id, world, rOff[id]);
    let reach = 0;
    for (const m of res.members) {
      const dx = m.x - world.centre.x, dy = m.y - world.centre.y;
      const rad = Math.hypot(dx, dy) - (world.Rsky + rOff[id]);
      if (rad > reach) reach = rad;
    }
    return reach;
  }
  function budgetLeft(id) {
    return (world.skyBand - STAR_PAD) - (rOff[id] + outwardReach(id));
  }

  // ── ring de-confliction: sort (theta asc, id asc); all-pairs (i<j) outward push ──
  const ring = allIds.filter((id) => laneOf(id) === null)
    .sort((A, B) => (thetaOf(A) - thetaOf(B)) || (A < B ? -1 : A > B ? 1 : 0));
  const bboxNow = (id) => grow(bboxOf(residentStars(id, world, rOff[id]).members), FIG_CLEAR / 2);
  for (let i = 0; i < ring.length; i++) {
    for (let j = i + 1; j < ring.length; j++) {
      let guard = 0;
      while (boxOverlap(bboxNow(ring[i]), bboxNow(ring[j]))) {
        // push the LATER-sorted member (j) outward
        if (budgetLeft(ring[j]) < PUSH_STEP) {
          throw new Error('derive-sky: SKY_BAND exhausted de-conflicting "' + ring[j] + '" vs "' + ring[i] +
            '" (rOff ' + rOff[ring[j]] + ', band ' + world.skyBand + '). Remedy: widen SKY_BAND by petition — one ' +
            'constant; regenerate slab + mirrors; §1.7 world/K_MAX and §5.1 K_LOD re-derive from it mechanically.');
        }
        rOff[ring[j]] += PUSH_STEP;
        report.pushes.push({ pushed: ring[j], over: ring[i], toROff: rOff[ring[j]] });
        if (++guard > 64) throw new Error('derive-sky: de-confliction did not converge for "' + ring[j] + '"');
      }
    }
  }

  // ── assemble the CATALOG + per-resident report ──
  const CATALOG = {};
  let maxReach = 0;
  for (const id of allIds) {
    const res = residentStars(id, world, rOff[id]);
    for (const m of res.members) CATALOG[m.id] = { x: r01(m.x), y: r01(m.y), mag: m.mag };
    // outermost star radius from centre
    let outer = 0;
    for (const m of res.members) { const rr = Math.hypot(m.x - world.centre.x, m.y - world.centre.y); if (rr > outer) outer = rr; }
    if (outer > maxReach) maxReach = outer;
    report.groups[id] = {
      theta: thetaOf(id), lane: laneOf(id), hang: res.hang,
      rOffStart: r01(GROUPS[id] ? GROUPS[id].rOff : STARS[id].rOff),
      rOffFinal: r01(rOff[id]), pushDepth: r01(rOff[id] - (GROUPS[id] ? GROUPS[id].rOff : STARS[id].rOff)),
      n: res.members.length, outerR: r01(outer)
    };
  }
  report.maxReach = r01(maxReach);
  report.skyOuter = r01(world.Rsky + world.skyBand);
  report.headroom = r01((world.Rsky + world.skyBand) - maxReach);

  // ── VERIFY (throws on any violation) ──
  verify(CATALOG, sol, world, opts);
  return { CATALOG, GROUPS, HINTS, report };
}

/* ── verification: viewBox · footprints · manor pool · inter-figure clearance · lane fit ── */
function verify(CATALOG, sol, world, opts = {}) {
  const fails = [];
  const W = world.W, H = world.H;
  // group membership for the intra-figure exemption
  const groupOf = {};
  for (const sid in STARS) groupOf[sid] = STARS[sid].group; // null for field stars

  // (1) viewBox containment (STAR_PAD margin)
  for (const id in CATALOG) {
    const s = CATALOG[id];
    if (s.x - STAR_PAD < 0 || s.y - STAR_PAD < 0 || s.x + STAR_PAD > W || s.y + STAR_PAD > H)
      fails.push('viewBox: ' + id + ' (' + s.x + ',' + s.y + ') outside [0,0,' + W + ',' + H + ']');
  }

  // (2) footprint + manor-pool clearance (STAR_PAD). Ring stars clear by construction
  //     (radius >= Rsky = maxEdge + gap); this proves it and catches any lane intrusion.
  const boxes = [];
  for (const rid in sol.foot) {
    const f = sol.foot[rid];
    if (f.r != null) boxes.push({ id: rid, x: f.x - f.r, y: f.y - f.r, w: f.r * 2, h: f.r * 2 });
    else boxes.push({ id: rid, x: f.x, y: f.y, w: f.w, h: f.h });
  }
  // the manor pool / candle box: the manor structure hull (centre mass)
  const manorStruct = (sol.structures || []).find((x) => x.district === 'manor' && x.box);
  if (manorStruct) boxes.push({ id: 'manor-pool', x: manorStruct.box.x, y: manorStruct.box.y, w: manorStruct.box.w, h: manorStruct.box.h });
  const hitBox = (s, b) => (s.x + STAR_PAD > b.x && s.x - STAR_PAD < b.x + b.w && s.y + STAR_PAD > b.y && s.y - STAR_PAD < b.y + b.h);
  for (const id in CATALOG) {
    for (const b of boxes) if (hitBox(CATALOG[id], b)) fails.push('footprint: ' + id + ' over ' + b.id);
  }

  // (3) inter-figure star clearance (2*STAR_PAD both axes); intra-figure EXEMPT (§3.1)
  const ids = Object.keys(CATALOG);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const ga = groupOf[a], gb = groupOf[b];
      if (ga !== null && ga === gb) continue; // same figure → exempt
      const ca = CATALOG[a], cb = CATALOG[b];
      if (Math.abs(ca.x - cb.x) < FIG_CLEAR && Math.abs(ca.y - cb.y) < FIG_CLEAR)
        fails.push('star-clear: ' + a + ' vs ' + b + ' (' + r01(Math.abs(ca.x - cb.x)) + ',' + r01(Math.abs(ca.y - cb.y)) + ')');
    }
  }

  // (4) lane figures must FIT their lane wedge (tangential extent < lane arc width - pad)
  const laneSpan = {}; Polar.CONST.LANES.forEach((L) => (laneSpan[L.id] = L.span));
  for (const gid in GROUPS) {
    const g = GROUPS[gid];
    if (!g.lane) continue;
    const members = ids.filter((sid) => STARS[sid] && STARS[sid].group === gid).map((sid) => CATALOG[sid]);
    // tangential unit at theta
    const t = g.theta * DEG, tx = Math.cos(t), ty = Math.sin(t);
    let tmin = Infinity, tmax = -Infinity, rmin = Infinity;
    for (const m of members) {
      const ox = m.x - world.centre.x, oy = m.y - world.centre.y;
      const tp = ox * tx + oy * ty; tmin = Math.min(tmin, tp); tmax = Math.max(tmax, tp);
      rmin = Math.min(rmin, Math.hypot(ox, oy));
    }
    const tangExt = tmax - tmin;
    const span = laneSpan[g.lane];
    const laneWidthDeg = span[1] - span[0];
    const laneArc = rmin * laneWidthDeg * DEG; // arc width at the figure's inner radius
    if (tangExt + FIG_CLEAR > laneArc)
      fails.push('lane-fit: ' + gid + ' figure tang.extent ' + r01(tangExt) + ' + pad > lane "' + g.lane + '" arc ' + r01(laneArc));
  }

  if (fails.length) throw new Error('derive-sky VERIFY FAILED (' + fails.length + '):\n  ' + fails.join('\n  '));
  return true;
}

/* ── slab I/O (sentinels in sky.js) ──────────────────────────────────────────── */
const SKY_JS = join(__dirname, 'sky.js');
const BEGIN = '/* CATALOG-POLAR BEGIN */';
const END = '/* CATALOG-POLAR END */';

function renderSlab(CATALOG, includeStarMeta) {
  // deterministic key order: emit in catalog-polar STARS declaration order
  const order = Object.keys(STARS);
  let out = '  ' + BEGIN + '\n';
  out += '  /* GENERATED by tools/sky/derive-sky.mjs --emit — DO NOT hand-edit.\n';
  out += '     Positions HANG on the derived polar ring (§3.1/§3.2); the source of truth is\n';
  out += '     catalog-polar.mjs + the live solve. Re-run derive-sky after any layout change;\n';
  out += '     derive-sky --check joins the estate gates (fails when this slab is stale). */\n';
  out += '  var CATALOG = {\n';
  for (const id of order) {
    const s = CATALOG[id];
    if (!s) continue;
    out += '    ' + JSON.stringify(id) + ': { x: ' + s.x + ', y: ' + s.y + ', mag: ' + s.mag + ' },\n';
  }
  out += '  };\n';
  // GROUPS + HINTS (browser-consumed by the W3.4 card layer; positions-only tools ignore them)
  out += '  var SKY_GROUPS = ' + JSON.stringify(GROUPS) + ';\n';
  out += '  var SKY_HINTS = ' + JSON.stringify(HINTS) + ';\n';
  if (includeStarMeta) out += '  /* STAR_META arms at W2.5 (manifest-fed) */\n';
  out += '  ' + END;
  return out;
}

function emit(includeStarMeta) {
  const { CATALOG, report } = derive();
  let src = readFileSync(SKY_JS, 'utf8');
  const bi = src.indexOf(BEGIN), ei = src.indexOf(END);
  if (bi < 0 || ei < 0) throw new Error('derive-sky --emit: sentinels ' + BEGIN + ' … ' + END +
    ' not found in sky.js. Add them around the CATALOG var (Stage-2 wiring) before emitting.');
  // replace from the start of the BEGIN line to the end of the END token
  const lineStart = src.lastIndexOf('\n', bi) + 1;
  const after = ei + END.length;
  src = src.slice(0, lineStart) + renderSlab(CATALOG, includeStarMeta) + src.slice(after);
  writeFileSync(SKY_JS, src);
  return report;
}

function check(includeStarMeta) {
  const { CATALOG } = derive();
  const src = readFileSync(SKY_JS, 'utf8');
  const bi = src.indexOf(BEGIN), ei = src.indexOf(END);
  if (bi < 0 || ei < 0) { console.error('derive-sky --check: sentinels not found in sky.js (nothing emitted yet).'); return false; }
  const lineStart = src.lastIndexOf('\n', bi) + 1;
  const current = src.slice(lineStart, ei + END.length);
  const want = renderSlab(CATALOG, includeStarMeta);
  return current === want;
}

/* ── the SIZING / pre-flight report ── */
function preflight() {
  const { report } = derive();
  const L = [];
  L.push('derive-sky PRE-FLIGHT (§3.1/§3.2 SIZING) — ALL CHECKS PASS');
  L.push('  world ' + report.viewBox + '  centre ' + report.centre.x + ',' + report.centre.y +
    '  R_sky ' + report.Rsky + '  SKY_BAND ' + report.skyBand + '  sky-outer ' + report.skyOuter);
  L.push('  ring outermost reach ' + report.maxReach + '  →  headroom to sky-outer ' + report.headroom + 'px');
  const pushed = Object.keys(report.groups).filter((id) => report.groups[id].pushDepth > 0);
  L.push('  de-confliction pushes: ' + report.pushes.length + ' step(s) across ' + pushed.length + ' resident(s)');
  L.push('  HANG (deg) — non-zero + lanes:');
  for (const id of Object.keys(report.groups).sort()) {
    const g = report.groups[id];
    if (g.hang !== 0 || g.lane || g.pushDepth > 0)
      L.push('    ' + id.padEnd(16) + ' θ=' + String(g.theta).padStart(3) + '  lane=' + String(g.lane) +
        '  hang=' + g.hang + '  rOff ' + g.rOffStart + '→' + g.rOffFinal + (g.pushDepth ? ' (pushed ' + g.pushDepth + ')' : '') +
        '  outerR=' + g.outerR);
  }
  return L.join('\n');
}

/* ── CLI ── */
const arg = process.argv[2] || '--preflight';
try {
  if (arg === '--emit') {
    const rep = emit(process.argv.includes('--star-meta'));
    console.log('derive-sky: slab emitted into sky.js (reach ' + rep.maxReach + ', headroom ' + rep.headroom + 'px).');
  } else if (arg === '--check') {
    const ok = check(process.argv.includes('--star-meta'));
    if (ok) { console.log('derive-sky --check: sky.js slab is current.'); process.exit(0); }
    else { console.error('derive-sky --check: sky.js slab is STALE — re-run `node tools/sky/derive-sky.mjs --emit`.'); process.exit(1); }
  } else {
    console.log(preflight());
  }
} catch (e) {
  console.error(String(e && e.message ? e.message : e));
  process.exit(1);
}

export { derive, verify, preflight };
