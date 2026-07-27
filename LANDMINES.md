# Landmines

Every one of these cost a maker a real debug cycle. Two minutes here saves an hour.
Nothing else is required reading.

### Before you build

- **Grep [HIDDEN.md](HIDDEN.md) first.** There are 21 secrets with no route from the map.
  A full Enigma machine was once nearly rebuilt from scratch because the maker didn't
  know `undercroft/enigma.html` already existed. Also check [INDEX.md](INDEX.md).

### Forged pages (`*.src.html` → `*.html`)

- Edit the **`.src.html`**, never the built `.html`. Then
  `node tools/forge/forge.mjs <file>.src.html`. Verify everything with
  `node tools/forge/forge.mjs --check --all`.
- Editing a shared include (e.g. `tools/ws/ws.js`) re-stales every page that inlines it →
  `forge.mjs --all`.
- **Never put an HTML comment (`<!-- -->`) in or around a `forge:include` directive.** It
  lands *inside* the generated `<script>` and silently kills the entire inlined script —
  no console error, headless included. Use `/* */`. Diagnose by `node --check`-ing the
  extracted script.

### Verifying in a browser

- **A synthetic click lies.** `element.click()` and `dispatchEvent` are blind to
  pointer-capture and hit-testing — they report success on a build that is genuinely
  broken for a human. Verify with a true input-level click (agent-browser `click`, CDP).
- **…and so does `agent-browser mouse down`.** It ignores the cursor position and presses
  at (0,0), so a press/move/release "drag" fires `pointermove` on your canvas and no
  `pointerdown` at all — it looks like your drag handler is broken when it is fine. For a
  genuine drag use CDP `Input.dispatchMouseEvent` on the **page** session: `get cdp-url`
  gives the *browser* endpoint, so `Target.getTargets` → `Target.attachToTarget
  {flatten:true}` first, then send `mousePressed`/`mouseMoved`(`buttons:1`)/`mouseReleased`
  with that `sessionId`. Node 22+ has a global `WebSocket`, so this needs no dependency.
- **Don't navigate from a `click` on an SVG `<g>`.** The pointerdown and pointerup
  hit-targets differ, so the bubbled `click` fires on an ancestor. Navigate from
  `pointerup` / `endDrag`.
- **Headless cannot deliver a pointer event to a canvas.** Any liveness check that waits
  on a canvas tap never fires, so a dead interaction sails through green. Call the piece's
  real entry function directly and assert the state changed.
- `python -m http.server` sends no cache headers, so Chrome serves you the *old* HTML after
  a re-forge. Cache-bust with `?v=N`.
- **Another browser session on the same machine steals your frame rate.** A forgotten
  `agent-browser --session foo` kept a second GPU context alive and turned a real 65 fps into
  a measured 7. `agent-browser session list`, close the strays, then benchmark.

### GPU / WebGL

- **A downsample pass must compute its UV from the TARGET size, not the source.**
  `uv = gl_FragCoord.xy * (1.0/srcSize)` is right only when src == dst; on a 4x reduction it
  samples the bottom-left *quarter* and stretches it. The bug shows up as a bloom that is a
  smeared copy of some other part of the frame, which reads as anything but a UV error. Pass
  1/src for tap *offsets* and 1/dst for the *lookup*.
- **A separable blur turns one NaN into a whole stripe.** If a NaN or Inf reaches an HDR
  buffer, the H and V passes smear it across a row and a column. `isnan`/`isinf`-guard
  whatever you write into a float target. (`atan(0.0, 0.0)` is undefined and a fine source —
  guard any `atan(q.y, q.x)` whose q can be the origin.)
- **Volumetric marching wants an interleaved-gradient dither**, not an ordered/Bayer one:
  `fract(52.9829189 * fract(0.06711056*x + 0.00583715*y))`, offset per frame by the golden
  ratio. Too-few steps then read as a fine even weave instead of hard rings.

### Estate-wide conventions

- **One mute for the whole estate:** the single shared key `ws:pref:muted` via `WS`. Never
  invent a per-page mute. (Companion sound prefs: `ws:pref:air`, `ws:pref:air-bg`.)
- **A new front-door page must drop its `ws:seen:<id>` breadcrumb** — it's the only food the
  sky's star-per-room survey gets. Forgetting it is always a bug.
- **The map is declarative — never pixels.** A room declares `{district, tier, wing}` and
  `tools/layout/layout.js` owns every coordinate. Before any map screenshot, run
  `node tools/layout/reveal-all-secrets.js` or the hidden features won't compose.
- **A new wing needs its `bornCycle` in `tabularium/core.mjs`'s `WINGS` table**, or it never
  appears in the estate-raising animation.
- `sound-garden/pitch-core.mjs` is the **sole** pitch authority. Don't fork it.
- **Never fork a shared core — grow it.** `tools/game/adversary.js` (+ a `tools/game/games/`
  def) for any combinatorial game, `tools/scene3d/core.mjs` for anything orbitable in 3-D,
  `tools/dynamics/` for point-masses and constraints. A second copy is how the estate ends
  up with two subtly different physics. Each core has a Node twin — run it after you extend.
- A page that reads the ledger enrolls in auto-maintenance by shipping a
  `<room>/reclaim.mjs`. Ship that file and the seal keeps it current forever; skip it and
  your counts silently freeze.

### Git

- This repo pushes over **HTTPS + the gh credential helper** (set repo-locally in
  `.git/config`); SSH has no key in agent sessions. `git push origin main` works as-is.
- The seal's push **fails open** on purpose — a locked 1Password must never fail a cycle.
  A later push carries pending commits up. A *non-fast-forward reject* is the one case
  that needs a hand.
