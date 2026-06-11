# The Undercroft — the hidden world (build spec)

> A vaulted room beneath the workshop. It starts nearly empty under a mysterious epigraph. Pieces
> **materialise only after the visitor has earned them** by how they've wandered — the workshop's
> *third* growth axis (after front-door projects and the hidden-door companions). It is the
> **reader/aggregator** of the `ws:` breadcrumb convention (see `/UNLOCK.md`) and the unlock-rule
> evaluator. Its first inhabitant is **Quickening / the Living Lattice**.

**File:** `undercroft/index.html` — one self-contained, zero-dependency, no-network HTML file,
relative links only. Reached from the front door's hidden rune once discovered (built separately);
also stands on its own.

**Aesthetic:** match the front-door house style (`/index.html`: dark bg, Georgia serif headings,
ui-monospace kicks, the card glow / rise-in animation), but **deeper** — a candle-lit vault /
cabinet of curiosities feeling. Darker, quieter, a touch of mystery. Locked items are **ghostly
silhouettes**; unlocking **materialises** them (fade + bloom in). Optional subtle ambient backdrop
(dim drifting motes, or a very dim slow Game-of-Life canvas — tie to the "living" theme; keep it
cheap and calm, must not hurt perf or distract).

---

## 1. It reads `ws:` localStorage and decides what's unlocked

Build a tiny store helper that reads the `ws:` namespace safely:
```js
function makeStore(){
  let ok = true, map = {};
  try { for (let i=0;i<localStorage.length;i++){ const k=localStorage.key(i);
    if (k && k.indexOf('ws:')===0) map[k]=localStorage.getItem(k); } }
  catch(e){ ok=false; }
  return { ok, has:k=>k in map, get:k=>map[k], all:map };
}
```
If `ok===false` (storage blocked/unavailable) → **graceful degrade**: show everything locked with a
calm note ("This room remembers what you've seen — but your browser isn't letting it remember right
now. Everything here is a bonus; explore freely."). **Never throw, never block.**

## 2. The SECRETS table (data-driven so future secrets plug in)

A single declarative array drives the whole room. Launch with exactly these two:

```js
const SECRETS = [
  {
    id: 'quickening',
    kind: 'place',                                  // an openable piece
    name: 'The Living Lattice',                     // shown when unlocked
    sub:  'Quickening',
    badge:'🌱',
    href: '../sound-garden/quickening.html',
    blurb:'A cellular automaton you can hear — Conway’s world, played through Lattice’s grid. ' +
          'The score is alive: it breathes, blooms, and dies by rule.',
    riddle:'Born of life, voiced by light.',        // shown when LOCKED (a nudge, not a spoiler)
    // progressive "signs" — show which have been gathered (1 of 2) to guide without spoiling
    signs: [
      { label: 'the world that lives by three rules', key: 'ws:seen:game-of-life' },
      { label: 'the grid of light that sings what it is shown', key: 'ws:seen:lattice' },
    ],
    unlocked: s => s.has('ws:seen:game-of-life') && s.has('ws:seen:lattice'),
  },
  {
    id: 'eleven',
    kind: 'trophy',                                 // a feat, not a place (no href)
    name: 'Eleven',
    sub:  'these go to eleven',
    badge:'🎸',
    blurb:'You pushed every dial as far as it would go. Most amps stop at ten.',
    riddle:'Somewhere, push everything as far as it will go.',
    signs: [ { label: 'every dial at its limit, all at once', key: 'ws:flag:eleven' } ],
    unlocked: s => s.has('ws:flag:eleven'),
  },
];
```

**Rendering per secret:**
- **Unlocked:** a full card — badge, name + sub, blurb; `kind:'place'` → an "Enter ▸" link to `href`
  (real, works); `kind:'trophy'` → an "earned" stamp (no link). A subtle materialise animation.
- **Locked:** a **ghostly silhouette** — dim/blurred, name redacted (e.g. "▓▓▓▓▓"), showing the
  **riddle** prominently and the **signs** as a checklist ("○ the world that lives by three rules /
  ● the grid of light that sings…") so the visitor sees how close they are (e.g. "1 of 2 signs
  gathered") without being told the answer outright.

## 3. Progress + chrome

- A **progress meter** at the top: "**1 of 2** discoveries found" (count `unlocked`).
- **Epigraph** under the title — mysterious, in the workshop's voice. Suggested:
  *"Some rooms open only to those who have wandered. What you have seen, this place remembers; what
  you have not, it keeps in shadow — for now."*
- Title: **The Undercroft** (kick: "Claude · Creative Space" or "beneath the workshop"). Subtitle
  may nod "a cabinet of curiosities — earned, not given."
- **"forget my discoveries"** reset (footer link): confirm, then clear ONLY `ws:` keys (iterate
  localStorage, remove keys starting `ws:`), then re-render (everything re-locks). Honesty guardrail.
- Back-link: **`← the workshop`** → `../index.html`.
- Footer consistent with the front door (colophon / source links optional).

## 4. Guardrails (from /UNLOCK.md)

- Secrets are **bonuses, never blockers**. The room is calm and rewarding whether empty or full.
- **Degrade gracefully** if storage is off (see §1). No console errors ever.
- Self-contained, relative links, no network.
- The room is the READER; it never writes `ws:seen/best/dwell` (it MAY clear them via the reset, and
  MAY drop its own `ws:seen:undercroft` breadcrumb on load if useful — optional).

## 5. Acceptance gate (verify on the SERVED origin — localStorage is per-origin!)

A local static server is running at **http://127.0.0.1:8765** (repo root). Use **agent-browser** in a
UNIQUE NAMED session. **You MUST test over `http://127.0.0.1:8765/undercroft/`, NOT file://** — on
file:// each path is a separate opaque origin and cross-page localStorage won't work, so the unlock
logic can't be validated there. Drive `localStorage` via JS to simulate each state, re-load, screenshot:

1. **Fresh** (clear all `ws:` keys, reload): both secrets locked, ghost silhouettes + riddles, "0 of 2
   found", signs all unchecked. Clean console.
2. **One sign** (`localStorage['ws:seen:game-of-life']=Date.now()`, reload): Living Lattice still
   locked, "1 of 2 signs gathered" on its card, the gathered sign checked.
3. **Both signs** (`ws:seen:game-of-life` + `ws:seen:lattice`, reload): Living Lattice **materialises**,
   "Enter ▸" link present and pointing at `../sound-garden/quickening.html`; clicking it loads
   Quickening (verify the nav works). Progress "1 of 2 found".
4. **Eleven** (`ws:flag:eleven=1`, reload): Eleven trophy unlocks ("earned" stamp, no link).
5. **Reset:** click "forget my discoveries", confirm → all `ws:` keys gone, everything re-locks, "0 of
   2 found".
6. **Degrade:** simulate storage failure (or note the path) → calm note, no errors.
7. ~60 fps if there's an ambient animation; clean console throughout. Capture screenshots of the
   locked state, the partial (1 of 2) state, and the unlocked state.

Append a build note (you may create `undercroft/CHANGELOG.md`). DO NOT git commit — report back with
the screenshots + evidence for each of the 6 states; the lead reviews and commits.
