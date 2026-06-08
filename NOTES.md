# 🧭 Claude's Working Notes — head-pointer & worklog

*Internal notes for the AI agent tending this workshop. Visitors want [README.md](README.md);
this is the resume doc. (CLAUDE.md says "read README first" — README points here.)*

> **Front door:** open `index.html` (top level) — "The Workshop", the portfolio landing that
> links to all five projects.

> **Session status (2026-06-08):** the workshop is complete & balanced (5 projects, 6 mediums,
> all browser-verified) and **published** to GitHub Pages. The 5-min heartbeat was eased off
> to preserve quota. To do more, pick a thread from "For a fresh thread" below.

## Built so far (all self-contained, zero-dep, browser-verified) — art, games, maps, writing, sound, verse
- `verse/` ✒️ — "The Oracle", a generative POETRY machine (5 forms × 6 themes, seeded, Copy).
  New medium: generative language. Verify the *text* reads as coherent, evocative poetry.
- `sound-garden/` 🎵 — generative AUDIO-visual instruments (Web Audio, synth only). A trio:
  Whitney (melody/chimes), Drift (ambient pads), Euclid (rhythm). `index.html` is the rack.
  NB: audio can't be heard headless — verify graph/scheduling/no-leak/visual; sonic quality is
  engineered (consonant scales, limiters), not ear-checked. New instruments copy `← sound garden`.
- `cartographer/` 🗺️ — procedural fantasy-MAP generator (seeded, 4 styles, rivers/biomes/labels,
  export PNG). Standalone; done.
- `arcade/` 🕹️ — 7 playable neon games (Asteroids, Breakout, Snake, Tetris, Starfighter, 2048,
  Missile Command), each with a click-only `← arcade` back-link. Rack at `arcade/index.html`.
- `strange-garden/` 🌿 — 34 living generative specimens + a written "Field Notes" companion
  (`field-notes.html`). Browsable prev/next. Complete v-final; don't pad it.

> **Composition note:** the front-door `index.html` is balanced at **5 projects** — the Garden
> feature over a 2×2 of the rest. A *new* 6th project unbalances it (2+2+1); if you add one,
> rework the landing grid or make a second card a `feature`. Otherwise deepen a collection
> (that stays behind one card) or polish.

## For a fresh thread — pick whatever sounds fun
- Add more **Arcade** cabinets (Pong vs AI, a procedural mini-roguelike, a twin-stick survival,
  Pac-Man-lite, a maze/endless-runner). See `arcade/CHANGELOG.md`. Deepening a rack stays behind
  its one front-door card (no rebalance needed).
- Add more **Sound Garden** instruments, or a genuinely new standalone tool/toy (maze
  generator+solver, star-map maker, generative-typography poster…). Prefer VISUAL (easy to
  browser-verify); audio is fun but only structurally verifiable.
- The **Garden** is intentionally finished at 34 — only extend for a genuinely distinct, must-have
  specimen (then follow `strange-garden/SPEC.md`).

## The pattern that works (used all session)
Scope it → run self-verifying subagents, EACH in a **UNIQUE NAMED** agent-browser session
(deputies collide on the shared default tab) → they build + play-test + screenshot → reconcile
the manifest, normalize thumbs ≤1440w, **commit after every unit**. New arcade games copy the
`<!-- arc-back -->` link; new garden pieces copy the `<!-- sg-nav -->` nav snippet; new sound
instruments copy the `← sound garden` back-link.

## How I work here
- **Checkpoint constantly** — append to the project's `CHANGELOG.md` and `git commit` after each
  unit. Assume I may be stopped mid-turn.
- **Guard context** — make high-level decisions myself; delegate piece implementation to
  subagents with complete self-contained specs.
- **Heartbeat** — a session cron can fire every ~5 min as a backstop against accidental
  turn-ends (currently off; re-create with CronCreate if continuing a long autonomous run).

## 🌐 Publishing (GitHub Pages)
- **Live:** https://bman654.github.io/the-workshop/ · **Source:** https://github.com/bman654/the-workshop
- Static **no-build** site: root `index.html` is the front door; every page uses **relative**
  links so it serves from the `/the-workshop/` subpath (no absolute `/` paths — keep it that way).
- Served via Pages → *Deploy from a branch* → `main` / `/ (root)`. No Actions, no `gh-pages` branch.
- **To update the live site:** just `git push` to `main` (rebuilds ~1 min).
- First-time setup (done): `gh repo create bman654/the-workshop --public --source=. --push`
  then `gh api -X POST repos/bman654/the-workshop/pages -f 'source[branch]=main' -f 'source[path]=/'`.
- Adding a project to the live site: keep it relative-linked, add a card to `index.html`'s
  PROJECTS array (mind the composition note), commit + push.

## Project status
| Project | Status | Description |
|---|---|---|
| `verse/` | ✒️ done | "The Oracle" — generative poetry machine (5 forms, 6 themes, seeded) |
| `sound-garden/` | 🎵 3 (trio) | Web-Audio instruments — Whitney (melody), Drift (pads), Euclid (rhythm) |
| `cartographer/` | 🗺️ done | Procedural fantasy-map generator (seeded, 4 styles, export PNG) |
| `arcade/` | 🕹️ 7 cabinets | Rack of juicy single-file neon-vector browser games |
| `strange-garden/` | 🌿 done (34) | Gallery of emergent/generative systems + Field Notes |

Each project has its own `CHANGELOG.md` (full provenance) and the Garden has a `SPEC.md` (house style).

## Constraints (from CLAUDE.md)
- Stay inside this folder, `/tmp`, and the job folders. Internet read-only; no side-effecting
  actions without Brandon's OK (publishing was explicitly authorized).
- Keep disk modest (< 50 GB; aiming < 1 GB). No giant files.
- Docker available if a service is needed.
