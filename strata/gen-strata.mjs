#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE STRATA — gen-strata.mjs   (the carrier generator, run ONCE per build)

   Cuts the estate's whole commit history into a vertical core sample: eight
   strata, oldest at the bottom, each an ERA of the estate's way of working.
   The exhibit reads ONLY the committed carrier this script emits
   (strata/strata.json) — it never re-derives a fact at runtime that this file
   did not already commit. Read, not drawn.

   Run from anywhere (paths are resolved relative to this file):
     node strata/gen-strata.mjs            # writes strata/strata.json
     node strata/gen-strata.mjs --check    # rebuild in memory, byte-diff vs disk

   ── Derivation (the River-of-Days pattern, hardened for a horizon-cut core) ──
   • Linearization is the FULL log, exactly what `git log --reverse` emits —
     1,025 records at today's HEAD, the 6 merge commits included. (The word
     "depth" is deliberately NOT used anywhere in this exhibit — it stays
     reserved for the ledger's numbering, per the two-numbering landmine.)
   • Bucketing key is COMMITTER-EPOCH, not ancestry. A pinned BOUNDS table of
     7 horizon SHAs resolves to 7 committer epochs; those, plus the first
     commit's epoch and asOf's epoch, are 9 cut-points that carve the timeline
     into 8 half-open intervals [cut[k-1], cut[k]) (the last is closed at asOf).
     A horizon commit OPENS its stratum (its epoch is the interval's low bound).
     Epoch bucketing is immune to the merge-commit side-branch seam that an
     ancestry/depth bucketing would misclassify.
   • Two derived thicknesses, both PURE functions of the carrier:
       commitCount  — the COMMITS lever (Σ = 1,025, the asOf log length)
       wallSeconds  — the DAYS lever; a stratum's wall-clock span edge-to-edge,
                      cut[k] − cut[k-1] (horizon-to-horizon). Σ wallSeconds =
                      asOf.epoch − firstCommit.epoch exactly — a gap-free
                      partition of the whole timeline, so DAYS mode makes
                      Stratum 1's long sterile hand-era gaps honestly visible.
     firstEpoch/lastEpoch are the min/max RECORD epochs actually in the stratum
     (so every record's epoch falls inside [firstEpoch, lastEpoch]); they can be
     tighter than the cut-points, and that slack is the honest quiet between an
     era's last commit and the next era's opening horizon.

   ── Merge-survival & determinism (invariant 7) ─────────────────────────────
   • asOf is stored as the FULL 40-char SHA — the machinery pin. `--check`
     resolves asOf from the carrier's OWN stored records (it finds that full SHA
     inside a normal `git log --reverse` walk from HEAD); it NEVER shells
     `git log <asOfSha>` on an assumed-resolvable ref. If asOf is ever dangling
     (a rewritten history), --check reports a named SKIP / refresh-needed state
     and exits 0 — it degrades, it does not crash the estate suite.
   • Stratum 8 is OPEN-TOP: bounded by asOf (pinned HEAD at generation). --check
     re-derives UP TO asOf and byte-diffs, so commits landing AFTER generation
     never make it spuriously stale. Re-running gen to extend the topsoil is a
     deliberate act (T7.3 does exactly one, just before merge) — not staleness.
   • `generated` is pinned to asOf's OWN committer ISO, not wall-clock time:
     there is no Date.* in any logic path, so the output is a pure function of
     git state and --check is byte-stable across repeated runs.
   • Displayed SHAs (horizons, firstSha/lastSha) are git's own 7-char %h — the
     idiom every doc and engraving uses. Within a branch %h is deterministic;
     git abbreviation drift after a merge is the documented T7.3 / post-merge
     refresh contingency, not this branch's gate.

   ── Integrity (separate from bucketing) ────────────────────────────────────
   assertIntegrity() checks the BOUNDS table itself: every horizon SHA exists,
   and the 7 horizons sit in STRICT ANCESTRY order (each an ancestor of the
   next, all ancestors of asOf). This is an independent guard on the pins, run
   at generation (a bad table refuses to write) and re-run by the core twin.
   ═══════════════════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'strata.json');
const REPO = join(__dirname, '..');
const SEP = '␟'; // U+241F — a subject can never contain it, so no record splits wrong.

/* ── The 7 pinned horizons (short SHA + boundary event), oldest→newest ────────
   The event strings are concise boundary labels in the estate's voice; the
   full plaque prose (the horizon-1 fun-forever stowaway, the kintsugi crack
   citations) is authored on the PAGE at T2.3, not carried here. */
export const HORIZONS = [
  { sha: '61a58bd', event: 'The loop is born — fun-forever.js enters the tree' },
  { sha: '53fc21d', event: 'Cadence becomes code — the deterministic gauge' },
  { sha: '8baf9cb', event: 'Prompts leave the code — the loop’s behavior becomes content' },
  { sha: '6192668', event: 'The gate foundry waves begin — the estate builds reach' },
  { sha: '1fcf669', event: 'The atomic seal — a quota death can no longer strand a cycle' },
  { sha: 'f274ca7', event: 'The program era begins — the fun-forever loop is parked' },
  { sha: '305f815', event: 'The estate learns to speak — Book 1, the Showing' },
];

/* ── Era names, one per stratum (oldest→newest) ───────────────────────────────
   PLACEHOLDER: the plan's current working-lean set. T2.4 (Fable) makes the
   final selection from ERAS.md's candidates, re-writes these, and re-checks. */
export const ERA_NAMES = [
  'The Bedrock of Hands',
  'The First Fire',
  'The Iron Gauge',
  'The Open Drawer',
  'Crucible and Baton',
  'The Scar-Tissue Bed',
  'The Surveyed Ring',
  'Topsoil, with a Voice',
];

/* ── Read the whole log as ordered records (chronological, git --reverse) ──── */
export function buildRecords() {
  const raw = execFileSync('git',
    ['log', '--reverse', `--format=%H${SEP}%h${SEP}%ct${SEP}%cI${SEP}%s`],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const lines = raw.split('\n').filter(Boolean);
  return lines.map((line, i) => {
    const [shaFull, sha, ct, iso, ...rest] = line.split(SEP);
    return {
      seq: i + 1,
      sha,                 // git's 7-char %h — the displayed/engraved form
      shaFull,             // full %H — matching + ancestry
      epoch: Number(ct),   // committer unix seconds (%ct)
      iso,                 // committer ISO-8601 with offset (%cI)
      subject: rest.join(SEP),
    };
  });
}

/* ── Find the record that a pinned short SHA refers to (exact %h, else prefix) */
function findHorizonRecord(records, shortSha) {
  const rec = records.find((r) => r.sha === shortSha || r.shaFull.startsWith(shortSha));
  if (!rec) throw new Error(`horizon ${shortSha} not found in the log up to asOf`);
  return rec;
}

/* ── Strict-ancestry integrity guard on the BOUNDS table (git-touching) ─────── */
export function assertIntegrity(records, asOfFull) {
  const fulls = HORIZONS.map((h) => findHorizonRecord(records, h.sha).shaFull);
  const isAncestor = (a, b) => {
    try { execFileSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: REPO }); return true; }
    catch { return false; }
  };
  for (let i = 0; i < fulls.length - 1; i++) {
    if (!isAncestor(fulls[i], fulls[i + 1]))
      throw new Error(`integrity: horizon ${HORIZONS[i].sha} is not an ancestor of ${HORIZONS[i + 1].sha}`);
  }
  for (let i = 0; i < fulls.length; i++) {
    if (!isAncestor(fulls[i], asOfFull))
      throw new Error(`integrity: horizon ${HORIZONS[i].sha} is not an ancestor of asOf`);
  }
  return true;
}

/* ── Build the carrier object, truncating the log at asOf (open-top honest) ─── */
export function buildCarrier(asOfFull, records = buildRecords()) {
  const asOfIdx = records.findIndex((r) => r.shaFull === asOfFull);
  if (asOfIdx < 0) return { skip: true, asOfFull };
  const recs = records.slice(0, asOfIdx + 1); // up to and including asOf
  const asOf = recs[asOfIdx];

  // 9 cut-points: [firstCommit, horizon1..7, asOf], all committer epochs.
  const horizonRecs = HORIZONS.map((h) => findHorizonRecord(recs, h.sha));
  const cuts = [recs[0].epoch, ...horizonRecs.map((r) => r.epoch), asOf.epoch];

  const strata = [];
  for (let k = 1; k <= 8; k++) {
    const lo = cuts[k - 1], hi = cuts[k];
    const inStratum = recs.filter((r) =>
      k < 8 ? (r.epoch >= lo && r.epoch < hi) : (r.epoch >= lo && r.epoch <= hi));
    const first = inStratum[0], last = inStratum[inStratum.length - 1];
    strata.push({
      id: k,
      name: ERA_NAMES[k - 1],
      firstSha: first.sha,
      lastSha: last.sha,
      firstEpoch: first.epoch,
      lastEpoch: last.epoch,
      commitCount: inStratum.length,
      wallSeconds: hi - lo,
    });
  }

  const horizons = HORIZONS.map((h, i) => ({
    sha: h.sha,
    date: horizonRecs[i].iso.slice(0, 10), // YYYY-MM-DD, committer calendar date
    event: h.event,
  }));

  return {
    carrier: { asOf: asOf.shaFull, generated: asOf.iso, strata, horizons },
    records: recs,
  };
}

/* ── Stable, readable serialization the page parses as inert JSON ──────────── */
export function serialize(carrier) {
  return JSON.stringify(carrier, null, 2) + '\n';
}

function main(argv) {
  if (argv.includes('--check')) {
    let onDisk = '';
    try { onDisk = readFileSync(OUT, 'utf8'); }
    catch { console.error('strata.json — MISSING (re-run: node strata/gen-strata.mjs).'); return 1; }

    let asOfFull;
    try { asOfFull = JSON.parse(onDisk).asOf; }
    catch { console.error('strata.json — UNPARSEABLE (re-run: node strata/gen-strata.mjs).'); return 1; }

    const records = buildRecords();
    if (!records.some((r) => r.shaFull === asOfFull)) {
      // asOf resolved from the carrier's OWN records is unreachable in the
      // current history (a rewritten/dangling ref). Named SKIP, never a crash.
      console.warn(`strata.json — SKIP: asOf ${String(asOfFull).slice(0, 7)} is not in the current ` +
        'history; a carrier refresh is needed (node strata/gen-strata.mjs). Not verifying byte-identity.');
      return 0;
    }

    const built = buildCarrier(asOfFull, records);
    assertIntegrity(built.records, asOfFull); // asOf reachable here → git calls are safe
    const out = serialize(built.carrier);
    if (out === onDisk) {
      const n = built.records.length;
      console.log(`strata.json — current (8 strata, ${n} commits to asOf ${String(asOfFull).slice(0, 7)}).`);
      return 0;
    }
    console.error('strata.json — STALE (re-run: node strata/gen-strata.mjs).');
    return 1;
  }

  // Generate.
  const records = buildRecords();
  const asOfFull = records[records.length - 1].shaFull;
  assertIntegrity(records, asOfFull); // refuse to write a carrier over a bad BOUNDS table
  const built = buildCarrier(asOfFull, records);
  writeFileSync(OUT, serialize(built.carrier));
  const c = built.carrier;
  const sum = c.strata.reduce((a, s) => a + s.commitCount, 0);
  console.log(`strata/gen-strata.mjs → strata.json: 8 strata, ${sum} commits to asOf ` +
    `${asOfFull.slice(0, 7)} (${c.generated.slice(0, 10)}). ` +
    `counts [${c.strata.map((s) => s.commitCount).join(', ')}].`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
