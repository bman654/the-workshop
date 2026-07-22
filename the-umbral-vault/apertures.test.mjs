#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   the-umbral-vault/apertures.test.mjs — THE PAYOFF-LIVENESS TWIN.

   The Umbral Vault makes NO mathematical claim of its own; every optic it throws
   is already proved in the room it came from. What this twin proves is that the
   vault is ALIVE — that each aperture really throws its light and does its trick —
   because an aperture that renders beautifully and never changes is silent,
   error-free, and a total failure. That is the exact thing this file exists to
   catch, driven through the apertures' OWN entry functions (aim/step), never a
   canvas pointer event; drawThrow()/drawRecess() are never called here.

   Per the design's payoff-liveness contract:
     (1) each shipped core's runSelfTest is green,
     (2) sweeping the sun horizon→zenith→horizon MOVES every sun-coupled aperture's
         cast state across frames,
     (3) each named payoff FIRES (teacup's 2nd cusp born; mirage puddle blooms AND
         vanishes, with a flat-profile neg-control; sky-wash walks blue→red→blue;
         Fermat path re-bends with residuals→0; pool caustic re-knots),
     (4) first-light's own clock reddens (decoupled from the sun),
     (5) the vault's own DAWN — all six paying off at once,
     (6) every door href resolves to an existing room index.html.

   Run: node the-umbral-vault/apertures.test.mjs   → exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeApertures, ROOM_IDS, sunFromT } from './apertures.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dir, 'index.src.html'), 'utf8');

const checks = [];
const ok = (name, cond, note = '') => checks.push({ name, ok: !!cond, note });

/* import each room core from ITS OWN path — the provenance anchor */
const cores = {
  'pool':               await import('../pool/core.mjs'),
  'refraction-run':     await import('../refraction-run/core.mjs'),
  'why-the-sky-is-blue':await import('../why-the-sky-is-blue/core.mjs'),
  'teacup-caustic':     await import('../teacup-caustic/core.mjs'),
  'mirage':             await import('../mirage/core.mjs'),
  'first-light':        await import('../first-light/core.mjs'),
};

const includeRe = (room) =>
  new RegExp('^[ \\t]*<!--[ \\t]*forge:include[ \\t]+' +
             room.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[ \\t]*-->[ \\t]*$', 'm');

const snap = (a) => JSON.stringify(a.castState());

/* sweep the sun dawn→noon→dusk, driving ONLY the apertures' real entry fns */
function sweep(aps, steps = 48, { dt = 1 / 30 } = {}) {
  const snaps = aps.map(() => []);
  for (let i = 0; i <= steps; i++) {
    const sun = sunFromT(i / steps);
    aps.forEach((a, k) => { a.aim(sun); a.step(dt, sun); snaps[k].push(snap(a)); });
  }
  return snaps;
}

/* a robust green-check across the estate's several runSelfTest report shapes:
   {checks:[{ok|pass}]}, {pass,total}, {pass,fail} */
function coreGreen(r) {
  if (r && r.checks) return r.checks.every((c) => c.ok || c.pass);
  if (r && r.total != null) return r.pass === r.total;
  if (r && r.fail != null) return r.fail === 0;
  return false;
}

/* ── (0) each shipped core is present and green ──────────────────────────── */
{
  let bad = '';
  for (const id of ROOM_IDS) { if (!coreGreen(cores[id].runSelfTest())) bad += id + ' '; }
  ok('(1) every shipped room core runs GREEN in this build', bad === '', bad ? 'FAILING: ' + bad : 'all six cores green');
}

/* ── (a) provenance: order, hrefs, forge:include, door existence ─────────── */
{
  const aps = makeApertures(cores);
  ok('(a) the vault builds all six apertures in the expected order',
     aps.length === 6 && aps.every((a, i) => a.id === ROOM_IDS[i]),
     aps.map((a) => a.id).join(' · '));
  let badHref = '', badInc = '', badDoor = '';
  for (const a of aps) {
    if (a.href !== `../${a.id}/index.html`) badHref = a.id;
    if (!includeRe(`../${a.id}/core.mjs`).test(SRC)) badInc = a.id;
    if (!existsSync(join(__dir, '..', a.id, 'index.html'))) badDoor = a.id;   // (6) door resolves
  }
  ok('(a) every aperture names its room door (../<room>/index.html)', badHref === '', badHref || 'all six');
  ok('(a) index.src.html forge:includes each room\'s core.mjs', badInc === '', badInc ? 'MISSING ' + badInc : 'all six inlined');
  ok('(6) every brass-plaque door resolves to an existing room index.html', badDoor === '', badDoor ? 'MISSING ' + badDoor : 'all six doors live');
}

/* ── (2) MOTION: sweeping the sun moves every sun-coupled aperture ───────── */
{
  const aps = makeApertures(cores);
  const snaps = sweep(aps);
  const sunCoupled = aps.filter((a) => a.tier[0] !== 'C');
  let frozen = '';
  for (const a of aps) {
    if (a.tier[0] === 'C') continue;
    const s = snaps[aps.indexOf(a)];
    const moved = s.some((v) => v !== s[0]);
    if (!moved) frozen += a.id + ' ';
  }
  ok('(2) the sun sweep MOVES the cast of every sun-coupled aperture',
     frozen === '', frozen ? 'FROZEN: ' + frozen : sunCoupled.map((a) => a.id).join(', '));
}

/* ── (3) each named payoff FIRES, driven through the sun sweep ───────────── */
{
  const aps = makeApertures(cores);
  sweep(aps);
  const by = Object.fromEntries(aps.map((a) => [a.id, a]));

  ok('(3) pool PAYOFF: the net knots into a caustic and re-knots as sun+surface move',
     by['pool'].payoff() && by['pool'].causticCount() > 0,
     `caustic pts = ${by['pool'].causticCount()}`);

  ok('(3) teacup PAYOFF: the 2nd cusp is BORN — cuspCount reaches cardioid(1) AND nephroid(2)',
     by['teacup-caustic'].payoff() && by['teacup-caustic'].st.sawOne && by['teacup-caustic'].st.sawTwo,
     `saw ${cores['teacup-caustic'].cuspCount(1)} @R=1, ${cores['teacup-caustic'].cuspCount(1.6)} @R=1.6`);

  ok('(3) refraction PAYOFF: the path RE-BENDS and the re-bent path is Fermat (Snell residual → 0)',
     by['refraction-run'].payoff(), `max residual now ${by['refraction-run'].st.res.toExponential(2)}`);

  ok('(3) mirage PAYOFF: the false water BLOOMS (a grazing ray turns) AND VANISHES (a steep ray dives in)',
     by['mirage'].payoff() && by['mirage'].st.sawBloom && by['mirage'].st.sawVanish,
     `bloom=${by['mirage'].st.sawBloom} vanish=${by['mirage'].st.sawVanish}`);

  ok('(3) sky PAYOFF: the wash WALKS blue→red→blue across the sky',
     by['why-the-sky-is-blue'].payoff(),
     `saw blue=${by['why-the-sky-is-blue'].st.sawBlue} red=${by['why-the-sky-is-blue'].st.sawRed}`);
}

/* ── (3 neg-controls) the payoffs mean something ────────────────────────── */
{
  const TC = cores['teacup-caustic'];
  ok('(neg) teacup: cuspCount(1)=1 (cardioid) and cuspCount(1.5)=2 (nephroid) — a real bifurcation',
     TC.cuspCount(1) === 1 && TC.cuspCount(1.5) === 2, `${TC.cuspCount(1)} / ${TC.cuspCount(1.5)}`);

  const aps = makeApertures(cores);
  const mir = aps.find((a) => a.id === 'mirage');
  ok('(neg) mirage: a FLAT profile (zero gradient) has NO false water — puddleHorizon is null',
     mir.horizonFlat() == null, `flat horizon = ${mir.horizonFlat()}`);

  const POOL = cores['pool'];
  const flatP = POOL.makeParams(POOL.flatSurface(), { sunTilt: 0.3 });
  ok('(neg) pool: a FLAT surface throws no caustic — the fold set det J=0 is empty',
     POOL.foldContour(flatP, 60).length === 0, `flat fold pts = ${POOL.foldContour(flatP, 60).length}`);

  const SK = cores['why-the-sky-is-blue'];
  const domZenith = SK.dominantWavelength(SK.transmittedSpectrum(SK.airmass(0), 1));
  const domHorizon = SK.dominantWavelength(SK.transmittedSpectrum(SK.airmass(Math.PI / 2 - 0.02), 1));
  ok('(neg) sky: the survivor reddens with the slant — dominant λ(horizon) > λ(zenith)',
     domHorizon > domZenith, `${domZenith.toFixed(1)} → ${domHorizon.toFixed(1)} nm`);
}

/* ── (4) first-light reddens on its OWN clock, deaf to the sun ───────────── */
{
  const aps = makeApertures(cores);
  const fl = aps.find((a) => a.id === 'first-light');
  const FL = cores['first-light'];
  ok('(neg) first-light: at a=a₀ there is no redshift (z=0) — the reddening is real',
     Math.abs(FL.redshift(1, 1)) < 1e-12, `z(1,1) = ${FL.redshift(1, 1)}`);
  const before = fl.st.z;
  // step it forward with a FROZEN sun — it must still redden
  const frozenSun = sunFromT(0.5);
  for (let i = 0; i < 60; i++) { fl.aim(frozenSun); fl.step(1 / 30, frozenSun); }
  ok('(4) first-light PAYOFF: it reddens on its own cosmic clock (z climbs) with the sun held still',
     fl.payoff() && fl.st.z > before, `z ${before.toFixed(3)} → ${fl.st.z.toFixed(3)}, λ=${fl.st.lam.toFixed(3)}`);
}

/* ── (5) the vault's DAWN: all six paying off from one shared sweep ──────── */
{
  const aps = makeApertures(cores);
  const snaps = sweep(aps, 60);
  // give first-light a few frames of its own clock (it ignores the sun)
  const fl = aps.find((a) => a.id === 'first-light');
  for (let i = 0; i < 30; i++) fl.step(1 / 30, sunFromT(0.5));
  const paid = aps.filter((a) => a.payoff());
  ok('(5) THE VAULT\'S DAWN — all six apertures have thrown their payoff at once',
     paid.length === 6, `${paid.length}/6 lit` + (paid.length < 6 ? ' — dark: ' + aps.filter((a) => !a.payoff()).map((a) => a.id).join(',') : ''));
  // and every sun-coupled cast really did visit many distinct states (not a 2-state flicker)
  let thin = '';
  aps.forEach((a, k) => { if (a.tier[0] !== 'C' && new Set(snaps[k]).size < 6) thin += a.id + ' '; });
  ok('(5) each sun-coupled cast swept through many distinct states, not a flicker', thin === '', thin || 'all rich');
}

/* ── (reduced motion) settle() poses a still, non-drifting frame ─────────── */
{
  const aps = makeApertures(cores);
  const golden = sunFromT(0.155);
  let bad = '';
  for (const a of aps) {
    a.settle(golden);
    const s0 = snap(a);
    a.step(0, golden);                       // a zero-dt tick must not move a posed frame
    if (snap(a) !== s0 && a.tier[0] !== 'C') bad += a.id + ' ';   // first-light's clock is exempt
  }
  ok('(reduced motion) settle() poses every aperture in a still cast that does not drift at dt=0',
     bad === '', bad || 'all posed');
}

/* ── report ─────────────────────────────────────────────────────────────── */
for (const c of checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.note ? '  ·  ' + c.note : ''));
const pass = checks.filter((c) => c.ok).length;
console.log(`\n${pass}/${checks.length} ${pass === checks.length ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === checks.length ? 0 : 1);
