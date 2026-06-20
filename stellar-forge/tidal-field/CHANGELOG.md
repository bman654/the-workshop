# The Tidal Field — changelog

## Cycle 184 — bench bloomed (garden)

**THE TIDAL FIELD — The gradient is the tide.** The Stellar Forge's fifth bench. Gravity at a
distance is stronger on the near side than the far; that *difference* — not the strength of the
pull — is the tide. The bench acts it out with two hands on one tank around a single host well:
**release a ring** of free-falling beads and watch the circle reshape into a prolate **tidal egg**
(it stretches, it never inflates); **drag a moon** inward until at the dashed **Roche edge** its own
gravity loses to the tide and it **shears into a planetary ring**. The whole claim is sealed by a
neg-control: throw the **uniform-field** toggle (same pull, zero gradient) and both go dead — proof
the gradient was the tide-maker all along.

### The form — `index.html` (one dark-forge `<canvas>` tank + a subordinate two-gauge column)
- **The hero stage**: a Dark Forge tank with one luminous **host well** at world (18, 33) — the
  amber core is a star, not a black hole. Two verbs share the one tank:
  - **Verb 1 — release the ring** (`↯ release the ring`, or the **R** key): a ring of 24 free-fall
    beads, each a real point mass stepped under the field at its OWN position by velocity-Verlet at
    the same fixed `PHYS_DT=0.02` the Node twin uses. The near edge outruns the far (radial stretch),
    the sides converge (transverse squeeze) → a prolate egg pointing at the well. The whole ring is
    frozen the instant its nearest bead reaches the host surface (before the 1/r² singularity can
    slingshot a bead and scramble the egg).
  - **Verb 2 — drag the moon**: the violet moon is a self-cohering cluster; drag it toward the well,
    cross the dashed Roche marker, and it shears — wrapping the host into a thin planetary ring.
- **The subordinate gauges** (explicitly secondary to the tank):
  - **The trace cartouche** (verb 1's quiet center): the linearized tide per unit separation —
    `a_radial = +2GM/r³`, `a_transv = −GM/r³`, and the headline **trace = a_radial + 2·a_transv → 0**
    held as `0.0 (exact)`: the tide is *pure shear* (it reshapes, never inflates). Live **L_radial**
    (amber) / **L_transverse** (violet) calipers projected toward the host well — the true fall line.
  - **The shear needle** (verb 2's gauge): `S = tidal stretch / self-gravity = (d_roche/d)³`, a needle
    that swings from *held* (S<1) through 1 to *sheared* (S>1), with live `distance d` and `Roche d`.
- **Four knobs + the neg-control**: moon density ρ\_m (denser → smaller Roche, cube-root) · host
  radius R\_M (bigger → Roche outward, linear) · host density ρ\_M (cube-root) · moon radius r\_m
  (changes the *look* only — the Roche limit does NOT move, r\_m cancels) · **uniform-field toggle**
  (replaces each bead's own-position field with one common g — kills the gradient).
- **Accessibility / responsive**: the tank is a focusable canvas (R releases, arrow keys walk the
  moon); knobs are keyboard sliders; `prefers-reduced-motion` stills the loop. Responsive flex layout
  stacks to one column on narrow screens — verified no horizontal overflow at 1280px or 390px.

### The math crux — `core.mjs` + `core.test.mjs`
- DOM-free, zero-dep ESM. `G≡1` in scaled units; a single param shape `p={G,R_M,rhoM,rhom,r_m}`. Every
  claim is a dimensionless **shape/scaling law**, never a catalogue number. Pure exports:
  `fieldAccel`/`uniformAccel`; `tidalTensor`/`tidalAccel`/`tidalRadial (+2GM/r³)`/`tidalTransverse
  (−GM/r³)`; `selfGravity`/`tidalStretch`; `rocheLimitRigid` (DERIVED from `g_self===a_tide`, r\_m
  cancels) / `rocheLimitFluid` (the 2.44 coefficient, named); `shearMargin=(d_roche/d)³`; `moonState`;
  velocity-Verlet `stepBeads` + `beadAccel`; `makeRing`/`ringCenter`/`ringAxes`; and `runSelfTest()`.
- **`ringAxes(beads, well=[0,0])`**: projects the radial axis r̂ toward the well, t̂ perpendicular, and
  returns the egg's extents `{Lrad, Ltrans}`. The well-center is an OPTIONAL parameter defaulting to the
  origin so the Node/test frame (well at [0,0]) is byte-unchanged; the page passes `[HOST.x, HOST.y]`.
- Inlined byte-for-byte into `index.html` between the `TIDAL-FIELD CORE` sentinels; the Node twin
  byte-parity-checks the page copy against `core.mjs` (indentation-normalized).
- The proved legs: the trace-free `+2/−1−1` tidal tensor IS the gradient of the point-mass field
  (central-difference vs analytic tensor relΔ ~2e-10); the `−3` power law over a far decade; the Roche
  limit `g_self === a_tide` solved both algebraically and by bisection (`|root − d_roche| < 1e-9`); the
  full-field crossing of `S=1` EXACTLY at `d_roche`; the **NEG-CONTROL** that under a uniform field the
  ring falls rigid (max pairwise drift < 1e-9, `Lrad/Ltrans ≡ 1`) and the moon never shears at any
  distance, while at *identical |g|* the full field DOES deform — i.e. the gradient, not the magnitude
  of pull, is the tide-maker.
- `node core.test.mjs` → **32/32**, page self-test **8/8**, byte-parity **IDENTICAL**, EXIT 0.
  In-page pill `✓ 8/8 self-test`; `window.__tidalField.runSelfTest().ok === true`.

### Bug caught at build (root-cause fix, recorded for posterity)
The bench shipped from a prior interrupted seat with a **swapped-caliper bug**: `ringAxes()` had
hard-coded the radial axis toward the world ORIGIN (`r̂ = −C/|C|`), correct only when the well is at
[0,0] (the test frame). The page's well is at (18, 33), so the live calipers and the L\_rad/L\_tra
readouts came out SWAPPED — reporting the egg as transverse-long when the rendered egg was correctly
radial-long. **Fix**: gave `ringAxes(beads, well)` an optional well-center defaulting to origin (Node
+ test behavior byte-identical, all checks still pass) and pointed the page's two call sites at
`[HOST.x, HOST.y]`. Post-fix the calipers read **L_rad 15.49 > L_tra 5.02**, matching the rendered egg.

### The wing
- `../index.html` (the Stellar Forge landing): a **fifth** `a.card` (violet `--hue:#b98cff`, glyph ⊙,
  kind `bench · self-proved`) naming both verbs + `shearMargin` / the Roche marker / the uniform
  neg-control. The lede became a five-bench lede; the footer now reads *"Five benches."*. The landing
  self-pill winks `trace=0` and `S=1` → `✓ gates · T∝1/M · v²r=M · trace=0 · S=1`. Breadcrumb
  `ws:seen:stellar-forge-tidal-field` drops on visit. No new front-door POI — this lives inside the
  already-mapped Stellar Forge wing.
- Reciprocal cross-link with **The Rotation Bench** (the only sibling that uses the `Companions:`
  convention; the three legacy benches predate it and were left untouched).

### Verified (fresh-eyes publisher review, cycle 184)
- `node core.test.mjs` → 32/32 green, byte-parity IDENTICAL, EXIT 0; in-page pill green 8/8.
- `node tools/forge/forge.mjs --check --all` → all 46 files current (no `.src.html` touched).
- agent-browser (uniquely-named session, http on an uncommon port, both torn down by exact PID):
  release the ring → prolate egg pointing at the well, calipers **L_rad 15.49 > L_tra 5.02**, trace
  held `0.0 (exact)`; drag the moon to d=12 (inside Roche 15.87) → **S=2.31, sheared**, wraps into a
  planetary ring; uniform toggle → rigid circle, **L_rad == L_tra == 7.68** (ratio 1.0). Wing landing:
  5 cards, the Tidal Field card present, breadcrumb drops, all sibling links + the reciprocal cross-link
  resolve 200. No horizontal overflow at 1280px or 390px; console clean.
