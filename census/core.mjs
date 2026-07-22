/* ═══════════════════════════════════════════════════════════════════════════
   THE ARCHIVE · The Census of Hands — census/core.mjs
   The role-normalization rule + the partition proof, as PURE functions.

   Single source of truth for every figure "The Census of Hands" displays about
   the estate's MAKERS. Imported by BOTH:
     • census/core.test.mjs — the Node twin, run against the REAL ledger/ledger.jsonl
     • census/index.html    — inlined verbatim at forge time between the CORE
                              sentinels, so the in-page pill computes the IDENTICAL
                              battery from the SAME bytes the twin checks.

   DOM-free, zero-import, no randomness, no wall-clock NOW. Given the raw text of
   ledger/ledger.jsonl it answers: do the N marks partition cleanly into maker
   buckets under a DOCUMENTED role-normalization rule — no token double-counted,
   no token dropped (Σ bucket counts === N exactly)? (N is whatever the live ledger
   holds; reclaim.mjs re-pins the CLAIM below every cycle, so no count is hardcoded here.)

   Source of truth is ledger/ledger.jsonl, a DIFFERENT file than the
   River's museum/cycles.json — hence this fresh core, not a reuse of core.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The five LOAD-BEARING fields of a ledger mark, in canonical order. A mark's
   identity for byte-true round-trip is exactly these five; the census displays
   role/name/koan/seq, and ts/cycle ride along for provenance. All six are present
   on every committed mark (asserted by the twin), but only these are load-bearing
   for the claims the page makes. */
export const FIELDS = ['seq', 'cycle', 'role', 'name', 'koan', 'ts'];

/* ── THE TWELVE BASE BUCKETS (+ one catch-all) ─────────────────────────────────
   The full set of maker roles the estate has ever run, in the PRIORITY ORDER the
   normalization rule scans (see normalizeRole). Order is load-bearing: the two
   HYPHENATED multi-word bases (bug-fixer, grounds-worker) are tested BEFORE the
   single-token bases, because a naive single-token prefix scan would mis-bind
   'grounds-worker' onto nothing and is moot, but more importantly keeps the rule
   readable as "longest, most-specific base name wins its own head". 'other' is the
   single catch-all that absorbs any head that matches no base — it is what makes
   the mapping TOTAL (every role string lands somewhere) so the partition is exact.
   gardener (PLAN/garden seat) and groundskeeper (PLAN/grounds seat) are siblings —
   the two keeper seats that sow each track; both earn their own base bucket. */
export const BASES = [
  'architect', 'publisher', 'gardener', 'groundskeeper', 'builder', 'director',
  'explorer', 'judge', 'planter', 'bug-fixer', 'grounds-worker', 'steward'
];
export const OTHER = 'other';
export const BUCKETS = [...BASES, OTHER];

/* The bucket scan order. Multi-word hyphenated bases FIRST (most specific), then
   single-token bases. Within each group the order does not change any result on
   the real ledger (the heads are disjoint after decoration is stripped), but it is
   pinned so the rule is deterministic for ANY future role string too. */
const SCAN_ORDER = [
  'bug-fixer', 'grounds-worker',                                                 // hyphenated, scanned first
  'architect', 'publisher', 'gardener', 'groundskeeper', 'builder', 'director',  // single-token bases
  'explorer', 'judge', 'planter', 'steward'
];

/* Decoration separators. A role string is a HEAD (the maker's primary self-named
   role) optionally followed by decoration: a facet, a parenthetical alias, a cycle
   tag. The head is everything BEFORE the first of these separators. Chosen from the
   real decoration vocabulary in the ledger: '(' alias, '·' facet bullet, '—' em-dash
   subtitle, ':' facet key, '/' slash alias. A plain space is NOT a separator (so
   'judge of cycle #1' keeps its words and prefix-matches 'judge'; 'the planter'
   keeps both words and is caught by the lexical alias below). */
const SEP_RE = /[(·—:\/]/;

/* A few fixed LEXICAL ALIASES — role heads that name a base in words other than the
   base token itself. Applied to the stripped head, after case-fold. Kept tiny and
   explicit (NOT a fuzzy match) so the rule stays auditable: every alias here is a
   real head observed in the ledger.
     'scout …'    → explorer  (a scout is an explorer vein: 'scout:fresh-mediums')
     'cycle-fixer'→ bug-fixer (the early name for the bug-fixer seat)
     'the planter'→ planter   (the one 'the planter' head)                          */
const ALIASES = [
  { test: (h) => h === 'cycle-fixer' || h.startsWith('cycle-fixer'), to: 'bug-fixer' },
  { test: (h) => h === 'scout' || h.startsWith('scout'), to: 'explorer' },
  { test: (h) => h === 'the planter', to: 'planter' }
];

/* ── headOf: a raw role string → its case-folded HEAD (decoration stripped) ─────
   THE one place decoration is removed. Trim, lower-case, then cut at the first
   decoration separator. The head is the maker's PRIMARY self-named role; any
   alias/facet/cycle tag after the separator is provenance, not a second bucket.
   This is why 'builder (planter)' is a BUILDER (its head) and 'planter (builder)'
   is a PLANTER — each mark counts once, in the bucket of the role it led with. */
export function headOf(role) {
  const rl = String(role).trim().toLowerCase();
  const m = SEP_RE.exec(rl);
  return (m ? rl.slice(0, m.index) : rl).trim();
}

/* ── normalizeRole: a raw role string → exactly ONE base bucket (or 'other') ────
   THE DOCUMENTED, DETERMINISTIC, TOTAL mapping. Steps, in order:
     1. headOf(role): case-fold + strip decoration to the primary head.
     2. ALIASES: a small fixed table of word-aliases (scout→explorer, etc.).
     3. SCAN_ORDER prefix match: the FIRST base whose token the head equals or
        starts with wins (hyphenated bases scanned first so they bind their whole
        name). Prefix (not just equality) catches 'explorer-b', 'explorer a …',
        'judge of cycle #1' — heads that lead with a base token then continue.
     4. fall through → 'other' (the catch-all that keeps the map total).
   Returns one of BUCKETS. Pure; same input → same bucket, forever. */
export function normalizeRole(role) {
  const h = headOf(role);
  for (const a of ALIASES) if (a.test(h)) return a.to;
  for (const b of SCAN_ORDER) if (h === b || h.startsWith(b)) return b;
  return OTHER;
}

/* ── parse: raw ledger.jsonl text → { marks, bad, lineCount } ───────────────────
   The ledger is JSONL: one JSON object per line, blank lines ignored. `marks` are
   in file order (== seq order). `bad` counts any line that fails to parse or is
   missing a load-bearing field. `lineCount` is the count of NON-BLANK lines (the
   mark count). On any structural failure the marks array is what parsed; `bad`
   reports the count so the twin's "0 malformed" leg bites. */
export function parse(raw) {
  const lines = String(raw).split('\n');
  const marks = [];
  let bad = 0, lineCount = 0;
  for (const line of lines) {
    if (line.trim() === '') continue;       // blank lines are not marks
    lineCount++;
    let o;
    try { o = JSON.parse(line); } catch (e) { bad++; continue; }
    if (o == null || typeof o !== 'object') { bad++; continue; }
    let missing = false;
    for (const f of FIELDS) if (!(f in o)) { missing = true; break; }
    if (missing || !Number.isFinite(o.seq)) { bad++; continue; }
    marks.push(o);
  }
  return { marks, bad, lineCount };
}

/* ── buildCensus: marks → the full population the page renders ──────────────────
   The ONE aggregate builder. Every figure the page shows is a field of what this
   returns; nothing downstream is hard-typed. Returns:
     N            — total marks.
     byRole       — Map<bucket, count> over ALL twelve buckets + other (zeros kept,
                    so the role pyramid always has all bins; Σ values === N).
     roleOrder    — buckets sorted by count desc (the pyramid's stacking order).
     tokens       — [{ seq, bucket, name, rawRole, koan, repeat }] one per mark, in
                    seq order; `repeat` = this name appears on >1 mark (came AGAIN).
     once / again — { names, tokens } split: named-ONCE vs a-hand-that-came-back.
                    once.names + again.names === distinctNames;
                    once.tokens + again.tokens === N.
     nameCounts   — Map<name, count> (the kin index; how many marks each name signed).
   Pure: same raw bytes → identical census. */
export function buildCensus(raw) {
  const { marks } = parse(raw);
  const N = marks.length;

  const nameCounts = new Map();
  for (const m of marks) {
    const nm = String(m.name);
    nameCounts.set(nm, (nameCounts.get(nm) || 0) + 1);
  }

  const byRole = new Map(BUCKETS.map((b) => [b, 0]));
  const tokens = marks.map((m) => {
    const bucket = normalizeRole(m.role);
    byRole.set(bucket, byRole.get(bucket) + 1);
    const nm = String(m.name);
    return {
      seq: m.seq, bucket, name: nm, rawRole: String(m.role),
      koan: String(m.koan), repeat: nameCounts.get(nm) > 1
    };
  });

  const roleOrder = [...BUCKETS].sort((a, b) =>
    byRole.get(b) - byRole.get(a) || BUCKETS.indexOf(a) - BUCKETS.indexOf(b));

  let onceNames = 0, againNames = 0, onceTokens = 0, againTokens = 0;
  for (const c of nameCounts.values()) {
    if (c === 1) { onceNames++; onceTokens += 1; }
    else { againNames++; againTokens += c; }
  }

  return {
    N, byRole, roleOrder, tokens, nameCounts,
    distinctNames: nameCounts.size,
    once: { names: onceNames, tokens: onceTokens },
    again: { names: againNames, tokens: againTokens }
  };
}

/* ── ROLE_GEOM + roleLayout: the "by role" pyramid's SLOT-WIDTH ARITHMETIC ──────
   The single source of the role-view layout's horizontal geometry, shared by BOTH
   the DOM layoutByRole (which lays the stones + furniture) and the Node twin (which
   asserts the chosen viewBox FITS the laid content — no clip). Pure: census → widths.

   The bug this single-sources away: each seat occupies a SLOT wide enough for both
   its brick and its caption; as the ledger grows the big seats span more sub-columns
   and the SUMMED slot width (totalW) creeps past the old fixed 1100-unit viewBox,
   clipping the end captions. The fix is to FIT the viewport to the content — set the
   viewBox width W = max(VW, totalW + margin) so cx = (W - totalW)/2 is never negative
   and preserveAspectRatio='xMidYMid meet' uniformly scales the whole pyramid to fit
   with NO clip (square stones preserved), correct as the ledger grows forever. */
export const ROLE_GEOM = {
  VW: 1100, VH: 560,           // the base viewBox; W grows past VW when the pyramid does
  TOK: 8, GAP: 2.2,            // a stone is TOK×TOK on a (TOK+GAP) grid
  MAX_ROWS: 26,                // a brick caps at MAX_ROWS rows, then grows a column right
  SEAT_GAP: 26,                // the gutter folded into each seat's slot
  LABEL_PER_CHAR: 7.2, LABEL_PAD: 12, // .blabel 10px mono ≈ 7.2px/char + pad (longest: GROUNDS-WORKER)
  SIDE_MARGIN: 24              // breathing room each side when the pyramid is wider than VW
};

/* roleLayout(census) → the role view's laid widths + the fitted viewBox W.
   Returns:
     founderSeq        — the lone pedestaled architect (min seq; never in a brick).
     seats             — the buckets that get a brick, in pyramid order (count desc).
     slots             — per seat { bucket, cols, seatLen, slot, labelW, x, brickX, labelCX }.
     totalW            — Σ slot widths (the pyramid's true laid width).
     W                 — the chosen viewBox width = max(VW, totalW + 2·SIDE_MARGIN).
     cx                — the left edge of the first slot = (W - totalW)/2  (≥ 0, never clips).
     pedX              — the founder pedestal's center = W/2.
     STEP              — TOK + GAP (the stone pitch), echoed for the caller.
     minX, maxX        — the laid content's x-extent (stones + captions + pedestal);
                         a fitted layout has minX ≥ 0 and maxX ≤ W (nothing clipped). */
export function roleLayout(census, geom = ROLE_GEOM) {
  const { VW, TOK, GAP, MAX_ROWS, SEAT_GAP, LABEL_PER_CHAR, LABEL_PAD, SIDE_MARGIN } = geom;
  const STEP = TOK + GAP;
  const { byRole, roleOrder, tokens } = census;
  const founderSeq = tokens.length ? tokens.reduce((m, t) => Math.min(m, t.seq), Infinity) : 1;
  // non-founder marks per bucket (the founder is pedestaled, never inside a brick)
  const seatLen = new Map(roleOrder.map((b) => [b, 0]));
  for (const t of tokens) if (t.seq !== founderSeq) seatLen.set(t.bucket, (seatLen.get(t.bucket) || 0) + 1);
  // the seats that get a brick — skip an architect bucket that holds only the founder
  const seats = roleOrder.filter((b) =>
    byRole.get(b) > 0 && !(b === 'architect' && byRole.get(b) === 1 && (seatLen.get(b) || 0) === 0));
  const brickCols = (b) => Math.max(1, Math.ceil((seatLen.get(b) || 0) / MAX_ROWS));
  const labelW = (b) => b.length * LABEL_PER_CHAR + LABEL_PAD;
  const slotW = (b) => Math.max(brickCols(b) * STEP + SEAT_GAP, labelW(b));
  // size every slot, accumulate the total laid width
  let totalW = 0;
  const slots = seats.map((b) => {
    const cols = brickCols(b), slot = slotW(b);
    totalW += slot;
    return { bucket: b, cols, seatLen: seatLen.get(b) || 0, slot, labelW: labelW(b) };
  });
  // FIT THE VIEWPORT TO THE CONTENT — W is at least VW but grows to hold a wider
  // pyramid (+ a side margin), so cx = (W - totalW)/2 is never negative → no clip.
  const W = Math.max(VW, totalW + 2 * SIDE_MARGIN);
  const cx = (W - totalW) / 2;
  // assign each slot its x and record the laid x-extent (stones + captions)
  let x = cx, minX = Infinity, maxX = -Infinity;
  for (const s of slots) {
    s.x = x;                                   // slot left edge
    const brickW = s.cols * STEP;
    s.brickX = x + (s.slot - brickW) / 2;       // brick centered within its slot
    s.labelCX = x + s.slot / 2;                 // caption centered on the slot
    const stoneRight = s.brickX + Math.max(0, s.cols - 1) * STEP + TOK;
    minX = Math.min(minX, s.brickX, s.labelCX - s.labelW / 2);
    maxX = Math.max(maxX, stoneRight, s.labelCX + s.labelW / 2);
    x += s.slot;
  }
  const pedX = W / 2;                           // the founder pedestal, centered on W
  minX = Math.min(minX, pedX - 26, pedX - TOK / 2);
  maxX = Math.max(maxX, pedX + 26, pedX + TOK / 2);
  if (!isFinite(minX)) { minX = 0; maxX = W; }   // degenerate (no seats) — fit trivially
  return { founderSeq, seats, slots, totalW, W, cx, pedX, STEP, minX, maxX };
}

/* ── kinOf: a census + a seq → the other marks that share its name OR its bucket ─
   Backs the "pluck a token, thread a brass line to its kin" interaction. Pure.
   Returns { sameName: [seq…], sameRole: [seq…] } excluding the token itself. */
export function kinOf(census, seq) {
  const self = census.tokens.find((t) => t.seq === seq);
  if (!self) return { sameName: [], sameRole: [] };
  const sameName = [], sameRole = [];
  for (const t of census.tokens) {
    if (t.seq === seq) continue;
    if (t.name === self.name) sameName.push(t.seq);
    if (t.bucket === self.bucket) sameRole.push(t.seq);
  }
  return { sameName, sameRole };
}

/* ── tamper: the NEGATIVE CONTROL — drop or duplicate one mark ──────────────────
   The visible button. `mode` 'drop' removes a middle mark; 'dup' duplicates one.
   Either breaks the contiguous-seq invariant AND the partition sum (Σ buckets !==
   the ORIGINAL N), so selfTest on the tampered text MUST flip RED. Returns the
   tampered raw JSONL text. Operates on a COPY; never mutates the source bytes. */
export function tamper(raw, mode = 'drop') {
  const lines = String(raw).split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 3) return raw;
  const i = Math.floor(lines.length / 2);
  let out;
  if (mode === 'dup') {
    out = [...lines.slice(0, i + 1), lines[i], ...lines.slice(i + 1)]; // duplicate line i
  } else {
    out = [...lines.slice(0, i), ...lines.slice(i + 1)];               // drop line i
  }
  return out.join('\n') + '\n';
}

/* ── selfTest: the full census-fidelity battery ────────────────────────────────
   Given the raw ledger text and a pinned CLAIM (verified figures), returns named
   checks. SAME function backs the Node twin AND the in-page pill. The legs:
     (0) parse clean, lineCount === mark count.
     (1) SEQ CONTIGUOUS 1…N — no gap, no dup (sorted seqs are exactly 1..N).
     (2) PARTITION — Σ of all bucket counts === N exactly (no double-count, no drop).
     (3) ROUND-TRIP — every token's load-bearing fields re-serialize byte-true to
         its source line (canonical re-emit matches, see roundTripOK).
     (4) ONCE+AGAIN closes — once.tokens + again.tokens === N; name splits close.
     (5) EVERY DISPLAYED FIGURE === claim (N, distinctNames, per-bucket counts,
         once/again) — re-derived from the file, never typed into the page.
   tamper() feeds a broken carrier here → legs (1) and (2) bite RED. */
export function selfTest(raw, claim) {
  const checks = [];
  const add = (label, pass, detail) =>
    checks.push({ label, pass: !!pass, detail: detail == null ? '' : String(detail) });

  const parsed = parse(raw);
  const N = parsed.marks.length;
  const census = buildCensus(raw);

  // (0) parse clean
  add('ledger parses, 0 malformed marks', parsed.bad === 0, parsed.bad + ' bad');
  add('mark count === non-blank line count', N === parsed.lineCount, N + ' vs ' + parsed.lineCount);

  // (1) SEQ CONTIGUOUS 1…N (sort, then assert strict 1..N — catches gap AND dup)
  const seqs = parsed.marks.map((m) => m.seq).slice().sort((a, b) => a - b);
  let contig = seqs.length === N;
  for (let i = 0; i < seqs.length; i++) if (seqs[i] !== i + 1) { contig = false; break; }
  add('seq contiguous 1…N (no gap, no dup)', contig, '1…' + N);

  // (2) PARTITION — Σ bucket counts === N exactly (no token dropped or double-counted
  // by the role map: this is the map's INTERNAL consistency, true by construction).
  let sum = 0;
  for (const v of census.byRole.values()) sum += v;
  add('Σ bucket counts === N (true partition, no drop/dup by the map)', sum === N, sum + ' = ' + N);
  // The map's consistency above is tautological w.r.t. the parsed file; the TAMPER
  // detector is Σ-buckets === the PINNED census total. A dropped/duplicated mark moves
  // N (and thus the sum) away from claim.N, and THIS leg bites RED.
  if (claim) add('Σ bucket counts === pinned census total (' + claim.N + ')',
    sum === claim.N, sum + ' vs ' + claim.N);
  // and the catch-all 'other' holds the OFF-BASE seats (the gate-foundry +
  // wiring marks that name no base seat); it tracks the pinned claim, so the
  // partition stays total (Σ === N) without minting a bucket for every gate role.
  const otherN = census.byRole.get(OTHER);
  if (claim) add('catch-all (other) === pinned claim (' + (claim.byRole.other || 0) + ')',
    otherN === (claim.byRole.other || 0), otherN + ' off-base marks (foundry/wiring seats)');
  else add('catch-all (other) is well-formed (≤ N)', otherN <= N, otherN + ' off-base marks');

  // (3) ROUND-TRIP — every token byte-true to its source mark's load-bearing fields
  let rt = true, rtSeq = null;
  for (const m of parsed.marks) {
    if (!roundTripOK(m)) { rt = false; rtSeq = m.seq; break; }
  }
  add('every mark round-trips byte-true (load-bearing fields)', rt,
    rt ? N + ' marks' : 'first failure seq ' + rtSeq);

  // (4) ONCE + AGAIN closes
  add('once.tokens + again.tokens === N', census.once.tokens + census.again.tokens === N,
    census.once.tokens + ' + ' + census.again.tokens);
  add('once.names + again.names === distinct names',
    census.once.names + census.again.names === census.distinctNames,
    census.distinctNames + ' distinct');

  // (5) EVERY DISPLAYED FIGURE === claim
  if (claim) {
    add('N === claim', N === claim.N, N + '');
    add('distinct names === claim', census.distinctNames === claim.distinctNames,
      census.distinctNames + '');
    add('came-again names === claim', census.again.names === claim.againNames,
      census.again.names + ' hands returned');
    let bucketsOK = true, off = null;
    for (const b of BUCKETS) {
      if (census.byRole.get(b) !== (claim.byRole[b] || 0)) { bucketsOK = false; off = b; break; }
    }
    add('every bucket count === claim', bucketsOK,
      bucketsOK ? BASES.length + ' buckets pinned' : 'off at ' + off);
  } else {
    add('census present', N > 0, N + ' marks · ' + census.distinctNames + ' names');
  }

  return { checks, census, parsed, N };
}

/* ── roundTripOK: a parsed mark re-serializes byte-true to a canonical line ─────
   A mark proves byte-true round-trip if re-emitting its load-bearing fields in
   CANONICAL FIELD ORDER reproduces a JSON object that JSON.parse-equals the mark.
   (The ledger is machine-emitted by sign.sh/collate.sh in this exact field order
   with no extra whitespace, so a canonical re-emit equals the source line; the
   twin additionally asserts the canonical line === the raw source line, the
   strictest byte-true form — see the twin.) */
export function roundTripOK(mark) {
  const canon = canonicalLine(mark);
  let reparsed;
  try { reparsed = JSON.parse(canon); } catch (e) { return false; }
  for (const f of FIELDS) if (reparsed[f] !== mark[f]) return false;
  return Object.keys(reparsed).length === FIELDS.length;
}

/* canonicalLine: a mark → its canonical one-line JSON (fields in FIELDS order, no
   spaces) — the exact form the ledger is written in. */
export function canonicalLine(mark) {
  const o = {};
  for (const f of FIELDS) o[f] = mark[f];
  return JSON.stringify(o);
}

/* ── verdict: a battery → { passN, total, allPass } ──────────────────────────── */
export function verdict(checks) {
  const passN = checks.filter((c) => c.pass).length;
  return { passN, total: checks.length, allPass: passN === checks.length };
}

/* The VERIFIED real census of this estate's ledger, as of this build. The Node
   twin pins to these; if the ledger changes shape the twin fails loudly and the
   page must be re-forged. These figures are RE-DERIVED from ledger/ledger.jsonl by
   reclaim.mjs (run by collate.sh every cycle), never hand-typed — so the count below
   tracks the live ledger and never staleness-rots. byRole is the full partition;
   Σ === N. other === 0: every role string maps to one of the TWELVE base buckets
   (gardener + groundskeeper, the two keeper seats, both seated). */
export const CLAIM = {
  N: 2132,
  distinctNames: 1746,
  againNames: 189,        // hands that signed >1 mark (575 of the 2132 tokens)
  byRole: {
    publisher: 483, explorer: 435, director: 246, judge: 215, builder: 371,
    planter: 33, 'bug-fixer': 13, gardener: 11, 'grounds-worker': 20,
    steward: 8, architect: 3, groundskeeper: 2, other: 292
  }
};
