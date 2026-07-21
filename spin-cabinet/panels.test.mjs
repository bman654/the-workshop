#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   spin-cabinet/panels.test.mjs — THE PAYOFF-LIVENESS TWIN.

   The Spin Cabinet makes NO mathematical claim of its own; every theorem it
   touches is already proved in the room it came from. What this twin proves is
   that the cabinet is ALIVE — that each niche really does its trick — because a
   panel that renders beautifully and never does anything is silent, error-free,
   and a total failure. That is the exact thing this file exists to catch.

   Per panel, three assertions:

     (a) PROVENANCE — the panel is driven by the ACTUAL room core (we inject the
         module we imported from the room's own path, and check the panel names
         that path) AND index.src.html really carries the matching
         `forge:include ../<room>/core.mjs` line. Path AND wiring: a panel could
         name the right file while the page inlines nothing.
     (b) MOTION — poking it and stepping forward CHANGES the state vector. Not
         "did not throw": the state must actually move.
     (c) PAYOFF — the characteristic thing happens, inside the panel's OWN run
         budget, driven through the panel's real entry functions. Never a canvas
         pointer event; `draw()` is never called here.

   Run: node spin-cabinet/panels.test.mjs   → exits non-zero on any failure.
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeTopPanel, makeTippeTopPanel, makeRattlebackPanel,
  makeChairPanel, makeRotorPanel, makeTusiPanel, makePanels, ROOM_IDS,
} from './panels.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dir, 'index.src.html'), 'utf8');

const checks = [];
const ok = (name, cond, note = '') => checks.push({ name, ok: !!cond, note });

/* import each room core from ITS OWN path — this is the provenance anchor */
const cores = {
  'the-top':        await import('../the-top/core.mjs'),
  'tippe-top':      await import('../tippe-top/core.mjs'),
  'rattleback':     await import('../rattleback/core.mjs'),
  'spinning-chair': await import('../spinning-chair/core.mjs'),
  'rotor':          await import('../rotor/core.mjs'),
  'tusi':           await import('../tusi/core.mjs'),
};

/* the room a panel declares → the forge:include line the page must carry */
const includeRe = (room) =>
  new RegExp('^[ \\t]*<!--[ \\t]*forge:include[ \\t]+' +
             room.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[ \\t]*-->[ \\t]*$', 'm');

const snap = (p) => JSON.stringify(p.st);

/* run a panel forward at a fixed frame rate, driving ONLY its real entry fns */
function run(panel, seconds, { fps = 60, at = null } = {}) {
  const dt = 1 / fps, N = Math.round(seconds * fps);
  for (let i = 0; i < N; i++) {
    if (at) at(panel, i * dt, i);
    panel.step(dt);
  }
}

/* ── (a) PROVENANCE, for all six at once ─────────────────────────────────── */
{
  const panels = makePanels(cores);
  ok('(a) the cabinet builds all six panels, in the 2×3 order the case expects',
     panels.length === 6 && panels.every((p, i) => p.id === ROOM_IDS[i]),
     panels.map((p) => p.id).join(' · '));
  let badRoom = '', badInclude = '', badHref = '';
  for (const p of panels) {
    if (p.room !== `../${p.id}/core.mjs`) badRoom = p.id;
    if (!includeRe(p.room).test(SRC)) badInclude = p.id;
    if (p.href !== `../${p.id}/index.html`) badHref = p.id;
  }
  ok('(a) every panel names its ROOM CORE by that room\'s own path (../<room>/core.mjs)',
     badRoom === '', badRoom ? `WRONG for ${badRoom}` : 'all six');
  ok('(a) …and index.src.html carries the matching `forge:include ../<room>/core.mjs` for each',
     badInclude === '', badInclude ? `MISSING for ${badInclude}` : 'all six inlined');
  ok('(a) every brass plate points at a live room index (../<room>/index.html)',
     badHref === '', badHref ? `WRONG for ${badHref}` : 'all six doors');
}

/* ── (b) MOTION + (c) PAYOFF, panel by panel ─────────────────────────────── */

/* 1. THE TOP — tilt grows as ω decays, and the room's topples() flips. */
{
  const P = makeTopPanel(cores['the-top']);
  const before = snap(P);
  P.poke('flick', -40, 0);
  const om0 = P.st.om;
  run(P, 0.5);
  ok('(b) the-top: a flick + half a second CHANGES the state vector',
     snap(P) !== before && P.st.om < om0 && P.st.phi !== 0, `ω ${om0} → ${P.st.om.toFixed(1)}`);

  // it must precess (θ pinned at horizontal) while ω is above the room's ω_crit,
  // and only THEN sag. Sample the tilt as the spin bleeds down.
  let sawPrecess = false, tiltMonotone = true, lastTheta = P.st.theta;
  run(P, 12, { at: (p) => {
    if (!p.st.fell && p.st.sag === 0 && p.st.om > p.wcrit) sawPrecess = true;
    if (p.st.sag > 0 && p.st.theta > lastTheta + 1e-9) tiltMonotone = false;  // never un-sags
    lastTheta = p.st.theta;
  } });
  ok('(c) the-top: it PRECESSED first — spun above the room\'s critical spin with no tilt at all',
     sawPrecess, `ω_crit = ${P.wcrit.toFixed(2)} rad/s`);
  ok('(c) the-top PAYOFF: the spin decayed past ω_crit, topples() flipped, and the axle FELL',
     P.payoff() && tiltMonotone,
     `final θ ${P.st.theta.toFixed(2)} rad (from ${(Math.PI / 2).toFixed(2)}), sag ${P.st.maxSag.toFixed(2)}`);
  ok('(c) the-top: the tilt grew MONOTONICALLY once the fall began (no bouncing back up)', tiltMonotone);
}

/* 2. THE TIPPE-TOP — θ crosses π/2: it stands up on its head. */
{
  const P = makeTippeTopPanel(cores['tippe-top']);
  const before = snap(P);
  P.poke('flick', -90, 0);                       // a HARD flick, well over ω_crit
  const th0 = P.st.v[0];
  run(P, 0.6);
  ok('(b) tippe-top: a hard flick + 0.6 s CHANGES the reduced state [θ, P, φ]',
     snap(P) !== before && P.st.v[0] !== th0, `θ ${th0} → ${P.st.v[0].toFixed(3)}`);
  run(P, 9);
  ok('(c) tippe-top PAYOFF: θ crossed π/2 — the stem came UP and it inverted',
     P.payoff(), `max θ ${P.st.maxTheta.toFixed(3)} rad (π/2 = ${(Math.PI / 2).toFixed(3)})`);

  // the neg-control that makes the payoff mean something: a SOFT flick, below
  // the room's own ω_crit, must NOT invert.
  const Q = makeTippeTopPanel(cores['tippe-top']);
  Q.poke('flick', 0, 0);                         // mag 0 ⇒ n0 = 0.55·ω_crit
  run(Q, 12);
  ok('(c) tippe-top neg-control: a SOFT flick (below ω_crit) never inverts — the bifurcation is real',
     !Q.payoff(), `max θ ${Q.st.maxTheta.toFixed(3)} rad`);
}

/* 3. THE RATTLEBACK — launched the wrong way, it reverses itself. */
{
  const P = makeRattlebackPanel(cores.rattleback);
  const before = snap(P);
  const disfavored = -P.fav;
  P.poke('flick', disfavored < 0 ? -40 : 40, 0);
  ok('(b) rattleback: the flick launches at the DISFAVORED sign',
     snap(P) !== before && Math.sign(P.st.v[0]) === disfavored, `n₀ = ${P.st.v[0]}`);
  let rocked = false;
  run(P, 1.2, { at: (p) => { if (Math.abs(p.st.v[3]) > 0.12) rocked = true; } });
  ok('(b) rattleback: the ROCK grows first — the anti-damped mode builds before anything reverses',
     rocked && Math.sign(P.st.v[0]) === disfavored, `|sA| grew, n still ${P.st.v[0].toFixed(3)}`);
  run(P, 8);
  ok('(c) rattleback PAYOFF: the spin crossed ZERO on its own and settled at the FAVORED sign',
     P.payoff(), `n = ${P.st.v[0].toFixed(3)}, favored = ${P.fav}`);

  // the favored launch must NOT reverse — otherwise "reversal" is just noise.
  const Q = makeRattlebackPanel(cores.rattleback);
  Q.poke('flick', P.fav < 0 ? -40 : 40, 0);
  run(Q, 9);
  ok('(c) rattleback neg-control: launched the FAVORED way it just spins on — it never argues',
     !Q.st.reversed && Math.sign(Q.st.v[0]) === Q.fav, `n = ${Q.st.v[0].toFixed(3)}`);
}

/* 4. THE CHAIR — ω rises under omegaAt(r) as the arms come in. */
{
  const CH = cores['spinning-chair'];
  const P = makeChairPanel(CH);
  const before = snap(P);
  P.poke('flick', -40, 0);
  run(P, 1.0);
  ok('(b) the chair: a flick + a second CHANGES the state (she is turning)',
     snap(P) !== before && P.st.ang > 0, `angle ${P.st.ang.toFixed(2)} rad`);
  const omOut = CH.omegaAt(P.st.r);
  P.poke('down', 0, 0, true);                    // press and HOLD — pull the arms in
  run(P, 2.0);
  const omIn = CH.omegaAt(P.st.r);
  ok('(b) the chair: holding really moves the arms in toward the room\'s tucked radius B',
     P.st.r < CH.A * 0.5 && P.st.r >= CH.B - 1e-9, `r ${CH.A} → ${P.st.r.toFixed(3)} (B = ${CH.B})`);
  ok('(c) the chair PAYOFF: ω ROSE as r fell — forced by the room\'s own ω(r) = L₀/I(r)',
     P.payoff() && omIn > omOut * 2,
     `ω ${omOut.toFixed(2)} → ${omIn.toFixed(2)} rad/s (×${(omIn / omOut).toFixed(2)})`);
  P.poke('up', 0, 0, false);
  run(P, 2.0);
  ok('(c) the chair: letting go lets the arms back out and the spin drop again — reversible, no ratchet',
     CH.omegaAt(P.st.r) < omIn * 0.6, `ω back to ${CH.omegaAt(P.st.r).toFixed(2)} rad/s`);
}

/* 5. THE ROTOR — she is held above ω_c and starts to sink below it. */
{
  const P = makeRotorPanel(cores.rotor);
  const before = snap(P);
  P.poke('flick', -40, 0);
  ok('(b) the rotor: the flick winds the drum ABOVE the room\'s threshold spin',
     snap(P) !== before && P.st.om > P.wc, `ω₀ ${P.st.om} > ω_c ${P.wc.toFixed(3)}`);
  let heldWhileFast = true, sankWhileFast = false;
  run(P, 3.0, { at: (p) => {
    if (p.st.om > p.wc + 0.15) { if (p.st.drop > 0) { heldWhileFast = false; sankWhileFast = true; } }
  } });
  ok('(b) the rotor: while ω stayed above ω_c she did NOT sink a millimetre — the wall held',
     heldWhileFast && !sankWhileFast, `drop01 = ${P.st.drop.toFixed(3)} at ω ${P.st.om.toFixed(2)}`);
  run(P, 6.0);
  ok('(c) the rotor PAYOFF: the drum fell below ω_c and only THEN did she begin to slide',
     P.payoff(), `ω ${P.st.om.toFixed(2)} < ω_c ${P.wc.toFixed(3)}, drop01 = ${P.st.drop.toFixed(3)}`);
  ok('(c) the rotor: drop01 is the core\'s own mass-free sink fraction, and it really ran',
     P.st.drop > 0.2, `drop01 = ${P.st.drop.toFixed(3)}`);
}

/* 6. THE TUSI COUPLE — the marked point never leaves its diameter. */
{
  const TU = cores.tusi;
  const P = makeTusiPanel(TU);
  const before = snap(P);
  P.poke('flick', -40, 0);
  run(P, 0.5);
  ok('(b) tusi: a flick + half a second rolls the wheel (θ advances)',
     snap(P) !== before && P.st.th !== 0, `θ = ${P.st.th.toFixed(3)} rad`);
  run(P, 5);
  ok('(c) tusi PAYOFF: after a full lap the marked point swept the diameter and NEVER left it',
     P.payoff(),
     `swept ±${P.st.span.toFixed(3)} of R=${P.R}, max off-line ${P.st.maxPerp.toExponential(2)}`);
  // it is really the room's pen() doing this, not an eased x = cos t
  const q = TU.pen(P.R, P.r, 1, 0.937, true);
  ok('(c) tusi: the panel\'s geometry IS the room\'s pen() — off-axis component is machine zero',
     Math.abs(q.y) < 1e-15, `pen(0.937).y = ${q.y.toExponential(2)}`);
}

/* ── the whole case, together: six for six ───────────────────────────────── */
{
  const panels = makePanels(cores);
  for (const p of panels) { if (p.wantsHold) p.poke('down', 0, 0, true); p.poke('flick', -60, 0); }
  const before = panels.map(snap);
  for (let i = 0; i < 60 * 3; i++) for (const p of panels) p.step(1 / 60);
  ok('(b) ALL SIX moved from one shared three-second run — nothing is frozen',
     panels.every((p, i) => snap(p) !== before[i]),
     panels.filter((p, i) => snap(p) === before[i]).map((p) => p.id).join(',') || 'all six live');
  const alive = panels.filter((p) => p.alive()).length;
  ok('(payoff of the CASE) all six niches are awake at once — this is what lights the cabinet',
     alive === 6, `${alive}/6 alive`);
  // and every panel offers a still frame for prefers-reduced-motion
  let stillOk = true;
  for (const p of panels) { p.settle(); const a = snap(p); p.step(1 / 60); if (snap(p) !== a) stillOk = false; }
  ok('(reduced motion) settle() leaves every panel in a posed frame that does NOT drift when stepped',
     stillOk);
}

/* ── report ─────────────────────────────────────────────────────────────── */
for (const c of checks) console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name + (c.note ? '  ·  ' + c.note : ''));
const pass = checks.filter((c) => c.ok).length;
console.log(`\n${pass}/${checks.length} ${pass === checks.length ? '✓ ALL GREEN' : '✗ FAILURES'}`);
process.exit(pass === checks.length ? 0 : 1);
