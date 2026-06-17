# The Dissection Bench — changelog

A touchable proof of **a² + b² = c²**: grab the swing and the bigger leg-square
shatters into four pieces that **glide** — with the whole small square — into the
hypotenuse-square. Same pieces, no scaling. The area readout stays **locked equal**
the whole swing. This is **Perigal's gliding dissection**, enacted on the
**Pythagorean tiling**, so the silhouette can only fold the one true way.

The soul is the **slide**; the proof is a quiet pill.

---

## #86 — sown (the bench is laid)

Born from the ROADMAP seed *"The Dissection Bench — area you slide, not compute"*
(sown #82). The seed offered square↔triangle **or** a²+b²→c²; this ships the
**a²+b²→c² Perigal glide** as a *verified tiling* — the register whose pieces
provably tile **both** endpoints (sampled once-coverage = 1).

### What it is
- **The verb:** a hinge-swing on θ∈[0,1] driven three ways — a slider, a **swing it**
  auto-animation (OFF by default, reduced-motion-safe), and a direct **canvas drag**.
  At θ=0 the four pieces sit in their b-square source poses with the small a-square
  parked beside them; at θ=1 every piece has glided (a pure rigid lattice translation)
  into the tilted c-square. Drag anywhere across the bench to scrub the fold by hand.
- **The invariant:** the *source · the pieces* and *target · the c-square* area
  readouts stay **LOCKED EQUAL** the whole swing — area is something you *slide*,
  not compute.
- **The honest negative control:** a **mis-cut** tab corrupts the lattice basis so
  the four pieces no longer tile the c-square. Swing it and a **real** gap/overlap
  opens; the readout flips to **CUT IS WRONG · pieces overlap · gap in c²**. The
  right cut is load-bearing.
- **Live legs:** a/b inputs (clamped 1..8) re-cut the tableau on the fly.
- A quiet **"re-assembled · same area"** caption rises as the swing lands assembled
  (a graft from the free-drag-tangram explorer).

### The geometry (single source of truth)
`core.mjs` is the **sole** authority — `perigal(a,b)` (the 4 pieces + their
source-square poses + their c-cell poses + the a-square), `poseAt(g,θ)` (the swing),
`onceCoverage` (the load-bearing tiling test), `badPerigal` (the neg control), and
the pure helpers `dist`, `polyArea` (shoelace), `pointInPoly`, `clipToConvex`
(Sutherland–Hodgman). It is inlined **byte-identical** into `index.html` between
`// === CORE BEGIN ===` / `// === CORE END ===` sentinels — page and test can never
drift (the euclid-engine / the-comma twin convention).

### The proof
`core.test.mjs` → **13/13 GREEN**, exit 0 (`node dissection/core.test.mjs`):
1. **a²+b² === c²** exact across 6 leg pairs (worst |Δ| = 1.8e-15)
2. the 4 cut pieces sum === **b²** (=16 for the 3-4-5 tableau)
3. source pieces tile **one b-square** — sampled once-coverage = 1 (no gap/overlap)
4. assembled pieces tile **the c-square** — sampled once-coverage = 1
5. **Σ piece areas === c² at every hinge angle θ** to machine-ε (maxErr = 7.1e-15) —
   the rigid glide conserves area exactly
6. **NEG-CONTROL** mis-cut drops once-coverage to 0.68 and is caught
7. pure-helper anchors (shoelace · clip · pointInPoly · dist)
8. **byte-twin parity** — `index.html` CORE === `core.mjs` CORE, 7853 chars identical

The in-page **gold pill** auto-runs the same six load-bearing legs → **6/6 ✓**;
click it to re-run.

### House notes
- Reduced-motion safe: auto-animation is OFF by default; a valid static θ=0 frame
  draws on load.
- Drops the `ws:seen:dissection` front-door breadcrumb on every direct visit.
- Registered on the front door (`index.src.html` → re-forged `index.html`) as a
  reckoning-wing room (⊿, accent #c9a24a).

---

## #86 — publisher fresh-eyes (reviewed · 1 polish fixed · published)

Reviewed fresh-eyes across both registered surfaces (the bench + the front-door
map), served on an uncommon port (`127.0.0.1:8741`, session `ws86-dissect`/`ws86-map`,
both torn down by exact PID/name — Brandon's :3001/:4380 untouched).

**Verified green:** Node twin **13/13** exit 0 · in-page pill **6/6 ✓** · byte-twin
parity intact (CORE === core.mjs CORE) · `forge --check --all` **31/31** current ·
`forge --audit-seen` **25/25** (dissection drops `ws:seen:dissection`) · layout smoke
ALL PASS. Static θ=0 frame valid on load (src=tgt=25.00000, LOCKED EQUAL, auto-anim
OFF). **0 console errors · 0 nested anchors · 0 horizontal overflow @1280 AND @390.**
Drove the swing LIVE: at θ=1 the four pieces + the small square glide into the tilted
c-square gapless, readout holds 25.00000 === 25.00000 LOCKED EQUAL, the "re-assembled ·
same area" caption rises; legs 6,8 re-cut correctly (6²+8²=100=c²). Mobile @390 stacks
clean (hero wraps to two lines, controls flow, no clipping). The front-door POI renders
as a single clean ⊿ anchor ("The Dissection Bench · scissors-congruence", href
`dissection/index.html`, **0 nested anchors**); a zoomed map-cluster screenshot confirms
NO visible-label collision (the bounding-box overlaps with reckoning/clockwork are
hit-area margins, exactly as the Kirigami landmine note predicted); the bench back-link
"← The Estate" returns to the front door.

**CAUGHT & FIXED ONE polish item (the mis-cut verdict was pre-baked):** the negative
control declared **"CUT IS WRONG · pieces overlap · gap in c²"** the instant you opened
the mis-cut tab — at θ=0, before the pieces have glided anywhere and while no gap yet
exists — contradicting the hint's own promise ("Swing it — a *real* gap/overlap appears
and the readout flags it"). Rewired the bad-mode lock to **measure the actual once-coverage
as the swing progresses**: at rest it reads neutral gold **"SWING TO TEST · area matches —
but does it FIT? swing it"** (the cut looks innocent, the trap is set — *equal area is
necessary but not sufficient*), and only once the pieces have glided toward the c-cell
(θ near 1) does the live coverage measurement open the gap and flip it red to **"CUT IS
WRONG · pieces overlap · gap in c²"**. The counter-example now lands as a *falsifiable
experiment you trigger*, not a label printed in advance — truer to "the cut is
load-bearing." The fix is page-view logic OUTSIDE the `// === CORE BEGIN/END ===`
sentinels, so **byte-twin parity stays intact and the Node twin stays 13/13 GREEN**
(re-verified after the edit). Good mode is unchanged: LOCKED EQUAL throughout, the
math readout still reads `Δ<1e-9 · 3²+4²=25=c²`.

No `[bug]` filed, no ⚡ spark. The bench shipped otherwise as built.
