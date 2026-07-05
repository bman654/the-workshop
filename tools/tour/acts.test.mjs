#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   acts.test.mjs — THE GRAND TOUR ACTS, asserted against the LIVE RENDERED PAGE.
   (WS2 · DESIGN §4 beats API · Appendix A act briefs · T2.5 — acts 1.)

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

async function main() {
  console.log('acts.test — THE GRAND TOUR ACTS (§4): the LIVE RENDERED PAGE, headless, REAL entry functions\n');

  if (!haveAgentBrowser()) {
    console.error('  ⚠ agent-browser not on PATH — cannot run the act-liveness twin.');
    process.exit(2);
  }

  // 1. FORGE both pages (test the built artifact, not the source).
  for (const src of ['cavern/double-slit/index.src.html', 'benford-mill/index.src.html']) {
    const f = sh('node', ['tools/forge/forge.mjs', src]);
    if (f.status !== 0) { console.error('  ⚠ forge failed for ' + src + ':\n' + f.stderr); process.exit(2); }
  }
  if (!existsSync(path.join(ROOT, 'cavern/double-slit/index.html')) ||
      !existsSync(path.join(ROOT, 'benford-mill/index.html'))) {
    console.error('  ⚠ a forged page is missing'); process.exit(2);
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

    console.log('\n' + (fail === 0 ? '✓ acts.test: all ' : '✗ acts.test: ') +
      (fail === 0 ? '8/8 pass' : fail + ' of 8 checks FAILED'));
  } finally {
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('  ⚠ harness error: ' + (e && e.stack || e)); process.exit(2); });
