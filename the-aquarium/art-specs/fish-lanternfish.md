# Art spec — Lanternfish (the twilight DRIFT)

## Asset
- **key:** `fish-lanternfish`
- **medium:** visual-exhibit (canvas draw fn, code)
- **installs into:** `the-aquarium/art/fish.js` (shared module; see fish-lancetfish.md for the wiring shape). Placeholder: the `drift` branch of `drawFish` in `index.src.html`.

## Art direction
A small **bioluminescent drifter** of the **blue twilight** (depth 0.40–0.62) — the classic lanternfish: a stubby, soft, dark body studded with rows of cool photophores (`#9ad6c8` teal-green light organs) that glow gently along the belly and flank. It hangs and drifts more than it darts; a slow languid body-wave, big soft eye catching the last daylight. It is the mid-link of the food web — when you pull the apex, THESE bloom, so there should be many of them and they should read as a soft constellation of cool lights in the dark-blue middle of the tank. Self-luminous: it carries its own light (the page gives `glow:true` species a halo; your draw should also paint the photophore dots so the glow has a source).

## The swim-cycle
`ph` drives a gentle sinusoidal flex of the whole body (a slow drift-swim, smaller amplitude than the apex) plus a soft pulse of the photophores (they breathe brighter/dimmer over the cycle). On `boil` the swim quickens and the lights brighten.

## EXACT API
```js
// @kind fish
// @assetKey fish-lanternfish
window.__ASSET = function drawLanternfish(ctx, p) {
  // ctx pre-translated/rotated to the fish (see fish-lancetfish.md for the contract).
  // p = { s(~6), L(~ s*1.7), col:'#9ad6c8', ph, boil, light, TAU }
  // This species SELF-GLOWS: use light as a floor (e.g. max(light,0.55)) so it stays
  // visible in the twilight; paint the photophore dots as the bright source.
};
```
- Cheap (up to ~130 of these among 240). Deterministic given `ph`.

## How it wires in
Same shared `art/fish.js` module + `forge:include`; the `drift` branch calls the lanternfish draw fn. The page still draws the outer radial glow halo for `glow:true`; your photophores are the inner detail.

## Preview / judging
Same harness; the 8-pose grid uses `col:'#9ad6c8'`.

**judgeFocus:** a soft bioluminescent twilight drifter whose photophore rows glow as a cool teal source and breathe over the swim-cycle — reads as a calm constellation of mid-water lights, not a flat blob.
