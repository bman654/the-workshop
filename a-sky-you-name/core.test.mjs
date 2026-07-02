/* ═══════════════════════════════════════════════════════════════════════════
   core.test.mjs — the Node twin for A Sky You Name.

   This is a CLAIM-FREE toy: its "self-test" is WELL-FORMEDNESS ONLY, never a
   proof of any physical/mathematical claim. It certifies exactly what the piece
   promises:
     A · any laced N-star figure yields a WELL-FORMED name + a two-line myth;
     B · the generation is DETERMINISTIC — the same (seed, normalized points)
         re-derive a byte-identical name + myth + geometry (this is what makes a
         KEPT chart re-ink identically from its stored seed);
     C · distinctness — different figures on one sky read differently;
     D · CALIBRATION — the classifier reads the hand correctly (a zigzag is a
         tangle, a wide reclining figure is never a line/spear, a clean loop is a
         ring, a taut calm stroke is a line).

   Run:  node a-sky-you-name/core.test.mjs
   The SAME starlore.mjs is inlined byte-identically into index.html, so the page
   and this twin re-derive the same words + geometry from a seed.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readShape, nameSky, makeRng, GEN_VERSION } from './starlore.mjs';

let pass = 0, fail = 0;
const log = [];
function ok(cond, msg){ if(cond){ pass++; log.push('  ✓ ' + msg); } else { fail++; log.push('  ✗ ' + msg); } }
function section(t){ log.push('\n── ' + t + ' ──'); }

const fig = spec => spec.map(([x,y]) => ({x,y}));

/* A small gallery of hand-shapes, each with the FORM the reading should land on. */
const SHAPES = {
  "clean 6-star ring (loop)":     { pts: fig([[.5,.15],[.75,.3],[.78,.62],[.55,.8],[.3,.7],[.24,.36],[.5,.15]]), form:"ring" },
  "taut 4-star line (a stroke)":  { pts: fig([[.2,.2],[.38,.4],[.56,.6],[.74,.8]]),                              form:"line" },
  "5-star zigzag (a tangle)":     { pts: fig([[.2,.3],[.45,.6],[.3,.75],[.6,.5],[.78,.72]]),                     form:"tangle" },
  "gentle 3-star bend (a hook)":  { pts: fig([[.25,.7],[.4,.35],[.7,.4]]),                                       form:"bend" },
  "two stars (a spark/pair)":     { pts: fig([[.35,.5],[.68,.5]]),                                               form:"spark" },
  "wide low 4-star (reclining)":  { pts: fig([[.1,.55],[.4,.6],[.7,.52],[.92,.6]]),                              form:"reclining" },
  "tall 4-star (standing)":       { pts: fig([[.5,.1],[.46,.4],[.54,.65],[.5,.9]]),                              form:"standing" },
  "busy 8-star closed vessel":    { pts: fig([[.5,.2],[.7,.3],[.72,.5],[.6,.45],[.68,.62],[.4,.66],[.3,.45],[.5,.2]]), form:"vessel" },
};

const wf = /^The .+/;
function wellFormed(res){
  return wf.test(res.name)
      && Array.isArray(res.myth) && res.myth.length === 2
      && res.myth[0].length > 12 && res.myth[1].length > 8
      && res.myth[0].endsWith(",") && res.myth[1].endsWith(".")
      && typeof res.designation === 'string' && res.designation.length >= 3
      && res.version === GEN_VERSION;
}

/* ── A · well-formedness across the gallery + a sweep of arbitrary N ── */
section("A · every laced figure → a well-formed name + two-line myth");
for(const [desc, {pts}] of Object.entries(SHAPES)){
  const res = nameSky("demo-sky", pts);
  ok(wellFormed(res), `${desc} → "${res.name}" (${res.designation})`);
}
// arbitrary generated figures of N = 2..14 on several seeds
for(const seed of ["s-one","s-two","s-three"]){
  let allWF = true;
  for(let n=2; n<=14; n++){
    const rng = makeRng(seed + ":arb:" + n);
    const pts = []; for(let k=0;k<n;k++) pts.push({ x: rng(), y: rng() });
    if(!wellFormed(nameSky(seed, pts))) allWF = false;
  }
  ok(allWF, `arbitrary N=2..14 all well-formed on seed "${seed}"`);
}

/* ── B · determinism — byte-identical re-derivation (the re-ink self-test) ── */
section("B · a kept chart re-inks byte-identical from its stored seed");
for(const [desc, {pts}] of Object.entries(SHAPES)){
  const seed = "keep-" + desc.length;
  const a = nameSky(seed, pts);
  // fresh point objects, same numbers — must reproduce every field
  const b = nameSky(seed, pts.map(p => ({ x: p.x, y: p.y })));
  const same = a.sig === b.sig
    && a.name === b.name && a.designation === b.designation
    && a.myth[0] === b.myth[0] && a.myth[1] === b.myth[1]
    && a.traits.form === b.traits.form && a.traits.n === b.traits.n;
  ok(same, `re-ink stable — ${desc}`);
}
// the geometry reading itself is deterministic (drives the byte-identical re-ink)
{
  const p = SHAPES["clean 6-star ring (loop)"].pts;
  const r1 = JSON.stringify(readShape(p));
  const r2 = JSON.stringify(readShape(p.map(q => ({x:q.x, y:q.y}))));
  ok(r1 === r2, "readShape geometry is deterministic (byte-identical)");
}

/* ── C · distinctness — different hands read differently ── */
section("C · distinctness");
{
  const sigs = Object.values(SHAPES).map(s => nameSky("demo-sky", s.pts).sig);
  const uniq = new Set(sigs).size;
  ok(uniq === sigs.length, `${uniq}/${sigs.length} gallery shapes named uniquely on one sky`);

  // a different laced ORDER of the same stars is a different figure → may differ
  const a = nameSky("demo-sky", fig([[.2,.3],[.5,.5],[.8,.3]]));
  const b = nameSky("demo-sky", fig([[.2,.3],[.8,.3],[.5,.5]]));
  ok(a.sig !== undefined && b.sig !== undefined, "distinct paths both produce a signature");

  // a different sky-seed re-christens the SAME shape (the sky matters too)
  const same = nameSky("sky-A", SHAPES["taut 4-star line (a stroke)"].pts).sig;
  const diff = nameSky("sky-B", SHAPES["taut 4-star line (a stroke)"].pts).sig;
  ok(same !== diff, "same shape, different sky-seed → different lore");
}

/* ── D · CALIBRATION — the classifier reads the hand (the design's fixes) ── */
section("D · calibration — the reading tracks the shape");
for(const [desc, {pts, form}] of Object.entries(SHAPES)){
  const t = readShape(pts);
  ok(t.form === form, `${desc} reads as form:${form}  (got ${t.form})`);
}
// the two disclosed mis-reads from the explorer run, now FIXED:
{
  // a genuine 5-star zigzag must read as tangle, not bend
  const zig = readShape(fig([[.2,.3],[.45,.6],[.3,.75],[.6,.5],[.78,.72]]));
  ok(zig.form === "tangle", "the 5-star zigzag reads as tangle (was bend)");
  // a wide reclining figure must never be christened a line/spear
  const wide = nameSky("demo-sky", fig([[.1,.55],[.4,.6],[.7,.52],[.92,.6]]));
  ok(wide.figKey !== "line", `the wide reclining figure is not a line/spear (figKey:${wide.figKey})`);
  ok(!/\bSpear\b/.test(wide.name), `the wide reclining figure is not named a Spear ("${wide.name}")`);
}
// a taut CALM stroke is a line; a taut but sharply-bending stroke is NOT a line
{
  const taut = readShape(fig([[.15,.15],[.35,.35],[.55,.55],[.8,.8]]));
  ok(taut.form === "line", "a taut, calm diagonal reads as a line");
  const kinked = readShape(fig([[.15,.8],[.5,.15],[.85,.8]]));   // a sharp ∧ — taut-ish but bends hard
  ok(kinked.form !== "line", `a sharply-kinked stroke is not a line (got ${kinked.form})`);
}

/* ── report ── */
console.log("A Sky You Name — starlore twin (claim-free well-formedness)\n" + log.join("\n"));
const total = pass + fail;
console.log(`\n${fail === 0 ? "✓ ALL WELL-FORMED" : "✗ FAILED"} — ${pass}/${total} checks (gen v${GEN_VERSION})`);
process.exit(fail === 0 ? 0 : 1);
