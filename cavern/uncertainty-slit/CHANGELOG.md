# The Squeeze — changelog

## Cycle #150 — first bloom (2026-06-18)

**What it is.** A single-slit uncertainty bench: the Heisenberg trade made touchable. Drag the
brass jaws of a slit shut and the beam fights back — pin the particle's **position** Δx tight at
the gap and its sideways **momentum** Δp must fan wider on the screen, so the product Δx·Δp can
never fall below **ħ/2 = 0.5** (natural units, ħ=1). The hero verb is **SQUEEZE**; the hero readout
is the **speckle band's width** on the screen plus a **gold needle riding a glowing forbidden
floor** — no curve is the hero.

**The touchable stage (one canvas, three zones, no axes).** A faint warm emitter at far left feeds
a slow contemplative spark stream toward the slit. Two `--wall-red` brass jaws with a soft inner
bevel form the aperture; the **gap shows the profile difference before anything lands** — the
Gaussian gap is a soft feathered transmission gradient, the top-hat gap is a hard-edged bright bar
with crisp shoulders. To the right, particles land as glowing gold speckle accumulating into a
band whose **width IS Δp**.

**The hero gesture.** Pointer handlers on the canvas, geometry committed from `pointermove`/`up`
(never a bubbled click — honoring the estate's `<g>`/click landmine). `hitJaw` zones top / bot /
gap; grabbing the **gap squeezes both jaws symmetrically about CY** (the soul gesture), a single
jaw narrows from one side. `setPointerCapture`; `pointerup` bound on `window` (release outside the
canvas still ends the drag); `pointercancel`→`onPointerUp`; `canvas{touch-action:none}`. Every
authority — jaws, the Δx slider, the keyboard — funnels through **one `writeA(a)`** that clamps,
maps a→slitHalfPx (cosmetic), calls `core.live()`, and refreshes the readout + needle + speckle.

**The non-negotiable honesty rule.** The needle and the readout rows read `core.live().product` —
the deterministic **exact** value — **never** a Δp recomputed from the rendered speckle. The
speckle is the *visual* of |Ã|²; the needle is the core number. That is what makes "rides above the
floor, never crosses" literally true rather than Monte-Carlo-jittery.

**The forbidden floor (geometry, not a caption).** A panel mini-gauge draws ħ/2 = 0.500 as a 2px
red line with a downward glow bleeding into a 45° hatched "forbidden" band. The needle is a gold
marker at `core.live().product`, **render-clamped** so it is structurally impossible to draw below
the floor. On Gaussian it descends and **kisses** the line (soft green bloom when `saturated`); on
top-hat it sits visibly above — the gap **is** the sinc-tail tax. The readout cell turns green
only when `saturated`.

**The physics core (ħ=1, byte-twinned).** `core.mjs` exposes `deltaX`, `deltaPgauss` (closed form
1/2σ — the exact saturating oracle), `deltaPtophatWindowed` (Simpson on k∈[−K,K], K=m·π/a, Ng=4000
— grid-stable to 8 digits vs Ng=200000), `product`, `live`, `farFieldSampler`, and `CLAIM`. The
block between the sentinels is inlined byte-identical into `index.html`; `core.test.mjs` re-extracts
and proves parity.

**The proof (`node core.test.mjs` → exit 0, all green).** (1) Gaussian saturates Δx·Δp = ħ/2 to ε
(max err 5.6e-17); (2) top-hat at the same Δx (a=σ√3) is strictly larger and equals
CLAIM.tophatProductM1 = 0.6076282894 to 1e-7; (3) a swept width × profile × window grid never dips
below ħ/2 (gauss min == 0.5, top-hat min 0.6076); (4) the window is monotone in m and scale-invariant
in a; (5) the far-field |Ã(k)|² matches a **forward FFT of A(x)** via the estate's certified
butterfly transform (top-hat first zero at k=π/a; Gaussian curve to <5%); (6) determinism; (7)
byte-twin parity. Nine proofs, all green.

**A11y + on-ramp.** A focusable `#jawSlider` (role=slider, vertical) sits over the gap; arrows /
Page squeeze/widen, Home=A_MIN, End=A_MAX, with `aria-valuetext` reading the live Δx/Δp/product. A
fading drag-hint invites the squeeze; a pulsing highlight on the gap on first load; both hide on
first interaction. Under `prefers-reduced-motion` the speckle jumps to its converged band and the
hint stays (no motion to invite) — the verbs still work.

**Aesthetic.** Lifts wave-packet's `:root`, fonts, body strata, topbar, and self-test pill markup;
rethemes only the per-bench accent `--q` to warm cavern-lamp gold (`#ffd27a`), keeping `--teal` for
the Cavern back-links, `--wall`/`--floor` red for the jaws and the forbidden floor, and `--green`
for the saturated readout.

**Registered** as garden growth on the Cavern index (a new lit `⊟` card after the Wave Packet, with
a relative-link self-test check), no front-door footprint.
