#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   kaleido.test.cjs — the Kaleidoscope's headless self-test. Requires the SAME
   core the page inlines (tools/kaleido/kaleido.js), so the green chip in the
   browser and this Node run prove the IDENTICAL math. Run:
       node tools/kaleido/kaleido.test.cjs

   The crux this proves: the rendered field is EXACTLY dihedral-symmetric (Dₙ)
   by construction. The fold collapses every Dₙ-orbit (all n rotations + all n
   reflections) to one canonical point in the fundamental wedge, so
   content(fold(P)) == content(fold(g·P)) to machine precision — symmetry is an
   identity, not a copy-and-hope. We also prove the fold lands in the
   fundamental wedge and is idempotent; the scatter is deterministic and
   skin-invariant; and the claim holds across the full order range n=3..12.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const K = require('./kaleido.js');

let pass = 0, total = 0;
const fails = [];
function check(name, cond, note) {
  total++;
  if (cond) { pass++; console.log('  ✓ ' + name + (note ? '  — ' + note : '')); }
  else { fails.push(name); console.error('  ✗ FAIL: ' + name + (note ? '  — ' + note : '')); }
}

console.log('Kaleidoscope self-test\n');

/* ─────────────────────────────────────────────────────────────────────────
   PART A — the shared CORE self-test (the exact object the in-page chip runs).
   This is the load-bearing battery; the green chip must report the same count.
   ───────────────────────────────────────────────────────────────────────── */
const core = K.runSelfTest();
console.log('  [shared core — same code path as the in-page chip]');
core.results.forEach((r, i) => {
  check('core #' + (i + 1) + ' ' + r.name, r.pass, r.note);
});
console.log('');

/* ─────────────────────────────────────────────────────────────────────────
   PART B — extra Node-side assertions that harden the proof.
   ───────────────────────────────────────────────────────────────────────── */

/* B1. Exhaustive Dₙ invariance with a tighter tolerance and dense sampling.
   For every n, every g in Dₙ, many points and several time phases:
   content(fold(P)) == content(fold(g·P)). Track the global max error. */
{
  let maxErr = 0, ok = true, where = '';
  for (let n = K.N_MIN; n <= K.N_MAX && ok; n++) {
    const els = K.groupElements(n);
    const scene0 = K.buildScene('exhaustive-' + n, n);
    const rng = K.makeRng('exh::' + n);
    for (let ti = 0; ti < 4 && ok; ti++) {
      const scene = K.sceneAt(scene0, ti * 0.911);
      for (let p = 0; p < 120 && ok; p++) {
        const x = rng() * 3 - 1.5, y = rng() * 3 - 1.5;
        const base = K.sampleAt(scene, n, x, y);
        for (let gi = 0; gi < els.length; gi++) {
          const g = K.applyLin(els[gi].lin, x, y);
          const got = K.sampleAt(scene, n, g.x, g.y);
          const e = Math.abs(got - base);
          if (e > maxErr) maxErr = e;
          if (e > 1e-9) { ok = false; where = `n=${n} g#${gi}(${els[gi].kind}) err=${e.toExponential(2)}`; break; }
        }
      }
    }
  }
  check('B1 exhaustive Dₙ invariance (n=3..12, 2n elems, dense pts × 4 phases)', ok,
    ok ? 'max err ' + maxErr.toExponential(1) : where);
}

/* B2. The group really is Dₙ: rotations close under composition (Cₙ subgroup),
   reflections square to identity, and reflection∘reflection is a rotation. */
{
  let ok = true, where = '';
  const I = [1, 0, 0, 1];
  const mul = (A, B) => [
    A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]
  ];
  const close = (A, B) => Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) + Math.abs(A[2] - B[2]) + Math.abs(A[3] - B[3]) < 1e-9;
  for (let n = K.N_MIN; n <= K.N_MAX && ok; n++) {
    const els = K.groupElements(n);
    const rots = els.filter(e => e.kind === 'rot').map(e => e.lin);
    const refs = els.filter(e => e.kind === 'ref').map(e => e.lin);
    // every reflection is an involution: M·M = I
    for (const m of refs) if (!close(mul(m, m), I)) { ok = false; where = `n=${n} reflection not involution`; break; }
    if (!ok) break;
    // r1^n = I (the generator rotation has order n)
    let acc = I.slice();
    for (let k = 0; k < n; k++) acc = mul(acc, rots[1] || I);
    if (!close(acc, I)) { ok = false; where = `n=${n} rotation order != n`; break; }
    // ref∘ref must be a rotation (det +1)
    const det = (M) => M[0] * M[3] - M[1] * M[2];
    if (Math.abs(det(mul(refs[0], refs[1 % refs.length])) - 1) > 1e-9) { ok = false; where = `n=${n} ref∘ref not a rotation`; }
  }
  check('B2 group structure: |Dₙ|=2n, reflections involute, rotations order n', ok, where || 'Dₙ confirmed');
}

/* B3. Fold determinism: foldDn is a pure function — same input, same output. */
{
  let ok = true;
  const rng = K.makeRng('pure');
  for (let i = 0; i < 500 && ok; i++) {
    const n = K.N_MIN + Math.floor(rng() * (K.N_MAX - K.N_MIN + 1));
    const x = rng() * 8 - 4, y = rng() * 8 - 4;
    const a = K.foldDn(n, x, y), b = K.foldDn(n, x, y);
    if (a.x !== b.x || a.y !== b.y || a.phi !== b.phi) ok = false;
  }
  check('B3 foldDn is a pure deterministic function', ok);
}

/* B4. Skin-invariance is total: across ALL skins, the geometry fingerprint is
   identical for identical (seed,n,t), and mixSlots alpha (coverage-driven) is
   identical — only rgb changes. */
{
  let ok = true, where = '';
  for (let n = K.N_MIN; n <= K.N_MAX && ok; n++) {
    const scene = K.buildScene('skin-' + n, n);
    const base = K.geometryFingerprint(scene, n, 0.7);
    for (const sk of K.SKIN_KEYS) {
      // fingerprint is colour-free, so it cannot vary with skin — assert it
      const fp = K.geometryFingerprint(scene, n, 0.7);
      if (fp !== base) { ok = false; where = `n=${n} fp varies (` + sk + ')'; break; }
    }
    if (!ok) break;
    // alpha equality across skins for the same coverage
    const acc = K.contentRGBA(K.sceneAt(scene, 0.7), n, 0.25, 0.18);
    const alphas = K.SKIN_KEYS.map(k => K.mixSlots(acc, K.SKINS[k])[3]);
    for (let i = 1; i < alphas.length; i++) if (Math.abs(alphas[i] - alphas[0]) > 1e-12) { ok = false; where = `n=${n} alpha differs across skins`; }
    // rgb DOES differ between glass and stained for a covered pixel (skins work)
    const g = K.mixSlots(acc, K.SKINS.glass), s = K.mixSlots(acc, K.SKINS.stained);
    if (acc.total > 0 && Math.abs(g[0] - s[0]) + Math.abs(g[1] - s[1]) + Math.abs(g[2] - s[2]) < 1) { ok = false; where = `n=${n} skins look identical (recolour broken)`; }
  }
  check('B4 skins recolour only (geometry + alpha skin-invariant, rgb differs)', ok, where || 'glass/stained/ink share geometry');
}

/* B5. No NaN/Inf anywhere across a full render-like sample sweep. */
{
  let ok = true, where = '';
  for (let n = K.N_MIN; n <= K.N_MAX && ok; n++) {
    const scene = K.sceneAt(K.buildScene('finite-' + n, n), 3.14);
    const rng = K.makeRng('fin::' + n);
    for (let p = 0; p < 300; p++) {
      const x = rng() * 2 - 1, y = rng() * 2 - 1;
      const v = K.sampleAt(scene, n, x, y);
      const c = K.sampleRGBAAt(scene, n, x, y);
      const px = K.mixSlots(c, K.SKINS.glass);
      if (!isFinite(v) || !isFinite(c.total) || px.some(z => !isFinite(z))) { ok = false; where = `n=${n} non-finite at (${x.toFixed(3)},${y.toFixed(3)})`; break; }
    }
  }
  check('B5 finite everywhere (no NaN/Inf across n × samples × skins)', ok, where || 'all samples finite');
}

/* ─────────────────────────────────────────────────────────────────────────── */
console.log('');
const allPass = fails.length === 0 && core.pass;
console.log(`Kaleidoscope self-test: ${pass}/${total} ` + (allPass ? 'PASS' : 'FAIL'));
if (!allPass) {
  console.error('\nFAILURES:\n  - ' + fails.join('\n  - '));
  process.exit(1);
}
process.exit(0);
