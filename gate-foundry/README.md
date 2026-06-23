# gate-foundry — the room-rep / asset build harness

The reusable harness that built the gate's assets and room-reps. It is **build
tooling, not part of the gate product** (which lives entirely under `the-gate/`).
Archived here so future rep builds are reproducible and the judge/smith prompts
(which encode the SPEC's standards) survive.

## What it is

`foundry.workflow.js` — a generic, args-driven Workflow. A `LIB` asset library is
keyed by asset name; pass the asset keys you want built as `args` and it builds them
**sequentially** (shared-file-safe — all `scene.js` / `scene-buildings.js` assets
serialize). Per asset: **fan-out K takes → judge(s) → synthesize + build-final into the
live worktree.** Each take edits ONLY its target draw fn (siblings byte-identical), so
the synth can take the winner's whole file as the base — no merge.

The smith/judge/synth prompts mirror `the-gate/SPEC.md` — including §2.5.5 **ambient
animation** (allowed + encouraged where it fits the room): smiths may animate via
self-contained SMIL and render motion frames with the `?smil=<seconds>` pin; judges
view those frames and reward motion that *deepens* the read while staying quiet,
seamless, lit-correct, and reduced-motion-safe.

## How to run

```js
// from a Claude Code session with the Workflow tool:
Workflow({ scriptPath: '/tmp/gate-foundry/foundry.workflow.js', args: ['<asset-key>'] })
```

`render-take.sh` — renders a candidate module in full scene context (forge → serve →
screenshot idle-night / idle-day / open-night; optional 6th arg appends query params,
e.g. `"room=ripple&smil=1.2"`). `survey.workflow.js` + `room-pool.json` — the blind
essence-survey that picked the bespoke reps.

> Note: this is the snapshot at the time the rep set was completed. The live working
> copy ran from `/tmp/gate-foundry/`; if that scratch dir is gone, copy these back out.
