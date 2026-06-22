# Grain Mill — the Sound Garden's granular instrument (SPEC)

*A held, consonant cello tone (E3, synthesised live — no audio files) is tipped into a brass hopper and
ground into a drifting cloud of luminous **sound-grains**. Two sliders — GRAIN SIZE and DENSITY — melt one
note into rain → a drone → mist.* These are grains of **sound**, not the number-grains of the Benford Mill
and not the brass siren disc of the Tone Mill — granular synthesis, the synthesis family the rack lacked.

Self-contained `sound-garden/grain-mill.html`, vanilla JS + Canvas + Web Audio, **zero deps, no
network/CDN/web-fonts**, relative paths, `"use strict"`. Works over `file://`. Matches the rack aesthetic;
back-link `← sound garden` as the first child. Accent **#7fd4b0** (glassy mint-aqua) — a new family on the
grid, distinct from the crowded brass cluster and from Lattice's #5fe6c4.

## The family the rack lacked
The rack already has pluck (Loom/Monochord), FM-ish sidebands, additive overtones, formant (Vowel Throat),
Shepard (Endless Staircase), beating (Tartini/Beating Bench) — but never **grains**. Granular synthesis is
the missing voice: a sound built not from oscillators but from hundreds of tiny windowed slices of a source,
each replayed at a chosen size/pitch/onset. Its signature is a glassy, breathing wash — hence the aqua accent.

## The instrument
- **The source (no files):** `buildSourceBuffer(ac, f0=164.81 /*E3*/)` renders a 2.0 s seeded cello-ish
  buffer in its OWN tiny `OfflineAudioContext` — three detuned voices (−7/0/+6 cents; saw/saw/sine) →
  gentle lowpass(1800) → slow ±0.4 % vibrato. Warm, sustained, loopable via random read offsets.
- **The grain engine (`createGrainEngine`):** ONE factory used IDENTICALLY live (AudioContext) and offline
  (OfflineAudioContext) — single code path, no second scheduler. Each grain = one `AudioBufferSourceNode`
  reading a random slice + one gain carrying a **TRUE Hann envelope** via `setValueCurveAtTime(HANN64, …)`
  (shared 64-pt half-cosine table; zero-start/zero-end ⇒ no clicks). `playbackRate = 2^(semis/12)`.
- **The two params → the journey:** `setSize(ms)` log-maps 8↔120 ms (long = recognisable pitch · ~25 ms
  knee = pitch→breath · short = pure texture); `setDensity(perSec, scatter)` runs sparse pointillist plinks
  → a glassy continuous wash. Four named destinations: **Cello** (120 ms/80) · **Breath** (18 ms/140) ·
  **Rain** (40 ms/12) · **Wash** (70 ms/220).
- **The touchable form — the hopper gesture (NOT a Play button):** a brushed-brass funnel + a floating
  tone-pearl that hums the raw source drone the instant the page is first touched (you hear the "before").
  GRAB the pearl → TIP it over the funnel mouth (the lip tilts to meet it, a light stream pours) → RELEASE
  over the mouth = the pearl drops in, the drone crossfades into `engine.start()`, grains spray up. Release
  AWAY = it springs back, nothing starts (forgiving cancel). Tapping the running funnel lifts the pearl out =
  graceful stop. This first gesture also satisfies the WebAudio autoplay unlock — no separate "click to enable".

## The canonical per-grain viz contract (the #1 coupling — sound IS the picture)
The engine's `_onGrain(g)` callback is the **single source of truth**. The viz spawns a mote INSIDE that
callback — it does NOT run its own grain timer, so the cloud can never drift from the audio. One event shape,
`g = { whenSec, durMs, semis, peak, jitterCents }`, used by both facets. The mote renderer reads: time→x
(enter at a breathing "now" column, drift left as it ages); semis→y (−24..+24 → bottom..top, pitch-pure
collects into a band, scattered sprays vertically); durMs→radius (long = fat soft blob, short = sharp speck);
the grain's Hann envelope over its life → brightness/alpha (each mote BREATHES exactly as the audio grain
does). The cloud BECOMES the sound (form expresses content), not a plot of it. The verification asserts
`grainsSpawned === grainsSeen === motes`.

## Guardrails — the density-explosion clip-guard is the WHOLE verification point
- **Equal-power overlap compensation:** `overlap = (sizeMs/1000)*density`; `overlapComp = 1/sqrt(max(1,
  overlap))`; per-grain peak = `GRAIN_PEAK * overlapComp`. So no matter how dense, the summed wash never clips.
- **HARD voice cap** `GRAIN_CAP = 64` grains concurrent **at the spawn time** — counted by reaping a list of
  grain end-times, NOT a callback-decremented counter (that would saturate offline, where `src.onended` never
  fires during the synchronous unroll, and silence every grain past the 64th). Over-cap spawns are dropped
  (`capDrops`), so density can never detonate.
- **Master chain mirrors the Carillon VERBATIM:** bus → highcut(lowpass 9000,Q.4) → softclip(tanh*1.05, '2x')
  → limiter(thr −6, knee 0, ratio 20, atk .003, rel .25) → masterGain(0.7) → destination.
- **Mote pool hard-capped (~320, oldest recycled)** — the visual partner of the voice cap. DPR=min(dpr,2);
  honors `prefers-reduced-motion`.
- Determinism: a seeded mulberry32 (`eng.rnd`) drives every read offset / jitter / onset scatter.

## Lens-native (so the sound is verifiable by sight)
`window.__renderOffline(seconds, seed, preset='wash')` builds the source buffer + `createGrainEngine` under
an `OfflineAudioContext` and unrolls the SAME `spawnGrain`/`nextGap` loop over the full span (no `setInterval`
offline), then `ac.startRendering().then(encodeWav)` — reusing the Carillon's exact 16-bit PCM `encodeWav`.
The standard call is `__renderOffline(8, 42)`. `preset:'live'` renders the current slider positions.

## CRITICAL — SILENT during all testing (a person may be working / asleep)
Audible sound only on the explicit user tip-gesture (autoplay rules) — the builder must verify the picture
via the rAF renderer + the per-grain contract (no audio), and verify the SOUND only via the **offline
render** (`OfflineAudioContext` = silent) → the Audio Lens. Keep the shared `ws:pref:muted` set while testing.

## Verification (self-verify; UNIQUE agent-browser session — never the default tab)
1. **Visual / gesture:** open over the served rack; confirm the idle hopper + pearl + the granular teaser;
   drive the tip-gesture (synthetic pointer events) → `milling` true, `grainsSpawned === grainsSeen === motes`
   (the contract); release-away → nothing starts (forgiving cancel); ~60 fps; zero console errors.
2. **Sonic (via the Lens, silent) at BOTH slider EXTREMES:** render sparse-**Rain** AND dense-**Wash** (and
   the live density-0 / density-1 ends), run each WAV through `tools/audio-lens` (`node bin/audio-lens.js`).
   **Target band: peak −7…−18 dBFS, ~0 % clipped at BOTH extremes; the sparse end stays AUDIBLE (a plink,
   not silence).** RECORD the actual numbers (peak dBFS, clipPct, rms, silenceRatio) for both extremes in the
   CHANGELOG — the lens must CONFIRM a sane band, never assume it.

## Deliverables + rack integration (edit ONLY inside `sound-garden/`)
1. `sound-garden/grain-mill.html`.
2. `sound-garden/assets/grain-mill.png` — ~1280-wide thumbnail: the brass hopper mid-tip with the aqua
   grain-cloud at a mid-SIZE/mid-DENSITY moment (structure dissolving into shimmer).
3. Manifest entry appended to `sound-garden/instruments.js` (add the trailing comma to Monochord; Grain Mill
   becomes the new last entry, no trailing comma): `file:"grain-mill.html"`, `name:"Grain Mill"`,
   `accent:"#7fd4b0"`, blurb anchored to AUDIBLE matter (held cello tone, sound-grains, rain/drone/mist).
4. RECIPROCAL cross-links: the page links its sustained-tone source siblings **Drift** and **Monochord** +
   `← The Orrery Estate`; `monochord.html`'s footer kin list reciprocates with `↔ The Grain Mill`. Every new
   href must resolve 200.
5. `sound-garden/README.md` — a Grain Mill row (the granular family) + the lens-native list + the ensemble
   sentence. `sound-garden/CHANGELOG.md` — a dated newest-first entry with the lens numbers at both extremes.

## Name-guard (load-bearing — verified real)
`benford-mill/index.html` literally grinds **number-grains** ("every grain is multiplied, then sorted by its
leading digit"); `tone-mill` is a brass **siren disc**. The blurb, page teaser, README row, and every
cross-link copy ALL anchor to audible matter (held cello tone, sound-grains, rain/drone/mist) and carry a
"grains of SOUND, not of number" tail. NEVER say number / digit / multiply / crank / disc.

## House rules
- One self-contained HTML file (+ thumb + manifest/README/CHANGELOG/SPEC edits, all under `sound-garden/`).
  No network/CDN/web-fonts. No math claim is made, so no proof is owed — judged FUN / BEAUTIFUL / FITS.
- Do NOT edit the front-door `index.html`, top-level README/NOTES, or other projects. Do NOT git commit
  (the publisher reviews + commits).
