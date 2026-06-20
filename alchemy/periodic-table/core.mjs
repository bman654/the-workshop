/* ============================================================================
   THE AUFBAU STAIRCASE — core.mjs   (the SOLE math authority for the bench)

   The periodic table is not drawn — it is BORN, one electron at a time, from a
   single combinatorial rule. Every atom is built by dropping electrons into
   subshells (n,ℓ) in a fixed ORDER until the nuclear charge Z is spent. Which
   order? The Madelung / Aufbau rule:

        fill by increasing (n + ℓ);  ties broken by increasing n.

   That single integer key — n+ℓ, then n — reproduces the whole familiar sequence
        1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s …
   and, as a CONSEQUENCE, the periods close exactly at the noble gases
        {2, 10, 18, 36, …}  (He, Ne, Ar, Kr through this bench's window).
   The famous "4s before 3d" jog at Z=19 (K) is not a special case — it falls
   straight out of (4+0) < (3+2). This bench's whole claim is that the table's
   silhouette is CAUSED by that ordering, and nothing else.

   THE REGISTER — HONESTLY EXACT. (n,ℓ) are integers; the fill order is a STABLE
   SORT on integer keys; capacities are integers; Z is spent by integer
   subtraction. There is NO float and NO tolerance anywhere — that is the honest
   register for a combinatorial-ordering claim. (Contrast the Equilibrium bench,
   whose root is transcendental and so is honestly float+tolerance. Here a
   tolerance would be a lie: the answer is an integer fact.)

   THE NEGATIVE CONTROL. Swap the rule to "fill by increasing n only" (ties by ℓ)
   and the table BREAKS in a structurally measurable way: period 3 swells from 8
   to 18 cells (because 3d now fills before 4s) and the third closure DRIFTS OFF
   Argon (Z=18) to Z=28. The toggle isolates (n+ℓ) as the SOLE cause of the real
   table's shape. The break is COMPUTED here, never hand-faked in the page.

   THE TWO ANOMALIES. Cr (Z=24) and Cu (Z=29) do NOT obey the bare rule — nature
   half-/fully-fills the d-shell at the cost of a 4s electron. They are DECLARED
   here (ANOMALIES); groundConfig returns the rule's PREDICTION but flags
   .anomaly=true and carries nature's real config so the bench can show both,
   honestly, and never claim the bare rule nails them.

   This module is self-contained (no import) — exactly like its sibling cores.
   index.html INLINES this file byte-identical between the AUFBAU-CORE sentinels;
   core.test.mjs runs it in Node. If the page's inline ever drifts from this file,
   the page's re-extraction parity check fails.
   ============================================================================ */

/* ── the rule names (the page's neg-control toggle reads these) ── */
export const MADELUNG = 'madelung';   // fill by (n+ℓ), then n   — the true rule
export const N_ONLY   = 'n_only';     // fill by  n,    then ℓ   — the wrong rule

/* ── subshell vocabulary ── */
export const SUBNAME = ['s', 'p', 'd', 'f', 'g'];       // ℓ = 0,1,2,3,4
export const CAP = l => 4 * l + 2;                       // 2,6,10,14,18 — sockets in an (n,ℓ) subshell
export const subKey = (n, l) => n + SUBNAME[l];          // (2,1) → '2p'

/* ── build EVERY (n,ℓ) subshell up to a principal-quantum ceiling ── */
function allSubshells(nMax){
  const out = [];
  for(let n = 1; n <= nMax; n++)
    for(let l = 0; l <= n - 1; l++)         // ℓ runs 0..n−1 (the physical constraint)
      out.push({ n, l });
  return out;
}

/* ── THE FILL ORDER — computed, never hardcoded as a list ──────────────────────
   A STABLE sort on integer keys. Madelung: key (n+ℓ, n). Naïve: key (n, ℓ).
   Both are total orders on integers, so the sort is deterministic with no float. */
export function ladder(rule, nMax = 7){
  const subs = allSubshells(nMax);
  const cmp = rule === N_ONLY
    ? (a, b) => (a.n - b.n) || (a.l - b.l)                       // n, then ℓ
    : (a, b) => ((a.n + a.l) - (b.n + b.l)) || (a.n - b.n);      // (n+ℓ), then n
  // a guaranteed-stable sort (Array.sort is stable in modern engines, but we
  // attach an index tiebreak so the order is total and engine-independent).
  return subs.map((s, i) => ({ ...s, i }))
             .sort((a, b) => cmp(a, b) || (a.i - b.i))
             .map(({ n, l }) => ({ n, l, name: subKey(n, l), cap: CAP(l) }));
}
export const madelungOrder = (nMax = 7) => ladder(MADELUNG, nMax);
export const naiveOrder    = (nMax = 7) => ladder(N_ONLY,   nMax);

/* ── THE TWO DECLARED ANOMALIES (nature's real ground state, not the rule's) ── */
export const ANOMALIES = {
  24: { sym: 'Cr', real: '[Ar] 3d⁵ 4s¹', note: 'a half-filled 3d⁵ is bought with a 4s electron' },
  29: { sym: 'Cu', real: '[Ar] 3d¹⁰ 4s¹', note: 'a full 3d¹⁰ is bought with a 4s electron' },
};

/* ── superscript digits, for pretty config strings (1s² not 1s2) ── */
const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
const sup = n => String(n).split('').map(d => SUP[d]).join('');

/* the noble-gas cores, for the collapsed config string ([Ar] 4s² …) */
const NOBLE = [
  { Z: 2,  sym: 'He' }, { Z: 10, sym: 'Ne' }, { Z: 18, sym: 'Ar' },
  { Z: 36, sym: 'Kr' }, { Z: 54, sym: 'Xe' }, { Z: 86, sym: 'Rn' },
];

/* ── GROUND CONFIG — walk the order, drop electrons to capacity until Z spent ──
   Returns occupancy {'1s':2,…}, the ordered list of filled (n,ℓ) with counts,
   the index of the LAST subshell touched (the filling head), config strings
   (plain and noble-gas-collapsed), and an anomaly flag + nature's truth if any. */
export function groundConfig(Z, { rule = MADELUNG, nMax = 7 } = {}){
  if(!Number.isInteger(Z) || Z < 1) throw new Error('Z must be a positive integer');
  const order = ladder(rule, nMax);
  const occupancy = {};
  const filled = [];          // [{n,l,name,count}] in fill order
  let remaining = Z, headIdx = -1;
  for(let i = 0; i < order.length && remaining > 0; i++){
    const s = order[i];
    const put = Math.min(s.cap, remaining);     // integer min — fill to capacity or run out
    occupancy[s.name] = put;
    filled.push({ n: s.n, l: s.l, name: s.name, count: put });
    remaining -= put;
    headIdx = i;
  }
  if(remaining > 0) throw new Error('Z=' + Z + ' exceeds the nMax=' + nMax + ' ladder');

  const configString = filled.map(f => f.name + sup(f.count)).join(' ');
  const configCollapsed = collapse(filled);
  const a = ANOMALIES[Z] || null;
  return {
    Z, rule, occupancy, filled, headIdx,
    configString, configCollapsed,
    anomaly: !!a, anomalyReal: a ? a.real : null, anomalyNote: a ? a.note : null,
  };
}
/* alias kept for the page's verb naming */
export const configFor = groundConfig;

/* collapse the leading noble-gas core into a bracket: [Ar] 4s² 3d⁶ … */
function collapse(filled){
  let coreZ = 0, coreSym = null;
  const cumulative = [];
  let run = 0;
  for(const f of filled){ run += f.count; cumulative.push(run); }
  for(const ng of NOBLE){
    const idx = cumulative.indexOf(ng.Z);
    if(idx >= 0 && idx < filled.length - 1){ coreZ = ng.Z; coreSym = ng.sym; }
  }
  if(!coreSym) return filled.map(f => f.name + sup(f.count)).join(' ');
  let run2 = 0, tail = [];
  for(const f of filled){ run2 += f.count; if(run2 > coreZ) tail.push(f.name + sup(f.count)); }
  return '[' + coreSym + '] ' + tail.join(' ');
}

/* ── PLACE ELECTRON — which (n,ℓ) the Zth electron lands in (the animation index).
   The page reads the filling head ONLY from this — it never re-derives order. ── */
export function placeElectron(rule, Z, nMax = 7){
  if(!Number.isInteger(Z) || Z < 1) throw new Error('Z must be a positive integer');
  const order = ladder(rule, nMax);
  let remaining = Z;
  for(let i = 0; i < order.length; i++){
    const s = order[i];
    if(remaining <= s.cap)
      return { index: i, n: s.n, l: s.l, name: s.name, slot: remaining, cap: s.cap };
    remaining -= s.cap;
  }
  throw new Error('Z=' + Z + ' exceeds the nMax=' + nMax + ' ladder');
}

/* ── PERIOD BOUNDARIES — the Z at which each row closes (a shell-structure fact).
   A period boundary is the cumulative Z immediately BEFORE the order opens a new
   "row" — and a new row is signalled by an s-subshell (ℓ=0) other than 1s. So the
   boundary is the running electron count just before each such s-subshell. This
   makes the boundary set a pure function of the ORDER:

     Madelung  1s 2s 2p 3s 3p 4s 3d 4p 5s …  → before 2s,3s,4s,5s = {2,10,18,36}
     n-only    1s 2s 2p 3s 3p 3d 4s 4p …     → before 2s,3s,4s    = {2,10,28}

   The naïve rule physically BREAKS the table — period 3 swells 8→18 (3d now fills
   before 4s) and the 3rd closure DRIFTS off Argon (18) to 28 — with NO hand-faking;
   the broken set is computed straight from the broken order. ── */
export function periodBoundaries(rule, zMax = 36, nMax = 7){
  const order = ladder(rule, nMax);
  const bounds = [];
  let cumulative = 0;
  for(let i = 0; i < order.length; i++){
    const s = order[i];
    if(s.l === 0 && i > 0 && cumulative > 0 && cumulative <= zMax) bounds.push(cumulative);
    cumulative += s.cap;
    if(cumulative > zMax) break;
  }
  // include the window's own final closure (zMax itself) iff it is a clean shell end
  if(cumulative === zMax && bounds[bounds.length - 1] !== zMax) bounds.push(zMax);
  return bounds;
}
/* alias kept for the design's verb naming */
export const boundaries = periodBoundaries;

/* ── PERIOD LENGTHS — the count of elements in each closed row (boundary deltas).
   Used by the neg-control teeth: Madelung gives [2,8,8,18,…]; naïve swells P3. ── */
export function periodLengths(rule, zMax = 36, nMax = 7){
  const b = periodBoundaries(rule, zMax, nMax);
  const lengths = [];
  let prev = 0;
  for(const z of b){ lengths.push(z - prev); prev = z; }
  return lengths;
}
