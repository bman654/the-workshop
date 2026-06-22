# The Same Slow Throb — changelog

A cross in the Workbench's cross vein. **The Beating Bench** (`sound-garden/the-beating-bench/`) ×
**The Tone Mill** (`tone-mill/`). One law: a slow beat is just `|f₁ − f₂|` folded down — worn once as a
sound you HEAR (two near-unison partials throbbing at `|fHi − fLo|`) and once as a motion you SEE (a
toothed siren disc crawling under a strobe at the `apparentDriftHz` alias fold). A control-bar with a
LOCK toggle drives both rate-pairs onto one slow rate so the throb period === the crawl period; a
pull-apart lever splits them (the neg-control). NO graph.

## #301 (2026-06-22) — BLOOMED

- **Built** `core.mjs` (237 L) — the bridge core, SOLE authority for the lock. Imports `beatRate` /
  `nearestPair` byte-untouched from the beating-bench and `apparentDriftHz` / `toothPassHz` from the
  tone-mill (one `../` hop each, top-level leaf). Two **code-disjoint** adapters:
  - **ear adapter** — `earBeat(S)` sets `fHi = F_LO + S` (the target laid in as a Hz *difference*) and
    reads the bench's own `beatRate(F_LO, fHi/F_LO)` → `|fHi − F_LO|`. Names no tone-mill fn.
  - **eye adapter** — `eyeCrawl(S)` sets the disc's tooth-pass rate to `STROBE_HZ + S` (the target laid
    in as a Hz *offset* above the strobe) and reads the mill's own `apparentDriftHz` → the residual fold.
    Names no beating-bench fn.
  - **The bridge** — `lockPoint(S)` (Δ=0, both carry S) and `splitPoint(S, Δ)` (ear → S+Δ, eye → S−Δ).
  - Fixed apparatus: `F_LO = 300 Hz`, `N_TEETH = 16`, `STROBE_HZ = 30` (Nyquist 15 Hz), slow band
    `[0.4, 12] Hz ⊂ (0, 15)` so the eye stays in its principal alias.
- **The claim, proven exact.** `runSelfTest` (4 legs, the in-page pill === the Node twin):
  1. **lock equality** — `|earBeat(S) − |eyeCrawl(S)||` < 1e-9 over an 847-rate sweep (worst **8.9e-14**).
  2. **convention honesty** — each parent independently recovers S through its OWN law (no smuggled
     factor): `earBeat → S` via `beatRate`, `|eyeCrawl| → S` via `apparentDriftHz`, both < 1e-9.
  3. **neg-control diverge** — splitting Δ grows `|diff|` strictly, → 0 only at Δ=0 (a real
     coincidence-of-lock, not an identity); a wide Δ drives the ear out of the slow band into roughness.
  4. **Nyquist fold** — past `strobe/2` the apparent crawl reverses to a *different* alias (18 → −12).
- **Built** `core.test.mjs` (161 L) — Node twin over a WIDER 1587-rate sweep, plus anti-circularity
  (the adapters route through the REAL imported parents, byte-exact `===`), byte-twin parity
  (`index.html` CORE === `core.mjs` CORE char-for-char, 9309 chars) and adapter code-disjointness by
  grep. `node the-same-slow-throb/core.test.mjs` → **16/16 ALL GREEN**.
- **Built** `index.html` (706 L) — two live canvas costumes + the control-bar. LEFT = the ear-throb: a
  tone disc that PULSES in size/brightness at the heard beat (the amplitude envelope `|cos(π·beat·t)|`
  made visible) + a swell meter; optional Web Audio plays the two real partials so you HEAR the swell.
  RIGHT = the eye-crawl: the 16-tooth siren disc rendered at the phase the STROBE last sampled (held per
  flash), so it visibly creeps / reverses at `apparentDriftHz`; a gold reference tooth + a flashing
  strobe lamp. CENTER = the LOCK toggle, the shared-slow-rate slider, the pull-apart lever, and a verdict
  cartouche (gold LOCKED `=== machine zero` / red SPLIT `≠`). Drops `ws:seen:cross-the-same-slow-throb`.
- **Registered** (reciprocal links both ways): a card in `workbench/index.html`'s cross vein; back-links
  from `sound-garden/the-beating-bench/index.html` (footer) and `tone-mill/index.src.html` (re-forged).
  Cross → both parents via topbar back-links. Every href resolves 200; `forge --check --all` clean (91).
- **Browser-verified** (served :8794, torn down by PID; session `tsst301`): pill 4/4, headless self-test
  4/4, zero console errors, no overflow at 1280 + 390. Drove LOCK (heard 6.00 === |seen| 6.00, |diff|
  1.8e-15) and UNLOCK pull-apart (Δ=5 → heard 11 ≠ |seen| 1, gap 10; Δ=8 → ear 14 Hz flagged roughness,
  eye 0.05 Hz). Mobile self-test panel shows all 4 legs green.
