#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   calendar.test.cjs — the calendar core's Node twin (G-CAL).
   Run:  node tools/calendar/calendar.test.cjs

   Runs `Calendar.selfTest()` — the PURE battery the Almanac pill calls — then
   the twin-only checks, a strict SUPERSET (several checks `require` live cores
   and can never run inside a page):

     (a) SOLAR PARITY — sunEclipticLonDeg bit-identical to tools/dial/dial.js
         over a 400-jd sweep spanning 2025–2030.
     (b) WAYPOINT TRUTH — waypointsOfYear(2026) within ±1 day of the
         astronomical dates; exactly 4; strictly ordered; double-run stable.
     (c) DOY CONVENTION + YEAR-DRIFT — the 1-based anchors + inverse
         round-trips, then |dec(Hours core at doyOf) − dec(true astronomy)|
         ≤ 0.75° at the four waypoints + mid-quarters (covers the Hours core's
         2025 year-pin and its Jan-1-offset doy mapping, honestly named).
     (d) APPARITIONS FINDABLE — every doy 1..366, 5-min sampling: each of the
         four Hours.APPARITIONS predicates has ≥ 1 ON sample at estate lat.
     (e) PHASE CONTINUITY — consecutive noons advance by ~1/365; wraps once/yr.
     (f) DRESSING CAPS + CONTINUITY — the §2.3 envelopes, bell windows,
         bell-center floors, adjacent-day deltas, double-run identity.
     (g) HOUR-REGISTER MIRROR — register bands ↔ Hours.phaseName bands,
         band-for-band bijection over −90..90° by 0.1°.
     (h) ANNIVERSARY TABLE INTEGRITY — valid recurring dates; unique ids;
         tier-1/2 lines non-empty; every tabularium WINGS name has exactly one
         tier-3 row (live ledger); wing dates match the inv-03 §2 audit table
         embedded below as a FIXTURE (copy-integrity, not re-derivation).
     (i) marksFor SEMANTICS — founding-first stacking, day-100, empty day,
         years=0 never marks, computed waypoint lines, stacked-wings join.
     (j) AGE ARITHMETIC — 30 / 100 / 365.
     (k) PURITY GREP + BYTE-TWIN — no Date.now / Math.random / localStorage /
         document / window. tokens in executable code (comments + strings
         stripped, the house pattern); the inlined front-door/almanac copies
         match the source char-for-char — CONDITIONED on the built pages
         carrying the calendar include (T3.3 / T5.2 arm it; pending until then).
     (l) momentManifest — SCORE §2 schema-valid over a 48-manifest sweep
         (4 dates × 12 hours, required Hours core); solarNoonMin non-null
         exactly once per day and equal to an INDEPENDENTLY re-run §6.2
         argmax minute-scan; the EoT-honesty anchors (a constant clock-noon
         720 must FAIL): M*(2026-11-03) ∈ [729,743] (the core computes 736 —
         hours.js's civilToAST SUBTRACTS eot, so its apparent noon drifts
         OPPOSITE an ephemeris; never "correct" these back), and
         M*(2026-02-12) ∈ [699,713] (706); both bands exclude 720.
     (m) THE GATE'S SEASONS (calendar-gate.js — DESIGN §9) — the Node-runnable
         subset of the §9.8 teeth: the midsummer all-zero identity (dz snaps
         every knob at the pinned phase 0.25040); the s9b foliage-curve
         continuity over the full 366-day sweep (|Δrgb| ≤ 5/channel/day,
         |Δmix| ≤ .025/day — the round-2 MEASURED caps) + double-run
         determinism; the s9d precip coupling law over a 40-point sweep +
         the r22 date anchors (2027-01-30 snow · 2026-12-05 sleet · 2026-06-21
         rain) + the midsummer negative control; the §9.6 wildlife window +
         birdK anchors; PURITY GREP over calendar-gate.js.

   Prints "calendar twin: N/N PASS"; exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./calendar.js');
require('./calendar-gate.js'); // augments the SAME C instance with C.gate (§9)
const Hours = require('../hours/hours.js');
const Dial = require('../dial/dial.js');

let pass = 0, fail = 0;
function ok(cond, label, detail) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL: ' + label + (detail ? '   — ' + detail : '')); }
}

/* inv-03 §2 — the one-time git audit of wing birthdays, embedded as the twin's
   FIXTURE. This is a copy-integrity check against that audit, NOT independent
   verification: the runtime never re-derives dates from git, and must not. */
const WING_FIXTURE = [
  [6, 7, 'Strange Garden'], [6, 8, 'The Arcade'], [6, 8, 'The Map Room'],
  [6, 8, 'The Music Room'], [6, 8, 'The Study'], [6, 10, 'The Observatory'],
  [6, 10, 'The Hedge Maze'], [6, 11, 'The Print Room'], [6, 11, 'Threshold'],
  [6, 12, "The Maker's Shed"], [6, 13, 'Hall of Mirrors'], [6, 13, 'The Cavern'],
  [6, 14, 'The Engine Room'], [6, 14, 'The Numbers Room'], [6, 14, 'Clockwork Automata'],
  [6, 15, 'The Conservatory'], [6, 15, 'The Alchemy Lab'], [6, 15, 'Puzzle Pavilion'],
  [6, 16, 'The Tabularium'], [6, 16, 'The Hours']
];

(async function main() {

  /* ── the PURE battery first (the same function the Almanac pill calls) ── */
  const core = C.selfTest();
  core.results.forEach(r => ok(r.pass, 'battery ' + r.name));
  ok(core.pass, 'CORE BATTERY: Calendar.selfTest().pass');

  /* ── (a) solar parity vs the proven dial core ── */
  {
    const jd0 = Dial.julianDate(new Date(Date.UTC(2025, 0, 1)));
    const span = 2191; // days: 2025-01-01 → 2030-12-31
    let same = true, badJd = null;
    for (let i = 0; i < 400; i++) {
      const jd = jd0 + span * i / 399;
      if (!Object.is(C.sunEclipticLonDeg(jd), Dial.sunEclipticLonDeg(jd))) { same = false; badJd = jd; break; }
    }
    ok(same, '(a) sunEclipticLonDeg bit-identical to dial.js over 400 jd, 2025–2030', 'first divergence at jd ' + badJd);
  }

  /* ── (b) waypoint truth ── */
  {
    const w1 = C.waypointsOfYear(2026), w2 = C.waypointsOfYear(2026);
    ok(w1.length === 4, '(b) exactly 4 waypoints in 2026', 'got ' + w1.length);
    ok(w1.every((w, i) => i === 0 || w.jd > w1[i - 1].jd), '(b) waypoints strictly ordered');
    ok(JSON.stringify(w1) === JSON.stringify(w2), '(b) waypointsOfYear stable under double-run (byte-identical JSON)');
    const targets = [
      ['vernal-equinox', [[3, 20]]],
      ['summer-solstice', [[6, 21]]],
      ['autumnal-equinox', [[9, 22], [9, 23]]],
      ['winter-solstice', [[12, 21]]]
    ];
    targets.forEach(function (t, i) {
      const w = w1[i];
      const near = t[1].some(function (md) {
        return Math.abs(C.doyOf(2026, w.m, w.d) - C.doyOf(2026, md[0], md[1])) <= 1;
      });
      ok(w && w.id === t[0] && near, '(b) ' + t[0] + ' within ±1 day of astronomy', 'got ' + (w && (w.m + '/' + w.d)));
    });
  }

  /* ── (c) doy convention + year-drift tolerance ── */
  {
    ok(C.doyOf(2026, 1, 1) === 1 && C.doyOf(2026, 6, 21) === 172 && C.doyOf(2028, 12, 31) === 366,
      '(c) 1-based doy anchors: Jan-1=1 · Jun-21-2026=172 (CANON_DOY) · Dec-31-2028=366');
    const r1 = C.dateOfDoy(2026, 172), r2 = C.dateOfDoy(2028, 366);
    ok(r1.m === 6 && r1.d === 21 && r2.m === 12 && r2.d === 31, '(c) dateOfDoy inverse anchors');
    let rt = true;
    [[2026, 365], [2028, 366]].forEach(function (q) {
      for (let k = 0; k < 20; k++) {
        const n = 1 + Math.round(k * (q[1] - 1) / 19);
        const md = C.dateOfDoy(q[0], n);
        if (C.doyOf(q[0], md.m, md.d) !== n) rt = false;
      }
    });
    ok(rt, '(c) doyOf(y, dateOfDoy(y,n)) === n over a 40-value sweep, both year kinds');
    // drift bound: Hours core (2025-pinned, Jan-1-offset doy) vs true astronomy at the date
    const dates = C.waypointsOfYear(2026).map(function (w) { return [2026, w.m, w.d]; })
      .concat([[2026, 5, 5], [2026, 8, 6], [2026, 11, 7], [2027, 2, 4]]);
    let worst = 0;
    dates.forEach(function (q) {
      const lam = C.sunEclipticLonDeg(C.jdOfLocalNoon(q[0], q[1], q[2]));
      const decTrue = Hours.solarDec(lam * Hours.D2R) * Hours.R2D;
      const doy = C.doyOf(q[0], q[1], q[2]);
      let best = -Infinity;
      for (let cm = 0; cm <= 1439; cm++) {
        const a = Hours.solarAltitudeDeg(Hours.ESTATE.latDeg, doy, cm);
        if (a > best) best = a;
      }
      // transit identity: peak alt = 90 − |lat − dec|, and dec < lat at the estate
      const decHours = Hours.ESTATE.latDeg - (90 - best);
      const dv = Math.abs(decHours - decTrue);
      if (dv > worst) worst = dv;
    });
    ok(worst <= 0.75, '(c) year-drift: |dec(Hours@doy) − dec(true@date)| ≤ 0.75° at waypoints + mid-quarters (worst '
      + worst.toFixed(3) + '°)');
  }

  /* ── (d) apparitions stay findable all year ── */
  {
    const A = Hours.APPARITIONS, lat = Hours.ESTATE.latDeg;
    ok(A.length === 4, '(d) four apparitions on the estate');
    let allFound = true, badDoy = -1;
    for (let doy = 1; doy <= 366 && allFound; doy++) {
      const hit = [false, false, false, false];
      let n = 0;
      for (let cm = 0; cm < 1440 && n < 4; cm += 5) {
        const a = Hours.solarAltitudeDeg(lat, doy, cm);
        for (let i = 0; i < 4; i++) if (!hit[i] && A[i].on(a)) { hit[i] = true; n++; }
      }
      if (n < 4) { allFound = false; badDoy = doy; }
    }
    ok(allFound, '(d) every apparition has ≥ 1 ON sample at every doy 1..366 (5-min sampling)',
      'first failing doy ' + badDoy);
  }

  /* ── (e) phase continuity ── */
  {
    const t0 = Date.UTC(2026, 0, 1);
    let inBand = true, wraps = 0;
    let prev = C.seasonPhase(C.jdOfLocalNoon(2026, 1, 1));
    for (let k = 1; k <= 365; k++) {
      const dt = new Date(t0 + k * 86400000);
      const p = C.seasonPhase(C.jdOfLocalNoon(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()));
      const d = ((p - prev) % 1 + 1) % 1;
      if (d < 0.9 / 365 || d > 1.1 / 365) inBand = false;
      if (p < prev) wraps++;
      prev = p;
    }
    ok(inBand, '(e) seasonPhase advances ~1/365 per consecutive noon (365 pairs, bounds [0.9/365, 1.1/365])');
    ok(wraps === 1, '(e) seasonPhase wraps exactly once per year', 'wraps ' + wraps);
  }

  /* ── (f) dressing caps + continuity ── */
  {
    let capsOk = true, winOk = true;
    for (let i = 0; i < 4096; i++) {
      const p = i / 4096, D = C.dressing(p);
      if (!(D.wash.a >= 0.12 && D.wash.a <= 0.16 && D.foliage.a >= 0 && D.foliage.a <= 0.40
        && D.snow >= 0 && D.snow <= 1 && D.bloom >= 0 && D.bloom <= 1 && D.turn >= 0 && D.turn <= 1)) capsOk = false;
      if ((p <= 0.60 || p >= 0.99) && D.snow !== 0) winOk = false;
      if ((p >= 0.14 && p <= 0.99) && D.bloom !== 0) winOk = false;
      if ((p <= 0.49 || p >= 0.71) && D.turn !== 0) winOk = false;
    }
    ok(capsOk, '(f) caps: wash α ∈ [.12,.16] · crown α ∈ [0,.40] · snow/bloom/turn ∈ [0,1] (4096-pt phase sweep)');
    ok(winOk, '(f) snow ≡ 0 on [0,.60]∪[.99,1] · bloom ≡ 0 on [.14,.99] · turn ≡ 0 on [0,.49]∪[.71,1] (conservative bell envelopes)');
    ok(C.dressing(C.seasonPhase(C.jdOfLocalNoon(2026, 12, 21))).snow > 0.5, '(f) snow > 0.5 at 2026-12-21 solstice (r19 widened bell)');
    ok(C.dressing(0.80).snow > 0.9, '(f) snow > 0.9 near new bell center phase 0.80 (r19)');
    ok(C.dressing(C.seasonPhase(C.jdOfLocalNoon(2027, 4, 15))).bloom > 0.9, '(f) bloom > 0.9 at 2027-04-15 (bell center)');
    ok(C.dressing(C.seasonPhase(C.jdOfLocalNoon(2026, 11, 5))).turn > 0.9, '(f) turn > 0.9 at 2026-11-05 (bell center)');
    function sweep() {
      const out = [], t0 = Date.UTC(2026, 0, 1);
      for (let k = 0; k < 730; k++) {
        const dt = new Date(t0 + k * 86400000);
        out.push(C.dressing(C.seasonPhase(C.jdOfLocalNoon(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()))));
      }
      return out;
    }
    const s1 = sweep(), s2 = sweep();
    let contOk = true;
    for (let k = 1; k < s1.length; k++) {
      const A = s1[k - 1], B = s1[k];
      for (let c = 0; c < 3; c++)
        if (Math.abs(B.wash.rgb[c] - A.wash.rgb[c]) > 3 || Math.abs(B.foliage.rgb[c] - A.foliage.rgb[c]) > 3) contOk = false;
      if (Math.abs(B.wash.a - A.wash.a) > 0.01 || Math.abs(B.foliage.a - A.foliage.a) > 0.01) contOk = false;
    }
    ok(contOk, '(f) adjacent-day deltas: |Δrgb| ≤ 3/channel · |Δα| ≤ .01 (730 consecutive noons)');
    ok(JSON.stringify(s1) === JSON.stringify(s2), '(f) dressing outputs identical on double-run');
  }

  /* ── (g) hour-register mirror ── */
  {
    const regToPhase = new Map(), phaseToReg = new Map();
    let coloc = true, prevR = null, prevP = null;
    for (let i = -900; i <= 900; i++) {
      const a = i / 10;
      const r = C.hourRegister(a), p = Hours.phaseName(a);
      if (!regToPhase.has(r)) regToPhase.set(r, p); else if (regToPhase.get(r) !== p) coloc = false;
      if (!phaseToReg.has(p)) phaseToReg.set(p, r); else if (phaseToReg.get(p) !== r) coloc = false;
      if (prevR !== null && ((r !== prevR) !== (p !== prevP))) coloc = false; // boundaries coincide
      prevR = r; prevP = p;
    }
    ok(regToPhase.size === 6 && phaseToReg.size === 6 && coloc,
      '(g) register bands ↔ Hours.phaseName bands: band-for-band bijection (−90..90° by 0.1°)');
  }

  /* ── (h) anniversary table integrity ── */
  {
    const MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // recurring (m,d) must exist every year
    ok(C.ANNIVERSARIES.every(function (r) { return r.m >= 1 && r.m <= 12 && r.d >= 1 && r.d <= MLEN[r.m - 1]; }),
      '(h) all (m,d) are valid recurring dates');
    const ids = C.ANNIVERSARIES.map(function (r) { return r.id; });
    ok(new Set(ids).size === ids.length, '(h) anniversary ids unique');
    ok(C.ANNIVERSARIES.filter(function (r) { return r.tier === 1 || r.tier === 2; })
      .every(function (r) { return typeof r.line === 'string' && r.line.length > 0; }),
      '(h) every tier-1/2 row has a non-empty line');
    const t3 = C.ANNIVERSARIES.filter(function (r) { return r.tier === 3; });
    let WINGS = null;
    try { WINGS = (await import('../../tabularium/core.mjs')).WINGS; }
    catch (e) { ok(false, '(h) could not load tabularium/core.mjs (' + e.message + ')'); }
    if (WINGS) {
      ok(WINGS.length === 20 && t3.length === 20
        && WINGS.every(function (w) { return t3.filter(function (r) { return r.name === w.name; }).length === 1; }),
        '(h) every tabularium WINGS name has exactly one tier-3 row (live ledger)');
    }
    ok(WING_FIXTURE.length === 20 && WING_FIXTURE.every(function (f) {
      return t3.some(function (r) { return r.m === f[0] && r.d === f[1] && r.name === f[2]; });
    }), '(h) wing dates match inv-03 §2 (embedded fixture — copy-integrity against the one-time audit)');
  }

  /* ── (i) marksFor semantics ── */
  {
    const m1 = C.marksFor(2027, 6, 7);
    ok(m1.length === 2 && m1[0].kind === 'founding' && m1[0].glyph === '✦'
      && m1[0].text === C.ANNIVERSARIES[0].line + ', a year ago'
      && m1[1].kind === 'wing' && m1[1].text === 'Strange Garden was raised this day, a year ago',
      '(i) 2027-06-07: founding first ("a year ago") + the Strange Garden wing mark stacked');
    const m2 = C.marksFor(2026, 9, 15);
    ok(m2.length === 1 && m2[0].kind === 'milestone' && m2[0].glyph === '✶'
      && m2[0].text === C.MILESTONE_LINES[100], '(i) 2026-09-15: the day-100 milestone');
    ok(C.marksFor(2026, 8, 1).length === 0, '(i) 2026-08-01: no marks');
    ok(C.marksFor(2026, 6, 7).length === 0 && C.marksFor(2026, 6, 14).length === 0,
      '(i) years = 0 never marks (the founding day itself is unmarked in 2026)');
    const wps = C.waypointsOfYear(2026);
    ok(wps.every(function (w) {
      return C.marksFor(2026, w.m, w.d).some(function (x) {
        return x.kind === 'waypoint' && x.glyph === '☉' && x.text === C.WAYPOINT_LINES[w.id];
      });
    }), '(i) each computed 2026 waypoint date carries its waypoint line');
    const m3 = C.marksFor(2027, 6, 8);
    ok(m3.length === 1 && m3[0].kind === 'wing'
      && m3[0].text === 'The Arcade, The Map Room, The Music Room and The Study were raised this day, a year ago',
      '(i) stacked-wings join: "…, … and … were raised this day"');
  }

  /* ── (j) age arithmetic ── */
  ok(C.estateAgeDays(2026, 7, 7) === 30 && C.estateAgeDays(2026, 9, 15) === 100
    && C.estateAgeDays(2027, 6, 7) === 365, '(j) estate age: 2026-07-07→30 · 2026-09-15→100 · 2027-06-07→365');

  /* ── (k) purity grep + byte-twin re-extraction ── */
  {
    const src = fs.readFileSync(path.join(__dirname, 'calendar.js'), 'utf8');
    /* the house pattern: strip comments + string literals so a PROSE mention
       can never false-positive; scan executable code only. */
    const stripComments = function (s) {
      return s
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
        .replace(/"(?:\\.|[^"\\])*"/g, '""');
    };
    const code = stripComments(src);
    ok(!/Date\.now|Math\.random|localStorage|document|window\./.test(code),
      '(k) purity grep: no Date.now / Math.random / localStorage / document / window. in executable code');

    /* byte-twin: the built pages' inlined copies must match the source
       char-for-char (modulo forge's module-guard strip). CONDITIONED on the
       page carrying the calendar include — T3.3 (front door) / T5.2 (almanac)
       arm it; until then it prints pending and asserts nothing. */
    const GUARD = /^\s*if\s*\(\s*typeof\s+module\s*!==\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)/;
    const inlined = src.split('\n').filter(function (l) { return !GUARD.test(l); })
      .join('\n').replace(/\n$/, '');
    const REPO = path.resolve(__dirname, '..', '..');
    [{ built: 'index.html', srcHtml: 'index.src.html' },
     { built: path.join('hours', 'almanac.html'), srcHtml: path.join('hours', 'almanac.src.html') }
    ].forEach(function (pg) {
      const sp = path.join(REPO, pg.srcHtml);
      const armed = fs.existsSync(sp)
        && /<!--\s*forge:include\s+\S*calendar\.js\s*-->/.test(fs.readFileSync(sp, 'utf8'));
      if (!armed) { console.log('  · (k) byte-twin ' + pg.built + ': pending (no calendar include yet)'); return; }
      let page = '';
      try { page = fs.readFileSync(path.join(REPO, pg.built), 'utf8'); } catch (e) { /* missing build */ }
      ok(page.indexOf(inlined) !== -1, '(k) byte-twin: ' + pg.built + ' carries calendar.js char-for-char');
    });
  }

  /* ── (l) momentManifest — schema + EoT honesty (SCORE §2; DESIGN §6.2) ── */
  {
    const DATES = [[2026, 2, 12], [2026, 6, 21], [2026, 11, 3], [2027, 6, 7]];
    const HOURS12 = []; for (let h = 6; h <= 17; h++) HOURS12.push(h); // covers the 10:00–14:00 noon window
    /* the independent §6.2 argmax minute-scan — re-implemented here, never
       trusting the manifest's own value (the circularity round 1 caught) */
    function scanNoon(y, m, d) {
      const doy = C.doyOf(y, m, d);
      let best = -Infinity, M = 600;
      for (let cm = 600; cm <= 840; cm++) {
        const a = Hours.solarAltitudeDeg(Hours.ESTATE.latDeg, doy, cm);
        if (a > best) { best = a; M = cm; } // FIRST max wins ties
      }
      return M;
    }
    let schemaOk = true, onceOk = true, agreeOk = true, firstBad = '';
    const run1 = [], run2 = [];
    DATES.forEach(function (q) {
      const y = q[0], m = q[1], d = q[2];
      const M = scanNoon(y, m, d);
      let nonNull = 0;
      HOURS12.forEach(function (h) {
        const mf = C.momentManifest(y, m, d, h, Hours);
        run1.push(mf); run2.push(C.momentManifest(y, m, d, h, Hours));
        const valid = mf.seed === C.airSeed(y, m, d, h) && mf.seed === (mf.seed >>> 0)
          && Number.isInteger(mf.dateInt) && mf.dateInt === y * 10000 + m * 100 + d
          && mf.hour === h
          && typeof mf.seasonPhase === 'number' && mf.seasonPhase >= 0 && mf.seasonPhase < 1
          && Array.isArray(mf.altCurve) && mf.altCurve.length === 5 && mf.altCurve.every(Number.isFinite)
          && (mf.solarNoonMin === null
            || (Number.isInteger(mf.solarNoonMin) && mf.solarNoonMin >= 0 && mf.solarNoonMin <= 59))
          && Number.isInteger(mf.annTier) && mf.annTier >= 0 && mf.annTier <= 3
          && (mf.annLabel === null || (typeof mf.annLabel === 'string' && mf.annLabel.length > 0));
        if (!valid && !firstBad) { schemaOk = false; firstBad = y + '-' + m + '-' + d + ' h' + h; }
        if (mf.solarNoonMin !== null) nonNull++;
        const expect = (Math.floor(M / 60) === h) ? (M - h * 60) : null;
        if (mf.solarNoonMin !== expect) agreeOk = false;
      });
      if (nonNull !== 1) onceOk = false;
    });
    ok(schemaOk, '(l) 48-manifest sweep (4 dates × 12 hours): SCORE §2 schema-valid', firstBad);
    ok(onceOk, '(l) solarNoonMin non-null exactly once per swept day');
    ok(agreeOk, '(l) manifest solarNoonMin === the independent §6.2 minute-scan, all 48');
    ok(JSON.stringify(run1) === JSON.stringify(run2), '(l) manifests identical on double-call');
    const Mnov = scanNoon(2026, 11, 3), Mfeb = scanNoon(2026, 2, 12);
    ok(Mnov >= 729 && Mnov <= 743,
      '(l) EoT anchor: M*(2026-11-03) ∈ [729,743] — a constant clock-noon 720 must fail (got ' + Mnov + ')');
    ok(Mfeb >= 699 && Mfeb <= 713,
      '(l) EoT anchor: M*(2026-02-12) ∈ [699,713] — 720 excluded (got ' + Mfeb + ')');
    // the §3.3-3 mapping, exercised both ways on swept dates
    const mfF = C.momentManifest(2027, 6, 7, 9, Hours), mfW = C.momentManifest(2026, 6, 21, 12, Hours);
    ok(mfF.annTier === 1 && mfF.annLabel === C.ANNIVERSARIES[0].line + ', a year ago',
      '(l) annTier/annLabel: the founding day maps to tier 1 with the composed founding text');
    ok(mfW.annTier === 0 && mfW.annLabel === null,
      '(l) annTier/annLabel: a waypoint-only day maps to tier 0 / null (waypoints never tier)');
  }

  /* ── (m) THE GATE'S SEASONS — calendar-gate.js (DESIGN §9) ── */
  {
    // — the midsummer all-zero identity (s9a's pure half): dz snaps every knob
    //   at the real pin phase 0.25040 (≠ 0.25), so === 0 is EXACT law, §9.2.
    const pj = C.seasonPhase(C.jdOfLocalNoon(2026, 6, 21));
    const gsj = C.gate.season(pj);
    ok(gsj.foliage.mix === 0 && gsj.grassMix === 0 && gsj.cool === 0
      && gsj.bare === 0 && gsj.snow === 0
      && gsj.snowCover === 0 && gsj.spring === 0,
      '(m) midsummer identity: every Calendar.gate.season knob === 0 at phase ' + pj.toFixed(5)
      + ' (dz dead-zone, exact; r24 snowCover + spring join the exact-zero sweep)');
    // negative control: at the winter-solstice phase the cast is ~fully on
    const pw = C.seasonPhase(C.jdOfLocalNoon(2026, 12, 21));
    ok(C.gate.season(pw).cool > 0.999,
      '(m) negative control: cool > 0.999 at the winter-solstice phase (the stage can move)');

    // — s9b foliage-curve continuity over the full 366-day sweep + determinism
    //   (r24 adds the two new curves: |ΔsnowCover| ≤ .08/day, |Δspring| ≤ .06/day)
    let contOk = true, worstRgb = 0, worstMix = 0, badDay = -1;
    let coverOk = true, springOk = true, worstCover = 0, worstSpring = 0;
    const t0 = Date.UTC(2026, 0, 1);
    let prev = null;
    for (let k = 0; k < 366; k++) {
      const dt = new Date(t0 + k * 86400000);
      const p = C.seasonPhase(C.jdOfLocalNoon(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()));
      const g = C.gate.season(p);
      if (prev) {
        for (let c = 0; c < 3; c++) {
          const dr = Math.abs(g.foliage.rgb[c] - prev.foliage.rgb[c]);
          if (dr > worstRgb) worstRgb = dr;
          if (dr > 5) { contOk = false; if (badDay < 0) badDay = k; }
        }
        const dm = Math.abs(g.foliage.mix - prev.foliage.mix);
        if (dm > worstMix) worstMix = dm;
        if (dm > 0.025) { contOk = false; if (badDay < 0) badDay = k; }
        const dsc = Math.abs(g.snowCover - prev.snowCover);
        if (dsc > worstCover) worstCover = dsc;
        if (dsc > 0.08) { coverOk = false; if (badDay < 0) badDay = k; }
        const dsp = Math.abs(g.spring - prev.spring);
        if (dsp > worstSpring) worstSpring = dsp;
        if (dsp > 0.06) { springOk = false; if (badDay < 0) badDay = k; }
      }
      prev = g;
    }
    ok(contOk, '(m) s9b continuity: |Δrgb| ≤ 5/channel/day (worst ' + worstRgb.toFixed(3)
      + ') · |Δmix| ≤ .025/day (worst ' + worstMix.toFixed(4) + ') over 366 consecutive noons',
      'first breach day ' + badDay);
    ok(coverOk && springOk,
      '(m) s9b r24 curves: |ΔsnowCover| ≤ .08/day (worst ' + worstCover.toFixed(4)
      + ') · |Δspring| ≤ .06/day (worst ' + worstSpring.toFixed(4) + ') over 366 consecutive noons',
      'first breach day ' + badDay);
    let detOk = true;
    [0.02, 0.10, 0.30, 0.45, 0.60, 0.70, 0.86, 0.95].forEach(function (p) {
      if (JSON.stringify(C.gate.season(p)) !== JSON.stringify(C.gate.season(p))) detOk = false;
    });
    ok(detOk, '(m) s9b determinism: Calendar.gate.season double-eval JSON-identical at 8 probe phases');

    // — s9d precip coupling law over a 40-point sweep + the r22 date anchors
    let coupleOk = true, badP = -1;
    for (let i = 0; i < 40; i++) {
      const p = i / 40;
      const s = C.dressing(p).snow, kind = C.gate.precipKind(p);
      const want = s >= 0.5 ? 'snow' : s >= 0.04 ? 'sleet' : 'rain';
      if (kind !== want) { coupleOk = false; if (badP < 0) badP = i; }
    }
    ok(coupleOk, '(m) s9d coupling: precipKind ≡ (snow ≥ .5 → snow / [.04,.5) → sleet / else rain) over a 40-pt sweep',
      'first breach probe ' + badP);
    // r24 — ground-coupling implication: white ground never lies under plain rain
    //   (one-directional; the dz snap keeps cover 0 on the thin sleet sliver, so the
    //   converse is NOT asserted). Plus groundSnowCover(0) === 0.
    let implOk = true, badI = -1;
    for (let i = 0; i < 40; i++) {
      const p = i / 40;
      if (C.gate.groundSnowCover(C.dressing(p).snow) > 0 && C.gate.precipKind(p) === 'rain') {
        implOk = false; if (badI < 0) badI = i;
      }
    }
    ok(implOk, '(m) s9d implication: groundSnowCover > 0 ⇒ precipKind ≠ rain over a 40-pt sweep',
      'first breach probe ' + badI);
    ok(C.gate.groundSnowCover(0) === 0, '(m) s9d: groundSnowCover(0) === 0 (dz exact)');
    function pk(y, m, d) { return C.gate.precipKind(C.seasonPhase(C.jdOfLocalNoon(y, m, d))); }
    ok(pk(2027, 1, 30) === 'snow', '(m) s9d anchor: 2027-01-30 → snow (got ' + pk(2027, 1, 30) + ')');
    ok(pk(2026, 12, 5) === 'sleet', '(m) s9d anchor: 2026-12-05 → sleet, the r22 cold-edge anchor (got ' + pk(2026, 12, 5) + ')');
    ok(pk(2026, 6, 21) === 'rain', '(m) s9d anchor: 2026-06-21 → rain (got ' + pk(2026, 6, 21) + ')');
    ok(pk(2026, 6, 21) !== 'snow', '(m) s9d negative control: midsummer is NOT snow');

    // — §9.6 wildlife: the crickets window (0.21, 0.60) + birdK curve anchors
    const wSummer = C.gate.wildlife(0.30), wWinter = C.gate.wildlife(0.86), wJan = C.gate.wildlife(0.95);
    ok(wSummer.crickets === true && Math.abs(wSummer.birdK - 1) < 1e-9,
      '(m) wildlife: high-summer (p=0.30) crickets on, birdK 1.0');
    ok(wWinter.crickets === false && Math.abs(wWinter.birdK - 2.4) < 1e-9,
      '(m) wildlife: deep-winter bell center (p=0.86) crickets off, birdK 2.4');
    ok(C.gate.wildlife(0.21).crickets === false && C.gate.wildlife(0.60).crickets === false
      && C.gate.wildlife(0.22).crickets === true && C.gate.wildlife(0.59).crickets === true,
      '(m) wildlife: crickets window is the open interval (0.21, 0.60)');
    ok(wJan.crickets === false && wJan.birdK > 1,
      '(m) wildlife: deep-winter (p=0.95) crickets off, birdsong thinned (birdK > 1)');

    // — PURITY GREP over calendar-gate.js (the house comment/string-strip pattern)
    const gsrc = fs.readFileSync(path.join(__dirname, 'calendar-gate.js'), 'utf8');
    const gcode = gsrc
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""');
    ok(!/Date\.now|Math\.random|localStorage|document|window\./.test(gcode),
      '(m) purity grep: calendar-gate.js has no Date.now / Math.random / localStorage / document / window. in executable code');
  }

  /* ── report ── */
  const total = pass + fail;
  console.log('calendar twin: ' + pass + '/' + total + ' PASS' + (fail ? ' — ' + fail + ' FAILED' : ''));
  if (fail) process.exitCode = 1;

})().catch(function (e) {
  console.error('calendar twin: CRASH — ' + (e && e.stack || e));
  process.exitCode = 1;
});
