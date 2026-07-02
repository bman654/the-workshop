# The Cartographer's Dream — CHANGELOG

## Cycle 395 — born (BUILD/garden)

A delight-first NIGHT-parchment room where a whole antique chart PRE-EXISTS, deterministic from a
seed, but hides invisible under a cool un-inked-vellum fog. A warm lantern follows the cursor/touch;
where its light DWELLS the fog erodes and the sepia chart shows through. **Dwell is discovery.** This
is a map DISCOVERER — the categorical departure from `cartographer/` next door, which DEALS a finished
atlas from a button. No math claim, no negative control, no accuracy HUD: the delight is the deliverable.

- **`core.mjs`** — the HIDDEN LAND, generated ONCE per seed and never re-derived (the lantern changes
  only VISIBILITY, never geometry). Ports the proven `cartographer/` pipeline: `xmur3`+`mulberry32`
  seeded PRNG → value-noise fBm heightmap with island-mask radial falloff + continent-blob bias →
  percentile sea-level → border flood-fill (ocean vs lake) → coastline BFS → moisture/biome →
  NW hillshade → steepest-descent river flow-accumulation → greedy peak/label placement. This buys
  same-seed→same-land, downhill-non-crossing rivers, and no-flood by construction.
  - **NEW toponymy** (`makeToponymy`) in the estate's verse/theogony idiom: each world seeds its OWN
    restricted onset/nucleus/coda syllable FAMILY + syllable-count distribution, so one land's names
    share a phonetic resemblance ("Straith", "Strenmau", "Shaubraith") and another's feel wholly
    different. Composed from hand-authored templates keyed to real feature kind (seas: `-mere`/`Reach`;
    holds: possessive `-'s Hollow`/`Cross`/`Landing`; ranges: `the Xteeth`/`Xspine`). Pronounceable by
    construction (only legal syllable pieces; a vowel-ended `vroot()` guards direct-glue joins so a
    consonant-cluster coda can never pile against a consonant-initial suffix), collision-checked before
    accepting. Returns an ORDERED placement list — the thing the twin byte-compares.
- **`core.test.mjs`** — the DETERMINISM + WELL-FORMEDNESS twin (stands in for a proof; NOT a math crux,
  NO HUD). **ALL GREEN, 587 assertions over a 10-seed battery:** (a) DETERMINISM — regenerate each seed
  twice, `placementSignature` + the raw height/water fields byte-identical, distinct seeds distinct;
  (b) RIVERS — every polyline monotone non-increasing on the height field (no uphill step) and net-
  descending to a sea terminus; (c) NO FLOOD — `0.15 < landFraction < 0.85`; (d) NAMES — pronounceable
  (a vowel + no 5+ consonant pileup), unique per sheet, no two labels on one cell, family palette a
  proper subset. Plus toponymy-family determinism.
- **`land-render.mjs`** — renders the hidden land ONCE onto an offscreen canvas as a warm sepia antique
  chart (hillshaded biome raster → paper backdrop → coast-hatch → grain → inked coastlines → tapering
  rivers → hand-drawn back-to-front mountain glyphs → settlement dots). Returns the resolved
  label/settlement LAYOUT (greedy overlap-avoidance) so the page can trace each name in against the
  SAME placed geometry. `nib ∈ {fine, bold}` changes only the DRAWING HAND (line weights), never the land.
- **`index.src.html` → `index.html`** — the page. Three layers composited each frame: (1) the pre-baked
  DRAWN LAND revealed through a monotonic per-cell EXPOSURE field (~24px cells; center fills ~0.6s,
  rim slow; measured 12%→22% lit under a 0.6→1.6s dwell); (2) the FOG — warm parchment under a cooler
  in-code value-noise haze + tooth grain, with drifting ghost sea-serpents + a "here be —" flourish in
  still-unmapped WATER that DISSOLVE as you light them; (3) the LANTERN POOL — a warm radial glow with
  a candle flicker, used as the reveal MASK. The two grafted delight beats: **(A)** a wet-nib bloom at
  the frontier (cells crossing ~0.15 exposure go "wet" for ~600ms — a darker sepia bleed-halo that
  dries); **(B)** names LETTER THEMSELVES IN — each label arc-length-traces along its placed path once
  its anchor cell is lit, wet-tip highlighted at the pen. Set-pieces: a COMPASS ROSE that wanders while
  you sweep and swings to true north + settles (a brass `ting`) the moment you pause; an empty CARTOUCHE
  that fills as coast is lit and letters the world's grand title once ~36% of reachable land is charted
  ("% surveyed" is felt, never numbered). Controls (spare, in-diegesis): the lantern IS the cursor/
  finger, with a gentle AUTO-DRIFT on-ramp so a first visitor SEES the reveal happen; a wax-seal
  RE-SEAL that re-rolls a new seed into the URL hash (shareable; same seed → same land) and re-fogs; a
  fine-survey/bold-portolan NIB dial. All art forged in-house in-code (no forage).
- **SFX** — in-house `Gate.sfx` synth, muteable via the shared `ws:pref:muted`, unlocked on first
  gesture: `nib` (activity-scaled dry paper-scratch grain, louder while lighting new cells, silent at
  rest), `fwump` (a paper-settle on a new sheet), `ting` (a warm brass chime on compass-lock / first
  title). Audio-lens verified: self-test 12/12; all three clean (no clipping; nib centroid 3.4k dry-
  scratch band; ting reads G4/G5 warm brass; fwump low body + air).
- **Reduced-motion** — a calm fallback: no flicker/serpent-motion/wet-bloom, faster near-instant fill,
  auto-sweep still available. (`?reduced=1` is a test override for verifying it headless.)

Self-verified in-browser: self-test PASS, 61fps under active reveal, clean console, the map materializes
believably, names letter themselves in, the cartouche earns "The Sundered Reach", both hands render, the
seal re-rolls a fresh sheet, reduced-motion calm. Front-door map POI wired (manor · studies wing, kin to
Cartographer) + `ws:seen:the-cartographers-dream`.
