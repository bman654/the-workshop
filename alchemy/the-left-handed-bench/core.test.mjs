// The RIGOR TWIN for The Left-Handed Bench. This bench DOES make a claim — that a
// chiral molecule cannot be laid onto its mirror image by any proper rotation — so
// it owes an exact proof, and this is it. Pure, headless, Node-runnable; every
// clause drives core.mjs's real entry points (the SAME core the page inlines).
//
//   Run: `node alchemy/the-left-handed-bench/core.test.mjs`

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  MOLECULES, EPS, CONTROL_TOL,
  bestAlignment, rmsdAtRotation, quatToMat, det3, matVec, centroid, v_len,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok) { if (ok) pass++; else { fail++; fails.push(name); } console.log('   ' + (ok ? '✓' : '✗') + ' ' + name); }

const P = MOLECULES.pair, C = MOLECULES.control;
const bp = bestAlignment(P.B, P.A, P.groups);
const bc = bestAlignment(C.B, C.A, C.groups);

console.log('The Left-Handed Bench — core.test.mjs (the impossibility, proven)');

// (A) the enantiomer pair cannot be seated — best-fit RMSD well over ε
ck('(A) enantiomer best-fit RMSD > EPS  (' + bp.rmsd.toFixed(6) + ' > ' + EPS + ')',
   bp.rmsd > EPS && Math.abs(bp.rmsd - 1.249) < 0.01);

// (B) the achiral control seats flush — RMSD under the machine-tight control floor
ck('(B) achiral control best-fit RMSD < CONTROL_TOL  (' + bc.rmsd.toExponential(2) + ' < ' + CONTROL_TOL + ')',
   bc.rmsd < CONTROL_TOL);

// (C) a molecule against ITSELF seats perfectly
ck('(C) identity: A vs A ≈ 0  (' + bestAlignment(P.A, P.A, P.groups).rmsd.toExponential(2) + ')',
   bestAlignment(P.A, P.A, P.groups).rmsd < 1e-9 && bestAlignment(C.A, C.A, C.groups).rmsd < 1e-9);

// (D) MONTE-CARLO BACKSTOP: 20k uniform-random PROPER rotations. The analytic min is
//     the true minimum over SO(3), so no sampled turn may beat it (— turns "min over
//     SO(3)" into a brute-forced fact), and the enantiomer's sampled floor still clears ε.
function randProperRot() {
  const u1 = Math.random(), u2 = Math.random(), u3 = Math.random();
  const a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
  const q = [a * Math.sin(2 * Math.PI * u2), a * Math.cos(2 * Math.PI * u2),
             b * Math.sin(2 * Math.PI * u3), b * Math.cos(2 * Math.PI * u3)];
  return quatToMat([q[3], q[0], q[1], q[2]]);   // (w,x,y,z)
}
{
  let mnP = Infinity, mnC = Infinity;
  for (let i = 0; i < 20000; i++) {
    const r = randProperRot();
    const rp = rmsdAtRotation(P.B, P.A, r, P.groups); if (rp < mnP) mnP = r && rp;
    const rc = rmsdAtRotation(C.B, C.A, r, C.groups); if (rc < mnC) mnC = rc;
  }
  ck('(D) 20k random turns: enantiomer sampleMin ≥ floor−1e−3 AND > EPS  (min ' + mnP.toFixed(4) + ')',
     mnP >= bp.rmsd - 1e-3 && mnP > EPS);
  ck('(D) 20k random turns: control sampleMin ≥ floor−1e−3  (min ' + mnC.toFixed(4) + ')',
     mnC >= bc.rmsd - 1e-3);
}

// (E) proper rotations only (det=+1, never a reflection) + centred subjects + determinism
ck('(E) both returned rotations are PROPER (det=+1, no reflection)',
   Math.abs(det3(bp.R) - 1) < 1e-9 && Math.abs(det3(bc.R) - 1) < 1e-9);
ck('(E) every subject is centroid-centred (‖centroid‖ ≈ 0)',
   [P.A, P.B, C.A, C.B].every((m) => v_len(centroid(m)) < 1e-12));
ck('(E) determinism: bestAlignment is a pure function (same RMSD twice)',
   bestAlignment(P.B, P.A, P.groups).rmsd === bp.rmsd);
// the control's winning correspondence must actually RELABEL (a swap, not identity) —
// otherwise the "min over permutation" clause would be vacuous.
ck('(E) the control seats only by RELABELLING (winning perm ≠ identity)',
   C.control === undefined && bc.perm.some((v, i) => v !== i));
// rmsdAtRotation is a real ceiling on bestAlignment (live readout ≥ floor)
ck('(E) rmsdAtRotation at the best R equals the floor; a random R never beats it',
   Math.abs(rmsdAtRotation(P.B, P.A, bp.R, P.groups) - bp.rmsd) < 1e-9 &&
   rmsdAtRotation(P.B, P.A, randProperRot(), P.groups) >= bp.rmsd - 1e-9);

// (F) BYTE-PARITY: the core the page inlines === this file's core, sentinel-wrapped.
const here = dirname(fileURLToPath(import.meta.url));
function region(t, begin, end) { const i = t.indexOf(begin), j = t.indexOf(end); return (i < 0 || j < 0 || j < i) ? null : t.slice(i + begin.length, j); }
const IMPORT_LINE = /^import\b[^'"]*['"][^'"]*['"];?$/;
function norm(s) { return s.split('\n').map((l) => l.replace(/^\s+/, '').replace(/\s+$/, '')).filter((l) => l.length && !IMPORT_LINE.test(l)).join('\n'); }
const BEGIN = '// ===== LEFT-HANDED CORE =====', END = '// ===== END LEFT-HANDED CORE =====';
let page = null; try { page = readFileSync(join(here, 'index.html'), 'utf8'); } catch {}
const src = region(readFileSync(join(here, 'core.mjs'), 'utf8'), BEGIN, END);
const inlined = page ? region(page, BEGIN, END) : null;
if (page) ck('(F) inlined LEFT-HANDED CORE === core.mjs (byte-identical)', !!inlined && norm(src) === norm(inlined));
else console.log('   · (F) byte-parity skipped — index.html not built yet');

console.log((fail === 0 ? '  ✓ ' : '  ✗ ') + pass + '/' + (pass + fail) + ' checks pass  ·  enantiomer '
  + bp.rmsd.toFixed(3) + ' Å  ·  control ' + bc.rmsd.toExponential(1) + ' Å');
if (fail) { console.log('  FAILING:\n   ' + fails.join('\n   ')); process.exit(1); }
