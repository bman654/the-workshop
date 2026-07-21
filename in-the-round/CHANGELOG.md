# In the Round — changelog

A room of solids you turn in true depth. It holds TWO halls on one engine and one
shell: **hall one**, a gilded brass armillary — an instrument you swing your eye
around; **hall two**, a trefoil knot in cast bronze on a turned bearing — an
object you turn in your hands.

It stands in the vantages wing (kin to The Vantage and The Sightline): where those
resolve a flat figure from a found POSE or PATH, this one hands you a SOLID and
lets you rotate it, its opaque faces honestly eclipsing one another as your eye
comes round. Delight-first and claim-free in both halls — the depth itself is the
payoff, and each hall owes only a twin proving that payoff FIRES.

## #431 — HALL TWO: The Cast Object (BUILD / grounds — a DEEPEN of this room)

**The piece.** A trefoil knot in sand-cast bronze, sitting on a turned bearing
plate under ONE lamp fixed in the room. Where hall one hands you an instrument to
swing your eye around, hall two hands you an OBJECT: you drag and it turns, heavy,
coasting on a flywheel (`exp(-dt/3.4)`, a hand's fling capped at ±3.1 rad/s,
settling to a faint idle drift). Because the lamp stays put while the piece
revolves — the camera orbits and the light vector is counter-rotated by the same
yaw — the specular streak WALKS the metal instead of riding your eye. That single
decision is most of why the bronze reads as metal rather than as shading.

Turntable posture: yaw turns the piece, pitch leans your head over it, and the eye
never goes below the plate. A low disc with 108 turned grooves and ONE inlaid brass
registration mark, so a 120° turn is legible against a shape with 3-fold symmetry.

**The shadow is the flat diagram — the room's one silent thesis.** The knot's
centreline is dropped onto the plate along the lamp direction and inked opaque. A
shadow has no occlusion to give: where it crosses itself it simply MERGES. So the
plate carries, live and unlabelled, the flat picture that cannot say which strand
is on top — directly beneath the solid that says it without effort. There is no
caption for this and no chrome pointing at it; you notice it the way you notice
things handling a real object. Two shadow registers off the SAME lamp: the inked
centreline is the core shadow (the diagram), the soft per-sample blobs the
penumbra (the mass).

**Claim-free.** No theorem, no accuracy pill, no HUD, no numbers anywhere.

**But the payoff is proven to FIRE.** `in-the-round/trefoil/liveness.test.mjs`
(12/12) and the in-page chip run the SAME body (`trefoil/probe.mjs`), so the two
can never disagree. Every clause drives the room's own entries — the real scene,
the real `shell.orbit()`, the real sorted draw list; never a synthetic pose, never
a screenshot, never a canvas pointer event: (1) a real drag re-ranks 94% of the
depth-sorted list; (2) at a crossing the far strand is occluded OFF that list via
`occludedAt()` (156 crossings found); (3) orbit through and the SAME arc-pair
resolves the other way — 31 pairs seen both ways, the payoff firing; (4) the near
crossing out-parallaxes the far by 5.75×; (5) `shell.orbit` keeps the eye above the
plate at both extremes; (6) the casting rests ON the bearing at both pitch extremes;
(7)+(8) the idle drift needs reduced-motion AND `ws:pref:muted` both open; (G)
byte-parity of all four inlined modules against their sources.

**The room shell (`in-the-round/shell.mjs`) — both halls now stand in it.** It
carries the orbit entry and its clamps, the flywheel, the stillness gate, the
canvas fit/DPR loop, and the drag binding; each hall declares its own POSTURE
(hall one free orbit, `dolly 1…9`; hall two a turntable, `pitch 0.055…1.16`,
`dolly 3.05…6.2`) and its own extra verbs (hall one's shift-roll and grab-a-ring
spin). Hall one's behaviour is unchanged and its twins stay green (9/9, and the
core's 10/10).

**The clamp lives in the shell, not the handler.** A room-level camera constraint
must sit where BOTH the DOM handler AND the twin enter. Put it in `pointermove`
and a scripted `applyDrag` flies the camera under the floor — the twin then
blesses a pose no visitor can reach. Here that is load-bearing for correctness,
not taste: the plate is painted BEFORE the solid, which is only truthful while the
eye stays above its plane.

**Two real bugs caught in-browser, fixed in the shell.** (a) A pointerup can go
missing — the pointer is released somewhere the element never hears about — and
the room then sat in drag state forever: no coast, cursor stuck, unrecoverable.
The shell now ends a gesture on window-level pointerup/pointercancel,
`lostpointercapture`, and blur. (b) The flywheel only clamped on release, so with
the release missed it was carrying 21 rad/s — seven times the cap — ready to spin
the casting into a blur. The cap now applies where the value is WRITTEN, so no
path can hold an illegal one.

**Material notes (all measured, not guessed).** The quads are filled with a linear
gradient across the circumference, so adjacent quads meet in the same colour and
16 sides read perfectly round. That leaves the ALONG-the-tube axis with no
gradient to hide behind: at the highlight, consecutive rings measured an 18-level
jump — a visible ladder climbing the lit side. So the mesh was rebalanced toward
that axis (520 along × 16 around, same quad budget), the grain made low-frequency
and evaluated per gradient endpoint (a per-quad constant is a flat tile by
construction, and it was drawing a literal grid), and each face stroked with its
own gradient rather than one end of it. 60fps at DPR 2.

**Placement — a DEEPEN, and it is not a close call.** This is the same engine, the
same room shell, the same subject (a solid you turn), and hall one's own founding
note already promised "a knot you finally turn" as kin. It rides WITHIN In the
Round as hall two, presented off the landing in a first-class `hall-link` idiom and
registered as a manifest exhibit under that room (`INTERNAL`, `internal-links`) —
no new front-door footprint, no new wing slug, no new star. The observatory reads
31 pieces where it read 30. Founding a separate room for it would have been a
grand name over a second dot in the same family.

### Caught in the fresh-eyes pass (publisher, same cycle)

**The silent thesis was invisible — the shadow's two registers had inverted.** The
caption sends you to the plate ("then look down at what it throws on the plate"),
and the plate was mud. Measured, not eyeballed: sampling the plate band, its darkest
pixels read **3.9** while the inked centreline paints at **rgba(5,5,5,.94) ≈ 5**. The
penumbra was drawn `rgba(3,3,3,.42)` *per sample* — N of them, accumulating — so at
the crossings, where strands crowd and blobs pile thickest, it saturated to pure
black and swallowed the ink. The diagram was being drawn dark-on-DARKER at exactly
the place the whole room is about. Fixed at the root rather than by thickening the
ink: the penumbra now bottoms out at `PENUMBRA_FLOOR = 12,11,10` — above the ink,
below the room's ambient `AIR = 20,19,18`. That is also the more honest reading, a
plate in shadow falls toward the room's ambient and never beneath it. The plate's
darkest pixel is now **5.0**: the ink is the darkest mark on the plate *by
construction*, the diagram reads at native size, and the turned grooves survive
under the mass. **A shadow register must never be darker than what it is a shadow of.**

**The twin could have blessed a posture the room no longer had.** `probe.mjs` was
constructing its shell from its own copy of the limits (`pitchMin 0.055, pitchMax
1.16`, the flywheel four) — retune the turntable in the page and the twin goes green
on the OLD numbers, still measuring clearances at poses no visitor can reach. The
probe already refused this trap for the mesh (`NSEG` comes from `D.N`, never a copy);
the posture now travels the same road. `POSTURE` (limits · speed · flywheel · home
pose) lives in `scene.mjs` and reaches page and probe through the one `D` bundle, so
neither can hold a private copy. Verified the guard actually bites: retuning
`scene.mjs` to `0.30…0.90` makes the twin re-measure at the new extremes
(`pitch 0.3: 58.2px · 0.9: 105.0px`) instead of reporting the stale pair. Readings
otherwise identical — 12/12, byte-parity intact — so the refactor is behaviour-preserving.

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
