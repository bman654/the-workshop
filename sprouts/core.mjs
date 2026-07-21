/* ═══════════════════════════════════════════════════════════════════════════
   sprouts/core.mjs — THE TOPOLOGICAL SPROUTS ENGINE.

   The DOM-free, PIXEL-FREE brain of "Sprouts". It carries no geometry at all:
   legality, terminality, the live-end tally and the winner are decided here on a
   planar map (spots · darts · faces) with exact integer arithmetic.

   ── WHY PIXEL-FREE IS THE LOAD-BEARING DECISION ────────────────────────────────
   The room's ONE CLAIM is that every game lasts between 2n and 3n−1 moves. The
   UPPER bound survives anything (lives fall by exactly one per move). The LOWER
   bound does NOT: it depends on the game ending only at a genuinely terminal
   position. A pixel referee that cannot see a corridor thinner than its nib would
   declare a FALSE terminal, end the game early, and produce a sub-2n game — the
   page would show a bracket the twin could eventually escape. So the referee is
   topological and exact; the ink is an EMBEDDING of it, never the definition of it.
   The grid flood in geom.mjs is a ROUTER, never a referee.

   The thesis, literally true of this code: THE PEN'S RULE (don't touch ink)
   IMPLIES THE GAME'S RULE (stay in one face). A non-crossing stroke cannot leave
   the face it started in — so the pen and the theorem are the same rule.

   ── THE REPRESENTATION ────────────────────────────────────────────────────────
   A combinatorial map. Each SPOT owns a cyclic rotation of DARTS (half-edges) in
   increasing-angle order. A FACE (region) is a set of boundary CYCLES; a cycle is
   a cyclic list of darts — dart d's occurrence carries the corner between the
   previous dart at its spot and d itself. An isolated spot (degree 0) has no darts,
   so it is a cycle of its own tagged `iso`.

   A move joins two corners of one face. The two corners are named by their darts
   (or by an isolated spot). Joining them either MERGES two boundary cycles of the
   face (face count unchanged) or — when both corners lie on the SAME cycle —
   SPLITS the face in two, and then the face's OTHER boundary components must be
   dealt to one side. On paper the ink decides that; here it is an EXPLICIT
   partition passed in by the caller. See commitMove() for the full seam.

   The body BETWEEN the two sentinel lines is inlined BYTE-IDENTICALLY into
   index.html by the forge (byte-parity asserted by core.test.mjs leg E). DO NOT
   edit one copy alone.
   ═══════════════════════════════════════════════════════════════════════════ */

// ===== THE SPROUTS CORE (byte-identical to core.mjs) =====

/* ── a tiny seeded PRNG (mulberry32): every game the house or the twin plays is
   reproducible from one integer, so a failing seed can be replayed exactly. ── */
function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const norm = (a) => { let x = a % TAU; if (x < 0) x += TAU; return x; };
/* CCW arc length from a to b, in [0, TAU). */
const arcCCW = (a, b) => norm(b - a);

/* ── STATE ────────────────────────────────────────────────────────────────────
   spots  : { id, deg, born, ang:[..] }          lives = 3 − deg
   darts  : { id, spot, edge, twin, ang, poly }  poly is RENDER data (may be null)
   edges  : { id, d0, d1, curveId }
   faces  : { id, cycles:[ {iso, d:[dartId..]} ] }
   curves : { id, a, b, mid, poly, by }          RENDER data only
   ------------------------------------------------------------------------- */

function newState(n, seed) {
  const st = {
    n,
    seed: seed >>> 0,
    spots: [],
    darts: [],
    edges: [],
    faces: [],
    curves: [],
    movesMade: 0,
    winner: null,
    label: (i) => String.fromCharCode(65 + i),
  };
  const cycles = [];
  for (let i = 0; i < n; i++) {
    st.spots.push({ id: i, deg: 0, born: 0, darts: [], name: String.fromCharCode(65 + (i % 26)) });
    cycles.push({ iso: i, d: [] });
  }
  st.faces.push({ id: 0, cycles });
  return st;
}

const lives = (st, sid) => 3 - st.spots[sid].deg;
function liveEnds(st) { let s = 0; for (const sp of st.spots) s += 3 - sp.deg; return s; }

/* ── OCCURRENCES ──────────────────────────────────────────────────────────────
   Every corner of the map is exactly one occurrence: an isolated spot's single
   360° corner, or a dart (the corner spanning CCW from the previous dart at that
   spot up to this dart). This is the alphabet moves are written in. ---------- */
function occurrencesOf(st, face) {
  const out = [];
  for (let ci = 0; ci < face.cycles.length; ci++) {
    const cy = face.cycles[ci];
    if (cy.iso != null) { out.push({ spot: cy.iso, dart: null, ci, di: 0 }); continue; }
    for (let di = 0; di < cy.d.length; di++) out.push({ spot: st.darts[cy.d[di]].spot, dart: cy.d[di], ci, di });
  }
  return out;
}

/* Which occurrence does a curve leaving spot `sid` at angle `ang` depart from?
   Degree 0 or 1 ⇒ the single corner. Otherwise the corner containing `ang` is the
   one belonging to the dart that comes NEXT counter-clockwise from `ang`. */
function occurrenceAt(st, sid, ang) {
  const sp = st.spots[sid];
  if (sp.darts.length === 0) return { spot: sid, dart: null };
  let best = null, bestArc = Infinity;
  for (const d of sp.darts) {
    const a = arcCCW(ang, st.darts[d].ang);
    if (a < bestArc) { bestArc = a; best = d; }
  }
  return { spot: sid, dart: best };
}

function findOcc(st, faceOccs, o) {
  for (const q of faceOccs) if (q.spot === o.spot && q.dart === o.dart) return q;
  return null;
}
function faceOfOcc(st, o) {
  for (const f of st.faces) {
    for (let ci = 0; ci < f.cycles.length; ci++) {
      const cy = f.cycles[ci];
      if (cy.iso != null) { if (o.dart === null && cy.iso === o.spot) return { face: f, ci, di: 0 }; continue; }
      if (o.dart === null) continue;
      const di = cy.d.indexOf(o.dart);
      if (di >= 0) return { face: f, ci, di };
    }
  }
  return null;
}

/* The middle of a corner, in render angles. A corner belongs to the dart that
   closes it: it spans CCW from the previous dart at that spot up to this one.
   (Used by the router to leave in the right corner, by the keyboard path, and by
   the board-cannot-drift probe.) */
function cornerAngle(st, spot, dart) {
  const r = st.spots[spot].darts;
  if (r.length === 0) return 0;
  const k = r.indexOf(dart);
  if (k < 0) return 0;
  const prev = r[(k - 1 + r.length) % r.length];
  const a0 = st.darts[prev].ang;
  const span = r.length === 1 ? TAU : arcCCW(a0, st.darts[dart].ang);
  return norm(a0 + span / 2);
}
/* A corner's angular EXTENT: the CCW sweep from the previous dart's angle, of
   width `span`. Near the spot every attached curve converges, so distance alone
   cannot police them; staying inside this sector is what "did not cross a curve
   at the spot" actually means. A spot of degree 0 or 1 has one 360° corner, so
   the constraint is vacuous there — as it should be. */
function cornerSpan(st, spot, dart) {
  const r = st.spots[spot].darts;
  if (r.length === 0 || dart == null) return { a0: 0, span: TAU };
  const k = r.indexOf(dart);
  if (k < 0) return { a0: 0, span: TAU };
  const prev = r[(k - 1 + r.length) % r.length];
  const a0 = st.darts[prev].ang;
  return { a0, span: r.length === 1 ? TAU : arcCCW(a0, st.darts[dart].ang) };
}

/* Every corner that still has a life, with the face it sits on. */
function liveCorners(st) {
  const out = [];
  for (const f of st.faces) {
    for (const o of occurrencesOf(st, f)) {
      if (lives(st, o.spot) < 1) continue;
      out.push({ spot: o.spot, dart: o.dart, face: f.id,
                 ang: o.dart == null ? 0 : cornerAngle(st, o.spot, o.dart) });
    }
  }
  return out;
}

/* ── LEGAL MOVES — exact, no grid, no hedge ────────────────────────────────── */
function legalMoves(st) {
  const out = [];
  for (const f of st.faces) {
    const occ = occurrencesOf(st, f);
    for (let i = 0; i < occ.length; i++) {
      const A = occ[i];
      if (lives(st, A.spot) < 1) continue;
      for (let j = i; j < occ.length; j++) {
        const B = occ[j];
        if (lives(st, B.spot) < 1) continue;
        if (A.spot === B.spot && lives(st, A.spot) < 2) continue;
        // i === j is the self-loop drawn back into the SAME corner; it needs two
        // free lives on that spot and no other special case at all.
        out.push({ a: { spot: A.spot, dart: A.dart }, b: { spot: B.spot, dart: B.dart },
                   face: f.id, ci: A.ci, cj: B.ci, split: A.ci === B.ci, loop: A.spot === B.spot });
      }
    }
  }
  return out;
}

function terminal(st) { return legalMoves(st).length === 0; }

/* ── THE INDEPENDENT READING ───────────────────────────────────────────────────
   `traceFaces` rebuilds every boundary cycle FROM THE ROTATION SYSTEM ALONE, by
   the face permutation φ(d) = successor-in-rotation( twin(d) ). It shares no code
   and no cached ids with the merge/split bookkeeping in commitMove — so comparing
   the two is a real cross-check of the subtlest code in this build.

   (A rotation system fixes the boundary CYCLES but not which cycles share a face
   when the drawing is disconnected — that is exactly the information the explicit
   partition carries. So the grouping still comes from st.faces; the cycles do not.) */
function traceFaces(st) {
  const seen = new Uint8Array(st.darts.length);
  const cycles = [];
  const succAt = (sid, d) => { const r = st.spots[sid].darts; const k = r.indexOf(d); return r[(k + 1) % r.length]; };
  for (let d0 = 0; d0 < st.darts.length; d0++) {
    if (seen[d0]) continue;
    const cyc = []; let d = d0, guard = 0;
    do {
      if (++guard > st.darts.length + 4) throw new Error('sprouts: face trace did not close');
      seen[d] = 1; cyc.push(d);
      const t = st.darts[d].twin;
      d = succAt(st.darts[t].spot, t);
    } while (d !== d0);
    cycles.push(cyc);
  }
  return cycles;
}
/* Two cyclic dart sequences are equal up to rotation. */
function sameCycle(a, b) {
  if (a.length !== b.length) return false;
  const k = b.indexOf(a[0]); if (k < 0) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[(k + i) % b.length]) return false;
  return true;
}
/* Does the bookkeeping in st.faces agree, cycle for cycle, with the rotation
   system's own face trace? Returns the number of disagreements (0 = consistent). */
function mapConsistency(st) {
  const traced = traceFaces(st);
  const held = [];
  for (const f of st.faces) for (const cy of f.cycles) if (cy.iso == null) held.push(cy.d);
  if (traced.length !== held.length) return { bad: Math.abs(traced.length - held.length), traced: traced.length, held: held.length };
  let bad = 0;
  const used = new Uint8Array(held.length);
  for (const t of traced) {
    let hit = -1;
    for (let i = 0; i < held.length; i++) if (!used[i] && sameCycle(t, held[i])) { hit = i; break; }
    if (hit < 0) bad++; else used[hit] = 1;
  }
  return { bad, traced: traced.length, held: held.length };
}
/* An INDEPENDENT reading of terminality, built on the freshly-traced cycles: a
   face can be played on iff two of its corners carry lives (or one corner's spot
   carries two). No cached region ids, no reuse of legalMoves. */
function terminalIndependent(st) {
  const traced = traceFaces(st);
  const cycOf = new Map();          // dart → traced cycle index
  traced.forEach((cy, i) => { for (const d of cy) cycOf.set(d, i); });
  for (const f of st.faces) {
    const corners = [];
    for (const cy of f.cycles) {
      if (cy.iso != null) { corners.push({ spot: cy.iso, iso: true }); continue; }
      const ti = cycOf.get(cy.d[0]);
      if (ti == null) return false;   // structure is broken; do not claim terminal
      for (const d of traced[ti]) corners.push({ spot: st.darts[d].spot, iso: false });
    }
    const live = corners.filter((c) => 3 - st.spots[c.spot].deg >= 1);
    if (live.length >= 2) {
      // two DIFFERENT corners: legal unless they are the same spot with one life
      for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
        if (live[i].spot !== live[j].spot) return false;
        if (3 - st.spots[live[i].spot].deg >= 2) return false;
      }
    }
    // a single corner whose spot still has two lives can always loop into itself
    for (const c of live) if (3 - st.spots[c.spot].deg >= 2) return false;
  }
  return true;
}

/* ── DART / SPOT PLUMBING ─────────────────────────────────────────────────── */
function addDart(st, sid, edge, ang) {
  const d = { id: st.darts.length, spot: sid, edge, twin: -1, ang: norm(ang), poly: null };
  st.darts.push(d);
  return d.id;
}
/* Insert dart `dn` into spot `sid`'s rotation immediately BEFORE dart `before`
   (i.e. into `before`'s corner). `before === null` ⇒ the spot was isolated. */
function insertDart(st, sid, dn, before) {
  const sp = st.spots[sid];
  if (before == null || sp.darts.length === 0) { sp.darts.push(dn); return; }
  const k = sp.darts.indexOf(before);
  sp.darts.splice(k < 0 ? sp.darts.length : k, 0, dn);
}
/* The angle a new curve should leave `sid` at, when the caller has no ink to
   speak for it (the twin, the keyboard path): the middle of the chosen corner,
   snapped to keep ≥ MIN_SEP from every used angle so curves never share an
   endpoint. Purely a RENDER convenience — no rule depends on it. */
const MIN_SEP = (55 * Math.PI) / 180;
function synthAngle(st, sid, before) {
  const sp = st.spots[sid];
  if (sp.darts.length === 0) return 0;
  const prev = sp.darts[(sp.darts.indexOf(before) - 1 + sp.darts.length) % sp.darts.length];
  const a0 = st.darts[prev].ang, a1 = st.darts[before].ang;
  const span = sp.darts.length === 1 ? TAU : arcCCW(a0, a1);
  return norm(a0 + span / 2);
}
function snapAngle(st, sid, want, before) {
  const sp = st.spots[sid];
  if (sp.darts.length === 0) return norm(want);
  // stay inside the chosen corner, but back off MIN_SEP from its two walls
  const prev = sp.darts[(sp.darts.indexOf(before) - 1 + sp.darts.length) % sp.darts.length];
  const a0 = st.darts[prev].ang, a1 = st.darts[before].ang;
  const span = sp.darts.length === 1 ? TAU : arcCCW(a0, a1);
  const pad = Math.min(MIN_SEP, span / 3);
  let t = arcCCW(a0, norm(want));
  if (sp.darts.length === 1) t = arcCCW(a0, norm(want));
  t = Math.max(pad, Math.min(span - pad, t));
  return norm(a0 + t);
}

/* ── COMMIT ───────────────────────────────────────────────────────────────────
   THE ONE GENUINE SUBTLETY, and the seam where the ink becomes load-bearing.

   Joining two corners of a face has two cases:
     • DIFFERENT boundary cycles → the cycles MERGE; the face count is unchanged.
     • THE SAME boundary cycle   → the face SPLITS in two, and the face's OTHER
       boundary components (islands) must be dealt to one side or the other.

   On real paper the drawn loop decides which islands fall inside it. So the
   partition is EXPLICIT: `move.partition` is a predicate/array saying, for each of
   the face's other cycles, whether it lands on side A. The page computes it from
   the actual ink (see geom.mjs `partitionByInk`); the twin passes a seeded legal
   one. EVERY partition yields a legal Sprouts game, so the claim holds over both,
   and the core stays pixel-free.

   DO NOT "simplify" this parameter away — without it the map is not an embedding
   and the lower bound 2n stops being a theorem about THIS board.
   ------------------------------------------------------------------------- */
function commitMove(st, move, opts) {
  opts = opts || {};
  const loc = faceOfOcc(st, move.a), locB = faceOfOcc(st, move.b);
  if (!loc || !locB) throw new Error('sprouts: move names a corner that is not on the map');
  if (loc.face !== locB.face) throw new Error('sprouts: corners are not on the same face');
  const face = loc.face;
  const A = move.a, B = move.b;
  if (lives(st, A.spot) < 1 || lives(st, B.spot) < 1) throw new Error('sprouts: a spot is out of lives');
  if (A.spot === B.spot && lives(st, A.spot) < 2) throw new Error('sprouts: a self-loop needs two lives');

  // the new spot, born on the curve with degree 2 (one life left)
  const mid = { id: st.spots.length, deg: 0, born: st.movesMade + 1, darts: [],
                name: String.fromCharCode(65 + (st.spots.length % 26)) };
  st.spots.push(mid);

  // two edges: A.spot—mid and B.spot—mid
  const e1 = { id: st.edges.length, d0: -1, d1: -1, curveId: st.curves.length };
  st.edges.push(e1);
  const e2 = { id: st.edges.length, d0: -1, d1: -1, curveId: st.curves.length };
  st.edges.push(e2);

  const sameCorner = (A.spot === B.spot) && (A.dart === B.dart);
  const angA = opts.angA != null ? opts.angA : null;
  const angB = opts.angB != null ? opts.angB : null;

  const f  = addDart(st, A.spot, e1.id, 0);      // A.spot → mid
  const g  = addDart(st, mid.id, e1.id, 0);      // mid → A.spot
  const f2 = addDart(st, B.spot, e2.id, 0);      // B.spot → mid
  const g2 = addDart(st, mid.id, e2.id, 0);      // mid → B.spot
  st.darts[f].twin = g;  st.darts[g].twin = f;
  st.edges[e1.id].d0 = f; st.edges[e1.id].d1 = g;
  st.darts[f2].twin = g2; st.darts[g2].twin = f2;
  st.edges[e2.id].d0 = f2; st.edges[e2.id].d1 = g2;

  // rotation insertion. For a loop drawn back into the SAME corner, the two new
  // darts sit adjacent with f2 immediately before f, so the enclosed face is the
  // two-dart cycle [f, g2] — the loop with nothing else on that side.
  let loopFirst = false;     // true ⇒ rotation order is (f, f2); false ⇒ (f2, f)
  if (sameCorner) {
    const r0 = st.spots[A.spot].darts;
    const aF  = angA != null ? norm(angA) : synthAngle(st, A.spot, A.dart);
    const aF2 = angB != null ? norm(angB) : norm(aF - 0.35);
    /* Both new darts land in ONE corner, so their order in the rotation must be
       the order they actually leave the spot — otherwise the map describes a
       different picture than the one on the paper. */
    if (r0.length && A.dart != null) {
      const prev = r0[(r0.indexOf(A.dart) - 1 + r0.length) % r0.length];
      const a0 = st.darts[prev].ang;
      loopFirst = arcCCW(a0, aF) < arcCCW(a0, aF2);
    }
    st.darts[f].ang = aF; st.darts[f2].ang = aF2;
    if (loopFirst) { insertDart(st, A.spot, f2, A.dart); insertDart(st, A.spot, f, f2); }
    else           { insertDart(st, A.spot, f, A.dart);  insertDart(st, A.spot, f2, f); }
  } else {
    st.darts[f].ang = angA != null ? snapAngle(st, A.spot, angA, A.dart) : synthAngle(st, A.spot, A.dart);
    insertDart(st, A.spot, f, A.dart);
    st.darts[f2].ang = angB != null ? snapAngle(st, B.spot, angB, B.dart) : synthAngle(st, B.spot, B.dart);
    insertDart(st, B.spot, f2, B.dart);
  }
  // the mid spot's own rotation: [g, g2] — the two sides of the curve.
  st.darts[g].ang  = norm((opts.angMidA != null ? opts.angMidA : 0));
  st.darts[g2].ang = norm((opts.angMidB != null ? opts.angMidB : Math.PI));
  mid.darts.push(g, g2);

  st.spots[A.spot].deg += 1;
  st.spots[B.spot].deg += 1;
  mid.deg = 2;

  // ── rebuild the face's cycles ───────────────────────────────────────────────
  const others = face.cycles.filter((_, k) => k !== loc.ci && k !== locB.ci);
  const rot = (arr, k) => arr.slice(k).concat(arr.slice(0, k));
  let created;

  if (loc.ci !== locB.ci) {
    // ── MERGE: two boundary components of one face become one. ──
    const C1 = face.cycles[loc.ci], C2 = face.cycles[locB.ci];
    const w1 = C1.iso != null ? [] : rot(C1.d, loc.di);
    const w2 = C2.iso != null ? [] : rot(C2.d, locB.di);
    const merged = { iso: null, d: w1.concat([f, g2], w2, [f2, g]) };
    face.cycles = others.concat([merged]);
    created = [face];
  } else {
    // ── SPLIT: one boundary component becomes two faces. ──
    const C = face.cycles[loc.ci];
    let cycA, cycB;
    if (C.iso != null) {
      // a loop on a lone dot: two faces, each bounded by the whole loop.
      cycA = { iso: null, d: [f, g2] };
      cycB = { iso: null, d: [f2, g] };
    } else if (sameCorner) {
      // a loop drawn back into the SAME corner: one side carries the rest of the
      // old boundary, the other carries nothing but the loop.
      if (loopFirst) {
        cycA = { iso: null, d: rot(C.d, loc.di).concat([f, g2]) };
        cycB = { iso: null, d: [f2, g] };
      } else {
        cycA = { iso: null, d: [f, g2] };
        cycB = { iso: null, d: rot(C.d, loc.di).concat([f2, g]) };
      }
    } else {
      // The chord runs from corner i to corner j of one boundary cycle. Face A is
      // the walk i→j along the old boundary, then back across the new curve; face
      // B is the complementary walk j→i. (seg() is inclusive of both ends; the
      // last dart belongs to the OTHER face's head, so it is dropped here.)
      const i = loc.di, j = locB.di, L = C.d.length;
      const seg = (from, to) => { const o = []; let k = from; for (;;) { o.push(C.d[k]); if (k === to) break; k = (k + 1) % L; } return o; };
      cycA = { iso: null, d: seg(i, j).slice(0, -1).concat([f2, g]) };
      cycB = { iso: null, d: seg(j, i).slice(0, -1).concat([f, g2]) };
    }
    const fB = { id: st.faces.length, cycles: [cycB] };
    face.cycles = [cycA];
    st.faces.push(fB);
    // deal the islands
    const keep = opts.partition;
    for (let k = 0; k < others.length; k++) {
      const toA = typeof keep === 'function' ? !!keep(others[k], k)
                 : Array.isArray(keep) ? !!keep[k]
                 : (k % 2 === 0);
      (toA ? face : fB).cycles.push(others[k]);
    }
    created = [face, fB];
  }

  // the drawn curve, for the view (never consulted by any rule)
  const curve = { id: st.curves.length, a: A.spot, b: B.spot, mid: mid.id,
                  by: opts.by || 'you', poly: opts.poly || null, e1: e1.id, e2: e2.id };
  st.curves.push(curve);

  st.movesMade += 1;

  // THE INVARIANT. If this ever fails the core throws rather than let the sheet
  // display a lie: the margin tally is read from these numbers, not recomputed.
  const le = liveEnds(st);
  if (le !== 3 * st.n - st.movesMade) {
    throw new Error('sprouts: live-end invariant broken — ' + le + ' != ' + (3 * st.n - st.movesMade));
  }
  return { mid: mid.id, curve, faces: created };
}

/* ── THE HOUSE ────────────────────────────────────────────────────────────────
   Enumeration + scoring ride on legalMoves, which makes them cheaper AND exact.
   1-ply is EXACT (it will take a win, and it will not hand you one if it can
   avoid it); everything else is a rough feel for how much game is left, and the
   plaque says exactly that. No solved-game claim is made anywhere. ---------- */
function cloneState(st) {
  return {
    n: st.n, seed: st.seed, movesMade: st.movesMade, winner: st.winner,
    spots: st.spots.map((s) => ({ id: s.id, deg: s.deg, born: s.born, darts: s.darts.slice(), name: s.name })),
    darts: st.darts.map((d) => ({ id: d.id, spot: d.spot, edge: d.edge, twin: d.twin, ang: d.ang, poly: null })),
    edges: st.edges.map((e) => ({ id: e.id, d0: e.d0, d1: e.d1, curveId: e.curveId })),
    faces: st.faces.map((f) => ({ id: f.id, cycles: f.cycles.map((c) => ({ iso: c.iso, d: c.d.slice() })) })),
    curves: st.curves.map((c) => ({ id: c.id, a: c.a, b: c.b, mid: c.mid, by: c.by, poly: null, e1: c.e1, e2: c.e2 })),
  };
}
function after(st, mv, rng) {
  const c = cloneState(st);
  const a = { spot: mv.a.spot, dart: mv.a.dart }, b = { spot: mv.b.spot, dart: mv.b.dart };
  commitMove(c, { a, b }, { partition: (cy, k) => (rng ? rng() < 0.5 : k % 2 === 0) });
  return c;
}
/* live ends that have NO partner on their own face — game already over for them */
function strandedLives(st) {
  let s = 0;
  for (const f of st.faces) {
    const occ = occurrencesOf(st, f).filter((o) => lives(st, o.spot) >= 1);
    const spots = new Set(occ.map((o) => o.spot));
    if (occ.length === 0) continue;
    const canMove = spots.size >= 2 || (spots.size === 1 && lives(st, occ[0].spot) >= 2);
    if (!canMove) for (const sp of spots) s += lives(st, sp);
  }
  return s;
}
function moveKey(mv) {
  const lo = Math.min(mv.a.spot, mv.b.spot), hi = Math.max(mv.a.spot, mv.b.spot);
  return lo + '-' + hi;
}
function chooseHouseMove(st, seed, keepTop) {
  const moves = legalMoves(st);
  if (moves.length === 0) return null;
  const rng = makeRng((seed >>> 0) ^ (st.movesMade * 0x9E3779B9));
  // parity: the mover wants the total number of remaining moves to be ODD
  const parityWant = 1;
  const facesBefore = st.faces.length;
  // cheap prefilter so the exact loss-in-1 probe stays bounded
  const rough = moves.map((m) => ({ m, r: rng() }));
  rough.sort((x, y) => x.r - y.r);
  const probe = new Set(rough.slice(0, Math.min(8, rough.length)).map((x) => x.m));
  const scored = [];
  for (const m of moves) {
    const nx = after(st, m, rng);
    const winNow = legalMoves(nx).length === 0 ? 1 : 0;
    let lossNext = 0;
    if (!winNow && probe.has(m)) {
      const reply = legalMoves(nx);
      const cap = Math.min(reply.length, 40);          // bounded: the slice must stay invisible
      for (let q = 0; q < cap; q++) { if (legalMoves(after(nx, reply[q], rng)).length === 0) { lossNext = 1; break; } }
    }
    const s = 1000 * winNow
            - 500 * lossNext
            + 18 * parityWant * strandedLives(nx)
            + 6 * (nx.faces.length > facesBefore ? 1 : 0)
            + 3 * rng();
    scored.push({ move: m, score: s, winNow, lossNext });
  }
  scored.sort((a, b) => b.score - a.score);
  if (keepTop) {
    // diversify BY PAIR — four near-identical hops read as noise, not thought
    const seen = new Set(), out = [];
    for (const s of scored) { const k = moveKey(s.move); if (seen.has(k)) continue; seen.add(k); out.push(s); if (out.length >= keepTop) break; }
    while (out.length < Math.min(keepTop, scored.length)) out.push(scored[out.length]);
    return { best: scored[0], shortlist: out, all: scored };
  }
  return { best: scored[0], shortlist: [scored[0]], all: scored };
}

/* ── AUTO-PLAY (the twin's engine, and the page's house-vs-house demo) ─────── */
function playGame(n, seed, opts) {
  opts = opts || {};
  const st = newState(n, seed);
  const rng = makeRng(seed);
  const trace = [];
  let guard = 0;
  for (;;) {
    if (++guard > 3 * n + 8) throw new Error('sprouts: auto-play ran past 3n−1 moves');
    const moves = legalMoves(st);
    if (moves.length === 0) break;
    const before = liveEnds(st);
    const mv = opts.house ? chooseHouseMove(st, seed + st.movesMade).best.move : moves[Math.floor(rng() * moves.length)];
    commitMove(st, mv, { partition: () => rng() < 0.5 });
    const nowLive = liveEnds(st);
    trace.push({ before, after: nowLive, drop: before - nowLive });
    if (opts.onMove) opts.onMove(st, mv);
  }
  st.winner = st.movesMade % 2 === 1 ? 0 : 1; // the player who made the LAST move wins
  return { st, trace, moves: st.movesMade, winner: st.winner };
}

/* ── THE ONE CLAIM, as a function (the page's chip and the Node twin call THIS) ─
   For n spots: the live-end count starts at 3n, falls by EXACTLY 1 per move, and
   every completed game's length lies in [2n, 3n−1]. Exact integers, no tolerance,
   no fitted constant. ------------------------------------------------------- */
function claimSweep(ns, gamesPer, seed0) {
  let games = 0, minByN = {}, maxByN = {}, badDrop = 0, badBound = 0, badTally = 0;
  for (const n of ns) {
    minByN[n] = Infinity; maxByN[n] = -Infinity;
    for (let g = 0; g < gamesPer; g++) {
      const r = playGame(n, (seed0 + g * 7919 + n * 104729) >>> 0, { house: false });
      for (const t of r.trace) if (t.drop !== 1) badDrop++;
      if (r.moves < 2 * n || r.moves > 3 * n - 1) badBound++;
      if (liveEnds(r.st) !== 3 * n - r.moves) badTally++;
      minByN[n] = Math.min(minByN[n], r.moves); maxByN[n] = Math.max(maxByN[n], r.moves);
      games++;
    }
  }
  return { games, minByN, maxByN, badDrop, badBound, badTally,
           ok: badDrop === 0 && badBound === 0 && badTally === 0 };
}

/* ── THE GAME CONTROLLER — DOM-free. The page's script is a VIEW that only
   renders and forwards: its pointer handler's whole job is to build a polyline
   and call Game.offerStroke(poly). The liveness twin calls the same function on
   the same path — there is no second entry point to drift from. ------------- */
function makeGame(opts) {
  opts = opts || {};
  const G = {
    st: null, ink: opts.ink || null, turn: 0, over: false, seed: opts.seed >>> 0 || 12345,
    listeners: {},
    on(k, fn) { (G.listeners[k] = G.listeners[k] || []).push(fn); return G; },
    emit(k, v) { for (const fn of (G.listeners[k] || [])) fn(v); },
  };
  G.start = function (n, seed) {
    G.seed = (seed == null ? G.seed : seed) >>> 0;
    G.st = newState(n, G.seed);
    G.turn = 0; G.over = false;
    if (G.ink) G.ink.reset(G.st);
    G.emit('start', G.st);
    return G.st;
  };
  /* THE REAL ENTRY POINT for a human stroke. A polyline in sheet units.
     Returns {ok:true, …} or {ok:false, reason}. Geometry may only REFUSE; it may
     never invent a move the topology has not blessed. */
  G.offerStroke = function (poly, by) {
    if (G.over) return { ok: false, reason: 'over' };
    if (!poly || poly.length < 2) return { ok: false, reason: 'short' };
    if (!G.ink) return { ok: false, reason: 'no-ink' };
    const ends = G.ink.endpoints(G.st, poly);
    if (!ends) return { ok: false, reason: 'ends' };
    if (lives(G.st, ends.a) < 1 || lives(G.st, ends.b) < 1) return { ok: false, reason: 'full' };
    if (ends.a === ends.b && lives(G.st, ends.a) < 2) return { ok: false, reason: 'full' };
    /* WHICH corner the stroke left by is read off the MEASURED departure angle —
       the ink names the corner, the corner is not imposed on the ink. Legality is
       then the pen's own rule (don't touch ink; don't cross it near a spot, where
       distance says nothing), and the two together are what make the thesis
       literally true in code: a non-crossing stroke cannot leave its face. */
    const oa = occurrenceAt(G.st, ends.a, ends.angA);
    const ob = occurrenceAt(G.st, ends.b, ends.angB);
    if (!G.ink.strokeIsLegal(poly, { fromSpot: ends.a, toSpot: ends.b })) {
      return { ok: false, reason: 'crossing' };
    }
    const la = faceOfOcc(G.st, oa), lb = faceOfOcc(G.st, ob);
    if (!la || !lb || la.face !== lb.face) return { ok: false, reason: 'region' };
    const part = G.ink.partitionByInk(G.st, la.face, poly, la, lb);
    let res;
    try {
      res = commitMove(G.st, { a: oa, b: ob }, {
        partition: part, poly, by: by || 'you',
        angA: ends.angA, angB: ends.angB,
        angMidA: ends.angMidA, angMidB: ends.angMidB,
      });
    } catch (e) { return { ok: false, reason: 'commit', error: String(e && e.message || e) }; }
    if (G.ink) G.ink.commit(G.st, res.curve);
    G.turn = 1 - G.turn;
    G.emit('move', { res, by: by || 'you' });
    G.checkOver();
    return { ok: true, res };
  };
  /* The house's turn: a topologically-blessed move, then a route for it. The
     house NEVER concedes off the router — concession comes from terminal() alone. */
  G.houseThink = function (keepTop) {
    const pick = chooseHouseMove(G.st, G.seed + G.st.movesMade * 31, keepTop || 4);
    if (!pick) return null;
    const cand = [];
    for (const s of pick.shortlist) {
      const r = G.ink ? G.ink.route(G.st, s.move) : null;
      if (r) cand.push({ move: s.move, score: s.score, poly: r.poly, angA: r.angA, angB: r.angB, nib: r.nib, hair: r.hair });
    }
    /* THE HOUSE NEVER CONCEDES OFF THE ROUTER. If nothing on the shortlist could
       be drawn, every other legal move is tried; and if none of THOSE can be drawn
       either, they are all tried again with the router's last resort unlocked. A
       position the topology says is playable must be played — a game that halts
       early lands below 2n moves and turns the bracket in the margin into a lie. */
    if (cand.length === 0) {
      for (const pass of [false, true]) {
        for (const s of pick.all) {
          const r = G.ink ? G.ink.route(G.st, s.move, pass ? { desperate: true } : null) : null;
          if (r) { cand.push({ move: s.move, score: s.score, poly: r.poly, angA: r.angA, angB: r.angB, nib: r.nib, hair: r.hair }); break; }
        }
        if (cand.length) break;
      }
    }
    return { best: cand[0] || null, shortlist: cand, raw: pick };
  };
  G.commitHouse = function (choice) {
    const ends = choice.poly ? { angA: choice.angA, angB: choice.angB } : {};
    const oa = { spot: choice.move.a.spot, dart: choice.move.a.dart };
    const ob = { spot: choice.move.b.spot, dart: choice.move.b.dart };
    const la = faceOfOcc(G.st, oa), lb = faceOfOcc(G.st, ob);
    const part = (G.ink && choice.poly) ? G.ink.partitionByInk(G.st, la.face, choice.poly, la, lb) : null;
    const res = commitMove(G.st, { a: oa, b: ob }, {
      partition: part || ((cy, k) => k % 2 === 0), poly: choice.poly || null, by: 'house',
      angA: ends.angA, angB: ends.angB,
    });
    if (G.ink) G.ink.commit(G.st, res.curve);
    G.turn = 1 - G.turn;
    G.emit('move', { res, by: 'house' });
    G.checkOver();
    return res;
  };
  G.checkOver = function () {
    if (terminal(G.st)) {
      G.over = true;
      // the player who could not move LOSES; G.turn is whoever is to move now
      G.st.winner = 1 - G.turn;
      G.emit('over', { winner: G.st.winner, moves: G.st.movesMade, n: G.st.n });
    }
    return G.over;
  };
  G.legalMoves = () => legalMoves(G.st);
  G.terminal = () => terminal(G.st);
  G.liveEnds = () => liveEnds(G.st);
  return G;
}

/* ── THE IN-PAGE SELF-TEST — the SAME code the Node twin runs. The chip carries
   the move-count bound only; no winner lamp, no solved-game idiom. --------- */
function runSelfTest(heavy) {
  const checks = [];
  const add = (name, pass, info) => checks.push({ name, pass: !!pass, info });
  const per = heavy ? 500 : 60;
  const sweep = claimSweep([2, 3, 4, 5], per, 20260426);
  add('live ends fall by EXACTLY 1 per move', sweep.badDrop === 0,
      sweep.games + ' games · ' + sweep.badDrop + ' bad drops');
  add('every game length in [2n, 3n−1]', sweep.badBound === 0,
      'n=2 ' + sweep.minByN[2] + '..' + sweep.maxByN[2] + ' · n=3 ' + sweep.minByN[3] + '..' + sweep.maxByN[3] +
      ' · n=4 ' + sweep.minByN[4] + '..' + sweep.maxByN[4] + ' · n=5 ' + sweep.minByN[5] + '..' + sweep.maxByN[5]);
  add('tally equals 3n − moves at every step', sweep.badTally === 0, sweep.badTally + ' mismatches');
  // two independent readings of terminality must agree, over played-out boards —
  // and the merge/split bookkeeping must match the rotation system's own face trace
  let disagree = 0, probes = 0, drift = 0;
  for (let s = 0; s < (heavy ? 60 : 20); s++) {
    const n = 2 + (s % 4);
    const st = newState(n, 900 + s);
    const rng = makeRng(900 + s);
    for (;;) {
      const mv = legalMoves(st);
      probes++;
      if ((mv.length === 0) !== terminalIndependent(st)) disagree++;
      if (mapConsistency(st).bad !== 0) drift++;
      if (mv.length === 0) break;
      commitMove(st, mv[Math.floor(rng() * mv.length)], { partition: () => rng() < 0.5 });
    }
  }
  add('two independent terminality readings agree', disagree === 0, probes + ' positions · ' + disagree + ' disagreements');
  add('faces match the rotation system’s own trace', drift === 0, probes + ' positions · ' + drift + ' drifted');
  const passed = checks.filter((c) => c.pass).length;
  return { ok: passed === checks.length, passed, total: checks.length, checks,
           facts: { games: sweep.games, minByN: sweep.minByN, maxByN: sweep.maxByN } };
}

// ===== END THE SPROUTS CORE =====

export {
  makeRng, newState, lives, liveEnds, legalMoves, terminal, terminalIndependent,
  occurrencesOf, occurrenceAt, faceOfOcc, commitMove, cloneState, after,
  traceFaces, mapConsistency, sameCycle, cornerAngle, cornerSpan, liveCorners,
  chooseHouseMove, playGame, claimSweep, makeGame, runSelfTest, strandedLives,
  MIN_SEP, norm, arcCCW,
};
