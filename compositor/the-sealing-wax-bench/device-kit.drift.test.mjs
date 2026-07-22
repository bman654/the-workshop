// device-kit.drift.test.mjs — the FORK GUARD. device-kit.js lifts a curated subset
// of Blazon's shipped drawCharge() builders VERBATIM (browser-only, one-way: it
// never imports seal-core). Because the code is duplicated rather than shared, a
// Blazon evolution could silently drift the two apart. This test greps
// blazon/index.html for the drawCharge signature and each `case "<name>":` the kit
// lifts — if Blazon renames a builder or drops a charge, the fork is flagged here.
// (The no-fork ideal — forge:include ONE kit into both — is a deferred follow-on.)
//   Run: `node compositor/the-sealing-wax-bench/device-kit.drift.test.mjs`

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const blazon = readFileSync(join(here, '../../blazon/index.html'), 'utf8');
const kit    = readFileSync(join(here, 'device-kit.js'), 'utf8');

let pass=0, fail=0; const fails=[];
function ck(name, ok){ if(ok) pass++; else { fail++; fails.push(name); } }

// (1) the drawCharge signature still stands in Blazon
ck('drawCharge(name, R, fill, style) signature present in blazon/index.html',
   /function\s+drawCharge\s*\(\s*name\s*,\s*R\s*,\s*fill\s*,\s*style\s*\)/.test(blazon));

// (2) every charge the kit's DEVICES menu offers still has a `case` in Blazon's drawCharge
const LIFTED = ['roundel','cross formy','crosslet','mullet','estoile','crescent',
  'lozenge','fleur-de-lis','rose','trefoil','escallop','lion','tower','key'];
for(const name of LIFTED){
  const re = new RegExp('case\\s+"'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"\\s*:');
  ck(`blazon still carries case "${name}": (the kit lifts it)`, re.test(blazon));
  // and the kit itself still claims to draw it (guards an accidental menu/lift split)
  ck(`device-kit still draws case "${name}":`, re.test(kit));
}

// (3) the kit still carries its provenance header (so the citation can't rot away silently)
ck('device-kit cites blazon/index.html line provenance', /blazon\/index\.html:1138/.test(kit));

// ── report ──
console.log('device-kit.drift.test.mjs — the Blazon fork guard');
console.log((fail===0?'  ✓ ':'  ✗ ')+pass+'/'+(pass+fail)+' checks pass');
if(fail){ console.log('  DRIFTED (Blazon changed under the lift):\n   '+fails.join('\n   ')); process.exit(1); }
