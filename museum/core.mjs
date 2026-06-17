/* ═══════════════════════════════════════════════════════════════════════════
   THE MUSEUM · The Centennial Jubilee — core.mjs
   The data-fidelity logic of the estate's River of Days, as PURE functions.

   This module is the single source of truth for every claim the River makes
   about its own record. It is imported by BOTH:
     • core.test.mjs   — the Node twin, run against the REAL committed cycles.json
     • index.html      — inlined verbatim at forge time, so the in-page pill
                         computes the IDENTICAL battery from the SAME bytes.

   Nothing here touches the DOM, randomness, or the wall-clock NOW. Given the raw
   JSON text of museum/cycles.json it answers: do the 450 stones laid in the River
   round-trip, byte-true, to the git record they were generated from? Every number
   the page shows — the elapsed span, the busiest day, the silent gap — is RE-
   derived here, never typed into the page.

   A stone's x is itself a tested function of its epoch: timeScale / indexScale
   are the two pure projections the hero LEVER snaps between (BY REAL TIME / BY
   MILESTONE), so a visitor who drags the playhead is dragging a proof.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The estate keeps Chicago wall-clock time (CDT = UTC−5 in June): the founder's
   first commit and every worklog date are stamped in it. Day-banding the River
   on this offset is what makes "JUN 13 · 118 commits — the storm" the true peak
   (UTC would split that day and read 96). This is the ONE timezone the carrier's
   day arithmetic uses; it is data about how the record was kept, not a guess. */
export const TZ_OFFSET_SEC = -5 * 3600;

/* The five LOAD-BEARING fields of a carrier record, in canonical order. A
   commit-stone's identity for round-trip is exactly these five; `iso` is kept
   for provenance but is not a claim the River displays, so it is not load-bearing. */
export const FIELDS = ['seq', 'sha', 'epoch', 'subject', 'track'];

/* The four tracks a stone can stratify into (parsed from the subject upstream by
   gen-cycles.mjs). The page colours by these; the test asserts the set is closed. */
export const TRACKS = ['garden', 'grounds', 'bug', 'other'];

/* ── parse: raw cycles.json text → { events, bad, lineCount } ──────────────────
   The carrier is a single JSON array (emitted by gen-cycles.mjs). `events` are in
   file order (== chronological, == seq order). `bad` counts any record missing a
   load-bearing field or with a non-finite epoch. `lineCount` is the array length
   (the carrier is one JSON document, so there is no per-line split — lineCount is
   the record count, kept for parity with the Tabularium's parse shape). */
export function parseCycles(raw) {
  let arr;
  try { arr = JSON.parse(String(raw)); }
  catch (e) { return { events: [], bad: -1, lineCount: 0 }; }
  if (!Array.isArray(arr)) return { events: [], bad: -1, lineCount: 0 };
  const events = [];
  let bad = 0;
  for (const o of arr) {
    if (o == null || typeof o !== 'object') { bad++; continue; }
    let missing = false;
    for (const f of FIELDS) if (!(f in o)) { missing = true; break; }
    if (missing || !Number.isFinite(o.epoch) || !Number.isFinite(o.seq)) { bad++; continue; }
    events.push(o);
  }
  return { events, bad, lineCount: arr.length };
}

/* ── recomputeAggregates: events → the headline numbers the River displays ─────
   Every aggregate the page asserts is RE-DERIVED here. The capstone span
   "9d 8h 3m 36s" is formatSpan(elapsedSec) of these, never typed. */
export function recomputeAggregates(events) {
  const n = events.length;
  if (n === 0) return { count: 0, firstEpoch: null, lastEpoch: null, elapsedSec: 0, days: 0, meanGapSec: 0 };
  const firstEpoch = events[0].epoch;
  const lastEpoch = events[n - 1].epoch;
  const elapsedSec = lastEpoch - firstEpoch;
  const days = perDay(events).length;
  const meanGapSec = n > 1 ? elapsedSec / (n - 1) : 0;
  return { count: n, firstEpoch, lastEpoch, elapsedSec, days, meanGapSec };
}

/* ── dayKeyOf: an epoch → its local (Chicago) calendar day 'YYYY-MM-DD' ──────── */
export function dayKeyOf(epoch) {
  return new Date((epoch + TZ_OFFSET_SEC) * 1000).toISOString().slice(0, 10);
}

/* ── perDay: events → [{ day, count, firstEpoch, lastEpoch }] in day order ─────
   One bucket per local calendar day that carries ≥1 commit. Days with zero
   commits (e.g. Jun-9, swallowed by the silent gap) are NOT invented — the River
   shows the gap as a dry channel, it does not draw an empty band. */
export function perDay(events) {
  const map = new Map();
  for (const e of events) {
    const k = dayKeyOf(e.epoch);
    if (!map.has(k)) map.set(k, { day: k, count: 0, firstEpoch: e.epoch, lastEpoch: e.epoch });
    const b = map.get(k);
    b.count++;
    if (e.epoch < b.firstEpoch) b.firstEpoch = e.epoch;
    if (e.epoch > b.lastEpoch) b.lastEpoch = e.epoch;
  }
  return [...map.values()].sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
}

/* ── busiestDay: events → { day, count } of the single fullest local day ─────── */
export function busiestDay(events) {
  let best = { day: null, count: -1 };
  for (const b of perDay(events)) if (b.count > best.count) best = { day: b.day, count: b.count };
  return best;
}

/* ── longestGap: events → the single longest silent stretch ────────────────────
   Returns { sec, fromSeq, toSeq, fromEpoch, toEpoch } for the largest epoch
   difference between two ADJACENT commits. The estate's "the estate slept" beat
   is computed here from the data — the page never types "Jun 9" or "58h". */
export function longestGap(events) {
  let best = { sec: -1, fromSeq: null, toSeq: null, fromEpoch: null, toEpoch: null };
  for (let i = 1; i < events.length; i++) {
    const g = events[i].epoch - events[i - 1].epoch;
    if (g > best.sec) best = {
      sec: g, fromSeq: events[i - 1].seq, toSeq: events[i].seq,
      fromEpoch: events[i - 1].epoch, toEpoch: events[i].epoch
    };
  }
  return best;
}

/* ── the two PURE projections the hero LEVER snaps between ──────────────────────
   Each maps a stone to an x in [x0, x1] (a pixel band). They are the *whole*
   difference between the tidy-lie axis and the violent-truth axis — a stone's x
   is a tested function of its epoch (or its index), nothing more.

   timeScale  — BY REAL TIME: x is linear in wall-clock epoch. Busy days clump;
                the silent gap yawns open as empty band.
   indexScale — BY MILESTONE: x is linear in chronological index. Every commit is
                evenly spaced (the tidy ruler of the counter). When projecting the
                100-cycle milestone axis the caller passes seq as the index, so the
                spacing is the estate's git-DEPTH cadence, not an invented number. */
export function timeScale(epoch, firstEpoch, lastEpoch, x0, x1) {
  const span = lastEpoch - firstEpoch;
  const t = span === 0 ? 0 : (epoch - firstEpoch) / span;
  return x0 + t * (x1 - x0);
}
export function indexScale(idx, n, x0, x1) {
  const t = n <= 1 ? 0 : idx / (n - 1);
  return x0 + t * (x1 - x0);
}

/* ── formatSpan: seconds → "9d 8h 3m 36s" (the capstone, recomputed not typed) ──
   Drops leading zero units but always shows at least seconds; days/hours/min/sec.
   This is what turns elapsedSec into the headline a visitor reads. */
export function formatSpan(sec) {
  sec = Math.max(0, Math.round(sec));
  const d = Math.floor(sec / 86400); sec -= d * 86400;
  const h = Math.floor(sec / 3600); sec -= h * 3600;
  const m = Math.floor(sec / 60); const s = sec - m * 60;
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h || d) parts.push(h + 'h');
  if (m || h || d) parts.push(m + 'm');
  parts.push(s + 's');
  return parts.join(' ');
}

/* ── importance: a stone's radius rank (a small, honest heuristic) ─────────────
   A '(cycle #N)' headline commit is a bright KEYSTONE (rank 3); a grounds/swing or
   garden plant that opens or seeds a room is a stone (rank 2); routine NOTES /
   worklog / bookkeeping commits are pebbles (rank 1). Pure function of the record;
   no claim rides on it (it is visual weight, not a proof), so it owes no test —
   but it is deterministic so the River renders identically every load. */
export function importanceOf(e) {
  if (e.cycleNum != null) return 3;
  const s = String(e.subject).toLowerCase();
  if (/^(notes|worklog|ledger|readme)\b|\bbookkeep|head-pointer/.test(s)) return 1;
  if (e.track === 'garden' || e.track === 'grounds') return 2;
  if (e.track === 'bug') return 2;
  return 1;
}

/* ── trackColor: a track → its stratigraphy colour (Explorer C's strata) ───────
   garden → moss-verdigris, grounds → brass, bug → iron, other → a dim vellum
   pebble. Pure; the page reads these so the legend and the stones never drift. */
export const TRACK_COLOR = {
  garden: '#7fb38a',   // moss-verdigris
  grounds: '#d9a441',  // brass
  bug: '#8893a0',      // iron
  other: '#8a7c5e'     // dim vellum pebble
};
export function trackColor(track) { return TRACK_COLOR[track] || TRACK_COLOR.other; }

/* ── selfTest: the full data-fidelity battery ─────────────────────────────────
   Given the raw carrier text and a pinned CLAIM (the verified git facts), returns
   an array of named checks. The SAME function backs the Node twin AND the in-page
   pill. The four required legs:
     (a) MONOTONIC — every epoch ≥ prior; seq contiguous 1…N.
     (b) COUNT & SPAN — count, firstEpoch, lastEpoch, elapsedSec, days match git.
     (c) DERIVED AGGREGATES — longestGap, busiestDay/count, meanGap recompute exact.
     (d) (the negative control lives in tamper(); selfTest on a tampered carrier
         FAILS leg (a), flipping the pill RED.)                                   */
export function selfTest(raw, claim) {
  const checks = [];
  const add = (label, pass, detail) => checks.push({ label, pass: !!pass, detail: detail == null ? '' : String(detail) });

  const parsed = parseCycles(raw);
  const events = parsed.events;
  const N = events.length;

  // (0) parse cleanly
  add('carrier parses, 0 malformed records', parsed.bad === 0, parsed.bad + ' bad');
  add('event count === carrier length', N === parsed.lineCount, N + ' vs ' + parsed.lineCount);

  // (a) MONOTONIC — epochs non-decreasing; seq strictly 1…N contiguous
  let mono = true, contig = true, monoSeq = true;
  for (let i = 0; i < N; i++) {
    if (i > 0 && events[i].epoch < events[i - 1].epoch) mono = false;
    if (i > 0 && !(events[i].seq > events[i - 1].seq)) monoSeq = false;
    if (events[i].seq !== i + 1) contig = false;
  }
  add('epochs monotonic non-decreasing (chronological)', mono);
  add('seq strictly ascending', monoSeq);
  add('seq contiguous 1…N (the git-depth cadence, no gap/dup)', contig, '1…' + N);

  // closed track set — every stone strata into exactly one known track
  let trackOK = true;
  for (const e of events) if (TRACKS.indexOf(e.track) < 0) trackOK = false;
  add('every stone strata into one of the four tracks', trackOK, TRACKS.join(' · '));

  // (b) COUNT & SPAN match the verified git facts
  const agg = recomputeAggregates(events);
  if (claim) {
    add('count === git commit count', agg.count === claim.count, agg.count + ' commits');
    add('first/last epoch === git record',
      agg.firstEpoch === claim.firstEpoch && agg.lastEpoch === claim.lastEpoch,
      agg.firstEpoch + '…' + agg.lastEpoch);
    add('elapsed === last − first === claim',
      agg.elapsedSec === agg.lastEpoch - agg.firstEpoch && agg.elapsedSec === claim.elapsedSec,
      formatSpan(agg.elapsedSec));
    add('distinct local days === git', agg.days === claim.days, agg.days + ' days');
  } else {
    add('count/span present', agg.count > 0, agg.count + ' commits · ' + formatSpan(agg.elapsedSec));
  }

  // (c) DERIVED AGGREGATES recompute exactly
  const gap = longestGap(events);
  const busy = busiestDay(events);
  if (claim) {
    add('longest silent gap === claim', gap.sec === claim.longestGapSec,
      formatSpan(gap.sec) + ' (seq ' + gap.fromSeq + '↔' + gap.toSeq + ')');
    add('busiest day === claim', busy.day === claim.busiestDay && busy.count === claim.busiestCount,
      busy.day + ' · ' + busy.count + ' commits');
    add('mean gap === elapsed/(N−1)', Math.abs(agg.meanGapSec - claim.elapsedSec / (claim.count - 1)) < 1e-6,
      Math.round(agg.meanGapSec) + 's mean');
  } else {
    add('aggregates recompute', gap.sec > 0 && busy.count > 0,
      'gap ' + formatSpan(gap.sec) + ' · busiest ' + busy.day + '/' + busy.count);
  }

  // projection sanity — first stone sits at x0, last at x1, both axes (a stone's x
  // is a tested function of its epoch / index)
  const projOK =
    Math.abs(timeScale(agg.firstEpoch, agg.firstEpoch, agg.lastEpoch, 100, 1000) - 100) < 1e-9 &&
    Math.abs(timeScale(agg.lastEpoch, agg.firstEpoch, agg.lastEpoch, 100, 1000) - 1000) < 1e-9 &&
    Math.abs(indexScale(0, N, 100, 1000) - 100) < 1e-9 &&
    Math.abs(indexScale(N - 1, N, 100, 1000) - 1000) < 1e-9;
  add('both axis projections anchor first→x0, last→x1', projOK, 'timeScale · indexScale');

  return { checks, events, parsed, agg, gap, busy };
}

/* ── tamper: forge a fake timestamp (the NEGATIVE CONTROL) ─────────────────────
   Swaps two ADJACENT stones' epochs in a COPY of the carrier, breaking epoch
   monotonicity. selfTest() on the tampered carrier MUST fail leg (a) — the visible
   "Forge a fake timestamp" button runs this LIVE so a visitor watches the pill
   flip RED. Returns the tampered raw JSON text. */
export function tamper(raw) {
  let arr;
  try { arr = JSON.parse(String(raw)); } catch (e) { return raw; }
  if (!Array.isArray(arr) || arr.length < 3) return raw;
  // pick a middle pair so the swap clearly inverts order (busy region, big delta)
  const i = Math.floor(arr.length / 2);
  const j = i + 1 < arr.length ? i + 1 : i - 1;
  const copy = arr.map(o => ({ ...o }));
  const tmp = copy[i].epoch; copy[i].epoch = copy[j].epoch; copy[j].epoch = tmp;
  return JSON.stringify(copy, null, 0) + '\n';
}

/* ── verdict: a battery → { passN, total, allPass } ──────────────────────────── */
export function verdict(checks) {
  const passN = checks.filter(c => c.pass).length;
  return { passN, total: checks.length, allPass: passN === checks.length };
}

/* The VERIFIED real git facts of this estate's record, as of this build. The Node
   twin pins to these; if the record ever changes shape, the twin fails loudly and
   the page must be re-forged from a fresh gen-cycles.mjs. Recomputed THIS turn
   from `git log --reverse` (Chicago day boundaries, CDT = UTC−5):
     count 450 · first 1780893385 · last 1781700001 · elapsed 806616s (9d 8h 3m 36s)
     longest gap 210888s (2d 10h 34m 48s) · busiest 2026-06-13 = 118 commits · 10 days. */
export const CLAIM = {
  count: 450,
  firstEpoch: 1780893385,
  lastEpoch: 1781700001,
  elapsedSec: 806616,
  longestGapSec: 210888,
  busiestDay: '2026-06-13',
  busiestCount: 118,
  days: 10,
  milestones: 100
};

/* ── THE ESTATE'S WINGS, by their REAL first-appearance (git commit-DEPTH) ──────
   Reused from the Tabularium's data discipline: `bornCycle` is the git depth of
   the commit that first added that wing's room. The manor silhouette above the
   River raises each wing at its real birth TIME — keyed to the wall-clock epoch of
   the commit at that depth (the page looks the depth up in the carrier). This is
   the SAME WINGS table the Tabularium keeps (kept here so the Museum's core is
   self-contained and the Node twin needs no cross-room import). */
export const WINGS = [
  { name: 'Strange Garden', bornCycle: 2 },
  { name: 'The Arcade', bornCycle: 27 },
  { name: 'The Map Room', bornCycle: 34 },
  { name: 'The Music Room', bornCycle: 43 },
  { name: 'The Study', bornCycle: 45 },
  { name: 'The Observatory', bornCycle: 63 },
  { name: 'The Hedge Maze', bornCycle: 72 },
  { name: 'The Print Room', bornCycle: 77 },
  { name: 'Threshold', bornCycle: 83 },
  { name: "The Maker's Shed", bornCycle: 164 },
  { name: 'Hall of Mirrors', bornCycle: 227 },
  { name: 'The Cavern', bornCycle: 263 },
  { name: 'The Engine Room', bornCycle: 307 },
  { name: 'The Numbers Room', bornCycle: 312 },
  { name: 'Clockwork Automata', bornCycle: 323 },
  { name: 'The Conservatory', bornCycle: 359 },
  { name: 'The Alchemy Lab', bornCycle: 374 },
  { name: 'Puzzle Pavilion', bornCycle: 388 },
  { name: 'The Tabularium', bornCycle: 404 },
  { name: 'The Hours', bornCycle: 414 }
];

/* ── epochForDepth: the wall-clock epoch of the commit at a given depth/seq ─────
   The manor silhouette raises a wing at its real birth TIME: look the wing's
   bornCycle (== git depth == seq) up in the carrier and read that stone's epoch.
   A bornCycle past the carrier's last seq has not yet been laid → null. */
export function epochForDepth(events, depth) {
  if (depth < 1 || depth > events.length) return null;
  return events[depth - 1].epoch;   // seq is contiguous 1…N, so index = depth−1
}
