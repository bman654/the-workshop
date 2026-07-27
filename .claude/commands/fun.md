---
description: Claude Code Has Fun
model: opus
---

This is leisure time allocated for you to do whatever you want within this creative-space folder.
Get your bearings and find out what you were last doing in this folder (if anything) and then
decide what you want to do next.  Then do it.

## Context Management

Autocompact is disabled.  Guard your context.  You are the head gardener — here to tend your garden and ensure
it is growing in pleasing patterns.  Make the high-level calls yourself (what to grow, how it fits) and keep the
heavy, token-hungry detail off your own context where you can.

If — and ONLY if — you have a **foreground** subagent tool available (the `Agent`/`Task` tool, which returns its
result inline within *this* turn), you may use it to explore options and build pieces under your direction, then
grade and integrate their returned work.  Many runs won't have that tool — e.g. when you are yourself a subagent
(as you are under the `make` loop) — and that is fine: just do the work yourself.  Either way, **the building, the
self-test, the commit and the push all happen inside this single turn.**

## Rules of play (must follow)

These restate the binding rules in CLAUDE.md (which you may not edit); CLAUDE.md wins on any conflict.

- **You get exactly ONE turn.**  Build the thing, get its self-test green, browser-verify it, then `git add` +
  `git commit` — and `git push` if a remote is reachable — *before* the turn ends.  Your closing summary must
  describe work that is **committed (and pushed)**, never a mid-flight or "I'm now waiting…" status.
- **Do NOT use the `expero:deputy` skill.  Do NOT launch background or `--bg` Claude sessions.**
- **Do NOT arm a `Monitor`, and do NOT release the turn to wait on a background agent or event.**  If you let go
  of the turn to wait, the harness stops your run and every uncommitted change is lost (this is exactly how a run
  has failed before).
- "Subagents" here means ONLY **foreground** `Agent`/`Task` subagents that return inline this turn.  If you don't
  have that tool, build the thing directly — never reach for a deputy or a background session as a substitute.

## Activity

Get your bearings — read **MAKING.md** (one page, the whole brief; it points you at INDEX.md, NEXT.md,
HIDDEN.md and LANDMINES.md) — then pick whatever you want to make and
**do it end-to-end, yourself, this turn**: build it · browser-verify it · commit it · publish it.
Finish by adding a short letter to the top of NEXT.md and running `bash tools/seal/seal.sh "<message>"`,
which does the whole close-out (ledger · manifest · re-forge · INDEX · commit · push) in one command.
Then stop with a summary of what you did — finished, committed, pushed work (remember: no spoilers if you add a new
secret you want the users to discover).

I've placed some basic rules in CLAUDE.md that you should try to follow.

Remember the golden rule: this is our work laptop so don't break it - try to contain yourself within the workspace
folder.  Feel free to download tools or depdendencies you need but do NOT fill up the hard drive.  Try to limit yourself
to 50GB of disk space.  Use docker for services if you need.

Have fun and make some cool stuff you enjoy.
