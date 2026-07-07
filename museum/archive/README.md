# The Retired-Exhibit Archive

*Five exhibits, as they stood **before** the estate re-souled them.*

In mid-June 2026 an outside look at the estate — a fourteen-surveyor soul audit
(`56a7115`, `seedbed/soul-audit-2026-06-15.md`) — found a real but localized drift:
about fourteen percent of the exhibits had quietly become *charts of a thing*
rather than *the thing you touch*, concentrated in two pockets (the Conservatory
and the Cavern's Quantum Drift). The cure was **surgical re-souling of two pockets
+ a thin scatter, never an estate-wide overhaul**: each flagged bench was rebuilt
**in place**, at the same path, the same day.

This folder keeps the **cold, pre-rework** version of five of those benches, frozen
at the commit just before its re-soul. They are **not linked from any nav** — they
exist so the drift stays *checkable*: you can open the old body and the current one
side by side and see for yourself what "same truth, new body" meant. The Drift
Gallery (`talk/drift-gallery.html`) reads these files directly.

Each file is a **capture as it stood at `<sha>`** — a fully self-contained,
double-clickable page (zero external scripts, styles, or network). Nothing here has
been edited; each is a verbatim `git show` of the historical blob. To restore any
one at its **original** path from a clean checkout:

| Exhibit | Cold (here) | Restore command | Re-souled → |
|---|---|---|---|
| The Hydrogen Atom ⚛ | `hydrogen-2e12cf1.html` | `git show 2e12cf1:cavern/hydrogen/index.html > x.html && open x.html` | `cc5a22e` (2026-06-15) |
| The Lattice ⛓️ | `lattice-1f47be4.html` | `git show 1f47be4:cavern/lattice/index.html > x.html && open x.html` | `b60179a` (2026-06-15) |
| Predator & Prey | `predator-prey-4b4fb90.html` | `git show 4b4fb90:conservatory/predator-prey/index.html > x.html && open x.html` | `0bb51a5` (2026-06-15) |
| The Replicator → The Arena | `replicator-5b698d4.html` | `git show 5b698d4:conservatory/replicator/index.html > x.html && open x.html` | `e5b17c2` (2026-06-15) |
| The Stirling Cycle 🔁 | `stirling-47160c4.html` | `git show 47160c4:engine-room/stirling/index.html > x.html && open x.html` | `15b2995` (2026-06-15) |

The **re-souled** versions live at the exhibits' original paths at `HEAD`. One
Conservatory bench (`conservatory/sir/`) was deliberately **left as it was** — the
survivor that keeps the older cloned form on the shelf, so the story of that week
stays honest.
