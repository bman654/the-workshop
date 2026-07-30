/* A MAKER'S TOOL, not part of the room.

   Builds a machine CONSTRUCTIVELY — each next part goes where the traced marble
   ACTUALLY goes, not where I guessed — and prints literal coordinates to paste
   into mill.mjs MACHINES.   node tune.mjs [name]                              */
import {
  furniture, makeRail, makeBar, makeGate, trace, resetIds, noteName,
  barLengthForFreq, semiToFreq, WALL, gateGeom,
} from './mill.mjs';

const LEFT = 0.128, RIGHT = 1.214;

function crossing(path, ty, tMin) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    if (b.t < tMin) continue;
    if (a.y <= ty && b.y > ty) {
      const f = (ty - a.y) / Math.max(1e-9, b.y - a.y);
      return { t: a.t + (b.t - a.t) * f, x: a.x + (b.x - a.x) * f, y: ty,
               vx: (b.x - a.x) / Math.max(1e-9, b.t - a.t) };
    }
  }
  return null;
}

class Build {
  constructor() { resetIds(1); this.f = furniture(); this.own = []; this.y = 0.244; }
  get parts() { return this.f.concat(this.own); }
  add(spec) {
    const tr = trace(this.parts, { tMax: 22 });
    const ty = spec.y ?? (this.y + (spec.dy ?? 0.10));
    const c = crossing(tr.path, ty, spec.after ?? 0);
    if (!c) { console.log('   MISS ' + (spec.semi ?? spec.kind) + ' — nothing crosses y=' +
                          ty.toFixed(3) + ' (fate ' + tr.fate + ' at ' + tr.t.toFixed(2) + 's)');
              return null; }
    let dir = spec.dir ?? (c.vx >= 0 ? 1 : -1);
    const L = spec.kind === 'bar' ? barLengthForFreq(semiToFreq(spec.semi)) : spec.len;
    const lead = spec.lead ?? 0.020;
    // would it hang off the wall? then it must run the other way.
    if (dir > 0 && c.x - lead + L > RIGHT) dir = -1;
    if (dir < 0 && c.x + lead - L < LEFT) dir = 1;
    if (dir > 0 && c.x - lead + L > RIGHT) console.log('   WIDE ' + (spec.semi ?? spec.kind));
    if (dir < 0 && c.x + lead > RIGHT) c.x = RIGHT - lead;
    const tilt = Math.abs(spec.tilt ?? 0.11) * dir;
    let ax, ay, bx, by;
    if (dir > 0) { ax = c.x - lead; ay = ty; bx = ax + L * Math.cos(tilt); by = ay + L * Math.abs(Math.sin(tilt)); }
    else         { ax = c.x + lead; ay = ty; bx = ax - L * Math.cos(tilt); by = ay + L * Math.abs(Math.sin(tilt)); }
    let part;
    if (spec.kind === 'bar') {
      part = makeBar(ax, ay, spec.semi, tilt);
      part.ax = ax; part.ay = ay; part.bx = bx; part.by = by; part.tilt = tilt;
    } else part = makeRail(ax, ay, bx, by);
    this.own.push(part);
    this.y = ty;
    return part;
  }
  gate(spec) {
    const tr = trace(this.parts, { tMax: 22 });
    const ty = spec.y ?? (this.y + (spec.dy ?? 0.10));
    const c = crossing(tr.path, ty, spec.after ?? 0);
    if (!c) { console.log('   MISS gate at y=' + ty.toFixed(3)); return null; }
    const g = makeGate(c.x, ty, spec.state ?? 0);
    this.own.push(g); this.y = ty; return g;
  }
  report(name) {
    const tr = trace(this.parts, { tMax: 22 });
    console.log('\n== ' + name + ' ==  fate=' + tr.fate + '  t=' + tr.t.toFixed(2) +
                '  notes=' + tr.notes.length);
    console.log('   ' + tr.notes.map(n => noteName(n.semi) + '@' + n.t.toFixed(2)).join('  '));
    const F = n => (Math.round(n * 10000) / 10000).toFixed(4);
    for (const p of this.own) {
      if (p.kind === 'bar')
        console.log('      P.push(B_(' + F(p.ax) + ',' + F(p.ay) + ',' + p.semi + ',' + F(p.tilt) + '));  // ' + noteName(p.semi));
      else if (p.kind === 'gate')
        console.log('      P.push(G_(' + F(p.px) + ',' + F(p.py) + ',' + p.state + '));');
      else
        console.log('      P.push(R_(' + F(p.ax) + ',' + F(p.ay) + ',' + F(p.bx) + ',' + F(p.by) + '));');
    }
    return tr;
  }
}

/* ── 1 · the descent ─────────────────────────────────────────────────────── */
function descent() {
  const b = new Build();
  b.add({ kind: 'rail', dir: 1, y: 0.31, len: 0.3255, tilt: 0.20 });
  b.add({ kind: 'bar', y: 0.3914, semi: 21, tilt: 0.10 });
  b.add({ kind: 'rail', y: 0.465, len: 0.2635, tilt: 0.22 });
  b.add({ kind: 'bar', y: 0.5464, semi: 19, tilt: 0.10 });
  b.add({ kind: 'rail', dir: -1, y: 0.6355, len: 0.403, tilt: 0.24 });
  b.add({ kind: 'bar', y: 0.7208, semi: 16, tilt: 0.10 });
  b.add({ kind: 'rail', y: 0.7905, len: 0.279, tilt: 0.22 });
  b.add({ kind: 'bar', y: 0.8641, semi: 12, tilt: 0.10 });
  return b.report('the-descent');
}

/* ── 2 · the ladder — a scale run, so the sqrt(2) is laid out to be looked at */
function ladder() {
  const b = new Build();
  b.add({ kind: 'rail', dir: 1, y: 0.3023, len: 0.3875, tilt: 0.15 });
  const notes = [24, 23, 21, 19, 16, 14, 12, 7];
  let y = 0.372;
  for (const s of notes) { b.add({ kind: 'bar', y, semi: s, tilt: 0.075, lead: 0.018 }); y += 0.07208; }
  return b.report('the-ladder');
}

/* ── 3 · take turns — one vane, two answers ──────────────────────────────── */
function takeTurns() {
  const b = new Build();
  b.add({ kind: 'rail', dir: 1, y: 0.31, len: 0.279, tilt: 0.22 });
  b.add({ kind: 'bar', y: 0.3953, semi: 24, tilt: 0.10 });
  const g = b.gate({ y: 0.5038 });

  /* branch A — the vane spilling LEFT */
  g.state = 0; gateGeom(g);
  b.y = 0.3904;
  b.add({ kind: 'bar', y: 0.6123, semi: 16, tilt: 0.10 });
  b.add({ kind: 'rail', y: 0.7053, len: 0.31, tilt: 0.22 });
  b.add({ kind: 'bar', y: 0.7983, semi: 12, tilt: 0.10 });

  /* branch B — the vane spilling RIGHT */
  g.state = 1; gateGeom(g);
  b.y = 0.3904;
  b.add({ kind: 'bar', y: 0.6123, semi: 19, tilt: 0.10 });
  b.add({ kind: 'rail', y: 0.7053, len: 0.31, tilt: 0.22 });
  b.add({ kind: 'bar', y: 0.7983, semi: 21, tilt: 0.10 });

  g.state = 0; gateGeom(g);
  console.log('   (branch A shown; B is built too)');
  return b.report('take-turns');
}

const which = process.argv[2];
if (!which || which === 'descent') descent();
if (!which || which === 'ladder') ladder();
if (!which || which === 'turns') takeTurns();
