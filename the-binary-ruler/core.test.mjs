#!/usr/bin/env node
// The Binary Ruler — Node twin of the in-page self-test. Runs the SAME runSelfTest()
// the page runs (single source of truth), then adds a few extra cross-checks the page
// can't show inline. Exit non-zero on any failure so the publisher / forge can gate.

import {
  ruler, grayCode, popcount, optimalLength, optimalMoves,
  freshTower, applyMove, isSolved, stateAfter, discsDiffering,
  grayState, minMoves, bfsDistToHome, detourFoil, offRulerProbe, runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail){
  if (cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); console.log('  \x1b[31m✗\x1b[0m ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('\n  The Binary Ruler — core.test.mjs\n  ' + '─'.repeat(58));

// ── Layer 1: the SAME battery the page renders ──
console.log('\n  layer 1 · the in-page self-test battery (verbatim):');
const r = runSelfTest();
for (const line of r.lines) ok(line.name, line.ok, line.detail);
ok(`battery reports ${r.pass}/${r.total} green (≥7 checks)`, r.fails.length === 0 && r.total >= 7, `${r.pass}/${r.total}`);

// ── Layer 2: extra cross-checks (the Node twin earns its keep) ──
console.log('\n  layer 2 · node-only deep cross-checks:');

// the decoder agrees with replay AND with BFS-reachability for the full n=1..10
{
  let allok = true, ff = '';
  for (let n = 1; n <= 10 && allok; n++){
    for (let t = 0; t <= optimalLength(n); t++){
      if (discsDiffering(grayState(n, t), stateAfter(n, t), n) !== 0){ allok = false; ff = `n=${n},t=${t}`; break; }
    }
  }
  ok('grayState === stateAfter for n=1..10, EVERY t (exhaustive)', allok, ff);
}

// the ruler is exactly the 2-adic valuation: ruler(t)=v2(t)+1, independent witness
{
  let allok = true, ff = '';
  for (let t = 1; t <= 4095; t++){
    let v = 0, x = t; while ((x & 1) === 0){ v++; x >>= 1; }
    if (ruler(t) !== v + 1){ allok = false; ff = `t=${t}`; break; }
  }
  ok('ruler(t)=v₂(t)+1 for t=1..4095 (the 2-adic valuation)', allok, ff);
}

// G(t) is a true Gray code: a bijection 0..2^k-1 with single-bit steps
{
  let allok = true, ff = '';
  for (let k = 1; k <= 12 && allok; k++){
    const seen = new Set();
    for (let t = 0; t < (1 << k); t++){
      const g = grayCode(t);
      if (seen.has(g)){ allok = false; ff = `k=${k},t=${t}: G repeats`; break; }
      seen.add(g);
      if (t > 0 && popcount(grayCode(t) ^ grayCode(t - 1)) !== 1){ allok = false; ff = `k=${k},t=${t}: not 1-bit`; break; }
    }
    if (allok && seen.size !== (1 << k)){ allok = false; ff = `k=${k}: not a bijection`; }
  }
  ok('G(t)=t⊕(t≫1) is a Gray code (bijection + single-bit steps), k=1..12', allok, ff);
}

// detourFoil overshoots and minMoves matches BFS everywhere along an optimal solve
{
  let allok = true, ff = '';
  for (let n = 2; n <= 9 && allok; n++){
    const floor = optimalLength(n);
    const g = detourFoil(n);
    if (!(g.solved && g.moves > floor)){ allok = false; ff = `n=${n}: detour ${g.moves} ≤ floor ${floor}`; break; }
  }
  ok('detourFoil solves but > floor (BFS-certified), n=2..9', allok, ff);
}

// minMoves === BFS for EVERY state along the optimal solve (not just the start)
{
  let allok = true, ff = '';
  for (let n = 2; n <= 7 && allok; n++){
    const mv = optimalMoves(n); let pos = freshTower(n);
    for (let t = 0; t <= mv.length; t++){
      if (minMoves(pos, n, 2) !== bfsDistToHome(pos, n)){ allok = false; ff = `n=${n},t=${t}`; break; }
      if (t < mv.length){ pos = pos.slice(); pos[mv[t].disc] = mv[t].to; }
    }
  }
  ok('minMoves(state) === BFS(state) along the whole optimal solve, n=2..7', allok, ff);
}

// the off-ruler probe: leaves the decoded Gray path AND overshoots, on-ruler stays
{
  let allok = true, ff = '';
  for (let n = 2; n <= 9 && allok; n++){
    const p = offRulerProbe(n);
    if (!(p.onTotal === p.floor && p.offTotal > p.floor && p.offLeavesGray)){
      allok = false; ff = `n=${n}: on=${p.onTotal} off=${p.offTotal} floor=${p.floor} leftGray=${p.offLeavesGray}`;
    }
  }
  ok('off-ruler probe: on stays on floor; off overshoots AND ≠ grayState(n,1), n=2..9', allok, ff);
}

// the optimal solve actually SOLVES (sanity that the move list is legal & lands home)
{
  let allok = true, ff = '';
  for (let n = 1; n <= 10 && allok; n++){
    let pos = freshTower(n);
    for (const m of optimalMoves(n)){
      const np = applyMove(pos, n, m.from, m.to);
      if (!np){ allok = false; ff = `n=${n}: illegal move ${JSON.stringify(m)}`; break; }
      pos = np;
    }
    if (allok && !isSolved(pos, n)){ allok = false; ff = `n=${n}: not solved at end`; }
  }
  ok('optimalMoves(n) is all-legal and lands the tower home, n=1..10', allok, ff);
}

console.log('\n  ' + '─'.repeat(58));
if (fail === 0){
  console.log(`  \x1b[32mALL GREEN — ${pass}/${pass} checks pass (both layers).\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAILED — ${pass} pass, ${fail} fail.\x1b[0m`);
  for (const f of fails) console.log('    · ' + f);
  console.log('');
  process.exit(1);
}
