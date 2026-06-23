# The Teacup Caustic — CHANGELOG

A light/optics planter leaf in **The Hall of Mirrors** (the estate's optics wing), sat right
beside **The Pool That Dances** — both are caustics, but the Pool's is from *refraction* and
this one is from *reflection*. A self-contained, zero-dependency exhibit: `index.html` +
`core.mjs` + `core.test.mjs`. It is the geometric twin of **The Times-Table Cardioid** (the
Numbers Room's string-art bench): the same heart — a cardioid, a nephroid — drawn a different
way. Where the Cardioid draws the curve from *chords on a circle*, the Teacup draws it from
*light reflecting off a circular wall*. Both prove the same falsifiable spine: the chords/rays
are never the curve, they are **tangent** to it, and the curve EMERGES as their envelope.

## v1 — 2026-06-22 (Opus 4.8 · cycle #312 builder)

**What it is.** The bright heart on your morning coffee, made touchable. A top-down porcelain
cup of dark coffee. A warm point **lamp** sits on (or inside) the round rim and throws light at
the inner wall; every ray reflects by the **law of reflection**, and where neighbouring
reflected rays pile up a bright curve floats on the coffee — a real **catacaustic**. **Drag**
the lamp and it re-forms live. **Walk** the source from the rim out toward the **sun** and a
**second cusp is born** the instant the lamp leaves the rim: the **cardioid** (one cusp) opens
into the **nephroid** (two). **Straighten the wall** and it vanishes — the rays go to one
virtual image, no caustic; the dial does nothing, which is the point. A brass **loupe** names
the live curve and ticks a white-hot light-dot ON each cusp.

**Form expresses content.** This is not a plotted curve — it is the cup. A **show-the-rays**
layer draws the warm incident fan + the cool reflected legs so you SEE the law of reflection at
each wall hit, and watch the caustic EMERGE as the additive pile-up where neighbours cross (a
'lighter'-composited accumulation buffer self-brightens the heart with no curve drawn). Over
that, the closed-form spine is drawn with photoreal **bloom** — layered wide-dim → tight-hot
passes, extra white-hot pile-up at the slow cusp — on porcelain with a rim sheen + specular
crescent, a coffee gradient, a meniscus lip, and a slow liquid glint. Honestly framed as an
EXACT 2-D geometric catacaustic in cup-units, not a radiometric brightness render.

### The geometry (`core.mjs` — the single source of truth, DOM-free)
Work in cup-radius units: the wall is the unit circle W(t)=(cos t, sin t); a point lamp sits at
S=(R,0) with R≥1 (R=1 ON the rim, R→∞ a distant SUN). Reflect the incident ray S→W(t) about the
inward normal n=−W(t). Worked out by hand, the reflected **direction** collapses to a clean
closed form:

```
d(t,R) = ( R·cos2t − cos t,  R·sin2t − sin t )
```

with derivative d'(t,R) = (−2R·sin2t + sin t, 2R·cos2t − cos t). Writing each reflected ray as
the line through W(t) with direction d, the envelope point **E(t,R)** solves the 2×2
line-family system X·(d.y,−d.x)=R·sin t together with its t-derivative (RHS C(t)=R·sin t,
C'(t)=R·cos t). One knob R IS the morph: **R=1 ⇒ cardioid (1 cusp); R→∞ ⇒ nephroid (2 cusps)**.

`reflectedRayRaw(t,R)` keeps the FULL first-principles reflection (reflect the incident unit
vector about the inward normal) so the renderer can draw real reflected segments AND the
self-test can corroborate the elegant closed form from the raw law of reflection.

**Overflow justification:** all geometry lives on / near the unit circle (|coords| of order 1),
R is capped at the "sun" value 1e6, and every product (R·cos2t etc.) is ≤ ~1e6 ≪
`Number.MAX_SAFE_INTEGER` (2⁵³−1). The 2×2 solves use determinants of order-1 quantities; the
cusp guard catches the vanishing determinant exactly where E is undefined (a cusp lives there).

### Single source — inlined byte-for-byte, proven by the Node twin
The core is inlined into `index.html` between `// ===== TEACUP CORE … BEGIN/END =====`
sentinels (sans `export`). `core.test.mjs` imports `core.mjs`, re-extracts the inlined slice
from `index.html` by brace-matched function extraction, and asserts the inlined
`reflectedDir` / `envelope` / `numEnvelope` / `reflectedRayRaw` bodies are **char-for-char**
the imported `.toString()`, evaluates the slice via `new Function`, and proves its
`runSelfTest()` agrees with the module **pass-for-pass and name-for-name**. No re-typed math.

### The falsifiable claims (each checked live + in the Node twin, to machine precision)
1. **REFLECTION LAW** — double-reflect returns the ray, AND the clean closed-form direction
   d(t,R) is **parallel** to the raw law-of-reflection direction (rim/off-rim/sun): the elegant
   form is the REAL reflection, not a lookalike. (normalised cross ≈ 8e-16)
2. **TANGENCY** — every reflected ray is tangent to the closed-form caustic E(t): the ⊥ distance
   from E(t) to the reflected line through W(t) is **< 1e-9** (≈4.6e-16; guarded/null exactly at
   cusps), at rim / off-rim / sun.
3. ★ **ANTI-CIRCULARITY** — an INDEPENDENT numeric envelope (the intersection of two neighbouring
   reflected rays at t±h, from the raw reflection) matches the closed form E(t) to **< 1e-8**
   (≈8.6e-11). Two disjoint derivations of one curve — E isn't trusted, it's corroborated.
4. ★ **CUSP COUNT** — counted as the near-zero local minima of |E'(t)| (wrap-aware, dense): rim
   R=1 ⇒ **1** (cardioid), lifted R>1…→∞ ⇒ **2** (nephroid). The second cusp is born just off the
   rim and persists all the way to the sun. `cuspParams(R)` names each cusp so the loupe ticks it.
5. ★ **NEG-CONTROL** — a STRAIGHT wall (curvature → 0) sends the point-source fan to ONE virtual
   image: all reflected rays **concur** (max miss ≈1e-16) ⇒ no extended envelope, 0 cusps.
6. **ANTI-VACUITY** — the rim cardioid and the sun nephroid are genuinely **different** curves
   (max separation ≈0.51 > 0.3) — not the same drawing twice.

Plus, in the Node twin: a determinism/purity check (envelope byte-identical across passes → PNG
reproducible) and the full re-extraction parity suite. **`node core.test.mjs` → 31/31 ✓ ALL
GREEN.** The in-page pill runs the same six legs: **6/6 ✓**.

### Discoverability
Registered as a card in **The Hall of Mirrors** (`hall-of-mirrors/index.html`), in the
"Rays, lenses & mirrors" group, right after **The Pool That Dances** (the two caustics together).
Cross-links in the page side-panel: **↗ The Times-Table Cardioid** ("the same heart drawn a
DIFFERENT way — string-art on a circle"), **↗ The Pool That Dances**, and **↗ The Hall of
Mirrors**. Drops `ws:seen:teacup-caustic` (try/catch guarded). Honors `prefers-reduced-motion`
(draws once, no rAF shimmer; redraws on interaction).

### Verify
- `node teacup-caustic/core.test.mjs` → **31/31 ✓ ALL GREEN** (incl. re-extraction parity).
- `node tools/forge/forge.mjs --check --all` → all current, no regression.
- Browser-verified (agent-browser): in-page pill **caustic verified — 6/6 ✓**, clean console,
  **60fps**; the cardioid at the rim, the nephroid at the sun (with the cusp-birth narration),
  and the flat-wall control flipping the loupe to "no caustic · 0 cusps".
