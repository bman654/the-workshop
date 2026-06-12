# Theogony — build log

## Build 1 — v1 (2026-06-12)

**Theogony ⚡ — a generative mythology engine, placed as Threshold's companion (the workshop's
7th "wing": place & pantheon).** Single self-contained vanilla HTML/CSS/JS file
(`theogony/index.html`, ~1030 lines), zero dependencies, zero network.

### What it makes
From a seed → an invented **pantheon**: a coherent family of **~10–18 gods** across **3–5
generations**, rendered as an **illuminated celestial genealogy**.
- **Names** are coined from a per-pantheon **sound-system** (a seeded onset/vowel/coda set), so
  the names share a family resemblance (à la the workshop's invented constellation/poet names).
  Each god gets 1–2 **epithets** ("the remembered", "Keeper of the deep", "Mother of …").
- **Domains** are drawn from a curated pool of 24, each carrying an **opposite** (sea↔flame,
  dawn↔dusk, memory↔forgetting, hearth↔wild, harvest↔famine, making↔ruin, loom↔knife,
  storm↔silence, deep↔height, threshold↔road, dead↔birth, green↔stone). Principal gods hold
  **distinct** primary domains; opposing pairs that both appear surface as rivalries.
- **Kinship** is a DAG built by construction: gen-0 **primordials** (parentless) → later gods
  each take 1–2 parents drawn **only from strictly-earlier generations** (so child-gen > every
  parent-gen, monotonically). Siblinghood is *derived* (shared parent). **Consorts** are a
  separate undirected bond (never a lineal pair), drawn as a distinct dashed/looped gold line.
- **Origin-myths**: a short myth line + epithets per god, curate-then-arrange from hand-authored
  fragment templates, **filled only with that god's real kin/domains** in this pantheon — the
  prose is generated *from* the data structure and can never name an entity that isn't there.
- **Render**: SVG genealogy laid out by generation; small **sigil nodes** (a seeded glyph +
  domain mark each); descent lines; consort bonds; a click-to-read **read-a-god** panel (name,
  domain, epithets, parentage, siblings, consort, children, generation, myth). Seed + ⟳ re-roll,
  **3 styles** (Star-Chart indigo+gold / Illuminated parchment+ink / Stone carved tablet), **2×
  PNG export**.

### The crux — built-in headless self-test (runs on load; green "✓ self-test 4/4" chip; never ships red)
The generator is pure/testable (`buildPantheon(seed) → pantheon`, no DOM). On load a harness
samples several seeds and asserts:
1. **Acyclic descent (DAG + monotonic generations)** — full ancestor-walk over every god finds
   no cycle; each child's generation is strictly greater than every parent's; consorts are
   reciprocal and never lineal.
2. **Referential integrity ("can't drift")** — every myth/epithet declares the referent ids it
   used; the test confirms each is a real god, that the prose names no *other* god (whole-token
   match, so a name that is a substring of a longer name doesn't false-positive), and that each
   named referent is genuinely the god's kin or domain-rival.
3. **Domain coherence** — principal gods hold distinct primaries; opposing pairs map to two
   different real gods.
4. **Seed purity / style-invariance** — same seed → identical deterministic **fingerprint**;
   switching render style does NOT change the pantheon (fingerprint identical across all 3
   styles); distinct seeds don't collide.

### Bugs found & fixed during the build
- **Referential-integrity false positive (substring name collision).** The myth back-parser
  used `indexOf`, so a short god-name that was a *substring* of a longer god-name in the same
  pantheon (e.g. "Dreal" inside "Drealtriel") was flagged as an undeclared reference even though
  the prose was correct. Fixed by tokenizing the myth and matching whole god-name tokens
  (stripping possessives/punctuation). Caught by running the pure generator + self-test headless
  in Node *before* the browser pass; a 400-seed sweep then ran clean.
- **Size distribution skewed small.** Initial shape (`gens 3–5`, `per-gen 2–4`) put ~29% of
  pantheons under the ~10-god target. Bumped to `gens 4–5`, `per-gen 3–4` → 98% now land in
  [10,18], centred ~14–16, range 11–19. Self-test still 4/4.
- **Seed not surfaced on first load.** The loaded pantheon's seed wasn't shown in the box (only
  populated on button/space), so a fresh visitor couldn't keep what they were looking at.
  Refactored `roll(fresh)` to always write the seed used back into the box.

### Verified in a real browser (agent-browser, served origin)
Self-test chip green + **4/4 PASS** in console; **0 console errors / 0 warnings**; 60fps (static
SVG — no animation loop, so nothing to drop); re-roll produces varied coherent pantheons (20
rolls all distinct-domain + valid-DAG); clicking a node reads that god (panel name/domain/myth
match the selection); same seed reproduces byte-identically; style switch is content-identical
(fingerprint + names identical across Star/Illum/Stone, only colours change); PNG export
rasterizes a valid non-blank 2× image.

### Wiring (front door stays at the curated 9 cards)
- `threshold/index.html`: a `.sib-link` (CSS copied from `verse/`) — *↗ Theogony — the gods that
  made such a place* → `../theogony/index.html`; plus `.topbar .right` flex wrap.
- `theogony/index.html`: back-links `← workshop` + `↗ Threshold`.
- Front door `index.html`: Threshold entry gains `companion:{name:"Theogony",badge:"⚡"}` → a
  subtle "⚡ Theogony within" pill. No new card (still 9).
- `README.md`: a companion blockquote under Threshold; companion count six → seven.
- Drops `ws:seen:theogony` (breadcrumb for the hidden-world framework; see `/UNLOCK.md`).
