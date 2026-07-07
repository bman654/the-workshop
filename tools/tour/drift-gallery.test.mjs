#!/usr/bin/env node
/* ═══════════════ THE DRIFT GALLERY — Node twin (WS4 T8.5) ═══════════════════
   Two batteries over talk/drift-gallery.js — the source of the d05 drift-gallery
   frame — run from the worktree so the covenant checks read real git history:

     A · THE QUOTATION COVENANT (invariant 3): every verbatim string in the page's
         QUOTES ledger is (1) present verbatim in drift-gallery.js as shipped and
         (2) present verbatim, whitespace-normalized, in its cited source at the
         cited ref (a commit subject/body, or a file blob). "Read, not drawn."

     B · THE WALK'S SHAPE: the gallery references its exhibits by RELATIVE sibling
         path and every one resolves to a real file on disk — the five retired
         cold plates under museum/archive/, the three re-souled bodies at their
         live paths, and the survivor bench — the required Hydrogen Atom before→
         after pair is wired, and the STATE hook galleryTo is exposed.

   Green (exit 0) means the page you ship agrees with the git record it quotes and
   points only at files that exist. Zero external deps. ────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');           /* worktree root */
const JS = path.join(ROOT, 'talk', 'drift-gallery.js');

const results = [];
function check(label, pass, detail) { results.push({ label, pass: !!pass, detail: detail || '' }); }

/* normalize for a covenant diff: decode the few HTML entities the sources use,
   strip HTML tags and markdown bold, collapse whitespace. Matches the covenant's
   "whitespace-normalized" rule (a quote may wrap across source lines). */
function norm(s) {
  return String(s)
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function git(args) {
  return execSync('git ' + args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const galleryJs = fs.readFileSync(JS, 'utf8');

/* ── the covenant register: id → verbatim text (as shipped) + its source ── */
const QUOTES = [
  { id: 'pp-confession',
    text: 'an honest rendering of the continuous ODE populations — not an independent agent sim',
    src: { kind: 'blob', ref: '4b4fb90', path: 'conservatory/predator-prey/index.html' } },
  { id: 'per-brandon',
    text: 'per Brandon',
    src: { kind: 'body', ref: '716cfb8' } },
  { id: 'audit-cure',
    text: 'surgical re-souling of two pockets + a thin scatter, never an estate-wide overhaul',
    src: { kind: 'blob', ref: '56a7115', path: 'seedbed/soul-audit-2026-06-15.md' } },
  { id: 'hydrogen-soul',
    text: 'a touchable, rotatable orbital cloud',
    src: { kind: 'subject', ref: 'cc5a22e' } },
  { id: 'lattice-soul',
    text: 'a crystal you pour electrons into',
    src: { kind: 'subject', ref: 'b60179a' } }
];

function sourceText(src) {
  if (src.kind === 'subject') return git("show -s --format=%s " + src.ref);
  if (src.kind === 'body') return git("show -s --format=%B " + src.ref);
  if (src.kind === 'blob') return git("show " + src.ref + ":" + src.path);
  throw new Error('unknown source kind ' + src.kind);
}

/* ── A · covenant ── */
for (const q of QUOTES) {
  const inShip = galleryJs.indexOf(q.text) >= 0;                 /* shipped verbatim (exact bytes) */
  let inSource = false, detail = '';
  try {
    inSource = norm(sourceText(q.src)).indexOf(norm(q.text)) >= 0;   /* verbatim in source, normalized */
  } catch (e) { detail = 'source read failed: ' + e.message.split('\n')[0]; }
  check('covenant · ' + q.id + ' — shipped in drift-gallery.js', inShip);
  check('covenant · ' + q.id + ' — verbatim in ' + q.src.kind + ' ' + q.src.ref + (q.src.path ? ':' + q.src.path : ''),
    inSource, detail);
}

/* ── B · the walk's shape: every relative exhibit path resolves on disk ── */
const RELPATHS = [
  'museum/archive/hydrogen-2e12cf1.html',
  'museum/archive/lattice-1f47be4.html',
  'museum/archive/predator-prey-4b4fb90.html',
  'museum/archive/replicator-5b698d4.html',
  'museum/archive/stirling-47160c4.html',
  'cavern/hydrogen/index.html',
  'conservatory/predator-prey/index.html',
  'cavern/lattice/index.html',
  'conservatory/sir/index.html'
];
for (const rp of RELPATHS) {
  const referenced = galleryJs.indexOf('../' + rp) >= 0;
  const exists = fs.existsSync(path.join(ROOT, rp));
  check('path · ../' + rp + ' — referenced & on disk', referenced && exists,
    referenced ? (exists ? '' : 'MISSING on disk') : 'not referenced');
}

/* the required Hydrogen Atom before→after pair (cold archive → live HEAD) */
check('shape · Hydrogen Atom before/after pair wired (required:true)',
  /required:\s*true/.test(galleryJs) &&
  galleryJs.indexOf('../museum/archive/hydrogen-2e12cf1.html') >= 0 &&
  galleryJs.indexOf('../cavern/hydrogen/index.html') >= 0);

/* the STATE hook is exposed */
check('shape · window.__tourHooks.galleryTo exposed',
  /__tourHooks[\s\S]{0,80}galleryTo/.test(galleryJs) || /hooks\.galleryTo\s*=/.test(galleryJs));

/* no wall-clock / randomness in the frame logic (frame-determinism, inv 7) */
check('purity · no Date.now / Math.random / new Date in drift-gallery.js',
  !/Date\.now|Math\.random|new Date/.test(galleryJs));

/* ── report ── */
let pass = 0;
for (const r of results) {
  console.log('  ' + (r.pass ? '✓' : '✗') + ' ' + r.label + (r.detail ? '  — ' + r.detail : ''));
  if (r.pass) pass++;
}
const allGreen = pass === results.length;
console.log('\ndrift-gallery.test.mjs: ' + (allGreen ? 'ALL GREEN  ✓ (' + pass + '/' + results.length + ')'
  : (results.length - pass) + ' FAILED of ' + results.length));
process.exit(allGreen ? 0 : 1);
