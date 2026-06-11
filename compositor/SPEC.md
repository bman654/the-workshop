# Compositor — SPEC

*A generative type press.* Seed a striking **typographic poster** — an evocative phrase set in a
chosen design **movement** (Swiss/International, Bauhaus, Brutalist, Art Deco, Editorial) with a
generated palette, type scale, grid, and ornaments. Re-roll endlessly; type your own text; export
PNG. The workshop's **compositor** (one who sets type) — a new medium: generative graphic design,
sibling in spirit to Cartographer/Oracle/Daedalus (a maker-engine).

One self-contained file: `compositor/index.html` — vanilla JS + **Canvas**, **zero deps, no
network/CDN/web-fonts** (system font stacks only: a grotesque sans `Helvetica Neue/Arial`, a serif
`Georgia/Times`, a mono `ui-monospace/Menlo`, a rounded/condensed where the stack allows), relative
paths, `"use strict"`. Canvas so PNG export is trivial (`toDataURL`). Seeded (reuse Cartographer's
`makeRng`); same seed + movement + text ⇒ identical poster.

## THE BAR (most important): it must look INTENTIONALLY DESIGNED, not random.
Generative typography fails when it looks like ransom-note chaos. Every poster must read as something
a human designer could have made: **strong grid + alignment, a deliberate type scale (few sizes, big
contrast), a restrained palette (2–4 colours), generous & intentional negative space, clear
hierarchy.** Constrain hard within each movement's real rules. When in doubt, do LESS. Verify by eye
(see below) — if a poster looks amateurish/cluttered, tighten the rules and re-roll until they look
like a curated set.

## Poster content
- **Text:** by default a **seeded generated phrase** from curated evocative pools — a short title +
  optional subtitle/kicker/numeral/date (e.g. *"THE LONG QUIET", "a field guide to falling", "NO. 7",
  "MMXXVI", "dispatches from the edge of the map"*). Keep it coherent & evocative (Oracle's bar). ALSO
  a **text input** so the user can type their own title (+ optional subtitle) and re-roll the layout.
- The composition arranges the text (and a few abstract ornaments) on a poster canvas.

## Movements (segmented selector; each a real, distinct design system — picks palette + type + grid + layout rules)
Note: unlike the other pieces, **movement DOES change the layout** (it *is* the generative system),
while the seed varies the specific composition within that movement. Re-roll for variety.
- **Swiss / International** — strict modular grid, flush-left grotesque sans, huge size contrast,
  lots of white space, one accent (often red) on black/white; maybe a thin rule or a rotated 90°
  baseline. Asymmetric balance.
- **Bauhaus** — primary palette (red/blue/yellow) + black on warm white, geometric shapes
  (circle/triangle/bar) interacting with the type, some 45°/90° rotation, geometric sans.
- **Brutalist / Type-as-image** — one or two MASSIVE words filling the canvas, tight leading,
  high-contrast mono or heavy sans, minimal palette, intentional crop/overflow of glyphs off the edge.
- **Art Deco** — symmetric, centred, gold/cream on deep teal or black, geometric rules/chevrons,
  letter-spaced caps, a framing border.
- **Editorial / Classical** — elegant serif, centred or classic margins, refined small palette,
  hairline rules, a drop-figure or large initial; magazine-cover calm.
(Implement at least 4. Each must be unmistakably itself.)

## Generative system (per movement)
Seed drives: which **grid** (columns/rows/margins), where the title/subtitle/kicker/numeral sit
(snapped to grid + aligned), the **type scale** (a few harmonious sizes), **weights/case/tracking**,
rotation (only where the movement allows), the **palette** (generated within the movement's family —
harmonious, limited), and **ornaments** (rules, bars, dots, ticks, geometric shapes, a framing
border) placed with restraint. Use `measureText` to fit/scale text to the grid (never overflow
unintentionally; intentional brutalist crop is opt-in per movement). Crisp on retina (devicePixelRatio).

## Controls (mirror Cartographer's `#panel`: collapsible, seed row, segmented, sliders, actions)
Title **Compositor**, sub *Generative Type Press*. Then:
- **Seed** row (input + dice).
- **Movement** segmented (Swiss / Bauhaus / Brutalist / Deco / Editorial).
- **Text** input(s): a title field + an optional subtitle field; a "🎲 generate text" button to fill
  them from the seeded phrase pools (default state = generated).
- Sliders: **Scale/Contrast** (size hierarchy intensity), **Ornament** (how much decoration: 0 = pure
  type → 1 = rules/shapes), **Format** (aspect: portrait 2:3 ↔ square ↔ wide) or a small format selector.
- Flourish chips: **Grid overlay** (show the underlying grid, off by default), **Texture/grain**,
  **Frame/border**.
- Actions: **⟳ Re-roll** (primary, new composition) · **↓ PNG** (export, `toDataURL`, file
  `compositor_<seed>.png`). Hint line. Panel collapse/reopen.

## Performance / quality
- Render is essentially static (redraw on change) — must be instant; devicePixelRatio-aware; debounced
  resize. **Zero console errors/warnings.** Posters look crisp and *designed*.

## Verification (self-verify in a UNIQUE agent-browser session `compositor-build` — never the default tab)
Open `file://`. Screenshot **several posters in EACH movement** (re-rolling) — the key check:
**do they look like intentionally-designed posters (strong hierarchy, alignment, restraint), and is
each movement clearly distinct?** Be honest; if any look random/cluttered/amateurish, fix the rules
and re-roll until a screenshotted set looks curated. Also: type a custom title → confirm it sets &
fits; toggle grid/frame/ornament; export PNG (downloads); confirm seed reproducibility (same
seed+movement+text ⇒ identical) and **zero console errors**. Save screenshots under `/tmp/compositor-build/`.

## Deliverables
1. `compositor/index.html`.
2. `compositor/README.md` — short (match `cartographer/README.md` tone/length).
3. `compositor/thumb.png` — a **16:9 screenshot ≤1440px wide** for a front-door GRID card (not a
   feature): frame the most striking poster attractively (it can sit on its backdrop; a bold
   Swiss/Bauhaus/Brutalist piece reads best at thumbnail size). Panel hidden.
4. `compositor/CHANGELOG.md` — build log.

## House rules
- One self-contained file; no network/CDN/web-fonts (system stacks only). Relative paths.
- Sibling of Cartographer (panel, collapse, export, seeded RNG). Do NOT edit the front-door
  `index.html` or other projects (landing card + rebalance curated separately). Do NOT git commit.
