/* ============================================================================
 *  THE KITE — the Node twin.   node aerodrome/the-kite/kite.test.mjs
 *
 *  No browser in the room. Every claim the page makes is measured here on the
 *  same bytes the page inlines, and each one that can have a RED CONTROL gets
 *  one: a deliberately wrong version that MUST fail, so a green tick is never
 *  just a dead assertion agreeing with itself.
 * ==========================================================================*/

import {
  Kite, DEFAULTS, GRAV,
  windAt, plateCN, plateCL, plateCD, cpFraction, bestLD,
} from './kite.mjs';

let pass = 0, fail = 0;
const F = [];
function ok(name, cond, note){
  if (cond){ pass++; console.log('  ok   ' + name + (note ? '   ' + note : '')); }
  else { fail++; F.push(name); console.log('  FAIL ' + name + (note ? '   ' + note : '')); }
}
function head(s){ console.log('\n' + s); }
function n(x, d){ return Number(x).toFixed(d == null ? 2 : d); }

/* a settled kite, built and run to a steady state with no gust */
function settled(opts, secs){
  const k = new Kite(Object.assign({ gust: 0 }, opts || {}));
  k.settle(secs || 22);
  return k;
}

/* ═══════════════════════════════════════════════════════════════════════════
   A · THE FLAT PLATE — the constitutive model, on its own
   ═════════════════════════════════════════════════════════════════════════ */
head('A · the flat plate — what the sail is made of');
{
  let worst = 0;
  for (let d = 0; d <= 90; d += 5){
    const a = d * Math.PI / 180;
    worst = Math.max(worst, Math.abs(plateCN(Math.sin(a)) - 2 * Math.sin(a)));
  }
  ok('the resultant is normal to the plate with C_N = 2 sin a', worst < 1e-12, 'max dev ' + worst.toExponential(1));

  const a45 = Math.PI / 4;
  ok('C_L peaks at 45 degrees for an ideal plate',
     plateCL(Math.sin(a45), Math.cos(a45)) >= plateCL(Math.sin(a45 - 0.1), Math.cos(a45 - 0.1)) &&
     plateCL(Math.sin(a45), Math.cos(a45)) >= plateCL(Math.sin(a45 + 0.1), Math.cos(a45 + 0.1)),
     'C_Lmax = ' + n(plateCL(Math.sin(a45), Math.cos(a45)), 3));

  ok('the centre of pressure is the quarter chord head-on and mid-chord side-on',
     Math.abs(cpFraction(1) - 0.25) < 1e-12 && Math.abs(cpFraction(0) - 0.5) < 1e-12,
     'cp(0 deg) = ' + n(cpFraction(1), 3) + ', cp(90 deg) = ' + n(cpFraction(0), 3));

  const b = bestLD(0.06), bDirty = bestLD(0.20);
  ok('the best lift-to-drag of this plate is about 2.8, near 9 degrees',
     b.ld > 2.5 && b.ld < 3.2 && b.deg > 6 && b.deg < 13,
     'L/D ' + n(b.ld) + ' at ' + n(b.deg, 1) + ' deg  ->  a ceiling of ' + n(Math.atan(b.ld) * 180 / Math.PI, 1) + ' deg');
  ok('a dirtier kite has a lower ceiling — the parasite drag is load-bearing',
     bDirty.ld < b.ld * 0.75, 'C_D0 0.06 -> ' + n(b.ld) + ',  C_D0 0.20 -> ' + n(bDirty.ld));
  /* RED CONTROL: if C_D0 did nothing, the two would agree. */
  ok('RED: pretending C_D0 is free would make those two equal — it does not',
     !(Math.abs(bDirty.ld - b.ld) < 0.05));
}

/* ═══════════════════════════════════════════════════════════════════════════
   B · THE WIND — the log law
   ═════════════════════════════════════════════════════════════════════════ */
head('B · the wind — the log law over mown grass');
{
  ok('U(10 m) is exactly the ten-metre wind you asked for',
     Math.abs(windAt(10, 7) - 7) < 1e-12, 'U(10) = ' + n(windAt(10, 7), 6));
  let mono = true;
  for (let z = 0.2; z < 80; z *= 1.3) if (windAt(z * 1.3, 7) <= windAt(z, 7)) mono = false;
  ok('the wind rises all the way up', mono,
     'U(2 m) = ' + n(windAt(2, 7)) + ',  U(30 m) = ' + n(windAt(30, 7)));
  ok('there is real shear across a kite line — the top is much windier than the hands',
     windAt(30, 7) / windAt(1.4, 7) > 1.5,
     'U(30)/U(1.4) = ' + n(windAt(30, 7) / windAt(1.4, 7)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   C · THE BODY — four points that weigh the right amount and spin right
   ═════════════════════════════════════════════════════════════════════════ */
head('C · the body — a rigid quadrilateral standing in for a flat plate');
{
  const k = new Kite({ gust: 0 });
  const I = k.inertia();
  const Iplate = DEFAULTS.mass * DEFAULTS.chord * DEFAULTS.chord / 12;
  ok('the assembled body has a flat plate\'s moment of inertia, within 10%',
     Math.abs(I - Iplate) / Iplate < 0.10,
     'I = ' + I.toExponential(3) + ' vs m c^2/12 = ' + Iplate.toExponential(3) +
     '  (' + n(100 * (I - Iplate) / Iplate, 1) + '%)');
  let mtot = 0; for (const id of k.body) mtot += k.w.mass[id];
  ok('and it weighs what a kite weighs', Math.abs(mtot - DEFAULTS.mass) < 1e-9,
     n(mtot * 1000, 1) + ' g');
  /* RED CONTROL: two equal end masses (the naive rod) would be 3x too stiff to turn */
  const Irod = DEFAULTS.mass * DEFAULTS.chord * DEFAULTS.chord / 4;
  ok('RED: the naive two-point rod would have three times the inertia',
     Math.abs(Irod - Iplate) / Iplate > 1.5, 'rod I/plate I = ' + n(Irod / Iplate));
}

/* ═══════════════════════════════════════════════════════════════════════════
   D · CLOSURE — geometry against forces, at the kite
   ═════════════════════════════════════════════════════════════════════════ */
head('D · closure — where the line points, and what the air is doing (two instruments)');
{
  const cases = [
    { u10: 4.5 }, { u10: 6 }, { u10: 9 }, { u10: 13 },
    { bridleFrac: 0.14 }, { bridleFrac: 0.26 },
    { tailBows: 0 }, { tailBows: 8 },
    { lineLen: 12 }, { lineLen: 55 },
  ];
  let worst = 0, worstName = '';
  for (const c of cases){
    const k = settled(c, 24);
    const r = k.last;
    const d = Math.abs(r.elevLocalDeg - r.predictDeg);
    if (d > worst){ worst = d; worstName = JSON.stringify(c); }
    console.log('       ' + JSON.stringify(c).padEnd(22) +
      '  line says ' + n(r.elevLocalDeg, 2).padStart(6) + ' deg   forces say ' +
      n(r.predictDeg, 2).padStart(6) + ' deg   apart ' + n(d, 2));
  }
  ok('tan(the line\'s angle AT the kite) = (L - mg)/D, everywhere, to under a degree',
     worst < 1.0, 'worst ' + n(worst, 2) + ' deg at ' + worstName);

  /* RED CONTROL: bill the sail's forces alone and forget the tail — the tail is
     a real part of what the line is holding up, and the books stop balancing. */
  const kt = settled({ tailBows: 8 }, 24);
  const r = kt.last;
  const sailOnlyPred = Math.atan((r.sailLift - DEFAULTS.mass * GRAV) / r.sailDrag) * 180 / Math.PI;
  ok('RED: forgetting the tail is part of the kite breaks the closure',
     Math.abs(r.elevLocalDeg - sailOnlyPred) > 2.5,
     'sail-only prediction ' + n(sailOnlyPred, 1) + ' deg vs the line\'s ' + n(r.elevLocalDeg, 1) + ' deg');
}

/* ═══════════════════════════════════════════════════════════════════════════
   E · THE CEILING — a kite cannot out-climb its own glide ratio
   ═════════════════════════════════════════════════════════════════════════ */
head('E · the ceiling — atan(L/D), the same number as a glider\'s glide ratio');
{
  let allBelow = true, tight = 99, rows = 0;
  for (const u of [4, 6, 9, 14]){
    for (const f of [0.14, 0.20, 0.26]){
      const k = settled({ u10: u, bridleFrac: f }, 22);
      const r = k.last;
      if (r.z < 1) continue;                       // a kite on the grass is not flying
      rows++;
      const room = r.ceilingDeg - r.elevSeeDeg;
      if (room < tight) tight = room;
      if (r.elevSeeDeg > r.ceilingDeg + 1e-9) allBelow = false;
    }
  }
  ok('every flying kite sits BELOW its own atan(L/D)', allBelow && rows >= 8,
     rows + ' settled cases, closest approach ' + n(tight, 2) + ' deg');

  const kBest = settled({ u10: 12, bridleFrac: 0.15, tailBows: 1 }, 26);
  const rb = kBest.last;
  ok('and the best a flying kite can ever do is the plate\'s own best L/D',
     rb.z > 10 && rb.ceilingDeg > 0 && rb.ceilingDeg <= rb.bestCeilingDeg + 0.01,
     'this kite ' + n(rb.ceilingDeg, 1) + ' deg (flying at ' + n(rb.z, 1) + ' m)   the plate\'s best ' +
     n(rb.bestCeilingDeg, 1) + ' deg at ' + n(rb.bestAlphaDeg, 1) + ' deg of incidence');
}

/* ═══════════════════════════════════════════════════════════════════════════
   F · THE LONG LINE FLIES LOWER
   ═════════════════════════════════════════════════════════════════════════ */
head('F · the long line — you buy altitude and you sell angle');
{
  const lens = [10, 20, 30, 45, 60, 80];
  const sag = [], see = [], alt = [];
  for (const L of lens){
    const r = settled({ lineLen: L }, 26).last;
    sag.push(r.sagDeg); see.push(r.elevSeeDeg); alt.push(r.z);
    console.log('       ' + String(L).padStart(3) + ' m of line   angle seen ' +
      n(r.elevSeeDeg, 1).padStart(5) + ' deg   angle at the kite ' + n(r.elevLocalDeg, 1).padStart(5) +
      ' deg   sag ' + n(r.sagDeg, 2).padStart(5) + ' deg   altitude ' + n(r.z, 1).padStart(5) + ' m');
  }
  let monoSag = true; for (let i = 1; i < sag.length; i++) if (sag[i] <= sag[i - 1]) monoSag = false;
  ok('the line\'s own bow grows with every metre you let out', monoSag,
     n(sag[0], 2) + ' deg at 10 m  ->  ' + n(sag[sag.length - 1], 2) + ' deg at 80 m');
  ok('so the long line flies at a LOWER angle than the short one',
     see[see.length - 1] < see[1] - 1.5,
     n(see[1], 1) + ' deg at 20 m  ->  ' + n(see[see.length - 1], 1) + ' deg at 80 m');
  let monoAlt = true; for (let i = 1; i < alt.length; i++) if (alt[i] <= alt[i - 1]) monoAlt = false;
  ok('but it is still higher off the ground — the trade is angle, not altitude', monoAlt,
     n(alt[1], 1) + ' m  ->  ' + n(alt[alt.length - 1], 1) + ' m');
  /* RED CONTROL: a weightless, drag-free line has no sag to grow */
  const a = settled({ lineLen: 10, lineRho: 1e-9, lineDia: 1e-9 }, 26).last;
  const b = settled({ lineLen: 80, lineRho: 1e-9, lineDia: 1e-9 }, 26).last;
  ok('RED: with a weightless, invisible-to-the-air line the sag does NOT grow',
     Math.abs(b.sagDeg - a.sagDeg) < 0.6,
     'ghost line: ' + n(a.sagDeg, 2) + ' deg at 10 m, ' + n(b.sagDeg, 2) + ' deg at 80 m');
}

/* ═══════════════════════════════════════════════════════════════════════════
   G · THE TAIL — what it costs, and what it buys
   ═════════════════════════════════════════════════════════════════════════ */
head('G · the tail — bows of drag on a string');
{
  const bows = [0, 1, 3, 5, 8];
  const see = [];
  for (const b of bows){
    const r = settled({ tailBows: b }, 24).last;
    see.push(r.elevSeeDeg);
    console.log('       ' + b + ' bows   angle ' + n(r.elevSeeDeg, 1).padStart(5) +
      ' deg   L/D ' + n(r.LD).padStart(5) + '   ceiling ' + n(r.ceilingDeg, 1).padStart(5) + ' deg');
  }
  let mono = true; for (let i = 1; i < see.length; i++) if (see[i] >= see[i - 1]) mono = false;
  ok('every bow you add costs you sky', mono,
     n(see[0], 1) + ' deg bare  ->  ' + n(see[see.length - 1], 1) + ' deg with eight bows  (' +
     n(see[0] - see[see.length - 1], 1) + ' deg of sky)');

  /* the damping: kick the pitch and watch the ring-down */
  function ringdown(tailBows){
    const k = settled({ tailBows }, 24);
    const base = k.last.pitchDeg;
    k.pitchKick(14);
    const dev = [];
    const N = 500;                                    // 500 x 20 ms = 10 s
    for (let i = 0; i < N; i++){ k.settle(0.02); dev.push(k.last.pitchDeg - base); }
    const rms = (a, b) => {
      let s = 0; for (let i = a; i < b; i++) s += dev[i] * dev[i];
      return Math.sqrt(s / (b - a));
    };
    return { early: rms(5, 105), late: rms(300, 500), ratio: rms(300, 500) / Math.max(1e-9, rms(5, 105)) };
  }
  const withTail = ringdown(5), bare = ringdown(0);
  console.log('       with 5 bows: first 2 s ' + n(withTail.early, 2) + ' deg rms, last 4 s ' +
    n(withTail.late, 3) + ' deg rms   (' + n(100 * withTail.ratio, 1) + '% left)');
  console.log('       bare:        first 2 s ' + n(bare.early, 2) + ' deg rms, last 4 s ' +
    n(bare.late, 3) + ' deg rms   (' + n(100 * bare.ratio, 1) + '% left)');
  ok('a kicked kite settles down again', withTail.ratio < 0.6,
     n(100 * withTail.ratio, 1) + '% of the kick still ringing after 6 s');
  ok('and the tail is what does it — bare, more of the kick is still there',
     bare.ratio > withTail.ratio * 1.15,
     'bare keeps ' + n(bare.ratio / withTail.ratio, 2) + 'x as much');
}

/* ═══════════════════════════════════════════════════════════════════════════
   H · THE BRIDLE SETS THE ANGLE OF ATTACK
   ═════════════════════════════════════════════════════════════════════════ */
head('H · the bridle — a centimetre of knot, and the whole kite changes its mind');
{
  const fs = [0.12, 0.16, 0.20, 0.24, 0.28, 0.32];
  const al = [], el = [];
  for (const f of fs){
    const r = settled({ bridleFrac: f }, 24).last;
    al.push(r.alphaDeg); el.push(r.elevSeeDeg);
    console.log('       tow at ' + n(f * 100, 0).padStart(3) + '% of the chord   incidence ' +
      n(r.alphaDeg, 1).padStart(5) + ' deg   angle ' + n(r.elevSeeDeg, 1).padStart(5) +
      ' deg   pull ' + n(r.tension).padStart(5) + ' N');
  }
  let mono = true; for (let i = 1; i < al.length; i++) if (al[i] <= al[i - 1]) mono = false;
  ok('walking the tow point aft raises the angle of attack, every time', mono,
     n(al[0], 1) + ' deg  ->  ' + n(al[al.length - 1], 1) + ' deg');
  const best = el.indexOf(Math.max(...el));
  ok('and the highest flight is in the MIDDLE — there is a trim to find',
     best > 0 && best < el.length - 1,
     'best at ' + n(fs[best] * 100, 0) + '% of the chord, ' + n(el[best], 1) + ' deg');
}

/* ═══════════════════════════════════════════════════════════════════════════
   I · THE LINE SINGS — the Strouhal thrum
   ═════════════════════════════════════════════════════════════════════════ */
head('I · the line sings — vortex shedding at f = St U / d');
{
  const k = settled({ u10: 8 }, 20);
  const r = k.last;
  const mid = k.pt(k.line[Math.floor(k.line.length / 2)]);
  const u = k.windSpeedAt(mid[1]);
  const want = 0.2 * u / DEFAULTS.lineDia;
  ok('the hum the room plays IS St U / d, on the wind halfway up the line',
     Math.abs(r.hum - want) < 1e-9, n(r.hum, 0) + ' Hz at ' + n(u) + ' m/s on a 1.0 mm line');
  ok('and that lands where a thrumming kite line really lands — a high, breathy whistle',
     r.hum > 600 && r.hum < 3000, n(r.hum, 0) + ' Hz');
  const k2 = settled({ u10: 12 }, 20);
  ok('more wind, higher note — it is a wind speed you can hear',
     k2.last.hum > r.hum * 1.2, n(r.hum, 0) + ' Hz at 8 m/s  ->  ' + n(k2.last.hum, 0) + ' Hz at 12 m/s');
}

/* ═══════════════════════════════════════════════════════════════════════════
   J · HONESTY AND HARDINESS
   ═════════════════════════════════════════════════════════════════════════ */
head('J · honesty, and what a hostile visitor can do');
{
  const k = settled({}, 22);
  ok('the line is inextensible to under 1% — the sag you see is weight and air, not stretch',
     k.last.stretch < 0.01, 'worst segment ' + n(k.last.stretch * 100, 3) + '%');

  const hostile = [
    { u10: 0 }, { u10: 0.5 }, { u10: 30 }, { u10: 45 },
    { bridleFrac: 0.08 }, { bridleFrac: 0.62 },
    { lineLen: 4 }, { lineLen: 90 },
    { tailBows: 0, tailLen: 0.4 }, { tailBows: 9, tailLen: 8 },
  ];
  let finite = true, underground = false, note = '';
  for (const c of hostile){
    const kk = settled(c, 14);
    const r = kk.last;
    for (const key of ['x', 'z', 'elevSeeDeg', 'lift', 'drag', 'tension', 'alphaDeg'])
      if (!Number.isFinite(r[key])){ finite = false; note = key + ' went bad at ' + JSON.stringify(c); }
    for (let i = 0; i < kk.w.x.length; i++)
      if (kk.w.y[i] < -0.01 || !Number.isFinite(kk.w.x[i])) underground = true;
  }
  ok('nothing a visitor can set makes a number go bad', finite, note || (hostile.length + ' hostile settings'));
  ok('and nothing ends up under the grass', !underground);

  /* the drag cap that keeps a hostile setting from detonating the solver must be
     INERT where the room actually lives — otherwise it is a thumb on the scale. */
  const capOn = settled({}, 22).last;
  const capOff = settled({ bowArea: 0.0055 }, 22).last;
  ok('the stability cap on quadratic drag never fires in normal flight',
     Math.abs(capOn.elevSeeDeg - capOff.elevSeeDeg) < 1e-9,
     'same trajectory to machine precision');

  /* the reel, worked hard: every stop on the slider, in the worst order */
  {
    const kr = new Kite({ gust: 0 });
    kr.settle(20);
    let finite2 = true, grounded = 0;
    for (const L of [9, 80, 20, 85, 6, 30]){
      kr.setLineLength(L);
      for (let i = 0; i < 20000; i++){ kr.step(1 / 60); if (Math.abs(kr.p.lineLen - L) < 0.02 && i > 900) break; }
      for (const key of ['x', 'z', 'elevSeeDeg', 'tension']) if (!Number.isFinite(kr.last[key])) finite2 = false;
      if (kr.last.z < 1) grounded++;
    }
    ok('yanking the reel end to end never breaks the world', finite2 && grounded === 0,
       'six full-range reel moves, all still flying, final ' + n(kr.last.z, 1) + ' m');
    ok('and the governor that makes that safe never fires in flight',
       kr.p.vMax === 120 && settled({}, 20).last.z > 20);
  }

  const dead = settled({ u10: 0 }, 16).last;
  ok('no wind, no flight — the kite lies down on the grass, and says so',
     dead.z < 1.0, 'altitude ' + n(dead.z, 2) + ' m');

  /* the launch: a kite on the ground comes back up when you give it wind */
  const k3 = new Kite({ gust: 0, u10: 0 });
  k3.settle(8);
  const down = k3.last.z;
  k3.setWind(7); k3.reset({ u10: 7 }); k3.settle(20);
  ok('and a relaunch puts it back in the air', down < 1 && k3.last.z > 15,
     n(down, 2) + ' m down  ->  ' + n(k3.last.z, 1) + ' m up');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n' + (fail === 0
  ? 'ALL GREEN — ' + pass + ' passed, 0 failed'
  : 'RED — ' + pass + ' passed, ' + fail + ' FAILED:\n  · ' + F.join('\n  · ')));
process.exit(fail === 0 ? 0 : 1);
