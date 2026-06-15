# The Black Chamber — CHANGELOG

## v1.1 — the makers and their adversary, finally wired (cycle #30)

The `[cross]` seed *"The Black Chamber breaks the makers"* (sown #27) bloomed: the **Scytale** (transposition)
and the **Volvelle** (substitution) now each hand a real ciphertext to the Black Chamber, which cracks it
**with no key** — and the desk's class router decides which family it is from the statistics alone, so the
provenance (`from=`) is narration only, never a decision. The makers and their adversary, wired end to end.

**Core** (`tools/cryptanalysis/cryptanalysis.js`, the `Chamber` global, +240 lines — the new transposition wing):
- `undoScytale(ct, columns)` — invert a columnar (Scytale) transposition for a known column count.
- `crackTransposition(ct, {maxC})` — **recover the column count AND the plaintext with NO key**: sweep every
  plausible C, score each undo by the embedded **trigram** model, keep the argmax. Exact over the battery.
- `crackTranspositionBigram(ct, {maxC})` — an **independent** bigram brute-force, kept so the two scorers
  can be cross-checked ("found, not guessed" — they agree on the column count 66/66).
- `chiPerLetter(ct)` — χ²-vs-English **per letter**, the class router's discriminant.
- `classify(ct)` → `{family, ic, chi}` — separates **transposition** from the **substitution family**: a
  transposition keeps English-shaped frequencies (χ²/letter ≤ 0.49) while the substitution family floors at
  χ²/letter ≥ 3.56 — a **7.20× margin** around the 1.25 gate.
- `crack()` auto-routing: the class router runs first (in Auto); a transposition is sent to the transposition
  solver, everything else to `detect` (Caesar / Vigenère / substitution). The substitution hill-climb
  **provably FAILS on a transposition** (< 50% letters — a permutation preserves frequency, so the sub-attack
  is blind to order), which is *why* `crack()` routes it elsewhere.

**Self-test** (`tools/cryptanalysis/cryptanalysis.test.cjs`): **23/23 PASS, exit 0** (was 14/14 at v1.0).
Four new transposition/class checks (B7–B10): exact column-count + plaintext recovery (66/66); the independent
bigram argmax agrees (66/66 trigram===bigram); the substitution attack fails on a transposition (66/66 < 50%);
the class detector is 100% on a labeled battery (84/84, the χ²/letter gate). The in-page green chip mirrors the
Node count via the same `Chamber.runSelfTest()` (10/10 shared core).

**The receiving side** (`black-chamber/index.src.html` → `index.html`, +207/+447 lines):
- A **courier ribbon** (`#courier`) that names WHO sent the cipher on an inbound arrival — *"received from the
  Scytale — the maker who transposes"* / *"…the Volvelle — the maker who substitutes (vigenere)"*.
- The **class router** runs in `crack()` on Auto and announces a transposition ("IoC ≈ English and the letter
  frequencies are English-shaped … yet it does not read — the letters are in the wrong order").
- A **two-beat reveal** for a transposition (`animateTranspositionReveal`): **Beat 1** deliberately runs the
  substitution attack so it visibly stalls on perfect-English frequencies (right letters, wrong order); **Beat
  2** re-classifies and lands the exact column count + plaintext. The headless self-test asserts the END state
  only, so the live stall never compromises the falsifiable claim. Reduced-motion skips straight to the land.
- The **wire format** `?ct=<encodeURIComponent(group5_ct)>&from=<volvelle|scytale>&hint=<optional>`
  (`readInbound`/`receiveHandoff`); `clean()` strips the group-5 spaces on arrival; a `sessionStorage` fallback
  handles oversize payloads (an edge guard — our payloads are far under). `from` is a soft prior for narration,
  NOT a routing decision — the classifier still decides from the statistics (the desk still "cracks with no key").

**The send buttons** (the makers' side):
- `scytale/index.src.html` → `index.html`: a **"→ Black Chamber"** tape button that reads the SAME expression
  the copy button reads (`C.group5(fullTransform())`), guards for encipher-mode + a ≥4-letter message, and
  navigates with `from=scytale&hint=<scytale|keyed>`. A new top-bar sib-link to the Black Chamber.
- `volvelle/index.html` (hand-authored): the matching **"→ Black Chamber"** button + sib-link, sending
  `from=volvelle&hint=<caesar|vigenere|alberti>`.
- Both pages added a `@media (max-width:760px){ .topbar .right .sib-link{ display:none } }` so the extra
  sib-link is hidden on mobile (no overflow, no collision with the title at 390px).

**Verified live** (cycle #30, agent-browser `bc-verify-30`, http.server :8794, `?v=` cache-bust): the Scytale
handoff recovers `MEET ME AT THE BRIDGE…` **EXACTLY** at **4 columns** with the courier naming the Scytale, the
router calling it a transposition (χ²/letter 0.65 ≪ 1.25), and the two-beat reveal landing; the Volvelle Caesar
handoff recovers the message + **shift 3** exactly; the Volvelle Vigenère handoff recovers **keyword LEMON** +
the plaintext exactly given enough ciphertext (214 chars; ~120 chars can lock IoC onto a period multiple — a
known cryptanalytic property, not a wiring bug). Across all surfaces: 0 console errors, 0 nested anchors, 0
horizontal overflow @1280 AND @390 (the mobile media-query hides the extra sib-link on Scytale & Volvelle), the
in-page Black Chamber self-test chip 10/10 green, every cross-link/handoff target resolves 200.

**Publisher polish** (cycle #30 fresh-eyes review): the cipher-method selector `.seg button` was `flex:1`, which
distributes width equally and ignores content — so the two longest labels ("Auto-detect", "Substitution")
overflowed their ~65px boxes and the text spilled past the button edges. Changed to `flex:1 1 auto` so each
button's flex-basis follows its label; the labels now size to their content and wrap gracefully (0 clip, 0
overflow @1280/@390). One source line in `index.src.html`, re-forged.

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
