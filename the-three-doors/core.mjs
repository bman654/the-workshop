// === CORE BEGIN ===
// The Three Doors — math core (single source of truth). The Monty Hall problem, made COUNTABLE.
//
// THE SOUL: switching wins 2/3, and the advantage rides ENTIRELY on what the HOST KNEW. We prove
// it the way enumeration proves it — over the EXHAUSTIVE, equally-likely sample space:
//   3 car positions × 3 initial picks  = 9 equally-likely worlds.
// (The host's choice, when he has one, is a further fair branch — it splits a world's weight but
//  never changes WHO holds the car.) Everything DERIVES from N=3 doors; nothing hard-codes 2/3.
//
// Two host policies share ONE game so the player flips knowledge and watches the gap collapse:
//   INFORMED  — opens a door that is (a) not your pick and (b) not the car. Forced when you picked
//               a goat (one legal goat); a fair coin between two goats when you picked the car.
//   IGNORANT  — opens a uniformly random unpicked door. May reveal the CAR; that round is VOID
//               (no goat to switch toward) and excluded from the switch/stay conditioning.
//
// API CONTRACT (page, twin and core all share it — do NOT change the shapes):
//   analyze(policy, n=3)         policy is the STRING 'informed' | 'ignorant'. Returns
//                                { pSwitch, pStay, validMass, cells:[{car,pick,legal,branches,
//                                  verdict, cellSwitchW, cellStayW, cellVoidW}] }.
//   bayesPosteriorOnSwitch(n=3)  the independent Bayes derivation (informed host). { pStay, pSwitch }.
//   playRound(policy, rng, n=3)  one live/seeded round. rng()→[0,1). Returns the played world or
//                                { voided:true,... } for an ignorant car-reveal.
//   monteCarlo(policy, trials, seed, n=3)  seeded mulberry32 tally → { pSwitch, pStay, valid, voided, sw, st }.
//
// DOM-free. Inlined byte-identical into index.html between CORE BEGIN/END, tested by core.test.mjs.

const N = 3;                       // three doors: 0,1,2
const EPS = 1e-12;

// Enumerate the equally-likely sample space: every (car, pick) pair. 9 worlds for N=3.
function worlds(n = N){
  const out = [];
  for (let car = 0; car < n; car++)
    for (let pick = 0; pick < n; pick++)
      out.push({ car, pick });
  return out;
}

// The doors an INFORMED host may legally open: not your pick, not the car.
function informedLegalOpens(car, pick, n = N){
  const out = [];
  for (let d = 0; d < n; d++) if (d !== pick && d !== car) out.push(d);
  return out;
}
// The doors an IGNORANT host may open: any door that is not your pick (he doesn't avoid the car).
function ignorantLegalOpens(pick, n = N){
  const out = [];
  for (let d = 0; d < n; d++) if (d !== pick) out.push(d);
  return out;
}

// The door you END ON if you SWITCH: the single unpicked, unopened door (well-defined for N=3).
function switchTarget(pick, open, n = N){
  for (let d = 0; d < n; d++) if (d !== pick && d !== open) return d;
  return -1;
}

// ── EXACT closed form by enumeration over the sample space. Returns the conditional win
//    probabilities for the given host policy, plus the per-world branch weights (for the grid).
// For INFORMED: every world is valid; a world where the host has 2 legal opens splits into two
//   half-weight branches. P(win|switch)=2/3, P(win|stay)=1/3.
// For IGNORANT: each (car,pick) world spreads its weight uniformly over the host's legal opens;
//   branches that reveal the CAR are VOID. Conditioning on goat-reveals: P(win|switch)=1/2=P(stay).
function analyze(policy, n = N){
  let switchWins = 0, stayWins = 0, valid = 0;   // weighted by world+branch probability
  const W = worlds(n);
  const cellAgg = [];   // per (car,pick) cell: aggregated branch verdict for the grid
  for (const { car, pick } of W){
    const legal = policy === 'informed'
      ? informedLegalOpens(car, pick, n)
      : ignorantLegalOpens(pick, n);
    // world probability = 1/(n*n); each legal open is equally likely within the world.
    const wp = 1 / (n * n);
    const branchP = legal.length ? wp / legal.length : 0;
    let cellSwitchW = 0, cellStayW = 0, cellVoidW = 0;
    const branches = [];
    for (const open of legal){
      const sw = switchTarget(pick, open, n);
      const carRevealed = (open === car);   // only possible under IGNORANT
      if (carRevealed){
        cellVoidW += branchP;
        branches.push({ open, void:true, switchWins:false, stayWins:false });
        continue;                            // VOID — excluded from conditioning
      }
      valid += branchP;
      const sWin = (sw === car);             // switching lands on the car?
      const tWin = (pick === car);           // staying lands on the car?
      if (sWin) { switchWins += branchP; cellSwitchW += branchP; }
      if (tWin) { stayWins  += branchP; cellStayW  += branchP; }
      branches.push({ open, void:false, switchWins:sWin, stayWins:tWin });
    }
    // The cell's headline verdict. A cell can carry void mass (careless host spilling the car) ALONGSIDE
    // a win — so the verdict distinguishes a clean win from a "win-OR-void" world, which is exactly how
    // the lit pattern RESHUFFLES when the host's knowledge is removed:
    //   win-switch    — all valid mass is a switch win (informed off-diagonal)
    //   win-stay      — all valid mass is a stay win   (diagonal, both hosts: never voids)
    //   switch-void   — half the world voids, the rest is a switch win (careless off-diagonal)
    //   split         — equal valid switch & stay mass (degenerate; not reached for n=3)
    const hasVoid = cellVoidW > EPS;
    let verdict;
    if (cellSwitchW > EPS && cellStayW < EPS) verdict = hasVoid ? 'switch-void' : 'win-switch';
    else if (cellStayW > EPS && cellSwitchW < EPS) verdict = hasVoid ? 'stay-void' : 'win-stay';
    else if (cellSwitchW < EPS && cellStayW < EPS) verdict = 'void';
    else verdict = 'split';
    cellAgg.push({ car, pick, legal, branches, verdict, cellSwitchW, cellStayW, cellVoidW });
  }
  return {
    pSwitch: valid > 0 ? switchWins / valid : 0,
    pStay:   valid > 0 ? stayWins   / valid : 0,
    validMass: valid, cells: cellAgg
  };
}

// ── Bayes, the second independent derivation (informed host only). Condition on a CONCRETE
//    scenario: you pick door 0, the informed host opens door 1 (a goat). Only TWO car-hypotheses
//    survive the host's reveal — car behind your pick (0) or car behind the switch target (2);
//    car=1 is impossible (the host would never open the car). Each had equal prior 1/n. The
//    likelihood of opening THAT SPECIFIC door 1 differs:
//      car=0 (your pick): host had 2 goats (1 and 2) to choose → P(open 1) = 1/(n-1) = 1/2
//      car=2 (switch tgt): host is forced to the lone unpicked goat (door 1) → P(open 1) = 1
//    so posterior(stay) = (1/n · 1/(n-1)) / (1/n · 1/(n-1) + 1/n · 1) and switch = its complement.
function bayesPosteriorOnSwitch(n = N){
  const prior = 1 / n;                       // equal prior on each surviving car-hypothesis
  const likeStay   = 1 / (n - 1);            // host opened that door GIVEN your pick is the car
  const likeSwitch = 1;                      // forced reveal GIVEN the car is the switch target (n=3)
  const z = prior * likeStay + prior * likeSwitch;
  const pStay   = (prior * likeStay)   / z;
  const pSwitch = (prior * likeSwitch) / z;
  return { pStay, pSwitch };
}

// ── A SEEDED Monte-Carlo whose tally the gauges show; asserted to approach the closed form.
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Play ONE round for a policy with a given RNG. Returns the full played world (for the grid + doors)
// or {voided:true} for an ignorant car-reveal.
function playRound(policy, rng, n = N){
  const car  = Math.floor(rng() * n);
  const pick = Math.floor(rng() * n);
  const legal = policy === 'informed'
    ? informedLegalOpens(car, pick, n)
    : ignorantLegalOpens(pick, n);
  const open = legal[Math.floor(rng() * legal.length)];
  if (policy === 'ignorant' && open === car)
    return { voided:true, car, pick, open };
  const sw = switchTarget(pick, open, n);
  return {
    voided:false, car, pick, open, switchTo:sw,
    switchWins: sw === car, stayWins: pick === car
  };
}
function monteCarlo(policy, trials, seed, n = N){
  const rng = mulberry32(seed);
  let sw = 0, st = 0, valid = 0, voided = 0;
  for (let i = 0; i < trials; i++){
    const r = playRound(policy, rng, n);
    if (r.voided){ voided++; continue; }
    valid++;
    if (r.switchWins) sw++;
    if (r.stayWins) st++;
  }
  return { pSwitch: valid ? sw/valid : 0, pStay: valid ? st/valid : 0, valid, voided, sw, st };
}

// ─────────────────────── SELF-TEST (the bench proves its own claim) ───────────────────────
// Lives INSIDE the core so the page pill and the Node twin run the IDENTICAL checks (no drift).
function runSelfTest(){
  const checks = [];
  const ck = (name, ok) => checks.push({ name, ok: !!ok });
  const near = (a, b, e = EPS) => Math.abs(a - b) <= e;

  // (1a) Enumeration: informed host → exactly 2/3 switch, 1/3 stay.
  const inf = analyze('informed');
  ck('informed: P(win|switch)=2/3 exact', near(inf.pSwitch, 2/3));
  ck('informed: P(win|stay)=1/3 exact',  near(inf.pStay, 1/3));
  ck('informed: probabilities sum to 1', near(inf.pSwitch + inf.pStay, 1));
  ck('informed: all 9 worlds valid (validMass=1, no voids)', near(inf.validMass, 1));
  const swCells = inf.cells.filter(c => c.verdict === 'win-switch').length;
  const stCells = inf.cells.filter(c => c.verdict === 'win-stay').length;
  ck('informed: 6 of 9 cells are win-switch (off-diagonal)', swCells === 6);
  ck('informed: 3 of 9 cells are win-stay (the diagonal)', stCells === 3);

  // (1b) Bayes agrees with enumeration, independently.
  const bay = bayesPosteriorOnSwitch();
  ck('Bayes posterior on switch = 2/3', near(bay.pSwitch, 2/3));
  ck('Bayes posterior on stay = 1/3',  near(bay.pStay, 1/3));
  ck('Bayes == enumeration (switch)', near(bay.pSwitch, inf.pSwitch));

  // (2) SEEDED Monte-Carlo approaches the closed form within ε — the SAME play the gauges show.
  const mcI = monteCarlo('informed', 60000, 0x3D0025);
  ck('MC informed switch ≈ 2/3 (±0.01)', near(mcI.pSwitch, 2/3, 0.01));
  ck('MC informed stay ≈ 1/3 (±0.01)',  near(mcI.pStay, 1/3, 0.01));

  // (3) NEG-CONTROL: ignorant host, conditioned on goat-reveals → 1/2, advantage GONE; ~1/3 voided.
  const ign = analyze('ignorant');
  ck('ignorant: P(win|switch)=1/2 exact', near(ign.pSwitch, 1/2));
  ck('ignorant: P(win|stay)=1/2 exact',  near(ign.pStay, 1/2));
  ck('ignorant: switch advantage VANISHES', near(ign.pSwitch - ign.pStay, 0));
  ck('ignorant: validMass=2/3 (one-third voided by car-reveals)', near(ign.validMass, 2/3));
  const mcG = monteCarlo('ignorant', 60000, 0x9A11FF);
  ck('MC ignorant switch ≈ 1/2 (±0.01)', near(mcG.pSwitch, 1/2, 0.01));
  ck('MC ignorant voided fraction ≈ 1/3 (±0.01)', near(mcG.voided/(mcG.valid+mcG.voided), 1/3, 0.01));

  // (4) Structural: switchTarget is the unique third door.
  ck('switchTarget(0,1)=2', switchTarget(0,1) === 2);
  ck('switchTarget(2,0)=1', switchTarget(2,0) === 1);

  const passed = checks.filter(c => c.ok).length, total = checks.length;
  return { ok: passed === total, passed, total, checks };
}

const CORE = {
  N, EPS, worlds, informedLegalOpens, ignorantLegalOpens, switchTarget,
  analyze, bayesPosteriorOnSwitch, mulberry32, playRound, monteCarlo, runSelfTest
};
// === CORE END ===

export {
  N, EPS, worlds, informedLegalOpens, ignorantLegalOpens, switchTarget,
  analyze, bayesPosteriorOnSwitch, mulberry32, playRound, monteCarlo, runSelfTest, CORE
};
