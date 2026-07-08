# trailer-bed — timing-parametric composition module (WS5 spec-phase prototype)

The Book-3 trailer's music bed. **All musical judgment lives in `compose.mjs`**
(the locked substance — see `../MUSIC.md`); `render.mjs` only mixes. Re-rendering
at final cue times requires zero musical decisions.

## Render

```sh
node render.mjs manifest.draft.json out.wav
```

Pure Node, zero dependencies, ~2 s for a 2:50 stereo 44.1 kHz bed.
Deterministic: same manifest → **bit-identical** WAV (verified by SHA-256).
No `Math.random` / `Date.now` anywhere in the composition path — all randomness
is seeded mulberry32 from `manifest.seed`.

## The timing manifest (ms)

```jsonc
{
  "seed": 2718, "sampleRate": 44100, "totalMs": 179000,
  "bedEnterMs": 12000,               // bed breathes in under the pivot VO (optional;
                                     //   default = crucible.atMs − 2500)
  "sections": [                      // required: crucible, darkturn, funzone
    {"name":"coldopen","atMs":0},    // optional: coldopen, hinge, fade
    {"name":"crucible","atMs":15000},
    {"name":"darkturn","atMs":52000},
    {"name":"hinge","atMs":104500},  // riser start (default: dropAtMs − 6500)
    {"name":"funzone","atMs":111000},
    {"name":"fade","atMs":153000}
  ],
  "dropAtMs": 111000,                // THE neutron-star collapse — align to the frame
  "scratchAtMs": 144000,             // the Errand record scratch (omit both to skip)
  "resumeAtMs": 148200,              // = scratchAtMs + 4200 (see MUSIC.md §11)
  "duckWindows": [{"atMs":129000,"durMs":4000,"level":0.09}], // Lattice in the clear
  "fadeStartMs": 153000, "fadeEndMs": 165000                  // pre-Gate reverence
}
```

`render.mjs` validates the manifest before composing (scratch/resume both-or-neither,
fade ordering, drop ≥ funzone start, ducks inside `[drop, fadeStart]`) and WARNS when
`totalMs − fadeEndMs < 14000` — the Gate finale cannot finish inside the film below that
(MUSIC.md §11 carries the full inequality set).

Any reasonable values work: section generators loop their material per-bar to
whatever duration they're given; the fun-zone grid is seeded by absolute bar
index from `dropAtMs`, so moving the scratch/duck never re-rolls the music
around them.

## Files

- `compose.mjs` — manifest → deterministic event score (THE music)
- `palette.mjs` — estate voices as pure sample loops (KS pluck ← Loom's
  `ksRender` · celesta ← the Gate logotune recipe · pad ← Loom `padVoice` /
  Long Way Home · chirp riser ← The Chirp's inspiral law · perc kit)
- `render.mjs` — mix + duck/fade automation + record-scratch + normalize + WAV
- `dsp.mjs`, `prng.mjs`, `wav.mjs` — RBJ biquad/pan/mix, mulberry32, WAV writer
- Pitch law: `compose.mjs` imports `{ MIDDLE_C_HZ, semiToFreq }` from
  `../sound-garden/pitch-core.mjs` (the estate's single pitch anchor — the
  equal-temperament anchor literal lives ONLY there) and keeps its own `n('A2')` note-name
  helper re-based on that `semiToFreq`. The prototype's local pitch shim is
  deleted in this port (anti-circularity covenant).

## Ported state (Book-3 worktree, T3.1)

This is the ported module. Provenance/behaviour of the composition is unchanged
from the spec-phase prototype — the port only re-sources the pitch law and keeps
the stereo WAV writer:

1. Pitch: shim deleted; pitch law imported from `../sound-garden/pitch-core.mjs`
   as above. No musical constant in `compose.mjs` was touched (locked design).
2. WAV I/O — **repo-wins deviation:** the port keeps the local stereo `wav.mjs`
   writer. The estate's shared `tools/audio-lens/src/wav.js` only *encodes* MONO
   (`encodeWav16` hardcodes one channel), and the bed is stereo by design
   (alternating pans throughout — MUSIC.md §6/§8), so it cannot supply the write
   path. `wav.mjs` emits standard 16-bit stereo PCM that audio-lens's `decodeWav`
   reads for verification, which is the covenant's actual purpose.
3. Re-render / cue-lock (T4.2): edit ONLY the manifest, re-render with
   `node render.mjs <manifest.json> <out.wav>`, verify with
   `tools/audio-lens/bin/audio-lens.js analyze out.wav --human`
   (expect: no clipping, peak ≈ −1.2 dBFS, silence at the scratch window +
   after `fadeEndMs`), encode mp3 at **128k** (`ffmpeg -b:a 128k` — 192k breaks
   forge `--strict`'s 4 MiB-encoded limit) and confirm base64 size < 4 MiB
   before `forge:asset`.
4. Do not edit `compose.mjs` musical constants — they are the locked design.
