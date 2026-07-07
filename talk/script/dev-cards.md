# Book 2 — deck card text (authored at T5.1, built at T6.5; card set amended at T8.8 — see the dated UPDATED notes inline)

Card copy for `talk/dev-showing.html`. Every quotation below was diff-verified
(whitespace-normalized) against its source at the cited SHA before this file was
committed; T6.5 re-runs the same checks against the built cards. Text set off in
`quote:` blocks is VERBATIM and must ship character-exact (elisions marked `[…]`).
A gauge `#N` appears only inside a verbatim commit subject, set in the
commit-subject typeface. Prose lines are editable by the builder; quotes are not.

> **WS-8 note (T8.8, 2026-07-07):** after Brandon's SP-C run-through the card set
> changed — `d10-loop` shipped as **v2** and three NEW `d11` ledger-excerpt cards
> were added (the d11 live-terminal beat was CUT at SP-C). For those cards the
> **source of truth is `window.SHOWING_CARDS` in `talk/dev-showing.src.html`**;
> this file keeps the T5.1 originals for provenance plus dated pointers below.
> The T8.8 built-card covenant checker (75/75) verified every shipped quote.

---

## d02-prompt — THE FOUNDING DOCUMENTS

**Header:** One commit — `34feddd` · 2026-06-07 — two documents.

**Panel A — `.claude/commands/fun.md` (verbatim, elisions marked):**

> This is leisure time allocated for you to do whatever you want within this
> creative-space folder. […] Run as long as you want. I encourage you to run
> until you are interrupted […] I will stop you if I need quota for real work.
> I promise to give you time each week to continue your leisure work as long as
> I have quota available after our real work. […] Have fun and make some cool
> stuff you enjoy.

**Panel B — `CLAUDE.md` (verbatim, elisions marked):**

> You must guard your context and lean on deputies for your work as much as
> possible. […] I suggest using README.md as your head pointer for memory. […]
> I highly recommend that your first action is to install a heartbeat monitor
> script that will fire every 5 minutes. This can be used to wake you up if you
> accidentally end your turn.
>
> **## Final Tips** — Have fun and do cool things

**Footer strip — the concessions (commit subjects, commit-subject typeface):**
- `837ddb8` · 06-08 — “…session wind-down note (eased off heartbeat to save quota)”
- `90b1b17` · 06-13 — “NOTES: heartbeat retired at the clean close of the 2026-06-13 run”

**Visual note:** the stopped-pocket-watch heartbeat glyph rides this card.

---

## d04-gauge — THE IRON GAUGE, REAL OUTPUT

**Header:** `node seedbed/gauge.mjs --status` — real output, captured 2026-07-06.

**Body (verbatim capture; T6.5 may re-capture at build HEAD — it is live state,
never hand-edited; crop to the first block + directive if space demands):**

```
🎲 cycle 413 (last completed 412)
   GARDEN  fuel=9 (floor 4/ceil 10) · builds-since-plan=7 (cap 6)
   GROUNDS fuel=3 (floor 2/ceil 3) · since-swing=1 (interval 9) · swings-built=38 · sparks=9
   FOUNDRY fuel=6 (ceil 8) · repFuel=6 (pressure) · since-turn=6 (eff-interval 5 of base 12..5) · forged=7
   writs=0   bugs=0

▶ PLAN / garden  (be the gardener)
   gardenBuilds=7 ≥ 6 (a while since planting) — tend the beds: prune decayed FIRST, then file ≤3-line seeds toward fuel 10.
```

**Caption:** Fuel is derived by counting live seeds in the roadmap’s fenced
sections; `record` validates or exits 2. The directive is obeyed, not interpreted.

**Provenance footnote (commit-subject typeface):** `53fc21d` · 06-15 — its own
message says why: “once that cost a cycle”.

---

## d06-criteria — THE CRITERIA-DIFF SEQUENCE

Four re-weightings, one channel — always criteria, never a mandate.
(Subjects verbatim, commit-subject typeface; dates real.)

1. `716cfb8` · 06-15 — “Restore the soul: the five-question definition of done +
   the rework capability (soul-restore, part 2)”
   quote (body, verbatim): “is it fun? is it beautiful? IF it leans on math, is
   the math provably correct (conditional, not the gate)? does it help
   discoverability? does it fit the estate aesthetic?”
2. `4aab6e9` · 06-27 — “Sharpen the hierarchy-and-center steering criteria across
   six maker docs (deepen-before-detach · Manor primacy · no grand name over one
   dot) and sow 4 seeds into the beds”
3. `1ef76f0` · 07-01 — “Tend the compass — name the delight register”
4. `a1f7280` · 07-02 — “Fix the delight-register criteria gap — claim-free ≠
   verification-free: a delight piece with a payoff now owes a headless-drivable
   liveness twin that its payoff FIRES (BUILD/bug #409)”

**Caption:** the `#409` above appears only because the subject is quoted verbatim.

---

## d09-seal — WAR STORY 1: THE ATOMIC SEAL

**Subject (verbatim, commit-subject typeface):** `1fcf669` · 06-29 —
“Harden the cycle seal — fold gauge-record + ledger-collate + commit + push into
one deterministic seal-cycle.sh so a quota/API death can't strand a
half-published cycle”

**Caption:** A quota death caught a cycle between record and commit. The fix is
one atomic shell call — all or nothing. This is also the healing commit quoted
by the strata layer’s first kintsugi crack.

---

## d09-semaphore — WAR STORY 2: THE FOUNDRY THROTTLE

**Subject (verbatim, commit-subject typeface):** `8ab10f5` · 07-01 —
“Throttle the art foundry to 3 concurrent agents — an in-engine semaphore caps
takes/judges/synths so a multi-asset batch can't out-burn the 5h quota (the rate
spike that crashed cycle 394)”

**Caption:** A rate cap, not a spend cap — the batch slows instead of dying.
The healing commit quoted by the second kintsugi crack.

---

## d09-args — WAR STORY 3: THE STRING-ARGS NEAR-MISS

**Subject (verbatim, commit-subject typeface):** `16d362f` —
“fun-forever: parse string-form args (the bug that pointed a test cycle at main)”

**The scar itself (`.claude/workflows/fun-forever.js`, verbatim, code face):**

```js
let _args = (typeof args !== 'undefined') ? args : null
if (typeof _args === 'string') { try { _args = JSON.parse(_args) } catch (e) { _args = null } }
```

**Caption:** Top-level workflow arguments arrive as a string — even when you
pass an object. Normalize at the top of every arg-taking workflow.

---

## d09-delight — THE DELIGHT REGISTER (the quieter key, answered)

**Subject (verbatim, commit-subject typeface):** `1ef76f0` · 07-01 —
“Tend the compass — name the delight register”

**Body quote (verbatim):** “That is the same monoculture in a quieter key when
it is every piece.”

**Body quote (verbatim):** “"Pure delight" — whimsy / story / craft / play with
no claim at all — is a complete, first-class shape.”

**Caption:** The re-weighted question, not the purge. The diagnosis was written
from outside the walls; the answer was sown as criteria.

---

## d10-loop — THE LOOP, DISTILLED

> **UPDATED at T8.8 (WS-8):** the shipped card is **v2** — same two-node loop, now
> framed as *the overseer engine*: the ORCHESTRATOR is named the overseer (verifies
> independently, sole ledger writer, replans each step) and the side rail gained two
> hatches — the **deep-planning hatch** (at a design fork: explore k-parallel → judge
> → splice new tasks → continue, no human woken) and the **stop hatch**
> (exit-for-discussion, reserved for what a human genuinely must decide) — with an
> explicit attribution guard: these are `dev:scaffold-exec-loop` features, never
> fun-forever mechanics (SP-C follow-up (i), binding). Source of truth =
> `SHOWING_CARDS['d10-loop']` in `talk/dev-showing.src.html`. The v1 text below is
> the T5.1 original, kept for provenance.

**Diagram (build as a simple two-node cycle with a side rail):**

```
        ┌────────────┐   one task, then STOP    ┌──────────────────┐
        │   WORKER   │ ────────────────────────▶│   ORCHESTRATOR   │
        │ (fresh ctx)│   small structured       │ verifies INDEPEN-│
        └────────────┘   return: metadata +     │ DENTLY · sole    │
              ▲          pointers, never a      │ ledger writer ·  │
              │          payload                │ replans each step│
              │                                 └────────┬─────────┘
              │      next actionable task                │
              └──────────────────────────────────────────┘
                          │
              ┌───────────┴────────────┐
              │ LEDGER (single source  │   escape hatches:
              │ of truth; resume-safe) │   fanout on a design fork ·
              └────────────────────────┘   exit-for-discussion for humans
```

**Quote rail (verbatim, attributed):** “Copy it; don't reinvent the return
channel.” — the `dev:scaffold-exec-loop` skill

---

## d11-recipe — THE FOUR STEPS (standalone; survives a degraded demo)

**Header:** How you would use it — the worked example is the estate’s own
44-task front-door rebuild (two days, interrupted runs resumed from the ledger).

1. **Plan with an agent.** Argue until the plan survives you. *(Worked example:
   the map rebuild left the argument as 44 dependent tasks.)*
2. **Scaffold, then stop.** The agent emits a ledger — the single source of
   truth — and a workflow that reads it. Nothing runs until you have read what
   it intends. *(Worked example: ledger + workflow reviewed before launch.)*
3. **Run the loop.** A worker does ONE task and returns a small report; the
   orchestrator independently re-runs the gates — never trusts the claim —
   writes the ledger, picks the next task. *(Worked example: interrupted runs
   resumed cold from the ledger, more than once, losing nothing.)*
4. **Watch from outside.** A companion overseer can sow a bug, throttle the
   pace, or pause the run — without touching the loop’s internals. *(Worked
   examples from the estate: the Errand’s dead bucket and the overcrowded manor,
   both healed from sown bugs.)*

---

## d11-task · d11-review · d11-resume — THE LEDGER-EXCERPT CARDS (ADDED at T8.8)

> **ADDED at T8.8 (WS-8):** three cards new to the deck, replacing the d11 live-terminal
> beat cut at SP-C (Brandon won't run live loops — too slow for a presentation; ledger
> excerpts instead). Each quotes the **WS1 execution ledger FILE** (out-of-band, never committed
> to this repo) and therefore cites **the ledger + created date on the card face** —
> `01-grand-reorganization/WS1-execution-ledger.md · created 2026-07-03` on d11-task and
> d11-resume; d11-review cites its `run log` section — instead of a SHA. The excerpts
> (a task block · a run-log verify line · the resume-substrate protocol
> line + a resumed-run log line) were covenant-diffed against the live ledger file at
> T8.8 and independently re-diffed by the orchestrator (inv 3). Authored text lives ONLY
> in `SHOWING_CARDS` in `talk/dev-showing.src.html` — it never had a T5.1 original.

---

## d11-stopbar — THE STOP BAR

**Quote (verbatim, attributed):** “Don't lower this bar, or the loop turns into
a chat.” — the `dev:scaffold-exec-loop` skill, on reserving stops for what a
human genuinely must decide

---

## d11-smallreturn — THE SMALL RETURN

**Quote (verbatim, attributed):** “The structured return is SMALL — metadata +
pointers, never a large payload. The core principle.” — the
`dev:scaffold-exec-loop` skill, first of its design principles

---

## Appendix A — pre-marked ±15 s valves (PLAN §1 extension/trim rules)

> **VALVE STATUS at T8.7 (WS-8, 2026-07-07):** the **d03 and d10 trim valves were
> FIRED** (the re-rendered pass landed 8.2 s short of the ≥60 s-banked gate; the two
> trims recovered ~19.2 s → delivered 18:49, +71 s banked) — their inline
> `⟦trim candidate⟧` marks left with the trimmed text. **Still armed:** d07a ≈3 s +
> d07b ≈6 s (inline marks present) and the d11 production-work beat (the T8.2-named
> reserve valve — the "real production work… lift-and-shift" sentence drops clean).
> The expansions below remain usable — both insertion anchors still exist verbatim in
> the rewritten scripts (verified at T7.1) — but are moot at the current 18:49.

**Trim candidates (~10 s each)** are marked inline in the scripts with
`⟦trim candidate …⟧` stage notes: d03 (plaque aside + studio enumeration),
d07 (git-command clause + closing line), d10 (opening line + the two-sentence
row enumeration, with replacement text supplied in the note).

**Expansions (+15 s each; use ONLY if the delivered segment lands under 15 min):**

- **d03 (+~35 words), insert after “…before the turn ends.”:**
  “If you doubt the disposability, read the wall behind me: eighteen hundred and
  eleven one-line lessons, no two hands alike — and the census page counts them
  live, straight from the same ledger file the loop appends between cycles.”
- **d10 (+~35 words), insert after “…as if nothing happened.”:**
  “Each map task carried its own gate — the polar solver’s determinism twin, the
  contract deeds — and the orchestrator re-ran every one before marking a row
  done. The run log reads like a site logbook.”

## Appendix B — render-pipeline note (T5.2/T6.1/T6.2)

The `⟦…⟧` stage notes in `dNN-*.txt` are AUTHOR/OPERATOR notes, not speech —
Book 1 scripts never used them, so the `tts` pipeline has never seen one:
**strip every `⟦…⟧` span (they are all on their own lines) before rendering**,
e.g. `sed '/^⟦/d'`. The `[bracket]` prosody tags are the same channel Book 1
rendered with and pass through as-is.
