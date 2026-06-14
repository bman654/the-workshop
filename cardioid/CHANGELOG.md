# The Times-Table Cardioid — CHANGELOG

The fourth bench of the Numbers Room (after The Best Rational ⅗, The Ulam Spiral ✦ and
The Collatz Bench 🌳). A self-contained, zero-dependency exhibit: `index.html` + `core.mjs`
+ `core.test.mjs`. Built AS the modular×cipher cross — the multiplicative wheel the additive
Volvelle never had — so its arrival both grows the room to FOUR benches and completes the
affine cipher E(P)=(a·P+b) mod m by handing the Volvelle its missing half.

## v1 — 2026-06-14 (Opus 4.8 · cycle #8 builder)

**What it is.** Put **m** points evenly round a circle, numbered 0…m−1. From each point i,
draw one chord to point **(k·i) mod m** — the k times-table on the ring ℤ/mℤ. That single
rule draws a **cardioid** at k=2, a **nephroid** at k=3, and in general an epicycloid with
exactly **k−1 cusps**. The chords are never the curve; they are **tangent** to it, and the
curve EMERGES as their envelope where they pile up (additive-blend rendering self-brightens
the caustic to gold). The twin fact: the very same map i ↦ (k·i) mod m is the
**multiplicative half of an affine cipher** — a bijection (an invertible key) IFF gcd(k,m)=1,
otherwise it collapses the m residues onto m/gcd(k,m) of them and is no key at all. One ring
draws the cardioid AND ciphers the alphabet.

### The core (`core.mjs` — the single source of truth)
Plain `Number` arithmetic. **Overflow justification:** every value is a residue in [0,m) with
m ≤ 720, and the largest product computed is k·i < 720·720 = 518400 ≪ `Number.MAX_SAFE_INTEGER`
(2⁵³−1) — every (k·i) mod m is exact in a double. The geometry is on the unit circle
(|coords| ≤ 1), scaled by R at render.

THE ONE MAP — the single shared rule both the art and the cipher are built on (the render
literally calls it to place each chord; the cipher disk literally calls it to place each
spoke; the parity harness checks it char-for-char against the page's inlined copy):
`function chordTarget(i, k, m){ return ((k * i) % m + m) % m; }`

**The four falsifiable claims (each checked live, to machine precision):**
1. **ENVELOPE == CLOSED-FORM EPICYCLOID** (tangency, <1e-12). For every drawn chord
   i→(k·i)%m, the closed-form epicycloid point E(t_i) at t_i=2πi/m lies ON that chord: the
   perpendicular distance ⊥ is **< 1e-12** (measured ≈7e-16). This is **no fit and no search**
   — E is evaluated in closed form (a=k/(k+1), b=1/(k+1)) and the chord is the literal drawn
   segment; they coincide because the chord is the tangent line to the envelope. T1 (perp) is
   the always-checked headline residual — robust everywhere incl. cusps, never normalised by
   |E'|. T2 (the normalised tangent-angle residual) is **GUARDED**: returned only where
   |E'| > CUSP_EPS, null at the cusps where the tangent direction is undefined (the cusp guard
   — no sibling may simplify it away). ★ANTI-CIRCULARITY: an INDEPENDENT numeric envelope (the
   limit of two neighbouring chords' intersection at t±h) matches E(t) to <1e-8 — so E isn't
   trusted, it's corroborated as the proven limit of the art.
2. **CUSP COUNT == k−1.** `analyticCuspCount(k)=k−1` (0 for k≤1); the numeric local-minima of
   the envelope speed |E'(t)| that fall below CUSP_EPS equal it exactly (20000 samples); and
   `cuspParams(k)` names the k−1 cusp parameters t=(π+2πn)/(k−1), each a genuine |E'|≈0 (a true
   cusp, where the tracing point instantaneously stops). k=2 → 1 cusp (cardioid), k=3 → 2
   (nephroid), k=5 → 4. The overlay draws k−1 gold diamonds you can count.
3. **CIPHER HANDSHAKE** (the same map, as a key). For coprime (k,m): `isValidKey` true,
   `modInverse`≠null with k·k⁻¹≡1, the image hits all m residues, and
   `affineDecipher∘affineEncipher`==identity for ALL P (incl. nonzero b). The **NEGATIVE
   CONTROL WITH TEETH**: for non-coprime (k,m) `isValidKey` is false, `modInverse` is null, and
   the image collapses onto EXACTLY m/gcd(k,m) residues (13, 180, 90, 72 for the named foils
   (6,26),(2,360),(4,360),(10,720)) — bits are lost, it is no key. `degenerateChordCount(k,m)`
   = gcd(k−1,m) counts the zero-length chords, matched against `buildChords`. The worked m=26
   example is generated FROM CODE (never hardcoded): MATH —(a=5)→ IARJ —(a=5⁻¹)→ MATH, with the
   bad-key foil a=13 (gcd 13) collapsing MATH→AANN, no inverse.
4. **k=1 TRIVIAL NEGATIVE CONTROL.** `chordTarget(i,1,m)=i`: every chord is zero-length,
   nothing is drawn, the "envelope" is just the unit circle, 0 cusps. ★HONESTY GUARD: k=1
   **draws nothing** AND k=1 **is a perfectly valid identity cipher key** (`isValidKey(1,m)`
   true) — two DISTINCT, non-contradictory predicates, labelled as such so no reviewer reads a
   contradiction (a thing can be a valid key yet draw no curve).

### The page (`index.html`)
Lifts the prime-spiral canvas spine verbatim (offscreen base baked once per (m,k) via
`rebuildBase()` → blitted with one `drawImage`; visible overlay for envelope/cusps/hover;
`fitCanvas` dpr transform; `queueRebuild` coalesces via a single rAF + `rebuildQueued` guard)
and lifts the collatz test scaffold; swaps the bodies. Palette = the prime-spiral / Numbers
Room family (teal chords, gold caustic). The inline `<script type="module">` core is a
**byte-twin of `core.mjs`** between BEGIN/END sentinels — the re-extraction parity harness
asserts it char-for-char. In-page self-test pill goes GREEN (8/8 — the 7 core `runSelfTest`
checks plus 1 DOM-level `ck('Volvelle cross-link present')` the pure core can't see, appended in
`runTestUI()`) and surfaces all four claims.

**Render couplings honored (the non-negotiables):** the cusp guard is mandatory (T2 only where
|E'|>CUSP_EPS; T1 perp always); the zero-length chord early-returns BEFORE any divide by len,
in both core AND render skip; `chordTarget` is the ONE map for both art and cipher disk; k
snaps to integers for all proof readouts; non-coprime k is **not** clamped away — it is the
teeth (the verdict flips red); the envelope overlay shares the render's phase constant (residue
0 at top, clockwise) so the gold caustic sits exactly on the teal ridge; render consumes
`buildChords()`/`sampleEnvelope()` as the single source (no second chord-walker) for PNG
determinism + parity; the art slider m (60–720) is independent of the worked-example m=26.

**Controls.** points·m: quick chips [60,120,180,360,720] + a fine slider 60–720 with a mono
m readout. multiplier·k: a slider snapped to integers 1…m−1 + big mono k + ◀▶ steppers +
Left/Right arrow-key bind so each integer's cusp count lands crisply. Chips: show analytic
envelope · show cusps. PNG export (fill bg → base → overlay → caption; 'lighter' needs the
dark bg first). Hover lights the nearest chord and reads its live ⊥ residual; click pins it.
The cipher strip carries the verdict pill (INVERTIBLE teal / DEGENERATE red), the live dual-m
disk tracking (m,k), the worked m=26 letter example, and the cross-card to **The Volvelle**.

### Verification
- `node core.test.mjs` → **50/50 ✓ ALL GREEN** (the shared in-page self-test at three (m,k);
  deeper Node-only tangency/cusp/cipher checks; the worked example; and full re-extraction
  parity proving the page core is a byte-twin of the module).
- In-page self-test pill **8/8 GREEN** (7 core + 1 DOM cross-link check — see above); browser-verified live (agent-browser): renders the
  cardioid at k=2, morphs to the nephroid at k=3 and beyond, the gold analytic envelope sits on
  the teal caustic, the cipher disk shows the working multiplicative cipher with the MATH→IARJ
  →MATH roundtrip; 0 console errors, 0 nested anchors, 0 horizontal overflow at 1280px and
  360/390px; PNG export works.

### Wiring
- The Numbers Room landing now shows **FOUR** live bench cards (its self-test bumped to 4).
- The **Volvelle** carries a reciprocal teaser pointing here (its self-test still N/N — the
  edit is static HTML outside `<script>`); the cross-links resolve both ways.
- A Workbench card sits after the Collatz card (TEAL exact framing).
