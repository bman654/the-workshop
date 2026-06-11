# Blazon — SPEC

*A generative **coat-of-arms** machine, and **Compositor's companion**. Where Compositor sets a phrase
as a designed poster, Blazon stamps a **shield** — and, crucially, speaks its **blazon**: the formal
heraldic sentence that exactly describes it. Re-roll endlessly from a seed; keep the ones you like.*

One self-contained file: `blazon/index.html` — vanilla HTML/CSS/JS, **SVG or canvas** (SVG recommended
— crisp vector shields, easy hatching/patterns, trivial PNG export via serialize→`<img>`→canvas). **Zero
deps, no network / CDN / web-fonts**, relative paths only (Pages subpath). Seeded & reproducible.

It is **Compositor's sibling**: the workshop's *graphic-design press*, second stamp. Reached via a
`↗ Blazon` link in Compositor's panel (companion pattern — front door stays at the curated 9), with
`← workshop` and `↗ Compositor` back-links here.

---

## 0. The crux: the BLAZON must EXACTLY describe the drawn shield (and obey the rule of tincture)

Two correctness properties define this piece (the equivalent of Orrery's "positions must be real"):

**(A) Blazon ⟷ shield fidelity.** The generated heraldic sentence must describe *precisely* what is
drawn — same tinctures, same field division, same ordinary, same charges, same count & arrangement —
in **correct heraldic grammar & word order**. A heraldist reading the blazon could redraw the shield.
This is the verifiable bar. Generate the **arms as a data structure first**, then render *and* blazon
*from that same structure* — never let drawing and text drift apart.

**(B) The rule of tincture.** *Never colour on colour, nor metal on metal.* Classify every tincture:
- **Metals:** Or (gold), Argent (silver/white).
- **Colours:** Gules (red), Azure (blue), Sable (black), Vert (green), Purpure (purple).
- **Furs:** Ermine, Vair (count as *neither* — a fur may lie on metal or colour).

Any charge/ordinary placed **on** a field must contrast in class: metal-on-colour or colour-on-metal
(furs are wildcards). Field **divisions** (per pale, etc.) are traditionally *exempt*, but for good
looks still pair a metal with a colour across the line. The generator must enforce this so every
re-roll looks like real, "correct" arms — not a random colour mash. (A single tasteful "rule-breaker"
toggle is allowed but **off by default**.)

---

## 1. The achievement vocabulary (curated, drawable, authentic)

### Tinctures & their renders
The 7 tinctures + 2 furs above. Per-style fills (see §3). **Furs** are real patterns: **Ermine** =
white field strewn with black ermine-spots (the little three-dot-and-tail mark); **Vair** = the
blue/white interlocking bell/cup pattern. Draw them properly (small repeating SVG pattern).

### Field treatments (pick one per shield, weighted toward simpler)
- **Plain** — one tincture.
- **Party (divided), two tinctures:** *per pale* (│ split), *per fess* (─), *per bend* (╲),
  *per bend sinister* (╱), *per chevron* (∧), *per saltire* (✕ into 4), *quarterly* (per cross, 4).
- **Varied (patterned), two tinctures:** *barry* (horizontal bars), *paly* (vertical), *bendy*,
  *chequy* (checkerboard), *lozengy*, *gyronny* (8 wedges). (Optional but lovely; include ≥3.)

### Ordinaries (0 or 1 honourable ordinary, weighted)
*chief* (top band), *fess* (centre horizontal), *pale* (centre vertical), *bend* / *bend sinister*
(diagonal band), *chevron* (∧ band), *cross*, *saltire* (✕), *bordure* (border), *pile* (downward
triangle from chief). Drawn in its own tincture (obeying rule (B) vs the field).

### Charges (curated set — clean, recognizable vector art; ~14–18)
Geometric & abstract (easy & iconic): **roundel** (named by tincture: *bezant* Or, *plate* Argent,
*torteau* Gules, *hurt* Azure, *pellet* Sable…), **annulet** (ring), **lozenge**, **billet**,
**mullet** (5-point star, option *pierced* / *of six points*), **estoile** (6 wavy rays), **crescent**,
**sun in splendour** (face + rays — or a clean rayed disc), **fleur-de-lis**, **rose** (5 petals +
barbs + seeds), **trefoil**/**quatrefoil**, **escallop** (scallop shell), **cross** variants
(crosslet, patonce, formy), **lozenge**.
Figurative (draw stylized but readable; include a few — they make the arms sing): **lion** (default
attitude *rampant* — rearing in profile; optional *passant*), **eagle** *displayed* (wings spread),
**martlet** (small footless bird), **tower**/**castle**, **key**, **sword**, **crown**/**coronet**,
**boar's head**, **stag/hart** or **stag's attire** (antler). Pick a subset you can draw *well* — a
few crisp, confident charges beat many clumsy ones. Each charge is a self-contained path/group scaled
to a slot.

### Charge arrangements (the classic layouts)
- **A single charge** centred (large). e.g. *a lion rampant Or*.
- **Three charges** in the default *2-and-1* arrangement. e.g. *three mullets Argent*.
- **(optional)** two in fess, or a charge **on** an ordinary (*on a chief Gules three roundels Or*),
  or **semé** (field strewn small: *semé-de-lis*). Include ≥1 of these for variety.

## 2. The blazon language engine (the special sauce — must be grammatically correct)
Emit a single sentence, **word order = field → ordinary(ies) → charges**, tinctures Capitalized,
proper articles & plurals. Build it deterministically from the arms data structure. Patterns:

- **Field:** plain → `"{Tincture}"` (e.g. `Azure`). Party → `"{Division} {T1} and {T2}"`
  (e.g. `Per pale Or and Gules`; `Quarterly Gules and Argent`). Varied → `"{Pattern} {T1} and {T2}"`
  (e.g. `Barry Argent and Azure`, `Chequy Or and Sable`).
- **Ordinary:** `", a {ordinary} {Tincture}"` (e.g. `, a fess Gules`). `bordure`/`chief` read naturally
  (`, a chief Azure`). If charged: `", on a {ordinary} {T} {n} {charge}{pl} {Tincture}"`.
- **Charges on the field:** `", {article/number} {charge}{attitude?}{plural?} {Tincture}"`:
  - one → `a/an {charge} {Tincture}` (article by initial sound: *an eagle*, *a lion*).
  - three → `three {charge-plural} {Tincture}` (correct plurals: *mullets, roses, fleurs-de-lis,
    martlets, towers, escallops, crescents, lions, eagles, crosses, lozenges*).
  - beasts carry attitude before tincture: `a lion rampant Gules`, `an eagle displayed Sable`.
  - semé → `semé-de-lis {Tincture}` / `semé of {charge} {Tincture}`.
- Capitalize the first word of the whole blazon; join clauses with commas; **no trailing period**
  (heraldic convention) — or one, configurable, but be consistent. Roundels may use their **special
  names** when tinctured (a Gules roundel → *torteau*; *three bezants* for Or) — nice authentic touch.

**Quality bar (Oracle-grade):** every blazon must be *valid* heraldic English and *faithful* to the
drawing. No word-salad, no mismatch. Paste 8–10 samples in the verification report for inspection.

## 3. Styles (segmented, 3–4) — palette/treatment driven; the ARMS never change, only the look
Render reads a `STYLES[style]` object. Switching style must NOT change tinctures, division, ordinary,
or charges — only how they're drawn. (Same seed + same style options ⇒ identical arms.)
- **Illuminated** *(default)* — rich saturated tinctures, **Or as gilt** (gold gradient/leaf sheen),
  a fine outline on charges, set on a warm parchment surround with a subtle painted texture; serif
  caption. Looks like a medieval armorial plate.
- **Engraved (hatched)** — **the authentic monochrome convention**: tinctures shown by the standard
  **Petra Sancta hatching** — *Or* = field of dots; *Argent* = plain (blank); *Gules* = vertical
  lines; *Azure* = horizontal lines; *Vert* = diagonal (bend-wise) lines; *Sable* = cross-hatch
  (both directions); *Purpure* = diagonal sinister lines. Ink line-art on cream; monospace/serif
  caption. **Include a tiny hatching legend** (toggle) — it's charming *and* makes the convention
  verifiable. This style is a highlight; get the hatching patterns right.
- **Modern (flat)** — clean flat bold vector, crisp edges, minimal outline, contemporary palette of
  the same tinctures; sans caption. Logo-like.
- *(optional 4th)* **Stone / carved** — greyscale relief (emboss/bevel), as if carved above a door.

## 4. Flourishes / achievement extras (toggles, sensible per-style defaults)
- **Shield shape** selector: *heater* (classic, default), *French* (square-ish, bouché), *Italian*
  (rounded/horsehead), *lozenge* (diamond), *roundel*. Re-clip everything to the chosen outline.
- **Motto scroll** (toggle) — a ribbon below with a generated motto: short Latin-ish or evocative
  English from curated pools (e.g. *“Fortis et Fidelis”*, *“By Light and Iron”*). Seeded.
- **Helm + mantling + wreath/torse + crest** (toggle, off by default — only if drawable cleanly): a
  helm above the shield with flowing mantling and a small crest atop a torse. Keep tasteful; if it
  can't be made beautiful, ship without it (shield + motto is a complete achievement).
- A generated **house/family name** caption (e.g. *“Arms of House Thornfield”*) — ties to the
  Oracle's naming craft; seeded. Optional toggle.

## 5. Controls (mirror Compositor's panel look + collapse/reopen)
Title **Blazon**, sub *Heraldic Arms Press* (or *Coat-of-Arms Generator*). Then:
- **Seed** row: text input + **⚄ dice** (random seed). Same arms for same seed+options.
- **Style** segmented: Illuminated / Engraved / Modern (/ Stone).
- **Shield shape** segmented or select.
- Complexity / content controls: **Complexity** (plain↔elaborate — biases division/ordinary/charge
  count), maybe individual toggles: **Division**, **Ordinary**, **Charges**, **Fur fields**,
  **Semé**. Toggles: **Motto**, **Crest/Helm**, **Name caption**, **Hatching legend** (engraved),
  **Strict rule of tincture** (on by default).
- Actions: **⟳ Re-roll** (primary) · **↓ PNG** (export — serialize SVG → canvas → `toDataURL`,
  file `blazon_<name-or-seed>.png`; mirror Compositor's export).
- A live **blazon readout** panel: the formal blazon sentence (selectable text, copyable), plus the
  name/motto if on. This is the centrepiece text — make it legible and prominent.
- Hint line; panel collapsible (`✕` / reopen), like Compositor/Firmament.

## 6. Generation = pure function of (seed + options)
Reuse the workshop's seeded RNG approach (xmur3 + mulberry32; study `compositor/index.html` or
`firmament/index.html`). Separate streams per concern (`seed+"::field"`, `"::charge"`, `"::name"`,
`"::motto"`). The **arms data structure** (field, division+tinctures, ordinary, charges[], name,
motto) is built once from the seed; render and blazon both read it. Switching **style/shape** or
toggling **legend/motto/name/crest** changes only rendering/extras, **not** the underlying arms
(verify: same seed ⇒ identical blazon across styles).

## 7. Performance / quality bar
- Instant re-roll; crisp at any size (vector); **PNG export pixel-perfect**. No animation needed (it's
  a press, not a screensaver) — so no rAF loop required; redraw on re-roll/option-change/resize.
- **Zero console errors/warnings.** Beautiful at desktop sizes; panel collapses gracefully on mobile.
- Charges sit correctly within the shield outline (clipped), arrangements (2-and-1) well-spaced and
  centred, divisions/ordinaries geometrically clean.

## 8. Verification — self-verify in a UNIQUELY-NAMED agent-browser session (never the default tab)
The gate is **blazon-fidelity + heraldic correctness**, so verify text AND picture together:
1. **Fidelity (the core gate):** for **8–10 re-rolls**, record (a) the rendered arms (screenshot) and
   (b) the emitted blazon, and confirm the blazon **exactly matches** the drawing — right tinctures,
   division, ordinary, charge identity + count + arrangement, correct grammar/plurals/articles/word
   order. List all 8–10 (blazon text + a note on what's drawn) in the report. ANY mismatch = bug, fix it.
2. **Rule of tincture:** across ~20 re-rolls (strict mode on), confirm **no** colour-on-colour or
   metal-on-metal placements. Report the check.
3. **Style independence:** pick one seed; switch every style → screenshot; confirm the arms (tinctures,
   division, ordinary, charges, blazon text) are **identical**, only the rendering differs. Confirm
   **Engraved hatching** matches the legend (Or=dots, Azure=horizontal, Gules=vertical, Vert=diagonal,
   Sable=crosshatch, Argent=blank, Purpure=diagonal-sinister) — screenshot with legend on.
4. **Seed reproducibility:** same seed+options re-entered ⇒ identical arms + identical blazon.
5. **Shapes/extras:** switch shield shapes (clip updates); toggle motto/name/crest/legend; PNG export
   downloads a correct image. Console clean throughout.
6. Report: summary, the 8–10 blazon samples, rule-of-tincture result, hatching check, fps/console
   status (console must be clean), screenshot paths, line count.

## 9. Deliverables
1. `blazon/index.html` — the press.
2. `blazon/README.md` — short, match `compositor/README.md` tone/length; note it's Compositor's sibling
   and that the *blazon faithfully describes the drawn arms* (the special bit).
3. `blazon/CHANGELOG.md` — build log incl. a few sample blazons + the fidelity/tincture check results.
4. `blazon/thumb.png` — 16:9 screenshot of a gorgeous **Illuminated** achievement (shield + charges +
   blazon caption / motto visible), ≤1440px wide.

## 10. House rules
- One self-contained file; **no network/CDN/web-fonts** (system serif/sans/mono stacks only).
- Feel like a **sibling of Compositor** (panel look, segmented controls, seed+dice, export pattern,
  seeded RNG) — the workshop's second design press.
- Back-links: **`← workshop`** (`../index.html`, copy Threshold/Orrery's `<a class="back">`) and a
  small sibling link to Compositor (`../compositor/index.html`, e.g. "↗ Compositor — the type press").
- **Do NOT edit other projects or the front-door `index.html`** — the Compositor→Blazon companion
  cross-link is wired separately by the lead agent (keeps the curated front door at 9).
