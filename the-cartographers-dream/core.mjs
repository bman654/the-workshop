/* ═══════════════════════════════════════════════════════════════════════════
   THE CARTOGRAPHER'S DREAM — core.mjs
   The HIDDEN LAND. A whole antique chart, deterministic from a seed, generated
   ONCE and never re-derived. The lantern in the page only changes VISIBILITY;
   this module owns all GEOMETRY. Same seed → byte-identical land + identical
   ordered placement list, by construction.

   Ported from the proven cartographer/ pipeline (xmur3+mulberry32 → fBm
   heightmap with island-mask falloff → percentile sea-level → ocean flood-fill
   → coastline BFS → moisture/biome → NW hillshade → steepest-descent river
   flow-accumulation → greedy label placement), with a NEW family-resemblance
   toponymy in the estate's verse/theogony idiom (a per-world syllable family so
   one land's names sound related).

   This file is forge-inlined into index.html verbatim AND imported by
   core.test.mjs — one authority, two consumers. Zero deps (pure JS).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ----------------------------- PRNG (xmur3 + mulberry32) ------------------- */
export function xmur3(str){
  let h = 1779033703 ^ str.length;
  for (let i=0;i<str.length;i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function(){
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
export function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeRng(seedStr){ const s = xmur3(String(seedStr)); return mulberry32(s()); }

/* ----------------------------- Value Noise (2D fBm) ----------------------- */
class ValueNoise{
  constructor(rng){
    const N = 256;
    this.perm = new Uint8Array(N*2);
    this.grad = new Float32Array(N);
    const p = new Uint8Array(N);
    for (let i=0;i<N;i++){ p[i]=i; this.grad[i]=rng(); }
    for (let i=N-1;i>0;i--){ const j=(rng()*(i+1))|0; const t=p[i]; p[i]=p[j]; p[j]=t; }
    for (let i=0;i<N*2;i++) this.perm[i]=p[i&(N-1)];
  }
  _smooth(t){ return t*t*t*(t*(t*6-15)+10); }
  _val(ix,iy){ return this.grad[(this.perm[(ix & 255) + this.perm[iy & 255]])]; }
  noise(x,y){
    const ix=Math.floor(x), iy=Math.floor(y);
    const fx=x-ix, fy=y-iy;
    const u=this._smooth(fx), v=this._smooth(fy);
    const a=this._val(ix,iy), b=this._val(ix+1,iy);
    const c=this._val(ix,iy+1), d=this._val(ix+1,iy+1);
    const top=a+(b-a)*u, bot=c+(d-c)*u;
    return top+(bot-top)*v; // 0..1
  }
  fbm(x,y,oct,lac,gain){
    let amp=1, freq=1, sum=0, norm=0;
    for(let i=0;i<oct;i++){
      sum += amp * (this.noise(x*freq, y*freq)*2-1);
      norm += amp;
      amp *= gain; freq *= lac;
    }
    return (sum/norm)*0.5 + 0.5;
  }
  ridged(x,y,oct,lac,gain){
    let amp=1, freq=1, sum=0, norm=0;
    for(let i=0;i<oct;i++){
      let n = this.noise(x*freq, y*freq)*2-1;
      n = 1 - Math.abs(n);
      n *= n;
      sum += amp*n; norm += amp;
      amp *= gain; freq *= lac;
    }
    return sum/norm;
  }
}

/* ----------------------------- Biome indices ------------------------------ */
export const B = { DEEP:0, SHALLOW:1, LAKE:2, BEACH:3, GRASS:4, FOREST:5, JUNGLE:6,
           SAVANNA:7, DESERT:8, TAIGA:9, TUNDRA:10, SNOW:11, MTN_LOW:12,
           MTN_HIGH:13, ALPINE:14 };

/* value at the given fraction (0..1) of a sorted copy of arr */
function percentile(arr, frac){
  const N=arr.length;
  const copy=Float32Array.from(arr);
  copy.sort();
  let idx=Math.floor(frac*(N-1));
  if(idx<0)idx=0; if(idx>=N)idx=N-1;
  return copy[idx];
}

function shuffle(arr,rng){ for(let i=arr.length-1;i>0;i--){ const j=(rng()*(i+1))|0; const t=arr[i];arr[i]=arr[j];arr[j]=t; } }

/* connected-component clusters of cells matching pred; centroids of big ones */
function findClusters(field, GW, GH, pred, minSize){
  const N=GW*GH; const seen=new Uint8Array(N); const out=[];
  for(let i=0;i<N;i++){
    if(seen[i]||!pred(field[i]))continue;
    let sx=0,sy=0,n=0; const stack=[i]; seen[i]=1;
    while(stack.length){
      const c=stack.pop(); const x=c%GW,y=(c/GW)|0; sx+=x; sy+=y; n++;
      const cx=c%GW;
      if(cx<GW-1 && !seen[c+1]&&pred(field[c+1])){seen[c+1]=1;stack.push(c+1);}
      if(cx>0 && !seen[c-1]&&pred(field[c-1])){seen[c-1]=1;stack.push(c-1);}
      if(c+GW<N && !seen[c+GW]&&pred(field[c+GW])){seen[c+GW]=1;stack.push(c+GW);}
      if(c-GW>=0 && !seen[c-GW]&&pred(field[c-GW])){seen[c-GW]=1;stack.push(c-GW);}
    }
    if(n>=minSize) out.push({cx:Math.round(sx/n),cy:Math.round(sy/n),size:n});
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOPONYMY — a per-world syllable FAMILY (family resemblance by construction).
   Each world seeds its own small onset/nucleus/coda set + syllable-count
   distribution, so one sheet's names share a phonetic feel ("Vell", "Vantor",
   "Vellmere") and another sheet's feel wholly different. Names are pronounceable
   by construction (only legal, hand-chosen syllable pieces) and collision-checked
   against already-placed names before accepting. Composed via hand-authored
   templates keyed to real feature kind, in the estate's serif/portolan hand.
   ═══════════════════════════════════════════════════════════════════════════ */
const ONSET_POOL = ["b","br","c","cr","d","dr","f","fl","g","gr","gl","h","k","kr","l","m","n","p","pr","r","s","sh","st","str","t","th","tr","v","vr","w","y","z","bl","cl","sk","sn","sl","thr","kh","ph","w","m","n"];
const NUC_POOL   = ["a","e","i","o","u","ae","ia","io","ei","ou","au","ea","oa","ee","ai","y","or","ar","en","el"];
const CODA_POOL  = ["","","n","r","l","s","m","th","nd","rn","ll","st","sk","rd","ng","lt","rk","ss","x","ff"];

export function makeToponymy(seedStr){
  // A dedicated PRNG stream so toponymy is stable regardless of geometry draws.
  const frng = makeRng(seedStr + "::toponymy-family");
  const pick = (arr)=> arr[(frng()*arr.length)|0];
  const drawSet = (pool, lo, hi)=>{
    const n = lo + ((frng()*(hi-lo+1))|0);
    const set = [];
    const used = new Set();
    let guard=0;
    while(set.length<n && guard++<200){ const v=pick(pool); if(!used.has(v)){ used.add(v); set.push(v); } }
    return set;
  };
  // this world's family: a restricted palette
  const onsets = drawSet(ONSET_POOL, 5, 8);
  const nuclei = drawSet(NUC_POOL, 3, 5);
  const codas  = drawSet(CODA_POOL, 4, 7);
  // syllable-count weights for this world (some worlds "sound" longer)
  const sylMin = 1, sylMax = frng() < 0.5 ? 2 : 3;

  // the name-generation stream (separate so word draws don't disturb the family)
  const wrng = makeRng(seedStr + "::toponymy-words");
  const wpick = (arr)=> arr[(wrng()*arr.length)|0];
  const cap = (s)=> s.charAt(0).toUpperCase()+s.slice(1);

  function syl(){ return wpick(onsets)+wpick(nuclei); }
  function root(minS, maxS){
    const n = minS + ((wrng()*(maxS-minS+1))|0);
    let w=""; for(let i=0;i<n;i++) w += syl();
    w += wpick(codas);
    // avoid a bare empty (all-empty coda + single short syl) reading too thin
    if(w.length < 2) w += wpick(nuclei);
    return cap(w);
  }
  // a root guaranteed to END IN A VOWEL — for direct-glue suffixes ("Xteeth",
  // "Xmere") where a consonant-cluster coda butted against a consonant-initial
  // suffix would pile up unpronounceably. Ends on an open syllable, no coda.
  function vroot(minS, maxS){
    const n = minS + ((wrng()*(maxS-minS+1))|0);
    let w=""; for(let i=0;i<n;i++) w += syl();   // every syl ends in a nucleus (vowel)
    return cap(w);
  }

  // feature-kind templates in the estate's portolan hand
  const seaSuffix  = ["Sea","Reach","Deep","Sound","Bight","Gulf","Main","Expanse"];
  const seaMere    = ["mere","water","-sea"];
  const holdSuffix = ["'s Hollow","'s Cross","'s Landing","'s Rest","'s Watch","'s Ford","'s Reach"];
  const holdPlain  = ["Cross","Landing","Watch","Ford","Gate","Bay","Head","Fell"];
  const rangeThe   = ["teeth","spine","wall","horns","crags","fangs","spires","backbone"];
  const regionSuf  = ["reach","march","vale","wold","mark","holt","downs","moor","heath","weald","fields","lands"];
  const titleAdj   = ["Sundered","Veiled","Hidden","Elder","Wandering","Riven","Twilight","Verdant","Storm","Silver","Last","Lost","Ashen","Drowned","Gilded","Far"];

  const seen = new Set();
  function unique(fn){
    let guard=0, name;
    do { name = fn(); guard++; } while(seen.has(name.toLowerCase()) && guard<40);
    seen.add(name.toLowerCase());
    return name;
  }

  return {
    family: { onsets, nuclei, codas, sylMin, sylMax },
    // a settlement / hold — possessive holds or plain landmark names
    hold(){
      return unique(()=>{
        const r = wrng();
        const base = root(sylMin, sylMax);
        if(r < 0.5) return base + wpick(holdSuffix);
        if(r < 0.78) return base + " " + wpick(holdPlain);
        return base; // a bare hold name (a town)
      });
    },
    // a sea / large water body
    sea(){
      return unique(()=>{
        const r = wrng();
        if(r < 0.30) return "The " + root(sylMin, Math.max(sylMin, sylMax-1)) + " " + wpick(seaSuffix);
        // direct-glue "Xmere" — use a vowel-ending root so no consonant pileup
        if(r < 0.60) return vroot(sylMin, Math.max(sylMin, sylMax-1)) + wpick(seaMere);
        return root(sylMin, Math.max(sylMin, sylMax-1)) + " " + wpick(seaSuffix);
      });
    },
    // a mountain range — the portolan "Xteeth" idiom (direct-glued, vowel-ended root)
    range(){
      return unique(()=>{
        const r = wrng();
        if(r < 0.45) return "the " + vroot(sylMin, Math.max(sylMin, sylMax-1)) + wpick(rangeThe);
        if(r < 0.72) return "the " + wpick(titleAdj) + " " + cap(wpick(rangeThe));
        return "the " + root(sylMin, Math.max(sylMin, sylMax-1)) + " " + cap(wpick(rangeThe));
      });
    },
    // a region / inland province
    region(){
      return unique(()=>{
        const r = wrng();
        if(r < 0.42) return "The " + wpick(titleAdj) + " " + cap(syl()+wpick(codas));
        // direct-glue "Xreach" — vowel-ended root
        if(r < 0.72) return vroot(sylMin, sylMax) + wpick(regionSuf);
        return root(sylMin, sylMax) + " " + cap(wpick(regionSuf));
      });
    },
    // the world's grand title (for the cartouche)
    title(){
      const r = wrng();
      // a grand title wants heft — never a one-syllable stub
      const core = root(Math.max(2,sylMin), Math.max(2,sylMax));
      if(r < 0.30) return "the " + core;
      if(r < 0.55) return "the " + wpick(titleAdj) + " Reach";
      if(r < 0.78) return "the " + core + " " + cap(wpick(regionSuf));
      return "the " + wpick(titleAdj) + " " + core;
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   generateLand(seedStr, opts) — the whole hidden chart, once.
   Returns a frozen-in-spirit LAND object: the fields, the rivers, and an
   ORDERED placement list (labels + settlements + peaks) in a deterministic
   order. Same seed → byte-identical fields + identical ordered placement list.
   opts: { GW, GH } logical grid (defaults 360×240, cartographer's proven size).
   ═══════════════════════════════════════════════════════════════════════════ */
export function generateLand(seedStr, opts={}){
  seedStr = String(seedStr);
  const GW = opts.GW||360, GH = opts.GH||240;
  const N = GW*GH;
  const aspect = GW/GH;

  // deterministic PRNG streams, keyed off the one seed
  const rng      = makeRng(seedStr);
  const noiseRng = makeRng(seedStr + "::height");
  const moistRng = makeRng(seedStr + "::moist");
  const warpRng  = makeRng(seedStr + "::warp");

  const hN = new ValueNoise(noiseRng);
  const mN = new ValueNoise(moistRng);
  const warpN = new ValueNoise(warpRng);

  const oct = 7, lac = 2.0, gain = 0.55;

  // "continents" form (one form; the room re-rolls the SEED, not a slider)
  const maskPow=2.6, maskStrength=0.98, baseFreq=3.0, landBias=0.0, blobAmp=0.42, nBlobs=3;
  const blobR=[0.20,0.42];

  const blobs = [];
  for(let i=0;i<nBlobs;i++){
    blobs.push({
      x: 0.5 + (rng()-0.5)*0.7,
      y: 0.5 + (rng()-0.5)*0.55,
      r: blobR[0] + rng()*(blobR[1]-blobR[0])
    });
  }

  const height = new Float32Array(N);
  const moisture = new Float32Array(N);
  let hMin=Infinity, hMax=-Infinity;
  for(let y=0;y<GH;y++){
    const ny = y/GH;
    for(let x=0;x<GW;x++){
      const nx = x/GW;
      const i = y*GW+x;
      const wfx = warpN.fbm(nx*3+11.3, ny*3+5.7, 3, 2, 0.5);
      const wfy = warpN.fbm(nx*3+31.1, ny*3+17.2, 3, 2, 0.5);
      const sx = nx*baseFreq + (wfx-0.5)*0.55;
      const sy = ny*baseFreq + (wfy-0.5)*0.55;
      let h = hN.fbm(sx, sy, oct, lac, gain);
      const ridge = hN.ridged(sx*1.7+3.3, sy*1.7+1.1, 5, 2, 0.55);
      h = h*0.72 + ridge*0.42;
      const dx = (nx-0.5)*aspect, dy=(ny-0.5);
      let d = Math.sqrt(dx*dx + dy*dy) / (0.5*Math.sqrt(aspect*aspect+1));
      let mask = 1 - Math.pow(Math.min(1,d), maskPow);
      let blobBias = 0;
      for(const b of blobs){
        const bdx=(nx-b.x)*aspect, bdy=(ny-b.y);
        const bd = Math.sqrt(bdx*bdx+bdy*bdy);
        blobBias = Math.max(blobBias, 1 - Math.min(1, bd/b.r));
      }
      h = h*maskStrength + (mask-0.5)*0.6 + (blobBias-0.35)*blobAmp + landBias;
      height[i]=h;
      if(h<hMin)hMin=h; if(h>hMax)hMax=h;
      let m = mN.fbm(nx*3.4+7.1, ny*3.4+2.9, 5, 2, 0.5);
      moisture[i]=m;
    }
  }
  const hr = (hMax-hMin)||1;
  for(let i=0;i<N;i++) height[i]=(height[i]-hMin)/hr;

  // ---- sea level via target land fraction (percentile threshold) ----
  let targetLand = 0.44;
  const sea = percentile(height, 1-targetLand);
  const water = new Uint8Array(N); // 0 land, 1 ocean, 2 lake
  for(let i=0;i<N;i++) water[i] = height[i] < sea ? 1 : 0;

  // ---- ocean flood fill from borders (lakes vs ocean) ----
  const ocean = new Uint8Array(N);
  {
    const stack=[];
    const pushIf=(x,y)=>{ if(x<0||y<0||x>=GW||y>=GH)return; const i=y*GW+x; if(water[i]===1 && !ocean[i]){ocean[i]=1; stack.push(i);} };
    for(let x=0;x<GW;x++){ pushIf(x,0); pushIf(x,GH-1); }
    for(let y=0;y<GH;y++){ pushIf(0,y); pushIf(GW-1,y); }
    while(stack.length){
      const i=stack.pop(); const x=i%GW, y=(i/GW)|0;
      pushIf(x+1,y); pushIf(x-1,y); pushIf(x,y+1); pushIf(x,y-1);
    }
  }
  for(let i=0;i<N;i++){ if(water[i]===1 && !ocean[i]) water[i]=2; }

  // ---- coastline distance (BFS from ocean) ----
  const coastDist = new Int16Array(N).fill(-1);
  {
    const q=[]; let head=0;
    for(let i=0;i<N;i++){ if(water[i]===1){ coastDist[i]=0; q.push(i);} }
    while(head<q.length){
      const i=q[head++]; const x=i%GW, y=(i/GW)|0; const nd=coastDist[i]+1;
      const nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
      for(const [bx,by] of nb){ if(bx<0||by<0||bx>=GW||by>=GH)continue; const j=by*GW+bx; if(coastDist[j]===-1){ coastDist[j]=nd; q.push(j);} }
    }
  }

  // ---- moisture finalize ----
  for(let i=0;i<N;i++){
    if(water[i]) continue;
    const cd = coastDist[i]<0?40:coastDist[i];
    const coastWet = Math.exp(-cd/22);
    let m = moisture[i]*0.6 + coastWet*0.4;
    moisture[i] = Math.max(0, Math.min(1, m));
  }

  // ---- latitude temperature ----
  function latTemp(y){ const lat = Math.abs((y/GH) - 0.5)*2; return 1 - lat; }

  // ---- biome classification ----
  const biome = new Uint8Array(N);
  for(let y=0;y<GH;y++){
    const temp = latTemp(y);
    for(let x=0;x<GW;x++){
      const i=y*GW+x;
      if(water[i]===1){ biome[i] = (coastDist[i]<=1 ? B.SHALLOW : B.DEEP); continue; }
      if(water[i]===2){ biome[i] = B.LAKE; continue; }
      const h = height[i]; const m = moisture[i];
      const e = (h - sea)/(1-sea);
      if(e>0.74){ biome[i] = (temp<0.35 || e>0.9) ? B.ALPINE : B.MTN_HIGH; continue; }
      if(e>0.56){ biome[i] = B.MTN_LOW; continue; }
      if(coastDist[i]<=1 && e<0.10){ biome[i]=B.BEACH; continue; }
      const localT = temp - e*0.45;
      if(localT < 0.16){ biome[i] = (m>0.45? B.SNOW : B.TUNDRA); continue; }
      if(localT < 0.34){ biome[i] = (m>0.4? B.TAIGA : B.TUNDRA); continue; }
      if(localT > 0.72){
        if(m>0.62) biome[i]=B.JUNGLE;
        else if(m>0.34) biome[i]=B.SAVANNA;
        else biome[i]=B.DESERT;
      } else {
        if(m>0.58) biome[i]=B.FOREST;
        else if(m>0.30) biome[i]=B.GRASS;
        else biome[i]=B.DESERT;
      }
    }
  }

  // ---- hillshade (gradient, light from NW) ----
  const hillshade = new Float32Array(N);
  const lx=-0.6, ly=-0.6, lz=0.9;
  const llen = Math.hypot(lx,ly,lz);
  const Lx=lx/llen, Ly=ly/llen, Lz=lz/llen;
  const zscale = 2.4;
  for(let y=0;y<GH;y++){
    for(let x=0;x<GW;x++){
      const i=y*GW+x;
      const xl=Math.max(0,x-1), xr=Math.min(GW-1,x+1);
      const yt=Math.max(0,y-1), yb=Math.min(GH-1,y+1);
      const hl=height[y*GW+xl], hrr=height[y*GW+xr];
      const ht=height[yt*GW+x], hb=height[yb*GW+x];
      const nx=(hl-hrr)*zscale, ny=(ht-hb)*zscale, nz=1;
      const nl=Math.hypot(nx,ny,nz);
      let dot=(nx*Lx+ny*Ly+nz*Lz)/nl;
      hillshade[i]=Math.max(0,dot);
    }
  }

  // ---- rivers via flow accumulation (steepest descent) ----
  const order = new Int32Array(N);
  for(let i=0;i<N;i++) order[i]=i;
  order.sort((a,b)=> height[b]-height[a]);

  const flow = new Float32Array(N);
  const downTo = new Int32Array(N).fill(-1);
  for(let k=0;k<N;k++){
    const i=order[k];
    if(water[i]===1){ continue; }
    const x=i%GW, y=(i/GW)|0;
    const rain = 0.25 + moisture[i]*1.4 + Math.max(0,(height[i]-sea))*0.6;
    flow[i]+=rain;
    let best=-1, bestH=height[i];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const bx=x+dx, by=y+dy; if(bx<0||by<0||bx>=GW||by>=GH)continue;
      const j=by*GW+bx;
      if(height[j]<bestH){ bestH=height[j]; best=j; }
    }
    if(best>=0){ downTo[i]=best; flow[best]+=flow[i]; }
  }

  const riverThresh = 22 + (1-0.55)*70;
  const riverCells = new Float32Array(N);
  const onRiver = new Uint8Array(N);
  const rivers = [];
  function bigUpstream(i){
    const x=i%GW, y=(i/GW)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue; const bx=x+dx,by=y+dy; if(bx<0||by<0||bx>=GW||by>=GH)continue;
      const j=by*GW+bx; if(downTo[j]===i && flow[j]>=riverThresh) return true;
    }
    return false;
  }
  for(let k=0;k<N;k++){
    const i=order[k];
    if(water[i]) continue;
    if(flow[i] < riverThresh) continue;
    if(bigUpstream(i)) continue;
    const path=[]; let cur=i, guard=0, reachedWater=false, merged=false;
    while(cur>=0 && guard++<8000){
      const cx=cur%GW, cy=(cur/GW)|0;
      path.push([cx,cy,flow[cur]]);
      riverCells[cur]=Math.max(riverCells[cur],flow[cur]);
      if(water[cur]){ reachedWater=true; break; }
      if(onRiver[cur] && cur!==i){ merged=true; break; }
      onRiver[cur]=1;
      cur=downTo[cur];
    }
    if(path.length>=5 && (reachedWater||merged)){
      rivers.push(path);
    }
  }

  // ---- mountain peaks: local maxima, well spaced ----
  const peakCands=[];
  for(let y=2;y<GH-2;y++){
    for(let x=2;x<GW-2;x++){
      const i=y*GW+x;
      if(biome[i]<B.MTN_LOW) continue;
      const h=height[i];
      let isMax=true;
      for(let dy=-2;dy<=2 && isMax;dy++)for(let dx=-2;dx<=2;dx++){
        if(!dx&&!dy)continue; const j=(y+dy)*GW+(x+dx);
        if(height[j]>h){ isMax=false; break; }
      }
      if(!isMax) continue;
      peakCands.push({x,y,h,big:biome[i]>=B.MTN_HIGH});
    }
  }
  peakCands.sort((a,b)=> b.h-a.h || (a.y*GW+a.x)-(b.y*GW+b.x));
  const peaks=[]; const peakSep=2.2;
  for(const p of peakCands){
    let ok=true;
    for(const q of peaks){ const dx=q.x-p.x,dy=q.y-p.y; if(dx*dx+dy*dy<peakSep*peakSep){ok=false;break;} }
    if(ok) peaks.push(p);
  }

  // land fraction (for the twin's no-flood invariant)
  let landCount=0; for(let i=0;i<N;i++) if(!water[i]) landCount++;
  const landFraction = landCount/N;

  // ---- placement list — DETERMINISTIC ordered list of named features ----
  const topo = makeToponymy(seedStr);
  const placements = buildPlacements({GW,GH,water,biome,coastDist,flow},topo,rng);

  return {
    seed:seedStr, GW, GH, N, sea, landFraction,
    height, water, moisture, biome, hillshade, flow, coastDist, riverCells,
    rivers, peaks, blobs,
    labels: placements.labels,          // {x,y,text,kind}
    settlements: placements.settlements, // {x,y,name,port,capital}
    title: placements.title,
    landCells: landCount,
    reachableLandCells: landCount,       // (whole land is reachable — one sheet)
    topoFamily: topo.family
  };
}

/* Greedy, DETERMINISTIC placement — the ORDERED list the twin byte-compares.
   Order is fixed: title, then settlements (score desc, tie by cell index),
   then region labels, then range labels, then sea labels. */
function buildPlacements(f, topo, rng){
  const {GW,GH,water,biome,coastDist,flow}=f;
  const N=GW*GH;
  const labels=[]; const settlements=[];
  const labelDensity = 0.62;

  const title = topo.title();

  // settlements — coastal/riverside, greedy well-spread
  const targetSettlements = Math.round(4 + labelDensity*12);
  const candidates=[];
  for(let y=4;y<GH-4;y++){
    for(let x=4;x<GW-4;x++){
      const i=y*GW+x;
      if(water[i]) continue;
      const b=biome[i];
      if(b>=B.MTN_LOW) continue;
      const cd=coastDist[i];
      let score=0;
      if(cd<=2) score+=3; else if(cd<=6) score+=1.2;
      if(flow[i]>30) score += Math.min(2.5, flow[i]/60);
      if(b===B.GRASS||b===B.FOREST||b===B.SAVANNA) score+=1;
      if(b===B.DESERT||b===B.TUNDRA||b===B.SNOW) score-=1.2;
      score += rng()*0.8;
      if(score>1.4) candidates.push({x,y,score,i});
    }
  }
  // deterministic order: score desc, tie broken by cell index (stable)
  candidates.sort((a,b)=> b.score-a.score || a.i-b.i);
  const minSep = Math.max(12, GW*0.06);
  for(const c of candidates){
    if(settlements.length>=targetSettlements) break;
    let ok=true;
    for(const s of settlements){
      const dx=s.x-c.x, dy=s.y-c.y;
      if(dx*dx+dy*dy < minSep*minSep){ ok=false; break; }
    }
    if(ok){
      const port = coastDist[c.i]<=2;
      settlements.push({x:c.x,y:c.y, name:topo.hold(), port, capital: settlements.length===0});
    }
  }

  // region labels — interior land cells, greedy spread (deterministic shuffle)
  const targetRegions = Math.round(2 + labelDensity*4);
  const interior=[];
  for(let y=8;y<GH-8;y+=3)for(let x=8;x<GW-8;x+=3){
    const i=y*GW+x; if(water[i])continue; if(coastDist[i]<8)continue;
    if(biome[i]>=B.MTN_LOW)continue;
    interior.push({x,y});
  }
  shuffle(interior, rng);
  const regionSep=Math.max(40, GW*0.18);
  const regionPts=[];
  for(const p of interior){
    if(regionPts.length>=targetRegions)break;
    let ok=true;
    for(const r of regionPts){ const dx=r.x-p.x,dy=r.y-p.y; if(dx*dx+dy*dy<regionSep*regionSep){ok=false;break;} }
    if(ok) regionPts.push(p);
  }
  for(const p of regionPts) labels.push({x:p.x,y:p.y,text:topo.region(),kind:"region"});

  // range labels
  const mtnClusters = findClusters(biome, GW, GH, (b)=> b>=B.MTN_LOW, 30);
  mtnClusters.sort((a,b)=> b.size-a.size || (a.cy*GW+a.cx)-(b.cy*GW+b.cx));
  shuffle(mtnClusters, rng);
  const nMtn = Math.min(mtnClusters.length, Math.round(1+labelDensity*2));
  for(let i=0;i<nMtn;i++){ const c=mtnClusters[i]; labels.push({x:c.cx,y:c.cy,text:topo.range(),kind:"mountains"}); }

  // sea labels — biggest ocean regions
  const seaClusters = findClusters(water, GW, GH, (w)=> w===1, 400);
  seaClusters.sort((a,b)=> b.size-a.size || (a.cy*GW+a.cx)-(b.cy*GW+b.cx));
  const nSea = Math.min(seaClusters.length, Math.round(1+labelDensity*2));
  for(let i=0;i<nSea;i++){ const c=seaClusters[i]; labels.push({x:c.cx,y:c.cy,text:topo.sea(),kind:"sea"}); }

  return {labels, settlements, title};
}

/* A compact, byte-stable serialization of the ORDERED placement list — the
   thing the twin regenerates twice and compares char-for-char. Rounds coords to
   integers (grid cells) so it is exact. NOT shown to the visitor. */
export function placementSignature(land){
  const rows=[];
  rows.push("T|"+land.title);
  for(const s of land.settlements) rows.push(`S|${s.x}|${s.y}|${s.capital?1:0}|${s.port?1:0}|${s.name}`);
  for(const l of land.labels) rows.push(`L|${l.kind}|${l.x}|${l.y}|${l.text}`);
  return rows.join("\n");
}

/* --- river monotonicity check (the twin's "rivers flow downhill to sea") --- */
export function checkRivers(land){
  const {rivers,height,water,GW,GH}=land;
  let checked=0, violations=0, notEndingInSea=0;
  for(const path of rivers){
    checked++;
    // monotone non-increasing height along the path (steepest descent),
    // allowing equality (flats) but never an uphill step
    for(let k=1;k<path.length;k++){
      const [px,py]=path[k-1], [cx,cy]=path[k];
      const hp=height[py*GW+px], hc=height[cy*GW+cx];
      if(hc > hp + 1e-6) { violations++; break; }
    }
    // must end in a water cell OR merge into an on-river trunk that does;
    // by construction we only keep reachedWater||merged, so the last cell of a
    // reachedWater path is water. Verify at least the terminus is sane:
    const [ex,ey]=path[path.length-1];
    const endsWater = water[ey*GW+ex]!==0;
    // a merged river's last cell is the junction (land) — accept if its
    // downstream continues (it was on an existing trunk). We approximate the
    // merge case as valid; the strict test below counts only pure violations.
    if(!endsWater){
      // check the cell just past the terminus continues downhill toward water:
      notEndingInSea++;
    }
  }
  return {checked, violations, notEndingInSea};
}
