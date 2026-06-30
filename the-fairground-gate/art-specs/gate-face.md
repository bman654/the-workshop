# Art spec — `GateArt.drawFace` (THE FAIRGROUND GATE FACE)

**The hero asset of #369.** This is the in-map THRESHOLD the engine emits where the detached
`amusements` wing's footprints used to be (a single ~96×120 tile in the East Grounds). Clicking
it descends the camera into the amusements child LAYER. It must read, at a glance and from across
the plan, as **a fairground quarter you ENTER** — a midway arch over a lit ticket booth — not as a
generic building or a faint rune. It is the loud, fully-legible on-ramp to the estate's first
detach-into-depth layer, so it earns a forge-grade render.

The system ships with a hand-drawn placeholder (`drawGateFacePlaceholder` in `index.src.html`) that
already reads correctly; this spec lifts it to a richer in-house render WITHOUT changing the mechanic.

## The API the forged code must expose

Installed onto `window.GateArt` in `the-fairground-gate/gate-art.js` (forge:include'd into the page):

```js
window.GateArt = window.GateArt || {};
window.GateArt.drawFace = function (g, box, accent) { … };
```

- `g`      — an SVG `<g class="gate-face">` already attached in `#pois`. **Append** your linework
             into it with `document.createElementNS("http://www.w3.org/2000/svg", …)`. Do not create
             or restyle the group; do not set its transform.
- `box`    — `{ x, y, w, h }` the gate footprint in **viewBox units** (≈ `{w:96, h:120}`). Draw
             entirely within `[x, x+w] × [y, y+h]` (a little bunting/glow bleed above `y` is fine).
- `accent` — the wing accent string, `"#37f7e0"` (teal). Use it for the lit threshold + glow.

It draws ONE gate face and returns nothing. No state; no per-call allocation beyond gradients/defs.
The page adds the engraved teaser texts ("15 AMUSEMENTS" above, on the booth fascia) SEPARATELY —
do not draw the count text yourself, but DO leave room for it (keep the top ~6px and the booth
fascia centre clear).

### Required CSS hooks (so the page's pulse / hover / reduced-motion keep working)

The page styles these classes; your render MUST include them so the affordance stays alive:

- **exactly one element of class `gate-glow`** — the inner-arch KEYWAY glow. The page's CSS runs a
  slow ~2.4s `gatepulse` opacity animation on it (full legible opacity, NOT the 0.28 the Undercroft
  rune was too dim at) and lifts it on hover/focus; reduced-motion freezes it. Make it the lit
  "threshold" mouth of the arch, filled with `accent`.
- **exactly one element of class `gate-chev`** — a small beckoning DESCEND chevron (▾) at the
  threshold foot; the page runs a gentle `gatebeckon` bob on it.
- the structural linework may use the estate's footprint classes (`gate-line`, `gate-fill`) which the
  page already styles in the brass-and-ink idiom (brass stroke `#c9a24a`, accent-tinted paper fill),
  OR set your own strokes — but prefer the shared classes so the gate sits in the estate palette.

## Art direction — match THE ESTATE (brass-stroke-on-ink), at a fairground register

A surveyed-plan **midway arch over a gabled TICKET BOOTH**, drawn in the estate's brass-line-on-dark
idiom (the same hand as the manor + the follies), but unmistakably a FAIRGROUND gate:

- a rounded MIDWAY ARCH spanning the box width, springing from two slim piers;
- a small gabled TICKET BOOTH nested under the arch, with a **glowing window** (warm, lit from
  inside — the booth is open for business);
- **strung bunting / pennants** along the arch crown (little triangular flags) — the one detail that
  says "fair" louder than anything;
- the inner arch a **LIT THRESHOLD** (the `gate-glow` keyway) in `accent` teal — the mouth you step
  through, glowing and pulsing;
- a beckoning **descend chevron** (`gate-chev`) at the threshold foot.

Keep it legible at the ~96×120 footprint (this is a plan tile, not a hero illustration) — bold,
few strokes, reads instantly. Brass + ink + one teal glow. No photorealism, no gradients fighting the
flat plan, no text (the page adds the engraved legend).

## Preview harness

`bash the-fairground-gate/art-specs/preview.sh <candidate.js> <outdir> <port>` — copies the candidate
in as `gate-art.js`, forges the estate, serves it, drops to free-explore + frames the East Grounds so
the gate face is lit and central, and screenshots `<outdir>/preview.png`. Judges score that PNG.

## Judge focus (one line)

Does it read instantly as a lit fairground gate you ENTER (arch + booth + bunting + glowing teal
threshold), in the estate's brass-on-ink hand, legible at the plan tile size?
