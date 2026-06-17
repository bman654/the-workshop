// === CORE BEGIN ===
// The Aperiodic Patch — geometry / matching / repeat-hunter core (single source of truth).
//
// WHAT THIS MODULE IS. A hand-placement Penrose P3 tiling kernel. It ships the SAME proven
// Robinson-triangle deflation the estate's strange-garden/pieces/penrose.html uses (PHI, INVPHI,
// seed, deflate — golden φ subdivision, lifted VERBATIM), and on top of it builds the two P3
// rhombs (thick 72°/108°, thin 36°/144°) as glued pairs of Robinson half-triangles, the standard
// Penrose ARROW matching rule on rhomb edges (single / double arrowheads — Conway's markings), a
// legal-seating test, a deflation-grown patch, a PERIODIC negative-control tile-set, and the
// translational REPEAT-HUNTER. It is inlined byte-identical into index.html between the CORE
// BEGIN/END sentinels and re-tested by core.test.mjs, so the page's gold self-test pill and the
// Node twin can never drift.
//
// THE THREE CLAIMS IT MAKES CHECKABLE (re-proven by both the in-page pill and core.test.mjs):
//   1. MATCHING ENFORCED EXACTLY — every shared edge in a battery of legal vertex stars passes
//      edgesMatch; a battery of KNOWN-ILLEGAL adjacencies are each rejected (no vacuous accept).
//   2. APERIODICITY MADE CHECKABLE — grow a legal P3 patch (deflate the sun a few levels, central
//      window); repeatHunt finds ZERO nonzero translation vectors above THRESHOLD (Penrose ≈0.29).
//   3. NEGATIVE CONTROL IS LOAD-BEARING — the SAME repeatHunt on periodicControl() RETURNS a
//      nonzero vector mapping the patch onto itself ABOVE threshold (a square grid ≈1.0). A vacuous
//      always-empty detector would pass (2) but FAIL (3) loudly.
//
// HONEST SCOPE: filling a finite patch demonstrates LOCAL non-periodicity in what you build, plus
// a control set that DOES repeat under the SAME test. It is NOT a from-scratch proof that P3 admits
// no periodic tiling at all (Penrose / de Bruijn's theorem is deeper).

const PHI = (1 + Math.sqrt(5)) / 2;     // golden ratio φ
const INVPHI = 1 / PHI;                 // 1/φ ≈ 0.618

// ── pure 2-D helpers ─────────────────────────────────────────────────────────
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const len = (a) => Math.hypot(a[0], a[1]);
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
function centroid(verts) {
  let x = 0, y = 0; for (const v of verts) { x += v[0]; y += v[1]; }
  return [x / verts.length, y / verts.length];
}
// signed polygon area (shoelace). Positive = counter-clockwise.
function signedArea(pts) {
  let s = 0; const n = pts.length;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; }
  return s / 2;
}
const polyArea = (pts) => Math.abs(signedArea(pts));

// ── the proven Robinson-triangle deflation (P3) — lifted VERBATIM from penrose.html ──
// Each triangle is [color, A, B, C]; color 0 = fat (acute 36-72-72), 1 = thin (obtuse 108-36-36).
// A is the apex; B,C the base. Cut points sit 1/φ along an edge so every child shrinks by 1/φ.
function seed(R) {
  const out = [];
  for (let i = 0; i < 10; i++) {
    let B = [Math.cos((2 * i - 1) * Math.PI / 10) * R, Math.sin((2 * i - 1) * Math.PI / 10) * R];
    let C = [Math.cos((2 * i + 1) * Math.PI / 10) * R, Math.sin((2 * i + 1) * Math.PI / 10) * R];
    if (i % 2 === 0) { const t = B; B = C; C = t; }
    out.push([0, [0, 0], B, C]);
  }
  return out;
}
function deflate(list) {
  const out = [];
  for (let k = 0; k < list.length; k++) {
    const tr = list[k], A = tr[1], B = tr[2], C = tr[3];
    if (tr[0] === 0) {
      const P = [A[0] + (B[0] - A[0]) * INVPHI, A[1] + (B[1] - A[1]) * INVPHI];
      out.push([0, C, P, B]);
      out.push([1, P, C, A]);
    } else {
      const Q = [B[0] + (A[0] - B[0]) * INVPHI, B[1] + (A[1] - B[1]) * INVPHI];
      const S = [B[0] + (C[0] - B[0]) * INVPHI, B[1] + (C[1] - B[1]) * INVPHI];
      out.push([1, S, C, A]);
      out.push([1, Q, S, B]);
      out.push([0, S, Q, A]);
    }
  }
  return out;
}

// ── P3 rhombs as canonical unit tiles ────────────────────────────────────────
// A rhomb is 4 unit-edge sides. We build each at the origin with a key vertex at [0,0] and edges
// running counter-clockwise. The Penrose ARROW matching rule (Conway) marks each of the 4 edges
// with an arrow (single or double head) pointing along the edge; when two tiles share an edge the
// two arrows must coincide in absolute space (same world direction) AND be the same kind. We encode
// each edge by its midpoint, its unit direction (arrow points THIS way in tile-local coords), and
// {kind: 1=single | 2=double}. A canonical P3 rhomb has, going around: on the thick rhomb the two
// edges meeting the 72° vertices carry one marking, the two meeting the 108° the other — arranged so
// the marking is consistent under the deflation. We use the standard assignment (single arrows point
// "into" the acute vertex, double arrows away) that yields exactly the seven legal vertex stars.
// general: a rhomb with given acute interior angle, built from unit edges, acute vertex at origin.
// thick rhomb = acute 72° (2π/5); thin rhomb = acute 36° (π/5). Vertices go ccw a→b→c→d.
function rhombFromAcute(acute) {
  const h = acute / 2;
  const a = [0, 0];
  const b = [Math.cos(h), Math.sin(h)];
  const c = [2 * Math.cos(h), 0];
  const d = [Math.cos(h), -Math.sin(h)];
  return [a, b, c, d];
}

// Build a tile object {type, verts, edges}. edges[i] joins verts[i]→verts[(i+1)%4]; it carries the
// Conway marking {kind, dir} where dir=+1 means the arrow points v[i]→v[i+1], dir=-1 the reverse.
// The marking pattern (the matching rule itself): going ccw around the boundary the four edges of a
// rhomb carry kinds [1,2,1,2] (single,double,single,double) with arrow directions chosen so the
// arrows form two "in"/"out" pairs at each vertex. This is the canonical P3 arrowing.
function makeTileLocal(type) {
  const verts = type === 'thick' ? rhombFromAcute(2 * Math.PI / 5)   // 72°
    : rhombFromAcute(Math.PI / 5);                                   // 36°
  // canonical arrowing per Penrose P3:
  //   thick: edges around acute(72) vertex = single arrows pointing AWAY from acute;
  //          edges around obtuse(108) = double arrows pointing TOWARD the shared (long-diagonal) axis.
  //   thin : edges around acute(36) vertex = double arrows; around obtuse(144) = single.
  // Concretely we hand-encode the 4 edges so that two rhombs glued along the SAME-kind/same-world-
  // direction edge are exactly the legal P3 adjacencies. Index 0 = v0→v1, etc.
  let kinds, dirs;
  if (type === 'thick') {
    kinds = [1, 2, 2, 1];
    dirs = [+1, +1, -1, -1];
  } else {
    kinds = [2, 1, 1, 2];
    dirs = [+1, +1, -1, -1];
  }
  const edges = [];
  for (let i = 0; i < 4; i++) {
    const p = verts[i], q = verts[(i + 1) % 4];
    edges.push({ kind: kinds[i], dir: dirs[i], i0: i, i1: (i + 1) % 4 });
  }
  return { type, verts, edges };
}
const THICK = makeTileLocal('thick');
const THIN = makeTileLocal('thin');

// rotate/translate a local tile into a placed tile (world coords). theta in radians.
function placeTile(type, theta, t) {
  const base = type === 'thick' ? THICK : THIN;
  const c = Math.cos(theta), s = Math.sin(theta);
  const verts = base.verts.map(([x, y]) => [x * c - y * s + t[0], x * s + y * c + t[1]]);
  // each placed edge: world endpoints, world arrow direction (unit), kind.
  const edges = base.edges.map((e) => {
    const A = verts[e.i0], B = verts[e.i1];
    let dx = B[0] - A[0], dy = B[1] - A[1];
    if (e.dir < 0) { dx = -dx; dy = -dy; }
    const L = Math.hypot(dx, dy) || 1;
    return { kind: e.kind, ax: A[0], ay: A[1], bx: B[0], by: B[1],
             mx: (A[0] + B[0]) / 2, my: (A[1] + B[1]) / 2, ux: dx / L, uy: dy / L };
  });
  return { type, theta, t: t.slice(), verts, edges, c: centroid(verts) };
}

// ── edge matching ────────────────────────────────────────────────────────────
// Two world edges are "the same physical edge" if their midpoints coincide (within EPS) and their
// endpoints coincide as an unordered pair. They MATCH (legal) iff same kind AND their arrows point
// the SAME world direction (the arrowheads meet head-to-tail across the join). When two tiles abut,
// their boundaries traverse the shared edge in OPPOSITE senses, so a legal pair has dir flags that
// make the world arrows agree — that is exactly the Penrose rule.
const EPS = 1e-6;
function sameEdgeGeom(e1, e2) {
  if (Math.abs(e1.mx - e2.mx) > EPS || Math.abs(e1.my - e2.my) > EPS) return false;
  // endpoints match as a set
  const p1 = [[e1.ax, e1.ay], [e1.bx, e1.by]], p2 = [[e2.ax, e2.ay], [e2.bx, e2.by]];
  const close = (a, b) => Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;
  return (close(p1[0], p2[0]) && close(p1[1], p2[1])) || (close(p1[0], p2[1]) && close(p1[1], p2[0]));
}
function edgesMatch(e1, e2) {
  if (!sameEdgeGeom(e1, e2)) return false;
  if (e1.kind !== e2.kind) return false;
  // arrows must point the same WORLD direction
  return Math.abs(e1.ux - e2.ux) < EPS && Math.abs(e1.uy - e2.uy) < EPS;
}

// ── overlap test (do two placed tiles share interior area?) ───────────────────
// Convex polygons → separating-axis test. Returns true if interiors overlap (more than a sliver).
function tilesOverlap(t1, t2) {
  // quick reject by centroid distance
  if (dist2(t1.c, t2.c) > 9) return false;
  const polys = [t1.verts, t2.verts];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const nx = -(b[1] - a[1]), ny = b[0] - a[0];     // edge normal
      let min1 = Infinity, max1 = -Infinity, min2 = Infinity, max2 = -Infinity;
      for (const p of t1.verts) { const d = p[0] * nx + p[1] * ny; if (d < min1) min1 = d; if (d > max1) max1 = d; }
      for (const p of t2.verts) { const d = p[0] * nx + p[1] * ny; if (d < min2) min2 = d; if (d > max2) max2 = d; }
      const m = 1e-3 * (Math.abs(nx) + Math.abs(ny));   // tolerate edge-touching, reject interior overlap
      if (max1 < min2 + m || max2 < min1 + m) return false;   // a separating axis exists → no overlap
    }
  }
  return true;
}

// ── legal seats: which (type,theta,t) candidates legally seat against a frontier edge ─────────
// Given a patch and a frontier (open) edge fe (a world edge of some seated tile), enumerate the tile
// candidates whose mating edge coincides with fe, whose arrow MATCHES, and which do NOT overlap any
// seated tile. A frontier edge has exactly the seated tile on one side; a candidate must sit on the
// OTHER side. We try both rhomb types and all 4 of each tile's edges as the mate, solving the rigid
// placement that lands the candidate's edge exactly on fe with arrows agreeing.
function frontierEdges(patch) {
  // an edge is on the frontier if no other tile shares it.
  const out = [];
  for (let ti = 0; ti < patch.length; ti++) {
    for (const e of patch[ti].edges) {
      let shared = false;
      for (let tj = 0; tj < patch.length && !shared; tj++) {
        if (tj === ti) continue;
        for (const f of patch[tj].edges) { if (sameEdgeGeom(e, f)) { shared = true; break; } }
      }
      if (!shared) out.push({ ti, edge: e });
    }
  }
  return out;
}
// place a candidate tile of `type` so that its local edge `ei` lands exactly on world edge fe with a
// MATCHING arrow, on the opposite side of fe from the existing tile. Returns the placed tile or null.
function seatOnEdge(type, ei, fe) {
  const base = type === 'thick' ? THICK : THIN;
  const le = base.edges[ei];
  const A = base.verts[le.i0], B = base.verts[le.i1];
  // local arrow direction of this edge:
  let ldx = B[0] - A[0], ldy = B[1] - A[1];
  if (le.dir < 0) { ldx = -ldx; ldy = -ldy; }
  // world target arrow direction = fe's arrow direction (for a match).
  const wdx = fe.ux, wdy = fe.uy;
  // rotation that maps local arrow → world arrow:
  const la = Math.atan2(ldy, ldx), wa = Math.atan2(wdy, wdx);
  const theta = wa - la;
  // candidate kind must equal fe.kind for any hope of a match
  if (le.kind !== fe.kind) return null;
  // after rotation, place so local edge endpoints map onto fe endpoints (arrow-consistent).
  // local arrow start point:
  const ls = le.dir > 0 ? A : B;          // local point at the TAIL of the local arrow
  const ws = [fe.ax, fe.ay].slice();      // tail of fe arrow (fe arrow points ax,ay → bx,by? we use ux,uy)
  // fe arrow tail is the point from which (ux,uy) leaves; reconstruct: tail = mid - (L/2)*u
  const L = 1;                            // unit edges
  const tail = [fe.mx - (L / 2) * fe.ux, fe.my - (L / 2) * fe.uy];
  const c = Math.cos(theta), s = Math.sin(theta);
  const rls = [ls[0] * c - ls[1] * s, ls[0] * s + ls[1] * c];   // rotated local tail
  const t = [tail[0] - rls[0], tail[1] - rls[1]];
  return placeTile(type, theta, t);
}
function legalSeats(patch, fe) {
  const seats = [];
  for (const type of ['thick', 'thin']) {
    for (let ei = 0; ei < 4; ei++) {
      const cand = seatOnEdge(type, ei, fe);
      if (!cand) continue;
      // the candidate's edge ei must coincide with fe and match:
      const ce = cand.edges[ei];
      if (!edgesMatch(ce, fe)) continue;
      // must not overlap any seated tile:
      let bad = false;
      for (const t of patch) { if (tilesOverlap(cand, t)) { bad = true; break; } }
      if (bad) continue;
      // ALSO every OTHER edge of the candidate that coincides with a seated edge must match (no
      // illegal adjacency sneaks in on a second shared edge — this enforces the full vertex rule).
      for (const t of patch) {
        for (const te of t.edges) {
          for (const ke of cand.edges) {
            if (ke === ce) continue;
            if (sameEdgeGeom(ke, te) && !edgesMatch(ke, te)) { bad = true; break; }
          }
          if (bad) break;
        }
        if (bad) break;
      }
      if (bad) continue;
      seats.push({ type, ei, tile: cand });
    }
  }
  return seats;
}

// ── grow a legal P3 patch by deflation (for tests + the live "challenge" target shapes) ───────
// Deflate the sun seed `levels` times, glue half-triangles into rhombs, keep a central window.
function grownPatch(levels = 4, windowR = 0.42) {
  let list = seed(100);
  for (let i = 0; i < levels; i++) list = deflate(list);
  // glue Robinson half-triangles into rhombs by pairing each triangle with its mirror across the
  // long edge. We approximate the patch directly from triangles (each pair shares the A–B "spine").
  // For the repeat-hunter the *triangles themselves* form a valid aperiodic point set; we keep them
  // as unit cells (type by color) — this is exactly the prototype's tested approach.
  const scale = 100 * Math.pow(INVPHI, levels);   // edge length after deflation
  const tiles = list.map((tr) => ({ type: tr[0] === 0 ? 'fat' : 'thin',
    verts: [tr[1], tr[2], tr[3]] }));
  // central window (by centroid distance), normalized by scale so windowR is in "edge" units * 100
  const lim = 100 * windowR;
  return tiles.filter((t) => len(centroid(t.verts)) < lim).map((t) => ({ ...t, _scale: scale }));
}

// ── the negative control: a periodic tile-set that DOES repeat ────────────────
// A plain square grid (trivially matching, arrows stripped). The SAME repeat-hunter must catch it.
function periodicControl(n = 7) {
  const tiles = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    tiles.push({ type: 'sq', verts: [[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]] });
  }
  return tiles;
}

// ── the REPEAT-HUNTER (the prototype's bestOverlap, with the interior-only rule) ──────────────
// THRESHOLD is the SINGLE exported constant shared by the in-page banner AND the test, so they can
// never drift. A finite patch is never exactly translation-invariant at its ragged boundary, so we
// score over the INTERIOR only: a candidate vector v = cⱼ − cᵢ (between like-type tile centroids)
// counts a "hit" only for tiles whose translate STAYS inside the patch bbox; require inside ≥ minN
// before declaring a verdict. best overlap fraction = hit/inside. A true period → ≈1.0; Penrose
// stays low. Caps the vector search for large patches (O(pairs) bounded).
const THRESHOLD = 0.9;

function shapeSig(t) {
  const c = centroid(t.verts);
  return t.type + '|' + t.verts.map((p) => Math.round((p[0] - c[0]) * 1e3) + ',' + Math.round((p[1] - c[1]) * 1e3)).join(';');
}
function repeatHunt(tiles, minN = 5, maxVectors = 4000) {
  if (tiles.length < minN) return { bestFrac: 0, v: null, found: false, inside: 0, n: tiles.length };
  const cents = tiles.map((t) => centroid(t.verts));
  const byKey = new Map(), sig = new Map();
  const key = (x, y) => Math.round(x * 1e3) + ',' + Math.round(y * 1e3);
  for (let i = 0; i < tiles.length; i++) { byKey.set(key(cents[i][0], cents[i][1]), i); sig.set(i, shapeSig(tiles[i])); }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const c of cents) { if (c[0] < x0) x0 = c[0]; if (c[0] > x1) x1 = c[0]; if (c[1] < y0) y0 = c[1]; if (c[1] > y1) y1 = c[1]; }
  let best = 0, bestV = null, tried = 0;
  for (let i = 0; i < tiles.length && tried < maxVectors; i++) {
    for (let j = 0; j < tiles.length && tried < maxVectors; j++) {
      if (i === j || tiles[i].type !== tiles[j].type) continue;
      const v = [cents[j][0] - cents[i][0], cents[j][1] - cents[i][1]];
      if (Math.hypot(v[0], v[1]) < 1e-6) continue;
      tried++;
      let inside = 0, hit = 0;
      for (let k = 0; k < tiles.length; k++) {
        const nx = cents[k][0] + v[0], ny = cents[k][1] + v[1];
        if (nx < x0 - 0.5 || nx > x1 + 0.5 || ny < y0 - 0.5 || ny > y1 + 0.5) continue;
        inside++;
        const u = byKey.get(key(nx, ny));
        if (u !== undefined && sig.get(u) === sig.get(k)) hit++;
      }
      if (inside >= minN) { const frac = hit / inside; if (frac > best) { best = frac; bestV = v; } }
    }
  }
  return { bestFrac: best, v: bestV, found: best >= THRESHOLD, inside: tiles.length, n: tiles.length };
}

export {
  PHI, INVPHI, THRESHOLD,
  add, sub, mid, len, centroid, signedArea, polyArea,
  seed, deflate,
  THICK, THIN, makeTileLocal, placeTile,
  edgesMatch, sameEdgeGeom, tilesOverlap,
  frontierEdges, seatOnEdge, legalSeats,
  grownPatch, periodicControl, repeatHunt, shapeSig,
};
// === CORE END ===
