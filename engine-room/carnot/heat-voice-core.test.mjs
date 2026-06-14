// ============================================================================
//  The Carnot Engine · HEAT-VOICE CORE — the Node twin (falsifiability harness)
//
//  Runs the shared runSelfTest() (the same set the in-page pill runs), then adds
//  Node-only exhaustive sweeps over thousands of (T_h,T_c,r,γ,leak) configs, and
//  the BYTE-TWIN PARITY grep: the slice of heat-voice-core.mjs between the
//  HEAT-VOICE sentinels must appear byte-identically inside the page's inlined
//  twin in index.html. If the page and the module ever drift, this fails.
//
//  Run:  node engine-room/carnot/heat-voice-core.test.mjs
// ============================================================================
import * as HV from './heat-voice-core.mjs';
import { carnotStates, irreversibleLedger, GAMMA_MONO, GAMMA_DIATOMIC } from './core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
const log = [];
function check(name, ok, info){
  total++; if(ok) pass++;
  log.push((ok ? '  ✓ ' : '  ✗ ') + name + (info ? '  ·  ' + info : ''));
}

// ── 1) the shared in-page self-test (the pill's exact checks) ───────────────
const shared = HV.runSelfTest({ seed: 7 });
for(const c of shared.checks) check('[shared] ' + c.name, c.ok, c.info);

// ── 2) Node-only exhaustive sweep: identical-ledger over thousands of configs ─
{
  let _s = 0x9E3779B9 >>> 0;
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  let identical = true, dsPure = true, worst = '';
  const M = 4000;
  for(let k = 0; k < M; k++){
    const Tc = pick(120, 580), Th = Tc + pick(40, 700), r = pick(1.2, 12);
    const g = rnd() < 0.5 ? GAMMA_MONO : GAMMA_DIATOMIC;
    const cyc = carnotStates(Th, Tc, r, g);
    const leak = pick(0, Math.min(80, (Tc - 5) * 0.5));
    const vs = HV.voiceState(cyc, leak);
    const led = leak > 0 ? irreversibleLedger(cyc, leak) : null;
    if(led){
      if(JSON.stringify(vs.led) !== JSON.stringify(led) || vs.dS_universe !== led.dS_universe){
        identical = false; worst = `leak=${leak.toFixed(2)}`; break;
      }
    }
    // pitch must be the pure function of the dS the meter reads
    if(HV.centsToHz(HV.entropyToCents(vs.dS_universe)) !== vs.driftHz){ dsPure = false; worst = `leak=${leak.toFixed(2)}`; break; }
  }
  check(`[node] single source of truth over ${M} (Th,Tc,r,γ,leak) configs — ledger byte-identical`, identical, identical ? 'all matched' : worst);
  check(`[node] pitch is a pure fn of the meter’s dS over ${M} configs (round-trip exact)`, dsPure, dsPure ? 'all exact' : worst);
}

// ── 3) Node-only: positivity + strict monotonicity over a fine ΔT sweep ──────
{
  const bases = [
    carnotStates(500, 300, 3), carnotStates(640, 290, 4, GAMMA_DIATOMIC),
    carnotStates(800, 350, 6), carnotStates(420, 180, 2.5),
  ];
  let monotone = true, posLeak = true, worstGap = Infinity, detail = '';
  const STEPS = 400;
  for(const cyc of bases){
    let prev = -Infinity;
    for(let i = 1; i <= STEPS; i++){
      const dT = (i / STEPS) * Math.min(120, (cyc.T_c - 5));
      const vs = HV.voiceState(cyc, dT);
      if(!(vs.cents > 0)) posLeak = false;
      const gap = vs.cents - prev;
      // once clamped at MAX_CENTS the curve is flat — that is NOT a monotonicity
      // failure, it is the register clamp. Only require strict increase below the clamp.
      if(vs.cents < HV.MAX_CENTS - 1e-9 && !(gap > 0)){ monotone = false; detail = `dT=${dT.toFixed(2)} gap=${gap.toExponential(2)}`; }
      if(vs.cents < HV.MAX_CENTS - 1e-9 && gap < worstGap && gap > -Infinity && prev > -Infinity) worstGap = gap;
      prev = vs.cents;
    }
  }
  check(`[node] cents > 0 for every ΔT>0 over ${STEPS} steps × 4 base cycles`, posLeak, posLeak ? 'all positive' : 'a leak failed positivity');
  check(`[node] cents strictly monotone-increasing (below clamp) over the same sweep`, monotone, monotone ? `worst gap = ${worstGap.toExponential(2)}` : detail);
}

// ── 4) Node-only: negative control — entropy never tunes below home ──────────
{
  let neverBelow = true, worst = '';
  for(let i = 0; i < 2000; i++){
    const dS = (i / 2000) * 60 - 5;     // sweep dS from −5 .. +55, incl. negatives
    const c = HV.entropyToCents(dS);
    const hz = HV.centsToHz(c);
    if(c < 0 || hz < HV.HOME_HZ - HV.TOL_EXACT){ neverBelow = false; worst = `dS=${dS.toFixed(3)} ⇒ cents=${c}, hz=${hz}`; break; }
  }
  const floorOk = HV.entropyToCents(-1) === 0 && HV.entropyToCents(0) === 0 && HV.entropyToCents(NaN) === 0;
  check('[node] negative-control sweep: dS∈[−5,55] ⇒ cents ≥ 0 and driftHz ≥ HOME always', neverBelow && floorOk, neverBelow && floorOk ? 'the home floor is unbreakable' : worst);
}

// ── 5) Node-only: clamp + calibration band over several cycles ───────────────
{
  const big = HV.entropyToCents(1000) === HV.MAX_CENTS && HV.centsToHz(HV.MAX_CENTS) === HV.HOME_HZ * 2;
  check('[node] clamp: any huge dS saturates at exactly MAX_CENTS (driftHz = 440 Hz)', big, `entropyToCents(1000)=${HV.entropyToCents(1000)}`);

  const led = irreversibleLedger(carnotStates(500, 300, 3), 30);
  const cents = HV.entropyToCents(led.dS_universe);
  check('[node] calibration anchor: (500,300,3)@ΔT=30 real dS⇒[120,180] cents', cents >= 120 && cents <= 180, `dS=${led.dS_universe.toFixed(4)} ⇒ ${cents.toFixed(2)} cents`);
}

// ── 6) Node-only: renderer no-clip + detectable bend (the audio claim, offline) ─
{
  const home = HV.carnotVoiceSamples({ dS_universe: 0, seconds: 0.3 });
  const big = HV.carnotVoiceSamples({ dS_universe: 0, seconds: 0.3, centsPerJK: 600 });   // exaggerated path
  const leakDS = irreversibleLedger(carnotStates(500, 300, 3), 30).dS_universe;
  const bigBend = HV.carnotVoiceSamples({ dS_universe: leakDS, seconds: 0.3, centsPerJK: 600 });
  let pkHome = 0, pkBig = 0; for(const v of home) pkHome = Math.max(pkHome, Math.abs(v)); for(const v of bigBend) pkBig = Math.max(pkBig, Math.abs(v));
  // default peak 0.34 ⇒ unison render peaks at ≈0.34 (−9.4 dBFS, clears the no-clip bar)
  check('[node] renderer peak ≤ 0.341 (home & exaggerated leak) — clears the no-clip −9 dB bar', pkHome <= 0.341 && pkBig <= 0.341, `peakHome=${pkHome.toFixed(3)}, peakBig=${pkBig.toFixed(3)}`);
  // the exaggerated-leak render uses a HIGHER drift freq than home (the bend is real)
  const cHome = HV.entropyToCents(0, 600), cBig = HV.entropyToCents(leakDS, 600);
  check('[node] exaggerated-leak bend raises the drift voice strictly above home', HV.centsToHz(cBig) > HV.centsToHz(cHome) * 1.01, `homeDrift=${HV.centsToHz(cHome).toFixed(1)} Hz → leakDrift=${HV.centsToHz(cBig).toFixed(1)} Hz`);
  // touch `big` so it isn't dead (home reference at the exaggerated path is still unison)
  let pkBigHome = 0; for(const v of big) pkBigHome = Math.max(pkBigHome, Math.abs(v));
  check('[node] exaggerated-path home render is still unison (≈peak, no beat)', pkBigHome <= 0.341 && pkBigHome > 0.33, `peak=${pkBigHome.toFixed(3)}`);
}

// ── 7) Node-only: voiceGainFor headroom ──────────────────────────────────────
{
  const g1 = HV.voiceGainFor(2, 0.46, 0.9);   // 2 voices at 0.46 each pre-comp
  const ok = g1 > 0 && g1 <= 1 && 2 * 0.46 * g1 <= 0.9 + 1e-12;
  check('[node] voiceGainFor keeps the summed voices below the ceiling', ok, `gain=${g1.toFixed(4)} ⇒ peak=${(2 * 0.46 * g1).toFixed(3)} ≤ 0.9`);
}

// ── 8) BYTE-TWIN PARITY — the inline index.html slice === the module slice ───
{
  const modSrc = readFileSync(join(HERE, 'heat-voice-core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  // the module sentinels bracket the inlined-into-page region.
  const MOD_BEGIN = '// ===== HEAT-VOICE (byte-twin of heat-voice-core.mjs) BEGIN =====';
  const MOD_END = '// ===== HEAT-VOICE (byte-twin of heat-voice-core.mjs) END =====';
  function slice(src){
    const a = src.indexOf(MOD_BEGIN), b = src.indexOf(MOD_END);
    if(a < 0 || b < 0) return null;
    return src.slice(a + MOD_BEGIN.length, b).trim();
  }
  const modSlice = slice(modSrc), pageSlice = slice(pageSrc);
  const ok = modSlice != null && pageSlice != null && modSlice === pageSlice;
  let info = '';
  if(!ok){
    if(modSlice == null) info = 'module sentinels not found';
    else if(pageSlice == null) info = 'page sentinels not found';
    else info = `slices differ (mod ${modSlice.length}B vs page ${pageSlice.length}B)`;
  } else info = `${modSlice.length} bytes byte-identical`;
  check('[parity]★ inline index.html HEAT-VOICE slice === heat-voice-core.mjs slice (byte-for-byte)', ok, info);
}

// ── report ───────────────────────────────────────────────────────────────────
console.log('\n  The Carnot Engine · heat-voice-core — Node twin\n');
for(const line of log) console.log(line);
const green = pass === total;
console.log('\n  ' + pass + '/' + total + (green ? '  ✓ ALL GREEN' : '  ✗ FAILURES') + '\n');
process.exit(green ? 0 : 1);
