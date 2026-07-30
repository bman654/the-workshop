/* Dev only — grow a contact sheet of crystals and look at them. Not shipped. */
import { makeCrystal, fall, grow, outline, sixfold, vaporReach, aspect, hexDist } from './snow.mjs';
import { writePNG, contactSheet } from '../tools/png/png.mjs';

const W = Number(process.env.W || 190);

function tile(s, w = W, label = '') {
  const { N, H, att, h, live } = s;
  const R = Math.max(8, Math.min(s.Rlive, Math.ceil(s.rmax * 1.08)));
  const rgba = new Uint8Array(w * w * 4);
  const sc = (2 * R) / w;
  let hmax = 0;
  for (let i = 0; i < N * N; i++) if (att[i] && h[i] > hmax) hmax = h[i];
  for (let py = 0; py < w; py++) for (let px = 0; px < w; px++) {
    const x = (px + 0.5 - w / 2) * sc, y = (py + 0.5 - w / 2) * sc;
    const r = Math.round(y / 0.8660254037844386), q = Math.round(x - r * 0.5);
    const o = (py * w + px) * 4;
    rgba[o] = 8; rgba[o + 1] = 12; rgba[o + 2] = 22; rgba[o + 3] = 255;
    if (hexDist(q, r) > s.Rlive) continue;
    const i = (r + H) * N + (q + H);
    if (!live[i] || !att[i]) continue;
    const v = hmax > 0 ? Math.min(1, h[i] / hmax) : 0.5;
    rgba[o] = Math.round(120 + 135 * v);
    rgba[o + 1] = Math.round(160 + 95 * v);
    rgba[o + 2] = Math.round(200 + 55 * v);
  }
  return { w, h: w, rgba, label };
}

const cases = [];
const arg = process.argv[2] || 'grid';

if (arg === 'grid') {
  // sweep the diagram: temperature across, supersaturation up
  const Ts = [-2, -5, -8, -12, -15, -20, -25, -30];
  const SS = [0.06, 0.13, 0.22];
  for (const ss of SS) for (const T of Ts) {
    const s = makeCrystal(261, 7);
    grow(s, 4200, T, ss);
    const o = outline(s), a = aspect(s);
    cases.push({ tile: tile(s), text: `T=${T} ss=${ss} r=${s.rmax} rug=${o.ruggedness.toFixed(2)} h=${a.maxH.toFixed(1)} steps=${s.steps}` });
  }
  console.log(cases.map(c => c.text).join('\n'));
  writePNG('/tmp/snow-grid.png', contactSheet(cases.map(c => c.tile), 8, 5));
  console.log('wrote /tmp/snow-grid.png');
} else if (arg === 'falls') {
  const { FALLS } = await import('./snow.mjs');
  for (const f of FALLS) {
    const s = makeCrystal(361, 11);
    fall(s, f.pts, 5200);
    const o = outline(s), a = aspect(s), sf = sixfold(s), vr = vaporReach(s);
    cases.push({ tile: tile(s, 240), text: `${f.name}: r=${s.rmax} rug=${o.ruggedness.toFixed(2)} maxH=${a.maxH.toFixed(1)} 6f=${sf.toFixed(4)} tip/notch=${vr.ratio.toFixed(2)} steps=${s.steps}` });
  }
  console.log(cases.map(c => c.text).join('\n'));
  writePNG('/tmp/snow-falls.png', contactSheet(cases.map(c => c.tile), 3, 6));
  console.log('wrote /tmp/snow-falls.png');
} else if (arg === 'control') {
  for (const uniform of [false, true]) {
    const s = makeCrystal(261, 3);
    grow(s, 5000, -15, 0.23, { uniform });
    const o = outline(s);
    cases.push({ tile: tile(s, 240), text: `uniform=${uniform} r=${s.rmax} rug=${o.ruggedness.toFixed(3)} area=${o.area}` });
  }
  console.log(cases.map(c => c.text).join('\n'));
  writePNG('/tmp/snow-control.png', contactSheet(cases.map(c => c.tile), 2, 6));
  console.log('wrote /tmp/snow-control.png');
}
