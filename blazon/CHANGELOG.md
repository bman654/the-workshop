# Blazon — build log

## v1.0 — the heraldic arms press

A single self-contained `index.html` (1905 lines, zero dependencies, no network/CDN/web-fonts).
Compositor's sibling — the workshop's second design press. Generates a coat of arms as a data
structure, then renders the SVG shield *and* composes the formal blazon from that same structure, so
the words always describe exactly what is drawn.

### What it does
- **Arms-first generation.** Seeded PRNG (xmur3 + mulberry32, separate streams: `::field`,
  `::ordinary`, `::charge`, `::name`, `::motto`) builds an arms data structure once. Render and
  blazon both read it — drawing and text cannot drift.
- **Blazon engine.** Field → ordinary → charges word order; Capitalized tinctures; correct articles
  (*a lion* / *an eagle*); irregular plurals (*fleurs-de-lis*, *mullets*, *estoiles*, *escallops*,
  *crosses*, *lozenges*); beast attitudes (*a lion rampant*, *an eagle displayed*); roundel special
  names by tincture (*a torteau*, *three bezants*, *three pellets*); charged ordinaries
  (*on a chief Azure three mullets Or*); and semé (*semé-de-lis Purpure*). No trailing period
  (heraldic convention).
- **Rule of tincture (enforced).** Metals = Or, Argent; colours = Gules, Azure, Sable, Vert, Purpure;
  furs = Ermine, Vair (wildcards). Charges/ordinaries placed *on* the field must contrast in class.
  On a divided metal+colour field — where no solid contrasts with both parts — a fur is chosen (the
  universal wildcard), keeping the rule airtight without breaking the look. Strict mode on by default.
- **4 styles** (render-only; arms never change): Illuminated (painted tinctures, gilt Or gradient,
  parchment surround, fine outlines), Engraved (Petra Sancta hatching + toggleable legend), Modern
  (flat vector, dark surround), Stone (greyscale emboss relief).
- **5 shield shapes:** heater, French, Italian, lozenge, roundel — content re-clips to each outline.
- **Achievement extras:** motto scroll, house-name caption, crest/helm + mantling + torse, hatching
  legend — all toggleable, none alter the arms.
- **PNG export:** serialize SVG → `<img>` → canvas (2×) → `toDataURL`, mirroring Compositor.

### Sample blazons (each verified to match its drawing in-browser)
- `Vert, an eagle displayed Argent` — green field, silver displayed eagle. *(thumb: `Azure, an eagle displayed Argent`)*
- `Gules, a bend Argent, three estoiles Argent` — red field, white bend, three wavy-rayed stars 2-and-1.
- `Vert, a pile Argent, three lions rampant Argent` — green field, white pile, three rearing lions 2-and-1.
- `Quarterly Azure and Ermine, three suns Ermine` — quartered field (blue / ermine-fur), three rayed suns.
- `Per saltire Or and Azure, three escallops Vair` — saltire-divided field, three Vair-fur scallop shells.
- `Or, a chevron Vert, an eagle displayed Vert` — gold field, green chevron, green displayed eagle.
- `Per fess Sable and Ermine, three trefoils Ermine` — used for the style-independence test.
- `Gules, on a fess Or three lozenges Azure` — charged ordinary, correct nested word order.
- `Per pale Argent and Purpure, on a chief Ermine three crosslets Purpure, a mullet Ermine` — charged chief + field charge.
- `Argent, a torteau` — single Gules roundel rendered with its special name.
- `Argent, on a pale Gules two escallops Ermine, three pellets` — two-on-an-ordinary + three Sable roundels (pellets).
- `Or, semé-de-lis Purpure` — gold field strewn with small purple fleurs-de-lis.
- `Gyronny Argent and Azure, three crescents Vair` — 8-wedge varied division.

### Self-verification (real browser, uniquely-named session `blazon-verify`, `file://`)
- **Fidelity gate:** 10 scripted re-rolls — for each, the engine blazon equalled the on-screen
  readout (`domMatchesEngine: true`) and the screenshot matched (tinctures, division, ordinary,
  charge identity + count + 2-and-1 arrangement, grammar/articles/plurals). 0 mismatches.
- **Rule of tincture:** 20 strict re-rolls in-browser (plus 400 in a headless harness) → **0**
  colour-on-colour or metal-on-metal placements.
- **Style independence:** one seed across Illuminated/Engraved/Modern/Stone → identical arms +
  identical blazon, only the rendering differs. Engraved hatching matches the legend exactly
  (Or=dots, Argent=blank, Gules=vertical, Azure=horizontal, Vert=diagonal, Sable=crosshatch,
  Purpure=diagonal-sinister).
- **Seed reproducibility:** same seed re-entered ⇒ byte-identical arms structure + blazon.
- **Shapes/extras:** all 5 shapes re-clip correctly; motto/name/crest/legend toggle cleanly; semé and
  charged-ordinary arrangements render; PNG export decodes to a valid 1120×1360 image.
- **Console:** clean — 0 errors/warnings across 20+ re-rolls spanning every style × shape with all
  extras toggled.

### Notable fix during the build
- **PNG export XML bug.** Caption `font-family` values used double quotes (`"Iowan Old Style"`)
  inside double-quoted SVG attributes. The lenient HTML parser tolerated it on screen, but
  `XMLSerializer` (used by the PNG export path) mangled the attribute and the SVG failed to load as
  an `<img>`. Fixed by switching font-stack family names to single quotes. Caught by decoding the
  exported PNG in-browser during verification.
