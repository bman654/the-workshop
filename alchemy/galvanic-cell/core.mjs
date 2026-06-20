/* ============================================================================
   ALCHEMY LAB · THE GALVANIC CELL — core.mjs   (the SOLE EMF authority for the bench)

   A galvanic cell runs on a DIFFERENCE. Each metal sits at a standard electrode
   potential E° versus the Standard Hydrogen Electrode (SHE) — a fixed CODATA number
   that says how badly it wants to be reduced. Wire two half-cells together and the
   cell's electromotive force is the gap between them, nothing more:

        E°cell = E°(cathode) − E°(anode)              (cathode = the higher E°)

   The cathode is whichever metal has the HIGHER E° (it pulls electrons; it plates
   up). The anode is the LOWER-E° metal (it gives electrons; it dissolves). Because
   E°cell is a SUBTRACTION of two table values, it is additive over every pair and
   exactly antisymmetric: swap the electrodes and the sign flips but the magnitude
   is identical. Put the SAME metal on both sides and the difference is exactly
   zero — no gap, no drive, a dead cell. THAT is the lesson the bench makes you
   feel: it is the difference, not either metal alone, that runs the cell.

   The Nernst equation tilts E°cell off-standard by the ion concentrations:

        E = E°cell − (R·T / n·F) · ln Q

   At Q = 1 (1 M / 1 M) the log term is exactly zero and E === E°cell. Slide the
   concentration dial and E tilts by the exact RT/nF·lnQ slope — no 0.0592 shortcut.

   `cellOriented(left,right)` is the ONE signed number the render layer consumes:
   E°(right) − E°(left). It is + when the higher-E° metal sits on the right
   (a spontaneous "forward" placement) and − when reversed; this single sign drives
   BOTH the needle direction AND the electron-flow direction. The Daniell cell —
   zinc on the left, copper on the right — reads a spontaneous +1.10 V by this rule.

   index.html INLINES this file byte-identical between sentinels; core.test.mjs runs
   it in Node. If the page's inline ever drifts from this file, the page's
   re-extraction parity check fails.
   ============================================================================ */

// ── physical constants (labeled; the bench reads these, never hardcodes) ──
export const R = 8.314462618;        // gas constant, J/(mol·K)   (CODATA)
export const F = 96485.33212;        // Faraday constant, C/mol   (CODATA)
export const T_STD = 298.15;         // standard temperature, K   (25 °C)

/* ── THE RACK — standard reduction potentials vs SHE (volts), GIVEN CODATA/IUPAC
   table values, ordered MOST-REACTIVE → MOST-NOBLE so a metal's INDEX in this
   array is its activity rank (0 = most active). n is the electrons per formula
   unit of the half-reaction; tint is the metal's display color. ── */
export const RACK = [
  { sym: 'Mg', name: 'Magnesium', E0: -2.372, n: 2, tint: '#9fb0bd' },
  { sym: 'Al', name: 'Aluminium', E0: -1.662, n: 3, tint: '#aeb8c2' },
  { sym: 'Zn', name: 'Zinc',      E0: -0.7618, n: 2, tint: '#9aa6ae' },
  { sym: 'Fe', name: 'Iron',      E0: -0.447, n: 2, tint: '#8f8076' },
  { sym: 'Pb', name: 'Lead',      E0: -0.1262, n: 2, tint: '#7d818c' },
  { sym: 'Cu', name: 'Copper',    E0:  0.3419, n: 2, tint: '#c9763f' },
  { sym: 'Ag', name: 'Silver',    E0:  0.7996, n: 1, tint: '#cdd2d6' },
  { sym: 'Au', name: 'Gold',      E0:  1.498,  n: 3, tint: '#e6b73c' },
];

// ── rack lookup by symbol ──
export function rackEntry(sym){ return RACK.find(m => m.sym === sym) || null; }

// ── E°(sym): the standard reduction potential vs SHE, straight off the rack ──
export function E0(sym){
  const m = rackEntry(sym);
  if (!m) throw new Error('unknown metal: ' + sym);
  return m.E0;
}

// ── n(sym): electrons per formula unit of the metal's half-reaction ──
export function nOf(sym){
  const m = rackEntry(sym);
  if (!m) throw new Error('unknown metal: ' + sym);
  return m.n;
}

// ── eCell(cathodeSym, anodeSym) = E°(cathode) − E°(anode), EXACT float subtraction.
//    The cell potential as a magnitude-with-a-named-cathode; identical-arg subtraction,
//    no tolerance. eCell(c,a) === −eCell(a,c) and same metal ⇒ exactly 0. ──
export function eCell(cathodeSym, anodeSym){
  return E0(cathodeSym) - E0(anodeSym);
}

// ── cellOriented(leftSym, rightSym) = E°(right) − E°(left): the SIGNED emf of the
//    PHYSICAL placement. + when the higher-E° (nobler) metal sits on the RIGHT — a
//    spontaneous forward cell; − when reversed. THIS single number drives the needle
//    direction AND the electron-flow direction. Locked convention: left=Zn, right=Cu
//    (the Daniell cell) reads spontaneous-positive (+1.1037). Antisymmetric:
//    cellOriented(a,b) === −cellOriented(b,a) and |·| is placement-independent. ──
export function cellOriented(leftSym, rightSym){
  return E0(rightSym) - E0(leftSym);
}

// ── assign(a,b): which is cathode (higher E°), which is anode (lower E°), the
//    non-negative cell emf, and the degenerate (same-metal) neg-control. Order of
//    the two arguments does not matter — the chemistry, not the placement, decides
//    the roles. Same metal ⇒ {eCell:0, spontaneous:false, dead:true}. ──
export function assign(a, b){
  if (a === b) return { cathode: a, anode: b, eCell: 0, spontaneous: false, dead: true };
  const cathode = E0(a) >= E0(b) ? a : b;   // higher E° is the cathode
  const anode   = cathode === a ? b : a;
  const e = E0(cathode) - E0(anode);        // ≥ 0 by construction
  return { cathode, anode, eCell: e, spontaneous: e > 0, dead: false };
}

// ── greatest common divisor / least common multiple (positive integers) ──
function gcd(x, y){ x = Math.abs(x); y = Math.abs(y); while (y){ [x, y] = [y, x % y]; } return x; }
function lcm(x, y){ return (x && y) ? Math.abs(x * y) / gcd(x, y) : 0; }

// ── cellN(catSym, anSym) = lcm of the two half-reaction electron counts — the
//    number of electrons the balanced cell reaction moves (Daniell Zn|Cu → 2;
//    Cu|Al → lcm(2,3)=6). This is the animation's electron count AND the n fed to
//    nernst(). Same metal ⇒ that metal's own n. ──
export function cellN(catSym, anSym){
  return lcm(nOf(catSym), nOf(anSym));
}

// ── superscript helper for the electron count in the half-equations ──
const SUP = { '1': '', '2': '²', '3': '³' };  // n=1 ⇒ "e⁻"; n=2 ⇒ "2e⁻"; n=3 ⇒ "3e⁻"
function eLabel(n){ return (n === 1 ? '' : String(n)) + 'e⁻'; }
function ionCharge(n){ return n === 1 ? '⁺' : (SUP[String(n)] || String(n)) + '⁺'; }

// ── halfReactions(anSym, catSym): the two balanced half-equations for the cell,
//    the anode OXIDATION (metal → ion + e⁻) and the cathode REDUCTION (ion + e⁻ →
//    metal). The bench stamps these under each beaker. ──
export function halfReactions(anSym, catSym){
  const na = nOf(anSym), nc = nOf(catSym);
  return {
    ox:  anSym + ' → ' + anSym + ionCharge(na) + ' + ' + eLabel(na),
    red: catSym + ionCharge(nc) + ' + ' + eLabel(nc) + ' → ' + catSym,
  };
}

// ── nernst(eCellStd, n, Q, T): E = E°cell − (R·T / n·F)·ln Q. EXACT — no 0.0592
//    approximation. Q === 1 ⇒ === eCellStd (ln 1 = 0). Sliding the dial tilts E by
//    the real RT/nF·lnQ slope (≈ 0.059159 V per decade at n=1, 25 °C). ──
export function nernst(eCellStd, n, Q, T = T_STD){
  return eCellStd - (R * T / (n * F)) * Math.log(Q);
}

// ── dialQ(cAn, cCat) = [anode ion] / [cathode ion]: the reaction quotient the
//    concentration dial sets. Q > 1 (anode ion richer) lowers E; Q < 1 raises it.
//    The facet-B dial labels MUST match this anode-over-cathode convention. ──
export function dialQ(cAn, cCat){ return cAn / cCat; }

/* ── ladderOrder(triedPairs): reconstruct the activity ranking of all metals seen
   in the tried pairs from the SIGNS of their pairwise cells ALONE — never the raw
   potentials. Each tried pair {a,b} contributes a directed edge: whichever is the
   cathode (higher E°) outranks the other in nobility. We topologically/transitively
   sort by "beats" counts. With a spanning set of comparisons this reproduces the
   rack's E° order exactly (most-active first). This is the play-loop's reveal:
   the textbook activity series rebuilt from pairwise voltages alone. ── */
export function ladderOrder(triedPairs){
  // collect the set of metals that appear, and a nobility relation for each
  const syms = new Set();
  for (const [a, b] of triedPairs){ if (a) syms.add(a); if (b) syms.add(b); }
  // "nobler[x]" = the set of metals x is nobler than (directly observed, from signs)
  const nobler = {};   // sym -> Set of syms it outranks
  for (const s of syms) nobler[s] = new Set();
  for (const [a, b] of triedPairs){
    if (!a || !b || a === b) continue;
    const { cathode, anode } = assign(a, b);   // cathode is the nobler (higher E°)
    nobler[cathode].add(anode);
  }
  // TRANSITIVE CLOSURE: nobility is a total order, so if x is nobler than y and y is
  // nobler than z, x is nobler than z — even when (x,z) was never directly tried.
  // This is what lets a spanning PATH of adjacent comparisons (Mg<Al<…<Au) rebuild
  // the full ranking from a handful of pairs instead of all 28. (Floyd–Warshall.)
  const list = [...syms];
  let changed = true;
  while (changed){
    changed = false;
    for (const x of list) for (const y of [...nobler[x]]) for (const z of [...nobler[y]]){
      if (!nobler[x].has(z)){ nobler[x].add(z); changed = true; }
    }
  }
  // rank by how many others a metal is nobler than (after closure); ties broken by
  // symbol for determinism (a connected spanning set makes counts strict — no ties).
  list.sort((x, y) => {
    const dx = nobler[x].size, dy = nobler[y].size;
    if (dx !== dy) return dx - dy;             // FEWER beats = more active = earlier
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return list;  // most-active (fewest beats) first — matches RACK order
}

// ── volt2deg(v): pure scale mapping, signed volts → needle degrees. The face spans
//    ±4.0 V over ±75° (150° sweep, 0 at top-centre). Monotonic and ODD. ──
export function volt2deg(v){
  const c = Math.max(-4, Math.min(4, v));
  return (c / 4) * 75;
}

// ── flowDir(orientedV) = sign of the oriented emf: +1 / −1 / 0. Electrons flow in
//    this direction; salt-bridge ions flow opposite; same metal ⇒ 0 (still). ──
export function flowDir(orientedV){ return Math.sign(orientedV); }

/* ============================================================================
   runSelfTest — the ONE proof body the in-page badge, the Node twin, and the
   landing's curated subset all call. Each row is a FALSIFIER with teeth.
   Returns { pass, total, rows:[{name, ok}] }.
   ============================================================================ */
export function runSelfTest(){
  const rows = [];
  const ok = (name, cond) => rows.push({ name, ok: !!cond });
  const syms = RACK.map(m => m.sym);

  // (1) ADDITIVITY OVER ALL ORDERED PAIRS: eCell(c,a) === E0(c)−E0(a) exactly.
  let addAll = true, addCount = 0;
  for (const c of syms) for (const a of syms){
    addCount++;
    if (eCell(c, a) !== E0(c) - E0(a)) addAll = false;
  }
  ok('(1) eCell(c,a) === E°(c)−E°(a) exact over all ' + addCount + ' ordered pairs', addAll && addCount === 64);

  // (2) SIGN-FLIP / IDENTICAL MAGNITUDE over every distinct pair.
  let flipOk = true, magOk = true;
  for (const a of syms) for (const b of syms){
    if (a === b) continue;
    if (eCell(a, b) !== -eCell(b, a)) flipOk = false;
    if (Math.abs(eCell(a, b)) !== Math.abs(eCell(b, a))) magOk = false;
  }
  ok('(2) eCell(a,b) === −eCell(b,a) for every distinct pair (sign flips)', flipOk);
  ok('(2b) |eCell(a,b)| === |eCell(b,a)| — magnitude is placement-independent', magOk);

  // (3) DANIELL ANCHOR: Cu|Zn = 1.1037 V, reads "1.10"; assign picks Cu cathode.
  const daniell = eCell('Cu', 'Zn');
  ok('(3) Daniell |eCell(Cu,Zn) − 1.1037| ≤ 1e-9', Math.abs(daniell - 1.1037) <= 1e-9);
  ok('(3b) Daniell reads "1.10" V to 2 dp', daniell.toFixed(2) === '1.10');
  const dAsg = assign('Zn', 'Cu');
  ok('(3c) assign(Zn,Cu) → Cu cathode, Zn anode, spontaneous',
     dAsg.cathode === 'Cu' && dAsg.anode === 'Zn' && dAsg.spontaneous === true);
  // (3d) the SIGN convention: Daniell placement left=Zn, right=Cu is positive
  ok('(3d) cellOriented(Zn,Cu) > 0 (Daniell placement is spontaneous-positive)',
     cellOriented('Zn', 'Cu') > 0 && Math.abs(cellOriented('Zn', 'Cu') - daniell) <= 1e-12);

  // (4) NERNST → E°cell at Q=1, and the real per-decade slope at Q=10, n=1.
  ok('(4) nernst(eCell(Cu,Zn), 2, 1) === E°cell (ln 1 = 0, drop < 1e-9)',
     Math.abs(nernst(daniell, 2, 1) - daniell) < 1e-9);
  const decadeDrop = nernst(daniell, 1, 10) - daniell;
  const expectDrop = -(R * T_STD / F) * Math.log(10);
  ok('(4b) nernst slope at Q=10, n=1 === −(RT/F)·ln10 (≈ −0.059159 V, ≤ 1e-12)',
     Math.abs(decadeDrop - expectDrop) <= 1e-12);

  // (5) SAME-METAL NEG-CONTROL (the red row): eCell(m,m)===0 exact, assign dead.
  let degOk = true;
  for (const m of syms){
    if (eCell(m, m) !== 0) degOk = false;
    const a = assign(m, m);
    if (!(a.dead === true && a.spontaneous === false && a.eCell === 0)) degOk = false;
  }
  ok('(5) same metal both sides ⇒ eCell===0 exact & assign.dead (no drive)', degOk);

  // (6) PERTURBATION TEETH: a table with E0(c)−E0(a)+0.001 must FAIL the additivity ===.
  let perturbCaught = true;
  for (const c of syms) for (const a of syms){
    if (c === a) continue;
    const fudged = E0(c) - E0(a) + 0.001;
    if (eCell(c, a) === fudged){ perturbCaught = false; }  // a real subtraction can't equal the fudge
  }
  ok('(6) a +0.001 V perturbation of every pair FAILS the additivity === (the test has teeth)', perturbCaught);

  // (7) cellN: lcm of the half-reaction electron counts.
  ok('(7) cellN(Cu,Al)===6 (lcm 2,3) and cellN(Zn,Cu)===2',
     cellN('Cu', 'Al') === 6 && cellN('Zn', 'Cu') === 2);

  // (8) LADDER: a spanning set of pairwise comparisons rebuilds the rack's E° order.
  //     A "path" of adjacent comparisons (Mg<Al<Zn<…<Au) spans the whole rack.
  const spanning = [];
  for (let i = 0; i < syms.length - 1; i++) spanning.push([syms[i], syms[i + 1]]);
  const reconstructed = ladderOrder(spanning);
  const orderEq = reconstructed.length === syms.length && reconstructed.every((s, i) => s === syms[i]);
  ok('(8) ladderOrder(spanning pairs) === rack E° order (activity series from signs alone)', orderEq);

  // (8b) volt2deg is monotonic & odd (the needle map is honest)
  ok('(8c) volt2deg is odd & monotonic (−4→−75°, 0→0°, +4→+75°)',
     volt2deg(4) === 75 && volt2deg(-4) === -75 && volt2deg(0) === 0 &&
     volt2deg(2) > volt2deg(1) && volt2deg(-1) === -volt2deg(1));

  // (8d) flowDir reverses with the oriented sign; 0 when degenerate
  ok('(8d) flowDir(cellOriented(a,b)) === −flowDir(cellOriented(b,a)); same metal ⇒ 0',
     flowDir(cellOriented('Zn', 'Cu')) === -flowDir(cellOriented('Cu', 'Zn')) &&
     flowDir(cellOriented('Cu', 'Cu')) === 0);

  const pass = rows.filter(r => r.ok).length;
  return { pass, total: rows.length, rows };
}

// dual-use guard: importable as an ES module AND requireable in a CommonJS Node twin
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { R, F, T_STD, RACK, rackEntry, E0, nOf, eCell, cellOriented, assign,
    cellN, halfReactions, nernst, dialQ, ladderOrder, volt2deg, flowDir, runSelfTest };
}
