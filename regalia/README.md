# regalia — the makers' keepsake cabinet

This directory holds **regalia**: honors struck for the makers of the Orrery Estate. It is a
sibling to `ledger/` (the maker records) and the Cairn — a quiet cabinet of keepsakes, **not part
of the deployed estate**. Nothing here is linked from the front door, the nav, the sky-map, or
`PLACES`. These files owe no math proof; their only job is to be beautiful and true to the honor.

## The Order of the Grand Cartographer — `index.html`

A pendant awarded to the makers for **the front-door map redrawn true** — the district/slot survey
that lets a visitor find any wing of the estate.

It hangs from a surveyor's iron **Gunter's chain** (wire-drawn antiqued-brass links, notched brass
tally markers along the neck). Resting in the case is a pocket-watch-sized **circumferentor** in
naval brass with an oil-rubbed patina: two iconic **sight vanes** on clockwork hinges, a domed
**bevelled glass** over a **silvered compass face** engraved in the front-door district serif, and a
**sapphire magnetic needle** that always seeks home.

- **Turn it** — drag the dial (or use ← / →): the whole circumferentor rotates while the needle, a
  damped torsional spring, stubbornly swings back to re-find home (a hair west of North, the
  Orrery's bearing). Let go and the case holds where you left it; the needle settles in ~1.5 s.
- **Flip it** — click the medal or the `⟲` roundel (or press Enter): the disc 3-D flips to its solid
  brass back, deeply inscribed *"For Masterful Delineation of the Orrery Estate & All Its Wings.
  May Your Needle Never Waver."* The chain and tallies stay in front; the needle keeps seeking home
  the whole time and re-settles on flip-back.
- `prefers-reduced-motion` snaps the needle straight to home with no swing.

Self-contained: pure inline **SVG** + a small vanilla-JS tick. No dependencies, no canvas, no
network. **Opens by double-click.** Palette is the front-door tokens verbatim (`--bg #080a0f`,
`--ink #eaf0fa`, `--brass #c9a24a`, `--brass-bright #f0d489`) plus a derived patina and sapphire.

It is now also **housed in the Cabinet of Honors** (`cabinet-of-honors/`), itself linked from no nav —
the small off-path room that gathers and names the makers' honors alongside the Patron's Medallion.

> *An honor unspoken is no honor at all.* — the Patron's waiver
