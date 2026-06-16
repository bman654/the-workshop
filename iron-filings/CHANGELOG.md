# The Lodestone Plate — CHANGELOG

A standalone **grounds** room where a magnetic field becomes a thing you can **see and touch**.
A dark plate; drag bar-magnets across it and thousands of iron filings snap live into the EXACT
superposed-dipole field — lines thread pole to pole, bow apart between like poles, fountain from a
lone north and curve back to its own south. You **hunt the saddle null** with your cursor: the one
spot the field is zero and the filings have nowhere to point.

Self-contained, zero-dependency: `index.html` + `core.mjs` + `core.test.mjs`. Lives at
`iron-filings/`, back-linked to the estate. Magnetism is its own thing — no wing (it is not optics,
and does not belong in the Cavern's physics quarantine fiction).

## v1 — 2026-06-16 (Opus 4.8 · cycle #66 builder)

**What it is — the field made visible, dragged live.**
- ONE full-bleed dark plate (`<canvas>`). Bar-magnets are rounded capsules split warm-red **N**
  (`#e0664f`) / cool-blue **S** (`#8fb6ff`) — not dots. **Body drag** translates a magnet;
  **end-cap drag** rotates it (sets θ); **double-click / two-finger** flips a pole (the whole
  texture re-knits). Empty plate does nothing.
- **The filings (the win):** ~3000 (slider 800–6000) headless segments centred on a FIXED
  blue-noise scatter, each rotated to `atan2(by,bx)` (the field axis, sign-free), alpha
  `0.10 + 0.62·s` and length `5 + 4·s` with `s = |B|/(|B| + m50)` (m50 = median |B|, recomputed on
  every magnet change). Near-white cool-steel `rgba(214,222,235,a)`. A filing at a true null is
  skipped — it has nowhere to point.
- **The hero streamlines:** 6–10 lines seeded from a ring just outside each N pole, integrated by
  RK4 and drawn as the RAW polyline (no splining), two-pass glow (a wide `lighter` bloom under a
  crisp cool-blue pass). Unlike pair → bright bridge; like pair → bow-apart with a dark midline;
  lone N → fountain that curves back to its own south. A ▸/❚❚ **flow** toggle marches dots along
  the lines (~30fps cadence).
- **The saddle-null hunt:** a proximity reticle whose opacity is `(1 − |B(cursor)|/B_ref)²`; when
  `|B| < ~1% B_ref` it snaps to a **gold** (`#c9a24a` — the estate "you found it" colour) cross-hair
  + ring-pulse + caption. Unlike poles → no interior null, the reticle never blooms (an honest
  negative experience). After ~6s of a present-but-unfound null, a faint `✦` breadcrumb fades in at
  the true null (the on-ramp). Live captions classify bridge / recoil / single and frame the thing.

**Perf architecture (load-bearing).** LAYER A = the filing bitmap on an OFFSCREEN canvas,
recomputed ONLY on drag-END / flip / add-remove / resize (frozen mid-drag). LAYER B = the
streamlines, redrawn every frame (cheap). Filings are bucketed into 6 alpha bands and stroked with
~6 `stroke()` calls total — NOT O(N). Measured 60fps with flow on at 1280px.

**Why the proof is real — and a Node twin (`core.test.mjs`, exit 0 green) + an in-page pill.**
The 2-D point dipole `B = [2(m·r̂)r̂ − m]/r²` is EXACTLY divergence-free AND curl-free in vacuum, so
"∇·B = 0 everywhere" is a genuine fact about the field. The page and the twin run the SAME four
claims via the inlined core:
1. **∇·B = 0 in vacuum** — discrete divergence (central differences, tiny fd-eps) under `1e-5` on an
   80² grid, skipping the singular cores. (Measured max|∇·B| ≈ 8.5e-8.)
2. **A streamline N→S closes** — a line launched from a north pole reaches a south pole; no line
   crosses another or dies in mid-air.
3. **RK4 is 4th-order** — Richardson extrapolation against a fine reference on a smooth mid-field
   arc gives an error ratio ≈ 2⁴ = 16 (page asserts ≥ 8; the twin pins it to [12,18]; measured 16.0).
4. **NEGATIVE CONTROL** — a fictitious **magnetic monopole** `B = q·r̂/r` (a real source) breaks the
   law: its loop-flux `∮B·n̂ = 2πq ≠ 0` (the divergence-theorem witness) while every dipole's is ≈ 0,
   AND a line launched into it **never closes** (it spirals into the source forever). The monopole
   MUST flip claim 4 — and the twin asserts the failing condition explicitly.

The twin ALSO re-derives the claim INDEPENDENTLY (not via the bundled self-test): the on-axis closed
form (B antiparallel to m on the equator, |B| = |m|/r²), `∮B·n̂ ≈ 0` around a dipole to < 1e-9 and
`= 2π` around a q=1 monopole to < 1e-6 (and `= 2π·q` for q=3), flip-both-poles ⇒ B negates exactly,
the saddle null `fieldAt(midpoint) ≈ 0` & `dir()` returns null there, and `findNull` is honest
(returns null for an unlike pair). 20/20 checks green.

**Byte-parity.** The core inlined in `index.html` between the `IRON-FILINGS CORE` sentinels is
byte-identical (indentation-normalized) to `core.mjs`'s body — the twin proves it so the inline can
never silently drift.

**Window handle.** `window.__ironFilings = { scene(name), runSelfTest, CORE }` — the canonical
SCENES (`dipolePair`, `likePair`, `loneN`, `monopoleControl`) and the whole core exposed by name so
the page is externally re-auditable (and the monopole control is summonable from the console).

**Aesthetic.** Estate-exact dark plate (`--bg #07060a → #0b0910` radial), the estate grid overlay,
cool-blue accent `#8fb6ff`, gold null-snap. Mobile-clean (no horizontal overflow at 390px, 0 console
errors at 1280px AND 390px). Self-test pill top-right, click to expand per-check lines. Back-link
`← The Orrery Estate`. Breadcrumb `ws:seen:iron-filings` dropped on a direct visit.
