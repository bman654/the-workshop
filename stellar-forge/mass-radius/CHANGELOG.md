# The Heaviest Dwarfs Are the Smallest — CHANGELOG

A Stellar Forge bench: the SIZE companion to the Scales' FATE. Two real luminous spheres on one
shared track. LEFT, a white dwarf held up by electron degeneracy pressure; RIGHT, the ordinary
body intuition expects. Drag the brass collar to add mass: at M₀=0.90 the two are dealt the same
radius, then one push splits them forever — the dwarf shrinks (R ∝ M⁻¹ᐟ³, the inversion) while the
ghost grows (R ∝ M⁺¹ᐟ³). Past Chandrasekhar (≈1.44 M☉) the dwarf irises shut to a point while the
ghost sails on. The radius IS the readout; you never classify.

## The claim, proved exact (core.mjs + core.test.mjs, byte-inlined into index.html)

Four load-bearing facts, each in `runSelfTest()` and re-derived independently in the Node twin:

1. **Opposite-sign monotone slopes** — over ≥500 adjacent-pair samples on [0.5, 1.44), R_deg is
   strictly decreasing AND R_norm is strictly increasing (not just endpoints).
2. **Chandrasekhar from the exponent** — R_deg(M_CH) === 0 to machine ε (driven by the relativistic
   factor √(1 − (M/M_Ch)^(4/3)), scaled to land exactly at 1.44); R_deg(1.43)/R_deg(M₀) ≈ 0.12.
3. **Negative control** — a +1/3 body never pinches: R_norm is bounded below by R_norm(0.5) > 0
   across the sweep and stays positive at/past M_Ch. Removing the relativistic factor from the
   degenerate law (pure S·M⁻¹ᐟ³) also stays strictly positive at M_Ch — so the pinch is the factor's
   doing, not the negative exponent's and not a magic floor.
4. **The crossing is unique** — sign(R_deg − R_norm) flips EXACTLY ONCE over the sweep, at M₀=0.90.

S_deg and S_norm are scale constants chosen ONLY to deal the bodies equal at M₀; the load-bearing
claim is the EXPONENT SIGN and R→0 at M_Ch, not absolute SI radii (stated Hawking-style in the
proof footer).

## Architecture

- `core.mjs` — the laws, the scale constants, and runSelfTest(). Zero-dep ESM.
- The page inlines the core byte-for-byte between the `MASS-RADIUS CORE` sentinels; the in-page
  pill runs the SAME runSelfTest.
- `core.test.mjs` — runs the page's runSelfTest (all green), does independent Node-only
  re-derivations (monotone slopes, pinch, dealt-equal, unique crossing, the swap, domain guard),
  asserts the negative control, and byte-parity-checks the inlined region against core.mjs.
  `node core.test.mjs` exits 0 = green. (26/26 checks.)
- `window.__massRadius = { runSelfTest, CORE, rDegenerate, rNormal, state }`.

## Idiom

Native Stellar Forge idiom — copied scales/'s :root vars, topbar, headline+sub, dock lede, proof
footer, selftest pill, and lifted paintSphere / collarGeom / M2x/x2M / the brass bead / the
easeOutCubic iris / colorTempForDwarf verbatim. No foreign stylesheet. Honors
prefers-reduced-motion (snaps radii to the law's value, non-animated pinch).

## 2026-06-21 — built (BUILD/garden #257)

Initial build. Registered: card on the Stellar Forge landing (◐, --hue:#7fd0ff), a sibling
sentence in scales/'s proof footer, and a workbench entry under Toys & benches. Breadcrumb
`ws:seen:mass-radius`. No new top-level POI / no new bigSwing (a bench inside the already-built
Stellar Forge wing — M stays 23).
