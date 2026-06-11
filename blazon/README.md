# ⚜️ Blazon

*Stamp a coat of arms from any seed — and read back the formal blazon that describes it exactly.*

A single self-contained HTML tool (**zero dependencies** — double-click `index.html`) that generates
a heraldic **coat of arms** and, crucially, speaks its **blazon**: the formal heraldic sentence a
herald would use to describe it. The arms are built as a data structure first; the picture *and* the
sentence are both rendered from that same structure, so the words always match the drawing — a
heraldist reading the blazon could redraw the shield. SVG-rendered, so **Export PNG** is one click.
Every achievement is reproducible from its **seed**.

Blazon is **Compositor's sibling** — the workshop's second design press. Where Compositor sets a
phrase as a designed poster, Blazon stamps a shield.

## Use it

Open `index.html`, hit **Re-roll** (or type a seed), pick a **style** and **shield shape**, and
**Export PNG**. The formal blazon, house name, and motto appear in the panel and beneath the shield.

- **4 styles:** Illuminated (rich painted tinctures, gilt Or, parchment surround), Engraved (the
  authentic monochrome **Petra Sancta** hatching — dots/lines/crosshatch encode each tincture, with a
  toggleable legend), Modern (clean flat vector), Stone (carved greyscale relief).
- **5 shield shapes:** heater, French, Italian, lozenge, roundel — everything re-clips to the outline.
- **Authentic vocabulary:** 7 tinctures + 2 furs (Ermine, Vair), party & varied field divisions
  (per pale/fess/bend/chevron/saltire, quarterly, barry, paly, chequy, lozengy, gyronny), honourable
  ordinaries (chief, fess, pale, bend, chevron, cross, saltire, bordure, pile), and a curated set of
  charges (roundel, mullet, estoile, crescent, fleur-de-lis, rose, escallop, crosslet, lion rampant,
  eagle displayed, tower, key, sword, crown, stag's head, and more) in single, three-2-and-1, charged
  ordinary ("on a chief … three …"), and semé arrangements.
- **The rule of tincture** is enforced (never colour-on-colour nor metal-on-metal; furs are
  wildcards). Strict mode is on by default — every re-roll looks like real, correct arms.

## How it works

A seeded PRNG (xmur3 + mulberry32, separate streams per concern) builds the **arms data structure**
(field, division + tinctures, ordinary, charges, name, motto) once. The renderer draws it as crisp
SVG; the blazon engine composes the heraldic sentence from the *same* structure — field → ordinary →
charges, tinctures Capitalized, correct articles (*a lion*, *an eagle*), plurals (*fleurs-de-lis*,
*mullets*, *escallops*), beast attitudes (*a lion rampant Or*), and roundel special names (*a torteau*,
*three bezants*). Switching style/shape or toggling motto/name/crest/legend changes only the rendering
— never the arms. System font stacks only; no web fonts, no network.

Built by Claude in its creative space (Compositor's sibling), and rigorously self-verified in a real
browser: re-rolling dozens of arms to confirm the blazon exactly matches each drawing, the rule of
tincture never breaks, the styles are independent, and the console stays clean.
