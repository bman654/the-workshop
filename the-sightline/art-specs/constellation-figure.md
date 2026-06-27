# Foundry spec — `constellation-figure` (visual-exhibit)

**Asset:** the engraved constellation figure — the ignited star glyphs + the gold
connecting stroke that draws "Argo, the little ship" as slabs peel.
**Medium:** visual-exhibit (canvas 2D draw code, JS).
**Live module / call site:** `the-sightline/index.src.html`, the function `drawFigureOverlay()`
between `// <<SIGHTLINE-ART:figure>>` … `// <<END SIGHTLINE-ART:figure>>`. The winner REPLACES
that block; re-run forge.

## Art direction (the payoff — a constellation kindling in a dark vault sky)
The figure assembles at FIXED firmament sockets high in the dark (it must NOT migrate with
the slab stack). Wanted, over the current plain stroke + 4-point twinkles:
- **engraved star glyphs** at each ignited socket — a finely-cut star (small radiant burst /
  incised compass-star), warm gold (`#ffe9b8` / `#ffd98a`), with a soft ignition halo;
- a **gold connecting stroke** drawn in IGNITION order through the lit sockets — a single
  clean engraved gold line (subtle taper / inked-quill quality), like an old celestial chart;
- a sense of **ship**: as the 12th star lights, the closed figure should read as a little
  ship (mast, sail, hull) — lean into the socket layout already in `FIGURE`;
- the **scramble bad-stroke**: when `badStroke` is set and `scrambleFlash>0`, a jarring red
  dashed stroke leaping to the wrong star (a visible TANGLE) — make the wrongness FELT;
- the **won closure** (`won` true, `bright` easing 0→1): the whole figure blazes — the stroke
  thickens/glows, a soft constellation halo, a quiet completion bloom. This is the victory beat.
- unlit sockets are drawn separately (in the backdrop) as faint dots; here only draw LIT ones.

Match the vault palette (gold family on deep indigo). Greybox reference: current
`drawFigureOverlay`. Keep it readable at small scale (the figure sits in the upper band).

## EXACT API the candidate code must expose
```js
function drawFigureOverlay(){ … }
```
- No args. Draws into the in-scope **`ctx`**.
- In-scope globals it MAY read:
  - `ignited` — array of star ranks lit so far, in ignition order (each is an index into `FIGURE`).
  - `FIGURE` — the 12 socket coords in figure-space `[x∈[-1,1], y∈[-1,1]]` (y up).
  - `figScreen(p) → [px,py]` — maps a `FIGURE[k]` socket to FIXED screen px (already framed;
    use it, do not invent your own placement — keeping the reveal centered is load-bearing).
  - `bright` (0→1 victory ease), `badStroke` (`[fromSocket, toSocket]` or null),
    `scrambleFlash` (frames remaining, >0 during a scramble), `won` (boolean).
- MUST NOT mutate game state; render-only.

## How it wires in + how the preview harness invokes it
- Wiring: paste the winner between the figure sentinels in `index.src.html`, re-forge.
- Preview harness: `bash the-sightline/art-specs/preview-harness.sh <candidate> <outdir> <port>`
  reassigns the global `window.drawFigureOverlay`, drives the camera to a near-complete reveal
  (most stars lit, the stroke well underway), and screenshots `<outdir>/preview.png`. The judge
  scores: do the engraved stars + gold stroke read as a beautiful celestial-chart constellation
  resolving into a little ship — and is the scramble tangle legibly wrong.

## Judge focus (one line)
Engraved gold star-glyphs + a clean connecting stroke that reads as a celestial-chart ship,
with a blazing won-closure and a legibly-wrong red scramble tangle.
