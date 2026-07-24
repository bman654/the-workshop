# The Torus That Owes Nothing — CHANGELOG

Curved Country's fourth hall · the Surveyor's fourth star. A molten-gold doughnut
you orbit in your hand while an accountant's ring sweeps the tube and the running
∮∮K dA climbs to +4π then lands, dead on 0. A doughnut owes nothing — for every
R, r. DELIGHT-FIRST (turn the jeweled ring, watch the books close), carried on
Explorer 1's drift-free closed-form math and Explorer 0's closing-arcs dial.

## Cycle 488 — planted
- **core.mjs** (zero-dep, DOM-free; forge-inlined between CORE BEGIN/END):
  `K(θ,R,r)=cosθ/(r(R+r cosθ))`, `bandLedger(θ)=2π cosθ`, the closed-form
  `ledger(θ)=2π(sinθ+1)` that drives the dial (drift-free by construction),
  `torusTotal` (2-D midpoint quadrature of the UN-simplified K·r(R+r cosθ), split
  outer/inner), `sphereTotal` (the +4π neg-control), and `dialState`.
- **core.test.mjs** (Node twin, 21 checks, all green): books balance to 0 (<1e-9);
  the +4π/−4π split; INVARIANCE across an (R,r) grid (K·dA=cosθ dθdφ is
  R,r-independent — a fudge fails it); the SPHERE neg-control (+4π=2πχ≠0, so a 0
  really reads the torus's topology); and dial↔proof (ledger(π/2)=+4π=outer-sum,
  ledger(3π/2)=0=total; bandLedger→0 at the zero-circles). Byte-parity of the
  inlined slab.
- **index.src.html / index.html** (forge-built): hand-rolled canvas-2D torus,
  painter's-algorithm depth sort, back-face cull, two materials by K sign (molten
  gold belt K>0 with a tight fake-specular sheen; matte slate throat K<0), hairline
  luminous zero-circles at θ=±π/2. Trackball orbit + inertia + idle breath, pitch
  clamped so the throat never goes edge-on, no zoom. The accountant's brass sweep
  ring lifts gold/slate flecks (slack at the zero-circles) that gather at the
  margin's closing-arcs ring-dial; a full pass climbs the gold arc to +4π and walks
  the slate arc home so the rim closes seam-to-seam, pointer on "0 · OWES NOTHING".
  Zero-beat: emblem stamp "χ=0 · ∮∮K dA=0 · PAID IN FULL", zero-circle pulse,
  settle glow, one soft brass settle-chime (muted by default per estate etiquette).
  A "show the working" drawer (closed by default) with the one-line cancellation and
  a neg-control toggle that morphs the object to a sphere (~3s) whose tally climbs to
  +4π and never comes back. In-page self-test chip (6/6) + a headless-drivable
  payoff-liveness twin (`window.__torus.liveness()`).
- **Estate wiring (DEEPEN — no new front-door POI):** claimed as an exhibit of the
  Curved Country hub (holonomy) via a new hallcard; reciprocal topbar links on the
  cone + triangle halls; `ws:seen:the-torus-that-owes-nothing` crumb; the Surveyor
  constellation grown 3→4 (sky.js members + catalog-polar star, mag 2); Card-Catalog
  star via the manifest. 🗝️ hidden inventory grepped clean before building.
