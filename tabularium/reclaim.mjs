#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE TABULARIUM — reclaim.mjs

   Re-pin core.mjs's `export const CLAIM = {...}` to the aggregates RE-DERIVED
   from the live ledger, using the SAME parse + recompute the page and the Node
   twin already trust (core.parseLedger → core.recomputeAggregates). This is the
   one place the hand-typed CLAIM is kept honest — collate.sh runs it every cycle
   right after it folds new marks, so the room's shape-guard can never silently
   staleness-rot the way #61/#66/#70/#87 documented.

   CLAIM is the Node twin's loud "the file changed shape" guard; the PAGE pins its
   pill to PAGE_CLAIM = recompute(its own carrier) instead, so the page can never
   disagree with its ledger. Both move together because collate re-forges the page
   AND re-pins this CLAIM from the one freshly-collated ledger.

   Run:  node tabularium/reclaim.mjs
   Exits 0 on success (whether or not the line changed); non-zero on any error.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseLedger, recomputeAggregates } from './core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEDGER_PATH = join(__dirname, '..', 'ledger', 'ledger.jsonl');
const CORE_PATH = join(__dirname, 'core.mjs');

const raw = readFileSync(LEDGER_PATH, 'utf8');
const parsed = parseLedger(raw);
if (parsed.bad !== 0) {
  console.error('reclaim: REFUSING — ' + parsed.bad + ' malformed ledger line(s); fix the ledger first.');
  process.exit(1);
}
const a = recomputeAggregates(parsed.records);
if (a.minCyc == null || a.maxCyc == null || a.marks === 0) {
  console.error('reclaim: REFUSING — empty or shapeless ledger (marks=' + a.marks + ').');
  process.exit(1);
}

const newLine = 'export const CLAIM = { marks: ' + a.marks + ', makers: ' + a.makers +
  ', cycles: ' + a.cycles + ', minCyc: ' + a.minCyc + ', maxCyc: ' + a.maxCyc + ' };';

const core = readFileSync(CORE_PATH, 'utf8');
const CLAIM_RE = /^export const CLAIM = \{[^}]*\};$/m;
if (!CLAIM_RE.test(core)) {
  console.error('reclaim: could not find the `export const CLAIM = {...};` line in core.mjs.');
  process.exit(1);
}
const updated = core.replace(CLAIM_RE, newLine);
if (updated === core) {
  console.log('reclaim: CLAIM already current [' + a.marks + '/' + a.makers + '/' + a.cycles +
    '/' + a.minCyc + '→' + a.maxCyc + ']');
} else {
  writeFileSync(CORE_PATH, updated);
  console.log('reclaim: CLAIM re-pinned to [' + a.marks + '/' + a.makers + '/' + a.cycles +
    '/' + a.minCyc + '→' + a.maxCyc + ']');
}
process.exit(0);
