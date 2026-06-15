/* ════════════════════════════════════════════════════════════════
   THE LATTICE · core.test.mjs — the Node twin (exit 0 iff all pass)
   ════════════════════════════════════════════════════════════════
   Runs the band-structure proofs headless against core.mjs — the SOLE
   authority — then proves two things the in-page self-test can't:

     • BYTE-TWIN PARITY: the // === CORE … === block inlined into
       index.html is byte-identical to the same block in core.mjs.
       (If someone edits one and not the other, this goes red.)

     • ANTI-CIRCULARITY: the "N states per band" fact is established by
       an INDEPENDENT ring eigensolve — counting eigenvalues that land in
       a band — NOT by reading back the 2N cap the fill engine was handed.
       (This is the exact regression explorer A introduced; we refuse it.)

   Run:  node cavern/lattice/core.test.mjs    →  exit 0 on success.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  kOf, fDisp, cellMatrix, halfTrace, detCell, findBands, energyAtQ,
  buildRing, ringMul, cyclicSolve, ringEigs, classify
} from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const results = [];
function ck(name, ok, detail){
  results.push({ name, ok: !!ok, detail: detail || '' });
  if(!ok) failed++;
}

const P = 2.0, a = 1.0;

/* ── 1. f(E) == ½·tr M(E), and det M = 1 (two unrelated algebras) ── */
{
  let maxF = 0, maxDet = 0;
  for(let i=1;i<=4000;i++){ const E=i*0.012;
    maxF = Math.max(maxF, Math.abs(fDisp(E,P,a)-halfTrace(E,P,a)));
    maxDet = Math.max(maxDet, Math.abs(detCell(E,P,a)-1)); }
  ck('f(E) == ½·tr M(E) of an independent transfer matrix (det M = 1)',
     maxF<1e-15 && maxDet<1e-15,
     `max|f−½trM| ${maxF.toExponential(2)} · max|detM−1| ${maxDet.toExponential(2)} (4000 E)`);
}

/* ── 2. band edges land exactly on |f| = 1 (q·a = nπ) ── */
let bands;
{
  bands = findBands(P,a,80,5);
  let edgeMax = 0;
  for(const bd of bands){
    edgeMax = Math.max(edgeMax, Math.abs(Math.abs(fDisp(bd[0],P,a))-1));
    edgeMax = Math.max(edgeMax, Math.abs(Math.abs(fDisp(bd[1],P,a))-1));
  }
  ck('band edges land exactly on |f| = 1  (q·a = nπ)', bands.length>=3 && edgeMax<1e-6,
     `${bands.length} bands; max |f|−1 at an edge ${edgeMax.toExponential(2)}`);
}

/* ── 3. the gaps between bands are truly forbidden (|f| > 1) ── */
{
  let gapsOK = true;
  for(let g=0; g+1<bands.length; g++){
    const mid = 0.5*(bands[g][1]+bands[g+1][0]);
    if(Math.abs(fDisp(mid,P,a))<=1) gapsOK = false;
  }
  ck('the gaps between bands are truly forbidden (|f| > 1)', gapsOK,
     `${bands.length-1} gaps, |f|>1 across every one`);
}

/* ── 4. NEGATIVE CONTROL — P→0 closes the gaps (free electron) ── */
{
  const gp = (PP)=>{ const bb=findBands(PP,a,40,2); return bb.length>1 ? bb[1][0]-bb[0][1] : 0; };
  const gBig=gp(8), gMid=gp(1), gTiny=gp(0.02);
  ck('P→0 (free electron) closes the gaps toward zero', gBig>gMid && gMid>gTiny && gTiny<0.05,
     `gap above band 1: P=8 ${gBig.toFixed(3)} > P=1 ${gMid.toFixed(3)} > P=0.02 ${gTiny.toFixed(4)}`);
}

/* ── 5. P→∞ narrows band 1 onto the isolated level π²/(2a²) ── */
{
  const atom1 = Math.PI*Math.PI/(2*a*a);
  const bw = findBands(8,a,40,1)[0], bn = findBands(400,a,40,1)[0];
  const wWide = bw[1]-bw[0], wNarrow = bn[1]-bn[0];
  const edgeApproach = Math.abs(bn[1]-atom1)/atom1;
  ck('P→∞ narrows band 1 onto the isolated level π²/(2a²)',
     wNarrow < wWide*0.25 && edgeApproach < 0.02,
     `width P=8 ${wWide.toFixed(3)} → P=400 ${wNarrow.toFixed(4)}; edge → E₁=${atom1.toFixed(3)}`);
}

/* ── 6. INDEPENDENT ring eigensolve gives exactly N states/band ──
   ANTI-CIRCULARITY: we count eigenvalues of the ACTUAL ring Hamiltonian
   that fall inside band 1, never the 2N cap the fill engine was handed. */
const RING_N = 8;
{
  const R = buildRing(P,a,RING_N,40);
  const bnds = findBands(P,a,30,3);
  const nLow = RING_N + 4;
  const eigs = ringEigs(R, nLow, bnds[0][0]-0.4, 4242);
  const inBand = (E, band)=> E>=band[0]-0.35 && E<=band[1]+0.35;
  const cnt1 = eigs.filter(E=>inBand(E,bnds[0])).length;
  ck('an independent ring eigensolve gives exactly N states in band 1', cnt1===RING_N,
     `N=${RING_N} ring → band 1 holds ${cnt1} states (lowest ${nLow} eigenvalues), NOT read from any 2N cap`);
}

/* ── 7. E(q) round-trips: f(E(qa)) = cos(qa) across band 1 ── */
{
  const band1 = findBands(P,a,30,1)[0];
  let rtMax = 0;
  for(let t=0;t<=12;t++){ const qa=t/12*Math.PI, E=energyAtQ(band1,P,a,qa);
    rtMax = Math.max(rtMax, Math.abs(fDisp(E,P,a)-Math.cos(qa))); }
  ck('E(q) round-trips: f(E(qa)) = cos(qa) across band 1', rtMax<1e-7,
     `round-trip max ${rtMax.toExponential(2)}`);
}

/* ── 8. METAL: 1 e⁻/atom = N of 2N states = half-full ⇒ parity verdict ── */
{
  const bHalf = findBands(2,1,30,3);
  const c = classify(bHalf, RING_N, RING_N, 2, 1);
  ck('half-filled band ⇒ METAL (1 e⁻/atom = N of 2N states)',
     c.verdict==='METAL' && c.topFill===RING_N && c.cap===2*RING_N,
     `${RING_N} e⁻ → top band ${c.topFill}/${c.cap} ⇒ ${c.verdict}`);
}

/* ── 9. INSULATOR/SEMICONDUCTOR: 2 e⁻/atom fills a band to a real gap ── */
{
  const bHalf = findBands(2,1,30,3);
  const c = classify(bHalf, RING_N, 2*RING_N, 2, 1);
  const gapAbove = bHalf[1][0]-bHalf[0][1];
  ck('exactly-full band + a real gap ⇒ INSULATOR/SEMICONDUCTOR (2 e⁻/atom)',
     (c.verdict==='INSULATOR'||c.verdict==='SEMICONDUCTOR') && c.topFill===2*RING_N && gapAbove>1e-6,
     `2N=${2*RING_N} e⁻ → band full, gap ${gapAbove.toFixed(2)} above ⇒ ${c.verdict}`);
}

/* ── 10. NEGATIVE CONTROL — P=0 is ALWAYS a metal, even at 2 e⁻/atom ── */
{
  const bFree = findBands(0, 1, 22, 3);
  const oneBand = bFree.length===1;
  const c = classify(bFree, RING_N, 2*RING_N, 0, 1);
  ck('P=0 (free electrons): one unbroken band, no gaps ⇒ ALWAYS a METAL',
     c.verdict==='METAL' && oneBand,
     `P=0: findBands → ${bFree.length} band, 2N e⁻ ⇒ ${c.verdict}`);
}

/* ── 11. electron conservation: Σ filled + overflow = poured, cap respected ── */
{
  const bHalf = findBands(2,1,30,3);
  let consOK = true, capOK = true;
  for(let ne=0; ne<=5*2*RING_N; ne+=7){
    const c = classify(bHalf, RING_N, ne);
    let sum = c.overflow;
    for(const f of c.filled){ sum += f; if(f>c.cap) capOK = false; }
    if(sum!==ne) consOK = false;
  }
  ck('occupancy conserves electrons (Σ filled + overflow = poured) and no band exceeds 2N',
     consOK && capOK, consOK ? `every pour 0…${5*2*RING_N} conserves; cap respected` : 'MISMATCH');
}

/* ── 12. live metal↔insulator parity sweep (the bench's headline claim) ──
   1/2/3/4 e/atom → METAL/INSULATOR/METAL/INSULATOR at a clear-gap lattice. */
{
  const bb = findBands(2,1,46,6);
  const want = [[8,'METAL'],[16,'INSULATOR'],[24,'METAL'],[32,'INSULATOR']];
  let ok = true, trace = [];
  for(const [ne,exp] of want){
    const v = classify(bb, RING_N, ne, 2, 1).verdict;
    trace.push(`${ne/RING_N}e→${v}`);
    if(v!==exp) ok = false;
  }
  ck('1/2/3/4 e⁻/atom ⇒ METAL/INSULATOR/METAL/INSULATOR (the live lamp parity)', ok, trace.join(' '));
}

/* ── 13. BYTE-TWIN PARITY: the core block inlined in index.html is
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
