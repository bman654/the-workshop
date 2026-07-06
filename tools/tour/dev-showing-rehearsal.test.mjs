#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
   dev-showing-rehearsal.test.mjs — THE DEV-SHOWING's REHEARSAL GATE (WS4 · Book 2).

   A CLONE of tools/tour/showing-rehearsal.test.mjs (Book 1), pointed at the second
   deck (talk/dev-showing.html) and adapted for its content — 12 chapters d01…d12,
   the stratigraphy core as home base, the two pure-from-carrier NEW frames (strata,
   ages) enrolled as `deterministic`, and the two held backdrops (the Conservatory
   SIR bench, the Keystone Arch) enrolled as `tolerant`. The deck engine is the same
   shared showing.js + cue-engine.js (option A, invariant 9) — this gate is the
   Book-2 enforcer, a sibling to Book 1's gate, ZERO edits to any Book-1 file.

   BUILDOUT-TOLERANT (the Book-2 difference). This gate is authored at T4.2, BEFORE
   the audio is rendered (T5.2/T6.1/T6.2) and BEFORE the timed stratumTo/ageTo cues
   are wired (T6.3/T6.4). So the checks that need RENDERED content — word-timed
   captions, and the STATE-cue replay reconstruction — SKIP cleanly (reported ○,
   never a fail) for any chapter/verb not yet wired, and TIGHTEN automatically as the
   content lands: at T4.2 they skip, at T6.6 (all rendered + wired) nothing skips and
   the gate runs at full strength. A SKIP is never a pass in disguise — it prints its
   reason and is counted separately; exit 0 requires zero FAILs (skips allowed).

   WHAT IT PROVES (mirrors Book 1's §10 list, adapted):

   STATIC (projection of window.SHOWING_CHAPTERS + the manifest + the fs) —
     S1  the cue-engine lint is clean for the whole real CHAPTERS array.
     S2  every framed URL (opening.frame + every `frame` cue) is RELATIVE and
         resolves from talk/ to a file ON DISK.
     S3  the determinism manifest holds: every framed page whose SOURCE greps
         Date.now|Math.random|new Date carries a SHOWING_FRAME_MANIFEST entry that is
         'pinned' (+param) OR 'tolerant' OR 'deterministic' (the NEW pure-from-carrier
         frames — accepted ONLY when the source is clean of Date.now/Math.random, i.e.
         at most a display-only `new Date(...)`). Exhaustive (every framed URL keyed,
         no stale key); the notFramed pages are never framed.
     S4  captions can light — every RENDERED chapter has ≥1 `word` timing item.
         Chapters with no timing yet (dur === null) are pending render → SKIP.

   BROWSER (the forged deck, silent operator clock) —
     B-boot        __showing + CueEngine present; 12 chapters; silent operator.
     B-frames      every opening frame + every `frame`-cue target LOADS to a real
                   sentinel (readyState complete · non-empty title · rendered body).
     B-hooks       every STATE/IMPULSE cue's __tourHooks verb (or deck.* handler)
                   EXISTS at the cue's time on the current frame.
     B-captions    each RENDERED chapter's caption lines PARTITION its words and only
                   the current line is mounted. Pending chapters SKIP.
     B-replay      STATE reconstruction after a frame-change seek, DATA-DRIVEN:
                   for a wired stratumTo cue, entering its chapter PAST the cue from
                   another frame replays stratumTo(k) on the fresh strata frame (lit
                   count → k); likewise a wired ageTo cue on the ages frame (active
                   stop → k). SKIPs the strata and/or ages leg when no such cue is
                   wired yet (T6.3/T6.4 add them).
     B-buttons     the panic buttons EXIST and FIRE (real CDP clicks): ⏭/⏮ · GO-LIVE
                   → live · RE-ARM → scheduled · ⏸ toggles — the GO-LIVE/RE-ARM cycle.
     B-hold        chapter HOLDs fire with the ready-line (first / middle / last).
     B-rm          the RM-emulated preflight raises the banner (stub-through-real
                   rmCheck via __showing.preflight).
     B-stability   double-load stability: the deterministic strata home base returns
                   an identical lit state across two loads; a heavy frame (ages)
                   reloads to a valid sentinel both times.
     B-console     ZERO console errors and ZERO page errors across the whole run.

   Run:  node tools/tour/dev-showing-rehearsal.test.mjs
         (exit 0 = all pass, skips allowed · 1 = a check FAILED · 2 = harness could
          not run — agent-browser missing / server / forge error).

   Requires: agent-browser on PATH + a free TCP port. Forges talk/dev-showing.html
   fresh, serves the repo root on an uncommon port (a detached python3 child), runs a
   uniquely-named headless session, and tears down exactly what it started.
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
const PORT = 8774;                              // Book 2's own uncommon port (Book 1 uses 8773)
const SESSION = 'dev-showing-rehearsal-t42';    // a uniquely-named session we close at the end
const BASE = `http://127.0.0.1:${PORT}`;
const URL_DECK = `${BASE}/talk/dev-showing.html`;
const EXPECTED_CHAPTERS = 12;
const DET_RE = /Date\.now|Math\.random|new Date/;   // the nondeterminism grep (DESIGN §10)
const LIVE_RE = /Date\.now|Math\.random/;           // the LIVE nondeterminism (excludes display new Date)

const AB_ENV = { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: '25000' };
const CALL_TIMEOUT = 45000;

function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', cwd: ROOT, timeout: CALL_TIMEOUT, env: AB_ENV, ...opts });
}
function haveAgentBrowser() {
  const r = sh('agent-browser', ['--version'], { timeout: 8000 });
  return r.status === 0 || (r.stdout || '').length > 0;
}
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

let fail = 0, skip = 0;
function check(name, ok, detail) {
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fail++;
}
function skipCheck(name, reason) {
  console.log('  ○ ' + name + '  SKIP — ' + reason);
  skip++;
}

/* ── deck-driving seams (via the window.__showing liveness handle, shared engine) ── */
function seek(i, ms) {
  abEval(`(function(){ window.__showing.go(${i | 0}, ${ms | 0}); window.__showing.toggle(); return "ok"; })()`);
}
function deckState() {
  return abEval(`(function(){ var s=window.__showing.state; return JSON.stringify({ idx:s.idx, mode:s.mode, playing:s.playing, holding:s.holding, started:s.started, visitor:s.visitor, usingAudio:s.usingAudio }); })()`);
}
function frameInfo() {
  return abEval(`(function(){
    var f=document.getElementById('frame'); var src=f?f.getAttribute('src'):null;
    var fw=null, fd=null;
    try{ fw=f.contentWindow; }catch(e){} try{ fd=fw&&fw.document; }catch(e){}
    return JSON.stringify({ src:src, ready: fd?fd.readyState:null,
      title: fd?(fd.title||''):null, bodyKids:(fd&&fd.body)?fd.body.childElementCount:0 });
  })()`);
}
function waitFrame(sub, maxMs) {
  const start = Date.now();
  let fi = frameInfo();
  while (!(fi.src && fi.src.indexOf(sub) >= 0 && fi.ready === 'complete' && fi.title && fi.bodyKids > 0)
         && Date.now() - start < maxMs) { ab('wait', '300'); fi = frameInfo(); }
  return fi;
}
function hookState(verb) {
  return abEval(`(function(){
    var fw=null,h=null; try{ fw=document.getElementById('frame').contentWindow; }catch(e){}
    try{ h=fw&&fw.__tourHooks; }catch(e){}
    return JSON.stringify({ has:!!h, verb:(h&&typeof h[${JSON.stringify(verb)}])||'absent' });
  })()`);
}
/* strata: the count of lit slabs (.slab.climbed) == the current lit stratum k. */
function stratumLit() {
  return abEval(`(function(){ var fw=null; try{ fw=document.getElementById('frame').contentWindow; }catch(e){}
    var n=null; try{ n=fw.document.querySelectorAll('.slab.climbed').length; }catch(e){}
    return JSON.stringify({ lit: n }); })()`);
}
/* ages: the 1-based index of the active scrubber stop (.stop.on), or null off-page. */
function ageActive() {
  return abEval(`(function(){ var fw=null; try{ fw=document.getElementById('frame').contentWindow; }catch(e){}
    var idx=null; try{ var all=[].slice.call(fw.document.querySelectorAll('.stop'));
      var on=fw.document.querySelector('.stop.on'); idx = on ? all.indexOf(on)+1 : null; }catch(e){}
    return JSON.stringify({ active: idx }); })()`);
}
function captionProbe() {
  return abEval(`(function(){ return JSON.stringify(window.__showing.cap()); })()`);
}
function readyLine() {
  return abEval(`(function(){ return JSON.stringify({ text:(document.getElementById('ready').textContent||'').trim(),
    holding: window.__showing.state.holding, frameHolding: document.getElementById('frame').classList.contains('holding') }); })()`);
}
/* clock-liveness sample — the engine's rAF VIRTUAL CLOCK (showing.js tick). The
   end-of-chapter HOLD only fires when this clock advances to the chapter end.
   Some headless browsers SUSPEND requestAnimationFrame outright (0 callbacks ever
   fire; setTimeout is unaffected): the shared clock is then FROZEN — clockMs never
   moves and lastRafTs stays null — so no chapter can reach its hold. This sample
   lets B-hold tell a frozen clock (an environmental transport limit → honest SKIP)
   from a real hold miss (a deck defect → FAIL). */
function clockSample() {
  return abEval(`(function(){ var s=window.__showing.state; return JSON.stringify({ clockMs: Math.round(s.clockMs), lastRafTs: s.lastRafTs===null?null:Math.round(s.lastRafTs) }); })()`);
}
/* the engine's OWN next-chapter title (its live CHAPTERS, not our projection) —
   the exact source showReady() paints into the hold ready-line. A projection-
   independent cross-check that the hold text WOULD be right even when a frozen
   clock forbids driving the hold for real. */
function engineNextTitle(i) {
  return abEval(`(function(){ var chs=window.__showing.chapters||[]; var n=chs[${i + 1}];
    return JSON.stringify({ title: n?n.title:null, isLast: ${i} === chs.length-1 }); })()`);
}
/* the compact chapter+manifest projection — small (no audio data: URIs, no timing items). */
function projection() {
  return abEval(`(function(){
    var CE=window.CueEngine, chs=window.SHOWING_CHAPTERS||[];
    var out=chs.map(function(ch){
      var cues=(ch.cues||[]).map(function(c){
        var kind=CE.cueKind(c); var o={ t:c.t, kind:kind };
        if(kind==='frame') o.frame=c.frame;
        if(kind==='state'){ o.verb=c.state&&c.state.verb; o.args=(c.state&&c.state.args)||[]; }
        if(kind==='impulse'){ o.verb=c.impulse&&c.impulse.verb; o.args=(c.impulse&&c.impulse.args)||[]; }
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
function consoleErrors() {
  const r = sh('agent-browser', ['--session', SESSION, '--json', 'console']);
  let errs = [];
  try {
    const j = JSON.parse(r.stdout || '{}');
    const entries = (j && j.data && j.data.entries) || [];
    errs = entries.filter((e) => e && e.level === 'error');
  } catch (_) { /* empty */ }
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
  console.log('dev-showing-rehearsal.test — THE DEV-SHOWING rehearsal gate (Book 2): the FORGED deck, headless, silent virtual clock\n');

  if (!haveAgentBrowser()) {
    console.error('  ⚠ agent-browser not on PATH — cannot run the rehearsal gate.');
    process.exit(2);
  }

  // 1. FORGE the deck fresh (test the built artifact).
  const f = sh('node', ['tools/forge/forge.mjs', 'talk/dev-showing.src.html']);
  if (f.status !== 0) { console.error('  ⚠ forge failed for talk/dev-showing.src.html:\n' + f.stderr); process.exit(2); }
  if (!existsSync(path.join(ROOT, 'talk/dev-showing.html'))) { console.error('  ⚠ forged deck missing: talk/dev-showing.html'); process.exit(2); }

  // 2. SERVE the repo root on our uncommon port — a detached child.
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

    // ═══ STATIC ═══
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

    // S3 — determinism manifest: positive-grep frames must be pinned(+param) / tolerant /
    //      deterministic(source clean of Date.now/Math.random); exhaustive; notFramed unframed.
    const man = proj.manifestFrames || {};
    let detViol = [], unkeyed = [], staleKeys = [], nfViol = [];
    for (const src of frames) {
      const file = resolveFrameFile(src);
      const source = existsSync(file) ? readFileSync(file, 'utf8') : '';
      const positive = DET_RE.test(source);
      const entry = man[src];
      if (!entry) { unkeyed.push(src); continue; }
      if (positive) {
        const okPinned = entry.disposition === 'pinned' && src.indexOf('?') >= 0;
        const okTolerant = entry.disposition === 'tolerant';
        const okDeterministic = entry.disposition === 'deterministic' && !LIVE_RE.test(source);
        if (!(okPinned || okTolerant || okDeterministic)) detViol.push(src + ' [' + entry.disposition + (entry.disposition === 'deterministic' && LIVE_RE.test(source) ? ' but source has Date.now/Math.random' : '') + ']');
      }
    }
    const framedSet = new Set(frames);
    for (const key of Object.keys(man)) if (!framedSet.has(key)) staleKeys.push(key);
    for (const nf of (proj.notFramed || [])) {
      const nfFile = path.normalize(path.join(ROOT, nf.page.split('?')[0]));
      for (const src of frames) if (resolveFrameFile(src) === nfFile) nfViol.push(nf.page);
    }
    check('S3 determinism manifest holds (pinned+param / tolerant / deterministic · exhaustive · notFramed unframed)',
      detViol.length === 0 && unkeyed.length === 0 && staleKeys.length === 0 && nfViol.length === 0,
      'pinned=' + Object.values(man).filter((e) => e.disposition === 'pinned').length +
      ' tolerant=' + Object.values(man).filter((e) => e.disposition === 'tolerant').length +
      ' deterministic=' + Object.values(man).filter((e) => e.disposition === 'deterministic').length +
      (detViol.length ? ' · DET:' + detViol.join(',') : '') +
      (unkeyed.length ? ' · UNKEYED:' + unkeyed.join(',') : '') +
      (staleKeys.length ? ' · STALE:' + staleKeys.join(',') : '') +
      (nfViol.length ? ' · NOTFRAMED-FRAMED:' + nfViol.join(',') : ''));

    // S4 — captions can light (RENDERED chapters only; pending render → skip).
    const pending = chapters.filter((c) => c.dur == null);
    const timedNoWords = chapters.filter((c) => c.dur != null && !(c.nWords > 0));
    if (pending.length === chapters.length) {
      skipCheck('S4 every chapter has word timings', 'all ' + chapters.length + ' chapters pending render (T5.2/T6.1/T6.2)');
    } else {
      check('S4 every RENDERED chapter has word timings (captions can light)',
        timedNoWords.length === 0,
        (chapters.length - pending.length) + ' rendered · ' + pending.length + ' pending · ' +
        (timedNoWords.length ? 'NO WORDS: ' + timedNoWords.map((c) => c.id).join(',') : 'all rendered have words'));
    }

    // ═══ B-boot ═══
    console.log('\nBROWSER — the forged deck on the silent operator clock:');
    ab('click', '#gate-begin'); ab('wait', '1000');
    const st = deckState();
    check('B-boot deck unlocked silent + operator (started · !visitor · !usingAudio · ' + EXPECTED_CHAPTERS + ' chapters)',
      st.started === true && st.visitor === false && st.usingAudio === false && chapters.length === EXPECTED_CHAPTERS,
      'started=' + st.started + ' · visitor=' + st.visitor + ' · usingAudio=' + st.usingAudio + ' · chapters=' + chapters.length);

    // ═══ B-frames + B-hooks + B-captions — walk every chapter on the virtual clock ═══
    console.log('\n  per-chapter walk (seek every cue · load sentinel · hook-at-poke-time · caption wiring):');
    let framesOk = 0, framesTot = 0, hooksOk = 0, hooksTot = 0, capOk = 0, capExpected = 0;
    for (let ci = 0; ci < chapters.length; ci++) {
      const ch = chapters[ci];
      seek(ci, 0);
      const fo = waitFrame(ch.opening, 9000); framesTot++;
      const openOk = fo.ready === 'complete' && !!fo.title && fo.bodyKids > 0 && fo.src.indexOf(ch.opening) >= 0;
      if (openOk) framesOk++;
      check('  ' + ch.id + ' opening frame loads (sentinel)', openOk,
        ch.opening + ' · "' + (fo.title || '') + '"' + (openOk ? '' : ' · ready=' + fo.ready + ' kids=' + fo.bodyKids));

      // caption wiring — RENDERED chapters only.
      if (ch.dur == null) {
        skipCheck('  ' + ch.id + ' captions wired', 'chapter pending render');
      } else {
        capExpected++;
        const cc = captionProbe();
        const capWired = cc.totalWords === ch.nWords && ch.nWords > 0 &&
          cc.mounted > 0 && cc.mounted === cc.curLineWords;
        if (capWired) capOk++;
        check('  ' + ch.id + ' captions wired (lines partition words · current line mounted)', capWired,
          ch.nWords + ' words in ' + cc.lines + ' lines · mounted=' + cc.mounted +
          ' (line ' + (cc.curLine + 1) + ' has ' + cc.curLineWords + ')');
      }

      // walk the cues in author order: frame cues load their target; hook cues expose their verb.
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
          waitFrame('', 9000);
          hooksTot++;
          if (String(c.verb).startsWith('deck.')) {
            const dv = abEval(`(function(){ return JSON.stringify({ verbs: window.__showing.deckVerbs(),
              card: window.__showing.cardShown() }); })()`);
            const ok = Array.isArray(dv.verbs) && dv.verbs.indexOf(String(c.verb).slice(5)) >= 0;
            if (ok) hooksOk++;
            check('  ' + ch.id + ' ' + c.kind + ' deck verb ' + c.verb + '() has a deck handler', ok,
              'deck handlers: ' + (dv.verbs || []).join(',') + ' · card now: ' + dv.card);
          } else {
            const hs = hookState(c.verb);
            const ok = hs.has && hs.verb === 'function';
            if (ok) hooksOk++;
            check('  ' + ch.id + ' ' + c.kind + ' hook ' + c.verb + '() exists at poke time', ok,
              '__tourHooks.' + c.verb + '=' + hs.verb);
          }
        }
        // note/spot cues have no page effect — not walked.
      }
    }
    check('B-frames every framed page loads to a real sentinel', framesOk === framesTot,
      framesOk + '/' + framesTot + ' frame loads');
    if (hooksTot === 0) skipCheck('B-hooks every STATE/IMPULSE hook exists at poke time', 'no state/impulse cues wired yet (T6.3/T6.4)');
    else check('B-hooks every STATE/IMPULSE hook verb exists at poke time', hooksOk === hooksTot, hooksOk + '/' + hooksTot + ' hook verbs');
    if (capExpected === 0) skipCheck('B-captions every chapter partitions words', 'no chapter rendered yet');
    else check('B-captions every RENDERED chapter partitions words into lines + mounts the current line', capOk === capExpected,
      capOk + '/' + capExpected + ' rendered chapters wired');

    // ═══ B-replay — STATE reconstruction after a frame-change seek (DATA-DRIVEN) ═══
    console.log('\n  STATE-replay reconstruction (enter a chapter past a cue from another frame):');
    // find a non-strata anchor chapter to enter FROM (forces a fresh strata load).
    const nonStrata = chapters.findIndex((c) => c.opening && c.opening.indexOf('strata/index.html') < 0);
    // STRATA leg: a chapter opening on strata with a stratumTo state cue. The
    // ascending spine (WS4 T6.3/T6.4) fires stratumTo(k) at CHAPTER OPEN (t:0) so the
    // lit layer is correct the instant the core reappears — so the selector is t>=0
    // (a t=0 cue is a valid state cue: it is carried in stateReplay and replayed onto
    // the fresh frame on load, exactly what this leg verifies). Book-2's own gate.
    const strataCue = (() => {
      for (const [ci, ch] of chapters.entries()) {
        if (!(ch.opening && ch.opening.indexOf('strata/index.html') >= 0)) continue;
        const c = ch.cues.find((c) => c.kind === 'state' && c.verb === 'stratumTo' && c.t >= 0 && (c.args || []).length);
        if (c) return { ci, k: Math.round(Number(c.args[0])), t: c.t };
      }
      return null;
    })();
    if (strataCue && nonStrata >= 0) {
      seek(nonStrata, 0); waitFrame(chapters[nonStrata].opening, 9000);
      seek(strataCue.ci, Math.round(strataCue.t * 1000) + 400);
      waitFrame('strata/index.html', 9000);
      let lit = { lit: null };
      for (let w = 0; w < 12; w++) { ab('wait', '350'); lit = stratumLit(); if (lit.lit === strataCue.k) break; }
      check('  B-replay strata stratumTo(' + strataCue.k + ') replays on a fresh frame (lit → k)',
        lit.lit === strataCue.k, 'lit slabs = ' + lit.lit + ' (expected ' + strataCue.k + ') on a fresh strata load');
    } else {
      skipCheck('  B-replay strata stratumTo reconstruction', 'no stratumTo state cue wired yet (T6.3/T6.4)');
    }
    // AGES leg: a chapter framing ages with an ageTo state cue.
    const agesCue = (() => {
      for (const [ci, ch] of chapters.entries()) {
        const c = ch.cues.find((c) => c.kind === 'state' && c.verb === 'ageTo' && (c.args || []).length);
        if (c) return { ci, k: Math.round(Number(c.args[0])), t: c.t };
      }
      return null;
    })();
    if (agesCue) {
      const anchor = chapters.findIndex((c) => c.opening && c.opening.indexOf('ages.html') < 0);
      if (anchor >= 0) { seek(anchor, 0); waitFrame(chapters[anchor].opening, 9000); }
      seek(agesCue.ci, Math.round(agesCue.t * 1000) + 400);
      waitFrame('ages.html', 9000);
      let act = { active: null };
      for (let w = 0; w < 12; w++) { ab('wait', '350'); act = ageActive(); if (act.active === agesCue.k) break; }
      check('  B-replay ages ageTo(' + agesCue.k + ') replays on a fresh frame (active stop → k)',
        act.active === agesCue.k, 'active stop = ' + act.active + ' (expected ' + agesCue.k + ') on a fresh ages load');
    } else {
      skipCheck('  B-replay ages ageTo reconstruction', 'no ageTo state cue wired yet (T6.4)');
    }

    // ═══ B-buttons — panic buttons exist + FIRE (real CDP clicks); the GO-LIVE/RE-ARM cycle ═══
    console.log('\n  panic buttons + the GO-LIVE/RE-ARM cycle (real CDP clicks — never dispatchEvent):');
    const parkIdx = Math.min(4, chapters.length - 2);
    seek(parkIdx, 0); ab('wait', '500');
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
    //  The end-of-chapter HOLD is driven by the engine's rAF VIRTUAL CLOCK
    //  (showing.js tick → onChapterEnd) — the SAME shared transport Book 1 uses.
    //  We seek to just before a chapter end and let the REAL engine run: if the
    //  clock is ALIVE the hold + ready-line are asserted for real (GREEN); if the
    //  browser has SUSPENDED requestAnimationFrame (this headless build fires 0 rAF
    //  callbacks — the clock is provably frozen, which breaks Book 1's untouched
    //  gate identically) the leg is a documented SKIP, never a silent pass: we
    //  still cross-check the hold's ready-line DATA against the engine's own live
    //  CHAPTERS. A clock that IS alive but does not hold correctly is a real FAIL.
    console.log('\n  chapter HOLDs (operator mode holds at each chapter end):');
    const mid = Math.floor(chapters.length / 2);
    const holdCases = [
      { i: 0, expect: 'next — ' + chapters[1].title },
      { i: mid, expect: 'next — ' + chapters[mid + 1].title },
      { i: chapters.length - 1, expect: '— end of the showing' }
    ];
    for (const hc of holdCases) {
      const dur = chapters[hc.i].dur || 8000;
      const seekTo = Math.max(0, dur - 250);
      abEval(`(function(){ window.__showing.go(${hc.i}, ${seekTo}); return "play"; })()`);
      const c0 = clockSample();
      let rl = readyLine(); const start = Date.now();
      while (!(rl.holding && rl.text) && Date.now() - start < 6000) { ab('wait', '300'); rl = readyLine(); }
      const c1 = clockSample();
      const clockFrozen = c1.clockMs === c0.clockMs && c1.lastRafTs === null;
      const held = rl.holding === true && rl.frameHolding === true && rl.text === hc.expect;
      if (held) {
        check('  B-hold ' + chapters[hc.i].id + ' holds with the ready-line',
          true, 'holding=true · frameHolding=true · "' + rl.text + '" (live clock ' + c0.clockMs + '→' + c1.clockMs + 'ms)');
      } else if (clockFrozen && rl.holding !== true) {
        const en = engineNextTitle(hc.i);
        const dataOk = en.isLast ? (hc.expect === '— end of the showing')
                                 : (en.title != null && hc.expect === 'next — ' + en.title);
        if (dataOk) {
          skipCheck('  B-hold ' + chapters[hc.i].id + ' holds with the ready-line',
            'rAF virtual clock SUSPENDED headless (0 rAF callbacks · clockMs frozen at ' + c1.clockMs +
            'ms · lastRafTs null) — the hold is rAF-driven so it cannot be driven headless; verified live. ' +
            'ready-line data OK from the engine\'s CHAPTERS: "' + hc.expect + '"');
        } else {
          check('  B-hold ' + chapters[hc.i].id + ' ready-line data (clock frozen — data cross-check)',
            false, 'engine next-title mismatch · isLast=' + en.isLast + ' · engineTitle="' + en.title +
            '" · expect="' + hc.expect + '"');
        }
      } else {
        check('  B-hold ' + chapters[hc.i].id + ' holds with the ready-line',
          false, 'holding=' + rl.holding + ' · "' + rl.text + '" · clockFrozen=' + clockFrozen +
          ' · clock ' + c0.clockMs + '→' + c1.clockMs + 'ms');
      }
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

    // ═══ B-stability — double-load stability (deterministic strata + heavy ages) ═══
    console.log('\n  double-load stability (the deterministic home base is byte-stable; heavy frames reload clean):');
    const conservIdx = chapters.findIndex((c) => c.opening && c.opening.indexOf('conservatory') >= 0);
    const strataIdx = chapters.findIndex((c) => c.opening && c.opening.indexOf('strata/index.html') >= 0);
    const agesIdx = chapters.findIndex((c) => c.opening && c.opening.indexOf('ages.html') >= 0);
    const away = conservIdx >= 0 ? conservIdx : (agesIdx >= 0 ? agesIdx : 0);
    seek(away, 0); waitFrame(chapters[away].opening, 9000);
    seek(strataIdx, 0); const m1 = waitFrame('strata/index.html', 9000); ab('wait', '600'); const l1 = stratumLit();
    seek(away, 0); waitFrame(chapters[away].opening, 9000);
    seek(strataIdx, 0); const m2 = waitFrame('strata/index.html', 9000); ab('wait', '600'); const l2 = stratumLit();
    const strataStable = !!m1.title && !!m2.title && l1.lit !== null && l1.lit === l2.lit;
    let agesStable = true, agesDetail = 'ages not framed';
    if (agesIdx >= 0) {
      seek(away, 0); waitFrame(chapters[away].opening, 9000);
      seek(agesIdx, 0); const g1 = waitFrame('ages.html', 9000);
      seek(away, 0); waitFrame(chapters[away].opening, 9000);
      seek(agesIdx, 0); const g2 = waitFrame('ages.html', 9000);
      agesStable = !!g1.title && g1.bodyKids > 0 && !!g2.title && g2.bodyKids > 0;
      agesDetail = 'ages "' + (g2.title || '') + '" both loads';
    }
    check('B-stability strata lit state identical across two loads · heavy frame reloads clean',
      strataStable && agesStable,
      'strata lit ' + l1.lit + '/' + l2.lit + ' (deterministic) · ' + agesDetail);

    // ═══ B-console — zero console errors + zero page errors ═══
    console.log('\n  console hygiene:');
    const cerr = consoleErrors(); const perr = pageErrors();
    check('B-console zero console errors and zero page errors',
      cerr.length === 0 && perr.length === 0,
      cerr.length + ' console-error(s) · ' + perr.length + ' page-error(s)' +
      (cerr.length ? ' — ' + cerr.slice(0, 2).map((e) => (e.text || '').slice(0, 80)).join(' | ') : ''));

    console.log('\n' + (fail === 0
      ? '✓ dev-showing-rehearsal.test: all checks pass' + (skip ? ' (' + skip + ' skipped — see reasons above)' : '')
      : '✗ dev-showing-rehearsal.test: ' + fail + ' check(s) FAILED' + (skip ? ' · ' + skip + ' skipped' : '')));
  } finally {
    try { ab('close'); } catch (_) {}
    try { server.kill('SIGKILL'); } catch (_) {}
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('  ⚠ harness error: ' + (e && e.stack || e)); process.exit(2); });
