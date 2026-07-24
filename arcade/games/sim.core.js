/* ═══════════════════════════════════════════════════════════════════════════
   sim.core.js — the DOM-FREE board + reveal STATE core for SIM (the game that
   can't be drawn). The honest-twin seam: this is the ONLY place game state
   mutates, and it is requireable by Node AND forge-inlined verbatim into the
   page — so the in-page chip and the headless Node twin (sim.test.cjs) assert
   the IDENTICAL payoff-liveness path. NOTHING here touches canvas / pointer /
   audio / document — the page owns pixels; this owns truth.

   It sits on top of the verified game-def GAME_sim (tools/game/games/sim.js):
     • ONE edge index — every layer speaks GAME_sim's integer edge index 0..14
       (EDGES / EIDX). There is no "i-j" string key as a data key.
     • Colour is the def's fixed player→colour binding (P1=Red, P2=Blue). The
       DISPLAY remap (human→cyan, machine→rose) lives in the page, not here.

   ctx = {
     edgeColor : [15] of 0|'R'|'B'   — the live colouring, index-parallel to EDGES
     turn      : 0|1                  — side to move (0=Red first), def semantics
     humanSeat : 0|1                  — which def-player the human is (default 1=Blue=P2)
     state     : 'playing'|'over'     — the game phase
     reveal    : {fired,triangle,losingColor,outcome}
     edgeFx    : [15] of {pulsing}    — closing-triangle edges pulse on reveal
     studFx    : [6]  of {glow}       — the three triangle studs glow on reveal
     lastEdge, lastMover              — the move that just committed
   }
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  // dual-use: the browser has GAME_sim as a global (forge inlines sim.js first,
  // stripping its guard); Node requires the def directly.
  var GAME = (root && root.GAME_sim) ||
             (typeof GAME_sim !== 'undefined' ? GAME_sim : null) ||
             (typeof require !== 'undefined' ? require('../../tools/game/games/sim.js') : null);

  var NE = 15, NV = 6;

  // ── context construction ───────────────────────────────────────────────────
  function createCtx(opts) {
    opts = opts || {};
    var edgeColor = new Array(NE);
    for (var e = 0; e < NE; e++) edgeColor[e] = 0;
    var edgeFx = new Array(NE);
    for (var e2 = 0; e2 < NE; e2++) edgeFx[e2] = { pulsing: false };
    var studFx = new Array(NV);
    for (var v = 0; v < NV; v++) studFx[v] = { glow: false };
    return {
      edgeColor: edgeColor,
      turn: 0,                                   // Red (P1) always moves first
      humanSeat: (opts.humanSeat === 0 ? 0 : 1), // default P2 = Blue = the winning seat
      state: 'playing',
      reveal: { fired: false, triangle: null, losingColor: null, outcome: null },
      edgeFx: edgeFx,
      studFx: studFx,
      lastEdge: -1,
      lastMover: -1
    };
  }
  // The core is DOM-free, so a "headless" ctx is just a ctx — the name marks the
  // caller's intent (a Node twin, a liveness harness) with no behavioural split.
  function createHeadlessCtx(opts) { return createCtx(opts); }

  // reconstruct the def's state object { edges, turn } from the live ctx.
  function defState(ctx) { return { edges: ctx.edgeColor.slice(), turn: ctx.turn }; }

  // the def-colour of a seat (0→'R', 1→'B')
  function seatColor(seat) { return GAME.players[seat]; }

  // ── the ONE state-mutation entry ────────────────────────────────────────────
  // Validate (open + not-over), colour the edge in the MOVER's def-colour, flip
  // the turn, then let SimReveal decide whether this move just closed a triangle.
  // Called for EVERY committed move — human AND machine — since either can close
  // the fatal triangle. Returns true iff the move was accepted.
  function commitMove(ctx, e) {
    if (ctx.state === 'over') return false;
    if (e < 0 || e >= NE || ctx.edgeColor[e] !== 0) return false;   // not an open chord
    var mover = ctx.turn;
    ctx.edgeColor[e] = seatColor(mover);                            // colour bound to the mover
    ctx.lastEdge = e;
    ctx.lastMover = mover;
    ctx.turn ^= 1;
    SimReveal.onMove(ctx, e);
    return true;
  }

  // ── which triangle just closed (the flash target) ───────────────────────────
  // Among the 20 triangles, the ONE that contains the last edge AND is now
  // monochromatic. Shares hasMonoTri semantics with the def's terminal(), so the
  // two can never disagree about game-over. Returns [e0,e1,e2] or null.
  function findClosingTriangle(ctx, lastEdge) {
    var TRIS = GAME.TRIS, ec = ctx.edgeColor;
    for (var t = 0; t < TRIS.length; t++) {
      var tri = TRIS[t];
      if (tri[0] !== lastEdge && tri[1] !== lastEdge && tri[2] !== lastEdge) continue;
      var c0 = ec[tri[0]];
      if (c0 !== 0 && c0 === ec[tri[1]] && c0 === ec[tri[2]]) return [tri[0], tri[1], tri[2]];
    }
    return null;
  }

  // the three studs (vertices) spanned by a triangle's three edges.
  function triangleStuds(tri) {
    var seen = {}, out = [];
    for (var i = 0; i < 3; i++) {
      var uv = GAME.EDGES[tri[i]];
      if (!seen[uv[0]]) { seen[uv[0]] = 1; out.push(uv[0]); }
      if (!seen[uv[1]]) { seen[uv[1]] = 1; out.push(uv[1]); }
    }
    return out;
  }

  // ── the reveal (E2's state block — no DOM; the page draws the banner) ────────
  var SimReveal = {
    onMove: function (ctx, lastEdge) {
      var tri = findClosingTriangle(ctx, lastEdge);
      if (!tri) return;                              // no triangle closed → play continues
      // the just-mover completed their OWN colour → that player LOSES (misère).
      var losingColor = ctx.edgeColor[tri[0]];       // the mono colour of the closed triangle
      var humanColor = seatColor(ctx.humanSeat);
      var humanLost = (losingColor === humanColor);
      ctx.state = 'over';
      ctx.reveal = {
        fired: true,
        triangle: tri,
        losingColor: losingColor,
        outcome: humanLost ? 'LOSS' : 'WIN'          // from the HUMAN's POV
      };
      for (var i = 0; i < 3; i++) ctx.edgeFx[tri[i]].pulsing = true;
      var studs = triangleStuds(tri);
      for (var j = 0; j < studs.length; j++) ctx.studFx[studs[j]].glow = true;
    }
  };

  // ── near-triangle POISON geometry (pure 6-node, def-independent) ─────────────
  // For a colour, an OPEN chord is "poison" if claiming it in that colour would
  // complete a same-colour triangle (a self-mate). Returns the poison chords with
  // their ghost-triangle + the two already-owned legs, plus SAFE = open − poison.
  function threats(ctx, colour) {
    var ec = ctx.edgeColor, TRIS = GAME.TRIS, poison = [], open = 0;
    for (var e = 0; e < NE; e++) {
      if (ec[e] !== 0) { continue; }
      open++;
      for (var t = 0; t < TRIS.length; t++) {
        var tri = TRIS[t];
        if (tri[0] !== e && tri[1] !== e && tri[2] !== e) continue;
        var a = tri[0] === e ? tri[1] : tri[0];
        var b = tri[2] === e ? tri[1] : tri[2];
        if (ec[a] === colour && ec[b] === colour) { poison.push({ edge: e, tri: [tri[0], tri[1], tri[2]], legs: [a, b] }); break; }
      }
    }
    return { open: open, safe: open - poison.length, poison: poison };
  }

  // ── the perfect machine over the solved table ───────────────────────────────
  function machineMove(ctx, sol) { return GAME.perfectMove(defState(ctx), sol); }

  // convenience: is the reconstructed def-state terminal? (agrees with reveal.fired)
  function isTerminal(ctx) { return GAME.terminal(defState(ctx)).over; }

  var SimCore = {
    GAME: GAME,
    createCtx: createCtx,
    createHeadlessCtx: createHeadlessCtx,
    commitMove: commitMove,
    findClosingTriangle: findClosingTriangle,
    triangleStuds: triangleStuds,
    SimReveal: SimReveal,
    threats: threats,
    machineMove: machineMove,
    defState: defState,
    seatColor: seatColor,
    isTerminal: isTerminal
  };

  // browser globals (forge-inlined): attach both the namespace and the bare names
  // the page uses, mirroring the def's dual-use idiom.
  if (root) {
    root.SimCore = SimCore;
    root.createCtx = createCtx; root.createHeadlessCtx = createHeadlessCtx;
    root.commitMove = commitMove; root.findClosingTriangle = findClosingTriangle;
    root.SimReveal = SimReveal; root.threats = threats; root.machineMove = machineMove;
    root.triangleStuds = triangleStuds; root.simDefState = defState; root.seatColor = seatColor;
  }

  // dual-use module guard (forge strips exactly this braced single line)
  if (typeof module !== 'undefined' && module.exports) { module.exports = SimCore; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
