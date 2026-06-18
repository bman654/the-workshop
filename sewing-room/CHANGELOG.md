# The Sewing Room — changelog

A front-door wing (manor district, tier 2, wing slug `sewing`, footprint `house-wing`).
Glyph 🪡. Tag: *the strings wing*. Thesis: **one loop of string, and the laws it
obeys.** The estate's home for everything 1-dimensional — yarn, rope, thread, and the
craft + topology of them. The topological cousin of the VIBRATING resonance / monochord
strings: this wing is how a string KNOTS and WEAVES, not how it sounds.

## v1 — wing opened (cycle #121)

**The landing.** `index.html` (modeled on `numbers-room/`): a dark woven ground, a gold
serif hero "THE SEWING ROOM", an eyebrow + lede framing the wing soul (one loop and the
laws it obeys), a stamp, and a footer. Two bench cards, each with a glyph, name, kind,
blurb, and a **"self-test ✓" proof span** stating its exact claim:

- **The Knot Tabulator** (➰ · *knot theory · the determinant `|Δ(−1)|`*) → the wing's
  first resident, ADOPTED not rebuilt (it already existed as a standalone Workbench
  bench since cycle #15; this cycle added only a reciprocal back-link to its topbar).
- **The Cat's-Cradle Weaver** (🪢 · *string figures · a formal move-grammar*) → the
  fresh flagship bench built this cycle (see `../cradle-weaver/CHANGELOG.md`).

**The proof.** A landing self-test chip (`#selftest`, `window.__sewingRoomSelfTest`)
runs **11 checks**: it counts the live benches (=== 2), asserts each href is relative +
contains `index.html` + is present by exact href, asserts both cards' exact claims,
checks the hero / eyebrow / lede / stamp / footer and the `../index.html` back-link, and
drops + verifies `ws:seen:sewing-room`. Reads **11/11 ✓**.

**Front-door registration.** A PLACES entry in `index.src.html`
(`id:"sewing-room" district:"manor" tier:2 wing:"sewing" footprint:"house-wing"`) and
`WING_META.sewing = { label:'THE SEWING ROOM', accent:'#d9b873' }` in
`tools/layout/layout.js`; `index.html` re-forged from source.

**Publisher fresh-eyes (cycle #121).** Reviewed clean — landing chip 11/11, two live
bench cards, 0 nested anchors, 0 horizontal overflow @1280 AND @390, `ws:seen:sewing-room`
dropped, 0 console errors. The front-door POI renders in the manor cluster with the
"THE SEWING ROOM" wing label engraved in the SVG, reading cleanly distinct from its
Clockwork-Automata / Museum siblings (`smoke.cjs` PASS confirms no footprint-slab
stacking by construction). A third resident — *The Unknotting Bench* — is seeded.
