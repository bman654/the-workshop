#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   gate-dom.test.mjs — THE ESTATE PLATEWALK, asserted against the LIVE RENDERED DOM.
   (§9.1 gate-dom row · §10 W1.3 block C · §4.6 platewalk · §5.1 LOD.)

   THE BLIND SPOT IT CLOSES: the pure-Node twins (estate.test / legibility / door.test)
   model the polar solve + score the conscience over MODELED boxes — they cannot see whether
   the PAGE actually wires the estate↔district LOD, the district STRUCTURES as nav, the
   fairground gate's negative-space hit-test, or the ascend affordances to the live DOM. This
   test drives a REAL headless browser over the forged index.html and asserts the things ONLY
   the rendered page can prove, with REAL CDP INPUT throughout.

   THE STANDING HOUSE LESSON THIS GATE RECORDS: el.dispatchEvent(...) and .click() are NOT a
   real click — they poke-fire the handler and SKIP pointerdown, pointer-capture, drag-vs-click
   arbitration and painted-pixel hit-testing, the exact machinery a real pointer lives on (the
   #369→#376 gate shipped green-while-broken twice precisely because its old descend check was a
   synthetic dispatch). So every navigation here is a REAL agent-browser input (a genuine CDP
   Input.dispatchMouseEvent press→release, or a real keyboard press on a focused element), and
   the structure/gate descend keeps a SYNTHETIC CONTROL beside the real click so a regression of
   that class makes the two diverge and names the bug.

     D0  — AT REST the estate tier reads: #viewport.lod-estate, the district STRUCTURES shown,
           the room-plan LABEL layers (#roomlabels/#winglabels) folded to opacity 0, and
           #whereami reads "the estate · wander where you like" (§4.6 duty 3, §5.1 tier 1).
     D1  — a district STRUCTURE is truly clickable: elementFromPoint over the monogram plinth's
           painted centre returns a .district-rep descendant (a real click there CATCHES — it is
           not stolen by #sheet's capture-phase pointerdown, the #376 class of bug).
     D2  — a REAL INPUT click on a district STRUCTURE DESCENDS to its plate (§4.6 duty 1):
             D2a (CONTROL, synthetic) a dispatched click sequence still descends — the rep's
                 click→enter listener is WIRED (necessary, not sufficient).
             D2b (THE REAL FIX) a true CDP press→release on the plinth descends — #viewport flips
                 to .lod-district, #whereami reads "in THE …", the rep carries aria-current.
     D3  — KEYBOARD parity (§4.6 duty 1): a focused .district-rep + a REAL Enter press enters the
           plate (the same lod-district + "in THE …" lede). No mouse — keyboard alone.
     D4  — the FAIRGROUND GATE descends by a REAL NEGATIVE-SPACE click (§9.2 gate hit-test):
             D4a elementFromPoint over the open-arch void returns a .gate-face descendant (the
                 invisible full-box .gate-hit under-paints the art — a real click catches).
             D4b a REAL CDP click on the lit gate descends into the child layer — #whereami reads
                 "down in THE FAIRGROUND", the depth ribbon shows, __fairgroundLiveness stays green.
     D5  — Esc ASCENDS from the child straight to the estate home (§4.6 duty 4): a REAL Escape
           key press folds the child away, hides the ribbon, returns to #viewport.lod-estate and
           the resting #whereami lede.
     D6  — the DEPTH RIBBON and the ⌂ HOME button both ascend by REAL input (§4.6 duty 4): a real
           click on #depthribbon .ribbon ascends out of a re-descended child; a real click on
           ⌂ #pz-home returns a district tour to the fit-view estate (lod-estate, no aria-current).
     D7  — the LOD CROSSFADE leaves NO ORPHAN LABELS (post-transition DOM check, §5.1): after the
           estate→district transition SETTLES the structures fade to the faint ground-etch
           (opacity ≈ .1, inert) while the room plan is present; after district→estate settles the
           room/wing label layers are opacity 0 and the structures are full — neither tier strands
           the other's content.
     D8  — the KEYBOARD WALK visits EVERY plate in the §2.5 STRUCT_WALK order: each of the eleven
           nav elements (ten district reps + the fairground gate) is focusable (role=button,
           tabindex 0) and a REAL Enter enters it; aria-current tracks the entered district.

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
const SESSION = 'gate-dom-test-polar';   // a uniquely-named session we close at the end
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
// a REAL input click on a CSS selector: agent-browser `click` issues a genuine CDP
// Input.dispatchMouseEvent press→release at the element's painted centre (NOT a synthetic
// dispatch) — the house-lesson-approved real pointer. Returns the spawn result.
function realClick(sel) { return ab('click', sel); }
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

/* ── the single rich read of the platewalk state (used everywhere) ──
   lod       : 'estate' | 'district' | '?'   (the #viewport LOD class, §5.1)
   whereami  : the #whereami lede text (§4.6 duty 3)
   ribbon    : is the depth ribbon showing (child depth, §4.6 duty 4)
   struct/room/wing Op : the settled computed opacity of the three crossfade layers (§5.1)
   ariaCurrent : the data-district of the rep carrying aria-current (§4.6 duty 2), or null
   curAria   : the RAW aria-label of that aria-current rep ("THE NUMBER GARDEN — enter"), so a
               "in THE …" lede can be proved to NAME exactly the district it entered — read off
               the same DOM element that carries aria-current (no dependence on a page global)
   fairPass  : window.__fairgroundLiveness.result.pass, when it has run (else null)          */
function state() {
  return abEval(`(function(){
    function op(el){ return el? +getComputedStyle(el).opacity : null; }
    var vp=document.getElementById('viewport');
    var lod = vp ? (vp.classList.contains('lod-district')?'district':(vp.classList.contains('lod-estate')?'estate':'?')) : null;
    var wa=document.getElementById('whereami');
    var rib=document.getElementById('depthribbon');
    var cur=null, curAria=null;
    document.querySelectorAll('#structures .district-rep[data-district]').forEach(function(r){
      if(r.getAttribute('aria-current')==='true'){ cur=r.dataset.district; curAria=r.getAttribute('aria-label'); } });
    var fair = (window.__fairgroundLiveness && window.__fairgroundLiveness.result)
      ? !!window.__fairgroundLiveness.result.pass : null;
    return JSON.stringify({
      lod:lod, whereami: wa?wa.textContent.trim():null,
      ribbon: rib?rib.classList.contains('show'):false,
      structOp: op(document.getElementById('structures')),
      roomOp:  op(document.getElementById('roomlabels')),
      wingOp:  op(document.getElementById('winglabels')),
      ariaCurrent: cur, curAria: curAria, fairPass: fair });
  })()`);
}

// does the "in THE …" lede NAME exactly the district whose structure carries aria-current? The
// rep's aria-label is "<LABEL> — enter"; the lede is "in <LABEL>". So the aria-label must start
// with the lede's district name (lede minus the "in " prefix) — a self-consistent DOM check that
// needs no page global and no em-dash stripping.
function ledeNamesCurrent(s, district) {
  if (s.ariaCurrent !== district) return false;
  if (!/^in /.test(s.whereami || '')) return false;
  const name = (s.whereami || '').slice(3);
  return !!s.curAria && s.curAria.indexOf(name) === 0;
}

// elementFromPoint over a fractional point of an element's bounding box → does it return a
// descendant of `wantSel`? (the real hit-test that proves a real click there CATCHES, not falls
// through to #sheet). fx/fy are 0..1 across the box (0.5,0.5 = centre; 0.5,0.30 = the arch void).
function hitTest(sel, fx, fy, wantSel) {
  return abEval(`(function(){
    var g=document.querySelector(${JSON.stringify(sel)}); if(!g) return JSON.stringify({found:false});
    var r=g.getBoundingClientRect();
    var x=r.left+r.width*${fx}, y=r.top+r.height*${fy};
    var el=document.elementFromPoint(x,y);
    var want=${JSON.stringify(wantSel)};
    return JSON.stringify({ found:true,
      inWant: !!(el && el.closest && el.closest(want)),
      tag: el?(el.tagName.toLowerCase()+'.'+(el.getAttribute('class')||'')):null,
      x:Math.round(x), y:Math.round(y) });
  })()`);
}

// a SYNTHETIC dispatch on the centre of `sel` (the CONTROL half — proves the listener is wired,
// but is NOT a real click; the real click is the load-bearing proof beside it).
function synthClick(sel) {
  abEval(`(function(){
    var g=document.querySelector(${JSON.stringify(sel)}); if(!g) return JSON.stringify({ok:false});
    var r=g.getBoundingClientRect(); var x=r.left+r.width*0.5, y=r.top+r.height*0.5;
    var el=document.elementFromPoint(x,y)||g;
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
      el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,view:window})); });
    return JSON.stringify({ok:true});
  })()`);
}

// return to the fit-view estate home from anywhere via the ⌂ button (a real HTML button click),
// and settle the crossfade.
function goHome() { realClick('#pz-home'); ab('wait', '900'); }

async function main() {
  console.log('gate-dom.test — THE ESTATE PLATEWALK (§4.6/§5.1): the LIVE RENDERED DOM, headless browser, REAL input\n');

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

  const exitCode = 0;
  // the plinth district we drive for the structure checks (a monogram plinth — NOT the manor /
  // approach nav-pads, NOR the fairground which rides its gate) + a second for the keyboard test.
  const PLINTH = 'number';                       // The Number Garden — a monogram-plinth rep
  const KEYDIST = 'gardens';                      // a second plinth rep for the keyboard-Enter check
  const repSel = d => `#structures .district-rep[data-district="${d}"]`;
  const monoSel = d => `${repSel(d)} .struct-plinth`;   // the plinth PATH (a filled descendant of the rep <g>)
  const GATE = '.gate-face';                      // the fairground gate group (its .gate-hit under-paints the box)
  // the §2.5 walk order — single-sourced in DoorClaims; mirrored here for the keyboard walk (D8).
  const STRUCT_WALK = ['approach', 'manor', 'promenades', 'fairground', 'works', 'cavern',
                       'number', 'gardens', 'opticks', 'observatory', 'outbuilding'];

  try {
    // 3. OPEN headless + settle (the platewalk defers a double-rAF; give it room to seat the tier).
    ab('open', URL); ab('wait', '--load', 'networkidle'); ab('wait', '2000');

    // ── D0 — AT REST the estate tier reads ──
    const rest = state();
    check('D0 — at rest the ESTATE tier reads (#viewport.lod-estate, structures shown, room/wing labels folded to 0, resting lede)',
      rest.lod === 'estate' && rest.structOp > 0.9 && rest.roomOp === 0 && rest.wingOp === 0 &&
      /^the estate/.test(rest.whereami || ''),
      '[lod=' + rest.lod + ', structOp=' + rest.structOp + ', roomOp=' + rest.roomOp + ', wingOp=' + rest.wingOp + ', lede="' + rest.whereami + '"]');

    // ── D1 — a district STRUCTURE is truly clickable (real hit-test on the plinth) ──
    const sHit = hitTest(repSel(PLINTH), 0.5, 0.5, '.district-rep');
    check('D1 — elementFromPoint over the plinth centre returns a .district-rep descendant (a real click catches, not stolen by #sheet)',
      sHit.found && sHit.inWant, '[hit ' + sHit.tag + ' at (' + sHit.x + ',' + sHit.y + ')]');

    // ════════════════════════════════════════════════════════════════════════════
    //  D2 — a REAL INPUT click on a district STRUCTURE DESCENDS. Split into the synthetic CONTROL
    //  (proves the listener is wired) and the true CDP press→release (the load-bearing fix).
    // ════════════════════════════════════════════════════════════════════════════

    // ── D2a — CONTROL: a synthetic dispatch on the plinth descends (the rep's listener is wired) ──
    goHome();
    synthClick(monoSel(PLINTH));
    ab('wait', '900');
    const synth = state();
    check('D2a — CONTROL: the SYNTHETIC dispatch path descends (proves the district-rep click→enter listener is wired)',
      synth.lod === 'district' && /^in /.test(synth.whereami || ''),
      '[lod=' + synth.lod + ', lede="' + synth.whereami + '", aria-current=' + synth.ariaCurrent + ']');

    // ── D2b — THE REAL FIX: a true CDP press→release on the plinth descends to its plate ──
    goHome();
    const rc = realClick(monoSel(PLINTH));
    ab('wait', '1100');
    const real = state();
    check('D2b — a REAL input click on the plinth DESCENDS to its plate (lod-district · "in THE …" lede names it · aria-current on the rep)',
      rc.status === 0 && real.lod === 'district' && ledeNamesCurrent(real, PLINTH),
      '[real-click status ' + rc.status + ', lod=' + real.lod + ', lede="' + real.whereami + '", aria-current=' + real.ariaCurrent + ']');

    // ── D3 — KEYBOARD parity: a focused rep + a REAL Enter enters the plate (§4.6 duty 1) ──
    goHome();
    ab('focus', repSel(KEYDIST));
    ab('press', 'Enter');
    ab('wait', '900');
    const kb = state();
    check('D3 — KEYBOARD: a focused .district-rep + a REAL Enter press enters the plate (lod-district · "in THE …" names it · aria-current)',
      kb.lod === 'district' && ledeNamesCurrent(kb, KEYDIST),
      '[lod=' + kb.lod + ', lede="' + kb.whereami + '", aria-current=' + kb.ariaCurrent + ']');

    // ── D4 — the FAIRGROUND gate descends by a REAL NEGATIVE-SPACE click ──
    goHome();
    // D4a — the open-arch void catches (elementFromPoint over the upper-third centre).
    const gHit = hitTest(GATE, 0.5, 0.30, '.gate-face');
    check('D4a — elementFromPoint over the gate open-arch void returns a .gate-face descendant (the .gate-hit under-paint catches a real click)',
      gHit.found && gHit.inWant, '[hit ' + gHit.tag + ' at (' + gHit.x + ',' + gHit.y + ')]');
    // D4b — a REAL CDP click on the lit gate descends into the child layer.
    const gc = realClick(GATE);
    ab('wait', '1300');
    const child = state();
    check('D4b — a REAL input click on the lit fairground gate DESCENDS into the child ("down in THE FAIRGROUND" · ribbon shown · liveness green)',
      gc.status === 0 && child.ribbon === true && /^down in /.test(child.whereami || '') &&
      /FAIRGROUND/.test(child.whereami || '') && child.fairPass !== false,
      '[real-click status ' + gc.status + ', ribbon=' + child.ribbon + ', lede="' + child.whereami + '", liveness=' + child.fairPass + ']');

    // ── D5 — Esc ASCENDS from the child straight to the estate home ──
    ab('press', 'Escape');
    ab('wait', '1100');
    const up = state();
    check('D5 — a REAL Escape press ASCENDS out of the child to the estate home (lod-estate · ribbon hidden · resting lede)',
      up.lod === 'estate' && up.ribbon === false && /^the estate/.test(up.whereami || ''),
      '[lod=' + up.lod + ', ribbon=' + up.ribbon + ', lede="' + up.whereami + '"]');

    // ── D6 — the DEPTH RIBBON click AND the ⌂ HOME button both ascend by REAL input ──
    // re-descend the fairground, then ascend by a REAL click on the depth ribbon.
    realClick(GATE); ab('wait', '1200');
    const reDesc = state();
    const rrc = realClick('#depthribbon .ribbon'); ab('wait', '1100');
    const ribbonUp = state();
    check('D6a — a REAL click on the depth ribbon ASCENDS out of the re-descended child (ribbon hidden, back at lod-estate)',
      reDesc.ribbon === true && rrc.status === 0 && ribbonUp.ribbon === false && ribbonUp.lod === 'estate',
      '[re-descend ribbon=' + reDesc.ribbon + ', ribbon-click status ' + rrc.status + ' → lod=' + ribbonUp.lod + ', ribbon=' + ribbonUp.ribbon + ']');
    // enter a district, then the ⌂ HOME button returns to the fit-view estate (no aria-current).
    realClick(monoSel(PLINTH)); ab('wait', '900');
    const hc = realClick('#pz-home'); ab('wait', '1000');
    const home = state();
    check('D6b — a REAL click on ⌂ #pz-home returns a district tour to the fit-view estate (lod-estate · resting lede · no aria-current)',
      hc.status === 0 && home.lod === 'estate' && /^the estate/.test(home.whereami || '') && home.ariaCurrent === null,
      '[home-click status ' + hc.status + ', lod=' + home.lod + ', lede="' + home.whereami + '", aria-current=' + home.ariaCurrent + ']');

    // ── D7 — the LOD crossfade leaves NO ORPHAN LABELS (post-transition DOM check) ──
    // DISTRICT settle: enter a plate, let the .5s crossfade settle, then read the layer opacities.
    realClick(monoSel(PLINTH)); ab('wait', '1000');
    const dTier = state();
    check('D7a — at the DISTRICT tier the structures fade to the faint ground-etch (structOp ≈ .1, inert) and no structure orphans over the room plan',
      dTier.lod === 'district' && dTier.structOp !== null && dTier.structOp <= 0.12,
      '[lod=' + dTier.lod + ', structOp=' + dTier.structOp + ', roomOp=' + dTier.roomOp + ']');
    // ESTATE settle: ascend home, let it settle, confirm the room/wing label layers are 0.
    goHome();
    const eTier = state();
    check('D7b — at the ESTATE tier the room/wing label layers are opacity 0 (no orphan labels) and the structures are full',
      eTier.lod === 'estate' && eTier.roomOp === 0 && eTier.wingOp === 0 && eTier.structOp > 0.9,
      '[lod=' + eTier.lod + ', roomOp=' + eTier.roomOp + ', wingOp=' + eTier.wingOp + ', structOp=' + eTier.structOp + ']');

    // ── D8 — the KEYBOARD WALK visits EVERY plate in the §2.5 STRUCT_WALK order ──
    goHome();
    const walk = [];
    for (const d of STRUCT_WALK) {
      const isFair = d === 'fairground';
      const sel = isFair ? GATE : repSel(d);
      // focusability: the nav element is role=button + tabindex 0 (a real keyboard target).
      const meta = abEval(`(function(){
        var el=document.querySelector(${JSON.stringify(sel)});
        if(!el) return JSON.stringify({present:false});
        return JSON.stringify({ present:true, role:el.getAttribute('role'), tabindex:el.getAttribute('tabindex') });
      })()`);
      ab('focus', sel);
      ab('press', 'Enter');
      ab('wait', '650');
      const st = state();
      const entered = isFair
        ? (st.ribbon === true && /FAIRGROUND/.test(st.whereami || ''))
        : (st.lod === 'district' && st.ariaCurrent === d && /^in /.test(st.whereami || ''));
      walk.push({ d, present: meta.present, role: meta.role, tabindex: meta.tabindex, entered });
      goHome();   // back to the estate home before the next plate
    }
    const focusable = walk.filter(w => w.present && w.role === 'button' && w.tabindex === '0').length;
    const enteredAll = walk.filter(w => w.entered).length;
    const misses = walk.filter(w => !w.entered).map(w => w.d);
    check('D8 — the KEYBOARD WALK visits EVERY plate in STRUCT_WALK order (11 nav elements focusable role=button/tabindex 0; a real Enter enters each)',
      focusable === STRUCT_WALK.length && enteredAll === STRUCT_WALK.length,
      '[' + focusable + '/' + STRUCT_WALK.length + ' focusable, ' + enteredAll + '/' + STRUCT_WALK.length + ' entered' +
      (misses.length ? ', missed: ' + misses.join(',') : '') + ']');

  } finally {
    // 4. TEARDOWN — close exactly OUR session + kill exactly OUR server child (never a broad pkill;
    //    this laptop also runs the maker's own servers — CLEANUP GUARDRAIL).
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }

  console.log('');
  if (fail === 0) {
    console.log('PASS — the estate platewalk is REAL in the live DOM: the estate tier rests on the structures, a REAL click / keyboard Enter on a district structure descends to its plate, the fairground gate catches a REAL negative-space click, Esc + the depth ribbon + the ⌂ home button all ascend, the LOD crossfade strands no orphan labels at either tier, and the keyboard walk reaches every plate — none of which the pure-Node twins can see.');
    process.exit(exitCode);
  } else {
    console.log('FAIL — ' + fail + ' live-DOM check(s) failed: the platewalk is NOT wired as the rendered page claims. The headless twins cannot see this — that is why this gate exists.');
    process.exit(1);
  }
}

main().catch(e => { console.error('  ⚠ gate-dom.test harness error:', e); process.exit(2); });
