# The Projection Room — RECORD-projection-room.md (record-day dry-run checklist)

One-page checklist for recording the take in OBS. Adapted from `trailer/RECORD.md`
(same `?record` contract, ported into `talk/showing.js` and shared by this deck —
T1.1 / SP6.1). The film is **`talk/projection-room.html`**, a ~6-minute making-of
telling how the estate's three other films (trailer, Showing, dev-showing) are made
— built on the very engine it explains. Wired and cue-locked at commit `406baa3`
(T5.2/T5.3). Recorded film length is **~6:24** narration+holds, **~6:29** including
the score's tail ring-out at the held end card (SPEC target was ~6:00 — soft, not a
hard constraint; see §6).

> ⚠ **CEF UNREHEARSED**, same caveat as the trailer: the automated agent could not
> run a live OBS rehearsal on this shared work machine (OBS websocket is off, audio/
> screen capture needs your permission, no headless path captures the live audio
> cleanly). Treat this as a fresh rehearsal: **do one Option-A smoke pass before the
> real take, and fall to Option B on any artifact.** Everything below is verified
> from the code + a full `?record`-mode agent-browser run-through (T5.3/T5.5), not
> from an actual OBS recording.

---

## 1. Serve the film

```
cd /Users/brandon/dev/general/creative-space/.claude/worktrees/projection-room
python3 -m http.server 8827        # the DEDICATED record port for THIS film — see §7
```

Open **`http://localhost:8827/talk/projection-room.html?record`** in the capture
browser. Never open `file://` (same-origin iframes + audio need a real HTTP origin).

- **Record port `8827` is reserved for the take ONLY** — different from the
  trailer's `8717` (invariant 7: `ws:` state is scoped by origin, i.e. by *port*,
  not by path, so browsing any estate page on this port earns state and reddens the
  fresh-profile check). **Rehearse on a different port** (e.g. `8828`) and keep
  `8827` pristine for the real take.
- The built file is one self-contained HTML page (~9 MB, all narration + the score
  bed embedded as `data:` audio — no separate asset fetches to race). First paint
  can take a couple of seconds on a cold load; that's expected — wait for the
  preflight's first row before worrying.
- If the branch has been merged to `main` by record day, the same page lives at the
  same relative path (`talk/projection-room.html`) in whatever checkout you serve —
  the `?record` contract doesn't care which checkout, only which port.

## 2. OBS scene settings

**Option A (preferred) — OBS Browser Source (CEF):**
- Add a **Browser Source**: URL `http://localhost:8827/talk/projection-room.html?record`,
  **Width 1920, Height 1080, FPS 60**.
- Check **"Control audio via OBS"** ON (captures the film's narration + score bed
  into the recording).
- Canvas + Output resolution **1920×1080**, **60 fps**.
- Arm the film with an **Interact** click into the Browser Source (a true input
  click is required — WebAudio ignores a synthetic dispatch). Or launch OBS with
  `--remote-debugging-port=<port>` and send the click as a CDP
  `Input.dispatchMouseEvent`.
- **Rehearse the full film inside CEF first** — watch the stats dock for dropped
  frames (the embedded audio makes the page heavier than the trailer's).

**Option B (fallback, drop-in, no redesign) — real Chrome `--app`:**
- `open -na "Google Chrome" --args --app="http://localhost:8827/talk/projection-room.html?record" --autoplay-policy=no-user-gesture-required`
- OBS: **Display/Window Capture** of the Chrome window + **macOS Audio Capture** for
  the film's audio. Retina is 2× → set the source **scale to 50%** to land
  1920×1080.
- Arm with one real mouse click anywhere on the gate.

**Recording format:** CRF ~16–18, **.mkv** container → **remux to .mp4** after
(`ffmpeg -i take.mkv -c copy take.mp4`). Lock to **30 fps only if the stats dock
shows drops** at 60.

## 3. Arm → count-in → play (what one click does)

1. Preflight must be **ALL GREEN** — the gate shows six rows (see §5).
2. **One real click anywhere on the gate** runs the reach-in: primes the voice
   `<audio>` on chapter 1 and (via a page-wide `pointerdown` listener) the score bed
   — both get real-gesture activation together, so no later programmatic `play()`
   is ever refused. The click also re-runs the preflight and **refuses to arm if
   anything flipped red** since the poll last painted.
3. **Silent count-in: 2.2 s of held black**, then chapter 1 starts at t=0 and the
   film runs unattended — every chapter **auto-advances ~2 s after its narration
   ends** (no operator holds in `?record` mode), straight through to the end.
4. **Do not use `?bed=0` or `?bedvol=0.x`** on the real take — those are rehearsal-
   only params that mute or trim the score; the real take needs the bed at full
   volume, present throughout.

## 4. In / out trim points

| Point | When | Note |
|---|---|---|
| **IN** | t=0 right after the 2.2 s count-in | Trim off the count-in + arm click. |
| **OUT** | **~387.6–388.8 s** after t=0 | See below — don't cut at the last word. |

The last narrated word lands at **~383.97 s (6:24.0)**; the end-card door finishes
opening at **~383.4 s (6:23.4)**. The deck then lets its clock run **~1.9 s past the
closing word** (a purely-visual tail — the narration audio is already over) so the
final karaoke line gets to **dissolve** (~384.2 → ~384.6 s) instead of freezing lit;
the film settles onto the clean held end card at **~385.6 s (6:25.6)** (T5.15). The
score's own fade is unchanged — it rings out for **~4.2 s** past the last voice
sample to **~387.6 s (6:27.6)**, then **~1.2 s** of true silence to the file's
natural end at **~388.8 s (6:28.8)**. **Hold the end card at minimum through the fade
(6:27.6)**; cutting at 6:28.8 gives a clean silent pad. There is no held-black
out-point in this film (unlike the trailer) — the last frame IS the end card (a door
opening on warm light over the title), and the deck simply stays there once the
final chapter's tail ends (`showing.js`: "last chapter: stay held at the end card").

Recorded film content = **0 → ~6:28** (see §6 for the honest length caveat).

## 5. Watch these beats

Wall-clock times below are ballpark (± a second), useful for spotting a stuck frame
or a dropped cue on playback, not a substitute for full re-derivation:

- **0:00–0:39** — CH1 "The Take": the record preflight panel **re-runs live as
  on-camera content** (same six-row component this checklist's real gate uses).
  Confirm it goes six-green here too, same as the real gate.
- **~1:25–2:09** — CH2/CH3 "One Page, Many Rooms" / "Fifty-Seven Bytes": the live
  aquarium + sunset room hooks fire on cue.
- **~3:12** — CH4 "The Clock Is the Voice": the broken-take beat (a second,
  free-running CSS clock visibly falls behind and the scene cuts away) — the
  film's own thesis demonstrated as content.
- **~4:01** — the crescendo: narration ends, the score bed swells alone in true
  silence in the gap between the two CH4 audio files (p04a/p04b) before the voice
  resumes. **Do not expect narration here — this is meant to be silent-but-scored.**
- **~4:11–5:14** — CH5 "Draft": the honesty beats — the slate reads **`DRAFT 2`**
  (the true, honest draft count per T5.2 — if you ever see `DRAFT 3` or a `⟨N⟩`
  placeholder, STOP, something regressed).
- **~5:14–6:24** — CH6 "Press Record": recap → the `?record` transformation (the
  in-content browser mock strips its own chrome on the word "record") → its own
  mini preflight replay → a hand doing three clicks → trim/confession → the OBS
  infinite mirror (this very take, passing its own test, on camera) → the end card.
- **The banner holds steady at `4/6`** across the whole of CH4 — including the
  crescendo gap between the two audio files (p04a → p04b). CH4 is one seamless
  chapter authored as two audio entries so the crescendo can fall in true silence;
  the deck now shows it as a single chapter (SB feedback r1 / T5.8), so the count
  never flips mid-chapter. Later chapters read `5/6` (Draft) and `6/6` (Press
  Record). If you ever see a `4/7`/`5/7` blip, something regressed.

## 6. Preflight red-lights (any red = do NOT record; fix it)

The gate shows six rows; all must be green (identical six checks CH1 replays live
as content later — `talk/showing.js` `preflightRecord()`):

1. **Stage frame loaded** — the stage iframe has `load`ed + a 400 ms settle beat.
2. **Audio buffered (readyState ≥ 2)** — every one of the 7 audio tracks probed
   and buffered (p01–p06, where CH4 = p04a + p04b, so seven files back the six
   displayed chapters).
3. **Reduce Motion off** — System Settings → Accessibility → Display → Reduce
   Motion must be off (the estate freezes under RM).
4. **Estate unmuted** — `ws:pref:muted` ≠ `'1'` in this origin's localStorage.
5. **Viewport ≥ 1920×1080** — the capture surface must be at least 1920×1080 CSS px.
6. **Fresh record profile** — no prior `ws:seen/flag/best/dwell/done/carry:` keys
   AND no resume hash present at page load. Any other state means this port earned
   browser state — use a fresh port (see §1). (Note: CH1's *on-camera* replay of
   this same panel is scripted to show row 6 red for a **returning** visitor later
   in the film — that's the film's own honest-interactivity content, not a defect;
   it doesn't apply to the real gate on a genuinely fresh port, which must be all
   six green.)

## 7. Length note (READ — the SPEC target is soft)

The SPEC's "~6:00" was a target, not a hard constraint (confirmed at T5.3/T5.5 fresh-
eyes review: "length is NOT a hard constraint"). Narration + auto-advance gaps run
**~6:24** wall-clock; including the score's tail ring-out at the held end card, the
natural recording runs to **~6:29**. A correct take lands in that range — don't trim
narration or gaps to force it under 6:00.

## 8. One-line recap

Serve the worktree root on **8827** → open `talk/projection-room.html?record` in OBS
at **1920×1080 / 60 fps** → wait for **all six preflight rows green** → **one real
click** → **2.2 s count-in** → unattended run through all six displayed chapters
(seven audio entries) to the held end card → let the score's tail ring out
(~6:27.6–6:28.8) → trim IN at t=0,
OUT at ~387.6–388.8 s → CRF 16–18 mkv, remux to mp4.
