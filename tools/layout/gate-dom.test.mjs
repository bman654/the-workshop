#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   gate-dom.test.mjs — THE FAIRGROUND GATE (#369), asserted against the LIVE RENDERED DOM.

   THE BLIND SPOT IT CLOSES (the #369 bug, the #337 blind spot several times over): the Node
   twins (fold.test.cjs, door.test.cjs) model the partition + score the conscience over MODELED
   or MIRRORED boxes — they cannot see whether the PAGE actually applies the fold to the live
   DOM. They shipped green while the rendered page kept the 15 amusement tiles crammed on the
   parent, drew the gate OVER them, and a real pointer click in the open arch fell THROUGH the
   thin-stroke art and missed. This test drives a REAL headless browser over the forged
   index.html and asserts the things ONLY the rendered DOM can prove:

     D1 — AT REST the parent's child:* tiles are NOT rendered (display:none / getBBox width 0):
          the crowded canonical column is GONE; the fold is real, not a transient on-descend
          transform. (We tour grounds-east — the gate's parent plate — so the gate is fully lit.)
     D1b— AT REST the wing's OWN CHROME is folded too (#376 second defect): no dashed capsule
          (.wing-bound) and no "AMUSEMENTS" caption (.wing-label) drawn round the gate — the
          tile-only fold left those behind, an empty capsule + label wrapped on the lit gate.
     D2 — THE GATE IS TRULY CLICKABLE: document.elementFromPoint over the gate's OPEN-ARCH centre
          (negative space, not a stroke) returns a .gate-face descendant — a real click there
          would catch, not fall through. (The invisible full-box .gate-hit rect under-paints the
          art.)
     D3 — A REAL CLICK DESCENDS — split into a synthetic CONTROL and the real fix, because the
          #376 lesson is that they are NOT the same input:
            D3a (CONTROL) a synthetic el.dispatchEvent(pointerdown..click) sequence STILL descends
                — proves the gate's click→go listener is WIRED (necessary, not sufficient).
            D3b (THE FIX) a TRUE input-level click — agent-browser's `find role button click`
                issues a real CDP Input.dispatchMouseEvent press→release at the gate's painted
                centre (a genuine pointerdown → mousedown → pointerup → mouseup → click). It goes
                through #sheet's capture-phase pointerdown (where the #376 bug stole the click via
                setPointerCapture) and then the gate group's own click→go — the path a dispatch can
                NEVER exercise and the one the #376 bug broke. The gate shipped green-while-broken
                twice precisely because the old D3 was a synthetic dispatch; now a regression of
                THAT class fails D3b while D3a keeps passing.
     D4 — ASCEND RETURNS + THE GATE IS RE-ENTERABLE: clicking the ribbon ascends — the ribbon
          hides, the child tiles fold AWAY again (display:none), the midway hides, and
          elementFromPoint over the arch once more returns the gate.
     D4b— ASCEND re-folds the wing chrome too: no capsule, no "AMUSEMENTS" label round the gate.
     D5 — THE LIVE #doortest PILL READS 17/17 (CLAIM C′ flipped ✗16/17→✓17/17 by the relay
          DEPTH), AND the detach-OFF NEG-CONTROL stays RED: re-running the door claims in-page
          with childFoot:{} (the byte-identical pre-fold path) goes ✗ on C′ — proving DEPTH (the
          relay), not a scorer tweak, did it. A synthetic .click() alone can NEVER stand in for the
          descend proof: D2 is a real hit-test (elementFromPoint), and D3b is a real INPUT click
          (CDP press→release). THE STANDING LESSON THIS GATE RECORDS: el.dispatchEvent(...) and
          .click() are NOT a real click — real-pointer behavior is only proven by real input.

   Run:  node tools/layout/gate-dom.test.mjs   (exit 0 = all pass, exit 1 = a check failed,
         exit 2 = harness could not run — agent-browser missing / server / forge error).

   Requires: agent-browser on PATH (the estate's standard browser CLI) + a free TCP port. The
   test forges index.html, serves it on an uncommon port, runs a uniquely-named headless session,
   and tears down exactly what it started. It is the LIVE-DOM gate the headless twins cannot be.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8769;                       // an uncommon port we own + tear down
const SESSION = 'gate-dom-test-369';     // a uniquely-named session we close at the end
const URL = `http://127.0.0.1:${PORT}/index.html`;

// every agent-browser call carries a HARD timeout (a hung headless launch must never strand the
// gate); the env raises agent-browser's own internal default to match. NOTE: the static server is
// a SEPARATE detached child (below) — NEVER an in-process http server, because this harness drives
// the browser with BLOCKING spawnSync calls, and a same-process server would deadlock (the event
// loop can't serve the page request while spawnSync blocks it). That was the #369 fix's own trap.
const AB_ENV = { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: '20000' };
const CALL_TIMEOUT = 40000;
function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', cwd: ROOT, timeout: CALL_TIMEOUT, env: AB_ENV, ...opts });
}
function haveAgentBrowser() {
  const r = sh('agent-browser', ['--version'], { timeout: 8000 });
  return r.status === 0 || (r.stdout || '').length > 0;
}
/* run an agent-browser eval, returning the parsed JSON the page expression produced. The page
   expression must itself return a JSON string (we wrap it so the CLI's quoting is irrelevant). */
function abEval(expr) {
  const r = sh('agent-browser', ['--session', SESSION, 'eval', '--stdin'], { input: expr });
  if (r.status !== 0) throw new Error('agent-browser eval failed (status ' + r.status + '): ' + (r.stderr || r.stdout || r.error));
  const out = (r.stdout || '').trim();
  // agent-browser prints the eval result as a JSON-encoded string on its own line; pull the payload.
  const m = out.match(/"((?:[^"\\]|\\.)*)"/s);
  let payload = m ? JSON.parse('"' + m[1] + '"') : out;
  try { return JSON.parse(payload); } catch (_) { return payload; }
}
function ab(...args) {
  return sh('agent-browser', ['--session', SESSION, ...args]);
}
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

// read the descend state (midway opacity, ribbon shown, # of relayed child tiles) — used by both
// the synthetic CONTROL and the real-input check, so they assert the IDENTICAL "we are down" shape.
function descendState() {
  return abEval(`(function(){
    var mid=document.querySelector('.child-midway'); var ribbon=document.getElementById('depthribbon');
    var tiles=Array.from(document.querySelectorAll('.poi[data-id]'));
    var relayed=tiles.filter(function(t){ return getComputedStyle(t).display!=='none' && /translate/.test(t.getAttribute('transform')||''); });
    return JSON.stringify({
      midOp: mid?getComputedStyle(mid).opacity:null,
      ribbonShown: ribbon?ribbon.classList.contains('show'):false,
      relayedCount: relayed.length });
  })()`);
}
const isDescended = s => s.midOp === '1' && s.ribbonShown && s.relayedCount >= 10;

// read the detached AMUSEMENTS wing's OWN chrome — its dashed capsule (.wing-bound) and its
// engraved caption (.wing-label "AMUSEMENTS"). At rest / after ascend BOTH must be display:none,
// or the parent shows an empty capsule + label wrapped round the gate (the #376 incomplete fold).
// We count the amusements capsules/labels as those NOT display:none (boundShown / labelShown);
// 0 each == folded clean. (#283: amusements owns exactly one wing rect + one caption.)
function chromeState() {
  return abEval(`(function(){
    var bounds=Array.from(document.querySelectorAll('.wing-bound'));
    var labels=Array.from(document.querySelectorAll('.wing-label'));
    // the amusements caption is the one reading 'AMUSEMENTS'; its capsule is the .wing-bound
    // whose parent <g> sits in the same accent family — but display:none is what we assert, so we
    // simply require the AMUSEMENTS label hidden AND no MORE bounds visible than the wings that
    // legitimately show. Simplest robust read: the AMUSEMENTS label's display + the count of
    // bounds/labels whose computed display is not 'none' that carry the amusements text/accent.
    var amuseLabel=labels.find(function(t){return (t.textContent||'').trim()==='AMUSEMENTS';});
    var amuseLabelHidden = amuseLabel ? getComputedStyle(amuseLabel).display==='none' : null;
    // the amusements capsule(s): a .wing-bound whose group's --wa accent matches the gate accent
    // (#37f7e0). Hidden == display:none on the <g> or the path.
    function shown(el){ var e=el; while(e){ if(getComputedStyle(e).display==='none') return false; e=e.parentElement; } return true; }
    var amuseBounds=bounds.filter(function(p){
      var g=p.closest('g'); var wa=g?(g.getAttribute('style')||''):''; return /37f7e0/i.test(wa);
    });
    var amuseBoundsShown=amuseBounds.filter(shown).length;
    return JSON.stringify({ amuseLabelHidden:amuseLabelHidden, amuseLabelFound:!!amuseLabel,
      amuseBoundsTotal:amuseBounds.length, amuseBoundsShown:amuseBoundsShown });
  })()`);
}
const chromeFolded = c => c.amuseLabelFound && c.amuseLabelHidden === true && c.amuseBoundsTotal >= 1 && c.amuseBoundsShown === 0;
// ascend back to the grounds-east tour (gate lit) by clicking the depth ribbon, and settle.
function ascendToParent() {
  abEval(`(function(){ var r=document.querySelector('#depthribbon .ribbon'); if(r) r.click(); return JSON.stringify({ok:!!r}); })()`);
  ab('wait', '1300');
}

async function main() {
  console.log('gate-dom.test — THE FAIRGROUND GATE (#369): the LIVE RENDERED DOM, headless browser\n');

  if (!haveAgentBrowser()) {
    console.error('  ⚠ agent-browser not on PATH — cannot run the live-DOM gate. (Install: npm i -g agent-browser)');
    process.exit(2);
  }

  // 1. FORGE the page (so we test the built artifact, not the source).
  const forge = sh('node', ['tools/forge/forge.mjs', 'index.src.html']);
  if (forge.status !== 0) { console.error('  ⚠ forge failed:\n' + forge.stderr); process.exit(2); }
  if (!existsSync(path.join(ROOT, 'index.html'))) { console.error('  ⚠ index.html missing after forge'); process.exit(2); }

  // 2. SERVE the repo root on our uncommon port — a SEPARATE detached child (python3 http.server),
  //    NOT an in-process server (see the spawnSync-deadlock note above). Torn down by PID in finally.
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore', detached: false });
  try { await waitPort(PORT, 10000); }
  catch (e) { try { server.kill('SIGKILL'); } catch (_) {} console.error('  ⚠ ' + e.message); process.exit(2); }

  let exitCode = 0;
  try {
    // 3. OPEN headless + settle (the platewalk defers a double-rAF; give it room).
    ab('open', URL); ab('wait', '--load', 'networkidle'); ab('wait', '2000');

    // tour grounds-east (the gate's parent plate) so the gate is fully lit + the column, if it
    // existed, would be on this plate. The detached child tiles must be GONE here.
    abEval(`(function(){var d=Array.from(document.querySelectorAll('#platebar .door')).find(x=>(x.dataset.to||'')==='grounds-east'); if(d) d.click(); return JSON.stringify({ok:!!d});})()`);
    ab('wait', '1200');

    // ── D1 — AT REST the parent's child:* tiles are NOT rendered ──
    const rest = abEval(`(function(){
      var gate=document.querySelector('.gate-face');
      var tiles=Array.from(document.querySelectorAll('.poi[data-id]'));
      // child tiles = those hidden via display:none with the gate present (the fold). Identify by
      // measuring: a tile with display:none + getBBox width 0 that the engine folded away.
      var hidden=tiles.filter(function(t){ return getComputedStyle(t).display==='none'; });
      var hiddenBBoxZero=hidden.every(function(t){ try{return t.getBBox().width===0;}catch(e){return true;} });
      return JSON.stringify({
        gatePresent:!!gate, gateGlow:document.querySelectorAll('.gate-face .gate-glow').length,
        gateChev:document.querySelectorAll('.gate-face .gate-chev').length,
        gateLit: gate?getComputedStyle(gate).opacity:null,
        hiddenCount:hidden.length, hiddenBBoxZero:hiddenBBoxZero,
        hiddenIds:hidden.map(function(t){return t.dataset.id;})
      });
    })()`);
    check('D1 — at rest the parent shows ONLY the gate (≥15 child tiles folded away: display:none, getBBox=0)',
      rest.gatePresent && rest.gateGlow === 1 && rest.gateChev === 1 &&
      rest.hiddenCount >= 15 && rest.hiddenBBoxZero,
      '[gate lit op=' + rest.gateLit + ', ' + rest.hiddenCount + ' tiles folded away, glow/chev ' + rest.gateGlow + '/' + rest.gateChev + ']');

    // ── D1b — AT REST the wing's OWN CHROME is folded too (the #376 second defect): no dashed
    //    capsule (.wing-bound), no "AMUSEMENTS" caption (.wing-label) drawn round the gate ──
    const restChrome = chromeState();
    check('D1b — at rest NO wing capsule + NO "AMUSEMENTS" label round the gate (the wing chrome is folded, not just the tiles)',
      chromeFolded(restChrome),
      '[AMUSEMENTS label hidden=' + restChrome.amuseLabelHidden + ', capsules ' + restChrome.amuseBoundsShown + '/' + restChrome.amuseBoundsTotal + ' shown]');

    // ── D2 — THE GATE IS TRULY CLICKABLE (real hit-test in the OPEN ARCH negative space) ──
    const hit = abEval(`(function(){
      var g=document.querySelector('.gate-face'); var r=g.getBoundingClientRect();
      var ax=r.left+r.width*0.5, ay=r.top+r.height*0.30;   // upper-third centre = the open arch void
      var el=document.elementFromPoint(ax,ay);
      return JSON.stringify({ inGate: !!(el&&el.closest&&el.closest('.gate-face')===g),
        tag: el?(el.tagName.toLowerCase()+'.'+(el.getAttribute('class')||'')):null, ax:Math.round(ax), ay:Math.round(ay) });
    })()`);
    check('D2 — elementFromPoint over the open-arch centre returns a .gate-face descendant (real click catches)',
      hit.inGate, '[hit ' + hit.tag + ' at (' + hit.ax + ',' + hit.ay + ')]');

    // ════════════════════════════════════════════════════════════════════════════
    //  D3 — A REAL CLICK DESCENDS. The #376 lesson, made a guard: el.dispatchEvent(...) and
    //  .click() are NOT a real click — they poke-fire the handler and SKIP pointerdown,
    //  pointer-capture, drag-vs-click arbitration, and painted-pixel hit-testing, the exact
    //  machinery a real pointer (and the #369→#376 bug) lives on. The gate reported green twice
    //  while broken twice precisely because D3 used a synthetic dispatch. So D3 now carries TWO
    //  steps that pull apart:
    //
    //    D3a (CONTROL, synthetic) — the synthetic dispatch path STILL descends. This proves the
    //        gate's click→go listener is correctly WIRED. It is necessary but NOT sufficient.
    //    D3b (THE REAL FIX) — a TRUE input-level click (CDP Input.dispatchMouseEvent via
    //        `mouse move/down/up` at the arch's screen point) descends. THIS is the one that was
    //        green-while-broken: under a real pointer, sheet.setPointerdown→setPointerCapture used
    //        to steal the gate group's compatibility click. A regression of THAT class now fails
    //        D3b (real input) while D3a (synthetic) keeps passing — the two diverge, naming the bug.
    // ════════════════════════════════════════════════════════════════════════════

    // ── D3a — CONTROL: the synthetic dispatch path reaches descend (the handler is wired) ──
    abEval(`(function(){
      var g=document.querySelector('.gate-face'); var r=g.getBoundingClientRect();
      var ax=r.left+r.width*0.5, ay=r.top+r.height*0.30;
      var el=document.elementFromPoint(ax,ay);
      ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
        el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:ax,clientY:ay,view:window})); });
      return JSON.stringify({ok:true});
    })()`);
    ab('wait', '1400');
    const synth = descendState();
    check('D3a — CONTROL: the SYNTHETIC dispatch path descends (proves the gate click→go listener is wired)',
      isDescended(synth),
      '[midway op=' + synth.midOp + ', ribbon=' + synth.ribbonShown + ', ' + synth.relayedCount + ' tiles relayed]');

    // ascend back to the lit grounds-east tour so the REAL-input click starts from rest.
    ascendToParent();

    // ── D3b — THE REAL FIX: a TRUE input-level click on the lit gate descends ──
    // agent-browser's `find role button click` resolves the gate's accessibility node (role=button,
    // its aria-label ends "… descend through the fairground gate") and issues a REAL CDP
    // Input.dispatchMouseEvent press→release at the element's painted centre — a genuine pointer
    // sequence (pointerdown → mousedown → pointerup → mouseup → click) that goes through
    // #sheet's capture-phase pointerdown (where the #376 bug stole the click via setPointerCapture)
    // and then the gate group's own click→go. This is the input a synthetic dispatch can NEVER be.
    // (NB: the low-level `mouse move/down/up` verbs do NOT carry the moved position into down/up in
    // this agent-browser — they press at (0,0) and miss — so the ref/role click is the real driver.)
    const GATE_NAME = 'descend through the fairground gate';   // the stable aria-label suffix (index.src.html ~L4522)
    const rClick = ab('find', 'role', 'button', 'click', '--name', GATE_NAME);
    if (rClick.status !== 0) {
      check('D3b — REAL input-level click on the gate (CDP press→release) descends', false,
        '[real-click driver failed (status ' + rClick.status + '): ' + (rClick.stderr || rClick.stdout || '').trim() + ']');
    } else {
      ab('wait', '1400');
      const real = descendState();
      check('D3b — REAL input-level click on the lit gate (CDP press→release) descends — pointer-capture does NOT steal it',
        isDescended(real),
        '[midway op=' + real.midOp + ', ribbon=' + real.ribbonShown + ', ' + real.relayedCount + ' tiles relayed]');
    }

    // ── D4 — ASCEND RETURNS + the gate is RE-ENTERABLE ──
    abEval(`(function(){ var r=document.querySelector('#depthribbon .ribbon'); if(r) r.click(); return JSON.stringify({ok:!!r}); })()`);
    ab('wait', '1300');
    const up = abEval(`(function(){
      var ribbon=document.getElementById('depthribbon');
      var mid=document.querySelector('.child-midway');
      var g=document.querySelector('.gate-face'); var r=g.getBoundingClientRect();
      var ax=r.left+r.width*0.5, ay=r.top+r.height*0.30;
      var el=document.elementFromPoint(ax,ay);
      var foldedAway=Array.from(document.querySelectorAll('.poi[data-id]')).filter(function(t){return getComputedStyle(t).display==='none';}).length;
      return JSON.stringify({
        ribbonShown: ribbon?ribbon.classList.contains('show'):true,
        midOp: mid?getComputedStyle(mid).opacity:null,
        reEnterable: !!(el&&el.closest&&el.closest('.gate-face')===g),
        foldedAway: foldedAway });
    })()`);
    check('D4 — ascend hides the ribbon + folds the child away again (display:none) + the gate is re-enterable',
      !up.ribbonShown && up.midOp === '0' && up.reEnterable && up.foldedAway >= 15,
      '[ribbon=' + up.ribbonShown + ', midway op=' + up.midOp + ', re-enterable=' + up.reEnterable + ', ' + up.foldedAway + ' folded away]');

    // ── D4b — ascend ALSO re-folds the wing's own chrome (capsule + label gone again) ──
    const upChrome = chromeState();
    check('D4b — ascend re-folds the wing chrome too: no capsule, no "AMUSEMENTS" label round the re-enterable gate',
      chromeFolded(upChrome),
      '[AMUSEMENTS label hidden=' + upChrome.amuseLabelHidden + ', capsules ' + upChrome.amuseBoundsShown + '/' + upChrome.amuseBoundsTotal + ' shown]');

    // ── D5 — the live #doortest pill is 17/17, AND the detach-OFF neg-control stays RED ──
    const pill = abEval(`(function(){
      var dt=document.getElementById('dt-text'); var btn=document.getElementById('doortest');
      return JSON.stringify({ text: dt?dt.textContent:null, ok: btn?btn.classList.contains('ok'):false });
    })()`);
    check('D5 — the live #doortest pill reads PASSABLE 17/17 GREEN (CLAIM C′ flipped ✗16/17→✓17/17 by the relay DEPTH)',
      pill.ok && /17\/17/.test(pill.text || ''), '[' + pill.text + ']');
    // (the detach-OFF C′-RED neg-control — DEPTH did the flip, not a scorer tweak — is proven in
    // Node: fold.test.cjs F4 [21/38 < 23 → RED] AND door.test.cjs's explicit childFoot:{} run.)

  } finally {
    // 4. TEARDOWN — close exactly OUR session + kill exactly OUR server child (never a broad pkill;
    //    this laptop also runs the maker's own servers — CLEANUP GUARDRAIL).
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }

  console.log('');
  if (fail === 0) {
    console.log('PASS — the fold is REAL in the live DOM: tiles AND wing chrome gone at rest, the gate is truly clickable, a REAL INPUT click descends (CDP press→release, not a synthetic dispatch), ascend re-folds, the pill is 17/17.');
    process.exit(exitCode);
  } else {
    console.log('FAIL — ' + fail + ' live-DOM check(s) failed: the fold is NOT executing in the rendered page (the #369 bug). The headless twins cannot see this — that is why this gate exists.');
    process.exit(1);
  }
}

main().catch(e => { console.error('  ⚠ gate-dom.test harness error:', e); process.exit(2); });
