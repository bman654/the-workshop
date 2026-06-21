# The Wire That Jumps — changelog

The Lodestone Hall's **railgun-shuttle** bench — *the motor force as a pure LAUNCH.* The Whirligig is
F = I·(L × B) with **two** sides of a loop: equal-and-opposite shoves make a **couple** and the loop
**spins**. Cut one side loose and lay it across two rails: the lone bar, free to slide, no longer turns —
it just **leaps straight down the rails**. Translation instead of rotation. (This is the railgun.)

A single bare copper crossbar rests across two horizontal brass rails inside a uniform field drawn as
**⊗ into-the-page crosses**. Current flows in one rail, **along the bar**, out the other (a moving copper
glow shows the loop). Push current and a live red **F-arrow** grows on the bar pointing along the rails —
the arrow's length **and** direction are drawn straight from `forceOnBar()`'s returned vector, so the
picture **is** the core's force. The bar **accelerates and slides** — pure 1-D translation you watch
happen — trailing a thin **x(t) ramp · v(t) line** strip under the rails (the constant-force kinematics
signature). It coasts into a rail-end **bumper** (an honest UX cap, never smuggled physics) and you
re-launch. The model is **constant-force kinematics ONLY** (a = F/m while current flows; x = ½at², v = at)
— a clean toy, explicitly **not** a circuit sim (no back-EMF, no rail resistance, no friction, no real
railgun energy budget).

Touchable controls, the wing's pattern: a **current dial** (copper-thumb slider; bigger I → longer arrow →
faster shuttle), **reverse current** (flips I → F flips → the bar runs the other way) and **reverse field
B** (flips B → the *same* flip, a *different* cause — the Whirligig's two-reverse teaching), and the
**falsifier** dial — **tilt B toward the bar** (0°→90°). As B swings parallel to the current the ⊗ crosses
**open into vertical arrows** (the field foreshortening out of the page) and the F-arrow **shrinks to
nothing**: at L∥B the bar goes **DEAD**, the banner fires *"⚠ I ∥ B → F ≡ 0 — the wire goes limp,"* and the
self-test pill flips **RED** ("✗ NEG-CONTROL: L∥B ⇒ F ≡ 0"). A **race ghost** keeps the previous run's
trace faint, so doubling the current visibly **doubles** how far the bar gets in equal time — the linear
law you *see*. (No drag/pluck/spring-back: a free bar has no restoring force; a return would be a physics
lie. The only return is **Reset**.)

Nests under `lodestone-hall/` as a **sub-bench** — no front-door footprint (the front-door map and
`bigSwingsBuilt` are unchanged); reached from the Hall's KIN row and reciprocating back to it. The Hall's
4th bench, completing the Lorentz-force trio with the Whirligig (couple → spin) and the Sorter (free
charge → arc): the same F = q v × B / I·L × B in three motions — *spin, arc, launch.*

## Built (cycle #243, BUILD/garden — the planter)

Grew the garden seed `[bench]` *The Wire That Jumps — The Wire on Rails (railgun shuttle)* into the
Lodestone Hall's launch bench. Four files in the estate's four-file discipline:

- **`core.mjs`** (~200 lines) — the SOLE force authority. `barVector` (the current's sense down the bar) ·
  `fieldVector` (B tilting from into-page at θ=0 to L∥B at θ=90°) · `forceOnBar` (= I·(L × B), the full
  3-vector the page's red arrow is drawn from — length **and** direction) · `kinematics` (a = |F|/m,
  x = ½at², v = at, for the trace; *never* a second force formula) · `runSelfTest` (5 rows, the wing's
  exact shape). Forge-inlined byte-for-byte between `// === RAILSHUTTLE CORE BEGIN === / END ===`.
- **`core.test.mjs`** (~198 lines) — the Node twin, exits 0 with **19/19**: the shared self-test, then
  rows 1–5 re-proven independently over an I × θ × B-sign grid, then the **re-extraction parity** crux
  (the inline page-core === the module-core, char-for-char, same pass-count, every row agreeing).
- **`index.src.html`** (~692 lines) → **`index.html`** (forged; never hand-edit the twin).

### The proven claims (self-test, 5 rows, each to <1e-9; the in-page pill === the Node twin)

1. **|F| = B·I·L** exactly at θ=0 (L⊥B), over a dense I-sweep.
2. **Linear in I** — |F(2I)| === 2·|F(I)| **and** x(t;2I) === 2·x(t;I) at equal t (the race-ghost made
   exact).
3. **Sign flips on either reversal** — F(−I) === −F(I) **and** F(I,−B) === −F(I,+B) pointwise (two
   distinct causes, the same flip).
4. **Perpendicular to both** — dot(F, L) === 0 **and** dot(F, B) === 0 for *all* tilt angles (a genuine
   cross product, ⊥ both current and field).
5. **NEG-CONTROL (fires RED — the falsifier)** — at L∥B (θ=90°), F ≡ [0,0,0] exactly. No leap where
   current and field agree — the conservation soul's reciprocal face (the Whirligig's couple nets zero
   work; the Hall's field makes no free energy; here a parallel current can't push).

### Discoverability — the reciprocal kin (each card RESOLVING 200 and RECIPROCATING)

- New page's KIN rail: ← The Lodestone Hall, ↑ The Orrery Estate, + The Whirligig + The Sorter.
- `p.recip` on the new page: *"This is the Whirligig's loop with one side cut free."*
- Onto **The Whirligig** (kin card): *"there two sides make a couple and SPIN; here ONE side, cut free,
  just LEAPS down two rails"* — redeems the Whirligig's pre-written "LEAP" promise.
- Into the **Lodestone Hall index** (kin card): *"the motor force as pure LAUNCH … the Whirligig's couple,
  uncoupled."* (No "N benches" count text in the Hall index — the kin rail just lists cards.)
- Onto **The Sorter** (kin card, both ways): *"there the field shoves a current-carrying bar STRAIGHT down
  the rails; here it bends a FREE charge into a mass-reading ARC — the same force, two motions."* (The
  Sorter's recip block already named *The Wire That Jumps* in waiting; this resolves it.)

### Verified before publish

`node tools/forge/forge.mjs` on all three edited `.src.html` (new page + Whirligig + Hall index + Sorter);
`forge --check` all four — **current** (byte-true twins); `node core.test.mjs` on the new bench — **19/19**,
and the Whirligig (**19/19**) + Sorter (**27/27**) twins re-run green (the kin edits broke nothing). Live
in-browser: the pill reads **✓ 5/5** (green), flips **✗ NEG-CONTROL** red at L∥B and recovers on reset;
the bar visibly accelerates down the rails into the bumper; the ⊗ crosses open into arrows as B tilts; the
race-ghost saves; console clean; all four kin links resolve 200 and reciprocate. Drops
`ws:seen:the-wire-that-jumps`.
