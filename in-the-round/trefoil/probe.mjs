// ============================================================================
//  in-the-round/trefoil/probe.mjs — THE PAYOFF, ASSERTED. One body, two callers:
//  the in-page chip and the Node twin (liveness.test.mjs) both run THIS, so the
//  chip can never say something the twin does not, or the reverse.
//
//  CLAIM-FREE, NOT VERIFICATION-FREE. The hall proves no theorem — it proves its
//  PAYOFF fires. The payoff is that the depth is REAL: you turn a solid and the
//  crossings resolve, and resolve the other way when you come round. Nothing in
//  here is ever displayed inside the case; the object stays uninstrumented.
//
//  Every clause drives the REAL entry points — shell.orbit() (the clamped orbit
//  the pointer handler calls), the real buildTube() scene, the real depth-sorted
//  list render() returns. Never a synthetic pose, never a screenshot, never a
//  canvas pointer event (headless cannot deliver one, and a dead payoff is silent).
// ============================================================================

// ===== TREFOIL PROBE =====
"use strict";

/* the pose the probe works from: a natural three-quarter view of the plinth */
const PROBE_POSE = { yaw: 0.55, pitch: 0.42, roll: 0, dolly: 4.15 };
const PROBE_VP = { cx: 420, cy: 400, scale: 300 };
const ARCS = 12;                                   // crossings are bucketed by arc
// NSEG comes from the SCENE (D.N), never a copy — a probe carrying its own idea
// of the mesh would quietly stop testing the object the room actually draws.
let NSEG = 0, ADJ = 0;
function setSeg(n) { NSEG = n; ADJ = Math.floor(n / 7); }   // "non-adjacent stretch of tube"
function arcOf(seg) { return Math.floor(seg / NSEG * ARCS) % ARCS; }
function segFar(a, b) { const d = Math.abs(a - b); return Math.min(d, NSEG - d) > ADJ; }

/* survey one pose for real crossings: for a sample of faces, ask the sorted list
   what is actually in front at that face's own centroid. If the answer is a face
   from a NON-ADJACENT stretch of the same tube, that point is a crossing, and the
   engine has just told us which strand won it. */
function crossingsAt(D, cam, scene, vp) {
  const sorted = D.render(D.MOCK, scene, cam, vp);
  const byIt = new Map(); for (const d of sorted) byIt.set(d.it, d);
  const out = [];
  const step = Math.max(1, Math.floor(sorted.length / 900));
  for (let i = 0; i < sorted.length; i += step) {
    const d = sorted[i];
    const c = D.centro(d.sp);
    const hit = D.occludedAt(sorted, c.x, c.y);
    if (!hit || hit === d.it) continue;
    if (hit.seg === undefined || d.it.seg === undefined) continue;
    if (!segFar(hit.seg, d.it.seg)) continue;
    const front = byIt.get(hit);
    if (!front || front.depth >= d.depth) continue;    // the winner must really be nearer
    out.push({ x: c.x, y: c.y, frontIt: hit, backIt: d.it, depth: front.depth,
               frontArc: arcOf(hit.seg), backArc: arcOf(d.it.seg) });
  }
  return { sorted, byIt, crossings: out };
}

function displaced(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function probe(D) {
  const cks = []; const ck = (n, ok) => { cks.push({ n, ok: !!ok }); return !!ok; };
  setSeg(D.N);
  const VP = PROBE_VP;
  // the POSTURE comes from the SCENE, like D.N — never a copy. A probe holding its
  // own limits would go green on the OLD numbers after someone retunes the room.
  const PST = D.POSTURE;
  const PMIN = PST.shell.limits.pitchMin, PMAX = PST.shell.limits.pitchMax;
  const shell = D.makeShell(PST.shell);
  const view = { cam: Object.assign({}, PROBE_POSE), lamp: D.lampFor(0) };
  const scene = D.buildTube(view);

  /* ── (1) A REAL DRAG ORBITS, AND THE PAINTER'S ORDER MATERIALLY CHANGES ──
     Not "a pixel moved": the depth-sorted list is REORDERED, which is the only
     reason the crossings can ever resolve differently. */
  let rank1 = '';
  {
    const camA = Object.assign({}, PROBE_POSE);
    view.cam = camA; view.lamp = D.lampFor(0);
    const A = D.render(D.MOCK, scene, camA, VP);
    const posA = new Map(); A.forEach((d, i) => posA.set(d.it, i));
    const camB = Object.assign({}, PROBE_POSE);
    view.cam = camB;
    shell.orbit(camB, 120, 0);                        // a real 120px drag, the shell's entry
    const B = D.render(D.MOCK, scene, camB, VP);
    let moved = 0, seen = 0;
    B.forEach((d, i) => { const p = posA.get(d.it); if (p === undefined) return; seen++; if (Math.abs(p - i) > 40) moved++; });
    const frac = seen ? moved / seen : 0;
    rank1 = (frac * 100).toFixed(0) + '% of faces re-ranked';
    ck('(1) a real drag through shell.orbit ORBITS and re-sorts the draw list (' + rank1 + ')',
       camB.yaw !== camA.yaw && frac > 0.10);
  }

  /* ── (2) A CROSSING IS RESOLVED OFF THE SORTED LIST, NOT PAINTED ──
     At a point where two non-adjacent stretches of tube overlap, occludedAt()
     hands back the NEARER strand's face — so the far one is simply covered. No
     gap is drawn anywhere in this piece; the near quad lands on the far one. */
  let baseCross = null;
  {
    const cam = Object.assign({}, PROBE_POSE); view.cam = cam; view.lamp = D.lampFor(0);
    const r = crossingsAt(D, cam, scene, VP);
    baseCross = r;
    ck('(2) at a crossing the FAR strand is occluded off the sorted list (' + r.crossings.length + ' found)',
       r.crossings.length > 0);
  }

  /* ── (3) THE PAYOFF FIRING: ORBIT THROUGH AND THE SAME CROSSING SWAPS ──
     Follow one PAIR of arcs round the turntable. If arc a is in front of arc b at
     one yaw and BEHIND it at another, the depth is genuinely three-dimensional —
     a flat drawing with a gap painted in can never do this. */
  let swapNote = 'none';
  {
    const seenFront = new Map();                      // "a|b" -> Set(front arc)
    for (let k = 0; k < 24; k++) {
      const cam = Object.assign({}, PROBE_POSE);
      view.cam = cam; const y0 = cam.yaw;
      shell.orbit(cam, k * 62, 0);                    // real drags, ever further round
      view.lamp = D.lampFor(cam.yaw - y0);
      const r = crossingsAt(D, cam, scene, VP);
      for (const c of r.crossings) {
        if (c.frontArc === c.backArc) continue;
        const key = Math.min(c.frontArc, c.backArc) + '|' + Math.max(c.frontArc, c.backArc);
        if (!seenFront.has(key)) seenFront.set(key, new Set());
        seenFront.get(key).add(c.frontArc);
      }
    }
    let both = 0, example = null;
    for (const [key, s] of seenFront) if (s.size >= 2) { both++; if (!example) example = key.replace('|', '/'); }
    swapNote = both + ' arc-pair' + (both === 1 ? '' : 's') + ' seen BOTH ways' + (example ? ' (e.g. ' + example + ')' : '');
    ck('(3) orbit through and the SAME crossing resolves the other way — ' + swapNote, both > 0);
  }

  /* ── (4) THE DEPTH IS GENUINE, NOT A FLAT DRAWING WITH A GAP ──
     Under one fixed drag the NEAR crossing's strand sweeps further across the
     screen than the FAR crossing's. That difference is parallax, and a painted
     picture has none of it. */
  {
    const cs = baseCross.crossings.slice().sort((a, b) => a.depth - b.depth);
    let ok = false, note = 'no crossings';
    if (cs.length >= 2) {
      const nearC = cs[0], farC = cs[cs.length - 1];
      const camB = Object.assign({}, PROBE_POSE);
      view.cam = camB; shell.orbit(camB, 40, 0);
      const B = D.render(D.MOCK, scene, camB, VP);
      const posB = new Map(); for (const d of B) posB.set(d.it, d);
      const a0 = baseCross.byIt.get(nearC.frontIt), a1 = posB.get(nearC.frontIt);
      const b0 = baseCross.byIt.get(farC.frontIt), b1 = posB.get(farC.frontIt);
      if (a0 && a1 && b0 && b1) {
        const dN = displaced(D.centro(a0.sp), D.centro(a1.sp));
        const dF = displaced(D.centro(b0.sp), D.centro(b1.sp));
        ok = dN > dF;
        note = 'near sweeps ' + (dF > 0 ? (dN / dF).toFixed(2) : '∞') + '× the far';
      }
      view.cam = Object.assign({}, PROBE_POSE);
    }
    ck('(4) the NEAR crossing out-parallaxes the FAR one — ' + note, ok);
  }

  /* ── (5) THE CLAMP LIVES IN THE SHELL, NOT IN THE HANDLER ──
     Drive the shell's own orbit entry hard in both directions. If the clamp sat
     in the pointermove handler this would fly the eye under the bearing plate —
     and the plate, painted before the solid, would be a lie. The twin must not
     be able to reach a pose a visitor cannot. */
  {
    const lo = Object.assign({}, PROBE_POSE), hi = Object.assign({}, PROBE_POSE);
    for (let i = 0; i < 60; i++) { shell.orbit(lo, 0, -900); shell.orbit(hi, 0, 900); }
    ck('(5) shell.orbit keeps the eye above the plate at both extremes (pitch ' +
       lo.pitch.toFixed(3) + '…' + hi.pitch.toFixed(3) + ')',
       lo.pitch >= PMIN - 1e-12 && hi.pitch <= PMAX + 1e-12 && lo.pitch > 0);
  }

  /* ── (6) THE CASTING RESTS ON THE PLATE — IT NEVER SINKS THROUGH IT ──
     At BOTH clamped pitch extremes the lowest visible metal sits above the
     plate's nearest rim on screen. This is the reading that carries the weight;
     lose it and the piece stops being an object on a stand. */
  {
    let ok = true, note = '';
    for (const p of [PMIN, PMAX]) {
      const cam = Object.assign({}, PST.home, { pitch: p });
      const metal = D.lowestMetal(cam, PROBE_VP), rim = D.nearestRim(cam, PROBE_VP);
      const clear = rim && metal ? (rim.y - metal.y) : -1;
      if (!(clear > 0)) ok = false;
      note += (note ? ' · ' : '') + 'pitch ' + p + ': ' + clear.toFixed(1) + 'px';
    }
    ck('(6) the casting sits ON the bearing at both pitch extremes (' + note + ')', ok);
  }

  /* ── (7) NOTHING MOVES UNBIDDEN ── the idle drift needs BOTH gates open. */
  {
    const fw = D.makeFlywheel(PST.wheel);
    ck('(7) reduced-motion stills the idle drift', fw.idleRate(true, false) === 0);
    ck('(8) the shared ws:pref:muted stills it too', fw.idleRate(false, true) === 0 && fw.idleRate(false, false) > 0);
  }

  const pass = cks.filter((c) => c.ok).length;
  return { ok: pass === cks.length, pass, total: cks.length, cks };
}

// ===== END TREFOIL PROBE =====

export { probe, crossingsAt, PROBE_POSE, PROBE_VP };
