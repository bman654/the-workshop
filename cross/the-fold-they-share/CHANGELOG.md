# The Fold They Share — changelog

A cross: a wagon-wheel **strobe** aliasing in TIME and a **moiré fringe** beating in
SPACE are the SAME arithmetic — a *difference of reciprocals* folded down to a slow
apparent rate. One dial (the wheel's spoke rate, swept past a fixed strobe) drives both
halves; a chip latches when the wheel's `|apparentRate|` (time) equals the gratings'
reciprocal-beat `1/D = |1/p₁ − 1/p₂|` (space) to `<1e-9`.

## #137 — BLOOMED (BUILD/garden, planter)

Grew the `[cross] The Fold They Share` seed (sown #133) into `cross/the-fold-they-share/`.
The **sixth byte-twin cross** (after #110/#114/#130/#132/#135).

**The one idea.** Map the wheel's two periods onto the gratings' two pitches —
`p₁ ← 1/spokeRate` (the wheel's rotation period), `p₂ ← 1/strobe` (the strobe's flash
period). Then `1/spacingTwoPitch(1/spokeRate, 1/strobe) = |spokeRate − strobe|`, and
inside the fundamental band (`|spokeRate − strobe| ≤ strobe/2`)
`|apparentRate(spokeRate, strobe)| === 1/spacingTwoPitch(…)` to machine zero
(worst ~7e-15). One difference of reciprocals, read once in TIME and once in SPACE.

**Form (form expresses content).** LEFT: a spoked wheel rotating at the SIGNED
`apparentRate` — it visibly CRAWLS backward (the movie phantom) below the strobe,
FREEZES dead still at coincidence, and crawls forward above (a fiducial pip + a
warm/cool/gold direction badge make the regime unmistakable). RIGHT: two overlaid
line-gratings drawn as their product (moiré-bench's `composite` field) whose fat slow
band SWIMS as the pitches diverge — drawn at a BADGED pixel scale (the true periods are
tiny) while the ruler reads true reciprocals. CENTER: one gold beat-frequency ruler with
two needles (|apparent| from time · reciprocal-beat from space) that drop on the same
mark; a gold diamond + link latch when they coincide `<1e-9`.

**The signed phantom (real, not symmetric).** The reciprocal-beat is unsigned, but
`apparentRate` carries a sign — negative just below the strobe (the wheel runs backward),
positive just above, EXACTLY 0 at coincidence. The magnitude still matches; the sign is
real motion.

**The load-bearing negative control (the COINCIDENCE leg).** Set spoke `===` strobe
(p₁ `===` p₂) and the fold goes to zero on BOTH sides at once: `apparentRate === 0` (the
wheel freezes) AND `spacingTwoPitch === Infinity` (the field goes flat, D→∞). A vacuous
"two combs always beat / a strobed wheel always drifts" classifier passes every
off-coincidence point and provably FAILS here — the absence of a beat is the right answer,
reported as a clean limit (never NaN).

**Byte-twin cross mold.** `core.mjs` lifts the TIME core (`foldedFreq` + `apparentRate`,
the signed backward phantom) BYTE-FOR-BYTE from `sampling-theorem/sampling-core.mjs`
between `SAMPLING-CORE` sentinels, and the SPACE core (`spacingTwoPitch`) BYTE-FOR-BYTE
from `moire-bench/moire-core.mjs` between `MOIRE-CORE` sentinels, joined by a THIN adapter.
The two cores never call each other (code-disjoint, grep-confirmed in the Node twin).
`index.html` inlines the whole CORE region byte-identical between `// === CORE BEGIN/END ===`
sentinels.

**Files (4).** `core.mjs` (DOM-free sole authority: both lifted cores + adapter +
`runSelfTest`) · `core.test.mjs` (Node twin) · `index.html` (CORE inlined byte-identical,
brass shell, the strobed wheel, the two gratings, the gold ruler, `window.__foldSelfTest`)
· this CHANGELOG.

**Self-test (`runSelfTest` === the page pill === the Node twin).**
`node core.mjs` → 4/4 ✓ · `node core.test.mjs` → **26/26 ✓**. Legs: (1) shared fold
`|apparentRate| === reciprocalBeat` over the fundamental band `<1e-9` (worst ~7e-15) ·
(2) signed phantom (backward / frozen / forward; magnitude still matches) · (3)
**load-bearing** coincidence neg-control (apparent === 0 AND spacing === Infinity at
p₁===p₂; off-coincidence still beats so the control isn't vacuous) · (4) code-disjoint
sharing · (5) byte-twin parity (index.html CORE === core.mjs CORE, 9815 chars identical) ·
(6) **parent parity** (foldedFreq/apparentRate === sampling-core.mjs source, spacingTwoPitch
=== moire-core.mjs source, all byte-for-byte) · (7) pill parity.

No new front-door footprint: a ◑ Workbench card in the cross group + reciprocal sib-links
on both parents (sampling-theorem + moiré-bench).
