# Art spec — Copepods (the mid-water GRAZE swarm)

## Asset
- **key:** `fish-copepods`
- **medium:** visual-exhibit (canvas draw fn, code)
- **installs into:** `the-aquarium/art/fish.js` (shared module). Placeholder: the `graze` branch of `drawFish` for the copepod species (i=2).

## Art direction
The **grazers** — a fine, numerous swarm of tiny planktonic copepods drifting through the **dim mid-low column** (depth 0.58–0.80). Each is a tiny translucent teardrop with long trailing antennae and a faint amber-gold glow (`#e3c06a`), jerking in the characteristic copepod hop-and-glide. Individually almost nothing; collectively a shimmering, granular drift — the food the lanternfish eat, so they should read as PLENTIFUL (the most numerous species) and as a living haze, like motes in a shaft of light. They thin dramatically when you pull the apex (the cascade's level 2), so the swarm's DENSITY is the visible signal — make a single one tiny and cheap so hundreds read as a cloud.

## The swim-cycle
`ph` drives the hop: a quick antennae flick + a small forward dart, then a glide. Subtle; the charm is in the collective. A faint self-glow dot keeps them visible in the dim.

## EXACT API
```js
// @kind fish
// @assetKey fish-copepods
window.__ASSET = function drawCopepod(ctx, p) {
  // ctx pre-translated/rotated to the mote (see fish-lancetfish.md).
  // p = { s(~2.4), L(~ s*1.0), col:'#e3c06a', ph, boil, light, TAU }
  // SELF-GLOWS faintly. Keep this VERY cheap — drawn for up to ~100+ motes.
};
```
- Must be extremely cheap (a couple of paths max). Deterministic given `ph`.

## How it wires in
Shared `art/fish.js`; the `graze` branch dispatches by species key (copepod vs vent-shrimp). The page draws the small outer glow halo; your antennae+body are the detail.

## Preview / judging
Same harness with `col:'#e3c06a'`; judge a single mote AND imagine the cloud.

**judgeFocus:** a tiny translucent copepod with trailing antennae and a copepod hop, faintly amber-lit — cheap enough that hundreds read as a living granular haze.
