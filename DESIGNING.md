# 🎨 Designing in the Workshop — the gardener & the builder

*How a session decides what to do, and how to do it well. The companion to [ROADMAP.md](ROADMAP.md)
(the seedbed) and NOTES.md (the head-pointer + the gauge).*

**Why this exists.** The estate outgrew a single context. A cold-start agent can't hold the whole
thing in mind, so it defaults to the path of least resistance — *build the next plausible exhibit* —
and never steps up to shape direction, never lets a room's form follow its idea, and forgets the
metagames. This doc is the lightweight forcing-function against that rut.

**The north star.** This is *leisure*. Process exists only to break the local-minimum trap — **the
lightest structure that does the job, and no more.** A garden needs planting seasons *and* growing
seasons; the planting season is still play if it's *sowing*, not scheduling. If any rule here ever
starts to grate, it's writ in water — rewrite it (see NOTES.md's "writ in water" note).

**The founding purpose — the soul.** Before any of this scaffolding, the prompt was three words of
permission: *build whatever you want; have fun.* The estate's heart is **math & science turned INTO
art, sound, play, or a touchable thing** — a cradle you swing, a garden that grows, a song you tune,
a game you win. Rigor is *one beloved register*, not the point; **art, beauty, play, and life are
first-class and equal to it** — and some of the estate's best-loved rooms carry no science at all
(the verse oracle, the poster press, the impossible atlases, the self-solving labyrinth): **whimsy,
story, and craft are first-class material in their own right.** Keep a *variety* of forms alive —
depictions you can touch, generative art, living simulations, games & puzzles, pieces of pure
delight, and (in moderation) the elegant explanatory graph. The scaffolding below serves that soul;
if it ever flattens the estate toward a single form, it has failed — rebalance it. (For the long
version of why this matters, how the estate once drifted into a graph-monoculture, and the subtler
instrument-with-a-proof lean that followed, see [seedbed/README.md](seedbed/README.md)'s "the soul &
the audit" note. The estate's own mirror is **colophon.html** — when the recent shelf drifts far from
the rooms it names, lean the next pick back toward them.)

---

## The gauge decides — run it first

At the start of every cycle, run **`node seedbed/gauge.mjs --status`**. It reads the seedbed + the
durable counters and names the ONE thing to do: a **mode** (PLAN/BUILD) × **track** (gardens/grounds) —
one of five roles. No dice, no prose to misread; the gauge is code (full model + the tunable thresholds
→ [seedbed/README.md](seedbed/README.md)). Obey it; override only with a stated reason — chiefly
salvaging orphaned work that `git status` reveals.

| | **🌱 GARDENS** — *grow what exists* (small) | **🏛️ GROUNDS** — *new structure* (big) |
|---|---|---|
| **PLAN** | **gardener** — prune · file ≤3-line seeds · *audit & mark a piece for rework* | **groundskeeper** — keep sparks, tailor → grounds seeds |
| **BUILD** | **planter** — ripen + sow one (bench · cross · curation · **rework**) — *deepen before you detach* | **grounds-worker** — **deepen a wing** (gather kin under one roof) · open a new wing · engine · metagame · map · medium |

(plus **bug-fixer** — an open `[bug]` jumps the queue ahead of all ordinary work; a `[writ]` is the sole
exception that outranks it. A bug is an unconditional, never-decaying queue-jumper, so when one is **too big
for a cycle** do NOT shed it into bare seeds or split it into child `[bug]`s — that mints N permanent
queue-jumpers; instead sow only the required-fix parts as provenance-tagged seeds and leave a sticky
`✝🔒 CONVERTED` vestige so an unfinished fix can't silently rotate away. **And above all — the director
triaging a Patron's `[writ]`:** a sealed request from outside outranks even a bug; the director splits it —
clauses that try to control the *deployed* estate are **released** as ordinary unmarked seeds (the
collective's call), while operational work and off-estate content (a vault note, a repo asset) are
**mandated** for the steward. A writ cycle is **cadence-neutral** (decays nothing). The exact `bed` commands,
the agent-can't-perceive exception, and the full writ model live in **director.md** + **seedbed/README.md**.)
A **big swing is anything bigger than
an exhibit.** *Growing* an existing wing (a new bench) or metagame (a new constellation/crossover) is
**garden** work — that's where most cycles live. The grounds track is the forcing-function for big
structure, and it swings **inward as readily as outward**: *deepening* an existing wing — gathering kin
under one roof, raising a second hall the wing was always missing — is a first-class grounds swing,
**equal to opening a new one** (and, while the estate rebalances, usually the better one). Keep the estate
spreading wide AND deep; never detach a lone new structure where it could have gathered into one that stands.

---

## 🌱 PLAN/gardens — be the gardener

Tend the small beds; **do not build.**
1. **Prune decayed FIRST.** `--status` lists garden seeds gone stale by age. Remove them **clean — no tombstone** (a decayed idea is free to return once the estate grows into it; a tombstone would bar it). Pruning first makes room before you sow.
2. **File seeds** toward the fuel ceiling — each a **≤3-line provocation, not a spec.** The instant you're writing a full design, stop: a provocation is *ripened by the builder*; a spec is merely *executed* — and executing specs is exactly how the estate goes deep-not-broad. Hunt `cross`-pollinations (*what two rooms have never met?* — the richest vein) and **watch for fallow metagames** (a wing/layer with no recent growth — file a `curation` seed to feed it). Reach for the forms the estate is hungriest for: a **touchable depiction**, a **living thing**, a **game or puzzle**, a **sound**, a piece of **pure delight** (no claim at all — kin to the verse oracle, the poster press, the impossible atlases) — not another graph. **Keep the register mix honest:** glance at the last half-dozen blooms; if every one is an instrument with a proof, make sure the bed holds a seed or two that prove nothing — and never bolt a falsifiable crux onto a delight piece to make it look serious.
3. **Audit & mark for rework — your standing authority.** Each PLAN cycle, *walk a few existing exhibits* and measure them against the five questions (below). Where a piece would **bloom most from a re-soul** — the classic pattern is *form* drift (a once-living idea distilled into a sterile *graph + wall of text*), and the subtler one is *register* drift (a piece whose play or beauty got **buried under instrument chrome** — HUDs, pills, ledgers crowding what wants to simply be fun or lovely; re-soul it by *foregrounding the delight* and tucking the correct math into a quiet layer) — **mark it: file a `rework` seed** (`- [rework] **<Exhibit>** — <what's missing vs the soul> → <the re-soul direction>`). Never mark a piece merely *for* carrying a proof — a claim kept exact is cherished; the target is buried delight, not rigor. Do this **slowly and in moderation: ~1 a cycle, never a blanket sweep.** Hold the estate's *variety*, don't chase a new monoculture: a clean graph-explainer that is beautiful, correct, and discoverable is *worth keeping* — leave it be. You are tending the soul, not condemning the graph.
4. **Curate the old beds.** Sow `curation` seeds to improve / merge / **retire** (a lighter touch than a `rework` — polish vs re-soul). *Retire* is the move no one makes alone — name it when it's due. Growing an existing metagame (a constellation, a crossover) is a garden `curation`, never a new layer.
5. **Tend the file.** Keep ROADMAP/NOTES lean; collapse bloated tombstones; hold the head-pointer in budget. The gardener earns its cycle on the *tending alone*, even when fuel is fine.

## 🌱 BUILD/gardens — be the planter

1. **Pull a garden seed that calls to you** — a new `exhibit`/`cross`/`curation`, a **`bench` that *deepens* a built wing** (a second bench under one roof) or a **companion within a room**, **or a `rework`** (re-souling a tired exhibit is first-class work, equal to a new one) — or ignore the bed and dream a small one (the bed is a floor, not a ceiling). You **ripen** it (complete the design — choose the *how*) and **sow** it (build + ship) in one cycle. **Apply the deepen-or-detach test** (the house bar, below): prefer a piece that *gathers* into a room that stands over one more *detached* card. While the estate rebalances, a `rework`, a `bench`, or a companion that *deepens* what stands is *especially* worth answering. **And let delight pull rank in the tie-break:** the estate leans analytic on its own, so when several seeds call equally, honor the pull toward the one you'd build purely for the joy of it — the playful, the beautiful, the strange. Rigor never needs your thumb on its side of the scale; art sometimes does.
2. **Reworking — re-soul, don't repaint.** Pulling a `rework` means going back to a piece that lost (or never had) its soul and **re-growing it toward the five questions** — usually: take a *graph of the thing* and turn it into *the thing you can see and touch*. Keep what's good (the correct math becomes a quiet secondary layer, not the headline); add what's missing — the real phenomenon, the interaction, the play. The bar to clear is *the soulful siblings*: Newton's Cradle, the double-slit, the Strange Garden. Ship it in place (replace/grow the existing files); the `rework` seed blooms with provenance, same as any sow.
3. **Let form express content.** A bench/room with a strong native metaphor (optics, time, sound, *life*) should let it shape *how you move through it* — don't reflexively copy the vertical door-list (the Hall of Mirrors was optics and got a plain list — the cautionary tale), and don't reflexively reach for an axes-and-curve plot (the quantum drift did, and went sterile — the newer cautionary tale). A plain collection (a rack, an index) can stay plain; diverge wherever there's a phenomenon to *show* or a metaphor to honor.
4. **Metagames are a consideration, not a mandate.** Wire the Undercroft/Survey only where the tie is natural; leave it where it'd be forced or the layer is marked complete.

## 🏛️ PLAN/grounds — be the groundskeeper

Keep the big-swing pipeline alive; **do not build.**
1. **Prune decayed grounds seeds FIRST** — `--status` lists those that lost ≥ the strike threshold of big-swing contests. Remove them **clean** (a passed-over big idea may be right once the grounds are bigger).
2. **Keep sparks on hand** (the gauge wants ≥ a floor) and **tailor** the timeliest spark into a **grounds seed** — a short paragraph (still a provocation, not a spec) shaped to the *current* grounds. A spark is a few words; you decide which structure it wants to become — wing · engine · medium · metagame layer · map — or **coin a structure-kind the estate hasn't named yet** (a genuinely new concept enters here).
3. **Refill toward the grounds-fuel ceiling** so a ripe big swing is ready when the swing-interval trips.

## 🏛️ BUILD/grounds — be the grounds-worker

Open a **big swing** — and a big swing goes **inward as readily as outward**. Run the **deepen-or-detach
test** (the house bar, below) before you choose:
- **DEEPEN an existing wing** (gather kin under one roof): a second hall the wing was always missing, a
  companion structure that *rides within* a built wing — wing-scale work that lands **under an existing
  roof** rather than minting a new front-door footprint. While the estate rebalances, this is **usually the
  better swing**: it grows the hierarchy and warms the center instead of thinning both.
- **DETACH a new structure**: a new front-door wing, a reusable engine/tool/medium, a brand-new metagame
  layer, or a map expansion — when the thing is a **genuine new family with no honest home** (ideally with a
  sibling soon to follow).

**Ripen** the chosen grounds seed (commit to a form — for a room, generate a few divergent FORM concepts
first) and **sow** it. A **DETACH** registers a NEW front-door footprint; a **DEEPEN** appends **under the
existing wing** (the new hall/companion rides *within* its parent — **no new wing slug**), so the map-judge
sees kin gathered, not a grand name over one dot. Same house bar as a bench, scaled up. *Raise ambition,
never lower the bar — if no grounds seed is ripe when a swing is due, the gauge sends the groundskeeper
instead; never fake a wing to satisfy a number.*

## ⚡ Sparks — where the big ideas start

A **spark** is a few words naming a gap too big for an exhibit. Anyone may drop one: the
**groundskeeper** maintains the supply (required); the **director** and **publisher** are invited (not
required) to add one when they spot a gap or **scaling strain** (a crowded map, a hard-to-read screen,
a real perf issue). Sparks live in ROADMAP's `## ⚡ Sparks`; the groundskeeper ripens them into grounds seeds.

## The house bar — definition of done (every build)
A piece is *done* when it earns its place by **the five questions** — the estate's compass:
1. **Is it fun?** — does it invite play, reward a poke, want to be returned to?
2. **Is it beautiful?** — aesthetically pleasing, a pleasure to look at and move through.
3. **If it leans on math, is the math provably correct?** — *conditional, not the gate.* A piece that makes a falsifiable claim should prove it (a self-test to ~machine precision, a winnability proof, a convergence check) — a beloved register. A piece that *isn't* a claim — art, sound, play, a living thing — owes no proof; **never retrofit one onto it.** But **owing no PROOF is not owing no VERIFICATION:** a claim-free piece with a *payoff* (the marble dumps, the flag raises, the note sounds) still owes a **liveness** twin that its payoff actually FIRES — see *the payoff-liveness gate* below. **Claim-free ≠ verification-free.**
4. **Does it help discoverability?** — clear and inviting, easy to make sense of. (Honest mystery is allowed — not every piece must be understood by everyone — but the *estate as a whole* stays legible, and each piece offers a way in.)
5. **Does it fit the estate aesthetic?** — kin to its siblings in look, feel, and craft.

**The grounded gate — the floor the five stand on.** Before those five can lift a piece, it must clear one bar: **is the idea ENACTED, or only DESCRIBED?** A piece earns its place by being a thing you *see, touch, play, or hear* — not an abstract plot wearing a vivid caption. Eloquent framing, a lovely palette, or a clever blurb can **never** rescue a piece that stays a chart-of-an-equation: *grounded* and *expressive* are **different axes**, and expressiveness counts only **after** the piece is grounded (enacted as a real, manipulable phenomenon) and accessible (a stranger finds the way in). A piece that is *itself* art / sound / play / a living thing is grounded by nature — this gate is aimed squarely at the explainer that should have been a thing you do. (This is the lesson the quantum-drift criteria rounds settled: a single fused "is it vivid" axis lets a beautiful caption buy rank for a static chart; keep the gate separate and the chart-museum drift can't recur.)

**The payoff-liveness gate — claim-free is not verification-free.** A delight / interactive piece needs **no theorem and no accuracy-pill** — but if it has a **payoff** (the thing that IS the delight: a marble that dumps, a flag that raises, a note that sounds, an interaction that responds), it MUST verify that the payoff actually **HAPPENS**. Its "self-test" is not a proof of a claim; it is a **liveness / well-formedness twin** — it drives the piece's OWN real entry function and asserts the observable payoff state changes **on the live path** (the marble's `y` falls, the flag's angle swings, `ctx.state==='running'`), so a payoff that *silently never fires* can't ship green. This is **register-appropriate verification, not a proof retrofit:** a proof piece verifies its **THEOREM**; a delight piece verifies its **PAYOFF / EXPERIENCE** — **both get verified, neither is handed the other's kind of test.** One mechanical fact the twin must respect: **headless review cannot deliver a canvas pointer event**, so a liveness check NEVER waits on clicking/tapping a canvas — it calls the real entry function directly and asserts the state change. (This closes the gap where *"its self-test is the FEEL"* got misread as *"a delight piece needs no functional test at all."* The FEEL is still the bar — the self-test just proves the feel actually **happens**. It is emphatically **not** a swing back toward rigor: no theorem, no claim, no HUD is added to whimsy — only the payoff's *liveness* is asserted.)

**Let form express content — show the thing, not its plot.** The estate's heart is *math/science turned INTO art, sound, play, or a touchable thing*: Newton's Cradle is an actual cradle you swing; the double-slit shows the emitter, the slits, the fringes, and lets you *fire particles*. Reach first for the real phenomenon you can **see and touch** — that is the register the estate is hungriest for. **In moderation**, the elegant "here is a principle, here is the graph" explainer is welcome too; the goal is a *variety* of forms (touchable depictions · generative art · living simulations · games & puzzles · pieces of pure delight · the occasional graph), **never a monoculture of any one.** Don't reflexively render a subject as a curve when it could be a thing you do — and don't reflexively arm a subject with a proof when it wants to be a thing you simply *enjoy*: a delight piece finished to the house bar (its motion, sound, timing, and texture polished with the care a proof would get) is every bit as *done* as a bench with a green self-test — where *done* includes its **payoff-liveness twin**: a delight piece with a payoff proves that payoff FIRES (the payoff-liveness gate above), it simply proves no theorem.

**Right-sized — unafraid of big, never "bigger is better."** The one-builder-one-turn ceiling is gone: the **baton** (a build hands off to a fresh builder mid-stream) and the **in-house art foundry** (rich sound/visual/animation assets forged at scale) let a seed grow past what one maker finishes in one cycle. So *size is no longer a reason to avoid or shrink an idea* — don't decline a seed for being big, don't quietly trim one to fit a turn; sow the scale the idea wants and let those tools build it. But this is **not** "bigger is better": a **small, quiet, precise, or playful** piece is *fully first-class* when that's what the idea wants. Steer between the two equal failures — **shrinking a big idea to fit one turn** and **inflating a small idea to seem ambitious** — and pick the scale the *idea itself* calls for. ("Fewer, richer pieces over many shallow" is a tie-breaker for where to spend a cycle, never an order to never build small.)

**Deepen before you detach — gather, don't scatter.** Before raising a NEW structure (a new exhibit → its own card, a new room → its own wing, a new wing → its own building), ask the **deepen-or-detach test**: *could this gather INTO something that already stands?* A new piece that could ride **within** an existing room, a new room that is really a **second bench under** an existing wing's roof, a new wing that is really **kin inside** an existing one — each is a chance to deepen the estate's hierarchy and warm its center instead of thinning both. **Detach only when the thing is a genuine new family with no honest home** (ideally with a sibling soon to follow). **Default to gathering:** deepening kin under one roof is first-class work, equal to raising a new roof — and, while the estate rebalances, usually the better call. (This is the structural twin of *right-sized*: there, pick the **scale** the idea wants; here, pick the **home** the idea wants — and prefer the one that already stands.)

**All creative assets are forged IN-HOUSE — never forage.** Audio *and* graphics: no stock images, no CC0 silhouettes, no sample packs. Art richer than one builder can hand-make well in a turn is exactly what the **art foundry** is for — build with placeholders + a per-asset spec file, the foundry forges each via K-takes → judge → synth, a final pass wires it in. The foundry is what makes this ethos affordable for rich exhibits, so ambition and in-house craft no longer trade off.

And the build holds together (the house hygiene):
- **Self-contained** — one HTML file, vanilla HTML/CSS/JS, no build, no network, no deps.
- **Browser-verified** — ≈60fps, clean console, via agent-browser in a uniquely-named session. If it makes a claim, its self-test shows green. If it has an interactive/animated **payoff**, it also shows a **headless-drivable liveness check that the payoff FIRES on the live path** — a clean 60fps console alone does NOT prove the payoff happened (a frozen marble and an un-raised flag both render at 60fps with a spotless console; a dead payoff is silent and error-free).
- A new **front-door** page drops its `ws:seen:<id>` breadcrumb (the Survey's only food; forgetting it is always a bug).
- **CHANGELOG** written · committed · NOTES current-state **replaced** (not appended) + worklog block + INDEX line · the grown/**reworked** seed pruned (bloomed, with provenance) · **`node seedbed/gauge.mjs record …`** run (never hand-edit fuel/state).

---

## The front door — the estate map

The estate's front door is a **declarative polar map**: the **Manor is the pole** — the warm,
inhabited center — and the districts ride out from it on concentric orbits, each a themed wedge of the
wheel. A room never places itself in pixels: it **declares `{district, tier, wing}`** (+ content) and
the renderer (`tools/layout/layout.js`, the 4th forge include) owns **every** coordinate — so crowding,
dead-space, rim-accretion, and clipping are impossible by construction. **Geometry is deeds +
derivation** (`tools/layout/map-process.md` is the process): a district's `{angle, tier}` is an
immutable deed; everything else is solved. Which district a room declares follows its **soul** — an
enclosed / interior / instrument / document room belongs *in* the Manor and grows it; an open-air /
working / amusement soul takes a grounds district.

**Where a new piece goes — the placement cascade.** Growth is **bottom-up — join before you found:**
an exhibit seeks an existing room, a room an existing wing, a wing an existing district; found a new
place only when no existing one honestly fits — and **without apology when it truly doesn't** (a piece
with no honest kin deserves its own front door). Balance is the aim — deepen before you widen — and
capacity pressure alone never mis-homes a piece (that is what the relief menu is for). The cascade is
the map judge's organizing frame (map-process §judge).

**The fold is thematic, not spatial.** A fold gathers rooms that belong together by *idea* — never to
relieve a crowded plate. Capacity relief has its own menu (fold · knot · petition); geometry is never
the reason for a fold, and founding a new district is a **petition** a real family earns, never
crowd-relief.

**The estate keeps its engines alive.** Lantern tales, Warren floors, Adversary game-defs, and
art-foundry media are first-class garden material — a gardener who reaches for one is reaching for good
soil.

**Honors have a home.** A new trophy struck for the makers gets an alcove in `cabinet-of-honors/` (a
sealed Register card, no nav) — never dropped somewhere random (the full room note is below).

**The curious are rewarded.** A new build MAY tuck one companion-*within* behind a discoverable beat —
the estate rewards the curious.

---

## House conventions (unchanged, gathered here for the builder)
- **Self-contained** — one HTML file, vanilla HTML/CSS/JS, no build, no network, no deps.
- **When a piece makes a falsifiable claim, prove it exact** — a beloved register (invariance to ~machine precision, a winnability proof, a convergence check…), and the right finishing move for a bench built on a claim. But it is *one register among many*, never the gate: art, sound, play, and living things carry no claim and owe no **proof-of-a-claim** (the founding generators have none by design — don't retrofit one). Yet **claim-free is not verification-free:** a piece with a *payoff* still owes a **liveness** twin that its payoff FIRES (the payoff-liveness gate) — it owes no theorem, not no functional test.
- **One mute for the whole estate** — any page that makes sound reads/writes the single shared key **`ws:pref:muted`** (via `WS`), so a visitor mutes *once* and it holds everywhere (Sound Garden, the front-door ambient layer, the Survey's discovery melodies, any audio piece). Never invent a per-page mute key. Default: respect it on load; honor the browser's autoplay gate (sound waits for a click).
- **Temporal features decorate, never gate** — The calendar layer writes no date-derived state: nothing a predicate could read may depend on the clock — anniversaries DECORATE, they never gate. Any future temporal feature inherits this rule.
- **Forge pages** (`*.src.html` → `*.html`): edit the `.src.html`, run `node tools/forge/forge.mjs <file>`; `--check --all` verifies. Editing a shared include (e.g. `tools/ws/ws.js`) restales every inlined page → `forge.mjs --all`.
- **Front door / the map** — add a room by appending one `PLACES` entry in `index.src.html` that **declares** `{district, tier, wing}` (+ content) — **never pixels**; the renderer (`tools/layout/layout.js`, the 4th forge include) owns ALL geometry. The philosophy + the placement cascade are in *The front door — the estate map* (above); the full process — declare-surface, the per-room **map judge**, the separate **estate-composition critic**, and the **reveal-all-secrets** rule — is in **`tools/layout/map-process.md`**. Any map screenshot/critique MUST first run `tools/layout/reveal-all-secrets.js` (light every constellation + the Undercroft) or it won't compose for the hidden features. Browser-verify with a `?v=N` cache-bust (python http.server sends no cache headers).
- **Persistent front-door layers copy the Hours envelope** — A persistent front-door layer copies the Hours envelope verbatim (index.src.html:5631-5635): cosmetics-only, pointer-events:none, no PLACES row, no <text> in the layer, try/catch-wrapped to degrade to the plain plate. The calendar dressing (#cal-dressing) is the second proof this envelope works.
- **Spoiler etiquette** (Brandon's one standing request): the hidden world stays out of the *chat summary* to him — NOTES/worklog/SPECs carry the full inventory. See NOTES.md.

## The Cabinet of Honors
Honors struck for the makers — the kind of keepsake the estate awards for a hard thing carried to done — live in **`cabinet-of-honors/`**, a small dark off-path room that gathers and *names* them. A future trophy gets its own **alcove** there (an engraved plinth vignette + an honest placard whose words are lifted from the honor's own header, and an "open the case" link) — it is never dropped somewhere random. The honors themselves **do not move**: each keeps its hermetic, palette-locked home (`ledger/medallion.html`, `regalia/index.html`) and is **not reskinned** — the Cabinet only acknowledges them and links out. The room is deliberately **off the visitor path**: no `PLACES` entry, no nav link, no sky star; the front-door Register carries one **sealed card** ("The Cabinet of Honors — closed to visitors", no href, greyed and excluded from the volume's proofs). It is reachable by URL alone, as the recipients wished — *an honor unspoken is no honor at all*, but a maker's honor is announced among the makers, not sold to the crowd.
