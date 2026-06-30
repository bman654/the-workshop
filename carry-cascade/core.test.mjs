#!/usr/bin/env node
// THE CARRY CASCADE — Node twin of the in-page self-test. Runs the SAME
// runSelfTest() the page runs (single source of truth), then adds the heavy
// cross-checks the page can't show inline (exhaustive grids, 200k random pairs
// vs BigInt, byte-parity of the inlined core slab). Exit non-zero on any failure
// so the publisher / forge can gate.

import {
  toDigits, toBigInt, flags, rippleAdd, rippleDepth,
  lookaheadCarries, lookaheadClosedForm, worstCase, runSelfTest,
} from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  \x1b[32m✓\x1b[0m ' + name); }
  else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); console.log('  \x1b[31m✗\x1b[0m ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('\n  THE CARRY CASCADE — core.test.mjs\n  ' + '─'.repeat(58));

// ── Layer 1 (A): the SAME battery the page renders, verbatim ──
console.log('\n  layer 1 · the in-page self-test battery [shared] (verbatim):');
const r = runSelfTest();
for (const line of r.lines) ok('[shared] ' + line.name, line.ok, line.detail);
ok(`[shared] battery reports ${r.pass}/${r.total} green (5 checks)`, r.fails.length === 0 && r.total === 5, `${r.pass}/${r.total}`);

// helper: exact sum of a little-endian digit array, compared to BigInt ground truth.
function sumOk(a, b, base) {
  const rr = rippleAdd(a, b, base);
  return toBigInt(rr.digits, base) === BigInt(a) + BigInt(b);
}

console.log('\n  layer 2 · node-only deep cross-checks:');

// ── (B) EXHAUSTIVE base-10, every pair of 3-digit numbers vs BigInt (1e6) ──
{
  let allok = true, ff = '';
  for (let a = 0; a <= 999 && allok; a++) {
    for (let b = 0; b <= 999; b++) {
      if (!sumOk(a, b, 10)) { allok = false; ff = `${a}+${b}`; break; }
    }
  }
  ok('EXHAUSTIVE base-10 ≤3-digit (1e6 pairs): ripple digits === a+b', allok, ff);
}

// ── (B) EXHAUSTIVE base-2, every pair of 6-bit numbers vs BigInt (4096) ──
{
  let allok = true, ff = '';
  for (let a = 0; a <= 63 && allok; a++) {
    for (let b = 0; b <= 63; b++) {
      const rr = rippleAdd(a, b, 2);
      if (toBigInt(rr.digits, 2) !== BigInt(a + b)) { allok = false; ff = `${a}+${b}`; break; }
      // lookahead digits === ripple digits, digit-for-digit
      const la = lookaheadCarries(a, b, 2);
      if (la.digits.length !== rr.digits.length || !rr.digits.every((d, i) => d === la.digits[i])) { allok = false; ff = `${a}+${b}: la≠ripple`; break; }
    }
  }
  ok('EXHAUSTIVE base-2 ≤6-bit (4096 pairs): ripple===a+b AND lookahead===ripple', allok, ff);
}

// ── (B) EXHAUSTIVE base-16, every pair of 2-digit hex numbers vs BigInt (65 536) ──
// (≤2-digit/65k keeps the build fast; the ≤3-digit/16.7M space is covered by the
//  random sample below. The in-page pill never runs any of this.)
{
  let allok = true, ff = '';
  for (let a = 0; a <= 255 && allok; a++) {
    for (let b = 0; b <= 255; b++) {
      if (!sumOk(a, b, 16)) { allok = false; ff = `${a}+${b}`; break; }
    }
  }
  ok('EXHAUSTIVE base-16 ≤2-digit (65 536 pairs): ripple digits === a+b', allok, ff);
}

// ── (C) 200k random pairs, bases {2,10,16}, ≤8 digits vs BigInt + closed-form on the sample ──
{
  let allok = true, ff = '';
  const bases = [2, 10, 16];
  // a small deterministic PRNG so the test is reproducible
  let s = 0x9e3779b9 >>> 0;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 0x100000000; };
  for (let trial = 0; trial < 200000 && allok; trial++) {
    const base = bases[trial % 3];
    const maxDigits = 8;
    const cap = Math.pow(base, Math.min(maxDigits, base === 2 ? 8 : maxDigits)); // keep Numbers exact
    const a = Math.floor(rnd() * cap);
    const b = Math.floor(rnd() * cap);
    const rr = rippleAdd(a, b, base);
    if (toBigInt(rr.digits, base) !== BigInt(a) + BigInt(b)) { allok = false; ff = `base ${base}: ${a}+${b}`; break; }
    // lookahead digits agree digit-for-digit
    const la = lookaheadCarries(a, b, base);
    if (la.digits.length !== rr.digits.length || !rr.digits.every((d, i) => d === la.digits[i])) { allok = false; ff = `base ${base}: ${a}+${b} la≠ripple`; break; }
    // closed-form carry === recurrence cin at every column
    for (let k = 0; k <= la.n; k++) {
      if (lookaheadClosedForm(a, b, base, k) !== la.cin[k]) { allok = false; ff = `base ${base}: ${a}+${b} col ${k} closed≠recurrence`; break; }
    }
  }
  ok('200k random pairs bases {2,10,16} ≤8 digits: ripple===lookahead===a+b AND closed-form===recurrence', allok, ff);
}

// ── (D) worstCase ⇒ rippleDepth === n, bases 2/10/16, deeper range than the pill ──
{
  let allok = true, ff = '';
  for (const base of [2, 10, 16]) {
    for (let n = 1; n <= 12; n++) {
      const w = worstCase(n, base);
      const dep = rippleDepth(w.a, w.b, base);
      if (dep !== n) { allok = false; ff = `base ${base} n=${n}: depth ${dep} ≠ ${n}`; break; }
      // and the sum is exactly base^n (a 1 followed by n zeros)
      const rr = rippleAdd(w.a, w.b, base);
      if (toBigInt(rr.digits, base) !== BigInt(base) ** BigInt(n)) { allok = false; ff = `base ${base} n=${n}: sum ≠ base^n`; break; }
    }
    if (!allok) break;
  }
  ok('worstCase ⇒ rippleDepth === n AND sum === baseⁿ, bases {2,10,16}, n=1..12', allok, ff);
}

// ── (E) neg-control: a lone generate with no propagate chain has depth 1 ──
{
  let allok = true, ff = '';
  // base-10: x+y with x+y>=10 in units but no propagate above → depth 1
  for (const [a, b, base] of [[5, 5, 10], [6, 7, 10], [1, 1, 2], [8, 8, 16], [9, 9, 16]]) {
    const dep = rippleDepth(a, b, base);
    if (dep !== 1) { allok = false; ff = `base ${base} ${a}+${b}: depth ${dep} ≠ 1`; break; }
  }
  ok('neg-control: lone generate, no propagate chain → depth 1', allok, ff);
}

// ── extra: events stream is well-formed and reconstructs the sum (picture==proof, deep) ──
{
  let allok = true, ff = '';
  for (const base of [2, 10, 16]) {
    for (let trial = 0; trial < 2000 && allok; trial++) {
      const a = Math.floor(Math.random() * Math.pow(base, 5));
      const b = Math.floor(Math.random() * Math.pow(base, 5));
      const rr = rippleAdd(a, b, base);
      // every 'add' event has a matching topple/settle; counts line up with columns
      const adds = rr.events.filter(e => e.type === 'add').length;
      if (adds !== rr.n) { allok = false; ff = `base ${base} ${a}+${b}: ${adds} adds ≠ n ${rr.n}`; break; }
      // depth never exceeds n
      if (rr.depth > rr.n) { allok = false; ff = `base ${base} ${a}+${b}: depth ${rr.depth} > n ${rr.n}`; break; }
      // rendered digits (column.digit + spilled top) reconstruct a+b
      const shown = rr.columns.map(c => c.digit);
      if (rr.finalCarry === 1) shown.push(1);
      if (toBigInt(shown, base) !== BigInt(a) + BigInt(b)) { allok = false; ff = `base ${base} ${a}+${b}: rendered ≠ sum`; break; }
    }
    if (!allok) break;
  }
  ok('events well-formed (n adds, depth ≤ n) AND rendered column.digits reconstruct a+b, bases {2,10,16}', allok, ff);
}

// ── (F) BYTE-PARITY: index.html's inlined CORE slab (normalised) === core.mjs slab ──
{
  let allok = true, ff = '';
  try {
    const coreSrc = readFileSync(join(HERE, 'core.mjs'), 'utf8');
    const html = readFileSync(join(HERE, 'index.html'), 'utf8');
    const BEGIN = 'CARRY-CASCADE CORE BEGIN';
    const END = '/* CORE END */';
    // extract the slab from each: from the BEGIN marker line through the CORE END line.
    function slab(text, label) {
      const bi = text.indexOf(BEGIN);
      const ei = text.indexOf(END, bi);
      if (bi < 0 || ei < 0) throw new Error('sentinels not found in ' + label);
      // start the slab at the line that OPENS the core comment containing BEGIN
      const lineStart = text.lastIndexOf('/*', bi);
      return text.slice(lineStart, ei + END.length);
    }
    // normalise: strip leading indentation per line + trailing whitespace + blank-line runs
    const norm = (s) => s.split('\n').map(l => l.replace(/^\s+/, '').replace(/\s+$/, '')).join('\n').replace(/\n+/g, '\n').trim();
    const a = norm(slab(coreSrc, 'core.mjs'));
    const b = norm(slab(html, 'index.html'));
    if (a !== b) {
      allok = false;
      // find first differing line for a useful message
      const la = a.split('\n'), lb = b.split('\n');
      const m = Math.max(la.length, lb.length);
      for (let i = 0; i < m; i++) { if (la[i] !== lb[i]) { ff = `first diff at norm line ${i}: core[${JSON.stringify(la[i])}] vs html[${JSON.stringify(lb[i])}]`; break; } }
      if (!ff) ff = `lengths ${a.length} vs ${b.length}`;
    }
  } catch (e) {
    allok = false; ff = e.message + ' (run forge first so index.html exists)';
  }
  ok('byte-parity: index.html inlined CORE slab (normalised) === core.mjs', allok, ff);
}

console.log('\n  ' + '─'.repeat(58));
if (fail === 0) {
  console.log(`  \x1b[32mALL GREEN — ${pass}/${pass} checks pass (both layers).\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAILED — ${pass} pass, ${fail} fail.\x1b[0m`);
  for (const f of fails) console.log('    · ' + f);
  console.log('');
  process.exit(1);
}
