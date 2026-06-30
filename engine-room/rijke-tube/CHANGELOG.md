# The Rijke Tube — CHANGELOG

*The Engine Room's sixth bench, and the ONE engine in the wing whose work output
is **sound you can hear across the room** (its five siblings turn heat into a
turning shaft, a sorted gas, a counted race). A hand-played, gesture-gated
WebAudio instrument: drag a glowing hot wire-gauze into the lower half of an
open–open organ pipe and the confined heat finds its voice — a fat standing-wave
tone that swells in on its own; push the gauze past the midpoint and the voice
goes dead. Rayleigh's thermoacoustic-instability criterion, made audible.*

## v1 — first build (2026-06-29, Opus 4.8 · BUILD/garden cycle #361)

**What it is.** A vertical, glowing-brass **open–open pipe** over a firebox. A
hot **wire-gauze** the visitor drags up and down the column is the one control
that decides whether the air sings. Two brass dials set **heat flux Q** and
**gauze height u = x_h/L**; a pipe-length slider **L** retunes the fundamental.
Stoke the firebox and, with the gauze in the lower half, the tube bursts into a
loud pure tone whose standing-wave envelope swells live on the canvas; slide the
gauze across the midpoint and the same furnace falls dead silent.

**The claim (Rayleigh's criterion).** A flame feeds a standing wave only where it
dumps its heat as the air is being **compressed**. For a hot gauze at fractional
height `u = x_h/L` in an open–open tube the linear modal growth rate of the
fundamental reduces (up to a positive constant) to

```
γ(u, Q)  ∝  Q · sin(2π·u)
```

so the **sign** of γ — the only thing the core pins — depends purely on position:

- `u ∈ (0, ½)` → `sin(2πu) > 0` → **γ > 0**, the tube **SINGS** (lower half)
- `u = ½` → `sin(π) = 0` → **γ = 0**, dead silent EXACTLY (the node)
- `u ∈ (½, 1)` → `sin(2πu) < 0` → **γ < 0**, silent (upper half)

The fundamental of an open–open pipe is `f = c / 2L` (exact, not part of the
snapped instability core): a **taller pipe hums lower**.

**The negative control (the lie heat alone can't tell).** `Q = 0 ⇒ γ = 0`
everywhere: heat is required, and confinement alone — a cold pipe — makes no
sound. The bench proves this in code (`targetAmp` decays to silence and `sings()`
is false at every u when Q=0), not by assertion.

**The form (an instrument you play, not a γ-vs-u plot).**
- **The pipe** (the hero): a procedural glowing-brass column with elliptical open
  mouths, a firebox heat-glow pool at the base brightening with Q, a green
  singing-zone wash on the lower half, a dashed dead-node line at u=½, the
  draggable hot wire-gauze glowing ∝ Q, and a standing-wave envelope **pinched at
  the node** whose swell tracks the saturated tone.
- **The voice**: a warm flue-pipe synthesis (partials 1 / 0.34 / 0.20 / 0.09 /
  0.05 + a band-passed draft noise), asleep on load and **gesture-gated** — it
  wakes only on a real user gesture, exactly as browser autoplay policy requires —
  ramped through a master gain + compressor, and `ws:pref:muted`-aware with a
  cross-tab storage listener.
- **The register**: a verdict panel reading **cold & silent / sputter / ROARING**,
  coloured by the sign of γ, with the live γ equation, u, Q%, and f in Hz, plus a
  note-name/cents readout (e.g. `F3 −31¢`).
- **A small secondary mode-shape chip**: the open–open pressure (`p′ ∝ cos`) and
  velocity (`u′ ∝ sin`) curves with a gauze marker coloured by the sign of γ, so
  "p′ and q′ in phase in the lower half" becomes touchable — kept minimal, never a
  second large panel.
- **The Stoker's Trial**: an alternating game (find the **loudest hold** ⇄
  **silence** it) that prints the Rayleigh WHY on each win.

**The honesty hinge — the midpoint SNAP.** `Math.sin(2π·0.5) = Math.sin(π)` is
`1.2246e-16` in IEEE-754, **not** a clean 0. Trusting the library would falsify
the "γ = 0 EXACTLY at the midpoint" claim (1e-16 satisfies `|γ|≤1e-12` but is not
bit-exact zero). So the core works in half-turns `t = 2u` and returns a bit-exact
`0` the instant `t` is an integer: `growthRate(0.5, Q) === 0` for ANY finite Q,
and the same snap fires at u=0 and u=1 (the open mouths are nodes too). The
buoyant-draft / orientation / settling-time **feel** constants live OUTSIDE the
snapped core and are labelled **MODELED**, never pinned.

**Single source of truth.** The verdict, the canvas readout, and the audio gain
all read the **same** γ — eye and ear cannot drift. `targetAmp()` calls
`growthRate()`; the readout calls `growthRate()` and `fundamentalHz()`;
`growthRate()` has never heard of the DOM, the AudioContext, or the pipe.

**Proven correct (self-test — 10 checks in the Node twin, 8★+D1 live in the
badge).**
1. ★ **lower half sings** — `0<u<½, Q>0 ⇒ γ>0` strictly (4000 samples).
2. ★ **upper half silent** — `½<u<1, Q>0 ⇒ γ<0` strictly (4000 samples).
3. ★ **midpoint dead-EXACT** — `γ(½, Q) === 0` bit-exact for any Q while the
   library's `Math.sin(π) = 1.22e-16 ≠ 0` (the snap holds).
4. ★ **neg-control** — `Q=0 ⇒ γ=0 & targetAmp=0 ∀u & sings()=false`: heat AND
   confinement required; the saturated amp decays to silence.
5. ★ **antisymmetry** — `γ(u) = −γ(1−u)` to machine ε (worst `8.74e-16`) AND the
   sign flips across ½.
6. ★ **f = c/2L strictly decreasing** in L (601 steps): `f(1m)=171.5 Hz`,
   `f(1.8m)=95.3 Hz` — a taller pipe hums lower.
7. **one ledger** — `regime(silent) ⟺ loudness 0`, and any loudness `⟹ γ>0`:
   verdict, ear, and γ never disagree.
8. **loudest hold at u≈¼** — `argmax targetAmp` at full heat sits at the crest of
   `sin(2πu)` (the Stoker's Trial answer).
9. **source purity** — `growthRate()` references no DOM/audio/pipe symbols and is
   deterministic (only u and Q).
10. ★ **byte-twin parity** — the inline `RIJKE-CORE` slice in `index.html` is
    **byte-for-byte** identical to `core.mjs` (1834 B). *(D1, live-only: the heat &
    gauze dials are present and the verdict reflects the core regime.)*

**The 4-file pattern + parity.** `core.mjs` is the sole DOM-free authority
(`growthRate` · `fundamentalHz` · `sings` · `targetAmp` with tanh saturation,
TOL-gated). `index.html` inlines that core **byte-for-byte** between
`RIJKE-CORE (byte-twin of core.mjs) BEGIN/END` sentinels (the carnot/heat-voice
precedent), keeping the FEEL constants (onset, regime thresholds, loudness/swell
taus) outside the snapped core. `core.test.mjs` is the Node twin: it runs the
shared falsifiers at higher sample counts and slices the inline core out of
`index.html` to assert char-for-char identity with the export-stripped `core.mjs`
body. Node twin: **10/10 ✓** all green. No `index.src.html` — this bench is
plain inlined HTML (no `tools/ws` partial), so forge tracks only its parity.

**Cross-links.** Up to `../index.html` (The Engine Room), where it is the sixth
bench beside The Demon, The Brownian Drift, The Stirling Engine, The Pinhole
Race, and the Carnot bedplate. No cross-wing cousin link — it is the wing's only
audio engine, standing on the Rayleigh criterion alone.

### Publisher polish (cycle #361, "Steepletop")
- **FIXED a layout bug the heads-down build missed:** the three canvas zone
  labels (`u = ½ · dead node` · `lower half — SINGS` · `upper half — silent`)
  were drawn **left-aligned at `x1 + 14`** beside the pipe inside a 300px-wide
  canvas, so every label ran **12–24px off the right edge** and was clipped (worse
  at short pipe lengths, where the pipe is drawn wider and pushes the labels
  further right). Re-anchored them **right-aligned to `W − 6`** and shortened to
  `node · γ=0` / `SINGS` / `silent` — the lower/upper-half meaning is carried by
  each label's POSITION on the pipe and spelled out in full in the intro and the
  Rayleigh WHY. Verified the labels stay within the canvas and clear the pipe wall
  + gauze grip across the full L range (0.45–1.85 m). The change is in the FEEL
  draw code, outside the snapped core — core test **10/10** and `forge --check
  --all` (114) both still green.
- **Added this CHANGELOG** (the builder shipped without one; every Engine Room
  bench carries a CHANGELOG).
