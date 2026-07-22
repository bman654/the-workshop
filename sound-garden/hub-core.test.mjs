// ============================================================================
//  THE PIPE RACK — the Node twin. The hub is a CLAIM-FREE delight (a rack of tuned
//  pipes you strum), so this twin proves not a theorem but the things that keep the
//  delight honest and single-sourced:
//    1. BYTE-TWIN PARITY — the PITCH CORE slice the hub inlines is char-for-char
//       ../pitch-core.mjs (src AND the shipped index.html), so the pipe pitches are
//       the estate's ONE equal-temperament anchor, not a re-typed copy.
//    2. ANTI-CIRCULARITY — the anchor literal 261.625565 appears in the hub ONLY
//       inside that sanctioned byte-twin block (nowhere re-typed in the audio path),
//       and it lives in ../pitch-core.mjs.
//    3. TUNING IS CONSONANT BY CONSTRUCTION — the pentatonic index map never places
//       two pipes a minor-2nd or a tritone apart within an octave (no clash possible).
//    4. EVERY ROOM HREF RESOLVES — the door still opens every room; no room-count
//       regression (the manifest's rooms + the shelf + the footer all map to files).
//  The AUDIO payoff-liveness (a preview EMITS non-silent, non-clipping sound on the
//  real pluck path; the mute stills the master) needs Web Audio and is asserted by the
//  IN-PAGE pill (OfflineAudioContext) — Node has no audio context. Run: node --test.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(__dir, p), 'utf8');
function sliceBetween(text, begin, end){
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i < 0 || j < 0) throw new Error(`sentinel not found: ${i<0?begin:end}`);
  return text.slice(i, j + end.length);
}
const PB = '// ===== PITCH CORE (inlined byte-twin) BEGIN =====';
const PE = '// ===== PITCH CORE END =====';

const srcHtml = read('index.src.html');
const builtHtml = read('index.html');
const pitchMod = read('pitch-core.mjs');

test('1 — byte-twin parity (PITCH CORE): index.src.html inlines ../pitch-core.mjs char-for-char', () => {
  assert.equal(sliceBetween(srcHtml, PB, PE), sliceBetween(pitchMod, PB, PE));
});

test('1b — the SHIPPED index.html inherited the same PITCH CORE byte-identically (no stale build)', () => {
  assert.equal(sliceBetween(builtHtml, PB, PE), sliceBetween(pitchMod, PB, PE));
});

test('2 — anti-circularity: the anchor 261.625565 appears in the hub ONLY inside the byte-twin block', () => {
  // strip the sanctioned PITCH CORE block from the src, then assert the literal is gone.
  const stripped = srcHtml.replace(sliceBetween(srcHtml, PB, PE), '');
  assert.ok(!/261\.625565/.test(stripped),
    'the pitch anchor was re-typed somewhere in the hub outside the PITCH CORE block');
  // and it truly lives in pitch-core.mjs.
  assert.ok(/261\.625565/.test(pitchMod), 'the anchor is missing from pitch-core.mjs');
});

test('2b — no forked pitch math: the hub RACK ENGINE types no Hz literal and no 2^(n/12)', () => {
  // isolate the rack-engine block (between its banner and the breadcrumb) and assert it
  // produces frequency ONLY through semiToFreq — no bare Hz number, no re-typed ratio.
  const eng = srcHtml.slice(srcHtml.indexOf('THE RACK ENGINE'), srcHtml.indexOf('breadcrumb: record'));
  assert.ok(/semiToFreq\(/.test(eng), 'the rack engine must derive pitch from semiToFreq');
  assert.ok(!/\b\d{2,4}\.\d+\s*\*\s*Math\.pow\(2/.test(eng), 'a re-typed equal-temperament formula');
  assert.ok(!/261\.62/.test(eng), 'a re-typed middle-C anchor in the engine');
});

// ── 3. TUNING (mirror of the hub's semiForIndex; kept in sync by intent) ────────
const PENTA = [0,2,4,7,9];
const semiForIndex = (i) => PENTA[((i%5)+5)%5] + 12*Math.floor(i/5);

test('3 — pentatonic tuning is consonant by construction: no minor-2nd / tritone cluster', () => {
  // within one octave the five degrees never differ by 1, 6 or 11 semitones (pitch class)
  for (let a=0;a<PENTA.length;a++) for (let b=a+1;b<PENTA.length;b++){
    const d = ((PENTA[b]-PENTA[a])%12+12)%12;
    assert.ok(d!==1 && d!==6 && d!==11, `degrees ${a},${b} form a clashing interval (${d} st)`);
  }
  // and the map rises monotonically across two octaves (a real gliss left→right)
  let prev = -Infinity;
  for (let i=0;i<10;i++){ const s=semiForIndex(i); assert.ok(s>prev, `not rising at ${i}`); prev=s; }
  assert.equal(semiForIndex(0), 0);
  assert.equal(semiForIndex(5), 12);   // the sixth pipe is exactly an octave up
});

test('3b — the src still declares this exact PENTA and semiForIndex (twin stays in sync)', () => {
  assert.ok(/var PENTA = \[0,2,4,7,9\];/.test(srcHtml), 'PENTA drifted from the twin');
  assert.ok(/PENTA\[\(\(i%5\)\+5\)%5\] \+ 12\*Math\.floor\(i\/5\)/.test(srcHtml), 'semiForIndex drifted');
});

// ── 4. EVERY ROOM HREF RESOLVES (no room-count regression) ──────────────────────
function hrefsIn(html){
  const out = []; const re = /href="([^"]+)"/g; let m;
  while((m=re.exec(html))){ const h=m[1];
    if(/^https?:|^#|^mailto:/.test(h)) continue; out.push(h.split('#')[0]); }
  return out;
}
test('4 — every room href in the shipped page maps to an existing file (the door opens every room)', () => {
  const hrefs = [...new Set(hrefsIn(builtHtml))];
  assert.ok(hrefs.length >= 20, `expected the full rack of rooms, saw ${hrefs.length} hrefs`);
  const missing = [];
  for(const h of hrefs){ const p = resolve(__dir, h); if(!existsSync(p)) missing.push(h); }
  assert.deepEqual(missing, [], `unresolved room hrefs: ${missing.join(', ')}`);
});

test('4b — every manifest instrument resolves + is tagged with a legal timbre', () => {
  const man = read('instruments.js');
  const files = [...man.matchAll(/file:\s*"([^"]+)"/g)].map(m=>m[1]);
  assert.ok(files.length >= 11, `manifest shrank to ${files.length} rooms (regression)`);
  for(const f of files) assert.ok(existsSync(resolve(__dir, f)), `manifest room missing: ${f}`);
  const timbres = [...man.matchAll(/timbre:\s*"([^"]+)"/g)].map(m=>m[1]);
  const legal = new Set(['bell','pluck','breath','mallet','plink']);
  assert.equal(timbres.length, files.length, 'every instrument must carry a timbre');
  for(const t of timbres) assert.ok(legal.has(t), `illegal timbre: ${t}`);
});
