# Threshold — build log

## v1.0

A seeded generative interactive fiction in one self-contained `index.html` (vanilla JS + DOM, zero
deps, no network/CDN/web-fonts, system serif/sans/mono, relative paths, `"use strict"`).

### Approach
- **Curate, then arrange.** Hand-authored every load-bearing sentence; the seed only arranges them.
- **3 deep themes** (drowned library / winter terminus / house that remembers), each with its own
  vocabulary, palette tint, place-name pools, proper-noun pools (keeper, feature, sound, the thing
  kept), and **9 location archetypes** with 2–3 authored passage variants each, plus an authored
  entrance and heart (2 variants each), exit phrasings per destination, and in-place actions.
- **Proper-noun binding:** the place's keeper/feature/sound/object/kept are drawn once per seed and
  filled into passages via `{token}` slots, so a place reads as one place with recurring figures and
  a threaded motif.
- **Graph:** PRNG (xmur3 + mulberry32) → choose theme → instantiate nouns → spanning spine
  (entrance → interior → heart) + interior cross-links (woven, not a corridor) → heart reached only
  via its single approach (so depth of arrival can't be shortcut). N = 9–11 locations; heart at BFS
  depth 3–6; always fully connected; entrance always forks.
- **Reader:** centred ~36rem serif column, drop-letter, fade between passages, per-theme dark tint,
  trail dots, sticky footer (Seed + New place + Begin again).

### Quality passes (driven by reading full playthroughs in a real browser)
- Split each theme's object-of-desire into an abstract **`kept`** (object of "looking for…") and a
  concrete placeable **`object`** (what "lies open / stands on the mantel"), fixing token-binding
  grammar breaks (e.g. "stands a name carved on the doorframe").
- De-gendered keeper references (they/their, dropped possessives) so any keeper value reads cleanly.
- Removed `{keeperShort}'s` constructions that broke on multi-word values ("the Reader who stayed's").
- Rewrote revisit leads to be self-contained re-entry lines (no room-name collision like
  "Once more, the attic. The attic smells…").
- Deepened each theme from 6 → 9 room archetypes so places span 8–12 locations and journeys lengthen.
- Layout: top-aligned scrolling flow + sticky footer + bottom padding so long heart passages clear
  the panel; mobile-readable.

### Verification
- 40+ full seeded playthroughs across all 3 themes rendered end-to-end: **zero console errors.**
- Same seed reproduces the same place (theme, name, bound nouns, variants, graph) — confirmed.
- Choices navigate; heart reachable; New place → new coherent place; Begin again → same place,
  threshold. Mobile viewport (380×680) checked: sticky controls reachable.

### Deliverables
`index.html`, `README.md`, `thumb.png` (1280×720 16:9 — drowned-library atrium, panel hidden),
`CHANGELOG.md`.
