/* ═══════════════════════════════════════════════════════════════════════════
   courier.js — the Workshop's `ws:carry:*` channel: the courier's road.

   A clean SIBLING to ws.js (the unlock breadcrumb module). It shares NOTHING
   mutable with ws.js and never edits it — it is its own module with its own
   global handle (WSCourier). Where ws.js answers "what has the visitor SEEN",
   courier.js answers "what can the visitor CARRY, room to room".

   The estate's rooms form a TYPED DIRECTED GRAPH. Each room ACCEPTS some value-
   types and EMITS others; a directed edge A→B exists iff A.emits ∩ B.accepts ≠ ∅.
   A courier carries a typed value as the legal input to the next room. The
   `ws:carry:*` localStorage channel persists the courier's CURRENT cargo (the
   carried {type,value} + which room minted it) across a page so a circuit can be
   resumed; it is a bonus, never a blocker, and every storage touch is wrapped.

   This module is the AUTHORITY for the room→{accepts,emits} REGISTRY and the
   typed-edge GRAPH that the front-of-house Cartouche (cartouche/index.html) and a
   future garden-bench circuit both read. The Cartouche's seal/guard LOGIC lives in
   cartouche/core.mjs (the math authority); courier.js owns only the registry + the
   carry channel — the two never duplicate each other's responsibilities.

   THE CIRCUIT / RETURN-EDGE is encoded EXPLICITLY here (grafted from Explorer B):
   the closing leg home is a first-class edge in the registry, not a UI-only
   notion. The wired circuit names its rooms IN ORDER and its return-edge by name,
   so "seal the loop" is data, not chrome.

   Vanilla, ES5-ish, zero-dependency. Dual-use (browser global + Node require).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var Courier = {};

  /* ── storage helpers (all swallow throws — storage may be blocked) ────────── */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsRemove(k) { try { localStorage.removeItem(k); } catch (e) { /* nothing to forget */ } }

  /* ── THE ROOM REGISTRY (room → {accepts, emits}) ────────────────────────────
     The single declarative source for which types each room takes and gives. The
     Cartouche's cartouche/core.mjs holds the SAME accepts/emits on its ROOMS so
     the page's guard logic and this channel's graph agree (a test cross-checks
     them); here we carry no guard/operate — courier owns ports + edges only. */
  var REGISTRY = {
    euclid: { glyph: '📐', name: 'Euclid Engine', accepts: ['gcd'],   emits: ['gcd'] },
    gears:  { glyph: '⚙️', name: 'Cutting Gears', accepts: ['gcd'],   emits: ['ratio'] },
    spiro:  { glyph: '🌀', name: 'Spirograph',    accepts: ['ratio'], emits: ['gcd'] }
  };
  Courier.registry = function () { return REGISTRY; };
  Courier.ports = function (id) { return REGISTRY[id] || null; };

  /* ── THE TYPED-EDGE GRAPH ────────────────────────────────────────────────────
     hasEdge(A,B) ⟺ A.emits ∩ B.accepts ≠ ∅. edgeTable() lists every type-sharing
     ordered pair over the registry — the type-intersection graph. This documents,
     for example, that gears→spiro (ratio∩ratio) is the wired edge AND that
     spiro→gears (gcd∩gcd) is a SECOND honest gcd-edge: a growth hook for a future
     circuit, not wired by any shipped piece this cycle. */
  Courier.hasEdge = function (fromId, toId) {
    var A = REGISTRY[fromId], B = REGISTRY[toId];
    if (!A || !B) return false;
    for (var i = 0; i < A.emits.length; i++) {
      if (B.accepts.indexOf(A.emits[i]) !== -1) return true;
    }
    return false;
  };
  Courier.edgeTable = function () {
    var ids = Object.keys(REGISTRY), edges = [];
    for (var i = 0; i < ids.length; i++) {
      for (var j = 0; j < ids.length; j++) {
        if (ids[i] === ids[j]) continue;        // a room never feeds itself
        if (Courier.hasEdge(ids[i], ids[j])) edges.push(ids[i] + '→' + ids[j]);
      }
    }
    return edges;
  };

  /* ── THE CIRCUITS (the courier's named roads — return-edge EXPLICIT) ──────────
     A circuit names its rooms IN ORDER and its return-edge by name, so the closing
     leg home is data, not a UI-only concept. `rooms` lists the ordered stops; the
     LAST→FIRST hop is the CIRCUIT/return-edge. Only the gcd-ratio-gcd loop is wired
     this cycle; the registry's second gcd-edge (spiro→gears) is left as a hook. */
  var CIRCUITS = {
    'gcd-ratio-gcd': {
      name: 'The gcd → ratio → gcd loop',
      rooms: ['euclid', 'gears', 'spiro'],     // origin first; the road runs in this order
      returnEdge: 'spiro→euclid'               // the EXPLICIT closing leg home (the seal)
    }
  };
  Courier.circuit = function (id) { return CIRCUITS[id] || null; };
  Courier.circuits = function () { return CIRCUITS; };

  /* circuitEdges(id): the full edge sequence of a circuit INCLUDING the explicit
     return-edge home, so a walker reads the whole closed loop as data. */
  Courier.circuitEdges = function (id) {
    var c = CIRCUITS[id];
    if (!c) return null;
    var edges = [];
    for (var i = 0; i < c.rooms.length - 1; i++) edges.push(c.rooms[i] + '→' + c.rooms[i + 1]);
    edges.push(c.returnEdge);                   // the closing leg, named explicitly
    return edges;
  };

  /* circuitIsClosed(id): every leg of the circuit (including the return-edge) is a
     real typed edge in the registry — the circuit closes as a matter of TYPES. */
  Courier.circuitIsClosed = function (id) {
    var edges = Courier.circuitEdges(id);
    if (!edges) return false;
    for (var i = 0; i < edges.length; i++) {
      var parts = edges[i].split('→');
      if (!Courier.hasEdge(parts[0], parts[1])) return false;
    }
    var c = CIRCUITS[id];
    var last = edges[edges.length - 1].split('→');
    return last[1] === c.rooms[0];              // the return-edge truly lands home
  };

  /* ── THE ws:carry:* CHANNEL (persist the courier's current cargo) ─────────────
     ws:carry:cargo  → JSON {type, value, fromRoom}  the value in hand
     A carry is a bonus across page reloads; storage-off is harmless. */
  var CARGO_KEY = 'ws:carry:cargo';
  Courier.carry = function (cargo) {
    if (!cargo || typeof cargo.type !== 'string') return false;
    var rec = { type: cargo.type, value: cargo.value, fromRoom: cargo.fromRoom || null };
    return lsSet(CARGO_KEY, JSON.stringify(rec));
  };
  Courier.cargo = function () {
    var raw = lsGet(CARGO_KEY);
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  };
  Courier.drop = function () { lsRemove(CARGO_KEY); };

  /* canEnter(toId, cargo?): does the carried value type-match the destination's
     accepts? Reads the channel's cargo when none is passed. Type-only — the value
     GUARD (does the seat mesh?) is the math authority's job (cartouche/core.mjs). */
  Courier.canEnter = function (toId, cargo) {
    var room = REGISTRY[toId];
    if (!room) return false;
    var c = cargo || Courier.cargo();
    if (!c) return false;
    return room.accepts.indexOf(c.type) !== -1;
  };

  // browser global (its own handle — never touches ws.js's WS)
  if (root && root.document) root.WSCourier = Courier;

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = Courier; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
