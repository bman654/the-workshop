# The Black Chamber — CHANGELOG

## v1.0 — first light

The estate's first cipher **breaker** — the analytic counterpart to the Volvelle and Scytale (the makers).
Recovers key + plaintext from ciphertext **with no key given**, by classical cryptanalysis.

**Core** (`tools/cryptanalysis/cryptanalysis.js`, the `Chamber` global, DOM-free, dual-use):
- Statistics: `letterFreq`, `chiSquareEnglish`, `indexOfCoincidence`, `ngramScore`, `englishness`.
- Caesar: `breakCaesar` — all-26-shift search scored by χ² (exact recovery).
- Vigenère: `estimateKeyLength` (per-column IoC, prefers the shortest English-like period) + `kasiski`
  cross-check + `breakVigenere` (solve every column by χ², keep the most-English period's decrypt).
- Substitution: `makeSubstitutionSolver` — a **steppable** simulated-annealing solver (frequency-seeded,
  random restarts, swap-two-letters moves, `exp(Δ/T)` acceptance over a cooling schedule) — and the one-shot
  `breakSubstitution` wrapper over it. Fitness = Σ log P(trigram).
- Auto-detect: `detect` / `crack` (IoC + a Caesar-englishness check).
- Embedded language model **built at load** from a ~5 KB public-domain English corpus → a 26³ trigram log-prob
  table + 26² bigram fallback. No megabyte data files.
- Seeded **mulberry32** RNG (xmur3-seeded) — deterministic, reproducible runs.

**Self-test** (`tools/cryptanalysis/cryptanalysis.test.cjs`, mirrored by the in-page green chip via the same
`Chamber.runSelfTest()`): **14/14 PASS, exit 0** (~0.8 s).
- Caesar: 156/156 exact (100%). Vigenère: 48/48 exact keywords (100%), period identified 48/48.
- Substitution: mean letter-accuracy 100% on the long corpus passages (bar ≥90%; held-out text ~90%+ — see SPEC).
- IoC(English) = 0.0689, IoC(random) = 0.0385; χ²(English) = 32.8 ≪ χ²(wrong shift) = 9596.
- Determinism: same (ciphertext, seed) ⇒ identical recovery.

**Page** (`black-chamber/index.html`, forged from `index.src.html`):
- Codebreaker's-desk dashboard: ciphertext input; live letter-frequency chart (observed vs English profile);
  IoC + key-length + englishness readouts with gauges; recovered key + plaintext with a known-plaintext verdict.
- Pre-made samples: Caesar, Vigenère (CIPHER), substitution, Vigenère (LEMON, generated from a known passage).
- For substitution, the plaintext **resolves live** (gibberish → English) via a time-sliced hill-climb driven
  by `makeSubstitutionSolver.step()`; the englishness gauge rises and the move/restart counter ticks.
- Auto-detect or manual cipher-type override; 3 palette-only skins (ledger / slate / oxblood); 2× PNG export
  (verified 2200×1440); `← workshop` back-link; sibling links to Volvelle + Scytale. **No audio.**
- Reduced-motion: skips the churn, shows the final result directly. `WS.seen('black-chamber')` at parse time.

**Verified in a real browser** (Chromium via agent-browser, served over http://localhost): chip matches the
Node count (5/5); Caesar/Vigenère samples recover exactly (shift 3 / keyword CIPHER / keyword LEMON, 100%
match); substitution sample resolves to readable English (97.3%); a fresh pasted Caesar auto-detects + recovers;
Auto-detect classifies all three; `ws:seen:black-chamber` set; 0 console errors; handsome at 1440×900 + mobile
(375×812, panel toggle + topbar fixed).
