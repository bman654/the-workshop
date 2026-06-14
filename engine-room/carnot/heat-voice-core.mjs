// ============================================================================
//  The Engine Room · The Carnot Engine — HEAT-VOICE CORE
//  The bench's "♪ Listen" voice, made falsifiable. Pure, dependency-free except
//  for the ONE import below — and that import is the whole point.
//
//  THE CLAIM, made audible:
//    The pitch you HEAR is a pure function of the SAME entropy number the visual
//    ΔS meter reads. There is one ledger object, computed once by the bench's own
//    irreversibleLedger(); the ear and the eye both read it, so they cannot drift.
//    A reversible loop (no leak) sings A3 in unison — two voices, zero beat, "it
//    comes home". A finite-ΔT heat leak detunes one voice strictly UPWARD,
//    monotonically with ΔS_universe, and you cannot tune it back down: entropy
//    only rises, and so does the pitch. The arrow of time, heard.
//
//  WHY THE IMPORT IS LOAD-BEARING (the Demon pattern):
//    We import irreversibleLedger from the bench's OWN core.mjs. The single
//    source of truth is that ledger object. entropyToCents() sees ONLY a number
//    (dS, in J/K) — it has never heard of T_h, T_c, Q, or carnotStates. A
//    source-disjointness grep in the self-test asserts exactly that. So the
//    mapping cannot secretly re-derive the physics: it can only sonify the one
//    entropy figure the meter already shows.
// ============================================================================

import { irreversibleLedger, carnotStates, GAMMA_MONO } from './core.mjs';

// ============================================================================
//  The region between the two sentinels below is the DOM-free, import-free
//  mapping core. It is inlined BYTE-FOR-BYTE into index.html (a .test parity
//  grep asserts the two slices are identical). Because it must be valid inside
//  a plain <script> AND a module, the sentinel region uses NO `export` keyword;
//  the module re-exports the names just below the END sentinel.
// ============================================================================
// ===== HEAT-VOICE (byte-twin of heat-voice-core.mjs) BEGIN =====
// ── CALIBRATION (empirically anchored to the REAL ledger) ───────────────────
//  carnotStates(500,300,3) at ΔT=30 has a real ΔS_universe ≈ 1.532 J/K. With
//  CENTS_PER_JK = 90 that maps to ≈ 137.9 cents — a clean semitone-ish bend,
//  audible but not a shriek. The 1-octave clamp keeps the drift voice ≤ 440 Hz.
const HOME_HZ = 220;        // A3 — matches Galton's AUDIO_ROOT_HZ Sound-Garden anchor
const CENTS_PER_JK = 90;    // cents of upward drift per J/K of ΔS_universe
const MAX_CENTS = 1200;     // 1-octave clamp (anti-alias / register sanity)
const TOL_EXACT = 1e-12;

// ── THE MAPPING (pure, inline — sees only numbers) ──────────────────────────
//  entropy can only RAISE the pitch: floored at home (0 cents) so a reversible
//  loop sits in unison and no input can tune below home.
function entropyToCents(dS, centsPerJK = CENTS_PER_JK){
  if(!(dS >= 0)) return 0;                  // floor at home: entropy can't un-tune
  return Math.min(MAX_CENTS, dS * centsPerJK);
}
function centsToHz(cents, baseHz = HOME_HZ){ return baseHz * Math.pow(2, cents / 1200); }
// ===== HEAT-VOICE (byte-twin of heat-voice-core.mjs) END =====

export { HOME_HZ, CENTS_PER_JK, MAX_CENTS, TOL_EXACT, entropyToCents, centsToHz };

// ── THE SINGLE-SOURCE-OF-TRUTH SEAM ─────────────────────────────────────────
//  voiceState returns the ONE ledger object both consumers (page + harness)
//  read. leak is the ΔT of the finite-temperature heat leak (an irreversibility);
//  leak = 0 is the reversible Carnot loop (ΔS_universe == 0 exactly).
export function voiceState(cyc, leak = 0){
  const led = leak > 0
    ? irreversibleLedger(cyc, leak)
    : { dS_universe: 0, W_lost: 0, Th_res: cyc.T_h, Tc_res: cyc.T_c };
  const cents = entropyToCents(led.dS_universe);
  const driftHz = centsToHz(cents);
  return {
    led,
    dS_universe: led.dS_universe,
    W_lost: led.W_lost,
    cents,
    homeHz: HOME_HZ,
    driftHz,
    beatHz: Math.abs(driftHz - HOME_HZ),
  };
}

// ── DOM-FREE DETERMINISTIC SAMPLE RENDERER ──────────────────────────────────
//  The page AND the headless render tool share this. Two summed sines (home +
//  drift) with a soft 20 ms attack/release envelope (no clicks). peak ≈ 0.4 so
//  the rendered WAV clears the no-clip bar (peakDb ≤ -9); a reversible loop is
//  unison (≈ peak), a leak detunes one voice and the pair beats — still < peak·1.
//  homeMix / driftMix weight the two voices (they sum to ≤ 1). The default
//  0.5/0.5 is what the PAGE plays: home + drift, beating when detuned. The
//  headless render tool can set driftMix=1, homeMix=0 to isolate the BENT voice
//  so a monophonic pitch detector reads the drift frequency unambiguously (two
//  strong tones an interval apart otherwise confuse autocorrelation into a low
//  pseudo-period). The physics is identical either way — same fDrift, same dS.
export function carnotVoiceSamples({ dS_universe, seconds = 2.5, sr = 44100, peak = 0.34, centsPerJK = CENTS_PER_JK, homeMix = 0.5, driftMix = 0.5 }){
  const cents = entropyToCents(dS_universe, centsPerJK);
  const fHome = HOME_HZ, fDrift = centsToHz(cents);
  const N = Math.round(seconds * sr), out = new Float32Array(N);
  const ramp = Math.round(0.02 * sr);                     // 20ms attack+release, no clicks
  for(let i = 0; i < N; i++){
    let env = 1; if(i < ramp) env = i / ramp; else if(i > N - ramp) env = (N - i) / ramp;
    const t = i / sr, s = homeMix * Math.sin(2 * Math.PI * fHome * t) + driftMix * Math.sin(2 * Math.PI * fDrift * t);
    out[i] = peak * env * s;                               // unison ⇒ ~peak; detuned ⇒ beating, still < peak·1
  }
  return out;
}

// master gain that keeps N summed voices below a ceiling (anti-clip headroom).
export function voiceGainFor(activeVoices, perVoiceAmp = 0.32, ceiling = 0.9){
  const pk = Math.max(1, activeVoices) * perVoiceAmp;
  return pk <= 1e-9 ? 1 : Math.min(1, ceiling / pk);
}

// ============================================================================
//  THE SELF-TEST — the named, load-bearing assertions (★ = falsifier).
//  Shared between the Node twin and the in-page pill. ≥14 in-page; the Node
//  twin adds exhaustive sweeps for ≥32 total.
// ============================================================================
export function runSelfTest(opts = {}){
  const checks = [];
  const add = (name, ok, info, star) => checks.push({ name, ok: !!ok, info: info || '', star: !!star });

  // a tiny deterministic PRNG so the test is seed-pure & reproducible
  let _s = 0x2545F491 ^ (opts.seed || 1);
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  const randomCyc = () => {
    const Tc = pick(160, 560), Th = Tc + pick(50, 600), r = pick(1.3, 11);
    const g = rnd() < 0.5 ? GAMMA_MONO : 7 / 5;
    return { cyc: carnotStates(Th, Tc, r, g), Tc, leak: pick(1, Math.min(80, (Tc - 5) * 0.5)) };
  };
  const base = carnotStates(500, 300, 3, GAMMA_MONO);

  // ── (a) SINGLE SOURCE OF TRUTH ──────────────────────────────────────────
  // (a1)★ voiceState's ledger IS irreversibleLedger's, byte-identical, over many configs
  {
    let allEq = true, worst = '';
    for(let k = 0; k < 60; k++){
      const { cyc, leak } = randomCyc();
      const vs = voiceState(cyc, leak);
      const led = irreversibleLedger(cyc, leak);
      const sameJSON = JSON.stringify(vs.led) === JSON.stringify(led);
      const sameDS = vs.dS_universe === led.dS_universe;   // strict ===
      if(!(sameJSON && sameDS)){ allEq = false; worst = `leak=${leak.toFixed(1)}`; break; }
    }
    add('(a1)★ voiceState().led === irreversibleLedger() byte-identical, dS_universe strict === (60 configs)',
        allEq, allEq ? 'every ledger object & dS matched the bench core exactly' : `MISMATCH @ ${worst}`, true);
  }
  // (a2)★ the audible pitch is a pure fn of that dS — round-trip exact
  {
    let exact = true, worst = '';
    for(let k = 0; k < 60; k++){
      const { cyc, leak } = randomCyc();
      const vs = voiceState(cyc, leak);
      const rt = centsToHz(entropyToCents(vs.dS_universe));
      if(rt !== vs.driftHz){ exact = false; worst = `Δ=${Math.abs(rt - vs.driftHz).toExponential(2)}`; break; }
    }
    add('(a2)★ centsToHz(entropyToCents(dS)) === driftHz exactly — pitch is a pure fn of the meter\'s dS',
        exact, exact ? 'driftHz reproduced from dS alone, strict ===' : `MISMATCH ${worst}`, true);
  }
  // (a3)★ SOURCE DISJOINTNESS — the mapping sees ONLY a number
  {
    const src = entropyToCents.toString();
    const forbidden = ['T_h', 'T_c', 'Q_', 'carnotStates', 'irreversibleLedger'];
    const leaked = forbidden.filter(t => src.includes(t));
    add('(a3)★ source-disjointness: entropyToCents.toString() mentions no physics (T_h/T_c/Q_/carnotStates/irreversibleLedger)',
        leaked.length === 0, leaked.length === 0 ? 'the mapping sees only dS — a bare number' : 'LEAKED: ' + leaked.join(','), true);
  }

  // ── (b) THE ARROW ───────────────────────────────────────────────────────
  // (b1)★ reversible ⇒ exactly home / unison / zero beat
  {
    const vs = voiceState(base, 0);
    const ok = entropyToCents(0) === 0 && vs.cents === 0
             && Math.abs(vs.driftHz - HOME_HZ) <= TOL_EXACT && vs.beatHz <= TOL_EXACT;
    add('(b1)★ reversible (leak=0) ⇒ 0 cents, driftHz === HOME_HZ, zero beat — the two voices come home',
        ok, `cents=${vs.cents}, driftHz=${vs.driftHz.toFixed(9)}, beatHz=${vs.beatHz.toExponential(2)}`, true);
  }
  // (b2)★ any leak ⇒ cents strictly positive
  {
    let allPos = true, worst = '';
    for(let k = 0; k < 60; k++){
      const { cyc, leak } = randomCyc();
      const c = voiceState(cyc, leak).cents;
      if(!(c > 0)){ allPos = false; worst = `leak=${leak.toFixed(2)} ⇒ cents=${c}`; break; }
    }
    add('(b2)★ any heat leak (ΔT>0) ⇒ cents > 0 strictly (60 random configs)',
        allPos, allPos ? 'every irreversible config detuned the voice upward' : worst, true);
  }
  // (b3)★ STRICT MONOTONE over a ΔT sweep, multiple base cycles
  {
    let monotone = true, worstGap = Infinity, detail = '';
    const bases = [carnotStates(500, 300, 3), carnotStates(700, 250, 5, 7 / 5), carnotStates(420, 200, 2.2)];
    const STEPS = 50;
    for(const cyc of bases){
      let prev = -Infinity;
      for(let i = 1; i <= STEPS; i++){
        const dT = (i / STEPS) * 80;
        const c = voiceState(cyc, dT).cents;
        const gap = c - prev;
        if(!(gap > 0)){ monotone = false; detail = `dT=${dT.toFixed(2)} gap=${gap.toExponential(2)}`; }
        if(gap < worstGap) worstGap = gap;
        prev = c;
      }
    }
    add(`(b3)★ cents strictly increases over a ΔT sweep (${STEPS} steps × 3 base cycles) — you cannot tune it back`,
        monotone, monotone ? `worst (smallest) positive gap = ${worstGap.toExponential(2)}` : detail, true);
  }
  // (b4)★ NEGATIVE CONTROL — dS<0 never drives the pitch below home
  {
    const ctrl = entropyToCents(-1e-9) === 0 && entropyToCents(-50) === 0;
    let neverBelow = true, worst = '';
    for(let k = 0; k < 80; k++){
      const { cyc, leak } = randomCyc();
      const vs = voiceState(cyc, leak);
      if(!(vs.cents >= 0) || !(vs.driftHz >= HOME_HZ - TOL_EXACT)){
        neverBelow = false; worst = `cents=${vs.cents}, driftHz=${vs.driftHz}`; break;
      }
    }
    add('(b4)★ negative control: dS=−ε ⇒ 0 cents; no (Th,Tc,r,leak) yields cents<0 or driftHz<HOME (80 configs)',
        ctrl && neverBelow, ctrl && neverBelow ? 'entropy never tunes below home — the floor holds' : worst, true);
  }
  // (b5) CLAMP sanity — a huge dS saturates at one octave
  {
    const ok = entropyToCents(50) === MAX_CENTS && centsToHz(MAX_CENTS) === HOME_HZ * 2;
    add('(b5) clamp sanity: dS=50 J/K ⇒ MAX_CENTS (1 octave), driftHz tops out at 440 Hz — never shrieks',
        ok, `entropyToCents(50)=${entropyToCents(50)}, top driftHz=${centsToHz(MAX_CENTS).toFixed(2)}`);
  }
  // (b6)★ CALIBRATION-ANCHORED to the REAL number (not a guess)
  {
    const led = irreversibleLedger(base, 30);
    const cents = entropyToCents(led.dS_universe);
    const inBand = cents >= 120 && cents <= 180;       // a clean semitone-ish bend
    add('(b6)★ calibration: carnotStates(500,300,3) @ΔT=30 (real dS≈1.53 J/K) ⇒ cents ∈ [120,180]',
        inBand, `real dS=${led.dS_universe.toFixed(4)} J/K ⇒ ${cents.toFixed(2)} cents`, true);
  }
  // (b7) determinism — voiceState is seed-pure (same input ⇒ same output)
  {
    const a = voiceState(base, 30), b = voiceState(base, 30);
    add('(b7) determinism: voiceState(base,30) reproduces driftHz & cents exactly on re-call',
        a.driftHz === b.driftHz && a.cents === b.cents,
        `driftHz ${a.driftHz === b.driftHz ? '==' : '≠'} & cents ${a.cents === b.cents ? '==' : '≠'}`);
  }
  // (b8) renderer is bounded & non-silent for a leak; silent-floor home is still audible
  {
    const home = carnotVoiceSamples({ dS_universe: 0, seconds: 0.2 });
    const leak = carnotVoiceSamples({ dS_universe: irreversibleLedger(base, 30).dS_universe, seconds: 0.2 });
    let pkHome = 0, pkLeak = 0, nonZeroHome = 0;
    for(const v of home){ const a = Math.abs(v); if(a > pkHome) pkHome = a; if(a > 1e-4) nonZeroHome++; }
    for(const v of leak){ const a = Math.abs(v); if(a > pkLeak) pkLeak = a; }
    const ok = pkHome <= 0.341 && pkLeak <= 0.341 && nonZeroHome > home.length * 0.5;
    add('(b8) carnotVoiceSamples bounded (peak ≤ ~0.34, headroom for no-clip) & home not silent',
        ok, `peakHome=${pkHome.toFixed(3)}, peakLeak=${pkLeak.toFixed(3)}, home active=${(100 * nonZeroHome / home.length).toFixed(0)}%`);
  }

  const pass = checks.filter(c => c.ok).length;
  return { checks, pass, total: checks.length };
}
