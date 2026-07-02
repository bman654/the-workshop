/* ═══════════════════════════════════════════════════════════════════════════
   THE CARTOGRAPHER'S DREAM — land-render.mjs
   Renders the HIDDEN LAND (from core.mjs generateLand) ONCE per seed onto an
   offscreen canvas as a warm sepia ANTIQUE CHART. The lantern in the page only
   changes VISIBILITY through a mask — this canvas is drawn a single time and
   never redrawn while you explore. So exploring is cheap: the expensive chart
   is pre-baked; per-frame we only recompute the fog mask + frontier bloom.

   The chart is WARM parchment/sepia so that, revealed through the cool "un-inked
   vellum" fog, the contrast reads as an old sheet glowing under a lantern.

   API (installed on window for the page module; also importable for tests):
     renderLand(land, W, H, {nib}) -> { canvas, place(gx,gy), toScreen, sx, sy,
                                        mapX, mapY, mapW, mapH,
                                        labelLayout: [...],   // placed labels
                                        settleLayout: [...] } // placed settlements
   `nib` ∈ {'fine','bold'} chooses the DRAWING HAND (line weights / stipple),
   never the land. The label/settlement layout is returned so the page can drive
   the "names letter themselves in" beat against the SAME placed geometry.
   ═══════════════════════════════════════════════════════════════════════════ */
import { B, makeRng } from './core.mjs';

/* the warm antique-chart palette (sepia on aged vellum) */
const PAL = {
  paper: ["#e9d8b0", "#ddc79a"],
  deepOcean:"#c9d2b4", shallow:"#d6dcbe", lake:"#cdd6b6",
  beach:"#e6d4a6",
  grassland:"#d2c68a", forest:"#a9bd76", jungle:"#8fae62", savanna:"#d6c47e",
  desert:"#e6d296", taiga:"#a3b47c", tundra:"#c7c396", snow:"#efe8d2",
  mountainLow:"#c1aa76", mountainHigh:"#a88b5c", alpine:"#e7dfc7",
  coast:"#5a4526", river:"#6a5433", riverInk:"#4e3d22",
  ink:"#4a3718", inkSoft:"rgba(74,55,24,0.55)", label:"#3a2a12",
  seaLabel:"#6a5a3a", frameFill:"#f2e6c6",
  hill:0.55, hillCol:[70,50,22],
  waterHatch:"rgba(120,110,80,0.4)"
};

function clamp255(v){ return v<0?0:v>255?255:v; }
function boundary(a,b){
  if(a===0 && b===1) return true;
  if(a===2 && b===1) return true;
  if(a===0 && b===2) return true;
  return false;
}
function overlap(a,b){ return !(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y); }

/* one cached paper-grain tile (deterministic) */
let _grain=null;
function grainTile(){
  if(_grain) return _grain;
  _grain=document.createElement('canvas'); _grain.width=_grain.height=200;
  const g=_grain.getContext('2d'); const im=g.createImageData(200,200); const d=im.data;
  const gr=makeRng("dream-paper-grain");
  for(let i=0;i<200*200;i++){ const v=(gr()*255)|0; const j=i*4; d[j]=d[j+1]=d[j+2]=v; d[j+3]=255; }
  g.putImageData(im,0,0); return _grain;
}

export function renderLand(land, W, H, opts={}){
  const nib = opts.nib==='bold' ? 'bold' : 'fine';
  const {GW,GH,biome,height,hillshade,water,sea,coastDist,rivers,peaks,
         labels,settlements}=land;

  // fit the chart into the sheet with a margin, preserving grid aspect
  const margin = Math.round(Math.min(W,H)*0.045);
  const availW = W-margin*2, availH = H-margin*2;
  const gridAspect = GW/GH, availAspect = availW/availH;
  let mapW, mapH;
  if(availAspect > gridAspect){ mapH=availH; mapW=mapH*gridAspect; }
  else { mapW=availW; mapH=mapW/gridAspect; }
  const mapX = Math.round((W-mapW)/2), mapY = Math.round((H-mapH)/2);
  const sx = mapW/GW, sy = mapH/GH;
  const gx = (cx)=> mapX+cx*sx, gy=(cy)=> mapY+cy*sy;
  const toScreen = (cx,cy)=> [mapX+cx*sx, mapY+cy*sy];

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ---- biome raster onto a GW×GH image, hillshaded, then scaled up ----
  const terr = document.createElement('canvas'); terr.width=GW; terr.height=GH;
  const tctx = terr.getContext('2d');
  const img = tctx.createImageData(GW,GH); const d=img.data;
  const biomeHex=[PAL.deepOcean,PAL.shallow,PAL.lake,PAL.beach,PAL.grassland,PAL.forest,
    PAL.jungle,PAL.savanna,PAL.desert,PAL.taiga,PAL.tundra,PAL.snow,
    PAL.mountainLow,PAL.mountainHigh,PAL.alpine];
  const cache={};
  const hex=(h)=>{ if(cache[h])return cache[h]; const n=parseInt(h.slice(1),16); const o=[(n>>16)&255,(n>>8)&255,n&255]; cache[h]=o; return o; };
  const reliefK=PAL.hill, [hr_,hg_,hb_]=PAL.hillCol;
  for(let i=0;i<GW*GH;i++){
    let c=hex(biomeHex[biome[i]]); let r=c[0],g=c[1],b=c[2];
    if(!water[i]){
      const hs=hillshade[i]; const shade=(hs-0.5)*2; const t=shade*reliefK;
      if(t<0){ const a=-t; r=clamp255(r*(1-a)+hr_*a); g=clamp255(g*(1-a)+hg_*a); b=clamp255(b*(1-a)+hb_*a); }
      else { const a=t*0.8; r=clamp255(r+(255-r)*a); g=clamp255(g+(255-g)*a); b=clamp255(b+(255-b)*a); }
    }
    const j=i*4; d[j]=r; d[j+1]=g; d[j+2]=b; d[j+3]=255;
  }
  tctx.putImageData(img,0,0);

  // paper backdrop + smoothed land
  const pg=ctx.createLinearGradient(mapX,mapY,mapX,mapY+mapH);
  pg.addColorStop(0,PAL.paper[0]); pg.addColorStop(1,PAL.paper[1]);
  ctx.fillStyle=pg; ctx.fillRect(mapX,mapY,mapW,mapH);
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(terr, mapX, mapY, mapW, mapH);

  // water hatching near coasts (engraving feel)
  ctx.save(); ctx.beginPath(); ctx.rect(mapX,mapY,mapW,mapH); ctx.clip();
  ctx.strokeStyle=PAL.waterHatch; ctx.lineWidth=Math.max(0.4, sx*0.14);
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){
    const i=y*GW+x; if(water[i]!==1)continue; const cd=coastDist[i];
    if(cd<1||cd>5)continue; if(((x+y)%3)!==0)continue;
    const px=mapX+x*sx, py=mapY+y*sy; ctx.globalAlpha=(6-cd)/10;
    ctx.beginPath(); ctx.moveTo(px,py+sy*0.5); ctx.lineTo(px+sx*0.85,py+sy*0.5); ctx.stroke();
  }
  ctx.globalAlpha=1; ctx.restore();

  // paper grain
  ctx.save(); ctx.beginPath(); ctx.rect(mapX,mapY,mapW,mapH); ctx.clip();
  ctx.globalCompositeOperation='overlay'; ctx.globalAlpha=0.08;
  ctx.fillStyle=ctx.createPattern(grainTile(),'repeat'); ctx.fillRect(mapX,mapY,mapW,mapH);
  ctx.restore();

  // ---- coastlines ----
  const coastLW = (nib==='bold'? 0.72:0.5);
  ctx.save(); ctx.strokeStyle=PAL.coast; ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.lineWidth=Math.max(0.7, Math.min(sx,sy)*coastLW); ctx.beginPath();
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){
    const i=y*GW+x; if(water[i]!==0 && water[i]!==2) continue;
    const px=mapX+x*sx, py=mapY+y*sy;
    if(x+1<GW && boundary(water[i],water[i+1])){ ctx.moveTo(px+sx,py); ctx.lineTo(px+sx,py+sy); }
    if(x>0 && boundary(water[i],water[i-1])){ ctx.moveTo(px,py); ctx.lineTo(px,py+sy); }
    if(y+1<GH && boundary(water[i],water[i+GW])){ ctx.moveTo(px,py+sy); ctx.lineTo(px+sx,py+sy); }
    if(y>0 && boundary(water[i],water[i-GW])){ ctx.moveTo(px,py); ctx.lineTo(px+sx,py); }
  }
  ctx.stroke(); ctx.restore();

  // ---- rivers ----
  if(rivers.length){
    ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
    let maxF=1; for(const r of rivers){ const f=r[r.length-1][2]; if(f>maxF)maxF=f; }
    const widthK = nib==='bold'? 2.0:1.6;
    for(const path of rivers){
      if(path.length<2)continue;
      const pts=path.map(p=>({x:mapX+(p[0]+0.5)*sx,y:mapY+(p[1]+0.5)*sy,f:p[2]}));
      for(let i=0;i<pts.length-1;i++){
        const a=pts[i],b=pts[i+1]; const p0=pts[i-1]||a,p3=pts[i+2]||b;
        const c1x=a.x+(b.x-p0.x)/6,c1y=a.y+(b.y-p0.y)/6;
        const c2x=b.x-(p3.x-a.x)/6,c2y=b.y-(p3.y-a.y)/6;
        ctx.lineWidth=Math.max(0.55,0.5+Math.sqrt(a.f/maxF)*sx*widthK);
        ctx.strokeStyle=PAL.riverInk; ctx.globalAlpha=0.9;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.bezierCurveTo(c1x,c1y,c2x,c2y,b.x,b.y); ctx.stroke();
      }
    }
    ctx.globalAlpha=1; ctx.restore();
  }

  // ---- mountain glyphs (hand-drawn, back-to-front) ----
  if(peaks.length){
    ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
    const u=Math.min(sx,sy); const ink=PAL.ink;
    const lit=PAL.frameFill, shadeC="rgba(70,52,24,0.42)";
    const sorted=peaks.slice().sort((a,b)=>a.y-b.y);
    for(const p of sorted){
      const px=mapX+(p.x+0.5)*sx, py=mapY+(p.y+0.5)*sy;
      const s=u*(p.big?3.0:2.1); const hgt=s*(p.big?1.35:1.1);
      const baseY=py+s*0.42, apexY=py-hgt+s*0.42, apexX=px; const ridgeX=px-s*0.16;
      ctx.beginPath(); ctx.moveTo(px-s,baseY); ctx.lineTo(apexX,apexY); ctx.lineTo(ridgeX,baseY); ctx.closePath();
      ctx.fillStyle=lit; ctx.globalAlpha=0.9; ctx.fill();
      ctx.beginPath(); ctx.moveTo(ridgeX,baseY); ctx.lineTo(apexX,apexY); ctx.lineTo(px+s,baseY); ctx.closePath();
      ctx.fillStyle=shadeC; ctx.globalAlpha=0.85; ctx.fill();
      ctx.globalAlpha=0.8; ctx.strokeStyle=ink; ctx.lineWidth=Math.max(0.5,u*(nib==='bold'?0.5:0.4));
      ctx.beginPath(); ctx.moveTo(px-s,baseY); ctx.lineTo(apexX,apexY); ctx.lineTo(px+s,baseY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(apexX,apexY); ctx.lineTo(ridgeX,baseY); ctx.stroke();
      if(p.big){
        const capY=apexY+hgt*0.30;
        ctx.beginPath(); ctx.moveTo(apexX,apexY);
        ctx.lineTo(apexX-(apexX-(px-s))*((capY-apexY)/(baseY-apexY)),capY);
        ctx.lineTo(ridgeX-(ridgeX-apexX)*0.4,capY-hgt*0.04);
        ctx.lineTo(apexX+(px+s-apexX)*((capY-apexY)/(baseY-apexY))*0.55,capY);
        ctx.closePath(); ctx.fillStyle="#f4efe0"; ctx.globalAlpha=0.92; ctx.fill();
      }
    }
    ctx.globalAlpha=1; ctx.restore();
  }

  // ---- settlement dots (drawn now; names are traced in by the page) ----
  const settleLayout=[];
  ctx.save();
  for(const st of settlements){
    const px=gx(st.x+0.5), py=gy(st.y+0.5);
    const r=st.capital? Math.max(4,Math.min(sx,sy)*2.4):Math.max(2.6,Math.min(sx,sy)*1.7);
    ctx.beginPath(); ctx.fillStyle=PAL.frameFill; ctx.globalAlpha=0.85; ctx.arc(px,py,r+1.6,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
    if(st.capital){
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fillStyle=PAL.ink; ctx.fill();
      ctx.beginPath(); ctx.arc(px,py,r*0.45,0,Math.PI*2); ctx.fillStyle=PAL.frameFill; ctx.fill();
    } else { ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fillStyle=PAL.ink; ctx.fill(); }
    settleLayout.push({x:px, y:py, name:st.name, capital:st.capital, port:st.port, anchorCX:st.x, anchorCY:st.y});
  }
  ctx.restore();

  // ---- LABEL LAYOUT — placed here (greedy overlap avoidance), but the TEXT is
  //      NOT drawn onto the chart. The page traces each label in as its anchor
  //      cell is lit. We return the resolved geometry so the trace matches. ----
  const placed=[]; const labelLayout=[];
  const measurer = ctx; // reuse for measureText

  function sizeFor(kind){
    if(kind==='sea')       return {size:Math.max(13,Math.min(W,H)*0.028), font:'italic', family:'serif', color:PAL.seaLabel, letter:2.2, region:false};
    if(kind==='region')    return {size:Math.max(12,Math.min(W,H)*0.022), font:'', family:'serif', color:PAL.label, letter:2.6, region:true};
    if(kind==='mountains') return {size:Math.max(10,Math.min(W,H)*0.016), font:'italic', family:'serif', color:PAL.label, letter:1.4, region:false};
    return {size:Math.max(9,Math.min(W,H)*0.014), font:'', family:'serif', color:PAL.label, letter:0.6, region:false};
  }

  // settlement name labels (anchor at the dot)
  for(const st of settleLayout){
    const spec=sizeFor('settlement');
    const size=st.capital? spec.size*1.18 : spec.size;
    measurer.font=`${size}px ${spec.family}`;
    const tw=measurer.measureText(st.name).width + spec.letter*(st.name.length-1);
    const th=size*1.1;
    const cands=[[7,0,'left'],[-7,0,'right'],[0,-th,'center'],[0,th,'center'],[9,-th*0.6,'left']];
    let done=false;
    for(const [ox,oy,al] of cands){
      let lx=st.x+ox, ly=st.y+oy, left = al==='center'? lx-tw/2 : al==='right'? lx-tw : lx;
      const box={x:left-2,y:ly-th/2-1,w:tw+4,h:th+2};
      if(box.x<mapX+4||box.x+box.w>mapX+mapW-4||box.y<mapY+4||box.y+box.h>mapY+mapH-4) continue;
      if(placed.some(p=>overlap(box,p))) continue;
      placed.push(box);
      labelLayout.push({kind:'settlement', text:st.name, x:lx, y:ly, align:al, size, letter:spec.letter,
        font:spec.font, family:spec.family, color:spec.color, anchorCX:st.anchorCX, anchorCY:st.anchorCY,
        capital:st.capital, region:false});
      done=true; break;
    }
    // if it can't be placed, drop the name (dot remains) — never overlap
  }

  // area labels (region / mountains / sea) — anchored at the feature centroid
  for(const l of labels){
    const spec=sizeFor(l.kind);
    const size=spec.size;
    measurer.font=`${spec.font?spec.font+' ':''}${size}px ${spec.family}`;
    const tw=measurer.measureText(l.text).width + spec.letter*(l.text.length-1);
    const th=size*1.1;
    const cx=gx(l.x+0.5), cy=gy(l.y+0.5);
    const box={x:cx-tw/2-3,y:cy-th/2-2,w:tw+6,h:th+4};
    if(box.x<mapX+3||box.x+box.w>mapX+mapW-3||box.y<mapY+3||box.y+box.h>mapY+mapH-3) {
      // nudge inward if slightly off, else skip
      continue;
    }
    if(placed.some(p=>overlap(box,p))) continue;
    placed.push(box);
    labelLayout.push({kind:l.kind, text:l.text, x:cx, y:cy, align:'center', size, letter:spec.letter,
      font:spec.font, family:spec.family, color:spec.color, anchorCX:l.x, anchorCY:l.y, region:spec.region});
  }

  return { canvas, place:(cx,cy)=>[gx(cx),gy(cy)], toScreen, sx, sy,
           mapX, mapY, mapW, mapH, PAL, labelLayout, settleLayout };
}

if(typeof window!=='undefined'){ window.DreamLandRender = renderLand; window.DreamPAL = PAL; }
