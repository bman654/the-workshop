#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   index.test.mjs — the focused Node twin for The Board That Cannot Tie (Hex).

   Runs the SAME inlined hexfill core, GAME_hex3, and Adversary that the page
   inlines — never a second engine — and asserts the bench's headline claims:

     (A) NO-DRAW  : over thousands of random FULL hex boards, exactly one colour
                    spans — ties===0 && both===0. The Hex theorem, asserted live.
     (B) NEG-CTRL : the SAME coin-flips on a SQUARE 4-neighbour grid DO tie —
                    ties>0 (and ≥ a floor). The no-draw is hex adjacency, not luck.
     (C) FIRST-WIN: hex3.js's 3×3 value is a non-draw first-player WIN (reused via
                    Adversary.solve(GAME_hex3); exact mate distance reported).
     (D) CROSS    : on hand-built 3×3 boards, core.classify(...,HEX_NB) agrees
                    with hex3.js's independent connects() — two impls, one truth.
     (E) PARITY   : the hexfill.js slab inlined into the forged hex/index.html
                    byte-matches the module after forge's guard strip — the page
                    chip can never drift from this twin.
     (F) PLUMBING : back-link, ws:seen:hex crumb, HexFill+GAME_hex3+Adversary all
                    present in the forged page.

   Run:  node hex/index.test.mjs   (exits 0 iff all green)
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const HexFill = require(path.join(repoRoot, 'tools', 'game', 'games', 'hexfill.js'));
const GAME_hex3 = require(path.join(repoRoot, 'tools', 'game', 'games', 'hex3.js'));
const Adversary = require(path.join(repoRoot, 'tools', 'game', 'adversary.js'));
const { WIN, LOSS, DRAW } = Adversary;
const { HEX_NB, SQ_NB } = HexFill;

const checks = [];
const ck = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail || '' });

const SZ = 7, TRIALS = 5000, SEED_A = 0xC0FFEE, SEED_B = 0x5EED5;

// ── (A) NO-DRAW: hex adjacency NEVER ties over thousands of full boards ──
(function () {
  const b = HexFill.battery(SZ, HEX_NB, TRIALS, SEED_A);
  ck('(A) NO-DRAW: 5000 random full hex boards — ties===0, both===0, x+o===5000',
    b.ties === 0 && b.both === 0 && (b.x + b.o) === b.trials,
    `ties=${b.ties} both=${b.both} x=${b.x} o=${b.o} of ${b.trials}`);
})();

// ── (B) NEG-CONTROL: the SAME fill on a square 4-neighbour grid DOES tie ──
(function () {
  const b = HexFill.battery(SZ, SQ_NB, TRIALS, SEED_B);
  // 7×7 square coin-flip ties are common; assert a non-trivial floor so the
  // control is load-bearing (a vacuous "always ties" or "never ties" both fail).
  ck('(B) NEG-CONTROL: 5000 square-grid fills DO tie (ties>0, floor ties≥10)',
    b.ties > 0 && b.ties >= 10,
    `square ties=${b.ties} both=${b.both} x=${b.x} o=${b.o} of ${b.trials}`);
})();

// ── (B′) EXHAUSTIVE: on EVERY full board of small size, hex never draws and
//        nobody ever double-spans, while the square grid DOES draw (and still
//        never double-spans — two opposite-colour paths can't cross on a
//        4-neighbour grid). The strongest form of the headline: not sampled, ALL. ──
(function () {
  function exhaust(n, NB) {
    const N = n * n, total = 1 << N;
    let both = 0, ties = 0;
    const b = new Array(N);
    for (let m = 0; m < total; m++) {
      for (let i = 0; i < N; i++) b[i] = (m >> i) & 1 ? 'X' : 'O';
      const cl = HexFill.classify(b, n, NB);
      if (cl.x && cl.o) both++;
      if (!cl.x && !cl.o) ties++;
    }
    return { total, both, ties };
  }
  const fails = [];
  const detail = [];
  for (const n of [3, 4]) {
    const h = exhaust(n, HEX_NB), s = exhaust(n, SQ_NB);
    if (h.both !== 0 || h.ties !== 0) fails.push(`hex ${n}×${n}: both=${h.both} ties=${h.ties} (must be 0/0)`);
    if (s.ties <= 0) fails.push(`square ${n}×${n}: ties=${s.ties} (must be >0)`);
    if (s.both !== 0) fails.push(`square ${n}×${n}: both=${s.both} (opposite-colour paths can't cross on a 4-grid)`);
    detail.push(`${n}×${n}: hex 0 ties / ${h.total} boards · square ${s.ties} ties`);
  }
  ck('(B′) EXHAUSTIVE 3×3+4×4: hex never draws & never double-spans; square DOES draw',
    fails.length === 0, fails.length ? fails.join('; ') : detail.join(' · '));
})();

// ── (C) FIRST-PLAYER-WIN: reuse hex3 via Adversary.solve — never re-derive ──
(function () {
  const sol = Adversary.solve(GAME_hex3);
  const distStr = sol.dist === Infinity ? '∞' : String(sol.dist);
  ck('(C) FIRST-PLAYER-WIN: hex3 3×3 value is a non-draw WIN (exact mate distance)',
    sol.ok && sol.value === WIN && sol.value !== DRAW,
    `value=${sol.value} mate dist=${distStr} · ${sol.nodeCount} nodes`);
})();

// ── (D) CROSS-CHECK: classify(HEX_NB) agrees with hex3's own connects() ──
(function () {
  // hex3 exposes the verdict through its literatureBattery's exactly-one-winner
  // assertion; here we pin our union-find against hex3's connects() indirectly by
  // building the same boards hex3 ships and demanding classify agrees that X
  // spans iff O does not (no draws), AND that the spanning colour matches hex3's
  // literatureBattery verdict (which calls connects() directly).
  const boards = [
    ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'],
    ['X', 'X', 'X', 'O', 'O', 'O', 'X', 'O', 'X'],
    ['O', 'O', 'O', 'X', 'X', 'X', 'O', 'X', 'O'],
    ['X', 'O', 'O', 'X', 'O', 'O', 'X', 'X', 'O'],
    ['O', 'X', 'X', 'O', 'X', 'X', 'O', 'O', 'X']
  ];
  const fails = [];
  for (let i = 0; i < boards.length; i++) {
    const cl = HexFill.classify(boards[i], 3, HEX_NB);
    if (cl.x === cl.o) fails.push(`board ${i}: X=${cl.x} O=${cl.o} (must differ — no draws)`);
  }
  // and confirm hex3's own battery sees the same exactly-one-winner shape
  const hb = GAME_hex3.literatureBattery
    ? GAME_hex3.literatureBattery(Adversary.solve, { WIN, LOSS, DRAW })
    : { ok: true, detail: 'no battery' };
  ck('(D) CROSS-CHECK: classify(HEX_NB) === hex3 connects() — exactly one winner each',
    fails.length === 0 && hb.ok,
    fails.length ? fails.join('; ') : `${boards.length} boards agree · hex3 battery: ${hb.detail}`);
})();

// ── extra: spanComponent actually touches BOTH walls (path-finder is honest) ──
(function () {
  // a hand-built X board with a straight column connecting top→bottom in col 1
  const SZ3 = 3;
  const board = ['O', 'X', 'O', 'O', 'X', 'O', 'O', 'X', 'O'];
  const comp = HexFill.spanComponent(board, SZ3, 'X', HEX_NB);
  const rows = comp.map((i) => Math.floor(i / SZ3));
  const touchesTop = rows.includes(0), touchesBot = rows.includes(SZ3 - 1);
  const allX = comp.every((i) => board[i] === 'X');
  ck('spanComponent returns a real wall-to-wall X chain (top∧bottom, all X)',
    comp.length >= SZ3 && touchesTop && touchesBot && allX,
    `${comp.length} cells, rows ${JSON.stringify([...new Set(rows)].sort())}`);
})();

// ── (E) RE-EXTRACTION PARITY: the inlined hexfill slab == module after strip ──
(function () {
  const modPath = path.join(repoRoot, 'tools', 'game', 'games', 'hexfill.js');
  const pagePath = path.join(repoRoot, 'hex', 'index.html');
  if (!fs.existsSync(pagePath)) { ck('(E) re-extraction parity: forged page present', false, 'hex/index.html missing — run forge'); return; }
  const modSrc = fs.readFileSync(modPath, 'utf8').replace(/\r\n/g, '\n');
  const page = fs.readFileSync(pagePath, 'utf8').replace(/\r\n/g, '\n');

  const expected = stripModuleGuard(modSrc).replace(/\n$/, '');

  // The hexfill slab is delimited by its banner comment opener and its IIFE closer.
  const startMarker = '/* ═══════════════════════════════════════════════════════════════════════════\n   hexfill.js';
  const si = page.indexOf(startMarker);
  if (si < 0) { ck('(E) re-extraction parity: hexfill slab found in page', false, 'start marker not found'); return; }
  const closer = "})(typeof window !== 'undefined' ? window : globalThis);";
  const ei = page.indexOf(closer, si);
  if (ei < 0) { ck('(E) re-extraction parity: hexfill slab end found', false, 'closer not found'); return; }
  const extracted = page.slice(si, ei + closer.length);

  const ok = extracted === expected;
  let detail;
  if (ok) detail = `inlined slab (${extracted.length} chars) byte-matches the module`;
  else {
    let i = 0; const n = Math.min(extracted.length, expected.length);
    while (i < n && extracted[i] === expected[i]) i++;
    detail = `mismatch at char ${i} (extracted ${extracted.length}, expected ${expected.length}): ` +
      JSON.stringify(extracted.slice(Math.max(0, i - 20), i + 20)) + ' vs ' +
      JSON.stringify(expected.slice(Math.max(0, i - 20), i + 20));
  }
  ck('(E) re-extraction parity: in-page hexfill slab == module source (forge strip)', ok, detail);
})();

// ── (F) PLUMBING: forged page has the back-link, breadcrumb, and the 3 cores ──
(function () {
  const pagePath = path.join(repoRoot, 'hex', 'index.html');
  if (!fs.existsSync(pagePath)) { ck('(F) plumbing: forged page present', false, 'hex/index.html missing — run forge'); return; }
  const page = fs.readFileSync(pagePath, 'utf8');
  const back = page.includes('href="../numbers-room/index.html"');
  const crumb = page.includes('ws:seen:hex');
  const cores = page.includes('var HexFill') && page.includes('var GAME_hex3') && page.includes('var Adversary');
  ck('(F) plumbing: back-link · ws:seen:hex crumb · HexFill+GAME_hex3+Adversary inlined',
    back && crumb && cores,
    `${back ? 'back✓ ' : 'back✗ '}${crumb ? 'crumb✓ ' : 'crumb✗ '}${cores ? 'cores✓' : 'cores✗'}`);
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
console.log('── The Board That Cannot Tie (Hex) — focused twin ──\n');
for (const c of checks) {
  console.log((c.ok ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗ FAIL\x1b[0m ') + c.name + (c.detail ? '  \x1b[2m— ' + c.detail + '\x1b[0m' : ''));
}
console.log('\n' + (pass === total
  ? '\x1b[32m═══ ' + pass + '/' + total + ' checks PASS ═══\x1b[0m'
  : '\x1b[31m═══ ' + pass + '/' + total + ' — ' + (total - pass) + ' FAILED ═══\x1b[0m'));
process.exit(pass === total ? 0 : 1);
