# Scytale — changelog

## 2026-06-13 — Build: a transposition-cipher rod (the workshop's first transposition cipher)

Shipped `scytale/index.html` (forge-built from `scytale/index.src.html`) — one self-contained file
(inline `<style>` + `<script>`, no network, no libs, no audio). The ancient Spartan **scytale**: a rod
with a parchment strip wound helically around it. It is the workshop's first **TRANSPOSITION** cipher
— the letters are **rearranged**, never replaced — the deliberate counterpart to the **Volvelle**'s
substitution disk. Each links to the other in its topbar.

### What it is
A scytale of circumference `C` is **exactly** a **columnar transposition**: write the plaintext
row-by-row into a `C`-wide grid, read it out column-by-column. The keyed mode generalises it to a
**keyword-permuted columnar cipher** (a real classical cipher, a step up from the plain rod).

- **Scytale (plain)** — circumference `C` (2–12 letters per turn) is the key; columns read 0…C-1.
- **Keyed columns** — a keyword's alphabetical rank-order permutes the column read-order (cyclic key
  letters if the keyword is shorter than C). The panel shows the derived order live.

The rod IS the grid: each helix **turn** is a grid **row** (C letters across the rod); the letters
lined up **down the rod** are a grid **column** — i.e. a ciphertext run. Two readings: **wound**
(plaintext along the helix) and **unwound** (the strip lifted off → ciphertext straight along the
rod). Click the rod to toggle; hover a letter to light its whole column in both. Reversible by design
(same C + key decodes exactly; an Encipher/Decipher toggle).

### The "wrong rod" demo
Read the real ciphertext at a different circumference `C′ ≠ C` → gibberish, shown live and
green-flagged when `C′ = C`. Proves the diameter is the key — the whole point of the scytale.

### The instrument
Hand-rolled SVG: a top-lit wooden rod with end-caps and grain, a wound parchment strip in `R` turns,
a gold active-column guide, five-letter-group output tape (copy/clear), 3 cosmetic skins
(**oak** / **bone** / **blueprint** — recolour only, geometry provably identical), a seeded "surprise
me", and a **2× PNG export** via the manual canvas pattern (no `<foreignObject>`; verified to
download a valid PNG headless). House dark style, Georgia serif, brass `#c9a24a`.

### The self-test (the workshop's promise)
A pure `CORE` (the columnar-transposition engine) is the single source of truth for both the SVG
renderer and the headless test; `GEO.layout` is the pure rod geometry. The visible top-bar chip
asserts, against known math:
1. **Round-trip** `decipher(encipher(P,S),S)===P` exactly, both modes, 1200 random cases.
2. **True permutation** — `encipher` is a bijection of letter positions (no loss/dup) and preserves
   the character multiset; `OUT[i]===P[perm[i]]`, 1000 cases.
3. **Definitional correctness** — `encipher` equals an independently-recomputed grid column-read (plain
   + keyed order), 800 cases; plus textbook vectors `IAMHURTVERYBADLY@C=5→IRYYATBMVAHEDURL` and
   `WEAREDISCOVEREDFLEEATONCE/ZEBRAS→EVLNACDTESEAROFODEECWIREE`, the ZEBRAS read-order `[4,2,1,3,5,0]`,
   and the `C≥n` identity boundary.
4. **Key sensitivity** — wrong `C′≠C` fails to recover `P` (>97% of trials); a different keyword
   (different read-order) fails (>95%).
5. **Seed-reproducibility + skin-invariance** — cipher output a pure function of (settings, message),
   identical across all 3 skins; `GEO.layout` byte-identical across all 3 skins (colour only differs).

Result: **13/13 PASS** (browser + headless Node, the same exported `CORE`/`runSelfTest`).

### Build & verification
- `node tools/forge/forge.mjs scytale/index.src.html` → `scytale/index.html`; `--check` exits 0.
- Forge-page pattern (post shared-unlock keystone): `<!-- forge:include ../tools/ws/ws.js -->` +
  `WS.seen('scytale')` (writes `ws:seen:scytale`, confirmed in localStorage).
- Browser-verified (agent-browser, 1400×900): rod + wound strip render lovely; typing
  scrambles/unscrambles correctly; live round-trip exact; wrong-rod demo shows gibberish; keyed ZEBRAS
  matches the textbook vector to the letter; all 3 skins render with provably identical geometry; 2×
  PNG downloads a valid file; **zero console errors** (only the `13/13 passed` log).

### Notes
- A scytale of the *historical* fixed-text length wraps neatly; here `C` is freely dialable 2–12 and
  the last grid row may be ragged — `decipher` handles ragged columns via exact per-column lengths.
- The keyed read-order is the column-visit order (ascending key-letter rank); Wikipedia's per-column
  rank list `6 3 2 4 1 5` for ZEBRAS is its inverse — both produce the same ciphertext.
