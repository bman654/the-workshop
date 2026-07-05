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
     D9  — §3.3 STAR-CAUSALITY: a REAL hover on a star's invisible hit disc reveals the engraved
           star card (an unlit star shows the spoiler HINT — no name, no link); the Survey tally
           is a keyboard button that a REAL Enter opens into the grouped, keyboard-operable SKY
           INDEX; and the unseen hidden star (starlight-bend) stays HINT-ONLY in the index (its
           name never leaks before its ws:seen crumb — the Register's lock-parity, in the sky).
     D10 — THE GRAND TOUR OVERTURE (WS2 §6, T1.2; retargeted to the real `light` thread at
           T3.1 when the fixtures were replaced): with ?tour=light&stop=0 the front door
           ACTS — __tourAct draws the LIT THREAD (the thread's distinct-anchor roundels,
           consecutive repeats collapsed into ×n beads, never a bare numeral), flies the REAL
           __panCamera.frameTo to the stop-0 waypoint district's Layout frame (opticks),
           retires the hint, and restores the platewalk's onManual;
           the dwell then AUTO-ADVANCES to stop 1 (D10b). A REAL mid-overture wheel fires the
           adapter's own onManual → ctx.softPause(): the card WAITS (D10c). A plain load stays
           inert — no overlay, no docent card, hint shown (D10d) — and the reduced-motion
           degrade is driven through the REAL entry function (__tourAct with a reduced ctx,
           the payoff-liveness rule): the thread appears still and the camera JUMPS (D10e).

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

    // ════════════════════════════════════════════════════════════════════════════
    //  D9 — §3.3 STAR-CAUSALITY: the star card reveals on a REAL hover, the Survey tally is a
    //  keyboard button opening the sky index, and the hidden-star name-lock holds in the LIVE
    //  DOM. A fresh headless origin has no ws:seen breadcrumbs, so every star is UNLIT here —
    //  which is exactly the branch that must show a spoiler HINT and never a name/link.
    // ════════════════════════════════════════════════════════════════════════════
    goHome();

    // read the star card's live state (shown? name? "what lights it" text? does it carry a link?)
    const skycard = () => abEval(`(function(){
      var c=document.getElementById('skycard');
      var w=document.getElementById('sc-what');
      var a=w?w.querySelector('a'):null;
      return JSON.stringify({
        shown: !!(c && c.classList.contains('show')),
        name: (document.getElementById('sc-name')||{}).textContent ? document.getElementById('sc-name').textContent.trim() : '',
        what: w ? w.textContent.trim() : '',
        hasLink: !!a });
    })()`);

    // D9a — a REAL hover on a clear-margin star's invisible hit disc reveals the engraved card.
    // Pick the first candidate whose disc is the TOPMOST element (a real hover there lands on it,
    // not on a footprint or the ground) — the same house-lesson hit-test as the plinth/gate.
    const STAR_CANDS = ['carnot', 'firmament', 'pin-barrel', 'orrery', 'stirling'];
    let starId = null, spot = null;
    for (const id of STAR_CANDS) {
      const h = hitTest(`.sky-hit-dot[data-id="${id}"]`, 0.5, 0.5, '.sky-hit-dot');
      if (h.found && h.inWant) { starId = id; spot = h; break; }   // h.x/h.y = the disc's screen centre
    }
    let card = null;
    if (starId && spot) {
      // a REAL CDP mouse move to the disc centre → the browser's OWN hit-test fires the native
      // mouseenter (agent-browser `hover` proved to skip it — the same dispatchEvent-blind-spot
      // house lesson: only a real pointer move exercises the hover path).
      ab('mouse', 'move', String(spot.x), String(spot.y));
      ab('wait', '450');
      card = skycard();
    }
    check('D9a — a REAL hover on a star\'s invisible hit disc reveals the star card (an UNLIT star ⇒ the spoiler HINT: shown, no name, no link)',
      !!starId && card && card.shown === true && card.what.length > 0 && card.hasLink === false && /unnamed/i.test(card.name),
      '[star=' + starId + ', shown=' + (card && card.shown) + ', name="' + (card && card.name) + '", what="' + (card && card.what) + '", hasLink=' + (card && card.hasLink) + ']');

    // D9b — the Survey tally is a KEYBOARD button: focus it + a REAL Enter opens the SKY INDEX,
    // a grouped, populated, keyboard-operable list (the accessible surface, not ~65 star stops).
    ab('focus', '#sky-tally-main');
    ab('press', 'Enter');
    ab('wait', '350');
    const ixOpen = abEval(`(function(){
      var ix=document.getElementById('skyindex');
      return JSON.stringify({
        shown: !!(ix && ix.classList.contains('show')),
        rows: document.querySelectorAll('#sky-ix-list .skyix-star').length,
        groups: document.querySelectorAll('#sky-ix-list .skyix-ghead').length,
        focusInPanel: !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#skyindex')) });
    })()`);
    check('D9b — the Survey tally is a KEYBOARD button: focus + a REAL Enter opens the SKY INDEX (grouped, populated rows, focus moved into the panel)',
      ixOpen.shown === true && ixOpen.rows >= 50 && ixOpen.groups >= 6 && ixOpen.focusInPanel === true,
      '[shown=' + ixOpen.shown + ', rows=' + ixOpen.rows + ', groups=' + ixOpen.groups + ', focusInPanel=' + ixOpen.focusInPanel + ']');

    // D9c — HIDDEN-STAR LOCK-PARITY in the live DOM: the unseen hidden star (starlight-bend)
    // appears in the index as a HINT ONLY — its name never leaks before its ws:seen crumb.
    const hidden = abEval(`(function(){
      var b=document.querySelector('#sky-ix-list .skyix-star[data-id="starlight-bend"]');
      if(!b) return JSON.stringify({found:false});
      var txt=(b.textContent||'').trim();
      return JSON.stringify({ found:true, hintOnly: !!b.querySelector('.sx-hint'),
        leaksName: /Light That Falls Around a Star/.test(txt), text: txt });
    })()`);
    check('D9c — HIDDEN lock-parity (live DOM): the unseen hidden star (starlight-bend) is HINT-ONLY in the index — its name never leaks',
      hidden.found === true && hidden.hintOnly === true && hidden.leaksName === false,
      '[found=' + hidden.found + ', hintOnly=' + hidden.hintOnly + ', leaksName=' + hidden.leaksName + ', text="' + hidden.text + '"]');

    // ════════════════════════════════════════════════════════════════════════════
    //  D10 — THE GRAND TOUR OVERTURE (WS2 §6, T1.2). The front door implements the docent's
    //  page contract: ?tour=light&stop=0 runs __tourAct — lit thread + camera fly + advance.
    //  The act mirrors its liveness into window.__tourOverture (the __fairgroundLiveness idiom).
    // ════════════════════════════════════════════════════════════════════════════

    // D10a — the act draws the DISTINCT-ANCHOR thread and flies the REAL camera to the
    // waypoint district's frame. `light` resolves to several distinct anchors, its run of
    // consecutive hall-of-mirrors stops collapsing into one ×n bead (never a bare numeral);
    // we assert the CONTRACT (≥2 roundels, every bead a ×n form, no bare numerals) rather
    // than a thread-shape magic number. The stop-0 waypoint is at:'opticks', so after the
    // act the applied transform must EQUAL the pure Layout.plates(...) frame for opticks
    // (frameTo is the only path that can set it — it bypasses K_MAX; a manual zoom cannot
    // reach a plate frame exactly).
    ab('open', URL + '?tour=light&stop=0');
    ab('wait', '4500');   // world-await + draw beat + fly + settle comfortably done
    const ov1 = abEval(`(function(){
      var g=document.getElementById('tour-thread');
      var vp=document.getElementById('viewport');
      var pc=window.__panCamera;
      var frame=null, camAtFrame=false;
      try{
        frame = Layout.plates(PLACES.filter(function(p){ return !p.locked; })).frame['opticks'];
        camAtFrame = !!(frame && pc && Math.abs(pc.k - frame.k) < 1e-9 &&
          vp.getAttribute('transform') === 'translate(' + frame.tx.toFixed(2) + ' ' + frame.ty.toFixed(2) + ') scale(' + frame.k.toFixed(4) + ')');
      }catch(e){}
      var beads = g ? Array.prototype.map.call(g.querySelectorAll('.tt-bead'), function(t){ return t.textContent; }) : [];
      var digits = g ? Array.prototype.some.call(g.querySelectorAll('text'), function(t){ return /^[0-9]+$/.test((t.textContent||'').trim()); }) : false;
      return JSON.stringify({
        ov: window.__tourOverture || null,
        card: !!document.getElementById('tour-docent'),
        roundels: g ? g.querySelectorAll('.tt-roundel').length : 0,
        beads: beads, bareNumerals: digits,
        hintShown: (function(){ var h=document.querySelector('.hint'); return h ? getComputedStyle(h).display !== 'none' : null; })(),
        camAtFrame: camAtFrame,
        platewalkManualBack: !!(pc && typeof pc.onManual === 'function' && !pc.onManual.__tourOverture) });
    })()`);
    check('D10a — the overture DRAWS the lit thread (≥2 distinct anchors, every repeat bead a ×n form, no bare numerals), flies the REAL frameTo to the opticks Layout frame, retires the hint, and hands onManual back to the platewalk',
      ov1.ov && ov1.ov.stage === 'done' && ov1.ov.installed === true && ov1.ov.restored === true && ov1.ov.flew === true &&
      ov1.card === true && ov1.roundels >= 2 && ov1.beads.length >= 1 && ov1.beads.every(function(b){ return /^×\d+$/.test(b); }) && ov1.bareNumerals === false &&
      ov1.hintShown === false && ov1.camAtFrame === true && ov1.platewalkManualBack === true,
      '[stage=' + (ov1.ov && ov1.ov.stage) + ', roundels=' + ov1.roundels + ', beads=' + JSON.stringify(ov1.beads) +
      ', camAtFrame=' + ov1.camAtFrame + ', hintShown=' + ov1.hintShown + ', restored=' + (ov1.ov && ov1.ov.restored) + ']');

    // D10b — the dwell then AUTO-ADVANCES: the same load walks itself to stop 1 (the engine's
    // countdown navigation — light's stop 1 is why-the-sky-is-blue/index.html?tour=light&stop=1).
    // Poll up to ~20s (stop 0 dwells 12s after the ~3s act).
    let advanced = null;
    for (let i = 0; i < 10; i++) {
      ab('wait', '2000');
      const u = abEval(`JSON.stringify({ href: location.href })`);
      if (u && /why-the-sky-is-blue\/index\.html\?tour=light&stop=1$/.test(u.href || '')) { advanced = u.href; break; }
    }
    check('D10b — the overture stop AUTO-ADVANCES to stop 1 (why-the-sky-is-blue/index.html?tour=light&stop=1) when its dwell expires',
      advanced !== null, '[landed=' + advanced + ']');

    // D10c — the VISITOR OUTRANKS THE DOCENT: a REAL CDP wheel over the map mid-overture fires
    // the adapter's own onManual → ctx.softPause(); the following dwell starts SUSPENDED and the
    // card shows the waiting affordance. (The wheel must land inside the act's ~2.6s window; the
    // 1200ms draw beat exists to give a hand-on-the-wheel exactly this room.)
    ab('open', URL + '?tour=light&stop=0');
    ab('wait', '600');
    ab('mouse', 'move', '640', '250');
    ab('mouse', 'wheel', '240');
    ab('wait', '3200');   // let the interrupted act settle into the suspended dwell
    const ov2 = abEval(`(function(){
      var walk=document.querySelector('#tour-docent .td-walk');
      var lbl=document.querySelector('#tour-docent .td-walk-label');
      return JSON.stringify({
        ov: window.__tourOverture || null,
        waiting: !!(walk && walk.classList.contains('waiting')),
        label: lbl ? lbl.textContent : null,
        thread: !!document.getElementById('tour-thread') });
    })()`);
    check('D10c — a REAL mid-overture wheel SOFT-PAUSES: the adapter\'s onManual fired (interrupted), the platewalk handler was restored, and the card waits',
      ov2.ov && ov2.ov.interrupted === true && ov2.ov.restored === true && ov2.waiting === true && ov2.thread === true,
      '[interrupted=' + (ov2.ov && ov2.ov.interrupted) + ', waiting=' + ov2.waiting + ', label="' + ov2.label + '"]');

    // D10d — a PLAIN load stays inert: the overlay is rendered ONLY in tour mode (§6) — no
    // thread, no docent card, no gt-touring costume, the hint back on duty.
    ab('open', URL);
    ab('wait', '1500');
    const plain = abEval(`(function(){
      return JSON.stringify({
        thread: !!document.getElementById('tour-thread'),
        card: !!document.getElementById('tour-docent'),
        touring: document.body.classList.contains('gt-touring'),
        stage: window.__tourOverture ? window.__tourOverture.stage : null,
        hintShown: (function(){ var h=document.querySelector('.hint'); return h ? getComputedStyle(h).display !== 'none' : null; })() });
    })()`);
    check('D10d — a plain load is INERT: no lit thread, no docent card, no touring costume, hint shown (the overlay exists only in tour mode)',
      plain.thread === false && plain.card === false && plain.touring === false && plain.stage === 'idle' && plain.hintShown === true,
      '[thread=' + plain.thread + ', card=' + plain.card + ', stage=' + plain.stage + ', hintShown=' + plain.hintShown + ']');

    // D10e — REDUCED-MOTION degrade, driven through the REAL entry function (the payoff-liveness
    // rule: call the page's real __tourAct, never synthesize events): with a reduced ctx the
    // thread appears WITHOUT the draw-on (.tt-still) and the camera JUMPS to the frame with no
    // ease class. (CDP media emulation for prefers-reduced-motion proved unreliable in this CLI,
    // so the degrade branch is exercised at the contract seam — the same surface the engine uses.)
    const red = abEval(`(function(){
      var ctx={ tourId:'light', stopIndex:0, reduced:true, signal:{aborted:false},
        beat:function(){ return Promise.resolve(); }, spotlight:function(){}, softPause:function(){}, done:function(){} };
      return window.__tourAct(ctx).then(function(){
        var g=document.getElementById('tour-thread');
        var out={
          still: !!(g && g.classList.contains('tt-still')),
          roundels: g ? g.querySelectorAll('.tt-roundel').length : 0,
          k: window.__panCamera.k,
          walking: document.getElementById('viewport').classList.contains('walking'),
          restored: !!(window.__tourOverture && window.__tourOverture.restored) };
        if(g && g.parentNode) g.parentNode.removeChild(g);        /* tidy the harness call away */
        document.body.classList.remove('gt-touring');
        window.__panCamera.recentre();
        return JSON.stringify(out);
      });
    })()`);
    check('D10e — the REAL __tourAct under a reduced ctx DEGRADES: the thread appears still (no draw-on), the camera JUMPS to the frame (k=frame.k, no .walking ease), onManual restored',
      red.still === true && red.roundels >= 2 && typeof red.k === 'number' && red.k > 1 && red.walking === false && red.restored === true,
      '[still=' + red.still + ', roundels=' + red.roundels + ', k=' + red.k + ', walking=' + red.walking + ']');

  } finally {
    // 4. TEARDOWN — close exactly OUR session + kill exactly OUR server child (never a broad pkill;
    //    this laptop also runs the maker's own servers — CLEANUP GUARDRAIL).
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }

  console.log('');
  if (fail === 0) {
    console.log('PASS — the estate platewalk is REAL in the live DOM: the estate tier rests on the structures, a REAL click / keyboard Enter on a district structure descends to its plate, the fairground gate catches a REAL negative-space click, Esc + the depth ribbon + the ⌂ home button all ascend, the LOD crossfade strands no orphan labels at either tier, the keyboard walk reaches every plate, (§3.3) a REAL hover reveals the star card while the tally-button keyboard-opens the sky index with the hidden-star name-lock intact, and (WS2 §6) the Grand Tour overture draws its distinct-anchor lit thread, flies the real camera, auto-advances, yields to a real hand on the wheel, and degrades under reduced motion — none of which the pure-Node twins can see.');
    process.exit(exitCode);
  } else {
    console.log('FAIL — ' + fail + ' live-DOM check(s) failed: the platewalk is NOT wired as the rendered page claims. The headless twins cannot see this — that is why this gate exists.');
    process.exit(1);
  }
}

main().catch(e => { console.error('  ⚠ gate-dom.test harness error:', e); process.exit(2); });
