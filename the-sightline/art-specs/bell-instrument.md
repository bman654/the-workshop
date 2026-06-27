# Foundry spec — `bell-instrument` (sound)

**Asset:** the in-house bell voice for The Sightline — the rising pentatonic chime that
kindles with each star and the resolved chord that closes the figure.
**Medium:** sound (WebAudio builder, JS). No samples — synthesised live.
**Live module / call site:** `the-sightline/index.src.html`, the function `bell(freq, when, dur, gain, inharm)`
inside the `Audio` IIFE, between `// <<SIGHTLINE-ART:bell>>` … `// <<END SIGHTLINE-ART:bell>>`.
The winner REPLACES that function body; re-run forge. The page's `chime(rank)`, `chord()`,
and `clatter()` CALL `bell(...)` — do not rename it; just forge a richer voice.

## Art direction (carillon / monochord lineage — a struck bronze bell)
A warm, clean **struck-bell / carillon** tone with a clear pitch and a singing, slightly
inharmonic shimmer that decays gracefully — celestial, not metallic-harsh. It rings ONE note
per call. The page schedules a **rising major-pentatonic phrase** (one `bell` per star, 12
stars over ~2.4 octaves) resolving on a high tonic, and a **major chord** (`bell` ×4 stacked)
at completion. Wanted over the current 5-sine partial stack:
- a convincing bell strike: fast attack, a brief inharmonic "strike" transient, then a long
  exponential hum with 4–6 stretched partials (true bells are slightly inharmonic — a gentle
  stretch like `mul*(1+inharm*(mul-1))` is already wired via the `inharm` arg);
- a touch of beating / chorus between partials for life; a soft low "hum" partial under the
  strike tone; tasteful highpass/lowpass so it sits in a dim quiet vault (not piercing);
- gentle, non-clipping output — peaks well under 0 dBFS; the chord (4 simultaneous voices)
  must not distort. Honor the muted-by-default gate (the function already early-returns).

## EXACT API the candidate code must expose (the `Gate.sfx`-style builder contract)
```js
function bell(freq, when, dur, gain, inharm){ … }
```
- Runs inside the `Audio` IIFE; in-scope it has the live **`ctx`** (an AudioContext),
  **`master`** (a GainNode already connected toward `ctx.destination`), and **`muted()`**.
- Contract: schedule ONE struck-bell voice on `ctx`, fundamental **`freq`** Hz, starting at
  AudioContext time **`when`**, total length **`dur`** s, peak amplitude **`gain`** (~0.3–0.5),
  optional partial-stretch **`inharm`** (~0.0005). Connect the voice's envelope to `master`.
- MUST early-return `if(!ctx||muted()) return;`. MUST stop all oscillators by `when+dur`.
- MUST NOT touch the DOM, create a new AudioContext, or block; pure WebAudio scheduling.

## How it is forged + wired
- No preview harness needed — the foundry renders `bell` on its universal WAV bench. Render
  a representative phrase (e.g. the rising pentatonic run + the closing chord) ~`durSec` long.
- Wiring: paste the winner between the bell sentinels in `index.src.html`, re-forge. The
  phrase scheduling in `chime/chord/clatter` already calls `bell` and stays as-is.

## Judge focus (one line)
A warm struck-bell/carillon voice with clear pitch + graceful inharmonic decay, the rising
pentatonic phrase resolving sweetly to a clean non-clipping tonic chord.
