// ── The move-grammar of string figures. This block is the SOLE AUTHORITY; a Node
//    twin (cradle-core.test.mjs in the shipped bench) re-extracts it byte-for-byte
//    and the in-page chip calls the SAME runSelfTest(). ──────────────────────────
//
// THE MODEL. A pair of hands gives TEN finger-pegs, indexed 0..9:
//   0 L-thumb 1 L-index 2 L-middle 3 L-ring 4 L-pinky   5 R-pinky 6 R-ring 7 R-middle 8 R-index 9 R-thumb
// A string-figure STATE is a set of LOOPS. A loop is a closed cycle of pegs the
// string wraps, written as an ordered peg-cycle [p0,p1,...] (the string runs p0→p1
// →…→p0). A loop "sits on" peg p if p ∈ its cycle. Two loops may share a peg (the
// near and far loops of cat's cradle famously share the index/pinky).
//
// A PICKUP is the atomic legal move: a named finger reaches ACROSS, hooks a
// designated string segment, and lifts it back — adding/retargeting loops. We model
// a pickup as a PRECONDITION (which pegs must carry which loops) + an EFFECT (the
// new loop set). The grammar's authority is two functions:
//   • legalMoves(state)  — the pickups whose precondition the state satisfies.
//   • applyMove(state,id) — returns {ok, state} ; ok=false (state unchanged) when id
//                           is NOT in legalMoves (an ILLEGAL pickup is REJECTED).
// A canonical FIGURE is the state reached by walking the canonical move-path from
// the Opening. figureOf(state) names it by matching the loop-set to the catalogue.
//
// THE NEG-CONTROL (the teeth). vacuousApply(state,id) ALWAYS returns ok:true and a
// non-empty figure — it never checks the precondition. runSelfTest proves that the
// real applyMove REJECTS at least one illegal pickup the vacuous one accepts; if the
// teeth ever stop biting (vacuous == real on the reject set) the test FAILS. So the
// test cannot pass vacuously: a do-nothing grammar that accepts everything fails.
//
// HONESTY. What is proven is exact and bounded: that THIS catalogue of figures is
// reached by legal pickups only, that the canonical path is a chain of legal moves,
// and that illegal pickups are rejected (the figure does not form). It is not a
// claim that every traditional string figure in the world is in the catalogue.

export const PEGS = Object.freeze(['LT','LI','LM','LR','LP','RP','RR','RM','RI','RT']);
export const PEG_NAME = Object.freeze({
  LT:'left thumb', LI:'left index', LM:'left middle', LR:'left ring', LP:'left pinky',
  RP:'right pinky', RR:'right ring', RM:'right middle', RI:'right index', RT:'right thumb'
});

// A loop is {pegs:[...], tag}. Canonical equality compares the SET of loops by their
// canonicalised peg-cycles (rotation+direction independent — a loop has no start).
export function canonLoop(pegs){
  // canonical rotation: start at the lexicographically smallest peg; pick the
  // direction (fwd/rev) giving the lexicographically smaller sequence.
  const n = pegs.length;
  if(n === 0) return '';
  let best = null;
  for(const dir of [pegs, [...pegs].reverse()]){
    for(let s=0; s<n; s++){
      const rot = [];
      for(let k=0;k<n;k++) rot.push(dir[(s+k)%n]);
      const str = rot.join('>');
      if(best === null || str < best) best = str;
    }
  }
  return best;
}
export function canonState(state){
  return state.loops.map(l=>canonLoop(l.pegs)).sort().join('|');
}
export function pegsOf(state){ // set of pegs carrying at least one loop
  const s = new Set();
  for(const l of state.loops) for(const p of l.pegs) s.add(p);
  return s;
}
export function loopsOn(state, peg){ return state.loops.filter(l=>l.pegs.includes(peg)).length; }

// ── THE CATALOGUE OF PICKUPS. Each has id, label, hint (which finger does what),
//    pre(state)→bool (the precondition), and eff(state)→newState (the effect).
//    The canonical sequence walks them in order; legalMoves filters by pre. ──────
// The OPENING ("Opening A"): the loop runs round both wrists, palms hold a straight
// strand picked up by each opposing hand — modelled as one big loop on all 10 pegs.
export function opening(){
  return { loops:[ { pegs:[...PEGS], tag:'opening' } ] };
}

export const CATALOGUE = [
  {
    id:'cradle', label:'Form the Cradle', seq:1,
    hint:'each opposing middle finger picks up the far palmar string',
    pre:(s)=> figureKey(s) === 'opening',
    eff:()=> ({ loops:[
      { pegs:['LT','RT','RM','LM'], tag:'near' },
      { pegs:['LP','RP','RM','LM'], tag:'far'  }
    ]})
  },
  {
    id:'soldiersbed', label:"Soldier's Bed", seq:2,
    hint:'partner pinches the two crosses, draws them out, under and up through the centre',
    pre:(s)=> figureKey(s) === 'cradle',
    eff:()=> ({ loops:[
      { pegs:['LT','RT','RI','LI'], tag:'bed-near' },
      { pegs:['LP','RP','RI','LI'], tag:'bed-far'  }
    ]})
  },
  {
    id:'candles', label:'Candles (Manger ⇄)', seq:3,
    hint:'pinch the two side strings, lift them over the long top strings, and open',
    pre:(s)=> figureKey(s) === 'soldiersbed',
    eff:()=> ({ loops:[
      { pegs:['LI','RI'], tag:'candle-L' },
      { pegs:['LM','RM'], tag:'candle-R' },
      { pegs:['LT','RT','RP','LP'], tag:'frame' }
    ]})
  },
  {
    id:'manger', label:'The Manger (Diamonds)', seq:4,
    hint:'thumbs and pinkies pick up the near index strings; release the indices and open wide',
    pre:(s)=> figureKey(s) === 'candles',
    eff:()=> ({ loops:[
      { pegs:['LT','LP','RP','RT'], tag:'manger-frame' },
      { pegs:['LM','RM','RT','LT'], tag:'diamond-A' },
      { pegs:['LM','RM','RP','LP'], tag:'diamond-B' }
    ]})
  }
];
export const CATALOGUE_BY_ID = Object.freeze(Object.fromEntries(CATALOGUE.map(m=>[m.id,m])));

// figureKey: which catalogued figure (or 'opening'/'unknown') this state IS.
export const FIG_KEYS = (()=>{
  const m = { [canonState(opening())]:'opening' };
  let s = opening();
  for(const mv of CATALOGUE){ s = mv.eff(s); m[canonState(s)] = mv.id; }
  return m;
})();
export function figureKey(state){ return FIG_KEYS[canonState(state)] || 'unknown'; }
export const FIG_TITLE = Object.freeze({
  opening:'The Opening', cradle:'The Cradle', soldiersbed:"Soldier's Bed",
  candles:'Candles', manger:'The Manger', unknown:'(an unnamed tangle)'
});

// legalMoves(state): the pickups whose precondition holds here. The grammar's core.
export function legalMoves(state){ return CATALOGUE.filter(m=>m.pre(state)); }
export function isLegal(state, id){ return legalMoves(state).some(m=>m.id===id); }

// applyMove: REJECTS an illegal pickup (state unchanged, ok:false). The whole claim.
export function applyMove(state, id){
  if(!isLegal(state, id)) return { ok:false, state, reason:'illegal pickup' };
  return { ok:true, state: CATALOGUE_BY_ID[id].eff(state) };
}

// THE NEG-CONTROL: a vacuous "renderer" that accepts ANY pickup and always claims a
// figure formed. The self-test proves real applyMove rejects what this accepts.
export function vacuousApply(state, id){
  return { ok:true, state: { loops:[ { pegs:['LT','RT'], tag:'fake' } ] } };
}

// The canonical path the bench walks: a chain of legal moves Opening→Manger.
export const CANON_PATH = ['cradle','soldiersbed','candles','manger'];

// ── THE SELF-TEST. The Node twin and the in-page chip call THIS. ───────────────
export function runSelfTest(){
  const checks = [];
  const ck = (name, ok)=> checks.push({ name, ok: !!ok });

  // 1. the canonical path is a chain of LEGAL moves, each forming the next figure.
  let s = opening();
  ck('opening names "opening"', figureKey(s) === 'opening');
  let pathOk = true, formedAll = true;
  for(let i=0;i<CANON_PATH.length;i++){
    const id = CANON_PATH[i];
    if(!isLegal(s, id)) pathOk = false;
    const r = applyMove(s, id);
    if(!r.ok) { pathOk = false; break; }
    s = r.state;
    if(figureKey(s) !== id) formedAll = false;
  }
  ck('canonical path is all legal moves', pathOk);
  ck('each legal pickup forms exactly the next figure', formedAll);
  ck('the path ends at The Manger (Diamonds)', figureKey(s) === 'manger');

  // 2. from EACH figure, exactly the catalogued next move is legal (a deterministic
  //    grammar — no spurious legal pickups, the path is forced).
  let detOk = true; s = opening();
  const expectLegal = [...CANON_PATH, null];
  for(let i=0;i<expectLegal.length;i++){
    const legal = legalMoves(s).map(m=>m.id);
    const want = expectLegal[i];
    if(want === null){ if(legal.length !== 0) detOk = false; }
    else { if(!(legal.length === 1 && legal[0] === want)) detOk = false; }
    if(want !== null){ s = applyMove(s, want).state; }
  }
  ck('grammar is deterministic (one legal pickup per figure, forced)', detOk);

  // 3. ILLEGAL pickups are REJECTED — the figure does NOT form. From the Opening,
  //    every move EXCEPT 'cradle' must be rejected (state unchanged).
  s = opening();
  const illegalFromOpening = CATALOGUE.map(m=>m.id).filter(id=>id!=='cradle');
  let allRejected = true, stateUnchanged = true;
  const before = canonState(s);
  for(const id of illegalFromOpening){
    const r = applyMove(s, id);
    if(r.ok) allRejected = false;
    if(canonState(r.state) !== before) stateUnchanged = false;
  }
  ck('illegal pickups from the Opening are all rejected', allRejected);
  ck('a rejected pickup leaves the string unchanged', stateUnchanged);

  // 4. you cannot SKIP a step: 'manger' is illegal until 'candles' has been formed.
  ck('cannot skip ahead — Manger illegal before Candles', !isLegal(opening(), 'manger') &&
     !isLegal(applyMove(opening(),'cradle').state, 'manger'));

  // 5. canonical loop equality is rotation+direction invariant (the same loop drawn
  //    starting anywhere, either way round, is the SAME loop).
  ck('loop equality is rotation-invariant',
     canonLoop(['LT','RT','RM','LM']) === canonLoop(['RM','LM','LT','RT']));
  ck('loop equality is direction-invariant',
     canonLoop(['LT','RT','RM','LM']) === canonLoop(['LM','RM','RT','LT']));

  // 6. THE NEG-CONTROL (the teeth). The vacuous renderer accepts an illegal pickup
  //    that the real grammar rejects — so they DISAGREE on the reject set. If they
  //    ever agreed (a do-nothing grammar that accepts all), this check FAILS.
  s = opening();
  const realRej = applyMove(s, 'manger');           // real: rejected
  const vacRej  = vacuousApply(s, 'manger');         // vacuous: accepted
  ck('NEG-CONTROL: vacuous renderer accepts what the grammar rejects (teeth bite)',
     vacRej.ok === true && realRej.ok === false);

  // 7. the figure dictionary is consistent: distinct figures have distinct loop-sets.
  let s2 = opening(); const keys = new Set([canonState(s2)]); let distinct = true;
  for(const id of CANON_PATH){ s2 = applyMove(s2, id).state; const k = canonState(s2); if(keys.has(k)) distinct = false; keys.add(k); }
  ck('every figure on the path has a distinct loop-set', distinct);

  const pass = checks.filter(c=>c.ok).length;
  return { pass, total: checks.length, checks };
}
