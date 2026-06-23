# The Bomb That Tells On Itself — CHANGELOG

The Cavern's interaction-free measurement bench (the Quantum Drift). A balanced
Mach–Zehnder interferometer where a single photon proves a bomb is live **without
touching it** — the Elitzur–Vaidman bomb tester, built as glowing optical rails you
fire photons down one at a time.

## #309 — founded (BUILD/garden, planter)

**The idea.** With the arms empty the interferometer is tuned so the photon ALWAYS
exits the bright port; the dark port is dark by perfect destructive interference (a
"forbidden port"). Drop an Elitzur–Vaidman bomb — a perfect which-path detector: any
photon that reaches it is absorbed and the bomb detonates (BOOM) — into one arm. That
measurement destroys the interference. Per fired photon: P(boom)=½ (it was in the bomb
arm), and of the ½ that survive, BS2 with no interference partner sends them 50/50, so
P(bright)=¼ and P(dark)=¼. **The key fact:** a D-dark click is impossible without a
bomb present, so a single dark click PROVES the bomb is live — and the photon that
proved it took the empty arm and never went near the bomb. False-positive rate is
exactly 0.

**The form (built/routed/fired, NOT a graph).** Glowing optical rails on a dark cave
bench: BS1, two steering mirrors, BS2, and the two detectors D-bright (the always-port,
gold) and D-dark (the forbidden port, red). Drop the bomb into the upper or lower arm
(buttons or drag it onto an arm directly on the bench), then FIRE single photons. Each
photon's fate is drawn from the exact amplitudes via `firePhoton()` and then animated
down the rails — a wavepacket that either stops at the bomb (BOOM) or rides the empty
arm through BS2 to its detector. A live D-bright / D-dark / BOOM tally and a verdict
line that calls out the interaction-free dark-click proof.

**The core (`core.mjs`, the SOLE source of truth, DOM-free).** Exact complex
arithmetic on `[re, im]` pairs; the 50/50 beam-splitter unitary `BS = (1/√2)[[1,i],[i,1]]`;
mirrors as a common (identity) phase; the bomb as a projective measurement of one arm
(detonate with weight |amp|², else collapse-and-renormalize onto the empty arm).
`propagate(config)` returns `{pBright, pDark, pBoom}` for both no-bomb and live-bomb
configs; `firePhoton(config, rng)` samples one fate from those exact probabilities (the
animation reads THIS — picture == proof); `runEnsemble` tallies many fired photons.
`runBombSelfTest()` is the shared in-page/Node battery.

**The proof.**
- `core.test.mjs` (byte-disjoint Node twin) — **17/17 green, exit 0.** Layer 1 runs the
  in-page battery verbatim (8 legs): no-bomb ⇒ P(bright)=1 ∧ P(dark)=0; live-bomb ⇒
  P(boom)=½ ∧ P(bright)=¼ ∧ P(dark)=¼; P(dark)>0 IFF a bomb is present (FP rate 0);
  Σp=1; arm-symmetric. Layer 2 (9 legs): BS is unitary (BS†BS=I, columns orthonormal);
  the ½/¼/¼ split derived a SECOND way from raw amplitudes; Σ|amp|²=1 at EVERY stage
  (BS1 split · bomb collapse · BS2 recombine); an ensemble of 400k fired photons
  converges to `propagate()` within ±4.5σ across 3 configs; determinism; ZERO dark
  clicks over 1,000,000 no-bomb fired photons (FP rate 0 in practice); a mulberry32
  literal pin; and the single-source grep (the page COMPUTES the physics only inside the
  sentinels).
- In-page self-test pill: **8/8.**
- `forge --check --all` clean; `forge --audit-seen` clean (drops `ws:seen:interaction-free`).

**Honesty calls.** (1) Every probability claim is an EXACT machine-ε equality on
`propagate()` (a unitary amplitude computation, not an RNG count). (2) The ensemble leg
is the only statistical leg and is a binomial BAND, never a per-draw equality;
determinism is the one equality asserted on the seeded sampler. (3) The "fired" fates
are drawn from the SAME amplitudes the self-test proves, so the picture cannot diverge
from the proof.

**Registration.** Cavern landing (`cavern/index.html`) Quantum Drift bench card (💣) +
two nav-check legs; rides the existing Cavern front-door POI (no new front-door
footprint — a planter leaf). Drops `ws:seen:interaction-free`.

Files: `core.mjs` · `core.test.mjs` · `index.src.html` → forged `index.html` · this
CHANGELOG.
