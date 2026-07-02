# Art spec — `GateArt.childScenes` / `GateArt.drawChildScene` (THE ENGRAVED BROADSHEET FAIR)

**The hero deepen of #411.** The `amusements` wing detaches into the fairground child LAYER (#369);
descending the gate re-lays its 15 amusement tiles into an airy midway fan. Before this cycle each
tile was a bare emoji glyph on a plan slab. This installs a themed **brass-on-ink ENGRAVED VIGNETTE**
per amusement so the descended quarter reads as **a fairway you want to walk** — one illustrated
broadsheet — not a flat icon grid. Same hand as `drawFace`: `#c9a24a` brass strokes, `var(--c)`
accent-tinted paper fills, woodcut cross-hatch. Motion is **calm at rest**: a scene animates only
while its `.poi` is hovered / focused (or given the `.awake` test hook); `prefers-reduced-motion`
(mirrored by the `.fair-reduce` page/test toggle) holds the rich static frame with no rAF churn.

The system ships with an inline placeholder (`drawChildScenePlaceholder` in `index.src.html` = the
emoji-on-tile) so the page is fully testable + never blank WITHOUT the rich module — the same drop-in
guarantee `gate-art.js` gives `drawFace`. This spec documents the forged code that already lives in
`the-fairground-gate/gate-art.js`.

## The API (installed on `window.GateArt` in `the-fairground-gate/gate-art.js`)

```js
window.GateArt.childScenes = { "<poiId>": drawFn, …, "fp:<footprint>": drawFn };
window.GateArt.resolveScene   = function (poi) { … };               // the two-tier lookup
window.GateArt.drawChildScene = function (g, poi, box, accent) { … }; // the hook the child map calls
window.GateArt.drawEmojiTile  = function (g, poi, box, accent) { … }; // the module's own fallback
```

- **`childScenes`** — a registry of procedural draw fns keyed by **POI id**, PLUS **footprint-tier**
  fallback keys `fp:<footprint>` (e.g. `fp:pavilion`) so a future `detach:true` child inherits a
  scene by footprint even with no id entry. Every real amusement still gets FULL id coverage.
- **`resolveScene(poi)`** — the literal **two-tier** lookup: `childScenes[poi.id] ||
  childScenes['fp:'+poi.footprint] || null`.
- **`drawChildScene(g, poi, box, accent)`** — resolve the fn; on a HIT draw the engraved scene, flush
  its generated `@keyframes`, and return `{ kind:'scene', label, fn }`; on a MISS **or a THROWN scene**
  (try/catch), clear any partial art and call `drawEmojiTile` → `{ kind:'emoji' }`. **Never blank.**
  The `{kind}` return is the liveness twin's assertion handle (the page mirrors it onto the tile's
  `data-child-scene`). `g` is an SVG `<g class="child-scene">`; `box` is `{x,y,w,h}` in **viewBox
  units** — a NORMALIZED ~96×64 box centred on the tile (the descended fan affords ≈ a 66u row height;
  the crushed canonical footprint is NOT used, or the 5 smallest folded tiles render as ~18u specks);
  `accent` is the wing accent string (also available as `var(--c)` on the `.poi`).

### Required CSS hooks (styled by `index.src.html`, scoped under `.child-scene`)

`.eng` (brass stroke) · `.eng-fine` · `.eng-hatch` · `.eng-accent` (`var(--c)`) · `.fillp`
(`color-mix(var(--c) 13% paper)`) · `.fillp-ink` (`var(--paper)`) · `.child-kindle` · `.child-glyph`.
Brass hairlines carry `vector-effect:non-scaling-stroke` so the engraving stays crisp at any descended
tile size. **Motion:** an `.anim` group is `animation-play-state:paused` at rest and `running` under
`.poi:hover`, `.poi:focus-visible`, or `.poi.awake`; `@media (prefers-reduced-motion:reduce)` and
`html.fair-reduce` force it back to paused. Keyframes are generated in JS to MATCH the drawn geometry
and injected ONCE into a `<style data-gate-art-kf>` in `<head>` (unique names via a monotonic `_seq`).

### The motion technique (matches the geometry, calm at rest)

An OUTER group carries the SVG placement `transform` attribute; an INNER `.anim` group carries the CSS
animation, so a paused 0% frame == the drawn rest position. Spinners are bbox-symmetric (`padCenter`)
for true-hub rotation with `transform-box:fill-box; transform-origin:center`; orbiting figures start at
a per-instance phase so even paused they sit SPREAD around the ellipse. Emitters: `coasterKF`
(polyline follow, banked), `ellipseKF` (orbit), `spinKF`, `scrollKF`, `bobKF`, `swayKF`, `flowKF`
(marching dash-offset), `fallKF` (trickle+fade). Every scene AUTHORS ITS HERO SILHOUETTE to read at
the descended scale; the fine orbiting figures are a motion bonus, never load-bearing for the static read.

## The 15 scenes (id → vignette · hero silhouette · motion on attention)

Honour each amusement's real physics/theme at the fairground register:

1. **`midway`** → THE COASTER · a lattice trestle + humped rail · the car runs the whole rail.
2. **`spinning-chair`** → THE STAR-FLYER · a crowned pole + chairs flung out on chains (L = Iω) · chairs orbit.
3. **`the-top`** → THE FERRIS WHEEL · the wheel + level gondolas (Ω = mgr/Iω, won't fall) · wheel turns, gondolas stay level.
4. **`the-phantom-jam`** → THE BUMPER RING · a striped pavilion + a rink · cars circle.
5. **`warren`** → THE CROSSING · a checker-tile platform (▦) under an awning · a warden lantern paces a beat.
6. **`the-rolling-room`** → CONVECTION ROLLS · a letterbox cell, hot floor / cold ceiling, a comb of rolls (Ra_c) · rolls counter-rotate.
7. **`brazil-nut-box`** → THE SHAKER JAR · a brass-framed glass box of grains + the risen luminous nut · the jar shakes.
8. **`daedalus`** → THE MAZE PLATE · a head-on labyrinth + Ariadne's clew spool · the clew thread marches the solve path.
9. **`murmuration-meter`** → THE STARLING FLOCK · a bare roost tree + a murmuration cloud (φ = |Σv̂|/N) · the cloud wheels.
10. **`puzzle-pavilion`** → THE PUZZLE PAVILION · the pavilion shell + a hanging deduction board · the pearl-loop marches.
11. **`the-heap`** → THE ASSAYER'S TRAY · a side-on tray + a sand cone at its angle of repose (θ_r = atan μ) + a plumb protractor · a trickle cascades the face.
12. **`the-level-ride`** → THE LEVEL RIDE · a plank riding dead level over a tumbling Reuleaux triangle (constant width) · the Reuleaux rolls, the plank stays level.
13. **`the-shepherd`** → THE FOLD · a brass pen with a gate + a flock · sheep drift to the gate, a dog circles.
14. **`the-standing-stones`** → THE CROMLECH · a trilithon ring silhouette + a stray sheep (place, then release) · the sheep ambles.
15. **`arcade`** → THE CABINET · an upright coin-op + a lit marquee + a hero screen · a vector blip ricochets on the screen.

Plus the footprint-tier base **`fp:pavilion`** → a generic striped show-pavilion, so a future detached
pavilion-footprint child inherits a scene by footprint.

## The payoff-liveness twin (claim-free ≠ verification-free)

This layer makes no theorem — but it has a PAYOFF (a scene that KINDLES on attention), so
`window.__fairgroundLiveness()` (auto-runs once, rAF-deferred, into `window.__fairgroundLiveness.result`
+ the console) drives the piece's OWN real entry — `GateArt.drawChildScene` + the real `.awake`
class + the real `.fair-reduce` reduced-motion mirror — never a synthetic canvas pointer event. It
asserts: (a) all 15 amusement ids render a registered scene (read off the built tiles' `data-child-scene`);
(b) waking a sample tile flips its computed `animation-play-state` to `running` AND mutates the scene
(the coaster car advances along its rail) — the payoff FIRES; (c) reduced-motion holds the static frame
with no loop; (d) an un-registered id AND a throwing scene both fall back to the emoji tile, never blank.
