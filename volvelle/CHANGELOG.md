# Volvelle — changelog

## 2026-06-12 — Build: an operable Alberti cipher disk (the bench's 4th instrument)

Shipped `volvelle/index.html` — one self-contained file (inline `<style>` + `<script>`, no
network, no libs), the 4th instrument on the workshop bench (Slipstick · Astrolabe · Abacus ·
**Volvelle**). A genuine, operable rotating cipher disk that performs three real classical ciphers
by physically turning the disk: **Caesar**, **Vigenère**, and **Alberti**'s mixed-alphabet
polyalphabetic cipher.

### What it is (and isn't)
A *volvelle*: a FIXED outer ring (plaintext A–Z, natural order) + a ROTATING inner disk (the cipher
alphabet). Turning the inner disk sets the key. Three modes parameterize the one disk:
- **Caesar** — inner = ordered; a fixed rotation `k` (0–25). Monoalphabetic.
- **Vigenère** — inner = ordered; the rotation is driven by a keyword, stepping per letter.
- **Alberti** — inner = a seeded *mixed* permutation of A–Z; the rotation re-keys every `N` letters
  (the index period), advancing by a fixed step at each boundary (Alberti's 1467 innovation).

No rotors / plugboard / reflector — that is a different machine and is not referenced here.

### Build approach (correctness-first)
- A pure `CORE` engine (no DOM, no skin, no render) is the single source of truth for BOTH the SVG
  renderer and `runSelfTest()`. The renderer's disk-alignment and the cipher math call the *same*
  `cipherUnder` / `plainOver` functions, so the instrument cannot lie about its own reading.
- The inner mixed alphabet is a seeded Fisher–Yates shuffle using the workshop's standard
  `mulberry32` + `xmur3` PRNG (verbatim from `latch/`), so it is a true bijection and pure in the
  seed.
- **Verified HEADLESSLY FIRST**: a throwaway Node harness (`/tmp/volvelle-core.js` +
  `/tmp/volvelle-test.js`) asserted all of spec §1 — 13/13 green:
  - round-trip `decipher(encipher(m,S),S)===m` over 3000 random settings × 200-letter messages,
    all 3 modes;
  - alignment == math: the Caesar disk's cipher-under-P equals `(P+k) mod 26` for all 26×26;
  - bijection: the seeded mixed alphabet is a permutation of A–Z over 2000 seeds;
  - **canonical vectors, exact**: Vigenère `ATTACKATDAWN`/`LEMON` → `LXFOPVEFRNHR`; Caesar shift 3
    `HELLO`→`KHOOR`; ROT13 `HELLO`→`URYYB` + self-inverse; Vigenère decode round-trips;
  - mode consistency: Caesar(k) ≡ Vigenère(length-1 key of index k);
  - seed-purity / skin-invariance: output is a pure fn of (mode, key/shift, seed, period, step,
    start), never the skin.
- Then the SAME CORE was wired into the page. An extraction harness pulled the in-page `CORE` +
  `runSelfTest` out of the shipped HTML and confirmed it is behaviorally identical to the reference
  CORE (0 diffs over 2000 Alberti settings) and that the page's own self-test is 13/13.

### The instrument
- SVG disk: two concentric lettered rings (26 cells, 13.846° each), fixed index triangle at 12
  o'clock, engraved ticks, a brass pivot hub. The inner disk rides a `<g>` rotated by a CSS-animated
  `transform: rotate(θ)` (reduced-motion aware). A glowing radial spoke + brightened letters mark
  the active plaintext↔cipher pair.
- Type to encipher: the disk steps to the correct alignment per letter; non-letters dropped,
  letters auto-uppercased; output tape in 5-letter groups.
- Mode selector with the relevant key control (shift slider+dial / keyword field / seed+🎲 + index
  period N + per-period step). Encipher⇄Decipher toggle (reciprocal). Drag the inner disk to rotate
  by hand — snaps to letter steps and sets the shift live in Caesar mode.
- Output tape: 5-letter groups, copy + clear, echoes the input; the repeating key is shown under the
  plaintext in Vigenère.
- Presets: Caesar (shift 3), ROT13, Vigenère — ATTACK/LEMON (loads the canonical vector), Alberti —
  worked, Clear.
- 3 skins (brass default / parchment / blueprint) via CSS vars + a `data-skin` segment — cosmetic
  only; cipher output is identical across all three.
- Export 2× PNG via a manual canvas draw (no `<foreignObject>` — never taints the canvas) of the
  disk at its live rotation with the active spoke + the tape strip.
- `← workshop` back-link, self-test badge, `ws:seen:volvelle` breadcrumb (written in `init()`).

### In-browser verification (served origin, agent-browser session `volvelle-build`)
Served from repo root (`python3 -m http.server 8793`), browsed `http://127.0.0.1:8793/…`. Confirmed
the full spec §7 checklist:
- self-test badge **green — volvelle verified 13/13 ✓**;
- Vigenère preset + `ATTACKATDAWN` → tape shows `LXFOP VEFRN HR` with key `LEMON LEMON LE` under the
  plaintext; the disk steps per letter; the spoke connects the right pair;
- Caesar 3 `HELLO`→`KHOOR`; ROT13→`URYYB`; Decipher toggle round-trips `URYYB`→`HELLO`;
- Alberti (seed 4821, N=4, step 1): mixed alphabet in play, rotations `[0,0,0,0,1,1,1,1,2,2,2,2,…]`
  re-keying every 4, round-trips exactly;
- drag-to-rotate snaps to letter steps and set the Caesar shift live (13→18 on a ~5-cell drag);
- all 3 skins switch cleanly, **identical cipher output** across skins, **zero console errors**;
- Export 2× PNG → a valid 1000×1192 untainted PNG (crisp disk + spoke + tape);
- back-link → `../index.html`; the new workbench Instruments card opens the page.

Also registered a 4th card (🔄 Volvelle · cipher disk) in the **Instruments** group of
`workbench/index.html`.

### Deviations from the spec
- None material. The Alberti `start` rotation is fixed at 0 (the per-period `step` does the
  re-keying work, matching the historical "advance the disk each period" mechanic); the spec lists
  seed + index period + per-period step as the Alberti controls, which are all present. The "preserve
  spaces" toggle (called out as optional/if-easy) was not added — classical letters-only convention
  is used throughout.
