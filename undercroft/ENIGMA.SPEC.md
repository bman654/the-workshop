# Enigma — a faithful WWII cipher machine (the workshop's first *cryptographic device*)

**File:** `undercroft/enigma.html` — single self-contained vanilla HTML/CSS/JS, **0 deps, 0 network, 0 build, NO AUDIO.** ~1070 lines.

## What it is

A genuine, **mechanically-correct three-rotor Enigma I** (Wehrmacht/Heer) that you operate. Not art
to watch, not a game, not a puzzle — a *real working cryptographic instrument* whose correctness is
**provable**: it reproduces the historical test vectors exactly, it is its own inverse (the defining
Enigma property), and it never maps a letter to itself (the famous structural weakness). This opens
a new vein — a **cryptographic device** — as the sibling of Slipstick (the analog computer): you set
it up, you type, and you watch a live electrical path thread the wiring as the rotors step and a lamp
lights.

The joy: press a key. The rotors step *first* (the right one always; the middle and left per the
famous double-step anomaly), then the current flows keyboard → plugboard → right→middle→left rotor →
reflector → back through left→middle→right → plugboard → lamp. The lamp lights; the signal-path
schematic draws the exact contacts the current took. Because the reflector makes the whole thing an
involution, setting the same start and typing the ciphertext reads the plaintext back.

## The machine (cryptographically faithful — the crux)

Historical wirings (Enigma I; entry wheel ETW = identity, **not** added as a non-historical stage):

| Rotor | Wiring (A→Z maps to)         | Turnover notch |
|-------|------------------------------|----------------|
| I     | `EKMFLGDQVZNTOWYHXUSPAIBRCJ`  | Q              |
| II    | `AJDKSIRUXBLHWTMCQGZNPYFVOE`  | E              |
| III   | `BDFHJLCPRTXVZNYEIWGAKMUSQO`  | V              |
| IV    | `ESOVPZJAYQUIRHXLNFTGKDCMWB`  | J              |
| V     | `VZBRGITYUPSDNHLXAWMJQOFECK`  | Z              |

Reflectors (UKW): **B** `YRUHQSLDPXNGOKMIEBFZCWVJAT` · **C** `FVPJIAOYEDRZXWGCTKUQSBNMHL`

- **Plugboard (Steckerbrett):** up to 10 reciprocal letter-pair swaps, click-to-pair / click-to-unpair.
- **Ring settings (Ringstellung):** per-rotor ring offset A–Z, applied correctly (the part everyone
  gets wrong — see the offset formula below).
- **Ground/start position (Grundstellung):** per-rotor visible letter A–Z, user-settable; the live
  rotor positions advance as you type and can be hand-turned with thumbwheels.

### The rotor offset convention (consistent; reproduces all historical vectors)

For a contact `c` (0..25) entering a rotor at position `p` with ring `r`:

```
entry  = (c + p − r) mod 26
mapped = wiring_forward[entry]   (or wiring_inverse on the return leg)
exit   = (mapped − p + r) mod 26
```

### Stepping (the famous tricky part — the double-step anomaly)

Stepping happens **before** the signal passes. With `0=left, 1=mid, 2=right`:

```
midAtNotch   = pos[1] == notch[1]
rightAtNotch = pos[2] == notch[2]
if midAtNotch:        pos[1]++ ; pos[0]++      // double-step: middle moves on consecutive presses,
elif rightAtNotch:    pos[1]++                 //   dragging the left rotor with it
always:               pos[2]++
```

### Signal path

`key → plugboard → R rotor (R→L) → M (R→L) → L (R→L) → reflector → L (L→R) → M (L→R) → R (L→R) → plugboard → lamp`

## The provable crux — `runSelfTest()` (workshop tradition)

A headless self-test calls the **real** machine functions (not a copy) and lights a green chip
**"cipher verified — 12/12 ✓"** (never ships red). It also runs identically under Node by extracting
the same `<script>` core (proving the math independent of the browser). Assertions:

- **(A) Historical vectors, exact string equality** (the three pins below).
- **(B) Reciprocity / self-inverse:** over 2200 random machine settings, encrypt then decrypt from the
  same start returns the original plaintext.
- **(C) No fixed point:** over 39 000 (setting, letter) cases, **0** letters ever encrypt to themselves.
- **(D) Reciprocal lamp:** in a frozen state the lamp map is a fixed-point-free involution (X→Y ⇒ Y→X)
  swept across 10 400 contacts.
- **(E) Permutations & involutions:** all 5 rotor wirings are bijections; both reflectors are
  fixed-point-free involutions.
- **(F) Determinism + skin invariance:** identical settings+input ⇒ identical output; switching the
  cosmetic skin does **not** change a ciphertext fingerprint.
- **(G) Stepping correctness:** the double-step position trace matches a known case exactly.

## Historical test vectors asserted (verified by computation)

1. **The textbook tick** — I·II·III, UKW-B, rings AAA, start AAA, no plugboard: `AAAAA` → **`BDZGO`**.
2. **The double-step anomaly** — I·II·III, rings AAA, start **ADU**: position trace steps
   **ADV → AEW → BFX**. The middle rotor (II, notch E) advances on two consecutive presses
   (D→E→F), dragging the left rotor (A→B) — the canonical double-step.
3. **The Aachen daily key** (German-Wikipedia worked example; the toughest pin — non-trivial rings +
   10 steckers + a long run) — I·IV·III, UKW-B, **rings 16·26·08 (P Z H)**, steckers
   `AD CN ET FL GI JV KZ PU QY WX`, start **RTZ**: `XAACHENXAACHENXISTGE` → **`EJZLBSYEQPDWDUE…`**.
   Plus the indicator demo: start **QWE**, type `RTZ` → lights **`EWG`**.

   *(Note: the ECSHL example originally specified for this slot matches no correct Enigma engine under
   any (ring, start) — verified by an exhaustive 26⁶ sweep — so it was replaced with the
   fully-documented, independently-verifiable Aachen vector, which exercises the ring/plug/stepping
   math far more rigorously.)*

## Controls

- **Walzenlage:** three rotor dropdowns (I–V), with a duplicate-selection guard (dupes flag red and
  block keypresses until distinct).
- **Reflector:** UKW-B / UKW-C segmented toggle.
- **Ringstellung & Grundstellung:** per-rotor A–Z inputs; "Set start = window" and "↺ to start".
- **Plugboard:** 26-letter grid, click-to-arm then click-to-pair (max 10), click a paired letter to
  unpair; "Clear plugboard".
- **Keyboard / lampboard:** historical **QWERTZ** layout (`QWERTZUIO / ASDFGHJK / PYXCVBNML`). Click a
  key or type on the physical keyboard — rotors step, the output lamp lights, the signal path draws.
- **Transcript:** type/paste a message; it enciphers live from the start position, shown in five-letter
  groups (plain over cipher). "Use output as input (decrypt)" and "Re-encipher from start" demonstrate
  reciprocity.
- **Worked presets:** *the textbook tick* (AAAAA→BDZGO), *the Aachen daily key*, *the double-step
  anomaly* — each loads the setting and animates a short message through.
- **Export PNG:** a canvas-native 2× snapshot of the machine face (rotor windows, signal path,
  lamps/keys, plugboard). Drawn directly to a `<canvas>` — no `foreignObject`, so the canvas is never
  tainted.

## Skins (cosmetic only — never alter ciphertext)

CSS-variable skins, asserted invariant by the self-test (the fingerprint is identical across all three):

- **Heeres** — field-grey/black bakelite, the classic Wehrmacht look (default).
- **Brass** — warm museum brass and wood.
- **Blueprint** — schematic cyan line-art.

## Undercroft conventions

- Top-left backlink `← the undercroft` (`index.html`); self-test badge reuses the `.badge / .badge.ok /
  .badge.bad / #selftest / #selftestText` pattern.
- Breadcrumb on load: `localStorage.setItem('ws:seen:enigma','1')` (try/catch-guarded for `file://`).
- `prefers-reduced-motion` respected (path/lamp render instantly, no animation); all localStorage
  writes guarded.
