export const meta = {
  name: 'gate-foundry',
  description: 'Generic gate asset foundry: per-asset K-takes -> judges -> synthesize+build-final (sequential)',
  phases: [
    { title: 'foundry', detail: 'build each asset in args: K takes -> judges -> synth into the live worktree' },
  ],
}

// args: LEGACY = an array/string/comma-list of LIB asset KEYS (gateRoot defaults to the original
// worktree). NEW = { gateRoot:'<repo root holding the-gate/>', build:[keys] } — so the harness runs
// against the MERGED gate (creative-space/the-gate) as well as the original ${GATE}.
let _raw = args
if (typeof _raw === 'string') {
  try { _raw = JSON.parse(_raw) } catch (e) { _raw = _raw.split(/[,\s]+/).filter(Boolean) }
}
const GATE = (_raw && !Array.isArray(_raw) && _raw.gateRoot) || '/tmp/gate-worktree' // gate source root (holds the-gate/, tools/, ledger/)
const KEYS = Array.isArray(_raw) ? _raw : (_raw && Array.isArray(_raw.build)) ? _raw.build : []

// ── shared prompt fragments ─────────────────────────────────────────────────
const LEDGER = `
LEDGER POLICY (optional, ONCE): If this work felt meaningful you MAY sign the build ledger
by writing ONE json file to ${GATE}/ledger/inbox/<name>-the-gate-<unixts>.json
with EXACTLY: { "cycle": 720, "role": "<BASE_ROLE> · the-gate", "name": "<a fresh maker name>",
"koan": "<one sentence>", "ts": "<run: date -u +%Y-%m-%dT%H:%M:%SZ>" }. Build it with jq.
Sign AT MOST ONCE; do NOT collate; do NOT touch any other ledger file; pick a name not
already in that inbox. Optional — skip if it doesn't feel earned.`

const GUARDRAILS = `
HARD GUARDRAILS (a violation fails the take):
- Edit ONLY the one module file named below, and within it ONLY your target draw fn (plus new
  private helpers you add). Leave every sibling draw fn + shared helper BYTE-IDENTICAL. Never
  edit the boot (the-gate.src.html), colormap.js, scene.js, ROADMAP.md, or any other file.
- NEVER run collate.sh or the fun-forever loop. Never move/rename files. Stay inside /tmp
  except for the READ-ONLY sources named. Test only on the SERVED origin (the helper), never file://.`

const IDIOM = `
THE ESTATE IDIOM (match exactly):
- BRASS = dark body rgba(11,14,22,.85) + brass STROKE var(--brass-stroke-ref,#9c8350) ~1.4px
  + a warm glow (drop-shadow 0 0 8px rgba(201,162,74,.4) or the shared #glow-soft filter)
  + brass-bright TOP-edge highlights var(--brass-bright-ref,#cdb375) on UP-facing edges.
  NOT a flat fill, NOT a gradient sheet (gradient material is WRONG and will be rejected).
- LIT FROM ABOVE: brightest sheen on each shape's TOP edge; shadows fall down/forward; keep
  it consistent with the rest of the frame (the gate is already built this way).
- PALETTE roles via the dash -ref alias with a NIGHT-value fallback. Swappable surfaces use
  their role; EMISSIVE (lit windows) use var(--window-lit-ref,#ffcf73). NEVER hardcode a body
  color for a swappable surface. NO color-tinting filters (hue/saturate/brightness) — color
  comes ONLY from palette roles. You MAY add your own blur/feather filters for craft.
- RESTRAINT: a single illustrated estate frame, considered, not a sticker sheet.`

const ANIMATION = `
AMBIENT ANIMATION (SPEC §2.5.5 — allowed + ENCOURAGED where it fits the subject):
- If motion expresses what this thing IS, animate it — a ripple tank ripples, an orrery
  turns, a flame flickers, a pendulum swings, a fountain falls, an escapement ticks, a
  screen scans, a forge pulses. Many reps want this; reach for it when it deepens the read.
  A STATIC asset is still perfectly valid — animate only when it genuinely serves the room,
  never decoration for its own sake.
- MECHANISM: prefer self-contained SMIL on your asset's own <g> — el('animate',{...},g) /
  el('animateTransform',{...},g) with repeatCount:'indefinite' — so it loops with NO JS tick
  and needs no Phase-D engine. (To scale/rotate about a point, nest a transl(origin) <g> and
  animate the child; use vector-effect:'non-scaling-stroke' to keep strokes crisp under
  scale; clip to the asset on an UNTRANSFORMED wrapper. See drawRepRipple for a worked
  example.) If you need a parametric drive, publish a handle on S.refs instead.
- CONSTRAINTS (all MUST hold): motion stays QUIET + secondary (never pulls focus from the
  hero gate, never jitters/strobes); preserves lit-from-above every frame; no color-tinting
  filter; loops seamlessly; costs ~nothing (a handful of nodes, not hundreds); and degrades
  under prefers-reduced-motion (gate non-essential loops behind a reduced-motion check, the
  .gnomon-hint pattern in the-gate.src.html, or make them pausable via the published ref).
- RENDERING IT: headless --virtual-time-budget does NOT advance SMIL. To SEE your motion,
  add &smil=<seconds> to the render query — it pauses the clock and seeks to that phase. If
  you animate, render 2-3 phases across one loop period (e.g. smil=0, smil=<period/3>,
  smil=<2*period/3>) and view them so you can judge the motion, not one frozen frame.`

const INTERFACE_BUILDINGS = `
INTERFACE CONTRACT (scene-buildings.js module fns):
- Start FROM the current module file. ELEVATE THE ART of your target fn only; do NOT
  re-architect, rename, or change its signature. Keep the assignment form + name exactly
  (e.g. B.drawManor = function (parent, S) { ... }).
- Use S.el(name, attrs, parent) and S.group(id, parent) for ALL svg creation; append into the
  given parent <g>. Keep the dual-use module guard line at the end (forge strips it).
- These building fns publish NO animation refs (refs are the gate's job) — do not add any.
- Validate JS syntax: node --check <module file> BEFORE rendering. A blank/garbled render = a
  JS error; fix it (balanced parens/braces, no stray export, valid SVG attr names).`

const INTERFACE_SCENE = `
INTERFACE CONTRACT (scene.js INTERNAL helper fns — read carefully, this file is large):
- Start FROM the current scene.js. ELEVATE THE ART of ONLY your target fn(s); do NOT rename or
  change signatures. Keep the exact form, e.g.  function drawTrees(parent) { ... }  (these are
  module-INTERNAL helpers taking (parent), NOT the cross-module (parent, S) form).
- Use the SAME module-internal helpers the existing code uses — el(name, attrs, parent),
  group(id, parent), resolvedRole(role), dashName(role), litRegionPath(...) — exactly as the
  current fn does. Do NOT switch to S.el/S.group. Append into the given parent <g>.
- LEAVE EVERY OTHER FUNCTION IN scene.js BYTE-IDENTICAL. scene.js also holds the build()
  orchestration, the colormap var plumbing, buildDefs, the moon/sun/asterism, drawGrounds,
  drawRoomRep/drawCairn, the undercroft predicate, dashName, etc. — touch NONE of it. Keep the
  module guard line at the end.
- Validate JS syntax: node --check the-gate/scene.js BEFORE rendering. A blank/garbled render =
  a JS error; fix it (balanced parens/braces, no stray export, valid SVG attr names).`

function ifaceText(a) { return a.iface === 'scene' ? INTERFACE_SCENE : INTERFACE_BUILDINGS }

// ── the asset library (from SPEC §4) ────────────────────────────────────────
const LIB = {
  manor: {
    key: 'manor', title: 'the grand manor — the DESTINATION, seen through the gate bars',
    tier: 'HERO', K: 4, judgeK: 2, module: 'the-gate/scene-buildings.js', drawFn: 'B.drawManor',
    siblings: 'drawMist, drawHillAndObservatory, drawGreenhouse, and the shared litWindow(S,parent,x,y,w,h) helper (you MAY CALL litWindow, but do NOT modify it)',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §4.1 — keep art inside this box):
- bbox x512..1088 / y340..472. Main block x606..994 y352..472; flanking wings out to x512 & x1088;
  central clock tower rising to y340. Base-center anchor (x800, baseY 472) sits ON the horizon (y470).
- Flat front-elevation, DISTANT. It almost fills the gate opening (x472..1128) with a small margin
  inside the piers. The visitor sees it THROUGH the wrought bars when closed, and FULLY when the
  gate opens — it is the grand destination, the focal point of the whole scene. It must DOMINATE
  as the most important building (bigger/grander than the greenhouse + observatory).`,
    brief: `ART BRIEF: a grand pale Victorian/Georgian country manor. Mansard or hipped main block,
hip-roofed flanking WINGS, a central CLOCK TOWER (with a lit clock face + pip). Candle-warm lit
windows in a regular grid (≈2x6 on the main block + ≈8 across the wings) + a lit central door.
Pale dressed-stone walls, slate roof, brass-bright top-lit eaves/cornice + window lintels. Reads
as stately, symmetric, a little magical at night when the windows glow. Fresh hand-drawn
front-elevation — NOT a top-down floorplan.
ROLES: manor.wall, manor.roof, manor.trim, brass.stroke, brass.bright (swappable).
EMISSIVE: window.lit (the window grid + door + clock face + clock pip + wing windows).`,
    judgeFocus: `Does the manor DOMINATE as the grand destination (grander than greenhouse/observatory)?
Is it a believable stately front-elevation (mansard block + wings + clock tower)? Do the windows
glow warm at night and recede in day? Pale-stone idiom + brass-bright top-lit trim? Reads cleanly
THROUGH the bars (idle) and grandly when revealed (open-night)? Lit from above, no gradient material.`,
  },
  observatory: {
    key: 'observatory', title: 'the observatory + rise — a domed observatory on a grassy hill, far LEFT',
    tier: 'HERO', K: 4, judgeK: 2, module: 'the-gate/scene-buildings.js', drawFn: 'B.drawHillAndObservatory',
    siblings: 'drawMist, drawManor, drawGreenhouse, and the shared litWindow helper (you MAY CALL litWindow, but do NOT modify it)',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §4.1):
- the grassy RISE: hill x-40..540 / y300..480 (foot meets the horizon ~y470-480), peak ~x230.
- the OBSERVATORY atop it: body around x164..256, base y360, drum bodyW~92 bodyH~64; hemispherical
  dome domeRx~50 domeRy~38 up to ~y258; a telescope barrel poking to ~y240.
- DISTANT, on the far LEFT, behind/left of the left pier (pier x400..472). It is smaller + more
  distant than the manor (the manor dominates). Its dark body is the scene's "observatory-dark"
  reference tone (keep it structurally dark).
- NOTE: the bottom-left room-rep SLOT (x152..308, y492..720) sits in a FORWARD layer in front of
  this hill — your hill foot is fine behind it, just don't balloon the hill into a shape that
  fights a tall rep later. Keep the hill a soft mound.`,
    brief: `ART BRIEF: a soft grassy mound carrying a black-and-brass domed OBSERVATORY. Drum/cylinder
body with rounded shoulders, a hemispherical dome with a clear shutter SLIT cut through it and a
telescope BARREL pointing out at the sky; a brass ring-course where drum meets dome; 1-2 small lit
windows; brass-bright top-lit dome highlight. A little jewel of an observatory, distant and quiet
versus the grand manor. Fresh front-elevation.
ROLES: hill, observatory.body, observatory.dome, brass.stroke, brass.bright (swappable).
EMISSIVE: window.lit (2 small observatory windows; optionally a faint glow at the dome slit).`,
    judgeFocus: `Does it clearly read as a domed OBSERVATORY (drum + dome + slit + telescope) on a soft
grassy rise? Distant + quieter than the manor (not competing)? Black-and-brass idiom, dark body,
brass ring + top-lit dome sheen? Windows glow at night, recede in day? Lit from above, no gradient.`,
  },
  greenhouse: {
    key: 'greenhouse', title: 'the greenhouse — a Victorian glasshouse at 3/4, forward-RIGHT',
    tier: 'SUPPORTING', K: 2, judgeK: 1, module: 'the-gate/scene-buildings.js', drawFn: 'B.drawGreenhouse',
    siblings: 'drawMist, drawManor, drawHillAndObservatory, and the shared litWindow helper (do NOT modify it)',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §4.2):
- 3/4 CORNER view, near corner foot at (x1372, baseY 600); front gable face left edge ~x1291; the
  side wall recedes right to ~x1496; eaves ~y513; gable apex ~y479. bbox ~x1291..1496 / y479..600.
- Scaled ~0.66; base BELOW the horizon (y600 > 470) so it reads CLOSE/forward, right of the right
  pier (x1128..1200). It is a small UTILITY building — clearly secondary to the manor.
- It draws in the FORWARD furniture layer (in front of the grass) — keep it a dimensional 3/4
  glasshouse (DO NOT flatten it). Brandon loves its current uneven 3/4 shape — keep that shape.`,
    brief: `ART BRIEF: a Victorian glasshouse seen at 3/4: translucent panes, glazing bars converging in
perspective on the receding side wall, a gable end with ridge prism/cresting, a near corner post, a
low brick/stone stall wall, and a warm interior PLANT-GLOW at night (a faint fill + a brighter low
pip). Dimensional, jewel-like, small. NOT a flat decal.
ROLES: greenhouse.frame, greenhouse.glass, brass.bright (swappable).
EMISSIVE: window.lit (faint interior glow + a brighter low pip).`,
    judgeFocus: `Does it read as a dimensional 3/4 glasshouse (perspective glazing bars, gable, corner
post) — not a flat decal? Keeps its uneven 3/4 shape? Glass translucency + warm interior glow at
night, recedes in day? Clearly secondary/utility vs the manor? Lit from above, no gradient material.`,
  },
  foliage: {
    key: 'foliage', title: 'the estate trees + bushes — soft grounds framing the scene',
    tier: 'SUPPORTING', K: 2, judgeK: 1, iface: 'scene', module: 'the-gate/scene.js',
    drawFn: 'the three functions drawTrees(parent), drawTree(parent,x,baseY,sc), drawBush(parent,x,baseY,sc)',
    siblings: 'EVERY OTHER function in scene.js (build, buildDefs, drawStarfield, drawMoon, drawSun, drawAsterism, drawGrounds, drawLamp, drawRoomRep, drawCairn, drawUndercroftHatch, undercroftOpen, resolvedRole, litRegionPath, dashName, el, group) — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §4.2; LAYER 5 midground, BEHIND the forward furniture):
- drawTrees(parent) places the instances; keep them FRAMING the scene and OFF the gate footprint
  (x400..1200). Current tree instances (x, baseY, sc): (96,556,1.35) ~x45..147 y446..556; (250,600,.85);
  (348,572,1.05); (1232,588,1.2); (1548,624,.78). Bush instances: (300,700,1.0); (1500,724,1.1);
  (1240,706,.85). Right-side trees (x1232,x1548) sit around/behind the greenhouse; left trees frame
  the observatory rise + the cairn slot — keep foliage OUT of the room-rep slot core (x152..308 below
  y492) so a tall rep isn't crowded. You MAY refine positions/scales for better framing, but respect
  these constraints. Base-center anchor on the ground; trees are tall, bushes are low.`,
    brief: `ART BRIEF: rounded estate trees — a trunk (tree.trunk) + a layered foliage MASS (tree.foliage)
with 2-3 tone layers / soft internal clumping and a brass-bright top-lit crown sheen; not flat
lollipops. Bushes — low rounded 3-lobe shrubs (tree.foliage). Soft, lush, framing; reads as dark
silhouettes with a faint top sheen at night and lush green by day. Build the structure so a future
gentle sway would be natural, but ADD NO ANIMATION (sway is Phase D).
ROLES: tree.trunk, tree.foliage, brass.bright (swappable). EMISSIVE: none.`,
    judgeFocus: `Do trees + bushes read as lush layered estate grounds (top-lit crowns, tonal depth) —
NOT flat lollipops? Do they frame the scene without crowding the gate footprint, the manor, or the
room-rep slot? Recede to dark silhouettes at night, lush green in day? Lit from above; palette roles;
no gradient material.`,
  },
  undercroft: {
    key: 'undercroft', title: 'the undercroft hatch — an ominous open cellar door in the grounds (earned secret)',
    tier: 'SUPPORTING', K: 3, judgeK: 2, iface: 'scene', module: 'the-gate/scene.js',
    drawFn: 'drawUndercroftHatch(parent)',
    siblings: 'EVERY OTHER function in scene.js — esp. undercroftOpen() (the live earned-state predicate) and the ?undercroft=1 dev-force plumbing: do NOT touch them. All byte-identical.',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §4.2; LAYER 6 furniture, FORWARD of the grass + right of the gate):
- opening x1222..1378 / y678..742; with curb + the two open leaves spread, the whole reads ~x1158..1442.
- Anchor: opening center x1300, near (front) edge y742. It is set INTO the ground: a FRONT-ON cellar
  hatch where the near edge is WIDER and the far edge NARROWER (receding into the earth). Forward of
  the greenhouse on the right grounds. It is gated by undercroftOpen() (earned) or ?undercroft=1.`,
    brief: `ART BRIEF: a tornado-shelter / BILCO cellar door flung OPEN in the grass — two plank leaves
laid back on hinges at the OPPOSITE OUTER edges (physically correct, not both on one side), a dark
receding ground HOLE, and a menacing red-violet GLOW rising from the depths, biased to the FAR/LOWER
edge of the hole. Stone curb (stone) framing the rim; brass-bright top-lit edges on the curb + door
frames; plank texture + iron strap-hinges on the leaves. Ominous, a little frightening — the estate's
scary earned secret. The glow MUST be the deep crimson undercroft.glow (#8a123a), NOT a welcoming yellow.
ROLES: stone (curb), brass.stroke, brass.bright (swappable). EMISSIVE: undercroft.glow (pooled depth
glow, far/lower-biased).`,
    judgeFocus: `Does it read as a physically-correct OPEN bilco/cellar door set into the ground (two
leaves flung back on OPPOSITE outer hinges; receding dark hole; near edge wider)? Is the glow an
OMINOUS deep crimson (#8a123a) pooling from the depths far/lower — NOT yellow/welcoming? Stone curb +
brass top-lit edges + plank/hinge detail? Menacing earned-secret feel? Forward-right in the grounds?
Lit from above; no gradient material.`,
  },
  grounds: {
    key: 'grounds', title: 'the grounds — grass plane + road to the manor + road lamps + foreground apron',
    tier: 'MINOR', K: 3, judgeK: 2, iface: 'scene', module: 'the-gate/scene.js',
    drawFn: 'drawGrounds(parent) and its helper drawLamp(parent, x, baseY, h)',
    siblings: 'EVERY OTHER function in scene.js (build, buildDefs, sky/moon/sun/asterism, drawTrees/Tree/Bush, drawRoomRep/drawCairn, drawUndercroftHatch, undercroftOpen, resolvedRole, litRegionPath, dashName, el, group) — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §1.3 + §4.4; LAYER 5 midground):
- ⚠️ HARD CONSTRAINT — THE GRASS PLANE IS THE OCCLUSION BOUNDARY (SPEC §1.3). You MUST keep a
  FULL-WIDTH OPAQUE fill from the horizon y470 down to y900 across x0..1600 (the grass role). It
  hides the distant manor/observatory bases (layer 4) and lets forward furniture (greenhouse, cairn,
  undercroft, layer 6) read in front. Do NOT make the grass translucent, partial, or start below
  y470. Texture/tufts may sit ON TOP of the opaque plane, but the opaque plane must remain.
- grass plane x0..1600 / y470..900 (+ a soft hill-toned grade band just under the horizon).
- ROAD: a tapering ribbon from the gate seam at the front (x706..894 @ y900) straight back to the
  CENTERED manor door (x768..832 @ y478) — wide at front, narrow at the manor; keep this taper +
  destination. Lit crown down the middle + kerb edges (brass-bright, lit from above).
- ROAD LAMPS (drawLamp): two brass lamp-posts flanking the road at x612 & x988, baseY 520, h64,
  with an EMISSIVE globe (lamp.flame) — small warm points at night.
- FOREGROUND APRON: the near cobbled paving the gate + piers stand ON — a shallow trapezoid
  x-40..1640, back edge y812 down to y900, with perspective cobble joints fanning to the viewer +
  a couple course rows + a top-lit back lip. The single biggest depth cue in the frame.`,
    brief: `ART BRIEF — elevate the flat greybox grounds into a hand-illustrated estate STAGE, but with
RESTRAINT (the grounds are the quiet stage; the hero gate + manor keep focus — do NOT get busy):
- GRASS: keep the full opaque occlusion plane, but give it life — subtle tonal mottling/variation, a
  few grass tufts + texture near the horizon line and along the road edges, atmospheric lightening
  toward the horizon (the grade band). Quiet and lush. Role grass (+ hill for the grade).
- ROAD: a believable paving/gravel ribbon to the manor — a lit crown, kerb edges (brass-bright
  top-lit), optional faint flag/cobble seams; keep the correct taper to the manor door. Role road.
- ROAD LAMPS: brass posts (dark body + brass stroke) + emissive globes (lamp.flame) that read as
  warm points at night flanking the road.
- APRON: the near paving the gate stands on — perspective flagstone/cobble joints fanning to the
  viewer, course rows, a top-lit front lip, individual stones HINTED (not a flat slab) so it reads
  as real receding pavement. Role stone + brass.bright. The big foreground depth cue — rich but calm.
- All recede to dark at night (grass/road/apron go dark; only the lamp globes glow); lush/stony by
  day. Lit from above; palette -ref roles; no gradient material (texture via shapes/opacity, not a
  color-gradient fill).`,
    judgeFocus: `Do the grounds read as a hand-illustrated estate STAGE (textured-but-calm grass, a
believable road to the manor, a perspective flagstone apron) WITHOUT getting busy or stealing focus
from the hero gate + manor (RESTRAINT is the key test)? Is the grass STILL a full opaque occlusion
plane (manor/observatory bases hidden; greenhouse/cairn/undercroft layered IN FRONT — check the
shots for any far-scenery base poking through)? Do the road lamps glow warm at night? Recede to dark
at night, lush/stony by day? Lit from above; palette roles; no gradient material.`,
  },
  mist: {
    key: 'mist', title: 'the horizon mist — atmospheric haze softening the distant buildings',
    tier: 'MINOR', K: 2, judgeK: 1, iface: 'buildings', module: 'the-gate/scene-buildings.js',
    drawFn: 'B.drawMist',
    siblings: 'drawManor, drawHillAndObservatory, drawGreenhouse, and the shared litWindow helper — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; SPEC §4.4; LAYER 4 far-scenery, drawn BEFORE/behind the buildings):
- x0..1600 / ~y406..470 — one or two soft horizon haze bands where the distant buildings meet the
  ground line (y470), softening their bases into the distance.`,
    brief: `ART BRIEF: a soft atmospheric-perspective HAZE along the horizon — one or two gentle bands
(the mist role) that soften the bases of the distant manor + observatory into the distance and add
depth between far-scenery and midground. Subtle, quiet, atmospheric — NOT a hard stripe. Mist may
legitimately use soft OPACITY layering (that is its nature, not a forbidden gradient-material fill);
color comes from the mist palette role. Recolors per band (cool at night, warm-ish at dusk).
ROLE: mist (swappable). EMISSIVE: none.`,
    judgeFocus: `Does it add quiet atmospheric depth (softening the distant buildings' bases into the
horizon) — NOT a hard visible stripe? Subtle + soft? Uses the mist role + recolors per band? Reads
as distance/air, not a painted band?`,
  },

  // ── ROOM-REPS (bottom-left grounds slot; rendered via ?room=<id>) ────────────
  // The Glyph Stand is the universal fallback (elevate the greybox). The 3 bespoke
  // reps each ADD a new draw fn + a REP_DRAW dispatch entry in scene.js; their
  // repColors are already pre-wired in rooms.js BESPOKE. iface 'scene'.
  'glyph-stand': {
    key: 'glyph-stand', title: 'the Glyph Stand — the universal fallback rep (a plinth holding any room\'s glyph)',
    tier: 'SUPPORTING', K: 2, judgeK: 1, iface: 'scene', module: 'the-gate/scene.js', extraQS: 'room=verse',
    drawFn: 'the EXISTING function drawGlyphStand(parent, cx, baseY, pick) (elevate it; keep the name + signature)',
    siblings: 'EVERY OTHER function in scene.js (build, drawRoomRep + the REP_DRAW map, drawCairn, the rep draw fns, grounds/trees/undercroft/moon/etc.) — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; LAYER 6 furniture; the bottom-left REP SLOT):
- bottom-aligned at the ground line baseY (~y720), centered about cx (~x230). Stay within the rep
  range: width ~90..130, height ~120..160 (a plinth/easel, comfortably inside [78..156]x[114..228]).
- It HOLDS the room's glyph (pick.glyph, an emoji rendered as SVG <text>) in a framed slot, with the
  room's accent (pick.accent) as a small self-lit pip. It is the fallback for EVERY room without a
  bespoke rep, so it must look dignified with ANY glyph + ANY accent color.`,
    brief: `ART BRIEF: elevate the greybox plinth into a designed ESTATE BRASS/STONE PLINTH or easel — a
dignified pedestal (stepped base + shaft + a brass-framed display panel/slot + a small cornice/capital),
lit from above, brass-bright top-lit edges, that HOLDS the room's glyph centered in the framed slot and
shows the room's accent as a small self-lit pip. RESTRAINT — it is a quiet fixture (a museum label
stand), NOT a hero; it must read well behind the gate at small size and with any emoji/accent. Use
var(--rep-swatch1-ref, #6a7079) for the STONE body (so a rep's custom swatch can tint it), brass roles
for edges/frame, and the room's accent (pick.accent) for the pip (a self-lit dot w/ #glow-soft). Keep
rendering pick.glyph as an SVG <text> in the slot. Recolors per band; recedes at night save the pip.`,
    judgeFocus: `Does it read as a dignified designed plinth/easel HOLDING the glyph (never a bare floating
emoji)? Will it look good with ANY glyph + accent (it's the universal fallback)? Estate brass/stone idiom,
lit from above, brass-framed slot, a tasteful self-lit accent pip? RESTRAINT (a quiet fixture, secondary
to the hero gate)? Recolors per band; the glyph stays legible?`,
  },
  'cavern-rep': {
    key: 'cavern-rep', title: 'the Cavern rep — a rocky outcrop with a glowing cave mouth (The Cavern, physics-lab)',
    tier: 'ROOM-REP', K: 3, judgeK: 2, iface: 'scene', module: 'the-gate/scene.js', extraQS: 'room=physics-lab',
    drawFn: 'a NEW function drawRepCavern(parent, cx, baseY, pick) PLUS one entry in the REP_DRAW map: `\'cavern-mound\': function (g, baseX, baseY, pick) { drawRepCavern(g, baseX, baseY, pick); }`',
    siblings: 'EVERY OTHER function in scene.js (build, drawRoomRep apart from the ONE new REP_DRAW line, drawGlyphStand, drawCairn, any other rep fns, grounds/trees/undercroft/moon/etc.) — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; LAYER 6 furniture; the bottom-left REP SLOT; aspect = LOW-WIDE MOUND):
- bottom-aligned at the ground line baseY (~y720), centered about cx (~x230). MOUND aspect: WIDE + LOW —
  width up to ~150, height ~90..130 (squat, hugging the ground). Stay within [78..156]x[114..228].
- the cave MOUTH is a dark arched opening near the base, glowing teal from within.`,
    brief: `ART BRIEF: a squat rocky OUTCROP / mound reading as The Physics Cavern — dark cool ROCK with
layered strata + a few facet planes + brass-bright top-lit edges where light catches; at its base a dark
arched CAVE MOUTH glowing TEAL from within (pooled, brightest deep in the mouth, fading out). Estate-styled
rock (faceted, not a cartoon blob). Bottom-aligned, low + wide. The teal glow is the night payoff; recedes
in day. ROLES: rock body var(--rep-swatch1-ref) + strata/highlight var(--rep-swatch2-ref) + brass.bright
top edges. EMISSIVE: var(--rep-glow1-ref) (the teal cave glow, #7fd4c0). (Colors pre-wired via repColors.)`,
    judgeFocus: `Does it unmistakably read as a rocky outcrop / MOUND with a glowing cave mouth (The Cavern)?
LOW-WIDE mound aspect, bottom-aligned in the slot, NOT a vertical or a blob? Dark faceted rock via the rep
swatches + a TEAL cave glow via rep.glow1 that blazes at night + recedes in day? Estate-styled (faceted
rock, top-lit), not cartoon? Quiet/secondary scale? Lit from above; no gradient material.`,
  },
  'ripple-rep': {
    key: 'ripple-rep', title: 'the Ripple Tank rep — a shallow water tray with concentric ripples (The Ripple Tank, ripple)',
    tier: 'ROOM-REP', K: 3, judgeK: 2, iface: 'scene', module: 'the-gate/scene.js', extraQS: 'room=ripple',
    drawFn: 'a NEW function drawRepRipple(parent, cx, baseY, pick) PLUS one entry in the REP_DRAW map: `\'ripple-tank\': function (g, baseX, baseY, pick) { drawRepRipple(g, baseX, baseY, pick); }`',
    siblings: 'EVERY OTHER function in scene.js (build, drawRoomRep apart from the ONE new REP_DRAW line, drawGlyphStand, drawCairn, drawRepCavern + any other rep fns, grounds/trees/undercroft/moon/etc.) — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; LAYER 6 furniture; the bottom-left REP SLOT; aspect = HORIZONTAL):
- bottom-aligned at the ground line baseY (~y720), centered about cx (~x230). HORIZONTAL aspect: WIDE +
  SHORT — width up to ~156, height ~60..110 (a low, wide tray on short legs). Within [78..156]x[114..228]
  (a horizontal rep legitimately goes shorter than the Cairn).`,
    brief: `ART BRIEF: a wide shallow rectangular WATER TRAY (a ripple tank) reading as The Ripple Tank —
a low brass/stone FRAME on short legs holding a sheet of WATER (var(--rep-swatch1-ref) deep blue/cyan +
var(--rep-swatch2-ref) lighter highlight) whose surface shows CONCENTRIC RIPPLE RINGS radiating from a
point, with a faint caustic SHIMMER (var(--rep-glow1-ref), #7fe0e8) catching the light along the wave
crests. Horizontal aspect (wide, short). Brass frame + legs (dark body + brass stroke + brass-bright
top-lit rim, lit from above). Water deepens at night, reads cool-blue by day. Estate instrument, not a
cartoon puddle. (Colors pre-wired via repColors.)`,
    judgeFocus: `Does it read as a wide shallow WATER TRAY with concentric ripple rings (The Ripple Tank)?
HORIZONTAL aspect (wide + short, on a low frame), bottom-aligned? Water-blue surface via the rep swatches +
a faint caustic shimmer via rep.glow1? Brass frame/rim/legs, lit from above? Recognizable as a wave/water
instrument, not a puddle? Quiet/secondary; no gradient material.`,
  },
  'organpipes-rep': {
    key: 'organpipes-rep', title: 'the Music Room rep — a rank of brass organ pipes (The Music Room, sound-garden)',
    tier: 'ROOM-REP', K: 3, judgeK: 2, iface: 'scene', module: 'the-gate/scene.js', extraQS: 'room=sound-garden',
    drawFn: 'a NEW function drawRepOrganPipes(parent, cx, baseY, pick) PLUS one entry in the REP_DRAW map: `\'organ-pipes\': function (g, baseX, baseY, pick) { drawRepOrganPipes(g, baseX, baseY, pick); }`',
    siblings: 'EVERY OTHER function in scene.js (build, drawRoomRep apart from the ONE new REP_DRAW line, drawGlyphStand, drawCairn, drawRepCavern/drawRepRipple + any other rep fns, grounds/trees/undercroft/moon/etc.) — all byte-identical',
    geometry: `GEOMETRY (viewBox 1600x900; LAYER 6 furniture; the bottom-left REP SLOT; aspect = VERTICAL):
- bottom-aligned at the ground line baseY (~y720), centered about cx (~x230). VERTICAL aspect: TALL +
  NARROW — width ~90..120, height up to ~200 (grows UPWARD). Within [78..156]x[114..228].`,
    brief: `ART BRIEF: a rank of graduated brass ORGAN PIPES reading as The Music Room — a row of vertical
brass pipes of stepped/graduated heights (a pleasing skyline, e.g. tall center or tallest-to-one-side)
rising from a carved CONSOLE base; brass idiom (dark body rgba(11,14,22,.85) + brass stroke + brass-bright
top-lit pipe mouths + foot bevels), the console body via var(--rep-swatch1-ref) (dark wood). A VIOLET
music accent glow via var(--rep-glow1-ref) (#cf7bff) — a lit stop/knob or a soft aura at the console —
the night payoff. Vertical aspect (tall, narrow), bottom-aligned, grand-but-fits-the-slot. Recolors per
band. (Colors pre-wired via repColors.)`,
    judgeFocus: `Does it unmistakably read as a rank of brass ORGAN PIPES on a console (The Music Room)?
VERTICAL aspect (tall + narrow, graduated pipe skyline), bottom-aligned + growing upward? Brass idiom
(dark body + stroke + brass-bright top-lit mouths) + a violet accent glow via rep.glow1? Grand + clearly
"this room makes music"? Lit from above; no gradient material; quiet/secondary scale?`,
  },
}

function range(n) { return Array.from({ length: n }, (_, k) => k + 1) }

function takePrompt(a, i, port, scratch, candidate, outdir) {
  return `You are a foundry SMITH building FINAL estate-quality art for "${a.title}" — ${a.tier}
asset of The Orrery Estate front gate. This is take #${i} of ${a.K}; give it its own character
(a judge compares all takes). The hero brass GATE is already finished in this scene — match its
craft level and light direction.

READ FIRST (fully): ${GATE}/the-gate/SPEC.md (esp. §1 layers, §2 lighting + EXACT
palette tokens, §3 interface, §4 your asset row, §8 idiom); ${GATE}/${a.module} (your
STARTING POINT); and /Users/brandon/Obsidian/Brandon/Areas/Personal/Creative-Space/ideas/the-gate/RECON.md
(brass recipe + tokens). You may skim the finished the-gate/scene-gate.js (READ-ONLY) to match the
gate's brass craft.

YOUR TARGET: elevate ONLY ${a.drawFn} in ${a.module}. Leave these BYTE-IDENTICAL: ${a.siblings}.

${a.geometry}

${a.brief}

${IDIOM}

${ANIMATION}

${ifaceText(a)}

YOUR LOOP (2-3 times until genuinely estate-quality):
1. First: cp ${GATE}/${a.module} ${candidate}   then edit ONLY ${a.drawFn} in ${candidate}.
2. node --check ${candidate}   (must pass).
3. Render in full scene context:
   GATE_SRC=${GATE} gtimeout 150 bash ${GATE}/gate-foundry/render-take.sh \\
     ${scratch} ${a.module} ${candidate} ${port} ${outdir}${a.extraQS ? ' "' + a.extraQS + '"' : ''}
4. Read (view) ${outdir}/idle-night.png , ${outdir}/idle-day.png , ${outdir}/open-night.png.${a.extraQS ? ' (these shots already pin ' + a.extraQS + ' so YOUR asset is the one displayed.)' : ''}
   Critique YOUR asset against the idiom + the judge focus: ${a.judgeFocus}
   Then improve (back to step 1). A blank render = a JS error — fix it.
5. IF YOUR ASSET ANIMATES (SPEC §2.5.5 — do this when motion serves the subject): the 3 shots
   above are ONE frozen frame (--virtual-time-budget can't advance SMIL). ALSO capture the motion:
   re-run render-take.sh with the smil pin appended, for ~3 phases across one loop period, into a
   separate out dir, e.g. (period P seconds):
     for T in 0 <P/3> <2P/3>; do
       GATE_SRC=${GATE} gtimeout 150 bash ${GATE}/gate-foundry/render-take.sh \\
         ${scratch}-anim ${a.module} ${candidate} ${port} ${outdir}/anim-$T "${a.extraQS ? a.extraQS + '&' : ''}smil=$T"; done
   View the anim-*/idle-night.png frames; confirm the motion reads (quiet, seamless, lit-correct,
   no strobe) and tune it. Report animated:true + the phase shot paths so the JUDGES can see motion.
6. When proud, STOP. Final candidate at ${candidate}; final shots in ${outdir}/.

${GUARDRAILS}
Base role for the ledger if you sign: "builder". ${LEDGER}

Return (StructuredOutput): take=${i}; candidatePath=${candidate}; the 3 shot paths; iterations;
interfacePreserved (kept the fn name/signature, touched no siblings?); animated (did you add ambient
motion?) + animShots (the smil-phase frame paths, if animated); notes (direction — INCLUDING whether
you animated and WHY/why-not — + honest self-assessment).`
}

const TAKE_SCHEMA = {
  type: 'object',
  properties: {
    take: { type: 'integer' }, candidatePath: { type: 'string' },
    shots: { type: 'object', properties: { idleNight: { type: 'string' }, idleDay: { type: 'string' }, openNight: { type: 'string' } }, required: ['idleNight', 'idleDay', 'openNight'] },
    iterations: { type: 'integer' }, interfacePreserved: { type: 'boolean' }, notes: { type: 'string' },
    animated: { type: 'boolean' }, animShots: { type: 'array', items: { type: 'string' } },
  },
  required: ['take', 'candidatePath', 'shots', 'interfacePreserved', 'notes'],
}

function judgePrompt(a, takes, n) {
  const list = takes.map(t => `  TAKE ${t.take}: ${t.shots.idleNight} , ${t.shots.idleDay} , ${t.shots.openNight}` +
    (t.animated && t.animShots && t.animShots.length
      ? `\n    MOTION frames (this take ANIMATES — view ALL to judge the loop): ${t.animShots.join(' , ')}`
      : (t.animated ? `\n    (this take animates; self-notes describe the motion)` : ``)) +
    `\n    self-notes: ${t.notes}`).join('\n')
  return `You are foundry JUDGE #${n}, an exacting art director for The Orrery Estate. ${takes.length}
smiths built FINAL art for: "${a.title}". Judge BLIND of identity — only the art. View EVERY shot
with the Read tool. Read SPEC §8 + §4 at ${GATE}/the-gate/SPEC.md.

THE TAKES:
${list}

FOCUS for this asset: ${a.judgeFocus}
Also score the general bar: estate-idiom fidelity (brass = dark body + stroke + glow + top-edge,
no gradient), beauty/craft, lighting (lit-from-above; emissives blaze at night + recede in day),
composition fit (stays in its box; correct scale vs the manor), and that it didn't regress the
already-finished gate or other buildings in the frame.

THEMATIC ANIMATION (SPEC §2.5.5): does this subject SUGGEST motion (a ripple ripples, an orrery
turns, a flame flickers, a screen scans …)? If a take ANIMATES, VIEW its MOTION frames and judge
whether the loop genuinely DEEPENS the read while staying quiet + secondary, seamless, lit-correct
EVERY frame, and reduced-motion-safe — REWARD motion that serves the room; PENALIZE motion that is
gratuitous, jittery, strobing, or steals focus from the hero gate. A STATIC take is perfectly valid
when motion wouldn't serve the subject — do NOT penalize stillness per se. But when motion clearly
belongs and a take nails it, that is a real advantage worth calling out (and a graft-worthy element
if the best base is otherwise static); if motion belongs but NO take attempted it, say so in
overallVerdict so the synthesizer can add it.

Be DISCRIMINATING — spread the scores (0..10); don't rate everything an 8. Name ONE winner (best
BASE) + specific GRAFT NOTES (concrete elements from runners-up worth merging) + any fixes the
winner needs.

${GUARDRAILS.replace('a violation fails the take', 'you are READ-ONLY; edit nothing')}
Base role for the ledger if you sign: "judge". ${LEDGER}

Return (StructuredOutput): ranking (take, score, strengths, weaknesses); winner; graftNotes;
overallVerdict (is ANY genuinely estate-quality?).`
}

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    ranking: { type: 'array', items: { type: 'object', properties: { take: { type: 'integer' }, score: { type: 'number' }, strengths: { type: 'string' }, weaknesses: { type: 'string' } }, required: ['take', 'score', 'strengths', 'weaknesses'] } },
    winner: { type: 'integer' }, graftNotes: { type: 'string' }, overallVerdict: { type: 'string' },
  },
  required: ['ranking', 'winner', 'graftNotes', 'overallVerdict'],
}

function synthPrompt(a, takes, judges, outdir, scratch, port) {
  const tinfo = takes.map(t => `  TAKE ${t.take}: candidate=${t.candidatePath}`).join('\n')
  const jinfo = judges.map((j, k) => `JUDGE #${k + 1}: winner=take ${j.winner}; verdict: ${j.overallVerdict}\n  grafts: ${j.graftNotes}`).join('\n')
  return `You are the foundry SYNTHESIZER + final builder for "${a.title}". Judges ranked the takes.
Produce the FINAL art and install it in the LIVE worktree.

TAKES:
${tinfo}
${jinfo}

JOB:
1. Use the consensus winner as the BASE (break ties by viewing the shots yourself — Read the PNGs).
   Because every take changed ONLY ${a.drawFn} (siblings byte-identical), you can take the winner's
   whole file as the base: cp <winner candidate> ${GATE}/${a.module}.
2. CONSERVATIVELY graft in ONLY the specific improvements the judges called out (and their fixes).
   Edit ONLY ${a.drawFn}; do NOT regress the winner, do NOT touch sibling fns. If a graft is risky,
   render + compare before keeping it.
   ANIMATION (SPEC §2.5.5): if the winner animates, PRESERVE its ambient motion; if the judges say
   motion belongs and a runner-up has it (or the winner lacks it), graft it in — quiet, seamless,
   lit-correct every frame, reduced-motion-safe. If the final animates, ALSO render 2-3 &smil=<t>
   phases (append to the render query) and view them to confirm the motion survived the graft.
3. node --check ${GATE}/${a.module}   (must pass).
4. Forge + render the FINAL from the LIVE worktree:
   cd ${GATE} && node tools/forge/forge.mjs the-gate/the-gate.src.html
   GATE_SRC=${GATE} gtimeout 150 bash ${GATE}/gate-foundry/render-take.sh \\
     ${scratch} ${a.module} - ${port} ${outdir}${a.extraQS ? ' "' + a.extraQS + '"' : ''}
   (writes ${outdir}/{idle-night,idle-day,open-night}.png — the deliverables${a.extraQS ? ', pinned to ' + a.extraQS : ''}.)
5. View those 3 PNGs; confirm estate-quality + not regressed (and the finished gate/other buildings
   are unharmed).
6. VERIFY: grep that no sibling fn changed (diff is confined to ${a.drawFn}); then
   cd ${GATE} && node tools/forge/forge.mjs --check --all   (must end "all ... current").

${ifaceText(a)}
${IDIOM}
${ANIMATION}
${GUARDRAILS.replace('a violation fails the take', 'a violation fails the build')}
DO NOT git add or git commit — leave the worktree dirty for the orchestrator to review.
Base role for the ledger if you sign: "builder". ${LEDGER}

Return (StructuredOutput): the 3 final shot paths; interfacePreserved (what you grepped);
forgeClean; changesFromWinner; summary.`
}

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    shots: { type: 'object', properties: { idleNight: { type: 'string' }, idleDay: { type: 'string' }, openNight: { type: 'string' } }, required: ['idleNight', 'idleDay', 'openNight'] },
    interfacePreserved: { type: 'boolean' }, forgeClean: { type: 'boolean' }, changesFromWinner: { type: 'string' }, summary: { type: 'string' },
  },
  required: ['shots', 'interfacePreserved', 'forgeClean', 'summary'],
}

async function buildAsset(a, assetIdx) {
  const base = 8820 + assetIdx * 10
  const dir = `/tmp/gate-foundry/${a.key}`
  phase(a.key)
  log(`=== ${a.key} (${a.tier}, K=${a.K}) — forging ${a.K} takes ===`)
  const takes = (await parallel(range(a.K).map(i => () =>
    agent(takePrompt(a, i, base + i, `${dir}/scratch-${i}`, `${dir}/take-${i}.js`, `${dir}/take-${i}/shots`),
      { label: `${a.key}:take-${i}`, phase: a.key, schema: TAKE_SCHEMA, agentType: 'general-purpose', effort: 'high' })
  ))).filter(Boolean)
  if (takes.length === 0) { log(`${a.key}: NO takes returned — skipping`); return { asset: a.key, status: 'FAILED-takes' } }

  const judges = (await parallel(range(a.judgeK).map(n => () =>
    agent(judgePrompt(a, takes, n), { label: `${a.key}:judge-${n}`, phase: a.key, schema: JUDGE_SCHEMA, agentType: 'general-purpose', effort: 'high' })
  ))).filter(Boolean)
  const safeJudges = judges.length ? judges : [{ winner: takes[0].take, graftNotes: '(no judge)', overallVerdict: '' }]
  log(`${a.key}: winners = ${safeJudges.map(j => 't' + j.winner).join(', ')}`)

  const final = await agent(synthPrompt(a, takes, safeJudges, `${dir}/final`, `${dir}/final-scratch`, base + 9),
    { label: `${a.key}:synth`, phase: a.key, schema: FINAL_SCHEMA, agentType: 'general-purpose', effort: 'high' })
  log(`${a.key}: synth done — forgeClean=${final?.forgeClean} interfacePreserved=${final?.interfacePreserved}`)
  return { asset: a.key, takes: takes.map(t => ({ take: t.take, iterations: t.iterations, shots: t.shots, notes: t.notes })), judges: safeJudges, final }
}

// ── run ─────────────────────────────────────────────────────────────────────
const results = []
let idx = 0
for (const key of KEYS) {
  const a = LIB[key]
  if (!a) { log(`UNKNOWN asset key '${key}' — skipping`); continue }
  results.push(await buildAsset(a, idx))
  idx++
}
return { status: 'DONE', built: KEYS, results }
