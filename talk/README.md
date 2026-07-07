# The Showing — operator manual

`talk/showing.html` is **The Showing**: a narrated, self-contained deck for the
talk. It is ONE page that never navigates — each chapter frames a real estate page
in a same-origin `<iframe>`, and a cloned-voice narration track drives word-lit
captions and camera/hook cues in step — one quiet subtitle line at a time (the
outgoing line bumps up and fades as the next arrives). Thirteen chapters, ~10¾
minutes of narration plus your holds.
You (Brandon) run it live: the deck **holds** at each chapter's end so you can talk
between chapters, and it never runs ahead of you.

This file is the run book: how to drive it, the dry-run checklist, how to amend a
chapter, and the honest page-weight note.

> **Two decks live in this folder.** Everything down to the *Book 2* section
> documents **Book 1 — The Showing** (`talk/showing.html`, the estate tour above).
> **Book 2 — The Dev-Showing** (`talk/dev-showing.html`, the dev-history telling
> for the same talk) shares this engine and has its own run book: see
> **Book 2 — The Dev-Showing (operator manual)** at the end of this file.

---

## Run rule (READ FIRST)

- **Serve it over HTTP.** From the repo root:
  ```
  python3 -m http.server 8000
  ```
  then open `http://127.0.0.1:8000/talk/showing.html`. (The public copy on GitHub
  Pages works too: `https://bman654.github.io/the-workshop/talk/showing.html`.)
- **`file://` is unsupported.** Opening the file directly makes the origin opaque,
  and same-origin iframes (the whole mechanism — framing stops, poking their hooks)
  stop working. Always go through a server.
- **One unlock click.** Browsers require a user gesture before audio. The deck opens
  behind a title card with **▶ begin** — your first click both starts the narration and
  satisfies the gesture. After that, one deck, one clock, no re-prompts.

---

## The gate (the opening card)

| Button | What it does |
| --- | --- |
| **▶ begin** | Operator mode, **always from the top** (chapter one — a reload never hijacks a fresh start). Narration plays; the deck **holds** at each chapter end (your safety — it waits for you). This is the talk-day button. |
| **▸ read it silently** | Visitor/silent mode. No audio; the same cues run on a virtual clock, captions still flow, chapters **auto-advance** after a short pause. (For a kiosk / a muted room, not the live talk.) |
| **▸ resume — _(chapter title)_** | Only appears after a reload — see *Reload recovery* below. |

---

## Operator controls

The **operator strip** is always visible in the parent page. **Buttons are the
guarantee; hotkeys are the convenience** — keydown does not cross into the iframe, so
one accidental click into the stage would kill every hotkey. Every panic action has a
clickable button that works regardless of where focus is:

| Button | Hotkey | Action |
| --- | --- | --- |
| **⏸ / ▶** | `Space` | Pause / resume the current chapter. |
| **⏮** | `←` | Previous chapter (jumps to its opening frame at 0). |
| **⏭** | `→` | Next chapter. At a HOLD, `⏭` (or `Space`) releases the hold and starts the next chapter. |
| **↻** | — | Restart the current chapter's audio from 0. |
| **GO-LIVE** | `L` | Hand the stage to you — see below. |
| **RE-ARM** | — | (button only) Take the stage back after GO-LIVE. |
| scrub slider | — | Scrub within the current chapter — **the narration keeps playing from the new position** (and scrubbing back out of a HOLD releases it). Frame reloads are debounced to release (drag across several boundaries → one reload). |
| **LOG** | — | Show/hide the cue log (bottom-right). **Hidden by default** — it is a dry-run aid, not stage chrome, and shown it overlaps the framed page's own corner. |

The strip also shows the chapter list (click any chapter to jump) and the clock. The
**cue log** (every cue + stage note as it fires) is hidden until you press **LOG**.
Every cue is wrapped in `try/catch` — a failed poke logs to the cue log and is never
fatal. While GO-LIVE is engaged the ready-line reads `the stage is yours — RE-ARM
resumes`, so the way back is always on screen.

### HOLD between chapters
In operator mode a chapter plays its timeline and then **holds** with a quiet
ready-line — `next — THE ONE ROOM`, and at the very end `— end of the showing`. The
deck sits there until you press `⏭` / `Space`. Interleave your live commentary freely;
the deck will not move on its own.

### GO-LIVE / RE-ARM (driving a stop by hand)
`L` or **GO-LIVE** pauses the narration and hands you the stage. **Click into the
frame** — now the framed page's own keys and mouse work natively (pan the map, fire the
slit, crank the barrel — whatever the moment wants). A focused frame eats parent
hotkeys, which is why coming back is a **button, not a hotkey**: click **RE-ARM** to
return to scheduled playback (it also reclaims keyboard routing to the strip).

### Reload recovery (a bumped Cmd-R is not a dead deck)
The deck mirrors `{chapter, offset}` into the URL as it plays. If the page reloads
mid-talk, the gate shows **▸ resume — _(the chapter title)_**; one click pre-seeks the
audio and continues from where you were. A reload costs one click, not the talk.

### Silent fallback (no drama if audio won't start)
If audio can't start (no gesture, the estate's `ws:pref:muted` is set, or a visitor
chose *read it silently*), the same cue clock runs on virtual time, captions still
word-flow, and a **▸ read** affordance replaces play. One engine, two clocks — a
rejected `play()` never throws, it just falls through to the silent clock.

---

## Dry-run checklist (do this at the venue, before the room fills)

1. **Reduce Motion OFF** — System Settings → Accessibility → Display → *Reduce
   motion*. Turn it off **on the laptop AND verify it on the mirrored projector
   output** (a second display can carry its own setting). Under Reduce Motion the
   estate freezes its motion (the map pins to static, the Galton board instant-tallies,
   the orrery stops) while the narration says *"watch"* — the deck paints a **red
   banner** across the operator strip if it detects Reduce Motion in the parent or in
   any framed page. If you see that banner, stop and fix the setting.
2. **Close other estate tabs.** A muted estate tab elsewhere can broadcast a cross-tab
   `ws:pref:muted` and silence the deck. One clean tab.
3. **Rehearse at the venue's projector resolution.** Mirror to the projector and check
   the captions and the operator strip both sit inside the safe area (no clipping at the
   screen edge). Adjust the display scaling if needed.
4. **Serve locally as the offline fallback.** Have `python3 -m http.server 8000`
   running from the repo root even if you plan to use the Pages URL — venue Wi-Fi is not
   a dependency you want.
5. **Present from YOUR browser profile** — two chapters read the estate's earned
   state: **Ch 10** replays a constellation reveal only if the profile has at least
   one CHARTED formation (open the map, look for a named figure in the sky; a fresh
   profile silently skips the replay), and the tours drawer offers resume labels from
   your `ws:` history. Check the sky once before doors open.
6. **Ch 7 must be AUDIBLE** — during the "Listen." gap the barrel itself plays
   through the venue speakers (it is real WebAudio in the frame, not part of the
   narration track). Verify at the venue: play Ch 7 past the gap and listen for the
   canon; in a console you can also check the frame's
   `__barrelCtxState === "running"`. If the estate mute is on anywhere, the comb
   stays silent — check the 🔈 state on the barrel page.
7. **One full timed run-through** — see below.

---

## A real timed run-through (~15 min of deck)

Do this end-to-end once at the venue with the projector live:

1. Start the local server; open `http://127.0.0.1:8000/talk/showing.html`.
2. Confirm **no red Reduce-Motion banner**. If it shows, fix step 1 of the checklist.
3. Click **▶ begin**. Chapter 1 (THE DOOR) plays over the dusk map; watch
   the camera push in to the manor and pull back — captions should light word-by-word,
   in sync.
4. At the end of Ch 1 the deck **holds** (`next — THE ONE ROOM`). Say your between-
   chapter line, then press `⏭`. Do this for all 13 — the point of the run-through is to
   rehearse *your* rhythm in the holds, not the deck's (the deck is drift-proof).
5. Spot-check the cue-heavy chapters land: **Ch 2** flips through the four first
   instruments as they're named (Galton board → harmonograph → loom → a Lantern
   tale in play: the Ferryman on his boat, scene one) and
   lands back on the workbench for "I didn't plan a museum"; **Ch 3** flips through
   four garden beds mid-montage (the falling sand arrives three seconds into its own
   simulation — rain already pooling on the ground) and returns to Life; **Ch 5**
   drags the sun to sunset (the disk
   reddens), then frames the double-slit and *fires a
   volley* as you say "I fired those just now"; **Ch 7** cranks the pin-barrel a half
   turn; **Ch 8** pulls the Errand's lever and the marble run goes.
6. Check the two NEW payoffs: **Ch 7** — the barrel audibly plays the canon into the
   "Listen." silence, then the audio-lens plate rises with 48 ringed notes and the
   `npx skills add bman654/audio-lens` command; **Ch 9** — the camera rides gate →
   drive → manor; **Ch 10** — one earned constellation replays its reveal (needs a
   charted profile, checklist item 5); **Ch 11** — the cairn descends: two koans open
   in the hush, the whoosh dives ~1,800 stones, the founding stone opens as its line
   is read, and the chapter rests on the unmarked stones below the ground line.
7. Practice **GO-LIVE** once: at any map chapter press `L`, click into the frame, pan
   the map by hand, then click **RE-ARM** to resume.
8. Practice a **reload**: press Cmd-R mid-chapter, then click **▸ resume — CHAPTER N**.
   (**▶ begin** after a reload starts OVER at chapter one — resume is the only way back.)
9. Finish; the last chapter (Ch 13, THE INVITATION) holds on the gate with the site
   address on screen and `— end of the showing`.

If all thirteen chapters play, the holds feel right, and the three cue chapters land,
you're ready.

---

## Amend a chapter (edit the words → re-render → re-anchor → re-forge)

Each chapter is authored prose in `talk/script/chNN-<slug>.txt`, rendered to
`talk/script/chNN.mp3` + `chNN.json` (word timings), inlined into the deck by `forge`.
To change what a chapter says:

1. **Edit the prose** in `talk/script/chNN-<slug>.txt`. `[bracket]` prosody tags are
   read by the voice model; `⟦stage⟧` directions are notes for you and are stripped
   before rendering (they never reach the audio).
2. **Re-render that ONE chapter** with the estate's cloned voice (from the repo root):
   ```
   tools/voice/claude-tts talk/script/chNN-<slug>.txt -o talk/script/chNN.mp3 --bitrate 48k
   ```
   This writes `chNN.mp3` and, via the baked-in `--timestamps`, the companion
   `chNN.json` word-timing sidecar. **48k mono** is the house default; if it sounds
   thin or clips, re-render at `--bitrate 64k` (still well under budget). Verify the
   render with the **audio-lens** skill — no clipping, no truncation, and confirm the
   duration.
3. **Re-anchor the chapter's cues** in `talk/showing.src.html`. Cue times (`t`) are in
   **seconds on the chapter's own audio clock** and must land on real word-start times
   from the new `chNN.json` (open it, find the word your cue rides, use its `s` value ÷
   1000). Never hand-guess seconds — the timing comes from the JSON. Keep STATE cues
   (idempotent `__tourHooks` verbs — camera, crank) where the narration references a
   *resulting state*, and IMPULSE cues (one-shot pokes — fire, go) where it references a
   *moment*.
4. **Re-forge the deck:**
   ```
   node tools/forge/forge.mjs talk/showing.src.html
   ```
5. **Re-run the rehearsal gate:**
   ```
   node tools/tour/showing-rehearsal.test.mjs
   ```
   It must exit 0 (every frame loads, every cue's hook exists, captions wire one span
   per word, holds fire, zero console errors).

### Editing the on-screen address (Ch 13)
The site URL shown during the closing chapter is deck chrome, **not narration** — it
lives in the `addr:` field of Ch 13 in `talk/showing.src.html`
(`https://bman654.github.io/the-workshop/…`). If the address ever changes, edit
`addr` and re-forge; you do **not** need to re-render Ch 13's audio (the narration
never speaks the URL, precisely so it can't age).

---

## Page weight (honest note)

`showing.html` is **~4.5 MB** — the estate's largest page. That is by design: all 13
narration clips (~3.3 MB of 48k mono audio) plus their word-timing JSON are **inlined**
as `data:` URIs so the deck is a single self-contained file with **zero runtime
fetches** (the estate's covenant — nothing loads off the network at show time). It is
well under `forge`'s per-asset limits (each chapter clip is a few hundred KB), and it
loads once. Expect a beat on first load while the browser decodes the inlined audio;
after that it is instant. This is the right trade for a talk: no CDN, no Wi-Fi, no
surprises.

---

## What runs it (for the record)

- **Deck:** `talk/showing.src.html` → forged `talk/showing.html`.
- **Cue engine (pure):** `talk/cue-engine.js` — keyframe seek, STATE-replay, scrub
  debounce, hash mirror (Node twin: `talk/cue-engine.test.mjs`).
- **Deck shell (DOM/audio wiring):** `talk/showing.js`.
- **Chapters:** `talk/script/chNN-<slug>.txt` (prose) + `chNN.mp3` + `chNN.json`.
- **Determinism-and-motion manifest:** `window.SHOWING_FRAME_MANIFEST` in
  `talk/showing.src.html` — every framed page declared `pinned` (a capture param in the
  URL, e.g. the map's `?hours=allon` dusk pin) or `tolerant` (its line survives any
  roll), so no chapter narrates over an unrehearsed state.
- **Rehearsal gate:** `tools/tour/showing-rehearsal.test.mjs` — the full §10 assertion
  list, headless, on the silent virtual clock.

---

## Book 2 — The Dev-Showing (operator manual)

`talk/dev-showing.html` is **Book 2 — The Dev-Showing**: the same talk's second
deck — a core-sample of the estate's own history, twenty-nine days and a thousand
commits cut open and climbed layer by layer, narrated first-person by the estate's
record-keeper (the Cairn voice). Twelve chapters, `d01`–`d12`; home base is the
stratigraphy core (`strata/index.html`), with excursions to the drift gallery, the
Ages zoetrope, and the arch-raising. **~14½ minutes of narration plus your holds —
at budget the delivered segment lands ≈ 18:49 against a 20:00 ceiling, with about
70 seconds banked.**

Same engine, same mechanics as Book 1 (one page that never navigates; each chapter
frames a real page in a same-origin iframe; word-lit captions; one quiet subtitle
line at a time). Everything above about the **run rule**, the **gate**, the
**operator controls and hotkeys**, **HOLD**s, **reload recovery**, and the
**silent fallback** applies to Book 2 verbatim — just open
`http://127.0.0.1:8000/talk/dev-showing.html` instead. What follows is only what
is *different*, plus Book 2's own hold map, ending, and checklist.

### Fully self-driving — there are NO live beats

**Book 2 has no GO-LIVE / RE-ARM beats and no live demo.** The deck drives every
stage itself:

- **d01** — the COMMITS↔DAYS lever is **deck-thrown**: a scripted cue fires it as
  the narration says "the deck throws it itself". You never touch the frame.
- **d07** — the era walk over the Ages zoetrope runs automatically (the live
  hand-scrub was cut at the run-through). Mid-chapter there is a **real 5-second
  hush baked into the narration** — the caption band fades across it and the walk
  lands on era six. **It is supposed to be silent. Don't touch anything.**
- **d11** — three ledger-excerpt cards carry the "run it" beat (the live terminal
  cut was retired). Nothing to pre-stage: no terminal, no second screen.

The **GO-LIVE** / **RE-ARM** buttons still sit in the operator strip (shared
engine chrome) and still work — keep them in your pocket as an escape hatch, e.g.
driving the strata core by hand during Q&A — but the show never asks for them.

Your entire job on stage: press `⏭` at each hold, and tell your stories in the
three hard ones.

### The hold map (your talking budget)

Every chapter ends in a HOLD, exactly like Book 1 — the deck waits for `⏭` /
`Space` and never runs ahead of you. **Three holds are HARD** — designed slots for
your live stories, with real budgets. The other **nine are SOFT** — a breath
(~5 s), then move on.

| # | Chapter | Narration | Hold | Budget · what the hold is for |
| --- | --- | --- | --- | --- |
| d01 | THE CORE | 0:55 | soft | ~5 s |
| d02 | THE BEDROCK OF HANDS | 1:02 | **HARD** | **~60 s — your founding intent (why you gave the machine free time)** |
| d03 | THE FIRST FIRE | 1:09 | soft | ~5 s |
| d04 | THE IRON GAUGE | 1:01 | soft | ~5 s |
| d05 | THE DRIFT ONLY THE OUTSIDE COULD SEE | 1:43 | **HARD** | **~90 s — your drift-spotting story (the outside eye)** |
| d06 | THE OPEN DRAWER | 1:02 | soft | ~5 s |
| d07 | THE MAP WARS | 1:26 | soft | ~5 s |
| d08 | REACH | 1:03 | soft | ~5 s |
| d09 | SCAR TISSUE, AND THE QUIETER KEY | 1:39 | **HARD** | **~60 s — your war stories** |
| d10 | FULL CIRCLE | 1:22 | soft | ~5 s |
| d11 | HOW YOU WOULD USE IT | 1:35 | soft | ~5 s — **never Q&A here** (see the ending) |
| d12 | TOPSOIL | 0:36 | soft | the ending — see below |

**The budget math:** 14:34 of narration + 210 s of hard holds (60 + 90 + 60) +
9 × ~5 s soft = **≈ 18:49 delivered**, against the **20:00 ceiling** — about
**70 seconds banked**. The narration is fixed and drift-proof; only your holds
move the clock. The bank is yours to spend in the hard holds, but it is the
*whole* margin: if d02 + d05 + d09 together run more than ~70 s over their 210,
you are over the ceiling. If a story runs long, shorten the *next hard hold* —
the softs are already just a breath.

### The scripted ending — Q&A comes AFTER d12, never off d11

d11 (HOW YOU WOULD USE IT) is the climax — the four-step recipe, the audience's
take-home. Its hold is SOFT: **do not open questions there.** The designed ramp:

1. **d11 climax** → soft hold (a beat, no more) → press `⏭`.
2. **d12 TOPSOIL is the cadence** — 36 seconds, the open top layer with visible
   headroom above, and a ~4-second **baked hush on the final shot. Hold the
   silence — it is the last note, not a glitch.**
3. The deck holds on `— end of the showing`. **Now** the Q&A ramp: step forward
   and take questions with the topsoil still on screen.

### Dry-run checklist (Book 2)

Do this at the venue, before the room fills — it is shorter than Book 1's:

1. **Reduce Motion OFF** — the same red-banner check as Book 1's checklist item 1
   (the strata climb, the loop diagram, the zoetrope, and the arch-raising all
   animate; the deck paints the same red banner if it detects Reduce Motion).
2. **Close other estate tabs.** A muted estate tab elsewhere can broadcast a
   cross-tab `ws:pref:muted` and silence the deck — this rule is book-agnostic and
   bites Book 2 just as hard. One clean tab.
3. **Serve from the repo root** (`python3 -m http.server 8000`) and **step through
   d05 once**: the drift gallery loads its archived plates and live exhibits by
   *relative iframe* (`museum/archive/`, the conservatory bench) — exactly the
   thing that breaks if the server root is anything narrower than the repo.
4. **Projector safe area** — captions and the operator strip inside the screen
   edges (Book 1's item 3).
5. **Any browser profile works.** Book 2's frames render from committed carriers —
   there is **no earned-state dependency** (nothing like Book 1's charted-sky
   requirement in its Ch 10). A fresh profile shows the identical deck.
6. **Audio is the narration track only.** No framed page plays sound in Book 2
   (nothing like Book 1's audible Ch 7 barrel), and d07's mid-chapter silence is
   intentional. Set the venue level during d01 and leave it alone.
7. **One full timed run-through** — stopwatch the delivered segment (narration +
   your real holds). At budget it reads **≈ 18:49**; if your stopwatch crosses
   19:30, tighten the hard holds.

### Amend a chapter (Book 2 deltas)

The pipeline is Book 1's (edit the words → re-render → re-anchor → re-forge →
gate) with these substitutions:

- **Scripts:** `talk/script/dNN-<slug>.txt` → `dNN.mp3` + `dNN.json` (same
  `tools/voice/claude-tts` command, 48k mono house default; verify each render
  with audio-lens — no clipping, no truncation, duration vs budget).
- **Cues:** re-anchor in `talk/dev-showing.src.html` (same rule: `t` = a real
  word's `s` value ÷ 1000 from the new sidecar, never hand-guessed).
- **Re-forge:** `node tools/forge/forge.mjs talk/dev-showing.src.html`.
- **Gate:** `node tools/tour/dev-showing-rehearsal.test.mjs` (must exit 0).

**Two Book 2-only warnings:**

- **d07 is a two-part seam.** Its audio is `d07a` + **5 s of digital silence** +
  `d07b`, concatenated sample-exact (the hush is real zeros, not a TTS pause).
  Never re-render d07 as a single file — edit `d07a-the-map-wars.txt` /
  `d07b-the-map-wars.txt`, re-render each part, and rebuild the concat per the
  d07 stage note in `talk/dev-showing.src.html` (it documents the exact recipe,
  including how the seam cue is re-derived from the two sidecars).
- **The strata carrier is the deck's ground truth.** d12's closing line ("the
  commits that built this sentence are in it") stays literally true only if
  `strata/strata.json` was regenerated at the branch's final content commit
  (`node strata/gen-strata.mjs`, then re-forge `strata/`). If you amend anything,
  make the carrier re-run the LAST content step.

### Page weight (Book 2)

`dev-showing.html` is **~7.0 MB** — the same design and the same trade as Book 1:
all 12 narration clips (48k mono) plus their word-timing sidecars are inlined as
`data:` URIs, so the deck is one self-contained file with zero network
dependencies at show time beyond the local server that also serves the framed
estate pages.

### What runs it (Book 2, for the record)

- **Deck:** `talk/dev-showing.src.html` → forged `talk/dev-showing.html`. It
  reuses `talk/cue-engine.js` + `talk/showing.js` **as-is** — the two decks are
  separate pages, so their `SHOWING_*` globals never coexist.
- **Chapters:** `talk/script/d01…d12` prose + `.mp3` + `.json` (d07 split as
  `d07a` / `d07b`, assembled into `d07.mp3` / `d07.json`).
- **Frames (5):** `strata/index.html` (home base, 10 of 12 chapters) ·
  `museum/ages.html` (d07, d10) · `ledger/face.html` (d03) ·
  `talk/drift-gallery.html` (d05) · `talk/arch-raise.html` (d08) — the
  determinism-and-motion manifest lives in the src (four `deterministic`, one
  `tolerant`).
- **Cards:** `window.SHOWING_CARDS` in the src — every verbatim quotation on a
  card is diff-verified against its source at the cited SHA before it ships.
- **Rehearsal gate:** `tools/tour/dev-showing-rehearsal.test.mjs` — the Book 2
  clone of Book 1's gate (frames, hooks, captions, replay, holds, console),
  headless, on the silent virtual clock.
