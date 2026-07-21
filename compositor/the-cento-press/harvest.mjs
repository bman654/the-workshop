#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   THE CENTO PRESS — harvest.mjs

   The case of standing type. This script is the type-founder: it goes through
   the house's own written record and casts every usable line as a SORT, then
   distributes the sorts into the six boxes of the case.

   Two sources, both in-house, both already committed to this repo:
     • ledger/ledger.jsonl   — the makers' koans (one line, one maker, one turn)
     • index.src.html PLACES — the front door's ROOMS blurbs (split to sentences)

   No foraged text of any kind ever enters this corpus.

   Output: corpus.json  (committed alongside the page)
     { generated, counts, seams:[…], sorts:[ {t, src, by, seam}, … ] }
   where `t` is the LINE the press may set and `src` is the whole koan/blurb it
   was cast from — so the page's self-test can assert every set line is an exact
   substring of a real house source, verbatim, nothing invented.

   Re-runnable: as the estate grows, run this again and the case refills.

   Run:  node compositor/the-cento-press/harvest.mjs
         node compositor/the-cento-press/harvest.mjs --report
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaces } from '../../card-catalog/reclaim.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const OUT = join(__dirname, 'corpus.json');

/* ── THE SIX BOXES ──────────────────────────────────────────────────────────
   A sort lives in exactly ONE box, the way a real sort lives in exactly one
   compartment of a case. The composer draws each slot of the forme from the box
   that slot wants; SPILL redraws from the SAME box, which is why the boxes have
   to be a partition and not a set of overlapping tags. */
export const SEAMS = [
  { key: 'openings',  label: 'openings',        note: 'a full declarative statement — sets the ground' },
  { key: 'turns',     label: 'turns',           note: 'carries a pivot: but · yet · until · though · instead · only' },
  { key: 'confess',   label: 'confessions',     note: 'a maker speaking in the first person' },
  { key: 'closes',    label: 'closes',          note: 'short, and it lands' },
  { key: 'rooms',     label: 'the rooms',       note: 'plainspoken — what a room of this house does' },
  { key: 'long',      label: 'the long measure', note: 'a long breath; wraps two or three lines' },
  { key: 'unsorted',  label: '?',               note: 'the odd sort nobody could place' },
];

/* the pivot allowlist — a real turning word at a word boundary. An em-dash alone
   is NOT a turn (that was the old bug: half the case looked like a volta). */
const PIVOT = /\b(but|yet|until|unless|though|although|instead|rather|whereas|except|only|never|still|nor)\b/i;
/* finite verbs — the rooms filter. A blurb sentence with no finite verb is a
   catalogue fragment ("Four algorithms, four styles, export PNG."), not a line
   of verse, and it read as one on the sheet. */
const FINITE = new RegExp('\\b(' + [
  'is', 'are', 'was', 'were', 'am', 'be', 'been',
  'has', 'have', 'had', 'does', 'do', 'did',
  'can', 'cannot', "can't", 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'keeps?', 'kept', 'holds?', 'held', 'makes?', 'made', 'proves?', 'proved', 'reads?',
  'runs?', 'ran', 'shows?', 'showed', 'turns?', 'turned', 'opens?', 'opened',
  'falls?', 'fell', 'lets?', 'gives?', 'gave', 'takes?', 'took', 'needs?', 'owns?',
  'wears?', 'wore', 'sings?', 'sang', 'breathes?', 'stands?', 'stood', 'becomes?', 'became',
  'means?', 'meant', 'lies?', 'lay', 'comes?', 'came', 'goes?', 'went', 'finds?', 'found',
  'knows?', 'knew', 'sees?', 'saw', 'says?', 'said', 'asks?', 'asked', 'answers?',
  'begins?', 'began', 'ends?', 'leaves?', 'left', 'pulls?', 'pushes', 'drops?',
  'spins?', 'spun', 'bends?', 'bent', 'carries', 'carry', 'wanders?', 'waits?',
  'refuses?', 'decides?', 'chooses?', 'choose', 'counts?', 'measures?', 'weighs?',
  'points?', 'writes?', 'wrote', 'draws?', 'drew', 'plays?', 'set', 'sets?',
].join('|') + ')\\b', 'i');
/* a first-person maker's confession */
const FIRST = /(^|[\s—(“"])(I|my|me|mine)\b/;
/* THE CATALOGUE VOICE — the reason blurb fragments used to land on the sheet
   reading like an index card. A blurb sentence that talks about the estate's
   machinery (its proofs, its wings, its exports, its seeds) is describing a
   room from OUTSIDE it. Only the sentences that speak from INSIDE the room —
   what a visitor sees and does there — may be cast as sorts. */
const CATALOGUE = new RegExp('\\b(' + [
  'pill', 'node twin', 'neg-control', 'negative control', 'self-prov', 'proved exact',
  'reduced-motion', 'export', 'png', 'seed', 'seeds', 'seeded', 'localstorage', 'mute',
  'founds', 'mints', 'sibling', 'siblings', 'kin', 'deterministic', 're-roll', 're-rolls',
  're-pins', 'canvas', 'in-house', 'estate', 'wing', 'wings', 'exhibit', 'exhibits',
  'slot', 'slots', 'stall', 'stalls', 'reserved', 'honors', 'honours', 'gallery',
  'sandbox', 'readout', 'toggle', 'panel', 'browsable', 'catalogue', 'self-test',
  // the residue: engineering nouns and the estate's own furniture-names
  'predicate', 'invariant', 'integrator', 'analytic', 'named-dark', 'scrubber',
  'mounting', 'pantograph', 'prograde', 'retrograde', 'apse', 'unforked',
  'nomograph', 'boids', 'reuleaux', 'scheiner', 'chandrasekhar',
].join('|') + ')\\b|[_∂ηΩλ√≈]', 'i');

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/* Split a blurb into sentences without breaking on the decimal points,
   abbreviations and mid-sentence ellipses the estate's prose is full of. */
function sentences(text) {
  const out = [];
  let buf = '';
  const s = norm(text);
  for (let i = 0; i < s.length; i++) {
    buf += s[i];
    if (/[.!?]/.test(s[i])) {
      const next = s[i + 1], prev2 = s.slice(Math.max(0, i - 3), i);
      if (next === undefined) { out.push(buf); buf = ''; continue; }
      // not a break inside "e.g." / "No. 7" / a decimal / an initial
      if (/[0-9]/.test(prev2.slice(-1) || '') && /[0-9]/.test(next || '')) continue;
      if (/\b([A-Za-z]|no|eg|ie|approx|vs)$/i.test(buf.slice(0, -1).split(/[\s(]/).pop())) continue;
      if (next === ' ' && /^[ ]*[A-Z(“"—]/.test(s.slice(i + 1))) { out.push(buf); buf = ''; }
    }
  }
  if (buf.trim()) out.push(buf);
  return out.map(norm).filter(Boolean);
}

/* The boxes are a PARTITION and the order below is the distribution order — the
   type-founder drops each sort into the first box it honestly belongs in. Short-
   and-landing beats everything (that is what a close IS); then the pivot; then
   the speaking maker; then the plain declarative; and the over-long breath last,
   because a sort that wraps three lines is a measure before it is anything else. */
function classify(sort) {
  const t = sort.t;
  if (sort.kind === 'room') return 'rooms';
  /* the odd-sort box: a line that cannot start upright — it opens on a bracket,
     a quote or a dash, or it is a bare shout of capitals. Every case has one. */
  if (!/^[A-Za-z0-9]/.test(t) || /^[A-Z0-9 ,'’-]{14,}$/.test(t)) return 'unsorted';
  if (t.length <= 66 && /[.!?]$/.test(t)) return 'closes';
  if (PIVOT.test(t) && t.length <= 118) return 'turns';
  if (FIRST.test(t) && t.length <= 112) return 'confess';
  if (t.length > 118) return 'long';
  if (t.length >= 30 && !/^(and|but|so|then|or)\b/i.test(t)) return 'openings';
  return 'unsorted';
}

export function harvest({ root = ROOT } = {}) {
  const sorts = [];
  const seen = new Set();
  const push = (o) => {
    const key = o.t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    sorts.push(o);
  };

  /* ── 1. the makers' koans ─────────────────────────────────────────────── */
  const lines = readFileSync(join(root, 'ledger', 'ledger.jsonl'), 'utf8').split('\n');
  for (const raw of lines) {
    if (!raw.trim()) continue;
    let e; try { e = JSON.parse(raw); } catch { continue; }
    const t = norm(e.koan || '');
    if (!t || t.length < 24 || t.length > 190) continue;
    if (!/[.!?]$/.test(t)) continue;                       // a whole thought, not a fragment
    push({ t, src: t, by: norm(e.name || 'a hand'), kind: 'koan' });
  }

  /* ── 2. the front door's ROOMS blurbs ─────────────────────────────────── */
  const places = loadPlaces();
  /* every proper name the estate answers to — a line naming two of them is a
     catalogue entry ("Kin on the Midway's rolling run to The Top…"), not verse */
  const names = [];
  for (const p of places) {
    for (const n of [p.room, p.piece, p.companion && p.companion.name]) {
      const v = norm(n || '');
      if (v.length >= 5) names.push(v);
    }
  }
  const uniqNames = [...new Set(names)].sort((a, b) => b.length - a.length);
  const countNames = (t) => {
    let n = 0, rest = t;
    for (const nm of uniqNames) {
      if (rest.includes(nm)) { n++; rest = rest.split(nm).join(' '); }
      if (n >= 2) break;
    }
    return n;
  };

  for (const p of places) {
    const by = norm(p.room || p.piece || 'a room');
    for (const s of sentences(p.blurb || '')) {
      if (s.length < 34 || s.length > 150) continue;
      if (!/[.!?]$/.test(s)) continue;
      if (!FINITE.test(s)) continue;                        // ← the tightened filter
      if (CATALOGUE.test(s)) continue;                      // ← the catalogue voice: drop
      if (countNames(s) >= 2) continue;                     // ← names two rooms: drop
      if (/^\(/.test(s)) continue;                          // a parenthetical aside
      if (/[≈=×√·]|[0-9]\s*(°|%|M☉|px|ms)/.test(s)) continue; // a spec line, not a line of verse
      push({ t: s, src: norm(p.blurb), by, kind: 'room' });
    }
  }

  for (const s of sorts) {
    s.seam = classify(s);
    if (s.src === s.t) delete s.src;   // a koan IS its own source; don't ship it twice
  }
  sorts.sort((a, b) => cmp(a.seam, b.seam) || cmp(a.t, b.t));

  const counts = {};
  for (const s of SEAMS) counts[s.key] = sorts.filter((x) => x.seam === s.key).length;

  return {
    generated: 'node compositor/the-cento-press/harvest.mjs',
    sources: ['ledger/ledger.jsonl', 'index.src.html (PLACES blurbs)'],
    seams: SEAMS,
    counts,
    total: sorts.length,
    sorts,
  };
}

/* ── main ─────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('harvest.mjs')) {
  const c = harvest();
  writeFileSync(OUT, JSON.stringify(c, null, 0) + '\n');
  const kb = (Buffer.byteLength(JSON.stringify(c)) / 1024).toFixed(1);
  console.log('the cento press — case filled: ' + c.total + ' sorts (' + kb + ' KB)');
  for (const s of SEAMS) console.log('  ' + String(c.counts[s.key]).padStart(4) + '  ' + s.label);
  if (process.argv.includes('--report')) {
    for (const s of SEAMS) {
      console.log('\n── ' + s.label + ' ──');
      c.sorts.filter((x) => x.seam === s.key).slice(0, 6).forEach((x) => console.log('   ' + x.t));
    }
  }
}
