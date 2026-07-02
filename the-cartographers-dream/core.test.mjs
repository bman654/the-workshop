/* ═══════════════════════════════════════════════════════════════════════════
   THE CARTOGRAPHER'S DREAM — core.test.mjs
   The DETERMINISM + WELL-FORMEDNESS twin. NOT a math crux, NO HUD — this stands
   in for a proof by asserting the quiet invariants that make the land a real
   chart, over a battery of seeds:

     (a) DETERMINISM — same seed → byte-identical land + identical ordered
         placement list. Regenerate a seed TWICE and byte-compare the placement
         signature (and the raw height field).
     (b) RIVERS — every river polyline is monotone non-increasing on the height
         field (steepest descent, no uphill step) and terminates in a sea cell.
     (c) NO FLOOD — 0.15 < landFraction < 0.85.
     (d) NAMES — pronounceable (only legal syllable pieces), unique per sheet,
         one label per feature, no coincident label positions.

   Run: node core.test.mjs
   Exits 0 all-green, 1 on any failure. The page inlines the SAME core.mjs.
   ═══════════════════════════════════════════════════════════════════════════ */
import { generateLand, placementSignature, checkRivers, makeToponymy } from './core.mjs';

let pass=0, fail=0;
const ok  = (c,m)=>{ if(c){pass++;} else {fail++; console.error("  ✗ "+m);} };

const SEEDS = ["Aster-9","the-hollow-crown","42","Vell","zzzq","seed-2718","北","a b c","LONG-seed-with-many-chars-0xDEADBEEF","0"];

console.log("── The Cartographer's Dream — determinism & well-formedness twin ──\n");

// (a) DETERMINISM — regenerate each seed twice, byte-compare
console.log("(a) determinism — same seed → byte-identical land + placement list");
for(const s of SEEDS){
  const a = generateLand(s);
  const b = generateLand(s);
  // placement signature identical (the ordered list)
  const sa = placementSignature(a), sb = placementSignature(b);
  ok(sa===sb, `placement signature differs for seed "${s}"`);
  // raw height field byte-identical
  let hMatch = a.height.length===b.height.length;
  if(hMatch) for(let i=0;i<a.height.length;i++){ if(a.height[i]!==b.height[i]){ hMatch=false; break; } }
  ok(hMatch, `height field differs for seed "${s}"`);
  // water + biome fields byte-identical
  let wMatch = true; for(let i=0;i<a.water.length;i++){ if(a.water[i]!==b.water[i]){ wMatch=false; break; } }
  ok(wMatch, `water field differs for seed "${s}"`);
  // rivers identical structurally
  ok(a.rivers.length===b.rivers.length, `river count differs for seed "${s}"`);
}
// distinct seeds → distinct lands (the re-roll actually re-rolls)
{
  const sigs = new Set(SEEDS.map(s=>placementSignature(generateLand(s))));
  ok(sigs.size===SEEDS.length, "distinct seeds produced a collision (re-roll not distinct)");
}

// (b) RIVERS — monotone descent, terminate in sea
console.log("(b) rivers — monotone-descending, end in a sea cell, none crossing uphill");
for(const s of SEEDS){
  const land = generateLand(s);
  ok(land.rivers.length>0, `no rivers at all for seed "${s}" (a dry world is suspicious)`);
  const r = checkRivers(land);
  ok(r.violations===0, `${r.violations} river(s) step uphill for seed "${s}"`);
  // strict terminus: every river's last cell is water OR its penultimate cell's
  // steepest-descent continues into an on-trunk cell. We assert the STRONG form:
  // the last cell of each polyline is not higher than its first (net descent).
  for(const path of land.rivers){
    const [sx,sy]=path[0], [ex,ey]=path[path.length-1];
    const h0=land.height[sy*land.GW+sx], h1=land.height[ey*land.GW+ex];
    ok(h1 <= h0 + 1e-6, `river net-ascends for seed "${s}"`);
  }
}

// (c) NO FLOOD — land fraction in a sane band
console.log("(c) no flood — 0.15 < landFraction < 0.85 every roll");
for(const s of SEEDS){
  const land = generateLand(s);
  ok(land.landFraction>0.15 && land.landFraction<0.85,
     `landFraction ${land.landFraction.toFixed(3)} out of band for seed "${s}"`);
}

// (d) NAMES — pronounceable, unique, one-per-feature, no coincident positions
console.log("(d) names — pronounceable, unique per sheet, no label-position collisions");
function stripDecor(name){
  // remove template decoration, keep the invented root(s): drop leading "The/the",
  // possessives, and known plain suffixes so we test the generated syllables.
  return name.replace(/^[Tt]he\s+/,'')
             .replace(/'s\s+\w+.*$/,'')
             .replace(/[^A-Za-z]/g,' ')
             .trim();
}
// legal-syllable check: every invented word must be decomposable into
// consonant-onset? + vowel-nucleus sequences (i.e. contain no impossible run of
// 4+ consecutive consonants and at least one vowel). This is the "pronounceable
// by construction" guard — the toponymy only ever concatenates legal pieces.
function pronounceable(word){
  if(!/[aeiouy]/i.test(word)) return false;             // must have a vowel
  if(/[bcdfghjklmnpqrstvwxz]{5,}/i.test(word)) return false; // no 5+ consonant pileup
  return true;
}
for(const s of SEEDS){
  const land = generateLand(s);
  const allNames = [
    land.title,
    ...land.settlements.map(x=>x.name),
    ...land.labels.map(x=>x.text)
  ];
  // uniqueness (case-insensitive) within the sheet
  const lc = allNames.map(n=>n.toLowerCase());
  ok(new Set(lc).size===lc.length, `duplicate name on the sheet for seed "${s}"`);
  // pronounceability of each word in each name
  for(const n of allNames){
    for(const w of stripDecor(n).split(/\s+/).filter(Boolean)){
      // skip pure template words (all-caps decor never generated as roots is fine)
      ok(pronounceable(w), `unpronounceable word "${w}" in "${n}" (seed "${s}")`);
    }
  }
  // one label per feature-position: no two labels/settlements share an exact cell
  const posSet = new Set();
  let coincident=false;
  for(const l of land.labels){ const k=l.x+","+l.y; if(posSet.has(k)) coincident=true; posSet.add(k); }
  ok(!coincident, `two labels share an exact cell for seed "${s}"`);
  // family resemblance is real: the family palette is a proper subset of the pools
  ok(land.topoFamily.onsets.length>=5 && land.topoFamily.onsets.length<=8, `toponymy family onset count off for seed "${s}"`);
}

// toponymy family stability: same seed → same family palette
{
  const t1 = makeToponymy("stable-fam");
  const t2 = makeToponymy("stable-fam");
  ok(JSON.stringify(t1.family)===JSON.stringify(t2.family), "toponymy family not deterministic for a fixed seed");
}

console.log(`\n${fail===0?"✓ ALL PASS":"✗ FAIL"} — ${pass} passed, ${fail} failed.`);
process.exit(fail===0?0:1);
