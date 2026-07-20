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
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import zlib from 'node:zlib';
import { tmpdir } from 'node:os';

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

// ── WS4 SEASONAL-DRESSING readers (§2, §8.4 a–e,h–l — r17 drawn trees + cartouche) ──
// The dressing signature at the CURRENT page: the wash rect fill/opacity, the drawn-tree
// glyph counts (bare .cal-tree-st structure · .cal-crown seasonal fill · .cal-snow winter
// cap · .cal-bloom spring marks · .cal-leaf autumn leaves), the first crown's resolved
// fill (the season is LIVE in the drawn layer), the seasonal cartouche #cal-motif presence
// + an innerHTML fingerprint (season-varying across the bell dates), and the recede check
// (§8.4-k: no #cal-dressing element resolves fill/stroke to the primary brass). One read.
function dressingRead() {
  return abEval(`(function(){
    function h2rgb(h){ return 'rgb('+parseInt(h.slice(1,3),16)+', '+parseInt(h.slice(3,5),16)+', '+parseInt(h.slice(5,7),16)+')'; }
    var BRASS=[h2rgb('#c9a24a'), h2rgb('#f0d489')];
    var d=document.getElementById('cal-dressing');
    var w=document.getElementById('cal-wash');
    var m=document.getElementById('cal-motif');
    var hb=document.getElementById('hours-back');
    var order=null;                          // is #cal-dressing before #hours-back in document order?
    if(d&&hb&&d.parentNode===hb.parentNode){
      var kids=Array.prototype.slice.call(d.parentNode.childNodes);
      order = kids.indexOf(d) < kids.indexOf(hb);
    }
    // (k) structural: no #cal-dressing element resolves fill/stroke to the primary brass.
    var brassHit=0;
    if(d){ var all=d.querySelectorAll('*');
      for(var i=0;i<all.length;i++){ var g=getComputedStyle(all[i]);
        if(BRASS.indexOf(g.fill)>=0 || BRASS.indexOf(g.stroke)>=0) brassHit++; } }
    // a djb2 fingerprint of the motif's innerHTML (season-varying across the bell dates).
    var ms=m?m.innerHTML:'', mh=5381; for(var j=0;j<ms.length;j++){ mh=(((mh*33)>>>0)^ms.charCodeAt(j))>>>0; }
    var cr=d?d.querySelector('.cal-crown'):null;   // the season-live crown fill (D.foliage)
    // (h) r19 fix-3: the cartouche motif must NOT hide behind fixed chrome. Test the motif inner
    // <g>'s SCREEN-space bbox centre against the three chrome element rects (#doortest self-test
    // chip · #cal-airbox affordance · .pzctl controls) in the same client frame — same math the
    // build's CHROME_BOXES avoidance uses, read back independently. null ⇒ clear of all chrome.
    var motifChrome=null;
    if(m){ var mg=m.querySelector('g');
      if(mg){ var mb=mg.getBoundingClientRect(), mcx=mb.left+mb.width/2, mcy=mb.top+mb.height/2;
        [['#doortest',document.getElementById('doortest')],
         ['#cal-airbox',document.getElementById('cal-airbox')],
         ['.pzctl',document.querySelector('.pzctl')]].forEach(function(cp){
          var e=cp[1]; if(!e) return; var r=e.getBoundingClientRect();
          if(mcx>=r.left&&mcx<=r.right&&mcy>=r.top&&mcy<=r.bottom) motifChrome=cp[0]; }); } }
    return JSON.stringify({
      present:!!d,
      pe: d?getComputedStyle(d).pointerEvents:null,
      texts: d?d.querySelectorAll('text').length:-1,
      beforeHoursBack: order,
      washFill: w?w.getAttribute('fill'):null,
      washOpacity: w?w.getAttribute('opacity'):null,
      trees: document.querySelectorAll('circle.avenue-tree').length,
      struct: d?d.querySelectorAll('.cal-tree-st').length:0,
      crown: d?d.querySelectorAll('.cal-crown').length:0,
      snow: d?d.querySelectorAll('.cal-snow').length:0,
      bloom: d?d.querySelectorAll('.cal-bloom').length:0,
      leaf: d?d.querySelectorAll('.cal-leaf').length:0,
      crownFill: cr?getComputedStyle(cr).fill:null,
      motif:!!m, motifHash:mh, motifLen:ms.length, motifChrome:motifChrome,
      brassHit:brassHit });
  })()`);
}
// §3.4 the front-door mark reader: is #cal-day present, and if so is it a lone <a>, is it
// #brassdock's FIRST child, where does it link, and what is its composed text? On a plain
// (non-mark) day the element must not exist at all (B6 decorate-never-gate).
function calDayRead() {
  return abEval(`(function(){
    var dock=document.getElementById('brassdock');
    var m=document.getElementById('cal-day');
    if(!m) return JSON.stringify({present:false, dockKids: dock?dock.children.length:-1});
    return JSON.stringify({
      present:true,
      tag: m.tagName.toLowerCase(),
      first: !!(dock && dock.firstElementChild===m),
      href: m.getAttribute('href'),
      text: m.textContent,
      count: document.querySelectorAll('#cal-day').length,
      color: getComputedStyle(m).color });
  })()`);
}
// the primary on-screen estate labels as SCREEN-pixel rects (getBoundingClientRect at
// deviceScaleFactor 1 ⇒ PNG px), for the §8.4-(l) label-contrast sample: the estate-tier
// district NAME glyphs (the `.zone-label` texts — THE MANOR HOUSE / THE FAIRGROUND / THE
// NUMBER GARDEN / … — the "primary label glyphs" §8.4-l names). Deterministic per build.
// (At the estate fit-view these are ~50–80px wide × ~5px tall, so no tall-box filter.)
function labelRects() {
  return abEval(`(function(){
    var vp=document.getElementById('viewport'), ts=vp.querySelectorAll('text.zone-label'), out=[];
    for(var i=0;i<ts.length;i++){ var t=ts[i], cs=getComputedStyle(t);
      if(cs.display==='none' || cs.visibility==='hidden' || +cs.opacity<=0) continue;
      var r=t.getBoundingClientRect();
      if(r.width>=30 && r.height>=3 && r.width<600)
        out.push({ x:r.left, y:r.top, w:r.width, h:r.height, area:r.width*r.height,
          txt:(t.textContent||'').trim().slice(0,24) });
    }
    out.sort(function(a,b){ return b.area-a.area; });
    return JSON.stringify(out.slice(0,8));
  })()`);
}
// mask / restore the WHOLE dressing layer — including channel A's #cal-wash — for the
// §8.4-(l) "undressed" reference: the wash is precisely what erodes label contrast, so the
// undressed plate must remove it.
function maskDressing(on) {
  return abEval(`(function(){ var d=document.getElementById('cal-dressing');
    if(d) d.style.display=${on ? "'none'" : "''"}; return JSON.stringify({ok:!!d}); })()`);
}
// mask / restore ONLY the DECORATION subgroups (#cal-trees + #cal-motif), NEVER the whole
// #cal-dressing — for the §8.4-(k) pixel guard (r18). Masking the whole layer would remove the
// SP-SEE-approved full-plate #cal-wash (whose job is to tint every pixel) and drop brightest-
// quartile luminance ~72% because of the WASH, not the decoration; hiding only the decoration
// isolates whether the trees/motif compete for the bright ink (measured ~0.6% ⇒ they recede).
function maskDeco(on) {
  return abEval(`(function(){ var found=0;
    ['cal-trees','cal-motif'].forEach(function(id){ var e=document.getElementById(id);
      if(e){ e.style.display=${on ? "'none'" : "''"}; found++; } });
    return JSON.stringify({ok:found}); })()`);
}
// a cheap byte-fidelity fingerprint of #cal-dressing.innerHTML (djb2) for the
// double-load determinism check (§8.4-e) — same len + same hash ⇒ byte-identical.
function dressingHTMLHash() {
  return abEval(`(function(){
    var d=document.getElementById('cal-dressing'); var s=d?d.innerHTML:'';
    var h=5381; for(var i=0;i<s.length;i++){ h=(((h*33)>>>0)^s.charCodeAt(i))>>>0; }
    return JSON.stringify({ hash:h, len:s.length });
  })()`);
}
// §8.4-(i): the gate INDEPENDENTLY re-implements §2.2-C's worldBox CTM composition
// (never reads the build's own values), FIRST proves the basis really is world space
// (some labelgroup text box centre > 200 units from the origin — the r3-F1 failure
// signature is every box clustered at the local origin), then asserts no DECORATION
// element (.cal-crown fill · .cal-snow cap · .cal-bloom mark · .cal-leaf · every #cal-motif
// sub-glyph) comes within 2px of any text world box. Bare .cal-tree-st trunk/branch
// structure is EXEMPT (thin line-art at planted ground — the read the basemap always carried).
function clearanceRead() {
  return abEval(`(function(){
    var vp=document.getElementById('viewport');
    var invVP=vp.getScreenCTM().inverse();
    function worldBox(elm){
      var bb=elm.getBBox();
      var M=invVP.multiply(elm.getScreenCTM());
      var xs=[],ys=[],px,py,q;
      var cs=[[bb.x,bb.y],[bb.x+bb.width,bb.y],[bb.x,bb.y+bb.height],[bb.x+bb.width,bb.y+bb.height]];
      for(q=0;q<4;q++){ px=cs[q][0]; py=cs[q][1]; xs.push(M.a*px+M.c*py+M.e); ys.push(M.b*px+M.d*py+M.f); }
      var x0=Math.min.apply(0,xs),y0=Math.min.apply(0,ys);
      return { x:x0,y:y0,w:Math.max.apply(0,xs)-x0,h:Math.max.apply(0,ys)-y0 };
    }
    // r19: the draw clears VISIBLE labels ONLY (isHiddenLabel skip — the hidden loupe/room
    // captions are invisible ink a crown may pass under), so the clearance basis is the VISIBLE
    // text set, re-implemented here to match §2.2's predicate (computed display:none /
    // visibility:hidden / opacity 0 on the element or any ancestor). Checking against hidden
    // boxes would flag the intentional near-hidden-label decoration (T4.1 named (i) as an interim
    // red for exactly this: "old gate clears ALL texts, r19 clears VISIBLE only").
    function isHiddenLabel(t){
      try{ for(var n=t; n && n.nodeType===1; n=n.parentNode){
        var cs=window.getComputedStyle(n); if(!cs) continue;
        if(cs.display==='none' || cs.visibility==='hidden') return true;
        if(parseFloat(cs.opacity)===0) return true; } }catch(e){}
      return false;
    }
    var texts=vp.querySelectorAll('text'), boxes=[], maxCenterDist=0;
    for(var j=0;j<texts.length;j++){
      if(isHiddenLabel(texts[j])) continue;                // r19: VISIBLE ink only
      try{ var b=worldBox(texts[j]); boxes.push(b);
        var ccx=b.x+b.w/2, ccy=b.y+b.h/2, dd=Math.sqrt(ccx*ccx+ccy*ccy);
        if(dd>maxCenterDist) maxCenterDist=dd; }catch(e){}
    }
    // a decoration world box is a violation if it comes within 2px of ANY text box.
    function tooClose(D){
      for(var k=0;k<boxes.length;k++){ var L=boxes[k];
        if(D.x-2 < L.x+L.w && D.x+D.w+2 > L.x && D.y-2 < L.y+L.h && D.y+D.h+2 > L.y) return true; }
      return false;
    }
    var deco=vp.querySelectorAll('#cal-dressing .cal-crown, #cal-dressing .cal-snow, #cal-dressing .cal-bloom, #cal-dressing .cal-leaf, #cal-motif *');
    var violations=0, nDeco=0;
    for(var i=0;i<deco.length;i++){
      try{ var wb=worldBox(deco[i]); nDeco++; if(tooClose(wb)) violations++; }catch(e){}
    }
    return JSON.stringify({ nTexts:boxes.length, nDeco:nDeco,
      maxCenterDist:maxCenterDist, violations:violations });
  })()`);
}

// ── §8.4-(j): a minimal zero-dependency PNG decoder (the repo's png.js is a WRITER
//    only). 8-bit, colourType 2 (RGB) or 6 (RGBA); concatenated IDAT → inflate → per-row
//    unfilter for the 5 standard filter types. Then the brightest-quartile mean ink. ──
function paeth(a, b, c) {
  var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
}
function decodePNG(file) {
  var buf = readFileSync(file);
  var off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, idat = [];
  while (off + 8 <= buf.length) {
    var len = buf.readUInt32BE(off);
    var type = buf.toString('ascii', off + 4, off + 8);
    var data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') { idat.push(data); }
    else if (type === 'IEND') { break; }
    off += 12 + len;
  }
  var channels = colorType === 6 ? 4 : (colorType === 2 ? 3 : 0);
  if (bitDepth !== 8 || channels === 0) throw new Error('unsupported PNG bitDepth=' + bitDepth + ' colorType=' + colorType);
  var raw = zlib.inflateSync(Buffer.concat(idat));
  var stride = width * channels, out = Buffer.alloc(height * stride), pos = 0;
  for (var y = 0; y < height; y++) {
    var ft = raw[pos++];
    for (var x = 0; x < stride; x++) {
      var rb = raw[pos++];
      var a = x >= channels ? out[y * stride + x - channels] : 0;         // left
      var b = y > 0 ? out[(y - 1) * stride + x] : 0;                      // up
      var c = (x >= channels && y > 0) ? out[(y - 1) * stride + x - channels] : 0; // up-left
      var val;
      if (ft === 0) val = rb; else if (ft === 1) val = rb + a; else if (ft === 2) val = rb + b;
      else if (ft === 3) val = rb + ((a + b) >> 1); else if (ft === 4) val = rb + paeth(a, b, c);
      else throw new Error('bad PNG filter ' + ft);
      out[y * stride + x] = val & 0xFF;
    }
  }
  return { width: width, height: height, channels: channels, data: out };
}
// mean RGB over the brightest quartile of pixels (ranked by R+G+B — the light INK, not
// the near-black paper), via a 0..765 histogram threshold (no million-element sort).
function brightestQuartileWarmth(png) {
  var n = png.width * png.height, ch = png.channels, data = png.data, hist = new Uint32Array(766), i, o;
  for (i = 0; i < n; i++) { o = i * ch; hist[data[o] + data[o + 1] + data[o + 2]]++; }
  var target = Math.floor(n * 0.75), acc = 0, thr = 765;
  for (var v = 0; v < 766; v++) { acc += hist[v]; if (acc >= target) { thr = v; break; } }
  var sr = 0, sg = 0, sb = 0, cnt = 0;
  for (i = 0; i < n; i++) { o = i * ch; if (data[o] + data[o + 1] + data[o + 2] >= thr) { sr += data[o]; sg += data[o + 1]; sb += data[o + 2]; cnt++; } }
  return { r: sr / cnt, g: sg / cnt, b: sb / cnt, rmb: (sr - sb) / cnt };
}
// sRGB relative luminance (WCAG) of an 8-bit RGB triple, 0..1 (§8.4-k/l).
function relLum(r, g, b) {
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
// §8.4-(k): mean relative luminance of the brightest quartile of a PNG (the light ink).
function brightestQuartileLum(png) {
  var n = png.width * png.height, ch = png.channels, data = png.data, hist = new Uint32Array(766), i, o;
  for (i = 0; i < n; i++) { o = i * ch; hist[data[o] + data[o + 1] + data[o + 2]]++; }
  var target = Math.floor(n * 0.75), acc = 0, thr = 765;
  for (var v = 0; v < 766; v++) { acc += hist[v]; if (acc >= target) { thr = v; break; } }
  var sl = 0, cnt = 0;
  for (i = 0; i < n; i++) { o = i * ch; if (data[o] + data[o + 1] + data[o + 2] >= thr) { sl += relLum(data[o], data[o + 1], data[o + 2]); cnt++; } }
  return cnt ? sl / cnt : 0;
}
// §8.4-(l): the label-to-background contrast in a SCREEN-pixel region. The label ink is the
// brightest quartile of the region, the local background the darkest half (paper+wash); the
// WCAG contrast ratio (L_light+0.05)/(L_dark+0.05). Returns null for a too-small region.
function regionContrast(png, x, y, w, h) {
  var X0 = Math.max(0, Math.floor(x)), Y0 = Math.max(0, Math.floor(y));
  var X1 = Math.min(png.width, Math.ceil(x + w)), Y1 = Math.min(png.height, Math.ceil(y + h));
  var ch = png.channels, data = png.data, sums = [], px, py, o;
  for (py = Y0; py < Y1; py++) for (px = X0; px < X1; px++) { o = (py * png.width + px) * ch; sums.push({ s: data[o] + data[o + 1] + data[o + 2], o: o }); }
  if (sums.length < 8) return null;
  sums.sort(function (a, b) { return a.s - b.s; });
  var qN = Math.max(1, Math.floor(sums.length * 0.25)), hN = Math.max(1, Math.floor(sums.length * 0.5));
  var Ll = 0, cl = 0, Ld = 0, cd = 0, k, e;
  for (k = sums.length - qN; k < sums.length; k++) { e = sums[k].o; Ll += relLum(data[e], data[e + 1], data[e + 2]); cl++; }  // brightest quartile = ink
  for (k = 0; k < hN; k++) { e = sums[k].o; Ld += relLum(data[e], data[e + 1], data[e + 2]); cd++; }                          // darkest half = local bg
  var Lli = Ll / cl, Ldi = Ld / cd;
  return (Math.max(Lli, Ldi) + 0.05) / (Math.min(Lli, Ldi) + 0.05);
}

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

    // ════════════════════════════════════════════════════════════════════════════
    //  G — THE AIR'S ARM AFFORDANCE (WS4 §5.1/§5.2, DESIGN §8.4 item g). The gate rides
    //  the code it guards: it lands with the affordance so the on-ramp is never
    //  structurally unguarded between waves. The dressing's own assertions arrive with
    //  the dressing. Runs LAST because it re-opens the page on its own URLs.
    //
    //  RE-AUTHORED with the air CHIP. The affordance used to be a static two-line block
    //  written into this page by hand — a bare button plus a teaser sub-line — and these
    //  checks asserted that markup literally. It is now the shared widget air.js mounts
    //  (Air.mount), so the same rigour is aimed at the new design rather than retired:
    //  the button's identity law and its rest colours are unchanged law and still checked
    //  exactly as before; the sub-line's JOB — the explanation must not depend on a hover
    //  a touch device never performs — is now the tooltip's job, so Gb now proves the
    //  tooltip carries the whole explanation AND opens on a non-pointer path. Ge is new:
    //  the courtesy waiver the tooltip now hosts.
    // ════════════════════════════════════════════════════════════════════════════

    // Ga — a PLAIN load: the chip is structurally whole and at REST. The ♫ glyph's
    // resting colour is the BRASS TOKEN while the label text stays MUTED (§5.1 move 1's
    // split — read against the resolved custom properties, never a hard-coded hex), the
    // box is never hidden, and the button is ENABLED (the mounted button ships `disabled`
    // and air.js's attach() lifts it — "enabled IFF the conductor is wired"). The chip's
    // own new law: it is a MOUNTED widget (the page ships an empty slot, so a chip present
    // proves Air.mount ran), it wears the dark PILL the estate's self-test chips wear, and
    // it owns a tooltip that is CLOSED at rest and correctly announced to a screen reader.
    // The settle MUST outlast the glint: on a plain load move 2 fires at 2.5 s and runs
    // 1.2 s, so a shorter wait samples the ANIMATION's brass→brass-bright ramp and reads a
    // colour that is neither token. "Resting" is the steady state the keyframes return to.
    ab('open', URL); ab('wait', '--load', 'networkidle'); ab('wait', '5000');
    const g0 = abEval(`(function(){
      var cs=getComputedStyle(document.documentElement);
      function tok(n){ var d=document.createElement('span'); d.style.color=cs.getPropertyValue(n).trim();
        document.body.appendChild(d); var v=getComputedStyle(d).color; d.remove(); return v; }
      var box=document.getElementById('cal-airbox'), btn=document.getElementById('cal-air'),
          g=btn&&btn.querySelector('.g'), wrap=box&&box.querySelector('.air-chip'),
          tip=document.getElementById('cal-air-tip'), ts=tip?getComputedStyle(tip):null,
          bs=btn?getComputedStyle(btn):null;
      return JSON.stringify({
        box:!!box, btn:!!btn, glyph:g?g.textContent:null,
        kids: btn?Array.prototype.map.call(btn.childNodes,function(n){ return n.nodeType===1?n.nodeName.toLowerCase()+'.'+n.className:'#text'; }):null,
        glyphColor:g?getComputedStyle(g).color:null, brass:tok('--brass'),
        labelColor:btn?bs.color:null, muted:tok('--muted'),
        boxOpacity:box?getComputedStyle(box).opacity:null,
        pressed:btn?btn.getAttribute('aria-pressed'):null, disabled:btn?btn.disabled:null,
        inDock:!!(box&&box.parentElement&&box.parentElement.id==='brassdock'),
        aria:btn?btn.getAttribute('aria-label'):null,
        /* the widget's own structure */
        mounted:!!wrap, btnInWrap:!!(wrap&&btn&&btn.parentElement===wrap),
        chipClass:btn?btn.className:null, styled:!!document.getElementById('air-chip-style'),
        radius:bs?bs.borderTopLeftRadius:null, borderW:bs?bs.borderTopWidth:null,
        label:btn?(btn.textContent||'').replace(/\\s+/g,' ').trim():null,
        tip:!!tip, tipRole:tip?tip.getAttribute('role'):null,
        described:btn?btn.getAttribute('aria-describedby'):null,
        tipVis:ts?ts.visibility:null, tipOp:ts?ts.opacity:null,
        open:!!(wrap&&wrap.classList.contains('open')) });
    })()`);
    check('Ga — the air CHIP rests whole (mounted into #cal-airbox in #brassdock, button children EXACTLY [span.g, text], the ♫ glyph brass while the label stays muted, a dark pill carrying its own stylesheet, aria-pressed=false, enabled by the conductor, tooltip present and CLOSED)',
      g0.box === true && g0.btn === true && g0.glyph === '♫' &&
      JSON.stringify(g0.kids) === JSON.stringify(['span.g', '#text']) &&
      g0.glyphColor === g0.brass && g0.labelColor === g0.muted &&
      g0.boxOpacity === '1' && g0.pressed === 'false' && g0.disabled === false &&
      g0.inDock === true && typeof g0.aria === 'string' && g0.aria.length > 0 &&
      g0.mounted === true && g0.btnInWrap === true && g0.chipClass === 'air-chip-btn' &&
      g0.styled === true && parseFloat(g0.radius) >= 12 && parseFloat(g0.borderW) > 0 &&
      /give the estate its air/.test(g0.label || '') &&
      g0.tip === true && g0.tipRole === 'tooltip' && g0.described === 'cal-air-tip' &&
      g0.tipVis === 'hidden' && g0.tipOp === '0' && g0.open === false,
      '[glyph=' + g0.glyph + ', kids=' + JSON.stringify(g0.kids) + ', glyphColor=' + g0.glyphColor +
      ' (brass=' + g0.brass + '), label=' + g0.labelColor + ' (muted=' + g0.muted + '), opacity=' + g0.boxOpacity +
      ', disabled=' + g0.disabled + ', mounted=' + g0.mounted + ', radius=' + g0.radius +
      ', tip=' + g0.tip + '/' + g0.tipVis + '/' + g0.tipOp + ']');

    // Gb — THE CARD CARRIES THE WHOLE EXPLANATION, and a REAL HOVER opens it. Opened with
    // agent-browser `hover` — a genuine CDP Input.dispatchMouseEvent mouseMoved to the
    // element's painted centre, not a synthetic dispatch, which is the only kind of hover
    // that exercises the real pointerenter path. The teaser sub-line the old affordance
    // carried is gone, so this card must be the whole explanation and not a fragment of
    // one: the prose, a live `now:` register, the season, today's figure, the
    // third-and-key gloss, and the every-day Almanac link. Gc proves the NON-hover path.
    ab('hover', '#cal-air'); ab('wait', '400');
    const gb = abEval(`(function(){
      var wrap=document.querySelector('.air-chip'), card=document.querySelector('.air-chip-card'),
          tip=document.getElementById('cal-air-tip'), ts=tip?getComputedStyle(tip):null,
          st=document.querySelector('.air-chip-state'), fg=document.querySelector('.air-chip-fig');
      return JSON.stringify({
        open:!!(wrap&&wrap.classList.contains('open')),
        vis:ts?ts.visibility:null, op:ts?ts.opacity:null,
        text:card?(card.textContent||'').replace(/\\s+/g,' ').trim():null,
        now:st?(st.textContent||'').replace(/\\s+/g,' ').trim():null,
        fig:fg?(fg.textContent||'').replace(/\\s+/g,' ').trim():null,
        link:(function(){ var a=card&&card.querySelector('.air-chip-more a');
          return a?a.getAttribute('href'):null; })() });
    })()`);
    check('Gb — a REAL input-level HOVER opens the chip\'s card, and the card carries the WHOLE explanation — the prose, a live `now:` register, the season, today\'s figure, the bright/dark-third gloss, and the a[href="hours/almanac.html"] link',
      gb.open === true && gb.vis === 'visible' && gb.op === '1' &&
      /THE AIR — the estate can hum/.test(gb.text || '') &&
      /It never plays unasked/.test(gb.text || '') &&
      /^now:/.test(gb.now || '') && (gb.now || '').length > 20 &&
      /today’s figure is|today's figure is/.test(gb.fig || '') &&
      /The bright third is the major third/.test(gb.text || '') &&
      gb.link === 'hours/almanac.html',
      '[open=' + gb.open + '/' + gb.vis + '/' + gb.op + ', now="' + (gb.now || '') +
      '", fig="' + (gb.fig || '') + '", link=' + gb.link + ']');

    // Gc — a REAL input click ARMS, and — THE TOUCH-SURVIVAL LAW (soul r1-M3, re-aimed) —
    // opens the same card WITHOUT ANY HOVER. The old affordance discharged that law with a
    // static sub-line, because a touch device never hovers and a tooltip-only explanation
    // would be no explanation at all for it. The chip discharges it because a tap both
    // arms the air and opens the card that says what just happened: one gesture, both
    // outcomes. The pointer is parked FAR from the chip first, so nothing here can be a
    // leftover of Gb's hover — the card must be re-opened by the click alone.
    //
    // Also: aria-pressed toggles, the glyph turns ♪, the label and the accessible name
    // become the PLAYING row, and the click NEVER navigates or descends (the chip is fixed
    // HTML outside the SVG, so it can steal no map hit-test). The box stays fully visible —
    // opacity 1 at ALL times. The identity law is the load-bearing one: the conductor may
    // write CHARACTER DATA into the glyph span and the text node, never structure, or the
    // glint animation loses the element it animates.
    const hrefBefore = abEval(`JSON.stringify({ href: location.href })`).href;
    ab('mouse', 'move', '700', '80'); ab('wait', '350');
    const gcShut = abEval(`(function(){ var w=document.querySelector('.air-chip');
      return JSON.stringify({ open:!!(w&&w.classList.contains('open')) }); })()`);
    check('Gc(pre) — moving the real pointer AWAY closes the card again (the hover state is honest, not a one-way latch)',
      gcShut.open === false, '[open=' + gcShut.open + ']');
    realClick('#cal-air');
    ab('wait', '900');
    const g1 = abEval(`(function(){
      var btn=document.getElementById('cal-air'), box=document.getElementById('cal-airbox'),
          g=btn&&btn.querySelector('.g'), vp=document.getElementById('viewport'),
          wrap=box&&box.querySelector('.air-chip');
      return JSON.stringify({
        pressed:btn?btn.getAttribute('aria-pressed'):null, glyph:g?g.textContent:null,
        glyphAlive:!!(g&&g.parentElement===btn),
        kids: btn?Array.prototype.map.call(btn.childNodes,function(n){ return n.nodeType===1?n.nodeName.toLowerCase()+'.'+n.className:'#text'; }):null,
        label:btn?(btn.textContent||'').replace(/\\s+/g,' ').trim():null,
        aria:btn?btn.getAttribute('aria-label'):null,
        stillMounted:!!(wrap&&document.getElementById('cal-air-tip')),
        opened:!!(wrap&&wrap.classList.contains('open')),
        cardText:(function(){ var c=document.querySelector('.air-chip-card');
          return c?(c.textContent||'').replace(/\\s+/g,' ').trim():null; })(),
        boxOpacity:box?getComputedStyle(box).opacity:null,
        href:location.href, lod:vp?(/lod-estate/.test(vp.getAttribute('class')||'')?'estate':'other'):null });
    })()`);
    check('Gc — a REAL click on #cal-air toggles aria-pressed false→true, re-labels to ♪ + the PLAYING row (text and accessible name) WITHOUT destroying the glyph span (the identity law: character data only), leaves the chip and its tooltip mounted, never navigates, never descends, and #cal-airbox stays opacity 1',
      g1.pressed === 'true' && g1.glyph === '♪' && g1.glyphAlive === true &&
      JSON.stringify(g1.kids) === JSON.stringify(['span.g', '#text']) &&
      /the air plays/.test(g1.label || '') && /the air is playing/.test(g1.aria || '') &&
      g1.stillMounted === true &&
      g1.boxOpacity === '1' && g1.href === hrefBefore && g1.lod === 'estate',
      '[pressed=' + g1.pressed + ', glyph=' + g1.glyph + ', kids=' + JSON.stringify(g1.kids) +
      ', label="' + (g1.label || '') + '", opacity=' + g1.boxOpacity + ', lod=' + g1.lod +
      ', navigated=' + (g1.href !== hrefBefore) + ']');
    check('Gc(touch-survival) — that SAME click, with the pointer parked far away and no hover anywhere in it, ALSO opened the card carrying the full explanation: a tap arms the air and explains itself in one gesture, so the on-ramp never depends on a hover a touch device cannot perform',
      g1.opened === true && /THE AIR — the estate can hum/.test(g1.cardText || '') &&
      /The bright third is the major third/.test(g1.cardText || ''),
      '[opened=' + g1.opened + ', card="' + (g1.cardText || '').slice(0, 90) + '…"]');

    // Gd — THE CANON SEES PURE REST: under ?hours=allon no glint arm is installed at all,
    // so the `glint` class never appears — polled ACROSS the whole settle wait (the primary
    // arm is a 2.5 s beat, its deferral at most ~3.1 s), never sampled once at the end.
    // Every canon screenshot is therefore bit-stable against an animation that never runs.
    ab('open', URL + '?hours=allon'); ab('wait', '--load', 'networkidle');
    let glintSeen = false, polls = 0;
    for (let i = 0; i < 9; i++) {
      ab('wait', '500'); polls++;
      const q = abEval(`(function(){ var b=document.getElementById('cal-airbox');
        return JSON.stringify({ glint: !!(b && b.classList.contains('glint')), box: !!b }); })()`);
      if (q.glint) { glintSeen = true; break; }
    }
    check('Gd — with ?hours=allon the `glint` class NEVER appears through the settle wait (no arm is installed under the canon pin — canon screenshots see pure rest)',
      glintSeen === false, '[polled ' + polls + '× across ~' + (polls * 0.5) + 's, glint seen=' + glintSeen + ']');

    // Ge — THE COURTESY WAIVER. A hidden tab stills the air; the waiver is the visitor
    // asking us to keep humming while they work elsewhere. Three things must hold, and
    // each is a way this could quietly go wrong: it must be OPT-IN (default off, or the
    // estate follows people into other windows uninvited); it must persist through WS's
    // ONE shared ws:pref key rather than a private localStorage touch (or a visitor would
    // have to set it per page); and a flip must NOTIFY subscribers — including on another
    // estate tab — because several tabs open at once is the entire use case. The checkbox
    // is driven by a REAL input click on the rendered control, never a synthetic change.
    ab('open', URL); ab('wait', '--load', 'networkidle'); ab('wait', '2500');
    abEval(`(function(){ try{ localStorage.removeItem('ws:pref:air-bg'); }catch(e){} return JSON.stringify({}); })()`);
    ab('hover', '#cal-air'); ab('wait', '350');
    const ge0 = abEval(`(function(){
      var cb=document.querySelector('.air-chip-bg');
      return JSON.stringify({ present:!!cb, checked:cb?!!cb.checked:null,
        stored:(function(){ try{ return localStorage.getItem('ws:pref:air-bg'); }catch(e){ return 'ERR'; } })(),
        ws:(typeof WS!=='undefined'&&WS.airBackground)?WS.airBackground():null,
        api:(typeof WS!=='undefined')&&typeof WS.setAirBackground==='function'&&typeof WS.onAirBackgroundChange==='function',
        note:(function(){ var p=document.querySelector('.air-chip-pref');
          return p?(p.textContent||'').replace(/\\s+/g,' ').trim():null; })() });
    })()`);
    // subscribe BEFORE the click, then click the real control and read what fired.
    abEval(`(function(){ window.__bgSeen=[];
      try{ WS.onAirBackgroundChange(function(v){ window.__bgSeen.push(v); }); }catch(e){}
      return JSON.stringify({}); })()`);
    realClick('.air-chip-bg');
    ab('wait', '400');
    const ge1 = abEval(`(function(){
      var cb=document.querySelector('.air-chip-bg');
      return JSON.stringify({ checked:cb?!!cb.checked:null,
        stored:(function(){ try{ return localStorage.getItem('ws:pref:air-bg'); }catch(e){ return 'ERR'; } })(),
        ws:(typeof WS!=='undefined'&&WS.airBackground)?WS.airBackground():null,
        fired:window.__bgSeen||null,
        air:(typeof Air!=='undefined'&&Air.background)?Air.background():null });
    })()`);
    // the CROSS-TAB path: a `storage` event is what another estate tab's write looks like
    // from in here, and it must drive the same subscribers (this is why the listener in
    // ws.js is load-bearing, not boilerplate).
    const ge2 = abEval(`(function(){
      window.__bgSeen=[];
      try{ localStorage.setItem('ws:pref:air-bg','0'); }catch(e){}
      var ev;
      try{ ev=new StorageEvent('storage',{key:'ws:pref:air-bg',oldValue:'1',newValue:'0'}); }
      catch(e){ ev=document.createEvent('Event'); ev.initEvent('storage',false,false); ev.key='ws:pref:air-bg'; }
      window.dispatchEvent(ev);
      var cb=document.querySelector('.air-chip-bg');
      return JSON.stringify({ fired:window.__bgSeen||null, checked:cb?!!cb.checked:null,
        ws:(typeof WS!=='undefined'&&WS.airBackground)?WS.airBackground():null });
    })()`);
    check('Ge — the courtesy waiver is OPT-IN, lives in WS\'s ONE shared ws:pref:air-bg key, and NOTIFIES: it rests unchecked with nothing stored; a REAL click on the tooltip\'s control writes \'1\' through WS and fires subscribers; and a cross-tab `storage` write drives the same subscribers AND re-checks the rendered box, so several estate tabs never disagree',
      ge0.present === true && ge0.checked === false && ge0.stored === null &&
      ge0.ws === false && ge0.api === true && /keep the air playing/.test(ge0.note || '') &&
      ge1.checked === true && ge1.stored === '1' && ge1.ws === true &&
      Array.isArray(ge1.fired) && ge1.fired.length >= 1 && ge1.fired[ge1.fired.length - 1] === true &&
      ge1.air === true &&
      Array.isArray(ge2.fired) && ge2.fired.length >= 1 && ge2.fired[ge2.fired.length - 1] === false &&
      ge2.checked === false && ge2.ws === false,
      '[rest: present=' + ge0.present + ' checked=' + ge0.checked + ' stored=' + ge0.stored + ' api=' + ge0.api +
      ' | click: checked=' + ge1.checked + ' stored=' + ge1.stored + ' fired=' + JSON.stringify(ge1.fired) +
      ' | cross-tab: fired=' + JSON.stringify(ge2.fired) + ' checked=' + ge2.checked + ']');

    // ════════════════════════════════════════════════════════════════════════════
    //  THE SEASONAL DRESSING (WS4 §2, DESIGN §8.4 items a–e, g-wash, h–l — r17 DRAWN TREES
    //  + CARTOUCHE MOTIF). The dressing renders ONCE at load and holds (§2.6 — no
    //  timers/listeners): these assertions prove the season is LIVE in the DRAWN layer
    //  (crowns / snow-crown / blossom / falling leaves / a season-varying #cal-motif — not
    //  a bare attribute), that every drawn decoration stays clear of the solved labels IN
    //  WORLD SPACE (the legibility model-proxy gate is blind to this), that the season
    //  really turns in RENDERED pixels, that the decoration RECEDES behind the brass
    //  (§8.4-k), and that the summer wash does not erode label contrast (§8.4-l). Runs on
    //  its own ?cal= URLs, so it lives here with the other page-reopening checks.
    // ════════════════════════════════════════════════════════════════════════════

    // (a) — the dressing group is structurally whole and inert: it exists, computes
    //       pointer-events:none, holds ZERO <text>, and sits BEFORE #hours-back so the
    //       night wash still darkens the season.
    ab('open', URL + '?cal=2026-12-21'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');
    const dWin = dressingRead();
    check('(a) — #cal-dressing exists · computed pointer-events:none · zero <text> · before #hours-back in document order',
      dWin.present === true && dWin.pe === 'none' && dWin.texts === 0 && dWin.beforeHoursBack === true,
      '[present=' + dWin.present + ', pe=' + dWin.pe + ', texts=' + dWin.texts + ', beforeHoursBack=' + dWin.beforeHoursBack + ']');

    // (b) — with the WINTER layer mounted the estate tier still rests exactly as claimed
    //       (gate-dom :340-349's values): structures shown, room/wing folded to 0.
    const restWin = state();
    check('(b) — LOD at rest is UNCHANGED with the season layer mounted (lod-estate · structOp>0.9 · room/wing 0)',
      restWin.lod === 'estate' && restWin.structOp > 0.9 && restWin.roomOp === 0 && restWin.wingOp === 0,
      '[lod=' + restWin.lod + ', structOp=' + restWin.structOp + ', roomOp=' + restWin.roomOp + ', wingOp=' + restWin.wingOp + ']');

    // (c) — the gate open-arch void STILL catches a real click with the dressing mounted:
    //       the pointer-events:none layer intercepts nothing (the D4b real descend above
    //       already drove the load-bearing path — this re-asserts it under a live season).
    const gHitWin = hitTest(GATE, 0.5, 0.30, '.gate-face');
    check('(c) — the gate open-arch void STILL catches a real click with the dressing mounted (pointer-events:none layer steals no hit; D4b proved the descend path)',
      gHitWin.found && gHitWin.inWant, '[hit ' + gHitWin.tag + ']');

    // (d) — (r17) the season is really LIVE in the DRAWN layer: winter vs summer differ in
    //       the wash (fill or opacity) AND in the drawn crown-fill colour AND in the active
    //       #cal-motif sub-glyph — not merely an attribute; (a) holds at BOTH dates.
    ab('open', URL + '?cal=2026-06-21'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');
    const dSum = dressingRead();
    check('(d) — ?cal=2026-12-21 vs 2026-06-21: the season is LIVE in the DRAWN layer — #cal-wash differs AND the .cal-crown fill differs AND the #cal-motif sub-glyph differs; (a) holds at both',
      dSum.present === true && dSum.pe === 'none' && dSum.texts === 0 && dSum.beforeHoursBack === true &&
      (dWin.washFill !== dSum.washFill || dWin.washOpacity !== dSum.washOpacity) &&
      dWin.crownFill !== dSum.crownFill && dWin.motif === true && dSum.motif === true &&
      dWin.motifHash !== dSum.motifHash,
      '[winter wash=' + dWin.washFill + '/' + dWin.washOpacity + ' crown=' + dWin.crownFill + ' motif#' + dWin.motifHash +
      ' · summer wash=' + dSum.washFill + '/' + dSum.washOpacity + ' crown=' + dSum.crownFill + ' motif#' + dSum.motifHash + ']');

    // (e) — determinism: two loads at the SAME ?cal= give byte-identical #cal-dressing
    //       innerHTML (the only randomness is the date-seeded mulberry32 — §2.5).
    const h1 = dressingHTMLHash();
    ab('open', URL + '?cal=2026-06-21'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');
    const h2 = dressingHTMLHash();
    check('(e) — two loads at ?cal=2026-06-21 give byte-identical #cal-dressing.innerHTML (deterministic dressing)',
      h1.len === h2.len && h1.hash === h2.hash && h1.len > 0,
      '[len ' + h1.len + '/' + h2.len + ', hash ' + h1.hash + '/' + h2.hash + ']');

    // (f) — (§3.4) THE FRONT-DOOR MARK exists ONLY on a mark day. At ?cal=2027-06-07 (the
    //       first Founding anniversary — marksFor stacks founding + one wing) a lone
    //       <a id=cal-day> is #brassdock's FIRST child, links hours/almanac.html, and its text
    //       is marksFor[0] rendered verbatim (glyph + fully-composed line) with the composition
    //       tail " · the Almanac holds one more". At the plain ?cal=2026-08-01 the element does
    //       NOT exist at all (B6 §3.6 decorate-never-gate: nothing appears/disappears but the
    //       mark itself). A single line, ever (querySelectorAll('#cal-day') === 1 on the mark day).
    ab('open', URL + '?cal=2027-06-07'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');
    const markDay = calDayRead();
    ab('open', URL + '?cal=2026-08-01'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');
    const plainDay = calDayRead();
    const FOUNDING_MARK = '✦ the Founding — the estate broke ground this day, a year ago · the Almanac holds one more';
    check('(f) — #cal-day exists ONLY on a mark day: at ?cal=2027-06-07 a lone <a id=cal-day> is the FIRST child of #brassdock, links hours/almanac.html, text = marksFor[0] verbatim + " the Almanac holds one more"; ABSENT at the plain ?cal=2026-08-01',
      markDay.present === true && markDay.tag === 'a' && markDay.first === true &&
      markDay.href === 'hours/almanac.html' && markDay.count === 1 &&
      markDay.text === FOUNDING_MARK && plainDay.present === false,
      '[mark-day present=' + markDay.present + ' tag=' + markDay.tag + ' first=' + markDay.first + ' count=' + markDay.count +
      ' href=' + markDay.href + ' text="' + markDay.text + '" · plain-day present=' + plainDay.present + ' dockKids=' + plainDay.dockKids + ']');

    // (g-wash) — the CANON pin's screenshot stability (§8.4-g's wash clause, adopted here
    //       where #cal-wash exists): under ?hours=allon the dressing forces the canon date
    //       {2026,6,21}, so #cal-wash must equal the ?cal=2026-06-21 value.
    ab('open', URL + '?hours=allon'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');
    const dCanon = dressingRead();
    check('(g-wash) — under ?hours=allon #cal-wash equals the pinned-canon {2026,6,21} value (screenshot stability)',
      dCanon.washFill === dSum.washFill && dCanon.washOpacity === dSum.washOpacity,
      '[canon wash=' + dCanon.washFill + '/' + dCanon.washOpacity + ' · 2026-06-21 wash=' + dSum.washFill + '/' + dSum.washOpacity + ']');

    // (h) — (r17) THE DRAWN TREES + MOTIF REALLY RENDER. The bare structure floor holds at
    //       every date (each planting draws ≥ its .cal-tree-st), the season features fire at
    //       their bell centres (snow-crown / blossom / falling-leaf), and #cal-motif varies
    //       across the four bell-center seasons. Read the four bell dates here; (i) rides
    //       along at each.
    ab('open', URL + '?cal=2027-01-08'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');   // snow bell centre (phase ≈ 0.80, r19)
    const snowR = dressingRead(); const clrSnow = clearanceRead();
    ab('open', URL + '?cal=2027-04-15'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');   // bloom bell (spring)
    const bloomR = dressingRead(); const clrBloom = clearanceRead();
    ab('open', URL + '?cal=2026-11-05'); ab('wait', '--load', 'networkidle'); ab('wait', '2000');   // turn bell (autumn)
    const turnR = dressingRead(); const clrTurn = clearanceRead();

    // (h-structure) — the tree-glyph count ≥ 0.85 × circle.avenue-tree at EVERY date (each
    // planting draws at least its bare --tree structure; label exclusion bares some crowns).
    const structFloorOK = d => d.trees > 0 && d.struct >= 0.85 * d.trees;
    check('(h-structure) — the drawn tree-glyph count (.cal-tree-st) ≥ 0.85 × circle.avenue-tree at all four bell dates (each planting draws at least bare --tree structure)',
      structFloorOK(dWin) && structFloorOK(dSum) && structFloorOK(snowR) && structFloorOK(bloomR) && structFloorOK(turnR),
      '[winter ' + dWin.struct + '/' + dWin.trees + ' · summer ' + dSum.struct + '/' + dSum.trees + ' · snow ' + snowR.struct + '/' + snowR.trees +
      ' · bloom ' + bloomR.struct + '/' + bloomR.trees + ' · turn ' + turnR.struct + '/' + turnR.trees + ' (floor 0.85×)]');

    // (h-features) — each season's drawn feature fires at its bell centre.
    // (h-snow) r19 — the snow caps are a SPARSE SEEDED SUBSET drawn at FULL --snow opacity,
    //   UN-gated by the crown (winter crowns are bare, so the old crown-relative floor no longer
    //   applies), with .cal-snow count TRACKING the bell (≈ D.snow × tree count). Assert at BOTH
    //   the bell CENTRE (?cal=2027-01-08, phase ≈ 0.80, D.snow ≈ 1 ⇒ near-all trees cap) AND the
    //   WINTER SOLSTICE (dWin @ ?cal=2026-12-21, phase ≈ 0.75, bell(0.75,0.80,0.16) ≈ 0.78 ⇒ most
    //   trees cap) — caps must READ at the solstice, not only at the peak (the r19 SP-SEE fix).
    check('(h-snow) r19 — full-opacity snow caps track the widened bell: .cal-snow ≥ 0.85 × tree count at the bell centre (2027-01-08) AND ≥ 0.5 × tree count at the winter solstice (2026-12-21); caps are a seeded subset un-gated by the crown',
      snowR.trees > 0 && snowR.snow >= 0.85 * snowR.trees && dWin.trees > 0 && dWin.snow >= 0.5 * dWin.trees,
      '[bell centre snow=' + snowR.snow + '/' + snowR.trees + ' (floor ' + (0.85 * snowR.trees).toFixed(1) + ') · solstice snow=' + dWin.snow + '/' + dWin.trees + ' (floor ' + (0.5 * dWin.trees).toFixed(1) + ')]');

    // (h-crown) r19.1 — GROWING-SEASON CROWNS ARE NOT BARE FROM CLEARANCE. A crown near a VISIBLE
    //   label is REDUCED (crownFit, CRMIN 8), never bared; a fully bare crown is a WINTER read
    //   only (isWinterBare, foliage α < .08). At ?cal=2026-06-21 the crown-fill count must be
    //   ≥ 0.85 × tree count (dSum read above) — r19.1 lowers the floor 0.9 → 0.85 (matches the
    //   (h-structure) 0.85 sibling): 8 avenue-trees are physically boxed by visible labels so even
    //   CRMIN 8 collides and they bare unavoidably (~12% baring). A breach is a DESIGN escalation
    //   (the fit envelope cannot be shrunk below the drawn crown without breaking the (i) clearance
    //   gate), NEVER a worker tune.
    check('(h-crown) r19.1 — growing-season crown-fill (.cal-crown) count ≥ 0.85 × tree count at ?cal=2026-06-21 (near-label crowns REDUCED not bared; the 8 label-boxed trees bare unavoidably; bare crowns are a winter read only)',
      dSum.crown >= 0.85 * dSum.trees,
      '[summer crown-fill=' + dSum.crown + '/' + dSum.trees + ' = ' + (dSum.crown / dSum.trees).toFixed(4) + ' (floor 0.85 ⇒ ' + Math.ceil(0.85 * dSum.trees) + ')]');

    // (h-motif-chrome) r19 — the cartouche motif clears the FIXED CHROME. Its bbox centre must
    //   not fall inside any of the three screen-fixed chrome boxes (#doortest self-test chip /
    //   #cal-airbox affordance / .pzctl controls) at any of the four bell dates (SP-SEE fix 3:
    //   the motif no longer hides behind the chip).
    const motifClearsChrome = [dWin, dSum, snowR, bloomR, turnR].every(d => d.motif && d.motifChrome === null);
    check('(h-motif-chrome) r19 — #cal-motif clears the fixed chrome at every bell date: its bbox centre is inside NO chrome box (#doortest / #cal-airbox / .pzctl)',
      motifClearsChrome,
      '[in-chrome winter=' + dWin.motifChrome + ' summer=' + dSum.motifChrome + ' snow=' + snowR.motifChrome + ' bloom=' + bloomR.motifChrome + ' turn=' + turnR.motifChrome + ']');
    check('(h-bloom) — at ?cal=2027-04-15 (bloom bell) SPRING BLOSSOM marks are present (.cal-bloom > 0)',
      bloomR.bloom > 0, '[bloom=' + bloomR.bloom + ', crowns=' + bloomR.crown + ']');
    check('(h-leaf) — at ?cal=2026-11-05 (turn bell) AUTUMN FALLING-LEAF marks are present (.cal-leaf > 0)',
      turnR.leaf > 0, '[leaf=' + turnR.leaf + ', crowns=' + turnR.crown + ']');

    // (h-motif) — #cal-motif exists at every date and its active-season sub-glyph differs
    // across the four bell-center seasons (snowflake / blossom / sprig / maple). Four
    // distinct innerHTML fingerprints: summer (2026-06-21) · winter (snow) · spring (bloom) ·
    // autumn (turn).
    const mh = [dSum.motifHash, snowR.motifHash, bloomR.motifHash, turnR.motifHash];
    const mAll = dSum.motif && snowR.motif && bloomR.motif && turnR.motif;
    const mDistinct = new Set(mh).size === 4;
    check('(h-motif) — #cal-motif exists at every bell date and its sub-glyph VARIES across the four seasons (four distinct innerHTML fingerprints: summer/winter/spring/autumn)',
      mAll && mDistinct,
      '[present S/W/Sp/A=' + [dSum.motif, snowR.motif, bloomR.motif, turnR.motif].join('/') + ', hashes=' + JSON.stringify(mh) + ', distinct=' + new Set(mh).size + '/4]');

    // (i) — (r17) crown / snow-crown / blossom / falling-leaf / motif clearance held in
    //       WORLD space at ALL four bell dates. The gate re-implements §2.2-C's worldBox CTM
    //       math, FIRST proves the basis is world (a text box centre > 200 units from origin
    //       — the r3-F1 failure signature is every box clustered at the origin), then asserts
    //       no drawn decoration comes within 2px of any text world box. Bare --tree structure
    //       is EXEMPT.
    const clrOK = c => c.maxCenterDist > 200 && c.nTexts > 0 && c.nDeco > 0 && c.violations === 0;
    check('(i) — WORLD-space clearance holds at all four bell dates: the CTM basis is world (a text box centre > 200 units from origin) AND no crown/snow/blossom/leaf/motif element comes within 2px of any text world box (bare structure exempt)',
      clrOK(clrSnow) && clrOK(clrBloom) && clrOK(clrTurn),
      '[snow maxCD=' + clrSnow.maxCenterDist.toFixed(0) + ' deco=' + clrSnow.nDeco + ' viol=' + clrSnow.violations +
      ' · bloom maxCD=' + clrBloom.maxCenterDist.toFixed(0) + ' deco=' + clrBloom.nDeco + ' viol=' + clrBloom.violations +
      ' · turn maxCD=' + clrTurn.maxCenterDist.toFixed(0) + ' deco=' + clrTurn.nDeco + ' viol=' + clrTurn.violations + ']');

    // (k-structural) — (r17) the decoration RECEDES: no #cal-dressing element resolves its
    //       fill or stroke to the primary brass (#c9a24a / #f0d489). Structural, at any live
    //       date (read at all four bell dates + the two solstices). A breach is SP-FLAG.
    const noBrass = [dWin, dSum, snowR, bloomR, turnR].every(d => d.brassHit === 0);
    check('(k-structural) — the decoration RECEDES by construction: ZERO #cal-dressing elements paint in the primary brass #c9a24a/#f0d489 (a breach is a DESIGN escalation, never a worker tune)',
      noBrass,
      '[brassHit winter=' + dWin.brassHit + ' summer=' + dSum.brassHit + ' snow=' + snowR.brassHit + ' bloom=' + bloomR.brassHit + ' turn=' + turnR.brassHit + ']');

    // ── the RENDERED-PIXEL captures (§8.4 j/k/l). Fixed viewport, deviceScaleFactor 1 so a
    //    getBoundingClientRect CSS px equals a PNG px. Summer: capture dressed, read the
    //    primary label rects, then TWO undressed references — (a) DECORATION-only masked
    //    (#cal-trees + #cal-motif hidden) for the §8.4-(k) recede guard, and (b) the WHOLE
    //    #cal-dressing masked (wash included) for the §8.4-(l) label-contrast reference (the
    //    wash is precisely what erodes label contrast). Winter: the dressed solstice for (j).
    ab('set', 'viewport', '1280', '800');
    const sumPng = path.join(tmpdir(), 'gate-dom-cal-summer.png');
    const sumDecoMaskPng = path.join(tmpdir(), 'gate-dom-cal-summer-deco-masked.png');
    const sumMaskPng = path.join(tmpdir(), 'gate-dom-cal-summer-undressed.png');
    const winPng = path.join(tmpdir(), 'gate-dom-cal-winter.png');
    ab('open', URL + '?cal=2026-06-21'); ab('wait', '--load', 'networkidle'); ab('wait', '2500');
    ab('screenshot', sumPng);
    const labels = labelRects();                 // the primary label rects, on the dressed summer plate
    maskDeco(true); ab('wait', '400');
    ab('screenshot', sumDecoMaskPng);            // (k) reference: ONLY #cal-trees + #cal-motif hidden
    maskDeco(false);
    maskDressing(true); ab('wait', '400');
    ab('screenshot', sumMaskPng);                // (l) reference: the WHOLE dressing hidden (wash gone)
    maskDressing(false);
    ab('open', URL + '?cal=2026-12-21'); ab('wait', '--load', 'networkidle'); ab('wait', '2500');
    ab('screenshot', winPng);

    // (j) — the season is RENDERED, not merely attributed: brightest-quartile mean ink
    //       colour turns warmer in summer than winter by ≥ 3 (8-bit R̄−B̄). SP-FLAG on breach.
    let jOK = false, jDetail = '';
    let sumDec = null, sumMaskDec = null, sumDecoMaskDec = null;
    try {
      sumDec = decodePNG(sumPng); sumMaskDec = decodePNG(sumMaskPng); sumDecoMaskDec = decodePNG(sumDecoMaskPng);
      const ws = brightestQuartileWarmth(sumDec);
      const ww = brightestQuartileWarmth(decodePNG(winPng));
      const turn = ws.rmb - ww.rmb;
      jOK = turn >= 3;
      jDetail = '[summer R−B=' + ws.rmb.toFixed(2) + ', winter R−B=' + ww.rmb.toFixed(2) + ', turn=' + turn.toFixed(2) + ' (floor 3)]';
    } catch (e) { jDetail = '[decode error: ' + e.message + ']'; }
    check('(j) — the RENDERED season turns: brightest-quartile ink (R̄−B̄)_summer − (R̄−B̄)_winter ≥ 3 (a floor failure is SP-FLAG, never a worker tune)',
      jOK, jDetail);

    // (k-pixel) — (r18) the bright plate ink is NOT owned by the DECORATION: masking ONLY
    //       #cal-trees + #cal-motif (NEVER the whole #cal-dressing — that would remove the
    //       SP-SEE-approved full-plate #cal-wash and drop luminance ~72% because of the WASH,
    //       not the decoration) drops the brightest-quartile mean luminance by ≤ 8% (measured
    //       ~0.6%; the road/structures/labels own the bright ink). A breach is a DESIGN escalation.
    let kOK = false, kDetail = '';
    try {
      const lD = brightestQuartileLum(sumDec), lM = brightestQuartileLum(sumDecoMaskDec);
      const drop = (lD - lM) / lD;               // >0 ⇒ the decoration was in the bright quartile
      kOK = drop <= 0.08;
      kDetail = '[dressed L=' + lD.toFixed(4) + ', deco-masked L=' + lM.toFixed(4) + ', drop=' + (drop * 100).toFixed(1) + '% (ceiling 8%)]';
    } catch (e) { kDetail = '[decode error: ' + e.message + ']'; }
    check('(k-pixel) — masking ONLY #cal-trees + #cal-motif drops the brightest-quartile mean luminance by ≤ 8% (the estate ink, not the decoration, owns the bright — the decoration recedes)',
      kOK, kDetail);

    // (l) — (r19, GATED) LABELS STAY LEGIBLE IN EVERY SEASON. The wash is now constant-low-
    //       luminance and hue-rotated, so NO season lightens the paper the most — the summer-only
    //       worst case is retired. Re-derive across ALL FOUR seasons: at each of ?cal=2026-03-20
    //       (spring) / 2026-06-21 (summer) / 2026-09-22 (autumn) / 2026-12-21 (winter), for each
    //       primary .zone-label rect compute the label-to-background contrast (method A) on the
    //       DRESSED plate and the UNDRESSED reference (whole #cal-dressing hidden — the wash is
    //       the eroder); the MIN across ALL 8 labels × ALL 4 seasons of the dressed/undressed
    //       ratio must be ≥ 0.878 (the r18b sanctioned floor; with the common low-L wash the
    //       measured MIN is expected to rise back toward 0.90 — the run REPORTS the measured MIN
    //       so a re-derived floor can be SET, but never lowered below 0.878). A breach BELOW 0.878
    //       is a DESIGN escalation (shift §2.3's wash chroma), never a worker tune. The estate
    //       layout is season-independent, so `labels` (read once on the dressed summer plate) is
    //       the shared rect set for all four seasons.
    let lOK = false, lDetail = '';
    try {
      const lSeasons = [['spring', '2026-03-20'], ['summer', '2026-06-21'], ['autumn', '2026-09-22'], ['winter', '2026-12-21']];
      let minRatio = Infinity, m = 0, worst = '', perSeason = [];
      for (const [sName, sDate] of lSeasons) {
        const dPng = path.join(tmpdir(), 'gate-dom-l-' + sName + '.png');
        const uPng = path.join(tmpdir(), 'gate-dom-l-' + sName + '-undressed.png');
        ab('open', URL + '?cal=' + sDate); ab('wait', '--load', 'networkidle'); ab('wait', '2500');
        ab('screenshot', dPng);
        maskDressing(true); ab('wait', '400');
        ab('screenshot', uPng);
        maskDressing(false);
        const dDec = decodePNG(dPng), uDec = decodePNG(uPng);
        let sMin = Infinity;
        for (const r of labels) {
          const rd = regionContrast(dDec, r.x, r.y, r.w, r.h);
          const ru = regionContrast(uDec, r.x, r.y, r.w, r.h);
          if (rd != null && ru != null && ru > 0) {
            const ratio = rd / ru; m++;
            if (ratio < sMin) sMin = ratio;
            if (ratio < minRatio) { minRatio = ratio; worst = sName + ':' + r.txt; }
          }
        }
        perSeason.push(sName + ' ' + (isFinite(sMin) ? sMin.toFixed(3) : 'n/a'));
      }
      const FLOOR = 0.878;                        // r18b sanctioned floor; r19 re-derives across 4 seasons (may RISE, never below)
      lOK = m >= 12 && minRatio >= FLOOR;
      lDetail = '[' + m + ' label×season samples · MIN ratio=' + (isFinite(minRatio) ? minRatio.toFixed(3) : 'n/a') +
        ' (worst "' + worst + '") · per-season MIN {' + perSeason.join(', ') + '} (floor 0.878)]';
    } catch (e) { lDetail = '[decode error: ' + e.message + ']'; }
    check('(l) r19 — LABELS STAY LEGIBLE IN EVERY SEASON: the MIN across all primary .zone-labels × all four seasons of the dressed/undressed label-contrast ratio ≥ 0.878 (constant-low-L hue-rotated wash; a breach BELOW 0.878 is a DESIGN escalation)',
      lOK, lDetail);

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
