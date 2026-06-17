#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE MUSEUM — gen-cycles.mjs  (the carrier generator, run ONCE per build)

   Walks the estate's true commit record and emits museum/cycles.json — one
   record per COMMIT, in chronological order. The Centennial Jubilee reads ONLY
   this carrier; it never re-derives a fact at runtime that this file did not
   already commit. The page can therefore disagree with neither git nor itself:
   the in-page self-test re-derives every aggregate from these same bytes and a
   Node twin (core.test.mjs) pins the result to the verified git facts.

   Run from the repo root:
     node museum/gen-cycles.mjs            # writes museum/cycles.json
     node museum/gen-cycles.mjs --check    # build in memory, diff vs on-disk

   Each record:
     { seq, sha, epoch, iso, subject, track, cycleNum }
       seq      1-based commit DEPTH in chronological order (git --reverse). This
                IS the estate's "cycle == git depth" rule — the BY-MILESTONE axis
                projects on this, never on a fabricated number.
       sha      the short commit hash (provenance; never displayed as a claim).
       epoch    committer unix seconds (%ct) — the wall-clock x-axis.
       iso      committer ISO-8601 with offset (%cI) — kept for provenance.
       subject  the REAL commit subject (%s), verbatim. Carried as text/plain in
                the page, so a backtick or ${ in a subject can never break a build.
       track    parsed stratigraphy: 'garden' | 'grounds' | 'bug' | 'other'.
       cycleNum the parenthesised '(cycle #N)' tag if present, else null. Only ~30
                commits carry one; the page never invents a number it cannot cite.
   ═══════════════════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'cycles.json');
const REPO = join(__dirname, '..');

/* ── parse the track (stratigraphy) from a subject, lower-cased ───────────────
   The estate's two tracks plus the bug-fixer, read off the verbs the gauge and
   the worklog actually use. A subject can hint more than one; we resolve to the
   single dominant track by priority so a stone is exactly one colour. */
export function trackOf(subject) {
  const s = String(subject).toLowerCase();
  const isBug = /\bbug\b|\bfix(es|ed|ing)?\b|\brepair|\bhotfix|\bpatch\b/.test(s);
  const isGarden = /\bgarden\b|\bplant\b|\bsow(n|s|ing)?\b|\bseed(s|ed|ling)?\b|\bgardener\b|\bbloom/.test(s);
  const isGrounds = /\bgrounds?\b|\bswing\b|\bgroundskeeper\b|\bgrounds-worker\b|\bwing\b|\bplaza|\bavenue|\bestate-rais/.test(s);
  // PLAN/garden bookkeeping commits read as garden; pure NOTES/worklog read 'other'.
  if (isBug && !isGarden && !isGrounds) return 'bug';
  if (isGarden && !isGrounds) return 'garden';
  if (isGrounds && !isGarden) return 'grounds';
  if (isGarden && isGrounds) return 'grounds';   // a wing-opening that also sows → grounds-dominant
  if (isBug) return 'bug';
  return 'other';
}

/* ── parse the parenthesised cycle tag, if any ('(cycle #86)' → 86) ───────── */
export function cycleNumOf(subject) {
  const m = String(subject).match(/\(cycle\s*#(\d+)\)/i);
  return m ? Number(m[1]) : null;
}

/* ── build the carrier records from the git log ───────────────────────────── */
export function buildRecords() {
  // A unit separator the subject can never contain delimits the four fields, so
  // a '|' or any punctuation inside a subject can never split a record wrong.
  const SEP = '␟';
  const raw = execFileSync('git',
    ['log', '--reverse', `--format=%H${SEP}%h${SEP}%ct${SEP}%cI${SEP}%s`],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const lines = raw.split('\n').filter(Boolean);
  return lines.map((line, i) => {
    const [sha_full, sha, ct, iso, ...rest] = line.split(SEP);
    const subject = rest.join(SEP);   // defensive; SEP can't appear in %s
    return {
      seq: i + 1,
      sha,
      epoch: Number(ct),
      iso,
      subject,
      track: trackOf(subject),
      cycleNum: cycleNumOf(subject)
    };
  });
}

/* ── serialize: a stable, pretty JSON the page parses as text/plain ────────── */
export function serialize(records) {
  return JSON.stringify(records, null, 0) + '\n';
}

function main(argv) {
  const records = buildRecords();
  const out = serialize(records);
  if (argv.includes('--check')) {
    let current = '';
    try { current = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
    if (current === out) { console.log('cycles.json — current (' + records.length + ' records).'); return 0; }
    console.error('cycles.json — STALE or MISSING (re-run: node museum/gen-cycles.mjs).');
    return 1;
  }
  writeFileSync(OUT, out);
  const last = records[records.length - 1];
  console.log('museum/gen-cycles.mjs → cycles.json: ' + records.length + ' commits, seq 1…' +
    last.seq + ', epochs ' + records[0].epoch + '…' + last.epoch + '.');
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
