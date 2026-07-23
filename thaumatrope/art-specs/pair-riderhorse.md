# Forged engraving — the RIDER ↔ HORSE pair (The Thaumatrope)

Third card. A rider (front) that lands seated on a horse (back) when whirled — the
jockey-and-mount thaumatrope, a period favourite.

## Art direction
- Same warm ink-on-parchment ENGRAVING hand as the other two cards (see
  `pair-birdcage.md` for the shared style contract).
- **Rider (front face):** a small human figure in a seated/riding posture — legs
  parted to straddle, torso upright, arms forward as if holding reins, a cap or hat.
  Drawn so the seat + parted legs sit where the horse's back + flanks will be.
  Central footprint, feet around y≈230–250, head around y≈110.
- **Horse (back face):** a horse in side profile, standing/striding — barrel body,
  arched neck and head to one side, four legs, a tail. Its back (the saddle line)
  should run through the vertical centre at the height where the rider's seat lands.
  The fused frame should read "the rider is *mounted*."

## REGISTRATION (a touch more care than the other two)
- 360×360 faces, spin axis = vertical centre line x=180. The KEY alignment: the
  rider's seat/hips must land on the horse's back. Place the rider's hip line and the
  horse's saddle line at the SAME (x≈180, y≈200–220), so the fused figure sits
  correctly rather than floating above or sinking through the horse.
- The rider's parted legs should straddle down over the horse's near flank/belly.
- The BACK face (the horse) is authored ALREADY-MIRRORED (renderer flips the back
  about x=180). The horse's head is asymmetric, so **pre-mirror it yourself**: draw
  the horse so that AFTER a horizontal flip about x=180 the head points the way you
  intend and the saddle line still crosses x=180 at the rider's seat height. (Simplest
  robust approach: keep the horse's back roughly level across the centre so the flip
  doesn't shift the seat point.)
- Paint an opaque parchment fill first; keep ink off the extreme 8 px margins.

## API the candidate MUST expose
```js
window.installThaumArt = function (A) {
  A.setPair('riderhorse', drawRider, drawHorse);   // front, back(pre-mirrored)
  return 'riderhorse';
};
(window.ThaumArt = window.ThaumArt || {}).riderhorse = { a: drawRider, b: drawHorse };
function drawRider(ctx){ /* 360x360: parchment fill, then ink the rider */ }
function drawHorse(ctx){ /* 360x360: parchment fill, then ink the horse (pre-mirrored) */ }
```
Same `ctx` contract as the other specs.

## Wiring & preview
Synth installs the winner at `thaumatrope/art/riderhorse.js`; wiring builder
forge:includes it before `faces.js`. Preview with
`bash thaumatrope/art-specs/preview-harness.sh <candidate.js> <outdir> <port>`.
Pay special attention to the seat-on-back registration in the fused preview.
