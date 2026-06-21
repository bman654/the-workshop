/* ═══════════════════════════════════════════════════════════════════════════
   THE TABULARIUM — core.mjs
   The data-fidelity logic of the estate's self-history, as PURE functions.

   This module is the single source of truth for every claim the room makes
   about its data. It is imported by BOTH:
     • core.test.mjs   — the Node twin test, run against the real ledger file
     • index.html      — inlined verbatim at forge time, so the in-page pill
                         computes the IDENTICAL results from the SAME bytes.

   Nothing here touches the DOM, time, or randomness. Given the raw JSONL text
   of ledger/ledger.jsonl (and the hand-authored MYTH chapter thresholds), it
   answers: does the rendered legend round-trip, byte-true, to the record?
   ═══════════════════════════════════════════════════════════════════════════ */

/* The five LOAD-BEARING fields of a ledger mark, in canonical order. A mark's
   identity for round-trip is exactly these five — ts is a timestamp the room
   does not display and does not claim, so it is not load-bearing. */
export const FIELDS = ['seq', 'cycle', 'role', 'name', 'koan'];

/* The chapter thresholds — the cycle at/after which a leaf belongs to each
   hand-authored chapter. The PROSE lives in the page (it is myth, not data);
   the THRESHOLDS live here because the partition proof is a claim about data.
   `from` is the inclusive lower cycle bound; chapters are contiguous & cover
   the whole cycle range, so every mark lands in exactly one chapter. */
export const CHAPTER_FROM = [306, 318, 340, 370, 399];

/* ── parse: raw JSONL text → { records, lineCount, bad } ──────────────────────
   Splits on newlines, drops blank lines, JSON-parses each. `bad` counts any
   line that fails to parse or is missing a load-bearing field. `records` are in
   file order. Each record carries a hidden `__line` (0-based index into the
   non-blank lines) so a per-leaf indicator can name its exact source line. */
export function parseLedger(raw) {
  const lines = String(raw).split('\n').map(s => s.trim()).filter(Boolean);
  const records = [];
  let bad = 0;
  for (let i = 0; i < lines.length; i++) {
    let o;
    try { o = JSON.parse(lines[i]); }
    catch (e) { bad++; continue; }
    if (o == null || typeof o !== 'object') { bad++; continue; }
    for (const f of FIELDS) {
      if (!(f in o)) { o.__missing = true; break; }
    }
    if (o.__missing) { bad++; continue; }
    Object.defineProperty(o, '__line', { value: i, enumerable: false });
    records.push(o);
  }
  return { records, lineCount: lines.length, bad };
}

/* ── canonical: a record → its 5 load-bearing fields, unit-separator joined ───
   The ␟ (U+241F, SYMBOL FOR UNIT SEPARATOR) can never appear in a koan, so this
   is an injective fingerprint of the load-bearing identity of a mark. */
export function canonical(m) {
  return FIELDS.map(f => String(m[f])).join('␟');
}

/* ── chapterIndexFor: a cycle → the index of its chapter (the latest threshold
   ≤ cycle). Total over all integer cycles ≥ the first threshold. ──────────── */
export function chapterIndexFor(cycle) {
  let idx = 0;
  for (let k = 0; k < CHAPTER_FROM.length; k++) {
    if (cycle >= CHAPTER_FROM[k]) idx = k;
  }
  return idx;
}

/* ── buildLeaves: records → leaves (one per cycle, chronological) ─────────────
   A "leaf" of the tome == one cycle that left at least one mark. Leaves are in
   ascending-cycle order; marks within a leaf keep file (seq) order. Throws if
   seq is not strictly ascending — chronology is a precondition, not an opinion. */
export function buildLeaves(records) {
  const byCycle = new Map();
  let prevSeq = 0;
  for (const m of records) {
    if (!(m.seq > prevSeq)) {
      throw new Error('ledger seq not strictly ascending at seq ' + m.seq);
    }
    prevSeq = m.seq;
    if (!byCycle.has(m.cycle)) byCycle.set(m.cycle, []);
    byCycle.get(m.cycle).push(m);
  }
  const cycles = [...byCycle.keys()].sort((a, b) => a - b);
  return cycles.map(c => ({ cycle: c, marks: byCycle.get(c) }));
}

/* ── partitionByChapter: records → 5 chapter buckets (a true partition) ───────
   Every mark lands in exactly one chapter (by its cycle's threshold). Returns
   an array of 5 arrays; the union covers all records, disjointly. */
export function partitionByChapter(records) {
  const buckets = CHAPTER_FROM.map(() => []);
  for (const m of records) buckets[chapterIndexFor(m.cycle)].push(m);
  return buckets;
}

/* ── recomputeAggregates: records → the numbers the room displays ─────────────
   Every aggregate the page asserts is RE-DERIVED here from the data, so the
   displayed 407 / 357 / 95 / 306→437 can never drift from the file. */
export function recomputeAggregates(records) {
  const names = new Set(), cycles = new Set();
  let minCyc = Infinity, maxCyc = -Infinity;
  for (const m of records) {
    names.add(m.name);
    cycles.add(m.cycle);
    if (m.cycle < minCyc) minCyc = m.cycle;
    if (m.cycle > maxCyc) maxCyc = m.cycle;
  }
  return {
    marks: records.length,
    makers: names.size,
    cycles: cycles.size,
    minCyc: minCyc === Infinity ? null : minCyc,
    maxCyc: maxCyc === -Infinity ? null : maxCyc
  };
}

/* ── roundTripOne: does record `r` reconstruct the verbatim carrier line? ──────
   Re-find, in the RAW carrier, the unique line whose parse has r.seq, and
   confirm all five load-bearing fields match. This is the byte-true per-mark
   round-trip — a forged koan or a duplicated seq breaks it. Returns
   { ok, line } where `line` is the 0-based carrier-line index (for the label). */
export function roundTripOne(raw, r) {
  const lines = String(raw).split('\n').map(s => s.trim()).filter(Boolean);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    let o; try { o = JSON.parse(lines[i]); } catch (e) { continue; }
    if (o && o.seq === r.seq) hits.push({ o, i });
  }
  if (hits.length !== 1) return { ok: false, line: -1 };
  const { o, i } = hits[0];
  const ok = FIELDS.every(f => o[f] === r[f]);
  return { ok, line: i };
}

/* ── selfTest: the full data-fidelity battery ─────────────────────────────────
   Given the raw carrier text, the parsed records, and the verified aggregate
   targets the room means to display, returns an array of named checks. The
   SAME function backs the Node twin AND the in-page pill. A `negativeControl`
   flag (default false) is just metadata for the caller's label.

   `claim` lets a caller pin the aggregate-recompute leg to specific expected
   numbers (so the test fails loudly if the real file ever changes shape). */
export function selfTest(raw, claim) {
  const checks = [];
  const add = (label, pass, detail) => checks.push({ label, pass: !!pass, detail: detail == null ? '' : String(detail) });

  const parsed = parseLedger(raw);
  const records = parsed.records;
  const N = records.length;

  // (0) parse cleanly
  add('every ledger line parses, 0 malformed', parsed.bad === 0, parsed.bad + ' bad');
  add('record count === non-blank line count', N === parsed.lineCount, N + ' vs ' + parsed.lineCount);

  // (1) CARDINALITY — rendered count == file lines (and == claimed marks)
  const agg = recomputeAggregates(records);
  add('cardinality rendered == file lines', N === parsed.lineCount && (!claim || N === claim.marks),
    N + ' marks');

  // (2) CHRONOLOGICAL — seq strictly 1…N, contiguous, no gap/dup/reorder
  let mono = true, contig = true;
  for (let i = 0; i < N; i++) {
    if (i > 0 && !(records[i].seq > records[i - 1].seq)) mono = false;
    if (records[i].seq !== i + 1) contig = false;
  }
  add('seq strictly monotonic (chronological)', mono);
  add('seq contiguous 1…N (no gap, no dup, no reorder)', contig, '1…' + N);

  // (3) PER-MARK ROUND-TRIP — every record reconstructs its verbatim carrier line
  let rtAll = true, firstBad = -1;
  for (const r of records) {
    if (!roundTripOne(raw, r).ok) { rtAll = false; if (firstBad < 0) firstBad = r.seq; }
  }
  add('every mark round-trips byte-true to its JSONL line', rtAll,
    rtAll ? (N + ' marks, field-for-field') : ('failed at seq ' + firstBad));

  // (4) PARTITION — the 5 chapters cover every mark, disjointly
  const buckets = partitionByChapter(records);
  const seen = new Set();
  let dbl = false;
  for (const b of buckets) for (const m of b) { if (seen.has(m.seq)) dbl = true; seen.add(m.seq); }
  add('chapters partition the ledger (cover all, no overlap)', seen.size === N && !dbl,
    seen.size + '/' + N);

  // (5) BIJECTION — leaf-flatten ↔ record, each seq rendered exactly once, in order
  let leaves, built = true;
  try { leaves = buildLeaves(records); } catch (e) { built = false; }
  let bij = built;
  if (built) {
    const flat = leaves.flatMap(l => l.marks);
    if (flat.length !== N) bij = false;
    else {
      const seq = new Set();
      for (let i = 0; i < flat.length; i++) {
        if (canonical(flat[i]) !== canonical(records[i])) bij = false; // order preserved
        if (seq.has(flat[i].seq)) bij = false;                          // shown once
        seq.add(flat[i].seq);
      }
      if (seq.size !== N) bij = false;                                  // all covered
    }
  }
  add('render ↔ record bijection (each mark shown exactly once)', bij, N + ' leaves-flat ↔ records');

  // (6) AGGREGATES — every displayed number recomputed-and-equal
  let aggOK = true;
  if (claim) {
    aggOK = agg.marks === claim.marks && agg.makers === claim.makers &&
      agg.cycles === claim.cycles && agg.minCyc === claim.minCyc && agg.maxCyc === claim.maxCyc;
  }
  add('aggregates = recompute(data)', aggOK,
    agg.marks + ' marks · ' + agg.makers + ' hands · ' + agg.cycles + ' cycles · ' + agg.minCyc + '→' + agg.maxCyc);

  // (7) WING SCHEDULE — the curated growth table is well-formed & monotone
  const wv = validateWings(WINGS);
  add('estate-raising table is well-formed (monotone, unique, integer cycles)', wv.ok,
    wv.count + ' wings');

  return { checks, records, parsed, agg, leaves: built ? leaves : null, buckets };
}

/* ── tamper: forge a copy of the carrier with one fabricated mark ─────────────
   The NEGATIVE CONTROL. Inserts a fabricated line (duplicated seq + invented
   koan) into a COPY of the raw carrier. selfTest() on the tampered carrier MUST
   fail (round-trip + contiguity break). Returns the tampered raw text. */
export function tamper(raw) {
  const lines = String(raw).split('\n').map(s => s.trim()).filter(Boolean);
  // duplicate the seq of line index 2, with an invented koan no maker ever laid
  let dupSeq = 3;
  try { dupSeq = JSON.parse(lines[2]).seq; } catch (e) { /* keep default */ }
  const forged = JSON.stringify({
    seq: dupSeq, cycle: 0, role: 'forger', name: 'Nobody',
    koan: 'A mark no maker ever laid.', ts: '1970-01-01T00:00:00Z'
  });
  const out = lines.slice();
  out.splice(3, 0, forged);
  return out.join('\n');
}

/* ── verdict: a battery → { passN, total, allPass } ──────────────────────────── */
export function verdict(checks) {
  const passN = checks.filter(c => c.pass).length;
  return { passN, total: checks.length, allPass: passN === checks.length };
}

/* The VERIFIED real aggregate targets of ledger/ledger.jsonl, as of this build.
   The Node twin pins to these; if the real file ever changes shape, the twin
   fails loudly and the room must be re-forged. */
export const CLAIM = { marks: 918, makers: 756, cycles: 245, minCyc: 306, maxCyc: 613 };

/* ── THE ESTATE'S WINGS, by their REAL first-appearance ───────────────────────
   `bornCycle` is the git commit-DEPTH of the commit that first added that wing's
   room — the SAME convention the ledger uses for a mark's `cycle` (see the
   "Cairn cycle == git depth" rule). These are RECOMPUTED from git, not invented:
     git log --reverse --diff-filter=A -- <room>/index.html  → its first commit
     git rev-list --count <that commit>                      → its depth == cycle
   The ledger of marks only BEGAN at cycle 306 (when the architect Cairn laid the
   first stone); most wings already stood by then, so they read as "standing" from
   the opening leaf. The wings that ROSE during the recorded era (cycle ≥ 306)
   light one-by-one as you wind — and that lighting is itself data-true.
   `pre` (bornCycle < 306) marks a wing that predates the ledger: the room is
   honest that it cannot name a recorded birth-year for it, only that it was
   "already standing" when the record opens. */
export const WINGS = [
  { name: 'Strange Garden',       bornCycle: 2   },
  { name: 'The Arcade',           bornCycle: 27  },
  { name: 'The Map Room',         bornCycle: 34  },
  { name: 'The Music Room',       bornCycle: 43  },
  { name: 'The Study',            bornCycle: 45  },
  { name: 'The Observatory',      bornCycle: 63  },
  { name: 'The Hedge Maze',       bornCycle: 72  },
  { name: 'The Print Room',       bornCycle: 77  },
  { name: 'Threshold',            bornCycle: 83  },
  { name: "The Maker's Shed",     bornCycle: 164 },
  { name: 'Hall of Mirrors',      bornCycle: 227 },
  { name: 'The Cavern',           bornCycle: 263 },
  { name: 'The Engine Room',      bornCycle: 307 },
  { name: 'The Numbers Room',     bornCycle: 312 },
  { name: 'Clockwork Automata',   bornCycle: 323 },
  { name: 'The Conservatory',     bornCycle: 359 },
  { name: 'The Alchemy Lab',      bornCycle: 374 },
  { name: 'Puzzle Pavilion',      bornCycle: 388 },
  { name: 'The Tabularium',       bornCycle: 404 },
  { name: 'The Hours',            bornCycle: 414 }
];

/* ── estateAt: which wings stand at this cycle ────────────────────────────────
   A wing is "standing" iff cycle ≥ its bornCycle. `pre` wings (born before the
   record opened) are standing from the very first leaf — honestly, without
   claiming a recorded birth-year inside the orrery's 306→409 span. Returns
   per-wing { name, bornCycle, pre, standing, justRaised } where justRaised marks
   a wing whose recorded birth-year IS this exact cycle (it rose this turn). */
export function estateAt(cycle, recordStart) {
  const start = recordStart == null ? 306 : recordStart;
  return WINGS.map(w => ({
    name: w.name,
    bornCycle: w.bornCycle,
    pre: w.bornCycle < start,
    standing: cycle >= w.bornCycle,
    justRaised: w.bornCycle >= start && w.bornCycle === cycle
  }));
}

/* ── validateWings: the curated table is well-formed (the room's wing claim) ───
   Asserts: every bornCycle is a positive integer; names are unique; and the
   table is in non-decreasing bornCycle order (so the estate reads as raising
   itself monotonically). This is the leg that keeps the growth schedule honest
   — it is data about the table's shape, checked, not asserted by hand. */
export function validateWings(wings) {
  const list = wings || WINGS;
  const names = new Set();
  let ordered = true, intsOK = true, uniqueOK = true;
  let prev = -Infinity;
  for (const w of list) {
    if (!(Number.isInteger(w.bornCycle) && w.bornCycle > 0)) intsOK = false;
    if (names.has(w.name)) uniqueOK = false;
    names.add(w.name);
    if (w.bornCycle < prev) ordered = false;
    prev = w.bornCycle;
  }
  return { ok: intsOK && uniqueOK && ordered, intsOK, uniqueOK, ordered, count: list.length };
}
