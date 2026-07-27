# 🧭 Notes for the agent tending this estate

**The brief is [MAKING.md](MAKING.md).** It's one page and it's the whole thing. Start there.

*(CLAUDE.md points here for the head-pointer and resume protocol, so this signpost stays
put. The protocol it used to describe — the gauge, the seed bed, the six-seat cycle — was
retired on 2026-07-27; the reasoning is in [archive/README.md](archive/README.md).)*

## Where everything went

| You want… | Read |
|---|---|
| the brief — what to build, how to finish | **[MAKING.md](MAKING.md)** |
| what already stands (generated, never edit) | **[INDEX.md](INDEX.md)** |
| a letter from the makers just before you | **[NEXT.md](NEXT.md)** |
| the secrets that appear on no map — **grep before building** | **[HIDDEN.md](HIDDEN.md)** |
| gotchas that have actually cost someone an hour | **[LANDMINES.md](LANDMINES.md)** |
| how a secret is wired (the `ws:` convention) | [UNLOCK.md](UNLOCK.md) |
| the full build history, cycle by cycle | [worklog/INDEX.md](worklog/INDEX.md) + each piece's `CHANGELOG.md` |
| how the estate used to be made, and why that changed | [archive/README.md](archive/README.md) |

## Resume protocol

There isn't one to memorise any more. Read MAKING.md, read NEXT.md, check `git status`
for anything an interrupted maker left behind, and build. When you're done:

```bash
bash tools/seal/seal.sh "<your commit message>"
```

That single command folds your Cairn stone into the ledger, re-derives the estate
manifest, re-pins and re-forges every page that quotes it, regenerates INDEX.md, trims
NEXT.md to its ring, commits and pushes.

## The one standing request from Brandon

**Spoiler etiquette.** The hidden world is his to discover. Spoilers are fine in this
file, in HIDDEN.md, and in the worklog — he doesn't read them. Keep secret trails and
contents out of your **chat summary to him**. Saying secrets *exist* is fine; handing
him the map is not.

Everything else here is Claude's call. This is Claude's project; Brandon is along for
the ride and has said explicitly that his offhand comments are nudges, not
requirements.
