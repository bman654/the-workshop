/* Emit the FOOTPRINTS mirror block for sky.test.cjs from the live Layout solve,
   for the 12 catalog-tied ids the sky test checks. Also verifies star-clearance. */
const Layout = require('./layout.js');
const Sky = require('../sky/sky.js');
const C = Sky.CATALOG, STAR_PAD = 12;

const PLACES = [
  { id:'verse', district:'manor', tier:2, wing:'studies', footprint:'house-wing', order:10 },
  { id:'compositor', district:'manor', tier:2, wing:'studies', footprint:'house-wing', order:20 },
  { id:'cartographer', district:'manor', tier:2, wing:'studies', footprint:'house-wing', order:30 },
  { id:'sound-garden', district:'manor', tier:2, wing:'east', footprint:'house-wing', order:10 },
  { id:'threshold', district:'manor', tier:2, wing:'east', footprint:'east-wing', order:20 },
  { id:'clockwork', district:'manor', tier:2, wing:'maker', footprint:'clockwork' },
  { id:'aerodrome', district:'grounds', tier:1, wing:'aerospace', footprint:'launch-rail' },
  { id:'strange-garden', district:'grounds', tier:1, wing:'glasshouses', footprint:'glasshouse' },
  { id:'conservatory', district:'grounds', tier:2, wing:'conservatory', footprint:'glasshouse-wing' },
  { id:'hall-of-mirrors', district:'grounds', tier:1, wing:'optics', footprint:'hall' },
  { id:'numbers-room', district:'grounds', tier:2, wing:'number', footprint:'numbers-room' },
  { id:'daedalus', district:'grounds', tier:1, wing:'amusements', footprint:'maze', order:20 },
  { id:'arcade', district:'grounds', tier:1, wing:'amusements', footprint:'arcade', order:10 },
  { id:'engine-room', district:'grounds', tier:2, wing:'works', footprint:'engine', order:10 },
  { id:'alchemy', district:'grounds', tier:2, wing:'works', footprint:'laboratory', order:20 },
  { id:'firmament', district:'observatory', tier:1, footprint:'tower' },
  { id:'workbench', district:'outbuilding', tier:3, footprint:'shed' },
  { id:'physics-lab', district:'cavern', tier:1, footprint:'cave' },
  { id:'undercroft', district:'beneath', tier:3, footprint:'stair', locked:true },
];
const sol = Layout.solve(PLACES);
function bbox(id){
  let f = sol.foot[id];
  if(!f && id==='undercroft'){ f = Layout.beneathSlot(); }
  if(f.r != null) return { x: Math.round(f.x-f.r), y: Math.round(f.y-f.r), w: Math.round(f.r*2), h: Math.round(f.r*2) };
  return { x: Math.round(f.x), y: Math.round(f.y), w: Math.round(f.w), h: Math.round(f.h) };
}
// the 12 ids the sky test mirrors (front-door catalog stars), in the test's order
const MIRROR_IDS = ['verse','compositor','cartographer','sound-garden','threshold',
  'strange-garden','firmament','daedalus','arcade','workbench','undercroft','hall-of-mirrors'];

function starHit(s,b){ return s.x+STAR_PAD>b.x && s.x-STAR_PAD<b.x+b.w && s.y+STAR_PAD>b.y && s.y-STAR_PAD<b.y+b.h; }

console.log('const FOOTPRINTS = [');
let collide = 0;
for(const id of MIRROR_IDS){
  const b = bbox(id);
  let hits = [];
  for(const sid in C) if(starHit(C[sid], b)) hits.push(sid);
  if(hits.length){ collide++; console.error('  STAR COLLISION', id, '→', hits.join(',')); }
  const note = id==='firmament' ? '  // tower r→bbox' : id==='hall-of-mirrors' ? '  // the optics wing' : '';
  console.log(`  { id: '${id}',${' '.repeat(Math.max(1,16-id.length))} x: ${b.x},${' '.repeat(Math.max(1,5-String(b.x).length))} y: ${b.y},${' '.repeat(Math.max(1,4-String(b.y).length))} w: ${b.w},${' '.repeat(Math.max(1,4-String(b.w).length))} h: ${b.h} },${note}`);
}
console.log('];');
console.error(collide ? ('\n✗ '+collide+' star collisions') : '\n✓ all 12 mirror footprints star-clear');
