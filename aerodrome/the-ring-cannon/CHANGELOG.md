# The Ring Cannon — changelog

`aerodrome/the-ring-cannon/` · a nested exhibit of **The Aerodrome**

---

## 2026-07-30 · built

A hall eleven metres long, a barrel with a rubber drum on the back of it, and a
candle seven metres out. Thump the drum and a vortex ring crosses the hall at
nearly the speed it left, at nearly the size it left, and puts the candle out.
Blow the same push out of the same hole **without the rotation** and it stops
before the second metre mark, at a third of a metre per second, spread over
two-thirds of a metre, with two per cent of its smoke still where you can see it.

**Files**

| | |
|---|---|
| `rings.mjs` | the engine. Vortex filaments, the exact-segment Rosenhead–Moore kernel, the spectral band limit, Lamb–Oseen core spreading, the wall image, the **independent** coaxial two-ring reference model in complete elliptic integrals, and the self-similar puff. Pure, DOM-free, **no backtick anywhere**. |
| `rings.test.mjs` | the Node twin — 87 checks, A through L. |
| `render.js` | WebGL2. Hall geometry, GPU smoke advected by the same kernel, absorption composite. |
| `index.src.html` → `index.html` | the room. |

**Claims, and how they are settled**

1. **δ = a·e^(−3/4) is exact, not fitted.** The regularised loop translates at
   (Γ/4πR)(ln(8R/δ) − 1); Kelvin's ring goes at (Γ/4πR)(ln(8R/a) − ¼). Setting
   them equal gives a closed form. `calibrateMu()` bisects for δ numerically at
   four core thicknesses and walks in on e^(−3/4) (0.4716, 0.4721, 0.47232,
   0.47235 for a/R = 0.1, 0.05, 0.02, 0.01).
2. **The ring flies at Kelvin's speed.** Resolution ladder −1.44 % → −0.24 % over
   N = 32…128; at the room's own N = 64 it is **−0.47 %**, and live in the panel
   the measured centroid speed lands within a few tenths of a per cent.
3. **The leapfrog conserves impulse.** R₁² + R₂² drifts under **500 ppm** over two
   seconds and six exchanges while each radius swings 55 → 153 mm.
4. **And it is not an artefact of the filament.** The elliptic-integral pair model
   (no Biot–Savart, no nodes, no regularisation, no band limit — the twin greps
   the source to prove it) agrees to 1.6 % of R and 26 mm after a second.
5. **The puff loses.** Same impulse. The ring reaches the candle in 2.3 s; the puff
   is at 2.19 m by then and needs **107 s** to cover the same ground, arriving at
   19 mm/s with 0.14 % of its smoke.

**What is honest and not exact** — Γ never decays (Helmholtz, taken literally; real
rings lose their punch to turbulence and this room does not model that). Core
spreading uses an entrainment stand-in ν, a labelled knob. Γ = ½U_pL is the slug
model. The puff's α = 0.11 is the one empirical number. The candle's snuff
threshold is a rule, not a law. All of it is on the page.

**The band limit, and why it is 3.** A thin filament has nothing true to say about
wiggles shorter than its own core, and if you let it try, the wiggles are violently
unstable: a perfectly circular 64-node ring grows a sawtooth from 3 × 10⁻¹⁷ to
0.1 m in **0.12 s**, at every time step tried. The physical bound (λ ≥ 2πδ) is
K = R/δ ≈ 10; at 10 the ring is quiet for 2.2 s and then goes, at 4 for 4 s, at 3
it is still exactly circular after five. So the room takes K = 3 — **tighter than
the physics demands** — and says so. The twin proves the filter is exactly the
identity on modes 0…3 (and on a circle, to 10⁻¹⁴), so it cannot be propping up any
claim; every claim lives in mode 0.

---

*Next, if anyone wants it: a second cannon facing the first, so two rings meet head
on. A tilted mouth, so the ring is not coaxial and the wall image has to work in
three dimensions. A ring fired through the middle of another. And a hoop on a stand
that the ring has to pass through, which turns the whole hall into a game.*
