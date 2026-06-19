/* ════════════════════════════════════════════════════════════════
   THE SQUEEZE · core.test.mjs — the Node twin (exit 0 iff all pass)
   ════════════════════════════════════════════════════════════════
   Runs the single-slit uncertainty proofs headless against core.mjs —
   the SOLE authority — then proves the parity only the file system can.

   THE THREE REQUIRED PROOFS:
     (1) GAUSSIAN SATURATES: Δx·Δp = ħ/2 = 0.5 to ε, for every σ.
     (2) TOP-HAT STRICTLY ABOVE at the SAME Δx: a=σ√3 ⇒ product > the
         Gaussian's AND > 0.5 — the sinc-tail tax, exactly CLAIM.tophatProductM1.
     (3) FLOOR SWEEP: across swept widths & profiles & windows, NO product
         falls below ħ/2 — the floor is real.

   CORROBORATORS:
     (4) WINDOW MONOTONE + SCALE-INVARIANT: product grows strictly in m,
         and is identical across a at fixed m (Δx∝a, Δp∝1/a).
     (5) FAR-FIELD SHAPE ↔ FFT: sample A(x), forward-FFT it via the estate's
         certified butterfly (the SAME transform wave-packet imports), and
         confirm |Ã(k)|² matches farFieldIntensity — top-hat first zero at
         k=π/a, Gaussian within one k-bin of the analytic curve.
     (6) DETERMINISM: two recomputes byte-identical.
     (7) BYTE-TWIN PARITY: the // === CORE … === block inlined into
         index.html is byte-identical to the same block in core.mjs.

   GRID NOTE: the in-page windowed Simpson uses Ng=4000. That gives the
   top-hat product 0.60762829 — identical to Ng=200000 to 8 digits — so the
   1e-7 tolerance below is honest (the sinc² integrand is smooth; the grid
   is generous, not marginal, unlike the finite-well's O(h) stepped potential).

   Run:  node cavern/uncertainty-slit/core.test.mjs   →  exit 0 on success.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HBAR, floor_, deltaX, deltaPgauss, sinc, farFieldIntensity,
  deltaPtophatWindowed, product, CLAIM, live, farFieldSampler
} from './core.mjs';
import { fft, isPow2 } from '../../butterfly/core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const results = [];
function ck(name, ok, detail){
  results.push({ name, ok: !!ok, detail: detail || '' });
  if(!ok) failed++;
}

/* ── (1) GAUSSIAN SATURATES: Δx·Δp = ħ/2 = 0.5 to ε, ∀σ ── */
{
  let maxErr = 0, mw = '';
  for(const s of [0.5, 1, 2, 3.7]){
    const e = Math.abs(product('gauss', s) - 0.5);
    if(e > maxErr){ maxErr = e; mw = 'σ='+s; }
  }
  ck('Gaussian aperture saturates the bound: Δx·Δp = ħ/2 = 0.5 to ε (∀σ)',
     maxErr < 1e-12,
     `max |product−0.5| ${maxErr.toExponential(2)} (${mw}); the minimum-uncertainty state`);
}

/* ── (2) TOP-HAT STRICTLY ABOVE at the SAME Δx ── */
{
  const sigma = 1, a = sigma*Math.sqrt(3);   // a=σ√3 ⇒ Δx_tophat = a/√3 = σ = Δx_gauss
  const pg = product('gauss', sigma), pt = product('tophat', a, 1);
  const sameDx = Math.abs(deltaX('tophat', a) - deltaX('gauss', sigma)) < 1e-12;
  const claimOK = Math.abs(pt - CLAIM.tophatProductM1) < 1e-7;
  ck('at the SAME Δx the top-hat sits STRICTLY above the floor (the sinc tax)',
     sameDx && pt > pg && pt > 0.5 + 1e-6 && claimOK,
     `Δx=${deltaX('gauss',sigma).toFixed(4)} (both): gauss ${pg.toFixed(6)} < top-hat ${pt.toFixed(6)} == CLAIM ${CLAIM.tophatProductM1}`);
}

/* ── (3) FLOOR SWEEP: no profile/width/window dips below ħ/2 ── */
{
  let minP = Infinity, gMin = Infinity, tMin = Infinity;
  for(let s = 0.2; s <= 8.0001; s += 0.2){ const p = product('gauss', s); minP = Math.min(minP, p); gMin = Math.min(gMin, p); }
  for(let a = 0.2; a <= 8.0001; a += 0.2){
    for(const m of [1,2,3,5]){ const p = product('tophat', a, m); minP = Math.min(minP, p); tMin = Math.min(tMin, p); }
  }
  ck('swept widths × profiles × windows: NO product < ħ/2 (the floor is real)',
     minP >= 0.5 - 1e-12 && Math.abs(gMin - 0.5) < 1e-12 && tMin > 0.5 + 1e-6,
     `global min ${minP.toFixed(10)}; gauss min == ${gMin.toFixed(10)} (the floor), top-hat min ${tMin.toFixed(6)} (>0.5)`);
}

/* ── (4) WINDOW MONOTONE + SCALE-INVARIANT ── */
{
  const ms = [1,2,3,5,10];
  let monoOK = true, prev = -1, mw = '';
  for(const m of ms){ const p = product('tophat', 1, m); if(!(p > prev)){ monoOK = false; mw = 'm='+m; } prev = p; }
  let scaleOK = true, sw = '';
  const ref = product('tophat', 1, 1);
  for(const a of [0.5, 1, 2]){ if(Math.abs(product('tophat', a, 1) - ref) > 1e-9){ scaleOK = false; sw = 'a='+a; } }
  ck('window monotone in m & scale-invariant in a (Δx∝a, Δp∝1/a)',
     monoOK && scaleOK,
     monoOK ? (scaleOK ? `product↑ over m=${ms.join('<')}; identical across a∈{0.5,1,2} to 1e-9`
                       : 'SCALE OFF AT '+sw)
            : 'NON-MONOTONE AT '+mw);
}

/* ── (5) FAR-FIELD SHAPE ↔ FFT of A(x) (the certified butterfly) ──
   Sample the aperture A(x) on a power-of-two grid, forward-FFT it, and
   confirm the spectrum |Ã(k)|² matches farFieldIntensity: the top-hat's
   first zero lands at k=π/a, and the Gaussian agrees within one k-bin. */
{
  const N = 2048, L = 64, dx = L/N, dk = 2*Math.PI/L;
  function kOf(j){ return (j < N/2 ? j : j - N) * dk; }
  function sampleAndSpectrum(profile, w){
    const buf = new Array(N);
    for(let i=0;i<N;i++){
      const x = -L/2 + i*dx;
      let A;
      if(profile === 'gauss') A = Math.exp(-(x*x)/(4*w*w));
      else A = (Math.abs(x) < w) ? 1 : 0;
      buf[i] = { re: A, im: 0 };
    }
    const F = fft(buf);
    return { F };
  }
  // (a) top-hat first zero at k=π/a: the |Ã(k)|² bin nearest k=π/a is a deep null.
  const aT = 4;                       // a few bins per lobe at this L,N
  const { F: Ft } = sampleAndSpectrum('tophat', aT);
  const kZero = Math.PI/aT;
  let jZero = Math.round(kZero/dk);
  // power at the predicted zero vs the DC peak — must be a deep null
  const powAt = (Fr) => Fr.re*Fr.re + Fr.im*Fr.im;
  const peakT = powAt(Ft[0]);
  const nullT = powAt(Ft[jZero]);
  const zeroOK = (nullT/peakT) < 1e-3;
  // (b) Gaussian: the FFT power profile matches exp(−2σ²k²) within one bin.
  const wG = 2;
  const { F: Fg } = sampleAndSpectrum('gauss', wG);
  let maxRel = 0, gw = '';
  for(let j=1;j<24;j++){
    const k = kOf(j);
    const got = powAt(Fg[j]) / powAt(Fg[0]);
    const want = farFieldIntensity('gauss', wG, k);   // exp(−2σ²k²), normalized to 1 at k=0
    // tolerate one-bin smear: compare to the analytic value at this exact k
    const rel = Math.abs(got - want) / (want + 1e-12);
    if(want > 1e-6 && rel > maxRel){ maxRel = rel; gw = 'j='+j; }
  }
  const gaussOK = maxRel < 5e-2;
  ck('far-field |Ã(k)|² == FFT of A(x): top-hat null at k=π/a, Gaussian curve to <5%',
     zeroOK && gaussOK,
     `top-hat null/peak ${(nullT/peakT).toExponential(2)} at k≈π/a; Gaussian max rel ${(maxRel*100).toFixed(2)}% (${gw}) vs exp(−2σ²k²)`);
}

/* ── (6) DETERMINISM: two recomputes byte-identical ── */
{
  const a = live('gauss', 1.3, 1), b = live('gauss', 1.3, 1);
  const at = live('tophat', 2.1, 3), bt = live('tophat', 2.1, 3);
  const s1 = JSON.stringify(a)+JSON.stringify(at), s2 = JSON.stringify(b)+JSON.stringify(bt);
  ck('deterministic (pure core)', s1 === s2, 'identical recompute of live() for both profiles');
}

/* ── live() contract sanity: dx·dp == product, saturated iff Gaussian ── */
{
  const lg = live('gauss', 1.7, 1), lt = live('tophat', 1.7, 1);
  const dxdpOK = Math.abs(lg.dx*lg.dp - lg.product) < 1e-12 && Math.abs(lt.dx*lt.dp - lt.product) < 1e-12;
  const satOK = lg.saturated === true && lt.saturated === false && lg.floor === 0.5;
  ck('live() contract: dx·dp == product; saturated⇔Gaussian; floor==0.5',
     dxdpOK && satOK,
     `gauss saturated=${lg.saturated} (prod ${lg.product.toFixed(6)}) · top-hat saturated=${lt.saturated} (prod ${lt.product.toFixed(6)})`);
}

/* ── sampler determinism + no-starve (visual only, but must be honest) ── */
{
  // seeded LCG so the test is deterministic
  let seed = 1234567;
  const rng = () => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const sampG = farFieldSampler(1.0, 'gauss', 1);
  const sampT = farFieldSampler(1.0, 'tophat', 1);
  let okG = true, okT = true;
  for(let i=0;i<5000;i++){ if(!isFinite(sampG(rng))) okG = false; const k = sampT(rng); if(!isFinite(k)) okT = false; }
  ck('far-field sampler never starves & stays finite (visual layer)',
     okG && okT, '5000 draws each profile, all finite');
}

/* ── (7) BYTE-TWIN PARITY: the core block inlined in index.html is
        byte-identical to the same block in core.mjs ── */
function extractCore(text){
  const lines = text.split('\n');
  const i0 = lines.findIndex(l => l.startsWith('// === CORE BEGIN ==='));
  const i1 = lines.findIndex(l => l.startsWith('// === CORE END ==='));
  if(i0<0 || i1<0 || i1<i0) return null;
  return lines.slice(i0, i1+1).join('\n');
}
{
  const coreSrc = readFileSync(join(HERE,'core.mjs'),'utf8');
  const pageSrc = readFileSync(join(HERE,'index.html'),'utf8');
  const coreBlk = extractCore(coreSrc);
  const pageBlk = extractCore(pageSrc);
  const ok = coreBlk && pageBlk && coreBlk === pageBlk;
  let detail;
  if(!coreBlk) detail = 'core.mjs has no sentinel block';
  else if(!pageBlk) detail = 'index.html has no sentinel block';
  else if(coreBlk===pageBlk) detail = `identical (${coreBlk.split('\n').length} lines, ${coreBlk.length} bytes)`;
  else {
    const cl = coreBlk.split('\n'), pl = pageBlk.split('\n');
    let firstDiff = -1;
    for(let i=0;i<Math.max(cl.length,pl.length);i++){ if(cl[i]!==pl[i]){ firstDiff=i; break; } }
    detail = `DIFFER (core ${coreBlk.length}B / page ${pageBlk.length}B) first diff at block line ${firstDiff+1}`;
  }
  ck('BYTE-TWIN: core block in index.html is byte-identical to core.mjs', ok, detail);
}

/* ── report ── */
for(const r of results){
  console.log(`${r.ok ? '✓' : '✗'} ${r.name}\n    ${r.detail}`);
}
const pass = results.length - failed;
console.log(`\n${pass}/${results.length} proven` + (failed ? ` — ${failed} FAILED` : ' — all green'));
process.exit(failed ? 1 : 0);
