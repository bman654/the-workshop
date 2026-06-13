#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   patience.test.cjs — the headless self-test for the Patience engine.

   Requires the UNSTRIPPED engine (the same module forge inlines into the page),
   runs the SAME runSelfTest() core the page's green chip calls, and exits
   non-zero on any failure. This is the proof that ships: a green chip in the
   browser is byte-for-byte the same computation as `node … .cjs`.

   The headline claim: the dealer ships ONLY provably-winnable deals — proven
   here by re-dealing a battery through the rejection-sampling dealer and
   replaying each recorded solution move-by-move to a win.

   Run:  node tools/patience/patience.test.cjs
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const Patience = require(path.join(__dirname, 'patience.js'));

function main() {
  const t0 = Date.now();
  const variant = Patience.makeVariant(); // compact FreeCell: 28 cards, 3 free cells, 6 columns
  const res = Patience.runSelfTest({ variant: variant, battery: 40 });
  const ms = Date.now() - t0;

  for (const c of res.checks) {
    const mark = c.pass ? '  \x1b[32m✓\x1b[0m' : '  \x1b[31m✗ FAIL\x1b[0m';
    console.log(mark + ' ' + c.name + (c.detail ? '  \x1b[2m— ' + c.detail + '\x1b[0m' : ''));
  }

  // ── a few extra cross-cutting assertions beyond runSelfTest's battery ──
  const extra = [];

  // (a) a fresh, FULL-DECK FreeCell (52 cards) is also handled by the same engine
  // — proves the variant-as-data design and the solver generalise. Smaller budget
  // sweep is fine; we just confirm the dealer can produce one winnable 52-card deal.
  {
    const full = Patience.makeVariant({ ranks: 13, free: 4, cols: 8 });
    const d = Patience.dealWinnable(full, 20260613, { budget: 400000, maxTries: 60 });
    let ok = false, detail = 'dealer found no winnable 52-card deal within budget';
    if (d) {
      const rep = Patience.replayLine(full, d.deal, d.solution);
      ok = rep.ok && rep.won;
      detail = ok
        ? 'standard 52-card FreeCell deal solved + replayed (' + d.nodes + ' nodes, ' + d.solution.length + ' moves, seed ' + d.seed + ')'
        : 'recorded line failed to replay to a win';
    }
    extra.push({ name: 'generality: the SAME engine deals + solves a full 52-card FreeCell', pass: ok, detail: detail });
  }

  // (b) hint() returns a move that is on the recorded line and legal from the deal
  {
    const d = res.deals[0];
    const mv = Patience.hint(variant, d.deal, d.solution);
    const legal = Patience.legalMoves(variant, d.deal);
    const isLegal = !!mv && legal.some(function (m) { return m.from === mv.from && m.to === mv.to && m.card === mv.card; });
    extra.push({
      name: 'hint(): suggests a real, legal next move from the deal',
      pass: isLegal,
      detail: isLegal ? (Patience.cardLabel(mv.card) + ' : ' + mv.from + '→' + mv.to) : 'hint was null or illegal'
    });
  }

  // (c) linePlayer drives a full auto-solve replay to a win (the "watch it solve" path)
  {
    const d = res.deals[1];
    const play = Patience.linePlayer(d.solution);
    let s = Patience.cloneState(d.deal);
    let steps = 0, ok = true;
    while (!Patience.isWin(variant, s) && steps < d.solution.length + 5) {
      const mv = play(variant, s);
      if (!mv) { ok = false; break; }
      s = Patience.applyMove(variant, s, mv);
      steps++;
    }
    const won = Patience.isWin(variant, s);
    extra.push({
      name: 'linePlayer(): auto-solve replay drives the deal to a win',
      pass: ok && won,
      detail: (ok && won) ? ('played ' + steps + ' moves to a win') : 'player diverged or did not reach a win'
    });
  }

  // (d) determinism of the dealer itself: same seed → same kept deal + solution
  {
    const a = Patience.dealWinnable(variant, 555, { budget: variant ? Patience.DEFAULT_BUDGET : 0 });
    const b = Patience.dealWinnable(variant, 555, {});
    const sameSeed = a && b && a.seed === b.seed;
    const sameLine = a && b && a.solution.length === b.solution.length &&
      a.solution.every(function (m, i) { return m.from === b.solution[i].from && m.to === b.solution[i].to && m.card === b.solution[i].card; });
    extra.push({
      name: 'dealer determinism: same seed → same kept deal + identical solution',
      pass: !!(sameSeed && sameLine),
      detail: sameSeed ? ('kept seed ' + a.seed + ', ' + a.solution.length + ' moves, both runs identical') : 'dealer non-deterministic'
    });
  }

  // (e) illegal moves are REJECTED by applyMove (no illegal state reachable)
  {
    const d = res.deals[0];
    let threwBad = false;
    try {
      // fabricate an obviously illegal move: send a deep (buried) card to foundation
      const buried = d.deal.cols[0][0]; // bottom card of column 0 (not a top)
      Patience.applyMove(variant, d.deal, { from: 'c0', to: 'F', card: buried });
    } catch (e) { threwBad = /illegal/.test(e.message); }
    extra.push({ name: 'applyMove: rejects an illegal move (throws)', pass: threwBad, detail: threwBad ? 'illegal move correctly thrown' : 'illegal move was NOT rejected' });
  }

  if (extra.length) {
    console.log('\n── cross-cutting ──');
    for (const c of extra) {
      const mark = c.pass ? '  \x1b[32m✓\x1b[0m' : '  \x1b[31m✗ FAIL\x1b[0m';
      console.log(mark + ' ' + c.name + (c.detail ? '  \x1b[2m— ' + c.detail + '\x1b[0m' : ''));
    }
  }

  // The CORE proof is res.checks (the SAME runSelfTest the page's green chip runs,
  // so the chip's "N/N" == this core count). The cross-cutting `extra` checks are
  // bonus coverage that only the Node harness exercises.
  let corePass = 0;
  for (const c of res.checks) if (c.pass) corePass++;
  console.log('\n  \x1b[2m(core runSelfTest — the same proof the page chip shows: ' + corePass + '/' + res.checks.length + ')\x1b[0m');

  const allChecks = res.checks.concat(extra);
  let pass = 0;
  for (const c of allChecks) if (c.pass) pass++;
  const total = allChecks.length;

  console.log('\n' + (pass === total
    ? '\x1b[32m═══ ' + pass + '/' + total + ' checks PASS ═══\x1b[0m  (' + ms + 'ms)  \x1b[2m[' + corePass + '/' + res.checks.length + ' core + ' + (extra.length) + ' cross-cutting]\x1b[0m'
    : '\x1b[31m═══ ' + pass + '/' + total + ' — ' + (total - pass) + ' FAILED ═══\x1b[0m  (' + ms + 'ms)'));

  process.exit(pass === total ? 0 : 1);
}

main();
