#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   acts.test.mjs — THE GRAND TOUR ACTS, asserted against the LIVE RENDERED PAGE.
   (WS2 · DESIGN §4 beats API · Appendix A act briefs · T2.5 acts 1 + T2.6 acts 2
    + T2.7 acts 3.)

   WHAT IT PROVES: the two W2 "acts 1" stop performances actually DO something on the
   real page, driven through the page's OWN entry functions (the liveness-twin rule,
   DESIGNING.md: call the real fire/crank the control invokes — NEVER synthesize canvas
   pointer events). A headless browser loads each forged page, calls its real
   `window.__tourAct(ctx)` (and, for the Showing, `window.__tourHooks.fire()`), and reads
   the page's OWN readout to assert the payoff state changed:

     cavern/double-slit — the fringe-accumulation counter (#roCount = particles landed):
       DS1  __tourAct + __tourHooks.fire are both present (the act + the Showing impulse).
       DS2  reduced act fires the instant-accumulate batch → the counter GROWS from 0.
       DS3  a SECOND reduced act GROWS it further — the act never clears the visitor's
            pattern (no clearDots): the count is monotonic, never reset.
       DS4  __tourHooks.fire() (the Showing's IMPULSE poke) fires a volley → after the
            fly-in lands, the counter has GROWN (the real animated fire path).
       DS5  on a FRESH load the NON-REDUCED act (the real visitor path, beats-paced) fires
            modest animated volleys → after they land, the counter has GROWN from 0.

     benford-mill — the milling-pass counter (#rPasses) + the pre-warmed grain budget:
       BM1  the pre-warmed staircase is present (rPasses ≥ 28 pre-warm passes, 1,500 grains)
            and benford does NOT define __tourHooks (only double-slit needs the Showing hook).
       BM2  reduced act cranks exactly ONE pass (rPasses → +1) and never refills (rGrains
            unchanged = the pre-warmed tableau is intact).
       BM3  on a FRESH load the NON-REDUCED act cranks many passes (rPasses grows well past
            the pre-warm) while rGrains stays 1,500 — grains flow, the tableau is never cleared.

     the-three-doors — the honest tally gauge (#gv-sw reads "wins/rounds"):
       TD1  __tourAct is present; __tourHooks is undefined (three-doors is not a Showing stop).
       TD2  the reduced act plays ONE full round through the real pick/reveal/switch entry
            functions → the rounds tally goes 0 → 1 (the caption's "I played one round for
            you") AND the board resets to a fresh pick (#choice cleared) for the visitor.
       TD3  a SECOND reduced act adds another counted round (0→1→2) — the demonstrated round
            only ever ADDS to the honest tally, never clears it (re-entrant, monotonic).
       TD4  on a FRESH load the NON-REDUCED beats-paced act plays one counted round the same
            way → tally 0 → 1 and the board is reset.

     the-coin-that-lies — the page's own lens hook (weighings used + surviving cases):
       CT1  __tourAct present; __tourHooks undefined; a pristine board (weighed 0, 24 cases).
       CT2  the NON-REDUCED act stages the canonical 4-v-4 first weighing via placeCoin +
            onRelease → after the beam settles + prunes, weighed 0→1 and the field is cut to
            a THIRD (24 → 8 cases) — one legal weighing, never solved further.
       CT3  a SECOND act call on the already-weighed board is a NO-OP (weighed stays 1, cases
            stay 8) — the act only ever stages the FIRST weighing (re-entrant guard).
       CT4  on a FRESH load the reduced act stages the first weighing the same way (0→1, 24→8).

     the-rewind-shelf — the verdict tally (#tallyG returned-clean / #tallyR kept-the-arrow):
       RS1  __tourAct is present; __tourHooks is undefined (rewind-shelf is not a Showing stop).
       RS2  the reduced act runs one forward-then-back pass through the REAL nudge + master-
            rewind entry functions → every card lands a verdict (clean + arrow == cards on the
            shelf) and the clean/arrow split EQUALS the page's own well-formedness twin
            (window.__rewindShelf.clean/.arrow) — the demonstrated verdict matches the theorem.
       RS3  a 2nd act call re-runs cleanly (re-entrant: it resets to a pristine shelf, then
            re-derives the SAME honest split).
       RS4  on a FRESH load the NON-REDUCED beats-paced act flips every card the same way.

     the-barrel-house/pin-barrel — the transport clock φ = phiAbs (STEPS=48; a half turn ≈ 24):
       PB1  __tourAct present; __tourHooks.crank present (the STATE poke); the barrel loads at
            rest (φ ≈ 0 — no auto-spin).
       PB2  the reduced act steps the barrel ~half a turn (φ → ≈24) through the REAL crankBy,
            then HOLDS — read again 600ms later, φ is unchanged (no flywheel, never spinning).
       PB3  on a FRESH load the NON-REDUCED walking-tempo act cranks 0 → ≈24, then HOLDS.
       PB4  window.__tourHooks.crank(x) is an idempotent crank-TO-position (STATE class):
            crank(30) → φ=30; a repeat crank(30) moves nothing (crankBy(0) no-op).
       (The transport is silenced for the act's life — pluck is stubbed → visual-only crank —
        so the act plays no audio; silence is enforced by construction, not asserted here.)

     the-errand — the Showing's `go` IMPULSE hook (WS2 T4.4; the-errand is NOT a tour stop —
     it carries the ONE hook, no docent). App.go() is the GO lever's real click entry; the
     page's OWN deterministic test-hook App._pump(n) advances the live fixed-timestep marble
     run synchronously, so we read the honest result off the live world (App._debug().world):
       ER1  __tourHooks.go present; __tourAct undefined (not a tour stop); bench at rest (BUILD).
       ER2  __tourHooks.go() drives the REAL go() → BUILD→WATCH, then pumping the live sim to
            the end reaches DONE with result.hit === true (the marble kept its promise —
            reached the payoff), stepIndex climbed past 0.
       ER3  a 2nd go() poke (IMPULSE is forward-fire, re-armable) restarts from DONE → WATCH
            and delivers again (DONE, hit) — re-entrant, never wedges the bench.

   Run:  node tools/tour/acts.test.mjs   (exit 0 = all pass, 1 = a check failed,
         2 = harness could not run — agent-browser missing / server / forge error).

   Requires: agent-browser on PATH + a free TCP port. Forges the two pages, serves the repo
   root on an uncommon port (a SEPARATE detached python3 child — never an in-process server,
   which would deadlock the blocking spawnSync calls), runs a uniquely-named headless session,
   and tears down exactly what it started. Sibling to tools/layout/gate-dom.test.mjs.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8771;                          // an uncommon port we own + tear down
const SESSION = 'acts-test-t25-tour';       // a uniquely-named session we close at the end
const BASE = `http://127.0.0.1:${PORT}`;
const URL_DS = `${BASE}/cavern/double-slit/index.html`;
const URL_BM = `${BASE}/benford-mill/index.html`;
const URL_TD = `${BASE}/the-three-doors/index.html`;
const URL_CO = `${BASE}/the-coin-that-lies/index.html`;
const URL_RS = `${BASE}/the-rewind-shelf/index.html`;
const URL_PB = `${BASE}/the-barrel-house/pin-barrel/index.html`;
const URL_ER = `${BASE}/the-errand/index.html`;

const AB_ENV = { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: '20000' };
const CALL_TIMEOUT = 40000;
function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', cwd: ROOT, timeout: CALL_TIMEOUT, env: AB_ENV, ...opts });
}
function haveAgentBrowser() {
  const r = sh('agent-browser', ['--version'], { timeout: 8000 });
  return r.status === 0 || (r.stdout || '').length > 0;
}
/* run an agent-browser eval; the page expression must return a JSON string, which we parse. */
function abEval(expr) {
  const r = sh('agent-browser', ['--session', SESSION, 'eval', '--stdin'], { input: expr });
  if (r.status !== 0) throw new Error('agent-browser eval failed (status ' + r.status + '): ' + (r.stderr || r.stdout || r.error));
  const out = (r.stdout || '').trim();
  const m = out.match(/"((?:[^"\\]|\\.)*)"/s);
  let payload = m ? JSON.parse('"' + m[1] + '"') : out;
  try { return JSON.parse(payload); } catch (_) { return payload; }
}
function ab(...args) { return sh('agent-browser', ['--session', SESSION, ...args]); }
function waitPort(port, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      const s = net.connect(port, '127.0.0.1');
      s.once('connect', () => { s.destroy(); resolve(); });
      s.once('error', () => { s.destroy(); if (Date.now() > deadline) reject(new Error('server never came up on :' + port)); else setTimeout(tryOnce, 150); });
    })();
  });
}

let fail = 0;
function check(name, ok, detail) {
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fail++;
}

/* ── page readers (return a plain object via a JSON round-trip) ─────────────────
   #roCount / #rPasses / #rGrains are the pages' OWN readouts — reading them proves
   the payoff moved on the real page, not in a stubbed model. */
function readInt(id) {
  return abEval(`(function(){
    var el=document.getElementById(${JSON.stringify(id)});
    var raw = el ? el.textContent : '';
    return JSON.stringify({ raw: raw, n: parseInt(String(raw).replace(/[^0-9-]/g,''),10) });
  })()`);
}
/* call the reduced act (its body is synchronous up to `return`, so the payoff has already
   moved by the time the resolved promise is returned) and read the counter before + after. */
function runReducedAct(id) {
  return abEval(`(function(){
    var el=document.getElementById(${JSON.stringify(id)});
    function v(){ return parseInt(String(el?el.textContent:'').replace(/[^0-9-]/g,''),10); }
    var before = v();
    window.__tourAct({ reduced: true });
    var after = v();
    return JSON.stringify({ before: before, after: after });
  })()`);
}
/* kick off the NON-REDUCED act (fire-and-forget: it awaits beats via setTimeout while we
   wait outside). Returns immediately with a resolved-synchronously flag. */
function kickLiveAct() {
  return abEval(`(function(){
    var p = window.__tourAct({ reduced: false,
      beat: function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); } });
    return JSON.stringify({ kicked: true, isPromise: !!(p && typeof p.then === 'function') });
  })()`);
}
function surfaces() {
  return abEval(`(function(){
    return JSON.stringify({
      act: typeof window.__tourAct,
      hooks: typeof window.__tourHooks,
      fire: (window.__tourHooks && typeof window.__tourHooks.fire) || 'absent'
    });
  })()`);
}
function fireImpulse() {
  return abEval(`(function(){
    var el=document.getElementById('roCount');
    var before = parseInt(String(el?el.textContent:'').replace(/[^0-9-]/g,''),10);
    window.__tourHooks.fire();
    return JSON.stringify({ before: before });
  })()`);
}
/* kick the act with an explicit reduced flag + a real (setTimeout) beat so its internal
   awaits resolve while we wait outside. (kickLiveAct === kickAct(false).) */
function kickAct(reduced) {
  return abEval(`(function(){
    var p = window.__tourAct({ reduced: ${reduced ? 'true' : 'false'},
      beat: function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); } });
    return JSON.stringify({ kicked: true, isPromise: !!(p && typeof p.then === 'function') });
  })()`);
}
/* three-doors: the switch gauge (#gv-sw) reads "wins/rounds"; return the rounds denominator. */
function readTallyN() {
  return abEval(`(function(){
    var el=document.getElementById('gv-sw');
    var raw = el ? String(el.textContent) : '';
    var parts = raw.split('/');
    return JSON.stringify({ raw: raw, n: parseInt(parts.length>1?parts[1]:parts[0],10) });
  })()`);
}
/* three-doors: #choice is emptied by startRound — an empty string means the board is a fresh pick. */
function choiceHtml() {
  return abEval(`(function(){
    var el=document.getElementById('choice');
    return JSON.stringify({ html: el ? el.innerHTML.trim() : null });
  })()`);
}
/* the-coin-that-lies: the page's own lens hook — weighings used + surviving cases. */
function coinState() {
  return abEval(`(function(){
    var c = window.__coinThatLies || {};
    return JSON.stringify({
      weighed: (typeof c.weighed === 'function') ? c.weighed() : null,
      survivors: (typeof c.survivors === 'function') ? c.survivors().length : null
    });
  })()`);
}
/* poll a three-doors act to completion: the tally reached >= minN AND the board was reset. */
function pollBoardReset(minN, maxMs) {
  const start = Date.now();
  let t = readTallyN(), c = choiceHtml();
  while (!(t.n >= minN && c.html === '') && Date.now() - start < maxMs) {
    ab('wait', '250'); t = readTallyN(); c = choiceHtml();
  }
  return { n: t.n, choice: c.html };
}
/* poll a coin act to completion. weighed++ happens synchronously in doPrune, but survivors is
   reassigned in the lane-draw done-callback (~520ms later), so wait for BOTH: weighed reached
   the target AND the prune finished settling (survivors dropped below the full 24-case field). */
function pollCoinWeighed(target, maxMs) {
  const start = Date.now();
  let st = coinState();
  while (!(st.weighed === target && st.survivors !== null && st.survivors < 24) && Date.now() - start < maxMs) {
    ab('wait', '250'); st = coinState();
  }
  return st;
}
/* the-rewind-shelf: the verdict tally (#tallyG clean / #tallyR arrow) + the page's
   own well-formedness handle (window.__rewindShelf.clean/.arrow give the ground-truth
   split the forward-then-back pass must reproduce). */
function rewindState() {
  return abEval(`(function(){
    function iv(el){ return el ? (parseInt(String(el.textContent).replace(/[^0-9-]/g,''),10)||0) : 0; }
    var tw = window.__rewindShelf || {};
    return JSON.stringify({
      g: iv(document.getElementById('tallyG')),
      r: iv(document.getElementById('tallyR')),
      total: iv(document.getElementById('tallyN')),
      clean: (tw.clean||[]).length, arrow: (tw.arrow||[]).length,
      act: typeof window.__tourAct, hooks: typeof window.__tourHooks
    });
  })()`);
}
/* poll a rewind act to completion: every card has landed a verdict (clean + arrow == total). */
function pollRewind(total, maxMs) {
  const start = Date.now();
  let st = rewindState();
  while (!(st.g + st.r >= total) && Date.now() - start < maxMs) { ab('wait', '300'); st = rewindState(); }
  return st;
}
/* the-barrel-house/pin-barrel: the transport clock φ (phiAbs) read through the STATE
   hook's no-arg form (window.__tourHooks.crank() moves nothing, returns phiAbs). */
function barrelState() {
  return abEval(`(function(){
    var h = window.__tourHooks;
    var pos = (h && typeof h.crank === 'function') ? h.crank() : null;
    return JSON.stringify({
      act: typeof window.__tourAct, hooks: typeof window.__tourHooks,
      crank: (h && typeof h.crank) || 'absent', phiAbs: pos
    });
  })()`);
}
/* drive the STATE poke: read φ (before), crank TO an absolute position, return both. */
function crankTo(toPhi) {
  return abEval(`(function(){
    var before = window.__tourHooks.crank();
    var ret = window.__tourHooks.crank(${JSON.stringify(toPhi)});
    return JSON.stringify({ before: before, ret: ret });
  })()`);
}
/* poll a crank act to completion: the transport reached at least minPhi. */
function pollBarrel(minPhi, maxMs) {
  const start = Date.now();
  let st = barrelState();
  while (!(st.phiAbs !== null && st.phiAbs >= minPhi) && Date.now() - start < maxMs) { ab('wait', '300'); st = barrelState(); }
  return st;
}
/* the-errand: the Showing's go IMPULSE hook (window.__tourHooks.go, T4.4). the-errand is
   NOT a tour stop → __tourAct is undefined. App.mode() is BUILD / WATCH / DONE. */
function errandSurfaces() {
  return abEval(`(function(){
    var h = window.__tourHooks; var A = window.App || {};
    return JSON.stringify({
      act: typeof window.__tourAct,
      hooks: typeof window.__tourHooks,
      go: (h && typeof h.go) || 'absent',
      mode: (typeof A.mode === 'function') ? A.mode() : null
    });
  })()`);
}
/* poke the go hook (the REAL go() the GO lever fires), then drive the live fixed-timestep
   marble run to its end with the page's OWN deterministic test-hook App._pump(n) — pumping
   in chunks until the run leaves WATCH (lands = DONE) or a hard cap — and read the honest
   result off the live world. */
function pokeGoRun() {
  return abEval(`(function(){
    var A = window.App, h = window.__tourHooks;
    function mode(){ return (typeof A.mode==='function') ? A.mode() : null; }
    var m0 = mode();
    var ret = h.go();                                /* IMPULSE poke -> real go() */
    var mWatch = mode();
    var pumped = 0, MAXP = 4000;
    while (pumped < MAXP && mode() === 'WATCH') { A._pump(25); pumped += 25; }
    var w = (typeof A._debug==='function') ? A._debug().world : null;
    return JSON.stringify({
      m0: m0, ret: ret, mWatch: mWatch, mEnd: mode(),
      hit: (w && w.result) ? !!w.result.hit : null,
      stepIndex: w ? w.stepIndex : null, pumped: pumped
    });
  })()`);
}

async function main() {
  console.log('acts.test — THE GRAND TOUR ACTS (§4): the LIVE RENDERED PAGE, headless, REAL entry functions\n');

  if (!haveAgentBrowser()) {
    console.error('  ⚠ agent-browser not on PATH — cannot run the act-liveness twin.');
    process.exit(2);
  }

  // 1. FORGE the four act pages (test the built artifact, not the source).
  const SRCS = ['cavern/double-slit/index.src.html', 'benford-mill/index.src.html',
                'the-three-doors/index.src.html', 'the-coin-that-lies/index.src.html',
                'the-rewind-shelf/index.src.html', 'the-barrel-house/pin-barrel/index.src.html',
                'the-errand/index.src.html'];
  for (const src of SRCS) {
    const f = sh('node', ['tools/forge/forge.mjs', src]);
    if (f.status !== 0) { console.error('  ⚠ forge failed for ' + src + ':\n' + f.stderr); process.exit(2); }
  }
  for (const p of ['cavern/double-slit/index.html', 'benford-mill/index.html',
                   'the-three-doors/index.html', 'the-coin-that-lies/index.html',
                   'the-rewind-shelf/index.html', 'the-barrel-house/pin-barrel/index.html',
                   'the-errand/index.html']) {
    if (!existsSync(path.join(ROOT, p))) { console.error('  ⚠ a forged page is missing: ' + p); process.exit(2); }
  }

  // 2. SERVE the repo root on our uncommon port — a SEPARATE detached child.
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore', detached: false });
  try { await waitPort(PORT, 10000); }
  catch (e) { try { server.kill('SIGKILL'); } catch (_) {} console.error('  ⚠ ' + e.message); process.exit(2); }

  try {
    // ═══ THE DOUBLE SLIT — fire volley act + the Showing's fire hook ═══
    console.log('cavern/double-slit — the fringe-accumulation counter (#roCount):');
    ab('open', URL_DS); ab('wait', '--load', 'networkidle'); ab('wait', '1500');

    const s = surfaces();
    check('DS1 act + Showing fire hook both present', s.act === 'function' && s.fire === 'function',
      '__tourAct=' + s.act + ' · __tourHooks.fire=' + s.fire);

    const r1 = runReducedAct('roCount');
    check('DS2 reduced act grows the counter from 0', r1.before === 0 && r1.after > r1.before,
      r1.before + ' → ' + r1.after + ' particles');

    const r2 = runReducedAct('roCount');
    check('DS3 a 2nd reduced act grows further (never resets the pattern)',
      r2.before === r1.after && r2.after > r2.before,
      r2.before + ' → ' + r2.after + ' (monotonic — no clearDots)');

    const imp = fireImpulse(); ab('wait', '1600');   // let the animated volley land
    const afterImp = readInt('roCount');
    check('DS4 __tourHooks.fire() volley lands → counter grows', afterImp.n > imp.before,
      imp.before + ' → ' + afterImp.n + ' after the fly-in');

    // fresh load → clean baseline for the real (non-reduced, beats-paced) visitor path
    ab('open', URL_DS); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    const base = readInt('roCount');
    kickLiveAct(); ab('wait', '8000');                // 9 volleys × ~650ms + fly-in landing
    const live = readInt('roCount');
    check('DS5 non-reduced act fires animated volleys → counter grows from 0',
      base.n === 0 && live.n > 0, base.n + ' → ' + live.n + ' particles (beats-paced volleys)');

    // ═══ THE BENFORD MILL — crank act, pre-warmed staircase preserved ═══
    console.log('\nbenford-mill — the milling-pass counter (#rPasses) + the pre-warmed grain budget:');
    ab('open', URL_BM); ab('wait', '--load', 'networkidle'); ab('wait', '1500');

    const bp = readInt('rPasses'); const bg = readInt('rGrains'); const bs = surfaces();
    check('BM1 pre-warmed tableau present; no __tourHooks (double-slit only)',
      bp.n >= 28 && bg.n === 1500 && bs.act === 'function' && bs.hooks === 'undefined',
      bp.n + ' passes · ' + bg.n + ' grains · __tourAct=' + bs.act + ' · __tourHooks=' + bs.hooks);

    const br = runReducedAct('rPasses'); const bgAfter = readInt('rGrains');
    check('BM2 reduced act cranks exactly one pass; never refills',
      br.after === br.before + 1 && bgAfter.n === 1500,
      'passes ' + br.before + ' → ' + br.after + ' · grains still ' + bgAfter.n);

    // fresh load → clean baseline for the real (non-reduced) crank run
    ab('open', URL_BM); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    const bpBase = readInt('rPasses');
    kickLiveAct(); ab('wait', '8500');                // 14 cranks × ~500ms
    const bpLive = readInt('rPasses'); const bgLive = readInt('rGrains');
    check('BM3 non-reduced act cranks many passes; grains never cleared',
      bpLive.n >= bpBase.n + 8 && bgLive.n === 1500,
      'passes ' + bpBase.n + ' → ' + bpLive.n + ' · grains still ' + bgLive.n);

    // ═══ THE THREE DOORS — one demonstrated round via the real pick/reveal/switch fns ═══
    console.log('\nthe-three-doors — the honest tally (#gv-sw) + a fresh board after the demonstrated round:');
    ab('open', URL_TD); ab('wait', '--load', 'networkidle'); ab('wait', '1200');

    const tds = surfaces();
    check('TD1 act present; no __tourHooks (three-doors is not a Showing stop)',
      tds.act === 'function' && tds.hooks === 'undefined',
      '__tourAct=' + tds.act + ' · __tourHooks=' + tds.hooks);

    const td0 = readTallyN();
    kickAct(true);
    const td1 = pollBoardReset(1, 6000);
    check('TD2 reduced act plays one counted round → tally 0→1, board reset',
      td0.n === 0 && td1.n === 1 && td1.choice === '',
      'rounds ' + td0.n + ' → ' + td1.n + ' · #choice=' + JSON.stringify(td1.choice));

    kickAct(true);
    const td2 = pollBoardReset(2, 6000);
    check('TD3 a 2nd reduced act grows the tally further (never clears it)',
      td2.n === 2 && td2.choice === '', 'rounds ' + td1.n + ' → ' + td2.n + ' (monotonic)');

    // fresh load → the real (non-reduced, beats-paced) visitor path
    ab('open', URL_TD); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    const tdb = readTallyN();
    kickAct(false);
    const tdl = pollBoardReset(1, 9000);
    check('TD4 non-reduced beats-paced act plays one counted round → tally 0→1, board reset',
      tdb.n === 0 && tdl.n === 1 && tdl.choice === '',
      'rounds ' + tdb.n + ' → ' + tdl.n + ' · #choice=' + JSON.stringify(tdl.choice));

    // ═══ THE COIN THAT LIES — the canonical 4-v-4 first weighing via placeCoin + onRelease ═══
    console.log('\nthe-coin-that-lies — the first weighing cuts the field to a third (weighed 0→1, 24→8 cases):');
    ab('open', URL_CO); ab('wait', '--load', 'networkidle'); ab('wait', '1500');

    const cos = surfaces(); const ct0 = coinState();
    check('CT1 act present; no __tourHooks; pristine board (weighed 0, 24 cases)',
      cos.act === 'function' && cos.hooks === 'undefined' && ct0.weighed === 0 && ct0.survivors === 24,
      '__tourAct=' + cos.act + ' · __tourHooks=' + cos.hooks + ' · weighed=' + ct0.weighed + ' · cases=' + ct0.survivors);

    kickAct(false);
    const ctw = pollCoinWeighed(1, 7000);
    check('CT2 non-reduced act stages the first weighing → weighed 0→1, 24→8 cases',
      ctw.weighed === 1 && ctw.survivors === 8,
      'weighed ' + ct0.weighed + ' → ' + ctw.weighed + ' · cases ' + ct0.survivors + ' → ' + ctw.survivors);

    kickAct(false); ab('wait', '1500');
    const ctw2 = coinState();
    check('CT3 a 2nd act call is a no-op (never stages a second weighing)',
      ctw2.weighed === 1 && ctw2.survivors === 8,
      'weighed still ' + ctw2.weighed + ' · cases still ' + ctw2.survivors);

    // fresh load → the reduced path also stages the first weighing
    ab('open', URL_CO); ab('wait', '--load', 'networkidle'); ab('wait', '1500');
    const ctr0 = coinState();
    kickAct(true);
    const ctr = pollCoinWeighed(1, 7000);
    check('CT4 reduced act stages the first weighing → weighed 0→1, 24→8 cases',
      ctr0.weighed === 0 && ctr.weighed === 1 && ctr.survivors === 8,
      'weighed ' + ctr0.weighed + ' → ' + ctr.weighed + ' · cases ' + ctr0.survivors + ' → ' + ctr.survivors);

    // ═══ THE REWIND SHELF — forward-then-back pass, the verdict cards flip ═══
    console.log('\nthe-rewind-shelf — the verdict tally (#tallyG clean / #tallyR arrow) after a forward-then-back pass:');
    ab('open', URL_RS); ab('wait', '--load', 'networkidle'); ab('wait', '1200');

    const rss = rewindState();
    check('RS1 act present; no __tourHooks (rewind-shelf is not a Showing stop)',
      rss.act === 'function' && rss.hooks === 'undefined' && rss.total > 0,
      '__tourAct=' + rss.act + ' · __tourHooks=' + rss.hooks + ' · cards=' + rss.total);

    kickAct(true);
    const rs1 = pollRewind(rss.total, 14000);
    check('RS2 reduced act flips every card → clean+arrow == cards, split matches the well-formedness twin',
      rs1.g + rs1.r === rss.total && rs1.g === rs1.clean && rs1.r === rs1.arrow && rs1.g > 0 && rs1.r > 0,
      'clean ' + rs1.g + '/' + rs1.clean + ' · arrow ' + rs1.r + '/' + rs1.arrow + ' of ' + rss.total);

    kickAct(true);
    const rs2 = pollRewind(rss.total, 14000);
    check('RS3 a 2nd act re-runs cleanly (re-entrant) → same clean/arrow split',
      rs2.g + rs2.r === rss.total && rs2.g === rs1.g && rs2.r === rs1.r,
      'clean ' + rs2.g + ' · arrow ' + rs2.r + ' (stable, resets then re-derives)');

    // fresh load → the real (non-reduced, beats-paced) visitor path
    ab('open', URL_RS); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    const rsb = rewindState();
    kickAct(false);
    const rsl = pollRewind(rsb.total, 16000);
    check('RS4 non-reduced beats-paced act flips every card → split matches the twin',
      rsb.g === 0 && rsb.r === 0 && rsl.g + rsl.r === rsb.total && rsl.g === rsl.clean && rsl.r === rsl.arrow,
      'clean ' + rsl.g + '/' + rsl.clean + ' · arrow ' + rsl.r + '/' + rsl.arrow);

    // ═══ THE PIN-BARREL — a walking half-turn via the real crankBy, then HOLD ═══
    console.log('\nthe-barrel-house/pin-barrel — the transport clock φ (STEPS=48; a half turn ≈ 24) via the real crankBy:');
    ab('open', URL_PB); ab('wait', '--load', 'networkidle'); ab('wait', '1200');

    const pbs = barrelState();
    check('PB1 act present; __tourHooks.crank present (STATE poke); barrel at rest φ≈0',
      pbs.act === 'function' && pbs.crank === 'function' && pbs.phiAbs !== null && Math.abs(pbs.phiAbs) < 0.6,
      '__tourAct=' + pbs.act + ' · __tourHooks.crank=' + pbs.crank + ' · φ=' + pbs.phiAbs);

    kickAct(true);
    const pb1 = pollBarrel(23.5, 9000);
    ab('wait', '600'); const pb1b = barrelState();
    check('PB2 reduced act steps the barrel ~half a turn (≈24) then HOLDS (no flywheel)',
      Math.abs(pb1.phiAbs - 24) < 0.6 && Math.abs(pb1b.phiAbs - pb1.phiAbs) < 0.001,
      'φ → ' + pb1.phiAbs + ' · after 600ms still ' + pb1b.phiAbs + ' (held, not spinning)');

    // fresh load → the real (non-reduced, walking-tempo) crank
    ab('open', URL_PB); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    const pbb = barrelState();
    kickAct(false);
    const pbl = pollBarrel(23.5, 11000);
    ab('wait', '700'); const pblb = barrelState();
    check('PB3 non-reduced walking-tempo act cranks ~half a turn (0→≈24) then HOLDS',
      Math.abs(pbb.phiAbs) < 0.6 && Math.abs(pbl.phiAbs - 24) < 0.6 && Math.abs(pblb.phiAbs - pbl.phiAbs) < 0.001,
      'φ ' + pbb.phiAbs + ' → ' + pbl.phiAbs + ' · held at ' + pblb.phiAbs);

    // fresh load → the Showing's STATE poke is idempotent crank-to-position
    ab('open', URL_PB); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    const c1 = crankTo(30);
    const c2 = crankTo(30);
    check('PB4 __tourHooks.crank(x) is idempotent crank-to-position (STATE class)',
      c1.before !== null && Math.abs(c1.before) < 0.6 && Math.abs(c1.ret - 30) < 0.001 && Math.abs(c2.ret - 30) < 0.001,
      'crank(30): φ ' + c1.before + ' → ' + c1.ret + ' · repeat → ' + c2.ret + ' (no further move)');

    // ═══ THE ERRAND — the Showing's go IMPULSE hook pulls the GO lever live (T4.4) ═══
    console.log('\nthe-errand — the Showing go hook drives the real GO lever; the live marble run reaches the payoff:');
    ab('open', URL_ER); ab('wait', '--load', 'networkidle'); ab('wait', '1200');

    const ers = errandSurfaces();
    check('ER1 go hook present; __tourAct undefined (not a tour stop); bench at rest (BUILD)',
      ers.go === 'function' && ers.act === 'undefined' && ers.hooks === 'object' && ers.mode === 'BUILD',
      '__tourHooks.go=' + ers.go + ' · __tourAct=' + ers.act + ' · mode=' + ers.mode);

    const er1 = pokeGoRun();
    check('ER2 go() drives the real lever → BUILD→WATCH, live run lands the payoff (hit)',
      er1.m0 === 'BUILD' && er1.ret === true && er1.mWatch === 'WATCH' && er1.mEnd === 'DONE' &&
      er1.hit === true && er1.stepIndex > 0,
      'mode ' + er1.m0 + '→' + er1.mWatch + '→' + er1.mEnd + ' · hit=' + er1.hit + ' · steps=' + er1.stepIndex);

    const er2 = pokeGoRun();
    check('ER3 a 2nd go() poke re-runs (IMPULSE forward-fire, re-armable) → WATCH then DONE+hit',
      er2.mWatch === 'WATCH' && er2.mEnd === 'DONE' && er2.hit === true && er2.stepIndex > 0,
      'mode ' + er2.m0 + '→' + er2.mWatch + '→' + er2.mEnd + ' · hit=' + er2.hit + ' (re-entrant, delivers again)');

    console.log('\n' + (fail === 0 ? '✓ acts.test: all ' : '✗ acts.test: ') +
      (fail === 0 ? '27/27 pass' : fail + ' of 27 checks FAILED'));
  } finally {
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('  ⚠ harness error: ' + (e && e.stack || e)); process.exit(2); });
