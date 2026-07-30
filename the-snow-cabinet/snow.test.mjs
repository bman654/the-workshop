/* ═══════════════════════════════════════════════════════════════════════════
   THE SNOW CABINET — the Node twin.   node the-snow-cabinet/snow.test.mjs

   The room makes ONE claim: there is no branching rule in the model, and the
   arms are not copies of each other. Both halves of that are falsifiable and
   both are run here, against the same `snow.mjs` the page inlines.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  NB, hexDist, rot60, alphaPrism, alphaBasal, habitIndex, envAt,
  makeCrystal, step, grow, fall, outline, sixfold, vaporReach, aspect,
  packTexture, recipe, regrow, taper, H_INHERIT, FALLS,
} from './snow.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; console.log('  ✗ ' + name + '  ' + detail); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const head = t => console.log('\n' + t);

/* ── A. the lattice ──────────────────────────────────────────────────────── */
head('A. the hexagonal lattice');
{
  ok('hexDist(0,0) = 0', hexDist(0, 0) === 0);
  ok('every neighbour is one step away', NB.every(([q, r]) => hexDist(q, r) === 1));
  ok('the six neighbours are distinct', new Set(NB.map(v => v.join(','))).size === 6);

  // rot60 must permute the neighbour set — otherwise the rule cannot be
  // six-fold equivariant and no amount of care elsewhere will save it.
  const set = new Set(NB.map(v => v.join(',')));
  const img = NB.map(([q, r]) => rot60(q, r).join(','));
  ok('rot60 permutes the neighbourhood', img.every(k => set.has(k)) && new Set(img).size === 6);

  let distOK = true;
  for (let r = -9; r <= 9; r++) for (let q = -9; q <= 9; q++) {
    const [q2, r2] = rot60(q, r);
    if (hexDist(q, r) !== hexDist(q2, r2)) distOK = false;
  }
  ok('rot60 preserves hex distance over a patch of 361', distOK);

  let six = true;
  for (const [q, r] of [[3, 0], [2, -5], [-4, 1]]) {
    let a = [q, r];
    for (let i = 0; i < 6; i++) a = rot60(a[0], a[1]);
    if (a[0] !== q || a[1] !== r) six = false;
  }
  ok('rot60 applied six times is the identity', six);
}

/* ── B. the two curves that are the Nakaya diagram ───────────────────────── */
head('B. the habit reversals');
{
  const k = T => habitIndex(T);
  ok('near -2 the prism face wins  (a plate)', k(-2) > 0.7, 'log10 ratio ' + k(-2).toFixed(2));
  ok('near -5 the basal face wins  (a needle)', k(-5) < -0.7, 'log10 ratio ' + k(-5).toFixed(2));
  ok('near -15 the prism face wins (a plate)', k(-15) > 1.2, 'log10 ratio ' + k(-15).toFixed(2));
  ok('near -30 the basal face wins (a column)', k(-30) < -1.0, 'log10 ratio ' + k(-30).toFixed(2));

  // count the sign changes across the band the room shows
  let flips = 0, prev = Math.sign(k(-0.5));
  const cross = [];
  for (let T = -0.5; T >= -35; T -= 0.05) {
    const sg = Math.sign(k(T));
    if (sg !== prev) { flips++; cross.push(T); prev = sg; }
  }
  ok('exactly three reversals between 0 and -35', flips === 3,
    'at ' + cross.map(t => t.toFixed(1)).join(', ') + ' C');
  ok('both coefficients stay inside (0, 1.2]',
    [0, -5, -10, -15, -20, -25, -30, -35].every(T =>
      alphaPrism(T) > 0 && alphaPrism(T) <= 1.2 && alphaBasal(T) > 0 && alphaBasal(T) <= 1.2));
  ok('a sticky prism face means a low threshold',
    envAt(-15, 0.2).beta < envAt(-5, 0.2).beta,
    'beta ' + envAt(-15, 0.2).beta.toFixed(2) + ' vs ' + envAt(-5, 0.2).beta.toFixed(2));
}

/* ── C. the update is synchronous, so the lattice is six-fold equivariant ── */
head('C. six-fold equivariance (noise off)');
{
  const s = makeCrystal(181, 4);
  grow(s, 1400, -15, 0.22, { sigma: 0 });
  let worst = 0, n = 0;
  for (let r = -60; r <= 60; r++) for (let q = -60; q <= 60; q++) {
    if (hexDist(q, r) > 60) continue;
    const [q2, r2] = rot60(q, r);
    const i = (r + s.H) * s.N + (q + s.H), j = (r2 + s.H) * s.N + (q2 + s.H);
    worst = Math.max(worst, Math.abs(s.c[i] - s.c[j]), Math.abs(s.h[i] - s.h[j]));
    if (s.att[i] !== s.att[j]) n++;
  }
  ok('the mass field is EXACTLY invariant under a sixth of a turn', worst === 0,
    'largest disagreement ' + worst);
  ok('every attached cell has an attached partner sixty degrees round', n === 0);
  ok('the correlation reports 1 exactly', sixfold(s) === 1);
  ok('the crystal actually grew', s.rmax > 30, 'radius ' + s.rmax);
}

/* ── D. determinism, and the recipe ──────────────────────────────────────── */
head('D. the same recipe regrows the same crystal');
{
  const a = makeCrystal(161, 77); grow(a, 900, -14, 0.2);
  const b = makeCrystal(161, 77); grow(b, 900, -14, 0.2);
  let same = a.rmax === b.rmax;
  for (let i = 0; i < a.c.length && same; i++) if (a.c[i] !== b.c[i] || a.h[i] !== b.h[i]) same = false;
  ok('same seed, same lattice, cell for cell', same);

  const c2 = makeCrystal(161, 78); grow(c2, 900, -14, 0.2);
  let diff = false;
  for (let i = 0; i < a.c.length; i++) if (a.c[i] !== c2.c[i]) { diff = true; break; }
  ok('a different seed makes a different crystal', diff);

  const pts = [{ T: -13.6, ss: 0.2 }, { T: -15, ss: 0.24 }];
  const g = makeCrystal(161, 12); fall(g, pts, 800);
  const rec = recipe(g, pts, 800);
  const back = regrow(rec);
  let ident = back.rmax === g.rmax;
  for (let i = 0; i < g.c.length && ident; i++) if (g.c[i] !== back.c[i]) ident = false;
  ok('a kept recipe regrows bit for bit', ident,
    JSON.stringify(rec).length + ' bytes, radius ' + g.rmax);
}

/* ── E. THE CLAIM, part one: no diffusion, no branches ───────────────────── */
head('E. the branches are the diffusion field, not a rule');
{
  const wet = makeCrystal(201, 9); grow(wet, 2000, -15, 0.24);
  const flat = makeCrystal(201, 9); grow(flat, 2000, -15, 0.24, { uniform: true });
  const ow = outline(wet), of = outline(flat);
  ok('with a diffusing vapour field the outline runs away', ow.ruggedness > 2.2,
    'ruggedness ' + ow.ruggedness.toFixed(2));
  ok('with the SAME rule and undepletable vapour it is a hexagon', of.ruggedness < 1.12,
    'ruggedness ' + of.ruggedness.toFixed(3));
  ok('the faceted one is not merely smaller — it is bigger', of.area > ow.area,
    of.area + ' cells vs ' + ow.area);

  // and the mechanism, measured: a tip sits in richer air than a notch
  const vw = vaporReach(wet), vf = vaporReach(flat);
  ok('a tip eats better than a sheltered site', vw.ratio > 2,
    'outer/inner vapour ' + vw.ratio.toFixed(2));
  ok('with no depletion there is nothing to eat better', near(vf.ratio, 1, 0.02),
    'ratio ' + vf.ratio.toFixed(3));

  // the instability needs to be fed: drier air, calmer outline
  const dry = makeCrystal(201, 9); grow(dry, 2000, -15, 0.055);
  ok('drier air at the same temperature stays faceted longer',
    outline(dry).ruggedness < ow.ruggedness,
    'ruggedness ' + outline(dry).ruggedness.toFixed(2) + ' vs ' + ow.ruggedness.toFixed(2));
}

/* ── F. THE CLAIM, part two: the arms match because they share the air ───── */
head('F. six arms, one cloud');
{
  const one = makeCrystal(181, 21); grow(one, 1500, -14.5, 0.23);
  const six = makeCrystal(181, 21);
  grow(six, 1500, -14.5, 0.23, { sectors: [1.22, 0.80, 1.10, 0.86, 1.30, 0.92] });
  const s1 = sixfold(one), s6 = sixfold(six);
  ok('one cloud: the arms agree closely', s1 > 0.8, 'correlation ' + s1.toFixed(3));
  ok('six different clouds: they do not', s6 < s1 - 0.15, 'correlation ' + s6.toFixed(3));
  ok('nothing in the rule copies an arm — turn the noise off and it is exact',
    sixfold(grow(makeCrystal(161, 21), 900, -14.5, 0.23, { sigma: 0 })) === 1);
  // the model is still a snow crystal in six clouds: it just is not symmetric
  ok('the lopsided one still grew ice', outline(six).area > 200, outline(six).area + ' cells');
}

/* ── G. the habit, measured off the lattice ──────────────────────────────── */
head('G. plate or column, from the two curves alone');
{
  const plate = makeCrystal(201, 33); grow(plate, 2200, -15, 0.16);
  const needle = makeCrystal(201, 33); grow(needle, 2200, -5.2, 0.16);
  const column = makeCrystal(201, 33); grow(column, 2200, -30, 0.16);
  const ap = aspect(plate), an = aspect(needle), ac = aspect(column);
  ok('at -15 the crystal is much wider than it is thick', ap.radius / ap.maxH > 8,
    'radius ' + ap.radius + ' vs half-thickness ' + ap.maxH.toFixed(1));
  ok('at -5 it is much taller than it is wide', an.maxH / an.radius > 3,
    'half-length ' + an.maxH.toFixed(0) + ' vs radius ' + an.radius);
  ok('at -30 it is a column too', ac.maxH / ac.radius > 2,
    'half-length ' + ac.maxH.toFixed(0) + ' vs radius ' + ac.radius);
  ok('the plate is the widest of the three by far', ap.radius > 4 * an.radius);
  /* ONE constant does both: a new patch of prism wall is born with H_INHERIT of
     the height of the wall it grew out of, and then keeps growing at the cap
     rate. Where the rim races (a dendrite) the tips never catch up and the
     crystal tapers; where the rim crawls (a column) they do, and it comes out
     straight-sided. Nothing in the code asks which case it is in. */
  const fern = makeCrystal(261, 33); grow(fern, 2600, -15, 0.235);
  const tf = taper(fern), tn = taper(needle);
  ok('the one inheritance constant is below 1 and near it', H_INHERIT > 0.9 && H_INHERIT < 1,
    'H_INHERIT = ' + H_INHERIT);
  ok('a dendrite, whose tips race, is thicker at the hub than at the rim', tf.ratio > 1.15,
    'hub ' + tf.hub.toFixed(2) + ' vs rim ' + tf.rim.toFixed(2) + ' = ' + tf.ratio.toFixed(2) + 'x');
  ok('a column, whose rim crawls, comes out straight-sided', tn.ratio < 1.10,
    'hub ' + tn.hub.toFixed(0) + ' vs rim ' + tn.rim.toFixed(0) + ' = ' + tn.ratio.toFixed(2) + 'x');
}

/* ── H. growth only ever adds ice ────────────────────────────────────────── */
head('H. the crystal only grows');
{
  const s = makeCrystal(161, 5);
  const env = envAt(-14, 0.2);
  let prevA = 1, prevR = 0, mono = true, holds = true;
  const seen = new Uint8Array(s.att.length);
  for (let i = 0; i < 700; i++) {
    step(s, env);
    for (let k = 0; k < s.att.length; k++) {
      if (seen[k] && !s.att[k]) holds = false;
      if (s.att[k]) seen[k] = 1;
    }
    const a = outline(s).area;
    if (a < prevA || s.rmax < prevR) mono = false;
    prevA = a; prevR = s.rmax;
  }
  ok('area and radius never decrease', mono, 'final area ' + prevA);
  ok('no cell ever un-freezes', holds);
  ok('the far field is never disturbed', s.d[0] === 0.6 || s.live[0] === 0);
}

/* ── I. the texture the page draws from ──────────────────────────────────── */
head('I. the packed texture');
{
  const s = makeCrystal(161, 6); grow(s, 900, -15, 0.22);
  const a = aspect(s), hScale = Math.max(1, a.maxH * 1.05);
  const { data, R } = packTexture(s, 256, hScale);
  let maxSeen = 0, nonzero = 0;
  for (let i = 0; i < 256 * 256; i++) {
    const v = ((data[i * 4] << 8) | data[i * 4 + 1]) / 65535;
    if (v > 0) nonzero++;
    if (v > maxSeen) maxSeen = v;
  }
  ok('the texture has ice in it', nonzero > 2000, nonzero + ' of 65536 texels');
  ok('16 bits of thickness, in range', maxSeen > 0.5 && maxSeen <= 1,
    'peak ' + maxSeen.toFixed(4) + ' of full scale');
  ok('the window follows the crystal', R >= s.rmax && R <= s.rmax * 1.2 + 1,
    'window radius ' + R + ' for crystal radius ' + s.rmax);
  const eight = 1 / 255, sixteen = 1 / 65535;
  ok('16-bit packing is 257x finer than the obvious 8-bit one', eight / sixteen === 257,
    'an 8-bit height field bands its own normals into terraces');
}

/* ── J. the falls the cabinet ships ──────────────────────────────────────── */
head('J. the six falls in the drawer');
{
  ok('six falls, each with an id and a path', FALLS.length === 6 &&
    FALLS.every(f => f.id && f.pts.length >= 2 && f.name && f.note));
  ok('every point of every fall is inside the diagram',
    FALLS.every(f => f.pts.every(p => p.T <= 0 && p.T >= -35 && p.ss > 0 && p.ss <= 0.32)));
  const grown = FALLS.map(f => {
    const s = makeCrystal(221, 11); fall(s, f.pts, 2400);
    return { f, o: outline(s), a: aspect(s) };
  });
  const fern = grown.find(g => g.f.id === 'fern'), plate = grown.find(g => g.f.id === 'plate');
  const needle = grown.find(g => g.f.id === 'needle');
  ok('the fern is a fern', fern.o.ruggedness > 2.5, 'ruggedness ' + fern.o.ruggedness.toFixed(2));
  ok('the plain plate is plain', plate.o.ruggedness < 1.15, 'ruggedness ' + plate.o.ruggedness.toFixed(3));
  ok('the needle is a needle', needle.a.maxH / needle.a.radius > 4,
    (needle.a.maxH / needle.a.radius).toFixed(1) + ' to 1');
  ok('every fall grows something', grown.every(g => g.o.area > 150));
}

console.log('\n' + (fail === 0 ? 'ALL GREEN' : 'FAILURES') + ' — ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail === 0 ? 0 : 1);
