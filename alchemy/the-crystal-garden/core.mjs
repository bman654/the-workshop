/* ============================================================================
   ALCHEMY LAB · THE CRYSTAL GARDEN — core.mjs   (the SOLE growth authority)

   Drop a grain of metal salt into a jar of water-glass (sodium silicate) and a
   hollow, coloured mineral tube seeps UP through its own semipermeable membrane:
   the grain dissolves, a gelatinous silicate skin forms around it, water osmoses
   IN, the skin balloons and bursts upward, and a new skin forms at the breach —
   over and over, so a tube CLIMBS. These are the old chemists' "silica gardens."

   This file is the pure, DOM-free MODEL. A garden is plain serialisable data;
   `step(g)` advances it one tick using the garden's OWN seeded RNG stream (so a
   garden is fully reproducible AND resumable). The SAME step() drives the live
   canvas and the headless liveness twin — the payoff (tubes climb & branch) is
   provable without a screen, and a saved garden resumes bit-for-bit.

   IT MAKES NO THEOREM. It is a delight — slow, colourful, alive. What it DOES owe
   (a payoff piece owes a liveness twin, not a proof) is that the payoff FIRES.
   Three liveness facts hold BY CONSTRUCTION and are asserted in `core.test.mjs`:

     (A) MONOTONE GROWTH — for every shipped salt, a floor-seeded tube's climbed
         HEIGHT and its BRANCH-COUNT are non-decreasing at EVERY tick and strictly
         greater at the end. Height is a running max of (seedY − tipY); rise is
         ALWAYS ≥ 0 (osmosis only pushes up); branchCount is increment-only. So
         neither can regress — it is true by the shape of the code, not by luck.

     (B) THE DEGENERATE CASE — a grain nucleated in the top meniscus band has
         almost no water column above it to draw up, so it accretes ~nothing: a
         stunted stub. `colFactor` (the drawable head of silicate above a tip)
         goes to 0 in the dead band, rise goes to exactly 0, and the stub's
         climbed height stays 0. WHERE you drop the grain is a real mechanic.

     (C) DETERMINISTIC RESUME — each garden carries its own mulberry32 state on
         the object, so `serialize(g)` (= JSON) captures EVERYTHING including the
         RNG. `restore(json)` rebuilds it; the restored garden keeps growing
         bit-for-bit identically to the original. A returning visitor resumes at
         exactly the grown jar.
   ============================================================================ */

/* ── constants ──────────────────────────────────────────────────────────────── */
export const MAX_TIPS = 14;      // per-garden thicket cap (crowd, don't explode)
export const DEAD_BAND = 18;     // px below the meniscus where no column remains to draw up
export const RAMP = 48;          // px over which the drawable column (colFactor) ramps 0→1

/* the five apothecary salts — each with its own GROWTH HABIT so the silhouettes
   read distinct at a glance. colours are the real crack-colours of a silica garden. */
export const SALTS = [
  // cobalt — SPINDLY & TALL: fast rise, low sway, straight, rare & sparse forks
  { id:'cobalt', name:'Cobalt', formula:'CoCl₂', core:'#3f63e6', edge:'#9db4ff', glow:'#4a6ff0',
    rise:1.02, jitter:0.18, sway:3.4, thr:34, forkProb:0.14, taper:0.9976, tipW:3.4 },
  // iron — GNARLED: high lateral jitter, medium forks, a knotted wander
  { id:'iron', name:'Iron', formula:'FeCl₃', core:'#b8481f', edge:'#f0975f', glow:'#d5602c',
    rise:0.80, jitter:0.60, sway:5.6, thr:22, forkProb:0.40, taper:0.9950, tipW:4.4 },
  // copper — BUSHY & LOW: short rise, low branch threshold, high double-fork chance
  { id:'copper', name:'Copper', formula:'CuSO₄', core:'#1f9464', edge:'#74e6ac', glow:'#28b878',
    rise:0.60, jitter:0.34, sway:4.0, thr:14, forkProb:0.60, taper:0.9922, tipW:4.6 },
  // nickel — BALANCED: an even, jade middle habit
  { id:'nickel', name:'Nickel', formula:'NiCl₂', core:'#2fa9a0', edge:'#82ecdf', glow:'#3fc9bb',
    rise:0.82, jitter:0.30, sway:3.6, thr:22, forkProb:0.30, taper:0.9956, tipW:4.0 },
  // manganese — DELICATE: thin, low sway, patient & fine
  { id:'manganese', name:'Manganese', formula:'MnCl₂', core:'#c85992', edge:'#f3a9cd', glow:'#e070a8',
    rise:0.74, jitter:0.22, sway:2.8, thr:28, forkProb:0.22, taper:0.9966, tipW:3.2 },
];

export function saltById(id){ for(var i=0;i<SALTS.length;i++) if(SALTS[i].id===id) return SALTS[i]; return SALTS[0]; }

/* ── the garden's own reproducible RNG (mulberry32, state ON the object) ───────
   Storing the 32-bit state on the garden (not in a closure) is what makes a
   garden serialisable AND resumable: serialize() captures rngState, so the
   restored garden's stream continues from exactly where it left off. */
export function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

export function rngNext(g){
  var a = g.rngState|0;
  a = a + 0x6D2B79F5 | 0;
  g.rngState = a;
  var t = Math.imul(a ^ a>>>15, 1|a);
  t = t + Math.imul(t ^ t>>>7, 61|t) ^ t;
  return ((t ^ t>>>14) >>> 0) / 4294967296;
}

/* ── seed a garden: one grain at (x, y) inside a jar spanning [jx, jx+jw],
   floor at floorY, meniscus ceiling at ceilY, with its own RNG seed. ──────────── */
export function seedGarden(salt, x, y, jx, jw, floorY, ceilY, seed){
  var s = (typeof salt === 'string') ? saltById(salt) : salt;
  return {
    salt: s, saltId: s.id,
    jx: jx, jw: jw, floorY: floorY, ceilY: ceilY, seedY: y,
    rngState: (seed>>>0),
    tips: [ { x:x, y:y, vx:0, w: s.tipW, pts:[{x:x,y:y}], alive:true, riseSince:0, thr:s.thr, born:0 } ],
    branchCount: 1,   // the trunk counts as branch #1
    maxHeight: 0,     // running max of climbed height — MONOTONE by construction
    age: 0
  };
}

/* one tick of osmotic upwelling. rise is ALWAYS ≥ 0 (the membrane can only be
   pushed UP), scaled by colFactor — the drawable silicate column above the tip.
   In the dead band under the meniscus colFactor→0, so a too-high grain accretes
   nothing. maxHeight can only grow; branchCount can only increment. */
export function step(g){
  g.age++;
  var s = g.salt || saltById(g.saltId);
  var alive = 0, i;
  for(i=0;i<g.tips.length;i++) if(g.tips[i].alive) alive++;
  var born = [];
  for(i=0;i<g.tips.length;i++){
    var t = g.tips[i];
    if(!t.alive) continue;
    // buoyant lateral wander (per-salt jitter shapes the silhouette), damped
    t.vx += (rngNext(g)-0.5)*s.jitter;
    t.vx *= 0.85;
    if(t.vx>1.15) t.vx=1.15; if(t.vx<-1.15) t.vx=-1.15;
    // the drawable column above this tip — 0 in the meniscus dead band, ramping to 1
    var head = t.y - g.ceilY;
    var colFactor = (head - DEAD_BAND) / RAMP;
    if(colFactor < 0) colFactor = 0; else if(colFactor > 1) colFactor = 1;
    // upwelling: always positive, faded by the available column
    var rise = s.rise * (0.6 + rngNext(g)*0.55) * colFactor;
    t.x += t.vx * Math.max(0.15, colFactor);   // wander fades with the column too
    t.y -= rise;
    t.riseSince += rise;
    t.w = Math.max(0.75, t.w * s.taper);
    t.pts.push({x:t.x, y:t.y});
    var h = g.seedY - t.y;                       // climbed height from the seed point
    if(h > g.maxHeight) g.maxHeight = h;         // MONOTONE
    // keep inside the glass walls (gentle bounce)
    if(t.x < g.jx+7){ t.x = g.jx+7; t.vx = Math.abs(t.vx)*0.5; }
    if(t.x > g.jx+g.jw-7){ t.x = g.jx+g.jw-7; t.vx = -Math.abs(t.vx)*0.5; }
    // branch at a personal rise-milestone — but only where there is column to build
    if(t.riseSince > t.thr && alive < MAX_TIPS && colFactor > 0.05){
      t.riseSince = 0;
      t.thr = s.thr * (0.7 + rngNext(g)*0.7);
      var doubleFork = (rngNext(g) < s.forkProb && alive < MAX_TIPS-1);
      var nChild = doubleFork ? 2 : 1;
      for(var f=0; f<nChild; f++){
        var lean = (0.3 + rngNext(g)*0.9) * (rngNext(g)<0.5 ? 1 : -1);
        born.push({ x:t.x, y:t.y, vx:t.vx*0.4 + lean, w: Math.max(1.0, t.w*0.82),
                    pts:[{x:t.x,y:t.y}], alive:true, riseSince:0, thr:s.thr*(0.7+rngNext(g)*0.7), born:g.age });
        g.branchCount++;                          // MONOTONE (increment-only)
        alive++;
      }
    }
    // termination: reach the meniscus, thin out, or a rare stall. the ROOT trunk
    // (born 0) is immortal to the random stall, so every planted grain that HAS a
    // column is guaranteed to climb & branch; side-branches thin naturally.
    if(t.y < g.ceilY + DEAD_BAND - 2 || t.w <= 0.78){ t.alive=false; alive--; }
    else if(t.born > 0 && rngNext(g) < 0.0022){ t.alive=false; alive--; }
  }
  for(i=0;i<born.length;i++) g.tips.push(born[i]);
  return g;
}

/* ── serialisation: a garden is plain data, so JSON captures EVERYTHING (incl. the
   RNG state). restore() drops the non-serialised salt back onto the object. ──── */
export function serialize(g){
  return JSON.stringify({
    saltId: g.saltId, jx: g.jx, jw: g.jw, floorY: g.floorY, ceilY: g.ceilY, seedY: g.seedY,
    rngState: g.rngState, tips: g.tips, branchCount: g.branchCount, maxHeight: g.maxHeight,
    age: g.age, seedPhase: g.seedPhase
  });
}
export function restore(json){
  var o = (typeof json === 'string') ? JSON.parse(json) : json;
  o.salt = saltById(o.saltId);
  return o;
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE LIVENESS TWIN — headless, register-appropriate (proves the PAYOFF fires,
   NOT a theorem). Shared verbatim between the Node twin and the in-page pill.
   ═══════════════════════════════════════════════════════════════════════════ */

var TWIN_JAR = { jx:40, jw:320, floorY:300, ceilY:20 };

/* grow one floor-seeded garden of `saltId` for `steps` ticks; report monotonicity
   and whether the payoff (height & branches) actually grew. */
export function growthReport(saltId, seed, steps){
  var g = seedGarden(saltId, 180, TWIN_JAR.floorY, TWIN_JAR.jx, TWIN_JAR.jw, TWIN_JAR.floorY, TWIN_JAR.ceilY, seed);
  var lastH = g.maxHeight, lastB = g.branchCount, monoH = true, monoB = true;
  for(var s=0; s<steps; s++){
    step(g);
    if(g.maxHeight < lastH) monoH = false;
    if(g.branchCount < lastB) monoB = false;
    lastH = g.maxHeight; lastB = g.branchCount;
  }
  return { saltId:saltId, monoHeight:monoH, monoBranch:monoB,
    heightGrew: g.maxHeight > 24, branchGrew: g.branchCount > 1,
    height: Math.round(g.maxHeight), branches: g.branchCount, tips: g.tips.length,
    bounded: g.tips.filter(function(t){return t.alive;}).length <= MAX_TIPS };
}

/* the DEGENERATE / neg-liveness case: a grain nucleated in the meniscus dead band
   accretes ~nothing while a floor-seeded one of the same salt climbs. */
export function degenerateReport(saltId, seed, steps){
  var deadY = TWIN_JAR.ceilY + 8;    // inside the dead band — no column above it
  var d = seedGarden(saltId, 180, deadY, TWIN_JAR.jx, TWIN_JAR.jw, TWIN_JAR.floorY, TWIN_JAR.ceilY, seed);
  for(var s=0; s<steps; s++) step(d);
  var live = growthReport(saltId, seed, steps);
  return { stubHeight: d.maxHeight, stubBranches: d.branchCount,
    stubFlat: d.maxHeight < 1, stubUnbranched: d.branchCount === 1,
    floorHeight: live.height };
}

/* DETERMINISTIC RESUME: grow, serialize→restore (assert byte-identical), then keep
   BOTH growing and assert they stay bit-for-bit identical. */
export function resumeReport(saltId, seed, grow, more){
  var g = seedGarden(saltId, 160, TWIN_JAR.floorY, TWIN_JAR.jx, TWIN_JAR.jw, TWIN_JAR.floorY, TWIN_JAR.ceilY, seed);
  for(var s=0; s<grow; s++) step(g);
  var snap = serialize(g);
  var g2 = restore(snap);
  var snap2 = serialize(g2);
  var byteIdentical = (snap === snap2);
  for(var k=0; k<more; k++){ step(g); step(g2); }
  var growsSame = (serialize(g) === serialize(g2));
  return { byteIdentical: byteIdentical, growsSame: growsSame,
    afterHeight: Math.round(g.maxHeight), afterBranches: g.branchCount };
}

/* run the WHOLE liveness suite over all five shipped salts + the degenerate case
   + resume. Returns { checks, pass, total } — the shape both the pill and the
   Node twin consume. */
export function runLiveness(){
  var checks = [];
  function ck(name, ok, info){ checks.push({ name:name, ok:!!ok, info:info||'' }); }
  var seeds = [1, 7, 42, 101, 2718];
  // (A) monotone growth + payoff-fires across ALL FIVE salts × several seeds
  var allMono = true, allGrew = true, minH = 1e9, minB = 99, worstSalt = '';
  for(var i=0;i<SALTS.length;i++){
    for(var j=0;j<seeds.length;j++){
      var r = growthReport(SALTS[i].id, seeds[j], 240);
      if(!r.monoHeight || !r.monoBranch) allMono = false;
      if(!r.heightGrew || !r.branchGrew){ allGrew = false; worstSalt = SALTS[i].id; }
      if(r.height < minH) minH = r.height;
      if(r.branches < minB) minB = r.branches;
    }
  }
  ck('height & branch-count never regress — all 5 salts × 5 seeds × 240 ticks', allMono);
  ck('every salt climbs AND branches (payoff fires)', allGrew, worstSalt?('weakest: '+worstSalt):'min '+minH+'px, '+minB+' tubes');
  ck('every garden reaches ≥2 tubes ('+minB+' min) and climbs ('+minH+'px min)', minB>=2 && minH>24);
  // (B) the degenerate meniscus-band seed accretes ~nothing while the floor seed climbs
  var degOk = true, degInfo = '';
  for(var d=0;d<SALTS.length;d++){
    var dr = degenerateReport(SALTS[d].id, 55, 240);
    if(!(dr.stubFlat && dr.stubUnbranched && dr.floorHeight > 24)) { degOk = false;
      degInfo = SALTS[d].id+': stub '+dr.stubHeight.toFixed(2)+'px vs floor '+dr.floorHeight+'px'; }
  }
  ck('a grain seeded in the meniscus band stays a flat stub (neg-liveness) while a floor grain climbs', degOk, degInfo);
  // (C) deterministic resume: serialize→restore byte-identical AND keeps growing bit-for-bit
  var resOk = true, resGrows = true, resInfo = '';
  for(var m=0;m<SALTS.length;m++){
    var rr = resumeReport(SALTS[m].id, 314+m, 120, 60);
    if(!rr.byteIdentical) resOk = false;
    if(!rr.growsSame){ resGrows = false; resInfo = SALTS[m].id; }
  }
  ck('serialize→restore is byte-identical (the RNG state travels in the JSON)', resOk);
  ck('a restored garden keeps growing BIT-for-bit identically (deterministic resume)', resGrows, resInfo);
  // a fresh seed nucleates exactly where it was dropped, with one trunk
  var g0 = seedGarden('cobalt', 100, 300, 40, 320, 300, 20, 5);
  ck('a fresh grain nucleates at the drop point with a single trunk', g0.tips[0].y===300 && g0.maxHeight===0 && g0.branchCount===1 && g0.seedY===300);

  var pass = checks.filter(function(c){return c.ok;}).length;
  return { checks:checks, pass:pass, total:checks.length };
}

/* CommonJS guard so a Node twin can require() this if ever needed (forge strips it on inline) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MAX_TIPS, DEAD_BAND, RAMP, SALTS, saltById, mulberry32, rngNext, seedGarden, step,
    serialize, restore, growthReport, degenerateReport, resumeReport, runLiveness,
  };
}
