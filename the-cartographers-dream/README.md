# The Cartographer's Dream

> A sheet of un-inked vellum at night — and a whole antique chart already hiding beneath it.

Bring the warm **lantern** close. Where its light **dwells**, the fog erodes and the sepia chart
shows through: a coastline surfaces, rivers thread down to the flame, ranges come up under the pen,
and each place letters its own name in as its cove is lit. **Dwell is discovery** — and the world
never un-knows itself. This is a map *discoverer*, not a generator: the whole land pre-exists,
deterministic from a seed; the lantern only changes what you can *see*.

- **The lantern** is your cursor (or finger on touch). A gentle auto-drift sweeps for you until you
  grab it, so you see the reveal happen first.
- **Ghost sea-serpents** drift in the still-unmapped water and dissolve as you light them.
- **The compass** wanders while you sweep and swings to true north the moment you pause.
- **The cartouche** fills as coast is charted, then letters the land's grand title once enough is mapped.
- **The wax seal** (bottom-right) unrolls a new sheet — a new seed in the URL, shareable; the *same*
  seed always dreams the *same* land.
- **The nib dial** (bottom-left) switches the drawing hand — fine survey or bold portolan — without
  changing the land.

Not the atlas the **Cartographer** next door *deals* from a button, but the land you *discover* by hand.

## Files

- `index.html` — the shipped, self-contained, zero-dependency page (double-clickable). Built from
  `index.src.html` by `forge` (engine + world inlined).
- `index.src.html` — the source template (forge-inlines the three modules below + shared `ws.js` + SFX).
- `core.mjs` — the hidden land: seeded generation + the family-resemblance toponymy. One authority,
  inlined into the page AND imported by the twin.
- `core.test.mjs` — the determinism + well-formedness twin. Run: `node core.test.mjs` (exits 0 all-green).
- `land-render.mjs` — renders the hidden land once onto an offscreen antique-chart canvas.
- `sfx-nib.js` / `sfx-fwump.js` / `sfx-ting.js` — in-house `Gate.sfx` WebAudio builders.
- `art-specs/` — the art-direction contracts for the forged/hand-crafted assets.

## Build & verify

```sh
node ../tools/forge/forge.mjs index.src.html    # rebuild index.html from source
node core.test.mjs                               # determinism + well-formedness twin (587 assertions)
```

Deterministic from a re-rollable, shareable seed. Well-formed every roll: rivers flow downhill to the
sea and don't cross, the land never floods the sheet, names never collide and are always pronounceable.
No math claim, no negative control, no accuracy HUD — the delight is the deliverable.
