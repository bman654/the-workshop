# The Gate — Asset & Scene Spec  *(LOCKED — Phase B)*

> **This is the single source of truth the Asset Foundry (Phase C) builds against.**
> It is DERIVED from the aesthetically-approved greybox blockout (branch `the-gate`,
> HEAD `689e3cb`), measured from the actual code — NOT guessed. Every number here is
> extracted from `scene.js` / `scene-buildings.js` / `scene-gate.js` / `colormap.js`
> / `the-gate.src.html`, or computed from a stated formula with its resolved value.
> Ambiguity here is rework later: when in doubt, read the cited file:line.
>
> Plan-of-record: `ideas/the-gate/PLAN.md` · reuse anchors: `ideas/the-gate/RECON.md`
> · vision: `ideas/the-gate/description.md` + `example-rendering.png`.
> Locked renders to anchor descriptions: `/tmp/gate-shots/v5-{idle-day,gate-open-day,
> idle-night,undercroft-night}.png`.

---

## 0. Status

- **Phase A (scaffold + greybox)** — DONE.
- **Phase B (lock the spec)** — **THIS DOCUMENT.** Locked from the approved blockout.
- **Phase C (asset foundry)** — builds against §1–§8 below.
- **Phase D (parametric systems + cinematic)** — see §9 (open items).

The blockout draw fns are PLACEHOLDERS that establish each asset's box, anchor,
scale, perspective, palette roles, and emissive parts. The foundry REPLACES each
draw fn with estate-quality final art **into the same box, to the same interface**.

---

## 1. Canvas & coordinate system

### 1.1 viewBox

`<svg viewBox="0 0 1600 900">` — **1600 × 900, aspect 16:9** (`scene.js:35-36,58-63`,
exposed as `S.VB_W = 1600`, `S.VB_H = 900`). `preserveAspectRatio="xMidYMid slice"`
(fills the window, center-cropping the long axis), `width/height = 100%`. The SVG is
`#gate-svg`, built into `#scene-host` (`the-gate.src.html:20,68`). All coordinates in
this spec are in viewBox units unless stated otherwise.

Key horizons / reference lines (memorize these — every asset hangs off them):

| Line | y | Meaning |
|---|---|---|
| Sky disc center | 124 | moon/sun center (`scene.js:176`) |
| Gate crest peak | ~146 | `TOP−86 = 232−86` (`scene-gate.js:112`) |
| Leaf top | 232 | `TOP` (`scene-gate.js:36`) |
| Building/ground HORIZON | **470** | grass top = manor base = hill foot = mist band (`scene.js:341`, `scene-buildings.js:31,99`) |
| Manor base | 472 | `baseY` (`scene-buildings.js:104`) |
| Apron back edge | 812 | near-paving the gate stands on (`scene.js:366`) |
| Frame bottom | 900 | `BOT`; gate runs off-frame (`scene-gate.js:37`) |

### 1.2 Layer Z-stack (draw order, back → front)

Built in `S.build()` (`scene.js:54-118`). Each layer is its own `<g>`. **Draw order is
occlusion order** — a later layer paints over an earlier one. Asset agents register
into the layer named in the §4 per-asset table; they must NOT change which `<g>` a
draw fn is appended to.

| # | `<g>` id | Purpose | Assets that live here |
|---|---|---|---|
| 1 | `layer-sky` | full-bleed vertical gradient `sky.top→sky.horizon` + starfield | sky gradient (`url(#sky-grad)` rect), `starfield` (90 GLOW dots, top 55% of frame) |
| 2 | `layer-sky-objects` | the disc + asterism, ABOVE the centered manor | moon (night) OR sun (day/dusk); placeholder asterism (`refreshSkyObjects`) |
| 3 | `layer-clouds` | drifting clouds that obscure ONLY layers 1–2 (behind the buildings) | clouds (`weather-fx.js`; cumulus shown for cloudy/storm, §5.10) |
| 4 | `layer-far-scenery` | distant buildings + horizon haze | `horizon-mist`, `observatory-rise` (hill+observatory), `manor` |
| 5 | `layer-midground` | the grass occlusion plane + everything ON it that is BEHIND the forward furniture | grounds (grass rect, grade band, road, two road lamps), foreground apron, trees & bushes |
| 6 | `layer-furniture` | **forward** grounds furniture, drawn IN FRONT OF the grass plane | greenhouse, cairn room-rep + label, undercroft hatch |
| 7 | `layer-gate` | the foreground hero frame | gate assembly: leaves, crest, gears, gnomon/sundial, piers+lamps, plaque |
| — | `#fx` `<canvas>` | FX overlay — rain + lightning (a sibling CANVAS above the SVG, NOT an SVG layer) | `weather-fx.js` rain/lightning (§5.10); birds still future |
| — | UI chrome (HTML) | weather tri-toggle, mute chip, welcome card, overlay | owned by the boot HTML (`the-gate.src.html:29-87`) |

### 1.3 RULE — the grass plane is the OCCLUSION BOUNDARY

The midground grass rect (layer 5, `drawGrounds`, x0..1600 from y470 down) paints over
everything earlier. **Any object whose base sits BELOW the horizon (y > 470) — i.e. it
reads as forward/close — MUST draw in `layer-furniture` (layer 6) or `layer-gate`
(layer 7), never in `layer-far-scenery` (layer 4).**

> This is a real bug, documented so the foundry never reintroduces it: the greenhouse
> was originally drawn in far-scenery (layer 4); the grass rect (layer 5) then painted
> over its body and only a sliver of ridge survived. It was moved to `layer-furniture`
> (`scene.js:83-88,105-106`). **Forward buildings draw in the forward layer.** A
> foundry pass that re-homes a forward asset into far-scenery is WRONG and will bury it.

---

## 2. The lighting contract — palette-swap, NOT a filter

Mood/color comes from SWAPPING one of three hand-authored palettes; the only "filter"
is a single brightness scalar `B` that scales each swappable role's luminance. Emissive
`GLOW` roles are palette-immune AND B-immune (a storm-night lamp still blazes). There is
**no `filter:hue-rotate()/brightness()/saturate()` over the scene, and no per-asset hue
or brightness filter** — those are the rejected "ugly" path (`colormap.js:1-23`, PLAN §3).

### 2.1 Swappable palette roles — EXACT token values (all 3 bands)

From `colormap.js:93-157` (`PALETTES.{DAY,DUSK,NIGHT}`). These are the AUTHORED base
colors; `B` is applied at resolve-time (§2.3), NOT baked in.

| role | DAY | DUSK | NIGHT |
|---|---|---|---|
| `sky.top` | `#3f7bd0` | `#3b3766` | `#0a1326` |
| `sky.horizon` | `#bcd6ef` | `#e8a878` | `#2a3a55` |
| `manor.wall` | `#e9e2d2` | `#e3cbb0` | `#aeb6c6` |
| `manor.roof` | `#7a5240` | `#6a4338` | `#3a4150` |
| `manor.trim` | `#c9a24a` | `#d8af5c` | `#8f8466` |
| `observatory.dome` | `#5a6472` | `#5c5260` | `#3a4250` |
| `observatory.body` | `#2b2f38` | `#2a2730` | `#181c26` |
| `greenhouse.frame` | `#3a4a44` | `#3c3a3c` | `#222a30` |
| `greenhouse.glass` | `#bfe0dc` | `#d3b59a` | `#5a7280` |
| `gate.iron` | `#2a2d36` | `#2a2630` | `#14171f` |
| `brass.stroke` | `#c9a24a` | `#d8af5c` | `#9c8350` |
| `brass.bright` | `#f0d489` | `#f4d999` | `#cdb375` |
| `grass` | `#6f9b4e` | `#6e7a44` | `#3c4a50` |
| `road` | `#c9b58e` | `#c6a982` | `#5a5f6a` |
| `hill` | `#5d7e44` | `#5a5a3c` | `#2c3742` |
| `tree.foliage` | `#4f7b3a` | `#586537` | `#2c3a40` |
| `tree.trunk` | `#5a4630` | `#4f3c2c` | `#2a2620` |
| `stone` | `#9aa0a8` | `#9a8e8a` | `#6a7079` |
| `mist` | `#dfe8f2` | `#e7c6b0` | `#7c8aa0` |
| `rep.swatch1` | `#9aa0a8` | `#9a8e8a` | `#6a7079` |
| `rep.swatch2` | `#9aa0a8` | `#9a8e8a` | `#6a7079` |
| `rep.swatch3` | `#9aa0a8` | `#9a8e8a` | `#6a7079` |

> **`rep.swatch1..3` are the room-rep SWAPPABLE color slots** (NEW roles — add to
> `colormap.js PALETTES.{DAY,DUSK,NIGHT}`). They exist in all 3 bands with NEUTRAL
> stone-grey defaults (an un-overridden rep just reads stony, never broken). The
> SELECTED rep overrides these per-band with its OWN design colors — e.g. an Aquarium /
> Ripple Tank rep supplying non-emissive blues, a manor-glass-green rep, etc. — so they
> still dim with `B` and read "lit from above" like any swappable surface. Only ONE rep
> renders at a time, so the three slots are SHARED/reusable across reps. See §5.8 for the
> override mechanism + the per-band requirement.

### 2.2 Emissive GLOW roles — EXACT token values (palette-immune, fixed)

From `colormap.js:164-174` (`GLOW`). Identical at all bands; light SOURCES draw these
parts so they stay vivid at night and recede only slightly in bright day (§2.3 dayRecede).

| GLOW role | hex | used by |
|---|---|---|
| `lamp.flame` | `#ffd27a` | pier lamp-globes, road lamps |
| `window.lit` | `#ffcf73` | manor windows + door + clock pip; observatory windows; greenhouse interior; manor clock face |
| `moon.disc` | `#f2ead2` | the moon's lit region + highlight |
| `sun.disc` | `#ffe9a8` | the sun disc + halo |
| `asterism.star` | `#f0d489` | asterism stars + the full-frame starfield |
| `asterism.line` | `#c9a24a` | asterism connecting lines + its italic label |
| `cavern.maw` | `#7fd4c0` | (Phase-C room-rep: Physics Cavern glowing mouth) |
| `undercroft.glow` | `#8a123a` | the undercroft hatch's pooled depth-glow |
| `arcade.screen` | `#37f7e0` | (Phase-C room-rep: Arcade screen) |
| `rep.glow1` | `#7fd4c0` | room-rep EMISSIVE slot 1 (rep-overridable; neutral teal default) |
| `rep.glow2` | `#7fd4c0` | room-rep EMISSIVE slot 2 (rep-overridable; neutral teal default) |

> **`rep.glow1..2` are the room-rep EMISSIVE color slots** (NEW GLOW roles — add to
> `colormap.js GLOW`). Palette-immune like every GLOW role; the SELECTED rep overrides
> them with its own glow color — e.g. a Stellar Forge rep supplying emissive blues, a
> Ripple-Tank caustic, an Aquarium bioluminescence. They are in the dayRecede fadeable
> set (§2.3) so a bright daytime sky doesn't blow them out, and stay vivid at night.
> Defaults are a neutral teal (matches `cavern.maw`) so an un-overridden glow still
> reads. See §5.8. (The fixed `cavern.maw` / `arcade.screen` roles REMAIN for reps that
> want the canonical estate colors; `rep.glow1..2` are for reps bringing NEW colors.)
>
> NOTE: the undercroft hatch greybox falls back to `#6e1430` inline (`scene.js:543`); the
> canonical resolved GLOW value is `#8a123a` (`colormap.js:172`). The foundry uses the
> `--undercroft-glow-ref` var; the fallback only matters before vars are written.

### 2.3 Brightness scalar B

`B = bandBase(band, moonK) × weatherFactor(weather)`, spiked to `1.0` on a lightning
flash. Clamped to `[0,1]`. (`colormap.js:184-198`.)

- **bandBase** (`colormap.js:184-189`):
  - `day` → `1.0`
  - `dusk` → `0.6`
  - `night` → `0.30 + 0.50·moonK`  (moonK = illuminated fraction 0..1; clamped; greybox
    default `0.6` → night bandBase `0.60`)
- **weatherFactor** (`colormap.js:190-194`): `clear` → `1.0` · `cloudy` → `0.85` ·
  `storm` → `0.5`
- **flash** (`colormap.js:195-198`): if true, `B = 1.0` (overrides everything).

Resolved examples (the brightness levels the foundry should screenshot at):
`day/clear B=1.00` · `dusk/clear B=0.60` · `night clear @moonK0.6 B=0.60` ·
`night storm @moonK0.6 B=0.30` (the dimmest non-flash extreme) · `day storm B=0.50` ·
`night clear @moonK1.0 B=0.80` (full moon, the brightest night) · `lightning flash B=1.0`.

**Luminance dimming** (`dim()`, `colormap.js:79-87`): each swappable role is converted
to HSL, `L → L·B`, and saturation gently bled out as it darkens (`s → s·(0.55+0.45·B)`)
so deep night reads silvery/low-chroma, never muddy. This is per-ROLE color math, NOT a
filter on the rendered scene.

**dayRecede for GLOW** (`dayRecede()`, `colormap.js:204-213`): GLOW roles are written at
full intensity at night. A subset — `lamp.flame`, `window.lit`, `cavern.maw`,
`undercroft.glow`, `arcade.screen`, **and the new `rep.glow1`/`rep.glow2`** — recede in
bright light by factor `clamp(1.0 − 0.4·B, 0.6, 1.0)` (B near 1 → 0.6; B low → 1.0) so a
bright daytime sky isn't washed out by emissives, but they NEVER drop below 0.6. The sky
payoff — `moon.disc`, `sun.disc`, `asterism.star`, `asterism.line` — is NEVER receded
(kept strong; `dayRecede` returns 1.0 for them). When adding `rep.glow1`/`rep.glow2`,
ALSO add them to the `dayRecede` fadeable list in `colormap.js:208-209`.

### 2.4 The CSS-var mechanism (load-bearing — describe exactly)

`colormap.resolve(band, B)` returns a map keyed by the **canonical DOTTED var name**:
`{ '--sky.top': 'rgb(...)', '--brass.stroke': 'rgb(...)', ... '--moon.disc': 'rgb(...)' }`
(`colormap.js:215-230`). For each swappable role and each GLOW role.

`S.applyResolved(rootEl, vars)` (`scene.js:608-616`) writes **BOTH** onto the scene root
(`#stage`):
1. the canonical dotted var: `--sky.top`
2. a **dash-named `-ref` ALIAS**: `--sky-top-ref` (dots → dashes, suffixed `-ref`),
   computed by `S.dashName(role)` = `'--' + role.replace(/\./g,'-') + '-ref'`
   (`scene.js:603`).

**RULE — every SVG attribute MUST reference the dash `-ref` alias, never the dotted
var.** Dots inside `var()` in an SVG attribute are awkward/unreliable, so all draw fns
use the alias form with a literal fallback:

```
fill="var(--brass-stroke-ref, #c9a24a)"
stroke="var(--manor-wall-ref, #aeb6c6)"
```

The sky gradient stops are the one place that sets `stop-color` via JS to the alias to
dodge the dot-escaping issue (`scene.js:123-128`). During a band crossfade, the boot
mirrors the dotted vars onto the dash aliases each rAF frame so SVG attrs track the fade
(`the-gate.src.html:872-884`); the foundry does not touch this — it just uses `-ref`.

The literal fallback after the comma should be the role's **NIGHT** value (the resolved
default look before vars are applied), matching the existing greybox fallbacks.

### 2.5 RULES a draw fn MUST follow

1. **Swappable parts** (walls, roofs, glass, iron, stone, grass, hill, road, trees,
   mist, the sky) use a palette role via `var(--<role>-ref, <night-fallback>)`. Never a
   hardcoded body color for a swappable surface. (Exception kept from greybox: the dark
   "body" of brass furniture is `rgba(11,14,22,.85)` — the estate brass idiom's dark
   body — which is intentionally NOT palette-swapped; see §8.)
2. **Emissive parts** (lamp flames, lit windows, the moon/sun discs, asterism
   stars/lines, the undercroft glow) use a GLOW role via `var(--<glow-role>-ref, …)`.
   Emissive parts are NEVER dimmed by B (only the dayRecede subset recedes, handled by
   colormap — the draw fn just references the var).
3. **Lit from above** (`colormap.js:21`, PLAN §3): the brightest highlight/stroke sits
   on the object's **TOP edge** (use `--brass-bright-ref` for the sheen); shadows fall
   **down/forward**. Every greybox asset already does this (e.g. `scene-buildings.js:53,
   80,135`; `scene-gate.js:58`; cairn sheen `scene.js:479-481`) — the final art must keep
   the light direction consistent across the whole frame.
4. **No per-asset hue/brightness/saturate filters.** The only allowed SVG filters are the
   shared glow feathers in `buildDefs` (`scene.js:121-150`): `#glow-soft` (warm emissive
   halo), `#glow-star` (tight star bloom), `#glow-moon` (wide blur-only lit-limb halo).
   Final art may define its OWN blur/displacement filters for craft (paper-grain,
   candle-glow) but MUST NOT apply a color-tinting filter — color comes from the palette.
5. **Ambient animation — ALLOWED and ENCOURAGED where it fits the subject.** An asset (and
   especially a room-rep) MAY animate ambiently when motion *expresses what the thing is* —
   a ripple tank ripples, an orrery turns, a flame flickers, a pendulum swings, a fountain
   falls, a clock's escapement ticks, a screen scans, a forge pulses. Many reps will want
   it; reach for it when it deepens the read. **Mechanism:** prefer self-contained **SMIL**
   (`<animate>` / `<animateTransform>` on the asset's own `<g>`) so the loop runs with NO
   JS tick and survives independent of the Phase-D engine; if a richer/parametric drive is
   wanted, publish a handle on `S.refs` (§3.3) and let a driver own it. **Constraints (all
   MUST hold):** (a) motion stays QUIET + secondary — it never pulls focus from the hero
   gate, never jitters or strobes; (b) it preserves the lit-from-above read at every frame
   (rule 3) and adds no color-tinting filter (rule 4); (c) it loops seamlessly and costs
   ~nothing (a handful of animated nodes, not hundreds); (d) it degrades under
   `prefers-reduced-motion` — gate any non-essential loop behind a reduced-motion check
   (the `.gnomon-hint` pattern, `the-gate.src.html:62-64`) or pause it via the published
   ref. A STATIC rep is still perfectly valid — animate only when it genuinely serves the
   room, never as decoration for its own sake. *(Precedent: the Ripple Tank rep — emanating
   SMIL wavefront clipped to the water plane, `scene.js drawRepRipple`; rendered/judged at
   chosen phases via the `?smil=<seconds>` dev pin, §7.)*

---

## 3. Draw-fn interface

### 3.1 Module attachment

Each module is an IIFE that hangs its API off `window.Gate.*` and ends with a **dual-use
module guard** the forge strips:

```js
(function (root) {
  'use strict';
  var Gate = root.Gate = root.Gate || {};
  var X = { /* … */ };
  Gate.x = X;
  if (typeof module !== 'undefined' && module.exports) { module.exports = X; }  // forge strips this line
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

Existing namespaces: `Gate.scene` (skeleton + sky + midground + furniture + orchestration),
`Gate.scenebuildings` (manor/observatory/greenhouse/mist), `Gate.scenegate` (gate
assembly + swing/spin), `Gate.colormap`, `Gate.timeofday`, `Gate.weather`, `Gate.audio`,
`Gate.gnomon`, `Gate.asterism`, `Gate.rooms`, `Gate.sequence`.

### 3.2 The draw-fn signature

Two shapes exist in the blockout; the foundry preserves whichever the asset already uses:

- **scene.js-internal helpers** take `(parent)` and close over the module's `S`
  (e.g. `drawGrounds(parent)`, `drawTrees(parent)`, `drawRoomRep(parent)`,
  `drawUndercroftHatch(parent)`). `parent` is the layer `<g>`.
- **cross-module draw fns** take `(parent, S)` where `S === Gate.scene`
  (e.g. `Gate.scenebuildings.drawManor(parent, S)`, `Gate.scenegate.drawGate(parent, S)`).
  `S` exposes the SVG toolkit: `S.el(name, attrs, parent)`, `S.group(id, parent)`, `S.NS`,
  `S.VB_W` (1600), `S.VB_H` (900), `S.refs` (published animation handles), `S.dashName(role)`.

**Use `S.el` / `S.group` for ALL SVG creation** (they handle the SVG namespace) — never
`document.createElement`. Append into the `parent` `<g>` you are given.

### 3.3 Published animation refs

The gate publishes refs the sequence drives (`scene-gate.js:299-318,322`):
`S.refs.leftLeaf`, `S.refs.rightLeaf` (the swinging `<g>` groups; `transform-box:fill-box`
+ `transform-origin` at the hinge), `S.refs.gears` (the spinning cluster), `S.refs.gnomon`
(the tap target `#gnomon-target`). Animation entry points: `Gate.scenegate.swing(openFrac
0..1, S)` (`scene-gate.js:346-353`) and `Gate.scenegate.spinGears(turns, S)`
(`scene-gate.js:356-358`). **A foundry pass that restyles the gate MUST keep publishing
these refs with the same pivots and the same `swing/spinGears` signatures** — the
sequence and the boot depend on them. The `#gnomon-target` id is also load-bearing (the
boot click-router checks for it to distinguish a gnomon tap from a gate-open click,
`the-gate.src.html:926-931`).

### 3.4 forge + module conventions

- **forge:include** — modules are inlined into `the-gate.html` by
  `<!-- forge:include <relpath> -->` on its own line, one per `<script>`
  (`the-gate.src.html:766-810`; `tools/forge/forge.mjs`). Build by hand:
  `node tools/forge/forge.mjs the-gate/the-gate.src.html`. Never hand-edit
  `the-gate.html` (it is regenerated every cycle).
- **module-guard strip** — the forge strips the dual-use guard line + `export`/static
  `import` when inlining `.js` (RECON: `forge.mjs:44-87`). Keep the guard as the exact
  one-line form above so it is stripped cleanly.
- **NO runtime ES imports** in the browser modules — all sharing is via `window.Gate.*`
  and the forge inline. (`reclaim.mjs` is the only ES-module file; it runs in Node, not
  the browser.)
- **RULE — asset agents edit ONLY their own module file. Never touch the boot dispatch in
  `the-gate.src.html`** (the boot is a thin dispatcher pre-stubbed so parallel asset
  agents never collide on it, PLAN §2). New emissive/palette roles, if ever needed, are
  added in `colormap.js` (and only with orchestrator sign-off — adding a role touches the
  contract).

---

## 4. Per-asset table

Boxes are measured from the cited code (viewBox 1600×900). "Anchor" is the point the art
is positioned from. **Tiers + take counts** (PLAN §5, with the owner's room-rep
override): HERO **K=4**, SUPPORTING **K=2**, ROOM-REPS **K=3** (may bump to 4 after the
first 4 are reviewed), MINOR = direct-to-spec (no fan-out). Moon/sun + asterism are
parametric systems finalized in Phase D but get a beauty pass too (§9).

### 4.1 HERO (K=4)

| Asset | Layer | BBox (x0..x1 / y0..y1) | Anchor | Scale/perspective | Palette roles | Emissive (GLOW) | Draw fn (file:line) | Art brief |
|---|---|---|---|---|---|---|---|---|
| **Manor** (destination, seen through the bars) | 4 far-scenery | x512..1088 / y340..472 (main block x606..994 y352..472; wings to x512/x1088; clock tower up to y340) | base-center (x800, baseY 472) ON the horizon | flat front-elevation, distant; almost fills the gate opening (x472..1128), small margin inside the piers | `manor.wall`, `manor.roof`, `manor.trim`, `brass.stroke`, `brass.bright` | `window.lit` (2×6 window grid + door + clock pip + clock face + 8 wing windows) | `scene-buildings.js:97-171` | A grand pale Victorian manor: mansard main block + hip-roofed flanking wings + central clock tower; candle-warm windows; brass-bright top-lit eaves. Fresh front-elevation, not a top-down plan. |
| **Brass gate + gears** (the whole gate assembly) | 7 gate | **x400..1200 / y146..900** (piers outer x400 & x1200; crest peak y146; leaves x472..1128 y232..900; runs off bottom) | seam center x800; each leaf hinges on its inner pier edge (x472 left, x1128 right) | foreground hero; ~50% of frame width; leaves are flat in-plane (swing = horizontal scaleX foreshorten) | `gate.iron`, `brass.stroke`, `brass.bright`, `stone` (piers) | `lamp.flame` (2 pier lamp-globes + halos) | `scene-gate.js:293-337` (sub-parts below) | A grand ornate brass double gate: dark body + brass stroke + brass-bright top sheen; finialled bars, C-scrolls, arched scrolled crest, masonry piers with blazing lamp-globes, a working clockwork gear-train at the seam, a brass sundial, an engraved plaque. The first impression of the estate. |
| · gate leaves (×2) | 7 | each HALF=328 wide; left box x472..800, right x800..1128; y232..900 | hinge = outer (pier) edge of each box | bars you see through; swing outward | `gate.iron`, `brass.stroke`, `brass.bright` | — | `scene-gate.js:47-99` | finialled vertical bars + horizontal rails + upper C-scrollwork; heavy edge stiles. |
| · crest | 7 | spans x472..1128; baseY 228, peak y146 | seam x800 | static arch the leaves close beneath | `gate.iron`, `brass.stroke`, `brass.bright` | — | `scene-gate.js:105-140` | flattened-gothic arch + volute scrolls + central orb-and-spire finial. |
| · piers (×2) + lamps | 7 | each PIER_W=72; left x400..472, right x1128..1200; body y212..900; cap & lamp up to ~y150 | column center (x436 / x1164) | substantial stone columns; lamp-globe on cap | `stone`, `brass.stroke`, `brass.bright` | `lamp.flame` (globe r9 + halo r22 at globe center ~y150) | `scene-gate.js:144-191` | stacked-stone column, stepped brass cap, brass lantern base + EMISSIVE glass globe (the night payoff) + finial. |
| · gear-train | 7 | cluster ~x652..960 / y336..594 (driver r72 @ x800 y470; 4 smaller gears around it) | child of assembly, spins about its own bbox center | overlays the seam; reads as the drive | `brass.stroke`, `brass.bright` | — | `scene-gate.js:307-318,194-226` | 5 toothed brass gears (dark body + brass stroke), hubs/spokes/top-glint; the visible engine. |
| · gnomon / sundial | 7 | R=38 → ~x760..836 / y594..670; center x798 y632 | center (x798, y632) | brass dial flat on the gate face | `brass.stroke`, `brass.bright`; blade body `#e6bd6f` (gnomon furniture token) | — (no GLOW; pulsing hint stroke only) | `scene-gate.js:230-270` | brass dial face + hour marks + raised triangular blade casting a shadow; the discoverable tap-target (`#gnomon-target`). |
| · plaque | 7 | w300 h90 → x650..950 / y675..765; center x800 y720 | center (x800, y720) | brass plate over the closed leaves | `brass.stroke`, `brass.bright` | — | `scene-gate.js:273-290` | engraved brass plaque: "The Orrery Estate" (Georgia 32) / "CLICK TO ENTER" (mono 13, letterspaced). Wordmark IS the logo. |
| **Observatory + rise** | 4 far-scenery | hill x−40..540 / y300..480; observatory body x164..256 y296..360, dome up to ~y258, telescope to ~y240 | hill peak ~x230; observatory base x210 y360 | distant on the LEFT, behind/left of the left pier | `hill`, `observatory.body`, `observatory.dome`, `brass.stroke`, `brass.bright` | `window.lit` (2 observatory windows) | `scene-buildings.js:47-90` | a soft grass mound with a black-and-brass domed observatory: drum body, hemispherical dome with a shutter SLIT + telescope barrel poking at the sky; lit windows. |

### 4.2 SUPPORTING (K=2)

| Asset | Layer | BBox | Anchor | Scale/perspective | Palette roles | Emissive | Draw fn | Art brief |
|---|---|---|---|---|---|---|---|---|
| **Greenhouse** | 6 furniture | near corner foot x1372 baseY 600; front face left edge fL≈1291; side recedes to x≈1496; eaves ~y513; gable apex ~y479 → **bbox ~x1291..1496 / y479..600** | near vertical corner foot (x1372, y600) | 3/4 corner view (front gable face + side wall receding right), scaled ×0.66; base BELOW horizon → reads CLOSE; sits right of the right pier | `greenhouse.frame`, `greenhouse.glass`, `brass.bright` | `window.lit` (faint interior glow + a brighter low pip) | `scene-buildings.js:182-281` | a Victorian glasshouse at 3/4: translucent panes, glazing bars converging in perspective, gable end, ridge prism, near corner post, warm plant-glow inside at night. A dimensional glasshouse, not a flat decal. |
| **Trees** (×4) | 5 midground | trunk+ellipse foliage; sized by `sc`. Instances: (96,556,1.35)→~x45..147 y446..556; (250,600,.85); (348,572,1.05); (1232,588,1.2); (1548,624,.78) | base-center (x, baseY) | midground; framing, kept off the gate footprint (x400..1200); right-side trees BEHIND greenhouse | `tree.trunk`, `tree.foliage`, `brass.bright` | — | `scene.js:407-435` | rounded estate trees: trunk + foliage mass, top-lit crown sheen. Sway is Phase D. |
| **Bushes** (×4) | 5 midground | 3-lobe ellipse cluster ~`±34·sc` wide. Instances: (300,700,1.0); (1500,724,1.1); (1240,706,.85) | base-center | low midground accents | `tree.foliage` | — | `scene.js:436-441` | low rounded shrubs (3 overlapping lobes). |
| **Pier-lamps** (×2) | 7 gate (part of pier) | globe center x436/x1164, ~y150; halo r22 | globe center | emissive globe on each pier cap | `brass.stroke` (housing) | `lamp.flame` (globe + halo) | `scene-gate.js:172-189` | brass lantern + glowing glass globe; blazes at night. (Drawn within the pier; can be a foundry sub-pass.) |
| **Plaque** | 7 gate | x650..950 / y675..765 | center x800 y720 | brass plate, reads over the leaves | `brass.stroke`, `brass.bright` | — | `scene-gate.js:273-290` | (see HERO sub-row.) Estate wordmark plate. |
| **Undercroft hatch** | 6 furniture | opening x1222..1378 / y678..742; with curb + open leaves spread x≈1158..1442 | opening center x1300, near edge y742 | front-on cellar door set INTO the ground (near edge wider, far edge narrower); two doors flung open outward; right grounds, forward of greenhouse | `stone` (curb), `brass.stroke`, `brass.bright` | `undercroft.glow` (pooled depth glow, biased far/lower) | `scene.js:495-580` | a tornado-shelter / bilco cellar door open in the grass; two plank leaves laid back; a menacing red-violet glow rising from the dark depths. Earned-only (or `?undercroft=1`). |
| **The Glyph Stand** | 6 furniture | within the room-rep SLOT (§5) — sized inside the rep range | ground-line bottom of the slot | a designed plinth/easel holding a room's glyph | `stone`, `brass.stroke`, `brass.bright` | optional accent (the room's `accent`, treated as a self-lit pip) | NEW (Phase C; registered in `rooms.js` + a draw fn in `scene.js`) | the fallback rep for every unbuilt room: a small brass/stone plinth with a framed slot HOLDING the room's glyph, lit + palette-swapped like everything else. NO bare floating glyphs. |

### 4.3 ROOM-REPS (K=3; owner: trickiest assets — recognizable yet estate-styled)

| Asset | Layer | BBox | Anchor | Notes | Roles | Emissive | Draw fn | Art brief |
|---|---|---|---|---|---|---|---|---|
| **Cairn rep** (locked) | 6 furniture | stones x191..269 / y623..737 (w78 h114); label plate x139..321 / y738..762 | base-center groundline (x230, y720) | the canonical SMALL rep; the slot's reference footprint | stone body `#0c0e14` (intentional polished-black), `brass.stroke`, `brass.bright` | — | `scene.js:444-483` (`drawRoomRep`+`drawCairn`) | a stack of 5 polished black brass-rimmed stones, each top-lit with a brass-bright sheen; the estate's Tabularium fixture. |
| **3 essence-survey reps** (TBD by blind survey, PLAN §5) | 6 furniture | the room-rep SLOT (§5) | ground-line bottom (BOTTOM-ALIGNED, grow up / spread sideways) | aspect-flexible (vertical tower / horizontal pond / low wide mound) | shared estate roles + **`rep.swatch1..3`** custom-color slots (§5.8) | fixed estate GLOW where it fits (`cavern.maw`, `arcade.screen`, `window.lit`) OR **`rep.glow1..2`** custom slots (§5.8) | NEW (Phase C; draw fns in `scene.js`, registered in `rooms.js` `BESPOKE`) | recognizable-yet-estate-styled front-elevations that read as terrain/instruments, not pasted icons. Working hypothesis (NOT a seed): Orrery armillary (vertical), Physics Cavern maw in the hillside (low wide mound, `cavern.maw`), Ripple Tank pond (horizontal, non-emissive `rep.swatch*` blues). The survey confirms or overturns. |

### 4.4 MINOR (direct-to-spec, no fan-out)

| Asset | Layer | BBox | Roles / emissive | Draw fn | Art brief |
|---|---|---|---|---|---|
| Grass / midground | 5 | x0..1600 / y470..900 + a hill-toned grade band y470..540 @0.45 | `grass`, `hill` | `scene.js:339-344` | the ground plane rising from the horizon; the occlusion boundary (§1.3). |
| Road | 5 | tapering ribbon x706..894 (front) → x768..832 (manor) / y478..900 | `road`, `brass.bright` (crown + kerb) | `scene.js:349-355` | a paving ribbon from the gate seam straight back to the manor door; wide at front, narrow at the manor. |
| Foreground apron | 5 | x−40..1640 / y812..900 (trapezoid) + cobble joints fanning to the viewer | `stone`, `brass.bright` | `scene.js:362-389` | near cobbled paving the gate stands on; perspective joints; the biggest depth cue. |
| Road lamps (×2) | 5 | posts at x612/x988, baseY 520, h64; halo r18 | `brass.stroke`; `lamp.flame` | `scene.js:392-404` | small brass lamp-posts flanking the road inside the grounds (emissive). |
| Mist band | 4 | x0..1600 / y406..470 (two soft bands) | `mist` | `scene-buildings.js:28-36` | horizon haze separating distant buildings from the midground. |
| Sky gradient | 1 | full bleed | `sky.top`→`sky.horizon` (linear vertical) | `scene.js:72,121-128` | the graded sky; palette-swapped per band. |
| Stars | 1 | 90 deterministic dots, top 55% (y0..495) | `asterism.star` (GLOW) | `scene.js:153-165` | a faint always-present starfield that reads at night. |

### 4.5 Parametric (Phase D, but a beauty pass too)

| Asset | Layer | BBox | Roles / emissive | Draw fn | Note |
|---|---|---|---|---|---|
| Moon | 2 | disc center x800 y124 r64 → x736..864 / y60..188 | `moon.disc` (GLOW) + structural-dark body from `observatory.body`; `brass.bright` limb highlight | `scene.js:205-240` | phase-parametric (frac/side); §9 wires the real date via `sky-core.mjs`. |
| Sun | 2 | center x800 y124 (dusk y194) r64; halo r128 | `sun.disc` (GLOW) | `scene.js:293-300` | day high, dusk lower; soft halo. |
| Asterism (placeholder) | 2 | slot origin (70,24), 180 units → ~x70..250 / y24..205 incl. label | `asterism.star`, `asterism.line` (GLOW) | `scene.js:302-334` + `asterism.js` | upper-LEFT of the disc; Phase D swaps in the earned runtime pick (`Sky.CATALOG` 1440×900, affine-fit). |

---

## 5. Room-rep contract  *(owner requirement — get this right)*

### 5.1 The Cairn's measured bounding box

From `scene.js:444-483`: `drawRoomRep` calls `drawCairn(g, 230, 720)`. The 5 stones
(`scene.js:466-472`) give a STONE footprint of **x191..269 (width 78) / y623..737
(height 114)**, anchored bottom-center at the groundline (x230, y720). The label + brass
plate sit below at y738..762 (width depends on the room name, e.g. "The Cairn Face" →
182 wide, x139..321) — the LABEL is NOT part of the rep box (it's drawn beneath, §5.6).

### 5.2 The room-rep box is ASPECT-FLEXIBLE — NOT a uniform scale knob

A rep fills a flexible bounding box, not a single scale value. **WIDTH and HEIGHT vary
INDEPENDENTLY** within the range so a rep can take whichever of three canonical shapes
best expresses the room:

- **VERTICAL** (tall + narrow) — e.g. a building/tower/armillary. Grows UPWARD from the
  ground line.
- **HORIZONTAL** (wide + short) — e.g. a pond/lake spreading along the ground (Ripple
  Tank), a low table. Spreads SIDEWAYS along the ground line.
- **LOW WIDE MOUND** — e.g. the Physics Cavern as a rocky outcropping with a glowing cave
  mouth; a pool. Squat, wide, hugging the ground.

### 5.3 Size range (viewBox units)

- **min ≈ the Cairn's footprint: width 78, height 114** (some reps stay small).
- **max ≈ 2× the Cairn in EACH dimension, independently: width up to 156, height up to
  228** (some rooms want a building-sized rep).
- Width ∈ [78..156] and height ∈ [114..228], chosen INDEPENDENTLY per rep. A rep need not
  use the same factor on both axes (a horizontal pond might be width 156 / height ~60
  spread low; a tower might be width 90 / height 228).

> Min height 114 is the Cairn's actual height; a HORIZONTAL rep may legitimately go
> SHORTER than the Cairn (a flat pond is much shorter than a stone stack). Read the min as
> "roughly the Cairn's footprint" — a wide rep trades height for width. The hard ceiling
> is width 156 / height 228; the practical floor is "no smaller than the Cairn reads."

### 5.4 The SLOT + the ground-line anchor

The room-rep SLOT is the grounds in front of the observatory rise, bottom-left, where the
Cairn + its "The Cairn Face" label sit (`scene.js:445` `baseX=230, baseY=720`).

- **SLOT bbox: x152..308 (the 2× max width, centered on x230) / y492..720** (the 2× max
  height bottom-aligned at the ground line). The label band extends below to ~y762.
- **Common GROUND-LINE anchor: y = 720, horizontal center x = 230.** Every rep is
  **BOTTOM-ALIGNED to y720** and grows UPWARD (tall reps) or spreads SIDEWAYS about x230
  (wide reps). **Never center-scaled.** A draw fn receives this anchor (as `drawCairn`
  does) and builds up/out from it.

### 5.5 Max-fit verification (2× in each dimension) — **PASSES, no conflict**

The 2× max box bottom-aligned at the ground line is **x152..308 / y492..720**. Checked
against every neighbor:

- **Left pier** — outer edge x400 (body x400..472; cornice steps reach x386..486). Rep
  right edge x308 → **92px clear** of the pier body. PASS.
- **Observatory / hill** — observatory base x164..256 y296..360; hill foot to y480. The
  observatory sits ABOVE the rep (y≤360 vs rep top y≥492) and the hill is BEHIND it
  (layer 4 vs the rep's layer 6). No overlap in the readable plane. PASS.
- **Frame edge** — rep left edge x152 → 152px clear of x0. PASS.
- **Gate** — the nearest gate element is the left pier (x400); the gate opening/leaves
  start at x472. Rep right edge x308 is well left. PASS.
- **Trees** — midground trees at x250 (sc .85) and x348 (sc 1.05) overlap the slot's x
  range but are in layer 5 (BEHIND the layer-6 rep) and read as background framing, not a
  collision. PASS (layering correct).
- **Top edge** — rep top y492 sits just below the grass horizon (y470), so even a max-tall
  rep stays on the grounds and doesn't punch into the sky/mist. PASS.

**Conclusion: the 2× max rep fits the current slot cleanly. No open item for the
orchestrator on slot geometry.** Soft note (non-blocking): a max-tall rep and the layer-5
trees at x250/x348 share x-space; they layer correctly, but a foundry tree pass should
avoid fattening foliage into the slot core (x152..308 below y492) so it doesn't crowd a
tall rep.

### 5.6 Label spec

Below every rep (`scene.js:451-459`): Georgia serif, italic, font-size 20, fill
`--brass-stroke-ref`, text-anchor middle, baseline at `groundline + 34` (y754 for the
Cairn). A brass plate sits behind it: `rgba(11,14,22,.55)` fill + `--brass-stroke-ref`
1px stroke, rx3, at `groundline+18`, height 24, width `(name.length·11)+28`, centered on
the anchor x. The name comes from the GATE-ROOMS slab via `Gate.rooms.pick().name`
(`rooms.js:53-67`) — the room's display `room` field.

### 5.7 Glyph Stand fallback

For every room WITHOUT a bespoke rep (currently all but the Cairn), draw the **Glyph
Stand** (§4.2): a designed brass/stone plinth or easel, sized WITHIN the rep range
(§5.3), bottom-aligned to the ground line (§5.4), holding the room's `glyph` (from the
slab) in a framed slot, with the room's `accent` as a self-lit pip. Lit + palette-swapped
like everything else — never a bare floating emoji. `rooms.js` selects bespoke vs stand
via `R.hasBespoke(id)` / the `BESPOKE` registry (`rooms.js:28,69-72`).

### 5.8 Room-rep custom colors — the rep COLOR-SLOT contract

Reps need design colors the three fixed palettes can't anticipate (Stellar Forge wants
emissive blues; an Aquarium / Ripple Tank wants non-emissive blues; etc.). The fixed
roles (`cavern.maw`, `arcade.screen`, `window.lit`, …) cover reps that reuse canonical
estate colors, but a NEW rep brings its own. Because **exactly one rep renders at a
time**, we don't bake per-rep colors into the palettes — we give every rep a shared set
of generic SLOTS it overrides for the band currently being painted.

**The slots** (defined in `colormap.js`, §2.1 + §2.2):

| slot | kind | dims with B? | dayRecede? | default | typical use |
|---|---|---|---|---|---|
| `rep.swatch1` / `rep.swatch2` / `rep.swatch3` | SWAPPABLE (palette) | yes | — | neutral stone-grey, per band | non-emissive design surfaces: pond/aquarium blues, armillary brass-greys, a hull, a foliage tone |
| `rep.glow1` / `rep.glow2` | EMISSIVE (GLOW) | no | yes | neutral teal | self-lit design accents: Stellar Forge blue, a caustic, a bioluminescence, a screen |

A draw fn references them exactly like any role, via the dash `-ref` alias (§2.4):
`fill="var(--rep-swatch1-ref, #6a7079)"`, `fill="var(--rep-glow1-ref, #7fd4c0)"`.

**How a rep declares its colors.** Each bespoke rep (in `rooms.js`'s registry / the rep's
draw-fn module) exposes a small per-band override map keyed by the SAME role names — e.g.

```js
// in the rep's registry entry (rooms.js) — colors are AUTHORED hex per band
repColors: {
  DAY:   { 'rep.swatch1':'#bfe0dc', 'rep.glow1':'#6fd0ff' },
  DUSK:  { 'rep.swatch1':'#9fb4c2', 'rep.glow1':'#6fd0ff' },
  NIGHT: { 'rep.swatch1':'#3a5560', 'rep.glow1':'#6fd0ff' }
}
```

**Per-band requirement (load-bearing).** A SWAPPABLE slot override (`rep.swatch*`) MUST
be authored for all three bands (DAY/DUSK/NIGHT), exactly like the main palette — it is
then dimmed by `B` at resolve-time, so it tracks time-of-day + weather + lightning like
every other surface. (If a rep supplies only one band, the foundry treats the missing
bands as that color and accepts a less-tuned look, but the contract is: author all three.)
An EMISSIVE slot override (`rep.glow*`) is a single palette-immune color (band-independent,
like every GLOW role); it may still vary by band if the rep wants, but one color is fine.

**The override mechanism (where it merges).** `colormap.resolve(band, B)` builds the
base var-map; the SELECTED rep's `repColors[band]` overrides are then merged on top,
with the SAME `dim(B)` applied to `rep.swatch*` and the SAME `dayRecede(B)` applied to
`rep.glow*`, BEFORE `S.applyResolved` writes the vars. Concretely (Phase C wiring): add a
`CM.resolve(band, B, repColors)` optional 3rd arg, or a `CM.applyRepColors(out, band, B,
repColors)` helper, that runs each override hex through `dim`/`dayRecede` and writes both
the dotted var and the dash `-ref` alias. The boot calls it after `resolve()` using
`Gate.rooms.pick().repColors` (and re-applies during a crossfade the same way the base
map is mirrored, `the-gate.src.html:872-884`). **An un-overridden rep (or the Glyph
Stand) just leaves the neutral defaults** — no special-casing.

**Foundry rule.** A rep take that needs custom colors MUST route them through these slots
(declare `repColors`, reference `--rep-*-ref` in the draw fn) — it must NOT hardcode hex
for a surface that should dim/recede, and must NOT add bespoke per-room roles to the
palettes (the slots are the shared, bounded channel). 3 swatches + 2 glows is the budget;
a rep needing more than that should be flagged to the orchestrator (likely a sign it
wants a fixed estate role instead, like `cavern.maw`).

### 5.9 Wind — a shared runtime param  *(BUILT — Phase D, 2026-06-23; foliage sway live)*

A single scene-wide **wind** state drives ambient sway across the frame. **Implemented** for the
foliage; reps that want to opt in still follow the rules below.

**As built:** `S.setWind(level)` / `S.windFromWeather(wx)` (storm = `strong`, else a light ambient
breeze) set the level; the boot's perpetual rAF calls `S.swayTick(now)` each frame, rotating every
registered foliage crown (`S._foliage`) about its pivot by a gusting, rightward-biased angle whose
amplitude eases toward the wind target (so a weather toggle ramps in). Trees pivot at the trunk top
(canopy sways, trunk + ground shadow stay rigid); bushes pivot at the ground line. Reduced-motion →
the boot never ticks sway (crowns stay upright); `?smil=<s>` pins the sway phase for reproducible
renders. Chose the **JS-driver** mechanism (b) over build-time SMIL (a) because weather toggles must
intensify the sway LIVE without a scene rebuild.

- **Levels:** `'none' | 'light' | 'strong'`. The SCENE chooses it (from the weather state — calm
  in `clear`, light in `cloudy`, strong in `storm` — and/or a little randomness); it is NOT a
  per-rep choice. Exposed once to draw fns (e.g. `S.wind`) and/or as a `--wind` scalar.
- **Direction convention (keep it simple):** wind ALWAYS blows to the **right** (+x). Levels scale
  amplitude/speed only, never direction. A draw fn never has to reason about wind direction.
- **Primary consumer:** the foliage (trees/bushes) sway — crowns lean/oscillate right by an
  amplitude set by the level (`none` = still). The hero gate, buildings, and water stay essentially
  still (heavy/rigid); wind is a grounds-and-flora effect.
- **Reps MAY opt in** to modulate their own animation by wind when it fits the subject (§2.5.5): a
  rep with a FLAG flutters harder + streams right in `strong`; a CHIMNEY's smoke drifts right; a
  weathervane points right; a windmill spins faster. A rep with no wind-sensitive element ignores
  it. Honor reduced-motion the same way (no wind sway when reduced).
- **Mechanism note (for the builder):** SMIL can't read a JS value mid-loop, so wind most naturally
  enters either (a) at BUILD time — the draw fn picks its `<animate>` amplitude/dur from `S.wind`
  when the scene is built/rebuilt — or (b) via a published `S.refs` handle a small JS driver nudges.
  Prefer (a) for ambient loops (rebuild on weather change), (b) only if continuous response is needed.

### 5.10 Weather-fx — clouds + rain + lightning  *(BUILT — Phase D, 2026-06-23)*

The atmosphere layer (`weather-fx.js` → `Gate.weatherfx`), driven by the boot's ONE perpetual rAF
(`Gate.weatherfx.draw(dt, nowMs)` each frame). A weather toggle ramps it LIVE. **Two surfaces by
design** (a deliberate split, not an accident):

- **Clouds → the SVG clouds layer** (`S.refs.clouds`, layer 3): drifting lumpy cumulus built from
  overlapping ellipses. Because the layer sits behind far-scenery, clouds obscure ONLY sky +
  sky-objects (layers 1–2) and pass BEHIND the buildings/gate. Tinted with the band-tracking
  `--mist-ref` var (so a recolor reflows them for free — **no palette role added**), plus a
  same-shape dark-slate belly that fades in for storm. Drift via a per-cloud JS `transform`
  (the sway technique), speed scaled by the live wind; seamless horizontal wrap.
- **Rain + lightning → the foreground `#fx` 2D canvas** (above everything): rain is a particle field
  of streaks that slant right tracking the LIVE wind (`S._windAmp`); intensity eases in/out on a
  weather change. Lightning paints a jagged bolt + fork + a full-canvas sky-glow AND pulses the
  boot's `flash` via an `onFlash` callback → `CM.B` spikes to `1.0` → the dark storm-night estate is
  **revealed for an instant while the lamps/windows still blaze** (the payoff, `colormap.js:7`).

**Weather → effect map:** `clear` = empty sky · `cloudy` = full cloud cover, no rain · `storm` =
dark heavy clouds + rain + occasional lightning (random 2.6–8s interval).

**Reduced motion (§2.5.5):** clouds still show (overcast still reads) but do NOT drift; NO rain and
NO lightning flashing (photosensitivity). Single source of truth = `Gate.sequence.prefersReducedMotion`,
passed to `WFX.init({reduced})`. **Dev:** `?flash` holds a strike lit (deterministic payoff shot).

> Still open (future polish, NOT built): rain splashes/ripples on the ground, birds/owls.

---

## 6. Freshness / enrollment

### 6.1 The reclaim room-slab contract

`the-gate/reclaim.mjs` re-pins the GATE-ROOMS data slab from the live front-door `PLACES`:

- imports `loadPlaces` from `../card-catalog/reclaim.mjs` (entry-module-guarded, so the
  import does NOT re-pin the card catalog).
- for each place, projects the fields **`{id, room, glyph, accent, district, href,
  locked}`** (`GATE_FIELDS`, `reclaim.mjs:40-47`).
- **SKIPS `locked:true`** entries (the undercroft is shown via a live ws: predicate, not
  as a room-rep).
- writes the JSON array (pretty-printed, stable field order) between the
  `<!-- GATE-ROOMS BEGIN -->` / `<!-- GATE-ROOMS END -->` sentinels in
  `the-gate.src.html`.
- **idempotent** — a 2nd run on an unchanged estate writes a byte-identical file.
- **REFUSES (nonzero exit, NO write)** on a short/broken parse: a grep floor over the
  front-door `PLACES` block (`< 50` `id:"` keys → refuse; recovered `< id-floor` →
  refuse; projected `< 50` → refuse) so a parse-miss FAILS loudly rather than shipping a
  short pool (`reclaim.mjs:49-81`).
- the page reads the slab via `getElementById('gate-rooms').textContent` → slice first
  `[` to last `]` → `JSON.parse` (`rooms.js:37-49`); degrades to `[]` on absent/garbled.

### 6.2 Forge enrollment — ZERO collate edits

`the-gate/` is a repo-root child, so `collate.sh` PHASE 1 auto-runs `the-gate/reclaim.mjs`
by convention, then PHASE 2 `forge --all` re-inlines the fresh slab + current
`ws.js`/`sky.js`/`hours.js` + every gate module into `the-gate.html` — same cycle. No
`collate.sh` edit is ever needed.

### 6.3 PINNED at build vs READ live at runtime

| Pinned into `the-gate.html` at build (forge time) | Read LIVE at runtime (never pinned) |
|---|---|
| the GATE-ROOMS slab (the room POOL + names/glyphs/accents) | which asterism is unlocked (`WS.store()` + `Sky.state`) — Phase D |
| the shared modules `ws.js`/`sky.js`/`hours.js` (re-inlined fresh) | undercroft-open (`store.has('ws:seen:undercroft-rune'\|'undercroft')`, `scene.js:585-592`) |
| every gate module (colormap/scene/…), incl. each rep's authored `repColors` (§5.8) | mute flag (`WS.muted()`, `audio.js`) |
| | the room pick from the pool (Phase D: random unlocked-or-any; greybox pins the Cairn) |
| | time-of-day band (local clock via `Hours`, unless `?t=`) + weather (seeded/`?wx=`) |
| | the SELECTED rep's `rep.swatch*`/`rep.glow*` overrides, merged into the resolved var-map per band (§5.8) — only the chosen rep's colors are written |

---

## 7. Dev override contract

URL params parsed by `Gate.sequence.parseUrl` (`sequence.js:45-66`) and consumed by the
boot (`the-gate.src.html:820-829`):

| Param | Effect (what it pins) |
|---|---|
| `?dev` or `?scene=idle` | boot STRAIGHT to idle revealed — no black, no fade; gates closed + interactive (`sequence.js:86-95`). |
| `?scene=open` | idle but gates already open (`Gate.scenegate.swing(1)`, no animation). |
| `?t=day\|dusk\|night` | pin the time band manually (skip the local-clock classifier). |
| `?moon=<0..1>` | pin moonK = illuminated fraction; drives BOTH the brightness `B` (night bandBase) AND the DRAWN moon phase (`scene.js:618-625`). |
| `?wx=clear\|cloudy\|storm` | pin the weather state → `weatherFactor`. |
| `?seed=<n>` | seed the weather RNG (deterministic weather). |
| `?undercroft=1` | FORCE the undercroft hatch visible for review only (`S.setDevUndercroft`, `scene.js:585-597`). Production stays earned-only via the store predicate; the flag does NOT change unlock logic. |
| `?room=<id>` | PIN which room's rep shows in the grounds slot (`S.setDevRoom`; `rooms.js R.pick`). A bespoke id (`physics-lab`, `ripple`, `sound-garden`, …) draws that rep; any other slab id falls back to the Glyph Stand; omit → the Cairn default. Foundry room-rep takes render with this pin (per-asset `extraQS`). |
| `?smil=<seconds>` | FREEZE the SVG animation clock and seek to a fixed phase (`svg.pauseAnimations(); setCurrentTime(s)`, boot). For rendering/judging an **animated** asset (§2.5.5) at chosen points of its loop — headless `--virtual-time-budget` does NOT advance SMIL; `setCurrentTime` does. Omit to let animations run live. |

The foundry renders standalone previews AND swaps each take into the live blockout, then
screenshots via these pins across DAY/DUSK/NIGHT + a couple brightness levels (§8). For an
animated asset, also sample a few `?smil=` phases so the judges see the motion, not one
frozen frame.

---

## 8. The foundry contract

Each asset pass (PLAN §5): **fan-out K takes (K by tier, §4) → judge → synthesize →
build-final.** Each take is a self-contained draw fn to the §3 interface. A take is:

1. rendered STANDALONE (a minimal served page that builds just that asset over the scene
   skeleton + the resolved palette vars), AND
2. swapped into the live blockout (replace the asset's draw fn; rebuild via forge), AND
3. screenshotted across **DAY / DUSK / NIGHT** + a couple brightness levels (e.g.
   `night storm @moonK0.6 B=0.30` and `night clear @moonK1.0 B=0.80`) via the §7 dev pins,
   on a **SERVED ORIGIN** (`python3 -m http.server`, unique port — NEVER `file://`; ws:
   reads + unlocks only work served, RECON Verify).

**Judged on:** estate-idiom fidelity · beauty/craft · palette-swap correctness (recolors
right across all 3 bands?) · emissive correctness (lit parts pop at night, recede in day?)
· perspective/scale fit (stays in its §4 box, anchored right, lit from above?) · **thematic
animation** (does the subject suggest motion — and if so, does an ambient loop *deepen* the
read while staying quiet, seamless, lit-correct, and reduced-motion-safe per §2.5.5? a
static asset is fine when motion wouldn't serve it — judge whether the choice fits, not
merely whether it moves; evaluate animated assets ACROSS their loop via the `?smil=` pin) ·
perf (~60fps via `window.__gateFps`; clean console; zero network).

### 8.1 The ESTATE IDIOM the final art MUST adopt (PLAN §9 / RECON)

- **Brass = dark body + brass stroke + warm glow + top-edge highlight — NOT a flat fill
  or a gradient sheet.** Specifically: dark body `rgba(11,14,22,.85)`, brass stroke
  `var(--brass-stroke-ref, #c9a24a)` ~1.4px, a warm glow (`drop-shadow 0 0 8px
  rgba(201,162,74,.4)` or the shared `#glow-soft` feather), brass-bright top-edge
  highlights `var(--brass-bright-ref, #f0d489)`. A gradient material is WRONG.
- **Paper-grain + candle-glow** filters in the estate idiom so night is never flat black
  and manor windows read as candlelight (RECON: `index.src.html:563-591`). Final art may
  add these as its own (non-color-tinting) SVG filters.
- **Fresh hand-drawn FRONT-ELEVATIONS.** The estate's `draw*` helpers are TOP-DOWN
  floorplans — REFERENCE ONLY, never drop-in. Every building is a new front-elevation.
- **Exact house tokens:** `--bg #080a0f`, `--ink #eaf0fa`, `--brass #c9a24a`,
  `--brass-bright #f0d489`, Georgia-serif / ui-monospace stacks (`the-gate.src.html:8-13`,
  verbatim from `index.src.html:8-20`). The **Georgia-serif wordmark IS the logo** — no
  image logo anywhere (the plaque + the welcome card use the wordmark).
- **Restraint** (PLAN §9): sparse, considered; the scene reads as a single illustrated
  frame, not a sticker sheet. One unified brightness moves time + weather + lightning
  together.

---

## 9. Phase-D / open items (NOT covered by this spec; finalized later)

This spec covers the STATIC composition + the palette/lighting/draw-fn/freshness/dev
contracts. The following are finalized in Phase D and get only a "beauty pass" note here:

- **weather-fx** — ✅ BUILT 2026-06-23 (§5.10): drifting clouds (SVG clouds layer, behind buildings),
  wind-slanted rain + lightning bloom (spikes `B→1.0`) on the `#fx` canvas, tree sway (§5.9).
  Still future polish: rain splashes/ripples on the ground, birds/owls.
- **audio** — the WebAudio engine (gears/creak/ambient bed) gated on the opening click +
  `WS.muted()`; `audio.js` is stubbed, the mute chip is wired.
- **real moon-phase wiring** — `sky-core.mjs` (forked geocentric sun-lon math, J2000 Node
  twin) → `S.setMoonPhase({illuminatedFraction, litSide})` → `drawMoon` so the drawn phase
  matches the user's real date (`scene.js:627-636`). The moon/sun also get a beauty pass.
- **earned-asterism runtime pick** — replace `asterism.js`'s PLACEHOLDER with a random
  UNLOCKED Survey-of-Heaven constellation (`Sky.state`/`WS.store`); cold-start = stars, no
  figure. The asterism gets a beauty pass.
- **the click-through cinematic + welcome card** — gears 2.5s → swing 2.5s → fade 2s →
  welcome hold 3s → navigate; reduced-motion collapse; `WS.seen('the-gate')`. Timings
  live in `sequence.js`; the welcome card markup is in the boot HTML.
- **gate open-state choreography** — how the gears/plaque/gnomon ride or fade as the
  leaves swing (the gear-train is a child of the assembly, NOT the leaves, so it does NOT
  travel with the swing; the plaque + gnomon currently stay put). The foundry's gate art
  must keep the swing reading correctly (leaves foreshorten via `scaleX`, §3.3); the
  precise ride/fade of the seam furniture during the open is a Phase-D polish call.
- **room-rep slot conflict** — NONE flagged (§5.5 passes). If a future foundry rep or
  fattened tree breaks the x152..308 / y492..720 envelope, raise it then.

---

*Locked Phase B from blockout HEAD `689e3cb`. viewBox 1600×900. Cairn footprint x191..269
/ y623..737 (w78 h114); room-rep range width 78..156 × height 114..228; the 2× max fits
the slot (x152..308 / y492..720) cleanly. Room-reps bring custom colors via shared slots
`rep.swatch1..3` (swappable) + `rep.glow1..2` (emissive) — §5.8.*
