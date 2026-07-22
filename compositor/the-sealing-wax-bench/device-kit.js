/* device-kit.js — the Blazon cross-pollination (browser-only). The estate already
   engraves heraldic charges in blazon/index.html; a signet press should draw from
   the same well. This module LIFTS a curated subset of Blazon's shipped
   drawCharge() builders VERBATIM and rasterises each to the coverage MASK shape
   dieFromMask() consumes — so a Blazon crest and a wax seal are literally the same
   device vocabulary. It provides the live picker's rich menu.

   ONE-WAY: device-kit produces {N,data} masks; it NEVER imports seal-core. A
   device-kit seal is deterministic given (charge id, seed), so it re-derives
   identically on reload.

   PROVENANCE — lifted VERBATIM from blazon/index.html @ 2026-07 (cite the lines so
   an evolution there is auditable; device-kit.drift.test.mjs greps for the
   drawCharge signature + each lifted `case`):
     drawCharge(name,R,fill,style)   blazon/index.html:1138
     chargeStroke(style)             :1132     starPath(...)          :1205
     estoilePath(...)                :1216     crossletPath()        :1228
     crossFormyPath()                :1243     trefoilPath()         :1251
     fleurPath(F,SK)                 :1281     rosePath(...)         :1302
     escallopPath(F,SK)              :1322     SKcolor(SK)           :1342
     lionRampant(F,SK)               :1344     tower(F,SK,st)        :1402
     darken(F)                       :1416     keyCharge(F,SK)       :1417
     crescentPathReal(R)             :1466     roundel/mullet/…      (drawCharge cases)
   The no-fork ideal (forge:include ONE kit into both Blazon and here) is a deferred
   follow-on — integrator's call, not this ship. Until then this drift-test is the
   guard: if Blazon changes a lifted builder, the test flags the fork.
   ========================================================================== */
(function(root){
'use strict';

/* ----- lifted VERBATIM from blazon/index.html ----- */
function chargeStroke(style){
  if(style==="engraved") return { c:"#1c1813", w:1.4 };
  if(style==="modern")   return { c:"none", w:0 };
  if(style==="stone")    return { c:"#6f6c64", w:0.9 };
  return { c:"#2a1c06", w:1.4 }; // illuminated: fine dark outline
}
function SKcolor(SK){ const m=SK.match(/stroke="([^"]+)"/); return m?m[1]:"#2a1c06"; }
function darken(F){ return "#3a2a10"; }
function starPath(points, rOuter, rInner, startDeg){
  let d="";
  const start = (startDeg||-90)*Math.PI/180;
  for(let i=0;i<points*2;i++){
    const r = (i%2===0)?rOuter:rInner;
    const a = start + i*Math.PI/points;
    const px=(Math.cos(a)*r).toFixed(2), py=(Math.sin(a)*r).toFixed(2);
    d += (i===0?"M":"L")+px+","+py+" ";
  }
  return d+"Z";
}
function estoilePath(rays, rOuter, rInner){
  let d=""; const n=rays*2;
  for(let i=0;i<n;i++){
    const r=(i%2===0)?rOuter:rInner;
    const a=-Math.PI/2 + i*Math.PI/rays;
    const px=(Math.cos(a)*r).toFixed(2), py=(Math.sin(a)*r).toFixed(2);
    d+=(i===0?"M":"L")+px+","+py+" ";
  }
  return d+"Z";
}
function crossletPath(){
  const a=8, L=46, e=16, t=5;
  let d=`M${-a},${-L} L${a},${-L} L${a},${-a} L${L},${-a} L${L},${a} L${a},${a} L${a},${L} L${-a},${L} L${-a},${a} L${-L},${a} L${-L},${-a} L${-a},${-a} Z`;
  d+=` M${-e},${-L-2*t} L${e},${-L-2*t} L${e},${-L} L${-e},${-L} Z`;
  d+=` M${-e},${L} L${e},${L} L${e},${L+2*t} L${-e},${L+2*t} Z`;
  d+=` M${-L-2*t},${-e} L${-L-2*t},${e} L${-L},${e} L${-L},${-e} Z`;
  d+=` M${L},${-e} L${L+2*t},${-e} L${L+2*t},${e} L${L},${e} Z`;
  return d;
}
function crossFormyPath(){
  const w=10, L=48, fl=26;
  return `M${-w},${-w} L${-w},${-L} L${-fl},${-L} L0,${-L*0.78} L${fl},${-L} L${w},${-L} L${w},${-w}
          L${L},${-w} L${L},${-fl} L${L*0.78},0 L${L},${fl} L${L},${w} L${w},${w}
          L${w},${L} L${fl},${L} L0,${L*0.78} L${-fl},${L} L${-w},${L} L${-w},${w}
          L${-L},${w} L${-L},${fl} L${-L*0.78},0 L${-L},${-fl} L${-L},${-w} Z`;
}
function trefoilPath(){
  const lr=20;
  return `M0,${-lr*1.4} m${-lr},0 a${lr},${lr} 0 1,0 ${2*lr},0 a${lr},${lr} 0 1,0 ${-2*lr},0 Z`
       + ` M${-lr*0.9},${lr*0.4} m${-lr},0 a${lr},${lr} 0 1,0 ${2*lr},0 a${lr},${lr} 0 1,0 ${-2*lr},0 Z`
       + ` M${lr*0.9},${lr*0.4} m${-lr},0 a${lr},${lr} 0 1,0 ${2*lr},0 a${lr},${lr} 0 1,0 ${-2*lr},0 Z`;
}
function fleurPath(F, SK){
  const clean=`M0,-50 C6,-42 6,-30 0,-24 C-6,-30 -6,-42 0,-50 Z
    M0,-22 C16,-34 40,-20 30,4 C40,-2 44,-22 30,-30
    C50,-24 52,2 32,12 C20,18 8,14 2,8
    M0,-22 C-16,-34 -40,-20 -30,4 C-40,-2 -44,-22 -30,-30
    C-50,-24 -52,2 -32,12 C-20,18 -8,14 -2,8
    M-10,6 L10,6 L9,30 L16,30 L16,40 L-16,40 L-16,30 L-9,30 Z`;
  const bar=`M-20,4 L20,4 L20,13 L-20,13 Z`;
  return `<path d="${clean}"${F}${SK}/><path d="${bar}"${F}${SK}/>`;
}
function rosePath(F, SK, st, fill){
  let petals="";
  for(let i=0;i<5;i++){
    const a=-Math.PI/2 + i*2*Math.PI/5;
    const cx=Math.cos(a)*22, cy=Math.sin(a)*22;
    petals += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="20"${F}${SK}/>`;
  }
  let s = `<g>${petals}</g>`;
  s += `<circle cx="0" cy="0" r="16"${F}${SK}/>`;
  if(st.c!=="none"){
    s += `<circle cx="0" cy="0" r="9" fill="#d4af37" stroke="${st.c}" stroke-width="1"/>`;
    for(let i=0;i<5;i++){
      const a=-Math.PI/2+i*2*Math.PI/5;
      s += `<circle cx="${(Math.cos(a)*5).toFixed(1)}" cy="${(Math.sin(a)*5).toFixed(1)}" r="1.6" fill="${st.c}"/>`;
    }
  }
  return s;
}
function escallopPath(F, SK){
  const d=`M0,38
    C -34,38 -46,6 -42,-14
    C -40,-22 -34,-26 -30,-20
    C -28,-26 -20,-28 -16,-22
    C -14,-28 -6,-30 -2,-22
    C 0,-30 8,-30 10,-22
    C 14,-28 22,-26 24,-20
    C 28,-26 34,-22 36,-14
    C 40,6 30,38 0,38 Z`;
  let s=`<path d="${d}"${F}${SK}/>`;
  if(SK!==""){
    for(let i=-2;i<=2;i++){
      s += `<path d="M0,32 L${(i*11)},-16" fill="none" stroke="${SKcolor(SK)}" stroke-width="1.1"/>`;
    }
  }
  return s;
}
function lionRampant(F, SK){
  const d=`M-28,46
    L-30,18 C-34,8 -30,-2 -24,-6
    C-30,-14 -28,-26 -20,-30
    C-26,-36 -22,-46 -14,-46
    C-16,-40 -12,-38 -8,-40
    C-6,-46 2,-48 4,-42
    C8,-46 14,-42 12,-36
    C18,-36 20,-30 16,-26
    C22,-24 24,-16 18,-12
    C24,-8 22,2 14,2
    L20,10 C26,8 30,14 26,18
    L22,26 L30,30 L26,36 L20,32
    L24,46 L12,46 L10,30 C6,34 -2,34 -6,30
    L-6,46 Z`;
  const tail=`M-28,28 C-44,24 -48,4 -40,-8 C-46,2 -42,18 -30,20 Z`;
  return `<g transform="translate(2,0)"><path d="${d}"${F}${SK}/><path d="${tail}"${F}${SK}/></g>`;
}
function tower(F, SK, st){
  const body=`M-30,46 L-30,-14 L-22,-14 L-22,-22 L-14,-22 L-14,-14 L-7,-14 L-7,-22 L7,-22 L7,-14 L14,-14 L14,-22 L22,-22 L22,-14 L30,-14 L30,46 Z`;
  let s=`<path d="${body}"${F}${SK}/>`;
  const dc = SKcolor(SK);
  s += `<path d="M-9,46 L-9,18 C-9,8 9,8 9,18 L9,46 Z" fill="${st.c==="none"?darken(F):dc}"${SK}/>`;
  if(st.c!=="none"){
    s += `<rect x="-19" y="2" width="7" height="11" rx="1" fill="${dc}"/>`;
    s += `<rect x="12" y="2" width="7" height="11" rx="1" fill="${dc}"/>`;
  }
  return s;
}
function keyCharge(F, SK){
  const bow=`M0,-44 m-16,0 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0 Z m16,-9 a9,9 0 1,1 -0.01,0 Z`;
  const shaft=`M-5,-28 L5,-28 L5,30 L-5,30 Z`;
  const wards=`M5,14 L18,14 L18,22 L5,22 Z M5,26 L14,26 L14,34 L-5,34 L-5,30 L5,30 Z`;
  return `<path d="${bow}"${F}${SK} fill-rule="evenodd"/><path d="${shaft}"${F}${SK}/><path d="${wards}"${F}${SK}/>`;
}
function crescentPathReal(R){
  const r=R, off=R*0.52, ir=R*0.92;
  return `M0,${r} A${r},${r} 0 1,1 0,${-r} A${ir},${ir} 0 1,0 0,${r} Z`;
}

// drawCharge — lifted from blazon/index.html:1138, curated to the signet subset.
function drawCharge(name, R, fill, style){
  const st = chargeStroke(style);
  const SK = st.c==="none" ? "" : ` stroke="${st.c}" stroke-width="${st.w}" stroke-linejoin="round"`;
  const F = ` fill="${fill}"`;
  const k = R/50;
  const open = `<g transform="scale(${k.toFixed(4)})">`;
  const close = `</g>`;
  let body="";
  switch(name){
    case "roundel":     body = `<circle cx="0" cy="0" r="42"${F}${SK}/>`; break;
    case "lozenge":     body = `<path d="M0,-48 L34,0 L0,48 L-34,0 Z"${F}${SK}/>`; break;
    case "mullet":      body = `<path d="${starPath(5,46,19,-90)}"${F}${SK}/>`; break;
    case "estoile":     body = `<path d="${estoilePath(6,48,16)}"${F}${SK}/>`; break;
    case "crescent":    body = `<path d="${crescentPathReal(44)}"${F}${SK} fill-rule="evenodd"/>`; break;
    case "fleur-de-lis":body = fleurPath(F, SK); break;
    case "rose":        body = rosePath(F, SK, st, fill); break;
    case "trefoil":     body = `<path d="${trefoilPath()}"${F}${SK}/>` + `<rect x="-3" y="20" width="6" height="26"${F}${SK}/>`; break;
    case "escallop":    body = escallopPath(F, SK); break;
    case "crosslet":    body = `<path d="${crossletPath()}"${F}${SK}/>`; break;
    case "cross formy": body = `<path d="${crossFormyPath()}"${F}${SK}/>`; break;
    case "lion":        body = lionRampant(F, SK); break;
    case "tower":       body = tower(F, SK, st); break;
    case "key":         body = keyCharge(F, SK); break;
    default:            body = `<circle r="40"${F}${SK}/>`;
  }
  return open + body + close;
}

/* ----- the picker's menu: charges that read as a signet at seal resolution ----- */
var DEVICES = [
  { id:'blazon:roundel',      name:'roundel',      label:'Roundel' },
  { id:'blazon:cross formy',  name:'cross formy',  label:'Cross formy' },
  { id:'blazon:crosslet',     name:'crosslet',     label:'Cross crosslet' },
  { id:'blazon:mullet',       name:'mullet',       label:'Mullet (star)' },
  { id:'blazon:estoile',      name:'estoile',      label:'Estoile' },
  { id:'blazon:crescent',     name:'crescent',     label:'Crescent' },
  { id:'blazon:lozenge',      name:'lozenge',      label:'Lozenge' },
  { id:'blazon:fleur-de-lis', name:'fleur-de-lis', label:'Fleur-de-lis' },
  { id:'blazon:rose',         name:'rose',         label:'Rose' },
  { id:'blazon:trefoil',      name:'trefoil',      label:'Trefoil' },
  { id:'blazon:escallop',     name:'escallop',     label:'Escallop' },
  { id:'blazon:lion',         name:'lion',         label:"Lion rampant" },
  { id:'blazon:tower',        name:'tower',        label:'Tower' },
  { id:'blazon:key',          name:'key',          label:'Key' }
];

// an SVG data-URI for a charge (white silhouette, no stroke — a coverage mask)
function chargeSVG(name){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120">`
       + `<g fill="#ffffff">${drawCharge(name, 50, '#ffffff', 'modern')}</g></svg>`;
}

// rasterizeToMask(name, N) → Promise<{N,data:Float32Array}> — draw the charge SVG
// into an offscreen N×N canvas, read alpha/255 as coverage. The SAME {N,data}
// shape dieFromMask() consumes.
function rasterizeToMask(name, N){
  return new Promise((resolve)=>{
    const svg=chargeSVG(name);
    const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const img=new Image();
    img.onload=function(){
      const cv=document.createElement('canvas'); cv.width=N; cv.height=N;
      const cx=cv.getContext('2d');
      // fit the 120-unit viewBox to N with a small inset so the charge never clips
      cx.clearRect(0,0,N,N);
      cx.drawImage(img, N*0.06, N*0.06, N*0.88, N*0.88);
      const px=cx.getImageData(0,0,N,N).data;
      const data=new Float32Array(N*N);
      for(let i=0;i<N*N;i++) data[i]=px[i*4+3]/255;
      resolve({N, data});
    };
    img.onerror=function(){ resolve({N, data:new Float32Array(N*N)}); };
    img.src=url;
  });
}
// a tiny thumbnail SVG data-URI for the picker menu (burgundy on transparent)
function thumbURI(name){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120">`
    + `<g fill="#c98">${drawCharge(name, 50, '#c98', 'modern')}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}

var DeviceKit = { DEVICES, drawCharge, chargeSVG, rasterizeToMask, thumbURI,
  chargeStroke, SKcolor };
if (typeof module !== 'undefined' && module.exports) { module.exports = DeviceKit; }
root.DeviceKit = DeviceKit;
})(typeof window!=='undefined' ? window : globalThis);
