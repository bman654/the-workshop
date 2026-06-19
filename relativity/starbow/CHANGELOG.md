# The Starbow — CHANGELOG

A first-person isotropic star dome you fly toward `c`. The wing's brass `#throttle`
drives a per-frame relativistic-aberration reprojection: the whole sky sweeps
**forward** into a tightening bright **headlight** ring while the rear thins and
darkens, the front blues and the back reds (relativistic Doppler). Switch off
relativity and the headlight dies — the load-bearing negative control. A leaf of
**The Moving Frame** wing (`relativity/`), reached in-wing only (NO new front-door
footprint). Kin to The Twin Voyage and The Light Clock.

## #167 (2026-06-19) — bloom

Ripened the `[bench]` **The Starbow** seed (sown #162) into `relativity/starbow/`.

**The form (soul first).** You stand inside an even sky — 1400 stars scattered
area-correctly (`cosθ = 2u−1`, seeded `mulberry32(0xCA11AB1E)`). Push the throttle
and the dome reprojects every frame through `CORE.relativisticAberration`: an
equidistant-azimuthal fisheye (R = 0.46·min(W,H)); `kelvinToRGB(restK·D)` colors
(blue front / red rear); `D^2.2` beaming with `lighter` compositing so the forward
crowd blooms into one headlight disc. A tightening brass 80%-ring (boundary star
`cos₀ = −0.6`) + a "forward 80% within: NN°" readout shrink as β→c (127°→49° at
β=0.9). Look-heading 0..π swings the camera ahead→astern (dark/red rear). A
RELATIVISTIC→CLASSICAL rocker swaps in `classicalAberration` (D≡1, flat). A green
proof pill runs the 5 claims live; `window.STARBOW` is exposed for the twin.

**The math (single source of truth).** `relativity/core.mjs` — the estate's SOLE
SR authority — grew INSIDE the `CORE-BEGIN/END` byte-twin slab by three exact
functions: `relativisticAberration`, `dopplerFactor`, `classicalAberration` (added
to exports). The SAME slab text is inlined byte-for-byte into `relativity/index.html`
AND `cavern/light-clock/index.html`; both importers' probes + M-maps were extended
to cover the three new functions, and a reciprocal Starbow kin line added to both
footers. Node twin `relativity/core.test.mjs` = **22/22 EXIT 0** (was 16/16): new
block (9a–9e) asserts the headlight max θ′ = 0.115° at β→1, a star bijection
(4001 in = 4001 out, inverse round-trip 3.77e-15), Doppler round-trips to 1 with
D(·,0)=1 exact, blue-ahead / red-behind, and the classical control FAILS the
headlight.

**Math corrected from the seed.** The #162 seed text and the estate's earlier
optical "aberration" hits stated the OLD/incorrect forms. The build follows the
verified physics: aberration is `cosθ′ = (cosθ + β)/(1 + βcosθ)` (the sky bunches
**forward**, +β), and Doppler is `D = (1 + βcosθ)/√(1−β²)` — **not** the reciprocal
— giving blue-ahead `D=4.36` / red-behind `D=0.23` at β=0.9, round-tripping to 1
and `D(·,0)=1` exactly. The copy says "brighter forward, by relativistic beaming"
and never labels the on-screen `D^2.2` as the true `D⁴` (a deliberate perceptual
compression so the disc doesn't clip to white).

**Publisher fresh-eyes (#167): NO bug, no polish.** Verified on an own http server
(127.0.0.1:8744, torn down by exact PID) in a uniquely-named agent-browser session:
pill 5/5 ✓ at 1280 AND 390 px, 0 horizontal overflow both, 0 nested anchors, 0
console errors. Drove β→0.9 live (visible forward headlight bloom + blue-front /
red-rear + ring tightening 127°→49°); flipped CLASSICAL → headlight died, stars
spread even, colors flat, ring widened to 73° (the neg-control, screenshots
confirmed); swung the heading astern → dark/red rear. The two grown-slab siblings
held: Twin Voyage 7/7 ✓, Light Clock 8/8 ✓, both reciprocal Starbow kin links
resolve. All footer-family links HTTP 200.
