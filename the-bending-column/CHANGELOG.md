# The Column That Decides to Bend — changelog

A touchable **Euler buckling** instrument and the cleanest **pitchfork bifurcation**
in mechanics. A tall slender brass strut stands pinned (clevis) top and bottom against
a dark slate panel, drawn as a **live elastica curve**. Grab a cast brass **load
saddle** and drop it on the strut's crown: below a threshold it just stands dead-true
and visibly **shortens** a hair (axial compression is real); at the critical load

> **P_crit = m²·π²·EI / L²**

the straight line **splits in two** — the strut bows into a half-sine arch.

## The signature element — the two-fates fork

Two faint **ghost struts** hang off the live one: GHOST-LEFT bowed −A, GHOST-RIGHT
bowed +A, where A is the equilibrium post-buckling amplitude at the current load, drawn
from the core's single `branchAmplitude(P)`. Below P_crit A=0, so both ghosts coincide
with the straight strut (the fork's tines still fused at the handle). **The fork opens
at P_crit**: as the load crosses threshold the two ghosts peel symmetrically apart — you
watch one straight line split into two bowed arcs that converge back to the straight
branch exactly at the critical load. The pitchfork is drawn **in the scene at
strut-scale, not plotted.** Past threshold the straight strut is unstable and **commits**
to one tine; *flick the crown* (or arrow keys) and it re-snaps across the fork. Broken
symmetry is a verb you perform.

A **quiet companion inset** (≤26% area, lower-right) only ever *echoes* the big strut:
an operating-point dot rides up the straight branch, reaches the fork node at P_crit,
and slides out onto whichever tine the strut chose — confirming what you see **is** the
canonical pitchfork.

## Sweep the law with your hand

- **② the L collar** (the 1/L² gesture): slide the free span — the P_crit dial moves as
  the inverse square (halve L → ×4).
- **③ the EI material bead** (the linear gesture): slide balsa→pine→oak→steel and the
  strut fattens/thins while P_crit moves **linearly** (double EI → ×2).
- **④ the second-mode brace**: drop a knife-edge pin at the midpoint — the strut can no
  longer bow as one arch; it buckles into the **second mode** y = A·sin(2πs/L) and the
  dial jumps **exactly ×4** (braced half-span L/2 → 4·π²EI/L²). You climb the modal
  ladder with your hand.

## The negative control — the soul of the proof

An **eccentricity / initial-crookedness dial**. Off zero, the sharp fork **dissolves**:
the strut bows **gradually from the first ounce of load**, with no critical point at all
(the imperfect/Southwell response A = e·(P/P_crit)/(1 − P/P_crit), a smooth hyperbola
that only blows up asymptotically at P_crit, never a clean snap — no decision, no
threshold). A **PERFECT PITCHFORK** lamp goes green→red the instant e≠0. The visitor
proves with their own hand that the knife-edge belongs to **perfect symmetry**, not the
apparatus.

## What the self-test proves (onset + leading mode EXACT; big bow only faithful-approximate)

`core.mjs` is the **sole** authority for P_crit AND the mode shape; the page calls it and
never recomputes. `core.test.mjs` is the Node twin running the **same** `runSelfTest()`
the in-page pill runs. The honesty hedge is load-bearing:

1. **ONSET** — the **solved** discrete buckling eigenproblem (a symmetric-tridiagonal
   Jacobi eigensolve of the second-difference operator — no library, no formula plugged
   back in) returns the discrete operator's **own** closed form `(2/h²)(1−cos(πh/L))` to
   **machine ε** (the eigen-solver is exactly correct even though the discretization is
   approximate), **and** converges to π²EI/L² as N→∞ at **O(h²)**. We never claim 1e-9
   from the coarse O(h²) scheme — the headline rides the solver↔closed-form identity and
   the modal purity, and the coarse onset honestly sits *below* Euler.
2. **SCALING LAWS** — inverse-square in L (×4) and linear in EI (×2), each to <1e-9.
3. **LEADING MODE** — the buckled shape is the **pure half-sine**: the exact discrete
   sine transform gives coeff[1]=1 and all higher coeffs 0 to machine ε; the **solved**
   eigenvector is the same half-sine.
4. **SECOND MODE** — bracing the midpoint lifts the onset **exactly ×4** and the shape is
   the pure full sine (only coeff[2] nonzero); the solver's 2nd eigenvalue matches the
   discrete mode-2 closed form.
5. **NEG-CONTROL fires RED (asserted, not narrated)** — `sharpThreshold(perfect)===true`
   AND `sharpThreshold(eccentric)===false`. GREEN means *perfect IS a sharp pitchfork AND
   imperfect is correctly NOT one*; a naive runner cannot mis-report the expected-false as
   a real failure.
6. **ONE SOURCE** — `branchAmplitude` is the single ±A authority for both ghost tines, the
   live bow target, and the inset, so they cannot drift.

> **Honesty hedge:** the large-amplitude elastica bow is rendered **faithful-but-approximate**
> (a shape-preserving half/full-sine scaled by the energy-correct branch amplitude). The
> test does **not** assert the big-bow geometry — only the onset, the scaling laws, the
> leading/second mode shapes, and the branch **form** (flat below, √-onset above).

The in-page pill carries a **tamper**: click it and a hair of bow is secretly leaked below
threshold (a fake gradual bow where a clean knife-edge belongs) — the perfect-pitchfork
claim breaks RED — then the honest core is restored and it re-runs GREEN. The pill is a
live witness, not a hard-coded label.

---

## #234 — built (the strut is pinned)

Born from the ROADMAP garden `[exhibit]` seed *"The Column That Decides to Bend"*. The
synthesis: **Explorer B's two-fates fork** is the hero, grafted with **Explorer C's**
second-mode brace + scaling-law gestures, under **Explorer A's** honesty hedge on the
large-amplitude bow. The estate's first structural-stability exhibit.

- `core.mjs` — the sole pure/DOM-free buckling authority: `pCrit`, `eulerLambda`,
  `modeShape`, `discreteLambda`, `solveBuckling` (the Jacobi eigensolve), `onsetLoad`,
  `jacobiEig`, `fourierCoeffs` (exact DST-I, no FFT dep), `branchAmplitude`,
  `eccentricMid`, `sharpThreshold`, `runSelfTest`.
- `index.src.html` — the byte-twin source; inlines the core via
  `<!-- forge:include core.mjs -->`. Forged to `index.html`; `forge --check` exits 0.
- `index.html` — the forged, self-contained page (Cavern slate-and-brass, gold serif
  topbar, glass control panel, green self-test pill).
- `core.test.mjs` — the Node twin; `node the-bending-column/core.test.mjs` exits green
  (28 assertions).

Verified in-browser: pill GREEN 21/21, console clean, ~61fps; the load saddle drags
(Pointer-Events + setPointerCapture), the fork peels and the strut commits + re-flicks,
the L/EI/brace gestures move the dial as 1/L² / linear / ×4, and the eccentricity dial
dissolves the fork while the lamp flips red.

Reciprocal kin-links: **The Road Into Chaos** (the *same* pitchfork, one structural / one
dynamical — *two forks, one normal form*), **The Catenary** and **The Infinite Overhang**
(slender-elastic / structural-mechanics neighbours). Registered as a bench card in the
Workbench's *Toys & benches* group, beside the Catenary.
