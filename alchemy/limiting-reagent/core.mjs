/* ============================================================================
   THE LIMITING REAGENT — core.mjs   (the SOLE math authority for the bench)

   A reaction stops the instant the FIRST reactant runs out. Encode it exactly.

   Given a balanced reaction  c_1·A_1 + … + c_k·A_k  →  d_1·P_1 + … + d_m·P_m
   and a charge of n_i moles loaded onto each reactant pan, the reaction runs to
   an EXTENT ξ (xi) — the number of "reaction turns" it completes. Turn ξ consumes
   c_i·ξ moles of reactant i, so reactant i can sustain at most

        ratio_i = n_i / c_i        turns before its pan empties.

   The reaction can only run as far as its SCARCEST reactant allows:

        ξ = min_i ( n_i / c_i )

   The reactant(s) achieving that minimum are the LIMITING reagent(s) — their pans
   empty exactly at ξ. Every other reactant has  leftover_i = n_i − c_i·ξ > 0 left
   in EXCESS. Each product is made in  yield_p = d_p·ξ  moles. And no atom is lost:
   the element tally of {leftovers + yields} equals the element tally of the
   initial {n_i} — conservation, now stated at the FINAL state of the reaction.

   EXACTNESS: the moles are exact BigInt rationals [n/d]. ξ = min(n_i/c_i) is an
   exact rational comparison (rCmp), so "this pan empties FIRST" and "this pan has
   exactly +1/2 mol left" are machine-exact, never a float epsilon. The whole point
   of this bench is that a tie (perfect stoichiometric pour) is an EXACT win — a
   float ratio like 1/3 could never decide it cleanly. This module never compares,
   adds, or decides on a float; toNum() exists for PIXELS ONLY.

   This module is self-contained (no import) — exactly like its two sibling cores.
   index.html INLINES this file byte-identical between the LIMITING-CORE sentinels;
   core.test.mjs runs it in Node. If the page's inline ever drifts from this file,
   the page's re-extraction parity check fails.
   ============================================================================ */

// ── exact rational on BigInt (num/den, den>0, fully reduced) ─────────────────
export function gcdBig(a, b){ a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while(b){ [a, b] = [b, a % b]; } return a; }
export function ilcm(a, b){ a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  if(a === 0n || b === 0n) return 0n; return a / gcdBig(a, b) * b; }

export function R(n, d = 1n){ n = BigInt(n); d = BigInt(d);
  if(d === 0n) throw new Error('zero denominator');
  if(d < 0n){ n = -n; d = -d; }
  const g = gcdBig(n, d) || 1n; return { n: n / g, d: d / g };
}
export const rAdd = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
export const rSub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
export const rMul = (a, b) => R(a.n * b.n, a.d * b.d);
export const rDiv = (a, b) => R(a.n * b.d, a.d * b.n);
export const rIsZero = a => a.n === 0n;

// ── parse a chemical formula → element→count map (nested parens, multi-letter) ─
// Grafted from the Ledger's nested-group parser: proven to handle Ca(OH)2 →
// {Ca:1,O:2,H:2}, Fe2(SO4)3 → {Fe:2,S:3,O:12}, and multi-letter symbols, so the
// wing can grow toward harder species. Recursive descent: a group's multiplier
// distributes over every element it contains.
export function parseFormula(f){
  let i = 0;
  function atoms(){
    const counts = {};
    while(i < f.length){
      const c = f[i];
      if(c === '('){ i++; const inner = atoms();
        if(f[i] !== ')') throw new Error('unbalanced parens in ' + f); i++;
        const m = number();
        for(const k in inner) counts[k] = (counts[k] || 0) + inner[k] * m; }
      else if(c === ')'){ break; }
      else if(/[A-Z]/.test(c)){ let sym = c; i++;
        while(i < f.length && /[a-z]/.test(f[i])){ sym += f[i]; i++; }
        const m = number(); counts[sym] = (counts[sym] || 0) + m; }
      else throw new Error('bad char "' + c + '" in ' + f);
    }
    return counts;
  }
  function number(){ let s = '';
    while(i < f.length && /[0-9]/.test(f[i])){ s += f[i]; i++; }
    return s === '' ? 1 : parseInt(s, 10); }
  const out = atoms();
  if(i < f.length) throw new Error('unbalanced parens in ' + f);
  return out;
}

// ── build the element-count matrix A: rows=elements, cols=species (products -) ─
export function buildMatrix(reactants, products){
  const species = [...reactants.map(s => ({ f: s, sign: 1n })),
                   ...products.map(s => ({ f: s, sign: -1n }))];
  const parsed = species.map(s => parseFormula(s.f));
  const elems = []; const seen = new Set();
  for(const p of parsed) for(const e of Object.keys(p)) if(!seen.has(e)){ seen.add(e); elems.push(e); }
  const A = elems.map(e => species.map((s, j) => R(BigInt(parsed[j][e] || 0) * s.sign)));
  return { A, elems, species, parsed };
}

// ── solve A·c = 0 for the 1-D integer nullspace → smallest positive ints, or null ─
// Fraction-free over exact rationals (Gaussian elimination to reduced echelon),
// then clear denominators by lcm and divide by gcd. We DEMAND exactly one free
// column (a 1-D nullspace) so "THE balanced equation" is honest — a 2-D nullspace
// returns the "ambiguous" reason rather than a fabricated single answer.
export function solve(reactants, products){
  const { A, elems, species, parsed } = buildMatrix(reactants, products);
  const rows = A.length, cols = species.length;
  const M = A.map(r => r.map(x => R(x.n, x.d)));            // mutable copy
  const pivotCol = []; let pr = 0;
  for(let c = 0; c < cols && pr < rows; c++){
    let piv = -1; for(let r = pr; r < rows; r++) if(!rIsZero(M[r][c])){ piv = r; break; }
    if(piv === -1) continue;
    [M[pr], M[piv]] = [M[piv], M[pr]];
    const inv = M[pr][c];
    for(let c2 = 0; c2 < cols; c2++) M[pr][c2] = rDiv(M[pr][c2], inv);   // normalise pivot → 1
    for(let r = 0; r < rows; r++){ if(r === pr) continue; const factor = M[r][c];
      if(rIsZero(factor)) continue;
      for(let c2 = 0; c2 < cols; c2++) M[r][c2] = rSub(M[r][c2], rMul(factor, M[pr][c2])); }
    pivotCol.push(c); pr++;
  }
  const pivotSet = new Set(pivotCol);
  const freeCols = []; for(let c = 0; c < cols; c++) if(!pivotSet.has(c)) freeCols.push(c);
  // exactly one free column ⇒ a 1-D nullspace (the chemically-meaningful case)
  if(freeCols.length !== 1) return { ok: false,
    reason: freeCols.length === 0
      ? 'no free variable (over-determined / only the trivial solution)'
      : 'nullspace dimension ' + freeCols.length + ' (ambiguous — not a single balanced equation)',
    elems, species, A, parsed };
  const free = freeCols[0];
  const sol = new Array(cols).fill(null);
  sol[free] = R(1n);                                          // set the free var = 1
  for(let k = 0; k < pivotCol.length; k++){ const c = pivotCol[k];
    sol[c] = R(-M[k][free].n, M[k][free].d); }                // each pivot = -(its free-col entry)
  // clear denominators by lcm, force first coef positive, divide out the gcd
  let lcm = 1n; for(const x of sol) lcm = ilcm(lcm, x.d);
  let ints = sol.map(x => x.n * (lcm / x.d));
  if(ints[0] < 0n) ints = ints.map(v => -v);
  let g = 0n; for(const v of ints) g = gcdBig(g, v); if(g === 0n) g = 1n;
  ints = ints.map(v => v / g);
  const allPos = ints.every(v => v > 0n);
  if(!allPos) return { ok: false,
    reason: 'no all-positive nullspace vector (these species cannot balance)',
    elems, species, A, parsed, raw: ints };
  return { ok: true, coef: ints.map(v => Number(v)), coefBig: ints, elems, species, A, parsed };
}

// ── verify a candidate coefficient vector: A·c = 0 exactly, gcd=1, all > 0 ─────
export function verify(reactants, products, coef){
  const { A } = buildMatrix(reactants, products);
  const c = coef.map(v => BigInt(v));
  for(let r = 0; r < A.length; r++){                          // every element conserved exactly
    let acc = R(0n);
    for(let j = 0; j < A[r].length; j++) acc = rAdd(acc, rMul(A[r][j], R(c[j])));
    if(!rIsZero(acc)) return false;
  }
  let g = 0n; for(const v of c) g = gcdBig(g, v);
  if(g !== 1n) return false;                                  // not the SMALLEST integers
  if(!c.every(v => v > 0n)) return false;                     // a real reaction is all-positive
  return true;
}

// ── per-side, per-element tally: {element: totalAtoms} for species × coefficients ─
// coefs may be plain integers OR exact rationals (R). A rational coefficient (a
// leftover/yield in moles) tallies as p·coef, accumulated as an exact rational —
// so the FINAL-state conservation proof below stays machine-exact.
export function tally(formulas, coefs){
  const t = {};
  formulas.forEach((f, i) => { const p = parseFormula(f);
    const c = (typeof coefs[i] === 'object') ? coefs[i] : R(BigInt(coefs[i]));
    for(const e in p) t[e] = rAdd(t[e] || R(0n), rMul(R(BigInt(p[e])), c)); });
  return t;
}

/* ============================================================================
   THE EXACT EXTENT LAYER — the new chemistry this bench adds.
   Everything below decides "which pan empties first, with how much left over,
   and how much product" by exact rational comparison. ZERO floating point.
   ============================================================================ */

// ── exact rational comparison: −1, 0, +1 (denominators are >0, so the sign of the
//    cross-difference n_a·d_b − n_b·d_a IS the true order — no float, no epsilon) ──
export const rCmp = (a, b) => { const d = a.n * b.d - b.n * a.d; return d < 0n ? -1 : d > 0n ? 1 : 0; };
export const rMin = (a, b) => rCmp(a, b) <= 0 ? a : b;

// ── coerce a loose mole quantity → an exact rational R, validated ≥ 0.
//    accepts a BigInt, a plain integer, an [n,d] pair, a {n,d}, or an "a/b" string. ──
function asR(x){
  let r;
  if(typeof x === 'bigint') r = R(x);
  else if(typeof x === 'number'){ if(!Number.isInteger(x)) throw new Error('non-integer mole count ' + x + ' — load exact rationals, never floats'); r = R(BigInt(x)); }
  else if(Array.isArray(x)) r = R(BigInt(x[0]), BigInt(x[1]));
  else if(x && typeof x === 'object' && 'n' in x && 'd' in x) r = R(BigInt(x.n), BigInt(x.d));
  else if(typeof x === 'string'){ const m = x.split('/'); r = R(BigInt(m[0]), BigInt(m[1] === undefined ? '1' : m[1])); }
  else throw new Error('cannot coerce ' + JSON.stringify(x) + ' to a rational mole count');
  if(r.n < 0n) throw new Error('mole count must be ≥ 0 (got ' + r.n + '/' + r.d + ')');
  return r;
}

/* ── the EXTENT of reaction ξ = min_i(n_i/c_i), and everything that follows from it.
   coefReact / coefProd are the balanced integer coefficients; moles is one loose
   quantity per reactant. Returns:
     ratio       = [n_i/c_i]                 (R per reactant)
     xi          = min ratio                 (R — the reaction extent)
     limiters    = [indices achieving xi]    (every pan that empties at ξ)
     limiterIndex= limiters[0]
     leftover    = [n_i − c_i·ξ]             (R per reactant; 0 for a limiter, ≥0 else)
     yield       = [d_p·ξ]                   (R per product)
     tie         = limiters.length === reactants count (every pan empties together)
   THROWS on malformed input — a wrong shape can never silently produce a verdict. ── */
export function extent(coefReact, coefProd, moles){
  if(!Array.isArray(coefReact) || !Array.isArray(coefProd) || !Array.isArray(moles))
    throw new Error('extent: coefReact, coefProd, moles must all be arrays');
  if(coefReact.length !== moles.length)
    throw new Error('extent: moles length (' + moles.length + ') must match reactant count (' + coefReact.length + ')');
  if(coefReact.length === 0) throw new Error('extent: need at least one reactant');
  for(const c of coefReact) if(!(BigInt(c) > 0n)) throw new Error('extent: every reactant coefficient must be > 0 (got ' + c + ')');
  for(const c of coefProd)  if(!(BigInt(c) > 0n)) throw new Error('extent: every product coefficient must be > 0 (got ' + c + ')');

  const n = moles.map(asR);                                  // exact, ≥0 (asR validates)
  const cR = coefReact.map(c => R(BigInt(c)));
  const ratio = n.map((ni, i) => rDiv(ni, cR[i]));           // n_i / c_i  — turns this pan can sustain
  let xi = ratio[0]; for(let i = 1; i < ratio.length; i++) xi = rMin(xi, ratio[i]);
  const limiters = []; for(let i = 0; i < ratio.length; i++) if(rCmp(ratio[i], xi) === 0) limiters.push(i);
  const leftover = n.map((ni, i) => rSub(ni, rMul(cR[i], xi)));      // n_i − c_i·ξ  (exact)
  const yld = coefProd.map(d => rMul(R(BigInt(d)), xi));             // d_p·ξ        (exact)
  const tie = limiters.length === ratio.length;                     // every pan empties together
  return { xi, ratio, limiters, limiterIndex: limiters[0], leftover, yield: yld, tie };
}

/* ── react(): the ONE call the renderer + game make. It solves the equation, splits
   the coefficient vector at the reactant boundary ITSELF (so callers never hand-split),
   and folds in the extent. Returns {ok:false, reason} for an unbalanceable input —
   it NEVER fabricates an extent for a reaction that can't balance. ── */
export function react(reactants, products, moles){
  const s = solve(reactants, products);
  if(!s.ok) return { ok: false, reason: s.reason, reactants, products };
  const coefReact = s.coef.slice(0, reactants.length);
  const coefProd  = s.coef.slice(reactants.length);
  const ext = extent(coefReact, coefProd, moles);
  return { ok: true, coefReact, coefProd, reactants, products, ...ext };
}

/* ── conservedAtFinalState(): the HEADLINE proof — at the END of the reaction, atoms
   are conserved. The element tally of {leftover on each reactant + yield on each
   product} must equal the element tally of the INITIAL {n_i on each reactant},
   element by element, by exact rational comparison (rCmp === 0). This is the
   reaction's conservation law stated where the bench enacts it: after one pan ran dry. ── */
export function conservedAtFinalState(reactants, products, moles){
  const r = react(reactants, products, moles);
  if(!r.ok) return false;
  const initial = tally(reactants, moles.map(asR));                          // atoms loaded in
  const finalReact = tally(reactants, r.leftover);                          // atoms left on reactant pans
  const finalProd  = tally(products,  r.yield);                             // atoms now in products
  // merge the two final tallies into one element map (exact rational sums)
  const finalAll = {};
  for(const e in finalReact) finalAll[e] = rAdd(finalAll[e] || R(0n), finalReact[e]);
  for(const e in finalProd)  finalAll[e] = rAdd(finalAll[e] || R(0n), finalProd[e]);
  const elems = new Set([...Object.keys(initial), ...Object.keys(finalAll)]);
  for(const e of elems){
    const a = initial[e] || R(0n), b = finalAll[e] || R(0n);
    if(rCmp(a, b) !== 0) return false;
  }
  return true;
}

// ── DISPLAY ONLY. toNum collapses an exact rational to a float for PIXEL positions
//    and cosmetic glow. It is FORBIDDEN in any verdict — a pan empties / a tie wins
//    by rIsZero(leftover_i) and limiters.length, NEVER by a float epsilon. ──
export const toNum = r => Number(r.n) / Number(r.d);

/* ============================================================================
   THE REACTION LIBRARY — real, curated single-solution reactions + 1 control.
   The same library the Reaction Balancer next door uses. The BENCH rack filters
   to the 2-reactant non-negative entries (the brass beam has two sides); the full
   library is KEPT here so the Node twin can exercise the 3-reagent tarnish case
   and the negative control — the extent math generalises beyond two pans.
   ============================================================================ */
export const LIBRARY = [
  { id: 'water',     name: 'Synthesis of water',        cat: 'classic',
    reactants: ['H2', 'O2'],            products: ['H2O'],          expect: [2, 1, 2] },
  { id: 'methane',   name: 'Combustion of methane',     cat: 'classic',
    reactants: ['CH4', 'O2'],           products: ['CO2', 'H2O'],   expect: [1, 2, 1, 2] },
  { id: 'ammonia',   name: 'Haber process (ammonia)',   cat: 'classic',
    reactants: ['N2', 'H2'],            products: ['NH3'],          expect: [1, 3, 2] },
  { id: 'rust',      name: 'Rusting of iron',           cat: 'classic',
    reactants: ['Fe', 'O2'],            products: ['Fe2O3'],        expect: [4, 3, 2] },
  { id: 'glucose',   name: 'Respiration (glucose)',     cat: 'classic',
    reactants: ['C6H12O6', 'O2'],       products: ['CO2', 'H2O'],   expect: [1, 6, 6, 6] },
  { id: 'thermite',  name: 'Thermite',                  cat: 'classic',
    reactants: ['Fe2O3', 'Al'],         products: ['Fe', 'Al2O3'],  expect: [1, 2, 2, 1] },
  { id: 'slaked',    name: 'Slaked lime + acid gas',    cat: 'groups',
    reactants: ['Ca(OH)2', 'CO2'],      products: ['CaCO3', 'H2O'], expect: [1, 1, 1, 1] },
  { id: 'gypsum',    name: 'Gypsum from quicklime',     cat: 'groups',
    reactants: ['Ca(OH)2', 'H2SO4'],    products: ['CaSO4', 'H2O'], expect: [1, 1, 1, 2] },
  { id: 'phosphate', name: 'Calcium phosphate',         cat: 'groups',
    reactants: ['Ca(OH)2', 'H3PO4'],    products: ['Ca3(PO4)2', 'H2O'], expect: [3, 2, 1, 6] },
  // ── 3-reactant case (KEPT for the Node twin; the 2-pan bench rack filters it out) ──
  { id: 'tarnish',   name: 'Tarnishing of silver',      cat: 'groups',
    reactants: ['Ag', 'H2S', 'O2'],     products: ['Ag2S', 'H2O'],  expect: [4, 2, 1, 2, 2] },
  // ── NEGATIVE CONTROL: cannot balance (Na appears on neither side's partner) ──
  { id: 'bogus',     name: 'Negative control (impossible)', cat: 'control', negative: true,
    reactants: ['H2', 'O2'],            products: ['H2O', 'Na'] },
];
