# The Trailer — RECORD.md (record-day dry-run checklist)

One-page checklist for recording the take in OBS. The film is **3:06.9** long
(186.909 s), fully wired and cue-locked. `?record` mode is the OBS contract
(ENGINE §8): it removes all chrome, holds a 1920×1080 stage on pure black, runs a
preflight that **refuses to arm on any red**, waits for **one real click**, plays a
2.2 s silent count-in, then runs straight through to a clean held-black out-point.

> ⚠ **CEF UNREHEARSED.** The automated agent could not run an OBS rehearsal on this
> shared work machine without side effects (OBS websocket is off, audio/screen
> capture needs your permission, and no headless path captures the live audio
> cleanly). Treat this as a fresh rehearsal: **do one Option-A smoke pass before the
> real take, and fall to Option B on any artifact.** Everything below is verified from
> the code + design, not from a rendered recording.

---

## 1. Serve the film

```
cd /Users/brandon/dev/general/creative-space/.claude/worktrees/talk-trailer
python3 -m http.server 8717        # the DEDICATED record port — see §7
```

Open **`http://localhost:8717/trailer/index.html?record`** in the capture browser.
Never open `file://` (same-origin frames + audio need a real HTTP origin).

- **Record port `8717` is reserved for the take ONLY.** localStorage is origin-scoped
  per port, so a fresh port = a fresh-profile estate (invariant 7). If you browse the
  estate on 8717 you earn state and the fresh-state preflight goes red. **Rehearse on a
  different port** (e.g. 8730) and keep 8717 pristine for the real take.
- The Gate finale renders with the pinned seed **`20260717`**
  (`the-gate/the-gate.html?scene=idle&t=night&wx=storm&seed=20260717`) — already wired
  into the film; nothing to set.

## 2. OBS scene settings

**Option A (preferred) — OBS Browser Source (CEF):**
- Add a **Browser Source**: URL `http://localhost:8717/trailer/index.html?record`,
  **Width 1920, Height 1080, FPS 60**.
- Check **"Control audio via OBS"** ON (captures the film's audio into the recording).
- Canvas + Output resolution **1920×1080**, **60 fps**.
- Arm the film with an **Interact** click into the Browser Source (a true input click —
  required to unlock WebAudio; a synthetic dispatch unlocks nothing). Or launch OBS with
  `--remote-debugging-port=<port>` and send the click as a CDP `Input.dispatchMouseEvent`.
- **Rehearse the FULL montage inside CEF first** — watch the stats dock for dropped
  frames.

**Option B (fallback, drop-in, no redesign) — real Chrome `--app`:**
- `open -na "Google Chrome" --args --app="http://localhost:8717/trailer/index.html?record" --autoplay-policy=no-user-gesture-required`
- OBS: **Display/Window Capture** of the Chrome window + **macOS Audio Capture** for the
  film's audio. Retina is 2× → set the source **scale to 50%** to land 1920×1080.
- Arm with one real mouse click on the arm surface.

**Recording format:** CRF ~16–18, **.mkv** container → **remux to .mp4** after
(`ffmpeg -i take.mkv -c copy take.mp4`). Lock to **30 fps only if the stats dock shows
drops** at 60.

## 3. Arm → count-in → play (what one click does)

1. Preflight must be **ALL GREEN** (see §5) — the arm surface shows the six rows.
2. **One real click** runs the full reach-in: unlocks the bed + every VO element and weaves
   and pauses the colophon cold-open. The click gives the page sticky audio activation, so
   the **Gate storm + welcome tune unlock FRESH at the Gate-cut cue (172.4 s)** — the film
   does not touch the Gate audio at arm time (a fresh unlock at the cut starts the storm
   clean; unlock-at-arm used to pile up ~172 s of texture that clipped on resume — T6.4).
   The click also re-runs the preflight and **refuses to arm if anything flipped red**.
3. **Silent count-in: 2.2 s of held black**, then the bed starts at t=0 and the film runs.
4. Plays straight through — no holds, no seeks — to a **held-black out-point** (no end card).

## 4. In / out trim points

| Point | When | Note |
|---|---|---|
| **IN** | bed t=0 (right after the 2.2 s count-in) | Trim off the count-in + arm click. Keep ≤1 s of the count-in black as a lead-in if you like. |
| **OUT** | **186.909 s** after bed t=0 (the held-black landing) | Hold the black a beat, then cut. |

Recorded film content = **0 → 3:06.9**. Verify these beats are clean on playback:

- **~2:00 (120.0 s)** — the star collapses on the music **drop**.
- **~2:33.5 → 2:37.8 (153.6 → 157.8 s)** — the pointless-errand **scratch + total
  silence** gag (the bed cuts out; audio must be genuinely silent here, then resume).
- **2:42 → 3:06.9 (162.4 → 186.9 s)** — the **Gate finale** (fade begins 162.4, Gate cut
  172.4, "welcome" ~182.5, held black 186.9). Storm + logotune audible.
- **~2:17.7 (137.7 s)** — the **Lattice** diegetic moment (one instrument heard for real).

## 5. Preflight red-lights (any red = do NOT record; fix it)

The arm surface shows six rows; all must be green:

1. **Frames loaded + settled** — every stack frame `load`ed, +400 ms settle beat.
2. **Audio ready** — the bed and every VO segment `readyState ≥ 2`.
3. **Reduce Motion OFF** — System Settings → Accessibility → Display → Reduce Motion
   must be off (the estate freezes under RM).
4. **Estate unmuted** — `ws:pref:muted` ≠ `'1'` (the colophon voice + Gate audio depend
   on it). Clear it in the estate's own audio toggle if set.
5. **Viewport ≥ 1920×1080** — the capture surface must be at least 1920×1080 CSS px.
6. **Diary fresh** — the reliquary frame reports **Page 1 = AWAITING + exactly two
   SEALED stamps**. Any other state means the record port earned browser state — use a
   fresh port (see §1).

## 6. Length note (READ — supersedes the old "< 3:00")

The film is **3:06.9**. Brandon ruled at SP-B: **keep 3:06.9, no trim** (the 3:00 ceiling
is SOFT — inv 8). The older T6.3 acceptance line "stopwatch < 3:00" predates that ruling
and is superseded; a correct take runs ~3:07.

## 7. One-line recap

Serve worktree root on **8717** → open `trailer/index.html?record` in OBS at
**1920×1080 / 60 fps** → wait for **all six preflight rows green** → **one real click** →
**2.2 s count-in** → straight through to **held black at 3:06.9** → trim IN at bed t=0,
OUT at 186.909 s → CRF 16–18 mkv, remux to mp4.
