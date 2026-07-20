# In the Round — changelog

The estate's FIRST real-time orbitable 3-D: a gilded brass armillary you grab and
TURN in true depth. The vantages wing's THIRD room in kind (kin to The Vantage and
The Sightline) — where those resolve a flat figure from a found POSE or PATH, this
one hands you a SOLID and lets you rotate it, its opaque rings honestly eclipsing
one another as your eye comes round. Delight-first, claim-free — the depth itself is
the payoff.

## #421 — founded (BUILD / grounds — a DEEPEN of the vantages wing)

**The piece.** A nested gilded armillary: named reference rings (equator, the 23.4°
ecliptic, meridian, two colures, horizon) rendered as OPAQUE brass BANDS (annulus
quad faces, not wire, so a near ring truly eclipses a far one), a smooth
radial-gradient gilt terrella with a specular hotspot + bloom, a bead-sun riding the
ecliptic, pole beads and a polar rod. Drag to orbit, shift-drag to roll, grab a ring
and it keeps spinning with inertia, wheel/arrow to dolly. Two further payoffs: sight
two rings EDGE-ON and they collapse onto blazing gold co-sight lines with a lit
"SIGHTED …" banner; dolly INWARD and the gilt heart engulfs you as the hoops wrap
past the frame. Anisotropic brushed-brass BRDF + patina in the shadow valleys and a
travelling engraved graduation so a symmetric hoop's spin reads. An idle beadDrift
gated by reduced-motion AND the shared `ws:pref:muted`.

**The engine (shared infrastructure, general on day one).** The room stands on a new
reusable core, `tools/scene3d/core.mjs` (136 lines, DOM-free): `project(p,cam)`
GENERALISES the vantages camera's `projectNorm` UNFORKED — at the real FOCAL=2.4 with
roll=0 it is `projectNorm` byte-for-byte; roll is a live extra degree of freedom
twisting the image plane. `applyDrag` is the one orbit mutation the handler and the
twins share; `render()` returns a depth-sorted far→near draw list with backface cull;
`occludedAt()` answers the eclipse query. The core carries BOTH primitive kinds
(`{seg, face}`), so the family's promised kin — a knot you finally turn, a
polyhedron, a molecule — are now just geometry, not new engine.

**Claim-free, but the payoff is proven to FIRE.** No theorem; the sole build-owe is a
payoff-liveness twin. `tools/scene3d/core.test.mjs` (10/10) proves the unforked
camera identity against the REAL vantage import plus a seg fixture AND a face fixture,
`applyDrag` orbit, backface cull, occlusion, and parallax. `in-the-round/liveness.test.mjs`
(9/9) drives the room's OWN real functions headless: a drag orbits the real scene, a
near band eclipses a far one OFF the actual sorted draw list (different rings),
near-parallax exceeds far, reduced-motion gates the drift, the shared mute is honored,
and the built page byte-parity-matches the sentinel-wrapped core.

**Placement.** A DEEPEN of the observatory's Vantages wing (grows the Vantages' exact
frozen camera into a body you turn), not a detached front door — it stands beside Cor
Caeli under one roof, and the wing now holds 2 real rooms. Registered as a front-door
PLACES entry (district observatory · wing vantages · tier 2); reciprocal cross-links
to The Observatory (front door) and The Vantages, and a gold-tinted `.xlink` return
link added on the Vantages page (a cross-reference, not a hub-lit link, so no manifest
double-claim). `vantage/core.mjs` + `core.test.mjs` are byte-untouched.

**A red-letter day.** The estate was FLATLAND — every sky, knot and solid pressed to a
plane. This is its first departure from that: a tier-2 era anniversary
(`In the Round`, 2026-07-20) marks the day the estate first stepped off the flat page.
