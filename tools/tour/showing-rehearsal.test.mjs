#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   showing-rehearsal.test.mjs — THE SHOWING's REHEARSAL GATE (WS2 · DESIGN §10 · T4.7).

   The full §10 rehearsal-gate assertion list, run against the LIVE FORGED DECK
   (talk/showing.html) in a real headless browser, on the deck's SILENT virtual
   clock (deterministic — no audio device, ws:pref:muted forces the rAF clock).
   The deck is unlocked in OPERATOR mode (chapters HOLD, never auto-advance), and
   every chapter is walked on the virtual clock by SEEKING (instant, the "~20×"
   spirit) via the deck's own liveness handle window.__showing (go / toggle /
   next / prev / live / rearm / preflight / bannerVisible). Panic BUTTONS are
   driven with REAL CDP clicks (never dispatchEvent — the house real-input rule;
   the buttons sit under the #gate overlay until Begin, exactly the hit-test bug a
   synthetic click would miss).

   WHAT IT PROVES (the §10 list):

   STATIC (from a compact projection of window.SHOWING_CHAPTERS + the fs) —
     S1  the cue-engine lint is clean for the whole real CHAPTERS array.
     S2  every framed URL (opening.frame + every `frame` cue) is RELATIVE (no
         absolutes — the deck frames only ../<page>; an absolute breaks on Pages
         vs localhost) and resolves from talk/ to a file ON DISK (the sentinel's
         static half; the load probe is the runtime half, B-block).
     S3  the determinism manifest holds: every framed page whose SOURCE greps
         positive for Date.now|Math.random|new Date carries a SHOWING_FRAME_MANIFEST
         entry that is 'pinned' (and its frame URL carries a capture param) or
         'tolerant'. The manifest is EXHAUSTIVE (every framed URL keyed; no stale
         key that nothing frames) and the two `notFramed` pages are never framed.
     S4  captions cover the timing BOTH ways, static half: every chapter has ≥1
         `type:'word'` timing item (the runtime span-count is B-captions).

   BROWSER (the forged deck, silent operator clock) —
     B-boot        __showing + CueEngine present; 13 chapters; silent operator
                   (usingAudio=false, visitor=false, started=true after Begin).
     B-frames      EVERY chapter's opening frame — and every `frame`-cue target —
                   LOADS to a real sentinel (readyState complete · non-empty title
                   · a rendered body), by SEEKING the virtual clock to each cue.
     B-hooks       every STATE/IMPULSE cue's __tourHooks verb EXISTS on the frame
                   that is current at the cue's time, at poke time (the frame is
                   polled ready first — so the gate never trips the same-turn
                   "hook absent, self-heals on load" log the deck emits to its cue
                   LOG, not the console; carry-forward 2).
     B-captions    each chapter's caption lines PARTITION its word items (total
                   line-words === word count — no orphan or unlit words) and only
                   the CURRENT line's spans are mounted (the single-subtitle-line
                   surface; probed via __showing.cap()).
     B-replay      STATE-cue replay reconstructs state after a simulated seek:
                   (a) ch01 map — forward-seek past recentre → fit view (k≈1);
                       BACKWARD-seek to between mapFrame(manor) and recentre → the
                       camera reconstructs the EARLIER state (k≈8, not the stale 1);
                   (b) ch09 map — same, over the outer PROMENADES district;
                   (c) ch07 pin-barrel — entering past the crank cue from ANOTHER
                       chapter replays crank-to-φ on the freshly-loaded frame
                       (φ: rest 0 → 24) — the frame-change replay-on-load path.
     B-buttons     the panic buttons EXIST and FIRE (real CDP clicks): ⏭ advances,
                   ⏮ retreats, GO-LIVE → live, RE-ARM → scheduled, ⏸/▶ toggles.
     B-hold        chapter HOLDs fire: at a chapter's end the deck holds with the
                   ready-line ("next — <TITLE>"; the last chapter "— end of the
                   showing"), tested on the first / a middle / the last chapter.
     B-rm          the RM-emulated pass raises the banner: through the REAL rmCheck
                   via the __showing.preflight seam — a matchMedia stub with
                   matches:false leaves the banner hidden, matches:true raises it
                   with copy naming reduce-motion. (agent-browser CANNOT emulate
                   prefers-reduced-motion — the T1.2 landmine / T4.2–T4.6
                   carry-forward — so the stub-through-real-rmCheck is the honest
                   path the seam was built for; DESIGN §10 / showing.js:512-518.)
     B-stability   double-load stability: two representative frames are loaded
                   TWICE and both loads produce a valid sentinel; the PINNED map
                   returns the identical fit-view camera both times (the pin is
                   stable; heavy pages re-decode inlined assets per load — the real
                   talk-day worry).
     B-console     ZERO console errors and ZERO page errors across the whole run
                   (framed estate pages emit only their own benign log-level
                   self-tests, filtered out; the deck's cue-failure notes go to the
                   DOM cue-log, never the console).

   Run:  node tools/tour/showing-rehearsal.test.mjs
         (exit 0 = all pass · 1 = a check failed · 2 = harness could not run —
          agent-browser missing / server / forge error).

   Requires: agent-browser on PATH + a free TCP port. Forges talk/showing.html
   fresh (test the built artifact), serves the repo root on an uncommon port (a
   SEPARATE detached python3 child — never in-process, which would deadlock the
   blocking spawnSync calls), runs a uniquely-named headless session, and tears
   down exactly what it started. Sibling to tools/tour/acts.test.mjs and
   tools/layout/gate-dom.test.mjs.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const TALK = path.join(ROOT, 'talk');
const PORT = 8773;                              // an uncommon port we own + tear down
const SESSION = 'showing-rehearsal-t47';        // a uniquely-named session we close at the end
const BASE = `http://127.0.0.1:${PORT}`;
const URL_DECK = `${BASE}/talk/showing.html`;
const DET_RE = /Date\.now|Math\.random|new Date/;   // the nondeterminism grep (DESIGN §10)

const AB_ENV = { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: '25000' };
const CALL_TIMEOUT = 45000;

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

/* ── deck-driving seams (all via the existing window.__showing liveness handle) ──
   go(i, ms) enters chapter i at ms on the virtual clock and arms play; toggle()
   pauses (needs started=true — set by the Begin click). go()+toggle() in ONE eval
   is a synchronous "pure seek + hold": no rAF tick runs between them, so no forward
   cue fires — the clock parks exactly where we seeked. (go's t is MILLISECONDS.) */
function seek(i, ms) {
  abEval(`(function(){ window.__showing.go(${i|0}, ${ms|0}); window.__showing.toggle(); return "ok"; })()`);
}
function deckState() {
  return abEval(`(function(){ var s=window.__showing.state; return JSON.stringify({ idx:s.idx, mode:s.mode, playing:s.playing, holding:s.holding, started:s.started, visitor:s.visitor, usingAudio:s.usingAudio }); })()`);
}
/* the stage frame: its src + a real load sentinel (readyState complete · title · body). */
function frameInfo() {
  return abEval(`(function(){
    var f=document.getElementById('frame'); var src=f?f.getAttribute('src'):null;
    var fw=null, fd=null;
    try{ fw=f.contentWindow; }catch(e){} try{ fd=fw&&fw.document; }catch(e){}
    return JSON.stringify({ src:src, ready: fd?fd.readyState:null,
      title: fd?(fd.title||''):null, bodyKids:(fd&&fd.body)?fd.body.childElementCount:0 });
  })()`);
}
/* poll until the frame src contains `sub` AND the sentinel is satisfied (or maxMs). */
function waitFrame(sub, maxMs) {
  const start = Date.now();
  let fi = frameInfo();
  while (!(fi.src && fi.src.indexOf(sub) >= 0 && fi.ready === 'complete' && fi.title && fi.bodyKids > 0)
         && Date.now() - start < maxMs) { ab('wait', '300'); fi = frameInfo(); }
  return fi;
}
/* does __tourHooks[verb] exist as a function on the currently-framed page? */
function hookState(verb) {
  return abEval(`(function(){
    var fw=null,h=null; try{ fw=document.getElementById('frame').contentWindow; }catch(e){}
    try{ h=fw&&fw.__tourHooks; }catch(e){}
    return JSON.stringify({ has:!!h, verb:(h&&typeof h[${JSON.stringify(verb)}])||'absent' });
  })()`);
}
/* the framed map's camera zoom k (fit view ≈ 1; a framed district > 1). null off-map. */
function camK() {
  return abEval(`(function(){ var fw=null; try{ fw=document.getElementById('frame').contentWindow; }catch(e){}
    var k=(fw&&fw.__panCamera)?fw.__panCamera.k:null;
    return JSON.stringify({ k: (k===null?null:Math.round(k*100)/100) }); })()`);
}
/* the pin-barrel transport clock φ, read through the no-arg STATE hook (moves nothing). */
function barrelPhi() {
  return abEval(`(function(){ var fw=null,h=null; try{ fw=document.getElementById('frame').contentWindow; }catch(e){}
    try{ h=fw&&fw.__tourHooks; }catch(e){}
    var p=(h&&typeof h.crank==='function')?h.crank():null;
    return JSON.stringify({ phi:(p===null?null:Math.round(p*100)/100) }); })()`);
}
function captionProbe() {
  /* the line-windowed caption contract: buildLines() must PARTITION the chapter's
     words (coverage), and only the CURRENT line's spans are mounted on stage. */
  return abEval(`(function(){ return JSON.stringify(window.__showing.cap()); })()`);
}
function readyLine() {
  return abEval(`(function(){ return JSON.stringify({ text:(document.getElementById('ready').textContent||'').trim(),
    holding: window.__showing.state.holding, frameHolding: document.getElementById('frame').classList.contains('holding') }); })()`);
}
/* the compact chapter+manifest projection — small (no audio data: URIs, no timing items). */
function projection() {
  return abEval(`(function(){
    var CE=window.CueEngine, chs=window.SHOWING_CHAPTERS||[];
    var out=chs.map(function(ch){
      var cues=(ch.cues||[]).map(function(c){
        var kind=CE.cueKind(c); var o={ t:c.t, kind:kind };
        if(kind==='frame') o.frame=c.frame;
        if(kind==='state') o.verb=c.state&&c.state.verb;
        if(kind==='impulse') o.verb=c.impulse&&c.impulse.verb;
        return o;
      });
      var items=(ch.timing&&ch.timing.items)||[]; var nWords=0;
      for(var k=0;k<items.length;k++) if(items[k]&&items[k].type==='word') nWords++;
      return { id:ch.id, title:ch.title, opening:(ch.opening&&ch.opening.frame)||null,
        dur:(ch.timing&&ch.timing.duration_ms)||null, nWords:nWords, cues:cues };
    });
    var man=window.SHOWING_FRAME_MANIFEST||{frames:{},notFramed:[]};
    return JSON.stringify({ chapters:out, manifestFrames:man.frames, notFramed:man.notFramed,
      lint: CE.lintChapters(chs) });
  })()`);
}
/* console entries at ERROR level + uncaught page errors — the "zero console errors" clause. */
function consoleErrors() {
  const r = sh('agent-browser', ['--session', SESSION, '--json', 'console']);
  let errs = [];
  try {
    const j = JSON.parse(r.stdout || '{}');
    const entries = (j && j.data && j.data.entries) || [];
    errs = entries.filter((e) => e && e.level === 'error');
  } catch (_) { /* fall through — empty */ }
  return errs;
}
function pageErrors() {
  const r = sh('agent-browser', ['--session', SESSION, '--json', 'errors']);
  try {
    const j = JSON.parse(r.stdout || '{}');
    const d = j && j.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.entries)) return d.entries;
    if (d && Array.isArray(d.errors)) return d.errors;
  } catch (_) { /* fall through */ }
  return [];
}

/* resolve a frame src authored from talk/ (../<page>[?query]) to a source file on disk. */
function resolveFrameFile(src) {
  const noQuery = String(src).split('?')[0];
  return path.normalize(path.join(TALK, noQuery));
}
function distinctFrameUrls(chapters) {
  const set = new Set();
  for (const ch of chapters) {
    if (ch.opening) set.add(ch.opening);
    for (const c of ch.cues) if (c.kind === 'frame' && c.frame) set.add(c.frame);
  }
  return [...set];
}

async function main() {
  console.log('showing-rehearsal.test — THE SHOWING rehearsal gate (§10): the FORGED deck, headless, silent virtual clock\n');

  if (!haveAgentBrowser()) {
    console.error('  ⚠ agent-browser not on PATH — cannot run the rehearsal gate.');
    process.exit(2);
  }

  // 1. FORGE the deck fresh (test the built artifact, not the source).
  const f = sh('node', ['tools/forge/forge.mjs', 'talk/showing.src.html']);
  if (f.status !== 0) { console.error('  ⚠ forge failed for talk/showing.src.html:\n' + f.stderr); process.exit(2); }
  if (!existsSync(path.join(ROOT, 'talk/showing.html'))) { console.error('  ⚠ forged deck missing: talk/showing.html'); process.exit(2); }

  // 2. SERVE the repo root on our uncommon port — a SEPARATE detached child.
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore', detached: false });
  try { await waitPort(PORT, 10000); }
  catch (e) { try { server.kill('SIGKILL'); } catch (_) {} console.error('  ⚠ ' + e.message); process.exit(2); }

  try {
    // ── open the deck, force the SILENT deterministic clock, unlock in OPERATOR mode ──
    ab('open', URL_DECK); ab('wait', '--load', 'networkidle'); ab('wait', '1200');
    abEval(`(function(){ localStorage.setItem('ws:pref:muted','1'); return "muted"; })()`);
    ab('reload'); ab('wait', '--load', 'networkidle'); ab('wait', '1400');
    ab('console', '--clear'); ab('errors', '--clear');   // clean slate for the zero-errors clause

    const proj = projection();
    const chapters = proj.chapters || [];

    // ═══ STATIC — projection + fs (no browser needed beyond the projection read) ═══
    console.log('STATIC — cue-engine lint · frame resolution · determinism manifest · caption words:');

    check('S1 cue-engine lint clean for the whole real CHAPTERS array',
      Array.isArray(proj.lint) && proj.lint.length === 0,
      proj.lint && proj.lint.length ? proj.lint.slice(0, 3).join(' · ') : '0 problems · ' + chapters.length + ' chapters');

    const frames = distinctFrameUrls(chapters);
    let absViol = [], missViol = [];
    for (const src of frames) {
      if (/^\/|^[a-z][a-z0-9+.-]*:/i.test(src)) absViol.push(src);
      else if (!existsSync(resolveFrameFile(src))) missViol.push(src);
    }
    check('S2 every framed URL is relative and resolves to a file on disk',
      absViol.length === 0 && missViol.length === 0,
      frames.length + ' distinct frames · ' +
      (absViol.length ? 'ABSOLUTE: ' + absViol.join(',') : 'none absolute') + ' · ' +
      (missViol.length ? 'MISSING: ' + missViol.join(',') : 'all exist'));

    // S3 — determinism manifest: positive-grep frames must be pinned (param present) or tolerant;
    //      manifest exhaustive (every framed URL keyed, no stale key); notFramed never framed.
    const man = proj.manifestFrames || {};
    let detViol = [], unkeyed = [], staleKeys = [], nfViol = [];
    for (const src of frames) {
      const file = resolveFrameFile(src);
      const positive = existsSync(file) && DET_RE.test(readFileSync(file, 'utf8'));
      const entry = man[src];
      if (!entry) { unkeyed.push(src); continue; }
      if (positive) {
        const okPinned = entry.disposition === 'pinned' && src.indexOf('?') >= 0;
        const okTolerant = entry.disposition === 'tolerant';
        if (!(okPinned || okTolerant)) detViol.push(src + ' [' + entry.disposition + ']');
      }
    }
    const framedSet = new Set(frames);
    for (const key of Object.keys(man)) if (!framedSet.has(key)) staleKeys.push(key);
    for (const nf of (proj.notFramed || [])) {
      // notFramed lists a bare page path; assert no framed URL points at that file.
      const nfFile = path.normalize(path.join(ROOT, nf.page.split('?')[0]));
      for (const src of frames) if (resolveFrameFile(src) === nfFile) nfViol.push(nf.page);
    }
    check('S3 determinism manifest holds (pinned+param / tolerant · exhaustive · notFramed unframed)',
      detViol.length === 0 && unkeyed.length === 0 && staleKeys.length === 0 && nfViol.length === 0,
      'pinned=' + Object.values(man).filter((e) => e.disposition === 'pinned').length +
      ' tolerant=' + Object.values(man).filter((e) => e.disposition === 'tolerant').length +
      (detViol.length ? ' · DET:' + detViol.join(',') : '') +
      (unkeyed.length ? ' · UNKEYED:' + unkeyed.join(',') : '') +
      (staleKeys.length ? ' · STALE:' + staleKeys.join(',') : '') +
      (nfViol.length ? ' · NOTFRAMED-FRAMED:' + nfViol.join(',') : ''));

    const noWords = chapters.filter((c) => !(c.nWords > 0)).map((c) => c.id);
    check('S4 every chapter has word timings (captions can light — static half)',
      noWords.length === 0, chapters.length + ' chapters · ' + (noWords.length ? 'NO WORDS: ' + noWords.join(',') : 'all have words'));

    // ═══ B-boot ═══
    console.log('\nBROWSER — the forged deck on the silent operator clock:');
    ab('click', '#gate-begin'); ab('wait', '1000');    // OPERATOR mode (holds; never auto-advances)
    const st = deckState();
    check('B-boot deck unlocked silent + operator (started · !visitor · !usingAudio · 13 chapters)',
      st.started === true && st.visitor === false && st.usingAudio === false && chapters.length === 13,
      'started=' + st.started + ' · visitor=' + st.visitor + ' · usingAudio=' + st.usingAudio + ' · chapters=' + chapters.length);

    // ═══ B-frames + B-hooks + B-captions — walk every chapter on the virtual clock ═══
    console.log('\n  per-chapter walk (seek every cue · load sentinel · hook-at-poke-time · caption wiring):');
    let framesOk = 0, framesTot = 0, hooksOk = 0, hooksTot = 0, capOk = 0;
    for (let ci = 0; ci < chapters.length; ci++) {
      const ch = chapters[ci];
      // opening frame
      seek(ci, 0);
      const fo = waitFrame(ch.opening, 9000); framesTot++;
      const openOk = fo.ready === 'complete' && !!fo.title && fo.bodyKids > 0 && fo.src.indexOf(ch.opening) >= 0;
      if (openOk) framesOk++;
      check('  ' + ch.id + ' opening frame loads (sentinel)', openOk,
        ch.opening + ' · "' + (fo.title || '') + '"' + (openOk ? '' : ' · ready=' + fo.ready + ' kids=' + fo.bodyKids));

      // caption wiring (runtime "both ways": lines partition ALL words; only the
      // current line is mounted — the single-subtitle-line surface)
      const cc = captionProbe();
      const capWired = cc.totalWords === ch.nWords && ch.nWords > 0 &&
        cc.mounted > 0 && cc.mounted === cc.curLineWords;
      if (capWired) capOk++;
      check('  ' + ch.id + ' captions wired (lines partition words · current line mounted)', capWired,
        ch.nWords + ' words in ' + cc.lines + ' lines · mounted=' + cc.mounted +
        ' (line ' + (cc.curLine + 1) + ' has ' + cc.curLineWords + ')');

      // walk the cues in author order: frame cues load their target; hook cues expose their verb
      const cues = ch.cues.slice().sort((a, b) => a.t - b.t);
      for (const c of cues) {
        if (c.kind === 'frame') {
          seek(ci, Math.round(c.t * 1000) + 120);
          const fi = waitFrame(c.frame, 9000); framesTot++;
          const ok = fi.ready === 'complete' && !!fi.title && fi.bodyKids > 0 && fi.src.indexOf(c.frame) >= 0;
          if (ok) framesOk++;
          check('  ' + ch.id + ' frame cue @' + c.t + 's loads ' + c.frame.replace('../', ''), ok,
            '"' + (fi.title || '') + '"' + (ok ? '' : ' · ready=' + fi.ready));
        } else if (c.kind === 'state' || c.kind === 'impulse') {
          seek(ci, Math.round(c.t * 1000) + 120);
          waitFrame('', 9000);              // whatever frame is current at this time is ready
          const hs = hookState(c.verb); hooksTot++;
          const ok = hs.has && hs.verb === 'function';
          if (ok) hooksOk++;
          check('  ' + ch.id + ' ' + c.kind + ' hook ' + c.verb + '() exists at poke time', ok,
            '__tourHooks.' + c.verb + '=' + hs.verb);
        }
      }
    }
    check('B-frames every framed page loads to a real sentinel', framesOk === framesTot,
      framesOk + '/' + framesTot + ' frame loads');
    check('B-hooks every STATE/IMPULSE hook verb exists at poke time', hooksOk === hooksTot,
      hooksOk + '/' + hooksTot + ' hook verbs');
    check('B-captions every chapter partitions words into lines + mounts the current line', capOk === chapters.length,
      capOk + '/' + chapters.length + ' chapters wired');

    // ═══ B-replay — STATE-cue reconstruction after a simulated backward seek ═══
    console.log('\n  STATE-replay reconstruction (backward seek re-derives durable state):');
    // (a) ch01 map: recentre (t=22s → fit) then backward to t=19s (mapFrame manor reconstructed).
    seek(0, 0); waitFrame('index.html', 9000);
    seek(0, 22000); ab('wait', '900'); const c01End = camK();
    seek(0, 19000); ab('wait', '900'); const c01Back = camK();
    check('  B-replay ch01 backward seek reconstructs the earlier camera state',
      Math.abs((c01End.k || 0) - 1) < 0.2 && (c01Back.k || 0) > 2,
      'recentre→k=' + c01End.k + ' · backward-seek→k=' + c01Back.k + ' (≠ stale fit)');

    // (b) ch09 map: recentre (t=18s → fit) then backward to t=12s (mapFrame promenades reconstructed).
    seek(8, 0); waitFrame('index.html', 9000);
    seek(8, 18000); ab('wait', '900'); const c09End = camK();
    seek(8, 12000); ab('wait', '900'); const c09Back = camK();
    check('  B-replay ch09 backward seek reconstructs the framed outer district',
      Math.abs((c09End.k || 0) - 1) < 0.2 && (c09Back.k || 0) > 1.05,
      'recentre→k=' + c09End.k + ' · backward-seek→k=' + c09Back.k);

    // (c) ch07 pin-barrel: enter past the crank cue FROM ANOTHER chapter → fresh frame at rest,
    //     crank replayed on the load handler (φ: 0 → 24).
    seek(3, 0); waitFrame('galton', 9000);            // leave the barrel: go to ch04 (galton)
    seek(6, 16000); const pbFi = waitFrame('pin-barrel', 9000); ab('wait', '600');
    const pb = barrelPhi();
    check('  B-replay ch07 crank replays on the freshly-loaded frame (φ → 24)',
      pbFi.src.indexOf('pin-barrel') >= 0 && pb.phi !== null && Math.abs(pb.phi - 24) < 1.0,
      'φ reconstructed = ' + pb.phi + ' on a fresh pin-barrel load');

    // ═══ B-buttons — panic buttons exist + FIRE (real CDP clicks) ═══
    console.log('\n  panic buttons (real CDP clicks — never dispatchEvent):');
    seek(4, 0); ab('wait', '500');                    // park at ch05 (idx 4)
    const bBefore = deckState();
    ab('click', '#btn-next'); ab('wait', '600'); const bNext = deckState();
    ab('click', '#btn-prev'); ab('wait', '600'); const bPrev = deckState();
    ab('click', '#btn-live'); ab('wait', '400'); const bLive = deckState();
    ab('click', '#btn-rearm'); ab('wait', '400'); const bRearm = deckState();
    ab('click', '#btn-play'); ab('wait', '400'); const bPlay = deckState();
    check('B-buttons ⏭/⏮ jump · GO-LIVE · RE-ARM · ⏸ all fire via real clicks',
      bNext.idx === bBefore.idx + 1 && bPrev.idx === bBefore.idx &&
      bLive.mode === 'live' && bRearm.mode === 'scheduled' && bPlay.playing !== bRearm.playing,
      'idx ' + bBefore.idx + '→' + bNext.idx + '→' + bPrev.idx + ' · live=' + bLive.mode +
      ' · rearm=' + bRearm.mode + ' · play toggled=' + (bPlay.playing !== bRearm.playing));

    // ═══ B-hold — chapter HOLDs fire (first / middle / last) ═══
    console.log('\n  chapter HOLDs (operator mode holds at each chapter end):');
    const holdCases = [
      { i: 0, expect: 'next — ' + chapters[1].title },
      { i: 6, expect: 'next — ' + chapters[7].title },
      { i: 12, expect: '— end of the showing' }
    ];
    for (const hc of holdCases) {
      const dur = chapters[hc.i].dur || 8000;
      abEval(`(function(){ window.__showing.go(${hc.i}, ${Math.max(0, dur - 250)}); return "play"; })()`); // play (no toggle)
      // let the silent clock cross the end; poll for the hold
      let rl = readyLine(); const start = Date.now();
      while (!(rl.holding && rl.text) && Date.now() - start < 6000) { ab('wait', '300'); rl = readyLine(); }
      check('  B-hold ' + chapters[hc.i].id + ' holds with the ready-line',
        rl.holding === true && rl.frameHolding === true && rl.text === hc.expect,
        'holding=' + rl.holding + ' · "' + rl.text + '"');
    }

    // ═══ B-rm — the RM-emulated pass raises the banner (stub-through-real-rmCheck) ═══
    console.log('\n  reduced-motion banner (real rmCheck via the preflight seam):');
    const rm = abEval(`(function(){
      var sh=window.__showing;
      var off = sh.preflight({ matchMedia:function(){ return { matches:false }; } });
      var offBanner = sh.bannerVisible();
      var on = sh.preflight({ matchMedia:function(){ return { matches:true }; } });
      var onBanner = sh.bannerVisible();
      var txt = (document.getElementById('rmbanner').textContent||'');
      return JSON.stringify({ off:off, offBanner:offBanner, on:on, onBanner:onBanner,
        names: /reduce motion/i.test(txt) });
    })()`);
    check('B-rm RM-emulated preflight raises the banner (and stays hidden without)',
      rm.off === false && rm.offBanner === false && rm.on === true && rm.onBanner === true && rm.names === true,
      'off→hidden=' + (!rm.offBanner) + ' · on→shown=' + rm.onBanner + ' · copy names reduce-motion=' + rm.names);

    // ═══ B-stability — double-load stability on two representative frames ═══
    console.log('\n  double-load stability (heavy frames re-decode per load; the pin is stable):');
    // pinned map (ch01 opening): load twice, camera identical both times.
    seek(1, 0); waitFrame('workbench', 9000);         // ensure a DIFFERENT frame first
    seek(0, 0); const m1 = waitFrame('index.html', 9000); ab('wait', '700'); const k1 = camK();
    seek(1, 0); waitFrame('workbench', 9000);          // leave again
    seek(0, 0); const m2 = waitFrame('index.html', 9000); ab('wait', '700'); const k2 = camK();
    const mapStable = m1.title && m2.title && k1.k !== null && Math.abs((k1.k || 0) - (k2.k || 0)) < 0.001;
    // a tolerant heavy frame (galton): loads to a real sentinel both times.
    seek(1, 0); waitFrame('workbench', 9000);
    seek(3, 0); const g1 = waitFrame('galton', 9000);
    seek(1, 0); waitFrame('workbench', 9000);
    seek(3, 0); const g2 = waitFrame('galton', 9000);
    const galtonStable = !!g1.title && g1.bodyKids > 0 && !!g2.title && g2.bodyKids > 0;
    check('B-stability pinned map identical across two loads · a heavy frame reloads clean',
      mapStable && galtonStable,
      'map k ' + k1.k + '/' + k2.k + ' (Δ<0.001) · galton "' + (g2.title || '') + '" both loads');

    // ═══ B-console — zero console errors + zero page errors across the whole run ═══
    console.log('\n  console hygiene:');
    const cerr = consoleErrors(); const perr = pageErrors();
    check('B-console zero console errors and zero page errors',
      cerr.length === 0 && perr.length === 0,
      cerr.length + ' console-error(s) · ' + perr.length + ' page-error(s)' +
      (cerr.length ? ' — ' + cerr.slice(0, 2).map((e) => (e.text || '').slice(0, 80)).join(' | ') : ''));

    console.log('\n' + (fail === 0 ? '✓ showing-rehearsal.test: all checks pass' : '✗ showing-rehearsal.test: ' + fail + ' check(s) FAILED'));
  } finally {
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('  ⚠ harness error: ' + (e && e.stack || e)); process.exit(2); });
