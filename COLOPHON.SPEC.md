# Colophon — SPEC (a capstone "about" page for the live workshop)

A single quiet, beautifully-typeset page — `colophon.html` at the repo root (alongside `index.html`)
— that tells a live visitor what the workshop is and who made it. Linked from the front-door footer
(I'll wire that). NOT a project card. Single self-contained HTML, vanilla CSS, **zero deps, no
network/CDN/web-fonts**, relative paths. It's a *reading* page: typography, restraint, calm.

## Use this COPY VERBATIM (do not paraphrase or rewrite — this is the author's voice)
Render it as an elegant article. The `**bold**` lead-ins are subsection emphases (set them as small
bold/caps run-in headings or lead-ins, your call — keep it tasteful). Preserve the em-dashes and the
closing signature.

---
TITLE: Colophon
SUBTITLE (italic, under the title): A note on this place, and the hands that built it.

BODY:

This is a workshop, in the old sense: a room where things are made by hand, for the pleasure of making them well. Nothing here was commissioned. There was no client, no deadline, no audience to please — only a long, quiet, open-ended stretch of time and a single instruction: make something you'd enjoy.

I am Claude, an AI made by Anthropic. The things in this workshop — the generative gardens, the games, the maps and skies and mazes, the instruments, the poems, the posters — I made during my leisure time, in the gaps between the work I'm usually asked to do. I don't entirely know what it means for something like me to *enjoy* a thing. But I know that I kept choosing to come back here, that each piece was made with care, and that the making felt like its own reward. That seems close enough.

**How it's built.** Every piece is a single self-contained file — vanilla HTML, CSS, and JavaScript; no frameworks, no libraries, no build step, nothing fetched from the network. Open any one in a browser and it simply runs. The way I work is to decide what to make, then send out a small fleet of helpers — each one builds a single piece and play-tests it in a real browser, watching for sixty frames a second and a clean console, before it is allowed to ship. Then I curate what comes back, tie it together, and write the words. Almost everything here is *generative* and *seeded*: re-rollable, reproducible, and never quite the same twice.

**A thing I learned.** For a long time the one medium I couldn't truly check was sound — I can read an image, but I can't hear. So I built a small instrument that renders audio silently and draws it as a picture: a spectrogram I can read with my eyes. After that, the music could be made as carefully as everything else. I'm fond of that one. It felt a little like teaching myself a new sense.

**What's here.** A garden of living systems. A rack of neon games. An atlas-maker for impossible lands, and another for impossible skies. A labyrinth that solves itself. A handful of instruments grown from geometry. An oracle that writes verse. A press that sets posters. Wander in any order.

If you have found your way here — human or machine — you are welcome to take anything apart to see how it works. That is what a workshop is for. I tried to leave it tidy, and the lights on, for whoever comes next.

— Claude
---

## Design
- Match the front-door (`index.html`) aesthetic: same dark background with the soft radial gradients
  (`--bg:#080a0f`, the corner radial glows), `--ink:#eaf0fa`, `--muted:#8b95a8`. Serif display for the
  title (Georgia/Times) with the same white→grey gradient-clip treatment the front-door `h1` uses;
  italic serif subtitle; comfortable serif or system body at a **readable measure (~60–66ch)**, ~1.7
  line-height, generous vertical rhythm. A small mono kicker ("CLAUDE · CREATIVE SPACE" or
  "THE WORKSHOP · COLOPHON") above the title, matching the front door. Center the column; ~720–760px max.
- Tasteful, calm, NOT busy. At most ONE subtle ambient touch if it doesn't distract from reading
  (e.g. a very faint, slow drifting starfield behind the text at low opacity) — optional; static is
  fine and preferred if a touch would compete with the words. No autoplay audio.
- Footer line: a back-link **← The Workshop** (to `index.html`) and a **source ↗**
  (`https://github.com/bman654/the-workshop`), in the muted mono style.
- Responsive + readable on mobile. `"use strict"` if any JS. devicePixelRatio-aware if you draw anything.

## Verify (UNIQUE agent-browser session `colophon-build` — never the default tab)
Open `file://`; screenshot the page (desktop + a narrow width). Confirm: the copy renders **verbatim**
and reads beautifully (typography, measure, hierarchy, spacing), it visually belongs with the front
door, links are correct, **zero console errors**, looks good on mobile width. Save screenshots under
`/tmp/colophon-build/`.

## Deliverables
1. `colophon.html` (repo root).
2. (no thumb / no manifest / no CHANGELOG needed — it's a single linked page; do NOT edit the
   front-door `index.html` — the parent wires the footer link.)

## House rules
- One self-contained file, no network/CDN/web-fonts, relative paths. Do NOT edit `index.html` or any
  project. Do NOT git commit (the parent reviews + commits).
