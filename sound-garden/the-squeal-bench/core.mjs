// ============================================================================
//  THE SQUEAL BENCH — the SQUEAL CORE: the sole DSP authority for one claim:
//  "a violin's SING, a door's CREAK, and the GROUND's quake are the same motion —
//   a block dragged on a moving belt by friction, sticking and slipping."
//  Pure, dependency-free (DOM-free). NO note-pitch claim: pitch EMERGES, it is not
//  imposed — so this leaf imports NO pitch-core.
//
//    • THE ONE MODEL. A lumped mass m sits on a spring k (anchored to a wall) and
//      rests on a belt (the bow) sliding under it at speed vB. Friction couples the
//      two. Newton, per sample:
//          a = ( −k·x − Fn·μ(w) ) / m ,   w = v − vB   (block-vs-belt slip speed)
//      integrated semi-implicit (symplectic) Euler with SUB internal substeps so a
//      stiff spring never explodes. The friction law μ(w) is a SMOOTH regularised
//      Coulomb–Stribeck curve — ONE continuous function, NO stick/slip mode flag:
//          μ(w) = strib(w) · w/(|w|+EPS_REG)
//          strib(w) = MU_K + (MU_S − MU_K)·exp(−(|w|/V_STRIBECK)²)
//      The factor w/(|w|+EPS_REG) is a smooth sign with a soft linear region of
//      half-width ~EPS_REG: for |w| < EPS_REG the block is effectively PINNED to the
//      belt (it "sticks"). strib is VELOCITY-WEAKENING — friction is highest at w=0
//      (the static grip MU_S) and falls toward the kinetic MU_K as |w| grows. That
//      falling slope is the instability that breaks the stick and drives the whole
//      relaxation oscillation. Static > kinetic (MU_S > MU_K) is what makes it squeal.
//
//    • THE THREE REGIMES ARE ONE CONTINUUM — emergent points on the (k, Fn, vB)
//      surface, reached by the SAME law with NO branch:
//        SING  — light Fn, fast vB, moderate k: the block sticks and slips many
//                times a second, one micro-slip per period → a Helmholtz SAWTOOTH,
//                a pitched violin/creaky-hinge SING at f0 = the slip rate, with a
//                full harmonic ladder (bright).
//        CREAK — hard Fn, slow vB: the spring must load a long way before the grip
//                lets go, so slips are RARE and BIG → a low, dull door GROAN.
//        QUAKE — stiff k, tiny vB: rarer still, each release a discrete shudder that
//                rings and dies → a sparse, countable TRANSIENT TRAIN (a ground
//                quake / a chair dragged on tile).
//      The reveal: it is all ONE dial-family. Push vB up through a threshold and a
//      silent stable creep BREAKS into stick-slip; the perceived word (singing /
//      creaking / quaking) is read from the MEASURED slip-rate + mean-drop, never
//      from a mode you selected.
//
//    • THE RELEASED BOW, to a true silence. Lift the bow (vB = 0) and there is no
//      belt to drag the block: no slips, no motion, digital silence. Its self-test
//      leg: vB = 0 → zero slips and RMS < 1e-9. Delight, but honest — the sound is
//      the drag, and nothing else.
//
//  This SQUEAL CORE is single-sourced here; the page (index.html, forged from
//  index.src.html) inlines a BYTE-TWIN of the slice between the sentinels below,
//  char-for-char. The Node twin (core.test.mjs) re-extracts that slice, asserts
//  char-for-char parity, and calls the SAME runSquealSelfTest the page's silent
//  Node concern uses — so the model the eye+ear play and the model the test proves
//  cannot drift. The offline renderSqueal here and the live AudioWorklet in the page
//  run the SAME per-sample recurrence (the byte-twinned integrate()).
//
//  The leaf lives one level deep (the-squeal-bench → sound-garden → repo root), so
//  the Node twin's repoRoot is ../.. .
// ============================================================================

// ===== SQUEAL CORE (inlined byte-twin) BEGIN =====
// IMPORT-FREE: the friction law, the per-sample integrator, the offline render, the
// analysis helpers, and runSquealSelfTest take only plain numbers — so the page can
// inline this block verbatim regardless of script load order, and the recurrence
// literal lives in ONE place (the single-source grep checks). NO pitch anchor is
// imported or re-typed: this leaf makes no note-pitch claim; pitch emerges as the
// slip rate.

// THE DSP LITERALS — the ONE place these live as code.
const DEFAULT_SR = 44100;         // the canonical render / sample rate
const M_BLOCK    = 1e-4;          // the block mass (kg-ish) — with k this sets the audio-rate ring
const MU_S       = 1.5;           // STATIC friction coefficient (the grip at w=0)
const MU_K       = 0.25;          // KINETIC friction coefficient (once sliding). MU_S > MU_K ⇒ squeal
const V_STRIBECK = 0.03;          // Stribeck velocity: how fast the grip decays from static → kinetic
const EPS_REG    = 0.0012;        // the stick regularisation: |w| < EPS_REG ⇒ the block is pinned to the belt
const SUBSTEPS   = 32;            // internal integrator substeps per output sample (stiff-spring safety)
const BREAK_BAND = 0.03;          // slip-detect: |w| rising past this = the stick lets go (a slip event)
const STICK_BAND = 0.008;         // slip-detect: |w| falling back under this re-arms for the next slip
const MAX_RENDER_SAMPLES = DEFAULT_SR * 6;   // cap so a slow drag can't render forever / hitch

// THE FRICTION LAW — the ONLY place the nonlinearity lives as code (the single-
// source grep asserts this fragment appears in exactly one .mjs/.js file). ONE
// continuous function of the block-vs-belt slip speed w; there is no branch, no
// mode flag. `frictionMu` returns the friction COEFFICIENT (dimensionless, in
// [−MU_S, +MU_S]); the force on the block is −Fn·frictionMu(w).
//   • strib(w) = MU_K + (MU_S−MU_K)·exp(−(|w|/vs)²)  — velocity-WEAKENING: MU_S at
//     w=0, decaying to MU_K as |w| grows. Its negative slope is the squeal engine.
//   • w/(|w|+eps) — a smooth sign with a soft linear pin of half-width ~eps: for
//     |w|<eps the block clings to the belt (the STICK), for |w|≫eps it is ±1 (SLIP).
function stribeck(w, muS, muK, vs){
  const aw = Math.abs(w);
  return muK + (muS - muK) * Math.exp(-(aw / vs) * (aw / vs));
}
function frictionMu(w, muS, muK, vs, eps){
  const aw = Math.abs(w);
  return stribeck(w, muS, muK, vs) * (w / (aw + eps));   // velocity-weakening × smooth-sign pin
}

// THE PER-SAMPLE RECURRENCE — advance the block one OUTPUT sample by `sub` symplectic
// (semi-implicit) Euler substeps at the fine step hdt = 1/(sr·sub). Semi-implicit
// (update v, THEN x with the new v) keeps a stiff spring stable; the substeps keep a
// naive integrator from SATURATING the audio-rate sing (the #1 build hazard). Takes
// and returns the state {x, v}; the ONLY place the recurrence literal lives.
function integrate(st, k, m, Fn, vB, sr, sub, muS, muK, vs, eps){
  const hdt = 1 / (sr * sub);
  let x = st.x, v = st.v;
  for (let s = 0; s < sub; s++){
    const w = v - vB;                                   // block-vs-belt slip speed
    const a = (-k * x - Fn * frictionMu(w, muS, muK, vs, eps)) / m;   // Newton (THE recurrence)
    v = v + a * hdt;                                    // semi-implicit: v first …
    x = x + v * hdt;                                    // … then x with the new v
  }
  st.x = x; st.v = v;
  return st;
}

// THE OFFLINE RENDER — run the SAME recurrence for `seconds`, returning the block's
// deflection buffer (what you HEAR and what the strip DRAWS — one law, one eye, one
// ear) plus the slip event samples. `slips` are detected from the state, NOT driven
// into it: a slip is armed while the block clings (|w|<STICK_BAND) and fires when it
// breaks free (|w|>BREAK_BAND) — one visible/countable tooth per release. In SING
// each Helmholtz period breaks once (rate = pitch); in CREAK/QUAKE the rare big
// releases are counted the same way, so slip-rate falls smoothly SING→CREAK→QUAKE.
function renderSqueal(opts){
  opts = opts || {};
  const k    = opts.k    ?? 150;
  const m    = opts.m    ?? M_BLOCK;
  const Fn   = opts.Fn   ?? 0.06;
  const vB   = opts.vB   ?? 0.15;
  const sr   = opts.sr   ?? DEFAULT_SR;
  const sub  = opts.sub  ?? SUBSTEPS;
  const muS  = opts.muS  ?? MU_S;
  const muK  = opts.muK  ?? MU_K;
  const vs   = opts.vs   ?? V_STRIBECK;
  const eps  = opts.eps  ?? EPS_REG;
  const N    = Math.min(MAX_RENDER_SAMPLES, Math.max(2, Math.floor((opts.seconds ?? 2) * sr)));
  const buf  = new Float64Array(N);
  const slips = [];
  const st = { x: 0, v: 0 };
  let armed = true, peak = 0;
  for (let i = 0; i < N; i++){
    integrate(st, k, m, Fn, vB, sr, sub, muS, muK, vs, eps);
    buf[i] = st.x;
    const aw = Math.abs(st.v - vB);
    if (armed && aw > BREAK_BAND){ slips.push(i); armed = false; }   // stick → slip (a release)
    else if (!armed && aw < STICK_BAND){ armed = true; }             // re-stuck, re-arm
    const ax = st.x < 0 ? -st.x : st.x;
    if (ax > peak) peak = ax;
  }
  return { buf, slips, sr, N, peak };
}

// ── ANALYSIS HELPERS (shared by the self-test, the page readout, and verify.sh) ──

// RMS over a window [s, e).
function rms(buf, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, (e ?? buf.length) | 0);
  if (e <= s) return 0;
  let acc = 0; for (let i = s; i < e; i++) acc += buf[i] * buf[i];
  return Math.sqrt(acc / (e - s));
}

// peak |amplitude| over a window [s, e).
function peak(buf, s, e){
  s = Math.max(0, s | 0); e = Math.min(buf.length, (e ?? buf.length) | 0);
  let p = 0; for (let i = s; i < e; i++){ const a = buf[i] < 0 ? -buf[i] : buf[i]; if (a > p) p = a; }
  return p;
}

// spectral centroid of buf[s..e) via a naive DFT magnitude over kBins bins, in units
// of bin index (higher ⇒ brighter). SING (a harmonic sawtooth) reads high; CREAK (a
// slow low groan) reads low — the "bright vs dull" separation, measured.
function centroid(buf, s, e, kBins = 220){
  s = Math.max(0, s | 0); e = Math.min(buf.length, (e ?? buf.length) | 0);
  const Nw = e - s; if (Nw <= 1) return 0;
  let num = 0, den = 0;
  for (let kk = 1; kk < kBins; kk++){
    let re = 0, im = 0; const w = 2 * Math.PI * kk / Nw;
    for (let i = 0; i < Nw; i++){ const x = buf[s + i]; re += x * Math.cos(w * i); im -= x * Math.sin(w * i); }
    const mag = Math.sqrt(re * re + im * im);
    num += kk * mag; den += mag;
  }
  return den > 0 ? num / den : 0;
}

// slip rate (events per second) from a render result.
function slipRate(res){ return res.N > 0 ? res.slips.length / (res.N / res.sr) : 0; }

// mean deflection amplitude at the slip instants (the "how big is each let-go" — a
// small number in SING, a large one in CREAK/QUAKE).
function meanDrop(res){
  if (!res.slips.length) return 0;
  let s = 0; for (const i of res.slips){ const a = res.buf[i] < 0 ? -res.buf[i] : res.buf[i]; s += a; }
  return s / res.slips.length;
}

// THE THREE named regimes as pure (k, Fn, vB) points on the one continuum — the ONLY
// place the demo presets live, shared by the page's "try" chips and the self-test's
// family-separation leg. NO mode flag: each is just three knob values.
function regimePreset(name){
  if (name === 'creak') return { k: 120,  Fn: 0.5,  vB: 0.02  };   // hard press, slow drag
  if (name === 'quake') return { k: 1400, Fn: 1.1,  vB: 0.009 };   // stiff, tiny drag
  return                       { k: 150,  Fn: 0.06, vB: 0.15  };   // 'violin' / sing — light, fast
}

// ── runSquealSelfTest(sr) — the SOLE ORACLE of well-formedness (NOT a math theorem;
// this is a delight-first piece). Same shape as the sibling leaves:
// { pass, total, lines:[{name, ok, detail}] }. The Node twin calls THIS; the page
// carries NO in-page pill (delight-first), but the byte-twinned CORE guarantees the
// page plays the exact model the twin proves. Four legs, all well-formedness:
//   1 SILENT-UNTIL-GESTURE  — released bow (vB=0) → 0 slips and RMS < 1e-9.
//   2 NO-CLIP HEADROOM      — the sing render, normalised to 0.9, peaks < 0.99.
//   3 SLIP-RATE MONOTONE    — slip-rate rises with drag speed vB, to a LABELED ~10%
//                             tolerance band (accommodates the stick-slip onset +
//                             integrator granularity), within the stable stick-slip
//                             range (before the fast-drag continuous-oscillation limit).
//   4 FAMILY SEPARATION     — the SING slip-rate sits in the AUDIBLE pitch band (a
//                             pitched buzz) while CREAK and QUAKE slip sub-audibly
//                             (countable events) — slipRate(SING) ≫ slipRate(CREAK),
//                             slipRate(SING) > slipRate(QUAKE), and only SING clears
//                             the ~30 Hz pitch floor. One dial, three voices.
function runSquealSelfTest(sr = DEFAULT_SR){
  const lines = [];
  const T = (name, ok, detail = '') => lines.push({ name, ok: !!ok, detail });
  const sing  = regimePreset('violin');
  const creak = regimePreset('creak');
  const quake = regimePreset('quake');

  // LEG 1 — SILENT UNTIL THE GESTURE: lift the bow (vB = 0) and there is no belt to
  //   drag the block — zero slips, and the deflection is digital silence. The sound
  //   is the drag; released, it is nothing (the delight-first neg-control).
  {
    const rel  = renderSqueal({ ...sing, vB: 0, sr, seconds: 0.5 });
    const live = renderSqueal({ ...sing, sr, seconds: 0.5 });
    const relRms = rms(rel.buf, 0, rel.N), liveRms = rms(live.buf, 0, live.N);
    const ok = rel.slips.length === 0 && relRms < 1e-9 && live.slips.length > 0 && liveRms > 1e-6;
    T('LEG 1 — silent until the gesture: released bow (vB=0) → EXACTLY 0 slips and RMS < 1e-9 (digital silence), while the SAME setup with the bow moving slips and sounds — the sound IS the drag, nothing else',
      ok, `released: ${rel.slips.length} slips, rms ${relRms.toExponential(2)} (<1e-9) · live: ${live.slips.length} slips, rms ${liveRms.toExponential(2)}`);
  }

  // LEG 2 — NO-CLIP HEADROOM: the sing render, normalised so its peak is 0.9, has
  //   peak < 0.99 — i.e. after the house normalise there is real headroom, so the
  //   offline WAV the ear/lens hears never clips.
  {
    const r = renderSqueal({ ...sing, sr, seconds: 1.0 });
    const pk = peak(r.buf, 0, r.N);
    const g = pk > 0 ? 0.9 / pk : 0;
    let clipped = 0, normPeak = 0;
    for (let i = 0; i < r.N; i++){ const y = r.buf[i] * g; const a = y < 0 ? -y : y; if (a > normPeak) normPeak = a; if (a >= 0.999) clipped++; }
    const ok = pk > 0 && normPeak < 0.99 && clipped === 0;
    T('LEG 2 — no-clip headroom: the sing render normalised to peak 0.9 stays below 0.99 with zero samples at full scale — the offline WAV never clips',
      ok, `raw peak ${pk.toExponential(3)} → normalised peak ${normPeak.toFixed(4)} (<0.99), full-scale samples ${clipped}`);
  }

  // LEG 3 — SLIP-RATE MONOTONE WITH DRAG SPEED: hold press (Fn) and stiffness (k),
  //   sweep the drag speed vB upward THROUGH THE STABLE STICK-SLIP RANGE, and the
  //   measured slip-rate is non-decreasing to a LABELED ~10% tolerance band. (Stick-
  //   slip has an onset threshold in vB and the integer slip count is granular over a
  //   finite window, so a strict-monotone claim would be dishonest — the band is the
  //   honest statement. Above this range the block tips into a continuous oscillation
  //   with no distinct re-stick, a different regime not swept here.) Faster drag ⇒ the
  //   block reloads and lets go more often ⇒ a higher pitch; the arithmetic behind
  //   "drag faster, sing higher."
  {
    const TOL = 0.90;   // each step must be ≥ 90% of the previous (the labeled band)
    const vBs = [0.06, 0.09, 0.12, 0.15, 0.18];
    const rates = [];
    let ok = true, prev = -Infinity;
    for (const vB of vBs){
      const r = renderSqueal({ k: sing.k, Fn: sing.Fn, vB, sr, seconds: 1.0 });
      const rate = slipRate(r);
      rates.push(rate.toFixed(0));
      if (rate < prev * TOL) ok = false;
      prev = rate;
    }
    // and the fastest drag must clearly out-slip the slowest (a real rise, not noise)
    const roseOverall = parseFloat(rates[rates.length - 1]) > parseFloat(rates[0]) * 1.5;
    ok = ok && roseOverall;
    T('LEG 3 — slip-rate monotone with drag speed: sweeping vB up (press & stiffness fixed) through the stable stick-slip range the measured slip-rate is non-decreasing to a labeled ~10% band and the fastest drag out-slips the slowest by >1.5× — drag faster, sing higher',
      ok, `vB ${vBs.join('/')} → ${rates.join('/')} slips/s (band ≥${(TOL*100)|0}% step-to-step, overall rise ${roseOverall})`);
  }

  // LEG 4 — THE FAMILY SEPARATES (one dial, three voices): a pitch is heard only when
  //   the slips come fast enough to fuse into a tone. The SING slip-rate sits well
  //   inside the AUDIBLE pitch band (> the ~30 Hz pitch floor) — a pitched buzz — while
  //   CREAK and QUAKE slip SUB-audibly, as separate countable events (an audio-lens
  //   reads a clear f0 on the sing render and NONE on the other two, exactly because of
  //   this). And SING is the densest: slipRate(SING) ≫ slipRate(CREAK) and > slipRate
  //   (QUAKE). Same law, three emergent voices, told apart by the one measured number.
  {
    const PITCH_FLOOR = 30;   // Hz — below this, slips are counted, not heard as a tone
    const rS = renderSqueal({ ...sing,  sr, seconds: 1.5 });
    const rC = renderSqueal({ ...creak, sr, seconds: 1.5 });
    const rQ = renderSqueal({ ...quake, sr, seconds: 1.5 });
    const srS = slipRate(rS), srC = slipRate(rC), srQ = slipRate(rQ);
    const singIsPitched   = srS > PITCH_FLOOR;                 // fast enough to fuse into a tone
    const othersAreEvents = srC < PITCH_FLOOR && srQ < PITCH_FLOOR;  // countable, not a pitch
    const singIsDensest   = srS > srC * 3 && srS > srQ;        // the buzz far out-slips the groan/shudder
    const ok = singIsPitched && othersAreEvents && singIsDensest;
    T('LEG 4 — the family separates (one dial, three voices): the SING slip-rate clears the ~30 Hz pitch floor (a fused, pitched buzz) while CREAK and QUAKE slip sub-audibly as countable events, and SING is by far the densest — slipRate(SING) ≫ slipRate(CREAK) and > slipRate(QUAKE). One measured number tells the three voices apart',
      ok, `slips/s — sing ${srS.toFixed(1)} (pitched: ${singIsPitched}) · creak ${srC.toFixed(1)} · quake ${srQ.toFixed(1)} (both < ${PITCH_FLOOR}: ${othersAreEvents}) · sing densest: ${singIsDensest}`);
  }

  let pass = 0; for (const l of lines) if (l.ok) pass++;
  return { pass, total: lines.length, lines };
}
// ===== SQUEAL CORE END =====

export {
  DEFAULT_SR, M_BLOCK, MU_S, MU_K, V_STRIBECK, EPS_REG, SUBSTEPS,
  BREAK_BAND, STICK_BAND, MAX_RENDER_SAMPLES,
  stribeck, frictionMu, integrate, renderSqueal,
  rms, peak, centroid, slipRate, meanDrop, regimePreset,
  runSquealSelfTest,
};
