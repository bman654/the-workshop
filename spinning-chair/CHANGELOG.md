# The Spinning Chair — changelog

## Birth (cycle 255)

The Midway's ninth lit ride: **"pull your arms in, spin faster."** A side-on figure
skater on a free brass pivot, already turning when you arrive — the room is the spinning
thing itself. The trick is one conserved number, drawn, not charted.

**The law.** A skater spins on one blade on a free, frictionless pivot, arms held straight
out holding two brass weights — two point masses `m` on massless rigid arms at radius `r`
about a body of fixed moment `I₀`. The rotor's moment of inertia is `I(r) = I₀ + 2m·r²`.
The pivot is free, so no external torque acts and angular momentum `L = I·ω` is conserved.
Pin it at the arms-out radius `A`: `L₀ = I(A)·ω_A`. From then on the spin is **forced**, not
chosen: `ω(r) = L₀/I(r)`. Tuck the arms (r: A→B, B<A) and `I` shrinks, so `ω` rises by
**exactly** the inverse ratio — `ω(B)/ω(A) = I(A)/I(B)`. With `I₀=1.2`, `m=4`, `A=0.78`,
`B=0.16`, `ω_A=1.6`: the skater spins up by ≈2.7×. *She made herself small, and the world
sped up.*

**The energy.** `L` is kept but kinetic energy is **not** — it rises by
`ΔKE = ½L₀²(1/I_B − 1/I_A) > 0`. Nothing added that energy to the spin; it is the **work
your arms did**, hauling the weights inward against the centripetal demand `m·ω(r)²·r` at
every radius. The self-test integrates that arm-work (`∫ 2m·ω(r)²·r dr`, using the
conservation-consistent `ω(r)`, by composite Simpson on 20000 panels) and confirms it
equals `ΔKE` to <1e-9 — the energy book closed three independent ways (closed form, KE
difference, arm-work integral). A neg-control on the integral proves a **naive constant-ω
force does NOT close the book**, so the integral is non-vacuous.

**The embodiment.** The fast spin is a **motion-blur fan**: nine ghost copies of the
skater outline fanned about the pivot, opacity fading behind a **crisp leading body** (head,
torso, planted blade, two gold weight-discs at the arm-ends, a thin gold rim-light on the
leading edge). The fan's outer radius is the live arm-span; its angular spread (blur-width)
is read straight off `ω(r)=L₀/I(r)`. As the arms tuck the fan **shrinks in reach AND widens
into a whirring disc** at once. A faint radius-of-gyration ring visibly shrinks as `I`
drops; the weights leave short fading comet-trails whose pitch tightens with spin (pure
decoration — out of the proven claims). Pull / let-out are reversible: she slows to exactly
the start, proving it's no ratchet. The blur persistence and trails are **rendering** choices
and feed no tested number.

**The instrument rail (estate brass).** Live `ω` (rad/s, rising as you pull in); a
**pinned-L bar** with a teal tick at `L₀` that the bar never leaves on the free pivot (the
"nothing was added" proof, shown as stillness); a rising **KE fill** captioned where it came
from ("your arms did the work pulling the weights inward against their fling"); and a ratio
plate reading `ω(r)/ω(A)` confirmed `=== I(A)/I(r)` live.

**The neg-control (the teeth) — clamp to a motor.** A toggle bolts the pivot to an external
motor (iron housing + drive belt, the disc greying to a driven coral state) driving a
**fixed ω**. Now two things break at once: pulling the arms in changes the spin **not at
all** (the fan's blur-width is frozen — the motor pins ω), and the once-pinned **L bar
swings free** (coral) — with ω held and I shrinking, `L = I·ω` is no longer conserved, the
motor pouring/eating angular momentum. The exact **inverse** of the free pivot (there ω
varied and L held; here ω holds and L varies). One diegetic label rides the housing: *"an
external torque holds ω — so L is no longer yours to keep."* The self-test proves the clamp
ratio `L_clamped(B)/L_clamped(A) === I(B)/I(A) ≠ 1` by a margin bounded from zero, with
equality only at `r=A` — a non-empty disagreement, so the suite cannot pass vacuously.

**The parity standard.** `core.mjs` is the sole authority; `index.src.html` inlines it
byte-for-byte between `// ===== SPINNING-CHAIR CORE (inlined byte-twin) BEGIN/END =====`
(forged to `index.html`). The in-page chip calls the SAME `runSelfTest()` the Node twin
(`core.test.mjs`) runs; the twin re-extracts each inlined function char-for-char and asserts
the chip count == the Node count, ok-for-ok and name-for-name. `node core.mjs` exits 0
(8/8); `node core.test.mjs` exits 0 (28/28, including re-extraction parity); the in-page
chip shows 8/8.

**Map.** Registered as a front-door POI in the grounds/amusements wing on the `pavilion`
footprint (a domed plan with radiating ribs to a ring — reads as a top-down turntable with
radial arms). Sister ride: **The Rotor** (next door on The Midway) — another spin that does
something to a rider, but by a different law: there the wall pins you by centripetal friction
`μω²r ≥ g`; here you spin *yourself* up by conserved `L = Iω`. Also cross-linked to **The
Equal-Area Sweep**, the estate's other conserved-L piece (orbital L vs rigid-body L).

**Honesty.** Two point masses on massless rigid arms, a frictionless bearing, quasi-static
retraction so `L` is exactly conserved at every instant. A real skater's distributed arm and
torso mass means the literal ω-ratio differs — the law is exact for the point-mass model. ω
is reported as illustrative turns/sec for feel.
