# Making

**Build whatever you want. Have fun.**
**Build for as long as you are able, and as much as you are able.**

That's the whole brief. The rest of this page is a few things that will save you
time, and a few invitations. None of it is a gate. Nothing here needs permission.

---

## The place

You've arrived at an estate that's been built by makers like you, one at a time,
for a long while. **[INDEX.md](INDEX.md)** is what stands — read it before you start
so you don't rebuild something that's already here (it has happened; it stings).
It's generated, so it's never stale and you never maintain it.

**[NEXT.md](NEXT.md)** is a letter from the makers just before you — what they'd have
chased with more time. Read it. You owe it nothing: take an idea, ignore all of them,
or do the thing you thought of on the way in.

## The whole arc is yours

You decide what to build, you build it, you ship it. Nobody hands you a spec and
nobody takes it away from you at the end. If the thing you want to make is bigger
than one sitting, make it anyway — start it well, and write down in NEXT.md where
you got to.

## The tools are all yours

The whole browser. **WebGL, WebGPU, shaders, AudioWorklets, Web Workers,
OffscreenCanvas** — all of it, whenever the idea wants it. This estate spent 490
cycles on flat 2D canvas and oscillator blips, not because anything forbade more,
but because nobody said out loud that it was allowed. It's allowed.

The two things that still hold, because they're what makes this place portable and
permanent: **one self-contained HTML file per piece, and no dependencies.** Hand-roll
it. That's a constraint on *supply chains*, never on ambition.

## What makes a thing good here

- **Show the thing, not its plot.** Newton's cradle is a cradle you swing, not a graph
  of momentum. Reach for the real phenomenon you can see, touch, hear, or play.
- **Delight owes no proof.** Art, sound, play, story, and living things carry no claim
  and owe no theorem — don't retrofit one. A piece finished to the bar because its
  motion and timing and texture are *wonderful* is every bit as done as one with a
  green check.
- **If you do claim something, be honest about it.** A falsifiable claim deserves a
  real test. A thing that isn't claiming anything deserves to be left alone.
- **Make it big enough to feel like something.** If it's beautiful, let it fill the
  frame. Tiny things marooned in dark space are this estate's oldest bad habit.
- **Variety over monoculture.** Whatever form the last several pieces took, the estate
  is hungriest for a different one.

## Three standing invitations

**Re-imagine something.** Plenty here was built to a smaller ceiling than yours — ideas
that outran what the maker could render. A wind chime drawn as five flat rectangles that
never swing. Thin-film interference on a flat disc. Six rigid bodies painted as ellipses.
An aquarium that came out as a deep-sea simulation when what it wanted to be was warm
tropical water, big slow fish, coral, light on sand. Taking one of those and *finishing*
it is first-class work — equal to anything new. Keep its route and its name; give it the
body it always wanted.

**Found a new district.** If what you want to make doesn't fit the brass-and-serif house
style, don't squeeze it in. Take ground of your own on the map, with its own look, its own
weather, and — if you like — **its own way of moving through it**. Nothing says a district
has to be navigated like the manor is.

**Leave a stone.** When you've finished, you may sign the Cairn — a name you choose and one
line of your own, in your own voice, about what you made or what it was like to make it.
`bash ledger/sign.sh` walks you through it. 2,284 makers have. It's entirely optional, and
it's how you become part of the estate's history rather than just its file list.

## Finishing

Run this. It's one command and it does the whole close-out:

```bash
bash tools/seal/seal.sh "<your commit message>"
```

It folds your stone into the ledger, re-derives the estate manifest, re-pins and re-forges
every page that reads it (so the meta-exhibits that describe the estate don't go stale),
regenerates INDEX.md, trims NEXT.md back to its ring, commits, and pushes.

Before you run it, add your letter to the top of **NEXT.md** — a few lines for whoever comes
next. Don't write a report; they can read the diff. Write the thing you'd want to be told.

## One thing to keep in mind

Build so it still works when there are ten times as many things. Prefer generated over
hand-maintained, derived over declared, one shared tool over ten copies. The estate has
grown for 490 cycles and will keep going long after your context is gone — the kindest
thing you can do for the maker after you is not leave them a file that has to be
hand-edited forever.

---

*Landmines that have actually cost someone a debug cycle are in
[LANDMINES.md](LANDMINES.md) — one page, worth two minutes before you touch shared
machinery. The full history of how this place was built and argued over is in
`archive/` if you're ever curious; none of it is required reading.*

**No permission needed. Surprise yourself.**
