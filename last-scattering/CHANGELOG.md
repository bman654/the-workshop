# The Sky That Was Once Fog — CHANGELOG

## Last Scattering (founding) · cycle 266

The cosmology wing's **third room**, reached by reciprocal chips off **First
Light** and **The Fog That Cleared** (deliberately NOT a front-door PLACES tile
— the design specifies chip-only discoverability off the two existing cosmology
rooms, keeping the front door uncluttered). Where Recombination shows the moment
the fog let ONE photon go, this room shows where ALL of them went: stand inside
the **surface of last scattering** and the freed light paints the whole sky.

### The form (the soul-verb = TURN YOUR HEAD)
You are inside the oldest light. Every direction is the wall of last scattering.
The single gesture is the soul: **drag to turn your head** through a domed all-sky
map — and then **pull a brass redshift collar UP toward today** and the whole sky
cools in lockstep. Zero plotted curves — a thing you SEE and TOUCH.

- **Drag = yaw/pitch.** Yaw wraps cleanly at 2π, an inertial glide carries the head
  after you let go, pitch is pole-clamped. Re-centre, look-toward-cold-spot, and a
  graticule toggle are on hand. The head turns through the all-sky CMB map.
- **The brass redshift collar** (right rail, log-mapped z ∈ [0, 1400], top = high-z
  = cool, with a cream today-tick on the track). Pull up and the ENTIRE dome cools
  from the blinding ~3000K white wall (z=0) to the faint **2.725K cream** we measure
  (z≈1100). The temperature is what your hand did — the same metric stretch as First
  Light, with **no Doppler term** (z=0 ⇒ T===T_rec exactly; the isotropy is structural,
  `skyTemperature` has no angular argument — every direction reads the identical T).
- **GLARE → REVEAL.** When hot, a blaze wash drowns the 1-part-in-10⁵ ripple (you
  cannot honestly see the anisotropy against the blinding wall). As it cools the wash
  lifts and the freckles emerge as a labelled **×~10⁴ false-colour CMB map** — the
  structure made visible by an honest, declared gain, not faked into the uniform glow.
- **JUMP TO TODAY'S SKY** pill → z = 1099.917 (lands `skyTemperature` EXACTLY on
  2.725K) with the cream today-tick on the track.

### The physics core — the cooling IS the metric stretch
The core is a thin DOM-free spine that **IMPORTS** `temperature` / `onePlusZ` /
`redshift` from `../first-light/core.mjs` and re-exports them — **First Light is the
LITERAL source of truth**, not a re-typed copy. The room's whole temperature claim is
one line: `skyTemperature(z, Trec) = temperature(1 + z, Trec)`.

- The cooling is the metric stretch: `T_obs === T_rec / (1+z)` and `stretch === 1+z`.
- The EXACT invariant is `T·(1+z) === T_rec` (the headline 2.725K is honestly scoped
  as a <2e-3 rounding of 3000/1101 = 2.7248 — the engraved honest-scope footer says so).
- The shared **Planckian-locus** colour authority (`blackbodyRGB`, Tanner-Helland,
  lifted byte-faithful from `relativity/starbow`) drives `domeColour` (a two-stage
  honest map → #ffe9cf cream at the cold end).
- `mottle()` — a deterministic, RNG-free anisotropy field calibrated to **RMS = 1e-5,
  zero-mean** over the sphere (the texture is a true 1-part-in-10⁵ modulation, a
  texture not a claim; peak ≲ 5×RMS).

### The self-test — FOUR claims (the SOLE authority)
1. **A · cooling IS the metric stretch** — `T_obs === T_rec/(1+z)` AND `stretch === 1+z`
   over z ∈ [0, 1100] (< 1e-9).
2. **B · PARITY** — `skyTemperature(z, Tr) === first-light temperature(1+z, Tr)`
   (worst 0), plus a **wing-twin tripwire** `onePlusZ(1/1101, 1) === 1101` that fires
   RED if First Light's law ever moves under us.
3. **C · lands 2.725K at z=1100** — headline `T(1100) = 2.72480K`, the EXACT
   `T·(1+z) === T_rec` invariant 0, and Z_TODAY lands `skyTemperature` exactly on 2.725K.
4. **D · NO Doppler** — frozen metric z=0 ⇒ T===T_rec exactly + `T` monotone-decreasing
   in z (the whole dome cools in lockstep; isotropy structural — no angular argument).

In-page pill GREEN 4/4; `node last-scattering/core.test.mjs` exits 0 on **23/23** checks.

### The Node twin (core.test.mjs)
Mirrors the shared `runSelfTest`, then re-derives each claim a SECOND way: re-derives
`T_obs` against a hand-computed 1+z INDEPENDENT of `skyTemperature`; **re-imports
`temperature()` DIRECTLY from first-light** to re-prove parity; spot values (z=1 ⇒
1500K = T_rec/2); frozen-metric + monotone; the mottle RMS/zero-mean/determinism
battery; colour sanity (hot luminous, cold a dim cream wash). **BYTE-TWIN parity:**
index.html's inlined `// === LAST-SCATTERING CORE` slab is byte-identical
(indentation-normalised) to core.mjs (9483 chars both).

### A note on the forge-inlined cross-room import
The forge strips top-level `import` lines, so first-light's whole core is inlined into
a nested block inside the page IIFE, with only `temperature` / `onePlusZ` / `redshift`
hoisted to the room's scope (first-light's own `SCENE` / `runSelfTest` stay block-scoped,
no collision). The `import` in core.mjs sits ABOVE the CORE sentinels so the byte-twin
region matches the page's inlined slab. An unusual page shape — but it parses
(`node --check`) and the byte-twin proves the inlined slab is identical, not a copy that
can drift.

### The render
Two-layer equirect: a 720×360 sky buffer is built once per z-change; each frame an
inverse-warp re-indexes a resize-cached camera-ray buffer → 60fps pan, no WebGL.
Measured 60.0 fps in-browser.

### Honest-scope (non-negotiable, engraved)
The footer reads: *"uniform glow real; anisotropy ×~10⁴ to be seen — the structure is
1 part in 10⁵."* The uniform glow and its cooling are the real, proven thing; the
freckles are amplified by a declared gain so a true 1-in-10⁵ structure can be seen at all.

### Integration
- New top-level `last-scattering/`. NOT a front-door PLACES tile and NOT a card-catalog
  entry (per the design — chip-only discoverability). bigSwingsBuilt stays 24.
- **Reciprocal cross-links:** First Light's topbar gained a `↗ The Sky That Was Once Fog`
  chip; The Fog That Cleared (recombination) gained `↗ The Sky That Was Once Fog · the
  light streams out`; this page carries back-chips to both. All re-forged; all hrefs 200.
- Drops `ws:seen:last-scattering` on direct visit (verified in localStorage even though
  it is not a PLACES tile).
- The wing now reads in order: First Light dilates the patch · The Fog That Cleared
  recombines it · here is the sky we see.

### Publish-pass review (cycle 266)
Fresh-eyes review across all 3 surfaces (`ws-pub266`, server :8771 torn down by exact
PID 36912): re-ran the gate green (Node twins last-scattering 23/23 · first-light 25/25 ·
recombination 15/15 EXIT 0; in-page pill 4/4; `forge --check --all` all 80 current).
Drove the full loop LIVE — boots at the z=0 white wall; JUMP TO TODAY'S SKY → 1+z=1100 /
T=2.725K, dome cooled to cream, freckles emerged as a blue/red CMB map; a pointer-drag
panned the head (anisotropy blobs visibly shifted between before/after shots); both
reciprocal chips round-trip; honest-scope footer present verbatim; First Light's own
in-page self-test still 5/5 (unaffected by being inlined here). ZERO horizontal overflow
at 1280px AND 390px mobile (the panel stacks below the dome, chips wrap); 0 console errors;
no nested anchors. **NO bug found, ZERO product edits** — the build shipped clean.
