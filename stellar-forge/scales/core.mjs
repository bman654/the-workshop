// The Scales of a Star's Death — logic core (a fate you can weigh).
//
// THE WHOLE POINT: a star is a fight. Gravity pulls inward forever; something has to push back.
// When the fuel is gone, the only thing left holding a stellar CORE up is degeneracy pressure —
// the quantum refusal of identical fermions to share a state. But that refusal has a CEILING.
// Pile on enough mass and the floor gives way. There are exactly TWO floors, so there are exactly
// THREE fates, and which one a dying core gets is decided by ONE number: its remnant mass.
//
//   M < M_CH  (Chandrasekhar)  →  WHITE DWARF   — electron degeneracy holds.
//   M_CH ≤ M < M_TOV (TOV)     →  NEUTRON STAR  — electrons crushed into neutrons; neutron
//                                                 degeneracy holds.
//   M ≥ M_TOV                  →  BLACK HOLE     — nothing holds; the core collapses without end.
//
// This core is the WEIGHING MACHINE: hand it a core-remnant mass in solar masses (M☉) and it
// returns the fate. The PAGE renders that fate as a luminous body you collapse — a white dwarf
// that cools, a neutron star that implodes and spins up, a black hole that irises shut over its
// own light. The body IS the readout; you never read a fate off an axis.
//
// WHY THE NUMBERS ARE HONEST:
//   · M_CH ≈ 1.44 M☉ is the Chandrasekhar limit — the maximum mass electron-degeneracy pressure
//     can support (Chandrasekhar 1931; the canonical value for a non-rotating carbon–oxygen core
//     is 1.4–1.44 M☉). We pin 1.44 as the representative ceiling.
//   · M_TOV ≈ 2.2 M☉ is the Tolman–Oppenheimer–Volkoff limit — the maximum mass of a
//     non-rotating neutron star. Its exact value is equation-of-state-dependent and currently
//     bracketed observationally + theoretically at ≈ 2.2–2.3 M☉; we pin 2.2 as a representative
//     cutoff. The engraving on the page reads "≈2.2–2.3" so 2.2 is never mistaken for a measured
//     exactness — what is EXACT here is the LOGIC: two ordered gates ⇒ three ordered fates.
//
// The claim this core proves is therefore the STRUCTURE, not a knife-edge measurement:
//   (a) the Chandrasekhar gate FLIPS the fate from white-dwarf to neutron-star;
//   (b) the TOV gate FLIPS the fate from neutron-star to black-hole;
//   (c) the fate is MONOTONE in mass — heavier never means a gentler death;
//   (d) the gates are ORDERED (M_CH < M_TOV) so the neutron-star band is non-empty.
// The NEGATIVE CONTROL `alwaysNeutron` ignores M and always returns 'neutron-star'; the suite
// asserts the real core DISAGREES with it on BOTH sides (a 1.43 dwarf, a 2.4 black hole), so the
// flip tests cannot pass vacuously.
//
// SOURCING (anti-drift, encoded in core.test.mjs): the page inlines this core byte-for-byte
// between the STELLAR-SCALES CORE sentinels; core.test.mjs byte-parity-checks the inlined copy in
// index.html against this file's body so it can never silently drift.
//
// Zero-dep ESM. No randomness, no wall-clock — classify(M) is a pure total function on the reals.

// ===== STELLAR-SCALES CORE (byte-identical to core.mjs) =====
"use strict";

// The Chandrasekhar limit: the maximum core mass electron-degeneracy pressure can support.
// ≈ 1.44 M☉ for a non-rotating carbon–oxygen core. Cross it and the electrons lose.
const M_CH = 1.44;

// The Tolman–Oppenheimer–Volkoff limit: the maximum mass of a non-rotating neutron star.
// Equation-of-state-dependent, bracketed at ≈ 2.2–2.3 M☉; 2.2 is pinned as a representative
// cutoff. Cross it and neutron-degeneracy pressure loses too — nothing is left to hold.
const M_TOV = 2.2;

// The three fates, in order of how violent the death is (the monotone ladder the tests assert).
const FATES = ['white-dwarf', 'neutron-star', 'black-hole'];

// ── THE WEIGHING MACHINE ───────────────────────────────────────────────────────────────────
// classify(M): given a core-remnant mass in solar masses, return the fate.
//   M < M_CH            → 'white-dwarf'   (electron degeneracy holds)
//   M_CH ≤ M < M_TOV    → 'neutron-star'  (neutron degeneracy holds)
//   M ≥ M_TOV           → 'black-hole'    (nothing holds)
// The boundaries belong to the HEAVIER side: AT a limit, that pressure has already been reached,
// so collapse to the next state proceeds (the comparison is ≥). Throws on a non-physical mass.
function classify(M){
  if (typeof M !== 'number' || !Number.isFinite(M) || M < 0){
    throw new RangeError('mass must be a finite number ≥ 0 (solar masses); got ' + M);
  }
  if (M < M_CH)  return 'white-dwarf';
  if (M < M_TOV) return 'neutron-star';
  return 'black-hole';
}

// fateIndex(M): the fate's rank on the monotone ladder (0 dwarf, 1 neutron star, 2 black hole).
// Heavier mass ⇒ a never-smaller index — the death never gets gentler. Used by the monotone test
// and by the page's degeneracy-ladder gauge (which segment is bearing the load).
function fateIndex(M){
  return FATES.indexOf(classify(M));
}

// ── THE NEGATIVE CONTROL ───────────────────────────────────────────────────────────────────
// A weighing machine that always says "neutron star" no matter the mass. A vacuous "does the core
// survive as something?" checker would happily pass on this. The real core must DISAGREE with it on
// BOTH sides — it must call 1.43 a white dwarf and 2.4 a black hole — or the gate tests are theatre.
function alwaysNeutron(_M){
  return 'neutron-star';     // deliberately mass-independent — the foil the gate tests must beat
}

// ── THE SELF-TEST — the scales prove their own claim ────────────────────────────────────────
// (1) CHANDRASEKHAR FLIP: 1.43 → white dwarf, 1.45 → neutron star (the lower gate flips the fate).
// (2) TOV FLIP: 2.1 → neutron star, 2.4 → black hole (the upper gate flips the fate).
// (3) MONOTONE LADDER: over a mass ladder the fate index never decreases (death never gentler).
// (4) ORDERED GATES + BOUNDARY DIRECTION: M_CH < M_TOV (neutron band non-empty), and each limit
//     lands on the heavier side (AT the limit ⇒ the next, heavier fate).
// (5) NEG-CONTROL TEETH: alwaysNeutron disagrees with the real core at 1.43 AND 2.4 — it provably
//     fails BOTH flip pairs, so the suite cannot pass vacuously.
function runSelfTest(){
  const checks = [];
  const log = (name, pass, info) => checks.push({ name, pass, info });

  // CLAIM 1 — Chandrasekhar gate flips white-dwarf → neutron-star.
  const wd = classify(1.43), ns1 = classify(1.45);
  log('1 · Chandrasekhar flip  (1.43 → white dwarf, 1.45 → neutron star)',
      wd === 'white-dwarf' && ns1 === 'neutron-star',
      '1.43=' + wd + '  1.45=' + ns1 + '  (M_CH=' + M_CH + ')');

  // CLAIM 2 — TOV gate flips neutron-star → black-hole.
  const ns2 = classify(2.1), bh = classify(2.4);
  log('2 · TOV flip  (2.1 → neutron star, 2.4 → black hole)',
      ns2 === 'neutron-star' && bh === 'black-hole',
      '2.1=' + ns2 + '  2.4=' + bh + '  (M_TOV=' + M_TOV + ')');

  // CLAIM 3 — monotone fate ladder over a representative mass sweep.
  const ladder = [0.6, 1.0, 1.43, 1.45, 1.8, 2.1, 2.4, 2.8];
  const idx = ladder.map(fateIndex);
  let mono = true;
  for (let k = 1; k < idx.length; k++) if (idx[k] < idx[k-1]) mono = false;
  log('3 · monotone ladder  (fate index non-decreasing as mass rises)',
      mono, 'M=[' + ladder.join(',') + ']  fate=[' + idx.join(',') + ']');

  // CLAIM 4 — ordered gates + boundary direction (AT a limit ⇒ the heavier fate).
  const ordered = M_CH < M_TOV;
  const atCh = classify(M_CH), atTov = classify(M_TOV);
  const belowCh = classify(M_CH - 0.01), belowTov = classify(M_TOV - 0.01);
  const dir = atCh === 'neutron-star' && atTov === 'black-hole'
           && belowCh !== atCh && belowTov !== atTov;
  log('4 · ordered gates + boundaries land heavier  (M_CH < M_TOV; AT each limit ⇒ next fate)',
      ordered && dir,
      'M_CH=' + M_CH + ' < M_TOV=' + M_TOV + '; at M_CH=' + atCh + ', at M_TOV=' + atTov);

  // CLAIM 5 — neg-control teeth: alwaysNeutron disagrees with the real core on BOTH sides.
  const foilWd = alwaysNeutron(1.43), foilBh = alwaysNeutron(2.4);
  const teeth = foilWd === 'neutron-star' && foilBh === 'neutron-star'
             && classify(1.43) === 'white-dwarf' && classify(2.4) === 'black-hole'
             && foilWd !== classify(1.43) && foilBh !== classify(2.4);
  log('5 · NEGATIVE CONTROL: always-neutron disagrees with the real core at BOTH gates',
      teeth,
      'foil(1.43)=' + foilWd + ' vs real=' + classify(1.43) +
      ' · foil(2.4)=' + foilBh + ' vs real=' + classify(2.4));

  const passed = checks.filter(c => c.pass).length;
  return { checks, passed, total: checks.length, ok: passed === checks.length };
}
// ===== END STELLAR-SCALES CORE =====

export {
  M_CH, M_TOV, FATES,
  classify, fateIndex, alwaysNeutron, runSelfTest,
};
