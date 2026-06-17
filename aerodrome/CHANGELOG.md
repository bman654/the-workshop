# The Aerodrome — Changelog

## 2026-06-17 — Plant the wing (cycle #91, grounds big-swing)

Born as a GROUNDS big swing: a new aerospace wing on the estate's upper sky court, sibling to the
Observatory's Orrery. Where the Orrery wheels the orbits the universe already chose (elements-from-time,
in degrees), the Aerodrome is where you **push off and author one** — a live two-body orbit you reshape
by dragging an impulse onto the ship.

### Built
- **`core.mjs`** — the sole-authority two-body flight core, canonical units (μ = 1, R = 1). A
  *clearly-separate* state-vector force integrator (NOT a rebuild of the Orrery's Kepler core). Exports:
  `dvSpent`, `vEsc`, `specificEnergy`, `orbitFromState`, `stateAfterKick`, `verletStep`, `badStep`
  (the leaky-Euler negative control), `conicType`, `accel`, `circularState`. The block lives between
  `CORE BEGIN / CORE END` sentinels and is inlined **byte-identical** into `index.html`.
- **`index.html`** (forged from `index.src.html`) — the wing landing + the operable *kick-the-conic*
  bench: a planet (atmosphere ring + hard crash floor), a craft on a live pale-gilt conic with a fading
  trail, the brass thrust-rosette (prograde/retrograde/radial handles, arrows clamped to the budget), a
  cyan ghost of the pre-kick orbit, the engraved Δv tube (drained height = Tsiolkovsky), the warm escape
  wall at v = √(2μ/r), the side-on launch-rail on-ramp, an opt-in challenge target ring, and live
  tabular-mono readouts. Brass-on-espresso in the Orrery's exact register, cool steel-silver accent.
- **`core.test.mjs`** — the Node twin. `node aerodrome/core.test.mjs` → **25/25 PASS, exit 0**.

### Self-test numbers (this build)
- **Claim 1 — Tsiolkovsky exact:** `|dvSpent − vₑ·ln(m₀/mf)|` worst-case `0.00e+0` over the (vₑ, m₀, mf)
  sweep (< 1e-12). Domain guards (mf > m₀, mf = 0, negative vₑ) return NaN, not garbage.
- **Claim 2 — ε-conservation:** velocity-Verlet `max|ε(t) − ε(0)| = 3.30e-10` over 3.25 periods, and the
  9.25-period peak matches the 3.25-period peak to `4.4e-16` (BOUNDED oscillation — symplectic, not luck).
  The leaky forward-Euler control at the same dt drifts `1.68e-3` (> 1e-3) — the integrator choice matters
  by > 1e5×.
- **Claim 3 — escape at √(2μ/r):** the wall speed equals √(2μ/r) to machine ε across the radius sweep;
  just-under-escape always returns (bound), just-over always escapes (e ≥ 1, apoapsis = ∞, no NaN); the
  integrated craft turns around at its analytic apoapsis (bound) or never returns (unbound).
- **Byte parity:** the CORE region inlined in `index.html` is byte-for-byte identical to `core.mjs`.

### Front-door registration
- `index.src.html` PLACES: one new entry `{ id:"aerodrome", room:"The Aerodrome", piece:"The Launch Rail",
  glyph:"🚀", accent:"#cdd6e0", district:"grounds", tier:1, wing:"aerospace", footprint:"launch-rail",
  companion:"orrery", skyStar:"aerodrome" }`. Drops `ws:seen:aerodrome` on a direct visit (audit-seen green).
- `tools/layout/layout.js`: `WING_META.aerospace = { label:'THE AERODROME', accent:'#cdd6e0' }` and a new
  `GROUNDS_WINGS.aerospace` sub-region. **The brief's x214 court overlapped firmament's tower** — FINALIZED
  via `smoke.cjs`'s live Layout.solve to `{ x:366, y:156, w:200, h:140 }`, seating the launch-rail footprint
  collision-free just to the right of the Observatory tower in the open upper sky court.
- `index.src.html` DRAW table: `drawLaunchRail` — a side-on gantry mast + diagonal rail + craft wedge + a
  dashed flight arc with an apoapsis pip ("something launches from here" at plan-glance).
- `tools/sky/sky.js`: new field star `'aerodrome': { x:360, y:120, mag:1 }` (verified clear of partition /
  temperature-dial / the manor pool / every footprint+furniture box). No new asterism/wing — the six
  byte-frozen capstone wings stay untouched; sky.test.cjs stays 73/73.
- Reciprocal cross-links: aerodrome ↔ orrery (`↗ Orrery` / `← The Orrery Estate`; orrery gains `↗ Aerodrome`).

### Verify gate (all green)
`node aerodrome/core.test.mjs` 25/25 · `node tools/layout/smoke.cjs` PASS (aerodrome clear, no overlap) ·
`node tools/sky/sky.test.cjs` 73/73 · `node tools/forge/forge.mjs --check --all` all current ·
`forge --audit-seen` aerodrome drops its breadcrumb. Browser (uniquely-named session, port 8137):
~60 fps during a live drag, 0 console errors, 0 horizontal overflow @1280 AND @390, 0 nested anchors,
self-test pill green; play-tested all outcomes — drag bends the conic + ghost shows, retrograde→reentry
crash, cross the wall → hyperbola leaves frame, the rail on-ramp fires.

### Publisher fresh-eyes (cycle #91) — caught & fixed: the parked-state readout
A craft at rest on the launch rail (v = 0) was the FIRST thing a visitor saw, and the readouts
mislabeled it `altᵃᵖᵒ escaped / e 1.000` — because `orbitFromState` of a zero-velocity state is a
degenerate radial-fall (h = 0 ⇒ semi-latus rectum 0, the eccentricity vector normalizes to magnitude 1),
so the parked ship read as "escaped" while its energy ε = −0.417 said plainly *bound*. A self-contradiction
on the landing screen. **Fix:** a `parked` guard at the top of `updateReads()` — when `!ship.launched`,
the conic fields read an honest `— parked` / `—` and Δv shows full, handing off to the live orbit math
the instant the booster fires. The edit is page-view logic **outside** the `CORE BEGIN/END` sentinels, so
byte-twin parity is untouched and the Node twin re-ran **25/25**. Re-forged `index.src.html → index.html`;
`forge --check --all` green. Verified LIVE (session `aeropub`, port 8743 torn down by exact PID): parked
readout honest, then a real `fireFromRail(0.6)` launch handed off correctly to live orbit math (e 0.527
ellipse, period 71.86, ε −0.098 bound) and the craft slowed to 0.323 near its apoapsis — real Kepler.
All flourish chips toggle clean; 0 console errors; 0 overflow @1280 & @390. Bloomed the `[room]` seed.
