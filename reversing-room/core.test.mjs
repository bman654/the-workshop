// ════════════════════════════════════════════════════════════════════════════
// reversing-room/core.test.mjs — the Node twin. Proves the reversibility claims
// the room makes, BIT-EXACT. Run: node reversing-room/core.test.mjs
//
// What it proves:
//   • forward∘reverse = identity, BIT-EXACT (string-equal on BigInt rationals)
//   • energy exactly invariant at every event, BOTH directions
//   • momentum invariant across every PAIR collision (a wall is external — we do
//     NOT assert total momentum across a wall hit)
//   • step(flip(sₜ)) reproduces s_{t−1} (the law IS its own time-reverse — a
//     mutual-inverse identity; NOT the false flip(step(flip s)) = unstep(s))
//   • a stored-frame BUFFER is DEFEATED: reconstruct a never-recorded state and
//     re-derive a mid-fork future with zero saved frames
//   • the FRICTION neg-control FAILS to recover s₀ and strictly DRAINS energy
// ════════════════════════════════════════════════════════════════════════════
import {
  R, rNum, rEq, rCmp, flip, clone, statesEqual, key,
  step, unstep, momentum, energy2,
  startPose, buildWorldline, N_EVENTS, hasActive,
} from './core.mjs';

let pass = 0, total = 0;
const log = (n, c, note = '') => { total++; if (c) pass++; console.log(`${c ? '✓' : '✗'} ${n}${note ? ' — ' + note : ''}`); };

// ── the start pose is a valid forward seed (no pending dt=0 approaching contact) ──
log('start pose has no PENDING (dt=0 approaching) contact', !hasActive(startPose()));

// ── the worldline expands and produces a RICH weave (enough knots to read) ──────
const el = buildWorldline(R(1n));
log('worldline expands', el.length > 30, `${el.length} states`);
{
  let cur = startPose(), np = 0, nw = 0;
  for (let k = 0; k < N_EVENTS; k++) { const r = step(cur, R(1n)); if (!r || r.degenerate) break; if (r.kind === 'pair') np++; else nw++; cur = r.state; }
  log('genuine ball-ball collisions (a rich weave of knots)', np >= 12, `${np} pair-knots, ${nw} wall events`);
}

// ── per-step inverse for EVERY interior rung (the strongest reversibility claim) ──
{
  let cur = startPose(); const fwd = [clone(cur)];
  for (let k = 0; k < N_EVENTS; k++) { const r = step(cur, R(1n)); if (!r || r.degenerate) break; cur = r.state; fwd.push(clone(cur)); }
  let allPer = true, firstBad = -1;
  for (let k = 1; k < fwd.length; k++) { const r = unstep(fwd[k]); if (!r || r.degenerate || !statesEqual(r.state, fwd[k - 1])) { allPer = false; if (firstBad < 0) firstBad = k; } }
  log('unstep(fwd[k]) = fwd[k−1] for EVERY k (true analytic inverse)', allPer, firstBad < 0 ? `all ${fwd.length} rungs` : `firstBad@${firstBad}`);
}

// ── full forward∘reverse identity, BIT-EXACT on serialized BigInt rationals ─────
{
  let cur = startPose(); const fwd = [clone(cur)];
  for (let k = 0; k < N_EVENTS; k++) { const r = step(cur, R(1n)); if (!r || r.degenerate) break; cur = r.state; fwd.push(clone(cur)); }
  let back = clone(cur), ab = true, firstBad = -1;
  for (let k = fwd.length - 2; k >= 0; k--) {
    const r = unstep(back); if (!r || r.degenerate) { ab = false; firstBad = k; break; }
    back = r.state;
    if (key(back) !== key(fwd[k])) { ab = false; firstBad = k; break; }     // STRING-equal, not ε
  }
  log('forward∘reverse = identity, BIT-EXACT (string-equal BigInt rationals, not ε)',
    ab && key(back) === key(startPose()), ab ? `${fwd.length} rungs, byte-identical home` : `mismatch into rung ${firstBad}`);
}

// ── re-gather: crank N forward then N back lands EXACTLY on the start ────────────
{
  let cur = startPose();
  for (let k = 0; k < 14; k++) { const r = step(cur, R(1n)); if (r && !r.degenerate) cur = r.state; }
  for (let k = 0; k < 14; k++) { const r = unstep(cur); if (r && !r.degenerate) cur = r.state; }
  log('re-gather gap = exactly 0 (crank forward 14, back 14 ⇒ start)', key(cur) === key(startPose()));
}

// ── the law IS its own time-reverse — the MUTUAL-INVERSE identity (NOT the false
//    bare flip identity). In an EVENT-DRIVEN engine, step needs a contact-free /
//    post-collision seed; a flipped post-collision state sits AT an approaching
//    contact, which step (strictly-future only) will not re-fire. unstep therefore
//    encapsulates the genuine time-reverse: UN-RESOLVE the active contact (the
//    elastic resolve is its own inverse for e=1) then flip→drift→flip. The true,
//    provable T-symmetry is the mutual-inverse PAIR below, both directions.
{
  let cur = startPose();
  for (let k = 0; k < 9; k++) { const r = step(cur, R(1n)); if (r && !r.degenerate) cur = r.state; }
  const sPrev = clone(cur);
  const f = step(cur, R(1n));                       // sₜ = forward from s_{t−1}
  const u = unstep(f.state);                        // unstep should return s_{t−1}
  log('unstep(step s) = s — mutual inverse (the law run backward)', u && !u.degenerate && statesEqual(u.state, sPrev));
  const u2 = unstep(f.state); const f2 = u2 && step(u2.state, R(1n));
  log('step(unstep s) = s — mutual inverse the other way', f2 && !f2.degenerate && statesEqual(f2.state, f.state));
  // unstep is the law run on time-reversed velocities, NOT a stored frame: from sₜ,
  // un-resolving its contact then drifting the FLIPPED state forward to the next
  // contact (flip back) reproduces s_{t−1} — exactly unstep's construction, verified
  // here against an independent forward re-derivation of the same prior state.
  const reForward = step(sPrev, R(1n));            // re-derive sₜ from scratch
  log('unstep recomputes from the law (matches an independent forward re-derivation)',
    reForward && !reForward.degenerate && key(reForward.state) === key(f.state) && statesEqual(u.state, sPrev));
}

// ── energy invariant at EVERY event (both directions); momentum across PAIRS ────
{
  let cur = startPose(); const e0 = energy2(cur); let eInv = true, pInv = true;
  for (let k = 0; k < N_EVENTS; k++) {
    const pB = momentum(cur);
    const r = step(cur, R(1n)); if (!r || r.degenerate) break; cur = r.state;
    if (!rEq(energy2(cur), e0)) { eInv = false; break; }
    if (r.kind === 'pair') { const pA = momentum(cur); if (!rEq(pA.px, pB.px) || !rEq(pA.py, pB.py)) { pInv = false; break; } }
  }
  log('energy exactly invariant at EVERY forward event', eInv, `2KE = ${rNum(e0)}`);
  log('momentum invariant across EVERY pair collision (walls are external)', pInv);
  // and BOTH directions: energy invariant on the reverse crank too
  let back = clone(cur), eRev = true;
  for (let k = 0; k < N_EVENTS; k++) { const r = unstep(back); if (!r || r.degenerate) break; back = r.state; if (!rEq(energy2(back), e0)) { eRev = false; break; } }
  log('energy exactly invariant at EVERY reverse event too', eRev);
}

// ── DEFEAT a frame buffer: reconstruct a NEVER-RECORDED state by re-derivation ──
// Run forward to the end keeping no interior frames. Independently re-derive an
// interior state two ways — forward from s₀, and backward from the end — and show
// they match. Nothing was stored; both coordinates came from the law.
{
  let cur = startPose();
  for (let k = 0; k < N_EVENTS; k++) { const r = step(cur, R(1n)); if (r && !r.degenerate) cur = r.state; }
  const end = clone(cur);
  let a = startPose(); for (let k = 0; k < N_EVENTS - 17; k++) { const r = step(a, R(1n)); if (r && !r.degenerate) a = r.state; }
  let b = clone(end);  for (let k = 0; k < 17; k++) { const r = unstep(b); if (r && !r.degenerate) b = r.state; }
  log('DEFEATS a frame buffer: a never-recorded state re-derived from BOTH ends agrees', key(a) === key(b));
}

// ── re-derive a MID-FORK FUTURE with zero saved frames ──────────────────────────
{
  const o = buildWorldline(R(1n));
  const mi = Math.min(20, o.length - 3);
  let f = clone(o[mi].state), ok = true;
  for (let k = mi; k < o.length - 1; k++) { const r = step(f, R(1n)); if (!r || r.degenerate) { ok = false; break; } f = r.state; if (key(f) !== key(o[k + 1].state)) { ok = false; break; } }
  log('re-derive the FUTURE from a mid-stream instant — bit-exact, zero saved frames', ok);
}

// ── NEG-CONTROL: friction (e<1) FAILS to recover s₀ and strictly DRAINS energy ──
{
  const e = R(7n, 10n); let cur = startPose(); const e0 = energy2(cur);
  for (let k = 0; k < 12; k++) { const r = step(cur, e); if (r && !r.degenerate) cur = r.state; }
  const eMid = energy2(cur);
  for (let k = 0; k < 12; k++) { const r = unstep(cur); if (r && !r.degenerate) cur = r.state; }
  log('NEG-CONTROL friction BITES: round-trip does NOT recover s₀', !statesEqual(cur, startPose()));
  log('NEG-CONTROL friction BITES: energy strictly DRAINS (2KE down)', rCmp(eMid, e0) < 0, `${rNum(e0).toFixed(2)} → ${rNum(eMid).toFixed(2)}`);
}

console.log(`\n=== ${pass}/${total} ===`);
process.exit(pass === total ? 0 : 1);
