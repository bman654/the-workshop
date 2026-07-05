#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tour.test.mjs — Node twin for tools/tour/tour.js (the docent ENGINE).
   Run:  node tools/tour/tour.test.mjs   (exit 0 = all pass, exit 1 = a failure)

   The engine exposes its whole decision surface as PURE functions + a pure state
   machine (every side effect injected via `env`), so the walk can be driven to
   completion with no DOM. This twin proves (DESIGN §1/§3/§5/§7, T0.2 acceptance):
     • rel() depth math (both deploy bases), the param merge/strip, page identity;
     • classifyLoad's four outcomes (normal / wandered / tour / finale+hold);
     • advance/back/front-door/begin/resume link targets;
     • the dwell clock (countdown, one-shot expiry, suspend/resume, hold-not-armed);
     • the ws: write points + resume-state, driven against the REAL ws.js with a
       Map-backed localStorage mock (high-water max semantics, done flag, degrade);
     • the FULL state machine: ARRIVE (records high-water) → PERFORM → DWELL →
       ADVANCE, soft-pause, explicit pause/resume, back, leave (records nothing),
       hold (no countdown), FINALE (flags done), finale choices, wandered, and the
       bfcache pageshow re-entry.
   No deps beyond Node + the sibling tour.js/ws.js. The twin carries its OWN two
   fixture threads (a local FIXTURES const below) rather than importing the
   shipped tools/tour/tours.js: a pure-logic engine twin must be decoupled from
   register content, so replacing the fixtures with the five real threads (T3.1)
   cannot break these logic assertions (DESIGN §8 — the twins test the engine's
   testable core, not the shipped thread data).
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

/* ── a Map-backed localStorage mock (string-coercing), then the REAL ws.js ──── */
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
const WS = require(join(__dirname, '..', 'ws', 'ws.js'));
const T = require(join(__dirname, 'tour.js'));

/* ── the twin's OWN fixture threads (decoupled from the shipped tours.js) ────────
   These are the two tiny fixture threads that tools/tour/tours.js carried before
   T3.1 installed the five real threads. The twin owns them so its engine-logic
   assertions are immune to register-content changes in the shipped data. They
   exercise the full schema surface (front-door + exhibit starts, mid-thread
   waypoint, hold/act/dwell, EXTRA_STOPS). */
const FIXTURES = [
  {
    id: 'fixture-a',
    fixture: true,
    title: 'Fixture — Light Sampler',
    tagline: 'a tiny fixture thread over real optics pages (schema + gate proof only)',
    minutes: 2,
    start: 'index.html',
    stops: [
      { href: 'index.html', at: 'opticks',
        title: 'Fixture — The Estate from Above',
        caption: 'Fixture stop — front-door waypoint overture; anchored at the opticks district. Placeholder prose.',
        dwell: 12000 },
      { href: 'rainbow/index.html', room: 'hall-of-mirrors',
        title: 'Fixture — The Rainbow',
        caption: 'Fixture stop — an exhibit stop with a per-stop dwell override. Placeholder prose.',
        dwell: 20000 },
      { href: 'iridescence/index.html', room: 'hall-of-mirrors',
        title: 'Fixture — Iridescence',
        caption: 'Fixture stop — a HOLD stop (no countdown; the docent waits). Placeholder prose.',
        hold: true },
      { href: 'cavern/double-slit/index.html', room: 'physics-lab',
        title: 'Fixture — The Double Slit',
        caption: 'Fixture stop — an ACT stop (bespoke performance) and the FINALE. Placeholder prose.',
        beats: 'act' }
    ]
  },
  {
    id: 'fixture-b',
    fixture: true,
    title: 'Fixture — Chance & Records Sampler',
    tagline: 'a tiny fixture thread with a mid-thread waypoint and an EXTRA_STOPS page',
    minutes: 2,
    start: 'galton/index.html',
    stops: [
      { href: 'galton/index.html', room: 'workbench',
        title: 'Fixture — The Galton Board',
        caption: 'Fixture stop — an exhibit start (the plaque page for this thread). Placeholder prose.' },
      { href: 'index.html', at: 'number',
        title: 'Fixture — The Number Garden',
        caption: 'Fixture stop — a mid-thread front-door waypoint, anchored at the number district. Placeholder prose.',
        dwell: 10000 },
      { href: 'buffon/index.html', room: 'numbers-room',
        title: "Fixture — Buffon's Needles",
        caption: 'Fixture stop — a plain exhibit stop. Placeholder prose.' },
      { href: 'colophon.html',
        title: 'Fixture — The Colophon',
        caption: 'Fixture stop — an EXTRA_STOPS page (outside the manifest) and the FINALE. Placeholder prose.' }
    ]
  }
];

/* ── tiny assert harness (ws.test.cjs style) ─────────────────────────────────── */
let pass = 0, fail = 0;
function ok(cond, label) { if (cond) pass++; else { fail++; console.error('  ✗ FAIL: ' + label); } }
function eq(a, b, label) { ok(a === b, label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function reset() { global.localStorage.clear(); }

/* ══════════════════════════════════════════════════════════════════════════
   1) rel() — the BINDING deploy-independent URL builder (DESIGN §1)
   ══════════════════════════════════════════════════════════════════════════ */
eq(T.rel('index.html', 'rainbow/index.html'), 'rainbow/index.html', 'rel: front door → nested exhibit (depth 0)');
eq(T.rel('rainbow/index.html', 'index.html'), '../index.html', 'rel: depth-1 exhibit → front door');
eq(T.rel('cavern/double-slit/index.html', 'index.html'), '../../index.html', 'rel: depth-2 exhibit → front door');
eq(T.rel('cavern/double-slit/index.html', 'the-rewind-shelf/index.html'), '../../the-rewind-shelf/index.html', 'rel: depth-2 → sibling top-level');
eq(T.rel('colophon.html', 'bootstrap-bench/index.html'), 'bootstrap-bench/index.html', 'rel: root file → nested (depth 0)');
eq(T.rel('the-barrel-house/pin-barrel/index.html', 'index.html'), '../../index.html', 'rel: depth-2 pin-barrel → front door');
/* depth math is deploy-independent: it depends ONLY on the repo-relative `from`
   segment count, so the SAME rel() string is correct under /the-workshop/ and /. */
eq(T.countSegments(T.dirOf(T.pathOf('a/b/c/index.html'))), 3, 'countSegments of a 3-deep dir');
eq(T.dirOf('rainbow/index.html'), 'rainbow', 'dirOf strips the filename');
eq(T.pathOf('rainbow/index.html?tour=x&stop=2#frag'), 'rainbow/index.html', 'pathOf strips query + hash');

/* ══════════════════════════════════════════════════════════════════════════
   2) param merge / strip / parse
   ══════════════════════════════════════════════════════════════════════════ */
eq(T.mergeTourParams('rainbow/index.html', 'light', 2), 'rainbow/index.html?tour=light&stop=2', 'merge: bare href gains tour+stop');
ok(/seed=7/.test(T.mergeTourParams('galton/index.html?seed=7', 'chance', 1)), 'merge: preserves the stop’s own query (seed)');
ok(/tour=chance/.test(T.mergeTourParams('galton/index.html?seed=7', 'chance', 1)), 'merge: adds tour onto an existing query');
eq(T.splitHref('x/y.html?a=1#h').hash, '#h', 'splitHref: hash captured');
eq(T.mergeTourParams('x/y.html#deep', 'maker', 0), 'x/y.html?tour=maker&stop=0#deep', 'merge: keeps the hash after the query');
eq(T.stripTourParams('?tour=light&stop=3'), '', 'strip: removes both engine keys → empty search');
eq(T.stripTourParams('?seed=7&tour=light&stop=3'), '?seed=7', 'strip: keeps a foreign key, drops only the two');
{
  const p = T.parseTourParams('?tour=light&stop=4'); eq(p.tour, 'light', 'parse: tour id'); eq(p.stop, 4, 'parse: stop int');
}
eq(T.parseTourParams('?foo=1'), null, 'parse: no tour param → null');
eq(T.parseTourParams('?tour=light').stop, 0, 'parse: missing stop defaults to 0');
eq(T.parseTourParams('?tour=light&stop=abc').stop, -1, 'parse: non-numeric stop → -1 (forces out-of-range)');

/* ══════════════════════════════════════════════════════════════════════════
   3) pageMatches — deploy-independent page identity
   ══════════════════════════════════════════════════════════════════════════ */
ok(T.pageMatches('/index.html', 'index.html'), 'match: localhost root file = index.html');
ok(T.pageMatches('/', 'index.html'), 'match: bare "/" normalizes to index.html');
ok(T.pageMatches('/the-workshop/', 'index.html'), 'match: Pages base dir → index.html');
ok(T.pageMatches('/the-workshop/rainbow/index.html', 'rainbow/index.html'), 'match: Pages nested exhibit');
ok(T.pageMatches('/rainbow/', 'rainbow/index.html'), 'match: directory URL → index.html');
ok(!T.pageMatches('/the-pool/index.html', 'pool/index.html'), 'match: segment boundary — "the-pool" ≠ "pool" (no false positive)');
ok(!T.pageMatches('/mirage/index.html', 'rainbow/index.html'), 'match: different page → false');

/* ══════════════════════════════════════════════════════════════════════════
   4) classifyLoad — the state-machine entry decision (over the shipped fixtures)
   ══════════════════════════════════════════════════════════════════════════ */
const fa = T.findTour(FIXTURES, 'fixture-a');
ok(fa && fa.id === 'fixture-a', 'findTour: locates fixture-a');
eq(T.classifyLoad(FIXTURES, null, '/rainbow/index.html').mode, 'normal', 'classify: no params → normal');
eq(T.classifyLoad(FIXTURES, { tour: 'no-such', stop: 0 }, '/index.html').mode, 'normal', 'classify: unknown tour → normal');
eq(T.classifyLoad(FIXTURES, { tour: 'fixture-a', stop: 99 }, '/index.html').mode, 'normal', 'classify: stop out of range → normal');
eq(T.classifyLoad(FIXTURES, { tour: 'fixture-a', stop: -1 }, '/index.html').mode, 'normal', 'classify: negative stop → normal');
{
  /* fixture-a stop 1 is rainbow/index.html; on the wrong page → wandered */
  const w = T.classifyLoad(FIXTURES, { tour: 'fixture-a', stop: 1 }, '/mirage/index.html');
  eq(w.mode, 'wandered', 'classify: valid params, wrong page → wandered');
  eq(w.stopIndex, 1, 'classify: wandered carries the intended stop index');
  /* on the right page → tour mode */
  const t = T.classifyLoad(FIXTURES, { tour: 'fixture-a', stop: 1 }, '/the-workshop/rainbow/index.html');
  eq(t.mode, 'tour', 'classify: valid params on the right page → tour');
  eq(t.isFinale, false, 'classify: mid-thread stop is not the finale');
  eq(t.isHold, false, 'classify: rainbow fixture stop is not a hold');
  /* fixture-a stop 2 is iridescence, hold:true */
  const h = T.classifyLoad(FIXTURES, { tour: 'fixture-a', stop: 2 }, '/iridescence/index.html');
  eq(h.isHold, true, 'classify: fixture hold stop → isHold');
  /* fixture-a stop 3 is the last (double-slit) → finale */
  const f = T.classifyLoad(FIXTURES, { tour: 'fixture-a', stop: 3 }, '/cavern/double-slit/index.html');
  eq(f.isFinale, true, 'classify: last stop → isFinale');
}

/* ══════════════════════════════════════════════════════════════════════════
   5) link targets
   ══════════════════════════════════════════════════════════════════════════ */
{
  /* a synthetic 3-stop tour to check targets at known depths */
  const tour = { id: 'x', stops: [
    { href: 'index.html' }, { href: 'rainbow/index.html' }, { href: 'cavern/double-slit/index.html' }
  ] };
  eq(T.advanceTarget(tour, 0, 'index.html'), 'rainbow/index.html?tour=x&stop=1', 'advance: front door → stop 1');
  eq(T.advanceTarget(tour, 1, 'rainbow/index.html'), '../cavern/double-slit/index.html?tour=x&stop=2', 'advance: depth-1 → depth-2 sibling');
  eq(T.advanceTarget(tour, 2, 'cavern/double-slit/index.html'), null, 'advance: last stop → null (finale)');
  eq(T.backTarget(tour, 0, 'index.html'), null, 'back: first stop → null');
  eq(T.backTarget(tour, 2, 'cavern/double-slit/index.html'), '../../rainbow/index.html?tour=x&stop=1', 'back: depth-2 → depth-1');
  eq(T.frontDoorTarget('cavern/double-slit/index.html'), '../../index.html', 'front door: NO tour params (a plain visit)');
  eq(T.beginTarget(tour, 'index.html'), 'index.html?tour=x&stop=0', 'begin: to stop 0 with params');
  eq(T.stopTarget(tour, 2, 'index.html'), 'cavern/double-slit/index.html?tour=x&stop=2', 'resume: to an arbitrary stop with params');
}

/* ══════════════════════════════════════════════════════════════════════════
   6) the dwell clock (pure; caller-driven ticks — no Date, no timers)
   ══════════════════════════════════════════════════════════════════════════ */
{
  const c = T.createDwellClock(1000); c.arm();
  eq(c.expired(), false, 'dwell: not expired when freshly armed');
  c.tick(400); eq(c.remaining(), 600, 'dwell: ticks down by dt'); eq(c.secondsLeft(), 1, 'dwell: secondsLeft ceils');
  c.suspend(); c.tick(1000); eq(c.remaining(), 600, 'dwell: suspended clock ignores ticks (soft-pause)');
  c.resume(); c.tick(700); eq(c.expired(), true, 'dwell: expires once remaining hits 0'); eq(c.remaining(), 0, 'dwell: remaining floored at 0');
  c.resume(); c.tick(100); eq(c.remaining(), 0, 'dwell: an expired clock does not un-expire on resume');
  ok(Math.abs(T.createDwellClock(2000).fraction() - 0) < 1e-9, 'dwell: fraction starts at 0');
}

/* ══════════════════════════════════════════════════════════════════════════
   7) ws: write points + resume-state (REAL ws.js, Map-backed storage)
   ══════════════════════════════════════════════════════════════════════════ */
reset();
T.recordArrive(WS, 'light', 3);
eq(localStorage.getItem('ws:best:tour:light'), '3', 'recordArrive: writes the high-water via WS.best');
T.recordArrive(WS, 'light', 1);
eq(localStorage.getItem('ws:best:tour:light'), '3', 'recordArrive: never lowers the high-water (WS.best max)');
T.recordArrive(WS, 'light', 6);
eq(localStorage.getItem('ws:best:tour:light'), '6', 'recordArrive: raises the high-water');
T.recordFinale(WS, 'light');
eq(localStorage.getItem('ws:flag:tour:light:done'), '1', 'recordFinale: sets the done flag');
{
  const rs = T.resumeState(WS, 'light');
  eq(rs.ok, true, 'resumeState: ok with working storage');
  eq(rs.best, 6, 'resumeState: reads the high-water');
  eq(rs.done, true, 'resumeState: reads the done flag');
}
{
  const rs = T.resumeState(WS, 'never-walked');
  eq(rs.best, null, 'resumeState: null best for an unwalked tour');
  eq(rs.done, false, 'resumeState: not done for an unwalked tour');
}
/* degrade silently when the store is unavailable (private browsing) */
{
  const rs = T.resumeState({ store: () => ({ ok: false, get: () => null, has: () => false }) }, 'light');
  eq(rs.ok, false, 'resumeState: ok:false when storage is blocked');
  eq(rs.best, null, 'resumeState: best null when storage is blocked (plain begin)');
}
ok((function () { try { T.recordArrive(null, 'x', 1); T.recordFinale(undefined, 'x'); return true; } catch (e) { return false; } })(), 'ws writes: no-op safely when WS is absent');

/* ══════════════════════════════════════════════════════════════════════════
   8) drawer rows + start-plaque data source (§6/§7)
   ══════════════════════════════════════════════════════════════════════════ */
reset();
{
  const rows = T.drawerRows(FIXTURES, WS, 'index.html');
  eq(rows.length, FIXTURES.length, 'drawerRows: one row per thread');
  ok(rows[0].beginTarget.indexOf('tour=fixture-a') >= 0, 'drawerRows: begin target carries the tour id');
  eq(rows[0].resume, null, 'drawerRows: no resume when the tour was never walked');
  /* after walking fixture-a to stop 1, the row offers resume */
  T.recordArrive(WS, 'fixture-a', 1);
  const rows2 = T.drawerRows(FIXTURES, WS, 'index.html');
  ok(rows2[0].resume && rows2[0].resume.stopIndex === 1, 'drawerRows: offers resume at the high-water after a walk');
  /* a finished tour drops the resume affordance */
  T.recordFinale(WS, 'fixture-a');
  eq(T.drawerRows(FIXTURES, WS, 'index.html')[0].resume, null, 'drawerRows: a completed tour shows begin, not resume');
}
reset();
{
  /* fixture-a starts at the front door (index.html) → NO plaque */
  eq(T.startPlaqueInfo(FIXTURES, '/index.html', WS), null, 'plaque: front-door-started thread renders no plaque (drawer is its affordance)');
  /* fixture-b starts at galton/index.html → a plaque, in begin state */
  const pl = T.startPlaqueInfo(FIXTURES, '/galton/index.html', WS);
  ok(pl && pl.id === 'fixture-b', 'plaque: exhibit-started thread yields plaque info on its start page');
  ok(pl.beginTarget.indexOf('tour=fixture-b') >= 0, 'plaque: begin target carries the tour id');
  eq(pl.resume, null, 'plaque: begin (not resume) before any walk');
  eq(T.startPlaqueInfo(FIXTURES, '/mirage/index.html', WS), null, 'plaque: no plaque on a page that starts nothing');
}

/* ══════════════════════════════════════════════════════════════════════════
   9) the STATE MACHINE — driven with a stub env + a recording view
   ══════════════════════════════════════════════════════════════════════════ */
function recordingView() {
  const log = [];
  const v = {};
  ['mount', 'announce', 'updateDwell', 'setPaused', 'setSoftPaused', 'setWaiting', 'showFinale', 'showWandered', 'teardown']
    .forEach((k) => { v[k] = (...a) => log.push([k, ...a]); });
  v.log = log;
  v.calls = (k) => log.filter((e) => e[0] === k);
  return v;
}
function makeEnv(over) {
  const nav = [];
  const leaves = [];
  const view = recordingView();
  const env = Object.assign({
    tours: over.tours, params: over.params, pathname: over.pathname, ws: over.ws || null, reduced: false,
    /* NOTE: no `perform` → the machine enters DWELL synchronously (twin drives ticks) */
    view, navigate: (u) => nav.push(u), leave: () => leaves.push(true),
    rejoinTarget: (t, n) => 'REJOIN:' + t.id + ':' + n
  }, over.env || {});
  return { env, view, nav, leaves };
}
const TT = { id: 'tt', title: 'Test Thread', stops: [
  { href: 'index.html', title: 'Overture', caption: 'a', dwell: 1000 },
  { href: 'rainbow/index.html', title: 'The Rainbow', caption: 'b', dwell: 2000 },
  { href: 'pool/index.html', title: 'The Pool', caption: 'c', hold: true },
  { href: 'cavern/double-slit/index.html', title: 'The Double Slit', caption: 'd' }
] };

/* 9a — ARRIVE records high-water, mounts, announces, then DWELL arms */
reset();
{
  const { env, view, nav } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  eq(m.phase(), 'dwell', 'machine: ARRIVE→PERFORM→DWELL (no act) lands in dwell');
  eq(localStorage.getItem('ws:best:tour:tt'), '1', 'machine: ARRIVE recorded the high-water (the one recording point)');
  eq(view.calls('mount').length, 1, 'machine: the card mounted once');
  eq(view.calls('announce')[0][1], 'The Rainbow — on Test Thread', 'machine: announced "{stop} — on {tour}" (place, not count)');
  /* tick to expiry → ADVANCE to stop 2 (pool), via rel() from rainbow */
  m.tick(2000);
  eq(m.phase(), 'left', 'machine: expiry → left (navigating on)');
  eq(nav[0], '../pool/index.html?tour=tt&stop=2', 'machine: auto-advance builds the next-stop URL via rel()');
  eq(view.calls('teardown').length, 1, 'machine: teardown before navigation');
}

/* 9b — soft-pause on engagement suspends the countdown; resume continues it */
reset();
{
  const { env, view, nav } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  m.tick(500);
  m.engage();
  eq(m.phase(), 'softpaused', 'machine: engagement soft-pauses the walk');
  ok(view.calls('setSoftPaused').some((c) => c[1] === true), 'machine: view flipped to the waiting state');
  m.tick(5000); /* ignored while soft-paused */
  eq(nav.length, 0, 'machine: a soft-paused countdown does not advance');
  m.resume();
  eq(m.phase(), 'dwell', 'machine: resume returns to dwell');
  m.tick(1600); /* 2000 - 500 already elapsed = 1500 remaining → expires */
  eq(nav[0], '../pool/index.html?tour=tt&stop=2', 'machine: resumed countdown finishes and advances');
}

/* 9c — explicit pause / resume */
reset();
{
  const { env, view } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start(); m.pause();
  eq(m.phase(), 'paused', 'machine: explicit pause halts the dwell');
  ok(view.calls('setPaused').some((c) => c[1] === true), 'machine: pause reflected in the view');
  m.resume(); eq(m.phase(), 'dwell', 'machine: resume from explicit pause');
}

/* 9d — back navigates to the previous stop; leave strips and records nothing */
reset();
{
  const { env, nav, leaves } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  m.back();
  eq(nav[0], '../index.html?tour=tt&stop=0', 'machine: back → previous stop URL');
}
reset();
{
  const { env, view, leaves } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  const bestBefore = localStorage.getItem('ws:best:tour:tt');
  m.leave();
  eq(m.phase(), 'left', 'machine: leave → left');
  eq(leaves.length, 1, 'machine: leave stripped the params (env.leave called)');
  eq(view.calls('teardown').length, 1, 'machine: leave tore the chrome down');
  eq(localStorage.getItem('ws:best:tour:tt'), bestBefore, 'machine: leave records nothing new (high-water unchanged)');
}

/* 9e — a HOLD stop never counts down (§1) */
reset();
{
  const { env, view, nav } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 2 }, pathname: '/pool/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  eq(m.phase(), 'hold', 'machine: a hold stop lands in the hold phase, not dwell');
  ok(view.calls('setWaiting').some((c) => c[1] === true), 'machine: hold shows the "walk on when you’re ready" waiting state');
  m.tick(100000);
  eq(nav.length, 0, 'machine: a hold stop never auto-advances, no matter how long');
  m.walkOn();
  eq(nav[0], '../cavern/double-slit/index.html?tour=tt&stop=3', 'machine: walk-on from a hold advances on demand');
}

/* 9f — FINALE flags done, shows the closing card, has no walk-on; choices work */
reset();
{
  const { env, view, nav, leaves } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 3 }, pathname: '/cavern/double-slit/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  eq(m.phase(), 'finale', 'machine: last stop → finale');
  eq(localStorage.getItem('ws:flag:tour:tt:done'), '1', 'machine: FINALE flagged tour done');
  eq(view.calls('showFinale').length, 1, 'machine: the closing card shown');
  m.walkOn();
  eq(nav.length, 0, 'machine: the finale has no walk-on (advance is inert)');
  m.finaleChoice('again');
  eq(nav[0], '../../index.html?tour=tt&stop=0', 'machine: "walk it again" restarts at stop 0');
}
reset();
{
  const { env, nav } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 3 }, pathname: '/cavern/double-slit/index.html', ws: WS });
  const m = T.createDocentMachine(env); m.start();
  m.finaleChoice('front');
  eq(nav[0], '../../index.html', 'machine: "the front door" → index.html with NO tour params');
}
reset();
{
  const { env, leaves } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 3 }, pathname: '/cavern/double-slit/index.html', ws: WS });
  const m = T.createDocentMachine(env); m.start();
  m.finaleChoice('wander');
  eq(leaves.length, 1, 'machine: "wander from here" leaves (strips params, stays put)');
}

/* 9g — wandered-off (valid params, wrong page) */
reset();
{
  const { env, view } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/mirage/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  eq(m.phase(), 'wandered', 'machine: valid params on the wrong page → wandered');
  eq(view.calls('showWandered').length, 1, 'machine: the wandered-off mini-card shown');
  eq(view.calls('showWandered')[0][1].rejoinTarget, 'REJOIN:tt:1', 'machine: wandered card offers the rejoin target');
  eq(localStorage.getItem('ws:best:tour:tt'), null, 'machine: wandering records no high-water');
}

/* 9h — bfcache pageshow(persisted) re-runs the machine from the URL (§1) */
reset();
{
  const { env, view } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS });
  const m = T.createDocentMachine(env);
  m.start();
  m.tick(2000);                 /* advances → phase left */
  eq(m.phase(), 'left', 'machine: pre-condition — walked on, now left');
  m.pageshow(false);
  eq(m.phase(), 'left', 'machine: a non-persisted pageshow does nothing');
  m.pageshow(true);             /* frozen Back/Forward snapshot restored */
  eq(m.phase(), 'dwell', 'machine: a persisted pageshow re-inits the walk (dial resumes)');
  ok(view.calls('mount').length >= 2, 'machine: bfcache re-entry re-mounts the card');
}

/* 9i — reduced-motion surfaces on the view model */
reset();
{
  const { env } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS, env: { reduced: true } });
  const m = T.createDocentMachine(env);
  const cls = m.start();
  eq(cls.mode, 'tour', 'machine: reduced-motion still enters tour mode');
  ok(env.view.calls('mount')[0][1].reduced === true, 'machine: the view model carries reduced:true');
}

/* ══════════════════════════════════════════════════════════════════════════
   10) the shipped fixtures classify cleanly on their own pages
   ══════════════════════════════════════════════════════════════════════════ */
FIXTURES.forEach((t) => {
  t.stops.forEach((s, n) => {
    const pn = '/' + T.pathOf(s.href);
    const c = T.classifyLoad(FIXTURES, { tour: t.id, stop: n }, pn);
    ok(c.mode === 'tour', 'fixtures: ' + t.id + ' stop ' + n + ' (' + s.href + ') classifies as tour on its own page');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   10b) resolveThreadAnchors — the §6 BINDING lit-thread anchor algorithm (T1.2).
        Exhibit → room POI when the room rides a PARENT plate, else its district
        structure; waypoint → district structure; EXTRA → authored anchor;
        CONSECUTIVE same-anchor stops collapse into one ×n anchor.
   ══════════════════════════════════════════════════════════════════════════ */
{
  const DATA = {
    roomPlate: { 'hall-of-mirrors': 'opticks', 'physics-lab': 'cavern', 'daedalus': 'child:fairground', 'workbench': 'outbuilding' },
    roomDistrict: { 'hall-of-mirrors': 'opticks', 'physics-lab': 'cavern', 'daedalus': 'fairground', 'workbench': 'outbuilding' },
    extraStops: { 'colophon.html': { anchor: 'manor' } }
  };
  const seq = (stops) => T.resolveThreadAnchors(stops, DATA).map((a) => a.kind + ':' + a.id + (a.count > 1 ? 'x' + a.count : '')).join(' ');

  /* the fixture-a shape: waypoint → two same-room exhibits → another exhibit */
  eq(seq([{ href: 'index.html', at: 'opticks' },
          { href: 'rainbow/index.html', room: 'hall-of-mirrors' },
          { href: 'iridescence/index.html', room: 'hall-of-mirrors' },
          { href: 'cavern/double-slit/index.html', room: 'physics-lab' }]),
     'struct:opticks poi:hall-of-mirrorsx2 poi:physics-lab',
     'anchors: waypoint→struct · parent-plate rooms→POI · consecutive same-room stops collapse into one ×2 anchor');

  /* a CHILD-plate room pins to its parent district structure (degradation, §6) */
  eq(seq([{ href: 'daedalus/index.html', room: 'daedalus' }]), 'struct:fairground',
     'anchors: a child-layer room (no POI on the parent plate) pins to its district structure');

  /* EXTRA stop: anchor from the EXTRA_STOPS entry; stop.anchor overrides it */
  eq(seq([{ href: 'colophon.html' }]), 'struct:manor', 'anchors: an EXTRA stop takes its authored EXTRA_STOPS anchor');
  eq(seq([{ href: 'colophon.html', anchor: 'outbuilding' }]), 'struct:outbuilding', 'anchors: an explicit stop.anchor overrides the EXTRA_STOPS entry');

  /* non-consecutive repeats do NOT collapse (the thread honestly crosses back) */
  eq(seq([{ href: 'rainbow/index.html', room: 'hall-of-mirrors' },
          { href: 'cavern/double-slit/index.html', room: 'physics-lab' },
          { href: 'iridescence/index.html', room: 'hall-of-mirrors' }]),
     'poi:hall-of-mirrors poi:physics-lab poi:hall-of-mirrors',
     'anchors: NON-consecutive same-anchor stops stay distinct (a real crossing, not a collapse)');

  /* an unresolvable stop contributes no roundel; the walk continues */
  eq(seq([{ href: 'mystery/index.html', room: 'no-such-room' },
          { href: 'rainbow/index.html', room: 'hall-of-mirrors' }]),
     'poi:hall-of-mirrors', 'anchors: an unresolvable stop degrades to no roundel (never a throw)');

  /* the live fixtures resolve: fixture-a = 3 distinct anchors (one ×2), fixture-b = 4 */
  const fa = T.resolveThreadAnchors(FIXTURES[0].stops, {
    roomPlate: { 'hall-of-mirrors': 'opticks', 'physics-lab': 'cavern' },
    roomDistrict: {}, extraStops: {}
  });
  eq(fa.length, 3, 'anchors: fixture-a resolves to 3 distinct anchors');
  eq(fa[1].count, 2, 'anchors: fixture-a hall-of-mirrors anchor carries ×2');
  const fb = T.resolveThreadAnchors(FIXTURES[1].stops, {
    roomPlate: { 'workbench': 'outbuilding', 'numbers-room': 'number' },
    roomDistrict: {}, extraStops: { 'colophon.html': { anchor: 'manor' } }
  });
  eq(fb.length, 4, 'anchors: fixture-b resolves to 4 distinct anchors (waypoint + EXTRA included)');
}

/* ══════════════════════════════════════════════════════════════════════════
   11) the beats RUNTIME (§4, T0.3) — layered contract, pause-aware beat(),
       abort, and the hard cap. The runtime is pure + TICK-DRIVEN, so — exactly
       like the dwell clock — the twin advances its clock by hand; because beats
       resolve through promises, each hand-tick is followed by a microtask flush
       so a cooperative act's `await` can progress before the next tick.
   ══════════════════════════════════════════════════════════════════════════ */
/* drain a handful of microtask turns so awaiting acts run between ticks */
function flush(n) { let p = Promise.resolve(); for (let i = 0; i < (n || 6); i++) p = p.then(() => {}); return p; }
/* advance a runtime's internal clock by `total` ms in `step` chunks, flushing
   between each so the act's continuations register their next beat in time */
async function drive(rt, total, step) {
  step = step || 50; let acc = 0; await flush();
  while (acc < total) { rt.tick(step); acc += step; await flush(); }
  await flush(8);
}
/* the machine routes its own tick() to the beats runtime while in PERFORM */
async function driveMachine(m, total, step) {
  step = step || 50; let acc = 0; await flush();
  while (acc < total) { m.tick(step); acc += step; await flush(); }
  await flush(8);
}

async function beatsTests() {
  /* 11a — layer resolution (act wins over spots; spots over nothing) */
  eq(T.createBeatsRuntime({ info: {}, act: () => {} }).layer(), 'act', 'beats: an __tourAct wins → act layer');
  eq(T.createBeatsRuntime({ info: {}, act: () => {}, spots: [{}] }).layer(), 'act', 'beats: act still wins when spots also present');
  eq(T.createBeatsRuntime({ info: {}, spots: [{}, {}] }).layer(), 'walk', 'beats: spots + no act → declarative walk layer');
  eq(T.createBeatsRuntime({ info: {} }).layer(), 'none', 'beats: neither → do-nothing layer');

  /* 11b — the do-nothing default resolves at once, unaborted */
  {
    const rt = T.createBeatsRuntime({ info: {} });
    const res = await rt.run();
    eq(res.aborted, false, 'beats: none-layer run resolves (not aborted)');
    eq(res.capped, false, 'beats: none-layer run not capped');
  }

  /* 11c — an act runs its beats in order, calling a real entry fn between them;
     ctx is EXACTLY the §4 surface (eight keys) */
  {
    const order = []; let ctxKeys = '';
    const rt = T.createBeatsRuntime({
      info: { tourId: 'x', stopIndex: 2, reduced: false },
      act: async (ctx) => {
        ctxKeys = Object.keys(ctx).sort().join(',');
        order.push('start'); await ctx.beat(300);
        order.push('a'); await ctx.beat(300);
        order.push('b'); ctx.done();
      }
    });
    const dp = rt.run();
    await drive(rt, 200, 50); eq(order.join(','), 'start', 'beats: act paused at its first beat before 300ms');
    await drive(rt, 500, 50);
    const res = await dp;
    eq(order.join(','), 'start,a,b', 'beats: act advanced through both beats in order');
    eq(ctxKeys, 'beat,done,reduced,signal,softPause,spotlight,stopIndex,tourId', 'beats: ctx is EXACTLY the §4 surface');
    eq(res.finished, true, 'beats: ctx.done() marks the runtime finished');
  }

  /* 11d — beat() is pause-aware: a paused clock does not advance the beat */
  {
    let done = false;
    const rt = T.createBeatsRuntime({ info: {}, act: async (ctx) => { await ctx.beat(1000); done = true; } });
    const dp = rt.run();
    await drive(rt, 500, 50); ok(!done, 'beats: beat not yet resolved at 500ms');
    rt.pause(); await drive(rt, 5000, 250); ok(!done, 'beats: a PAUSED runtime freezes beat() (no advance)');
    rt.resume(); await drive(rt, 600, 50); await dp;
    ok(done, 'beats: resume lets the frozen beat finish');
  }

  /* 11e — abort (leave/advance): the pending beat rejects, the signal fires,
     and run() still RESOLVES so the machine proceeds to dwell */
  {
    let errName = null;
    const rt = T.createBeatsRuntime({ info: {}, act: async (ctx) => { try { await ctx.beat(10000); } catch (e) { errName = e.name; } } });
    const dp = rt.run();
    await drive(rt, 300, 50);
    rt.abort('leave');
    const res = await dp;
    eq(errName, 'AbortError', 'beats: an aborted beat rejects with an AbortError');
    eq(rt.signal.aborted, true, 'beats: abort fires the ctx.signal');
    eq(res.aborted, true, 'beats: run() reports aborted but still resolves');
  }

  /* 11f — the hard cap: an act that never finishes is capped, then dwell proceeds */
  {
    let capReason = null;
    const rt = T.createBeatsRuntime({ info: { cap: 1000 }, act: async (ctx) => { try { await ctx.beat(999999); } catch (e) { capReason = e.reason; } } });
    const dp = rt.run();
    await drive(rt, 1200, 200);
    const res = await dp;
    eq(res.capped, true, 'beats: exceeding the cap resolves run() as capped');
    eq(rt.signal.aborted, true, 'beats: the cap aborts the act (signal fires)');
    eq(capReason, 'cap', 'beats: the capped beat rejection carries the cap reason');
  }

  /* 11g — ctx.done() short-circuits a would-be long wait */
  {
    let reachedTail = false;
    const rt = T.createBeatsRuntime({ info: {}, act: async (ctx) => { await ctx.beat(200); ctx.done(); await ctx.beat(999999); reachedTail = true; } });
    const dp = rt.run();
    await drive(rt, 300, 50);
    const res = await dp;
    eq(res.finished, true, 'beats: done() finishes the run without waiting out the 999999ms tail');
    ok(reachedTail, 'beats: a beat requested after done() resolves at once (act unwinds cleanly)');
  }

  /* 11h — the declarative walk: each [data-tour-spot] is scrolled + lit in order */
  {
    const lit = [], scrolled = [];
    const s1 = { id: 1 }, s2 = { id: 2 }, s3 = { id: 3 };
    const rt = T.createBeatsRuntime({
      info: {}, spots: [s1, s2, s3], spotDwell: 100,
      spotlight: (elx, on) => { if (on) lit.push(elx.id); },
      scrollTo: (elx) => scrolled.push(elx.id)
    });
    eq(rt.layer(), 'walk', 'beats: walk layer chosen for a spots-only page');
    const dp = rt.run();
    await drive(rt, 400, 25);
    await dp;
    eq(lit.join(','), '1,2,3', 'beats: the walk lit each spot in numeric order');
    eq(scrolled.join(','), '1,2,3', 'beats: the walk scrolled to each spot in order');
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   12) the MACHINE ↔ beats integration (the perform seam) — an act runs a real
       entry fn under the engine; the cap rescues a hung act; a soft-paused act
       hands to a suspended dwell; leaving mid-act aborts it.
   ══════════════════════════════════════════════════════════════════════════ */
async function machineBeatsTests() {
  /* 12a — an act stop stays in PERFORM until the beats resolve, calls its real
     entry fn, then lands in DWELL; the high-water is recorded on ARRIVE first */
  reset();
  {
    let fired = 0;
    const mkBeats = (info) => T.createBeatsRuntime({ info, act: async (ctx) => { await ctx.beat(200); fired++; ctx.done(); } });
    const { env, nav } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS, env: { makeBeats: mkBeats } });
    const m = T.createDocentMachine(env);
    m.start();
    eq(m.phase(), 'perform', 'machine+beats: an act stop holds in PERFORM until the act resolves');
    eq(localStorage.getItem('ws:best:tour:tt'), '1', 'machine+beats: high-water recorded on ARRIVE (before the act)');
    await driveMachine(m, 400, 50);
    eq(m.phase(), 'dwell', 'machine+beats: PERFORM → DWELL once the act finishes');
    eq(fired, 1, 'machine+beats: the act ran its REAL entry function under the engine');
    eq(nav.length, 0, 'machine+beats: no navigation yet (dwell has not expired)');
  }

  /* 12b — a hung act is capped and the walk proceeds to DWELL (safety net) */
  reset();
  {
    const mkHang = (info) => T.createBeatsRuntime({ info: Object.assign({}, info, { cap: 600 }), act: async (ctx) => { try { await ctx.beat(999999); } catch (e) {} } });
    const { env } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS, env: { makeBeats: mkHang } });
    const m = T.createDocentMachine(env);
    m.start();
    await driveMachine(m, 800, 50);
    eq(m.phase(), 'dwell', 'machine+beats: a hung act is capped, then the walk enters DWELL');
  }

  /* 12c — an act that soft-paused hands off to a SUSPENDED dwell (§4) */
  reset();
  {
    const mkSoft = (info) => T.createBeatsRuntime({ info, act: async (ctx) => { ctx.softPause(); await ctx.beat(100); ctx.done(); } });
    const { env, view } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS, env: { makeBeats: mkSoft } });
    const m = T.createDocentMachine(env);
    m.start();
    await driveMachine(m, 300, 50);
    eq(m.phase(), 'softpaused', 'machine+beats: a soft-paused act → dwell starts suspended (waiting)');
    ok(view.calls('setSoftPaused').some((c) => c[1] === true), 'machine+beats: the waiting state shows after a soft-paused act');
  }

  /* 12d — leaving mid-act aborts it: the act's later beats never fire */
  reset();
  {
    let leaked = 0;
    const mkLeaky = (info) => T.createBeatsRuntime({ info, act: async (ctx) => { await ctx.beat(200); leaked++; await ctx.beat(200); leaked++; } });
    const { env, leaves } = makeEnv({ tours: [TT], params: { tour: 'tt', stop: 1 }, pathname: '/rainbow/index.html', ws: WS, env: { makeBeats: mkLeaky } });
    const m = T.createDocentMachine(env);
    m.start();
    await driveMachine(m, 100, 50);   /* before the first beat (200ms) completes */
    m.leave();
    eq(m.phase(), 'left', 'machine+beats: leave during an act → left');
    await driveMachine(m, 600, 50);
    eq(leaked, 0, 'machine+beats: leaving aborts the act — its beats never fire again');
    eq(leaves.length, 1, 'machine+beats: leave stripped the params');
  }
}

/* ── run the async suites, then report ────────────────────────────────────────── */
function report() {
  const total = pass + fail;
  if (fail) { console.error('\ntour engine self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
  console.log('tour engine self-test: ' + total + '/' + total + ' PASS');
  process.exit(0);
}
beatsTests()
  .then(machineBeatsTests)
  .then(report)
  .catch((e) => { console.error('\ntour engine self-test: async suite threw —', e && e.stack || e); process.exit(1); });
