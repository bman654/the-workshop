# The Meshing Wheels — CHANGELOG

## #250 — planted (the Chinese Remainder Theorem you crank by hand)

The Numbers Room's twentieth bench, and the gear wing's missing CRT dual to The Cutting Gears.
Two brass gears of **coprime teeth** (3 & 5) mesh on one line of centres, pitch circles tangent at
the contact point P, with true trapezoidal teeth (a half-pitch phase offset so a tip meets a valley
at P — never tip-on-tip). Each wheel carries one chalk-marked tooth. **Crank** the small wheel — drag
its handle, press ⟳, or use ←/→ — and the integer `x` (the whole shared state) advances one tooth per
click while both wheels turn in exact lockstep.

### The claim, made physical
For coprime (m, n) the map `x ↦ (x mod m, x mod n)` is a **bijection** ℤ/mn → ℤ/m × ℤ/n: crank through
a full cycle and every one of the mn residue-pairs passes the mesh window **exactly once**, the marks
realigning home only every **lcm = mn** turns. Set two clock-readings on the touchable rotary dials and
the lone tooth that reads both at once **is** the unique `x mod mn`, reconstructed in closed form and
**shown** in longhand, not asserted: `8 = 2·3 + 2 ✓   8 = 1·5 + 3 ✓`.

- **FORWARD** (set dials → mesh to x): the wheels spin in lockstep counting whole teeth while the big
  violet hero readout counts up to the meshed x.
- **REVERSE** (crank one tooth): x++ and the dials FOLLOW `residuePair(x)`, so you watch every pair pass
  the window once over a full cycle — the bijection made tactile.
- **THE REALIGNMENT EVENT** at `x ≡ 0 (mod lcm)`: chalk teeth flash white→gold, a ring pulses from P,
  a heavier snap detent lands, the turn-counter rolls to mn, caption: "home after 15 clicks — every one
  of the 15 residue-pairs seen exactly once."

### The negative control (the soul)
Swap to non-coprime wheels (4 & 6): a brass **collar visibly clamps across P** (one-time clamp anim),
realignment comes **early at lcm = 12** (not 24), and pairs with `a ≢ b (mod gcd)` **never appear** —
the reconstruct-dial **greys them out** and refuses selection (gated via `isReachable` / `allowedBsFor`).
"The bijection broke" is watched, not read. The "6 & 9" preset (gcd 3) shows the same coarsening.

### The convention contract (the one coupling worth naming)
The integer `x` is the whole shared state. The residue PAIR the dials, window, readout and `reconstruct()`
all bind to is the textbook `(x mod m, x mod n)`. The on-wheel large-wheel chalk mark counter-rotates as
`(-x) mod n` purely as a RENDER detail of the meshing animation; it is never exposed as residue state and
nothing reads it for logic. Both home together at `x ≡ 0 (mod lcm)` (self-test check 9 sweeps the identity
`x%m===0 && (-x)%n===0 ⇔ x%lcm===0`), so the felt realignment is identical either way.

### Proven two ways — closed-form === brute enumeration
`core.mjs` is the sole residue-map authority (DOM-free, integer-only), inlined byte-faithfully into the
page under `// === MESH-CORE BEGIN/END ===` sentinels. `runSelfTest()` merges ten checks, all swept,
proved by the closed-form core AND a second independent brute enumeration of `x = 0 … mn−1`:
1. coprime (3,5): residuePair is a bijection — all 15 pairs once, period 15.
2. non-coprime (4,6): period = lcm = 12, reachable = mn/g = 12 (closed-form === brute).
3. (4,6): exactly mn − mn/g = 12 pairs unreachable.
4. reachability law `isReachable ⟺ a≡b (mod g) ⟺ cycle visits it`, swept (5929/5929).
5. reconstruct round-trips every reachable x; `reconstruct(0,1,4,6)===null` & `isReachable(0,1,4,6)===false`.
6. brute enumeration === closed form (reachableCount + period) across all 121 (m,n) in [2..12]².
7. tamper guard: a forced wrong inverse on a coprime pair is caught.
8. geometry: equal arc-per-click — one tooth per wheel per click, exact lockstep, swept.
9. chalk-home identity, swept (216/216).
10. mesh non-collision: the half-pitch offset ⇒ tip meets valley at P, swept.

`node core.test.mjs` exits 0: §1 runs+asserts the self-test all green; §2 hand anchors
[(3,5): recon(2,3)=8, recon(0,0)=0; (4,6): recon(0,1)=null, recon(0,2)=8, period=12; Sun-Tzu (2,3,2)→23];
§3 brute cross-check of reconstruct over all (m,n,a,b) tuples (5929); §4 BYTE-TWIN PARITY — the MESH-CORE
region in `core.mjs` is byte-identical to the one inlined in `index.html`. 28/28 checks pass.

### On-ramp (legible teaser + findable trigger)
Boots already-solved at m=3, n=5, a=2, b=3 → x=8 (a worked instance, not blanks). A one-line label
("Find the one number that's a o'clock on the m-clock and b o'clock on the n-clock at once"), a pulsing
"crank me" hint that fades after first use (localStorage flag), and story-named presets matching the gear
wing's grid: 3:5 default, 4:7 coprime, Sun-Tzu's soldiers, The lonely tooth (3:7), Clamped collar (4 & 6,
pre-selecting an unreachable dial), 6 & 9.

### Publisher fresh-eyes (#250) — two fixes
- **Sun-Tzu preset landed on the wrong x (content bug).** Its `data-b` was `2`, so `reconstruct(2,2,3,5)=2`
  — contradicting its own label "x≡2(3), 3(5)→8" and the marquee on-ramp instance. Corrected to `data-b="3"`
  ⇒ `reconstruct(2,3,3,5)=8`, dial-B now reads 3, hero shows `x = 8 mod 15`, longhand `8 = 2·3 + 2 ✓  8 = 1·5 + 3 ✓`.
- **Active-preset highlight never lit for an unreachable collar preset (polish).** `updatePanel` matched the
  `.on` class against `mod(state.x, …)`, but an unreachable pair pins `state.x = 0`, so the collar presets'
  `(0,1)`/`(1,0)` never matched. Now matched against the displayed dial residues (`currentDialA/B`), so every
  preset — coprime and collared alike — lights when selected. MESH-CORE byte-twin parity unaffected (edits are
  outside the sentinels); `node core.test.mjs` still 28/28, in-page self-test still 10/10.

### House conformance & wiring
- Gear-wing grammar: same topbar/selftest badge, `--accent` brass palette + `--panel-bg`, fit()/dpr canvas
  + rAF loop() at 60fps, `.presets` grid, reduced-motion fallback (instant spins), optional WebAudio
  woodblock behind a 🔊 toggle (OFF by default, silent-safe). Reads as a gear-wing sibling.
- `verify.sh` (chmod +x): thin wrapper running `node core.test.mjs`, exits its code. No `.src.html` / no forge.
- Registered as the Numbers Room's 20th bench card (glyph ⚙); reciprocal kin-link with The Cutting Gears
  resolves both ways. Reached through the existing `numbers-room` front-door footprint — no new POI slab
  (bigSwingsBuilt stays 22). Drops `ws:seen:the-meshing-wheels`.
