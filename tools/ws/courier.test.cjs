#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   courier.test.cjs — Node self-test for tools/ws/courier.js (the ws:carry:*
   channel + the room→{accepts,emits} registry + the typed-edge graph). Run:
       node tools/ws/courier.test.cjs

   No deps. Mocks a Map-backed global.localStorage, requires courier.js, and
   asserts: the registry shape, the typed-edge graph, the edge-table === the
   type-intersection graph over ALL 9 ordered pairs (the second gcd-edge
   spiro→gears documented), the circuit + its EXPLICIT return-edge home, the
   ws:carry:* channel round-trips and is storage-off-safe, and that the registry
   AGREES with cartouche/core.mjs's ROOMS (the page's math authority) so the two
   never drift. Prints "courier self-test: N/N PASS" and exits non-zero on failure.

   ws.js's own ws.test.cjs is NOT touched by this file — courier shares nothing
   mutable with ws.js and runs entirely on its own.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');

/* ── a Map-backed localStorage mock (string-coercing, like the real thing) ── */
function makeLocalStorage() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(String(k), String(v)); },
    removeItem(k) { m.delete(k); },
    clear() { m.clear(); }
  };
}
global.localStorage = makeLocalStorage();

const Courier = require('./courier.js');

/* ── tiny assert harness ──────────────────────────────────────────────────── */
let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); } }
function eq(a, b, label) { ok(a === b, label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function reset() { global.localStorage.clear(); }

/* ── 1. the registry shape ──────────────────────────────────────────────────── */
const REG = Courier.registry();
ok(Object.keys(REG).length === 3, 'registry has 3 rooms');
eq(Courier.ports('euclid').accepts.join(','), 'gcd', 'euclid accepts gcd');
eq(Courier.ports('euclid').emits.join(','), 'gcd', 'euclid emits gcd');
eq(Courier.ports('gears').accepts.join(','), 'gcd', 'gears accepts gcd');
eq(Courier.ports('gears').emits.join(','), 'ratio', 'gears emits ratio');
eq(Courier.ports('spiro').accepts.join(','), 'ratio', 'spiro accepts ratio');
eq(Courier.ports('spiro').emits.join(','), 'gcd', 'spiro emits gcd');
ok(Courier.ports('nope') === null, 'unknown room → null ports');

/* ── 2. the typed-edge graph (hasEdge ⟺ emits ∩ accepts ≠ ∅) ─────────────────── */
ok(Courier.hasEdge('euclid', 'gears'), 'edge euclid→gears (gcd∩gcd)');
ok(Courier.hasEdge('gears', 'spiro'), 'edge gears→spiro (ratio∩ratio)');
ok(Courier.hasEdge('spiro', 'euclid'), 'edge spiro→euclid (gcd∩gcd) — the return leg');
ok(Courier.hasEdge('spiro', 'gears'), 'edge spiro→gears (gcd∩gcd) — the SECOND gcd-edge / growth hook');
ok(!Courier.hasEdge('euclid', 'spiro'), 'NO edge euclid→spiro (gcd vs ratio)');
ok(!Courier.hasEdge('gears', 'euclid'), 'NO edge gears→euclid (ratio vs gcd)');
ok(!Courier.hasEdge('euclid', 'nope'), 'NO edge to unknown room');

/* ── 3. EDGE-TABLE === the type-intersection graph over ALL 9 ordered pairs ──────
       (the headline assertion grafted from Explorer B). Recompute the expected set
       independently from emits ∩ accepts and require an exact match. ── */
{
  const ids = Object.keys(REG);                 // 3 rooms → 9 ordered pairs (incl. self)
  const expected = [];
  let ordered = 0;
  for (const from of ids) for (const to of ids) {
    ordered++;
    if (from === to) continue;
    const share = REG[from].emits.some(t => REG[to].accepts.includes(t));
    if (share) expected.push(from + '→' + to);
  }
  eq(ordered, 9, 'there are exactly 9 ordered pairs over 3 rooms');
  const got = Courier.edgeTable();
  const same = expected.length === got.length && expected.every(e => got.includes(e));
  ok(same, 'edge-table === type-intersection graph for all 9 ordered pairs [' + got.join(' ') + ']');
  eq(got.length, 4, 'exactly 4 type-sharing edges');
  ok(got.includes('gears→spiro'), 'wired ratio-edge gears→spiro present');
  ok(got.includes('spiro→gears'), 'second gcd-edge spiro→gears present (growth hook, unwired)');
  ok(!got.some(e => e.split('→')[0] === e.split('→')[1]), 'no self-loops in the edge-table');
}

/* ── 4. the circuit + its EXPLICIT return-edge home ──────────────────────────── */
{
  const c = Courier.circuit('gcd-ratio-gcd');
  ok(!!c, 'circuit gcd-ratio-gcd exists');
  eq(c.rooms.join(','), 'euclid,gears,spiro', 'circuit rooms in order');
  eq(c.returnEdge, 'spiro→euclid', 'circuit return-edge is EXPLICIT (not UI-only)');
  const edges = Courier.circuitEdges('gcd-ratio-gcd');
  eq(edges.join(' '), 'euclid→gears gears→spiro spiro→euclid', 'circuit edges include the closing leg home');
  ok(Courier.circuitIsClosed('gcd-ratio-gcd'), 'circuit closes as a matter of TYPES (every leg + return-edge is a real edge, landing home)');
  ok(Courier.circuit('nope') === null, 'unknown circuit → null');
}

/* ── 5. the ws:carry:* channel round-trips + canEnter (type-only) ────────────── */
reset();
ok(Courier.cargo() === null, 'no cargo at rest');
ok(Courier.carry({ type: 'gcd', value: 12, fromRoom: 'euclid' }), 'carry() persists cargo');
{
  const cg = Courier.cargo();
  eq(cg.type, 'gcd', 'cargo type round-trips');
  eq(cg.value, 12, 'cargo value round-trips');
  eq(cg.fromRoom, 'euclid', 'cargo fromRoom round-trips');
}
eq(localStorage.getItem('ws:carry:cargo') != null, true, 'channel wrote ws:carry:cargo');
ok(Courier.canEnter('gears'), 'a carried gcd can enter gears (accepts gcd)');
ok(!Courier.canEnter('spiro'), 'a carried gcd can NOT enter spiro (accepts ratio)');
ok(Courier.canEnter('spiro', { type: 'ratio', value: 5 }), 'an explicit ratio cargo can enter spiro');
Courier.drop();
ok(Courier.cargo() === null, 'drop() clears the channel');
ok(!Courier.canEnter('gears'), 'no cargo ⟹ canEnter false');
ok(!Courier.carry({ value: 1 }), 'carry() rejects a typeless cargo');

/* ── 6. storage-off is harmless (the bonus-never-blocker contract) ───────────── */
{
  const saved = global.localStorage;
  global.localStorage = { getItem() { throw new Error('off'); }, setItem() { throw new Error('off'); }, removeItem() { throw new Error('off'); } };
  let threw = false;
  try { Courier.carry({ type: 'gcd', value: 1 }); Courier.cargo(); Courier.drop(); Courier.canEnter('gears'); }
  catch (e) { threw = true; }
  ok(!threw, 'every channel call is storage-off-safe (no throw)');
  global.localStorage = saved;
}

/* ── 7. the registry AGREES with cartouche/core.mjs's ROOMS (no drift) ───────────
       Parse the accepts/emits arrays straight out of core.mjs and require the
       courier registry to match room-for-room, type-for-type. ── */
{
  const coreSrc = readFileSync(join(__dirname, '..', '..', 'cartouche', 'core.mjs'), 'utf8');
  // pull each `id: '<room>', glyph: …, name: …, accepts: [...], emits: [...]`
  function portsFromCore(roomId) {
    const idx = coreSrc.indexOf("id: '" + roomId + "'");
    if (idx < 0) return null;
    const slice = coreSrc.slice(idx, idx + 400);
    const acc = /accepts:\s*\[([^\]]*)\]/.exec(slice);
    const emi = /emits:\s*\[([^\]]*)\]/.exec(slice);
    const parse = m => m ? m[1].split(',').map(s => s.replace(/['"\s]/g, '')).filter(Boolean) : null;
    return { accepts: parse(acc), emits: parse(emi) };
  }
  let drift = false;
  for (const id of Object.keys(REG)) {
    const fromCore = portsFromCore(id);
    if (!fromCore || !fromCore.accepts || !fromCore.emits) { drift = true; continue; }
    if (REG[id].accepts.join(',') !== fromCore.accepts.join(',')) drift = true;
    if (REG[id].emits.join(',') !== fromCore.emits.join(',')) drift = true;
  }
  ok(!drift, 'courier registry === cartouche/core.mjs ROOMS accepts/emits (no drift between channel + math authority)');
}

/* ── report ──────────────────────────────────────────────────────────────────── */
console.log('courier self-test: ' + pass + '/' + (pass + fail) + (fail ? ' FAIL' : ' PASS'));
console.log('  edge-table: ' + Courier.edgeTable().join(', '));
console.log('  circuit gcd-ratio-gcd: ' + Courier.circuitEdges('gcd-ratio-gcd').join(' '));
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
