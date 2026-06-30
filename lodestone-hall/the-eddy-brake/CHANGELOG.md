# The Eddy Brake — changelog

The Lodestone Hall's **Lenz-braking** bench — *a magnet falling through honey it cannot touch.* The Hall's
galvanometer READS the EMF a moving magnet induces in a coil. Turn that same change-in-flux law on its head:
let the magnet FALL down a conducting pipe, and the induced eddy currents (Lenz: always opposing the change
that made them) push BACK — a brake made of pure induction, no pad and no friction.

Two clear vertical tubes side by side. Drop a plain iron slug down the **LEFT (plastic)** tube — it falls
free, gravity-time, lands with a *thunk*. Drop the **SAME** slug, now **magnetised**, down the **RIGHT
(copper)** tube — and it **drifts down in slow motion**, though nothing touches it. As it descends, live
**eddy-current rings** glow in the pipe wall ahead of and behind the magnet: the ring it approaches pushes
**up** (opposing the approach), the ring it leaves pulls **back** (opposing the departure). A speed gauge
shows the magnet reach a **terminal velocity almost instantly**, then hold dead-steady while the iron slug
has long since landed — the race you watch happen. A **conductivity dial** (copper → aluminium → brass → a
poor conductor → plastic) turns the right tube's wall, and the terminal velocity tracks the conductance:
**v_term ∝ 1/σ**, exact.

The page steps the **same RK4 integrator** the Node twin runs whole; on-screen wall-time is paced for a
watchable drift, but the physics (the ratios, the energy balance) lives in core-units and is unchanged.
A live **energy ledger** shows gravity's PE drop pouring into kinetic + the running **Joule-heat sum Q** in
the wall, with the residual **mgh − (KE + Q) ≈ 0** held to machine-ε in front of you.

**The math claim its self-test proves** (`core.mjs` is the sole authority; `core.test.mjs` is the Node twin;
the page inlines the slab byte-for-byte and re-runs the SAME `runSelfTest()`):

1. **At terminal velocity, drag === gravity:** `b·v_term === m·g` across the conductivity dial, to <1e-9.
2. **v_term ∝ 1/σ exactly:** `v_term(σ)·σ === m·g/k` constant across a dense σ-sweep, to <1e-9 — and the
   proportion is genuine (halve σ → double v_term, asserted not vacuously flat).
3. **Energy is conserved to machine-ε:** integrating the descent (RK4), `m·g·h === ΔKE + Q` where
   `Q = ∫ b·v² dt` is the I²R Joule heat — the kinetic energy the magnet would have gained in free-fall is
   dissipated as wall heat. Held to <1e-9 across the dial (and the dissipation is real: max Q > 1, not 0=0).
4. **The Lenz sign is the conservation hinge:** Lenz ON ⇒ `Q ≥ 0` and the balance closes; flip the induced
   sign (the **Lenz-OFF cheat**) and the "brake" becomes a **runaway accelerator** — `Q < 0`, `ΔKE > mgh`,
   energy created from nowhere. The page fires a red **FREE ENERGY** banner and the pill flips RED. The
   heat-power sign flips exactly with the Lenz sign (`b·v²|on === −b·v²|off` to the bit).
5. **NEG-CONTROL — the plastic tube (σ=0):** a non-conductor carries no eddy current — `drag ≡ 0` at every
   speed, `Q ≡ 0` (zero rings), `v(t) === g·t` (pure free-fall, identical to the iron slug), and v_term
   **diverges** (Infinity at σ=0; no terminal velocity). The **conductor**, not mere proximity, is the brake.

**Imports the Hall's Lenz authority.** The bench inlines the Lodestone Hall's `../core.mjs` first (scoped so
only `closedLoopHandWork` / `SCENE` escape — its own self-test stays private), and the twin asserts the
brake's Joule-heat sign **agrees** with the Hall's hand-work ledger (Lenz ON ∮ ≥ 0 / Lenz OFF ∮ < 0): the
same conservation hinge wearing two faces, not a fork. The Hall parent stays a byte-untouched oracle (the
twin byte-parity-checks both inlined slabs).

Nests under `lodestone-hall/` as a **sub-bench** — no front-door footprint (a DEEPEN of the Lodestone Hall
wing, not a detach; M stays 34). Registered on the Hall landing as a featured **bed card** with a live
preview canvas + a Kin-rail link, and the landing's pill gained a **structural roster row** (it now tallies
6 physics claims + 1 structural check that the wing links all its benches and the bed preview is present →
7/7). Reduced-motion gated. `ws:seen:the-eddy-brake` breadcrumb dropped on view.

— Forged cycle 372.

**Publisher fresh-eyes polish (cycle 372).** Two real bugs the heads-down build missed, both fixed in
`index.src.html` (re-forged; outside the byte-twin core, so the 30/30 twin held): (1) in the pre-drop idle
state the per-slug labels drawn just above each slug ("iron slug" / "the magnet") collided with the
tube-header sub-labels in the same band, smearing into illegibility — removed the redundant idle tags (the
headers already name each tube/slug; the N/S poles self-label the magnet); (2) the self-test pill overflowed
the viewport at ≤375px — added `flex-wrap:wrap` to `.topbar` (the sibling The LC Tank's pattern) so the
header wraps gracefully, zero horizontal scroll at phone width, desktop byte-identical.
