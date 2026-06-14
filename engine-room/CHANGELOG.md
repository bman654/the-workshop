# The Engine Room — CHANGELOG

A front-door **WING** for thermodynamics — the estate models light, motion,
quantum, relativity, waves, number, information… but until now **never heat**.
The power house at the working edge of the grounds, where heat is turned into
work and the great flywheel never gives back quite all you put in.

## v1 (2026-06-14) — the wing opens, with its first bench

**The native metaphor (form expresses content).** A **MILL HOUSE you OPERATE**:
one great flywheel on a horizontal **line-shaft** (a slow CSS `@keyframes` spin,
disabled under `prefers-reduced-motion`), benches hung off it as **BAYS belted to
the shaft**. Named "The Engine Room" (not "The Forge").

**Palette = the physics.** Warm coal-black ground (`--bg #0b0908`), brass accent
(`--brass #d9a441`), and the hot/cold axis `--firebox #e8703a` (T_h, Q_h) +
`--condenser #5fa8d3` (T_c, Q_c). Texture: a **riveted iron-plate overlay** (not
the cave's rough rock). Firebox-glow radial hero; brass gradient-text title; a
hot-orange **"Hot surfaces · mind the firebox"** stamp (the T_h establishing
mark) in place of the Cavern's red danger stamp.

**The bays.**
- **The Heat Engines** (working bay, firebox-accented) — ONE live bench at launch:
  **The Carnot Engine** (`carnot/`), with a green proof pill "self-test 11/11 ✓".
- **The Shop Floor** — three **literal empty bedplates**: dim/dashed cards,
  `aria-disabled`, **NO href** (provably growing, not just visual): the seeded
  **Stirling Cycle**, **Maxwell's Demon**, and **Brownian Ratchet**.
- A cross-wing **BRIDGE** card down to `../cavern/maxwell-boltzmann/`, framed as
  *"the microscopic floor the engine is made of"* — the Cavern pairing made a
  literal link (the bulk names heat/temperature/pressure are the chaos of the
  colliding molecules the M–B gas actually simulates).

**The one hard plumbing rule.** On load the landing drops
`localStorage['ws:seen:engine-room']` (matches the PLACES id) — verified by
`node tools/forge/forge.mjs --audit-seen` (now 14 front-door pages, all green).

**The landing self-test** asserts **structural wholeness** (the Cavern pattern —
the landing has no thermodynamics of its own to prove): the live Carnot link is
relative + present; exactly one live bench at launch; every empty bedplate is
`aria-disabled` and carries NO href and is not an `<a>` (so "growing" is provably
true); the seeded bedplate names are the three planned engines; the cross-wing
bridge link is present + relative + points at the M–B gas; the breadcrumb dropped;
the back-link, firebox stamp, and flywheel are present. **16/16**, class `ok`.

**The front door.** One `PLACES` entry appended to `index.src.html`
(`id:"engine-room"`, glyph `♨️`, accent `#d9a441`, footprint `"engine"`, at the
verified SE working-quarter coordinate `x:1004 y:706 w:158 h:104` — clears the
cave, the maze, the scale-bar, and the canvas edge), plus a new **`drawEngine`**
footprint drawer registered in the DRAW map beside `drawCave`: an **L-plan
industrial shed** (engine hall + a notched boiler annexe), a **great flywheel**
(double rim + hub + radial spokes) on a horizontal **line-shaft** with bearing
pips, a **chimney stack** with rising smoke ticks, and a **round boiler drum** in
the annexe — reads distinct from the cave's rough rock and the manor's clean
rooms. Re-forged via `node tools/forge/forge.mjs index.src.html`;
`forge --check --all` clean (29 files).

**Browser-verified** (agent-browser, served origin, `?v=` cache-bust): the landing
renders (flywheel spins / frozen under reduced-motion, no breadcrumb trail, the
empty bays dim + unlinkable — DIVs with no href, `aria-disabled=true`); the
front-door map shows the new wing with **0 label collisions** and a **200 href**;
the `drawEngine` footprint reads as an engine works (flywheel + line-shaft +
chimney + boiler) in the SE quarter.

**Benches:** **The Carnot Engine** (`carnot/index.html`) — see
`carnot/CHANGELOG.md`. Seeded next (empty bedplates): Stirling Cycle, Maxwell's
Demon, the Brownian ratchet. A multi-session wing — extend incrementally like the
Hall and the Cavern; grow the wing, don't rebuild a bench.
