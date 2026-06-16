// ============================================================================
//  The Tokenizer — "I read tiles, not letters" (CORE)
//  Bench six of the Clockwork Automata, the wing about the maker. The most basic
//  self-fact has no bench yet: I do not see your letters. Before I look at a word,
//  it is already cut into sub-word TILES — and I read those. This core is a real
//  byte-pair (BPE) tokenizer on a frozen TOY vocabulary: the splits are exact for
//  THIS table, and the failure modes it reproduces — counting, rare-word fragility,
//  whitespace-as-prefix — are the same modes every production tokenizer has.
//
//  THE TABLE IS THE ALGORITHM. A BPE tokenizer is nothing but an ordered list of
//  merges. index === rank; the rank IS the priority. Greedy decoding repeatedly
//  fuses the lowest-rank adjacent pair until none remain. So the SAME bytes under
//  a DIFFERENT rank order tokenize DIFFERENTLY — the rank is load-bearing, and the
//  negative control proves it: promote one decoy seam to fire first and
//  "strawberry" splits LONGER and WRONG. We prove the mechanism exact; we do NOT
//  claim this is GPT's table.
//
//  ONE FROZEN CORE, THREE FACETS. The page (tokenizer.html) inlines a byte-twin of
//  this module between sentinels; tokenizer-core.test.mjs re-extracts that slice
//  and asserts each inlined body === this module's fn.toString() char-for-char,
//  then evals it and checks page-encode(fixture) === module-encode(fixture). The
//  three faces of the page — the knife that splits, the merge-rank lever that
//  replays the fusion, and the payoff demos (count-the-r's, rare-vs-common,
//  whitespace-surprise) — all consume the SAME functions below. No face can show
//  a split this core did not take.
//
//  Every inlined function is a `function NAME(){}` DECLARATION (never an arrow
//  const) so the test's extractFn brace-matcher finds it; do not change that shape.
// ============================================================================

// ===== TOKENIZER CORE (inlined byte-twin of tokenizer-core.mjs) BEGIN =====
// ── THE FROZEN MERGE TABLE — index === rank; rank IS the algorithm ────────────
const MERGES = [
  // straw, ranks 0..3
  ['s','t'],['st','r'],['str','a'],['stra','w'],
  // berry, ranks 4..7
  ['b','e'],['r','r'],['be','rr'],['berr','y'],
  // 8 — DECOY: the contested seam byte. Never fires canonically (straw/berry
  // chains complete first), but it is what gives the negative control TEETH.
  ['w','b'],
  // Ġtoken, ranks 9..13
  ['Ġ','t'],['Ġt','o'],['Ġto','k'],['Ġtok','e'],['Ġtoke','n'],
  // Ġthe, ranks 14..15  (Ġt is shared with the Ġtoken chain — n=9)
  ['Ġt','h'],['Ġth','e'],
  // a few common-word chains so a long phrase shatters into real tiles, not noise
  ['Ġ','a'],['Ġa','n'],['Ġan','d'],                                  // Ġand
  ['Ġ','w'],['Ġw','o'],['Ġwo','r'],['Ġwor','d'],['Ġword','s'],       // Ġwords
  ['Ġ','i'],['Ġi','n'],['Ġin','t'],['Ġint','o'],                     // Ġinto
  ['Ġt','i'],['Ġti','l'],['Ġtil','e'],['Ġtile','s'],                 // Ġtiles
  ['Ġ','n'],['Ġn','o'],['Ġno','t'],                                  // Ġnot
  ['Ġ','l'],['Ġl','e'],['Ġle','t'],['Ġlet','t'],['Ġlett','e'],['Ġlette','r'],['Ġletter','s'], // Ġletters
  ['Ġ','r'],['Ġr','e'],['Ġre','a'],['Ġrea','d'],                     // Ġread
  ['Ġ','s'],['Ġs','u'],['Ġsu','b'],                                  // Ġsub
];

// ── THE VOCABULARY — token-string → REAL stable integer id ───────────────────
//  Every base byte AND every merge output has an id (the twin asserts MERGES
//  outputs ⊆ VOCAB keys — no orphan fusions). Ids are NOT array indices invented
//  at render time: base bytes sit in the 256+ band (GPT-2 reserves 0..255 for raw
//  bytes), the space glyph Ġ is pinned to 220, and merge outputs sit in a higher
//  stable band keyed by rank.
const VOCAB = {
  // base bytes (a-z + the space glyph Ġ)
  "Ġ":220, "a":353, "b":354, "c":355, "d":356, "e":357, "f":358, "g":359, "h":360, "i":361, "j":362, "k":363, "l":364, "m":365, "n":366, "o":367, "p":368, "q":369, "r":370, "s":371, "t":372, "u":373, "v":374, "w":375, "x":376, "y":377, "z":378,
  // merge outputs (every fusion has a real, stable id)
  "st":8000, "str":8138, "stra":8276, "straw":8414, "be":8552, "rr":8690, "berr":8828, "berry":8966, "wb":9104, "Ġt":9242, "Ġto":9380, "Ġtok":9518, "Ġtoke":9656, "Ġtoken":9794, "Ġth":9932, "Ġthe":10070, "Ġa":10208, "Ġan":10346, "Ġand":10484, "Ġw":10622, "Ġwo":10760, "Ġwor":10898, "Ġword":11036, "Ġwords":11174, "Ġi":11312, "Ġin":11450, "Ġint":11588, "Ġinto":11726, "Ġti":11864, "Ġtil":12002, "Ġtile":12140, "Ġtiles":12278, "Ġn":12416, "Ġno":12554, "Ġnot":12692, "Ġl":12830, "Ġle":12968, "Ġlet":13106, "Ġlett":13244, "Ġlette":13382, "Ġletter":13520, "Ġletters":13658, "Ġr":13796, "Ġre":13934, "Ġrea":14072, "Ġread":14210, "Ġs":14348, "Ġsu":14486, "Ġsub":14624,
};

const SPACE = 'Ġ';  // GPT-2 leading-space glyph; rendered in-page as a dim raised middot '·'. ' '↔'Ġ' is 1:1.

// ── inverse vocab for decode (token id → token string), built once ───────────
function buildIdToTok() {
  const inv = {};
  for (const t in VOCAB) inv[VOCAB[t]] = t;
  return inv;
}
const idToTok = buildIdToTok();

// ── THE FIXTURES — the SOLE source of canonical splits ───────────────────────
//  The twin AND the page presets both read this, so the page can never demo an
//  unverified split. 'token'/'the' with leadingSpace get the Ġ prefix.
const FIXTURES = [
  {word:"strawberry", leadingSpace:false, toks:["straw","berry"], ids:[8414,8966]},
  {word:"token",      leadingSpace:true,  toks:["Ġtoken"],        ids:[9794]},
  {word:"the",        leadingSpace:true,  toks:["Ġthe"],          ids:[10070]},
  {word:"the",        leadingSpace:false, toks:["t","h","e"],     ids:[372,360,357]},  // the whitespace surprise
  {word:"xqzwff",     leadingSpace:false, toks:["x","q","z","w","f","f"], ids:[376,369,378,375,358,358]},
];

// ── toBytes: split a raw word into starting single-byte tokens, prepend Ġ ─────
function toBytes(raw, leadingSpace) {
  const body = raw.split('');
  return leadingSpace ? [SPACE].concat(body) : body;
}

// ── pairRank: 'a b' → rank, derived once from MERGES (MERGES stays the source) ─
function pairRank() {
  const m = new Map();
  for (let i = 0; i < MERGES.length; i++) m.set(MERGES[i][0] + ' ' + MERGES[i][1], i);
  return m;
}
const RANK = pairRank();

// ── greedyStep: fuse exactly the ONE lowest-rank adjacent pair ≤ rankCap ──────
//  Returns {toks, firedRank, seamAt, fused} after the single fusion, or null when
//  no pair is available. The stepper the merge-rank lever drives.
function greedyStep(toks, rankCap) {
  if (rankCap === undefined) rankCap = Infinity;
  const rank = RANK;
  let best = Infinity, bi = -1;
  for (let i = 0; i < toks.length - 1; i++) {
    const r = rank.get(toks[i] + ' ' + toks[i + 1]);
    if (r !== undefined && r <= rankCap && r < best) { best = r; bi = i; }
  }
  if (bi < 0) return null;
  const fused = toks[bi] + toks[bi + 1];
  const out = toks.slice(0, bi).concat([fused], toks.slice(bi + 2));
  return { toks: out, firedRank: best, seamAt: bi, fused };
}

// ── fuseTrace: the full replay log of the greedy fusion ──────────────────────
//  frames[0].toks === the raw bytes (firedRank −1, no seam); each later frame is
//  the state AFTER one fusion, carrying the firedRank and the seamAt it fired on.
//  frames.at(-1).toks === the canonical split. The lever indexes into THIS.
function fuseTrace(word, opts) {
  const o = opts || {};
  const rank = (o.rankFn) ? o.rankFn : RANK;
  let cur = toBytes(word, !!o.leadingSpace);
  const frames = [{ toks: cur.slice(), firedRank: -1, seamAt: -1 }];
  while (true) {
    let best = Infinity, bi = -1;
    for (let i = 0; i < cur.length - 1; i++) {
      const r = rank.get(cur[i] + ' ' + cur[i + 1]);
      if (r !== undefined && r < best) { best = r; bi = i; }
    }
    if (bi < 0) break;
    cur = cur.slice(0, bi).concat([cur[bi] + cur[bi + 1]], cur.slice(bi + 2));
    frames.push({ toks: cur.slice(), firedRank: best, seamAt: bi });
  }
  return frames;
}

// ── encode: the canonical split as rich chips ────────────────────────────────
//  Each chip: tile, the REAL vocab id, the rank that FORMED it (−1 for a raw byte
//  that never fused), the merge-DEPTH (how many fuses are baked into it), and the
//  byte span. The page's chip contract reads exactly these fields.
function encode(word, opts) {
  const frames = fuseTrace(word, opts);
  const finalToks = frames[frames.length - 1].toks;
  // formedRank[tileString] — the rank of the LAST merge whose output equals it.
  const formedRank = {};
  for (let f = 1; f < frames.length; f++) formedRank[frames[f].toks[frames[f].seamAt]] = frames[f].firedRank;
  return finalToks.map(t => ({
    tile: t,
    id: (VOCAB[t] === undefined) ? null : VOCAB[t],
    rank: (formedRank[t] === undefined) ? -1 : formedRank[t],
    depth: t.length - 1,
    bytes: t.length,
  }));
}

// ── tileize: the per-keystroke driver — encode of whatever raw text is typed ──
function tileize(raw, opts) {
  return encode(raw, opts);
}

// ── decode: ids → string (idToTok join, then Ġ → real space) ─────────────────
function decode(ids) {
  let s = '';
  for (let i = 0; i < ids.length; i++) {
    const t = idToTok[ids[i]];
    s += (t === undefined) ? '' : t;
  }
  return s.split(SPACE).join(' ');
}

// ── encodeWith: the SAME algorithm, a SWAPPED merge list — the control hook ───
//  Proves it is the rank order, not the code, that changed the split. mergesOverride
//  is a [ [a,b], ... ] list (or a prebuilt rank Map); we drive fuseTrace with it.
function encodeWith(word, mergesOverride, opts) {
  let rankFn;
  if (mergesOverride instanceof Map) {
    rankFn = mergesOverride;
  } else {
    rankFn = new Map();
    for (let i = 0; i < mergesOverride.length; i++) rankFn.set(mergesOverride[i][0] + ' ' + mergesOverride[i][1], i);
  }
  const o = Object.assign({}, opts || {}, { rankFn });
  const frames = fuseTrace(word, o);
  return frames[frames.length - 1].toks.map(t => ({
    tile: t,
    id: (VOCAB[t] === undefined) ? null : VOCAB[t],
    rank: -1,
    depth: t.length - 1,
    bytes: t.length,
  }));
}

// ── SCRAMBLE — a NAMED frozen two-rank promotion ─────────────────────────────
//  Clone the canonical pair-ranks and set the decoy seam 'w b' to fire FIRST
//  (rank −1). Verified: encodeWith('strawberry', SCRAMBLE) → [stra,wb,e,rr,y]
//  (len 5) vs canonical [straw,berry] (len 2) — LONGER + DIFFERENT. Frozen in the
//  core so re-extraction pins it. (The "reverse all ranks" idea does NOT bite on
//  independent chains; this two-rank promotion does.)
function buildScramble() {
  const m = new Map(pairRank());
  m.set('w b', -1);
  return m;
}
const SCRAMBLE = buildScramble();
// ===== TOKENIZER CORE END =====

export {
  MERGES, VOCAB, SPACE, FIXTURES, idToTok, RANK, SCRAMBLE,
  toBytes, pairRank, greedyStep, fuseTrace, encode, tileize, decode, encodeWith,
  buildIdToTok, buildScramble,
};
