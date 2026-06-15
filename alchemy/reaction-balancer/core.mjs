/* ============================================================================
   THE REACTION BALANCER — core.mjs   (the SOLE math authority for the bench)

   A balanced chemical equation is a statement about CONSERVATION OF MATTER:
   no atom is created or destroyed across the arrow. Encode it as a matrix.

     • Let the species be  s_1 … s_n  (reactants then products).
     • Build A: rows = elements, cols = species, where A[e][j] = (# of element e
       in species j), and PRODUCT COLUMNS ARE NEGATED.
     • A coefficient vector c (one whole number per species) balances the
       reaction  ⇔  A · c = 0  (every element's atoms on the left equal those on
       the right). That is conservation of matter, written as a kernel condition.

   So balancing IS finding the NULLSPACE of A. For a chemically-meaningful single
   reaction that nullspace is 1-dimensional; we read off its one direction and
   clear it to the SMALLEST POSITIVE INTEGERS. There is no guessing and no search.

   EXACTNESS: every number here is an integer or an exact BigInt rational [n/d]
   reduced by gcd. There is ZERO floating point anywhere in the solve — the claim
   "these coefficients balance" is machine-exact, not "close enough".

   This module is the single source of truth. index.html INLINES this file
   byte-identical between sentinels; core.test.mjs runs it in Node. If the page's
   inline ever drifts from this file, the page's re-extraction parity check fails.
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
export function tally(formulas, coefs){
  const t = {};
  formulas.forEach((f, i) => { const p = parseFormula(f);
    for(const e in p) t[e] = (t[e] || 0) + p[e] * coefs[i]; });
  return t;
}

/* ============================================================================
   THE REACTION LIBRARY  — real, curated single-solution reactions + 1 control.
   Each is kept to a 1-D nullspace so "THE balanced equation" stays honest.
   The 7 the prototype proves, extended toward 10 with the Ledger's harder
   nested-group species (slaked lime, gypsum, the tarnishing of silver).
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
  // ── extended with the Ledger's harder nested-group species (toward 10) ──
  { id: 'gypsum',    name: 'Gypsum from quicklime',     cat: 'groups',
    reactants: ['Ca(OH)2', 'H2SO4'],    products: ['CaSO4', 'H2O'], expect: [1, 1, 1, 2] },
  { id: 'phosphate', name: 'Calcium phosphate',         cat: 'groups',
    reactants: ['Ca(OH)2', 'H3PO4'],    products: ['Ca3(PO4)2', 'H2O'], expect: [3, 2, 1, 6] },
  { id: 'tarnish',   name: 'Tarnishing of silver',      cat: 'groups',
    reactants: ['Ag', 'H2S', 'O2'],     products: ['Ag2S', 'H2O'],  expect: [4, 2, 1, 2, 2] },
  // ── NEGATIVE CONTROL: cannot balance (Na appears on neither side's partner) ──
  { id: 'bogus',     name: 'Negative control (impossible)', cat: 'control', negative: true,
    reactants: ['H2', 'O2'],            products: ['H2O', 'Na'] },
];
