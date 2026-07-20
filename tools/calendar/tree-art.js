/* ═══════════════════════════════════════════════════════════════════════════
   tree-art.js — THE AVENUE TREE, in one place.

   The front door dresses its avenue in engraved trees: a thin forked trunk that
   is always there, a seasonal crown fitted so it never washes over a label, a
   sparse full-opacity snow cap, spring blossom, autumn leaves falling. The
   Almanac's centre panel PREVIEWS what the estate wears on the day under your
   pointer — and it used to preview those trees as three plain circles, left over
   from an early iteration. Three dots do not look like trees, so the preview was
   not a preview: it was a lie about the thing it claimed to show, and the only
   reason it could tell that lie is that it drew its own art.

   So the art lives HERE, and both draw from it. The door draws them at world
   scale down its avenue; the swatch draws the same functions at s≈0.3 in a
   44×26 box. Neither owns the tree, so the preview cannot drift from the real
   dressing again — a change to the crown is a change to both, by construction.

   THE INK is here too (TREE/SNOW/SPRING/AUTUMN). §8.4-(k): every element is
   drawn in the subdued seasonal tokens, NEVER primary brass, so the decoration
   recedes behind the estate's own ink; and none of it emits <text> (§8.4-(a)).

   `mk(name, attrs)` is the caller's SVG element factory — the door's `el`, the
   Almanac's `E` — so this module never touches the document itself and stays a
   dual-use classic script that loads cleanly in Node.

   GEOMETRY. `s` scales the parts with FIXED extents (the trunk's 30 units, the
   crown's CYC lift above the trunk foot); `r` is the FITTED crown radius in
   final units, and the crown's own decorations scale by r/CR off it — exactly as
   they always did. At s=1 and any r this emits byte-identical path data to the
   front door's previous inline craft; that is what makes the extraction safe.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(root){
'use strict';
var T={};

// the ink — subdued seasonal tokens, never primary brass (§8.4-(k))
T.TREE='#6f6038'; T.SNOW='#c2ccd8'; T.SPRING='#cf8aa2'; T.AUTUMN='#c47a42';
// full crown half-extent · min fitted radius · crown centre above the trunk foot
T.CR=18; T.CRMIN=8; T.CYC=30;

function fx(v){ return (+v).toFixed(2); }
function P(cx,cy,dx,dy){ return fx(cx+dx)+' '+fx(cy+dy); }
T.fx=fx; T.P=P;

/* the crown blob at a FITTED radius r (centre at cy-CYC*s; rx≈0.9r, ry≈0.85r
   matches the full CR=18 blob's 16×15 half-extents). A reduced crown still
   carries the season near a label rather than baring the tree. */
T.crownEnv=function(cx,cy,r,s){ var rx=r*0.9,ry=r*0.85,yc=cy-T.CYC*(s==null?1:s);
  return [cx-rx,yc-ry,cx+rx,yc+ry]; };
T.crownPath=function(cx,cy,r,s){
  var rx=r*0.9,ry=r*0.85,yc=cy-T.CYC*(s==null?1:s);
  return 'M'+P(cx,yc,0,-ry)+' C'+P(cx,yc,rx*0.56,-ry)+' '+P(cx,yc,rx,-ry*0.53)+' '+P(cx,yc,rx,0)+
         ' C'+P(cx,yc,rx,ry*0.53)+' '+P(cx,yc,rx*0.56,ry)+' '+P(cx,yc,0,ry)+
         ' C'+P(cx,yc,-rx*0.56,ry)+' '+P(cx,yc,-rx,ry*0.53)+' '+P(cx,yc,-rx,0)+
         ' C'+P(cx,yc,-rx,-ry*0.53)+' '+P(cx,yc,-rx*0.56,-ry)+' '+P(cx,yc,0,-ry)+' Z';
};

/* thin engraved trunk + forked branches — the bare structure, ALWAYS drawn */
T.structure=function(mk,g,cx,cy,s){
  s=(s==null?1:s);
  g.appendChild(mk('path',{ 'class':'cal-tree-st', fill:'none', stroke:T.TREE,
    'stroke-width':fxw(1.4*s), 'stroke-linecap':'round', 'stroke-linejoin':'round', opacity:'0.82',
    d:'M'+P(cx,cy,0,0)+' L'+P(cx,cy,0,-30*s)+' M'+P(cx,cy,0,-12*s)+' L'+P(cx,cy,-7*s,-22*s)+
      ' M'+P(cx,cy,0,-12*s)+' L'+P(cx,cy,7*s,-22*s)+' M'+P(cx,cy,0,-22*s)+' L'+P(cx,cy,-5*s,-32*s)+
      ' M'+P(cx,cy,0,-22*s)+' L'+P(cx,cy,5*s,-32*s) }));
};
// stroke widths keep their authored literal at s=1 (no gratuitous ".00" drift)
function fxw(v){ return v===Math.round(v*10)/10 ? String(v) : (+v).toFixed(2); }

/* seasonal colour+α crown blob at the fitted radius */
T.crownFill=function(mk,g,cx,cy,r,s,rgb,a){
  g.appendChild(mk('path',{ 'class':'cal-crown', d:T.crownPath(cx,cy,r,s),
    fill:'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')', opacity:a.toFixed(3),
    stroke:T.TREE, 'stroke-width':fxw(0.8*(s==null?1:s)), 'stroke-opacity':'0.5' }));
};

/* r19.1: FULL-opacity snow cap, drawn at the FITTED crown radius (a bare tree —
   boxed or leaf-off winter — needs no cap, so the caller gates on r>0) */
T.snowCap=function(mk,g,cx,cy,r,s){
  var c=r/T.CR, yc=cy-T.CYC*(s==null?1:s);
  g.appendChild(mk('path',{ 'class':'cal-snow', fill:T.SNOW, opacity:'0.95',
    d:'M'+P(cx,yc,-15*c,-3*c)+' Q'+P(cx,yc,-9*c,-15*c)+' '+P(cx,yc,-3*c,-8*c)+
      ' Q'+P(cx,yc,3*c,-17*c)+' '+P(cx,yc,9*c,-9*c)+' Q'+P(cx,yc,14*c,-14*c)+' '+P(cx,yc,15*c,-3*c)+
      ' Q'+P(cx,yc,7*c,1*c)+' '+P(cx,yc,0,-2*c)+' Q'+P(cx,yc,-8*c,1*c)+' '+P(cx,yc,-15*c,-3*c)+' Z' }));
};

/* --spring marks on the crown (scaled to the fitted radius) */
T.blossom=function(mk,g,cx,cy,r,s,a,rv){
  var c=r/T.CR, yc=cy-T.CYC*(s==null?1:s), pos=[[-8,-8],[6,-10],[-2,0],[10,2],[-11,3]], q;
  for(q=0;q<pos.length;q++)
    g.appendChild(mk('circle',{ 'class':'cal-bloom',
      cx:fx(cx+(pos[q][0]+(rv[q]*2-1)*2)*c), cy:fx(yc+(pos[q][1]+(rv[(q+1)%8]*2-1)*2)*c),
      r:fx(2.1*c), fill:T.SPRING, opacity:(0.85*a).toFixed(3) }));
};

/* a few --autumn leaves below the crown. POSITIONS scale to the fitted crown
   (c = r/CR, as authored); the leaf GLYPH scales with the whole tree (s), which
   is 1 at the door — so the door emits its authored literal `q3 -2 5 1 …`
   unchanged, and only a miniature actually shrinks the leaf. */
T.leaves=function(mk,g,cx,cy,r,s,a,rv){
  s=(s==null?1:s);
  var c=r/T.CR, pos=[[-13,-6],[11,-10],[3,-2]], q;
  for(q=0;q<pos.length;q++){
    var lx=cx+(pos[q][0]+(rv[q]*2-1)*3)*c, ly=cy+(pos[q][1]+(rv[(q+2)%8]*2-1)*3)*c;
    g.appendChild(mk('path',{ 'class':'cal-leaf', fill:T.AUTUMN, opacity:(0.9*a).toFixed(3),
      d:'M'+P(lx,ly,0,0)+' q'+fxw(3*s)+' '+fxw(-2*s)+' '+fxw(5*s)+' '+fxw(1*s)+
        ' q'+fxw(-3*s)+' '+fxw(2*s)+' '+fxw(-5*s)+' '+fxw(-1*s)+' Z' }));
  }
};

/* ONE WHOLE TREE, in the front door's exact order and branching — this is the
   composition both callers share, so "what a tree looks like on day D" has a
   single definition. o = {cx,cy,s,crown,bare,foliage:{rgb,a},bloom,turn,snow,rv}
     crown : the FITTED crown radius (0 ⇒ no crown was placeable — draw bare)
     bare  : leaf-off winter (foliage α < 0.08) ⇒ structure only, never a crown
     snow  : truthy ⇒ this tree carries a cap (the caller owns the sparse subset) */
T.tree=function(mk,g,o){
  var s=(o.s==null?1:o.s), r=o.crown, rv=o.rv||[0,0,0,0,0,0,0,0];
  T.structure(mk,g,o.cx,o.cy,s);
  if(!o.bare && r>0){
    T.crownFill(mk,g,o.cx,o.cy,r,s,o.foliage.rgb,o.foliage.a);
    if(o.bloom>0) T.blossom(mk,g,o.cx,o.cy,r,s,o.bloom,rv);
    if(o.turn >0) T.leaves (mk,g,o.cx,o.cy,r,s,o.turn ,rv);
  }
  if(o.snow && r>0) T.snowCap(mk,g,o.cx,o.cy,r,s);
};

if(root) root.TreeArt=T;
// dual-use module guard (forge strips exactly this braced single line)
if (typeof module !== 'undefined' && module.exports) { module.exports = T; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
