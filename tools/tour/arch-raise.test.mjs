#!/usr/bin/env node
/* ═══════════════ THE ARCH-RAISING — Node twin (WS4 T8.6) ════════════════════
   Re-proves the d08 frame talk/arch-raise.html from its single source of geometry
   truth, talk/arch-raise.geometry.mjs — the SAME module forge inlines into the
   page. No framework, zero external deps: one PASS/FAIL line per leg, non-zero exit
   on any red.

     A · THE GEOMETRY BATTERY (shared with the in-page pill): the arch is a
         well-formed ring — odd voussoir count with one keystone, two springers at
         the ends, adjacent wedges sharing a joint, all geometry finite.

     B · THE RAISING SHAPE: stages 1..3 place every voussoir exactly once and
         monotonically; the yard (stage 0) holds nothing up; the locked ring
         (stage 4) is the whole ring, closed and rigid.

     C · DETERMINISM (invariant 7): buildArch() is byte-reproducible, and neither
         the geometry module nor the render layer reaches for Math.random or the
         wall-clock — so the deck can replay any archStage(k) cue on a reload.

     D · STAGE COUNT ↔ THE d08 SCRIPT: the five stages are the yard plus exactly
         the four ⟦archStage⟧ placement cues the d08 narration marks, and the page
         is wired (forge inlines both the geometry and the render source, and the
         built HTML exposes the archStage hook with no unresolved directive). ── */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARCH, STAGES, buildArch, stageOfVoussoir, voussoirsSetAt, archStateAt, selfTestBattery
} from '../../talk/arch-raise.geometry.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');           /* worktree root */
const P = (rel) => path.join(ROOT, rel);

const results = [];
function check(label, pass, detail) { results.push({ label, pass: !!pass, detail: detail || '' }); }

const arch = buildArch();

/* ── A · the shared geometry battery ── */
const battery = selfTestBattery(arch);
for (const c of battery.checks) check('A · ' + c.label, c.pass);

/* ── B · the raising shape ── */
check('B · yard (stage 0) places nothing', voussoirsSetAt(0, arch.N).length === 0 && !archStateAt(0, arch.N).ringClosed);
check('B · springers set at stage 1 (the two ends)',
  JSON.stringify(voussoirsSetAt(1, arch.N)) === JSON.stringify([0, arch.N - 1]));
check('B · keystone is placed last (stage 3)', stageOfVoussoir(arch.keystoneIndex, arch.N) === 3);
{
  let mono = true;
  for (let k = 1; k <= 4; k++) {
    const prev = new Set(voussoirsSetAt(k - 1, arch.N));
    for (const j of prev) if (!voussoirsSetAt(k, arch.N).includes(j)) mono = false;
  }
  check('B · placement is monotone across all stages', mono);
}
check('B · locked ring (stage 4) is the whole ring, closed + rigid', (() => {
  const s = archStateAt(4, arch.N);
  return s.set.length === arch.N && s.ringClosed && s.locked;
})());

/* ── C · determinism ── */
check('C · buildArch() is byte-reproducible', JSON.stringify(buildArch()) === JSON.stringify(buildArch()));
{
  /* strip comments + string literals so a PROSE mention of "no Math.random" in a
     header comment can never false-positive; we scan executable code only. */
  const stripComments = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
  const geomSrc = fs.readFileSync(P('talk/arch-raise.geometry.mjs'), 'utf8');
  const pageSrc = fs.readFileSync(P('talk/arch-raise.js'), 'utf8');
  const geomCode = stripComments(geomSrc), pageCode = stripComments(pageSrc);
  const forbidden = /Math\.random|Date\.now|Date\.parse|new\s+Date\b/;
  check('C · geometry module code is free of randomness / wall-clock', !forbidden.test(geomCode));
  check('C · render layer code is free of randomness / wall-clock', !forbidden.test(pageCode));
  check('C · geometry module is zero-import (pure)', !/^\s*import\s/m.test(geomCode));
}

/* ── D · stage count ↔ the d08 script + page wiring ── */
{
  const d08Path = P('talk/script/d08-reach.txt');
  const d08 = fs.readFileSync(d08Path, 'utf8');
  const archStageCues = (d08.match(/⟦archStage/g) || []).length;
  check('D · d08 marks exactly four ⟦archStage⟧ placement cues', archStageCues === 4, 'found ' + archStageCues);
  check('D · five stages = the yard + the four placement cues', STAGES.length === archStageCues + 1);
  check('D · the frame flips to talk/arch-raise.html in d08', d08.indexOf('talk/arch-raise.html') >= 0);

  const src = fs.readFileSync(P('talk/arch-raise.src.html'), 'utf8');
  check('D · src wires forge:include of the geometry module',
    /forge:include\s+arch-raise\.geometry\.mjs/.test(src));
  check('D · src wires forge:include of the render layer',
    /forge:include\s+arch-raise\.js/.test(src));

  const builtPath = P('talk/arch-raise.html');
  if (fs.existsSync(builtPath)) {
    const built = fs.readFileSync(builtPath, 'utf8');
    check('D · built HTML has no unresolved forge:include directive', built.indexOf('forge:include') < 0);
    check('D · built HTML inlines the geometry (buildArch present)', built.indexOf('function buildArch') >= 0);
    check('D · built HTML exposes the archStage tour hook', /hooks\.archStage\s*=/.test(built));
  } else {
    check('D · built HTML present (run forge)', false, 'talk/arch-raise.html not built yet');
  }
}

/* ── report ── */
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  const tag = r.pass ? 'PASS' : 'FAIL';
  console.log(tag + ' — ' + r.label + (r.detail ? '  (' + r.detail + ')' : ''));
}
console.log('\n' + (failed === 0 ? 'ALL GREEN' : failed + ' RED') + ' — ' + results.length + ' checks over the arch geometry + d08 wiring.');
process.exit(failed === 0 ? 0 : 1);
