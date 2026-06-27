# The Keystone Arch — changelog

A side-on semicircular masonry arch of nine dry-cut voussoirs (no mortar). Raise it from
the springers and the incomplete ring SAGS into the gap; drop the last wedge — the
KEYSTONE — and it SNAPS rigid as a single line of pure compression threads the stone.
Pull a haunch stone: jammed by the squeeze. Lift the keystone back out: no admissible
thrust line exists, and the span falls. Three stones are carved (GATE · FOUNDRY · BATON),
the estate's self-portrait of work done one turn at a time.

## The proven object (and the honesty hedge)

`core.mjs` is the DOM-free statics authority; `core.test.mjs` is its Node twin
(`node the-keystone-arch/core.test.mjs` → 25/25 green) running the SAME `runSelfTest()`
the in-page pill runs. The geometry is test-pinned: Ri=2, Ro=3 ⇒ t=1, R_mid=2.5; N=9
voussoirs of Δθ=20°; γ=1; keystone index m=4 on the crown; joints J0..J9.

What is PROVEN, exactly, at the joint crossings P_k:

- **The seated arch stands.** A line of thrust exists INSIDE the ring (|e| ≤ t/2 at every
  joint) with every joint in COMPRESSION (normal force N_k > 0). The most-centred such
  line — found by equalising the extreme eccentricities (an exact 3×3 Newton solve at the
  crown · J2 · springer) — sits at max|e| = 0.13342, which is LESS than t/6 = 0.16667:
  inside the **middle third**, so there is no tension anywhere. That is strictly stronger
  than Heyman's bare safe-theorem containment.
- **A whole window of thrusts works** (statical indeterminacy + the safe theorem):
  H ∈ [0.679, 2.724], centred at 1.522.
- **The neg-control: remove the keystone and nothing holds.** The crown becomes a free
  surface ⇒ H = 0 is forced; each half-arch's thrust line then flies OUTSIDE the ring at
  every joint (worst |e| = 0.879859 ≫ t/2), and the half's weight makes a non-zero moment
  about its springer bed (−2.489530 ≠ 0). `standsUp === false`. The self-test asserts BOTH
  the seated arch stands AND the broken arch cannot — the contrast is the proof.

**Honesty hedge.** The exact claim is the statics at the joint crossings P_k (above). The
smooth funicular drawn through them, and the SAG / COLLAPSE of an unseated ring, are
faithful-but-approximate RENDER — not an asserted collapse mechanism. The sag is a rigid
half-arch tipping about its springer (the natural read of "an incomplete ring can't
stand"), eased by one scalar; it is not a dynamical simulation.

## Design notes

- **Most-centred line, not naive mid-thrust.** The single rigid arch is indeterminate; we
  report THE most-centred admissible line so the "nested in the middle third" overlay is
  literally true and the no-tension statement holds. (A naive crown-mid / springer-mid line
  would poke to |e| = 0.261, past the middle third — admissible but weaker.)
- **One frame.** `core.mjs` owns the math frame (O at origin, y-up, springers on the
  x-axis, crown at top). The render is the only place a world→screen transform lives; at
  sag = 0 the posed stones EQUAL the core geometry, so the thrust line lands on them.
- **Audio.** Three procedural WebAudio SFX (thunk · snapLock · rumble), muted-by-default,
  gesture-gated (the ctx resumes on the first real click), honouring the estate-wide
  `ws:pref:muted` key. Offline-rendered peaks ≈ 0.55 / 0.55 / 0.47 (non-silent, unclipped).
- **Front door.** POI in the GROUNDS / new STATICS precinct (with The Infinite Overhang);
  `drawKeystoneArch` footprint handler; catalog star `the-keystone-arch` (1250, 872);
  cross-linked both ways with The Catenary (the hanging chain inverted) and The Bending
  Column. The `statics` wing is registered in `tools/layout/layout.js` (GROUNDS_WINGS +
  WING_META), seated disjoint in the open lower-right grounds band.

Built cycle #331 (BUILD / garden · a bloom).
