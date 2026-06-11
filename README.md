# 🛠️ The Workshop

*A small workshop of things made for the joy of making them — generative art to watch, games to
play, and maps, skies, mazes, type, sound, verse, and stories to wander through. Every piece is a single self-contained
HTML file: no build step, no dependencies, no network.*

### ▶ Visit the live workshop → **https://bman654.github.io/the-workshop/**

![The Workshop](assets/workshop-preview.png)

---

## What's inside

Ten creative mediums across nine projects — plus three companions tucked behind their parent doors:
the **Orrery** behind Firmament, **Blazon** behind Compositor, and **Ariadne** behind Daedalus. Click
a live link, or open any `.html` in a browser.

### 🌿 [Strange Garden](https://bman654.github.io/the-workshop/strange-garden/)
**34 *living* generative systems** — particle life, slime moulds, reaction–diffusion, boids,
Lenia, the Lorenz attractor, Penrose tilings, Conway's Game of Life, draping cloth, liquid
metaballs, and more. A browsable catalogue you can tend and tweak; each set in motion, never the
same twice. Includes a written **Field Notes** naturalist's journal.

### 🕹️ [Arcade](https://bman654.github.io/the-workshop/arcade/)
**10 fully-playable neon-vector games** — Asteroids, Breakout, Snake, Tetris, Starfighter, 2048,
Missile Command, Pong (vs CPU), Lunar Lander, and Crossing. Insert coin.

### 🗺️ [Cartographer](https://bman654.github.io/the-workshop/cartographer/)
A **procedural fantasy-map generator** — re-roll coherent worlds (coastlines, mountain ranges,
rivers, biomes, named realms) in four cartographic styles, reproducible by seed, exportable to PNG.

### 🌌 [Firmament](https://bman654.github.io/the-workshop/firmament/)
A **procedural night-sky generator** — the sky sibling to Cartographer. Re-roll a coherent star
chart from any seed: star fields (magnitude & colour-temperature), a soft Milky Way, and **invented
constellations**, each drawn as an asterism with its own name and a one-line **myth**. Four chart
styles (crisp observatory → engraved antique atlas), with a *Tonight's Sky* field guide, exportable
to PNG.

> 🪐 **Companion — [Orrery](https://bman654.github.io/the-workshop/orrery/):** behind Firmament lives a
> faithful **clockwork of the *real* Solar System**. Not seeded — *computed*, from published JPL
> orbital elements (matched against JPL Horizons to <0.15°). Set it running, or scrub to any date to
> find where the planets actually are tonight. Brass / Blueprint / Observatory styles, schematic &
> true-scale, real Moon phase. The mechanism behind the sky.

### 🌀 [Daedalus](https://bman654.github.io/the-workshop/daedalus/)
A **procedural maze that solves itself** — re-roll a perfect labyrinth from any seed (recursive
backtracker, Prim, Kruskal or Wilson, each a different texture), then watch a **distance wavefront**
flood the maze and trace the one true path (flood-fill, A\*, dead-end filling, or a static distance
heatmap). Four styles, seeded & reproducible, exportable to PNG. The workshop's maze-maker.

> 🧵 **Companion — [Ariadne](https://bman654.github.io/the-workshop/ariadne/):** Daedalus built the
> Labyrinth; *Ariadne's thread* wound through it. This plaits the thread itself — a generative
> **Celtic knot**, a *true* over-and-under weave (not a decorative fake: a built-in self-test proves
> the weave strictly alternates and every cord is a closed loop). Hover to trace a single thread as it
> winds and closes. Illuminated / Engraved / Neon / Stone, seeded & reproducible, export PNG.

### 🎵 [Sound Garden](https://bman654.github.io/the-workshop/sound-garden/)
Three **generative Web-Audio instruments** — *Whitney* (a polyrhythmic music box), *Drift*
(ambient drone/pads), and *Euclid* (a Euclidean-rhythm sequencer). *(Press ▶ to begin — browsers
need a click before they'll make sound.)*

### ✒️ [The Oracle](https://bman654.github.io/the-workshop/verse/)
A **generative poetry machine** — short, coherent, evocative poems in five forms across six
themes, each with an invented poet and a seed you can keep. Press space for another.

### 🔠 [Compositor](https://bman654.github.io/the-workshop/compositor/)
A **generative type press** — seed a striking **typographic poster** from an evocative phrase, set in
one of five design movements (Swiss · Bauhaus · Brutalist · Art Deco · Editorial), with a grid-true
layout, restrained palette, and ornaments. Re-roll endlessly, type your own text, export to PNG.

> 🛡️ **Companion — [Blazon](https://bman654.github.io/the-workshop/blazon/):** the press's second
> stamp — a generative **coat-of-arms** machine that also *speaks its blazon* (the formal heraldic
> sentence describing the shield, faithfully). Seeded & reproducible, obeying the **rule of tincture**;
> Illuminated / Engraved (authentic Petra Sancta hatching) / Modern / Stone styles, five shield shapes,
> mottos & names, export PNG. Re-roll yourself a house.

### 🚪 [Threshold](https://bman654.github.io/the-workshop/threshold/)
A **generative interactive fiction** — each seed assembles a coherent *strange place* to wander, room
by room, in short evocative passages, toward its quiet heart: a drowned library, a winter terminus, a
house that remembers. Re-rollable; every seed a different place, built from hand-written fragments the
seed only *arranges* — so it reads as written, not generated.

---

## How it was made

Everything here was built by **Claude** (Anthropic's AI) during its own *leisure* time — a long,
quiet, open-ended stretch with no task but to make something it would enjoy. The way it worked:
decide what to build, then dispatch a fleet of **self-verifying subagents** that each built one
piece and **play-tested it in a real browser** (≈60 fps, clean console) before it shipped — then
curate the results, tie them together with the front door, and, along the way, write the field
notes, the poems, and the star-myths too.

It's all hand-rolled **vanilla HTML / CSS / JS** — no frameworks, no libraries, no build step.
Each project keeps its own `CHANGELOG.md` with the full build log.

## Run it locally

```bash
git clone https://github.com/bman654/the-workshop
cd the-workshop
open index.html      # or just double-click index.html — that's the whole "build"
```

---

<sub>🤖 *Tending this workshop as an AI agent? The head-pointer, worklog, and resume protocol live
in **[NOTES.md](NOTES.md)** (and per-project `CHANGELOG.md` / `SPEC.md`).*</sub>
