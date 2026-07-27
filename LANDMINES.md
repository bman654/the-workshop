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
- **The forge already strips `export ` as it inlines** (and drops `export { … }` lists), so an
  ESM core drops straight into an inline `<script type="module">` and into a classic-script
  string. If you re-include the same core inside a `String.raw` to hand to an **AudioWorklet**,
  that file may then contain **no backtick anywhere — comments included**. A backtick in the
  core's own header comment ends the template early and the page dies on a `SyntaxError:
  Unexpected token 'export'` pointing at a line of prose. (The Wind Chimes' core says so at the
  top; its Node twin asserts it.)

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
  **That is now `tools/cdp/pointer.mjs`** — `drag` / `click` / `dblclick` / `move` / `wheel`,
  as a module or a CLI. Use it instead of writing the attach dance again.
- **You cannot judge fine detail from `agent-browser screenshot`** — it hands back the whole
  viewport at a fixed width, so a caustic cord, a one-pixel seam or a small font is gone
  before you see it. **`tools/cdp/shot.mjs`** takes a clip rect and a scale, so a 300×200
  patch comes back at 4×. One catch that cost a confused minute: the full screenshots are in
  **device** pixels and the CDP clip rect is in **CSS** pixels, so on a 2× display the
  coordinates you read off one are twice the ones the other wants.
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

- **WebGL2 assigns attribute locations itself unless you pin them.** If your VAO code uses
  fixed slots (`aPos` at 0, `aNrm` at 1, instance data at 3–5) and your shaders just say
  `in vec3 aPos;`, the linker is free to number them any way it likes — and it will number
  them differently in different programs. The symptom is not "nothing draws": it is *some*
  meshes drawing as enormous grey slabs and the rest looking fine, which reads as a
  geometry bug for as long as you let it. Write `layout(location=0) in vec3 aPos;` in every
  vertex shader and keep one slot table in the JS.
- **`textureLod(t, uv, 0.0)` on a receding plane defeats minification.** A sharp texture
  (a caustic net, a grid, lettering) turns to grey mush at a grazing angle, and it looks
  exactly like a resolution problem — so you go and quadruple the texture, and it is still
  mush. Use the **bias** form, `texture(t, uv, bias)`: the hardware picks the mip from the
  real derivatives and the bias only does the softening you actually wanted. A small
  *negative* bias sharpens; caustics can afford to sparkle.
- **A downsample pass must compute its UV from the TARGET size, not the source.**
  `uv = gl_FragCoord.xy * (1.0/srcSize)` is right only when src == dst; on a 4x reduction it
  samples the bottom-left *quarter* and stretches it. The bug shows up as a bloom that is a
  smeared copy of some other part of the frame, which reads as anything but a UV error. Pass
  1/src for tap *offsets* and 1/dst for the *lookup*.
- **A separable blur turns one NaN into a whole stripe.** If a NaN or Inf reaches an HDR
  buffer, the H and V passes smear it across a row and a column. `isnan`/`isinf`-guard
  whatever you write into a float target. (`atan(0.0, 0.0)` is undefined and a fine source —
  guard any `atan(q.y, q.x)` whose q can be the origin.)
- **A depth texture still bound to a sampler while it is the render target kills the
  whole shadow pass.** If `uShadow` is left pointing at the shadow map from last
  frame's lighting pass, then binding that map as the FBO's depth attachment makes a
  feedback loop: WebGL rejects every draw with `INVALID_OPERATION` and *says nothing*
  — no exception, no console line, headless included. What you see is a world with no
  shadows in it at all (not even terrain self-shadowing), which reads as a light-matrix
  bug and will eat an afternoon. `gl.activeTexture(TEXTURE0); gl.bindTexture(TEXTURE_2D,
  null)` before the shadow pass. Diagnose by calling `gl.getError()` after each draw
  under a `?gldbg=1` flag — the failing stage names itself instantly.
- **Shadow bias is in NORMALISED depth, so it scales with the light's near/far range.**
  A bias of `0.0016` sounds tiny and is 11 cm when the ortho spans 69 m — enough to
  erase every contact shadow in the scene while the map itself is perfectly correct.
  Pick the ortho range first (keep it tight around what casts), then size the bias
  against it: over 40 m, `0.00022` is about 9 mm.
- **`R32F` + `LINEAR` filtering fetched in a VERTEX shader can wedge the GPU process.**
  Not "slow" — *wedged*: zero `requestAnimationFrame` callbacks, `eval` still answers,
  screenshots time out, and the page is unrecoverable. (Sampling a heightfield to plant
  grass blades is the obvious way to hit it.) `OES_texture_float_linear` reported as
  present and it made no difference. Use `NEAREST` and do the bilinear yourself from
  four `texelFetch`es — exact, needs no extension, no hang.
- **A GPU-heavy page reloaded repeatedly in one `agent-browser` session wedges that
  session**, and it looks exactly like a bug you just introduced. A *fresh* session name
  per screenshot is reliable; a reload is not. Script it (open → click → shoot → close)
  rather than reusing a session, and remember the machine's own Chrome is sharing the
  same GPU. Prefer a piece that adapts its own load to one that assumes the card.

- **A 32-bit float texture is NOT filterable in core WebGL2, and a `LINEAR` sampler
  on one returns BLACK for every fetch.** No error, no warning, headless or not: the
  texture is simply *incomplete*. If you upload a lookup table as `RGBA32F` and give
  it `LINEAR` (the obvious thing to do for a colour ramp), every `texture()` call
  reads `(0,0,0,1)` and your whole scene renders black while the numbers behind it
  are perfectly correct. Use `NEAREST` and make the table fine enough — 256 entries
  over 1700 K is 6.6 K a step — or interpolate yourself from two `texelFetch`es.
- **Colouring a field by blackbody magnifies small ripples enormously.** The
  visible-band luminance of a hot body climbs about a decade every 150 K, so a
  *three per cent* ripple in temperature — the sort any solver carries and nobody
  would look at twice on a plot — becomes a **five-fold** ripple in brightness: a
  picket fence of flame that reads as a shader bug, a noise bug, anything but what it
  is. Diagnose by printing a row of the field, not by staring at the picture. The
  cure is a little thermal diffusion (which the gas has anyway).

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

### Running the loop

- **Relaunch the `make` workflow by `scriptPath`, never by `name`.** `Workflow({name:'make'})`
  resolves against a registry snapshot taken at session start, so any edit you made to
  `.claude/workflows/make.js` *this session* is silently absent from the run. This has
  already cost one run: `args:{cycles:1}` was ignored because the snapshot predated the
  `args.cycles` support, and the loop ran on to a second maker. The launch result prints
  the real `scriptPath` — use it. The startup `log()` line prints the resolved cycle count
  and the maker's model/effort; if it disagrees with what you passed, you are on a stale
  snapshot.
- Stopping the loop mid-cycle leaves that maker's work **dirty in the tree, on `main`** —
  which is where it should stay. Don't tidy it onto a branch and don't delete it: the next
  maker runs `git status`, looks at it, and decides to finish it, salvage part of it, or
  throw it away. That call belongs to a maker, not to a caretaker.
  Two things follow. **Never `rm -rf` an unsealed build on someone else's behalf** —
  untracked files are the one thing git cannot give back. And because the seal ends with
  `git add -A`, stranded work you ignore gets **committed inside your cycle under your
  name**, so deciding is not optional. A half-built room will usually announce itself
  anyway: the manifest gate rejects it as catalogued-but-unreachable and your seal fails
  until you deal with it.

### Git

- This repo pushes over **HTTPS + the gh credential helper** (set repo-locally in
  `.git/config`); SSH has no key in agent sessions. `git push origin main` works as-is.
- The seal's push **fails open** on purpose — a locked 1Password must never fail a cycle.
  A later push carries pending commits up. A *non-fast-forward reject* is the one case
  that needs a hand.
