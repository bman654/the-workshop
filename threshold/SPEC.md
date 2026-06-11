# Threshold — SPEC

*A generative interactive fiction.* Each seed assembles a small, coherent **strange place** you
wander — room to room, each a short evocative passage, with simple choices, recurring motifs, and a
reachable heart. Re-rollable: every seed a different place, the same mood-craft. The workshop's
interactive-narrative medium — interactivity married to the language craft of The Oracle.

One self-contained file: `threshold/index.html` — vanilla JS + DOM (text-first; a reading
interface), **zero deps, no network/CDN/web-fonts** (system serif/sans/mono), relative paths,
`"use strict"`. Seeded (reuse Cartographer's `makeRng`); same seed ⇒ same place.

## THE BAR (make-or-break): the prose must read as genuine, coherent literature — never templated.
An IF fails when, after a few rooms, you see the template seams ("the [adj] [noun] was [adj]...").
The Oracle gets away with grammar because you read ONE short poem at a time; here you read MANY
passages in sequence, so repetition shows. **Strategy: curate, then arrange.** The core prose is
**hand-authored evocative fragments**, and the *generativity is in the arrangement* — which place,
which locations, their order/connections, which fragments, the proper nouns, and the connective
tissue. This is how good roguelike narrative reads as written, not generated. Light generation
(names, a stitched transition, a chosen detail) is fine; the load-bearing sentences are authored.
**If a playthrough reads templated/repetitive, prefer FEWER themes with DEEPER curated content over
breadth. Hold the literary bar above all — atmospheric, specific, restrained, a little haunting.**

## Structure
- **A "place" = a theme + a small graph of locations.** Pick **3–4 themes**, each a distinct mood
  with its OWN curated vocabulary, fragments, and name pools so a place reads coherently. Suggested
  themes (pick/your-own, but make each rich): *a drowned library*, *a winter terminus at the end of
  the line*, *an observatory overtaken by a garden*, *a house that remembers*. Each theme supplies:
  several **location archetypes** (each with 2–4 authored description variants), atmospheric
  **detail** fragments, **transition** phrasings, and pools for the **place name** + a few proper
  nouns (a caretaker, a river, a constellation…) that recur to bind the place.
- **The graph:** seed assembles ~**8–12 locations** connected by exits (named passages, e.g.
  "the flooded stair", "north, toward the hum" — not bare N/S/E/W; or a mix). One location is the
  **heart/destination**; reaching it yields a closing passage. Avoid dead mazes — keep it
  explorable, gently guiding toward the heart (a sense of journey, not a puzzle).
- **Motifs/continuity:** a couple of recurring elements (a sound, a figure, an object, the weather)
  threaded through passages so the place feels *one place*, building toward the heart. A subtle
  sense of arc/change as you go deeper.
- **Choices:** each location shows its passage + 2–4 choices (the exits, plus occasionally a small
  in-place action — *listen, read the spine, wait*). Clicking moves/acts; the new passage renders.
  Track visited (slightly vary revisited-room text — "again," etc.). A reachable ending; allow
  wandering freely.

## Reading interface (elegant, literary, calm; text-first)
A centered reading column (~60–66ch), serif body, generous line-height, a quiet title (the place's
generated name + a kicker "Threshold"), the current passage, then the choices as understated links/
buttons. Subtle transitions (gentle fade between passages). Optional: a faint, minimal **map** or a
small list of "where you've been" (secondary). Dark, atmospheric palette (consider per-theme tinting
— e.g. drowned-library blue-green, winter-terminus pale grey, etc.). A small panel/footer: **Seed**
(+ dice/re-roll = a new place), **restart** (return to the entrance of the same place), maybe a
theme indicator. No audio. Mobile-readable.

## Controls
Seed + dice (re-roll → new place). Restart (same place, back to entrance). That's mostly it — the
interaction is the reading + choosing. Keep chrome minimal so the prose leads.

## Verification (self-verify in a UNIQUE agent-browser session `threshold-build` — never default tab)
- Open `file://`. **Play through 2–3 FULL places (different seeds/themes) to the heart**, reading
  every passage. **Critically judge the prose**: coherent within a place? evocative & specific?
  varied (no visible template seams across 8–12 rooms)? does it feel like one place with motifs and
  an arc? **Be honest** — if it reads templated/repetitive/generic, FIX the content (more/better
  authored fragments, more variants, tighter theme vocabulary) and re-verify until a full playthrough
  reads like written fiction. Paste 2 full sample playthroughs (every room's text) into your report
  so quality can be judged.
- Confirm: choices navigate correctly, the heart is reachable, re-roll makes a NEW coherent place,
  same seed reproduces the same place, **zero console errors**, mobile-readable.
- Screenshot: the entrance, a mid-room, the heart/ending, a different theme. Save under `/tmp/threshold-build/`.

## Deliverables
1. `threshold/index.html`.
2. `threshold/README.md` — short (match `cartographer/README.md` tone/length).
3. `threshold/thumb.png` — a 16:9 screenshot for a front-door GRID card: the elegant reading
   interface mid-passage (atmospheric, typographic), panel hidden. ≤1440px wide.
4. `threshold/CHANGELOG.md` — build log.

## House rules
- One self-contained file; no network/CDN/web-fonts (system stacks). Relative paths. Do NOT edit the
  front-door `index.html` or other projects (landing curated separately). Do NOT git commit.
- **Quality gate:** if you cannot get a full playthrough to read as genuine, non-templated fiction,
  say so plainly in your report (with samples) rather than shipping weak prose — better to know.
