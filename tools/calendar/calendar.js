/* calendar.js — THE LIVING CALENDAR's core: the estate's sense of the date.
   Solar-λ season + computed waypoints (the proven dial.js sun) · hour
   register · seeds · the authored dressing · anniversaries (decorate, never
   gate) · momentManifest (the score's one input). PURE: no clock/PRNG-
   global/storage/DOM reads; the Hours core is INJECTED; exactly TWO Date
   constructions (jdOfLocalNoon, nextHour's rollover), integer params in.
   Dual-use IIFE: `Calendar` browser global / module export under Node. */

(function(root){
'use strict';
var C={};
var D2R=Math.PI/180,TAU=Math.PI*2;

/* TIME & SUN — COPIED VERBATIM from tools/dial/dial.js (the proven solar
   core) — do not edit here. */
// Julian Date from a UTC Date. (dial.js:41)
function julianDate(d){ return d.getTime()/86400000+2440587.5; }
// solar ecliptic longitude (deg) from JD, ~0.01°. (dial.js:55-61)
function sunEclipticLonDeg(jd){
  var n=jd-2451545.0;
  var L=(280.460+0.9856474*n)%360;          // mean longitude
  var g=((357.528+0.9856003*n)%360)*D2R;    // mean anomaly
  var lam=L+1.915*Math.sin(g)+0.020*Math.sin(2*g);
  return ((lam%360)+360)%360;
}

// season phase: 0 vernal · .25 summer sol · .5 autumnal · .75 winter;
// jdOfLocalNoon = estate-clock noon — Date construction 1/2.
function jdOfLocalNoon(y,m,d){ return julianDate(new Date(Date.UTC(y,m-1,d,12,0,0))); }
function seasonPhase(jd){ return sunEclipticLonDeg(jd)/360; }
function seasonName(p){ p=((p%1)+1)%1; return p<0.25?'spring':p<0.5?'summer':p<0.75?'autumn':'winter'; }
function seasonDepth(p){ return Math.abs(Math.sin(TAU*p)); }
var SW=('early spring,full spring,late spring,early summer,high summer,late summer,'
 +'early autumn,deep autumn,late autumn,early winter,midwinter,late winter').split(',');
function seasonPhrase(p){ p=((p%1)+1)%1; var q=Math.min(3,Math.floor(p/0.25)),t=(p-q*0.25)/0.25;
  return SW[q*3+(t<1/3?0:t<2/3?1:2)]; }

// waypoints — upward zero crossing of wrap180(λ−target) + 24× bisection.
C.WAYPOINTS=['vernal-equinox','summer-solstice','autumnal-equinox','winter-solstice']
  .map(function(id,i){ return {id:id,lamDeg:i*90,name:'the '+id.replace('-',' ')}; });
function wrap180(x){ return ((x+180)%360+360)%360-180; }
function waypointsOfYear(y){
  var jd0=jdOfLocalNoon(y,1,1),out=[];
  C.WAYPOINTS.forEach(function(W){
    function f(x){ return wrap180(sunEclipticLonDeg(x)-W.lamDeg); }
    for(var k=0;k<366;k++){
      var fA=f(jd0+k),fB=f(jd0+k+1);
      if(fA<0&&fB>=0&&fB-fA<180){
        var a=jd0+k,b=a+1,mid;
        for(var i=0;i<24;i++){ mid=(a+b)/2; if(f(mid)<0)a=mid; else b=mid; }
        mid=(a+b)/2;
        var md=dateOfDoy(y,Math.floor(mid-jd0+0.5)+1);
        out.push({id:W.id,name:W.name,m:md.m,d:md.d,jd:mid});
        return;
      }
    }
  });
  return out;
}
// the Almanac's countdown
function nextWaypoint(jd,y){
  var today=Math.floor(jd+0.5),L=waypointsOfYear(y).concat(waypointsOfYear(y+1));
  for(var i=0;i<L.length;i++){
    var wd=Math.floor(L[i].jd+0.5);
    if(wd>=today) return {id:L[i].id,name:L[i].name,m:L[i].m,d:L[i].d,daysUntil:wd-today};
  }
  return null;
}

// doy — the ONE 1-based ordinal (doyOf(2026,6,21)===172===CANON_DOY) +
// inverse + the date-aware hour increment (Date construction 2/2).
function doyOf(y,m,d){ return Math.round((Date.UTC(y,m-1,d)-Date.UTC(y,0,1))/86400000)+1; }
function isLeap(y){ return (y%4===0&&y%100!==0)||y%400===0; }
var MLEN=[31,28,31,30,31,30,31,31,30,31,30,31];
function dateOfDoy(y,doy){  // → {m,d}; the wheel's pointer→date map
  var L=MLEN.slice(); if(isLeap(y))L[1]=29;
  var m=1,d=doy; while(d>L[m-1]){ d-=L[m-1]; m++; } return {m:m,d:d};
}
// the ONE way any consumer advances a (date,hour) bucket
function nextHour(y,m,d,hour){
  if(hour<23) return {y:y,m:m,d:d,hour:hour+1};
  var t=new Date(Date.UTC(y,m-1,d)+86400000);
  return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate(),hour:0};
}

// hour register — mirrors Hours.phaseName's exact bands
C.REGISTERS=['deep-night','astro-twilight','civil-twilight','golden-hour','full-day','high-noon'];
function hourRegister(a){ return a<=-18?'deep-night':a<-6?'astro-twilight':a<-0.8?'civil-twilight'
  :a<6?'golden-hour':a<35?'full-day':'high-noon'; }
function registerIndex(reg){ return C.REGISTERS.indexOf(reg); }

// seeds — estate-standard PRNG, VERBATIM (the-gate audio builders' recipe)
function mulberry32(seed){
  let s=(seed>>>0)||1;
  return function(){
    s|=0; s=(s+0x6D2B79F5)|0;
    let t=Math.imul(s^(s>>>15),1|s);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function hash2(a,b){
  let h=(a|0)^0x9E3779B9;
  h=Math.imul(h^(b|0),0x85EBCA6B);
  h^=h>>>13;
  h=Math.imul(h,0xC2B2AE35);
  h^=h>>>16;
  return h>>>0;
}
var SEED_SALT=0x0CA1E0DA;
function dateSeed(y,m,d){ return hash2(hash2(SEED_SALT,y),m*100+d); }
function airSeed(y,m,d,hour){ return hash2(dateSeed(y,m,d),hour); }

// the dressing — authored curves: 8 anchors, mix/S walks, shared endpoints.
function S(a,b,x){ if(b===a) return x<a?0:1; var t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
function lerp(a,b,t){ return a+(b-a)*t; }
function mix(c1,c2,t){ return [Math.round(lerp(c1[0],c2[0],t)),Math.round(lerp(c1[1],c2[1],t)),Math.round(lerp(c1[2],c2[2],t))]; }
function hx(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
// phase k/8 → [washRgb,washA,crownRgb,crownA] (r17: foliage = the drawn CROWN FILL
// colour+α; wash summer anchors shifted OFF-brass + lower α — the §8.4-(l) contrast fix).
var DRESS=[
  [hx('#dfe9d9'),.28,hx('#8fae6a'),.18],
  [hx('#dcecd4'),.32,hx('#84a05a'),.22],
  [hx('#e7e6d6'),.24,hx('#84a05a'),.26],
  [hx('#e6e4d4'),.26,hx('#84a05a'),.26],
  [hx('#ecd9be'),.30,hx('#a8783e'),.30],
  [hx('#e2c9ae'),.34,hx('#c47a42'),.34],
  [hx('#c8d2e4'),.34,hx('#6f6038'),.06],
  [hx('#c2cde2'),.38,hx('#6f6038'),.04]];
function bell(p,c,w){ var d=Math.abs(p-c); d=Math.min(d,1-d); return d>=w?0:0.5*(1+Math.cos(Math.PI*d/w)); }
function dressing(phase){
  var p=((phase%1)+1)%1,k=Math.min(7,Math.floor(p*8)),t=S(k/8,(k+1)/8,p);
  var A=DRESS[k],B=DRESS[(k+1)%8];
  return {wash:{rgb:mix(A[0],B[0],t),a:lerp(A[1],B[1],t)},
    foliage:{rgb:mix(A[2],B[2],t),a:lerp(A[3],B[3],t)},
    snow:bell(p,0.86,0.13),bloom:bell(p,0.07,0.07),turn:bell(p,0.60,0.11)};
}

// history — the authored anniversary table (decorate, never gate); dates
// fixed at design time from git author dates; lines verbatim estate voice.
C.FOUNDING={y:2026,m:6,d:7};
function estateAgeDays(y,m,d){ return Math.round((Date.UTC(y,m-1,d)-Date.UTC(2026,5,7))/86400000); }
C.MILESTONES=[100,500,1000,10000]; // day-365 IS the first founding anniversary
C.ANNIVERSARIES=[
  {m:6,d:7,y:2026,tier:1,kind:'founding',id:'founding',name:'the Founding',
   line:'the Founding — the estate broke ground this day'},
  {m:6,d:14,y:2026,tier:2,kind:'ledger',id:'ledger-opens',name:'the Ledger opens',
   line:'the Ledger opened — the Cairn laid the first stone this day'},
  {m:6,d:15,y:2026,tier:2,kind:'era',id:'the-naming',name:'the Naming',
   line:'the Naming — this place took the name The Orrery Estate this day'},
  {m:7,d:4,y:2026,tier:2,kind:'era',id:'polar-reorg',name:'the Great Reorganization',
   line:'the Great Reorganization — the estate took its polar form this day'}];
// the 20 wing birthdays (tier 3, y 2026)
[[6,7,'strange-garden','Strange Garden'],[6,8,'arcade','The Arcade'],
 [6,8,'map-room','The Map Room'],[6,8,'music-room','The Music Room'],
 [6,8,'study','The Study'],[6,10,'observatory','The Observatory'],
 [6,10,'hedge-maze','The Hedge Maze'],[6,11,'print-room','The Print Room'],
 [6,11,'threshold','Threshold'],[6,12,'makers-shed',"The Maker's Shed"],
 [6,13,'hall-of-mirrors','Hall of Mirrors'],[6,13,'cavern','The Cavern'],
 [6,14,'engine-room','The Engine Room'],[6,14,'numbers-room','The Numbers Room'],
 [6,14,'clockwork','Clockwork Automata'],[6,15,'conservatory','The Conservatory'],
 [6,15,'alchemy-lab','The Alchemy Lab'],[6,15,'puzzle-pavilion','Puzzle Pavilion'],
 [6,16,'tabularium','The Tabularium'],[6,16,'hours','The Hours']
].forEach(function(w){ C.ANNIVERSARIES.push(
  {m:w[0],d:w[1],y:2026,tier:3,kind:'wing',id:'wing-'+w[2],name:w[3]}); });
C.MILESTONE_LINES={
  100:'the estate is one hundred days old today',
  500:'the estate is five hundred days old today',
  1000:'the estate is one thousand days old today',
  10000:'the estate is ten thousand days old today — an old place now'};
C.WAYPOINT_LINES={
  'vernal-equinox':'the vernal equinox — day and night stand equal; the year begins its round',
  'summer-solstice':'the summer solstice — the sun stands highest; the longest day',
  'autumnal-equinox':'the autumnal equinox — day and night stand equal; the light begins to leave',
  'winter-solstice':'the winter solstice — the sun stands lowest; the longest night'};
var YW=['two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
function yearsPhrase(n){ return n===1?'a year ago':(n>=2&&n<=12?YW[n-2]:n)+' years ago'; }
function annsOn(y,m,d){
  var out=[],i,r;
  for(i=0;i<C.ANNIVERSARIES.length;i++){
    r=C.ANNIVERSARIES[i];
    if(r.m===m&&r.d===d&&y>r.y) out.push(Object.assign({},r,{years:y-r.y}));
  }
  return out;
}
function joinNames(ns){ return ns.length===1?ns[0]:ns.slice(0,-1).join(', ')+' and '+ns[ns.length-1]; }
// the ordered mark list, texts FULLY COMPOSED — founding ✦ · milestone ✶ ·
// era/ledger ✧ · waypoint ☉ · wings ❈ (stacked by day).
function marksFor(y,m,d){
  var anns=annsOn(y,m,d),marks=[],el=[],wings=[],yrs=0,i,r;
  function mk(k,g,t){ marks.push({kind:k,glyph:g,text:t}); }
  for(i=0;i<anns.length;i++){ r=anns[i];
    if(r.kind==='founding') mk('founding','✦',r.line+', '+yearsPhrase(r.years));
    else if(r.kind==='wing'){ wings.push(r.name); yrs=r.years; }
    else el.push(r); }
  var age=estateAgeDays(y,m,d);
  if(C.MILESTONES.indexOf(age)!==-1) mk('milestone','✶',C.MILESTONE_LINES[age]);
  for(i=0;i<el.length;i++) mk(el[i].kind,'✧',el[i].line+', '+yearsPhrase(el[i].years));
  var wps=waypointsOfYear(y);
  for(i=0;i<wps.length;i++)
    if(wps[i].m===m&&wps[i].d===d) mk('waypoint','☉',C.WAYPOINT_LINES[wps[i].id]);
  if(wings.length) mk('wing','❈',joinNames(wings)
    +(wings.length>1?' were raised this day, ':' was raised this day, ')+yearsPhrase(yrs));
  return marks;
}

// the moment manifest — the score's ONE input; H = the injected Hours core.
function momentManifest(y,m,d,hour,H){
  var doy=doyOf(y,m,d),lat=H.ESTATE.latDeg,altCurve=[],i;
  for(i=0;i<=4;i++) altCurve.push(H.solarAltitudeDeg(lat,doy,hour*60+i*15)); // min 0/15/30/45/60, DEG
  // solarNoonMin: argmax minute-scan, civilMin 600..840, FIRST max
  var best=-Infinity,M=600,cm,a;
  for(cm=600;cm<=840;cm++){ a=H.solarAltitudeDeg(lat,doy,cm); if(a>best){ best=a; M=cm; } }
  // annTier/annLabel: the top NON-waypoint mark; tiers 1 founding/milestone
  // · 2 era/ledger · 3 wing · 0 none
  var marks=marksFor(y,m,d),tier=0,label=null,mk;
  for(i=0;i<marks.length;i++){ mk=marks[i];
    if(mk.kind==='waypoint') continue;
    tier=(mk.kind==='founding'||mk.kind==='milestone')?1:(mk.kind==='wing')?3:2;
    label=mk.text; break; }
  return {seed:airSeed(y,m,d,hour),dateInt:y*10000+m*100+d,hour:hour,
    seasonPhase:seasonPhase(jdOfLocalNoon(y,m,d)),altCurve:altCurve,
    solarNoonMin:(Math.floor(M/60)===hour)?(M-hour*60):null,annTier:tier,annLabel:label};
}

// selfTest — the PURE battery s1–s8; the Node twin runs this same function
// plus the twin-only checks.
function selfTest(){
  var R=[],pass=true,z;
  function ok(n,c){ c=!!c; if(!c)pass=false; R.push({name:n,pass:c,info:''}); }
  ok('s1 doy',doyOf(2026,1,1)===1&&doyOf(2026,6,21)===172&&doyOf(2028,12,31)===366);
  z=[[2026,1,1,1],[2026,172,6,21],[2028,366,12,31]].every(function(q){
    var r=dateOfDoy(q[0],q[1]); return r.m===q[2]&&r.d===q[3]; });
  ok('s1 inverse',z);
  var wps=waypointsOfYear(2026);
  z=wps.length===4&&wps.every(function(w,i){
    return (i===0||w.jd>wps[i-1].jd)
      && Math.abs(wrap180(sunEclipticLonDeg(w.jd)-C.WAYPOINTS[i].lamDeg))<0.05; });
  ok('s2 waypoints',z);
  z=[[2026,7,7],[2026,12,21],[2027,3,1]].every(function(q){
    var d=((seasonPhase(jdOfLocalNoon(q[0],q[1],q[2]+1))
           -seasonPhase(jdOfLocalNoon(q[0],q[1],q[2])))%1+1)%1;
    return d>=0.9/365&&d<=1.1/365; });
  ok('s3 phase',z);
  z=[0.02,0.10,0.30,0.45,0.60,0.70,0.86,0.95].every(function(p){
    var d=dressing(p);
    return d.wash.a>=0.22&&d.wash.a<=0.40&&d.foliage.a>=0&&d.foliage.a<=0.40
      &&d.snow>=0&&d.snow<=1&&d.bloom>=0&&d.bloom<=1&&d.turn>=0&&d.turn<=1
      &&(p>0.73||d.snow===0)&&(p<0.14||p>0.99||d.bloom===0)
      &&((p>0.49&&p<0.71)||d.turn===0); });
  ok('s4 dressing',z);
  z=C.REGISTERS.length===6&&[-18,-6,-0.8,6,35].every(function(t,j){
    return hourRegister(t-0.05)===C.REGISTERS[j]&&hourRegister(t+0.05)===C.REGISTERS[j+1]; });
  ok('s5 registers',z);
  var m1=marksFor(2027,6,7);
  ok('s6 founding',m1.length===2&&m1[0].kind==='founding'&&m1[0].glyph==='✦'
    &&m1[0].text===C.ANNIVERSARIES[0].line+', a year ago'
    &&m1[1].kind==='wing'&&m1[1].text==='Strange Garden was raised this day, a year ago');
  var m2=marksFor(2026,9,15);
  ok('s6 day-100',m2.length===1&&m2[0].kind==='milestone'&&m2[0].text===C.MILESTONE_LINES[100]);
  ok('s6 plain',marksFor(2026,8,1).length===0);
  var m4=marksFor(2027,6,14);
  ok('s6 ledger',m4.length===2&&m4[0].kind==='ledger'
    &&m4[0].text===C.ANNIVERSARIES[1].line+', a year ago'&&m4[1].kind==='wing');
  ok('s7 age',estateAgeDays(2026,7,7)===30&&estateAgeDays(2026,9,15)===100
    &&estateAgeDays(2027,6,7)===365);
  z=[[2026,12,31,23,2027,1,1,0],[2028,2,28,23,2028,2,29,0],[2027,2,28,23,2027,3,1,0],
     [2026,6,30,23,2026,7,1,0],[2026,7,7,14,2026,7,7,15]].every(function(q){
    var t=nextHour(q[0],q[1],q[2],q[3]);
    return t.y===q[4]&&t.m===q[5]&&t.d===q[6]&&t.hour===q[7]; });
  ok('s8 nextHour',z);
  return {pass:pass,results:R};
}

Object.assign(C,{julianDate,sunEclipticLonDeg,doyOf,dateOfDoy,nextHour,
  jdOfLocalNoon,seasonPhase,seasonName,seasonDepth,seasonPhrase,waypointsOfYear,
  nextWaypoint,hourRegister,registerIndex,mulberry32,hash2,dateSeed,airSeed,
  dressing,estateAgeDays,annsOn,marksFor,yearsPhrase,momentManifest,selfTest});

if(root) root.Calendar=C;
// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = C; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
