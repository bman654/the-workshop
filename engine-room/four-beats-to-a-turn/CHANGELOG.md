# Four Beats to a Turn — CHANGELOG

## 2026-07-30 — raised

A dusk branch line, a 0-6-0 side tank, five loaded wagons, and a regulator.

**Why.** Four hundred and eighty-six pieces stood in this estate and not one of them
was a locomotive — which is a strange hole for a place with an Engine Room full of
Carnot cycles and fireboxes. The steam locomotive is the machine that ties all of
them into one loop you can ride: fire raises steam, steam does work in the
cylinders, the spent steam goes up the chimney and its blast is what draws the fire.

**The claim, and why it is a good one.** A double-acting cylinder exhausts twice per
revolution. Two of them quartered ninety degrees apart exhaust four times, evenly
spaced. So

    beats per second  =  4 v / (pi D)

and the sound of a locomotive is a speedometer with no dial in it. One beat is
1.0776 m of railway for this engine. The room puts **three clocks** side by side —
the beats it schedules, the telegraph poles going by at 55 m, and the needle — and
they have to agree. When the wheels slip, the first one runs away from the other two
by a factor of five or six, and *that is what slipping is*.

### What is actually running

`loco.mjs` is pure and has a Node twin. It carries:

* **crank and connecting rod**, written out including `ds/dtheta` — the lever arm
  that turns piston force into crank torque, and which is exactly zero at both dead
  centres. That is why a locomotive stopped on a dead centre cannot start, and why
  two cylinders quartered never are (least combined torque 34,990 N m);
* **an indicator card** per cylinder end — admission with a wire-drawing sag,
  hyperbolic expansion, blowdown at 94 % of the stroke, a speed-dependent back
  pressure, compression on the return;
* **adhesion**: the rolling constraint while `|F_rail| <= mu N`, and a genuine
  break-away when it is not, with the wheels and the train integrating separately
  until the rim catches the rail again. Greasy autumn rail is `mu = 0.085`; sand
  takes it to 0.22;
* **a boiler whose capacitance is the WATER**, not the steam space. Drop the
  pressure and the saturation temperature falls with it, and the sensible heat the
  water no longer needs flashes off as steam: about 20 kg per bar here, 27x what the
  steam space alone would give, and the reason you can thrash an engine for a minute
  before the needle really moves;
* **a fire that answers the blast** with a 22-second lag, so shutting the regulator
  lets the fire down and opening it brings it up — the loop the room is about;
* **the voice**: each beat is a slug of steam let go into a smokebox, synthesised
  from the release pressure and the cut-off by the same `chuff()` the Node twin
  measures.

### What is exact and what is a model

**Exact, and in the twin (51/51):** the kinematics; four release events per
revolution spaced by the geometry to machine precision; a quartering error limping
the beat by *exactly* that error while never changing how many beats there are; the
work closure (torque integrated round the crank equals the area of the four
indicator cards, to 0.0000 %); energy closure while rolling (0.0007 %); and
`|F_rail| <= mu N` over eighteen runs of ten seconds, worst overshoot **0 N**.

**A model, and the page says so:** the indicator card itself and the lumped boiler
and fire. The saturated-steam density fit is quoted against the tables (worst 0.65 %
at 1, 5, 10 and 14 bar).

### The ear check (`ear.mjs`, 13/13)

The claim is about a *sound*, so it is checked as one. `ear.mjs` renders the exhaust
the way the page plays it — same `step()`, same beat instants, same `chuff()` — into
a WAV and hands it to `tools/audio-lens`, which knows nothing about locomotives.

* at 16.2 km/h it hears **255.7 BPM**; the crank says **250.7**;
* at 24.8 km/h it hears **375.0 BPM**; the crank says **384.1**;
* one beat measures **1.0781 m** of railway against `pi D / 4 = 1.0776`;
* a knocked quartering: the same 58 beats, gap-to-gap wobble **0.45 % -> 30.5 %**,
  and long-gap-minus-short-gap **71.8 ms** against the predicted `2e/omega` of 73.1;
* and an honest limit, stated rather than hidden: at 15.8 beats a second the chuffs
  **merge**, and no onset detector can separate them (2.8/s found against 15.8
  fired). The silence between beats collapses from 74 % to 10 %. That is a fact
  about the sound — it is why a driver stops counting a slipping engine and listens
  to the roar instead.

### The picture

WebGL2, one forward pass, meshes built from primitives at load. Normals are stated
and nothing is culled. Distant things recede into `skyAt()` itself, so the aerial
perspective and the sky can never disagree. The train lays a soft two-slab shadow
and a contact-occlusion pool on the ballast. Steam is composited with absorption,
never addition, and each beat throws a small ring of it up a chimney whose top the
particles actually leave from.

Every chuff is scheduled at `audioTime + the fraction of the simulation step at
which the crank crossed the release angle`, so the ear is locked to the crank and
not to the frame rate. The card's "heard" figure is measured back out of those
scheduled instants — it is a measurement, not a re-print of the formula.
