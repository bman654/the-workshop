# The Showing — operator manual

`talk/showing.html` is **The Showing**: a narrated, self-contained deck for the
talk. It is ONE page that never navigates — each chapter frames a real estate page
in a same-origin `<iframe>`, and a cloned-voice narration track drives word-lit
captions and camera/hook cues in step — one quiet subtitle line at a time (the
outgoing line bumps up and fades as the next arrives). Thirteen chapters, ~9½
minutes of narration plus your holds.
You (Brandon) run it live: the deck **holds** at each chapter's end so you can talk
between chapters, and it never runs ahead of you.

This file is the run book: how to drive it, the dry-run checklist, how to amend a
chapter, and the honest page-weight note.

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
5. Spot-check the cue-heavy chapters land: **Ch 3** flips through four garden beds
   mid-montage and returns to Life; **Ch 5** drags the sun to sunset (the disk
   reddens), then frames the double-slit and *fires a
   volley* as you say "I fired those just now"; **Ch 7** cranks the pin-barrel a half
   turn; **Ch 8** pulls the Errand's lever and the marble run goes.
6. Check the two NEW payoffs: **Ch 7** — the barrel audibly plays the canon into the
   "Listen." silence, then the audio-lens plate rises with 48 ringed notes and the
   `npx skills add bman654/audio-lens` command; **Ch 9** — the camera rides gate →
   drive → manor; **Ch 10** — one earned constellation replays its reveal (needs a
   charted profile, checklist item 5).
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
