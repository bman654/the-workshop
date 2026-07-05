#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   cue-engine.test.mjs — Node twin for talk/cue-engine.js (THE SHOWING's core).
   Run:  node talk/cue-engine.test.mjs   (exit 0 = all pass, exit 1 = a failure)

   The cue engine exposes its whole seek/scrub/hash decision surface as PURE
   functions (no DOM, no audio, no clock of its own), so the deck's behaviour can
   be driven to completion with no browser. This twin proves (DESIGN §10, T4.1
   acceptance):
     • cue introspection + STABLE sort (ties keep authoring order);
     • frameAt / stateCuesUpTo keyframe + replay-list derivation;
     • deriveSeek — including the headline case: a BACKWARD scrub across a frame
       boundary re-derives the earlier frame AND replays exactly the state cues
       ≤ t in order, while impulse/spot/note cues are NEVER replayed (forward-
       fire-only);
     • cuesInRange forward-playback firing over (from, to];
     • createScrubDebounce collapse — a drag across three boundaries reloads
       ONCE, and a drag that returns home reloads ZERO times;
     • encodeHash/parseHash round-trip (+ floor/clamp/malformed → null) and the
       shouldMirror coarse throttle;
     • lint (absolute-frame + malformed-cue + duplicate-id nets).
   No deps beyond Node + the sibling cue-engine.js.
   ═══════════════════════════════════════════════════════════════════════════ */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const C = require(join(__dirname, 'cue-engine.js'));

/* ── tiny assert harness (tour.test.mjs / ws.test.cjs style) ─────────────────── */
let pass = 0, fail = 0;
function ok(cond, label) { if (cond) pass++; else { fail++; console.error('  ✗ FAIL: ' + label); } }
function eq(a, b, label) { ok(a === b, label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function jeq(a, b, label) { ok(JSON.stringify(a) === JSON.stringify(b), label + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

/* ── the test chapter (cues deliberately authored OUT of t order) ─────────────
   sorted by t:  0 state{to:0}  ·  2 state{to:1}  ·  3 note  ·  4 spot  ·
                 5 frame→SLIT   ·  6 state{to:2}   ·  7 impulse fire
   opening frame = the dusk-pinned map. The state cues sit BOTH before and after
   the frame boundary at t=5, so a backward seek across it must replay only the
   ones ≤ target. */
const MAP = '../index.html?hours=allon';
const SLIT = '../cavern/double-slit/index.html';
const CH = {
  id: 'ch-test', title: 'Test Chapter', audio: 'ch-test.mp3', timing: 'ch-test.json',
  opening: { frame: MAP },
  cues: [
    { t: 6, state: { hook: 'crank', to: 2 } },
    { t: 2, state: { hook: 'crank', to: 1 } },
    { t: 7, impulse: { hook: 'fire' } },
    { t: 5, frame: SLIT },
    { t: 4, spot: { sel: '#thing' } },
    { t: 3, note: 'operator: watch the sweep' },
    { t: 0, state: { hook: 'crank', to: 0 } }
  ]
};
/* helper: the .to values of a state-cue list, in order */
const tos = (list) => list.map((c) => c.state.to);

/* ══════════════════════════════════════════════════════════════════════════
   1) cue introspection + stable sort
   ══════════════════════════════════════════════════════════════════════════ */
eq(C.cueKind({ t: 1, frame: 'x' }), 'frame', 'cueKind: frame');
eq(C.cueKind({ t: 1, state: {} }), 'state', 'cueKind: state');
eq(C.cueKind({ t: 1, impulse: {} }), 'impulse', 'cueKind: impulse');
eq(C.cueKind({ t: 1, spot: {} }), 'spot', 'cueKind: spot');
eq(C.cueKind({ t: 1, note: 'n' }), 'note', 'cueKind: note');
eq(C.cueKind({ t: 1 }), null, 'cueKind: no payload → null');
eq(C.cueKind({ t: 1, frame: 'x', note: 'y' }), null, 'cueKind: two payloads → null');
eq(C.cueKind(null), null, 'cueKind: null cue → null');

/* sortedCues never mutates + sorts stably by t (ties keep authoring order) */
{
  const before = JSON.stringify(CH.cues);
  const s = C.sortedCues(CH);
  jeq(s.map((c) => C.cueKind(c)),
    ['state', 'state', 'note', 'spot', 'frame', 'state', 'impulse'],
    'sortedCues: ascending by t, all kinds present');
  eq(JSON.stringify(CH.cues), before, 'sortedCues: does not mutate the source array');
  const TIE = { id: 'tie', opening: { frame: '../a.html' },
    cues: [{ t: 1, note: 'first' }, { t: 1, note: 'second' }, { t: 0.5, note: 'zeroth' }] };
  jeq(C.sortedCues(TIE).map((c) => c.note), ['zeroth', 'first', 'second'],
    'sortedCues: stable on equal t (authoring order preserved)');
}

/* ══════════════════════════════════════════════════════════════════════════
   2) frameAt + stateCuesUpTo (keyframe + replay-list)
   ══════════════════════════════════════════════════════════════════════════ */
eq(C.frameAt(CH, 0), MAP, 'frameAt(0): opening frame (no frame cue yet)');
eq(C.frameAt(CH, 4.999), MAP, 'frameAt(4.999): still opening (frame cue is at 5)');
eq(C.frameAt(CH, 5), SLIT, 'frameAt(5): frame cue lands exactly at t');
eq(C.frameAt(CH, 8), SLIT, 'frameAt(8): latest frame cue ≤ t');
eq(C.frameAt(CH, -1), MAP, 'frameAt(-1): before everything → opening');
eq(C.frameAt({ id: 'x', cues: [] }, 3), null, 'frameAt: no opening + no frame cue → null');

jeq(tos(C.stateCuesUpTo(CH, 8)), [0, 1, 2], 'stateCuesUpTo(8): all three state cues in order');
jeq(tos(C.stateCuesUpTo(CH, 3)), [0, 1], 'stateCuesUpTo(3): only ≤ 3 (t=6 excluded)');
jeq(tos(C.stateCuesUpTo(CH, 2)), [0, 1], 'stateCuesUpTo(2): inclusive of a cue landing exactly at t');
jeq(tos(C.stateCuesUpTo(CH, -1)), [], 'stateCuesUpTo(-1): none');

/* ══════════════════════════════════════════════════════════════════════════
   3) deriveSeek — THE HEART (DESIGN §10)
   ══════════════════════════════════════════════════════════════════════════ */
/* 3a) HEADLINE: a backward scrub across the frame boundary at t=5.
   We are showing SLIT at t=8; seek back to t=3 (before the boundary). */
{
  const r = C.deriveSeek(CH, 3, SLIT);
  eq(r.frame, MAP, 'deriveSeek back-across-boundary: re-derives the earlier (opening) frame');
  eq(r.frameChanged, true, 'deriveSeek back-across-boundary: frameChanged (SLIT → MAP, reload)');
  jeq(tos(r.stateReplay), [0, 1], 'deriveSeek back-across-boundary: replays exactly the state cues ≤ 3, IN ORDER');
  eq(r.t, 3, 'deriveSeek: echoes the target time');
}
/* 3b) forward seek past the frame boundary: frame SLIT, all three states replayed */
{
  const r = C.deriveSeek(CH, 6.5, MAP);
  eq(r.frame, SLIT, 'deriveSeek forward past boundary: derives SLIT');
  eq(r.frameChanged, true, 'deriveSeek forward past boundary: frameChanged (MAP → SLIT)');
  jeq(tos(r.stateReplay), [0, 1, 2], 'deriveSeek forward past boundary: all three states replayed in order');
}
/* 3c) IMPULSE forward-only: seeking to t=7.5 (past the t=7 impulse) must NOT
       include the impulse in the re-derivation — state list is unchanged. */
{
  const r = C.deriveSeek(CH, 7.5, MAP);
  jeq(tos(r.stateReplay), [0, 1, 2], 'deriveSeek(7.5): impulse (t=7) NOT replayed — state list is state-only');
  eq(r.stateReplay.some((c) => C.cueKind(c) !== 'state'), false, 'deriveSeek: stateReplay carries ONLY state cues (no impulse/spot/note)');
}
/* 3d) "re-set only if changed": frame equals currently-shown → frameChanged false */
{
  const r = C.deriveSeek(CH, 8, SLIT);
  eq(r.frame, SLIT, 'deriveSeek(8, showing SLIT): frame SLIT');
  eq(r.frameChanged, false, 'deriveSeek: frame unchanged → frameChanged false (no needless reload)');
}
/* 3e) seek to the very start */
{
  const r = C.deriveSeek(CH, 0, SLIT);
  eq(r.frame, MAP, 'deriveSeek(0): opening frame');
  jeq(tos(r.stateReplay), [0], 'deriveSeek(0): the t=0 state replays');
}

/* ══════════════════════════════════════════════════════════════════════════
   4) cuesInRange — forward playback firing over (from, to]
   ══════════════════════════════════════════════════════════════════════════ */
jeq(C.cuesInRange(CH, -Infinity, 2).map((c) => C.cueKind(c)), ['state', 'state'],
  'cuesInRange(-inf,2]: fires the t=0 and t=2 cues (tFrom<0 includes t=0)');
jeq(C.cuesInRange(CH, 4, 6).map((c) => C.cueKind(c)), ['frame', 'state'],
  'cuesInRange(4,6]: half-open low (spot@4 excluded), inclusive high (state@6 included)');
jeq(C.cuesInRange(CH, 6, 7).map((c) => C.cueKind(c)), ['impulse'],
  'cuesInRange(6,7]: the impulse fires on forward crossing');
jeq(C.cuesInRange(CH, 2, 2), [], 'cuesInRange(2,2]: empty window fires nothing (no re-fire at the same t)');
jeq(C.cuesInRange(CH, -Infinity, Infinity).map((c) => C.cueKind(c)),
  ['state', 'state', 'note', 'spot', 'frame', 'state', 'impulse'],
  'cuesInRange(all): every cue, ascending, all kinds');

/* ══════════════════════════════════════════════════════════════════════════
   5) createScrubDebounce — collapse (DESIGN §10)
   ══════════════════════════════════════════════════════════════════════════ */
/* 5a) non-scrub proposals load immediately + dedupe against the loaded frame */
{
  const d = C.createScrubDebounce();
  d.sync(MAP);
  eq(d.propose(MAP), null, 'debounce (idle): proposing the loaded frame → null (no reload)');
  eq(d.propose(SLIT), SLIT, 'debounce (idle): proposing a new frame → loads it now');
  eq(d.propose(SLIT), null, 'debounce (idle): re-proposing the same frame → null');
  eq(d.current(), SLIT, 'debounce: current() tracks the loaded frame');
}
/* 5b) HEADLINE: a scrub across THREE boundaries reloads ONCE (the final frame) */
{
  const d = C.createScrubDebounce();
  d.sync('open.html');
  eq(d.scrubbing(), false, 'debounce: not scrubbing before begin()');
  d.begin();
  eq(d.scrubbing(), true, 'debounce: scrubbing after begin()');
  let mid = 0;
  if (d.propose('a.html') !== null) mid++;
  if (d.propose('b.html') !== null) mid++;
  if (d.propose('c.html') !== null) mid++;
  eq(mid, 0, 'debounce: NO reloads emitted mid-scrub (all three deferred)');
  eq(d.release(), 'c.html', 'debounce: release loads the FINAL frame once');
  eq(d.scrubbing(), false, 'debounce: not scrubbing after release()');
  eq(d.current(), 'c.html', 'debounce: current() is the released frame');
}
/* 5c) a scrub that returns HOME reloads zero times */
{
  const d = C.createScrubDebounce();
  d.sync('home.html');
  d.begin();
  d.propose('away.html');
  d.propose('home.html');
  eq(d.release(), null, 'debounce: drag that ends on the loaded frame → null (zero reloads)');
  eq(d.current(), 'home.html', 'debounce: still home after a round-trip drag');
}
/* 5d) release with no proposals → null */
{
  const d = C.createScrubDebounce();
  d.sync('x.html');
  d.begin();
  eq(d.release(), null, 'debounce: release with no proposal → null');
}

/* ══════════════════════════════════════════════════════════════════════════
   6) hash mirror round-trip + coarse throttle (DESIGN §10)
   ══════════════════════════════════════════════════════════════════════════ */
eq(C.encodeHash({ chapter: 'ch07', offsetMs: 125300 }), '#ch=ch07&t=125300', 'encodeHash: basic form');
jeq(C.parseHash('#ch=ch07&t=125300'), { chapter: 'ch07', offsetMs: 125300 }, 'parseHash: basic form');
/* round-trip several states */
[{ chapter: 'ch01', offsetMs: 0 }, { chapter: 'ch13', offsetMs: 1080000 }, { chapter: 'a b', offsetMs: 42 }].forEach((st, i) => {
  jeq(C.parseHash(C.encodeHash(st)), st, 'hash round-trip #' + (i + 1) + ' (' + st.chapter + ')');
});
eq(C.encodeHash({ chapter: 'a b', offsetMs: 42 }), '#ch=a%20b&t=42', 'encodeHash: percent-encodes the chapter id');
eq(C.encodeHash({ chapter: 'ch01', offsetMs: 1234.9 }), '#ch=ch01&t=1234', 'encodeHash: floors fractional ms');
eq(C.encodeHash({ chapter: 'ch01', offsetMs: -5 }), '#ch=ch01&t=0', 'encodeHash: clamps negative ms to 0');
eq(C.encodeHash({ chapter: '', offsetMs: 5 }), '', 'encodeHash: empty chapter → empty (nothing to mirror)');
eq(C.encodeHash(null), '', 'encodeHash: null state → empty');
/* parse robustness → null for malformed */
eq(C.parseHash(null), null, 'parseHash: null → null');
eq(C.parseHash(''), null, 'parseHash: empty → null');
eq(C.parseHash('#'), null, 'parseHash: bare # → null');
eq(C.parseHash('#t=5'), null, 'parseHash: no chapter → null');
eq(C.parseHash('#ch=ch01'), null, 'parseHash: no time → null');
eq(C.parseHash('#ch=ch01&t=abc'), null, 'parseHash: non-numeric time → null');
eq(C.parseHash('#ch=ch01&t=-3'), null, 'parseHash: negative time (no digit match) → null');
jeq(C.parseHash('#t=99&ch=ch03'), { chapter: 'ch03', offsetMs: 99 }, 'parseHash: key order independent');
jeq(C.parseHash('ch=ch03&t=99'), { chapter: 'ch03', offsetMs: 99 }, 'parseHash: tolerates a missing leading #');
/* shouldMirror coarse throttle */
eq(C.shouldMirror(null, 0, 1000), true, 'shouldMirror: first write (lastMs null) → true');
eq(C.shouldMirror(0, 500, 1000), false, 'shouldMirror: within the coarse window → false');
eq(C.shouldMirror(0, 1000, 1000), true, 'shouldMirror: exactly coarseMs elapsed → true');
eq(C.shouldMirror(0, 1500, 1000), true, 'shouldMirror: past the window → true');

/* ══════════════════════════════════════════════════════════════════════════
   7) lint — absolute-frame / malformed-cue / duplicate-id nets
   ══════════════════════════════════════════════════════════════════════════ */
eq(C.isAbsoluteFrame('../index.html?hours=allon'), false, 'isAbsoluteFrame: relative → false');
eq(C.isAbsoluteFrame('index.html'), false, 'isAbsoluteFrame: bare relative → false');
eq(C.isAbsoluteFrame('/the-workshop/index.html'), true, 'isAbsoluteFrame: root-anchored → true');
eq(C.isAbsoluteFrame('//cdn/x'), true, 'isAbsoluteFrame: protocol-relative → true');
eq(C.isAbsoluteFrame('http://x/'), true, 'isAbsoluteFrame: http scheme → true');
eq(C.isAbsoluteFrame('https://x/'), true, 'isAbsoluteFrame: https scheme → true');
eq(C.isAbsoluteFrame('file:///x'), true, 'isAbsoluteFrame: file scheme → true');

jeq(C.lintChapter(CH), [], 'lintChapter: the clean test chapter has no problems');
{
  const bad = {
    id: 'bad',
    opening: { frame: '/abs/root.html' },
    cues: [
      { t: 1, frame: 'https://evil/x' },
      { t: NaN, note: 'n' },
      { t: 2 },
      { t: 3, frame: 'x', note: 'y' }
    ]
  };
  const p = C.lintChapter(bad);
  ok(p.some((s) => /opening\.frame is absolute/.test(s)), 'lintChapter: flags an absolute opening frame');
  ok(p.some((s) => /cue\[0\]: frame is absolute/.test(s)), 'lintChapter: flags an absolute frame cue');
  ok(p.some((s) => /cue\[1\]: t is not a finite number/.test(s)), 'lintChapter: flags a NaN t');
  ok(p.some((s) => /cue\[2\]: must carry exactly one/.test(s)), 'lintChapter: flags a payload-less cue');
  ok(p.some((s) => /cue\[3\]: must carry exactly one/.test(s)), 'lintChapter: flags a two-payload cue');
  ok(C.lintChapter({ cues: [] }).some((s) => /missing opening\.frame/.test(s)), 'lintChapter: flags a missing opening frame');
}
jeq(C.lintChapters([CH]), [], 'lintChapters: a single clean chapter → no problems');
ok(C.lintChapters([{ id: 'dup', opening: { frame: '../a.html' }, cues: [] },
  { id: 'dup', opening: { frame: '../b.html' }, cues: [] }]).some((s) => /duplicate chapter id "dup"/.test(s)),
  'lintChapters: flags a duplicate chapter id');
eq(C.lintChapters('nope')[0], 'CHAPTERS is not an array', 'lintChapters: non-array → clear problem');

/* ── report ───────────────────────────────────────────────────────────────── */
const total = pass + fail;
if (fail) { console.error('\ncue engine self-test: ' + pass + '/' + total + ' PASS — ' + fail + ' FAILED'); process.exit(1); }
console.log('cue engine self-test: ' + total + '/' + total + ' PASS');
process.exit(0);
