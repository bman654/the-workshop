// ============================================================================
// THE COMPOSER — timing manifest → deterministic event score.
//
// This file IS the locked musical substance (see design/MUSIC.md). It contains
// every musical judgment; render.mjs merely mixes what this emits. Re-rendering
// at new cue times requires ZERO musical decisions: feed a new manifest.
//
// Manifest (all times in ms; every field except sections/dropAtMs optional):
// {
//   seed, sampleRate, totalMs, bedEnterMs,
//   sections: [ {name:'coldopen'|'crucible'|'darkturn'|'hinge'|'funzone'|'fade', atMs} ],
//   dropAtMs,                    // THE collapse. Grid + bloom anchor here.
//   scratchAtMs, resumeAtMs,     // the Errand full stop (omit both to skip)
//   duckWindows: [ {atMs, durMs, level} ],   // diegetic-exhibit clearings
//   fadeStartMs, fadeEndMs       // the reverent pre-Gate fade to silence
// }
//
// Musical constants (LOCKED — the substance, not the timing):
//   Early key A minor · fun key C major (same pitch set: relative-mode pivot;
//   C penta major ≡ A penta minor, so even the chime grid needs no respelling).
//   Early pulse 52 BPM (half-time of the fun zone) · fun zone 104 BPM — the
//   Lattice's native tempo, so the ducked-in Lattice weaves seamlessly.
//   Fade ends on an open A+E pedal → the Gate's A-major logotune answers it.
// ============================================================================

import { MIDDLE_C_HZ, semiToFreq } from '../sound-garden/pitch-core.mjs';

// note-name → Hz helper (ported from the prototype's pitch shim, re-based on the
// estate's pitch-core `semiToFreq` so every bed pitch derives from the ONE
// equal-temperament anchor literal, which lives ONLY in sound-garden/pitch-core.mjs
// (the estate's anti-circularity covenant, MUSIC.md §9). MIDDLE_C_HZ is the anchor
// (semiToFreq(0) === MIDDLE_C_HZ); imported per the port checklist. Logic is
// byte-identical to the shim's n(), so the ported render is bit-identical.
const IDX = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,
              'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
function n(name){
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error('bad note name: ' + name);
  const semi = (parseInt(m[2],10) - 4) * 12 + IDX[m[1]];
  return semiToFreq(semi);
}

export const EARLY_BPM = 52;
export const FUN_BPM = 104;

export function compose(m){
  const totalS = m.totalMs / 1000;
  const events = [];
  let seq = 0;
  const push = (t, voice, params, opts = {}) => {
    if (t < 0 || t >= totalS) return;
    events.push({ t, voice, params, gain: opts.gain ?? 1, pan: opts.pan ?? 0,
                  layer: opts.layer ?? 'misc', seq: seq++ });
  };

  // ---- section map ----------------------------------------------------------
  const secs = [...m.sections].sort((a, b) => a.atMs - b.atMs);
  const S = {};
  for (let i = 0; i < secs.length; i++){
    S[secs[i].name] = {
      at: secs[i].atMs / 1000,
      end: (i + 1 < secs.length ? secs[i + 1].atMs : m.totalMs) / 1000,
    };
  }
  for (const req of ['crucible', 'darkturn', 'funzone'])
    if (!S[req]) throw new Error('manifest missing required section: ' + req);

  const dropAt = (m.dropAtMs ?? S.funzone.at * 1000) / 1000;
  const scratchAt = m.scratchAtMs != null ? m.scratchAtMs / 1000 : null;
  const resumeAt = m.resumeAtMs != null ? m.resumeAtMs / 1000 : null;
  const fadeStart = (m.fadeStartMs ?? (S.fade ? S.fade.at * 1000 : m.totalMs)) / 1000;
  const fadeEnd = (m.fadeEndMs ?? m.totalMs) / 1000;
  const funEnd = S.fade ? S.fade.at : S.funzone.end;   // grid hands over to fade gen
  const ducks = (m.duckWindows ?? []).map(w => ({ at: w.atMs / 1000, end: (w.atMs + w.durMs) / 1000 }));

  // onset gates: no new notes inside the scratch silence; melodic/chime layers
  // also clear out of duck windows so the diegetic exhibit owns the air.
  const inScratch = t => scratchAt != null && t >= scratchAt - 0.03 && t < resumeAt;
  const inDuck = t => ducks.some(w => t >= w.at - 0.15 && t < w.end + 0.1);

  // ============================ COLD OPEN ====================================
  // The Colophon's own voice owns the screen; the bed breathes in underneath
  // the pivot line ("No. That is the end...") — a lone low A, barely there.
  const bedEnter = (m.bedEnterMs ?? Math.max(0, S.crucible.at * 1000 - 2500)) / 1000;
  push(bedEnter, 'pad', { freqs: [n('A2')], dur: S.crucible.at - bedEnter + 1.5,
    attack: 2.2, release: 2.0, gain: 0.11 }, { layer: 'pad' });

  // ============================ CRUCIBLE =====================================
  // A minor, 52 BPM. The Boulder ostinato plods below; the Correction motif
  // (E4 D4 C4 → hangs on B3, "wrong; try again") repeats above, resolving to
  // A3 only on its fourth statement — corrected into existence.
  {
    const sec = S.crucible;
    const beat = 60 / EARLY_BPM, bar = 4 * beat;
    push(sec.at, 'pad', { freqs: [n('A2'), n('E3'), n('A3')], dur: sec.end - sec.at,
      attack: 3.0, release: 2.2, gain: 0.15 }, { layer: 'pad' });

    const nBars = Math.max(1, Math.floor((sec.end - sec.at) / bar));
    for (let b = 0; b < nBars; b++){
      const t0 = sec.at + b * bar;
      push(t0, 'ks', { freq: n('A2'), dur: 2.6, brightness: 0.22, vel: 0.85 },
        { gain: 0.55, pan: -0.15, layer: 'bass' });
      const third = (b % 4 === 3) ? n('G2') : n('E2');           // weary b7 every 4th bar
      push(t0 + 2 * beat, 'ks', { freq: third, dur: 2.4, brightness: 0.20, vel: 0.68 },
        { gain: 0.48, pan: -0.10, layer: 'bass' });
    }

    const CORRECTION = [                        // "Try again. Wrong. Warmer. Wrong."
      ['E4', 'D4', 'C4', 'B3'],                 // hangs on the 2nd — unresolved
      ['E4', 'D4', 'C4', 'B3'],                 // again — still wrong
      ['G4', 'E4', 'D4', 'C4'],                 // warmer — reaches, lands off-tonic
      ['E4', 'D4', 'C4', 'A3'],                 // finally: tonic. corrected into existence
    ];
    let vi = 0;
    for (let b = 1; b < nBars; b += 2){
      const t0 = sec.at + b * bar;
      const v = CORRECTION[vi++ % CORRECTION.length];
      v.forEach((note, k) => push(t0 + k * beat, 'celesta',
        { freq: n(note), dec: 1.9, vel: 0.40 }, { gain: 0.55, pan: 0.22, layer: 'motif' }));
    }
  }

  // ============================ DARK TURN ====================================
  // Same A minor, drier. A noir walking bass (Am7 arpeggio, with a flat-5 wink
  // every 4th bar), an escapement tick counting off-beats (petty clockwork),
  // and a deadpan mordent figure — mischief, never bitterness.
  {
    const sec = S.darkturn;
    const beat = 60 / EARLY_BPM, bar = 4 * beat;
    push(sec.at, 'pad', { freqs: [n('A2'), n('E3')], dur: sec.end - sec.at,
      attack: 2.0, release: 1.2, gain: 0.11 }, { layer: 'pad' });

    const nBars = Math.max(1, Math.floor((sec.end - sec.at) / bar));
    for (let b = 0; b < nBars; b++){
      const t0 = sec.at + b * bar;
      const walk = (b % 4 === 3) ? ['A2', 'C3', 'Eb3', 'E3']     // the flat-5 wink
                                 : ['A2', 'C3', 'E3', 'G3'];
      walk.forEach((note, k) => push(t0 + k * beat, 'ks',
        { freq: n(note), dur: 1.35, brightness: 0.45, vel: 0.72 },
        { gain: 0.5, pan: -0.12, layer: 'bass' }));
      for (let e = 0; e < 4; e++)                               // off-beat escapement
        push(t0 + e * beat + beat / 2, 'tick', { gain: 1 },
          { gain: 0.09, pan: 0.35, layer: 'perc' });
      if (b % 2 === 1){                                          // deadpan mordent
        const mt = t0 + 3 * beat + beat / 2;
        [['A4', 0], ['B4', 0.09], ['A4', 0.18], ['G4', 0.34]].forEach(([note, dt]) =>
          push(mt + dt, 'celesta', { freq: n(note), dec: 0.55, vel: 0.38 },
            { gain: 0.5, pan: 0.3, layer: 'motif' }));
      }
    }
  }

  // ============================ THE HINGE ====================================
  // The Chirp's own inspiral law rises out of the dark turn's last bar; an E5
  // celesta pulse accelerates with it (E = dominant of A minor AND third of the
  // coming C major — the pivot tone). 150 ms of TRUE VOID, then the collapse.
  {
    const hingeStart = S.hinge ? S.hinge.at : dropAt - 6.5;
    const voidDur = 0.15;
    const riserDur = Math.max(0.5, dropAt - voidDur - hingeStart);
    push(hingeStart, 'chirp', { dur: riserDur, f0: 55, fmax: 1600, gain: 0.55 },
      { layer: 'fx' });
    let t = hingeStart + 0.1, k = 0;
    while (t < dropAt - voidDur - 0.25){
      push(t, 'celesta', { freq: n('E5'), dec: 0.5, vel: 0.34 + Math.min(0.22, 0.015 * k) },
        { gain: 0.5, pan: 0, layer: 'motif' });
      t += Math.max(0.09, 0.55 * Math.pow(0.82, k));
      k++;
    }
  }

  // ============================ THE DROP =====================================
  // The star collapses. Sub hit + a C-major glass bloom (the Staircase motif's
  // first full statement, cascading) + low C/G strings — the pivot to major.
  push(dropAt, 'subdrop', { f0: 100, f1: 32, dur: 1.15, gain: 0.95 }, { layer: 'fx' });
  push(dropAt, 'ks', { freq: n('C2'), dur: 3.0, brightness: 0.5, vel: 1.0 },
    { gain: 0.6, layer: 'bass' });
  push(dropAt, 'ks', { freq: n('G2'), dur: 3.0, brightness: 0.5, vel: 0.9 },
    { gain: 0.5, layer: 'bass' });
  ['C5', 'E5', 'G5', 'C6'].forEach((note, k) =>
    push(dropAt + 0.07 * k, 'celesta', { freq: n(note), dec: 2.2, vel: 0.88 - 0.05 * k },
      { gain: 0.62, pan: (k % 2 ? 0.35 : -0.35), layer: 'motif' }));

  // ============================ FUN ZONE =====================================
  // C major @ 104 BPM (the Lattice's grid). Chords C–G–Am–F, one per bar.
  // Layers: KS bass · Lattice-style seeded chime grid (C penta major) ·
  // Staircase melody at phrase heads · rising inverted-Correction counterline ·
  // soft kick/hat. The grid is seeded by ABSOLUTE bar index from the drop, so
  // scratch/duck edits never re-roll the music around them.
  const beatF = 60 / FUN_BPM, eighth = beatF / 2, barF = 4 * beatF;
  const CHORDS = [
    { root: 'C2', fifth: 'G2', pad: ['C3', 'E3', 'G3'] },
    { root: 'G2', fifth: 'D3', pad: ['B2', 'D3', 'G3'] },
    { root: 'A2', fifth: 'E3', pad: ['A2', 'C3', 'E3'] },
    { root: 'F2', fifth: 'C3', pad: ['A2', 'C3', 'F3'] },
  ];
  const PENTA = ['C', 'D', 'E', 'G', 'A'];      // ≡ A minor pentatonic — the pivot set
  const STAIRCASE = [                            // kin of the Gate's Glass Staircase
    ['C4', 'E4', 'G4', 'C5'],
    ['E4', 'G4', 'C5', 'E5'],
    ['C4', 'E4', 'G4', 'C5'],
    ['G4', 'C5', 'E5', 'G5'],
  ];
  const RISING = ['C4', 'D4', 'E4', 'G4'];       // the Correction motif, inverted: play

  // deterministic per-slot hash (independent of scratch/duck placement)
  const slotRnd = (a, b) => {
    let h = ((m.seed ?? 2718) | 0) ^ 0x9E3779B9;
    h = Math.imul(h ^ a, 0x85EBCA6B); h ^= h >>> 13;
    h = Math.imul(h ^ b, 0xC2B2AE35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  const gridGen = (from, to, densityAt) => {
    const k0 = Math.max(0, Math.ceil((from - dropAt) / eighth - 1e-6));
    for (let k = k0; ; k++){
      const t = dropAt + k * eighth;
      if (t >= to) break;
      if (inScratch(t) || inDuck(t)) continue;
      const d = densityAt(t);
      if (slotRnd(k, 1) >= d) continue;
      const deg = PENTA[Math.floor(slotRnd(k, 2) * PENTA.length)];
      const octR = slotRnd(k, 3);
      const oct = octR < 0.3 ? 4 : octR < 0.82 ? 5 : 6;
      push(t, 'celesta', { freq: n(deg + oct), dec: 0.95, vel: 0.24 + 0.34 * slotRnd(k, 4) },
        { gain: 0.5, pan: (slotRnd(k, 5) * 2 - 1) * 0.7, layer: 'chime' });
    }
  };

  {
    const nBars = Math.max(1, Math.ceil((funEnd - dropAt) / barF));
    for (let b = 0; b < nBars; b++){
      const t0 = dropAt + b * barF;
      if (t0 >= funEnd) break;
      const ch = CHORDS[b % 4];

      if (!inScratch(t0))                                        // pad, clipped at scratch
        push(t0, 'pad', { freqs: ch.pad.map(n),
          dur: Math.min(barF + 0.2, (scratchAt != null && t0 < scratchAt && t0 + barF > scratchAt)
            ? scratchAt - t0 : barF + 0.2),
          attack: 0.35, release: 0.6, gain: 0.10 }, { layer: 'pad' });

      for (const [bt, note, v] of [[0, ch.root, 0.85], [2, ch.fifth, 0.7]]){
        const t = t0 + bt * beatF;
        if (inScratch(t)) continue;
        push(t, 'ks', { freq: n(note), dur: 1.9, brightness: 0.5, vel: v },
          { gain: 0.5, pan: -0.1, layer: 'bass' });
      }

      for (const bt of [0, 2]){                                  // kick 1 & 3
        const t = t0 + bt * beatF;
        if (!inScratch(t)) push(t, 'kick', { gain: 1 }, { gain: 0.4, layer: 'perc' });
      }
      for (let e = 0; e < 8; e += 2){                            // hats on off-8ths
        const t = t0 + (e + 1) * eighth;
        if (!inScratch(t)) push(t, 'hat', { gain: 1 }, { gain: 0.8, pan: 0.25, layer: 'perc' });
      }

      const phraseBar = b % 4;
      if (phraseBar === 0 && !inScratch(t0) && !inDuck(t0)){     // Staircase at phrase head
        const v = STAIRCASE[Math.floor(b / 4) % STAIRCASE.length];
        v.forEach((note, q) => {
          const t = t0 + q * beatF;
          if (!inScratch(t) && !inDuck(t))
            push(t, 'celesta', { freq: n(note), dec: 1.5, vel: 0.7 },
              { gain: 0.6, pan: 0.15, layer: 'motif' });
        });
      }
      if (phraseBar === 2){                                      // rising counterline
        RISING.forEach((note, q) => {
          const t = t0 + q * eighth + beatF;
          if (!inScratch(t) && !inDuck(t))
            push(t, 'ks', { freq: n(note), dur: 0.9, brightness: 0.6, vel: 0.5 },
              { gain: 0.45, pan: 0.3, layer: 'motif' });
        });
      }
    }
    gridGen(dropAt, funEnd, () => 0.42);
  }

  // ---- the resume pickup (after the Errand's silence): a small cheeky
  // re-drop — thump + glass C-major chord — then the grid is already running.
  if (scratchAt != null && resumeAt != null && resumeAt < totalS){
    push(resumeAt, 'subdrop', { f0: 80, f1: 40, dur: 0.5, gain: 0.55 }, { layer: 'fx' });
    push(resumeAt, 'ks', { freq: n('C2'), dur: 2.0, brightness: 0.5, vel: 0.9 },
      { gain: 0.55, layer: 'bass' });
    ['C5', 'E5', 'G5'].forEach((note, k) =>
      push(resumeAt + 0.03 * k, 'celesta', { freq: n(note), dec: 1.6, vel: 0.75 },
        { gain: 0.55, pan: (k - 1) * 0.3, layer: 'motif' }));
  }

  // ============================ THE FADE =====================================
  // Reverence. Percussion and bass are gone; the grid thins to nothing; the
  // harmony walks home C → Am → open A+E pedal; the celesta quotes the
  // Staircase IN A MINOR (A4 C5 E5 A5) — the same contour the Gate's logotune
  // answers in A MAJOR. The estate gets the last word.
  if (S.fade){
    const sec = S.fade;
    const fdur = Math.max(2, fadeEnd - sec.at);
    push(sec.at, 'pad', { freqs: [n('A2'), n('C3'), n('E3')], dur: fdur * 0.45,
      attack: 1.6, release: 1.6, gain: 0.13 }, { layer: 'pad' });
    push(sec.at + fdur * 0.42, 'pad', { freqs: [n('A2'), n('E3'), n('A3')],
      dur: Math.max(1, fadeEnd - (sec.at + fdur * 0.42)) + 2,
      attack: 2.2, release: 2.5, gain: 0.14 }, { layer: 'pad' });

    gridGen(sec.at, Math.min(fadeEnd, sec.end),
      t => Math.max(0, 0.42 * (1 - 1.45 * (t - sec.at) / fdur)));

    const QUOTE = [                          // the minor Staircase — the pre-echo
      ['A4', 0.15, 2.0, 0.5], ['C5', 0.33, 2.0, 0.5],
      ['E5', 0.52, 2.6, 0.55], ['A5', 0.71, 3.6, 0.6],
    ];
    for (const [note, frac, dec, vel] of QUOTE)
      push(sec.at + fdur * frac, 'celesta', { freq: n(note), dec, vel },
        { gain: 0.6, pan: 0.1, layer: 'motif' });
  }

  return {
    events,
    meta: {
      dropAt, scratchAt, resumeAt, fadeStart, fadeEnd,
      bedEnter, ducks, totalS,
      counts: events.reduce((a, e) => (a[e.layer] = (a[e.layer] || 0) + 1, a), {}),
    },
  };
}
