// ============================================================================
// steiner-core.test.mjs — the Node twin. Re-runs the SAME self-test suite the
// in-page honesty pill runs, importing BOTH modules, and asserts the DoD claims
// against the independent oracle. Also enforces ANTI-CIRCULARITY by grepping the
// oracle's source: it must import no relaxer code.
//
//   run:  node soap-film/steiner-core.test.mjs
// ============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { runSelfTest, solveRaw, PRESETS, hubStar, forceCross, stepRelax } from './steiner-core.mjs';
import { steinerExact } from './steiner-oracle.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
function assert(name, cond, extra){ if(cond){ console.log('  ok  ' + name + (extra ? '  [' + extra + ']' : '')); } else { console.error('  XX  ' + name + (extra ? '  [' + extra + ']' : '')); fails++; } }

console.log('\n— SUITE (the same one the in-page pill runs) —');
const res = runSelfTest();
assert('self-test pass===total', res.pass === res.total, res.pass + '/' + res.total);

console.log('\n— DoD claims, asserted directly against the independent oracle —');
const T = PRESETS.triangle.anchors, S = PRESETS.square.anchors, Pg = PRESETS.pentagon.anchors;

const tri = solveRaw(T).totalLength, triO = steinerExact(T).length;
assert('triangle  relax==oracle==√3 <1e-6', Math.abs(tri - triO) < 1e-6 && Math.abs(tri - Math.sqrt(3)) < 1e-6, 'd=' + Math.abs(tri - triO).toExponential(2));

const sq = solveRaw(S).totalLength, sqO = steinerExact(S).length;
assert('square    relax==oracle==1+√3 <1e-6', Math.abs(sq - sqO) < 1e-6 && Math.abs(sq - (1 + Math.sqrt(3))) < 1e-6, 'd=' + Math.abs(sq - sqO).toExponential(2));

const pg = solveRaw(Pg).totalLength, pgO = steinerExact(Pg).length;
assert('pentagon  relax==oracle <1e-6', Math.abs(pg - pgO) < 1e-6 && Math.abs(pg - 3.89115682) < 1e-5, 'd=' + Math.abs(pg - pgO).toExponential(2));

// all junctions 120° within tol, across the presets
let maxAng = 0;
for(const P of [T, S, Pg]){ const net = solveRaw(P); for(const j of net.junctions) for(const a of j.angles) maxAng = Math.max(maxAng, Math.abs(a - 120)); }
assert('plateau   all junctions 120° within 1e-4', maxAng < 1e-4, maxAng.toExponential(2) + '°');

// neg-control: forced 4-way '+' splits into two 120° Ys, and is strictly longer
const crossLen = hubStar(S).totalLength;
let rs = forceCross(S), net = null;
for(let i = 0; i < 600; i++){ const o = stepRelax(rs, S, 20); net = o.net; if(o.settled) break; }
const splitJ = net.junctions.filter(j => net.nodes[j.node].kind === 'steiner');
const splitOK = splitJ.length === 2 && splitJ.every(j => j.angles.every(a => Math.abs(a - 120) < 1e-2));
assert('neg-ctrl  forced + (2√2) > split (1+√3) and splits into two 120° Ys',
  crossLen > net.totalLength + 1e-3 && Math.abs(net.totalLength - (1 + Math.sqrt(3))) < 1e-5 && splitOK,
  '+=' + crossLen.toFixed(4) + ' split=' + net.totalLength.toFixed(4));

console.log('\n— ANTI-CIRCULARITY (the verifier shares no code with the relaxer) —');
const oracleSrc = readFileSync(join(here, 'steiner-oracle.mjs'), 'utf8');
assert('oracle imports nothing from steiner-core', !/from\s+['"].*steiner-core/.test(oracleSrc));
assert('oracle references no relaxer fns (relaxBest/stepRelax/descendSteiner/relaxTopo)',
  !/\b(relaxBest|stepRelax|descendSteiner|relaxTopo|beginRelax)\b/.test(oracleSrc));
assert('oracle is a closed-form construction (Melzak, no descent loop)',
  /melzak/i.test(oracleSrc) && !/\bdescendSteiner\b/.test(oracleSrc) && !/backtrack/i.test(oracleSrc));

console.log('\n' + (fails === 0 ? 'ALL GREEN — ' + res.pass + '/' + res.total + ' suite + DoD + anti-circularity' : fails + ' FAILED'));
process.exit(fails === 0 ? 0 : 1);
