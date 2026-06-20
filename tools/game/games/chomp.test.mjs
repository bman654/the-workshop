#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   chomp.test.mjs — the focused Node twin for The Poisoned Bar (Chomp).

   Solves Chomp through the SAME Adversary.solve() the page inlines — never a
   second engine — and asserts the published theorem + the strategy-steal witness
   the bench is built to show. Plus a RE-EXTRACTION PARITY check: the chomp core
   inlined into the forged chomp/index.html must byte-match the module source
   forge inlined (after the same module-guard strip forge applies), so the page's
   green pill can never drift from this twin.

   The estate's established route is the aggregate tools/game/adversary.test.cjs
   (which now lists 'chomp' in DEF_NAMES and runs chomp's literatureBattery via
   Adversary.runSelfTest). This file is the bench-local complement.

   Run:  node tools/game/games/chomp.test.mjs   (exits 0 iff all green)
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const Adversary = require(path.join(__dirname, '..', 'adversary.js'));
const GAME_chomp = require(path.join(__dirname, 'chomp.js'));
const { WIN, LOSS } = Adversary;

const checks = [];
const ck = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail || '' });

function winningBites(def, sol, s) {
  return GAME_chomp.winningBites(def, sol, s);
}

// ── (1) shape sweep: P1=WIN on every non-1×1 board; 1×1 ⇒ the lone P1-LOSS ──
(function () {
  const sweep = [];
  for (let W = 1; W <= 6; W++) for (let H = 1; H <= 6; H++) if (W * H <= 30) sweep.push([W, H]);
  const fails = [];
  let maxNodes = 0;
  for (const [W, H] of sweep) {
    const sol = Adversary.solve(GAME_chomp.makeChomp(W, H));
    if (!sol.ok) { fails.push(`${W}×${H} solve FAILED`); continue; }
    maxNodes = Math.max(maxNodes, sol.nodeCount);
    const want = (W === 1 && H === 1) ? LOSS : WIN;
    if (sol.value !== want) fails.push(`${W}×${H} want ${want} got ${sol.value}`);
  }
  ck('every non-1×1 board is a first-player WIN; 1×1 is the lone LOSS',
    fails.length === 0, fails.length ? fails.join('; ') : `${sweep.length} boards · max ${maxNodes} nodes`);
})();

// ── (2) the strategy-steal WITNESS: on each named board solve() marks the board a
//        WIN, yet the TOP-RIGHT corner bite leads to a child the table marks a WIN
//        for the opponent — i.e. the corner lever is NOT a winning move. Existence
//        is proven (a winning bite exists), construction is not (it is not the
//        corner the proof leans on). ──
(function () {
  const steal = ['3x3', '3x4', '4x4', '4x6', '5x5'];
  const fails = [];
  const witness = [];
  for (const tag of steal) {
    const [W, H] = tag.split('x').map(Number);
    const def = GAME_chomp.makeChomp(W, H);
    const sol = Adversary.solve(def);
    const root = def.initState();
    const corner = { col: root.cols.length - 1, row: root.cols[0] - 1 };
    const childNode = sol.table.get(def.key(def.apply(root, corner)));
    const wins = winningBites(def, sol, root);
    const cornerIsWin = wins.some((m) => m.col === corner.col && m.row === corner.row);
    if (sol.value !== WIN) fails.push(`${tag} board not WIN`);
    if (!wins.length) fails.push(`${tag} has no winning bite (existence broken)`);
    if (!childNode || childNode.value !== WIN) fails.push(`${tag} corner child ${childNode ? childNode.value : '∅'} ≠ WIN`);
    if (cornerIsWin) fails.push(`${tag} corner bite WAS a winning move (witness broken)`);
    witness.push(`${tag}:corner→${childNode ? childNode.value : '∅'},${wins.length}wins`);
  }
  ck('strategy-steal witness: board WIN, corner-bite child WINS for the opponent (existence≠construction)',
    fails.length === 0, fails.length ? fails.join('; ') : witness.join(' · '));
})();

// ── (3) NEG-CONTROL 1×1: the lone first-player LOSS, with zero winning bites ──
(function () {
  const def = GAME_chomp.makeChomp(1, 1), sol = Adversary.solve(def);
  const wins = winningBites(def, sol, def.initState());
  ck('NEG-CONTROL 1×1: the lone P1-LOSS with zero winning bites',
    sol.value === LOSS && wins.length === 0, `1×1 → ${sol.value} · ${wins.length} bite(s)`);
})();

// ── (4) NEG-CONTROL 1×N ≡ one-heap Nim: WIN iff N>1, and the unique winning bite
//        reduces the heap to poison-only (the single Nim P-position). ──
(function () {
  const fails = [];
  for (let N = 1; N <= 6; N++) {
    const def = GAME_chomp.makeChomp(N, 1), sol = Adversary.solve(def);
    const want = N > 1 ? WIN : LOSS;
    if (sol.value !== want) fails.push(`1×${N} value ${sol.value} want ${want}`);
    if (N > 1) {
      const wins = winningBites(def, sol, def.initState());
      const unique = wins.length === 1 && wins[0].col === 1 && wins[0].row === 0;
      if (!unique) fails.push(`1×${N} not the lone down-to-poison move (${wins.length} bites)`);
    }
  }
  ck('NEG-CONTROL 1×N ≡ one-heap Nim: WIN iff N>1, unique winning bite → poison-only',
    fails.length === 0, fails.length ? fails.join('; ') : '1×1..1×6 match one-heap Nim');
})();

// ── (5) node-count under HARD_CAP: the 4×6 bench board (and the swept boards) sit
//        far under the engine ceiling — the table is EXACT, not sampled. ──
(function () {
  const s46 = Adversary.solve(GAME_chomp.makeChomp(6, 4));
  ck('node-count under HARD_CAP: 4×6 is exact (' + s46.nodeCount + ' ≪ ' + Adversary.HARD_CAP + ')',
    s46.ok && s46.nodeCount > 0 && s46.nodeCount < Adversary.HARD_CAP, s46.nodeCount + ' canonical nodes');
})();

// ── (6) RE-EXTRACTION PARITY: the chomp core inlined into the forged
//        chomp/index.html byte-matches tools/game/games/chomp.js after the same
//        module-guard strip forge applies — so the page's green pill is this twin's
//        computation, not a fork. ──
(function () {
  const modPath = path.join(__dirname, 'chomp.js');
  const pagePath = path.join(repoRoot, 'chomp', 'index.html');
  if (!fs.existsSync(pagePath)) { ck('re-extraction parity: forged page present', false, 'chomp/index.html missing — run forge'); return; }
  const modSrc = fs.readFileSync(modPath, 'utf8').replace(/\r\n/g, '\n');
  const page = fs.readFileSync(pagePath, 'utf8').replace(/\r\n/g, '\n');

  // forge strips the dual-use module guard line(s) when inlining. Reproduce the
  // EXACT strip (forge.mjs stripModuleGuard) so we compare apples to apples.
  const expected = stripModuleGuard(modSrc).replace(/\n$/, '');

  // The inlined slab is delimited in the page by the chomp module's banner comment
  // (its first line) and the ws.js include that follows. Anchor on the unique IIFE
  // signature opener of chomp and the ws.js banner start.
  const startMarker = '/* ═══════════════════════════════════════════════════════════════════════════\n   chomp.js — game-def: Chomp';
  const si = page.indexOf(startMarker);
  if (si < 0) { ck('re-extraction parity: chomp slab found in page', false, 'start marker not found'); return; }
  // the slab ends where the next inlined module (ws.js) banner begins
  const wsMarker = page.indexOf('/* ', page.indexOf('/* ws: unlock breadcrumb'));
  // simplest robust extraction: take from si up to the chomp IIFE's closing line.
  const closer = "})(typeof globalThis !== 'undefined' ? globalThis : this);";
  const ei = page.indexOf(closer, si);
  if (ei < 0) { ck('re-extraction parity: chomp slab end found', false, 'closer not found'); return; }
  const extracted = page.slice(si, ei + closer.length);

  const ok = extracted === expected;
  let detail;
  if (ok) detail = `inlined slab (${extracted.length} chars) byte-matches the module`;
  else {
    // find the first divergence for a useful message
    let i = 0; const n = Math.min(extracted.length, expected.length);
    while (i < n && extracted[i] === expected[i]) i++;
    detail = `mismatch at char ${i} (extracted ${extracted.length}, expected ${expected.length}): ` +
      JSON.stringify(extracted.slice(Math.max(0, i - 20), i + 20)) + ' vs ' +
      JSON.stringify(expected.slice(Math.max(0, i - 20), i + 20));
  }
  ck('re-extraction parity: in-page chomp slab == module source (forge strip)', ok, detail);
})();

// forge.mjs stripModuleGuard, reproduced verbatim so the parity compare is exact.
function stripModuleGuard(src) {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const guardStart = /^\s*if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)/;
    if (guardStart.test(line)) {
      let depth = 0, seenBrace = false, j = i;
      for (; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { depth++; seenBrace = true; }
          else if (ch === '}') depth--;
        }
        if (seenBrace && depth <= 0) break;
      }
      i = j;
      continue;
    }
    line = line.replace(/^(\s*)export\s+(?=(default\s+)?(const|let|var|function|class|async)\b)/, '$1');
    out.push(line);
  }
  return out.join('\n');
}

// ── report ──
let pass = 0;
for (const c of checks) if (c.ok) pass++;
const total = checks.length;
console.log('── The Poisoned Bar (Chomp) — focused twin ──\n');
for (const c of checks) {
  console.log((c.ok ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗ FAIL\x1b[0m ') + c.name + (c.detail ? '  \x1b[2m— ' + c.detail + '\x1b[0m' : ''));
}
console.log('\n' + (pass === total
  ? '\x1b[32m═══ ' + pass + '/' + total + ' checks PASS ═══\x1b[0m'
  : '\x1b[31m═══ ' + pass + '/' + total + ' — ' + (total - pass) + ' FAILED ═══\x1b[0m'));
process.exit(pass === total ? 0 : 1);
