#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tour-check.mjs — the Grand Tour validation gate (WS2 / DESIGN §2, §8).

   Joins the estate gate set. Validates tools/tour/tours.js against the live
   estate-manifest.json and the files on disk, then runs a battery of NEGATIVE
   CONTROLS that MUST fail (asserted-red self-tests). Prints a summary; exits 0
   iff the installed threads are clean AND every negative control correctly failed.

   ── The §8 checks (all implemented in `validate()`) ──────────────────────────
     • every stop href resolves into estate-manifest.json (a room or exhibit
       href), OR is `index.html`, OR is an EXTRA_STOPS allow-list entry;
     • no stop is on a page in `hidden[]`;
     • no stop is inside a `locked:true` room;
     • every exhibit/room stop's `room:` matches the manifest's owning room id
       for that href (a wrong or missing `room:` is a failure);
     • no href is absolute (no leading `/`, `//`, or `scheme://`);
     • static `rel()` hop resolution — from each source page's own directory,
       every hop the engine emits (begin, advance n→n+1, back n→n−1, front-door
       `index.html`) resolves to a file that exists on disk (DESIGN §1 `rel()`);
     • every tour has ≥2 stops, a unique stable id (`[a-z-]+`), non-empty
       title / tagline / stop captions / stop titles, `minutes` present, and a
       `start` page that exists; no duplicate stops within a thread (a front-door
       waypoint is identified by its `at:` district, so a thread may cross
       `index.html` several times at different anchors — DESIGN §6/§9);
     • docent-sentinel presence: every stop's shipped `.html` contains
       DOCENT_SENTINEL — ARMED PER-THREAD via the `fixture:` flag: a
       `fixture:true` thread SKIPS this check (its includes are swept in later,
       W2). Since T3.1 the installed threads carry no `fixture:`, so this check
       runs live over every shipped stop page (the fixture flag survives only for
       the negative-control self-tests below).

   ── EXTRA_STOPS allow-list ────────────────────────────────────────────────────
     Each entry must exist on disk, carry a valid top-level district `anchor`,
     and a non-empty `justification` (DESIGN §2/§9).

   No deps beyond Node + the sibling tours.js + the committed manifest.
   Run:  node tools/tour/tour-check.mjs
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, normalize } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const MANIFEST_PATH = join(__dirname, '..', 'manifest', 'estate-manifest.json');

/* ── path helpers ──────────────────────────────────────────────────────────── */
const pathOf = (href) => String(href).split(/[?#]/)[0];           // strip query/hash
const dirOf = (p) => { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); };
const countSegments = (d) => (d === '' ? 0 : d.split('/').length);
/* DESIGN §1 — the deploy-independent relative URL builder (binding formula). */
const rel = (from, to) => '../'.repeat(countSegments(dirOf(pathOf(from)))) + to;
const isAbsolute = (href) => /^\/\//.test(href) || /^\//.test(href) || /^[a-z][a-z0-9+.-]*:\/\//i.test(href);
/* Resolve a rel()-built link from `from`'s directory to a repo-relative path. */
function resolveHop(from, to) {
  const fromDir = dirOf(pathOf(from));
  const linked = rel(from, to);                 // relative to fromDir
  return normalize(join(fromDir, pathOf(linked))).split('\\').join('/');
}
const existsRepo = (repoRelPath) => existsSync(join(REPO_ROOT, repoRelPath));

/* ── build the manifest index (rooms / exhibits / hidden / locked / districts) ── */
export function buildManifestIndex(manifest) {
  const rooms = new Map();       // room href -> { id, locked, district }
  const exhibits = new Map();    // exhibit href -> { parentId, parentLocked, district }
  const districtIds = new Set();
  for (const d of manifest.districts) {
    districtIds.add(d.id);
    for (const r of d.rooms) {
      rooms.set(r.href, { id: r.id, locked: !!r.locked, district: d.id });
      for (const e of (r.exhibits || [])) {
        if (!exhibits.has(e.href)) exhibits.set(e.href, { parentId: r.id, parentLocked: !!r.locked, district: d.id });
      }
    }
  }
  const hiddenHrefs = new Set((manifest.hidden || []).map((h) => h.href));
  return { rooms, exhibits, hiddenHrefs, districtIds };
}

/* Resolve a stop href to its owning room. Returns one of:
   {kind:'front'}                       — index.html (front door / waypoint page)
   {kind:'room',   roomId, locked}      — the href IS a manifest room
   {kind:'exhibit',roomId, locked}      — the href is a manifest exhibit
   {kind:'extra'}                       — the href is an EXTRA_STOPS allow-list entry
   {kind:'unresolved'}                  — none of the above */
function classifyHref(href, idx, extraStops) {
  const p = pathOf(href);
  if (p === 'index.html') return { kind: 'front' };
  if (idx.rooms.has(p)) { const r = idx.rooms.get(p); return { kind: 'room', roomId: r.id, locked: r.locked }; }
  if (idx.exhibits.has(p)) { const e = idx.exhibits.get(p); return { kind: 'exhibit', roomId: e.parentId, locked: e.parentLocked }; }
  if (Object.prototype.hasOwnProperty.call(extraStops, p)) return { kind: 'extra' };
  return { kind: 'unresolved' };
}

/* ── the validator — returns { ok, failures[] } over the given tours data ─────── */
export function validate(tours, extraStops, idx, opts = {}) {
  const failures = [];
  const fail = (tourId, msg) => failures.push(`[${tourId}] ${msg}`);

  /* EXTRA_STOPS allow-list: each entry exists on disk + valid anchor + justification */
  for (const [href, entry] of Object.entries(extraStops || {})) {
    const p = pathOf(href);
    if (isAbsolute(href)) fail('EXTRA_STOPS', `absolute href not allowed: "${href}"`);
    if (!existsRepo(p)) fail('EXTRA_STOPS', `allow-list page does not exist on disk: "${p}"`);
    if (!entry || !idx.districtIds.has(entry.anchor)) fail('EXTRA_STOPS', `"${href}" anchor is not a known district: "${entry && entry.anchor}"`);
    if (!entry || !String(entry.justification || '').trim()) fail('EXTRA_STOPS', `"${href}" is missing a justification`);
  }

  if (!Array.isArray(tours) || tours.length === 0) { failures.push('[TOURS] no tours defined'); return { ok: false, failures }; }

  const seenIds = new Set();
  for (const t of tours) {
    const tid = (t && t.id) || '(no-id)';
    if (!t || typeof t.id !== 'string' || !/^[a-z-]+$/.test(t.id)) fail(tid, `id must match /^[a-z-]+$/ (got "${t && t.id}")`);
    if (seenIds.has(t.id)) fail(tid, `duplicate tour id "${t.id}"`);
    seenIds.add(t.id);
    if (!String(t.title || '').trim()) fail(tid, 'empty title');
    if (!String(t.tagline || '').trim()) fail(tid, 'empty tagline');
    if (typeof t.minutes !== 'number' || !(t.minutes > 0)) fail(tid, `minutes must be a positive number (got ${t.minutes})`);
    if (typeof t.start !== 'string' || !t.start) { fail(tid, 'missing start page'); }
    else if (isAbsolute(t.start)) fail(tid, `start href is absolute: "${t.start}"`);
    else if (!existsRepo(pathOf(t.start))) fail(tid, `start page does not exist on disk: "${t.start}"`);

    const stops = Array.isArray(t.stops) ? t.stops : [];
    if (stops.length < 2) fail(tid, `a tour needs ≥2 stops (got ${stops.length})`);

    /* duplicate-stop check within the thread. A stop's identity is its href
       path, EXCEPT a front-door waypoint (`at:`) is identified by (index.html +
       its district anchor): a thread legitimately crosses the estate via several
       `index.html` waypoints at different districts (DESIGN §6/§9 — e.g. light's
       ⌂at:opticks … ⌂at:cavern), which are DISTINCT stops, not duplicates. Two
       stops with the same path AND the same waypoint anchor (or two identical
       non-waypoint hrefs) are a real duplicate. */
    const seenStops = new Set();
    for (const s of stops) {
      const key = pathOf(s.href) + (s.at !== undefined ? '@' + s.at : '');
      if (seenStops.has(key)) fail(tid, `duplicate stop within thread: "${pathOf(s.href)}"${s.at !== undefined ? ` at "${s.at}"` : ''}`);
      seenStops.add(key);
    }

    /* per-stop classification (short-circuits to ONE clear reason per stop) */
    stops.forEach((s, n) => {
      const where = `stop ${n} ("${s && s.href}")`;
      if (!s || typeof s.href !== 'string' || !s.href) { fail(tid, `${where}: missing href`); return; }
      if (!String(s.title || '').trim()) fail(tid, `${where}: empty stop title`);
      if (!String(s.caption || '').trim()) fail(tid, `${where}: empty caption`);
      if (isAbsolute(s.href)) { fail(tid, `${where}: absolute href not allowed`); return; }
      if (idx.hiddenHrefs.has(pathOf(s.href))) { fail(tid, `${where}: stop is on a hidden page`); return; }

      const cls = classifyHref(s.href, idx, extraStops);
      if (cls.locked) { fail(tid, `${where}: stop is inside a locked room ("${cls.roomId}")`); return; }

      if (s.at !== undefined) {
        /* waypoint stop */
        if (pathOf(s.href) !== 'index.html') fail(tid, `${where}: a waypoint (at:) stop must be index.html`);
        if (!idx.districtIds.has(s.at)) fail(tid, `${where}: at: is not a known district ("${s.at}")`);
        if (s.room !== undefined) fail(tid, `${where}: a waypoint stop must not carry room:`);
        return;
      }
      if (cls.kind === 'front') return;           // bare index.html stop — always valid
      if (cls.kind === 'extra') {
        if (s.room !== undefined) fail(tid, `${where}: an EXTRA_STOPS stop must use anchor, not room:`);
        if (s.anchor !== undefined && !idx.districtIds.has(s.anchor)) fail(tid, `${where}: anchor is not a known district ("${s.anchor}")`);
        return;
      }
      if (cls.kind === 'unresolved') { fail(tid, `${where}: href does not resolve to a manifest room/exhibit, index.html, or EXTRA_STOPS`); return; }
      /* room / exhibit stop → room: must be present and match the owning room id */
      if (s.room === undefined) { fail(tid, `${where}: exhibit/room stop is missing room:`); return; }
      if (s.room !== cls.roomId) fail(tid, `${where}: room mismatch — declared "${s.room}", manifest owning room is "${cls.roomId}"`);
    });

    /* rel() static hop resolution — every engine-emitted link resolves to a real file */
    const checkHop = (from, to, label) => {
      if (isAbsolute(to)) { fail(tid, `${label}: target is absolute ("${to}")`); return; }
      const resolved = resolveHop(from, to);
      if (!existsRepo(resolved)) fail(tid, `${label}: rel("${from}" → "${to}") does not resolve to a file on disk (got "${resolved}")`);
    };
    if (stops.length && typeof t.start === 'string') checkHop(t.start, stops[0].href, `begin hop from start "${t.start}"`);
    stops.forEach((s, n) => {
      if (n + 1 < stops.length) checkHop(s.href, stops[n + 1].href, `advance hop ${n}→${n + 1}`);
      if (n - 1 >= 0) checkHop(s.href, stops[n - 1].href, `back hop ${n}→${n - 1}`);
      checkHop(s.href, 'index.html', `front-door hop from stop ${n}`);
    });

    /* docent-sentinel presence — ARMED per-thread by the fixture flag */
    if (!t.fixture) {
      stops.forEach((s, n) => {
        const p = pathOf(s.href);
        let html = null;
        try { html = readFileSync(join(REPO_ROOT, p), 'utf8'); } catch { /* handled below */ }
        if (html == null) fail(tid, `stop ${n}: cannot read shipped page "${p}" for the docent-sentinel check`);
        else if (!html.includes(opts.sentinel)) fail(tid, `stop ${n} ("${p}"): shipped page is missing the docent sentinel (forgotten-include gate)`);
      });
    }
  }

  return { ok: failures.length === 0, failures };
}

/* ── gate runner (only when invoked directly) ─────────────────────────────────── */
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

function runGate() {
  const manifest = require(MANIFEST_PATH);
  const { TOURS, EXTRA_STOPS, DOCENT_SENTINEL } = require(join(__dirname, 'tours.js'));
  const idx = buildManifestIndex(manifest);
  const opts = { sentinel: DOCENT_SENTINEL };

  let pass = 0, fail = 0;
  const ok = (cond, label) => { if (cond) pass++; else { fail++; console.error('  ✗ ' + label); } };

  /* (1) the installed threads must be CLEAN */
  const live = validate(TOURS, EXTRA_STOPS, idx, opts);
  ok(live.ok, 'installed threads validate GREEN (failures: ' + live.failures.join(' | ') + ')');

  /* (2) NEGATIVE CONTROLS (§8) — each mutated tour MUST fail, for the right reason.
     A negative "passes" iff validate() returns ok:false AND names the expected law.
     The base is a real thread whose stop 1 is a plain exhibit stop (`light`); the
     `fixture:true` flag set below just SKIPS the sentinel check for the href/room
     controls (they are not about the include), so a real page's include state can
     never mask them. */
  const BASE = 'light';
  const neg = (mutate, needle, label) => {
    const tours = deepClone(TOURS).filter((t) => t.id === BASE);
    tours[0].fixture = true;
    mutate(tours[0]);
    const r = validate(tours, EXTRA_STOPS, idx, opts);
    ok(!r.ok && r.failures.some((f) => f.toLowerCase().includes(needle)),
       `neg-control [${label}] fails for the right reason (needle "${needle}"; got: ${r.failures.join(' | ') || 'NO FAILURES'})`);
  };

  neg((t) => { t.stops[1].href = 'no-such-room/index.html'; }, 'no-such-room', 'bad href');
  neg((t) => { t.stops[1].href = 'starlight-bend/index.html'; }, 'hidden', 'hidden stop');
  neg((t) => { t.stops[1].href = 'the-reliquary/index.html'; t.stops[1].room = 'reliquary'; }, 'locked', 'locked-room stop');
  neg((t) => { t.stops[1].room = 'physics-lab'; }, 'room mismatch', 'wrong room');
  neg((t) => { t.stops[1].href = '/rainbow/index.html'; }, 'absolute', 'absolute href');
  /* duplicate-stop control: two front-door waypoints at the SAME district anchor
     must still fail (proves the waypoint-aware dedup key rejects real dupes, not
     just the coarse path check). light stop 0 is ⌂at:opticks; collide stop 6 onto it. */
  neg((t) => { t.stops[6].at = t.stops[0].at; }, 'duplicate', 'duplicate waypoint anchor');

  /* (3) the docent-sentinel gate ARMS when a thread is NOT a fixture — a real
     thread over pages missing the include must fail. Proves BOTH the fixture-flag
     mechanism AND the forgotten-include gate.
     ROBUST-BY-CONSTRUCTION (WS2 T2.1e): probe with a NONCE sentinel no shipped page
     can ever contain (its literal self-describing suffix appears in no estate page).
     The T2.1 mint gave fixture-a's own stop pages the REAL sentinel, so probing with
     DOCENT_SENTINEL would silently disarm this self-test (every page now has it);
     the nonce keeps the control armed regardless of which real pages carry the
     include, across every W2/T3.1 include sweep. */
  {
    const tours = deepClone(TOURS).filter((t) => t.id === BASE);
    tours[0].fixture = false;                       // arm the sentinel check
    const NONCE = ' grand-tour-docent-NONCE-no-shipped-page-can-contain-this';
    const r = validate(tours, EXTRA_STOPS, idx, { ...opts, sentinel: NONCE });
    ok(!r.ok && r.failures.some((f) => f.toLowerCase().includes('sentinel')),
       `sentinel gate arms for a non-fixture thread via a nonce sentinel (got: ${r.failures.join(' | ') || 'NO FAILURES'})`);
  }

  const total = pass + fail;
  if (fail) { console.error('\ntour-check: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
  console.log('tour-check: ' + total + '/' + total + ' PASS (installed threads green; ' + (total - 1) + ' negative controls correctly red)');
}

/* run as a gate only when invoked directly (importable without side effects) */
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) runGate();
