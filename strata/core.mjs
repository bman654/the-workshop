/* ═══════════════════════════════════════════════════════════════════════════
   THE STRATA — core.mjs   (the carrier's self-test battery + lever geometry)

   Single source of truth for every claim "The Strata" makes about the cut it
   displays. Imported by BOTH:
     • strata/core.test.mjs — the Node twin, run against the REAL committed
                              strata/strata.json (and cross-checked against live
                              git via strata/gen-strata.mjs).
     • strata/index.html    — inlined verbatim at forge time (forge strips the
                              `export ` keyword), so the in-page pill computes the
                              IDENTICAL battery from the SAME carrier bytes.

   DOM-free, ZERO-import, no randomness, no wall-clock NOW (invariant 7). This
   module reads ONLY the parsed carrier — it never shells git, never touches the
   filesystem. The git-touching re-derivation (the full 1,025-record log, the
   strict-ancestry proof, the byte-identical rebuild) lives in gen-strata.mjs and
   is exercised only by the Node twin; the PAGE never sees it. Read, not drawn.

   ── What the carrier is ────────────────────────────────────────────────────
   strata/strata.json:
     { asOf, generated,
       strata:   [{ id, name, firstSha, lastSha, firstEpoch, lastEpoch,
                    commitCount, wallSeconds } × 8],   // oldest → newest
       horizons: [{ sha, date, event } × 7] }          // the 7 boundary lines

   ── The two lever geometries (COMMITS ↔ DAYS), pure functions of the carrier ─
   The core's total height is partitioned among the 8 strata two ways:
     COMMITS mode — a stratum's height ∝ its commitCount (June-13's storm layer
                    swells).
     DAYS    mode — a stratum's height ∝ its wallSeconds (Stratum 1's long
                    sterile hand-era gaps become honestly visible).
   Both are built by CUMULATIVE OFFSET so they sum to coreHeight EXACTLY (the
   top boundary lands on coreHeight by telescoping, no float drift), and each
   height is exactly proportional: height[k]·total === coreHeight·value[k].

   ── The pure-carrier invariants the battery proves (page + twin) ────────────
   L1  exactly 8 strata, ids contiguous 1…8.
   L2  each stratum well-formed: commitCount ≥ 1, wallSeconds ≥ 0, integer
       epochs, firstEpoch ≤ lastEpoch, firstSha/lastSha present.
   L3  STRICT monotonic ACROSS stratum boundaries: lastEpoch[k] < firstEpoch[k+1]
       (the strict `<` the spec asks for; the FULL 1,025-record stream is only
       NON-DECREASING — 6 within-stratum committer-epoch ties — so the twin
       checks the full stream with `<=`, strict `<` ONLY across boundaries).
   L4  GAP-FREE WALL PARTITION: Σ wallSeconds === lastEpoch[8] − firstEpoch[1]
       exactly — the DAYS heights tile the whole timeline edge to edge.
   L5  HORIZON LINKAGE: 7 horizons; horizon k opens stratum k+1
       (horizons[k].sha === strata[k+1].firstSha), each carries a date.
   L6  COMMITS geometry is a pure fn of the carrier: Σ heights === coreHeight and
       height[k]·total === coreHeight·commitCount[k].
   L7  DAYS geometry likewise, against wallSeconds.
   The counts-sum-to-the-real-log-length leg (Σ commitCount === 1,025) and the
   strict-ancestry proof are GIT cross-checks and live in the twin — the carrier
   alone cannot know git's true log length.

   ── Negative control ───────────────────────────────────────────────────────
   tamper(carrier, mode) returns a mutated CLONE (never mutates the source):
     'horizon' — forges a fake horizon SHA → L5 linkage bites RED. This backs the
                 page's "⚠ forge a fake horizon" button.
     'epoch'   — shoves a boundary epoch past the next stratum's opening → L3 (and
                 L4) bite RED.
     'count'   — bumps a commitCount; NO pure-carrier leg catches this (the lever
                 geometry re-normalizes), so it is the TWIN's git leg (Σ commitCount
                 === real log length) that bites — proving that cross-check earns
                 its keep.
   ═══════════════════════════════════════════════════════════════════════════ */

/* The core's reference height for the self-test's geometry legs. The page passes
   its own real pixel height to leverGeometry(); this constant is just the height
   the battery proves the partition properties at. */
export const CORE_HEIGHT = 1000;

/* How many strata the cut always has (the exhibit's spine is fixed at 8 eras). */
export const EXPECTED_STRATA = 8;

/* Float tolerance for the geometry legs (the only place non-integers appear). */
const EPS = 1e-9;

/* ── parse: the inert carrier text → the carrier object ─────────────────────
   The page inlines strata.json as an inert <script type="text/plain"> and reads
   its .textContent; the twin reads the file. Both hand the raw text here. */
export function parse(raw) {
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/* ── leverGeometry: carrier + mode → the partitioned heights ────────────────
   mode 'commits' → heights ∝ commitCount; mode 'days' → heights ∝ wallSeconds.
   Built by cumulative offset so bounds[0] === 0 and bounds[8] === coreHeight
   EXACTLY (telescoping), hence Σ heights === coreHeight with no accumulated
   float drift. Pure: same carrier + mode + coreHeight → identical geometry.
   Returns { key, total, bounds:[9], heights:[8] } (bounds are cut y-offsets,
   oldest→newest; heights[k] is stratum k+1's slab thickness). */
export function leverGeometry(carrier, mode = 'commits', coreHeight = CORE_HEIGHT) {
  const key = mode === 'days' ? 'wallSeconds' : 'commitCount';
  const vals = carrier.strata.map((s) => s[key]);
  const total = vals.reduce((a, b) => a + b, 0);
  const bounds = [0];
  let cum = 0;
  for (const v of vals) {
    cum += v;
    bounds.push(total === 0 ? 0 : (coreHeight * cum) / total);
  }
  const heights = [];
  for (let k = 1; k < bounds.length; k++) heights.push(bounds[k] - bounds[k - 1]);
  return { key, total, bounds, heights };
}

/* ── tamper: the NEGATIVE CONTROL — return a broken CLONE of the carrier ─────
   Operates on a JSON deep-copy; never mutates the source bytes. See the header
   for what each mode breaks. Default 'horizon' backs the page button. */
export function tamper(carrier, mode = 'horizon') {
  const c = JSON.parse(JSON.stringify(carrier));
  if (mode === 'count') {
    c.strata[4].commitCount += 1;                     // caught only by the twin's git leg
  } else if (mode === 'epoch') {
    // shove stratum 3's last epoch PAST stratum 4's opening → L3 (and L4) bite.
    c.strata[2].lastEpoch = c.strata[3].firstEpoch + 100;
  } else {
    c.horizons[3].sha = '0000000';                    // a forged horizon → L5 linkage bites
  }
  return c;
}

/* ── selfTest: the full carrier-fidelity battery (page pill + twin section A) ──
   Given the parsed carrier (+ an optional geometry reference height), returns
   named checks — the SAME legs the in-page pill runs. Pure. */
export function selfTest(carrier, coreHeight = CORE_HEIGHT) {
  const checks = [];
  const add = (label, pass, detail) =>
    checks.push({ label, pass: !!pass, detail: detail == null ? '' : String(detail) });

  const S = Array.isArray(carrier && carrier.strata) ? carrier.strata : [];
  const H = Array.isArray(carrier && carrier.horizons) ? carrier.horizons : [];
  const logLength = S.reduce((a, s) => a + (s.commitCount || 0), 0);

  // L1 — exactly 8 strata, ids contiguous 1…8
  let idsOK = S.length === EXPECTED_STRATA;
  for (let i = 0; i < S.length; i++) if (S[i].id !== i + 1) { idsOK = false; break; }
  add('exactly ' + EXPECTED_STRATA + ' strata, ids 1…' + EXPECTED_STRATA, idsOK,
    S.length + ' strata');

  // L2 — each stratum well-formed
  let wf = S.length === EXPECTED_STRATA, wfWhy = 'ok';
  for (const s of S) {
    if (!(Number.isInteger(s.commitCount) && s.commitCount >= 1)) { wf = false; wfWhy = 'bad commitCount @' + s.id; break; }
    if (!(Number.isInteger(s.wallSeconds) && s.wallSeconds >= 0)) { wf = false; wfWhy = 'bad wallSeconds @' + s.id; break; }
    if (!(Number.isInteger(s.firstEpoch) && Number.isInteger(s.lastEpoch) && s.firstEpoch <= s.lastEpoch)) { wf = false; wfWhy = 'bad epochs @' + s.id; break; }
    if (!(s.firstSha && s.lastSha)) { wf = false; wfWhy = 'missing sha @' + s.id; break; }
  }
  add('every stratum well-formed (int epochs, count ≥ 1, first ≤ last, shas present)', wf, wfWhy);

  // L3 — STRICT monotonic across stratum boundaries (see header: full stream is
  // only non-decreasing; that `<=` leg lives in the twin against the real records)
  let bStrict = S.length === EXPECTED_STRATA, bWhy = 'lastEpoch[k] < firstEpoch[k+1]';
  for (let k = 0; k < S.length - 1; k++) {
    if (!(S[k].lastEpoch < S[k + 1].firstEpoch)) { bStrict = false; bWhy = 'not strict at boundary ' + (k + 1) + '→' + (k + 2); break; }
  }
  add('epochs strictly increase across every stratum boundary', bStrict, bWhy);

  // L4 — gap-free wall partition: Σ wallSeconds === lastEpoch[8] − firstEpoch[1]
  const sumWall = S.reduce((a, s) => a + (s.wallSeconds || 0), 0);
  const span = S.length ? (S[S.length - 1].lastEpoch - S[0].firstEpoch) : NaN;
  add('Σ wallSeconds === full timeline span (gap-free DAYS partition)', sumWall === span,
    sumWall + ' vs ' + span);

  // L5 — horizon linkage: 7 horizons, horizon k opens stratum k+1
  let linkOK = H.length === EXPECTED_STRATA - 1 && S.length === EXPECTED_STRATA, linkWhy = H.length + ' horizons';
  if (linkOK) {
    for (let k = 0; k < H.length; k++) {
      if (!H[k].sha || !H[k].date) { linkOK = false; linkWhy = 'malformed horizon ' + (k + 1); break; }
      if (H[k].sha !== S[k + 1].firstSha) { linkOK = false; linkWhy = 'horizon ' + (k + 1) + ' (' + H[k].sha + ') ≠ stratum ' + (k + 2) + ' firstSha (' + S[k + 1].firstSha + ')'; break; }
    }
  }
  add('7 horizons, each opens the next stratum (sha === firstSha)', linkOK, linkWhy);

  // L6 / L7 — both lever geometries are pure functions of the carrier
  for (const mode of ['commits', 'days']) {
    const g = leverGeometry(carrier, mode, coreHeight);
    const sumH = g.heights.reduce((a, b) => a + b, 0);
    let sums = Math.abs(sumH - coreHeight) < EPS;
    let prop = true, propWhy = '';
    for (let k = 0; k < g.heights.length; k++) {
      // height[k]·total === coreHeight·value[k] (exact proportion, EPS for float)
      if (Math.abs(g.heights[k] * g.total - coreHeight * S[k][g.key]) > EPS * Math.max(1, g.total)) {
        prop = false; propWhy = 'not ∝ at stratum ' + (k + 1); break;
      }
    }
    add(mode.toUpperCase() + ' heights are a pure fn of the carrier (Σ === coreHeight, ∝ ' + g.key + ')',
      sums && prop, sums ? (prop ? 'Σ=' + sumH.toFixed(3) : propWhy) : 'Σ=' + sumH.toFixed(3) + ' ≠ ' + coreHeight);
  }

  return { checks, strataCount: S.length, logLength };
}

/* ── verdict: a battery → { passN, total, allPass } ─────────────────────────── */
export function verdict(checks) {
  const passN = checks.filter((c) => c.pass).length;
  return { passN, total: checks.length, allPass: passN === checks.length };
}
