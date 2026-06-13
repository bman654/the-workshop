# 📜 Scytale — build spec

*The ancient Spartan **scytale**: a rod with a parchment strip wound helically around it. Write the
message along the rod's length, unwind the strip, and the letters are scrambled — only re-winding on a
rod of the **same circumference** restores them. It is the workshop's first **TRANSPOSITION** cipher
(the letters are **rearranged**, never replaced) — the deliberate counterpart to the Volvelle's
**substitution** disk. Mechanically it is a **columnar transposition**; the keyed mode generalises it
to a keyword-permuted columnar cipher. The workshop's signature: a built-in self-test that **proves**
the cipher is correct — it round-trips exactly, it is a true bijection of letter positions (no loss,
no duplication), it matches the mathematical grid definition and the canonical textbook vectors, and
the rod's circumference (and the keyword) is provably load-bearing.*

Folder: `scytale/`. Source: `scytale/index.src.html`; shipped (forge-generated) file:
`scytale/index.html` (no build at ship time, no network, no deps). Build log: `scytale/CHANGELOG.md`.

> **Cipher kin.** Pairs with the **Volvelle** (`volvelle/`): substitution (letters replaced) vs
> transposition (letters rearranged). Each topbar links to the other. It is also distinct from the
> hidden Enigma (rotor substitution) in the Undercroft — do **not** reference or surface that here.

---

## §0 — The mechanism (a scytale rod)

A wooden rod of a chosen **circumference C** (the number of letters that fit around it in one turn). A
long strip of parchment is wound **helically** around the rod, edge to edge. The sender writes the
plaintext **along the rod's length**, one letter per column of the helix, wrapping turn after turn.
Unwinding the strip leaves the letters out of order; only re-winding on a rod of the **same diameter**
re-aligns the rows so the message reads again. The rod's circumference is the key.

---

## §1 — The cipher model (columnar transposition)

A scytale of circumference `C` is **exactly** a columnar transposition. Let `P` be the cleaned
plaintext (A–Z only, case-folded, non-letters dropped — the classical convention), `n = |P|`.

- **The grid.** `C` columns, `R = ceil(n/C)` rows. Fill **row-by-row** (left→right, top→bottom):
  `grid[r][c] = P[r*C + c]`. The final row may be ragged.
- **Encipher = read column-by-column.** Read each column top→bottom, columns visited in **read-order**,
  concatenated. Plain scytale reads columns `0,1,…,C-1`. The **keyed** variant reads them in the order
  a keyword dictates (§2).
- **The rod is the grid.** Each **turn** of the helix is one grid **row** (`C` letters across the rod);
  the letters that line up **down the rod's length** are one grid **column** — and a column, read off,
  is a contiguous run of the ciphertext. The renderer winds the *same* grid the math defines.
- **Decipher (exact inverse).** Knowing `n` and `C` gives each column's length (`rem = n mod C` "long"
  columns of length `R` are the first `rem` columns; the rest are length `R-1`). Slice the ciphertext
  into columns in read-order, drop each into its home position, read the grid row-by-row. Same `C`
  (and keyword) ⇒ exact `P`.

Circumference range: **C = 2…12** (the operable rod). When `C ≥ n` the grid is a single row and the
cipher is the identity (a real boundary case, asserted by the self-test).

## §2 — The keyed columnar generalisation

A genuine step up from the plain scytale, and a real classical cipher in its own right. A **keyword**
permutes the column **read-order**: rank the keyword's letters alphabetically (ties broken
left-to-right, the standard convention); read the columns in ascending rank. If the keyword is shorter
than `C` its letters are used cyclically so every column gets a key letter. The derived order is a
genuine permutation of `0…C-1`.

Canonical vector (Wikipedia worked example): `WEAREDISCOVEREDFLEEATONCE`, keyword `ZEBRAS`, C=6 →
`EVLNACDTESEAROFODEECWIREE`. ZEBRAS columns are read in ascending rank of their key letter —
`A(col4) B(col2) E(col1) R(col3) S(col5) Z(col0)` → read-order `[4,2,1,3,5,0]`. (Wikipedia lists the
per-column 1-based ranks `6 3 2 4 1 5`, which is the inverse of this read-order; both yield the same
ciphertext.)

## §3 — The instrument (UI)

- **The rod.** A hand-rolled SVG cylinder with end-caps and wood grain, a wound parchment strip
  spiralling around it. Typing the plaintext lays letters along the strip in winding order.
- **Two readings.** **Wound** view: the strip on the rod, plaintext readable along the helix (rows are
  turns); a faint gold guide marks one column — that column **down the rod** is a ciphertext run.
  **Unwound** view: the strip lifts off into a single straight band — the ciphertext read along the
  rod's length. Click the rod to toggle; hover a wound letter to light its whole column (and the
  matching cipher run) in both views.
- **Circumference C** control (the key): a slider + ±1 dials. Changing C re-winds the strip.
- **Mode**: Scytale (plain) · Keyed columns (keyword). The keyed panel shows the derived read-order.
- **Direction**: Encipher · Decipher (reversible by design — same C and key decodes exactly).
- **The "wrong rod" demo.** Read the real ciphertext at a different circumference `C′ ≠ C` → gibberish,
  shown live (and green-flagged when `C′ = C`). Proves the diameter is the key.
- **Output tape**: plaintext / order / ciphertext in five-letter groups (house convention), copy +
  clear.
- **3 cosmetic skins**: oak / bone / blueprint — recolour ONLY (geometry provably identical, §4.5).
- **Seeded "surprise me"**: a pleasing C (or keyword) + sample text.
- **2× PNG export**: paints the rod (at its current view) + tape via the manual canvas pattern (no
  `<foreignObject>`, so `toDataURL` works headless).
- **Aesthetic**: the workshop dark house style (`--bg:#080a0f; --ink:#eaf0fa; --muted:#8b95a8;`),
  Georgia serif display, ui-monospace kickers, brass `#c9a24a`.

## §4 — The self-test (proves the core claim)

A pure `CORE` (columnar-transposition engine: `cleanText`, `clampC`, `rows`, `colLen`, `keyOrder`,
`readOrder`, `encipher`, `decipher`, `perm`, `fingerprint`) is the single source of truth for both the
renderer and the headless test (no parallel copy). `GEO.layout(C,n)` is the pure rod geometry. The
visible panel (top-bar chip) asserts, against known math:

1. **Round-trip**: `decipher(encipher(P,S),S) === P` exactly, both modes, 1200 random `P`+`S`.
2. **True permutation**: `perm` is a bijection of `0…n-1` (no loss/dup) and `encipher` preserves the
   character multiset; `OUT[i] === P[perm[i]]` — 1000 random cases.
3. **Definitional correctness**: `encipher` equals an independently-recomputed column-read of the
   row-filled C-wide grid (plain + keyword-permuted order), 800 random cases; plus the two textbook
   vectors (`IAMHURTVERYBADLY @ C=5 → IRYYATBMVAHEDURL`; `WEAREDISCOVEREDFLEEATONCE / ZEBRAS →
   EVLNACDTESEAROFODEECWIREE`), the ZEBRAS read-order `[4,2,1,3,5,0]`, and the `C ≥ n` identity.
4. **Key sensitivity**: a wrong circumference `C′ ≠ C` fails to recover `P` in >97% of trials, and a
   different keyword (different read-order) fails in >95% — the diameter/key is load-bearing.
5. **Seed-reproducibility + skin-invariance**: the cipher output is a pure function of
   (settings, message) and is identical across all 3 skins (CORE never sees the skin); and
   `GEO.layout` is byte-identical across all 3 skins (only colour differs).

Result shown as **N/N PASS** (currently **13/13**). The same `CORE`/`runSelfTest` are exported under a
module guard and pass headlessly in Node (forge strips the guard for the browser build).

## §4.5 — Skins are cosmetic only

The 3 skins are pure palette objects. `CORE` and `GEO` never receive a skin; the cipher output and the
rod geometry are invariant by construction (proved by self-test claim 5).

## §5 — Files

- `scytale/index.src.html` — the editable source (carries `<!-- forge:include ../tools/ws/ws.js -->`
  and `WS.seen('scytale')`, the shared-unlock keystone pattern).
- `scytale/index.html` — forge-generated, self-contained, double-clickable. **Do not edit directly.**
  Build: `node tools/forge/forge.mjs scytale/index.src.html`; verify: `… --check scytale/index.src.html`.
- `scytale/SCYTALE.SPEC.md` (this file) · `scytale/CHANGELOG.md`.
- Workbench: an `<a class="card">` in the **Instruments** group (next to the Volvelle — cipher kin).
