# The Cartesian Diver — changelog

## Cycle 445 — planted (the bottle in hand)

A cozy windowsill curio you can't stop fiddling with. Press your finger to a
water-filled bottle; the wall dimples under your touch and a little glass devil
sinks. Ease off, he rises. The whole play is hunting the one squeeze where he
*hovers* — and feeling the bottle refuse to let you keep it.

**Claim-free by design.** Real physics drives every frame; nothing is printed —
no pressure number, no Boyle theorem, no HUD, no accuracy pill. The honest layer
is the FEEL (the un-holdable knife-edge) and a payoff-liveness twin.

### What it is
- **A real deformation.** Press-and-hold anywhere on the flank: the wall dents
  inward at the touch point, drag down to squeeze harder, release springs back
  with a small overshoot wobble.
- **The mechanism is SHOWN, not told.** Squeezing raises the internal pressure
  and Boyle compresses the trapped air pocket — you watch the diavolino's **belly
  bubble shrink**, so he displaces less water and sinks. Never a printed number.
- **The knife-edge is felt, and it trembles.** Neutral buoyancy is a genuine
  *unstable* equilibrium (deeper water → more pressure → smaller bubble → less
  lift → runs away). Near neutral, an ever-present micro-turbulence stops being
  swamped and the diver quivers; firmly sinking/rising he is glassy. The tremble
  is the same core's perturbation-to-force ratio, not a cosmetic sine.
- **The held breath.** A hairline still-line marks the hover depth; rest his
  centroid in the thin band and a stillness accrues — the wet glass clears, the
  hum quiets toward a single held tone. Slip out and it releases with a muted
  glug. No score, no number — pure diegetic tension.
- **Wet-glass craft:** a sliding specular glint, a refraction lens of the warm
  window light through the belly, a meniscus that barely lifts (incompressible),
  a caustic pool on the brass shelf bracket. Canvas-2D, warm/domestic palette
  deliberately away from the-aquarium's cold teal.

### Architecture
- `core.mjs` — the SOLE physics authority (real buoyancy + Boyle + the unstable
  equilibrium). Prints nothing. `H`, `DRAG`, `SQ_GAIN`, the air pocket are the
  knife-edge tuning knobs (playtest-tuned so a realistic imperfect hold slips in
  a heartbeat, and the control band sits mid-squeeze).
- `core.test.mjs` — the Node payoff-liveness twin. **13 checks, all green.**
- `index.src.html` → forged to a self-contained `index.html`, inlining the core
  byte-for-byte between sentinels so the page motion and the twin can't disagree.

### Payoff-liveness twin (the verification a claim-free piece owes)
Not a theorem — it proves the payoffs FIRE by driving the same core the render
drives: a firm squeeze sinks him to the floor (monotone); release rises to the
neck; the belly bubble shrinks under pressure; **neutral repels both ways**
(un-holdable); a driven hold decays out of the band; a restored session resumes
at its saved depth; and the held breath accrues in-band / releases outside.
Re-run headless with `node core.test.mjs`; the page runs the same suite live
(`window.__diverLiveness`) and shows an "alive ✓" chip.

### Sound (in-house synth, mute-gated)
Muted glug on tap, soft bubble-hiss on hard squeeze, a glass tink at the bottom,
a tension hum that swells only near the knife-edge and quiets into the held
breath. All WebAudio-synth, unlocked on the first gesture, gated on the shared
`ws:pref:muted` key. Reduced-motion safe.

### Placement
Seated as **water-kin**: enrolled as a companion of The Glasshouse Range (beside
The Aquarium) in the estate manifest — **no new front-door POI, no map dot**.
Reached by reciprocal companion chips from **The Aquarium** and **The Pool**;
its own back-nav returns to the workshop and both siblings. Drops
`ws:seen:cartesian-diver`.
