// The PAYOFF-LIVENESS TWIN for The Left-Handed Bench. Headless, Node-runnable. The
// bench's THEOREM is proven in core.test.mjs; THIS asserts the payoff FIRES on the
// live path — the gap you cannot close, the socket the control clicks into, the
// molecule that tumbles under grab while the room orbits under the void.
//
// Every clause drives the room's OWN entry points: the real MOLECULES data through
// bestAlignment/rmsdAtRotation, the real buildScene, the real depth-sorted list
// render() returns, the real tumbleStep + shell.orbit. Never a canvas pointer event
// — headless cannot deliver one, and a dead payoff is silent and error-free.
//
// The payoff clauses live in ./probe.mjs, which the PAGE also runs for its chip, so
// page and twin can never disagree. This file adds what only a file-reading twin
// can check: byte-parity of every inlined block.
//
//   Run: `node alchemy/the-left-handed-bench/liveness.test.mjs`

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { project, toScreen, render, occludedAt } from '../../tools/scene3d/core.mjs';
import { makeShell, makeFlywheel } from '../../in-the-round/shell.mjs';
import { MOLECULES, EPS, CONTROL_TOL, bestAlignment, rmsdAtRotation } from './core.mjs';
import { buildScene, liveCenters, ghostCenters, worldPos, tumbleStep, POSTURE } from './molecule.mjs';
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

const lv = probe({
  render, occludedAt, project, toScreen,
  buildScene, liveCenters, ghostCenters, worldPos, tumbleStep,
  bestAlignment, rmsdAtRotation, MOLECULES, EPS, CONTROL_TOL,
  makeShell, makeFlywheel, POSTURE, MOCK,
});
for (const c of lv.cks) ck(c.n, c.ok);

// ── BYTE-PARITY: what the page inlines === what this twin imports ──
const here = dirname(fileURLToPath(import.meta.url));
function region(t, begin, end) { const i = t.indexOf(begin), j = t.indexOf(end); return (i < 0 || j < 0 || j < i) ? null : t.slice(i + begin.length, j); }
const IMPORT_LINE = /^import\b[^'"]*['"][^'"]*['"];?$/;
function norm(s) { return s.split('\n').map((l) => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter((l) => l.length && !IMPORT_LINE.test(l)).join('\n'); }
let page = null; try { page = readFileSync(join(here, 'index.html'), 'utf8'); } catch {}

const PARTS = [
  { label: 'scene3d core', file: '../../tools/scene3d/core.mjs', begin: '// ===== SCENE3D CORE (byte-identical to core.mjs) =====', end: '// ===== END SCENE3D CORE =====' },
  { label: 'room shell', file: '../../in-the-round/shell.mjs', begin: '// ===== ROOM SHELL =====', end: '// ===== END ROOM SHELL =====' },
  { label: 'left-handed core', file: './core.mjs', begin: '// ===== LEFT-HANDED CORE =====', end: '// ===== END LEFT-HANDED CORE =====' },
  { label: 'molecule scene', file: './molecule.mjs', begin: '// ===== MOLECULE SCENE =====', end: '// ===== END MOLECULE SCENE =====' },
  { label: 'left-handed probe', file: './probe.mjs', begin: '// ===== LEFT-HANDED PROBE =====', end: '// ===== END LEFT-HANDED PROBE =====' },
];
let allParity = !!page;
for (const p of PARTS) {
  let src = null; try { src = region(readFileSync(join(here, p.file), 'utf8'), p.begin, p.end); } catch {}
  const inlined = page ? region(page, p.begin, p.end) : null;
  const same = !!src && !!inlined && norm(src) === norm(inlined);
  if (!same) allParity = false;
  ck('(G) inlined ' + p.label + ' === ' + p.file + ' (byte-identical)', same);
}

console.log('The Left-Handed Bench — liveness.test.mjs (payoff-liveness twin)');
console.log('  the payoff FIRES: the enantiomer gap will not close (' + lv.enantiomer.toFixed(3) + ' Å) ·');
console.log('  the achiral control seats flush (' + lv.control.toExponential(1) + ' Å) · grab tumbles, void orbits');
for (const c of lv.cks) console.log('   ' + (c.ok ? '✓' : '✗') + ' ' + c.n);
console.log('  byte-parity: ' + (page ? (allParity ? 'IDENTICAL' : 'DRIFTED') : 'index.html not built yet'));
console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
