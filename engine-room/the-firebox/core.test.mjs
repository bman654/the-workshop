/* ══════════════════════════════════════════════════════════════════════════════
   THE FIREBOX — the Node twin.

       node engine-room/the-firebox/core.test.mjs

   Every number the room prints about its chemistry is measured here, out of
   the same `reactStep` the reaction shader mirrors — and the page's "prove it"
   bench runs that shader over a known strip and checks the readback against
   this very function, so the two are not allowed to drift apart quietly.
   ══════════════════════════════════════════════════════════════════════════════ */
import {
  BOX, FIRE, glslDefines,
  reactStep, logStep, Log, segDist, segSegDist, settleLog, touches, hits, openingLogs,
  Cell, sustainRun, adiabaticFlameT,
} from './core.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log('  \x1b[32mok\x1b[0m   ' + name + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : '')); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '  ' + detail); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const H = (s) => console.log('\n\x1b[1m' + s + '\x1b[0m');

/* ── A · combustion ───────────────────────────────────────────────────────── */
H('A · what burning does to a cell of gas');
{
  const dt = 1 / 240;
  /* the heat released is exactly Q_FUEL per unit burned — nothing else in the
     step touches T when the losses are switched off */
  const save = { c: FIRE.COOL_CONV, r: FIRE.COOL_RAD };
  FIRE.COOL_CONV = 0; FIRE.COOL_RAD = 0;
  const before = { T: 1400, fuel: 0.5, soot: 0 };
  const after = reactStep(before, 0, 0, 1, dt);
  const burned = before.fuel - after.fuel;
  ok('ΔT = Q_FUEL × (fuel burned), to the last digit',
    near(after.T - before.T, burned * FIRE.Q_FUEL, 1e-9),
    `burned ${burned.toFixed(5)} → +${(after.T - before.T).toFixed(2)} K`);
  FIRE.COOL_CONV = save.c; FIRE.COOL_RAD = save.r;

  const cold = reactStep({ T: 400, fuel: 0.5, soot: 0 }, 0, 0, 1, dt);
  ok('cold fuel does not burn — gas below the ignition knee just sits there',
    near(cold.fuel, 0.5, 1e-6) && cold.T < 400, `fuel ${cold.fuel.toFixed(4)}`);
  const hot = reactStep({ T: 1100, fuel: 0.5, soot: 0 }, 0, 0, 1, dt);
  ok('the same gas above the knee burns', hot.fuel < 0.5 - 1e-4, `fuel ${hot.fuel.toFixed(4)}`);

  const openB = reactStep({ T: 1100, fuel: 0.5, soot: 0 }, 0, 0, 1, dt).burn;
  const shutB = reactStep({ T: 1100, fuel: 0.5, soot: 0 }, 0, 0, 0, dt).burn;
  ok('the damper is the throttle: open burns faster than shut',
    openB > shutB * 3, `${openB.toExponential(3)} vs ${shutB.toExponential(3)}`);

  const T_ad = adiabaticFlameT();
  ok('the adiabatic flame temperature lands where a wood flame’s does (1800–2050 K)',
    T_ad > 1800 && T_ad < 2050, T_ad.toFixed(0) + ' K');

  /* a rich cell chokes itself: doubling the fuel does NOT double the burn */
  const b1 = reactStep({ T: 1500, fuel: 0.3, soot: 0 }, 0, 0, 1, dt).burn;
  const b2 = reactStep({ T: 1500, fuel: 0.6, soot: 0 }, 0, 0, 1, dt).burn;
  ok('twice the fuel is less than twice the burning — it starves itself of air',
    b2 < 2 * b1 && b2 > b1, `${(b2 / b1).toFixed(3)}× for 2× the fuel`);
}

/* ── B · soot: why a flame is yellow at the top and blue at the root ─────── */
H('B · soot is made rich and burned lean');
{
  const dt = 1 / 240;
  const rich = reactStep({ T: 1500, fuel: 0.9, soot: 0 }, 0, 0, 1, dt);
  const lean = reactStep({ T: 1500, fuel: 0.06, soot: 0 }, 0, 0, 1, dt);
  ok('a rich cell makes soot per unit burned; a lean one makes almost none',
    rich.soot / (rich.burn || 1e-9) > 12 * (lean.soot / (lean.burn || 1e-9)),
    `${(rich.soot / rich.burn).toFixed(2)} vs ${(lean.soot / lean.burn).toFixed(2)} per unit burned`);

  let s = { T: 1900, fuel: 0, soot: 1 };
  for (let i = 0; i < 240; i++) s = reactStep(s, 0, 0, 1, dt);
  ok('soot in hot lean gas is half gone within a second', s.soot < 0.6, s.soot.toFixed(3));
  let s2 = { T: 1000, fuel: 0, soot: 1 };
  for (let i = 0; i < 240; i++) s2 = reactStep(s2, 0, 0, 1, dt);
  ok('soot in cool gas does not — that is what smoke IS', s2.soot > 0.9, s2.soot.toFixed(3));

  /* the radiating body is the soot, so a sooty parcel cools faster */
  const clean = reactStep({ T: 1800, fuel: 0, soot: 0 }, 0, 0, 1, dt);
  const sooty = reactStep({ T: 1800, fuel: 0, soot: 1 }, 0, 0, 1, dt);
  ok('a sooty parcel radiates its heat away faster than a clean one',
    sooty.T < clean.T - 0.05, `${sooty.T.toFixed(2)} K vs ${clean.T.toFixed(2)} K after one tick`);
}

/* ── C · the loop that IS a fire ─────────────────────────────────────────── */
H('C · a lit log sustains itself, and goes out when you shut the air off');
{
  const open = sustainRun(1.0, 14);
  const shut = sustainRun(0.0, 60);
  const smoulder = sustainRun(0.42, 30);
  ok('damper open: the fire is still burning, and the WOOD is hot too',
    open.end.T > 1500 && open.endLogT > FIRE.T_PYRO,
    `gas ${open.end.T.toFixed(0)} K, wood ${open.endLogT.toFixed(0)} K`);
  const surfOut = shut.logHist.findIndex((v) => v < FIRE.T_PYRO) * (24 / 240);
  const coreOut = shut.coreHist.findIndex((v) => v < FIRE.T_PYRO) * (24 / 240);
  ok('damper shut: the same log falls below ignition, and so does the wood',
    shut.end.T < FIRE.T_IGN && shut.endLogT < FIRE.T_PYRO,
    `gas ${shut.end.T.toFixed(0)} K, wood ${shut.endLogT.toFixed(0)} K`);
  ok('the flame stops at once and the surface follows within seconds, but the log\u2019s INTERIOR takes many times as long',
    surfOut > 0.5 && coreOut > 6 * surfOut,
    `surface cool at ${surfOut.toFixed(1)} s, interior at ${coreOut.toFixed(1)} s`);
  ok('open is hotter than shut at every moment past the first second',
    open.hist.slice(10).every((v, i) => v > shut.hist.slice(10)[i]));
  const cold = sustainRun(1.0, 12, 500);
  ok('a log that never got hot enough never lights (500 K start stays dead)',
    cold.end.T < FIRE.T_PYRO + 40, cold.end.T.toFixed(0) + ' K');
  const nowood = sustainRun(1.0, 14, 1400, 0);
  ok('gas with no wood under it burns its fuel and cools to the room',
    nowood.end.T < 400 && nowood.end.fuel < 1e-3, nowood.end.T.toFixed(0) + ' K');

  const wide = sustainRun(1.0, 30);
  ok('a half-shut damper smoulders instead: cooler, and thicker with soot',
    smoulder.end.T > FIRE.T_IGN && smoulder.end.T < wide.end.T - 300
    && smoulder.end.soot / smoulder.end.burn > wide.end.soot / wide.end.burn,
    `${smoulder.end.T.toFixed(0)} K vs ${wide.end.T.toFixed(0)} K wide open`);

  /* THE POINT OF THERMAL MASS: blow the flame flat for half a second and the
     log's interior holds its surface above the gasifying temperature, so the
     fire comes back by itself.  Hold it off for four seconds and it does not.
     Both are run on the same cell, by the same step(). */
  {
    const dt = 1 / 240;
    const gustRun = (gustSeconds) => {
      const c = new Cell(1300);
      const run = (secs, starve) => { for (let i = 0; i < secs / dt; i++) c.step(1.0, dt, 1, starve); };
      run(12, false);
      const hot = { gas: c.T, surf: c.Ts, core: c.Tc };
      run(gustSeconds, true);
      const afterGust = c.Ts;
      run(6, false);
      return { hot, afterGust, back: c.T };
    };
    const short = gustRun(0.5), long = gustRun(4);
    ok('at steady burn the surface is hotter than the core, and both are gasifying',
      short.hot.surf > short.hot.core && short.hot.core > FIRE.T_PYRO,
      `gas ${short.hot.gas.toFixed(0)} · surface ${short.hot.surf.toFixed(0)} · core ${short.hot.core.toFixed(0)} K`);
    ok('half a second of cold draught leaves the surface still gasifying',
      short.afterGust > FIRE.T_PYRO, `surface ${short.afterGust.toFixed(0)} K`);
    ok('…and the flame comes back on its own',
      short.back > FIRE.T_IGN, `gas back to ${short.back.toFixed(0)} K of ${short.hot.gas.toFixed(0)}`);
    ok('four seconds of it does put the fire out — the mass is finite',
      long.back < FIRE.T_IGN,
      `surface ${long.afterGust.toFixed(0)} K, gas ${long.back.toFixed(0)} K`);
  }

  /* the log's own balance: heated by the gas, taxed by every unit it gives off */
  ok('a log in cold air cools toward the room', logStep(1400, 1400, FIRE.T_AMB, 0, 1).Ts < 1400);
  ok('a log in a hot flame warms up', logStep(700, 700, 1600, 0, 0.1).Ts > 700);
  ok('gasifying costs the wood heat',
    logStep(1200, 1200, 1200, 0.5, 0.1).Ts < logStep(1200, 1200, 1200, 0, 0.1).Ts,
    (logStep(1200, 1200, 1200, 0, 0.1).Ts - logStep(1200, 1200, 1200, 0.5, 0.1).Ts).toFixed(2) + ' K a tick');
  ok('the interior only ever follows the surface, and slowly',
    logStep(1500, 400, 1500, 0, 1).Tc > 400 && logStep(1500, 400, 1500, 0, 1).Tc < 600,
    logStep(1500, 400, 1500, 0, 1).Tc.toFixed(0) + ' K after a whole second');

  /* the steady state is a flame temperature, not a runaway */
  const long = sustainRun(1.0, 90);
  ok('and it settles below the adiabatic flame temperature instead of running away',
    long.end.T < adiabaticFlameT() && long.end.T > 1000,
    long.end.T.toFixed(0) + ' K after a minute');
}

/* ── D · logs are capsules and they rest on each other ───────────────────── */
H('D · dropping a log');
{
  const a = [0, 0], b = [1, 0];
  ok('point-to-segment distance is the perpendicular where it should be',
    near(segDist([0.5, 0.3], a, b), 0.3, 1e-12));
  ok('…and the endpoint distance past the end', near(segDist([1.4, 0], a, b), 0.4, 1e-12));
  ok('parallel segments one apart', near(segSegDist([0, 0], [1, 0], [0, 1], [1, 1]), 1, 1e-9));
  ok('crossing segments touch', segSegDist([0, -1], [0, 1], [-1, 0], [1, 0]) < 1e-9);

  const grate = BOX.GRATE_Y;
  const first = settleLog(new Log(0.36, 0.7, 0, 0.4, 0.045), [], grate);
  ok('a log dropped into an empty box comes to rest ON the grate',
    near(first.y - first.rad, grate, 0.006), `bottom at ${(first.y - first.rad).toFixed(4)} m, grate ${grate}`);
  ok('…and not through it', first.y - first.rad >= grate - 1e-9);

  const second = settleLog(new Log(0.36, 0.8, 0.0, 0.36, 0.04), [first], grate);
  ok('a second log dropped on the first rests on TOP of it', second.y > first.y + first.rad * 0.5,
    `${second.y.toFixed(3)} m vs ${first.y.toFixed(3)} m`);
  const [p0, p1] = second.ends(), [q0, q1] = first.ends();
  ok('and the two do not intersect', segSegDist(p0, p1, q0, q1) >= first.rad + second.rad - 1e-3,
    segSegDist(p0, p1, q0, q1).toFixed(4));

  const pile = openingLogs();
  ok('the opening arrangement is three logs', pile.length === 3);
  let clear = true;
  for (let i = 0; i < pile.length; i++) for (let j = i + 1; j < pile.length; j++){
    const [x0, x1] = pile[i].ends(), [y0, y1] = pile[j].ends();
    if (segSegDist(x0, x1, y0, y1) < pile[i].rad + pile[j].rad - 2e-3) clear = false;
  }
  ok('…and none of them is inside another', clear);
  ok('all of them are inside the box',
    pile.every((l) => l.ends().every((e) => e[0] > 0 && e[0] < BOX.W && e[1] > 0 && e[1] < BOX.H)));
  ok('the top log is held up by the two below it',
    pile[2].y - pile[2].rad > BOX.GRATE_Y + 0.01, (pile[2].y - pile[2].rad).toFixed(3));
  ok('hits() sees the grate', hits(new Log(0.3, BOX.GRATE_Y, 0, 0.3, 0.04), [], BOX.GRATE_Y));
  ok('touches() is symmetric', touches(pile[0], pile[2], 0.02) === touches(pile[2], pile[0], 0.02));
}

/* ── E · the shader gets the same numbers, by construction ───────────────── */
H('E · one set of constants, two languages');
{
  const g = glslDefines();
  ok('every numeric constant reaches the shader as an F_ define',
    Object.keys(FIRE).filter((k) => typeof FIRE[k] === 'number')
      .every((k) => g.includes('#define F_' + k + ' ')),
    g.split('\n').length - 1 + ' defines');
  ok('and every one of them has a decimal point (GLSL floats, not ints)',
    g.trim().split('\n').every((l) => /^#define F_\w+ -?\d+\.\d+(e-?\d+)?$/.test(l)),
    g.trim().split('\n').find((l) => !/^#define F_\w+ -?\d+\.\d+(e-?\d+)?$/.test(l)) || 'all clean');
  ok('extra defines ride along', glslDefines({ NX: BOX.NX }).includes('#define F_NX 176.0'));
  ok('the grid is the aspect of the box, within a percent',
    Math.abs((BOX.NX / BOX.NY) / (BOX.W / BOX.H) - 1) < 0.01,
    `${(BOX.NX / BOX.NY).toFixed(4)} vs ${(BOX.W / BOX.H).toFixed(4)}`);
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
