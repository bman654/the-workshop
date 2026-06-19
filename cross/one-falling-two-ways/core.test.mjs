// Node twin for One Falling, Two Ways core. Zero-dep. Run: `node cross/one-falling-two-ways/core.test.mjs`.
// Imports the SAME core.mjs that is inlined byte-identical into index.html, so the page's gold self-test
// pill and this twin can never drift. It re-proves the legs the in-page pill proves, PLUS the byte-twin
// parity + adapter-disjointness leg (Leg 6), reading both foreign cores at the SAME two ../ hops the page does.
//
//   1.  ANTI-CIRCULARITY — dtEntryV(h) === √(2·g_DT·h) and wcJetV(h) === √(2·g_WC·h) to <1e-12 (the cores'
//       own numbers, never a re-typed √(2gh)); wcJetV is AREA-INDEPENDENT (shaped bore === cylinder, 4.4e-16).
//   2.  HEADLINE (the collapse) — over a dense (0,H_MAX] sweep |fall − jet| < 1e-12 (worst 4.4e-16), every
//       pair collapsed, both === the gold groove √(2·g_GROOVE·h), and rideRatio the SAME constant √(2·g_GROOVE).
//   3.  TEETH (load-bearing warp) — the un-warped rawGap is bounded below (≥1e-4 rel at h≥0.05) AND its
//       relative value === the EXACT 1 − √(g_WC/g_DT), h-INDEPENDENT (<1e-7); ½dg/g linearization agrees <1e-3.
//   4.  NEG-CONTROL A (coasting cabin) — coastEntryV(h) flat ⟹ rideRatio spreads 2.449× ⟹ FAILS the √-collapse
//       (the real free-fall rideRatio is constant to <1e-12). Anti-vacuity.
//   5.  NEG-CONTROL B (metronome bore) — metronomeSurfaceSpeed() === WC.C flat in t ⟹ rideRatio varies ⟹
//       FAILS the √-collapse (a true Torricelli jet rideRatio is constant). Anti-vacuity.
//   6.  BYTE-TWIN PARITY + DISJOINTNESS — index.html's inlined CORE region === core.mjs CORE char-for-char;
//       the DROP-TOWER-ADAPTER block names no water-clock fn and the WATER-CLOCK-ADAPTER block names no
//       drop-tower fn (the two bridges are code-disjoint); runSelfTest passes all legs.
// process.exit(pass === total ? 0 : 1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as DT from '../../drop-tower/core.mjs';
import * as WC from '../../hours/water-clock/core.mjs';
import {
  G_DT, G_WC, G_GROOVE, H_MAX, COAST_V, H_SWEEP,
  dtEntryV, wcJetV, metronomeSurfaceSpeed,
  vSqrt, warpForGroove, grooveReadout, rawJet, rawGap, rideRatio, coastEntryV,
  runSelfTest,
} from './core.mjs';

let pass = 0, fail = 0; const fails = [];
function ck(name, ok, info) {
  if (ok) { pass++; console.log('  ✓ ' + name + (info ? '  ·  ' + info : '')); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (info ? '  ·  ' + info : '')); }
}

console.log('\nOne Falling, Two Ways — Node twin (a falling cabin and a water-clock jet ride one v=√(2gh))\n');

// ── LEG 1: ANTI-CIRCULARITY — each adapter reproduces its core's OWN √ law; the jet is area-independent ─
console.log('— Leg 1: the cabin entry speed and the jet speed are each their core\'s OWN √ law, not a re-typed literal —');
{
  let wFall = 0, wJet = 0, wArea = 0, wbFall = null, wbJet = null;
  for (const h of H_SWEEP) {
    const df = Math.abs(dtEntryV(h) - vSqrt(G_DT, h)); if (df > wFall) { wFall = df; wbFall = h; }
    const dj = Math.abs(wcJetV(h) - vSqrt(G_WC, h));   if (dj > wJet)  { wJet = dj;  wbJet = h; }
    const cyl = -WC.dhdt(h, WC.cylinderArea, WC.A_ORIFICE) * WC.cylinderArea(h) / WC.A_ORIFICE;
    wArea = Math.max(wArea, Math.abs(wcJetV(h) - cyl));
  }
  ck('dtEntryV(h) === √(2·g_DT·h) over the sweep < 1e-12 (drop-tower\'s own integrator)', wFall < 1e-12,
    'worst=' + wFall.toExponential(2) + ' at h=' + wbFall + ' · g_DT=' + G_DT);
  ck('wcJetV(h) === √(2·g_WC·h) over the sweep < 1e-12 (water-clock\'s own ODE, inverted)', wJet < 1e-12,
    'worst=' + wJet.toExponential(2) + ' at h=' + wbJet + ' · g_WC=' + G_WC);
  ck('wcJetV is AREA-INDEPENDENT: shaped bore === straight cylinder < 1e-12 (the A cancels)', wArea < 1e-12,
    'worst=' + wArea.toExponential(2));
  ck('the two g\'s differ (so the collapse is a real engineering feat, not g_DT === g_WC)', G_DT !== G_WC,
    'g_DT=' + G_DT + ' g_WC=' + G_WC);
}

// ── LEG 2: HEADLINE — the cabin entry speed and the WARPED-head jet collapse onto one √ groove ─────
console.log('\n— Leg 2: over a dense head sweep, fall-speed and (warped) jet-speed are the SAME √(2gh) groove —');
{
  let worst = 0, worstH = null, allCollapsed = true, grooveErr = 0, rrSpread = 0;
  const rrRef = Math.sqrt(2 * G_GROOVE);
  for (let i = 1; i <= 50; i++) {
    const h = H_MAX * i / 50;
    const r = grooveReadout(h);
    const d = Math.abs(r.fall - r.jet);
    if (d > worst) { worst = d; worstH = h; }
    if (!r.collapsed) allCollapsed = false;
    grooveErr = Math.max(grooveErr, Math.abs(r.fall - r.groove), Math.abs(r.jet - r.groove));
    rrSpread = Math.max(rrSpread, Math.abs(rideRatio(r.fall, h) - rrRef), Math.abs(rideRatio(r.jet, h) - rrRef));
  }
  ck('worst |fall − jet| over (0,H_MAX] < 1e-12 (machine-ε collapse)', worst < 1e-12,
    'worst=' + worst.toExponential(2) + ' at h=' + (worstH != null ? worstH.toFixed(3) : '?'));
  ck('every (fall,jet) pair reports collapsed === true across the sweep', allCollapsed);
  ck('both riders sit on the gold groove √(2·g_GROOVE·h) < 1e-12', grooveErr < 1e-12, 'maxΔ=' + grooveErr.toExponential(2));
  ck('rideRatio is the SAME constant √(2·g_GROOVE) for BOTH riders < 1e-12', rrSpread < 1e-12,
    'rrRef=' + rrRef.toFixed(9) + ' spread=' + rrSpread.toExponential(2));
  // spot-check a few via grooveReadout (the hero readout the page reads)
  for (const h of [0.05, 0.12, 0.30]) {
    const r = grooveReadout(h);
    ck('h=' + h + ': grooveReadout collapses (fall=' + r.fall.toFixed(6) + ', jet=' + r.jet.toFixed(6) + ')',
      r.collapsed, '|Δ|=' + Math.abs(r.fall - r.jet).toExponential(2));
  }
}

// ── LEG 3: TEETH — the un-warped gap is real, bounded, h-independent, and === the exact identity ───
console.log('\n— Leg 3: the un-warped jet sits a fixed gap below the cabin — the teeth that prove the warp matters —');
{
  const exactRel = 1 - Math.sqrt(G_WC / G_DT);
  let minRel = Infinity, lawErr = 0, hSpread = 0, relRef = null, capAbs = 0;
  for (const h of H_SWEEP) {
    const rel = rawGap(h) / dtEntryV(h);
    capAbs = Math.max(capAbs, rawGap(h));
    if (relRef === null) relRef = rel;
    hSpread = Math.max(hSpread, Math.abs(rel - relRef));
    lawErr = Math.max(lawErr, Math.abs(rel - exactRel));
    if (h >= 0.05) minRel = Math.min(minRel, rel);
  }
  const linLaw = 0.5 * Math.abs(G_DT - G_WC) / ((G_DT + G_WC) / 2);
  ck('the un-warped relative gap is bounded BELOW (≥1e-4) at every h≥0.05 (a real gap, not ε)', minRel >= 1e-4,
    'minRel=' + minRel.toExponential(2));
  ck('the relative gap === the EXACT teeth identity 1 − √(g_WC/g_DT) < 1e-7', lawErr < 1e-7,
    'exactRel=' + exactRel.toExponential(6) + ' worstErr=' + lawErr.toExponential(2));
  ck('the relative gap is h-INDEPENDENT (a constant fraction, not a drift) < 1e-7', hSpread < 1e-7,
    'spread=' + hSpread.toExponential(2));
  ck('the ½·dg/g linearization is the same number to <1e-3 (a sanity bound, not the claim)',
    Math.abs(exactRel - linLaw) / exactRel < 1e-3, 'lin=' + linLaw.toExponential(6) + ' rel-err=' + (Math.abs(exactRel - linLaw) / exactRel).toExponential(2));
  ck('REMOVE the warp and the gap caps at ~1.7e-4 — NEVER machine-ε (so the warp is load-bearing)',
    capAbs > 1e-9 && exactRel > 1e-6, 'absCap=' + capAbs.toExponential(3) + ' relCap=' + exactRel.toExponential(3));
}

// ── LEG 4: NEG-CONTROL A — a coasting cabin doesn't obey v=√(2gh), so it fails the √-collapse ──────
console.log('\n— Leg 4 (load-bearing): a cable-held cabin coasts flat — its rideRatio spreads, so it fails the √ —');
{
  const hs = [0.05, 0.15, 0.30];
  const coastFlat = coastEntryV(hs[0]) === coastEntryV(hs[1]) && coastEntryV(hs[1]) === coastEntryV(hs[2]);
  ck('coastEntryV(h) is FLAT in h (a cable-held cabin, a=0, no h→v)', coastFlat, 'COAST_V=' + COAST_V.toFixed(6));
  const cr = hs.map(h => rideRatio(coastEntryV(h), h));
  const coastRatio = Math.max(...cr) / Math.min(...cr);
  ck('the coasting rideRatio v/√h SPREADS across heads (>2×, measured 2.449×) ⟹ FAILS the √-collapse',
    coastRatio > 2, 'spread=' + coastRatio.toFixed(4) + '× (min=' + Math.min(...cr).toFixed(4) + ' max=' + Math.max(...cr).toFixed(4) + ')');
  const fr = hs.map(h => rideRatio(dtEntryV(h), h));
  ck('anti-vacuity: the REAL free-fall rideRatio is the SAME constant at every head < 1e-12',
    (Math.max(...fr) - Math.min(...fr)) < 1e-12, 'realSpread=' + (Math.max(...fr) - Math.min(...fr)).toExponential(2));
  ck('a √-collapse classifier PASSES the real cabin (constant ratio) but FAILS the coast (spread ratio)',
    (Math.max(...fr) - Math.min(...fr)) < 1e-12 && coastRatio > 2);
}

// ── LEG 5: NEG-CONTROL B — the metronome surface drops at a flat rate, so it fails the √-collapse ──
console.log('\n— Leg 5 (load-bearing): the even-ticking bore drops the surface at a flat WC.C — it cannot ride the √ —');
{
  ck('metronomeSurfaceSpeed() === WC.C exactly (the water-clock\'s own constant tick)',
    metronomeSurfaceSpeed() === WC.C, 'WC.C=' + WC.C + ' m/s (= H0/T_DRAIN)');
  const hs = [0.05, 0.15, 0.30];
  const mr = hs.map(h => rideRatio(metronomeSurfaceSpeed(), h));
  const metSpread = Math.max(...mr) - Math.min(...mr);
  ck('the metronome rideRatio C/√h VARIES with head (spread >1e-2) ⟹ FAILS the √-collapse',
    metSpread > 1e-2, 'spread=' + metSpread.toExponential(2) + ' (min=' + Math.min(...mr).toFixed(4) + ' max=' + Math.max(...mr).toFixed(4) + ')');
  const jr = hs.map(h => rideRatio(wcJetV(h), h));
  ck('anti-vacuity: a TRUE Torricelli jet over the same heads rides ONE constant ratio < 1e-12',
    (Math.max(...jr) - Math.min(...jr)) < 1e-12, 'jetSpread=' + (Math.max(...jr) - Math.min(...jr)).toExponential(2));
}

// ── LEG 6: BYTE-TWIN PARITY + ADAPTER DISJOINTNESS — the page IS the module; the two bridges disjoint ─
console.log('\n— Leg 6: byte-twin parity (page CORE === core.mjs CORE) + the two adapters are code-disjoint —');
{
  const BEGIN = '// === CORE BEGIN ===', END = '// === CORE END ===';
  const region = (text) => { const i = text.indexOf(BEGIN), j = text.indexOf(END); return (i < 0 || j < 0 || j < i) ? null : text.slice(i, j + END.length); };
  const here = dirname(fileURLToPath(import.meta.url));
  const coreSrc = readFileSync(join(here, 'core.mjs'), 'utf8');
  const coreReg = region(coreSrc);
  const pageReg = region(readFileSync(join(here, 'index.html'), 'utf8'));
  ck('byte-twin: core.mjs CORE region present', !!coreReg);
  ck('byte-twin: index.html CORE region present', !!pageReg);
  ck('byte-twin PARITY: index.html CORE === core.mjs CORE (byte-identical)',
    !!coreReg && !!pageReg && coreReg === pageReg,
    coreReg == null ? 'core sentinels MISSING' : pageReg == null ? 'page sentinels MISSING' :
      (coreReg === pageReg ? 'slice ' + coreReg.length + ' chars identical' : 'DRIFT (core ' + coreReg.length + ' vs page ' + pageReg.length + ')'));

  // adapter disjointness: slice the two sub-sentineled bridges and grep each for the OTHER's fns.
  const slice = (a, b) => { const i = coreSrc.indexOf(a), j = coreSrc.indexOf(b); return (i < 0 || j < 0) ? '' : coreSrc.slice(i, j); };
  const dtBlock = slice('DROP-TOWER-ADAPTER BEGIN', 'DROP-TOWER-ADAPTER END');
  const wcBlock = slice('WATER-CLOCK-ADAPTER BEGIN', 'WATER-CLOCK-ADAPTER END');
  ck('the DROP-TOWER-ADAPTER block names NO water-clock fn (dhdt/shapedArea/cylinderArea/A_ORIFICE/WC\\.)',
    dtBlock.length > 0 && !/dhdt|shapedArea|cylinderArea|A_ORIFICE|\bWC\./.test(dtBlock));
  ck('the WATER-CLOCK-ADAPTER block names NO drop-tower fn (integrate/vBrakeEntry/DT\\.)',
    wcBlock.length > 0 && !/integrate|vBrakeEntry|\bDT\./.test(wcBlock));
}

// ── LEG 7: PARITY with the shared runSelfTest (the function the page inlines as its pill) ──────────
console.log('\n— Leg 7: the shared runSelfTest (the page pill) agrees —');
{
  const r = runSelfTest();
  ck('core.mjs runSelfTest passes all legs', r.ok,
    r.passed + '/' + r.total + (r.ok ? '' : ' · ' + r.checks.filter(c => !c.ok).map(c => c.name).join(',')));
}

console.log('\n—— One Falling, Two Ways Node twin: ' + pass + '/' + (pass + fail) + ' ——');
if (fail) { console.log('  FAILING: ' + fails.join(' · ')); process.exit(1); }
console.log('  ALL GREEN ✓\n');
process.exit(0);
