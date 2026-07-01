#!/usr/bin/env node
// prepare.mjs — build-time assembler for the Colophon's cloud-data.json.
//
// Inputs (all siblings of this file):
//   prose.txt          — the verbatim article text, paragraphs separated by blank lines
//   colophon.json      — the TTS timing sidecar ({items:[{type:"word",value,s,e}]}, ms)
//   distractors-p*.json + fixes-p*.json — per-paragraph candidate alternatives + verifier fixes
//   end-set.json       — the hand-authored final candidate set for the ⟨end⟩ token
//
// Output:
//   cloud-data.json    — one validated payload the page inlines via forge:json
//
// This file is also the piece's proof layer: every falsifiable property of the data
// (full coverage, strict timing order, alignment of every spoken word to a timing,
// no distractor equal to its truth, format of every candidate) is asserted here at
// build time. The page itself stays art — a broken invariant fails THIS script loud.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const die = (msg) => { console.error('prepare: FAIL — ' + msg); process.exit(1); };

// ── 1. tokenize the prose exactly like the page runtime does ────────────────────
// Display tokens are whitespace runs; a standalone "—" is display-only (unspoken)
// and attaches to the PREVIOUS spoken word's landing group (paragraph-leading "—"
// attaches to the NEXT). Bare form strips edge punctuation, keeps internal ’ ' -.
const BARE = (t) => t.replace(/^[^A-Za-z0-9'’]+|[^A-Za-z0-9'’]+$/g, '');
const paras = read('prose.txt').trim().split(/\n\n+/);
const words = []; // {i, p, w, display}
// A position is sentence-initial (→ its candidates should be Capitalized) at a
// paragraph start or right after a sentence terminator; otherwise it is mid-
// sentence (→ candidates lowercase, unless the candidate is itself a proper noun).
const TERMINATES = (disp) => /[.!?]["'’)\]]?$/.test(disp);
paras.forEach((para, p) => {
  const toks = para.split(/\s+/);
  const paraStart = words.length;
  toks.forEach((t) => {
    if (t === '—') {
      if (words.length > paraStart) words[words.length - 1].display += ' —';
      else words.__pendingDash = true; // paragraph-leading dash → attach forward
      return;
    }
    const w = BARE(t);
    if (!w) die(`unbare-able token ${JSON.stringify(t)} in paragraph ${p}`);
    let display = t;
    if (words.__pendingDash) { display = '— ' + t; delete words.__pendingDash; }
    const initial = words.length === paraStart || TERMINATES(words[words.length - 1].display);
    words.push({ i: words.length, p, w, display, initial });
  });
});
if (words.__pendingDash) die('trailing unattached em-dash');

// ── 2. align spoken timings to the words, strictly in order ─────────────────────
const timing = JSON.parse(read('colophon.json'));
const spoken = timing.items.filter((it) => it.type === 'word');
const cues = timing.items.length - spoken.length;
if (cues) console.log(`prepare: note — ${cues} non-word cue item(s) skipped`);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

let j = 0;
for (let i = 0; i < words.length; i++) {
  const want = norm(words[i].w);
  if (j >= spoken.length) die(`ran out of spoken words at prose word #${i} "${words[i].w}"`);
  if (norm(spoken[j].value) === want) {
    words[i].s = spoken[j].s; words[i].e = spoken[j].e; j++;
    continue;
  }
  // TTS split one prose word into several items (e.g. a hyphenated word)
  let acc = '', k = j;
  while (k < spoken.length && acc.length < want.length) { acc += norm(spoken[k].value); k++; }
  if (acc === want) {
    words[i].s = spoken[j].s; words[i].e = spoken[k - 1].e; j = k;
    continue;
  }
  // TTS merged several prose words into one item: split its span by letter share
  const item = norm(spoken[j].value);
  if (item.startsWith(want)) {
    let accW = want; const span = [i];
    while (accW.length < item.length && span[span.length - 1] + 1 < words.length) {
      const nx = span[span.length - 1] + 1;
      accW += norm(words[nx].w); span.push(nx);
    }
    if (accW === item) {
      const { s, e } = spoken[j];
      let off = 0;
      for (const ix of span) {
        const frac0 = off / item.length;
        off += norm(words[ix].w).length;
        const frac1 = off / item.length;
        words[ix].s = Math.round(s + (e - s) * frac0);
        words[ix].e = Math.round(s + (e - s) * frac1);
      }
      j++;
      i = span[span.length - 1];
      continue;
    }
  }
  die(`alignment broke at prose word #${i} "${words[i].w}" vs spoken "${spoken[j].value}" (item ${j})`);
}
if (j !== spoken.length) die(`${spoken.length - j} spoken item(s) left over after alignment`);

// timings must be sane and non-decreasing
let prevE = -1;
for (const w of words) {
  if (!(Number.isFinite(w.s) && Number.isFinite(w.e) && w.e > w.s)) die(`bad span on "${w.w}" (#${w.i})`);
  if (w.s < prevE - 250) die(`word "${w.w}" (#${w.i}) starts ${prevE - w.s}ms before previous ends`);
  prevE = w.e;
}
if (words[words.length - 1].e > timing.duration_ms) die('last word ends past duration_ms');

// ── 3. merge distractors + verifier fixes ────────────────────────────────────────
const OK = /^[A-Za-z][A-Za-z'’-]*$/;
const byI = new Map();
for (const f of fs.readdirSync(here).filter((f) => /^distractors-p\d+\.json$/.test(f)).sort()) {
  const d = JSON.parse(read(f));
  for (const wd of d.words) {
    if (byI.has(wd.i)) die(`duplicate distractor entry for word #${wd.i} (${f})`);
    byI.set(wd.i, wd.d.slice());
  }
}
// verifier fixes (fixes-p*.json) + a manual override channel (fixes-manual.json)
// for findings the automated refuters cannot reach (a semantically-wrong set, a
// weak signature pick). A manual fix may target by `bad`→`with` OR replace the
// whole set with `d`.
let applied = 0;
const applyFix = (fix, src) => {
  const set = byI.get(fix.i);
  if (!set) die(`fix targets unknown word #${fix.i} (${src})`);
  if (Array.isArray(fix.d)) { byI.set(fix.i, fix.d.slice()); applied++; return; }
  const at = set.findIndex((x) => x === fix.bad);
  // a fix whose target is absent is a STALE fixes file — fail loud, don't ship the
  // un-corrected distractor silently (this file is the piece's proof layer).
  if (at === -1) die(`fix for #${fix.i} names absent candidate "${fix.bad}" (${src}) — stale fix?`);
  set[at] = fix.with; applied++;
};
for (const f of fs.readdirSync(here).filter((f) => /^fixes-p\d+\.json$/.test(f)).sort()) {
  for (const fix of JSON.parse(read(f)).fixes || []) applyFix(fix, f);
}
if (fs.existsSync(path.join(here, 'fixes-manual.json'))) {
  for (const fix of JSON.parse(read('fixes-manual.json')).fixes || []) applyFix(fix, 'fixes-manual.json');
}

// A distractor is legitimately capitalized ONLY when it is a proper noun / acronym
// / an "I"-form — so mid-sentence common words are lowercased and the true proper
// noun is no longer the sole capital that gives the answer away. Sentence-initial
// positions capitalize every candidate. (Root cause of the old tell: candidate case
// was matched to the TRUTH's case, not to the position's.)
const PROPER = new Set([
  'claude', 'anthropic', "anthropic's", 'ariadne', "ariadne's", 'theseus', 'minos',
  'daedalus', 'icarus', 'english', 'latin', 'greek', 'ai', 'html', 'css', 'js',
  'javascript', 'typescript', 'svg', 'webgl', 'webassembly', 'gpu', 'cpu', 'api',
  'ui', 'i', "i'm", "i'd", "i've", "i'll",
]);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const lower = (s) => s[0].toLowerCase() + s.slice(1);
let fixedCase = 0;
for (const w of words) {
  const d = byI.get(w.i);
  if (!d) die(`no distractors for word #${w.i} "${w.w}"`);
  if (d.length !== 3) die(`word #${w.i} "${w.w}" has ${d.length} distractors (want 3)`);
  const seen = new Set([w.w.toLowerCase()]);
  d.forEach((alt, ai) => {
    if (!OK.test(alt)) die(`word #${w.i} "${w.w}": bad candidate format ${JSON.stringify(alt)}`);
    const want = w.initial || PROPER.has(alt.toLowerCase()) ? cap(alt) : lower(alt);
    if (want !== alt) { d[ai] = alt = want; fixedCase++; }
    if (seen.has(alt.toLowerCase())) die(`word #${w.i} "${w.w}": duplicate/truth-equal candidate "${alt}"`);
    seen.add(alt.toLowerCase());
  });
  w.d = d;
}
if (byI.size !== words.length) die(`distractor entries (${byI.size}) != words (${words.length})`);

// honesty guard: at a mid-sentence position whose truth is NOT itself a proper
// noun, no candidate may be capitalized (that would re-introduce the tell).
for (const w of words) {
  if (w.initial || PROPER.has(w.w.toLowerCase())) continue;
  for (const alt of w.d) {
    if (/^[A-Z]/.test(alt) && !PROPER.has(alt.toLowerCase()))
      die(`word #${w.i} "${w.w}": mid-sentence candidate "${alt}" is capitalized (capitalization tell)`);
  }
}

// neighborhood repetition: same alt within a 6-set radius gets noted (soft check)
const lastAt = new Map();
let repeats = 0;
words.forEach((w, ix) => {
  for (const alt of w.d) {
    const k = alt.toLowerCase();
    if (lastAt.has(k) && ix - lastAt.get(k) <= 6) repeats++;
    lastAt.set(k, ix);
  }
});
if (repeats) console.log(`prepare: note — ${repeats} near-neighborhood repeated candidate(s) (soft)`);
if (fixedCase) console.log(`prepare: note — ${fixedCase} candidate case corrections applied`);
if (applied) console.log(`prepare: note — ${applied} verifier/manual fix(es) applied`);

// ── 4. the ⟨end⟩ set + payload ──────────────────────────────────────────────────
const endSet = JSON.parse(read('end-set.json'));
if (!Array.isArray(endSet.d) || endSet.d.length !== 3 || !endSet.d.every((x) => OK.test(x)))
  die('end-set.json must be {"d":[three plausible would-have-continued words]}');

const payload = {
  duration_ms: timing.duration_ms,
  paragraphs: paras.length,
  words: words.map(({ i, p, w, display, s, e, d }) => ({ i, p, w, display, s, e, d })),
  end: { d: endSet.d },
};
fs.writeFileSync(path.join(here, 'cloud-data.json'), JSON.stringify(payload));
const kb = (fs.statSync(path.join(here, 'cloud-data.json')).size / 1024).toFixed(1);
console.log(`prepare: OK — ${words.length} words / ${paras.length} paragraphs / ${timing.duration_ms}ms audio → cloud-data.json (${kb} KB)`);
