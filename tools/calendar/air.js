/* air.js — THE LIVING CALENDAR's CONDUCTOR. The DOCS carry the prose; these
   comments only POINT: SCORE §5.3 graph/pump/crossing · §6 lifecycle A–G · r6.2
   wind floor, arm BLOCK/JOIN/burst, FILL-QUEUE rev 2, late-buffer/slip · DESIGN
   §5.5/§8.3. NO recipe DSP (r11.1): pad/wind samples come from the shared bank's
   STREAMS in <=2-s sub-chunks (padDay's live WAVETABLE is a MODE of it, r11.2).
   Dual-use classic script; NOTHING runs at parse time (DESIGN §5.4). */
(function(root){
'use strict';
var A={};

// ===== AIR POLICY — BEGIN =====
// DESIGN §8.3 — the pure core. No suspend axis: the platform suspends, entering
// HERE as ctxRunning, so the was-held guard IS the policy (r4-M2/M3).
var AIR_LEVEL=0.28;
function airTargets(s){
  var w=!!(s.armed&&s.everGesture),on=!!(w&&s.visible&&!s.muted&&s.ctxRunning);
  return {wantCtx:w,schedulerOn:on,masterLevel:on?AIR_LEVEL:0,held:!!(w&&!s.ctxRunning)};
}
// ===== AIR POLICY — END =====

// pump/fill constants (§5.3, r6.2). CAP = §7's RUNTIME row; the steal is an
// unreachable backstop (composer max 6 — twin check 11).
var TICK=250,HORIZON=1.5,AHEAD=4,FILL_H=8,EARLY=1,SUB=2,BUDGET=30,SEAM=12,
    CAP=23,PRE=0.05,ANN_AT=0.5;
var K_V={padNight:0.08928,padDay:0.041,padDawnDusk:0.06504,padWinterDeep:0.2670,loneVoice:0.2032},
    W_TIER={day:-46,'dawn-dusk':-47.5,evening:-49,'deep-night':-50},
    W_W={plain:0.07532766,winterThin:0.1087888,distantAir:0.2788699},
    PH={padNight:5,padDay:9,padDawnDusk:6,padWinterDeep:9},
    PADS={padNight:1,padDay:1,padDawnDusk:1,padWinterDeep:1};
function windGain(p,t){ return Math.pow(10,W_TIER[t]/20)/(AIR_LEVEL*W_W[p]); } // r6.2 freeze
function padParams(v,p,secs,wt){   // r6.1/r6.3 packing
  var z=p.realize,n=PH[v];
  return {seconds:secs,detunes:z.detunes,phases:z.phases.slice(z.phases.length-n),
    seeds:z.seeds,third:p.third,thirdPhase:z.phases.length>n?z.phases[0]:0,
    breathF:p.breathF,breathU0:p.breathU0,depth:p.depth,wavetable:!!wt};
}
function leadOf(e){ return (e.params&&e.params.prevNote!=null)?e.params.gapS:0; } // r6
function startOf(e){ return e.t-leadOf(e); }   // the BUFFER start
function kindOf(e){ return e.voice==='windBed'?'wind':e.voice==='loneVoice'?'swell'
  :PADS[e.voice]?'pad':'note'; }
function gainOf(e){
  if(e.voice==='windBed') return windGain(e.params.preset,e.params.tier);
  if(e.voice==='loneVoice') return K_V.loneVoice;
  return PADS[e.voice]?K_V[e.voice]:e.gain;   // note/toll: own gain
}
// r6.2 FILL-QUEUE rev 2's RANK: 1 announcement · 2 wind · 3 pads/swells/replay ·
// 4 the NOTE lane, which RIDES ALONG.
function rankOf(e,a){ if(a) return 1; var k=kindOf(e);
  return k==='wind'?2:(k==='pad'||k==='swell')?3:4; }
// r6.1 anti-throb: 2.8 s LINEAR at an ABSOLUTE episode index.
function epRamp(i,n,sr){ var r=Math.round(2.8*sr);
  return Math.min(i<r?i/r:1,i>=n-r?(n-1-i)/r:1); }
// r6.2 — 0.25-s equal-power sqrt seams; 1.5-s LINEAR head attack/tail release.
function windEnv(i,n,sr,f,l){
  var s=Math.round(0.25*sr),h=Math.round(1.5*sr),g=1,j=n-1-i;
  if(f){ if(i<h) g*=i/h; } else if(i<s) g*=Math.sin(i/s*Math.PI/2);
  if(l){ if(j<h) g*=j/h; } else if(j<s) g*=Math.sin(j/s*Math.PI/2);
  return g;
}
A.airTargets=airTargets; A.leadOf=leadOf; A.startOf=startOf; A.kindOf=kindOf;
A.gainOf=gainOf; A.rankOf=rankOf; A.padParams=padParams; A.epRamp=epRamp;
A.windEnv=windEnv; A.windGain=windGain; A.AIR_LEVEL=AIR_LEVEL; A.K_V=K_V;
A.W_TIER=W_TIER; A.W_W=W_W; A.PH=PH; A.CAP=CAP; A.TICK=TICK; A.FILL_H=FILL_H;
A.SEAM=SEAM; A.BUDGET=BUDGET; A.SUB=SUB; A.AHEAD=AHEAD; A.HORIZON=HORIZON;

/* ===== the conductor (browser only: a real ctx + the page's cores) ===== */
var ctx=null,mst=null,bus=null,timer=null,armed=false,gest=false,heldNow=false,
    subbed=false,recov=false,epoch=0,bk=null,man=null,live=[],eps=null,q=null,
    srcs=null,derived=null,dnext=null,pumpStarts=0,ann=null,annBase=0,annSlip=null,
    btn=null,L=null,onState=null,onVis=null;
function now(){ return ctx?ctx.currentTime:0; }
function perf(){ try{ return performance.now(); }catch(e){ return Date.now(); } }
function vis(){ try{ return document.visibilityState==='visible'; }catch(e){ return true; } }
function mut(){ try{ return WS.muted(); }catch(e){ return false; } }
function inputs(){ return {armed:armed,muted:mut(),visible:vis(),
  ctxRunning:!!(ctx&&ctx.state==='running'),everGesture:gest}; }
function busFor(k){ if(!bus[k]){ var g=ctx.createGain(); g.gain.value=1;
  g.connect(mst); bus[k]=g; } return bus[k]; }
function ramp(n,to,s){ var t=now();
  try{ n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value,t);
    n.gain.linearRampToValueAtTime(to,t+s); }catch(e){ try{ n.gain.value=to; }catch(x){} }
}
// §6-B/§6-C per-reason COURTESY: MUTE discards nothing; a discarded
// ANNOUNCEMENT is FORFEITED (r9/r10).
function courtesy(discard){
  if(!discard||!srcs) return;
  srcs.forEach(function(s){ try{ s.stop(); }catch(e){} try{ s.disconnect(); }catch(e){} });
  srcs.clear();
  for(var i=0;i<live.length;i++) if(live[i].src){ live[i].src=null; live[i].sched=false;
    if(live[i].ann) live[i].done=true; }
}
// §6-C/r3-F5: a fresh-ctx recovery FLUSHES every sr-bound buffer (48k<->44.1k).
function flush(){ eps={}; q=[];
  for(var i=0;i<live.length;i++){ live[i].job=null; live[i].src=null; live[i].sched=false; } }
function plan(evs,a){ var o=[],i;
  for(i=0;i<evs.length;i++) o.push({ev:evs[i],ann:!!a,rank:rankOf(evs[i],a),
    start:startOf(evs[i]),job:null,src:null,sched:false,done:false,fade:false});
  return o; }
function compose(m){ bk={y:m.y,mo:m.m,d:m.d,hour:m.hour};
  man=Calendar.momentManifest(m.y,m.m,m.d,m.hour);
  live=plan(composeHour(man).events,false); eps={}; q=[]; }
function secOf(m){ return m.min*60+m.sec; }

/* --- jobs: ONE buffer each, filled from the bank's streams --- */
function epOf(e){   // ONE stream per pad episode
  var p=e.ev.params,k=e.ev.voice+':'+p.epStart+':'+p.epEnd+':'+(e.ann?'a':'h');
  if(!eps[k]){ var sr=ctx.sampleRate,secs=p.epEnd-p.epStart,
      mk={padNight:padNightStream,padDay:padDayStream,
          padDawnDusk:padDawnDuskStream,padWinterDeep:padWinterDeepStream}[e.ev.voice];
    // r13.3 — LIVE takes the WAVETABLE mode PER VOICE: padDay + padWinterDeep saws
    // and padDawnDusk's tone half; padNight stays DIRECT (a table buys it no wall).
    eps[k]={st:mk(sr,padParams(e.ev.voice,p,secs,e.ev.voice!=='padNight')),
      cur:0,n:Math.round(sr*secs),fade:false,scr:null}; }
  return eps[k];
}
function mkJob(e){
  var sr=ctx.sampleRate,p=e.ev.params,k=kindOf(e.ev),j={e:e,k:k,i:0,n:0,ms:0,ep:null,st:null};
  if(k==='wind'){ j.n=Math.round(sr*p.winDur); j.st=windBedStream(sr,p);
    j.f=p.winFrom<1e-6; j.l=p.winFrom+30>=3600-1e-6; }
  else if(k==='pad'){ j.ep=epOf(e); j.a=Math.round((p.winFrom-p.epStart)*sr);
    j.n=Math.round((p.winFrom+p.winDur-p.epStart)*sr)-j.a; }
  j.data=j.n?new Float32Array(j.n):null;   // note/swell: one whole render
  return j;
}
function ready(j){ return j.n>0&&j.i>=j.n; }
// ONE fill step: <=cap samples; chunked==atomic by r11.1 (r11.3/r12.5's tooth).
// A lagging pad stream DRAINS first = r6.2's REPLAY from epStart.
function step(j,cap){
  var t0=perf(),sr=ctx.sampleRate,e=j.e,p=e.ev.params,i,n;
  if(j.k==='note'){ var r=Calendar.mulberry32(Calendar.hash2(man.seed,e.ev.seq));
    j.data=(e.ev.voice==='ksPluck'?ksPluck:celesta)(sr,p,r); j.n=j.data.length; j.i=j.n; }
  else if(j.k==='swell'){ j.data=loneVoiceSwell(sr,p); j.n=j.data.length; j.i=j.n; }
  else if(j.k==='wind'){ n=Math.min(cap,j.n-j.i);
    var tw=new Float32Array(n); j.st.fill(tw,n);
    for(i=0;i<n;i++) j.data[j.i+i]=tw[i]*windEnv(j.i+i,j.n,sr,j.f,j.l);
    j.i+=n; }
  else { var ep=j.ep;
    if(ep.cur<j.a){ n=Math.min(cap,j.a-ep.cur);   // the REPLAY drain (discarded)
      if(!ep.scr||ep.scr.length<n) ep.scr=new Float32Array(n);
      ep.st.fill(ep.scr,n); ep.cur+=n; }
    else { n=Math.min(cap,j.n-j.i);
      var tp=new Float32Array(n); ep.st.fill(tp,n);
      for(i=0;i<n;i++) j.data[j.i+i]=tp[i]*epRamp(j.a+j.i+i,ep.n,sr);
      j.i+=n; ep.cur+=n; } }
  var d=perf()-t0; j.ms+=d; return d;
}
// projected remaining wall (s) from the job's OWN rate — the r12 slack input.
function remain(j){ if(!j.ms||!j.i) return (j.n||ctx.sampleRate)/ctx.sampleRate*0.06;
  return (j.ms/j.i)*(j.n-j.i)/1000; }

/* --- the fill queue (r6.2's ONE queue) --- */
function enq(t){ var i,e,d;
  for(i=q.length-1;i>=0;i--){ e=q[i].e; if(e.done||e.sched||!e.job) q.splice(i,1); }
  for(i=0;i<live.length;i++){ e=live[i];
    if(e.done||e.job||e.sched) continue;
    d=startAt(e);
    if(e.rank===1){ push(e,d); continue; }   // rank 1 enters at CREATION (r13)
    if(e.rank===4){ if(d-t<=AHEAD&&d>t) push(e,d); continue; }
    if(d-t<=FILL_H&&d+34>t) push(e,d);   // the 8-s window-fill horizon
  }
}
function push(e,d){ e.job=mkJob(e); e.job.dl=d; q.push(e.job); }
// RANK, then DEADLINE; then r12's PREEMPT (head keeps >=1 s slack after ceding).
function pick(t){
  var h=null,i,j;
  for(i=0;i<q.length;i++){ j=q[i]; if(j.e.rank===4||ready(j)) continue;
    if(!h||j.e.rank<h.e.rank||(j.e.rank===h.e.rank&&j.dl<h.dl)) h=j; }
  if(!h||h.e.rank<2) return h;
  var hr=remain(h),o=null;
  for(i=0;i<q.length;i++){ j=q[i];
    if(j===h||j.e.rank<=h.e.rank||j.e.rank>3||ready(j)) continue;
    if(j.dl<t+hr&&(!o||j.dl<o.dl)) o=j; }
  return (o&&h.dl-(t+hr+remain(o))>=EARLY)?o:h;
}
function headNote(){ var i,e,b=null;   // rank 4 RIDES ALONG (r13)
  for(i=0;i<live.length;i++){ e=live[i];
    if(e.rank!==4||e.done||e.sched||!e.job||ready(e.job)) continue;
    if(!b||e.job.dl<b.job.dl) b=e; }
  return b; }

/* --- scheduling (§5.3, sample-accurate on the WebAudio clock) --- */
function startAt(e){ if(e.ann) return annBase+((annSlip&&e.ev.layer==='pad')?annSlip(e):e.start);
  return epoch+e.start; }
// the LATE-BUFFER law (r11/r12): join mid-signal via start(when,offset), §5.3's
// skip law staying NOTE-scoped; fire-time mute re-read = the belt (inv-02 §1).
function sched(e,t){
  var j=e.job,w=startAt(e),off=0;
  if(w<t){ off=t-w; w=t; }
  if((e.rank===4&&off>0)||off>=j.n/ctx.sampleRate||mut()){ drop(e); return; }
  var b=ctx.createBuffer(1,j.n,ctx.sampleRate); b.getChannelData(0).set(j.data);
  var s=ctx.createBufferSource(),g=ctx.createGain(),lv=gainOf(e.ev);
  s.buffer=b; g.gain.value=lv;
  if(e.fade){ g.gain.setValueAtTime(1e-4,w);   // the 1-s equal-power live JOIN
    try{ g.gain.setValueCurveAtTime(fadeCurve(lv),w,1); }catch(x){ g.gain.value=lv; } }
  s.connect(g); g.connect(busFor(e.ev.layer)); s.__ann=e.ann; s.__layer=e.ev.layer;
  s.onended=function(){ try{ s.disconnect(); g.disconnect(); }catch(x){} srcs['delete'](s); };
  try{ s.start(w,off); }catch(x){ drop(e); return; }
  srcs.add(s); e.src=s; e.sched=true; e.job=null;
  if(e.ann) ann.scheduled++;   // the CUMULATIVE session count
  if(srcs.size>CAP) steal();
}
function drop(e){ e.done=true; e.job=null; }
function fadeCurve(g){ var c=new Float32Array(17),i;
  for(i=0;i<17;i++) c[i]=Math.max(1e-4,g*Math.sin(i/16*Math.PI/2)); return c; }
// §5.3 backstop: the oldest MELODIC voice over 50 ms; announcement sources and
// the toll are EXEMPT from the steal set (r5).
function steal(){ var it=srcs.values(),s;
  while((s=it.next().value)){ if(s.__ann||s.__layer==='toll') continue;
    try{ s.stop(now()+0.05); }catch(e){} srcs['delete'](s); return; } }

/* --- the pump --- */
function tick(){
  if(!ctx) return;
  var t0=perf(),t,e,j,d,i;
  cross(now()); t=now(); enq(t);
  e=headNote(); if(e) step(e.job,0);   // the head note FIRST, every tick
  while(perf()-t0<BUDGET){   // then rank 1, then ranks 2-3
    j=pick(t); if(!j) break;
    d=step(j,Math.round(SUB*ctx.sampleRate));
    if(j.k==='note'||j.k==='swell') break;   // one whole buffer per tick (§5.3)
    if(d===0&&ready(j)) break;
  }
  for(i=0;i<live.length;i++){ e=live[i];
    if(e.done||e.sched||!e.job) continue;
    // r6.2's entry law: a boundary passed before the fill is NOT the entry.
    if(!ready(e.job)){ if(e.rank!==4&&kindOf(e.ev)==='pad'&&startAt(e)<t) drop(e); continue; }
    if(startAt(e)-t<HORIZON){
      if(e.job.ep&&e.job.ep.fade){ e.fade=true; e.job.ep.fade=false; }
      sched(e,t); }
  }
  slip(t);
}
// the CONDUCTOR-OWNED slip (r8): ONE base for w1/w2, so punctuality — never the
// sample-accurate seam — is what slips.
function slip(t){
  if(annSlip||!ann||ann.forfeited) return;
  var i,e,w=null;
  for(i=0;i<live.length;i++){ e=live[i];
    if(e.ann&&e.ev.layer==='pad'&&(!w||e.start<w.start)) w=e; }
  if(!w||!w.job||!ready(w.job)) return;
  var b=Math.max(annBase+w.start,t+0.03),o=w.start;
  annSlip=function(x){ return b-annBase+(x.start-o); };
}
// §5.3 crossing — DERIVE (>3540 s pre-compose) then VERIFY (ONE fresh airMoment):
// agree => re-derive the epoch + join it; disagree (DST, clock change, slept tab)
// => join the READ's bucket (r3-F3).
function cross(t){
  var s=t-epoch;
  if(s>3540&&!derived) precompose();
  if(s<3600) return;
  var m=airMoment();
  epoch=now()+PRE-secOf(m);
  if(m.hourPinned){ derived=null; dnext=null; return; }
  if(derived&&dnext&&dnext.y===m.y&&dnext.m===m.m&&dnext.d===m.d&&dnext.hour===m.hour){
    bk={y:dnext.y,mo:dnext.m,d:dnext.d,hour:dnext.hour};
    man=derived.man; live=plan(derived.evs,false); eps={}; q=[];
  } else compose(m);
  derived=null; dnext=null;
}
function precompose(){
  try{ dnext=Calendar.nextHour(bk.y,bk.mo,bk.d,bk.hour);
    var m=Calendar.momentManifest(dnext.y,dnext.m,dnext.d,dnext.hour);
    derived={man:m,evs:composeHour(m).events};
  }catch(e){ derived=null; dnext=null; }
}

/* --- §6-A: arm (a real click) --- */
function build(){ mst=ctx.createGain(); mst.gain.value=1e-4; mst.connect(ctx.destination);
  bus={}; busFor('pad'); busFor('notes'); busFor('toll'); busFor('wind'); }
function watch(c){ c.addEventListener('statechange',onState); }   // §6-C held detector
function unwatch(c){ c.removeEventListener('statechange',onState); }
A.arm=function(){
  if(armed) return;
  var AC=root.AudioContext||root.webkitAudioContext; if(!AC) return;
  if(root.__wsAudioCtx) ctx=root.__wsAudioCtx;   // the estate's ONE shared slot
  else { try{ ctx=new AC(); }catch(e){ return; } root.__wsAudioCtx=ctx; }
  if(ctx.state!=='running'&&ctx.resume)   // never awaited (§6-A1)
    try{ ctx.resume()['catch'](function(){}); }catch(e){}
  gest=true; armed=true; recov=false; annSlip=null; srcs=new Set(); build();
  var m=airMoment(),muted=mut();   // §1.8 — ONE read: date, hour, epoch
  epoch=now()+PRE-secOf(m); compose(m);
  if(!muted) ramp(mst,AIR_LEVEL,0.4);   // §6-A2 — level BEFORE the +0.5 s
  respond(muted);
  onState=function(){ courtesy(ctx.state!=='running'); applyAir(); }; watch(ctx);
  onVis=function(){ courtesy(!vis()); applyAir(); };
  try{ document.addEventListener('visibilitychange',onVis); }catch(e){}
  if(!subbed){ subbed=true;   // §6-B — one subscription, ever
    try{ WS.onMuteChange(function(){ courtesy(false); applyAir(); }); }catch(e){} }
  try{ localStorage.setItem('ws:pref:air','1'); }catch(e){}
  root.__AIR__={state:state};   // §6-A4 — the debug hook
  applyAir(m);
  if(!muted) join(m);
};
// §6-A3 — the ANNOUNCEMENT at ABSOLUTE now+0.5 s. MUTED = FORFEIT-ALL (r8/r9):
// composed for determinism, never rendered or scheduled at any rejoin.
function respond(muted){
  ann={figure:man.annTier>=1?'P5':figureOf(man.dateInt),scheduled:0,forfeited:!!muted};
  if(muted) return;
  annBase=now()+ANN_AT;
  var p=plan(armResponse(man),true),i;
  for(i=0;i<p.length;i++) live.push(p[i]);
}
// r6.2's BLOCK + JOIN laws: notes skip, the FLOOR joins on ONE synchronous block
// EVER (window w WHOLE, <=250 ms); near-seam w+1 (<12 s, r11) is a follow-on fill.
function join(m){
  var t=now(),s=t-epoch,i,e,k,w=null,wp=null;
  for(i=0;i<live.length;i++){ e=live[i];
    if(!e.ann&&kindOf(e.ev)==='wind'&&e.start<=s&&e.start+30>s){ w=e; break; } }
  if(w){
    push(w,startAt(w)); step(w.job,w.job.n);   // THE one synchronous block
    if(ready(w.job)) sched(w,now());
    if(w.start+30-(now()-epoch)<SEAM){   // near-seam => w+1 rides first
      var nf=w.start+30;
      if(nf>=3600){ if(!derived) precompose(); }   // r11 — across the boundary
      else for(i=0;i<live.length;i++){ e=live[i];
        if(!e.ann&&kindOf(e.ev)==='wind'&&Math.abs(e.start-nf)<1e-6){ wp=e; break; } }
    }
  }
  burst(wp);
  for(i=0;i<live.length;i++){ e=live[i]; k=kindOf(e.ev);
    if(e.ann||(k!=='pad'&&k!=='swell')) continue;
    if(k==='swell'){ if(e.start<=s) e.done=true; continue; }
    if(e.ev.params.winFrom+e.ev.params.winDur<=s) e.done=true;
    else if(e.ev.params.epStart<s-1e-6) markFade(e);
  }
}
function markFade(e){ var p=e.ev.params,k=e.ev.voice+':'+p.epStart+':'+p.epEnd+':h';
  if(!eps[k]) epOf(e); eps[k].fade=true; }
// the NAMED FRAME-BURST fills (r6.2 — exempt from the tick cap AND the 1-s-early
// law): the announcement's first window, THEN near-seam w+1; the frames AFTER the
// click, never synchronous with it.
function burst(wp){
  root.setTimeout(function(){
    if(!ctx||!armed) return;
    var i,e;
    for(i=0;i<live.length;i++){ e=live[i];
      if(e.ann&&e.ev.layer==='pad'&&!e.done&&!e.sched){
        if(!e.job) push(e,startAt(e));
        if(!ready(e.job)) step(e.job,e.job.n); } }
    slip(now());
    if(wp&&!wp.job&&!wp.done){ push(wp,startAt(wp)); step(wp.job,wp.job.n); }
  },0);
}

/* --- §6-D: disarm (click) --- */
A.disarm=function(){
  if(!armed) return;
  armed=false;
  try{ localStorage.setItem('ws:pref:air','0'); }catch(e){}
  if(mst) ramp(mst,0,0.4);   // 400 ms, then the teardown
  stop();
  if(ctx&&onState){ unwatch(ctx); onState=null; }
  if(onVis){ try{ document.removeEventListener('visibilitychange',onVis); }catch(e){} onVis=null; }
  var m=mst,b=bus,ss=srcs; mst=null; bus=null;
  root.setTimeout(function(){   // +450 ms: the Gate stopAll idiom
    if(ss){ ss.forEach(function(s){ try{ s.stop(); }catch(e){} try{ s.disconnect(); }catch(e){} });
      ss.clear(); }
    var k; for(k in b||{}) try{ b[k].disconnect(); }catch(e){}
    try{ if(m) m.disconnect(); }catch(e){}
  },450);
  live=[]; q=[]; eps={}; heldNow=false; label();
  // the shared ctx is LEFT RUNNING for the estate's other consumers (§6-D).
};
function stop(){ if(timer){ root.clearInterval(timer); timer=null; } }

/* --- §6-G: applyAir — THE reconciler --- */
// ONE applier owns every pump/master/label decision (handlers only do their
// per-reason courtesy and call THIS); pump start EDGE-TRIGGERED + idempotent, the
// epoch from ONE airMoment() at the off->on edge ONLY (r4-M2). Never resume().
function applyAir(m){
  var g=airTargets(inputs());
  heldNow=g.held;
  if(mst&&armed) ramp(mst,g.masterLevel,g.masterLevel>0?0.2:0.04);
  if(g.schedulerOn&&!timer){
    if(!m){ var r=airMoment();   // a REJOIN edge: re-sync the wall clock;
      epoch=now()+PRE-secOf(r);   //   missed events skip
      if(!r.hourPinned&&man&&(bk.y!==r.y||bk.mo!==r.m||bk.d!==r.d||bk.hour!==r.hour)) compose(r); }
    pumpStarts++;
    timer=root.setInterval(tick,TICK);
  } else if(!g.schedulerOn&&timer) stop();
  label();
}
// DESIGN §5.2's five label rows live in the PAGE (r12.2): T3.3 hands `attach` a
// table keyed off/on/mute/wait/held, each row [text, title] VERBATIM — the
// conductor routes state->row (§6), the front door owns the prose.
function label(){
  if(!btn||!L) return;
  var r=!armed?L.off:heldNow?L.held:!gest?L.wait:mut()?L.mute:L.on;
  btn.textContent=r[0]; btn.title=r[1];
  btn.setAttribute('aria-label',r[1]); btn.setAttribute('aria-pressed',armed?'true':'false');
}

/* --- the held state + route-change recovery (§6-C / r2-m8) --- */
// The PLATFORM suspends; the air never does. The next REAL click resumes AND
// handles the rejection (an iOS route change can INVALIDATE the ctx): ONE attempt
// per click, a second failure keeping the held label.
A.resume=function(){
  if(!armed||mut()||!ctx) return;   // never resume muted or disarmed
  gest=true;
  if(ctx.state==='closed'){ fresh(); return; }
  try{ ctx.resume()['catch'](fresh); }catch(e){ fresh(); return; }
  applyAir();
};
function fresh(){
  if(recov){ applyAir(); return; }   // one attempt per click
  recov=true;
  var AC=root.AudioContext||root.webkitAudioContext,old=ctx,nc;
  try{ nc=new AC(); }catch(e){ applyAir(); return; }
  courtesy(true); stop();
  if(old&&onState) try{ unwatch(old); }catch(e){}
  var k; for(k in bus||{}) try{ bus[k].disconnect(); }catch(e){}
  try{ if(mst) mst.disconnect(); }catch(e){}
  ctx=nc; if(root.__wsAudioCtx===old) root.__wsAudioCtx=nc;
  build(); flush();
  onState=function(){ courtesy(ctx.state!=='running'); applyAir(); }; watch(ctx);
  var m=airMoment(); epoch=now()+PRE-secOf(m); compose(m);
  ramp(mst,mut()?0:AIR_LEVEL,0.2);
  applyAir(m);
}

/* --- wiring (T3.3 hands us the #cal-air button + its §5.2 rows) --- */
A.attach=function(el,labels){
  try{
    if(typeof composeHour==='undefined'||!WS) return;   // theHours()'s guard idiom
    btn=el; L=labels||null;
    var s=null; try{ s=localStorage.getItem('ws:pref:air'); }catch(e){}
    armed=s==='1'; gest=false;   // returning: awaiting gesture
    // the resume gesture is a click on the button ITSELF — NO window-level
    // pointerdown (the door's primary gesture is a map pan; DESIGN §5.5/r1-m5).
    btn.addEventListener('click',function(){
      if(!armed||!gest){ armed=false; A.arm(); }
      else if(heldNow) A.resume();
      else A.disarm();
    });
    label();
  }catch(e){}
};
// §6-A4's hook. `announce.scheduled` = the CUMULATIVE announcement sources of
// THIS arm session; `pumpStarts` = pump off->on edges this load (r4-M2).
function state(){
  return {armed:armed,ctxState:ctx?ctx.state:null,masterGain:mst?mst.gain.value:null,
    scheduled:srcs?srcs.size:0,bucket:bk?{y:bk.y,m:bk.mo,d:bk.d,hour:bk.hour}:null,
    pumpStarts:pumpStarts,announce:ann,held:heldNow};
}
A.state=state;

if(root) root.Air=A;
// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = A; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
