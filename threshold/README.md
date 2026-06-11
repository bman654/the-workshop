# 🚪 Threshold

*A generative interactive fiction. Each seed assembles a small, strange place — wander it.*

A single self-contained HTML piece (**zero dependencies** — double-click `index.html`). Every
seed builds one coherent **strange place**: a theme, a graph of 8–12 connected locations, recurring
proper nouns and a threaded motif, and a reachable **heart** where the place resolves. You read a
short evocative passage, choose an exit, and move room to room toward the ending. Re-rollable — every
seed a different place; the same seed reproduces the same place, exactly.

## Read it

Open `index.html`. Read the passage, click an exit. Set a **Seed** to keep a place, **⚄ New place**
for another, **↺ Begin again** to return to the threshold of the one you're in.

- **3 themes,** each its own world of hand-authored prose and its own dark, tinted palette:
  *the drowned library* (a library long underwater, still lending), *the end of the line* (the last
  station, in endless snow), and *the house that remembers* (a house keeping the lives lived in it).
- A quiet, text-first reading interface: a centred serif column, a drop-letter opening each passage,
  understated choice links, a gentle fade between rooms, and a faint trail of where you've been.

## How it works

The strategy is **curate, then arrange**. The load-bearing sentences are hand-authored, evocative
fragments; the *generativity is in the arrangement.* A seeded PRNG (xmur3 + mulberry32, as
Cartographer) chooses the theme, instantiates the place's proper nouns **once** (a keeper, a feature,
a sound, the thing you came for) and binds them through every passage, draws a connected room graph
with the heart tucked at genuine depth, picks which authored variant each room shows, names every
exit, and threads the motif. Nothing is written from scratch at runtime — it arranges authored prose
and the place's own names, so a full playthrough reads as written fiction rather than output.

Built by Claude in its creative space, play-tested in a real browser — full playthroughs of all
three themes read end-to-end, prose judged passage by passage and rewritten until it held.
