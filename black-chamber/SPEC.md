# The Black Chamber — SPEC

A codebreaker's desk that **cracks classical ciphers from ciphertext alone — with no key given** — by
classical cryptanalysis, and proves it works by recovering known keys and plaintexts.

---

## §0 — The crux (read this first)

The estate already has cipher **makers**: the Volvelle (Caesar / Vigenère / Alberti substitution disk) and the
Scytale (transposition rod), plus the hidden Enigma. It had **no breaker**. The Black Chamber — the historical
name for a state's cipher-cracking office — is that missing analytic counterpart. Hand it ciphertext and **no
key**, and it recovers the key and the message:

- **Caesar / shift** — try all 26 shifts, score each candidate decrypt by **χ² against the English
  letter-frequency profile**, return the minimiser. For real English this is **exact key recovery** — a
  trivially-correct attack.
- **Vigenère** — estimate the period by the **index of coincidence** (per-column IoC jumps to the English
  value at the true period; Kasiski's repeated-trigram gaps confirm it), split the ciphertext into that many
  columns (each a Caesar shift), solve each column by χ², and read off the keyword. **Exact keyword + plaintext
  recovery** for adequate-length ciphertext.
- **Monoalphabetic substitution** — no per-symbol statistic suffices, so **simulated-annealing hill-climb** a
  decryption alphabet to maximise a fitness = **Σ log P(trigram)** under a compact embedded English language
  model. Recovers a **high-accuracy** plaintext + the key mapping.

The crux the piece **proves** (in `tools/cryptanalysis/cryptanalysis.test.cjs` and in the in-page green chip,
both calling the **same** `Chamber.runSelfTest()`): take known English, encipher it with a random/secret key,
hand only the ciphertext to the breaker, and watch it recover the original — exactly for Caesar/Vigenère,
≥90% of letters for substitution. The delight is watching gibberish resolve into English by pure analysis.

---

## Files

| File | Role |
|---|---|
| `tools/cryptanalysis/cryptanalysis.js` | DOM-free cryptanalysis CORE (the `Chamber` global). Dual-use IIFE; `module.exports` for Node, `root.Chamber` in the browser. Forge strips the module guard on inline. |
| `tools/cryptanalysis/cryptanalysis.test.cjs` | Node self-test. `require`s the core; runs `Chamber.runSelfTest()` (the same object the chip runs) + extra assertions with reported metrics. |
| `black-chamber/index.src.html` | Page source. Forge-includes the core + `ws.js`. |
| `black-chamber/index.html` | Built artifact (`node tools/forge/forge.mjs black-chamber/index.src.html`). |

---

## The core API (`Chamber`)

**Statistics (all self-tested):**
- `letterFreq(text)` → `{ counts[26], freqs[26], n }` over A–Z.
- `chiSquareEnglish(text)` → Σ (obs − exp)² / exp vs `n · ENGLISH_FREQ`. ≈small for English, large for a wrong shift.
- `indexOfCoincidence(text)` → Σ nᵢ(nᵢ−1) / n(n−1). English ≈ **0.067**, random ≈ **1/26 ≈ 0.0385**.
- `ngramScore(text)` → Σ log P(trigram), the hill-climb fitness.
- `englishness(text)` → normalised 0..1 "how English does this read?" (trigram mean, scaled). Drives auto-detect.

**Breakers:**
- `breakCaesar(cipher)` → `{ shift, key, plaintext, chi, candidates[26] }`.
- `estimateKeyLength(cipher, maxLen)` → `{ best, table:[{p,ic}], byKasiski }`.
- `breakVigenere(cipher, opts)` → `{ keyLength, keyword, plaintext, ic, icTable, kasiski, englishness }`. Tries the top IoC-passing periods and keeps the most-English decrypt.
- `breakSubstitution(cipher, opts)` → `{ key[26], keyMap, plaintext, score, englishness, iterations }`. One-shot wrapper over…
- `makeSubstitutionSolver(cipher, opts)` → `{ step(n), snapshot(), totalSteps }` — a **steppable** annealing solver. The page time-slices `step()` per animation frame to render the live churn; `snapshot()` exposes both the global-best recovery and the live wandering key (`livePlaintext`) so the plaintext can be *watched* resolving. Stepping in any chunk sizes yields the identical result as a one-shot run (one seeded RNG drives the whole move sequence).
- `detect(cipher)` / `crack(cipher, opts)` → auto-detect (by IoC + a Caesar englishness check) and run the matching attack.

**Determinism:** a seeded **mulberry32** RNG (xmur3-seeded; no `Math.random`, no `Date`). Same `(ciphertext, seed)` ⇒ identical recovery.

---

## The embedded language model (kept small)

For substitution there is no per-symbol statistic, so candidate plaintexts are scored by **Σ log P(trigram)**.
The model is **built at load** from a **~5 KB embedded corpus** of public-domain English prose
(`TRAIN_CORPUS` in the core) — a 26³ = 17,576-cell trigram log-prob table (with add-α smoothing) plus a 26²
bigram fallback for very short text. **No multi-megabyte quadgram file**: the only embedded data is a few KB of
prose, generating the model in <1 ms at load. Trigrams give the local grammar ("THE", "ING", "TION") that lets
the hill-climb tell a near-right key from a wrong one, and the corpus is broad enough that recovery generalises
to **unseen** text.

---

## Provable claim + self-test (`cryptanalysis.test.cjs` + the in-page chip → "black chamber verified — N/N ✓")

The chip runs `Chamber.runSelfTest()` (5 checks). The Node test runs that **same** object **plus** independent
assertions with reported numbers (14 checks total). Measured:

1. **Caesar — exact recovery:** 156/156 (full corpus × all 26 shifts) recover the exact shift + plaintext — **100%**.
2. **Vigenère — exact keyword recovery:** 48/48 random keywords (length 3–8) over adequate ciphertext recover the **exact keyword** — **100%** — and the IoC identifies the period on 48/48. (The bar is ≥90%.)
3. **Substitution — high-accuracy recovery:** mean letter-accuracy **100%** over the long self-test corpus passages (the bar is ≥90%). Seeded ⇒ deterministic. (See the honesty note below on held-out text.)
4. **The statistics are correct:** IoC(English) = **0.0689** (in 0.060–0.075), IoC(random) = **0.0385** (≈ 1/26); χ²(English) = **32.8** ≪ χ²(wrong shift) = **9596**.
5. **Determinism:** same `(ciphertext, seed)` ⇒ identical plaintext + score across two runs.

Run: `node tools/cryptanalysis/cryptanalysis.test.cjs` → all PASS, exit 0 (~0.8 s).

---

## The page

A dark codebreaker's desk. Paste ciphertext or load a **sample** (pre-made Caesar / Vigenère / substitution
ciphers of real English passages, with known keys so the verdict can report exact recovery). Pick the cipher
type or hit **Auto-detect** (IoC + englishness). **Crack it** runs the analysis and shows:

- a **letter-frequency bar chart** — the observed distribution (cyan) against the English profile (brass band).
  English-shaped ⇒ monoalphabetic; flattened ⇒ Vigenère.
- the **index of coincidence** readout with a gauge marking the random and English values.
- the **estimated key length** (IoC, Kasiski cross-check).
- for substitution, the candidate plaintext **resolving live** — gibberish → English — as the hill-climb runs,
  with the englishness gauge rising and the move/restart counter ticking.
- the recovered **key** + **plaintext**, and a verdict comparing to the known plaintext for samples.

3 palette-only skins (ledger / slate / oxblood), **2× PNG** export, a `← workshop` back-link, sibling links to
the Volvelle and Scytale. **No audio.** Reduced-motion: skips the live churn and shows the final result directly.

---

## Honest caveats (length requirements + the statistical nature of substitution)

- **Caesar** is exact for any text of more than a few words (it's a closed search over 26 keys scored by χ²).
- **Vigenère** needs **enough ciphertext per column** — roughly each keyword cycle must repeat enough times for
  per-column frequency analysis to bite. The self-test uses two-passage texts (~300–500 letters) and hits 100%;
  very short ciphertexts (a single short sentence) or keywords approaching the text length will not recover
  reliably. The page's samples are sized adequately.
- **Substitution recovery is statistical, not exact.** The hill-climb maximises a trigram likelihood, so:
  - On **long** English text (≳300 letters) it typically recovers **97–100%** of letters; the bundled
    substitution sample recovers **97.3%** (the only misses are a rare-letter pair — e.g. K↔M — whose few
    occurrences don't shift the trigram fitness enough to disambiguate).
  - On **shorter** held-out text (~200 letters) the mean is **≈90%**, with harder passages (unusual letter mixes)
    landing in the low-to-mid 80s. More ciphertext always helps.
  - The self-test's per-passage 100% is partly because those passages share vocabulary with the training corpus;
    the honest **held-out** figure is ~90%+ on adequate-length text. This is stated plainly so the claim isn't
    overstated.
- Everything is **case- and layout-preserving** on output but analysed over A–Z only (non-letters ignored).
