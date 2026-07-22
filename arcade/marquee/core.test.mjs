/* Node twin for THE HOUSE LIGHTS scoring core.
 * Run: node arcade/marquee/core.test.mjs
 * Proves the "is this bulb lit?" math EXACT — the same core.js the page loads.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const core = require(join(here, 'core.js'));

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

// A tiny fixture: 3 skill cabinets + 1 keystone.
const cabs = [
  { slug: 'a', par: 100, metric: 'score' },
  { slug: 'b', par: 5,   metric: 'level' },
  { slug: 'c', par: 8,   metric: 'wave'  },
  { slug: 'key', par: null, metric: 'keystone' }
];
const reader = (vals) => (c) => (c.slug in vals ? vals[c.slug] : 0);

// --- isLit: the neg-control math (cannot be lit by wishing) -----------------
ok(core.isLit(100, 100) === true,  'exactly at par is lit');
ok(core.isLit(101, 100) === true,  'above par is lit');
ok(core.isLit(99, 100) === false,  'below par is UNLIT (neg-control)');
ok(core.isLit(0, 100) === false,   'unplayed is unlit');
ok(core.isLit(50, null) === false, 'null par never lights');
ok(core.isLit(50, 0) === false,    'zero par never lights');
ok(core.isLit(NaN, 100) === false, 'NaN best is unlit');

// --- progress ---------------------------------------------------------------
ok(core.progress(78, 100) === 0.78, 'progress fraction');
ok(core.progress(200, 100) === 1,   'progress clamps to 1');
ok(core.progress(0, 100) === 0,     'unplayed progress is 0');
ok(core.progress(50, null) === 0,   'null par progress is 0');

// --- skill accounting -------------------------------------------------------
ok(core.skillTotal(cabs) === 3, 'skillTotal excludes keystone');
ok(core.isSkill(cabs[3]) === false, 'keystone is not a skill cabinet');

// --- counts -----------------------------------------------------------------
ok(core.litSkillCount(cabs, reader({ a: 100, b: 2, c: 0 })) === 1, 'one at par -> count 1');
ok(core.litSkillCount(cabs, reader({ a: 100, b: 5, c: 8 })) === 3, 'all at par -> count 3');
ok(core.litSkillCount(cabs, reader({})) === 0, 'fresh board -> count 0');

// --- keystone requires ALL skill lit ---------------------------------------
ok(core.keystoneLit(cabs, reader({ a: 100, b: 5, c: 7 })) === false, 'one short -> keystone dark');
ok(core.keystoneLit(cabs, reader({ a: 100, b: 5, c: 8 })) === true,  '22nd crossing -> keystone lit');

// --- litSet includes keystone only when complete ---------------------------
ok(JSON.stringify(core.litSet(cabs, reader({ a: 100, b: 5, c: 7 }))) === JSON.stringify(['a', 'b']),
   'litSet: partial, no keystone');
ok(JSON.stringify(core.litSet(cabs, reader({ a: 100, b: 5, c: 8 }))) === JSON.stringify(['a', 'b', 'c', 'key']),
   'litSet: complete includes keystone');

// --- on-deck: highest ratio<1 among played-but-short ------------------------
let od = core.onDeck(cabs, reader({ a: 40, b: 4, c: 0 })); // a=0.40, b=0.80, c unplayed
ok(od && od.slug === 'b', 'on-deck picks closest to par (b @ .80)');
od = core.onDeck(cabs, reader({ a: 100, b: 5, c: 8 }));     // all lit
ok(od === null, 'on-deck null when all lit');
od = core.onDeck(cabs, reader({}));                         // none played
ok(od === null, 'on-deck null on fresh board');
od = core.onDeck(cabs, reader({ a: 100, b: 4, c: 0 }));     // a lit, b short
ok(od && od.slug === 'b', 'on-deck skips already-lit cabinets');

// --- the REAL table sanity: 22 skill + 1 keystone, keys present -------------
const table = require(join(here, 'load-pars.cjs'));
ok(table.length === 23, 'real table has 23 cabinets');
ok(core.skillTotal(table) === 22, 'real table has 22 skill cabinets');
const keystones = table.filter((c) => c.metric === 'keystone');
ok(keystones.length === 1 && keystones[0].slug === 'pong', 'pong is the sole keystone');
ok(table.filter((c) => core.isSkill(c) && !c.key).length === 0, 'every skill cabinet has a key');
ok(table.filter((c) => core.isSkill(c) && !(c.par > 0)).length === 0, 'every skill cabinet has a positive par');
ok(new Set(table.map((c) => c.slug)).size === 23, 'slugs unique');
ok(new Set(table.map((c) => c.mono)).size === 23, 'monograms unique');

console.log(fail === 0
  ? `\n  ✓ core.test.mjs — all ${pass} assertions pass`
  : `\n  ✗ core.test.mjs — ${fail} FAILED, ${pass} passed`);
process.exit(fail === 0 ? 0 : 1);
