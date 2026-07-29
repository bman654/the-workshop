# The Gaffer's Bench — CHANGELOG

## born, 2026-07-29 — a craft, on a clock

`the-foundry/the-gaffers-bench/` — the Foundry's second bay and its first piece about
*forming* rather than about relaxing a field. A lump of hot glass on the end of a pipe.
Blow it, tilt it and let its own weight draw it out, squeeze a neck into it with your
finger, paddle the bottom flat, put it back in the glory hole before it stops listening.
Then jack a neck, crack it off, and blow across the mouth you made.

Grep-confirmed absent before this: nothing in 470 pieces had a **craft** in it — a thing
you perform with your hands, against time, that leaves an object behind.

### The one thing the room is about

**Glass has no melting point.** It has a viscosity that slides smoothly through fourteen
decades, and every single thing a glassblower does is a bet on where that number is right
now. The gauge on the right is the real instrument on the bench, and everything else in
the room is downstream of it.

### What is running

* **A Vogel–Fulcher–Tammann curve, fitted in code.** `log10 η = A + B/(T − T₀)`, solved
  from the three published fixed points of soda-lime float glass (working 10³ Pa·s at
  1015 °C, softening 10⁶·⁶ at 727, annealing 10¹² at 545). Three points, three unknowns,
  no fudge — and then the fit is asked for a fourth point nobody gave it. It puts the
  **strain point** (10¹³·⁵) at **514.9 °C** against a published 505–515. That is the
  twin's first check and it is out of sample.
* **The exact axisymmetric membrane balance.** 110 stations, each carrying a fixed mass.
  The cap balance gives the meridional tension from the pressure on the projected disc
  plus the weight beyond, minus the skin's 2γ; the normal balance closes it for the hoop
  tension; the plane-stress Newtonian law is inverted for the two surface strain rates.
  **Blowing and sagging are the same equation.** A sphere comes out at `pR²/12μt` and a
  hanging tube at `σ/3μ` — Trouton's ratio and all — and neither number is written
  anywhere in the code.
* **Stefan–Boltzmann as the clock.** Two faces of hot glass at 1300 K throw away a
  quarter of a megawatt per square metre and millimetres of glass hold almost no heat, so
  the piece falls ~30 K/s and you get about ten seconds. Nobody tuned the working time.
* **A mass ledger that cannot be cheated.** Thickness is never stored, only derived from
  the element masses; the remesh interpolates *cumulative* mass so its differences
  telescope back to the same total. Forty seconds of blowing, heating, sagging, jacking,
  paddling and eight thousand remeshes: worst drift **0.0e+0** relative.
* **The colour is a temperature** — `tools/blackbody/core.mjs`, the Firebox's
  Planck→CIE 1931→sRGB core, uploaded as a 256-entry table. Its second room.
* **The note is The Jug's law** — `sound-garden/the-jug/core.mjs` imported, not retyped.
  What this bench adds is that the mouth area and the enclosed volume were made by hand.

### The thing I did not put in

**A blown bubble stops itself.** The wall thins as the square of the radius, so the
inflation law is a finite-time blowup — but thin glass is exactly the glass that cools
fastest, and this viscosity curve climbs a decade per hundred kelvin, so the cooling wins.
Lean on the blow for fourteen seconds straight out of the fire and it settles at 118 mm
across with a 1.2 mm wall, the same as at four seconds. That is also why a real blown wall
comes out even. There is still a burst threshold in the core (0.12 mm) as a guard; in
normal play it never fires, and the room now says the true thing instead of promising a
pop.

### The twin — `node the-foundry/the-gaffers-bench/glass.test.mjs`, 47 checks, green

* the VFT fit reproduces its three fixed points to 1e-9 and **predicts the strain point to
  4.9 K out of sample**; re-fitting from three *other* points on the same curve recovers
  A, B, T₀ to 1e-8;
* the 12 in `Ṙ = pR²/12μt` is dug out of an energy balance done numerically — pressure
  work against `∫12με̇² dV` over the wall — and the residual is not slop: it is exactly the
  thick-wall correction `t²/12R²`, asserted to 6e-8;
* the real solver's sphere moves at the closed-form rate to **0.24 %**;
* Trouton, twice and independently: the top element's strain rate is `σ/3μ` to 1e-6, and
  the whole sleeve elongates at `gρL²/6μ` — a formula with no r and no t left in it — to
  4.8 %. With the skin switched back on, the 2γ shows up where the balance says;
* it really is cos of the tilt: straight-down / 60° = **2.0028** against 1/cos 60° = 2;
* the cooling rate matches Stefan–Boltzmann-by-hand to **0.00 %**;
* the volume integrator is **exact** (1.9e-16) on a cylinder, where the frustum rule and
  the wall offset both are;
* mass holds through everything, and five deliberately silly control patterns (blowing
  flat out inside the furnace, jacks at maximum everywhere, the paddle jammed through the
  whole piece) leave the solver finite.

### Verified in a real browser, not by a synthetic click

Served on an uncommon port, in a fresh Chrome session, at 60 fps:

* a **true input-level drag** (`tools/cdp/pointer.mjs`) held on the glass necked the mouth
  from **24.22 mm to 8.34 mm** and dropped the note **630 → 331 Hz**;
* a true click on *crack it off* produced a vessel (E4 +25c, 8 mm mouth, 148 cm³), set it
  down on the marver, and put it on the shelf;
* the paddle shortened a piece from **70.2 mm to 47.0 mm** and gave it a flat base;
* and the ear: an `AnalyserNode` on the page's **own master output** while it blows across
  the vessel reads **439.6 Hz** against the **443.6 Hz** the geometry predicts — 15 cents,
  on a 2.9 Hz bin. The note that reaches the speakers is the shape you made.

### Two things worth knowing (both now in LANDMINES.md)

* **Curvature belongs in the load, never in a denominator.** The first closure here was
  `v_n = q / (12 μ t H²)`, which is right for a sphere and nonsense at an inflection —
  and a parison grows two inflections within a second of the first puff. It tore a hole in
  the shoulder every time, at every timestep, and read as a mesh bug.
* **Laplacian smoothing of a closed meridian is mean curvature flow, and mean curvature
  flow shrinks things.** A quarter per step quietly ate a fifth of the bubble over half a
  minute while every conservation check stayed green — because mass was never the thing
  being lost.

### One shared tool grew

`tools/forge/forge.mjs` now tolerates a trailing `// …` comment after a static import's
module specifier. Real cores annotate their imports (`the-jug/core.mjs` says "the pitch
anchor — never re-typed"), and the strict form rejected them with an unterminated-import
error that reads like a syntax error in somebody else's file.
