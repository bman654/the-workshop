# Quickening — the Living Lattice (build spec)

> *"born of life, voiced by light"* — a cellular automaton drives a glowing pitch×time grid; the
> playhead **sonifies the living board**. Conway's Strange-Garden world *made audible*, played
> through Lattice's grid. The fusion of two wings. It is the first inhabitant of **The Undercroft**
> (the hidden world) — see `/UNLOCK.md`.

**File:** `sound-garden/quickening.html` — one self-contained, zero-dependency, no-network HTML file.
**It is HIDDEN:** do **NOT** add it to `sound-garden/instruments.js` (the Sound Garden rack stays at 7
visible). It is reached only from the Undercroft once unlocked.

**The model to copy:** `sound-garden/lattice.html` (~980 lines). Quickening is Lattice's sibling —
**reuse its entire scaffolding**: the seedable PRNG (xmur3/mulberry32), the SCALES table + pitch
ladder (`rowSemis`/`rowFreqs`, row = scale degree ⇒ in-scale BY CONSTRUCTION), the lens-native
injected-AudioContext engine (bus → highcut → soft-clip → limiter → master, voice cap, self-disconnect,
bounded reverb/delay), the WAV encoder, the `__renderOffline` offline-render path, the visual playhead
+ bloom/ripple, the panel/overlay/HUD CSS, keyboard shortcuts, and the "alive on load" visual loop.
**The CA reference:** `strange-garden/pieces/game-of-life.html` (toroidal step, age, ghost trails,
glider/blinker/pulsar/gun patterns, rule LUTs).

The ONE thing that changes vs Lattice: **replace the seeded-pattern engine (`generatePattern` +
`mutateStep`) with a cellular automaton.** The CA decides which cells are alive; the playhead fires
the live cells it crosses.

---

## 1. The board = the sequencer grid

- Grid is the CA board AND the pitch×time sequencer. Suggested **COLS=24** (time steps) ×
  **ROWS=16** (pitch rows; bottom=low). Tune for musicality + lively life if needed (keep COLS in
  ~16–28, ROWS ~12–18). **Toroidal** wrap (like Game of Life) so gliders travel and the board stays lively.
- ROWS map to the pitch ladder exactly as Lattice does (`buildLadder()`): row r → r-th scale degree
  ascending from root. **Every fired note is in-scale by construction.** Keep Scale + Root selectors.

## 2. Two clocks (reconcile them — Brandon's key point)

- **Musical playhead clock:** sweeps columns left→right, one column per step (8th-note feel, `stepInterval()`
  from tempo). When the playhead crosses a column, **every live cell in that column fires its row's
  in-scale note.**
- **CA generation clock:** when the board *steps* (evolves). **Default = step the CA once per full
  playhead loop** (hear a whole bar, then it evolves into the next — a self-rewriting sequencer).
- **"Evolve every" control:** a select or slider mapping to **{ ¼, ½, 1, 2, 4 } bars** (default **1**).
  ¼/½ = faster, more shimmering evolution; 2/4 = slower, more settled. (A "per-column" fast mode is fine
  as the ¼ end.) The board you SEE is static during a sweep, then pops to the next generation at the
  boundary — legible "breathe a bar, evolve" motion.
- **Both live AND offline render must step the CA at the loop boundary identically**, so the rendered
  WAV reflects the evolving life exactly as live (mirror Lattice's offline mutate-at-loop logic).

## 3. Rule families + sound mapping (deliver Brandon's multi-colour vision)

Implement a **rule-family selector** with at least these five, each with a **distinct** sound mapping:

| Rule | States | Sound mapping |
|---|---|---|
| **Conway** B3/S23 | alive/dead | alive cell fires its row note; **age → velocity & brightness** (newborn = bright accent pop, elder = settled/quieter); voice/timbre by pitch register (low pad / mid lead / high sparkle, like Lattice). |
| **HighLife** B36/S23 | alive/dead | same mapping as Conway (it has replicators — lively). |
| **Immigration** (2-colour) | alive in colour A or B (newborn takes the **majority colour of its 3 parents**) | **colour → one of 2 timbres + an octave/scale shift** (the two "species" sing as two voices). |
| **QuadLife** (4-colour) | 4 colours (newborn = majority colour, or the colour absent among parents on a tie — the canonical QuadLife rule) | **4 colours → 4 voices / octave offsets / pan positions.** |
| **Brian's Brain** | on / dying / off (B2; on→dying→off→…; off→on iff exactly 2 *on* neighbours) | only **on** cells fire (the moving wavefront); **dying** cells are visible but silent/ghosted. Lots of motion ⇒ evolving rhythm. |

Immigration/QuadLife survival+birth use Conway's B3/S23 counts on the *alive* population; only the
**colour** of newborns differs. Keep it consonant: colour never changes *pitch class* arbitrarily —
it selects octave/voice/timbre, and pitch still comes from the row (in-scale). On chaotic boards it
must still sound good.

## 4. Seeded, reproducible, never-silent

- **Initial board is a pure function of the seed** (deterministic PRNG soup at "Seed density").
  CA evolution is deterministic given board+rule ⇒ the whole piece is reproducible by seed until the
  user pokes it. Re-roll seed → new life. (Mirror Lattice's seed text + ⚄ dice.)
- **Extinction guard (must never go permanently silent):** if population stays ~0 for a couple of
  loops, gently **auto-reseed** a sparse soup ("life stirs again") so the instrument always has
  something to sing. Keep it calm, not jarring.
- **Controls:** Seed (text + dice ⚄), Rule family, Scale, Root, Tempo, Seed density, Evolve-every,
  Reverb, Volume; buttons Play/Pause, Mute, **Reseed** (re-soup from seed), **Clear**, **Inject glider**,
  **Inject soup**. **Click/drag a cell to toggle life** (play along — like both parents). Keyboard
  shortcuts mirroring Lattice (space/m/r/g/c/h) + a key to step a generation + inject.

## 5. Correctness crux — the CA self-test (the verifiable gate; workshop tradition)

A built-in self-test proving the rules are implemented right, on an **isolated scratch board** large
enough that toroidal wrap can't interfere (e.g. 16×16, pattern centred, few steps):
- **Glider (Conway):** after **4** generations the live-cell set equals the original **translated by
  (+1,+1)**. ✅
- **Blinker:** **period-2** — horizontal ↔ vertical, returns to itself after 2 gens. ✅
- **Block (2×2):** **still life** — unchanged after a step. ✅
- **Brian's Brain:** assert the state transition law on a hand-checked tiny case (every `on`→`dying`,
  every `dying`→`off`, an `off` cell with exactly 2 `on` neighbours →`on`). ✅
Expose `window.__quickening.selfTest()` → `{ pass:true, cases:[{name,pass},…] }`. **All must PASS.**

## 6. Lens-native verification (audio you can't hear → verify by sight + numbers)

Mirror Lattice exactly:
- `window.__renderOffline(seconds, seed)` → renders the SAME CA + engine under `OfflineAudioContext`
  (silent), stepping the CA at loop boundaries; returns `{ wav, peakDb, clipPct, notes, outOfScale, ladder }`.
- **In-scale audit:** every scheduled frequency must map to a ladder pitch-class ⇒ **`outOfScale === 0`.**
- **No clip:** `clipPct` ≈ 0 and `peakDb < 0` (the limiter guarantees it; the full board must not clip).
- `window.__quickening` introspection: `state, playing, fps, generation, population, headCol, density,
  ladderSemis, scale, root, snapshot(), signature(), selfTest(), setSeed(), renderOffline, P, COLS, ROWS`.
- Verify via the **`audio-lens` skill** if desired (render a WAV, feed it for a spectrogram) — but the
  built-in offline self-check (outOfScale/clip/peak) is the primary gate. **Offline = silent; keep
  live audio muted while testing** (courtesy — it plays on Brandon's speakers).

## 7. Visuals (visual-first, screenshot-verifiable)

- Live cells glow (hue by colour/voice/age); **age coloring** (newborn bright → elder settled, like
  Game of Life); dead cells faint dots; **ghost trails** for recently-dead cells so motion reads.
- Playhead = bright sweeping vertical band (Lattice). On fire: bloom flash + expanding ripple (Lattice).
- A subtle **generation pulse** when the CA steps at the loop boundary (so evolution is visible).
- Runs **alive on load** (visual playhead sweeps before audio unlock). HUD: rule · scale/root · seed ·
  gen · pop · col · voices · fps. Overlay "begin" gate (browsers need a click for audio) — copy Lattice's.
- Accent: a luminous "living" green-gold, distinct from Lattice's aqua (suggest `--accent:#7fe6a0`).

## 8. The "these go to eleven" easter egg 🎸

When **every range slider is simultaneously at its `max`**, reveal a subtle **"11"** (a small glowing
badge / the volume readout flips to "11") and set the one-time flag: `localStorage.setItem('ws:flag:eleven','1')`
(try/catch). The Undercroft recognises this flag as a found secret. Keep it delightful, not noisy;
it hides again when a slider leaves max (the flag stays set once earned).

## 9. The breadcrumb + back-link

- On load, drop the visit breadcrumb (see `/UNLOCK.md`):
  ```js
  (function(){ try{ var k='ws:seen:quickening';
    if(!localStorage.getItem(k)) localStorage.setItem(k,String(Date.now())); }catch(e){} })();
  ```
- Back-link (top-right, like Lattice's `← sound garden`): **`← the undercroft`** → `../undercroft/index.html`
  (Quickening is reached from the Undercroft). It's fine that the file is directly URL-reachable —
  secrets are bonuses; the gating is only about *revealing* it.

## 10. Acceptance gate (the subagent must verify before declaring done)

Load over the **local static server** at `http://127.0.0.1:8765/sound-garden/quickening.html` (a UNIQUE
NAMED agent-browser session — deputies collide on the shared default tab). Then confirm, with evidence
(screenshots + console evals):
1. **`__quickening.selfTest().pass === true`** (glider/blinker/block/brain all pass).
2. Page runs at **~60 fps**, **clean console** (no errors/warnings), visual playhead sweeping, cells
   alive and evolving, blooms firing as the head crosses live cells.
3. `await window.__renderOffline(20)` returns **`outOfScale === 0`**, **`clipPct` ≈ 0**, **`peakDb < 0`**,
   `notes > 0`. (Repeat for 2–3 rule families incl. a multi-colour one and Brian's Brain.)
4. Seed reproducibility: same seed → same `signature()` after N gens (deterministic).
5. Each rule family audibly/structurally distinct (different `signature` evolution / voice usage).
6. The "11" easter egg fires when all sliders maxed and sets `ws:flag:eleven`.
7. `ws:seen:quickening` is written on load (check `localStorage`).
8. Take a hero screenshot of a lively, mid-sweep board for the changelog.

Append a build entry to `sound-garden/CHANGELOG.md`. Keep the file tight (aim < ~1100 lines).
Do **not** commit — report back with the verification evidence and the screenshot path; the lead will
review and commit.
```
