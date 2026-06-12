# Scriptorium — a generative invented-writing-system press

> *The Oracle speaks in verse; the Scriptorium gives its words a hand to be written in.*

Scriptorium is **The Oracle's companion**. Where the Oracle (`../verse/`) generates
*poems*, the Scriptorium generates the *script they could be written in*: from a single
seed it invents a complete, internally-consistent **writing system** — a phoneme
inventory, a syllable rule, and a coherent "hand" of glyphs — then renders a short
coined phrase written in that hand, with a romanization key.

It is a single self-contained `index.html`: no dependencies, no build step, no network.
It lives in the Oracle's gold-on-warm-ink family (accent `#cba15a`).

The whole challenge is that the output must read as a **plausible script**, not random
scribbles. That is enforced *by construction* (one nib, one slant, one grid, a limited
primitive set, letterform skeletons) and then *proven* by a built-in self-test.

---

## The model (all deterministic from the seed)

### 1. Phonology
A small, curated, pronounceable inventory:
- **12–18 consonants** drawn from a fixed pool, always seeded with a common backbone
  (`m n t k s l`) so coined words sound natural.
- **4–6 vowels**, always including the cardinal trio `a i u`.
- a simple syllable rule **(C)V(C)** — onset optionality and coda permission are seeded,
  so some hands are open-syllable, some allow final consonants.

These let the press *coin* pronounceable invented words (the rendered phrase, and the
romanization tokens behind the key).

### 2. The "hand" — what makes it look like one script
The hand fixes everything that every glyph shares:
- **script type** — `alphabet | abugida | syllabary | abjad`. This governs how vowels
  are treated: full letters (alphabet), attached diacritic marks (abugida/abjad), etc.
- **shared metrics** — em-box, **baseline**, **x-height**, ascender/descender lines,
  **slant angle**, **stroke weight**, **contrast** (thick/thin), **nib angle**
  (broad-pen modulation), and a baseline **construction grid**.
- **a chosen subset of 5–8 stroke primitives** from the pool
  `{stem, bar, bowl, arc, diagonal, hook, dot, ring, crossbar}`. Every hand is seeded to
  own at least one *vertical* (stem), one *curve* (arc/bowl) and one *horizontal*
  (bar/crossbar), because a script that lacks any of those does not read as a hand.
- a **join style** (`angular | rounded | cursive`).

### 3. Glyph synthesis — letterform skeletons, not primitive piles
Each phoneme is built from a **letterform skeleton**: a recipe of abstract roles
(spine, shoulder, bowl, leg, crossbar, ear…) — `arch`, `doubleArch`, `bowlStem`, `cup`,
`loop`, `crossedStem`, `vee`, `cross`, `zig`, `hookedStem`, `eared`. Each role is
*realized* with a primitive the hand actually owns; if a preferred primitive is absent the
skeleton degrades to one that is present (so it is always letter-shaped, never a bare pair
of tally marks). Skeletons are **spread** across the inventory by a seeded permutation, so
a hand exercises its whole repertoire rather than producing five identical rings.

The result: glyphs differ in structure (real letter variety) yet are drawn from the same
small primitive set, on the same grid, with the same nib/slant/weight — so they all read
as **one family**. `phoneme → glyph` is a **bijection**, built once per seed; duplicates
(rare) are deterministically nudged apart so injectivity is guaranteed.

Vowels in abugida/abjad hands become **diacritic marks** (dots/rings/hooks) that attach to
the preceding consonant — the genuine behaviour of those script families.

### 4. Render
The press coins a short couplet, lays it out left-to-right on a baseline/x-height grid
with even letter-spacing and word spacing, draws each glyph with the shared broad-nib
modulation (thin along the nib angle, thick across it; round caps/joins; cubic/quadratic
curves), and prints the invented **script name** ("the ___ hand") as a rubric. A
romanization **key** shows every glyph ↔ its sound (romanization + an IPA-ish label).

---

## Styles (re-skin only — never change geometry)
- **Manuscript** — ink on warm parchment (the default; gold rubric).
- **Lapidary** — incised cool stone (grey field, slate ink).
- **Codex** — deep blue-black & gold, with a gilt border (illuminated).

A style supplies **colour only** (page, ink, rubric/flourish). Glyph geometry is computed
entirely independently of style; switching style recolours the identical strokes.

---

## Controls
Seed display + type-a-seed + **New hand** (re-roll); style picker; **"write your own"**
(romanized text → rendered in the hand via the bijection); a script-type indicator;
cosmetic **slant** and **stroke-weight** sliders (re-render the *same* script — they do not
touch geometry, so the round-trip never drifts); **Export PNG** (2× retina); show/hide key
and guide lines.

---

## Correctness crux — the built-in self-test (the workshop's signature verifiable gate)
Runs on every load (and on every seed change); surfaces a **`self-test ✓ (N checks)`**
badge whose tooltip lists each assertion. It asserts:

- **(A) Bijection.** `phoneme → glyph` is **injective** over the full inventory — no two
  phonemes share a glyph (compared by geometry fingerprint) — and the inverse
  `glyph → phoneme` map is well-defined (same size as the forward map).
- **(B) One coherent hand.** Every glyph uses **only** primitives from the hand's chosen
  set, every coordinate lies **within the em-box**, and there is **no NaN** in any path.
- **(C) Round-trip fidelity ("can't drift").** For **120 random romanized inputs**,
  `readBack(render(text)) === normalize(text)` — the rendered glyph string decodes back,
  via the inverse glyph→phoneme map, to the original phoneme sequence.
- **(D) Seed purity / style invariance.** The same seed produces an **identical geometry
  fingerprint** (a hash over every glyph's path geometry + the shared metrics) — proven by
  rebuilding the script twice and comparing — and the style table is asserted to carry
  **no geometry keys** (colour only). So the script is identical across all three styles.

If any check fails the badge turns red and the failure is logged to the console.

---

## Files
- `index.html` — the piece (engine + UI + self-test, single file).
- `SPEC.md` — this document.
- `CHANGELOG.md` — the build log.
