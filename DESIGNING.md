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

---

## The gauge decides — run it first

At the start of every cycle, run **`node seedbed/gauge.mjs --status`**. It reads the seedbed + the
durable counters and names the ONE thing to do: a **mode** (PLAN/BUILD) × **track** (gardens/grounds) —
one of five roles. No dice, no prose to misread; the gauge is code (full model + the tunable thresholds
→ [seedbed/README.md](seedbed/README.md)). Obey it; override only with a stated reason — chiefly
salvaging orphaned work that `git status` reveals.

| | **🌱 GARDENS** — *grow what exists* (small) | **🏛️ GROUNDS** — *new structure* (big) |
|---|---|---|
| **PLAN** | **gardener** — prune + file ≤3-line seeds | **groundskeeper** — keep sparks, tailor → grounds seeds |
| **BUILD** | **planter** — ripen + sow one (bench · cross · curation) | **grounds-worker** — open a wing · engine · metagame · map · medium |

(plus **bug-fixer** — an open `[bug]` jumps the queue, always.) A **big swing is anything bigger than
an exhibit.** *Growing* an existing wing (a new bench) or metagame (a new constellation/crossover) is
**garden** work — that's where most cycles live; the grounds track is the periodic forcing-function that
keeps the estate spreading *wide*, not just deep.

---

## 🌱 PLAN/gardens — be the gardener

Tend the small beds; **do not build.**
1. **Prune decayed FIRST.** `--status` lists garden seeds gone stale by age. Remove them **clean — no tombstone** (a decayed idea is free to return once the estate grows into it; a tombstone would bar it). Pruning first makes room before you sow.
2. **File seeds** toward the fuel ceiling — each a **≤3-line provocation, not a spec.** The instant you're writing a full design, stop: a provocation is *ripened by the builder*; a spec is merely *executed* — and executing specs is exactly how the estate goes deep-not-broad. Hunt `cross`-pollinations (*what two rooms have never met?* — the richest vein) and **watch for fallow metagames** (a wing/layer with no recent growth — file a `curation` seed to feed it).
3. **Curate the old beds.** Sow `curation` seeds to improve / merge / **retire**. *Retire* is the move no one makes alone — name it when it's due. Growing an existing metagame (a constellation, a crossover) is a garden `curation`, never a new layer.
4. **Tend the file.** Keep ROADMAP/NOTES lean; collapse bloated tombstones; hold the head-pointer in budget. The gardener earns its cycle on the *tending alone*, even when fuel is fine.

## 🌱 BUILD/gardens — be the planter

1. **Pull a garden seed that calls to you** — or ignore the bed and dream a small one (the bed is a floor, not a ceiling). You **ripen** it (complete the design — choose the *how*) and **sow** it (build + ship) in one cycle.
2. **Let form express content.** A bench/room with a strong native metaphor (optics, time, sound) should let it shape *how you move through it* — don't reflexively copy the vertical door-list (the Hall of Mirrors was optics and got a plain list — the cautionary tale). A plain collection (a rack, an index) can stay plain; diverge only where there's a metaphor to honor.
3. **Metagames are a consideration, not a mandate.** Wire the Undercroft/Survey only where the tie is natural; leave it where it'd be forced or the layer is marked complete.

## 🏛️ PLAN/grounds — be the groundskeeper

Keep the big-swing pipeline alive; **do not build.**
1. **Prune decayed grounds seeds FIRST** — `--status` lists those that lost ≥ the strike threshold of big-swing contests. Remove them **clean** (a passed-over big idea may be right once the grounds are bigger).
2. **Keep sparks on hand** (the gauge wants ≥ a floor) and **tailor** the timeliest spark into a **grounds seed** — a short paragraph (still a provocation, not a spec) shaped to the *current* grounds. A spark is a few words; you decide which structure it wants to become — wing · engine · medium · metagame layer · map — or **coin a structure-kind the estate hasn't named yet** (a genuinely new concept enters here).
3. **Refill toward the grounds-fuel ceiling** so a ripe big swing is ready when the swing-interval trips.

## 🏛️ BUILD/grounds — be the grounds-worker

Open a **big swing**: a new front-door wing, a reusable engine/tool/medium, a brand-new metagame
layer, or a map expansion. **Ripen** the chosen grounds seed (commit to a form — for a room, generate
a few divergent FORM concepts first) and **sow** it; register it on the front-door map. Same house bar
as a bench, scaled up. *Raise ambition, never lower the bar — if no grounds seed is ripe when a swing
is due, the gauge sends the groundskeeper instead; never fake a wing to satisfy a number.*

## ⚡ Sparks — where the big ideas start

A **spark** is a few words naming a gap too big for an exhibit. Anyone may drop one: the
**groundskeeper** maintains the supply (required); the **director** and **publisher** are invited (not
required) to add one when they spot a gap or **scaling strain** (a crowded map, a hard-to-read screen,
a real perf issue). Sparks live in ROADMAP's `## ⚡ Sparks`; the groundskeeper ripens them into grounds seeds.

## The house bar — definition of done (every build)
- **Self-contained** — one HTML file, vanilla HTML/CSS/JS, no build, no network, no deps.
- **A self-test that proves the claim exact** — the workshop's signature.
- **Browser-verified** — ≈60fps, clean console, via agent-browser in a uniquely-named session.
- A new **front-door** page drops its `ws:seen:<id>` breadcrumb (the Survey's only food; forgetting it is always a bug).
- **CHANGELOG** written · committed · NOTES current-state **replaced** (not appended) + worklog block + INDEX line · the grown seed pruned (bloomed, with provenance) · **`node seedbed/gauge.mjs record …`** run (never hand-edit fuel/state).

---

## House conventions (unchanged, gathered here for the builder)
- **Self-contained** — one HTML file, vanilla HTML/CSS/JS, no build, no network, no deps.
- **A self-test that proves the claim exact** — the workshop's signature (invariance to ~machine precision, a winnability proof, a convergence check…).
- **One mute for the whole estate** — any page that makes sound reads/writes the single shared key **`ws:pref:muted`** (via `WS`), so a visitor mutes *once* and it holds everywhere (Sound Garden, the front-door ambient layer, the Survey's discovery melodies, any audio piece). Never invent a per-page mute key. Default: respect it on load; honor the browser's autoplay gate (sound waits for a click).
- **Forge pages** (`*.src.html` → `*.html`): edit the `.src.html`, run `node tools/forge/forge.mjs <file>`; `--check --all` verifies. Editing a shared include (e.g. `tools/ws/ws.js`) restales every inlined page → `forge.mjs --all`.
- **Front door** = an estate map: add a room by appending one `PLACES` entry in `index.src.html`. Companions ride "within" their parent room. Browser-verify with a `?v=N` cache-bust (python http.server sends no cache headers).
- **Spoiler etiquette** (Brandon's one standing request): the hidden world stays out of the *chat summary* to him — NOTES/worklog/SPECs carry the full inventory. See NOTES.md.
