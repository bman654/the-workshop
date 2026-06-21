#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE CENSUS OF HANDS — reclaim.mjs

   Re-pin core.mjs's `export const CLAIM = {...}` to the figures RE-DERIVED from
   the live ledger, using the SAME parse + buildCensus the page and the Node twin
   already trust (core.parse → core.buildCensus). This is the one place the
   hand-pinned CLAIM is kept honest — collate.sh runs it every cycle right after
   it folds new marks, so the Census's shape-guard can never silently
   staleness-rot the way the Tabularium's did until #61/#66/#70/#87 (and the
   Census's would have until #153/#154, see ledger/README.md).

   CLAIM is the Node twin's loud "the ledger changed shape" guard; the PAGE pins
   its pill to buildCensus(its own inlined carrier) instead, so the page can never
   disagree with its ledger. Both move together because collate re-pins this CLAIM
   AND re-forges the page (which re-inlines core.mjs) from the one freshly-collated
   ledger.

   Run:  node census/reclaim.mjs
   Exits 0 on success (whether or not the line changed); non-zero on any error.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse, buildCensus, BASES, OTHER } from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = join(__dirname, '..', 'ledger', 'ledger.jsonl');
const CORE_PATH = join(__dirname, 'core.mjs');

const raw = readFileSync(LEDGER_PATH, 'utf8');

// REFUSE on a malformed or empty ledger — exactly as tabularium/reclaim.mjs does.
const parsed = parse(raw);
if (parsed.bad !== 0) {
  console.error('reclaim: REFUSING — ' + parsed.bad + ' malformed ledger line(s); fix the ledger first.');
  process.exit(1);
}
if (parsed.marks.length === 0) {
  console.error('reclaim: REFUSING — empty ledger (0 marks).');
  process.exit(1);
}

const c = buildCensus(raw);
if (c.N === 0) {
  console.error('reclaim: REFUSING — shapeless census (N=' + c.N + ').');
  process.exit(1);
}

/* ── Emit the CLAIM block in the room's EXACT on-disk layout ──────────────────
   The Census's CLAIM is a multi-line object literal with a hand-tuned shape:
   a per-line byRole grouping (5 / 4 / 3 buckets) in a FIXED display order, and
   an aligned comment on the `againNames:` line. We reproduce that layout byte-
   for-byte (only the integers change) so a no-op reclaim leaves the file
   untouched and `forge --check --all` stays clean. The figures are RE-DERIVED
   from buildCensus — never hand-typed. */

// The room's chosen byRole DISPLAY order (NOT alphabetical / not BASES order):
// most-populous-historically first, ending in the architect + the `other`
// catch-all. Every bucket in BASES + OTHER appears exactly once, so the printed
// partition is total and Σ === N regardless of which order we print.
const DISPLAY_ORDER = [
  'publisher', 'explorer', 'director', 'judge', 'builder',
  'planter', 'bug-fixer', 'gardener', 'grounds-worker',
  'steward', 'architect', 'groundskeeper', OTHER
];
// Guard: the display order must be a permutation of the live bucket set, so a
// future bucket can never be silently dropped from the pinned partition.
const liveBuckets = new Set([...BASES, OTHER]);
const orderSet = new Set(DISPLAY_ORDER);
if (orderSet.size !== liveBuckets.size || [...liveBuckets].some((b) => !orderSet.has(b))) {
  console.error('reclaim: REFUSING — DISPLAY_ORDER is not a permutation of BASES+OTHER; ' +
    'a bucket was added to core.mjs without updating reclaim.mjs DISPLAY_ORDER.');
  process.exit(1);
}

// A bucket key as it appears in the literal: bare identifier, or quoted if it
// contains a hyphen (the two hyphenated bases must be string keys).
const keyOf = (b) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(b) ? b : "'" + b + "'");
const pair = (b) => keyOf(b) + ': ' + c.byRole.get(b);

// byRole printed in three lines, grouped 5 / 4 / 4 (the room's layout), each
// line indented four spaces (two levels), trailing comma between groups.
const g1 = DISPLAY_ORDER.slice(0, 5).map(pair).join(', ');
const g2 = DISPLAY_ORDER.slice(5, 9).map(pair).join(', ');
const g3 = DISPLAY_ORDER.slice(9).map(pair).join(', ');

// The aligned comment on the againNames line: `//` sits at column 26 (matching
// the room's hand alignment for the 2-digit value), with at least one space.
const againField = '  againNames: ' + c.again.names + ',';
const padToCol = 26;
const pad = Math.max(1, padToCol - againField.length);
const againLine = againField + ' '.repeat(pad) +
  '// hands that signed >1 mark (' + c.again.tokens + ' of the ' + c.N + ' tokens)';

const newBlock =
  'export const CLAIM = {\n' +
  '  N: ' + c.N + ',\n' +
  '  distinctNames: ' + c.distinctNames + ',\n' +
  againLine + '\n' +
  '  byRole: {\n' +
  '    ' + g1 + ',\n' +
  '    ' + g2 + ',\n' +
  '    ' + g3 + '\n' +
  '  }\n' +
  '};';

const core = readFileSync(CORE_PATH, 'utf8');
// The CLAIM is a MULTI-LINE object literal, so the Tabularium's line-anchored
// single-`{[^}]*}` regex will not match. Span the whole `export const CLAIM = {
// ... };` block (non-greedy through the first `};`).
const CLAIM_RE = /export const CLAIM = \{[\s\S]*?\};/;
if (!CLAIM_RE.test(core)) {
  console.error('reclaim: could not find the `export const CLAIM = { ... };` block in core.mjs.');
  process.exit(1);
}
const updated = core.replace(CLAIM_RE, newBlock);

const tag = '[N=' + c.N + ' · ' + c.distinctNames + ' names · ' +
  c.again.names + ' returned]';
if (updated === core) {
  console.log('reclaim: CLAIM already current ' + tag);
} else {
  writeFileSync(CORE_PATH, updated);
  console.log('reclaim: CLAIM re-pinned to ' + tag);
}
process.exit(0);
