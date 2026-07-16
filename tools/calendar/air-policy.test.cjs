#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   air-policy.test.cjs — the conductor's mute/arm policy twin (G-AIR).
   Run:  node tools/calendar/air-policy.test.cjs

   `.cjs`, because it `require`s the classic air.js — the dial/hours twin
   convention (an ESM named-import against a CJS `module.exports` object
   literal can resolve `undefined` and pass vacuously, impl r1-m2).

   DESIGN §8.3. Two halves, because a correct pure function does not prove the
   handlers route through it (realist r4-M3):

     THE POLICY (the pure core)
     (a) THE 32-ROW TRUTH TABLE — five inputs (armed · muted · visible ·
         ctxRunning · everGesture), every combination, against a LITERAL
         expected table transcribed from §8.3's four formulas — not recomputed
         from them (a twin that re-derives the implementation's arithmetic
         asserts nothing). Outputs are strict booleans / exact numbers.
     (b) THE NAMED INVARIANTS — each quantified over the whole table, not
         spot-checked: disarmed ⇒ never wantCtx (B3/B8) · muted ⇒ masterLevel 0
         AND scheduler off WHILE the ctx stays wanted (the no-suspend-on-mute
         rule, §5.3) · hidden ⇒ scheduler off AND masterLevel 0 for EVERY value
         of the other inputs — a hidden-tab unmute can never sound (r4-M3) ·
         !ctxRunning ⇒ scheduler off AND held (the was-held guard as policy,
         r4-M2) · exactly one row sounds.
     (c) THE SENTINEL REGION — the AIR POLICY BEGIN/END slice is PURE (no ctx /
         DOM / storage / clock / random tokens) and reads EXACTLY the five named
         inputs, no more (r6-r3: the r6 layers — wind, pads — ride the same
         arm/mute/visibility lifecycle and add NO policy input; airTargets is
         unchanged in shape: exactly the four named outputs).

     THE WIRING (asserted, not assumed — grep, r4-M3)
     (d) ws:pref:air WRITE SITES — the write expression appears exactly TWICE,
         both inside the click paths (arm, disarm); and the r6 layers add NO new
         ws: key: every ws: literal in air.js is ws:pref:air (§5.3).
     (e) NO ctx.suspend — the token appears nowhere in executable code. The air
         never suspends the shared ctx (§5.5, B8's no-hidden-work intent met by
         self-scope; unchanged by r3-F2 — detecting a stalled ctx is a string
         compare on ctx.state, not a call).
     (f) THE STATECHANGE BRACKET — addEventListener('statechange' appears
         exactly once and is reached by the arm path; its removeEventListener
         counterpart exactly once, reached by the disarm path (r3-F2).
     (g) THE PUMP-START SITE + THE THREE HANDLERS — setInterval appears exactly
         ONCE in air.js, and that one site sits inside applyAir's rising-edge
         block (the single pump-start site, edge-triggered); and each of the
         three subscribed handlers — onMuteChange, visibilitychange, statechange
         — contains a call to applyAir.

     THE CROSSING (driven, not grepped — (a)–(g) never run the conductor)
     (h) THE PRECOMPUTE-LIVE TOOTH — a fresh air.js is armed against a stub page
         and the WebAudio clock advanced across an hour boundary: arm() must
         complete (compose injects Hours — the LOUD half), precompose() must
         build a NON-NULL `derived` at > 3540 s (momentManifest accepts the
         injected Hours — the SILENT half), and at the boundary cross() must take
         its FAST path (the pre-composed bucket, no synchronous compose). A
         self-arming twin run (nextHour sabotaged) proves the boundary otherwise
         falls to the slow compose path (r15.5).

   Prints "air policy twin: N/N PASS"; exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* The house crash guard, registered BEFORE anything can throw — including the
   require of air.js itself, which DESIGN §5.4 says must be inert at parse time:
   a twin that dies must still read as a named failure, never a bare stack
   (calendar.test.cjs's convention). */
process.on('uncaughtException', function (e) {
  console.error('air policy twin: CRASH — ' + ((e && e.stack) || e));
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
const A = require('./air.js');

let pass = 0, fail = 0;
function ok(cond, label, detail) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL: ' + label + (detail ? '   — ' + detail : '')); }
}

/* airTargets is PURE by design — so call it defensively. An impure policy (a
   `document` read sneaking into the sentinel region) throws in Node, and a bare
   throw would ABORT the run before check (c)'s purity grep — the detector built
   for exactly that fault — could name it. A throw is recorded as a row failure
   instead, so the gate reports the cause rather than a stack. */
function call(inputs) {
  try { return { ok: true, val: A.airTargets(inputs) }; }
  catch (e) { return { ok: false, val: null, err: (e && e.message) || String(e) }; }
}

const SRC = fs.readFileSync(path.join(__dirname, 'air.js'), 'utf8');

/* ── the code view ───────────────────────────────────────────────────────────
   A length-PRESERVING mask: comments become spaces, so a prose mention can
   never false-positive (the house pattern), while every structural character
   keeps its index — brace matching and site locations stay truthful. With
   `blankStrings`, string INTERIORS blank too (for token greps that must not see
   a literal); without it, literals stay readable (for the ws: key greps, where
   the key IS a literal). */
function mask(src, blankStrings) {
  const out = src.split('');
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') { out[i] = ' '; i++; }
    } else if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (; i < stop; i++) if (src[i] !== '\n') out[i] = ' ';
    } else if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { if (blankStrings) { out[i] = ' '; out[i + 1] = ' '; } i += 2; continue; }
        if (blankStrings && src[i] !== '\n') out[i] = ' ';
        i++;
      }
      i++;
    } else i++;
  }
  return out.join('');
}
const CODE = mask(SRC, false);   // comments gone, literals intact
const BARE = mask(SRC, true);    // comments AND string interiors gone

/* Brace-match from `from` (which must sit at or before the opening `{`);
   returns [open, close] indices of the block, or null. */
function block(code, from) {
  const open = code.indexOf('{', from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (!depth) return [open, i]; }
  }
  return null;
}
/* The body of the function whose declaration matches `re` (first match). */
function bodyOf(code, re) {
  const m = re.exec(code);
  if (!m) return null;
  const b = block(code, m.index);
  return b ? { text: code.slice(b[0], b[1] + 1), open: b[0], close: b[1] } : null;
}
/* The name of the innermost `function NAME(` whose body contains `idx`. */
function enclosing(code, idx) {
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m, best = null;
  while ((m = re.exec(code))) {
    const b = block(code, m.index);
    if (b && b[0] < idx && idx < b[1]) best = m[1];
  }
  return best;
}
function count(hay, needle) {
  let n = 0, i = 0;
  for (;;) { const k = hay.indexOf(needle, i); if (k === -1) return n; n++; i = k + needle.length; }
}

/* the mask's own sanity tooth: if the mask mis-parsed, every structural check
   below would be quietly meaningless — so prove the braces balance. */
{
  let depth = 0, floor = true;
  for (let i = 0; i < CODE.length; i++) {
    if (CODE[i] === '{') depth++;
    else if (CODE[i] === '}') { depth--; if (depth < 0) floor = false; }
  }
  ok(depth === 0 && floor, 'mask sanity: braces balance over the masked source', 'depth ' + depth);
  ok(CODE.length === SRC.length && BARE.length === SRC.length,
    'mask sanity: the mask is length-preserving (site indices are truthful)');
}

/* ── (a) the 32-row truth table ──────────────────────────────────────────────
   Transcribed from DESIGN §8.3 — inputs then expectations:
     armed · muted · visible · ctxRunning · everGesture ,
     wantCtx · schedulerOn · masterLevel (L = AIR_LEVEL) · held
   The one row that sounds is [armed, unmuted, visible, running, gesture]. */
const L = 'L';
const TABLE = [
  [0,0,0,0,0,  0,0,0,0],
  [0,0,0,0,1,  0,0,0,0],
  [0,0,0,1,0,  0,0,0,0],
  [0,0,0,1,1,  0,0,0,0],
  [0,0,1,0,0,  0,0,0,0],
  [0,0,1,0,1,  0,0,0,0],
  [0,0,1,1,0,  0,0,0,0],
  [0,0,1,1,1,  0,0,0,0],
  [0,1,0,0,0,  0,0,0,0],
  [0,1,0,0,1,  0,0,0,0],
  [0,1,0,1,0,  0,0,0,0],
  [0,1,0,1,1,  0,0,0,0],
  [0,1,1,0,0,  0,0,0,0],
  [0,1,1,0,1,  0,0,0,0],
  [0,1,1,1,0,  0,0,0,0],
  [0,1,1,1,1,  0,0,0,0],
  [1,0,0,0,0,  0,0,0,0],
  [1,0,0,0,1,  1,0,0,1],
  [1,0,0,1,0,  0,0,0,0],
  [1,0,0,1,1,  1,0,0,0],
  [1,0,1,0,0,  0,0,0,0],
  [1,0,1,0,1,  1,0,0,1],
  [1,0,1,1,0,  0,0,0,0],
  [1,0,1,1,1,  1,1,L,0],
  [1,1,0,0,0,  0,0,0,0],
  [1,1,0,0,1,  1,0,0,1],
  [1,1,0,1,0,  0,0,0,0],
  [1,1,0,1,1,  1,0,0,0],
  [1,1,1,0,0,  0,0,0,0],
  [1,1,1,0,1,  1,0,0,1],
  [1,1,1,1,0,  0,0,0,0],
  [1,1,1,1,1,  1,0,0,0]
];

const AIR_LEVEL = A.AIR_LEVEL;
ok(AIR_LEVEL === 0.28, '(a) AIR_LEVEL is the ratified 0.28 master (§5.5 / SCORE §5.1)', 'got ' + AIR_LEVEL);

/* every row evaluated, and the enumeration itself proven complete */
const rows = TABLE.map(function (r) {
  const inputs = { armed: !!r[0], muted: !!r[1], visible: !!r[2], ctxRunning: !!r[3], everGesture: !!r[4] };
  const c = call(inputs);
  return {
    inputs: inputs,
    want: { wantCtx: !!r[5], schedulerOn: !!r[6], masterLevel: r[7] === L ? AIR_LEVEL : 0, held: !!r[8] },
    got: c.ok ? c.val : { wantCtx: null, schedulerOn: null, masterLevel: null, held: null },
    threw: c.ok ? null : c.err,
    key: '' + r[0] + r[1] + r[2] + r[3] + r[4]
  };
});
{
  ok(TABLE.length === 32 && new Set(rows.map(function (r) { return r.key; })).size === 32,
    '(a) the table is the COMPLETE 2^5 enumeration — 32 distinct input rows');
  const name = function (i) {
    return (i.armed ? 'armed' : 'disarmed') + '/' + (i.muted ? 'muted' : 'unmuted') + '/'
      + (i.visible ? 'visible' : 'hidden') + '/' + (i.ctxRunning ? 'running' : 'stalled') + '/'
      + (i.everGesture ? 'gesture' : 'no-gesture');
  };
  rows.forEach(function (r) {
    const g = r.got, w = r.want;
    ok(!r.threw && g.wantCtx === w.wantCtx && g.schedulerOn === w.schedulerOn
      && Object.is(g.masterLevel, w.masterLevel) && g.held === w.held,
      '(a) row ' + r.key + ' — ' + name(r.inputs),
      r.threw ? 'airTargets THREW: ' + r.threw + ' — the policy is not pure (see check (c))'
        : 'want ' + JSON.stringify(w) + ' got ' + JSON.stringify(g));
    ok(typeof g.wantCtx === 'boolean' && typeof g.schedulerOn === 'boolean'
      && typeof g.held === 'boolean' && typeof g.masterLevel === 'number',
      '(a) row ' + r.key + ' — strict types (booleans, not truthy values)');
  });
}

/* ── (b) the named invariants, each quantified over the whole table ── */
{
  ok(rows.filter(function (r) { return !r.inputs.armed; }).every(function (r) { return !r.got.wantCtx; }),
    '(b) disarmed ⇒ never wantCtx — no AudioContext is ever wanted (B3/B8, §5.4)');

  ok(rows.filter(function (r) { return r.inputs.muted; }).every(function (r) {
    return r.got.masterLevel === 0 && !r.got.schedulerOn;
  }), '(b) muted ⇒ masterLevel 0 AND scheduler off');
  ok(rows.filter(function (r) { return r.inputs.muted && r.inputs.armed && r.inputs.everGesture; })
    .every(function (r) { return r.got.wantCtx; }),
    '(b) muted ⇒ the ctx STAYS wanted — mute is a gain gate, never a suspend (§5.3)');

  ok(rows.filter(function (r) { return !r.inputs.visible; }).every(function (r) {
    return !r.got.schedulerOn && r.got.masterLevel === 0;
  }), '(b) hidden ⇒ scheduler off AND masterLevel 0 for EVERY value of the other four inputs — a hidden-tab unmute can never sound (r4-M3)');

  ok(rows.filter(function (r) { return !r.inputs.ctxRunning; }).every(function (r) {
    return !r.got.schedulerOn;
  }), '(b) !ctxRunning ⇒ scheduler off (r4-M2)');
  ok(rows.filter(function (r) { return !r.inputs.ctxRunning; }).every(function (r) {
    return r.got.held === r.got.wantCtx;
  }), '(b) !ctxRunning ⇒ held for exactly the rows that want the ctx — the was-held guard IS the policy, not a flag a handler can forget (r4-M2)');
  ok(rows.filter(function (r) { return r.inputs.ctxRunning; }).every(function (r) { return !r.got.held; }),
    '(b) ctxRunning ⇒ never held (the §5.2 held label row is the stalled-ctx row only)');

  const sounding = rows.filter(function (r) { return r.got.masterLevel > 0; });
  ok(sounding.length === 1 && sounding[0].key === '10111',
    '(b) EXACTLY ONE of the 32 rows sounds: armed + unmuted + visible + running + gesture',
    'sounding rows: ' + sounding.map(function (r) { return r.key; }).join(' '));
  ok(rows.every(function (r) { return r.got.schedulerOn === (r.got.masterLevel > 0); }),
    '(b) scheduler and master agree on every row — the pump never runs into a silent master, and never the reverse');
}

/* ── (c) the sentinel region: pure, and exactly five inputs (r6-r3) ── */
{
  const B = CODE.indexOf('===== AIR POLICY — BEGIN =====');
  const E = CODE.indexOf('===== AIR POLICY — END =====');
  ok(B === -1 && E === -1, '(c) the AIR POLICY sentinels are COMMENTS (the mask erased them — they can never be executable)');
  const bs = SRC.indexOf('===== AIR POLICY — BEGIN =====');
  const es = SRC.indexOf('===== AIR POLICY — END =====');
  ok(bs !== -1 && es > bs, '(c) the AIR POLICY BEGIN/END sentinel region exists and is ordered');
  const region = mask(SRC.slice(bs, es), true);

  ok(!/\bctx\b|document|window\.|localStorage|sessionStorage|Date\.now|Math\.random|setInterval|setTimeout|AudioContext/.test(region),
    '(c) the policy region is PURE — no ctx / DOM / storage / clock / random / timer tokens');

  const reads = new Set();
  const rd = /\bs\.([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = rd.exec(region))) reads.add(m[1]);
  const FIVE = ['armed', 'ctxRunning', 'everGesture', 'muted', 'visible'];
  ok(FIVE.every(function (k) { return reads.has(k); }),
    '(c) the policy reads all five named inputs', 'reads ' + [...reads].sort().join(','));
  ok([...reads].sort().join(',') === FIVE.join(','),
    '(c) the policy reads EXACTLY the five named inputs and no more — the r6 layers (wind, pads) add NO policy input (r6-r3)',
    'reads ' + [...reads].sort().join(','));

  const out = call({ armed: true, muted: false, visible: true, ctxRunning: true, everGesture: true }).val || {};
  ok(Object.keys(out).sort().join(',') === 'held,masterLevel,schedulerOn,wantCtx',
    '(c) airTargets returns EXACTLY the four named outputs — the shape is unchanged by the r6 layers (r6-r3)',
    'got ' + Object.keys(out).sort().join(','));
  ok(!('wantSuspended' in out),
    '(c) no wantSuspended axis — the platform suspends, the air never does (§5.5 / r1-m4)');
}

/* ── (d) the ws:pref:air write sites + no new ws: keys ── */
{
  const WRITE = "localStorage.setItem('ws:pref:air'";
  ok(count(CODE, WRITE) === 2,
    '(d) the ws:pref:air write expression appears EXACTLY twice', 'got ' + count(CODE, WRITE));

  const arm = bodyOf(CODE, /A\.arm\s*=\s*function\s*\(/);
  const disarm = bodyOf(CODE, /A\.disarm\s*=\s*function\s*\(/);
  ok(!!arm && !!disarm, '(d) the arm and disarm click paths are both present');
  ok(arm && count(arm.text, WRITE) === 1,
    '(d) the arm click path writes ws:pref:air exactly once', 'got ' + (arm && count(arm.text, WRITE)));
  ok(disarm && count(disarm.text, WRITE) === 1,
    '(d) the disarm click path writes ws:pref:air exactly once', 'got ' + (disarm && count(disarm.text, WRITE)));
  ok(arm && disarm && count(arm.text, WRITE) + count(disarm.text, WRITE) === count(CODE, WRITE),
    '(d) EVERY ws:pref:air write is inside a click path — written only inside the visitor’s own arm/disarm click (§5.3)');

  const keys = new Set();
  const kr = /['"](ws:[^'"]*)['"]/g;
  let m;
  while ((m = kr.exec(CODE))) keys.add(m[1]);
  ok([...keys].join(',') === 'ws:pref:air',
    '(d) air.js touches EXACTLY one ws: key — ws:pref:air; the r6 layers add NO new key (r6-r3; mute rides WS.muted()/onMuteChange, never a key of ours)',
    'keys: ' + [...keys].sort().join(' '));
}

/* ── (e) the air never suspends the ctx ── */
{
  ok(!/suspend/.test(BARE),
    '(e) no ctx.suspend token in executable code — the air never suspends the shared ctx (§5.5, B8)');
  ok(/suspend/.test(SRC),
    '(e) sanity: "suspend" DOES appear in air.js prose — so check (e) is masking, not missing the file');
}

/* ── (f) the statechange bracket ── */
{
  const ADD = "addEventListener('statechange'";
  const REM = "removeEventListener('statechange'";
  ok(count(CODE, ADD) === 1, '(f) addEventListener(statechange appears exactly once (the ONE detector site)', 'got ' + count(CODE, ADD));
  ok(count(CODE, REM) === 1, '(f) removeEventListener(statechange appears exactly once (the ONE removal site)', 'got ' + count(CODE, REM));

  /* reachability, one hop: the site sits in a helper the path calls (air.js
     seats them in watch()/unwatch()) — or directly in the path's own body. */
  const reach = function (bodyRe, site, what) {
    const body = bodyOf(CODE, bodyRe);
    if (!body) return { hit: false, via: 'path not found' };
    const idx = CODE.indexOf(site);
    if (idx > body.open && idx < body.close) return { hit: true, via: 'inline' };
    const host = enclosing(CODE, idx);
    if (!host) return { hit: false, via: 'site is not inside any named function' };
    return { hit: new RegExp('\\b' + host + '\\s*\\(').test(body.text), via: host + '()' };
  };
  const a = reach(/A\.arm\s*=\s*function\s*\(/, ADD, 'arm');
  ok(a.hit, '(f) the statechange detector is installed by the ARM path — via ' + a.via + ' (r3-F2)', a.via);
  const d = reach(/A\.disarm\s*=\s*function\s*\(/, REM, 'disarm');
  ok(d.hit, '(f) the statechange detector is removed by the DISARM path — via ' + d.via + ' — the detector is lifecycle-bracketed (r3-F2)', d.via);
}

/* ── (g) the single pump-start site + the three handlers ── */
{
  ok(count(BARE, 'setInterval') === 1,
    '(g) setInterval appears EXACTLY once in air.js — one pump-start site (r4-M3)', 'got ' + count(BARE, 'setInterval'));

  const idx = BARE.indexOf('setInterval');
  ok(enclosing(CODE, idx) === 'applyAir',
    '(g) the pump-start site sits inside applyAir — THE reconciler owns every pump decision (§8.3 / r4-M2)',
    'enclosing function: ' + enclosing(CODE, idx));

  /* the rising edge itself: the `if (schedulerOn && !timer)` block that guards
     the one site — edge-triggered, so a handler firing while the pump already
     runs never restarts it and never re-derives the epoch (r4-M2). */
  const body = bodyOf(CODE, /function\s+applyAir\s*\(/);
  let edge = null;
  if (body) {
    const re = /if\s*\(([^)]*)\)/g;
    let m;
    while ((m = re.exec(body.text))) {
      if (/schedulerOn/.test(m[1]) && /!\s*timer/.test(m[1])) {
        const b = block(body.text, m.index + m[0].length - 1);
        if (b) { edge = { cond: m[1], from: body.open + b[0], to: body.open + b[1] }; break; }
      }
    }
  }
  ok(!!edge, '(g) applyAir carries a rising-edge guard on schedulerOn AND !timer');
  ok(edge && idx > edge.from && idx < edge.to,
    '(g) the ONE setInterval sits INSIDE that rising-edge block — pump start is edge-triggered and idempotent (r4-M2)',
    edge ? 'guard: if (' + edge.cond.trim() + ')' : 'no edge guard found');

  /* the three subscribed handlers each route through applyAir (r4-M3) */
  const CALL = /\bapplyAir\s*\(/;

  const mute = bodyOf(CODE, /onMuteChange\s*\(\s*function\s*\(/);
  ok(!!mute && CALL.test(mute.text),
    '(g) the onMuteChange handler calls applyAir — a cross-tab unmute in a HIDDEN tab recomputes schedulerOn = false and stays silent (r4-M3)');

  const handlerFor = function (varName) {
    const re = new RegExp('\\b' + varName + '\\s*=\\s*function\\s*\\(', 'g');
    const bodies = [];
    let m;
    while ((m = re.exec(CODE))) {
      const b = block(CODE, m.index + m[0].length - 1);
      if (b) bodies.push(CODE.slice(b[0], b[1] + 1));
    }
    return bodies;
  };
  [['onVis', 'visibilitychange'], ['onState', 'statechange']].forEach(function (h) {
    const bodies = handlerFor(h[0]);
    ok(bodies.length >= 1 && bodies.every(function (b) { return CALL.test(b); }),
      '(g) EVERY ' + h[1] + ' handler body (' + h[0] + ', ' + bodies.length + ' assigned) calls applyAir (r4-M3)');
    const reg = new RegExp("addEventListener\\s*\\(\\s*'" + h[1] + "'\\s*,\\s*" + h[0] + "\\s*\\)");
    ok(reg.test(CODE),
      '(g) the ' + h[1] + ' listener registers ' + h[0] + ' itself — the asserted body IS the subscribed handler');
  });
}

/* ── (h) THE PRECOMPUTE-LIVE TOOTH — the silent half, driven (r15.5) ─────────
   Checks (a)–(g) are STATIC — none exercises compose()/precompose()/cross(),
   which is exactly why the arity bug survived them. This tooth ARMS a fresh
   air.js against a stub page (a fake AudioContext + the on-page cores Calendar /
   Hours / composeHour), advances the WebAudio clock across an hour boundary, and
   asserts the crossing itself:
     LOUD half  — arm() completes: compose() injects the on-page Hours core
                  (air.js:100). A 4-arg momentManifest call throws TypeError here.
     SILENT half— after precompose() at > 3540 s the pre-composed `derived` is
                  NON-NULL (momentManifest accepted the injected Hours at
                  air.js:262, so composeHour ran), and at the boundary cross()
                  takes its FAST path — the pre-composed bucket, NO synchronous
                  compose(). A patch of only the loud site leaves `derived` null
                  forever and cross() falls to a synchronous whole-hour recompose;
                  this tooth catches that.
   The stub momentManifest reads H.ESTATE.latDeg exactly as the real core does
   (calendar.js:208), so a reverted arity fix at either site trips the tooth.
   Self-arming: a twin run with Calendar.nextHour sabotaged forces `derived` null
   and proves the boundary then DOES take the slow (compose) path — so the
   fast-path assertion is a real discriminator, not a vacuous pass. */
{
  const AIR_PATH = require.resolve('./air.js');
  function freshAir() { delete require.cache[AIR_PATH]; return require(AIR_PATH); }

  function makeWorld() {
    const G = globalThis;
    const names = ['AudioContext', 'webkitAudioContext', '__wsAudioCtx', 'Calendar',
      'Hours', 'composeHour', 'airMoment', 'armResponse', 'figureOf', 'WS',
      'document', 'localStorage', '__AIR__', 'setInterval', 'clearInterval', 'setTimeout'];
    const saved = {};
    names.forEach(function (n) { saved[n] = Object.getOwnPropertyDescriptor(G, n); });

    const s = { time: 0, composeHours: 0, captured: null, moment: null, sabotageNext: false };

    function gainNode() {
      const g = { value: 1, setValueAtTime: function () {}, linearRampToValueAtTime: function () {},
        cancelScheduledValues: function () {}, setValueCurveAtTime: function () {} };
      return { gain: g, connect: function () {}, disconnect: function () {} };
    }
    function makeCtx() {
      return {
        sampleRate: 48000, state: 'running', destination: {},
        get currentTime() { return s.time; },
        createGain: gainNode,
        createBuffer: function (ch, n) { return { getChannelData: function () { return new Float32Array(n); } }; },
        createBufferSource: function () { return { connect: function () {}, disconnect: function () {}, start: function () {}, stop: function () {} }; },
        addEventListener: function () {}, removeEventListener: function () {},
        resume: function () { return { catch: function () {} }; }
      };
    }

    G.AudioContext = function () { return makeCtx(); };   // arm does `new AC()`
    G.webkitAudioContext = undefined;
    G.__wsAudioCtx = undefined;
    G.__AIR__ = undefined;
    G.Calendar = {
      momentManifest: function (y, m, d, hour, H) {
        const lat = H.ESTATE.latDeg;   // binds the arity fix: throws if H is missing
        return { y: y, m: m, d: d, hour: hour, seed: 1, annTier: 0, dateInt: 1, lat: lat };
      },
      nextHour: function (y, mo, d, hour) {
        if (s.sabotageNext) throw new Error('nextHour sabotaged (self-arming control)');
        return { y: y, m: mo, d: d, hour: hour + 1 };
      },
      hash2: function (a, b) { return (a ^ b) >>> 0; },
      mulberry32: function () { return function () { return 0; }; }
    };
    G.Hours = { ESTATE: { latDeg: 51.5 } };
    G.composeHour = function () { s.composeHours++; return { events: [] }; };
    G.airMoment = function () { return s.moment; };
    G.armResponse = function () { return []; };
    G.figureOf = function () { return 'P4'; };
    G.WS = { muted: function () { return false; }, onMuteChange: function () {} };
    G.document = { visibilityState: 'visible', addEventListener: function () {}, removeEventListener: function () {} };
    G.localStorage = { getItem: function () { return null; }, setItem: function () {} };
    G.setInterval = function (fn) { s.captured = fn; return 1; };
    G.clearInterval = function () {};
    G.setTimeout = function () { return 0; };

    return {
      s: s,
      restore: function () {
        names.forEach(function (n) {
          if (saved[n]) Object.defineProperty(G, n, saved[n]); else { try { delete G[n]; } catch (e) {} }
        });
      }
    };
  }

  /* arm a fresh conductor, then drive two ticks: one at > 3540 s (precompose),
     one at >= 3600 s with the moment advanced to the next hour (the crossing). */
  function drive(sabotage) {
    const w = makeWorld(), s = w.s;
    let armErr = null, afterArm = 0, afterPre = 0, afterCross = 0, bucket = null, tick = null;
    try {
      const air = freshAir();
      s.time = 0;
      s.moment = { y: 2026, m: 3, d: 21, hour: 10, min: 0, sec: 0, hourPinned: false, dateInt: 1 };
      try { air.arm(); } catch (e) { armErr = e; }
      afterArm = s.composeHours;
      tick = s.captured;
      s.sabotageNext = sabotage;
      s.time = 3541;                       // > 3540 s, < 3600 s: precompose only
      if (tick) tick();
      afterPre = s.composeHours;
      s.time = 3601;                       // >= 3600 s: the crossing
      s.moment = { y: 2026, m: 3, d: 21, hour: 11, min: 0, sec: 0, hourPinned: false, dateInt: 1 };
      if (tick) tick();
      afterCross = s.composeHours;
      bucket = air.state().bucket;
    } finally { w.restore(); }
    return { armErr: armErr, afterArm: afterArm, afterPre: afterPre, afterCross: afterCross,
      bucket: bucket, tick: !!tick };
  }

  const good = drive(false);
  const bad = drive(true);

  ok(!good.armErr, '(h) LOUD half: arm() completes — compose() injects the on-page Hours core (air.js:100); a 4-arg momentManifest would throw TypeError here',
    good.armErr ? String((good.armErr && good.armErr.message) || good.armErr) : '');
  ok(good.tick, '(h) the pump installed a tick (setInterval captured) — the crossing is drivable');
  ok(good.afterArm === 1, '(h) arm() composed the current hour exactly once', 'composeHour calls after arm: ' + good.afterArm);
  ok(good.afterPre === good.afterArm + 1,
    '(h) SILENT half: precompose() built `derived` at > 3540 s — momentManifest accepted the injected Hours (air.js:262) and composeHour ran',
    'composeHour after precompose: ' + good.afterPre + ' (want ' + (good.afterArm + 1) + ')');
  ok(good.afterCross === good.afterPre,
    '(h) SILENT half: at the boundary cross() took its FAST path — the pre-composed bucket, NO synchronous compose()',
    'synchronous composeHour at the boundary: ' + (good.afterCross - good.afterPre) + ' (want 0)');
  ok(good.bucket && good.bucket.hour === 11,
    '(h) the crossing advanced the live bucket to the next hour via `derived` — proving derived was NON-NULL and consumed',
    'bucket: ' + JSON.stringify(good.bucket));

  ok(!bad.armErr, '(h) self-arm control: arm() still completes — the sabotage touches only precompose’s nextHour');
  ok(bad.afterPre === bad.afterArm,
    '(h) self-arm control: with nextHour sabotaged, precompose() failed to build derived (no composeHour)',
    'composeHour after precompose: ' + bad.afterPre + ' (want ' + bad.afterArm + ')');
  ok(bad.afterCross === bad.afterPre + 1,
    '(h) self-arm control: derived null ⇒ cross() DID fall to the slow synchronous compose() at the boundary — so the fast-path assertion above is a real discriminator, not a vacuous pass',
    'synchronous composeHour at the boundary: ' + (bad.afterCross - bad.afterPre) + ' (want 1)');
}

/* ── report ── */
const total = pass + fail;
console.log('air policy twin: ' + pass + '/' + total + ' PASS' + (fail ? ' — ' + fail + ' FAILED' : ''));
if (fail) process.exitCode = 1;
