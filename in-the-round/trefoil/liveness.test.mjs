// The PAYOFF-LIVENESS TWIN for "The Cast Object" (In the Round, hall two).
// Headless, Node-runnable, claim-free: this hall proves NO theorem. It proves its
// PAYOFF fires — that the depth you turn is real and not painted.
//
// Every clause drives the room's OWN entry points: the real buildTube() scene, the
// real shell.orbit() (the SAME clamped orbit the pointer handler calls), and the
// real depth-sorted list render() returns. Never a synthetic pose, never a
// screenshot, never a canvas pointer event — headless cannot deliver one, and a
// dead payoff is silent and error-free.
//
// The four payoff clauses + the gates live in ./probe.mjs, which the PAGE also
// runs for its chip, so page and twin can never disagree. This file adds what only
// a file-reading twin can check: byte-parity of the inlined engine and shell.
//
//   Run: `node in-the-round/trefoil/liveness.test.mjs`

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { project, toScreen, applyDrag, render, occludedAt } from '../../tools/scene3d/core.mjs';
import { makeShell, makeFlywheel } from '../shell.mjs';
import { buildTube, lampFor, lowestMetal, nearestRim, N, POSTURE } from './scene.mjs';
import { probe } from './probe.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } }

const MOCK = {
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, arc() {},
  stroke() {}, closePath() {}, fill() {}, fillRect() {}, clip() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
  set lineCap(v) {}, set lineJoin(v) {}, set globalAlpha(v) {},
  set shadowColor(v) {}, set shadowBlur(v) {},
};
function centro(sp) { let x = 0, y = 0; for (const p of sp) { x += p.x; y += p.y; } return { x: x / sp.length, y: y / sp.length }; }
function inPolyC(sp, x, y) {
  let c = false;
  for (let i = 0, j = sp.length - 1; i < sp.length; j = i++) {
    const xi = sp[i].x, yi = sp[i].y, xj = sp[j].x, yj = sp[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}

// ── the payoff clauses, on the live path ──
const lv = probe({
  render, occludedAt, project, toScreen, applyDrag,
  makeShell, makeFlywheel, buildTube, lampFor, lowestMetal, nearestRim, N, POSTURE,
  MOCK, centro, inPolyC,
});
for (const c of lv.cks) ck(c.n, c.ok);

// ── (G) BYTE-PARITY: what the page inlines === what this twin imports ──
const here = dirname(fileURLToPath(import.meta.url));
function region(t, begin, end) {
  const i = t.indexOf(begin), j = t.indexOf(end);
  if (i < 0 || j < 0 || j < i) return null;
  return t.slice(i + begin.length, j);
}
// forge strips a module's bare `import …;` lines when it inlines (their symbols
// come from a sibling include), so parity is measured on what forge actually
// emits — indentation-normalised, blank lines and import statements dropped.
const IMPORT_LINE = /^import\b[^'"]*['"][^'"]*['"];?$/;
function norm(s) {
  return s.split('\n').map((l) => l.replace(/^\s+/, '').replace(/\s+$/, ''))
    .filter((l) => l.length && !IMPORT_LINE.test(l)).join('\n');
}
let page = null;
try { page = readFileSync(join(here, 'index.html'), 'utf8'); } catch {}

const PARTS = [
  { label: 'scene3d core', file: '../../tools/scene3d/core.mjs',
    begin: '// ===== SCENE3D CORE (byte-identical to core.mjs) =====', end: '// ===== END SCENE3D CORE =====' },
  { label: 'room shell',   file: '../shell.mjs',
    begin: '// ===== ROOM SHELL =====', end: '// ===== END ROOM SHELL =====' },
  { label: 'trefoil scene', file: './scene.mjs',
    begin: '// ===== TREFOIL SCENE =====', end: '// ===== END TREFOIL SCENE =====' },
  { label: 'trefoil probe', file: './probe.mjs',
    begin: '// ===== TREFOIL PROBE =====', end: '// ===== END TREFOIL PROBE =====' },
];
let allParity = !!page;
for (const p of PARTS) {
  let src = null;
  try { src = region(readFileSync(join(here, p.file), 'utf8'), p.begin, p.end); } catch {}
  const inlined = page ? region(page, p.begin, p.end) : null;
  const same = !!src && !!inlined && norm(src) === norm(inlined);
  if (!same) allParity = false;
  ck('(G) inlined ' + p.label + ' === ' + p.file + ' (sentinel-wrapped, byte-identical)', same);
}

// ── report ──
console.log('The Cast Object — liveness.test.mjs (payoff-liveness twin, claim-free)');
console.log('  the payoff FIRES on the live path: a drag re-sorts the list · a crossing resolves');
console.log('  off that list · orbit through and it resolves the OTHER way · near out-parallaxes far');
for (const c of lv.cks) console.log('   ' + (c.ok ? '✓' : '✗') + ' ' + c.n);
console.log('  byte-parity: ' + (page ? (allParity ? 'IDENTICAL' : 'DRIFTED') : 'index.html not built yet'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
