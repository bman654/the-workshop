# The Cartouche — CHANGELOG

The estate's first **metagame layer over the typed-graph of rooms**: the drawing-engines wing's
*courier's road*, where the benches stop sitting side by side and start **feeding each other**.

The estate's rooms form a **typed directed graph**. Each room `accepts` some value-types and
`emits` others; a directed edge `A→B` exists iff `A.emits ∩ B.accepts ≠ ∅`. You are a courier
carrying a brass-cornered traveller's **passport**. Operate the **Euclid Engine** on a seed pair and
it mints a typed **gcd**; that value rides under a wax **seal** you **drag** (or, on a phone,
**tap**) onto a glowing cartouche to stamp the next legal hop — the **Cutting Gears**, seated so
their teeth mesh that very gcd, turn it into a petal-**ratio**; the **Spirograph**, seated so its
rosette draws that ratio, turns it back into a **gcd**. Carry that gcd **home** to the Euclid Engine
and a **gold wax emboss** drops: *"circuit closed · the passport is sealed."*

The seal lands **only** when the walk is a genuine closed cycle that is **type-continuous** AND
**value-identical**: the gcd that comes home is the *same integer* the origin minted, because
`gcd → ratio → gcd` is an **algebraic identity** (12 → ratio 5 → 12, with `g` cancelling exactly). A
stamp is **legal ⟺ a typed edge exists ∧ the seated pair passes the destination's guard**, and four
neg-controls put the law in your hands: wrong-type refused (no edge) · mis-seated gears refused
(guard fails) · stop-short never seals · a free stamp on rooms that share no type bites the edge-check.

Self-contained, zero-dependency: `index.html` (forged from `index.src.html`) + `core.mjs` +
`core.test.mjs`. Lives at `cartouche/`, a tier-2 metagame sibling in the **drawing-engines** wing
(beside the Euclid Engine, the Cutting Gears, and the Spirograph it gathers into one road).

## v1 — 2026-06-22 (Opus 4.8 · cycle #295 grounds-worker)

**What it is — a passport you carry, room to room.**
- **The book.** A brass-cornered traveller's passport on the dark estate ground. **Left page** =
  the circuit ring (Euclid top, Gears + Spirograph below; the road inks **wax-red** as traversed).
  **Right page** = the stamp stack (one ink-press stamp per hop, room glyph + typed value
  consumed→emitted). A wax **seal** token in the gutter is dragged (pointer-capture, snap-back) onto
  a glowing cartouche; closing the loop drops a **gold wax emboss**.
- **The operator dock.** Three room cards below — seat the Euclid pair `(a,b)`, the Gears pair
  `(R,r)`, the Spirograph pair `(R',r')` — with a live guard readout that turns teal when the seat
  meshes what you carry, red when it misses.
- **The form expresses the content.** No graph anywhere — the *circuit itself* is the medium you
  touch: a road you ink by carrying a value, a stamp you press, a seal you close.

**The split + the authority.**
- **`core.mjs`** is the **sole authority** (sentinel-fenced `// === CORE BEGIN/END ===`): the ROOMS
  registry `{accepts, emits, guard(), operate()}`; `hasEdge` (type-intersection); `stampLegal`
  (edge ∧ guard); the `sealed(walk, origin)` predicate (closed type-continuous walk **and** value
  identity start === end); plus `edgeTable()` over all ordered pairs.
  - The euclid gcd is **imported, not re-forked** — `gcdTrace` comes from
    `../euclid-engine/core.mjs`, the certified bench (the way `cutting-gears/core.mjs` already does).
  - The spiro `petals = R/gcd` law is **byte-pinned**: the `gcd()`/`closure()` block between the
    `// === SPIRO-CORE BEGIN/END ===` sentinels is **byte-identical** to `spirograph/index.html`
    (and `cutting-gears/core.mjs`).
- **`core.test.mjs`** is the split Node twin — `node cartouche/core.test.mjs` exits 0 (36/36):
  legal-stamp ⟺ edge ∧ guard; the `gcd→ratio→gcd` closed loop is an algebraic identity
  (start === end); **all four neg-controls fire**; the SPIRO-CORE byte-parity holds; the imported
  euclid is the real bench; the **edge-table === the type-intersection graph over all 9 ordered
  pairs** (documenting `spiro→gears` as a second honest gcd-edge — a growth hook, unwired); and the
  **CORE byte-parity** (forged inline === `core.mjs`).
- The in-page self-test pill reads **GREEN 14/14**; the in-page core is forged byte-identical to
  `core.mjs` (CORE byte-parity check).

**The courier channel (`tools/ws/courier.js`).** A clean **sibling** to `ws.js` (shares nothing
mutable; never edits it) exposing the `ws:carry:*` channel + the room→`{accepts,emits}` registry.
The **circuit and its return-edge home are encoded explicitly** (`returnEdge: 'spiro→euclid'`) — the
seal-home is data, not a UI-only notion. The registry already carries a **second honest gcd-edge**
(`spiro→gears`) waiting for a future garden-bench circuit to wire. Tested by `courier.test.cjs`
(41/41, including the all-9-ordered-pairs edge-table assertion + a no-drift cross-check against
`core.mjs`'s ROOMS); `ws.js`'s own `ws.test.cjs` stays untouched (57/57).

**The polish that landed.**
- **Mobile.** The book scales to `min(94vw,…)`; on phones the seal grows to a comfortable 72px touch
  target and a **click-to-stamp (tap) fallback** lets touch users close the loop without dragging.
  No horizontal overflow at 390px (375 = 375) or 1280 (1265 = 1265).
- **Reset / "tear up the passport"** restores the **default seatings** (not just the walk), so a
  stale guard rejection can never survive a reset.
- **a11y.** The draggable seal and the room cards carry `role`/`aria-label` and a keyboard path
  (focus the seal, press Enter/Space → stamp the first legal room); the dock inputs are labelled.
- **Surface guard (a bug caught in review).** The origin (Euclid) is a *closing* target only — it
  no longer lights or accepts a degenerate self-stamp before the walk has actually traveled out
  (≥2 hops), mirroring the core's length-≥3 seal rule.

**Registration.** One PLACES entry on the front door (`id: cartouche`, glyph **❉**, `drawing-engines`
wing, tier 2), a new `drawPassport` footprint drawer (an open passport with the circuit ring + stamp
stack + wax seal pip), reciprocal kin-links to the Euclid Engine / Cutting Gears / Spirograph, and
the `ws:seen:cartouche` breadcrumb. The crowding ratchet baseline in `tools/layout/smoke.cjs` was
re-pinned (0.934 → 0.955) for the intentional room-add (it had already drifted past its old ceiling
before this cycle). `forge --check --all` clean (91/91).

**Bonus-not-blocker.** The Cartouche never reads `ws:seen` for gating and is **not** wired into the
Undercroft — it only writes its own breadcrumb + a `ws:flag:cartouche-sealed` keepsake on a close.
