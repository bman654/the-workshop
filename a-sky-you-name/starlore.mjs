/* ═══════════════════════════════════════════════════════════════════════════
   starlore.mjs — THE STAR-LORE (the soul of "A Sky You Name")

   A christening + a two-line origin-myth couplet in an antique celestial-atlas
   voice, for a figure a visitor laced by hand out of the stars.

   The thesis: the words are a READING OF THE HAND, not a random myth stapled to
   a shape. The generator first READS the drawn polyline — pure geometry: how
   many stars, whether it closes into a loop, its silhouette, how many times the
   path turns back, how far it reaches, how straight it runs — and then christens
   + narrates FROM those traits. A ring earns a Crown / a Wheel / a thing that
   returns; a long taut stroke earns a Bearer / a Road / a wanderer who does not
   arrive; a tangle earns a Serpent / a Thorn / a knot that cannot rest. Every
   clause of the myth is licensed by a real trait of the figure, so the couplet
   is a CAPTION OF THE GESTURE — it cannot drift from the shape the hand drew.

   Determinism is the whole self-test: same (seed, normalized-points) → the same
   name + myth, byte-for-byte, forever. ONE PRNG stream, keyed off the seed AND a
   serialized reading of the shape (no Date / Math.random in here). A kept chart
   stores the SEED + the normalized points — never the rendered strings — and
   re-derives on re-ink; if a future edit widens the banks, bump GEN_VERSION so
   old kept charts can be re-derived under their own generation.

   Zero deps. Ported (verbatim in spirit) from cycle 407's explorer 1, with the
   classifier calibration the design called for:
     · the tangle turn-threshold lowered (turns>=2, not >=3) so a genuine zigzag
       reads as a tangle, not a bend;
     · a turn-ANGLE gate on the line/bend split (a stroke is only a "line" if it
       is BOTH taut AND barely bends — totalTurn small), so a wide reclining
       figure can never be christened a line/spear;
     · a hard silhouette override: a wide/reclining open figure resolves to a
       reclining FORM (never line), a tall/standing one to standing;
     · banks widened so a long KEEP session rarely repeats within one form.
   ═══════════════════════════════════════════════════════════════════════════ */

export const GEN_VERSION = 1;

/* ---------- PRNG — the house xmur3 + mulberry32 (verbatim from cartographers) */
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

/* ═══════════════════════════════════════════════════════════════════════════
   1. READ THE SHAPE — pure geometry → a small trait record the words read from.

   Input: an ordered list of laced star points [{x,y}, …], ALREADY normalized to
   the 0..1 field so the reading is resolution-independent (this is what makes a
   kept chart re-ink byte-identical — we store the normalized points, not pixels).
   ═══════════════════════════════════════════════════════════════════════════ */
export function readShape(pts){
  const n = pts.length;
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity, pathLen=0;
  for(const p of pts){ if(p.x<minx)minx=p.x; if(p.x>maxx)maxx=p.x; if(p.y<miny)miny=p.y; if(p.y>maxy)maxy=p.y; }
  for(let i=1;i<n;i++){ pathLen += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y); }
  const w = Math.max(1e-4, maxx-minx), h = Math.max(1e-4, maxy-miny);
  const diag = Math.hypot(w,h);
  const span = Math.hypot(pts[n-1].x-pts[0].x, pts[n-1].y-pts[0].y);  // start→end gap

  // CLOSED? — the last star returns near the first AND the walk enclosed real
  //   area (a single back-and-forth has span≈0 too, so require ≥4 stars + area).
  const gapFrac = span / (diag||1);
  const area = polyArea(pts);
  const closed = n>=4 && gapFrac < 0.28 && area > (w*h)*0.10;

  // WINDING — count sign changes of the turn (busy-ness) AND accumulate the
  //   TOTAL absolute turn angle (a smooth arc barely turns; a zigzag turns a lot).
  let turns=0, prevCross=0, totalTurn=0;
  for(let i=1;i<n-1;i++){
    const ax=pts[i].x-pts[i-1].x, ay=pts[i].y-pts[i-1].y;
    const bx=pts[i+1].x-pts[i].x, by=pts[i+1].y-pts[i].y;
    const cross = ax*by - ay*bx;
    const ang = Math.abs(Math.atan2(cross, ax*bx+ay*by));  // 0..π turn at this vertex
    totalTurn += ang;
    if(i>1 && Math.sign(cross)!==Math.sign(prevCross) && Math.abs(cross)>1e-5) turns++;
    if(Math.abs(cross)>1e-5) prevCross = cross;
  }

  // SILHOUETTE aspect — tall / wide / squarish.
  const ar = w/h;
  let aspect = "squared";
  if(ar > 1.5) aspect = "reclining";       // wide, low — a beast, a reach, a bridge
  else if(ar < 0.66) aspect = "standing";  // tall — a bearer, a spire, an upright figure

  const reach = diag;                                     // 0..1 of the field diagonal
  const straightness = closed ? 0 : Math.min(1, span / (pathLen||1)); // 1 = a taut stroke

  // ── classify a coarse FORM the words key off of (CALIBRATED) ──
  //   turn-ANGLE gate: a "line" must be BOTH taut (straightness high) AND barely
  //   bending (totalTurn small); a wide/reclining or tall/standing silhouette is
  //   resolved to its silhouette form so it can never be mis-christened a spear.
  const TAUT   = 0.80;   // straightness above this is "taut"
  const CALM   = 0.9;    // total turn (radians) below this is "barely bends"
  const BUSY   = 2;      // >= this many sign-changes is a genuine zigzag/tangle
  let form;
  if(closed){
    form = (turns>=2) ? "vessel" : "ring";   // a busy loop is a woven vessel; a clean loop a ring
  } else if(n<=2){
    form = "spark";                          // two stars — a pair, a gate, twins
  } else if(turns>=BUSY){
    form = "tangle";                         // a busy open figure — a serpent, a knot
  } else if(aspect==="reclining"){
    form = "reclining";                      // wide & low — a beast, a bridge; never a line
  } else if(aspect==="standing"){
    form = "standing";                       // tall & upright — a mast, a sentinel; never a line
  } else if(straightness > TAUT && totalTurn < CALM){
    form = "line";                           // taut AND calm — a true stroke / spear / road
  } else {
    form = "bend";                           // a gentle open arc — a hook, a horn, a leap
  }

  return { n, closed, turns, totalTurn:round(totalTurn), aspect, ar:round(ar),
           reach:round(reach), straightness:round(straightness), area:round(area), form };
}
function polyArea(pts){
  let a=0; for(let i=0;i<pts.length;i++){ const j=(i+1)%pts.length; a += pts[i].x*pts[j].y - pts[j].x*pts[i].y; }
  return Math.abs(a)/2;
}
function round(x){ return Math.round(x*1e4)/1e4; }

/* ═══════════════════════════════════════════════════════════════════════════
   2. THE WORD-BANKS — keyed to FORM. Every bank is tagged so the shape can only
   draw the fitting words. (Widened from explorer 1 so a long KEEP session rarely
   repeats within one form.)
   ═══════════════════════════════════════════════════════════════════════════ */
const FIGURE = {
  ring:    ["the Crown","the Wheel","the Ouroboros","the Diadem","the Unbroken Ring","the Sleeping Eye",
            "the Millstone","the Halo","the Round Well","the Turning Year","the Coiled Rope","the Sundial"],
  vessel:  ["the Chalice","the Net","the Cradle","the Cauldron","the Reliquary","the Hollow Vessel",
            "the Coiled Basket","the Lantern","the Woven Weir","the Deep Cup","the Snared Moon","the Fisher's Creel"],
  line:    ["the Bearer","the Long Road","the Spear","the Falling Oar","the Plumb-Line","the Ferryman's Pole",
            "the Sightline","the Unwavering Path","the Drawn Meridian","the Straight Furrow","the Long Mast","the Cast Line"],
  bend:    ["the Hook","the Horn","the Sickle","the Leaping Hound","the Drawn Bow","the Heron's Neck",
            "the Crooked Bough","the Wader","the Shepherd's Crook","the Broken Wave","the Bent Reed","the Curling Fern"],
  tangle:  ["the Serpent","the Thorn","the Wandering Knot","the Tangled Skein","the Restless Eel","the Bramble",
            "the Snared Hare","the Coil","the Lost Thread","the Briar","the Riddling Path","the Winding Adder"],
  spark:   ["the Twins","the Gate","the Two Sisters","the Ford","the Threshold","the Matched Lanterns",
            "the Yoked Oxen","the Parted Pair","the Two Lamps","the Standing Stones","the Facing Kings","the Crossed Oars"],
  squared: ["the Anvil","the Hearthstone","the Standing Table","the Cornerstone","the Keystone","the Founder's Mark",
            "the Old Forge","the Set Table","the Quarried Block","the Altar","the Millstone Square","the Waymark"],
  standing:["the Watchman","the Pilgrim","the Upright Reed","the Standing Stone","the Sentinel","the Lone Mast",
            "the Steadfast","the Waiting Figure","the Bell-Tower","the Kept Candle","the Tall Herald","the Unbowed"],
  reclining:["the Long Beast","the Sleeping Hound","the Low Bridge","the Resting Ox","the Fallen Colossus","the Weir",
            "the Reclining Giant","the Levee","the Drowsing Whale","the Long Barrow","the Spanning Arch","the Basking Seal"],
};
// an epithet for the whole; the shape LICENSES which pools are drawn from.
const ADJ = {
  many:  ["Ninefold","Manifold","Countless","Sevenfold","Uncounted","Thronged","Many-Lamped","Legion"],
  few:   ["Lone","Twin","Solitary","Sparse","Quiet","Spare","Scant","Bare"],
  wide:  ["Wandering","Far-Flung","Unbounded","Reaching","Sprawling","Wide-Cast","Boundless"],
  tight: ["Bound","Close-Held","Gathered","Knotted","Hidden","Near-Kept","Folded"],
  turn:  ["Restless","Winding","Sundered","Riven","Serpentine","Unquiet","Wayward"],
  calm:  ["Still","Silent","Untroubled","Steadfast","Sleeping","Becalmed","Patient"],
  neutral:["Elder","Veiled","Golden","Last","Ashen","Drowned","Gilded","Pale","Frost","Storm","Autumn","Nameless"],
};

/* MYTH CLAUSES — each keyed to a TRAIT, so the couplet is a reading, not a roll.
   Line 1 (a deed) is drawn from a pool matching the FORM; line 2 (a fate / turn)
   from a pool matching a SECONDARY trait (closed → returns; a line → does not
   arrive; many turns → could not rest; wide → strays; tight → keeps close). */
const DEED = {
  ring:   ["who bent one road until its end met its beginning",
           "who closed the circle so nothing true could leave it",
           "who wound the long night into a single turning wheel",
           "who set a ring of watch-fires that never breaks",
           "who gathered the whole horizon into one clasped hand"],
  vessel: ["who cupped what would not be held and held it still",
           "who wove a hollow to catch the falling light",
           "who carried the deep in a vessel of thin stars",
           "who kept, in a woven dark, the last of the tide",
           "who set a net for the moon and drew it up brimming"],
  line:   ["who carried one light down into the long dark",
           "who walked a single line and would not stray from it",
           "who laid one straight road across the trackless sky",
           "who set out along the meridian and kept going",
           "who cast one thread from shore to shore of the night"],
  bend:   ["who drew the bow of the horizon and let it rest",
           "who leapt the gap between two dark shores",
           "who crooked one arm around the falling year",
           "who followed the river's bend past the world's edge",
           "who hooked one star and hauled the dawn up after it"],
  tangle: ["who could not choose one path and so walked all of them",
           "who knotted the wind into a shape and lost the ends",
           "who wandered the sky and left this tangle for a trail",
           "who wrestled the dark and neither one let go",
           "who tied the four winds together and forgot the knot"],
  spark:  ["who stood at the ford and would not cross alone",
           "who kept faith across the gap that parted them",
           "who lit two lamps against one long night",
           "who were two, and were counted as one light",
           "who set one fire on either shore to speak across the water"],
  squared:["who laid the first stone and named the ground",
           "who set the anvil down where the road began",
           "who squared the corner of the turning world",
           "who founded a hearth no cold could put out",
           "who cut one true stone and built the rest to it"],
  standing:["who stood the whole night through and did not sit",
           "who kept the upright watch above the drowned coast",
           "who would not bow, though the sky leaned hard",
           "who waited, standing, for a ship that would not come",
           "who held one candle high until the morning found it"],
  reclining:["who lay down across the low horizon to rest",
           "who bridged the dark water and let the folk cross over",
           "who slept the length of the world and dreamed the tides",
           "who lay along the meridian, a beast the storm could not move",
           "who stretched out low and let the whole sky wheel above"],
};
const FATE = {
  closed:  ["and so returns, each turning of the year, exactly as it left",
            "and the folk say what it circled can never be lost",
            "and it holds its shape against every wheeling season",
            "and, being unbroken, it will not set until the sky does",
            "and comes round again to where it began, and asks nothing"],
  line:    ["and would not set it by, though the dark ran on without end",
            "and never arrives, and never turns back, and is honoured for it",
            "and walks it still, one patient star ahead of the last",
            "and the sailors steer by it, for it points the one true way",
            "and follows the one line given it to the world's cold edge"],
  turn:    ["and could not rest, and so was hung here to wander for good",
            "and is riven for its restlessness across the cold meridian",
            "and turns yet, they say, when no one keeps the watch",
            "and was scattered into faint lights for its wandering",
            "and winds on, having lost the way it meant to go"],
  wide:    ["and strays so far the eye must travel a season to trace it",
            "and reaches from the drowned coast to the gate of dawn",
            "and was set wide so the lost could find it from any shore",
            "and spans the night, that no traveller be without a mark",
            "and casts its far arm over half the wheeling dark"],
  tight:   ["and keeps close, a small light for the ones who look near",
            "and is gathered so tight the folk hold it to their chests",
            "and hides in a hand's breadth of sky, for the faithful only",
            "and burns quiet and near, and asks to be looked for",
            "and folds itself small, that it might not be lost"],
  bright:  ["and burns brightest on the longest night, a memory of the faithful",
            "and is the first light the shepherds name at dusk",
            "and was lifted whole into the dark, still lit",
            "and rises gold at the turning of the year",
            "and answers, every clear night, to the one who names it"],
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. THE GENERATOR — christen + narrate FROM the shape reading.
   nameSky(seed, pts) → { name, designation, key, myth:[l1,l2], traits, figKey,
                          fateKey, sig, version }
   Deterministic: same (seed, pts) → identical everything.
   ═══════════════════════════════════════════════════════════════════════════ */
export function nameSky(seed, pts){
  const t = readShape(pts);
  // ONE PRNG stream, keyed off the seed AND the shape's own reading (serialized
  // deterministically), so identical (seed, shape) reproduce identically and two
  // different figures on one sky-seed still diverge. GEN_VERSION guards the key so
  // a future bank edit can be re-derived under its own generation.
  const rng = makeRng(seed + "::lore/v" + GEN_VERSION + "::" + t.form + ":" + t.n + ":" + (t.closed?1:0)
                      + ":" + t.turns + ":" + t.aspect + ":" + t.ar + ":" + t.reach + ":" + t.straightness);
  const pick = (arr)=> arr[(rng()*arr.length)|0];

  // ---- the figure noun: the shape's silhouette may override the form's icon ----
  let figKey = t.form;
  if(!t.closed && t.form!=="spark"){
    if(t.aspect==="standing" && t.form!=="tangle" && rng()<0.6) figKey="standing";
    else if(t.aspect==="reclining" && t.form!=="tangle" && rng()<0.6) figKey="reclining";
    else if(t.form==="squared") figKey="squared";
  }
  const figure = pick(FIGURE[figKey] || FIGURE.line);        // e.g. "the Crown"

  // ---- the christened NAME: sometimes plain, sometimes an earned epithet ----
  const adjBank = [];
  if(t.n>=7) adjBank.push(...ADJ.many); else if(t.n<=3) adjBank.push(...ADJ.few);
  if(t.reach>0.62) adjBank.push(...ADJ.wide); else if(t.reach<0.34) adjBank.push(...ADJ.tight);
  if(t.turns>=2) adjBank.push(...ADJ.turn); else if(t.turns===0) adjBank.push(...ADJ.calm);
  adjBank.push(...ADJ.neutral);
  const r = rng();
  const barePart = figure.replace(/^the /i,"");
  const name = (r < 0.5) ? ("The " + pick(adjBank) + " " + barePart)   // "The <adj> <Figure>"
                         : ("The " + barePart);                        // plain "The <Figure>"

  // ---- catalogue designation (α <Key>ae), firmament's genitive idiom ----
  const greek = ["α","β","γ","δ","ε","ζ","η","θ"];
  const key = barePart.split(" ").pop();
  const designation = greek[(rng()*greek.length)|0] + " " + genitive(key);

  // ---- the two-line myth: line 1 keyed to FORM, line 2 to a secondary trait ----
  const l1deed = pick(DEED[figKey] || DEED.line);
  let fateKey;
  if(t.closed) fateKey = "closed";
  else if(t.form==="line") fateKey = (rng()<0.6 ? "line" : "wide");
  else if(t.turns>=2) fateKey = "turn";
  else if(t.reach>0.62) fateKey = "wide";
  else if(t.reach<0.34) fateKey = "tight";
  else fateKey = pick(["bright","tight","wide"]);
  const l2fate = pick(FATE[fateKey]);

  const line1 = name + " — " + l1deed + ",";
  const line2 = l2fate + ".";

  // ---- signature: the byte-comparable string the KEEP / re-ink test compares ----
  const sig = [GEN_VERSION, name, designation, line1, line2, figKey, fateKey].join("¶");

  return { name, designation, key, myth:[line1, line2], traits:t, figKey, fateKey, sig, version:GEN_VERSION };
}

/* firmament's Latinish genitive, verbatim in spirit */
function genitive(key){
  const w = key.toLowerCase();
  const cap = s=> s.charAt(0).toUpperCase()+s.slice(1);
  if(/e$/.test(w))      return cap(w.slice(0,-1))+"ae";
  if(/[aiou]$/.test(w)) return cap(w)+"e";
  if(/(s|x)$/.test(w))  return cap(w)+"is";
  if(/n$/.test(w))      return cap(w)+"is";
  return cap(w)+"ae";
}
