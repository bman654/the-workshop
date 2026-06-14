#!/usr/bin/env node
// ============================================================================
//  tools/carnot/carnot-render.cjs — the headless ear for the Carnot ♪ Listen voice
//
//  Renders THREE WAVs to /tmp/carnot/ driving the REAL heat-voice-core +
//  carnotVoiceSamples with a dS pulled from the REAL irreversibleLedger:
//    home       — reversible loop, dS(leak=0)=0 ⇒ 0 cents ⇒ A3 unison
//    leak_small — the shipped default semitone, dS(ΔT=30) ⇒ ~138 cents
//    leak_big   — EXAGGERATED via render-only centsPerJK=600 so the bend clears
//                 the audio-lens's pitch-detection floor
//  Then it ASSERTS via the audio-lens (the only way to "hear" headlessly):
//    · home NOT silent (silenceRatio < 0.2), NOT clipping (clips===false &&
//      peakDb <= -9), note === 'A3' within ±25 cents
//    · leak_big f0 > home·1.01 (detectably sharper) && clips === false
//    · a 0→80K leak sweep is monotone non-decreasing in f0
//  Emits home_spec.png / leak_spec.png. Exit 0 = green.
//
//  Run:  node tools/carnot/carnot-render.cjs
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CORE = path.join(ROOT, 'engine-room', 'carnot', 'heat-voice-core.mjs');
const LENS = path.join(process.env.HOME, '.claude', 'skills', 'audio-lens', 'bin', 'audio-lens.js');
const OUT = path.join('/tmp', 'carnot');
const SR = 44100;

// ── minimal 16-bit PCM mono WAV writer (no deps) ─────────────────────────────
function writeWav(file, samples, sr){
  const N = samples.length;
  const buf = Buffer.alloc(44 + N * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(N * 2, 40);
  for(let i = 0; i < N; i++){
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

function lens(wav, extraArgs){
  const out = execFileSync('node', [LENS, 'analyze', wav, ...(extraArgs || [])], { encoding: 'utf8' });
  return JSON.parse(out);
}

let failures = 0;
function assert(name, ok, info){
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (info ? '  ·  ' + info : ''));
  if(!ok) failures++;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const HV = await import('url').then(u => import(u.pathToFileURL(CORE).href));
  const { carnotStates, irreversibleLedger } = await import('url').then(u => import(u.pathToFileURL(path.join(ROOT, 'engine-room', 'carnot', 'core.mjs')).href));

  // the REAL ledger numbers for the shipped default cycle
  const cyc = carnotStates(500, 300, 3);
  const dsHome = 0;                                            // reversible: leak=0
  const dsSmall = irreversibleLedger(cyc, 30).dS_universe;    // the shipped-default semitone
  const dsBig = irreversibleLedger(cyc, 30).dS_universe;      // same dS, exaggerated mapping below

  console.log('\n  Carnot ♪ Listen — headless render + audio-lens verification\n');
  console.log('  REAL ledger: dS(leak=0)=' + dsHome.toFixed(4) + '  dS(ΔT=30)=' + dsSmall.toFixed(4) + ' J/K');
  console.log('  cents: home=' + HV.entropyToCents(dsHome).toFixed(2) +
              '  small=' + HV.entropyToCents(dsSmall).toFixed(2) +
              '  big(×600)=' + HV.entropyToCents(dsBig, 600).toFixed(2) + '\n');

  // ── render the three voices ───────────────────────────────────────────────
  const homeWav = path.join(OUT, 'home.wav');
  const smallWav = path.join(OUT, 'leak_small.wav');
  const bigWav = path.join(OUT, 'leak_big.wav');
  // home: the PAGE's actual unison voice (both tones at 220 ⇒ lens reads A3 cleanly).
  writeWav(homeWav, HV.carnotVoiceSamples({ dS_universe: dsHome, seconds: 2.5, sr: SR }), SR);
  // leak_small: the page's actual beating pair at the shipped default semitone.
  writeWav(smallWav, HV.carnotVoiceSamples({ dS_universe: dsSmall, seconds: 2.5, sr: SR }), SR);
  // leak_big: isolate the BENT voice (driftMix=1) so the monophonic pitch detector
  // reads the drift frequency unambiguously — two strong tones an interval apart
  // confuse autocorrelation into a low pseudo-period. Same fDrift, same physics.
  writeWav(bigWav, HV.carnotVoiceSamples({ dS_universe: dsBig, seconds: 2.5, sr: SR, centsPerJK: 600, homeMix: 0, driftMix: 1 }), SR);

  // ── analyze ───────────────────────────────────────────────────────────────
  const home = lens(homeWav, ['--spectrogram', path.join(OUT, 'home_spec.png')]);
  const big = lens(bigWav, ['--spectrogram', path.join(OUT, 'leak_spec.png')]);
  const small = lens(smallWav);

  console.log('  home : f0=' + home.f0 + ' Hz  note=' + home.monoNote.name + ' (' + home.monoNote.cents + 'c)' +
              '  peakDb=' + home.peak.peakDb + '  clips=' + home.clipping + '  silence=' + home.silenceRatio);
  console.log('  small: f0=' + small.f0 + ' Hz  note=' + small.monoNote.name + ' (' + small.monoNote.cents + 'c)' +
              '  peakDb=' + small.peak.peakDb + '  clips=' + small.clipping);
  console.log('  big  : f0=' + big.f0 + ' Hz  note=' + big.monoNote.name + ' (' + big.monoNote.cents + 'c)' +
              '  peakDb=' + big.peak.peakDb + '  clips=' + big.clipping + '\n');

  // ── the assertions (the audible claim, made falsifiable) ──────────────────
  assert('home NOT silent (silenceRatio < 0.2)', home.silenceRatio < 0.2, 'silenceRatio=' + home.silenceRatio);
  assert('home NOT clipping (clips===false && peakDb <= -9)', home.clipping === false && home.peak.peakDb <= -9, 'peakDb=' + home.peak.peakDb);
  assert('home note === A3 within ±25 cents', home.monoNote.name === 'A3' && Math.abs(home.monoNote.cents) <= 25, home.monoNote.name + ' ' + home.monoNote.cents + 'c');
  assert('leak_big detectably sharper than home (f0 > home·1.01)', big.f0 > home.f0 * 1.01, 'big f0=' + big.f0 + ' vs home·1.01=' + (home.f0 * 1.01).toFixed(1));
  assert('leak_big NOT clipping', big.clipping === false, 'peakDb=' + big.peak.peakDb);

  // ── 0→80K leak sweep monotone non-decreasing in f0 (the arrow, by ear) ─────
  {
    let monotone = true, prev = -Infinity, detail = '';
    const f0s = [];
    for(let dT = 0; dT <= 80; dT += 16){
      const ds = dT === 0 ? 0 : irreversibleLedger(cyc, dT).dS_universe;
      const w = path.join(OUT, 'sweep_' + dT + '.wav');
      // exaggerate AND isolate the drift voice so each step's pitch is read cleanly
      writeWav(w, HV.carnotVoiceSamples({ dS_universe: ds, seconds: 1.2, sr: SR, centsPerJK: 600, homeMix: 0, driftMix: 1 }), SR);
      const a = lens(w);
      f0s.push(dT + 'K→' + a.f0);
      if(a.f0 < prev - 0.5){ monotone = false; detail = 'dT=' + dT + ' f0=' + a.f0 + ' < prev=' + prev; }
      prev = a.f0;
      fs.unlinkSync(w);
    }
    assert('0→80K leak sweep monotone non-decreasing in f0', monotone, monotone ? f0s.join('  ') : detail);
  }

  console.log('\n  spectrograms: ' + path.join(OUT, 'home_spec.png') + '  ·  ' + path.join(OUT, 'leak_spec.png'));
  console.log('\n  ' + (failures === 0 ? '✓ ALL GREEN' : '✗ ' + failures + ' FAILURE(S)') + '\n');
  process.exit(failures === 0 ? 0 : 1);
})().catch(err => { console.error('render tool threw:', err); process.exit(2); });
