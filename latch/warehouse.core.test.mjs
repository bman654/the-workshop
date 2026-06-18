// Node twin for The Warehouse Sokoban core. Zero-dep. Run: `node warehouse.core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into warehouse.html, so the
// page's self-test chip and this test can never drift — both run runChecks() below and
// MUST report the same pass/total. Asserts the conditional math claims:
//   A POSITIVE — an authored board is winnable in exactly POS_PUSHES pushes.
//   B NEG-CONTROL — an authored board is provably UNwinnable (BFS exhausts, len -1).
//   C VACUOUS-CHECKER REFUTATION — a checker that always says "solvable" would pass A's
//     shape but FAILS B, proving B does real work.
//   D DEADLOCK SOUNDNESS — over the full reachable space of POS ∪ NEG1, every state the
//     detector flags as dead is TRULY dead (BFS-from-it exhausts): falsePositives === 0,
//     AND the detector fires at least once (flaggedCount > 0) so it isn't vacuously empty.
//   E PUSH-ONLY INVARIANT — every successor moves exactly one crate exactly one cell; no
//     pull edge is ever generated.
//   F WINNABLE-LEVELS LENGTHS — solve(L1)=2, solve(L2)=4, solve(L3)=5 (the numbers the
//     player is handed are the proven push-optima).
import {
  parseBoard, region, pushSucc, solve, isDeadlocked, deadInfo, step, showPath, won,
  LEVELS, POS_BOARD, POS_PUSHES, NEG_BOARD
} from './warehouse.core.mjs';

// the authored boards, all sourced from the core's single LEVELS table (so there
// is exactly ONE place the board literals live — the core — and this block inlines
// cleanly into the page without re-declaring them):
//   LEVELS = [L1 'Single Crate', L2 'Two Pads', L3 'Around the Corner', NEG2 'Sealed Pad']
//   NEG_BOARD = NEG1 'Frozen Corner'
const wL1 = LEVELS[0].rows, wL2 = LEVELS[1].rows, wL3 = LEVELS[2].rows;
const wNEG1 = NEG_BOARD;                                  // 'Frozen Corner'
const wNEG2 = LEVELS[3].rows;                             // 'Sealed Pad'

// ── shared helpers (used by both the page chip and this twin) ────────────────
// canonical key matching the core's internal scheme (player normalized to region min)
function regKey(reg, crates) { let mn = Infinity; for (const c of reg) if (c < mn) mn = c; return mn + '|' + crates.join(','); }
// full enumeration of reachable push-states (deadlock pruning OFF — we want ALL of them)
function reachable(rows) {
  const b = parseBoard(rows);
  const reg0 = region(b, b.start.player, b.start.crates);
  const seen = new Map([[regKey(reg0, b.start.crates), { player: b.start.player, crates: b.start.crates }]]);
  const q = [...seen.keys()]; let head = 0;
  while (head < q.length) {
    const st = seen.get(q[head++]);
    const reg = region(b, st.player, st.crates);
    for (const mv of pushSucc(b, reg, st.crates)) {
      const nk = regKey(region(b, mv.player, mv.crates), mv.crates);
      if (seen.has(nk)) continue;
      seen.set(nk, { player: mv.player, crates: mv.crates });
      q.push(nk);
    }
  }
  return { b, states: [...seen.values()] };
}
// solve starting from an arbitrary mid-game state (deadlock OFF for the soundness proof)
function solveFrom(b, st) {
  const bb = { W: b.W, H: b.H, walls: b.walls, goals: b.goals, start: { player: st.player, crates: st.crates.slice() } };
  return solve(bb, false);
}

// ── the six checks (the page chip runs this IDENTICAL function) ──────────────
function runChecks() {
  const checks = [];

  // A — POSITIVE: the authored positive board is winnable in exactly POS_PUSHES.
  {
    const r = solve(parseBoard(POS_BOARD), true);
    const pass = r.exhausted === false && r.len === POS_PUSHES;
    checks.push({ name: 'positive board winnable in ' + POS_PUSHES + ' pushes', pass, detail: 'len=' + r.len + ' exhausted=' + r.exhausted });
  }

  // B — NEG-CONTROL (load-bearing): the authored neg board is provably unwinnable.
  {
    const r = solve(parseBoard(wNEG1), true);
    const pass = r.exhausted === true && r.len === -1;
    checks.push({ name: 'neg-control provably unwinnable (BFS exhausts)', pass, detail: 'len=' + r.len + ' exhausted=' + r.exhausted + ' expanded=' + r.expanded });
  }

  // C — VACUOUS-CHECKER REFUTATION: a checker that always claims solvable would pass A's
  // shape (it would "agree" the positive board is solvable) but FAILS B — proving B does
  // real work and isn't satisfied by any trivial checker.
  {
    const alwaysSolvable = () => ({ len: 0, exhausted: false });
    const passesPosShape = alwaysSolvable(parseBoard(POS_BOARD)).exhausted === false;
    const failsNeg = alwaysSolvable(parseBoard(wNEG1)).exhausted !== true;   // it never reports exhausted
    const realResultOnNeg = solve(parseBoard(wNEG1), true).exhausted === true; // the REAL solver does
    const pass = passesPosShape && failsNeg && realResultOnNeg;
    checks.push({ name: 'vacuous "always solvable" checker fails the neg-control', pass, detail: 'vacuous-passes-pos=' + passesPosShape + ' vacuous-misses-neg=' + failsNeg + ' real-catches-neg=' + realResultOnNeg });
  }

  // D — DEADLOCK SOUNDNESS: over reachable(POS) ∪ reachable(NEG1), every flagged-dead state
  // is truly dead (solveFrom exhausts); falsePositives MUST be 0, AND flaggedCount > 0.
  {
    let total = 0, flagged = 0, falsePos = 0;
    for (const rows of [POS_BOARD, wNEG1]) {
      const { b, states } = reachable(rows);
      for (const st of states) {
        total++;
        if (isDeadlocked(b, st.crates)) {
          flagged++;
          if (!solveFrom(b, st).exhausted) falsePos++;   // flagged dead but actually winnable ⇒ UNSOUND
        }
      }
    }
    const pass = falsePos === 0 && flagged > 0;
    checks.push({ name: 'deadlock detector sound (flagged ⊆ truly-dead, and non-empty)', pass, detail: total + ' states, ' + flagged + ' flagged-dead, ' + falsePos + ' false-positive(s)' });
  }

  // E — PUSH-ONLY INVARIANT: sweep pushSucc over reachable states of L1,L2,L3 — every
  // successor moves exactly one crate exactly one cell, and the porter lands on the crate's
  // OLD cell (a pull edge would put the porter on the far side / move the crate toward it).
  {
    let bad = 0, swept = 0;
    for (const rows of [wL1, wL2, wL3]) {
      const { b, states } = reachable(rows);
      for (const st of states) {
        const reg = region(b, st.player, st.crates);
        for (const mv of pushSucc(b, reg, st.crates)) {
          swept++;
          // diff the crate multisets: exactly one cell leaves, exactly one arrives.
          const before = new Set(st.crates), after = new Set(mv.crates);
          let removed = 0, added = 0, movedFrom = -1, movedTo = -1;
          for (const c of st.crates) if (!after.has(c)) { removed++; movedFrom = c; }
          for (const c of mv.crates) if (!before.has(c)) { added++; movedTo = c; }
          if (removed !== 1 || added !== 1) { bad++; continue; }
          // the moved crate travelled exactly one orthogonal cell
          const dx = Math.abs((movedTo % b.W) - (movedFrom % b.W));
          const dy = Math.abs(((movedTo / b.W) | 0) - ((movedFrom / b.W) | 0));
          if (dx + dy !== 1) { bad++; continue; }
          // PUSH (not pull): the porter ends on the crate's OLD cell.
          if (mv.player !== movedFrom) { bad++; continue; }
        }
      }
    }
    checks.push({ name: 'push-only: every successor pushes one crate one cell (no pull edge)', pass: bad === 0, detail: swept + ' successors swept, ' + bad + ' violation(s)' });
  }

  // F — WINNABLE-LEVELS LENGTHS: the three winnable levels solve at their authored optima.
  {
    const l1 = solve(parseBoard(wL1)).len, l2 = solve(parseBoard(wL2)).len, l3 = solve(parseBoard(wL3)).len;
    const pass = l1 === 2 && l2 === 4 && l3 === 5;
    checks.push({ name: 'winnable levels solve at proven optima (2 · 4 · 5)', pass, detail: 'L1=' + l1 + ' L2=' + l2 + ' L3=' + l3 });
  }

  const passed = checks.filter(c => c.pass).length;
  return { passed, total: checks.length, allPass: passed === checks.length, checks };
}

// ── run + report (Node side) ─────────────────────────────────────────────────
const res = runChecks();
const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
console.log('The Warehouse — warehouse.core.test.mjs');
res.checks.forEach((c, k) => {
  console.log((c.pass ? '  ✓ ' : '  ✗ ') + labels[k] + ' — ' + c.name + ' (' + c.detail + ')');
});
console.log((res.allPass ? '  ✓ ' : '  ✗ ') + res.passed + '/' + res.total + ' checks pass');
if (!res.allPass) process.exit(1);

export { runChecks };
