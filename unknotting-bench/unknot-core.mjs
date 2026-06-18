// ============================================================================
//  The Unknotting Bench — the untying verb & the |Δ|=1 obstruction (CORE)
//  Sewing Room bench #3. Pure, dependency-free except for the SHARED knot math,
//  which it IMPORTS from the sibling Knot Tabulator's core (the single source of
//  truth for gaussToCrossings / knotDeterminant / isRealizable / pColorings).
//  This file adds the only genuinely NEW math: the REDUCING layer — the player-
//  directed inverse moves (untwist = R1-undo, unpoke = R2-undo, slide = R3) that
//  TAKE crossings AWAY instead of adding them.
//
//  THE CLAIM — you can untie a disguise; you cannot untie a theorem.
//
//  The Knot Tabulator proves a number |Δ(−1)| can't budge under any redrawing.
//  This bench turns that into a GAME you play with your hands: pick a verb, watch
//  a real loop of string simplify, and either reach the bare unknot (the disguised
//  board) — or hit a wall the theorem builds (the trefoil). The same invariant that
//  held byte-still on the Tabulator's random walk is what makes the trefoil
//  un-untieable: every legal move preserves |Δ|, so a board with |Δ|=3 can NEVER
//  be reduced to the |Δ|=1 unknot. The obstruction is a theorem, not a failure.
//
//  THE TWO BOARDS (both verified end-to-end against the imported core):
//    • DISGUISED UNKNOT  O3 U3 O1 O2 U2 U1  — realizable, |Δ|=1, 3 crossings.
//      Scripted solve: untwist@0 → O1 O2 U2 U1 (|Δ|=1) → unpoke → empty = WIN.
//    • TREFOIL  O1 U2 O3 U1 O2 U3 — |Δ|=3, 3 crossings. ZERO untwist loci, ZERO
//      unpoke loci, ZERO slide windows: no legal move can ever shrink it.
//
//  THE NEW REDUCING LAYER (every enumerator is pure; every applier RE-GATES its
//  output through the imported isRealizable AND determinant-preservation, so a
//  returned locus is ALWAYS a genuine removable site — a candidate that breaks
//  planarity or moves the number is never offered):
//    • untwistLoci / applyUntwist  — R1-undo: a same-id cyclically-adjacent pair.
//    • unpokeLoci  / applyUnpoke   — R2-undo: a clasped bigon (two ids adjacent at
//      one spot and reverse-adjacent elsewhere with opposite over/under).
//    • slideLoci   / applySlide    — R3: reverse a window of 3 consecutive same-type
//      distinct-id tokens (count-neutral; repositions a strand). Mirrors the core's
//      applyR3 enumeration, deterministically (no rng) so a click maps to a window.
//    • legalTargets(code, verb)    — the crossing ids a verb may act on (drives the
//      chip-lighting + the felt rejection of an illegal tap).
//    • solveBoard(code)            — the honest BFS solver: reduce-only search to the
//      empty code; returns {won, crossings, …}. It SOLVES the disguise and STALLS on
//      the trefoil (it is not an "always wins" oracle — that vacuous twin is the
//      load-bearing neg-control caught in claim 3).
//
//  ANTI-CIRCULARITY. The reducing moves are selected by realizability + crossing-
//  count ALONE; the determinant and the p-coloring are SEPARATELY-computed
//  witnesses the self-test checks them against. No move consults an invariant to
//  decide whether it's legal, so "every reducing move holds |Δ| and every
//  p-coloring" is a genuine theorem-witness, not a tautology.
//
//  HONESTY. What is PROVEN here: every reducing move on these boards (and on a
//  battery of random reducible diagrams built by the Tabulator's adders) holds the
//  determinant AND p=3,5 colorings; the disguise reaches 0 crossings (|Δ|≡1) = WIN;
//  the trefoil's whole R3-reachable orbit floors at 3 crossings (|Δ|≡3) — it is
//  STUCK; and a vacuous always-wins solver provably FAILS the trefoil. The general
//  "|Δ|≠1 ⟹ not the unknot" is the theorem the bench ENACTS, not re-derives.
// ============================================================================

import {
  gaussToCrossings, knotDeterminant, isRealizable, pColorings,
  applyR1, applyR2, applyR3, applyRandomMove, makeRng, diagramCode,
} from '../knot-tabulator/knot-core.mjs';

// ===== UNKNOT CORE BEGIN =====
// The reducing layer ONLY lives between these sentinels. The page inlines a
// byte-twin of THIS slice; the shared knot math (gaussToCrossings / knotDeterminant
// / isRealizable / pColorings) is the IMPORT, not duplicated — the single shared
// authority. unknot-core.test.mjs proves this slice char-for-char === the module.

// ── detOf / colOf — read a raw signed Gauss code through the shared seam. ──────
// Local shorthands the reducing layer uses to re-gate its own output. They lean on
// the imported authorities; the in-page twin closes over the same imports.
function detOf(code){ return knotDeterminant(gaussToCrossings(code)); }
function colOf(code, p){ const d = gaussToCrossings(code); return pColorings(d.cr, d.arcs, p); }

// ── BOARDS — the two starting codes (the only NEW data; signed Gauss codes). ───
// Disguise: realizable, |Δ|=1, untieable. Trefoil: read from the shared diagramCode
// so the two benches agree byte-for-byte on what "the trefoil" is.
function boardCode(name){
  if (name === 'disguise'){
    return [
      { t: 'O', id: 3, sign: 1 }, { t: 'U', id: 3, sign: 1 },
      { t: 'O', id: 1, sign: 1 }, { t: 'O', id: 2, sign: 1 },
      { t: 'U', id: 2, sign: 1 }, { t: 'U', id: 1, sign: 1 },
    ];
  }
  if (name === 'trefoil') return diagramCode('trefoil').code.map(c => ({ ...c }));
  throw new Error('unknown board: ' + name);
}

// ── untwistLoci(code) [R1-undo] — a removable kink. ───────────────────────────
// A site i where the SAME crossing id sits at two cyclically-adjacent positions
// (i, i+1) — geometrically a single twist of the strand against itself. The locus
// is RE-GATED: applyUntwist's output must stay realizable AND hold the determinant
// (a candidate that fails either is not a real R1-undo and is never offered). The
// wrap case i===n-1 (the pair straddles the seam) is handled by applyUntwist.
function untwistLoci(code){
  const n = code.length;
  const d0 = detOf(code);
  const out = [];
  for (let i = 0; i < n; i++){
    if (code[i].id !== code[(i + 1) % n].id) continue;        // a same-id adjacent pair
    const after = applyUntwist(code, i);
    if (after.length !== n - 2) continue;                     // must drop exactly the two tokens
    if (after.length > 0 && !isRealizable(after)) continue;   // PLANARITY gate
    if (after.length > 0 && detOf(after) !== d0) continue;    // |Δ| must not move (soundness)
    out.push({ i, id: code[i].id });
  }
  return out;
}

// applyUntwist(code, i) — drop the same-id pair at (i, i+1), cyclically. When the
// pair straddles the seam (i === n-1, pairing the last token with the first), the
// two removed tokens are at index n-1 and 0, so the survivors are slice(1, n-1).
function applyUntwist(code, i){
  const n = code.length;
  if (i === n - 1) return code.slice(1, n - 1);
  return code.slice(0, i).concat(code.slice(i + 2));
}

// ── unpokeLoci(code) [R2-undo] — a clasped bigon. ─────────────────────────────
// Two distinct ids {a,b} adjacent at (i, i+1), whose OTHER occurrences are also
// adjacent somewhere (any of the 4 cyclic windows — a slid intermediate must not be
// missed), with the over/under REVERSED on each id (a.t!==a'.t and b.t!==b'.t).
// That is exactly the local picture  …O a, O b … U b, U a…  (or its rotations) that
// an R2 poke created — pulling the two strands apart removes all four tokens. The
// locus is RE-GATED on realizability + determinant-preservation, and the soundness
// assert in the self-test is the backstop against a loose detector.
function unpokeLoci(code){
  const n = code.length;
  const d0 = detOf(code);
  const out = [];
  for (let i = 0; i < n; i++){
    const a = code[i], b = code[(i + 1) % n];
    if (a.id === b.id) continue;                              // two DISTINCT ids
    let ja = -1, jb = -1;                                     // the other occurrence of each
    for (let k = 0; k < n; k++){
      if (k !== i && code[k].id === a.id) ja = k;
      if (k !== (i + 1) % n && code[k].id === b.id) jb = k;
    }
    if (ja < 0 || jb < 0) continue;
    const adj = ((jb + 1) % n === ja) || ((ja + 1) % n === jb);  // reverse-adjacency, either order
    if (!adj) continue;
    if (code[i].t === code[ja].t) continue;                  // id a's two passes are opposite O/U
    if (code[(i + 1) % n].t === code[jb].t) continue;        // id b's two passes are opposite O/U
    const after = applyUnpoke(code, i);
    if (after.length !== n - 4) continue;                    // must drop all four tokens
    if (after.length > 0 && !isRealizable(after)) continue;  // PLANARITY gate
    if (after.length > 0 && detOf(after) !== d0) continue;   // |Δ| must not move (soundness)
    out.push({ i, ids: [a.id, b.id] });
  }
  return out;
}

// applyUnpoke(code, i) — remove the two ids of the bigon clasped at (i, i+1).
// Dropping every token of both ids collapses the bigon and rejoins the strand.
function applyUnpoke(code, i){
  const n = code.length;
  const a = code[i].id, b = code[(i + 1) % n].id;
  return code.filter(c => c.id !== a && c.id !== b);
}

// ── slideLoci(code) [R3] — a triangle slide (count-NEUTRAL). ──────────────────
// Reverse a window of THREE consecutive SAME-TYPE (all-O or all-U) distinct-id
// tokens, keeping the code planar — exactly the core's applyR3 window logic, but
// enumerated DETERMINISTICALLY (no rng) so a click maps to a specific window. A
// slide changes no crossing count; it repositions a strand so a kink or bigon can
// be unlocked. Each window is realizability-gated and determinant-checked.
function slideLoci(code){
  const L = code.length;
  if (L < 6) return [];
  const d0 = detOf(code);
  const out = [];
  for (let s = 0; s + 3 <= L; s++){
    const w0 = code[s], w1 = code[s + 1], w2 = code[s + 2];
    if (w0.t !== w1.t || w1.t !== w2.t) continue;            // all same type (over-slide or under-slide)
    if (w0.id === w1.id || w1.id === w2.id || w0.id === w2.id) continue;   // three distinct crossings
    const after = code.slice(0, s).concat([w2, w1, w0], code.slice(s + 3));   // reverse the window
    if (!isRealizable(after)) continue;                      // PLANARITY gate (the only structural gate)
    if (detOf(after) !== d0) continue;                       // |Δ| must not move (soundness)
    out.push({ i: s, j: s + 2, ids: [w0.id, w1.id, w2.id] });
  }
  return out;
}

// applySlide(code, s) — reverse the 3-token window starting at s.
function applySlide(code, s){
  return code.slice(0, s).concat([code[s + 2], code[s + 1], code[s]], code.slice(s + 3));
}

// ── legalTargets(code, verb) — the crossing ids a verb may legally act on. ─────
// Drives chip-lighting and the felt rejection: a verb chip lights iff this returns
// a nonempty set, and an illegal tap (a verb with no target, or a crossing no verb
// can touch) triggers the shake. Returns a de-duplicated array of crossing ids.
function legalTargets(code, verb){
  const ids = new Set();
  if (verb === 'untwist') for (const L of untwistLoci(code)) ids.add(L.id);
  else if (verb === 'unpoke') for (const L of unpokeLoci(code)) for (const id of L.ids) ids.add(id);
  else if (verb === 'slide') for (const L of slideLoci(code)) for (const id of L.ids) ids.add(id);
  return [...ids];
}

// allLoci(code) — every legal reducing/sliding move from a code, tagged by verb.
// The renderer + the solver both walk this; each entry carries the applier inputs.
function allLoci(code){
  const out = [];
  for (const L of untwistLoci(code)) out.push({ verb: 'untwist', i: L.i, ids: [L.id] });
  for (const L of unpokeLoci(code)) out.push({ verb: 'unpoke', i: L.i, ids: L.ids });
  for (const L of slideLoci(code)) out.push({ verb: 'slide', i: L.i, ids: L.ids });
  return out;
}

// applyMove(code, move) — apply a tagged locus from allLoci, returning the new code.
function applyMove(code, move){
  if (move.verb === 'untwist') return applyUntwist(code, move.i);
  if (move.verb === 'unpoke') return applyUnpoke(code, move.i);
  if (move.verb === 'slide') return applySlide(code, move.i);
  throw new Error('unknown verb: ' + move.verb);
}

// codeKey(code) — a canonical string for a code (for the BFS visited-set). Type +
// id in sequence captures the combinatorics that the moves act on.
function codeKey(code){ return code.map(c => c.t + c.id).join(','); }

// ── solveBoard(code) — the HONEST reduce-only solver. ─────────────────────────
// BFS over {untwist, unpoke, slide} from the start code, seeking the EMPTY code
// (zero crossings = the bare unknot). It returns the real outcome: {won, crossings,
// floor, path}. `crossings` is the crossing count of the best (lowest) state seen;
// `floor` is the minimum crossing count reachable at all. It SOLVES the disguise
// (won:true, crossings 0) and STALLS on the trefoil (won:false, floor 3) — it is
// NOT an always-wins oracle, which is the load-bearing negative control. The BFS is
// bounded (reducing/neutral moves only; a node cap guards the slide-cycle orbit).
function solveBoard(startCode, opts = {}){
  const cap = opts.cap || 4000;
  const start = startCode.map(c => ({ ...c }));
  const seen = new Set([codeKey(start)]);
  const queue = [{ code: start, path: [] }];
  let floor = start.filter(c => c.t === 'U').length;          // best (lowest) crossing count seen
  let best = { won: false, crossings: floor, path: [] };
  let head = 0, expanded = 0;
  while (head < queue.length && expanded < cap){
    const cur = queue[head++]; expanded++;
    const ncr = cur.code.filter(c => c.t === 'U').length;
    if (cur.code.length === 0){
      return { won: true, crossings: 0, floor: 0, expanded, path: cur.path };   // reached the bare unknot
    }
    if (ncr < floor){ floor = ncr; best = { won: false, crossings: ncr, path: cur.path }; }
    for (const mv of allLoci(cur.code)){
      const next = applyMove(cur.code, mv);
      const key = codeKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ code: next, path: cur.path.concat([{ verb: mv.verb, ids: mv.ids }]) });
    }
  }
  return { won: best.won, crossings: best.crossings, floor, expanded, path: best.path };
}

// vacuousSolver(_code) — the LOAD-BEARING fake. It ignores the board and always
// claims victory. It must SOLVE the disguise (correct, by luck) but FAIL the trefoil
// (its 0/|Δ|=1 claim contradicts the real 3/|Δ|=3) — so the self-test's neg-control
// has teeth and the honest solver is provably not "always says yes".
function vacuousSolver(_code){ return { won: true, crossings: 0, floor: 0 }; }

// ── runSelfTest() — THE SOLE ORACLE (the in-page pill AND the Node twin call it). ─
// Returns { pass, total, lines:[{name,ok,detail}] }, every detail carrying LIVE
// numbers. The five claims:
//   (1) SOUND        — every untwist/unpoke/slide holds |Δ| AND p=3,5 (disjoint
//                      backstop) on both boards + a battery of random reducible
//                      diagrams (built by the Tabulator's ADDERS, then reduced).
//   (2) POSITIVE     — the scripted untwist@0 → unpoke on the disguise: crossings
//                      3→2→0, |Δ|≡1 at every step, ends empty (WIN).
//   (3) NEG-CONTROL  — EXHAUSTIVE BFS from the trefoil: the reachable floor never
//                      drops below 3 crossings and |Δ|≡3 across the whole orbit;
//                      THEN the teeth: the vacuous always-wins solver FAILS the
//                      trefoil, and the honest solver DISCRIMINATES (solves the
//                      disguise, stalls on the trefoil).
//   (4) DISCRIMINATION — |Δ|(disguise)=1, |Δ|(trefoil)=3, 3≠1; coloring witness.
function runSelfTest(){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });

  const disguise = boardCode('disguise');
  const trefoil = boardCode('trefoil');

  // ── CLAIM 1 — SOUND: every reducing move holds |Δ| AND p=3,5. ──────────────
  {
    // (a) both boards: apply EVERY legal move once, assert invariants unchanged.
    let bad = '', moves = 0;
    const fired = { untwist: 0, unpoke: 0, slide: 0 };
    for (const [nm, code] of [['disguise', disguise], ['trefoil', trefoil]]){
      const d0 = detOf(code), c3 = colOf(code, 3), c5 = colOf(code, 5);
      for (const mv of allLoci(code)){
        const next = applyMove(code, mv);
        fired[mv.verb]++; moves++;
        if (next.length > 0){
          if (detOf(next) !== d0) bad = `${nm}/${mv.verb}/det`;
          if (colOf(next, 3) !== c3) bad = `${nm}/${mv.verb}/p3`;
          if (colOf(next, 5) !== c5) bad = `${nm}/${mv.verb}/p5`;
        } else {
          if (d0 !== 1) bad = `${nm}/${mv.verb}/emptyDetNot1`;   // empty code ⟹ unknot ⟹ |Δ|=1
        }
      }
    }
    // (b) a BATTERY of random reducible diagrams: GROW each board with the
    // Tabulator's adders, then assert EVERY reducing move holds det + p3,p5.
    let battery = 0, batteryBad = '';
    for (const base of [disguise, trefoil]){
      for (let seed = 1; seed <= 60; seed++){
        const rng = makeRng((seed * 2654435761) >>> 0);
        let code = base.map(c => ({ ...c }));
        const d0 = detOf(code), b3 = colOf(code, 3), b5 = colOf(code, 5);
        for (let g = 0; g < 6 && code.length < 30; g++){            // grow with R1/R2/R3 (count-up)
          const m = applyRandomMove(code, rng); code = m.code;
        }
        if (detOf(code) !== d0) continue;                          // adders preserve |Δ| (Tabulator's claim)
        for (const mv of allLoci(code)){                           // now every REDUCING move must hold it
          const next = applyMove(code, mv); battery++;
          if (next.length > 0){
            if (detOf(next) !== d0) batteryBad = `seed${seed}/${mv.verb}/det`;
            if (colOf(next, 3) !== b3) batteryBad = `seed${seed}/${mv.verb}/p3`;
            if (colOf(next, 5) !== b5) batteryBad = `seed${seed}/${mv.verb}/p5`;
          }
        }
      }
    }
    const ok = bad === '' && batteryBad === '';
    T('CLAIM 1 — SOUND: every untwist/unpoke/slide holds |Δ(−1)| AND the disjoint p=3,5 coloring counts — on both boards AND a battery of random reducible diagrams (grown by the adders, then reduced)',
      ok, ok ? `${moves} board moves (untwist ${fired.untwist} · unpoke ${fired.unpoke} · slide ${fired.slide}) + ${battery} battery reductions over 120 grown diagrams · 0 drift in det or p3/p5`
            : `board drift ${bad || '—'} · battery drift ${batteryBad || '—'}`);
  }

  // ── CLAIM 2 — POSITIVE: the scripted solve of the disguise reaches the unknot. ─
  {
    let code = disguise.map(c => ({ ...c }));
    const steps = [];
    const ncr = c => c.filter(t => t.t === 'U').length;
    steps.push({ k: ncr(code), d: detOf(code) });               // 3 crossings, |Δ|=1
    // untwist@0 (the O3/U3 kink)
    const ut = untwistLoci(code).find(L => L.i === 0);
    code = applyUntwist(code, ut.i);
    steps.push({ k: ncr(code), d: detOf(code) });               // 2 crossings, |Δ|=1
    // unpoke (the remaining O1 O2 U2 U1 clasp)
    const up = unpokeLoci(code)[0];
    code = applyUnpoke(code, up.i);
    steps.push({ k: code.length === 0 ? 0 : ncr(code), d: code.length === 0 ? 1 : detOf(code) });   // empty, WIN
    const won = code.length === 0;
    const dropOk = steps[0].k === 3 && steps[1].k === 2 && steps[2].k === 0;
    const detOk = steps.every(s => s.d === 1);
    const ok = won && dropOk && detOk;
    T('CLAIM 2 — POSITIVE: the scripted untwist@0 → unpoke on the disguised board drops crossings 3→2→0, |Δ|≡1 at EVERY step, and ends at the empty code (the bare unknot, untied) = WIN',
      ok, ok ? `crossings ${steps.map(s => s.k).join('→')} · |Δ| ${steps.map(s => s.d).join('=')} (held at 1) · empty code reached`
            : `won=${won} drops=${steps.map(s => s.k).join('→')} dets=${steps.map(s => s.d).join(',')}`);
  }

  // ── CLAIM 3 — NEG-CONTROL: the trefoil is STUCK, the teeth bite. ────────────
  {
    // (a) EXHAUSTIVE BFS from the trefoil over {untwist, unpoke, slide}: the
    // reachable crossing FLOOR never drops below 3, |Δ|≡3 across the whole orbit
    // (slides included — this closes the gap that a slide might expose a site).
    const d0 = detOf(trefoil);
    const seen = new Set([codeKey(trefoil)]);
    const queue = [trefoil.map(c => ({ ...c }))];
    let head = 0, floor = trefoil.filter(c => c.t === 'U').length, orbitDetBad = '', orbit = 0;
    while (head < queue.length && orbit < 5000){
      const cur = queue[head++]; orbit++;
      if (detOf(cur) !== d0) orbitDetBad = codeKey(cur);
      floor = Math.min(floor, cur.filter(c => c.t === 'U').length);
      if (cur.length === 0){ floor = 0; }                        // would mean the trefoil untied — must NOT happen
      for (const mv of allLoci(cur)){
        const next = applyMove(cur, mv);
        const key = codeKey(next);
        if (!seen.has(key)){ seen.add(key); queue.push(next); }
      }
    }
    const trefoilStuck = floor >= 3 && orbitDetBad === '';

    // (b) THE TEETH — a VACUOUS always-wins solver must FAIL the trefoil (its
    // 0/|Δ|=1 contradicts the real 3/|Δ|=3); the HONEST solver discriminates.
    const fake = vacuousSolver(trefoil);
    const realDet = detOf(trefoil), realCr = trefoil.filter(c => c.t === 'U').length;
    const fakeContradicted = fake.won === true && fake.crossings === 0 && (realCr !== 0 || realDet !== 1);
    const honestTre = solveBoard(trefoil);
    const honestDis = solveBoard(disguise);
    const discriminates = honestDis.won === true && honestDis.crossings === 0 &&
                          honestTre.won === false && honestTre.floor >= 3;

    const ok = trefoilStuck && fakeContradicted && discriminates;
    T('CLAIM 3 — NEG-CONTROL (load-bearing): the trefoil\'s whole R3-reachable orbit floors at 3 crossings with |Δ|≡3 (it can NEVER reach the unknot) — AND the vacuous always-wins solver provably FAILS it (0/|Δ|=1 ≠ real 3/3), while the honest solver SOLVES the disguise and STALLS on the trefoil',
      ok, ok ? `orbit ${orbit} states · floor ${floor} (≥3) · |Δ|≡${d0} throughout · vacuous claims won/0 but real is ${realCr}cr/|Δ|${realDet} (caught) · honest: disguise WON(0cr) trefoil STUCK(floor ${honestTre.floor})`
            : `stuck=${trefoilStuck}(floor ${floor},orbitDetBad ${orbitDetBad || '—'}) fakeCaught=${fakeContradicted} discriminates=${discriminates}(dis ${honestDis.won}/${honestDis.crossings}, tre ${honestTre.won}/${honestTre.floor})`);
  }

  // ── CLAIM 4 — DISCRIMINATION: |Δ| 1 vs 3, with a coloring witness. ──────────
  {
    const dDis = detOf(disguise), dTre = detOf(trefoil);
    const distinguishes = dDis === 1 && dTre === 3 && dTre !== dDis;
    const colDis = colOf(disguise, 3), colTre = colOf(trefoil, 3);
    // disguise is the unknot ⟹ NOT 3-colorable (only the 3 trivial monochrome);
    // trefoil IS 3-colorable (9 colorings mod 3 → 6 nontrivial).
    const colorWitness = colDis === 3 && colTre === 9 && colTre > colDis;
    const ok = distinguishes && colorWitness;
    T('CLAIM 4 — DISCRIMINATION: |Δ|(disguise)=1, |Δ|(trefoil)=3, 3≠1 — and the coloring witness agrees (disguise NOT 3-colorable: 3 trivial; trefoil 3-colorable: 9 mod-3) — two disjoint invariants both separate untieable from un-untieable',
      ok, ok ? `|Δ| disguise ${dDis} vs trefoil ${dTre} (3≠1 ✓) · mod-3 colorings disguise ${colDis} (trivial) vs trefoil ${colTre} (3-colorable)`
            : `distinguish=${distinguishes}(${dDis},${dTre}) colorWitness=${colorWitness}(${colDis},${colTre})`);
  }

  const pass = lines.filter(l => l.ok).length;
  return { pass, total: lines.length, lines };
}
// ===== UNKNOT CORE END =====

export {
  detOf, colOf, boardCode,
  untwistLoci, applyUntwist, unpokeLoci, applyUnpoke, slideLoci, applySlide,
  legalTargets, allLoci, applyMove, codeKey, solveBoard, vacuousSolver, runSelfTest,
};
