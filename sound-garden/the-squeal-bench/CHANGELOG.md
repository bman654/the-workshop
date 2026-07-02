# The Squeal Bench — changelog

*A Sound Garden leaf. Drag a bow across a taut fibre and feel ONE stick-slip motion morph
continuously — fast & light it SINGS a violin sawtooth, slow & hard it CREAKS like a door,
stiff & barely-moving it QUAKES in countable thuds — with NO mode button. A violin, a hinge,
and an earthquake are one law: something dragged, gripping and letting go.*

## #402 — born (BUILD/garden)

A **delight-first** leaf grown from the garden seed for a stick-slip relaxation oscillator.
Five-file leaf in the -bench folder mold (index.src.html → forged index.html, core.mjs,
core.test.mjs, verify.sh).

**The hero feel.** Drag left–right across a fibre pinned between two brass posts. A rosin-glow
bow column follows your finger; the fibre grows a triangular **kink** as the spring loads (amber),
then **snaps back** in a travelling cyan ripple that reflects off both posts, with a rosin puff —
one visible tooth per slip. A live **word readout** (singing / creaking / quaking) is *read from
the measured slip-rate + mean let-go*, not chosen from a switch — spelling out that the three are
one dial-family. There is **no proof pill on the page** — the delight is the point; the "self-test"
is the motion, timing, and sound.

**The one model (single-sourced).** `core.mjs` is the SOLE authority for a lumped mass *m* on a
spring *k*, dragged by a belt (the bow) at speed *vB* through a **velocity-weakening** friction law
`μ(w) = strib(w)·w/(|w|+eps)`, `strib = μK + (μS−μK)·exp(−(|w|/vs)²)`, with static grip μS=1.5 >
kinetic μK=0.25 — the static>kinetic gap is what makes it squeal. Integrated **semi-implicit
(symplectic) Euler with 32 substeps/sample at 44.1 kHz** so the stiff spring never saturates (the
#1 build hazard, guarded in the twin). **No mode flag anywhere:** the three regimes are emergent
points on the one (k, Fn, vB) continuum, reached by the same recurrence. The knobs map to physics —
drag SPEED → vB, PRESSURE slider → Fn, STIFFNESS slider → k. **No pitch-core import** — pitch EMERGES
as the slip rate; the piece owns no note-pitch claim.

- **SING** (light Fn, fast vB, k≈150): dense slips fuse into a Helmholtz **sawtooth** — a bowed
  string, f0 ≈ 114 Hz with a full harmonic ladder (bright).
- **CREAK** (hard Fn, slow vB): rare, big let-gos — a low, dull **door groan**.
- **QUAKE** (stiff k≈1400, tiny vB): a sparse train of countable **shudders**.
- **RELEASED** (bow lifted, vB=0): digital silence — the block never leaves rest; the sound was
  only ever the drag.

**Byte-twin + live parity.** The page inlines the SQUEAL CORE slice char-for-char between sentinels
(the Node twin greps parity); the live **AudioWorklet** processor source is BUILT from the byte-
twinned functions' own `.toString()` (with a ScriptProcessor fallback that calls the same
`integrate()`), so the sound cannot run a second copy of the law. The on-screen strip runs a **local
echo** of the same recurrence — faithful to the ear yet independent of the audio graph, so the fibre
sticks-and-snaps whether sound is on, off, muted, or the ctx is still suspended (delight without
noise).

**Mute + audio courtesy.** Copies the-tartini-bench's mute contract verbatim: one shared
`ws:pref:muted` key, muted by default, a `storage` listener syncs across estate tabs, un-mute
mid-drag brings sound in live. The first pointer gesture unlocks the AudioContext (autoplay policy);
`ws.js` is inlined via `forge:include` for the estate-wide mute + cue.

**Verification (all five DoD legs).**
1. `node tools/forge/forge.mjs --check --all` — clean (135 files; the .src.html is forged, no drift).
2. `core.test.mjs` — **11/11**: the shared `runSquealSelfTest` (silent-until-gesture, no-clip
   headroom, slip-rate monotone with drag speed to a labeled ±10% band, family separation), plus
   deeper Node-only re-derivations (the stick-slip **onset is a genuine vB threshold** — a slow drag
   stable-creeps silently, a faster one breaks into stick-slip; the integrator is **stable at the
   stiffest quake stiffness** — no NaN/runaway; released bow → literal zero), the byte-twin SQUEAL-CORE
   parity grep, single-source of the friction law, and no-pitch-anchor.
3. `verify.sh` via the audio-lens on offline renders of {sing, creak, quake, released} — **6/6**:
   SING has a fused f0 (113.8 Hz) + harmonic peaks; CREAK & QUAKE have no fused f0; centroid(SING) >
   centroid(CREAK) (bright vs dull); QUAKE is a transient train (9 discrete onsets vs SING's 0);
   RELEASED is digital silence (−240 dB); none clip. (Spectrograms: SING = a harmonic ladder,
   QUAKE = discrete transient columns.) The loop cannot hear, so the lens stands in for ears.
4. `ws:pref:muted` honoured (muted-by-default, storage-event sync), verified in-browser.
5. Real pointer drag (setPointerCapture guarded; mouse + touch via pointer events, no synthetic-
   click-only path). The full chain — drag → vB → physics → slips → word readout → visual — verified
   in-browser; all three voices reachable via the drag and via the three guided "try" chips.

No `ws:seen` id (a garden leaf, not a front-door footprint). Registered by one footer-chain line in
`sound-garden/index.html`. Grows the Sound Garden.

## #402 — sealed (salvage completion pass)

The leaf was orphaned just before the seal; a completion pass finished the in-browser sanity check
and found **the word readout misclassified the CREAK voice as "quaking."** Root cause: the readout's
mean-let-go metric read `Snd.lastX` — the block deflection at the END of a rAF frame's step-batch,
long after the slip had relaxed — instead of the deflection **AT the release instant** (the loaded
peak). For the fast SING the two are the same (slips every ~9 ms), but the slow CREAK loads to ~5 mm
between rare slips and snaps back to ~0, so the frame-end sample only ever saw the relaxed value
(~0.5 mm) and the `drop > 2.2 mm` creak branch was dead code. Two fixes, both OUTSIDE the byte-twin
sentinels (core parity untouched, twin still 11/11):

- **Capture the let-go magnitude AT the slip.** A new `Snd.lastSlipX` is set at each of the three
  slip-detect sites (local echo, AudioWorklet via its slip message, ScriptProcessor); the readout
  keys off it. Confirmed against the Node twin: creak's mean drop-at-slip is 5.13 mm (→ "creaking"),
  quake 0.97 mm, sing 0.54 mm.
- **A time-windowed slip buffer.** `dropSamples`/`slipStamps` were replaced by one `slips` array of
  `{t, d}` so the mean-drop and the rate age out on the SAME 0.9 s window. Before, switching from a
  dense voice (SING fills 40 tiny-drop slots) into a sparse one (CREAK adds ~2 big drops) left the
  stale tiny drops dominating the mean — so the voice you switched TO was misread. Now a slip's drop
  retires exactly when its stamp does; voice order no longer matters.

Re-verified end-to-end on the FINAL build (debug hooks removed): real input-level mouse drag (CDP
`Input.dispatchMouseEvent`, pointerType mouse) reaches SING (fast, "singing"), CREAK (pressure slider
up + gentle drag, "creaking", 5.13 mm), QUAKE (stiffness max + gentle drag, "quaking"), still-finger →
"clinging", release → "at rest"; the AudioContext unlocks to `running` on the real gesture and the
master gain rises to 0.9 only when "sound on"; muted-by-default; cross-tab `ws:pref:muted` sync
(localStorage write + storage event) mutes/un-mutes live; 61 fps, clean console; `verify.sh` 6/6 on
browser-rendered WAVs (SING f0 113.8 Hz + harmonic-ladder spectrogram; QUAKE 9 discrete onset columns;
RELEASED −240 dB; none clip).
