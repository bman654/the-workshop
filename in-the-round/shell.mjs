// ============================================================================
//  in-the-round/shell.mjs — THE ROOM SHELL. One posture-agnostic case that both
//  halls of In the Round stand in: HALL ONE (the armillary — free orbit in a
//  void) and HALL TWO (the trefoil — a turntable, a plate, a bearing).
//
//  WHY A SHELL, AND WHY THE CLAMP LIVES IN IT
//  Each hall clamps the camera differently: the armillary swings the full
//  ±PITCH_LIMIT with no ground; the trefoil is an object ON A STAND, so the eye
//  must stay ABOVE the bearing plate (the plate is painted before the solid, and
//  that is only truthful while you are looking down onto it).
//
//  A room-level camera constraint MUST sit where BOTH the DOM handler AND the
//  liveness twin enter — never in the pointermove handler. Put it in the handler
//  and a scripted applyDrag flies the camera under the floor: the twin then
//  blesses a pose no visitor can reach, and the shape it proves is not the shape
//  you can see. So `shell.orbit()` is THE one orbit entry, clamp included, and
//  the twins drive exactly it.
//
//  DOM-free at the core (orbit / flywheel / gates are pure and Node-importable);
//  the DOM helpers (bindOrbit, makeViewport) are used only by the pages. Both
//  halls forge-inline this file; both twins import it.
// ============================================================================

// ===== ROOM SHELL =====
"use strict";

import { applyDrag, PITCH_LIMIT } from '../tools/scene3d/core.mjs';

const clampN = (v, a, b) => (v < a ? a : (v > b ? b : v));

/* THE STILLNESS GATE — one predicate, both preferences.
   Any UNBIDDEN motion (an idle drift, an ambient hum) must pass BOTH
   prefers-reduced-motion AND the shared estate mute `ws:pref:muted`. A visitor
   who has asked the estate for quiet gets quiet in every room, and a room that
   drifts on its own is a room that must ask. Pure, so a twin can prove it. */
function stillness(reduced, muted) { return (reduced || muted) ? 0 : 1; }

/* makeShell({ limits:{pitchMin,pitchMax,dollyMin,dollyMax}, speed })
   The posture. Defaults are the armillary's (free orbit, no ground). */
function makeShell(cfg) {
  const c = cfg || {};
  const L = Object.assign({
    pitchMin: -PITCH_LIMIT, pitchMax: PITCH_LIMIT, dollyMin: 1.0, dollyMax: 9.0,
  }, c.limits);
  const speed = c.speed;
  const shell = {
    limits: L,
    clampPitch(p) { return clampN(p, L.pitchMin, L.pitchMax); },
    clampDolly(d) { return clampN(d, L.dollyMin, L.dollyMax); },
    /* THE ONE ORBIT ENTRY. Handler and twin both come through here. */
    orbit(cam, dx, dy) {
      applyDrag(cam, dx, dy, speed ? { speed } : undefined);
      cam.pitch = shell.clampPitch(cam.pitch);
      return cam;
    },
    /* dolly by a delta, clamped to the hall's own reach */
    dolly(cam, d) { cam.dolly = shell.clampDolly(cam.dolly + d); return cam; },
    /* the free-flight pitch step (a coasting orbit still obeys the clamp) */
    settle(cam) { cam.pitch = shell.clampPitch(cam.pitch); cam.dolly = shell.clampDolly(cam.dolly); return cam; },
  };
  return shell;
}

/* makeFlywheel({tau,max,idle,blend}) — a HEAVY bearing, not a spinner.
   `track` folds each drag sample into the running angular velocity; `release`
   caps what a hand can actually put into a casting (an uncapped fling reached
   ~2.5 turns/sec in testing — a blur, not an object); `step` coasts on
   exp(-dt/tau) and, once it is nearly still, hands back the faint idle drift —
   but only if the STILLNESS GATE is open. */
function makeFlywheel(o) {
  const O = Object.assign({ tau: 3.4, max: 3.1, idle: 0.055, blend: 0.72 }, o || {});
  let vel = 0;
  return {
    get vel() { return vel; },
    set(v) { vel = v; },
    /* the cap is applied HERE, not only on release. A pointerup can go missing —
       the pointer leaves the window, the OS eats the gesture, a capture is lost —
       and a flywheel that only clamps on release would then be carrying whatever
       the last sample said (measured: 21 rad/s, seven times the cap) and spin the
       casting into a blur the moment it did resume. Bound the invariant where the
       value is written, so no code path can hold an illegal one. */
    track(dAngle, dtMs) {
      vel = clampN(O.blend * vel + (1 - O.blend) * (dAngle / Math.max(8, dtMs) * 1000), -O.max, O.max);
    },
    release(reduced) { vel = reduced ? 0 : clampN(vel, -O.max, O.max); return vel; },
    /* returns the ANGLE this frame turns through */
    step(dt, reduced, muted) {
      vel *= Math.exp(-dt / O.tau);
      const idle = (Math.abs(vel) < 0.02) ? O.idle * stillness(reduced, muted) : 0;
      return (vel + idle) * dt;
    },
    /* the idle rate alone — what a twin asks to prove the gate holds */
    idleRate(reduced, muted) { return O.idle * stillness(reduced, muted); },
  };
}

/* ─────────────────────────── the DOM half of the shell ─────────────────────── */

/* read the two preferences the shell gates on (WS if the page has it, else the
   raw key — so the shell works before/without the estate's ws.js). */
function readReduced() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function readMuted() {
  try {
    if (typeof WS !== 'undefined' && WS && WS.muted) return !!WS.muted();
    return localStorage.getItem('ws:pref:muted') === '1';
  } catch (e) { return false; }
}

/* makeViewport(cv, ctx, {mode, vp}) — the canvas fit / DPR loop.
   mode 'transform' : the canvas backing store is DPR-scaled and ctx is
                      pre-transformed, so the room draws in CSS pixels (hall one).
   mode 'raw'       : the room draws in DEVICE pixels (hall two).
   `vp(W,H)` returns {cx,cy,scale} in whichever space the mode implies. */
function makeViewport(cv, ctx, o) {
  const O = Object.assign({ mode: 'transform', vp: () => ({ cx: 0, cy: 0, scale: 1 }) }, o || {});
  const vp = { cx: 0, cy: 0, scale: 1 };
  let W = 0, H = 0, DPR = 1, lw = -1, lh = -1;
  function css() {
    const r = cv.getBoundingClientRect();
    return O.mode === 'transform'
      ? { w: cv.clientWidth, h: cv.clientHeight }
      : { w: r.width, h: r.height };
  }
  function fit() {
    const d = css(); W = d.w; H = d.h;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    if (O.mode === 'transform') { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); Object.assign(vp, O.vp(W, H)); }
    else Object.assign(vp, O.vp(cv.width, cv.height));
    lw = W; lh = H;
  }
  function fitIfNeeded() {
    const d = css();
    if (Math.abs(d.w - lw) > 0.5 || Math.abs(d.h - lh) > 0.5) fit();
  }
  return { vp, fit, fitIfNeeded, get W() { return W; }, get H() { return H; }, get dpr() { return DPR; } };
}

/* bindOrbit(el, opt) — the drag handler. Orbit is the shell's; anything else a
   hall wants (hall one's shift-roll and grab-a-ring spin) it declares in
   `onDown` and drives in `onMove`, so the shell stays one case, not a union of
   two rooms. Every orbit sample goes through shell.orbit — clamp included. */
function bindOrbit(el, opt) {
  const o = opt || {};
  const moveTarget = o.moveTarget || el;
  let drag = null;
  const setCursor = (m) => { if (o.cursor) o.cursor(m); };

  el.addEventListener('pointerdown', (e) => {
    try { if (el.setPointerCapture) el.setPointerCapture(e.pointerId); } catch (_) {}
    const p = { x: e.clientX, y: e.clientY };
    const custom = o.onDown ? o.onDown(e, p) : null;
    drag = Object.assign({ mode: 'orbit', x: p.x, y: p.y, px: p.x, py: p.y, t: performance.now() }, custom || {});
    setCursor(drag.mode);
  });

  moveTarget.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = { x: e.clientX, y: e.clientY };
    const dx = p.x - drag.x, dy = p.y - drag.y;
    const now = performance.now(), dt = Math.max(8, now - drag.t);
    if (drag.mode === 'orbit') {
      const before = o.cam.yaw;
      o.shell.orbit(o.cam, dx, dy);
      if (o.onOrbit) o.onOrbit(drag, o.cam.yaw - before, dx, dy, p, dt, now);
    } else if (o.onMove) {
      o.onMove(drag, dx, dy, p, dt, now);
    }
    drag.x = p.x; drag.y = p.y;
  });

  function end(e) {
    if (!drag) return;
    const d = drag; drag = null;
    try { if (el.releasePointerCapture && e && e.pointerId != null) el.releasePointerCapture(e.pointerId); } catch (_) {}
    setCursor(null);
    if (o.onEnd) o.onEnd(d);
  }
  /* END ON EVERY WAY A GESTURE CAN DIE. Binding pointerup to the element alone
     loses the release whenever the pointer is let go somewhere the element never
     hears about — and the room then sits in drag state forever: the piece stops
     coasting, the cursor stays closed, and nothing the visitor does recovers it.
     Observed for real in headless. Window-level, plus lostpointercapture. */
  moveTarget.addEventListener('pointerup', end);
  moveTarget.addEventListener('pointercancel', end);
  if (moveTarget !== window) {
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }
  el.addEventListener('lostpointercapture', end);
  window.addEventListener('blur', end);

  if (o.wheel !== false) {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      o.shell.dolly(o.cam, e.deltaY * (o.wheelSpeed || 0.005));
    }, { passive: false });
  }
  return { get drag() { return drag; }, end };
}

// ===== END ROOM SHELL =====

export { stillness, makeShell, makeFlywheel, makeViewport, bindOrbit, readReduced, readMuted };
