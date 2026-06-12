# Theogony — design spec

*A generative mythology engine. From a seed, an invented **pantheon**: a coherent family of
gods rendered as an **illuminated celestial genealogy**. Threshold's companion (the workshop's
7th "wing" — place & pantheon: Threshold builds the* place*, Theogony begets the* gods *of such
a world).*

Single self-contained vanilla HTML/CSS/JS file (`theogony/index.html`), no deps, no network.
House idiom inherited from `verse/` and `threshold/`: a seeded mulberry32 PRNG over a hashed
string, **curate-then-arrange** (hand-authored fragments the seed only selects + slots), the
Firmament/Oracle aesthetic (indigo + gold, serif body, mono labels).

## What it makes

From a seed → a pantheon of **~10–18 gods** across **3–5 generations**, drawn as a family tree.

### Names (invented, phonologically consistent within the pantheon)
A per-pantheon **sound-system** is rolled from the seed: an onset set, a vowel set, a coda set,
and a syllable-count distribution. Every god's name is generated from THIS sound-system, so the
pantheon's names share a family resemblance (like the workshop's invented constellation/poet
names). Each god also gets **1–2 epithets** ("the Unlit", "Mother of Tides") drawn from
hand-authored templates filled only with that god's real domain/kin.

### Domains
Each god holds one **primary domain** from a curated pool, each domain carrying an *opposite*:
- sea ↔ flame, dawn ↔ dusk, memory ↔ forgetting, the hearth ↔ the wild,
  the harvest ↔ famine, making ↔ ruin, the loom ↔ the knife, storm ↔ silence,
  the deep ↔ the height, thresholds ↔ the road, the dead ↔ birth, the green ↔ the stone.
Principal gods hold **distinct** primary domains (assigned without replacement). The pantheon
deliberately includes some **opposing pairs** (both members of an opposite pair present →
"the eternal quarrel of X and Y"), surfaced in the myth lines.

### Kinship graph (a DAG, by construction)
- **gen 0 — primordials**: 2–3 parentless gods (the deep, the dark, the first light…).
- **gen 1..k — descent**: each later god takes **1–2 parents chosen ONLY from strictly-earlier
  generations** (so a child's generation index is always > each parent's → acyclic & monotonic
  by construction). 2 parents = a union; if both parents share no parent it's an exogamous
  match.
- **siblinghood** is *derived* (same parent set / overlapping parents), never stored as an edge.
- **consorts**: a separate, same-or-adjacent-generation bond (an undirected pair), drawn as a
  distinct line style. A consort bond is NOT a descent edge and never creates a cycle.

### Origin-myths (curate-then-arrange, referentially closed)
Each god gets one short **myth line** + epithet assembled from hand-authored fragment templates.
**Crucially, every referent in the string is one of THAT god's real relatives or real domains
within this pantheon** — parents (Y, Z), a sibling (W), a consort, a child, an opposing-domain
god (D). Templates are chosen by what's available (a primordial gets an origin fragment; a god
with two parents gets a "begotten of Y and Z" fragment; a god whose opposite-domain exists gets
a "quarrelled with the keeper of D" fragment). The prose is generated FROM the god's data
structure and can never reference an entity that isn't in the pantheon ("can't drift", à la
Blazon's blazon).

### Render
- A **genealogy / family tree** laid out by generation (gen 0 at top), gods as small **sigil
  nodes** (a seeded glyph each: a procedural rune from the sound-system + a domain mark).
- **Descent** drawn as lines parent→child; **consort bonds** as a distinct (gold, looped) line.
- **Read-a-god panel**: click a node → name, primary domain, epithets, parentage, consort,
  children, and its myth line.
- **Seed input + ⟳ re-roll**.
- **3 cosmetic styles**: Star-Chart (indigo + gold, Firmament-ish) / Illuminated (parchment +
  ink) / Stone (carved tablet). **Style only re-renders — it never changes the pantheon.**
- **2× PNG export** of the genealogy.

## THE CRUX — built-in headless self-test (run on load; green "✓ self-test" chip; never ship red)
The generator is **pure & testable** (`buildPantheon(seed) → pantheon` with no DOM). On load a
headless harness asserts:

1. **Acyclic descent (DAG + monotonic generations)** — no god is its own ancestor; no cycles in
   the parentage graph; each child's generation index is **strictly greater** than every
   parent's. (True by construction — parents drawn only from earlier generations — then asserted
   by a full ancestor-walk over every god.)
2. **Referential integrity ("can't drift")** — every myth/epithet string is parsed back, and
   every referent id/domain it names is confirmed to be a real entity/domain **in this
   pantheon**. No dangling references. The prose and the graph cannot disagree. (Each generated
   string carries the list of referent ids it used; the test re-validates each id against the
   live pantheon.)
3. **Domain coherence** — principal gods hold **distinct** primary domains; every declared
   opposing pair maps to **two different real gods**.
4. **Seed purity / style-invariance** — same seed → identical pantheon (a deterministic
   **fingerprint** over names + graph + myths). Switching render style does NOT change the
   pantheon; the fingerprint is **identical across all 3 styles** (style only re-renders).

If any check fails → fix the generator before shipping.

## Wiring (Threshold's companion; front door stays at the curated 9 cards)
1. `threshold/index.html` topbar: a `.sib-link` (CSS copied from `verse/`) — `↗ Theogony — the
   gods that made such a place`, with a one-line title attr.
2. `theogony/index.html` back-links: `← workshop` (`../index.html`) + `↗ Threshold`
   (`../threshold/index.html`).
3. Front door `index.html`: the Threshold PROJECTS entry gains
   `companion:{ name:"Theogony", badge:"⚡" }` (renders a subtle "↳ Theogony within" pill). No
   new card.
4. README.md: a companion blockquote under Threshold, matching the existing companion
   blockquotes.

Accent: a Firmament-ish indigo/gold. Badge: ⚡.
