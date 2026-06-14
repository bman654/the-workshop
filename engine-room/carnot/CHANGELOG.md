# The Carnot Engine — CHANGELOG

The Engine Room's first bench. Operate the most efficient heat engine that can
possibly exist, on coupled **P–V** and **T–S** diagrams, and feel the wall that
no machine can cross: **η = 1 − T_c/T_h**.

## v2 (2026-06-14) — ♪ Listen: hear the heat die (the Engine Room × Sound Garden crossing)

**What it is.** The bench gains a working **"♪ Listen"** voice in the topbar, beside
the self-test pill. A **reversible** loop (no leak) sings **A3 (220 Hz) in unison** —
two voices, zero beat, "it comes home". Dial the **heat leak ΔT** and one voice
**detunes strictly upward**, monotonically with `ΔS_universe`, and **you cannot tune
it back**: entropy only rises, and so does the pitch. The arrow of time, made audible.
The bend is anchored to the **same `ΔS_universe` the visual meter reads** — the ear
and the eye read one ledger object.

**Anti-theatre (the falsifiable seam).** A new importable core,
**`heat-voice-core.mjs`** (~210L), **IMPORTS the bench's own `irreversibleLedger`**
from `core.mjs` (the Demon pattern — the import *is* the single source of truth):
- `voiceState(cyc, leak)` returns the **one** ledger object both the page and the
  harness read; `voiceState().led` is **byte-identical** to `irreversibleLedger()`
  and `dS_universe` is strict `===`.
- `entropyToCents(dS)` → `centsToHz(cents)` maps that one number to a pitch. It sees
  **only a number** — a source-disjointness grep asserts `entropyToCents.toString()`
  never mentions `T_h`/`T_c`/`Q_`/`carnotStates`/`irreversibleLedger`. So the pitch
  **cannot** secretly re-derive the physics; it can only sonify the meter's `ΔS`.
- Calibration (`CENTS_PER_JK = 90`, `HOME_HZ = 220` to match Galton's Sound-Garden
  anchor, 1-octave clamp at `MAX_CENTS = 1200`): `carnotStates(500,300,3)` at ΔT=30
  has a **real** `ΔS_universe = 1.532 J/K` ⇒ **137.9 cents** (a clean semitone-ish
  bend, audible but never a shriek; the drift voice tops out at 440 Hz).

**The in-page audio path** lifts Galton's proven Web-Audio scaffolding: a compressor
→ master gain (ramped, no clicks) → a 0.5 droneBus; a **home sine @ A3** and a
**drift triangle** whose `detune` ramps to the entropy-mapped cents over 90 ms; both
oscillators `.start()` **once**, never stopped. It **calls the inlined byte-twin core**
(between `// ===== HEAT-VOICE … BEGIN/END =====` sentinels — a `.test` parity grep
asserts the page slice `===` the module slice, **1079 bytes byte-identical**); it does
**not** re-implement the curve. `updateVoice(m)` reads the **already-computed** `m`
from `render()` (no recompute — resolves the double-quadrature risk) and rides the
existing render cadence (frame-locked to the meter). Mute respects the shared
**`ws:pref:muted`** estate key, with a **cross-tab `storage` listener** so one mute
holds estate-wide. Silent until pressed (autoplay-safe).

**Self-test.** The pill now reads **17/17 ✓** — the 14 core checks (the original
12 Carnot proofs + **3 new ♪ heat-voice checks**: reversible⇒home/unison;
leak⇒cents>0 strict & monotone up; pitch is a pure fn of the meter's `ΔS` &
source-disjoint) plus **3 DOM checks** (`#listenBtn` present · audio detune ==
`entropyToCents(meter dS)`, vacuous-green until pressed · `entropyToCents(0)===0`).
The **Node twin** `heat-voice-core.test.mjs` runs the same shared set **plus**
exhaustive sweeps over **4000** `(Th,Tc,r,γ,leak)` configs (ledger byte-identical,
pitch a pure fn of dS), a fine 400-step ΔT monotonicity sweep × 4 base cycles, a
negative-control sweep over `dS∈[−5,55]`, the clamp/calibration anchors, the
no-clip renderer bound, and the byte-twin parity grep → **23/23 ✓ ALL GREEN**.

**Audio-lens recipe (reproducible — the only way to "hear" headlessly).**
`node tools/carnot/carnot-render.cjs` renders three WAVs to `/tmp/carnot/` driving
the **REAL** core + `carnotVoiceSamples` with `dS` from the **REAL**
`irreversibleLedger`, then asserts via the audio-lens. Measured (2026-06-14):

```
$ node tools/carnot/carnot-render.cjs
  REAL ledger: dS(leak=0)=0.0000  dS(ΔT=30)=1.5320 J/K
  cents: home=0.00  small=137.88  big(×600)=919.18
  home : f0=220.6 Hz  note=A3 (4c)   peakDb=-9.37  clips=false  silence=0.0025
  small: f0=230.1 Hz  note=A#3 (-22c) peakDb=-9.37  clips=false
  big  : f0=374.4 Hz  note=F#4 (20c)  peakDb=-9.37  clips=false
  ✓ home NOT silent (silenceRatio 0.0025 < 0.2)
  ✓ home NOT clipping (clips=false, peakDb -9.37 ≤ -9)
  ✓ home note === A3 within ±25 cents (A3 +4c)
  ✓ leak_big detectably sharper than home (374.4 Hz > 220.6·1.01)
  ✓ leak_big NOT clipping
  ✓ 0→80K leak sweep monotone non-decreasing in f0
      0K→220.6  16K→290.1  32K→388.5  48K→440.1  64K→440.1  80K→440.1   (clamps at 1 octave)
  ✓ ALL GREEN
```

Spectrogram pair: `/tmp/carnot/home_spec.png` · `/tmp/carnot/leak_spec.png`.
(The `home`/`leak_small` renders play the page's actual beating *pair*; `leak_big`
and the sweep isolate the bent voice — `driftMix=1` — so the monophonic pitch
detector reads the drift frequency unambiguously, same `fDrift`, same physics.)

**Files.** NEW `engine-room/carnot/heat-voice-core.mjs`, `heat-voice-core.test.mjs`,
`tools/carnot/carnot-render.cjs`; MODIFIED `engine-room/carnot/index.html`
(topbar `.chips` + ♪ Listen button, the inlined HEAT-VOICE byte-twin slice, the
3 core + 3 DOM checks, the Web-Audio path, the `soundRead` caption + the reciprocal
Sound-Garden teaser). No `ws:seen` drop (a bench extension; carnot already drops
`ws:seen:carnot`). A `[cross]`, not an `[exhibit]`.

## v1 (2026-06-14) — first build

**What it is.** A single self-contained, zero-dependency HTML bench. Two linked
planes side by side, hard-linked through the four state-points 1→2→3→4:

- **LEFT — the P–V plane (the work):** the four-leg Carnot loop — two isotherms
  (hot glowing `--firebox`, cold `--condenser`), two adiabats (dim grey). The
  **enclosed area is filled gold and labeled "W = net work"** — the area you
  watch grow/shrink *is* the work.
- **RIGHT — the T–S plane (the why):** the SAME four points form a perfect
  **rectangle**; its area `∮T dS = W` (same gold). This is the **master control
  surface** — the design's structural insight (after #0's coupled-diagram
  prototype, with its own mitigation: drag the T–S, re-solve the P–V, *not the
  reverse*, so the re-solve is one-directional and cheap).

**The three Carnot DOF**, dragged on the T–S rectangle: **top edge = T_h**,
**bottom edge = T_c**, **right edge = ΔS = nR·ln(r)** (the compression ratio r =
V₂/V₁). In Carnot mode you *cannot* draw a non-Carnot cycle — every drag keeps
T–S a rectangle by construction and η reads 1 − T_c/T_h. The re-solve is rAF-
throttled; the integration grid is modest (~600) during drag and refines (~2000)
on release.

**The efficiency tower + the ledger.** A vertical η-bar fills toward a **hard
ceiling line** labeled `η_Carnot = 1 − T_c/T_h`; the tip *kisses* the ceiling for
true Carnot, never crosses. Beside it a **Sankey-style energy ledger**: an
incoming `Q_h` band (firebox-red) splits into **W** (gold, out top — useful) and
**Q_c** (condenser-blue, out bottom — rejected), widths live and conserved
(`Q_h = W + Q_c` exactly). η is visibly the gold fraction of the incoming red.
Live numbers: T_h, T_c, r, ΔS, Q_h, Q_c, W, η_measured vs η_Carnot, ΔS_cycle.

**The "try to beat it" teeth.** A toggle that **replaces an adiabat with an
isochoric or isobaric leg** (an Otto-/Brayton-ish lobe) between the SAME
reservoirs — run through the SAME Path-1 integrator, no special-casing. The
η-bar drops below the ceiling and turns **amber**, the T–S figure stops being a
rectangle, and a **red lost-work wedge** opens (the area between the loop and the
enclosing Carnot rectangle = the work thrown away). A **heat-leak slider** injects
a finite-ΔT irreversibility; the **ΔS_universe meter** ticks *positive and red*
(reads exactly 0.000 for reversible Carnot), reporting the Gouy–Stodola lost work
`W_lost = T_cold · ΔS_universe`. **RESET TO CARNOT** snaps everything back.

γ default **5/3** (monatomic), switchable to **7/5** (diatomic); n and the
reference volume are fixed.

**The proof — two paths that share no formula.** The single source of truth is
`core.mjs` (pure, no DOM), inlined byte-functionally into the page and re-run live
by the self-test pill; the Node twin `core.test.mjs` extends the random/exhaustive
assertions.

- **PATH 1 (geometry, the honest oracle):** `W = ∮P dV` by from-scratch composite
  **Simpson** quadrature around the four legs. P(V) is sampled from each leg's own
  constraint — isotherms `P=nRT/V`; the adiabat traced by a from-scratch **RK4 ODE
  stepper** integrating `dT/dV = −(γ−1)·T/V` (never the closed form). Does NOT reuse
  η or the nRT·ln area formula. *(Build note: midpoint Riemann converges only
  O(h²) and needed ~32k pts/leg for the 1e-9 work tolerance — too heavy for the
  live pill. Switched both quadratures to **Simpson** (still a from-scratch
  Riemann-family weighted sum, NOT the closed form), O(h⁴), so a modest grid
  reaches ~1e-13 relative agreement.)*
- **PATH 2 (heat accounting, independent):** `Q_h = ∫T dS = nR·T_h·ln(V₂/V₁)` on
  the hot isotherm, `Q_c = nR·T_c·ln(V₃/V₄)` on the cold; `W_thermo = Q_h − Q_c`.
  Never touches the P–V loop area.
- **AGREEMENT:** the two collapse onto one number.

**Tiered tolerances** (per-assertion, or the test false-fails): Path-1↔Path-2 work
agreement **~1e-9** (quadrature-limited, NOT claimed as machine precision);
`η == 1−T_c/T_h` and the heat-side/closed-form comparisons **~1e-12**;
`ΔS_cycle = Q_h/T_h − Q_c/T_c` **~1e-12**.

**The named assertions** (★ = load-bearing falsifier):
1. ★ two derivations agree (`W_area == W_thermo`, ~1e-9, no shared formula)
2. ★ `η == 1 − T_c/T_h` (~1e-12)
3. ★ exactness over many random `(T_h,T_c,r,γ)` triples — Node twin: **5000**
4. ★ NO reshaped cycle (isoV/isoP lobe) between the same reservoirs beats Carnot —
   same integrator, no special-casing — Node twin: **exhaustive lobe enumeration**
   (350 in-page extension, dense grid)
5. ★ `ΔS_cycle == 0` for reversible Carnot (~1e-12)
6. volume-ratio fingerprint `V₂/V₁ == V₃/V₄`
7. ★ irreversible step loses AND `ΔS_universe > 0` strictly (== 0 for reversible)
9. adiabat invariant `P·Vᵞ = const` (γ=5/3 and 7/5)
10. ODE-integrated adiabat endpoint == closed-form `TVᵞ⁻¹` endpoint (the from-
    scratch stepper and the formula can't drift)
11. ★ γ-independence — η unchanged across γ∈{5/3,7/5} while cycle shape changes
12. closure/determinism (loop returns to start, clockwise ⇒ W>0, seed-pure)

**Well-posedness honored.** Heat-in for any loop is `Q_in = ∫T dS over dS>0` and
the bound is stated for *"any closed cycle whose temperature stays within
[T_c,T_h]"* (the reservoir generalization of Carnot's theorem), NOT "between two
isotherms" (ill-posed for an Otto/Brayton lobe). The M-B numeric cross-test was
**deliberately downgraded to the landing's bridge LINK only** — a 3-D engine gas
(PV=nRT, γ free) vs a 2-D kinetic-theory gas (PA=NkT, γ=2) is a dimensionality
mismatch we refuse to ship dressed as a pass.

**Self-test:** **11/11 in-page** (live, class `ok`) · **16/16 Node twin** (the
shared 11 + 5 exhaustive extensions: η over 5000 triples max |Δη|=4e-16; work
agreement over 200 triples max rel 1e-12; all 350 reshaped lobes lose to Carnot
strictly; ΔS_universe monotone in the leak; RK4 endpoint vs closed-form 1e-10 K).
The inlined core was extracted from the HTML and re-run in Node → 11/11
(byte-functional parity confirmed).

**Browser-verified** (agent-browser, served origin, `?v=` cache-bust): the bench
operates — dragging the T_h top edge 600→703 K raised η 50.0%→57.3% (=1−300/703)
and W 2740→3678 J, with the P–V re-solving; the isochoric lobe drops η to 29.7%
amber below the 50% ceiling and opens the red wedge ("you cannot win"); a 40 K heat
leak ticks ΔS_universe to 1.976 J/K red ("you cannot break even"). Q_h = W + Q_c
to the digit (5480.622 = 2740.311 + 2740.311), η = 0.500000. **~61 fps**, **0
console errors** through mode-switch + γ-toggle churn. Drops `ws:seen:carnot`.

**Aesthetic.** Warm forge palette matching the wing; the hot isotherm blooms
hotter than the cold; mono numerics; the work-area pulses faintly (frozen under
`prefers-reduced-motion`). Topbar chains back: "← The Engine Room" → ../index.html
and "↑ The Workshop" → the front door.

**Files:** `index.html` (self-contained bench + inlined core + pill) · `core.mjs`
(the pure source of truth) · `core.test.mjs` (the Node twin).

## v1.1 (2026-06-14) — mobile topbar fix (CSS-only)

Cleared the open `[bug]` seed filed by the Demon publisher: the fixed `.topbar`
(`display:flex; justify-content:space-between`, **no wrap**) overflowed horizontally
on narrow phones — the `#selftest` pill was pushed ~86px off the right edge at ≤400px
(DOM-measured at 360px: pill `right=446`). Added the **same scoped `@media
(max-width:430px)`** block the sibling Demon bench already ships (the markup uses the
identical `.crumbs` / `.selftest` selectors), placed just before the
`prefers-reduced-motion` block:

```css
@media (max-width:430px){
  .topbar{ flex-wrap:wrap; row-gap:8px; padding:10px 14px; }
  .crumbs{ flex:1 1 auto; gap:12px; }
  .selftest{ flex:0 0 auto; max-width:100%; }
}
```

Now the topbar wraps cleanly: crumbs on line 1, the green pill on its own line 2,
both in-bounds. **Verified** (publisher fresh-eyes review, `?v=N` cache-bust, session
`carnot-pub-cyc4`): at 360px and 390px horizontal overflow **0** (was ~86px), pill
`right=151` on-screen, still reads "self-test 11/11 ✓" / class `selftest ok`; **desktop
1280px unchanged** (`flex-wrap:nowrap`, `justify-content:space-between`, pill hugging the
right edge at `right=1245`, 0 overflow — the rule is scoped to ≤430px). The core math
is untouched: Node twin `node core.test.mjs` still **16/16 ✓**. 6 insertions, CSS-only,
no JS / no logic / no inlined-core bytes touched. The whole Engine Room wing is now
consistent on mobile (Carnot + Demon share the rule).
