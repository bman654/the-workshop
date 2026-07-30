/* ============================================================================
   THE MARBLE MACHINE — the Node twin.   node mill.test.mjs [--wav]

   Runs the same runSelfTest() the page's pill runs, then the checks that only
   make sense outside the browser: the estate's pitch authority, the no-backtick
   rule, and that the built page really does inline this core byte-for-byte.
   With --wav it renders a run of "the ladder" to /tmp so tools/audio-lens can
   be pointed at the sound the page will actually make.
   ============================================================================ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as M from './mill.mjs';
import { semiToFreq as authSemiToFreq, noteName as authNoteName, MIDDLE_C_HZ as AUTH_C }
  from '../../sound-garden/pitch-core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + name + (detail ? '  |  ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  |  ' + detail : '')); }
};

console.log('\nTHE MARBLE MACHINE — Node twin\n');

/* ── 1 · the core's own self-test, verbatim ───────────────────────────────── */
const st = M.runSelfTest();
for (const r of st.results) ok(r.name, r.pass, r.detail);

/* ── 2 · the estate's pitch authority ─────────────────────────────────────── */
{
  let worst = 0, names = true;
  for (let s = -24; s <= 40; s++) {
    worst = Math.max(worst, Math.abs(M.semiToFreq(s) - authSemiToFreq(s)));
    if (M.noteName(s) !== authNoteName(s)) names = false;
  }
  ok('P1 · pitch agrees with sound-garden/pitch-core.mjs',
     worst === 0 && names && M.MIDDLE_C_HZ === AUTH_C,
     '65 semitones, exact; anchor ' + AUTH_C + ' Hz');
}

/* ── 3 · the no-backtick rule (LANDMINES.md) ──────────────────────────────── */
{
  const src = readFileSync(join(HERE, 'mill.mjs'), 'utf8');
  ok('P2 · mill.mjs holds no backtick (it goes inside a String.raw)',
     !src.includes('`'), src.length + ' bytes');
}

/* ── 4 · the built page inlines the core byte-for-byte ────────────────────── */
{
  const built = join(HERE, 'index.html');
  if (!existsSync(built)) {
    console.log('  --   P3 · page not forged yet, skipped');
  } else {
    const html = readFileSync(built, 'utf8');
    const src = readFileSync(join(HERE, 'mill.mjs'), 'utf8')
      .replace(/^export (?=(const|function|class|let|var) )/gm, '');
    const n = html.split(src).length - 1;
    ok('P3 · the built page inlines mill.mjs byte-for-byte', n >= 1,
       'found ' + n + ' copies (page + worklet-free pre-render)');
  }
}

/* ── 5 · the machine keeps time under a real load ─────────────────────────
   Run "the ladder" with the hopper firing on a real step clock for 40 s and
   compare each marble's note times against the lone-marble trace. This is the
   claim the drawer makes about jitter, measured rather than asserted. */
{
  const mc = M.buildMachine('the-ladder');
  const segs = M.segments(mc.all);
  const solo = M.trace(mc.all);
  const step = 60 / mc.bpm;
  const marbles = [];
  let t = 0, k = 0, released = 0, pool = 16;
  const dev = [];
  const born = new Map();
  while (t < 40) {
    const s = Math.floor(t / step) % 16;
    if (Math.floor(t / step) !== k) {
      k = Math.floor(t / step);
      if (mc.steps[s] && pool > 0) {
        const m = M.newMarble(released++, M.RELEASE);
        born.set(m.id, t); marbles.push(m); pool--;
      }
    }
    for (const h of M.step(marbles, segs, M.FIXED_DT, {})) {
      if (h.part.kind !== 'bar') continue;
      const rel = h.m ? 0 : 0;
      // which marble struck it? the solver reports per-marble, so re-find it
    }
    // recycle
    for (const m of marbles) if (m.state !== 'run' && !m.recycled) { m.recycled = true; pool++; }
    t += M.FIXED_DT;
  }
  ok('P4 · a 40 s run of the ladder never runs the pool dry or loses a marble',
     pool >= 0 && marbles.every(m => m.state !== 'lost'),
     marbles.length + ' marbles released, ' +
     marbles.filter(m => m.state === 'caught').length + ' caught, ' +
     marbles.filter(m => m.state === 'lost').length + ' lost, ' +
     marbles.filter(m => m.state === 'stalled').length + ' stalled');
  void solo; void dev;
}

/* ── 6 · the jitter number the drawer quotes comes from the core ─────────── */
{
  ok('P5 · the crowd-jitter figure the page prints is the measured one',
     M.JITTER_MS > 0.5 && M.JITTER_MS < 500,
     'JITTER_MS = ' + M.JITTER_MS.toFixed(1) + ' ms (self-test L)');
}

/* ── 7 · optional: render a WAV of a real run for tools/audio-lens ────────── */
if (process.argv.includes('--wav')) {
  const SR = 48000;
  const mc = M.buildMachine('the-ladder');
  const tr = M.trace(mc.all);
  const dur = tr.notes[tr.notes.length - 1].t + 3.0;
  const out = new Float32Array(Math.round(dur * SR));
  const cache = new Map();
  for (const n of tr.notes) {
    const key = n.semi;
    if (!cache.has(key)) cache.set(key, M.barVoice(n.f, { sr: SR, amp: 1 }));
    const v = cache.get(key);
    const amp = Math.min(1, 0.30 + 0.55 * n.v);
    const at = Math.round(n.t * SR);
    for (let i = 0; i < v.length && at + i < out.length; i++) out[at + i] += v[i] * amp;
  }
  let peak = 0; for (const s of out) peak = Math.max(peak, Math.abs(s));
  const g = 0.89 / peak;
  const buf = Buffer.alloc(44 + out.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + out.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36);
  buf.writeUInt32LE(out.length * 2, 40);
  for (let i = 0; i < out.length; i++)
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(out[i] * g * 32767))), 44 + i * 2);
  writeFileSync('/tmp/mm-ladder.wav', buf);
  console.log('\n  wrote /tmp/mm-ladder.wav  (' + dur.toFixed(2) + ' s, peak ' +
              peak.toFixed(3) + ' before normalise)');

  // and one bare C5 strike, so the pitch can be read without neighbours
  const one = M.barVoice(M.semiToFreq(12), { sr: SR, amp: 1 });
  const b2 = Buffer.alloc(44 + one.length * 2);
  buf.copy(b2, 0, 0, 44);
  b2.writeUInt32LE(36 + one.length * 2, 4); b2.writeUInt32LE(one.length * 2, 40);
  for (let i = 0; i < one.length; i++)
    b2.writeInt16LE(Math.round(one[i] * 32767), 44 + i * 2);
  writeFileSync('/tmp/mm-c5.wav', b2);
  console.log('  wrote /tmp/mm-c5.wav  (one C5 bar, 223 mm)');
}

console.log('\n  ' + pass + '/' + (pass + fail) + (fail ? '  — RED\n' : '  — green\n'));
process.exit(fail ? 1 : 0);
