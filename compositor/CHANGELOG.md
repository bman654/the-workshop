# Compositor — build log

## v1.0 — initial build

Single-file generative typographic poster press (`index.html`, ~1350 lines, vanilla JS + Canvas,
zero deps / no network / system fonts only). Sibling of Cartographer: reuses its seeded PRNG
(xmur3 + mulberry32 `makeRng`), floating collapsible `#panel` + reopen tab, segmented buttons /
sliders / chips, `toDataURL` PNG export, and devicePixelRatio-aware canvas with debounced resize.

### Built
- **Seeded phrase generator** — curated evocative pools with grammatical templates (always
  coherent, never word-salad): title + subtitle + kicker + numeral (Roman / NO. n / 0n).
- **5 movements, each a distinct design system** (movement = the generative system; seed = the
  composition within it):
  - **Swiss/International** — 6-col modular grid, flush-left grotesque, huge size contrast, one
    accent word, hairline rules, optional rotated baseline up the right margin.
  - **Bauhaus** — primary palette + geometric motif (circle / bar / triangle) composed into a
    deliberate corner block, type in a separate clear zone, kicker/numeral with collision guard.
  - **Brutalist** — one/two MASSIVE stacked words, tight (non-colliding) leading, heavy sans/mono,
    opt-in intentional edge-crop, heavy footer bar.
  - **Art Deco** — symmetric/centred, gold on deep teal/oxblood, sunburst/chevron, letter-spaced
    caps, divider diamond, double framing border.
  - **Editorial** — elegant serif, classic margins, hairline rules, ghosted drop-initial / numeral,
    magazine-cover calm.
- **Controls** — seed row + dice; movement segmented; title + subtitle fields + 🎲 generate text;
  Scale/Contrast · Ornament · Format (portrait 2:3 / square / wide 3:2) sliders; Grid-overlay /
  Texture(grain) / Frame chips (all off by default); ⟳ Re-roll (primary) + ↓ PNG
  (`compositor_<seed>.png`); collapse/reopen.
- **Fit discipline** — `measureText`-driven type scaling + word-wrap that guarantees no single word
  exceeds the measure (no unintended overflow); intentional crop is opt-in (Brutalist only).
- **Frame overlay** — restrained inner border in each movement's ink.

### Art-direction pass (verified in-browser, session `compositor-build`)
Screenshotted several re-rolled posters in every movement and critiqued them. Swiss / Deco /
Editorial read as intentionally designed from the first pass. Two issues found and fixed:
- **Bauhaus** was the weakest — scattered uncoordinated shapes, a kicker/numeral collision, and a
  title overflow. Reworked into zoned layouts (type and a *composed* motif never share space),
  added a kicker/numeral shrink-to-fit guard, and fixed the root wrap bug.
- **Brutalist** lines were colliding vertically — loosened leading from 0.80→0.92 em so glyphs
  clear while staying tight; kept the deliberate crop.

### Verified
- Several curated posters per movement; each movement clearly distinct.
- Custom long title + subtitle set and fit cleanly (Deco, two wrapped centred lines).
- All 3 formats and all flourishes (grid / frame / grain) render correctly.
- Seed + movement + text reproducibility: byte-identical PNG output (generated and custom paths).
- Zero console errors across all 15 movement×format combinations + toggles.
- PNG export downloads a valid file named `compositor_<seed>.png`.

### Deliverables
`index.html`, `README.md`, `thumb.png` (1440×810, 16:9 — Bauhaus "THE SILENT DISTANCE" on backdrop,
panel hidden), this `CHANGELOG.md`.
