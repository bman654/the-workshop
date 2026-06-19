// The Fusion Ladder — logic core (the valley a star spends its life falling into).
//
// THE WHOLE POINT: fusion is a climb DOWNHILL. Two light nuclei fuse, the product is more
// tightly BOUND per nucleon, and the difference is paid out as energy — that is what lights a
// star. But the binding-energy-per-nucleon curve is not a slope; it is a VALLEY with a FLOOR.
// Climb (fuse) toward the floor and every rung PAYS. Reach the floor — the iron group — and
// there is nowhere lower to fuse to. Try to keep going and the sign FLIPS: the next rung COSTS
// energy instead of giving it. That single sign-flip is why a massive star's furnace stalls at
// iron, and the stall is what lights the implosion the companion bench (the Scales) begins.
//
// We draw the curve as an inverted VALLEY so the most-bound nucleus is the LOWEST point — the
// floor you fall to. (A textbook plots B/A as a PEAK; we deliberately invert it so "the floor is
// where you end up" is literal. The lede on the page frames this up front so the missing peak
// doesn't confuse.)
//
// THE EXACT CLAIM IS THE STRUCTURE, NOT A KNIFE-EDGE NUMBER:
//   (1) every sub-iron rung RELEASES energy (rungYield > 0 below the floor);
//   (2) the sign FLIPS at the iron group — every rung at/above the floor COSTS (rungYield < 0);
//   (3) binding-energy-per-nucleon PEAKS at the iron group (a monotone climb to the floor, then
//       a monotone fall past it);
//   (4) the cumulative BANK of released energy climbs then falls, and the per-rung yield IS the
//       bank's delta (energy is conserved — the bank is the integral of the yields);
//   (5) a furnace that ignores the sign (the `freeFusionPastIron` neg-control) keeps "paying"
//       past iron and provably DISAGREES with the real core there — so claim (2) is not vacuous.
//
// WHY THE NUMBERS ARE HONEST:
//   · The B/A values are AME2020 / NNDC-class binding-energy-per-nucleon figures in MeV/nucleon.
//   · Ni-62 is the TRUE maximum (B/A ≈ 8.795 MeV/nucleon) — the single most tightly-bound
//     nuclide. Fe-56 (≈ 8.790) is the CULTURAL "iron peak" — the last honest rung of stellar
//     fusion and the nuclide people mean by "the iron peak". The engraving names BOTH and carries
//     an "≈" so neither is oversold: the claim is "the iron group is the floor", not "8.79 exactly".
//   · The currency is PARCEL·Δ(B/A) — energy per a FIXED 56-nucleon parcel — NOT a total-binding
//     difference. Fixing the nucleon count is what makes sign(Q) === sign(ΔB/A) true BY
//     CONSTRUCTION; a total-binding Q would not flip sign at iron (the alpha-capture trap).
//
// SOURCING (anti-drift, encoded in core.test.mjs): the page inlines this core byte-for-byte
// between the FUSION-LADDER CORE sentinels; core.test.mjs byte-parity-checks the inlined copy in
// index.html against this file's body so it can never silently drift.
//
// Zero-dep ESM. No randomness, no wall-clock — every exported function is a pure total function.

// ===== FUSION-LADDER CORE (byte-identical to core.mjs) =====
"use strict";

// The fixed nucleon parcel. We always reckon energy per the SAME 56 nucleons, so the nucleon
// number is conserved across a rung and sign(Q) === sign(ΔB/A) holds BY CONSTRUCTION. This is the
// crux of the whole claim — do NOT replace it with a total-binding difference (that would not flip
// sign at iron; it is the alpha-capture trap the design warns against).
const PARCEL = 56;

// The climb, rung by rung. B/A is binding-energy-per-nucleon in MeV/nucleon (AME2020 / NNDC-class).
// The ORDER of this array IS the climb a star makes: hydrogen on the rim, down through the alpha
// chain to the FLOOR at the iron group, then the doomed up-wall past iron (Zn, Ge) that costs.
//   Fe-56 = the iron peak — the last "honest" rung of stellar fusion (cultural max).
//   Ni-62 = the engraved TRUE maximum — the single most-bound nuclide; the valley's actual floor.
const LADDER = [
  { sym: 'H-1',  A: 1,  ba: 0.000 },   // hydrogen — the rim; nothing fused yet
  { sym: 'He-4', A: 4,  ba: 7.074 },   // the first, deepest single plunge (H→He)
  { sym: 'C-12', A: 12, ba: 7.680 },
  { sym: 'O-16', A: 16, ba: 7.976 },
  { sym: 'Ne-20',A: 20, ba: 8.032 },
  { sym: 'Mg-24',A: 24, ba: 8.261 },
  { sym: 'Si-28',A: 28, ba: 8.448 },
  { sym: 'S-32', A: 32, ba: 8.493 },
  { sym: 'Ca-40',A: 40, ba: 8.551 },
  { sym: 'Fe-56',A: 56, ba: 8.790 },   // the iron peak — last honest rung
  { sym: 'Ni-62',A: 62, ba: 8.795 },   // PEAK = the valley FLOOR (true maximum)
  { sym: 'Zn-66',A: 66, ba: 8.760 },   // past iron — the up-wall begins (costs)
  { sym: 'Ge-72',A: 72, ba: 8.732 },   // still climbing the un-climbable wall
];

const NI62 = 8.795;   // the engraved true maximum (MeV/nucleon)

// argmax of B/A over the ladder — computed, never hard-coded. This index is the floor.
function argmaxBA(){
  let best = 0;
  for (let i = 1; i < LADDER.length; i++) if (LADDER[i].ba > LADDER[best].ba) best = i;
  return best;
}
const PEAK = argmaxBA();   // index of Ni-62 — the deepest, most-bound rung (the valley floor)

// Domain guard: a rung index must be an in-range integer (or RangeError, like classify's throw).
// `last` lets callers guard either a rung index (0..n-1) or a step index (0..n-2).
function checkIndex(i, last){
  if (typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i > last){
    throw new RangeError('rung index must be an integer in [0,' + last + ']; got ' + i);
  }
}

// rungYield(i): the energy BANKED to climb from rung i to rung i+1, in MeV per 56-nucleon parcel.
//   = PARCEL · (B/A[i+1] − B/A[i]).   POSITIVE below the floor (fusion pays), NEGATIVE at/above it
//   (the up-wall costs). sign(rungYield) === sign(ΔB/A), EXACT — the whole claim in one line.
function rungYield(i){
  checkIndex(i, LADDER.length - 2);
  return PARCEL * (LADDER[i + 1].ba - LADDER[i].ba);
}

// depth(i): the valley GEOMETRY — B/A gained from hydrogen by the time you reach rung i. Data →
// shape: deeper (larger) means more tightly bound, i.e. lower in the inverted valley the page draws.
function depth(i){
  checkIndex(i, LADDER.length - 1);
  return LADDER[i].ba - LADDER[0].ba;
}

// bank(i): the cumulative energy reservoir at rung i, in MeV per parcel = PARCEL · depth(i).
//   The bank IS the integral of the yields: bank(i+1) − bank(i) === rungYield(i), every rung.
function bank(i){
  checkIndex(i, LADDER.length - 1);
  return PARCEL * depth(i);
}

// freeFusionPastIron(i): the NEGATIVE CONTROL. A furnace that banks |yield| on EVERY rung, sign be
// damned — so it keeps "paying" up the un-climbable wall past iron. The real core must DISAGREE
// with it at and beyond the floor (real < 0 while this fake > 0) or claim (2) passes vacuously.
function freeFusionPastIron(i){
  return Math.abs(rungYield(i));
}

// signFlipIndex(): the first rung whose yield is negative — must be the rung LEAVING the iron group
// (i.e. the floor index), and no earlier. The single moment fusion stops paying.
function signFlipIndex(){
  for (let i = 0; i <= LADDER.length - 2; i++) if (rungYield(i) < 0) return i;
  return -1;
}

// ── THE SELF-TEST — the ladder proves its own claim ─────────────────────────────────────────
// (1) EVERY sub-iron rung RELEASES: rungYield(i) > 0 for all i below the floor.
// (2) SIGN FLIPS AT THE IRON GROUP: rungYield(i) < 0 for every rung at/above the floor; the first
//     negative rung is exactly the one leaving the floor (signFlipIndex === PEAK), and nowhere earlier.
// (3) B/A PEAKS AT THE IRON GROUP: argmax(B/A) === PEAK is 'Ni-62', Fe-56 ≥ every sub-iron species,
//     and B/A is monotone-increasing up to the floor then strictly decreasing past it.
// (4) BANK climbs then falls: cumulative bank strictly up to the floor, strictly down past it, AND
//     sign(rungYield(i)) === sign(bank(i+1) − bank(i)) every rung (the yield IS the bank's delta).
// (5) NEG-CONTROL TEETH: freeFusionPastIron agrees in sign with the real core on every sub-iron
//     rung but DISAGREES at and beyond the floor (real < 0 while the fake > 0) — asserted explicitly.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });
  const last = LADDER.length - 1, lastStep = LADDER.length - 2;
  const sign = (x) => x > 0 ? 1 : x < 0 ? -1 : 0;

  // CLAIM 1 — every sub-iron rung releases energy.
  let allBelowPositive = true, firstNeg = -1;
  for (let i = 0; i < PEAK; i++) if (!(rungYield(i) > 0)){ allBelowPositive = false; if (firstNeg < 0) firstNeg = i; }
  log('1 · every sub-iron rung RELEASES  (rungYield(i) > 0 for all i below the floor)',
      allBelowPositive,
      'rungs 0..' + (PEAK - 1) + ' all exothermic' + (firstNeg >= 0 ? '; first non-positive at ' + firstNeg : ''));

  // CLAIM 2 — the sign flips at the iron group; the first negative rung leaves the floor.
  let allAtAboveNeg = true;
  for (let i = PEAK; i <= lastStep; i++) if (!(rungYield(i) < 0)) allAtAboveNeg = false;
  const flip = signFlipIndex();
  log('2 · SIGN FLIPS at the iron group  (rungYield < 0 at/above the floor; first flip leaves it)',
      allAtAboveNeg && flip === PEAK,
      'flip rung=' + flip + ' (Δ ' + LADDER[flip].sym + '→' + LADDER[flip + 1].sym + ')' +
      '  yield(PEAK)=' + rungYield(PEAK).toFixed(2) + ' MeV/parcel');

  // CLAIM 3 — B/A peaks at the iron group; monotone up then strictly down.
  let monoUp = true, monoDown = true;
  for (let i = 1; i <= PEAK; i++) if (!(LADDER[i].ba > LADDER[i - 1].ba)) monoUp = false;
  for (let i = PEAK + 1; i <= last; i++) if (!(LADDER[i].ba < LADDER[i - 1].ba)) monoDown = false;
  const feIdx = LADDER.findIndex(n => n.sym === 'Fe-56');
  let feIsSubIronMax = true;
  for (let i = 0; i < feIdx; i++) if (LADDER[feIdx].ba < LADDER[i].ba) feIsSubIronMax = false;
  log('3 · B/A PEAKS at the iron group  (argmax=Ni-62; Fe-56 ≥ all sub-iron; monotone up then down)',
      argmaxBA() === PEAK && LADDER[PEAK].sym === 'Ni-62' && feIsSubIronMax && monoUp && monoDown,
      'PEAK=' + LADDER[PEAK].sym + ' ≈' + NI62 + '; Fe-56≈' + LADDER[feIdx].ba + ' MeV/nucleon');

  // CLAIM 4 — bank climbs then falls; the yield is the bank's delta every rung.
  let bankUp = true, bankDown = true, deltaMatches = true;
  for (let i = 1; i <= PEAK; i++) if (!(bank(i) > bank(i - 1))) bankUp = false;
  for (let i = PEAK + 1; i <= last; i++) if (!(bank(i) < bank(i - 1))) bankDown = false;
  for (let i = 0; i <= lastStep; i++){
    const delta = bank(i + 1) - bank(i);
    if (Math.abs(delta - rungYield(i)) > 1e-9 || sign(rungYield(i)) !== sign(delta)) deltaMatches = false;
  }
  log('4 · BANK climbs then falls  (strictly up to the floor, down past it; yield IS the bank delta)',
      bankUp && bankDown && deltaMatches,
      'bank(floor)=' + bank(PEAK).toFixed(1) + ' MeV/parcel; yield===Δbank on every rung');

  // CLAIM 5 — neg-control teeth: free-fusion agrees in sign below the floor, disagrees at/above it.
  let agreesBelow = true, disagreesAtAbove = true;
  for (let i = 0; i < PEAK; i++) if (sign(freeFusionPastIron(i)) !== sign(rungYield(i))) agreesBelow = false;
  for (let i = PEAK; i <= lastStep; i++){
    if (!(freeFusionPastIron(i) > 0 && rungYield(i) < 0 && sign(freeFusionPastIron(i)) !== sign(rungYield(i)))) disagreesAtAbove = false;
  }
  log('5 · NEGATIVE CONTROL: free-fusion banks past iron and DISAGREES in sign at/above the floor',
      agreesBelow && disagreesAtAbove,
      'free(PEAK)=+' + freeFusionPastIron(PEAK).toFixed(2) + ' vs real=' + rungYield(PEAK).toFixed(2) + ' MeV/parcel');

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END FUSION-LADDER CORE =====

export {
  PARCEL, LADDER, NI62, PEAK,
  rungYield, depth, bank, freeFusionPastIron, signFlipIndex, runSelfTest,
};
