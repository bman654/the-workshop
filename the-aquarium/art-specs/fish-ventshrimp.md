# Art spec — Vent shrimp (the floor GRAZE, self-lit)

## Asset
- **key:** `fish-ventshrimp`
- **medium:** visual-exhibit (canvas draw fn, code)
- **installs into:** `the-aquarium/art/fish.js` (shared module). Placeholder: the `graze` branch of `drawFish` for the basal species (i=3).

## Art direction
The **basal** life of the column — Rimicaris-style vent shrimp grazing the **lightless floor** (depth 0.82–0.97) right around the chemosynthetic vent. They eat the vent's chemistry, not sunlight, so this is the chemosynthesis idea made VISIBLE: where the column light has failed entirely, these carry their OWN cold teal-orange glow (`#ff9d6e` body, with a teal under-light from the vent washing them) and so they stay visible on the black floor. A small humped shrimp body, a fan tail, a swarm of waving legs, a bright eye-spot. They cluster and graze low, hugging the bottom near the vent glow; their number swells when the apex is pulled (the cascade frees the chain below). Read: a warm, living crust on a cold dark floor, lit from below by the vent.

## The swim-cycle
`ph` drives a shrimp-scull: the tail-fan flicks, the legs ripple. They stay low and slow. The self-glow (a small radial) pulses gently with `ph`. On `boil` they scatter and brighten.

## EXACT API
```js
// @kind fish
// @assetKey fish-ventshrimp
window.__ASSET = function drawVentShrimp(ctx, p) {
  // ctx pre-translated/rotated to the shrimp (see fish-lancetfish.md).
  // p = { s(~3.4), L(~ s*1.2), col:'#ff9d6e', ph, boil, light, TAU }
  // SELF-GLOWS strongly (it lives where light has failed). Carry your own teal-warm
  // light so it stays visible on the black floor.
};
```
- Cheap (up to ~75). Deterministic given `ph`.

## How it wires in
Shared `art/fish.js`; the `graze` branch dispatches vent-shrimp vs copepod by species key. The page draws the outer glow halo; your body + legs + eye-spot + the warm/teal under-light are the detail.

## Preview / judging
Same harness with `col:'#ff9d6e'`; the backdrop already paints the vent glow so the under-lighting reads.

**judgeFocus:** a humped vent shrimp with a flicking tail-fan and rippling legs that carries its OWN warm-over-teal glow — a living warm crust on the cold black floor, the chemosynthesis made visible.
