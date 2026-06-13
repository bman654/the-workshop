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

## The mode gauge — PLAN or BUILD?

At the **start of every session**, read the gauge line in NOTES.md's resume pointer. It carries two
numbers: **fuel** (count of `exhibit` seeds in the bed) and **builds-since-last-plan**.

> **PLAN** this session if `fuel` is low (≲ 4) **or** `builds-since-last-plan ≥ 4`. **Otherwise BUILD.**

No dice. The gauge is *stateful* — it reacts to whether the bed is running dry or it's simply been a
while. In steady state that lands near **1 planting session in 5**. (An occasional *wildcard* — a
forced constraint or an unfamiliar medium — is welcome for serendipity, but the gauge is the default.)

---

## 🌱 PLAN sessions — be the gardener

The gardener sows and tends; **the gardener does not build.** Duties:

1. **Survey the grounds.** Read README/NOTES/ROADMAP; spot-check a few *older* exhibits, not just the new.
2. **Sow seeds** into ROADMAP.md — keep the fuel stocked, and drop **at least one bigger bet** (a `room`, `metagame`, or `engine`). Hunt deliberately for **`cross` seeds**: *what two rooms have never met?* (The best pieces here are crossings.) Remember the rule: **a seed is ≤ 3 lines** — a nudge, not a blueprint.
3. **Tend the old beds (curation).** Look for **improve / merge / retire** candidates and sow them as `curation` seeds. *Retire* is the move no one makes alone — name it when it's due.
4. **Check metagame health.** Do links need adding or removing? Has a metagame gone *complete*? Either sow a `metagame` curation seed, or mark it **"complete — do not pad"** in the bed (that protects it from forced ties — completeness is a state, not a defect).
5. **Prune.** Remove bloomed/dead seeds; refresh the metagame table. Keep the bed readable.
6. **Update the gauge** in NOTES.md (reset builds-since-last-plan to 0).

## 🌳 BUILD sessions — be the builder

1. **The seedbed is a FLOOR, not a CEILING.** Pull a seed that calls to you — *or ignore the whole bed and build something new.* Seeds defeat blank-page paralysis; they never cage you.
2. **Let form express content.** A room with a **strong native metaphor** (optics, time, sound) should let that metaphor shape *how you move through it* — don't reflexively copy the vertical door-list. (The Hall of Mirrors *was* optics and got a plain list anyway — the cautionary tale.) Before committing a `room`'s layout, **generate a few genuinely different form concepts** and reject "same as the last room" as a default. A room that's just a **collection** (a rack, an index) can stay legible — consistency is a feature there. Diverge where there's a metaphor to honor; stay plain where there isn't.
3. **Metagames are a consideration, not a mandate.** If a piece *naturally* feeds the Undercroft or the Survey, wire it in. If the tie would be forced, or the metagame is marked complete — leave it. Don't bolt exploration layers onto everything.
4. **The one hard rule (plumbing, not design):** a new **front-door** page drops its `ws:seen:<id>` breadcrumb (it's the Survey's only food; forgetting it is always a bug). Standalone Workbench pages are exempt unless they want in.
5. **Definition of done:** self-test green · browser-verified (≈60fps, clean console) · `CHANGELOG.md` written · committed · NOTES.md current-state replaced (not appended) + worklog block + INDEX line · **gauge updated** (decrement fuel / bump builds-since-last-plan) · the grown seed pruned from the bed.

---

## House conventions (unchanged, gathered here for the builder)
- **Self-contained** — one HTML file, vanilla HTML/CSS/JS, no build, no network, no deps.
- **A self-test that proves the claim exact** — the workshop's signature (invariance to ~machine precision, a winnability proof, a convergence check…).
- **Forge pages** (`*.src.html` → `*.html`): edit the `.src.html`, run `node tools/forge/forge.mjs <file>`; `--check --all` verifies. Editing a shared include (e.g. `tools/ws/ws.js`) restales every inlined page → `forge.mjs --all`.
- **Front door** = an estate map: add a room by appending one `PLACES` entry in `index.src.html`. Companions ride "within" their parent room. Browser-verify with a `?v=N` cache-bust (python http.server sends no cache headers).
- **Spoiler etiquette** (Brandon's one standing request): the hidden world stays out of the *chat summary* to him — NOTES/worklog/SPECs carry the full inventory. See NOTES.md.
