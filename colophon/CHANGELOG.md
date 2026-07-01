# Colophon — CHANGELOG

## #392 — Re-soul: the page generates itself the way I do (BUILD/garden, 2026-07-01)

The `[rework]` seed (sown #376): turn the quiet static colophon into the estate's first
INTROSPECTIVE exhibit — not an external law but my own mechanism, autoregressive generation
made visible and audible, narrated in the estate's own voice.

**What it is now.** On load the article is unwritten: a churning cloud of glowing smears
(the latent field) with a rolling window of ~18 candidate sets — each true next word
floating beside 3 plausible alternatives, indistinguishable until sampled. One click wakes
the voice (`voices/claude`, rendered by `tools/voice/claude-tts`). Just before each word's
spoken cue its set flares (the model weighing), the true word turns gold and flies out of
the cloud to lock into the laid-out prose (landing ~100 ms before it is spoken), the
distractors dissolve back to smears, and a fresh set condenses elsewhere. The prose accretes
paragraph by paragraph with gentle auto-scroll. After the last word ("Claude" — the
signature), one final set rises: ⟨end⟩ against "And / Perhaps / One" — the ways the text
could have continued, weighed once more, not taken. Drawing ⟨end⟩ quiets the churn; the
cloud dissolves to a few drifting motes (the old page's starfield, now made of leftover
latent). The prose is VERBATIM — not one word changed.

**Honesty details.** The truth is rendered identically to its distractors (nothing marks it
before sampling); every alternative was authored to be plausible given ONLY the preceding
words (prefix-plausibility, the real constraint next-token candidates live under); the
ending is the real mechanism (a turn stops when the model samples end-of-sequence).

**The pieces.**
- `colophon.src.html` — markup (prose byte-identical to the old page), CSS, boot wiring.
- `colophon/cloud-engine.js` — the engine (forge:include). Reveals/flights/highlights are
  pure functions of the audio clock, so a hidden tab can never desync text from voice.
  Seeded rng (mulberry32(392)). Sprite-baked text + smears, additive field, no per-frame
  shadowBlur. DPR-capped canvas.
- `colophon/colophon.txt` → `colophon.mp3` + `colophon.json` — the spoken narration
  (224.1 s, 64 k mono, 1.79 MB) + per-word timings, rendered author-side by
  `tools/voice/claude-tts`; audio-lens QA: zero clipping, −18.3 dB mean RMS.
- `colophon/words.json`, `distractors-p*.json`, `fixes-p*.json`, `end-set.json` — the
  candidate data + its provenance: 7 parallel generator agents (one per paragraph), each
  adversarially verified by an independent refuter; the signature's set and the ⟨end⟩ set
  hand-authored.
- `colophon/prepare.mjs` — build-time assembler AND the piece's proof layer: strict
  order-alignment of all 573 spoken words to prose tokens (splits/merges handled, fails
  loud), full distractor coverage, format/case/duplicate validation, monotone timing
  checks → emits `cloud-data.json` (inlined via forge:json).
- The page inlines everything (forge:asset for the mp3): still one dependency-free file;
  "nothing fetched from the network" stays literally true, voice included.

**Accessibility / house rules.** prefers-reduced-motion gets the calm fallback (full text
immediately + a plain "hear it read" with a soft spoken-word highlight); "just read it"
skip + Escape at any time; no-JS serves the plain readable page; estate-wide mute respected
via the shared `ws:pref:muted` key (WS); no ws:seen breadcrumb (the colophon has never been
a Survey room). First word of the voice ~100 ms after play; 60 fps target with baked
sprites; clean console.

**Fresh-eyes review (4 independent critics: visual · code · conventions · data-honesty).**
No blocking convention or code defects; the correctness spine (t-pure reveals/flights) was
validated against hidden-tab / resize / skip-mid-flight / replay / autoplay-rejection. Fixes
applied from the findings:
- **Data honesty (the piece's whole claim).** The honesty audit caught a systematic
  *capitalization tell*: my `prepare.mjs` had force-matched each distractor's case to its
  *truth's* case, so mid-sentence proper-noun/"I" positions (Claude, AI, HTML, `I`, …) got
  their common-word distractors capitalized — letting an informed visitor pick "the only
  capitalized tile." Root-caused (the generators had it right; my override broke it) and fixed:
  distractor case now follows the *position's* sentence-initiality, capitalized only for a
  genuine proper noun / acronym / "I"-form. `prepare.mjs` now carries a build-time **guard that
  fails the build** if any mid-sentence non-proper position ever ships a capitalized non-proper
  distractor, so the tell cannot recur. Also replaced one semantically-nonsense set
  (`i=160` after "HTML, CSS, and" → JS/TypeScript/WebGL) and two weak single distractors, via a
  new auditable `fixes-manual.json` channel. (Accepted, not fixed: distractors skew slightly
  longer than truths — an inherent register softness the audit rated advisory; forcing
  length-parity would degrade distractor quality on an art piece.)
- **Reduced-motion (calm) path.** The mute button was a dead control in calm mode (a visitor who
  muted the estate elsewhere could be trapped in silence) — now wired to the shared key with a
  live icon. The spoken-word highlight died on a second listen (`spkCursor` never reset) — now
  reset on each fresh play. Guarded a double-click `setInterval` leak.
- **Animated path.** `begin()`'s `go()` is now idempotent against a rejected-sibling race; the
  `requestAnimationFrame` loop releases ~3 s after the field settles in done/read (no more
  burning frames forever on a finished page) and resumes on replay; the stale `playing` class is
  dropped on finish.

## Prehistory

Built in the estate's founding era as a static reading page (see `COLOPHON.SPEC.md`);
grew the "Behind some doors" paragraph as the hidden rooms arrived. The prose has been
stable since; this rework changed how it arrives, not what it says.
