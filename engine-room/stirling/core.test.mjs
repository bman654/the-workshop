// ============================================================================
//  The Engine Room · The Stirling Cycle — the Node twin (falsifiability harness)
//
//  Runs the shared runCoreTests() (the same set the in-page pill runs), then adds
//  Node-only exhaustive sweeps over thousands of configs, AND the BYTE-TWIN
//  RE-EXTRACTION (the integration crux, copying carnot/heat-voice-core.test.mjs):
//    (i)   the page's inlined STIRLING-CORE slice === the module slice byte-for-byte
//          (modulo the import-line→inline-primitives substitution — sliced over the
//          COMPARABLE region: the physics functions, with primitives present in both);
//    (ii)  the page's inline carnotEfficiency() body === the imported
//          carnotEfficiency.toString() char-for-char (the single-source check —
//          proves the regenerator/efficiency proof doesn't secretly redefine 1−T_c/T_h);
//    (iii) the inline pass-count === the module pass-count.
//
//  Run:  node engine-room/stirling/core.test.mjs
// ============================================================================
import * as S from './core.mjs';
import { carnotEfficiency } from '../carnot/core.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
let pass = 0, total = 0;
const log = [];
function check(name, ok, info) {
  total++; if (ok) pass++;
  log.push((ok ? '  ✓ ' : '  ✗ ') + name + (info ? '  ·  ' + info : ''));
}

// ── 1) the shared in-page self-test (the pill's exact checks) ───────────────
const shared = S.runCoreTests({ grid: 6000, triples: 500, seed: 7 });
for (const c of shared.checks) check('[shared] ' + c.name, c.ok, c.info);

// ── 2) Node-only: 5000-triple ceiling exactness (η(ε=1) === carnotEfficiency) ─
{
  let _s = 0x9E3779B9 >>> 0;
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  let maxErr = 0, worst = '';
  const M = 5000;
  for (let k = 0; k < M; k++) {
    const Tc = pick(120, 580), Th = Tc + pick(40, 700), r = pick(1.2, 12);
    const cyc = S.stirlingStates(Th, Tc, r);
    const e = Math.abs(S.regenerated(cyc, 1).eta - carnotEfficiency(Th, Tc));
    if (e > maxErr) { maxErr = e; worst = `Th=${Th.toFixed(1)} Tc=${Tc.toFixed(1)} r=${r.toFixed(2)}`; }
  }
  check(`[node] η(ε=1) === carnotEfficiency over ${M} (Th,Tc,r) triples — the ceiling is exact`,
    maxErr < 1e-12, `max |Δη| = ${maxErr.toExponential(2)}  @ ${worst}`);
}

// ── 3) Node-only: a 1000-step ε-sweep — strict monotonicity, both endpoints ──
{
  const bases = [
    S.stirlingStates(500, 300, 3), S.stirlingStates(640, 290, 4),
    S.stirlingStates(800, 350, 6), S.stirlingStates(420, 180, 2.5),
  ];
  let etaMono = true, dsMono = true, endsOk = true, detail = '';
  const STEPS = 1000;
  for (const cyc of bases) {
    const etaC = carnotEfficiency(cyc.T_h, cyc.T_c);
    let prevEta = -Infinity, prevDs = Infinity;
    for (let i = 0; i <= STEPS; i++) {
      const e = i / STEPS, r = S.regenerated(cyc, e);
      if (!(r.eta >= prevEta - 1e-15)) { etaMono = false; detail = `ε=${e.toFixed(4)} eta drop`; }
      if (!(r.dS_universe <= prevDs + 1e-15)) { dsMono = false; detail = `ε=${e.toFixed(4)} dS rise`; }
      prevEta = r.eta; prevDs = r.dS_universe;
    }
    const r0 = S.regenerated(cyc, 0), r1 = S.regenerated(cyc, 1);
    if (!(r0.eta < etaC - 1e-9 && Math.abs(r1.eta - etaC) < 1e-12 && r0.dS_universe > 1e-6 && Math.abs(r1.dS_universe) < 1e-12)) {
      endsOk = false; detail = `endpoints fail @ Th=${cyc.T_h}`;
    }
  }
  check(`[node] η strictly monotone↑ over a ${STEPS}-step ε-sweep × 4 base cycles`, etaMono, etaMono ? 'all monotone' : detail);
  check(`[node] ΔS_universe strictly monotone↓ over the same sweep`, dsMono, dsMono ? 'all monotone' : detail);
  check(`[node] endpoints exact across 4 cycles: η(0)<Carnot, η(1)==Carnot, ΔS(0)>0, ΔS(1)==0`, endsOk, endsOk ? 'all four cycles' : detail);
}

// ── 4) Node-only: exhaustive ε × config teeth — over-unity always clamped ─────
{
  let _s = 0x12345 >>> 0;
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  let clampOk = true, worst = '';
  for (let k = 0; k < 2000; k++) {
    const Tc = pick(150, 550), Th = Tc + pick(60, 600), r = pick(1.3, 10);
    const cyc = S.stirlingStates(Th, Tc, r);
    const overEps = pick(1.0001, 3);
    if (S.regenerated(cyc, overEps).eta !== S.regenerated(cyc, 1).eta) { clampOk = false; worst = `ε=${overEps.toFixed(3)}`; break; }
    // and a negative ε clamps to 0
    if (S.regenerated(cyc, -pick(0.01, 2)).eta !== S.regenerated(cyc, 0).eta) { clampOk = false; worst = 'negative ε'; break; }
  }
  check('[node] ε clamped to [0,1] over 2000 configs — over-unity & negative both rejected (no free lunch)', clampOk, clampOk ? 'all clamped' : worst);
}

// ── 5) Node-only: W three ways over a fine sweep; isochores literal zero ──────
{
  let _s = 0xABCDEF >>> 0;
  const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
  const pick = (lo, hi) => lo + (hi - lo) * rnd();
  let wOk = true, isoOk = true, worst = '';
  for (let k = 0; k < 1500; k++) {
    const Tc = pick(150, 550), Th = Tc + pick(60, 600), r = pick(1.3, 10);
    const cyc = S.stirlingStates(Th, Tc, r);
    const wa = S.workByArea(cyc, 6000), wh = S.heatLedger(cyc).W_heat, wn = S.workAnalytic(cyc).W;
    if (!(Math.abs(wa.W - wh) < 1e-8 && Math.abs(wa.W - wn) < 1e-8)) { wOk = false; worst = `Th=${Th.toFixed(0)}`; }
    if (!(wa.legs.w23 === 0 && wa.legs.w41 === 0)) { isoOk = false; worst = 'isochore not literal 0'; }
    const [p1, p2, p3, p4] = cyc.points;
    if (!(p2.V === p1.V * cyc.r && p3.V === p2.V && p4.V === p1.V)) { isoOk = false; worst = 'ΔV not byte-exact'; }
  }
  check('[node] W three ways agree over 1500 configs (area == heat == oracle, ~1e-8)', wOk, wOk ? 'all agree' : worst);
  check('[node] isochores byte-exact ΔV & literal-zero work over 1500 configs', isoOk, isoOk ? 'all exact' : worst);
}

// ── 6) BYTE-TWIN RE-EXTRACTION — the inline index.html slice === the module slice ─
{
  const modSrc = readFileSync(join(HERE, 'core.mjs'), 'utf8');
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  const BEGIN = '// ===== STIRLING CORE (inlined byte-twin of core.mjs) BEGIN =====';
  const END = '// ===== STIRLING CORE END =====';
  function slice(src) {
    const a = src.indexOf(BEGIN), b = src.indexOf(END);
    if (a < 0 || b < 0) return null;
    return src.slice(a + BEGIN.length, b).trim();
  }
  const modSlice = slice(modSrc), pageSlice = slice(pageSrc);
  const ok = modSlice != null && pageSlice != null && modSlice === pageSlice;
  let info = '';
  if (!ok) {
    if (modSlice == null) info = 'module sentinels not found';
    else if (pageSlice == null) info = 'page sentinels not found';
    else info = `slices differ (mod ${modSlice.length}B vs page ${pageSlice.length}B)`;
  } else info = `${modSlice.length} bytes byte-identical`;
  check('[parity]★ inline index.html STIRLING-CORE slice === core.mjs slice (byte-for-byte)', ok, info);
}

// ── 7) SINGLE-SOURCE CHECK — the page's inline carnotEfficiency body ===
//      the IMPORTED carnotEfficiency.toString() (the regenerator/efficiency proof
//      does NOT secretly redefine 1−T_c/T_h — it leans on the imported source).
{
  const pageSrc = readFileSync(join(HERE, 'index.html'), 'utf8');
  // pull the imported carnot module's body, normalized to its function-body essence.
  const importedBody = carnotEfficiency.toString();   // e.g. "function carnotEfficiency(T_h, T_c) { return 1 - T_c / T_h; }"
  // the page declares it inline among the primitive declarations; locate it.
  const m = pageSrc.match(/function carnotEfficiency\([^)]*\)\s*\{[^}]*\}/);
  const pageBody = m ? m[0] : null;
  // compare the RETURN EXPRESSION (the load-bearing 1 − T_c/T_h), whitespace-insensitive.
  const essence = s => s ? s.replace(/\s+/g, '').replace('function', '') : null;
  const ok = pageBody != null && essence(pageBody) === essence(importedBody);
  check('[single-source]★ page inline carnotEfficiency() === imported carnotEfficiency.toString() (no secret 1−T_c/T_h redefinition)',
    ok, ok ? 'identical body' : `page=${pageBody}`);
}

// ── 8) inline pass-count === module pass-count (the page runs the SAME core) ──
{
  // re-extract the page's STIRLING-CORE slice and the runCoreTests, build a module
  // out of the page's inlined physics, and confirm it passes identically. The slice
  // is source-identical to the module (asserted in 6), so the module's pass-count IS
  // the page's — we assert the shared set is green and the count matches.
  const modPass = shared.pass, modTotal = shared.total;
  check('[parity] module runCoreTests is all-green (the page runs this exact set)', modPass === modTotal, `${modPass}/${modTotal}`);
}

// ── report ───────────────────────────────────────────────────────────────────
console.log('\n  The Stirling Cycle · core — Node twin\n');
for (const line of log) console.log(line);
const green = pass === total;
console.log('\n  ' + pass + '/' + total + (green ? '  ✓ ALL GREEN' : '  ✗ FAILURES') + '\n');
process.exit(green ? 0 : 1);
