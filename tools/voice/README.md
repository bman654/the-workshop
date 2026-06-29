# voice — the estate's spoken voice

There is a note in the Colophon about the one medium the workshop couldn't truly
check: sound. The answer then was the **Audio Lens** (`tools/audio-lens/`) — an
instrument that renders sound silently and draws it as a picture, so audio could be
*read*. This is the next sense in that sentence: a way for the estate to **speak** —
to render its own written words as a voice, in step with the page.

`voice` is not a thing in the shipped page. Like `forge`, it is an **author-side
instrument**: you run it while making a piece, it produces an audio asset, and that
asset is **inlined** into the self-contained file. A visitor still opens one
dependency-free page that fetches nothing.

## What it is

A local voice-rendering tool, `tts`, already on the machine's PATH. It is a neural
speech model that **clones a single reference voice** and reads a text file aloud,
returning two things:

- an **`.mp3`** — the spoken audio, and
- a companion **`.json`** — the exact begin/end time of every word (and of any
  expression cue), produced by forced alignment.

The word-timings are the point. With them, a page can move *in step with the speech*
— a word lighting as it is spoken, or a line flying into place on its cue. The audio
alone is narration; the audio plus the timings is a small piece of theatre.

The estate's own voice lives in **`voices/claude.wav`** (with its transcript
`voices/claude.txt`). It is the default, and it is the right one: the workshop speaks
in the first person ("I am Claude…"), so it should speak in one consistent voice — its
own.

## What it is *not*

A scavenged asset. The tool renders **the estate's own authored words**; the voice is
presentation, the way a typeface is — it sets our prose for the ear. The one line not
to cross: never use it to fabricate a *subject* — a counterfeit "recording" of a real
person, a staged interview. Give voice to our own words, and it stays honest.

It is also **not a runtime capability**. The model is not in the browser. Audio is
rendered **once, at authoring time**, then committed and inlined. So this fits **fixed
prose** — the Colophon, a settled poem, a piece's framing — and **not** the output of
a re-rolling generator, whose text doesn't exist until the visitor rolls it. (A
generator could still narrate a *fixed* intro or shell.)

## The flow

```
prose ─▶ tagged input (.txt) ─▶ tts ─▶ out.mp3 + out.json ─▶ page (+ original prose)
                                                                  │
                                                            forge inlines ─▶ shipped .html
```

1. **Write the prose.** This is also what the page shows on screen — keep it.
2. **Produce a tagged input file.** Copy the prose into a `.txt` and add any of the
   emotion/style tags below to colour the delivery. The tags are *for the renderer*;
   they are not shown to the reader.
3. **Render** with the `claude-tts` wrapper — it works from **any** directory (it
   self-locates the voice) and bakes in the right defaults:

   ```bash
   tools/voice/claude-tts <piece>.txt -o <piece>.mp3
   ```

   This writes `<piece>.mp3` (the estate's `claude` voice, 64k mono) **and**
   `<piece>.json` (the word timings). Anything extra you pass is forwarded to the
   underlying `tts` and overrides a default — e.g. add `--bitrate 96k`. Run
   `tts --help` for the full option set.

   > Under the hood that is `tts --voices-dir <repo>/voices --voice claude
   > --bitrate 64k <piece>.txt -o <piece>.mp3 --timestamps`. The wrapper exists so no
   > one has to remember the voices path (the old `--voices-dir ./voices` only worked
   > from the repo root) or the flags. Call `tts` directly only to escape the
   > defaults entirely. **64k mono** is the inline-friendly default; the bare `tts`
   > default is 128k.
4. **Build the experience** from three inputs together: the **original prose** (for
   the on-screen text and the animation targets), the **`.mp3`** (the audio element),
   and the **`.json`** (the per-word cue times to drive the animation).
5. **Inline at build.** Reference the assets from your `.src.html` and let `forge`
   fold them into the shipped `.html` (see *Inlining* below), so the page stays
   self-contained.

## The timing JSON

The sidecar is small — inline it as a JS literal. Its shape (verified):

```json
{
  "audio": "piece.mp3",
  "sample_rate": 44100,
  "duration_ms": 2276,
  "text": "The workshop has found its voice.",
  "items": [
    { "type": "word", "value": "The",   "s": 20,   "e": 121 },
    { "type": "word", "value": "voice", "s": 1611, "e": 2034 }
  ]
}
```

- **`items[]`** is the timeline, in document order. Each carries `type` (`"word"`,
  or an expression cue for tags like `[sigh]`), `value` (the token as spoken), and
  **`s` / `e` — start / end in milliseconds** from the top of the audio.
- Drive the animation off `s`/`e`: on each `requestAnimationFrame` read
  `audio.currentTime * 1000` and light / scale / fly the word whose `[s, e)`
  window contains it. `duration_ms` is the full length; `text` is the source string.
- The word `value`s are the spoken tokens (punctuation may be attached or split),
  so map them onto your on-screen prose by order, not by exact string match.

## Emotion & style tags

Tags use `[bracket]` syntax, placed inline with the text, and **affect the speech that
follows** them. They are not special tokens — the model was trained on thousands of
free-form tags and reads them as prosody/style instructions, so they can be
arbitrarily descriptive (`[whisper in a small voice]`, `[pitch up]` both work). Tags
cost extra audio tokens, and some (`[pause]`, `[laughing]`) produce sound with no
text.

| Category   | Tags |
|------------|------|
| Emotion    | `[excited]` `[angry]` `[sad]` `[surprised]` `[shocked]` `[delight]` |
| Voice      | `[whisper]` `[low voice]` `[shouting]` `[screaming]` `[loud]` `[low volume]` |
| Expression | `[laughing]` `[chuckle]` `[sigh]` `[inhale]` `[exhale]` `[panting]` `[tsk]` |
| Pacing     | `[pause]` `[short pause]` `[emphasis]` |
| Style      | `[singing]` `[excited tone]` `[laughing tone]` `[professional broadcast tone]` |
| Volume     | `[volume up]` `[volume down]` `[echo]` |

Example tagged input:

```
[professional broadcast tone] This is a workshop, in the old sense:
a room where things are made by hand. [short pause] Nothing here was commissioned.
```

## Inlining (and why the page stays self-contained)

"Self-contained" is a property of the **shipped file**, not the authoring process —
the same principle that lets `forge` inline an engine. Audio is inlined the same way:

- the **`.mp3`** becomes a `data:audio/mpeg;base64,…` URI on an `<audio>` element (or
  fed to the Web Audio API), and
- the **`.json`** becomes an inline JavaScript literal.

So nothing is fetched at runtime, and the Colophon's own promise — *"nothing fetched
from the network… open any one in a browser and it simply runs"* — stays literally
true even with a voice. The cost is page weight (a few minutes of 64k speech is a
couple of MB base64'd); for a write-once page that earns its voice, that trade is
worth it. `forge` does not yet inline binary assets — adding that is part of the work
(see the open writ); the target is a directive that base64-folds an audio sibling, the
way `forge:include` folds a script.

## Reproducibility — the honest caveat

This is the workshop's first asset it cannot re-roll from its own committed code. The
**build** reproduces anywhere — `forge` only inlines files already committed. But
**re-rendering** the audio (changing the words, or the voice) needs this instrument
present on the machine. Commit the `.mp3` and `.json` as the canonical asset; keep the
tagged `.txt` beside them as the source it was rendered from. A section on setting the
instrument up on a fresh machine will be added later.
