# The Rotation Bench — changelog

## Cycle 178 — bench bloomed (garden)

**THE ROTATION BENCH — The curve that won't fall.** The Stellar Forge's fourth bench and its
first at **cosmic scale**: a whole face-on spiral galaxy whose rotation refuses to fall the way
the visible stars predict. A circular orbit is set entirely by the mass enclosed inside it,
`v(r) = √(G·M(<r)/r)`. Past the bright edge the visible stars run out, so the curve *should*
droop **Keplerian** (`v ∝ 1/√r`) like the planets do — but the galaxies go **flat**, the
dynamical fingerprint of mass that gives off no light. You flatten the curve by hand and find
out what it costs: mass you cannot see.

### The form — `index.html` (one `<canvas>` galaxy + a subordinate cartouche)
- **The hero stage**: a face-on spiral galaxy turning on a `<canvas>` — two log-spiral arms, an
  ember bulge glow that scales with the luminous knob, ~560 deterministic LCG-seeded disk stars
  (parallax far-field constants, verbatim) drawn additively (`globalCompositeOperation='lighter'`,
  `#cfe0ff`/`#9db4ff`). **Each star sits at fixed radius r and advances its azimuth every frame by
  ω(r)=v(r)/r taken straight from the core's `vTotal` — the spin you SEE is the math, one
  function.** A cold-violet halo ring appears only when the crank is up, labelled *"what you cannot
  see."*
- **The hero verb + controls** (estate brass register): a draggable brass **speed-needle** on a
  painted radial spoke (the parallax drag-to-probe gesture; arrow keys walk it) that sweeps r and
  reads v at that radius on both curves. An ember **luminous-disk knob** (Mdisk) brightens/fattens
  the visible disk; a cold-violet **dark-halo crank** (ρ0) winds in the isothermal halo; a
  **kill-the-halo** neg-control toggle zeros ρ0; *snap to the fit* sets the witness.
- **The subordinate cartouche** (explicitly secondary — *"the plot is only a shadow"*): the two
  curves as an instrument readout — 8 observed pins with real ±σ whiskers, a thin amber
  visible-only line that sags into the Keplerian tail, a bright total line you trim, a vertical
  **residual thermometer** that drains green as the fit closes, and a **RESOLVED latch**
  (solenoid bar) that throws ONLY when `resolved(params)===true`. Latch feedback is visual/haptic
  (bar slams, flashes green) — **no audio** (confirmed: no sibling ships audio).
- **The reveal, enacted by hand**: arrive with the crank at zero — the total curve sits on the
  visible sag and misses the outer pins. Turn the luminous knob to max — the inner pins snap in,
  the whole curve lifts, but the outer pins stay stranded and the readout flags *"M/L unphysical in
  this bench's scaled units"* (SCALED, not a catalogue number); the latch stays dark. Wind the
  violet crank — the tail peels off Kepler, flattens onto the stranded pins, the thermometer drains
  green, the latch THROWS. The galaxy never changed; you added unseen mass.
- **The winding graft** (the secondary discoverable beat, same single canvas): a *"↺ let it run /
  re-wind"* button re-seeds a crisp two-arm spiral; with the halo OFF, because ω(r)=v(r)/r falls
  off Keplerian, the outer arms wind up and smear into a fuzzy disk over a few turns (captioned
  honestly: *"schematic differential rotation — visible mass only: the arms wind up and die"*).
  Wind the crank and the flatter curve keeps outer ω high enough that the arms hold their shape
  (*"dark halo wound in — the arms live"*). Bound to the proof: the self-test certifies
  `ω_vis(r_out)/ω_vis(r_in) < ω_halo(r_out)/ω_halo(r_in)`, so the smearing you SEE is the certified
  quantity, not decoration.
- **Accessibility**: arrow keys walk the needle; knobs/crank are keyboard sliders; the galaxy is a
  focusable canvas; `prefers-reduced-motion` stills the spin and jumps the winding beat to its
  smeared (halo off) / held (halo on) end-states. Responsive canvas, no horizontal overflow.

### The math crux — `core.mjs` + `core.test.mjs`
- DOM-free, zero-dep ESM. `G≡1`, `r` in disk scale-lengths `Rd`, `M` in scaled units — every
  claim is a dimensionless **shape/scaling law**, never a catalogue number. Pure exports:
  `vCirc(Menc,r)=√(G·Menc/r)`; `MdiskEnc`/`MbulgeEnc`/`MvisEnc` (an exponential disk
  `Mdisk·[1−(1+r/Rd)e^(−r/Rd)]` + a saturating Hernquist bulge — bounded, the whole catch);
  `MhaloEnc(r,p)=4π·ρ0·rc³·(r/rc−atan(r/rc))` (isothermal `ρ=ρ0/(1+(r/rc)²)`); `vVisible`,
  `vTotal`, `vDisk`, `omega(r)=v(r)/r`; and a **single** pure `resolved(params)` = (max over 8 pins
  of `|vTotal−vObs|/σ`) < 1, called by BOTH the renderer's latch and the test.
- Inlined byte-for-byte into `index.html` between the `ROTATION-CURVE CORE` sentinels; the Node
  twin byte-parity-checks the page copy against `core.mjs` (indentation-normalized).
- The **witness** `{Mdisk:4.0, Mbulge:0.1, ab:0.8, ρ0:0.17, rc:1.2}` fits all 8 pins at worst
  **0.589σ** (resolved). The catch theorem holds at **18.6σ** — no Mdisk-alone setting (ρ0≡0)
  reaches the flat outer pins.
- The 7 proved legs (page) + independent re-derivations (twin): (1) the orbit law
  `vCirc(r)²·r === G·M(<r)` to <1e-12 swept across r; (2) the **Keplerian tail** — disk-only
  log-log slope `=== −½` to <1e-9 over two far decades + `v·√r` constant (the bulge's O(1/r) tail
  reported loosely); (3) the **flat halo** — isothermal `M(<r)/r → 4π·ρ0·rc²` ⇒ `v` const, proven
  both directions; (4) **data reachable** — witness ⇒ `resolved()===true`; (5) **the knob alone
  cannot** — exhaustive Mdisk sweep with ρ0≡0 keeps the worst-outer residual `> σ` at every setting
  (same pin table as leg 4); (6) **neg-control** — ρ0=0 ⇒ `vTotal === vVisible` EXACTLY ⇒
  `resolved()===false` (the latch dies) + a `fakeFlatByHand` guard caught by the `v²r=GM` identity
  (hand-painted flatness ≠ real enclosed mass); (7) the **winding bound** ω_vis ratio < ω_halo
  ratio (the visible disk shears harder).
- `node core.test.mjs` → **34/34**, page self-test **7/7**, byte-parity **IDENTICAL**, EXIT 0.
  In-page pill `✓ 7/7 self-test`; `window.__rotationBench.runSelfTest().ok === true`.

### The wing
- `../index.html` (the Stellar Forge landing): a **fourth** `a.card` (cosmic-violet `--hue:#7e9bff`,
  glyph ✺, kind `bench · self-proved · cosmic-scale`) names `resolved()` and the kill-the-halo
  neg-control. The lede became a four-bench lede; the footer now reads *"…and the galaxy that proves
  its own dark weight, the first bench at cosmic scale."* The landing self-pill also winks the orbit
  law (`v²·r === M(<r)`) → `✓ gates ordered · T∝1/M · v²r=M`. Breadcrumb
  `ws:seen:stellar-forge-rotation-curve` drops on visit. No new front-door POI — this lives inside
  the already-mapped Stellar Forge wing.
- Cross-links to the three siblings (Scales · Fusion Ladder · Pair at the Edge) + the Forge
  back-link.
