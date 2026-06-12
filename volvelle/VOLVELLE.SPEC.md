# 🔄 Volvelle — build spec

*A genuine, operable **Alberti cipher disk** (a *volvelle* — the historical name for a rotating-disc
instrument). The 4th instrument on the workshop's bench (Slipstick · Astrolabe · Abacus · **Volvelle**):
a real instrument you operate that does **real, historically-faithful cryptography** — Caesar,
Vigenère, and Alberti's own mixed-alphabet polyalphabetic cipher — by physically **turning the disk**.
The workshop's signature: a built-in self-test that **proves** the cipher is correct (round-trips
exactly, the disk's letter-alignment equals the modular math, every cipher alphabet is a true
bijection, and it reproduces the canonical textbook vectors to the letter).*

Folder: `volvelle/`. One self-contained file: `volvelle/index.html` (no build, no network, no deps).
Build log: `volvelle/CHANGELOG.md`.

> **⚠️ CONTEXT — why this exists, and what NOT to duplicate.** The workshop already has a full
> **Enigma I** hidden in the Undercroft (`undercroft/enigma.html`) — rotors/plugboard/reflector, a
> signal-path trace, historical key vectors. The Volvelle is **deliberately a different machine**: a
> *rotating cipher disk* (concentric alphabet rings), classical pre-electromechanical cryptography.
> It is the **public** cipher instrument; the Enigma stays the hidden, earned one. Do **not** add
> rotors/plugboard/reflector here, and do **not** reference or surface the hidden Enigma. Keep them
> distinct so the hidden machine stays a surprise.

---

## §0 — The mechanism (an Alberti cipher disk)

Two concentric alphabet rings on a common pivot, with a fixed index mark:
- **Outer ring (the *stabilis*)** — **FIXED**. The plaintext alphabet, **A–Z in natural order**,
  engraved around the rim.
- **Inner disk (the *mobilis*)** — **ROTATES**. The cipher alphabet. Turning it changes which cipher
  letter sits under each plaintext letter — i.e. it sets the key.

To **encipher** a plaintext letter P: find P on the outer ring; the cipher letter is the inner-disk
letter currently aligned beneath it. To **decipher** C: find C on the inner disk; the plaintext is
the outer letter above it. (Reciprocal by reading direction — a "decipher" toggle flips the lookup.)

The **inner alphabet** is one of two:
- **ordered** `ABCDEFGHIJKLMNOPQRSTUVWXYZ` → the disk implements a **Caesar/shift** cipher: a rotation
  by `k` means cipher(P) = (P + k) mod 26.
- **mixed** — a **seeded scrambled** permutation of A–Z (the workshop's seeded-generator tradition).
  This is the authentic Alberti disk (a mixed cipher alphabet). cipher(P) = innerMixed[(P + rot) mod 26]
  for the current rotation `rot`.

The **key / rotation** is set one of three ways → the **three modes**:

1. **Caesar** — inner = ordered; **fixed rotation** `k` (0–25). Monoalphabetic. The disk does not move
   while enciphering. (k=3 = Caesar's own cipher; k=13 = ROT13, which is self-inverse.)
2. **Vigenère** — inner = ordered; rotation is **driven by a keyword** — for plaintext position i, set
   `rot = letterIndex(key[i mod keylen])`, then cipher(P) = (P + rot) mod 26. The disk **steps to a
   new alignment for each letter** as you type. Polyalphabetic, period = key length.
3. **Alberti** — inner = **mixed (seeded)**; the rotation **changes periodically** every `N` letters
   (the *index period*, e.g. 4): each period, advance the disk by a fixed step so the cipher alphabet
   re-keys mid-message (Alberti's 1467 innovation — the first polyalphabetic cipher). Within a period
   the disk is fixed; at each period boundary it turns. (Mixed alphabet + periodic re-keying.)

All three are the **same physical disk** — only how the inner alphabet is built and when/by-how-much
it turns differ. Build the disk once; the modes parameterize it.

---

## §1 — The correctness crux (the workshop promise)

Like Slipstick ("the reading equals the true arithmetic") and Abacus ("the beads are an exact
bijection with the number"), this instrument's promise is **correctness**. A pure `CORE` engine (no
DOM, no skin, no rendering) is the single source of truth for BOTH the renderer and a headless
`runSelfTest()`. The self-test calls the *same* CORE functions the UI uses and proves:

1. **Round-trip identity (the defining property).** For all three modes, across many random settings
   (random shift / random keyword / random seed+period) and random 200-letter messages:
   `decipher(encipher(m, S), S) === m`. Exactly.

2. **The disk's alignment equals the math (the "reading == computation" crux).** For the Caesar disk
   at rotation `k`, the cipher letter the renderer places under plaintext letter `P` (computed from the
   disk geometry / the rendered alignment) must equal `(P + k) mod 26` for all P, all k. (Assert the
   geometry function and the arithmetic agree — the instrument can't lie about its own reading.)

3. **Every cipher alphabet is a true bijection.** The seeded mixed alphabet (any seed) is a
   permutation of A–Z — all 26 letters exactly once — so every cipher is invertible (no collisions).
   Assert over many seeds.

4. **Canonical textbook vectors (gold standard — non-negotiable).**
   - **Vigenère:** plaintext `ATTACKATDAWN`, key `LEMON` → `LXFOPVEFRNHR`. (The Wikipedia textbook
     example. Assert exactly.)
   - **Caesar shift 3:** `HELLO` → `KHOOR`. **ROT13:** `HELLO` → `URYYB`, and ROT13 is its own inverse
     (`encipher(encipher(x,13),13) === x`). Assert all three exactly.

5. **Mode consistency.** Caesar with shift `k` ≡ Vigenère with a length-1 key whose letter has index
   `k` (same output) — proves the modes share one engine.

6. **Seed-purity & skin-invariance.** Cipher output depends only on `(mode, key/shift, seed, period)`
   — never on the active skin. Same seed → identical mixed alphabet → identical ciphertext across all
   3 skins. Assert a `cipherFingerprint(settings, msg)` is identical across skins (or keep it invariant
   by construction since CORE never sees the skin, and assert seed-purity).

`runSelfTest()` runs on load → topbar badge: green `volvelle verified — N/N ✓` or red `… FAILED — k/N`.
Also `console.log` the result. **If vector #4 fails, the engine is wrong — fix before shipping.**

---

## §2 — What the user can do (controls & behaviour)

The point is that it's **operable** and you **watch the disk turn**:

- **Type to encipher.** A text input (and/or live key handler): as letters go in, the disk **rotates
  to the correct alignment** (animated, reduced-motion aware), the active plaintext letter on the
  outer ring and its cipher letter on the inner disk **highlight** (a radial line connecting them),
  and the ciphertext builds in the output, grouped in **5-letter blocks**. Non-letters are dropped
  (classical convention); letters auto-uppercase. (Optional, if easy: a "preserve spaces" toggle.)
- **Mode selector** — Caesar / Vigenère / Alberti (a segmented control). Switching modes shows the
  relevant key control:
  - Caesar → a **shift** dial/slider 0–25 (and the disk shows that rotation live).
  - Vigenère → a **keyword** text field (letters only; show the repeating key under the plaintext).
  - Alberti → a **seed** (for the mixed alphabet, re-rollable + a "🎲 surprise" button) + an **index
    period** N (e.g. 1–8) + the per-period step.
- **Encipher ⇄ Decipher toggle** — flips the lookup direction. Make reciprocity obvious: a one-line
  note ("↺ reversible — same settings decode it") and the fact that typing the ciphertext back with
  Decipher recovers the plaintext (the round-trip the self-test proves).
- **Drag the inner disk** to rotate it by hand (snapping to letter steps) — in Caesar mode this sets
  the shift live; a tactile affordance even when not typing.
- **Output tape** — ciphertext in 5-letter groups, with **copy** and **clear**; echo the input so the
  pairing reads clearly. In Vigenère mode, show the key letters aligned under the plaintext.
- **Presets** (buttons): **"Caesar (shift 3)"**, **"ROT13"**, **"Vigenère — ATTACKATDAWN / LEMON"**
  (loads the canonical vector so a curious user types it and watches `LXFOPVEFRNHR` emerge), and a
  **"Clear"**. A worked Alberti example with a fixed seed is a nice extra.
- **Skins** (§4), **Export 2× PNG** (§5).

Fully usable in every mode; nothing depends on optional extras.

---

## §3 — Layout & visual design

Read as a real engraved brass cipher disk in the workshop's warm-instrument aesthetic (match
Abacus/Slipstick/Astrolabe: serif headings, mono labels/tape, frosted control panel, radial-lit dark
background, system fonts). Single fixed-viewport layout:

```
┌───────────────────────────────────────────────────────────────────────┐
│ ← workshop          Volvelle · a cipher disk            [verified ✓]    │  topbar (fixed)
├──────────────────────────────────────────────┬────────────────────────┤
│                                                │  CONTROLS (sidebar)     │
│            ╭───────────────╮                   │  Mode [Caesar][Vig][Alb]│
│         A B C  ▼index       D E                │  Shift  ◀ [ 3 ] ▶  /    │
│       Z  ╭───────────────╮     F               │   Keyword: LEMON   /    │
│      Y  │   inner disk    │      G  ← outer     │   Seed 4821  🎲 · N [4] │
│      X  │  (cipher ring,  │       H   ring      │  Direction [Enc][Dec]   │
│      W  │   rotates)      │      I   (fixed,    │  Presets: Caesar3 /     │
│       V  ╰───────────────╯     J    plain A–Z) │    ROT13 / ATTACK·LEMON │
│         U T S       R Q P  O N M L              │    / Clear              │
│                                                │  Skin [.][.][.]         │
│   ▭ OUTPUT ▭  LXFOP VEFRN HR     [copy][clear] │  [ Export 2× PNG ]      │
│   plain:      ATTAC KATDA WN                    │  hint…                  │
│   key:        LEMON LEMON LE                    │                         │
└──────────────────────────────────────────────┴────────────────────────┘
```

**The disk** (SVG is ideal — clean text-on-a-circle, easy rotation transform, crisp PNG):
- Two concentric rings of 26 letter cells, evenly spaced (13.846° each). Outer ring letters upright
  and fixed; inner ring letters ride a `<g>` you rotate via `transform: rotate(θ)`. A fixed **index
  triangle/mark** at the top (12 o'clock). Engraved tick marks between letters; a brass pivot hub.
- When typing/active: highlight the plaintext cell (outer) and its enciphered cell (inner) — e.g. a
  glowing radial spoke + brightened letters. The rotation animates between alignments (~200–300ms,
  snap if reduced-motion).
- Legible at the page's size and crisp in the 2× PNG.

Use SVG for the disk; HTML for controls/tape. Whatever renders cleanly at 60fps and exports crisp.

---

## §4 — Skins (cosmetic only — 3)

Three skins via CSS custom properties on `:root`, switched by a `data-skin` segment of buttons
(the established Abacus pattern). **Skins change only colour/material — never the cipher, geometry,
or readout.** Keep CORE skin-blind (it never receives the skin) so output is invariant by construction;
the self-test asserts seed-purity (§1.6).

Three fitting skins for a Renaissance cipher disk:
- **`brass`** (default) — engraved brass disc, dark patina ground, warm amber highlight on the active
  spoke, ivory letters.
- **`parchment`** — Alberti's paper volvelle: aged parchment disc, sepia ink letters, a red index mark
  (the historical look).
- **`blueprint`** — the workshop's house blueprint skin (cyan lines on dark navy) for bench consistency.

---

## §5 — Conventions (match the bench exactly — read `abacus/index.html`)

- **Self-contained:** one `volvelle/index.html`, inline `<style>` + `<script>`, no network/libs. System
  font stacks (serif headings, mono labels/tape, sans body) — copy from Abacus.
- **Back-link** (topbar, top-left): `<a class="back" href="../index.html">&larr; workshop</a>` styled
  exactly as the other instruments (uppercase mono, dim → accent hover).
- **Self-test badge** (topbar, right): `<div class="selftest" id="selftest">checking…</div>`; on load
  run `runSelfTest()`, set `.ok`/`.bad` + text `volvelle verified — N/N ✓`. Same CSS as Abacus
  (`.selftest.ok` green / `.selftest.bad` red). `console.log` the result too.
- **ws: breadcrumb** (in `init()`):
  `try{ localStorage.setItem('ws:seen:volvelle', String(Date.now())); }catch(_){}` (id = `volvelle`;
  see `UNLOCK.md`). Test over a SERVED origin, never file://.
- **PNG export:** a primary **"Export 2× PNG"** button that draws the current disk (at its live
  rotation, with the active spoke if any) + the output tape to an offscreen canvas at `scale=2` and
  downloads `volvelle-<skin>-<mode>.png`. Manual canvas draw (Abacus pattern) — **do NOT** rasterize an
  SVG `<foreignObject>` (it taints the canvas → `toDataURL` SecurityError; this bit a prior instrument).
  Draw the rings/letters/spoke directly with canvas APIs from the same geometry CORE uses.
- **Aesthetic:** warm engraved instrument; frosted control panel (`backdrop-filter: blur(...)`);
  rounded frames; restrained palette from CSS vars. No persistent page footer (hint text lives at the
  bottom of the control panel).

---

## §6 — Workbench registration

Add a 4th card to the **Instruments** group in `workbench/index.html` (read the file for exact markup:
a `<div class="group">` with `<p class="grouphead">Instruments</p>` and a `.deck` of `<a class="card">`s;
match the surrounding cards' whitespace/attributes):

```html
<a class="card" href="../volvelle/index.html">
  <div class="cardhead">
    <span class="glyph">🔄</span>
    <span class="name">Volvelle</span>
    <span class="kind">cipher disk</span>
  </div>
  <p class="blurb">A working Alberti cipher disk — turn the lettered wheel to encode by Caesar shift,
  Vigenère keyword, or Alberti's own mixed alphabet, and watch the disk step letter by letter.
  Reversible by design: the same setting decodes it. <span class="open">Open ▸</span></p>
</a>
```
(The glyph 🔄 is a placeholder — pick the single emoji that best reads as a rotating lettered disk if
you find a better one; not load-bearing.)

---

## §7 — Verification (before committing)

Test over a **served origin**, never `file://`. Use a **uniquely-named** agent-browser session.

Verify HEADLESSLY FIRST — write a /tmp Node harness using the shipped CORE and assert ALL of §1
(round-trip all 3 modes; alignment==math; bijection over many seeds; the **Vigenère LXFOPVEFRNHR**,
**Caesar HELLO→KHOOR**, **ROT13 HELLO→URYYB + self-inverse** vectors exactly; mode consistency;
seed-purity). Only once Node is green do you wire the SAME CORE into the page's `runSelfTest()`.

Then in a real browser confirm:
- [ ] Self-test badge green (all checks).
- [ ] Vigenère preset + typing `ATTACKATDAWN` shows `LXFOPVEFRNHR` (grouped) on the tape; the disk
      visibly steps per letter; the active spoke connects the right plaintext/cipher letters.
- [ ] Caesar shift 3 → `HELLO`→`KHOOR`; ROT13 → `URYYB`; decipher toggle round-trips back to plaintext.
- [ ] Alberti mode: a seed produces a mixed alphabet; the disk re-keys every N letters; round-trips.
- [ ] Drag-to-rotate works (snaps to letters; sets the shift in Caesar mode).
- [ ] All 3 skins switch cleanly; cipher output identical across skins; **zero console errors**.
- [ ] Export 2× PNG downloads a crisp image of the disk at its current rotation.
- [ ] Back-link → `../index.html`; the new workbench card opens the page.
- [ ] 60fps-smooth disk rotation; clean console; `ws:seen:volvelle` set in localStorage (served origin).

Append a build entry to `volvelle/CHANGELOG.md` and `git commit` (do NOT push — the lead handles push).
Leave the working tree clean except your commit.
