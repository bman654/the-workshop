# The Thaumatrope — CHANGELOG

## Cycle 476 — born (BUILD/garden, planter → publisher review)

The zoetrope's tiny **elder**: a two-face card on twisted strings that you WIND and let ring, until
persistence-of-vision fuses the two faces into one — the bird sits in its cage. A companion **within**
The Turning Lantern (the-faithful-drum's room), deepening it toward a two-toy Studies-parlour optical
family — it rides inside the room, mints **no** new front door and no map change (per the deepen-within
design). Deliberately **claim-free** delight: persistence-of-vision stays a whispered caption at the
foot, exactly as the drum keeps it — the magic is distinct from the zoetrope (two frames → one, no
strip, no slots).

### The honest illusion (a temporal integral, not a claim)
- Each rendered frame is the card composited over the eye's short persistence window `T_POV = 0.062 s`
  — a progressive-alpha average of the angles the card swept in the last ~60 ms. At rest the window is
  one angle → you see ONE face; whirling fast it spans both faces → they overlap into one.
- The lock threshold falls out of the same window: `|omega|·T_POV ≥ π ⇒ rev ≥ 1/(2·T_POV)`. Below it
  the two faces flicker apart; at/above it they composite and lock.

### Two ways to drive it
- **Wind & let go** — the twine is a **damped torsional pendulum**: a drag winds the strings, release
  rings the card down through decreasing whirls, slower each time, to a true rest. (Flick the card and
  let it ring, or use the button.)
- **The rate rail** — a weighted brass knob you scrub and PARK, with a shimmer band centred on the
  fusion rate ("where two become one"), so you can creep the whirl by hand and sit exactly at the lock.
- A live felt read — "THE WHIRL: at rest / ● fused · ≈ N turns a second" — a marker, never a number to
  worship.

### The rack + make-your-own (a made, kept thing)
- Four cards: **bird / cage**, **fish / bowl**, **rider / horse**, and **make your own** — a two-face
  drawing desk (palette, sizes, eraser, clear) whose pair persists across reload. Persistence
  round-trip verified byte-identical (canvas dataURL restored exactly from storage).

### In-house art (foundry — FORGED + WIRED)
The four forged engravings were made in-house by the art foundry (K takes → judges → synth) and are
wired ahead of `faces.js` (which prefers them over its placeholder line-art). Specs preserved at
`art-specs/*.md` + `preview-harness.sh` (dev artifacts of the now-closed art round; harness contract
retired — the `window.__THAUM_ART` swap hook was removed when the art landed).
- **`paper.js`** — warm parchment ground under every face. `window.ThaumArt.paper`.
- **`birdcage.js`** — the copperplate songbird + the domed cage it fuses into.
- **`fishbowl.js`** — a warm goldfish + the round glass bowl.
- **`riderhorse.js`** — a rider mounted on the horse's back.

### Payoff-liveness (claim-free twin — the payoff FIRES)
- `window.__THAUM_LIVE()` → `{rest, whirl, fuses}`: the persistence integral covers BOTH faces at a
  fast whirl and ONE at rest (verified `{rest:0, whirl:0.478, fuses:true}`).
- `window.__THAUM_PERSIST.rail(t)` drives the continuous channel headless — `rail(0.9)` → ω ≈ 67.9
  steady → panel "● fused / ≈ 10.8 turns a second". The wind button rings a real damped whirl
  (ω 188 → 131 → −95 → −171 → … , panel fused during the fast phase).

### Estate fit
- Palette `#07080c` ground, `#c9a24a` / `#f4d27a` gold; standard topbar back-link + footer with the
  shared mute idiom; sib-links both ways with The Faithful Drum (topbar + footer). Drops
  `ws:seen:thaumatrope`. Registered as a piece WITHIN the-faithful-drum's room (no new PLACES entry).

### Publisher review (cycle 476)
Fresh-eyes on a served origin: rest state, whirl, rail, and mobile (390-wide, 2×2 rack, no horizontal
overflow) all clean; console clean (only the browser-default favicon 404); all three payoff channels
driven live and confirmed; both drum↔thaumatrope sib-links resolve 200; front-door tally + registry
consistent (`manifest --check` OK, `forge --check --all` all current). No defects. Bloomed.

**Files:** `index.src.html` (→ `index.html`), `faces.js`, `art/{paper,birdcage,fishbowl,riderhorse}.js`,
`art-specs/{pair-birdcage,pair-fishbowl,pair-riderhorse,paper-texture}.md`, `art-specs/preview-harness.sh`.
