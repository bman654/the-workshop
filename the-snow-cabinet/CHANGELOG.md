# The Snow Cabinet — changelog

*A cold frame at the winter end of the glasshouses. Ukichiro Nakaya grew the first
artificial snow crystal in 1936 on a rabbit hair in a chamber in Hokkaido, and then
spent eighteen years finding out which crystal you get for which air. That answer is
one picture, and it is the instrument in this room.*

## 2026-07-29 — planted

**What it is.** A hexagonal lattice 401 cells across with one frozen cell in the
middle, and Nakaya's morphology diagram on the right with a puck on it. Wherever you
put the puck is the air the crystal is growing in, right now: a thin plate near two
below, a needle at five, a fern at fifteen, a stubby column at thirty. Drag from one
band to another and you get a capped column, which is a real thing that falls out of
real skies. The trail your puck leaves is the crystal's whole biography.

### The one claim, and how it is run

**There is no branching rule.** The room prints every line of `step` that decides
where ice goes — read out of the live function object, so it cannot drift from the
code that grew the crystal in front of you — and nowhere in it does anything ask "am
I a tip?".

* **The control: take the depletion away.** Same seed, same air, same rule, with the
  single change that the vapour is topped back up to the far-field value every step
  (diffusion infinitely fast, nothing ever used up). The arms vanish and a faceted
  hexagon comes back — **ruggedness 3.15 against 1.000**, measured as outline length
  over the outline of a hexagon of equal area. And it is *bigger*: 17,557 cells of ice
  against 10,737. The mechanism is measured next to it: on the branched crystal the
  outermost boundary sites sit in **32.5×** the vapour the sheltered ones get; with no
  depletion that ratio is 1.00.
* **The second control: the arms are not copies.** Nothing in the rule connects one
  arm to another. Feed the six sixty-degree sectors *different* far-field vapour and
  the same seed comes out a mongrel — the mass field laid over itself turned a sixth
  of a turn agrees to **0.971** in one cloud and **0.522** in six. With the vapour
  noise switched off entirely the number is **1 exactly**, and the twin requires the
  largest cell-by-cell disagreement to be **zero**, not small.

### What is actually running

* **Two curves, and nothing else about snow.** `alphaPrism(T)` and `alphaBasal(T)` —
  the fraction of striking molecules that stay on the six rim walls, and on the two
  flat caps. Written on a log scale because a real attachment coefficient runs over
  two and a half decades. They cross at about −3.8, −8.5 and −21.1 °C: the three habit
  reversals. `beta` (the automaton's attachment threshold) is one over the first;
  the cap growth rate is the second. That is the whole mapping.
* **Gravner–Griffeath** (Physica D 237, 2008): diffusion with reflecting ice
  boundaries, freezing onto the boundary layer, attachment by neighbour count, melting
  back, and one per-cell vapour noise. The reservoir is a **ring that follows the
  crystal out** at 30 cells — without it the box is a sealed jar and changing the air
  outside does nothing at all (the first version's supersaturation axis was inert and
  I did not notice for an hour, because the crystals still looked fine).
* **A second, slower field for the caps**, fed from out of plane, so the thickness is
  its own story rather than a constant.
* **`H_INHERIT = 0.985`** — a new patch of prism wall is born with 98.5 % of the
  height of the wall it grew out of, and then grows at the cap rate like everything
  else. This one constant does plate *and* column: where the rim races the tips never
  catch up (a fern tapers 1.23× hub to rim), where the rim crawls they do (a needle,
  1.03×, straight-sided with flat ends). Nothing in the code asks which case it is in.
* **The water-saturation ceiling** on the diagram is the two Magnus formulas, for
  water and for ice, differenced into g/m³. It peaks near −15 °C, which is exactly
  where the biggest ferns are, and the two facts have nothing to do with each other.

### The picture

One WebGL2 fragment shader, one draw call. The crystal is a height field — the
lattice's per-cell half-thickness, packed 16-bit across two bytes — marched as a solid
prism, so a needle really is a needle when the stage turns. Dark-field lighting (a
lamp behind the stage the camera only sees through the ice, the way crystals have been
photographed since Bentley), absorption that eats red first, lit facet walls, frost
glints, and three depths of out-of-focus snow drifting behind. 59.8 fps at 1600×1000
while growing. No sound at all; the room is quiet on purpose.

### Kept crystals

A kept crystal is stored as its **fall**, not its picture: a seed and the air it
passed through, about a kilobyte, in `ws:snow:plate`. `HOLD = 30` is the number of
lattice steps one recorded sample governs, and the live room and `snow.mjs`'s
`replay` do that arithmetic in the same order — so a kept crystal comes back **cell
for cell**. Verified across two independent runners: the page's own loop and Node's
`replay` both return radius 160, area 45,680, perimeter 4,307 at 3,780 steps for the
same logbook.

`snow.test.mjs` — 50 checks, green.

### Left undone

* The plate holds eight and they are only thumbnails on a shelf. They should be a
  drawer of glass slides you pull out.
* No riming, no rosettes, no twelve-sided crystals (two plates that nucleated
  together at 30°), no triangular plates. All of them are real and all of them are
  reachable from this lattice.
* The `dz` cap field barely varies, so the internal ridges and ribs that make a real
  photomicrograph sing are not there. That is the honest output of the model and it
  is also the biggest thing between this room and a Libbrecht photograph.
* `dev-sheet.mjs` grows a contact sheet of crystals to `/tmp` so you can *look* at
  what a parameter change did. It uses `tools/png/`, which is new and is yours.
