# The Gate — Asset & Scene Spec  *(STUB — locked in Phase B)*

> **The asset spec is LOCKED in Phase B from the APPROVED blockout.** This file is
> a skeleton. Phase A (this scaffold) deliberately ships ROUGH greybox art so the
> spec is DERIVED from an aesthetically-approved scene, never guessed up front
> (PLAN §8). Do not treat any number here as final until Phase B fills it in.

Plan-of-record: `ideas/the-gate/PLAN.md` · reuse anchors: `ideas/the-gate/RECON.md`
· vision: `ideas/the-gate/description.md` + `example-rendering.png`.

---

## 0. Status

- **Phase A (scaffold + greybox)** — DONE: machinery end-to-end, lighting system
  real, composition roughed in, dev URL override live. See `CHANGELOG.md`.
- **Phase B (lock the spec)** — PENDING Keystone's composition/palette refinement.
- **Phase C (asset foundry)** — PENDING the locked spec.
- **Phase D (parametric systems + cinematic)** — partially prototyped in A; the
  real moon math (`sky-core.mjs`, owned by another agent), earned asterism, FX
  canvas, audio engine, and gnomon cast-shadow finalize here.

---

## 1. Palette tokens  *(TO FILL from the approved blockout)*

Three hand-authored palettes live in `colormap.js` → `PALETTES.{DAY,DUSK,NIGHT}`,
each a map of named ROLES. The emissive set is `GLOW`. Phase B pastes the final
hex tables here (all 3 bands) once values are approved in-scene.

Current role list (authoritative — assets reference `var(--<role>-ref)` in SVG):

```
sky.top  sky.horizon  manor.wall  manor.roof  manor.trim
observatory.dome  observatory.body  greenhouse.frame  greenhouse.glass
gate.iron  brass.stroke  brass.bright  grass  road  hill
tree.foliage  tree.trunk  stone  mist
GLOW: lamp.flame  window.lit  moon.disc  sun.disc  asterism.star
      asterism.line  cavern.maw  undercroft.glow  arcade.screen
```

> **CSS-var aliasing note (load-bearing):** colormap writes the canonical DOTTED
> vars (`--sky.top`) AND a DASH alias (`--sky-top-ref`) onto the scene root. SVG
> attributes reference the dash alias (dots are awkward inside `var()` in attrs).
> `Gate.scene.dashName(role)` + `S.applyResolved()` keep both in lockstep. Assets
> MUST use the `-ref` alias form.

---

## 2. The brightness model  *(validated in A; numbers may tune in B)*

`B = bandBase × weatherFactor`, spiked to `1.0` on a lightning flash.
- bandBase: day `1.0` · dusk `0.6` · night `0.30 + 0.50·moonK` (moonK = illuminated
  fraction 0..1; greybox default `0.6`).
- weatherFactor: clear `1.0` · cloudy `0.85` · storm `0.5`.
- Swappable roles are luminance-scaled by B (HSL-lightness, light desaturation as
  it darkens). Emissive GLOW roles are written at full intensity (lamp/window/maw
  recede slightly in bright day, never below 0.6; moon/sun/asterism stay strong).
- We do NOT use `Hours.brightness` (floors at 6% — the rejected look).

---

## 3. Per-asset contract  *(TO FILL — bbox / anchor / scale / perspective)*

Derived from the approved blockout. For each asset: bounding box (in the 1600×900
viewBox), anchor point, scale, perspective/orientation, palette roles + emissive
parts used, lighting (top-edge highlight direction), and the draw-fn interface.

Greybox boxes currently in code (Phase B confirms/repositions):

| asset | module | rough box (viewBox 1600×900) |
|---|---|---|
| sky gradient | scene.js | full bleed |
| moon / sun | scene.js | disc ~ (1180,175) r64, above the manor |
| asterism (placeholder) | scene.js + asterism.js | ~ (820,120) 250-wide, left of disc |
| observatory + hill | scene-buildings.js | hill x −40..540; tower ~ (210,360) |
| manor | scene-buildings.js | block ~ (970..1270, 340..470) + tower + wings |
| greenhouse | scene-buildings.js | ~ (1380..1560, 380..470) |
| grounds / road | scene.js | ground from y≈470; road gate-center → manor |
| trees / bushes | scene.js | scattered placeholders (sway = Phase D) |
| cairn room-rep | scene.js | ~ (230,720) stack + label plate |
| undercroft hatch | scene.js | ~ (1340,800), predicate-gated (placeholder) |
| gate leaves + gears + gnomon + plaque | scene-gate.js | opening x600..1000, seam x800, runs off bottom |

---

## 4. Draw-fn interface  *(TO FORMALIZE in B)*

Each asset draw fn takes `(parent <g>, S)` where `S = Gate.scene` (exposes `el`,
`group`, `NS`, `VB_W/H`, `refs`, `dashName`). Palette-swappable shapes set
fill/stroke to `var(--<role>-ref, <fallback>)`. Emissive parts use the GLOW
`-ref` aliases. Top-edge highlights use `--brass-bright-ref`.

The gate publishes animation refs: `S.refs.leftLeaf`, `S.refs.rightLeaf` (hinge
pivots set via `transform-box:fill-box` + `transform-origin`), `S.refs.gears`,
`S.refs.gnomon`. `Gate.scenegate.swing(0..1, S)` and `.spinGears(turns, S)` drive
the sequence.

---

## 5. Enrollment / freshness  *(codified — works now)*

- `the-gate/reclaim.mjs` imports `loadPlaces` from `card-catalog/reclaim.mjs`,
  projects `{id,room,glyph,accent,district,href,locked}`, skips locked, writes the
  GATE-ROOMS slab between sentinels. Idempotent; REFUSES on a short parse.
- `collate.sh` PHASE 1 auto-runs it (repo-root child); PHASE 2 `forge --all`
  re-inlines `ws.js/sky.js/hours.js` + the fresh slab into `the-gate.html`.
- Build by hand: `node tools/forge/forge.mjs the-gate/the-gate.src.html`.
- The page reads the slab via `getElementById('gate-rooms').textContent` → JSON.parse.

---

## 6. Documented exceptions / TODOs carried forward

- `sky-core.mjs` / `sky-core.test.mjs` are NOT in this scaffold — the moon math is
  owned by a separate agent (PLAN §6 fork: geocentric sun-lon directly, J2000 Node
  twin). The greybox moon is a lit disc with a crude terminator + `moonK` stash.
- `asterism.js` draws a neutral PLACEHOLDER (not the eagle — earned-only). Phase D
  swaps in the runtime pick from unlocked Survey-of-Heaven wings (via Sky + WS).
- `weather-fx.js` (the FX canvas) is not yet authored; the canvas + the one rAF
  loop exist and idle. Phase D adds rain/lightning/clouds/birds/sway.
- `audio.js` engine is stubbed (mute chip wired to WS for real). Phase D adds the
  WebAudio sources (gears/creak/ambient) gated on the opening click + `WS.muted()`.
- `rooms.js` only has the Cairn rep. Phase C adds 3 essence-survey reps + the Glyph
  Stand for every other room (no bare floating glyphs).
