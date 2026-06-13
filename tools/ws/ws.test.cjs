#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   ws.test.cjs — Node self-test for tools/ws/ws.js (the workshop's "a self-test
   proves it" promise). Run:  node tools/ws/ws.test.cjs

   No deps. Mocks a Map-backed global.localStorage, requires ws.js, and asserts
   writers, the store() shape, the predicate table, bootstrap()'s silencing, and
   checkUnlocks()'s fresh-once behavior. Prints "ws self-test: N/N PASS" and
   exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── a Map-backed localStorage mock (string-coercing, like the real thing) ── */
function makeLocalStorage() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(String(k), String(v)); },
    removeItem(k) { m.delete(k); },
    key(i) { return Array.from(m.keys())[i]; },
    get length() { return m.size; },
    clear() { m.clear(); }
  };
}

global.localStorage = makeLocalStorage();

const WS = require('../ws/ws.js');

/* ── tiny assert harness ──────────────────────────────────────────────────── */
let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL: ' + label); }
}
function eq(a, b, label) { ok(a === b, label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function reset() { global.localStorage.clear(); }

/* ── Writers ──────────────────────────────────────────────────────────────── */
reset();
eq(WS.seen('verse'), true, 'seen() returns true on first set');
eq(WS.seen('verse'), false, 'seen() returns false when already set');
ok(localStorage.getItem('ws:seen:verse') != null, 'seen() wrote ws:seen:verse');

reset();
WS.best('swarm', 5);
eq(localStorage.getItem('ws:best:swarm'), '5', 'best() sets initial');
WS.best('swarm', 3);
eq(localStorage.getItem('ws:best:swarm'), '5', 'best() does NOT lower');
WS.best('swarm', 8);
eq(localStorage.getItem('ws:best:swarm'), '8', 'best() raises');

reset();
WS.flag('eleven');
eq(localStorage.getItem('ws:flag:eleven'), '1', 'flag() sets =1');

/* dwell accumulator: crosses threshold → sets patience flag */
reset();
WS.dwellAdd('lattice', 100000, 150000);
ok(localStorage.getItem('ws:flag:patience') == null, 'dwellAdd below thresh: no patience flag');
WS.dwellAdd('drift', 60000, 150000); // sum now 160000 across two dwell keys
ok(localStorage.getItem('ws:flag:patience') != null, 'dwellAdd: summed across all ws:dwell:* sets patience at thresh');

/* ── Reader: store() shape ──────────────────────────────────────────────────── */
reset();
WS.seen('verse');
WS.best('swarm', 7);
const store = WS.store();
eq(store.ok, true, 'store().ok true with working storage');
eq(store.has('ws:seen:verse'), true, 'store().has finds a set key');
eq(store.has('ws:seen:nope'), false, 'store().has false for absent key');
eq(store.get('ws:best:swarm'), '7', 'store().get returns the value');
ok(store.all && store.all['ws:seen:verse'] != null, 'store().all is the raw map');

/* ── Predicate table ────────────────────────────────────────────────────────── */
// quickening: two seens
reset();
WS.seen('game-of-life'); WS.seen('lattice');
ok(WS.unlocked('quickening', WS.store()), 'quickening unlocks on game-of-life + lattice');
reset();
WS.seen('game-of-life');
ok(!WS.unlocked('quickening', WS.store()), 'quickening stays locked with only one parent');

// survivor: threshold >= 5
reset();
WS.best('swarm', 4);
ok(!WS.unlocked('the-survivor', WS.store()), 'survivor locked at swarm=4');
WS.best('swarm', 5);
ok(WS.unlocked('the-survivor', WS.store()), 'survivor unlocks at swarm>=5');

// rosette: full combo across all four trigger types
reset();
WS.seen('game-of-life'); WS.seen('lattice'); WS.flag('patience'); WS.flag('eleven'); WS.best('swarm', 7);
ok(!WS.unlocked('rosette', WS.store()), 'rosette locked at swarm=7 (needs >=8)');
WS.best('swarm', 8);
ok(WS.unlocked('rosette', WS.store()), 'rosette unlocks with full combo + swarm>=8');

// codex: verse + scriptorium
reset();
WS.seen('verse'); WS.seen('scriptorium');
ok(WS.unlocked('codex', WS.store()), 'codex unlocks on verse + scriptorium');

// reckoner: three-instrument AND
reset();
WS.seen('slipstick'); WS.seen('astrolabe');
ok(!WS.unlocked('reckoner', WS.store()), 'reckoner locked with only two instruments');
WS.seen('abacus');
ok(WS.unlocked('reckoner', WS.store()), 'reckoner unlocks with all three instruments');

// unlocked() guards: bad id / store-off
reset();
ok(!WS.unlocked('no-such-secret', WS.store()), 'unlocked() false for unknown id');
ok(!WS.unlocked('codex', { ok: false, has: () => true, get: () => '1' }), 'unlocked() false when store not ok');

/* ── bootstrap(): silences already-satisfied secrets ───────────────────────── */
reset();
WS.seen('verse'); WS.seen('scriptorium'); // codex satisfied BEFORE the feature existed
WS.bootstrap();
ok(localStorage.getItem('ws:ann:bootstrap') != null, 'bootstrap() sets ws:ann:bootstrap');
ok(localStorage.getItem('ws:ann:codex') != null, 'bootstrap() pre-marks the already-satisfied codex');
const freshAfterBootstrap = WS.checkUnlocks({ silent: true });
eq(freshAfterBootstrap.length, 0, 'checkUnlocks() returns NO fresh ids after bootstrap silenced them');

/* bootstrap is idempotent — running again does not re-pre-mark */
reset();
WS.bootstrap();              // nothing satisfied → only sets bootstrap marker
WS.seen('verse'); WS.seen('scriptorium'); // satisfy codex AFTER bootstrap
WS.bootstrap();              // should be a no-op now (marker already set)
ok(localStorage.getItem('ws:ann:codex') == null, 'bootstrap() is idempotent: does NOT pre-mark a secret satisfied after first run');

/* ── checkUnlocks(): fresh only once, only for newly satisfied ─────────────── */
reset();
WS.bootstrap();                       // first run, nothing satisfied
let fresh = WS.checkUnlocks({ silent: true });
eq(fresh.length, 0, 'checkUnlocks() with nothing satisfied: no fresh');
WS.seen('verse'); WS.seen('scriptorium'); // now satisfy codex
fresh = WS.checkUnlocks({ silent: true });
eq(fresh.length, 1, 'checkUnlocks() returns codex once it is newly satisfied');
eq(fresh[0], 'codex', 'checkUnlocks() fresh id is codex');
ok(localStorage.getItem('ws:ann:codex') != null, 'checkUnlocks() marked ws:ann:codex');
fresh = WS.checkUnlocks({ silent: true });
eq(fresh.length, 0, 'checkUnlocks() does NOT re-fire codex (already announced)');

/* multiple fresh at once → list of >1, all marked */
reset();
WS.bootstrap();
WS.seen('verse'); WS.seen('scriptorium'); WS.seen('orrery'); // satisfies codex AND almanac
fresh = WS.checkUnlocks({ silent: true });
eq(fresh.length, 2, 'checkUnlocks() collects multiple fresh ids at once');
ok(fresh.indexOf('codex') >= 0 && fresh.indexOf('almanac') >= 0, 'checkUnlocks() multi-fresh includes codex + almanac');

/* ── report ─────────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) {
  console.error('\nws self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED');
  process.exit(1);
}
console.log('ws self-test: ' + pass + '/' + total + ' PASS');
process.exit(0);
