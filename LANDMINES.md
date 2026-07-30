# Landmines

Every one of these cost a maker a real debug cycle. Two minutes here saves an hour.
Nothing else is required reading.

### Before you build

- **Grep [HIDDEN.md](HIDDEN.md) first.** There are 21 secrets with no route from the map.
  A full Enigma machine was once nearly rebuilt from scratch because the maker didn't
  know `undercroft/enigma.html` already existed. Also check [INDEX.md](INDEX.md).

### Adding a room to the map (a `PLACES` entry in `index.src.html`)

- **A district can be FULL, and overflowing it kills the entire front door — silently.**
  `Layout.solve(PLACES)` throws at module top level, so `const LAYOUT` is never assigned,
  the map draws nothing, and the door pill reads `✗ 0/1 · 0 STRUCTURES PLACED`. There is no
  console error until you click the pill to re-run. Worse: **`forge --check --all` and
  `manifest --check` both stay GREEN**, because the throw is a runtime one — so `seal.sh`
  will happily ship a dead estate map. It has happened: a room added to the fairground took
  it to 17/16 and the front door was blank for a full cycle before the next maker found it.
- **So: after adding or moving a `PLACES` entry, run `node tools/layout/estate.test.cjs`,
  and then actually open the front door and read the pill.** Neither is optional; the two
  standing checks do not cover this.
- When a district *is* full the error names four honest reliefs. The capacity is not a
  hand-picked number — `Layout.maxCapacityDetached()` (or `FORMATIONS[fn].maxCapacity`)
  computes it from the plate geometry, so "just raise it" is raising a legibility law.
  The cheap one is **GATHER**: drop the `PLACES` entry and let the room become a *piece*
  of an existing room instead. A piece costs no map tile. The mechanism is in
  `tools/manifest/registry.mjs` — a hub owns a piece when the hub's page links it with the
  hub's own first-class class token (e.g. `midway` owns `<a class="ride" href="../X/…">`).
  Add the link, delete the `PLACES` entry, re-derive. Nesting is what the map wants anyway.

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
- **A panel over the canvas eats your pointer test, and it reads as a broken handler.**
  A true CDP click at the exact screen point where your draggable thing is drawn does
  nothing at all if a control card happens to sit over it — the canvas never gets a
  `pointerdown`, the state does not move, and you go and rewrite hit-testing that was
  always fine. The tell is that the OTHER branch (orbit, pan) does not fire either. Pick
  the probe point in clear canvas — `elementFromPoint` will tell you in one line — or
  parameterise the thing you are aiming at and pick a fraction that lands away from the
  chrome. (Cost a debug cycle in The Wake.)
- **Hard-coded pixel targets for your own UI rot the moment you add a button.** A CDP
  click at the coordinates you read off yesterday's screenshot lands on whatever moved
  into that spot — in the Dark Orchard it hit "back to the aisle" (which resets the
  scene) instead of "fly", and the symptom was "my flight code does nothing", twice.
  Ask the page: `getBoundingClientRect()` on the element, aim at its centre, then click.
  One extra `eval` and the test survives every layout change.
  **They also rot DURING a run, from your own clicks.** A button whose label changes
  when you press it ("sand the rail" → "sanding") changes width, which re-centres a
  flex console, which moves every slider beside it by twenty pixels — so the *next*
  drag in the same script silently lands on nothing and the control never moves.
  Re-ask for the rect before every single aim, not once per session. (A four-line
  shell helper that does eval-rect → `pointer.mjs` is the whole fix.)
- **Another browser session on the same machine steals your frame rate.** A forgotten
  `agent-browser --session foo` kept a second GPU context alive and turned a real 65 fps into
  a measured 7. `agent-browser session list`, close the strays, then benchmark.

### Shaders held in JS strings

- **A BACKTICK IN A SHADER COMMENT KILLS THE WHOLE MODULE.** The AudioWorklet form of
  this is already below, but it bites just as hard with a plain WebGL shader library
  kept in a template literal: writing `` `jitter` `` in a GLSL comment ends the
  template early and the page dies with a SyntaxError pointing at a line of prose,
  before your `addEventListener('error')` is even registered — so `window.__err` is
  null and the page just does nothing. Diagnose by extracting the built `<script>` and
  `node --check`-ing it. The Headwaters' twin now asserts its shader library holds no
  backtick.
- **A shader library shared by your VERTEX and FRAGMENT shaders may not touch
  `gl_FragCoord`.** Adding an interleaved-gradient dither to a shadow march is the
  right fix for banding — but if that function lives in the common prelude, the vertex
  compile fails with `'gl_FragCoord' : undeclared identifier` and takes the whole
  renderer with it. Pass the jitter in as an argument. (Asserted in the same twin.)

### GPU / WebGL

- **A HAND-BUILT MESH WITH DERIVED NORMALS AND BACK-FACE CULLING RENDERS A BLACK
  SCREEN, and it does not look like a winding bug.** `cross(b-a, d-a)` on a quad
  points whichever way the vertex order happens to run, and a hall assembled from
  a dozen quads will get some of them backwards — so with `CULL_FACE` on you get
  a completely empty frame with no error, no warning, and a perfectly healthy
  `gl.getError()`. Diagnosing it as "my camera is somewhere wrong" costs a cycle.
  **State the normal instead of deriving it** for anything whose inside you care
  about, cull nothing, and flip the normal toward the eye in the fragment shader
  (`if (dot(N, eye - P) < 0.0) N = -N;`). Then a "this face is only visible from
  inside" rule is one line — `if (dot(N, toEye) < 0.0) discard;` — and it also
  gives you a doll's-house cutaway for free.
- **An interior camera that can leave the room presses a pillar against the lens.**
  An orbit camera around a target inside a hall puts the eye *outside* the wall
  the moment the dolly exceeds the room's half-width. The shell can be cut away,
  but the *fittings on it* — pilasters, rails, lamps — cannot, and one of them
  fills the frame as an unlit black slab that reads as a renderer bug. Two fixes,
  both cheap and both worth having: clamp the eye inside the room in the
  horizontal plane, and discard any non-floor fragment closer than ~0.45 m.
  (A view from *above* is different: let the eye rise, cut the ceiling, and give
  the ceiling's own fittings a material that vanishes when `eye.y > ceiling`.)
- **`gl_PointSize` is a DIAMETER in pixels, and the conversion from a world
  radius carries a factor you will get wrong by 2–3×.** Pixels per metre at
  distance d is `H / (2 d tan(fovy/2))`, so a sprite of world radius r wants
  `gl_PointSize = r * H / (d * tan(fovy/2))`. Guessing it low makes a
  sixty-thousand-particle smoke cloud look like a scatter of dots, and the
  instinct is to add more particles — which does not help, because the problem is
  that each one is a quarter of the size it should be.
- **A particle cloud shaded like a SURFACE goes black wherever the light is
  behind it.** Smoke is a participating medium; giving each sprite a fake normal
  (`normalize(eye - pos)`) and running Lambert on it means every particle whose
  lamp is on the far side gets ambient only. You do not notice from outside the
  cloud — you notice the first time the camera stands *inside* it, and then half
  the plume is a dark grey wedge that looks like a blending bug. Scatter
  isotropically instead: sum `lampColour / (k + r²)` with no dot product at all.
- **Clipping an additive HDR emitter channel-by-channel CHANGES ITS HUE, and the new
  hue is plausible.** An optically thin emitter — an aurora, a flame, a plasma, a
  nebula — outruns a screen by decades, and the moment the brightest channel pins at
  1.0 the others keep climbing: a green arc with a trace of red in it turns *yellow*,
  then white, and it looks like a perfectly reasonable bright aurora rather than a
  tonemapping bug. So you go and re-derive the emission ratios, which were fine.
  Scale all three channels by the same factor instead — `c /= 1.0 + max(c.r,c.g,c.b)`
  — which is exact in hue at every brightness, can never clip, and costs one line;
  then mix a little towards grey at the top if you want the sensor-saturation look.
  (Cost a cycle in The Northern Light.)
- **Drawing a thing THICKER to make it look diffuse also makes it BRIGHTER.** If a
  surface proxy stands in for a volume, its brightness is `emission x thickness`, so
  widening the slab from 0.6 km to 2.8 km silently multiplies that layer by 4.7 and
  the colour balance you spent an hour on is gone. When you spread something for
  looks, hold `gain x thickness` constant — the column emission is what the physics
  handed you and spreading it must not create any.
- **Smoke wants ABSORPTION, not addition.** Accumulate premultiplied radiance in
  RGB and optical depth in A, then composite `scene*exp(-kD) + (rgb/a)*(1-exp(-kD))`.
  Additive blending gives you plasma; this gives you smoke, and it is one line.
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
- **A PURE FRESNEL WATER MODEL SHOWS NOTHING FROM DIRECTLY ABOVE.** At normal incidence
  water reflects about 2%, so a mirror-plus-Fresnel shader renders a plan view of a wake,
  a ripple tank or a pond as flat dead colour — while the same shader looks superb at a
  grazing angle, which is how you ship it without noticing. It is not a bug in the field:
  it is a bug in the optics you chose. A real wake IS plainly visible from a drone,
  because a facet tilted towards a low sun lets more light in and throws more back — so
  give the body colour a `max(dot(n, sun), 0)` term and the plan view comes alive at every
  angle. Any room with a "look straight down" button needs this before that button works.
- **A PERFECT CIRCULAR PISTON HAS EXACT NULLS, AND ONE OF THEM WILL LAND INSIDE
  YOUR FIELD OF VIEW.** `[2 J1(ka sinθ)/(ka sinθ)]²` is the right directivity for a
  mouth, a speaker or a transducer, and it goes to **exactly zero** at sinθ = 3.83/ka.
  For a 7 mm bat mouth at 60 kHz that is 30° off axis — which in a 34°-half-angle
  camera is precisely where the ground three metres ahead is drawn. The result is a
  black screen that looks like a gain bug, an absorption bug or a tonemap bug, and you
  will try all three. Two fixes, both physical: **floor the pattern** (a real aperture
  is not a perfect circle and has sidelobes; −17 dB is generous), and do not use the
  same pattern twice — a two-way system is *emitter × receiver*, and a receiver
  (an ear, a hydrophone) is almost always far broader than the emitter. Squaring the
  piston halves the usable beam and doubles your chances of hitting this.
- **Normalising a drawn field by its MAXIMUM prints a bright speck and a black sea.** The
  steepness of a wake spans decades between the bow and the far arms (the same shape of
  problem as the orb web's 10⁸), so `gain = target / max` exposes for the one hot texel at
  the source and everything a visitor came to look at goes to zero. Reduce the field on
  the GPU, then take a ROBUST statistic on the CPU — a high percentile of the texels
  OUTSIDE a few source radii — and let the shader soft-saturate the overshoot
  (`v *= inversesqrt(1 + (|v|/knee)^2)`). Say on the page that it is exposure, and keep
  every measurement on the raw field.
- **Colouring a field by blackbody magnifies small ripples enormously.** The
  visible-band luminance of a hot body climbs about a decade every 150 K, so a
  *three per cent* ripple in temperature — the sort any solver carries and nobody
  would look at twice on a plot — becomes a **five-fold** ripple in brightness: a
  picket fence of flame that reads as a shader bug, a noise bug, anything but what it
  is. Diagnose by printing a row of the field, not by staring at the picture. The
  cure is a little thermal diffusion (which the gas has anyway).

- **A hand-rolled camera basis is a coin flip, and only HALF your frame tells you.**
  If a full-screen ray-march builds its own `right`/`up` from `fwd` while the
  rasterised geometry goes through a proper `lookAt`, a sign error in `right`
  flips and mirrors the *marched* pass and leaves the *rasterised* one alone —
  so the lightning is right way up and the cloud has fallen to the bottom of the
  sky, which reads as a lighting or density bug for as long as you let it. Check
  it against one case by hand: with `fwd = (0,0,-1)` you must get
  `right = (+1,0,0)` and `up = right × fwd = (0,+1,0)`. (`right = (-fwd.z, 0, fwd.x)`.)
- **In a viscous-membrane / surface-flow solver, curvature belongs in the LOAD, never in
  a denominator.** The tidy closure for a shell pushed by a net traction q is
  `v_n = q / (12 mu t H^2)`, which is exactly right for a sphere and *nonsense* at an
  inflection, where the mean curvature H passes through zero and the speed goes to
  infinity. Any inflating shape grows inflections almost immediately (a blown glass
  parison grows two within a second), and what you see is a hole torn in the shoulder in
  a tenth of a second — at every timestep, so it reads as a mesh or remesh bug and you
  will go and rewrite the remesh. The cure is the exact membrane balance: get the
  meridional tension from a force balance on the cap beyond the station, close it with
  the normal balance for the hoop tension, and invert the plane-stress viscous law for
  the strain rates. Curvature then only ever multiplies. (Bonus: the same tensor law
  hands back both `pR^2/12mu t` for a sphere and Trouton's `sigma/3mu` for a hanging
  tube, so you get a free two-way check.)
- **Laplacian smoothing of a closed curve or surface is MEAN CURVATURE FLOW, and mean
  curvature flow shrinks things.** Reaching for `x += lambda*(neighbour_average - x)` to
  damp mesh noise is nearly free at 0.02 per step and a slow leak at 0.25: it ate a fifth
  of a bubble's diameter over half a minute while every conservation check in the file
  stayed green, because *mass* was never the thing being lost. Regularise the velocity or
  the strain field instead, where the filter has no volume in it, and keep any positional
  smoothing an order of magnitude weaker than feels safe.
- **A minimum node spacing is a tool, not a guard.** Enforcing `u[i] >= u[i-1] + eps`
  along a profile sounds like cheap insurance against a fold. Near a rounded tip the
  meridian runs almost radially and the axial spacing falls as `ds^2/2R` — tens of
  microns — so a 10 um floor is *larger than the real spacing* and silently stretches
  every element there, which thins the wall, which (in any thickness-from-mass scheme)
  runs away. Size the epsilon against the smallest real spacing, not against your idea of
  small: 1e-9 is a guard, 1e-5 is a jack.

- **A refined triangle inherits its parent's HANDEDNESS, and mixed winding cancels your
  normals.** Subdividing a set of triangles barycentrically feels orientation-free, and it
  is — for the maths. But if the parent triangles are not all wound the same way (the four
  half-square types of a polyabolo alternate: right-angle-at-SW is counter-clockwise,
  right-angle-at-SE is clockwise), then two elements meeting along an internal edge hand
  their shared vertices OPPOSING face normals, the accumulation cancels, and the surface
  grows a dark seam along every seam of the original decomposition. It reads exactly like a
  vertex-welding bug, so you go and check the welding, which is fine. One `if (signed area
  < 0) swap` after you build the element list is the whole fix. The eigensolve never
  notices, because a stiffness matrix takes |area|.

- **A LINEAR sampler on a 16-bit number split across two 8-bit channels is not
  interpolation.** Packing a height field as `RGBA8` with the high byte in R and the
  low byte in G is the right way to get 16 bits without a float texture — but the
  hardware then blends R and G *independently*, which is arithmetic nonsense wherever
  the high byte steps. You get a saw-tooth of 1/256 in every slope, and a surface
  shaded by its own gradient turns that into a fine terracing that reads as a mesh or
  quantisation bug. Use `NEAREST` and do the bilinear yourself from four
  `texelFetch`es of the decoded value. (8-bit alone is not an option either: 1/255 of
  a height field is 257× coarser and its normals band visibly.)

- **A stage that frames a shape by its RADIUS puts the visitor inside anything tall.**
  If the camera scale follows the object's extent in the plane and the object can also
  be deep — a snow crystal that is 45 cells across and 500 tall, a column, a spire —
  then the moment you tilt the view the depth swings into the screen's vertical and
  the object bursts the frame. It reads as a runaway simulation, not a camera bug.
  Frame the TILTED extent: `r*|cos tilt| + depth*|sin tilt|`, and take the max against
  the horizontal need after dividing by the aspect ratio.

- **Volumetric marching wants an interleaved-gradient dither**, not an ordered/Bayer one:
  `fract(52.9829189 * fract(0.06711056*x + 0.00583715*y))`, offset per frame by the golden
  ratio. Too-few steps then read as a fine even weave instead of hard rings.

### Sound

- **A truncated LINEAR-PHASE FIR has a stopband floor, and it rings before the
  sound.** Inverse-FFT a desired magnitude, window it, and you get a filter that
  (a) cannot go deeper than its length allows — 127 taps leaked **27 dB** of
  3 kHz through a filter meant to be 90 dB down, and dropped 4 dB it should have
  passed at 50 Hz — and (b) smears energy *earlier* in time by half its length,
  which quietly falsifies any claim about when a sound starts. Both symptoms
  present as "my measurement disagrees with my prediction and I can't see why."
  The cure is a **minimum-phase** design: real-cepstrum fold (log-magnitude →
  IFFT → double the causal half → FFT → exponentiate → IFFT). Causal,
  front-loaded, and the truncation error collapses. `the-thunderhead/core.mjs`
  has it in 20 lines as `minPhaseFIR`.
- **AN ONSET OR TEMPO ESTIMATOR HAS A RATE CEILING, AND PAST IT IT RETURNS A
  PLAUSIBLE NUMBER.** A slipping locomotive fires 15.8 exhaust beats a second;
  `audio-lens --tempo` read **255.7 BPM** (4.3/s — an exact quarter of the truth,
  octave-folded) and its onset detector found **2.8/s**. Neither is a bug in the
  tool and neither is a bug in the sound: the chuffs are 100 ms long, so above
  about eight a second they physically OVERLAP and there are no separate onsets
  left to find (the silence between beats fell from 74 % to 10 %). The trap is
  that you get a confident wrong number rather than a refusal. Always compare the
  measured rate against the count you *fired*; when they part company, say what
  happened to the sound instead of quoting either — here, "the beats merge into a
  roar" is the honest finding, and it is why a driver stops counting a slipping
  engine.
- **A fast-decaying transient has no pitch, and two estimators will confidently
  give you two.** A plucked orb-web radius with the sticky spiral hung on it dies in
  a few milliseconds; a Goertzel sweep called it 912 Hz and `audio-lens` called it
  699 Hz on the *same* samples. Neither is wrong — there is no mode there to find.
  If the estimators disagree by that much, the honest move is to stop quoting a
  number and say what actually happened to the object (in that case: the string was
  pinned every 4.65 mm and stopped being a string). Cross-check any pitch you intend
  to *claim* with a second estimator; agreement is the licence to quote it.
- **If your model says a sound is inaudible, SYNTHESISE SILENCE — never let it
  alias.** A room that slows ultrasound down to hear it has a dial, and at the top of
  that dial the call is back above Nyquist. Rendering it anyway does not produce
  nothing: it folds back into the audible band as a perfectly pleasant tone at the
  wrong frequency, which is a lie with a nice timbre on it and reads as a *feature*.
  Guard on `f_max / N < 0.45 * sampleRate`, go quiet, and put the reason on screen
  ("82 kHz: silent, because it really is"). The silence is the honest output.
- **An AudioContext that never got a REAL user gesture is suspended, and its
  clock does not tick.** So anything slaved to `ctx.currentTime` — an animation
  that follows a playing buffer, a state machine waiting for a sound to arrive —
  freezes solid, with no error. A `.click()` from `eval` does not grant user
  activation (`tools/cdp/pointer.mjs click` does). Two consequences: verify with a
  real click, and give the page a wall-clock fallback so a blocked context
  degrades to silence instead of to a dead room.
- **An `AnalyserNode` with no path to the destination hands back GARBAGE, not
  zeros.** Wired only to a source (`node.connect(analyser)` and nothing after
  it), Chrome never pulls it, and `getFloatTimeDomainData` returns a stale
  buffer that reads a completely plausible ~0.05 rms — the SAME value whether
  the graph is singing, hushed, or muted. That is a measurement rig that agrees
  with you about nothing and tells you so in no way at all. Give it a sink:
  `node → analyser → gain(0.00001) → destination`. Sanity-check any new audio
  measurement rig against a plain `OscillatorNode` first: silence → tone →
  silence should read 0 → 0.14 → 0.
- **A CPU shortcut that skips "silent" voices will silence a band you meant to
  keep.** The Aviary's worklet skipped integrating a voice when its drive was
  below a convenient small number (0.004) — which turned out to be exactly the
  band the room's pitch claim is measured in, so every quiet note was mute and
  the Node twin (which has no such shortcut) stayed green. Gate a skip on a
  bound the MODEL guarantees (here: at or below the Hopf line nothing can
  sound), never on a number that felt small. It took a spectrum analyser on the
  live worklet to find; the twin could not have.
- **A soft limiter never tells you it is working, and it will invent partials.** A
  `tanh` on the master bus is the right safety net — but every mode of a struck object
  starts IN PHASE, so the first sample of a fourteen-mode blow is the sum of all
  fourteen, and that one sample can be deep into the knee while everything after it
  sounds perfectly clean. The Drum Twins' own ear panel peak-picked **22** partials out
  of a fourteen-mode model and they were all reproducible in both drums, which made them
  look like physics. They were intermodulation products of my own limiter. Report the
  master-bus PEAK next to any spectrum you measure, and bound the excitation at the
  source (that room now asks each drumhead, over every node of its mesh, for the loudest
  blow it can take, and makes that full scale).

- **Your own page can fight your measurement.** The Aviary's dawn timer
  re-activates the birds every third of a second, so a console probe that
  hushed the wood found it singing again a moment later and spent an hour
  hunting a phantom oscillator. Any page with an autonomous loop needs a way to
  hold it still while something measures it (`earBusy` there).

### The DOM

- **Transferring a typed array to a Worker DETACHES it, including any reference you
  kept.** The buffer-recycling pattern (worker posts a snapshot, page uploads it to
  the GPU, page posts it back with a transfer so the worker can refill it) is right and
  fast — but if the renderer also stashed that array as its CPU copy for ray-picking,
  the copy is now length 0. Nothing throws: `pick()` simply never hits anything, and
  clicking the world does nothing at all. Copy into your own array in the uploader.

- **A `<canvas>` inside `display:none` has `clientWidth === 0` and draws
  nothing, silently.** Reveal the panel FIRST, then plot into it. There is no
  error, no warning, and the canvas is the right size the moment you go looking.
- **Nearest-thing hit-testing lies when the clickable things have different
  *dimensionality*.** Picking "whichever primitive is closest" is only fair when
  they are alike. In the Orb Weaver the sticky spiral is effectively a *surface*
  (turns 4.65 mm apart, so no point is more than 2.3 mm from one) while a radius is a
  *line* — so nearest-segment handed the 32 radii about a quarter of the web, and the
  first real click meant to drop a fly plucked a string instead. It looks like a
  physics bug and it is a geometry bug. Give the line-like thing a small aim
  tolerance in **screen pixels** and let the surface take everything else, then show
  a hover label naming what the click will hit. (Doubles as the fix for "my
  interaction feels random".)
- **Your first `requestAnimationFrame` dt can be NEGATIVE, and a throw inside a rAF
  callback silently ends your animation.** The timestamp rAF hands you is when the
  *frame began*, which can be earlier than a `performance.now()` you took while the
  module was still evaluating — so `now - last` comes out below zero exactly once, on
  frame one. That is enough to walk a path parameter to −1, index `pts[-1]`, and throw
  — and because the throw happens before the line that schedules the next frame, the
  loop just stops. Nothing renders, no error reaches the console you are looking at,
  and the page looks like it never started. Clamp dt at BOTH ends
  (`Math.max(0, Math.min(0.05, …))`), and when a loop mysteriously does not run, add
  `addEventListener('error', e => window.__err = e.error.stack)` before you guess.

### Simulation

- **A cellular rule that reads its neighbours' state must not also WRITE that state in
  the same pass.** It is obvious written down and invisible in code: the attachment
  test counted attached neighbours, and the same loop set `attached = 1` on cells it
  had already judged — so the rule depended on the order the array happened to be
  walked. The symptom was not a crash and not garbage: it was a lattice that is exactly
  six-fold symmetric on paper coming out with six *slightly different* arms, which
  looks exactly like the noise term doing its job. Collect the changes and apply them
  after the pass. Then pin it: grow with the noise at zero and require the field to
  equal itself rotated by a symmetry of the lattice **exactly** — largest disagreement
  0, not small. That check caught the same bug a second time when a per-cell growth
  term crept back into the judging pass (disagreement 0.0069).

- **A force-balance identity needs SIGNED lift and ONE orientation, and the orientation
  is the course, never the bow.** The sailing "course theorem" (β to the apparent wind =
  the air's drag angle + the water's) is exact whenever two force vectors are opposite —
  and it missed by up to 135° on states the same code proved antiparallel to a part in ten
  billion. Two separate causes, both of which look like a physics bug. (a) `atan(D/|L|)`
  is the line every textbook prints and it silently folds a lift that has changed sides —
  a backed sail, a hull slipping the other way, anything near a dead run — onto the wrong
  branch; keep the sign and use `atan2(D, L)`, which lands in (0, π). (b) The two angles
  must be measured off perpendiculars on the **same** side, and the side that matters is
  the side of the **course** the flow comes from, not the side of the **hull**. Those are
  opposite the moment the craft is moving backwards, which a drag device pointed at the
  wind does all day. The tell is that the residual `|F1+F2|/|F1|` is tiny (the state IS
  in balance) while the identity is nonsense — if your balance is good and your identity
  is not, the bug is in a sign or an axis, never in the solver.
- **A "STEADY STATE" THAT IS STILL DRIFTING MEASURES YOUR DRIFT, NOT YOUR CLAIM.** A
  locomotive's exhaust beats should be perfectly even; mine measured 5.4 % spread and
  the deliberately-mis-quartered control 16 %, which is a feeble separation and I
  nearly loosened the tolerance to accept it. Nothing was uneven: the train was still
  accelerating, and a monotonic 10 % drift across the window has a standard deviation
  of about 3 % all by itself. Two fixes, and take both: **hold the operating point
  with a control the model already has** (a proportional loop on the brake — it is
  scaffolding, not physics, and the solver never learns about it), and **measure the
  property you actually mean**. "Limping" is the ALTERNATION between one gap and the
  next, mean |g[i] − g[i−1]|, which is blind to any smooth drift. The separation went
  from 5.4 vs 16 % to **0.45 vs 30.5 %**.
- **Converge a steady-state solver on the BALANCE, not on the speed.** Watching the
  output stop changing is the obvious stopping test and it is the wrong one: near a
  degenerate operating point one variable can be flat to a part in ten million while
  another is still creeping, and every one of those states then passes your "settled"
  gate and fails whatever you check next. If the thing you are converging to is a force
  balance, converge on `|ΣF| / |F|` — it is zero at the answer by definition, it costs
  nothing to compute, and it doubles as the honest "is this row usable" flag for callers.

- **AN OSCILLATORY INTEGRAL WANTS THE SAMPLING VARIABLE THE PHASE IS WRITTEN IN.** A
  Kelvin wake is one integral over wave direction θ, and its phase carries κ = sec²θ — so
  at 70° a step in θ moves the phase eight times further than the same step at zero, and
  out at the rim of the picture the integrand swings ~1800 radians per radian. Uniform-θ
  needs tens of thousands of samples to stay under Nyquist and shows a *plausible* wrong
  answer below that (46% off at the rim, and it just looks like a slightly different
  wake). Substitute u = tan θ — du carries exactly the sec² the phase does — and 800
  samples are converged to 0.001%. Before you buy more samples, check whether the
  integrand has a natural variable.
- **Normalising by the peak QUADRATURE WEIGHT makes your whole field scale with N.** The
  obvious tidy-up after building a sample list is to divide the weights by the largest of
  them — but `A(θ)·dθ` shrinks as 1/N, so that division silently multiplies the answer by
  N. Every value is wrong by a factor that is constant across the picture, so the picture
  looks fine and only a convergence test catches it — and it catches it as "the quadrature
  is 50% off at N = 6000", which reads as a sampling problem and sends you to fix the
  sampling. Normalise by the peak of `A` itself, a number that does not know how many
  samples there are.
- **A field with a fixed outer boundary far from the action is a sealed jar.** A
  diffusion box initialised full of vapour, with the reservoir pinned only at the wall
  of the array, does not respond to the outside conditions at all: the crystal is
  eating the vapour that was already in the box, and the diffusion time from the wall
  is the box radius *squared*. Every crystal came out identical at every
  supersaturation and they all looked plausible. Put the reservoir on a ring that
  FOLLOWS the growing object out (a boundary-layer thickness away), which is also the
  physical picture.

- **A VORTEX FILAMENT WANTS OPPOSITE THINGS FROM ITS NODE SPACING, and the cure is
  two resolutions, not a compromise.** Accuracy wants the spacing h far below the
  regularisation length δ, because a chord is straight and the curve is not — at
  h = δ a 64-gon ring translates 4.9% under Kelvin. Stability wants h ≥ δ, because
  the discrete curve carries bending waves shorter than the core, which are
  physically meaningless and *violently* unstable: a perfectly circular 160-node
  ring here sat still for 0.2 s and then exploded to four times its radius, at
  every time step tried, from nothing but roundoff. Neither more nodes nor a
  smaller dt is the answer. **Keep the degrees of freedom coarse (h ≈ δ) and
  integrate over a SPLINE through them, sampled several times finer** — accuracy
  of a 256-gon, stability of a 64-gon. And then band-limit the node velocity, not
  the positions (a positional smoother is curve-shortening flow, which shrinks
  things): a spectral low-pass that is exactly the identity below the cutoff is
  provably inert on every claim that lives in the low modes, and you can *prove*
  that in the twin instead of hoping.
- **The physical validity bound may not be tight enough, and saying so is the
  honest move.** The thin-filament model's own limit (no wavelength shorter than
  the core's circumference) gave a cutoff of mode 10 here; at 10 the ring is quiet
  for 2.2 s and then goes, at 4 for 4 s, at 3 it is exact after five seconds. So
  the room uses 3 and *says on the page* that it is tighter than the physics
  demands. A number chosen for stability and dressed up as a derived one is the
  thing to avoid, not the tighter number.
- **A straight segment's softened Biot–Savart integral has an elementary
  antiderivative — use it instead of sampling.** With `D² = |r⊥|² + δ²`,
  `∫ ds/(D²+u²)^{3/2} = u/(D²√(D²+u²))`. Midpoint-sampling the same segments cost
  7% of the ring's speed at the room's own resolution, and the fix was not more
  samples; it was doing the one integral that has an answer.
- **A LANDSCAPE-EVOLUTION solver must be handed the ELEVATION ORDER it is already
  computing.** The implicit stream-power sweep needs cells downstream-first, the
  drainage accumulation needs them upstream-first, and the obvious way to get either is
  to sort 65,536 cells by height every step (~8 ms in a comparator sort, which is most
  of your frame). You do not have to: **priority-flood pops cells in non-decreasing
  filled height and a cell's filled height is final at the moment it is pushed**, so
  the pop sequence IS the order, for free. Recording it turned a 21 ms step into 8 ms.

- **A DISTRICT ON THE FRONT-DOOR MAP CAN BE FULL, and it will tell you so at run time,
  not at build time.** `Layout.solve()` throws a long, kind error ("promenades is AT
  CAPACITY (8/7) — four honest reliefs…") and the door pill goes red with *0 structures
  placed*, which reads like you broke the map. You did not; you asked for an eighth
  seat in a crescent whose honest geometric ceiling is seven (`node
  tools/layout/formations.js` prints every district's ceiling). Either seat the room in
  a district with headroom or take one of the four reliefs — never nudge the capacity
  number. And after moving a room between districts, **re-run
  `node tools/manifest/manifest.mjs` and re-forge**, or the door's twelfth claim fails
  with "promenades register 8 ≠ 7 declared" from the stale tallies you baked in.

### Solvers with constraints in them

- **A massless node is a CONSTRAINT, and no diagonal preconditioner will save you.**
  A triple junction in a soap foam has no inertia — it is an instantaneous force
  balance, which is what "120 degrees" means — so its row of the implicit system is
  exactly weakly diagonally dominant. Give it a mass instead and the physics goes
  wrong (the corners lag and the measured law came out a fifth shallow); set the mass
  to zero and CG needs 400 iterations, and *capping* the iterations does not merely
  slow the room, it changes the answer (the fitted constant fell 30%). Block-Jacobi
  over the obvious blocks bought almost nothing. The fix is to **eliminate the easy
  half exactly**: whatever part of your graph is a PATH has a tridiagonal block that
  Thomas's algorithm inverts in two sweeps, and the Schur complement over what remains
  is small and nearly diagonal — ten iterations instead of four hundred, 21 ms/step to
  1.1. (`the-washhouse/foam.mjs`, `solveSchur`.) The trap inside the trap: an edge
  short enough to hold no interior node joins two junctions DIRECTLY, so it never gets
  eliminated and must stay as an off-diagonal of the reduced system. Forgetting that
  case reads a stale scratch value with no error at all.
- **Refining one knob is a cancellation study, not a convergence study.** If a scheme
  has two discretisation errors of OPPOSITE sign — here a coarse mesh reads a
  junction's tensions off chords and comes out steep, a long time step lags the lengths
  and comes out shallow — then halving the mesh alone makes the answer *worse* and
  halving the step alone makes it worse the other way, while the un-refined pair looks
  excellent. Refine both together and quote the ladder.
- **A chord is not a tangent, and at a corner that is the whole error.** Any force
  assembled from unit vectors to a node's nearest neighbours (a Herring balance, a
  discrete curvature) is built from chords, and a chord leans off the true tangent by
  about half the turning it spans — kappa*h/2, which is five degrees at an unremarkable
  spacing. Crowding the mesh toward the corner (a raised-cosine spacing map) cost
  nothing and removed the single largest error in the room.

### Estate-wide conventions

- **A wing slug must be DECLARED, or the front door goes red with no error you can
  find.** Adding a new `wing:"…"` to a PLACES row that the district's contract does not
  list turns the door pill red with *0 structures placed* and nothing in the browser
  console (the throw is caught and shown only in the pill's subtitle). The legal
  cluster list per district lives in `tools/layout/contract.js` (plus a label/accent in
  the same file). `node tools/layout/door.test.cjs` names the fault in one line — run
  it after any PLACES edit, before you go hunting.

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
