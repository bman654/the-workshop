# Weather You Can Make — CHANGELOG

## The Cloud Bench (founding) · cycle 314

A garden exhibit grown from the `BUILD weather-you-can-make/` design (planter cycle
314). Two dials — surface **temperature** and surface **dew point** — and the air
column above them. Turn the dials and a **flat-bottomed cumulus cloud SNAPS into
being** and rides its base up or down, LIVE. The cloud IS the readout; there is no
skew-T graph. Registered on the front door as a grown garden exhibit in the **Gardens**
(`district:grounds, tier:2, wing:glasshouses, footprint:glasshouse`), aesthetic sibling
to Why the Sky Is Blue, and as a gate POI.

### The form (the soul-verb = TURN TWO DIALS, MAKE WEATHER)
Zero plotted curves — a thing you SEE and TOUCH. **Lift a surface parcel**: it cools
along the dry adiabat (9.8 °C/km); its dew point falls too but gentler (1.8 °C/km);
where the two traces KISS, the moisture condenses — the cloud's flat base, the lifting
condensation level. Dry the air and the base climbs; dampen it and the base sinks;
bring the two dials together and the base drops to the **ground as fog**.

- **Two dials, one invariant.** Temperature (−5..40, value 24) and dew point (−20..40,
  value 14), both step 0.5. The hard `Td ≤ T` clamp is load-bearing UX: the dew slider's
  live `max` tracks T, a shaded **impossible band** marks the >T air, and dragging T down
  through Td pushes Td down preserving the spread (married descent). Both handlers route
  through a single `applyDials(T,Td)` that clamps, derives `zLCL` straight from the core,
  reflects into the DOM, and renders in the SAME input tick (no lag on the derive).
- **The cloud is the readout.** A canvas air column (ground at 88%, ceiling z=ZTOP_M=4000 m)
  with one shared `y(z)` map. Five draw layers: a sky gradient + ground line; the two
  converging traces (faint, °C → a gentle x-offset so they meet spatially) with a
  brightening convergence node; a parcel disc + wisp riding up to y(zLCL); the **cumulus
  deck** (the hero — a crisp 1.5px flat base with a dark under-shadow + a billowing body of
  8–14 overlapping warm-lit lobe sprites via `lighter`, narrow/tight when moist, wide/tall
  when dry, with low-amp breathing); and a tick-rail (0..4 km). One `display` object lerps
  toward truth each frame — the base GLIDES, the deck SNAPS into being, fog and lift fade.
- **Two neg-controls FELT in one click.** `🌫 saturated (fog)` (T=Td) melts the deck into a
  low ground-fog band — no crisp base. `🌡 capped (inversion)` sets a warm lid so the lifted
  parcel is not warmer than its surroundings ⇒ `rises()===false` ⇒ a still column + "parcel
  sinks back — no lift", the traces still faintly drawn so you SEE the temp isn't beating the
  env. `🏜 dry desert` (spread 33) lands the base above the ceiling — clear sky, reachable.

### The proof (the conditional-math register, kept honest)
`core.mjs` is the SOLE math authority (DOM-free ESM), inlined byte-identical into the page
between `/* CORE BEGIN */ … /* CORE END */` and proved identical by the Node twin's
byte-parity check. The model is the **straight-line (Espy) lapse, stated honestly — NOT
Bolton**. `node weather-you-can-make/core.test.mjs` is **30/30 green**; the in-page pill is
**5/5 ✓**. The four claims:

1. **ESPY IDENTITY** — `lcl_m(T,Td) === 125·(T−Td)` m to machine ε across a (T,spread) sweep,
   re-derived a second way by hand-rolled bisection of the two-line crossing.
2. **NEG-CONTROL (a) FOG** — `T===Td ⇒ lcl_km===0` and `lcl_m===0`, bit-exact zero, swept.
3. **NEG-CONTROL (b) BUOYANCY GATE** — `rises(Tp,Tenv)===false` whenever `Tp≤Tenv`, true only
   when strictly warmer. Exact booleans, no tolerance.
4. **MONOTONICITY** — a wider spread STRICTLY raises the base (moister ⇒ strictly lower).

#### Honesty crux — corrected from the design's premise
The design brief claimed `9.8−1.8 = 8.000000000000002` in IEEE754 (a float wobble). **That
is FALSE in V8**: `9.8−1.8 === 8` is bit-exact and `1000/8 === 125` is bit-exact (verified
in the twin, in the open). So the honest crux is NOT a float wobble — it is that the **125
m/°C is DEFINITIONAL**: it is what the two lapse rates we CHOSE (9.8 and 1.8) imply
(recoverable two independent ways, and it changes if the rates change), **not a measured
constant of the real atmosphere**, which bends. The twin asserts the bit-exactness AND
forbids calling the 8/125 an empirical fit. Exact about a chosen model, never a number we
can't stand behind.

### A11y / craft
Native ←/→ (±0.5) on the sliders, `:focus-visible` rings, per-slider `aria-label` +
`aria-valuetext`, a debounced `aria-live=polite` `#srlive` mirror announcing the consequence
on settle, ≥44px touch rows, a 1040px single-column mobile stack (column-first), the
clipped-readout guard (`overflow-wrap:normal`) that bit #311/#312. Reduced-motion respected.
Silent piece — no audio.
