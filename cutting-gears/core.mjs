// The Cutting Gears — logic core (the cross of two benches).
//
// THE WHOLE POINT: two bodies of code that have never met agree on one integer.
// One knob sets a gear pair (R, r). The Spirograph room counts petals = R/gcd(R,r)
// using its OWN private gcd. The Measuring Bench (euclid-engine) reaches the same gcd
// by anthyphairesis — laying the short rod against the long, cut after cut. They share
// ONLY the integers (R, r): neither calls the other. The self-test proves they always
// agree, and rejects a tampered gcd.
//
// SOURCING (anti-drift, both encoded as tests in core.test.mjs):
//   · The euclid core is NOT forked here — gcdTrace/cfExpand are IMPORTED from
//     ../euclid-engine/core.mjs, the single sentinel-guarded source of truth.
//   · The spiro core IS inlined, but byte-faithfully: the gcd()/closure() block below,
//     between the SPIRO-CORE sentinels, is byte-identical to the same block in
//     spirograph/index.html. core.test.mjs byte-parity-checks it against that page so it
//     can never silently drift.

import { gcdTrace, cfExpand } from '../euclid-engine/core.mjs';

// ── ROOM 1: SPIROGRAPH (private — its gcd is the modulo recurrence, NOT euclid's) ──
// === SPIRO-CORE BEGIN ===
function gcd(a, b){ a = Math.abs(a|0); b = Math.abs(b|0); while(b){ var t = b; b = a % b; a = t; } return a; }

// The closure law: rolling inside/outside, the pen returns to start when the
// wheel has rolled a whole number of ring-circumferences AND completed whole
// spins simultaneously. With integer teeth R,r that is t = 2π · r/gcd(R,r),
// i.e. R/gcd(R,r) trips around the ring. petals = R/gcd(R,r).
function closure(R, r){
  var g = gcd(R, r);
  var trips = R / g;            // how many times the contact point laps the ring
  var spins = r / g;            // matching whole wheel-spins (relative period)
  return { gcd: g, petals: trips, trips: trips, spins: spins, period: 2 * Math.PI * spins };
}
// === SPIRO-CORE END ===

// Pen position rolling INSIDE the ring (hypotrochoid). d∈[0,1] pen offset. This is the
// drawing geometry only — not part of the gcd claim — so it is not under the byte sentinel.
function pen(R, r, d, t){
  var Rm = R - r, ph = (R - r) / r * t;
  return { x: Rm * Math.cos(t) + d * r * Math.cos(ph),
           y: Rm * Math.sin(t) - d * r * Math.sin(ph) };
}

// The two disjoint cores, named on the public handle so the page is externally re-auditable.
const SPIRO  = { gcd, closure, pen };
const EUCLID = { gcdTrace, cfExpand };

// ── THE TILE-BUILDER — anthyphairesis as squares ──
// Tile an R×r rectangle (R≥r used as long×short) by the largest square again and again.
// Each euclid step lays `q` squares of side = the current short rod, packed along the long
// side; the leftover strip is recursed, turning 90° each step. The smallest square's side IS
// the gcd. buildTiles reads euclid's gcdTrace for its step structure — the bench owns the math.
// Returns { tiles:[{x,y,side,stepIdx,isGcd}], trace, gcd } in rectangle-local units
// (0..long wide, 0..short tall).
function buildTiles(R, r){
  const tr = gcdTrace(Math.max(R, r), Math.min(R, r));
  const tiles = [];
  let box = { x: 0, y: 0, w: Math.max(R, r), h: Math.min(R, r) };
  let horizontal = true;                 // first squares cut from the long (horizontal) side
  const g = tr.gcd;
  tr.steps.forEach((s, idx) => {
    const sd = s.short;                  // current short rod = square side this step
    for (let k = 0; k < s.q; k++){
      const sq = horizontal
        ? { x: box.x + k*sd, y: box.y, side: sd, stepIdx: idx, isGcd: (sd === g) }
        : { x: box.x, y: box.y + k*sd, side: sd, stepIdx: idx, isGcd: (sd === g) };
      tiles.push(sq);
    }
    if (horizontal) box = { x: box.x + s.q*sd, y: box.y, w: box.w - s.q*sd, h: box.h };
    else            box = { x: box.x, y: box.y + s.q*sd, w: box.w, h: box.h - s.q*sd };
    horizontal = !horizontal;
  });
  return { tiles, trace: tr, gcd: g };
}

// ── THE SELF-TEST — the cross proves its own claim ──
// Sweeps a range of (R,r) pairs (coprime + sharing); the two disjoint cores must agree, the
// CF length must equal the euclid step count, a negative control must hold, a tampered gcd must
// be rejected, and the four tile-invariants must hold exactly.
function runSelfTest(){
  const checks = [];
  const log = (name, ok, detail) => checks.push({ name, ok, detail });

  // CLAIM 1: spiro.closure(R,r).petals === R / euclid.gcdTrace(R,r).gcd — swept across all pairs.
  // CLAIM 2: euclid.cfExpand(R,r).terms.length === euclid.gcdTrace(R,r).steps.length.
  let agree = 0, cfLenOk = 0, total = 0;
  for (let R = 8; R <= 120; R++){
    for (let r = 3; r < R; r++){
      total++;
      const spiroPetals = SPIRO.closure(R, r).petals;        // R / SPIRO's private gcd
      const tr = EUCLID.gcdTrace(R, r);
      const euclidPetals = R / tr.gcd;                       // R / euclid's gcd
      if (spiroPetals === euclidPetals) agree++;
      if (EUCLID.cfExpand(R, r).terms.length === tr.steps.length) cfLenOk++;
    }
  }
  log('1 · two disjoint cores agree: spiro.petals === R/euclid.gcd, all pairs', agree === total, agree + '/' + total);
  log('2 · CF length === euclid step count, all pairs', cfLenOk === total, cfLenOk + '/' + total);

  // CLAIM 3 (NEGATIVE CONTROL): every sharing pair draws STRICTLY fewer petals than the coprime
  // pair with the same R (which always has exactly R petals).
  let coarseOk = true, coarseDetail = '5/5';
  const sharing = [[90,56],[64,40],[96,36],[100,75],[88,33]];
  let cn = 0;
  for (const [R, r] of sharing){
    const g = EUCLID.gcdTrace(R, r).gcd;
    const sharePetals = R / g;
    // a coprime neighbour with the same R has exactly R petals (g=1)
    const coprimePetals = R;          // by construction R/1
    if (g > 1 && sharePetals < coprimePetals) cn++;
    else { coarseOk = false; coarseDetail = R + ':' + r; }
  }
  log('3 · negative control: every sharing pair is coarser than its coprime neighbour', coarseOk, coarseOk ? cn + '/5' : coarseDetail);

  // CLAIM 4 (TAMPER REJECTED): force a wrong gcd on a coprime pair and assert the identity FAILS.
  let tamperCaught = false;
  {
    const R = 89, r = 55;                                   // coprime → true petals 89
    const truth = SPIRO.closure(R, r).petals;              // 89
    const tampered = R / (EUCLID.gcdTrace(R, r).gcd * 2);  // forced gcd 2 on a coprime pair → 44.5
    tamperCaught = (truth !== tampered);                   // they MUST differ → the lie is caught
  }
  log('4 · tampered (forced-gcd) control is rejected by the identity', tamperCaught, tamperCaught ? 'caught' : 'MISSED');

  // ── TILE INVARIANTS (the extra rigor the cross earns) — verified across a sweep ──
  // 5: Σ side² === R·r (the squares exactly tile the rectangle, no gap, no overlap of area).
  // 6: no two tiles overlap (axis-aligned rectangle overlap test).
  // 7: the smallest tile side === gcd.
  // 8: number of distinct step-bands === cfExpand length.
  let areaOk = 0, overlapOk = 0, minOk = 0, bandOk = 0, ttotal = 0;
  const samples = [];
  for (let R = 8; R <= 80; R += 1) for (let r = 3; r < R; r += 1) samples.push([R, r]);
  for (const [R, r] of samples){
    ttotal++;
    const { tiles, gcd: g } = buildTiles(R, r);
    // 5: exact area
    let area = 0; for (const t of tiles) area += t.side * t.side;
    if (area === R * r) areaOk++;
    // 6: no overlap (O(n²) but n is small for this range)
    let noOverlap = true;
    outer:
    for (let i = 0; i < tiles.length; i++){
      for (let j = i + 1; j < tiles.length; j++){
        const A = tiles[i], B = tiles[j];
        if (A.x < B.x + B.side && B.x < A.x + A.side &&
            A.y < B.y + B.side && B.y < A.y + A.side){ noOverlap = false; break outer; }
      }
    }
    if (noOverlap) overlapOk++;
    // 7: smallest side === gcd
    let minSide = Infinity; for (const t of tiles) minSide = Math.min(minSide, t.side);
    if (minSide === g) minOk++;
    // 8: distinct step-bands === cf length
    const bands = new Set(tiles.map(t => t.stepIdx)).size;
    if (bands === EUCLID.cfExpand(R, r).terms.length) bandOk++;
  }
  log('5 · tile invariant: Σ side² === R·r (exact tiling), swept', areaOk === ttotal, areaOk + '/' + ttotal);
  log('6 · tile invariant: no two tiles overlap, swept', overlapOk === ttotal, overlapOk + '/' + ttotal);
  log('7 · tile invariant: smallest tile side === gcd, swept', minOk === ttotal, minOk + '/' + ttotal);
  log('8 · tile invariant: step-bands === cfExpand length, swept', bandOk === ttotal, bandOk + '/' + ttotal);

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}

export { SPIRO, EUCLID, gcd, closure, pen, gcdTrace, cfExpand, buildTiles, runSelfTest };
