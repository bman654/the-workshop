# Scriptorium — build log

## Build (initial)

Built `scriptorium/index.html` — a generative invented-writing-system press, the Oracle's
companion. Single self-contained file, zero dependencies, relative links only (serves from
the `/the-workshop/` subpath). Back-links copied from the companion convention
(`← workshop` → `../index.html`, `↗ The Oracle — the verse engine` → `../verse/index.html`).
Palette kept in the Oracle's family (gold `#cba15a`, warm ink, serif display).

### Engine
- **Seeded RNG**: FNV-1a string hash → mulberry32 (matches the workshop's other pieces).
- **Phonology**: 12–18 consonants (seeded backbone `m n t k s l`) + 4–6 vowels (cardinal
  `a i u` always present), syllable rule (C)V(C) with seeded onset/coda permission.
- **The hand**: script type (alphabet/abugida/syllabary/abjad), shared metrics
  (baseline, x-height, ascender/descender, slant, weight, contrast, nib angle, grid),
  5–8 chosen stroke primitives, join style.
- **Glyph synthesis**: letterform-**skeleton** library (arch, doubleArch, bowlStem, cup,
  loop, crossedStem, vee, cross, zig, hookedStem, eared). Each skeleton realizes its roles
  with primitives the hand owns; skeletons spread across the inventory via a seeded
  permutation. `phoneme→glyph` bijection built once; duplicates deterministically nudged.
- **Render**: canvas, broad-nib weight modulation, round caps/joins, cubic/quadratic
  curves, baseline/x-height/ascender guide lines, even letter+word spacing, rubric name.
- **Self-test**: 4 checks — (A) bijection (B) one-hand+em-box+no-NaN (C) 120-string
  round-trip (D) seed purity / style invariance — surfaced in a PASS/FAIL badge.

### Styles
Manuscript (warm parchment), Lapidary (cool stone), Codex (blue-black & gold). Style is
colour-only; geometry is style-independent by construction (asserted by self-test D).

### Controls
Seed display + type-a-seed + re-roll; style picker; write-your-own (romanized → the hand);
cosmetic slant + weight sliders (do not touch geometry); show/hide key + guide lines;
Export PNG (2× retina).

## Tuning notes / dead-ends
- **v1 glyphs were scribbles.** First synthesis assembled a "spine + random features" pile;
  output collapsed to tally-marks (`stem+stem`), lone dots, and many near-identical glyphs.
  Diagnosed by dumping the per-glyph stroke lists in the browser.
- **Fix → letterform skeletons.** Rewrote synthesis around a library of real letter
  skeletons (arches, bowls-on-stems, crossed stems, vees, cups, loops). This is what made
  the output read as a script: structural *variety* between letters, *family resemblance*
  within the hand.
- **Fix → seeded primitive guarantees.** Every hand is now forced to own at least one
  vertical + one curve + one horizontal, so arch/bowl skeletons never degrade to combs of
  bare stems.
- **Fix → skeleton spread.** Selecting skeletons by per-glyph RNG clustered duplicates
  (five rings). Replaced with a seeded permutation walked in order, so the whole repertoire
  is used before repeating.
- **Fix → graceful diagonal-free fallbacks.** vee/cross/zig assumed `diagonal`; without it
  they produced parallel stems. They now fall back to arc/bowl lobes instead.
- **Bowl/arc curvature** was capped too tightly (≤30u, ×0.8) so bowls looked like stems;
  raised the cap (≤46u) and simplified the bowl to one smooth cubic + a straight back so it
  reads as a closed counter.
- **clampStroke** originally clamped X only; extended to clamp Y into the ascender/descender
  band so the em-box self-test (B) can never trip on a skeleton overshoot.

## Verification (real browser — agent-browser, session `scriptorium-build` / `scriptorium-dl`)
Served the repo root with `python3 -m http.server 8765`; opened `/scriptorium/`.
- Page loads; **0 console errors** (also stress-tested: 20 re-rolls + all 3 style switches,
  `window.onerror`/`unhandledrejection` captured nothing).
- **Self-test PASSES — 4 checks** — confirmed across 12 hand-picked seeds and verified all
  four script types are reachable (sampled 400 seeds: alphabet 87, abugida 95, syllabary
  111, abjad 107).
- Screenshotted multiple seeds × styles (Manuscript abjad, Codex abjad, Lapidary alphabet,
  Manuscript abugida). Honest judgement: the typical output reads as a **coherent,
  plausible writing system** — strong family resemblance, balanced glyph density, clean
  even spacing, real letter variety; abugida/abjad vowel diacritics attach correctly.
- **Write-your-own** renders and round-trips (`readBack(render(t)) === normalize(t)`).
- **Style switch** keeps identical geometry (fingerprint unchanged; recolour only).
- **Typed seed** reproduces the same script.
- **Slant/weight sliders** are cosmetic — geometry fingerprint unchanged, round-trip still
  holds.
- **PNG export** downloads a non-empty file (`the_Brae_wold_hand_orrery.png`, 3.84 MB,
  3208×1988 RGBA).
