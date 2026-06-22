// The Cartouche — logic core (the SOLE authority for the typed-circuit passport).
//
// THE WHOLE POINT: the estate's rooms are not only side by side — they form a TYPED
// DIRECTED GRAPH. Each room ACCEPTS some value-types and EMITS others; a directed edge
// A→B exists iff A.emits ∩ B.accepts ≠ ∅. You carry a typed value from room to room as a
// courier; a STAMP is LEGAL ⟺ such an edge exists AND the value passes the destination's
// guard. The passport SEALS ⟺ the stamped walk is a CLOSED cycle that is type-continuous
// (every edge honored) AND value-identical (the value returning to the origin === the value
// the origin minted). For the wired gcd → ratio → gcd loop that closure is an algebraic
// identity: gcd(a,b) goes out, becomes a petal-ratio, and comes home as the SAME gcd.
//
// SOURCING (anti-drift — both encoded as assertions in core.test.mjs):
//   · The euclid gcd is NOT re-forked here — gcdTrace is IMPORTED from
//     ../euclid-engine/core.mjs, the single sentinel-guarded source of truth (the way
//     cutting-gears/core.mjs already does). The prototype inlined anthyphairesis; the
//     SHIPPED core imports the certified bench.
//   · The spiro gcd/closure block is inlined byte-faithfully: the gcd()/closure() block
//     below, between the SPIRO-CORE sentinels, is byte-identical to the same block in
//     spirograph/index.html (and to cutting-gears/core.mjs). core.test.mjs byte-parity-
//     checks it so the petals = R/gcd law can never silently drift.

import { gcdTrace } from '../euclid-engine/core.mjs';

// === CORE BEGIN ===
// Everything between these sentinels is inlined byte-identical into index.html (which supplies
// gcdTrace from the same imported bench above the fence) and is byte-parity-checked by
// core.test.mjs, so the page and the twin can never drift.

// ── the spiro closure block (private — its gcd is the modulo recurrence, NOT euclid's) ──
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

// petals = R / gcd(R,r), read off the byte-pinned spiro closure (NOT a re-derivation).
function petals(R, r){ return closure(R, r).petals; }

// ── THE ROOM REGISTRY — the typed directed graph (the courier's road) ──────────────────
// Each room: id, glyph, name, accepts[], emits[], a guard(carried, ctx)→{ok,reason}, and an
// operate(seat)→{type,value} that mints the room's output value. The three rooms are real
// estate rooms; the courier (tools/ws/courier.js) exposes the SAME accepts/emits registry to
// the ws:carry:* channel as a sibling to ws.js.
const ROOMS = {
  euclid: {
    id: 'euclid', glyph: '📐', name: 'Euclid Engine',
    accepts: ['gcd'], emits: ['gcd'],          // accepts a gcd to CLOSE; the origin also seeds one
    // operate on a seed pair (a,b): mints a gcd via the imported certified bench (anthyphairesis).
    operate(seat){ return { type: 'gcd', value: gcdTrace(seat.a, seat.b).gcd }; },
    // as a destination (closing the loop): the carried gcd must equal the origin's minted gcd.
    guard(carried, ctx){
      if (carried.type !== 'gcd') return { ok: false, reason: 'wrong type — Euclid closes on a gcd' };
      if (ctx && ctx.originValue != null && carried.value !== ctx.originValue)
        return { ok: false, reason: 'value ' + carried.value + ' ≠ origin gcd ' + ctx.originValue + ' — circuit not identity' };
      return { ok: true };
    }
  },
  gears: {
    id: 'gears', glyph: '⚙️', name: 'Cutting Gears',
    accepts: ['gcd'], emits: ['ratio'],
    // guard: the seated pair (R,r) must MESH the carried gcd — gcd(R,r) === carried.value.
    guard(carried, ctx){
      if (carried.type !== 'gcd') return { ok: false, reason: 'wrong type — Gears accepts a gcd' };
      const { R, r } = ctx.seat;
      if (!(R > r && r >= 1)) return { ok: false, reason: 'seat needs R > r ≥ 1' };
      if (gcd(R, r) !== carried.value)
        return { ok: false, reason: 'gcd(' + R + ',' + r + ')=' + gcd(R, r) + ' ≠ carried ' + carried.value };
      return { ok: true };
    },
    // mints the petal-ratio (petals = R/gcd).
    operate(seat){ return { type: 'ratio', value: petals(seat.R, seat.r) }; }
  },
  spiro: {
    id: 'spiro', glyph: '🌀', name: 'Spirograph',
    accepts: ['ratio'], emits: ['gcd'],
    // guard: the seated pair (R',r') must DRAW the carried ratio — petals(R',r') === carried.value.
    guard(carried, ctx){
      if (carried.type !== 'ratio') return { ok: false, reason: 'wrong type — Spirograph accepts a ratio' };
      const { R, r } = ctx.seat;
      if (!(R > r && r >= 1)) return { ok: false, reason: 'seat needs R > r ≥ 1' };
      if (petals(R, r) !== carried.value)
        return { ok: false, reason: 'petals(' + R + ',' + r + ')=' + petals(R, r) + ' ≠ carried ' + carried.value };
      return { ok: true };
    },
    // mints a gcd back (closing the type cycle gcd→ratio→gcd).
    operate(seat){ return { type: 'gcd', value: gcd(seat.R, seat.r) }; }
  }
};

// the typed edge A→B exists iff A.emits ∩ B.accepts ≠ ∅.
function hasEdge(fromId, toId){
  const A = ROOMS[fromId], B = ROOMS[toId];
  if (!A || !B) return false;
  return A.emits.some(t => B.accepts.includes(t));
}

// the complete typed-edge table over ALL ordered pairs of rooms — the type-intersection graph.
// Documents that gears→spiro is the wired ratio-edge AND that spiro→gears is a SECOND honest
// gcd-edge (a clean growth hook for a future garden-bench circuit; not wired this cycle).
function edgeTable(){
  const ids = Object.keys(ROOMS);
  const edges = [];
  for (const from of ids) for (const to of ids){
    if (from === to) continue;               // a room never feeds itself in this graph
    if (hasEdge(from, to)) edges.push(from + '→' + to);
  }
  return edges;
}

// a stamp is LEGAL ⟺ a typed edge exists AND the carried value passes the destination's guard.
function stampLegal(fromId, toId, carried, ctx){
  if (!hasEdge(fromId, toId)) return { ok: false, reason: 'no typed edge ' + fromId + '→' + toId };
  return ROOMS[toId].guard(carried, ctx);
}

// the cartouche SEALS ⟺ a closed walk back to the origin with type-continuity AND value
// identity. `walk` is [{room, carried:{type,value}}, …]; origin is the seed gcd value.
//   · length ≥ 3 (a real loop, not a single hop),
//   · the walk begins and ends at the origin room (euclid),
//   · each hop honored a real typed edge (type continuity),
//   · the value returning home === the value the origin minted (value identity).
function sealed(walk, originValue){
  if (!Array.isArray(walk) || walk.length < 3) return false;
  if (walk[0].room !== 'euclid' || walk[walk.length - 1].room !== 'euclid') return false;
  for (let i = 0; i < walk.length - 1; i++){
    if (!hasEdge(walk[i].room, walk[i + 1].room)) return false;   // a broken edge cannot seal
  }
  return walk[walk.length - 1].carried.value === originValue;     // value identity closes it
}

// ── THE SELF-TEST — the cartouche proves its own claim ─────────────────────────────────
// legal-stamp ⟺ edge-exists ∧ guard-passes; the gcd→ratio→gcd closed loop is an algebraic
// identity (start === end); and ALL FOUR neg-controls fire (wrong-type rejected · guard-fail
// rejected · non-returning walk never seals · free-stamp foil fails the edge-check). Check 14
// (ratio-matches-but-identity-breaks) is the bonus identity-vs-ratio separation.
function runSelfTest(){
  const checks = [];
  const log = (n, ok, d) => checks.push({ n, ok, d });

  // The wired loop: origin (a,b)=(48,36) → g=12. Gears seats (60,48): gcd 12, petals 5.
  // Spiro seats (60,24): petals 60/gcd(60,24)=60/12=5 AND gcd 12 → returns 12 (identity home).
  const a = 48, b = 36;
  const g = gcdTrace(a, b).gcd;
  log('1 · euclid mints gcd(48,36)=12 (imported anthyphairesis)', g === 12, 'g=' + g);

  const gearsSeat = { R: 60, r: 48 };
  const gearOut = ROOMS.gears.operate(gearsSeat);                       // ratio 60/12 = 5
  const gGuard = ROOMS.gears.guard({ type: 'gcd', value: g }, { seat: gearsSeat });
  log('2 · gears guard passes ⟺ gcd(R,r)===carried gcd; mints ratio 5', gGuard.ok && gearOut.value === 5, 'ratio=' + gearOut.value);

  const spiroSeat = { R: 60, r: 24 };
  const sGuard = ROOMS.spiro.guard(gearOut, { seat: spiroSeat });
  const spiroOut = ROOMS.spiro.operate(spiroSeat);                     // gcd(60,24) = 12
  log('3 · spiro guard passes ⟺ petals(R\',r\')===carried ratio', sGuard.ok && petals(60, 24) === 5, 'petals=' + petals(60, 24));
  log('4 · spiro mints gcd back === origin gcd (the identity)', spiroOut.type === 'gcd' && spiroOut.value === g, 'value=' + spiroOut.value);

  // the three wired edges exist (and the whole edge table is correct).
  log('5 · typed edge euclid→gears exists (gcd ∩ gcd)', hasEdge('euclid', 'gears'), ROOMS.euclid.emits + '∩' + ROOMS.gears.accepts);
  log('6 · typed edge gears→spiro exists (ratio ∩ ratio)', hasEdge('gears', 'spiro'), ROOMS.gears.emits + '∩' + ROOMS.spiro.accepts);
  log('7 · typed edge spiro→euclid exists (gcd ∩ gcd)', hasEdge('spiro', 'euclid'), ROOMS.spiro.emits + '∩' + ROOMS.euclid.accepts);

  // the closed walk SEALS — the final hop carries the value HOME into euclid (start === end).
  const walk = [
    { room: 'euclid', carried: { type: 'gcd', value: g } },           // origin mints g=12
    { room: 'gears',  carried: gearOut },                             // → ratio 5
    { room: 'spiro',  carried: spiroOut },                            // → gcd 12 (identity)
    { room: 'euclid', carried: spiroOut }                            // carried HOME, closes
  ];
  log('8 · closed type-matched walk SEALS (start value === end value)', sealed(walk, g), 'end=' + walk[walk.length - 1].carried.value + ' origin=' + g);

  // ── THE FOUR NEG-CONTROLS (each MUST fire) ──
  // (a) wrong-type rejected — carry a gcd into Spirograph (accepts ratio only): no edge AND guard fails.
  const wrongTypeEdge = stampLegal('euclid', 'spiro', { type: 'gcd', value: 12 }, { seat: { R: 60, r: 24 } });
  const wrongTypeGuard = ROOMS.spiro.guard({ type: 'gcd', value: 12 }, { seat: { R: 60, r: 24 } });
  log('9 · NEG wrong-type: a gcd into Spirograph is rejected', !wrongTypeEdge.ok && !wrongTypeGuard.ok, wrongTypeGuard.reason);

  // (b) right-type but guard-FAILING rejected — gears seated so gcd(R,r) ≠ carried.
  const badSeat = stampLegal('euclid', 'gears', { type: 'gcd', value: 12 }, { seat: { R: 35, r: 14 } }); // gcd 7 ≠ 12
  log('10 · NEG right-type, guard fails: gcd(35,14)=7 ≠ 12 rejected', !badSeat.ok, badSeat.reason);

  // (c) non-returning walk never seals — stop at gears (value 5 ≠ origin 12, and not home).
  const openWalk = [
    { room: 'euclid', carried: { type: 'gcd', value: 12 } },
    { room: 'gears',  carried: gearOut }
  ];
  log('11 · NEG non-returning walk never seals', !sealed(openWalk, 12), 'len=' + openWalk.length + ' end=' + openWalk[openWalk.length - 1].carried.value);

  // (d) free-stamp FOIL — try euclid→spiro directly (gcd emitted, ratio required): NO edge.
  const foil = stampLegal('euclid', 'spiro', { type: 'gcd', value: 12 }, { seat: { R: 60, r: 24 } });
  log('12 · NEG free-stamp foil: euclid→spiro has NO edge', !foil.ok, foil.reason);

  // legal-stamp ⟺ edge ∧ guard, both directions, on the wired hop.
  const legal = stampLegal('euclid', 'gears', { type: 'gcd', value: 12 }, { seat: gearsSeat });
  log('13 · legal-stamp ⟺ edge-exists ∧ guard-passes (euclid→gears, seated to mesh)', legal.ok && hasEdge('euclid', 'gears') && ROOMS.gears.guard({ type: 'gcd', value: 12 }, { seat: gearsSeat }).ok, 'ok=' + legal.ok);

  // (bonus) ratio-matches but identity breaks — petals(15,12)=5 yet gcd(15,12)=3 ≠ 12 → no seal.
  const nonId = ROOMS.spiro.operate({ R: 15, r: 12 });                 // gcd 3
  const ratioOkButIdentityBreaks = petals(15, 12) === 5 && nonId.value !== g;
  const nonIdWalk = [
    { room: 'euclid', carried: { type: 'gcd', value: g } },
    { room: 'gears',  carried: gearOut },
    { room: 'spiro',  carried: nonId },
    { room: 'euclid', carried: nonId }
  ];
  log('14 · BONUS ratio-matches, identity breaks: petals(15,12)=5, gcd=3≠12 → no seal',
      ratioOkButIdentityBreaks && !sealed(nonIdWalk, g), 'returned ' + nonId.value);

  const passed = checks.filter(c => c.ok).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// === CORE END ===

export { ROOMS, gcd, petals, closure, gcdTrace, hasEdge, edgeTable, stampLegal, sealed, runSelfTest };
