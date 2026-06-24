#!/usr/bin/env node
/* ── Node twin for backlog.mjs — the pure cores, proven exact ─────────────────
   Run: node gate-foundry/backlog.test.mjs   (exit 0 = all green). No live git,
   no file reads of the estate — only synthetic fixtures, so it is fast and
   hermetic. Covers the two pure cores:
     • extractBespokeKeys(text)  — the comment/string-aware key scan
     • computeBacklog(inv, keys) — the set-diff + oldest-first sort
   ──────────────────────────────────────────────────────────────────────────── */
import { extractBespokeKeys, computeBacklog, ENTRY_SENTINEL } from './backlog.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ✗ ' + m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const threw = (fn) => { try { fn(); return false; } catch { return true; } };

console.log('extractBespokeKeys — bare + quoted keys, nested braces, comments, hex strings:');
{
  // mirrors the real the-gate/rooms.js shape: bare + 3 quoted styles, nested
  // repColors object (whose keys must NOT be picked up), line + block comments,
  // and `#hex` / `:` characters living inside strings.
  const fixture = `
    var BESPOKE = {
      cairn: { rep: 'cairn', repColors: undefined },     // a // url:// in a comment
      'physics-lab': { rep: 'cavern-mound', repColors: {
        DAY:   { 'rep.swatch1': '#6e7680', 'rep.glow1': '#7fd4c0' },  /* nested: key: */
        NIGHT: { 'rep.swatch1': '#3a4048' }
      } },
      "ripple": { rep: 'ripple-tank' },
      \`sound-garden\`: { rep: 'organ-pipes' }
    };
    // trailing decoy that must be ignored: notAKey: 1`;
  eq(extractBespokeKeys(fixture), ['cairn', 'physics-lab', 'ripple', 'sound-garden'],
    'exactly the 4 top-level keys, skipping nested object keys, comments, and decoys');
}

console.log('extractBespokeKeys — a key whose name contains a colon-bearing string value nearby:');
{
  const fixture = `var BESPOKE = { foo: { href: 'a/b:c', blurb: "ratio 1:2" }, bar: {} };`;
  eq(extractBespokeKeys(fixture), ['foo', 'bar'], 'colons inside string values never read as keys');
}

console.log('extractBespokeKeys — refuses on broken input (loud failure, never silent-empty):');
{
  ok(threw(() => extractBespokeKeys('no registry here')), 'missing BESPOKE marker throws');
  ok(threw(() => extractBespokeKeys('var BESPOKE = ;')), 'BESPOKE with no `{` throws');
  ok(threw(() => extractBespokeKeys('var BESPOKE = {')), 'unbalanced braces throw');
  ok(threw(() => extractBespokeKeys('var BESPOKE = {  };')), 'an empty registry throws (would over-report backlog)');
}

console.log('computeBacklog — set-diff removes repped ids:');
{
  const inv = [
    { id: 'a', room: 'A', entry: 10 },
    { id: 'b', room: 'B', entry: 20 },
    { id: 'c', room: 'C', entry: 30 },
  ];
  const back = computeBacklog(inv, ['b']);
  eq(back.map((r) => r.id), ['a', 'c'], 'repped id "b" excluded; rest kept');
}

console.log('computeBacklog — a synthetic BESPOKE key matching no room drops out harmlessly:');
{
  const inv = [
    { id: 'physics-lab', room: 'Lab', entry: 20 },
    { id: 'verse', room: 'Study', entry: 10 },
  ];
  // 'cairn' is the synthetic fixture key — it is NOT a real room id
  const back = computeBacklog(inv, ['physics-lab', 'cairn']);
  eq(back.map((r) => r.id), ['verse'], 'physics-lab repped+removed; cairn matches nothing; verse remains');
}

console.log('computeBacklog — sort is entry asc, then id asc on ties:');
{
  const inv = [
    { id: 'zeta', room: 'Z', entry: 30 },
    { id: 'beta', room: 'B', entry: 10 },   // tie with alpha on entry
    { id: 'alpha', room: 'A', entry: 10 },  // tie with beta on entry
    { id: 'gamma', room: 'G', entry: 20 },
  ];
  const back = computeBacklog(inv, []);
  eq(back.map((r) => r.id), ['alpha', 'beta', 'gamma', 'zeta'],
    'oldest (smallest depth) first; equal-depth rooms break by id ascending');
}

console.log('computeBacklog — missing / sentinel entry sorts LAST, never crashes:');
{
  const inv = [
    { id: 'new1', room: 'New1', entry: ENTRY_SENTINEL, entryDate: '' }, // brand-new, sentinel
    { id: 'old', room: 'Old', entry: 5 },
    { id: 'new2', room: 'New2' },                                       // no entry field at all
    { id: 'mid', room: 'Mid', entry: 100 },
  ];
  const back = computeBacklog(inv, []);
  // old (5) < mid (100) < both sentinels; the two sentinels tie and break by id (new1, new2)
  eq(back.map((r) => r.id), ['old', 'mid', 'new1', 'new2'],
    'real depths first; sentinel/absent entries last, tie-broken by id');
}

console.log('computeBacklog — does not mutate its input array order:');
{
  const inv = [
    { id: 'b', entry: 20 },
    { id: 'a', entry: 10 },
  ];
  const snapshot = inv.map((r) => r.id).join(',');
  computeBacklog(inv, []);
  // computeBacklog filters into a NEW array, so the caller's `inv` is untouched.
  eq(inv.map((r) => r.id).join(','), snapshot, 'caller inventory array is not reordered in place');
}

console.log('');
if (fail) { console.error(`✗ ${fail} failed, ${pass} passed`); process.exit(1); }
console.log(`✓ all ${pass} checks passed`);
process.exit(0);
