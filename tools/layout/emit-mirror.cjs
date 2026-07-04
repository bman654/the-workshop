/* Emit the FOOTPRINTS mirror block for sky.test.cjs from the live Layout solve.

   The mirror MUST match the REAL front-door solve, which packs EVERY manor/grounds
   room — not a subset. So this reads the actual PLACES array straight out of
   index.src.html (the single source of truth) and solves THAT, then prints the
   bbox of each catalog-tied id the sky test checks. Reading the real PLACES means
   adding/removing any room can never silently drift the mirror from reality.

   Run:  node tools/layout/emit-mirror.cjs   (paste the block into sky.test.cjs) */
const fs = require('fs');
const path = require('path');
const Layout = require('./layout.js');
const Sky = require('../sky/sky.js');
const C = Sky.CATALOG, STAR_PAD = 12;

/* read the real PLACES literal from index.src.html and evaluate it (a pure data
   array — no functions, no side effects). */
const SRC = path.join(__dirname, '..', '..', 'index.src.html');
const src = fs.readFileSync(SRC, 'utf8');
const start = src.indexOf('const PLACES = [');
const end = src.indexOf('\n];', start);
if (start < 0 || end < 0) { console.error('emit-mirror: could not find PLACES array'); process.exit(1); }
const arrText = src.slice(start + 'const PLACES = '.length, end + 2);
// eslint-disable-next-line no-eval
const PLACES = eval('(' + arrText + ')');

const sol = Layout.solve(PLACES);
function bbox(id){
  let f = sol.foot[id];
  if(!f && id==='undercroft'){ f = Layout.beneathSlot(); }
  if(!f){ console.error('emit-mirror: no footprint for ' + id); process.exit(1); }
  if(f.r != null) return { x: Math.round(f.x-f.r), y: Math.round(f.y-f.r), w: Math.round(f.r*2), h: Math.round(f.r*2) };
  return { x: Math.round(f.x), y: Math.round(f.y), w: Math.round(f.w), h: Math.round(f.h) };
}
// the footprint ids the sky test mirrors — a wheel-SPANNING subset (§3.4 step 3:
// one id per district so a stray star anywhere on the polar ring is caught): manor,
// gardens, observatory, opticks, promenades, number, works, approach, cavern,
// outbuilding + the basement slot. (fairground is a DETACHED gate — no room foot to
// mirror.) Keep in lockstep with sky.test.cjs's FOOTPRINTS block.
// W2.8 GATHERED off the map — no live PLACES footprint — so retired from the mirror
// in T6.1b: the-sightline (observatory), refraction-run (opticks), hexapawn (number).
// number's seat is held by numbers-room (its remaining footed anchor) so the wheel
// stays spanning; observatory/opticks still ride firmament/hall-of-mirrors.
const MIRROR_IDS = ['verse','compositor','cartographer','sound-garden','threshold',
  'strange-garden','firmament','hall-of-mirrors',
  'gnomon','holonomy','numbers-room','lodestone-hall','card-catalog','estate-gate',
  'physics-lab','workbench','undercroft'];

function starHit(s,b){ return s.x+STAR_PAD>b.x && s.x-STAR_PAD<b.x+b.w && s.y+STAR_PAD>b.y && s.y-STAR_PAD<b.y+b.h; }

const notes = {
  firmament: '  // observatory tower r→bbox',
  'hall-of-mirrors': '  // opticks — the Hall the feat-stars ring beside',
  gnomon: '  // promenades — The Hours sundial',
  holonomy: '  // promenades — Curved Country',
  'numbers-room': '  // number — the Numbers Room',
  'lodestone-hall': '  // works — electromagnetism',
  'card-catalog': '  // approach — the gatehouse register',
  'estate-gate': '  // approach — the gate lodge',
  'physics-lab': '  // cavern — the physics grotto',
  workbench: '  // outbuilding — the shed',
  undercroft: '  // manor basement (beneathSlot)'
};

console.log('const FOOTPRINTS = [');
let collide = 0;
for(const id of MIRROR_IDS){
  const b = bbox(id);
  let hits = [];
  for(const sid in C) if(starHit(C[sid], b)) hits.push(sid);
  if(hits.length){ collide++; console.error('  STAR COLLISION', id, '→', hits.join(',')); }
  const note = notes[id] || '';
  console.log(`  { id: '${id}',${' '.repeat(Math.max(1,16-id.length))} x: ${b.x},${' '.repeat(Math.max(1,5-String(b.x).length))} y: ${b.y},${' '.repeat(Math.max(1,4-String(b.y).length))} w: ${b.w},${' '.repeat(Math.max(1,4-String(b.w).length))} h: ${b.h} },${note}`);
}
console.log('];');
console.error(collide ? ('\n✗ '+collide+' star collisions') : ('\n✓ all '+MIRROR_IDS.length+' mirror footprints star-clear (museum star checked too)'));
