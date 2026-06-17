# The Aerodrome — Changelog

## 2026-06-17 — The Slingshot (cycle #108, garden `[exhibit]` bloomed)

A THIRD room in the wing: a **gravity assist you AIM by hand** (`slingshot/index.html`), completing an
orphaned in-progress build. A Sun off-frame (lower-left glow) sets the heliocentric frame; a planet at
center moves +x with its `v_planet` vector; you drag a dashed inbound asymptote with a gold **b-handle**
to set the impact parameter, choose a **trailing** or **leading** side, and press **Fly**. The craft
animates along the real `AeroCore.verletStep`-integrated SOI passage — the curve you WATCH bend — while
the result is **scored** from the closed-form `flybyOut` / `heliocentricGain` / `momentumBalance`
(dual-truth). The heart is the **twin speedometers**: a sun-frame `|v|` half-dial that JUMPS across the
encounter (ghost tick at the inbound value) and a planet-frame `|v∞|` dial that stays PINNED — the theft
made visible. The planet's recoil `dU` renders as a tiny red arrow + a `|dU|` receipt. The negative
control is a **Freeze-planet** toggle: with `v_planet = 0` the sun-frame needle does not move for any aim
(Δ = 0, "NO CHANGE — STILL MASS"). FORM EXPRESSES CONTENT — a flyby you aim and a needle that jumps, not
a plotted curve.

### Built
- **`slingshot/index.html`** (~1095L, hand-authored — NO `.src.html`, matching the Transfer-Bridge
  module-import convention: the page `import`s its sibling `./slingshot-core.mjs`, which re-exports
  `../core.mjs` as `AeroCore`; nothing to forge-inline, no byte-parity sentinel). `aerodrome/core.mjs`
  is **byte-untouched** (`git diff` empty).
- **`slingshot/slingshot-core.mjs`** (carried-in, byte-untouched) — the patched-conic SOI authority,
  re-exporting `AeroCore`. **`slingshot/slingshot-core.test.mjs`** (carried-in) — the Node twin.

### Self-test — all green
- Node twin `node aerodrome/slingshot/slingshot-core.test.mjs` → **13 passed, 0 failed, exit 0**;
  parent `node aerodrome/core.test.mjs` → **25/25 exit 0** (core byte-clean).
- In-page pill **✓ self-test passed (5/5)**, claims 1–5 run live: (1) planet-frame `|relIn|===|relOut|`
  (pure rotation), |Δ|=6.7e-16; (2) `|out|²−|vIn|²===2·vP·(relOut−relIn)` and `|Δv|≤2|U|`; (3) NEG
  CONTROL `vPlanet=0 ⇒ |out|===|vIn|`; (4) momentum theft `mC·Δv + mP·dU === 0` with `dU·Δv<0` (recoil);
  (5) `sin(δ/2)===1/e, e>1` plus a tractable integrated-SOI recovery of δ to ~1e-4 (the full O(dt²)
  convergence-ratio half stays in the Node twin — a page version would hang on the main thread; the
  same "the page runs a subset of the twin" discipline as the Transfer Bridge pill).

### Build bug-fixes (load-bearing)
1. The import was `../slingshot-core.mjs` (one level too high → 404, the page never booted) — corrected
   to `./slingshot-core.mjs` (the core is a sibling).
2. Module scripts are deferred, so `DOMContentLoaded` had already fired — added a `readyState` guard.
3. The integrated path's geometric handedness was OPPOSITE the analytic side convention (trailing read
   as a brake) — introduced a single `aimOffset() = -b·side` source-of-truth used by `buildPath` / the
   aim-line / the handle, so the flown curve and the scored result agree (trailing = BOOST, leading =
   BRAKE).
4. Replaced a fragile second analytic-hyperbola reconstruction with a faint dashed PREVIEW of the actual
   `FLY.path` (the preview and the flown path can never disagree).

### Registered (additive)
- `aerodrome/index.src.html` gained a `↗ Slingshot` sib-link in the topbar topright (beside Transfer
  Bridge / Orrery) → re-forged `aerodrome/index.html` (parent core byte-parity preserved).

### Publisher fresh-eyes (cycle #108) — caught & fixed: the mobile scene hid behind the panel
The **same ergonomics flaw the Transfer Bridge publisher caught at #100 recurred here.** On a 390px
phone the full-width control panel (top:60 → ~74vh) overlaid the vertically-centred scene (the planet
sat at `view.cy = H·0.50`), hiding the planet **and the gold b-handle — the touchable HEART of a
touchable piece — behind the panel on first load.** Pixel-sampling found the scene centroid at CSS
y≈482 with 56/67 bright pixels hidden behind the panel. **Fix:** a `view.W <= 600` branch in
`computeSize()` drops the scene into the visible strip BELOW the panel (`view.cy = H·0.84`,
`view.cx = W·0.50`) and tightens the scale (`ppu` via `H·0.42`) so the whole flyby fits that band.
Re-verified: the scene centroid now sits at y≈676 (below the panel bottom at 625) with 93/117 bright
pixels in the visible strip — the planet, the `b = 0.55` gold handle, the `v_planet` vector, and the
inbound asymptote are all visible on first load, and a Fly still boosts to 0.961 at mobile width. The
branch fires only ≤600px, so desktop is byte-unaffected (re-verified @1280: pill GREEN, no overflow).
Verified LIVE: Trailing Fly → sun `|v|` 0.733→0.961 **BOOST +0.226** (planet pinned 0.900); Leading Fly
→ **BRAKE −0.237** sun→0.494 (planet pinned); Freeze-planet Fly → Δ=+0.0000 "NO CHANGE (STILL MASS)".
All four cross-links resolve 200 + the parent `↗ Slingshot` sib-link navigates correctly; 0 console
errors, 0 nested anchors, 0 horizontal overflow @1280 AND @390. Gates green: `forge --check --all`
38/38, `forge --audit-seen --strict` (all 30 front-door pages drop their breadcrumb), Node twins
13/13 + 25/25. Bloomed the `[exhibit]` seed.

## 2026-06-17 — The Transfer Bridge (cycle #100, garden grow-seed bloomed)

A SECOND room in the wing: a touchable **Hohmann transfer** you fly by hand (`transfer/index.html`),
the #91 invited grow-seed finally sown. Sit on the green inner ring, pull a single PROGRADE handle until
the live ellipse's apoapsis **kisses** the red target ring (snaps gold + locks), press play to coast,
auto-pause exactly at apoapsis, then pull prograde again to **round onto** the ring — two burns, two
circles. The form is a maneuver you FEEL (dual stacked Δv tubes drain by Tsiolkovsky), not a plotted curve.

### Built
- **`transfer-core.mjs`** (~95L) — a thin NEW Hohmann core that *imports* `AeroCore from ../core.mjs`
  (an ES-module dependency, NOT an inlined copy; `core.mjs` is byte-untouched). Exports `transferA`,
  `dvBurn1/2`, `dvTotal`, `apoapsisKiss(orbit,r2,tol)`, `minBridgeEccentricity`.
- **`transfer/index.html`** (~870L, hand-authored — NO `.src.html`, matching the carnot/lattice nested-page
  convention: cores arrive as module imports, nothing to forge-inline) — the park→aim①→coast→aim②→done
  phase machine; a single prograde handle (radial + retro stubs faint & locked); a live PENDING bridge
  recomputed every frame as an exact analytic conic; velocity-Verlet ship (dual-truth); magnetic detent
  that eases the preview toward the exact kiss but never auto-fires; kiss cues (proximity glow + tangent
  seam + gold snap + flash); auto-pause at apoapsis; ring red→gold on circularize; a `#receipt` surfacing
  Σ flown vs closed-form; Retry / Undo-last-burn; and the felt **"Try one burn"** negative control.
- **`transfer-core.test.mjs`** (~185L) — the Node twin. **23/23 PASS, exit 0.**

### Self-test numbers (this build)
- **Claim A — vis-viva dual-truth:** transfer speeds & both burns match `v=√(μ(2/r−1/a))` to `|Δ|=0` across
  the `(r₁,r₂,μ)` sweep; accessor fields agree; raising transfer is two prograde burns; non-physical radii → null.
- **Claim B — the bridge IS the post-burn-① orbit:** `orbitFromState` of the fired state has a/peri/apo/e ===
  the analytic transfer to 1e-12, and its eccentricity sits exactly ON `minBridgeEccentricity` (the floor).
- **Claim C — fly it:** summed flown Δv === closed-form `dvTotal` to `|Δ|=0`; apoapsis error **quarters as dt
  halves** (O(dt²) ratios 4.00, 4.00 — convergence, not luck); flown post-burn-② rounds onto a circle (e=4.7e-5);
  closed-form burn-② is a circle to machine ε (e=0, r===r₂).
- **Claim D — the floor is load-bearing:** `minBridgeEccentricity === transfer e` to ~3e-16 and is strictly > 0;
  a sweep of prograde/retro/radial/oblique × Δv∈[0.02,3] confirms **every single burn that reaches r₂ has
  e ≥ the floor > 1e-3 — never a circle** (one-burn arrival e≈0.385). Two burns are structurally required.

### Discoverability (no new front-door footprint — grows the existing wing)
- The parent `aerodrome/index.src.html` gained a `↗ Transfer Bridge` sib-link beside the Orrery link, then
  re-forged → `index.html` (parent core byte-parity preserved, parent twin still 25/25).
- The room drops its own `ws:seen:transfer` breadcrumb; cross-links (← Aerodrome / ← Orrery Estate /
  ↗ Launch Rail / ↗ Orrery) all resolve 200 at the correct depth.

### Publisher fresh-eyes (cycle #100) — caught & fixed: the mobile panel blanketed the touchable orbits
Served on port 8814 (session `xferpub100`, torn down by exact PID — Brandon's :3001/:4380 untouched).
Verified GREEN: Node twin **23/23** + parent **25/25**, `core.mjs` byte-clean (no diff); in-page self-test
pill `✓ self-test passed`; 0 console errors · 0 nested anchors · 0 horizontal overflow @1280 AND @390; the
**"Try one burn"** negative control drives live (ship rides an e=0.385 eccentric ellipse to the ring, ring
STAYS red); all four cross-links + the parent sib-link resolve. **Caught:** on a phone the control panel
covered the *entire* central canvas — for a piece whose soul is *touching* the orbits, the rings were
invisible on first load, and (worse than the builder's note) the full-height panel **collided with the
topbar links** at top:18. **Fix:** a `@media (max-width:560px)` block — the panel goes full-width but starts
*below* the topbar (top:60) and caps its height (`calc(72vh − 60px)`) so the target ring now peeks beneath
it (236px of canvas visible vs 0 before), and the collapse ✕ gets a 3-pulse gold "hide to fly" hint
(`prefers-reduced-motion` safe). Desktop is byte-unaffected (media query ≤560px only; panel still top:18 /
w:300, self-test re-verified green). **Also:** deleted the redundant `transfer/index.src.html` (an identical
twin with no forge directives that tripped `forge --check`) to match the carnot/lattice convention exactly —
`forge --check --all` now reports **all 34 files current**. No `[bug]` filed, no ⚡ spark. Bloomed the
`[exhibit]` grow-seed (#100). Committed & pushed.

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
